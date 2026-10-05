/**
 * Agent Authentication Module — Strict DB-Verified Credentials
 * 
 * All authentication is performed via the backend API which verifies
 * credentials against the MySQL database using bcrypt.
 * No hardcoded passwords. No client-side fallbacks.
 */

const AUTH_KEY = 'agent_auth_session';
const TOKEN_KEY = 'auth_token';
const PROFILES_KEY = 'agent_profiles_store';
const PASSWORDS_KEY = 'agent_passwords_store';

/**
 * Helper to get stored password overrides
 * @param {string} agentId
 * @returns {string|null}
 */
export const getStoredPassword = (agentId) => {
  try {
    const passwords = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
    if (passwords && passwords[agentId]) {
      return passwords[agentId];
    }
  } catch (e) {
    console.error(e);
  }
  return null;
};

/**
 * Helper to update & store password for an agentId
 * @param {string} agentId
 * @param {string} newPassword
 * @returns {boolean}
 */
export const updateStoredPassword = (agentId, newPassword) => {
  try {
    const id = agentId || 'agent001';
    const passwords = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
    passwords[id] = newPassword;
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * Authenticate agent via backend API with DB-verified credentials.
 * @param {string} agentId - Agent username, phone, or email
 * @param {string} password - Password to verify against bcrypt hash in DB
 * @returns {Promise<{success: boolean, session?: object, error?: string}>}
 */
export const login = async (agentId, password) => {
  const cleanId = (agentId || '').trim();
  if (!cleanId || !password) {
    return { success: false, error: 'Agent ID and password are required' };
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: cleanId, password: String(password) }),
    });

    const data = await res.json();

    if (!data.success || !data.data?.token) {
      return { success: false, error: data.message || 'Invalid credentials' };
    }

    const backendUser = data.data.user;
    const token = data.data.token;

    // Verify role is AGENT (or allow if no role check needed)
    if (backendUser.role && backendUser.role.toUpperCase() !== 'AGENT') {
      return { success: false, error: 'This account is not an Agent account. Please use the correct portal.' };
    }

    // Store JWT token
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('auth_user', JSON.stringify(backendUser));

    // Build session from DB user data
    const overrides = getStoredProfile(backendUser.id || backendUser.username);
    const session = {
      agentId: backendUser.id || backendUser.username,
      id: backendUser.id,
      name: overrides?.name || backendUser.name,
      region: overrides?.region || backendUser.region || '',
      locality: overrides?.locality || backendUser.locality || '',
      asm: overrides?.asm || 'Rajesh',
      phone: overrides?.phone || backendUser.phone || '',
      photo: overrides?.photo || null,
      role: 'AGENT',
      loginTime: new Date().toISOString(),
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(session));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('agentProfileUpdated'));
    }

    return { success: true, session };
  } catch (err) {
    console.error('[Agent Auth] Login error:', err.message);
    return { success: false, error: 'Unable to connect to server. Please check your network.' };
  }
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('auth_user');
};

export const clearSession = logout;

export const isAuthenticated = () => {
  return !!localStorage.getItem(AUTH_KEY) && !!localStorage.getItem(TOKEN_KEY);
};

export const getSession = () => {
  const data = localStorage.getItem(AUTH_KEY);
  if (!data) return null;
  try {
    const session = JSON.parse(data);
    const overrides = getStoredProfile(session.agentId);
    if (overrides) {
      return { ...session, ...overrides };
    }
    return session;
  } catch (e) {
    return null;
  }
};

// Helper to get stored profile overrides (e.g. updated name)
export const getStoredProfile = (agentId) => {
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}');
    if (profiles && profiles[agentId]) {
      return profiles[agentId];
    }
  } catch (e) {
    console.error(e);
  }
  return null;
};

export const updateAgentProfile = (profileData) => {
  const currentSession = getSession() || { agentId: 'agent001', name: 'Ramesh', region: 'Bhimavaram', locality: 'Chinnamiram', asm: 'Rajesh' };
  const id = currentSession.agentId || 'agent001';

  const updatedSession = {
    ...currentSession,
    ...profileData
  };

  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}');
    profiles[id] = {
      ...(profiles[id] || {}),
      ...profileData
    };
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.warn('Quota exceeded on profiles store, attempting fallback without photo:', e);
    try {
      const profiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}');
      const safeData = { ...profileData };
      delete safeData.photo;
      profiles[id] = { ...(profiles[id] || {}), ...safeData };
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    } catch (err2) {
      console.error('Profiles store write error:', err2);
    }
  }

  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(updatedSession));
  } catch (e) {
    console.warn('Quota exceeded on auth session, saving without photo:', e);
    try {
      const safeSession = { ...updatedSession };
      delete safeSession.photo;
      localStorage.setItem(AUTH_KEY, JSON.stringify(safeSession));
    } catch (err2) {
      console.error('Auth session write error:', err2);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('agentProfileUpdated'));
  }
  return updatedSession;
};
