/**
 * scripts/e2e-agents.ts — end-to-end assertion harness for the agent
 * orchestration layer (restoration item E). No live calls, no LLM: seeds
 * leads in every ownership state, then asserts that the rules system, the
 * confidence gate, and the post-call reconciler do exactly what the corpus
 * design says they should.
 *
 * Run:    npm run e2e:agents
 * Safe:   everything it writes carries source='e2e_agents' and is deleted at
 *         the end (pass --keep to inspect the docs afterwards).
 */
import 'dotenv/config'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { decideLeadOwner, matchmakerMayProspect } from '@/lib/orchestrator/rules'
import { reconcilePostCall } from '@/lib/orchestrator/postCall'
import { applyCallOutcome } from '@/lib/orchestrator/stateMachine'
import { getLeadConversationContext } from '@/lib/orchestrator/memory'

const KEEP = process.argv.includes('--keep')
const MARKER = 'e2e_agents'
const BROKER_ID = process.env.DEFAULT_BROKER_ID || 'e2e-broker'

let passed = 0
let failed = 0
function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function baseLead(name: string, phone: string, extra: Record<string, any> = {}) {
  const now = new Date()
  return {
    broker_id: BROKER_ID,
    name,
    phone,
    email: '',
    source: MARKER,
    status: 'new',
    property_type: '2BHK',
    budget_range: '80-90 lakhs',
    location_pref: 'Mulund',
    dnd_status: false,
    is_deleted: false,
    total_calls: 0,
    created_at: now,
    updated_at: now,
    ...extra,
  }
}

async function main() {
  const leads = await getCollection('leads')
  const calls = await getCollection('calls')
  const memory = await getCollection('agent_conversations')

  console.log('\n━━ e2e-agents: orchestration assertions ━━\n')

  // ── Seed one lead per ownership state ───────────────────────────────────
  const docs = {
    fresh: baseLead('E2E Fresh Lead', '+91 9000000001'),
    visit: baseLead('E2E Visit Lead', '+91 9000000002', {
      last_visit_property_id: new ObjectId().toString(),
      last_visit_date: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      last_visit_type: 'site_visit',
      last_visit_property: 'E2E Heights 2BHK',
      last_visit_summary: 'Liked layout, objected on price',
    }),
    followup: baseLead('E2E Followup Lead', '+91 9000000003', {
      status: 'follow_up',
      next_follow_up_date: new Date(Date.now() - 3600 * 1000), // overdue
    }),
    booked: baseLead('E2E Booked Lead', '+91 9000000004', { status: 'booked' }),
    dnc: baseLead('E2E DNC Lead', '+91 9000000005', { dnd_status: true }),
    skipgate: baseLead('E2E Skipgate Lead', '+91 9000000006', {
      matchmaker_skip_until: new Date(Date.now() + 3600 * 1000),
    }),
  }

  const ids: Record<string, ObjectId> = {}
  for (const [key, doc] of Object.entries(docs)) {
    const r = await leads.insertOne(doc as any)
    ids[key] = r.insertedId
  }
  console.log(`Seeded ${Object.keys(ids).length} leads (source=${MARKER})\n`)

  // ── 1. Ownership rules (rules.ts R0–R5) ─────────────────────────────────
  console.log('1. Lead-ownership rules')
  const fetched: Record<string, any> = {}
  for (const key of Object.keys(ids)) fetched[key] = await leads.findOne({ _id: ids[key] })

  check('fresh lead → matchmaker', decideLeadOwner(fetched.fresh).owner === 'matchmaker', decideLeadOwner(fetched.fresh).owner)
  check('visit-history lead → dead_lead_reengager (R3)', decideLeadOwner(fetched.visit).owner === 'dead_lead_reengager', decideLeadOwner(fetched.visit).owner)
  check('visit-history decision injects property context', decideLeadOwner(fetched.visit).injectPropertyContext === true)
  check('overdue follow-up → follow_up_agent (R2)', decideLeadOwner(fetched.followup).owner === 'follow_up_agent', decideLeadOwner(fetched.followup).owner)
  check('booked lead → appointment_guardian (R1)', decideLeadOwner(fetched.booked).owner === 'appointment_guardian', decideLeadOwner(fetched.booked).owner)
  check('DNC lead → none (R0)', decideLeadOwner(fetched.dnc).owner === 'none', decideLeadOwner(fetched.dnc).owner)
  check('skip-gate lead → none (R4)', decideLeadOwner(fetched.skipgate).owner === 'none', decideLeadOwner(fetched.skipgate).owner)

  // ── 2. Matchmaker sweep filter (matchmakerMayProspect) ──────────────────
  console.log('\n2. Matchmaker prospecting filter')
  check('matchmaker MAY prospect a fresh lead', matchmakerMayProspect(fetched.fresh).allowed === true)
  check('matchmaker may NOT prospect a visit-history lead', matchmakerMayProspect(fetched.visit).allowed === false, matchmakerMayProspect(fetched.visit).reason)
  check('matchmaker may NOT prospect a booked lead', matchmakerMayProspect(fetched.booked).allowed === false, matchmakerMayProspect(fetched.booked).reason)
  check('matchmaker may NOT prospect a DNC lead', matchmakerMayProspect(fetched.dnc).allowed === false, matchmakerMayProspect(fetched.dnc).reason)

  // ── 3. State machine (pure — applyCallOutcome) ──────────────────────────
  console.log('\n3. Call-outcome state machine')
  const freshLead = fetched.fresh
  check('appointment_booked → status booked', applyCallOutcome('appointment_booked', { duration: 90, ended_at: new Date() }, freshLead).patch.status === 'booked')
  check('callback_requested → status follow_up + next_follow_up_date set', (() => {
    const t = applyCallOutcome('callback_requested', { duration: 60, ended_at: new Date() }, freshLead)
    return t.patch.status === 'follow_up' && Boolean(t.patch.next_follow_up_date)
  })())
  check('not_interested_now → 7-day matchmaker cooldown', (() => {
    const t = applyCallOutcome('not_interested_now', { duration: 30, ended_at: new Date() }, freshLead)
    return t.patch.matchmaker_skip_until instanceof Date && t.patch.matchmaker_skip_until.getTime() > Date.now() + 6 * 24 * 3600 * 1000
  })())
  check('dnc_requested → dnd_status true', applyCallOutcome('dnc_requested', { duration: 20, ended_at: new Date() }, freshLead).patch.dnd_status === true)
  check('every outcome increments total_calls', applyCallOutcome('', { duration: 10, transcript: 'Agent: hi\nCustomer: hello', ended_at: new Date() }, { total_calls: 4 }).patch.total_calls === 5)
  check('terminal status is never overwritten', applyCallOutcome('appointment_booked', { duration: 90 }, { status: 'lost' }).patch.status === undefined)
  check('no-outcome + transcript on a new lead → contacted', applyCallOutcome('', { transcript: 'Agent: hi\nCustomer: hello' }, { status: 'new' }).patch.status === 'contacted')

  // ── 4. Post-call reconciler + memory (live DB round-trip) ────────────────
  console.log('\n4. Post-call reconciler (DB)')
  const callRoom = `e2e-call-${Date.now()}`
  await calls.insertOne({
    lead_id: ids.fresh.toString(),
    lead_name: 'E2E Fresh Lead',
    lead_phone: '+91 9000000001',
    room_name: callRoom,
    voice_call_id: callRoom,
    direction: 'outbound',
    call_type: 'matchmaker',
    call_status: 'completed',
    status: 'completed',
    duration: 75,
    call_outcome: 'callback_requested',
    call_summary: 'Wants a 3BHK instead, callback tomorrow',
    customer_objections: 'budget tight',
    agent_id: 'matchmaker',
    source: MARKER,
    ended_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  } as any)

  const r1 = await reconcilePostCall(callRoom)
  check('reconcile returns ok', r1.ok === true, r1.reason)
  const freshAfter = await leads.findOne({ _id: ids.fresh })
  check('reconcile incremented total_calls 0→1', freshAfter?.total_calls === 1, String(freshAfter?.total_calls))
  check('reconcile stamped last_contacted_at', Boolean(freshAfter?.last_contacted_at))
  check('reconcile applied callback_requested → follow_up', freshAfter?.status === 'follow_up', freshAfter?.status)

  const r2 = await reconcilePostCall(callRoom)
  check('reconcile is idempotent (second run a no-op)', r2.reason === 'already_reconciled', r2.reason)
  const freshAfter2 = await leads.findOne({ _id: ids.fresh })
  check('idempotent: total_calls stays 1', freshAfter2?.total_calls === 1, String(freshAfter2?.total_calls))

  const notes = await getLeadConversationContext(ids.fresh.toString())
  check('memory note written for the lead', notes.includes('callback'), notes.slice(0, 80))

  // ── Summary + cleanup ───────────────────────────────────────────────────
  console.log(`\n━━ ${passed} passed, ${failed} failed ━━`)

  if (!KEEP) {
    await leads.deleteMany({ source: MARKER })
    await calls.deleteMany({ source: MARKER })
    await memory.deleteMany({ lead_id: { $in: Object.values(ids).map((id) => id.toString()) } })
    console.log('Cleaned up e2e fixtures.')
  } else {
    console.log('--keep: fixtures left in place for inspection.')
  }

  process.exit(failed === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error('e2e-agents crashed:', err)
  process.exit(1)
})