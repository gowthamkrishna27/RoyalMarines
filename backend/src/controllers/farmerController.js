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
  const { id, name, phone, location, waterSource, acres, agentId, inchargeId, assignedTo } = req.body;

  if (!name) {
    return sendError(res, 'Farmer name is required', 400);
  }

  // Check if farmer already exists in store/database
  const existing = await store.getFarmers({ search: phone || name });
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const cleanName = (name || '').trim().toLowerCase();
  const duplicate = existing.find(f => {
    const fPhone = (f.phone || '').replace(/\D/g, '');
    if (cleanPhone && fPhone && cleanPhone === fPhone) return true;
    if ((f.name || '').trim().toLowerCase() === cleanName && 
        (!location || !f.location || f.location.toLowerCase() === location.toLowerCase())) {
      return true;
    }
    return false;
  });

  if (duplicate) {
    return sendSuccess(res, duplicate, 'Farmer already registered', 200);
  }

  const newFarmer = await store.createFarmer({
    id: id || undefined,
    name,
    phone: phone || '',
    location: location || '',
    waterSource: waterSource || null,
    acres: acres != null && acres !== '' ? Number(acres) : null,
    agentId: agentId || null,
    inchargeId: inchargeId || null,
    assignedTo: assignedTo || (agentId ? 'Agent' : inchargeId ? 'Incharge' : 'Unassigned'),
    assignedBy: req.user?.role || (assignedTo === 'Incharge' ? 'Incharge' : 'Admin'),
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
