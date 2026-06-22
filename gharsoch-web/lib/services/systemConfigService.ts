/**
 * System Config Service
 * Reads/writes system configuration from the `system_config` Mongo collection.
 * Phase 11 adds per-user config; Phase 3 uses a single global config doc.
 */

import { getCollection } from '@/lib/mongodb'

export type ConfigKey =
  | 'matchmaker_on_new_client'
  | 'price_drop_on_patch'
  | 'auto_call_hot_leads'
  | 'reasoning_summaries_enabled'
  | 'dnc_enforcement'
  | 'broker_availability'
  | 'generic_inventory'
  | 'auto_fire_warm_calls'

/**
 * The generic "new inventory" the warm-lead agent mentions on calls. There is NO
 * per-lead history for the broker's 5000 warm leads, so the agent pitches this
 * broad, broker-set range instead of a specific property — the deliberately
 * generic warm-call USP. Broker edits it in Settings.
 */
export type GenericInventory = {
  bhk_min: number
  bhk_max: number
  price_min_cr: number
  price_max_cr: number
  sample_localities: string[]
}

export type IntegrationStatus = {
  name: string
  status: 'connected' | 'error' | 'unconfigured'
  meta: string
}

export type SystemConfig = {
  matchmaker_on_new_client: boolean
  price_drop_on_patch: boolean
  auto_call_hot_leads: boolean
  reasoning_summaries_enabled: boolean
  dnc_enforcement: boolean
  /** Immediately place the warm/re-engage call when a warm or visit-history lead
   *  is created. Off → the lead waits for the daily re-engage cron or a manual Start Call. */
  auto_fire_warm_calls: boolean
  trai_window_start: string // "09:00"
  trai_window_end: string   // "21:00"
  data_retention_days: number
  broker_availability: string[]
  generic_inventory: GenericInventory
  integrations: IntegrationStatus[]
  updated_at: string | null
}

/**
 * Integration statuses are COMPUTED from the live environment at read time —
 * never stored, never hardcoded. (Historically these were static 'connected'
 * literals, which showed Vapi as connected and Calendar as unconfigured
 * regardless of reality.)
 */
function computeIntegrations(mongoOk: boolean): IntegrationStatus[] {
  const has = (...keys: string[]) => keys.every((k) => Boolean(process.env[k]))

  const livekitCreds = has('LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET')
  const trunk = Boolean(process.env.SIP_OUTBOUND_TRUNK_ID)
  const voice: IntegrationStatus = !livekitCreds
    ? { name: 'Voice Runtime (LiveKit)', status: 'unconfigured', meta: 'LIVEKIT_URL / API key / secret not set' }
    : trunk
      ? { name: 'Voice Runtime (LiveKit)', status: 'connected', meta: 'Rooms + SIP trunk configured · outbound calls enabled' }
      : { name: 'Voice Runtime (LiveKit)', status: 'error', meta: 'LiveKit OK · SIP trunk missing — calls return trunk_missing (run npm run voice:trunk)' }

  const whatsappMode = process.env.WHATSAPP_MODE || 'dry_run'
  const twilio: IntegrationStatus = has('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN')
    ? { name: 'Twilio (WhatsApp delivery)', status: 'connected', meta: `Credentials present (not live-validated) · mode: ${whatsappMode}` }
    : { name: 'Twilio (WhatsApp delivery)', status: 'unconfigured', meta: 'TWILIO_ACCOUNT_SID / AUTH_TOKEN not set' }

  const calendar: IntegrationStatus = has('GOOGLE_CALENDAR_CLIENT_ID', 'GOOGLE_CALENDAR_CLIENT_SECRET', 'GOOGLE_CALENDAR_REFRESH_TOKEN')
    ? { name: 'Google Calendar', status: 'connected', meta: 'Appointment sync · create / reschedule / cancel + freebusy guard' }
    : { name: 'Google Calendar', status: 'unconfigured', meta: 'Calendar OAuth credentials / refresh token not set' }

  const mongo: IntegrationStatus = {
    name: 'MongoDB Atlas',
    status: mongoOk ? 'connected' : 'error',
    meta: `Primary datastore · ${process.env.MONGODB_DB || 'test'} database`,
  }

  const vapi: IntegrationStatus = has('VAPI_API_KEY')
    ? { name: 'Vapi (legacy)', status: 'connected', meta: 'Being replaced by the LiveKit runtime — removal pending migration' }
    : { name: 'Vapi (legacy)', status: 'unconfigured', meta: 'Legacy provider — removal pending migration' }

  return [voice, twilio, calendar, mongo, vapi]
}

const DEFAULTS: SystemConfig = {
  matchmaker_on_new_client: true,
  price_drop_on_patch: true,
  auto_call_hot_leads: false,
  reasoning_summaries_enabled: true,
  dnc_enforcement: true,
  auto_fire_warm_calls: true,
  trai_window_start: '09:00',
  trai_window_end: '21:00',
  data_retention_days: 90,
  broker_availability: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'],
  generic_inventory: {
    bhk_min: 2,
    bhk_max: 4,
    price_min_cr: 2,
    price_max_cr: 5,
    sample_localities: ['Andheri', 'Powai', 'Chembur', 'Thane', 'Vashi'],
  },
  integrations: [],
  updated_at: null,
}

/**
 * One-line spoken pitch the warm-lead agent uses, e.g.
 * "2 to 4 BHK options, ₹2 to 5 crore, around Andheri, Powai, Chembur".
 * Pure formatter — safe to call server-side or in the voice worker.
 */
export function formatGenericInventoryPitch(inv: GenericInventory): string {
  const bhk = inv.bhk_min === inv.bhk_max ? `${inv.bhk_min} BHK` : `${inv.bhk_min} to ${inv.bhk_max} BHK`
  const price = `₹${inv.price_min_cr} to ${inv.price_max_cr} crore`
  const areas = inv.sample_localities.length ? ` around ${inv.sample_localities.slice(0, 5).join(', ')}` : ''
  return `${bhk} options, ${price}${areas}`
}

export async function getSystemConfig(): Promise<SystemConfig> {
  try {
    const col = await getCollection('system_config')
    const doc = await col.findOne({}, { projection: { _id: 0 } })

    if (!doc) return { ...DEFAULTS, integrations: computeIntegrations(true) }

    // Merge with defaults so new keys always exist. Integration statuses are
    // always computed live — a stored doc must not override reality.
    return {
      ...DEFAULTS,
      ...doc,
      integrations: computeIntegrations(true),
    } as SystemConfig
  } catch (err) {
    console.error('[systemConfigService] getSystemConfig error:', err)
    return { ...DEFAULTS, integrations: computeIntegrations(false) }
  }
}

export async function updateSystemConfig(key: string, value: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const col = await getCollection('system_config')
    await col.updateOne(
      {},
      {
        $set: {
          [key]: value,
          updated_at: new Date().toISOString(),
        },
      },
      { upsert: true }
    )
    return { ok: true }
  } catch (err: any) {
    console.error('[systemConfigService] updateSystemConfig error:', err)
    return { ok: false, error: err.message }
  }
}
