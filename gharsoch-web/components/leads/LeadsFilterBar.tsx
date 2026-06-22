'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'

export type LeadsFilters = {
  status: string[]
  cities: string[]
  propertyTypes: string[]
  sources: string[]
  dnd: 'all' | 'hide' | 'only'
}

export const EMPTY_FILTERS: LeadsFilters = {
  status: [],
  cities: [],
  propertyTypes: [],
  sources: [],
  dnd: 'all',
}

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'negotiating', 'appointment_set', 'won', 'lost']

type Props = {
  filters: LeadsFilters
  onChange: (f: LeadsFilters) => void
  availableCities: string[]
  availablePropertyTypes: string[]
  availableSources: string[]
}

export function LeadsFilterBar({
  filters,
  onChange,
  availableCities,
  availablePropertyTypes,
  availableSources,
}: Props) {
  const activeCount =
    filters.status.length +
    filters.cities.length +
    filters.propertyTypes.length +
    filters.sources.length +
    (filters.dnd !== 'all' ? 1 : 0)

  function toggleArrayValue(
    field: 'status' | 'cities' | 'propertyTypes' | 'sources',
    value: string
  ) {
    const current = filters[field]
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    onChange({ ...filters, [field]: next })
  }

  function clearAll() {
    onChange(EMPTY_FILTERS)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {/* Status filter dropdown */}
      <Select value="" onValueChange={(v) => v && toggleArrayValue('status', v)}>
        <SelectTrigger className="h-8 w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {filters.status.includes(s) ? '✓ ' : ''}
              {s.replace('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* City filter dropdown */}
      {availableCities.length > 0 && (
        <Select value="" onValueChange={(v) => v && toggleArrayValue('cities', v)}>
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            {availableCities.map((c) => (
              <SelectItem key={c} value={c}>
                {filters.cities.includes(c) ? '✓ ' : ''}
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Property type filter */}
      {availablePropertyTypes.length > 0 && (
        <Select value="" onValueChange={(v) => v && toggleArrayValue('propertyTypes', v)}>
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder="Property type" />
          </SelectTrigger>
          <SelectContent>
            {availablePropertyTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {filters.propertyTypes.includes(t) ? '✓ ' : ''}
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Source filter */}
      {availableSources.length > 0 && (
        <Select value="" onValueChange={(v) => v && toggleArrayValue('sources', v)}>
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            {availableSources.map((s) => (
              <SelectItem key={s} value={s}>
                {filters.sources.includes(s) ? '✓ ' : ''}
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* DND filter */}
      <Select
        value={filters.dnd}
        onValueChange={(v) => onChange({ ...filters, dnd: v as 'all' | 'hide' | 'only' })}
      >
        <SelectTrigger className="h-8 w-[110px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All leads</SelectItem>
          <SelectItem value="hide">Hide DND</SelectItem>
          <SelectItem value="only">DND only</SelectItem>
        </SelectContent>
      </Select>

      {/* Active filter chips */}
      {filters.status.map((s) => (
        <Badge key={`status-${s}`} variant="secondary" className="gap-1 pl-2 pr-1">
          {s.replace('_', ' ')}
          <button
            type="button"
            onClick={() => toggleArrayValue('status', s)}
            className="ml-1 rounded hover:bg-muted p-0.5"
            aria-label={`Remove ${s} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.cities.map((c) => (
        <Badge key={`city-${c}`} variant="secondary" className="gap-1 pl-2 pr-1">
          {c}
          <button
            type="button"
            onClick={() => toggleArrayValue('cities', c)}
            className="ml-1 rounded hover:bg-muted p-0.5"
            aria-label={`Remove ${c} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.propertyTypes.map((t) => (
        <Badge key={`type-${t}`} variant="secondary" className="gap-1 pl-2 pr-1">
          {t}
          <button
            type="button"
            onClick={() => toggleArrayValue('propertyTypes', t)}
            className="ml-1 rounded hover:bg-muted p-0.5"
            aria-label={`Remove ${t} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.sources.map((s) => (
        <Badge key={`source-${s}`} variant="secondary" className="gap-1 pl-2 pr-1">
          {s}
          <button
            type="button"
            onClick={() => toggleArrayValue('sources', s)}
            className="ml-1 rounded hover:bg-muted p-0.5"
            aria-label={`Remove ${s} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 px-2 text-xs">
          Clear all
        </Button>
      )}
    </div>
  )
}
