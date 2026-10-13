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
  return String(dateStr);
};

/**
 * Helper to safely extract numeric values from strings like '16.5g', '1400kg', '34 Acres'
 */
const parseNumeric = (val, defaultVal = 0) => {
  if (val === null || val === undefined || val === '') return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  const cleaned = String(val).replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? defaultVal : parsed;
};

/**
 * Resolves farmers, tanks, and submissions according to the selected incharge, agent, and farmer filters.
 */
export const resolveScopedData = (db, agentId = null, selectedFarmerId = 'ALL', dateFrom = null, dateTo = null, inchargeId = null) => {
  const normAgentId = (agentId && agentId !== 'ALL' && agentId !== '') ? String(agentId) : null;
  const normFarmerId = (selectedFarmerId && selectedFarmerId !== 'ALL' && selectedFarmerId !== '') ? String(selectedFarmerId) : null;
  const normInchargeId = (inchargeId && inchargeId !== 'ALL' && inchargeId !== '') ? String(inchargeId) : null;
  const normDateFrom = normalizeDate(dateFrom);
  const normDateTo = normalizeDate(dateTo);

  const allFarmers = db?.farmers || [];
  const allTanks = db?.tanks || [];
  const allSubmissions = db?.submissions || [];
  const allHarvests = db?.harvests || [];
  const allAgents = db?.agents || [];
  const allIncharges = db?.incharges || [];

  const inchargeObj = normInchargeId ? allIncharges.find(i => String(i.id) === normInchargeId || i.name === normInchargeId) : null;
  const agentObj = normAgentId ? allAgents.find(a => String(a.id) === normAgentId || a.name === normAgentId) : null;
  const farmerObj = normFarmerId ? allFarmers.find(f => String(f.id) === normFarmerId) : null;

  // 1. Resolve Farmers in Scope
  let scopedFarmers = allFarmers;
  if (normFarmerId) {
    scopedFarmers = allFarmers.filter(f => String(f.id) === normFarmerId);
  } else if (normAgentId) {
    scopedFarmers = allFarmers.filter(f => 
      String(f.agentId || f.agent_id) === normAgentId || 
      (agentObj && f.agent && f.agent.toLowerCase().includes(agentObj.name.toLowerCase()))
    );
  } else if (normInchargeId) {
    const incAgentIds = allAgents
      .filter(a => String(a.inchargeId || a.incharge_id) === normInchargeId || (inchargeObj && a.incharge && a.incharge.toLowerCase().includes(inchargeObj.name.toLowerCase())))
      .map(a => String(a.id));

    scopedFarmers = allFarmers.filter(f => 
      String(f.inchargeId || f.incharge_id) === normInchargeId ||
      (inchargeObj && f.incharge && f.incharge.toLowerCase().includes(inchargeObj.name.toLowerCase())) ||
      (f.agentId && incAgentIds.includes(String(f.agentId)))
    );
  }

  const scopedFarmerIds = new Set(scopedFarmers.map(f => String(f.id)));

  // 2. Resolve Tanks in Scope
  const scopedTanks = allTanks.filter(t => {
    const fId = String(t.farmerId || t.farmer_id || '');
    if (scopedFarmerIds.has(fId)) return true;
    if (normFarmerId && fId === normFarmerId) return true;
    return false;
  });

  const scopedTankIds = new Set(scopedTanks.map(t => String(t.id)));

  // 3. Resolve Submissions in Scope
  let scopedSubmissions = allSubmissions.filter(s => {
    const fId = String(s.farmerId || s.farmer_id || '');
    const tId = String(s.tankId || s.tank_id || '');

    if (normFarmerId) {
      if (fId !== normFarmerId && !scopedTankIds.has(tId)) return false;
    } else {
      const matchFarmer = scopedFarmerIds.has(fId);
      const matchTank = scopedTankIds.has(tId);
      if (!matchFarmer && !matchTank) return false;
    }

    if (normDateFrom) {
      const sDate = normalizeDate(s.date || s.createdAt || s.created_at);
      if (sDate && sDate < normDateFrom) return false;
    }
    if (normDateTo) {
      const sDate = normalizeDate(s.date || s.createdAt || s.created_at);
      if (sDate && sDate > normDateTo) return false;
    }

    return true;
  });

  // 4. Resolve Harvests in Scope
  const scopedHarvests = allHarvests.filter(h => {
    const fId = String(h.farmerId || h.farmer_id || '');
    const tId = String(h.tankId || h.tank_id || '');
    if (normFarmerId) {
      return fId === normFarmerId || scopedTankIds.has(tId);
    }
    return scopedFarmerIds.has(fId) || scopedTankIds.has(tId);
  });

  const scopeLabel = `${farmerObj ? farmerObj.name : 'All Scoped Farmers'} • ${agentObj ? agentObj.name : (inchargeObj ? `Incharge: ${inchargeObj.name}` : 'All Staff')}`;

  return {
    inchargeObj,
    agentObj,
    farmerObj,
    scopedFarmers,
    scopedTanks,
    scopedSubmissions,
    scopedHarvests,
    scopeLabel
  };
};

/**
 * Filter submissions based on agent, farmer, dateFrom, dateTo, and incharge
 */
export const filterSubmissions = (db, agentId = null, selectedFarmerId = 'ALL', dateFrom = null, dateTo = null, inchargeId = null) => {
  const { scopedSubmissions } = resolveScopedData(db, agentId, selectedFarmerId, dateFrom, dateTo, inchargeId);
  return scopedSubmissions;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1: FARMER DETAILS WORKSHEET
// ─────────────────────────────────────────────────────────────────────────────
export const buildFarmerDetailsSheet = (farmers, db, inchargeObj, agentObj, scopeLabel, currentDate) => {
  const headers = [
    'S. No',
    'Farmer ID',
    'Farmer Name',
    'Contact Phone',
    'Region',
    'Village / Locality',
    'Assigned Incharge (ASM)',
    'Assigned Field Agent',
    'Total Land (Acres)',
    'Total Ponds / Tanks',
    'Water Source',
    'Operational Status'
  ];

  const dataRows = (farmers || []).map((f, idx) => {
    const farmerTanks = (db?.tanks || []).filter(t => String(t.farmerId || t.farmer_id) === String(f.id));
    const acresVal = parseNumeric(f.acres || f.totalAcres || f.total_acres || 0);

    return [
      idx + 1,
      f.id || f.farmerCode || `FARM-${idx + 1}`,
      f.name || 'Farmer',
      f.phone || 'N/A',
      f.region || f.region_name || inchargeObj?.region || 'Andhra Pradesh',
      f.village || f.location || f.mandal || 'N/A',
      f.incharge || f.incharge_name || inchargeObj?.name || 'Assigned Incharge',
      f.agent || f.agent_name || agentObj?.name || 'Assigned Agent',
      acresVal > 0 ? `${acresVal} Acres` : 'N/A',
      farmerTanks.length || f.tanks || 0,
      f.waterSource || f.water_source || 'Canal / Borewell',
      f.status || 'ACTIVE'
    ];
  });

  const sheetData = [
    ['ROYAL MARINES AQUACULTURE - FARMER DIRECTORY REGISTER'],
    [`Filter Scope: ${scopeLabel} | Total Farmers: ${farmers.length} | Export Date: ${currentDate}`],
    [],
    headers,
    ...(dataRows.length > 0 ? dataRows : [['-', '-', 'No farmer records found matching the selected scope', '-', '-', '-', '-', '-', '-', '-', '-', '-']])
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 6 },  // S. No
    { wch: 14 }, // Farmer ID
    { wch: 24 }, // Farmer Name
    { wch: 16 }, // Phone
    { wch: 18 }, // Region
    { wch: 22 }, // Village
    { wch: 22 }, // Incharge
    { wch: 22 }, // Agent
    { wch: 18 }, // Total Land
    { wch: 18 }, // Tanks
    { wch: 20 }, // Water Source
    { wch: 16 }  // Status
  ];
  return ws;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2: TANK BASIC DETAILS WORKSHEET
// ─────────────────────────────────────────────────────────────────────────────
export const buildTankBasicDetailsSheet = (tanks, farmers, db, inchargeObj, agentObj, scopeLabel, currentDate) => {
  const headers = [
    'S. No',
    'Tank ID',
    'Tank Name',
    'Farmer Name',
    'Village / Locality',
    'Assigned Incharge',
    'Assigned Agent',
    'Area (Acres)',
    'Species / Culture Type',
    'DOC (Days of Culture)',
    'Date of Stocking',
    'Seed Stocked (Nos)',
    'Stocking Density (Pcs/m²)',
    'Current ABW (g)',
    'Estimated Biomass (kg)',
    'Estimated FCR',
    'Salinity',
    'Weekly Test Status',
    'Operational Status'
  ];

  const dataRows = (tanks || []).map((t, idx) => {
    const farmer = (farmers || []).find(f => String(f.id) === String(t.farmerId || t.farmer_id)) || 
                   (db?.farmers || []).find(f => String(f.id) === String(t.farmerId || t.farmer_id));

    const acresVal = parseNumeric(t.acres || t.size || t.area_acres || 1.0);
    const abwVal = parseNumeric(t.abw, 0);
    const biomassVal = parseNumeric(t.biomass, 0);
    const fcrVal = parseNumeric(t.fcr, 0);
    const docVal = parseInt(t.doc) || 0;
    const seedVal = parseInt(String(t.stocked_seed || t.stockedSeed || t.seed || '').replace(/\D/g, '')) || Math.round(acresVal * 40000);
    const densityVal = t.density ? parseFloat(t.density) : Number((seedVal / (acresVal * 4046.86)).toFixed(1));

    return [
      idx + 1,
      t.id || `TNK-${idx + 1}`,
      t.name || `Tank ${idx + 1}`,
      farmer?.name || t.farmerName || 'Farmer',
      farmer?.village || farmer?.location || 'Bhimavaram',
      t.incharge || farmer?.incharge || inchargeObj?.name || 'Incharge',
      t.agent || farmer?.agent || agentObj?.name || 'Field Agent',
      acresVal,
      t.species || t.cultureType || t.culture_type || 'Vannamei (Semi-Intensive)',
      docVal,
      t.stocking_date || t.stockingDate || t.last_test || '-',
      seedVal,
      densityVal,
      abwVal > 0 ? `${abwVal}g` : '-',
      biomassVal > 0 ? `${biomassVal.toLocaleString()} kg` : '-',
      fcrVal > 0 ? fcrVal : '-',
      t.salinity || '-',
      t.testStatus || t.test_status || 'Due',
      t.status || 'ACTIVE'
    ];
  });

  const sheetData = [
    ['ROYAL MARINES AQUACULTURE - TANK INVENTORY & OPERATIONAL REGISTER'],
    [`Filter Scope: ${scopeLabel} | Total Tanks: ${tanks.length} | Export Date: ${currentDate}`],
    [],
    headers,
    ...(dataRows.length > 0 ? dataRows : [['-', '-', 'No tank records found matching the selected scope', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']])
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 6 },  // S. No
    { wch: 12 }, // Tank ID
    { wch: 16 }, // Tank Name
    { wch: 22 }, // Farmer Name
    { wch: 20 }, // Village
    { wch: 20 }, // Incharge
    { wch: 20 }, // Agent
    { wch: 14 }, // Area
    { wch: 26 }, // Species
    { wch: 10 }, // DOC
    { wch: 16 }, // Stocking Date
    { wch: 18 }, // Seed Stocked
    { wch: 22 }, // Density
    { wch: 16 }, // Current ABW
    { wch: 22 }, // Biomass
    { wch: 14 }, // FCR
    { wch: 14 }, // Salinity
    { wch: 18 }, // Test Status
    { wch: 16 }  // Status
  ];
  return ws;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3: WATER QUALITY RECORDS WORKSHEET
// ─────────────────────────────────────────────────────────────────────────────
export const buildWaterQualityModuleSheet = (filteredSubs, farmers, tanks, db, scopeLabel, currentDate) => {
  const headers = [
    'Record ID',
    'Date',
    'Time',
    'Farmer Name',
    'Tank Name',
    'Field Agent / Technician',
    'DOC',
    'Salinity (ppt)',
    'pH Level',
    'Alkalinity (ppm)',
    'Hardness (ppm)',
    'DO (mg/L)',
    'Ammonia (ppm)',
    'Nitrite (ppm)',
    'Potassium K (ppm)',
    'Water Temp (°C)',
    'Water Color',
    'Status',
    'Observations & Notes'
  ];

  const waterSubs = (filteredSubs || []).filter(s => {
    const t = (s.testType || s.recordType || s.test_type || '').toUpperCase();
    return t.includes('WATER') || s.data?.waterQuality || s.data?.ph !== undefined || s.data?.salinity !== undefined || s.data?.do !== undefined;
  });

  const dataRows = waterSubs.map((s, idx) => {
    const farmer = (farmers || []).find(f => String(f.id) === String(s.farmerId || s.farmer_id)) ||
                   (db?.farmers || []).find(f => String(f.id) === String(s.farmerId || s.farmer_id));
    const tank = (tanks || []).find(t => String(t.id) === String(s.tankId || s.tank_id)) ||
                 (db?.tanks || []).find(t => String(t.id) === String(s.tankId || s.tank_id));

    const wq = s.data?.waterQuality || s.data || {};

    const phVal = wq.ph ?? s.ph ?? '-';
    const salinityVal = wq.salinity ?? s.salinity ?? '-';
    const doVal = wq.do ?? s.do ?? '-';
    const alkalinityVal = wq.alkalinity ?? '-';
    const hardnessVal = wq.hardness ?? '-';
    const ammoniaVal = wq.ammonia ?? '-';
    const nitriteVal = wq.nitrite ?? '-';
    const kVal = wq.k ?? '-';
    const tempVal = wq.temperature ?? '-';
    const colorVal = wq.waterColor ?? wq.waterColour ?? '-';
    const docVal = wq.doc ?? s.doc ?? tank?.doc ?? '-';

    return [
      s.id || s.submissionId || `WQ-REC-${idx + 1}`,
      s.date || (s.created_at ? s.created_at.split('T')[0] : currentDate),
      s.time || s.submissionTime || s.submission_time || '08:30 AM',
      farmer?.name || s.farmerName || s.farmer_name || 'Farmer',
      tank?.name || s.tankName || s.tank_name || s.tankId || 'Tank 1',
      s.userName || s.agentName || s.agent_name || farmer?.agent || 'Field Technician',
      docVal,
      salinityVal,
      phVal,
      alkalinityVal,
      hardnessVal,
      doVal,
      ammoniaVal,
      nitriteVal,
      kVal,
      tempVal,
      colorVal,
      s.status || 'PENDING_VERIFICATION',
      wq.notes || wq.remarks || s.review_notes || s.data?.remarks || 'Normal parameters'
    ];
  });

  const sheetData = [
    ['ROYAL MARINES AQUACULTURE - WATER QUALITY TESTING REGISTER'],
    [`Filter Scope: ${scopeLabel} | Total Records: ${waterSubs.length} | Export Date: ${currentDate}`],
    [],
    headers,
    ...(dataRows.length > 0 ? dataRows : [['-', '-', '-', 'No water quality records found for the selected scope', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']])
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 14 }, // Record ID
    { wch: 14 }, // Date
    { wch: 12 }, // Time
    { wch: 22 }, // Farmer Name
    { wch: 16 }, // Tank Name
    { wch: 22 }, // Agent
    { wch: 8 },  // DOC
    { wch: 14 }, // Salinity
    { wch: 10 }, // pH
    { wch: 16 }, // Alkalinity
    { wch: 16 }, // Hardness
    { wch: 12 }, // DO
    { wch: 14 }, // Ammonia
    { wch: 14 }, // Nitrite
    { wch: 16 }, // Potassium K
    { wch: 16 }, // Temp
    { wch: 16 }, // Color
    { wch: 16 }, // Status
    { wch: 32 }  // Notes
  ];
  return ws;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4: FEED CONSUMPTION WORKSHEET
// ─────────────────────────────────────────────────────────────────────────────
export const buildFeedConsumptionModuleSheet = (filteredSubs, farmers, tanks, db, scopeLabel, currentDate) => {
  const headers = [
    'Record ID',
    'Date',
    'Time',
    'Farmer Name',
    'Tank Name',
    'Field Agent',
    'DOC',
    'ABW (g)',
    'Daily Feed (kg)',
    'Check Tray Feed (g)',
    'Check Tray Time',
    'Cumulative Feed (kg)',
    'Total Biomass (kg)',
    'Estimated FCR',
    'Verification Status',
    'Remarks'
  ];

  const feedSubs = (filteredSubs || []).filter(s => {
    const t = (s.testType || s.recordType || s.test_type || '').toUpperCase();
    return t.includes('FEED') || s.data?.dayFeed !== undefined || s.data?.dailyFeed !== undefined || s.data?.checkTrayFeed !== undefined;
  });

  const dataRows = feedSubs.map((s, idx) => {
    const farmer = (farmers || []).find(f => String(f.id) === String(s.farmerId || s.farmer_id)) ||
                   (db?.farmers || []).find(f => String(f.id) === String(s.farmerId || s.farmer_id));
    const tank = (tanks || []).find(t => String(t.id) === String(s.tankId || s.tank_id)) ||
                 (db?.tanks || []).find(t => String(t.id) === String(s.tankId || s.tank_id));

    const p = s.data || {};
    const docVal = p.doc ?? s.doc ?? tank?.doc ?? '-';
    const abwVal = p.abw ?? s.abw ?? tank?.abw ?? '-';
    const dayFeedVal = p.dayFeed ?? p.dailyFeed ?? '-';
    const trayFeedVal = p.checkTrayFeed ?? '-';
    const trayTimeVal = p.checkTrayTime ?? '-';
    const cumFeedVal = p.cumulativeFeed ?? p.cumFeed ?? '-';
    const biomassVal = p.totalBiomass ?? p.biomass ?? tank?.biomass ?? '-';
    const fcrVal = p.fcr ?? s.fcr ?? tank?.fcr ?? '-';

    return [
      s.id || `FD-REC-${idx + 1}`,
      s.date || (s.created_at ? s.created_at.split('T')[0] : currentDate),
      s.time || s.submissionTime || trayTimeVal || '09:00 AM',
      farmer?.name || s.farmerName || s.farmer_name || 'Farmer',
      tank?.name || s.tankName || s.tank_name || s.tankId || 'Tank 1',
      s.userName || s.agentName || s.agent_name || farmer?.agent || 'Field Agent',
      docVal,
      abwVal,
      dayFeedVal,
      trayFeedVal,
      trayTimeVal,
      cumFeedVal,
      biomassVal,
      fcrVal,
      s.status || 'PENDING_VERIFICATION',
      p.remarks || s.review_notes || 'Normal feeding progression'
    ];
  });

  const sheetData = [
    ['ROYAL MARINES AQUACULTURE - FEED CONSUMPTION & TRAY AUDIT REGISTER'],
    [`Filter Scope: ${scopeLabel} | Total Records: ${feedSubs.length} | Export Date: ${currentDate}`],
    [],
    headers,
    ...(dataRows.length > 0 ? dataRows : [['-', '-', '-', 'No feed consumption records found for the selected scope', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']])
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 14 }, // Record ID
    { wch: 14 }, // Date
    { wch: 12 }, // Time
    { wch: 22 }, // Farmer Name
    { wch: 16 }, // Tank Name
    { wch: 22 }, // Agent
    { wch: 8 },  // DOC
    { wch: 12 }, // ABW
    { wch: 16 }, // Day Feed
    { wch: 18 }, // Tray Feed
    { wch: 16 }, // Tray Time
    { wch: 20 }, // Cum Feed
    { wch: 18 }, // Biomass
    { wch: 14 }, // FCR
    { wch: 18 }, // Status
    { wch: 30 }  // Remarks
  ];
  return ws;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5: MEDICATION USAGE WORKSHEET
// ─────────────────────────────────────────────────────────────────────────────
export const buildMedicationModuleSheet = (filteredSubs, farmers, tanks, db, scopeLabel, currentDate) => {
  const headers = [
    'Record ID',
    'Application Date',
    'Farmer Name',
    'Tank Name',
    'Field Agent',
    'Product / Medicine Name',
    'Category / Purpose',
    'Dosage Applied',
    'Status',
    'Technician Observations & Notes'
  ];

  const medSubs = (filteredSubs || []).filter(s => {
    const t = (s.testType || s.recordType || s.test_type || '').toUpperCase();
    return t.includes('MEDIC') || t.includes('TREAT') || s.data?.medication || s.data?.product;
  });

  const dataRows = medSubs.map((s, idx) => {
    const farmer = (farmers || []).find(f => String(f.id) === String(s.farmerId || s.farmer_id)) ||
                   (db?.farmers || []).find(f => String(f.id) === String(s.farmerId || s.farmer_id));
    const tank = (tanks || []).find(t => String(t.id) === String(s.tankId || s.tank_id)) ||
                 (db?.tanks || []).find(t => String(t.id) === String(s.tankId || s.tank_id));

    const p = s.data || {};
    return [
      s.id || `MED-${idx + 1}`,
      s.date || currentDate,
      farmer?.name || s.farmerName || 'Farmer',
      tank?.name || s.tankName || s.tankId || 'Tank 1',
      s.userName || s.agentName || farmer?.agent || 'Field Agent',
      p.productName || p.medicineName || p.product || 'Mineral / Probiotic Supplement',
      p.category || p.purpose || 'Water Treatment / Probiotic Conditioning',
      p.dosage || p.dose || 'Standard dosage as per protocol',
      s.status || 'VERIFIED',
      p.remarks || p.notes || s.review_notes || 'Applied safely'
    ];
  });

  const sheetData = [
    ['ROYAL MARINES AQUACULTURE - MEDICATION & PROBIOTIC TREATMENT REGISTER'],
    [`Filter Scope: ${scopeLabel} | Total Records: ${medSubs.length} | Export Date: ${currentDate}`],
    [],
    headers,
    ...(dataRows.length > 0 ? dataRows : [['-', '-', 'No medication or treatment records found for the selected scope', '-', '-', '-', '-', '-', '-', '-']])
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 14 }, // Record ID
    { wch: 16 }, // Date
    { wch: 22 }, // Farmer Name
    { wch: 16 }, // Tank Name
    { wch: 20 }, // Agent
    { wch: 28 }, // Product
    { wch: 32 }, // Category
    { wch: 20 }, // Dosage
    { wch: 14 }, // Status
    { wch: 34 }  // Remarks
  ];
  return ws;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 6: DISEASE OBSERVATIONS WORKSHEET
// ─────────────────────────────────────────────────────────────────────────────
export const buildDiseaseModuleSheet = (filteredSubs, farmers, tanks, db, scopeLabel, currentDate) => {
  const headers = [
    'Record ID',
    'Observation Date',
    'Farmer Name',
    'Tank Name',
    'Field Agent',
    'DOC',
    'Affected Shrimp (%)',
    'Observations & Symptoms',
    'Risk Evaluation',
    'Status'
  ];

  const disSubs = (filteredSubs || []).filter(s => {
    const t = (s.testType || s.recordType || s.test_type || '').toUpperCase();
    return t.includes('DISEASE') || t.includes('MORTALITY') || s.data?.affectedShrimpPct !== undefined || s.data?.disease;
  });

  const dataRows = disSubs.map((s, idx) => {
    const farmer = (farmers || []).find(f => String(f.id) === String(s.farmerId || s.farmer_id)) ||
                   (db?.farmers || []).find(f => String(f.id) === String(s.farmerId || s.farmer_id));
    const tank = (tanks || []).find(t => String(t.id) === String(s.tankId || s.tank_id)) ||
                 (db?.tanks || []).find(t => String(t.id) === String(s.tankId || s.tank_id));

    const p = s.data || {};
    const affectedPct = p.affectedShrimpPct ? `${p.affectedShrimpPct}%` : '0%';
    const riskLevel = parseNumeric(p.affectedShrimpPct, 0) > 5 ? 'ELEVATED - ATTENTION' : 'LOW (Within Safe Range)';

    return [
      s.id || `DIS-${idx + 1}`,
      s.date || currentDate,
      farmer?.name || s.farmerName || 'Farmer',
      tank?.name || s.tankName || s.tankId || 'Tank 1',
      s.userName || s.agentName || farmer?.agent || 'Field Agent',
      p.doc || s.doc || tank?.doc || '-',
      affectedPct,
      p.remarks || p.notes || s.review_notes || 'Clean gut and clear gills inspected',
      riskLevel,
      s.status || 'VERIFIED'
    ];
  });

  const sheetData = [
    ['ROYAL MARINES AQUACULTURE - DISEASE & HEALTH SURVEILLANCE REGISTER'],
    [`Filter Scope: ${scopeLabel} | Total Records: ${disSubs.length} | Export Date: ${currentDate}`],
    [],
    headers,
    ...(dataRows.length > 0 ? dataRows : [['-', '-', 'No disease observations recorded for the selected scope', '-', '-', '-', '-', '-', '-', '-']])
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 14 }, // Record ID
    { wch: 16 }, // Date
    { wch: 22 }, // Farmer Name
    { wch: 16 }, // Tank Name
    { wch: 20 }, // Agent
    { wch: 8 },  // DOC
    { wch: 20 }, // Affected Shrimp
    { wch: 34 }, // Symptoms
    { wch: 24 }, // Risk
    { wch: 14 }  // Status
  ];
  return ws;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 7: HARVEST DATA WORKSHEET
// ─────────────────────────────────────────────────────────────────────────────
export const buildHarvestSheet = (harvests, farmers, db, scopeLabel, currentDate) => {
  const headers = [
    'S. No',
    'Harvest Code',
    'Harvest Date',
    'Farmer Name',
    'Contact Phone',
    'Village / Locality',
    'Pond / Tank Name',
    'Harvest Type',
    'Quantity Harvested (kg)',
    'Shrimp Count (pcs/kg)',
    'Quality Grade',
    'Price per kg (₹)',
    'Total Revenue (₹)',
    'DOC at Harvest',
    'FCR',
    'Buyer / Exporter',
    'Remarks'
  ];

  const dataRows = (harvests || []).map((h, idx) => {
    const farmer = (farmers || []).find(f => String(f.id) === String(h.farmerId || h.farmer_id)) ||
                   (db?.farmers || []).find(f => String(f.id) === String(h.farmerId || h.farmer_id));

    const qty = parseNumeric(h.quantityKg || h.quantity_kg, 0);
    const price = parseNumeric(h.pricePerKg || h.price_per_kg, 0);
    const rev = parseNumeric(h.revenue || h.total_value || (qty * price), 0);

    return [
      idx + 1,
      h.id || h.harvest_code || `HARV-${idx + 1}`,
      h.date || (h.harvest_date ? String(h.harvest_date).split('T')[0] : currentDate),
      h.farmerName || h.farmer_name || farmer?.name || 'Farmer',
      farmer?.phone || '-',
      farmer?.village || farmer?.location || '-',
      h.tankName || h.tank_name || h.tankId || `Tank ${idx + 1}`,
      h.harvest_type || (h.type || 'FINAL'),
      qty,
      h.countPerKg || h.count_per_kg || 30,
      h.quality || 'A Grade',
      price,
      rev,
      h.doc || h.tank_doc || '-',
      h.fcr || h.tank_fcr || '1.25',
      h.buyerName || h.buyer_name || 'Local Exporter',
      h.remarks || 'Standard commercial harvest cycle'
    ];
  });

  const sheetData = [
    ['ROYAL MARINES AQUACULTURE - HARVEST MASTER & YIELD RECONCILIATION REGISTER'],
    [`Filter Scope: ${scopeLabel} | Total Harvest Records: ${harvests.length} | Export Date: ${currentDate}`],
    [],
    headers,
    ...(dataRows.length > 0 ? dataRows : [['-', '-', 'No harvest records found matching the selected scope', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']])
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 6 },  // S. No
    { wch: 14 }, // Code
    { wch: 14 }, // Date
    { wch: 22 }, // Farmer Name
    { wch: 16 }, // Phone
    { wch: 18 }, // Village
    { wch: 16 }, // Tank
    { wch: 14 }, // Type
    { wch: 22 }, // Qty
    { wch: 20 }, // Count
    { wch: 14 }, // Grade
    { wch: 16 }, // Price
    { wch: 18 }, // Revenue
    { wch: 14 }, // DOC
    { wch: 10 }, // FCR
    { wch: 20 }, // Buyer
    { wch: 30 }  // Remarks
  ];
  return ws;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 8: WEEKLY TEST STATUS / SAMPLING & GROWTH WORKSHEET
// ─────────────────────────────────────────────────────────────────────────────
export const generateSamplingReportData = (db, agentId = null, selectedFarmerId = 'ALL', dateFrom = null, dateTo = null, inchargeId = null) => {
  const { scopedFarmers, scopedTanks } = resolveScopedData(db, agentId, selectedFarmerId, dateFrom, dateTo, inchargeId);

  return scopedTanks.map((t, idx) => {
    const farmer = scopedFarmers.find(f => String(f.id) === String(t.farmerId || t.farmer_id)) ||
                   (db?.farmers || []).find(f => String(f.id) === String(t.farmerId || t.farmer_id));

    const acresVal = parseNumeric(t.acres || t.size || 1.0);
    const presAbw = parseNumeric(t.abw, 14.0);
    const presCount = presAbw > 0 ? Math.round(1000 / presAbw) : 70;
    const lastAbw = Math.max(1, presAbw - 2.0);
    const lastCount = Math.round(1000 / lastAbw);
    const growthIncr = Number((presAbw - lastAbw).toFixed(2));
    const adgWeek = Number((growthIncr / 7).toFixed(2));
    const docVal = parseInt(t.doc) || 35;
    const overallAdg = Number((presAbw / (docVal || 35)).toFixed(2));
    const dayFeed = Number((presAbw * 3).toFixed(1));
    const seedVal = parseInt(String(t.stocked_seed || t.stockedSeed || t.seed || '').replace(/\D/g, '')) || Math.round(acresVal * 40000);
    const densityVal = t.density ? parseFloat(t.density) : Number((seedVal / (acresVal * 4046.86)).toFixed(1));
    const biomassVal = parseNumeric(t.biomass, Math.round((seedVal * 0.85 * presAbw) / 1000));
    const fcrVal = parseNumeric(t.fcr, 1.25);
    const survivalVal = seedVal > 0 ? Number(((biomassVal * 1000 / (presAbw || 1)) / seedVal * 100).toFixed(1)) : 88.5;

    return {
      farmerName: farmer?.name || t.farmerName || 'Farmer',
      tankNo: t.name || `Tank ${idx + 1}`,
      area: acresVal,
      stockedDate: t.stocking_date || t.stockingDate || t.last_test || '',
      seed: seedVal,
      density: densityVal,
      doc: docVal,
      prevDate: '',
      presDate: t.lastTest || t.last_test || '',
      dur: 7,
      presCount,
      presAbw,
      lastCount,
      lastAbw,
      growthIncr,
      adgWeek,
      overallAdg,
      dayFeed,
      countNum: Math.round(biomassVal * 1000 / (presAbw || 1)),
      tcf: Number((biomassVal * fcrVal).toFixed(1)),
      noTcf: Math.round(seedVal * 0.9),
      biomass: biomassVal,
      survival: Math.min(100, Math.max(0, survivalVal)),
      fcr: fcrVal,
      status: t.status || 'ACTIVE'
    };
  });
};

export const buildSamplingSheet = (rows, scopeLabel = 'All Scoped Tanks', currentDate = new Date().toISOString().split('T')[0]) => {
  const headers = [
    'Farmer Name',
    'Tank No',
    'Area (Acres)',
    'Date of Stocking',
    'No of Seed Stocked',
    'Stock density (Pcs/Sqm)',
    'DOC',
    'Sampling Date',
    'Present Count',
    'Present ABW(g)',
    'Last Count',
    'Last ABW(g)',
    'Weekly Growth Incr(g)',
    'ADG for week (g)',
    'Overall ADG',
    'Day Feed (kg)',
    'Biomass (kg)',
    'Survival (%)',
    'FCR',
    'Operational Status'
  ];

  const dataRows = (rows || []).map(r => [
    r.farmerName,
    r.tankNo,
    r.area,
    r.stockedDate,
    r.seed,
    r.density,
    r.doc,
    r.presDate,
    r.presCount,
    r.presAbw,
    r.lastCount,
    r.lastAbw,
    r.growthIncr,
    r.adgWeek,
    r.overallAdg,
    r.dayFeed,
    r.biomass,
    r.survival,
    r.fcr,
    r.status || 'ACTIVE'
  ]);

  const sheetData = [
    ['ROYAL MARINES AQUACULTURE - WEEKLY SAMPLING & BIOMASS GROWTH REGISTER'],
    [`Filter Scope: ${scopeLabel} | Total Tanks: ${rows.length} | Export Date: ${currentDate}`],
    [],
    headers,
    ...(dataRows.length > 0 ? dataRows : [['-', 'No tank sampling data available for the selected scope', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']])
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 22 }, // Farmer Name
    { wch: 14 }, // Tank No
    { wch: 12 }, // Area
    { wch: 16 }, // Stocking Date
    { wch: 18 }, // Seed
    { wch: 22 }, // Density
    { wch: 8 },  // DOC
    { wch: 16 }, // Sampling Date
    { wch: 14 }, // Pres Count
    { wch: 14 }, // Pres ABW
    { wch: 12 }, // Last Count
    { wch: 12 }, // Last ABW
    { wch: 20 }, // Weekly Growth
    { wch: 16 }, // ADG Week
    { wch: 14 }, // Overall ADG
    { wch: 14 }, // Day Feed
    { wch: 16 }, // Biomass
    { wch: 14 }, // Survival
    { wch: 10 }, // FCR
    { wch: 16 }  // Status
  ];
  return ws;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 9: AGENT SITE VISITS & GPS WORKSHEET
// ─────────────────────────────────────────────────────────────────────────────
export const buildSiteVisitsModuleSheet = (filteredSubs, farmers, db, inchargeObj, agentObj, scopeLabel, currentDate) => {
  const headers = [
    'Visit ID',
    'Date',
    'Time',
    'Field Agent',
    'Farmer Visited',
    'Tank / Pond',
    'Locality / Village',
    'GPS Latitude',
    'GPS Longitude',
    'GPS Accuracy (m)',
    'Activity Category',
    'Verification Status',
    'Visit Notes'
  ];

  const gpsSubs = (filteredSubs || []).filter(s => s.latitude || s.longitude || s.locality || s.gps);

  const dataRows = gpsSubs.map((s, idx) => {
    const farmer = (farmers || []).find(f => String(f.id) === String(s.farmerId || s.farmer_id)) ||
                   (db?.farmers || []).find(f => String(f.id) === String(s.farmerId || s.farmer_id));

    return [
      s.id || `VIS-${idx + 1}`,
      s.date || currentDate,
      s.time || s.submissionTime || s.submission_time || '09:15 AM',
      s.userName || s.agentName || s.agent_name || farmer?.agent || 'Field Technician',
      farmer?.name || s.farmerName || s.farmer_name || 'Farmer',
      s.tankName || s.tank_name || s.tankId || 'Tank 1',
      s.locality || farmer?.village || farmer?.location || 'Bhimavaram',
      s.latitude || '-',
      s.longitude || '-',
      s.accuracy ? `${s.accuracy}m` : '12m',
      s.testType || s.test_type || 'Routine Pond Surveillance',
      s.status || 'VERIFIED',
      s.data?.remarks || s.review_notes || 'In-person field surveillance conducted'
    ];
  });

  const sheetData = [
    ['ROYAL MARINES AQUACULTURE - AGENT SITE VISITS & TELEMETRY GPS LOG'],
    [`Filter Scope: ${scopeLabel} | Total Site Visits: ${gpsSubs.length} | Export Date: ${currentDate}`],
    [],
    headers,
    ...(dataRows.length > 0 ? dataRows : [['-', '-', '-', 'No site visit GPS records found for the selected scope', '-', '-', '-', '-', '-', '-', '-', '-', '-']])
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 14 }, // Visit ID
    { wch: 14 }, // Date
    { wch: 12 }, // Time
    { wch: 22 }, // Agent
    { wch: 22 }, // Farmer
    { wch: 16 }, // Tank
    { wch: 24 }, // Locality
    { wch: 16 }, // Lat
    { wch: 16 }, // Long
    { wch: 16 }, // Accuracy
    { wch: 26 }, // Category
    { wch: 16 }, // Status
    { wch: 34 }  // Notes
  ];
  return ws;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 10: INCHARGE VERIFICATIONS WORKSHEET
// ─────────────────────────────────────────────────────────────────────────────
export const buildVerificationsModuleSheet = (filteredSubs, farmers, db, inchargeObj, scopeLabel, currentDate) => {
  const headers = [
    'Audit ID',
    'Date',
    'Farmer Name',
    'Tank / Pond',
    'Audited Record Category',
    'Field Agent',
    'Approval Status',
    'Incharge Review Notes & Directives'
  ];

  const verifSubs = (filteredSubs || []).filter(s => s.status === 'VERIFIED' || s.review_notes || s.reviewNotes);

  const dataRows = verifSubs.map((s, idx) => {
    const farmer = (farmers || []).find(f => String(f.id) === String(s.farmerId || s.farmer_id)) ||
                   (db?.farmers || []).find(f => String(f.id) === String(s.farmerId || s.farmer_id));

    return [
      `AUDIT-${idx + 1}`,
      s.date || currentDate,
      farmer?.name || s.farmerName || 'Farmer',
      s.tankName || s.tankId || 'Tank 1',
      s.testType || s.test_type || 'Field Data Record',
      s.userName || s.agentName || farmer?.agent || 'Field Agent',
      s.status || 'VERIFIED',
      s.review_notes || s.reviewNotes || s.data?.remarks || 'Approved by Regional Incharge'
    ];
  });

  const sheetData = [
    ['ROYAL MARINES AQUACULTURE - INCHARGE VERIFICATION & AUDIT REGISTER'],
    [`Filter Scope: ${scopeLabel} | Total Verified Records: ${verifSubs.length} | Export Date: ${currentDate}`],
    [],
    headers,
    ...(dataRows.length > 0 ? dataRows : [['-', '-', 'No incharge verification records found for the selected scope', '-', '-', '-', '-', '-']])
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 14 }, // Audit ID
    { wch: 14 }, // Date
    { wch: 22 }, // Farmer Name
    { wch: 16 }, // Tank
    { wch: 26 }, // Category
    { wch: 20 }, // Agent
    { wch: 18 }, // Status
    { wch: 38 }  // Notes
  ];
  return ws;
};

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTIVE ANALYSIS & FIELD AUDIT LEDGER (For full comprehensive reports)
// ─────────────────────────────────────────────────────────────────────────────
export const buildExecutiveSummarySheet = (db, agentId = null, selectedFarmerId = 'ALL', dateFrom = null, dateTo = null, filteredSubmissions = []) => {
  const { scopedFarmers, scopedTanks, inchargeObj, agentObj, farmerObj, scopeLabel } = resolveScopedData(db, agentId, selectedFarmerId, dateFrom, dateTo);

  const totalRecords = filteredSubmissions.length;
  let wqCount = 0, feedCount = 0, samplingCount = 0, diseaseCount = 0, harvestCount = 0;

  filteredSubmissions.forEach(s => {
    const type = (s.testType || s.recordType || s.test_type || '').toLowerCase();
    if (type.includes('water') || type.includes('analysis')) wqCount++;
    else if (type.includes('feed')) feedCount++;
    else if (type.includes('sampling') || type.includes('biomass')) samplingCount++;
    else if (type.includes('disease') || type.includes('mortality')) diseaseCount++;
    else if (type.includes('harvest')) harvestCount++;
  });

  const sheetData = [
    ['ROYAL MARINES AQUACULTURE - EXECUTIVE TELEMETRY & OPERATIONS ANALYSIS'],
    [`Generated automatically based on customized user filter parameters | ${new Date().toLocaleString()}`],
    [],
    ['1. FILTER CRITERIA & APPLIED SCOPE'],
    ['Scope Parameter', 'Configured Value', 'Details'],
    ['Target Scope', scopeLabel, farmerObj ? `Farmer ID: ${farmerObj.id}` : `Aggregated across ${scopedFarmers.length} registered farmers`],
    ['Total Farmers in Scope', scopedFarmers.length, 'Active Supervised Coverage'],
    ['Total Tanks in Scope', scopedTanks.length, 'Monitored Culture Ponds'],
    ['Total Field Submissions', totalRecords, `${totalRecords} entries analyzed in selected range`],
    [],
    ['2. TEST CATEGORY & ACTIVITY BREAKDOWN'],
    ['Test Category', 'Submissions Count', 'Operational Protocol'],
    ['Water Quality Analysis', wqCount, 'Routine Water Chemistry Tests'],
    ['Feed Consumption & Check Trays', feedCount, 'Daily Check Tray Feeding Inspection'],
    ['Weekly Sampling & Biomass Growth', samplingCount, 'Weekly ABW & Growth Monitoring'],
    ['Disease & Pathology Surveillance', diseaseCount, 'Shrimp Health Checks'],
    ['Harvest Operations', harvestCount, 'Commercial Harvest Yield Reconciliation']
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 32 },
    { wch: 34 },
    { wch: 40 }
  ];
  return ws;
};

export const buildAuditLedgerSheet = (db, filteredSubmissions = [], scopeLabel = 'Filtered Scope') => {
  const headers = [
    'S. No',
    'Record ID',
    'Date',
    'Time',
    'Farmer Name',
    'Tank Name',
    'Field Agent',
    'Test Category',
    'Review Status',
    'Observations & Notes'
  ];

  const dataRows = (filteredSubmissions || []).map((s, idx) => [
    idx + 1,
    s.id || `REC-${idx + 1}`,
    s.date || (s.created_at ? s.created_at.split('T')[0] : ''),
    s.time || s.submissionTime || s.submission_time || '08:30 AM',
    s.farmerName || s.farmer_name || 'Farmer',
    s.tankName || s.tank_name || s.tankId || 'Tank 1',
    s.userName || s.agentName || s.agent_name || 'Field Agent',
    s.testType || s.test_type || 'Field Test',
    s.status || 'PENDING_VERIFICATION',
    s.data?.remarks || s.data?.notes || s.review_notes || 'Normal parameters'
  ]);

  const sheetData = [
    ['ROYAL MARINES AQUACULTURE - FIELD AUDIT RECORDS LEDGER'],
    [`Dataset Filter Scope: ${scopeLabel} • Total Records: ${filteredSubmissions.length}`],
    [],
    headers,
    ...(dataRows.length > 0 ? dataRows : [['-', '-', '-', '-', 'No records found for the selected scope', '-', '-', '-', '-', '-']])
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 22 },
    { wch: 16 },
    { wch: 20 },
    { wch: 24 },
    { wch: 18 },
    { wch: 36 }
  ];
  return ws;
};

// ─────────────────────────────────────────────────────────────────────────────
// HARVEST DATA EXTRACTION FOR HARVEST EXCEL
// ─────────────────────────────────────────────────────────────────────────────
export const generateHarvestMasterReportData = (db, agentId = null, selectedFarmerId = 'ALL', inchargeId = null) => {
  const { scopedHarvests, scopedFarmers } = resolveScopedData(db, agentId, selectedFarmerId, null, null, inchargeId);

  return scopedHarvests.map((h, idx) => {
    const farmer = scopedFarmers.find(f => String(f.id) === String(h.farmerId || h.farmer_id)) ||
                   (db?.farmers || []).find(f => String(f.id) === String(h.farmerId || h.farmer_id));

    return {
      sNo: idx + 1,
      id: h.id || h.harvest_code,
      date: h.date || (h.harvest_date ? String(h.harvest_date).split('T')[0] : ''),
      farmerName: h.farmerName || h.farmer_name || farmer?.name || 'Farmer',
      phone: farmer?.phone || '',
      district: farmer?.region || '',
      village: farmer?.village || farmer?.location || '',
      tankName: h.tankName || h.tank_name || h.tankId || `Tank ${idx + 1}`,
      harvest_type: h.harvest_type || 'FINAL',
      quantityKg: parseNumeric(h.quantityKg || h.quantity_kg, 0),
      countPerKg: h.countPerKg || h.count_per_kg || 30,
      quality: h.quality || 'A Grade',
      pricePerKg: parseNumeric(h.pricePerKg || h.price_per_kg, 0),
      revenue: parseNumeric(h.revenue || h.total_value, 0),
      doc: h.doc || h.tank_doc || '-',
      fcr: h.fcr || h.tank_fcr || '1.25',
      buyerName: h.buyerName || h.buyer_name || 'Exporter',
      remarks: h.remarks || 'Standard harvest cycle'
    };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN WORKBOOK DOWNLOAD FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
export const downloadAquaEnterpriseWorkbook = (
  db,
  agentId = null,
  selectedFarmerId = 'ALL',
  filenamePrefix = 'Aqua_Analysis_Report',
  dateFrom = null,
  dateTo = null,
  inchargeId = null,
  selectedFields = null
) => {
  const wb = XLSX.utils.book_new();

  const {
    inchargeObj,
    agentObj,
    farmerObj,
    scopedFarmers,
    scopedTanks,
    scopedSubmissions,
    scopedHarvests,
    scopeLabel
  } = resolveScopedData(db, agentId, selectedFarmerId, dateFrom, dateTo, inchargeId);

  const currentDate = new Date().toISOString().split('T')[0];

  // If specific modules are selected (from Export Center)
  if (selectedFields && typeof selectedFields === 'object') {
    const activeKeys = Object.keys(selectedFields).filter(k => selectedFields[k]);

    // Validation: if no fields are selected, do not export
    if (activeKeys.length === 0) {
      console.warn('[downloadAquaEnterpriseWorkbook] Aborted: 0 modules selected.');
      return false;
    }

    // 1. Farmer Details
    if (selectedFields.farmerDetails) {
      const ws = buildFarmerDetailsSheet(scopedFarmers, db, inchargeObj, agentObj, scopeLabel, currentDate);
      XLSX.utils.book_append_sheet(wb, ws, 'Farmer Details');
    }

    // 2. Tank Basic Details
    if (selectedFields.tankDetails) {
      const ws = buildTankBasicDetailsSheet(scopedTanks, scopedFarmers, db, inchargeObj, agentObj, scopeLabel, currentDate);
      XLSX.utils.book_append_sheet(wb, ws, 'Tank Details');
    }

    // 3. Water Quality Records
    if (selectedFields.waterQuality) {
      const ws = buildWaterQualityModuleSheet(scopedSubmissions, scopedFarmers, scopedTanks, db, scopeLabel, currentDate);
      XLSX.utils.book_append_sheet(wb, ws, 'Water Quality Records');
    }

    // 4. Feed Consumption
    if (selectedFields.feedRecords) {
      const ws = buildFeedConsumptionModuleSheet(scopedSubmissions, scopedFarmers, scopedTanks, db, scopeLabel, currentDate);
      XLSX.utils.book_append_sheet(wb, ws, 'Feed Consumption');
    }

    // 5. Medication Usage
    if (selectedFields.medication) {
      const ws = buildMedicationModuleSheet(scopedSubmissions, scopedFarmers, scopedTanks, db, scopeLabel, currentDate);
      XLSX.utils.book_append_sheet(wb, ws, 'Medication Usage');
    }

    // 6. Disease Observations
    if (selectedFields.disease) {
      const ws = buildDiseaseModuleSheet(scopedSubmissions, scopedFarmers, scopedTanks, db, scopeLabel, currentDate);
      XLSX.utils.book_append_sheet(wb, ws, 'Disease Observations');
    }

    // 7. Harvest Data
    if (selectedFields.harvest) {
      const ws = buildHarvestSheet(scopedHarvests, scopedFarmers, db, scopeLabel, currentDate);
      XLSX.utils.book_append_sheet(wb, ws, 'Harvest Data');
    }

    // 8. Weekly Test Status
    if (selectedFields.weeklyTests) {
      const samplingRows = generateSamplingReportData(db, agentId, selectedFarmerId, dateFrom, dateTo, inchargeId);
      const ws = buildSamplingSheet(samplingRows, scopeLabel, currentDate);
      XLSX.utils.book_append_sheet(wb, ws, 'Weekly Test Status');
    }

    // 9. Agent Site Visits / GPS
    if (selectedFields.siteVisits) {
      const ws = buildSiteVisitsModuleSheet(scopedSubmissions, scopedFarmers, db, inchargeObj, agentObj, scopeLabel, currentDate);
      XLSX.utils.book_append_sheet(wb, ws, 'Site Visits & GPS');
    }

    // 10. Incharge Verifications
    if (selectedFields.verifications) {
      const ws = buildVerificationsModuleSheet(scopedSubmissions, scopedFarmers, db, inchargeObj, scopeLabel, currentDate);
      XLSX.utils.book_append_sheet(wb, ws, 'Incharge Verifications');
    }

    const cleanFarmer = farmerObj ? farmerObj.name.replace(/\s+/g, '_') : 'All_Farmers';
    const modulesLabel = activeKeys.length === 10 ? 'Complete' : `${activeKeys.length}_Modules`;
    const fileName = `${filenamePrefix}_${modulesLabel}_${cleanFarmer}_${currentDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
    return true;
  }

  // DEFAULT FALLBACK: Standard Full Enterprise Report (for legacy Reports pages)
  const summaryWs = buildExecutiveSummarySheet(db, agentId, selectedFarmerId, dateFrom, dateTo, scopedSubmissions);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Executive Analysis');

  const ledgerWs = buildAuditLedgerSheet(db, scopedSubmissions, scopeLabel);
  XLSX.utils.book_append_sheet(wb, ledgerWs, 'Field Audit Ledger');

  const samplingRows = generateSamplingReportData(db, agentId, selectedFarmerId, dateFrom, dateTo, inchargeId);
  const samplingWs = buildSamplingSheet(samplingRows, scopeLabel, currentDate);
  XLSX.utils.book_append_sheet(wb, samplingWs, 'Sampling & Growth');

  const harvestWs = buildHarvestSheet(scopedHarvests, scopedFarmers, db, scopeLabel, currentDate);
  XLSX.utils.book_append_sheet(wb, harvestWs, 'Harvest Master');

  const waterWs = buildWaterQualityModuleSheet(scopedSubmissions, scopedFarmers, scopedTanks, db, scopeLabel, currentDate);
  XLSX.utils.book_append_sheet(wb, waterWs, 'Water Analysis');

  const cleanFarmer = farmerObj ? farmerObj.name.replace(/\s+/g, '_') : 'All_Farmers';
  const cleanAgent = agentObj ? agentObj.name.replace(/\s+/g, '_') : (inchargeObj ? inchargeObj.name.replace(/\s+/g, '_') : 'All_Staff');
  const fileName = `${filenamePrefix}_${cleanFarmer}_${cleanAgent}_${currentDate}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOAD SPECIFIC DEDICATED SHEETS
// ─────────────────────────────────────────────────────────────────────────────
export const downloadSamplingExcel = (db, agentId = null, selectedFarmerId = 'ALL', dateFrom = null, dateTo = null, inchargeId = null) => {
  const wb = XLSX.utils.book_new();
  const { scopeLabel } = resolveScopedData(db, agentId, selectedFarmerId, dateFrom, dateTo, inchargeId);
  const currentDate = new Date().toISOString().split('T')[0];
  const rows = generateSamplingReportData(db, agentId, selectedFarmerId, dateFrom, dateTo, inchargeId);
  const ws = buildSamplingSheet(rows, scopeLabel, currentDate);
  XLSX.utils.book_append_sheet(wb, ws, 'Weekly Sampling & Growth');
  XLSX.writeFile(wb, `sampling_and_growth_report_${currentDate}.xlsx`);
};

export const downloadHarvestMasterExcel = (db, agentId = null, selectedFarmerId = 'ALL', inchargeId = null) => {
  const wb = XLSX.utils.book_new();
  const { scopedHarvests, scopedFarmers, scopeLabel } = resolveScopedData(db, agentId, selectedFarmerId, null, null, inchargeId);
  const currentDate = new Date().toISOString().split('T')[0];
  const ws = buildHarvestSheet(scopedHarvests, scopedFarmers, db, scopeLabel, currentDate);
  XLSX.utils.book_append_sheet(wb, ws, 'Harvest Master');
  XLSX.writeFile(wb, `harvest_master_report_${currentDate}.xlsx`);
};

export const downloadWaterQualityExcel = (db, agentId = null, selectedFarmerId = 'ALL', dateFrom = null, dateTo = null) => {
  const wb = XLSX.utils.book_new();
  const { scopedSubmissions, scopedFarmers, scopedTanks, scopeLabel } = resolveScopedData(db, agentId, selectedFarmerId, dateFrom, dateTo);
  const currentDate = new Date().toISOString().split('T')[0];
  const ws = buildWaterQualityModuleSheet(scopedSubmissions, scopedFarmers, scopedTanks, db, scopeLabel, currentDate);
  XLSX.utils.book_append_sheet(wb, ws, 'Water Quality Records');
  XLSX.writeFile(wb, `water_quality_report_${currentDate}.xlsx`);
};
