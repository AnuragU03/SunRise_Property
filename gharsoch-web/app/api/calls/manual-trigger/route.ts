import { NextRequest, NextResponse } from 'next/server'
import { auth, authErrorResponse } from '@/lib/auth'
import { requireBrokerId, BrokerScopeMissingError } from '@/lib/auth/requireBroker'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { triggerCampaignCall } from '@/lib/voiceRuntime'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    let brokerId: string
    try {
      brokerId = requireBrokerId(session)
    } catch (e) {
      if (e instanceof BrokerScopeMissingError) return NextResponse.json({ error: e.message }, { status: 403 })
      throw e
    }
    
    const { lead_id, source } = await request.json()
    
    if (!lead_id) {
      return NextResponse.json({ ok: false, error: 'lead_id required' }, { status: 400 })
    }
    
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'test')
    
    // Verify lead belongs to this broker
    const lead = await db.collection('leads').findOne({ _id: new ObjectId(lead_id), broker_id: brokerId })
    if (!lead) {
      return NextResponse.json({ ok: false, error: 'lead not found in your brokerage' }, { status: 404 })
    }
    
    // Log the override BEFORE firing
    await db.collection('agent_execution_logs').insertOne({
      agent_name: 'manual_broker_override',
      broker_id: brokerId,
      lead_id: lead._id,
      message: `Broker manually initiated call to lead ${lead.name}`,
      metadata: { source: source || 'customer_detail_ui' },
      created_at: new Date(),
    })
    
    // Fire the call through the shared voice runtime.
    const result = await triggerCampaignCall({
      _id: lead._id.toString(),
      phone: lead.phone,
      name: lead.name,
      budget_range: lead.budget_range,
      location_pref: lead.location_pref,
      property_type: lead.property_type,
      notes: lead.notes,
    }, {
      campaign_name: 'Manual Override',
      script_template: 'Agent manually triggered call'
    })
    
    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error || 'Trigger failed' }, { status: 400 })
    }
    
    return NextResponse.json({
      ok: true,
      call_id: result.voiceCallId || result.callId,
      voice_call_id: result.voiceCallId || result.callId,
      room_name: result.roomName,
    })
  } catch (error: any) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('[API/Calls/ManualTrigger] Error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
