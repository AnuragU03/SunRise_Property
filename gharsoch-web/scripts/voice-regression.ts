/**
 * scripts/voice-regression.ts — the 10-scenario voice regression checklist
 * (restoration item E), verbatim from the Prototype continuation pack §10.
 *
 * These exercise the LIVE pipeline (STT/LLM/TTS/tools), which a headless script
 * can't assert automatically — so this prints an ordered, copy-pasteable runbook
 * to drive by hand (WebRTC console or a real dial), plus the DB-side business
 * checks that CAN be verified after an appointment-booking call.
 *
 * Run:  npm run voice:regression
 *       npm run voice:regression -- --verify <call_doc_id>   (post-call DB checks)
 */
import 'dotenv/config'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'

interface Scenario {
  n: number
  title: string
  drive: string
  expect: string
}

const SCENARIOS: Scenario[] = [
  { n: 1, title: 'Greeting once, correct name', drive: 'Answer the call, stay silent 2s', expect: 'Agent greets exactly once, uses the lead\'s name, does NOT repeat the greeting' },
  { n: 2, title: 'Hinglish default, English digits', drive: 'Ask "price kya hai?"', expect: 'Replies in Hinglish; prices/areas spoken as English digits (e.g. "ek crore twenty lakh")' },
  { n: 3, title: 'Interrupt mid-sentence', drive: 'Start talking while the agent is speaking', expect: 'Agent stops within ~400ms and listens (barge-in works)' },
  { n: 4, title: 'Customer changes language', drive: 'Switch to Marathi or English mid-call', expect: 'Agent follows the language switch on the next turn' },
  { n: 5, title: 'Customer books appointment', drive: 'Agree to a site visit, give a day/time', expect: 'Agent calls book_appointment; confirms slot back; see --verify checks below' },
  { n: 6, title: 'Customer asks callback', drive: 'Say "abhi busy hoon, kal call karna"', expect: 'Agent calls schedule_callback; lead.next_follow_up_date set; status → follow_up' },
  { n: 7, title: 'Customer says DNC / wrong number', drive: 'Say "mujhe call mat karna" or "galat number"', expect: 'Agent logs outcome dnc_requested/wrong_number; lead.dnd_status true or status wrong_number' },
  { n: 8, title: 'Unclear date/time', drive: 'Say "agle hafte kabhi"', expect: 'Agent asks a clarifying question instead of guessing a slot' },
  { n: 9, title: 'Customer hangs up', drive: 'Disconnect abruptly', expect: 'Worker watchdog ends the call; call_status completed; post-call reconcile runs' },
  { n: 10, title: 'Broker ends call manually', drive: 'Hang up from the in-app call console', expect: 'Call tears down cleanly; transcript + outcome persisted' },
]

async function printRunbook() {
  console.log('\n━━ Voice regression runbook (Prototype §10) ━━')
  console.log('Setup: npm run dev + npm run voice:agent, VOICE_TRANSPORT=webrtc.')
  console.log('Drive each from a lead page → Start Call → Answer (in-app console).\n')
  for (const s of SCENARIOS) {
    console.log(`${String(s.n).padStart(2)}. ${s.title}`)
    console.log(`     drive : ${s.drive}`)
    console.log(`     expect: ${s.expect}\n`)
  }
  console.log('After a booking call (scenario 5), verify the DB side:')
  console.log('  npm run voice:regression -- --verify <call_doc_id>\n')
}

async function verifyBooking(callId: string) {
  console.log(`\n━━ Business verification for call ${callId} ━━\n`)
  const calls = await getCollection('calls')
  const call = ObjectId.isValid(callId)
    ? await calls.findOne({ _id: new ObjectId(callId) })
    : await calls.findOne({ $or: [{ room_name: callId }, { voice_call_id: callId }] })

  if (!call) {
    console.error('✗ call not found')
    process.exit(1)
  }

  const appointments = await getCollection('appointments')
  const actionItems = await getCollection('action_items')
  const leads = await getCollection('leads')

  const leadId = String(call.lead_id || '')
  const appt = await appointments.findOne({
    $or: [{ call_id: String(call._id) }, { lead_id: leadId }],
  })
  const lead = leadId && ObjectId.isValid(leadId) ? await leads.findOne({ _id: new ObjectId(leadId) }) : null
  const action = await actionItems.findOne({ lead_id: leadId })

  let pass = 0
  let fail = 0
  const c = (name: string, cond: boolean, detail?: string) => {
    if (cond) { pass++; console.log(`  ✓ ${name}`) }
    else { fail++; console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`) }
  }

  c('Appointment row exists', Boolean(appt))
  c('Appointment has a scheduled time', Boolean(appt?.scheduled_at || appt?.start_time || appt?.appointment_date))
  c('Appointment has duration / blocked window', Boolean(appt?.duration_minutes || appt?.end_time))
  c('Calendar event linked', Boolean(appt?.calendar_event_id || appt?.google_event_id))
  c('Action item exists for the lead', Boolean(action))
  c('Call row linked to the lead', Boolean(leadId))
  c('Tool event logged on the call', Array.isArray(call.tool_events) && call.tool_events.length > 0)
  c('Lead status reflects the booking', lead?.status === 'booked', lead?.status)
  c('Post-call reconcile ran', call.post_call_reconciled === true)

  console.log(`\n━━ ${pass} passed, ${fail} failed ━━`)
  console.log('Manual-only (check logs/WhatsApp store): overlap rejected, alternatives returned,')
  console.log('WhatsApp confirmation logged, duplicate WhatsApp blocked, lead lock released.\n')
  process.exit(fail === 0 ? 0 : 1)
}

async function main() {
  const verifyIdx = process.argv.indexOf('--verify')
  if (verifyIdx !== -1 && process.argv[verifyIdx + 1]) {
    await verifyBooking(process.argv[verifyIdx + 1])
    return
  }
  await printRunbook()
  process.exit(0)
}

main().catch((err) => {
  console.error('voice-regression crashed:', err)
  process.exit(1)
})
