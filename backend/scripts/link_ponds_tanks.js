import { query } from '../src/config/database.js';

async function main() {
  const updateRes = await query(`
    UPDATE ponds 
    SET tank_id = CONCAT('TANK', LPAD(id, 3, '0')) 
    WHERE id BETWEEN 1 AND 60 AND (tank_id IS NULL OR tank_id = '')
  `);
  console.log('Updated ponds tank_id:', updateRes);

  const [count] = await query('SELECT count(*) as c FROM ponds WHERE tank_id IS NOT NULL');
  console.log('Total ponds with tank_id:', count.c);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
