'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from '@/lib/toast'

/* ── toggle switch ──────────────────────────────────────── */
function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
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

export function CalendarSyncToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    fetch('/api/settings/calendar-sync')
      .then(res => res.json())
      .then(data => {
        setEnabled(data.enabled)
        setLastSync(data.lastSync)
      })
      .catch(console.error)
  }, [])

  if (enabled === null) return null

  const handleToggle = (newVal: boolean) => {
    if (!newVal) {
      if (!window.confirm('Disable Google Calendar sync?\n\nExisting calendar events will remain unchanged. Future appointments won\'t sync, and the reconciliation pass won\'t manage events for this broker. You can re-enable anytime.')) {
        return
      }
    }

    const prev = enabled
    setEnabled(newVal)

    startTransition(async () => {
      try {
        const res = await fetch('/api/settings/calendar-sync', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: newVal })
        })
        if (!res.ok) throw new Error('Failed to update sync setting')
        toast(`Google Calendar Sync: ${newVal ? 'Enabled' : 'Disabled'}`)
      } catch (err) {
        setEnabled(prev)
        toast('Failed to update Google Calendar sync setting')
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
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>Google Calendar Sync</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
          Automatically sync site visits and appointments to your Google Calendar.
        </div>
        {enabled && lastSync && (
          <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4 }}>
            Last sync: {new Date(lastSync).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </div>
        )}
      </div>
      <ToggleSwitch
        checked={enabled}
        onChange={handleToggle}
        disabled={pending}
      />
    </div>
  )
}
