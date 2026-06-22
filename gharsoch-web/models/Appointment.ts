import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function getAppointmentCollection() {
  return await getCollection('appointments')
}

export interface Appointment {
  _id?: ObjectId
  lead_id: string
  property_id: string
  agent_id: string
  scheduled_at: Date
  ends_at?: Date
  duration_minutes?: number
  buffer_minutes?: number
  status: string
  is_deleted?: boolean
  reminder_sent: boolean
  notes: string
  lead_name: string
  lead_phone: string
  property_title: string
  property_location: string
  created_at: Date
  updated_at: Date

  // --- G1: Myra-parity fields (all optional) ---
  /** Multi-tenant scoping — backfilled from lead.broker_id in Commit 7 */
  broker_id?: string
  /** Google/Outlook calendar event ID — populated in G3 calendar layer */
  calendar_event_id?: string | null
  /** Direct link to calendar event */
  calendar_event_url?: string | null
  /** Calendar provider for this appointment */
  calendar_provider?: 'google' | 'outlook' | null
  /** Set when appointment was auto-created from a site_visit action_item */
  source_action_item_id?: ObjectId | string | null
  /** Vapi call_id of the reminder call (existing in some docs, made canonical) */
  reminder_call_id?: string | null
  /** Source path that created the appointment, e.g. manual, voice_tool, cron */
  booking_source?: string | null
  /** Temporary hold consumed to create this appointment, if any */
  hold_id?: string | null
}

export const DEFAULT_APPOINTMENT: Omit<Appointment, '_id'> = {
  lead_id: '',
  property_id: '',
  agent_id: '',
  scheduled_at: new Date(),
  ends_at: new Date(Date.now() + 60 * 60 * 1000),
  duration_minutes: 60,
  buffer_minutes: 15,
  status: 'scheduled',
  reminder_sent: false,
  notes: '',
  lead_name: '',
  lead_phone: '',
  property_title: '',
  property_location: '',
  created_at: new Date(),
  updated_at: new Date(),

  // G1: Myra-parity defaults
  calendar_event_id: null,
  calendar_event_url: null,
  calendar_provider: null,
  source_action_item_id: null,
  reminder_call_id: null,
  booking_source: null,
  hold_id: null,
}
