/**
 * Quick MongoDB connection diagnostic
 * Tests different TLS configurations to find what works
 */
require('dotenv').config();

const { MongoClient } = require('mongodb');
const uri = process.env.DATABASE_URL;

if (!uri) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

console.log('Node.js version:', process.version);
console.log('OpenSSL version:', process.versions.openssl);
console.log('URI prefix:', uri.substring(0, 60) + '...');
console.log('');

async function testConnection(label, options) {
  console.log(`\n🔍 Test: ${label}`);
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 8000,
    ...options,
  });

  try {
    await client.connect();
    const collections = await client.db().listCollections().toArray();
    console.log(`  ✅ SUCCESS — ${collections.length} collections found`);
    await client.close();
    return true;
  } catch (err) {
    console.log(`  ❌ FAILED — ${err.message.split('\n')[0].substring(0, 120)}`);
    try { await client.close(); } catch {}
    return false;
  }
}

(async () => {
  // Test 1: Default (current config)
  const t1 = await testConnection('Default TLS options', {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
  });

  // Test 2: Minimal — no explicit TLS (let driver auto-detect from URI)
  const t2 = await testConnection('Driver auto-detect (no explicit options)', {});

  // Test 3: With explicit TLS 1.2 min version
  const t3 = await testConnection('Explicit TLS 1.2 min version', {
    tls: true,
    tlsAllowInvalidCertificates: true,
    minTlsVersion: 'TLSv1.2',
  });

  // Test 4: Direct connection to single host (no replica set)
  const singleHostUri = uri.replace(
    /ac-c5noube-shard-00-01[^,]*,ac-c5noube-shard-00-02[^/]*/,
    ''
  ).replace('replicaSet=atlas-1095fc-shard-0&', '').replace('directConnection=', '');
  
  const t4 = await testConnection('Single host + directConnection', {
    tls: true,
    tlsAllowInvalidCertificates: true,
    directConnection: true,
  });

  console.log('\n' + '='.repeat(50));
  console.log('Results:');
  console.log(`  Test 1 (Default TLS):      ${t1 ? '✅' : '❌'}`);
  console.log(`  Test 2 (Auto-detect):      ${t2 ? '✅' : '❌'}`);
  console.log(`  Test 3 (TLS 1.2 min):      ${t3 ? '✅' : '❌'}`);
  console.log(`  Test 4 (Single host):      ${t4 ? '✅' : '❌'}`);
  
  if (!t1 && !t2 && !t3 && !t4) {
    console.log('\n⚠️  All tests failed. Try running with:');
    console.log('  set NODE_OPTIONS=--tls-min-v1.2 && node scripts/test_mongo_connection.js');
  }
})();
