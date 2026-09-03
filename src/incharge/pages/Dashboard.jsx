import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserSquare, Droplets, TestTube, CheckCircle, AlertTriangle,
  ArrowUpRight, ArrowDownRight, ChevronRight, Clock, ShieldCheck,
  TrendingUp, Activity, FileText, CheckCircle2, AlertCircle, MapPin, RefreshCw, Check, Eye,
  Search, Scale, Fish, Layers, Sparkles, X
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import FarmLeafletMap from '../../agent/components/FarmLeafletMap';
import HarvestCompletedModal from '../components/HarvestCompletedModal';
import { getStoredGPS, captureDeviceGPS, generateVerifiedFallbackGPS } from '../../agent/utils/gpsService';

const COMPLIANCE_COLORS = ['#16A34A', '#D97706', '#DC2626', '#64748B'];

const mockTrendData = [
  { name: '20', fullDate: '20 Aug', tests: 600 },
  { name: '21', fullDate: '21 Aug', tests: 650 },
  { name: '22', fullDate: '22 Aug', tests: 680 },
  { name: '23', fullDate: '23 Aug', tests: 700 },
  { name: '24', fullDate: '24 Aug', tests: 740 },
  { name: '25', fullDate: '25 Aug', tests: 760 },
  { name: '26', fullDate: '26 Aug', tests: 810 },
];

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
  const { getInchargeDashboardMetrics, db, getFarmerById, getTankById, getAgentById, getFarmersByInchargeId, getTanksByInchargeId } = useMockData();

  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [selectedMapTank, setSelectedMapTank] = useState(null);
  const [selectedHarvestTank, setSelectedHarvestTank] = useState(null);
  const [selectedModalTank, setSelectedModalTank] = useState(null);
  const [tankTab, setTankTab] = useState('ACTIVE'); // 'ACTIVE' | 'HARVESTED'
  const [tankSearch, setTankSearch] = useState('');

  const metrics = getInchargeDashboardMetrics('INC001');
  const inchargeFarmers = getFarmersByInchargeId ? getFarmersByInchargeId('INC001') : (db?.farmers || []);
  const inchargeTanks = getTanksByInchargeId ? getTanksByInchargeId('INC001') : (db?.tanks || []);

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

  const pendingVerifications = (db?.submissions || [])
    .filter(s => s.status === 'PENDING_VERIFICATION')
    .slice(0, 4)
    .map(s => {
      const farmer = getFarmerById(s.farmerId);
      const tank = getTankById(s.tankId);
      const agent = getAgentById(s.agentId);
      const farmerName = farmer ? farmer.name : (s.farmerName || 'Ravi');
      const tankName = tank ? tank.name : (s.tankName ? s.tankName : (s.tankId ? `Tank ${s.tankId.replace(/\D/g, '') || '1'}` : 'Tank 1'));
      const agentName = agent ? agent.name : 'Agent A';
      return {
        id: s.id,
        farmer: farmerName,
        tank: tankName,
        testType: s.testType || 'Water Analysis',
        date: s.date || 'Today',
        agent: agentName,
        submitted: s.submittedAgo || '10 mins ago',
        status: s.status
      };
    });

  const recentActivities = [
    { id: 1, action: 'Water Quality Logged', detail: 'Agent A • Ravi (Tank 3)', time: '10 mins ago', type: 'WATER' },
    { id: 2, action: 'Feed Consumption Recorded', detail: 'Agent A • Siva (Tank 8)', time: '25 mins ago', type: 'FEED' },
    { id: 3, action: 'Weekly Audit Completed', detail: 'Agent B • Nagesh (Tank 1)', time: '1 hour ago', type: 'TEST' },
    { id: 4, action: 'Biomass Sampling Verified', detail: 'Incharge M. Srinivas • Ravi (Tank 1)', time: '2 hours ago', type: 'VERIFY' },
  ];

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
                    onClick={() => navigate('/incharge/tanks')}
                  >
                    <Eye size={12} /> View Tanks
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. THIS WEEK'S WORK CARD */}
          <div style={styles.weekWorkCard}>
            <div style={styles.sectionHeaderSmall}>THIS WEEK'S WORK</div>
            <div style={styles.metricsGrid}>
              <div style={styles.metricCol}>
                <span style={styles.metricVal}>{inchargeFarmers.length || 6}</span>
                <span style={styles.metricLabel}>Farmers</span>
              </div>
              <div style={styles.metricDivider} />
              <div style={styles.metricCol}>
                <span style={styles.metricVal}>{inchargeTanks.length || 6}</span>
                <span style={styles.metricLabel}>Tanks</span>
              </div>
              <div style={styles.metricDivider} />
              <div style={styles.metricCol}>
                <span style={{ ...styles.metricVal, color: '#D97706' }}>{metrics.overdueTests || 2}</span>
                <span style={styles.metricLabel}>Tests Due</span>
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
            onClick={() => navigate('/incharge/tanks')}
          />
          <KPICard
            title="Harvested Tanks" 
            value={harvestedTanksList.length}
            subtext="Completed crop cycles"
            isPositive={true} 
            icon={CheckCircle2} 
            color="#334155" 
            bgColor="#F1F5F9"
            onClick={() => navigate('/incharge/tanks')}
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
        {/* 2. CHARTS SECTION */}
        {/* ========================================================= */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px', 
          marginBottom: '24px' 
        }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              
              {/* 1. Completed - 78% */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
                    <span style={{ fontWeight: '700', color: '#0F172A' }}>Completed</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>(1,025 Tests)</span>
                  </div>
                  <span style={{ fontWeight: '800', color: '#16A34A', fontSize: '13.5px' }}>78%</span>
                </div>
                <div style={{ width: '100%', height: '9px', backgroundColor: '#F1F5F9', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: '78%', height: '100%', backgroundColor: '#16A34A', borderRadius: '5px', transition: 'width 0.5s ease' }} />
                </div>
              </div>

              {/* 2. Due - 14% */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284C7' }} />
                    <span style={{ fontWeight: '700', color: '#0F172A' }}>Due</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>(185 Tests)</span>
                  </div>
                  <span style={{ fontWeight: '800', color: '#0284C7', fontSize: '13.5px' }}>14%</span>
                </div>
                <div style={{ width: '100%', height: '9px', backgroundColor: '#F1F5F9', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: '14%', height: '100%', backgroundColor: '#0284C7', borderRadius: '5px', transition: 'width 0.5s ease' }} />
                </div>
              </div>

              {/* 3. Overdue - 5% */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
                    <span style={{ fontWeight: '700', color: '#0F172A' }}>Overdue</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>(67 Tests)</span>
                  </div>
                  <span style={{ fontWeight: '800', color: '#DC2626', fontSize: '13.5px' }}>5%</span>
                </div>
                <div style={{ width: '100%', height: '9px', backgroundColor: '#F1F5F9', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: '5%', height: '100%', backgroundColor: '#DC2626', borderRadius: '5px', transition: 'width 0.5s ease' }} />
                </div>
              </div>

              {/* 4. Scheduled - 3% */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8B5CF6' }} />
                    <span style={{ fontWeight: '700', color: '#0F172A' }}>Scheduled</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>(47 Tests)</span>
                  </div>
                  <span style={{ fontWeight: '800', color: '#8B5CF6', fontSize: '13.5px' }}>3%</span>
                </div>
                <div style={{ width: '100%', height: '9px', backgroundColor: '#F1F5F9', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: '3%', height: '100%', backgroundColor: '#8B5CF6', borderRadius: '5px', transition: 'width 0.5s ease' }} />
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

          {/* Tests Trend (Last 7 Days) */}
          <div style={styles.chartCard}>
            <div style={styles.cardHeaderRow}>
              <div>
                <h3 style={styles.cardTitle}>Tests Trend (Last 7 Days)</h3>
                <span style={styles.cardSub}>Daily submissions recorded by field technicians</span>
              </div>
              <span style={{ ...styles.pillTag, backgroundColor: '#EFF6FF', color: '#1A2FB8' }}>
                Active Cycle
              </span>
            </div>

            <div style={{ height: '260px', width: '100%', marginTop: '12px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockTrendData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="testsTrendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A2FB8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1A2FB8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={{ stroke: '#E2E8F0' }} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} 
                    dy={6} 
                  />
                  <YAxis 
                    domain={[550, 850]}
                    ticks={[600, 650, 700, 750, 800]}
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }} 
                  />
                  <RechartsTooltip 
                    formatter={(val) => [`${val} Tests Logged`, 'Tests']}
                    labelFormatter={(label, payload) => payload && payload[0] ? `Date: ${payload[0].payload.fullDate}` : `Day ${label}`}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 8px 20px rgba(0,0,0,0.06)', fontWeight: 600 }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tests" 
                    stroke="#1A2FB8" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#testsTrendGradient)" 
                    dot={{ r: 5, fill: '#FFFFFF', stroke: '#1A2FB8', strokeWidth: 2.5 }}
                    activeDot={{ r: 7, fill: '#1A2FB8', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. RECENT AGENT SUBMISSIONS & RECENT ACTIVITY SECTION */}
        {/* ========================================================= */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px' 
        }}>
          {/* Recent Agent Submissions */}
          <div style={styles.chartCard}>
            <div style={styles.cardHeaderRow}>
              <div>
                <h3 style={styles.cardTitle}>Recent Agent Submissions</h3>
                <span style={styles.cardSub}>Field tests & culture logs submitted by technicians</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/incharge/tests')}
                style={styles.viewAllBtn}
              >
                <span>View Full History</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
              {pendingVerifications.length === 0 ? (
                <div style={styles.emptyCard}>
                  <CheckCircle2 size={24} color="#16A34A" />
                  <span>No recent agent field submissions.</span>
                </div>
              ) : (
                pendingVerifications.map(item => (
                  <div 
                    key={item.id} 
                    style={styles.verificationRow}
                    onClick={() => navigate('/incharge/tests')}
                    className="transition-all duration-150 hover:bg-slate-50 cursor-pointer"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={styles.testIconBadge}>
                        <TestTube size={16} color="#1A2FB8" />
                      </div>
                      <div>
                        <div style={styles.rowTitle}>{item.farmer} • {item.tank}</div>
                        <div style={styles.rowMeta}>
                          {item.testType} • Logged by <strong>{item.agent}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={styles.timePendingTag}>
                        <Clock size={11} /> {item.submitted}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/incharge/tests');
                        }}
                        style={styles.reviewActionBtn}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={styles.chartCard}>
            <div style={styles.cardHeaderRow}>
              <div>
                <h3 style={styles.cardTitle}>Recent Activity</h3>
                <span style={styles.cardSub}>Live operations timeline across cluster</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/incharge/activity-log')}
                style={styles.viewAllBtn}
              >
                <span>Full Audit Log</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
              {recentActivities.map((act) => (
                <div key={act.id} style={styles.activityRow}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: act.type === 'WATER' ? '#EFF6FF' : act.type === 'FEED' ? '#FEF3C7' : '#F0FDF4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {act.type === 'WATER' ? <Droplets size={16} color="#1A2FB8" /> :
                     act.type === 'FEED' ? <Activity size={16} color="#D97706" /> :
                     <CheckCircle size={16} color="#16A34A" />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={styles.activityAction}>{act.action}</div>
                    <div style={styles.activityDetail}>{act.detail}</div>
                  </div>

                  <span style={styles.activityTime}>{act.time}</span>
                </div>
              ))}
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
                <span style={styles.infoLabel}>Pond Size</span>
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

