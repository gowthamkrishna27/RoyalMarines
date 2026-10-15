import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getTanks = async (req, res) => {
  try {
    const { farmerId, agentId, inchargeId, status, testStatus } = req.query;
    const tanks = await store.getTanks({ farmerId, agentId, inchargeId, status, testStatus });
    return sendSuccess(res, tanks, 'Tanks retrieved successfully', 200, {
      total: tanks.length,
    });
  } catch (error) {
    console.error('[Error in getTanks]', error);
    return sendError(res, 'Failed to retrieve tanks from database', 500);
  }
};

export const getTankById = async (req, res) => {
  try {
    const { id } = req.params;
    const tank = await store.getTankById(id);

    if (!tank) {
      return sendError(res, `Tank with ID ${id} not found`, 404);
    }

    const farmer = await store.getFarmerById(tank.farmerId);
    return sendSuccess(res, { ...tank, farmer }, 'Tank details retrieved');
  } catch (error) {
    console.error('[Error in getTankById]', error);
    return sendError(res, 'Failed to retrieve tank details from database', 500);
  }
};

export const validateGeoJSONPolygon = (boundary) => {
  if (!boundary) return { valid: true, sanitized: null };
  let poly = boundary;
  if (typeof poly === 'string') {
    try {
      poly = JSON.parse(poly);
    } catch {
      return { valid: false, error: 'boundaryCoordinates must be valid JSON' };
    }
  }

  if (typeof poly !== 'object' || poly === null) {
    return { valid: false, error: 'boundaryCoordinates must be an object' };
  }

  if (poly.type !== 'Polygon') {
    return { valid: false, error: 'boundaryCoordinates.type must be "Polygon"' };
  }

  if (!Array.isArray(poly.coordinates) || poly.coordinates.length === 0) {
    return { valid: false, error: 'Polygon must have a coordinates array with at least one ring' };
  }

  const ring = poly.coordinates[0];
  if (!Array.isArray(ring) || ring.length < 4) {
    return { valid: false, error: 'Polygon exterior ring must have at least 4 coordinates (closed ring of 3+ unique points)' };
  }

  for (let i = 0; i < ring.length; i++) {
    const pt = ring[i];
    if (!Array.isArray(pt) || pt.length < 2) {
      return { valid: false, error: `Invalid coordinate pair at index ${i}` };
    }
    const [lng, lat] = pt;
    if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
      return { valid: false, error: `Coordinates must be valid numbers at index ${i}` };
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { valid: false, error: `Coordinate out of bounds at index ${i}: [${lng}, ${lat}]` };
    }
  }

  // Ensure closed ring (first coordinate equals last coordinate)
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }

  return { valid: true, sanitized: poly };
};

export const createTank = async (req, res) => {
  try {
    const { 
      name, farmerId, size, abw, biomass, fcr, doc, acres, areaAcres,
      salinity, species, waterSource, cultureType, stockingDate, seedDate,
      boundaryCoordinates, boundaryMethod, boundaryAreaAcres, boundaryQuality, boundaryCapturedAt 
    } = req.body;

    if (!name || !farmerId) {
      return sendError(res, 'Tank name and farmerId are required', 400);
    }

    const farmer = await store.getFarmerById(farmerId);
    if (!farmer) {
      return sendError(res, `Farmer with ID ${farmerId} does not exist`, 400);
    }

    let sanitizedBoundary = boundaryCoordinates || null;
    if (boundaryCoordinates) {
      const validation = validateGeoJSONPolygon(boundaryCoordinates);
      if (!validation.valid) {
        return sendError(res, `Invalid boundary format: ${validation.error}`, 400);
      }
      sanitizedBoundary = validation.sanitized;
    }

    const resolvedStockingDate = stockingDate || seedDate || new Date().toISOString().split('T')[0];
    const resolvedSeedDate = seedDate || stockingDate || null;

    const newTank = await store.createTank({
      name,
      farmerId,
      agentId: farmer.agentId || null,
      inchargeId: farmer.inchargeId || null,
      assignedTo: farmer.assignedTo || null,
      size: size || null,
      abw: abw || null,
      biomass: biomass || null,
      fcr: fcr || null,
      doc: doc != null && doc !== '' ? Number(doc) : 0,
      lastTest: null,
      nextTest: null,
      acres: acres || null,
      areaAcres: areaAcres || null,
      salinity: salinity || null,
      species: species || null,
      waterSource: waterSource || null,
      cultureType: cultureType || null,
      stockingDate: resolvedStockingDate,
      seedDate: resolvedSeedDate,
      boundaryCoordinates: sanitizedBoundary,
      boundaryMethod: boundaryMethod || null,
      boundaryAreaAcres: boundaryAreaAcres != null ? boundaryAreaAcres : null,
      boundaryQuality: boundaryQuality || null,
      boundaryCapturedAt: boundaryCapturedAt || null,
    });

    return sendSuccess(res, newTank, 'Tank created successfully', 201);
  } catch (error) {
    console.error('[Error in createTank]', error);
    return sendError(res, error.message || 'Failed to create tank in database', error.statusCode || 500);
  }
};

export const updateTank = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.boundaryCoordinates) {
      const validation = validateGeoJSONPolygon(updates.boundaryCoordinates);
      if (!validation.valid) {
        return sendError(res, `Invalid boundary format: ${validation.error}`, 400);
      }
      updates.boundaryCoordinates = validation.sanitized;
    }

    const updated = await store.updateTank(id, updates);

    if (!updated) {
      return sendError(res, `Tank with ID ${id} not found`, 404);
    }

    return sendSuccess(res, updated, 'Tank updated successfully');
  } catch (error) {
    console.error('[Error in updateTank]', error);
    return sendError(res, 'Failed to update tank in database', 500);
  }
};

export const recordWaterParameters = async (req, res) => {
  try {
    const { id } = req.params;
    const { ph, salinity, do: dissolvedOxygen, alkalinity, ammonia, nitrate, abw, biomass, fcr } = req.body;

    const tank = await store.getTankById(id);
    if (!tank) {
      return sendError(res, `Tank with ID ${id} not found`, 404);
    }

    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7);
    const nextStr = nextDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const updates = {
      lastTest: todayStr,
      nextTest: nextStr,
      testStatus: 'Completed',
      ...(abw ? { abw } : {}),
      ...(biomass ? { biomass } : {}),
      ...(fcr ? { fcr } : {}),
    };

    const updatedTank = await store.updateTank(id, updates);

    const submission = await store.createSubmission({
      agentId: tank.agentId || req.user?.id || null,
      farmerId: tank.farmerId,
      tankId: tank.id,
      testType: 'Water & Biomass Analysis',
      data: {
        waterQuality: {
          ...(ph ? { ph } : {}),
          ...(salinity ? { salinity } : {}),
          ...(dissolvedOxygen ? { do: dissolvedOxygen } : {}),
          ...(alkalinity ? { alkalinity } : {}),
          ...(ammonia ? { ammonia } : {}),
          ...(nitrate ? { nitrate } : {}),
        },
        ...(abw ? { abw } : (tank.abw ? { abw: tank.abw } : {})),
        ...(biomass ? { biomass } : (tank.biomass ? { biomass: tank.biomass } : {})),
        ...(fcr ? { fcr } : (tank.fcr ? { fcr: tank.fcr } : {})),
      },
    });

    return sendSuccess(res, { tank: updatedTank, submission }, 'Water parameters and test submission recorded');
  } catch (error) {
    console.error('[Error in recordWaterParameters]', error);
    return sendError(res, 'Failed to record water parameters in database', 500);
  }
};

export const deleteTank = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await store.getTankById(id);
    if (!existing) {
      return sendError(res, `Tank with ID ${id} not found`, 404);
    }

    await store.deleteTank(id);
    return sendSuccess(res, { id }, 'Tank deleted successfully');
  } catch (error) {
    console.error('[Error in deleteTank]', error);
    return sendError(res, 'Failed to delete tank from database', 500);
  }
};

export const restockTank = async (req, res) => {
  try {
    const { id } = req.params;
    const { doc, stockingDate, abw, biomass, fcr } = req.body;
    const restockedTank = await store.restockTank(id, { doc, stockingDate, abw, biomass, fcr });
    return sendSuccess(res, restockedTank, 'Tank successfully restocked and new production cycle initiated', 200);
  } catch (error) {
    console.error('[Error in restockTank]', error);
    return sendError(res, error.message || 'Failed to restock tank', 400);
  }
};

