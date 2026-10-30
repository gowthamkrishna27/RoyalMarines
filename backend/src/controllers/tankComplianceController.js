import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Weekly Tank Testing Compliance Controller
 * Implements rolling 7-day test monitoring, due tracking, and follow-up messaging.
 */

export const getComplianceDueList = async (req, res) => {
  try {
    const { agentId, inchargeId, tankId } = req.query;
    const user = req.user || null;

    const result = await store.getTankComplianceList({
      user,
      agentId,
      inchargeId,
      tankId
    });

    return sendSuccess(res, result, 'Tank compliance data retrieved successfully', 200, {
      total: result.counts.totalActiveTanks,
      due: result.counts.dueCount,
      addressed: result.counts.addressedCount,
      compliant: result.counts.compliantCount
    });
  } catch (error) {
    console.error('[Error in getComplianceDueList]', error);
    return sendError(res, error.message || 'Failed to retrieve compliance due list', 500);
  }
};

export const createComplianceFollowup = async (req, res) => {
  try {
    const { 
      tankId, 
      message, 
      cycleKey, 
      recipientId, 
      recipientName,
      senderId,
      senderName,
      senderRole
    } = req.body;

    if (!tankId) {
      return sendError(res, 'tankId is required', 400);
    }

    const trimmedMsg = (message || '').trim();
    if (!trimmedMsg) {
      return sendError(res, 'A non-empty message is required to submit a follow-up', 400);
    }

    // Authenticated user check (or explicit sender supplied from verified session)
    const user = req.user;
    if (!user && !senderId) {
      return sendError(res, 'Authentication required to submit follow-up', 401);
    }

    const saved = await store.createTankFollowup({
      tankId,
      message: trimmedMsg,
      cycleKey,
      recipientId,
      recipientName,
      senderId,
      senderName,
      senderRole
    }, user);

    return sendSuccess(res, saved, 'Follow-up message recorded successfully and cycle moved to Addressed', 201);
  } catch (error) {
    console.error('[Error in createComplianceFollowup]', error);
    const status = error.message?.includes('Forbidden') ? 403 : error.message?.includes('not found') ? 404 : 400;
    return sendError(res, error.message || 'Failed to record follow-up message', status);
  }
};

export const getComplianceFollowupHistory = async (req, res) => {
  try {
    const { tankId } = req.params;
    const { cycleKey } = req.query;

    if (!tankId) {
      return sendError(res, 'tankId parameter is required', 400);
    }

    const history = await store.getTankFollowupHistory(tankId, cycleKey || null, req.user);
    return sendSuccess(res, history, 'Follow-up history retrieved successfully', 200, {
      total: history.length
    });
  } catch (error) {
    console.error('[Error in getComplianceFollowupHistory]', error);
    const status = error.message?.includes('Forbidden') ? 403 : 500;
    return sendError(res, error.message || 'Failed to retrieve follow-up history', status);
  }
};
