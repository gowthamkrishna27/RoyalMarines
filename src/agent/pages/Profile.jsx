import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Lock, MapPin, CheckCircle, RefreshCw, LogOut, Bell, Smartphone, HelpCircle 
} from 'lucide-react';
import { getSession, clearSession } from '../utils/agentAuth';
import SyncStatusModal from '../components/SyncStatusModal';
import { getSyncStatus } from '../utils/syncService';

const Profile = () => {
  const navigate = useNavigate();
  const session = getSession();

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncState, setSyncState] = useState(getSyncStatus());

  const handleLogout = () => {
    if (window.confirm('Log out of Technician Account?')) {
      clearSession();
      navigate('/login');
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <span style={styles.headerTag}>ACCOUNT</span>
          <h1 style={styles.headerTitle}>Profile</h1>
        </div>
        <span style={styles.readOnlyPill}>
          <Lock size={10} /> Read Only
        </span>
      </div>

      {/* Profile Card */}
      <div style={styles.card}>
        <div style={styles.profileHero}>
          <div style={styles.avatarCircle}>
            <User size={22} color="#0018AD" />
          </div>
          <div>
            <div style={styles.nameTitle}>{session?.name || 'Agent A'}</div>
            <div style={styles.techIdText}>Technician ID: {session?.agentId || 'agent001'}</div>
          </div>
        </div>

        <div style={styles.divider} />

        <div style={styles.infoList}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Assigned Area</span>
            <span style={styles.infoVal}>Bhimavaram</span>
          </div>

          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Mobile</span>
            <span style={styles.infoVal}>98765 XXXXX</span>
          </div>

          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Status</span>
            <span style={styles.activePill}>
              <CheckCircle size={11} color="#16A34A" /> Active
            </span>
          </div>
        </div>
      </div>

      {/* Settings Section (Read Only) */}
      <div style={styles.card}>
        <div style={styles.sectionHeaderSmall}>SETTINGS</div>

        <div style={styles.settingsList}>
          <div style={styles.settingItem}>
            <div style={styles.settingLeft}>
              <MapPin size={15} color="#0018AD" />
              <span>Location</span>
            </div>
            <span style={styles.settingStatusGood}>✓ Enabled</span>
          </div>

          <div style={styles.settingItem}>
            <div style={styles.settingLeft}>
              <Bell size={15} color="#0018AD" />
              <span>Notifications</span>
            </div>
            <span style={styles.settingStatusGood}>✓ Enabled</span>
          </div>

          <div 
            style={{ ...styles.settingItem, cursor: 'pointer' }}
            onClick={() => setIsSyncModalOpen(true)}
          >
            <div style={styles.settingLeft}>
              <RefreshCw size={15} color="#0018AD" />
              <span>Sync</span>
            </div>
            <span style={styles.syncBadge}>
              {syncState.pendingCount > 0 ? `⚠ ${syncState.pendingCount} Pending` : '✓ Synced'}
            </span>
          </div>

          <div style={styles.settingItem}>
            <div style={styles.settingLeft}>
              <Smartphone size={15} color="#64748B" />
              <span>App Version</span>
            </div>
            <span style={styles.settingVal}>1.0.0</span>
          </div>

          <div style={styles.settingItem}>
            <div style={styles.settingLeft}>
              <HelpCircle size={15} color="#64748B" />
              <span>Help</span>
            </div>
            <span style={styles.settingVal}>About Royals Marine</span>
          </div>
        </div>
      </div>

      {/* Logout Action */}
      <button style={styles.logoutBtn} onClick={handleLogout}>
        <LogOut size={15} /> Logout
      </button>

      {/* Sync Status Modal */}
      <SyncStatusModal 
        isOpen={isSyncModalOpen}
        onClose={() => {
          setIsSyncModalOpen(false);
          setSyncState(getSyncStatus());
        }}
      />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '4px',
  },
  headerTag: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.4px',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0F172A',
    margin: '1px 0 0 0',
  },
  readOnlyPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '14px 16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  profileHero: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatarCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#EDF0FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
  },
  techIdText: {
    fontSize: '11px',
    color: '#0018AD',
    fontWeight: '600',
    marginTop: '1px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#F1F5F9',
    margin: '12px 0',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '4px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '500',
  },
  infoVal: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0F172A',
  },
  activePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    padding: '1px 6px',
    borderRadius: '4px',
  },
  sectionHeaderSmall: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.4px',
    marginBottom: '10px',
  },
  settingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  settingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    fontSize: '12px',
  },
  settingLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
    color: '#334155',
  },
  settingStatusGood: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#15803D',
  },
  syncBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#0018AD',
  },
  settingVal: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '500',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    border: 'none',
    padding: '12px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '4px',
  },
};

export default Profile;
