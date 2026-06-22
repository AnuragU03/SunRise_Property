/**
 * POST /api/dnd-scrub — Real-time DND check for a single number
 * POST /api/dnd-scrub?mode=batch — Batch scrub multiple numbers
 *
 * Used by:
 *  - Campaign UI to pre-validate before scheduling
 *  - Manual call trigger to verify DND status
 *  - Cron jobs for periodic re-scrub of lead lists
 */

import { NextRequest, NextResponse } from 'next/server'
import { authErrorResponse, requireRole } from '@/lib/auth'
import { checkDnd, batchScrubDnd } from '@/lib/services/dndScrubService'

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'tech'])

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode')
    const body = await request.json()

    // Batch mode: scrub a list of phones
    if (mode === 'batch') {
      const phones: string[] = body.phones
      if (!phones || !Array.isArray(phones) || phones.length === 0) {
        return NextResponse.json(
          { success: false, error: 'phones array is required for batch mode' },
          { status: 400 }
        )
      }

      if (phones.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Maximum 100 numbers per batch request' },
          { status: 400 }
        )
      }

      const { results, stats } = await batchScrubDnd(phones)

      return NextResponse.json({
        success: true,
        stats,
        results: results.map((r) => ({
          phone: `***${r.phone.replace(/\D/g, '').slice(-4)}`,
          isDnd: r.isDnd,
          source: r.source,
          error: r.error || null,
        })),
      })
    }

    // Single number check
    const { phone } = body
    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'phone is required' },
        { status: 400 }
      )
    }

    const result = await checkDnd(phone)

    return NextResponse.json({
      success: true,
      isDnd: result.isDnd,
      source: result.source,
      checkedAt: result.checkedAt,
      error: result.error || null,
    })
  } catch (error) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse
    console.error('[API/DND-Scrub] Error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
