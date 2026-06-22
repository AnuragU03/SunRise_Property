/**
 * setup-plivo-trunk.ts — create a LiveKit SIP OUTBOUND trunk for Plivo (Zentrunk),
 * so the voice agent can place REAL PSTN calls in India.
 *
 * Current Plivo↔LiveKit method (per docs.livekit.io/telephony Plivo guide, 2026):
 *   1. Plivo Console → Zentrunk → Outbound Trunks → Create New Outbound Trunk.
 *   2. Trunk Authentication → Credentials List → add a username + strong password.
 *   3. Enable "Secure Trunking" (recommended) — if you do, set PLIVO_SECURE=true here.
 *   4. Copy the trunk's **Termination SIP Domain** (looks like  xxxxxxxx.zt.plivo.com).
 *   5. Buy/assign an Indian phone number on Plivo (the caller-ID).
 *   (NOTE: the old sip.plivo.com + Auth ID/Token method is deprecated — use the
 *    termination domain + credentials list below.)
 *
 * .env (see the "# --- Plivo Configuration ---" block):
 *   LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
 *   PLIVO_TERMINATION_DOMAIN   e.g. xxxxxxxx.zt.plivo.com   (the trunk's termination domain)
 *   PLIVO_SIP_USERNAME         the credentials-list username
 *   PLIVO_SIP_PASSWORD         the credentials-list password
 *   PLIVO_PHONE_NUMBER         your Plivo number in E.164,  e.g. +91XXXXXXXXXX
 *   PLIVO_SECURE               optional, 'true' → TLS (must match Plivo Secure Trunking)
 *
 * Run:   npm run voice:plivo
 * Then:  put the printed ST_… into SIP_OUTBOUND_TRUNK_ID in .env,
 *        set VOICE_TRANSPORT=sip, restart the worker, and place a real call.
 */
import 'dotenv/config'
import { SipClient } from 'livekit-server-sdk'
import { SIPTransport } from '@livekit/protocol'

function normalizeHost(url: string) {
  return url.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://').replace(/\/$/, '')
}

const TRUNK_NAME = 'gharsoch-plivo-outbound'

async function main() {
  const {
    LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET,
    PLIVO_TERMINATION_DOMAIN, PLIVO_SIP_USERNAME, PLIVO_SIP_PASSWORD, PLIVO_PHONE_NUMBER,
  } = process.env
  const secure = String(process.env.PLIVO_SECURE).toLowerCase() === 'true'

  const missing = Object.entries({
    LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET,
    PLIVO_TERMINATION_DOMAIN, PLIVO_SIP_USERNAME, PLIVO_SIP_PASSWORD, PLIVO_PHONE_NUMBER,
  }).filter(([, v]) => !v).map(([k]) => k)
  if (missing.length) {
    console.error('Missing env vars (fill the "# --- Plivo Configuration ---" block in .env):\n  - ' + missing.join('\n  - '))
    process.exit(1)
  }

  const sip = new SipClient(normalizeHost(LIVEKIT_URL!), LIVEKIT_API_KEY!, LIVEKIT_API_SECRET!)

  // Idempotent — replace any prior trunk of the same name.
  for (const t of (await sip.listSipOutboundTrunk()) as any[]) {
    if (t.name === TRUNK_NAME) {
      await sip.deleteSipTrunk(t.sipTrunkId).catch(() => {})
      console.log('removed old Plivo trunk', t.sipTrunkId)
    }
  }

  console.log(`Creating LiveKit outbound trunk → ${PLIVO_TERMINATION_DOMAIN} (caller ${PLIVO_PHONE_NUMBER})…`)
  const trunk = await sip.createSipOutboundTrunk(
    TRUNK_NAME,
    PLIVO_TERMINATION_DOMAIN!,            // the Plivo Termination SIP Domain (xxxx.zt.plivo.com)
    [PLIVO_PHONE_NUMBER!],
    {
      // Plivo requires TCP (or TLS when Secure Trunking is on). UDP is not supported.
      transport: secure ? SIPTransport.SIP_TRANSPORT_TLS : SIPTransport.SIP_TRANSPORT_TCP,
      authUsername: PLIVO_SIP_USERNAME!,  // credentials-list username
      authPassword: PLIVO_SIP_PASSWORD!,  // credentials-list password
      destinationCountry: 'in',
    }
  )

  console.log('\n✓ Plivo outbound trunk created.')
  console.log('='.repeat(52))
  console.log(`SIP_OUTBOUND_TRUNK_ID=${trunk.sipTrunkId}`)
  console.log('='.repeat(52))
  console.log('\nNext:')
  console.log('  1. Put that ID into SIP_OUTBOUND_TRUNK_ID in .env')
  console.log('  2. Set VOICE_TRANSPORT=sip')
  console.log('  3. Restart the worker (npm run voice:agent)')
  console.log('  4. Place a real call: npm run voice:call -- --wait   (or Start Call in the UI)')
}

main().catch((err) => {
  console.error('Plivo trunk creation failed:', err?.message || err)
  process.exit(1)
})
