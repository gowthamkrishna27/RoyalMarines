const AUTH_KEY = 'agent_auth_session';
const PASSWORDS_KEY = 'agent_passwords_store';
const PROFILES_KEY = 'agent_profiles_store';

const initialUsers = [
  { agentId: 'agent001', password: 'agent123', name: 'Agent A', region: 'Bhimavaram', locality: 'Chinnamiram' },
  { agentId: 'agent002', password: 'agent123', name: 'Agent B', region: 'Narasapuram', locality: 'West Godavari' },
  { agentId: 'admin', password: 'admin', name: 'System Admin', region: 'Head Office', locality: 'Main Branch' }
];

// Helper to get stored password overrides or fallback to initial user password
export const getStoredPassword = (agentId) => {
  try {
    const passwords = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
    if (passwords && passwords[agentId]) {
      return passwords[agentId];
    }
  } catch (e) {
    console.error(e);
  }
  const user = initialUsers.find(u => u.agentId.toLowerCase() === (agentId || '').toLowerCase());
  return user ? user.password : 'agent123';
};

// Helper to update & store password for an agentId
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

export const login = (agentId, password) => {
  const cleanId = (agentId || '').trim();
  const user = initialUsers.find(u => u.agentId.toLowerCase() === cleanId.toLowerCase()) || initialUsers[0];
  const actualAgentId = user ? user.agentId : cleanId;
  const validPassword = getStoredPassword(actualAgentId);
  
  if (password === validPassword) {
    const overrides = getStoredProfile(actualAgentId);
    const session = {
      agentId: actualAgentId,
      name: (overrides && overrides.name) ? overrides.name : user.name,
      region: (overrides && overrides.region) ? overrides.region : user.region,
      locality: (overrides && overrides.locality) ? overrides.locality : user.locality,
      phone: (overrides && overrides.phone) ? overrides.phone : '9876543210',
      photo: (overrides && overrides.photo) ? overrides.photo : null,
      loginTime: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('agentProfileUpdated'));
    }
    return { success: true, session };
  }
  
  return { success: false, error: 'Invalid Agent ID or Password' };
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
};

export const clearSession = logout;

export const isAuthenticated = () => {
  return !!localStorage.getItem(AUTH_KEY);
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

export const updateAgentProfile = (profileData) => {
  const currentSession = getSession() || { agentId: 'agent001', name: 'Agent A', region: 'Bhimavaram', locality: 'Chinnamiram' };
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
