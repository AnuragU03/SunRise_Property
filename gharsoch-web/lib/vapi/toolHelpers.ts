import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const DB_NAME = process.env.MONGODB_DB || 'test'

/**
 * Extract payload from Vapi's webhook request body.
 * Vapi can send tool calls in various formats depending on whether it's
 * an assistant-level server URL or an application-level webhook.
 */
export function extractToolPayload(body: any): {
  toolCallId: string
  toolName: string
  args: Record<string, any>
  metadata: Record<string, any>
  vapiCallId: string
} {
  const message = body.message || body

  let toolCallId = ''
  let toolName = ''
  let args: Record<string, any> = {}

  if (message.toolWithToolCallList && message.toolWithToolCallList.length > 0) {
    const tc = message.toolWithToolCallList[0].toolCall
    toolCallId = tc.id || ''
    toolName = tc.function?.name || ''
    args = tc.function?.arguments || {}
  } else if (message.toolCalls && message.toolCalls.length > 0) {
    const tc = message.toolCalls[0]
    toolCallId = tc.id || ''
    toolName = tc.function?.name || ''
    args = tc.function?.arguments || {}
  }

  if (typeof args === 'string') {
    try {
      args = JSON.parse(args)
    } catch {
      args = {}
    }
  }

  const call = message.call || body.call || {}
  const vapiCallId = call.id || message.callId || ''
  
  // Extract metadata (metadata from call overrides or base call config)
  const metadata = call.metadata || message.assistantOverrides?.metadata || {}

  return { toolCallId, toolName, args, metadata, vapiCallId }
}

/**
 * Returns a properly formatted Vapi tool success response.
 * Vapi expects an array of results matching the tool calls.
 */
export function toolSuccess(toolCallId: string, result: string): NextResponse {
  return NextResponse.json({
    results: [
      {
        toolCallId,
        result
      }
    ]
  })
}

/**
 * Returns a properly formatted Vapi tool error response.
 */
export function toolError(toolCallId: string, message: string): NextResponse {
  // Even on error, we typically return 200 with an error string so Vapi handles it gracefully
  // and the assistant can tell the user there was a problem.
  return NextResponse.json({
    results: [
      {
        toolCallId,
        result: `Error: ${message}`
      }
    ]
  })
}

/**
 * Resolves broker_id, lead_id, lead document, and call document ID from context.
 * Implements GharSoch's F2 call-context pattern: metadata wins, fallback to vapi_call_id lookup.
 */
export async function resolveCallContext(
  vapiCallId: string,
  metadata: Record<string, any>
): Promise<{
  broker_id: string | null
  lead_id: string | null
  lead: any | null
  call_doc_id: string | null
}> {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  let broker_id: string | null = metadata.broker_id || metadata.brokerage_id || null
  let lead_id: string | null = metadata.lead_id || metadata.customer_id || null
  let lead: any = null
  let call_doc_id: string | null = null

  // Fallback to database lookup if we have a call ID
  if (vapiCallId) {
    const callDoc = await db.collection('calls').findOne({ vapi_call_id: vapiCallId })
    if (callDoc) {
      call_doc_id = String(callDoc._id)
      if (!broker_id && callDoc.broker_id) {
        broker_id = callDoc.broker_id
      }
      if (!lead_id && callDoc.lead_id) {
        lead_id = String(callDoc.lead_id)
      }
    }
  }

  // Load the lead if we have an ID
  if (lead_id) {
    let query: any = { _id: lead_id }
    if (ObjectId.isValid(lead_id)) {
      query = { _id: new ObjectId(lead_id) }
    }
    
    lead = await db.collection('leads').findOne(query)
    
    // Inherit broker_id from lead as final fallback
    if (lead && !broker_id && lead.broker_id) {
      broker_id = lead.broker_id
    }
  }

  return {
    broker_id,
    lead_id,
    lead,
    call_doc_id
  }
}

/**
 * Append one row to calls.tool_events (atomic $push)
 */
export async function recordToolEvent(
  vapiCallId: string,
  event: {
    tool_name: string
    args_summary?: string
    result_summary?: string
    success: boolean
  }
): Promise<void> {
  if (!vapiCallId) return

  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)

    await db.collection('calls').updateOne(
      { vapi_call_id: vapiCallId },
      {
        $push: {
          tool_events: {
            ...event,
            occurred_at: new Date()
          }
        }
      }
    )
  } catch (err) {
    console.error('[ToolHelpers] Failed to record tool event:', err)
  }
}
