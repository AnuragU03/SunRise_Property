/**
 * lib/orchestrator/index.ts — the GharSoch business-agent orchestrator.
 *
 * One governed entry point for the Family-B workflow fleet. Instead of crons,
 * server actions, and service hooks each reaching into agent runners directly
 * (which is how the Matchmaker ended up triggered from six places), callers emit
 * a business event or request a manual run, and the orchestrator decides which
 * agents react.
 *
 * It does NOT re-implement lead-lock arbitration — each agent still acquires its
 * lead lock via leadLockService (priority comes from the fleet registry, which is
 * kept in sync with CRON_PRIORITY). The orchestrator owns event→agent routing,
 * a single manual-run path, and consistent dispatch logging.
 */

import {
  FLEET,
  getFleetAgent,
  listFleetAgents,
  type FleetAgentDef,
  type FleetRunInput,
} from './fleet'
import { decideLeadOwner, matchmakerMayProspect, hasVisitHistory } from './rules'

export { FLEET, getFleetAgent, listFleetAgents }
export { decideLeadOwner, matchmakerMayProspect, hasVisitHistory }
export { applyCallOutcome } from './stateMachine'
export { recordAgentNote, getLeadConversationContext } from './memory'
export { reconcilePostCall } from './postCall'
export type { FleetAgentDef, FleetRunInput }

/**
 * Confidence routing for lead.qualified: below this score the lead is NOT worth
 * an immediate matchmaker dial — nurture flows (follow-up cron) keep custody.
 * Mirrors the converter's historical >=60 gate so behavior doesn't change,
 * it just lives in ONE place now.
 */
export const MATCHMAKER_CONFIDENCE_THRESHOLD = 60

/** Discriminated business events the orchestrator routes. */
export type FleetEvent =
  | { type: 'client.created'; clientId: string }
  | { type: 'lead.created'; leadId: string; hasVisitHistory?: boolean; isWarm?: boolean }
  | { type: 'lead.qualified'; leadId: string; score?: number }
  | { type: 'property.created'; propertyId?: string }
  | { type: 'property.price_dropped'; propertyId: string; payload?: Record<string, any> }
  | { type: 'campaign.launched'; campaignId: string }
  | { type: 'call.completed'; callId: string; leadId?: string; outcome?: string }

export interface DispatchResult {
  event: string
  dispatched: string[]
  skipped: { id: string; reason: string }[]
}

/**
 * Manual / direct invocation of a single fleet agent. The one entry point that
 * `/api/agent/*` routes and the "Force run" buttons should use.
 */
export async function runFleetAgent(agentId: string, input: FleetRunInput = {}): Promise<any> {
  const agent = getFleetAgent(agentId)
  if (!agent) {
    throw new Error(`[orchestrator] unknown agent '${agentId}'`)
  }
  if (!agent.run) {
    throw new Error(
      `[orchestrator] agent '${agentId}' has no direct runner yet (logic still inline in its cron route)`
    )
  }
  console.log(`[orchestrator] run ${agent.id}`, input)
  return agent.run(input)
}

/** Fire one agent in the background, swallowing errors (event reactions must not block callers). */
function fireBackground(agent: FleetAgentDef, input: FleetRunInput) {
  queueMicrotask(() => {
    Promise.resolve()
      .then(() => agent.run!(input))
      .catch((err) => console.error(`[orchestrator] ${agent.id} failed:`, err?.message || err))
  })
}

/**
 * Route a business event to the agents that subscribe to it. Returns immediately
 * with what was dispatched; agents run in the background (each still does its own
 * lead-lock + cooldown checks, so concurrent dispatch is safe).
 */
export function dispatchEvent(event: FleetEvent): DispatchResult {
  const dispatched: string[] = []
  const skipped: { id: string; reason: string }[] = []

  const fire = (id: string, input: FleetRunInput) => {
    const agent = FLEET[id]
    if (!agent) return skipped.push({ id, reason: 'not_in_fleet' })
    if (!agent.run) return skipped.push({ id, reason: 'no_runner_yet' })
    fireBackground(agent, input)
    dispatched.push(id)
  }

  switch (event.type) {
    case 'client.created':
      // Converter qualifies → on success it creates a lead, which emits lead.created.
      fire('client_lead_converter', { clientId: event.clientId })
      break

    case 'lead.created':
      // Ownership rules (./rules.ts): visit-history OR warm leads → re-engager
      // (visit-history = personalized call; warm = generic catch-up call); fresh
      // cold leads → matchmaker. Same rules the matchmaker cron uses.
      if (event.hasVisitHistory || event.isWarm) {
        fire('dead_lead_reengager', { leadId: event.leadId })
      } else {
        fire('matchmaker', { leadId: event.leadId })
      }
      break

    case 'lead.qualified':
      // Confidence routing: hot/warm leads get an immediate matchmaker pass;
      // low-score leads stay with nurture flows instead of burning a cold dial.
      if (event.score != null && event.score < MATCHMAKER_CONFIDENCE_THRESHOLD) {
        skipped.push({ id: 'matchmaker', reason: `low_confidence_${event.score}` })
      } else {
        fire('matchmaker', { leadId: event.leadId })
      }
      break

    case 'property.created':
      fire('matchmaker', {})
      break

    case 'property.price_dropped':
      fire('price_drop', { propertyId: event.propertyId, payload: event.payload })
      break

    case 'campaign.launched':
      fire('campaign_conductor', { campaignId: event.campaignId })
      break

    case 'call.completed':
      // Reconcile the lead with what happened on the call (state machine + memory).
      fire('post_call_reconciler', { callId: event.callId, leadId: event.leadId })
      break
  }

  console.log(`[orchestrator] dispatch ${event.type} →`, dispatched, skipped.length ? `(skipped: ${skipped.map((s) => s.id).join(',')})` : '')
  return { event: event.type, dispatched, skipped }
}
