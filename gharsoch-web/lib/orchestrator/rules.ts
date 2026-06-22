/**
 * lib/orchestrator/rules.ts — the lead-ownership rules system.
 *
 * THE problem this solves: a lead with visit history belongs to the RE-ENGAGER
 * (personalized "you visited X, I have new options" call — see the real-call
 * corpus in voice-agent/call-corpus), while a fresh lead belongs to the
 * MATCHMAKER (cold property pairing). Historically both could fire on the same
 * lead within seconds (PRD Phase D: "real customer got 2 calls in 6 seconds"),
 * patched with the 4-hour `matchmaker_skip_until` band-aid. These rules make
 * ownership DETERMINISTIC and queryable from one place.
 *
 * Two distinct concepts — do not conflate:
 *  - ROUTING (this file): which agent is allowed to INITIATE the next outbound
 *    contact for a lead, decided from the lead's profile/state.
 *  - LOCKING (leadLockService.CRON_PRIORITY): runtime contention when two agents
 *    try to act simultaneously anyway. Locks stay as the last line of defense.
 *
 * Key insight from the corpus (call 03): the human broker does matchmaking
 * INSIDE the re-engage call ("you didn't like Kanjurmarg? I have Lodha Vikhroli,
 * and Midos…"). So the re-engager OWNS the dial, and matchmaker-style property
 * context is INJECTED into that call — two agents' value in one phone ring,
 * never two phone rings.
 */

export type LeadOwner =
  | 'manual_broker'
  | 'appointment_guardian'
  | 'follow_up_agent'
  | 'dead_lead_reengager'
  | 'matchmaker'
  | 'none'

export interface OwnershipDecision {
  owner: LeadOwner
  reason: string
  /** True when matchmaker-style matched-property context should be injected into the owner's call. */
  injectPropertyContext: boolean
}

/** A lead "has visit history" when all three G7 anchors exist — the re-engager's precondition. */
export function hasVisitHistory(lead: any): boolean {
  return Boolean(lead?.last_visit_property_id && lead?.last_visit_date && lead?.last_visit_type)
}

/**
 * A "warm" lead is one of the broker's existing RELATIONSHIPS — no digitized
 * history, but known, worth a generic re-engagement call (NOT cold prospecting).
 * This is an explicit property of the lead's origin, set when the broker's warm
 * list is imported (is_warm_lead / source='broker_warm_list').
 *
 * Deliberately NOT keyed on interest_level: that field is a SCORE the converter
 * derives (a fresh cold lead can score "warm" yet have no relationship), so using
 * it here would misroute brand-new cold leads into the warm playbook.
 */
export function isWarmLead(lead: any): boolean {
  return Boolean(lead?.is_warm_lead === true || lead?.source === 'broker_warm_list')
}

const TERMINAL_STATUSES = ['closed', 'lost', 'not_interested', 'wrong_number']

/**
 * Decide which agent owns the next outbound contact for this lead.
 * Order encodes intent strength: explicit promise > existing appointment >
 * relationship history > cold prospecting.
 */
export function decideLeadOwner(lead: any): OwnershipDecision {
  // R0 — untouchable leads
  if (!lead || lead.is_deleted) return { owner: 'none', reason: 'deleted', injectPropertyContext: false }
  if (lead.dnd_status || lead.dnc_flag) return { owner: 'none', reason: 'dnc', injectPropertyContext: false }
  if (TERMINAL_STATUSES.includes(lead.status)) {
    return { owner: 'none', reason: `terminal_status_${lead.status}`, injectPropertyContext: false }
  }

  // R1 — booked leads belong to the Appointment Guardian (reminders / confirm / reschedule).
  // Nobody prospects a customer who already has a site visit on the calendar.
  if (lead.status === 'booked' || lead.status === 'appointment_set') {
    return { owner: 'appointment_guardian', reason: 'has_active_appointment', injectPropertyContext: false }
  }

  // R2 — an explicit callback promise beats everything else: the customer ASKED for this call.
  if (lead.next_follow_up_date && new Date(lead.next_follow_up_date) <= new Date()) {
    return { owner: 'follow_up_agent', reason: 'callback_promised_and_due', injectPropertyContext: true }
  }

  // R3 — visit history ⇒ the re-engager owns the dial, personalized with the past
  // property + objections (corpus call 03: objection → pivot to new options in ONE call).
  if (hasVisitHistory(lead)) {
    return { owner: 'dead_lead_reengager', reason: 'visit_history_relationship', injectPropertyContext: true }
  }

  // R3.5 — warm relationship WITHOUT digitized history (the broker's 5000 warm leads):
  // the re-engager owns the dial too, but runs the GENERIC warm playbook (reconnect →
  // generic new-inventory pitch → visit → chai). NOT cold-prospected by the matchmaker.
  // injectPropertyContext=false: there is no specific property to anchor on.
  if (isWarmLead(lead)) {
    return { owner: 'dead_lead_reengager', reason: 'warm_lead_generic', injectPropertyContext: false }
  }

  // R4 — temporal guard left by a recent re-engage fire (kept for safety even though
  // R3 already excludes these leads from the matchmaker).
  if (lead.matchmaker_skip_until && new Date(lead.matchmaker_skip_until) > new Date()) {
    return { owner: 'none', reason: 'matchmaker_skip_gate_active', injectPropertyContext: false }
  }

  // R5 — fresh lead, no relationship: the matchmaker prospects it.
  return { owner: 'matchmaker', reason: 'fresh_lead_no_history', injectPropertyContext: true }
}

/**
 * Cron-side filter for the matchmaker sweep: may the matchmaker initiate an
 * outbound call to this lead right now? Returns the skip reason when not.
 */
export function matchmakerMayProspect(lead: any): { allowed: boolean; reason: string } {
  const decision = decideLeadOwner(lead)
  if (decision.owner === 'matchmaker') return { allowed: true, reason: decision.reason }
  return { allowed: false, reason: `owned_by_${decision.owner}:${decision.reason}` }
}
