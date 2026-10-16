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

export const createRegion = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return sendError(res, 'Region name is required', 400);
    }
    const created = await store.createRegion(req.body);
    return sendSuccess(res, created, 'Region created successfully in database', 201);
  } catch (error) {
    console.error('[Error in createRegion]', error);
    const status = error.statusCode || (error.message.includes('already exists') ? 409 : 500);
    return sendError(res, error.message || 'Failed to create region in database', status);
  }
};

export const createLocality = async (req, res) => {
  try {
    const { name, regionId } = req.body;
    if (!name || !name.trim()) {
      return sendError(res, 'Locality name is required', 400);
    }
    if (!regionId || !regionId.trim()) {
      return sendError(res, 'Region is required', 400);
    }
    const created = await store.createLocality(req.body);
    return sendSuccess(res, created, 'Locality created successfully in database', 201);
  } catch (error) {
    console.error('[Error in createLocality]', error);
    const status = error.statusCode || (error.message.includes('already exists') ? 409 : 500);
    return sendError(res, error.message || 'Failed to create locality in database', status);
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
      return sendSuccess(res, {
        waterQuality: [],
        trend: [],
        kpis: { abw: '0.0', fcr: '0.00', feed: 0, activeTanks: 0, totalBiomass: 0, totalHarvest: 0, compliance: '0%', pending: 0 }
      }, 'Empty filters');
    }

    const inClause = tankIds.map(t => "'" + t.replace(/'/g, "''") + "'").join(',');

    // 1. Fetch real submissions for Water Quality (DO & pH) from submissions.data JSON
    const wqQuery = `
      SELECT 
        s.id,
        s.tank_id,
        s.date,
        s.created_at,
        s.data
      FROM submissions s
      WHERE s.tank_id IN (${inClause})
      ORDER BY s.created_at ASC, s.id ASC
    `;
    const subRows = await query(wqQuery);

    const wqFormatted = [];
    subRows.forEach(sub => {
      const raw = typeof sub.data === 'string' ? JSON.parse(sub.data || '{}') : (sub.data || {});
      const phVal = parseFloat(raw.ph ?? raw.pH ?? raw.waterQuality?.ph ?? raw.waterQuality?.pH);
      const doVal = parseFloat(raw.do ?? raw.DO ?? raw.dissolvedOxygen ?? raw.waterQuality?.do ?? raw.waterQuality?.dissolvedOxygen);
      if (!isNaN(phVal) || !isNaN(doVal)) {
        wqFormatted.push({
          day: sub.date || (sub.created_at ? new Date(sub.created_at).toISOString().split('T')[0] : 'Recorded'),
          do: !isNaN(doVal) ? Number(doVal.toFixed(2)) : null,
          ph: !isNaN(phVal) ? Number(phVal.toFixed(2)) : null,
        });
      }
    });

    // 2. Fetch real harvests for the tanks
    const harvestQuery = `
      SELECT 
        DATE_FORMAT(COALESCE(harvest_date, date, created_at), '%Y-%m-%d') as period,
        COALESCE(SUM(COALESCE(harvested_biomass, total_biomass_kg, 0)), 0) as harvested_biomass
      FROM harvests
      WHERE tank_id IN (${inClause})
      GROUP BY period
      ORDER BY MIN(COALESCE(harvest_date, created_at)) ASC
    `;
    const harvestRows = await query(harvestQuery);

    const trendData = harvestRows.map((h, idx) => ({
      week: interval === 'Weekly' ? `Week ${idx + 1}` : h.period,
      biomass: Number(h.harvested_biomass || 0),
      feed: 0
    }));

    // 3. Calculate genuine KPIs from real tanks, harvests, submissions
    const kpiTankQuery = `
      SELECT 
        COUNT(DISTINCT CASE WHEN UPPER(status) = 'ACTIVE' THEN id END) as activeTanks,
        COUNT(DISTINCT id) as totalTanks,
        COALESCE(SUM(CAST(REGEXP_REPLACE(biomass, '[^0-9.]', '') AS DECIMAL(12,2))), 0) as totalBiomass,
        COALESCE(AVG(CASE WHEN CAST(REGEXP_REPLACE(abw, '[^0-9.]', '') AS DECIMAL(8,2)) > 0 THEN CAST(REGEXP_REPLACE(abw, '[^0-9.]', '') AS DECIMAL(8,2)) END), 0) as avgAbw,
        COALESCE(AVG(CASE WHEN CAST(REGEXP_REPLACE(fcr, '[^0-9.]', '') AS DECIMAL(6,2)) > 0 THEN CAST(REGEXP_REPLACE(fcr, '[^0-9.]', '') AS DECIMAL(6,2)) END), 0) as avgFcr
      FROM tanks
      WHERE id IN (${inClause})
    `;
    const [tankKpi] = await query(kpiTankQuery);

    const [harvestKpi] = await query(`
      SELECT COALESCE(SUM(COALESCE(harvested_biomass, total_biomass_kg, 0)), 0) as totalHarvest 
      FROM harvests 
      WHERE tank_id IN (${inClause})
    `);

    const [subKpi] = await query(`
      SELECT COUNT(id) as pending 
      FROM submissions 
      WHERE UPPER(status) IN ('PENDING', 'PENDING_VERIFICATION') AND tank_id IN (${inClause})
    `);

    const [testRows] = await query(`
      SELECT COUNT(*) as completedCount 
      FROM tanks 
      WHERE LOWER(test_status) = 'completed' AND id IN (${inClause})
    `);

    const compliance = tankIds.length > 0 ? Math.round(((testRows?.completedCount || 0) / tankIds.length) * 100) : 0;
    const totalBiomass = Number(tankKpi?.totalBiomass) || 0;
    const avgAbw = Number(tankKpi?.avgAbw) || 0;
    const avgFcr = Number(tankKpi?.avgFcr) || 0;
    const calculatedFeed = totalBiomass > 0 && avgFcr > 0 ? Math.round(totalBiomass * avgFcr) : 0;
    const fcrDisplay = avgFcr > 0 ? avgFcr.toFixed(2) : '0.00';

    const kpis = {
      abw: avgAbw > 0 ? avgAbw.toFixed(1) : '0.0',
      fcr: fcrDisplay,
      feed: calculatedFeed,
      activeTanks: Number(tankKpi?.activeTanks || 0),
      totalBiomass: totalBiomass,
      totalHarvest: Number(harvestKpi?.totalHarvest || 0),
      compliance: `${compliance}%`,
      pending: Number(subKpi?.pending || 0)
    };

    return sendSuccess(res, { waterQuality: wqFormatted, trend: trendData, kpis }, 'Dashboard data generated');
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


