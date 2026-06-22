import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import type { SerializedLead } from './leadService'
import type { SerializedAppointment } from './appointmentService'
import type { SerializedUser } from './userService'
import type { WhatsappLog, WhatsappMode, WhatsappMessageType, WhatsappDeliveryStatus, WhatsappLanguage } from '@/models/WhatsappLog'
import twilio from 'twilio'

export interface SendWhatsappInput {
  lead_id: string
  broker_id: string
  call_id?: string
  appointment_id?: string
  voice_call_id?: string
  message_type: WhatsappMessageType
  message_text: string
  language: WhatsappLanguage
  to_phone: string
  /** Dedup guard — if a non-failed log with this key exists, the send is skipped. */
  idempotency_key?: string
  /** Bypass the DNC gate for transactional/compliance messages the customer requested. */
  skip_dnc_check?: boolean
}

export interface SendWhatsappResult {
  ok: boolean
  log_id: string
  delivery_status: WhatsappDeliveryStatus
  twilio_sid?: string
  error?: string
  /** True when the send was skipped because an identical message already went out. */
  deduped?: boolean
}

/**
 * Message types that are transactional (customer initiated/agreed) and therefore
 * still allowed to a DNC-flagged lead. Everything else is treated as promotional
 * outreach and is suppressed for DNC leads.
 */
const TRANSACTIONAL_TYPES = new Set<WhatsappMessageType>(['appointment_confirmation', 'reschedule', 'appointment_cancelled', 'callback_ack'])

/** Map a lead's free-form preferred_language to a supported template language. */
export function resolveWhatsappLanguage(value: any): WhatsappLanguage {
  const l = String(value || '').toLowerCase()
  if (l === 'hi' || l === 'hindi') return 'hi'
  if (l === 'en' || l === 'english') return 'en'
  if (l === 'mr' || l === 'marathi' || l === 'marathi_hinglish') return 'marathi_hinglish'
  return 'hinglish'
}

export const whatsappService = {
  async sendWhatsapp(input: SendWhatsappInput): Promise<SendWhatsappResult> {
    const mode = (process.env.WHATSAPP_MODE as WhatsappMode) || 'dry_run'
    const logsCol = await getCollection('whatsapp_log')

    // ── 1. Idempotency: never send the same message twice ─────────────────────
    if (input.idempotency_key) {
      const existing = await logsCol.findOne({
        idempotency_key: input.idempotency_key,
        delivery_status: { $nin: ['sandbox_failed', 'production_failed', 'dnc_skipped'] },
      })
      if (existing) {
        return {
          ok: true,
          log_id: existing._id.toString(),
          delivery_status: existing.delivery_status as WhatsappDeliveryStatus,
          deduped: true,
        }
      }
    }

    // ── 2. DNC compliance: suppress promotional outreach to DNC leads ─────────
    if (!input.skip_dnc_check && !TRANSACTIONAL_TYPES.has(input.message_type)) {
      try {
        const leads = await getCollection('leads')
        const lead = await leads.findOne({ _id: new ObjectId(input.lead_id) })
        if (lead && (lead.dnd_status || lead.dnc_flag)) {
          const skipLog: WhatsappLog = {
            lead_id: new ObjectId(input.lead_id),
            broker_id: input.broker_id,
            call_id: input.call_id ? new ObjectId(input.call_id) : null,
            appointment_id: input.appointment_id ? new ObjectId(input.appointment_id) : null,
            voice_call_id: input.voice_call_id || null,
            idempotency_key: input.idempotency_key || null,
            message_type: input.message_type,
            message_text: input.message_text,
            language: input.language,
            mode_used: mode,
            delivery_status: 'dnc_skipped',
            error: 'dnc_blocked',
            is_deleted: false,
            created_at: new Date(),
          }
          const skipRes = await logsCol.insertOne(skipLog)
          return { ok: false, log_id: skipRes.insertedId.toString(), delivery_status: 'dnc_skipped', error: 'dnc_blocked' }
        }
      } catch (err) {
        // DNC lookup failure must not block a legitimate send — log and continue.
        console.error('[whatsappService] DNC check failed (allowing send):', (err as Error).message)
      }
    }

    let delivery_status: WhatsappDeliveryStatus = 'dry_run'
    let twilio_sid: string | undefined
    let twilio_response_summary: string | undefined
    let error: string | undefined

    if (mode === 'twilio_sandbox' || mode === 'twilio_production') {
      try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID
        const authToken = process.env.TWILIO_AUTH_TOKEN
        
        if (!accountSid || !authToken) {
          throw new Error('Twilio credentials missing in env')
        }

        const client = twilio(accountSid, authToken)
        
        // For sandbox, you generally have a specific from number like 'whatsapp:+14155238886'
        // For production, you use your approved sender number. 
        // We'll read from env or fallback to standard sandbox format.
        const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'
        const toNumber = input.to_phone.startsWith('whatsapp:') ? input.to_phone : `whatsapp:${input.to_phone.startsWith('+') ? input.to_phone : '+' + input.to_phone}`

        const message = await client.messages.create({
          body: input.message_text,
          from: fromNumber,
          to: toNumber,
        })

        twilio_sid = message.sid
        delivery_status = mode === 'twilio_sandbox' ? 'sandbox_sent' : 'production_sent'
        twilio_response_summary = message.status
      } catch (err: any) {
        error = err.message
        delivery_status = mode === 'twilio_sandbox' ? 'sandbox_failed' : 'production_failed'
      }
    }

    const logEntry: WhatsappLog = {
      lead_id: new ObjectId(input.lead_id),
      broker_id: input.broker_id,
      call_id: input.call_id ? new ObjectId(input.call_id) : null,
      appointment_id: input.appointment_id ? new ObjectId(input.appointment_id) : null,
      voice_call_id: input.voice_call_id || null,
      idempotency_key: input.idempotency_key || null,
      message_type: input.message_type,
      message_text: input.message_text,
      language: input.language,
      mode_used: mode,
      delivery_status,
      twilio_sid,
      twilio_response_summary,
      error,
      is_deleted: false,
      created_at: new Date()
    }

    const result = await logsCol.insertOne(logEntry)

    return {
      ok: delivery_status === 'dry_run' || delivery_status === 'sandbox_sent' || delivery_status === 'production_sent',
      log_id: result.insertedId.toString(),
      delivery_status,
      twilio_sid,
      error
    }
  },

  renderAppointmentConfirmation(lead: SerializedLead, appointment: SerializedAppointment, broker: SerializedUser, lang: WhatsappLanguage = 'en'): string {
    const time = new Date(appointment.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true })
    const date = new Date(appointment.scheduled_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric' })
    const property = appointment.property_title || lead.property_type || 'the property'
    const location = (appointment as any).property_location || ''
    const venue = location || process.env.VOICE_OFFICE_ADDRESS || 'our office'
    const brokerName = broker.name || 'Your Agent'

    if (lang === 'marathi_hinglish') {
      return `Namaskar ${lead.name},\n\nTumchi site visit confirm zali aahe.\n📍 Project: ${property}\n📅 Date: ${date}\n🕒 Time: ${time}\n🗺️ Venue: ${venue}\n\n${brokerName} tumhala guide kartil.\nKahi question asel tar yach WhatsApp var reply kara.\n\n- GharSoch Team`
    }

    if (lang === 'hi' || lang === 'hinglish') {
      return `Namaste ${lead.name},\n\nAapki appointment ${property} ke liye confirm ho gayi hai.\n📅 Date: ${date}\n🕒 Time: ${time}\n🗺️ Venue: ${venue}\n\nAgent ${brokerName} aapse milenge.\n\nThank you,\nGharSoch Team`
    }

    return `Hi ${lead.name},\n\nYour appointment for ${property} is confirmed.\n📅 Date: ${date}\n🕒 Time: ${time}\n🗺️ Venue: ${venue}\n\n${brokerName} will be assisting you.\n\nThanks,\nGharSoch Team`
  },

  renderPostCallFollowup(lead: SerializedLead, broker: SerializedUser, context?: string, lang: WhatsappLanguage = 'en'): string {
    const brokerName = broker.name || 'Your Agent'

    if (lang === 'hi' || lang === 'hinglish' || lang === 'marathi_hinglish') {
      return `Namaste ${lead.name},\n\nBaat karke acha laga. ${context ? context + '\n\n' : ''}Agar koi sawal ho toh is number par reply karein.\n\nRegards,\n${brokerName}`
    }

    return `Hi ${lead.name},\n\nGreat speaking with you. ${context ? context + '\n\n' : ''}Feel free to reply here if you have any questions.\n\nBest,\n${brokerName}`
  },

  renderReschedule(lead: SerializedLead, oldAppt: SerializedAppointment, newAppt: SerializedAppointment, lang: WhatsappLanguage = 'en'): string {
    const newTime = new Date(newAppt.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true })
    const newDate = new Date(newAppt.scheduled_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric' })

    if (lang === 'hi' || lang === 'hinglish' || lang === 'marathi_hinglish') {
      return `Namaste ${lead.name},\n\nAapki appointment reschedule ho gayi hai.\nNayi details:\n📅 Date: ${newDate}\n🕒 Time: ${newTime}\n\nMilte hain!\nGharSoch Team`
    }

    return `Hi ${lead.name},\n\nYour appointment has been successfully rescheduled.\nNew Details:\n📅 Date: ${newDate}\n🕒 Time: ${newTime}\n\nSee you then!\nGharSoch Team`
  },

  renderCancellation(lead: SerializedLead, appointment: SerializedAppointment, lang: WhatsappLanguage = 'en'): string {
    const time = new Date(appointment.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true })
    const date = new Date(appointment.scheduled_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric' })
    const property = appointment.property_title || 'the property'

    if (lang === 'marathi_hinglish') {
      return `Namaskar ${lead.name},\n\nTumchi ${property} chi visit (${date}, ${time}) cancel zali aahe.\nParat book karaychi asel tar yach WhatsApp var reply kara.\n\n- GharSoch Team`
    }
    if (lang === 'hi' || lang === 'hinglish') {
      return `Namaste ${lead.name},\n\nAapki ${property} ki appointment (${date}, ${time}) cancel ho gayi hai.\nDobara book karni ho toh isi WhatsApp par reply karein.\n\nGharSoch Team`
    }
    return `Hi ${lead.name},\n\nYour appointment for ${property} (${date}, ${time}) has been cancelled.\nReply here anytime to rebook.\n\nGharSoch Team`
  },

  /**
   * G7: Re-engage follow-up WhatsApp with visit-type variants.
   */
  renderReengageFollowup(params: {
    customerName: string
    visitType: string
    lastVisitProperty: string
    propertyLocation?: string
    appointmentDateHuman: string
    appointmentTimeHuman: string
    brokerName: string
    brokerPhone: string
    /** Brokerage brand shown in the signature. Defaults to env or 'GharSoch' — never hardcoded. */
    brandName?: string
    /** Walk-in office label. Defaults to a generic phrase. */
    officeName?: string
  }, lang: WhatsappLanguage = 'hinglish'): string {
    const { customerName, visitType, lastVisitProperty, propertyLocation, appointmentDateHuman, appointmentTimeHuman, brokerName, brokerPhone } = params
    const brandName = params.brandName || process.env.WHATSAPP_BRAND_NAME || 'GharSoch'
    const officeName = params.officeName || 'our office'

    if (visitType === 'office_walkin') {
      if (lang === 'en') {
        return `Hi ${customerName}, following up on our chat. You're invited to ${officeName} on ${appointmentDateHuman} at ${appointmentTimeHuman}. Contact: ${brokerName} (${brokerPhone}). See you! — ${brandName}`
      }
      if (lang === 'hi') {
        return `नमस्ते ${customerName} जी, आज हमारी बात हुई। आप ${appointmentDateHuman} ${appointmentTimeHuman} पर ${officeName} आ सकते हैं। संपर्क: ${brokerName} (${brokerPhone})। — ${brandName}`
      }
      return `Namaste ${customerName} ji, aaj humari baat huyi. Hum aapko ${officeName} mein milne aane ka invitation bhej rahe hain ${appointmentDateHuman} ${appointmentTimeHuman} pe. Contact: ${brokerName} (${brokerPhone}). Milte hain! — ${brandName}`
    }

    if (visitType === 'phone_enquiry') {
      if (lang === 'en') {
        return `Hi ${customerName}, following up on our call. We've arranged a personal visit for you to ${lastVisitProperty} on ${appointmentDateHuman} at ${appointmentTimeHuman}. Location: ${propertyLocation || ''}. Contact: ${brokerName} (${brokerPhone}). — ${brandName}`
      }
      if (lang === 'hi') {
        return `नमस्ते ${customerName} जी, आज हमारी बात हुई। ${lastVisitProperty} के लिए विज़िट ${appointmentDateHuman} ${appointmentTimeHuman} पर अरेंज की है। स्थान: ${propertyLocation || ''}। संपर्क: ${brokerName} (${brokerPhone})। — ${brandName}`
      }
      return `Namaste ${customerName} ji, aaj humari baat huyi. ${lastVisitProperty} ke saath ek personal visit arrange kar rahe hain ${appointmentDateHuman} ${appointmentTimeHuman} pe. Location: ${propertyLocation || ''}. Contact: ${brokerName} (${brokerPhone}). — ${brandName}`
    }

    if (visitType === 'online_form') {
      if (lang === 'en') {
        return `Hi ${customerName}, following up on your enquiry. We've arranged a personal visit for ${lastVisitProperty} on ${appointmentDateHuman} at ${appointmentTimeHuman}. Location: ${propertyLocation || ''}. Contact: ${brokerName} (${brokerPhone}). — ${brandName}`
      }
      if (lang === 'hi') {
        return `नमस्ते ${customerName} जी, आज हमारी बात हुई आपकी एनक्वायरी के बारे में। ${lastVisitProperty} की विज़िट ${appointmentDateHuman} ${appointmentTimeHuman} पर है। स्थान: ${propertyLocation || ''}। संपर्क: ${brokerName} (${brokerPhone})। — ${brandName}`
      }
      return `Namaste ${customerName} ji, aaj humari baat huyi aapki website enquiry ke regarding. Hum ${lastVisitProperty} ki personal visit arrange kar rahe hain ${appointmentDateHuman} ${appointmentTimeHuman} pe. Location: ${propertyLocation || ''}. Contact: ${brokerName} (${brokerPhone}). — ${brandName}`
    }

    // Default: site_visit
    if (lang === 'en') {
      return `Hi ${customerName}, following up on our conversation about ${lastVisitProperty}. You're scheduled for a site visit on ${appointmentDateHuman} at ${appointmentTimeHuman}. Location: ${propertyLocation || ''}. Contact: ${brokerName} (${brokerPhone}). See you there! — ${brandName}`
    }
    if (lang === 'hi') {
      return `नमस्ते ${customerName} जी, आज हमारी बात हुई ${lastVisitProperty} के बारे में। आप ${appointmentDateHuman} को ${appointmentTimeHuman} पर साइट विज़िट कर सकते हैं। स्थान: ${propertyLocation || ''}। संपर्क: ${brokerName} (${brokerPhone})। मिलते हैं! — ${brandName}`
    }
    return `Namaste ${customerName} ji, aaj humari baat huyi ${lastVisitProperty} ke baare mein. Aap ${appointmentDateHuman} ko ${appointmentTimeHuman} pe site visit kar sakte hain. Location: ${propertyLocation || ''}. Contact: ${brokerName} (${brokerPhone}). Milte hain! — ${brandName}`
  }
}

