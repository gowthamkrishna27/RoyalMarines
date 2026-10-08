import database from '../src/config/database.js';

async function main() {
  await database.checkDatabaseConnection();
  const tables = await database.query('SHOW TABLES');
  const tKey = Object.keys(tables[0])[0];
  console.log('=== TABLES IN DATABASE ===');
  for (const t of tables) {
    const tableName = t[tKey];
    const countRes = await database.query(`SELECT COUNT(*) as cnt FROM ${tableName}`);
    const cols = await database.query(`DESCRIBE ${tableName}`);
    console.log(`\nTable: ${tableName} (${countRes[0].cnt} rows)`);
    console.log('Columns:', cols.map(c => `${c.Field} (${c.Type}${c.Null === 'NO' ? ', NOT NULL' : ''}${c.Key ? `, ${c.Key}` : ''})`).join(', '));
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
