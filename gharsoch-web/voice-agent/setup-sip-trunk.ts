/**
 * setup-sip-trunk.ts — provider-agnostic LiveKit SIP *outbound* trunk creator.
 * Works with ANY SIP carrier (Plivo, Telnyx, Twilio, …) — just point the env at
 * that provider's termination host + credentials. Idempotent (replaces a prior
 * trunk of the same name).
 *
 * Env (gharsoch-web/.env):
 *   LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
 *   SIP_TRUNK_ADDRESS    provider termination host, e.g. sip.plivo.com
 *   SIP_TRUNK_NUMBER     your caller-ID number on that provider, e.g. +1XXXXXXXXXX
 *   SIP_TRUNK_USERNAME   SIP auth username  (Plivo: your Auth ID)
 *   SIP_TRUNK_PASSWORD   SIP auth password  (Plivo: your Auth Token)
 *   SIP_TRUNK_COUNTRY    optional ISO country for the destination, e.g. in
 *
 * ── Plivo quickstart ──────────────────────────────────────────────────────
 *   SIP_TRUNK_ADDRESS=sip.plivo.com
 *   SIP_TRUNK_USERNAME=<Plivo Auth ID>
 *   SIP_TRUNK_PASSWORD=<Plivo Auth Token>
 *   SIP_TRUNK_NUMBER=<your Plivo number, +…>
 *   SIP_TRUNK_COUNTRY=in
 *
 * Run:  npm run voice:trunk:sip
 * Then put the printed ST_… into SIP_OUTBOUND_TRUNK_ID in .env and restart.
 */
import 'dotenv/config'
import { SipClient } from 'livekit-server-sdk'
import { SIPTransport } from '@livekit/protocol'

function normalizeHost(url: string) {
  return url.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://').replace(/\/$/, '')
}

async function main() {
  const {
    LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET,
    SIP_TRUNK_ADDRESS, SIP_TRUNK_NUMBER, SIP_TRUNK_USERNAME, SIP_TRUNK_PASSWORD, SIP_TRUNK_COUNTRY,
  } = process.env

  const missing = Object.entries({
    LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET,
    SIP_TRUNK_ADDRESS, SIP_TRUNK_NUMBER, SIP_TRUNK_USERNAME, SIP_TRUNK_PASSWORD,
  }).filter(([, v]) => !v).map(([k]) => k)
  if (missing.length) {
    console.error('Missing env vars:\n  - ' + missing.join('\n  - '))
    process.exit(1)
  }

  const sip = new SipClient(normalizeHost(LIVEKIT_URL!), LIVEKIT_API_KEY!, LIVEKIT_API_SECRET!)
  const TRUNK_NAME = 'gharsoch-sip-outbound'

  for (const t of (await sip.listSipOutboundTrunk()) as any[]) {
    if (t.name === TRUNK_NAME) {
      await sip.deleteSipTrunk(t.sipTrunkId).catch(() => {})
      console.log('removed old trunk', t.sipTrunkId)
    }
  }

  console.log(`Creating LiveKit outbound trunk → ${SIP_TRUNK_ADDRESS} (caller ${SIP_TRUNK_NUMBER})…`)
  const trunk = await sip.createSipOutboundTrunk(
    TRUNK_NAME,
    SIP_TRUNK_ADDRESS!,
    [SIP_TRUNK_NUMBER!],
    {
      transport: SIPTransport.SIP_TRANSPORT_AUTO,
      authUsername: SIP_TRUNK_USERNAME!,
      authPassword: SIP_TRUNK_PASSWORD!,
      ...(SIP_TRUNK_COUNTRY ? { destinationCountry: SIP_TRUNK_COUNTRY } : {}),
    }
  )

  console.log('\n✓ Trunk created.')
  console.log('='.repeat(48))
  console.log(`SIP_OUTBOUND_TRUNK_ID=${trunk.sipTrunkId}`)
  console.log('='.repeat(48))
  console.log('\nAdd that to SIP_OUTBOUND_TRUNK_ID in .env, then re-run npm run voice:call.')
}

main().catch((err) => {
  console.error('Trunk creation failed:', err?.message || err)
  process.exit(1)
})
