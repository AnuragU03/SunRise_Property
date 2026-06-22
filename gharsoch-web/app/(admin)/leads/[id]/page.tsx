import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { requireBrokerId } from '@/lib/auth/requireBroker'
import { leadService } from '@/lib/services/leadService'
import { callService } from '@/lib/services/callService'
import { actionItemService } from '@/lib/services/actionItemService'
import { CustomerDetailClient } from './CustomerDetailClient'

export const dynamic = 'force-dynamic'

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  let brokerId: string
  try {
    brokerId = requireBrokerId(session)
  } catch (e) {
    notFound()
  }
  
  // 1. Fetch lead — if not found, 404
  const lead = await leadService.getById(params.id)
  if (!lead) {
    console.error(`[LeadDetail] Lead not found: ${params.id}`)
    return notFound()
  }

  // Scope check: admins/tech see all leads; brokers only see their own brokerage's leads
  const role = (session?.user as any)?.role
  if (role === 'broker') {
    const leadBrokerId = String(lead.broker_id || '')
    if (leadBrokerId && leadBrokerId !== String(brokerId)) {
      return notFound()
    }
  }

  // 2. Fetch supporting data — failures are non-fatal (page loads with empty data)
  let initialActionItems: any[] = []
  let initialCalls: any[] = []

  try {
    initialActionItems = await actionItemService.list({ brokerId, leadId: params.id })
  } catch (err: any) {
    console.error(`[LeadDetail] Action items fetch failed for lead ${params.id}:`, err.message)
  }

  try {
    const client = await (await import('@/lib/mongodb')).default
    const callsData = await client.db(process.env.MONGODB_DB || 'test').collection('calls').find({ lead_id: params.id, superseded: { $ne: true } }).sort({ created_at: -1 }).limit(10).toArray()
    initialCalls = callsData.map((c: any) => ({
      ...c,
      _id: String(c._id),
      created_at: new Date(c.created_at).toISOString(),
      updated_at: new Date(c.updated_at).toISOString(),
    })) as any[]
  } catch (err: any) {
    console.error(`[LeadDetail] Calls fetch failed for lead ${params.id}:`, err.message)
  }

  return <CustomerDetailClient initialLead={lead} initialActionItems={initialActionItems} initialCalls={initialCalls} />
}
