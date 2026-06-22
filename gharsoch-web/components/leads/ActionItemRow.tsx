import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Calendar, AlertCircle } from 'lucide-react'
import type { SerializedActionItem } from '@/lib/services/actionItemService'
import { isOverdue, daysFromNow } from '@/lib/ui/leadDerivations'

interface ActionItemRowProps {
  action: SerializedActionItem
  onStatusChange: (status: string) => void
}

export function ActionItemRow({ action, onStatusChange }: ActionItemRowProps) {
  const isCompleted = action.status === 'completed'
  const overdue = !isCompleted && isOverdue(action.due_date)

  const formatType = (t: string) => t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')

  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border ${isCompleted ? 'bg-muted/30 border-transparent' : 'bg-card shadow-sm border-border'}`}>
      <Checkbox 
        checked={isCompleted} 
        onCheckedChange={(checked) => onStatusChange(checked ? 'completed' : 'pending')}
        className="mt-1"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {formatType(action.action_type)}
          </span>
          {action.priority === 'high' && !isCompleted && (
            <Badge variant="destructive" className="h-5 text-[10px] uppercase">High Priority</Badge>
          )}
          {action.source === 'call_insight' && (
            <Badge variant="secondary" className="h-5 text-[10px] uppercase">AI Suggested</Badge>
          )}
        </div>
        
        <p className={`text-sm ${isCompleted ? 'text-muted-foreground' : 'text-foreground'} line-clamp-2`}>
          {action.description}
        </p>

        {action.due_date && !isCompleted && (
          <div className={`flex items-center gap-1.5 text-xs mt-3 ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            {overdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
            {overdue ? 'Overdue' : 'Due'} {daysFromNow(action.due_date)}
            <span className="opacity-60 ml-1">({new Date(action.due_date).toLocaleDateString()})</span>
          </div>
        )}
      </div>
    </div>
  )
}
