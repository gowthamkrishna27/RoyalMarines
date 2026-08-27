import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Plus, History, FileText } from 'lucide-react';
import QuickRecordModal from './QuickRecordModal';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: Home, match: ['/dashboard', '/technician'] },
    { label: 'Farmers', path: '/farmers', icon: Users, match: ['/farmers', '/technician/farmers', '/add-farmer'] },
    { label: 'New', isAction: true, icon: Plus },
    { label: 'History', path: '/tests', icon: History, match: ['/tests', '/history'] },
    { label: 'Reports', path: '/reports', icon: FileText, match: ['/reports'] },
  ];

  const isActive = (item) => {
    if (!item.match) return false;
    return item.match.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  };

  return (
    <>
      <nav style={styles.navContainer} aria-label="Mobile Bottom Navigation">
        <div style={styles.innerNav}>
          {navItems.map((item) => {
            if (item.isAction) {
              return (
                <div key="action-new" style={styles.actionCol}>
                  <button
                    type="button"
                    className="transition-all duration-150 active:scale-90 cursor-pointer"
                    style={styles.floatingCenterBtn}
                    onClick={() => setIsRecordModalOpen(true)}
                    aria-label="New Field Record"
                  >
                    <Plus size={24} color="#FFFFFF" strokeWidth={2.6} />
                  </button>
                </div>
              );
            }

            const Icon = item.icon;
            const active = isActive(item);

            return (
              <button
                key={item.label}
                type="button"
                className="transition-all duration-150 active:scale-95 cursor-pointer"
                style={styles.navBtn}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
              >
                <div style={styles.iconWrapper}>
                  <Icon 
                    size={22} 
                    strokeWidth={active ? 2.4 : 1.8} 
                    color={active ? '#0018AD' : '#64748B'} 
                  />
                </div>
              </button>
            );
          })}
        </div>
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
    zIndex: 9999,
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.03)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    userSelect: 'none',
  },
  innerNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    maxWidth: '480px',
    margin: '0 auto',
    padding: '0 4px',
    boxSizing: 'border-box',
    width: '100%',
  },
  navBtn: {
    flex: '1 1 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    background: 'none',
    border: 'none',
    padding: 0,
    margin: 0,
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  iconWrapper: {
    width: '40px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCol: {
    flex: '1 1 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
  },
  floatingCenterBtn: {
    position: 'absolute',
    top: '-18px',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#0018AD',
    border: '3px solid #FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 24, 173, 0.28)',
    zIndex: 10,
  },
};

export default BottomNavigation;
