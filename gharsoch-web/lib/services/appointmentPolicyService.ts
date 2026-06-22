import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const DB_NAME = process.env.MONGODB_DB || 'test'
const APPOINTMENTS_COLLECTION = 'appointments'
const HOLDS_COLLECTION = 'appointment_holds'

export const DEFAULT_APPOINTMENT_DURATION_MINUTES = 60
export const DEFAULT_APPOINTMENT_BUFFER_MINUTES = 15
export const DEFAULT_HOLD_TTL_SECONDS = 120

export type AppointmentWindow = {
  start: Date
  endsAt: Date
  bufferedEnd: Date
  durationMinutes: number
  bufferMinutes: number
}

export type AppointmentConflict = {
  appointment_id: string
  lead_id?: string
  lead_name?: string
  broker_id?: string
  scheduled_at: Date
  ends_at: Date
  buffered_end: Date
  status?: string
}

export class AppointmentConflictError extends Error {
  code = 'slot_unavailable'
  conflicts: AppointmentConflict[]
  alternatives: string[]

  constructor(message: string, conflicts: AppointmentConflict[], alternatives: string[]) {
    super(message)
    this.name = 'AppointmentConflictError'
    this.conflicts = conflicts
    this.alternatives = alternatives
  }
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

function normalizeMinutes(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function toObjectIdMaybe(id?: string | null) {
  return id && ObjectId.isValid(id) ? new ObjectId(id) : null
}

export function getAppointmentWindow(
  scheduledAt: Date | string,
  durationMinutes = DEFAULT_APPOINTMENT_DURATION_MINUTES,
  bufferMinutes = DEFAULT_APPOINTMENT_BUFFER_MINUTES
): AppointmentWindow {
  const start = scheduledAt instanceof Date ? scheduledAt : new Date(scheduledAt)
  const safeDuration = normalizeMinutes(durationMinutes, DEFAULT_APPOINTMENT_DURATION_MINUTES)
  const safeBuffer = normalizeMinutes(bufferMinutes, DEFAULT_APPOINTMENT_BUFFER_MINUTES)
  const endsAt = addMinutes(start, safeDuration)
  const bufferedEnd = addMinutes(endsAt, safeBuffer)

  return {
    start,
    endsAt,
    bufferedEnd,
    durationMinutes: safeDuration,
    bufferMinutes: safeBuffer,
  }
}

function getExistingWindow(appointment: any): AppointmentWindow {
  return getAppointmentWindow(
    appointment.scheduled_at,
    appointment.duration_minutes,
    appointment.buffer_minutes
  )
}

function overlaps(requested: AppointmentWindow, existing: AppointmentWindow) {
  return existing.start < requested.bufferedEnd && existing.bufferedEnd > requested.start
}

async function getDb() {
  const client = await clientPromise
  return client.db(DB_NAME)
}

export const appointmentPolicyService = {
  getAppointmentWindow,

  async ensureIndexes() {
    const db = await getDb()
    await db.collection(HOLDS_COLLECTION).createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 })
    await db.collection(HOLDS_COLLECTION).createIndex({ broker_id: 1, scheduled_at: 1, status: 1 })
    await db.collection(APPOINTMENTS_COLLECTION).createIndex({ broker_id: 1, scheduled_at: 1, status: 1 })
  },

  async findAppointmentConflicts(input: {
    brokerId?: string | null
    scheduledAt: Date | string
    durationMinutes?: number
    bufferMinutes?: number
    excludeAppointmentId?: string
  }): Promise<AppointmentConflict[]> {
    const requested = getAppointmentWindow(input.scheduledAt, input.durationMinutes, input.bufferMinutes)
    if (!input.brokerId) return []

    const db = await getDb()
    const excludeObjectId = toObjectIdMaybe(input.excludeAppointmentId)
    const query: Record<string, any> = {
      broker_id: String(input.brokerId),
      is_deleted: { $ne: true },
      status: { $nin: ['cancelled', 'deleted', 'completed', 'no_show'] },
      scheduled_at: { $lt: requested.bufferedEnd },
    }

    if (excludeObjectId) {
      query._id = { $ne: excludeObjectId }
    }

    const candidates = await db.collection(APPOINTMENTS_COLLECTION)
      .find(query)
      .sort({ scheduled_at: 1 })
      .limit(50)
      .toArray()

    return candidates
      .filter((appointment: any) => overlaps(requested, getExistingWindow(appointment)))
      .map((appointment: any) => {
        const existing = getExistingWindow(appointment)
        return {
          appointment_id: String(appointment._id),
          lead_id: appointment.lead_id ? String(appointment.lead_id) : undefined,
          lead_name: appointment.lead_name,
          broker_id: appointment.broker_id,
          scheduled_at: existing.start,
          ends_at: existing.endsAt,
          buffered_end: existing.bufferedEnd,
          status: appointment.status,
        }
      })
  },

  async isSlotAvailable(input: {
    brokerId?: string | null
    scheduledAt: Date | string
    durationMinutes?: number
    bufferMinutes?: number
    excludeAppointmentId?: string
  }) {
    const conflicts = await this.findAppointmentConflicts(input)
    return conflicts.length === 0
  },

  async suggestAlternatives(input: {
    brokerId?: string | null
    scheduledAt: Date | string
    durationMinutes?: number
    bufferMinutes?: number
    excludeAppointmentId?: string
    count?: number
  }) {
    const requested = getAppointmentWindow(input.scheduledAt, input.durationMinutes, input.bufferMinutes)
    const suggestions: string[] = []
    let cursor = addMinutes(requested.bufferedEnd, 0)
    const maxAttempts = 48

    for (let attempt = 0; attempt < maxAttempts && suggestions.length < (input.count || 3); attempt++) {
      if (await this.isSlotAvailable({ ...input, scheduledAt: cursor })) {
        suggestions.push(cursor.toISOString())
      }
      cursor = addMinutes(cursor, 15)
    }

    return suggestions
  },

  async assertSlotAvailable(input: {
    brokerId?: string | null
    scheduledAt: Date | string
    durationMinutes?: number
    bufferMinutes?: number
    excludeAppointmentId?: string
  }) {
    const conflicts = await this.findAppointmentConflicts(input)
    if (conflicts.length === 0) return

    const alternatives = await this.suggestAlternatives({ ...input, count: 3 })
    const first = conflicts[0]
    throw new AppointmentConflictError(
      `Requested slot overlaps an existing appointment from ${first.scheduled_at.toISOString()} to ${first.ends_at.toISOString()}.`,
      conflicts,
      alternatives
    )
  },

  async createHold(input: {
    brokerId: string
    leadId?: string
    callId?: string
    scheduledAt: Date | string
    durationMinutes?: number
    bufferMinutes?: number
    ttlSeconds?: number
  }) {
    await this.ensureIndexes()
    await this.assertSlotAvailable({
      brokerId: input.brokerId,
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes,
      bufferMinutes: input.bufferMinutes,
    })

    const window = getAppointmentWindow(input.scheduledAt, input.durationMinutes, input.bufferMinutes)
    const db = await getDb()
    const now = new Date()
    const ttlMs = (input.ttlSeconds || DEFAULT_HOLD_TTL_SECONDS) * 1000
    const result = await db.collection(HOLDS_COLLECTION).insertOne({
      broker_id: input.brokerId,
      lead_id: input.leadId || '',
      call_id: input.callId || '',
      scheduled_at: window.start,
      ends_at: window.endsAt,
      buffered_end: window.bufferedEnd,
      duration_minutes: window.durationMinutes,
      buffer_minutes: window.bufferMinutes,
      status: 'active',
      expires_at: new Date(now.getTime() + ttlMs),
      created_at: now,
      updated_at: now,
    })

    return {
      hold_id: String(result.insertedId),
      ...window,
    }
  },

  async releaseHold(holdId: string, status: 'released' | 'consumed' = 'released') {
    const objectId = toObjectIdMaybe(holdId)
    if (!objectId) return

    const db = await getDb()
    await db.collection(HOLDS_COLLECTION).updateOne(
      { _id: objectId },
      { $set: { status, updated_at: new Date() } }
    )
  },
}
