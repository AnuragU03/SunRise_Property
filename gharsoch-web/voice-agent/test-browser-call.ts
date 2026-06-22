/**
 * test-browser-call.ts — talk to the voice agent from your browser, no SIP trunk needed.
 *
 * Creates a LiveKit room with the same metadata shape voiceRuntime.ts produces,
 * inserts a matching call row in Mongo (so transcripts/tools land on a real call
 * record), and prints a meet.livekit.io link — open it, allow the mic, and the
 * agent greets you exactly like a phone call.
 *
 * Prereqs: the worker must be running (npm run voice:agent).
 * Run:     npx tsx voice-agent/test-browser-call.ts [phone] [name] [call_type]
 * Example: npx tsx voice-agent/test-browser-call.ts +919876543210 "Anurag" reengage
 */
import 'dotenv/config'
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'
import { getCollection } from '@/lib/mongodb'

function normalizeHost(url: string) {
  return url.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://').replace(/\/$/, '')
}

async function main() {
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    console.error('LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET missing in .env')
    process.exit(1)
  }

  const customerPhone = process.argv[2] || '+919999999999'
  const customerName = process.argv[3] || 'Test Customer'
  const callType = process.argv[4] || 'outbound'
  const roomName = `web-test-${Date.now()}`

  const metadata = {
    room_name: roomName,
    voice_call_id: roomName,
    customer_name: customerName,
    customer_phone: customerPhone,
    language: process.env.VOICE_DEFAULT_LANGUAGE || 'hi-IN',
    call_type: callType,
    call_purpose: callType,
    agent_name: 'GharSoch Voice (browser test)',
    agent_id: 'gharsoch_voice_runtime',
    transport: 'webrtc',
    current_datetime_iso: new Date().toISOString(),
  }

  // 1. Room with call metadata (what the agent reads on dispatch)
  const rooms = new RoomServiceClient(normalizeHost(LIVEKIT_URL), LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
  await rooms.createRoom({ name: roomName, metadata: JSON.stringify(metadata), emptyTimeout: 120, maxParticipants: 3 })
  console.log('✓ room created:', roomName)

  // 2. Matching call row so transcripts + tool events land on a real record
  try {
    const calls = await getCollection('calls')
    const now = new Date()
    await calls.insertOne({
      lead_phone: customerPhone,
      lead_name: customerName,
      agent_name: 'GharSoch Voice (browser test)',
      agent_id: 'gharsoch_voice_runtime',
      direction: 'outbound',
      call_type: callType,
      duration: 0,
      transcript: '',
      call_status: 'queued',
      status: 'queued',
      voice_call_id: roomName,
      room_name: roomName,
      voice_provider: 'gharsoch_voice_runtime',
      voice_status: 'queued',
      tool_events: [],
      created_at: now,
      updated_at: now,
    } as any)
    console.log('✓ call record created (visible in Call Logs / Call Review)')
  } catch (err) {
    console.warn('⚠ could not create call record (agent still works):', (err as Error).message)
  }

  // 3. Join token for you
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity: `customer-test`, name: customerName })
  token.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true })
  const jwt = await token.toJwt()

  const meetUrl = `https://meet.livekit.io/custom?liveKitUrl=${encodeURIComponent(LIVEKIT_URL)}&token=${encodeURIComponent(jwt)}`
  console.log('\nOpen this in your browser, allow the microphone, and start talking:\n')
  console.log(meetUrl)
  console.log('\n(The worker must be running: npm run voice:agent — it auto-joins this room.)')
}

main().catch((err) => {
  console.error('FAILED:', err?.message || err)
  process.exit(1)
})
