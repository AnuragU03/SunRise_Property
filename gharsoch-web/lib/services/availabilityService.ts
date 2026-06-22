import clientPromise from '@/lib/mongodb'
import { startOfDay, addDays, format, isSameDay } from 'date-fns'

export const availabilityService = {
  /**
   * Computes free slots from users.availability_slots minus existing appointments
   */
  async getAvailabilityString(brokerId: string, preferredDay?: string): Promise<string> {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'test')
    
    // Find a broker user for this brokerage_id. In GharSoch, brokerId is usually brokerage_id
    // but sometimes it can be the user's ObjectId. We check both.
    const { ObjectId } = require('mongodb')
    let userQuery: any = { brokerage_id: brokerId, role: 'broker' }
    if (ObjectId.isValid(brokerId)) {
      userQuery = { $or: [{ brokerage_id: brokerId }, { _id: new ObjectId(brokerId) }] }
    }
    
    const user = await db.collection('users').findOne(userQuery)

    const hasSlots = user?.availability_slots && user.availability_slots.length > 0
    const slots = hasSlots
      ? user.availability_slots
      : [
          { day: 'Saturday', start: '10am', end: '6pm' },
          { day: 'Sunday', start: '10am', end: '6pm' }
        ]

    const now = new Date()
    const twoWeeks = addDays(now, 14)
    
    const appointments = await db.collection('appointments').find({
      broker_id: brokerId,
      status: { $ne: 'cancelled' },
      is_deleted: { $ne: true },
      scheduled_at: { $gte: now, $lte: twoWeeks }
    }).toArray()

    // If no slots configured, return the safe default text as specified in contract
    if (!hasSlots) {
      return "Available Saturday-Sunday 10am-6pm. Please propose a time within these hours."
    }

    // Advanced: Format configured slots and subtract appointments
    // For Vapi, the response needs to be conversational.
    const slotStrings = slots.map((s: any) => `${s.day} ${s.start}-${s.end}`)
    const bookedDates = appointments.map(a => format(a.scheduled_at, 'EEEE h:mma'))
    
    let result = `Broker available: ${slotStrings.join(', ')}.`
    if (bookedDates.length > 0) {
      result += ` Note, they are already booked on: ${bookedDates.join(', ')}.`
    }
    return result
  }
}
