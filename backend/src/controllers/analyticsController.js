import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { query, isDbConnected } from '../config/database.js';

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


export const getDashboardData = async (req, res) => {
  if (!isDbConnected()) return sendSuccess(res, { error: 'No DB connection' }, 'Fallback');
  try {
    let tankIds = req.query.tankIds;
    let interval = req.query.interval || 'Monthly';
    
    if (typeof tankIds === 'string') {
        tankIds = tankIds.split(',').filter(Boolean);
    }
    
    if (!tankIds || !Array.isArray(tankIds) || tankIds.length === 0) {
      return sendSuccess(res, { waterQuality: [], trend: [], kpis: { abw: 0, fcr: '0.00', feed: 0, activeTanks: 0, totalBiomass: 0, totalHarvest: 0, compliance: '0%', pending: 0 } }, 'Empty filters');
    }
    
    const inClause = tankIds.map(t => "'" + t.replace(/'/g, "''") + "'").join(',');
    
    let dateFormat = '%Y-%m-%d';
    if (interval === 'Weekly') dateFormat = '%Y-%u';
    if (interval === 'Monthly') dateFormat = '%Y-%m';
    if (interval === 'Daily') dateFormat = '%Y-%m-%d';
    
    const wqQuery = `
      SELECT 
        DATE_FORMAT(wq.created_at, ?) as period,
        ROUND(AVG(wq.dissolved_oxygen_mg_l), 2) as do,
        ROUND(AVG(wq.ph), 2) as ph
      FROM water_quality_records wq
      JOIN field_visits fv ON wq.visit_id = fv.id
      JOIN culture_cycles cc ON fv.culture_cycle_id = cc.id
      JOIN ponds p ON cc.pond_id = p.id
      WHERE p.tank_id IN (${inClause})
      GROUP BY period
      ORDER BY MIN(wq.created_at) ASC
    `;
    
    const feedQuery = `
      SELECT 
        DATE_FORMAT(fr.created_at, ?) as period,
        SUM(fr.quantity_kg) as feed
      FROM feed_records fr
      JOIN culture_cycles cc ON fr.culture_cycle_id = cc.id
      JOIN ponds p ON cc.pond_id = p.id
      WHERE p.tank_id IN (${inClause})
      GROUP BY period
      ORDER BY MIN(fr.created_at) ASC
    `;

    const biomassQuery = `
      SELECT 
        DATE_FORMAT(br.created_at, ?) as period,
        SUM(br.estimated_biomass_kg) as biomass
      FROM biomass_records br
      JOIN field_visits fv ON br.visit_id = fv.id
      JOIN culture_cycles cc ON fv.culture_cycle_id = cc.id
      JOIN ponds p ON cc.pond_id = p.id
      WHERE p.tank_id IN (${inClause})
      GROUP BY period
      ORDER BY MIN(br.created_at) ASC
    `;

    const [wqData, feedData, biomassData] = await Promise.all([
      query(wqQuery, [dateFormat]),
      query(feedQuery, [dateFormat]),
      query(biomassQuery, [dateFormat])
    ]);
    
    const wqFormatted = wqData.map(d => ({
        day: d.period,
        do: Number(d.do) || null,
        ph: Number(d.ph) || null
    })).filter(d => d.do !== null && d.ph !== null);

    const trendMap = {};
    feedData.forEach(d => { trendMap[d.period] = { period: d.period, feed: Number(d.feed) || 0, biomass: 0 }; });
    biomassData.forEach(d => {
       if (!trendMap[d.period]) trendMap[d.period] = { period: d.period, feed: 0, biomass: 0 };
       trendMap[d.period].biomass = Number(d.biomass) || 0;
    });
    
    const finalTrendData = Object.values(trendMap).sort((a, b) => a.period.localeCompare(b.period)).map((d, index) => ({
       week: interval === 'Weekly' ? 'Week ' + (index + 1) : d.period,
       biomass: d.biomass,
       feed: d.feed
    }));

    const kpisQuery = `
      SELECT 
        (SELECT SUM(quantity_kg) FROM feed_records fr JOIN culture_cycles cc ON fr.culture_cycle_id = cc.id JOIN ponds p ON cc.pond_id = p.id WHERE p.tank_id IN (${inClause})) as totalFeed,
        (SELECT SUM(estimated_biomass_kg) FROM biomass_records br JOIN field_visits fv ON br.visit_id = fv.id JOIN culture_cycles cc ON fv.culture_cycle_id = cc.id JOIN ponds p ON cc.pond_id = p.id WHERE p.tank_id IN (${inClause})) as totalBiomass,
        (SELECT AVG(average_weight_g) FROM biomass_records br JOIN field_visits fv ON br.visit_id = fv.id JOIN culture_cycles cc ON fv.culture_cycle_id = cc.id JOIN ponds p ON cc.pond_id = p.id WHERE p.tank_id IN (${inClause})) as avgAbw,
        (SELECT COUNT(*) FROM tanks WHERE status = 'ACTIVE' AND id IN (${inClause})) as activeTanks,
        (SELECT SUM(quantity_kg) FROM harvests h WHERE h.tank_id IN (${inClause})) as totalHarvest,
        (SELECT COUNT(*) FROM submissions WHERE status = 'PENDING_VERIFICATION' AND tank_id IN (${inClause})) as pending
    `;
    const [kpiRows] = await query(kpisQuery);
    
    const testQuery = `SELECT COUNT(*) as c FROM tanks WHERE test_status = 'Completed' AND id IN (${inClause})`;
    const [testRows] = await query(testQuery);
    
    const compliance = tankIds.length > 0 ? Math.round((testRows.c / tankIds.length) * 100) : 0;
    
    const totalFeed = Number(kpiRows.totalFeed) || 0;
    const totalBiomass = Number(kpiRows.totalBiomass) || 0;
    const avgAbw = Number(kpiRows.avgAbw) || 0;
    const fcr = totalBiomass > 0 ? (totalFeed / totalBiomass).toFixed(2) : '0.00';

    const kpis = {
      abw: avgAbw.toFixed(1),
      fcr,
      feed: totalFeed,
      activeTanks: kpiRows.activeTanks || 0,
      totalBiomass: totalBiomass,
      totalHarvest: Number(kpiRows.totalHarvest || 0),
      compliance: compliance + '%',
      pending: kpiRows.pending || 0
    };

    return sendSuccess(res, { waterQuality: wqFormatted, trend: finalTrendData, kpis }, 'Dashboard data generated');
  } catch (err) {
    console.error('[DB Error in getDashboardData]', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
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


