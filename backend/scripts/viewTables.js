import { query, checkDatabaseConnection, getPool } from '../src/config/database.js';

const tableName = process.argv[2] || 'tables';

async function main() {
  const status = await checkDatabaseConnection();
  if (!status.success) {
    console.error('Cannot connect to database:', status.error);
    process.exit(1);
  }

  if (tableName === 'tables') {
    const tables = await query('SHOW TABLES');
    console.log('\n📊 Tables in defaultdb:');
    console.table(tables);
    console.log('\n💡 Tip: To view data in a specific table, run:');
    console.log('   npm run db:view farmers');
    console.log('   npm run db:view tanks');
    console.log('   npm run db:view users');
    console.log('   npm run db:view regions\n');
  } else {
    // Sanitize table name against injection
    const allowed = ['users', 'regions', 'incharges', 'agents', 'farmers', 'tanks', 'submissions', 'harvests'];
    if (!allowed.includes(tableName.toLowerCase())) {
      console.error(`Invalid table name: "${tableName}". Allowed tables: ${allowed.join(', ')}`);
      process.exit(1);
    }

    const rows = await query(`SELECT * FROM ${tableName.toLowerCase()} LIMIT 25`);
    console.log(`\n📋 Rows in table "${tableName}" (${rows.length} records shown):\n`);
    console.table(rows);
  }

  await (await getPool()).end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
