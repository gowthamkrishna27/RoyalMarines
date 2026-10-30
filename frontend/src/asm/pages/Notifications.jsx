import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import InchargeHeader from '../components/InchargeHeader';
import { getInchargeSession } from '../utils/inchargeAuth';
import { getAsmBasePath } from '../utils/asmNavigation';
import { useMockData } from '../../context/MockDataContext';
import { 
  Bell, CheckCheck, Eye, MessageSquare, Search, Filter, 
  Calendar, Clock, CheckCircle2, AlertTriangle, Info, ArrowRight
} from 'lucide-react';

const Notifications = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getInchargeSession();
  const base = getAsmBasePath(location.pathname);
  const inchargeId = session?.inchargeId || session?.agentId || 'INC001';

  const { db, markNotificationRead, markAllNotificationsRead } = useMockData();
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [searchQuery, setSearchQuery] = useState('');

  // Territory notifications: alerts for this incharge or assigned agents
  const inchargeAgentIds = (db?.agents || [])
    .filter(ag => (ag.inchargeId || ag.incharge_id) === inchargeId)
    .map(ag => ag.id);

  const inchargeNotifications = (db?.notifications || []).filter(n => 
    !n.agentId || 
    n.agentId === inchargeId || 
    n.userId === inchargeId || 
    inchargeAgentIds.includes(n.agentId) ||
    inchargeAgentIds.includes(n.userId) ||
    n.targetRole === 'ASM' || 
    n.targetRole === 'INCHARGE' ||
    n.target_role === 'ASM' || 
    n.target_role === 'INCHARGE' ||
    n.target_role === 'ALL'
  );

  const isNotificationRead = (n) => Boolean(n.read || n.isRead || n.is_read);

  const unreadCount = inchargeNotifications.filter(n => !isNotificationRead(n)).length;

  const filteredNotifications = inchargeNotifications.filter(n => {
    if (filterTab === 'UNREAD' && isNotificationRead(n)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (n.title || '').toLowerCase().includes(q);
      const matchMsg = (n.message || '').toLowerCase().includes(q);
      return matchTitle || matchMsg;
    }
    return true;
  });

  return (
    <div>
      <InchargeHeader title="Notifications" showBack={false} />

      <div className="content-inner" style={styles.container}>
        {/* Top Control Bar */}
        <div style={styles.topBar}>
          <div style={styles.headerLeft}>
            <div style={styles.iconCircle}>
              <Bell size={22} color="#1A2FB8" />
            </div>
            <div>
              <div style={styles.pageTitleRow}>
                <h1 style={styles.pageTitle}>Notifications & Alerts</h1>
                {unreadCount > 0 && (
                  <span style={styles.unreadCountBadge}>
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p style={styles.subTitle}>
                Real-time supervisor directives, weekly testing alerts, and agent activity updates.
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              style={styles.markAllReadBtn}
              onClick={() => markAllNotificationsRead(inchargeId)}
            >
              <CheckCheck size={16} />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div style={styles.filterRow}>
          <div style={styles.tabGroup}>
            <button
              type="button"
              style={{
                ...styles.tabBtn,
                backgroundColor: filterTab === 'ALL' ? '#1A2FB8' : '#F1F5F9',
                color: filterTab === 'ALL' ? '#FFFFFF' : '#475569',
              }}
              onClick={() => setFilterTab('ALL')}
            >
              All ({inchargeNotifications.length})
            </button>
            <button
              type="button"
              style={{
                ...styles.tabBtn,
                backgroundColor: filterTab === 'UNREAD' ? '#1A2FB8' : '#F1F5F9',
                color: filterTab === 'UNREAD' ? '#FFFFFF' : '#475569',
              }}
              onClick={() => setFilterTab('UNREAD')}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <div style={styles.searchWrapper}>
            <Search size={16} color="#94A3B8" style={{ marginLeft: '12px' }} />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Notifications List */}
        <div style={styles.listContainer}>
          {filteredNotifications.length === 0 ? (
            <div style={styles.emptyCard}>
              <div style={styles.emptyIconCircle}>
                <Bell size={36} color="#94A3B8" />
              </div>
              <h3 style={styles.emptyTitle}>
                {filterTab === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p style={styles.emptyText}>
                {filterTab === 'UNREAD'
                  ? 'All caught up! You have addressed all alerts for your territory.'
                  : 'Agent field submissions, pond testing compliance alerts, and supervisor follow-ups will appear here.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isWarning = notif.type === 'warning';
              const isRead = isNotificationRead(notif);

              return (
                <div
                  key={notif.id}
                  style={{
                    ...styles.notifCard,
                    backgroundColor: isRead ? '#FFFFFF' : '#F0F5FF',
                    borderColor: isRead ? '#E2E8F0' : '#BFDBFE',
                  }}
                  onClick={() => markNotificationRead(notif.id)}
                >
                  <div style={styles.notifTopRow}>
                    <div style={styles.badgeGroup}>
                      <span
                        style={{
                          ...styles.typeBadge,
                          backgroundColor: isWarning ? '#FEF3C7' : '#EFF6FF',
                          color: isWarning ? '#B45309' : '#1D4ED8',
                        }}
                      >
                        {isWarning ? 'Compliance Alert' : (notif.title || 'Notice')}
                      </span>
                      {!isRead && (
                        <span style={styles.unreadPill}>NEW</span>
                      )}
                    </div>
                    <div style={styles.timeInfo}>
                      <Clock size={12} color="#94A3B8" />
                      <span>{notif.time || notif.date || 'Recent'}</span>
                    </div>
                  </div>

                  <div style={styles.notifBody}>
                    <div style={styles.notifTitle}>{notif.title || 'Notice'}</div>
                    <div style={styles.notifMessage}>{notif.message}</div>
                  </div>

                  <div style={styles.notifFooter}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        style={styles.actionBtnPrimary}
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationRead(notif.id);
                          navigate(`${base}/follow-ups`);
                        }}
                      >
                        <MessageSquare size={14} />
                        <span>View Follow-ups</span>
                      </button>

                      <button
                        type="button"
                        style={styles.actionBtnSecondary}
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationRead(notif.id);
                          navigate(`${base}/agents`);
                        }}
                      >
                        <Eye size={14} />
                        <span>Inspect Field Work</span>
                      </button>
                    </div>

                    {!isRead && (
                      <button
                        type="button"
                        style={styles.markReadTextBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationRead(notif.id);
                        }}
                      >
                        <CheckCheck size={13} />
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: 'clamp(16px, 3vw, 24px)',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '20px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  iconCircle: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    backgroundColor: '#EEF2FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pageTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  pageTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  unreadCountBadge: {
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  subTitle: {
    fontSize: '13px',
    color: '#64748B',
    margin: '4px 0 0 0',
  },
  markAllReadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#1E293B',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  filterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '20px',
  },
  tabGroup: {
    display: 'flex',
    gap: '8px',
  },
  tabBtn: {
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '300px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    padding: '8px 12px',
    fontSize: '13px',
    backgroundColor: 'transparent',
    width: '100%',
    color: '#0F172A',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  notifCard: {
    padding: '16px 18px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'all 0.15s ease',
  },
  notifTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  typeBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  unreadPill: {
    fontSize: '10px',
    fontWeight: '800',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    padding: '2px 6px',
    borderRadius: '4px',
    letterSpacing: '0.5px',
  },
  timeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: '500',
  },
  notifBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  notifTitle: {
    fontSize: '14.5px',
    fontWeight: '700',
    color: '#0F172A',
  },
  notifMessage: {
    fontSize: '13.5px',
    color: '#334155',
    lineHeight: 1.5,
  },
  notifFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '4px',
    paddingTop: '10px',
    borderTop: '1px solid rgba(226, 232, 240, 0.6)',
  },
  actionBtnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  actionBtnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  markReadTextBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    color: '#64748B',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '4px 6px',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    border: '1px dashed #CBD5E1',
    borderRadius: '16px',
    padding: '56px 20px',
    textAlign: 'center',
  },
  emptyIconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1E293B',
    margin: '0 0 6px 0',
  },
  emptyText: {
    fontSize: '13px',
    color: '#64748B',
    maxWidth: '420px',
    margin: '0 auto',
    lineHeight: 1.5,
  },
};

export default Notifications;
