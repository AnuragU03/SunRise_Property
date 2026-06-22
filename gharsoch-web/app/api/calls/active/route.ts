/**
 * GET /api/calls/active — recent WebRTC test calls waiting to be answered (or live).
 *
 * Powers the global "incoming call" banner so a broker can answer a fired call
 * from anywhere in the app, not only the lead's detail page. Returns only fresh
 * (<15 min) webrtc rooms in a ringing/live state.
 */
import { NextResponse } from 'next/server'
import { authErrorResponse, requireSession } from '@/lib/auth'
import { getCollection } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

const ACTIVE_STATUSES = ['webrtc_ready', 'in-progress', 'in_progress', 'ringing', 'room_created']

export async function GET() {
  try {
    await requireSession()
    const calls = await getCollection('calls')
    const since = new Date(Date.now() - 15 * 60 * 1000)

    const items = await calls
      .find({
        voice_status: 'webrtc_ready',
        call_status: { $in: ACTIVE_STATUSES },
        created_at: { $gte: since },
      })
      .sort({ created_at: -1 })
      .limit(5)
      .toArray()

    const data = items.map((c: any) => ({
      _id: String(c._id),
      lead_id: c.lead_id || '',
      lead_name: c.lead_name || 'Customer',
      lead_phone: c.lead_phone || '',
      call_type: c.call_type || 'outbound',
      call_status: c.call_status || '',
      created_at: c.created_at,
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
