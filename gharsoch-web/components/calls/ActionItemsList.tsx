'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, ListTodo, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { SerializedActionItem } from '@/lib/services/actionItemService'
import { AddActionItemDialog } from '@/components/leads/AddActionItemDialog'
import { Button } from '@/components/ui/button'

export function ActionItemsList({ callId, leadId }: { callId: string; leadId: string }) {
  const [actions, setActions] = useState<SerializedActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)

  const fetchActions = async () => {
    try {
      const res = await fetch(`/api/action-items?call_id=${callId}`)
      const data = await res.json()
      if (data.success && data.data) {
        setActions(data.data)
      }
    } catch (e) {
      console.error('Failed to fetch action items', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActions()
  }, [callId])

  const handleStatusChange = async (id: string, newStatus: string) => {
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
      setActions(original)
      console.error(e)
    }
  }

  const formatType = (t: string) => t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')

  return (
    <Card>
      <CardHeader className="bg-muted/30 border-b py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
          <ListTodo className="w-4 h-4" /> Action Items from Call
        </CardTitle>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {loading && actions.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading action items...</div>
          ) : actions.length > 0 ? (
            actions.map((evt) => (
              <div key={evt._id} className="p-4 flex gap-3 text-sm group hover:bg-muted/5">
                <div className="shrink-0 pt-0.5">
                  <button 
                    onClick={() => handleStatusChange(evt._id, evt.status === 'completed' ? 'pending' : 'completed')}
                    className={`flex items-center justify-center w-5 h-5 rounded border transition-colors ${evt.status === 'completed' ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background hover:border-primary/50'}`}
                  >
                    {evt.status === 'completed' && <CheckSquare className="w-3 h-3" />}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${evt.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {formatType(evt.action_type)}
                    </span>
                    {evt.priority === 'high' && (
                      <Badge variant="destructive" className="px-1.5 py-0 text-[10px] h-4">High</Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs mt-1 leading-relaxed">
                    {evt.description}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center flex flex-col items-center text-muted-foreground">
              <p className="text-sm italic">No action items recorded for this call.</p>
            </div>
          )}
        </div>
      </CardContent>
      <AddActionItemDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen}
        leadId={leadId}
        callId={callId}
        onAdded={() => {
          setIsAddOpen(false)
          fetchActions()
        }}
      />
    </Card>
  )
}
