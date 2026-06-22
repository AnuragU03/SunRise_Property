'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SerializedPayment } from '@/lib/services/paymentService'
import { PaymentRow } from './PaymentRow'
import { AddPaymentDialog } from './AddPaymentDialog'

interface PaymentsTabProps {
  leadId: string
}

export function PaymentsTab({ leadId }: PaymentsTabProps) {
  const [payments, setPayments] = useState<SerializedPayment[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch(`/api/payments?lead_id=${leadId}`)
      const data = await res.json()
      if (data.success && data.data) {
        setPayments(data.data)
      }
    } catch (e) {
      console.error('Failed to poll payments', e)
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    fetchPayments()
    const interval = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        fetchPayments()
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchPayments])

  const totalDiscussed = payments.reduce((sum, p) => sum + (p.amount_discussed || 0), 0)
  const totalCommitted = payments.reduce((sum, p) => sum + (p.amount_committed || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Payments</h3>
        <Button onClick={() => setIsAddOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Log
        </Button>
      </div>

      {!loading && payments.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-muted/30 border rounded-lg p-4">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Total Discussed</p>
            <p className="text-2xl font-semibold">₹{totalDiscussed.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-primary">
            <p className="text-sm uppercase tracking-wider mb-1 opacity-80">Total Committed</p>
            <p className="text-2xl font-semibold">₹{totalCommitted.toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading && payments.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">Loading...</div>
        ) : payments.length > 0 ? (
          payments.map((payment) => (
            <PaymentRow key={payment._id} payment={payment} onUpdated={fetchPayments} />
          ))
        ) : (
          <div className="bg-muted/30 border border-dashed rounded-lg p-8 text-center text-muted-foreground">
            No payment discussions logged yet.
          </div>
        )}
      </div>

      <AddPaymentDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen}
        leadId={leadId}
        onAdded={() => {
          setIsAddOpen(false)
          fetchPayments()
        }}
      />
    </div>
  )
}
