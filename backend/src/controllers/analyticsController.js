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

export const getAuditLogs = async (req, res) => {
  if (isDbConnected()) {
    try {
      const rows = await query(`
        SELECT 
          a.id, 
          DATE_FORMAT(a.created_at, '%d %b %Y, %I:%M %p') as time, 
          COALESCE(u.full_name, u.name, 'System') as user, 
          COALESCE(u.role, 'Admin') as role, 
          a.action, 
          a.table_name as module, 
          COALESCE(r.name, 'System Admin') as region, 
          CONCAT('Record ID: ', a.record_id) as detail
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN regions r ON (u.region_id = r.id OR u.region_id = r.code)
        ORDER BY a.created_at DESC
        LIMIT 100
      `);
      return sendSuccess(res, rows, 'Audit logs retrieved from database');
    } catch (err) {
      console.error('[DB Error in getAuditLogs]', err.message);
    }
  }
  return sendSuccess(res, [], 'Audit logs retrieved');
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
