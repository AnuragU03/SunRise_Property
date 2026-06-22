import { NextRequest, NextResponse } from 'next/server'
import { runAgent } from '@/lib/runAgent'
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
import { ObjectId } from 'mongodb'
import { tryAcquireLeadLock } from '@/lib/services/leadLockService'
import { checkAndFireReengage } from '@/lib/services/reengagerService'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/re-engage
 * The Re-engager — daily 11:00 IST
 *
 * Dual-path:
 *  A) Leads WITH structured visit data (G7) → checkAndFireReengage (uses REENGAGE assistant)
 *  B) Legacy cold leads WITHOUT visit data → GPT-4o transcript analysis → triggerCampaignCall (OUTBOUND assistant)
 */
export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { runId, output } = await runAgent({
      agentId: 'dead_lead_reengager',
      agentName: 'The Re-engager',
      trigger: 'cron',
      input: {
        cron_job: 're-engage',
        trigger_time: new Date().toISOString(),
      },
      metadata: { cron_type: 'scheduled', frequency: 'daily_11_IST' },

      handler: async (ctx) => {
        const now = new Date()
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
        const REENGAGE_INTERVAL_DAYS = parseInt(process.env.REENGAGE_INTERVAL_DAYS || '60', 10)
        const intervalAgo = new Date(now.getTime() - REENGAGE_INTERVAL_DAYS * 24 * 60 * 60 * 1000)

        await ctx.think('evaluation',
          `Scanning for re-engagement candidates. Path A: warm/cold leads with visit data and no re-engage in ${REENGAGE_INTERVAL_DAYS} days. Path B: cold/not_interested leads dormant 60+ days (legacy).`,
          { confidence: 1.0, metadata: { cutoff_date: sixtyDaysAgo.toISOString(), interval_days: REENGAGE_INTERVAL_DAYS } }
        )

        // ── Path A: G7 leads with structured visit data ────────────────────
        const g7Candidates = await ctx.db.findMany('leads', {
          dnd_status: { $ne: true },
          is_deleted: { $ne: true },
          status: { $in: ['warm', 'cold'] },
          last_visit_property_id: { $exists: true, $ne: null },
          last_visit_date: { $exists: true, $ne: null },
          last_visit_type: { $exists: true, $ne: null },
          $or: [
            { last_reengage_attempted_at: null },
            { last_reengage_attempted_at: { $exists: false } },
            { last_reengage_attempted_at: { $lt: intervalAgo } },
          ],
        })
        const g7Batch = (g7Candidates as any[]).slice(0, 30)

        // ── Path A2: WARM leads without digitized history (the broker's 5000) ──
        // These are the primary re-engage population. No visit data, but a known
        // relationship → generic warm playbook via checkAndFireReengage.
        const warmCandidates = await ctx.db.findMany('leads', {
          dnd_status: { $ne: true },
          is_deleted: { $ne: true },
          status: { $nin: ['closed', 'lost', 'not_interested', 'wrong_number', 'booked'] },
          $and: [
            { $or: [
              { is_warm_lead: true },
              { source: 'broker_warm_list' },
            ]},
            // exclude the ones already handled by Path A (they have visit data)
            { $or: [
              { last_visit_property_id: { $exists: false } },
              { last_visit_property_id: null },
            ]},
            { $or: [
              { last_reengage_attempted_at: null },
              { last_reengage_attempted_at: { $exists: false } },
              { last_reengage_attempted_at: { $lt: intervalAgo } },
            ]},
          ],
        })
        const warmBatch = (warmCandidates as any[]).slice(0, 30)

        // ── Path B: Legacy cold leads without visit data ──────────────────
        const legacyCandidates = await ctx.db.findMany('leads', {
          dnd_status: { $ne: true },
          is_deleted: { $ne: true },
          status: { $in: ['cold', 'not_interested'] },
          $or: [
            { last_visit_property_id: { $exists: false } },
            { last_visit_property_id: null },
          ],
          $and: [
            { $or: [
              { last_contacted_at: { $lte: sixtyDaysAgo } },
              { last_contacted_at: { $exists: false }, updated_at: { $lte: sixtyDaysAgo } },
            ]}
          ],
        })
        const legacyBatch = (legacyCandidates as any[]).slice(0, 20)

        await ctx.think('decision',
          `Found ${g7Batch.length} visit-data + ${warmBatch.length} generic-warm + ${legacyBatch.length} legacy cold leads.`,
          { confidence: 1.0, metadata: { g7_count: g7Batch.length, warm_count: warmBatch.length, legacy_count: legacyBatch.length } }
        )

        let triggeredCount = 0
        const lead_details: Array<Record<string, any>> = []

        // ── Process G7 (personalized) + warm (generic) leads via reengagerService ──
        // Same entry point; checkAndFireReengage picks personalized vs generic mode.
        for (const lead of [...g7Batch, ...warmBatch]) {
          const path = lead.last_visit_property_id ? 'g7' : 'warm'
          try {
            const result = await checkAndFireReengage(String(lead._id), ctx)
            if (result.ok) {
              triggeredCount++
              lead_details.push({ lead_id: String(lead._id), lead_name: lead.name, status: 'triggered', path, call_id: result.call_id })
              await new Promise((r) => setTimeout(r, 30000)) // 30-sec stagger
            } else {
              lead_details.push({ lead_id: String(lead._id), lead_name: lead.name, status: 'skipped', path, reason: result.reason })
            }
          } catch (err: any) {
            lead_details.push({ lead_id: String(lead._id), lead_name: lead.name, status: 'error', path, error: err.message })
          }
        }

        // ── Process legacy leads via GPT-4o + triggerCampaignCall ─────────
        for (const lead of legacyBatch) {
          const leadId = String(lead._id)
          const leadObjectId = new ObjectId(leadId)

          const lastCallResults = await ctx.db.findMany('calls', {
            lead_id: leadId,
            transcript: { $exists: true, $ne: null },
          })
          const lastCall = (lastCallResults as any[]).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
          const transcriptSnippet = lastCall?.transcript ? String(lastCall.transcript).slice(0, 1200) : null

          let reEngageContext = 'General friendly check-in — acknowledge previous conversation and ask if they are back in the market.'
          if (transcriptSnippet) {
            const gptResult = await ctx.openai.chat({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: 'You are a real-estate sales coach. Given a past call transcript, write a SHORT (2-3 sentence) re-engagement talking-point for a sales agent. Acknowledge their previous concern, note circumstances may have changed, keep warm and non-pushy. Plain text only.' },
                { role: 'user', content: `Lead: ${lead.name}\nStatus: ${lead.status}\nTranscript:\n${transcriptSnippet}` },
              ],
              temperature: 0.4,
              max_tokens: 200,
            })
            reEngageContext = gptResult.content.trim()
          }

          const cooldownMins = parseInt(process.env.OUTBOUND_COOLDOWN_MINUTES || '240')
          if (await leadHasRecentOutboundCall(leadObjectId, cooldownMins)) {
            lead_details.push({ lead_id: leadId, lead_name: lead.name, status: 'cooldown_skipped', path: 'legacy' })
            continue
          }

          const lockAcquired = await tryAcquireLeadLock(leadId, 're_engage', 'Legacy re-engagement call')
          if (!lockAcquired) {
            lead_details.push({ lead_id: leadId, lead_name: lead.name, status: 'lock_conflict', path: 'legacy' })
            continue
          }

          const result = await ctx.voice.triggerCampaignCall(
            { phone: lead.phone, name: lead.name, budget_range: lead.budget_range, location_pref: lead.location_pref, property_type: lead.property_type, notes: lead.notes },
            { campaign_name: 'Dead Lead Re-engagement', script_template: reEngageContext }
          )

          if (result.success) {
            await ctx.db.updateOne(
              'calls',
              { voice_call_id: result.voiceCallId || result.callId },
              {
                $set: {
                  lead_id: leadId,
                  lead_name: lead.name,
                  lead_phone: lead.phone,
                  agent_name: 'The Re-engager (Legacy)',
                  agent_id: 'dead_lead_reengager',
                  campaign_id: 'auto-re-engage',
                  call_type: 're_engagement',
                  disposition: 'queued',
                  call_outcome: 'pending',
                  updated_at: new Date(),
                },
              }
            )
            await ctx.db.updateOne('leads', { _id: lead._id }, {
              $set: { last_contacted_at: now, updated_at: now, status: 'contacted' },
            })
            triggeredCount++
            lead_details.push({ lead_id: leadId, lead_name: lead.name, status: 'triggered', path: 'legacy', voice_call_id: result.voiceCallId || result.callId, room_name: result.roomName })
          } else {
            lead_details.push({ lead_id: leadId, lead_name: lead.name, status: 'failed', path: 'legacy', error: result.error })
          }

          await new Promise((r) => setTimeout(r, 30000)) // 30-sec stagger
        }

        const totalScanned = g7Batch.length + warmBatch.length + legacyBatch.length
        await ctx.think('result_analysis',
          `Processed ${totalScanned} leads (${g7Batch.length} G7 + ${legacyBatch.length} legacy). Triggered ${triggeredCount} call(s).`,
          { confidence: 0.95, metadata: { triggered: triggeredCount, total: totalScanned } }
        )

        return {
          triggered_calls: triggeredCount,
          total_scanned: totalScanned,
          g7_candidates: g7Batch.length,
          legacy_candidates: legacyBatch.length,
          lead_details,
          summary: `Triggered ${triggeredCount} re-engagement call(s) from ${totalScanned} candidates (${g7Batch.length} visit-data + ${legacyBatch.length} legacy).`,
        }
      },
    })

    return NextResponse.json({
      success: true,
      runId,
      triggered: (output as any)?.triggered_calls ?? 0,
      total_due: (output as any)?.total_scanned ?? 0,
      g7_candidates: (output as any)?.g7_candidates ?? 0,
      legacy_candidates: (output as any)?.legacy_candidates ?? 0,
      summary: (output as any)?.summary ?? '',
    })

  } catch (error: any) {
    console.error('[Cron/ReEngage] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Re-engager run failed', run_id: error?.runId },
      { status: 500 }
    )
  }
}
