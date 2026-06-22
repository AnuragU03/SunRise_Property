'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, ArrowUp, ArrowDown, Phone, Ban, MoreHorizontal } from 'lucide-react'
import type { SerializedLead } from '@/lib/services/leadService'
import { decideLeadOwner, type LeadOwner } from '@/lib/orchestrator/rules'

// Soft, low-saturation tints that sit on the warm/cream theme (not loud pastels).
const OWNER_BADGES: Record<LeadOwner, { label: string; className: string }> = {
  matchmaker: { label: 'Matchmaker', className: 'bg-blue-50 text-blue-700 border-blue-100' },
  dead_lead_reengager: { label: 'Re-engager', className: 'bg-violet-50 text-violet-700 border-violet-100' },
  follow_up_agent: { label: 'Follow-up', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  appointment_guardian: { label: 'Guardian', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  manual_broker: { label: 'Broker', className: 'bg-muted text-muted-foreground border-border' },
  none: { label: '—', className: 'bg-muted text-muted-foreground border-transparent' },
}

type SortKey =
  | 'name'
  | 'place'
  | 'property_type'
  | 'status'
  | 'last_contacted_at'
  | 'next_follow_up_date'
  | 'total_calls'
  | 'source'
  | 'created_at'

type SortDir = 'asc' | 'desc'

type Props = {
  leads: SerializedLead[]
  onRowClick: (lead: SerializedLead) => void
  selected?: Set<string>
  onToggleSelect?: (id: string) => void
  onToggleSelectAll?: () => void
}

// Format helpers
function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const past = diff > 0
  const abs = Math.abs(diff)
  const mins = Math.floor(abs / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)

  if (mins < 1) return past ? 'just now' : 'in <1m'
  if (mins < 60) return past ? `${mins}m ago` : `in ${mins}m`
  if (hours < 24) return past ? `${hours}h ago` : `in ${hours}h`
  if (days < 7) return past ? `${days}d ago` : `in ${days}d`
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function formatBudget(range: string | undefined): string {
  if (!range) return '—'
  return range
}

// Hot/Warm/Cold dot — Commit 2 will compute real temperature.
// For Commit 1 placeholder: derive a quick heuristic from total_calls + last_contacted_at.
function getTemperature(lead: SerializedLead): 'hot' | 'warm' | 'cold' {
  const lastContacted = lead.last_contacted_at ? new Date(lead.last_contacted_at).getTime() : 0
  const hoursSinceContact = lastContacted ? (Date.now() - lastContacted) / 3_600_000 : Infinity
  const calls = lead.total_calls ?? 0

  if (hoursSinceContact < 24 && calls >= 1) return 'hot'
  if (hoursSinceContact < 168 || calls >= 1) return 'warm'
  return 'cold'
}

function temperatureColor(t: 'hot' | 'warm' | 'cold'): string {
  if (t === 'hot') return 'bg-red-500'
  if (t === 'warm') return 'bg-amber-500'
  return 'bg-blue-400'
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'outline' {
  if (status === 'won') return 'default'
  if (status === 'lost') return 'outline'
  return 'secondary'
}

export function LeadsTable({ leads, onRowClick, selected, onToggleSelect, onToggleSelectAll }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('next_follow_up_date')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const sortedLeads = useMemo(() => {
    const copy = [...leads]
    copy.sort((a, b) => {
      const aVal = (a as any)[sortKey]
      const bVal = (b as any)[sortKey]

      // Null/undefined sort to end
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      // Numeric
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }

      // Date strings
      if (sortKey === 'last_contacted_at' || sortKey === 'next_follow_up_date' || sortKey === 'created_at') {
        const aTime = new Date(aVal).getTime()
        const bTime = new Date(bVal).getTime()
        return sortDir === 'asc' ? aTime - bTime : bTime - aTime
      }

      // String
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      if (aStr < bStr) return sortDir === 'asc' ? -1 : 1
      if (aStr > bStr) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [leads, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
    return sortDir === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    )
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">No leads match the current filters.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {onToggleSelect && (
              <TableHead className="w-10 text-center">
                <input
                  type="checkbox"
                  checked={leads.length > 0 && leads.every(l => selected?.has(l._id))}
                  onChange={() => onToggleSelectAll?.()}
                  className="h-4 w-4 rounded border-gray-300 accent-accent cursor-pointer"
                  title="Select all"
                />
              </TableHead>
            )}
            <TableHead className="w-10"></TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => toggleSort('name')}
            >
              <span className="inline-flex items-center">Name <SortIcon k="name" /></span>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => toggleSort('place')}
            >
              <span className="inline-flex items-center">City <SortIcon k="place" /></span>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => toggleSort('property_type')}
            >
              <span className="inline-flex items-center">Type <SortIcon k="property_type" /></span>
            </TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Matched</TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => toggleSort('status')}
            >
              <span className="inline-flex items-center">Status <SortIcon k="status" /></span>
            </TableHead>
            <TableHead>Owner</TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => toggleSort('last_contacted_at')}
            >
              <span className="inline-flex items-center">Last call <SortIcon k="last_contacted_at" /></span>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => toggleSort('next_follow_up_date')}
            >
              <span className="inline-flex items-center">Next FU <SortIcon k="next_follow_up_date" /></span>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right"
              onClick={() => toggleSort('total_calls')}
            >
              <span className="inline-flex items-center justify-end">Calls <SortIcon k="total_calls" /></span>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => toggleSort('source')}
            >
              <span className="inline-flex items-center">Source <SortIcon k="source" /></span>
            </TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLeads.map((lead) => {
            const temp = getTemperature(lead)
            const ownership = decideLeadOwner(lead)
            const ownerBadge = OWNER_BADGES[ownership.owner]
            return (
              <TableRow
                key={lead._id}
                className={`cursor-pointer hover:bg-muted/40 ${selected?.has(lead._id) ? 'bg-accent/5' : ''}`}
                onClick={() => onRowClick(lead)}
              >
                {onToggleSelect && (
                  <TableCell className="py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected?.has(lead._id) || false}
                      onChange={() => onToggleSelect(lead._id)}
                      className="h-4 w-4 rounded border-gray-300 accent-accent cursor-pointer"
                    />
                  </TableCell>
                )}
                <TableCell className="py-2">
                  <div className="flex items-center gap-1">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${temperatureColor(temp)}`}
                      title={`Temperature: ${temp}`}
                    />
                    {lead.dnd_status && (
                      <Ban className="h-3 w-3 text-muted-foreground" aria-label="DND" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <div className="font-medium text-sm">{lead.name || 'Unnamed'}</div>
                  <div className="text-xs text-muted-foreground">{lead.phone}</div>
                </TableCell>
                <TableCell className="py-2 text-sm">{lead.place || lead.location_pref || '—'}</TableCell>
                <TableCell className="py-2 text-sm">{lead.property_type || '—'}</TableCell>
                <TableCell className="py-2 text-sm">{formatBudget(lead.budget_range)}</TableCell>
                <TableCell className="py-2 text-sm">
                  {/* matched_property_title might not be on Lead type yet — fall back to '—' */}
                  <span className="text-muted-foreground">—</span>
                </TableCell>
                <TableCell className="py-2">
                  <Badge variant={statusBadgeVariant(lead.status)} className="text-xs capitalize">
                    {(lead.status || 'new').replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="py-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${ownerBadge.className}`}
                    title={`Next call owner: ${ownership.reason}`}
                  >
                    {ownerBadge.label}
                  </Badge>
                </TableCell>
                <TableCell className="py-2 text-sm">
                  {formatRelative(lead.last_contacted_at)}
                </TableCell>
                <TableCell className="py-2 text-sm">
                  {formatRelative(lead.next_follow_up_date)}
                </TableCell>
                <TableCell className="py-2 text-sm text-right tabular-nums">
                  {lead.total_calls ?? 0}
                </TableCell>
                <TableCell className="py-2 text-xs text-muted-foreground">
                  {lead.source || 'manual'}
                </TableCell>
                <TableCell className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
