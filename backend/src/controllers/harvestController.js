import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getHarvests = async (req, res) => {
  const { farmerId } = req.query;
  const harvests = await store.getHarvests({ farmerId });
  return sendSuccess(res, harvests, 'Harvests retrieved successfully', 200, {
    total: harvests.length,
  });
};

export const createHarvest = async (req, res) => {
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
};
