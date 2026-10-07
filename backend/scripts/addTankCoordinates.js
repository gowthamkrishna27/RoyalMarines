import { query, checkDatabaseConnection } from '../src/config/database.js';

async function run() {
  console.log('\n--- Adding Tank Coordinates to Database ---');
  const conn = await checkDatabaseConnection();
  if (!conn.success) {
    console.error('Database connection failed:', conn.error);
    process.exit(1);
  }

  // 1. Add latitude and longitude columns to tanks table if not present
  const existingCols = (await query('DESCRIBE tanks')).map(c => c.Field);
  
  if (!existingCols.includes('latitude')) {
    console.log('Adding column `latitude` to tanks table...');
    await query('ALTER TABLE tanks ADD COLUMN latitude DECIMAL(10, 7) NULL');
  } else {
    console.log('Column `latitude` already exists on tanks.');
  }

  if (!existingCols.includes('longitude')) {
    console.log('Adding column `longitude` to tanks table...');
    await query('ALTER TABLE tanks ADD COLUMN longitude DECIMAL(10, 7) NULL');
  } else {
    console.log('Column `longitude` already exists on tanks.');
  }

  if (!existingCols.includes('location')) {
    console.log('Adding column `location` to tanks table...');
    await query('ALTER TABLE tanks ADD COLUMN location VARCHAR(255) NULL');
  }

  // 2. Fetch all tanks and match with farmers coordinates
  const tanks = await query(`
    SELECT t.id, t.name, t.farmer_id, f.latitude as f_lat, f.longitude as f_lng, f.village, f.mandal
    FROM tanks t
    LEFT JOIN farmers f ON (t.farmer_id COLLATE utf8mb4_0900_ai_ci = f.id COLLATE utf8mb4_0900_ai_ci)
  `);

  console.log(`Processing coordinates for ${tanks.length} tanks...`);

  // Coastal Andhra default hub if farmer not found
  const defaultHub = { lat: 16.5449, lng: 81.5212, locality: 'Bhimavaram Rural' };

  for (let i = 0; i < tanks.length; i++) {
    const t = tanks[i];
    const baseLat = t.f_lat ? parseFloat(t.f_lat) : defaultHub.lat;
    const baseLng = t.f_lng ? parseFloat(t.f_lng) : defaultHub.lng;

    // Realistic pond-level micro offset (~40m to 180m from farmer base)
    const latOffset = (Math.random() - 0.5) * 0.0035;
    const lngOffset = (Math.random() - 0.5) * 0.0035;

    const tankLat = Number((baseLat + latOffset).toFixed(7));
    const tankLng = Number((baseLng + lngOffset).toFixed(7));
    const tankLoc = t.village ? `${t.village}, ${t.mandal}` : 'Bhimavaram Delta, West Godavari';

    await query(`
      UPDATE tanks
      SET latitude = ?, longitude = ?, location = ?
      WHERE id = ?
    `, [tankLat, tankLng, tankLoc, t.id]);
  }

  console.log(`✓ All ${tanks.length} tanks successfully updated with GPS coordinates!`);

  // Verify sample updated tanks
  const sample = await query('SELECT id, name, farmer_id, latitude, longitude, location FROM tanks LIMIT 5');
  console.log('\nSample Updated Tanks:');
  console.log(JSON.stringify(sample, null, 2));

  process.exit(0);
}

run().catch(err => {
  console.error('Error adding tank coordinates:', err);
  process.exit(1);
});
