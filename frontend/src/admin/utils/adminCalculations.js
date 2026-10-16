/**
 * Pure business logic calculations and safe formatters for RoyalMarines Admin Portal.
 * Free of mock datasets and localStorage dependencies.
 */

export const calculateBiomass = (seedStockingLak, abw) => {
  const seeds = parseFloat(seedStockingLak);
  const weight = parseFloat(abw);
  if (isNaN(seeds) || isNaN(weight) || seeds <= 0 || weight <= 0) return 0;
  return Math.round(seeds * weight * 100);
};

export const calculateFCR = (cumulativeFeed, totalBiomass) => {
  const feed = parseFloat(cumulativeFeed);
  const bio = parseFloat(totalBiomass);
  if (isNaN(feed) || isNaN(bio) || bio <= 0 || feed <= 0) return '0.00';
  return (feed / bio).toFixed(2);
};

export const formatAbw = (val) => {
  if (val === null || val === undefined || val === '') return 'N/A';
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return 'N/A';
  return `${num.toFixed(1)}g`;
};

export const formatKg = (val) => {
  if (val === null || val === undefined || val === '') return '0 kg';
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return '0 kg';
  return `${num.toLocaleString()} kg`;
};

export const formatFcrDisplay = (feed, biomass) => {
  const bio = parseFloat(biomass);
  const f = parseFloat(feed);
  if (isNaN(bio) || isNaN(f) || bio <= 0 || f <= 0) return '0.00';
  return (f / bio).toFixed(2);
};

export const getFarmerById = (id, farmers = []) => {
  if (!id || !Array.isArray(farmers)) return null;
  const strId = String(id).trim().toLowerCase();
  return farmers.find(f => String(f.id).toLowerCase() === strId || String(f.farmerCode || f.farmer_code || '').toLowerCase() === strId) || null;
};

export const getTankById = (id, tanks = []) => {
  if (!id || !Array.isArray(tanks)) return null;
  const strId = String(id).trim().toLowerCase();
  return tanks.find(t => String(t.id).toLowerCase() === strId) || null;
};

export const getAgentById = (id, agents = []) => {
  if (!id || !Array.isArray(agents)) return null;
  const strId = String(id).trim().toLowerCase();
  return agents.find(a => String(a.id).toLowerCase() === strId) || null;
};

export const getInchargeById = (id, incharges = []) => {
  if (!id || !Array.isArray(incharges)) return null;
  const strId = String(id).trim().toLowerCase();
  return incharges.find(i => String(i.id).toLowerCase() === strId) || null;
};

export const getRegionById = (id, regions = []) => {
  if (!id || !Array.isArray(regions)) return null;
  const strId = String(id).trim().toLowerCase();
  return regions.find(r => String(r.id).toLowerCase() === strId || String(r.code || '').toLowerCase() === strId) || null;
};
