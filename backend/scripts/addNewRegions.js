import { query } from '../src/config/database.js';

const seedNewRegions = async () => {
  const regions = [
    { id: 'REG_ELU', code: 'Elu', name: 'Elu' },
    { id: 'REG_KKL', code: 'KKl', name: 'KKl' },
    { id: 'REG_KLD', code: 'Kld', name: 'Kld' },
    { id: 'REG_AKV', code: 'AKV', name: 'AKV' },
    { id: 'REG_BVRM', code: 'Bvrm', name: 'Bvrm' },
    { id: 'REG_GNP', code: 'GNP', name: 'GNP' },
    { id: 'REG_PKL', code: 'PKL', name: 'PKL' },
    { id: 'REG_MLKP', code: 'Mlkp', name: 'Mlkp' },
    { id: 'REG_AMP', code: 'AMP', name: 'AMP' },
    { id: 'REG_MUM_KKD', code: 'MUM KKD', name: 'MUM KKD' },
    { id: 'REG_SKLM', code: 'Sklm', name: 'Sklm' }
  ];

  for (const r of regions) {
    await query(
      `INSERT INTO regions (id, code, name, active_ponds, total_yield, avg_fcr, status)
       VALUES (?, ?, ?, 0, '0 Tons', 1.25, 'ACTIVE')
       ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), status = 'ACTIVE'`,
      [r.id, r.code, r.name]
    );
  }

  const localities = [
    { id: 'LOC-ELU-1', region_id: 'REG_ELU', name: 'Eluru' },
    { id: 'LOC-ELU-2', region_id: 'REG_ELU', name: 'Denduluru' },
    { id: 'LOC-KKL-1', region_id: 'REG_KKL', name: 'Kaikaluru' },
    { id: 'LOC-KKL-2', region_id: 'REG_KKL', name: 'Mudinepalli' },
    { id: 'LOC-KLD-1', region_id: 'REG_KLD', name: 'Kalidindi' },
    { id: 'LOC-AKV-1', region_id: 'REG_AKV', name: 'Akiveedu' },
    { id: 'LOC-BVRM-1', region_id: 'REG_BVRM', name: 'Bhimavaram' },
    { id: 'LOC-BVRM-2', region_id: 'REG_BVRM', name: 'Undi' },
    { id: 'LOC-GNP-1', region_id: 'REG_GNP', name: 'Ganapavaram' },
    { id: 'LOC-PKL-1', region_id: 'REG_PKL', name: 'Palakollu' },
    { id: 'LOC-MLKP-1', region_id: 'REG_MLKP', name: 'Malikipuram' },
    { id: 'LOC-AMP-1', region_id: 'REG_AMP', name: 'Amalapuram' },
    { id: 'LOC-MUMKKD-1', region_id: 'REG_MUM_KKD', name: 'Mummidivaram' },
    { id: 'LOC-MUMKKD-2', region_id: 'REG_MUM_KKD', name: 'Kakinada' },
    { id: 'LOC-SKLM-1', region_id: 'REG_SKLM', name: 'Srikakulam' }
  ];

  for (const l of localities) {
    await query(
      `INSERT INTO localities (id, region_id, name)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [l.id, l.region_id, l.name]
    );
  }

  console.log('Successfully seeded all 11 new regions and localities into MySQL database');
  process.exit(0);
};

seedNewRegions().catch((err) => {
  console.error('[Error seeding new regions]:', err);
  process.exit(1);
});
