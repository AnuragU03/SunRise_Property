'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClientAction, updateClientAction } from '@/app/actions/clients'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Client } from '@/models/Client'
import type { SerializedClient } from '@/lib/services/clientService'
import { toast } from 'sonner'

interface ClientFormState {
  id: string
  name: string
  phone: string
  email: string
  source: string
  property_type: string
  budget_range: string
  location_pref: string
  notes: string
  // Requirement-spec fields (call corpus): what the voice agent qualifies against
  purpose: string
  min_carpet_sqft: string
  facing_pref: string
  area_reason: string
  // G7: engagement fields
  last_visit_type: string
  last_visit_property_id: string
  last_visit_date: string
  last_visit_summary: string
}

interface Props {
  open: boolean
  onClose: () => void
  initialData?: Partial<Client | SerializedClient> | null
  entityId?: string
}

function buildInitialState(initialData?: Partial<Client | SerializedClient> | null, entityId?: string): ClientFormState {
  return {
    id: entityId || initialData?._id?.toString?.() || '',
    name: String(initialData?.name || ''),
    phone: String(initialData?.phone || ''),
    email: String(initialData?.email || ''),
    source: String(initialData?.source || 'manual'),
    property_type: String(initialData?.property_type || '1BHK'),
    budget_range: String(initialData?.budget_range || ''),
    location_pref: String(initialData?.location_pref || ''),
    notes: String(initialData?.notes || ''),
    purpose: String((initialData as any)?.purpose || 'buy'),
    min_carpet_sqft: (initialData as any)?.min_carpet_sqft != null ? String((initialData as any).min_carpet_sqft) : '',
    facing_pref: String((initialData as any)?.facing_pref || ''),
    area_reason: String((initialData as any)?.area_reason || ''),
    last_visit_type: String((initialData as any)?.last_visit_type || ''),
    last_visit_property_id: String((initialData as any)?.last_visit_property_id || ''),
    last_visit_date: '',
    last_visit_summary: String((initialData as any)?.last_visit_summary || ''),
  }
}

export function NewClientModal({ open, onClose, initialData, entityId }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<ClientFormState>(buildInitialState(initialData, entityId))
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showEngagement, setShowEngagement] = useState(false)
  const [showSpec, setShowSpec] = useState(false)
  // Warm contact = an existing relationship the broker already knows. The generic
  // warm agent needs no requirement data — just name + phone — so warm hides the
  // qualification fields entirely (you fill those only for fresh enquiries).
  const [isWarm, setIsWarm] = useState(false)
  const [properties, setProperties] = useState<Array<{ _id: string; title: string; location: string }>>([])

  useEffect(() => {
    fetch('/api/properties?limit=200')
      .then(r => r.json())
      .then(d => setProperties(d.data || d.properties || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(initialData, entityId))
      setErrorMsg('')
      setShowEngagement(false)
      setShowSpec(false)
      setIsWarm(Boolean((initialData as any)?.is_warm_lead))
    }
  }, [entityId, initialData, open])

  const isEditMode = Boolean(entityId || initialData?._id)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const formData = new FormData(e.currentTarget)
    const result = isEditMode ? await updateClientAction(formData) : await createClientAction(formData)

    setLoading(false)

    const succeeded = isEditMode ? result.ok : result.success
    if (succeeded) {
      toast.success(isEditMode ? 'Client updated' : 'Client created · Converter agent dispatched')
      router.refresh()
      onClose()
      return
    }

    setErrorMsg(result.error || 'Something went wrong')
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-xl bg-surface sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit client' : 'New client'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <input type="hidden" name="id" value={form.id} />
          <input type="hidden" name="is_warm_lead" value={isWarm ? 'true' : ''} />

          {errorMsg ? (
            <div className="text-sm font-medium text-red">{errorMsg}</div>
          ) : null}

          {/* Lead type — warm contact needs almost nothing; fresh enquiry gets the qualification fields */}
          {!isEditMode && (
            <label className="flex items-start gap-3 rounded-md border border-hairline bg-surface-2 px-3 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isWarm}
                onChange={(e) => setIsWarm(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
              />
              <span className="text-sm">
                <span className="font-medium">Warm contact</span>
                <span className="block text-xs text-ink-3 mt-0.5">
                  Someone you already know. The AI does a generic catch-up call — just name &amp; phone needed.
                </span>
              </span>
            </label>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Name <span className="text-red">*</span></label>
              <input
                id="name"
                name="name"
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="flex h-10 w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">Phone <span className="text-red">*</span></label>
              <input
                id="phone"
                name="phone"
                required
                pattern="^\+91\s?\d{10}$"
                placeholder="+91"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="flex h-10 w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft"
                title="Must be +91 followed by 10 digits"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="flex h-10 w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft"
              />
            </div>
            {isEditMode ? null : (
              <div className="space-y-2">
                <label htmlFor="source" className="text-sm font-medium">Source</label>
                <select
                  id="source"
                  name="source"
                  value={form.source}
                  onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}
                  className="flex h-10 w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft"
                >
                  <option value="manual">Manual Entry</option>
                  <option value="web_form">Web Form</option>
                  <option value="csv_upload">CSV Upload</option>
                  <option value="referral">Referral</option>
                </select>
              </div>
            )}
          </div>

          {/* Qualification fields — only for fresh enquiries. Warm contacts skip all of this. */}
          {!isWarm && (
          <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="property_type" className="text-sm font-medium">Property Type</label>
              <select
                id="property_type"
                name="property_type"
                value={form.property_type}
                onChange={(event) => setForm((current) => ({ ...current, property_type: event.target.value }))}
                className="flex h-10 w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft"
              >
                <option value="1BHK">1 BHK</option>
                <option value="2BHK">2 BHK</option>
                <option value="3BHK">3 BHK</option>
                <option value="4BHK">4 BHK</option>
                <option value="Villa">Villa</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="budget_range" className="text-sm font-medium">Budget</label>
              <input
                id="budget_range"
                name="budget_range"
                placeholder="e.g. 1.2-1.5 Cr"
                value={form.budget_range}
                onChange={(event) => setForm((current) => ({ ...current, budget_range: event.target.value }))}
                className="flex h-10 w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="location_pref" className="text-sm font-medium">Location Preference</label>
            <input
              id="location_pref"
              name="location_pref"
              value={form.location_pref}
              onChange={(event) => setForm((current) => ({ ...current, location_pref: event.target.value }))}
              className="flex h-10 w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft"
            />
          </div>

          {/* Requirement spec — drives the matchmaker pitch. Collapsed by default; fill if known. */}
          <div className="space-y-3 border-t border-hairline pt-4">
          <button
            type="button"
            onClick={() => setShowSpec(!showSpec)}
            className="flex items-center gap-2 text-sm text-ink-2 hover:text-ink transition-colors"
          >
            {showSpec ? '▼' : '▶'} Requirement details (optional)
          </button>
          {showSpec && (
          <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="purpose" className="text-sm font-medium">Purpose</label>
              <select
                id="purpose"
                name="purpose"
                value={form.purpose}
                onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value }))}
                className="flex h-10 w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft"
              >
                <option value="buy">Buy</option>
                <option value="rent">Rent</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="min_carpet_sqft" className="text-sm font-medium">Min Carpet (sq ft)</label>
              <input
                id="min_carpet_sqft"
                name="min_carpet_sqft"
                type="number"
                min="0"
                placeholder="e.g. 650"
                value={form.min_carpet_sqft}
                onChange={(event) => setForm((current) => ({ ...current, min_carpet_sqft: event.target.value }))}
                className="flex h-10 w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="facing_pref" className="text-sm font-medium">Facing Preference</label>
              <input
                id="facing_pref"
                name="facing_pref"
                placeholder="e.g. east, garden-facing"
                value={form.facing_pref}
                onChange={(event) => setForm((current) => ({ ...current, facing_pref: event.target.value }))}
                className="flex h-10 w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="area_reason" className="text-sm font-medium">Why This Area?</label>
              <input
                id="area_reason"
                name="area_reason"
                placeholder="e.g. office nearby, kids' school"
                value={form.area_reason}
                onChange={(event) => setForm((current) => ({ ...current, area_reason: event.target.value }))}
                className="flex h-10 w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft"
              />
            </div>
          </div>
          </>
          )}
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="flex min-h-[80px] w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft"
            />
          </div>

          {/* G7: Previous Engagement section — only on create */}
          {!isEditMode && (
            <div className="space-y-3 border-t border-hairline pt-4">
              <button
                type="button"
                onClick={() => setShowEngagement(!showEngagement)}
                className="flex items-center gap-2 text-sm text-ink-2 hover:text-ink transition-colors"
              >
                {showEngagement ? '▼' : '▶'} Previous Engagement (optional)
              </button>
              {showEngagement && (
                <div className="space-y-3 pl-3 border-l-2 border-hairline">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Engagement Type</label>
                    <select
                      name="last_visit_type"
                      value={form.last_visit_type}
                      onChange={(e) => setForm(f => ({ ...f, last_visit_type: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft"
                    >
                      <option value="">Select type</option>
                      <option value="site_visit">Site Visit</option>
                      <option value="office_walkin">Office Walk-in</option>
                      <option value="phone_enquiry">Phone Enquiry</option>
                      <option value="online_form">Online Form</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Property They Engaged With</label>
                    <select
                      name="last_visit_property_id"
                      value={form.last_visit_property_id}
                      onChange={(e) => setForm(f => ({ ...f, last_visit_property_id: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft"
                    >
                      <option value="">Select property</option>
                      {properties.map(p => (
                        <option key={p._id} value={p._id}>{p.title} — {p.location}</option>
                      ))}
                    </select>
                  </div>
                  {/* Hidden field for property name (needed by backend) */}
                  <input type="hidden" name="last_visit_property" value={properties.find(p => p._id === form.last_visit_property_id)?.title || ''} />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">When Did It Happen?</label>
                    <input
                      type="date"
                      name="last_visit_date"
                      value={form.last_visit_date}
                      onChange={(e) => setForm(f => ({ ...f, last_visit_date: e.target.value }))}
                      max={new Date().toISOString().split('T')[0]}
                      className="flex h-10 w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes From That Engagement</label>
                    <textarea
                      name="last_visit_summary"
                      value={form.last_visit_summary}
                      onChange={(e) => setForm(f => ({ ...f, last_visit_summary: e.target.value }))}
                      placeholder="What were their concerns? Why did they go cold?"
                      className="flex min-h-[60px] w-full rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft"
                    />
                  </div>
                  <div className="text-xs text-ink-3 bg-surface-2 rounded px-3 py-2">
                    ⓘ Adding engagement history will trigger an automated re-engagement call within 1-2 minutes after the client is qualified.
                  </div>
                </div>
              )}
            </div>
          )}
          </>
          )}

          <DialogFooter className="mt-6">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium text-ink hover:bg-surface-2 transition-colors"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow hover:bg-accent/90 transition-colors"
              disabled={loading}
            >
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update client' : 'Create client')}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
