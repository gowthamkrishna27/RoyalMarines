import bcrypt from 'bcryptjs';
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

    console.log('\x1b[32m[Database Init]\x1b[0m All MySQL tables verified/created successfully');

    // Seed users if empty, or ensure all default authUsers exist
    console.log('\x1b[33m[Database Seed]\x1b[0m Ensuring all default authUsers exist with hashed credentials...');
    const SALT_ROUNDS = 10;
    for (const u of authUsers) {
      const existing = await query('SELECT id, password FROM users WHERE id = ? OR username = ? LIMIT 1', [u.id, u.username]);
      if (!existing || existing.length === 0) {
        const hashedPassword = await bcrypt.hash(u.password, SALT_ROUNDS);
        await query(
          'INSERT INTO users (id, name, role, username, phone, email, password, locality, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [u.id, u.name, u.role, u.username, u.phone, u.email || null, hashedPassword, u.locality || null, u.region || null]
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

    // Synchronize all agents and incharges into users table
    await syncAgentsAndInchargesToUsers();

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

    // Ensure agent-assigned farmers also have tanks
    const agentFarmers = await query("SELECT id, name, agent_id, incharge_id FROM farmers WHERE agent_id IS NOT NULL");
    for (const f of agentFarmers) {
      const [existing] = await query('SELECT COUNT(*) as c FROM tanks WHERE farmer_id = ?', [f.id]);
      if (existing.c === 0) {
        const t1Id = `T_${f.id}_1`;
        const t2Id = `T_${f.id}_2`;
        await query(
          'INSERT IGNORE INTO tanks (id, name, farmer_id, agent_id, incharge_id, assigned_to, status, test_status, abw, biomass, fcr, last_test, next_test, size, doc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [t1Id, 'Tank 1', f.id, f.agent_id, f.incharge_id, 'Agent', 'ACTIVE', 'Due', '14.5g', '950kg', '1.14', '24 Aug 2026', '31 Aug 2026', '10 Acres', 45]
        );
        await query(
          'INSERT IGNORE INTO tanks (id, name, farmer_id, agent_id, incharge_id, assigned_to, status, test_status, abw, biomass, fcr, last_test, next_test, size, doc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [t2Id, 'Tank 2', f.id, f.agent_id, f.incharge_id, 'Agent', 'ACTIVE', 'Completed', '18.2g', '1200kg', '1.16', '26 Aug 2026', '02 Sep 2026', '12 Acres', 58]
        );
      }
    }

    // Seed submissions if empty
    const subsCount = await query('SELECT COUNT(*) as count FROM submissions');
    if (subsCount[0].count === 0) {
      console.log('\x1b[33m[Database Seed]\x1b[0m Seeding sample test submissions for reports...');
      const sampleSubs = [
        {
          id: 'SUB101',
          agent_id: 'agent001',
          farmer_id: 'F002',
          tank_id: 'T_F002_1',
          test_type: 'Water Quality Analysis',
          date: '2026-08-28',
          status: 'VERIFIED',
          data: { waterQuality: { do: '5.8', ph: '7.9', salinity: '15 ppt', alkalinity: '125', ammonia: '0.01' }, biomass: '920kg', fcr: '1.14' },
          submitted_ago: '2 days ago',
        },
        {
          id: 'SUB102',
          agent_id: 'agent002',
          farmer_id: 'F001',
          tank_id: 'T_F001_1',
          test_type: 'Feed Test',
          date: '2026-08-27',
          status: 'VERIFIED',
          data: { feedType: 'Hypro+ Premium Starter', morningQty: '45kg', noonQty: '40kg', eveningQty: '45kg', feedTrayCheck: '85% consumed', fcr: '1.16', biomass: '1150kg' },
          submitted_ago: '3 days ago',
        },
        {
          id: 'SUB103',
          agent_id: 'agent003',
          farmer_id: 'F004',
          tank_id: 'T_F004_1',
          test_type: 'Weekly Sampling',
          date: '2026-08-26',
          status: 'VERIFIED',
          data: { abw: '18.5g', count: '54', biomass: '1240kg', survival: '92%', fcr: '1.15' },
          submitted_ago: '4 days ago',
        },
        {
          id: 'SUB104',
          agent_id: 'agent001',
          farmer_id: 'F002',
          tank_id: 'T_F002_2',
          test_type: 'Disease Observation',
          date: '2026-08-25',
          status: 'FLAGGED',
          data: { gutContent: 'Clear', gillStatus: 'Normal', shellHardness: 'Firm', notes: 'Slight cloudy water, suggested zeolite application' },
          submitted_ago: '5 days ago',
        },
        {
          id: 'SUB105',
          agent_id: 'agent002',
          farmer_id: 'F001',
          tank_id: 'T_F001_2',
          test_type: 'Water Quality Analysis',
          date: '2026-08-24',
          status: 'VERIFIED',
          data: { waterQuality: { do: '5.4', ph: '8.1', salinity: '14 ppt', alkalinity: '130', ammonia: '0.02' }, biomass: '870kg', fcr: '1.18' },
          submitted_ago: '6 days ago',
        },
        {
          id: 'SUB106',
          agent_id: 'agent001',
          farmer_id: 'F101',
          tank_id: 'T101',
          test_type: 'Water Quality Analysis',
          date: '2026-08-23',
          status: 'VERIFIED',
          data: { waterQuality: { do: '6.2', ph: '7.8', salinity: '16 ppt', alkalinity: '120', ammonia: '0.01' }, biomass: '3200kg', fcr: '1.16' },
          submitted_ago: '1 week ago',
        },
        {
          id: 'SUB107',
          agent_id: 'agent002',
          farmer_id: 'F102',
          tank_id: 'T103',
          test_type: 'Weekly Sampling',
          date: '2026-08-22',
          status: 'VERIFIED',
          data: { abw: '21.8g', count: '46', biomass: '2800kg', survival: '89%', fcr: '1.18' },
          submitted_ago: '1 week ago',
        },
        {
          id: 'SUB108',
          agent_id: 'agent003',
          farmer_id: 'F103',
          tank_id: 'T105',
          test_type: 'Water Quality Analysis',
          date: '2026-08-21',
          status: 'PENDING_VERIFICATION',
          data: { waterQuality: { do: '4.8', ph: '8.3', salinity: '18 ppt', alkalinity: '140', ammonia: '0.05' }, biomass: '3600kg', fcr: '1.20' },
          submitted_ago: '1 week ago',
        },
        {
          id: 'SUB109',
          agent_id: 'agent004',
          farmer_id: 'F005',
          tank_id: 'T_F005_1',
          test_type: 'Farm Activity',
          date: '2026-08-20',
          status: 'VERIFIED',
          data: { activity: 'Probiotic Application', product: 'AquaPro 500g', waterExchange: '5%' },
          submitted_ago: '2 weeks ago',
        },
        {
          id: 'SUB110',
          agent_id: 'agent001',
          farmer_id: 'F002',
          tank_id: 'T_F002_1',
          test_type: 'Feed Test',
          date: '2026-08-19',
          status: 'VERIFIED',
          data: { feedType: 'Hypro+ Grower', morningQty: '50kg', noonQty: '50kg', eveningQty: '50kg', feedTrayCheck: '95% consumed', fcr: '1.12' },
          submitted_ago: '2 weeks ago',
        },
        {
          id: 'SUB111',
          agent_id: 'agent005',
          farmer_id: 'F104',
          tank_id: 'T107',
          test_type: 'Water Quality Analysis',
          date: '2026-08-18',
          status: 'VERIFIED',
          data: { waterQuality: { do: '5.6', ph: '7.7', salinity: '15 ppt', alkalinity: '125', ammonia: '0.02' }, biomass: '2400kg', fcr: '1.15' },
          submitted_ago: '2 weeks ago',
        },
        {
          id: 'SUB112',
          agent_id: 'agent003',
          farmer_id: 'F004',
          tank_id: 'T_F004_1',
          test_type: 'Water Quality Analysis',
          date: '2026-08-17',
          status: 'VERIFIED',
          data: { waterQuality: { do: '5.9', ph: '7.9', salinity: '14 ppt', alkalinity: '128', ammonia: '0.01' }, biomass: '1180kg', fcr: '1.14' },
          submitted_ago: '2 weeks ago',
        }
      ];

      for (const s of sampleSubs) {
        await query(
          'INSERT IGNORE INTO submissions (id, agent_id, farmer_id, tank_id, test_type, date, status, data, submitted_ago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [s.id, s.agent_id, s.farmer_id, s.tank_id, s.test_type, s.date, s.status, JSON.stringify(s.data), s.submitted_ago]
        );
      }
    }

    // Seed harvests if empty
    const harvestsCount = await query('SELECT COUNT(*) as count FROM harvests');
    if (harvestsCount[0].count === 0) {
      console.log('\x1b[33m[Database Seed]\x1b[0m Seeding sample harvests...');
      const sampleHarvests = [
        {
          id: 'HARV001',
          tank_id: 'T104',
          farmer_id: 'F102',
          date: '2026-08-15',
          quantity_kg: 2100,
          count_per_kg: 48,
          quality: 'Grade A',
          price_per_kg: 390,
          revenue: 819000,
        },
        {
          id: 'HARV002',
          tank_id: 'T101',
          farmer_id: 'F101',
          date: '2026-08-20',
          quantity_kg: 3200,
          count_per_kg: 36,
          quality: 'Grade A',
          price_per_kg: 420,
          revenue: 1344000,
        },
      ];

      for (const h of sampleHarvests) {
        await query(
          'INSERT IGNORE INTO harvests (id, tank_id, farmer_id, date, quantity_kg, count_per_kg, quality, price_per_kg, revenue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [h.id, h.tank_id, h.farmer_id, h.date, h.quantity_kg, h.count_per_kg, h.quality, h.price_per_kg, h.revenue]
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
