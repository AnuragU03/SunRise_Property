import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface AddPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
  onAdded: () => void
}

export function AddPaymentDialog({ open, onOpenChange, leadId, onAdded }: AddPaymentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('discussed')
  const [amountDiscussed, setAmountDiscussed] = useState('')
  const [amountCommitted, setAmountCommitted] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          amount_discussed: Number(amountDiscussed) || 0,
          payment_status: status,
          amount_committed: amountCommitted ? Number(amountCommitted) : undefined,
          commitment_date: date || undefined,
          follow_up_notes: notes || undefined
        })
      })
      if (res.ok) {
        setAmountDiscussed('')
        setAmountCommitted('')
        setDate('')
        setNotes('')
        onAdded()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Payment Discussion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount Discussed</Label>
              <Input 
                type="number" 
                value={amountDiscussed} 
                onChange={e => setAmountDiscussed(e.target.value)}
                placeholder="e.g. 500000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discussed">Discussed</SelectItem>
                  <SelectItem value="committed">Committed</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount Committed</Label>
              <Input 
                type="number" 
                value={amountCommitted} 
                onChange={e => setAmountCommitted(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Commitment Date</Label>
              <Input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)}
              placeholder="Any conditions or next steps?"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !amountDiscussed}>
              {loading ? 'Saving...' : 'Save Log'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
