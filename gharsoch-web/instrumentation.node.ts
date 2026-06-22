/**
 * instrumentation.node.ts — Node.js-only startup logic.
 *
 * App starts with EMPTY leads page. User clicks "Load Leads" to populate,
 * then "Start Calling" to begin sequential voice calls.
 * This file only warms the DB connection for faster first page load.
 */
import clientPromise from './lib/mongodb'

export async function onStart() {
  if (!process.env.DATABASE_URL) return

  // Warm the MongoDB connection pool so first page load is fast
  try {
    const client = await clientPromise
    await client.db(process.env.MONGODB_DB || 'gharsoch').command({ ping: 1 })
    console.log('[startup] ✓ MongoDB connection warm.')
  } catch (err: any) {
    console.warn('[startup] MongoDB warm-up failed (non-fatal):', err.message)
  }
}
