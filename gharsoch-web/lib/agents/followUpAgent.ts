import { runAgent } from '@/lib/runAgent'
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { tryAcquireLeadLock } from '@/lib/services/leadLockService'

/**
 * The Follow-Up Agent — scans leads whose next_follow_up_date is due and triggers
 * voice callback calls with inherited property context (Z12 multi-source resolution).
 *
 * Extracted from app/api/cron/follow-up/route.ts so the agent has a reusable runner
 * (parity with runMatchmaker / runAppointmentGuardian) that both the cron route and
 * the orchestrator can invoke. Behaviour is unchanged.
 */
export async function runFollowUpAgent(): Promise<{ runId: string; output?: any }> {
  return runAgent({
    agentId: '69e8f709f89cad5d4b752d24',
    agentName: 'The Follow-Up Agent',
    trigger: 'cron',
    input: { cron_job: 'follow-up', trigger_time: new Date().toISOString() },
    metadata: { cron_type: 'scheduled', frequency: 'hourly' },
    handler: async (ctx) => {
      const now = new Date()

      await ctx.think('evaluation', `Scanning for due follow-ups. Current time: ${now.toISOString()}`, {
        confidence: 1.0,
      })

      const dueFollowUps = await ctx.db.findMany('leads', {
        status: 'follow_up',
        dnd_status: { $ne: true },
        is_deleted: { $ne: true },
        next_follow_up_date: { $lte: now },
      })

      await ctx.think('evaluation', `Found ${dueFollowUps.length} leads due for follow-up`, {
        confidence: 1.0,
        metadata: { leads_count: dueFollowUps.length },
      })

      if (dueFollowUps.length === 0) {
        await ctx.db.insertOne('agent_logs', {
          agent_name: 'The Follow-Up Agent',
          action: 'Scan complete. No follow-ups are due at this time.',
          status: 'success',
          created_at: new Date(),
        })

        return { triggered_calls: 0, total_scanned: 0, message: 'No due follow-ups' }
      }

      let triggeredCount = 0
      const lead_details: any[] = []

      for (const lead of dueFollowUps as any[]) {
        const leadEvaluation = {
          lead_id: lead._id?.toString?.() || String(lead._id),
          lead_name: lead.name,
          status: lead.status,
          interest_level: lead.interest_level,
          budget_range: lead.budget_range,
          location_pref: lead.location_pref,
          follow_up_count: lead.follow_up_count || 0,
        }

        await ctx.think('evaluation', `Evaluating lead: ${lead.name} (ID: ${leadEvaluation.lead_id})`, {
          confidence: 0.95,
          metadata: leadEvaluation,
        })

        const lockAcquired = await tryAcquireLeadLock(leadEvaluation.lead_id, 'follow_up', 'Executing follow-up call')
        if (!lockAcquired) {
          await ctx.db.insertOne('agent_logs', {
            agent_name: 'cron_lock_conflict',
            action: `Skipping follow-up for ${lead.name} due to lock conflict.`,
            status: 'skipped',
            created_at: new Date(),
          })
          lead_details.push({
            lead_id: leadEvaluation.lead_id,
            lead_name: lead.name,
            status: 'lock_conflict_skipped',
          })
          continue
        }

        const cooldownMins = parseInt(process.env.OUTBOUND_COOLDOWN_MINUTES || '240')
        if (await leadHasRecentOutboundCall(new ObjectId(leadEvaluation.lead_id), cooldownMins, { source: 'follow_up_callback' })) {
          await ctx.act('cooldown_skip', `Skipping follow-up call for ${lead.name}`, {
            parameters: {
              lead_id: leadEvaluation.lead_id,
              reason: `Lead contacted within ${cooldownMins}m cooldown window`,
            },
          })
          lead_details.push({
            lead_id: leadEvaluation.lead_id,
            lead_name: lead.name,
            status: 'cooldown_skipped',
            reason: `Lead contacted within ${cooldownMins}m cooldown window`,
          })
          continue
        }

        console.log(
          '[FOLLOWUP CRON] Calling lead',
          lead._id?.toString?.() || String(lead._id),
          'through voice runtime',
        )

        const callsCol = await getCollection('calls')
        const propsCol = await getCollection('properties')

        // Z12: Resolve matched_property_id from multiple sources.
        // The matchmaker stores lead_id on calls as a string (not ObjectId),
        // so a direct query with lead._id (ObjectId) silently returns 0 results.
        // Defense-in-depth: try call inheritance with $or for both types,
        // then fall back to reading lead.matched_property_id directly.
        let inheritedPropertyId: string | null = null
        let inheritedPropertyTitle: string | null = null

        const priorCall = await callsCol.findOne(
          {
            $or: [
              { lead_id: lead._id },
              { lead_id: lead._id?.toString?.() || String(lead._id) },
            ],
            direction: 'outbound',
            matched_property_id: { $exists: true, $ne: null },
          },
          { sort: { created_at: -1 } }
        )

        if (priorCall) {
          inheritedPropertyId = priorCall.matched_property_id
          inheritedPropertyTitle = priorCall.matched_property_title || null
        }

        if (!inheritedPropertyId && lead.matched_property_id) {
          inheritedPropertyId = lead.matched_property_id
          inheritedPropertyTitle = lead.matched_property_title || null
        }

        if (!inheritedPropertyId) {
          console.warn(`[follow-up cron] No matched_property_id found for lead ${lead._id} — callback will lack property context`)
        }

        const inheritedProperty = inheritedPropertyId
          ? await propsCol.findOne({ _id: new ObjectId(inheritedPropertyId.toString()), is_deleted: { $ne: true } })
          : null

        const lastCall = await callsCol.findOne(
          {
            $or: [
              { lead_id: lead._id },
              { lead_id: lead._id?.toString?.() || String(lead._id) },
            ],
            direction: 'outbound',
          },
          { sort: { created_at: -1 } }
        )

        const result = await ctx.voice.triggerCallbackCall({
          phone: lead.phone,
          name: lead.name,
          variables: {
            call_purpose: 'callback',
            customer_name: lead.name || 'there',
            property_type: lead.property_type || 'properties',
            location_pref: lead.location_pref || 'your preferred area',
            budget_range: lead.budget_range || '',
            prior_topic: lastCall?.call_summary || lead.notes || 'properties you discussed earlier',
            matched_property_id: inheritedPropertyId || '',
            matched_property_title: inheritedPropertyTitle || inheritedProperty?.title || '',
            matched_property_location: inheritedProperty?.location || '',
          },
        })

        if (result.success) {
          await ctx.act('outbound_call_trigger', `Triggered follow-up call for ${lead.name}`, {
            parameters: { lead_id: leadEvaluation.lead_id, phone: lead.phone },
            result: { voice_call_id: result.voiceCallId || result.callId, room_name: result.roomName, call_triggered: true },
          })

          await ctx.db.updateOne(
            'calls',
            { voice_call_id: result.voiceCallId || result.callId },
            {
              $set: {
                lead_id: leadEvaluation.lead_id,
                lead_name: lead.name,
                lead_phone: lead.phone,
                agent_name: 'Follow-Up Callback',
                agent_id: 'follow_up_agent',
                campaign_id: 'auto-follow-up',
                call_type: 'follow_up_callback',
                matched_property_id: inheritedPropertyId || null,
                matched_property_title: inheritedPropertyTitle || inheritedProperty?.title || null,
                disposition: 'queued',
                call_outcome: 'pending',
                updated_at: new Date(),
              },
            }
          )

          await ctx.db.updateOne(
            'leads',
            { _id: lead._id },
            {
              $set: { status: 'contacted', updated_at: new Date() },
              $unset: { next_follow_up_date: '' },
            }
          )

          lead_details.push({
            lead_id: leadEvaluation.lead_id,
            lead_name: lead.name,
            status: 'triggered',
            recommendation: 'Call queued for immediate execution',
          })

          triggeredCount++
        } else {
          await ctx.act('outbound_call_trigger', `Failed to trigger follow-up call for ${lead.name}`, {
            parameters: { lead_id: leadEvaluation.lead_id, phone: lead.phone },
            error: result.error || 'voice call trigger failed',
          })

          lead_details.push({
            lead_id: leadEvaluation.lead_id,
            lead_name: lead.name,
            status: 'failed',
            reason: result.error || 'voice call trigger failed',
          })
        }

        // Delay slightly between calls to avoid hitting voice runtime rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      await ctx.think(
        'result_analysis',
        `Successfully triggered ${triggeredCount} out of ${dueFollowUps.length} follow-up calls`,
        { confidence: 0.95, metadata: { triggered: triggeredCount, total: dueFollowUps.length } }
      )

      await ctx.db.insertOne('agent_logs', {
        agent_name: 'The Follow-Up Agent',
        action: `Scanned ${dueFollowUps.length} due follow-ups. Triggered ${triggeredCount} calls.`,
        status: 'success',
        created_at: new Date(),
        details: lead_details,
      })

      return {
        triggered_calls: triggeredCount,
        total_scanned: dueFollowUps.length,
        lead_details,
        message: `Triggered ${triggeredCount} follow-up calls`,
      }
    },
  })
}
