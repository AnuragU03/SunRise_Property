import { NextRequest } from 'next/server'
import { extractToolPayload, toolSuccess, toolError, resolveCallContext, recordToolEvent } from '@/lib/vapi/toolHelpers'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { actionItemService } from '@/lib/services/actionItemService'
import { createCalendarEvent } from '@/lib/services/googleCalendarService'

// W3: Smart date/time parser from Phase 12 memory
function isDateSane(d: Date): boolean {
  const now = Date.now()
  const minMs = now - 60 * 60 * 1000           // allow 1 hour past (small clock skew)
  const maxMs = now + 90 * 24 * 60 * 60 * 1000 // 90 days future
  return d.getTime() >= minMs && d.getTime() <= maxMs
}

function parseDateTime(args: Record<string, any>): Date {
  if (args.scheduled_at) {
    const d = new Date(args.scheduled_at)
    if (!isNaN(d.getTime()) && d > new Date() && isDateSane(d)) return d
  }

  const preferredDate = args.preferred_date || args.date
  const preferredTime = String(args.preferred_time || args.time || '11:00')
  let baseDate: Date | null = null

  if (preferredDate) {
    const lower = String(preferredDate).toLowerCase().trim()
    if (lower === 'today') {
      baseDate = new Date()
    } else if (lower === 'tomorrow') {
      baseDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    } else if (lower === 'day-after-tomorrow' || lower === 'day after tomorrow') {
      baseDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
    } else {
      const parsed = new Date(preferredDate)
      if (!isNaN(parsed.getTime())) baseDate = parsed
    }
  }

  const relativeMatch = String(preferredTime).match(/^in\s+(\d+)\s*(min|minute|minutes|hr|hrs|hour|hours)/i)
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1], 10)
    const isHours = relativeMatch[2].toLowerCase().startsWith('h')
    return new Date(Date.now() + amount * (isHours ? 60 : 1) * 60 * 1000)
  }

  if (baseDate) {
    const timeMatch = String(preferredTime).match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)?/i)
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10)
      const minutes = parseInt(timeMatch[2], 10) || 0
      const ampm = (timeMatch[3] || '').toLowerCase()

      if (ampm === 'pm' && hours < 12) hours += 12
      if (ampm === 'am' && hours === 12) hours = 0

      baseDate.setUTCHours(hours - 5, minutes - 30, 0, 0)
      if (baseDate < new Date()) {
        baseDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000)
      }
      if (isDateSane(baseDate)) return baseDate
    }
  }

  const fallback = new Date(Date.now() + 24 * 60 * 60 * 1000)
  fallback.setUTCHours(5, 30, 0, 0)
  return fallback
}

export async function POST(request: NextRequest) {
  let payload: ReturnType<typeof extractToolPayload> | null = null
  try {
    const body = await request.json()
    payload = extractToolPayload(body)

    // Log raw Vapi args for future mismatch debugging
    console.log('[schedule_appointment] Received args:', JSON.stringify({
      scheduled_at: payload.args.scheduled_at,
      preferred_date: payload.args.preferred_date || payload.args.date,
      preferred_time: payload.args.preferred_time || payload.args.time,
      property_id: payload.args.property_id || payload.args.propertyId,
      notes: payload.args.notes,
      vapi_call_id: payload.vapiCallId,
      all_arg_keys: Object.keys(payload.args),
    }))

    const { broker_id, lead_id, call_doc_id, lead } = await resolveCallContext(payload.vapiCallId, payload.metadata)
    
    if (!lead_id) {
      const errorMsg = 'Could not resolve lead context to schedule appointment.'
      await recordToolEvent(payload.vapiCallId, { tool_name: payload.toolName, success: false, result_summary: errorMsg })
      return toolError(payload.toolCallId, errorMsg)
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'test')

    let propertyIdRaw = payload.args.property_id || payload.args.propertyId
    if (!propertyIdRaw) {
      propertyIdRaw = payload.metadata.matched_property_id
    }

    if (!propertyIdRaw && call_doc_id) {
      const callDoc = await db.collection('calls').findOne({ _id: new ObjectId(call_doc_id) })
      if (callDoc?.matched_property_id) {
        propertyIdRaw = String(callDoc.matched_property_id)
      }
    }

    if (!propertyIdRaw || !ObjectId.isValid(String(propertyIdRaw))) {
      return toolError(payload.toolCallId, 'Invalid or missing property_id.')
    }

    const scheduledAt = parseDateTime(payload.args)

    // W1: Idempotency 15min guard
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000)
    const existing = await db.collection('appointments').findOne({
      lead_id: String(lead_id),
      property_id: String(propertyIdRaw),
      scheduled_at: { $gte: fifteenMinAgo },
      status: { $ne: 'cancelled' },
      is_deleted: { $ne: true }
    })

    if (existing) {
      const msg = `Appointment already booked for ${scheduledAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. No duplicate created.`
      await recordToolEvent(payload.vapiCallId, { tool_name: payload.toolName, success: true, result_summary: msg })
      return toolSuccess(payload.toolCallId, msg)
    }

    const property = await db.collection('properties').findOne({ _id: new ObjectId(propertyIdRaw) })
    if (!property) {
      return toolError(payload.toolCallId, 'Property not found.')
    }

    const insertResult = await db.collection('appointments').insertOne({
      lead_id: String(lead_id),
      property_id: String(propertyIdRaw),
      broker_id: String(broker_id || ''),
      agent_id: '',
      scheduled_at: scheduledAt,
      status: 'scheduled',
      reminder_sent: false,
      notes: payload.args.notes || '',
      source: 'vapi_tool',
      vapi_call_id: payload.vapiCallId,
      lead_name: lead?.name || '',
      lead_phone: lead?.phone || '',
      property_title: property.title || '',
      property_location: property.location || '',
      created_at: new Date(),
      updated_at: new Date(),
    })

    const appointmentId = String(insertResult.insertedId)

    // Dual-write to action_items
    const actionItem = await actionItemService.create({
      broker_id: String(broker_id || ''),
      lead_id: lead_id as string,
      action_type: 'site_visit',
      description: `Site visit scheduled for ${property.title}`,
      source: 'vapi_tool',
      call_id: call_doc_id,
      appointment_id: appointmentId,
      due_date: scheduledAt,
      priority: 'high',
      status: 'pending',
      source_idempotency_key: `${payload.vapiCallId}:site_visit`
    })

    await db.collection('appointments').updateOne(
      { _id: insertResult.insertedId },
      { $set: { source_action_item_id: String(actionItem._id) } }
    )

    // Update lead status to 'hot' if warm/cold
    if (lead && (lead.status === 'warm' || lead.status === 'cold' || !lead.status)) {
      await db.collection('leads').updateOne(
        { _id: new ObjectId(lead_id) },
        { $set: { status: 'hot', updated_at: new Date() } }
      )
    }

    // G3.5 Google Calendar Sync (broker_id may be user._id or brokerage_id)
    let broker = await db.collection('users').findOne({ _id: new ObjectId(broker_id) })
    if (!broker) {
      broker = await db.collection('users').findOne({ brokerage_id: String(broker_id) })
    }
    if (broker && broker.google_calendar_enabled !== false) {
      try {
        const brokerName = broker.name || 'Your Broker'
        const cal = await createCalendarEvent(String(broker_id), {
          lead_name: lead?.name || 'Customer',
          lead_phone: lead?.phone || '',
          property_title: property.title || 'Site Visit',
          property_location: property.location || '',
          broker_name: brokerName,
          notes: payload.args.notes || '',
          lead_id: String(lead_id),
          scheduled_at: scheduledAt
        })

        if (cal.ok && cal.event_id) {
          await db.collection('appointments').updateOne(
            { _id: insertResult.insertedId },
            { $set: { calendar_event_id: cal.event_id, calendar_event_url: cal.event_url, calendar_provider: 'google', updated_at: new Date() } }
          )
        } else {
          console.error('[schedule_appointment] Calendar create failed:', cal.error)
        }
      } catch (err) {
        console.error('[schedule_appointment] Calendar threw:', err)
      }
    }

    const spokenDate = scheduledAt.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    console.log('[schedule_appointment] Booked:', {
      raw_iso: scheduledAt.toISOString(),
      spoken_IST: spokenDate,
      vapi_call_id: payload.vapiCallId,
    })

    const resultString = `Appointment confirmed for ${spokenDate} IST.`
    const llmInstruction = `${resultString} Tell the customer: 'Done, ${spokenDate} ko milte hain.' If this date differs from what you said earlier, IMMEDIATELY correct yourself and tell the customer the actual booked date.`

    await recordToolEvent(payload.vapiCallId, {
      tool_name: payload.toolName,
      success: true,
      result_summary: resultString,
    })

    return toolSuccess(payload.toolCallId, llmInstruction)
  } catch (error: any) {
    console.error('[VapiTool] schedule_appointment error:', error)
    if (payload && payload.toolCallId) {
      return toolError(payload.toolCallId, error.message)
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
}
