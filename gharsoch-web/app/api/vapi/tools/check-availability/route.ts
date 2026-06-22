import { NextRequest } from 'next/server'
import { extractToolPayload, toolSuccess, toolError, resolveCallContext, recordToolEvent } from '@/lib/vapi/toolHelpers'
import { availabilityService } from '@/lib/services/availabilityService'

export async function POST(request: NextRequest) {
  let payload: ReturnType<typeof extractToolPayload> | null = null
  try {
    const body = await request.json()
    payload = extractToolPayload(body)
    
    // Resolve context
    const { broker_id } = await resolveCallContext(payload.vapiCallId, payload.metadata)
    
    if (!broker_id) {
      const errorMsg = 'Could not resolve broker context.'
      await recordToolEvent(payload.vapiCallId, { tool_name: payload.toolName, success: false, result_summary: errorMsg })
      return toolError(payload.toolCallId, errorMsg)
    }

    const { preferred_day } = payload.args
    const resultString = await availabilityService.getAvailabilityString(broker_id, preferred_day)

    await recordToolEvent(payload.vapiCallId, {
      tool_name: payload.toolName,
      success: true,
      result_summary: 'Returned broker availability'
    })

    return toolSuccess(payload.toolCallId, resultString)
  } catch (error: any) {
    console.error('[VapiTool] check_broker_availability error:', error)
    if (payload && payload.toolCallId) {
      return toolError(payload.toolCallId, error.message)
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
}
