'use client'

import { useEffect, useState } from 'react'
import { Pill } from '@/components/Pill'

export function WhatsappBadge() {
  const [mode, setMode] = useState<'dry_run' | 'twilio_sandbox' | 'twilio_production' | null>(null)

  useEffect(() => {
    fetch('/api/settings/whatsapp-mode')
      .then(res => res.json())
      .then(data => setMode(data.mode))
      .catch(console.error)
  }, [])

  if (!mode) return null

  const getBadgeDetails = () => {
    switch (mode) {
      case 'twilio_production':
        return { label: 'WhatsApp: Production', variant: 'success' as const }
      case 'twilio_sandbox':
        return { label: 'WhatsApp: Sandbox (opted-in numbers only)', variant: 'warning' as const }
      default:
        return { label: 'WhatsApp: Dry-run (no messages delivered)', variant: 'warning' as const }
    }
  }

  const { label, variant } = getBadgeDetails()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '14px 18px',
        borderBottom: '1px solid var(--hairline)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>WhatsApp Integration</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
            Status of the WhatsApp delivery engine.
          </div>
        </div>
        <Pill variant={variant}>{label}</Pill>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontStyle: 'italic', marginTop: 4 }}>
        Mode controlled via deployment env. Contact admin to change.
      </div>
    </div>
  )
}
