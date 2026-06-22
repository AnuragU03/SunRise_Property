import { NextRequest } from 'next/server'
import { extractToolPayload, toolSuccess, toolError, resolveCallContext, recordToolEvent } from '@/lib/vapi/toolHelpers'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  let payload: ReturnType<typeof extractToolPayload> | null = null
  try {
    const body = await request.json()
    payload = extractToolPayload(body)
    
    const { broker_id, call_doc_id } = await resolveCallContext(payload.vapiCallId, payload.metadata)
    
    if (!call_doc_id) {
      const errorMsg = 'Could not resolve call context to log objection.'
      await recordToolEvent(payload.vapiCallId, { tool_name: payload.toolName, success: false, result_summary: errorMsg })
      return toolError(payload.toolCallId, errorMsg)
    }

    const { objection_category, objection_detail, resolution_attempted, resolved } = payload.args

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'test')
    
    await db.collection('calls').updateOne(
      { _id: new ObjectId(call_doc_id) },
      { 
        $push: { 
          objections_logged: {
            category: objection_category,
            detail: objection_detail,
            resolution_attempted: resolution_attempted || '',
            resolved: Boolean(resolved),
            logged_at: new Date()
          }
        } 
      }
    )

    const resultString = `Objection logged: ${objection_category}.`

    await recordToolEvent(payload.vapiCallId, {
      tool_name: payload.toolName,
      success: true,
      result_summary: resultString
    })

    return toolSuccess(payload.toolCallId, resultString)
  } catch (error: any) {
    console.error('[VapiTool] log_objection error:', error)
    if (payload && payload.toolCallId) {
      return toolError(payload.toolCallId, error.message)
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
}
