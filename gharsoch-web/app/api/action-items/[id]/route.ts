import { NextRequest, NextResponse } from 'next/server'
import { auth, authErrorResponse } from '@/lib/auth'
import { requireBrokerId, BrokerScopeMissingError } from '@/lib/auth/requireBroker'
import { actionItemService } from '@/lib/services/actionItemService'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  due_date: z.string().optional().nullable(),
  description: z.string().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 })
    }

    const success = await actionItemService.update(params.id, parsed.data, brokerId)
    if (!success) {
      return NextResponse.json({ success: false, error: 'Not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('[API/ActionItems] PATCH Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    let brokerId: string
    try {
      brokerId = requireBrokerId(session)
    } catch (e) {
      if (e instanceof BrokerScopeMissingError) return NextResponse.json({ error: e.message }, { status: 403 })
      throw e
    }

    const success = await actionItemService.softDelete(params.id, brokerId)
    if (!success) {
      return NextResponse.json({ success: false, error: 'Not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('[API/ActionItems] DELETE Error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
