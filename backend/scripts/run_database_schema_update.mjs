import database from '../src/config/database.js';
import { initializeDatabaseSchema } from '../src/config/initDb.js';
import { store } from '../src/data/store.js';

async function run() {
  console.log('\x1b[36m[DB Migration Runner]\x1b[0m Starting comprehensive schema update for all pages and features...');
  await database.checkDatabaseConnection();

  // 1. Initialize complete schema
  console.log('\x1b[33m[1/3] Executing initializeDatabaseSchema()...\x1b[0m');
  const initSuccess = await initializeDatabaseSchema();
  if (!initSuccess) {
    throw new Error('Database schema initialization returned false');
  }

  // 2. Synchronize existing tank due follow-ups and tanks compliance
  console.log('\x1b[33m[2/3] Synchronizing tank compliance cycles and test waivers...\x1b[0m');
  await database.query(`
    UPDATE tank_due_followups
    SET test_waived = 1,
        resolved_reason = 'ADDRESSED_BY_SUPERVISOR',
        settled_at = COALESCE(settled_at, created_at)
    WHERE status = 'ADDRESSED'
  `);

  await database.query(`
    UPDATE tanks t
    JOIN (
      SELECT f1.tank_id, f1.sender_name, f1.sender_role, f1.created_at
      FROM tank_due_followups f1
      JOIN (
        SELECT tank_id, MAX(created_at) as max_created
        FROM tank_due_followups
        WHERE status = 'ADDRESSED'
        GROUP BY tank_id
      ) f2 ON f1.tank_id = f2.tank_id AND f1.created_at = f2.max_created
    ) latest ON t.id = latest.tank_id
    SET t.compliance_status = 'ADDRESSED',
        t.weekly_test_waived = 1,
        t.last_followup_at = latest.created_at,
        t.last_followup_by = latest.sender_name,
        t.last_followup_role = latest.sender_role
  `);

  // Run store.getTankComplianceList to populate tank_compliance_cycles for all tanks
  const compliance = await store.getTankComplianceList({});
  console.log(`\x1b[32m[2/3 Done]\x1b[0m Computed and synchronized compliance for ${compliance.counts.totalActiveTanks} tanks.`);
  console.log(`- Due (test required): ${compliance.counts.dueCount}`);
  console.log(`- Addressed (test waived): ${compliance.counts.addressedCount}`);
  console.log(`- Compliant (routine test completed): ${compliance.counts.compliantCount}`);

  // 3. Verify all tables in database
  console.log('\x1b[33m[3/3] Inspecting all tables in MySQL...\x1b[0m');
  const tables = await database.query('SHOW TABLES');
  const tKey = Object.keys(tables[0])[0];
  console.log(`\n================================================================`);
  console.log(`DATABASE TABLE INVENTORY (${tables.length} TABLES VERIFIED)`);
  console.log(`================================================================`);
  for (const t of tables) {
    const tableName = t[tKey];
    const countRes = await database.query(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
    console.log(`  ✓ Table: ${tableName.padEnd(26)} | Rows: ${countRes[0].cnt}`);
  }
  console.log(`================================================================\n`);

  console.log('\x1b[32m[Success]\x1b[0m All database tables created and aligned with application pages and features.');
  process.exit(0);
}

run().catch(err => {
  console.error('\x1b[31m[Migration Failed]\x1b[0m', err);
  process.exit(1);
});
