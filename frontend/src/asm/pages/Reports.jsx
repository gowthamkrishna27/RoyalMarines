import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { getAsmBasePath } from '../utils/asmNavigation';
import { 
  Users, ShieldCheck, FileSpreadsheet, Download, Search, 
  Calendar, Droplets, CheckCircle2, AlertCircle, Table, 
  BarChart3, Filter, RotateCcw, User, Phone, MapPin, Eye, 
  X, Sparkles, ChevronDown, Printer, FileText, ChevronRight
} from 'lucide-react';
import { 
  downloadAquaEnterpriseWorkbook, 
  downloadSamplingExcel, 
  downloadHarvestMasterExcel,
  downloadWaterQualityExcel 
} from '../../utils/excelReportGenerator';

const Reports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const base = getAsmBasePath(location.pathname);
  const { db, getMyFarmersByInchargeId, getAgentsByInchargeId, getTanksByFarmerId } = useMockData();

  // Top Section Switcher: 'MY_FARMERS' | 'MY_AGENTS'
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes('/agents') || location.search.includes('tab=agents')) return 'MY_AGENTS';
    return 'MY_FARMERS';
  });

  // Export files header dropdown state
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter States
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('2026-08-01');
  const [filterDateTo, setFilterDateTo] = useState('2026-10-31');
  const [selectedTankId, setSelectedTankId] = useState('');
  const [selectedTestType, setSelectedTestType] = useState('all');
  const [auditSearch, setAuditSearch] = useState('');
  const [expandedSubId, setExpandedSubId] = useState(null);

  // Context Data
  const allFarmers = db?.farmers || [];
  const allAgents = db?.agents || [];
  const allTanks = db?.tanks || [];

  // Farmers list reactively responds to Agent selection
  const availableFarmers = useMemo(() => {
    if (selectedAgentId) {
      const filtered = allFarmers.filter(f => f.agentId === selectedAgentId);
      return filtered.length > 0 ? filtered : allFarmers;
    }
    return allFarmers;
  }, [allFarmers, selectedAgentId]);

  const availableTanks = useMemo(() => {
    if (selectedFarmerId) {
      return getTanksByFarmerId ? (getTanksByFarmerId(selectedFarmerId) || []) : allTanks.filter(t => t.farmerId === selectedFarmerId);
    }
    return allTanks;
  }, [selectedFarmerId, getTanksByFarmerId, allTanks]);

  const farmerObj = allFarmers.find(f => f.id === selectedFarmerId);
  const agentObj = allAgents.find(a => a.id === selectedAgentId);

  // Submissions filtered by Farmer, Agent, Tank, Test Type, and Date Range
  const activeSubmissions = useMemo(() => {
    let list = db?.submissions || [];
    if (list.length === 0) {
      // Generate standard baseline telemetry rows if DB has 0 submissions
      list = [
        { id: 'SUB-101', date: '2026-08-27', time: '08:30 AM', farmerId: 'farmer001', farmerName: 'Appala Raju', agentId: 'agent001', agentName: 'Ramesh (Tech)', tankId: 'tank001', testType: 'Water Quality Analysis', status: 'COMPLETED', data: { waterQuality: { do: 5.6, ph: 7.8, salinity: '16 ppt', alkalinity: 140 }, biomass: '2,750 kg', fcr: '1.17' } },
        { id: 'SUB-102', date: '2026-08-27', time: '09:15 AM', farmerId: 'farmer002', farmerName: 'Bhaskar Rao', agentId: 'agent001', agentName: 'Ramesh (Tech)', tankId: 'tank002', testType: 'Feed Test', status: 'COMPLETED', data: { waterQuality: { do: 5.8, ph: 8.0, salinity: '15 ppt', alkalinity: 145 }, biomass: '3,100 kg', fcr: '1.14' } },
        { id: 'SUB-103', date: '2026-08-26', time: '07:45 AM', farmerId: 'farmer003', farmerName: 'Suresh Varma', agentId: 'agent002', agentName: 'Suresh (Tech)', tankId: 'tank003', testType: 'Weekly Sampling', status: 'COMPLETED', data: { waterQuality: { do: 5.2, ph: 7.9, salinity: '17 ppt', alkalinity: 135 }, biomass: '1,850 kg', fcr: '1.20' } },
        { id: 'SUB-104', date: '2026-08-26', time: '10:30 AM', farmerId: 'farmer004', farmerName: 'Ravi Teja', agentId: 'agent002', agentName: 'Suresh (Tech)', tankId: 'tank004', testType: 'Water Quality Analysis', status: 'COMPLETED', data: { waterQuality: { do: 6.1, ph: 8.1, salinity: '14 ppt', alkalinity: 150 }, biomass: '4,200 kg', fcr: '1.12' } },
        { id: 'SUB-105', date: '2026-08-25', time: '08:00 AM', farmerId: 'farmer005', farmerName: 'K. Venkatesh', agentId: 'agent003', agentName: 'Mahesh (Tech)', tankId: 'tank005', testType: 'Disease Observation', status: 'COMPLETED', data: { waterQuality: { do: 5.4, ph: 7.7, salinity: '16 ppt', alkalinity: 140 }, biomass: '2,400 kg', fcr: '1.18' } },
        { id: 'SUB-106', date: '2026-08-25', time: '11:15 AM', farmerId: 'farmer001', farmerName: 'Appala Raju', agentId: 'agent001', agentName: 'Ramesh (Tech)', tankId: 'tank001', testType: 'Feed Test', status: 'COMPLETED', data: { waterQuality: { do: 5.5, ph: 7.9, salinity: '16 ppt', alkalinity: 142 }, biomass: '2,750 kg', fcr: '1.17' } },
        { id: 'SUB-107', date: '2026-08-24', time: '08:45 AM', farmerId: 'farmer002', farmerName: 'Bhaskar Rao', agentId: 'agent001', agentName: 'Ramesh (Tech)', tankId: 'tank002', testType: 'Water Quality Analysis', status: 'COMPLETED', data: { waterQuality: { do: 5.9, ph: 8.0, salinity: '15 ppt', alkalinity: 145 }, biomass: '3,100 kg', fcr: '1.14' } },
        { id: 'SUB-108', date: '2026-08-24', time: '04:20 PM', farmerId: 'farmer006', farmerName: 'Ch. Anandh', agentId: 'agent003', agentName: 'Mahesh (Tech)', tankId: 'tank006', testType: 'Weekly Sampling', status: 'COMPLETED', data: { waterQuality: { do: 5.7, ph: 7.8, salinity: '18 ppt', alkalinity: 155 }, biomass: '5,300 kg', fcr: '1.15' } },
      ];
    }

    if (activeTab === 'MY_AGENTS' && selectedAgentId) {
      list = list.filter(s => s.agentId === selectedAgentId);
    } else if (activeTab === 'MY_FARMERS') {
      if (selectedFarmerId) list = list.filter(s => s.farmerId === selectedFarmerId);
      if (selectedAgentId) list = list.filter(s => s.agentId === selectedAgentId);
    }

    if (selectedTankId && selectedTankId !== 'all') {
      list = list.filter(s => s.tankId === selectedTankId);
    }
    if (selectedTestType && selectedTestType !== 'all') {
      list = list.filter(s => (s.testType === selectedTestType || s.recordType === selectedTestType));
    }
    if (filterDateFrom) {
      list = list.filter(s => !s.date || s.date >= filterDateFrom);
    }
    if (filterDateTo) {
      list = list.filter(s => !s.date || s.date <= filterDateTo);
    }

    return list;
  }, [db, activeTab, selectedFarmerId, selectedAgentId, selectedTankId, selectedTestType, filterDateFrom, filterDateTo]);

  // Search filter
  const searchedSubmissions = useMemo(() => {
    if (!auditSearch.trim()) return activeSubmissions;
    const q = auditSearch.toLowerCase();
    return activeSubmissions.filter(s => {
      const farmer = allFarmers.find(f => f.id === s.farmerId);
      const agent = allAgents.find(a => a.id === s.agentId);
      return (
        (s.date && s.date.includes(q)) ||
        (s.testType && s.testType.toLowerCase().includes(q)) ||
        (s.tankId && s.tankId.toLowerCase().includes(q)) ||
        (farmer && farmer.name.toLowerCase().includes(q)) ||
        (agent && agent.name.toLowerCase().includes(q)) ||
        (s.farmerName && s.farmerName.toLowerCase().includes(q)) ||
        (s.agentName && s.agentName.toLowerCase().includes(q))
      );
    });
  }, [activeSubmissions, auditSearch, allFarmers, allAgents]);

  // Dynamic Category Stats
  const categoryStats = useMemo(() => {
    const total = activeSubmissions.length;
    let wq = 0, feed = 0, sampling = 0, farm = 0, disease = 0;

    activeSubmissions.forEach(s => {
      const type = (s.testType || s.recordType || '').toLowerCase();
      if (type.includes('water') || type.includes('analysis')) wq++;
      else if (type.includes('feed')) feed++;
      else if (type.includes('sampling') || type.includes('medication') || type.includes('biomass')) sampling++;
      else if (type.includes('disease') || type.includes('health') || type.includes('observation')) disease++;
      else farm++;
    });

    const denom = total > 0 ? total : 1;
    const pWq = total > 0 ? Math.round((wq / denom) * 100) : 0;
    const pFeed = total > 0 ? Math.round((feed / denom) * 100) : 0;
    const pSampling = total > 0 ? Math.round((sampling / denom) * 100) : 0;
    const pFarm = total > 0 ? Math.round((farm / denom) * 100) : 0;
    const pDisease = total > 0 ? Math.max(0, 100 - (pWq + pFeed + pSampling + pFarm)) : 0;

    return {
      wq: { count: wq, pct: pWq },
      feed: { count: feed, pct: pFeed },
      sampling: { count: sampling, pct: pSampling },
      farm: { count: farm, pct: pFarm },
      disease: { count: disease, pct: pDisease },
      totalCount: total
    };
  }, [activeSubmissions]);

  // Unique Active Tanks Count in filtered scope
  const activeTanksCount = useMemo(() => {
    if (selectedFarmerId) {
      return availableTanks.length || 1;
    }
    if (selectedAgentId) {
      const agFarmers = allFarmers.filter(f => f.agentId === selectedAgentId);
      const agTanks = allTanks.filter(t => agFarmers.some(f => f.id === t.farmerId));
      return agTanks.length || 3;
    }
    const uniqueTanks = new Set(activeSubmissions.map(s => s.tankId || s.tankName).filter(Boolean));
    return uniqueTanks.size || (allTanks.length > 0 ? allTanks.length : 8);
  }, [selectedFarmerId, selectedAgentId, availableTanks, allFarmers, allTanks, activeSubmissions]);

  const scopeLabel = useMemo(() => {
    if (activeTab === 'MY_FARMERS') {
      if (farmerObj && agentObj) return `${farmerObj.name} (Tech: ${agentObj.name})`;
      if (farmerObj) return `${farmerObj.name} (${farmerObj.location || 'Local Farm'})`;
      if (agentObj) return `All Farmers under ${agentObj.name}`;
      return 'All Allocated Farmers';
    } else {
      if (agentObj) return `Field Territory: ${agentObj.name} (${agentObj.locality || 'Regional'})`;
      return 'All Supervised Field Agents';
    }
  }, [activeTab, farmerObj, agentObj]);

  const handleExportWorkbook = () => {
    downloadAquaEnterpriseWorkbook(
      db, 
      selectedAgentId || null, 
      activeTab === 'MY_FARMERS' ? (selectedFarmerId || 'ALL') : 'ALL', 
      activeTab === 'MY_FARMERS' ? 'My_Farmers_Analysis_Report' : 'My_Agents_Field_Report',
      filterDateFrom, 
      filterDateTo
    );
  };

  const handleResetFilters = () => {
    setSelectedFarmerId('');
    setSelectedAgentId('');
    setSelectedTankId('');
    setSelectedTestType('all');
    setFilterDateFrom('2026-08-01');
    setFilterDateTo('2026-10-31');
    setAuditSearch('');
  };

  return (
    <div style={styles.pageContainer}>
      
      {/* Top Header Row with Page Title & Export Files Dropdown */}
      <div style={styles.topHeaderRow}>
        <div>
          <h2 style={styles.pageHeading}>Reports &amp; Data Exports</h2>
          <p style={styles.pageSubheading}>
            Comprehensive operational telemetry, weekly water parameter trends, and Excel analysis.
          </p>
        </div>

        {/* Export Files Dropdown */}
        <div style={styles.dropdownWrapper} ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsExportDropdownOpen(prev => !prev)}
            style={styles.exportDropdownBtn}
            className="transition-all duration-150 active:scale-95 cursor-pointer shadow-sm hover:bg-blue-900"
          >
            <Download size={16} />
            <span>Export Files</span>
            <ChevronDown size={15} style={{ transform: isExportDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>

          {isExportDropdownOpen && (
            <div style={styles.exportDropdownMenu} className="left-0 sm:left-auto sm:right-0 animate-modal-in">
              <div style={styles.dropdownHeader}>
                <span>Select Export Format &amp; Dataset</span>
              </div>

              <button
                type="button"
                onClick={() => { setIsExportDropdownOpen(false); handleExportWorkbook(); }}
                style={styles.dropdownItem}
                className="hover:bg-blue-50 transition-colors"
              >
                <div style={{ ...styles.dropdownIconBox, backgroundColor: '#EFF6FF', color: '#1A2FB8' }}>
                  <FileSpreadsheet size={16} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Complete Workbook (.xlsx)</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>5-sheet analyzed workbook with KPIs &amp; audit ledger</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setIsExportDropdownOpen(false); downloadSamplingExcel(db, selectedAgentId || null, selectedFarmerId || 'ALL', filterDateFrom, filterDateTo); }}
                style={styles.dropdownItem}
                className="hover:bg-blue-50 transition-colors"
              >
                <div style={{ ...styles.dropdownIconBox, backgroundColor: '#ECFDF5', color: '#059669' }}>
                  <Table size={16} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Sampling Sheet (.xlsx)</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Biomass growth, ABW, ADG, FCR &amp; survival rates</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setIsExportDropdownOpen(false); downloadHarvestMasterExcel(db, selectedAgentId || null, selectedFarmerId || 'ALL'); }}
                style={styles.dropdownItem}
                className="hover:bg-blue-50 transition-colors"
              >
                <div style={{ ...styles.dropdownIconBox, backgroundColor: '#FEF3C7', color: '#D97706' }}>
                  <BarChart3 size={16} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Harvest Master (.xlsx)</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Partial &amp; final harvest logs, counts &amp; yield totals</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setIsExportDropdownOpen(false); downloadWaterQualityExcel(db, selectedAgentId || null, selectedFarmerId || 'ALL', filterDateFrom, filterDateTo); }}
                style={styles.dropdownItem}
                className="hover:bg-blue-50 transition-colors"
              >
                <div style={{ ...styles.dropdownIconBox, backgroundColor: '#F0FDF4', color: '#16A34A' }}>
                  <Droplets size={16} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Water Quality Report (.xlsx)</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>pH, DO, Salinity, Alkalinity, Hardness &amp; Ammonia</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setIsExportDropdownOpen(false); window.print(); }}
                style={{ ...styles.dropdownItem, borderTop: '1px solid #F1F5F9' }}
                className="hover:bg-blue-50 transition-colors"
              >
                <div style={{ ...styles.dropdownIconBox, backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
                  <Printer size={16} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Print / Save PDF (.pdf)</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Clean regional executive summary format</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP SWITCHER BUTTONS: "MY FARMERS" & "MY AGENTS" (Side by Side)        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-2.5 sm:flex sm:gap-3 mb-5 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => setActiveTab('MY_FARMERS')}
          style={activeTab === 'MY_FARMERS' ? styles.tabBtnActiveBlue : styles.tabBtnInactive}
          className="flex-1 sm:flex-initial transition-all duration-150 cursor-pointer shadow-sm justify-center"
        >
          <Users size={16} className="shrink-0" />
          <span className="truncate">My Farmers</span>
          <span style={activeTab === 'MY_FARMERS' ? styles.badgeActiveBlue : styles.badgeInactive} className="shrink-0">
            {allFarmers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MY_AGENTS')}
          style={activeTab === 'MY_AGENTS' ? styles.tabBtnActiveGreen : styles.tabBtnInactive}
          className="flex-1 sm:flex-initial transition-all duration-150 cursor-pointer shadow-sm justify-center"
        >
          <ShieldCheck size={16} className="shrink-0" />
          <span className="truncate">My Agents</span>
          <span style={activeTab === 'MY_AGENTS' ? styles.badgeActiveGreen : styles.badgeInactive} className="shrink-0">
            {allAgents.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. FILTER CARD (Farmer, Agent, Date From, Date To)                        */}
      {/* ========================================================================= */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} color="#1A2FB8" />
            <h3 style={styles.cardTitle}>
              {activeTab === 'MY_FARMERS' ? 'Filter My Farmers Data' : 'Filter My Agents Data'}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={styles.activeTag}>
              <Sparkles size={12} /> {activeSubmissions.length} Matching Records
            </span>
            <button
              type="button"
              onClick={handleExportWorkbook}
              style={styles.downloadExcelMainBtn}
              className="transition-all duration-150 active:scale-95 cursor-pointer shadow-sm hover:opacity-95"
              title="Download complete 5-sheet analyzed Excel workbook for the selected filters"
            >
              <FileSpreadsheet size={16} />
              <span>Download Excel Analysis (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Top 4 Filters in Requested Order */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '16px' }}>
          
          {/* 1. Farmer Selector (Shown in My Farmers mode or general) */}
          {activeTab === 'MY_FARMERS' && (
            <div>
              <label style={styles.formLabel}>
                <User size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Select Farmer
              </label>
              <select 
                style={styles.formInput} 
                value={selectedFarmerId} 
                onChange={e => { 
                  setSelectedFarmerId(e.target.value); 
                  setSelectedTankId(''); 
                }}
              >
                <option value="">All Farmers ({availableFarmers.length})</option>
                {availableFarmers.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.location ? `(${f.location.split(',')[0]})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. Field Agent Selector */}
          <div>
            <label style={styles.formLabel}>
              <ShieldCheck size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Select Field Agent
            </label>
            <select 
              style={styles.formInput} 
              value={selectedAgentId} 
              onChange={e => { 
                const newAgent = e.target.value;
                setSelectedAgentId(newAgent); 
                if (newAgent && selectedFarmerId) {
                  const farmer = allFarmers.find(f => f.id === selectedFarmerId);
                  if (farmer && farmer.agentId && farmer.agentId !== newAgent) {
                    setSelectedFarmerId('');
                  }
                }
                setSelectedTankId(''); 
              }}
            >
              <option value="">All Field Agents ({allAgents.length})</option>
              {allAgents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} {a.locality ? `(${a.locality})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Date From Filter */}
          <div>
            <label style={styles.formLabel}>
              <Calendar size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Date From
            </label>
            <input 
              type="date" 
              value={filterDateFrom} 
              onChange={e => setFilterDateFrom(e.target.value)} 
              style={styles.formInput} 
            />
          </div>

          {/* 4. Date To Filter */}
          <div>
            <label style={styles.formLabel}>
              <Calendar size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Date To
            </label>
            <input 
              type="date" 
              value={filterDateTo} 
              onChange={e => setFilterDateTo(e.target.value)} 
              style={styles.formInput} 
            />
          </div>

        </div>

        {/* Secondary Filters Sub-row */}
        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', flex: 1 }}>
            <div>
              <label style={styles.formLabel}>Tank / Pond</label>
              <select 
                style={styles.formInput} 
                value={selectedTankId} 
                onChange={e => setSelectedTankId(e.target.value)}
              >
                <option value="">All Supervised Tanks {availableTanks.length > 0 ? `(${availableTanks.length})` : ''}</option>
                {availableTanks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.formLabel}>Record Category</label>
              <select 
                style={styles.formInput} 
                value={selectedTestType} 
                onChange={e => setSelectedTestType(e.target.value)}
              >
                <option value="all">All Field Records</option>
                <option value="Water Quality Analysis">Water Quality</option>
                <option value="Feed Test">Feed Consumption</option>
                <option value="Weekly Sampling">Weekly Sampling</option>
                <option value="Disease Observation">Disease Observation</option>
                <option value="Harvest">Harvest Summary</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-end', flexWrap: 'wrap' }}>
            {(selectedFarmerId || selectedAgentId || selectedTankId || selectedTestType !== 'all' || filterDateFrom !== '2026-08-01' || filterDateTo !== '2026-10-31') && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={styles.resetBtn}
                className="hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportWorkbook}
              style={styles.downloadSecBtn}
              className="transition-all duration-150 active:scale-95 cursor-pointer shadow-sm hover:bg-blue-100"
            >
              <FileSpreadsheet size={14} />
              <span>Export Filtered Excel ({activeSubmissions.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. VISUAL ANALYTICS DASHBOARD (Exact Match to Screenshot 2)               */}
      {/* ========================================================================= */}
      
      {/* 3.1 TOP KPI SUMMARY CARD (Total Tests | Pass Rate | Active Tanks) */}
      <div style={styles.kpiCard}>
        <div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#1A2FB8', lineHeight: 1.1 }}>
            {activeSubmissions.length}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', marginTop: '6px' }}>
            Total Tests
          </div>
        </div>

        <div style={{ borderLeft: '1px solid #F1F5F9', borderRight: '1px solid #F1F5F9' }}>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#10B981', lineHeight: 1.1 }}>
            96.8%
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', marginTop: '6px' }}>
            Pass Rate
          </div>
        </div>

        <div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#1A2FB8', lineHeight: 1.1 }}>
            {activeTanksCount}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', marginTop: '6px' }}>
            Active Tanks
          </div>
        </div>
      </div>

      {/* 3.2 WATER QUALITY PARAMETERS & TEST BREAKDOWN BY CATEGORY */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Card 1: WATER QUALITY PARAMETERS */}
        <div style={styles.chartCard}>
          {/* Header with Legend */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0 }}>
                WATER QUALITY PARAMETERS
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0 0' }}>
                Weekly Dissolved Oxygen (DO) &amp; pH Trends • <strong style={{ color: '#0F172A' }}>{scopeLabel}</strong>
              </p>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#002299' }} />
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>DO (mg/L)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>pH</span>
              </div>
            </div>
          </div>

          {/* SVG Chart */}
          <div style={{ width: '100%', height: '170px', position: 'relative' }}>
            <svg viewBox="0 0 540 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                {/* pH Green Gradient */}
                <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.06" />
                </linearGradient>

                {/* DO Blue Gradient */}
                <linearGradient id="doGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#002299" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#002299" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y-Axis Grid Lines & Labels */}
              <text x="0" y="18" fill="#94A3B8" fontSize="11" fontWeight="600" textAnchor="start">9</text>
              <line x1="20" y1="14" x2="540" y2="14" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />

              <text x="0" y="52" fill="#94A3B8" fontSize="11" fontWeight="600" textAnchor="start">8</text>
              <line x1="20" y1="48" x2="540" y2="48" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />

              <text x="0" y="98" fill="#94A3B8" fontSize="11" fontWeight="600" textAnchor="start">6</text>
              <line x1="20" y1="94" x2="540" y2="94" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />

              <text x="0" y="142" fill="#94A3B8" fontSize="11" fontWeight="600" textAnchor="start">4</text>
              <line x1="20" y1="138" x2="540" y2="138" stroke="#CBD5E1" strokeWidth="1.5" />

              {/* pH Filled Area (Top Layer) */}
              <path
                d="M 20,49 Q 63,46 106,47 T 193,52 T 280,41 T 366,45 T 453,49 T 540,46 L 540,138 L 20,138 Z"
                fill="url(#phGrad)"
              />

              {/* pH Smooth Stroke */}
              <path
                d="M 20,49 Q 63,46 106,47 T 193,52 T 280,41 T 366,45 T 453,49 T 540,46"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* DO Filled Area (Bottom Layer) */}
              <path
                d="M 20,105 Q 63,94 106,94 T 193,112 T 280,98 T 366,88 T 453,98 T 540,92 L 540,138 L 20,138 Z"
                fill="url(#doGrad)"
              />

              {/* DO Smooth Stroke */}
              <path
                d="M 20,105 Q 63,94 106,94 T 193,112 T 280,98 T 366,88 T 453,98 T 540,92"
                fill="none"
                stroke="#002299"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* X-Axis Labels */}
              <text x="20" y="156" fill="#64748B" fontSize="11" fontWeight="600" textAnchor="start">Mon</text>
              <text x="106" y="156" fill="#64748B" fontSize="11" fontWeight="600" textAnchor="middle">Tue</text>
              <text x="193" y="156" fill="#64748B" fontSize="11" fontWeight="600" textAnchor="middle">Wed</text>
              <text x="280" y="156" fill="#64748B" fontSize="11" fontWeight="600" textAnchor="middle">Thu</text>
              <text x="366" y="156" fill="#64748B" fontSize="11" fontWeight="600" textAnchor="middle">Fri</text>
              <text x="453" y="156" fill="#64748B" fontSize="11" fontWeight="600" textAnchor="middle">Sat</text>
              <text x="540" y="156" fill="#64748B" fontSize="11" fontWeight="600" textAnchor="end">Sun</text>
            </svg>
          </div>
        </div>

        {/* Card 2: TEST BREAKDOWN BY CATEGORY */}
        <div style={styles.chartCard}>
          {/* Header */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0 }}>
                TEST BREAKDOWN BY CATEGORY
              </h3>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>
                {categoryStats.totalCount} Tests Logged
              </span>
            </div>

            {/* Progress List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* 1. Water Quality */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>Water Quality</span>
                  <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>
                    {categoryStats.wq.count} tests ({categoryStats.wq.pct}%)
                  </span>
                </div>
                <div style={{ height: '7px', backgroundColor: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${categoryStats.wq.pct}%`, height: '100%', backgroundColor: '#002299', borderRadius: '9999px', transition: 'width 0.3s' }} />
                </div>
              </div>

              {/* 2. Feed Tests */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>Feed Tests</span>
                  <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>
                    {categoryStats.feed.count} tests ({categoryStats.feed.pct}%)
                  </span>
                </div>
                <div style={{ height: '7px', backgroundColor: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${categoryStats.feed.pct}%`, height: '100%', backgroundColor: '#D97706', borderRadius: '9999px', transition: 'width 0.3s' }} />
                </div>
              </div>

              {/* 3. Weekly Sampling */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>Weekly Sampling</span>
                  <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>
                    {categoryStats.sampling.count} tests ({categoryStats.sampling.pct}%)
                  </span>
                </div>
                <div style={{ height: '7px', backgroundColor: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${categoryStats.sampling.pct}%`, height: '100%', backgroundColor: '#2563EB', borderRadius: '9999px', transition: 'width 0.3s' }} />
                </div>
              </div>

              {/* 4. Farm Activity */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>Farm Activity</span>
                  <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>
                    {categoryStats.farm.count} tests ({categoryStats.farm.pct}%)
                  </span>
                </div>
                <div style={{ height: '7px', backgroundColor: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${categoryStats.farm.pct}%`, height: '100%', backgroundColor: '#059669', borderRadius: '9999px', transition: 'width 0.3s' }} />
                </div>
              </div>

              {/* 5. Disease Observation */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>Disease Observation</span>
                  <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '600' }}>
                    {categoryStats.disease.count} tests ({categoryStats.disease.pct}%)
                  </span>
                </div>
                <div style={{ height: '7px', backgroundColor: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${categoryStats.disease.pct}%`, height: '100%', backgroundColor: '#DC2626', borderRadius: '9999px', transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. AUDIT LOGS & DETAILED RECORDS LEDGER TABLE                             */}
      {/* ========================================================================= */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Table size={18} color="#1A2FB8" />
            <h3 style={styles.cardTitle}>
              Audit Logs &amp; Field Records Ledger ({searchedSubmissions.length} Entries)
            </h3>
          </div>

          <button
            type="button"
            onClick={handleExportWorkbook}
            style={styles.downloadSecBtn}
            className="transition-all duration-150 active:scale-95 cursor-pointer shadow-sm hover:bg-blue-100"
          >
            <Download size={14} />
            <span>Export Table (.xlsx)</span>
          </button>
        </div>

        {/* Quick Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', marginBottom: '14px', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '8px 12px', backgroundColor: '#F8FAFC' }}>
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Search audit records by farmer, technician, tank, or test type..."
            value={auditSearch}
            onChange={e => setAuditSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', backgroundColor: 'transparent', color: '#0F172A' }}
          />
        </div>

        {/* Clean, Minimal Expandable List: Only Farmer Name & Test Status by default */}
        <div className="space-y-2.5">
          {searchedSubmissions.map((sub, idx) => {
            const subKey = sub.id || `sub-${idx}`;
            const isExpanded = expandedSubId === subKey;
            const farmer = allFarmers.find(f => f.id === sub.farmerId);
            const agent = allAgents.find(a => a.id === sub.agentId);
            const wq = sub.data?.waterQuality || sub.data || {};
            const tankName = sub.tankId ? `Tank ${sub.tankId.replace(/\D/g, '') || '1'}` : (sub.tankName || 'Tank 1');
            const farmerName = farmer ? farmer.name : (sub.farmerName || 'Farmer');
            const locality = farmer ? (farmer.location || farmer.village) : 'Bhimavaram';
            const agentName = agent ? agent.name : (sub.agentName || 'Ramesh');
            const testType = sub.testType || sub.recordType || 'Water Quality Analysis';
            const isCompleted = sub.status === 'COMPLETED' || sub.status === 'Verified' || sub.status === 'Done';

            return (
              <div 
                key={subKey} 
                className={`bg-white border rounded-xl transition-all duration-150 overflow-hidden ${
                  isExpanded ? 'border-blue-500 shadow-md ring-1 ring-blue-100' : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* 1. Collapsed Row (Default): ONLY Farmer Name & Test Status */}
                <button
                  type="button"
                  onClick={() => setExpandedSubId(prev => prev === subKey ? null : subKey)}
                  className="w-full flex items-center justify-between p-3.5 text-left bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-slate-900 text-sm sm:text-base truncate">
                      {farmerName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full border ${
                      isCompleted 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      <CheckCircle2 size={13} />
                      <span>{isCompleted ? 'Done' : 'Logged'}</span>
                    </span>

                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <ChevronDown 
                        size={16} 
                        style={{ 
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }} 
                      />
                    </div>
                  </div>
                </button>

                {/* 2. Expanded Details Panel: Displays ALL data on click */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-3.5">
                    {/* General Metadata */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">Date &amp; Time</span>
                        <span className="font-bold text-slate-800">{sub.date} {sub.time ? `• ${sub.time}` : ''}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">Tank / Pond</span>
                        <span className="font-bold text-blue-700">{tankName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">Location</span>
                        <span className="font-bold text-slate-800">{locality}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">Field Technician</span>
                        <span className="font-bold text-slate-800">{agentName}</span>
                      </div>
                    </div>

                    {/* Record Category */}
                    <div className="flex items-center justify-between text-xs bg-white px-3.5 py-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-medium">Record Category:</span>
                      <span className="font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                        {testType}
                      </span>
                    </div>

                    {/* Telemetry Parameters Grid */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 px-0.5">
                        Water Quality &amp; Telemetry Parameters
                      </span>
                      <div className="grid grid-cols-3 gap-2 text-center bg-white p-3 rounded-xl border border-slate-200">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Dissolved Oxygen</span>
                          <span className="text-sm font-extrabold text-blue-900 mt-0.5">
                            {wq.do ? `${wq.do} mg/L` : '5.4 mg/L'}
                          </span>
                        </div>
                        <div className="flex flex-col border-x border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-400">pH Level</span>
                          <span className="text-sm font-extrabold text-emerald-600 mt-0.5">
                            {wq.ph || '7.9'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Salinity</span>
                          <span className="text-sm font-extrabold text-slate-700 mt-0.5">
                            {wq.salinity ? (String(wq.salinity).includes('ppt') ? wq.salinity : `${wq.salinity} ppt`) : '16 ppt'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Growth & Farm Metrics (if available) */}
                    {(sub.data?.biomass || sub.data?.fcr || wq.alkalinity) && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-200 text-slate-600">
                        {sub.data?.biomass && (
                          <div>
                            <span className="text-slate-400 block text-[10.5px]">Biomass Total:</span>
                            <span className="font-bold text-slate-800">{sub.data.biomass}</span>
                          </div>
                        )}
                        {sub.data?.fcr && (
                          <div>
                            <span className="text-slate-400 block text-[10.5px]">Feed Conversion (FCR):</span>
                            <span className="font-bold text-amber-600">{sub.data.fcr}</span>
                          </div>
                        )}
                        {wq.alkalinity && (
                          <div>
                            <span className="text-slate-400 block text-[10.5px]">Alkalinity:</span>
                            <span className="font-bold text-slate-800">{wq.alkalinity} ppm</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {searchedSubmissions.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No audit records found matching your selected filters.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

const styles = {
  pageContainer: {
    padding: '20px 20px 80px 20px',
    maxWidth: '1440px',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  topHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px',
    flexWrap: 'wrap',
    gap: '14px',
  },
  pageHeading: {
    fontSize: '22px',
    fontWeight: '900',
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  pageSubheading: {
    fontSize: '12.5px',
    color: '#64748B',
    margin: '3px 0 0 0',
    lineHeight: 1.4,
  },
  tabSwitcherContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  tabBtnActiveBlue: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 14px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    fontSize: '13.5px',
    fontWeight: '800',
    boxShadow: '0 4px 12px rgba(26, 47, 184, 0.25)',
    whiteSpace: 'nowrap',
  },
  tabBtnActiveGreen: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 14px',
    backgroundColor: '#059669',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    fontSize: '13.5px',
    fontWeight: '800',
    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
    whiteSpace: 'nowrap',
  },
  tabBtnInactive: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 14px',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '12px',
    fontSize: '13.5px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },
  badgeActiveBlue: {
    padding: '2px 8px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    color: '#FFFFFF',
    fontSize: '11.5px',
    fontWeight: '800',
  },
  badgeActiveGreen: {
    padding: '2px 8px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    color: '#FFFFFF',
    fontSize: '11.5px',
    fontWeight: '800',
  },
  badgeInactive: {
    padding: '2px 8px',
    borderRadius: '12px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    fontSize: '11.5px',
    fontWeight: '700',
  },
  dropdownWrapper: {
    position: 'relative',
    display: 'inline-block',
  },
  exportDropdownBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 18px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  exportDropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    width: '320px',
    maxWidth: 'calc(100vw - 36px)',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.18), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
    zIndex: 1000,
    overflow: 'hidden',
  },
  dropdownHeader: {
    padding: '10px 14px',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #F1F5F9',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '10px 14px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px solid #F8FAFC',
    cursor: 'pointer',
    textAlign: 'left',
  },
  dropdownIconBox: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '22px 24px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
    marginBottom: '22px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid #F1F5F9',
    flexWrap: 'wrap',
    gap: '12px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  activeTag: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#1A2FB8',
    backgroundColor: '#EFF6FF',
    border: '1px solid #DBEAFE',
    padding: '4px 9px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  downloadExcelMainBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 16px',
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '9px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)',
  },
  downloadSecBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #BFDBFE',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  resetBtn: {
    padding: '8px 12px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  formLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '6px',
  },
  formInput: {
    width: '100%',
    padding: '9px 12px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
  },

  // KPI Card
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '20px 24px',
    marginBottom: '22px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    textAlign: 'center',
    alignItems: 'center',
  },

  // Chart Cards
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '22px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  // Table Styles
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    border: '1px solid #E2E8F0',
  },
  thRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '2px solid #E2E8F0',
  },
  th: {
    padding: '12px 14px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#0F172A',
    verticalAlign: 'middle',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
};

export default Reports;
