const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const url = process.env.DATABASE_URL || process.argv[2];
const outputDir = process.env.DUMP_OUTPUT_DIR || process.argv[3] || './dump';

if (!url) {
  console.error('Usage: DATABASE_URL=<url> node mongo_dump.js [outputDir]');
  process.exit(1);
}

(async () => {
  const c = new MongoClient(url);
  await c.connect();
  const db = c.db('test');

  // Get all collection names
  const collections = await db.listCollections().toArray();
  console.log(`Found ${collections.length} collections:`, collections.map(c => c.name).join(', '));

  // Ensure output dir exists
  fs.mkdirSync(outputDir, { recursive: true });

  for (const col of collections) {
    const name = col.name;
    console.log(`Dumping ${name}...`);
    const docs = await db.collection(name).find({}).toArray();
    const outPath = path.join(outputDir, `${name}.json`);
    fs.writeFileSync(outPath, JSON.stringify(docs, null, 2));
    console.log(`  ${docs.length} documents → ${outPath}`);
  }

  console.log('\nBackup complete.');
  await c.close();
})().catch(e => { console.error(e); process.exit(1); });
