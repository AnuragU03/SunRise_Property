import { NextRequest } from 'next/server'
import { extractToolPayload, toolSuccess, toolError, resolveCallContext, recordToolEvent } from '@/lib/vapi/toolHelpers'
import { paymentService } from '@/lib/services/paymentService'
import { actionItemService } from '@/lib/services/actionItemService'
import { applyLeadAliases } from '@/lib/services/leadFieldAliases'

export async function POST(request: NextRequest) {
  let payload: ReturnType<typeof extractToolPayload> | null = null
  try {
    const body = await request.json()
    payload = extractToolPayload(body)
    
    // Resolve context
    const { broker_id, lead, call_doc_id } = await resolveCallContext(payload.vapiCallId, payload.metadata)
    
    if (!lead || !broker_id) {
      const errorMsg = 'Could not resolve customer context.'
      await recordToolEvent(payload.vapiCallId, { tool_name: payload.toolName, success: false, result_summary: errorMsg })
      return toolError(payload.toolCallId, errorMsg)
    }

    // Wrap lead to get aliased virtual properties (dnc_flag, lead_source)
    const aliasedLead = applyLeadAliases(lead)

    const payments = await paymentService.getLeadPaymentSummary(String(lead._id), broker_id)
    const pendingActions = await actionItemService.countPendingForLead(String(lead._id), broker_id)

    const lang = aliasedLead.preferred_language || 'Not specified'
    const budget = aliasedLead.budget_range_structured || 'Not specified'
    const location = (aliasedLead.location_preference || []).join(', ') || 'Not specified'
    const lastVisitProp = aliasedLead.last_visit_property_title || 'None'
    const lastVisitSum = aliasedLead.last_visit_summary || 'None'
    const status = aliasedLead.status || 'unknown'
    const lastCallSum = aliasedLead.last_call_summary || 'None'
    
    const paymentInfo = payments 
      ? `${payments.status} (committed total ₹${payments.total_committed}L)` 
      : '0 records'

    const resultString = `Customer: ${aliasedLead.name}, Language: ${lang}, Budget: ${budget}, Location: ${location}, Last visit: ${lastVisitProp}, Visit summary: ${lastVisitSum}, Lead status: ${status}, Last call: ${lastCallSum}, Payments: ${paymentInfo}, Pending actions: ${pendingActions}`

    await recordToolEvent(payload.vapiCallId, {
      tool_name: payload.toolName,
      success: true,
      result_summary: 'Returned customer context'
    })

    return toolSuccess(payload.toolCallId, resultString)
  } catch (error: any) {
    console.error('[VapiTool] get_customer_context error:', error)
    if (payload && payload.toolCallId) {
      return toolError(payload.toolCallId, error.message)
    }
    // Fallback if extraction failed
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
}
