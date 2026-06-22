'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Pill } from '@/components/Pill'
import type { SerializedActionItem } from '@/lib/services/actionItemService'

function formatType(t: string) {
  return t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

export function PendingActionsWidget() {
  const [actions, setActions] = useState<SerializedActionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const res = await fetch('/api/action-items?status=pending&limit=10')
        const data = await res.json()
        if (data.success && data.data) {
          setActions(data.data)
        }
      } catch (e) {
        console.error('Failed to fetch pending actions', e)
      } finally {
        setLoading(false)
      }
    }
    
    fetchActions()
    const interval = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        fetchActions()
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="panel dash-panel">
      <div className="dash-panel-head">
        <div className="dash-panel-title">Pending action items</div>
        <Link className="dash-panel-link" href="/leads">View all →</Link>
      </div>
      <div className="dash-panel-body">
        {loading && actions.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : actions.length > 0 ? (
          actions.map((action) => (
            <Link key={action._id} href={`/leads/${action.lead_id}?tab=actions`} className="dash-compact-row">
              <span className="dash-mini-time shrink-0">
                {action.priority === 'high' ? (
                  <span className="text-destructive font-bold">!</span>
                ) : (
                  <span className="text-muted-foreground text-lg">•</span>
                )}
              </span>
              <span className="min-w-0">
                <strong className="truncate block">{formatType(action.action_type)}</strong>
                <span className="truncate block opacity-80">{action.description}</span>
              </span>
              <span className="dash-chevron is-visible shrink-0">›</span>
            </Link>
          ))
        ) : (
          <div className="dash-empty">
            <p>No pending actions. You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  )
}
