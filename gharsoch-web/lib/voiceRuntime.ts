import { AccessToken, RoomServiceClient, SipClient } from 'livekit-server-sdk'
import type { Room, SIPParticipantInfo } from 'livekit-server-sdk'
import { getCollection } from '@/lib/mongodb'
import { startCallRecording } from '@/lib/voiceRecording'
import { checkDnd, logDndScrubEvent } from '@/lib/services/dndScrubService'

type VoiceOperation = 'triggerOutboundCall' | 'getCallDetails' | 'endCall' | 'listActiveCalls'

export type VoiceLogHook = (event: {
  stage: 'request' | 'response' | 'error' | 'validation_error'
  operation: VoiceOperation
  endpoint: string
  timestamp: string
  request?: Record<string, any>
  response?: Record<string, any>
  error?: { message: string; name?: string }
}) => void

export type TriggerVoiceCallParams = {
  assistantId?: string
  customerPhone: string
  customerName?: string
  language?: 'hi-IN' | 'en-IN' | 'mr-IN' | 'hi-EN' | 'unknown' | string
  callType?: string
  agentName?: string
  agentId?: string
  leadId?: string
  campaignId?: string
  metadata?: Record<string, string>
}

export type VoiceCallResponse = {
  success: boolean
  callId?: string
  voiceCallId?: string
  roomName?: string
  callDocId?: string
  sipParticipantId?: string
  status?: string
  error?: string
  /** WebRTC transport only: browser link to join the call as the customer. */
  joinUrl?: string
}

const LIVEKIT_URL = process.env.LIVEKIT_URL || ''
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || ''
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || ''
const SIP_OUTBOUND_TRUNK_ID = process.env.SIP_OUTBOUND_TRUNK_ID || ''
const DEFAULT_LANGUAGE = process.env.VOICE_DEFAULT_LANGUAGE || 'hi-IN'
/**
 * Call transport:
 *  - 'sip'    (default) — dial the customer's phone via the SIP trunk.
 *  - 'webrtc' — TEST MODE: no PSTN dial. Creates the room + call record and a
 *    browser join link (meet.livekit.io) so a human can play the customer.
 *    Lets cron/agent/booking/calendar flows run end-to-end without a carrier.
 */
const VOICE_TRANSPORT = (process.env.VOICE_TRANSPORT || 'sip').toLowerCase()

function stripHonorifics(name: string): string {
  return name
    .replace(/^(Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Shri\.?|Smt\.?|Prof\.?)\s+/i, '')
    .trim()
}

function sanitizePhoneForRoom(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return digits || 'unknown'
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length <= 4) return '****'
  return `***${digits.slice(-4)}`
}

function normalizeLiveKitHost(url: string) {
  return url
    .replace(/^wss:\/\//i, 'https://')
    .replace(/^ws:\/\//i, 'http://')
    .replace(/\/$/, '')
}

function buildRoomName(params: TriggerVoiceCallParams) {
  const type = (params.callType || 'outbound').replace(/[^a-z0-9_-]/gi, '-').toLowerCase()
  return `call-${type}-${sanitizePhoneForRoom(params.customerPhone)}-${Date.now()}`
}

function buildDateTimeVariables() {
  const now = new Date()
  const istHuman = now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return {
    current_datetime_iso: now.toISOString(),
    current_date_human_ist: istHuman,
  }
}

function buildRoomMetadata(params: TriggerVoiceCallParams, roomName: string, callDocId?: string) {
  const cleanName = params.customerName ? stripHonorifics(params.customerName) : 'Customer'
  return {
    room_name: roomName,
    voice_call_id: roomName,
    call_doc_id: callDocId || '',
    customer_name: cleanName,
    customer_phone: params.customerPhone,
    language: params.language || DEFAULT_LANGUAGE,
    call_type: params.callType || 'outbound',
    agent_name: params.agentName || 'GharSoch Voice',
    agent_id: params.agentId || 'gharsoch_voice_runtime',
    lead_id: params.leadId || params.metadata?.lead_id || '',
    campaign_id: params.campaignId || params.metadata?.campaign_id || '',
    gharsoch_api_base: process.env.GHARSOCH_API_BASE || process.env.NEXT_PUBLIC_APP_URL || '',
    ...buildDateTimeVariables(),
    ...(params.metadata || {}),
  }
}

function getConfigError() {
  if (!LIVEKIT_URL) return 'LIVEKIT_URL not configured'
  if (!LIVEKIT_API_KEY) return 'LIVEKIT_API_KEY not configured'
  if (!LIVEKIT_API_SECRET) return 'LIVEKIT_API_SECRET not configured'
  return null
}

function getRoomClient() {
  return new RoomServiceClient(normalizeLiveKitHost(LIVEKIT_URL), LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
}

function getSipClient() {
  return new SipClient(normalizeLiveKitHost(LIVEKIT_URL), LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
}

async function insertCallRecord(params: TriggerVoiceCallParams, roomName: string, status: string, voiceStatus: string, error?: string) {
  const calls = await getCollection('calls')
  const now = new Date()
  const doc = {
    lead_id: params.leadId || params.metadata?.lead_id || '',
    lead_name: params.customerName || params.metadata?.customer_name || '',
    lead_phone: params.customerPhone,
    agent_name: params.agentName || 'GharSoch Voice',
    agent_id: params.agentId || 'gharsoch_voice_runtime',
    campaign_id: params.campaignId || params.metadata?.campaign_id || '',
    direction: 'outbound',
    call_type: params.callType || 'outbound',
    duration: 0,
    disposition: '',
    call_outcome: '',
    call_summary: '',
    customer_availability: '',
    preferred_callback_time: '',
    preferred_callback_days: [],
    customer_interest_level: '',
    follow_up_required: false,
    follow_up_date: null,
    follow_up_notes: '',
    key_requirements: '',
    customer_objections: '',
    next_steps: '',
    recording_url: '',
    transcript: '',
    trai_compliant: true,
    call_status: status,
    status,
    failure_reason: error,
    vapi_call_id: '',
    voice_call_id: roomName,
    room_name: roomName,
    live_session_id: '',
    voice_provider: 'gharsoch_voice_runtime',
    voice_status: voiceStatus,
    sip_participant_id: null,
    voice_error: error || null,
    tool_events: [],
    intervention_events: [],
    created_at: now,
    updated_at: now,
  }

  const result = await calls.insertOne(doc)
  return String(result.insertedId)
}

async function updateCallRecord(roomName: string, patch: Record<string, any>) {
  const calls = await getCollection('calls')
  await calls.updateOne(
    { room_name: roomName },
    { $set: { ...patch, updated_at: new Date() } }
  )
}

export async function triggerOutboundCall(
  params: TriggerVoiceCallParams,
  opts?: { logHook?: VoiceLogHook; waitUntilAnswered?: boolean }
): Promise<VoiceCallResponse> {
  const endpoint = 'livekit:sip:createSipParticipant'
  const roomName = buildRoomName(params)

  if (!params.customerPhone) {
    opts?.logHook?.({
      stage: 'validation_error',
      operation: 'triggerOutboundCall',
      endpoint,
      timestamp: new Date().toISOString(),
      error: { message: 'customerPhone is required', name: 'ValidationError' },
    })
    return { success: false, status: 'validation_error', error: 'customerPhone is required' }
  }

  // ── DND Scrub Gate: check NCPR/DND registry before dialing ──────────────
  const dndResult = await checkDnd(params.customerPhone)
  void logDndScrubEvent({
    phone: params.customerPhone,
    result: dndResult,
    callType: params.callType || 'outbound',
    leadId: params.leadId,
    campaignId: params.campaignId,
  })

  if (dndResult.isDnd) {
    const dndError = `DND blocked: number is registered on NCPR (source: ${dndResult.source})`
    const callDocId = await insertCallRecord(params, roomName, 'blocked_dnd', 'blocked_dnd', dndError)
    opts?.logHook?.({
      stage: 'validation_error',
      operation: 'triggerOutboundCall',
      endpoint,
      timestamp: new Date().toISOString(),
      error: { message: dndError, name: 'DndBlocked' },
      request: { roomName, customerPhoneMasked: maskPhone(params.customerPhone) },
    })
    return { success: false, callId: roomName, voiceCallId: roomName, roomName, callDocId, status: 'blocked_dnd', error: dndError }
  }
  // ── End DND Scrub Gate ──────────────────────────────────────────────────

  const configError = getConfigError()
  if (configError) {
    const callDocId = await insertCallRecord(params, roomName, 'failed', 'failed', configError)
    opts?.logHook?.({
      stage: 'validation_error',
      operation: 'triggerOutboundCall',
      endpoint,
      timestamp: new Date().toISOString(),
      error: { message: configError, name: 'ConfigError' },
      request: { roomName, customerPhoneMasked: maskPhone(params.customerPhone) },
    })
    return { success: false, callId: roomName, voiceCallId: roomName, roomName, callDocId, status: 'failed', error: configError }
  }

  // ── WebRTC test transport: no PSTN dial, browser joins as the customer ────
  if (VOICE_TRANSPORT === 'webrtc') {
    const callDocId = await insertCallRecord(params, roomName, 'queued', 'webrtc_ready')
    const metadata: Record<string, any> = { ...buildRoomMetadata(params, roomName, callDocId), transport: 'webrtc' }
    const cleanName = params.customerName ? stripHonorifics(params.customerName) : 'Customer'

    try {
      await getRoomClient().createRoom({
        name: roomName,
        metadata: JSON.stringify(metadata),
        emptyTimeout: 300,
        maxParticipants: 3,
      })

      const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity: `customer-${sanitizePhoneForRoom(params.customerPhone)}`,
        name: cleanName,
        ttl: '1h',
      })
      token.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true })
      const jwt = await token.toJwt()
      const joinUrl = `https://meet.livekit.io/custom?liveKitUrl=${encodeURIComponent(LIVEKIT_URL)}&token=${encodeURIComponent(jwt)}`

      await updateCallRecord(roomName, {
        call_status: 'webrtc_ready',
        status: 'webrtc_ready',
        voice_status: 'webrtc_ready',
        join_url: joinUrl,
        // Pre-call brief: exactly what the agent received — surfaced in Call Review
        call_brief: metadata,
      })

      // Recording is best-effort: no-op until Azure storage is configured.
      void startCallRecording(roomName, callDocId)

      opts?.logHook?.({
        stage: 'response',
        operation: 'triggerOutboundCall',
        endpoint: 'livekit:webrtc:createRoom',
        timestamp: new Date().toISOString(),
        response: { ok: true, roomName, callDocId, transport: 'webrtc' },
      })

      return { success: true, callId: roomName, voiceCallId: roomName, roomName, callDocId, status: 'webrtc_ready', joinUrl }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'WebRTC room creation failed'
      await updateCallRecord(roomName, {
        call_status: 'failed',
        status: 'failed',
        voice_status: 'failed',
        voice_error: message,
        failure_reason: message,
      })
      return { success: false, callId: roomName, voiceCallId: roomName, roomName, callDocId, status: 'failed', error: message }
    }
  }

  if (!SIP_OUTBOUND_TRUNK_ID) {
    const error = 'SIP_OUTBOUND_TRUNK_ID not configured'
    const callDocId = await insertCallRecord(params, roomName, 'failed', 'trunk_missing', error)
    opts?.logHook?.({
      stage: 'validation_error',
      operation: 'triggerOutboundCall',
      endpoint,
      timestamp: new Date().toISOString(),
      error: { message: error, name: 'TrunkMissing' },
      request: { roomName, customerPhoneMasked: maskPhone(params.customerPhone) },
    })
    return { success: false, callId: roomName, voiceCallId: roomName, roomName, callDocId, status: 'trunk_missing', error }
  }

  const callDocId = await insertCallRecord(params, roomName, 'queued', 'queued')
  const metadata = buildRoomMetadata(params, roomName, callDocId)

  opts?.logHook?.({
    stage: 'request',
    operation: 'triggerOutboundCall',
    endpoint,
    timestamp: new Date().toISOString(),
    request: {
      roomName,
      callDocId,
      customerPhoneMasked: maskPhone(params.customerPhone),
      metadataKeys: Object.keys(metadata),
    },
  })

  try {
    const roomClient = getRoomClient()
    const sipClient = getSipClient()

    await roomClient.createRoom({
      name: roomName,
      metadata: JSON.stringify(metadata),
      emptyTimeout: 60,
      maxParticipants: 3,
    })

    await updateCallRecord(roomName, {
      call_status: 'room_created',
      status: 'room_created',
      voice_status: 'room_created',
      // Pre-call brief: exactly what the agent received — surfaced in Call Review
      call_brief: metadata,
    })

    // Recording is best-effort: no-op until Azure storage is configured.
    void startCallRecording(roomName, callDocId)

    const cleanName = params.customerName ? stripHonorifics(params.customerName) : 'Customer'
    const participant = await sipClient.createSipParticipant(
      SIP_OUTBOUND_TRUNK_ID,
      params.customerPhone,
      roomName,
      {
        participantIdentity: `customer-${sanitizePhoneForRoom(params.customerPhone)}`,
        participantName: cleanName,
        participantMetadata: JSON.stringify({
          customer_name: cleanName,
          customer_phone: params.customerPhone,
          call_doc_id: callDocId,
          voice_call_id: roomName,
        }),
        // Production default: return as soon as the dial is handed off (fire-and-forget).
        // Diagnostic mode: wait for the SIP dialog to answer/reject so the real result
        // (e.g. a 403 from the carrier) surfaces instead of an optimistic "dialing".
        waitUntilAnswered: opts?.waitUntilAnswered === true,
      }
    ) as SIPParticipantInfo

    await updateCallRecord(roomName, {
      call_status: 'dialing',
      status: 'dialing',
      voice_status: 'dialing',
      sip_participant_id: participant?.participantId || participant?.participantIdentity || null,
    })

    opts?.logHook?.({
      stage: 'response',
      operation: 'triggerOutboundCall',
      endpoint,
      timestamp: new Date().toISOString(),
      response: {
        ok: true,
        roomName,
        callDocId,
        sipParticipantId: participant?.participantId || participant?.participantIdentity,
      },
    })

    return {
      success: true,
      callId: roomName,
      voiceCallId: roomName,
      roomName,
      callDocId,
      sipParticipantId: participant?.participantId || participant?.participantIdentity,
      status: 'dialing',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'LiveKit call dispatch failed'
    await updateCallRecord(roomName, {
      call_status: 'failed',
      status: 'failed',
      voice_status: 'failed',
      voice_error: message,
      failure_reason: message,
    })
    opts?.logHook?.({
      stage: 'error',
      operation: 'triggerOutboundCall',
      endpoint,
      timestamp: new Date().toISOString(),
      error: { message, name: error instanceof Error ? error.name : 'LiveKitError' },
    })
    return { success: false, callId: roomName, voiceCallId: roomName, roomName, callDocId, status: 'failed', error: message }
  }
}

export async function triggerCampaignCall(lead: {
  phone: string
  name: string
  budget_range?: string
  location_pref?: string
  property_type?: string
  notes?: string
  _id?: string
}, campaignContext?: {
  campaign_name?: string
  script_template?: string
  _id?: string
  campaign_id?: string
}, propertiesContext?: string, matchedProperty?: {
  title?: string
  location?: string
  bhk?: string
  price_range?: string
  builder?: string
}, opts?: { logHook?: VoiceLogHook }): Promise<VoiceCallResponse> {
  return triggerOutboundCall({
    customerPhone: lead.phone,
    customerName: lead.name,
    callType: 'campaign',
    agentName: 'Campaign Conductor',
    agentId: 'campaign_conductor',
    leadId: lead._id,
    campaignId: campaignContext?.campaign_id || campaignContext?._id,
    metadata: {
      call_purpose: 'campaign',
      customer_name: lead.name,
      customer_phone: lead.phone,
      budget_range: lead.budget_range || 'Not specified',
      location_pref: lead.location_pref || 'Not specified',
      property_type: lead.property_type || 'Not specified',
      previous_notes: lead.notes || 'First contact',
      campaign_name: campaignContext?.campaign_name || 'Direct outreach',
      script_template: campaignContext?.script_template || 'General property inquiry',
      premium_properties_context: propertiesContext || 'No specific premium properties listed.',
      property_title: matchedProperty?.title || 'aapke requirements ke saath match karne wali property',
      property_location: matchedProperty?.location || '',
      property_bhk: matchedProperty?.bhk || '',
      property_price: matchedProperty?.price_range || '',
      property_builder: matchedProperty?.builder || '',
    },
  }, opts)
}

export async function triggerReengageCall(params: {
  phone: string
  name: string
  visitType: string
  lastVisitProperty: string
  lastVisitPropertyLocation?: string
  lastVisitDateHuman: string
  daysSinceVisit: number
  lastVisitSummary?: string
  propertyType?: string
  locationPref?: string
  budgetRange?: string
  brokerName?: string
  brokerPhone?: string
  leadId?: string
  // Corpus playbook context (all optional — prompt degrades gracefully without them)
  minCarpetSqft?: number | string
  facingPref?: string
  areaReason?: string
  objectionHistory?: string
  propertyCarpetSqft?: number | string
  propertyFloor?: number | string
  propertyFacing?: string
  propertyAskPrice?: string
  sellerUrgency?: string
  // Generic warm mode (no per-lead history — the 5000-warm-lead reality):
  // when true, the prompt uses the deliberately generic 4-step warm playbook
  // and pitches genericInventoryPitch instead of a specific past property.
  warmGeneric?: boolean
  genericInventoryPitch?: string
}, opts?: { logHook?: VoiceLogHook }): Promise<VoiceCallResponse> {
  return triggerOutboundCall({
    customerPhone: params.phone,
    customerName: params.name,
    callType: 'reengage',
    agentName: 'The Dead Lead Re-engager',
    agentId: 'dead_lead_reengager',
    leadId: params.leadId,
    metadata: {
      call_purpose: 'reengage',
      warm_generic: params.warmGeneric ? 'true' : '',
      generic_inventory_pitch: params.genericInventoryPitch || '',
      customer_name: params.name,
      visit_type: params.visitType,
      last_visit_property: params.lastVisitProperty,
      last_visit_property_location: params.lastVisitPropertyLocation || '',
      last_visit_date_human: params.lastVisitDateHuman,
      days_since_visit: String(params.daysSinceVisit),
      last_visit_summary: params.lastVisitSummary || '',
      property_type: params.propertyType || '',
      location_pref: params.locationPref || '',
      budget_range: params.budgetRange || '',
      broker_name: params.brokerName || 'Aapka broker',
      broker_phone: params.brokerPhone || '',
      min_carpet_sqft: params.minCarpetSqft ? String(params.minCarpetSqft) : '',
      facing_pref: params.facingPref || '',
      area_reason: params.areaReason || '',
      objection_history: params.objectionHistory || '',
      property_carpet_sqft: params.propertyCarpetSqft ? String(params.propertyCarpetSqft) : '',
      property_floor: params.propertyFloor ? String(params.propertyFloor) : '',
      property_facing: params.propertyFacing || '',
      property_ask_price: params.propertyAskPrice || '',
      seller_urgency: params.sellerUrgency || '',
    },
  }, opts)
}

export async function triggerReminderCall(params: {
  phone: string
  name?: string
  variables?: Record<string, string>
}, opts?: { logHook?: VoiceLogHook }): Promise<VoiceCallResponse> {
  return triggerOutboundCall({
    customerPhone: params.phone,
    customerName: params.name,
    callType: 'appointment_reminder',
    agentName: 'The Appointment Guardian',
    agentId: 'appointment_guardian',
    leadId: params.variables?.lead_id,
    metadata: {
      call_purpose: 'appointment_reminder',
      ...(params.variables || {}),
    },
  }, opts)
}

export async function triggerCallbackCall(params: {
  phone: string
  name?: string
  variables?: Record<string, string>
}, opts?: { logHook?: VoiceLogHook }): Promise<VoiceCallResponse> {
  return triggerOutboundCall({
    customerPhone: params.phone,
    customerName: params.name,
    callType: 'follow_up_callback',
    agentName: 'The Follow-Up Agent',
    agentId: 'follow_up_agent',
    leadId: params.variables?.lead_id,
    metadata: {
      call_purpose: 'follow_up_callback',
      ...(params.variables || {}),
    },
  }, opts)
}

export async function getCallDetails(roomName: string, opts?: { logHook?: VoiceLogHook }) {
  const endpoint = 'livekit:room:listRooms'
  const configError = getConfigError()
  if (configError || !roomName) return null

  try {
    opts?.logHook?.({
      stage: 'request',
      operation: 'getCallDetails',
      endpoint,
      timestamp: new Date().toISOString(),
      request: { roomName },
    })

    const rooms = await getRoomClient().listRooms([roomName])
    const room = rooms[0] as Room | undefined

    opts?.logHook?.({
      stage: 'response',
      operation: 'getCallDetails',
      endpoint,
      timestamp: new Date().toISOString(),
      response: { ok: Boolean(room), roomName },
    })

    return room || null
  } catch {
    return null
  }
}

export async function endCall(roomName: string, opts?: { logHook?: VoiceLogHook }) {
  const endpoint = 'livekit:room:deleteRoom'
  const configError = getConfigError()
  if (configError) return { success: false, error: configError }
  if (!roomName) return { success: false, error: 'roomName is required' }

  try {
    opts?.logHook?.({
      stage: 'request',
      operation: 'endCall',
      endpoint,
      timestamp: new Date().toISOString(),
      request: { roomName },
    })

    await getRoomClient().deleteRoom(roomName)
    await updateCallRecord(roomName, {
      call_status: 'completed',
      status: 'completed',
      voice_status: 'completed',
    })
    return { success: true, roomName, status: 'completed' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to end LiveKit room'
    return { success: false, roomName, status: 'failed', error: message }
  }
}

export async function listActiveCalls(opts?: { logHook?: VoiceLogHook }) {
  const endpoint = 'livekit:room:listRooms'
  const configError = getConfigError()
  if (configError) return { success: false, error: configError, rooms: [] }

  try {
    opts?.logHook?.({
      stage: 'request',
      operation: 'listActiveCalls',
      endpoint,
      timestamp: new Date().toISOString(),
    })
    const rooms = await getRoomClient().listRooms()
    return { success: true, rooms }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list LiveKit rooms'
    return { success: false, error: message, rooms: [] }
  }
}
