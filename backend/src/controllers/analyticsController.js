import { store } from '../data/store.js';
import { query, isDbConnected } from '../config/database.js';
import { sendSuccess } from '../utils/response.js';

export const getSummary = async (req, res) => {
  const summary = await store.getAnalyticsSummary();
  return sendSuccess(res, summary, 'Executive dashboard metrics retrieved');
};

export const getRegions = async (req, res) => {
  if (isDbConnected()) {
    try {
      const rows = await query('SELECT * FROM regions');
      return sendSuccess(res, rows, 'Regions list retrieved from database');
    } catch {}
  }
  return sendSuccess(res, store.regions, 'Regions list retrieved');
};

export const getAgents = async (req, res) => {
  if (isDbConnected()) {
    try {
      const agents = await query('SELECT * FROM agents');
      const farmers = await query('SELECT agent_id FROM farmers WHERE agent_id IS NOT NULL');
      const tanks = await query('SELECT agent_id, test_status FROM tanks WHERE agent_id IS NOT NULL');

      const enriched = agents.map((agent) => {
        const assignedFarmers = farmers.filter((f) => f.agent_id === agent.id);
        const assignedTanks = tanks.filter((t) => t.agent_id === agent.id);
        const completedTests = assignedTanks.filter((t) => t.test_status === 'Completed').length;

        return {
          ...agent,
          inchargeId: agent.incharge_id,
          activePonds: agent.active_ponds || assignedTanks.length,
          farmersCount: assignedFarmers.length,
          tanksCount: assignedTanks.length,
          complianceRate: assignedTanks.length > 0 ? Math.round((completedTests / assignedTanks.length) * 100) : 0,
        };
      });

      return sendSuccess(res, enriched, 'Agents with performance metrics retrieved from database');
    } catch {}
  }

  const agents = store.agents.map((agent) => {
    const assignedFarmers = store.farmers.filter((f) => f.agentId === agent.id);
    const assignedTanks = store.tanks.filter((t) => t.agentId === agent.id);
    const completedTests = assignedTanks.filter((t) => t.testStatus === 'Completed').length;

    return {
      ...agent,
      inchargeId: agent.inchargeId || agent.incharge_id,
      farmersCount: assignedFarmers.length,
      tanksCount: assignedTanks.length,
      complianceRate: assignedTanks.length > 0 ? Math.round((completedTests / assignedTanks.length) * 100) : 0,
    };
  });

  return sendSuccess(res, agents, 'Agents with performance metrics retrieved');
};

export const getIncharges = async (req, res) => {
  if (isDbConnected()) {
    try {
      const rows = await query(`
        SELECT 
          i.id,
          MAX(COALESCE(i.name, u.name, u.full_name, 'Incharge')) as name,
          MAX(COALESCE(i.email, u.email, '')) as email,
          MAX(COALESCE(i.phone, u.phone, '')) as phone,
          MAX(COALESCE(i.region_id, r.code, r.id, 'REG001')) as region_id,
          MAX(COALESCE(r.name, 'Bhimavaram')) as region,
          MAX(COALESCE(u.locality, 'Bhimavaram')) as locality
        FROM incharges i 
        LEFT JOIN users u ON i.user_id = u.id 
        LEFT JOIN regions r ON (i.region_id = r.id OR i.region_id = r.code)
        GROUP BY i.id
      `);
      const enriched = rows.map((r) => ({
        ...r,
        regionId: r.region_id,
      }));
      return sendSuccess(res, enriched, 'Incharges list retrieved from database');
    } catch (err) {
      console.error('[DB Error in getIncharges]', err.message);
    }
  }
  return sendSuccess(res, store.incharges, 'Incharges list retrieved');
};
