/**
 * High-performance API client for communicating with the Royals Marine backend API.
 * Uses native fetch with automatic base URL routing, JSON serialization, and error handling.
 */

const BASE_URL = '/api';

class ApiClient {
  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Grab token/role from session if present
    const agentSession = localStorage.getItem('agentSession');
    const inchargeSession = localStorage.getItem('inchargeSession');
    const adminSession = localStorage.getItem('adminSession');

    if (adminSession) {
      try {
        const parsed = JSON.parse(adminSession);
        headers['x-user-role'] = 'ADMIN';
        headers['x-user-id'] = parsed.id || 'ADM001';
      } catch {}
    } else if (inchargeSession) {
      try {
        const parsed = JSON.parse(inchargeSession);
        headers['x-user-role'] = 'ASM';
        headers['x-user-id'] = parsed.id || 'INC001';
      } catch {}
    } else if (agentSession) {
      try {
        const parsed = JSON.parse(agentSession);
        headers['x-user-role'] = 'AGENT';
        headers['x-user-id'] = parsed.id || 'agent001';
      } catch {}
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || `HTTP error ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`[API Error] ${options.method || 'GET'} ${url}:`, error.message);
      throw error;
    }
  }

  get(endpoint, params = null) {
    let url = endpoint;
    if (params) {
      const query = new URLSearchParams(params).toString();
      url += (url.includes('?') ? '&' : '?') + query;
    }
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
