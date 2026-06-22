import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

function validateVoiceEventRequest(request: NextRequest) {
  const secret = process.env.VOICE_RUNTIME_SECRET
  if (!secret) return null

  const header = request.headers.get('x-voice-runtime-secret') || request.headers.get('x-cron-secret')
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''

  if (header === secret || bearer === secret) return null
  return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
}

function identityFilter(identity: string) {
  return {
    $or: [
      { voice_call_id: identity },
      { room_name: identity },
      { live_session_id: identity },
    ],
  }
}

function transcriptLine(body: any) {
  const role = body.role || body.speaker || 'unknown'
  const text = body.text || body.transcript || body.message || ''
  if (!text) return ''
  return `${role === 'assistant' || role === 'agent' ? 'Agent' : 'Customer'}: ${text}`
}

export async function POST(request: NextRequest) {
  try {
    const authError = validateVoiceEventRequest(request)
    if (authError) return authError

    const body = await request.json()
    const identity = body.voice_call_id || body.room_name || body.call_id || body.live_session_id
    if (!identity) {
      return NextResponse.json({ ok: false, error: 'voice_call_id or room_name is required' }, { status: 400 })
    }

    const calls = await getCollection('calls')
    const existing = await calls.findOne(identityFilter(identity))
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'call_not_found' }, { status: 404 })
    }

    const eventType = body.type || body.event || body.event_type || 'status'
    const now = new Date()
    const setDoc: Record<string, any> = {
      updated_at: now,
      voice_call_id: existing.voice_call_id || identity,
      room_name: existing.room_name || body.room_name || identity,
    }

    if (eventType === 'call_started' || eventType === 'started') {
      setDoc.call_status = 'in-progress'
      setDoc.status = 'in-progress'
      setDoc.voice_status = 'active'
      setDoc.started_at = body.started_at ? new Date(body.started_at) : now
    }

    if (eventType === 'status') {
      setDoc.call_status = body.status || existing.call_status || 'in-progress'
      setDoc.status = body.status || existing.status || 'in-progress'
      setDoc.voice_status = body.voice_status || body.status || existing.voice_status || 'active'
    }

    if (eventType === 'transcript') {
      const line = transcriptLine(body)
      if (line) {
        setDoc.transcript = existing.transcript ? `${existing.transcript}\n${line}` : line
      }
    }

    if (eventType === 'call_ended' || eventType === 'ended' || eventType === 'end_of_call_report') {
      setDoc.call_status = 'completed'
      setDoc.status = 'completed'
      setDoc.voice_status = 'completed'
      setDoc.ended_at = body.ended_at ? new Date(body.ended_at) : now
      setDoc.duration = Number(body.duration || body.duration_seconds || existing.duration || 0)
      setDoc.call_summary = body.summary || body.call_summary || existing.call_summary || ''
      setDoc.call_outcome = body.outcome || body.call_outcome || existing.call_outcome || ''
      setDoc.disposition = body.disposition || existing.disposition || ''
      setDoc.recording_url = body.recording_url || body.recordingUrl || existing.recording_url || ''
      if (body.transcript) setDoc.transcript = body.transcript
    }

    await calls.updateOne(
      { _id: existing._id },
      {
        $set: setDoc,
        $push: {
          voice_events: {
            type: eventType,
            payload: body,
            occurred_at: now,
          },
        },
      }
    )

    return NextResponse.json({ ok: true, call_id: String(existing._id), voice_call_id: identity })
  } catch (error: any) {
    console.error('[VoiceEvents] Error:', error)
    return NextResponse.json({ ok: false, error: error.message || 'Voice event failed' }, { status: 500 })
  }
}
