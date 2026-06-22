import { NextRequest, NextResponse } from 'next/server'
import { auth, authErrorResponse } from '@/lib/auth'
import { requireBrokerId, BrokerScopeMissingError } from '@/lib/auth/requireBroker'
import { actionItemService } from '@/lib/services/actionItemService'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

const createSchema = z.object({
  lead_id: z.string(),
  action_type: z.enum(['site_visit', 'payment_followup', 'send_material', 'callback', 'escalation']),
  description: z.string(),
  source: z.enum(['manual', 'call_insight', 'vapi_tool', 'agent']),
  call_id: z.string().optional().nullable(),
  appointment_id: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    let brokerId: string
    try {
      brokerId = requireBrokerId(session)
    } catch (e) {
      if (e instanceof BrokerScopeMissingError) return NextResponse.json({ error: e.message }, { status: 403 })
      throw e
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as any
    const leadId = searchParams.get('lead_id') || undefined
    const callId = searchParams.get('call_id') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')

    const data = await actionItemService.list({
      brokerId,
      status,
      leadId,
      callId,
      limit
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('[API/ActionItems] GET Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

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

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 })
    }

    // Verify lead scoping (must belong to this broker)
    const client = await clientPromise
    const lead = await client.db(process.env.MONGODB_DB || 'test').collection('leads').findOne({ 
      _id: new ObjectId(parsed.data.lead_id), 
      broker_id: brokerId,
      is_deleted: { $ne: true }
    })
    
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found or access denied' }, { status: 404 })
    }

    const data = await actionItemService.create({
      ...parsed.data,
      broker_id: brokerId
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('[API/ActionItems] POST Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
