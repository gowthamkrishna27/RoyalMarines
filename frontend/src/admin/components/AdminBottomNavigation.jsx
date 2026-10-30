import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Users, MessageSquare, Tractor, BarChart3 } from 'lucide-react';

/**
 * Mobile Bottom Navigation for Admin Portal
 * Provides ergonomic 1-tap thumb navigation on screens < 1024px.
 * Fully responsive, safe-area aware, and visually consistent with Royals Marine design.
 */
const AdminBottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      label: 'Home',
      path: '/admin/dashboard',
      icon: LayoutGrid,
      exactMatch: ['/admin/dashboard', '/admin', '/admin/'],
      matchPrefixes: ['/admin/dashboard/']
    },
    {
      label: 'ASMs',
      path: '/admin/incharges',
      icon: Users,
      exactMatch: ['/admin/incharges'],
      matchPrefixes: ['/admin/incharges/']
    },
    {
      label: 'Follow-ups',
      path: '/admin/follow-ups',
      icon: MessageSquare,
      exactMatch: ['/admin/follow-ups', '/admin/followups'],
      matchPrefixes: ['/admin/follow-ups/', '/admin/followups/']
    },
    {
      label: 'Farmers',
      path: '/admin/farmers',
      icon: Tractor,
      exactMatch: ['/admin/farmers'],
      matchPrefixes: ['/admin/farmers/']
    },
    {
      label: 'Analytics',
      path: '/admin/analytics',
      icon: BarChart3,
      exactMatch: ['/admin/analytics', '/admin/reports', '/admin/export-center'],
      matchPrefixes: ['/admin/analytics/', '/admin/reports/', '/admin/export-center/']
    }
  ];

  const isActive = (item) => {
    const current = (location.pathname || '').toLowerCase();
    if (item.exactMatch && item.exactMatch.some(p => current === p.toLowerCase())) {
      return true;
    }
    if (item.matchPrefixes && item.matchPrefixes.some(p => current.startsWith(p.toLowerCase()))) {
      return true;
    }
    return false;
  };

  return (
    <>
      <style>{`
        .admin-nav-tab-btn {
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

        .admin-nav-tab-btn:active {
          transform: scale(0.92);
        }

        .admin-tab-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3px 12px;
          border-radius: 12px;
          position: relative;
          transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .admin-tab-badge-active {
          background-color: #EFF6FF;
          transform: scale(1) translateY(-1px);
        }

        .admin-tab-badge-inactive {
          background-color: transparent;
          transform: scale(0.95) translateY(0);
        }

        .admin-tab-icon {
          transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .admin-tab-icon-active {
          color: #2563EB;
          transform: scale(1.06);
        }

        .admin-tab-icon-inactive {
          color: #64748B;
          transform: scale(1);
        }

        .admin-tab-label {
          font-size: 10.5px;
          line-height: 1;
          margin-top: 2px;
          letter-spacing: -0.1px;
          transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      font-weight 0.25s ease;
        }

        .admin-tab-label-active {
          color: #2563EB;
          font-weight: 700;
        }

        .admin-tab-label-inactive {
          color: #64748B;
          font-weight: 500;
        }

        .admin-tab-indicator {
          width: 16px;
          height: 2.5px;
          border-radius: 2px;
          margin-top: 2px;
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                      opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .admin-tab-indicator-active {
          background-color: #2563EB;
          opacity: 1;
          transform: scaleX(1);
        }

        .admin-tab-indicator-inactive {
          background-color: transparent;
          opacity: 0;
          transform: scaleX(0.2);
        }
      `}</style>

      <nav style={styles.navContainer} aria-label="Admin Mobile Bottom Navigation">
        <div style={styles.innerNav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <button
                key={item.label}
                type="button"
                className="admin-nav-tab-btn"
                onClick={() => navigate(item.path)}
                aria-label={item.label}
              >
                <div style={styles.tabContent}>
                  <div style={styles.iconSlot}>
                    <div className={`admin-tab-badge ${active ? 'admin-tab-badge-active' : 'admin-tab-badge-inactive'}`}>
                      <Icon
                        size={19}
                        strokeWidth={active ? 2.4 : 1.8}
                        className={`admin-tab-icon ${active ? 'admin-tab-icon-active' : 'admin-tab-icon-inactive'}`}
                      />
                    </div>
                  </div>

                  <span className={`admin-tab-label ${active ? 'admin-tab-label-active' : 'admin-tab-label-inactive'}`}>
                    {item.label}
                  </span>

                  <div className={`admin-tab-indicator ${active ? 'admin-tab-indicator-active' : 'admin-tab-indicator-inactive'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

const styles = {
  navContainer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E2E8F0',
    boxShadow: '0 -4px 20px rgba(15, 23, 42, 0.07)',
    zIndex: 9000,
    paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
    boxSizing: 'border-box'
  },
  innerNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '60px',
    maxWidth: '560px',
    margin: '0 auto',
    padding: '0 8px',
    position: 'relative'
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    userSelect: 'none',
    width: '100%'
  },
  iconSlot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

export default AdminBottomNavigation;
