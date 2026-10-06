import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Plus, Clock, FileText } from 'lucide-react';
import QuickRecordModal from './QuickRecordModal';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const navItems = [
    { 
      label: 'Home', 
      path: '/dashboard', 
      icon: Home, 
      exactMatch: [
        '/dashboard', 
        '/technician', 
        '/technician/dashboard', 
        '/agent', 
        '/agent/dashboard', 
        '/', 
        '/home'
      ],
      matchPrefixes: [
        '/dashboard/', 
        '/technician/dashboard/', 
        '/agent/dashboard/'
      ] 
    },
    { 
      label: 'Farmers', 
      path: '/farmers', 
      icon: Users, 
      exactMatch: [
        '/farmers', 
        '/technician/farmers', 
        '/add-farmer', 
        '/agent/farmers'
      ],
      matchPrefixes: [
        '/farmers/', 
        '/technician/farmers/', 
        '/agent/farmers/'
      ] 
    },
    { 
      label: 'Record', 
      isAction: true, 
      icon: Plus 
    },
    { 
      label: 'History', 
      path: '/tests', 
      icon: Clock, 
      exactMatch: [
        '/tests', 
        '/history', 
        '/agent/tests', 
        '/agent/history', 
        '/technician/tests', 
        '/technician/history', 
        '/weekly-tests'
      ],
      matchPrefixes: [
        '/tests/', 
        '/history/', 
        '/agent/tests/', 
        '/agent/history/', 
        '/technician/tests/', 
        '/technician/history/', 
        '/weekly-tests/'
      ] 
    },
    { 
      label: 'Reports', 
      path: '/reports', 
      icon: FileText, 
      exactMatch: [
        '/reports', 
        '/agent/reports', 
        '/technician/reports', 
        '/analytics', 
        '/my-analytics'
      ],
      matchPrefixes: [
        '/reports/', 
        '/agent/reports/', 
        '/technician/reports/', 
        '/analytics/', 
        '/my-analytics/'
      ] 
    },
  ];

  const isActive = (item) => {
    if (item.isAction) return false;
    const current = (location.pathname || '').toLowerCase();
    
    // 1. Direct exact matches
    if (item.exactMatch && item.exactMatch.some(p => current === p.toLowerCase())) {
      return true;
    }

    // 2. Sub-route prefix matches
    if (item.matchPrefixes && item.matchPrefixes.some(p => current.startsWith(p.toLowerCase()))) {
      return true;
    }

    return false;
  };

  return (
    <>
      <style>{`
        /* Smooth continuous transitions for nav items */
        .nav-tab-btn {
          flex: 1 1 0;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          cursor: pointer;
          outline: none;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          -webkit-tap-highlight-color: transparent;
        }

        .nav-tab-btn:active {
          transform: scale(0.91);
        }

        /* Smooth badge spring transition */
        .tab-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3px 12px;
          border-radius: 12px;
          transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.3s ease;
        }

        .tab-badge-active {
          background-color: #EEF2FF;
          transform: scale(1) translateY(-1px);
        }

        .tab-badge-inactive {
          background-color: transparent;
          transform: scale(0.94) translateY(0);
        }

        /* Smooth icon scale & color transition */
        .tab-icon {
          transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      fill 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .tab-icon-active {
          color: #1A2FB8;
          transform: scale(1.06);
        }

        .tab-icon-inactive {
          color: #64748B;
          transform: scale(1);
        }

        /* Smooth typography & weight transition */
        .tab-label {
          font-size: 10.5px;
          line-height: 1;
          margin-top: 2px;
          letter-spacing: -0.1px;
          transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      font-weight 0.25s ease,
                      transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .tab-label-active {
          color: #1A2FB8;
          font-weight: 700;
          transform: translateY(-0.5px);
        }

        .tab-label-inactive {
          color: #64748B;
          font-weight: 500;
          transform: translateY(0);
        }

        /* Smooth indicator pill expand & collapse transition */
        .tab-indicator {
          width: 16px;
          height: 2.5px;
          border-radius: 2px;
          margin-top: 2px;
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                      opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                      background-color 0.3s ease;
        }

        .tab-indicator-active {
          background-color: #1A2FB8;
          opacity: 1;
          transform: scaleX(1);
        }

        .tab-indicator-inactive {
          background-color: transparent;
          opacity: 0;
          transform: scaleX(0.2);
        }

        /* Center FAB pulse & smooth spring interactions */
        @keyframes fabHaloPulse {
          0%, 100% {
            box-shadow: 0 6px 18px rgba(37, 99, 235, 0.4), 0 0 0 0 rgba(37, 99, 235, 0.2);
          }
          50% {
            box-shadow: 0 8px 22px rgba(37, 99, 235, 0.52), 0 0 0 5px rgba(37, 99, 235, 0.12);
          }
        }

        .center-fab-btn {
          animation: fabHaloPulse 3.2s infinite ease-in-out;
          transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.28s ease;
        }

        .center-fab-btn:hover {
          transform: translateY(-12px) scale(1.06);
        }

        .center-fab-btn:active {
          transform: translateY(-4px) scale(0.92) !important;
        }

        .center-plus-icon {
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .center-fab-btn:hover .center-plus-icon {
          transform: rotate(90deg);
        }
      `}</style>

      <nav style={styles.navContainer} aria-label="Mobile Bottom Navigation">
        <div style={styles.innerNav}>
          {navItems.map((item) => {
            if (item.isAction) {
              return (
                <div key="action-record" style={styles.centerActionCol}>
                  <button
                    type="button"
                    className="center-fab-btn"
                    style={styles.floatingCenterBtn}
                    onClick={() => setIsRecordModalOpen(true)}
                    aria-label="Add Test Record"
                    title="Add Test Record"
                  >
                    <Plus 
                      size={22} 
                      color="#FFFFFF" 
                      strokeWidth={2.8} 
                      className="center-plus-icon"
                    />
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
                className="nav-tab-btn"
                onClick={() => navigate(item.path)}
                aria-label={item.label}
              >
                <div style={styles.tabContent}>
                  {/* Icon slot */}
                  <div style={styles.iconSlot}>
                    <div className={`tab-badge ${active ? 'tab-badge-active' : 'tab-badge-inactive'}`}>
                      <Icon 
                        size={19} 
                        strokeWidth={active ? 2.4 : 1.8} 
                        className={`tab-icon ${active ? 'tab-icon-active' : 'tab-icon-inactive'}`}
                        fill={active && item.label === 'Home' ? '#1A2FB8' : 'none'}
                      />
                    </div>
                  </div>

                  {/* Label */}
                  <span className={`tab-label ${active ? 'tab-label-active' : 'tab-label-inactive'}`}>
                    {item.label}
                  </span>

                  {/* Active Indicator Bar */}
                  <div className={`tab-indicator ${active ? 'tab-indicator-active' : 'tab-indicator-inactive'}`} />
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
    bottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
    left: '0',
    right: '0',
    marginLeft: 'auto',
    marginRight: 'auto',
    width: 'calc(100% - 24px)',
    maxWidth: '380px',
    height: '54px',
    backgroundColor: '#FFFFFF',
    borderRadius: '27px',
    boxShadow: '0 8px 26px -2px rgba(15, 23, 42, 0.09), 0 2px 6px rgba(15, 23, 42, 0.04)',
    border: '1px solid rgba(226, 232, 240, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    userSelect: 'none',
    boxSizing: 'border-box',
  },
  innerNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    padding: '0 8px',
    boxSizing: 'border-box',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    position: 'relative',
  },
  iconSlot: {
    height: '25px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerActionCol: {
    flex: '1 1 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  floatingCenterBtn: {
    position: 'absolute',
    top: '-8px',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2563EB 0%, #1A2FB8 100%)',
    border: '3.5px solid #FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10,
    outline: 'none',
  },
};

export default BottomNavigation;
