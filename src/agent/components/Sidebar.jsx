import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Users, Plus, Clock, User, 
  MapPin, Shield, LogOut, CheckCircle 
} from 'lucide-react';
import { getSession, clearSession } from '../utils/agentAuth';
import QuickRecordModal from './QuickRecordModal';
import topnavlogo from '../../assets/topnavlogo.png';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Log out of Technician Portal?')) {
      clearSession();
      navigate('/login');
    }
  };

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: Home, match: ['/dashboard', '/technician'] },
    { name: 'My Farmers', path: '/farmers', icon: Users, match: ['/farmers', '/technician/farmers', '/add-farmer'] },
    { name: 'History', path: '/tests', icon: Clock, match: ['/tests', '/history'] },
    { name: 'Profile', path: '/profile', icon: User, match: ['/profile'] },
  ];

  const isItemActive = (item) => {
    return item.match.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  };

  return (
    <>
      <aside style={styles.sidebar}>
        {/* Brand Header */}
        <div style={styles.brandHeader} onClick={() => navigate('/dashboard')} title="Home">
          <img src={topnavlogo} alt="Royals Marine" style={styles.brandLogoImg} />
        </div>

        {/* Action Button: + New Record */}
        <div style={{ padding: '0 16px', marginBottom: '16px' }}>
          <button 
            style={styles.quickRecordBtn}
            onClick={() => setIsQuickRecordOpen(true)}
          >
            <Plus size={16} /> + New Record
          </button>
        </div>

        {/* 5 Core Navigation Links */}
        <nav style={styles.navMenu}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                style={{
                  ...styles.navLink,
                  backgroundColor: active ? '#EDF0FF' : 'transparent',
                  color: active ? '#0018AD' : '#475569',
                  fontWeight: active ? '800' : '600',
                }}
              >
                <Icon size={18} color={active ? '#0018AD' : '#64748B'} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer with Technician Profile Card */}
        <div style={styles.footerSection}>
          <div style={styles.userCard}>
            <div style={styles.avatarMini}>
              <User size={16} color="#0018AD" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={styles.userName}>{session?.name || 'Arun Kumar'}</div>
              <div style={styles.userIdText}>TECH-00128</div>
            </div>
          </div>

          <button style={styles.logoutBtn} onClick={handleLogout} title="Logout">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      <QuickRecordModal 
        isOpen={isQuickRecordOpen}
        onClose={() => setIsQuickRecordOpen(false)}
      />
    </>
  );
};

const styles = {
  sidebar: {
    width: '240px',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    boxSizing: 'border-box',
  },
  brandHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #F1F5F9',
    marginBottom: '16px',
    cursor: 'pointer',
  },
  brandLogoImg: {
    height: '46px',
    maxWidth: '180px',
    objectFit: 'contain',
  },
  quickRecordBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#0018AD',
    color: '#FFFFFF',
    border: 'none',
    padding: '11px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 24, 173, 0.3)',
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '0 12px',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '13px',
    transition: 'all 0.15s ease',
  },
  footerSection: {
    padding: '16px',
    borderTop: '1px solid #F1F5F9',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    borderRadius: '10px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
  },
  avatarMini: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    backgroundColor: '#EDF0FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userName: {
    fontSize: '12px',
    fontWeight: '800',
    color: '#0F172A',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userIdText: {
    fontSize: '10px',
    color: '#64748B',
    fontWeight: '600',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    background: 'none',
    border: '1px solid #CBD5E1',
    padding: '8px',
    borderRadius: '8px',
    color: '#64748B',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

export default Sidebar;
