import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, TrendingUp, Droplets, Fish, 
  Wheat, Skull, ClipboardList, ChevronRight, Activity, Calendar 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from 'recharts';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';

const MyAnalytics = () => {
  const navigate = useNavigate();
  const session = getSession();
  const { db, getFarmersByAgentId } = useMockData();

  const [activeTimeframe, setActiveTimeframe] = useState('WEEK');

  const agentId = session?.agentId || 'agent001';
  const assignedFarmers = getFarmersByAgentId ? getFarmersByAgentId(agentId) : (db?.farmers || []);
  const submissions = (db?.submissions || []).filter(s => !s.agentId || s.agentId === agentId);

  // Graphical Data 1: Weekly Submissions Activity
  const weeklyActivityData = [
    { day: 'Mon', tests: 4, visits: 2 },
    { day: 'Tue', tests: 6, visits: 3 },
    { day: 'Wed', tests: 5, visits: 2 },
    { day: 'Thu', tests: 8, visits: 4 },
    { day: 'Fri', tests: 7, visits: 3 },
    { day: 'Sat', tests: 9, visits: 4 },
    { day: 'Sun', tests: 3, visits: 1 },
  ];

  // Graphical Data 2: Water Quality Trends (Avg pH and DO)
  const waterTrendData = [
    { label: 'Day 1', ph: 7.6, do: 5.4, temp: 28.2 },
    { label: 'Day 2', ph: 7.8, do: 5.8, temp: 28.5 },
    { label: 'Day 3', ph: 7.7, do: 5.6, temp: 29.0 },
    { label: 'Day 4', ph: 7.9, do: 6.1, temp: 28.8 },
    { label: 'Day 5', ph: 7.8, do: 5.9, temp: 28.4 },
    { label: 'Day 6', ph: 7.8, do: 6.2, temp: 28.6 },
  ];

  // Graphical Data 3: Donut Distribution
  const pieDistributionData = [
    { name: 'Water Quality', value: 16, color: '#0018AD' },
    { name: 'Feed Entries', value: 8, color: '#D97706' },
    { name: 'Biomass', value: 4, color: '#2563EB' },
    { name: 'Farm Activity', value: 3, color: '#7C3AED' },
    { name: 'Mortality', value: 1, color: '#DC2626' },
  ];

  const totalTestsCount = weeklyActivityData.reduce((acc, curr) => acc + curr.tests, 0);

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.headerRow}>
        <div>
          <span style={styles.headerTag}>PERFORMANCE CHARTS</span>
          <h1 style={styles.headerTitle}>My Analytics</h1>
        </div>

        <div style={styles.timeframeTabs}>
          <button 
            style={{
              ...styles.timeTab,
              backgroundColor: activeTimeframe === 'WEEK' ? '#0018AD' : '#FFFFFF',
              color: activeTimeframe === 'WEEK' ? '#FFFFFF' : '#64748B',
            }}
            onClick={() => setActiveTimeframe('WEEK')}
          >
            This Week
          </button>
          <button 
            style={{
              ...styles.timeTab,
              backgroundColor: activeTimeframe === 'MONTH' ? '#0018AD' : '#FFFFFF',
              color: activeTimeframe === 'MONTH' ? '#FFFFFF' : '#64748B',
            }}
            onClick={() => setActiveTimeframe('MONTH')}
          >
            Month
          </button>
        </div>
      </div>

      {/* 4 Summary Stats */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Total Tests</span>
          <span style={styles.kpiVal}>{totalTestsCount}</span>
          <span style={styles.kpiTrendGood}>↑ 14% vs last week</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Avg DO Level</span>
          <span style={styles.kpiVal}>5.8 <span style={{ fontSize: '11px', color: '#64748B' }}>mg/L</span></span>
          <span style={styles.kpiTrendGood}>✓ Optimal Range</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Farmers Monitored</span>
          <span style={styles.kpiVal}>{assignedFarmers.length || 6} / {assignedFarmers.length || 6}</span>
          <span style={styles.kpiTrendGood}>100% Coverage</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Weekly Audits</span>
          <span style={styles.kpiVal}>4 / 4</span>
          <span style={styles.kpiTrendGood}>✓ On Schedule</span>
        </div>
      </div>

      {/* GRAPH 1: Field Activity & Test Volume Chart */}
      <div style={styles.card}>
        <div style={styles.chartHeaderRow}>
          <div>
            <div style={styles.chartTitle}>Daily Test Volume</div>
            <div style={styles.chartSub}>Weekly field records and farm visits</div>
          </div>
          <span style={styles.chartBadge}>
            <Activity size={12} color="#0018AD" /> {totalTestsCount} Records
          </span>
        </div>

        <div style={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748B' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748B' }} 
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderRadius: '8px',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
                cursor={{ fill: '#EDF0FF' }}
              />
              <Bar 
                dataKey="tests" 
                name="Tests Submitted" 
                fill="#0018AD" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRAPH 2: Water Quality Parameters (DO & pH Area Chart) */}
      <div style={styles.card}>
        <div style={styles.chartHeaderRow}>
          <div>
            <div style={styles.chartTitle}>Water Quality Index (DO & pH)</div>
            <div style={styles.chartSub}>Dissolved Oxygen (mg/L) & pH trendline</div>
          </div>
          <div style={styles.legendRow}>
            <span style={styles.legendBlue}>● DO</span>
            <span style={styles.legendTeal}>● pH</span>
          </div>
        </div>

        <div style={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={waterTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="doGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0018AD" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0018AD" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="phGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748B' }} 
              />
              <YAxis 
                domain={[4, 9]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#64748B' }} 
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderRadius: '8px',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="do" 
                name="DO (mg/L)" 
                stroke="#0018AD" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#doGradient)" 
              />
              <Area 
                type="monotone" 
                dataKey="ph" 
                name="pH Level" 
                stroke="#0EA5E9" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#phGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRAPH 3: Donut Breakdown of Field Submissions */}
      <div style={styles.card}>
        <div style={styles.chartHeaderRow}>
          <div>
            <div style={styles.chartTitle}>Record Composition</div>
            <div style={styles.chartSub}>Breakdown by category</div>
          </div>
          <button 
            style={styles.viewHistoryBtn}
            onClick={() => navigate('/tests')}
          >
            View History <ChevronRight size={12} />
          </button>
        </div>

        <div style={styles.donutFlexContainer}>
          <div style={styles.donutWrapper}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie
                  data={pieDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={56}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.donutLegendList}>
            {pieDistributionData.map((item) => (
              <div key={item.name} style={styles.donutLegendItem}>
                <div style={styles.donutLegendLeft}>
                  <span style={{ ...styles.colorDot, backgroundColor: item.color }} />
                  <span style={styles.donutLegendText}>{item.name}</span>
                </div>
                <span style={styles.donutLegendVal}>{item.value}</span>
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
  timeframeTabs: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#F1F5F9',
    padding: '3px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
  },
  timeTab: {
    padding: '4px 10px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '12px 14px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  kpiLabel: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '600',
  },
  kpiVal: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0018AD',
    lineHeight: 1.2,
  },
  kpiTrendGood: {
    fontSize: '10px',
    color: '#15803D',
    fontWeight: '700',
    marginTop: '2px',
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
  chartHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chartTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  chartSub: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '1px',
  },
  chartBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#EDF0FF',
    color: '#0018AD',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  legendRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '11px',
    fontWeight: '700',
  },
  legendBlue: {
    color: '#0018AD',
  },
  legendTeal: {
    color: '#0EA5E9',
  },
  chartContainer: {
    width: '100%',
    height: '180px',
  },
  viewHistoryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    background: 'none',
    border: 'none',
    color: '#0018AD',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: 0,
  },
  donutFlexContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  donutWrapper: {
    width: '130px',
    height: '130px',
    flexShrink: 0,
  },
  donutLegendList: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  donutLegendItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
  },
  donutLegendLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  colorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  donutLegendText: {
    color: '#334155',
    fontWeight: '600',
  },
  donutLegendVal: {
    fontWeight: '700',
    color: '#0F172A',
  },
};

export default MyAnalytics;
