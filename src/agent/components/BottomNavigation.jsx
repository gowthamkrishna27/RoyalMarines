import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Plus, Clock, FileText } from 'lucide-react';
import QuickRecordModal from './QuickRecordModal';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: Home, match: ['/dashboard', '/technician'] },
    { label: 'Farmers', path: '/farmers', icon: Users, match: ['/farmers', '/technician/farmers', '/add-farmer'] },
    { label: 'Record', isAction: true, icon: Plus },
    { label: 'History', path: '/tests', icon: Clock, match: ['/tests', '/history'] },
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
                    aria-label="New Record"
                  >
                    <Plus size={22} color="#FFFFFF" strokeWidth={2.8} />
                  </button>
                  <span style={styles.actionLabel}>Record</span>
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
                    size={20} 
                    strokeWidth={active ? 2.5 : 1.8} 
                    color={active ? '#1A2FB8' : '#64748B'} 
                  />
                  <span style={{
                    ...styles.navLabel,
                    color: active ? '#1A2FB8' : '#64748B',
                    fontWeight: active ? '700' : '500',
                  }}>
                    {item.label}
                  </span>
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
    height: '62px',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E2E8F0',
    zIndex: 9999,
    boxShadow: '0 -2px 12px rgba(15, 23, 42, 0.06)',
    paddingBottom: 'max(0px, env(safe-area-inset-bottom, 0px))',
    userSelect: 'none',
    boxSizing: 'content-box',
  },
  innerNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
    maxWidth: '540px',
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
    minWidth: '44px',
  },
  iconWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
  },
  navLabel: {
    fontSize: '10.5px',
    letterSpacing: '-0.1px',
    lineHeight: 1,
  },
  actionCol: {
    flex: '1 1 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
  },
  floatingCenterBtn: {
    position: 'absolute',
    top: '-16px',
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    backgroundColor: '#1A2FB8',
    border: '3px solid #FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(26, 47, 184, 0.35)',
    zIndex: 10,
  },
  actionLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#1A2FB8',
    marginTop: '22px',
    letterSpacing: '-0.1px',
  }
};

export default BottomNavigation;
