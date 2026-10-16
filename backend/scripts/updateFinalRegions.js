import { query } from '../src/config/database.js';

const updateFinalRegions = async () => {
  const finalRegions = [
    { id: 'REG_ELU', code: 'ELU', name: 'Eluru' },
    { id: 'REG_KKL', code: 'KKL', name: 'Kaikaluru' },
    { id: 'REG_KLD', code: 'KLD', name: 'Kaldhindi' },
    { id: 'REG_AKV', code: 'AKV', name: 'Akividu' },
    { id: 'REG_BVRM', code: 'BVRM', name: 'Bhimavaram' },
    { id: 'REG_GNP', code: 'GNP', name: 'Ganapavaram' },
    { id: 'REG_MLKP', code: 'MLKP', name: 'Malkipuram' },
    { id: 'REG_AMP', code: 'AMP', name: 'Amalapuram' },
    { id: 'REG_MUM', code: 'MUM', name: 'Mummidivaram' },
    { id: 'REG_KKD', code: 'KKD', name: 'Kakinada' },
    { id: 'REG_SKLM', code: 'SKLM', name: 'Srikakulam' },
    { id: 'REG_MPM', code: 'MPM', name: 'Machilipatnam' },
    { id: 'REG_BPT', code: 'BPT', name: 'Bapatla' }
  ];

  // Remove temporary/obsolete entries from regions table
  await query("DELETE FROM regions WHERE id IN ('REG_MUM_KKD', 'REG_PKL', 'REG_BVRM', 'REG003')");

  // Keep existing standard IDs aligned
  await query("UPDATE regions SET code = 'BVRM', name = 'Bhimavaram' WHERE id = 'REG001'");
  await query("UPDATE regions SET code = 'KKD', name = 'Kakinada' WHERE id = 'REG002'");
  await query("UPDATE regions SET code = 'MPM', name = 'Machilipatnam' WHERE id = 'REG005'");

  for (const r of finalRegions) {
    // If an existing record already has this name or code, update it, otherwise insert
    const [existing] = await query(
      "SELECT id FROM regions WHERE LOWER(name) = LOWER(?) OR LOWER(code) = LOWER(?) OR id = ?",
      [r.name, r.code, r.id]
    );

    if (existing) {
      await query(
        "UPDATE regions SET code = ?, name = ?, status = 'ACTIVE' WHERE id = ?",
        [r.code, r.name, existing.id]
      );
    } else {
      await query(
        `INSERT INTO regions (id, code, name, active_ponds, total_yield, avg_fcr, status)
         VALUES (?, ?, ?, 0, '0 Tons', 1.25, 'ACTIVE')`,
        [r.id, r.code, r.name]
      );
    }
  }

  // Also remove obsolete from localities
  await query("DELETE FROM localities WHERE region_id IN ('REG_MUM_KKD', 'REG_PKL')");

  const finalLocalities = [
    { id: 'LOC-ELU-1', region_id: 'REG_ELU', name: 'Eluru' },
    { id: 'LOC-KKL-1', region_id: 'REG_KKL', name: 'Kaikaluru' },
    { id: 'LOC-KLD-1', region_id: 'REG_KLD', name: 'Kaldhindi' },
    { id: 'LOC-AKV-1', region_id: 'REG_AKV', name: 'Akividu' },
    { id: 'LOC-BVRM-1', region_id: 'REG_BVRM', name: 'Bhimavaram' },
    { id: 'LOC-GNP-1', region_id: 'REG_GNP', name: 'Ganapavaram' },
    { id: 'LOC-MLKP-1', region_id: 'REG_MLKP', name: 'Malkipuram' },
    { id: 'LOC-AMP-1', region_id: 'REG_AMP', name: 'Amalapuram' },
    { id: 'LOC-MUM-1', region_id: 'REG_MUM', name: 'Mummidivaram' },
    { id: 'LOC-KKD-1', region_id: 'REG_KKD', name: 'Kakinada' },
    { id: 'LOC-SKLM-1', region_id: 'REG_SKLM', name: 'Srikakulam' },
    { id: 'LOC-MPM-1', region_id: 'REG_MPM', name: 'Machilipatnam' },
    { id: 'LOC-BPT-1', region_id: 'REG_BPT', name: 'Bapatla' }
  ];

  for (const l of finalLocalities) {
    await query(
      `INSERT INTO localities (id, region_id, name)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), region_id = VALUES(region_id)`,
      [l.id, l.region_id, l.name]
    );
  }

  const all = await query('SELECT id, code, name FROM regions ORDER BY name ASC');
  console.log('Database updated successfully. Current regions:');
  console.log(JSON.stringify(all));
  process.exit(0);
};

updateFinalRegions().catch(err => {
  console.error('[Error]:', err);
  process.exit(1);
});
