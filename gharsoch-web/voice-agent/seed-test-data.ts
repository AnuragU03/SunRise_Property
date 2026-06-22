/**
 * seed-test-data.ts — seed the dev DB so the voice/booking/cron flows have real
 * data to act on (the gharsoch dev DB starts with properties only, no leads/users).
 *
 * Creates/updates (idempotent upserts):
 *  - broker user  (_id = DEFAULT_BROKER_ID, google_calendar_enabled: true)
 *  - lead for YOUR phone, matched to a real property, with next_follow_up_date in
 *    the past  → book_appointment resolves the lead AND the follow-up cron fires
 *  - a second lead that is re-engage eligible (cold + visit history 90 days ago)
 *    → the re-engage cron Path A fires
 *
 * Run:  npm run voice:seed -- +917996292635 "Anurag Ugargol"
 */
import 'dotenv/config'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'

async function main() {
  const phone = process.argv[2] || '+917996292635'
  const name = process.argv[3] || 'Anurag Ugargol'
  const brokerIdStr = process.env.DEFAULT_BROKER_ID
  if (!brokerIdStr || !ObjectId.isValid(brokerIdStr)) {
    console.error('DEFAULT_BROKER_ID missing/invalid in .env')
    process.exit(1)
  }

  // 1. A real property to match against
  const properties = await getCollection('properties')
  const property =
    (await properties.findOne({ is_deleted: { $ne: true }, status: 'available' })) ||
    (await properties.findOne({ is_deleted: { $ne: true } }))
  if (!property) {
    console.error('No properties in DB — seed a property first.')
    process.exit(1)
  }
  console.log(`✓ property: ${property.title} (${property._id})`)

  // 2. Broker user with calendar enabled (calendar events go to GOOGLE_CALENDAR_* account)
  const users = await getCollection('users')
  await users.updateOne(
    { _id: new ObjectId(brokerIdStr) },
    {
      $set: {
        name: 'Ajit Jawlekar',
        phone: '+919800000001',
        email: 'ajit.jawlekar@gharsoch.local',
        role: 'broker',
        status: 'active',
        google_calendar_enabled: true,
        updated_at: new Date(),
      },
      $setOnInsert: { created_at: new Date() },
    },
    { upsert: true }
  )
  console.log(`✓ broker user: Ajit Jawlekar (${brokerIdStr}), calendar enabled`)

  // 3. YOUR lead — booking resolves by this phone; follow-up cron will also pick it up
  const leads = await getCollection('leads')
  await leads.updateOne(
    { phone },
    {
      $set: {
        name,
        phone,
        broker_id: brokerIdStr,
        status: 'follow_up',
        next_follow_up_date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h overdue
        interest_level: 'warm',
        dnd_status: false,
        is_deleted: false,
        preferred_language: 'hi',
        budget_range: '50-70 lakhs',
        property_type: property.type || '2BHK',
        location_pref: property.location || '',
        place: property.city || '',
        matched_property_id: String(property._id),
        matched_property_title: property.title || '',
        notes: 'Seeded test lead for voice/booking/cron verification.',
        updated_at: new Date(),
      },
      $setOnInsert: { created_at: new Date(), source: 'seed' },
    },
    { upsert: true }
  )
  console.log(`✓ lead: ${name} (${phone}) — matched to "${property.title}", follow-up overdue`)

  // 4. Re-engage-eligible lead (cron Path A: warm/cold + visit history, never re-engaged)
  const reengagePhone = '+919999000111'
  await leads.updateOne(
    { phone: reengagePhone },
    {
      $set: {
        name: 'Reengage Tester',
        phone: reengagePhone,
        broker_id: brokerIdStr,
        status: 'cold',
        interest_level: 'cold',
        dnd_status: false,
        is_deleted: false,
        preferred_language: 'hi',
        last_visit_property_id: String(property._id),
        last_visit_property: property.title || '',
        last_visit_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        last_visit_type: 'site_visit',
        last_visit_summary: 'Visited, liked the layout, went quiet on price.',
        last_reengage_attempted_at: null,
        matched_property_id: String(property._id),
        matched_property_title: property.title || '',
        updated_at: new Date(),
      },
      $setOnInsert: { created_at: new Date(), source: 'seed' },
    },
    { upsert: true }
  )
  console.log(`✓ lead: Reengage Tester (${reengagePhone}) — cold, site visit 90 days ago`)

  console.log('\nSeed complete. Now:')
  console.log('  1. npm run voice:call -- ' + phone + ' "' + name + '" reengage   → book on the call → Calendar event')
  console.log('  2. npm run dev  +  npm run cron:once                              → follow-up + re-engage crons fire (webrtc rooms with Join buttons in Call Logs)')
  process.exit(0)
}

main().catch((err) => {
  console.error('SEED FAILED:', err?.message || err)
  process.exit(1)
})
