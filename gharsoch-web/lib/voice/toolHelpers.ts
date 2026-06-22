import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const DB_NAME = process.env.MONGODB_DB || 'test'

export type VoiceToolPayload = {
  toolCallId: string
  toolName: string
  args: Record<string, any>
  metadata: Record<string, any>
  voiceCallId: string
  roomName: string
}

const ENVELOPE_KEYS = new Set([
  'tool_call_id',
  'toolCallId',
  'tool_name',
  'toolName',
  'name',
  'args',
  'arguments',
  'metadata',
  'voice_call_id',
  'voiceCallId',
  'room_name',
  'roomName',
  'call_id',
  'callId',
])

function parseArgs(value: any): Record<string, any> {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return {}
    }
  }
  return typeof value === 'object' ? value : {}
}

function argsFromFlatBody(body: Record<string, any>) {
  return Object.fromEntries(Object.entries(body).filter(([key]) => !ENVELOPE_KEYS.has(key)))
}

export function extractVoiceToolPayload(body: any, routeToolName?: string): VoiceToolPayload {
  const message = body?.message || body || {}
  const toolCall = Array.isArray(message.toolCalls) ? message.toolCalls[0] : null
  const functionCall = message.function || toolCall?.function || {}
  const metadata = message.metadata || body?.metadata || message.call?.metadata || {}
  const args = parseArgs(
    message.args ||
    body?.args ||
    message.arguments ||
    body?.arguments ||
    functionCall.arguments ||
    argsFromFlatBody(body || {})
  )

  const toolName =
    routeToolName ||
    message.tool_name ||
    body?.tool_name ||
    message.toolName ||
    body?.toolName ||
    functionCall.name ||
    message.name ||
    ''

  const voiceCallId =
    message.voice_call_id ||
    body?.voice_call_id ||
    message.voiceCallId ||
    body?.voiceCallId ||
    message.room_name ||
    body?.room_name ||
    message.roomName ||
    body?.roomName ||
    message.call_id ||
    body?.call_id ||
    message.callId ||
    body?.callId ||
    metadata.voice_call_id ||
    metadata.room_name ||
    metadata.call_id ||
    ''

  const roomName =
    message.room_name ||
    body?.room_name ||
    message.roomName ||
    body?.roomName ||
    metadata.room_name ||
    voiceCallId

  return {
    toolCallId: message.tool_call_id || body?.tool_call_id || message.toolCallId || body?.toolCallId || toolCall?.id || '',
    toolName,
    args,
    metadata,
    voiceCallId,
    roomName,
  }
}

export function voiceToolSuccess(payload: Pick<VoiceToolPayload, 'toolCallId' | 'toolName'>, result: any): NextResponse {
  return NextResponse.json({
    ok: true,
    tool_call_id: payload.toolCallId,
    tool_name: payload.toolName,
    result,
  })
}

export function voiceToolError(payload: Pick<VoiceToolPayload, 'toolCallId' | 'toolName'>, message: string, status = 200): NextResponse {
  return NextResponse.json({
    ok: false,
    tool_call_id: payload.toolCallId,
    tool_name: payload.toolName,
    error: message,
    result: `Error: ${message}`,
  }, { status })
}

function objectIdQuery(id: string) {
  return ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id as any }
}

export async function resolveVoiceCallContext(
  voiceCallId: string,
  metadata: Record<string, any>
): Promise<{
  broker_id: string | null
  lead_id: string | null
  lead: any | null
  call_doc_id: string | null
  call: any | null
}> {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  let broker_id: string | null = metadata.broker_id || metadata.brokerage_id || null
  let lead_id: string | null = metadata.lead_id || metadata.customer_id || null
  let lead: any = null
  let call: any = null
  let call_doc_id: string | null = metadata.call_doc_id || null

  if (voiceCallId || metadata.room_name || metadata.live_session_id) {
    call = await db.collection('calls').findOne({
      $or: [
        { voice_call_id: voiceCallId },
        { room_name: voiceCallId },
        { live_session_id: voiceCallId },
        { room_name: metadata.room_name },
        { voice_call_id: metadata.voice_call_id },
        { live_session_id: metadata.live_session_id },
      ].filter((item) => Object.values(item)[0]),
    })

    if (call) {
      call_doc_id = String(call._id)
      if (!broker_id && call.broker_id) broker_id = String(call.broker_id)
      if (!lead_id && call.lead_id) lead_id = String(call.lead_id)
    }
  }

  if (!call && call_doc_id && ObjectId.isValid(call_doc_id)) {
    call = await db.collection('calls').findOne({ _id: new ObjectId(call_doc_id) })
    if (call) {
      if (!broker_id && call.broker_id) broker_id = String(call.broker_id)
      if (!lead_id && call.lead_id) lead_id = String(call.lead_id)
    }
  }

  if (lead_id) {
    lead = await db.collection('leads').findOne(objectIdQuery(lead_id))
    if (lead && !broker_id && lead.broker_id) broker_id = String(lead.broker_id)
  }

  if (!lead && (metadata.customer_phone || call?.lead_phone)) {
    lead = await db.collection('leads').findOne({ phone: metadata.customer_phone || call.lead_phone })
    if (lead) {
      lead_id = String(lead._id)
      if (!broker_id && lead.broker_id) broker_id = String(lead.broker_id)
    }
  }

  return { broker_id, lead_id, lead, call_doc_id, call }
}

export async function recordVoiceToolEvent(
  voiceCallId: string,
  event: {
    tool_name: string
    args_summary?: string
    result_summary?: string
    success: boolean
  }
): Promise<void> {
  if (!voiceCallId) return

  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    await db.collection('calls').updateOne(
      {
        $or: [
          { voice_call_id: voiceCallId },
          { room_name: voiceCallId },
          { live_session_id: voiceCallId },
        ],
      },
      {
        $push: {
          tool_events: {
            ...event,
            occurred_at: new Date(),
          },
        },
      }
    )
  } catch (err) {
    console.error('[VoiceToolHelpers] Failed to record tool event:', err)
  }
}
