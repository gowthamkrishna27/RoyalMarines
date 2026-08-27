import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Plus, Clock, User } from 'lucide-react';
import QuickRecordModal from './QuickRecordModal';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: Home, match: ['/dashboard', '/technician'] },
    { label: 'My Farmers', path: '/farmers', icon: Users, match: ['/farmers', '/technician/farmers', '/add-farmer'] },
    { label: 'New', isAction: true, icon: Plus },
    { label: 'History', path: '/tests', icon: Clock, match: ['/tests', '/history'] },
    { label: 'Profile', path: '/profile', icon: User, match: ['/profile'] },
  ];

  const isActive = (item) => {
    if (!item.match) return false;
    return item.match.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  };

  return (
    <>
      <nav style={styles.navContainer} aria-label="Mobile Navigation">
        {navItems.map((item) => {
          if (item.isAction) {
            return (
              <div key="new-action" style={styles.actionWrapper}>
                <button
                  style={styles.floatingCenterBtn}
                  onClick={() => setIsRecordModalOpen(true)}
                  aria-label="New Field Record"
                >
                  <Plus size={22} color="#FFFFFF" strokeWidth={2.5} />
                </button>
                <span style={styles.centerLabel}>+ New</span>
              </div>
            );
          }

          const Icon = item.icon;
          const active = isActive(item);

          return (
            <button
              key={item.label}
              style={{
                ...styles.navBtn,
                color: active ? '#0018AD' : '#64748B',
              }}
              onClick={() => navigate(item.path)}
            >
              <div style={styles.iconContainer}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span style={{
                ...styles.navLabel,
                fontWeight: active ? '700' : '500',
                color: active ? '#0018AD' : '#64748B',
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <QuickRecordModal 
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
      />
    </>
  );
};

const styles = {
  navContainer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 9999,
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.03)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  },
  navBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    padding: '4px 0',
    cursor: 'pointer',
    minWidth: '44px',
    minHeight: '44px',
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '22px',
  },
  navLabel: {
    fontSize: '10px',
    marginTop: '2px',
    letterSpacing: '0.2px',
  },
  actionWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    top: '-10px',
  },
  floatingCenterBtn: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    backgroundColor: '#0018AD',
    border: '2px solid #FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 24, 173, 0.35)',
  },
  centerLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#0018AD',
    marginTop: '2px',
  },
};

export default BottomNavigation;
