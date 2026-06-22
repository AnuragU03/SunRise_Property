import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { appointmentService } from '@/lib/services/appointmentService'
import { AppointmentConflictError } from '@/lib/services/appointmentPolicyService'
import { updateCalendarEvent, deleteCalendarEvent } from '@/lib/services/googleCalendarService'
import { whatsappService } from '@/lib/services/whatsappService'
import { availabilityService } from '@/lib/services/availabilityService'
import { paymentService } from '@/lib/services/paymentService'
import { actionItemService } from '@/lib/services/actionItemService'
import { applyLeadAliases } from '@/lib/services/leadFieldAliases'
import type { VoiceToolPayload } from '@/lib/voice/toolHelpers'
import { recordVoiceToolEvent, resolveVoiceCallContext } from '@/lib/voice/toolHelpers'

const DB_NAME = process.env.MONGODB_DB || 'test'

const VALID_LEAD_STATUSES = ['new', 'contacted', 'hot', 'warm', 'cold', 'not_interested', 'closed', 'lost', 'booked', 'completed', 'wrong_number', 'existing_customer']
const VALID_OUTCOMES = ['appointment_booked', 'callback_requested', 'not_interested_now', 'hard_no', 'dnc_requested', 'no_answer', 'customer_busy_reschedule', 'wrong_number', 'existing_customer']

async function getDb() {
  const client = await clientPromise
  return client.db(DB_NAME)
}

function leadQuery(id: string) {
  return ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id as any }
}

function isDateSane(d: Date): boolean {
  const now = Date.now()
  const minMs = now - 60 * 60 * 1000
  const maxMs = now + 90 * 24 * 60 * 60 * 1000
  return d.getTime() >= minMs && d.getTime() <= maxMs
}

function parseDateTime(args: Record<string, any>): Date | null {
  // NOTE: we deliberately do NOT trust args.scheduled_at first. The LLM frequently
  // gets the absolute datetime wrong — wrong weekday math (e.g. "Saturday" → a
  // Wednesday date) and emits a UTC 'Z' time for what the customer meant in IST
  // (10 AM → 10:00Z → 3:30 PM IST). The structured preferred_date + preferred_time
  // path below computes the correct next weekday AND applies the time in IST, so it
  // wins. scheduled_at is only used as a fallback when there's no preferred_date.
  const preferredDate = args.preferred_date || args.date
  const preferredTime = String(args.preferred_time || args.time || '11:00')
  let baseDate: Date | null = null

  if (preferredDate) {
    const lower = String(preferredDate).toLowerCase().trim()
    // English + Hindi/Hinglish relative day terms
    if (lower === 'today' || lower === 'aaj' || lower === 'आज') {
      baseDate = new Date()
    } else if (lower === 'tomorrow' || lower === 'kal' || lower === 'कल') {
      baseDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    } else if (
      lower === 'day-after-tomorrow' || lower === 'day after tomorrow' ||
      lower === 'parso' || lower === 'parson' || lower === 'परसों'
    ) {
      baseDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
    } else {
      // Weekday names (next occurrence) — Monday..Sunday
      const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const wd = weekdays.findIndex((d) => lower.includes(d))
      if (wd >= 0) {
        const today = new Date()
        const cur = today.getDay()
        let diff = wd - cur
        if (diff <= 0) diff += 7 // next occurrence
        baseDate = new Date(today.getTime() + diff * 24 * 60 * 60 * 1000)
      } else if (lower.includes('weekend')) {
        // Next Saturday
        const today = new Date()
        let diff = 6 - today.getDay()
        if (diff <= 0) diff += 7
        baseDate = new Date(today.getTime() + diff * 24 * 60 * 60 * 1000)
      } else {
        const parsed = new Date(preferredDate)
        if (!Number.isNaN(parsed.getTime())) baseDate = parsed
      }
    }
  }

  const relativeMatch = preferredTime.match(/^in\s+(\d+)\s*(min|minute|minutes|hr|hrs|hour|hours)/i)
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1], 10)
    const isHours = relativeMatch[2].toLowerCase().startsWith('h')
    const futureDate = new Date(Date.now() + amount * (isHours ? 60 : 1) * 60 * 1000)
    return isDateSane(futureDate) ? futureDate : null
  }

  // Fallback only: trust the LLM's absolute scheduled_at when no structured
  // preferred_date was given (see note at top of function).
  if (!baseDate && args.scheduled_at) {
    const d = new Date(args.scheduled_at)
    if (!Number.isNaN(d.getTime()) && d > new Date() && isDateSane(d)) return d
  }

  if (!baseDate && args.slot_chosen) {
    const parsed = new Date(args.slot_chosen)
    if (!Number.isNaN(parsed.getTime())) baseDate = parsed
  }

  // FORGIVING FALLBACK: the customer confirmed a visit but the date/time couldn't
  // be parsed (weak model output). Default to tomorrow 11 AM IST rather than failing
  // the whole booking — the broker can adjust later, and the appointment IS captured.
  if (!baseDate) {
    baseDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    baseDate.setUTCHours(11 - 5, 30 - 30 < 0 ? 0 : 0, 0, 0) // 11:00 AM IST
    return isDateSane(baseDate) ? baseDate : null
  }

  if (baseDate) {
    const timeMatch = preferredTime.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)?/i)
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10)
      const minutes = parseInt(timeMatch[2], 10) || 0
      const ampm = (timeMatch[3] || '').toLowerCase()

      if (ampm === 'pm' && hours < 12) hours += 12
      if (ampm === 'am' && hours === 12) hours = 0
      // No am/pm given and hour is 1-8 → assume PM (afternoon/evening visit)
      if (!ampm && hours >= 1 && hours <= 8) hours += 12

      baseDate.setUTCHours(hours - 5, minutes - 30, 0, 0)
      if (baseDate < new Date()) baseDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000)
      return isDateSane(baseDate) ? baseDate : null
    }

    // No time parsed — default to 11 AM IST on the chosen day
    baseDate.setUTCHours(11 - 5, 0, 0, 0)
    if (baseDate < new Date()) baseDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000)
    return isDateSane(baseDate) ? baseDate : null
  }

  return null
}

function normalizeLanguage(value: any): 'en' | 'hi' | 'hinglish' | 'marathi_hinglish' {
  const lang = String(value || '').toLowerCase()
  if (lang === 'hi' || lang === 'hindi') return 'hi'
  if (lang === 'en' || lang === 'english') return 'en'
  if (lang === 'mr' || lang === 'marathi' || lang === 'marathi_hinglish') return 'marathi_hinglish'
  return 'hinglish'
}

function scoreForOutcome(outcome: string) {
  if (outcome === 'appointment_booked' || outcome === 'existing_customer') return 'hot'
  if (outcome === 'callback_requested' || outcome === 'customer_busy_reschedule') return 'warm'
  if (outcome === 'dnc_requested' || outcome === 'hard_no' || outcome === 'wrong_number') return 'dead'
  return 'cold'
}

async function getBroker(db: any, brokerId: string | null) {
  if (!brokerId) return null
  let broker = ObjectId.isValid(brokerId)
    ? await db.collection('users').findOne({ _id: new ObjectId(brokerId) })
    : null
  if (!broker) broker = await db.collection('users').findOne({ brokerage_id: brokerId })
  return broker
}

async function getCustomerContext(payload: VoiceToolPayload) {
  const { broker_id, lead } = await resolveVoiceCallContext(payload.voiceCallId, payload.metadata)
  if (!lead || !broker_id) throw new Error('Could not resolve customer context.')

  const aliasedLead = applyLeadAliases(lead)
  const payments = await paymentService.getLeadPaymentSummary(String(lead._id), broker_id)
  const pendingActions = await actionItemService.countPendingForLead(String(lead._id), broker_id)
  const paymentInfo = payments ? `${payments.status} (committed total Rs ${payments.total_committed}L)` : '0 records'

  return `Customer: ${aliasedLead.name}, Language: ${aliasedLead.preferred_language || 'Not specified'}, Budget: ${aliasedLead.budget_range_structured || 'Not specified'}, Location: ${(aliasedLead.location_preference || []).join(', ') || 'Not specified'}, Last visit: ${aliasedLead.last_visit_property_title || 'None'}, Visit summary: ${aliasedLead.last_visit_summary || 'None'}, Lead status: ${aliasedLead.status || 'unknown'}, Last call: ${aliasedLead.last_call_summary || 'None'}, Payments: ${paymentInfo}, Pending actions: ${pendingActions}`
}

async function bookAppointment(payload: VoiceToolPayload) {
  const db = await getDb()
  const { broker_id, lead_id, lead, call_doc_id, call } = await resolveVoiceCallContext(payload.voiceCallId, payload.metadata)
  if (!lead_id || !lead) throw new Error('Could not resolve lead context to book appointment.')

  // Broker fallback: lead.broker_id → resolved broker_id → DEFAULT_BROKER_ID env.
  // Never fail the booking just because broker resolution came back empty.
  const resolvedBrokerId = String(broker_id || lead.broker_id || process.env.DEFAULT_BROKER_ID || '')

  const propertyId = payload.args.property_id || payload.args.propertyId || payload.metadata.matched_property_id || call?.matched_property_id || lead.matched_property_id
  // Warm/generic leads have NO specific property — the visit is a general office/
  // site visit. Only attach a property when we actually have a valid one; otherwise
  // book the visit without it instead of failing the whole booking.
  const validPropertyId = propertyId && ObjectId.isValid(String(propertyId)) ? String(propertyId) : ''

  const scheduledAt = parseDateTime(payload.args)
  if (!scheduledAt) {
    throw new Error('Could not parse appointment time. Send scheduled_at as an ISO datetime or preferred_date plus preferred_time.')
  }

  const appointment = await appointmentService.create({
    lead_id,
    property_id: validPropertyId,
    scheduled_at: scheduledAt.toISOString(),
    status: 'scheduled',
    notes: payload.args.notes || payload.args.slot_chosen || '',
    broker_id: resolvedBrokerId,
    duration_minutes: Number(payload.args.duration_minutes || 60),
    buffer_minutes: Number(payload.args.buffer_minutes || 15),
    booking_source: 'voice_tool',
  })

  // Immediately mark the lead as booked so the pipeline + appointment views reflect
  // the confirmation without waiting for log_call_outcome.
  await db.collection('leads').updateOne(leadQuery(lead_id), {
    $set: { status: 'booked', interest_level: 'hot', next_follow_up_date: null, updated_at: new Date() },
  })

  if (call_doc_id) {
    await db.collection('calls').updateOne(
      { _id: new ObjectId(call_doc_id) },
      { $set: { appointment_id: appointment._id, call_outcome: 'appointment_booked', updated_at: new Date() } }
    )
  }

  // WhatsApp confirmation is sent centrally by appointmentService.create (idempotent),
  // so both the manual and voice booking paths behave identically. No send here.

  return {
    status: 'confirmed',
    appointment_id: appointment._id,
    scheduled_at: appointment.scheduled_at,
    ends_at: appointment.ends_at,
    message: `Appointment confirmed for ${new Date(appointment.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST.`,
  }
}

async function requestCallback(payload: VoiceToolPayload) {
  const db = await getDb()
  const { lead_id } = await resolveVoiceCallContext(payload.voiceCallId, payload.metadata)
  if (!lead_id) throw new Error('Could not resolve lead context to schedule callback.')

  const callbackAt = parseDateTime({
    preferred_date: payload.args.preferred_date || payload.args.date,
    preferred_time: payload.args.preferred_time || payload.args.callback_time || payload.args.time,
    scheduled_at: payload.args.scheduled_at,
  })
  if (!callbackAt) throw new Error('Could not parse callback time.')

  await db.collection('leads').updateOne(
    leadQuery(lead_id),
    {
      $set: {
        next_follow_up_date: callbackAt,
        status: 'follow_up',
        followup_reason: payload.args.notes || `Callback requested during voice call ${payload.voiceCallId}`,
        updated_at: new Date(),
      },
    }
  )

  return {
    status: 'scheduled',
    next_follow_up_date: callbackAt.toISOString(),
    message: `Callback scheduled for ${callbackAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.`,
  }
}

async function updateLeadStatus(payload: VoiceToolPayload, forcedStatus?: string) {
  const db = await getDb()
  const { lead_id } = await resolveVoiceCallContext(payload.voiceCallId, payload.metadata)
  if (!lead_id) throw new Error('Could not resolve lead context to update status.')

  const newStatus = forcedStatus || payload.args.new_status || payload.args.status
  if (!newStatus || !VALID_LEAD_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid lead status "${newStatus}".`)
  }

  const updateDoc: Record<string, any> = { status: newStatus, updated_at: new Date() }
  if (payload.args.reason || payload.args.notes) {
    const lead = await db.collection('leads').findOne(leadQuery(lead_id))
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    const newNote = `[${timestamp}] Status updated to ${newStatus} by voice tool. Reason: ${payload.args.reason || payload.args.notes}`
    updateDoc.notes = lead?.notes ? `${lead.notes}\n${newNote}` : newNote
  }

  await db.collection('leads').updateOne(leadQuery(lead_id), { $set: updateDoc })
  return `Lead status updated to ${newStatus}.`
}

async function logCallOutcome(payload: VoiceToolPayload, forcedOutcome?: string) {
  const db = await getDb()
  const { lead_id, call_doc_id } = await resolveVoiceCallContext(payload.voiceCallId, payload.metadata)
  const outcome = forcedOutcome || payload.args.outcome
  if (!outcome || !VALID_OUTCOMES.includes(outcome)) throw new Error(`Invalid outcome "${outcome}".`)

  if (call_doc_id) {
    await db.collection('calls').updateOne(
      { _id: new ObjectId(call_doc_id) },
      {
        $set: {
          call_outcome: outcome,
          call_summary: payload.args.summary || payload.args.notes || '',
          tool_outcome_logged: true,
          updated_at: new Date(),
        },
      }
    )
  }

  if (lead_id) {
    const leadUpdate: Record<string, any> = {
      last_call_summary: payload.args.summary || payload.args.notes || '',
      lead_score: scoreForOutcome(outcome),
      last_contacted_at: new Date(),
      first_call_completed: true,
      updated_at: new Date(),
    }
    if (outcome === 'dnc_requested') { leadUpdate.dnd_status = true; leadUpdate.status = 'dnd' }
    else if (outcome === 'appointment_booked') leadUpdate.status = 'booked'
    else if (outcome === 'callback_requested' || outcome === 'customer_busy_reschedule') leadUpdate.status = 'follow_up'
    else if (outcome === 'wrong_number') leadUpdate.status = 'wrong_number'
    else if (outcome === 'not_interested_now') leadUpdate.status = 'contacted'
    else leadUpdate.status = 'contacted'
    await db.collection('leads').updateOne(leadQuery(lead_id), { $set: leadUpdate })
  }

  return { status: 'logged', outcome, lead_score: scoreForOutcome(outcome) }
}

async function saveConversationSummary(payload: VoiceToolPayload) {
  const db = await getDb()
  const { lead_id, call_doc_id } = await resolveVoiceCallContext(payload.voiceCallId, payload.metadata)
  const summary = payload.args.summary || payload.args.notes || ''
  const outcome = payload.args.outcome || ''

  if (call_doc_id) {
    await db.collection('calls').updateOne(
      { _id: new ObjectId(call_doc_id) },
      {
        $set: {
          call_summary: summary,
          call_outcome: outcome || undefined,
          key_requirements: payload.args.key_requirements || payload.args.requirements || '',
          updated_at: new Date(),
        },
      }
    )
  }

  if (lead_id) {
    await db.collection('leads').updateOne(
      leadQuery(lead_id),
      {
        $set: {
          last_call_summary: summary,
          budget_range: payload.args.budget || payload.args.budget_range || undefined,
          location_pref: payload.args.preferred_location || payload.args.location_pref || undefined,
          property_type: payload.args.property_type || undefined,
          timeline: payload.args.timeline || undefined,
          updated_at: new Date(),
        },
      }
    )
  }

  return { status: 'saved', message: 'Conversation summary saved.' }
}

async function sendWhatsapp(payload: VoiceToolPayload) {
  const db = await getDb()
  const { broker_id, lead_id, lead, call_doc_id } = await resolveVoiceCallContext(payload.voiceCallId, payload.metadata)
  if (!lead_id || !lead) throw new Error('Could not resolve lead context to send WhatsApp.')
  if (!lead.phone) throw new Error('Lead has no phone number.')

  const broker = await getBroker(db, broker_id)
  if (!broker) throw new Error('Broker not found.')

  const messageType = payload.args.message_type || 'post_call_followup'
  const lang = normalizeLanguage(lead.preferred_language || payload.args.language)
  let messageText = payload.args.message_text || payload.args.details || ''

  if (!messageText && messageType === 'appointment_confirmation') {
    const appointment = await db.collection('appointments').findOne(
      { lead_id, status: { $nin: ['cancelled', 'deleted'] }, is_deleted: { $ne: true } },
      { sort: { scheduled_at: -1 } }
    )
    if (!appointment) throw new Error('No active appointment found for this lead.')
    messageText = whatsappService.renderAppointmentConfirmation(lead as any, { ...appointment, _id: String(appointment._id) } as any, { ...broker, _id: String(broker._id) } as any, lang)
  }

  if (!messageText) {
    messageText = whatsappService.renderPostCallFollowup(lead as any, { ...broker, _id: String(broker._id) } as any, payload.args.details, lang)
  }

  const sendResult = await whatsappService.sendWhatsapp({
    lead_id,
    broker_id: String(broker_id || ''),
    call_id: call_doc_id || undefined,
    message_type: messageType,
    message_text: messageText,
    language: lang,
    to_phone: lead.phone,
  })

  if (!sendResult.ok) throw new Error(sendResult.error || 'Failed to send WhatsApp message.')
  return `WhatsApp ${messageType} sent to ${lead.name || 'the customer'}.`
}

async function logObjection(payload: VoiceToolPayload) {
  const db = await getDb()
  const { call_doc_id } = await resolveVoiceCallContext(payload.voiceCallId, payload.metadata)
  if (!call_doc_id) throw new Error('Could not resolve call context to log objection.')

  await db.collection('calls').updateOne(
    { _id: new ObjectId(call_doc_id) },
    {
      $push: {
        objections_logged: {
          category: payload.args.objection_category,
          detail: payload.args.objection_detail,
          resolution_attempted: payload.args.resolution_attempted || '',
          resolved: Boolean(payload.args.resolved),
          logged_at: new Date(),
        },
      },
    }
  )

  return `Objection logged: ${payload.args.objection_category || 'general'}.`
}

async function flagEscalation(payload: VoiceToolPayload) {
  const db = await getDb()
  const { broker_id, lead_id, call_doc_id } = await resolveVoiceCallContext(payload.voiceCallId, payload.metadata)
  if (!lead_id) throw new Error('Could not resolve lead context to flag escalation.')

  if (call_doc_id) {
    await db.collection('calls').updateOne(
      { _id: new ObjectId(call_doc_id) },
      { $set: { is_escalated: true, escalation_reason: payload.args.reason || 'Flagged by voice agent' } }
    )
  }

  await db.collection('leads').updateOne(
    leadQuery(lead_id),
    { $inc: { escalation_count: 1 }, $set: { updated_at: new Date() } }
  )

  await actionItemService.create({
    broker_id: String(broker_id || ''),
    lead_id,
    action_type: 'escalation',
    description: `Call escalated: ${payload.args.reason || 'Customer requested human intervention.'}`,
    source: 'agent',
    call_id: call_doc_id,
    priority: (payload.args.urgency === 'high' || payload.args.urgency === 'urgent') ? 'high' : 'medium',
    status: 'pending',
    source_idempotency_key: `${payload.voiceCallId}:escalation`,
  })

  return 'Escalation flagged successfully.'
}

/** Find the appointment a live call is talking about: explicit id → call link → lead's next upcoming. */
async function findActiveAppointment(db: any, payload: VoiceToolPayload, lead_id: string | null, call: any) {
  const explicit = payload.args.appointment_id || payload.metadata.appointment_id || call?.appointment_id
  if (explicit && ObjectId.isValid(String(explicit))) {
    const byId = await db.collection('appointments').findOne({ _id: new ObjectId(String(explicit)) })
    if (byId) return byId
  }
  if (!lead_id) return null
  return db.collection('appointments').findOne(
    {
      lead_id: String(lead_id),
      is_deleted: { $ne: true },
      status: { $in: ['scheduled', 'confirmed', 'rescheduled'] },
      scheduled_at: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
    { sort: { scheduled_at: 1 } }
  )
}

/** Restored Vapi-era tool: live property search against real inventory. */
async function searchProperties(payload: VoiceToolPayload) {
  const db = await getDb()
  const { lead } = await resolveVoiceCallContext(payload.voiceCallId, payload.metadata)

  const location = payload.args.location || payload.args.location_pref || lead?.location_pref || ''
  const propertyType = payload.args.property_type || payload.args.bhk || ''
  const maxPriceLakhs = Number(payload.args.max_budget_lakhs || payload.args.budget_lakhs || 0)

  const filter: Record<string, any> = { is_deleted: { $ne: true }, status: 'available' }
  if (location) {
    const loc = String(location).split(',')[0].trim()
    filter.$or = [
      { location: { $regex: loc, $options: 'i' } },
      { city: { $regex: loc, $options: 'i' } },
    ]
  }
  if (propertyType) filter.type = { $regex: String(propertyType).replace(/\s+/g, '\\s*'), $options: 'i' }
  if (maxPriceLakhs > 0) filter.price = { $lte: maxPriceLakhs * 100_000 }

  let results = await db.collection('properties').find(filter).limit(3).toArray()
  if (!results.length && filter.$or) {
    // Relax location if nothing matched — better to offer something nearby than nothing.
    delete filter.$or
    results = await db.collection('properties').find(filter).limit(3).toArray()
  }
  if (!results.length) {
    return { found: 0, message: 'No matching properties right now. Offer to note their requirement and have the broker follow up.' }
  }

  const lines = results.map((p: any) => {
    const priceLakhs = p.price ? `${Math.round(p.price / 100_000)} lakhs` : 'price on request'
    return `${p.title} by ${p.builder || p.builder_name || 'reputed builder'} — ${p.type || ''} in ${p.location || p.city || ''}, around ${priceLakhs}`
  })
  return { found: results.length, properties: lines, message: `Found ${results.length} matching option(s): ${lines.join(' | ')}` }
}

/** Restored: reschedule the lead's upcoming appointment (policy-checked, calendar + WhatsApp synced). */
async function rescheduleAppointment(payload: VoiceToolPayload) {
  const db = await getDb()
  const { lead_id, lead } = await resolveVoiceCallContext(payload.voiceCallId, payload.metadata)
  if (!lead_id || !lead) throw new Error('Could not resolve lead context to reschedule.')

  const appointment = await findActiveAppointment(db, payload, lead_id, null)
  if (!appointment) throw new Error('No upcoming appointment found for this customer to reschedule.')

  const newTime = parseDateTime(payload.args)
  if (!newTime) throw new Error('Could not parse the new appointment time. Send preferred_date plus preferred_time or scheduled_at.')

  try {
    await appointmentService.update(String(appointment._id), {
      scheduled_at: newTime,
      status: 'rescheduled',
    } as any)
  } catch (err) {
    if (err instanceof AppointmentConflictError) {
      const alternatives = err.alternatives
        .map((iso) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true }))
        .join(', ')
      return { status: 'slot_unavailable', message: `That slot is already booked. Available alternatives: ${alternatives || 'ask for another day'}.`, alternatives: err.alternatives }
    }
    throw err
  }

  // Calendar sync (non-fatal)
  if (appointment.broker_id && appointment.calendar_event_id) {
    await updateCalendarEvent(appointment.broker_id, appointment.calendar_event_id, {
      scheduled_at: newTime,
      duration_minutes: appointment.duration_minutes || 60,
    } as any).catch((e) => console.error('[voice reschedule] calendar update failed:', e))
  }

  // WhatsApp reschedule notice (idempotent per new time)
  if (lead.phone) {
    const updated = { ...appointment, scheduled_at: newTime, _id: String(appointment._id) }
    const lang = normalizeLanguage(lead.preferred_language)
    await whatsappService.sendWhatsapp({
      lead_id,
      broker_id: String(appointment.broker_id || ''),
      appointment_id: String(appointment._id),
      message_type: 'reschedule',
      message_text: whatsappService.renderReschedule(lead as any, appointment as any, updated as any, lang),
      language: lang,
      to_phone: lead.phone,
      idempotency_key: `appointment_reschedule:${appointment._id}:${newTime.toISOString()}`,
    }).catch((e) => console.error('[voice reschedule] whatsapp failed:', e))
  }

  const human = newTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
  return { status: 'rescheduled', appointment_id: String(appointment._id), new_time: newTime.toISOString(), message: `Appointment moved to ${human}.` }
}

/** Restored: cancel the lead's upcoming appointment (calendar removed, WhatsApp ack). */
async function cancelAppointment(payload: VoiceToolPayload) {
  const db = await getDb()
  const { lead_id, lead } = await resolveVoiceCallContext(payload.voiceCallId, payload.metadata)
  if (!lead_id || !lead) throw new Error('Could not resolve lead context to cancel appointment.')

  const appointment = await findActiveAppointment(db, payload, lead_id, null)
  if (!appointment) throw new Error('No upcoming appointment found for this customer to cancel.')

  await db.collection('appointments').updateOne(
    { _id: appointment._id },
    { $set: { status: 'cancelled', cancellation_reason: payload.args.reason || payload.args.notes || 'Cancelled during voice call', updated_at: new Date() } }
  )

  if (appointment.broker_id && appointment.calendar_event_id) {
    const del = await deleteCalendarEvent(appointment.broker_id, appointment.calendar_event_id).catch(() => ({ ok: false }))
    if ((del as any).ok) {
      await db.collection('appointments').updateOne({ _id: appointment._id }, { $unset: { calendar_event_id: '', calendar_event_url: '' } })
    }
  }

  if (lead.phone) {
    const lang = normalizeLanguage(lead.preferred_language)
    await whatsappService.sendWhatsapp({
      lead_id,
      broker_id: String(appointment.broker_id || ''),
      appointment_id: String(appointment._id),
      message_type: 'appointment_cancelled',
      message_text: whatsappService.renderCancellation(lead as any, { ...appointment, _id: String(appointment._id) } as any, lang),
      language: lang,
      to_phone: lead.phone,
      idempotency_key: `appointment_cancelled:${appointment._id}`,
    }).catch((e) => console.error('[voice cancel] whatsapp failed:', e))
  }

  return { status: 'cancelled', appointment_id: String(appointment._id), message: 'Appointment cancelled. The slot has been freed.' }
}

/** Restored: confirm attendance on the upcoming appointment (reminder-call flow). */
async function confirmAppointment(payload: VoiceToolPayload) {
  const db = await getDb()
  const { lead_id } = await resolveVoiceCallContext(payload.voiceCallId, payload.metadata)
  if (!lead_id) throw new Error('Could not resolve lead context to confirm appointment.')

  const appointment = await findActiveAppointment(db, payload, lead_id, null)
  if (!appointment) throw new Error('No upcoming appointment found for this customer to confirm.')

  await db.collection('appointments').updateOne(
    { _id: appointment._id },
    { $set: { status: 'confirmed', confirmed_at: new Date(), updated_at: new Date() } }
  )

  const human = new Date(appointment.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
  return { status: 'confirmed', appointment_id: String(appointment._id), message: `Attendance confirmed for ${human}.` }
}

/**
 * Restored (master prompt §11 / feature list): deterministic EMI + affordability.
 * ALL math happens here — never trust the LLM with numbers (institutional lesson, Phase 6).
 */
async function calculateAffordability(payload: VoiceToolPayload) {
  const priceLakhs = Number(payload.args.property_price_lakhs || payload.args.price_lakhs || 0)
  const downPaymentLakhs = Number(payload.args.down_payment_lakhs || 0)
  const monthlyIncome = Number(payload.args.monthly_income || 0)
  const existingEmi = Number(payload.args.existing_emi || 0)
  const annualRate = Number(payload.args.annual_interest_rate || 8.5)
  const tenureYears = Number(payload.args.tenure_years || 20)

  if (!priceLakhs || priceLakhs <= 0) throw new Error('property_price_lakhs is required (e.g. 75 for 75 lakhs).')

  const principal = Math.max(0, priceLakhs - downPaymentLakhs) * 100_000
  const r = annualRate / 12 / 100
  const n = tenureYears * 12
  const emi = r > 0 ? Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)) : Math.round(principal / n)

  let signal = 'unknown'
  let advice = ''
  if (monthlyIncome > 0) {
    const ratio = (emi + existingEmi) / monthlyIncome
    // Go <= 40%, Reconsider 40-60%, No-Go > 60% (Financial Advisory agent spec)
    if (ratio <= 0.4) { signal = 'comfortable'; advice = 'EMI fits comfortably within 40% of income.' }
    else if (ratio <= 0.6) { signal = 'stretch'; advice = 'EMI is 40-60% of income — possible but tight; suggest higher down payment or longer tenure.' }
    else { signal = 'over_budget'; advice = 'EMI exceeds 60% of income — recommend a lower budget or bigger down payment.' }
  }

  const emiStr = `${Math.round(emi / 1000)} thousand`
  return {
    emi_monthly: emi,
    loan_amount: principal,
    tenure_years: tenureYears,
    interest_rate: annualRate,
    affordability: signal,
    message: `Approximate EMI: ${emiStr} rupees per month for ${tenureYears} years at ${annualRate} percent. ${advice}`,
  }
}

export async function dispatchVoiceTool(payload: VoiceToolPayload) {
  const toolName = payload.toolName.replace(/-/g, '_')
  let result: any

  switch (toolName) {
    case 'get_customer_context':
      result = await getCustomerContext(payload)
      break
    case 'check_availability': {
      const { broker_id } = await resolveVoiceCallContext(payload.voiceCallId, payload.metadata)
      if (!broker_id) throw new Error('Could not resolve broker context.')
      result = await availabilityService.getAvailabilityString(broker_id, payload.args.preferred_day)
      break
    }
    case 'book_appointment':
    case 'schedule_appointment':
      result = await bookAppointment(payload)
      break
    case 'search_properties':
      result = await searchProperties(payload)
      break
    case 'reschedule_appointment':
      result = await rescheduleAppointment(payload)
      break
    case 'cancel_appointment':
      result = await cancelAppointment(payload)
      break
    case 'confirm_appointment':
      result = await confirmAppointment(payload)
      break
    case 'calculate_affordability':
      result = await calculateAffordability(payload)
      break
    case 'request_callback':
    case 'schedule_callback':
      result = await requestCallback(payload)
      break
    case 'log_call_outcome':
      result = await logCallOutcome(payload)
      break
    case 'save_conversation_summary':
      result = await saveConversationSummary(payload)
      break
    case 'send_whatsapp':
      result = await sendWhatsapp(payload)
      break
    case 'update_lead_status':
      result = await updateLeadStatus(payload)
      break
    case 'mark_wrong_number':
      result = await logCallOutcome({ ...payload, args: { ...payload.args, outcome: 'wrong_number' } }, 'wrong_number')
      await updateLeadStatus({ ...payload, args: { ...payload.args, status: 'wrong_number' } }, 'wrong_number')
      break
    case 'handle_dispute':
      result = await logCallOutcome({ ...payload, args: { ...payload.args, outcome: 'dnc_requested' } }, 'dnc_requested')
      break
    case 'acknowledge_existing_customer':
      result = await logCallOutcome({ ...payload, args: { ...payload.args, outcome: 'existing_customer' } }, 'existing_customer')
      await updateLeadStatus({ ...payload, args: { ...payload.args, status: 'existing_customer' } }, 'existing_customer')
      break
    case 'log_objection':
      result = await logObjection(payload)
      break
    case 'flag_escalation':
      result = await flagEscalation(payload)
      break
    default:
      throw new Error(`Unsupported voice tool: ${payload.toolName}`)
  }

  await recordVoiceToolEvent(payload.voiceCallId, {
    tool_name: payload.toolName,
    success: true,
    result_summary: typeof result === 'string' ? result : JSON.stringify(result).slice(0, 500),
  })

  return result
}
