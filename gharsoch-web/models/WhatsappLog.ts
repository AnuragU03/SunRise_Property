import { ObjectId } from 'mongodb'

export type WhatsappMode = 'dry_run' | 'twilio_sandbox' | 'twilio_production'
export type WhatsappMessageType = 'appointment_confirmation' | 'post_call_followup' | 'reschedule' | 'appointment_cancelled' | 'reengage_followup' | 'callback_ack' | 'manual'
export type WhatsappDeliveryStatus =
  | 'dry_run'
  | 'sandbox_sent'
  | 'sandbox_failed'
  | 'production_sent'
  | 'production_failed'
  | 'dnc_skipped'
  | 'deduped'

export type WhatsappLanguage = 'en' | 'hi' | 'hinglish' | 'marathi_hinglish'

export interface WhatsappLog {
  _id?: ObjectId
  lead_id: ObjectId | string
  broker_id: string
  call_id?: ObjectId | string | null
  /** Links the message to the appointment/voice call that triggered it. */
  appointment_id?: ObjectId | string | null
  voice_call_id?: string | null
  /** Dedup guard — a message with the same key is sent at most once. */
  idempotency_key?: string | null
  message_type: WhatsappMessageType
  message_text: string
  language: string
  mode_used: WhatsappMode
  delivery_status: WhatsappDeliveryStatus
  twilio_sid?: string | null
  twilio_response_summary?: string | null
  error?: string | null
  is_deleted: boolean
  deleted_at?: Date | null
  created_at: Date
}
