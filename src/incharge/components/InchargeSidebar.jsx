import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare, 
  UserCheck,
  Droplets, 
  Network, 
  TestTube, 
  CheckCircle, 
  Calendar, 
  BarChart, 
  Download, 
  Activity, 
  Settings,
  LogOut,
  Shield,
  MapPin,
  Layers,
  X,
  History
} from 'lucide-react';
import { logoutIncharge, getInchargeSession } from '../utils/inchargeAuth';
import { useMockData } from '../../context/MockDataContext';
import topnavlogo from '../../assets/topnavlogo.png';

const navGroups = [
  {
    title: 'MAIN',
    items: [
      { path: '/incharge/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/incharge/agents', label: 'My Agents', icon: Users },
      { path: '/incharge/my-farmers', label: 'My Farmers', icon: UserCheck },
      { path: '/incharge/my-tanks', label: 'My Tanks', icon: Droplets },
      { path: '/incharge/farmers', label: 'Farmers', icon: UserSquare },
      { path: '/incharge/tanks', label: 'Tanks', icon: Layers },
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      { path: '/incharge/weekly-tests', label: 'Weekly Tests', icon: Calendar },
      { path: '/incharge/tests', label: 'Test History', icon: History },
    ]
  },
  {
    title: 'REPORTS & AUDIT',
    items: [
      { path: '/incharge/reports', label: 'Reports', icon: BarChart },
      { path: '/incharge/export-data', label: 'Export Data', icon: Download },
      { path: '/incharge/activity-log', label: 'Activity Log', icon: Activity },
      { path: '/incharge/settings', label: 'Settings', icon: Settings },
    ]
  }
];

const InchargeSidebar = ({ isMobile = false, isOpen = false, onClose = () => {} }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getInchargeSession();
  const { db } = useMockData();

  const pendingCount = (db?.submissions || []).filter(s => s.status === 'PENDING_VERIFICATION').length;

  const isCurrentActive = (path) => location.pathname === path || (path !== '/incharge/dashboard' && location.pathname.startsWith(path));

  const handleLogout = () => {
    if (window.confirm('Log out of ASM Portal?')) {
      logoutIncharge();
      navigate('/incharge-login');
    }
  };

  return (
    <aside style={{
      ...styles.sidebar,
      position: 'fixed',
      top: 0,
      bottom: 0,
      left: 0,
      width: '260px',
      transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 999,
      boxShadow: isMobile && isOpen ? '4px 0 24px rgba(0,0,0,0.18)' : 'none'
    }}>
      {/* 1. Brand Header */}
      <div style={{ ...styles.brandHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div 
          onClick={() => { navigate('/incharge/dashboard'); if (isMobile && onClose) onClose(); }} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          title="Royals Marine"
        >
          <img src={topnavlogo} alt="Royals Marine" style={styles.brandLogoImg} />
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} color="#475569" />
          </button>
        )}
      </div>

      {/* 2. Navigation Menu */}
      <div style={styles.navMenu}>
        {navGroups.map((group) => (
          <div key={group.title} style={{ marginBottom: '14px' }}>
            <div style={styles.groupHeading}>{group.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = isCurrentActive(item.path);
                const badgeCount = item.badgeKey === 'pendingVerifications' ? pendingCount : 0;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => { if (isMobile && onClose) onClose(); }}
                    className="transition-all duration-150 active:scale-98"
                    style={{
                      ...styles.navLink,
                      backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                      color: isActive ? '#1A2FB8' : '#475569',
                      fontWeight: isActive ? '700' : '500',
                      borderLeft: isActive ? '3.5px solid #1A2FB8' : '3.5px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon 
                        size={17} 
                        color={isActive ? '#1A2FB8' : '#64748B'} 
                        strokeWidth={isActive ? 2.4 : 1.8} 
                      />
                      <span>{item.label}</span>
                    </div>

                    {badgeCount > 0 && (
                      <span style={styles.badgePill}>
                        {badgeCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Footer with ASM Profile & Logout */}
      <div style={styles.footerSection}>
        <div style={styles.userCard}>
          <div style={styles.avatarWrap}>
            <span style={styles.avatarInitial}>{session?.name ? session.name[0] : 'A'}</span>
          </div>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{session?.name || 'ASM Officer'}</span>
            <div style={styles.userSubRow}>
              <MapPin size={10} color="#64748B" />
              <span>{session?.region || 'Coastal Andhra'}</span>
            </div>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleLogout}
          className="transition-all duration-150 hover:bg-rose-50 active:scale-98 cursor-pointer"
          style={styles.logoutBtn}
          title="Sign out"
        >
          <LogOut size={15} color="#DC2626" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    height: '100vh',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 40,
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.02)',
  },
  brandHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #F1F5F9',
    cursor: 'pointer',
  },
  brandLogoImg: {
    height: '42px',
    maxWidth: '180px',
    objectFit: 'contain',
    display: 'block',
  },
  navMenu: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 10px',
    display: 'flex',
    flexDirection: 'column',
    scrollbarWidth: 'thin',
  },
  groupHeading: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: '0.6px',
    padding: '4px 12px 6px 12px',
    textTransform: 'uppercase',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '13px',
    transition: 'all 0.15s ease-in-out',
  },
  badgePill: {
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    fontSize: '10.5px',
    fontWeight: '800',
    padding: '1px 6px',
    borderRadius: '10px',
    minWidth: '18px',
    textAlign: 'center',
  },
  footerSection: {
    padding: '12px 14px',
    borderTop: '1px solid #F1F5F9',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 8px',
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
  },
  avatarWrap: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '13px',
    flexShrink: 0,
  },
  avatarInitial: {
    textTransform: 'uppercase',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  userName: {
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#0F172A',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userSubRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '500',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '7px',
    borderRadius: '8px',
    border: '1px solid #FECACA',
    backgroundColor: '#FFF1F2',
    color: '#DC2626',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

export default InchargeSidebar;
