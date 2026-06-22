import { NextRequest, NextResponse } from 'next/server'
import { auth, authErrorResponse } from '@/lib/auth'
import { requireBrokerId, BrokerScopeMissingError } from '@/lib/auth/requireBroker'
import { leadService } from '@/lib/services/leadService'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    let brokerId: string
    try {
      brokerId = requireBrokerId(session)
    } catch (e) {
      if (e instanceof BrokerScopeMissingError) return NextResponse.json({ error: e.message }, { status: 403 })
      throw e
    }

    const leadId = params.id
    if (!leadId) {
      return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 })
    }

    const body = await request.json()
    
    // We only allow partial updates of the lead via this endpoint.
    // Ensure we don't accidentally update things like _id or broker_id.
    const { _id, broker_id, created_at, updated_at, ...patchData } = body

    if (Object.keys(patchData).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await leadService.update(leadId, brokerId, patchData)

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Lead not found or no changes made' }, { status: 404 })
    }

    // Fetch the fresh lead state to return to client
    const updatedLead = await leadService.getById(leadId)

    return NextResponse.json({
      success: true,
      data: updatedLead
    })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('[API/Leads/Update] PATCH Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}
