/**
 * scripts/seed-mumbai-properties.ts — wipe the properties collection and
 * repopulate with the Mumbai-only demo inventory (data/propertySeed.ts).
 *
 * Per product decision: the store holds Mumbai / Navi Mumbai / Thane only.
 * Hard-delete is intentional — the prior contents were Ahmedabad demo seed.
 *
 * Run:  npm run seed:mumbai            (wipe + reseed)
 *       npm run seed:mumbai -- --dry   (count only, no writes)
 */
import 'dotenv/config'
import { getCollection } from '@/lib/mongodb'
import SEED_PROPERTIES from '@/data/propertySeed'

const DRY = process.argv.includes('--dry')

async function main() {
  const properties = await getCollection('properties')

  const existing = await properties.countDocuments({})
  const byCity = await properties
    .aggregate([{ $group: { _id: '$city', n: { $sum: 1 } } }, { $sort: { n: -1 } }])
    .toArray()

  console.log(`\nCurrent properties: ${existing}`)
  for (const c of byCity) console.log(`  ${c._id || '(no city)'}: ${c.n}`)

  console.log(`\nSeed set: ${SEED_PROPERTIES.length} Mumbai-area listings`)
  const seedCities = SEED_PROPERTIES.reduce<Record<string, number>>((acc, p) => {
    acc[p.city] = (acc[p.city] || 0) + 1
    return acc
  }, {})
  for (const [city, n] of Object.entries(seedCities)) console.log(`  ${city}: ${n}`)

  if (DRY) {
    console.log('\n--dry: no changes made.')
    process.exit(0)
  }

  const del = await properties.deleteMany({})
  console.log(`\nDeleted ${del.deletedCount} existing properties.`)

  const ins = await properties.insertMany(SEED_PROPERTIES as any[])
  console.log(`Inserted ${ins.insertedCount} Mumbai-area properties.`)

  const finalByCity = await properties
    .aggregate([{ $group: { _id: '$city', n: { $sum: 1 } } }, { $sort: { n: -1 } }])
    .toArray()
  console.log('\nFinal store:')
  for (const c of finalByCity) console.log(`  ${c._id}: ${c.n}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('seed-mumbai-properties failed:', err)
  process.exit(1)
})
