import { runAgent } from '@/lib/runAgent'
import { ObjectId } from 'mongodb'
import { leadHasRecentOutboundCall } from '@/lib/services/callService'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, fetchCalendarEvent } from '@/lib/services/googleCalendarService'
import { tryAcquireLeadLock } from '@/lib/services/leadLockService'

function formatDateIST(d: Date): string {
  return new Date(d).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' })
}

function formatTimeIST(d: Date): string {
  return new Date(d).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true })
}

/** G3.5: reconcile Google Calendar events for upcoming appointments (create/update/delete drift). */
async function reconcileCalendarEvents(ctx: any) {
  const now = new Date()
  const fourteenDays = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const upcoming = await ctx.db.findMany('appointments', {
    scheduled_at: { $gte: now, $lte: fourteenDays },
    is_deleted: { $ne: true },
  })

  let reconciledCount = 0

  for (const appt of upcoming) {
    const broker = appt.broker_id && ObjectId.isValid(String(appt.broker_id))
      ? await ctx.db.findOne('users', { _id: new ObjectId(appt.broker_id) })
      : null
    if (broker && broker.google_calendar_enabled === false) continue

    if (appt.status === 'cancelled' && appt.calendar_event_id) {
      await deleteCalendarEvent(appt.broker_id, appt.calendar_event_id)
      await ctx.db.updateOne('appointments', { _id: appt._id }, { $unset: { calendar_event_id: '', calendar_event_url: '' } })
      reconciledCount++
      continue
    }

    if (appt.status !== 'cancelled' && !appt.calendar_event_id) {
      const property = await ctx.db.findOne('properties', { _id: new ObjectId(appt.property_id) })
      const lead = await ctx.db.findOne('leads', { _id: new ObjectId(appt.lead_id) })
      if (!lead || !property) continue

      const cal = await createCalendarEvent(appt.broker_id, {
        lead_name: lead.name,
        lead_phone: lead.phone,
        property_title: property.title || 'Site Visit',
        property_location: property.location || '',
        broker_name: broker?.name || 'Your Broker',
        notes: appt.notes || '',
        lead_id: appt.lead_id,
        scheduled_at: appt.scheduled_at,
      })
      if (cal.ok && cal.event_id) {
        await ctx.db.updateOne('appointments', { _id: appt._id },
          { $set: { calendar_event_id: cal.event_id, calendar_event_url: cal.event_url, calendar_provider: 'google' } })
        reconciledCount++
      }
      await new Promise((r) => setTimeout(r, 200))
      continue
    }

    if (appt.status !== 'cancelled' && appt.calendar_event_id) {
      const event = await fetchCalendarEvent(appt.broker_id, appt.calendar_event_id)
      if (event && event.start?.dateTime && new Date(event.start.dateTime).getTime() !== new Date(appt.scheduled_at).getTime()) {
        await updateCalendarEvent(appt.broker_id, appt.calendar_event_id, { scheduled_at: appt.scheduled_at })
        reconciledCount++
      }
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  await ctx.act('calendar_reconciliation', `Reconciled ${reconciledCount} appointments`, {
    parameters: { total_upcoming: upcoming.length },
    result: { reconciled_count: reconciledCount },
  })
}

/**
 * The Appointment Guardian — finds appointments in the next 24h with
 * reminder_sent=false, triggers a voice reminder call (skipping DND/locked/recent),
 * marks reminder_sent, then reconciles Google Calendar for the next 14 days.
 *
 * Exported as a reusable runner (parity with runMatchmaker etc.) so both the
 * cron route and the orchestrator can invoke it.
 */
export async function runAppointmentGuardian(): Promise<{ runId: string; output?: any }> {
  return runAgent({
    agentId: 'appointment_guardian',
    agentName: 'The Appointment Guardian',
    trigger: 'cron',
    input: { cron_job: 'reminders', trigger_time: new Date().toISOString() },
    metadata: { cron_type: 'scheduled', frequency: 'daily_09_IST' },

    handler: async (ctx) => {
      const now = new Date()
      const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      await ctx.think('evaluation',
        `Scanning appointments between ${now.toISOString()} and ${windowEnd.toISOString()} where reminder_sent is false.`,
        { confidence: 1.0, metadata: { window_hours: 24 } }
      )

      const dueAppointments = await ctx.db.findMany('appointments', {
        status: 'scheduled',
        reminder_sent: { $ne: true },
        is_deleted: { $ne: true },
        scheduled_at: { $gte: now, $lte: windowEnd },
      })

      await ctx.think('decision',
        dueAppointments.length === 0
          ? 'No appointments require reminders in the next 24 h. Exiting cleanly.'
          : `Found ${dueAppointments.length} appointment(s) requiring reminder calls. Will process each, skipping DND leads.`,
        { confidence: 1.0, metadata: { appointments_found: dueAppointments.length } }
      )

      if (dueAppointments.length === 0) {
        await reconcileCalendarEvents(ctx)
        return { triggered_calls: 0, total_scanned: 0, summary: 'No upcoming appointments needed reminders.' }
      }

      let triggeredCount = 0
      let skippedDnd = 0
      const call_details: Array<Record<string, any>> = []
      const skippedReminders: Array<{ lead_id: string; reason: string }> = []

      for (const appt of dueAppointments as any[]) {
        const lead = appt.lead_id ? await ctx.db.findOne('leads', { _id: new ObjectId(String(appt.lead_id)) }) : null
        const property = appt.property_id ? await ctx.db.findOne('properties', { _id: new ObjectId(String(appt.property_id)) }) : null

        if (!lead || !property) {
          await ctx.act('reminder_skip', `Skipping appt ${appt._id} — missing lead or property`, {
            parameters: { appt_id: String(appt._id) }, error: 'missing_lead_or_property',
          })
          call_details.push({ appt_id: String(appt._id), status: 'skipped', reason: 'missing_ref' })
          continue
        }

        if (lead.dnd_status === true) {
          skippedDnd++
          call_details.push({ appt_id: String(appt._id), lead_name: lead.name, status: 'skipped', reason: 'dnd' })
          continue
        }

        const lockAcquired = await tryAcquireLeadLock(lead._id, 'reminder', 'Executing appointment reminder call')
        if (!lockAcquired) {
          await ctx.act('reminder_skip', `Skipping appt ${appt._id} — lock conflict for lead`, {
            parameters: { appt_id: String(appt._id), lead_id: String(lead._id) }, error: 'cron_lock_conflict',
          })
          call_details.push({ appt_id: String(appt._id), lead_name: lead.name, status: 'skipped', reason: 'cron_lock_conflict' })
          continue
        }

        const recentReminder = await leadHasRecentOutboundCall(lead._id, 30, { source: 'appointment_reminder' })
        if (recentReminder) {
          skippedReminders.push({ lead_id: lead._id.toString(), reason: 'recent_reminder_within_30min' })
          continue
        }

        const result = await ctx.voice.triggerReminderCall({
          phone: lead.phone,
          name: lead.name,
          variables: {
            call_purpose: 'appointment_reminder',
            customer_name: lead.name || 'there',
            property_title: property.title || 'the property',
            property_location: property.location || 'the address we shared',
            appointment_date: formatDateIST(appt.scheduled_at),
            appointment_time: formatTimeIST(appt.scheduled_at),
          },
        })

        if (result.success) {
          await ctx.db.updateOne('appointments', { _id: appt._id }, {
            $set: { reminder_sent: true, reminder_call_id: result.voiceCallId || result.callId, updated_at: new Date() },
          })

          await ctx.db.updateOne('calls', { voice_call_id: result.voiceCallId || result.callId }, {
            $set: {
              lead_id: String(lead._id),
              lead_name: lead.name,
              lead_phone: lead.phone,
              agent_name: 'The Appointment Guardian',
              agent_id: 'appointment_guardian',
              campaign_id: 'auto-reminders',
              call_type: 'appointment_reminder',
              disposition: 'queued',
              call_outcome: 'pending',
              appointment_id: String(appt._id),
              updated_at: new Date(),
            },
          })

          await ctx.act('reminder_call_triggered', `Reminder call queued for ${lead.name} re: ${property.title}`, {
            parameters: { lead_id: String(lead._id), appt_id: String(appt._id) },
            result: { voice_call_id: result.voiceCallId || result.callId, room_name: result.roomName, call_triggered: true },
          })

          call_details.push({ appt_id: String(appt._id), lead_name: lead.name, status: 'triggered', voice_call_id: result.voiceCallId || result.callId, room_name: result.roomName })
          triggeredCount++
        } else {
          await ctx.act('reminder_call_failed', `Voice call failed for ${lead.name}`, {
            parameters: { lead_id: String(lead._id) }, error: result.error || 'voice_error',
          })
          call_details.push({ appt_id: String(appt._id), lead_name: lead.name, status: 'failed', error: result.error })
        }

        await new Promise((r) => setTimeout(r, 1000))
      }

      await ctx.think('result_analysis',
        `Processed ${dueAppointments.length} appointments. Triggered ${triggeredCount} reminder calls. Skipped ${skippedDnd} DND leads.`,
        { confidence: 0.95, metadata: { triggered: triggeredCount, skipped_dnd: skippedDnd, total: dueAppointments.length } }
      )

      await reconcileCalendarEvents(ctx)

      return {
        triggered_calls: triggeredCount,
        total_scanned: dueAppointments.length,
        skipped_dnd: skippedDnd,
        skipped_reminders: skippedReminders,
        call_details,
        summary: `Triggered ${triggeredCount} reminder call(s) out of ${dueAppointments.length} due appointment(s).`,
      }
    },
  })
}
