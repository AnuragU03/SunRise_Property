/**
 * POST /api/voice/call-completed
 *
 * Cross-process event bridge. The voice agent worker (separate process) POSTs
 * here when a call finishes. This endpoint emits 'call:completed' on the
 * Next.js-process event bus, which the sequential call queue (start-calls)
 * is listening to — enabling true push-based call chaining with no polling.
 *
 * Body: { voiceCallId: string, roomName: string, durationSeconds?: number, outcome?: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { callEventBus } from '@/lib/callEvents'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { voiceCallId, roomName, durationSeconds = 0, outcome = '' } = body

    if (!voiceCallId && !roomName) {
      return NextResponse.json({ ok: false, error: 'voiceCallId or roomName required' }, { status: 400 })
    }

    // Emit on the Next.js-process event bus — the start-calls loop is awaiting this
    callEventBus.emit('call:completed', {
      voiceCallId: voiceCallId || roomName,
      roomName: roomName || voiceCallId,
      durationSeconds,
      outcome,
    })

    console.log(`[call-completed] event emitted for ${voiceCallId || roomName}`)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
