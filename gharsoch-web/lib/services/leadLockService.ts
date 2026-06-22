import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import type { LeadLock } from '@/models/LeadLock'

export const CRON_PRIORITY: Record<string, number> = {
  manual_broker: 100,
  reminder: 90,
  matchmaker: 80,
  follow_up: 70,
  re_engage: 60,
  default: 50,
}

export async function tryAcquireLeadLock(
  leadId: string | ObjectId,
  acquirer: string,
  reason: string,
  ttlMinutes: number = 30
): Promise<boolean> {
  const locks = await getCollection('lead_locks')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60000)

  const priority = CRON_PRIORITY[acquirer] || CRON_PRIORITY['default']

  try {
    const existingLock = await locks.findOne({ lead_id: new ObjectId(leadId) }) as LeadLock | null

    if (existingLock && existingLock.expires_at > now) {
      const existingPriority = CRON_PRIORITY[existingLock.acquired_by] || CRON_PRIORITY['default']
      const lockAgeMinutes = (now.getTime() - existingLock.acquired_at.getTime()) / 60000

      // Cannot supersede if priority is lower/equal, OR if the existing lock is less than 5 mins old
      // (unless the new acquirer is a human manual broker, who can override immediately)
      if (priority <= existingPriority || (acquirer !== 'manual_broker' && lockAgeMinutes < 5)) {
        return false
      }
    }

    // Upsert the lock
    await locks.updateOne(
      { lead_id: new ObjectId(leadId) },
      {
        $set: {
          acquired_by: acquirer,
          reason,
          acquired_at: now,
          expires_at: expiresAt,
        }
      },
      { upsert: true }
    )

    return true
  } catch (error) {
    console.error(`[LeadLockService] Failed to acquire lock for ${leadId}:`, error)
    return false
  }
}

export async function releaseLeadLock(leadId: string | ObjectId, acquirer: string): Promise<boolean> {
  try {
    const locks = await getCollection('lead_locks')
    const result = await locks.deleteOne({ 
      lead_id: new ObjectId(leadId),
      acquired_by: acquirer 
    })
    return result.deletedCount > 0
  } catch (error) {
    console.error(`[LeadLockService] Failed to release lock for ${leadId}:`, error)
    return false
  }
}
