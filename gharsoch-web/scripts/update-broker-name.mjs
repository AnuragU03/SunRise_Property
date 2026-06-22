import 'dotenv/config'
import { MongoClient, ObjectId } from 'mongodb'

const url = process.env.DATABASE_URL
const dbName = process.env.MONGODB_DB || 'gharsoch'
const brokerId = process.env.DEFAULT_BROKER_ID

if (!url || !brokerId) {
  console.error('Missing DATABASE_URL or DEFAULT_BROKER_ID in .env')
  process.exit(1)
}

const client = new MongoClient(url)
await client.connect()
const db = client.db(dbName)

const result = await db.collection('users').updateOne(
  { _id: new ObjectId(brokerId) },
  { $set: { name: 'Ajit Jawlekar', updated_at: new Date() } }
)
console.log('Updated:', result.modifiedCount, 'document(s)')

const doc = await db.collection('users').findOne({ _id: new ObjectId(brokerId) })
console.log('Broker now:', doc?.name, '|', doc?.email, '|', doc?.role)

await client.close()
