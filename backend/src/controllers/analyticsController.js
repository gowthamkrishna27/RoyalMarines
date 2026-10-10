import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getSummary = async (req, res) => {
  try {
    const summary = await store.getAnalyticsSummary();
    return sendSuccess(res, summary, 'Executive dashboard metrics retrieved');
  } catch (error) {
    console.error('[Error in getSummary]', error);
    return sendError(res, 'Failed to retrieve analytics summary from database', 500);
  }
};

export const getRegions = async (req, res) => {
  try {
    const rows = await store.getRegions();
    return sendSuccess(res, rows, 'Regions list retrieved from database', 200, { total: rows.length });
  } catch (error) {
    console.error('[Error in getRegions]', error);
    return sendError(res, 'Failed to retrieve regions from database', 500);
  }
};

export const getAgents = async (req, res) => {
  try {
    const agents = await store.getAgents();
    return sendSuccess(res, agents, 'Agents with performance metrics retrieved from database', 200, { total: agents.length });
  } catch (error) {
    console.error('[Error in getAgents]', error);
    return sendError(res, 'Failed to retrieve agents from database', 500);
  }
};

export const getIncharges = async (req, res) => {
  try {
    const incharges = await store.getIncharges();
    return sendSuccess(res, incharges, 'Incharges list retrieved from database', 200, { total: incharges.length });
  } catch (error) {
    console.error('[Error in getIncharges]', error);
    return sendError(res, 'Failed to retrieve incharges from database', 500);
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await store.getActivityLogs();
    return sendSuccess(res, logs, 'Audit logs retrieved from database', 200, { total: logs.length });
  } catch (error) {
    console.error('[Error in getAuditLogs]', error);
    return sendError(res, 'Failed to retrieve audit logs from database', 500);
  }
};

export const getInchargeById = async (req, res) => {
  try {
    const { id } = req.params;
    const incharge = await store.getInchargeById(id);
    if (!incharge) {
      return sendError(res, `Incharge with ID ${id} not found in database`, 404);
    }
    return sendSuccess(res, incharge, 'Incharge details retrieved from database');
  } catch (error) {
    console.error('[Error in getInchargeById]', error);
    return sendError(res, error.message || 'Failed to retrieve incharge', 500);
  }
};

export const createIncharge = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return sendError(res, 'Incharge name is required', 400);
    }
    const created = await store.createIncharge(req.body);
    return sendSuccess(res, created, 'Incharge created successfully in database', 201);
  } catch (error) {
    console.error('[Error in createIncharge]', error);
    return sendError(res, error.message || 'Failed to create incharge in database', 500);
  }
};

export const updateIncharge = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await store.updateIncharge(id, req.body);
    return sendSuccess(res, updated, 'Incharge updated successfully in database', 200);
  } catch (error) {
    console.error('[Error in updateIncharge]', error);
    return sendError(res, error.message || 'Failed to update incharge in database', 500);
  }
};

export const deleteIncharge = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await store.deleteIncharge(id);
    return sendSuccess(res, result, 'Incharge deleted successfully from database', 200);
  } catch (error) {
    console.error('[Error in deleteIncharge]', error);
    return sendError(res, error.message || 'Failed to delete incharge from database', 500);
  }
};

export const assignAgentToIncharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;
    if (!agentId) {
      return sendError(res, 'agentId is required', 400);
    }
    const result = await store.assignAgentToIncharge(id, agentId);
    return sendSuccess(res, result, 'Agent assigned to incharge successfully in database', 200);
  } catch (error) {
    console.error('[Error in assignAgentToIncharge]', error);
    return sendError(res, error.message || 'Failed to assign agent in database', 500);
  }
};

export const unassignAgentFromIncharge = async (req, res) => {
  try {
    const { agentId } = req.body;
    if (!agentId) {
      return sendError(res, 'agentId is required', 400);
    }
    const result = await store.unassignAgentFromIncharge(agentId);
    return sendSuccess(res, result, 'Agent unassigned successfully in database', 200);
  } catch (error) {
    console.error('[Error in unassignAgentFromIncharge]', error);
    return sendError(res, error.message || 'Failed to unassign agent in database', 500);
  }
};

// --- Agent Management Handlers ---

export const getAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await store.getAgentById(id);
    if (!agent) {
      return sendError(res, `Agent with ID ${id} not found in database`, 404);
    }
    return sendSuccess(res, agent, 'Agent details retrieved from database');
  } catch (error) {
    console.error('[Error in getAgentById]', error);
    return sendError(res, error.message || 'Failed to retrieve agent', 500);
  }
};

export const createAgent = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return sendError(res, 'Agent name is required', 400);
    }
    const created = await store.createAgent(req.body);
    return sendSuccess(res, created, 'Field Agent created and assigned successfully in database', 201);
  } catch (error) {
    console.error('[Error in createAgent]', error);
    return sendError(res, error.message || 'Failed to create agent in database', 500);
  }
};

export const updateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await store.updateAgent(id, req.body);
    return sendSuccess(res, updated, 'Field Agent updated successfully in database', 200);
  } catch (error) {
    console.error('[Error in updateAgent]', error);
    return sendError(res, error.message || 'Failed to update agent in database', 500);
  }
};

export const reassignAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { inchargeId } = req.body;
    const updated = await store.reassignAgent(id, inchargeId);
    return sendSuccess(res, updated, 'Field Agent reassigned to incharge successfully in database', 200);
  } catch (error) {
    console.error('[Error in reassignAgent]', error);
    return sendError(res, error.message || 'Failed to reassign agent in database', 500);
  }
};

export const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await store.deleteAgent(id);
    return sendSuccess(res, result, 'Field Agent deleted successfully from database', 200);
  } catch (error) {
    console.error('[Error in deleteAgent]', error);
    return sendError(res, error.message || 'Failed to delete agent from database', 500);
  }
};

