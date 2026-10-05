import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getTanks = async (req, res) => {
  const { farmerId, agentId, inchargeId, status, testStatus } = req.query;
  const tanks = await store.getTanks({ farmerId, agentId, inchargeId, status, testStatus });
  return sendSuccess(res, tanks, 'Tanks retrieved successfully', 200, {
    total: tanks.length,
  });
};

export const getTankById = async (req, res) => {
  const { id } = req.params;
  const tank = await store.getTankById(id);

  if (!tank) {
    return sendError(res, `Tank with ID ${id} not found`, 404);
  }

  const farmer = await store.getFarmerById(tank.farmerId);
  return sendSuccess(res, { ...tank, farmer }, 'Tank details retrieved');
};

export const createTank = async (req, res) => {
  const { name, farmerId, size, abw, biomass, fcr, doc } = req.body;

  if (!name || !farmerId) {
    return sendError(res, 'Tank name and farmerId are required', 400);
  }

  const farmer = await store.getFarmerById(farmerId);
  if (!farmer) {
    return sendError(res, `Farmer with ID ${farmerId} does not exist`, 400);
  }

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
  });

  return sendSuccess(res, newTank, 'Tank created successfully', 201);
};

export const updateTank = async (req, res) => {
  const { id } = req.params;
  const updated = await store.updateTank(id, req.body);

  if (!updated) {
    return sendError(res, `Tank with ID ${id} not found`, 404);
  }

  return sendSuccess(res, updated, 'Tank updated successfully');
};

export const recordWaterParameters = async (req, res) => {
  const { id } = req.params;
  const { ph, salinity, do: dissolvedOxygen, alkalinity, ammonia, abw, biomass, fcr } = req.body;

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
      },
      ...(abw ? { abw } : (tank.abw ? { abw: tank.abw } : {})),
      ...(biomass ? { biomass } : (tank.biomass ? { biomass: tank.biomass } : {})),
      ...(fcr ? { fcr } : (tank.fcr ? { fcr: tank.fcr } : {})),
    },
  });

  return sendSuccess(res, { tank: updatedTank, submission }, 'Water parameters and test submission recorded');
};

export const deleteTank = async (req, res) => {
  const { id } = req.params;
  const existing = await store.getTankById(id);
  if (!existing) {
    return sendError(res, `Tank with ID ${id} not found`, 404);
  }

  await store.deleteTank(id);
  return sendSuccess(res, { id }, 'Tank deleted successfully');
};
