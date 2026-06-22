/**
 * inbound.ts — context bootstrap for inbound calls (restoration item C).
 *
 * Outbound rooms are created by lib/voiceRuntime with a full call brief in the
 * room metadata. Inbound rooms are created by the LiveKit SIP dispatch rule
 * when someone dials our number, so the brief has to be built HERE:
 *   caller number (SIP participant attributes) → lead lookup by phone →
 *   insert an inbound call doc (so transcripts/Call Review work) → synthesize
 *   the same metadata shape the outbound trigger would have produced.
 */
import type { JobContext } from '@livekit/agents'
import { getCollection } from '@/lib/mongodb'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const INBOUND_ROOM_PREFIX = 'call-inbound-'

/** Caller number from the SIP participant (attributes preferred, identity as fallback). */
function extractCallerPhone(participant: any): string {
  const attrs: Record<string, string> = participant?.attributes || {}
  const fromAttrs = attrs['sip.phoneNumber'] || attrs['sip.from_number'] || ''
  if (fromAttrs) return fromAttrs
  // SIP participant identities look like "sip_+19995550123"
  const identity = String(participant?.identity || '')
  const m = /(\+?\d{7,15})/.exec(identity)
  return m ? m[1] : ''
}

async function findLeadByPhone(phone: string): Promise<any | null> {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  try {
    const leads = await getCollection('leads')
    // Exact first, then suffix match (DB stores "+91 9876…", SIP sends "+919876…").
    const last10 = digits.slice(-10)
    return (
      (await leads.findOne({ phone, is_deleted: { $ne: true } })) ||
      (await leads.findOne({
        phone: { $regex: `${last10.split('').join('\\s?')}$` },
        is_deleted: { $ne: true },
      }))
    )
  } catch (err) {
    console.error('[inbound] lead lookup failed:', (err as Error).message)
    return null
  }
}

async function insertInboundCallDoc(roomName: string, callerPhone: string, lead: any | null): Promise<string> {
  const calls = await getCollection('calls')
  const now = new Date()
  const result = await calls.insertOne({
    lead_id: lead ? String(lead._id) : '',
    lead_name: lead?.name || '',
    lead_phone: callerPhone,
    agent_name: 'GharSoch Voice',
    agent_id: 'gharsoch_voice_runtime',
    campaign_id: '',
    direction: 'inbound',
    call_type: 'inbound',
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
    call_status: 'in-progress',
    status: 'in-progress',
    vapi_call_id: '',
    voice_call_id: roomName,
    room_name: roomName,
    live_session_id: '',
    voice_provider: 'gharsoch_voice_runtime',
    voice_status: 'active',
    sip_participant_id: null,
    voice_error: null,
    tool_events: [],
    intervention_events: [],
    created_at: now,
    updated_at: now,
  } as any)
  return String(result.insertedId)
}

export type InboundContext = {
  metadata: Record<string, any>
  callerPhone: string
  knownLead: boolean
}

/**
 * Wait for the SIP caller, resolve who they are, and synthesize the call brief.
 * Returns null when no caller materializes (ghost dispatch) — caller should hang up.
 */
export async function prepareInboundCall(ctx: JobContext, roomName: string): Promise<InboundContext | null> {
  // The dispatch rule creates the room as the call arrives; the SIP participant
  // is usually already present, but give slow trunks a few seconds.
  const waitStart = Date.now()
  let participant: any = null
  while (Date.now() - waitStart < 20_000) {
    const remotes = ctx.room.remoteParticipants
    if (remotes && remotes.size > 0) {
      participant = Array.from(remotes.values())[0]
      break
    }
    await sleep(500)
  }
  if (!participant) {
    console.log(`[inbound] no caller joined ${roomName} within 20s — abandoning`)
    return null
  }

  const callerPhone = extractCallerPhone(participant)
  const lead = await findLeadByPhone(callerPhone)
  const callDocId = await insertInboundCallDoc(roomName, callerPhone, lead).catch((err) => {
    console.error('[inbound] call doc insert failed (continuing without):', (err as Error).message)
    return ''
  })

  console.log(
    `[inbound] caller ${callerPhone || 'unknown'} → ${lead ? `known lead ${lead.name} (${lead._id})` : 'new caller'}`
  )

  // Mirror the outbound brief shape (buildRoomMetadata) so prompt vars line up.
  const now = new Date()
  const metadata: Record<string, any> = {
    room_name: roomName,
    voice_call_id: roomName,
    call_doc_id: callDocId,
    customer_name: lead?.name || 'Customer',
    customer_phone: callerPhone,
    language: lead?.language_pref || process.env.VOICE_DEFAULT_LANGUAGE || 'hi-IN',
    call_type: 'inbound',
    agent_name: 'GharSoch Voice',
    agent_id: 'gharsoch_voice_runtime',
    lead_id: lead ? String(lead._id) : '',
    campaign_id: '',
    transport: 'sip-inbound',
    current_datetime_iso: now.toISOString(),
    current_date_human_ist: now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }),
  }

  // Known lead → carry the requirement spec + relationship context, exactly like
  // the re-engager's brief, so the agent doesn't re-qualify from scratch.
  if (lead) {
    if (lead.purpose) metadata.purpose = lead.purpose
    if (lead.budget_range) metadata.budget_range = lead.budget_range
    if (lead.location_pref) metadata.location_pref = lead.location_pref
    if (lead.property_type) metadata.property_type = lead.property_type
    if (lead.min_carpet_sqft) metadata.min_carpet_sqft = String(lead.min_carpet_sqft)
    if (lead.facing_pref) metadata.facing_pref = lead.facing_pref
    if (lead.area_reason) metadata.area_reason = lead.area_reason
    if (lead.rent_budget) metadata.rent_budget = String(lead.rent_budget)
    if (lead.last_visit_property) metadata.last_visit_property = lead.last_visit_property
    if (lead.last_visit_summary) metadata.last_visit_summary = lead.last_visit_summary
    if (lead.customer_objections || lead.objection_history) {
      metadata.objection_history = lead.objection_history || lead.customer_objections
    }
  }

  return { metadata, callerPhone, knownLead: Boolean(lead) }
}
