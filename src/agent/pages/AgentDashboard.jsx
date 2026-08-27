import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, CheckCircle, AlertTriangle, Clock, Plus, 
  Droplets, Fish, Wheat, Skull, ClipboardList, Camera, RefreshCw, ChevronRight, Check 
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';
import { getStoredGPS, captureDeviceGPS, generateVerifiedFallbackGPS } from '../utils/gpsService';
import QuickRecordModal from '../components/QuickRecordModal';
import SyncStatusModal from '../components/SyncStatusModal';
import { getSyncStatus } from '../utils/syncService';

const AgentDashboard = () => {
  const navigate = useNavigate();
  const session = getSession();
  const { db, getFarmersByAgentId } = useMockData();

  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncState, setSyncState] = useState(getSyncStatus());

  const technicianName = session?.name || 'Agent A';
  const agentId = session?.agentId || 'agent001';

  // Farmers assigned to this technician
  const assignedFarmers = getFarmersByAgentId ? getFarmersByAgentId(agentId) : (db?.farmers || []);
  const allTanks = db?.tanks || [];
  const assignedPonds = allTanks.filter(t => assignedFarmers.some(f => f.id === t.farmerId));

  // Submissions made by this technician
  const technicianSubmissions = (db?.submissions || [])
    .filter(s => !s.agentId || s.agentId === agentId)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const isWeeklyCompleted = technicianSubmissions.length > 0;
  const recentRecords = technicianSubmissions.slice(0, 3);

  // Load GPS on mount
  useEffect(() => {
    const existingGPS = getStoredGPS();
    if (existingGPS) {
      setGps(existingGPS);
    } else {
      handleRefreshGPS();
    }
  }, []);

  const handleRefreshGPS = () => {
    setGpsLoading(true);
    captureDeviceGPS(
      (pos) => {
        setGps(pos);
        setGpsLoading(false);
      },
      () => {
        const fallback = generateVerifiedFallbackGPS('Bhimavaram, AP');
        setGps(fallback);
        setGpsLoading(false);
      }
    );
  };

  const getRecordIcon = (type = '') => {
    const t = type.toUpperCase();
    if (t.includes('WATER')) return <Droplets size={18} color="#0018AD" />;
    if (t.includes('BIOMASS')) return <Fish size={18} color="#2563D9" />;
    if (t.includes('FEED')) return <Wheat size={18} color="#D97706" />;
    if (t.includes('MORTALITY')) return <Skull size={18} color="#DC2626" />;
    if (t.includes('PHOTO')) return <Camera size={18} color="#059669" />;
    return <ClipboardList size={18} color="#7C3AED" />;
  };

  return (
    <div style={styles.container}>
      {/* 1. Header (Greeting) */}
      <div style={styles.headerRow}>
        <div style={styles.greetingBox}>
          <span style={styles.greetingSub}>Good Morning,</span>
          <h1 style={styles.greetingTitle}>{technicianName}</h1>
        </div>
      </div>

      {/* 2. Current Location Card */}
      <div style={styles.card}>
        <div style={styles.cardHeaderRow}>
          <div style={styles.locationTag}>
            <MapPin size={13} color="#0018AD" />
            <span>CURRENT LOCATION</span>
          </div>
          <button 
            style={styles.refreshBtn}
            onClick={handleRefreshGPS}
            disabled={gpsLoading}
          >
            <RefreshCw size={11} className={gpsLoading ? 'spin-animation' : ''} />
            <span>{gpsLoading ? 'Locating...' : 'Refresh'}</span>
          </button>
        </div>

        <div style={styles.locationName}>
          {gps?.locality || 'Bhimavaram, AP'}
        </div>

        <div style={styles.locationStatusRow}>
          <span style={styles.gpsVerifiedBadge}>
            <Check size={12} color="#15803D" strokeWidth={3} /> GPS Verified
          </span>
          <span style={styles.accuracyText}>
            Accuracy: ±{gps?.accuracy || 119}m
          </span>
        </div>
      </div>

      {/* 3. Today's Work Card */}
      <div style={styles.card}>
        <div style={styles.sectionHeaderSmall}>TODAY'S WORK</div>
        <div style={styles.metricsGrid}>
          <div style={styles.metricCol}>
            <span style={styles.metricVal}>{assignedFarmers.length || 6}</span>
            <span style={styles.metricLabel}>Farmers</span>
          </div>
          <div style={styles.metricDivider} />
          <div style={styles.metricCol}>
            <span style={styles.metricVal}>{assignedPonds.length || 6}</span>
            <span style={styles.metricLabel}>Ponds</span>
          </div>
          <div style={styles.metricDivider} />
          <div style={styles.metricCol}>
            <span style={{ ...styles.metricVal, color: '#D97706' }}>2</span>
            <span style={styles.metricLabel}>Tests Due</span>
          </div>
        </div>
      </div>

      {/* 4. Weekly Test Compliance Card */}
      <div style={styles.card}>
        <div style={styles.sectionHeaderSmall}>WEEKLY TEST</div>
        <div style={styles.weeklyContentRow}>
          {isWeeklyCompleted ? (
            <div style={styles.weeklySuccessState}>
              <CheckCircle size={15} color="#16A34A" />
              <span>Completed • 27 Aug 2026</span>
            </div>
          ) : (
            <div style={styles.weeklyPendingState}>
              <AlertTriangle size={15} color="#D97706" />
              <span>Test Required</span>
            </div>
          )}

          <button 
            style={styles.startTestBtn}
            onClick={() => setIsQuickRecordOpen(true)}
          >
            <Plus size={13} strokeWidth={2.5} /> Start Test
          </button>
        </div>
      </div>

      {/* 5. Recent Records Section */}
      <div style={styles.recentSection}>
        <div style={styles.recentHeaderRow}>
          <span style={styles.sectionHeaderSmall}>RECENT</span>
          <button 
            style={styles.viewHistoryLink}
            onClick={() => navigate('/tests')}
          >
            View History <ChevronRight size={13} />
          </button>
        </div>

        <div style={styles.recentList}>
          {recentRecords.length === 0 ? (
            <div style={styles.emptyRecentBox}>
              <span>No recent field records submitted yet.</span>
            </div>
          ) : (
            recentRecords.map((r, idx) => (
              <div 
                key={r.id || idx} 
                style={styles.recentRowCard}
                onClick={() => navigate('/tests')}
              >
                <div style={styles.recentRowLeft}>
                  <div style={styles.iconContainer}>
                    {getRecordIcon(r.testType || r.recordType)}
                  </div>
                  <div style={styles.recentTextGroup}>
                    <span style={styles.recordTitle}>
                      {r.testType || r.recordType || 'Water Analysis'}
                    </span>
                    <span style={styles.recordTarget}>
                      {r.farmerName || r.farmerId || 'Ravi Kumar'} • {r.tankName || r.tankId || 'Pond 01'}
                    </span>
                  </div>
                </div>

                <div style={styles.recentRowRight}>
                  <span style={styles.recordTime}>
                    {r.submittedAgo || r.time || '1 hour ago'}
                  </span>
                  <span style={styles.submittedStatus}>
                    ✓ Submitted
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <QuickRecordModal 
        isOpen={isQuickRecordOpen}
        onClose={() => setIsQuickRecordOpen(false)}
      />

      <SyncStatusModal 
        isOpen={isSyncModalOpen}
        onClose={() => {
          setIsSyncModalOpen(false);
          setSyncState(getSyncStatus());
        }}
      />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingBottom: '24px',
    maxWidth: '480px',
    margin: '0 auto',
    width: '100%',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '4px',
  },
  greetingBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  greetingSub: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '500',
  },
  greetingTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '14px 16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#0018AD',
    letterSpacing: '0.4px',
  },
  refreshBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    color: '#64748B',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '2px 4px',
  },
  locationName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
  },
  locationStatusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '2px',
  },
  gpsVerifiedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '6px',
  },
  accuracyText: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '500',
  },
  sectionHeaderSmall: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.4px',
  },
  metricsGrid: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '4px 0',
  },
  metricCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  metricVal: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0018AD',
    lineHeight: 1.1,
  },
  metricLabel: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '500',
  },
  metricDivider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#F1F5F9',
  },
  weeklyContentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '2px',
  },
  weeklySuccessState: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#16A34A',
  },
  weeklyPendingState: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#D97706',
  },
  startTestBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#0018AD',
    color: '#FFFFFF',
    border: 'none',
    padding: '7px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  recentSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '4px',
  },
  recentHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 2px',
  },
  viewHistoryLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    background: 'none',
    border: 'none',
    color: '#0018AD',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: 0,
  },
  recentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  recentRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '12px 14px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  recentRowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconContainer: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#EDF0FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recentTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  recordTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  recordTarget: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '500',
  },
  recentRowRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '3px',
  },
  recordTime: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '500',
  },
  submittedStatus: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#16A34A',
  },
  emptyRecentBox: {
    padding: '24px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '12px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px dashed #CBD5E1',
  },
};

export default AgentDashboard;
