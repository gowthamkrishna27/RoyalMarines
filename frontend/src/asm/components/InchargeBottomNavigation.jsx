import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Plus, Calendar, FileText } from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getAsmBasePath } from '../utils/asmNavigation';
import QuickRecordModal from '../../agent/components/QuickRecordModal';

const InchargeBottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { db, getAgentsByInchargeId } = useMockData();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const base = getAsmBasePath(location.pathname);

  // Compute live agent alert count for badge indicator
  const inchargeAgents = getAgentsByInchargeId ? getAgentsByInchargeId('INC001') : (db?.agents || []);
  const overdueAgentCount = (inchargeAgents || []).reduce((acc, ag) => {
    const farmers = (db?.farmers || []).filter(f => f.agentId === ag.id);
    const tanks = (db?.tanks || []).filter(t => farmers.some(f => f.id === t.farmerId));
    const hasOverdue = tanks.some(t => t.testStatus === 'Overdue' && t.status !== 'Harvested');
    return acc + (hasOverdue ? 1 : 0);
  }, 0);

  const navItems = [
    { 
      label: 'Home', 
      path: `${base}/dashboard`, 
      icon: Home, 
      match: [`${base}/dashboard`, `${base}`, base] 
    },
    { 
      label: 'Agents', 
      path: `${base}/agents`, 
      icon: Users, 
      badge: overdueAgentCount > 0 ? overdueAgentCount : null,
      match: [`${base}/agents`] 
    },
    { 
      label: 'Record', 
      isAction: true, 
      icon: Plus 
    },
    { 
      label: 'Tests', 
      path: `${base}/weekly-tests`, 
      icon: Calendar, 
      match: [`${base}/weekly-tests`, `${base}/tests`, `${base}/history`] 
    },
    { 
      label: 'Reports', 
      path: `${base}/reports`, 
      icon: FileText, 
      match: [`${base}/reports`, `${base}/export-data`] 
    },
  ];

  const isActive = (item) => {
    if (!item.match) return false;
    const current = location.pathname.toLowerCase();
    if (item.label === 'Home' && (current === base.toLowerCase() || current === `${base.toLowerCase()}/` || current === `${base.toLowerCase()}/dashboard`)) {
      return true;
    }
    return item.match.some(p => {
      const target = p.toLowerCase();
      return current === target || current.startsWith(target + '/');
    });
  };

  return (
    <>
      <style>{`
        /* Smooth continuous transitions for nav items */
        .asm-nav-tab-btn {
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

        .asm-nav-tab-btn:active {
          transform: scale(0.91);
        }

        /* Smooth badge spring transition */
        .asm-tab-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3px 12px;
          border-radius: 12px;
          position: relative;
          transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.3s ease;
        }

        .asm-tab-badge-active {
          background-color: #EEF2FF;
          transform: scale(1) translateY(-1px);
        }

        .asm-tab-badge-inactive {
          background-color: transparent;
          transform: scale(0.94) translateY(0);
        }

        /* Smooth icon scale & color transition */
        .asm-tab-icon {
          transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      fill 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .asm-tab-icon-active {
          color: #1A2FB8;
          transform: scale(1.06);
        }

        .asm-tab-icon-inactive {
          color: #64748B;
          transform: scale(1);
        }

        /* Smooth typography & weight transition */
        .asm-tab-label {
          font-size: 10.5px;
          line-height: 1;
          margin-top: 2px;
          letter-spacing: -0.1px;
          transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      font-weight 0.25s ease,
                      transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .asm-tab-label-active {
          color: #1A2FB8;
          font-weight: 700;
          transform: translateY(-0.5px);
        }

        .asm-tab-label-inactive {
          color: #64748B;
          font-weight: 500;
          transform: translateY(0);
        }

        /* Indicator pill */
        .asm-tab-indicator {
          width: 16px;
          height: 2.5px;
          border-radius: 2px;
          margin-top: 2px;
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                      opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                      background-color 0.3s ease;
        }

        .asm-tab-indicator-active {
          background-color: #1A2FB8;
          opacity: 1;
          transform: scaleX(1);
        }

        .asm-tab-indicator-inactive {
          background-color: transparent;
          opacity: 0;
          transform: scaleX(0.2);
        }

        /* Center FAB pulse & smooth spring interactions */
        @keyframes asmFabHaloPulse {
          0%, 100% {
            box-shadow: 0 6px 18px rgba(37, 99, 235, 0.4), 0 0 0 0 rgba(37, 99, 235, 0.2);
          }
          50% {
            box-shadow: 0 8px 22px rgba(37, 99, 235, 0.52), 0 0 0 5px rgba(37, 99, 235, 0.12);
          }
        }

        .asm-center-fab-btn {
          animation: asmFabHaloPulse 3.2s infinite ease-in-out;
          transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.28s ease;
        }

        .asm-center-fab-btn:hover {
          transform: translateY(-12px) scale(1.06);
        }

        .asm-center-fab-btn:active {
          transform: translateY(-4px) scale(0.92) !important;
        }

        .asm-center-plus-icon {
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .asm-center-fab-btn:hover .asm-center-plus-icon {
          transform: rotate(90deg);
        }
      `}</style>

      <nav style={styles.navContainer} aria-label="ASM Mobile Bottom Navigation">
        <div style={styles.innerNav}>
          {navItems.map((item) => {
            if (item.isAction) {
              return (
                <div key="action-record" style={styles.centerActionCol}>
                  <button
                    type="button"
                    className="asm-center-fab-btn"
                    style={styles.floatingCenterBtn}
                    onClick={() => setIsRecordModalOpen(true)}
                    aria-label="New Field Record / Verification"
                    title="New Field Record / Verification"
                  >
                    <Plus 
                      size={22} 
                      color="#FFFFFF" 
                      strokeWidth={2.8} 
                      className="asm-center-plus-icon"
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
                className="asm-nav-tab-btn"
                onClick={() => navigate(item.path)}
                aria-label={item.label}
              >
                <div style={styles.tabContent}>
                  {/* Icon slot */}
                  <div style={styles.iconSlot}>
                    <div className={`asm-tab-badge ${active ? 'asm-tab-badge-active' : 'asm-tab-badge-inactive'}`}>
                      <Icon 
                        size={19} 
                        strokeWidth={active ? 2.4 : 1.8} 
                        className={`asm-tab-icon ${active ? 'asm-tab-icon-active' : 'asm-tab-icon-inactive'}`}
                        fill={active && item.label === 'Home' ? '#1A2FB8' : 'none'}
                      />
                      {item.badge && (
                        <span style={styles.tabAlertBadge}>{item.badge}</span>
                      )}
                    </div>
                  </div>

                  {/* Label */}
                  <span className={`asm-tab-label ${active ? 'asm-tab-label-active' : 'asm-tab-label-inactive'}`}>
                    {item.label}
                  </span>

                  {/* Active Indicator Bar */}
                  <div className={`asm-tab-indicator ${active ? 'asm-tab-indicator-active' : 'asm-tab-indicator-inactive'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Global Quick Record Modal for ASM */}
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
    maxWidth: '390px',
    height: '54px',
    backgroundColor: '#FFFFFF',
    borderRadius: '27px',
    boxShadow: '0 8px 26px -2px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04)',
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
    position: 'relative',
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
  tabAlertBadge: {
    position: 'absolute',
    top: '-3px',
    right: '2px',
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    fontSize: '9px',
    fontWeight: '800',
    minWidth: '15px',
    height: '15px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 3px',
    border: '1.5px solid #FFFFFF',
  },
};

export default InchargeBottomNavigation;
