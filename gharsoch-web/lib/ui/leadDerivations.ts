import type { SerializedLead } from '@/lib/services/leadService'
import type { SerializedActionItem } from '@/lib/services/actionItemService'
import type { SerializedCall } from '@/lib/services/callService'

export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return false
  // Consider overdue if it's strictly before today's date start (ignoring time)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

export function daysFromNow(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  
  const diffTime = target.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays === -1) return 'yesterday'
  
  if (diffDays > 0) return `in ${diffDays}d`
  return `${Math.abs(diffDays)}d ago`
}

export function deriveNextStep(
  lead: SerializedLead,
  actions: SerializedActionItem[]
): { label: string; urgency: 'high' | 'normal' | 'none' } {
  // Only look at pending items
  const pending = actions.filter((a) => a.status === 'pending' || a.status === 'in_progress')
  
  if (pending.length === 0) {
    if (lead.next_follow_up_date && !isOverdue(lead.next_follow_up_date)) {
      return { label: `Follow up ${daysFromNow(lead.next_follow_up_date)}`, urgency: 'normal' }
    } else if (lead.next_follow_up_date && isOverdue(lead.next_follow_up_date)) {
      return { label: `Follow up overdue (${daysFromNow(lead.next_follow_up_date)})`, urgency: 'high' }
    }
    if ((lead.total_calls || 0) === 0) {
      return { label: 'Not yet contacted — initiate first call', urgency: 'normal' }
    }
    return { label: 'No pending actions', urgency: 'none' }
  }

  // Find most urgent item
  // 1. Any overdue high priority
  const overdueHigh = pending.find((a) => isOverdue(a.due_date) && a.priority === 'high')
  if (overdueHigh) return { label: `${formatActionType(overdueHigh.action_type)} overdue`, urgency: 'high' }

  // 2. Any overdue site visit
  const overdueVisit = pending.find((a) => isOverdue(a.due_date) && a.action_type === 'site_visit')
  if (overdueVisit) return { label: `Site visit overdue`, urgency: 'high' }

  // 3. Any overdue item
  const overdueAny = pending.find((a) => isOverdue(a.due_date))
  if (overdueAny) return { label: `${formatActionType(overdueAny.action_type)} overdue`, urgency: 'high' }

  // 4. Any high priority coming up
  const highUpcoming = pending.find((a) => a.priority === 'high')
  if (highUpcoming) return { label: `${formatActionType(highUpcoming.action_type)} ${highUpcoming.due_date ? daysFromNow(highUpcoming.due_date) : 'ASAP'}`, urgency: 'high' }

  // 5. Any site visit coming up
  const visitUpcoming = pending.find((a) => a.action_type === 'site_visit')
  if (visitUpcoming) return { label: `Site visit ${visitUpcoming.due_date ? daysFromNow(visitUpcoming.due_date) : 'planned'}`, urgency: 'normal' }

  // 6. Closest due item
  const withDates = pending.filter(a => a.due_date).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
  if (withDates.length > 0) {
    const closest = withDates[0]
    return { label: `${formatActionType(closest.action_type)} ${daysFromNow(closest.due_date)}`, urgency: 'normal' }
  }

  // Fallback to first pending
  return { label: `${formatActionType(pending[0].action_type)} planned`, urgency: 'normal' }
}

function formatActionType(type: string): string {
  if (!type) return 'Action'
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

export function lifecycleLabel(
  lead: SerializedLead,
  actions: SerializedActionItem[]
): string {
  if (lead.dnd_status || lead.dnc_flag) return "DNC"
  
  const status = String(lead.status || '').toLowerCase()
  if (status === 'lost') return "Lost"
  if (status === 'closed' || status === 'won') return "Closed"
  
  if ((lead.total_calls || 0) === 0) return "New — not contacted"

  const pending = actions.filter((a) => a.status === 'pending' || a.status === 'in_progress')
  
  const hasVisit = pending.some(a => a.action_type === 'site_visit')
  if (hasVisit) return "Appointment booked"

  const hasCallback = pending.some(a => a.action_type === 'callback')
  if (hasCallback) return "Callback requested"

  if (status === 'hot') return "Hot — active interest"
  if (status === 'warm') return "Warm — following up"
  if (status === 'cold') return "Cold — nurturing"
  
  return "In Progress"
}

export function deriveLastContact(
  lead: SerializedLead,
  recentCalls?: SerializedCall[]
): { date: string | null; source: 'lead_field' | 'call_history' | 'none' } {
  if (lead.last_contacted_at) {
    return { date: lead.last_contacted_at, source: 'lead_field' }
  }
  if (recentCalls && recentCalls.length > 0) {
    // Sort desc, pick most recent successful call
    const sorted = [...recentCalls].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const successful = sorted.find(c => c.status !== 'failed')
    if (successful) {
      return { date: successful.created_at, source: 'call_history' }
    }
  }
  return { date: null, source: 'none' }
}
