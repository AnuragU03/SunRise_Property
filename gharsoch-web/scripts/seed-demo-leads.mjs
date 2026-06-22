/**
 * seed-demo-leads.mjs
 *
 * Creates two warm demo leads in MongoDB — one interested in Lodha Group,
 * one in Godrej Properties. Both are in Powai (plenty of inventory there).
 * Idempotent: keyed on phone number, safe to run multiple times.
 *
 * Run: node --env-file=.env scripts/seed-demo-leads.mjs
 */
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

// Pick a Powai property from DB if available (for matched_property_id)
const powaiProp = await db.collection('properties').findOne({
  location: { $regex: 'powai', $options: 'i' },
  status: 'available',
  is_deleted: { $ne: true },
})

const andheriProp = await db.collection('properties').findOne({
  location: { $regex: 'andheri', $options: 'i' },
  status: 'available',
  is_deleted: { $ne: true },
})

const now = new Date()

const DEMO_LEADS = [
  {
    phone: '+917001000001',
    name: 'Rajesh Mehra',
    builder_interest: 'Lodha Group',
    location_pref: powaiProp?.location || 'Powai',
    place: powaiProp?.city || 'Mumbai',
    property_type: '2BHK',
    budget_range: '1.5-2 cr',
    matched_property_id: powaiProp ? String(powaiProp._id) : null,
    matched_property_title: powaiProp?.title || '',
    notes: 'Interested in Lodha Group projects in Powai. Warm lead from builder event.',
    last_visit_type: 'office_walkin',
    last_visit_property: powaiProp?.title || 'Lodha Sterling',
    last_visit_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    last_visit_summary: 'Visited Lodha Sterling, liked the amenities, asked about 2BHK pricing.',
    purpose: 'buy',
  },
  {
    phone: '+917001000002',
    name: 'Priya Sharma',
    builder_interest: 'Godrej Properties',
    location_pref: andheriProp?.location || 'Andheri East',
    place: andheriProp?.city || 'Mumbai',
    property_type: '3BHK',
    budget_range: '2.5-3.5 cr',
    matched_property_id: andheriProp ? String(andheriProp._id) : null,
    matched_property_title: andheriProp?.title || '',
    notes: 'Interested in Godrej Properties. Warm lead referred by existing client.',
    last_visit_type: 'site_visit',
    last_visit_property: andheriProp?.title || 'Godrej Nest',
    last_visit_date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    last_visit_summary: 'Visited Godrej site, interested in 3BHK, concerned about possession timeline.',
    purpose: 'buy',
  },
]

let created = 0
let updated = 0

for (const lead of DEMO_LEADS) {
  const existing = await db.collection('leads').findOne({ phone: lead.phone })

  const doc = {
    name: lead.name,
    phone: lead.phone,
    broker_id: brokerId,
    status: 'warm',
    interest_level: 'warm',
    is_warm_lead: true,
    dnd_status: false,
    is_deleted: false,
    is_demo: true,                        // flag so startup hook can find them
    preferred_language: 'hi',
    budget_range: lead.budget_range,
    property_type: lead.property_type,
    location_pref: lead.location_pref,
    place: lead.place,
    notes: lead.notes,
    builder_interest: lead.builder_interest,
    matched_property_id: lead.matched_property_id,
    matched_property_title: lead.matched_property_title,
    last_visit_type: lead.last_visit_type,
    last_visit_property: lead.last_visit_property,
    last_visit_date: lead.last_visit_date,
    last_visit_summary: lead.last_visit_summary,
    purpose: lead.purpose,
    qualification_status: 'qualified',
    source: 'demo_seed',
    email: '',
    assigned_agent_id: '',
    preferred_contact_time: '',
    availability_window: '',
    availability_days: [],
    lead_score: 70,
    follow_up_count: 1,
    total_calls: 0,
    first_call_completed: false,
    customer_requirements: `${lead.property_type}, ${lead.budget_range}, ${lead.location_pref}`,
    timeline: '3-6 months',
    objections: '',
    followup_reason: 'Warm lead from builder event',
    last_contacted_at: lead.last_visit_date,
    next_follow_up_date: new Date(now.getTime() - 60 * 60 * 1000), // overdue by 1h → triggers follow-up
    last_reengage_attempted_at: null,
    updated_at: now,
  }

  if (existing) {
    await db.collection('leads').updateOne(
      { phone: lead.phone },
      { $set: doc }
    )
    console.log(`✓ updated: ${lead.name} (${lead.phone}) — ${lead.builder_interest}`)
    updated++
  } else {
    await db.collection('leads').insertOne({ ...doc, created_at: now })
    console.log(`✓ created: ${lead.name} (${lead.phone}) — ${lead.builder_interest}`)
    created++
  }
}

console.log(`\nDone. Created: ${created}, Updated: ${updated}`)
console.log('Demo leads are flagged with is_demo=true and is_warm_lead=true.')
console.log('The startup hook at /api/demo/auto-call will call them automatically.')

await client.close()
