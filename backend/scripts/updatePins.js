import bcrypt from 'bcryptjs';
import { query, checkDatabaseConnection, getPool } from '../src/config/database.js';

async function main() {
  await checkDatabaseConnection();
  const hash = await bcrypt.hash('1234', 10);
  console.log('Generated bcrypt hash for 4-digit PIN "1234":', hash);

  await query(`
    INSERT INTO users (id, username, password, password_hash, name, full_name, role, role_id, phone, email, locality, region, status)
    VALUES ('ADM001', 'ADM001', ?, ?, 'System Administrator', 'System Administrator', 'ADMIN', 1, '9999999990', 'admin2@royalsmarine.com', 'HQ', 'Headquarters', 'ACTIVE')
    ON DUPLICATE KEY UPDATE password=VALUES(password), password_hash=VALUES(password_hash)
  `, [hash, hash]);

  const res = await query(
    `UPDATE users SET password = ?, password_hash = ? WHERE 1=1`,
    [hash, hash]
  );
  console.log('✅ Successfully updated all user accounts to 4-digit PIN 1234. Affected rows:', res.affectedRows);

  const users = await query('SELECT id, name, username, role, phone FROM users');
  console.table(users);

  await (await getPool()).end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
