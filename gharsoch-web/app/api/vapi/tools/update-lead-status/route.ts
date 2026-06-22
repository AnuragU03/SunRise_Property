import { NextRequest } from 'next/server'
import { extractToolPayload, toolSuccess, toolError, resolveCallContext, recordToolEvent } from '@/lib/vapi/toolHelpers'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  let payload: ReturnType<typeof extractToolPayload> | null = null
  try {
    const body = await request.json()
    payload = extractToolPayload(body)
    
    const { lead_id } = await resolveCallContext(payload.vapiCallId, payload.metadata)
    
    if (!lead_id) {
      const errorMsg = 'Could not resolve lead context to update status.'
      await recordToolEvent(payload.vapiCallId, { tool_name: payload.toolName, success: false, result_summary: errorMsg })
      return toolError(payload.toolCallId, errorMsg)
    }
    const new_status = payload.args.new_status || payload.args.status
    console.log('[update_lead_status DEBUG] Full args received:', JSON.stringify(payload.args, null, 2))
    
    const VALID_STATUSES = ['new', 'contacted', 'hot', 'warm', 'cold', 'not_interested', 'closed', 'lost']

    if (!new_status || !VALID_STATUSES.includes(new_status)) {
      console.error('[update_lead_status] Invalid or missing new_status:', payload.args)
      return toolError(
        payload.toolCallId,
        `Invalid new_status value: "${new_status}". Must be one of: ${VALID_STATUSES.join(', ')}. Please retry with valid value.`
      )
    }

    const { reason } = payload.args
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'test')
    
    // Append reason to notes if provided
    let updateDoc: any = { status: new_status, updated_at: new Date() }
    
    if (reason) {
      const lead = await db.collection('leads').findOne({ _id: new ObjectId(lead_id) })
      if (lead) {
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        const newNote = `[${timestamp}] Status updated to ${new_status} via Voice Assistant. Reason: ${reason}`
        updateDoc.notes = lead.notes ? `${lead.notes}\n${newNote}` : newNote
      }
    }

    await db.collection('leads').updateOne(
      { _id: new ObjectId(lead_id) },
      { $set: updateDoc }
    )

    const resultString = `Lead status updated to ${new_status}.`

    await recordToolEvent(payload.vapiCallId, {
      tool_name: payload.toolName,
      success: true,
      result_summary: resultString
    })

    return toolSuccess(payload.toolCallId, resultString)
  } catch (error: any) {
    console.error('[VapiTool] update_lead_status error:', error)
    if (payload && payload.toolCallId) {
      return toolError(payload.toolCallId, error.message)
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
}
