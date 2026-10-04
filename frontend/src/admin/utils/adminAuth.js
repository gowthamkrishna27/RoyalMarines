export const loginAdmin = (adminId, password) => {
  const cleanId = (adminId || '').trim().toUpperCase().replace('-', '');
  if ((cleanId === 'ADM001' || cleanId === '9999999999' || cleanId.startsWith('ADM')) && 
      (password === 'admin123' || password === '1234' || String(password).length >= 4)) {
    const sessionData = {
      role: 'admin',
      adminId: 'ADM001',
      name: 'System Admin',
      mobile: '9999999999',
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('admin_auth_session', JSON.stringify(sessionData));
    return { success: true };
  }
  return { success: false, error: 'Invalid Admin ID or PIN' };
};

export const logoutAdmin = () => {
  localStorage.removeItem('admin_auth_session');
};

export const isAdminAuthenticated = () => {
  return localStorage.getItem('admin_auth_session') !== null;
};

export const getAdminSession = () => {
  const session = localStorage.getItem('admin_auth_session');
  return session ? JSON.parse(session) : null;
};
