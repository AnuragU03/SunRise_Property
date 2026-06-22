/**
 * seed-sample-leads.mjs
 *
 * Seeds a realistic mix of warm leads in MongoDB with ALL status types:
 *   - cold        → eligible for calling (loaded into pipeline)
 *   - contacted   → already called once
 *   - follow_up   → callback scheduled
 *   - booked      → appointment confirmed
 *   - dnd         → do-not-disturb (not interested for 6+ months)
 *
 * Only 'cold' leads are loaded into the pipeline by the "Load Leads" button.
 *
 * Run: node --env-file=.env scripts/seed-sample-leads.mjs
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

const properties = db.collection('properties')
const powai = await properties.findOne({ location: { $regex: 'powai', $options: 'i' }, status: 'available' })
const andheri = await properties.findOne({ location: { $regex: 'andheri', $options: 'i' }, status: 'available' })
const bandra = await properties.findOne({ location: { $regex: 'bandra', $options: 'i' }, status: 'available' })
const thane = await properties.findOne({ location: { $regex: 'thane|ghodbunder|majiwada', $options: 'i' }, status: 'available' })

const now = new Date()
const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000)
const daysFromNow = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000)

function leadDoc(o) {
  return {
    broker_id: brokerId,
    is_warm_lead: true,
    is_demo: true,
    is_deleted: false,
    dnd_status: o.status === 'dnd',
    preferred_language: 'hi',
    purpose: 'buy',
    qualification_status: 'qualified',
    source: 'demo_seed',
    email: '',
    assigned_agent_id: '',
    lead_score: 70,
    follow_up_count: 0,
    total_calls: o.total_calls || 0,
    first_call_completed: o.total_calls > 0,
    timeline: '3-6 months',
    objections: '',
    last_reengage_attempted_at: null,
    created_at: now,
    updated_at: now,
    interest_level: o.status === 'cold' ? 'warm' : o.interest_level || 'warm',
    ...o,
  }
}

const SAMPLE_LEADS = [
  // ── COLD leads (will be called) ──
  leadDoc({
    name: 'Rajesh Mehra', phone: '+917001000001', status: 'cold',
    builder_interest: 'Lodha Group',
    location_pref: powai?.location || 'Powai', place: powai?.city || 'Mumbai',
    property_type: '2BHK', budget_range: '1.5-2 cr',
    matched_property_id: powai ? String(powai._id) : '',
    matched_property_title: powai?.title || 'Lodha Sterling',
    last_visit_property: powai?.title || 'Lodha Sterling',
    last_visit_date: daysAgo(30), last_visit_type: 'office_walkin',
    last_visit_summary: 'Visited Lodha Sterling, liked amenities, asked about 2BHK pricing.',
    notes: 'Interested in Lodha Group projects in Powai.',
    customer_requirements: '2BHK, 1.5-2 cr, Powai',
    next_follow_up_date: null, last_contacted_at: null,
  }),
  leadDoc({
    name: 'Priya Sharma', phone: '+917001000002', status: 'cold',
    builder_interest: 'Godrej Properties',
    location_pref: andheri?.location || 'Andheri East', place: andheri?.city || 'Mumbai',
    property_type: '3BHK', budget_range: '2.5-3.5 cr',
    matched_property_id: andheri ? String(andheri._id) : '',
    matched_property_title: andheri?.title || 'Godrej Nest',
    last_visit_property: andheri?.title || 'Godrej Nest',
    last_visit_date: daysAgo(45), last_visit_type: 'site_visit',
    last_visit_summary: 'Visited Godrej site, interested in 3BHK, budget flexible.',
    notes: 'Interested in Godrej Properties.',
    customer_requirements: '3BHK, 2.5-3.5 cr, Andheri',
    next_follow_up_date: null, last_contacted_at: null,
  }),
  leadDoc({
    name: 'Amit Patel', phone: '+917001000003', status: 'cold',
    builder_interest: 'Hiranandani',
    location_pref: thane?.location || 'Ghodbunder Road', place: thane?.city || 'Thane',
    property_type: '2BHK', budget_range: '90 lakhs-1.2 cr',
    matched_property_id: thane ? String(thane._id) : '',
    matched_property_title: thane?.title || 'Hiranandani Estate',
    last_visit_property: thane?.title || 'Hiranandani Estate',
    last_visit_date: daysAgo(20), last_visit_type: 'phone_enquiry',
    last_visit_summary: 'Enquired about 2BHK in Thane, wants good connectivity.',
    notes: 'Looking for ready-to-move in Thane.',
    customer_requirements: '2BHK, 90L-1.2cr, Thane',
    next_follow_up_date: null, last_contacted_at: null,
  }),

  // ── CONTACTED lead (already called, no further action) ──
  leadDoc({
    name: 'Sneha Kulkarni', phone: '+917001000004', status: 'contacted',
    builder_interest: 'Oberoi Realty', interest_level: 'warm',
    location_pref: bandra?.location || 'Bandra West', place: 'Mumbai',
    property_type: '3BHK', budget_range: '4-5 cr',
    last_visit_date: daysAgo(10), last_visit_type: 'site_visit', total_calls: 1,
    last_call_summary: 'Spoke about Oberoi 3BHK, considering options.',
    notes: 'Contacted once, evaluating.',
    last_contacted_at: daysAgo(2), next_follow_up_date: null,
  }),

  // ── FOLLOW_UP lead (callback scheduled) ──
  leadDoc({
    name: 'Vikram Singh', phone: '+917001000005', status: 'follow_up',
    builder_interest: 'Kalpataru', interest_level: 'warm',
    location_pref: 'Kandivali East', place: 'Mumbai',
    property_type: '2BHK', budget_range: '1.2-1.5 cr', total_calls: 1,
    last_call_summary: 'Busy, asked to call back next week.',
    followup_reason: 'Customer requested callback',
    notes: 'Follow-up scheduled.',
    last_contacted_at: daysAgo(3), next_follow_up_date: daysFromNow(4),
  }),

  // ── BOOKED lead (appointment confirmed) ──
  leadDoc({
    name: 'Anjali Desai', phone: '+917001000006', status: 'booked',
    builder_interest: 'Runwal', interest_level: 'hot',
    location_pref: 'Mulund West', place: 'Mumbai',
    property_type: '3BHK', budget_range: '2-2.5 cr', total_calls: 2,
    last_call_summary: 'Booked site visit for this weekend.',
    notes: 'Appointment booked.',
    last_contacted_at: daysAgo(1), next_follow_up_date: null,
  }),

  // ── DND lead (not interested for 6+ months) ──
  leadDoc({
    name: 'Ramesh Iyer', phone: '+917001000007', status: 'dnd',
    builder_interest: 'Dosti Realty', interest_level: 'cold',
    location_pref: 'Chembur', place: 'Mumbai',
    property_type: '2BHK', budget_range: '1-1.3 cr', total_calls: 1,
    last_call_summary: 'Not looking to buy for at least 6 months. Requested DND.',
    notes: 'DND — not interested for 6 months.',
    last_contacted_at: daysAgo(5), next_follow_up_date: null,
  }),
]

// Clear existing demo leads and reseed
const del = await db.collection('leads').deleteMany({ is_demo: true })
console.log(`Deleted ${del.deletedCount} existing demo leads`)

const result = await db.collection('leads').insertMany(SAMPLE_LEADS)
console.log(`\n✓ Seeded ${result.insertedCount} sample leads:`)
for (const lead of SAMPLE_LEADS) {
  console.log(`  - ${lead.name.padEnd(18)} status=${lead.status.padEnd(10)} ${lead.builder_interest}`)
}

const coldCount = SAMPLE_LEADS.filter(l => l.status === 'cold').length
console.log(`\n${coldCount} COLD leads will be loaded into the pipeline for calling.`)
console.log('Other statuses (contacted/follow_up/booked/dnd) demo the full lifecycle.')

await client.close()
