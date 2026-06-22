import { NextRequest, NextResponse } from 'next/server'
import { auth, authErrorResponse } from '@/lib/auth'
import { requireBrokerId, BrokerScopeMissingError } from '@/lib/auth/requireBroker'
import { callInsightAgentService } from '@/lib/services/callInsightAgentService'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    let brokerId: string
    try {
      brokerId = requireBrokerId(session)
    } catch (e) {
      if (e instanceof BrokerScopeMissingError) return NextResponse.json({ error: e.message }, { status: 403 })
      throw e
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ success: false, error: 'Call ID is required' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    
    if (body.source === 'manual_broker_override') {
      const client = await clientPromise
      const db = client.db(process.env.MONGODB_DB || 'test')
      const call = await db.collection('calls').findOne({ _id: new ObjectId(id) })
      
      if (call) {
        await db.collection('agent_execution_logs').insertOne({
          agent_name: 'manual_broker_override',
          broker_id: brokerId,
          lead_id: call.lead_id,
          message: `Broker manually re-analyzed call ${id}`,
          metadata: { source: 'call_review_ui', call_id: id },
          created_at: new Date(),
        })
      }
    }

    // Call Insight Agent will throw if call not found or no transcript
    const analysis = await callInsightAgentService.analyzeCall(id)

    return NextResponse.json({ success: true, data: analysis })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('[API/Calls/Analyze] POST Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
