/**
 * POST /api/demo/start-calls
 * 
 * Picks up all warm leads from the DB and calls them ONE BY ONE.
 * After each call completes (detected via DB status polling + event bus),
 * the next lead is called automatically.
 *
 * The API returns immediately. The calling happens in the background.
 * GET /api/demo/start-calls returns live status.
 *
 * Flow per lead:
 *   1. Trigger re-engage call → LiveKit room created
 *   2. Voice agent joins, greets, has conversation
 *   3. If appointment booked → appointment record created (visible in Appointments page)
 *   4. If follow-up requested → lead.next_follow_up_date updated
 *   5. Call ends → call record marked 'completed'
 *   6. This API detects completion → picks next lead → repeat
 */
import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { triggerReengageCall } from '@/lib/voiceRuntime'
import { callEventBus } from '@/lib/callEvents'
import type { CallCompletedEvent } from '@/lib/callEvents'

// ── Shared state (in-process singleton) ───────────────────────────────────
const state = {
  active: false,
  startedAt: 0,
  totalLeads: 0,
  currentLead: '',
  currentCallId: '',
  completedLeads: [] as string[],
  pendingLeads: [] as string[],
  results: [] as Array<{ lead: string; phone: string; builder: string; success: boolean; callId?: string; roomName?: string; joinUrl?: string; error?: string }>,
}

// Reset state
function resetState() {
  state.active = false
  state.startedAt = 0
  state.totalLeads = 0
  state.currentLead = ''
  state.currentCallId = ''
  state.completedLeads = []
  state.pendingLeads = []
  state.results = []
}

// Stale-lock guard: if a batch has been "active" for > 30 min, it crashed —
// allow a new batch to start instead of blocking forever.
const STALE_LOCK_MS = 30 * 60 * 1000
function isLockStale(): boolean {
  return state.active && state.startedAt > 0 && Date.now() - state.startedAt > STALE_LOCK_MS
}

/**
 * Wait for a call to complete — EVENT-DRIVEN (push) with a DB-poll safety net.
 *
 * Primary path: the voice agent POSTs to /api/voice/call-completed when the call
 * ends, which emits 'call:completed' on this process's event bus — we resolve
 * instantly (no polling latency).
 *
 * Fallback path: if the HTTP callback is lost (network blip, agent crash), a slow
 * background DB poll (every 8s) eventually detects the terminal status so the
 * queue never hangs forever.
 *
 * Whichever fires first wins.
 */
async function waitForCallDone(voiceCallId: string, maxWaitMs = 10 * 60 * 1000): Promise<string> {
  const TERMINAL = ['completed', 'failed', 'no_answer', 'cancelled']

  return new Promise<string>((resolve) => {
    let settled = false
    const finish = (status: string) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      clearInterval(pollTimer)
      callEventBus.off('call:completed', onEvent)
      resolve(status)
    }

    // 1. Event-driven (instant push from the voice agent via HTTP callback)
    const onEvent = (ev: CallCompletedEvent) => {
      if (ev.voiceCallId === voiceCallId || ev.roomName === voiceCallId) {
        finish('completed')
      }
    }
    callEventBus.on('call:completed', onEvent)

    // 2. Safety-net DB poll (slow — only matters if the event is lost)
    const pollTimer = setInterval(async () => {
      try {
        const calls = await getCollection('calls')
        const doc = await calls.findOne({ voice_call_id: voiceCallId }, { projection: { call_status: 1, status: 1 } })
        const status = doc?.call_status || doc?.status || ''
        if (TERMINAL.includes(status)) finish(status)
      } catch {
        // ignore transient poll errors
      }
    }, 8000)

    // 3. Hard timeout so the queue never hangs forever
    const timeout = setTimeout(() => finish('timeout'), maxWaitMs)
  })
}

export async function GET() {
  return NextResponse.json(state)
}

export async function POST() {
  if (state.active && !isLockStale()) {
    return NextResponse.json({ ok: false, error: 'Already calling. Wait for current batch to finish.', state }, { status: 409 })
  }
  if (isLockStale()) {
    console.warn('[auto-call] stale lock detected — resetting and starting fresh batch')
    resetState()
  }

  const brokerName = process.env.VOICE_BROKER_NAME || 'Ajit Jawlekar'
  const brokerId = process.env.DEFAULT_BROKER_ID
  if (!brokerId) {
    return NextResponse.json({ ok: false, error: 'DEFAULT_BROKER_ID not configured' }, { status: 500 })
  }

  try {
    const leads = await getCollection('leads')

    // ── Eligibility filter — only call leads that SHOULD be dialed now ────
    //   cold       → primary outreach (never contacted)
    //   follow_up  → only if the promised callback time is due (<= now)
    //   + never DND/DNC, never deleted, respect cooldown window
    const now = new Date()
    const cooldownMins = parseInt(process.env.OUTBOUND_COOLDOWN_MINUTES || '0')
    const cooldownCutoff = new Date(now.getTime() - cooldownMins * 60 * 1000)

    const eligibleLeads = await leads.find({
      $and: [
        {
          $or: [
            { status: 'cold' },
            { status: 'follow_up', next_follow_up_date: { $lte: now } },
          ],
        },
        { dnd_status: { $ne: true } },
        { is_deleted: { $ne: true } },
        // Cooldown: skip leads contacted within the cooldown window (0 = disabled)
        ...(cooldownMins > 0
          ? [{ $or: [{ last_contacted_at: null }, { last_contacted_at: { $lte: cooldownCutoff } }] }]
          : []),
      ],
    })
      // Priority: overdue follow-ups first (time-sensitive promises), then cold leads
      .sort({ next_follow_up_date: 1, created_at: 1 })
      .toArray() as any[]

    const warmLeads = eligibleLeads

    if (warmLeads.length === 0) {
      return NextResponse.json({
        ok: false,
        error: 'No eligible leads to call (need cold leads or due follow-ups). Click "Load Leads" first.',
      }, { status: 400 })
    }

    // Initialize state
    resetState()
    state.active = true
    state.startedAt = Date.now()
    state.totalLeads = warmLeads.length
    state.pendingLeads = warmLeads.map(l => l.name)

    // Return immediately — calls happen in background
    const responseData = {
      ok: true,
      totalLeads: warmLeads.length,
      leads: warmLeads.map((l: any) => ({ name: l.name, phone: l.phone, builder: l.builder_interest })),
      message: `Starting ${warmLeads.length} sequential calls. Poll GET /api/demo/start-calls for live status.`,
    }

    // Background: call each lead sequentially
    void (async () => {
      const callsCollection = await getCollection('calls')
      const leadsCollection = await getCollection('leads')
      const now = new Date()

      for (let i = 0; i < warmLeads.length; i++) {
        const lead = warmLeads[i]
        state.currentLead = lead.name
        state.currentCallId = ''
        state.pendingLeads = warmLeads.slice(i + 1).map(l => l.name)

        console.log(`[auto-call] calling ${i + 1}/${warmLeads.length}: ${lead.name} (${lead.phone})`)

        try {
          // Update lead status to 'calling'
          await leadsCollection.updateOne(
            { _id: lead._id },
            { $set: { status: 'calling', updated_at: new Date() } }
          )

          const result = await triggerReengageCall({
            phone: lead.phone,
            name: lead.name,
            visitType: lead.last_visit_type || 'office_walkin',
            lastVisitProperty: lead.matched_property_title || lead.last_visit_property || '',
            lastVisitDateHuman: (lead.last_visit_date || now).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata',
            }),
            daysSinceVisit: Math.round(
              (now.getTime() - new Date(lead.last_visit_date || now).getTime()) / (24 * 60 * 60 * 1000)
            ),
            lastVisitSummary: lead.last_visit_summary || '',
            propertyType: lead.property_type,
            locationPref: lead.location_pref,
            budgetRange: lead.budget_range,
            brokerName,
            leadId: String(lead._id),
          })

          const callResult: any = {
            lead: lead.name,
            phone: lead.phone,
            builder: lead.builder_interest || '',
            success: result.success,
            callId: result.voiceCallId,
            roomName: result.roomName,
            joinUrl: result.joinUrl,
            error: result.error,
          }
          state.results.push(callResult)

          if (result.success && result.voiceCallId) {
            state.currentCallId = result.voiceCallId

            // Stamp lead info on call record
            await callsCollection.updateOne(
              { voice_call_id: result.voiceCallId },
              { $set: { lead_id: String(lead._id), lead_name: lead.name, lead_phone: lead.phone, builder_interest: lead.builder_interest, updated_at: new Date() } }
            )

            console.log(`[auto-call] ✓ ${lead.name} → room: ${result.roomName}${result.joinUrl ? ' (webrtc)' : ''}`)

            // ── WAIT for this call to finish ──────────────────────────────
            const finalStatus = await waitForCallDone(result.voiceCallId)
            console.log(`[auto-call] ✓ ${lead.name} call ended with status: ${finalStatus}`)

            // Read the call outcome and map to lead status:
            //   appointment_booked    → booked
            //   callback_requested    → follow_up (+ next_follow_up_date)
            //   not_interested_now    → contacted (mild) OR dnd (6-month no-interest)
            //   dnc_requested         → dnd
            //   default               → contacted
            const callDoc = await callsCollection.findOne({ voice_call_id: result.voiceCallId })
            const outcome = callDoc?.call_outcome || ''
            const summary = (callDoc?.call_summary || '').toLowerCase()

            const leadUpdate: Record<string, any> = {
              last_contacted_at: new Date(),
              total_calls: (lead.total_calls || 0) + 1,
              first_call_completed: true,
              last_call_summary: callDoc?.call_summary || '',
              updated_at: new Date(),
            }

            if (outcome === 'appointment_booked') {
              leadUpdate.status = 'booked'
              leadUpdate.interest_level = 'hot'
              leadUpdate.next_follow_up_date = null // converted — no further follow-up needed
            } else if (outcome === 'callback_requested' || outcome === 'customer_busy_reschedule') {
              leadUpdate.status = 'follow_up'
              // Use the callback date the agent saved, or default to +3 days
              const cb = callDoc?.preferred_callback_time || callDoc?.next_follow_up_date
              leadUpdate.next_follow_up_date = cb ? new Date(cb) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
              leadUpdate.followup_reason = callDoc?.call_summary || 'Customer requested callback'
              leadUpdate.interest_level = 'warm'
            } else if (outcome === 'dnc_requested') {
              leadUpdate.status = 'dnd'
              leadUpdate.dnd_status = true
              leadUpdate.interest_level = 'cold'
            } else if (outcome === 'not_interested_now') {
              // DND if customer indicated no interest for 6 months, else just contacted
              const sixMonthSignal = /6 month|six month|not.*looking|next year|no interest/i.test(summary)
              if (sixMonthSignal) {
                leadUpdate.status = 'dnd'
                leadUpdate.dnd_status = true
                leadUpdate.next_follow_up_date = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // revisit in 6 months
              } else {
                leadUpdate.status = 'contacted'
                leadUpdate.next_follow_up_date = null
              }
              leadUpdate.interest_level = 'cold'
            } else {
              // No clear outcome — mark contacted so it's not re-called as cold
              leadUpdate.status = 'contacted'
              leadUpdate.next_follow_up_date = null
            }

            await leadsCollection.updateOne({ _id: lead._id }, { $set: leadUpdate })
            console.log(`[auto-call] ${lead.name}: outcome='${outcome || 'none'}' → status='${leadUpdate.status}'`)

            // No artificial delay — the next call starts immediately. The voice
            // agent's own room teardown already provides natural spacing.
          } else {
            // Call failed to trigger — mark lead and move on
            await leadsCollection.updateOne(
              { _id: lead._id },
              { $set: { status: 'warm', updated_at: new Date() } }
            )
            console.warn(`[auto-call] ✗ ${lead.name}: ${result.error}`)
          }
        } catch (err: any) {
          state.results.push({ lead: lead.name, phone: lead.phone, builder: lead.builder_interest || '', success: false, error: err.message })
          console.error(`[auto-call] ✗ ${lead.name} threw:`, err.message)
        }

        state.completedLeads.push(lead.name)
      }

      // All done
      state.active = false
      state.currentLead = ''
      state.currentCallId = ''
      state.pendingLeads = []
      console.log(`[auto-call] ✓ All ${warmLeads.length} calls completed.`)
    })()

    return NextResponse.json(responseData)
  } catch (err: any) {
    resetState()
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
