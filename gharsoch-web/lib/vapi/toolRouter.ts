import type { AgentRunContext } from '@/lib/runAgent'
import { calculateAffordabilityTool } from '@/lib/vapi/tools/calculateAffordability'
import { appointmentCancelTool } from '@/lib/vapi/tools/cancelAppointment'
import { appointmentConfirmTool } from '@/lib/vapi/tools/confirmAppointment'
import { bookAppointmentTool } from '@/lib/vapi/tools/bookAppointment'
import { markDndTool } from '@/lib/vapi/tools/markDnd'
import { qualifyLeadTool } from '@/lib/vapi/tools/qualifyLead'
import { appointmentRescheduleTool } from '@/lib/vapi/tools/rescheduleAppointment'
import { scheduleCallbackTool } from '@/lib/vapi/tools/scheduleCallback'
import { searchPropertiesTool } from '@/lib/vapi/tools/searchProperties'

export async function dispatchTool(
  toolName: string,
  args: Record<string, any>,
  ctx: AgentRunContext
) {
  switch (toolName) {
    case 'search_properties':
      return await searchPropertiesTool(args, ctx)
    case 'qualify_lead':
      return await qualifyLeadTool(args, ctx)
    case 'book_appointment':
      return await bookAppointmentTool(args, ctx)
    case 'schedule_callback':
      return await scheduleCallbackTool(args, ctx)
    case 'mark_dnd':
      return await markDndTool(args, ctx)
    case 'calculate_affordability':
      return await calculateAffordabilityTool(args, ctx)
    case 'confirm_appointment':
      return await appointmentConfirmTool(args, ctx)
    case 'reschedule_appointment':
      return await appointmentRescheduleTool(args, ctx)
    case 'cancel_appointment':
      return await appointmentCancelTool(args, ctx)
    // G2 Defensive Logging: These tools should use per-tool URLs configured in Vapi, not the central webhook
    case 'get_customer_context':
    case 'check_availability':
    case 'log_objection':
    case 'schedule_appointment':
    case 'flag_escalation':
    case 'log_call_outcome':
    case 'update_lead_status':
      throw new Error(`Misconfiguration: Tool ${toolName} requires a per-tool server URL in Vapi.`)
    default:
      throw new Error(`Unsupported Vapi tool: ${toolName}`)
  }
}
