/**
 * Incharge / ASM Authentication Module — Strict DB-Verified Credentials
 * 
 * All authentication is performed via the backend API which verifies
 * credentials against the MySQL database using bcrypt.
 * No hardcoded passwords. No client-side fallbacks.
 */

const AUTH_KEY = 'incharge_auth_session';
const TOKEN_KEY = 'auth_token';

/**
 * Authenticate incharge/ASM via backend API with DB-verified credentials.
 * @param {string} identifier - Incharge username, phone, or email
 * @param {string} password - Password to verify against bcrypt hash in DB
 * @returns {Promise<{success: boolean, session?: object, error?: string}>}
 */
export const loginIncharge = async (identifier, password) => {
  const cleanId = (identifier || '').trim();
  if (!cleanId || !password) {
    return { success: false, error: 'Incharge ID and password are required' };
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

    // Verify role is ASM / INCHARGE
    const userRole = (backendUser.role || '').toUpperCase();
    if (userRole !== 'ASM' && userRole !== 'INCHARGE') {
      return { success: false, error: 'This account is not an Incharge/ASM account. Please use the correct portal.' };
    }

    // Store JWT token
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('auth_user', JSON.stringify(backendUser));

    // Build session
    const session = {
      inchargeId: backendUser.id || backendUser.username,
      id: backendUser.id,
      name: backendUser.name,
      region: backendUser.region || '',
      mobile: backendUser.phone || '',
      role: 'ASM',
      loginTime: new Date().toISOString(),
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return { success: true, session };
  } catch (err) {
    console.error('[Incharge Auth] Login error:', err.message);
    return { success: false, error: 'Unable to connect to server. Please check your network.' };
  }
};

export const logoutIncharge = () => {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('auth_user');
};

export const isInchargeAuthenticated = () => {
  return !!localStorage.getItem(AUTH_KEY) && !!localStorage.getItem(TOKEN_KEY);
};

export const getInchargeSession = () => {
  const data = localStorage.getItem(AUTH_KEY);
  return data ? JSON.parse(data) : null;
};
