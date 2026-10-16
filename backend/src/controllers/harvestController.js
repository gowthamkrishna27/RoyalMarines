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
      id,
      tankId, 
      farmerId, 
      harvestedBiomass,
      quantityKg, 
      date,
      harvestType,
      isFinal,
      doc,
      abw,
      harvestedNumber,
      totalHarvestedSeed,
      totalBiomass,
      totalBiomassKg,
      totalFeed,
      totalFeedKg,
      fcr,
      buyerName,
      remarks,
      feedConsumed,
      cultureCycleId
    } = req.body;

    const biomassVal = harvestedBiomass !== undefined ? harvestedBiomass : quantityKg;
    if (!tankId || biomassVal === undefined || biomassVal === null) {
      return sendError(res, 'tankId and harvestedBiomass are required', 400);
    }

    const b = Number(biomassVal);
    if (isNaN(b) || b <= 0) {
      return sendError(res, 'Harvested biomass must be a positive number greater than 0', 400);
    }

    const finalFlag = Boolean(isFinal || String(harvestType || '').toLowerCase().includes('final'));

    const harvest = await store.createHarvest({
      id: id || undefined,
      tankId,
      farmerId: farmerId || '',
      harvestedBiomass: b,
      date: date || new Date().toISOString().split('T')[0],
      harvestType: harvestType || (finalFlag ? 'Final Harvest' : 'Partial Harvest'),
      isFinal: finalFlag,
      doc: doc != null ? Number(doc) : null,
      abw: abw != null ? abw : null,
      harvestedNumber: harvestedNumber != null ? Number(harvestedNumber) : null,
      totalHarvestedSeed: totalHarvestedSeed != null ? Number(totalHarvestedSeed) : null,
      totalBiomassKg: totalBiomassKg != null ? Number(totalBiomassKg) : (totalBiomass != null ? Number(totalBiomass) : null),
      totalFeedKg: totalFeedKg != null ? Number(totalFeedKg) : (totalFeed != null ? Number(totalFeed) : null),
      fcr: fcr != null ? Number(fcr) : null,
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
