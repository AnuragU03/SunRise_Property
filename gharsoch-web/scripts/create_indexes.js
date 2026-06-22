require('dotenv').config();
const { MongoClient } = require('mongodb');

async function createIndexes() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error('DATABASE_URL is not set in .env');
    return;
  }

  console.log('Connecting to MongoDB to create indexes...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    const collections = ['leads', 'properties', 'appointments', 'calls', 'campaigns', 'agent_execution_logs', 'clients'];
    // Phase 11 auth collections
    const authCollections = ['users', 'brokerages'];

    for (const collName of collections) {
      console.log(`Creating indexes for ${collName}...`);
      const collection = db.collection(collName);
      
      try {
        // Single-field indexes
        await collection.createIndex({ created_at: -1 });
        await collection.createIndex({ updated_at: -1 });

        if (collName === 'agent_execution_logs') {
          await collection.createIndex({ run_id: 1 });
          await collection.createIndex({ agent_id: 1 });
          await collection.createIndex({ started_at: -1 });
          // Non-unique compound index
          await collection.createIndex({ agent_id: 1, started_at: -1 });
        }

        if (collName === 'leads') {
          await collection.createIndex({ is_deleted: 1, next_follow_up_date: 1, updated_at: -1 });
          await collection.createIndex({ is_deleted: 1, status: 1, next_follow_up_date: 1 });
          await collection.createIndex({ is_deleted: 1, interest_level: 1, updated_at: -1 });
          await collection.createIndex({ is_deleted: 1, dnd_status: 1 });
          await collection.createIndex({ broker_id: 1, phone: 1 });
        }

        if (collName === 'calls') {
          await collection.createIndex({ created_at: -1, duration: 1 });
          await collection.createIndex({ voice_call_id: 1 });
        }
        
        if (collName === 'appointments') {
          await collection.createIndex({ scheduled_at: 1 });
          await collection.createIndex({ is_deleted: 1, scheduled_at: 1, status: 1 });
        }

        if (collName === 'campaigns') {
          await collection.createIndex({ status: 1, started_at: -1, created_at: -1 });
        }
        
        if (collName === 'clients') {
          await collection.createIndex({ phone: 1 });
          await collection.createIndex({ conversion_status: 1, created_at: -1 });
          await collection.createIndex({ source: 1, created_at: -1 });
        }
        
        console.log(`✅ Indexes created for ${collName}`);
      } catch (err) {
        console.error(`❌ Failed to create index for ${collName}:`, err.message);
      }
    }

    console.log('\n🎉 All indexes created successfully!')

    // Phase 11 — Auth indexes (users, brokerages)
    console.log('\nCreating Phase 11 auth indexes...')

    try {
      const usersCol = db.collection('users')
      await usersCol.createIndex({ email: 1 }, { unique: true })
      await usersCol.createIndex({ status: 1 })
      await usersCol.createIndex({ role: 1 })
      await usersCol.createIndex({ brokerage_id: 1 })
      console.log('✅ users indexes created')
    } catch (err) {
      console.error('❌ Failed to create users indexes:', err.message)
    }

    try {
      const brokeragesCol = db.collection('brokerages')
      await brokeragesCol.createIndex({ name: 1 })
      console.log('✅ brokerages indexes created')
    } catch (err) {
      console.error('❌ Failed to create brokerages indexes:', err.message)
    }

    // G1 — action_items indexes
    console.log('\nCreating G1 action_items indexes...')
    try {
      const actionItemsCol = db.collection('action_items')
      await actionItemsCol.createIndex({ broker_id: 1, status: 1, due_date: 1 })           // dashboard list
      await actionItemsCol.createIndex({ lead_id: 1, status: 1 })                           // customer detail tab
      await actionItemsCol.createIndex({ call_id: 1, action_type: 1 })                      // idempotency for call_insight source
      await actionItemsCol.createIndex(
        { source_idempotency_key: 1 },
        { unique: true, sparse: true }                                                       // hard dedup
      )
      await actionItemsCol.createIndex({ is_deleted: 1, deleted_at: 1 })                    // soft-delete filter
      await actionItemsCol.createIndex({ due_date: 1, created_at: -1 })                     // sort composite index
      await actionItemsCol.createIndex({ broker_id: 1, due_date: 1, created_at: -1 })       // covered sort composite index
      console.log('✅ action_items indexes created')
    } catch (err) {
      console.error('❌ Failed to create action_items indexes:', err.message)
    }

    // G1 — payments indexes
    console.log('\nCreating G1 payments indexes...')
    try {
      const paymentsCol = db.collection('payments')
      await paymentsCol.createIndex({ broker_id: 1, payment_status: 1, commitment_date: -1 })  // dashboard list
      await paymentsCol.createIndex({ lead_id: 1, created_at: -1 })                             // customer detail
      await paymentsCol.createIndex({ call_id: 1 })                                              // call link
      await paymentsCol.createIndex({ is_deleted: 1, deleted_at: 1 })                            // soft-delete filter
      console.log('✅ payments indexes created')
    } catch (err) {
      console.error('❌ Failed to create payments indexes:', err.message)
    }

    // G3.5 — whatsapp_log indexes
    console.log('\nCreating G3.5 whatsapp_log indexes...')
    try {
      const whatsappLogCol = db.collection('whatsapp_log')
      await whatsappLogCol.createIndex({ broker_id: 1, created_at: -1 })
      await whatsappLogCol.createIndex({ lead_id: 1, created_at: -1 })
      await whatsappLogCol.createIndex({ delivery_status: 1, created_at: -1 })
      await whatsappLogCol.createIndex({ call_id: 1 }, { sparse: true })
      await whatsappLogCol.createIndex({ is_deleted: 1, deleted_at: 1 })
      console.log('✅ whatsapp_log indexes created')
    } catch (err) {
      console.error('❌ Failed to create whatsapp_log indexes:', err.message)
    }

    // G6 — lead_locks indexes
    console.log('\nCreating G6 lead_locks indexes...')
    try {
      const leadLocksCol = db.collection('lead_locks')
      await leadLocksCol.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 })
      await leadLocksCol.createIndex({ lead_id: 1, acquired_by: 1 }, { unique: true })
      console.log('✅ lead_locks indexes created')
    } catch (err) {
      console.error('❌ Failed to create lead_locks indexes:', err.message)
    }

  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await client.close();
  }
}

createIndexes();
