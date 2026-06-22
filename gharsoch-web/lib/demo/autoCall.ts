/**
 * lib/demo/autoCall.ts
 *
 * Called once at server startup via instrumentation.ts.
 *
 * Flow:
 *  1. Delete ALL existing leads (clean slate for demo)
 *  2. Seed fresh warm demo leads from DB property inventory
 *  3. Trigger sequential re-engage voice calls (next call starts only after previous completes)
 *
 * The voice agent books appointments and updates call status — the Appointments
 * section reflects whatever the customer agreed to automatically.
 */
import { getCollection } from '@/lib/mongodb'
import { triggerReengageCall } from '@/lib/voiceRuntime'
import { callEventBus } from '@/lib/callEvents'
import type { CallCompletedEvent } from '@/lib/callEvents'

let alreadyRan = false

/**
 * Wait for the voice agent to signal call completion via the event bus.
 * Falls back to a timeout if the event never fires.
 */
function waitForCallCompletion(voiceCallId: string, maxWaitMs = 10 * 60 * 1000): Promise<void> {
  return new Promise((resolve) => {
    let resolved = false

    const onCompleted = (ev: CallCompletedEvent) => {
      if (ev.voiceCallId === voiceCallId || ev.roomName === voiceCallId) {
        cleanup()
        resolve()
      }
    }

    const timer = setTimeout(() => {
      if (!resolved) {
        console.warn(`[startup] call ${voiceCallId} — event not received within ${maxWaitMs / 1000}s, proceeding`)
        cleanup()
        resolve()
      }
    }, maxWaitMs)

    function cleanup() {
      if (resolved) return
      resolved = true
      clearTimeout(timer)
      callEventBus.off('call:completed', onCompleted)
    }

    callEventBus.on('call:completed', onCompleted)
  })
}

export async function runDemoAutoCall(): Promise<void> {
  if (alreadyRan) {
    console.log('[startup] Demo auto-call already ran this session — skipped.')
    return
  }
  alreadyRan = true

  const brokerId = process.env.DEFAULT_BROKER_ID
  const brokerName = process.env.VOICE_BROKER_NAME || 'Ajit Jawlekar'

  if (!brokerId) {
    console.warn('[startup] DEFAULT_BROKER_ID not set — skipping demo auto-call.')
    return
  }

  if (!process.env.LIVEKIT_URL || !process.env.LIVEKIT_API_KEY) {
    console.warn('[startup] LIVEKIT_URL/LIVEKIT_API_KEY not set — skipping demo auto-call (voice disabled).')
    return
  }

  if (!process.env.DATABASE_URL) {
    console.warn('[startup] DATABASE_URL not set — skipping demo auto-call.')
    return
  }

  try {
    const leads = await getCollection('leads')
    const properties = await getCollection('properties')

    // ── Step 1: Delete ALL existing leads (clean slate) ───────────────────
    const deleteResult = await leads.deleteMany({})
    console.log(`[startup] ✓ deleted all existing leads (${deleteResult.deletedCount} removed)`)

    // ── Step 2: Seed fresh demo warm leads ────────────────────────────────
    const powaiProp: any = await properties.findOne({
      location: { $regex: 'powai', $options: 'i' },
      status: 'available',
      is_deleted: { $ne: true },
    })
    const andheriProp: any = await properties.findOne({
      location: { $regex: 'andheri', $options: 'i' },
      status: 'available',
      is_deleted: { $ne: true },
    })

    const now = new Date()

    const DEMO_LEADS = [
      {
        phone: '+917001000001',
        name: 'Rajesh Mehra',
        builder_interest: 'Lodha Group',
        location_pref: powaiProp?.location || 'Powai',
        place: powaiProp?.city || 'Mumbai',
        property_type: '2BHK',
        budget_range: '1.5-2 cr',
        matched_property_id: powaiProp ? String(powaiProp._id) : '',
        matched_property_title: powaiProp?.title || 'Lodha Sterling',
        last_visit_property: powaiProp?.title || 'Lodha Sterling',
        last_visit_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        last_visit_summary: 'Visited Lodha Sterling, liked the amenities, asked about 2BHK pricing. Main objection was possession timeline.',
        last_visit_type: 'office_walkin' as const,
        notes: 'Interested in Lodha Group projects in Powai. Warm lead from builder event.',
      },
      {
        phone: '+917001000002',
        name: 'Priya Sharma',
        builder_interest: 'Godrej Properties',
        location_pref: andheriProp?.location || 'Andheri East',
        place: andheriProp?.city || 'Mumbai',
        property_type: '3BHK',
        budget_range: '2.5-3.5 cr',
        matched_property_id: andheriProp ? String(andheriProp._id) : '',
        matched_property_title: andheriProp?.title || 'Godrej Nest',
        last_visit_property: andheriProp?.title || 'Godrej Nest',
        last_visit_date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        last_visit_summary: 'Visited Godrej site, interested in 3BHK, concerned about possession timeline. Budget flexible.',
        last_visit_type: 'site_visit' as const,
        notes: 'Interested in Godrej Properties. Warm lead referred by existing client.',
      },
    ]

    const leadIds: string[] = []
    for (const demo of DEMO_LEADS) {
      const leadDoc = {
        name: demo.name,
        phone: demo.phone,
        broker_id: brokerId,
        status: 'warm',
        interest_level: 'warm',
        is_warm_lead: true,
        dnd_status: false,
        is_deleted: false,
        is_demo: true,
        preferred_language: 'hi',
        budget_range: demo.budget_range,
        property_type: demo.property_type,
        location_pref: demo.location_pref,
        place: demo.place,
        notes: demo.notes,
        builder_interest: demo.builder_interest,
        matched_property_id: demo.matched_property_id,
        matched_property_title: demo.matched_property_title,
        last_visit_type: demo.last_visit_type,
        last_visit_property: demo.last_visit_property,
        last_visit_date: demo.last_visit_date,
        last_visit_summary: demo.last_visit_summary,
        purpose: 'buy',
        qualification_status: 'qualified',
        source: 'demo_seed',
        email: '',
        assigned_agent_id: '',
        lead_score: 70,
        follow_up_count: 1,
        total_calls: 0,
        first_call_completed: false,
        customer_requirements: `${demo.property_type}, ${demo.budget_range}, ${demo.location_pref}`,
        timeline: '3-6 months',
        objections: '',
        followup_reason: 'Warm lead from builder event',
        last_contacted_at: demo.last_visit_date,
        next_follow_up_date: new Date(now.getTime() - 60 * 60 * 1000),
        last_reengage_attempted_at: null,
        created_at: now,
        updated_at: now,
      }

      const r = await leads.insertOne(leadDoc)
      const leadId = String(r.insertedId)
      leadIds.push(leadId)
      console.log(`[startup] ✓ seeded lead: ${demo.name} (${demo.phone}) — ${demo.builder_interest}`)
    }

    // ── Step 3: Trigger sequential voice calls ────────────────────────────
    const callsCollection = await getCollection('calls')

    for (let i = 0; i < DEMO_LEADS.length; i++) {
      const demo = DEMO_LEADS[i]
      const leadId = leadIds[i]

      try {
        const result = await triggerReengageCall({
          phone: demo.phone,
          name: demo.name,
          visitType: demo.last_visit_type,
          lastVisitProperty: demo.matched_property_title,
          lastVisitDateHuman: demo.last_visit_date.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata',
          }),
          daysSinceVisit: Math.round(
            (now.getTime() - demo.last_visit_date.getTime()) / (24 * 60 * 60 * 1000)
          ),
          lastVisitSummary: demo.last_visit_summary,
          propertyType: demo.property_type,
          locationPref: demo.location_pref,
          budgetRange: demo.budget_range,
          brokerName,
          leadId,
        })

        if (result.success && result.voiceCallId) {
          // Stamp demo metadata onto the call record
          await callsCollection.updateOne(
            { voice_call_id: result.voiceCallId },
            {
              $set: {
                lead_id: leadId,
                lead_name: demo.name,
                lead_phone: demo.phone,
                builder_interest: demo.builder_interest,
                is_demo_call: true,
                updated_at: now,
              },
            }
          )
          console.log(
            `[startup] ✓ call triggered: ${demo.name} → room: ${result.roomName}` +
            (result.joinUrl ? `\n  Join (webrtc): ${result.joinUrl}` : '')
          )

          // Wait for this call to complete before starting the next one
          if (i < DEMO_LEADS.length - 1) {
            console.log(`[startup] ⏳ waiting for call to ${demo.name} to complete…`)
            await waitForCallCompletion(result.voiceCallId)
            console.log(`[startup] ✓ call to ${demo.name} completed — starting next.`)
            await new Promise((r) => setTimeout(r, 2000))
          }
        } else {
          console.warn(`[startup] ✗ call failed for ${demo.name}: ${result.error}`)
        }
      } catch (callErr: any) {
        console.warn(`[startup] ✗ call threw for ${demo.name}: ${callErr.message}`)
      }
    }

    console.log('[startup] ✓ Demo auto-call complete. All leads called sequentially.')
  } catch (err: any) {
    console.warn('[startup] Demo auto-call DB error:', err.message)
  }
}
