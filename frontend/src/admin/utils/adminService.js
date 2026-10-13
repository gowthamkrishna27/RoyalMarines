import { apiClient } from '../../utils/apiClient';

/**
 * Enterprise Admin Data Service
 * Connects all Admin Portal modules directly to live Express / MySQL API endpoints.
 */

export const adminService = {
  async getSummary() {
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
  },

  async getRegions() {
    const res = await apiClient.get('/analytics/regions');
    return Array.isArray(res?.data) ? res.data : [];
  },

  async getIncharges() {
    const res = await apiClient.get('/analytics/incharges');
    return Array.isArray(res?.data) ? res.data : [];
  },

  async getInchargeById(id) {
    const res = await apiClient.get(`/analytics/incharges/${id}`);
    return res?.data || null;
  },

  async getAgents() {
    const res = await apiClient.get('/analytics/agents');
    return Array.isArray(res?.data) ? res.data : [];
  },

  async getAgentById(id) {
    const res = await apiClient.get(`/analytics/agents/${id}`);
    return res?.data || null;
  },

  async getFarmers() {
    const res = await apiClient.get('/farmers');
    return Array.isArray(res?.data) ? res.data : [];
  },

  async getFarmerById(id) {
    const res = await apiClient.get(`/farmers/${id}`);
    return res?.data || null;
  },

  async getTanks() {
    const res = await apiClient.get('/tanks');
    return Array.isArray(res?.data) ? res.data : [];
  },

  async getTankById(id) {
    const res = await apiClient.get(`/tanks/${id}`);
    return res?.data || null;
  },

  async getSubmissions() {
    const res = await apiClient.get('/submissions');
    return Array.isArray(res?.data) ? res.data : [];
  },

  async getHarvests() {
    const res = await apiClient.get('/harvests');
    return Array.isArray(res?.data) ? res.data : [];
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

  async getFieldStaff() {
    const res = await apiClient.get('/admin/field-staff');
    return Array.isArray(res?.data) ? res.data : [];
  },

  async createSubmission(payload) {
    const res = await apiClient.post('/submissions', payload);
    return res?.data || null;
  },

  async createHarvest(payload) {
    const res = await apiClient.post('/harvests', payload);
    return res?.data || null;
  },

  async updateTank(id, updates) {
    const res = await apiClient.put(`/tanks/${id}`, updates);
    return res?.data || null;
  },

  async verifySubmission(id, status, notes = '') {
    const res = await apiClient.patch(`/submissions/${id}/verify`, { status, notes });
    return res?.data || null;
  }
};

export default adminService;
