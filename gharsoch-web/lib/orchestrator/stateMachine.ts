/**
 * lib/orchestrator/stateMachine.ts — lead state transitions driven by call outcomes.
 *
 * The voice tools (lib/voice/toolRouter) already apply the DIRECT outcome writes
 * mid-call (status booked/follow_up/wrong_number, dnd flag, callback date). This
 * module is the post-call layer on top:
 *  - the bookkeeping the Vapi webhook used to do and nothing does in the LiveKit
 *    era (total_calls, last_contacted_at, 'new' → 'contacted'),
 *  - cooldown gates (matchmaker_skip_until) so freshly-talked leads aren't
 *    re-prospected within hours,
 *  - a safety net re-asserting outcome writes in case the in-call tool failed.
 *
 * Pure module: computes a patch, never touches the DB — the reconciler applies it.
 */

export const TERMINAL_LEAD_STATUSES = ['closed', 'lost', 'not_interested', 'wrong_number'] as const

export interface OutcomeTransition {
  /** $set patch for the lead document (never overwrites a terminal status). */
  patch: Record<string, any>
  /** One-line note for agent_conversations memory. */
  note: string
}

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

/**
 * Compute the lead patch for a completed call.
 * @param outcome   call_outcome from the call doc ('' when the LLM never logged one)
 * @param call      the completed call document
 * @param lead      the current lead document
 */
export function applyCallOutcome(outcome: string, call: any, lead: any): OutcomeTransition {
  const now = new Date()
  const endedAt = call?.ended_at ? new Date(call.ended_at) : now

  // Universal bookkeeping — every completed call, regardless of outcome.
  const patch: Record<string, any> = {
    total_calls: (lead?.total_calls || 0) + 1,
    last_contacted_at: endedAt,
    updated_at: now,
  }

  const status = String(lead?.status || 'new')
  const isTerminal = (TERMINAL_LEAD_STATUSES as readonly string[]).includes(status)
  let note = `call completed (${Math.round(call?.duration || 0)}s)`

  switch (outcome) {
    case 'appointment_booked':
      if (!isTerminal) patch.status = 'booked'
      note = 'appointment booked on call'
      break

    case 'callback_requested':
      if (!isTerminal && status !== 'booked') patch.status = 'follow_up'
      // The schedule_callback tool sets the date; backstop with +1 day if it didn't.
      if (!lead?.next_follow_up_date || new Date(lead.next_follow_up_date) < now) {
        patch.next_follow_up_date = call?.follow_up_date ? new Date(call.follow_up_date) : new Date(now.getTime() + DAY_MS)
      }
      note = 'customer asked for a callback'
      break

    case 'customer_busy_reschedule':
      // Don't let the matchmaker re-dial someone who just said "busy".
      patch.matchmaker_skip_until = new Date(now.getTime() + DAY_MS)
      if (!lead?.next_follow_up_date || new Date(lead.next_follow_up_date) < now) {
        patch.next_follow_up_date = new Date(now.getTime() + 4 * HOUR_MS)
      }
      note = 'customer busy — rescheduled'
      break

    case 'not_interested_now':
      // Soft no: 7-day prospecting cooldown, follow-up keeps custody via rules R2.
      patch.matchmaker_skip_until = new Date(now.getTime() + 7 * DAY_MS)
      if (!isTerminal && status !== 'booked') patch.status = 'cold'
      note = 'not interested right now — 7-day cooldown'
      break

    case 'dnc_requested':
      patch.dnd_status = true // safety net — the tool normally sets this mid-call
      note = 'customer requested do-not-call'
      break

    case 'wrong_number':
      patch.status = 'wrong_number'
      note = 'wrong number'
      break

    case 'existing_customer':
      note = 'existing customer — no pipeline change'
      break

    default:
      // No outcome logged (LLM never called the tool). If we actually spoke
      // (transcript exists) and the lead was untouched, mark it contacted.
      if (status === 'new' && call?.transcript) {
        patch.status = 'contacted'
      }
      note = call?.transcript ? 'call completed — no outcome logged' : 'call ended without conversation'
      break
  }

  return { patch, note }
}
