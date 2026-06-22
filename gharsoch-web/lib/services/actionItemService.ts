import clientPromise from '@/lib/mongodb'
import { DEFAULT_ACTION_ITEM } from '@/models/ActionItem'
import type { ActionItem, ActionStatus } from '@/models/ActionItem'
import { ObjectId } from 'mongodb'

const DB_NAME = process.env.MONGODB_DB || 'test'
const COLLECTION = 'action_items'

export type SerializedActionItem = Omit<
  ActionItem,
  '_id' | 'created_at' | 'updated_at' | 'due_date' | 'deleted_at' | 'completed_at'
> & {
  _id: string
  lead_id: string
  call_id?: string | null
  appointment_id?: string | null
  created_at: string
  updated_at: string
  due_date?: string | null
  deleted_at?: string | null
  completed_at?: string | null
}

function toIso(value?: Date | string | null) {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function toStringId(value: unknown) {
  if (!value) return null
  return typeof value === 'string' ? value : String(value)
}

function serializeActionItem(item: any): SerializedActionItem {
  return {
    ...item,
    _id: String(item._id),
    lead_id: toStringId(item.lead_id) || '',
    call_id: toStringId(item.call_id),
    appointment_id: toStringId(item.appointment_id),
    created_at: toIso(item.created_at) || new Date().toISOString(),
    updated_at: toIso(item.updated_at) || new Date().toISOString(),
    due_date: toIso(item.due_date),
    deleted_at: toIso(item.deleted_at),
    completed_at: toIso(item.completed_at),
  }
}

async function getCollection() {
  const client = await clientPromise
  return client.db(DB_NAME).collection<ActionItem>(COLLECTION)
}

export interface ListActionItemsOptions {
  brokerId: string
  leadId?: string
  callId?: string
  status?: ActionStatus
  limit?: number
}

export interface CreateActionItemInput {
  broker_id: string
  lead_id: string | ObjectId
  action_type: ActionItem['action_type']
  description: string
  source: ActionItem['source']
  call_id?: string | ObjectId | null
  appointment_id?: string | ObjectId | null
  due_date?: Date | string | null
  priority?: ActionItem['priority']
  status?: ActionItem['status']
  calendar_event_id?: string | null
  calendar_event_url?: string | null
  source_idempotency_key?: string | null
}

export const actionItemService = {
  /**
   * List action items — always broker-scoped + soft-delete filtered.
   */
  async list(options: ListActionItemsOptions): Promise<SerializedActionItem[]> {
    const collection = await getCollection()
    const filter: Record<string, any> = {
      broker_id: options.brokerId,
      is_deleted: { $ne: true },
    }
    if (options.leadId) {
      filter.lead_id = options.leadId
    }
    if (options.status) {
      filter.status = options.status
    }
    if (options.callId) {
      filter.call_id = options.callId
    }

    const items = await collection
      .find(filter)
      .sort({ due_date: 1, created_at: -1 })
      .limit(options.limit || 50)
      .toArray()

    return items.map(serializeActionItem)
  },

  /**
   * Create a new action item.
   * Computes source_idempotency_key for call_insight source if call_id + action_type present.
   */
  async create(input: CreateActionItemInput): Promise<SerializedActionItem> {
    if (!input.broker_id || typeof input.broker_id !== 'string' || input.broker_id.trim() === '') {
      throw new Error('actionItemService.create: valid non-empty broker_id is required')
    }

    const collection = await getCollection()
    const now = new Date()

    // Compute idempotency key for call_insight source (mirrors Myra analysis_service.py:161)
    let idempotencyKey = input.source_idempotency_key ?? null
    if (!idempotencyKey && input.source === 'call_insight' && input.call_id && input.action_type) {
      idempotencyKey = `${String(input.call_id)}:${input.action_type}`
    }

    const doc: Omit<ActionItem, '_id'> = {
      ...DEFAULT_ACTION_ITEM,
      lead_id: String(input.lead_id),
      broker_id: input.broker_id,
      action_type: input.action_type,
      description: input.description,
      source: input.source,
      call_id: input.call_id ? String(input.call_id) : null,
      appointment_id: input.appointment_id ? String(input.appointment_id) : null,
      due_date: input.due_date ? new Date(input.due_date) : null,
      priority: input.priority || 'medium',
      status: input.status || 'pending',
      calendar_event_id: input.calendar_event_id ?? null,
      calendar_event_url: input.calendar_event_url ?? null,
      source_idempotency_key: idempotencyKey,
      is_deleted: false,
      deleted_at: null,
      created_at: now,
      updated_at: now,
      completed_at: null,
    }

    const result = await collection.insertOne(doc as any)
    return serializeActionItem({ ...doc, _id: result.insertedId })
  },

  /**
   * Update an action item — broker-scoped. Stamps completed_at on status→completed.
   */
  async update(
    id: string,
    patch: Partial<Pick<ActionItem, 'status' | 'priority' | 'due_date' | 'description' | 'calendar_event_id' | 'calendar_event_url'>>,
    brokerId: string
  ): Promise<boolean> {
    const collection = await getCollection()
    const now = new Date()
    const updateDoc: Record<string, any> = {
      ...patch,
      updated_at: now,
    }

    // Auto-stamp completed_at when transitioning to 'completed'
    if (patch.status === 'completed') {
      updateDoc.completed_at = now
    }

    if (patch.due_date) {
      updateDoc.due_date = new Date(patch.due_date)
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id), broker_id: brokerId, is_deleted: { $ne: true } },
      { $set: updateDoc }
    )

    return result.modifiedCount > 0
  },

  /**
   * Soft-delete an action item — broker-scoped.
   */
  async softDelete(id: string, brokerId: string): Promise<boolean> {
    const collection = await getCollection()
    const result = await collection.updateOne(
      { _id: new ObjectId(id), broker_id: brokerId, is_deleted: { $ne: true } },
      {
        $set: {
          is_deleted: true,
          deleted_at: new Date(),
          updated_at: new Date(),
        },
      }
    )
    return result.modifiedCount > 0
  },

  /**
   * Count pending action items for a broker (used by sidebar counts).
   */
  async countPending(brokerId: string): Promise<number> {
    const collection = await getCollection()
    return collection.countDocuments({
      broker_id: brokerId,
      status: 'pending',
      is_deleted: { $ne: true },
    })
  },

  /**
   * Count pending action items for a specific lead.
   */
  async countPendingForLead(leadId: string, brokerId: string): Promise<number> {
    const collection = await getCollection()
    return collection.countDocuments({
      lead_id: leadId,
      broker_id: brokerId,
      status: 'pending',
      is_deleted: { $ne: true },
    })
  },
}
