import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function getActionItemCollection() {
  return await getCollection('action_items')
}

// --- G1: Action item type enums ---

export type ActionType =
  | 'site_visit' | 'payment_followup' | 'send_material'
  | 'callback' | 'escalation'

export type ActionPriority = 'high' | 'medium' | 'low'

export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export type ActionSource = 'manual' | 'call_insight' | 'vapi_tool' | 'agent'

export interface ActionItem {
  _id?: ObjectId
  /** Optional link to the call that generated this item */
  call_id?: ObjectId | string | null
  /** GharSoch naming — Myra calls this customer_id; mapped at service boundary */
  lead_id: ObjectId | string
  /** Multi-tenant scoping, mandatory */
  broker_id: string
  /** Set when action_type='site_visit' and an appointment was also created */
  appointment_id?: ObjectId | string | null
  action_type: ActionType
  description: string
  due_date?: Date | null
  priority: ActionPriority
  status: ActionStatus
  /** Populated in G3 (calendar layer) */
  calendar_event_id?: string | null
  calendar_event_url?: string | null
  /** Provenance for idempotency */
  source: ActionSource
  /** e.g. `${call_id}:${action_type}` — matches Myra's dedup in analysis_service.py:161 */
  source_idempotency_key?: string | null
  /** Soft-delete convention (B14/X2) */
  is_deleted: boolean
  deleted_at?: Date | null
  created_at: Date
  updated_at: Date
  completed_at?: Date | null
}

export const DEFAULT_ACTION_ITEM: Omit<ActionItem, '_id' | 'broker_id' | 'lead_id' | 'action_type' | 'description' | 'source'> = {
  call_id: null,
  appointment_id: null,
  due_date: null,
  priority: 'medium',
  status: 'pending',
  calendar_event_id: null,
  calendar_event_url: null,
  source_idempotency_key: null,
  is_deleted: false,
  deleted_at: null,
  created_at: new Date(),
  updated_at: new Date(),
  completed_at: null,
}
