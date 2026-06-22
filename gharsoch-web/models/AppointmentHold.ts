import { ObjectId } from 'mongodb'

export interface AppointmentHold {
  _id?: ObjectId
  broker_id: string
  lead_id?: string
  call_id?: string
  scheduled_at: Date
  ends_at: Date
  buffered_end: Date
  duration_minutes: number
  buffer_minutes: number
  status: 'active' | 'released' | 'consumed' | 'expired'
  expires_at: Date
  created_at: Date
  updated_at: Date
}

export const DEFAULT_APPOINTMENT_HOLD: Omit<AppointmentHold, '_id'> = {
  broker_id: '',
  lead_id: '',
  call_id: '',
  scheduled_at: new Date(),
  ends_at: new Date(Date.now() + 60 * 60 * 1000),
  buffered_end: new Date(Date.now() + 75 * 60 * 1000),
  duration_minutes: 60,
  buffer_minutes: 15,
  status: 'active',
  expires_at: new Date(Date.now() + 120 * 1000),
  created_at: new Date(),
  updated_at: new Date(),
}
