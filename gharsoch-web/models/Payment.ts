import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function getPaymentCollection() {
  return await getCollection('payments')
}

// --- G1: Payment status enum ---

export type PaymentStatus =
  | 'discussed' | 'committed' | 'partial' | 'completed' | 'overdue'

export interface Payment {
  _id?: ObjectId
  /** GharSoch naming — links to leads collection */
  lead_id: ObjectId | string
  /** Multi-tenant scoping, mandatory */
  broker_id: string
  /** Optional link to the call where commitment was made */
  call_id?: ObjectId | string | null
  property_id?: ObjectId | string | null
  /** INR amount discussed during call */
  amount_discussed: number
  /** INR amount committed — set when status='committed' or later */
  amount_committed?: number | null
  commitment_date?: Date | null
  payment_status: PaymentStatus
  follow_up_notes?: string
  /** Soft-delete convention (B14/X2) */
  is_deleted: boolean
  deleted_at?: Date | null
  created_at: Date
  updated_at: Date
}

export const DEFAULT_PAYMENT: Omit<Payment, '_id' | 'broker_id' | 'lead_id' | 'amount_discussed' | 'payment_status'> = {
  call_id: null,
  property_id: null,
  amount_committed: null,
  commitment_date: null,
  follow_up_notes: '',
  is_deleted: false,
  deleted_at: null,
  created_at: new Date(),
  updated_at: new Date(),
}
