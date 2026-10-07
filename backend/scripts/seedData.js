import bcrypt from 'bcryptjs';
import { query, checkDatabaseConnection, getPool } from '../src/config/database.js';

async function main() {
  console.log('\n\x1b[36m=====================================================\x1b[0m');
  console.log('\x1b[1;36m  Royals Marine - Complete Schema Alignment & Seeding \x1b[0m');
  console.log('\x1b[36m=====================================================\x1b[0m\n');

  const status = await checkDatabaseConnection();
  if (!status.success) {
    console.error('Cannot connect to database:', status.error);
    process.exit(1);
  }

  // 1. Disable foreign keys
  await query('SET FOREIGN_KEY_CHECKS = 0');
  console.log('✓ Foreign keys disabled');

  // 2. Drop all foreign key constraints so column types can be altered freely
  const fks = await query(`
    SELECT TABLE_NAME, CONSTRAINT_NAME
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  `);

  for (const fk of fks) {
    try {
      await query(`ALTER TABLE \`${fk.TABLE_NAME}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
      console.log(`  - Dropped FK ${fk.CONSTRAINT_NAME} from ${fk.TABLE_NAME}`);
    } catch (e) {
      // Ignore if already dropped
    }
  }

  // 3. Ensure ROLES table
  await query(`
    CREATE TABLE IF NOT EXISTS roles (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(30) NOT NULL UNIQUE,
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await query(`
    INSERT INTO roles (id, name, description) VALUES
      (1, 'ADMIN', 'Executive System Administrator'),
      (2, 'INCHARGE', 'Area Sales Manager (ASM)'),
      (3, 'TECHNICIAN', 'Field Aquaculture Technician / Agent')
    ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);
  `);
  console.log('✓ Roles table aligned');

  // 4. Ensure USERS table with VARCHAR(50) ID
  // If users.id is BIGINT, alter to VARCHAR(50)
  try {
    await query('ALTER TABLE users MODIFY COLUMN id VARCHAR(50) NOT NULL');
  } catch (e) {
    console.log('  Notice altering users.id:', e.message);
  }

  // Ensure all columns exist on users
  const userCols = (await query('DESCRIBE users')).map(c => c.Field);
  const userColDefs = [
    { name: 'password', def: 'VARCHAR(255) NULL' },
    { name: 'password_hash', def: 'VARCHAR(255) NULL' },
    { name: 'name', def: 'VARCHAR(255) NULL' },
    { name: 'full_name', def: 'VARCHAR(255) NULL' },
    { name: 'role', def: 'VARCHAR(50) NULL' },
    { name: 'role_id', def: 'INT UNSIGNED NULL' },
    { name: 'phone', def: 'VARCHAR(50) NULL' },
    { name: 'email', def: 'VARCHAR(255) NULL' },
    { name: 'locality', def: 'VARCHAR(150) NULL' },
    { name: 'region', def: 'VARCHAR(100) NULL' },
    { name: 'status', def: "VARCHAR(50) DEFAULT 'ACTIVE'" }
  ];

  for (const c of userColDefs) {
    if (!userCols.includes(c.name)) {
      try {
        await query(`ALTER TABLE users ADD COLUMN ${c.name} ${c.def}`);
      } catch (err) {
        console.log(`  Notice adding users.${c.name}:`, err.message);
      }
    }
  }

  const defaultPinHash = await bcrypt.hash('1234', 10);

  // Seed core required user accounts
  const seedUsers = [
    {
      id: 'ADM001',
      username: 'admin',
      name: 'System Administrator',
      role: 'ADMIN',
      role_id: 1,
      phone: '9999999999',
      email: 'admin@royalsmarine.com',
      locality: 'HQ',
      region: 'Headquarters'
    },
    {
      id: 'INC001',
      username: 'INC001',
      name: 'Ravi Kumar',
      role: 'ASM',
      role_id: 2,
      phone: '9121006439',
      email: 'ravi@royalsmarine.com',
      locality: 'Bhimavaram Central',
      region: 'Bhimavaram'
    },
    {
      id: 'INC002',
      username: 'INC002',
      name: 'Rajesh Varma',
      role: 'ASM',
      role_id: 2,
      phone: '9121006440',
      email: 'rajesh@royalsmarine.com',
      locality: 'Kakinada Port',
      region: 'Kakinada'
    },
    {
      id: 'agent001',
      username: 'agent001',
      name: 'Ramesh',
      role: 'AGENT',
      role_id: 3,
      phone: '9000000001',
      email: 'ramesh@royalsmarine.com',
      locality: 'Chinnamiram',
      region: 'Bhimavaram'
    },
    {
      id: 'agent002',
      username: 'agent002',
      name: 'Suresh',
      role: 'AGENT',
      role_id: 3,
      phone: '9000000002',
      email: 'suresh@royalsmarine.com',
      locality: 'Bhimavaram',
      region: 'Bhimavaram'
    },
    {
      id: 'agent003',
      username: 'agent003',
      name: 'Mahesh',
      role: 'AGENT',
      role_id: 3,
      phone: '9000000003',
      email: 'mahesh@royalsmarine.com',
      locality: 'Akuruvu',
      region: 'Bhimavaram'
    },
    {
      id: 'tech_ramesh',
      username: 'tech_ramesh',
      name: 'Ramesh Kumar',
      role: 'AGENT',
      role_id: 3,
      phone: '9121006430',
      email: 'tech_ramesh@royalsmarine.com',
      locality: 'Bhimavaram West',
      region: 'Bhimavaram'
    },
    {
      id: 'asm_bharadwaj',
      username: 'asm_bharadwaj',
      name: 'Bharadwaj Reddy',
      role: 'ASM',
      role_id: 2,
      phone: '9121006438',
      email: 'bharadwaj@royalsmarine.com',
      locality: 'Bhimavaram South',
      region: 'Bhimavaram'
    }
  ];

  for (const u of seedUsers) {
    await query(`
      INSERT INTO users (id, username, password, password_hash, name, full_name, role, role_id, phone, email, locality, region, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      ON DUPLICATE KEY UPDATE
        password = VALUES(password),
        password_hash = VALUES(password_hash),
        name = VALUES(name),
        full_name = VALUES(full_name),
        role = VALUES(role),
        role_id = VALUES(role_id),
        phone = VALUES(phone),
        email = VALUES(email),
        locality = VALUES(locality),
        region = VALUES(region),
        status = 'ACTIVE'
    `, [
      u.id, u.username, defaultPinHash, defaultPinHash, u.name, u.name,
      u.role, u.role_id, u.phone, u.email, u.locality, u.region
    ]);
  }
  console.log('✓ Users table aligned and seeded');

  // 5. Ensure REGIONS table
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

  try {
    await query('ALTER TABLE regions MODIFY COLUMN id VARCHAR(50) NOT NULL');
  } catch {}

  const regCols = (await query('DESCRIBE regions')).map(c => c.Field);
  if (!regCols.includes('active_ponds')) await query('ALTER TABLE regions ADD COLUMN active_ponds INT DEFAULT 0');
  if (!regCols.includes('total_yield')) await query('ALTER TABLE regions ADD COLUMN total_yield VARCHAR(50) NULL');
  if (!regCols.includes('avg_fcr')) await query('ALTER TABLE regions ADD COLUMN avg_fcr DECIMAL(4, 2) NULL');

  const seedRegions = [
    { id: 'REG001', code: 'REG001', name: 'Bhimavaram', active_ponds: 24, total_yield: '48 Tons', avg_fcr: 1.25 },
    { id: 'REG002', code: 'REG002', name: 'Kakinada', active_ponds: 18, total_yield: '36 Tons', avg_fcr: 1.30 },
    { id: 'REG003', code: 'REG003', name: 'Narasapuram', active_ponds: 15, total_yield: '30 Tons', avg_fcr: 1.28 }
  ];

  for (const r of seedRegions) {
    await query(`
      INSERT INTO regions (id, code, name, active_ponds, total_yield, avg_fcr, status)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
      ON DUPLICATE KEY UPDATE
        code = VALUES(code),
        name = VALUES(name),
        active_ponds = VALUES(active_ponds),
        total_yield = VALUES(total_yield),
        avg_fcr = VALUES(avg_fcr),
        status = 'ACTIVE'
    `, [r.id, r.code, r.name, r.active_ponds, r.total_yield, r.avg_fcr]);
  }
  console.log('✓ Regions table aligned and seeded');

  // 6. Ensure INCHARGES table
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

  try {
    await query('ALTER TABLE incharges MODIFY COLUMN id VARCHAR(50) NOT NULL');
  } catch (e) {
    console.log('  Notice altering incharges.id:', e.message);
  }
  try {
    await query('ALTER TABLE incharges MODIFY COLUMN region_id VARCHAR(50) NULL');
  } catch (e) {
    console.log('  Notice altering incharges.region_id:', e.message);
  }
  try {
    await query('ALTER TABLE incharges MODIFY COLUMN user_id VARCHAR(50) NULL');
  } catch (e) {
    console.log('  Notice altering incharges.user_id:', e.message);
  }

  const incCols = (await query('DESCRIBE incharges')).map(c => c.Field);
  if (!incCols.includes('name')) await query('ALTER TABLE incharges ADD COLUMN name VARCHAR(255) NULL');
  if (!incCols.includes('email')) await query('ALTER TABLE incharges ADD COLUMN email VARCHAR(255) NULL');
  if (!incCols.includes('phone')) await query('ALTER TABLE incharges ADD COLUMN phone VARCHAR(50) NULL');

  const seedIncharges = [
    { id: 'INC001', name: 'Ravi Kumar', region_id: 'REG001', email: 'ravi@royalsmarine.com', phone: '9121006439' },
    { id: 'INC002', name: 'Rajesh Varma', region_id: 'REG002', email: 'rajesh@royalsmarine.com', phone: '9121006440' }
  ];

  for (const inc of seedIncharges) {
    await query(`
      INSERT INTO incharges (id, name, region_id, email, phone)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        region_id = VALUES(region_id),
        email = VALUES(email),
        phone = VALUES(phone)
    `, [inc.id, inc.name, inc.region_id, inc.email, inc.phone]);
  }
  console.log('✓ Incharges table aligned and seeded');

  // 7. Ensure AGENTS table
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

  const seedAgents = [
    { id: 'agent001', name: 'Ramesh', phone: '9000000001', incharge_id: 'INC001', locality: 'Chinnamiram', active_ponds: 8 },
    { id: 'agent002', name: 'Suresh', phone: '9000000002', incharge_id: 'INC001', locality: 'Bhimavaram', active_ponds: 6 },
    { id: 'agent003', name: 'Mahesh', phone: '9000000003', incharge_id: 'INC001', locality: 'Akuruvu', active_ponds: 5 }
  ];

  for (const a of seedAgents) {
    await query(`
      INSERT INTO agents (id, name, phone, incharge_id, status, locality, active_ponds)
      VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        phone = VALUES(phone),
        incharge_id = VALUES(incharge_id),
        locality = VALUES(locality),
        active_ponds = VALUES(active_ponds),
        status = 'ACTIVE'
    `, [a.id, a.name, a.phone, a.incharge_id, a.locality, a.active_ponds]);
  }
  console.log('✓ Agents table aligned and seeded');

  // 8. Ensure FARMERS table with VARCHAR(50) ID
  try {
    await query('ALTER TABLE farmers MODIFY COLUMN id VARCHAR(50) NOT NULL');
  } catch (e) {
    console.log('  Notice altering farmers.id:', e.message);
  }

  const farmerCols = (await query('DESCRIBE farmers')).map(c => c.Field);
  const farmerColDefs = [
    { name: 'agent_id', def: 'VARCHAR(50) NULL' },
    { name: 'incharge_id', def: 'VARCHAR(50) NULL' },
    { name: 'assigned_to', def: 'VARCHAR(50) NULL' },
    { name: 'assigned_by', def: 'VARCHAR(50) NULL' },
    { name: 'location', def: 'VARCHAR(255) NULL' },
    { name: 'acres', def: 'DECIMAL(10, 2) NULL' }
  ];

  for (const c of farmerColDefs) {
    if (!farmerCols.includes(c.name)) {
      try {
        await query(`ALTER TABLE farmers ADD COLUMN ${c.name} ${c.def}`);
      } catch (err) {
        console.log(`  Notice adding farmers.${c.name}:`, err.message);
      }
    }
  }

  try {
    await query('ALTER TABLE farmers MODIFY COLUMN water_source VARCHAR(100) NULL');
  } catch {}

  const seedFarmers = [
    {
      id: 'F001',
      farmer_code: 'FAR001',
      name: 'Gowtham Krishna',
      phone: '9963545352',
      village: 'Chinnamiram',
      mandal: 'Bhimavaram',
      district: 'West Godavari',
      state: 'Andhra Pradesh',
      location: 'Chinnamiram, Bhimavaram',
      acres: 10.0,
      total_acres: 10.0,
      water_source: 'Borewell',
      agent_id: 'agent001',
      incharge_id: 'INC001',
      assigned_to: 'Agent',
      assigned_by: 'Admin'
    },
    {
      id: 'F002',
      farmer_code: 'FAR002',
      name: 'Venkat Rao',
      phone: '9848011223',
      village: 'Losari',
      mandal: 'Bhimavaram',
      district: 'West Godavari',
      state: 'Andhra Pradesh',
      location: 'Losari, Bhimavaram',
      acres: 12.5,
      total_acres: 12.5,
      water_source: 'Canal',
      agent_id: 'agent001',
      incharge_id: 'INC001',
      assigned_to: 'Agent',
      assigned_by: 'Admin'
    },
    {
      id: 'F003',
      farmer_code: 'FAR003',
      name: 'Satyanarayana Raju',
      phone: '9848022334',
      village: 'Gollavanitippa',
      mandal: 'Bhimavaram',
      district: 'West Godavari',
      state: 'Andhra Pradesh',
      location: 'Gollavanitippa, Bhimavaram',
      acres: 8.0,
      total_acres: 8.0,
      water_source: 'Creek',
      agent_id: 'agent002',
      incharge_id: 'INC001',
      assigned_to: 'Agent',
      assigned_by: 'Admin'
    },
    {
      id: 'F004',
      farmer_code: 'FAR004',
      name: 'Subba Rao',
      phone: '9848033445',
      village: 'Vakalapudi',
      mandal: 'Kakinada Rural',
      district: 'Kakinada',
      state: 'Andhra Pradesh',
      location: 'Vakalapudi, Kakinada',
      acres: 15.0,
      total_acres: 15.0,
      water_source: 'Estuary',
      agent_id: 'agent003',
      incharge_id: 'INC002',
      assigned_to: 'Agent',
      assigned_by: 'Admin'
    },
    {
      id: 'F005',
      farmer_code: 'FAR005',
      name: 'Prasad Varma',
      phone: '9848044556',
      village: 'Mogalthur',
      mandal: 'Narasapuram',
      district: 'West Godavari',
      state: 'Andhra Pradesh',
      location: 'Mogalthur, Narasapuram',
      acres: 6.0,
      total_acres: 6.0,
      water_source: 'Borewell',
      agent_id: 'agent002',
      incharge_id: 'INC001',
      assigned_to: 'Incharge',
      assigned_by: 'Admin'
    }
  ];

  for (const f of seedFarmers) {
    await query(`
      INSERT INTO farmers (id, farmer_code, name, phone, village, mandal, district, state, location, acres, total_acres, water_source, agent_id, incharge_id, assigned_to, assigned_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      ON DUPLICATE KEY UPDATE
        farmer_code = VALUES(farmer_code),
        name = VALUES(name),
        phone = VALUES(phone),
        village = VALUES(village),
        mandal = VALUES(mandal),
        district = VALUES(district),
        state = VALUES(state),
        location = VALUES(location),
        acres = VALUES(acres),
        total_acres = VALUES(total_acres),
        water_source = VALUES(water_source),
        agent_id = VALUES(agent_id),
        incharge_id = VALUES(incharge_id),
        assigned_to = VALUES(assigned_to),
        assigned_by = VALUES(assigned_by),
        status = 'ACTIVE'
    `, [
      f.id, f.farmer_code, f.name, f.phone, f.village, f.mandal, f.district, f.state,
      f.location, f.acres, f.total_acres, f.water_source, f.agent_id, f.incharge_id,
      f.assigned_to, f.assigned_by
    ]);
  }
  console.log('✓ Farmers table aligned and seeded');

  // 9. Ensure TANKS table
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

  const tankCols = (await query('DESCRIBE tanks')).map(c => c.Field);
  const tankColDefs = [
    { name: 'acres', def: 'VARCHAR(50) NULL' },
    { name: 'area_acres', def: 'DECIMAL(10, 2) NULL' },
    { name: 'salinity', def: 'VARCHAR(50) NULL' },
    { name: 'species', def: 'VARCHAR(100) NULL' },
    { name: 'water_source', def: 'VARCHAR(100) NULL' },
    { name: 'culture_type', def: 'VARCHAR(100) NULL' },
    { name: 'stocking_date', def: 'VARCHAR(50) NULL' }
  ];

  for (const c of tankColDefs) {
    if (!tankCols.includes(c.name)) {
      try {
        await query(`ALTER TABLE tanks ADD COLUMN ${c.name} ${c.def}`);
      } catch (err) {
        console.log(`  Notice adding tanks.${c.name}:`, err.message);
      }
    }
  }

  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const seedTanks = [
    {
      id: 'T001',
      name: 'Tank 1',
      farmer_id: 'F001',
      agent_id: 'agent001',
      incharge_id: 'INC001',
      assigned_to: 'Agent',
      status: 'ACTIVE',
      test_status: 'Due',
      abw: '16.5g',
      biomass: '1650kg',
      fcr: '1.22',
      size: '5.0 Acres',
      doc: 65,
      last_test: todayStr,
      next_test: 'Due This Week',
      salinity: '15 ppt',
      species: 'Vannamei',
      culture_type: 'Semi-Intensive'
    },
    {
      id: 'T002',
      name: 'Tank 2',
      farmer_id: 'F001',
      agent_id: 'agent001',
      incharge_id: 'INC001',
      assigned_to: 'Agent',
      status: 'ACTIVE',
      test_status: 'Completed',
      abw: '18.2g',
      biomass: '1900kg',
      fcr: '1.18',
      size: '5.0 Acres',
      doc: 72,
      last_test: todayStr,
      next_test: 'Due Next Week',
      salinity: '14 ppt',
      species: 'Vannamei',
      culture_type: 'Semi-Intensive'
    },
    {
      id: 'T003',
      name: 'Tank 1',
      farmer_id: 'F002',
      agent_id: 'agent001',
      incharge_id: 'INC001',
      assigned_to: 'Agent',
      status: 'ACTIVE',
      test_status: 'Due',
      abw: '12.0g',
      biomass: '1200kg',
      fcr: '1.25',
      size: '6.0 Acres',
      doc: 48,
      last_test: todayStr,
      next_test: 'Due This Week',
      salinity: '18 ppt',
      species: 'Vannamei',
      culture_type: 'Semi-Intensive'
    },
    {
      id: 'T004',
      name: 'Tank 2',
      farmer_id: 'F002',
      agent_id: 'agent001',
      incharge_id: 'INC001',
      assigned_to: 'Agent',
      status: 'ACTIVE',
      test_status: 'Overdue',
      abw: '14.1g',
      biomass: '1450kg',
      fcr: '1.29',
      size: '6.5 Acres',
      doc: 55,
      last_test: todayStr,
      next_test: 'Overdue',
      salinity: '17 ppt',
      species: 'Vannamei',
      culture_type: 'Semi-Intensive'
    },
    {
      id: 'T005',
      name: 'Tank 1',
      farmer_id: 'F003',
      agent_id: 'agent002',
      incharge_id: 'INC001',
      assigned_to: 'Agent',
      status: 'ACTIVE',
      test_status: 'Completed',
      abw: '22.0g',
      biomass: '2400kg',
      fcr: '1.15',
      size: '4.0 Acres',
      doc: 85,
      last_test: todayStr,
      next_test: 'Due Next Week',
      salinity: '12 ppt',
      species: 'Vannamei',
      culture_type: 'Semi-Intensive'
    },
    {
      id: 'T006',
      name: 'Tank 2',
      farmer_id: 'F003',
      agent_id: 'agent002',
      incharge_id: 'INC001',
      assigned_to: 'Agent',
      status: 'ACTIVE',
      test_status: 'Due',
      abw: '15.4g',
      biomass: '1500kg',
      fcr: '1.21',
      size: '4.0 Acres',
      doc: 58,
      last_test: todayStr,
      next_test: 'Due This Week',
      salinity: '13 ppt',
      species: 'Vannamei',
      culture_type: 'Semi-Intensive'
    },
    {
      id: 'T007',
      name: 'Tank 1',
      farmer_id: 'F004',
      agent_id: 'agent003',
      incharge_id: 'INC002',
      assigned_to: 'Agent',
      status: 'ACTIVE',
      test_status: 'Due',
      abw: '19.8g',
      biomass: '2100kg',
      fcr: '1.20',
      size: '7.5 Acres',
      doc: 76,
      last_test: todayStr,
      next_test: 'Due This Week',
      salinity: '16 ppt',
      species: 'Vannamei',
      culture_type: 'Semi-Intensive'
    },
    {
      id: 'T008',
      name: 'Tank 1',
      farmer_id: 'F005',
      agent_id: 'agent002',
      incharge_id: 'INC001',
      assigned_to: 'Incharge',
      status: 'Harvested',
      test_status: 'Completed',
      abw: '26.5g',
      biomass: '2800kg',
      fcr: '1.14',
      size: '6.0 Acres',
      doc: 105,
      last_test: todayStr,
      next_test: 'Cycle Closed',
      salinity: '15 ppt',
      species: 'Vannamei',
      culture_type: 'Semi-Intensive'
    }
  ];

  for (const t of seedTanks) {
    await query(`
      INSERT INTO tanks (id, name, farmer_id, agent_id, incharge_id, assigned_to, status, test_status, abw, biomass, fcr, size, doc, last_test, next_test, salinity, species, culture_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        farmer_id = VALUES(farmer_id),
        agent_id = VALUES(agent_id),
        incharge_id = VALUES(incharge_id),
        assigned_to = VALUES(assigned_to),
        status = VALUES(status),
        test_status = VALUES(test_status),
        abw = VALUES(abw),
        biomass = VALUES(biomass),
        fcr = VALUES(fcr),
        size = VALUES(size),
        doc = VALUES(doc),
        last_test = VALUES(last_test),
        next_test = VALUES(next_test),
        salinity = VALUES(salinity),
        species = VALUES(species),
        culture_type = VALUES(culture_type)
    `, [
      t.id, t.name, t.farmer_id, t.agent_id, t.incharge_id, t.assigned_to,
      t.status, t.test_status, t.abw, t.biomass, t.fcr, t.size, t.doc,
      t.last_test, t.next_test, t.salinity, t.species, t.culture_type
    ]);
  }
  console.log('✓ Tanks table aligned and seeded');

  // 10. Ensure SUBMISSIONS table
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

  const seedSubmissions = [
    {
      id: 'SUB001',
      agent_id: 'agent001',
      farmer_id: 'F001',
      tank_id: 'T002',
      test_type: 'Water Quality Test',
      date: new Date().toISOString().split('T')[0],
      status: 'COMPLETED',
      data: JSON.stringify({
        waterQuality: { ph: 7.8, salinity: 14, do: 6.2, alkalinity: 140, ammonia: 0.05 },
        abw: '18.2g',
        biomass: '1900kg',
        fcr: '1.18'
      }),
      latitude: 16.54490000,
      longitude: 81.52120000,
      locality: 'Chinnamiram, Bhimavaram',
      review_notes: 'Parameters within optimal range. Water quality verified.',
      submitted_ago: 'Yesterday'
    },
    {
      id: 'SUB002',
      agent_id: 'agent002',
      farmer_id: 'F003',
      tank_id: 'T005',
      test_type: 'Water & Biomass Analysis',
      date: new Date().toISOString().split('T')[0],
      status: 'COMPLETED',
      data: JSON.stringify({
        waterQuality: { ph: 8.1, salinity: 12, do: 5.8, alkalinity: 150, ammonia: 0.08 },
        abw: '22.0g',
        biomass: '2400kg',
        fcr: '1.15'
      }),
      latitude: 16.53810000,
      longitude: 81.51240000,
      locality: 'Gollavanitippa, Bhimavaram',
      review_notes: 'Good shrimp growth and survival rate.',
      submitted_ago: '2 days ago'
    },
    {
      id: 'SUB003',
      agent_id: 'agent001',
      farmer_id: 'F001',
      tank_id: 'T001',
      test_type: 'Water Quality Test',
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING_VERIFICATION',
      data: JSON.stringify({
        waterQuality: { ph: 7.6, salinity: 15, do: 6.0, alkalinity: 135, ammonia: 0.04 },
        abw: '16.5g',
        biomass: '1650kg',
        fcr: '1.22'
      }),
      latitude: 16.54510000,
      longitude: 81.52150000,
      locality: 'Chinnamiram, Bhimavaram',
      review_notes: '',
      submitted_ago: 'Just now'
    }
  ];

  for (const sub of seedSubmissions) {
    await query(`
      INSERT INTO submissions (id, agent_id, farmer_id, tank_id, test_type, date, status, data, latitude, longitude, locality, review_notes, submitted_ago)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        review_notes = VALUES(review_notes),
        data = VALUES(data)
    `, [
      sub.id, sub.agent_id, sub.farmer_id, sub.tank_id, sub.test_type, sub.date,
      sub.status, sub.data, sub.latitude, sub.longitude, sub.locality,
      sub.review_notes, sub.submitted_ago
    ]);
  }
  console.log('✓ Submissions table aligned and seeded');

  // 11. Ensure HARVESTS table with VARCHAR(50) ID
  try {
    await query('ALTER TABLE harvests MODIFY COLUMN id VARCHAR(50) NOT NULL');
  } catch (e) {
    console.log('  Notice altering harvests.id:', e.message);
  }

  const harvestCols = (await query('DESCRIBE harvests')).map(c => c.Field);
  const harvestColDefs = [
    { name: 'tank_id', def: 'VARCHAR(50) NULL' },
    { name: 'farmer_id', def: 'VARCHAR(50) NULL' },
    { name: 'date', def: 'VARCHAR(50) NULL' },
    { name: 'count_per_kg', def: 'INT NULL' },
    { name: 'quality', def: 'VARCHAR(50) NULL' },
    { name: 'revenue', def: 'DECIMAL(16, 2) NULL' }
  ];

  for (const c of harvestColDefs) {
    if (!harvestCols.includes(c.name)) {
      try {
        await query(`ALTER TABLE harvests ADD COLUMN ${c.name} ${c.def}`);
      } catch (err) {
        console.log(`  Notice adding harvests.${c.name}:`, err.message);
      }
    }
  }

  try {
    await query('ALTER TABLE harvests MODIFY COLUMN culture_cycle_id VARCHAR(50) NULL');
    await query('ALTER TABLE harvests MODIFY COLUMN harvest_code VARCHAR(50) NULL');
    await query('ALTER TABLE harvests MODIFY COLUMN recorded_by VARCHAR(50) NULL');
    await query("ALTER TABLE harvests MODIFY COLUMN harvest_type VARCHAR(50) DEFAULT 'FINAL'");
    await query('ALTER TABLE harvests MODIFY COLUMN harvest_date DATE NULL');
  } catch (e) {
    console.log('  Notice altering harvests columns:', e.message);
  }

  const seedHarvests = [
    {
      id: 'HARV001',
      tank_id: 'T008',
      farmer_id: 'F005',
      harvest_code: 'HARV001',
      date: '2026-10-01',
      harvest_date: '2026-10-01',
      harvest_type: 'FINAL',
      quantity_kg: 2800.00,
      count_per_kg: 28,
      quality: 'A Grade',
      price_per_kg: 390.00,
      revenue: 1092000.00,
      buyer_name: 'Coastal Seafoods Exporters',
      remarks: 'Full pond harvest completed smoothly.'
    }
  ];

  for (const h of seedHarvests) {
    await query(`
      INSERT INTO harvests (id, tank_id, farmer_id, harvest_code, date, harvest_date, harvest_type, quantity_kg, count_per_kg, quality, price_per_kg, revenue, total_value, buyer_name, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        tank_id = VALUES(tank_id),
        farmer_id = VALUES(farmer_id),
        date = VALUES(date),
        quantity_kg = VALUES(quantity_kg),
        count_per_kg = VALUES(count_per_kg),
        quality = VALUES(quality),
        price_per_kg = VALUES(price_per_kg),
        revenue = VALUES(revenue),
        total_value = VALUES(total_value),
        buyer_name = VALUES(buyer_name)
    `, [
      h.id, h.tank_id, h.farmer_id, h.harvest_code, h.date, h.harvest_date,
      h.harvest_type, h.quantity_kg, h.count_per_kg, h.quality, h.price_per_kg,
      h.revenue, h.revenue, h.buyer_name, h.remarks
    ]);
  }
  console.log('✓ Harvests table aligned and seeded');

  // Re-enable foreign key checks
  await query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('✓ Foreign key checks re-enabled');

  console.log('\n\x1b[32m=====================================================\x1b[0m');
  console.log('\x1b[1;32m  Database Successfully Aligned with All Features!  \x1b[0m');
  console.log('\x1b[32m=====================================================\x1b[0m\n');

  await (await getPool()).end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('\x1b[31mMigration error:\x1b[0m', err);
  try {
    await query('SET FOREIGN_KEY_CHECKS = 1');
    await (await getPool()).end();
  } catch {}
  process.exit(1);
});
