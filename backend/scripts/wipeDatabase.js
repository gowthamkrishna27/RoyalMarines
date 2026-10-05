import readline from 'readline';
import { query, checkDatabaseConnection, getPool } from '../src/config/database.js';
import { initializeDatabaseSchema, seedDatabase } from '../src/config/initDb.js';

// Parse CLI flags
const args = process.argv.slice(2);
const isForce = args.includes('--force') || args.includes('-y');
const isDrop = args.includes('--drop');
const isReset = args.includes('--reset') || args.includes('--seed');

function askConfirmation(question) {
  return new Promise((resolve) => {
    // If not a TTY (running in CI or non-interactive terminal) and not forced, abort safely
    if (!process.stdin.isTTY) {
      return resolve(false);
    }
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
}

async function main() {
  console.log('\n\x1b[36m=========================================\x1b[0m');
  console.log('\x1b[1;36m       Royals Marine Database Wipe       \x1b[0m');
  console.log('\x1b[36m=========================================\x1b[0m\n');

  const status = await checkDatabaseConnection();
  if (!status.success) {
    console.error('\x1b[31m❌ Cannot connect to database:\x1b[0m', status.error);
    process.exit(1);
  }

  const dbName = process.env.DB_NAME || 'defaultdb';
  const modeText = isDrop
    ? 'DROP all tables completely'
    : isReset
    ? 'WIPE all data and RE-SEED default records'
    : 'TRUNCATE (wipe) all data from all tables';

  console.log(`\x1b[33mTarget Database:\x1b[0m \x1b[1m${dbName}\x1b[0m`);
  console.log(`\x1b[33mOperation:\x1b[0m       \x1b[1m${modeText}\x1b[0m\n`);

  if (!isForce) {
    const confirmed = await askConfirmation(
      `\x1b[31;1m⚠️  WARNING:\x1b[0m This will permanently delete all records in "${dbName}".\nType \x1b[32m'y'\x1b[0m to proceed or press Enter to cancel: `
    );
    if (!confirmed) {
      console.log('\n\x1b[33mAction cancelled by user. No tables were modified.\x1b[0m\n');
      await (await getPool()).end();
      process.exit(0);
    }
  }

  console.log('\n\x1b[34m[1/3] Disabling foreign key constraints...\x1b[0m');
  await query('SET FOREIGN_KEY_CHECKS = 0');

  // Discover all tables in database
  const rawTables = await query('SHOW TABLES');
  const tableKey = Object.keys(rawTables[0] || {})[0];
  const tableNames = rawTables.map((r) => r[tableKey]);

  console.log(`\x1b[34m[2/3] Processing ${tableNames.length} tables...\x1b[0m`);

  for (const table of tableNames) {
    try {
      if (isDrop) {
        await query(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`  \x1b[31m✗\x1b[0m Dropped table \x1b[1m${table}\x1b[0m`);
      } else {
        await query(`TRUNCATE TABLE \`${table}\``);
        console.log(`  \x1b[32m✓\x1b[0m Emptied table \x1b[1m${table}\x1b[0m`);
      }
    } catch (err) {
      console.warn(`  \x1b[33m!\x1b[0m Error on table ${table}: ${err.message}. Retrying with DELETE...`);
      try {
        await query(`DELETE FROM \`${table}\``);
        console.log(`  \x1b[32m✓\x1b[0m Cleared table \x1b[1m${table}\x1b[0m using DELETE`);
      } catch (delErr) {
        console.error(`  \x1b[31m✗ Failed:\x1b[0m ${delErr.message}`);
      }
    }
  }

  console.log('\n\x1b[34m[3/3] Re-enabling foreign key constraints...\x1b[0m');
  await query('SET FOREIGN_KEY_CHECKS = 1');

  if (isDrop) {
    console.log('\n\x1b[35m[Re-creating] Reinitializing empty database schemas...\x1b[0m');
    await initializeDatabaseSchema();
    console.log('\x1b[32m✅ Database tables re-created empty.\x1b[0m');
  } else if (isReset) {
    console.log('\n\x1b[35m[Re-seeding] Reinitializing database schema and admin credentials...\x1b[0m');
    await initializeDatabaseSchema();
    await seedDatabase();
    console.log('\x1b[32m✅ Database schema and seed data successfully restored.\x1b[0m');
  } else {
    console.log('\n\x1b[32m✅ All tables wiped successfully. Tables are now completely empty.\x1b[0m');
  }

  console.log('\n\x1b[36m=========================================\x1b[0m');
  console.log('\x1b[32mDatabase wipe operation completed.\x1b[0m\n');

  await (await getPool()).end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('\n\x1b[31mDatabase wipe failed:\x1b[0m', err);
  try {
    await query('SET FOREIGN_KEY_CHECKS = 1');
    await (await getPool()).end();
  } catch {}
  process.exit(1);
});
