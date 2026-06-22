import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { appointmentService } from '@/lib/services/appointmentService'
import { authErrorResponse, requireRole, requireSession } from '@/lib/auth'
import {
  AppointmentConflictError,
  appointmentPolicyService,
  DEFAULT_APPOINTMENT_BUFFER_MINUTES,
  DEFAULT_APPOINTMENT_DURATION_MINUTES,
} from '@/lib/services/appointmentPolicyService'

export async function GET(request: NextRequest) {
  try {
    await requireSession()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const leadId = searchParams.get('leadId')
    const today = searchParams.get('today')
    const upcoming = searchParams.get('upcoming')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    const appointments = await getCollection('appointments')
    const filter: Record<string, any> = { is_deleted: { $ne: true } }

    if (status) filter.status = status
    if (leadId) filter.lead_id = leadId

    if (today === 'true') {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)
      filter.scheduled_at = { $gte: startOfDay, $lte: endOfDay }
    }

    if (upcoming === 'true') {
      filter.scheduled_at = { $gte: new Date() }
      filter.status = { $in: ['scheduled', 'confirmed'] }
    }

    const [items, total] = await Promise.all([
      appointments.find(filter).sort({ scheduled_at: 1 }).skip(skip).limit(limit).toArray(),
      appointments.countDocuments(filter),
    ])

    return NextResponse.json({ success: true, appointments: items, total })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('[API/Appointments] GET Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech', 'broker'])
    const body = await request.json()

    if (!body.lead_id || !body.property_id || !body.scheduled_at) {
      return NextResponse.json({ success: false, error: 'lead_id, property_id, and scheduled_at are required' }, { status: 400 })
    }

    // Fix timezone: datetime-local input from browser has no timezone indicator.
    // Azure server runs in UTC, so "2026-05-27T07:49" would be interpreted as UTC.
    // Append IST offset (+05:30) if no timezone indicator (Z, +, -) is present after the time.
    let scheduledAt = body.scheduled_at
    if (typeof scheduledAt === 'string' && !scheduledAt.match(/[Z+\-]\d/i) && !scheduledAt.endsWith('Z')) {
      scheduledAt = scheduledAt + '+05:30'
    }

    const appointment = await appointmentService.create({
      lead_id: body.lead_id,
      property_id: body.property_id,
      scheduled_at: scheduledAt,
      status: body.status || 'scheduled',
      notes: body.notes || '',
      broker_id: body.broker_id || process.env.DEFAULT_BROKER_ID || undefined,
      duration_minutes: body.duration_minutes || DEFAULT_APPOINTMENT_DURATION_MINUTES,
      buffer_minutes: body.buffer_minutes || DEFAULT_APPOINTMENT_BUFFER_MINUTES,
      booking_source: 'manual',
    })

    return NextResponse.json({
      success: true,
      appointment,
    })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    if (error instanceof AppointmentConflictError) {
      return NextResponse.json({
        success: false,
        error: error.code,
        message: error.message,
        conflicts: error.conflicts,
        alternatives: error.alternatives,
      }, { status: 409 })
    }
    console.error('[API/Appointments] POST Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech', 'broker'])
    const body = await request.json()
    const { _id, ...updates } = body

    if (!_id) {
      return NextResponse.json({ success: false, error: '_id is required' }, { status: 400 })
    }

    const appointments = await getCollection('appointments')

    // Fetch existing to check calendar event
    const existing = await appointments.findOne({ _id: new ObjectId(_id) })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 })
    }

    if (updates.scheduled_at) {
      // Fix timezone: same logic as POST — append IST offset if no timezone indicator present
      let scheduledAt = updates.scheduled_at
      if (typeof scheduledAt === 'string' && !scheduledAt.match(/[Z+\-]\d/i) && !scheduledAt.endsWith('Z')) {
        scheduledAt = scheduledAt + '+05:30'
      }
      updates.scheduled_at = new Date(scheduledAt)
    }

    if (updates.scheduled_at || updates.duration_minutes || updates.buffer_minutes) {
      const durationMinutes = Number(updates.duration_minutes || existing.duration_minutes || DEFAULT_APPOINTMENT_DURATION_MINUTES)
      const bufferMinutes = Number(updates.buffer_minutes || existing.buffer_minutes || DEFAULT_APPOINTMENT_BUFFER_MINUTES)
      const window = appointmentPolicyService.getAppointmentWindow(
        updates.scheduled_at || existing.scheduled_at,
        durationMinutes,
        bufferMinutes
      )

      await appointmentPolicyService.assertSlotAvailable({
        brokerId: updates.broker_id || existing.broker_id,
        scheduledAt: window.start,
        durationMinutes,
        bufferMinutes,
        excludeAppointmentId: _id,
      })

      updates.scheduled_at = window.start
      updates.ends_at = window.endsAt
      updates.duration_minutes = window.durationMinutes
      updates.buffer_minutes = window.bufferMinutes
    }

    const result = await appointments.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { ...updates, updated_at: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 })
    }

    // Calendar sync: delete on cancel, update on reschedule
    const brokerId = existing.broker_id
    const calEventId = existing.calendar_event_id

    if (brokerId && calEventId) {
      try {
        const { deleteCalendarEvent, updateCalendarEvent } = await import('@/lib/services/googleCalendarService')

        if (updates.status === 'cancelled') {
          // Immediately remove from Google Calendar
          const del = await deleteCalendarEvent(brokerId, calEventId)
          if (del.ok) {
            await appointments.updateOne(
              { _id: new ObjectId(_id) },
              { $unset: { calendar_event_id: '', calendar_event_url: '' } }
            )
            console.log('[appointments PUT] Calendar event deleted on cancel:', calEventId)
          }
        } else if (updates.scheduled_at) {
          // Reschedule — update calendar event time
          const upd = await updateCalendarEvent(brokerId, calEventId, {
            scheduled_at: updates.scheduled_at,
            duration_minutes: updates.duration_minutes || existing.duration_minutes || DEFAULT_APPOINTMENT_DURATION_MINUTES,
          } as any)
          console.log('[appointments PUT] Calendar event updated:', upd.ok ? 'success' : upd.error)
        }
      } catch (err: any) {
        console.error('[appointments PUT] Calendar sync failed (non-fatal):', err.message)
      }
    }

    return NextResponse.json({ success: true, modified: result.modifiedCount })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    if (error instanceof AppointmentConflictError) {
      return NextResponse.json({
        success: false,
        error: error.code,
        message: error.message,
        conflicts: error.conflicts,
        alternatives: error.alternatives,
      }, { status: 409 })
    }
    console.error('[API/Appointments] PUT Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech', 'broker'])
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const all = searchParams.get('all')

    const appointments = await getCollection('appointments')

    // Delete all
    if (all === 'true') {
      const result = await appointments.deleteMany({})
      return NextResponse.json({ success: true, deletedCount: result.deletedCount })
    }

    // Bulk delete by ids (from request body)
    if (!id) {
      let body: any = {}
      try { body = await request.json() } catch {}
      const ids: string[] = body.ids || []
      if (!ids.length) {
        return NextResponse.json({ success: false, error: 'id or ids is required' }, { status: 400 })
      }
      const result = await appointments.deleteMany({ _id: { $in: ids.map(i => new ObjectId(i)) } })
      return NextResponse.json({ success: true, deletedCount: result.deletedCount })
    }

    // Single delete — clean up calendar first
    const existing = await appointments.findOne({ _id: new ObjectId(id) })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 })
    }

    // Delete calendar event if one exists
    if (existing.broker_id && existing.calendar_event_id) {
      try {
        const { deleteCalendarEvent } = await import('@/lib/services/googleCalendarService')
        await deleteCalendarEvent(existing.broker_id, existing.calendar_event_id)
        console.log('[appointments DELETE] Calendar event deleted:', existing.calendar_event_id)
      } catch (err: any) {
        console.error('[appointments DELETE] Calendar cleanup failed (non-fatal):', err.message)
      }
    }

    await appointments.deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json({ success: true })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('[API/Appointments] DELETE Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
