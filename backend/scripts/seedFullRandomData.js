import bcrypt from 'bcryptjs';
import { query, checkDatabaseConnection } from '../src/config/database.js';

// --- Real Andhra Pradesh Aquaculture Hubs & Centers ---
const AQUA_HUBS = [
  // West Godavari & Delta Hubs (Heart of Indian Shrimp Farming)
  { name: 'Bhimavaram Rural', village: 'Pedamiram', mandal: 'Bhimavaram', district: 'West Godavari', lat: 16.5449, lng: 81.5212, region: 'REG001' },
  { name: 'Chinnamiram Ponds', village: 'Chinnamiram', mandal: 'Bhimavaram', district: 'West Godavari', lat: 16.5320, lng: 81.5050, region: 'REG001' },
  { name: 'Undi Aqua Belt', village: 'Undi', mandal: 'Undi', district: 'West Godavari', lat: 16.5855, lng: 81.4673, region: 'REG001' },
  { name: 'Akividu Wetland Farms', village: 'Akividu', mandal: 'Akividu', district: 'West Godavari', lat: 16.5898, lng: 81.3812, region: 'REG001' },
  { name: 'Kalla Brackish Ponds', village: 'Kalla', mandal: 'Kalla', district: 'West Godavari', lat: 16.5620, lng: 81.4250, region: 'REG001' },
  { name: 'Akuruvu Shrimp Farms', village: 'Akuruvu', mandal: 'Bhimavaram', district: 'West Godavari', lat: 16.5120, lng: 81.4920, region: 'REG001' },
  
  // East Godavari & Kakinada Coastal Hubs
  { name: 'Kakinada Estuary Farms', village: 'Sarpavaram', mandal: 'Kakinada Rural', district: 'Kakinada', lat: 16.9891, lng: 82.2475, region: 'REG002' },
  { name: 'Coringa Coastal Belt', village: 'Coringa', mandal: 'Thallarevu', district: 'Kakinada', lat: 16.8920, lng: 82.3150, region: 'REG002' },
  { name: 'Amalapuram Delta Ponds', village: 'Amalapuram', mandal: 'Amalapuram', district: 'Dr. B.R. Ambedkar Konaseema', lat: 16.5787, lng: 82.0061, region: 'REG002' },
  { name: 'Razole Mangrove Farms', village: 'Razole', mandal: 'Razole', district: 'Dr. B.R. Ambedkar Konaseema', lat: 16.4520, lng: 81.8350, region: 'REG002' },
  { name: 'Mummidivaram Saline Farms', village: 'Mummidivaram', mandal: 'Mummidivaram', district: 'Dr. B.R. Ambedkar Konaseema', lat: 16.6450, lng: 82.1120, region: 'REG002' },

  // Narasapuram & Coastline Delta Hubs
  { name: 'Narasapuram Creek Ponds', village: 'Narasapuram', mandal: 'Narasapuram', district: 'West Godavari', lat: 16.4411, lng: 81.7008, region: 'REG003' },
  { name: 'Mogalthur Coast Farms', village: 'Mogalthur', mandal: 'Mogalthur', district: 'West Godavari', lat: 16.4253, lng: 81.6033, region: 'REG003' },
  { name: 'Perupalem Beach Ponds', village: 'Perupalem', mandal: 'Mogalthur', district: 'West Godavari', lat: 16.3850, lng: 81.6520, region: 'REG003' },
  { name: 'Palakollu Canal Belt', village: 'Palakollu', mandal: 'Palakollu', district: 'West Godavari', lat: 16.5186, lng: 81.7289, region: 'REG003' },

  // Krishna & Machilipatnam Hubs
  { name: 'Machilipatnam Marine Farms', village: 'Gilakaladindi', mandal: 'Machilipatnam', district: 'Krishna', lat: 16.1875, lng: 81.1389, region: 'REG004' },
  { name: 'Bantumilli Aqua Cluster', village: 'Bantumilli', mandal: 'Bantumilli', district: 'Krishna', lat: 16.3520, lng: 81.2580, region: 'REG004' },
  { name: 'Kruthivennu Saline Farms', village: 'Kruthivennu', mandal: 'Kruthivennu', district: 'Krishna', lat: 16.4150, lng: 81.4120, region: 'REG004' },
  { name: 'Avanigadda River Belt', village: 'Avanigadda', mandal: 'Avanigadda', district: 'Krishna', lat: 16.0250, lng: 80.9150, region: 'REG004' },

  // Prakasam & Ongole Coastal Hubs
  { name: 'Ongole Coast Aqua Ponds', village: 'Kothapatnam', mandal: 'Ongole', district: 'Prakasam', lat: 15.5057, lng: 80.0499, region: 'REG005' },
  { name: 'Chirala Beach Ponds', village: 'Chirala', mandal: 'Chirala', district: 'Bapatla', lat: 15.8246, lng: 80.3522, region: 'REG005' },
  { name: 'Nizampatnam Harbor Farms', village: 'Nizampatnam', mandal: 'Nizampatnam', district: 'Bapatla', lat: 15.9050, lng: 80.6720, region: 'REG005' },

  // Nellore Marine Aquaculture Belt
  { name: 'Gudur Marine Farms', village: 'Kota', mandal: 'Kota', district: 'Tirupati / Nellore', lat: 14.1463, lng: 79.8504, region: 'REG006' },
  { name: 'Vakadu Salt Creek', village: 'Vakadu', mandal: 'Vakadu', district: 'Nellore', lat: 14.0120, lng: 80.1150, region: 'REG006' },
  { name: 'Indukurpet Coastal Belt', village: 'Indukurpet', mandal: 'Indukurpet', district: 'SPSR Nellore', lat: 14.4850, lng: 80.1250, region: 'REG006' },
];

function getRandomLocation(baseHub) {
  const hub = baseHub || AQUA_HUBS[Math.floor(Math.random() * AQUA_HUBS.length)];
  // Add realistic micro-jitter (~100m to 1.5km) for pond-level accuracy
  const latJitter = (Math.random() - 0.5) * 0.024;
  const lngJitter = (Math.random() - 0.5) * 0.024;
  return {
    latitude: Number((hub.lat + latJitter).toFixed(7)),
    longitude: Number((hub.lng + lngJitter).toFixed(7)),
    locality: `${hub.village}, ${hub.mandal}`,
    village: hub.village,
    mandal: hub.mandal,
    district: hub.district,
    region: hub.region,
    name: hub.name,
  };
}

const FIRST_NAMES = [
  'Venkata', 'Satyanarayana', 'Srinivasa', 'Rambabu', 'Subrahmanyam', 'Venkateswara',
  'Appa', 'Nageswara', 'Krishna', 'Siva', 'Brahmaiah', 'Prasad', 'Radhakrishna',
  'Suryanarayana', 'Chandra', 'Mohan', 'Lokanatham', 'Koteswara', 'Purna', 'Narayana'
];

const LAST_NAMES = [
  'Rao', 'Reddy', 'Varma', 'Chowdary', 'Naidu', 'Raju', 'Babu', 'Kumar', 'Murthy', 'Goud'
];

const INITIALS = ['K.', 'M.', 'P.', 'B.', 'G.', 'Ch.', 'N.', 'D.', 'T.', 'V.', 'S.', 'A.'];

function generateFarmerName(index) {
  const init = INITIALS[index % INITIALS.length];
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[index % LAST_NAMES.length];
  return `${init} ${first} ${last}`;
}

async function runSeed() {
  console.log('\n\x1b[36m============================================================\x1b[0m');
  console.log('\x1b[1;36m  Royals Marine - Comprehensive Random Data & GPS Seeder    \x1b[0m');
  console.log('\x1b[36m============================================================\x1b[0m\n');

  const conn = await checkDatabaseConnection();
  if (!conn.success) {
    console.error('Database connection failed:', conn.error);
    process.exit(1);
  }

  await query('SET FOREIGN_KEY_CHECKS = 0');

  // 1. Ensure ROLES
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
  console.log('✓ 1. Roles table verified');

  // 2. Seed REGIONS (6 coastal Andhra aquaculture regions)
  const regions = [
    { id: 'REG001', code: 'BVM', name: 'Bhimavaram Delta', active_ponds: 48, total_yield: '115 Tons', avg_fcr: 1.24 },
    { id: 'REG002', code: 'KKD', name: 'Kakinada Coastal', active_ponds: 36, total_yield: '88 Tons', avg_fcr: 1.28 },
    { id: 'REG003', code: 'NSP', name: 'Narasapuram Estuary', active_ponds: 28, total_yield: '64 Tons', avg_fcr: 1.26 },
    { id: 'REG004', code: 'MTM', name: 'Machilipatnam Marine', active_ponds: 32, total_yield: '76 Tons', avg_fcr: 1.30 },
    { id: 'REG005', code: 'OGL', name: 'Ongole Coast', active_ponds: 22, total_yield: '52 Tons', avg_fcr: 1.29 },
    { id: 'REG006', code: 'NLR', name: 'Nellore Saline Belt', active_ponds: 42, total_yield: '105 Tons', avg_fcr: 1.25 },
  ];

  for (const r of regions) {
    await query(`
      INSERT INTO regions (id, code, name, active_ponds, total_yield, avg_fcr, status)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
      ON DUPLICATE KEY UPDATE
        code=VALUES(code), name=VALUES(name), active_ponds=VALUES(active_ponds),
        total_yield=VALUES(total_yield), avg_fcr=VALUES(avg_fcr), status='ACTIVE'
    `, [r.id, r.code, r.name, r.active_ponds, r.total_yield, r.avg_fcr]);
  }
  console.log(`✓ 2. ${regions.length} Regions aligned & seeded`);

  // 3. Seed INCHARGES (Area Sales Managers)
  const incharges = [
    { id: 'INC001', name: 'Ravi Kumar', region_id: 'REG001', phone: '9121006439', email: 'ravi@royalsmarine.com' },
    { id: 'INC002', name: 'Rajesh Varma', region_id: 'REG002', phone: '9121006440', email: 'rajesh@royalsmarine.com' },
    { id: 'INC003', name: 'Bharadwaj Reddy', region_id: 'REG001', phone: '9121006438', email: 'bharadwaj@royalsmarine.com' },
    { id: 'INC004', name: 'Srinivas Murthy', region_id: 'REG003', phone: '9121006441', email: 'srinivas@royalsmarine.com' },
    { id: 'INC005', name: 'Venkat Rao Naidu', region_id: 'REG004', phone: '9121006442', email: 'venkat@royalsmarine.com' },
    { id: 'INC006', name: 'Koteswara Rao', region_id: 'REG006', phone: '9121006443', email: 'koteswara@royalsmarine.com' },
  ];

  for (const inc of incharges) {
    await query(`
      INSERT INTO incharges (id, name, region_id, phone, email)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name=VALUES(name), region_id=VALUES(region_id), phone=VALUES(phone), email=VALUES(email)
    `, [inc.id, inc.name, inc.region_id, inc.phone, inc.email]);
  }
  console.log(`✓ 3. ${incharges.length} Incharges aligned & seeded`);

  // 4. Seed AGENTS (Field Aquaculture Technicians)
  const agents = [
    { id: 'agent001', name: 'Ramesh', phone: '9000000001', incharge_id: 'INC001', locality: 'Chinnamiram', active_ponds: 12 },
    { id: 'agent002', name: 'Suresh', phone: '9000000002', incharge_id: 'INC001', locality: 'Bhimavaram West', active_ponds: 10 },
    { id: 'agent003', name: 'Mahesh', phone: '9000000003', incharge_id: 'INC003', locality: 'Akuruvu', active_ponds: 9 },
    { id: 'agent004', name: 'Kalyan Chakravarthy', phone: '9000000004', incharge_id: 'INC002', locality: 'Sarpavaram', active_ponds: 11 },
    { id: 'agent005', name: 'Prasad Varma', phone: '9000000005', incharge_id: 'INC002', locality: 'Coringa', active_ponds: 8 },
    { id: 'agent006', name: 'Naveen Kumar', phone: '9000000006', incharge_id: 'INC004', locality: 'Mogalthur', active_ponds: 7 },
    { id: 'agent007', name: 'Venkat Sai', phone: '9000000007', incharge_id: 'INC004', locality: 'Perupalem', active_ponds: 9 },
    { id: 'agent008', name: 'Brahmaiah', phone: '9000000008', incharge_id: 'INC005', locality: 'Gilakaladindi', active_ponds: 10 },
    { id: 'agent009', name: 'Subrahmanyam', phone: '9000000009', incharge_id: 'INC005', locality: 'Bantumilli', active_ponds: 8 },
    { id: 'agent010', name: 'Chandra Shekar', phone: '9000000010', incharge_id: 'INC006', locality: 'Kota', active_ponds: 12 },
    { id: 'agent011', name: 'Gopi Krishna', phone: '9000000011', incharge_id: 'INC006', locality: 'Vakadu', active_ponds: 10 },
    { id: 'tech_ramesh', name: 'Ramesh Kumar', phone: '9121006430', incharge_id: 'INC001', locality: 'Bhimavaram South', active_ponds: 8 },
  ];

  for (const ag of agents) {
    await query(`
      INSERT INTO agents (id, name, phone, incharge_id, locality, active_ponds, status)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
      ON DUPLICATE KEY UPDATE
        name=VALUES(name), phone=VALUES(phone), incharge_id=VALUES(incharge_id),
        locality=VALUES(locality), active_ponds=VALUES(active_ponds), status='ACTIVE'
    `, [ag.id, ag.name, ag.phone, ag.incharge_id, ag.locality, ag.active_ponds]);
  }
  console.log(`✓ 4. ${agents.length} Agents aligned & seeded`);

  // 5. Seed USERS for Authentication
  const defaultPinHash = await bcrypt.hash('1234', 10);
  const usersToSeed = [
    { id: 'ADM001', username: 'admin', name: 'System Administrator', role: 'ADMIN', role_id: 1, phone: '9999999999', email: 'admin@royalsmarine.com', locality: 'HQ', region: 'Headquarters' },
    ...incharges.map(inc => ({
      id: inc.id,
      username: inc.id,
      name: inc.name,
      role: 'ASM',
      role_id: 2,
      phone: inc.phone,
      email: inc.email,
      locality: inc.region_id,
      region: inc.region_id,
    })),
    ...agents.map(ag => ({
      id: ag.id,
      username: ag.id,
      name: ag.name,
      role: 'AGENT',
      role_id: 3,
      phone: ag.phone,
      email: `${ag.id}@royalsmarine.com`,
      locality: ag.locality,
      region: ag.incharge_id,
    })),
  ];

  for (const u of usersToSeed) {
    await query(`
      INSERT INTO users (id, username, password, password_hash, name, full_name, role, role_id, phone, email, locality, region, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      ON DUPLICATE KEY UPDATE
        password=VALUES(password), password_hash=VALUES(password_hash), name=VALUES(name),
        full_name=VALUES(full_name), role=VALUES(role), role_id=VALUES(role_id),
        phone=VALUES(phone), email=VALUES(email), locality=VALUES(locality), region=VALUES(region), status='ACTIVE'
    `, [u.id, u.username, defaultPinHash, defaultPinHash, u.name, u.name, u.role, u.role_id, u.phone, u.email, u.locality, u.region]);
  }
  console.log(`✓ 5. ${usersToSeed.length} Users accounts updated`);

  // 6. Seed FARMERS (30 realistic aquaculture farmers with GPS)
  const WATER_SOURCES = ['Borewell Brackish', 'Canal Freshwater', 'Estuary Tidal Creek', 'Brackish River Inlet', 'Salt Creek Backwater'];
  const farmerRecords = [];

  for (let i = 1; i <= 30; i++) {
    const fId = `FARM${String(i).padStart(3, '0')}`;
    const hub = AQUA_HUBS[(i - 1) % AQUA_HUBS.length];
    const loc = getRandomLocation(hub);
    const assignedAgent = agents[(i - 1) % agents.length];
    const assignedIncharge = incharges[(i - 1) % incharges.length];
    const name = generateFarmerName(i);
    const phone = `9848${String(100000 + i * 291).slice(0, 6)}`;
    const acres = Number((3.5 + (i * 1.7) % 25).toFixed(1));
    const waterSource = WATER_SOURCES[i % WATER_SOURCES.length];

    farmerRecords.push({
      id: fId,
      farmer_code: fId,
      name,
      phone,
      alternate_phone: `9949${String(200000 + i * 317).slice(0, 6)}`,
      address: `D.No. ${10 + (i % 25)}-${i * 3}, ${loc.village} Main Rd`,
      village: loc.village,
      mandal: loc.mandal,
      district: loc.district,
      state: 'Andhra Pradesh',
      latitude: loc.latitude,
      longitude: loc.longitude,
      total_acres: acres,
      acres,
      water_source: waterSource,
      agent_id: assignedAgent.id,
      incharge_id: assignedIncharge.id,
      assigned_to: assignedAgent.name,
      assigned_by: assignedIncharge.name,
      location: loc.locality,
      status: 'ACTIVE',
    });
  }

  for (const f of farmerRecords) {
    await query(`
      INSERT INTO farmers (
        id, farmer_code, name, phone, alternate_phone, address, village, mandal, district, state,
        latitude, longitude, total_acres, acres, water_source, agent_id, incharge_id, assigned_to, assigned_by, location, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      ON DUPLICATE KEY UPDATE
        name=VALUES(name), phone=VALUES(phone), village=VALUES(village), mandal=VALUES(mandal), district=VALUES(district),
        latitude=VALUES(latitude), longitude=VALUES(longitude), total_acres=VALUES(total_acres), acres=VALUES(acres),
        water_source=VALUES(water_source), agent_id=VALUES(agent_id), incharge_id=VALUES(incharge_id),
        assigned_to=VALUES(assigned_to), assigned_by=VALUES(assigned_by), location=VALUES(location), status='ACTIVE'
    `, [
      f.id, f.farmer_code, f.name, f.phone, f.alternate_phone, f.address, f.village, f.mandal, f.district, f.state,
      f.latitude, f.longitude, f.total_acres, f.acres, f.water_source, f.agent_id, f.incharge_id, f.assigned_to, f.assigned_by, f.location
    ]);
  }
  console.log(`✓ 6. ${farmerRecords.length} Farmers seeded with realistic GPS coordinates`);

  // 7. Seed PONDS & TANKS (60 production ponds/tanks)
  const SPECIES_LIST = ['Litopenaeus vannamei', 'Penaeus monodon', 'Scampi', 'Labeo rohita'];
  const TEST_STATUSES = ['Normal', 'Normal', 'Normal', 'Due', 'Overdue'];
  const tanksRecords = [];

  for (let i = 1; i <= 60; i++) {
    const tId = `TANK${String(i).padStart(3, '0')}`;
    const farmer = farmerRecords[(i - 1) % farmerRecords.length];
    const tankNum = Math.floor((i - 1) / farmerRecords.length) + 1;
    const name = `Pond ${tankNum} - ${farmer.name.split(' ').slice(-1)[0]}`;
    const pondAcres = Number((1.2 + (i % 5) * 0.8).toFixed(1));
    const species = SPECIES_LIST[i % SPECIES_LIST.length];
    const doc = 20 + (i * 7) % 95;
    const abwVal = (4.5 + (doc * 0.28) + (i % 4) * 0.5).toFixed(1);
    const biomassKg = Math.round(doc * 42 + pondAcres * 1100 + (i % 10) * 80);
    const fcrVal = (1.18 + (i % 7) * 0.03).toFixed(2);
    const testStatus = TEST_STATUSES[i % TEST_STATUSES.length];
    const salinity = `${8 + (i % 16)} ppt`;
    const stockingDate = new Date(Date.now() - doc * 86400000).toISOString().split('T')[0];
    const lastTestDate = new Date(Date.now() - (i % 5) * 86400000).toISOString().split('T')[0];
    const nextTestDate = new Date(Date.now() + (3 - (i % 4)) * 86400000).toISOString().split('T')[0];

    // Pond specific coordinates
    const pondLat = Number((Number(farmer.latitude) + (Math.random() - 0.5) * 0.006).toFixed(7));
    const pondLng = Number((Number(farmer.longitude) + (Math.random() - 0.5) * 0.006).toFixed(7));

    // Seed into ponds table
    await query(`
      INSERT INTO ponds (id, pond_code, farmer_id, name, area_acres, average_depth_ft, latitude, longitude, pond_type, status)
      VALUES (?, ?, ?, ?, ?, 5.5, ?, ?, 'EARTHEN', 'ACTIVE')
      ON DUPLICATE KEY UPDATE
        pond_code=VALUES(pond_code), name=VALUES(name), area_acres=VALUES(area_acres),
        latitude=VALUES(latitude), longitude=VALUES(longitude), status='ACTIVE'
    `, [i, `POND_${i}`, (i % farmerRecords.length) + 1, name, pondAcres, pondLat, pondLng]);

    // Seed into tanks table
    await query(`
      INSERT INTO tanks (
        id, name, farmer_id, agent_id, incharge_id, assigned_to, status, test_status,
        abw, biomass, fcr, last_test, next_test, size, doc, acres, area_acres, salinity,
        species, water_source, culture_type, stocking_date, latitude, longitude, location
      ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Intensive Shrimp Culture', ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name=VALUES(name), farmer_id=VALUES(farmer_id), agent_id=VALUES(agent_id), incharge_id=VALUES(incharge_id),
        assigned_to=VALUES(assigned_to), status='ACTIVE', test_status=VALUES(test_status), abw=VALUES(abw),
        biomass=VALUES(biomass), fcr=VALUES(fcr), last_test=VALUES(last_test), next_test=VALUES(next_test),
        size=VALUES(size), doc=VALUES(doc), acres=VALUES(acres), area_acres=VALUES(area_acres), salinity=VALUES(salinity),
        species=VALUES(species), water_source=VALUES(water_source), stocking_date=VALUES(stocking_date),
        latitude=VALUES(latitude), longitude=VALUES(longitude), location=VALUES(location)
    `, [
      tId, name, farmer.id, farmer.agent_id, farmer.incharge_id, farmer.assigned_to, testStatus,
      `${abwVal}g`, `${biomassKg.toLocaleString()} kg`, fcrVal, lastTestDate, nextTestDate,
      `${pondAcres} Acres`, doc, `${pondAcres} Acres`, pondAcres, salinity,
      species, farmer.water_source, stockingDate,
      pondLat, pondLng, farmer.location
    ]);

    tanksRecords.push({ id: tId, name, farmer_id: farmer.id, agent_id: farmer.agent_id, pondLat, pondLng, doc, abwVal, biomassKg });
  }
  console.log(`✓ 7. 60 Ponds & 60 Tanks seeded with live culture metrics`);

  // 8. Seed FEED PRODUCTS
  const feedProducts = [
    { id: 1, product_code: 'FP001', name: 'Royals Starter Pro 1.0mm', brand: 'Royals Marine', feed_type: 'Starter Crumbs', pellet_size_mm: 1.0, protein_percentage: 40.0 },
    { id: 2, product_code: 'FP002', name: 'Royals Grower Plus 1.4mm', brand: 'Royals Marine', feed_type: 'Grower Pellets', pellet_size_mm: 1.4, protein_percentage: 38.0 },
    { id: 3, product_code: 'FP003', name: 'Royals Grower Max 1.8mm', brand: 'Royals Marine', feed_type: 'Grower Pellets', pellet_size_mm: 1.8, protein_percentage: 36.0 },
    { id: 4, product_code: 'FP004', name: 'Royals Finisher Elite 2.2mm', brand: 'Royals Marine', feed_type: 'Finisher Pellets', pellet_size_mm: 2.2, protein_percentage: 35.0 },
    { id: 5, product_code: 'FP005', name: 'Royals Nursery Boost 0.6mm', brand: 'Royals Marine', feed_type: 'Micro Diet', pellet_size_mm: 0.6, protein_percentage: 42.0 },
    { id: 6, product_code: 'FP006', name: 'Royals Functional Immune Diet', brand: 'Royals Marine', feed_type: 'Immuno Stimulant', pellet_size_mm: 1.6, protein_percentage: 39.0 },
  ];

  for (const fp of feedProducts) {
    await query(`
      INSERT INTO feed_products (id, product_code, name, brand, feed_type, pellet_size_mm, protein_percentage, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      ON DUPLICATE KEY UPDATE
        product_code=VALUES(product_code), name=VALUES(name), brand=VALUES(brand),
        feed_type=VALUES(feed_type), pellet_size_mm=VALUES(pellet_size_mm), protein_percentage=VALUES(protein_percentage), status='ACTIVE'
    `, [fp.id, fp.product_code, fp.name, fp.brand, fp.feed_type, fp.pellet_size_mm, fp.protein_percentage]);
  }
  console.log(`✓ 8. ${feedProducts.length} Feed Products seeded`);

  // 9. Seed CULTURE CYCLES & POND CROPS
  for (let i = 1; i <= 60; i++) {
    const stockingDate = new Date(Date.now() - (25 + (i * 3) % 80) * 86400000).toISOString().split('T')[0];
    const harvestDate = new Date(Date.now() + (30 + (i * 2) % 45) * 86400000).toISOString().split('T')[0];
    const stockingCount = 60000 + (i % 8) * 20000;
    const initialBiomass = Number((stockingCount * 0.008).toFixed(2));

    await query(`
      INSERT INTO culture_cycles (id, pond_id, cycle_code, species, species_name, stocking_date, stocking_count, initial_biomass_kg, seed_source, expected_harvest_date, status)
      VALUES (?, ?, ?, 'SHRIMP', 'Litopenaeus vannamei', ?, ?, ?, 'Bhimavaram Marine Hatcheries', ?, 'ACTIVE')
      ON DUPLICATE KEY UPDATE
        cycle_code=VALUES(cycle_code), stocking_date=VALUES(stocking_date), stocking_count=VALUES(stocking_count),
        initial_biomass_kg=VALUES(initial_biomass_kg), expected_harvest_date=VALUES(expected_harvest_date), status='ACTIVE'
    `, [i, i, `CYCLE_2026_${String(i).padStart(3, '0')}`, stockingDate, stockingCount, initialBiomass, harvestDate]);

    await query(`
      INSERT INTO pond_crops (id, pond_id, species, culture_type, stocking_date, stocking_count, seed_source, initial_biomass, expected_harvest_date, status)
      VALUES (?, ?, 'Vannamei Shrimp', 'Semi-Intensive', ?, ?, 'Royals Certified Hatchery', ?, ?, 'ACTIVE')
      ON DUPLICATE KEY UPDATE
        species=VALUES(species), stocking_date=VALUES(stocking_date), stocking_count=VALUES(stocking_count),
        initial_biomass=VALUES(initial_biomass), expected_harvest_date=VALUES(expected_harvest_date), status='ACTIVE'
    `, [`CROP_${i}`, `POND_${i}`, stockingDate, stockingCount, initialBiomass, harvestDate]);
  }
  console.log('✓ 9. 60 Culture Cycles & Pond Crops aligned');

  // 10. Seed FIELD VISITS, WATER QUALITY, BIOMASS & HEALTH RECORDS
  const VISIT_TYPES = ['WATER_QUALITY', 'ROUTINE', 'FEED_CHECK', 'BIOMASS_CHECK', 'HEALTH_CHECK'];
  const WATER_COLORS = ['Light Green', 'Brownish Green', 'Golden Brown', 'Light Brown', 'Olive Green'];

  for (let i = 1; i <= 100; i++) {
    const tank = tanksRecords[(i - 1) % tanksRecords.length];
    const visitDate = new Date(Date.now() - (i % 30) * 86400000 - (i % 12) * 3600000);
    const visitType = VISIT_TYPES[i % VISIT_TYPES.length];
    const vLat = Number((tank.pondLat + (Math.random() - 0.5) * 0.003).toFixed(7));
    const vLng = Number((tank.pondLng + (Math.random() - 0.5) * 0.003).toFixed(7));

    // Field Visit
    await query(`
      INSERT INTO field_visits (id, visit_code, culture_cycle_id, technician_id, visit_date, visit_type, latitude, longitude, remarks)
      VALUES (?, ?, ?, 3, ?, ?, ?, ?, 'Routine field inspection and pond diagnostics conducted by Royals Marine technician')
      ON DUPLICATE KEY UPDATE
        visit_date=VALUES(visit_date), visit_type=VALUES(visit_type), latitude=VALUES(latitude), longitude=VALUES(longitude)
    `, [i, `VISIT_${String(i).padStart(4, '0')}`, (i % 60) + 1, visitDate, visitType, vLat, vLng]);

    // Water Quality Record
    const ph = Number((7.6 + (i % 7) * 0.1).toFixed(2));
    const doVal = Number((5.2 + (i % 6) * 0.35).toFixed(2));
    const sal = Number((10.0 + (i % 12) * 1.2).toFixed(2));
    const temp = Number((28.2 + (i % 5) * 0.6).toFixed(2));
    const amm = Number((0.02 + (i % 8) * 0.015).toFixed(3));
    const nit = Number((0.01 + (i % 6) * 0.008).toFixed(3));
    const alk = Number((120 + (i % 10) * 5).toFixed(2));

    await query(`
      INSERT INTO water_quality_records (
        id, visit_id, temperature_c, ph, salinity_ppt, dissolved_oxygen_mg_l, ammonia_mg_l, nitrite_mg_l, alkalinity_mg_l, transparency_cm, water_color, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 35.0, ?, 'Water parameters within optimum aquaculture threshold')
      ON DUPLICATE KEY UPDATE
        temperature_c=VALUES(temperature_c), ph=VALUES(ph), salinity_ppt=VALUES(salinity_ppt),
        dissolved_oxygen_mg_l=VALUES(dissolved_oxygen_mg_l), ammonia_mg_l=VALUES(ammonia_mg_l),
        nitrite_mg_l=VALUES(nitrite_mg_l), alkalinity_mg_l=VALUES(alkalinity_mg_l)
    `, [i, i, temp, ph, sal, doVal, amm, nit, alk, WATER_COLORS[i % WATER_COLORS.length]]);

    // Biomass Record
    if (i <= 60) {
      const avgWt = Number((8.0 + (i * 0.35)).toFixed(2));
      const estBio = Number((avgWt * 180 + 800).toFixed(2));
      const survival = Number((82.0 + (i % 12)).toFixed(2));
      const fcr = Number((1.20 + (i % 5) * 0.03).toFixed(3));

      await query(`
        INSERT INTO biomass_records (
          id, visit_id, sample_count, total_sample_weight_g, average_weight_g, estimated_biomass_kg, estimated_population, survival_percentage, fcr
        ) VALUES (?, ?, 50, ?, ?, ?, 75000, ?, ?)
        ON DUPLICATE KEY UPDATE
          average_weight_g=VALUES(average_weight_g), estimated_biomass_kg=VALUES(estimated_biomass_kg),
          survival_percentage=VALUES(survival_percentage), fcr=VALUES(fcr)
      `, [i, i, avgWt * 50, avgWt, estBio, survival, fcr]);
    }

    // Health Record
    if (i <= 40) {
      const severities = ['NORMAL', 'NORMAL', 'LOW', 'NORMAL', 'MEDIUM'];
      await query(`
        INSERT INTO health_records (
          id, visit_id, mortality_count, symptoms, disease_suspected, severity, action_taken, remarks
        ) VALUES (?, ?, 0, 'Gut full with feed, active swimming, clean hepatopancreas', 'None', ?, 'Recommended continuing current feeding schedule', 'Shrimp vigor excellent')
        ON DUPLICATE KEY UPDATE severity=VALUES(severity)
      `, [i, i, severities[i % severities.length]]);
    }

    // Feeding Records
    if (i <= 70) {
      const feedKg = Number((45 + (i % 10) * 12).toFixed(2));
      await query(`
        INSERT INTO feed_records (
          id, culture_cycle_id, visit_id, feed_product_id, feed_date, quantity_kg, feeding_count, feeding_method, remarks, recorded_by
        ) VALUES (?, ?, ?, ?, ?, ?, 4, 'Check Tray & Manual Broadcasting', 'Feed consumed completely within 1.5 hours', 1)
        ON DUPLICATE KEY UPDATE quantity_kg=VALUES(quantity_kg), feed_date=VALUES(feed_date)
      `, [i, (i % 60) + 1, i, (i % 6) + 1, visitDate.toISOString().split('T')[0], feedKg]);
    }

    // Recommendations
    if (i <= 40) {
      const categories = ['FEED', 'WATER', 'HEALTH', 'BIOMASS'];
      const recs = [
        'Increase Royals Grower Plus feed allowance by 5% following positive check tray inspection.',
        'Apply agricultural limestone (150 kg/acre) during evening to stabilize pond alkalinity.',
        'Run aerators during 11:00 PM to 06:00 AM to maintain dissolved oxygen above 5.5 ppm.',
        'Weekly biomass check indicated robust weight gain; maintain current protein regime.'
      ];
      await query(`
        INSERT INTO recommendations (
          id, visit_id, technician_id, category, recommendation, priority, status, reviewed_by, reviewed_at
        ) VALUES (?, ?, 3, ?, ?, 'MEDIUM', 'REVIEWED', 2, NOW())
        ON DUPLICATE KEY UPDATE recommendation=VALUES(recommendation), status=VALUES(status)
      `, [i, i, categories[i % categories.length], recs[i % recs.length]]);
    }
  }
  console.log('✓ 10. 100 Field Visits, Water Quality, Biomass, Health & Feed records seeded');

  // 11. Seed SUBMISSIONS (60+ real GPS location submissions across Andhra Pradesh for Live Map)
  const TEST_TYPES = ['Water Quality Test', 'Water Quality Test', 'Feed Check Analysis', 'Biomass Sampling', 'Shrimp Health Assessment'];
  const SUB_STATUSES = ['VERIFIED', 'VERIFIED', 'VERIFIED', 'PENDING_VERIFICATION', 'PENDING_VERIFICATION', 'FLAGGED'];

  // Clear previous sample submissions to ensure clean live GPS plotting
  await query('DELETE FROM submissions');

  for (let i = 1; i <= 65; i++) {
    const sId = `SUB_${String(i).padStart(4, '0')}`;
    const hub = AQUA_HUBS[(i - 1) % AQUA_HUBS.length];
    const loc = getRandomLocation(hub);
    const farmer = farmerRecords[(i - 1) % farmerRecords.length];
    const tank = tanksRecords[(i - 1) % tanksRecords.length];
    const isAgent = (i % 4 !== 0);
    const staffUser = isAgent ? agents[(i - 1) % agents.length] : incharges[(i - 1) % incharges.length];
    const role = isAgent ? 'Agent' : 'Incharge';
    const testType = TEST_TYPES[i % TEST_TYPES.length];
    const status = SUB_STATUSES[i % SUB_STATUSES.length];

    // Spread submissions across today and past 14 days
    const daysAgo = Math.floor((i - 1) / 5);
    const subDateObj = new Date(Date.now() - daysAgo * 86400000);
    const dateStr = subDateObj.toISOString().split('T')[0];
    const hours = 7 + (i * 2) % 11;
    const minutes = (i * 13) % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    const submissionTime = `${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
    const accuracy = Number((4.5 + (i % 6) * 1.5).toFixed(2));

    const testData = {
      ph: (7.6 + (i % 6) * 0.1).toFixed(2),
      do: (5.2 + (i % 5) * 0.4).toFixed(2),
      salinity: `${10 + (i % 14)} ppt`,
      temperature: `${(28.0 + (i % 4) * 0.7).toFixed(1)}°C`,
      alkalinity: `${125 + (i % 8) * 5} ppm`,
      ammonia: `${(0.02 + (i % 5) * 0.01).toFixed(3)} ppm`,
      nitrite: `${(0.01 + (i % 4) * 0.005).toFixed(3)} ppm`,
      transparency: `${32 + (i % 8)} cm`,
      abw: `${(10.5 + (i % 15) * 0.8).toFixed(1)}g`,
      biomass: `${(2400 + (i % 20) * 150).toLocaleString()} kg`,
      notes: `Field verification completed at ${loc.village} aquaculture cluster. Water clarity optimal.`,
      gps: {
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy,
        locality: loc.locality,
      }
    };

    await query(`
      INSERT INTO submissions (
        id, agent_id, user_id, user_name, role, farmer_id, tank_id, test_type, date,
        submission_time, status, data, latitude, longitude, accuracy, locality, submitted_ago, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sId, staffUser.id, staffUser.id, staffUser.name, role, farmer.id, tank.id, testType, dateStr,
      submissionTime, status, JSON.stringify(testData), loc.latitude, loc.longitude, accuracy, loc.locality,
      daysAgo === 0 ? 'Today' : `${daysAgo}d ago`, subDateObj
    ]);
  }
  console.log('✓ 11. 65 Submissions seeded with full GPS coordinates & aquaculture metrics');

  // 12. Seed HARVESTS (30 realistic commercial harvests)
  for (let i = 1; i <= 30; i++) {
    const hId = `HARV_${String(i).padStart(3, '0')}`;
    const tank = tanksRecords[(i - 1) % tanksRecords.length];
    const farmer = farmerRecords[(i - 1) % farmerRecords.length];
    const harvestDate = new Date(Date.now() - (i * 4) * 86400000).toISOString().split('T')[0];
    const countPerKg = 24 + (i % 18) * 2;
    const avgWeightG = Number((1000 / countPerKg).toFixed(1));
    const qtyKg = Number((2200 + (i % 12) * 350).toFixed(2));
    const pricePerKg = Number((320 + (60 - countPerKg) * 5.5).toFixed(2));
    const totalRevenue = Number((qtyKg * pricePerKg).toFixed(2));
    const buyers = ['Apex Frozen Foods', 'Avanti Feeds Export', 'Devi Fisheries', 'Sandhya Aqua', 'Nekkanti Sea Foods'];

    await query(`
      INSERT INTO harvests (
        id, tank_id, farmer_id, culture_cycle_id, harvest_code, harvest_date, date, harvest_type,
        quantity_kg, average_weight_g, count_per_kg, price_per_kg, total_value, revenue, quality,
        buyer_name, recorded_by, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'FULL_HARVEST', ?, ?, ?, ?, ?, ?, 'Grade A Export', ?, 'INC001', 'Complete harvest finalized with premium count grade')
      ON DUPLICATE KEY UPDATE
        quantity_kg=VALUES(quantity_kg), revenue=VALUES(revenue), total_value=VALUES(total_value), harvest_date=VALUES(harvest_date)
    `, [
      hId, tank.id, farmer.id, `CYCLE_2026_${String(i).padStart(3, '0')}`, `HARV_CODE_${i}`, harvestDate, harvestDate,
      qtyKg, avgWeightG, countPerKg, pricePerKg, totalRevenue, totalRevenue, buyers[i % buyers.length]
    ]);
  }
  console.log('✓ 12. 30 Harvest records seeded with market values and buyers');

  // 13. Seed NOTIFICATIONS & AUDIT LOGS
  for (let i = 1; i <= 25; i++) {
    await query(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
      VALUES (?, ?, ?, ?, 'POND_ALERT', 0, NOW())
      ON DUPLICATE KEY UPDATE title=VALUES(title)
    `, [
      i, (i % 6) + 1,
      `Pond Test Completed: TANK${String((i % 20) + 1).padStart(3, '0')}`,
      `Field Agent submitted new water quality report for verification.`
    ]);

    await query(`
      INSERT INTO audit_logs (id, user_id, action, table_name, record_id, ip_address, created_at)
      VALUES (?, 1, 'UPDATE', 'submissions', ?, '127.0.0.1', NOW())
      ON DUPLICATE KEY UPDATE action=VALUES(action)
    `, [i, i]);
  }
  console.log('✓ 13. Notifications & Audit Logs seeded');

  await query('SET FOREIGN_KEY_CHECKS = 1');

  console.log('\n\x1b[32m============================================================\x1b[0m');
  console.log('\x1b[1;32m  ✓ SEEDING COMPLETED SUCCESSFULLY!                         \x1b[0m');
  console.log('\x1b[32m============================================================\x1b[0m\n');
}

runSeed().then(() => {
  console.log('Seeder process completed.');
  process.exit(0);
}).catch((err) => {
  console.error('Fatal seeder error:', err);
  process.exit(1);
});
