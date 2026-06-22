/**
 * lib/orchestrator/postCall.ts — the Post-Call Reconciler.
 *
 * LiveKit-era replacement for the lead-side bookkeeping the Vapi webhook
 * (lib/vapi/callReportHandler) used to do: when a call completes, reconcile the
 * LEAD with what happened on the call. The voice tools write outcomes mid-call;
 * this runs once after hangup and:
 *   1. applies the state machine (total_calls, last_contacted_at, status
 *      transitions, cooldown gates, dnc safety net),
 *   2. writes an agent_conversations note so the NEXT agent to dial this lead
 *      opens with full context.
 *
 * Fired by dispatchEvent({type:'call.completed'}) from the voice worker's
 * shutdown hook. Idempotent via calls.post_call_reconciled flag.
 */

import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { applyCallOutcome } from './stateMachine'
import { recordAgentNote } from './memory'

function callFilter(callId: string) {
  const ors: any[] = [{ voice_call_id: callId }, { room_name: callId }]
  if (ObjectId.isValid(callId)) ors.push({ _id: new ObjectId(callId) })
  return { $or: ors }
}

export interface ReconcileResult {
  ok: boolean
  reason?: string
  leadId?: string
  outcome?: string
  applied?: string[]
}

export async function reconcilePostCall(callId: string): Promise<ReconcileResult> {
  if (!callId) return { ok: false, reason: 'no_call_id' }

  const calls = await getCollection('calls')
  const call = await calls.findOne(callFilter(callId))
  if (!call) return { ok: false, reason: 'call_not_found' }

  // Idempotency: a retry or double event must not double-increment total_calls.
  const claimed = await calls.updateOne(
    { _id: call._id, post_call_reconciled: { $ne: true } },
    { $set: { post_call_reconciled: true, updated_at: new Date() } }
  )
  if (claimed.modifiedCount === 0) return { ok: true, reason: 'already_reconciled' }

  const leadId = String(call.lead_id || '')
  if (!leadId || !ObjectId.isValid(leadId)) {
    return { ok: true, reason: 'no_lead_attached' }
  }

  const leads = await getCollection('leads')
  const lead = await leads.findOne({ _id: new ObjectId(leadId) })
  if (!lead) return { ok: true, reason: 'lead_not_found' }

  const outcome = String(call.call_outcome || '')
  const { patch, note } = applyCallOutcome(outcome, call, lead)

  await leads.updateOne({ _id: lead._id }, { $set: patch })

  const summary = String(call.call_summary || '').slice(0, 300)
  const objections = String(call.customer_objections || '').slice(0, 200)
  await recordAgentNote({
    leadId,
    agentId: String(call.agent_id || 'gharsoch_voice_runtime'),
    callId: String(call._id),
    note: [note, summary && `summary: ${summary}`, objections && `objections: ${objections}`]
      .filter(Boolean)
      .join(' | '),
    meta: { outcome, duration: call.duration || 0, direction: call.direction || 'outbound' },
  })

  console.log(`[post-call] reconciled lead ${leadId}: outcome='${outcome || 'none'}' →`, Object.keys(patch).join(','))
  return { ok: true, leadId, outcome, applied: Object.keys(patch) }
}
