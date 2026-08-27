export const loginAdmin = (adminId, password) => {
  if ((adminId === 'ADM001' || adminId === '9999999999') && password === 'admin123') {
    const sessionData = {
      role: 'admin',
      adminId: 'ADM001',
      name: 'Admin',
      mobile: '9999999999',
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('admin_auth_session', JSON.stringify(sessionData));
    return { success: true };
  }
  return { success: false, error: 'Invalid Admin ID or Password' };
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
