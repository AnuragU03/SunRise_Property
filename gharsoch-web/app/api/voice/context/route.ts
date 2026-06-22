import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { resolveVoiceCallContext } from '@/lib/voice/toolHelpers'

export const dynamic = 'force-dynamic'

const DB_NAME = process.env.MONGODB_DB || 'test'

/**
 * GET /api/voice/context?voice_call_id=...&room_name=...
 *
 * The Python voice worker calls this to hydrate its system prompt with rich,
 * per-lead business context (the prompt "backbone" lives in the worker; this
 * supplies the variable data it needs). Secured by VOICE_RUNTIME_SECRET.
 */
function validate(request: NextRequest) {
  const secret = process.env.VOICE_RUNTIME_SECRET
  if (!secret) return null // unset → open (dev); set it in any shared/prod env
  const header = request.headers.get('x-voice-runtime-secret') || request.headers.get('x-cron-secret')
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''
  if (header === secret || bearer === secret) return null
  return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
}

function nowIst() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

export async function GET(request: NextRequest) {
  try {
    const authError = validate(request)
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const voiceCallId = searchParams.get('voice_call_id') || searchParams.get('call_id') || ''
    const roomName = searchParams.get('room_name') || ''
    if (!voiceCallId && !roomName) {
      return NextResponse.json({ ok: false, error: 'voice_call_id or room_name is required' }, { status: 400 })
    }

    const { broker_id, lead_id, lead, call } = await resolveVoiceCallContext(voiceCallId || roomName, {
      room_name: roomName || undefined,
      voice_call_id: voiceCallId || undefined,
    })

    if (!lead) {
      return NextResponse.json({ ok: false, error: 'context_not_found' }, { status: 404 })
    }

    const db = (await clientPromise).db(DB_NAME)

    const propertyId = lead.matched_property_id || call?.matched_property_id || lead.last_visit_property_id
    const [property, broker] = await Promise.all([
      propertyId && ObjectId.isValid(String(propertyId))
        ? db.collection('properties').findOne({ _id: new ObjectId(String(propertyId)) })
        : null,
      broker_id && ObjectId.isValid(String(broker_id))
        ? db.collection('users').findOne({ _id: new ObjectId(String(broker_id)) })
        : null,
    ])

    return NextResponse.json({
      ok: true,
      context: {
        lead_id,
        broker_id,
        customer_name: lead.name || '',
        customer_phone: lead.phone || '',
        preferred_language: lead.preferred_language || '',
        budget_range: lead.budget_range || '',
        location_pref: lead.location_pref || '',
        property_type: lead.property_type || '',
        lead_status: lead.status || '',
        last_visit_property: lead.last_visit_property || property?.title || '',
        last_visit_type: lead.last_visit_type || '',
        last_visit_summary: lead.last_visit_summary || '',
        last_call_summary: lead.last_call_summary || call?.call_summary || '',
        matched_property: property
          ? {
              id: String(property._id),
              title: property.title || '',
              location: property.location || '',
              price: property.price ?? null,
              builder: property.builder || property.builder_name || '',
              bhk: property.bhk || property.bedrooms || '',
            }
          : null,
        broker_name: broker?.name || 'Aapka broker',
        broker_phone: broker?.phone || '',
        current_datetime_ist: nowIst(),
        current_datetime_iso: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('[VoiceContext] Error:', error)
    return NextResponse.json({ ok: false, error: error.message || 'context_failed' }, { status: 500 })
  }
}
