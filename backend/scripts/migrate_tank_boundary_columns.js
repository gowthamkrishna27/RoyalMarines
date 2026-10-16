import { query, getPool } from '../src/config/database.js';
import fs from 'fs';
import path from 'path';

async function addColumnIfNotExists(tableName, columnName, columnDefinition) {
  const existing = await query(
    `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  if (!existing || existing.length === 0) {
    console.log(`Adding column ${columnName} to ${tableName}...`);
    await query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
    console.log(`✅ Successfully added column ${columnName} to ${tableName}.`);
  } else {
    console.log(`Column ${columnName} already exists on ${tableName} (${existing[0].DATA_TYPE}).`);
  }
}

async function verifyZeroDataLoss(beforeBackupPath) {
  console.log('\n--- Verifying Zero Data Loss against Pre-Migration Backup ---');
  if (!fs.existsSync(beforeBackupPath)) {
    throw new Error(`Backup file not found at ${beforeBackupPath}`);
  }
  const preBackup = JSON.parse(fs.readFileSync(beforeBackupPath, 'utf8'));
  const currentTanks = await query('SELECT * FROM tanks ORDER BY id ASC');

  if (currentTanks.length !== preBackup.length) {
    throw new Error(`Record count mismatch! Expected ${preBackup.length}, got ${currentTanks.length}`);
  }
  console.log(`✅ Record count matches: exactly ${currentTanks.length} tanks present.`);

  let allMatch = true;
  for (let i = 0; i < preBackup.length; i++) {
    const pre = preBackup[i];
    const post = currentTanks.find(t => t.id === pre.id);
    if (!post) {
      console.error(`❌ Missing tank ID: ${pre.id}`);
      allMatch = false;
      continue;
    }
    // Compare all pre-existing keys
    for (const key of Object.keys(pre)) {
      const valPre = pre[key] instanceof Date ? pre[key].toISOString() : String(pre[key]);
      const valPost = post[key] instanceof Date ? post[key].toISOString() : String(post[key]);
      if (valPre !== valPost) {
        console.error(`❌ Mismatch on tank ${pre.id} field ${key}: Pre='${valPre}', Post='${valPost}'`);
        allMatch = false;
      }
    }
    // Check that new columns are initially NULL
    const newCols = ['boundary_coordinates', 'boundary_method', 'boundary_area_acres', 'boundary_quality', 'boundary_captured_at'];
    for (const ncol of newCols) {
      if (post[ncol] !== null && post[ncol] !== undefined) {
        console.warn(`Note: Tank ${pre.id} has non-null value for ${ncol}:`, post[ncol]);
      }
    }
  }

  if (allMatch) {
    console.log('✅ ZERO DATA LOSS VERIFIED: All existing tank records, fields, and values are 100% intact.');
  } else {
    throw new Error('Verification failed: Data differences detected between pre-migration and post-migration state.');
  }
}

async function migrate() {
  try {
    console.log('Starting safe, additive migration for tank boundary columns...');
    
    // Ensure table exists
    const tables = await query("SHOW TABLES LIKE 'tanks'");
    if (tables.length === 0) {
      throw new Error("Target table 'tanks' does not exist!");
    }

    const backupPath = 'c:/Users/chora/.gemini/antigravity-ide/brain/525be80a-1021-4f2b-a4c0-85ea75d54dde/scratch/tanks_backup_before_migration.json';

    // 1. Additive column additions
    await addColumnIfNotExists('tanks', 'boundary_coordinates', 'JSON NULL');
    await addColumnIfNotExists('tanks', 'boundary_method', 'VARCHAR(50) NULL');
    await addColumnIfNotExists('tanks', 'boundary_area_acres', 'DECIMAL(10,4) NULL');
    await addColumnIfNotExists('tanks', 'boundary_quality', 'VARCHAR(50) NULL');
    await addColumnIfNotExists('tanks', 'boundary_captured_at', 'DATETIME NULL');

    // 2. Inspect new schema
    console.log('\n--- Inspecting Updated tanks Schema ---');
    const cols = await query("SHOW FULL COLUMNS FROM tanks WHERE Field LIKE 'boundary_%'");
    console.table(cols.map(c => ({
      Field: c.Field,
      Type: c.Type,
      Null: c.Null,
      Default: c.Default
    })));

    // 3. Verify zero data loss against backup
    await verifyZeroDataLoss(backupPath);

    console.log('\n✅ Migration completed successfully with zero data loss.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
