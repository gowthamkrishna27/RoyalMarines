import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import InchargeSidebar from './InchargeSidebar';
import InchargeBottomNavigation from './InchargeBottomNavigation';
import topnavlogo from '../../assets/topnavlogo.png';
import { getInchargeSession, logoutIncharge } from '../utils/inchargeAuth';
import { getAsmBasePath } from '../utils/asmNavigation';
import { 
  Shield, Menu, X, Home, Users, Calendar, FileText, 
  UserCheck, LogOut, Plus, ChevronRight, Bell, CheckCheck, AlertTriangle, Eye, Scale
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import QuickRecordModal from '../../agent/components/QuickRecordModal';

export const InchargeNavContext = createContext({
  isMobileSidebarOpen: false,
  toggleMobileSidebar: () => {},
  closeMobileSidebar: () => {}
});

export const useInchargeNav = () => useContext(InchargeNavContext);

const InchargeLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { db, markNotificationRead, markAllNotificationsRead, getAgentsByInchargeId } = useMockData();
  const [session, setSession] = useState(getInchargeSession());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);
  const [selectedTankForQuickRecord, setSelectedTankForQuickRecord] = useState(null);
  const [selectedTypeForQuickRecord, setSelectedTypeForQuickRecord] = useState('WATER_QUALITY');

  const base = getAsmBasePath(location.pathname);
  const inchargeId = session?.inchargeId || session?.agentId || 'INC001';

  // Incharge notifications: verifications and agent alerts
  const inchargeNotifications = (db?.notifications || []).filter(n => 
    !n.agentId || n.agentId === inchargeId || n.targetRole === 'ASM' || n.targetRole === 'INCHARGE'
  );
  const unreadCount = inchargeNotifications.filter(n => !n.read).length;

  useEffect(() => {
    setSession(getInchargeSession());

    const handleProfileUpdate = () => setSession(getInchargeSession());
    window.addEventListener('inchargeProfileUpdated', handleProfileUpdate);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.removeEventListener('inchargeProfileUpdated', handleProfileUpdate);
      clearInterval(timer);
    };
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    return `${dayName} ${dayNum} ${monthName}`;
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
    if (window.confirm('Log out of Area Sales Manager (ASM) Portal?')) {
      logoutIncharge();
      navigate('/login');
    }
  };

  const drawerNavItems = [
    { name: 'Home', path: `${base}/dashboard`, icon: Home },
    { name: 'My Agents', path: `${base}/agents`, icon: Users },
    { name: 'My Farmers', path: `${base}/my-farmers`, icon: UserCheck },
    { name: 'Harvest Management', path: `${base}/harvest`, icon: Scale },
    { name: 'Weekly Tests', path: `${base}/weekly-tests`, icon: Calendar },
    { name: 'Reports', path: `${base}/reports`, icon: FileText },
    { name: 'ASM Settings', path: `${base}/settings`, icon: Shield },
  ];

  return (
    <InchargeNavContext.Provider value={{ 
      isMobileSidebarOpen: isDrawerOpen, 
      toggleMobileSidebar: () => setIsDrawerOpen(prev => !prev), 
      closeMobileSidebar: () => setIsDrawerOpen(false) 
    }}>
      <div className="app-wrapper">
        {/* Desktop Sidebar (Permanent on screens >= 1024px) */}
        <div className="sidebar-container">
          <InchargeSidebar />
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

              {/* ASM Manager User Info */}
              <div style={styles.drawerUserBox}>
                <div style={styles.drawerAvatar}>
                  <Shield size={20} color="#1A2FB8" strokeWidth={2.4} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={styles.drawerUserName}>{session?.name || 'Regional Manager'}</div>
                  <div style={styles.drawerRoleRow}>
                    <span style={styles.drawerRoleBadge}>ASM</span>
                    <span style={styles.drawerUserId}>ID: {inchargeId}</span>
                  </div>
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
                  const active = location.pathname === item.path || (item.path !== `${base}/dashboard` && location.pathname.startsWith(item.path));
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
          {/* Mobile Top Header (< 1024px) */}
          <header className="agent-mobile-header">
            <div style={styles.mobileHeaderLeft}>
              <button
                type="button"
                style={styles.hamburgerBtn}
                onClick={() => setIsDrawerOpen(true)}
                aria-label="Open Navigation Menu"
              >
                <Menu size={20} color="#0F172A" />
              </button>
              <div 
                onClick={() => navigate(`${base}/dashboard`)} 
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
              {/* Live Date & Time Compact Badge */}
              <div style={styles.mobileDateTimeBadge}>
                <span style={styles.mobileDateText}>{formatDate(currentTime)}</span>
                <span style={styles.pipeDivider}>|</span>
                <span style={styles.mobileTimeText}>{formatTime(currentTime)}</span>
              </div>

              {/* Notification Button */}
              <button
                type="button"
                style={styles.headerIconBtn}
                onClick={() => setIsNotificationDrawerOpen(true)}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={17} color="#334155" />
                {unreadCount > 0 && <span style={styles.unreadBadgeDot} />}
              </button>

              {/* User Profile Button */}
              <button
                type="button"
                style={styles.profileRoundBtn}
                onClick={() => navigate(`${base}/settings`)}
                title="ASM Profile & Settings"
                aria-label="Profile"
              >
                <Shield size={16} color="#1A2FB8" strokeWidth={2.4} />
              </button>
            </div>
          </header>

          {/* Desktop Top Header (>= 1024px) */}
          <header className="agent-desktop-header">
            <div style={styles.desktopHeaderRight}>
              <div style={styles.dateTimeRow}>
                <span style={styles.dateText}>{formatDate(currentTime)}</span>
                <span style={styles.pipeDivider}>|</span>
                <span style={styles.timeText}>{formatTime(currentTime)}</span>
              </div>

              {/* Notification Button */}
              <button
                type="button"
                style={styles.headerIconBtn}
                onClick={() => setIsNotificationDrawerOpen(true)}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={18} color="#334155" />
                {unreadCount > 0 && <span style={styles.unreadBadgeDot} />}
              </button>

              {/* Profile Round Button */}
              <button
                type="button"
                className="transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md cursor-pointer"
                style={styles.profileRoundBtn}
                onClick={() => navigate(`${base}/settings`)}
                title="ASM Profile & Settings"
                aria-label="Profile"
              >
                <Shield size={17} color="#1A2FB8" strokeWidth={2.4} />
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
            <InchargeBottomNavigation />
          </div>
        </div>
      </div>

      {/* Global Quick Record Modal */}
      <QuickRecordModal 
        isOpen={isQuickRecordOpen}
        onClose={() => setIsQuickRecordOpen(false)}
        preselectedTankId={selectedTankForQuickRecord}
        initialType={selectedTypeForQuickRecord}
      />

      {/* Slide-out Notification Drawer */}
      {isNotificationDrawerOpen && (
        <div 
          className="animate-backdrop-in"
          style={styles.drawerBackdrop}
          onClick={() => setIsNotificationDrawerOpen(false)}
        >
          <div 
            className="animate-drawer-in"
            style={{ ...styles.drawerContent, width: '100%', maxWidth: '380px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Notification Drawer Header */}
            <div style={styles.drawerHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={styles.notifIconCircle}>
                  <Bell size={16} color="#1A2FB8" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>Notifications</div>
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                    {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    style={styles.markAllReadBtn}
                    onClick={() => markAllNotificationsRead(inchargeId)}
                    title="Mark all as read"
                  >
                    <CheckCheck size={13} />
                    <span>Mark read</span>
                  </button>
                )}
                <button 
                  type="button" 
                  style={styles.drawerCloseBtn}
                  onClick={() => setIsNotificationDrawerOpen(false)}
                >
                  <X size={18} color="#64748B" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {inchargeNotifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94A3B8' }}>
                  <Bell size={32} color="#CBD5E1" style={{ margin: '0 auto 12px auto' }} />
                  <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#64748B' }}>No notifications yet</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Agent field updates and overdue alerts will appear here</div>
                </div>
              ) : (
                inchargeNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      ...styles.notificationCard,
                      backgroundColor: notif.read ? '#FFFFFF' : '#F0F5FF',
                      borderColor: notif.read ? '#E2E8F0' : '#BFDBFE',
                    }}
                    onClick={() => markNotificationRead(notif.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          ...styles.notifTypeBadge,
                          backgroundColor: notif.type === 'warning' ? '#FEF3C7' : '#EFF6FF',
                          color: notif.type === 'warning' ? '#B45309' : '#1D4ED8',
                        }}>
                          {notif.type === 'warning' ? 'Agent Overdue Alert' : 'Notice'}
                        </span>
                        {!notif.read && <span style={styles.unreadDot} />}
                      </div>
                      <span style={styles.notifTime}>{notif.time || notif.date || 'Recent'}</span>
                    </div>

                    <div style={styles.notifMessage}>{notif.message}</div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        type="button"
                        style={styles.notifActionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationRead(notif.id);
                          setIsNotificationDrawerOpen(false);
                          navigate(`${base}/agents`);
                        }}
                      >
                        <Eye size={13} strokeWidth={2.5} />
                        <span>Observe Agent</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </InchargeNavContext.Provider>
  );
};

const styles = {
  mobileHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  hamburgerBtn: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  mobileLogoContainer: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  mobileLogoImg: {
    height: '30px',
    maxWidth: '125px',
    objectFit: 'contain',
    display: 'block',
  },
  mobileHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  mobileDateTimeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '0 10px',
    height: '32px',
    borderRadius: '20px',
    fontSize: '11px',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  mobileDateText: {
    color: '#64748B',
    fontWeight: '500',
    fontSize: '11px',
    lineHeight: '1',
    whiteSpace: 'nowrap',
  },
  mobileTimeText: {
    color: '#1A2FB8',
    fontWeight: '700',
    fontSize: '11.5px',
    lineHeight: '1',
    whiteSpace: 'nowrap',
  },
  desktopHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
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
  headerIconBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.15s ease',
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: '7px',
    right: '7px',
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#DC2626',
    border: '1.5px solid #FFFFFF',
  },
  profileRoundBtn: {
    width: '36px',
    height: '36px',
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
  scrollableContentStage: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    width: '100%',
    position: 'relative',
    boxSizing: 'border-box',
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
  drawerRoleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '2px',
  },
  drawerRoleBadge: {
    fontSize: '9.5px',
    fontWeight: '800',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    padding: '1px 5px',
    borderRadius: '4px',
  },
  drawerUserId: {
    fontSize: '11px',
    color: '#64748B',
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
  },
  notifIconCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  markAllReadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#F1F5F9',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    padding: '5px 8px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
  },
  notificationCard: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    transition: 'all 0.15s ease',
  },
  notifTypeBadge: {
    fontSize: '10.5px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  unreadDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#2563EB',
    display: 'inline-block',
  },
  notifTime: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '500',
  },
  notifMessage: {
    fontSize: '12.5px',
    color: '#334155',
    lineHeight: 1.45,
    fontWeight: '500',
  },
  notifActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  }
};

export default InchargeLayout;
