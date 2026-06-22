import { Badge } from '@/components/ui/badge'
import { Calendar, DollarSign, MessageCircle } from 'lucide-react'
import type { SerializedPayment } from '@/lib/services/paymentService'

interface PaymentRowProps {
  payment: SerializedPayment
  onUpdated: () => void
}

export function PaymentRow({ payment }: PaymentRowProps) {
  const isCommitted = payment.amount_committed && payment.amount_committed > 0
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
      case 'committed': return 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
      case 'negotiating': return 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'
      case 'refused': return 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border bg-card shadow-sm border-border">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">
                ₹{payment.amount_discussed.toLocaleString('en-IN')}
              </span>
              <Badge variant="secondary" className={`capitalize h-6 text-xs ${getStatusColor(payment.payment_status)}`}>
                {payment.payment_status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Discussed on {new Date(payment.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        {isCommitted && (
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Committed</div>
            <div className="font-semibold text-primary">₹{payment.amount_committed?.toLocaleString('en-IN')}</div>
            {payment.commitment_date && (
              <div className="text-[10px] text-muted-foreground flex items-center justify-end gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                {new Date(payment.commitment_date).toLocaleDateString()}
              </div>
            )}
          </div>
        )}
      </div>
      
      {payment.follow_up_notes && (
        <div className="mt-1 bg-muted/30 p-3 rounded-lg text-sm flex gap-2 text-muted-foreground border border-border/50">
          <MessageCircle className="h-4 w-4 shrink-0 mt-0.5 opacity-50" />
          <p className="line-clamp-2">{payment.follow_up_notes}</p>
        </div>
      )}
    </div>
  )
}
