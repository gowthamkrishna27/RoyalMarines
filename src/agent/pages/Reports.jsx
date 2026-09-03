import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, FileSpreadsheet, Fish, Scale, Droplets, 
  Filter, TrendingUp, ChevronDown, CheckCircle2, UserCheck, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { getSession } from '../utils/agentAuth';
import { useMockData } from '../../context/MockDataContext';
import { 
  downloadAquaEnterpriseWorkbook, 
  downloadSamplingExcel, 
  downloadHarvestMasterExcel,
  downloadWaterQualityExcel
} from '../../utils/excelReportGenerator';

const Reports = () => {
  const navigate = useNavigate();
  const session = getSession();
  const { db } = useMockData();

  const [selectedFarmerId, setSelectedFarmerId] = useState('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!session) {
      navigate('/login');
    }
  }, [session, navigate]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session || !db) return null;

  const agentId = session.agentId || 'agent001';
  const farmers = db.farmers || [];
  const submissions = db.submissions || [];
  const allTanks = db.tanks || [];

  const relevantTanks = selectedFarmerId === 'ALL' 
    ? allTanks 
    : allTanks.filter(t => t.farmerId === selectedFarmerId);
  const activeTanksCount = relevantTanks.filter(t => t.status !== 'INACTIVE').length || 14;

  const relevantSubmissions = selectedFarmerId === 'ALL'
    ? submissions
    : submissions.filter(s => s.farmerId === selectedFarmerId);
  const totalTestsCount = relevantSubmissions.length > 0 ? (relevantSubmissions.length + 38) : 52;

  // Clean Water Parameter Chart Data
  const waterQualityChartData = [
    { day: 'Mon', do: 5.4, ph: 7.8 },
    { day: 'Tue', do: 5.8, ph: 7.9 },
    { day: 'Wed', do: 5.2, ph: 7.7 },
    { day: 'Thu', do: 5.6, ph: 8.0 },
    { day: 'Fri', do: 6.0, ph: 7.9 },
    { day: 'Sat', do: 5.7, ph: 7.8 },
    { day: 'Sun', do: 5.9, ph: 7.9 },
  ];

  // Category Distribution
  const categories = [
    { name: 'Water Quality', count: 14, percent: 39, color: '#0018AD' },
    { name: 'Feed Tests', count: 8, percent: 22, color: '#D97706' },
    { name: 'Weekly Sampling', count: 6, percent: 17, color: '#2563EB' },
    { name: 'Farm Activity', count: 5, percent: 14, color: '#059669' },
    { name: 'Disease Observation', count: 3, percent: 8, color: '#DC2626' },
  ];

  // Export handlers
  const handleExportFullWorkbook = () => {
    setIsDropdownOpen(false);
    setIsExporting(true);
    setTimeout(() => {
      downloadAquaEnterpriseWorkbook(db, agentId, selectedFarmerId, 'Royals_Marine_Complete_Report');
      setIsExporting(false);
    }, 200);
  };

  const handleExportSampling = () => {
    setIsDropdownOpen(false);
    setIsExporting(true);
    setTimeout(() => {
      downloadSamplingExcel(db, agentId, selectedFarmerId);
      setIsExporting(false);
    }, 200);
  };

  const handleExportHarvest = () => {
    setIsDropdownOpen(false);
    setIsExporting(true);
    setTimeout(() => {
      downloadHarvestMasterExcel(db, agentId);
      setIsExporting(false);
    }, 200);
  };

  const handleExportWater = () => {
    setIsDropdownOpen(false);
    setIsExporting(true);
    setTimeout(() => {
      downloadWaterQualityExcel(db);
      setIsExporting(false);
    }, 200);
  };

  return (
    <div style={styles.container}>
      {/* 1. Header Row with Action Dropdown */}
      <div style={styles.headerRow}>
        <div>
          <span style={styles.headerTag}>EXCEL AUDIT & OPERATIONS REPORTS</span>
          <h1 style={styles.headerTitle}>Field Reports Center</h1>
        </div>

        {/* Dropdown Action Button & Filter */}
        <div style={styles.headerActions}>
          <div style={styles.filterWrap}>
            <Filter size={14} color="#64748B" />
            <select
              value={selectedFarmerId}
              onChange={(e) => setSelectedFarmerId(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="ALL">All Farmers ({farmers.length})</option>
              {farmers.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Report Download Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="transition-all duration-150 hover:brightness-110 active:scale-95 cursor-pointer"
              style={styles.dropdownTriggerBtn}
              onClick={() => setIsDropdownOpen(prev => !prev)}
              disabled={isExporting}
            >
              <FileSpreadsheet size={16} strokeWidth={2.4} />
              <span>{isExporting ? 'Generating Excel...' : 'Download Reports'}</span>
              <ChevronDown 
                size={16} 
                style={{ 
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.2s ease' 
                }} 
              />
            </button>

            {isDropdownOpen && (
              <div style={styles.dropdownMenu}>
                <div style={styles.dropdownHeader}>SELECT EXCEL REPORT TO DOWNLOAD</div>
                
                {/* 1. Export Complete Excel */}
                <button
                  type="button"
                  className="transition-all duration-150 hover:bg-slate-50 active:scale-98 cursor-pointer"
                  style={styles.dropdownItem}
                  onClick={handleExportFullWorkbook}
                >
                  <div style={{ ...styles.itemIconWrap, backgroundColor: '#EFF6FF', color: '#1A2FB8' }}>
                    <FileSpreadsheet size={18} strokeWidth={2.2} />
                  </div>
                  <div style={styles.itemContent}>
                    <div style={styles.itemTitle}>Export Complete Excel (.xlsx)</div>
                    <div style={styles.itemSub}>Bundles Sampling, Harvest Master & Water Analysis</div>
                  </div>
                </button>

                {/* 2. Weekly Sampling & Growth Sheet */}
                <button
                  type="button"
                  className="transition-all duration-150 hover:bg-slate-50 active:scale-98 cursor-pointer"
                  style={styles.dropdownItem}
                  onClick={handleExportSampling}
                >
                  <div style={{ ...styles.itemIconWrap, backgroundColor: '#FEF3C7', color: '#D97706' }}>
                    <Fish size={18} strokeWidth={2.2} />
                  </div>
                  <div style={styles.itemContent}>
                    <div style={styles.itemTitle}>Weekly Sampling & Growth Sheet</div>
                    <div style={styles.itemSub}>23 Columns: Density, ADG, ABW, Biomass, FCR</div>
                  </div>
                </button>

                {/* 3. Harvest Master & Pond Performance */}
                <button
                  type="button"
                  className="transition-all duration-150 hover:bg-slate-50 active:scale-98 cursor-pointer"
                  style={styles.dropdownItem}
                  onClick={handleExportHarvest}
                >
                  <div style={{ ...styles.itemIconWrap, backgroundColor: '#DCFCE7', color: '#15803D' }}>
                    <Scale size={18} strokeWidth={2.2} />
                  </div>
                  <div style={styles.itemContent}>
                    <div style={styles.itemTitle}>Harvest Master & Pond Performance</div>
                    <div style={styles.itemSub}>30 Columns: Partial/Final Harvest, Survival % & FCR</div>
                  </div>
                </button>

                {/* 4. Water Quality Analysis Register */}
                <button
                  type="button"
                  className="transition-all duration-150 hover:bg-slate-50 active:scale-98 cursor-pointer"
                  style={styles.dropdownItem}
                  onClick={handleExportWater}
                >
                  <div style={{ ...styles.itemIconWrap, backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                    <Droplets size={18} strokeWidth={2.2} />
                  </div>
                  <div style={styles.itemContent}>
                    <div style={styles.itemTitle}>Water Quality Analysis Register</div>
                    <div style={styles.itemSub}>20 Columns: Salinity, pH, Alkalinity, DO, Nitrite, K</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Operations Overview Key Metrics Widget (Image 1) */}
      <div style={styles.card}>
        <div style={styles.metricsGrid}>
          <div style={styles.metricCol}>
            <span style={styles.metricValBlue}>{totalTestsCount}</span>
            <span style={styles.metricLabel}>Total Tests</span>
          </div>
          <div style={styles.metricDivider} />
          <div style={styles.metricCol}>
            <span style={styles.metricValGreen}>96.8%</span>
            <span style={styles.metricLabel}>Pass Rate</span>
          </div>
          <div style={styles.metricDivider} />
          <div style={styles.metricCol}>
            <span style={styles.metricValBlue}>{activeTanksCount}</span>
            <span style={styles.metricLabel}>Active Tanks</span>
          </div>
        </div>
      </div>

      {/* 3. Analytics & Operational Parameters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '14px' }}>
        {/* Water Quality Trends Area Chart */}
        <div style={styles.card}>
          <div style={styles.chartHeaderRow}>
            <div>
              <div style={styles.sectionHeaderSmall}>WATER QUALITY PARAMETERS</div>
              <div style={styles.chartSub}>Weekly Dissolved Oxygen (DO) & pH Trends</div>
            </div>

            <div style={styles.legendRow}>
              <span style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#0018AD' }} /> DO (mg/L)
              </span>
              <span style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#10B981' }} /> pH
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '190px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={waterQualityChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="cleanDo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0018AD" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0018AD" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="cleanPh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[4, 9]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    borderRadius: '8px', 
                    border: 'none', 
                    color: '#FFFFFF',
                    fontSize: '11px',
                    padding: '6px 10px'
                  }} 
                />
                <Area type="monotone" dataKey="do" stroke="#0018AD" strokeWidth={2} fillOpacity={1} fill="url(#cleanDo)" />
                <Area type="monotone" dataKey="ph" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#cleanPh)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Test Breakdown Progress Stack */}
        <div style={styles.card}>
          <div style={styles.sectionHeaderSmall}>TEST BREAKDOWN BY CATEGORY</div>
          <div style={styles.categoryStack}>
            {categories.map((cat) => (
              <div key={cat.name} style={styles.categoryRow}>
                <div style={styles.categoryLabelRow}>
                  <span style={styles.catName}>{cat.name}</span>
                  <span style={styles.catCount}>{cat.count} tests ({cat.percent}%)</span>
                </div>
                <div style={styles.progressBarBg}>
                  <div style={{
                    ...styles.progressBarFill,
                    width: `${cat.percent}%`,
                    backgroundColor: cat.color,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    width: '100%',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  headerTag: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.4px',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0F172A',
    margin: '1px 0 0 0',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  filterWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '0 10px',
    height: '42px',
  },
  filterSelect: {
    height: '100%',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#0F172A',
    outline: 'none',
    cursor: 'pointer',
  },
  dropdownTriggerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    height: '42px',
    padding: '0 18px',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 3px 10px rgba(26, 47, 184, 0.25)',
    whiteSpace: 'nowrap',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 'min(360px, calc(100vw - 32px))',
    maxWidth: 'calc(100vw - 32px)',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '14px',
    boxShadow: '0 14px 40px rgba(0, 0, 0, 0.16)',
    zIndex: 1000,
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    boxSizing: 'border-box',
  },
  dropdownHeader: {
    fontSize: '10px',
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: '0.5px',
    padding: '6px 8px 4px 8px',
    textTransform: 'uppercase',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
  },
  itemIconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemContent: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flex: 1,
  },
  itemTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 1.3,
  },
  itemSub: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '2px',
    lineHeight: 1.3,
  },
  metricsGrid: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '4px 0',
    width: '100%',
  },
  metricCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    textAlign: 'center',
  },
  metricValBlue: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#0018AD',
    lineHeight: 1.1,
    letterSpacing: '-0.5px',
  },
  metricValGreen: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#16A34A',
    lineHeight: 1.1,
    letterSpacing: '-0.5px',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '600',
    marginTop: '6px',
    whiteSpace: 'nowrap',
  },
  metricDivider: {
    width: '1px',
    height: '38px',
    backgroundColor: '#E2E8F0',
    flexShrink: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionHeaderSmall: {
    fontSize: '11.5px',
    fontWeight: '800',
    color: '#475569',
    letterSpacing: '0.4px',
  },
  chartSub: {
    fontSize: '11.5px',
    color: '#64748B',
    marginTop: '2px',
  },
  chartHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#475569',
  },
  legendDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
  },
  categoryStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '4px',
  },
  categoryRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  categoryLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0F172A',
  },
  catCount: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '500',
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.4s ease',
  },
};

export default Reports;
