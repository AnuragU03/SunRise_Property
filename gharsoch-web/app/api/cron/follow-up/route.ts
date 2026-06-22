import { NextRequest, NextResponse } from 'next/server'
import { runFollowUpAgent } from '@/lib/agents/followUpAgent'

export const dynamic = 'force-dynamic'

/**
 * GET/POST /api/cron/follow-up
 * The Follow-Up Agent — hourly.
 * Thin wrapper: the agent logic lives in lib/agents/followUpAgent.ts so both
 * this cron and the orchestrator can invoke it.
 */
async function handleFollowupCron(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || `Bearer ${request.headers.get('x-cron-secret')}`
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { runId, output } = await runFollowUpAgent()

    if ((output as any)?.triggered_calls === 0 && (output as any)?.total_scanned === 0) {
      return NextResponse.json({ success: true, message: 'No due follow-ups found', triggered: 0, run_id: runId })
    }

    return NextResponse.json({
      success: true,
      message: (output as any).message,
      triggered: (output as any).triggered_calls,
      total_due: (output as any).total_scanned,
      run_id: runId,
    })
  } catch (error) {
    console.error('[API/Cron/FollowUp] Error:', error)
    const runId = (error as any)?.runId
    return NextResponse.json(
      { success: false, error: 'Failed to execute follow-up cron job', run_id: runId },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return handleFollowupCron(request)
}

export async function POST(request: NextRequest) {
  return handleFollowupCron(request)
}
