/**
 * lib/orchestrator/fleet.ts — Canonical registry of GharSoch's autonomous
 * business/workflow agents ("Family B").
 *
 * This is the SINGLE SOURCE OF TRUTH for the workflow fleet: which agents exist,
 * how they're triggered, their lead-lock identity, and their arbitration priority.
 * Before this existed, that knowledge was scattered across crons, server actions,
 * service hooks, and the dashboard — which is how the same agent ended up triggered
 * from six different places with no coordination.
 *
 * NOTE: this is distinct from `lib/agentRegistry.ts`, which holds the in-call voice
 * LLM personas ("Family A"). They are different layers and intentionally separate.
 */

import { runMatchmaker, runMatchmakerForLead } from '@/lib/agents/matchmaker'
import { runCampaignConductor } from '@/lib/agents/campaignConductor'
import { runPriceDropNegotiator } from '@/lib/agents/priceDropNegotiator'
import { runClientLeadConverter } from '@/lib/agents/clientLeadConverter'
import { runAppointmentGuardian } from '@/lib/agents/appointmentGuardian'
import { runFollowUpAgent } from '@/lib/agents/followUpAgent'
import { checkAndFireReengage } from '@/lib/services/reengagerService'
import { reconcilePostCall } from './postCall'

/** Business events the orchestrator can route to agents. */
export type FleetEventType =
  | 'client.created'
  | 'lead.created'
  | 'lead.qualified'
  | 'property.created'
  | 'property.price_dropped'
  | 'campaign.launched'
  | 'call.completed'
  | 'cron'
  | 'manual'

/** Normalized input passed to an agent runner by the orchestrator. */
export interface FleetRunInput {
  leadId?: string
  clientId?: string
  campaignId?: string
  propertyId?: string
  callId?: string
  /** Free-form extra context for an agent that needs it. */
  payload?: Record<string, any>
}

export interface FleetAgentDef {
  /** Canonical agent id (matches agent_id used in runs/locks/dashboard). */
  id: string
  name: string
  description: string
  /**
   * Lead-lock acquirer name. MUST be a key in leadLockService.CRON_PRIORITY,
   * otherwise the lock silently falls back to default priority. Centralizing it
   * here is what prevents the historical `reengage` vs `re_engage` drift.
   */
  lockAcquirer?: string
  /** Arbitration priority (mirror of leadLockService.CRON_PRIORITY). */
  priority: number
  /** Human-readable trigger sources, for docs + the AI Operations UI. */
  triggers: string[]
  /** Cron job name if this agent is scheduled (matches scripts/local-cron.js). */
  cronJob?: string
  /**
   * Direct runner. When null, the agent's logic still lives inline in a route
   * handler and cannot yet be invoked by the orchestrator (follow-up + guardian
   * are pending runner extraction — see ORCHESTRATOR notes).
   */
  run: ((input: FleetRunInput) => Promise<any>) | null
}

export const FLEET: Record<string, FleetAgentDef> = {
  client_lead_converter: {
    id: 'client_lead_converter',
    name: 'Client → Lead Converter',
    description: 'Qualifies a new client and converts to a lead when score >= threshold.',
    priority: 50,
    triggers: ['client.created'],
    run: (input) => {
      if (!input.clientId) throw new Error('client_lead_converter requires clientId')
      return runClientLeadConverter(input.clientId)
    },
  },

  matchmaker: {
    id: 'matchmaker',
    name: 'The Matchmaker',
    description: 'Pairs fresh demand with active inventory and escalates the hottest pairings to calls.',
    lockAcquirer: 'matchmaker',
    priority: 80,
    triggers: ['lead.created', 'lead.qualified', 'property.created', 'cron:every_30_min', 'manual'],
    cronJob: 'matchmaker',
    run: (input) => (input.leadId ? runMatchmakerForLead(input.leadId) : runMatchmaker()),
  },

  appointment_guardian: {
    id: 'appointment_guardian',
    name: 'The Appointment Guardian',
    description: 'Scans the next 24h of appointments and issues reminder calls before brokers lose the slot.',
    lockAcquirer: 'reminder',
    priority: 90,
    triggers: ['cron:daily_09_IST', 'manual'],
    cronJob: 'reminders',
    run: () => runAppointmentGuardian(),
  },

  follow_up_agent: {
    id: 'follow_up_agent',
    name: 'The Follow-Up Agent',
    description: 'Reactivates scheduled follow-ups and pushes stalled buyers back into the loop.',
    lockAcquirer: 'follow_up',
    priority: 70,
    triggers: ['cron:hourly', 'manual'],
    cronJob: 'follow-up',
    run: () => runFollowUpAgent(),
  },

  dead_lead_reengager: {
    id: 'dead_lead_reengager',
    name: 'The Dead Lead Re-engager',
    description: 'Reaches out to cold leads with prior engagement history; personalized by visit type.',
    lockAcquirer: 're_engage',
    priority: 60,
    triggers: ['lead.created:has_visit', 'cron:daily_11_IST', 'manual'],
    cronJob: 're-engage',
    run: (input) => {
      if (!input.leadId) throw new Error('dead_lead_reengager requires leadId')
      return checkAndFireReengage(input.leadId)
    },
  },

  price_drop: {
    id: 'price_drop',
    name: 'The Price Drop Negotiator',
    description: 'Responds to property price-drop events and resurfaces buyers whose objections were price-based.',
    priority: 50,
    triggers: ['property.price_dropped', 'manual'],
    run: (input) => {
      if (!input.propertyId) throw new Error('price_drop requires propertyId')
      return runPriceDropNegotiator({ property_id: input.propertyId, ...(input.payload || {}) })
    },
  },

  post_call_reconciler: {
    id: 'post_call_reconciler',
    name: 'The Post-Call Reconciler',
    description:
      'After every call: applies the lead state machine (total_calls, status, cooldowns, DNC net) and writes cross-agent memory.',
    priority: 95, // reconciliation must beat any agent racing to re-dial the same lead
    triggers: ['call.completed'],
    run: (input) => {
      if (!input.callId) throw new Error('post_call_reconciler requires callId')
      return reconcilePostCall(input.callId)
    },
  },

  campaign_conductor: {
    id: 'campaign_conductor',
    name: 'The Campaign Conductor',
    description: 'Batched outbound runs with TRAI-aware throttling.',
    priority: 50,
    triggers: ['campaign.launched', 'cron:campaign_sweep', 'manual'],
    cronJob: 'campaign-sweep',
    run: (input) => {
      if (!input.campaignId) throw new Error('campaign_conductor requires campaignId')
      return runCampaignConductor(input.campaignId)
    },
  },
}

export function getFleetAgent(id: string): FleetAgentDef | undefined {
  return FLEET[id]
}

export function listFleetAgents(): FleetAgentDef[] {
  return Object.values(FLEET)
}

/** Agents that subscribe to a given business event. */
export function agentsForEvent(event: FleetEventType): FleetAgentDef[] {
  return listFleetAgents().filter((a) => a.triggers.some((t) => t === event || t.startsWith(event + ':')))
}
