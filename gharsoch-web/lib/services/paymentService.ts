import clientPromise from '@/lib/mongodb'
import { DEFAULT_PAYMENT } from '@/models/Payment'
import type { Payment, PaymentStatus } from '@/models/Payment'
import { ObjectId } from 'mongodb'

const DB_NAME = process.env.MONGODB_DB || 'test'
const COLLECTION = 'payments'

export type SerializedPayment = Omit<
  Payment,
  '_id' | 'created_at' | 'updated_at' | 'commitment_date' | 'deleted_at'
> & {
  _id: string
  lead_id: string
  call_id?: string | null
  property_id?: string | null
  created_at: string
  updated_at: string
  commitment_date?: string | null
  deleted_at?: string | null
}

export type LeadPaymentSummary = {
  total_committed: number
  status: string
  last_updated: string
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

function serializePayment(payment: any): SerializedPayment {
  return {
    ...payment,
    _id: String(payment._id),
    lead_id: toStringId(payment.lead_id) || '',
    call_id: toStringId(payment.call_id),
    property_id: toStringId(payment.property_id),
    created_at: toIso(payment.created_at) || new Date().toISOString(),
    updated_at: toIso(payment.updated_at) || new Date().toISOString(),
    commitment_date: toIso(payment.commitment_date),
    deleted_at: toIso(payment.deleted_at),
  }
}

async function getCollection() {
  const client = await clientPromise
  return client.db(DB_NAME).collection<Payment>(COLLECTION)
}

export interface ListPaymentsOptions {
  brokerId: string
  leadId?: string
  status?: PaymentStatus
  limit?: number
}

export interface CreatePaymentInput {
  broker_id: string
  lead_id: string | ObjectId
  amount_discussed: number
  payment_status: PaymentStatus
  call_id?: string | ObjectId | null
  property_id?: string | ObjectId | null
  amount_committed?: number | null
  commitment_date?: Date | string | null
  follow_up_notes?: string
}

export const paymentService = {
  /**
   * List payments — always broker-scoped + soft-delete filtered.
   */
  async list(options: ListPaymentsOptions): Promise<SerializedPayment[]> {
    const collection = await getCollection()
    const filter: Record<string, any> = {
      broker_id: options.brokerId,
      is_deleted: { $ne: true },
    }
    if (options.leadId) {
      filter.lead_id = options.leadId
    }
    if (options.status) {
      filter.payment_status = options.status
    }

    const items = await collection
      .find(filter)
      .sort({ created_at: -1 })
      .limit(options.limit || 50)
      .toArray()

    return items.map(serializePayment)
  },

  /**
   * Create a new payment record.
   */
  async create(input: CreatePaymentInput): Promise<SerializedPayment> {
    if (!input.broker_id || typeof input.broker_id !== 'string' || input.broker_id.trim() === '') {
      throw new Error('paymentService.create: valid non-empty broker_id is required')
    }

    const collection = await getCollection()
    const now = new Date()

    const doc: Omit<Payment, '_id'> = {
      ...DEFAULT_PAYMENT,
      lead_id: String(input.lead_id),
      broker_id: input.broker_id,
      amount_discussed: input.amount_discussed,
      payment_status: input.payment_status,
      call_id: input.call_id ? String(input.call_id) : null,
      property_id: input.property_id ? String(input.property_id) : null,
      amount_committed: input.amount_committed ?? null,
      commitment_date: input.commitment_date ? new Date(input.commitment_date) : null,
      follow_up_notes: input.follow_up_notes || '',
      is_deleted: false,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    }

    const result = await collection.insertOne(doc as any)
    return serializePayment({ ...doc, _id: result.insertedId })
  },

  /**
   * Update a payment — broker-scoped.
   */
  async update(
    id: string,
    patch: Partial<Pick<Payment, 'payment_status' | 'amount_committed' | 'commitment_date' | 'follow_up_notes'>>,
    brokerId: string
  ): Promise<boolean> {
    const collection = await getCollection()
    const updateDoc: Record<string, any> = {
      ...patch,
      updated_at: new Date(),
    }

    if (patch.commitment_date) {
      updateDoc.commitment_date = new Date(patch.commitment_date)
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id), broker_id: brokerId, is_deleted: { $ne: true } },
      { $set: updateDoc }
    )

    return result.modifiedCount > 0
  },

  /**
   * Soft-delete a payment — broker-scoped.
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
   * Get payment summary for a lead — used for lazy serialization in SerializedLead.
   * Returns null if no payments exist.
   */
  async getLeadPaymentSummary(leadId: string, brokerId: string): Promise<LeadPaymentSummary | null> {
    const collection = await getCollection()
    const payments = await collection
      .find({
        lead_id: leadId,
        broker_id: brokerId,
        is_deleted: { $ne: true },
      })
      .sort({ created_at: -1 })
      .toArray()

    if (payments.length === 0) return null

    const totalCommitted = payments.reduce(
      (sum, p) => sum + (p.amount_committed || 0),
      0
    )

    // Derive overall status from latest payment
    const latestStatus = payments[0].payment_status
    const latestUpdate = payments[0].updated_at

    return {
      total_committed: totalCommitted,
      status: latestStatus,
      last_updated: toIso(latestUpdate) || new Date().toISOString(),
    }
  },
}
