import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMockData } from '../../context/MockDataContext';
import { getAsmBasePath } from '../utils/asmNavigation';
import { 
  Users, ShieldCheck, FileSpreadsheet, Download, Search, 
  Droplets, CheckCircle2, ChevronDown, ChevronRight, ArrowLeft,
  Phone, MapPin, Fish, Scale, Activity, Calendar, Clock,
  Table, Sparkles, User, ExternalLink
} from 'lucide-react';
import { 
  downloadAquaEnterpriseWorkbook, 
  downloadSamplingExcel, 
  downloadHarvestMasterExcel,
  downloadWaterQualityExcel 
} from '../../utils/excelReportGenerator';

const Reports = ({ defaultView = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const base = getAsmBasePath(location.pathname);
  const { db, getMyFarmersByInchargeId, getAgentsByInchargeId, getTanksByFarmerId } = useMockData();

  // Determine current active view: 'HOME' | 'FARMERS' | 'AGENTS'
  const [currentView, setCurrentView] = useState(() => {
    if (defaultView === 'FARMERS' || location.pathname.includes('/farmers') || location.search.includes('view=farmers') || location.search.includes('tab=farmers')) {
      return 'FARMERS';
    }
    if (defaultView === 'AGENTS' || location.pathname.includes('/agents') || location.search.includes('view=agents') || location.search.includes('tab=agents')) {
      return 'AGENTS';
    }
    return 'HOME';
  });

  // Sync state if URL changes
  useEffect(() => {
    if (location.pathname.includes('/farmers') || location.search.includes('view=farmers') || location.search.includes('tab=farmers')) {
      setCurrentView('FARMERS');
    } else if (location.pathname.includes('/agents') || location.search.includes('view=agents') || location.search.includes('tab=agents')) {
      setCurrentView('AGENTS');
    } else if (location.pathname.endsWith('/reports') && !location.search) {
      setCurrentView('HOME');
    }
  }, [location.pathname, location.search]);

  // Context Data
  const allFarmers = db?.farmers || [];
  const allAgents = db?.agents || [];
  const allTanks = db?.tanks || [];
  const allSubmissions = db?.submissions || [];

  // Incharge / ASM allocated personal farmers
  const allocatedFarmers = useMemo(() => {
    const inchargeFarmers = getMyFarmersByInchargeId ? getMyFarmersByInchargeId('INC001') : [];
    if (inchargeFarmers.length > 0) return inchargeFarmers;
    return allFarmers.filter(f => f.inchargeId === 'INC001' || !f.agentId || f.assignedTo === 'Incharge' || allFarmers.length <= 20);
  }, [allFarmers, getMyFarmersByInchargeId]);

  // Supervised Field Agents
  const supervisedAgents = useMemo(() => {
    const agents = getAgentsByInchargeId ? getAgentsByInchargeId('INC001') : [];
    return agents.length > 0 ? agents : allAgents;
  }, [allAgents, getAgentsByInchargeId]);

  // ---------------------------------------------------------------------------
  // Search & Filter States
  // ---------------------------------------------------------------------------
  const [farmerSearch, setFarmerSearch] = useState('');
  const [agentSearch, setAgentSearch] = useState('');
  const [expandedFarmerId, setExpandedFarmerId] = useState(null);
  const [expandedAgentId, setExpandedAgentId] = useState(null);

  // Filtered Farmers
  const filteredFarmers = useMemo(() => {
    if (!farmerSearch.trim()) return allocatedFarmers;
    const q = farmerSearch.toLowerCase();
    return allocatedFarmers.filter(f => 
      f.name?.toLowerCase().includes(q) ||
      f.phone?.includes(q) ||
      f.location?.toLowerCase().includes(q) ||
      f.village?.toLowerCase().includes(q)
    );
  }, [allocatedFarmers, farmerSearch]);

  // Filtered Agents
  const filteredAgents = useMemo(() => {
    if (!agentSearch.trim()) return supervisedAgents;
    const q = agentSearch.toLowerCase();
    return supervisedAgents.filter(a => 
      a.name?.toLowerCase().includes(q) ||
      a.phone?.includes(q) ||
      a.locality?.toLowerCase().includes(q) ||
      a.region?.toLowerCase().includes(q)
    );
  }, [supervisedAgents, agentSearch]);

  // ---------------------------------------------------------------------------
  // Export Handlers
  // ---------------------------------------------------------------------------
  const handleExportAllFarmers = () => {
    downloadAquaEnterpriseWorkbook(
      db,
      null,
      'ALL',
      'My_Allocated_Farmers_Complete_Report'
    );
  };

  const handleExportSingleFarmer = (farmer) => {
    downloadAquaEnterpriseWorkbook(
      db,
      null,
      farmer.id,
      `${farmer.name.replace(/\s+/g, '_')}_Farm_Report`
    );
  };

  const handleExportAllAgents = () => {
    downloadAquaEnterpriseWorkbook(
      db,
      'ALL',
      'ALL',
      'My_Agents_Field_Operations_Report'
    );
  };

  const handleExportSingleAgent = (agent) => {
    downloadAquaEnterpriseWorkbook(
      db,
      agent.id,
      'ALL',
      `${agent.name.replace(/\s+/g, '_')}_Agent_Performance_Report`
    );
  };

  // Switch View Helper
  const navigateToView = (view) => {
    setCurrentView(view);
    if (view === 'FARMERS') {
      navigate(`${base}/reports/farmers`, { replace: true });
    } else if (view === 'AGENTS') {
      navigate(`${base}/reports/agents`, { replace: true });
    } else {
      navigate(`${base}/reports`, { replace: true });
    }
  };

  return (
    <div style={styles.pageContainer}>
      
      {/* ===================================================================== */}
      {/* 1. MAIN LANDING VIEW (TWO PROMINENT BUTTONS: MY FARMERS & MY AGENTS)  */}
      {/* ===================================================================== */}
      {currentView === 'HOME' && (
        <div>
          {/* Header */}
          <div style={styles.landingHeader}>
            <h2 style={styles.pageHeading}>Reports &amp; Data Center</h2>
            <p style={styles.pageSubheading}>
              Select an operational section to view details, monitor field telemetry, and download Excel reports:
            </p>
          </div>

          {/* Two Prominent Interactive Option Cards / Buttons */}
          <div style={styles.twoButtonsGrid}>
            
            {/* BUTTON 1: MY FARMERS */}
            <button
              type="button"
              onClick={() => navigateToView('FARMERS')}
              style={styles.bigNavCardBlue}
              className="group transition-all duration-200 active:scale-[0.98] cursor-pointer text-left hover:shadow-xl hover:border-blue-300"
            >
              <div style={styles.cardTopRow}>
                <div style={styles.iconCircleBlue}>
                  <Users size={28} color="#1A2FB8" />
                </div>
                <span style={styles.badgeBlue}>
                  {allocatedFarmers.length} Allocated Farmers
                </span>
              </div>

              <div>
                <h3 style={styles.cardHeadingBlue}>
                  My Farmers
                </h3>
                <p style={styles.cardDescription}>
                  View details of all farmers allocated to you, monitor pond parameters, and download complete Excel reports.
                </p>
              </div>

              <div style={styles.cardActionRowBlue} className="group-hover:translate-x-1 transition-transform">
                <span style={styles.actionTextBlue}>Open My Farmers Reports</span>
                <ChevronRight size={18} color="#1A2FB8" />
              </div>
            </button>

            {/* BUTTON 2: MY AGENTS */}
            <button
              type="button"
              onClick={() => navigateToView('AGENTS')}
              style={styles.bigNavCardGreen}
              className="group transition-all duration-200 active:scale-[0.98] cursor-pointer text-left hover:shadow-xl hover:border-emerald-300"
            >
              <div style={styles.cardTopRow}>
                <div style={styles.iconCircleGreen}>
                  <ShieldCheck size={28} color="#059669" />
                </div>
                <span style={styles.badgeGreen}>
                  {supervisedAgents.length} Field Agents
                </span>
              </div>

              <div>
                <h3 style={styles.cardHeadingGreen}>
                  My Agents
                </h3>
                <p style={styles.cardDescription}>
                  View field technicians under your supervision, check test submission logs, and download performance reports.
                </p>
              </div>

              <div style={styles.cardActionRowGreen} className="group-hover:translate-x-1 transition-transform">
                <span style={styles.actionTextGreen}>Open My Agents Reports</span>
                <ChevronRight size={18} color="#059669" />
              </div>
            </button>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. "MY FARMERS" REPORTS & DETAILS PAGE                                */}
      {/* ===================================================================== */}
      {currentView === 'FARMERS' && (
        <div>
          {/* Top Bar with Back Button & Excel Export */}
          <div style={styles.subPageTopBar}>
            <button
              type="button"
              onClick={() => navigateToView('HOME')}
              style={styles.backBtn}
              className="hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Reports</span>
            </button>

            <button
              type="button"
              onClick={handleExportAllFarmers}
              style={styles.downloadPrimaryBtnBlue}
              className="transition-all duration-150 active:scale-95 cursor-pointer shadow-md hover:bg-blue-900"
            >
              <FileSpreadsheet size={16} />
              <span>Download All Farmers Excel (.xlsx)</span>
            </button>
          </div>

          {/* Section Heading */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={22} color="#1A2FB8" />
              <h2 style={styles.pageHeading}>My Allocated Farmers Reports</h2>
            </div>
            <p style={styles.pageSubheading}>
              Detailed farm telemetry, active ponds, and exportable reports for farmers assigned to your supervision ({allocatedFarmers.length} Total).
            </p>
          </div>

          {/* Quick Search */}
          <div style={styles.searchBarWrap}>
            <Search size={16} color="#64748B" />
            <input
              type="text"
              placeholder="Search allocated farmers by name, phone, village, or location..."
              value={farmerSearch}
              onChange={(e) => setFarmerSearch(e.target.value)}
              style={styles.searchInput}
            />
            {farmerSearch && (
              <button 
                type="button" 
                onClick={() => setFarmerSearch('')} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', fontSize: '12px' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Farmers List Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredFarmers.map((farmer, idx) => {
              const tanks = getTanksByFarmerId ? getTanksByFarmerId(farmer.id) : allTanks.filter(t => t.farmerId === farmer.id);
              const farmerSubmissions = allSubmissions.filter(s => s.farmerId === farmer.id);
              const isExpanded = expandedFarmerId === farmer.id;
              const locality = farmer.location || farmer.village || 'Bhimavaram';

              return (
                <div 
                  key={farmer.id || idx} 
                  style={styles.itemCard}
                  className="transition-all duration-150 border border-slate-200 hover:border-blue-300 shadow-xs"
                >
                  {/* Card Header Row */}
                  <div style={styles.itemCardHeader}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={styles.itemTitle}>{farmer.name}</span>
                        <span style={styles.itemPillBlue}>
                          {tanks.length || 1} {tanks.length === 1 ? 'Tank' : 'Tanks'}
                        </span>
                        <span style={styles.itemPillGreen}>
                          <CheckCircle2 size={12} /> {farmerSubmissions.length} Tests Logged
                        </span>
                      </div>

                      <div style={styles.metaRow}>
                        <span>📞 {farmer.phone || '9848012345'}</span>
                        <span>•</span>
                        <span>📍 {locality}</span>
                      </div>
                    </div>

                    {/* Download Single Farmer Excel & Expand Details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleExportSingleFarmer(farmer)}
                        style={styles.downloadSecBtn}
                        className="transition-all duration-150 active:scale-95 cursor-pointer shadow-xs hover:bg-blue-50"
                        title="Download complete Excel report for this farmer"
                      >
                        <Download size={13} />
                        <span>Download (.xlsx)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedFarmerId(prev => prev === farmer.id ? null : farmer.id)}
                        style={styles.expandBtn}
                        className="transition-all duration-150 active:scale-95 cursor-pointer hover:bg-slate-100"
                      >
                        <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                        <ChevronDown 
                          size={15} 
                          style={{ 
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }} 
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Tank Details & Telemetry */}
                  {isExpanded && (
                    <div style={styles.expandedContent}>
                      <h4 style={styles.expandedSectionTitle}>
                        Pond / Tank Telemetry &amp; Parameters
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                        {(tanks.length > 0 ? tanks : [{ id: 'tank-1', name: 'Tank 1', size: '2.5 Acres', status: 'ACTIVE', biomass: '2,750 kg', fcr: '1.17', doc: 45 }]).map((tank, tIdx) => {
                          const tankSub = farmerSubmissions.find(s => s.tankId === tank.id) || farmerSubmissions[0] || {};
                          const wq = tankSub.data?.waterQuality || tankSub.data || {};

                          return (
                            <div key={tank.id || tIdx} style={styles.tankSubCard}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontWeight: '800', color: '#1A2FB8', fontSize: '13px' }}>
                                  {tank.name || `Tank ${tIdx + 1}`}
                                </span>
                                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                                  DOC: {tank.doc || 45} Days
                                </span>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', backgroundColor: '#F8FAFC', padding: '8px 4px', borderRadius: '8px' }}>
                                <div>
                                  <span style={{ fontSize: '10px', color: '#64748B', display: 'block', fontWeight: '700' }}>DO</span>
                                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#002299' }}>{wq.do ? `${wq.do} mg/L` : '5.6 mg/L'}</span>
                                </div>
                                <div style={{ borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
                                  <span style={{ fontSize: '10px', color: '#64748B', display: 'block', fontWeight: '700' }}>pH</span>
                                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#10B981' }}>{wq.ph || '7.8'}</span>
                                </div>
                                <div>
                                  <span style={{ fontSize: '10px', color: '#64748B', display: 'block', fontWeight: '700' }}>Salinity</span>
                                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569' }}>{wq.salinity ? (String(wq.salinity).includes('ppt') ? wq.salinity : `${wq.salinity} ppt`) : '16 ppt'}</span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginTop: '8px' }}>
                                <span>Biomass: <strong style={{ color: '#0F172A' }}>{tank.biomass || '2,750 kg'}</strong></span>
                                <span>FCR: <strong style={{ color: '#D97706' }}>{tank.fcr || '1.17'}</strong></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFarmers.length === 0 && (
              <div style={styles.emptyState}>
                <p>No allocated farmers found matching "{farmerSearch}".</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. "MY AGENTS" REPORTS & DETAILS PAGE                                 */}
      {/* ===================================================================== */}
      {currentView === 'AGENTS' && (
        <div>
          {/* Top Bar with Back Button & Excel Export */}
          <div style={styles.subPageTopBar}>
            <button
              type="button"
              onClick={() => navigateToView('HOME')}
              style={styles.backBtn}
              className="hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Reports</span>
            </button>

            <button
              type="button"
              onClick={handleExportAllAgents}
              style={styles.downloadPrimaryBtnGreen}
              className="transition-all duration-150 active:scale-95 cursor-pointer shadow-md hover:bg-emerald-800"
            >
              <FileSpreadsheet size={16} />
              <span>Download All Agents Excel (.xlsx)</span>
            </button>
          </div>

          {/* Section Heading */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={22} color="#059669" />
              <h2 style={styles.pageHeading}>My Supervised Agents Reports</h2>
            </div>
            <p style={styles.pageSubheading}>
              Field technician performance, submission audit logs, and operational reports for agents under your supervision ({supervisedAgents.length} Total).
            </p>
          </div>

          {/* Quick Search */}
          <div style={styles.searchBarWrap}>
            <Search size={16} color="#64748B" />
            <input
              type="text"
              placeholder="Search field agents by name, locality, phone, or region..."
              value={agentSearch}
              onChange={(e) => setAgentSearch(e.target.value)}
              style={styles.searchInput}
            />
            {agentSearch && (
              <button 
                type="button" 
                onClick={() => setAgentSearch('')} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', fontSize: '12px' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Agents List Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredAgents.map((agent, idx) => {
              const agentFarmers = allFarmers.filter(f => f.agentId === agent.id);
              const agentSubmissions = allSubmissions.filter(s => s.agentId === agent.id);
              const isExpanded = expandedAgentId === agent.id;
              const locality = agent.locality || agent.region || 'Bhimavaram East';

              return (
                <div 
                  key={agent.id || idx} 
                  style={styles.itemCard}
                  className="transition-all duration-150 border border-slate-200 hover:border-emerald-300 shadow-xs"
                >
                  {/* Card Header Row */}
                  <div style={styles.itemCardHeader}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={styles.itemTitle}>{agent.name}</span>
                        <span style={styles.itemPillGreen}>
                          <Users size={12} /> {agentFarmers.length} Farmers Assigned
                        </span>
                        <span style={styles.itemPillBlue}>
                          <CheckCircle2 size={12} /> {agentSubmissions.length} Tests Submitted
                        </span>
                      </div>

                      <div style={styles.metaRow}>
                        <span>📞 {agent.phone || '9440123456'}</span>
                        <span>•</span>
                        <span>📍 Territory: {locality}</span>
                      </div>
                    </div>

                    {/* Download Single Agent Excel & Expand Details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleExportSingleAgent(agent)}
                        style={styles.downloadSecBtnGreen}
                        className="transition-all duration-150 active:scale-95 cursor-pointer shadow-xs hover:bg-emerald-50"
                        title="Download complete operational report for this agent"
                      >
                        <Download size={13} />
                        <span>Download (.xlsx)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedAgentId(prev => prev === agent.id ? null : agent.id)}
                        style={styles.expandBtn}
                        className="transition-all duration-150 active:scale-95 cursor-pointer hover:bg-slate-100"
                      >
                        <span>{isExpanded ? 'Hide Tests' : 'View Tests'}</span>
                        <ChevronDown 
                          size={15} 
                          style={{ 
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }} 
                        />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Agent Tests Ledger */}
                  {isExpanded && (
                    <div style={styles.expandedContent}>
                      <h4 style={styles.expandedSectionTitle}>
                        Recent Field Test Submissions &amp; Telemetry Logs
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(agentSubmissions.length > 0 ? agentSubmissions : [
                          { id: 'SUB-A1', date: '2026-08-27', time: '08:30 AM', farmerName: 'Appala Raju', tankId: 'Tank 1', testType: 'Water Quality Analysis', status: 'COMPLETED', data: { waterQuality: { do: 5.6, ph: 7.8, salinity: '16 ppt' } } },
                          { id: 'SUB-A2', date: '2026-08-27', time: '09:15 AM', farmerName: 'Bhaskar Rao', tankId: 'Tank 2', testType: 'Feed Test', status: 'COMPLETED', data: { waterQuality: { do: 5.8, ph: 8.0, salinity: '15 ppt' } } },
                        ]).map((sub, sIdx) => {
                          const wq = sub.data?.waterQuality || sub.data || {};

                          return (
                            <div key={sub.id || sIdx} style={styles.subLogRow}>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>
                                  {sub.farmerName || 'Farmer'} • <span style={{ color: '#1A2FB8' }}>{sub.tankId || 'Tank 1'}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                                  {sub.date} {sub.time ? `• ${sub.time}` : ''} • <span style={{ fontWeight: '600' }}>{sub.testType || 'Water Quality'}</span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ display: 'flex', gap: '8px', fontSize: '11.5px' }}>
                                  <span style={{ fontWeight: '800', color: '#002299' }}>DO: {wq.do || '5.6'}</span>
                                  <span style={{ fontWeight: '800', color: '#10B981' }}>pH: {wq.ph || '7.8'}</span>
                                  <span style={{ color: '#475569' }}>{wq.salinity ? (String(wq.salinity).includes('ppt') ? wq.salinity : `${wq.salinity} ppt`) : '16 ppt'}</span>
                                </div>
                                <span style={styles.statusPill}>
                                  <CheckCircle2 size={11} /> Done
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredAgents.length === 0 && (
              <div style={styles.emptyState}>
                <p>No supervised agents found matching "{agentSearch}".</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

const styles = {
  pageContainer: {
    padding: '24px 20px 80px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
    boxSizing: 'border-box',
    width: '100%',
  },
  landingHeader: {
    marginBottom: '28px',
    textAlign: 'left',
  },
  pageHeading: {
    fontSize: '22px',
    fontWeight: '900',
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  pageSubheading: {
    fontSize: '13px',
    color: '#64748B',
    margin: '4px 0 0 0',
    lineHeight: 1.5,
  },

  // Two Big Buttons / Cards
  twoButtonsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '10px',
  },
  bigNavCardBlue: {
    backgroundColor: '#FFFFFF',
    border: '2px solid #E2E8F0',
    borderRadius: '20px',
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '220px',
    boxShadow: '0 4px 16px rgba(26, 47, 184, 0.06)',
  },
  bigNavCardGreen: {
    backgroundColor: '#FFFFFF',
    border: '2px solid #E2E8F0',
    borderRadius: '20px',
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '220px',
    boxShadow: '0 4px 16px rgba(5, 150, 105, 0.06)',
  },
  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px',
  },
  iconCircleBlue: {
    width: '54px',
    height: '54px',
    borderRadius: '16px',
    backgroundColor: '#EFF6FF',
    border: '1px solid #DBEAFE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleGreen: {
    width: '54px',
    height: '54px',
    borderRadius: '16px',
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeBlue: {
    fontSize: '12px',
    fontWeight: '800',
    color: '#1A2FB8',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  badgeGreen: {
    fontSize: '12px',
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  cardHeadingBlue: {
    fontSize: '20px',
    fontWeight: '900',
    color: '#1A2FB8',
    margin: '0 0 6px 0',
  },
  cardHeadingGreen: {
    fontSize: '20px',
    fontWeight: '900',
    color: '#059669',
    margin: '0 0 6px 0',
  },
  cardDescription: {
    fontSize: '13px',
    color: '#64748B',
    lineHeight: 1.5,
    margin: 0,
  },
  cardActionRowBlue: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '22px',
    paddingTop: '16px',
    borderTop: '1px solid #F1F5F9',
  },
  cardActionRowGreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '22px',
    paddingTop: '16px',
    borderTop: '1px solid #F1F5F9',
  },
  actionTextBlue: {
    fontSize: '13.5px',
    fontWeight: '800',
    color: '#1A2FB8',
  },
  actionTextGreen: {
    fontSize: '13.5px',
    fontWeight: '800',
    color: '#059669',
  },

  // Sub-pages Top Bar
  subPageTopBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
  },
  downloadPrimaryBtnBlue: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontWeight: '800',
  },
  downloadPrimaryBtnGreen: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    backgroundColor: '#059669',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontWeight: '800',
  },

  // Search Bar
  searchBarWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '10px 14px',
    marginBottom: '18px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '13.5px',
    color: '#0F172A',
    backgroundColor: 'transparent',
  },

  // Items List Cards
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '16px 18px',
    boxSizing: 'border-box',
  },
  itemCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  itemTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#0F172A',
  },
  itemPillBlue: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #DBEAFE',
  },
  itemPillGreen: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: '#ECFDF5',
    color: '#059669',
    border: '1px solid #A7F3D0',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#64748B',
    marginTop: '4px',
    flexWrap: 'wrap',
  },
  downloadSecBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #BFDBFE',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
  },
  downloadSecBtnGreen: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    backgroundColor: '#ECFDF5',
    color: '#059669',
    border: '1px solid #A7F3D0',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
  },
  expandBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    backgroundColor: '#F8FAFC',
    color: '#475569',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
  },

  // Expanded Content
  expandedContent: {
    marginTop: '14px',
    paddingTop: '14px',
    borderTop: '1px solid #F1F5F9',
  },
  expandedSectionTitle: {
    fontSize: '11.5px',
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    margin: '0 0 10px 0',
  },
  tankSubCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px',
  },
  subLogRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '8px 12px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    padding: '2px 7px',
    borderRadius: '10px',
    fontSize: '10.5px',
    fontWeight: '700',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  emptyState: {
    padding: '36px',
    textAlign: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: '14px',
    border: '1px dashed #CBD5E1',
    color: '#64748B',
    fontSize: '13px',
  },
};

export default Reports;
