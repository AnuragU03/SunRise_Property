'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { SerializedAppointment } from '@/lib/services/appointmentService'

const STATUSES = [
  { value: 'scheduled',       label: 'Scheduled' },
  { value: 'confirmed',       label: 'Confirmed' },
  { value: 'rescheduled',     label: 'Rescheduled' },
  { value: 'awaiting_reply',  label: 'Awaiting Reply' },
  { value: 'completed',       label: 'Completed' },
  { value: 'cancelled',       label: 'Cancelled' },
  { value: 'no_show',         label: 'No Show' },
]

const DURATIONS = [
  { value: 30,  label: '30 minutes' },
  { value: 45,  label: '45 minutes' },
  { value: 60,  label: '1 hour' },
  { value: 90,  label: '1.5 hours' },
  { value: 120, label: '2 hours' },
]

function toIstDate(iso: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(iso))
}

function toIstTime(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso))
}

export function EditAppointmentDialog({
  open,
  appointment,
  onCancel,
  onSaved,
}: {
  open: boolean
  appointment: SerializedAppointment
  onCancel: () => void
  onSaved: () => void
}) {
  const [scheduledDate, setScheduledDate] = useState(toIstDate(appointment.scheduled_at))
  const [scheduledTime, setScheduledTime] = useState(toIstTime(appointment.scheduled_at))
  const [status, setStatus]               = useState(appointment.status || 'scheduled')
  const [durationMinutes, setDuration]    = useState(appointment.duration_minutes ?? 60)
  const [notes, setNotes]                 = useState(appointment.notes || '')
  const [saving, setSaving]               = useState(false)

  // Detect whether the date/time changed so we only send scheduled_at when needed
  const originalDate = toIstDate(appointment.scheduled_at)
  const originalTime = toIstTime(appointment.scheduled_at)
  const timeChanged  = scheduledDate !== originalDate || scheduledTime !== originalTime

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: Record<string, any> = {
        _id: appointment._id,
        status,
        duration_minutes: durationMinutes,
        notes,
      }

      if (timeChanged) {
        // Combine IST date + time — the API appends +05:30 if no TZ present
        body.scheduled_at = `${scheduledDate}T${scheduledTime}`
      }

      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (res.status === 409) {
        // Slot conflict — show alternatives if available
        const alts: string[] = data.alternatives || []
        const altText = alts.length
          ? ' Try: ' + alts.slice(0, 3).map((a: string) =>
              new Date(a).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true, weekday: 'short' })
            ).join(', ')
          : ''
        toast.error((data.message || 'Slot unavailable.') + altText)
        return
      }

      if (!data.success) {
        toast.error(data.error || data.message || 'Update failed')
        return
      }

      toast.success(
        timeChanged
          ? 'Appointment updated and calendar synced.'
          : 'Appointment updated.'
      )
      onSaved()
    } catch {
      toast.error('Network error — please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Appointment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Lead + property info (read-only context) */}
          <div className="rounded-lg border border-hairline bg-surface-2 px-4 py-3 text-sm">
            <div className="font-semibold text-ink">{appointment.lead_name || 'Unknown lead'}</div>
            {appointment.lead_phone && (
              <div className="text-xs text-ink-3 mt-0.5">{appointment.lead_phone}</div>
            )}
            {appointment.property_title && (
              <div className="mt-1 text-xs text-ink-2">
                🏠 {appointment.property_title}
                {appointment.property_location ? ` · ${appointment.property_location}` : ''}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-date">Date (IST)</Label>
              <Input
                id="edit-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-time">Time (IST)</Label>
              <Input
                id="edit-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-duration">Duration</Label>
            <Select
              value={String(durationMinutes)}
              onValueChange={(v) => setDuration(Number(v))}
            >
              <SelectTrigger id="edit-duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add visit instructions, requirements, or any other details…"
            />
          </div>

          {/* Calendar sync hint */}
          {timeChanged && (
            <p className="text-xs text-ink-3">
              📅 Calendar event will be updated automatically on save.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
