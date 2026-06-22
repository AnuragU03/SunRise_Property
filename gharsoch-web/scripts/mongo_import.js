const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const url = process.env.DATABASE_URL || process.argv[2];
const inputDir = process.env.IMPORT_DIR || process.argv[3] || './dump';

if (!url) {
  console.error('Usage: DATABASE_URL=<url> node mongo_import.js [inputDir]');
  process.exit(1);
}

(async () => {
  const c = new MongoClient(url);
  await c.connect();
  const db = c.db('test');

  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} JSON files to import.`);

  for (const file of files) {
    const colName = path.basename(file, '.json');
    const docs = JSON.parse(fs.readFileSync(path.join(inputDir, file), 'utf8'));
    if (docs.length === 0) {
      console.log(`Skipping ${colName} (empty).`);
      continue;
    }
    console.log(`Importing ${docs.length} docs into ${colName}...`);
    // Insert one-by-one to handle rate limits
    let inserted = 0;
    for (const doc of docs) {
      try {
        await db.collection(colName).insertOne(doc);
        inserted++;
      } catch (e) {
        if (e.code === 11000) continue; // duplicate key, skip
        if (e.code === 16500) {
          await new Promise(r => setTimeout(r, 2000));
          await db.collection(colName).insertOne(doc);
          inserted++;
        } else throw e;
      }
    }
    console.log(`  ${inserted} inserted.`);
  }

  console.log('\nImport complete.');
  await c.close();
})().catch(e => { console.error(e); process.exit(1); });
