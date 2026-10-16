import database from '../src/config/database.js';

async function check() {
  await database.checkDatabaseConnection();
  console.log('--- TANK COMPLIANCE CYCLES ---');
  const cycles = await database.query('SELECT cycle_key, tank_id, status, test_required, days_overdue, addressed_by_name FROM tank_compliance_cycles');
  console.table(cycles);

  console.log('\n--- TANK DUE FOLLOWUPS ---');
  const fup = await database.query('SELECT id, tank_id, sender_name, sender_role, test_waived, resolved_reason, settled_at FROM tank_due_followups');
  console.table(fup);

  console.log('\n--- ADDRESSED TANKS ---');
  const tanks = await database.query("SELECT id, name, compliance_status, weekly_test_waived, last_followup_by, last_followup_role FROM tanks WHERE compliance_status = 'ADDRESSED'");
  console.table(tanks);

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
