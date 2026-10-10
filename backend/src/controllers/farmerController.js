import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getFarmers = async (req, res) => {
  try {
    const { agentId, inchargeId, regionId, region, search, limit } = req.query;
    const farmers = await store.getFarmers({
      agentId,
      inchargeId,
      regionId: regionId || region,
      search,
      limit,
    });
    return sendSuccess(res, farmers, 'Farmers retrieved successfully', 200, {
      total: farmers.length,
    });
  } catch (error) {
    console.error('[Error in getFarmers]', error);
    return sendError(res, 'Failed to retrieve farmers from database', 500);
  }
};

export const getFarmerById = async (req, res) => {
  try {
    const { id } = req.params;
    const farmer = await store.getFarmerById(id);

    if (!farmer) {
      return sendError(res, `Farmer with ID ${id} not found`, 404);
    }

    const tanks = await store.getTanks({ farmerId: id });
    return sendSuccess(res, { ...farmer, tanks }, 'Farmer details retrieved');
  } catch (error) {
    console.error('[Error in getFarmerById]', error);
    return sendError(res, 'Failed to retrieve farmer details from database', 500);
  }
};

export const createFarmer = async (req, res) => {
  try {
    const { name, phone, location, waterSource, acres, agentId, inchargeId, assignedTo } = req.body;

    if (!name) {
      return sendError(res, 'Farmer name is required', 400);
    }

    const newFarmer = await store.createFarmer({
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
  } catch (error) {
    console.error('[Error in createFarmer]', error);
    return sendError(res, 'Failed to register farmer in database', 500);
  }
};

export const updateFarmer = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await store.updateFarmer(id, req.body);

    if (!updated) {
      return sendError(res, `Farmer with ID ${id} not found`, 404);
    }

    return sendSuccess(res, updated, 'Farmer updated successfully');
  } catch (error) {
    console.error('[Error in updateFarmer]', error);
    return sendError(res, 'Failed to update farmer in database', 500);
  }
};

export const deleteFarmer = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await store.deleteFarmer(id);

    if (!success) {
      return sendError(res, `Farmer with ID ${id} not found`, 404);
    }

    return sendSuccess(res, null, 'Farmer removed successfully');
  } catch (error) {
    console.error('[Error in deleteFarmer]', error);
    return sendError(res, 'Failed to delete farmer from database', 500);
  }
};

export const reassignFarmer = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('[Error in reassignFarmer]', error);
    return sendError(res, 'Failed to reassign farmer in database', 500);
  }
};
