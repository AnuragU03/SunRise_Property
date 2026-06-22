import { NextRequest } from 'next/server'
import { extractToolPayload, toolSuccess, toolError, resolveCallContext, recordToolEvent } from '@/lib/vapi/toolHelpers'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { actionItemService } from '@/lib/services/actionItemService'

export async function POST(request: NextRequest) {
  let payload: ReturnType<typeof extractToolPayload> | null = null
  try {
    const body = await request.json()
    payload = extractToolPayload(body)
    
    const { broker_id, lead_id, call_doc_id, lead } = await resolveCallContext(payload.vapiCallId, payload.metadata)
    
    if (!lead_id) {
      const errorMsg = 'Could not resolve lead context to flag escalation.'
      await recordToolEvent(payload.vapiCallId, { tool_name: payload.toolName, success: false, result_summary: errorMsg })
      return toolError(payload.toolCallId, errorMsg)
    }

    const { reason, urgency } = payload.args
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'test')
    
    // Update call
    if (call_doc_id) {
      await db.collection('calls').updateOne(
        { _id: new ObjectId(call_doc_id) },
        { $set: { is_escalated: true, escalation_reason: reason || 'Flagged by assistant' } }
      )
    }

    // Increment lead escalation count
    await db.collection('leads').updateOne(
      { _id: new ObjectId(lead_id) },
      { 
        $inc: { escalation_count: 1 },
        $set: { updated_at: new Date() }
      }
    )

    // Also create an action item for the human broker to follow up on the escalation
    await actionItemService.create({
      broker_id: String(broker_id || ''),
      lead_id: String(lead_id),
      action_type: 'escalation',
      description: `Call escalated: ${reason || 'Customer requested human intervention.'}`,
      source: 'vapi_tool',
      call_id: call_doc_id,
      priority: (urgency === 'high' || urgency === 'urgent') ? 'high' : 'medium',
      status: 'pending',
      source_idempotency_key: `${payload.vapiCallId}:escalation`
    })

    const resultString = `Escalation flagged successfully.`

    await recordToolEvent(payload.vapiCallId, {
      tool_name: payload.toolName,
      success: true,
      result_summary: resultString
    })

    return toolSuccess(payload.toolCallId, resultString)
  } catch (error: any) {
    console.error('[VapiTool] flag_escalation error:', error)
    if (payload && payload.toolCallId) {
      return toolError(payload.toolCallId, error.message)
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
}
