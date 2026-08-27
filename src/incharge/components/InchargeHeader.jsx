import React from 'react';
import { Bell, User } from 'lucide-react';
import { getInchargeSession } from '../utils/inchargeAuth';
import BackButton from '../../components/BackButton';

const InchargeHeader = ({ title = "Dashboard" }) => {
  const session = getInchargeSession();
  
  return (
    <div style={{
      height: '70px',
      backgroundColor: 'white',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <BackButton fallback="/incharge/dashboard" />
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-main)', margin: 0 }}>{title}</h1>
          {session && title === 'Dashboard' && (
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Welcome back, Incharge {session.name}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{session?.region || 'Region'}</span>
          <span style={{ fontSize: '10px' }}>▼</span>
        </div>

        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <Bell size={20} color="var(--color-text-muted)" />
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: 'var(--status-red)',
            color: 'white',
            fontSize: '10px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>3</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '24px', borderLeft: '1px solid var(--color-border)' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)'
          }}>
            <User size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{session?.name || 'Incharge User'}</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Incharge ▼</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InchargeHeader;
