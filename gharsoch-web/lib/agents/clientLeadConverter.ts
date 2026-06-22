import { runAgent } from '@/lib/runAgent'
import { createLead } from '@/lib/services/leadService'
import { ObjectId } from 'mongodb'

export async function runClientLeadConverter(clientId: string): Promise<{ runId: string; lead_id?: string; rejected?: boolean; reason?: string; score?: number; rationale?: string }> {
  const { runId, output } = await runAgent({
    agentId: 'client_lead_converter',
    agentName: 'Client → Lead Converter',
    trigger: 'event',
    input: { client_id: clientId },
    handler: async (ctx) => {
      await ctx.think('evaluation', `Loading client ${clientId} for qualification`)
      const client = await ctx.db.findOne('clients', { _id: new ObjectId(clientId) })
      if (!client) throw new Error('Client not found')

      // Hard gate: only a contactable phone is truly required. This is a
      // COLD-CALL CRM — the AI agent calls the lead to GATHER budget/timeline/
      // requirements, so missing those is the REASON to call, never a reason to
      // reject. We only throw away genuinely unusable records (no phone).
      if (!client.phone) {
        await ctx.think('decision', 'No phone number → cannot contact → rejecting')
        await ctx.db.updateOne('clients', { _id: client._id }, { $set: { conversion_status: 'rejected', conversion_reason: 'no_phone', updated_at: new Date() } })
        await ctx.act('client_rejected', 'No phone', { parameters: { client_id: clientId, reason: 'no_phone' } })
        return {
          rejected: true,
          reason: 'no_phone',
          summary: 'Rejected: no contactable phone number.',
          lead_details: [{ lead_name: client.name, status: 'rejected', recommendation: 'Add a phone number' }],
        }
      }

      // GPT-4o lead-score — readiness signal only, NOT a completeness gate.
      await ctx.think('decision', 'Calling gpt-4o for lead scoring (cold-call model)')
      const gptResult = await ctx.openai.chat({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You score a real-estate lead for a COLD-CALL CRM where an AI agent will phone the person to collect any missing details (budget, timeline, exact requirement). ' +
              'Therefore missing budget/timeline/notes is EXPECTED and must NOT lower the score much — the call exists to gather them. ' +
              'Score 0-100 on genuine intent + contactability: a real person with a phone and any property interest (buy/rent, a config like 1BHK, or an area) scores 55-80. ' +
              'Score below 40 (qualified=false) ONLY for genuinely unusable records: obvious test/spam/junk data, gibberish names, or an explicit "not interested / do not contact". ' +
              'Return JSON {score:number, rationale:string, qualified:boolean}. qualified=true when score >= 40.',
          },
          { role: 'user', content: JSON.stringify(client) },
        ],
      })
      const parsed = JSON.parse(gptResult.content)
      // Belt-and-suspenders: respect score>=40 even if the model sets qualified inconsistently.
      const isQualified = parsed.qualified === true || (typeof parsed.score === 'number' && parsed.score >= 40)

      if (!isQualified) {
        await ctx.db.updateOne('clients', { _id: client._id }, { $set: { conversion_status: 'rejected', conversion_reason: parsed.rationale, lead_score: parsed.score, updated_at: new Date() } })
        await ctx.act('client_rejected', 'Failed qualification', { parameters: { client_id: clientId, score: parsed.score } })
        return { 
          rejected: true, 
          reason: parsed.rationale, 
          score: parsed.score,
          summary: parsed.rationale,
          lead_details: [{ lead_name: client.name, status: 'rejected', recommendation: parsed.rationale }]
        }
      }

      // Create Lead from Client
      if (!client.broker_id) {
        console.error(`[clientLeadConverter] client ${client._id} has no broker_id — cannot create lead`)
        return { ok: false, rejected: true, reason: 'client_missing_broker', error: 'Client missing broker_id' }
      }

      const result = await createLead({
        broker_id: client.broker_id,
        client_id: client._id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        location_pref: client.location_pref,
        property_type: client.property_type,
        budget_range: client.budget_range,
        notes: client.notes,
        // Requirement spec rides client → lead so the voice agent can qualify against it
        ...(client.purpose ? { purpose: client.purpose } : {}),
        ...(client.min_carpet_sqft != null ? { min_carpet_sqft: client.min_carpet_sqft } : {}),
        ...(client.facing_pref ? { facing_pref: client.facing_pref } : {}),
        ...(client.area_reason ? { area_reason: client.area_reason } : {}),
        ...(client.is_warm_lead ? { is_warm_lead: true } : {}),
        source: client.source ?? 'client_converter',
        interest_level: parsed.score >= 75 ? 'hot' : parsed.score >= 60 ? 'warm' : 'cold',
        lead_score: parsed.score,
        qualification_rationale: parsed.rationale,
        qualification_status: 'pending',
        status: 'new',
        dnd_status: false,
        // G7: forward engagement fields — triggers re-engage call via leadService.create
        ...(client.last_visit_type && client.last_visit_property_id && client.last_visit_date ? {
          last_visit_type: client.last_visit_type,
          last_visit_property_id: client.last_visit_property_id,
          last_visit_date: client.last_visit_date,
          last_visit_property: client.last_visit_property || '',
          last_visit_summary: client.last_visit_summary || '',
        } : {}),
      })

      if (!result.ok) {
        console.error(`[clientLeadConverter] createLead failed: ${result.reason}`)
        return { ok: false, rejected: true, reason: result.reason, error: 'Lead creation failed' }
      }

      const leadId = result.lead_id as ObjectId

      await ctx.db.updateOne('clients', { _id: client._id }, { $set: { conversion_status: 'converted', lead_id: leadId, lead_score: parsed.score, updated_at: new Date() } })
      await ctx.act('lead_created', 'Lead qualified and created', { parameters: { lead_id: leadId.toString(), client_id: clientId, score: parsed.score } })

      console.log(`[clientLeadConverter] Converted client ${client._id} → lead ${leadId}`)
      console.log(`[clientLeadConverter] Score: ${parsed.score}, has_visit_history: ${!!client.last_visit_type}`)
      
      if (client.last_visit_type) {
        console.log(`[clientLeadConverter] Re-engager will auto-fire via leadService.create() hook`)
        console.log(`[clientLeadConverter] Matchmaker will skip for 4hrs due to reengage gate`)
      } else if (client.is_warm_lead) {
        // Warm relationship, no visit history → generic warm re-engage call, NOT
        // cold matchmaker prospecting. Gated by the auto_fire_warm_calls setting:
        // when off, the lead waits for the daily re-engage cron / manual Start Call.
        try {
          const { getSystemConfig } = await import('@/lib/services/systemConfigService')
          const cfg = await getSystemConfig()
          if (cfg.auto_fire_warm_calls) {
            const { dispatchEvent } = await import('@/lib/orchestrator')
            dispatchEvent({ type: 'lead.created', leadId: leadId.toString(), isWarm: true })
          } else {
            console.log('[clientLeadConverter] auto_fire_warm_calls off — warm lead queued for cron/manual')
          }
        } catch (err) {
          console.error('[clientLeadConverter] warm lead.created dispatch failed:', (err as Error).message)
        }
      } else {
        // Fresh COLD lead: emit lead.qualified — the orchestrator's confidence gate
        // decides whether the matchmaker dials now or nurture keeps it.
        try {
          const { dispatchEvent } = await import('@/lib/orchestrator')
          dispatchEvent({ type: 'lead.qualified', leadId: leadId.toString(), score: parsed.score })
        } catch (err) {
          console.error('[clientLeadConverter] lead.qualified dispatch failed:', (err as Error).message)
        }
      }

      await ctx.think('result_analysis', `Converted client ${client.name} → lead ${leadId} with score ${parsed.score}. Routed via orchestrator lead.qualified (confidence gate).`)

      return { 
        lead_id: leadId.toString(), 
        score: parsed.score, 
        rationale: parsed.rationale,
        summary: parsed.rationale,
        lead_details: [
          {
            lead_name: client.name,
            status: 'converted',
            recommendation: parsed.rationale,
          }
        ]
      }
    }
  })
  return { runId, ...(output as any) }
}
