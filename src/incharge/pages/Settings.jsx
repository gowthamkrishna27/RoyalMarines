import React from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { getInchargeSession, logoutIncharge } from '../utils/inchargeAuth';
import { useNavigate } from 'react-router-dom';
import { User, Shield, MapPin, Phone, LogOut, Lock } from 'lucide-react';

const Settings = () => {
  const session = getInchargeSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutIncharge();
    navigate('/incharge-login');
  };

  return (
    <>
      <InchargeHeader title="Incharge Settings & Profile" />

      <div style={{ padding: '24px 28px', maxWidth: '780px', margin: '0 auto' }}>
        
        {/* Profile Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={styles.avatarCircle}>
                {session?.name ? session.name[0] : 'M'}
              </div>
              <div>
                <h3 style={styles.cardTitle}>{session?.name || 'M. Srinivas'}</h3>
                <span style={styles.cardSub}>Regional Cluster Incharge • Royals Marine</span>
              </div>
            </div>
            <span style={styles.activeBadge}>Active Session</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
            <div style={styles.fieldRow}>
              <div style={styles.fieldLabelGroup}>
                <User size={15} color="#64748B" />
                <span style={styles.fieldLabel}>Supervisor Full Name</span>
              </div>
              <span style={styles.fieldValue}>{session?.name || 'M. Srinivas'}</span>
            </div>

            <div style={styles.fieldRow}>
              <div style={styles.fieldLabelGroup}>
                <Shield size={15} color="#64748B" />
                <span style={styles.fieldLabel}>Incharge Officer ID</span>
              </div>
              <span style={{ ...styles.fieldValue, color: '#1A2FB8' }}>{session?.inchargeId || 'INC001'}</span>
            </div>

            <div style={styles.fieldRow}>
              <div style={styles.fieldLabelGroup}>
                <Phone size={15} color="#64748B" />
                <span style={styles.fieldLabel}>Mobile Phone</span>
              </div>
              <span style={styles.fieldValue}>{session?.mobile || '+91 98480 12345'}</span>
            </div>

            <div style={styles.fieldRow}>
              <div style={styles.fieldLabelGroup}>
                <MapPin size={15} color="#64748B" />
                <span style={styles.fieldLabel}>Jurisdiction Region</span>
              </div>
              <span style={styles.fieldValue}>{session?.region || 'Coastal Andhra (Bhimavaram Cluster)'}</span>
            </div>
          </div>
        </div>

        {/* Security & Logout Card */}
        <div style={{ ...styles.card, marginTop: '24px' }}>
          <div style={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="#DC2626" />
              <h3 style={styles.cardTitle}>Account Security & Session</h3>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: '#64748B', margin: '14px 0 20px 0' }}>
            Logging out will terminate this incharge audit session on this device.
          </p>

          <button 
            type="button"
            onClick={handleLogout}
            style={styles.logoutBtn}
            className="transition-all duration-150 hover:bg-rose-100 active:scale-98 cursor-pointer"
          >
            <LogOut size={16} />
            <span>Terminate Session & Logout</span>
          </button>
        </div>

      </div>
    </>
  );
};

const styles = {
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid #F1F5F9',
  },
  avatarCircle: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    fontWeight: '800',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  cardSub: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
    display: 'block',
  },
  activeBadge: {
    display: 'inline-flex',
    padding: '3px 8px',
    borderRadius: '10px',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: '11px',
    fontWeight: '700',
  },
  fieldRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    border: '1px solid #F1F5F9',
  },
  fieldLabelGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  fieldLabel: {
    fontSize: '13px',
    color: '#475569',
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#0F172A',
  },
  logoutBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#FFF1F2',
    color: '#DC2626',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

export default Settings;

