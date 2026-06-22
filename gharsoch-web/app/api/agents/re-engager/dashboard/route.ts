import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { authErrorResponse, requireSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireSession()

    const callsCol = await getCollection('calls')
    const execCol = await getCollection('agent_execution_logs')
    const leadsCol = await getCollection('leads')

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const reengageFilter = (since: Date) => ({
      call_type: { $in: ['reengage', 're_engagement'] },
      created_at: { $gte: since },
      is_deleted: { $ne: true },
    })

    const [total24h, total7d, total30d, lastRun] = await Promise.all([
      callsCol.countDocuments(reengageFilter(oneDayAgo)),
      callsCol.countDocuments(reengageFilter(sevenDaysAgo)),
      callsCol.countDocuments(reengageFilter(thirtyDaysAgo)),
      execCol.findOne(
        { agent_id: { $in: ['dead_lead_reengager', 'reengager_auto_trigger', 'reengage_cron_sweep'] } },
        { sort: { created_at: -1 } }
      ),
    ])

    // Conversion: re-engage calls in 30d that led to appointment_booked outcome
    const convertedCalls = await callsCol.countDocuments({
      ...reengageFilter(thirtyDaysAgo),
      $or: [
        { call_outcome: 'appointment_booked' },
        { disposition: 'appointment_booked' },
        { 'metadata.outcome': 'appointment_booked' },
      ],
    })

    const conversionRate = total30d > 0 ? Math.round((convertedCalls / total30d) * 100) : 0

    // Leads with reengage history
    const reengagedLeadsCount = await leadsCol.countDocuments({
      is_deleted: { $ne: true },
      last_reengage_attempted_at: { $exists: true, $ne: null },
    })

    // Recent 5 calls for quick preview
    const recentCalls = await callsCol
      .find(reengageFilter(thirtyDaysAgo))
      .sort({ created_at: -1 })
      .limit(5)
      .project({ _id: 1, lead_name: 1, lead_id: 1, created_at: 1, duration: 1, call_outcome: 1, disposition: 1 })
      .toArray()

    return NextResponse.json({
      totals: { last_24h: total24h, last_7d: total7d, last_30d: total30d },
      conversion: {
        rate_pct: conversionRate,
        conversions_30d: convertedCalls,
        total_calls_30d: total30d,
      },
      reengaged_leads: reengagedLeadsCount,
      last_run: lastRun?.created_at || null,
      recent_calls: recentCalls.map(c => ({
        _id: c._id.toString(),
        lead_name: c.lead_name || 'Unknown',
        lead_id: c.lead_id?.toString(),
        created_at: c.created_at,
        duration_sec: c.duration || 0,
        outcome: c.call_outcome || c.disposition || 'pending',
      })),
    })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('[API/ReengagerDashboard] Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
