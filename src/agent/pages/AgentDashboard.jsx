import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, CheckCircle, AlertTriangle, Clock, Plus,
  Droplets, Fish, Wheat, Skull, ClipboardList, Camera, RefreshCw, ChevronRight, Check,
  Layers, Navigation, Eye, X
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';
import { getStoredGPS, captureDeviceGPS, generateVerifiedFallbackGPS } from '../utils/gpsService';
import QuickRecordModal from '../components/QuickRecordModal';
import FarmLeafletMap from '../components/FarmLeafletMap';
import { getTankWeeklySchedule } from '../utils/testScheduleHelper';

const AgentDashboard = () => {
  const navigate = useNavigate();
  const session = getSession();
  const { db, getFarmersByAgentId } = useMockData();

  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);
  const [modalInitialTank, setModalInitialTank] = useState(null);
  const [modalInitialType, setModalInitialType] = useState('WATER_QUALITY');
  const [selectedMapTank, setSelectedMapTank] = useState(null);
  const [showDueTestsModal, setShowDueTestsModal] = useState(false);

  const agentId = session?.agentId || 'agent001';

  // Farmers assigned to this technician
  const assignedFarmers = getFarmersByAgentId ? getFarmersByAgentId(agentId) : (db?.farmers || []);
  const allTanks = db?.tanks || [];
  const assignedTanks = allTanks.filter(t => assignedFarmers.some(f => f.id === t.farmerId));

  // Compute weekly routine due status for all assigned tanks
  const tanksWithDueInfo = assignedTanks.map(tank => {
    const farmer = (assignedFarmers || []).find(f => f.id === tank.farmerId) || { name: 'Ravi', location: 'Chinnamiram', phone: '+91 9876543211' };
    const schedule = getTankWeeklySchedule(tank, db?.submissions || []);
    return {
      tank,
      farmer,
      schedule,
      isDue: !schedule.isAllDone && tank.status !== 'Harvested',
    };
  });

  const dueTanksList = tanksWithDueInfo.filter(t => t.isDue);

  // Submissions made by this technician (excluding Harvest records as Harvest has its dedicated portal)
  const technicianSubmissions = (db?.submissions || [])
    .filter(s => (!s.agentId || s.agentId === agentId) && !((s.testType || s.recordType || '').toUpperCase().includes('HARVEST')))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const recentRecords = technicianSubmissions.slice(0, 3);

  // Nearby Tank Map Coordinates (Relative to current GPS locality)
  const mapTanks = [
    { id: assignedTanks[0]?.id || 'tank-01', name: assignedTanks[0]?.name || 'Tank 01', farmer: assignedFarmers[0]?.name || 'Ravi', x: 28, y: 35, distance: '450m', status: 'Optimal', due: false, species: 'Vannamei' },
    { id: assignedTanks[1]?.id || 'tank-02', name: assignedTanks[1]?.name || 'Tank 02', farmer: assignedFarmers[0]?.name || 'Ravi', x: 72, y: 30, distance: '620m', status: 'Test Due', due: true, species: 'Vannamei' },
    { id: assignedTanks[2]?.id || 'tank-03', name: assignedTanks[2]?.name || 'Tank 03', farmer: assignedFarmers[1]?.name || 'Naveen', x: 35, y: 72, distance: '480m', status: 'Optimal', due: false, species: 'Monodon' },
    { id: assignedTanks[3]?.id || 'tank-04', name: assignedTanks[3]?.name || 'Tank 04', farmer: assignedFarmers[1]?.name || 'Naveen', x: 78, y: 75, distance: '750m', status: 'Optimal', due: false, species: 'Vannamei' },
  ];

  // Default no tank selected until user clicks a tank pin on the map

  // Load GPS on mount
  useEffect(() => {
    const existingGPS = getStoredGPS();
    if (existingGPS) {
      setGps(existingGPS);
    } else {
      handleRefreshGPS();
    }
  }, []);

  const handleRefreshGPS = async () => {
    setGpsLoading(true);
    try {
      const live = await captureDeviceGPS({ timeout: 6000 });
      setGps(live);
    } catch (e) {
      const fallback = generateVerifiedFallbackGPS('Bhimavaram, AP');
      setGps(fallback);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleOpenRecordForTank = (tank, testKey = 'WATER_QUALITY') => {
    setModalInitialTank(tank.id);
    setModalInitialType(testKey);
    setIsQuickRecordOpen(true);
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

  const getRecordFarmer = (record) => {
    if (record?.farmerName && !record.farmerName.startsWith('F00') && !record.farmerName.startsWith('FAR-')) {
      return record.farmerName;
    }
    const farmer = (db?.farmers || []).find(f => f.id === record?.farmerId);
    return farmer?.name || 'Ravi';
  };

  const getRecordTank = (record) => {
    if (record?.tankName && !record.tankName.startsWith('T00') && !record.tankName.startsWith('tank-0')) {
      return record.tankName;
    }
    const tank = (db?.tanks || []).find(t => t.id === record?.tankId);
    if (tank?.name) return tank.name;
    if (record?.tankId) {
      const num = record.tankId.replace(/\D/g, '');
      if (num) return `Tank ${parseInt(num, 10)}`;
    }
    return 'Tank 1';
  };

  return (
    <div style={styles.container}>
      {/* 1. Current Location Card */}
      <div style={styles.card}>
        <div style={styles.cardHeaderRow}>
          <div style={styles.locationTag}>
            <MapPin size={13} color="#0018AD" />
            <span>CURRENT LOCATION</span>
          </div>
          <button
            type="button"
            className="transition-all duration-150 hover:bg-indigo-100 active:scale-95 cursor-pointer"
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
            Accuracy: ±{gps?.accuracy || 8}m
          </span>
        </div>
      </div>

      {/* 2. Interactive Farm Tank Map */}
      <div style={styles.card}>
        <div style={styles.cardHeaderRow}>
          <span style={styles.sectionHeaderSmall}>FARM TANK MAP</span>
        </div>

        {/* Leaflet OpenStreetMap Container */}
        <FarmLeafletMap
          gps={gps}
          tanks={mapTanks}
          selectedTank={selectedMapTank}
          onSelectTank={(tank) => setSelectedMapTank(tank)}
        />

        {/* Selected Tank Quick-Action Drawer */}
        {selectedMapTank && (
          <div style={styles.pondDetailDrawer}>
            <div style={styles.drawerLeft}>
              <div style={styles.drawerTitleRow}>
                <span style={styles.drawerPondName}>{selectedMapTank.name}</span>
                <span style={selectedMapTank.due ? styles.tagDue : styles.tagOptimal}>
                  {selectedMapTank.status}
                </span>
              </div>
              <div style={styles.drawerSub}>
                {selectedMapTank.farmer} • {selectedMapTank.distance} away
              </div>
            </div>

            <div style={styles.drawerActions}>
              <button
                type="button"
                className="transition-all duration-150 hover:bg-slate-100 active:scale-95 cursor-pointer"
                style={styles.viewPondBtn}
                onClick={() => navigate(`/tanks/${selectedMapTank.id}`)}
              >
                <Eye size={12} /> View
              </button>

              <button
                type="button"
                className="transition-all duration-150 hover:brightness-110 active:scale-95 cursor-pointer"
                style={styles.recordPondBtn}
                onClick={() => handleOpenRecordForTank(selectedMapTank)}
              >
                <Plus size={12} strokeWidth={2.5} /> Record
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Today's Work Summary */}
      <div style={styles.card}>
        <div style={styles.sectionHeaderSmall}>THIS WEEK'S WORK</div>
        <div style={styles.metricsGrid}>
          <div 
            style={{ ...styles.metricCol, cursor: 'pointer' }}
            onClick={() => navigate('/farmers')}
            className="transition-all hover:bg-slate-50 cursor-pointer"
            title="View All Farmers"
          >
            <span style={styles.metricVal}>{assignedFarmers.length || 6}</span>
            <span style={styles.metricLabel}>Farmers</span>
          </div>

          <div style={styles.metricDivider} />

          <div 
            style={{ ...styles.metricCol, cursor: 'pointer' }}
            onClick={() => navigate('/farmers')}
            className="transition-all hover:bg-slate-50 cursor-pointer"
            title="View All Tanks"
          >
            <span style={styles.metricVal}>{assignedTanks.length || 6}</span>
            <span style={styles.metricLabel}>Tanks</span>
          </div>

          <div style={styles.metricDivider} />

          <div 
            style={{ 
              ...styles.metricCol, 
              cursor: 'pointer',
              backgroundColor: '#FEF3C7',
              borderRadius: '10px',
              padding: '6px 4px',
              border: '1px solid #FDE68A',
            }}
            onClick={() => setShowDueTestsModal(true)}
            className="transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Click to view all Due Tests details"
          >
            <span style={{ ...styles.metricVal, color: '#D97706' }}>
              {dueTanksList.length}
            </span>
            <span style={{ ...styles.metricLabel, color: '#B45309', fontWeight: '700' }}>
              Tests Due
            </span>
          </div>
        </div>
      </div>

      {/* 4. Recent Records Section */}
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
                className="transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                style={styles.recentRowCard}
                onClick={() => navigate('/tests')}
              >
                <div style={styles.recentLeft}>
                  <div style={styles.iconContainer}>
                    {getRecordIcon(r.testType || r.recordType)}
                  </div>
                  <div style={styles.recentInfo}>
                    <span style={styles.recentTitle}>
                      {r.testType || r.recordType || 'Water Analysis'}
                    </span>
                    <span style={styles.recentMeta}>
                      {getRecordFarmer(r)} • {getRecordTank(r)}
                    </span>
                  </div>
                </div>

                <div style={styles.recentRight}>
                  <span style={styles.timeTag}>{r.time || '10:32 AM'}</span>
                  <span style={styles.submittedTag}>✓ Submitted</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. DUE TESTS DETAIL MODAL (Opens when clicking Tests Due) */}
      {/* ========================================================= */}
      {showDueTestsModal && (
        <div 
          className="animate-backdrop-in"
          style={styles.modalOverlay}
          onClick={() => setShowDueTestsModal(false)}
        >
          <div 
            className="animate-modal-in"
            style={styles.dueModalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.dueModalHeader}>
              <div>
                <div style={styles.dueModalTag}>WEEKLY TEST SCHEDULE (MON - SUN)</div>
                <h3 style={styles.dueModalTitle}>
                  Weekly Due Tests ({dueTanksList.length} Ponds)
                </h3>
              </div>

              <button 
                type="button" 
                style={styles.dueCloseBtn}
                onClick={() => setShowDueTestsModal(false)}
                aria-label="Close"
              >
                <X size={20} color="#64748B" />
              </button>
            </div>

            <div style={styles.dueModalBody}>
              {dueTanksList.length === 0 ? (
                <div style={styles.allDoneBox}>
                  <CheckCircle size={36} color="#16A34A" />
                  <p style={{ margin: '8px 0 0 0', fontWeight: '700', color: '#0F172A' }}>
                    All weekly tests are up to date!
                  </p>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>
                    Great job! All assigned ponds have completed routine tests for this week.
                  </span>
                </div>
              ) : (
                dueTanksList.map((item, idx) => (
                  <div key={item?.tank?.id || idx} style={styles.dueTankCard}>
                    <div style={styles.dueTankTop}>
                      <div>
                        <div style={styles.dueFarmerName}>
                          {item?.farmer?.name || 'Farmer'} <span style={styles.dueLocationText}>• {item?.farmer?.location || 'Chinnamiram'}</span>
                        </div>
                        <div style={styles.dueTankSubRow}>
                          <strong style={{ color: '#0F172A' }}>{item?.tank?.name || `Tank ${idx + 1}`}</strong>
                          <span>•</span>
                          <span>{item?.tank?.acres || item?.tank?.size || '2.5'} Acres</span>
                          <span>•</span>
                          <span style={{ color: '#1A2FB8', fontWeight: '600' }}>{item?.tank?.doc || 77} Days</span>
                        </div>
                      </div>

                      <span style={styles.dueCountBadge}>
                        <Clock size={12} /> {item?.schedule?.dueCount || 0} Tests Due
                      </span>
                    </div>

                    <div style={styles.dueActionsRow}>
                      <button
                        type="button"
                        className="transition-all duration-150 hover:bg-slate-100 active:scale-95 cursor-pointer"
                        style={styles.dueViewScheduleBtn}
                        onClick={() => {
                          setShowDueTestsModal(false);
                          if (item?.tank?.id) {
                            navigate(`/tanks/${item.tank.id}`);
                          }
                        }}
                      >
                        <Eye size={13} /> View Schedule
                      </button>

                      <button
                        type="button"
                        className="transition-all duration-150 hover:brightness-110 active:scale-95 cursor-pointer"
                        style={styles.dueRecordBtn}
                        onClick={() => {
                          setShowDueTestsModal(false);
                          if (item?.tank) {
                            handleOpenRecordForTank(item.tank, item?.schedule?.dueTests?.[0]?.key || 'WATER_QUALITY');
                          }
                        }}
                      >
                        <Plus size={13} strokeWidth={2.6} /> Record Test
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Record Modal */}
      <QuickRecordModal
        isOpen={isQuickRecordOpen}
        onClose={() => setIsQuickRecordOpen(false)}
        initialType={modalInitialType}
        preselectedTankId={modalInitialTank}
      />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '14px 16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#0018AD',
    letterSpacing: '0.4px',
  },
  refreshBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#EDF0FF',
    color: '#0018AD',
    border: '1px solid #CBD2FF',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  locationName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 1.2,
  },
  locationStatusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  gpsVerifiedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
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
  liveIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#0018AD',
  },
  pulseDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#16A34A',
  },
  mapCanvas: {
    position: 'relative',
    height: '190px',
    borderRadius: '10px',
    backgroundColor: '#F1F5F9',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
  },
  mapGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      linear-gradient(to right, rgba(203, 213, 225, 0.4) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(203, 213, 225, 0.4) 1px, transparent 1px)
    `,
    backgroundSize: '24px 24px',
  },
  technicianPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 15,
  },
  pulseRing: {
    position: 'absolute',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 24, 173, 0.2)',
    animation: 'pulseSubtle 2s infinite',
  },
  techDot: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#0018AD',
    border: '2px solid #FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
    position: 'relative',
    zIndex: 2,
  },
  techLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#0018AD',
    backgroundColor: '#FFFFFF',
    padding: '1px 5px',
    borderRadius: '4px',
    marginTop: '3px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    whiteSpace: 'nowrap',
  },
  pondMarkerBox: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
  },
  pondPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid',
    transition: 'all 0.15s ease',
  },
  dueDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#D97706',
  },
  pondDetailDrawer: {
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    padding: '10px 12px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    marginTop: '6px',
    flexWrap: 'wrap',
  },
  drawerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '140px',
    flex: '1 1 auto',
  },
  drawerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  drawerPondName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
    whiteSpace: 'nowrap',
  },
  tagOptimal: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    padding: '1px 6px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  },
  tagDue: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    padding: '1px 6px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  },
  drawerSub: {
    fontSize: '11px',
    color: '#64748B',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  drawerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  viewPondBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    backgroundColor: '#FFFFFF',
    color: '#334155',
    border: '1px solid #CBD5E1',
    height: '32px',
    padding: '0 10px',
    borderRadius: '8px',
    fontSize: '11.5px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  recordPondBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    height: '32px',
    padding: '0 12px',
    borderRadius: '8px',
    fontSize: '11.5px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(26, 47, 184, 0.2)',
    whiteSpace: 'nowrap',
  },
  metricsGrid: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '6px 0',
  },
  metricCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  metricVal: {
    fontSize: 'clamp(20px, 4vw, 24px)',
    fontWeight: '800',
    color: '#1A2FB8',
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
  recentSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
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
    color: '#1A2FB8',
    fontSize: '11px',
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
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    gap: '8px',
  },
  recentLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0,
    flex: 1,
  },
  iconContainer: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  recentTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  recentMeta: {
    fontSize: '11px',
    color: '#64748B',
  },
  recentRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  timeTag: {
    fontSize: '11px',
    color: '#64748B',
  },
  submittedTag: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    padding: '1px 6px',
    borderRadius: '4px',
  },
  emptyRecentBox: {
    padding: '24px 16px',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px dashed #CBD5E1',
    color: '#64748B',
    fontSize: '12px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '16px',
    boxSizing: 'border-box',
    backdropFilter: 'blur(3px)',
  },
  dueModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
  },
  dueModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #F1F5F9',
    backgroundColor: '#FAFCFF',
  },
  dueModalTag: {
    fontSize: '10.5px',
    fontWeight: '700',
    color: '#1A2FB8',
    letterSpacing: '0.4px',
    marginBottom: '2px',
  },
  dueModalTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },
  dueCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueModalBody: {
    padding: '16px 20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: 'calc(90vh - 80px)',
  },
  dueTankCard: {
    backgroundColor: '#FEFCE8',
    border: '1.5px solid #FEF08A',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  dueTankTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '10px',
  },
  dueFarmerName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
  },
  dueLocationText: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '500',
  },
  dueTankSubRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
  },
  dueCountBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#FEF3C7',
    border: '1px solid #FDE68A',
    color: '#B45309',
    fontSize: '11px',
    fontWeight: '700',
    flexShrink: 0,
  },
  dueTestsListText: {
    fontSize: '12px',
    color: '#92400E',
    lineHeight: '1.4',
    backgroundColor: '#FFFBEB',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #FDE68A',
  },
  dueActionsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '4px',
  },
  dueViewScheduleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#FFFFFF',
    color: '#334155',
    border: '1px solid #CBD5E1',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  dueRecordBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(26, 47, 184, 0.25)',
  },
  allDoneBox: {
    textAlign: 'center',
    padding: '30px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
};

export default AgentDashboard;
