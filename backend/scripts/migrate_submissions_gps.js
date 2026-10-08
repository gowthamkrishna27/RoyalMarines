import { query } from '../src/config/database.js';

async function addColumnIfNotExists(tableName, columnName, columnDefinition) {
  const existing = await query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  if (!existing || existing.length === 0) {
    console.log(`Adding column ${columnName} to ${tableName}...`);
    await query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  } else {
    console.log(`Column ${columnName} already exists on ${tableName}.`);
  }
}

async function migrate() {
  try {
    await addColumnIfNotExists('submissions', 'user_id', 'VARCHAR(50) NULL');
    await addColumnIfNotExists('submissions', 'user_name', 'VARCHAR(100) NULL');
    await addColumnIfNotExists('submissions', 'role', 'VARCHAR(50) NULL');
    await addColumnIfNotExists('submissions', 'accuracy', 'DECIMAL(8,2) NULL');
    await addColumnIfNotExists('submissions', 'submission_time', 'VARCHAR(50) NULL');
    console.log('Columns processed successfully');

    await query("UPDATE submissions SET user_id = agent_id, role = 'Agent' WHERE user_id IS NULL AND agent_id IS NOT NULL");
    await query("UPDATE submissions s JOIN agents a ON s.agent_id = a.id SET s.user_name = a.name WHERE s.user_name IS NULL");
    await query("UPDATE submissions SET accuracy = 12.0 WHERE accuracy IS NULL AND latitude IS NOT NULL");
    await query("UPDATE submissions SET submission_time = DATE_FORMAT(created_at, '%h:%i %p') WHERE submission_time IS NULL");
    console.log('Backfill successful');

    const cols = await query('DESCRIBE submissions');
    console.log('NEW SCHEMA:', cols.map(c => c.Field));
    const sample = await query('SELECT id, user_id, user_name, role, latitude, longitude, accuracy, date, submission_time, created_at FROM submissions LIMIT 3');
    console.log('SAMPLE:', JSON.stringify(sample, null, 2));
  } catch (err) {
    console.error('Migration error:', err);
  }
  process.exit(0);
}

migrate();
