import bcrypt from 'bcryptjs';
import { getPool, query } from './database.js';

export const initializeDatabaseSchema = async () => {
  try {

    // 1. Roles Table
    await query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(30) NOT NULL UNIQUE,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Users Table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        password_hash VARCHAR(255),
        name VARCHAR(255),
        full_name VARCHAR(255),
        role VARCHAR(50),
        role_id INT UNSIGNED,
        phone VARCHAR(50),
        email VARCHAR(255),
        locality VARCHAR(150),
        region VARCHAR(100),
        status VARCHAR(50) DEFAULT 'ACTIVE',
        last_login_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Regions Table
    await query(`
      CREATE TABLE IF NOT EXISTS regions (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(50),
        name VARCHAR(100) NOT NULL,
        active_ponds INT DEFAULT 0,
        total_yield VARCHAR(50),
        avg_fcr DECIMAL(4, 2),
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Incharges Table
    await query(`
      CREATE TABLE IF NOT EXISTS incharges (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        user_id VARCHAR(50) NULL,
        region_id VARCHAR(50) NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Agents Table
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

    // 6. Farmers Table
    await query(`
      CREATE TABLE IF NOT EXISTS farmers (
        id VARCHAR(50) PRIMARY KEY,
        farmer_code VARCHAR(50),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        alternate_phone VARCHAR(50),
        address TEXT,
        village VARCHAR(100),
        mandal VARCHAR(100),
        district VARCHAR(100),
        state VARCHAR(100),
        location VARCHAR(255),
        latitude DECIMAL(10, 7),
        longitude DECIMAL(10, 7),
        acres DECIMAL(10, 2),
        total_acres DECIMAL(10, 2),
        water_source VARCHAR(100),
        agent_id VARCHAR(50),
        incharge_id VARCHAR(50),
        assigned_to VARCHAR(50),
        assigned_by VARCHAR(50),
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Tanks / Ponds Table
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
        size VARCHAR(50),
        acres VARCHAR(50),
        area_acres DECIMAL(10, 2),
        doc INT DEFAULT 0,
        last_test VARCHAR(100),
        next_test VARCHAR(100),
        salinity VARCHAR(50),
        species VARCHAR(100),
        water_source VARCHAR(100),
        culture_type VARCHAR(100),
        stocking_date VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. Submissions Table
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

    // 9. Harvests Table
    await query(`
      CREATE TABLE IF NOT EXISTS harvests (
        id VARCHAR(50) PRIMARY KEY,
        culture_cycle_id VARCHAR(50) NULL,
        harvest_code VARCHAR(50) NULL,
        tank_id VARCHAR(50) NULL,
        farmer_id VARCHAR(50) NULL,
        date VARCHAR(50) NULL,
        harvest_date DATE NULL,
        harvest_type VARCHAR(50) DEFAULT 'FINAL',
        quantity_kg DECIMAL(14, 2) NULL,
        count_per_kg INT NULL,
        quality VARCHAR(50) NULL,
        price_per_kg DECIMAL(12, 2) NULL,
        revenue DECIMAL(16, 2) NULL,
        total_value DECIMAL(16, 2) NULL,
        buyer_name VARCHAR(150) NULL,
        remarks TEXT NULL,
        recorded_by VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('\x1b[32m[Database Init]\x1b[0m All MySQL tables verified successfully.');
    return true;
  } catch (error) {
    console.error('\x1b[31m[Database Init Error]\x1b[0m', error.message);
    return false;
  }
};

export const seedDatabase = async () => {
  try {
    console.log('\x1b[33m[Database Seed]\x1b[0m Explicit seeding requested...');
    const defaultPinHash = await bcrypt.hash('1234', 10);
    const [existing] = await query('SELECT id FROM users WHERE id = "ADM001" OR username = "admin" LIMIT 1');
    if (!existing) {
      await query(
        `INSERT INTO users (id, name, full_name, role, role_id, username, phone, email, password, password_hash, locality, region, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        ['ADM001', 'System Administrator', 'System Administrator', 'ADMIN', 1, 'admin', '9999999999', 'admin@royalsmarine.com', defaultPinHash, defaultPinHash, 'HQ', 'Headquarters']
      );
    }
    console.log('\x1b[32m[Database Seed]\x1b[0m Seeding completed successfully.');
    return true;
  } catch (error) {
    console.error('\x1b[31m[Database Seed Error]\x1b[0m', error.message);
    return false;
  }
};
