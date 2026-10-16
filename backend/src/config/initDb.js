import bcrypt from 'bcryptjs';
import { getPool, query } from './database.js';

export const initializeDatabaseSchema = async () => {
  try {

    // 1. Concurrent Table Verifications
    await Promise.all([
      query(`
        CREATE TABLE IF NOT EXISTS roles (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(30) NOT NULL UNIQUE,
          description VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `),
      query(`
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
      `),
      query(`
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
      `),
      query(`
        CREATE TABLE IF NOT EXISTS localities (
          id VARCHAR(50) PRIMARY KEY,
          region_id VARCHAR(50) NOT NULL,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_reg (region_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `),
      query(`
        CREATE TABLE IF NOT EXISTS incharges (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          user_id VARCHAR(50) NULL,
          region_id VARCHAR(50) NULL,
          email VARCHAR(255),
          phone VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `),
      query(`
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
      `),
      query(`
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
      `),
      query(`
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
      `),
      query(`
        CREATE TABLE IF NOT EXISTS submissions (
          id VARCHAR(50) PRIMARY KEY,
          agent_id VARCHAR(50),
          user_id VARCHAR(50),
          user_name VARCHAR(100),
          role VARCHAR(50),
          farmer_id VARCHAR(50),
          tank_id VARCHAR(50),
          test_type VARCHAR(100),
          date VARCHAR(50),
          submission_time VARCHAR(50),
          status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
          data JSON,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          accuracy DECIMAL(8, 2),
          locality VARCHAR(255),
          review_notes TEXT,
          submitted_ago VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `),
      query(`
        CREATE TABLE IF NOT EXISTS harvests (
          id VARCHAR(50) PRIMARY KEY,
          culture_cycle_id VARCHAR(50) NULL,
          harvest_code VARCHAR(50) NULL,
          tank_id VARCHAR(50) NULL,
          farmer_id VARCHAR(50) NULL,
          date VARCHAR(50) NULL,
          harvest_date DATE NULL,
          harvest_type VARCHAR(50) DEFAULT 'FINAL',
          doc INT NULL,
          abw VARCHAR(20) NULL,
          harvested_number INT NULL,
          harvested_biomass DECIMAL(14, 2) NULL,
          total_harvested_seed BIGINT NULL,
          total_biomass_kg DECIMAL(14, 2) NULL,
          total_feed_kg DECIMAL(14, 2) NULL,
          fcr DECIMAL(5, 2) NULL,
          buyer_name VARCHAR(150) NULL,
          remarks TEXT NULL,
          recorded_by VARCHAR(50) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `),
      query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          action VARCHAR(100),
          module VARCHAR(100),
          entity_type VARCHAR(100),
          record_id VARCHAR(50),
          entity_id VARCHAR(50),
          performed_by VARCHAR(50),
          user_id VARCHAR(50),
          ip_address VARCHAR(50),
          notes TEXT,
          details JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `)
    ]);

    // 2. Fetch existing schema columns in parallel (1 network round trip instead of 30)
    const [subCols, harvestCols, tankCols] = await Promise.all([
      query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'submissions'"),
      query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'harvests'"),
      query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tanks'"),
    ]);

    const subColSet = new Set(subCols.map((c) => c.COLUMN_NAME.toLowerCase()));
    const harvestColSet = new Set(harvestCols.map((c) => c.COLUMN_NAME.toLowerCase()));
    const tankColSet = new Set(tankCols.map((c) => c.COLUMN_NAME.toLowerCase()));

    // Submissions Column Verification
    const subColAlters = [
      { col: 'user_id', sql: 'ALTER TABLE submissions ADD COLUMN user_id VARCHAR(50) AFTER agent_id' },
      { col: 'user_name', sql: 'ALTER TABLE submissions ADD COLUMN user_name VARCHAR(100) AFTER user_id' },
      { col: 'role', sql: 'ALTER TABLE submissions ADD COLUMN role VARCHAR(50) AFTER user_name' },
      { col: 'submission_time', sql: 'ALTER TABLE submissions ADD COLUMN submission_time VARCHAR(50) AFTER date' },
      { col: 'accuracy', sql: 'ALTER TABLE submissions ADD COLUMN accuracy DECIMAL(8, 2) AFTER longitude' }
    ];
    for (const alt of subColAlters) {
      if (!subColSet.has(alt.col.toLowerCase())) {
        try { await query(alt.sql); } catch (e) { }
      }
    }

    // Harvests Column Verification
    const harvestColAlters = [
      { col: 'culture_cycle_id', sql: 'ALTER TABLE harvests ADD COLUMN culture_cycle_id VARCHAR(50) NULL' },
      { col: 'harvest_code', sql: 'ALTER TABLE harvests ADD COLUMN harvest_code VARCHAR(50) NULL' },
      { col: 'tank_id', sql: 'ALTER TABLE harvests ADD COLUMN tank_id VARCHAR(50) NULL' },
      { col: 'farmer_id', sql: 'ALTER TABLE harvests ADD COLUMN farmer_id VARCHAR(50) NULL' },
      { col: 'date', sql: 'ALTER TABLE harvests ADD COLUMN date VARCHAR(50) NULL' },
      { col: 'harvest_date', sql: 'ALTER TABLE harvests ADD COLUMN harvest_date DATE NULL' },
      { col: 'harvest_type', sql: "ALTER TABLE harvests ADD COLUMN harvest_type VARCHAR(50) DEFAULT 'FINAL'" },
      { col: 'quantity_kg', sql: 'ALTER TABLE harvests ADD COLUMN quantity_kg DECIMAL(14, 2) DEFAULT 0' },
      { col: 'count_per_kg', sql: 'ALTER TABLE harvests ADD COLUMN count_per_kg INT NULL' },
      { col: 'quality', sql: "ALTER TABLE harvests ADD COLUMN quality VARCHAR(50) DEFAULT 'A Grade'" },
      { col: 'price_per_kg', sql: 'ALTER TABLE harvests ADD COLUMN price_per_kg DECIMAL(12, 2) DEFAULT 0' },
      { col: 'revenue', sql: 'ALTER TABLE harvests ADD COLUMN revenue DECIMAL(16, 2) DEFAULT 0' },
      { col: 'total_value', sql: 'ALTER TABLE harvests ADD COLUMN total_value DECIMAL(16, 2) DEFAULT 0' },
      { col: 'buyer_name', sql: 'ALTER TABLE harvests ADD COLUMN buyer_name VARCHAR(150) NULL' },
      { col: 'remarks', sql: 'ALTER TABLE harvests ADD COLUMN remarks TEXT NULL' },
      { col: 'recorded_by', sql: 'ALTER TABLE harvests ADD COLUMN recorded_by VARCHAR(50) NULL' },
      { col: 'doc', sql: 'ALTER TABLE harvests ADD COLUMN doc INT NULL AFTER harvest_type' },
      { col: 'abw', sql: 'ALTER TABLE harvests ADD COLUMN abw VARCHAR(20) NULL AFTER doc' },
      { col: 'harvested_number', sql: 'ALTER TABLE harvests ADD COLUMN harvested_number INT NULL AFTER abw' },
      { col: 'harvested_biomass', sql: 'ALTER TABLE harvests ADD COLUMN harvested_biomass DECIMAL(14, 2) NULL AFTER harvested_number' },
      { col: 'total_harvested_seed', sql: 'ALTER TABLE harvests ADD COLUMN total_harvested_seed BIGINT NULL AFTER harvested_biomass' },
      { col: 'total_biomass_kg', sql: 'ALTER TABLE harvests ADD COLUMN total_biomass_kg DECIMAL(14, 2) NULL AFTER total_harvested_seed' },
      { col: 'total_feed_kg', sql: 'ALTER TABLE harvests ADD COLUMN total_feed_kg DECIMAL(14, 2) NULL AFTER total_biomass_kg' },
      { col: 'fcr', sql: 'ALTER TABLE harvests ADD COLUMN fcr DECIMAL(5, 2) NULL AFTER total_feed_kg' }
    ];
    for (const alt of harvestColAlters) {
      if (!harvestColSet.has(alt.col.toLowerCase())) {
        try { await query(alt.sql); } catch (e) { }
      }
    }

    // Ensure tanks table has seed_date column
    if (!tankColSet.has('seed_date')) {
      try {
        await query('ALTER TABLE tanks ADD COLUMN seed_date VARCHAR(50) NULL AFTER stocking_date');
      } catch (e) { }
    }

    // Check whether legacy harvest synchronization is needed before querying full-table updates
    const [needSync] = await query(`
      SELECT 1 FROM harvests 
      WHERE (harvested_biomass IS NULL AND quantity_kg IS NOT NULL)
         OR ((quantity_kg IS NULL OR quantity_kg = 0) AND (harvested_biomass IS NOT NULL OR total_biomass_kg IS NOT NULL))
         OR (price_per_kg IS NULL OR price_per_kg = 0)
         OR ((revenue IS NULL OR revenue = 0) AND quantity_kg > 0)
      LIMIT 1
    `);

    if (needSync) {
      try {
        await query(`
          UPDATE harvests 
          SET harvested_biomass = quantity_kg 
          WHERE harvested_biomass IS NULL AND quantity_kg IS NOT NULL
        `);
        await query(`
          UPDATE harvests 
          SET quantity_kg = CAST(REGEXP_REPLACE(COALESCE(harvested_biomass, total_biomass_kg, '0'), '[^0-9.]', '') AS DECIMAL(14, 2))
          WHERE (quantity_kg IS NULL OR quantity_kg = 0) 
            AND (harvested_biomass IS NOT NULL OR total_biomass_kg IS NOT NULL)
        `);
        await query(`
          UPDATE harvests 
          SET price_per_kg = 350
          WHERE (price_per_kg IS NULL OR price_per_kg = 0)
        `);
        await query(`
          UPDATE harvests 
          SET revenue = quantity_kg * COALESCE(price_per_kg, 350),
              total_value = quantity_kg * COALESCE(price_per_kg, 350)
          WHERE (revenue IS NULL OR revenue = 0) AND quantity_kg > 0
        `);
      } catch (e) { }
    }

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
