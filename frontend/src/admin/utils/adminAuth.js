/**
 * Admin Authentication Module — Strict DB-Verified Credentials
 * 
 * All authentication is performed via the backend API which verifies
 * credentials against the MySQL database using bcrypt.
 * No hardcoded passwords. No client-side fallbacks.
 */

const AUTH_KEY = 'admin_auth_session';
const TOKEN_KEY = 'auth_token';

/**
 * Authenticate admin via backend API with DB-verified credentials.
 * @param {string} adminId - Admin username, phone, or email
 * @param {string} password - Password to verify against bcrypt hash in DB
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const loginAdmin = async (adminId, password) => {
  const cleanId = (adminId || '').trim();
  if (!cleanId || !password) {
    return { success: false, error: 'Admin ID and password are required' };
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

    // Verify role is ADMIN
    if ((backendUser.role || '').toUpperCase() !== 'ADMIN') {
      return { success: false, error: 'This account does not have Admin privileges.' };
    }

    // Store JWT token
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('auth_user', JSON.stringify(backendUser));

    // Build session
    const sessionData = {
      role: 'admin',
      adminId: backendUser.id || backendUser.username || 'ADM001',
      id: backendUser.id,
      name: backendUser.name,
      mobile: backendUser.phone || '',
      email: backendUser.email || '',
      loginTime: new Date().toISOString(),
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(sessionData));
    return { success: true };
  } catch (err) {
    console.error('[Admin Auth] Login error:', err.message);
    return { success: false, error: 'Unable to connect to server. Please check your network.' };
  }
};

export const logoutAdmin = () => {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('auth_user');
};

export const isAdminAuthenticated = () => {
  return localStorage.getItem(AUTH_KEY) !== null && localStorage.getItem(TOKEN_KEY) !== null;
};

export const getAdminSession = () => {
  const session = localStorage.getItem(AUTH_KEY);
  return session ? JSON.parse(session) : null;
};
