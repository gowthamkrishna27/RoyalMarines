import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  UserCheck, 
  UserSquare, 
  Droplets, 
  Layers, 
  Plus, 
  Activity, 
  CheckCircle, 
  Calendar, 
  Network, 
  TestTube, 
  BarChart, 
  Download, 
  Settings, 
  X, 
  ChevronRight,
  Shield,
  Clock,
  History
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import QuickRecordModal from '../../agent/components/QuickRecordModal';

const InchargeBottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { db } = useMockData();

  // Active popup sheet: null | 'MAIN' | 'ACTION' | 'REPORTS'
  const [activeSheet, setActiveSheet] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const pendingCount = (db?.submissions || []).filter(s => s.status === 'PENDING_VERIFICATION').length;

  const isHomeActive = location.pathname === '/incharge/dashboard';
  const isMainActive = ['/incharge/my-farmers', '/incharge/agents', '/incharge/farmers', '/incharge/my-tanks', '/incharge/tanks'].some(p => location.pathname.startsWith(p));
  const isHistoryActive = location.pathname === '/incharge/tests' || location.pathname === '/incharge/history';
  const isReportsActive = location.pathname.startsWith('/incharge/reports');

  const handleNavClick = (tab) => {
    if (tab === 'HOME') {
      setActiveSheet(null);
      navigate('/incharge/dashboard');
    } else if (tab === 'HISTORY') {
      setActiveSheet(null);
      navigate('/incharge/tests');
    } else if (tab === 'REPORTS') {
      setActiveSheet(null);
      navigate('/incharge/reports');
    } else if (tab === 'ACTION') {
      setActiveSheet(null);
      setIsRecordModalOpen(true);
    } else {
      setActiveSheet(activeSheet === tab ? null : tab);
    }
  };

  const handleOptionSelect = (path) => {
    setActiveSheet(null);
    navigate(path);
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. BACKDROP OVERLAY WHEN A SHEET IS OPEN */}
      {/* ========================================================= */}
      {activeSheet && (
        <div 
          onClick={() => setActiveSheet(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 9998,
            transition: 'opacity 0.2s ease'
          }}
        />
      )}

      {/* ========================================================= */}
      {/* 2. POPUP BOTTOM SHEETS */}
      {/* ========================================================= */}
      {activeSheet && (
        <div 
          style={{
            position: 'fixed',
            bottom: '64px',
            left: 0,
            right: 0,
            maxWidth: '540px',
            margin: '0 auto',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px 20px 0 0',
            boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.15)',
            zIndex: 9999,
            padding: '18px 20px 24px',
            border: '1px solid #E2E8F0',
            animation: 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header row of Sheet */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                color: '#1A2FB8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {activeSheet === 'MAIN' ? <Users size={16} /> :
                 activeSheet === 'ACTION' ? <Plus size={16} /> :
                 activeSheet === 'OPERATIONS' ? <Activity size={16} /> :
                 <BarChart size={16} />}
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                {activeSheet === 'MAIN' ? 'My Team' :
                 activeSheet === 'ACTION' ? 'Quick Actions' :
                 activeSheet === 'OPERATIONS' ? 'Operations Management' :
                 'Reports & Audit'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveSheet(null)}
              style={{
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Sheet Options Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* OPTION SET: MAIN (My Farmers, My Agents) */}
            {activeSheet === 'MAIN' && (
              <>
                <button
                  type="button"
                  onClick={() => handleOptionSelect('/incharge/my-farmers')}
                  style={styles.sheetOptionBtn}
                  className="transition-all duration-150 active:scale-98 hover:bg-slate-50"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ ...styles.sheetOptionIcon, backgroundColor: '#F0FDF4', color: '#16A34A' }}>
                      <UserCheck size={18} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>My Farmers</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>ASM personal assigned farmers</div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#94A3B8" />
                </button>

                <button
                  type="button"
                  onClick={() => handleOptionSelect('/incharge/agents')}
                  style={styles.sheetOptionBtn}
                  className="transition-all duration-150 active:scale-98 hover:bg-slate-50"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ ...styles.sheetOptionIcon, backgroundColor: '#EFF6FF', color: '#1A2FB8' }}>
                      <Users size={18} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>My Agents</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Field technicians supervised</div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#94A3B8" />
                </button>
              </>
            )}

            {/* OPTION SET: ACTION (+) */}
            {activeSheet === 'ACTION' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSheet(null);
                    setIsRecordModalOpen(true);
                  }}
                  style={styles.sheetOptionBtn}
                  className="transition-all duration-150 active:scale-98 hover:bg-slate-50"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ ...styles.sheetOptionIcon, backgroundColor: '#EFF6FF', color: '#1A2FB8' }}>
                      <Droplets size={18} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>Record</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Water analysis, feed test, disease, mortality & logs</div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#94A3B8" />
                </button>
              </>
            )}


          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MAIN FIXED BOTTOM NAVIGATION BAR */}
      {/* ========================================================= */}
      <nav style={styles.navContainer} className="block lg:hidden" aria-label="Incharge Mobile Bottom Navigation">
        <div style={styles.innerNav}>
          {/* TAB 1: HOME */}
          <button
            type="button"
            className="transition-all duration-150 active:scale-95 cursor-pointer"
            style={styles.navBtn}
            onClick={() => handleNavClick('HOME')}
            aria-label="Home"
          >
            <div style={styles.iconWrapper}>
              <Home 
                size={20} 
                strokeWidth={isHomeActive ? 2.6 : 1.8} 
                color={isHomeActive ? '#1A2FB8' : '#64748B'} 
              />
              <span style={{
                ...styles.navLabel,
                color: isHomeActive ? '#1A2FB8' : '#64748B',
                fontWeight: isHomeActive ? '700' : '500',
              }}>
                Home
              </span>
            </div>
          </button>

          {/* TAB 2: MY TEAM (Options: My Farmers, My Agents) */}
          <button
            type="button"
            className="transition-all duration-150 active:scale-95 cursor-pointer"
            style={styles.navBtn}
            onClick={() => handleNavClick('MAIN')}
            aria-label="My Team"
          >
            <div style={styles.iconWrapper}>
              <Users 
                size={20} 
                strokeWidth={isMainActive || activeSheet === 'MAIN' ? 2.6 : 1.8} 
                color={isMainActive || activeSheet === 'MAIN' ? '#1A2FB8' : '#64748B'} 
              />
              <span style={{
                ...styles.navLabel,
                color: isMainActive || activeSheet === 'MAIN' ? '#1A2FB8' : '#64748B',
                fontWeight: isMainActive || activeSheet === 'MAIN' ? '700' : '500',
              }}>
                My Team
              </span>
            </div>
          </button>

          {/* TAB 3: CENTER FLOATING ACTION (+) BUTTON */}
          <div style={styles.actionCol}>
            <button
              type="button"
              className="transition-all duration-150 active:scale-90 cursor-pointer"
              style={{
                ...styles.floatingCenterBtn,
                backgroundColor: activeSheet === 'ACTION' ? '#0F172A' : '#1A2FB8'
              }}
              onClick={() => handleNavClick('ACTION')}
              aria-label="Quick Actions"
            >
              <Plus 
                size={24} 
                color="#FFFFFF" 
                strokeWidth={3} 
                style={{
                  transform: activeSheet === 'ACTION' ? 'rotate(45deg)' : 'none',
                  transition: 'transform 0.2s ease'
                }}
              />
            </button>
            <span style={{
              ...styles.actionLabel,
              color: activeSheet === 'ACTION' ? '#1A2FB8' : '#1A2FB8'
            }}>
              New
            </span>
          </div>

          {/* TAB 4: HISTORY (Direct Link to Test History of Agents & Me) */}
          <button
            type="button"
            className="transition-all duration-150 active:scale-95 cursor-pointer"
            style={styles.navBtn}
            onClick={() => handleNavClick('HISTORY')}
            aria-label="History"
          >
            <div style={styles.iconWrapper}>
              <History 
                size={20} 
                strokeWidth={isHistoryActive ? 2.6 : 1.8} 
                color={isHistoryActive ? '#1A2FB8' : '#64748B'} 
              />
              <span style={{
                ...styles.navLabel,
                color: isHistoryActive ? '#1A2FB8' : '#64748B',
                fontWeight: isHistoryActive ? '700' : '500',
              }}>
                History
              </span>
            </div>
          </button>

          {/* TAB 5: REPORTS (Options: Reports, Export Data, Activity Log) */}
          <button
            type="button"
            className="transition-all duration-150 active:scale-95 cursor-pointer"
            style={styles.navBtn}
            onClick={() => handleNavClick('REPORTS')}
            aria-label="Reports"
          >
            <div style={styles.iconWrapper}>
              <BarChart 
                size={20} 
                strokeWidth={isReportsActive || activeSheet === 'REPORTS' ? 2.6 : 1.8} 
                color={isReportsActive || activeSheet === 'REPORTS' ? '#1A2FB8' : '#64748B'} 
              />
              <span style={{
                ...styles.navLabel,
                color: isReportsActive || activeSheet === 'REPORTS' ? '#1A2FB8' : '#64748B',
                fontWeight: isReportsActive || activeSheet === 'REPORTS' ? '700' : '500',
              }}>
                Reports
              </span>
            </div>
          </button>
        </div>
      </nav>

      {/* Quick Record Modal for Water Quality, Feed, Disease, Mortality, etc. */}
      <QuickRecordModal 
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        userRole="INCHARGE"
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
    zIndex: 9990,
    boxShadow: '0 -3px 16px rgba(15, 23, 42, 0.08)',
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
    top: '-18px',
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    backgroundColor: '#1A2FB8',
    border: '3px solid #FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(26, 47, 184, 0.45)',
    cursor: 'pointer',
    zIndex: 10,
  },
  actionLabel: {
    fontSize: '10.5px',
    fontWeight: '700',
    marginTop: '22px',
    letterSpacing: '-0.1px',
    lineHeight: 1,
  },
  sheetOptionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1px solid #F1F5F9',
    backgroundColor: '#FFFFFF',
    width: '100%',
    cursor: 'pointer',
  },
  sheetOptionIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }
};

export default InchargeBottomNavigation;
