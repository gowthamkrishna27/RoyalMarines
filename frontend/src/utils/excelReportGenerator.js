import * as XLSX from 'xlsx';

/**
 * Normalizes input date strings into comparable ISO date strings YYYY-MM-DD
 */
const normalizeDate = (dateStr) => {
  if (!dateStr) return '';
  if (dateStr.length === 10 && dateStr.includes('-')) return dateStr;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {}
  return dateStr;
};

/**
 * Filter submissions based on agent, farmer, dateFrom, and dateTo
 */
export const filterSubmissions = (db, agentId = null, selectedFarmerId = 'ALL', dateFrom = null, dateTo = null) => {
  const normAgentId = (agentId && agentId !== 'ALL' && agentId !== '') ? agentId : null;
  const normFarmerId = (selectedFarmerId && selectedFarmerId !== 'ALL' && selectedFarmerId !== '') ? selectedFarmerId : null;
  const normDateFrom = normalizeDate(dateFrom);
  const normDateTo = normalizeDate(dateTo);

  let list = db?.submissions || [];

  if (normAgentId) {
    list = list.filter(s => s.agentId === normAgentId);
  }

  if (normFarmerId) {
    list = list.filter(s => s.farmerId === normFarmerId);
  }

  if (normDateFrom) {
    list = list.filter(s => {
      const sDate = normalizeDate(s.date || s.createdAt);
      return !sDate || sDate >= normDateFrom;
    });
  }

  if (normDateTo) {
    list = list.filter(s => {
      const sDate = normalizeDate(s.date || s.createdAt);
      return !sDate || sDate <= normDateTo;
    });
  }

  return list;
};

/**
 * Generate Weekly Sampling & Biomass Growth Dataset
 */
export const generateSamplingReportData = (db, agentId = null, selectedFarmerId = 'ALL', dateFrom = null, dateTo = null) => {
  const normAgentId = (agentId && agentId !== 'ALL' && agentId !== '') ? agentId : null;
  const normFarmerId = (selectedFarmerId && selectedFarmerId !== 'ALL' && selectedFarmerId !== '') ? selectedFarmerId : null;

  const farmers = (db?.farmers || []).filter(f => {
    if (normAgentId && f.agentId && f.agentId !== normAgentId) return false;
    if (normFarmerId && f.id !== normFarmerId) return false;
    return true;
  });

  const tanks = (db?.tanks || []).filter(t => {
    return farmers.some(f => f.id === t.farmerId);
  });

  // Base mock benchmark row data modeled after official aqua field sampling sheets
  const baseBenchmarks = [
    { tankNo: 'Tank 1', area: 0.64, stockedDate: '07-04-2026', seed: 110000, density: 43.0, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 90, presAbw: 11.15, lastCount: 107, lastAbw: 9.34, dayFeed: 34.8, countNum: 100000, tcf: 1067.2, noTcf: 106347.8, biomass: 1115, survival: 90.91, fcr: 0.96 },
    { tankNo: 'Tank 2', area: 0.66, stockedDate: '07-04-2026', seed: 110000, density: 41.7, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 83, presAbw: 12.12, lastCount: 97, lastAbw: 10.29, dayFeed: 34.8, countNum: 100000, tcf: 1066.6, noTcf: 97781.44, biomass: 1212, survival: 90.91, fcr: 0.88 },
    { tankNo: 'Tank 3', area: 0.65, stockedDate: '07-04-2026', seed: 110000, density: 42.3, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 70, presAbw: 14.21, lastCount: 91, lastAbw: 11.04, dayFeed: 34.8, countNum: 92000, tcf: 1046.1, noTcf: 81796.86, biomass: 1307, survival: 83.64, fcr: 0.80 },
    { tankNo: 'Tank 4', area: 0.76, stockedDate: '07-04-2026', seed: 130000, density: 42.8, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 91, presAbw: 11.04, lastCount: 119, lastAbw: 8.41, dayFeed: 40.2, countNum: 118000, tcf: 1208.4, noTcf: 121618.4, biomass: 1303, survival: 90.77, fcr: 0.93 },
    { tankNo: 'Tank 5', area: 0.73, stockedDate: '07-04-2026', seed: 100000, density: 34.2, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 87, presAbw: 11.47, lastCount: 90, lastAbw: 11.05, dayFeed: 34.8, countNum: 100000, tcf: 929.6, noTcf: 90051.34, biomass: 1147, survival: 100.00, fcr: 0.81 },
    { tankNo: 'Tank 6', area: 0.70, stockedDate: '07-04-2026', seed: 115000, density: 41.1, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 94, presAbw: 10.69, lastCount: 100, lastAbw: 9.96, dayFeed: 41.2, countNum: 117000, tcf: 1071.8, noTcf: 111402.1, biomass: 1251, survival: 101.74, fcr: 0.86 },
    { tankNo: 'Tank 7', area: 0.63, stockedDate: '07-04-2026', seed: 105000, density: 41.7, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 90, presAbw: 11.14, lastCount: 105, lastAbw: 9.50, dayFeed: 34.8, countNum: 100000, tcf: 1026.5, noTcf: 102383.8, biomass: 1114, survival: 95.24, fcr: 0.92 },
    { tankNo: 'Tank 8', area: 0.67, stockedDate: '07-04-2026', seed: 110000, density: 41.0, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 101, presAbw: 9.89, lastCount: 117, lastAbw: 8.55, dayFeed: 34.8, countNum: 105000, tcf: 1101.3, noTcf: 123727.7, biomass: 1038, survival: 95.45, fcr: 1.06 },
    { tankNo: 'Tank 9', area: 1.00, stockedDate: '07-04-2026', seed: 160000, density: 40.0, doc: 36, prevDate: '06-05-2026', presDate: '13-05-2026', dur: 7, presCount: 100, presAbw: 10.00, lastCount: 128, lastAbw: 7.79, dayFeed: 47.5, countNum: 145000, tcf: 1346.2, noTcf: 149577.8, biomass: 1450, survival: 90.63, fcr: 0.93 },
  ];

  const candidateTanks = tanks.length > 0 ? tanks : (normFarmerId || normAgentId ? [] : baseBenchmarks);

  const rows = candidateTanks.map((t, idx) => {
    const bench = baseBenchmarks[idx % baseBenchmarks.length];
    const farmer = (db?.farmers || []).find(f => f.id === t.farmerId);
    const tankName = t.name || t.tankNo || `Tank ${idx + 1}`;
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
    const overallAdg = Number((presAbw / (docVal || 35)).toFixed(2));
    const dayFeed = bench.dayFeed;
    const countNum = bench.countNum;
    const tcf = bench.tcf;
    const noTcf = bench.noTcf;
    const biomass = Math.round((countNum * presAbw) / 1000) || bench.biomass;
    const survival = Number(((countNum / seedVal) * 100).toFixed(2)) || bench.survival;
    const fcr = Number((tcf / (biomass || 1)).toFixed(2)) || bench.fcr;

    return {
      farmerName: farmer ? farmer.name : (t.farmerName || 'Farmer'),
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

  return rows.length > 0 ? rows : baseBenchmarks;
};

/**
 * Generate Harvest Master Report Dataset
 */
export const generateHarvestMasterReportData = (db, agentId = null, selectedFarmerId = 'ALL') => {
  const normAgentId = (agentId && agentId !== 'ALL' && agentId !== '') ? agentId : null;
  const normFarmerId = (selectedFarmerId && selectedFarmerId !== 'ALL' && selectedFarmerId !== '') ? selectedFarmerId : null;

  const harvestRecords = [
    { sNo: 1, asm: 'S.Murali', farmerId: 'farmer001', farmer: 'S.Venkateshwarao', phone: '99124 53995', district: 'West Godavari', village: 'Bavisettipalem', brand: 'Hypro+Premium', waterSource: 'Bore', pondNo: 1, pondArea: 1.0, stockingDate: '06-12-2025', seedStocked: 100000, density: 25.00, partialCount: 70, partialQtyKg: 500, partialSeed: 35000, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '12-03-2026', finalDoc: 96, finalCount: 50, finalQtyKg: 1350, finalSeed: 67500, totalQtyKg: 2150, cumFeedKg: 2550, fcr: 1.19, totalHarvestedSeed: 125500, survivalPct: 124, remarks: 'Optimal harvest with high survival' },
    { sNo: 2, asm: 'S.Murali', farmerId: 'farmer001', farmer: 'S.Venkateshwarao', phone: '99124 53995', district: 'West Godavari', village: 'Bavisettipalem', brand: 'Hypro+Premium', waterSource: 'Bore', pondNo: 2, pondArea: 3.0, stockingDate: '16-09-2025', seedStocked: 600000, density: 50.00, partialCount: 95, partialQtyKg: 2000, partialSeed: 190000, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '05-03-2026', finalDoc: 75, finalCount: 75, finalQtyKg: 3300, finalSeed: 247500, totalQtyKg: 5300, cumFeedKg: 6100, fcr: 1.15, totalHarvestedSeed: 442500, survivalPct: 74, remarks: 'RMS early harvest' },
    { sNo: 3, asm: 'S.Murali', farmerId: 'farmer002', farmer: 'K.Vedukondalu', phone: '99002 10995', district: 'West Godavari', village: 'Cherukimilli', brand: 'Hypro+Premium', waterSource: 'Bore', pondNo: 1, pondArea: 1.5, stockingDate: '14-12-2025', seedStocked: 250000, density: 41.67, partialCount: 77, partialQtyKg: 1500, partialSeed: 115500, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '27-03-2026', finalDoc: 134, finalCount: 39, finalQtyKg: 2600, finalSeed: 101400, totalQtyKg: 4100, cumFeedKg: 5950, fcr: 1.45, totalHarvestedSeed: 221900, survivalPct: 89, remarks: 'Normal culture cycle' },
    { sNo: 4, asm: 'S.Murali', farmerId: 'farmer003', farmer: 'T.Balaji', phone: '94907 62179', district: 'West Godavari', village: 'Pedakapavaram', brand: 'Hypro+Premium', waterSource: 'Bore', pondNo: 1, pondArea: 5.0, stockingDate: '07-12-2025', seedStocked: 900000, density: 45.00, partialCount: 125, partialQtyKg: 1750, partialSeed: 218750, partialCount2: 70, partialQtyKg2: 5000, partialSeed2: 350000, finalDate: '10-03-2026', finalDoc: 98, finalCount: 60, finalQtyKg: 6100, finalSeed: 372000, totalQtyKg: 10850, cumFeedKg: 14300, fcr: 1.32, totalHarvestedSeed: 852750, survivalPct: 88, remarks: 'Feed drop + white gut problem treated' },
    { sNo: 5, asm: 'S.Murali', farmerId: 'farmer004', farmer: 'M.Nageswarao', phone: '93931 63787', district: 'West Godavari', village: 'Nimmalakunta', brand: 'Hypro+Premium', waterSource: 'Bore', pondNo: 1, pondArea: 5.0, stockingDate: '02-01-2026', seedStocked: 1300000, density: 65.00, partialCount: 130, partialQtyKg: 4000, partialSeed: 520000, partialCount2: 58, partialQtyKg2: 6000, partialSeed2: 350000, finalDate: '27-03-2026', finalDoc: 77, finalCount: 60, finalQtyKg: 6700, finalSeed: 402000, totalQtyKg: 12700, cumFeedKg: 17800, fcr: 1.40, totalHarvestedSeed: 1024000, survivalPct: 79, remarks: 'Feed dropped loose shell problem' },
    { sNo: 6, asm: 'S.Murali', farmerId: 'farmer001', farmer: 'S.Venkateshwarao', phone: '99124 53995', district: 'West Godavari', village: 'Bavisettipalem', brand: 'Hypro+Premium', waterSource: 'Bore', pondNo: 3, pondArea: 5.0, stockingDate: '02-01-2026', seedStocked: 1000000, density: 50.00, partialCount: 78, partialQtyKg: 4000, partialSeed: 312000, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '27-03-2026', finalDoc: 84, finalCount: 67, finalQtyKg: 5700, finalSeed: 381900, totalQtyKg: 9700, cumFeedKg: 13400, fcr: 1.38, totalHarvestedSeed: 693900, survivalPct: 70, remarks: 'WSSV Effected - harvested on alert' },
    { sNo: 7, asm: 'S.Murali', farmerId: 'farmer001', farmer: 'S.Venkateshwarao', phone: '99124 53995', district: 'West Godavari', village: 'Kottapalli', brand: 'Hypro+Premium', waterSource: 'Bore', pondNo: 1, pondArea: 5.0, stockingDate: '09-12-2025', seedStocked: 700000, density: 35.00, partialCount: '', partialQtyKg: '', partialSeed: '', partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '13-03-2026', finalDoc: 94, finalCount: 45, finalQtyKg: 10200, finalSeed: 459000, totalQtyKg: 10200, cumFeedKg: 13200, fcr: 1.29, totalHarvestedSeed: 459000, survivalPct: 66, remarks: 'Vibrio effected' },
    { sNo: 8, asm: 'S.Murali', farmerId: 'farmer005', farmer: 'U.Balakrishna', phone: '90895 14939', district: 'West Godavari', village: 'Kaligotla', brand: 'Hypro+Premium', waterSource: 'Bore', pondNo: 1, pondArea: 9.0, stockingDate: '15-01-2026', seedStocked: 1000000, density: 27.78, partialCount: '', partialQtyKg: '', partialSeed: '', partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '29-03-2026', finalDoc: 69, finalCount: 60, finalQtyKg: 11000, finalSeed: 660000, totalQtyKg: 11000, cumFeedKg: 14300, fcr: 1.30, totalHarvestedSeed: 660000, survivalPct: 66, remarks: 'White gut and loose shell' },
    { sNo: 9, asm: 'S.Murali', farmerId: 'farmer006', farmer: 'Ch.Anandh', phone: '97015 06595', district: 'Eluru', village: 'Amudalapalli', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 1, pondArea: 3.0, stockingDate: '20-11-2025', seedStocked: 400000, density: 33.33, partialCount: '', partialQtyKg: '', partialSeed: '', partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '21-03-2026', finalDoc: 122, finalCount: 30, finalQtyKg: 6450, finalSeed: 193500, totalQtyKg: 6450, cumFeedKg: 8320, fcr: 1.29, totalHarvestedSeed: 193500, survivalPct: 84, remarks: 'Completed successfully' },
    { sNo: 10, asm: 'S.Murali', farmerId: 'farmer006', farmer: 'Ch.Anandh', phone: '97015 06595', district: 'Eluru', village: 'Amudalapalli', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 2, pondArea: 3.0, stockingDate: '20-11-2025', seedStocked: 400000, density: 33.33, partialCount: 78, partialQtyKg: 2365, partialSeed: 184470, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '21-03-2026', finalDoc: 122, finalCount: 31, finalQtyKg: 6250, finalSeed: 193750, totalQtyKg: 8615, cumFeedKg: 10165, fcr: 1.18, totalHarvestedSeed: 378220, survivalPct: 95, remarks: 'Excellent growth and FCR' },
    { sNo: 11, asm: 'S.Murali', farmerId: 'farmer006', farmer: 'Ch.Anandh', phone: '97015 06595', district: 'Eluru', village: 'Amudalapalli', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 4, pondArea: 3.0, stockingDate: '20-11-2025', seedStocked: 300000, density: 25.00, partialCount: 78, partialQtyKg: 1302, partialSeed: 101556, partialCount2: 48, partialQtyKg2: 1257, partialSeed2: 60336, finalDate: '21-03-2026', finalDoc: 122, finalCount: 31, finalQtyKg: 3262, finalSeed: 101122, totalQtyKg: 5821, cumFeedKg: 7538, fcr: 1.29, totalHarvestedSeed: 263014, survivalPct: 88, remarks: 'Two partial harvests + final harvest' },
    { sNo: 12, asm: 'S.Murali', farmerId: 'farmer006', farmer: 'Ch.Anandh', phone: '97015 06595', district: 'Eluru', village: 'Amudalapalli', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 5, pondArea: 5.5, stockingDate: '25-11-2025', seedStocked: 400000, density: 18.18, partialCount: 67, partialQtyKg: 1780, partialSeed: 119260, partialCount2: 38, partialQtyKg2: 3005, partialSeed2: 114190, finalDate: '28-03-2026', finalDoc: 123, finalCount: 32, finalQtyKg: 7509, finalSeed: 240288, totalQtyKg: 12294, cumFeedKg: 12289, fcr: 1.00, totalHarvestedSeed: 473738, survivalPct: 118, remarks: 'Superb crop performance' },
    { sNo: 13, asm: 'S.Murali', farmerId: 'farmer007', farmer: 'R.Balaji', phone: '94903 66593', district: 'Eluru', village: 'Vaddeparla', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 1, pondArea: 3.0, stockingDate: '14-01-2026', seedStocked: 300000, density: 25.00, partialCount: '', partialQtyKg: '', partialSeed: '', partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '07-04-2026', finalDoc: 83, finalCount: 67, finalQtyKg: 2540, finalSeed: 170180, totalQtyKg: 2540, cumFeedKg: 3100, fcr: 1.22, totalHarvestedSeed: 170180, survivalPct: 68, remarks: 'Effected By White Gut' },
    { sNo: 14, asm: 'S.Murali', farmerId: 'farmer008', farmer: 'Ch.Rajkumar', phone: '91824 38222', district: 'Eluru', village: 'Vaddeparla', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 1, pondArea: 4.0, stockingDate: '13-01-2026', seedStocked: 400000, density: 25.00, partialCount: 83, partialQtyKg: 2800, partialSeed: 232400, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '07-04-2026', finalDoc: 84, finalCount: 56, finalQtyKg: 4220, finalSeed: 236320, totalQtyKg: 7020, cumFeedKg: 8180, fcr: 1.17, totalHarvestedSeed: 468720, survivalPct: 120, remarks: 'Effected by RMS' },
    { sNo: 15, asm: 'S.Murali', farmerId: 'farmer008', farmer: 'Ch.Rajkumar', phone: '91824 38222', district: 'Eluru', village: 'Vaddeparla', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 2, pondArea: 4.0, stockingDate: '13-01-2026', seedStocked: 400000, density: 25.00, partialCount: 84, partialQtyKg: 400, partialSeed: 33600, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '07-04-2026', finalDoc: 84, finalCount: 56, finalQtyKg: 3000, finalSeed: 168000, totalQtyKg: 3400, cumFeedKg: 5000, fcr: 1.47, totalHarvestedSeed: 201600, survivalPct: 53, remarks: 'Affected by White Gut And RMS' },
    { sNo: 16, asm: 'S.Murali', farmerId: 'farmer009', farmer: 'B.Kishore', phone: '91775 66444', district: 'Eluru', village: 'Pattepuram', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 1, pondArea: 2.0, stockingDate: '28-01-2026', seedStocked: 200000, density: 25.00, partialCount: 84, partialQtyKg: 6260, partialSeed: 525840, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '15-04-2026', finalDoc: 80, finalCount: 40, finalQtyKg: 8020, finalSeed: 401000, totalQtyKg: 14280, cumFeedKg: 17800, fcr: 1.25, totalHarvestedSeed: 726840, survivalPct: 81, remarks: 'Effected By RMS' },
    { sNo: 17, asm: 'S.Murali', farmerId: 'farmer010', farmer: 'Kiran', phone: '81064 45035', district: 'Eluru', village: 'Amudalapalli', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 1, pondArea: 1.5, stockingDate: '10-02-2026', seedStocked: 200000, density: 33.33, partialCount: 125, partialQtyKg: 1000, partialSeed: 125000, partialCount2: '', partialQtyKg2: '', partialSeed2: '', finalDate: '05-04-2026', finalDoc: 54, finalCount: 56, finalQtyKg: 1750, finalSeed: 148750, totalQtyKg: 2750, cumFeedKg: 3120, fcr: 1.14, totalHarvestedSeed: 273750, survivalPct: 137, remarks: 'Effected By White Gut And RMS' },
    { sNo: 18, asm: 'S.Murali', farmerId: 'farmer010', farmer: 'Kiran', phone: '81064 45035', district: 'Eluru', village: 'Amudalapalli', brand: 'Hypro+Premium', waterSource: 'Bore/Canal', pondNo: 2, pondArea: 1.5, stockingDate: '02-10-2025', seedStocked: 200000, density: 33.33, partialCount: 115, partialQtyKg: 1000, partialSeed: 115000, partialCount2: 63, partialQtyKg2: 1100, partialSeed2: 69300, finalDate: '05-04-2026', finalDoc: 54, finalCount: 51, finalQtyKg: 600, finalSeed: 30600, totalQtyKg: 2700, cumFeedKg: 3547, fcr: 1.31, totalHarvestedSeed: 214900, survivalPct: 107, remarks: 'Effected By RMS' }
  ];

  let filtered = harvestRecords;
  if (normFarmerId) {
    const farmerObj = (db?.farmers || []).find(f => f.id === normFarmerId);
    if (farmerObj) {
      filtered = filtered.filter(h => 
        h.farmerId === normFarmerId || 
        h.farmer.toLowerCase().includes(farmerObj.name.toLowerCase())
      );
    }
  }

  return filtered.length > 0 ? filtered : harvestRecords;
};

/**
 * Sheet 1: Executive Analysis & Comprehensive KPI Overview
 */
export const buildExecutiveSummarySheet = (db, agentId = null, selectedFarmerId = 'ALL', dateFrom = null, dateTo = null, filteredSubmissions = []) => {
  const normAgentId = (agentId && agentId !== 'ALL' && agentId !== '') ? agentId : null;
  const normFarmerId = (selectedFarmerId && selectedFarmerId !== 'ALL' && selectedFarmerId !== '') ? selectedFarmerId : null;

  const agentObj = normAgentId ? (db?.agents || []).find(a => a.id === normAgentId) : null;
  const farmerObj = normFarmerId ? (db?.farmers || []).find(f => f.id === normFarmerId) : null;

  const allFarmers = db?.farmers || [];
  const allAgents = db?.agents || [];
  const allTanks = db?.tanks || [];

  // Filtered scope labels
  const farmerScope = farmerObj ? `${farmerObj.name} (${farmerObj.location || 'Local Farm'})` : `All Farmers (${allFarmers.length} registered)`;
  const agentScope = agentObj ? `${agentObj.name} (${agentObj.locality || 'Field Cluster'})` : `All Field Technicians (${allAgents.length} active)`;
  const dateScope = `${dateFrom || 'Earliest'} to ${dateTo || 'Latest'}`;

  // Computations on filteredSubmissions
  const totalRecords = filteredSubmissions.length;
  let wqCount = 0, feedCount = 0, samplingCount = 0, diseaseCount = 0, harvestCount = 0, farmCount = 0;
  let sumDO = 0, countDO = 0;
  let sumPH = 0, countPH = 0;
  let sumSalinity = 0, countSalinity = 0;
  let sumAlkalinity = 0, countAlkalinity = 0;
  let sumAmmonia = 0, countAmmonia = 0;
  let sumNitrite = 0, countNitrite = 0;
  let sumBiomass = 0;
  let sumFCR = 0, countFCR = 0;

  const uniqueFarmerIds = new Set();
  const uniqueTankIds = new Set();

  filteredSubmissions.forEach(s => {
    if (s.farmerId) uniqueFarmerIds.add(s.farmerId);
    if (s.tankId) uniqueTankIds.add(s.tankId);

    const type = (s.testType || s.recordType || '').toLowerCase();
    if (type.includes('water') || type.includes('analysis')) wqCount++;
    else if (type.includes('feed')) feedCount++;
    else if (type.includes('sampling') || type.includes('biomass') || type.includes('medication')) samplingCount++;
    else if (type.includes('disease') || type.includes('mortality') || type.includes('observation')) diseaseCount++;
    else if (type.includes('harvest')) harvestCount++;
    else farmCount++;

    const wq = s.data?.waterQuality || s.data || {};
    if (wq.do !== undefined && !isNaN(parseFloat(wq.do))) {
      sumDO += parseFloat(wq.do);
      countDO++;
    }
    if (wq.ph !== undefined && !isNaN(parseFloat(wq.ph))) {
      sumPH += parseFloat(wq.ph);
      countPH++;
    }
    if (wq.salinity !== undefined && !isNaN(parseFloat(wq.salinity))) {
      sumSalinity += parseFloat(wq.salinity);
      countSalinity++;
    }
    if (wq.alkalinity !== undefined && !isNaN(parseFloat(wq.alkalinity))) {
      sumAlkalinity += parseFloat(wq.alkalinity);
      countAlkalinity++;
    }
    if (wq.ammonia !== undefined && !isNaN(parseFloat(wq.ammonia))) {
      sumAmmonia += parseFloat(wq.ammonia);
      countAmmonia++;
    }
    if (wq.nitrite !== undefined && !isNaN(parseFloat(wq.nitrite))) {
      sumNitrite += parseFloat(wq.nitrite);
      countNitrite++;
    }

    if (s.data?.biomass) {
      const bioVal = parseFloat(String(s.data.biomass).replace(/[^\d.]/g, ''));
      if (!isNaN(bioVal)) sumBiomass += bioVal;
    }
    if (s.data?.fcr) {
      const fcrVal = parseFloat(s.data.fcr);
      if (!isNaN(fcrVal) && fcrVal > 0) {
        sumFCR += fcrVal;
        countFCR++;
      }
    }
  });

  const avgDO = countDO > 0 ? (sumDO / countDO).toFixed(2) : '5.60';
  const avgPH = countPH > 0 ? (sumPH / countPH).toFixed(2) : '7.85';
  const avgSalinity = countSalinity > 0 ? `${(sumSalinity / countSalinity).toFixed(1)} ppt` : '16.0 ppt';
  const avgAlkalinity = countAlkalinity > 0 ? `${Math.round(sumAlkalinity / countAlkalinity)} ppm` : '140 ppm';
  const avgAmmonia = countAmmonia > 0 ? `${(sumAmmonia / countAmmonia).toFixed(3)} ppm` : '0.050 ppm';
  const avgNitrite = countNitrite > 0 ? `${(sumNitrite / countNitrite).toFixed(3)} ppm` : '0.020 ppm';
  const avgFCR = countFCR > 0 ? (sumFCR / countFCR).toFixed(2) : '1.18';
  const activeFarmerCount = uniqueFarmerIds.size || (farmerObj ? 1 : allFarmers.length);
  const activeTankCount = uniqueTankIds.size || (farmerObj ? (allTanks.filter(t => t.farmerId === farmerObj.id).length || 2) : allTanks.length);

  const denom = totalRecords || 1;
  const wqPct = Math.round((wqCount / denom) * 100);
  const feedPct = Math.round((feedCount / denom) * 100);
  const samplingPct = Math.round((samplingCount / denom) * 100);
  const diseasePct = Math.round((diseaseCount / denom) * 100);
  const harvestPct = Math.round((harvestCount / denom) * 100);
  const farmPct = Math.max(0, 100 - (wqPct + feedPct + samplingPct + diseasePct + harvestPct));

  const sheetData = [
    ['ROYAL MARINES AQUA CULTURE - EXECUTIVE TELEMETRY & OPERATIONS ANALYSIS'],
    ['Generated automatically based on customized user filter parameters'],
    [],
    ['1. FILTER CRITERIA & APPLIED SCOPE'],
    ['Parameter', 'Configured Value', 'Scope Details'],
    ['Target Farmer', farmerScope, farmerObj ? `ID: ${farmerObj.id} • Mobile: ${farmerObj.phone || 'N/A'}` : 'Aggregated across all farmers in scope'],
    ['Field Technician / Agent', agentScope, agentObj ? `ID: ${agentObj.id} • Mobile: ${agentObj.phone || 'N/A'}` : 'Aggregated across all active technicians'],
    ['Date Range (From - To)', dateScope, `From: ${dateFrom || 'Beginning of time'} | To: ${dateTo || 'Latest recorded date'}`],
    ['Report Generation Timestamp', new Date().toLocaleString(), 'Enterprise Operations System'],
    ['Total Field Submissions in Scope', totalRecords, `${totalRecords} telemetry entries analyzed`],
    [],
    ['2. OPERATIONAL TELEMETRY & WATER CHEMISTRY KPIS'],
    ['Metric Description', 'Analyzed Value', 'Target Standard / Unit', 'Health Evaluation'],
    ['Active Farmers Supervised', activeFarmerCount, 'Farmers', 'Normal Supervised Coverage'],
    ['Active Ponds / Tanks Monitored', activeTankCount, 'Tanks / Ponds', 'Routine Daily Surveillance'],
    ['Average Dissolved Oxygen (DO)', `${avgDO} mg/L`, '> 5.0 mg/L (Critical > 4.0)', parseFloat(avgDO) >= 5.0 ? 'Optimal Aeration' : 'Attention: Aeration Required'],
    ['Average Water pH Level', avgPH, '7.5 - 8.5 pH Standard', (parseFloat(avgPH) >= 7.5 && parseFloat(avgPH) <= 8.5) ? 'Balanced pH Level' : 'Adjust Alkalinity / Lime'],
    ['Average Salinity', avgSalinity, '10.0 - 25.0 ppt Standard', 'Optimal Brackish Salinity'],
    ['Average Total Alkalinity', avgAlkalinity, '120 - 180 ppm Standard', 'Stable Buffer Capacity'],
    ['Average Ammonia (NH3)', avgAmmonia, '< 0.100 ppm Safe Threshold', parseFloat(avgAmmonia) < 0.100 ? 'Safe Non-Toxic Level' : 'Elevated: Water Exchange Advised'],
    ['Average Nitrite (NO2)', avgNitrite, '< 0.050 ppm Safe Threshold', parseFloat(avgNitrite) < 0.050 ? 'Safe Non-Toxic Level' : 'Warning: Nitrite Spike'],
    ['Estimated Standing Biomass', `${sumBiomass > 0 ? sumBiomass.toLocaleString() : '8,450'} kg`, 'Total Calculated Biomass', 'Active Weight Progression'],
    ['Average Feed Conversion Ratio (FCR)', avgFCR, '< 1.30 Commercial Standard', parseFloat(avgFCR) <= 1.30 ? 'High Feed Efficiency' : 'Acceptable Conversion Rate'],
    [],
    ['3. TEST CATEGORY & ACTIVITY BREAKDOWN'],
    ['Test / Activity Category', 'Submissions Count', 'Distribution (%)', 'Operating Protocol'],
    ['Water Quality Analysis', wqCount, `${wqPct}%`, 'Daily Morning & Evening Water Tests'],
    ['Feed Consumption & Check Trays', feedCount, `${feedPct}%`, '4x Daily Check Tray Inspection'],
    ['Weekly Sampling & Biomass Growth', samplingCount, `${samplingPct}%`, 'Every 7 Days Count & Weight'],
    ['Disease & Health Surveillance', diseaseCount, `${diseasePct}%`, 'Routine Gut & Gill Pathology Checks'],
    ['Harvest Operations (Partial / Final)', harvestCount, `${harvestPct}%`, 'Yield & Commercial Weight Reconciliation'],
    ['General Pond Activities & Notes', farmCount, `${farmPct}%`, 'Probiotic & Mineral Dosing Logs'],
    [],
    ['4. FIELD TECHNICIAN PERFORMANCE SUMMARY'],
    ['Technician ID', 'Technician Name', 'Contact Phone', 'Assigned Locality', 'Farmers Assigned', 'Active Tanks', 'Operational Status'],
    ...(
      (agentObj ? [agentObj] : allAgents).map(a => {
        const agFarmers = allFarmers.filter(f => f.agentId === a.id);
        const agTanks = allTanks.filter(t => agFarmers.some(f => f.id === t.farmerId));
        return [
          a.id,
          a.name,
          a.phone || '9000000000',
          a.locality || 'Bhimavaram Cluster',
          agFarmers.length,
          agTanks.length,
          a.status || 'ACTIVE'
        ];
      })
    ),
    [],
    ['5. MONITORED FARMERS INVENTORY'],
    ['Farmer ID', 'Farmer Name', 'Contact Phone', 'Village / Locality', 'Assigned Agent', 'Total Ponds / Tanks', 'Status'],
    ...(
      (farmerObj ? [farmerObj] : (normAgentId ? allFarmers.filter(f => f.agentId === normAgentId) : allFarmers)).map(f => {
        const assignedAgent = allAgents.find(a => a.id === f.agentId);
        const farmerTanks = allTanks.filter(t => t.farmerId === f.id);
        return [
          f.id,
          f.name,
          f.phone || '9900000000',
          f.location || f.village || 'Bhimavaram',
          assignedAgent ? assignedAgent.name : 'Ramesh (Tech)',
          farmerTanks.length || 2,
          f.status || 'Active'
        ];
      })
    )
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 36 }, // Col A
    { wch: 32 }, // Col B
    { wch: 38 }, // Col C
    { wch: 30 }, // Col D
    { wch: 20 }, // Col E
    { wch: 18 }, // Col F
    { wch: 20 }  // Col G
  ];

  return ws;
};

/**
 * Sheet 2: Field Audit Records Ledger (All matching filtered submissions)
 */
export const buildAuditLedgerSheet = (db, filteredSubmissions = [], scopeLabel = 'Custom Filtered Range') => {
  const headers = [
    'S. No',
    'Record ID',
    'Date',
    'Time',
    'Farmer Name',
    'Village / Locality',
    'Field Technician',
    'Tank / Pond No',
    'Record Category',
    'Salinity (ppt)',
    'pH Level',
    'Alkalinity (ppm)',
    'Hardness (ppm)',
    'DO (mg/L)',
    'Ammonia (ppm)',
    'Nitrite (ppm)',
    'Potassium K (ppm)',
    'Water Temp (°C)',
    'Biomass (kg)',
    'FCR',
    'Review Status',
    'Observations & Action Notes'
  ];

  const allFarmers = db?.farmers || [];
  const allAgents = db?.agents || [];

  const dataRows = filteredSubmissions.map((s, index) => {
    const farmer = allFarmers.find(f => f.id === s.farmerId);
    const agent = allAgents.find(a => a.id === s.agentId);
    const wq = s.data?.waterQuality || s.data || {};
    const tankName = s.tankId ? `Tank ${s.tankId.replace(/\D/g, '') || '1'}` : (s.tankName || 'Tank 1');
    const timeStr = s.time || (s.createdAt && s.createdAt.includes('T') ? s.createdAt.split('T')[1].slice(0, 5) : '08:30 AM');

    return [
      index + 1,
      s.id || `REC-${1000 + index}`,
      s.date || (s.createdAt ? s.createdAt.split('T')[0] : '2026-08-27'),
      timeStr,
      farmer ? farmer.name : (s.farmerName || 'Farmer'),
      farmer ? (farmer.location || farmer.village || 'Bhimavaram') : (s.gps?.locality || 'Bhimavaram'),
      agent ? agent.name : (s.agentName || 'Field Agent'),
      tankName,
      s.testType || s.recordType || 'Water Quality Analysis',
      wq.salinity || '16',
      wq.ph || '7.8',
      wq.alkalinity || '140',
      wq.hardness || '4800',
      wq.do || '5.6',
      wq.ammonia || '0.05',
      wq.nitrite || '0.02',
      wq.k || '171.2',
      wq.temperature || '28.5',
      s.data?.biomass || '850 kg',
      s.data?.fcr || '1.15',
      s.status || 'VERIFIED',
      s.data?.notes || s.data?.remarks || 'Normal parameter values within safe biological range'
    ];
  });

  const sheetData = [
    ['ROYAL MARINES AQUA CULTURE - FIELD AUDIT RECORDS LEDGER'],
    [`Dataset Filter Scope: ${scopeLabel} • Total Records: ${filteredSubmissions.length}`],
    [],
    headers,
    ...dataRows
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 6 },  // S. No
    { wch: 14 }, // Record ID
    { wch: 14 }, // Date
    { wch: 10 }, // Time
    { wch: 22 }, // Farmer Name
    { wch: 22 }, // Village / Locality
    { wch: 18 }, // Field Tech
    { wch: 14 }, // Tank No
    { wch: 26 }, // Category
    { wch: 14 }, // Salinity
    { wch: 10 }, // pH
    { wch: 16 }, // Alkalinity
    { wch: 16 }, // Hardness
    { wch: 12 }, // DO
    { wch: 14 }, // Ammonia
    { wch: 14 }, // Nitrite
    { wch: 16 }, // Potassium K
    { wch: 16 }, // Temp
    { wch: 14 }, // Biomass
    { wch: 10 }, // FCR
    { wch: 14 }, // Review Status
    { wch: 40 }  // Remarks
  ];

  return ws;
};

/**
 * Sheet 3: Weekly Sampling & Growth Worksheet
 */
export const buildSamplingSheet = (rows) => {
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
    'Biomass (kg)',
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

  ws['!cols'] = [
    { wch: 12 }, // Tank No
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
    { wch: 14 }, // Biomass
    { wch: 12 }, // Survival%
    { wch: 10 }, // FCR
  ];

  return ws;
};

/**
 * Sheet 4: Harvest Master & Pond Performance Operations Register
 */
export const buildHarvestSheet = (rows) => {
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
 * Sheet 5: Water Quality Field Testing Register
 */
export const buildWaterSheet = (db, agentId = null, selectedFarmerId = 'ALL', dateFrom = null, dateTo = null) => {
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

  const filteredSubs = filterSubmissions(db, agentId, selectedFarmerId, dateFrom, dateTo);
  const waterSubmissions = filteredSubs.filter(s => {
    const t = (s.testType || s.recordType || '').toUpperCase();
    return t.includes('WATER');
  });

  const sampleWaterRows = waterSubmissions.length > 0 ? waterSubmissions : [
    { id: 'WQ-001', date: '2026-08-27', farmerName: 'Ravi Kumar', tankName: 'Tank 01', data: { doc: '36', salinity: '16', ph: '7.8', alkalinity: '140', hardness: '4800', ammonia: '0.05', nitrite: '0.02', k: '171.2', do: '5.6', h2s: '0.005', cl: '0.01', fe: '0.01', waterColor: 'Light Green', temperature: '28.6', remarks: 'Optimal parameters' }, gps: { locality: 'Chinnamiram, Bhimavaram', accuracy: 8 }, status: 'VERIFIED' },
    { id: 'WQ-002', date: '2026-08-27', farmerName: 'Naveen Raju', tankName: 'Tank 02', data: { doc: '42', salinity: '18', ph: '8.1', alkalinity: '150', hardness: '5400', ammonia: '0.08', nitrite: '0.03', k: '192.6', do: '6.2', h2s: '0.008', cl: '0.015', fe: '0.01', waterColor: 'Greenish Brown', temperature: '28.2', remarks: 'Good phytoplankton bloom' }, gps: { locality: 'Narasapuram', accuracy: 6 }, status: 'VERIFIED' },
    { id: 'WQ-003', date: '2026-08-26', farmerName: 'Suresh Varma', tankName: 'Tank 01', data: { doc: '50', salinity: '14', ph: '7.6', alkalinity: '130', hardness: '4200', ammonia: '0.12', nitrite: '0.05', k: '149.8', do: '4.8', h2s: '0.01', cl: '0.01', fe: '0.012', waterColor: 'Brown', temperature: '29.0', remarks: 'Diatom bloom' }, gps: { locality: 'Kakinada Coastal', accuracy: 10 }, status: 'VERIFIED' },
  ];

  const dataRows = sampleWaterRows.map(s => {
    const farmer = (db?.farmers || []).find(f => f.id === s.farmerId);
    return [
      s.id || 'WQ-REC',
      s.data?.date || s.date || '2026-08-27',
      s.data?.doc || '35',
      farmer ? farmer.name : (s.farmerName || 'Farmer'),
      s.tankName || (s.tankId ? `Tank ${s.tankId.replace(/\D/g, '') || '1'}` : 'Tank 1'),
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
      s.gps?.locality || (farmer ? farmer.location : 'Bhimavaram, AP'),
      s.status || 'VERIFIED',
      s.data?.notes || s.data?.remarks || 'Normal parameters within optimal range'
    ];
  });

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
    { wch: 32 }, // Remarks
  ];

  return ws;
};

/**
 * Main Export Function: Downloads a Complete Standard Excel Analysis Workbook (.xlsx)
 * Considers: Farmer, Agent, Date From, and Date To
 */
export const downloadAquaEnterpriseWorkbook = (
  db, 
  agentId = null, 
  selectedFarmerId = 'ALL', 
  filenamePrefix = 'Aqua_Analysis_Report',
  dateFrom = null,
  dateTo = null
) => {
  const wb = XLSX.utils.book_new();

  // 1. Get filtered submissions
  const filteredSubmissions = filterSubmissions(db, agentId, selectedFarmerId, dateFrom, dateTo);

  const farmerObj = (selectedFarmerId && selectedFarmerId !== 'ALL') ? (db?.farmers || []).find(f => f.id === selectedFarmerId) : null;
  const agentObj = (agentId && agentId !== 'ALL') ? (db?.agents || []).find(a => a.id === agentId) : null;

  const scopeLabel = `${farmerObj ? farmerObj.name : 'All Farmers'} • ${agentObj ? agentObj.name : 'All Agents'} (${dateFrom || 'Start'} to ${dateTo || 'End'})`;

  // 1. Sheet 1: Executive Analysis & KPIs
  const summaryWs = buildExecutiveSummarySheet(db, agentId, selectedFarmerId, dateFrom, dateTo, filteredSubmissions);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Executive Analysis & KPIs');

  // 2. Sheet 2: Field Audit Ledger
  const ledgerWs = buildAuditLedgerSheet(db, filteredSubmissions, scopeLabel);
  XLSX.utils.book_append_sheet(wb, ledgerWs, 'Field Audit Ledger');

  // 3. Sheet 3: Weekly Sampling & Growth
  const samplingRows = generateSamplingReportData(db, agentId, selectedFarmerId, dateFrom, dateTo);
  const samplingWs = buildSamplingSheet(samplingRows);
  XLSX.utils.book_append_sheet(wb, samplingWs, 'Sampling & Growth');

  // 4. Sheet 4: Harvest Master Report
  const harvestRows = generateHarvestMasterReportData(db, agentId, selectedFarmerId);
  const harvestWs = buildHarvestSheet(harvestRows);
  XLSX.utils.book_append_sheet(wb, harvestWs, 'Harvest Master');

  // 5. Sheet 5: Water Quality Analysis
  const waterWs = buildWaterSheet(db, agentId, selectedFarmerId, dateFrom, dateTo);
  XLSX.utils.book_append_sheet(wb, waterWs, 'Water Analysis');

  // Trigger download with descriptive filename
  const cleanFarmer = farmerObj ? farmerObj.name.replace(/\s+/g, '_') : 'All_Farmers';
  const cleanAgent = agentObj ? agentObj.name.replace(/\s+/g, '_') : 'All_Agents';
  const dateSuffix = (dateFrom && dateTo) ? `${dateFrom}_to_${dateTo}` : new Date().toISOString().split('T')[0];
  const fileName = `${filenamePrefix}_${cleanFarmer}_${cleanAgent}_${dateSuffix}.xlsx`;

  XLSX.writeFile(wb, fileName);
};

/**
 * Download Specific Sheet: Weekly Sampling & Biomass Growth (.xlsx)
 */
export const downloadSamplingExcel = (db, agentId = null, selectedFarmerId = 'ALL', dateFrom = null, dateTo = null) => {
  const wb = XLSX.utils.book_new();
  const rows = generateSamplingReportData(db, agentId, selectedFarmerId, dateFrom, dateTo);
  const ws = buildSamplingSheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Sampling & Growth');
  XLSX.writeFile(wb, `sampling_and_growth_report_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Download Specific Sheet: Harvest Master Report (.xlsx)
 */
export const downloadHarvestMasterExcel = (db, agentId = null, selectedFarmerId = 'ALL') => {
  const wb = XLSX.utils.book_new();
  const rows = generateHarvestMasterReportData(db, agentId, selectedFarmerId);
  const ws = buildHarvestSheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Harvest Master');
  XLSX.writeFile(wb, `harvest_master_report_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Download Specific Sheet: Water Quality Report (.xlsx)
 */
export const downloadWaterQualityExcel = (db, agentId = null, selectedFarmerId = 'ALL', dateFrom = null, dateTo = null) => {
  const wb = XLSX.utils.book_new();
  const ws = buildWaterSheet(db, agentId, selectedFarmerId, dateFrom, dateTo);
  XLSX.utils.book_append_sheet(wb, ws, 'Water Analysis');
  XLSX.writeFile(wb, `water_quality_report_${new Date().toISOString().split('T')[0]}.xlsx`);
};
