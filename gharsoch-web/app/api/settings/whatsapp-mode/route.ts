import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'

export async function GET() {
  await requireSession()
  return NextResponse.json({
    mode: (process.env.WHATSAPP_MODE || 'dry_run')
  })
}
