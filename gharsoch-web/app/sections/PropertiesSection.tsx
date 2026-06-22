'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Grid2X2, List, Plus, Trash2 } from 'lucide-react'

import { NewPropertyModal } from '@/components/modals/NewPropertyModal'
import { PropertyCard } from '@/components/PropertyCard'
import { Pill } from '@/components/Pill'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { PropertyStatusFilter, SerializedProperty } from '@/lib/services/propertyService'
import { useUserRole } from '@/lib/auth/useUserRole'
import { toast } from 'sonner'

const FILTERS: Array<{ label: string; value: '' | PropertyStatusFilter }> = [
  { label: 'All', value: '' },
  { label: 'Available', value: 'available' },
  { label: 'In Negotiation', value: 'negotiation' },
  { label: 'Sold', value: 'sold' },
]

function formatPrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) return '—'
  if (price >= 10_000_000) {
    return `₹${(price / 10_000_000).toFixed(price % 10_000_000 === 0 ? 0 : 2)} Cr`
  }
  return `₹${(price / 100_000).toFixed(price % 100_000 === 0 ? 0 : 1)} L`
}

function statusVariant(status: string) {
  const s = String(status || '').toLowerCase()
  if (s === 'sold') return 'success' as const
  if (s === 'negotiation' || s === 'in negotiation' || s === 'in_negotiation') return 'amber' as const
  return 'idle' as const
}

export function PropertiesSection({
  initialProperties,
}: {
  initialProperties: SerializedProperty[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStatus = (searchParams.get('status') || '') as '' | PropertyStatusFilter
  const [view, setView] = useState<'grid' | 'list'>('list')
  const [newOpen, setNewOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<SerializedProperty | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showDeleteSelected, setShowDeleteSelected] = useState(false)
  const [showDeleteAll, setShowDeleteAll] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { role } = useUserRole()
  const canAdd = role === 'admin' || role === 'tech'
  const canDelete = role === 'admin' || role === 'tech'

  const counts = useMemo(() => {
    const active = initialProperties.filter((property) => property.status !== 'sold').length
    const negotiation = initialProperties.filter((property) => ['negotiation', 'in negotiation', 'in_negotiation'].includes(String(property.status || '').toLowerCase())).length
    return { active, negotiation }
  }, [initialProperties])

  const allSelected = initialProperties.length > 0 && initialProperties.every(p => selected.has(p._id))
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
      setSelected(new Set(initialProperties.map(p => p._id)))
    }
  }

  const handleDeleteSelected = async () => {
    setIsDeleting(true)
    try {
      const ids = Array.from(selected)
      const res = await fetch('/api/properties', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Deleted ${data.deletedCount} property(ies).`)
        setShowDeleteSelected(false)
        setSelected(new Set())
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to delete properties.')
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
      const res = await fetch('/api/properties?all=true&confirm=DESTROY-ALL', { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success(`Deleted ${data.deletedCount} property(ies).`)
        setShowDeleteAll(false)
        setSelected(new Set())
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to delete all properties.')
      }
    } catch {
      toast.error('Network error — please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const updateFilter = (value: '' | PropertyStatusFilter) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    const query = params.toString()
    router.push(query ? `/properties?${query}` : '/properties')
  }

  return (
    <section className="page active">
      <div className="crumb">Work · Properties</div>
      <div className="head">
        <div>
          <div className="title">Property inventory</div>
          <div className="sub">
            {counts.active} active listings · {counts.negotiation} in negotiation.
          </div>
        </div>
        <div className="actions">
          {canDelete && someSelected && (
            <button
              type="button"
              className="btn ghost sm"
              style={{ color: '#dc2626' }}
              onClick={() => setShowDeleteSelected(true)}
            >
              <Trash2 size={13} strokeWidth={1.8} /> Delete Selected ({selected.size})
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className="btn ghost sm"
              style={{ color: '#dc2626' }}
              onClick={() => setShowDeleteAll(true)}
            >
              <Trash2 size={13} strokeWidth={1.8} /> Delete All
            </button>
          )}
          <button
            className={`btn ${view === 'list' ? 'primary' : 'ghost'}`}
            type="button"
            onClick={() => setView('list')}
            title="List view"
          >
            <List size={13} strokeWidth={1.8} /> List
          </button>
          <button
            className={`btn ${view === 'grid' ? 'primary' : 'ghost'}`}
            type="button"
            onClick={() => setView('grid')}
            title="Grid view"
          >
            <Grid2X2 size={13} strokeWidth={1.8} /> Grid
          </button>
          {canAdd && (
            <button className="btn primary" type="button" onClick={() => setNewOpen(true)}>
              <Plus size={13} strokeWidth={1.8} /> Add Property
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={() => updateFilter(filter.value)}
            className={`btn sm ${currentStatus === filter.value ? 'primary' : 'ghost'}`}
          >
            {filter.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-ink-3 self-center">{initialProperties.length} properties</span>
      </div>

      {initialProperties.length === 0 ? (
        <div className="panel">
          <div className="panel-body py-12 text-center text-ink-3">
            No properties found for this filter yet.
          </div>
        </div>
      ) : view === 'grid' ? (
        <div className="pgrid">
          {initialProperties.map((property) => (
            <PropertyCard key={property._id} property={property} onClick={setEditingProperty} />
          ))}
        </div>
      ) : (
        <div className="panel">
          <div className="panel-body p-0">
            <table className="table w-full text-left text-sm">
              <thead>
                <tr className="bg-surface-2 text-ink-3 text-xs uppercase tracking-wide">
                  {canDelete && (
                    <th className="px-3 py-3" style={{ width: 40, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        title="Select all"
                        className="h-4 w-4 rounded border-gray-300 accent-accent cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Builder</th>
                  <th className="px-4 py-3 font-medium text-right">Price</th>
                  <th className="px-4 py-3 font-medium">Area</th>
                  <th className="px-4 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {initialProperties.map((property) => {
                  const p = property as any
                  return (
                    <tr
                      key={property._id}
                      className={`cursor-pointer transition hover:bg-surface-2 ${selected.has(property._id) ? 'bg-accent/5' : ''}`}
                    >
                      {canDelete && (
                        <td className="px-3 py-3" style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.has(property._id)}
                            onChange={() => toggleSelect(property._id)}
                            className="h-4 w-4 rounded border-gray-300 accent-accent cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3" onClick={() => setEditingProperty(property)}>
                        <div className="font-medium text-ink">{property.title}</div>
                        {p.carpet_area_sqft && (
                          <div className="text-xs text-ink-3 mt-0.5">
                            {p.carpet_area_sqft} sqft carpet
                            {p.floor ? ` · ${p.floor}F` : ''}
                            {p.facing ? ` · ${p.facing}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-2" onClick={() => setEditingProperty(property)}>{property.location || '—'}</td>
                      <td className="px-4 py-3 text-ink-2" onClick={() => setEditingProperty(property)}>{property.type || '—'}</td>
                      <td className="px-4 py-3 text-ink-2" onClick={() => setEditingProperty(property)}>{p.builder || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-ink" onClick={() => setEditingProperty(property)}>
                        {formatPrice(Number(property.price || 0))}
                      </td>
                      <td className="px-4 py-3 text-ink-2" onClick={() => setEditingProperty(property)}>
                        {property.area_sqft ? `${property.area_sqft} sqft` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={() => setEditingProperty(property)}>
                        <Pill variant={statusVariant(property.status)}>
                          {String(property.status || 'available').replace('_', ' ')}
                        </Pill>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <NewPropertyModal open={newOpen} onClose={() => setNewOpen(false)} />
      <NewPropertyModal open={Boolean(editingProperty)} onClose={() => setEditingProperty(null)} initialValues={editingProperty} />

      <ConfirmDialog
        open={showDeleteSelected}
        onOpenChange={setShowDeleteSelected}
        title={`Delete ${selected.size} property(ies)?`}
        description={`This will soft-delete the selected ${selected.size} property(ies) and unmatch any linked leads. This cannot be undone easily.`}
        confirmLabel={isDeleting ? 'Deleting…' : `Delete ${selected.size}`}
        isPending={isDeleting}
        onConfirm={handleDeleteSelected}
      />

      <ConfirmDialog
        open={showDeleteAll}
        onOpenChange={setShowDeleteAll}
        title="Delete ALL properties?"
        description={`This will permanently delete all ${initialProperties.length} properties from the inventory. This is irreversible — you will need to re-seed.`}
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete All Properties'}
        isPending={isDeleting}
        onConfirm={handleDeleteAll}
      />
    </section>
  )
}

export default PropertiesSection
