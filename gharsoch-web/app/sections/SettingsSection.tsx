'use client'

import { useState, useTransition } from 'react'
import { Pill } from '@/components/Pill'
import { toast } from '@/lib/toast'
import { updateSettingAction } from '@/app/actions/settings'
import type { SystemConfig, ConfigKey, IntegrationStatus, GenericInventory } from '@/lib/services/systemConfigService'
import type { PillVariant } from '@/components/Pill'
import { WhatsappBadge } from '@/components/settings/WhatsappBadge'
import { CalendarSyncToggle } from '@/components/settings/CalendarSyncToggle'

/* ── toggle switch ──────────────────────────────────────── */

function ToggleSwitch({
  checked,
  onChange,
  disabled,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  id: string
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 12,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? 'var(--accent)' : 'var(--surface-3)',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }}
      />
    </button>
  )
}

/* ── toggle row ─────────────────────────────────────────── */

function ToggleRow({
  id,
  configKey,
  label,
  description,
  checked,
  onSave,
}: {
  id: string
  configKey: ConfigKey
  label: string
  description: string
  checked: boolean
  onSave: (key: ConfigKey, value: boolean) => Promise<void>
}) {
  const [optimistic, setOptimistic] = useState(checked)
  const [pending, startTransition] = useTransition()

  const handleChange = (newVal: boolean) => {
    const prev = optimistic
    setOptimistic(newVal) // optimistic update
    startTransition(async () => {
      try {
        await onSave(configKey, newVal)
        toast(`${label}: ${newVal ? 'Enabled' : 'Disabled'}`)
      } catch {
        setOptimistic(prev) // revert
        toast(`Failed to save "${label}". Please retry.`)
      }
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 18px',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{description}</div>
      </div>
      <ToggleSwitch
        id={id}
        checked={optimistic}
        onChange={handleChange}
        disabled={pending}
      />
    </div>
  )
}

/* ── read-only row ──────────────────────────────────────── */

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 18px',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>{value}</div>
    </div>
  )
}

/* ── integration row ────────────────────────────────────── */

function IntegrationRow({ integration }: { integration: IntegrationStatus }) {
  const variant: PillVariant =
    integration.status === 'connected' ? 'success' :
    integration.status === 'error' ? 'failed' : 'idle'

  const label =
    integration.status === 'connected' ? 'Connected' :
    integration.status === 'error' ? 'Error' : 'Not configured'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 18px',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{integration.name}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{integration.meta}</div>
      </div>
      <Pill variant={variant}>{label}</Pill>
    </div>
  )
}

/* ── availability editor ──────────────────────────────────── */

function AvailabilityEditor({ slots, onSave }: { slots: string[], onSave: (slots: string[]) => Promise<any> }) {
  const [optimistic, setOptimistic] = useState<string[]>(slots)
  const [pending, startTransition] = useTransition()
  const [newSlot, setNewSlot] = useState('10:00')

  const handleAdd = () => {
    if (!newSlot || optimistic.includes(newSlot)) return
    const updated = [...optimistic, newSlot].sort()
    setOptimistic(updated)
    startTransition(async () => {
      try {
        await onSave(updated)
        toast(`Added slot ${newSlot}`)
      } catch {
        setOptimistic(optimistic)
        toast('Failed to add slot')
      }
    })
  }

  const handleRemove = (slot: string) => {
    const updated = optimistic.filter(s => s !== slot)
    setOptimistic(updated)
    startTransition(async () => {
      try {
        await onSave(updated)
        toast(`Removed slot ${slot}`)
      } catch {
        setOptimistic(optimistic)
        toast('Failed to remove slot')
      }
    })
  }

  return (
    <div style={{ padding: '16px 18px' }}>
      <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 12 }}>Meeting Slots</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {optimistic.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>No slots configured.</span>}
        {optimistic.map(slot => (
          <div key={slot} style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-3)', padding: '4px 8px', borderRadius: 6, fontSize: 13, gap: 6 }}>
            {slot}
            <button 
              onClick={() => handleRemove(slot)} 
              disabled={pending}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5, padding: 0 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input 
          type="time" 
          value={newSlot} 
          onChange={e => setNewSlot(e.target.value)} 
          disabled={pending}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--hairline)', background: 'var(--surface-2)', fontSize: 13, outline: 'none' }}
        />
        <button 
          onClick={handleAdd} 
          disabled={pending || !newSlot}
          className="btn sm"
        >
          Add slot
        </button>
      </div>
    </div>
  )
}

/* ── generic inventory editor (warm-lead pitch range) ─────── */

function GenericInventoryEditor({
  value,
  onSave,
}: {
  value: GenericInventory
  onSave: (v: GenericInventory) => Promise<any>
}) {
  const [draft, setDraft] = useState<GenericInventory>(value)
  const [localitiesText, setLocalitiesText] = useState((value.sample_localities || []).join(', '))
  const [pending, startTransition] = useTransition()

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px', borderRadius: 6, border: '1px solid var(--hairline)',
    background: 'var(--surface-2)', fontSize: 13, outline: 'none', width: 80,
  }
  const fieldLabel: React.CSSProperties = { fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }

  const num = (n: number) => (Number.isFinite(n) ? n : 0)
  const preview = (() => {
    const bhk = draft.bhk_min === draft.bhk_max ? `${draft.bhk_min} BHK` : `${draft.bhk_min} to ${draft.bhk_max} BHK`
    const areas = localitiesText.trim() ? ` around ${localitiesText.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5).join(', ')}` : ''
    return `${bhk} options, ₹${draft.price_min_cr} to ${draft.price_max_cr} crore${areas}`
  })()

  const handleSave = () => {
    const next: GenericInventory = {
      bhk_min: num(draft.bhk_min),
      bhk_max: num(draft.bhk_max),
      price_min_cr: num(draft.price_min_cr),
      price_max_cr: num(draft.price_max_cr),
      sample_localities: localitiesText.split(',').map((s) => s.trim()).filter(Boolean),
    }
    startTransition(async () => {
      try {
        await onSave(next)
        toast('Saved generic inventory pitch')
      } catch {
        toast('Failed to save inventory pitch')
      }
    })
  }

  return (
    <div style={{ padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>
        What the warm-lead agent mentions to your 5000 leads — a deliberately generic range
        (no per-lead history). The agent speaks the preview line below.
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 14 }}>
        <div>
          <div style={fieldLabel}>BHK range</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="number" min={1} max={6} value={draft.bhk_min} disabled={pending}
              onChange={(e) => setDraft((d) => ({ ...d, bhk_min: Number(e.target.value) }))} style={inputStyle} />
            <span style={{ color: 'var(--ink-3)' }}>to</span>
            <input type="number" min={1} max={6} value={draft.bhk_max} disabled={pending}
              onChange={(e) => setDraft((d) => ({ ...d, bhk_max: Number(e.target.value) }))} style={inputStyle} />
          </div>
        </div>
        <div>
          <div style={fieldLabel}>Price band (₹ crore)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="number" min={0} step={0.5} value={draft.price_min_cr} disabled={pending}
              onChange={(e) => setDraft((d) => ({ ...d, price_min_cr: Number(e.target.value) }))} style={inputStyle} />
            <span style={{ color: 'var(--ink-3)' }}>to</span>
            <input type="number" min={0} step={0.5} value={draft.price_max_cr} disabled={pending}
              onChange={(e) => setDraft((d) => ({ ...d, price_max_cr: Number(e.target.value) }))} style={inputStyle} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={fieldLabel}>Sample localities (comma-separated)</div>
        <input type="text" value={localitiesText} disabled={pending}
          onChange={(e) => setLocalitiesText(e.target.value)}
          placeholder="Andheri, Powai, Chembur, Thane, Vashi"
          style={{ ...inputStyle, width: '100%', maxWidth: 460 }} />
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', background: 'var(--surface-3)', borderRadius: 6, padding: '8px 12px', marginBottom: 14 }}>
        Agent says: “…{preview}…”
      </div>

      <button onClick={handleSave} disabled={pending} className="btn sm primary">
        {pending ? 'Saving…' : 'Save inventory pitch'}
      </button>
    </div>
  )
}

/* ── panel wrapper ──────────────────────────────────────── */

function SettingsPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      <div className="panel-head">
        <div className="panel-title">{title}</div>
      </div>
      <div className="panel-body p-0">
        {children}
      </div>
    </div>
  )
}

/* ── main section ───────────────────────────────────────── */

export function SettingsSection({ config }: { config: SystemConfig }) {
  async function handleSave(key: ConfigKey, value: boolean) {
    await updateSettingAction(key, value)
  }

  const agentTriggers: Array<{ key: ConfigKey; label: string; description: string }> = [
    {
      key: 'matchmaker_on_new_client',
      label: 'Matchmaker on new client',
      description: 'Automatically run the matchmaker agent when a new client is created or a lead is converted.',
    },
    {
      key: 'price_drop_on_patch',
      label: 'Price-drop negotiator on property PATCH',
      description: 'Trigger price-drop agent when a property price is updated downward.',
    },
    {
      key: 'auto_call_hot_leads',
      label: 'Auto-call hot leads',
      description: 'Immediately initiate a voice call for leads scored "hot" by the matchmaker.',
    },
    {
      key: 'auto_fire_warm_calls',
      label: 'Auto-fire warm calls on creation',
      description: 'When a warm contact or visit-history lead is created, place the re-engage call immediately. Off → the lead waits for the daily re-engage run or a manual Start Call.',
    },
    {
      key: 'reasoning_summaries_enabled',
      label: 'Reasoning summaries',
      description: 'Generate natural-language reasoning summaries for each agent run (adds ~1s per run).',
    },
  ]

  return (
    <section className="page active">
      <div className="crumb">System · Settings</div>
      <div className="head">
        <div>
          <h1 className="title">Settings</h1>
          <p className="sub">Platform configuration, compliance controls, and integration status.</p>
        </div>
        {config.updated_at && (
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            Last saved {new Date(config.updated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </div>
        )}
      </div>

      {/* Agent triggers */}
      <SettingsPanel title="Agent triggers">
        {agentTriggers.map(trigger => (
          <ToggleRow
            key={trigger.key}
            id={`toggle-${trigger.key}`}
            configKey={trigger.key}
            label={trigger.label}
            description={trigger.description}
            checked={config[trigger.key] as boolean}
            onSave={handleSave}
          />
        ))}
      </SettingsPanel>

      {/* Compliance */}
      <SettingsPanel title="Compliance">
        <ReadOnlyRow
          label="TRAI calling window"
          value={`${config.trai_window_start} – ${config.trai_window_end} IST`}
        />
        <ToggleRow
          id="toggle-dnc_enforcement"
          configKey="dnc_enforcement"
          label="DNC list enforcement"
          description="Block all outbound calls to numbers in the Do Not Call registry. Disabling this violates TRAI guidelines."
          checked={config.dnc_enforcement}
          onSave={handleSave}
        />
        <ReadOnlyRow
          label="Data retention"
          value={`${config.data_retention_days} days`}
        />
      </SettingsPanel>

      {/* Warm-lead inventory pitch */}
      <SettingsPanel title="Warm-lead inventory pitch">
        <GenericInventoryEditor
          value={config.generic_inventory}
          onSave={(v) => updateSettingAction('generic_inventory', v)}
        />
      </SettingsPanel>

      {/* Broker Availability */}
      <SettingsPanel title="Broker Availability">
        <AvailabilityEditor 
          slots={config.broker_availability || []} 
          onSave={(slots) => updateSettingAction('broker_availability', slots)} 
        />
      </SettingsPanel>

      {/* Integrations */}
      <SettingsPanel title="Integrations">
        <WhatsappBadge />
        <CalendarSyncToggle />
        {config.integrations.map(integration => (
          <IntegrationRow key={integration.name} integration={integration} />
        ))}
      </SettingsPanel>
    </section>
  )
}

export default SettingsSection
