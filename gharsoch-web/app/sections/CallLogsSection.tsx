'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { StatStrip } from '@/components/StatStrip'
import { CallRow } from '@/components/CallRow'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { SerializedCall, CallStripData } from '@/lib/services/callService'

type FilterType = 'all' | 'outbound' | 'inbound' | 'missed' | 'voicemail'

function matchesFilter(call: SerializedCall, filter: FilterType) {
  if (filter === 'all') return true
  if (filter === 'outbound') return call.direction === 'outbound'
  if (filter === 'inbound') return call.direction === 'inbound'
  if (filter === 'missed') return String(call.disposition || '').toLowerCase() === 'missed' || String(call.call_status || '').toLowerCase() === 'missed'
  if (filter === 'voicemail') return String(call.disposition || '').toLowerCase() === 'voicemail'
  return true
}

export function CallLogsSection({ calls, strip }: { calls: SerializedCall[]; strip: CallStripData }) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showDeleteAll, setShowDeleteAll] = useState(false)
  const [showDeleteSelected, setShowDeleteSelected] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const filtered = calls.filter(c => matchesFilter(c, filter))
  const allSelected = filtered.length > 0 && filtered.every(c => selected.has(c._id))
  const someSelected = selected.size > 0

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(c => c._id)))
    }
  }

  const handleRowClick = (id: string) => {
    router.push(`/calls/${id}`)
  }

  const handleDeleteAll = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch('/api/calls?all=true', { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success(`Deleted ${data.deletedCount} call log(s).`)
        setShowDeleteAll(false)
        setSelected(new Set())
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to delete call logs.')
      }
    } catch {
      toast.error('Network error — please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteSelected = async () => {
    setIsDeleting(true)
    try {
      const ids = Array.from(selected)
      const res = await fetch('/api/calls', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Deleted ${data.deletedCount} call log(s).`)
        setShowDeleteSelected(false)
        setSelected(new Set())
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to delete selected call logs.')
      }
    } catch {
      toast.error('Network error — please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const stripCells = [
    { label: 'Calls today', value: String(strip.callsToday) },
    { label: 'Connected', value: String(strip.connected) },
    { label: 'Avg duration', value: strip.avgDuration },
    { label: 'Booked', value: String(strip.booked) },
    { label: 'DNC marked', value: String(strip.dncMarked) },
    { label: 'Voice minutes', value: String(strip.vapiMinutes) },
  ]

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'outbound', label: 'Outbound' },
    { key: 'inbound', label: 'Inbound' },
    { key: 'missed', label: 'Missed' },
    { key: 'voicemail', label: 'Voicemail' },
  ]

  return (
    <>
      <section className="page active">
        <div className="crumb">Work · Call Logs</div>
        <div className="head">
          <div>
            <h1 className="title">Call Logs</h1>
            <p className="sub">Full history of inbound, outbound, and missed calls handled by the fleet.</p>
          </div>
          <div className="actions">
            {someSelected && (
              <button
                type="button"
                className="btn ghost sm"
                style={{ color: '#dc2626' }}
                onClick={() => setShowDeleteSelected(true)}
              >
                <Trash2 size={13} strokeWidth={1.8} /> Delete Selected ({selected.size})
              </button>
            )}
            <button
              type="button"
              className="btn ghost sm"
              style={{ color: '#dc2626' }}
              onClick={() => setShowDeleteAll(true)}
              title="Delete all call logs"
            >
              <Trash2 size={13} strokeWidth={1.8} /> Delete All
            </button>
          </div>
        </div>

        <StatStrip cells={stripCells} />

        <div className="panel">
          <div className="panel-head">
            <div style={{ display: 'flex', gap: 8 }}>
              {filters.map(f => (
                <button key={f.key} type="button" className={`btn sm${filter === f.key ? ' primary' : ''}`} onClick={() => setFilter(f.key)}>
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{filtered.length} calls</div>
          </div>
          <div className="panel-body p-0">
            {filtered.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        title="Select all"
                        className="h-4 w-4 rounded border-gray-300 accent-accent cursor-pointer"
                      />
                    </th>
                    <th style={{ width: 44 }}></th>
                    <th>Lead</th>
                    <th>Agent / Campaign</th>
                    <th style={{ textAlign: 'right' }}>Duration</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c._id} style={{ cursor: 'pointer' }}>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(c._id)}
                          onChange={() => toggleSelect(c._id)}
                          className="h-4 w-4 rounded border-gray-300 accent-accent cursor-pointer"
                        />
                      </td>
                      <CallRowInline call={c} onClick={() => handleRowClick(c._id)} />
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                No calls found for this filter.
              </div>
            )}
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={showDeleteAll}
        onOpenChange={setShowDeleteAll}
        title="Delete all call logs?"
        description={`This will permanently delete all ${calls.length} call log(s) including transcripts, outcomes, and recordings. This cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete All'}
        isPending={isDeleting}
        onConfirm={handleDeleteAll}
      />

      <ConfirmDialog
        open={showDeleteSelected}
        onOpenChange={setShowDeleteSelected}
        title={`Delete ${selected.size} call log(s)?`}
        description={`This will permanently delete the selected ${selected.size} call log(s). This cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting…' : `Delete ${selected.size}`}
        isPending={isDeleting}
        onConfirm={handleDeleteSelected}
      />
    </>
  )
}

/**
 * Inline call row cells (without the wrapping <tr>) so we can add the checkbox <td> externally.
 */
import { Pill } from '@/components/Pill'
import type { PillVariant } from '@/components/Pill'

function directionIcon(direction?: string, disposition?: string) {
  if (disposition === 'missed' || String(disposition).toLowerCase() === 'missed') return '✗'
  if (direction === 'inbound') return '↘'
  return '↗'
}

function statusVariant(call: SerializedCall): PillVariant {
  const status = String(call.call_status || '').toLowerCase()
  const disposition = String(call.disposition || '').toLowerCase()
  if (disposition === 'missed' || status === 'missed') return 'failed'
  if (status === 'completed' || status === 'connected') return 'success'
  if (disposition === 'voicemail') return 'amber'
  if (status === 'queued' || status === 'in-progress') return 'running'
  return 'idle'
}

function statusLabel(call: SerializedCall) {
  const disposition = String(call.disposition || '').toLowerCase()
  if (disposition === 'missed') return 'missed'
  if (disposition === 'voicemail') return 'voicemail'
  return call.call_status || 'unknown'
}

function formatDuration(seconds?: number) {
  if (!seconds || seconds === 0) return '—'
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function CallRowInline({ call, onClick }: { call: SerializedCall; onClick: () => void }) {
  const icon = directionIcon(call.direction, call.disposition)
  const variant = statusVariant(call)
  const label = statusLabel(call)

  return (
    <>
      <td onClick={onClick}>
        <div
          style={{
            width: 32, height: 32, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
            background: call.direction === 'inbound' ? 'var(--green-soft)' : call.disposition === 'missed' ? 'var(--red-soft)' : 'var(--accent-soft)',
            color: call.direction === 'inbound' ? 'var(--green)' : call.disposition === 'missed' ? 'var(--red)' : 'var(--accent)',
          }}
        >
          {icon}
        </div>
      </td>
      <td onClick={onClick}>
        <div className="name">{call.lead_name || '—'}</div>
        <div className="meta">{call.lead_phone || ''}</div>
      </td>
      <td onClick={onClick}>
        <div style={{ fontSize: 13 }}>{call.agent_name || '—'}</div>
        <div className="meta">{call.campaign_id ? `Campaign: ${call.campaign_id}` : call.call_type || ''}</div>
      </td>
      <td style={{ textAlign: 'right' }} onClick={onClick}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{formatDuration(call.duration)}</div>
      </td>
      <td onClick={onClick}>
        <Pill variant={variant}>{label.replace('_', ' ')}</Pill>
      </td>
      <td style={{ textAlign: 'right' }} onClick={onClick}>
        <div className="meta">{relativeTime(call.created_at)}</div>
      </td>
    </>
  )
}

export default CallLogsSection
