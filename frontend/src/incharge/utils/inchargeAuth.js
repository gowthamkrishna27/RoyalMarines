const AUTH_KEY = 'incharge_auth_session';

const mockInchargeUsers = [
  { inchargeId: 'INC001', mobile: '9876543210', password: 'incharge123', name: 'Ravi Kumar', region: 'Bhimavaram Region' }
];

export const loginIncharge = (identifier, password) => {
  const cleanId = (identifier || '').trim().replace('-', '').toUpperCase();
  const user = mockInchargeUsers.find(
    u => u.inchargeId.toUpperCase() === cleanId || 
         u.mobile === identifier ||
         (cleanId.startsWith('INC') || cleanId.startsWith('ASM'))
  ) || mockInchargeUsers[0];
  
  if (user && (password === user.password || password === '1234' || password === 'incharge123' || String(password).length >= 4)) {
    const session = {
      inchargeId: user.inchargeId,
      name: user.name,
      region: user.region,
      mobile: user.mobile,
      loginTime: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return { success: true, session };
  }
  
  return { success: false, error: 'Invalid Incharge / ASM ID or PIN' };
};

export const logoutIncharge = () => {
  localStorage.removeItem(AUTH_KEY);
};

export const isInchargeAuthenticated = () => {
  return !!localStorage.getItem(AUTH_KEY);
};

export const getInchargeSession = () => {
  const data = localStorage.getItem(AUTH_KEY);
  return data ? JSON.parse(data) : null;
};
