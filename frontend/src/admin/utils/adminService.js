import { apiClient } from '../../utils/apiClient';

/**
 * Enterprise Admin Data Service
 * Connects all Admin Portal modules directly to live Express / MySQL API endpoints.
 * Features in-memory caching and request deduplication for near-instant (0ms) tab switching.
 */

const memoryCache = new Map();
const inFlight = new Map();
const DEFAULT_TTL_MS = 20000; // 20 seconds

async function fetchWithCache(key, fetcher, ttl = DEFAULT_TTL_MS, force = false) {
  const now = Date.now();
  if (!force) {
    const cached = memoryCache.get(key);
    if (cached && now - cached.timestamp < ttl) {
      return cached.data;
    }
  }

  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  const promise = (async () => {
    try {
      const data = await fetcher();
      memoryCache.set(key, { data, timestamp: Date.now() });
      return data;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

export function invalidateCache(pattern = null) {
  if (!pattern) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (typeof pattern === 'string' && key.includes(pattern)) {
      memoryCache.delete(key);
    } else if (pattern instanceof RegExp && pattern.test(key)) {
      memoryCache.delete(key);
    }
  }
}

export const adminService = {
  invalidateCache,
  clearCache(key) {
    if (key) {
      invalidateCache(key);
    } else {
      memoryCache.clear();
    }
  },

  async getSummary(force = false) {
    return fetchWithCache('summary', async () => {
      const res = await apiClient.get('/analytics/summary');
      return res?.data || {
        totalFarmers: 0,
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
    return fetchWithCache('regions', async () => {
      const res = await apiClient.get('/analytics/regions');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async getIncharges(force = false) {
    return fetchWithCache('incharges', async () => {
      const res = await apiClient.get('/analytics/incharges');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async getInchargeById(id, force = false) {
    return fetchWithCache(`incharge:${id}`, async () => {
      const res = await apiClient.get(`/analytics/incharges/${id}`);
      return res?.data || null;
    }, DEFAULT_TTL_MS, force);
  },

  async getAgents(force = false) {
    return fetchWithCache('agents', async () => {
      const res = await apiClient.get('/analytics/agents');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async getAgentById(id, force = false) {
    return fetchWithCache(`agent:${id}`, async () => {
      const res = await apiClient.get(`/analytics/agents/${id}`);
      return res?.data || null;
    }, DEFAULT_TTL_MS, force);
  },

  async getFarmers(force = false) {
    return fetchWithCache('farmers', async () => {
      const res = await apiClient.get('/farmers');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async getFarmerById(id, force = false) {
    return fetchWithCache(`farmer:${id}`, async () => {
      const res = await apiClient.get(`/farmers/${id}`);
      return res?.data || null;
    }, DEFAULT_TTL_MS, force);
  },

  async getTanks(force = false) {
    return fetchWithCache('tanks', async () => {
      const res = await apiClient.get('/tanks');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async getTankById(id, force = false) {
    return fetchWithCache(`tank:${id}`, async () => {
      const res = await apiClient.get(`/tanks/${id}`);
      return res?.data || null;
    }, DEFAULT_TTL_MS, force);
  },

  async getSubmissions(force = false) {
    return fetchWithCache('submissions', async () => {
      const res = await apiClient.get('/submissions');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async getTodaySubmissions(force = false) {
    return fetchWithCache('todaySubmissions', async () => {
      const res = await apiClient.get('/admin/submission-locations?date=today');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async getHarvests(force = false) {
    return fetchWithCache('harvests', async () => {
      const res = await apiClient.get('/harvests');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async getDashboardData(tankIds = [], interval = 'Monthly', force = false) {
    const params = new URLSearchParams();
    if (interval) params.set('interval', interval);
    if (Array.isArray(tankIds) && tankIds.length > 0) {
      params.set('tankIds', tankIds.join(','));
    }
    const key = `dashboardData:${params.toString()}`;
    return fetchWithCache(key, async () => {
      const res = await apiClient.get(`/analytics/dashboard-data?${params.toString()}`);
      return res?.data || {
        waterQuality: [],
        trend: [],
        kpis: { abw: '0.0', fcr: '0.00', feed: 0, activeTanks: 0, totalBiomass: 0, totalHarvest: 0, compliance: '0%', pending: 0 }
      };
    }, DEFAULT_TTL_MS, force);
  },

  async getAuditLogs(force = false) {
    return fetchWithCache('auditLogs', async () => {
      const res = await apiClient.get('/analytics/audit-logs');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async getSubmissionLocations(filter = {}, force = false) {
    const params = new URLSearchParams(filter);
    const key = `locations:${params.toString()}`;
    return fetchWithCache(key, async () => {
      const res = await apiClient.get(`/admin/submission-locations?${params.toString()}`);
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async getFieldStaff(force = false) {
    return fetchWithCache('fieldStaff', async () => {
      const res = await apiClient.get('/admin/field-staff');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL_MS, force);
  },

  async createSubmission(payload) {
    const res = await apiClient.post('/submissions', payload);
    invalidateCache('submission');
    invalidateCache('tank');
    invalidateCache('summary');
    invalidateCache('location');
    invalidateCache('harvest');
    invalidateCache('audit');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('submissionCreated', { detail: res?.data }));
      window.dispatchEvent(new CustomEvent('adminDataChanged'));
    }
    return res?.data || null;
  },

  async createHarvest(payload) {
    const res = await apiClient.post('/harvests', payload);
    invalidateCache('harvest');
    invalidateCache('tank');
    invalidateCache('summary');
    invalidateCache('submission');
    invalidateCache('audit');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('harvestCreated', { detail: res?.data }));
      window.dispatchEvent(new CustomEvent('adminDataChanged'));
    }
    return res?.data || null;
  },

  async createTank(payload) {
    const res = await apiClient.post('/tanks', payload);
    invalidateCache('tank');
    invalidateCache('summary');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adminDataChanged'));
    }
    return res?.data || null;
  },

  async updateTank(id, updates) {
    const res = await apiClient.put(`/tanks/${id}`, updates);
    invalidateCache('tank');
    invalidateCache('summary');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adminDataChanged'));
    }
    return res?.data || null;
  },

  async verifySubmission(id, status, notes = '') {
    const res = await apiClient.patch(`/submissions/${id}/verify`, { status, notes });
    invalidateCache('submission');
    invalidateCache('summary');
    invalidateCache('location');
    invalidateCache('audit');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adminDataChanged'));
    }
    return res?.data || null;
  }
};

export default adminService;
