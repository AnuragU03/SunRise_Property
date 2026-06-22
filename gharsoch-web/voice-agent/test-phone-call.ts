/**
 * test-phone-call.ts — place a REAL outbound call to a phone via the LiveKit↔Twilio
 * SIP trunk, straight through voiceRuntime (no lead/DB row required).
 *
 * Prereq: the worker must be running in another terminal → npm run voice:agent
 *         and SIP_OUTBOUND_TRUNK_ID must be set in .env.
 *
 * Run:  npx tsx voice-agent/test-phone-call.ts +91XXXXXXXXXX "Your Name" reengage [--wait]
 *       (or: npm run voice:call -- +91XXXXXXXXXX "Your Name" reengage --wait)
 *
 * It creates a call row + LiveKit room, dials your number through Twilio, and the
 * running worker auto-joins the room and starts talking. Transcript + tool events
 * land on the call record (visible in Call Logs / Call Review).
 *
 * --wait : block until the carrier answers/rejects and print the REAL result
 *          (e.g. "403 Forbidden") instead of the optimistic "dialing". Use this
 *          to diagnose why a call isn't connecting.
 */
import 'dotenv/config'
import { triggerOutboundCall } from '@/lib/voiceRuntime'
import { getCollection } from '@/lib/mongodb'

async function main() {
  const args = process.argv.slice(2)
  const wait = args.includes('--wait')
  const positional = args.filter((a) => a !== '--wait')
  const customerPhone = positional[0]
  let customerName = positional[1] || 'Test Customer'
  const callType = positional[2] || 'reengage'

  if (!customerPhone) {
    console.error('Usage: npm run voice:call -- +91XXXXXXXXXX "Your Name" [reengage|matchmaker|follow_up_callback|appointment_reminder|campaign]')
    process.exit(1)
  }
  const transport = (process.env.VOICE_TRANSPORT || 'sip').toLowerCase()
  if (transport !== 'webrtc' && !process.env.SIP_OUTBOUND_TRUNK_ID) {
    console.error('SIP_OUTBOUND_TRUNK_ID is not set in .env — run `npm run voice:trunk` first (or set VOICE_TRANSPORT=webrtc for browser testing).')
    process.exit(1)
  }

  // Resolve a lead by phone so the in-call tools (book_appointment, check_availability)
  // have lead_id + broker_id. Without a lead, those tools throw "Could not resolve
  // lead/broker context" and no appointment can be booked. A real app-triggered
  // warm/cold call always carries this; this makes the CLI test match.
  let leadId: string | undefined
  let brokerId: string | undefined
  try {
    const last10 = customerPhone.replace(/\D/g, '').slice(-10)
    const leads = await getCollection('leads')
    const lead = last10
      ? await leads.findOne({ phone: { $regex: `${last10}$` }, is_deleted: { $ne: true } })
      : null
    if (lead) {
      leadId = String(lead._id)
      brokerId = lead.broker_id ? String(lead.broker_id) : undefined
      customerName = lead.name || customerName
      console.log(`Matched lead "${lead.name}" (${leadId})${brokerId ? ' broker ' + brokerId : ' — NO broker_id, booking may fail'}`)
    } else {
      console.log('⚠ No lead found for this number — booking tools will fail (no lead context).')
      console.log('  Create a lead with this phone (with a broker), or test from the app, to book appointments.')
    }
  } catch (e) {
    console.log('lead lookup failed (continuing without lead context):', (e as Error).message)
  }

  console.log(`Dialing ${customerPhone} (${customerName}) as call_type=${callType}${wait ? ' [waiting for answer/rejection]' : ''} …`)
  const result = await triggerOutboundCall(
    {
      customerPhone,
      customerName,
      callType,
      leadId,
      metadata: {
        customer_name: customerName,
        customer_phone: customerPhone,
        call_purpose: callType,
        call_type: callType,
        ...(leadId ? { lead_id: leadId } : {}),
        ...(brokerId ? { broker_id: brokerId } : {}),
      },
    },
    { waitUntilAnswered: wait }
  )

  console.log('\nResult:')
  console.log(JSON.stringify(result, null, 2))
  if (result.success && result.status === 'webrtc_ready' && result.joinUrl) {
    console.log('\n✓ WebRTC test call ready. Open this in your browser, allow the mic, and talk to the agent:')
    console.log('\n' + result.joinUrl)
    console.log('\n(The worker must be running: npm run voice:agent — it waits up to 4 min for you to join.)')
  } else if (result.success && (result.status === 'in-progress' || result.status === 'answered')) {
    console.log(`\n✓ ANSWERED — the call connected. Room: ${result.roomName}`)
  } else if (result.success) {
    // status 'dialing' means LiveKit handed the INVITE to the SIP provider and it
    // was accepted — but that is NOT the same as the phone ringing/answering. If it
    // doesn't ring, the PSTN leg failed at the provider; check the provider's call logs.
    console.log(`\n→ Dial handed to Plivo (status: ${result.status}). If your phone doesn't ring,`)
    console.log('  the PSTN leg failed at Plivo — check Plivo Console → Logs → Call Logs for the reason')
    console.log('  (free trial only calls VERIFIED numbers). Room:', result.roomName)
  } else {
    console.log(`\n✗ Not connected: ${result.status} — ${result.error}`)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error('FAILED:', err?.message || err)
  process.exit(1)
})
