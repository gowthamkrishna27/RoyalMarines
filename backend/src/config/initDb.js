import bcrypt from 'bcryptjs';
import { getPool, query } from './database.js';

export const initializeDatabaseSchema = async () => {
  try {
    console.log('\x1b[36m[Database Init]\x1b[0m Checking tables schema in MySQL...');

    // 1. Users Table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        username VARCHAR(100) UNIQUE,
        phone VARCHAR(50),
        email VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        locality VARCHAR(100),
        region VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Regions Table
    await query(`
      CREATE TABLE IF NOT EXISTS regions (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        active_ponds INT DEFAULT 0,
        total_yield VARCHAR(50),
        avg_fcr DECIMAL(4, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Incharges Table
    await query(`
      CREATE TABLE IF NOT EXISTS incharges (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        region_id VARCHAR(50),
        email VARCHAR(255),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Agents Table
    await query(`
      CREATE TABLE IF NOT EXISTS agents (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        incharge_id VARCHAR(50),
        status VARCHAR(50) DEFAULT 'ACTIVE',
        locality VARCHAR(100),
        active_ponds INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Farmers Table
    await query(`
      CREATE TABLE IF NOT EXISTS farmers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        agent_id VARCHAR(50),
        incharge_id VARCHAR(50),
        assigned_to VARCHAR(50),
        assigned_by VARCHAR(50),
        phone VARCHAR(50),
        location VARCHAR(255),
        water_source VARCHAR(100),
        acres DECIMAL(6, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Tanks / Ponds Table
    await query(`
      CREATE TABLE IF NOT EXISTS tanks (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        farmer_id VARCHAR(50) NOT NULL,
        agent_id VARCHAR(50),
        incharge_id VARCHAR(50),
        assigned_to VARCHAR(50),
        status VARCHAR(50) DEFAULT 'ACTIVE',
        test_status VARCHAR(50) DEFAULT 'Due',
        abw VARCHAR(50),
        biomass VARCHAR(50),
        fcr VARCHAR(50),
        last_test VARCHAR(100),
        next_test VARCHAR(100),
        size VARCHAR(50),
        doc INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Submissions Table
    await query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id VARCHAR(50) PRIMARY KEY,
        agent_id VARCHAR(50),
        farmer_id VARCHAR(50),
        tank_id VARCHAR(50),
        test_type VARCHAR(100),
        date VARCHAR(50),
        status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
        data JSON,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        locality VARCHAR(255),
        review_notes TEXT,
        submitted_ago VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure coordinates columns exist on existing table
    try {
      const existingCols = await query('DESCRIBE submissions');
      const colNames = existingCols.map((c) => c.Field);
      if (!colNames.includes('latitude')) {
        await query('ALTER TABLE submissions ADD COLUMN latitude DECIMAL(10, 8) NULL AFTER data');
      }
      if (!colNames.includes('longitude')) {
        await query('ALTER TABLE submissions ADD COLUMN longitude DECIMAL(11, 8) NULL AFTER latitude');
      }
      if (!colNames.includes('locality')) {
        await query('ALTER TABLE submissions ADD COLUMN locality VARCHAR(255) NULL AFTER longitude');
      }
    } catch {
      // Ignore if columns already added
    }

    // 8. Harvests Table
    await query(`
      CREATE TABLE IF NOT EXISTS harvests (
        id VARCHAR(50) PRIMARY KEY,
        tank_id VARCHAR(50) NOT NULL,
        farmer_id VARCHAR(50),
        date VARCHAR(50),
        quantity_kg DECIMAL(10, 2),
        count_per_kg INT,
        quality VARCHAR(50),
        price_per_kg DECIMAL(10, 2),
        revenue DECIMAL(12, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('\x1b[32m[Database Init]\x1b[0m All MySQL tables verified/created successfully.');
    return true;
  } catch (error) {
    console.error('\x1b[31m[Database Init Error]\x1b[0m', error.message);
    return false;
  }
};

/**
 * Explicit database seed function.
 * ONLY called when explicitly requested (e.g. npm run db:seed or db:reset).
 * Never run automatically on server boot.
 */
export const seedDatabase = async () => {
  try {
    console.log('\x1b[33m[Database Seed]\x1b[0m Explicit seeding requested...');
    const [existing] = await query('SELECT id FROM users WHERE id = "ADM001" LIMIT 1');
    if (!existing) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await query(
        'INSERT INTO users (id, name, role, username, phone, email, password, locality, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['ADM001', 'Executive Administrator', 'ADMIN', 'ADM001', '9999999999', 'admin@royalsmarine.com', hashedPassword, null, null]
      );
    }
    console.log('\x1b[32m[Database Seed]\x1b[0m Explicit seeding completed successfully.');
    return true;
  } catch (error) {
    console.error('\x1b[31m[Database Seed Error]\x1b[0m', error.message);
    return false;
  }
};

/**
 * Synchronize all agents and incharges into the users table.
 * Ensures agents and incharges are visible in the users table and can log in with 4-digit PIN '1234'.
 */
export const syncAgentsAndInchargesToUsers = async () => {
  try {
    const defaultPinHash = await bcrypt.hash('1234', 10);

    // 1. Sync Agents -> Users
    const agents = await query('SELECT * FROM agents');
    for (const a of agents) {
      const existing = await query('SELECT id FROM users WHERE id = ? OR username = ? LIMIT 1', [a.id, a.id]);
      if (!existing || existing.length === 0) {
        const email = `${a.id.toLowerCase()}@royalsmarine.com`;
        await query(
          'INSERT INTO users (id, name, role, username, phone, email, password, locality, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [a.id, a.name, 'AGENT', a.id, a.phone || null, email, defaultPinHash, a.locality || null, 'Bhimavaram']
        );
        console.log(`\x1b[32m[User Sync]\x1b[0m Added Agent ${a.id} (${a.name}) into users table.`);
      } else {
        await query(
          'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), locality = COALESCE(?, locality), role = ? WHERE id = ?',
          [a.name, a.phone, a.locality, 'AGENT', a.id]
        );
      }
    }

    // 2. Sync Incharges -> Users
    const incharges = await query('SELECT * FROM incharges');
    for (const inc of incharges) {
      const existing = await query('SELECT id FROM users WHERE id = ? OR username = ? LIMIT 1', [inc.id, inc.id]);
      if (!existing || existing.length === 0) {
        const email = inc.email || `${inc.id.toLowerCase()}@royalsmarine.com`;
        await query(
          'INSERT INTO users (id, name, role, username, phone, email, password, locality, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [inc.id, inc.name, 'ASM', inc.id, inc.phone || null, email, defaultPinHash, null, inc.region_id || 'Bhimavaram']
        );
        console.log(`\x1b[32m[User Sync]\x1b[0m Added Incharge ${inc.id} (${inc.name}) into users table.`);
      } else {
        await query(
          'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), email = COALESCE(?, email), role = ? WHERE id = ?',
          [inc.name, inc.phone, inc.email, 'ASM', inc.id]
        );
      }
    }
  } catch (err) {
    console.error('\x1b[31m[User Sync Error]\x1b[0m Failed syncing agents and incharges to users:', err.message);
  }
};
