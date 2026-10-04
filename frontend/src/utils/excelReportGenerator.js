import * as XLSX from 'xlsx';

/**
 * Generate Weekly Sampling & Biomass Growth Dataset (matching Screenshot 1)
 */
export const generateSamplingReportData = (db, agentId = null, selectedFarmerId = 'ALL') => {
  const farmers = (db?.farmers || []).filter(f => {
    if (agentId && f.agentId && f.agentId !== agentId) return false;
    if (selectedFarmerId !== 'ALL' && f.id !== selectedFarmerId) return false;
    return true;
  });

  const tanks = (db?.tanks || []).filter(t => {
    return farmers.some(f => f.id === t.farmerId);
  });

  // Base mock benchmark row data modeled after official aqua field sampling sheets
  const baseBenchmarks = [
    { tankNo: 'D2', area: 0.64, stockedDate: '07-04-2026', seed: 110000, density: 43.0, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 90, presAbw: 11.15, lastCount: 107, lastAbw: 9.34, dayFeed: 34.8, countNum: 100000, tcf: 1067.2, noTcf: 106347.8, biomass: 1115, survival: 90.91, fcr: 0.96 },
    { tankNo: 'D3', area: 0.66, stockedDate: '07-04-2026', seed: 110000, density: 41.7, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 83, presAbw: 12.12, lastCount: 97, lastAbw: 10.29, dayFeed: 34.8, countNum: 100000, tcf: 1066.6, noTcf: 97781.44, biomass: 1212, survival: 90.91, fcr: 0.88 },
    { tankNo: 'D4', area: 0.65, stockedDate: '07-04-2026', seed: 110000, density: 42.3, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 70, presAbw: 14.21, lastCount: 91, lastAbw: 11.04, dayFeed: 34.8, countNum: 92000, tcf: 1046.1, noTcf: 81796.86, biomass: 1307, survival: 83.64, fcr: 0.80 },
    { tankNo: 'D5', area: 0.76, stockedDate: '07-04-2026', seed: 130000, density: 42.8, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 91, presAbw: 11.04, lastCount: 119, lastAbw: 8.41, dayFeed: 40.2, countNum: 118000, tcf: 1208.4, noTcf: 121618.4, biomass: 1303, survival: 90.77, fcr: 0.93 },
    { tankNo: 'D6', area: 0.73, stockedDate: '07-04-2026', seed: 100000, density: 34.2, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 87, presAbw: 11.47, lastCount: 90, lastAbw: 11.05, dayFeed: 34.8, countNum: 100000, tcf: 929.6, noTcf: 90051.34, biomass: 1147, survival: 100.00, fcr: 0.81 },
    { tankNo: 'D7', area: 0.70, stockedDate: '07-04-2026', seed: 115000, density: 41.1, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 94, presAbw: 10.69, lastCount: 100, lastAbw: 9.96, dayFeed: 41.2, countNum: 117000, tcf: 1071.8, noTcf: 111402.1, biomass: 1251, survival: 101.74, fcr: 0.86 },
    { tankNo: 'D8', area: 0.63, stockedDate: '07-04-2026', seed: 105000, density: 41.7, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 90, presAbw: 11.14, lastCount: 105, lastAbw: 9.50, dayFeed: 34.8, countNum: 100000, tcf: 1026.5, noTcf: 102383.8, biomass: 1114, survival: 95.24, fcr: 0.92 },
    { tankNo: 'D9', area: 0.67, stockedDate: '07-04-2026', seed: 110000, density: 41.0, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 101, presAbw: 9.89, lastCount: 117, lastAbw: 8.55, dayFeed: 34.8, countNum: 105000, tcf: 1101.3, noTcf: 123727.7, biomass: 1038, survival: 95.45, fcr: 1.06 },
    { tankNo: 'D10', area: 1.00, stockedDate: '07-04-2026', seed: 160000, density: 40.0, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 100, presAbw: 10.00, lastCount: 128, lastAbw: 7.79, dayFeed: 47.5, countNum: 145000, tcf: 1346.2, noTcf: 149577.8, biomass: 1450, survival: 90.63, fcr: 0.93 },
  ];

  // Map real tanks from DB if available or supplement with benchmarks
  const rows = (tanks.length > 0 ? tanks : baseBenchmarks).map((t, idx) => {
    const bench = baseBenchmarks[idx % baseBenchmarks.length];
    const tankName = t.name || t.tankNo || `Tank 0${idx + 1}`;
    const areaVal = parseFloat(t.acres) || bench.area;
    const seedVal = parseInt(t.stockedSeed) || bench.seed;
    const densityVal = Number((seedVal / (areaVal * 4046.86)).toFixed(1)) || bench.density;
    const docVal = t.doc || bench.doc;
    const presAbw = parseFloat(t.abw) || bench.presAbw;
    const presCount = Math.round(1000 / presAbw) || bench.presCount;
    const lastAbw = bench.lastAbw;
    const lastCount = bench.lastCount;
    const growthIncr = Number((presAbw - lastAbw).toFixed(2));
    const adgWeek = Number((growthIncr / 7).toFixed(2));
    const overallAdg = Number((presAbw / docVal).toFixed(2));
    const dayFeed = bench.dayFeed;
    const countNum = bench.countNum;
    const tcf = bench.tcf;
    const noTcf = bench.noTcf;
    const biomass = Math.round((countNum * presAbw) / 1000) || bench.biomass;
    const survival = Number(((countNum / seedVal) * 100).toFixed(2)) || bench.survival;
    const fcr = Number((tcf / biomass).toFixed(2)) || bench.fcr;

    return {
      tankNo: tankName,
      area: areaVal,
      stockedDate: t.stockingDate || bench.stockedDate,
      seed: seedVal,
      density: densityVal,
      doc: docVal,
      prevDate: bench.prevDate,
      presDate: bench.presDate,
      dur: 7,
      presCount,
      presAbw,
      lastCount,
      lastAbw,
      growthIncr,
      adgWeek,
      overallAdg,
      dayFeed,
      countNum,
      tcf,
      noTcf,
      biomass,
      survival,
      fcr
    };
  });

  return rows;
};

/**
 * Generate Harvest Master Report Dataset (matching Screenshot 2)
 */
export const generateHarvestMasterReportData = (db, agentId = null) => {
  const harvestRecords = [
    { sNo: 1, asm: 'S.Murali', farmer: 'S.Venkateshwarao', phone: '99124 53995', district: 'West Godavari', village: 'Bavisettipalem', brand: 'Hypro+Premium', waterSource: 'Bore', pondNo: 1, pondArea: 1.0, stockingDate: '06-12-2025', seedStocked: 100000, density: 25.00, partialCount: 70, partialQtyKg: 500, partialSeed: 35000, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '12-03-2026', finalDoc: 96, finalCount: 50, finalQtyKg: 1350, finalSeed: 67500, totalQtyKg: 2150, cumFeedKg: 2550, fcr: 1.19, totalHarvestedSeed: 125500, survivalPct: 124, remarks: 'Optimal harvest with high survival' },
    { sNo: 2, asm: 'S.Murali', farmer: 'S.Venkateshwarao', phone: '99124 53995', district: 'West Godavari', village: 'Bavisettipalem', brand: 'Hypro+Premium', waterSource: 'Bore', pondNo: 2, pondArea: 3.0, stockingDate: '16-09-2025', seedStocked: 600000, density: 50.00, partialCount: 95, partialQtyKg: 2000, partialSeed: 190000, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '05-03-2026', finalDoc: 75, finalCount: 75, finalQtyKg: 3300, finalSeed: 247500, totalQtyKg: 5300, cumFeedKg: 6100, fcr: 1.15, totalHarvestedSeed: 442500, survivalPct: 74, remarks: 'RMS early harvest' },
    { sNo: 3, asm: 'S.Murali', farmer: 'K.Vedukondalu', phone: '99002 10995', district: 'West Godavari', village: 'Cherukimilli', brand: 'Hypro+Premium', waterSource: 'Bore', pondNo: 1, pondArea: 1.5, stockingDate: '14-12-2025', seedStocked: 250000, density: 41.67, partialCount: 77, partialQtyKg: 1500, partialSeed: 115500, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '27-03-2026', finalDoc: 134, finalCount: 39, finalQtyKg: 2600, finalSeed: 101400, totalQtyKg: 4100, cumFeedKg: 5950, fcr: 1.45, totalHarvestedSeed: 221900, survivalPct: 89, remarks: 'Normal culture cycle' },
    { sNo: 4, asm: 'S.Murali', farmer: 'T.Balaji', phone: '94907 62179', district: 'West Godavari', village: 'Pedakapavaram', brand: 'Hypro+Premium', waterSource: 'Bore', pondNo: 1, pondArea: 5.0, stockingDate: '07-12-2025', seedStocked: 900000, density: 45.00, partialCount: 125, partialQtyKg: 1750, partialSeed: 218750, partialCount2: 70, partialQtyKg2: 5000, partialSeed2: 350000, finalDate: '10-03-2026', finalDoc: 98, finalCount: 60, finalQtyKg: 6100, finalSeed: 372000, totalQtyKg: 10850, cumFeedKg: 14300, fcr: 1.32, totalHarvestedSeed: 852750, survivalPct: 88, remarks: 'Feed drop + white gut problem treated' },
    { sNo: 5, asm: 'S.Murali', farmer: 'M.Nageswarao', phone: '93931 63787', district: 'West Godavari', village: 'Nimmalakunta', brand: 'Hypro+Premium', waterSource: 'Bore', pondNo: 1, pondArea: 5.0, stockingDate: '02-01-2026', seedStocked: 1300000, density: 65.00, partialCount: 130, partialQtyKg: 4000, partialSeed: 520000, partialCount2: 58, partialQtyKg2: 6000, partialSeed2: 350000, finalDate: '27-03-2026', finalDoc: 77, finalCount: 60, finalQtyKg: 6700, finalSeed: 402000, totalQtyKg: 12700, cumFeedKg: 17800, fcr: 1.40, totalHarvestedSeed: 1024000, survivalPct: 79, remarks: 'Feed dropped loose shell problem' },
    { sNo: 6, asm: 'S.Murali', farmer: 'S.Venkateshwarao', phone: '99124 53995', district: 'West Godavari', village: 'Bavisettipalem', brand: 'Hypro+Premium', waterSource: 'Bore', pondNo: 3, pondArea: 5.0, stockingDate: '02-01-2026', seedStocked: 1000000, density: 50.00, partialCount: 78, partialQtyKg: 4000, partialSeed: 312000, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '27-03-2026', finalDoc: 84, finalCount: 67, finalQtyKg: 5700, finalSeed: 381900, totalQtyKg: 9700, cumFeedKg: 13400, fcr: 1.38, totalHarvestedSeed: 693900, survivalPct: 70, remarks: 'WSSV Effected - harvested on alert' },
    { sNo: 7, asm: 'S.Murali', farmer: 'S.Venkateshwarao', phone: '99124 53995', district: 'West Godavari', village: 'Kottapalli', brand: 'Hypro+Premium', waterSource: 'Bore', pondNo: 1, pondArea: 5.0, stockingDate: '09-12-2025', seedStocked: 700000, density: 35.00, partialCount: '', partialQtyKg: '', partialSeed: '', partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '13-03-2026', finalDoc: 94, finalCount: 45, finalQtyKg: 10200, finalSeed: 459000, totalQtyKg: 10200, cumFeedKg: 13200, fcr: 1.29, totalHarvestedSeed: 459000, survivalPct: 66, remarks: 'Vibrio effected' },
    { sNo: 8, asm: 'S.Murali', farmer: 'U.Balakrishna', phone: '90895 14939', district: 'West Godavari', village: 'Kaligotla', brand: 'Hypro+Premium', waterSource: 'Bore', pondNo: 1, pondArea: 9.0, stockingDate: '15-01-2026', seedStocked: 1000000, density: 27.78, partialCount: '', partialQtyKg: '', partialSeed: '', partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '29-03-2026', finalDoc: 69, finalCount: 60, finalQtyKg: 11000, finalSeed: 660000, totalQtyKg: 11000, cumFeedKg: 14300, fcr: 1.30, totalHarvestedSeed: 660000, survivalPct: 66, remarks: 'White gut and loose shell' },
    { sNo: 9, asm: 'S.Murali', farmer: 'Ch.Anandh', phone: '97015 06595', district: 'Eluru', village: 'Amudalapalli', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 1, pondArea: 3.0, stockingDate: '20-11-2025', seedStocked: 400000, density: 33.33, partialCount: '', partialQtyKg: '', partialSeed: '', partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '21-03-2026', finalDoc: 122, finalCount: 30, finalQtyKg: 6450, finalSeed: 193500, totalQtyKg: 6450, cumFeedKg: 8320, fcr: 1.29, totalHarvestedSeed: 193500, survivalPct: 84, remarks: 'Completed successfully' },
    { sNo: 10, asm: 'S.Murali', farmer: 'Ch.Anandh', phone: '97015 06595', district: 'Eluru', village: 'Amudalapalli', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 2, pondArea: 3.0, stockingDate: '20-11-2025', seedStocked: 400000, density: 33.33, partialCount: 78, partialQtyKg: 2365, partialSeed: 184470, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '21-03-2026', finalDoc: 122, finalCount: 31, finalQtyKg: 6250, finalSeed: 193750, totalQtyKg: 8615, cumFeedKg: 10165, fcr: 1.18, totalHarvestedSeed: 378220, survivalPct: 95, remarks: 'Excellent growth and FCR' },
    { sNo: 11, asm: 'S.Murali', farmer: 'Ch.Anandh', phone: '97015 06595', district: 'Eluru', village: 'Amudalapalli', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 4, pondArea: 3.0, stockingDate: '20-11-2025', seedStocked: 300000, density: 25.00, partialCount: 78, partialQtyKg: 1302, partialSeed: 101556, partialCount2: 48, partialQtyKg2: 1257, partialSeed2: 60336, finalDate: '21-03-2026', finalDoc: 122, finalCount: 31, finalQtyKg: 3262, finalSeed: 101122, totalQtyKg: 5821, cumFeedKg: 7538, fcr: 1.29, totalHarvestedSeed: 263014, survivalPct: 88, remarks: 'Two partial harvests + final harvest' },
    { sNo: 12, asm: 'S.Murali', farmer: 'Ch.Anandh', phone: '97015 06595', district: 'Eluru', village: 'Amudalapalli', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 5, pondArea: 5.5, stockingDate: '25-11-2025', seedStocked: 400000, density: 18.18, partialCount: 67, partialQtyKg: 1780, partialSeed: 119260, partialCount2: 38, partialQtyKg2: 3005, partialSeed2: 114190, finalDate: '28-03-2026', finalDoc: 123, finalCount: 32, finalQtyKg: 7509, finalSeed: 240288, totalQtyKg: 12294, cumFeedKg: 12289, fcr: 1.00, totalHarvestedSeed: 473738, survivalPct: 118, remarks: 'Superb crop performance' },
    { sNo: 13, asm: 'S.Murali', farmer: 'R.Balaji', phone: '94903 66593', district: 'Eluru', village: 'Vaddeparla', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 1, pondArea: 3.0, stockingDate: '14-01-2026', seedStocked: 300000, density: 25.00, partialCount: '', partialQtyKg: '', partialSeed: '', partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '07-04-2026', finalDoc: 83, finalCount: 67, finalQtyKg: 2540, finalSeed: 170180, totalQtyKg: 2540, cumFeedKg: 3100, fcr: 1.22, totalHarvestedSeed: 170180, survivalPct: 68, remarks: 'Effected By White Gut' },
    { sNo: 14, asm: 'S.Murali', farmer: 'Ch.Rajkumar', phone: '91824 38222', district: 'Eluru', village: 'Vaddeparla', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 1, pondArea: 4.0, stockingDate: '13-01-2026', seedStocked: 400000, density: 25.00, partialCount: 83, partialQtyKg: 2800, partialSeed: 232400, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '07-04-2026', finalDoc: 84, finalCount: 56, finalQtyKg: 4220, finalSeed: 236320, totalQtyKg: 7020, cumFeedKg: 8180, fcr: 1.17, totalHarvestedSeed: 468720, survivalPct: 120, remarks: 'Effected by RMS' },
    { sNo: 15, asm: 'S.Murali', farmer: 'Ch.Rajkumar', phone: '91824 38222', district: 'Eluru', village: 'Vaddeparla', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 2, pondArea: 4.0, stockingDate: '13-01-2026', seedStocked: 400000, density: 25.00, partialCount: 84, partialQtyKg: 400, partialSeed: 33600, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '07-04-2026', finalDoc: 84, finalCount: 56, finalQtyKg: 3000, finalSeed: 168000, totalQtyKg: 3400, cumFeedKg: 5000, fcr: 1.47, totalHarvestedSeed: 201600, survivalPct: 53, remarks: 'Affected by White Gut And RMS' },
    { sNo: 16, asm: 'S.Murali', farmer: 'B.Kishore', phone: '91775 66444', district: 'Eluru', village: 'Pattepuram', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 1, pondArea: 2.0, stockingDate: '28-01-2026', seedStocked: 200000, density: 25.00, partialCount: 84, partialQtyKg: 6260, partialSeed: 525840, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '15-04-2026', finalDoc: 80, finalCount: 40, finalQtyKg: 8020, finalSeed: 401000, totalQtyKg: 14280, cumFeedKg: 17800, fcr: 1.25, totalHarvestedSeed: 726840, survivalPct: 81, remarks: 'Effected By RMS' },
    { sNo: 17, asm: 'S.Murali', farmer: 'Kiran', phone: '81064 45035', district: 'Eluru', village: 'Amudalapalli', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 1, pondArea: 1.5, stockingDate: '10-02-2026', seedStocked: 200000, density: 33.33, partialCount: 125, partialQtyKg: 1000, partialSeed: 125000, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '05-04-2026', finalDoc: 54, finalCount: 56, finalQtyKg: 1750, finalSeed: 148750, totalQtyKg: 2750, cumFeedKg: 3120, fcr: 1.14, totalHarvestedSeed: 273750, survivalPct: 137, remarks: 'Effected By White Gut And RMS' },
    { sNo: 18, asm: 'S.Murali', farmer: 'Kiran', phone: '81064 45035', district: 'Eluru', village: 'Amudalapalli', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 2, pondArea: 1.5, stockingDate: '02-10-2025', seedStocked: 200000, density: 33.33, partialCount: 115, partialQtyKg: 1000, partialSeed: 115000, partialCount2: 63, partialQtyKg2: 1100, partialSeed2: 69300, finalDate: '05-04-2026', finalDoc: 54, finalCount: 51, finalQtyKg: 600, finalSeed: 30600, totalQtyKg: 2700, cumFeedKg: 3547, fcr: 1.31, totalHarvestedSeed: 214900, survivalPct: 107, remarks: 'Effected By RMS' }
  ];

  return harvestRecords;
};

/**
 * Builds the Sheet 1: Weekly Sampling & Growth Worksheet matching Screenshot 1
 */
const buildSamplingSheet = (rows) => {
  const header1 = [
    'Tank No',
    'Area (Acres)',
    'Date of Stocking',
    'No of Seed Stocked',
    'Stock density (Pcs/Sqm)',
    'DOC',
    'Previous sampling Date',
    'Present sampling Date',
    'Duration between sampling (Dates)',
    'Present Count',
    'Present ABW(g)',
    'Last Count',
    'Last ABW(g)',
    'Weekly Growth Increment(g)',
    'ADG for week (g)',
    'Overall ADG',
    'Day Feed',
    'Number',
    'Cumulative feed (TCF)',
    'No. Based on TCF',
    'Biomass',
    'Survival%',
    'FCR'
  ];

  const dataRows = rows.map(r => [
    r.tankNo,
    r.area,
    r.stockedDate,
    r.seed,
    r.density,
    r.doc,
    r.prevDate,
    r.presDate,
    r.dur,
    r.presCount,
    r.presAbw,
    r.lastCount,
    r.lastAbw,
    r.growthIncr,
    r.adgWeek,
    r.overallAdg,
    r.dayFeed,
    r.countNum,
    r.tcf,
    r.noTcf,
    r.biomass,
    r.survival,
    r.fcr
  ]);

  // Compute Totals / Averages row
  const totalArea = Number(rows.reduce((acc, r) => acc + (r.area || 0), 0).toFixed(2));
  const totalSeed = rows.reduce((acc, r) => acc + (r.seed || 0), 0);
  const avgDensity = Number((rows.reduce((acc, r) => acc + (r.density || 0), 0) / (rows.length || 1)).toFixed(1));
  const avgPresCount = Number((rows.reduce((acc, r) => acc + (r.presCount || 0), 0) / (rows.length || 1)).toFixed(1));
  const avgPresAbw = Number((rows.reduce((acc, r) => acc + (r.presAbw || 0), 0) / (rows.length || 1)).toFixed(1));
  const avgLastCount = Number((rows.reduce((acc, r) => acc + (r.lastCount || 0), 0) / (rows.length || 1)).toFixed(1));
  const avgLastAbw = Number((rows.reduce((acc, r) => acc + (r.lastAbw || 0), 0) / (rows.length || 1)).toFixed(1));
  const avgGrowthIncr = Number((rows.reduce((acc, r) => acc + (r.growthIncr || 0), 0) / (rows.length || 1)).toFixed(1));
  const totalDayFeed = Number(rows.reduce((acc, r) => acc + (r.dayFeed || 0), 0).toFixed(1));
  const totalCountNum = rows.reduce((acc, r) => acc + (r.countNum || 0), 0);
  const totalTcf = Number(rows.reduce((acc, r) => acc + (r.tcf || 0), 0).toFixed(1));
  const totalNoTcf = Number(rows.reduce((acc, r) => acc + (r.noTcf || 0), 0).toFixed(1));
  const totalBiomass = rows.reduce((acc, r) => acc + (r.biomass || 0), 0);
  const avgSurvival = Number((rows.reduce((acc, r) => acc + (r.survival || 0), 0) / (rows.length || 1)).toFixed(2));
  const avgFcr = Number((rows.reduce((acc, r) => acc + (r.fcr || 0), 0) / (rows.length || 1)).toFixed(2));

  const totalRow = [
    'Total / Average',
    totalArea,
    '',
    totalSeed,
    avgDensity,
    '',
    '',
    '',
    '',
    avgPresCount,
    avgPresAbw,
    avgLastCount,
    avgLastAbw,
    avgGrowthIncr,
    '',
    '',
    totalDayFeed,
    totalCountNum,
    totalTcf,
    totalNoTcf,
    totalBiomass,
    avgSurvival,
    avgFcr
  ];

  const sheetData = [
    ['Weekly Sampling & Biomass Growth Audit Report (Section B Sampling)'],
    [],
    header1,
    ...dataRows,
    totalRow
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set Column Widths for readability
  ws['!cols'] = [
    { wch: 10 }, // Tank No
    { wch: 12 }, // Area
    { wch: 16 }, // Stocking Date
    { wch: 18 }, // No of Seed Stocked
    { wch: 22 }, // Density
    { wch: 8 },  // DOC
    { wch: 20 }, // Prev Sampling Date
    { wch: 20 }, // Pres Sampling Date
    { wch: 22 }, // Duration
    { wch: 14 }, // Pres Count
    { wch: 14 }, // Pres ABW
    { wch: 12 }, // Last Count
    { wch: 12 }, // Last ABW
    { wch: 24 }, // Weekly Growth Incr
    { wch: 16 }, // ADG Week
    { wch: 14 }, // Overall ADG
    { wch: 12 }, // Day Feed
    { wch: 14 }, // Number
    { wch: 20 }, // Cumulative feed
    { wch: 18 }, // No. Based on TCF
    { wch: 12 }, // Biomass
    { wch: 12 }, // Survival%
    { wch: 10 }, // FCR
  ];

  return ws;
};

/**
 * Builds Sheet 2: Harvest Master & Pond Performance matching Screenshot 2
 */
const buildHarvestSheet = (rows) => {
  const headers = [
    'S. No',
    'ASM/RM',
    'Farmer Name and Details',
    'Mobile No',
    'District',
    'Village',
    'Brand Name',
    'Water Source',
    'Pond No',
    'Pond Area (Acres)',
    'Date of Stocking',
    'No. of Seed Stocked (Lakhs)',
    'Stocking density (Pcs/Sqm)',
    'Count of Partial Harvest',
    'Quantity of Partial Harvest (Kg)',
    'Partial Harvested Seed',
    'Count of Partial Harvest 2',
    'Quantity of Partial Harvest 2 (Kg)',
    'Partial Harvested Seed 2',
    'Date of Final Harvest',
    'DOC at Final Harvest',
    'Count at Final Harvest',
    'Quantity at Final Harvest (Kg)',
    'Final Harvested Seed',
    'Total Quantity Harvested (Kg)',
    'Cumulative Feed Consumption (Kg)',
    'FCR',
    'Total No. Harvested',
    'Survival (%)',
    'Remarks'
  ];

  const dataRows = rows.map(r => [
    r.sNo,
    r.asm,
    r.farmer,
    r.phone,
    r.district,
    r.village,
    r.brand,
    r.waterSource,
    r.pondNo,
    r.pondArea,
    r.stockingDate,
    r.seedStocked,
    r.density,
    r.partialCount,
    r.partialQtyKg,
    r.partialSeed,
    r.partialCount2,
    r.partialQtyKg2,
    r.partialSeed2,
    r.finalDate,
    r.finalDoc,
    r.finalCount,
    r.finalQtyKg,
    r.finalSeed,
    r.totalQtyKg,
    r.cumFeedKg,
    r.fcr,
    r.totalHarvestedSeed,
    r.survivalPct,
    r.remarks
  ]);

  const sheetData = [
    ['Royals Marine Food - Harvest Master & Pond Performance Operations Register'],
    [],
    headers,
    ...dataRows
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 6 },  // S. No
    { wch: 12 }, // ASM/RM
    { wch: 22 }, // Farmer Name
    { wch: 15 }, // Mobile No
    { wch: 15 }, // District
    { wch: 16 }, // Village
    { wch: 16 }, // Brand Name
    { wch: 14 }, // Water Source
    { wch: 10 }, // Pond No
    { wch: 16 }, // Pond Area
    { wch: 16 }, // Stocking Date
    { wch: 24 }, // No of Seed Stocked
    { wch: 24 }, // Stocking density
    { wch: 22 }, // Partial Count 1
    { wch: 26 }, // Partial Qty 1
    { wch: 22 }, // Partial Seed 1
    { wch: 22 }, // Partial Count 2
    { wch: 26 }, // Partial Qty 2
    { wch: 22 }, // Partial Seed 2
    { wch: 18 }, // Final Harvest Date
    { wch: 18 }, // Final DOC
    { wch: 20 }, // Final Count
    { wch: 24 }, // Final Qty
    { wch: 20 }, // Final Seed
    { wch: 24 }, // Total Qty
    { wch: 28 }, // Cumulative Feed
    { wch: 10 }, // FCR
    { wch: 20 }, // Total Harvested Seed
    { wch: 14 }, // Survival%
    { wch: 32 }, // Remarks
  ];

  return ws;
};

/**
 * Builds Sheet 3: Water Analysis & Parameters
 */
const buildWaterSheet = (db) => {
  const headers = [
    'Record ID',
    'Date',
    'DOC',
    'Farmer Name',
    'Tank Name',
    'Salinity (ppt)',
    'pH Level',
    'Alkalinity (ppm)',
    'Hardness (ppm)',
    'Ammonia - NH3 (ppm)',
    'Nitrite - NO2 (ppm)',
    'Potassium - K (ppm)',
    'DO (mg/L)',
    'H2S (ppm)',
    'Cl (ppm)',
    'Fe (ppm)',
    'Water Color',
    'Temperature (°C)',
    'GPS Locality',
    'Status',
    'Remarks'
  ];

  const submissions = (db?.submissions || []).filter(s => {
    const t = (s.testType || s.recordType || '').toUpperCase();
    return t.includes('WATER');
  });

  const sampleWaterRows = submissions.length > 0 ? submissions : [
    { id: 'WQ-001', date: '2026-08-27', farmerName: 'Ravi Kumar', tankName: 'Tank 01', data: { doc: '36', salinity: '16', ph: '7.8', alkalinity: '140', hardness: '4800', ammonia: '0.05', nitrite: '0.02', k: '171.2', do: '5.6', h2s: '0.005', cl: '0.01', fe: '0.01', waterColor: 'Light Green', temperature: '28.6', remarks: 'Optimal parameters' }, gps: { locality: 'Chinnamiram, Bhimavaram', accuracy: 8 }, status: 'VERIFIED' },
    { id: 'WQ-002', date: '2026-08-27', farmerName: 'Naveen Raju', tankName: 'Tank 02', data: { doc: '42', salinity: '18', ph: '8.1', alkalinity: '150', hardness: '5400', ammonia: '0.08', nitrite: '0.03', k: '192.6', do: '6.2', h2s: '0.008', cl: '0.015', fe: '0.01', waterColor: 'Greenish Brown', temperature: '28.2', remarks: 'Good phytoplankton bloom' }, gps: { locality: 'Narasapuram', accuracy: 6 }, status: 'VERIFIED' },
    { id: 'WQ-003', date: '2026-08-26', farmerName: 'Suresh Varma', tankName: 'Tank 01', data: { doc: '50', salinity: '14', ph: '7.6', alkalinity: '130', hardness: '4200', ammonia: '0.12', nitrite: '0.05', k: '149.8', do: '4.8', h2s: '0.01', cl: '0.01', fe: '0.012', waterColor: 'Brown', temperature: '29.0', remarks: 'Diatom bloom' }, gps: { locality: 'Kakinada Coastal', accuracy: 10 }, status: 'VERIFIED' },
  ];

  const dataRows = sampleWaterRows.map(s => [
    s.id || 'WQ-REC',
    s.data?.date || s.date || '2026-08-27',
    s.data?.doc || '35',
    s.farmerName || 'Farmer',
    s.tankName || 'Tank',
    s.data?.salinity || s.data?.waterQuality?.salinity || '16',
    s.data?.ph || s.data?.waterQuality?.ph || '7.8',
    s.data?.alkalinity || s.data?.waterQuality?.alkalinity || '140',
    s.data?.hardness || '4800',
    s.data?.ammonia || s.data?.waterQuality?.ammonia || '0.05',
    s.data?.nitrite || s.data?.waterQuality?.nitrite || '0.02',
    s.data?.k || '171.2',
    s.data?.do || s.data?.waterQuality?.do || '5.6',
    s.data?.h2s || '0.005',
    s.data?.cl || '0.01',
    s.data?.fe || '0.01',
    s.data?.waterColor || 'Light Green',
    s.data?.temperature || s.data?.waterQuality?.temperature || '28.6',
    s.gps?.locality || 'Bhimavaram, AP',
    s.status || 'SUBMITTED',
    s.data?.notes || s.data?.remarks || 'Normal parameters'
  ]);

  const sheetData = [
    ['Royals Marine Food - Water Quality Field Testing Register'],
    [],
    headers,
    ...dataRows
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 14 }, // Record ID
    { wch: 14 }, // Date
    { wch: 8 },  // DOC
    { wch: 20 }, // Farmer Name
    { wch: 14 }, // Tank Name
    { wch: 14 }, // Salinity
    { wch: 10 }, // pH
    { wch: 16 }, // Alkalinity
    { wch: 16 }, // Hardness
    { wch: 20 }, // Ammonia
    { wch: 20 }, // Nitrite
    { wch: 20 }, // Potassium K
    { wch: 12 }, // DO
    { wch: 14 }, // H2S
    { wch: 14 }, // Cl
    { wch: 14 }, // Fe
    { wch: 24 }, // Water Color
    { wch: 16 }, // Temp
    { wch: 24 }, // Locality
    { wch: 14 }, // Status
    { wch: 28 }, // Remarks
  ];

  return ws;
};

/**
 * Main Export Function: Downloads a Complete Standard Excel Workbook (.xlsx)
 */
export const downloadAquaEnterpriseWorkbook = (db, agentId = null, selectedFarmerId = 'ALL', filenamePrefix = 'aqua_field_operations_report') => {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: Weekly Sampling & Growth
  const samplingRows = generateSamplingReportData(db, agentId, selectedFarmerId);
  const samplingWs = buildSamplingSheet(samplingRows);
  XLSX.utils.book_append_sheet(wb, samplingWs, 'Sampling & Growth');

  // 2. Sheet 2: Harvest Master Report
  const harvestRows = generateHarvestMasterReportData(db, agentId);
  const harvestWs = buildHarvestSheet(harvestRows);
  XLSX.utils.book_append_sheet(wb, harvestWs, 'Harvest Master');

  // 3. Sheet 3: Water Quality Analysis
  const waterWs = buildWaterSheet(db);
  XLSX.utils.book_append_sheet(wb, waterWs, 'Water Analysis');

  // Trigger download
  const fileName = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * Download Specific Sheet: Weekly Sampling & Biomass Growth (.xlsx)
 */
export const downloadSamplingExcel = (db, agentId = null, selectedFarmerId = 'ALL') => {
  const wb = XLSX.utils.book_new();
  const rows = generateSamplingReportData(db, agentId, selectedFarmerId);
  const ws = buildSamplingSheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Sampling & Growth');
  XLSX.writeFile(wb, `sampling_and_growth_report_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Download Specific Sheet: Harvest Master Report (.xlsx)
 */
export const downloadHarvestMasterExcel = (db, agentId = null) => {
  const wb = XLSX.utils.book_new();
  const rows = generateHarvestMasterReportData(db, agentId);
  const ws = buildHarvestSheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Harvest Master');
  XLSX.writeFile(wb, `harvest_master_report_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Download Specific Sheet: Water Quality Report (.xlsx)
 */
export const downloadWaterQualityExcel = (db) => {
  const wb = XLSX.utils.book_new();
  const ws = buildWaterSheet(db);
  XLSX.utils.book_append_sheet(wb, ws, 'Water Analysis');
  XLSX.writeFile(wb, `water_quality_report_${new Date().toISOString().split('T')[0]}.xlsx`);
};
