import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Users, Plus, Calendar, FileText, UserCheck, 
  Settings, LogOut, Shield, ChevronRight, Layers, Eye, Scale
} from 'lucide-react';
import { logoutIncharge, getInchargeSession } from '../utils/inchargeAuth';
import { getAsmBasePath } from '../utils/asmNavigation';
import { useMockData } from '../../context/MockDataContext';
import QuickRecordModal from '../../agent/components/QuickRecordModal';
import topnavlogo from '../../assets/topnavlogo.png';

const InchargeSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getInchargeSession();
  const { db, getAgentsByInchargeId } = useMockData();
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);

  const base = getAsmBasePath(location.pathname);

  // Compute live agent alert count
  const inchargeAgents = getAgentsByInchargeId ? getAgentsByInchargeId('INC001') : (db?.agents || []);
  const overdueAgentCount = (inchargeAgents || []).reduce((acc, ag) => {
    const farmers = (db?.farmers || []).filter(f => f.agentId === ag.id);
    const tanks = (db?.tanks || []).filter(t => farmers.some(f => f.id === t.farmerId));
    const hasOverdue = tanks.some(t => t.testStatus === 'Overdue' && t.status !== 'Harvested');
    return acc + (hasOverdue ? 1 : 0);
  }, 0);

  const handleLogout = () => {
    if (window.confirm('Log out of Area Sales Manager (ASM) Portal?')) {
      logoutIncharge();
      navigate('/login');
    }
  };

  const navItems = [
    { 
      name: 'Home', 
      path: `${base}/dashboard`, 
      icon: Home, 
      match: [`${base}/dashboard`, `${base}`, base] 
    },
    { 
      name: 'My Agents', 
      path: `${base}/agents`, 
      icon: Users, 
      badge: overdueAgentCount > 0 ? `${overdueAgentCount} Due` : null,
      match: [`${base}/agents`] 
    },
    { 
      name: 'My Farmers', 
      path: `${base}/my-farmers`, 
      icon: UserCheck, 
      match: [`${base}/my-farmers`, `${base}/farmers`, `${base}/add-farmer`] 
    },
    { 
      name: 'Harvest', 
      path: `${base}/harvest`, 
      icon: Scale, 
      match: [`${base}/harvest`] 
    },
    { 
      name: 'Weekly Tests', 
      path: `${base}/weekly-tests`, 
      icon: Calendar, 
      match: [`${base}/weekly-tests`, `${base}/tests`, `${base}/history`] 
    },
    { 
      name: 'Reports', 
      path: `${base}/reports`, 
      icon: FileText, 
      match: [`${base}/reports`, `${base}/export-data`] 
    },
    { 
      name: 'Settings', 
      path: `${base}/settings`, 
      icon: Settings, 
      match: [`${base}/settings`, `${base}/profile`] 
    },
  ];

  const isItemActive = (item) => {
    const current = location.pathname.toLowerCase();
    if (item.name === 'Home' && (current === base.toLowerCase() || current === `${base.toLowerCase()}/` || current === `${base.toLowerCase()}/dashboard`)) {
      return true;
    }
    return item.match.some(p => {
      const target = p.toLowerCase();
      return current === target || current.startsWith(target + '/');
    });
  };

  return (
    <>
      <aside style={styles.sidebar}>
        {/* 1. Brand Header */}
        <div style={styles.brandHeader} onClick={() => navigate(`${base}/dashboard`)} title="Royals Marine">
          <img src={topnavlogo} alt="Royals Marine" style={styles.brandLogoImg} />
        </div>

        {/* 2. Primary Action Buttons: Record & Harvest (Identical to Agent) */}
        <div style={styles.actionSection}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              className="transition-all duration-200 hover:brightness-110 active:scale-98 cursor-pointer"
              style={styles.quickRecordBtn}
              onClick={() => setIsQuickRecordOpen(true)}
              aria-label="New Field Record"
            >
              <Plus size={14} strokeWidth={2.5} /> Record
            </button>

            <button 
              className="transition-all duration-200 hover:brightness-105 active:scale-98 cursor-pointer"
              style={styles.harvestSideBtn}
              onClick={() => navigate(`${base}/harvest`)}
              aria-label="Harvest Management"
            >
              <Scale size={14} strokeWidth={2.4} /> Harvest
            </button>
          </div>
        </div>

        {/* 3. Core Navigation Links */}
        <nav style={styles.navMenu}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className="transition-all duration-150 hover:bg-slate-50 active:scale-98"
                style={{
                  ...styles.navLink,
                  backgroundColor: active ? '#EFF6FF' : 'transparent',
                  color: active ? '#1A2FB8' : '#475569',
                  fontWeight: active ? '700' : '500',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <Icon size={18} color={active ? '#1A2FB8' : '#64748B'} strokeWidth={active ? 2.5 : 1.8} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span style={styles.navBadge}>{item.badge}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* 4. Footer with Manager Profile Card & Logout */}
        <div style={styles.footerSection}>
          <div 
            style={styles.profileCard}
            onClick={() => navigate(`${base}/settings`)}
            title="View Profile & Settings"
          >
            <div style={styles.profileAvatar}>
              <Shield size={18} color="#1A2FB8" strokeWidth={2.4} />
            </div>
            <div style={styles.profileInfo}>
              <div style={styles.profileName}>{session?.name || 'Regional Manager'}</div>
              <div style={styles.profileRole}>
                <span style={styles.roleChip}>ASM</span>
                <span style={styles.idText}>ID: {session?.inchargeId || session?.agentId || 'INC001'}</span>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            style={styles.logoutBtn}
            onClick={handleLogout}
            title="Log out of ASM Portal"
          >
            <LogOut size={16} color="#DC2626" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Global Quick Record Modal */}
      <QuickRecordModal 
        isOpen={isQuickRecordOpen}
        onClose={() => setIsQuickRecordOpen(false)}
      />
    </>
  );
};

const styles = {
  sidebar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    userSelect: 'none',
  },
  brandHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #F1F5F9',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  brandLogoImg: {
    height: '38px',
    maxWidth: '170px',
    objectFit: 'contain',
    display: 'block',
  },
  actionSection: {
    padding: '14px 16px 8px 16px',
  },
  quickRecordBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    padding: '9px 12px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '700',
    boxShadow: '0 2px 6px rgba(26, 47, 184, 0.25)',
  },
  agentsSideBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#F8FAFC',
    color: '#1A2FB8',
    border: '1px solid #BFDBFE',
    padding: '9px 12px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '700',
  },
  harvestSideBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#F0FDF4',
    color: '#15803D',
    border: '1px solid #BBF7D0',
    padding: '9px 12px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '700',
  },
  navMenu: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '13.5px',
    transition: 'all 0.15s ease',
  },
  navBadge: {
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    padding: '2px 6px',
    borderRadius: '6px',
  },
  footerSection: {
    padding: '12px 14px',
    borderTop: '1px solid #F1F5F9',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: '#FAFAFA',
  },
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  profileAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  profileRole: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '2px',
  },
  roleChip: {
    fontSize: '9.5px',
    fontWeight: '800',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    padding: '1px 5px',
    borderRadius: '4px',
  },
  idText: {
    fontSize: '11px',
    color: '#64748B',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #FEE2E2',
    backgroundColor: '#FFFFFF',
    color: '#DC2626',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};

export default InchargeSidebar;
