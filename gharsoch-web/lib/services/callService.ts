import clientPromise from '@/lib/mongodb'
import type { Call } from '@/models/Call'
import { ObjectId } from 'mongodb'

const DB_NAME = process.env.MONGODB_DB || 'test'
const COLLECTION = 'calls'

export type SerializedCall = Omit<Call, '_id' | 'created_at' | 'updated_at' | 'follow_up_date' | 'analyzed_at'> & {
  _id: string
  created_at: string
  updated_at: string
  follow_up_date: string | null
  // G1: serialized analysis timestamp
  analyzed_at?: string | null
}

export type CallDetail = SerializedCall & {
  linked_lead?: {
    _id: string
    name: string
    phone: string
    status?: string
    interest_level?: string
  } | null
  linked_property?: {
    _id: string
    title: string
    location?: string
    builder?: string
  } | null
  linked_run?: {
    run_id: string
    agent_id: string
    agent_name: string
    status: string
    started_at: string
    reasoning_summary?: {
      summary: string
      confidence: number
      generated_at?: string
    }
    input_data?: Record<string, any>
    output_data?: Record<string, any>
    reasoning_steps?: any[]
    actions?: any[]
  } | null
  tool_dispatches: Array<{
    run_id: string
    agent_id: string
    agent_name: string
    status: string
    started_at: string
    tool_name: string
    reasoning_summary?: {
      summary: string
      confidence: number
      generated_at?: string
    }
    input_data?: Record<string, any>
    output_data?: Record<string, any>
    reasoning_steps?: any[]
    actions?: any[]
  }>
}

export type CallStripData = {
  callsToday: number
  connected: number
  avgDuration: string
  booked: number
  dncMarked: number
  voiceMinutes: number
  /** Legacy alias kept until UI labels are migrated. */
  vapiMinutes: number
}

function toIso(value?: Date | string | null) {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function serializeCall(call: any): SerializedCall {
  return {
    ...call,
    _id: String(call._id),
    created_at: toIso(call.created_at) || new Date().toISOString(),
    updated_at: toIso(call.updated_at) || new Date().toISOString(),
    follow_up_date: toIso(call.follow_up_date),
    // G1: serialize analysis timestamp
    analyzed_at: toIso(call.analyzed_at),
  }
}

function byRecentTimestamp(a: any, b: any) {
  return new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime()
}

function isMissedCall(call: any) {
  const disposition = String(call.disposition || '').toLowerCase()
  const status = String(call.call_status || '').toLowerCase()
  return disposition === 'missed' || status === 'missed'
}

function isVoicemail(call: any) {
  const disposition = String(call.disposition || '').toLowerCase()
  const outcome = String(call.call_outcome || '').toLowerCase()
  return disposition === 'voicemail' || outcome.includes('voicemail')
}

function isConnected(call: any) {
  const status = String(call.call_status || '').toLowerCase()
  return status === 'completed' || status === 'connected'
}

async function getCollection() {
  const client = await clientPromise
  return client.db(DB_NAME).collection<Call>(COLLECTION)
}

export async function phoneHasRecentOutboundCall(phone: string, withinMinutes = 240): Promise<boolean> {
  if (!phone || withinMinutes <= 0) return false

  const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000)
  const collection = await getCollection()
  const count = await collection.countDocuments({
    direction: 'outbound',
    superseded: { $ne: true },
    created_at: { $gte: cutoff },
    $or: [
      { customer_number: phone } as any,
      { to_number: phone } as any,
      { lead_phone: phone } as any,
    ],
  })

  return count > 0
}

export async function leadHasRecentOutboundCall(
  leadId: ObjectId, 
  withinMinutes = 240,
  options?: { source?: 'matchmaker' | 'campaign' | 'follow_up_callback' | 'appointment_reminder' | 're_engager'; floor?: Date }
): Promise<boolean> {
  const source = options?.source || 'matchmaker'

  if (source === 'follow_up_callback' || source === 'appointment_reminder') {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000)
    const effectiveCutoff = options?.floor && options.floor > cutoff ? options.floor : cutoff
    const callsCol = await getCollection()
    const recentSameSource = await callsCol.countDocuments({
      lead_id: { $in: [leadId, leadId.toString()] } as any,
      direction: 'outbound',
      call_type: source,
      superseded: { $ne: true },
      created_at: { $gte: effectiveCutoff }
    })
    return recentSameSource > 0
  }

  // G7: source-aware cooldown for re-engager — only checks reengage-type calls
  if (source === 're_engager') {
    if (withinMinutes <= 0) return false
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000)
    const effectiveCutoff = options?.floor && options.floor > cutoff ? options.floor : cutoff
    const callsCol = await getCollection()
    const recentReengage = await callsCol.countDocuments({
      lead_id: { $in: [leadId, leadId.toString()] } as any,
      direction: 'outbound',
      call_type: { $in: ['reengage', 're_engagement'] },
      superseded: { $ne: true },
      created_at: { $gte: effectiveCutoff },
    })
    return recentReengage > 0
  }

  if (withinMinutes <= 0) return false

  const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000)
  const effectiveCutoff = options?.floor && options.floor > cutoff ? options.floor : cutoff
  const callsCollection = await getCollection()
  const leadCount = await callsCollection.countDocuments({
    lead_id: { $in: [leadId, leadId.toString()] } as any,
    direction: 'outbound',
    superseded: { $ne: true },
    created_at: { $gte: effectiveCutoff },
  })

  if (leadCount > 0) {
    return true
  }

  const client = await clientPromise
  const leadsCollection = client.db(DB_NAME).collection('leads')
  const lead = await leadsCollection.findOne(
    { _id: leadId },
    { projection: { phone: 1 } }
  )

  if (lead?.phone) {
    return phoneHasRecentOutboundCall(String(lead.phone), withinMinutes)
  }

  return false
}

function extractToolName(run: any) {
  const input = run.input_data || {}
  const output = run.output_data || {}
  const actions = Array.isArray(run.actions) ? run.actions : []
  const toolNames = Array.isArray(input.tool_names) ? input.tool_names.filter(Boolean) : []
  const outputTool = output.results?.[0]?.toolCallId
  const dispatched = actions.find((action: any) => action.action_type === 'tool_dispatch')
  return (
    input.tool_name ||
    input.function_name ||
    toolNames[0] ||
    dispatched?.parameters?.tool_name ||
    outputTool ||
    input.webhook_type ||
    'voice_event'
  )
}

function compactUniqueStrings(values: unknown[]) {
  return Array.from(new Set(values
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim())))
}

function getCallIdentityCandidates(call: any) {
  return compactUniqueStrings([
    call.voice_call_id,
    call.room_name,
    call.live_session_id,
    call.vapi_call_id,
  ])
}

function buildAgentLogCallIdentityConditions(callIds: string[]) {
  return callIds.flatMap((callId) => [
    { 'input_data.voice_call_id': callId },
    { 'input_data.voiceCallId': callId },
    { 'input_data.room_name': callId },
    { 'input_data.roomName': callId },
    { 'input_data.call_id': callId },
    { 'input_data.vapi_call_id': callId },
    { 'output_data.voice_call_id': callId },
    { 'output_data.voiceCallId': callId },
    { 'output_data.room_name': callId },
    { 'output_data.roomName': callId },
    { 'output_data.callId': callId },
    { 'output_data.call_id': callId },
    { 'output_data.vapi_call_id': callId },
  ])
}

function runReferencesCall(run: any, callIds: string[]) {
  if (callIds.length === 0) return false
  const idSet = new Set(callIds)
  const input = run.input_data || {}
  const output = run.output_data || {}
  const matches = Array.isArray(output.match_details) ? output.match_details : []
  const candidates = compactUniqueStrings([
    input.call_id,
    input.voice_call_id,
    input.voiceCallId,
    input.room_name,
    input.roomName,
    input.vapi_call_id,
    output.callId,
    output.call_id,
    output.voice_call_id,
    output.voiceCallId,
    output.room_name,
    output.roomName,
    output.vapi_call_id,
    ...matches.flatMap((match: any) => [
      match.call_id,
      match.voice_call_id,
      match.voiceCallId,
      match.room_name,
      match.roomName,
      match.vapi_call_id,
    ]),
  ])

  return candidates.some((candidate) => idSet.has(candidate))
}

export const callService = {
  async list(options: {
    direction?: string
    status?: string
    limit?: number
  } = {}): Promise<SerializedCall[]> {
    const collection = await getCollection()
    const filter: any = {
      is_deleted: { $ne: true },
      superseded: { $ne: true },
    }
    const calls = (await collection.find(filter).sort({ created_at: -1 }).limit(200).toArray()).sort(byRecentTimestamp)

    const filtered = calls.filter((call: any) => {
      if (options.direction && call.direction !== options.direction) return false
      if (!options.status) return true

      if (options.status === 'missed') return isMissedCall(call)
      if (options.status === 'voicemail') return isVoicemail(call)
      if (options.status === 'connected') return isConnected(call)

      return String(call.call_status || '').toLowerCase() === options.status.toLowerCase()
    })

    return filtered.slice(0, options.limit || 50).map(serializeCall)
  },

  async get(id: string): Promise<CallDetail | null> {
    const collection = await getCollection()
    const call = await collection.findOne({ _id: new ObjectId(id) })

    if (!call) {
      return null
    }

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const callIdentityCandidates = getCallIdentityCandidates(call)
    const toolIdentityConditions = buildAgentLogCallIdentityConditions(callIdentityCandidates)
    const [lead, rawRuns, toolDispatchDocs, matchedProperty] = await Promise.all([
      call.lead_id ? db.collection('leads').findOne({ _id: new ObjectId(call.lead_id) }) : null,
      db.collection('agent_execution_logs').find({}).limit(250).toArray(),
      toolIdentityConditions.length > 0
        ? db.collection('agent_execution_logs')
            .find({
              agent_id: 'voice_orchestrator',
              $or: toolIdentityConditions,
            })
            .sort({ created_at: 1 })
            .limit(50)
            .toArray()
        : [],
      (async () => {
        if (!call.lead_id || !ObjectId.isValid(call.lead_id)) {
          return null
        }
        const matchingAppointment = await db
          .collection('appointments')
          .find({ lead_id: call.lead_id })
          .toArray()
        const appointment = matchingAppointment.sort(byRecentTimestamp)[0]
        if (!appointment?.property_id || !ObjectId.isValid(appointment.property_id)) {
          return null
        }
        return db.collection('properties').findOne({ _id: new ObjectId(appointment.property_id), is_deleted: { $ne: true } })
      })(),
    ])

    const linkedRun = rawRuns
      .filter((run: any) => {
        const input = run.input_data || {}
        const output = run.output_data || {}
        const matches = Array.isArray(output.match_details) ? output.match_details : []

        return (
          runReferencesCall(run, callIdentityCandidates) ||
          input.lead_id === call.lead_id ||
          matches.some((match: any) => match.lead_id === call.lead_id)
        )
      })
      .sort((a: any, b: any) => new Date(b.started_at || b.created_at || 0).getTime() - new Date(a.started_at || a.created_at || 0).getTime())[0]

    return {
      ...serializeCall(call),
      linked_lead: lead
        ? {
            _id: String(lead._id),
            name: lead.name || call.lead_name,
            phone: lead.phone || call.lead_phone,
            status: lead.status,
            interest_level: lead.interest_level,
          }
        : null,
      linked_property: matchedProperty
        ? {
            _id: String(matchedProperty._id),
            title: matchedProperty.title,
            location: matchedProperty.location,
            builder: matchedProperty.builder || matchedProperty.builder_name,
          }
        : null,
      linked_run: linkedRun
        ? {
            run_id: linkedRun.run_id,
            agent_id: linkedRun.agent_id,
            agent_name: linkedRun.agent_name,
            status: linkedRun.status,
            started_at: toIso(linkedRun.started_at || linkedRun.created_at) || new Date().toISOString(),
            reasoning_summary: linkedRun.reasoning_summary,
            input_data: linkedRun.input_data,
            output_data: linkedRun.output_data,
            reasoning_steps: linkedRun.reasoning_steps,
            actions: linkedRun.actions,
          }
        : null,
      tool_dispatches: toolDispatchDocs.map((run: any) => ({
        run_id: run.run_id,
        agent_id: run.agent_id,
        agent_name: run.agent_name,
        status: run.status,
        started_at: toIso(run.started_at || run.created_at) || new Date().toISOString(),
        tool_name: extractToolName(run),
        reasoning_summary: run.reasoning_summary,
        input_data: run.input_data,
        output_data: run.output_data,
        reasoning_steps: run.reasoning_steps,
        actions: run.actions,
      })),
    }
  },

  async getStripData(): Promise<CallStripData> {
    const filter: any = {
      is_deleted: { $ne: true },
      superseded: { $ne: true },
    }
    const calls = (await (await getCollection()).find(filter).sort({ created_at: -1 }).limit(500).toArray()).sort(byRecentTimestamp)
    const today = new Date().toDateString()
    const todaysCalls = calls.filter((call: any) => new Date(call.created_at).toDateString() === today)
    const connected = todaysCalls.filter(isConnected).length
    const booked = todaysCalls.filter((call: any) => String(call.call_outcome || '').toLowerCase().includes('book')).length
    const dncMarked = todaysCalls.filter((call: any) => {
      const disposition = String(call.disposition || '').toLowerCase()
      const summary = String(call.call_summary || '').toLowerCase()
      return disposition === 'dnd' || summary.includes('dnc')
    }).length
    const totalDuration = todaysCalls.reduce((sum: number, call: any) => sum + Number(call.duration || 0), 0)
    const avgSeconds = connected > 0 ? Math.round(totalDuration / connected) : 0
    const voiceMinutes = Number((totalDuration / 60).toFixed(1))

    return {
      callsToday: todaysCalls.length,
      connected,
      avgDuration: avgSeconds === 0 ? '0s' : avgSeconds < 60 ? `${avgSeconds}s` : `${Math.floor(avgSeconds / 60)}m ${avgSeconds % 60}s`,
      booked,
      dncMarked,
      voiceMinutes,
      vapiMinutes: voiceMinutes,
    }
  },
}
