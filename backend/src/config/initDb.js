import { getPool, query } from './database.js';
import {
  initialFarmers,
  initialTanks,
  initialSubmissions,
  initialHarvests,
  initialAgents,
  initialIncharges,
  initialRegions,
  authUsers,
} from '../data/seedData.js';

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
        review_notes TEXT,
        submitted_ago VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

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

    console.log('\x1b[32m[Database Init]\x1b[0m All MySQL tables verified/created successfully');

    // Seed users if empty
    const usersCount = await query('SELECT COUNT(*) as count FROM users');
    if (usersCount[0].count === 0) {
      console.log('\x1b[33m[Database Seed]\x1b[0m Seeding default users...');
      for (const u of authUsers) {
        await query(
          'INSERT INTO users (id, name, role, username, phone, email, password, locality, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [u.id, u.name, u.role, u.username, u.phone, u.email || null, u.password, u.locality || null, u.region || null]
        );
      }
    }

    // Seed regions if empty
    const regionsCount = await query('SELECT COUNT(*) as count FROM regions');
    if (regionsCount[0].count === 0) {
      console.log('\x1b[33m[Database Seed]\x1b[0m Seeding default regions...');
      for (const r of initialRegions) {
        await query(
          'INSERT INTO regions (id, name, active_ponds, total_yield, avg_fcr) VALUES (?, ?, ?, ?, ?)',
          [r.id, r.name, r.activePonds || 0, r.totalYield || '0', r.avgFCR || 1.15]
        );
      }
    }

    // Seed incharges if empty
    const inchargesCount = await query('SELECT COUNT(*) as count FROM incharges');
    if (inchargesCount[0].count === 0) {
      console.log('\x1b[33m[Database Seed]\x1b[0m Seeding default incharges...');
      for (const inc of initialIncharges) {
        await query(
          'INSERT INTO incharges (id, name, region_id, email, phone) VALUES (?, ?, ?, ?, ?)',
          [inc.id, inc.name, inc.regionId || null, inc.email || null, inc.phone || null]
        );
      }
    }

    // Seed agents if empty
    const agentsCount = await query('SELECT COUNT(*) as count FROM agents');
    if (agentsCount[0].count === 0) {
      console.log('\x1b[33m[Database Seed]\x1b[0m Seeding default agents...');
      for (const a of initialAgents) {
        await query(
          'INSERT INTO agents (id, name, phone, incharge_id, status, locality, active_ponds) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [a.id, a.name, a.phone || null, a.inchargeId || null, a.status || 'ACTIVE', a.locality || null, a.activePonds || 0]
        );
      }
    }

    // Seed farmers if empty
    const farmersCount = await query('SELECT COUNT(*) as count FROM farmers');
    if (farmersCount[0].count === 0) {
      console.log('\x1b[33m[Database Seed]\x1b[0m Seeding default farmers...');
      for (const f of initialFarmers) {
        await query(
          'INSERT INTO farmers (id, name, status, agent_id, incharge_id, assigned_to, assigned_by, phone, location, water_source, acres) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [f.id, f.name, f.status || 'ACTIVE', f.agentId || null, f.inchargeId || null, f.assignedTo || null, f.assignedBy || null, f.phone || null, f.location || null, f.waterSource || null, f.acres || 0]
        );
      }
    }

    // Seed tanks if empty
    const tanksCount = await query('SELECT COUNT(*) as count FROM tanks');
    if (tanksCount[0].count === 0) {
      console.log('\x1b[33m[Database Seed]\x1b[0m Seeding default tanks...');
      for (const t of initialTanks) {
        await query(
          'INSERT INTO tanks (id, name, farmer_id, agent_id, incharge_id, assigned_to, status, test_status, abw, biomass, fcr, last_test, next_test, size, doc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [t.id, t.name, t.farmerId, t.agentId || null, t.inchargeId || null, t.assignedTo || null, t.status || 'ACTIVE', t.testStatus || 'Due', t.abw || null, t.biomass || null, t.fcr || null, t.lastTest || null, t.nextTest || null, t.size || null, t.doc || 0]
        );
      }
    }

    console.log('\x1b[32m[Database Seed]\x1b[0m Seeding verification complete.');
    return true;
  } catch (error) {
    console.error('\x1b[31m[Database Init Error]\x1b[0m', error.message);
    return false;
  }
};
