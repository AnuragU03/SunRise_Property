import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function getLeadCollection() {
  return await getCollection('leads')
}

export interface Lead {
  _id?: ObjectId
  broker_id: string
  name: string
  phone: string
  email: string
  source: string
  status: string
  budget_range: string
  location_pref: string
  property_type: string
  assigned_agent_id: string
  dnd_status: boolean
  place: string
  notes: string
  preferred_contact_time: string
  availability_window: string
  availability_days: string[]
  interest_level: string
  /** Marks one of the broker's existing warm relationships (imported warm list).
   *  Routes to the generic warm re-engage playbook, never cold matchmaker prospecting. */
  is_warm_lead?: boolean
  qualification_status: string
  lead_score: number
  last_contacted_at: Date | null
  next_follow_up_date: Date | null
  follow_up_count: number
  total_calls: number
  first_call_completed: boolean
  customer_requirements: string
  timeline: string
  objections: string
  followup_reason: string
  created_at: Date
  updated_at: Date

  // --- G1: Myra customer-parity fields (all optional) ---
  /** Detected or declared language preference. Populated on first call analysis (G2). */
  preferred_language?: 'en' | 'hi' | 'hinglish' | null
  /** Structured property types of interest (additive alongside property_type string) */
  property_interest?: string[]
  /** Machine-readable budget range — complements the free-text budget_range field */
  budget_range_structured?: { min_amount: number; max_amount: number; currency: 'INR' } | null
  /** Structured location preferences (additive alongside location_pref string) */
  location_preference?: string[]
  /** Last site visit tracking */
  last_visit_date?: Date | null
  last_visit_property?: string | null
  last_visit_summary?: string | null
  /** Last call tracking — complements last_contacted_at for Myra parity */
  last_call_date?: Date | null
  /** Populated by Call Insight Agent in G2 */
  last_call_summary?: string | null
  /** Escalation counter — incremented by flag_escalation tool in G2 */
  escalation_count?: number

  // --- Call-corpus requirement fields (all optional) ---
  // Extracted from real broker calls (voice-agent/call-corpus): the spec a broker
  // actually anchors on when re-engaging ("2BHK above 700 carpet, Kanjurmarg East
  // because relatives nearby, vastu-sensitive, buying not renting").
  /** buy | rent — call 05 shows rental is a distinct flow with different qualification */
  purpose?: 'buy' | 'rent' | null
  /** Minimum carpet area requirement in sq ft (e.g. 700) */
  min_carpet_sqft?: number | null
  /** Facing/vastu preference (e.g. 'north-east') — call 04: S/W-facing units rejected on vastu */
  facing_pref?: string | null
  /** Whether vastu compliance is a hard requirement */
  vastu_required?: boolean | null
  /** WHY this area — the memory anchor brokers reuse (e.g. 'relatives nearby', 'office at Godrej One → East side') */
  area_reason?: string | null
  /** Monthly rent budget in INR when purpose='rent' (e.g. 60000) */
  rent_budget?: number | null

  // --- G7: Re-engage agent fields (all optional) ---
  /** Type of previous engagement */
  last_visit_type?: 'site_visit' | 'office_walkin' | 'phone_enquiry' | 'online_form'
  /** Foreign key to properties._id */
  last_visit_property_id?: string
  /** When the re-engager last attempted a call to this lead */
  last_reengage_attempted_at?: Date | null
  /** History of re-engage attempts with outcomes */
  lead_reengage_history?: Array<{
    attempted_at: Date
    call_id: string
    outcome: string
    visit_type_at_attempt: string
  }>
  /** Counter for no-answer attempts (future retry logic) */
  reengage_no_answer_count?: number
}

export const DEFAULT_LEAD: Omit<Lead, '_id' | 'broker_id'> = {
  // broker_id is stamped at create-time by leadService.createLead — never default it
  name: '',
  phone: '',
  email: '',
  source: '',
  status: 'new',
  budget_range: '',
  location_pref: '',
  property_type: '',
  assigned_agent_id: '',
  dnd_status: false,
  place: 'Mumbai',
  notes: '',
  preferred_contact_time: '',
  availability_window: '',
  availability_days: [],
  interest_level: 'unknown',
  qualification_status: 'unqualified',
  lead_score: 0,
  last_contacted_at: null,
  next_follow_up_date: null,
  follow_up_count: 0,
  total_calls: 0,
  first_call_completed: false,
  customer_requirements: '',
  timeline: '',
  objections: '',
  followup_reason: '',
  created_at: new Date(),
  updated_at: new Date(),

  // G1: Myra-parity defaults
  preferred_language: null,
  property_interest: [],
  budget_range_structured: null,
  location_preference: [],
  last_visit_date: null,
  last_visit_property: null,
  last_visit_summary: null,
  last_call_date: null,
  last_call_summary: null,
  escalation_count: 0,

  // G7: Re-engage defaults
  last_visit_type: undefined,
  last_visit_property_id: undefined,
  last_reengage_attempted_at: null,
  lead_reengage_history: [],
  reengage_no_answer_count: 0,
}
