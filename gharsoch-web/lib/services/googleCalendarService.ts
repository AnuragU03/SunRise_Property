import { calendar } from '@/lib/googleCalendar'
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export interface CalendarEventInput {
  lead_name: string
  lead_phone: string
  property_title: string
  property_location: string
  broker_name: string
  notes?: string
  lead_id: string
  scheduled_at: Date
  duration_minutes?: number
}

export interface CalendarEventResult {
  ok: boolean
  event_id?: string
  event_url?: string
  error?: string
}

function getEventBody(input: CalendarEventInput) {
  const start = new Date(input.scheduled_at)
  const durationMinutes = Number(input.duration_minutes || 60)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)

  return {
    summary: `${input.lead_name} — ${input.property_title || 'Site Visit'}`,
    description: `Lead: ${input.lead_name}\nPhone: ${input.lead_phone}\nProperty: ${input.property_title} @ ${input.property_location}\nBroker: ${input.broker_name}\nNotes: ${input.notes || ''}\n\nGharSoch lead: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/leads/${input.lead_id}`,
    start: { dateTime: start.toISOString(), timeZone: 'Asia/Kolkata' },
    end: { dateTime: end.toISOString(), timeZone: 'Asia/Kolkata' },
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }] }
  }
}

async function getCalendarId(broker_id: string): Promise<string> {
  const users = await getCollection('users')
  let broker = await users.findOne({ _id: new ObjectId(broker_id) })
  if (!broker) {
    broker = await users.findOne({ brokerage_id: broker_id })
  }
  return broker?.google_calendar_id || 'primary'
}

/**
 * Secondary overbooking guard: query the broker's real Google Calendar freebusy
 * for [start, end). Returns busy=true if the slot overlaps an existing event —
 * including events created outside GharSoch. FAIL-OPEN: if Google is unreachable
 * or unauthenticated, returns busy=false so a transient outage never blocks a
 * legitimate booking (the Mongo-level conflict check still applies).
 */
export async function checkBrokerAvailability(
  broker_id: string,
  startIso: string,
  endIso: string
): Promise<{ ok: boolean; busy: boolean; error?: string }> {
  try {
    const calendarId = await getCalendarId(broker_id)
    const response = await calendar.freebusy.query({
      requestBody: { timeMin: startIso, timeMax: endIso, items: [{ id: calendarId }] },
    })
    const busySlots = response.data.calendars?.[calendarId]?.busy || []
    return { ok: true, busy: busySlots.length > 0 }
  } catch (err: any) {
    console.error('[GoogleCal] freebusy check failed (allowing booking):', err.message)
    return { ok: false, busy: false, error: err.message }
  }
}

export async function createCalendarEvent(broker_id: string, input: CalendarEventInput): Promise<CalendarEventResult> {
  try {
    console.log('[GoogleCal] createCalendarEvent called. broker_id:', broker_id, 'lead:', input.lead_name, 'scheduled_at:', input.scheduled_at)
    const calendarId = await getCalendarId(broker_id)
    console.log('[GoogleCal] Using calendarId:', calendarId)
    const eventBody = getEventBody(input)
    console.log('[GoogleCal] Event summary:', eventBody.summary, 'start:', eventBody.start.dateTime)

    const response = await calendar.events.insert({
      calendarId,
      requestBody: eventBody,
    })

    console.log('[GoogleCal] Event created! id:', response.data.id, 'link:', response.data.htmlLink)
    return {
      ok: true,
      event_id: response.data.id || undefined,
      event_url: response.data.htmlLink || undefined
    }
  } catch (err: any) {
    console.error('[GoogleCal] createCalendarEvent FAILED:', err.message, err.code, err.status, JSON.stringify(err.errors || []))
    return { ok: false, error: err.message }
  }
}

export async function updateCalendarEvent(broker_id: string, event_id: string, patch: Partial<CalendarEventInput>): Promise<CalendarEventResult> {
  try {
    const calendarId = await getCalendarId(broker_id)
    
    // First fetch existing to see if we need full input, but here we assume patch might only contain scheduled_at 
    // To properly update, we might just patch the fields provided.
    // If it's just a time update, we only need to update start and end.
    
    let requestBody: any = {}
    
    if (patch.scheduled_at) {
      const start = new Date(patch.scheduled_at)
      const durationMinutes = Number(patch.duration_minutes || 60)
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
      requestBody.start = { dateTime: start.toISOString(), timeZone: 'Asia/Kolkata' }
      requestBody.end = { dateTime: end.toISOString(), timeZone: 'Asia/Kolkata' }
    }
    
    if (patch.lead_name || patch.property_title) {
       // Only partial summary update might not be safe without all fields, but we try:
       // For this G3.5 phase, schedule_appointment only triggers update if time drifted.
    }

    const response = await calendar.events.patch({
      calendarId,
      eventId: event_id,
      requestBody,
    })

    return {
      ok: true,
      event_id: response.data.id || undefined,
      event_url: response.data.htmlLink || undefined
    }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}

export async function deleteCalendarEvent(broker_id: string, event_id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const calendarId = await getCalendarId(broker_id)
    await calendar.events.delete({
      calendarId,
      eventId: event_id,
    })
    return { ok: true }
  } catch (err: any) {
    // 404 is fine if it's already gone
    if (err.code === 404 || err.status === 404) {
       return { ok: true }
    }
    return { ok: false, error: err.message }
  }
}

export async function fetchCalendarEvent(broker_id: string, event_id: string) {
  try {
    const calendarId = await getCalendarId(broker_id)
    const response = await calendar.events.get({
      calendarId,
      eventId: event_id,
    })
    return response.data
  } catch (err: any) {
    if (err.code === 404 || err.status === 404) return null
    throw err
  }
}
