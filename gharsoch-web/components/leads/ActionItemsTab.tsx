'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SerializedActionItem } from '@/lib/services/actionItemService'
import { ActionItemRow } from './ActionItemRow'
import { AddActionItemDialog } from './AddActionItemDialog'

interface ActionItemsTabProps {
  leadId: string
  actions: SerializedActionItem[]
  setActions: (actions: SerializedActionItem[]) => void
}

export function ActionItemsTab({ leadId, actions, setActions }: ActionItemsTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchActions = useCallback(async () => {
    try {
      const res = await fetch(`/api/action-items?lead_id=${leadId}`)
      const data = await res.json()
      if (data.success && data.data) {
        setActions(data.data)
      }
    } catch (e) {
      console.error('Failed to poll action items', e)
    }
  }, [leadId, setActions])

  // Poll every 10 seconds, but only if visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        fetchActions()
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchActions])

  const pendingActions = actions.filter((a) => a.status === 'pending' || a.status === 'in_progress')
  const completedActions = actions.filter((a) => a.status === 'completed')

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic UI (Commit 8 scope, doing a basic version here)
    const original = [...actions]
    setActions(actions.map(a => a._id === id ? { ...a, status: newStatus as any } : a))
    
    try {
      const res = await fetch(`/api/action-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
    } catch (e) {
      // Revert on error
      setActions(original)
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Action Items</h3>
        <Button onClick={() => setIsAddOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Action
        </Button>
      </div>

      <div className="space-y-4">
        {pendingActions.length > 0 ? (
          pendingActions.map((action) => (
            <ActionItemRow 
              key={action._id} 
              action={action} 
              onStatusChange={(status) => handleStatusChange(action._id, status)} 
            />
          ))
        ) : (
          <div className="bg-muted/30 border border-dashed rounded-lg p-8 text-center text-muted-foreground">
            No pending action items. 
          </div>
        )}
      </div>

      {completedActions.length > 0 && (
        <div className="pt-6">
          <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Completed</h4>
          <div className="space-y-3 opacity-70">
            {completedActions.map((action) => (
              <ActionItemRow 
                key={action._id} 
                action={action} 
                onStatusChange={(status) => handleStatusChange(action._id, status)} 
              />
            ))}
          </div>
        </div>
      )}

      <AddActionItemDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen}
        leadId={leadId}
        onAdded={() => {
          setIsAddOpen(false)
          fetchActions()
        }}
      />
    </div>
  )
}
