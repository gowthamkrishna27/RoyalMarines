import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Users, Plus, Clock, FileText, User, LogOut, Scale
} from 'lucide-react';
import { getSession, clearSession } from '../utils/agentAuth';
import QuickRecordModal from './QuickRecordModal';
import topnavlogo from '../../assets/topnavlogo.png';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState('WATER_QUALITY');

  const handleLogout = () => {
    if (window.confirm('Log out of Technician Portal?')) {
      clearSession();
      navigate('/login');
    }
  };

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: Home, match: ['/dashboard', '/technician'] },
    { name: 'My Farmers', path: '/farmers', icon: Users, match: ['/farmers', '/technician/farmers', '/add-farmer'] },
    { name: 'Harvest', path: '/harvest', icon: Scale, match: ['/harvest'] },
    { name: 'History', path: '/tests', icon: Clock, match: ['/tests', '/history'] },
    { name: 'Reports', path: '/reports', icon: FileText, match: ['/reports'] },
  ];

  const isItemActive = (item) => {
    return item.match.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  };

  return (
    <>
      <aside style={styles.sidebar}>
        {/* 1. Brand Header */}
        <div style={styles.brandHeader} onClick={() => navigate('/dashboard')} title="Royals Marine">
          <img src={topnavlogo} alt="Royals Marine" style={styles.brandLogoImg} />
        </div>

        {/* 2. Primary Action Buttons: New Record & Harvest */}
        <div style={styles.actionSection}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              className="transition-all duration-200 hover:brightness-110 active:scale-98 cursor-pointer"
              style={styles.quickRecordBtn}
              onClick={() => {
                setModalInitialType('WATER_QUALITY');
                setIsQuickRecordOpen(true);
              }}
              aria-label="New Field Record"
            >
              <Plus size={14} strokeWidth={2.5} /> Record
            </button>

            <button 
              className="transition-all duration-200 hover:brightness-105 active:scale-98 cursor-pointer"
              style={styles.harvestSideBtn}
              onClick={() => {
                setModalInitialType('HARVEST_ENTRY');
                setIsQuickRecordOpen(true);
              }}
              aria-label="Record Crop Harvest"
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
                className="transition-all duration-150 hover:bg-slate-50 active:scale-98"
                style={{
                  ...styles.navLink,
                  backgroundColor: active ? '#EFF6FF' : 'transparent',
                  color: active ? '#1A2FB8' : '#475569',
                  fontWeight: active ? '700' : '500',
                }}
              >
                <Icon size={18} color={active ? '#1A2FB8' : '#64748B'} strokeWidth={active ? 2.5 : 1.8} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* 4. Footer with Technician Profile Card & Logout */}
        <div style={styles.footerSection}>
          <div 
            style={styles.userCard}
            onClick={() => navigate('/profile')}
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

      <QuickRecordModal 
        isOpen={isQuickRecordOpen}
        onClose={() => setIsQuickRecordOpen(false)}
        initialType={modalInitialType}
      />
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
    color: '#0018AD',
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
};

export default Sidebar;
