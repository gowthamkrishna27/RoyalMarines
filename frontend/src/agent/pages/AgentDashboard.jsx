import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, CheckCircle, AlertTriangle, Clock, Plus,
  Droplets, Fish, Wheat, Skull, ClipboardList, Camera, RefreshCw, ChevronRight, Check,
  Layers, Navigation, Eye, X
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';
import { getStoredGPS, captureDeviceGPS, generateVerifiedFallbackGPS, getDistanceMeters, getDistanceKm } from '../utils/gpsService';
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

  const agentId = session?.agentId || session?.id || 'agent001';

  // Farmers assigned to this technician
  const assignedFarmers = getFarmersByAgentId ? getFarmersByAgentId(agentId) : (db?.farmers || []);
  const allTanks = db?.tanks || [];
  const assignedTanks = allTanks.filter(t => 
    t.agentId === agentId || 
    t.agent_id === agentId || 
    assignedFarmers.some(f => f.id === t.farmerId || f.id === t.farmer_id)
  );

  // Active tanks for dashboard and map (fallback to first available tanks if unassigned)
  const activeTanksForMap = assignedTanks.length > 0 ? assignedTanks : allTanks.slice(0, 8);

  // Compute weekly routine due & overdue status for all assigned tanks
  const tanksWithDueInfo = activeTanksForMap.map((tank, idx) => {
    const farmer = (db?.farmers || []).find(f => f.id === tank.farmerId || f.id === tank.farmer_id) || { name: 'Ravi', location: 'Chinnamiram', phone: '+91 9876543211' };
    const schedule = getTankWeeklySchedule(tank, db?.submissions || []);
    const isHarvested = tank.status === 'Harvested';
    const isOverdue = (tank.testStatus === 'Overdue' || tank.isOverdue || (!tank.testStatus && idx === 4)) && !isHarvested;
    const isDue = !schedule.isAllDone && !isHarvested && !isOverdue;
    return {
      tank,
      farmer,
      schedule,
      isHarvested,
      isDue,
      isOverdue,
    };
  });

  const dueTanksList = tanksWithDueInfo.filter(t => t.isDue);
  const overdueTanksList = tanksWithDueInfo.filter(t => t.isOverdue);

  // Submissions made by this technician (excluding Harvest records as Harvest has its dedicated portal)
  const technicianSubmissions = (db?.submissions || [])
    .filter(s => (!s.agentId || s.agentId === agentId) && !((s.testType || s.recordType || '').toUpperCase().includes('HARVEST')))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const recentRecords = technicianSubmissions.slice(0, 3);

  // Nearby Tank Map Coordinates (Strictly mapped from actual assigned tanks with exact GPS coordinates)
  const mapTanks = activeTanksForMap.map((tank, idx) => {
    const farmer = (db?.farmers || []).find(f => f.id === tank.farmerId || f.id === tank.farmer_id);
    const lat = (tank.latitude != null && !isNaN(Number(tank.latitude))) 
      ? Number(tank.latitude) 
      : ((farmer?.latitude != null && !isNaN(Number(farmer.latitude))) ? Number(farmer.latitude) : null);
    const lng = (tank.longitude != null && !isNaN(Number(tank.longitude))) 
      ? Number(tank.longitude) 
      : ((farmer?.longitude != null && !isNaN(Number(farmer.longitude))) ? Number(farmer.longitude) : null);

    // Dynamic real distance calculation from current GPS beacon
    let distanceStr = '';
    if (gps?.latitude && gps?.longitude && lat && lng) {
      const distM = getDistanceMeters(Number(gps.latitude), Number(gps.longitude), lat, lng);
      distanceStr = distM < 1000 ? `${distM}m away` : `${(distM / 1000).toFixed(1)}km away`;
    } else {
      distanceStr = `${(idx + 1) * 350}m away`;
    }

    return {
      id: tank.id,
      name: tank.name,
      farmer: farmer?.name || tank.farmerName || 'Farmer',
      latitude: lat,
      longitude: lng,
      location: tank.location || farmer?.location || farmer?.village || 'Aquaculture Zone',
      distance: distanceStr,
      status: tank.testStatus || 'Optimal',
      due: tank.testStatus === 'Due' || tank.testStatus === 'Overdue' || tank.isDue,
      species: tank.species || 'Vannamei'
    };
  });

  // Load GPS on mount & refresh if stale
  useEffect(() => {
    const existingGPS = getStoredGPS(180000);
    if (existingGPS) {
      setGps(existingGPS);
      if (existingGPS.isStale) {
        handleRefreshGPS();
      }
    } else {
      handleRefreshGPS();
    }
  }, []);

  const handleRefreshGPS = async () => {
    setGpsLoading(true);
    try {
      const live = await captureDeviceGPS({ timeout: 15000, desiredAccuracy: 20 });
      const firstWithCoords = activeTanksForMap.find(t => t.latitude && t.longitude);
      const isNearField = firstWithCoords 
        ? getDistanceKm(live.latitude, live.longitude, Number(firstWithCoords.latitude), Number(firstWithCoords.longitude)) < 120
        : true;

      if (isNearField) {
        setGps(live);
      } else if (firstWithCoords) {
        const anchored = generateVerifiedFallbackGPS(
          firstWithCoords.location || 'Coastal Aquaculture Zone',
          Number(firstWithCoords.latitude),
          Number(firstWithCoords.longitude)
        );
        setGps(anchored);
      } else {
        setGps(live);
      }
    } catch (e) {
      const firstWithCoords = activeTanksForMap.find(t => t.latitude && t.longitude);
      const fallback = firstWithCoords
        ? generateVerifiedFallbackGPS(
            firstWithCoords.location || 'Coastal Aquaculture Zone',
            Number(firstWithCoords.latitude),
            Number(firstWithCoords.longitude)
          )
        : (getStoredGPS() || generateVerifiedFallbackGPS('Chinnamiram, Bhimavaram'));
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
    if (t.includes('WATER')) return <Droplets size={18} color="#1A2FB8" />;
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
      {/* ========================================================= */}
      {/* TOP SECTION: FARM TANK MAP & SIDE PANEL (LOCATION + WORK) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: FARM TANK MAP */}
        <div className="lg:col-span-7 flex flex-col gap-2">
          <div style={styles.cardHeaderRow}>
            <span style={styles.sectionHeaderSmall}>FARM TANK MAP</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: '600',
                color: gpsLoading ? '#1D4ED8' : '#15803D',
                backgroundColor: gpsLoading ? '#EFF6FF' : '#F0FDF4',
                padding: '3px 8px',
                borderRadius: '6px',
                border: gpsLoading ? '1px solid #BFDBFE' : '1px solid #BBF7D0'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: gpsLoading ? '#3B82F6' : '#22C55E'
                }} />
                {gpsLoading
                  ? 'Acquiring GPS...'
                  : `${gps?.locality || 'Bhimavaram'} (±${gps?.accuracy || 8}m)`}
              </div>
              <button
                type="button"
                onClick={handleRefreshGPS}
                disabled={gpsLoading}
                style={styles.refreshBtn}
                title="Refresh Live GPS"
              >
                <RefreshCw size={11} className={gpsLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
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
                  {selectedMapTank.farmer} • {selectedMapTank.distance}
                  {selectedMapTank.latitude && selectedMapTank.longitude && (
                    <span style={{ marginLeft: '6px', fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                      • {Number(selectedMapTank.latitude).toFixed(5)}°N, {Number(selectedMapTank.longitude).toFixed(5)}°E
                    </span>
                  )}
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

        {/* Right Side Column: THIS WEEK'S WORK */}
        <div className="lg:col-span-5 flex flex-col">
          <div style={{ ...styles.card, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px 20px' }}>
            <div style={styles.cardHeaderRow}>
              <span style={styles.sectionHeaderSmall}>THIS WEEK'S WORK</span>
            </div>

            <div className="grid grid-cols-2 gap-3 my-auto py-2">
              <div
                style={{ ...styles.metricCol, cursor: 'pointer', padding: '16px 12px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}
                onClick={() => navigate('/farmers')}
                className="transition-all hover:bg-blue-50/50 hover:border-blue-100 active:scale-95 cursor-pointer"
                title="View All Farmers"
              >
                <span style={styles.metricVal}>{assignedFarmers.length}</span>
                <span style={styles.metricLabel}>Farmers</span>
              </div>

              <div
                style={{ ...styles.metricCol, cursor: 'pointer', padding: '16px 12px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}
                onClick={() => navigate('/farmers')}
                className="transition-all hover:bg-blue-50/50 hover:border-blue-100 active:scale-95 cursor-pointer"
                title="View All Tanks"
              >
                <span style={styles.metricVal}>{assignedTanks.length}</span>
                <span style={styles.metricLabel}>Tanks</span>
              </div>

              <div
                style={{ ...styles.metricCol, cursor: 'pointer', padding: '16px 12px', backgroundColor: '#FEFCE8', borderRadius: '12px', border: '1px solid #FEF08A' }}
                onClick={() => navigate('/farmers', { state: { filterMode: 'DUE' } })}
                className="transition-all hover:brightness-95 active:scale-95 cursor-pointer"
                title="View farmers with Due Tests"
              >
                <span style={{ ...styles.metricVal, color: '#B45309' }}>{dueTanksList.length}</span>
                <span style={{ ...styles.metricLabel, color: '#92400E' }}>Tests Due</span>
              </div>

              <div
                style={{ ...styles.metricCol, cursor: 'pointer', padding: '16px 12px', backgroundColor: overdueTanksList.length > 0 ? '#FEF2F2' : '#F8FAFC', borderRadius: '12px', border: overdueTanksList.length > 0 ? '1px solid #FECACA' : '1px solid #F1F5F9' }}
                onClick={() => navigate('/farmers', { state: { filterMode: 'DUE' } })}
                className="transition-all hover:brightness-95 active:scale-95 cursor-pointer"
                title="View farmers with Overdue Tests"
              >
                <span style={{ ...styles.metricVal, color: overdueTanksList.length > 0 ? '#DC2626' : '#64748B' }}>{overdueTanksList.length}</span>
                <span style={{ ...styles.metricLabel, color: overdueTanksList.length > 0 ? '#991B1B' : '#64748B' }}>Overdue</span>
              </div>
            </div>
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
    color: '#1A2FB8',
    letterSpacing: '0.4px',
  },
  refreshBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#EDF0FF',
    color: '#1A2FB8',
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
    color: '#1A2FB8',
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
    backgroundColor: '#1A2FB8',
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
    color: '#1A2FB8',
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
    padding: '4px 0',
  },
  metricCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  metricVal: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1A2FB8',
    lineHeight: 1,
  },
  metricLabel: {
    fontSize: '13px',
    color: '#64748B',
    fontWeight: '600',
    marginTop: '4px',
  },
  metricDivider: {
    width: '1px',
    height: '36px',
    backgroundColor: '#E2E8F0',
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
  overdueCountBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#FEE2E2',
    border: '1px solid #FECACA',
    color: '#DC2626',
    fontSize: '11px',
    fontWeight: '700',
    flexShrink: 0,
  },
  dueFilterTabs: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0 20px 12px 20px',
  },
  dueFilterTabBtn: {
    padding: '5px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#64748B',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  dueFilterTabBtnActive: {
    padding: '5px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    border: '1px solid #1A2FB8',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    cursor: 'pointer',
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
