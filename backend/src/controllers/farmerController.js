import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getFarmers = async (req, res) => {
  const { agentId, inchargeId, search } = req.query;
  const farmers = await store.getFarmers({ agentId, inchargeId, search });
  return sendSuccess(res, farmers, 'Farmers retrieved successfully', 200, {
    total: farmers.length,
  });
};

export const getFarmerById = async (req, res) => {
  const { id } = req.params;
  const farmer = await store.getFarmerById(id);

  if (!farmer) {
    return sendError(res, `Farmer with ID ${id} not found`, 404);
  }

  const tanks = await store.getTanks({ farmerId: id });
  return sendSuccess(res, { ...farmer, tanks }, 'Farmer details retrieved');
};

export const createFarmer = async (req, res) => {
  const { name, phone, location, waterSource, acres, agentId, inchargeId, assignedTo } = req.body;

  if (!name) {
    return sendError(res, 'Farmer name is required', 400);
  }

  const newFarmer = await store.createFarmer({
    name,
    phone: phone || '',
    location: location || '',
    waterSource: waterSource || 'Borewell',
    acres: acres ? Number(acres) : 10,
    agentId: agentId || null,
    inchargeId: inchargeId || 'INC001',
    assignedTo: assignedTo || (agentId ? 'Agent' : 'Incharge'),
    assignedBy: req.user?.role || 'Admin',
  });

  return sendSuccess(res, newFarmer, 'Farmer registered successfully', 201);
};

export const updateFarmer = async (req, res) => {
  const { id } = req.params;
  const updated = await store.updateFarmer(id, req.body);

  if (!updated) {
    return sendError(res, `Farmer with ID ${id} not found`, 404);
  }

  return sendSuccess(res, updated, 'Farmer updated successfully');
};

export const deleteFarmer = async (req, res) => {
  const { id } = req.params;
  const success = await store.deleteFarmer(id);

  if (!success) {
    return sendError(res, `Farmer with ID ${id} not found`, 404);
  }

  return sendSuccess(res, null, 'Farmer removed successfully');
};

export const reassignFarmer = async (req, res) => {
  const { id } = req.params;
  const { agentId, inchargeId, assignedTo } = req.body;

  const farmer = await store.getFarmerById(id);
  if (!farmer) {
    return sendError(res, `Farmer with ID ${id} not found`, 404);
  }

  const updatedFarmer = await store.updateFarmer(id, {
    agentId: agentId !== undefined ? agentId : farmer.agentId,
    inchargeId: inchargeId !== undefined ? inchargeId : farmer.inchargeId,
    assignedTo: assignedTo || (agentId ? 'Agent' : 'Incharge'),
    assignedBy: req.user?.role || 'Admin',
  });

  const tanks = await store.getTanks({ farmerId: id });
  for (const tank of tanks) {
    await store.updateTank(tank.id, {
      agentId: updatedFarmer.agentId,
      inchargeId: updatedFarmer.inchargeId,
      assignedTo: updatedFarmer.assignedTo,
    });
  }

  return sendSuccess(res, updatedFarmer, 'Farmer and tanks reassigned successfully');
};
