'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { SerializedLead } from '@/lib/services/leadService'
import { decideLeadOwner } from '@/lib/orchestrator/rules'

interface ProfileTabProps {
  lead: SerializedLead
  onUpdate: (patch: Partial<SerializedLead>) => Promise<void>
}

const OWNER_LABELS: Record<string, string> = {
  appointment_guardian: 'Appointment Guardian',
  follow_up_agent: 'Follow-Up Agent',
  dead_lead_reengager: 'Re-engager',
  matchmaker: 'Matchmaker',
  manual_broker: 'Broker (manual)',
  none: 'No agent',
}

export function ProfileTab({ lead, onUpdate }: ProfileTabProps) {
  const [saving, setSaving] = useState(false)

  // Local state for edits
  const [formData, setFormData] = useState({
    name: lead.name || '',
    email: lead.email || '',
    budget_range: lead.budget_range || '',
    location_pref: lead.location_pref || '',
    property_type: lead.property_type || '',
    notes: lead.notes || '',
    // Requirement spec (call-corpus fields) — what the voice agent anchors on
    purpose: (lead as any).purpose || 'buy',
    min_carpet_sqft: (lead as any).min_carpet_sqft ? String((lead as any).min_carpet_sqft) : '',
    facing_pref: (lead as any).facing_pref || '',
    vastu_required: Boolean((lead as any).vastu_required),
    area_reason: (lead as any).area_reason || '',
    rent_budget: (lead as any).rent_budget ? String((lead as any).rent_budget) : '',
  })
  
  const [dncConfirmOpen, setDncConfirmOpen] = useState(false)
  // Requirement spec is collapsed by default — irrelevant for warm leads and
  // not needed at a glance. Click the header to expand and edit.
  const [showSpec, setShowSpec] = useState(false)
  const isDnc = lead.dnd_status || lead.dnc_flag

  const handleSave = async () => {
    setSaving(true)
    const { min_carpet_sqft, rent_budget, ...rest } = formData
    await onUpdate({
      ...rest,
      min_carpet_sqft: min_carpet_sqft ? Number(min_carpet_sqft) : null,
      rent_budget: rent_budget ? Number(rent_budget) : null,
    } as any)
    setSaving(false)
  }

  const toggleDNC = async () => {
    // If currently DNC, turning it off doesn't require confirmation
    if (isDnc) {
      await onUpdate({ dnd_status: false })
    } else {
      // Trying to turn it on, ask confirmation
      setDncConfirmOpen(true)
    }
  }

  const confirmDNC = async () => {
    setDncConfirmOpen(false)
    await onUpdate({ dnd_status: true })
  }

  const ownership = decideLeadOwner(lead)
  const objectionChips = String((lead as any).objections || '')
    .split(/[\n;|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8)

  return (
    <div className="space-y-8">
      {/* Agent ownership — who will make this lead's next call, per orchestrator rules */}
      <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Next call owner</span>
        <Badge variant={ownership.owner === 'none' ? 'secondary' : 'default'}>
          {OWNER_LABELS[ownership.owner] || ownership.owner}
        </Badge>
        <span className="text-xs text-muted-foreground">{ownership.reason.replace(/_/g, ' ')}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input 
            value={formData.name} 
            onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input 
            value={formData.email} 
            onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Budget Range</Label>
          <Input 
            value={formData.budget_range} 
            onChange={(e) => setFormData(f => ({ ...f, budget_range: e.target.value }))}
            placeholder="e.g. 1-1.5 Cr"
          />
        </div>
        <div className="space-y-2">
          <Label>Location Preference</Label>
          <Input 
            value={formData.location_pref} 
            onChange={(e) => setFormData(f => ({ ...f, location_pref: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Property Type</Label>
          <Input 
            value={formData.property_type} 
            onChange={(e) => setFormData(f => ({ ...f, property_type: e.target.value }))}
            placeholder="e.g. 3BHK"
          />
        </div>
        <div className="space-y-2">
          <Label>Lead Source</Label>
          <Input value={lead.source || lead.lead_source || 'Unknown'} disabled className="bg-muted/50" />
        </div>
      </div>

      {/* Requirement Spec — the anchor data the voice agent opens every call with
          (call-corpus: "2BHK above 700 carpet, Kanjurmarg East because relatives nearby") */}
      <div className="rounded-lg border p-5 space-y-5">
        <button
          type="button"
          onClick={() => setShowSpec(!showSpec)}
          className="flex w-full items-center gap-2 text-left text-sm font-semibold"
        >
          <span className="text-muted-foreground">{showSpec ? '▼' : '▶'}</span>
          Requirement Spec <span className="text-xs font-normal text-muted-foreground">— used by the voice agent's memory anchor & pitch (optional)</span>
        </button>
        {showSpec && (
        <>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <div className="space-y-2">
            <Label>Purpose</Label>
            <Select value={formData.purpose} onValueChange={(v) => setFormData(f => ({ ...f, purpose: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="rent">Rent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.purpose === 'rent' ? (
            <div className="space-y-2">
              <Label>Rent Budget (₹/month)</Label>
              <Input type="number" value={formData.rent_budget}
                onChange={(e) => setFormData(f => ({ ...f, rent_budget: e.target.value }))}
                placeholder="e.g. 60000" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Min Carpet Area (sq ft)</Label>
              <Input type="number" value={formData.min_carpet_sqft}
                onChange={(e) => setFormData(f => ({ ...f, min_carpet_sqft: e.target.value }))}
                placeholder="e.g. 700" />
            </div>
          )}
          <div className="space-y-2">
            <Label>Facing Preference</Label>
            <Input value={formData.facing_pref}
              onChange={(e) => setFormData(f => ({ ...f, facing_pref: e.target.value }))}
              placeholder="e.g. north-east" />
          </div>
          <div className="space-y-2">
            <Label>Area Reason <span className="text-xs text-muted-foreground">(why this location)</span></Label>
            <Input value={formData.area_reason}
              onChange={(e) => setFormData(f => ({ ...f, area_reason: e.target.value }))}
              placeholder='e.g. "relatives nearby", "office at Godrej One"' />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={formData.vastu_required}
            onCheckedChange={(v) => setFormData(f => ({ ...f, vastu_required: v }))} />
          <Label className="font-normal">Vastu compliance required</Label>
        </div>
        </>
        )}
      </div>

      {/* Visit History & Objections — read-only context that feeds the re-engage call */}
      {((lead as any).last_visit_property || objectionChips.length > 0) && (
        <div className="rounded-lg border p-5 space-y-4">
          <div className="text-sm font-semibold">Visit History & Objections <span className="text-xs font-normal text-muted-foreground">— drives the Re-engager's opener and objection handling</span></div>
          {(lead as any).last_visit_property && (
            <div className="text-sm">
              <span className="font-medium">{((lead as any).last_visit_type || 'visit').replace(/_/g, ' ')}</span>
              {' · '}{(lead as any).last_visit_property}
              {(lead as any).last_visit_date && (
                <span className="text-muted-foreground">
                  {' · '}{new Date((lead as any).last_visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
              {(lead as any).last_visit_summary && (
                <p className="mt-1 text-muted-foreground">{(lead as any).last_visit_summary}</p>
              )}
            </div>
          )}
          {objectionChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {objectionChips.map((o, i) => (
                <Badge key={i} variant="outline" className="font-normal">{o}</Badge>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
          placeholder="General notes about this lead..."
          rows={4}
        />
      </div>

      <div className="flex items-center justify-between border-t pt-6">
        <div className="flex items-center space-x-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="flex items-center space-x-3 bg-destructive/5 px-4 py-3 rounded-lg border border-destructive/20">
          <div className="space-y-0.5">
            <Label className="text-destructive font-medium">Do Not Call (DNC)</Label>
            <p className="text-xs text-muted-foreground">Stop all outbound communications.</p>
          </div>
          <Switch 
            checked={isDnc}
            onCheckedChange={toggleDNC}
          />
        </div>
      </div>

      <ConfirmDialog
        open={dncConfirmOpen}
        onOpenChange={setDncConfirmOpen}
        title="Confirm DNC?"
        description="This will stop all outbound calls for this customer. Are you sure you want to mark them as Do Not Call?"
        confirmLabel="Yes, Mark DNC"
        onConfirm={confirmDNC}
      />
    </div>
  )
}
