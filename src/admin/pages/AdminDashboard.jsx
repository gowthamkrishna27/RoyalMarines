import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tractor, Box, TrendingUp, Activity, ShieldCheck,
  AlertCircle, ArrowUpRight, MapPin, Database, Archive,
  Search, X
} from 'lucide-react';

import { useMockData } from '../../context/MockDataContext';
import { getRegions } from '../utils/adminMockData';
import HarvestedTanksModal from '../components/HarvestedTanksModal';
import GPSRouteTracking from './GPSRouteTracking';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const mockData = useMockData();
  const db = mockData?.db;
  const regions = getRegions();

  // Real or fallback statistics aligned with the dashboard design
  const totalFarmers = db?.farmers?.length || 8;
  const totalTanks = db?.tanks?.length || 15;
  const activeTanks = 11;
  const harvestedTanks = totalTanks - activeTanks;
  const totalRegionsCount = regions.length || 3;
  const totalLocalitiesCount = regions.reduce((acc, r) => acc + (r.localities?.length || 0), 0) || 72;
  const overdueTests = 3;

  // 1. Donut chart distribution data
  const tankStatusData = [
    { name: 'Active', value: 65, color: '#10b981' },
    { name: 'Harvested', value: 10, color: '#6366f1' },
    { name: 'Maintenance', value: 25, color: '#d97706' }
  ];

  // 2. FCR & ABW Trend Data (DOC 10 to 70)
  const fcrTrendData = [
    { doc: 10, fcr: 0.92, abw: 3.2 },
    { doc: 20, fcr: 1.03, abw: 6.8 },
    { doc: 30, fcr: 1.16, abw: 11.4 },
    { doc: 40, fcr: 1.33, abw: 16.2 },
    { doc: 50, fcr: 1.55, abw: 20.8 },
    { doc: 60, fcr: 1.90, abw: 24.5 },
    { doc: 70, fcr: 2.18, abw: 28.1 }
  ];

  // 3. Feed Intake vs Biomass Growth (kg)
  const feedVsBiomassData = [
    { doc: 10, feed: 180, biomass: 220 },
    { doc: 20, feed: 350, biomass: 380 },
    { doc: 30, feed: 850, biomass: 750 },
    { doc: 40, feed: 1600, biomass: 1200 },
    { doc: 50, feed: 2700, biomass: 1650 },
    { doc: 60, feed: 4100, biomass: 2150 },
    { doc: 70, feed: 6000, biomass: 2750 }
  ];

  // 4. Data-driven operational recommendations
  const recommendations = [
    {
      id: 1,
      type: 'CRITICAL',
      title: 'Tank 2 - Nellore Coastal Belt (V. Subba Rao)',
      desc: 'Dissolved Oxygen dropped below 3.2 mg/L at 04:30 AM. Auto-aeration backup engaged. Immediate water exchange recommended.',
      tag: 'CRITICAL ACTION REQUIRED',
      tagColor: '#ef4444',
      tagBg: '#fee2e2',
      borderLeft: '#ef4444'
    },
    {
      id: 2,
      type: 'OPTIMIZATION',
      title: 'Tank 1 - Bhimavaram Aqua Zone (Imported Test Farmer 2)',
      desc: 'Target ABW reached 28.5g with FCR stable at 1.22. Market price peak window is active for next 48 hours for harvest.',
      tag: 'HARVEST READY • PROFIT OPTIMIZATION',
      tagColor: '#16a34a',
      tagBg: '#dcfce7',
      borderLeft: '#16a34a'
    },
    {
      id: 3,
      type: 'FEED',
      title: 'Kavali Delta Cluster (3 Active Tanks)',
      desc: 'Tank temperature trending at 31.8°C. Feed conversion slowing. Recommend reducing noon ration by 10% to prevent bottom wastage.',
      tag: 'FEED EFFICIENCY CALIBRATION',
      tagColor: '#d97706',
      tagBg: '#fef3c7',
      borderLeft: '#f59e0b'
    }
  ];
  // Harvest Records History State
  const [harvestRecords, setHarvestRecords] = useState([
    { id: 'REC-3', doc: 60, date: 'Mar 1, 2026', type: 'Partial Harvest', fcr: '1.90', abw: '24.5g', farmerName: 'Ashok', name: 'Tank 1' },
    { id: 'REC-2', doc: 45, date: 'Feb 15, 2026', type: 'Partial Harvest', fcr: '1.45', abw: '18.2g', farmerName: 'Ashok', name: 'Tank 1' },
    { id: 'REC-1', doc: 30, date: 'Jan 31, 2026', type: 'Normal', fcr: '1.16', abw: '11.4g', farmerName: 'Ashok', name: 'Tank 1' }
  ]);
  const [docInput, setDocInput] = useState('');
  const [showHarvestedModal, setShowHarvestedModal] = useState(false);

  const handleAddRecord = () => {
    if (!docInput) return;
    const docValue = parseInt(docInput);
    if (isNaN(docValue)) return;

    const newRecord = {
      id: `REC-${Date.now()}`,
      doc: docValue,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'Record',
      fcr: (1.1 + (docValue * 0.012)).toFixed(2),
      abw: `${(docValue * 0.4).toFixed(1)}g`,
      farmerName: 'Ashok',
      name: 'Tank 1',
      isNew: true
    };

    setHarvestRecords(prev => [newRecord, ...prev]);
    setDocInput('');
  };





  return (
    <div style={styles.dashboardContainer}>
      {/* 1. Hero / Control Center Banner */}
      <div style={styles.heroBanner}>
        <div style={styles.heroLeft}>
          <div style={styles.heroBadge}>
            ORGANIZATION-WIDE CONTROL CENTER
          </div>
          <h1 style={styles.heroTitle}>
            Royal's Marine Operational Dashboard
          </h1>
          <p style={styles.heroSubtitle}>
            Real-time feed performance, FCR analytics, crop health, and multi-region operations.
          </p>
        </div>
      </div>

      {/* 2. KPI Stat Cards Row (6 Cards) */}
      <div style={styles.kpiGrid}>
        {/* Card 1: Total Farmers */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>TOTAL FARMERS</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Tractor size={18} />
            </div>
          </div>
          <div style={styles.kpiValue}>{totalFarmers}</div>
          <div
            style={styles.kpiLink}
            onClick={() => navigate('/admin/farmers')}
          >
            <span>View All Farmers</span>
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* Card 2: Total Tanks */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>TOTAL TANKS</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Database size={18} />
            </div>
          </div>
          <div style={styles.kpiValue}>{totalTanks}</div>
          <div
            style={styles.kpiLink}
            onClick={() => navigate('/admin/tanks')}
          >
            <span>View All Tanks</span>
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* Card 3: Active Tanks */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>ACTIVE TANKS</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Box size={18} />
            </div>
          </div>
          <div style={styles.kpiValue}>{activeTanks}</div>
          <div
            style={styles.kpiLink}
            onClick={() => navigate('/admin/tanks')}
          >
            <span>View Active</span>
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* Card 4: Harvested Tanks */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>HARVESTED TANKS</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>
              <Archive size={18} />
            </div>
          </div>
          <div style={styles.kpiValue}>{harvestedTanks}</div>
          <div
            style={{ ...styles.kpiLink, color: '#8b5cf6' }}
            onClick={() => setShowHarvestedModal(true)}
          >
            <span>View Harvested</span>
            <ArrowUpRight size={14} />
          </div>
        </div>


        {/* Card 4: Average ABW */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>AVERAGE ABW</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#f8fafc', color: '#64748b' }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={styles.kpiValue}>16.4g</div>
          <div style={styles.kpiSubtext}>Mean Body Weight</div>
        </div>

        {/* Card 5: Regions & Localities */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>REGIONS &amp; LOCALITIES</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <MapPin size={18} />
            </div>
          </div>
          <div style={styles.kpiValue}>{totalRegionsCount} Regions</div>
          <div
            style={{ ...styles.kpiLink, color: '#2563eb' }}
            onClick={() => navigate('/admin/regions')}
            title="Explore all 3 Regions and 72 Localities in Andhra Pradesh"
          >
            <span>View Regions &amp; Localities</span>
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* Card 6: Overdue Tests */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>OVERDUE TESTS</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <AlertCircle size={18} />
            </div>
          </div>
          <div style={{ ...styles.kpiValue, color: '#dc2626' }}>{overdueTests}</div>
          <div
            style={{ ...styles.kpiLink, color: '#dc2626' }}
            onClick={() => navigate('/admin/weekly-tests')}
          >
            <span>Take Action</span>
            <ArrowUpRight size={14} />
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Tank Status Distribution + Data-Driven Recommendations */}
      <div style={styles.middleGrid}>
        {/* Left: FCR Data Filter by DOC Widget (Replaced Donut Chart) */}
        <div style={styles.donutCard}>
          <div style={styles.filterHeader}>
            <div style={styles.filterTitleRow}>
              <TrendingUp size={20} color="#2563eb" />
              <h2 style={styles.cardTitle}>Harvest &amp; FCR Records</h2>
              <div style={styles.tankCountBadge}>{harvestRecords.length} Records</div>
            </div>
            <p style={styles.cardSubtitle}>Track culture history, partial harvests, and performance</p>
          </div>

          <div style={styles.filterControls}>
            <div style={{ ...styles.searchInputWrapper, minWidth: '120px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginLeft: '12px' }}>DOC:</span>
              <input
                type="number"
                style={{ ...styles.searchInput, width: '60px', flex: 'none' }}
                placeholder="e.g. 75"
                value={docInput}
                onChange={e => setDocInput(e.target.value)}
              />
            </div>

            <button
              onClick={handleAddRecord}
              style={{
                backgroundColor: '#2563eb', color: 'white', border: 'none',
                borderRadius: '8px', padding: '9px 16px', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
              }}
            >
              Add Record
            </button>
          </div>

          <div style={styles.filteredList}>
            {!docInput ? null : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', fontSize: '12px', color: '#64748b' }}>Farmer Name</th>
                    <th style={{ padding: '8px 12px', fontSize: '12px', color: '#64748b' }}>Tank</th>
                    <th style={{ padding: '8px 12px', fontSize: '12px', color: '#64748b' }}>ABW</th>
                    <th style={{ padding: '8px 12px', fontSize: '12px', color: '#64748b' }}>FCR</th>
                    <th style={{ padding: '8px 12px', fontSize: '12px', color: '#64748b' }}>DOC</th>
                  </tr>
                </thead>
                <tbody>
                  {[...harvestRecords]
                    .filter(r => r.doc <= parseInt(docInput || '0'))
                    .sort((a, b) => b.doc - a.doc)
                    .map((record) => (
                      <tr key={record.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                          {record.farmerName}
                          {record.doc === parseInt(docInput) && (
                            <span style={{ marginLeft: '8px', color: '#16a34a', fontSize: '10px', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>NEW</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#64748b' }}>{record.name}</td>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{record.abw}</td>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{record.fcr}</td>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: 700, color: '#2563eb' }}>{record.doc}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>


      </div>

      <div style={{ marginTop: '24px', borderTop: '2px solid #e2e8f0', paddingTop: '24px' }}>
        <GPSRouteTracking />
      </div>

      {/* Modals */}
      {showHarvestedModal && (
        <HarvestedTanksModal onClose={() => setShowHarvestedModal(false)} />
      )}
    </div>
  );
};

const styles = {
  dashboardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1380px',
    margin: '0 auto'
  },
  heroBanner: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '28px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    border: '1px solid #e2e8f0'
  },
  heroLeft: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '75%'
  },
  heroBadge: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #dbeafe',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    padding: '3px 10px',
    borderRadius: '6px',
    display: 'inline-block',
    alignSelf: 'flex-start',
    marginBottom: '8px',
    textTransform: 'uppercase'
  },
  heroTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 6px 0',
    letterSpacing: '-0.3px',
    lineHeight: '1.2'
  },
  heroSubtitle: {
    fontSize: '13.5px',
    color: '#64748b',
    margin: 0,
    fontWeight: 400,
    lineHeight: '1.4'
  },

  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '18px'
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '20px 20px 18px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
    letterSpacing: '0.4px'
  },
  kpiIconWrapper: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  kpiValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '8px',
    lineHeight: '1'
  },
  kpiLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#2563eb',
    cursor: 'pointer',
    marginTop: 'auto',
    transition: 'color 0.15s'
  },
  kpiSubtext: {
    fontSize: '11.5px',
    color: '#94a3b8',
    fontWeight: 500,
    marginTop: 'auto'
  },
  middleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '20px'
  },
  donutCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px 28px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  cardTitle: {
    fontSize: '16.5px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0
  },
  cardSubtitle: {
    fontSize: '12.5px',
    color: '#64748b',
    margin: '3px 0 0 0'
  },
  filterHeader: {
    marginBottom: '16px'
  },
  filterTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  tankCountBadge: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontSize: '11.5px',
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: '12px',
    marginLeft: '6px'
  },
  filterControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'nowrap',
    overflowX: 'auto',
    paddingBottom: '4px'
  },
  searchInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '8px 0',
    backgroundColor: '#ffffff',
    minWidth: '280px',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    flex: 1,
    color: '#0f172a',
    fontWeight: 500,
    backgroundColor: 'transparent'
  },
  filteredList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
    maxHeight: '300px',
    paddingRight: '6px',
  },
  filteredItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc'
  },
  filteredFarmerName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a'
  },
  filteredTankName: {
    fontSize: '11.5px',
    color: '#64748b',
    fontWeight: 500
  },
  statCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '40px'
  },
  statLbl: {
    fontSize: '10px',
    color: '#64748b',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  statVal: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1e293b'
  },
  noResults: {
    textAlign: 'center',
    padding: '30px',
    color: '#94a3b8',
    fontSize: '13px',
    fontStyle: 'italic'
  },

};

export default AdminDashboard;
