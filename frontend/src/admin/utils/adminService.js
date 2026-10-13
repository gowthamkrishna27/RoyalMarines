import { apiClient } from '../../utils/apiClient';

/**
 * Enterprise Admin Data Service
 * Connects all Admin Portal modules directly to live Express / MySQL API endpoints.
 * Features in-memory caching and request deduplication for near-instant (0ms) tab switching.
 */

const cache = new Map();
const inFlight = new Map();
const DEFAULT_TTL = 20000; // 20 seconds

async function fetchCached(key, fetcher, ttl = DEFAULT_TTL, force = false) {
  const now = Date.now();
  const cached = cache.get(key);

  if (!force && cached && (now - cached.timestamp < ttl)) {
    return cached.data;
  }

  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  const promise = (async () => {
    try {
      const data = await fetcher();
      cache.set(key, { data, timestamp: Date.now() });
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
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (typeof pattern === 'string' && key.includes(pattern)) {
      cache.delete(key);
    } else if (pattern instanceof RegExp && pattern.test(key)) {
      cache.delete(key);
    }
  }
}

export const adminService = {
  invalidateCache,
  clearCache: () => cache.clear(),

  async getSummary(force = false) {
    return fetchCached('summary', async () => {
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
    }, DEFAULT_TTL, force);
  },

  async getRegions(force = false) {
    return fetchCached('regions', async () => {
      const res = await apiClient.get('/analytics/regions');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL, force);
  },

  async getIncharges(force = false) {
    return fetchCached('incharges', async () => {
      const res = await apiClient.get('/analytics/incharges');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL, force);
  },

  async getInchargeById(id, force = false) {
    return fetchCached(`incharge:${id}`, async () => {
      const res = await apiClient.get(`/analytics/incharges/${id}`);
      return res?.data || null;
    }, DEFAULT_TTL, force);
  },

  async getAgents(force = false) {
    return fetchCached('agents', async () => {
      const res = await apiClient.get('/analytics/agents');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL, force);
  },

  async getAgentById(id, force = false) {
    return fetchCached(`agent:${id}`, async () => {
      const res = await apiClient.get(`/analytics/agents/${id}`);
      return res?.data || null;
    }, DEFAULT_TTL, force);
  },

  async getFarmers(force = false) {
    return fetchCached('farmers', async () => {
      const res = await apiClient.get('/farmers');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL, force);
  },

  async getFarmerById(id, force = false) {
    return fetchCached(`farmer:${id}`, async () => {
      const res = await apiClient.get(`/farmers/${id}`);
      return res?.data || null;
    }, DEFAULT_TTL, force);
  },

  async getTanks(force = false) {
    return fetchCached('tanks', async () => {
      const res = await apiClient.get('/tanks');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL, force);
  },

  async getTankById(id, force = false) {
    return fetchCached(`tank:${id}`, async () => {
      const res = await apiClient.get(`/tanks/${id}`);
      return res?.data || null;
    }, DEFAULT_TTL, force);
  },

  async getSubmissions(force = false) {
    return fetchCached('submissions', async () => {
      const res = await apiClient.get('/submissions');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL, force);
  },

  async getTodaySubmissions(force = false) {
    return fetchCached('todaySubmissions', async () => {
      const res = await apiClient.get('/admin/submission-locations?date=today');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL, force);
  },

  async getHarvests(force = false) {
    return fetchCached('harvests', async () => {
      const res = await apiClient.get('/harvests');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL, force);
  },

  async getDashboardData(tankIds = [], interval = 'Monthly', force = false) {
    const params = new URLSearchParams();
    if (interval) params.set('interval', interval);
    if (Array.isArray(tankIds) && tankIds.length > 0) {
      params.set('tankIds', tankIds.join(','));
    }
    const key = `dashboardData:${params.toString()}`;
    return fetchCached(key, async () => {
      const res = await apiClient.get(`/analytics/dashboard-data?${params.toString()}`);
      return res?.data || {
        waterQuality: [],
        trend: [],
        kpis: { abw: '0.0', fcr: '0.00', feed: 0, activeTanks: 0, totalBiomass: 0, totalHarvest: 0, compliance: '0%', pending: 0 }
      };
    }, DEFAULT_TTL, force);
  },

  async getAuditLogs(force = false) {
    return fetchCached('auditLogs', async () => {
      const res = await apiClient.get('/analytics/audit-logs');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL, force);
  },

  async getSubmissionLocations(filter = {}, force = false) {
    const params = new URLSearchParams(filter);
    const key = `locations:${params.toString()}`;
    return fetchCached(key, async () => {
      const res = await apiClient.get(`/admin/submission-locations?${params.toString()}`);
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL, force);
  },

  async getFieldStaff(force = false) {
    return fetchCached('fieldStaff', async () => {
      const res = await apiClient.get('/admin/field-staff');
      return Array.isArray(res?.data) ? res.data : [];
    }, DEFAULT_TTL, force);
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
