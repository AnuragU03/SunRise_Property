import { NextRequest, NextResponse } from 'next/server'
import { auth, authErrorResponse } from '@/lib/auth'
import { requireBrokerId, BrokerScopeMissingError } from '@/lib/auth/requireBroker'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    let brokerId: string
    try {
      brokerId = requireBrokerId(session)
    } catch (e) {
      if (e instanceof BrokerScopeMissingError) return NextResponse.json({ error: e.message }, { status: 403 })
      throw e
    }
    
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'test')
    
    const lead = await db.collection('leads').findOne({ _id: new ObjectId(params.id), broker_id: brokerId })
    if (!lead) {
      return NextResponse.json({ next_scheduled_action: null }, { status: 404 })
    }
    
    // Check planned actions in priority order
    
    // 1. Pending appointment in next 24 hours → reminder cron will fire
    const upcomingAppt = await db.collection('appointments').findOne({
      lead_id: lead._id.toString(), // or ObjectId depending on schema
      broker_id: brokerId,
      scheduled_at: { 
        $gte: new Date(),
        $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) 
      },
      status: { $ne: 'cancelled' },
      is_deleted: { $ne: true },
    })
    
    if (upcomingAppt) {
      const apptTime = new Date(upcomingAppt.scheduled_at).toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
      })
      return NextResponse.json({ 
        next_scheduled_action: `Appointment reminder call before ${apptTime}` 
      })
    }
    
    // 2. next_follow_up_date set + within next 24 hours → follow-up cron will fire
    if (lead.next_follow_up_date) {
      const followUpDate = new Date(lead.next_follow_up_date)
      if (followUpDate <= new Date(Date.now() + 24 * 60 * 60 * 1000) && followUpDate > new Date(Date.now() - 60 * 60 * 1000)) {
        const followUpFormatted = followUpDate.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
        })
        return NextResponse.json({ 
          next_scheduled_action: `Follow-up callback scheduled for ${followUpFormatted}` 
        })
      }
    }
    
    // 3. Matchmaker eligibility (lead has matched_property_id, status not cold/dnc)
    if (lead.matched_property_id && !['cold', 'not_interested'].includes(lead.status) && !lead.dnd_status) {
      return NextResponse.json({ 
        next_scheduled_action: `Matchmaker may include in next 30-min cycle` 
      })
    }
    
    // No automation planned
    return NextResponse.json({ next_scheduled_action: null })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    return NextResponse.json({ next_scheduled_action: null }, { status: 500 })
  }
}
