import { NextRequest } from 'next/server'
import { extractToolPayload, toolSuccess, toolError, resolveCallContext, recordToolEvent } from '@/lib/vapi/toolHelpers'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  let payload: ReturnType<typeof extractToolPayload> | null = null
  try {
    const body = await request.json()
    payload = extractToolPayload(body)
    
    const { call_doc_id } = await resolveCallContext(payload.vapiCallId, payload.metadata)
    
    if (!call_doc_id) {
      const errorMsg = 'Could not resolve call context to log outcome.'
      await recordToolEvent(payload.vapiCallId, { tool_name: payload.toolName, success: false, result_summary: errorMsg })
      return toolError(payload.toolCallId, errorMsg)
    }

    const VALID_OUTCOMES = ['appointment_booked', 'callback_requested', 'not_interested_now', 'hard_no', 'dnc_requested', 'no_answer', 'customer_busy_reschedule']
    const { outcome, summary } = payload.args
    
    if (!outcome || !VALID_OUTCOMES.includes(outcome)) {
      console.error('[log_call_outcome] Invalid or missing outcome:', payload.args)
      return toolError(
        payload.toolCallId,
        `Invalid outcome value: "${outcome}". Must be one of: ${VALID_OUTCOMES.join(', ')}. Please retry with valid value.`
      )
    }
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'test')
    
    await db.collection('calls').updateOne(
      { _id: new ObjectId(call_doc_id) },
      { 
        $set: { 
          call_outcome: outcome || 'unknown',
          call_summary: summary || '',
          tool_outcome_logged: true,
          updated_at: new Date()
        } 
      }
    )

    const resultString = `Call outcome logged as ${outcome}.`

    await recordToolEvent(payload.vapiCallId, {
      tool_name: payload.toolName,
      success: true,
      result_summary: resultString
    })

    return toolSuccess(payload.toolCallId, resultString)
  } catch (error: any) {
    console.error('[VapiTool] log_call_outcome error:', error)
    if (payload && payload.toolCallId) {
      return toolError(payload.toolCallId, error.message)
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
}
