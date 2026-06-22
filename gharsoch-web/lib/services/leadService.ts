import { getCollection } from '@/lib/mongodb'
import { DEFAULT_LEAD } from '@/models/Lead'
import type { Lead } from '@/models/Lead'
import { ObjectId } from 'mongodb'
import { applyLeadAliases, normalizeLeadWrite } from './leadFieldAliases'

const COLLECTION = 'leads'

export type LeadPipelineStage = 'new' | 'contacted' | 'site_visit' | 'negotiation' | 'closed'

export type SerializedLead = Omit<
  Lead,
  '_id' | 'created_at' | 'updated_at' | 'last_contacted_at' | 'next_follow_up_date'
  | 'last_visit_date' | 'last_call_date'
> & {
  _id: string
  created_at: string
  updated_at: string
  last_contacted_at: string | null
  next_follow_up_date: string | null
  matched_property_id?: string
  match_score?: number
  match_rationale?: string
  notes_history?: string[]

  // G1: serialized date fields
  last_visit_date?: string | null
  last_call_date?: string | null

  // G1: virtual aliases (populated by applyLeadAliases in Commit 3)
  dnc_flag?: boolean
  lead_source?: string | null

  // G1: lazy-populated by paymentService (Commit 5, hydrated in G3)
  payment_summary?: { total_committed: number; status: string; last_updated: string } | null

  // G3.5: virtual field for whatsapp sent time
  last_whatsapp_sent_at?: string | null
}

export type LeadPipelineStats = {
  total: number
  hot: number
  warm: number
  cold: number
  dnc: number
  conversionPct: number
}

function toIso(value?: Date | string | null) {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function toStringId(value: unknown) {
  if (!value) return undefined
  return typeof value === 'string' ? value : String(value)
}

function serializeLead(lead: any): SerializedLead {
  return applyLeadAliases({
    ...lead,
    _id: String(lead._id),
    client_id: toStringId(lead.client_id),
    matched_property_id: toStringId(lead.matched_property_id),
    created_at: toIso(lead.created_at) || new Date().toISOString(),
    updated_at: toIso(lead.updated_at) || new Date().toISOString(),
    last_contacted_at: toIso(lead.last_contacted_at),
    next_follow_up_date: toIso(lead.next_follow_up_date),
    // G1: serialize Myra-parity date fields
    last_visit_date: toIso(lead.last_visit_date),
    last_call_date: toIso(lead.last_call_date),
  })
}

function byRecentTimestamp(a: any, b: any) {
  const aTime = new Date(a.updated_at || a.created_at || 0).getTime()
  const bTime = new Date(b.updated_at || b.created_at || 0).getTime()
  return bTime - aTime
}

function byNextFollowUpThenRecent(a: any, b: any) {
  const aFollowUp = a.next_follow_up_date ? new Date(a.next_follow_up_date).getTime() : Number.POSITIVE_INFINITY
  const bFollowUp = b.next_follow_up_date ? new Date(b.next_follow_up_date).getTime() : Number.POSITIVE_INFINITY

  if (aFollowUp !== bFollowUp) return aFollowUp - bFollowUp
  return byRecentTimestamp(a, b)
}

function normalizeStage(lead: any): LeadPipelineStage {
  const status = String(lead.status || '').toLowerCase()

  if (status === 'contacted' || status === 'qualified' || status === 'follow_up') return 'contacted'
  if (status === 'site_visit' || status === 'site visit' || status === 'visit_scheduled') return 'site_visit'
  if (status === 'negotiation' || status === 'negotiating') return 'negotiation'
  if (status === 'closed' || status === 'won' || status === 'lost' || status === 'not_interested') return 'closed'

  return 'new'
}

export const leadService = {
  async listByStage(): Promise<Record<LeadPipelineStage, SerializedLead[]>> {
    const collection = await getCollection<Lead>(COLLECTION)
    const leads = (await collection.find({ is_deleted: { $ne: true } }).toArray()).sort(byRecentTimestamp)

    const grouped: Record<LeadPipelineStage, SerializedLead[]> = {
      new: [],
      contacted: [],
      site_visit: [],
      negotiation: [],
      closed: [],
    }

    for (const lead of leads) {
      grouped[normalizeStage(lead)].push(serializeLead(lead))
    }

    return grouped
  },

  async listAll(): Promise<SerializedLead[]> {
    const collection = await getCollection<Lead>(COLLECTION)
    const leads = (await collection
      .find({ is_deleted: { $ne: true } })
      .sort({ next_follow_up_date: 1, updated_at: -1, created_at: -1 })
      .toArray()).sort(byNextFollowUpThenRecent)
    return leads.map(serializeLead)
  },

  async getStats(): Promise<LeadPipelineStats> {
    const collection = await getCollection<Lead>(COLLECTION)
    const [summary] = await collection
      .aggregate<{
        total: number
        hot: number
        warm: number
        cold: number
        dnc: number
        converted: number
      }>([
        { $match: { is_deleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            hot: { $sum: { $cond: [{ $eq: ['$interest_level', 'hot'] }, 1, 0] } },
            warm: { $sum: { $cond: [{ $eq: ['$interest_level', 'warm'] }, 1, 0] } },
            cold: { $sum: { $cond: [{ $eq: ['$interest_level', 'cold'] }, 1, 0] } },
            dnc: { $sum: { $cond: [{ $eq: ['$dnd_status', true] }, 1, 0] } },
            converted: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $gt: [{ $ifNull: ['$lead_score', 0] }, 0] },
                      { $in: ['$qualification_status', ['qualified', 'matched']] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ])
      .toArray()

    const total = summary?.total || 0
    const converted = summary?.converted || 0

    return {
      total,
      hot: summary?.hot || 0,
      warm: summary?.warm || 0,
      cold: summary?.cold || 0,
      dnc: summary?.dnc || 0,
      conversionPct: total === 0 ? 0 : Math.round((converted / total) * 100),
    }
  },

  async getWorkspaceData(): Promise<{
    allLeads: SerializedLead[]
    initialColumns: Record<LeadPipelineStage, SerializedLead[]>
    stats: LeadPipelineStats
  }> {
    const [allLeads, stats] = await Promise.all([
      this.listAll(),
      this.getStats(),
    ])

    const initialColumns: Record<LeadPipelineStage, SerializedLead[]> = {
      new: [],
      contacted: [],
      site_visit: [],
      negotiation: [],
      closed: [],
    }

    for (const lead of [...allLeads].sort(byRecentTimestamp)) {
      initialColumns[normalizeStage(lead)].push(lead)
    }

    return { allLeads, initialColumns, stats }
  },

  async moveToStage(leadId: string, newStage: LeadPipelineStage) {
    const collection = await getCollection<Lead>(COLLECTION)
    const _id = new ObjectId(leadId)
    await collection.updateOne(
      { _id },
      {
        $set: {
          status: newStage,
          updated_at: new Date(),
        },
      }
    )
  },

  async getById(leadId: string): Promise<SerializedLead | null> {
    const collection = await getCollection<Lead>(COLLECTION)
    let lead: any = null

    // Try ObjectId lookup first (standard documents)
    try {
      const _id = new ObjectId(leadId)
      lead = await collection.findOne({ _id, is_deleted: { $ne: true } })
    } catch (e) {
      // Not a valid ObjectId hex string — skip
    }

    // Fallback: try string _id lookup (seed data compatibility)
    if (!lead) {
      lead = await collection.findOne({ _id: leadId as any, is_deleted: { $ne: true } })
    }

    return lead ? serializeLead(lead) : null
  },

  async update(leadId: string, brokerId: string, patch: Partial<Lead>): Promise<boolean> {
    const collection = await getCollection<Lead>(COLLECTION)
    const _id = new ObjectId(leadId)
    
    // Convert aliased writes (dnd_status, source) if passed
    const normalizedPatch = normalizeLeadWrite(patch)
    
    const updateDoc = {
      ...normalizedPatch,
      updated_at: new Date()
    }
    
    // Prevent these fields from being overwritten blindly
    delete (updateDoc as any)._id
    delete (updateDoc as any).broker_id
    delete (updateDoc as any).created_at
    
    const result = await collection.updateOne(
      { _id, broker_id: brokerId, is_deleted: { $ne: true } },
      { $set: updateDoc }
    )
    
    return result.modifiedCount > 0
  },
}

export interface CreateLeadInput {
  broker_id: string;          // REQUIRED — never optional
  name: string;
  phone: string;
  email?: string;
  location_pref?: string;
  property_type?: string;
  budget_range?: string;
  notes?: string;
  source?: string;
  client_id?: string | ObjectId;
  next_follow_up_date?: Date | string | null;
  [key: string]: any;
}

export interface CreateLeadResult {
  ok: boolean;
  lead_id?: ObjectId | string;
  lead?: any;
  reason?: "duplicate_phone" | "missing_broker_id";
  existing_lead?: any;
}

/**
 * Single source of truth for creating leads.
 * Always stamps broker_id, normalizes phone, applies defaults, sets timestamps.
 * Used by /api/leads/route.ts AND lib/agents/clientLeadConverter.ts.
 */
export async function createLead(input: CreateLeadInput): Promise<CreateLeadResult> {
  if (!input.broker_id || typeof input.broker_id !== "string" || input.broker_id.trim() === "") {
    throw new Error("createLead: valid non-empty broker_id is required");
  }

  // G1: normalize Myra field names (dnc_flag → dnd_status, lead_source → source)
  const normalizedInput = normalizeLeadWrite(input) as CreateLeadInput;

  const leads = await getCollection<Lead>(COLLECTION);
  const normalizedPhone = (normalizedInput.phone || '').replace(/[^0-9+]/g, '');
  const normalizedLocation = (normalizedInput.location_pref || '').trim();

  // Dedup check (B5)
  if (normalizedPhone) {
    const existing = await leads.findOne({
      phone: normalizedPhone,
      broker_id: normalizedInput.broker_id,
      is_deleted: { $ne: true }
    });
    
    if (existing) {
      return { ok: false, reason: "duplicate_phone", existing_lead: existing };
    }
  }

  const { broker_id, ...restInput } = normalizedInput;

  // G7: if visit history is present, auto-stamp as warm reengagement candidate
  const hasVisitHistory = restInput.last_visit_property_id && restInput.last_visit_date && restInput.last_visit_type
  if (hasVisitHistory) {
    restInput.status = restInput.status || 'warm'
    restInput.source = restInput.source || 'reengagement_candidate'
    restInput.lead_reengage_history = restInput.lead_reengage_history || []
    restInput.reengage_no_answer_count = restInput.reengage_no_answer_count || 0
  }

  const leadDoc = {
    ...DEFAULT_LEAD,
    ...restInput,
    phone: normalizedPhone,
    location_pref: normalizedLocation,
    next_follow_up_date: normalizedInput.next_follow_up_date ? new Date(normalizedInput.next_follow_up_date) : null,
    broker_id: normalizedInput.broker_id,    // last to ensure it cannot be overridden
    is_deleted: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const result = await leads.insertOne(leadDoc as any);

  // G7: visit-history leads belong to the re-engager (rules R3). Routed through
  // the orchestrator's lead.created event. Gated by auto_fire_warm_calls so the
  // immediate on-create call can be turned off (cron / manual Start Call instead).
  if (hasVisitHistory) {
    import('@/lib/services/systemConfigService')
      .then(({ getSystemConfig }) => getSystemConfig())
      .then((cfg) => {
        if (!cfg.auto_fire_warm_calls) {
          console.log('[leadService.create] auto_fire_warm_calls off — re-engage lead queued for cron/manual')
          return
        }
        return import('@/lib/orchestrator').then(({ dispatchEvent }) =>
          dispatchEvent({ type: 'lead.created', leadId: result.insertedId.toString(), hasVisitHistory: true })
        )
      })
      .catch((err) => console.error('[leadService.create] lead.created dispatch failed:', err.message))
  }

  return { 
    ok: true, 
    lead_id: result.insertedId, 
    lead: { ...leadDoc, _id: result.insertedId } 
  };
}
