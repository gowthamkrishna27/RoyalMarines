const AUTH_KEY = 'incharge_auth_session';

const mockInchargeUsers = [
  { inchargeId: 'INC001', mobile: '9876543210', password: 'incharge123', name: 'Ravi Kumar', region: 'Bhimavaram Region' }
];

export const loginIncharge = (identifier, password) => {
  const user = mockInchargeUsers.find(
    u => (u.inchargeId === identifier || u.mobile === identifier) && u.password === password
  );
  
  if (user) {
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
  
  return { success: false, error: 'Invalid Incharge ID/Mobile or Password' };
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
