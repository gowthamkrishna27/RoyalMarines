import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getHarvests = async (req, res) => {
  try {
    const { farmerId, tankId } = req.query;
    const harvests = await store.getHarvests({ farmerId, tankId });
    return sendSuccess(res, harvests, 'Harvests retrieved successfully', 200, {
      total: harvests.length,
    });
  } catch (error) {
    console.error('[Error in getHarvests]', error);
    return sendError(res, 'Failed to retrieve harvests from database', 500);
  }
};

export const createHarvest = async (req, res) => {
  try {
    const { tankId, farmerId, quantityKg, countPerKg, quality, pricePerKg } = req.body;

    if (!tankId || !quantityKg) {
      return sendError(res, 'tankId and quantityKg are required', 400);
    }

    const q = Number(quantityKg);
    const price = pricePerKg != null ? Number(pricePerKg) : 0;
    const revenue = q * price;

    const harvest = await store.createHarvest({
      tankId,
      farmerId: farmerId || '',
      quantityKg: q,
      countPerKg: countPerKg ? Number(countPerKg) : null,
      quality: quality || null,
      pricePerKg: price,
      revenue,
    });

    return sendSuccess(res, harvest, 'Harvest logged and tank cycle closed', 201);
  } catch (error) {
    console.error('[Error in createHarvest]', error);
    return sendError(res, error.message || 'Failed to create harvest in database', 500);
  }
};
