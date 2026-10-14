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
    const { 
      tankId, 
      farmerId, 
      quantityKg, 
      countPerKg, 
      quality, 
      pricePerKg,
      date,
      harvestType,
      isFinal,
      doc,
      abw,
      buyerName,
      remarks,
      feedConsumed,
      cultureCycleId
    } = req.body;

    if (!tankId || quantityKg === undefined || quantityKg === null) {
      return sendError(res, 'tankId and quantityKg are required', 400);
    }

    const q = Number(quantityKg);
    if (isNaN(q) || q <= 0) {
      return sendError(res, 'Harvest quantity must be a positive number greater than 0', 400);
    }

    const price = pricePerKg != null ? Number(pricePerKg) : 380;
    const revenue = q * price;
    const finalFlag = Boolean(isFinal || String(harvestType || '').toLowerCase().includes('final'));

    const harvest = await store.createHarvest({
      tankId,
      farmerId: farmerId || '',
      quantityKg: q,
      countPerKg: countPerKg ? Number(countPerKg) : null,
      quality: quality || 'A Grade',
      pricePerKg: price,
      revenue,
      date: date || new Date().toISOString().split('T')[0],
      harvestType: harvestType || (finalFlag ? 'Final Harvest' : 'Partial Harvest'),
      isFinal: finalFlag,
      doc: doc != null ? Number(doc) : null,
      abw: abw != null ? abw : null,
      buyerName: buyerName || 'Royals Marine Processing Unit 1',
      remarks: remarks || '',
      feedConsumed: feedConsumed != null ? Number(feedConsumed) : null,
      cultureCycleId: cultureCycleId || null,
    });

    const msg = finalFlag 
      ? 'Final harvest logged successfully. Tank cycle has been completed.' 
      : 'Partial harvest recorded successfully. Tank remains active.';

    return sendSuccess(res, harvest, msg, 201);
  } catch (error) {
    console.error('[Error in createHarvest]', error);
    return sendError(res, error.message || 'Failed to create harvest in database', 400);
  }
};
