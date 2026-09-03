import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserSquare, Droplets, TestTube, CheckCircle, AlertTriangle,
  ArrowUpRight, ArrowDownRight, ChevronRight, Clock, ShieldCheck, Shield, Phone,
  TrendingUp, Activity, FileText, CheckCircle2, AlertCircle, MapPin, RefreshCw, Check, Eye,
  Search, Scale, Fish, Layers, Sparkles, X, Plus
} from 'lucide-react';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import FarmLeafletMap from '../../agent/components/FarmLeafletMap';
import HarvestCompletedModal from '../components/HarvestCompletedModal';
import WeeklyRoutineScheduleModal from '../components/WeeklyRoutineScheduleModal';
import QuickRecordModal from '../../agent/components/QuickRecordModal';
import { getStoredGPS, captureDeviceGPS, generateVerifiedFallbackGPS } from '../../agent/utils/gpsService';
import { getTankWeeklySchedule } from '../../agent/utils/testScheduleHelper';

const COMPLIANCE_COLORS = ['#16A34A', '#D97706', '#DC2626', '#64748B'];

const mockComplianceData = [
  { name: 'Completed', value: 78, count: '1,025 Tests' },
  { name: 'Due This Week', value: 14, count: '185 Tests' },
  { name: 'Overdue', value: 5, count: '67 Tests' },
  { name: 'Scheduled', value: 3, count: '47 Tests' },
];

const KPICard = ({ title, value, subtext, isPositive, icon: Icon, color, bgColor, onClick, alertBadge }) => (
  <div 
    onClick={onClick} 
    style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '14px',
      border: '1px solid #E2E8F0',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '12px',
      cursor: 'pointer',
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
      transition: 'all 0.15s ease-in-out',
    }} 
    className="transition-all duration-150 hover:-translate-y-1 hover:shadow-md active:scale-98"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '4px' }}>
          {title}
        </span>
        <div style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', lineHeight: 1.1 }}>
          {value}
        </div>
      </div>
      <div style={{
        width: '42px',
        height: '42px',
        borderRadius: '10px',
        backgroundColor: bgColor,
        color: color,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <Icon size={20} strokeWidth={2.4} />
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          color: isPositive ? '#16A34A' : '#DC2626',
          fontWeight: '700',
        }}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {subtext}
        </span>
      </div>

      {alertBadge && (
        <span style={{
          fontSize: '10.5px',
          fontWeight: '800',
          backgroundColor: '#FEF2F2',
          color: '#DC2626',
          padding: '2px 8px',
          borderRadius: '10px',
          border: '1px solid #FECACA',
        }}>
          Action Required
        </span>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    getInchargeDashboardMetrics, db, getFarmerById, getTankById, getAgentById, 
    getFarmersByInchargeId, getTanksByInchargeId, getMyFarmersByInchargeId, getMyTanksByInchargeId 
  } = useMockData();

  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [selectedMapTank, setSelectedMapTank] = useState(null);
  const [selectedHarvestTank, setSelectedHarvestTank] = useState(null);
  const [selectedModalTank, setSelectedModalTank] = useState(null);
  const [showHarvestedModal, setShowHarvestedModal] = useState(false);
  const [harvestedSearch, setHarvestedSearch] = useState('');
  const [showActiveTanksModal, setShowActiveTanksModal] = useState(false);
  const [activeTanksSearch, setActiveTanksSearch] = useState('');
  const [activeTanksFilter, setActiveTanksFilter] = useState('ALL'); // 'ALL' | 'DUE' | 'OPTIMAL'
  const [tankTab, setTankTab] = useState('ACTIVE'); // 'ACTIVE' | 'HARVESTED'
  const [tankSearch, setTankSearch] = useState('');

  // Weekly Due Tests Breakdown & Routine Schedule Modals
  const [showDueTestsModal, setShowDueTestsModal] = useState(false);
  const [showMyTanksModal, setShowMyTanksModal] = useState(false);
  const [myTanksSearch, setMyTanksSearch] = useState('');
  const [myTanksFilter, setMyTanksFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'DUE' | 'COMPLETED' | 'HARVESTED'
  const [selectedRoutineTank, setSelectedRoutineTank] = useState(null);
  const [isQuickRecordOpen, setIsQuickRecordOpen] = useState(false);
  const [modalInitialTank, setModalInitialTank] = useState(null);
  const [modalInitialType, setModalInitialType] = useState('WATER_QUALITY');

  const metrics = getInchargeDashboardMetrics('INC001');
  
  // Personal farmers and tanks directly under Incharge (INC001)
  const personalFarmers = getMyFarmersByInchargeId ? getMyFarmersByInchargeId('INC001') : [];
  const personalTanks = getMyTanksByInchargeId ? getMyTanksByInchargeId('INC001') : [];

  // Compute weekly routine due status ONLY for Incharge's personal farmers & tanks
  const tanksWithDueInfo = personalTanks.map(tank => {
    const farmer = (personalFarmers || []).find(f => f.id === tank.farmerId) || (db?.farmers || []).find(f => f.id === tank.farmerId) || { name: 'Personal Farmer', location: 'Chinnamiram', phone: '+91 9876543211' };
    const schedule = getTankWeeklySchedule(tank, db?.submissions || []);
    return {
      tank,
      farmer,
      agent: { name: 'Direct Incharge' },
      schedule,
      isDue: !schedule.isAllDone && tank.status !== 'Harvested',
    };
  });

  const dueTanksList = tanksWithDueInfo.filter(t => t.isDue);

  // Full detailed personal tanks assigned by Admin to Incharge
  const personalTanksDetails = personalTanks.map((tank, idx) => {
    const farmer = (personalFarmers || []).find(f => f.id === tank.farmerId) || 
                   (db?.farmers || []).find(f => f.id === tank.farmerId) || 
                   { name: 'Bhaskar Rao', location: 'Bhimavaram Central', phone: '+91 9876543230' };
    const schedule = getTankWeeklySchedule(tank, db?.submissions || []);
    const isHarvested = tank.status === 'Harvested';
    const isDue = !schedule.isAllDone && !isHarvested;
    const isOverdue = tank.testStatus === 'Overdue' && !isHarvested;
    const isCompleted = (schedule.isAllDone || tank.testStatus === 'Completed') && !isHarvested;
    
    const doc = tank.doc || (isHarvested ? 115 : (45 + ((idx * 8) % 40)));
    const abw = tank.abw || (doc >= 80 ? '28.5g' : doc >= 60 ? '21.0g' : '17.5g');
    const biomass = tank.biomass || `${Math.round(parseFloat(abw) * 140)} kg`;
    const fcr = tank.fcr || (isHarvested ? '1.18' : '1.15');
    const size = String(tank.size || tank.acres || '15 Acres').replace(/\s*Acres/gi, '') + ' Acres';
    const species = tank.species || 'SPF Vannamei';

    return {
      tank,
      farmer,
      doc,
      abw,
      biomass,
      fcr,
      size,
      species,
      schedule,
      isHarvested,
      isDue,
      isOverdue,
      isCompleted,
      status: isHarvested ? 'Harvested' : (isOverdue ? 'Overdue' : (isDue ? 'Due' : 'Completed')),
      lastTest: tank.lastTest || '22 Aug 2026',
      nextTest: tank.nextTest || (isHarvested ? 'Cycle Closed' : '29 Aug 2026'),
    };
  });

  const filteredPersonalTanks = personalTanksDetails.filter(item => {
    const q = myTanksSearch.toLowerCase();
    const matchesSearch = 
      (item.tank.name || '').toLowerCase().includes(q) ||
      (item.farmer.name || '').toLowerCase().includes(q) ||
      (item.farmer.location || '').toLowerCase().includes(q);

    if (myTanksFilter === 'ACTIVE') return matchesSearch && !item.isHarvested;
    if (myTanksFilter === 'DUE') return matchesSearch && (item.isDue || item.isOverdue);
    if (myTanksFilter === 'COMPLETED') return matchesSearch && item.isCompleted;
    if (myTanksFilter === 'HARVESTED') return matchesSearch && item.isHarvested;
    return matchesSearch;
  });

  // Mapped live tanks with full aquaculture telemetry for active & harvested breakdown
  const allDashboardTanks = (db?.tanks || []).map((t, idx) => {
    const farmer = getFarmerById(t.farmerId);
    const agent = getAgentById(t.agentId);
    const hasPending = (db?.submissions || []).some(s => s.tankId === t.id && s.status === 'PENDING_VERIFICATION');
    const isHarvested = t.status === 'Harvested';
    let status = isHarvested ? 'Harvested' : (t.testStatus || 'Active');
    if (hasPending) status = 'Pending Verification';

    // Realistically distributed DOC, ABW, Biomass, and FCR
    const doc = t.doc || (isHarvested ? 115 : (35 + ((idx * 16) % 65)));
    const rawAbw = t.abw ? parseFloat(t.abw) : (doc <= 45 ? 12.5 : doc <= 70 ? 18.0 + (idx % 4) : doc <= 90 ? 25.5 + (idx % 5) : 32.0);
    const abw = rawAbw.toFixed(1) + 'g';
    const biomass = t.biomass || `${Math.round(rawAbw * 135 * 0.85)} kg`;
    const baseFcr = isHarvested ? 1.18 : (1.12 + ((idx * 0.04) % 0.24));
    const fcr = t.fcr ? parseFloat(t.fcr).toFixed(2) : baseFcr.toFixed(2);

    return {
      id: t.id,
      farmerId: t.farmerId,
      name: t.name || (t.id ? `Tank ${t.id.replace(/\D/g, '') || '1'}` : 'Tank 1'),
      farmer: farmer ? farmer.name : (t.farmerName || 'Farmer'),
      locality: farmer ? (farmer.location || farmer.village || 'Bhimavaram') : 'Bhimavaram',
      agent: agent ? agent.name : (t.agentId ? 'Assigned Tech' : 'Direct Incharge'),
      size: t.size || (t.acres ? `${t.acres} Acres` : '2.0 Acres'),
      doc: doc,
      abw: abw,
      biomass: biomass,
      fcr: fcr,
      lastTest: t.lastTest || '22 Aug',
      nextDue: t.nextTest || (isHarvested ? 'Cycle Closed' : '29 Aug'),
      status: status,
      isHarvested: isHarvested
    };
  });

  const activeTanksList = allDashboardTanks.filter(t => !t.isHarvested);
  const harvestedTanksList = allDashboardTanks.filter(t => t.isHarvested);

  const filteredActiveTanks = activeTanksList.filter(t => {
    const q = activeTanksSearch.toLowerCase();
    const matchesSearch = 
      t.name.toLowerCase().includes(q) ||
      t.farmer.toLowerCase().includes(q) ||
      t.locality.toLowerCase().includes(q) ||
      t.agent.toLowerCase().includes(q);

    if (activeTanksFilter === 'DUE') return matchesSearch && (t.status === 'Test Due' || t.status === 'Due');
    if (activeTanksFilter === 'OPTIMAL') return matchesSearch && (t.status === 'Active' || t.status === 'Optimal' || t.status === 'Completed');
    return matchesSearch;
  });

  const filteredHarvestedTanks = harvestedTanksList.filter(t =>
    t.name.toLowerCase().includes(harvestedSearch.toLowerCase()) ||
    t.farmer.toLowerCase().includes(harvestedSearch.toLowerCase()) ||
    t.locality.toLowerCase().includes(harvestedSearch.toLowerCase()) ||
    t.agent.toLowerCase().includes(harvestedSearch.toLowerCase())
  );

  const displayedTanks = (tankTab === 'ACTIVE' ? activeTanksList : harvestedTanksList).filter(t =>
    t.name.toLowerCase().includes(tankSearch.toLowerCase()) ||
    t.farmer.toLowerCase().includes(tankSearch.toLowerCase()) ||
    t.locality.toLowerCase().includes(tankSearch.toLowerCase()) ||
    t.agent.toLowerCase().includes(tankSearch.toLowerCase())
  );

  // Map Coordinates for Incharge cluster ponds
  const mapTanks = [
    { id: 'T003', name: 'Tank 1', farmer: 'Ravi', x: 28, y: 35, distance: '450m', status: 'Optimal', due: false, species: 'Vannamei' },
    { id: 'T008', name: 'Tank 1', farmer: 'Siva', x: 72, y: 30, distance: '620m', status: 'Test Due', due: true, species: 'Vannamei' },
    { id: 'T001', name: 'Tank 1', farmer: 'Ashok', x: 35, y: 72, distance: '480m', status: 'Optimal', due: false, species: 'Monodon' },
    { id: 'T002', name: 'Tank 2', farmer: 'Ashok', x: 78, y: 75, distance: '750m', status: 'Optimal', due: false, species: 'Vannamei' },
  ];

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
      const fallback = generateVerifiedFallbackGPS('Chinnamiram, Bhimavaram');
      setGps(fallback);
    } finally {
      setGpsLoading(false);
    }
  };

  return (
    <>
      <InchargeHeader title="Dashboard" />

      <div className="p-3.5 sm:p-5 lg:p-6 max-w-[1440px] mx-auto">
        
        {/* ========================================================= */}
        {/* 0. GPS LOCATION, FARM TANK MAP & THIS WEEK'S WORK CARDS */}
        {/* ========================================================= */}
        <div style={styles.topSectionCards}>
          {/* 1. CURRENT LOCATION CARD */}
          <div style={styles.locationCard}>
            <div style={styles.cardHeaderRow}>
              <div style={styles.locationTag}>
                <MapPin size={14} color="#0018AD" />
                <span>CURRENT LOCATION</span>
              </div>
              <button
                type="button"
                className="transition-all duration-150 hover:bg-indigo-100 active:scale-95 cursor-pointer"
                style={styles.refreshBtn}
                onClick={handleRefreshGPS}
                disabled={gpsLoading}
              >
                <RefreshCw size={12} className={gpsLoading ? 'spin-animation' : ''} />
                <span>{gpsLoading ? 'Locating...' : 'Refresh'}</span>
              </button>
            </div>

            <div style={styles.locationName}>
              {gps?.locality || 'Chinnamiram, Bhimavaram'}
            </div>

            <div style={styles.locationStatusRow}>
              <span style={styles.gpsVerifiedBadge}>
                <Check size={12} color="#15803D" strokeWidth={3} /> GPS Verified
              </span>
              <span style={styles.accuracyText}>
                Accuracy: ±{gps?.accuracy || 79}m
              </span>
            </div>
          </div>

          {/* 2. FARM TANK MAP CARD */}
          <div style={styles.mapCard}>
            <div style={styles.cardHeaderRow}>
              <span style={styles.sectionHeaderSmall}>FARM TANK MAP</span>
            </div>

            <FarmLeafletMap
              gps={gps}
              tanks={mapTanks}
              selectedTank={selectedMapTank}
              onSelectTank={(tank) => setSelectedMapTank(tank)}
            />

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
                    onClick={() => {
                      const tMatch = inchargeTanks.find(t => t.id === selectedMapTank.id) || selectedMapTank;
                      const fMatch = inchargeFarmers.find(f => f.name === selectedMapTank.farmer) || { name: selectedMapTank.farmer };
                      setSelectedRoutineTank({ tank: tMatch, farmer: fMatch });
                    }}
                  >
                    <Eye size={12} /> Schedule
                  </button>

                  <button
                    type="button"
                    className="transition-all duration-150 hover:brightness-110 active:scale-95 cursor-pointer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      backgroundColor: '#1A2FB8',
                      color: '#FFFFFF',
                      border: 'none',
                      height: '32px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      const tMatch = inchargeTanks.find(t => t.id === selectedMapTank.id) || selectedMapTank;
                      setModalInitialTank(tMatch.id);
                      setModalInitialType('WATER_QUALITY');
                      setIsQuickRecordOpen(true);
                    }}
                  >
                    <Plus size={12} strokeWidth={2.6} /> Record
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. THIS WEEK'S WORK CARD */}
          <div style={styles.weekWorkCard}>
            <div style={styles.sectionHeaderSmall}>THIS WEEK'S WORK</div>
            <div style={styles.metricsGrid}>
              <div 
                style={{ ...styles.metricCol, cursor: 'pointer' }}
                onClick={() => navigate('/incharge/my-farmers')}
                className="transition-all hover:bg-slate-50 cursor-pointer"
                title="View My Personal Farmers"
              >
                <span style={styles.metricVal}>{personalFarmers.length}</span>
                <span style={styles.metricLabel}>My Farmers</span>
              </div>

              <div style={styles.metricDivider} />

              <div 
                style={{ 
                  ...styles.metricCol, 
                  cursor: 'pointer',
                  backgroundColor: '#EFF6FF',
                  borderRadius: '10px',
                  padding: '6px 4px',
                  border: '1px solid #DBEAFE',
                }}
                onClick={() => setShowMyTanksModal(true)}
                className="transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Click to view all details of personal tanks assigned by Admin"
              >
                <span style={{ ...styles.metricVal, color: '#1A2FB8' }}>{personalTanks.length}</span>
                <span style={{ ...styles.metricLabel, color: '#1E40AF', fontWeight: '700' }}>My Tanks</span>
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
                title="Click to view weekly due tests for your personal farmers"
              >
                <span style={{ ...styles.metricVal, color: '#D97706' }}>{dueTanksList.length}</span>
                <span style={{ ...styles.metricLabel, color: '#B45309', fontWeight: '700' }}>Tests Due</span>
              </div>
            </div>
          </div>
        </div>
        {/* Top 6 KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <KPICard
            title="Active Tanks" 
            value={activeTanksList.length}
            subtext="In active culture cycle"
            isPositive={true} 
            icon={Droplets} 
            color="#16A34A" 
            bgColor="#DCFCE7"
            onClick={() => setShowActiveTanksModal(true)}
          />
          <KPICard
            title="Harvested Tanks" 
            value={harvestedTanksList.length}
            subtext="Final harvest completed"
            isPositive={true} 
            icon={CheckCircle2} 
            color="#15803D" 
            bgColor="#DCFCE7"
            onClick={() => setShowHarvestedModal(true)}
          />
          <KPICard
            title="Total Farmers" 
            value={(db?.farmers || []).length}
            subtext={`+${metrics.newFarmersMonth || 3} this month`}
            isPositive={true} 
            icon={UserSquare} 
            color="#1A2FB8" 
            bgColor="#EFF6FF"
            onClick={() => navigate('/incharge/farmers')}
          />
          <KPICard
            title="My Agents" 
            value={metrics.totalAgents || 6}
            subtext={`+${metrics.newAgentsMonth || 1} this month`}
            isPositive={true} 
            icon={Users} 
            color="#0284C7" 
            bgColor="#F0F9FF"
            onClick={() => navigate('/incharge/agents')}
          />
          <KPICard
            title="Agent Tests Logged" 
            value={metrics.totalSubmissions || 28}
            subtext="Field tests by technicians"
            isPositive={true} 
            icon={TestTube} 
            color="#0284C7" 
            bgColor="#F0F9FF"
            onClick={() => navigate('/incharge/tests')}
          />
          <KPICard
            title="Overdue Tests" 
            value={metrics.overdueTests || 2}
            subtext="Requires agent reminder"
            isPositive={false} 
            icon={AlertTriangle} 
            color="#DC2626" 
            bgColor="#FEE2E2"
            onClick={() => navigate('/incharge/weekly-tests')}
          />
        </div>

        {/* ========================================================= */}
        {/* 2. WEEKLY TEST PROGRESS SECTION */}
        {/* ========================================================= */}
        <div style={{ marginBottom: '24px' }}>
          {/* Weekly Test Compliance */}
          <div style={styles.chartCard}>
            <div style={styles.cardHeaderRow}>
              <div>
                <h3 style={styles.cardTitle}>Weekly Test Compliance</h3>
                <span style={styles.cardSub}>Current Week Cluster Testing Progress</span>
              </div>
              <span style={{ ...styles.pillTag, backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0' }}>
                78% Completed
              </span>
            </div>

            {/* Progress Bars Breakdown List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '16px' }}>
              
              {/* 1. Completed - 78% */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
                    <span style={{ fontWeight: '700', color: '#0F172A' }}>Completed</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>(1,025 Tests)</span>
                  </div>
                  <span style={{ fontWeight: '800', color: '#16A34A', fontSize: '13.5px' }}>78%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '78%', height: '100%', backgroundColor: '#16A34A', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>

              {/* 2. Due - 14% */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284C7' }} />
                    <span style={{ fontWeight: '700', color: '#0F172A' }}>Due</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>(185 Tests)</span>
                  </div>
                  <span style={{ fontWeight: '800', color: '#0284C7', fontSize: '13.5px' }}>14%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '14%', height: '100%', backgroundColor: '#0284C7', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>

              {/* 3. Overdue - 5% */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
                    <span style={{ fontWeight: '700', color: '#0F172A' }}>Overdue</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>(67 Tests)</span>
                  </div>
                  <span style={{ fontWeight: '800', color: '#DC2626', fontSize: '13.5px' }}>5%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '5%', height: '100%', backgroundColor: '#DC2626', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>

              {/* 4. Scheduled - 3% */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8B5CF6' }} />
                    <span style={{ fontWeight: '700', color: '#0F172A' }}>Scheduled</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>(47 Tests)</span>
                  </div>
                  <span style={{ fontWeight: '800', color: '#8B5CF6', fontSize: '13.5px' }}>3%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '3%', height: '100%', backgroundColor: '#8B5CF6', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>

            </div>

            {/* Footer action link */}
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                Total: <strong>1,324 Cluster Tests</strong>
              </span>
              <button
                type="button"
                onClick={() => navigate('/incharge/weekly-tests')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1A2FB8',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                className="hover:underline cursor-pointer"
              >
                <span>View Full Breakdown</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Harvest Completed Comprehensive Modal */}
      {selectedHarvestTank && (
        <HarvestCompletedModal
          isOpen={Boolean(selectedHarvestTank)}
          onClose={() => setSelectedHarvestTank(null)}
          tank={selectedHarvestTank}
          farmer={getFarmerById(selectedHarvestTank?.farmerId) || { name: selectedHarvestTank?.farmer, location: selectedHarvestTank?.locality }}
        />
      )}

      {/* Active Tank Quick Inspection Modal */}
      {selectedModalTank && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedModalTank(null)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.modalIconBox}>
                  <Droplets size={20} color="#1A2FB8" />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>{selectedModalTank.name}</h3>
                  <p style={styles.modalSub}>{selectedModalTank.farmer} • {selectedModalTank.locality}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModalTank(null)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
              <div style={styles.infoTile}>
                <span style={styles.infoLabel}>Days of Culture (DOC)</span>
                <span style={styles.infoValue}>Day {selectedModalTank.doc}</span>
              </div>
              <div style={styles.infoTile}>
                <span style={styles.infoLabel}>Avg Body Weight</span>
                <span style={{ ...styles.infoValue, color: '#16A34A' }}>{selectedModalTank.abw}</span>
              </div>
              <div style={styles.infoTile}>
                <span style={styles.infoLabel}>Present Biomass</span>
                <span style={styles.infoValue}>{selectedModalTank.biomass}</span>
              </div>
              <div style={styles.infoTile}>
                <span style={styles.infoLabel}>Feed Conversion Ratio</span>
                <span style={{ ...styles.infoValue, color: '#1A2FB8', fontWeight: '800' }}>{selectedModalTank.fcr} FCR</span>
              </div>
              <div style={styles.infoTile}>
                <span style={styles.infoLabel}>Tank Size</span>
                <span style={styles.infoValue}>{selectedModalTank.size}</span>
              </div>
              <div style={styles.infoTile}>
                <span style={styles.infoLabel}>Assigned Technician</span>
                <span style={{ ...styles.infoValue, color: '#1A2FB8' }}>{selectedModalTank.agent}</span>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                style={styles.saveBtn} 
                onClick={() => setSelectedModalTank(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Harvested Tanks Completed List Modal */}
      {showHarvestedModal && (
        <div style={styles.modalBackdrop} onClick={() => setShowHarvestedModal(false)}>
          <div 
            style={{ ...styles.modalCard, maxWidth: '960px' }} 
            onClick={e => e.stopPropagation()}
            className="animate-modal-in"
          >
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ ...styles.modalIconBox, backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>
                    Harvested Tanks — Completed Final Harvest ({harvestedTanksList.length})
                  </h3>
                  <p style={styles.modalSub}>
                    Tanks with final crop drainage, settlement weighment logs, and closed culture cycles
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHarvestedModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Aggregate Stats Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '10px',
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>TOTAL CLOSED TANKS</span>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>{harvestedTanksList.length} Tanks</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>TOTAL REALIZED BIOMASS</span>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1A2FB8' }}>
                  {harvestedTanksList.reduce((sum, t) => sum + (parseFloat(String(t.biomass).replace(/[^0-9.]/g, '')) || 5000), 0).toLocaleString()} kg
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>AVG FINAL WEIGHT</span>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#16A34A' }}>32.2g (~31 count)</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>AVG CYCLE FCR</span>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#D97706' }}>1.17</div>
              </div>
            </div>

            {/* Search Filter */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '8px 12px', backgroundColor: '#FFFFFF' }}>
                <Search size={16} color="#64748B" />
                <input
                  type="text"
                  placeholder="Search harvested tanks by name, farmer, village, or technician..."
                  value={harvestedSearch}
                  onChange={(e) => setHarvestedSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', color: '#0F172A' }}
                />
              </div>
            </div>

            {/* Harvested Tanks Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px', maxHeight: '52vh', overflowY: 'auto' }}>
              {filteredHarvestedTanks.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                  No harvested tanks found matching your search.
                </div>
              ) : (
                filteredHarvestedTanks.map((tank, idx) => (
                  <div 
                    key={tank.id || idx}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Scale size={20} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{tank.name}</span>
                          <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '5px', border: '1px solid #BBF7D0' }}>
                            ✓ Final Harvest Completed
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                          👤 Farmer: <strong>{tank.farmer}</strong> • 📍 {tank.locality} • 📐 {tank.size}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedHarvestTank({
                        ...tank,
                        farmer: tank.farmer,
                        farmerId: tank.farmerId,
                        locality: tank.locality,
                        size: tank.size
                      })}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#1A2FB8',
                        color: '#FFFFFF',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      className="transition-transform active:scale-95 hover:brightness-110 cursor-pointer"
                    >
                      <Scale size={14} />
                      <span>View Harvest Report</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowHarvestedModal(false)}
                style={styles.saveBtn}
              >
                Close List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4.5. ACTIVE TANKS DETAIL MODAL (Opens when clicking Active Tanks) */}
      {/* ========================================================= */}
      {showActiveTanksModal && (
        <div 
          className="animate-backdrop-in"
          style={styles.modalBackdrop} 
          onClick={() => setShowActiveTanksModal(false)}
        >
          <div 
            className="animate-modal-in"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '640px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              backgroundColor: '#FFFFFF',
              gap: '10px',
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: '800', color: '#16A34A', letterSpacing: '0.4px', marginBottom: '2px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  <Droplets size={11} color="#16A34A" style={{ flexShrink: 0 }} /> Live Culture Portfolio
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Active Cultivation Tanks
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#DCFCE7', color: '#15803D', padding: '1px 8px', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                    {activeTanksList.length} Active Tanks
                  </span>
                </div>
                <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0', lineHeight: 1.3 }}>
                  Ponds currently in cultivation with live standing biomass & daily growth monitoring
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowActiveTanksModal(false)}
                style={styles.modalCloseBtn}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick KPI Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #F1F5F9'
            }}>
              <div style={{ backgroundColor: '#FFFFFF', padding: '6px 8px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>TOTAL BIOMASS</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#1A2FB8' }}>
                  {activeTanksList.reduce((sum, t) => sum + (parseFloat(String(t.biomass).replace(/[^0-9.]/g, '')) || 2400), 0).toLocaleString()} kg
                </span>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '6px 8px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>AVG WEIGHT (ABW)</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                  {(activeTanksList.reduce((sum, t) => sum + (parseFloat(String(t.abw).replace(/[^0-9.]/g, '')) || 18.5), 0) / (activeTanksList.length || 1)).toFixed(1)}g
                </span>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '6px 8px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <span style={{ fontSize: '9px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>AVG FEED (FCR)</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#16A34A' }}>
                  {(activeTanksList.reduce((sum, t) => sum + (parseFloat(String(t.fcr).replace(/[^0-9.]/g, '')) || 1.15), 0) / (activeTanksList.length || 1)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Search Filter & Category Tabs */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F8FAFC', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <Search size={14} color="#64748B" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search active tanks by name, farmer, village, or technician..."
                  value={activeTanksSearch}
                  onChange={(e) => setActiveTanksSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '12px', color: '#0F172A', backgroundColor: 'transparent' }}
                />
                {activeTanksSearch && (
                  <button type="button" onClick={() => setActiveTanksSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <X size={13} color="#94A3B8" />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                {[
                  { key: 'ALL', label: `All Active (${activeTanksList.length})` },
                  { key: 'DUE', label: `Tests Due (${activeTanksList.filter(t => t.status === 'Test Due' || t.status === 'Due').length})` },
                  { key: 'OPTIMAL', label: `Optimal / Up to Date (${activeTanksList.filter(t => t.status !== 'Test Due' && t.status !== 'Due').length})` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTanksFilter(tab.key)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: activeTanksFilter === tab.key ? '700' : '600',
                      backgroundColor: activeTanksFilter === tab.key ? '#16A34A' : '#FFFFFF',
                      color: activeTanksFilter === tab.key ? '#FFFFFF' : '#475569',
                      border: activeTanksFilter === tab.key ? '1px solid #16A34A' : '1px solid #CBD5E1',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                    className="transition-all"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tanks List */}
            <div style={{ padding: '12px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, backgroundColor: '#F8FAFC' }}>
              {filteredActiveTanks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <Droplets size={28} color="#94A3B8" style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontWeight: '700', color: '#0F172A', margin: '0 0 2px', fontSize: '13px' }}>No active tanks found</p>
                  <span style={{ fontSize: '12px' }}>No active ponds match your search or filter.</span>
                </div>
              ) : (
                filteredActiveTanks.map((item, idx) => {
                  const isDue = item.status === 'Test Due' || item.status === 'Due';
                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderLeft: `4px solid ${isDue ? '#F59E0B' : '#10B981'}`,
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
                      }}
                    >
                      {/* Row 1: Farmer & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A' }}>
                              {item.farmer}
                            </span>
                            <span style={{ fontSize: '10.5px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
                              Active Crop
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748B', marginTop: '2px', flexWrap: 'wrap' }}>
                            <span>📍 {item.locality}</span>
                            <span>•</span>
                            <span>👤 Tech: <strong>{item.agent}</strong></span>
                          </div>
                        </div>

                        {/* Status Pill */}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: isDue ? '#FEF3C7' : '#DCFCE7',
                          color: isDue ? '#B45309' : '#15803D',
                          border: `1px solid ${isDue ? '#FDE68A' : '#BBF7D0'}`,
                          fontSize: '11px',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          {isDue ? <Clock size={11} /> : <CheckCircle2 size={11} />}
                          {isDue ? 'Test Due' : 'All Tests Up to Date'}
                        </span>
                      </div>

                      {/* Row 2: Pond Specifications & Telemetry */}
                      <div style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Droplets size={13} color="#16A34A" style={{ flexShrink: 0 }} />
                            <strong style={{ fontSize: '13px', color: '#0F172A' }}>{item.name}</strong>
                            <span style={{ fontSize: '11.5px', color: '#64748B' }}>({item.size} • SPF Vannamei)</span>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#16A34A', backgroundColor: '#F0FDF4', padding: '1px 7px', borderRadius: '4px', border: '1px solid #BBF7D0' }}>
                            Day {item.doc} DOC
                          </span>
                        </div>

                        {/* 3-column telemetry */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                          <div style={{ backgroundColor: '#FFFFFF', padding: '5px 4px', borderRadius: '5px', border: '1px solid #EDF2F7', textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Weight (ABW)</div>
                            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A' }}>{item.abw}</div>
                          </div>
                          <div style={{ backgroundColor: '#FFFFFF', padding: '5px 4px', borderRadius: '5px', border: '1px solid #EDF2F7', textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Biomass</div>
                            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A' }}>{item.biomass}</div>
                          </div>
                          <div style={{ backgroundColor: '#FFFFFF', padding: '5px 4px', borderRadius: '5px', border: '1px solid #EDF2F7', textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Feed (FCR)</div>
                            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#16A34A' }}>{item.fcr}</div>
                          </div>
                        </div>

                        {/* Last Sample Info */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: '#64748B' }}>
                          <span>Last Test: <strong style={{ color: '#334155' }}>{item.lastTest}</strong></span>
                          <span>Next Due: <strong style={{ color: isDue ? '#B45309' : '#15803D' }}>{item.nextDue}</strong></span>
                        </div>
                      </div>

                      {/* Row 3: Action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '2px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowActiveTanksModal(false);
                            const tObj = (db?.tanks || []).find(t => t.id === item.id) || { id: item.id, name: item.name };
                            const fObj = (db?.farmers || []).find(f => f.id === item.farmerId || f.name === item.farmer) || { name: item.farmer, locality: item.locality };
                            setSelectedRoutineTank({ tank: tObj, farmer: fObj });
                          }}
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            backgroundColor: '#FFFFFF',
                            color: '#334155',
                            border: '1px solid #CBD5E1',
                            padding: '7px 8px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                          className="transition-all hover:bg-slate-100 active:scale-95"
                        >
                          <Eye size={13} /> View Schedule
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowActiveTanksModal(false);
                            setModalInitialTank(item.id);
                            setModalInitialType('WATER_QUALITY');
                            setIsQuickRecordOpen(true);
                          }}
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            backgroundColor: '#16A34A',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '7px 8px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                          className="transition-all hover:brightness-110 active:scale-95"
                        >
                          <Plus size={13} strokeWidth={2.6} /> Record Test
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                Showing <strong>{filteredActiveTanks.length}</strong> of {activeTanksList.length} active tanks
              </span>
              <button
                type="button"
                style={styles.closeBtnAction} 
                onClick={() => setShowActiveTanksModal(false)}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. DUE TESTS DETAIL MODAL (Opens when clicking Tests Due) */}
      {/* ========================================================= */}
      {showDueTestsModal && (
        <div 
          className="animate-backdrop-in"
          style={styles.modalBackdrop}
          onClick={() => setShowDueTestsModal(false)}
        >
          <div 
            className="animate-modal-in"
            style={{ ...styles.modalCard, maxWidth: '540px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div>
                <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#1A2FB8', letterSpacing: '0.4px', marginBottom: '2px' }}>
                  MY PERSONAL FARMERS • WEEKLY TEST SCHEDULE (MON - SUN)
                </div>
                <h3 style={styles.modalTitle}>
                  My Farmers Due Tests ({dueTanksList.length} Tanks)
                </h3>
              </div>

              <button 
                type="button" 
                style={styles.modalCloseBtn}
                onClick={() => setShowDueTestsModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: 'calc(85vh - 80px)' }}>
              {dueTanksList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={36} color="#16A34A" />
                  <p style={{ margin: '8px 0 0 0', fontWeight: '700', color: '#0F172A' }}>
                    All weekly tests are up to date!
                  </p>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>
                    Great job! All personal farmer tanks under your direct supervision have completed routine tests for this week.
                  </span>
                </div>
              ) : (
                dueTanksList.map((item, idx) => (
                  <div key={item?.tank?.id || idx} style={{
                    backgroundColor: '#FEFCE8',
                    border: '1.5px solid #FEF08A',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
                          {item?.farmer?.name || 'Farmer'} <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>• {item?.farmer?.location || 'Chinnamiram'} • 👤 Direct Incharge</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                          <strong style={{ color: '#0F172A' }}>{item?.tank?.name || `Tank ${idx + 1}`}</strong>
                          <span>•</span>
                          <span>{String(item?.tank?.acres || item?.tank?.size || '2.5').replace(/\s*Acres/gi, '')} Acres</span>
                          <span>•</span>
                          <span style={{ color: '#1A2FB8', fontWeight: '600' }}>{item?.tank?.doc || 77} Days</span>
                        </div>
                      </div>

                      <span style={{
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
                      }}>
                        <Clock size={12} /> {item?.schedule?.dueCount || 0} Tests Due
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      <button
                        type="button"
                        className="transition-all duration-150 hover:bg-slate-100 active:scale-95 cursor-pointer"
                        style={{
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
                        }}
                        onClick={() => {
                          setShowDueTestsModal(false);
                          if (item?.tank) {
                            setSelectedRoutineTank({ tank: item.tank, farmer: item.farmer });
                          }
                        }}
                      >
                        <Eye size={13} /> View Schedule
                      </button>

                      <button
                        type="button"
                        className="transition-all duration-150 hover:brightness-110 active:scale-95 cursor-pointer"
                        style={{
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
                        }}
                        onClick={() => {
                          setShowDueTestsModal(false);
                          if (item?.tank) {
                            setModalInitialTank(item.tank.id);
                            setModalInitialType(item?.schedule?.dueTests?.[0]?.key || 'WATER_QUALITY');
                            setIsQuickRecordOpen(true);
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

      {/* ========================================================= */}
      {/* 5.5 MY ASSIGNED TANKS DETAIL MODAL (Opens from This Week's Work -> My Tanks) */}
      {/* ========================================================= */}
      {showMyTanksModal && (
        <div 
          className="animate-backdrop-in"
          style={styles.modalBackdrop}
          onClick={() => setShowMyTanksModal(false)}
        >
          <div 
            className="animate-modal-in"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              backgroundColor: '#FFFFFF',
              gap: '10px',
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: '800', color: '#1A2FB8', letterSpacing: '0.4px', marginBottom: '2px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  <Shield size={11} style={{ flexShrink: 0 }} /> Direct Incharge Portfolio
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0, whiteSpace: 'nowrap' }}>
                    My Assigned Tanks
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#EFF6FF', color: '#1A2FB8', padding: '1px 7px', borderRadius: '10px', border: '1px solid #BFDBFE', whiteSpace: 'nowrap' }}>
                    {personalTanks.length} Tanks Total
                  </span>
                </div>
                <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0', lineHeight: 1.3 }}>
                  Cultivation tanks assigned directly to you for weekly routine testing
                </p>
              </div>

              <button 
                type="button" 
                style={styles.modalCloseBtn}
                onClick={() => setShowMyTanksModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <Search size={14} color="#64748B" style={{ flexShrink: 0 }} />
                <input 
                  type="text"
                  placeholder="Search farmer, village, or tank name..."
                  value={myTanksSearch}
                  onChange={(e) => setMyTanksSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '12px', color: '#0F172A', backgroundColor: 'transparent' }}
                />
                {myTanksSearch && (
                  <button type="button" onClick={() => setMyTanksSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <X size={13} color="#94A3B8" />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px', WebkitOverflowScrolling: 'touch' }}>
                {[
                  { key: 'ALL', label: `All (${personalTanksDetails.length})` },
                  { key: 'DUE', label: `Due (${personalTanksDetails.filter(t => t.isDue || t.isOverdue).length})` },
                  { key: 'COMPLETED', label: `Up to Date (${personalTanksDetails.filter(t => t.isCompleted).length})` },
                  { key: 'HARVESTED', label: `Harvested (${personalTanksDetails.filter(t => t.isHarvested).length})` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setMyTanksFilter(tab.key)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: myTanksFilter === tab.key ? '700' : '600',
                      backgroundColor: myTanksFilter === tab.key ? '#1A2FB8' : '#FFFFFF',
                      color: myTanksFilter === tab.key ? '#FFFFFF' : '#475569',
                      border: myTanksFilter === tab.key ? '1px solid #1A2FB8' : '1px solid #CBD5E1',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                    className="transition-all"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tanks List Container */}
            <div style={{ padding: '12px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, backgroundColor: '#F8FAFC' }}>
              {filteredPersonalTanks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 16px', color: '#64748B', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <Droplets size={28} color="#94A3B8" style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontWeight: '700', color: '#0F172A', margin: '0 0 2px', fontSize: '13px' }}>No tanks found</p>
                  <span style={{ fontSize: '12px' }}>No assigned tanks match your search or filter.</span>
                </div>
              ) : (
                filteredPersonalTanks.map((item, idx) => {
                  const isHarvest = item.isHarvested;
                  const isDue = item.isDue || item.isOverdue;
                  const borderLeftColor = isHarvest ? '#94A3B8' : (isDue ? '#F59E0B' : '#10B981');

                  return (
                    <div 
                      key={item.tank.id || idx}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderLeft: `4px solid ${borderLeftColor}`,
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                      }}
                    >
                      {/* Top Row: Farmer Identity & Status Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                              {item.farmer.name}
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1A2FB8', border: '1px solid #BFDBFE', whiteSpace: 'nowrap' }}>
                              🛡️ Admin Assigned
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748B', marginTop: '2px', flexWrap: 'wrap' }}>
                            <span>📍 {item.farmer.location || 'Bhimavaram'}</span>
                            <span>•</span>
                            <span>📞 {item.farmer.phone}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isHarvest ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            color: '#475569',
                            fontSize: '11px',
                            fontWeight: '700',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}>
                            <CheckCircle size={11} color="#16A34A" /> Harvested
                          </span>
                        ) : item.isOverdue ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FECACA',
                            color: '#DC2626',
                            fontSize: '11px',
                            fontWeight: '700',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}>
                            <AlertTriangle size={11} /> Overdue
                          </span>
                        ) : item.isDue ? (
                          <span style={{
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
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}>
                            <Clock size={11} /> {item.schedule.dueCount || 7} Tests Due
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#DCFCE7',
                            border: '1px solid #BBF7D0',
                            color: '#15803D',
                            fontSize: '11px',
                            fontWeight: '700',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}>
                            <CheckCircle2 size={11} /> Up to Date
                          </span>
                        )}
                      </div>

                      {/* Middle Strip: Tank Identity & Telemetry Box */}
                      <div style={{
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}>
                        {/* Tank Header Line */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '5px', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flexWrap: 'wrap' }}>
                            <Droplets size={13} color="#1A2FB8" style={{ flexShrink: 0 }} />
                            <strong style={{ fontSize: '13px', color: '#0F172A', whiteSpace: 'nowrap' }}>{item.tank.name}</strong>
                            <span style={{ fontSize: '11.5px', color: '#64748B', whiteSpace: 'nowrap' }}>({item.size} • {item.species})</span>
                          </div>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            color: '#1A2FB8',
                            backgroundColor: '#EFF6FF',
                            padding: '1px 7px',
                            borderRadius: '4px',
                            border: '1px solid #DBEAFE',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}>
                            Day {item.doc} DOC
                          </span>
                        </div>

                        {/* Telemetry Metrics Row (3-box Grid) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                          <div style={{ backgroundColor: '#FFFFFF', padding: '5px 4px', borderRadius: '5px', border: '1px solid #EDF2F7', textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.2px', whiteSpace: 'nowrap' }}>Weight (ABW)</div>
                            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A', marginTop: '1px' }}>{item.abw}</div>
                          </div>

                          <div style={{ backgroundColor: '#FFFFFF', padding: '5px 4px', borderRadius: '5px', border: '1px solid #EDF2F7', textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.2px', whiteSpace: 'nowrap' }}>Biomass</div>
                            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A', marginTop: '1px' }}>{item.biomass}</div>
                          </div>

                          <div style={{ backgroundColor: '#FFFFFF', padding: '5px 4px', borderRadius: '5px', border: '1px solid #EDF2F7', textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.2px', whiteSpace: 'nowrap' }}>Feed (FCR)</div>
                            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#16A34A', marginTop: '1px' }}>{item.fcr}</div>
                          </div>
                        </div>

                        {/* Last Sample Info */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: '#64748B' }}>
                          <span>Last Test: <strong style={{ color: '#334155' }}>{item.lastTest}</strong></span>
                          <span>Next Due: <strong style={{ color: isDue ? '#B45309' : '#15803D' }}>{item.nextTest}</strong></span>
                        </div>
                      </div>

                      {/* Bottom Action Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '2px' }}>
                        <button
                          type="button"
                          className="transition-all duration-150 hover:bg-slate-100 active:scale-95 cursor-pointer"
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            backgroundColor: '#FFFFFF',
                            color: '#334155',
                            border: '1px solid #CBD5E1',
                            padding: '7px 8px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            setShowMyTanksModal(false);
                            setSelectedRoutineTank({ tank: item.tank, farmer: item.farmer });
                          }}
                        >
                          <Eye size={13} /> View Schedule
                        </button>

                        {isHarvest ? (
                          <button
                            type="button"
                            className="transition-all duration-150 hover:bg-slate-100 active:scale-95 cursor-pointer"
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              backgroundColor: '#FFFFFF',
                              color: '#1A2FB8',
                              border: '1px solid #BFDBFE',
                              padding: '7px 8px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              setShowMyTanksModal(false);
                              setSelectedHarvestTank(item.tank);
                              setShowHarvestedModal(true);
                            }}
                          >
                            <Scale size={13} /> Harvest Report
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="transition-all duration-150 hover:brightness-110 active:scale-95 cursor-pointer"
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              backgroundColor: '#1A2FB8',
                              color: '#FFFFFF',
                              border: 'none',
                              padding: '7px 8px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(26, 47, 184, 0.25)',
                            }}
                            onClick={() => {
                              setShowMyTanksModal(false);
                              setModalInitialTank(item.tank.id);
                              setModalInitialType(item.schedule?.dueTests?.[0]?.key || 'WATER_QUALITY');
                              setIsQuickRecordOpen(true);
                            }}
                          >
                            <Plus size={13} strokeWidth={2.6} /> Record Test
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Bottom Footer */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11.5px', color: '#64748B', whiteSpace: 'nowrap' }}>
                Showing <strong>{filteredPersonalTanks.length}</strong> of {personalTanks.length} tanks
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowMyTanksModal(false);
                  navigate('/incharge/my-tanks');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'transparent',
                  color: '#1A2FB8',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                className="hover:underline"
              >
                Go to Full My Tanks Page →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. WEEKLY ROUTINE TEST SCHEDULE MODAL (MATCHING IMAGE 2) */}
      {/* ========================================================= */}
      {selectedRoutineTank && (
        <WeeklyRoutineScheduleModal
          isOpen={Boolean(selectedRoutineTank)}
          onClose={() => setSelectedRoutineTank(null)}
          tank={selectedRoutineTank.tank}
          farmer={selectedRoutineTank.farmer}
        />
      )}

      {/* Quick Record Modal */}
      <QuickRecordModal
        isOpen={isQuickRecordOpen}
        onClose={() => setIsQuickRecordOpen(false)}
        initialType={modalInitialType}
        preselectedTankId={modalInitialTank}
        userRole="INCHARGE"
      />
    </>
  );
};

const styles = {
  topSectionCards: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '16px 20px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  locationTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11.5px',
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
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  locationName: {
    fontSize: '18px',
    fontWeight: '800',
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
    fontSize: '11.5px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  accuracyText: {
    fontSize: '11.5px',
    color: '#64748B',
    fontWeight: '500',
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '16px 20px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionHeaderSmall: {
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
  },
  pondDetailDrawer: {
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    padding: '10px 14px',
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
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#0F172A',
    whiteSpace: 'nowrap',
  },
  tagOptimal: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    padding: '1px 6px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  },
  tagDue: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    padding: '1px 6px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  },
  drawerSub: {
    fontSize: '11.5px',
    color: '#64748B',
    whiteSpace: 'nowrap',
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
    gap: '4px',
    backgroundColor: '#FFFFFF',
    color: '#334155',
    border: '1px solid #CBD5E1',
    height: '32px',
    padding: '0 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  weekWorkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '16px 20px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  metricsGrid: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
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
    fontWeight: '600',
    color: '#64748B',
  },
  metricDivider: {
    width: '1px',
    height: '36px',
    backgroundColor: '#E2E8F0',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '20px 22px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  cardSub: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
    display: 'block',
  },
  pillTag: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  viewAllBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#1A2FB8',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  verificationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
  },
  testIconBadge: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowTitle: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#0F172A',
  },
  rowMeta: {
    fontSize: '11.5px',
    color: '#64748B',
    marginTop: '1px',
  },
  timePendingTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '11px',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: '600',
  },
  reviewActionBtn: {
    padding: '6px 12px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  emptyCard: {
    padding: '24px',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '13px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  activityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    borderBottom: '1px solid #F8FAFC',
  },
  activityAction: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  activityDetail: {
    fontSize: '12px',
    color: '#64748B',
  },
  activityTime: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '500',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    zIndex: 99999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px 16px',
    boxSizing: 'border-box',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    border: '1px solid #E2E8F0',
    boxSizing: 'border-box',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '14px',
    borderBottom: '1px solid #F1F5F9',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  modalSub: {
    fontSize: '12px',
    color: '#64748B',
    margin: '2px 0 0 0',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
  },
  modalIconBox: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoTile: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  infoLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#0F172A',
  },
  saveBtn: {
    padding: '8px 18px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
  }
};

export default Dashboard;

