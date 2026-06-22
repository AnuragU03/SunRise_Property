import clientPromise from '@/lib/mongodb'
import type { Appointment } from '@/models/Appointment'
import { ObjectId } from 'mongodb'
import { createCalendarEvent, checkBrokerAvailability } from '@/lib/services/googleCalendarService'
import { whatsappService, resolveWhatsappLanguage } from '@/lib/services/whatsappService'
import {
  appointmentPolicyService,
  AppointmentConflictError,
  DEFAULT_APPOINTMENT_BUFFER_MINUTES,
  DEFAULT_APPOINTMENT_DURATION_MINUTES,
} from '@/lib/services/appointmentPolicyService'

const DB_NAME = process.env.MONGODB_DB || 'test'
const COLLECTION = 'appointments'
const IST_TIMEZONE = 'Asia/Kolkata'

export type SerializedAppointment = Omit<Appointment, '_id' | 'scheduled_at' | 'ends_at' | 'created_at' | 'updated_at' | 'source_action_item_id'> & {
  _id: string
  scheduled_at: string
  ends_at?: string | null
  created_at: string
  updated_at: string
  // G1: serialized ObjectId
  source_action_item_id?: string | null
}

export type AppointmentDetail = SerializedAppointment & {
  lead?: {
    _id: string
    name: string
    phone: string
    email?: string
    interest_level?: string
    status?: string
  } | null
  property?: {
    _id: string
    title: string
    builder?: string
    location?: string
    price?: number
    status?: string
  } | null
  related_runs: Array<{
    run_id: string
    agent_id: string
    agent_name: string
    status: string
    started_at: string
    summary?: string
  }>
}

export type AppointmentStripData = {
  total: number
  confirmed: number
  scheduled: number
  rescheduled: number
  awaiting: number
  completed: number
}

function toIso(value?: Date | string | null) {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function serializeAppointment(appointment: any): SerializedAppointment {
  return {
    ...appointment,
    _id: String(appointment._id),
    scheduled_at: toIso(appointment.scheduled_at) || new Date().toISOString(),
    ends_at: toIso(appointment.ends_at),
    created_at: toIso(appointment.created_at) || new Date().toISOString(),
    updated_at: toIso(appointment.updated_at) || new Date().toISOString(),
    // G1: serialize action item back-link
    source_action_item_id: appointment.source_action_item_id ? String(appointment.source_action_item_id) : null,
  }
}

function byScheduledAtAscending(a: any, b: any) {
  return new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime()
}

function getIstDateKey(value: Date | string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

async function getCollection() {
  const client = await clientPromise
  return client.db(DB_NAME).collection<Appointment>(COLLECTION)
}

async function listAllAppointments() {
  const collection = await getCollection()
  return (await collection.find({
    lead_id: { $exists: true, $nin: ['', null] },
    is_deleted: { $ne: true },
  } as any).toArray()).sort(byScheduledAtAscending)
}

export const appointmentService = {
  async listToday(): Promise<SerializedAppointment[]> {
    const todayKey = getIstDateKey(new Date())
    const appointments = await listAllAppointments()

    return appointments
      .filter((appointment) => getIstDateKey(appointment.scheduled_at) === todayKey)
      .map(serializeAppointment)
  },

  async listUpcoming(days: number = 7): Promise<SerializedAppointment[]> {
    const todayKey = getIstDateKey(new Date())
    const appointments = await listAllAppointments()

    return appointments
      .filter((appointment) => {
        const key = getIstDateKey(appointment.scheduled_at)
        // Include from tomorrow onwards (today is shown in listToday)
        return key > todayKey
      })
      .slice(0, Math.max(days * 12, 50))
      .map(serializeAppointment)
  },

  async listAll(): Promise<SerializedAppointment[]> {
    const appointments = await listAllAppointments()
    return appointments.map(serializeAppointment)
  },

  async get(id: string): Promise<AppointmentDetail | null> {
    const collection = await getCollection()
    const appointment = await collection.findOne({ _id: new ObjectId(id) })

    if (!appointment) {
      return null
    }

    const client = await clientPromise
    const db = client.db(DB_NAME)

    const [lead, property, rawRuns] = await Promise.all([
      appointment.lead_id ? db.collection('leads').findOne({ _id: new ObjectId(appointment.lead_id), is_deleted: { $ne: true } }) : null,
      appointment.property_id ? db.collection('properties').findOne({ _id: new ObjectId(appointment.property_id), is_deleted: { $ne: true } }) : null,
      db.collection('agent_execution_logs').find({}).limit(200).toArray(),
    ])

    const related_runs = rawRuns
      .filter((run: any) => {
        const leadId = appointment.lead_id
        const propertyId = appointment.property_id
        const input = run.input_data || {}
        const output = run.output_data || {}
        const matches = Array.isArray(output.match_details) ? output.match_details : []

        return (
          input.lead_id === leadId ||
          input.client_id === leadId ||
          input.property_id === propertyId ||
          output.lead_id === leadId ||
          output.property_id === propertyId ||
          matches.some((match: any) => match.client_id === leadId || match.property_id === propertyId)
        )
      })
      .sort((a: any, b: any) => new Date(b.started_at || b.created_at || 0).getTime() - new Date(a.started_at || a.created_at || 0).getTime())
      .slice(0, 8)
      .map((run: any) => ({
        run_id: run.run_id,
        agent_id: run.agent_id,
        agent_name: run.agent_name,
        status: run.status,
        started_at: toIso(run.started_at || run.created_at) || new Date().toISOString(),
        summary:
          run.reasoning_summary?.summary ||
          run.output_data?.summary ||
          run.reasoning_steps?.[run.reasoning_steps.length - 1]?.content ||
          '',
      }))

    return {
      ...serializeAppointment(appointment),
      lead: lead
        ? {
            _id: String(lead._id),
            name: lead.name || appointment.lead_name,
            phone: lead.phone || appointment.lead_phone,
            email: lead.email,
            interest_level: lead.interest_level,
            status: lead.status,
          }
        : null,
      property: property
        ? {
            _id: String(property._id),
            title: property.title || appointment.property_title,
            builder: property.builder || property.builder_name,
            location: property.location || appointment.property_location,
            price: property.price,
            status: property.status,
          }
        : null,
      related_runs,
    }
  },

  async update(id: string, patch: Partial<Appointment>) {
    const collection = await getCollection()
    const existing = await collection.findOne({ _id: new ObjectId(id) })
    if (!existing) {
      throw new Error('Appointment not found.')
    }

    const updateDoc: Record<string, any> = {
      ...patch,
      updated_at: new Date(),
    }

    if (patch.scheduled_at || patch.duration_minutes || patch.buffer_minutes) {
      const durationMinutes = Number(patch.duration_minutes || existing.duration_minutes || DEFAULT_APPOINTMENT_DURATION_MINUTES)
      const bufferMinutes = Number(patch.buffer_minutes || existing.buffer_minutes || DEFAULT_APPOINTMENT_BUFFER_MINUTES)
      const window = appointmentPolicyService.getAppointmentWindow(
        patch.scheduled_at || existing.scheduled_at,
        durationMinutes,
        bufferMinutes
      )

      await appointmentPolicyService.assertSlotAvailable({
        brokerId: patch.broker_id || existing.broker_id,
        scheduledAt: window.start,
        durationMinutes,
        bufferMinutes,
        excludeAppointmentId: id,
      })

      updateDoc.scheduled_at = window.start
      updateDoc.ends_at = window.endsAt
      updateDoc.duration_minutes = window.durationMinutes
      updateDoc.buffer_minutes = window.bufferMinutes
    }

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateDoc })
  },

  async create(input: {
    lead_id: string
    property_id: string
    scheduled_at: string
    status?: string
    notes?: string
    // G1: new optional fields
    broker_id?: string
    calendar_event_id?: string | null
    calendar_event_url?: string | null
    calendar_provider?: 'google' | 'outlook' | null
    source_action_item_id?: string | null
    reminder_call_id?: string | null
    duration_minutes?: number
    buffer_minutes?: number
    booking_source?: string | null
    hold_id?: string | null
  }) {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    // property_id is OPTIONAL: warm/generic leads book a general office/site visit
    // with no specific property attached. Only look it up when one was provided.
    const hasProperty = Boolean(input.property_id && ObjectId.isValid(input.property_id))
    const [lead, property] = await Promise.all([
      db.collection('leads').findOne({ _id: new ObjectId(input.lead_id), is_deleted: { $ne: true } }),
      hasProperty
        ? db.collection('properties').findOne({ _id: new ObjectId(input.property_id), is_deleted: { $ne: true } })
        : Promise.resolve(null),
    ])

    if (!lead) {
      throw new Error('Lead not found for booking.')
    }
    if (hasProperty && !property) {
      throw new Error('Property not found for booking.')
    }

    const collection = await getCollection()
    const now = new Date()
    const brokerId = input.broker_id || (lead as any).broker_id || undefined
    const window = appointmentPolicyService.getAppointmentWindow(
      input.scheduled_at,
      input.duration_minutes || DEFAULT_APPOINTMENT_DURATION_MINUTES,
      input.buffer_minutes || DEFAULT_APPOINTMENT_BUFFER_MINUTES
    )

    await appointmentPolicyService.assertSlotAvailable({
      brokerId,
      scheduledAt: window.start,
      durationMinutes: window.durationMinutes,
      bufferMinutes: window.bufferMinutes,
    })

    // Secondary guard: respect the broker's real Google Calendar (catches external
    // events the app didn't create). Fail-open — see checkBrokerAvailability.
    if (brokerId) {
      const fb = await checkBrokerAvailability(String(brokerId), window.start.toISOString(), window.endsAt.toISOString())
      if (fb.ok && fb.busy) {
        const alternatives = await appointmentPolicyService.suggestAlternatives({
          brokerId,
          scheduledAt: window.start,
          durationMinutes: window.durationMinutes,
          bufferMinutes: window.bufferMinutes,
          count: 3,
        })
        throw new AppointmentConflictError(
          "Requested slot is busy on the broker's Google Calendar.",
          [],
          alternatives
        )
      }
    }

    const document: Omit<Appointment, '_id'> = {
      lead_id: input.lead_id,
      property_id: input.property_id,
      agent_id: '',
      scheduled_at: window.start,
      ends_at: window.endsAt,
      duration_minutes: window.durationMinutes,
      buffer_minutes: window.bufferMinutes,
      status: input.status || 'scheduled',
      reminder_sent: false,
      notes: input.notes || '',
      lead_name: lead.name || '',
      lead_phone: lead.phone || '',
      property_title: property?.title || 'Office visit',
      property_location: property?.location || '',
      created_at: now,
      updated_at: now,
      // G1: pass through new fields
      broker_id: brokerId,
      calendar_event_id: input.calendar_event_id ?? null,
      calendar_event_url: input.calendar_event_url ?? null,
      calendar_provider: input.calendar_provider ?? null,
      source_action_item_id: input.source_action_item_id ?? null,
      reminder_call_id: input.reminder_call_id ?? null,
      booking_source: input.booking_source || 'manual',
      hold_id: input.hold_id ?? null,
    }

    const result = await collection.insertOne(document)
    const appointmentId = String(result.insertedId)

    // Resolve broker once — used for both calendar sync and the WhatsApp confirmation.
    // broker_id may be a user._id OR a brokerage_id — try both.
    let bookingBroker: any = null
    if (document.broker_id) {
      bookingBroker = await db.collection('users').findOne({ _id: new ObjectId(document.broker_id) })
      if (!bookingBroker) {
        bookingBroker = await db.collection('users').findOne({ brokerage_id: document.broker_id })
      }
    }

    // G3.5 Google Calendar Sync (Manual path parity with voice tool)
    console.log('[appointmentService] Calendar sync check. broker_id:', document.broker_id || 'MISSING')
    if (document.broker_id) {
      try {
        const broker = bookingBroker
        console.log('[appointmentService] Broker lookup:', broker ? `found (${broker.name}) via ${broker._id}` : 'NOT FOUND in _id or brokerage_id', 'calendar_enabled:', broker?.google_calendar_enabled)
        if (broker && broker.google_calendar_enabled !== false) {
          const brokerName = broker.name || 'Your Broker'
          const cal = await createCalendarEvent(document.broker_id, {
            lead_name: document.lead_name || 'Customer',
            lead_phone: document.lead_phone || '',
            property_title: document.property_title || 'Site Visit',
            property_location: document.property_location || '',
            broker_name: brokerName,
            notes: document.notes || '',
            lead_id: document.lead_id,
            scheduled_at: document.scheduled_at,
            duration_minutes: document.duration_minutes,
          })

          if (cal.ok && cal.event_id) {
            await collection.updateOne(
              { _id: result.insertedId },
              { $set: { calendar_event_id: cal.event_id, calendar_event_url: cal.event_url, calendar_provider: 'google', updated_at: new Date() } }
            )
            document.calendar_event_id = cal.event_id
            document.calendar_event_url = cal.event_url
            document.calendar_provider = 'google'
            console.log('[appointmentService] Calendar event created:', cal.event_id)
          } else {
            console.error('[appointmentService] Calendar create failed:', cal.error)
          }
        } else {
          console.log('[appointmentService] Calendar sync skipped: broker not found or calendar disabled')
        }
      } catch (err) {
        console.error('[appointmentService] Calendar threw:', err)
      }
    } else {
      console.log('[appointmentService] Calendar sync skipped: no broker_id on document')
    }

    // WhatsApp confirmation — both manual and voice bookings flow through here, so
    // sending it once at this point keeps the two paths consistent. Idempotency key
    // guarantees a given appointment+time is confirmed at most once.
    if (lead.phone && document.lead_id) {
      try {
        const lang = resolveWhatsappLanguage((lead as any).preferred_language)
        const serializedAppt = serializeAppointment({ ...document, _id: result.insertedId })
        const messageText = whatsappService.renderAppointmentConfirmation(
          lead as any,
          serializedAppt as any,
          { ...(bookingBroker || {}), name: bookingBroker?.name || 'Your Broker' } as any,
          lang
        )
        await whatsappService.sendWhatsapp({
          lead_id: document.lead_id,
          broker_id: String(document.broker_id || ''),
          appointment_id: appointmentId,
          message_type: 'appointment_confirmation',
          message_text: messageText,
          language: lang,
          to_phone: lead.phone,
          idempotency_key: `appointment_confirmation:${appointmentId}:${window.start.toISOString()}`,
        })
        console.log('[appointmentService] WhatsApp confirmation sent for appointment', appointmentId)
      } catch (err) {
        console.error('[appointmentService] WhatsApp confirmation failed (non-fatal):', (err as Error).message)
      }
    }

    return serializeAppointment({ ...document, _id: result.insertedId })
  },

  async getStripData(): Promise<AppointmentStripData> {
    const appointments = await listAllAppointments()
    const todayKey = getIstDateKey(new Date())

    // B19: Count cards must match list semantics — today + upcoming only.
    // Past appointments excluded from cards (also invisible in lists).
    const relevant = appointments.filter((item: any) => {
      const key = getIstDateKey(item.scheduled_at)
      return key >= todayKey
    })

    return {
      total: relevant.length,
      confirmed: relevant.filter((item: any) => item.status === 'confirmed').length,
      scheduled: relevant.filter((item: any) => item.status === 'scheduled').length,
      rescheduled: relevant.filter((item: any) => item.status === 'rescheduled').length,
      awaiting: relevant.filter((item: any) => item.status === 'awaiting_reply' || item.status === 'awaiting').length,
      completed: relevant.filter((item: any) => item.status === 'completed').length,
    }
  },
}
