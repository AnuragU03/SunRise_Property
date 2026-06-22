/**
 * DND Scrub Service — TRAI Compliance Layer
 *
 * Checks if a phone number is registered on India's NCPR/DND registry
 * before any outbound call is initiated. Uses a two-layer approach:
 *
 *  1. Local DB check (lead.dnd_status) — instant, already maintained by /api/dnc
 *  2. External API check (RapidAPI Free DND India) — real-time NCPR lookup
 *
 * If either layer flags the number as DND, the call is blocked.
 *
 * Flow:
 *   Lead List → [Local DND check] → [External DND API] → Dial Queue
 *                    ↓ DND                   ↓ DND
 *                  Skip                    Skip + update DB
 *
 * Providers supported:
 *  - RapidAPI Free DND India (default, free tier)
 *  - EasyGoSMS DND API (fallback, requires separate credentials)
 *
 * Environment variables:
 *  - DND_SCRUB_ENABLED: "true" to enable external API checks (default: "true")
 *  - DND_RAPIDAPI_KEY: Your RapidAPI key for the Free DND India API
 *  - DND_PROVIDER: "rapidapi" (default) or "easygosms"
 *  - DND_EASYGOSMS_API_KEY: API key for EasyGoSMS (if using that provider)
 *  - DND_EASYGOSMS_PASSWORD: Password for EasyGoSMS (if using that provider)
 */

import { getCollection } from '@/lib/mongodb'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DndCheckResult = {
  isDnd: boolean
  source: 'local_db' | 'rapidapi' | 'easygosms' | 'error_fallback'
  phone: string
  checkedAt: Date
  error?: string
}

export type DndScrubStats = {
  total: number
  dnd: number
  clean: number
  errors: number
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DND_SCRUB_ENABLED = () => (process.env.DND_SCRUB_ENABLED ?? 'true') === 'true'
const DND_PROVIDER = () => (process.env.DND_PROVIDER || 'rapidapi').toLowerCase()
const DND_RAPIDAPI_KEY = () => process.env.DND_RAPIDAPI_KEY || ''
const DND_EASYGOSMS_API_KEY = () => process.env.DND_EASYGOSMS_API_KEY || ''
const DND_EASYGOSMS_PASSWORD = () => process.env.DND_EASYGOSMS_PASSWORD || ''

// ---------------------------------------------------------------------------
// Phone normalization
// ---------------------------------------------------------------------------

/**
 * Normalize an Indian phone number to 10-digit format (without country code).
 * Handles formats: +919876543210, 919876543210, 09876543210, 9876543210
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  if (digits.length === 10) return digits
  return digits // return as-is if non-standard
}

// ---------------------------------------------------------------------------
// Provider: RapidAPI Free DND India
// ---------------------------------------------------------------------------

async function checkDndRapidApi(phone: string): Promise<DndCheckResult> {
  const apiKey = DND_RAPIDAPI_KEY()
  if (!apiKey) {
    return {
      isDnd: false,
      source: 'error_fallback',
      phone,
      checkedAt: new Date(),
      error: 'DND_RAPIDAPI_KEY not configured — skipping external DND check',
    }
  }

  const normalized = normalizePhone(phone)

  try {
    const res = await fetch(`https://free-dnd-india.p.rapidapi.com/dnd?mobile=${normalized}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'free-dnd-india.p.rapidapi.com',
      },
      signal: AbortSignal.timeout(5000), // 5s timeout
    })

    if (!res.ok) {
      console.warn(`[DND-SCRUB] RapidAPI returned ${res.status} for ${normalized}`)
      return {
        isDnd: false,
        source: 'error_fallback',
        phone,
        checkedAt: new Date(),
        error: `RapidAPI HTTP ${res.status}`,
      }
    }

    const data = await res.json()
    // The API typically returns { dnd_status: "DND" | "Non-DND" } or similar
    const isDnd = (
      data.dnd_status === 'DND' ||
      data.dnd === true ||
      data.status === 'DND' ||
      (typeof data.result === 'string' && data.result.toUpperCase().includes('DND'))
    )

    return { isDnd, source: 'rapidapi', phone, checkedAt: new Date() }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.warn(`[DND-SCRUB] RapidAPI check failed for ${normalized}: ${message}`)
    return {
      isDnd: false,
      source: 'error_fallback',
      phone,
      checkedAt: new Date(),
      error: message,
    }
  }
}

// ---------------------------------------------------------------------------
// Provider: EasyGoSMS
// ---------------------------------------------------------------------------

async function checkDndEasyGoSms(phone: string): Promise<DndCheckResult> {
  const apiKey = DND_EASYGOSMS_API_KEY()
  const password = DND_EASYGOSMS_PASSWORD()

  if (!apiKey || !password) {
    return {
      isDnd: false,
      source: 'error_fallback',
      phone,
      checkedAt: new Date(),
      error: 'DND_EASYGOSMS credentials not configured — skipping external DND check',
    }
  }

  const normalized = normalizePhone(phone)

  try {
    const url = `http://manthanitsolutions.com/dnd/api/dnd_check_restapi.php?api_key=${encodeURIComponent(apiKey)}&pass=${encodeURIComponent(password)}&mobile=${normalized}`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })

    if (!res.ok) {
      return {
        isDnd: false,
        source: 'error_fallback',
        phone,
        checkedAt: new Date(),
        error: `EasyGoSMS HTTP ${res.status}`,
      }
    }

    const data = await res.json()
    const isDnd = data.dnd_status === 'DND' || data.status === 'DND'

    return { isDnd, source: 'easygosms', phone, checkedAt: new Date() }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.warn(`[DND-SCRUB] EasyGoSMS check failed for ${normalized}: ${message}`)
    return {
      isDnd: false,
      source: 'error_fallback',
      phone,
      checkedAt: new Date(),
      error: message,
    }
  }
}

// ---------------------------------------------------------------------------
// Local DB check
// ---------------------------------------------------------------------------

/**
 * Check if the phone number is already flagged as DND in the local leads collection.
 */
async function checkDndLocal(phone: string): Promise<boolean> {
  try {
    const leads = await getCollection('leads')
    const normalized = normalizePhone(phone)

    // Guard: an empty/too-short normalized number would make the regex `$` match
    // EVERY phone, so the first DND lead in the DB would falsely block an unrelated
    // (or malformed) number. Only do the suffix match for a real 10-digit number.
    const or: any[] = []
    if (phone) or.push({ phone, dnd_status: true })
    if (normalized.length >= 10) or.push({ phone: { $regex: `${normalized}$` }, dnd_status: true })
    if (or.length === 0) return false

    const dndLead = await leads.findOne({ $or: or })
    return Boolean(dndLead)
  } catch (err) {
    console.warn('[DND-SCRUB] Local DB check failed:', err instanceof Error ? err.message : err)
    return false
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check a single phone number for DND status.
 * Two-layer approach: local DB first (fast), then external API if not found locally.
 *
 * Returns the DND check result. If isDnd is true, the call MUST be skipped.
 */
export async function checkDnd(phone: string): Promise<DndCheckResult> {
  // Layer 1: Local DB check (instant)
  const isLocalDnd = await checkDndLocal(phone)
  if (isLocalDnd) {
    return { isDnd: true, source: 'local_db', phone, checkedAt: new Date() }
  }

  // Layer 2: External API check (if enabled)
  if (!DND_SCRUB_ENABLED()) {
    return { isDnd: false, source: 'local_db', phone, checkedAt: new Date() }
  }

  const provider = DND_PROVIDER()
  let result: DndCheckResult

  if (provider === 'easygosms') {
    result = await checkDndEasyGoSms(phone)
  } else {
    result = await checkDndRapidApi(phone)
  }

  // If external API confirms DND, update local DB for future fast lookups
  if (result.isDnd) {
    try {
      const leads = await getCollection('leads')
      await leads.updateMany(
        { phone: { $regex: `${normalizePhone(phone)}$` } },
        {
          $set: {
            dnd_status: true,
            dnd_checked_at: new Date(),
            dnd_source: result.source,
            updated_at: new Date(),
          },
        }
      )
    } catch (err) {
      console.warn('[DND-SCRUB] Failed to update local DND cache:', err)
    }
  }

  return result
}

/**
 * Batch scrub a list of phone numbers.
 * Useful for pre-campaign scrubbing before scheduling dial batches.
 */
export async function batchScrubDnd(phones: string[]): Promise<{
  results: DndCheckResult[]
  stats: DndScrubStats
}> {
  const results: DndCheckResult[] = []
  let dnd = 0
  let clean = 0
  let errors = 0

  for (const phone of phones) {
    const result = await checkDnd(phone)
    results.push(result)

    if (result.isDnd) dnd++
    else if (result.source === 'error_fallback') errors++
    else clean++

    // Rate limit: small delay between external API calls
    if (DND_SCRUB_ENABLED() && phones.length > 1) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  return {
    results,
    stats: { total: phones.length, dnd, clean, errors },
  }
}

/**
 * Log a DND scrub event to the agent_execution_logs collection for audit trail.
 */
export async function logDndScrubEvent(params: {
  phone: string
  result: DndCheckResult
  callType: string
  leadId?: string
  campaignId?: string
}): Promise<void> {
  try {
    const logs = await getCollection('agent_execution_logs')
    await logs.insertOne({
      agent_name: 'dnd_scrub_service',
      agent_id: 'dnd_scrub',
      message: params.result.isDnd
        ? `DND blocked: ${normalizePhone(params.phone)} is registered on NCPR (source: ${params.result.source})`
        : `DND clear: ${normalizePhone(params.phone)} is not DND (source: ${params.result.source})`,
      metadata: {
        phone_masked: `***${normalizePhone(params.phone).slice(-4)}`,
        is_dnd: params.result.isDnd,
        source: params.result.source,
        call_type: params.callType,
        lead_id: params.leadId || '',
        campaign_id: params.campaignId || '',
        error: params.result.error || null,
      },
      created_at: params.result.checkedAt,
    })
  } catch {
    // Audit log failure must not block the call flow
  }
}
