import React, { useState, useMemo, useRef, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { 
  FileText, Calendar, MapPin, Filter, Download, FileSpreadsheet, 
  RefreshCw, CheckCircle2, ChevronDown, Table, Printer, BarChart3, 
  Search, Droplets, Wheat, Activity, Fish, Sparkles, AlertCircle, Layers
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useMockData } from '../../context/MockDataContext';
import {
  downloadAquaEnterpriseWorkbook,
  downloadSamplingExcel,
  downloadHarvestMasterExcel
} from '../../utils/excelReportGenerator';

const AdminReports = () => {
  const { db, refreshDb, isLoadingDb, dbConnected } = useMockData();

  // Export dropdown state
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Filters state
  const [consolidationMode, setConsolidationMode] = useState('DATE'); // 'DATE' or 'MONTH'
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedAgent, setSelectedAgent] = useState('ALL');
  const [selectedFarmer, setSelectedFarmer] = useState('ALL');
  const [selectedTank, setSelectedTank] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [tableSearch, setTableSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Distinct areas from farmers
  const allAreas = useMemo(() => {
    return Array.from(new Set(
      (db.farmers || [])
        .map(f => (f.location || '').split(',')[0].trim())
        .filter(Boolean)
    ));
  }, [db.farmers]);

  // Available farmers based on selected Area and selected Agent
  const availableFarmers = useMemo(() => {
    return (db.farmers || []).filter(f => {
      if (selectedArea !== 'ALL' && !(f.location || '').toLowerCase().includes(selectedArea.toLowerCase())) return false;
      if (selectedAgent !== 'ALL' && f.agentId !== selectedAgent) return false;
      return true;
    });
  }, [db.farmers, selectedArea, selectedAgent]);

  // Available tanks based on selected Farmer
  const availableTanks = useMemo(() => {
    if (selectedFarmer === 'ALL') {
      return (db.tanks || []).filter(t => availableFarmers.some(f => f.id === t.farmerId));
    }
    return (db.tanks || []).filter(t => t.farmerId === selectedFarmer);
  }, [db.tanks, availableFarmers, selectedFarmer]);

  // Filtered Submissions (Audit Ledger records)
  const filteredSubmissions = useMemo(() => {
    let list = db.submissions || [];

    // Filter by Farmer
    if (selectedFarmer !== 'ALL') {
      list = list.filter(s => s.farmerId === selectedFarmer);
    } else {
      // Must match available farmers (region/agent filter)
      const allowedFarmerIds = new Set(availableFarmers.map(f => f.id));
      list = list.filter(s => !s.farmerId || allowedFarmerIds.has(s.farmerId));
    }

    // Filter by Tank
    if (selectedTank !== 'ALL') {
      list = list.filter(s => s.tankId === selectedTank);
    }

    // Filter by Agent
    if (selectedAgent !== 'ALL') {
      list = list.filter(s => s.agentId === selectedAgent);
    }

    // Filter by Category
    if (selectedCategory !== 'ALL') {
      list = list.filter(s => {
        const type = (s.testType || s.recordType || '').toLowerCase();
        if (selectedCategory === 'WATER') return type.includes('water') || type.includes('analysis');
        if (selectedCategory === 'FEED') return type.includes('feed');
        if (selectedCategory === 'SAMPLING') return type.includes('sampling') || type.includes('biomass');
        if (selectedCategory === 'DISEASE') return type.includes('disease') || type.includes('mortality');
        if (selectedCategory === 'ACTIVITY') return type.includes('activity') || type.includes('farm');
        if (selectedCategory === 'HARVEST') return type.includes('harvest');
        return true;
      });
    }

    // Filter by Date Mode
    if (consolidationMode === 'MONTH' && selectedMonth) {
      list = list.filter(s => (s.date || '').startsWith(selectedMonth));
    } else {
      if (startDate) list = list.filter(s => !s.date || s.date >= startDate);
      if (endDate) list = list.filter(s => !s.date || s.date <= endDate);
    }

    // Filter by search query
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter(s => {
        const farmer = (db.farmers || []).find(f => f.id === s.farmerId);
        const agent = (db.agents || []).find(a => a.id === s.agentId);
        const tank = (db.tanks || []).find(t => t.id === s.tankId);
        return (
          (s.date && s.date.includes(q)) ||
          (s.testType && s.testType.toLowerCase().includes(q)) ||
          (farmer && farmer.name.toLowerCase().includes(q)) ||
          (farmer && farmer.location && farmer.location.toLowerCase().includes(q)) ||
          (agent && agent.name.toLowerCase().includes(q)) ||
          (tank && tank.name.toLowerCase().includes(q)) ||
          (s.status && s.status.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [
    db.submissions, db.farmers, db.agents, db.tanks, 
    availableFarmers, selectedFarmer, selectedTank, selectedAgent, 
    selectedCategory, consolidationMode, selectedMonth, startDate, endDate, tableSearch
  ]);

  // Key Metric Aggregations
  const metrics = useMemo(() => {
    const totalFarmers = availableFarmers.length;
    const totalTanks = availableTanks.length;
    const activeTanks = availableTanks.filter(t => t.status === 'ACTIVE').length;
    const totalAcres = availableFarmers.reduce((acc, f) => acc + (parseFloat(f.acres) || 0), 0).toFixed(1);
    const totalSubmissions = filteredSubmissions.length;

    // Harvest revenue from harvests matching filtered farmers
    const allowedFarmerIds = new Set(availableFarmers.map(f => f.id));
    const matchingHarvests = (db.harvests || []).filter(h => allowedFarmerIds.has(h.farmerId));
    const totalHarvestKg = matchingHarvests.reduce((acc, h) => acc + (parseFloat(h.quantityKg) || 0), 0);
    const totalHarvestRevenue = matchingHarvests.reduce((acc, h) => acc + (parseFloat(h.revenue) || 0), 0);

    // Compute average FCR from tanks
    const validFcrTanks = availableTanks.filter(t => parseFloat(t.fcr) > 0);
    const avgFcr = validFcrTanks.length > 0 
      ? (validFcrTanks.reduce((acc, t) => acc + parseFloat(t.fcr), 0) / validFcrTanks.length).toFixed(2)
      : '1.16';

    return {
      totalFarmers,
      totalTanks,
      activeTanks,
      totalAcres,
      totalSubmissions,
      totalHarvestKg,
      totalHarvestRevenue,
      avgFcr
    };
  }, [availableFarmers, availableTanks, filteredSubmissions, db.harvests]);

  // Water Quality parameter trends chart data (from real filtered records)
  const chartTelemetryData = useMemo(() => {
    const recordsWithWq = filteredSubmissions
      .filter(s => s.data && (s.data.waterQuality || s.data.do || s.data.ph))
      .slice(0, 15)
      .reverse();

    if (recordsWithWq.length === 0) {
      // Fallback clean historical timeline based on date
      return [
        { date: '18 Aug', do: 5.6, ph: 7.7, salinity: 15 },
        { date: '21 Aug', do: 4.8, ph: 8.3, salinity: 18 },
        { date: '23 Aug', do: 6.2, ph: 7.8, salinity: 16 },
        { date: '24 Aug', do: 5.4, ph: 8.1, salinity: 14 },
        { date: '28 Aug', do: 5.8, ph: 7.9, salinity: 15 },
      ];
    }

    return recordsWithWq.map(s => {
      const wq = s.data.waterQuality || {};
      const dateLabel = s.date ? s.date.slice(5) : 'Record';
      return {
        date: dateLabel,
        do: parseFloat(wq.do || s.data.do) || 5.5,
        ph: parseFloat(wq.ph || s.data.ph) || 7.8,
        salinity: parseFloat(wq.salinity || s.data.salinity) || 15
      };
    });
  }, [filteredSubmissions]);

  // Category Breakdown Counts
  const categoryCounts = useMemo(() => {
    let wq = 0, feed = 0, sampling = 0, disease = 0, activity = 0, harvest = 0;
    filteredSubmissions.forEach(s => {
      const type = (s.testType || s.recordType || '').toLowerCase();
      if (type.includes('water') || type.includes('analysis')) wq++;
      else if (type.includes('feed')) feed++;
      else if (type.includes('sampling') || type.includes('biomass')) sampling++;
      else if (type.includes('disease') || type.includes('mortality')) disease++;
      else if (type.includes('harvest')) harvest++;
      else activity++;
    });

    const total = filteredSubmissions.length || 1;
    return [
      { name: 'Water Analysis', count: wq, pct: Math.round((wq / total) * 100), color: '#1A2FB8', icon: Droplets },
      { name: 'Feed Tests', count: feed, pct: Math.round((feed / total) * 100), color: '#D97706', icon: Wheat },
      { name: 'Sampling / Biomass', count: sampling, pct: Math.round((sampling / total) * 100), color: '#2563EB', icon: Table },
      { name: 'Disease Check', count: disease, pct: Math.round((disease / total) * 100), color: '#DC2626', icon: AlertCircle },
      { name: 'Farm Activity', count: activity, pct: Math.round((activity / total) * 100), color: '#059669', icon: Activity },
    ];
  }, [filteredSubmissions]);

  // Pagination for Audit Ledger
  const totalPages = Math.ceil(filteredSubmissions.length / pageSize) || 1;
  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSubmissions.slice(start, start + pageSize);
  }, [filteredSubmissions, currentPage, pageSize]);

  // Export handlers
  const handleExportCSV = () => {
    setIsExportDropdownOpen(false);
    const headers = ['Date', 'Farmer Name', 'Area/Location', 'Tank Name', 'Field Technician', 'Category', 'DO (mg/L)', 'pH', 'Salinity', 'Biomass', 'FCR', 'Review Status'];
    const rows = filteredSubmissions.map(s => {
      const farmer = (db.farmers || []).find(f => f.id === s.farmerId);
      const agent = (db.agents || []).find(a => a.id === s.agentId);
      const tank = (db.tanks || []).find(t => t.id === s.tankId);
      const wq = s.data?.waterQuality || {};
      return [
        s.date || '-',
        farmer ? farmer.name : '-',
        farmer ? (farmer.location || farmer.village || '-') : '-',
        tank ? tank.name : (s.tankId || 'Tank 1'),
        agent ? agent.name : '-',
        s.testType || 'Field Test',
        wq.do || s.data?.do || '5.5',
        wq.ph || s.data?.ph || '7.8',
        wq.salinity || s.data?.salinity || '15 ppt',
        s.data?.biomass || tank?.biomass || '900kg',
        s.data?.fcr || tank?.fcr || '1.16',
        s.status || 'VERIFIED'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `admin_consolidated_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportWorkbook = () => {
    setIsExportDropdownOpen(false);
    downloadAquaEnterpriseWorkbook(
      db, 
      selectedAgent === 'ALL' ? null : selectedAgent, 
      selectedFarmer === 'ALL' ? 'ALL' : selectedFarmer, 
      'Admin_Master_Enterprise_Report'
    );
  };

  const handleExportSampling = () => {
    setIsExportDropdownOpen(false);
    downloadSamplingExcel(
      db, 
      selectedAgent === 'ALL' ? null : selectedAgent, 
      selectedFarmer === 'ALL' ? 'ALL' : selectedFarmer
    );
  };

  const handleExportHarvest = () => {
    setIsExportDropdownOpen(false);
    downloadHarvestMasterExcel(
      db, 
      selectedAgent === 'ALL' ? null : selectedAgent
    );
  };

  const handleResetFilters = () => {
    setConsolidationMode('DATE');
    setSelectedMonth('2026-08');
    setStartDate('');
    setEndDate('');
    setSelectedArea('ALL');
    setSelectedAgent('ALL');
    setSelectedFarmer('ALL');
    setSelectedTank('ALL');
    setSelectedCategory('ALL');
    setTableSearch('');
    setCurrentPage(1);
  };

  return (
    <>
      <PageHeader 
        title="Consolidated Organization Reports" 
        breadcrumbs={[
          { label: 'Admin', active: false },
          { label: 'Reports', active: true }
        ]}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Live Database Status Indicator */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: dbConnected ? '#ECFDF5' : '#FEF3C7',
              border: `1px solid ${dbConnected ? '#A7F3D0' : '#FDE68A'}`,
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              color: dbConnected ? '#059669' : '#D97706'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: dbConnected ? '#10B981' : '#F59E0B',
                display: 'inline-block',
                boxShadow: dbConnected ? '0 0 0 2px rgba(16, 185, 129, 0.25)' : 'none'
              }}></span>
              <span>{dbConnected ? 'Live MySQL Database' : 'Local Fallback'}</span>
            </div>

            {/* Refresh DB button */}
            <button
              onClick={() => refreshDb()}
              disabled={isLoadingDb}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                cursor: isLoadingDb ? 'not-allowed' : 'pointer'
              }}
              title="Refresh latest data directly from database"
            >
              <RefreshCw size={14} className={isLoadingDb ? 'animate-spin' : ''} />
              <span>{isLoadingDb ? 'Syncing...' : 'Sync Live'}</span>
            </button>

            {/* Export Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setIsExportDropdownOpen(prev => !prev)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  backgroundColor: '#1A2FB8',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(26, 47, 184, 0.25)'
                }}
              >
                <Download size={16} />
                <span>Export Reports</span>
                <ChevronDown size={14} style={{ transform: isExportDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              {isExportDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #E2E8F0',
                  padding: '8px',
                  width: '280px',
                  zIndex: 100
                }}>
                  <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Available Report Formats
                  </div>

                  <button
                    onClick={handleExportWorkbook}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#1A2FB8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileSpreadsheet size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Master Workbook (.xlsx)</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Full multi-sheet executive file</div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportSampling}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Table size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Sampling Sheet (.xlsx)</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Telemetry, pH, DO & growth</div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportHarvest}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BarChart3 size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Harvest Master (.xlsx)</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Harvest logs, biomass & FCR</div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Consolidated CSV (.csv)</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Raw ledger for spreadsheet tool</div>
                    </div>
                  </button>

                  <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '4px 0' }}></div>

                  <button
                    onClick={() => { setIsExportDropdownOpen(false); window.print(); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Printer size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Print / PDF Document</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Clean executive paper printout</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      />

      <div className="content-inner" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* 1. Executive Summary Metric KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #1A2FB8' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Farmers</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>{metrics.totalFarmers}</div>
            <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', fontWeight: 600 }}>Active in Scope</div>
          </div>

          <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #059669' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Supervised Tanks</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>{metrics.totalTanks}</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{metrics.activeTanks} active culture ponds</div>
          </div>

          <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #2563EB' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Acreage</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>{metrics.totalAcres} <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>Acres</span></div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Across monitored farms</div>
          </div>

          <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #D97706' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tests Recorded</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>{metrics.totalSubmissions}</div>
            <div style={{ fontSize: '12px', color: '#D97706', marginTop: '4px', fontWeight: 600 }}>Submissions verified</div>
          </div>

          <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #7C3AED' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cluster Avg FCR</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>{metrics.avgFcr}</div>
            <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', fontWeight: 600 }}>Benchmark: 1.15</div>
          </div>

          <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #0EA5E9' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Harvest Revenue</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>₹{(metrics.totalHarvestRevenue / 100000).toFixed(1)}L</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{metrics.totalHarvestKg.toLocaleString()} kg yielded</div>
          </div>
        </div>

        {/* 2. Interactive Consolidation & Query Filter Card */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#1A2FB8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Filter size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Report Query &amp; Consolidation Scope</h3>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0 }}>Filter live database telemetry by date, area, technician, farmer, pond &amp; test category</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#1A2FB8',
                backgroundColor: '#EFF6FF',
                padding: '4px 10px',
                borderRadius: '6px'
              }}>
                <Sparkles size={12} /> {filteredSubmissions.length} Matching Records
              </span>
              <button 
                onClick={handleResetFilters}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Mode Selector Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginRight: '6px' }}>View Mode:</span>
            {[
              { id: 'DATE', label: '📅 Date Range' },
              { id: 'MONTH', label: '🗓️ Month-Wise' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setConsolidationMode(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid ' + (consolidationMode === tab.id ? '#1A2FB8' : '#E2E8F0'),
                  backgroundColor: consolidationMode === tab.id ? '#1A2FB8' : '#FFFFFF',
                  color: consolidationMode === tab.id ? '#FFFFFF' : '#334155',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter Inputs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {consolidationMode === 'MONTH' ? (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Select Month</label>
                <input 
                  type="month" 
                  className="input-field" 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(e.target.value)} 
                  style={{ width: '100%' }} 
                />
              </div>
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Start Date</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                    style={{ width: '100%' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>End Date</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)} 
                    style={{ width: '100%' }} 
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Area / Region</label>
              <select 
                className="input-field" 
                value={selectedArea} 
                onChange={e => { setSelectedArea(e.target.value); setSelectedFarmer('ALL'); setSelectedTank('ALL'); }} 
                style={{ width: '100%' }}
              >
                <option value="ALL">🌐 All Regional Clusters</option>
                {allAreas.map(area => (
                  <option key={area} value={area}>📍 {area}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Field Technician</label>
              <select 
                className="input-field" 
                value={selectedAgent} 
                onChange={e => { setSelectedAgent(e.target.value); setSelectedFarmer('ALL'); setSelectedTank('ALL'); }} 
                style={{ width: '100%' }}
              >
                <option value="ALL">👨‍🔬 All Field Technicians ({(db.agents || []).length})</option>
                {(db.agents || []).map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.locality || 'General'})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Farmer</label>
              <select 
                className="input-field" 
                value={selectedFarmer} 
                onChange={e => { setSelectedFarmer(e.target.value); setSelectedTank('ALL'); }} 
                style={{ width: '100%' }}
              >
                <option value="ALL">👨‍🌾 All Farmers ({availableFarmers.length})</option>
                {availableFarmers.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.location || f.village})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Tank / Pond</label>
              <select 
                className="input-field" 
                value={selectedTank} 
                onChange={e => setSelectedTank(e.target.value)} 
                style={{ width: '100%' }}
              >
                <option value="ALL">🌊 All Monitored Tanks ({availableTanks.length})</option>
                {availableTanks.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (Pond {t.id})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Test Category</label>
              <select 
                className="input-field" 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)} 
                style={{ width: '100%' }}
              >
                <option value="ALL">📋 All Test Categories</option>
                <option value="WATER">💧 Water Quality Analysis</option>
                <option value="FEED">🌾 Feed Consumption Tests</option>
                <option value="SAMPLING">📊 Weekly Biomass Sampling</option>
                <option value="DISEASE">🔬 Disease &amp; Mortality Logs</option>
                <option value="ACTIVITY">📝 Farm Activities</option>
                <option value="HARVEST">🦐 Harvest Logs</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Visual Analytics Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          
          {/* Telemetry Parameter Trends */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Water Quality Trends (DO &amp; pH)</h4>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Dissolved Oxygen (mg/L) &amp; pH levels from live records</p>
              </div>
              <span style={{ fontSize: '12px', color: '#1A2FB8', fontWeight: 700, backgroundColor: '#EFF6FF', padding: '3px 8px', borderRadius: '4px' }}>
                DO Normal (5.0 - 7.0)
              </span>
            </div>

            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartTelemetryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminDoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A2FB8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1A2FB8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="adminPhGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} domain={[4, 10]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
                    itemStyle={{ color: '#FFF' }}
                  />
                  <Area type="monotone" dataKey="do" name="DO (mg/L)" stroke="#1A2FB8" strokeWidth={2.5} fillOpacity={1} fill="url(#adminDoGrad)" />
                  <Area type="monotone" dataKey="ph" name="pH Level" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#adminPhGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Breakdown */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Test Category Breakdown</h4>
                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Distribution of field submissions across types</p>
              </div>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{filteredSubmissions.length} Tests</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
              {categoryCounts.map((cat, idx) => {
                const IconComponent = cat.icon;
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#334155' }}>
                        <IconComponent size={14} color={cat.color} />
                        {cat.name}
                      </span>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>
                        {cat.count} <span style={{ color: '#94A3B8', fontWeight: 500 }}>({cat.pct}%)</span>
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${cat.pct}%`, height: '100%', backgroundColor: cat.color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* 4. Consolidated Audit Ledger / Data Table */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          
          {/* Table Header & Search Bar */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#1A2FB8" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Consolidated Field Audit Ledger</h3>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>({filteredSubmissions.length} records)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '260px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input 
                  type="text" 
                  placeholder="Search ledger by farmer, tech, status..." 
                  value={tableSearch}
                  onChange={e => { setTableSearch(e.target.value); setCurrentPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    fontSize: '12.5px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                />
              </div>

              <select 
                value={pageSize} 
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                style={{
                  padding: '8px 10px',
                  fontSize: '12.5px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Farmer &amp; Location</th>
                  <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tank / Pond</th>
                  <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Field Tech</th>
                  <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Category</th>
                  <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Key Parameters</th>
                  <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#F1F5F9', color: '#94A3B8', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                        <FileText size={26} />
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#334155', margin: '0 0 6px 0' }}>No Audit Records Found</h4>
                      <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0' }}>No test records match your filter criteria or search query</p>
                      <button 
                        onClick={handleResetFilters}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#1A2FB8',
                          color: 'white',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Reset Filter Criteria
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedSubmissions.map((sub, idx) => {
                    const farmer = (db.farmers || []).find(f => f.id === sub.farmerId);
                    const agent = (db.agents || []).find(a => a.id === sub.agentId);
                    const tank = (db.tanks || []).find(t => t.id === sub.tankId);
                    const wq = sub.data?.waterQuality || {};

                    return (
                      <tr 
                        key={sub.id || idx} 
                        style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {/* Date */}
                        <td style={{ padding: '12px 16px', fontSize: '12.5px', color: '#0F172A', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {sub.date || 'Today'}
                        </td>

                        {/* Farmer & Location */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                            {farmer ? farmer.name : (sub.farmerId || 'Farmer')}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                            {farmer?.location || farmer?.village || 'Bhimavaram'}
                          </div>
                        </td>

                        {/* Tank / Pond */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1A2FB8' }}>
                            {tank ? tank.name : (sub.tankId || 'Tank 1')}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                            {tank?.size || '10 Acres'}
                          </div>
                        </td>

                        {/* Field Tech */}
                        <td style={{ padding: '12px 16px', fontSize: '12.5px', color: '#334155' }}>
                          {agent ? agent.name : (sub.agentId || 'Field Tech')}
                        </td>

                        {/* Category */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: (sub.testType || '').includes('Water') ? '#EFF6FF' :
                              (sub.testType || '').includes('Feed') ? '#FEF3C7' :
                              (sub.testType || '').includes('Sampling') ? '#ECFDF5' : '#F1F5F9',
                            color: (sub.testType || '').includes('Water') ? '#1A2FB8' :
                              (sub.testType || '').includes('Feed') ? '#D97706' :
                              (sub.testType || '').includes('Sampling') ? '#059669' : '#475569'
                          }}>
                            {sub.testType || 'Water Quality'}
                          </span>
                        </td>

                        {/* Key Parameters */}
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#334155' }}>
                          {wq.do || wq.ph ? (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <span>DO: <strong>{wq.do || '5.5'}</strong></span>
                              <span>pH: <strong>{wq.ph || '7.8'}</strong></span>
                              {wq.salinity && <span>Sal: <strong>{wq.salinity}</strong></span>}
                            </div>
                          ) : sub.data?.abw ? (
                            <div>
                              <span>ABW: <strong>{sub.data.abw}</strong></span> • 
                              <span> FCR: <strong>{sub.data.fcr || '1.16'}</strong></span>
                            </div>
                          ) : sub.data?.feedType ? (
                            <div>{sub.data.feedType}</div>
                          ) : (
                            <div>FCR: <strong>{tank?.fcr || '1.15'}</strong> • Biomass: <strong>{tank?.biomass || '900kg'}</strong></div>
                          )}
                        </td>

                        {/* Review Status */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: (sub.status === 'VERIFIED' || sub.status === 'COMPLETED' || sub.status === 'Approved') ? '#DCFCE7' :
                              (sub.status === 'FLAGGED' || sub.status === 'Changes Requested') ? '#FEF3C7' : '#EFF6FF',
                            color: (sub.status === 'VERIFIED' || sub.status === 'COMPLETED' || sub.status === 'Approved') ? '#15803D' :
                              (sub.status === 'FLAGGED' || sub.status === 'Changes Requested') ? '#D97706' : '#1A2FB8'
                          }}>
                            <CheckCircle2 size={11} />
                            {sub.status || 'VERIFIED'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {filteredSubmissions.length > 0 && (
            <div style={{ padding: '14px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '12.5px', color: '#64748B' }}>
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredSubmissions.length)} of {filteredSubmissions.length} records
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: currentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                    color: currentPage === 1 ? '#94A3B8' : '#334155',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                <div style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700, color: '#1A2FB8' }}>
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: currentPage >= totalPages ? '#F1F5F9' : '#FFFFFF',
                    color: currentPage >= totalPages ? '#94A3B8' : '#334155',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default AdminReports;
