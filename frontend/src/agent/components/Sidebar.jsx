import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Users, Plus, Clock, FileText, User, LogOut, Scale, MessageSquare, Bell
} from 'lucide-react';
import { getSession, clearSession } from '../utils/agentAuth';
import { useMockData } from '../../context/MockDataContext';
import QuickRecordModal from './QuickRecordModal';
import topnavlogo from '../../assets/topnavlogo.png';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();
  const { db } = useMockData();
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState('WATER_QUALITY');

  const agentId = session?.agentId || 'agent001';
  const unreadNotifCount = (db?.notifications || []).filter(n => {
    const isRead = n.read === true || n.isRead === true || n.is_read === 1 || n.is_read === true;
    if (isRead) return false;
    return !n.agentId || n.agentId === agentId || n.userId === agentId;
  }).length;

  const handleLogout = () => {
    if (window.confirm('Log out of Technician Portal?')) {
      clearSession();
      navigate('/agent-login');
    }
  };

  const prefix = location.pathname.startsWith('/agent') 
    ? '/agent' 
    : (location.pathname.startsWith('/technician') ? '/technician' : '');

  const navItems = [
    { name: 'Home', path: prefix ? `${prefix}/dashboard` : '/dashboard', icon: Home, match: ['/dashboard', '/technician', '/technician/dashboard', '/agent', '/agent/dashboard', `${prefix}/dashboard`, '/'] },
    { name: 'My Farmers', path: prefix ? `${prefix}/farmers` : '/farmers', icon: Users, match: ['/farmers', '/technician/farmers', '/agent/farmers', '/add-farmer', `${prefix}/farmers`, `${prefix}/add-farmer`] },
    { name: 'Harvest', path: prefix ? `${prefix}/harvest` : '/harvest', icon: Scale, match: ['/harvest', '/technician/harvest', '/agent/harvest', `${prefix}/harvest`] },
    { name: 'Follow-ups', path: prefix ? `${prefix}/follow-ups` : '/follow-ups', icon: MessageSquare, match: ['/follow-ups', '/followups', `${prefix}/follow-ups`, `${prefix}/followups`] },
    { name: 'Notifications', path: prefix ? `${prefix}/notifications` : '/notifications', icon: Bell, badge: unreadNotifCount > 0 ? unreadNotifCount : null, match: ['/notifications', `${prefix}/notifications`, '/agent/notifications', '/technician/notifications'] },
    { name: 'History', path: prefix ? `${prefix}/tests` : '/tests', icon: Clock, match: ['/tests', '/history', '/technician/tests', '/technician/history', '/agent/tests', '/agent/history', `${prefix}/tests`, `${prefix}/history`] },
    { name: 'Reports', path: prefix ? `${prefix}/reports` : '/reports', icon: FileText, match: ['/reports', '/technician/reports', '/agent/reports', `${prefix}/reports`] },
  ];

  const currentPath = (location.pathname || '').replace(/\/$/, '') || '/';

  const isItemActive = (item) => {
    if (item.name === 'Home') {
      return (
        currentPath === '/' ||
        currentPath === '/dashboard' ||
        currentPath === '/agent' ||
        currentPath === '/agent/dashboard' ||
        currentPath === '/technician' ||
        currentPath === '/technician/dashboard'
      );
    }
    if (item.name === 'My Farmers') {
      return (
        currentPath === '/farmers' ||
        currentPath.startsWith('/farmers/') ||
        currentPath === '/agent/farmers' ||
        currentPath.startsWith('/agent/farmers/') ||
        currentPath === '/technician/farmers' ||
        currentPath.startsWith('/technician/farmers/') ||
        currentPath === '/add-farmer' ||
        currentPath === '/agent/add-farmer'
      );
    }
    if (item.name === 'Harvest') {
      return (
        currentPath === '/harvest' ||
        currentPath.startsWith('/harvest/') ||
        currentPath === '/agent/harvest' ||
        currentPath.startsWith('/agent/harvest/') ||
        currentPath === '/technician/harvest' ||
        currentPath.startsWith('/technician/harvest/')
      );
    }
    if (item.name === 'Follow-ups') {
      return (
        currentPath === '/follow-ups' ||
        currentPath.startsWith('/follow-ups/') ||
        currentPath === '/followups' ||
        currentPath.startsWith('/followups/') ||
        currentPath === '/agent/follow-ups' ||
        currentPath.startsWith('/agent/follow-ups/') ||
        currentPath === '/agent/followups' ||
        currentPath.startsWith('/agent/followups/') ||
        currentPath === '/technician/follow-ups' ||
        currentPath.startsWith('/technician/follow-ups/') ||
        currentPath === '/technician/followups' ||
        currentPath.startsWith('/technician/followups/')
      );
    }
    if (item.name === 'Notifications') {
      return (
        currentPath === '/notifications' ||
        currentPath.startsWith('/notifications/') ||
        currentPath === '/agent/notifications' ||
        currentPath.startsWith('/agent/notifications/') ||
        currentPath === '/technician/notifications' ||
        currentPath.startsWith('/technician/notifications/')
      );
    }
    if (item.name === 'History') {
      return (
        currentPath === '/tests' ||
        currentPath.startsWith('/tests/') ||
        currentPath === '/history' ||
        currentPath.startsWith('/history/') ||
        currentPath === '/agent/tests' ||
        currentPath.startsWith('/agent/tests/') ||
        currentPath === '/agent/history' ||
        currentPath.startsWith('/agent/history/') ||
        currentPath === '/technician/tests' ||
        currentPath.startsWith('/technician/tests/') ||
        currentPath === '/technician/history' ||
        currentPath.startsWith('/technician/history/') ||
        currentPath === '/weekly-tests' ||
        currentPath.startsWith('/weekly-tests/')
      );
    }
    if (item.name === 'Reports') {
      return (
        currentPath === '/reports' ||
        currentPath.startsWith('/reports/') ||
        currentPath === '/agent/reports' ||
        currentPath.startsWith('/agent/reports/') ||
        currentPath === '/technician/reports' ||
        currentPath.startsWith('/technician/reports/') ||
        currentPath === '/analytics' ||
        currentPath === '/my-analytics'
      );
    }
    return false;
  };

  return (
    <>
      <aside style={styles.sidebar}>
        {/* 1. Brand Header */}
        <div style={styles.brandHeader} onClick={() => navigate(prefix ? `${prefix}/dashboard` : '/dashboard')} title="Royals Marine">
          <img src={topnavlogo} alt="Royals Marine" style={styles.brandLogoImg} />
        </div>

        {/* 2. Primary Action Buttons: New Record & Harvest */}
        <div style={styles.actionSection}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              type="button"
              className="cursor-pointer transition-all duration-150 hover:brightness-110 active:scale-98"
              style={styles.quickRecordBtn}
              onClick={() => {
                setModalInitialType(null);
                setIsQuickRecordOpen(true);
              }}
              aria-label="New Field Record"
            >
              <Plus size={14} strokeWidth={2.5} /> Record
            </button>

            <button 
              type="button"
              className="cursor-pointer transition-all duration-150 hover:brightness-105 active:scale-98"
              style={styles.harvestSideBtn}
              onClick={() => {
                navigate(prefix ? `${prefix}/harvest` : '/harvest');
              }}
              aria-label="Harvest Management"
            >
              <Scale size={14} strokeWidth={2.4} /> Harvest
            </button>
          </div>
        </div>

        {/* 3. Core Navigation Links */}
        <nav style={styles.navMenu}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className="transition-colors duration-150 hover:bg-slate-50 cursor-pointer"
                style={{
                  ...styles.navLink,
                  backgroundColor: active ? '#EFF6FF' : 'transparent',
                  color: active ? '#1A2FB8' : '#475569',
                  fontWeight: active ? '700' : '500',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} color={active ? '#1A2FB8' : '#64748B'} strokeWidth={active ? 2.5 : 1.8} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span style={styles.navBadge}>{item.badge}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* 4. Footer with Technician Profile Card & Logout */}
        <div style={styles.footerSection}>
          <div 
            style={styles.userCard}
            onClick={() => navigate(prefix ? `${prefix}/profile` : '/profile')}
            title="View Profile & Settings"
          >
            <div style={styles.avatarMini}>
              <User size={15} color="#1A2FB8" strokeWidth={2.2} />
            </div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>{session?.name || 'Arun Kumar'}</div>
              <div style={styles.userIdText}>{session?.agentId || 'agent001'}</div>
            </div>
          </div>

          <button style={styles.logoutBtn} onClick={handleLogout} title="Logout">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {isQuickRecordOpen && (
        <QuickRecordModal 
          isOpen={isQuickRecordOpen}
          onClose={() => setIsQuickRecordOpen(false)}
          initialType={modalInitialType}
          startWithSelector={!modalInitialType}
        />
      )}
    </>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    boxSizing: 'border-box',
    userSelect: 'none',
    zIndex: 100,
  },
  brandHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #F1F5F9',
    marginBottom: '14px',
    cursor: 'pointer',
    height: '80px',
    boxSizing: 'border-box',
  },
  brandLogoImg: {
    height: '54px',
    maxWidth: '210px',
    objectFit: 'contain',
  },
  actionSection: {
    padding: '0 16px',
    marginBottom: '16px',
  },
  quickRecordBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    padding: '9px 10px',
    borderRadius: '10px',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 24, 173, 0.22)',
    transition: 'background-color 0.15s ease',
    boxSizing: 'border-box',
  },
  harvestSideBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1.5px solid #BFDBFE',
    padding: '9px 10px',
    borderRadius: '10px',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.15s ease',
    boxSizing: 'border-box',
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '0 14px',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '13px',
    transition: 'all 0.15s ease',
  },
  footerSection: {
    padding: '14px 16px',
    borderTop: '1px solid #F1F5F9',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: '#FAFCFF',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 8px',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
  },
  avatarMini: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#EDF0FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userInfo: {
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.2,
  },
  userName: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#0F172A',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userIdText: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#1A2FB8',
    marginTop: '1px',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: 'transparent',
    color: '#DC2626',
    border: '1px solid #FEE2E2',
    padding: '7px 10px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  navBadge: {
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    padding: '2px 6px',
    borderRadius: '6px',
    lineHeight: 1,
  },
};

export default Sidebar;
