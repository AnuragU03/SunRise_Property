import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function getCallCollection() {
  return await getCollection('calls')
}

export interface TranscriptSegment {
  speaker: 'agent' | 'customer'
  text: string
  /** Seconds offset from call start */
  timestamp: number
  language?: string
}

export interface ObjectionEntry {
  category:
    | 'price' | 'location' | 'timing' | 'layout' | 'competition'
    | 'family_decision' | 'financing' | 'construction_quality'
    | 'possession_timeline' | 'other'
  detail: string
  resolution_attempted?: string
  resolved: boolean
  logged_at: Date
}

export interface ToolEvent {
  tool_name: string
  args_summary?: string
  result_summary?: string
  success: boolean
  occurred_at: Date
}

export type VoiceProvider = 'gharsoch_voice_runtime' | 'legacy_vapi' | 'manual' | 'unknown' | string

export type VoiceStatus =
  | 'unknown'
  | 'queued'
  | 'room_created'
  | 'dialing'
  | 'ringing'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'trunk_missing'

export interface InterventionEvent {
  type: 'note' | 'escalation' | 'force_end' | 'broker_join_requested' | 'status_change' | string
  actor_id?: string
  actor_name?: string
  note?: string
  metadata?: Record<string, any>
  occurred_at: Date
}

export interface Call {
  _id?: ObjectId
  lead_id: string
  lead_name: string
  lead_phone: string
  agent_name: string
  agent_id: string
  campaign_id: string
  direction: string
  call_type: string
  duration: number
  disposition: string
  /**
   * Free-string call outcome. Myra's preferred enum subset:
   * 'appointment_booked' | 'callback_requested' | 'not_interested_now' |
   * 'hard_no' | 'dnc_requested' | 'no_answer' | 'customer_busy_reschedule'
   */
  call_outcome: string
  call_summary: string
  customer_availability: string
  preferred_callback_time: string
  preferred_callback_days: string[]
  customer_interest_level: string
  follow_up_required: boolean
  follow_up_date: Date | null
  follow_up_notes: string
  key_requirements: string
  customer_objections: string
  next_steps: string
  recording_url: string
  transcript: string
  trai_compliant: boolean
  call_status: string
  status?: string // Used for UI status/failed
  failure_reason?: string
  /** Legacy Vapi call id retained during voice-runtime migration for old records. */
  vapi_call_id: string
  /** Provider-neutral call id. For LiveKit this should be the room/call identifier. */
  voice_call_id?: string
  /** LiveKit room name used by the Python voice worker and SIP participant. */
  room_name?: string
  /** Optional LiveKit session/job id when the worker reports it. */
  live_session_id?: string
  /** Provider that executed the call. */
  voice_provider?: VoiceProvider
  /** Provider-neutral voice runtime status. */
  voice_status?: VoiceStatus
  /** LiveKit SIP participant id when available. */
  sip_participant_id?: string | null
  /** Voice runtime error such as missing trunk, dispatch failure, or worker failure. */
  voice_error?: string | null
  /** Broker live-call intervention audit trail. */
  intervention_events?: InterventionEvent[]
  created_at: Date
  updated_at: Date

  // --- G1: Myra analysis-parity fields (all optional) ---
  /** Multi-tenant scoping — backfilled from lead.broker_id in Commit 7 */
  broker_id?: string
  /** Languages detected during the call */
  languages_detected?: string[]
  /** Structured transcript with speaker attribution and timestamps */
  transcript_segments?: TranscriptSegment[]
  /** Sentiment score (1–10) from Call Insight Agent */
  sentiment_score?: number | null
  sentiment_label?: 'positive' | 'neutral' | 'negative' | null
  /** Escalation tracking */
  escalation_flag?: boolean
  escalation_reason?: string | null
  /** Structured objection log from call analysis */
  objections_logged?: ObjectionEntry[]
  /** Every voice/tool call during this call */
  tool_events?: ToolEvent[]
  /** Full Call Insight Agent JSON envelope */
  analysis?: Record<string, any> | null
  analyzed_at?: Date | null
  analyzed_by?: string | null
}

export const DEFAULT_CALL: Omit<Call, '_id'> = {
  lead_id: '',
  lead_name: '',
  lead_phone: '',
  agent_name: '',
  agent_id: '',
  campaign_id: '',
  direction: 'outbound',
  call_type: 'outbound',
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
  call_status: 'completed',
  vapi_call_id: '',
  voice_call_id: '',
  room_name: '',
  live_session_id: '',
  voice_provider: 'unknown',
  voice_status: 'unknown',
  sip_participant_id: null,
  voice_error: null,
  intervention_events: [],
  created_at: new Date(),
  updated_at: new Date(),
}
