'use client'

import { useState, useMemo, useCallback, useEffect, useRef, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Trash2, PhoneCall, Database } from 'lucide-react'
import { LeadsTable } from './LeadsTable'
import { LeadsSearch } from './LeadsSearch'
import { LeadsFilterBar, type LeadsFilters } from './LeadsFilterBar'
import { LeadsViewToggle } from './LeadsViewToggle'
import { useLeadsViewPreference } from '@/hooks/useLeadsViewPreference'
import { LeadPipelineSection } from '@/app/sections/LeadPipelineSection'
import { LeadDetailsSheet } from '@/components/LeadDetailsSheet'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from 'sonner'
import type { LeadPipelineStage, LeadPipelineStats, SerializedLead } from '@/lib/services/leadService'

type Props = {
  allLeads: SerializedLead[]
  initialColumns: Record<LeadPipelineStage, SerializedLead[]>
  stats: LeadPipelineStats
}

type CallStatus = {
  active?: boolean
  totalLeads?: number
  currentLead?: string
  current?: string
  completed?: string[]
  completedLeads?: string[]
  pending?: string[]
  pendingLeads?: string[]
  results?: Array<{
    success: boolean
    lead: string
    builder?: string
    joinUrl?: string
    error?: string
  }>
}

export function LeadsWorkspace({ allLeads, initialColumns, stats }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [view, setView] = useLeadsViewPreference()
  const [showAllLeads, setShowAllLeads] = useState(false)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Parse search + filters from URL
  const search = searchParams.get('q') ?? ''
  const filters: LeadsFilters = useMemo(() => {
    const parseArr = (key: string): string[] => {
      const v = searchParams.get(key)
      return v ? v.split(',').filter(Boolean) : []
    }
    const dndRaw = searchParams.get('dnd')
    const dnd: 'all' | 'hide' | 'only' =
      dndRaw === 'hide' || dndRaw === 'only' ? dndRaw : 'all'
    return {
      status: parseArr('status'),
      cities: parseArr('cities'),
      propertyTypes: parseArr('types'),
      sources: parseArr('sources'),
      dnd,
    }
  }, [searchParams])

  // URL update helper
  const updateUrl = useCallback(
    (newSearch: string, newFilters: LeadsFilters) => {
      const params = new URLSearchParams()
      if (newSearch) params.set('q', newSearch)
      if (newFilters.status.length) params.set('status', newFilters.status.join(','))
      if (newFilters.cities.length) params.set('cities', newFilters.cities.join(','))
      if (newFilters.propertyTypes.length) params.set('types', newFilters.propertyTypes.join(','))
      if (newFilters.sources.length) params.set('sources', newFilters.sources.join(','))
      if (newFilters.dnd !== 'all') params.set('dnd', newFilters.dnd)
      const qs = params.toString()
      router.replace(qs ? `/leads?${qs}` : '/leads', { scroll: false })
    },
    [router]
  )

  const handleSearchChange = useCallback(
    (q: string) => {
      updateUrl(q, filters)
    },
    [updateUrl, filters]
  )

  const handleFiltersChange = useCallback(
    (f: LeadsFilters) => {
      updateUrl(search, f)
    },
    [updateUrl, search]
  )

  // Compute available filter values from all leads
  const availableCities = useMemo(() => {
    const set = new Set<string>()
    allLeads.forEach((l) => {
      const c = (l.place || l.location_pref || '').trim()
      if (c) set.add(c)
    })
    return Array.from(set).sort()
  }, [allLeads])

  const availablePropertyTypes = useMemo(() => {
    const set = new Set<string>()
    allLeads.forEach((l) => {
      if (l.property_type) set.add(l.property_type)
    })
    return Array.from(set).sort()
  }, [allLeads])

  const availableSources = useMemo(() => {
    const set = new Set<string>()
    allLeads.forEach((l) => {
      if (l.source) set.add(l.source)
    })
    return Array.from(set).sort()
  }, [allLeads])

  // Apply filter + search
  const filteredLeads = useMemo(() => {
    let result = allLeads

    // Callable view: every lead the agent could dial now — i.e. NOT on DNC and NOT
    // in a terminal/booked state. new / contacted / warm / hot / cold are all
    // callable; follow_ups only when they're actually due. "Show All" additionally
    // reveals DNC + closed/lost/booked leads (the full CRM book).
    if (!showAllLeads) {
      const now = Date.now()
      const NOT_CALLABLE = ['closed', 'lost', 'not_interested', 'wrong_number', 'booked']
      result = result.filter((l) => {
        if (l.dnd_status) return false
        if (NOT_CALLABLE.includes(l.status)) return false
        if (l.status === 'follow_up') {
          const due = l.next_follow_up_date ? new Date(l.next_follow_up_date).getTime() : 0
          return due <= now
        }
        return true
      })
    }

    // Status filter
    if (filters.status.length) {
      result = result.filter((l) => filters.status.includes(l.status))
    }
    // City filter
    if (filters.cities.length) {
      result = result.filter((l) => {
        const c = (l.place || l.location_pref || '').trim()
        return filters.cities.includes(c)
      })
    }
    // Property type
    if (filters.propertyTypes.length) {
      result = result.filter((l) => filters.propertyTypes.includes(l.property_type))
    }
    // Source
    if (filters.sources.length) {
      result = result.filter((l) => filters.sources.includes(l.source))
    }
    // DND
    if (filters.dnd === 'hide') result = result.filter((l) => !l.dnd_status)
    if (filters.dnd === 'only') result = result.filter((l) => l.dnd_status)

    // Search (across name, phone, email, place)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((l) => {
        const haystack = [l.name, l.phone, l.email, l.place, l.location_pref]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
    }

    return result
  }, [allLeads, filters, search, showAllLeads])

  // Selected lead for details sheet
  const [selectedLead, setSelectedLead] = useState<SerializedLead | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Multi-select + bulk delete
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showDeleteSelected, setShowDeleteSelected] = useState(false)
  const [showDeleteAll, setShowDeleteAll] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingLeads, setIsLoadingLeads] = useState(false)
  const [isCalling, setIsCalling] = useState(false)
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null)

  const someSelected = selected.size > 0

  const refreshLeads = useCallback(() => {
    startTransition(() => router.refresh())
  }, [router, startTransition])

  const clearCallPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  useEffect(() => clearCallPolling, [clearCallPolling])

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (filteredLeads.every(l => selected.has(l._id))) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredLeads.map(l => l._id)))
    }
  }, [filteredLeads, selected])

  const handleDeleteSelected = async () => {
    setIsDeleting(true)
    try {
      const ids = Array.from(selected)
      const res = await fetch('/api/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Deleted ${data.deletedCount} lead(s).`)
        setShowDeleteSelected(false)
        setSelected(new Set())
        refreshLeads()
      } else {
        toast.error(data.error || 'Failed to delete leads.')
      }
    } catch {
      toast.error('Network error — please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteAll = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch('/api/leads?all=true', { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success(`Deleted ${data.deletedCount} lead(s).`)
        setShowDeleteAll(false)
        setSelected(new Set())
        refreshLeads()
      } else {
        toast.error(data.error || 'Failed to delete all leads.')
      }
    } catch {
      toast.error('Network error — please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLoadLeads = async () => {
    setIsLoadingLeads(true)
    try {
      const res = await fetch('/api/demo/load-leads', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        toast.success(`Loaded ${data.totalSeeded || data.seeded || 0} demo leads.`)
        setCallStatus(null)
        refreshLeads()
      } else {
        toast.error(data.error || 'Failed to load leads.')
      }
    } catch {
      toast.error('Network error — please try again.')
    } finally {
      setIsLoadingLeads(false)
    }
  }

  const handleStartCalling = async () => {
    clearCallPolling()
    setIsCalling(true)
    setCallStatus(null)
    try {
      const res = await fetch('/api/demo/start-calls', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        toast.success(`Started calling ${data.totalLeads} lead(s) sequentially.`)
        // Start polling for status — only declare "done" when:
        //   1. active is false (background loop finished)
        //   2. completedLeads.length === totalLeads (all calls ran, not just first)
        //   3. totalLeads > 0 (guards against the initial false-negative before any call starts)
        const expectedTotal = data.totalLeads as number
        const interval = setInterval(async () => {
          try {
            const statusRes = await fetch('/api/demo/start-calls')
            const status = await statusRes.json()
            setCallStatus(status)
            const allDone =
              !status.active &&
              status.totalLeads > 0 &&
              status.completedLeads?.length >= status.totalLeads
            if (allDone) {
              clearCallPolling()
              setIsCalling(false)
              toast.success(`All ${expectedTotal} call(s) completed! Check Appointments for booked visits.`)
              refreshLeads()
            }
          } catch { /* ignore */ }
        }, 4000)
        pollTimerRef.current = interval
        // Fetch initial status
        const initStatus = await fetch('/api/demo/start-calls').then(r => r.json())
        setCallStatus(initStatus)
      } else {
        toast.error(data.error || 'Failed to start calls.')
        setIsCalling(false)
      }
    } catch {
      toast.error('Network error — please try again.')
      setIsCalling(false)
    }
  }

  function handleRowClick(lead: SerializedLead) {
    setSelectedLead(lead)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-3">
      {/* Top bar: search + view toggle + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LeadsSearch value={search} onChange={handleSearchChange} />
        <div className="flex items-center gap-2">
          {/* Load Leads button */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent shadow-sm hover:bg-accent/10 transition disabled:opacity-50"
            onClick={handleLoadLeads}
            disabled={isLoadingLeads}
          >
            <Database size={13} />
            {isLoadingLeads ? 'Loading...' : 'Load Leads'}
          </button>

          {/* Start Calling button */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-green-700 transition disabled:opacity-50"
            onClick={handleStartCalling}
            disabled={isCalling}
          >
            <PhoneCall size={13} />
            {isCalling ? 'Calling...' : 'Start Calling'}
          </button>

          {someSelected && (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
              onClick={() => setShowDeleteSelected(true)}
            >
              <Trash2 size={13} /> Delete Selected ({selected.size})
            </button>
          )}
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
            onClick={() => setShowDeleteAll(true)}
          >
            <Trash2 size={13} /> Delete All
          </button>
          <span className="text-xs text-muted-foreground">
            {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
            {filteredLeads.length !== allLeads.length && ` of ${allLeads.length}`}
          </span>
          <button
            type="button"
            className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${showAllLeads ? 'bg-ink text-white' : 'border border-hairline text-ink-2 hover:bg-surface-2'}`}
            onClick={() => setShowAllLeads((v) => !v)}
            title={showAllLeads ? 'Showing all leads' : 'Showing callable leads only'}
          >
            {showAllLeads ? 'Showing: All' : 'Showing: Callable'}
          </button>
          <LeadsViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {/* Call status banner */}
      {callStatus && (callStatus.totalLeads || 0) > 0 && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${callStatus.active ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
          <div className={`font-medium mb-1 ${callStatus.active ? 'text-blue-800' : 'text-green-800'}`}>
            {callStatus.active
              ? `Calling: ${callStatus.currentLead || callStatus.current}`
              : `All ${callStatus.totalLeads} call(s) completed`}
          </div>
          {((callStatus.completed?.length || callStatus.completedLeads?.length || 0) > 0) && (
            <div className="text-xs text-green-700">
              Completed: {callStatus.completed?.join(', ') || callStatus.completedLeads?.join(', ')}
            </div>
          )}
          {((callStatus.pending?.length || callStatus.pendingLeads?.length || 0) > 0) && (
            <div className="text-xs text-blue-600">
              Up next: {callStatus.pending?.join(', ') || callStatus.pendingLeads?.join(', ')}
            </div>
          )}
          {((callStatus.results?.length || 0) > 0) && (
            <div className="mt-1 space-y-0.5">
              {callStatus.results?.map((r, i) => (
                <div key={i} className="text-xs">
                  {r.success ? 'Done' : 'Failed'}: {r.lead} ({r.builder})
                  {r.joinUrl && <> - <a href={r.joinUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Join call</a></>}
                  {r.error && <span className="text-red-600"> - {r.error}</span>}
                </div>
              ))}
            </div>
          )}
          {!callStatus.active && <div className="text-xs text-green-600 mt-1">Check Appointments page for booked visits.</div>}
        </div>
      )}

      {/* Filter bar */}
      <LeadsFilterBar
        filters={filters}
        onChange={handleFiltersChange}
        availableCities={availableCities}
        availablePropertyTypes={availablePropertyTypes}
        availableSources={availableSources}
      />

      {/* Active view */}
      {view === 'table' && (
        <LeadsTable
          leads={filteredLeads}
          onRowClick={handleRowClick}
          selected={selected}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
      )}
      {view === 'grid' && (
        <div className="rounded-md border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Grid view coming in next commit.
          </p>
        </div>
      )}
      {view === 'kanban' && (
        <LeadPipelineSection initialColumns={initialColumns} stats={stats} />
      )}

      {/* Lead details sheet */}
      <LeadDetailsSheet
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {/* Delete Selected confirmation */}
      <ConfirmDialog
        open={showDeleteSelected}
        onOpenChange={setShowDeleteSelected}
        title={`Delete ${selected.size} lead(s)?`}
        description={`This will permanently delete the selected ${selected.size} lead(s) and their associated data. This cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : `Delete ${selected.size}`}
        isPending={isDeleting}
        onConfirm={handleDeleteSelected}
      />

      {/* Delete All confirmation */}
      <ConfirmDialog
        open={showDeleteAll}
        onOpenChange={setShowDeleteAll}
        title="Delete ALL leads?"
        description={`This will permanently delete all ${allLeads.length} leads from the pipeline. This is irreversible.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete All Leads'}
        isPending={isDeleting}
        onConfirm={handleDeleteAll}
      />
    </div>
  )
}
