'use client'

import { useState, useEffect, useCallback } from 'react'
import type { SerializedCall } from '@/lib/services/callService'
import { CallHistoryRow } from './CallHistoryRow'

interface CallHistoryTabProps {
  leadId: string
}

export function CallHistoryTab({ leadId }: CallHistoryTabProps) {
  const [calls, setCalls] = useState<SerializedCall[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCalls = useCallback(async () => {
    try {
      const res = await fetch(`/api/calls/lead/${leadId}`)
      const data = await res.json()
      if (data.success && data.data) {
        setCalls(data.data)
      }
    } catch (e) {
      console.error('Failed to poll call history', e)
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    fetchCalls()
    const interval = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        fetchCalls()
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchCalls])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Call History</h3>
        <span className="text-sm text-muted-foreground">{calls.length} calls logged</span>
      </div>

      <div className="space-y-4">
        {loading && calls.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">Loading history...</div>
        ) : calls.length > 0 ? (
          calls.map((call) => (
            <CallHistoryRow key={call._id} call={call} onAnalyzed={fetchCalls} />
          ))
        ) : (
          <div className="bg-muted/30 border border-dashed rounded-lg p-8 text-center text-muted-foreground">
            No calls recorded for this customer yet.
          </div>
        )}
      </div>
    </div>
  )
}
