import { apiClient } from '../../utils/apiClient';

/**
 * Enterprise Admin Data Service
 * Connects all Admin Portal modules directly to live Express / MySQL API endpoints.
 */

const memoryCache = new Map();
const DEFAULT_TTL_MS = 15000; // 15 seconds

async function fetchWithCache(key, fetcher, ttl = DEFAULT_TTL_MS, force = false) {
  if (!force) {
    const cached = memoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
  }
  const data = await fetcher();
  memoryCache.set(key, { data, timestamp: Date.now() });
  return data;
}

export const adminService = {
  clearCache(key) {
    if (key) {
      memoryCache.delete(key);
    } else {
      memoryCache.clear();
    }
  },

  async getSummary(force = false) {
    return fetchWithCache('/analytics/summary', async () => {
      const res = await apiClient.get('/analytics/summary');
      return res?.data || {
        totalFarmers: 0,
        activeFarmers: 0,
        inactiveFarmers: 0,
        totalTanks: 0,
        activeTanks: 0,
        harvestedTanks: 0,
        totalIncharges: 0,
        totalAgents: 0,
        totalRegions: 0,
        totalSubmissions: 0,
        avgAbw: '0.0g',
        avgFcr: '0.00',
        totalBiomassKg: 0,
        harvestsCount: 0,
        harvestTotalKg: 0,
        pendingSubmissions: 0
      };
    }, DEFAULT_TTL_MS, force);
  },

  async getRegions(force = false) {
    return fetchWithCache('/analytics/regions', async () => {
      const res = await apiClient.get('/analytics/regions');
      const list = Array.isArray(res?.data) ? res.data : [];
      return list.map(r => ({
        ...r,
        id: String(r.code || r.id),
        code: r.code || r.id,
        name: r.name,
        localities: Array.isArray(r.localities) ? r.localities : [{ id: `LOC-${r.code || r.id}`, name: r.name }]
      }));
    }, DEFAULT_TTL_MS, force);
  },

  async getIncharges(force = false) {
    return fetchWithCache('/analytics/incharges', async () => {
      const res = await apiClient.get('/analytics/incharges');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async getInchargeById(id) {
    const res = await apiClient.get(`/analytics/incharges/${id}`);
    return res?.data || null;
  },

  async getAgents(force = false) {
    return fetchWithCache('/analytics/agents', async () => {
      const res = await apiClient.get('/analytics/agents');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async getAgentById(id) {
    const res = await apiClient.get(`/analytics/agents/${id}`);
    return res?.data || null;
  },

  async getFarmers(force = false) {
    return fetchWithCache('/farmers', async () => {
      const res = await apiClient.get('/farmers');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async getFarmerById(id) {
    const res = await apiClient.get(`/farmers/${id}`);
    return res?.data || null;
  },

  async getTanks(force = false) {
    return fetchWithCache('/tanks', async () => {
      const res = await apiClient.get('/tanks');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async getTankById(id) {
    const res = await apiClient.get(`/tanks/${id}`);
    return res?.data || null;
  },

  async getSubmissions(force = false) {
    return fetchWithCache('/submissions', async () => {
      const res = await apiClient.get('/submissions');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async getHarvests(force = false) {
    return fetchWithCache('/harvests', async () => {
      const res = await apiClient.get('/harvests');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async getDashboardData(tankIds = [], interval = 'Monthly') {
    const params = new URLSearchParams();
    if (interval) params.set('interval', interval);
    if (Array.isArray(tankIds) && tankIds.length > 0) {
      params.set('tankIds', tankIds.join(','));
    }
    const res = await apiClient.get(`/analytics/dashboard-data?${params.toString()}`);
    return res?.data || {
      waterQuality: [],
      trend: [],
      kpis: { abw: '0.0', fcr: '0.00', feed: 0, activeTanks: 0, totalBiomass: 0, totalHarvest: 0, compliance: '0%', pending: 0 }
    };
  },

  async getAuditLogs() {
    const res = await apiClient.get('/analytics/audit-logs');
    return Array.isArray(res?.data) ? res.data : [];
  },

  async getSubmissionLocations(filter = {}) {
    const params = new URLSearchParams(filter);
    const res = await apiClient.get(`/admin/submission-locations?${params.toString()}`);
    return Array.isArray(res?.data) ? res.data : [];
  },

  async getTodaySubmissions(force = false) {
    return fetchWithCache('/admin/submission-locations?date=today', async () => {
      const res = await apiClient.get('/admin/submission-locations?date=today');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async getFieldStaff() {
    const res = await apiClient.get('/admin/field-staff');
    return Array.isArray(res?.data) ? res.data : [];
  },

  invalidateFarmerCache() {
    this.clearCache('/farmers');
    this.clearCache('/analytics/summary');
    try { sessionStorage.removeItem('royal_admin_dashboard_cache_v1'); } catch {}
  },

  invalidateTankCache() {
    this.clearCache('/tanks');
    this.clearCache('/farmers');
    this.clearCache('/analytics/summary');
    try { sessionStorage.removeItem('royal_admin_dashboard_cache_v1'); } catch {}
  },

  invalidateSubmissionCache() {
    this.clearCache('/submissions');
    this.clearCache('/tanks');
    this.clearCache('/admin/submission-locations?date=today');
    this.clearCache('/analytics/summary');
    try { sessionStorage.removeItem('royal_admin_dashboard_cache_v1'); } catch {}
  },

  invalidateHarvestCache() {
    this.clearCache('/harvests');
    this.clearCache('/tanks');
    this.clearCache('/farmers');
    this.clearCache('/analytics/summary');
    try { sessionStorage.removeItem('royal_admin_dashboard_cache_v1'); } catch {}
  },

  async createSubmission(payload) {
    this.invalidateSubmissionCache();
    const res = await apiClient.post('/submissions', payload);
    return res?.data || null;
  },

  async createHarvest(payload) {
    this.invalidateHarvestCache();
    const res = await apiClient.post('/harvests', payload);
    return res?.data || null;
  },

  async createTank(payload) {
    this.invalidateTankCache();
    const res = await apiClient.post('/tanks', payload);
    return res?.data || null;
  },

  async updateTank(id, updates) {
    this.invalidateTankCache();
    const res = await apiClient.put(`/tanks/${id}`, updates);
    return res?.data || null;
  },

  async createFarmer(payload) {
    this.invalidateFarmerCache();
    const res = await apiClient.post('/farmers', payload);
    return res?.data || null;
  },

  async updateFarmer(id, updates) {
    this.invalidateFarmerCache();
    const res = await apiClient.put(`/farmers/${id}`, updates);
    return res?.data || null;
  },

  async deleteFarmer(id) {
    this.invalidateFarmerCache();
    this.clearCache('/tanks');
    const res = await apiClient.delete(`/farmers/${id}`);
    return res?.data || null;
  },

  async verifySubmission(id, status, notes = '') {
    this.invalidateSubmissionCache();
    const res = await apiClient.patch(`/submissions/${id}/verify`, { status, notes });
    return res?.data || null;
  }
};

export default adminService;
