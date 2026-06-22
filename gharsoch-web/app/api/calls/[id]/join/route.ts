/**
 * GET /api/calls/[id]/join — mint a browser join token for a WebRTC test call.
 *
 * Lets the GharSoch UI answer the call as the customer (in-app call console)
 * instead of bouncing through the external meet.livekit.io link. The [id]
 * accepts either the call's Mongo _id or its room name (voice_call_id) —
 * trigger responses hand the UI the room name, while polled call docs carry _id.
 *
 * Token identity mirrors the original join_url token (customer-<phone>), so
 * answering in-app simply takes over the customer seat the agent is waiting on.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { AccessToken } from 'livekit-server-sdk'
import { authErrorResponse, requireSession } from '@/lib/auth'
import { getCollection } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

const ENDED_STATUSES = ['completed', 'ended', 'failed', 'missed', 'no-answer']

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSession()

    const LIVEKIT_URL = process.env.LIVEKIT_URL || ''
    const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || ''
    const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || ''
    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return NextResponse.json({ success: false, error: 'LiveKit not configured' }, { status: 503 })
    }

    const { id } = params
    const calls = await getCollection('calls')
    const call = ObjectId.isValid(id)
      ? await calls.findOne({ _id: new ObjectId(id) })
      : await calls.findOne({ $or: [{ room_name: id }, { voice_call_id: id }] })

    if (!call) {
      return NextResponse.json({ success: false, error: 'Call not found' }, { status: 404 })
    }

    const roomName = String(call.room_name || call.voice_call_id || '')
    if (!roomName) {
      return NextResponse.json({ success: false, error: 'Call has no room' }, { status: 400 })
    }

    const status = String(call.call_status || call.status || '').toLowerCase()
    if (ENDED_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: `Call already ${status}` }, { status: 409 })
    }

    // In-app answering is for the WebRTC test transport; SIP calls ring a real phone.
    const isWebrtc = String(call.voice_status || '') === 'webrtc_ready' || Boolean(call.join_url)
    if (!isWebrtc) {
      return NextResponse.json(
        { success: false, error: 'Not a WebRTC test call — this call dials a real phone' },
        { status: 409 }
      )
    }

    const phoneDigits = String(call.lead_phone || '').replace(/\D/g, '') || 'unknown'
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: `customer-${phoneDigits}`,
      name: String(call.lead_name || 'Customer'),
      ttl: '1h',
    })
    token.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true })

    return NextResponse.json({
      success: true,
      url: LIVEKIT_URL,
      token: await token.toJwt(),
      roomName,
      callDocId: String(call._id),
    })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('[API/Calls/Join] Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
