import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { runAgent, type AgentRunContext } from '@/lib/runAgent'
import { tryAcquireLeadLock, releaseLeadLock } from './leadLockService'
import { leadHasRecentOutboundCall } from './callService'
import { hasVisitHistory, isWarmLead } from '@/lib/orchestrator/rules'
import { getSystemConfig, formatGenericInventoryPitch } from './systemConfigService'

const DB_NAME = process.env.MONGODB_DB || 'test'
const REENGAGE_INTERVAL_DAYS = parseInt(process.env.REENGAGE_INTERVAL_DAYS || '60', 10)

export interface ReengageResult {
  ok: boolean
  reason?: string
  call_id?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatVisitDateHuman(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatNowIST(): string {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// ── Eligibility Check ──────────────────────────────────────────────────────

/**
 * Pure eligibility check — no side effects.
 * Exported for use in cron sweep.
 */
export async function checkEligibility(lead: any): Promise<{ eligible: boolean; reason?: string }> {
  if (lead.dnd_status || lead.dnc_flag) {
    return { eligible: false, reason: 'dnc_blocked' }
  }

  if (lead.status === 'closed' || lead.status === 'lost' || lead.status === 'not_interested') {
    return { eligible: false, reason: 'lead_terminal_status' }
  }

  // The re-engager now serves BOTH personalized (visit history) and generic-warm
  // leads. Eligible if either applies; only fully-cold leads with no relationship
  // fall through to the matchmaker instead.
  if (!hasVisitHistory(lead) && !isWarmLead(lead)) {
    return { eligible: false, reason: 'not_warm_no_history' }
  }

  // Source-aware cooldown — only checks reengage-type calls, not matchmaker/campaign
  const leadObjId = new ObjectId(String(lead._id))
  const recentCall = await leadHasRecentOutboundCall(leadObjId, 240, { source: 're_engager' })
  if (recentCall) {
    return { eligible: false, reason: 'cooldown_active' }
  }

  // 60-day interval check
  if (lead.last_reengage_attempted_at) {
    const daysSinceLastReengage = Math.floor(
      (Date.now() - new Date(lead.last_reengage_attempted_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceLastReengage < REENGAGE_INTERVAL_DAYS) {
      return { eligible: false, reason: `reengage_interval_not_met_${daysSinceLastReengage}d` }
    }
  }

  return { eligible: true }
}

// ── Core Trigger ───────────────────────────────────────────────────────────

/**
 * Eligibility check + auto-fire re-engage call.
 * Called from: leadService.create() (on-add) AND /api/cron/re-engage (daily sweep).
 *
 * Observability contract — matches the other agents:
 *  - When invoked inside an existing agent run (cron passes its `ctx`), the
 *    call/db work is routed through that run's wrappers so it appears in the
 *    same execution trace as Path B.
 *  - When invoked standalone (lead-create), it self-wraps in its own
 *    `runAgent` event-trigger, exactly like the Matchmaker does. Eligibility
 *    is checked first so skipped leads do not spawn empty agent runs.
 */
export async function checkAndFireReengage(
  leadId: string,
  parentCtx?: AgentRunContext
): Promise<ReengageResult> {
  const client = await clientPromise
  const leadsCol = client.db(DB_NAME).collection('leads')

  let lead: any = null
  try {
    lead = await leadsCol.findOne({ _id: new ObjectId(leadId) })
  } catch {
    lead = await leadsCol.findOne({ _id: leadId as any })
  }

  if (!lead) return { ok: false, reason: 'lead_not_found' }

  const eligibility = await checkEligibility(lead)
  if (!eligibility.eligible) {
    return { ok: false, reason: eligibility.reason }
  }

  // Eligible → fire. Reuse the caller's agent run when present, otherwise
  // run as our own traceable event-triggered agent (like the Matchmaker).
  if (parentCtx) {
    return fireReengage(parentCtx, lead)
  }

  const { output } = await runAgent<{ lead_id: string }, ReengageResult>({
    agentId: 'dead_lead_reengager',
    agentName: 'The Re-engager',
    trigger: 'event',
    input: { lead_id: leadId },
    metadata: { trigger_type: 'event', sub_path: 'g7_reengage', source: 'on_create' },
    handler: async (ctx) => fireReengage(ctx, lead),
  })

  return output ?? { ok: false, reason: 'agent_no_output' }
}

/**
 * Performs the actual re-engage dispatch through the agent run wrappers so the
 * call trigger, db writes, and reasoning are visible in the execution trace.
 */
async function fireReengage(ctx: AgentRunContext, lead: any): Promise<ReengageResult> {
  const leadIdStr = lead._id.toString()

  // Lead lock — prevents matchmaker / follow-up from competing
  const lock = await tryAcquireLeadLock(
    leadIdStr,
    're_engage',
    `Auto-fire re-engage for ${lead.last_visit_type} on ${lead.last_reengage_attempted_at ? 'cron sweep' : 'lead create'}`
  )
  if (!lock) {
    await ctx.think('constraint_check', `Lead ${leadIdStr} is locked by another agent — skipping re-engage.`, { confidence: 1.0 })
    return { ok: false, reason: 'locked_by_other_cron' }
  }

  try {
    // Resolve broker info
    const broker = lead.broker_id
      ? await ctx.db.findOne<any>('users', { _id: new ObjectId(lead.broker_id) }).catch(() => null)
      : null
    const brokerName = broker?.name || 'Aapka broker'
    const brokerPhone = broker?.phone || ''

    // Two modes: PERSONALIZED (real visit history) vs GENERIC WARM (no digitized
    // history — the 5000-warm-lead reality). Generic is the common case.
    const personalized = hasVisitHistory(lead)

    // Resolve property info only when we actually have a past property to anchor on.
    const property = personalized && lead.last_visit_property_id
      ? await ctx.db.findOne<any>('properties', { _id: new ObjectId(lead.last_visit_property_id) }).catch(() => null)
      : null

    const daysSinceVisit = personalized
      ? Math.floor((Date.now() - new Date(lead.last_visit_date).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    // The generic pitch the agent speaks ("2 to 4 BHK options, ₹2 to 5 crore around …"),
    // from the broker-set Settings → never invented per-lead.
    let genericInventoryPitch = ''
    if (!personalized) {
      try {
        const cfg = await getSystemConfig()
        genericInventoryPitch = formatGenericInventoryPitch(cfg.generic_inventory)
      } catch {
        genericInventoryPitch = '2 to 4 BHK options in your budget'
      }
    }

    await ctx.think('decision',
      personalized
        ? `Re-engaging ${lead.name} after ${daysSinceVisit} days (${lead.last_visit_type} at ${lead.last_visit_property || property?.title || 'property'}).`
        : `Generic warm re-engage for ${lead.name} (no stored history) — pitching: ${genericInventoryPitch}.`,
      { confidence: 0.9, metadata: { mode: personalized ? 'personalized' : 'generic_warm', days_since_visit: daysSinceVisit } }
    )

    const result = await ctx.voice.triggerReengageCall({
      phone: lead.phone,
      name: lead.name,
      warmGeneric: !personalized,
      genericInventoryPitch,
      visitType: lead.last_visit_type || 'enquiry',
      lastVisitProperty: lead.last_visit_property || property?.title || '',
      lastVisitPropertyLocation: property?.location || '',
      lastVisitDateHuman: personalized ? formatVisitDateHuman(lead.last_visit_date) : '',
      daysSinceVisit,
      lastVisitSummary: lead.last_visit_summary || '',
      propertyType: lead.property_type || '',
      locationPref: lead.location_pref || '',
      budgetRange: lead.budget_range || '',
      brokerName,
      brokerPhone,
      leadId: leadIdStr,
      // Corpus playbook context: requirement spec + objection history + pitch specifics
      // (only meaningful in personalized mode; harmless empties otherwise)
      minCarpetSqft: lead.min_carpet_sqft || undefined,
      facingPref: lead.facing_pref || (lead.vastu_required ? 'vastu-compliant' : undefined),
      areaReason: lead.area_reason || undefined,
      objectionHistory: lead.objections || undefined,
      propertyCarpetSqft: property?.carpet_area_sqft || undefined,
      propertyFloor: property?.floor || undefined,
      propertyFacing: property?.facing || undefined,
      propertyAskPrice: property?.ask_price ? `${Math.round(property.ask_price / 100_000)} lakhs` : undefined,
      sellerUrgency: property?.seller_urgency || undefined,
    })

    if (result.success) {
      const voiceCallId = result.voiceCallId || result.callId
      if (voiceCallId) {
        await ctx.db.updateOne(
          'calls',
          { voice_call_id: voiceCallId },
          {
            $set: {
              lead_id: leadIdStr,
              lead_name: lead.name,
              lead_phone: lead.phone,
              agent_name: 'Re-engage Agent',
              agent_id: 'dead_lead_reengager',
              campaign_id: 'auto-reengage',
              direction: 'outbound',
              call_type: 'reengage',
              disposition: 'queued',
              call_outcome: 'pending',
              voice_call_id: voiceCallId,
              room_name: result.roomName || voiceCallId,
              voice_status: result.status || 'dialing',
              matched_property_id: lead.last_visit_property_id,
              broker_id: lead.broker_id,
              updated_at: new Date(),
            },
          }
        )
      }

      // Stamp last_contacted_at and gate matchmaker
      await ctx.db.updateOne(
        'leads',
        { _id: lead._id },
        {
          $set: {
            last_contacted_at: new Date(),
            updated_at: new Date(),
            matchmaker_skip_until: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
            reengage_fired_at: new Date(),
          },
        }
      )
    } else {
      // No call placed (trunk_missing / voice_disabled / dispatch failure) → release the lock
      await releaseLeadLock(leadIdStr, 're_engage')
    }

    await ctx.act('reengage_trigger', `Re-engage call ${result.success ? 'triggered' : 'failed'} for ${lead.name}`, {
      parameters: { lead_id: leadIdStr, visit_type: lead.last_visit_type, days_since_visit: daysSinceVisit },
      result: {
        success: result.success,
        voice_call_id: result.voiceCallId || result.callId,
        room_name: result.roomName,
        status: result.status,
      },
      error: result.success ? undefined : result.error,
    })

    return { ok: result.success, call_id: result.voiceCallId || result.callId, reason: result.error }
  } catch (err: any) {
    await releaseLeadLock(leadIdStr, 're_engage')
    console.error('[reengagerService] Trigger failed:', err.message)
    throw err
  }
}

// ── Webhook Callback ───────────────────────────────────────────────────────

/**
 * Called by webhook after re-engage call ends.
 * Updates lead's reengage history + last_reengage_attempted_at.
 */
export async function recordReengageAttempt(input: {
  lead_id: string
  call_id: string
  outcome: string
  visit_type_at_attempt: string
}) {
  const client = await clientPromise
  const leadsCol = client.db(DB_NAME).collection('leads')

  await leadsCol.updateOne(
    { _id: new ObjectId(input.lead_id) },
    {
      $set: {
        last_reengage_attempted_at: new Date(),
        updated_at: new Date(),
      },
      $push: {
        lead_reengage_history: {
          attempted_at: new Date(),
          call_id: input.call_id,
          outcome: input.outcome,
          visit_type_at_attempt: input.visit_type_at_attempt,
        } as any,
      },
    }
  )
}
