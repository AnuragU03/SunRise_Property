import { MongoClient, Db, Collection, Document } from 'mongodb'

const uri = process.env.DATABASE_URL || ''

/**
 * Canonical database name for the whole app.
 *
 * Historically the service layer hardcoded `db('test')` while getDb()/getCollection()
 * relied on the connection-string default DB. When those two differ (e.g. a URI with a
 * `/gharsoch` path) reads and writes silently split across two databases. Resolving the
 * name from a single env var here — and using it everywhere — keeps the whole app on one DB.
 *
 * Default 'test' preserves existing production behaviour (the service layer + the MongoDB
 * driver default both resolve to 'test'). Override per-environment with MONGODB_DB
 * (e.g. local dev sets MONGODB_DB=gharsoch to match locally-seeded data).
 */
export const DB_NAME = process.env.MONGODB_DB || 'test'
const options: Record<string, any> = {
  // Explicit TLS config for MongoDB Atlas (fixes OpenSSL handshake errors on Windows)
  tls: true,
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true,
  // Connection pool settings for dev
  maxPoolSize: 10,
  // Generous timeouts — the VOICE AGENT runs in a separate process and connects
  // to Atlas from a home ISP in India (slow first connect). Tight timeouts caused
  // in-call DB tools (book_appointment, log_call_outcome) to time out mid-call,
  // so appointments never got saved. Page-load speed is handled separately by the
  // non-blocking instrumentation hook + connection warm-up, NOT by short timeouts.
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  retryReads: true,
  retryWrites: true,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  console.warn('WARNING: DATABASE_URL is missing. Database connections will fail at runtime.')
}

function createClientPromise(): Promise<MongoClient> {
  client = new MongoClient(uri, options)
  const promise = client.connect()
  // Detach a rejection handler so a transient connect failure (e.g. the known
  // Windows↔Atlas TLS flake) surfaces to awaiters but never crashes the process
  // as an unhandled rejection — critical for the long-running voice agent worker.
  promise.catch((err) => {
    console.error('[mongodb] initial connect failed (will retry on next use):', err?.message)
  })
  return promise
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = createClientPromise()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  clientPromise = createClientPromise()
}

export default clientPromise

export async function getDb(): Promise<Db> {
  let connected: MongoClient
  try {
    connected = await clientPromise
  } catch {
    // The cached connect promise is poisoned (failed initial connect).
    // Recreate the client once so a transient network/TLS error doesn't
    // permanently break every later query until process restart.
    clientPromise = createClientPromise()
    if (process.env.NODE_ENV === 'development') {
      ;(global as typeof globalThis & { _mongoClientPromise?: Promise<MongoClient> })._mongoClientPromise = clientPromise
    }
    connected = await clientPromise
  }
  return connected.db(DB_NAME)
}

export async function getCollection<T extends Document = Document>(collectionName: string): Promise<Collection<T>> {
  const db = await getDb()
  return db.collection<T>(collectionName)
}

/**
 * Eagerly establish (and verify) the DB connection, retrying a few times.
 * Called at the START of a voice call so the connection is hot BEFORE any
 * in-call tool runs — otherwise the first tool hits a cold Atlas connection
 * and times out mid-conversation. Best-effort: never throws.
 */
export async function ensureDbConnected(retries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const db = await getDb()
      await db.command({ ping: 1 })
      return true
    } catch (err) {
      console.warn(`[mongodb] warm-up attempt ${attempt}/${retries} failed:`, (err as Error)?.message)
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1500))
    }
  }
  return false
}
