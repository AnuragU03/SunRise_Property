import { NextRequest, NextResponse } from 'next/server'
import { runAppointmentGuardian } from '@/lib/agents/appointmentGuardian'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/reminders
 * The Appointment Guardian — daily 09:00 IST.
 * Thin wrapper: the agent logic lives in lib/agents/appointmentGuardian.ts so
 * both this cron and the orchestrator can invoke it.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { runId, output } = await runAppointmentGuardian()
    return NextResponse.json({
      success: true,
      runId,
      triggered: (output as any)?.triggered_calls ?? 0,
      total_due: (output as any)?.total_scanned ?? 0,
      skipped_reminders: (output as any)?.skipped_reminders ?? [],
      summary: (output as any)?.summary ?? '',
    })
  } catch (error: any) {
    console.error('[Cron/Reminders] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Appointment Guardian run failed', run_id: error?.runId },
      { status: 500 }
    )
  }
}
