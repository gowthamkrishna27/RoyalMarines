import React from 'react';
import PageHeader from '../components/PageHeader';
import { getAdminSession, logoutAdmin } from '../utils/adminAuth';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Phone, LogOut } from 'lucide-react';

const Settings = () => {
  const session = getAdminSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin-login');
  };

  return (
    <>
      <PageHeader title="System Settings" breadcrumbs={[{ label: 'System' }, { label: 'Settings', active: true }]} />
      <div className="content-inner">
        <div className="card" style={{ maxWidth: '600px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
            Admin Profile Profile
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '20px', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={36} />
            </div>
            <div>
              <h4 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0' }}>{session?.name || 'Admin'}</h4>
              <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '14px' }}>System Administrator</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2" style={{ gap: '20px', marginBottom: '32px' }}>
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-muted)' }}>Admin ID</label>
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '15px', fontWeight: 500 }}>
                {session?.adminId || 'ADM001'}
              </div>
            </div>
            
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-muted)' }}>Mobile Number</label>
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} color="var(--color-text-muted)" />
                {session?.mobile || '+91 9999999999'}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
            <button 
              onClick={handleLogout}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                padding: '12px 24px', backgroundColor: '#fef2f2', 
                color: 'var(--status-red)', border: 'none', borderRadius: '8px', 
                fontWeight: 600, fontSize: '14px', cursor: 'pointer' 
              }}
            >
              <LogOut size={18} /> Sign Out of Admin Portal
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
