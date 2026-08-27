import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, ArrowUpRight, CheckCircle2, ChevronRight, Droplets 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { getSession } from '../utils/agentAuth';
import { useMockData } from '../../context/MockDataContext';

const Reports = () => {
  const navigate = useNavigate();
  const session = getSession();
  const { db } = useMockData();

  const [selectedFarmerId, setSelectedFarmerId] = useState('ALL');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/login');
    }
  }, [session, navigate]);

  if (!session || !db) return null;

  const agentId = session.agentId || 'agent001';
  const farmers = db.farmers || [];
  const tanks = db.tanks || [];
  const submissions = db.submissions || [];

  // Filter submissions for this technician
  const technicianSubmissions = submissions
    .filter(s => !s.agentId || s.agentId === agentId)
    .filter(s => selectedFarmerId === 'ALL' || s.farmerId === selectedFarmerId)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

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
    { name: 'Biomass Sampling', count: 6, percent: 17, color: '#2563EB' },
    { name: 'Farm Activity', count: 5, percent: 14, color: '#059669' },
    { name: 'Mortality Logs', count: 3, percent: 8, color: '#DC2626' },
  ];

  // Export CSV Handler
  const handleExportCSV = () => {
    setIsExporting(true);

    const headers = ['Record ID', 'Date', 'Farmer', 'Pond', 'Category', 'Locality', 'GPS Accuracy', 'Status'];
    const rows = technicianSubmissions.map(sub => [
      sub.id || 'REC-001',
      sub.date || '27 Aug 2026',
      sub.farmerName || 'Ravi Kumar',
      sub.tankName || 'Tank 1',
      sub.testType || sub.recordType || 'Water Quality',
      sub.gps?.locality || 'Bhimavaram, AP',
      `±${sub.gps?.accuracy || 8}m`,
      sub.status || 'SUBMITTED'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `field_analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsExporting(false);
    }, 500);
  };

  return (
    <div style={styles.container}>
      {/* 1. Header Row */}
      <div style={styles.headerRow}>
        <div>
          <span style={styles.headerTag}>REPORTS & METRICS</span>
          <h1 style={styles.headerTitle}>Field Analytics</h1>
        </div>

        <button 
          type="button"
          className="transition-all duration-150 hover:brightness-110 active:scale-95 cursor-pointer"
          style={styles.exportBtn}
          onClick={handleExportCSV}
          disabled={isExporting}
        >
          <Download size={14} strokeWidth={2.4} />
          <span>{isExporting ? 'Exporting...' : 'Export'}</span>
        </button>
      </div>

      {/* 2. Compact 3-Column Metric Summary Card */}
      <div style={styles.card}>
        <div style={styles.metricsGrid}>
          <div style={styles.metricCol}>
            <span style={styles.metricVal}>{technicianSubmissions.length || 36}</span>
            <span style={styles.metricLabel}>Total Tests</span>
          </div>
          <div style={styles.metricDivider} />
          <div style={styles.metricCol}>
            <span style={{ ...styles.metricVal, color: '#16A34A' }}>96.8%</span>
            <span style={styles.metricLabel}>Pass Rate</span>
          </div>
          <div style={styles.metricDivider} />
          <div style={styles.metricCol}>
            <span style={styles.metricVal}>{tanks.length || 12}</span>
            <span style={styles.metricLabel}>Active Ponds</span>
          </div>
        </div>
      </div>

      {/* 3. Graphical Analytics: Clean Water Quality Trends */}
      <div style={styles.card}>
        <div style={styles.chartHeaderRow}>
          <div>
            <div style={styles.sectionHeaderSmall}>WATER QUALITY TRENDS</div>
            <div style={styles.chartSub}>Weekly Dissolved Oxygen (DO) & pH</div>
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

      {/* 4. Minimal Category Breakdown Progress Bars */}
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

      {/* 5. Consolidated Records List */}
      <div style={styles.card}>
        <div style={styles.chartHeaderRow}>
          <span style={styles.sectionHeaderSmall}>CONSOLIDATED FIELD LOG</span>
          
          <select 
            value={selectedFarmerId}
            onChange={(e) => setSelectedFarmerId(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="ALL">All Farmers</option>
            {farmers.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div style={styles.recordsList}>
          {technicianSubmissions.slice(0, 5).map((sub, idx) => (
            <div key={sub.id || idx} style={styles.recordRow}>
              <div style={styles.recordLeft}>
                <div style={styles.categoryBadge}>
                  {sub.testType || sub.recordType || 'Water Quality'}
                </div>
                <div>
                  <div style={styles.recordTitle}>
                    {sub.farmerName || 'Ravi Kumar'} • {sub.tankName || 'Tank 1'}
                  </div>
                  <div style={styles.recordSub}>
                    {sub.date || '27 Aug 2026'} • 📍 {sub.gps?.locality || 'Bhimavaram'}
                  </div>
                </div>
              </div>

              <span style={styles.statusPill}>✓ Submitted</span>
            </div>
          ))}
        </div>
      </div>
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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTag: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.4px',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0F172A',
    margin: '1px 0 0 0',
  },
  exportBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#0018AD',
    color: '#FFFFFF',
    border: 'none',
    height: '36px',
    padding: '0 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0, 24, 173, 0.22)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
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
  chartHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartSub: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '1px',
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
  filterSelect: {
    height: '30px',
    padding: '0 8px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '11px',
    fontWeight: '600',
    color: '#0F172A',
    outline: 'none',
  },
  recordsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '4px',
  },
  recordRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #F1F5F9',
  },
  recordLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  categoryBadge: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#0018AD',
    backgroundColor: '#EDF0FF',
    padding: '3px 7px',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
  },
  recordTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#0F172A',
  },
  recordSub: {
    fontSize: '11px',
    color: '#64748B',
  },
  statusPill: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    padding: '2px 6px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  },
};

export default Reports;
