import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';
import topnavlogo from '../../assets/topnavlogo.png';
import { getSession, clearSession } from '../utils/agentAuth';
import { 
  User, Menu, X, Home, Users, Clock, FileText, 
  Scale, LogOut, Plus, ChevronRight, Shield 
} from 'lucide-react';
import QuickRecordModal from './QuickRecordModal';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(getSession());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);

  useEffect(() => {
    setSession(getSession());

    const handleProfileUpdate = () => setSession(getSession());
    window.addEventListener('agentProfileUpdated', handleProfileUpdate);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.removeEventListener('agentProfileUpdated', handleProfileUpdate);
      clearInterval(timer);
    };
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    return `${dayName}, ${dayNum} ${monthName}`;
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? '0' + minutes : minutes;
    const hourStr = hours < 10 ? '0' + hours : hours;
    return `${hourStr}:${minStr} ${ampm}`;
  };

  const handleLogout = () => {
    if (window.confirm('Log out of Technician Portal?')) {
      clearSession();
      navigate('/login');
    }
  };

  const drawerNavItems = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'My Farmers', path: '/farmers', icon: Users },
    { name: 'Field History', path: '/tests', icon: Clock },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Technician Profile', path: '/profile', icon: User },
  ];

  return (
    <>
      <div className="app-wrapper">
        {/* Desktop Sidebar (Permanent on screens >= 1024px) */}
        <div className="sidebar-container">
          <Sidebar />
        </div>

        {/* Slide-out Mobile & Tablet Drawer (Hamburger Navigation) */}
        {isDrawerOpen && (
          <div 
            className="animate-backdrop-in"
            style={styles.drawerBackdrop}
            onClick={() => setIsDrawerOpen(false)}
          >
            <div 
              className="animate-drawer-in"
              style={styles.drawerContent}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div style={styles.drawerHeader}>
                <img 
                  src={topnavlogo} 
                  alt="Royals Marine" 
                  style={{ height: '36px', maxWidth: '160px', objectFit: 'contain' }} 
                />
                <button 
                  type="button"
                  style={styles.drawerCloseBtn}
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close Navigation"
                >
                  <X size={20} color="#64748B" />
                </button>
              </div>

              {/* Technician User Info */}
              <div style={styles.drawerUserBox}>
                <div style={styles.drawerAvatar}>
                  <User size={20} color="#1A2FB8" strokeWidth={2.4} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={styles.drawerUserName}>{session?.name || 'Technician'}</div>
                  <div style={styles.drawerUserId}>ID: {session?.agentId || 'agent001'}</div>
                </div>
              </div>

              {/* Quick Record Action */}
              <div style={{ padding: '0 16px 14px 16px' }}>
                <button 
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setIsQuickRecordOpen(true);
                  }}
                  style={{ gap: '6px' }}
                >
                  <Plus size={16} strokeWidth={2.6} /> Record Field Entry
                </button>
              </div>

              {/* Drawer Links */}
              <div style={styles.drawerLinksList}>
                {drawerNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                  return (
                    <button
                      key={item.name}
                      type="button"
                      style={{
                        ...styles.drawerLinkBtn,
                        backgroundColor: active ? '#EFF6FF' : 'transparent',
                        color: active ? '#1A2FB8' : '#334155',
                        fontWeight: active ? '700' : '500',
                      }}
                      onClick={() => {
                        setIsDrawerOpen(false);
                        navigate(item.path);
                      }}
                    >
                      <Icon size={18} color={active ? '#1A2FB8' : '#64748B'} strokeWidth={active ? 2.4 : 1.8} />
                      <span style={{ flex: 1, textAlign: 'left' }}>{item.name}</span>
                      <ChevronRight size={14} color={active ? '#1A2FB8' : '#CBD5E1'} />
                    </button>
                  );
                })}
              </div>

              {/* Drawer Footer Logout */}
              <div style={styles.drawerFooter}>
                <button 
                  type="button" 
                  style={styles.drawerLogoutBtn}
                  onClick={handleLogout}
                >
                  <LogOut size={16} color="#DC2626" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Stage View */}
        <div className="main-content">
          {/* Mobile Top Header (< 1024px, only when sidebar is hidden) */}
          <header className="agent-mobile-header">
            <div style={styles.mobileHeaderLeft}>
              <div 
                onClick={() => navigate('/dashboard')} 
                style={styles.mobileLogoContainer}
                title="Royals Marine"
              >
                <img
                  src={topnavlogo}
                  alt="Royals Marine"
                  style={styles.mobileLogoImg}
                />
              </div>
            </div>

            <div style={styles.mobileHeaderRight}>
              {/* Date & Time Compact Badge */}
              <div style={styles.mobileDateTimeBadge}>
                <span style={styles.mobileDateText}>{formatDate(currentTime)}</span>
                <span style={styles.pipeDivider}>|</span>
                <span style={styles.mobileTimeText}>{formatTime(currentTime)}</span>
              </div>

              <button
                type="button"
                style={styles.profileRoundBtn}
                onClick={() => navigate('/profile')}
                title="Profile & Settings"
                aria-label="Profile"
              >
                <User size={17} color="#1A2FB8" strokeWidth={2.4} />
              </button>
            </div>
          </header>

          {/* Desktop Top Header (>= 1024px) */}
          <header className="agent-desktop-header">
            <div style={styles.desktopHeaderRight}>
              <div style={styles.dateTimeRow}>
                <Clock size={13} color="#1A2FB8" />
                <span style={styles.dateText}>{formatDate(currentTime)}</span>
                <span style={styles.pipeDivider}>|</span>
                <span style={styles.timeText}>{formatTime(currentTime)}</span>
              </div>

              <button
                type="button"
                className="transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md cursor-pointer"
                style={styles.profileRoundBtn}
                onClick={() => navigate('/profile')}
                title="Profile & Settings"
                aria-label="Profile"
              >
                <User size={18} color="#1A2FB8" strokeWidth={2.4} />
              </button>
            </div>
          </header>

          {/* Responsive Main Content Stage */}
          <main style={styles.scrollableContentStage}>
            <div className="content-inner animate-fade-in">
              {children}
            </div>
          </main>

          {/* Mobile Bottom Navigation (< 1024px) */}
          <div className="mobile-nav-container">
            <BottomNavigation />
          </div>
        </div>
      </div>

      {/* Global Quick Record Modal accessible from drawer */}
      <QuickRecordModal 
        isOpen={isQuickRecordOpen}
        onClose={() => setIsQuickRecordOpen(false)}
      />
    </>
  );
};

const styles = {
  mobileHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  mobileLogoContainer: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  mobileLogoImg: {
    height: '44px',
    maxWidth: '200px',
    objectFit: 'contain',
    display: 'block',
  },
  mobileHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  mobileDateTimeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '4px 8px',
    borderRadius: '8px',
    fontSize: '11px',
    whiteSpace: 'nowrap',
  },
  mobileDateText: {
    color: '#64748B',
    fontWeight: '500',
  },
  mobileTimeText: {
    color: '#1A2FB8',
    fontWeight: '700',
  },
  desktopHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  technicianBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '6px 12px',
    borderRadius: '10px',
  },
  desktopHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  scrollableContentStage: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    width: '100%',
    position: 'relative',
    boxSizing: 'border-box',
  },
  dateTimeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '6px 12px',
    borderRadius: '10px',
  },
  dateText: {
    color: '#64748B',
    fontWeight: '500',
    fontSize: '13px',
  },
  pipeDivider: {
    color: '#CBD5E1',
    fontWeight: '400',
    userSelect: 'none',
  },
  timeText: {
    color: '#1A2FB8',
    fontWeight: '700',
    fontSize: '13.5px',
  },
  profileRoundBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#EFF6FF',
    border: '1.5px solid #BFDBFE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    flexShrink: 0,
    boxShadow: '0 1px 4px rgba(26, 47, 184, 0.1)',
  },
  drawerBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    zIndex: 99999,
    display: 'flex',
  },
  drawerContent: {
    width: '82%',
    maxWidth: '310px',
    height: '100%',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
    paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
    paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
    boxSizing: 'border-box',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #F1F5F9',
  },
  drawerCloseBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  drawerUserBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: '#F8FAFC',
    margin: '12px 16px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
  },
  drawerAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  drawerUserName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  drawerUserId: {
    fontSize: '11.5px',
    color: '#64748B',
    marginTop: '1px',
  },
  drawerLinksList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  drawerLinkBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '13.5px',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  drawerFooter: {
    padding: '12px 16px 0 16px',
    borderTop: '1px solid #F1F5F9',
  },
  drawerLogoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #FEE2E2',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    fontSize: '13.5px',
    fontWeight: '600',
    cursor: 'pointer',
  }
};

export default Layout;
