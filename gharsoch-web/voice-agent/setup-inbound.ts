/**
 * setup-inbound.ts — bring the LiveKit phone number ONLINE for inbound calls
 * (restoration item C).
 *
 * Creates (idempotently):
 *  1. A SIP *inbound* trunk bound to our LiveKit-provisioned number, so calls
 *     dialed to it land in this LiveKit project.
 *  2. A dispatch rule (individual) that drops each caller into their own
 *     `call-inbound-<random>` room — the voice worker auto-dispatches into any
 *     managed `call-*` room, detects the inbound prefix, looks the caller up by
 *     phone, and answers with the inbound playbook.
 *
 * Env (gharsoch-web/.env):
 *   LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
 *   LIVEKIT_INBOUND_NUMBER   the LiveKit phone number, default +12402124019
 *
 * Run:   npm run voice:inbound
 * Test:  npm run voice:agent (worker running) → dial the number from any phone.
 *        The LiveKit dashboard's Phone Numbers page should show it ONLINE.
 */
import 'dotenv/config'
import { SipClient } from 'livekit-server-sdk'
import { INBOUND_ROOM_PREFIX } from './inbound'

function normalizeHost(url: string) {
  return url.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://').replace(/\/$/, '')
}

const TRUNK_NAME = 'gharsoch-inbound'
const RULE_NAME = 'gharsoch-inbound-dispatch'

async function main() {
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env
  const number = process.env.LIVEKIT_INBOUND_NUMBER || '+12402124019'

  const missing = Object.entries({ LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET })
    .filter(([, v]) => !v)
    .map(([k]) => k)
  if (missing.length) {
    console.error('Missing env vars:\n  - ' + missing.join('\n  - '))
    process.exit(1)
  }

  const sip = new SipClient(normalizeHost(LIVEKIT_URL!), LIVEKIT_API_KEY!, LIVEKIT_API_SECRET!)

  // ── 1. Inbound trunk (replace same-named to stay idempotent) ──────────────
  for (const t of (await sip.listSipInboundTrunk()) as any[]) {
    if (t.name === TRUNK_NAME) {
      await sip.deleteSipTrunk(t.sipTrunkId).catch(() => {})
      console.log('removed old inbound trunk', t.sipTrunkId)
    }
  }

  console.log(`Creating inbound trunk for ${number}…`)
  const trunk = await sip.createSipInboundTrunk(TRUNK_NAME, [number], {
    krispEnabled: true,
  })
  console.log(`✓ Inbound trunk ${trunk.sipTrunkId}`)

  // ── 2. Dispatch rule: one fresh room per caller ────────────────────────────
  for (const r of (await sip.listSipDispatchRule()) as any[]) {
    if (r.name === RULE_NAME) {
      await sip.deleteSipDispatchRule(r.sipDispatchRuleId).catch(() => {})
      console.log('removed old dispatch rule', r.sipDispatchRuleId)
    }
  }

  const rule = await sip.createSipDispatchRule(
    { type: 'individual', roomPrefix: INBOUND_ROOM_PREFIX },
    {
      name: RULE_NAME,
      trunkIds: [trunk.sipTrunkId],
    }
  )
  console.log(`✓ Dispatch rule ${ (rule as any).sipDispatchRuleId } → rooms ${INBOUND_ROOM_PREFIX}*`)

  console.log('\n' + '='.repeat(56))
  console.log(`Inbound is configured for ${number}.`)
  console.log('Checklist to go live:')
  console.log('  1. LiveKit dashboard → Telephony → Phone numbers:')
  console.log(`     ${number} should now show ONLINE / assigned to ${TRUNK_NAME}.`)
  console.log('  2. Keep the worker running:  npm run voice:agent')
  console.log(`  3. Dial ${number} from any phone — the AI broker answers.`)
  console.log('     Calls appear in Call Logs with direction=inbound.')
  console.log('='.repeat(56))
}

main().catch((err) => {
  console.error('Inbound setup failed:', err?.message || err)
  process.exit(1)
})
