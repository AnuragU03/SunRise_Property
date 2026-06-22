import { NextRequest } from 'next/server'
import { extractToolPayload, toolSuccess, toolError, resolveCallContext, recordToolEvent } from '@/lib/vapi/toolHelpers'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { whatsappService } from '@/lib/services/whatsappService'
import type { WhatsappMessageType } from '@/models/WhatsappLog'
import { userService } from '@/lib/services/userService'

export async function POST(request: NextRequest) {
  let payload: ReturnType<typeof extractToolPayload> | null = null
  try {
    const body = await request.json()
    payload = extractToolPayload(body)
    
    const { broker_id, lead_id, call_doc_id, lead } = await resolveCallContext(payload.vapiCallId, payload.metadata)
    
    if (!lead_id || !lead) {
      const errorMsg = 'Could not resolve lead context to send WhatsApp.'
      await recordToolEvent(payload.vapiCallId, { tool_name: payload.toolName, success: false, result_summary: errorMsg })
      return toolError(payload.toolCallId, errorMsg)
    }

    if (!lead.phone) {
      const errorMsg = 'Lead has no phone number.'
      await recordToolEvent(payload.vapiCallId, { tool_name: payload.toolName, success: false, result_summary: errorMsg })
      return toolError(payload.toolCallId, errorMsg)
    }

    const messageType = payload.args.message_type as WhatsappMessageType
    const details = payload.args.details as string | undefined
    const lang = (lead as any).preferred_language || 'en' // default to 'en' if not set

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'test')
    
    // Fetch broker (broker_id may be user._id or brokerage_id)
    let broker = await db.collection('users').findOne({ _id: new ObjectId(broker_id) })
    if (!broker) {
      broker = await db.collection('users').findOne({ brokerage_id: String(broker_id) })
    }
    if (!broker) {
      return toolError(payload.toolCallId, 'Broker not found.')
    }
    const serializedBroker = { ...broker, _id: broker._id.toString() } as any

    let messageText = ''

    if (messageType === 'appointment_confirmation' || messageType === 'reschedule') {
      const appointment = await db.collection('appointments').findOne(
        { 
          lead_id: String(lead_id), 
          status: { $nin: ['cancelled', 'deleted'] },
          is_deleted: { $ne: true }
        },
        { sort: { scheduled_at: -1 } }
      )
      
      if (!appointment) {
        const errorMsg = 'No active appointment found for this lead.'
        await recordToolEvent(payload.vapiCallId, { tool_name: payload.toolName, success: false, result_summary: errorMsg })
        return toolError(payload.toolCallId, errorMsg)
      }

      if (messageType === 'appointment_confirmation') {
        messageText = whatsappService.renderAppointmentConfirmation(lead as any, appointment as any, serializedBroker, lang)
      } else {
        // Technically reschedule needs oldAppt and newAppt, but for now we'll pass the same one or adjust template to only need new.
        messageText = whatsappService.renderReschedule(lead as any, appointment as any, appointment as any, lang)
      }
    } else if (messageType === 'post_call_followup') {
      messageText = whatsappService.renderPostCallFollowup(lead as any, serializedBroker, details, lang)
    } else if (messageType === 'reengage_followup') {
      // G7: visit-type-aware re-engage follow-up
      const appointment = await db.collection('appointments').findOne(
        { lead_id: String(lead_id), status: { $nin: ['cancelled', 'deleted'] }, is_deleted: { $ne: true } },
        { sort: { scheduled_at: -1 } }
      )
      const apptDate = appointment?.scheduled_at
        ? new Date(appointment.scheduled_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric' })
        : 'TBD'
      const apptTime = appointment?.scheduled_at
        ? new Date(appointment.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true })
        : 'TBD'

      messageText = whatsappService.renderReengageFollowup({
        customerName: (lead as any).name || 'Customer',
        visitType: (lead as any).last_visit_type || 'site_visit',
        lastVisitProperty: (lead as any).last_visit_property || 'the property',
        propertyLocation: appointment?.location || (lead as any).location_pref || '',
        appointmentDateHuman: apptDate,
        appointmentTimeHuman: apptTime,
        brokerName: serializedBroker.name || 'Your Agent',
        brokerPhone: serializedBroker.phone || '',
      }, lang)
    } else {
      messageText = details || 'Hello from GharSoch'
    }

    const sendResult = await whatsappService.sendWhatsapp({
      lead_id: String(lead_id),
      broker_id: String(broker_id),
      call_id: call_doc_id ? String(call_doc_id) : undefined,
      message_type: messageType,
      message_text: messageText,
      language: lang,
      to_phone: lead.phone
    })

    const resultString = sendResult.ok ? `WhatsApp confirmation sent to ${lead.name || 'the customer'}.` : `Failed to send WhatsApp confirmation.`
    const resultSummary = `Status: ${sendResult.delivery_status}. Log: ${sendResult.log_id}. ${sendResult.error ? `Error: ${sendResult.error}` : ''}`

    await recordToolEvent(payload.vapiCallId, {
      tool_name: payload.toolName,
      success: sendResult.ok,
      result_summary: resultSummary
    })

    if (!sendResult.ok) {
      return toolError(payload.toolCallId, 'Failed to send WhatsApp message.')
    }

    return toolSuccess(payload.toolCallId, resultString)
  } catch (error: any) {
    console.error('[VapiTool] send_whatsapp error:', error)
    if (payload && payload.toolCallId) {
      return toolError(payload.toolCallId, error.message)
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
}
