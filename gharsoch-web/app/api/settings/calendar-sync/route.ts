import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
  const session = await requireSession()
  const brokerId = session.user.id

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB || 'test')

  const lastSync = await db.collection('appointments').findOne(
    { broker_id: brokerId, calendar_event_id: { $exists: true, $ne: null }, is_deleted: { $ne: true } },
    { sort: { updated_at: -1 }, projection: { updated_at: 1 } }
  )

  const broker = await db.collection('users').findOne(
    { _id: new ObjectId(brokerId) },
    { projection: { google_calendar_enabled: 1 } }
  )

  return NextResponse.json({
    enabled: broker?.google_calendar_enabled !== false,
    lastSync: lastSync?.updated_at || null
  })
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession()
  const brokerId = session.user.id

  const body = await request.json()
  const enabled = body.enabled

  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db(process.env.MONGODB_DB || 'test')

  await db.collection('users').updateOne(
    { _id: new ObjectId(brokerId) },
    { $set: { google_calendar_enabled: enabled, updated_at: new Date() } }
  )

  return NextResponse.json({ success: true, enabled })
}
