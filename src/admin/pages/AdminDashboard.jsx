import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tractor, Box, TrendingUp, Activity, ShieldCheck,
  AlertCircle, FileSpreadsheet, ArrowUpRight, MapPin
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useMockData } from '../../context/MockDataContext';
import { getRegions } from '../utils/adminMockData';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const mockData = useMockData();
  const db = mockData?.db;
  const regions = getRegions();

  // Real or fallback statistics aligned with the dashboard design
  const totalFarmers = db?.farmers?.length || 8;
  const activeTanks = 11;
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
        <button
          style={styles.exportBtn}
          onClick={() => navigate('/admin/export-center')}
        >
          <FileSpreadsheet size={18} />
          <span>Excel Export Center</span>
        </button>
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

        {/* Card 2: Active Tanks */}
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
            <span>View All Tanks</span>
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* Card 3: Average FCR */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>AVERAGE FCR</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#f8fafc', color: '#64748b' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={styles.kpiValue}>1.40</div>
          <div style={styles.kpiSubtext}>Ideal Target &lt; 1.35</div>
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
        {/* Left: Tank Status Donut Chart */}
        <div style={styles.donutCard}>
          <h2 style={styles.cardTitle}>Tank Status Distribution</h2>
          <p style={styles.cardSubtitle}>Active lifecycle breakdown</p>

          <div style={{ height: '180px', position: 'relative', marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tankStatusData}
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {tankStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(val, name) => [`${val}%`, name]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend under Donut */}
          <div style={styles.donutLegendRow}>
            <div style={styles.legendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: '#10b981' }} />
              <span style={styles.legendLabel}>Active (65%)</span>
            </div>
            <div style={styles.legendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: '#6366f1' }} />
              <span style={styles.legendLabel}>Harvested (10%)</span>
            </div>
            <div style={styles.legendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: '#d97706' }} />
              <span style={styles.legendLabel}>Maintenance (25%)</span>
            </div>
          </div>
        </div>

        {/* Right: Data-Driven Operational Recommendations */}
        <div style={styles.recommendationsCard}>
          <div style={styles.recHeaderRow}>
            <div style={styles.recTitleGroup}>
              <AlertCircle size={18} color="#2563eb" />
              <span style={styles.recTitle}>DATA-DRIVEN OPERATIONAL RECOMMENDATIONS</span>
            </div>
            <div style={styles.recEngineTag}>
              Automated Algorithm Engine
            </div>
          </div>

          <div style={styles.recList}>
            {recommendations.map(rec => (
              <div
                key={rec.id}
                style={{
                  ...styles.recItem,
                  borderLeft: `4px solid ${rec.borderLeft}`
                }}
              >
                <div style={styles.recItemTop}>
                  <span style={{
                    ...styles.recTag,
                    backgroundColor: rec.tagBg,
                    color: rec.tagColor
                  }}>
                    {rec.tag}
                  </span>
                  <span style={styles.recPond}>{rec.title}</span>
                </div>
                <p style={styles.recDesc}>
                  {rec.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: 2 Analytics Charts (FCR & ABW Trend + Feed Intake vs Biomass Growth) */}
      <div style={styles.chartsGrid}>
        {/* Chart 1: Feed Conversion Ratio (FCR) & ABW Trend */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeaderRow}>
            <div>
              <h2 style={styles.cardTitle}>Feed Conversion Ratio (FCR) &amp; ABW Trend</h2>
              <p style={styles.cardSubtitle}>Correlation across Day of Culture (DOC)</p>
            </div>
            <div style={styles.targetFcrBadge}>
              Target FCR: 1.35
            </div>
          </div>

          <div style={{ height: '240px', marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fcrTrendData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="doc"
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: '#334155', fontWeight: 500 }}
                />
                <YAxis
                  domain={[0.8, 2.2]}
                  ticks={[0.8, 1.15, 1.5, 1.85, 2.2]}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: '#334155', fontWeight: 500 }}
                />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={styles.customTooltip}>
                          <div style={styles.tooltipDoc}>DOC: {label}</div>
                          <div style={styles.tooltipFcr}>FCR: {payload[0].value}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="fcr"
                  stroke="#0284c7"
                  strokeWidth={3}
                  dot={{ r: 4.5, fill: '#ffffff', stroke: '#0284c7', strokeWidth: 2.5 }}
                  activeDot={{ r: 6, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Feed Intake vs Biomass Growth (kg) */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeaderRow}>
            <div>
              <h2 style={styles.cardTitle}>Feed Intake vs Biomass Growth (kg)</h2>
              <p style={styles.cardSubtitle}>Cumulative feed distribution</p>
            </div>
            <div style={styles.liveDataBadge}>
              Live Aquaculture Data
            </div>
          </div>

          <div style={{ height: '240px', marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feedVsBiomassData} margin={{ top: 15, right: 20, left: 5, bottom: 5 }} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="doc"
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: '#334155', fontWeight: 500 }}
                />
                <YAxis
                  domain={[0, 6000]}
                  ticks={[0, 1500, 3000, 4500, 6000]}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: '#334155', fontWeight: 500 }}
                />
                <RechartsTooltip
                  formatter={(val, name) => [`${val} kg`, name === 'feed' ? 'Feed Intake' : 'Biomass Growth']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="feed" fill="#0284c7" radius={[3, 3, 0, 0]} barSize={16} />
                <Bar dataKey="biomass" fill="#059669" radius={[3, 3, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  dashboardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '1380px',
    margin: '0 auto'
  },
  heroBanner: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '22px 28px',
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
    fontSize: '23px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 4px 0',
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
  exportBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '13.5px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
    transition: 'all 0.15s ease-in-out',
    flexShrink: 0
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '14px'
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '16px 16px 14px',
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
    fontWeight: 700,
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
    fontWeight: 800,
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
    gridTemplateColumns: '380px 1fr',
    gap: '16px'
  },
  donutCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  cardTitle: {
    fontSize: '16.5px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0
  },
  cardSubtitle: {
    fontSize: '12.5px',
    color: '#64748b',
    margin: '3px 0 0 0'
  },
  donutLegendRow: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: '14px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '12px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  legendLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569'
  },
  recommendationsCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  recHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px'
  },
  recTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  recTitle: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '0.4px'
  },
  recEngineTag: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 600
  },
  recList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  recItem: {
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    border: '1px solid #f1f5f9'
  },
  recItemTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  recTag: {
    fontSize: '10.5px',
    fontWeight: 800,
    padding: '2px 8px',
    borderRadius: '6px',
    letterSpacing: '0.3px'
  },
  recPond: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a'
  },
  recDesc: {
    fontSize: '12.5px',
    color: '#475569',
    margin: 0,
    lineHeight: '1.4'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  chartHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  targetFcrBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    fontSize: '12px',
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: '8px',
    border: '1px solid #bbf7d0'
  },
  liveDataBadge: {
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    fontSize: '12px',
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: '8px',
    border: '1px solid #bfdbfe'
  },
  customTooltip: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: '8px',
    padding: '8px 12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
  },
  tooltipDoc: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  tooltipFcr: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#38bdf8'
  }
};

export default AdminDashboard;
