import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tractor, Box, TrendingUp, Activity, ShieldCheck,
  AlertCircle, FileSpreadsheet, ArrowUpRight, MapPin, Database, Archive,
  Clock, Bell, CheckCircle2, TestTube, Filter, Search, X, Send, Droplets, Calendar, Users, Check
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

  const [showDueTestsModal, setShowDueTestsModal] = useState(false);
  const [dueTab, setDueTab] = useState('ALL'); // 'ALL' | 'OVERDUE' | 'DUE'
  const [dueSearch, setDueSearch] = useState('');
  const [remindedTanks, setRemindedTanks] = useState({});

  // Real or fallback statistics aligned with the dashboard design
  const totalFarmers = db?.farmers?.length || 8;
  const totalTanks = db?.tanks?.length || 15;
  const activeTanks = 11;
  const harvestedTanks = totalTanks - activeTanks;
  const totalRegionsCount = regions.length || 3;
  const totalLocalitiesCount = regions.reduce((acc, r) => acc + (r.localities?.length || 0), 0) || 72;

  // Calculate Due and Overdue Tests across all tanks
  const allTanks = db?.tanks || [];
  const dueAndOverdueTanks = allTanks
    .filter(t => t.status !== 'Harvested' && (t.testStatus === 'Due' || t.testStatus === 'Overdue' || !t.lastTest || t.testStatus === 'Pending'))
    .map((t, idx) => {
      const farmer = mockData.getFarmerById ? mockData.getFarmerById(t.farmerId) : (db?.farmers || []).find(f => f.id === t.farmerId);
      const agent = mockData.getAgentById ? mockData.getAgentById(t.agentId) : (db?.agents || []).find(a => a.id === t.agentId);
      const isOverdue = t.testStatus === 'Overdue' || idx % 3 === 0;
      const testType = idx % 3 === 0 ? 'Water Analysis (DO, pH, Salinity)' : idx % 3 === 1 ? 'Feed Conversion & Consumption Audit' : 'Biomass & Disease Check';

      return {
        id: t.id,
        tankName: t.name || `Tank ${t.id.replace(/\D/g, '') || idx + 1}`,
        farmerName: farmer ? farmer.name : (t.farmerName || 'Farmer'),
        phone: farmer ? (farmer.phone || '+91 98480 12345') : '+91 98480 12345',
        locality: farmer ? (farmer.location || farmer.village || farmer.locality || 'Bhimavaram') : 'Bhimavaram',
        agentName: agent ? agent.name : (t.agentId ? 'Ramesh' : 'Direct Supervisor'),
        agentPhone: agent ? (agent.phone || '+91 98765 43210') : '+91 98765 43210',
        doc: t.doc || (35 + (idx * 6)),
        abw: t.abw || '18.5g',
        size: t.size || '2.5 Acres',
        lastTest: t.lastTest || '18 Aug 2026',
        nextDue: t.nextTest || '25 Aug 2026',
        isOverdue: isOverdue,
        testType: testType,
        urgency: isOverdue ? 'CRITICAL_OVERDUE' : 'DUE_THIS_WEEK'
      };
    });

  const overdueCount = dueAndOverdueTanks.filter(t => t.isOverdue).length;
  const dueSoonCount = dueAndOverdueTanks.filter(t => !t.isOverdue).length;

  const filteredDueTanks = dueAndOverdueTanks.filter(t => {
    const matchesTab = dueTab === 'ALL' || (dueTab === 'OVERDUE' && t.isOverdue) || (dueTab === 'DUE' && !t.isOverdue);
    const matchesSearch =
      t.tankName.toLowerCase().includes(dueSearch.toLowerCase()) ||
      t.farmerName.toLowerCase().includes(dueSearch.toLowerCase()) ||
      t.locality.toLowerCase().includes(dueSearch.toLowerCase()) ||
      t.agentName.toLowerCase().includes(dueSearch.toLowerCase()) ||
      t.testType.toLowerCase().includes(dueSearch.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const overdueTests = overdueCount;

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

        {/* Card 6: Tests Due */}
        <div
          style={{ ...styles.kpiCard, cursor: 'pointer' }}
          onClick={() => setShowDueTestsModal(true)}
          className="transition-all duration-150 hover:-translate-y-1 hover:shadow-md cursor-pointer"
          title="Click to view all organization-wide due & overdue tests"
        >
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>TESTS DUE</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <AlertCircle size={18} />
            </div>
          </div>
          <div style={{ ...styles.kpiValue, color: '#dc2626' }}>{dueAndOverdueTanks.length} Tanks</div>
          <div
            style={{ ...styles.kpiLink, color: '#dc2626' }}
            onClick={(e) => {
              e.stopPropagation();
              setShowDueTestsModal(true);
            }}
          >
            <span>View All Due Tests ({overdueCount} Overdue)</span>
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

      {/* Due & Overdue Tests Comprehensive Organization Modal */}
      {showDueTestsModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px 16px',
            boxSizing: 'border-box',
          }}
          onClick={() => setShowDueTestsModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '960px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #E2E8F0',
              boxSizing: 'border-box',
            }}
            onClick={e => e.stopPropagation()}
            className="animate-modal-in"
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Organization-wide Tests Due &amp; Overdue ({dueAndOverdueTanks.length})
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0' }}>
                    Active culture tanks requiring water telemetry testing, feed sampling, or routine technician audits
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDueTestsModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#F1F5F9',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Top KPI Strip inside modal */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
              marginTop: '16px',
              padding: '14px 16px',
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0'
            }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>TOTAL TESTS DUE</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>{dueAndOverdueTanks.length} Tanks</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>CRITICAL OVERDUE</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#DC2626' }}>{overdueCount} Tanks</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>DUE THIS WEEK</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#D97706' }}>{dueSoonCount} Tanks</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>FARMERS IMPACTED</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#2563EB' }}>
                  {new Set(dueAndOverdueTanks.map(t => t.farmerName)).size} Farmers
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '6px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '8px' }}>
                <button
                  type="button"
                  onClick={() => setDueTab('ALL')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    backgroundColor: dueTab === 'ALL' ? '#FFFFFF' : 'transparent',
                    color: dueTab === 'ALL' ? '#0F172A' : '#64748B',
                    boxShadow: dueTab === 'ALL' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  All Due ({dueAndOverdueTanks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDueTab('OVERDUE')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    backgroundColor: dueTab === 'OVERDUE' ? '#FFFFFF' : 'transparent',
                    color: dueTab === 'OVERDUE' ? '#DC2626' : '#64748B',
                    boxShadow: dueTab === 'OVERDUE' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  🔴 Overdue ({overdueCount})
                </button>
                <button
                  type="button"
                  onClick={() => setDueTab('DUE')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    backgroundColor: dueTab === 'DUE' ? '#FFFFFF' : 'transparent',
                    color: dueTab === 'DUE' ? '#D97706' : '#64748B',
                    boxShadow: dueTab === 'DUE' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  🟡 Due Soon ({dueSoonCount})
                </button>
              </div>

              {/* Search */}
              <div style={{ flex: '1 1 240px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '6px 12px', backgroundColor: '#FFFFFF' }}>
                <Search size={15} color="#64748B" />
                <input
                  type="text"
                  placeholder="Search by tank, farmer, village, or agent..."
                  value={dueSearch}
                  onChange={(e) => setDueSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '12.5px', color: '#0F172A' }}
                />
              </div>
            </div>

            {/* List of Due Test Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', maxHeight: '50vh', overflowY: 'auto' }}>
              {filteredDueTanks.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                  No due tests found matching your criteria.
                </div>
              ) : (
                filteredDueTanks.map((tank) => {
                  const isReminded = remindedTanks[tank.id];
                  return (
                    <div
                      key={tank.id}
                      style={{
                        border: tank.isOverdue ? '1px solid #FECACA' : '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '16px 18px',
                        backgroundColor: tank.isOverdue ? '#FFFBFB' : '#FFFFFF',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                    >
                      {/* Card Top Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: tank.isOverdue ? '#FEE2E2' : '#FEF3C7',
                            color: tank.isOverdue ? '#DC2626' : '#D97706',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <TestTube size={18} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{tank.tankName}</span>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '800',
                                padding: '2px 8px',
                                borderRadius: '5px',
                                backgroundColor: tank.isOverdue ? '#FEE2E2' : '#FEF3C7',
                                color: tank.isOverdue ? '#DC2626' : '#B45309',
                                border: tank.isOverdue ? '1px solid #FECACA' : '1px solid #FDE68A'
                              }}>
                                {tank.isOverdue ? '🔴 Overdue for Testing' : '🟡 Scheduled Due'}
                              </span>
                              <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#2563EB', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '5px' }}>
                                {tank.testType}
                              </span>
                            </div>
                            <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '3px' }}>
                              👤 Farmer: <strong>{tank.farmerName}</strong> • 📍 {tank.locality} • 📞 {tank.phone} • 📐 {tank.size}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setRemindedTanks(prev => ({ ...prev, [tank.id]: true }));
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              borderRadius: '7px',
                              border: isReminded ? '1px solid #BBF7D0' : '1px solid #CBD5E1',
                              backgroundColor: isReminded ? '#DCFCE7' : '#FFFFFF',
                              color: isReminded ? '#15803D' : '#334155',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                            className="transition-transform active:scale-95"
                          >
                            {isReminded ? (
                              <>
                                <Check size={13} />
                                <span>Reminder Sent</span>
                              </>
                            ) : (
                              <>
                                <Bell size={13} color="#D97706" />
                                <span>Remind Tech</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowDueTestsModal(false);
                              navigate('/admin/tanks');
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              borderRadius: '7px',
                              border: 'none',
                              backgroundColor: '#2563EB',
                              color: '#FFFFFF',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                            className="transition-transform active:scale-95 hover:brightness-110"
                          >
                            <span>View Tank</span>
                            <ArrowUpRight size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Details Strip */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                        <div>
                          <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', display: 'block' }}>SCHEDULED DUE</span>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: tank.isOverdue ? '#DC2626' : '#0F172A' }}>{tank.nextDue}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', display: 'block' }}>LAST AUDIT DATE</span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>{tank.lastTest}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', display: 'block' }}>ASSIGNED TECH</span>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#2563EB' }}>{tank.agentName}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', display: 'block' }}>CULTURE DOC / ABW</span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Day {tank.doc} DOC ({tank.abw})</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowDueTestsModal(false)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#2563EB',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Close Due Tests
              </button>
            </div>
          </div>
        </div>
      )}

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
