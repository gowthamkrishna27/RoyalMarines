import React from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { getInchargeSession, logoutIncharge } from '../utils/inchargeAuth';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const session = getInchargeSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutIncharge();
    navigate('/incharge-login');
  };

  return (
    <>
      <InchargeHeader title="Settings" />
      <div className="content-inner">
        <div className="card" style={{ maxWidth: '600px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Incharge Profile</h3>
          
          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Name</label>
            <input type="text" className="input-field" value={session?.name || ''} readOnly style={{ width: '100%', backgroundColor: '#f1f5f9' }} />
          </div>

          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Incharge ID</label>
            <input type="text" className="input-field" value={session?.inchargeId || ''} readOnly style={{ width: '100%', backgroundColor: '#f1f5f9' }} />
          </div>

          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Mobile Number</label>
            <input type="text" className="input-field" value={session?.mobile || ''} readOnly style={{ width: '100%', backgroundColor: '#f1f5f9' }} />
          </div>

          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Region</label>
            <input type="text" className="input-field" value={session?.region || ''} readOnly style={{ width: '100%', backgroundColor: '#f1f5f9' }} />
          </div>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--status-red)' }}>Danger Zone</h3>
            <button 
              onClick={handleLogout}
              style={{ 
                padding: '10px 24px', backgroundColor: '#fef2f2', 
                color: 'var(--status-red)', border: '1px solid #fecaca', 
                borderRadius: '8px', fontWeight: 600, cursor: 'pointer' 
              }}
            >
              Logout from System
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
