'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  lead: any
  onCancel: () => void
  onConfirm: () => void
}

export function ManualOverrideDialog({ open, lead, onCancel, onConfirm }: Props) {
  const [automationStatus, setAutomationStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (!open || !lead?._id) return
    setLoading(true)
    // Check what automation has planned for this lead
    fetch(`/api/leads/${lead._id}/automation-status`)
      .then(r => r.json())
      .then(d => setAutomationStatus(d.next_scheduled_action))
      .catch(() => setAutomationStatus(null))
      .finally(() => setLoading(false))
  }, [open, lead?._id])
  
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Confirm Manual Call
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 text-sm">
          <p>You're about to initiate a call to <strong>{lead.name}</strong>.</p>
          
          {loading && (
            <p className="text-muted-foreground">Checking automation status...</p>
          )}
          
          {!loading && automationStatus && (
            <p className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900">
              Automation is currently planning: <strong>{automationStatus}</strong>. 
              Manual call will skip this scheduled action.
            </p>
          )}
          
          {!loading && !automationStatus && (
            <p className="text-muted-foreground">
              No automated action is currently scheduled for this lead. Manual call is fine.
            </p>
          )}
          
          <p className="text-xs text-muted-foreground">
            Manual calls are tracked for system improvement.
          </p>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="default" onClick={onConfirm}>
            Call now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
