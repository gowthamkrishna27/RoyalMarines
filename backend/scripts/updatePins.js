import bcrypt from 'bcryptjs';
import { query, checkDatabaseConnection, getPool } from '../src/config/database.js';

async function main() {
  await checkDatabaseConnection();
  const hash = await bcrypt.hash('1234', 10);
  console.log('Generated bcrypt hash for 4-digit PIN "1234":', hash);

  const res = await query(
    `UPDATE users SET password = ? WHERE role = 'AGENT' OR role = 'ASM' OR role = 'INCHARGE' OR id IN ('agent001', 'agent002', 'INC001')`,
    [hash]
  );
  console.log('✅ Successfully updated Agent and ASM accounts to 4-digit PIN 1234. Affected rows:', res.affectedRows);

  const users = await query('SELECT id, name, role, username, phone FROM users');
  console.table(users);

  await (await getPool()).end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
