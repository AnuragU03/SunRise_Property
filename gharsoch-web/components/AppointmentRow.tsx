'use client'

import { useState, useRef, useEffect } from 'react'
import { Pill } from '@/components/Pill'
import type { PillVariant } from '@/components/Pill'
import { MoreVertical, CalendarClock, X, Trash2 } from 'lucide-react'
import type { SerializedAppointment } from '@/lib/services/appointmentService'

function statusVariant(status: string): PillVariant {
  if (status === 'confirmed') return 'success'
  if (status === 'completed') return 'success'
  if (status === 'cancelled') return 'failed'
  if (status === 'rescheduled') return 'amber'
  if (status === 'awaiting_reply' || status === 'awaiting') return 'idle'
  return 'idle'
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso))
}

const menuItemBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '8px 12px',
  fontSize: 13,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left' as const,
}

function MenuItem({ icon, label, color, onClick }: {
  icon: React.ReactNode
  label: string
  color: string
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...menuItemBase,
        color,
        background: hovered ? 'var(--surface-2, #f5f5f4)' : 'none',
      }}
    >
      {icon} {label}
    </button>
  )
}

export function AppointmentRow({
  appt,
  onClick,
  onReschedule,
  onCancel,
  onDelete,
}: {
  appt: SerializedAppointment
  onClick: () => void
  onReschedule?: () => void
  onCancel?: () => void
  onDelete?: () => void
}) {
  const time = formatTime(appt.scheduled_at)
  const status = appt.status || 'scheduled'
  const [menuOpen, setMenuOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const isLocked = status === 'cancelled' || status === 'completed'

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!menuOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setOpenUp(spaceBelow < 180)
    }
    setMenuOpen(!menuOpen)
  }

  return (
    <tr style={{ cursor: 'pointer' }}>
      <td onClick={onClick}>
        <div
          style={{
            width: 60,
            height: 56,
            borderRadius: 10,
            background: 'var(--surface-2)',
            border: '1px solid var(--hairline)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{time.split(':')[0]}</div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{time.split(' ')[1] || time.split(':')[1]?.substring(0, 2)}</div>
        </div>
      </td>
      <td onClick={onClick}>
        <div className="name">{appt.lead_name || '—'}</div>
        <div className="meta">{appt.lead_phone || ''}</div>
      </td>
      <td onClick={onClick}>
        <div style={{ fontSize: 13 }}>{appt.property_title || '—'}</div>
        <div className="meta">{appt.property_location || ''}</div>
      </td>
      <td onClick={onClick}>
        <div className="meta">{appt.notes?.substring(0, 60) || '—'}</div>
      </td>
      <td style={{ textAlign: 'right' }} onClick={onClick}>
        <Pill variant={statusVariant(status)}>{status.replace('_', ' ')}</Pill>
      </td>
      <td style={{ width: 40, textAlign: 'center', position: 'relative' }}>
        <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
          <button
            ref={btnRef}
            type="button"
            onClick={toggleMenu}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              color: 'var(--ink-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Actions"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'fixed',
                zIndex: 9999,
                ...(btnRef.current ? (() => {
                  const r = btnRef.current.getBoundingClientRect()
                  return openUp
                    ? { bottom: window.innerHeight - r.top + 4, right: window.innerWidth - r.right }
                    : { top: r.bottom + 4, right: window.innerWidth - r.right }
                })() : {}),
                background: 'var(--surface, #fff)',
                border: '1px solid var(--hairline, #e5e5e5)',
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                minWidth: 160,
                overflow: 'hidden',
              }}
            >
              {!isLocked && onReschedule && (
                <MenuItem
                  icon={<CalendarClock size={14} />}
                  label="Edit / Reschedule"
                  color="var(--ink, #1a1a1a)"
                  onClick={() => { setMenuOpen(false); onReschedule() }}
                />
              )}
              {!isLocked && onCancel && (
                <MenuItem
                  icon={<X size={14} />}
                  label="Cancel"
                  color="#d97706"
                  onClick={() => { setMenuOpen(false); onCancel() }}
                />
              )}
              {onDelete && (
                <MenuItem
                  icon={<Trash2 size={14} />}
                  label="Delete"
                  color="#dc2626"
                  onClick={() => { setMenuOpen(false); onDelete() }}
                />
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}
