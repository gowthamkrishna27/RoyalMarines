import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { 
  Search, Filter, Eye, TestTube, CheckCircle2, Clock, 
  Calendar, User, Droplets, Users, Shield, UserCheck, 
  Layers, Activity, AlertTriangle, X, FileText, CheckCircle, Scale, Fish, ChevronDown
} from 'lucide-react';
import { createPortal } from 'react-dom';

const Tests = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [actorTab, setActorTab] = useState('ALL'); // 'ALL' | 'AGENTS' | 'ME'
  const [isActorDropdownOpen, setIsActorDropdownOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTestDetail, setSelectedTestDetail] = useState(null);

  const { db, getFarmerById, getTankById, getAgentById } = useMockData();

  // Map all submissions with full telemetry and actor identity
  const allTests = useMemo(() => {
    // 1. Existing DB Submissions
    const dbSubmissions = (db?.submissions || []).map((s, idx) => {
      const farmer = getFarmerById(s.farmerId);
      const tank = getTankById(s.tankId);
      const agent = getAgentById(s.agentId);

      // Determine if logged by Me (ASM) or an assigned Agent
      const isLoggedByASM = !s.agentId || s.agentId === 'INC001' || s.isPersonal || (farmer && farmer.inchargeId === 'INC001' && !farmer.agentId);
      const actorName = isLoggedByASM ? 'Me (ASM Ravi Kumar)' : (agent ? agent.name : (s.agentName || 'Tech Ramesh'));
      const actorType = isLoggedByASM ? 'ME' : 'AGENT';

      const farmerName = farmer ? farmer.name : (s.farmerName || 'Ravi');
      const farmerLocation = farmer ? (farmer.location || farmer.village || 'Bhimavaram') : 'Bhimavaram';
      const tankName = tank ? tank.name : (s.tankName || (s.tankId ? `Tank ${s.tankId.replace(/\D/g, '') || '1'}` : 'Tank 1'));
      const tankSize = tank ? (tank.size || `${tank.acres || 2.5} Acres`) : '2.5 Acres';
      const doc = tank?.doc || (35 + ((idx * 14) % 65));

      const wq = s.data?.waterQuality || {};
      const ph = wq.ph || (7.6 + ((idx * 0.1) % 0.8)).toFixed(1);
      const doVal = wq.do || (5.2 + ((idx * 0.2) % 1.2)).toFixed(1);
      const salinity = wq.salinity || (12 + ((idx * 2) % 10));
      const ammonia = wq.ammonia || (0.05 + ((idx * 0.04) % 0.2)).toFixed(2);
      const abw = s.data?.abw || (doc <= 45 ? '13.5g' : doc <= 70 ? '19.0g' : '26.5g');
      const biomass = s.data?.biomass || s.biomass || `${Math.round(parseFloat(abw) * 125 * 0.85)} kg`;
      const fcr = s.data?.fcr || s.fcr || (1.12 + ((idx * 0.03) % 0.2)).toFixed(2);

      return {
        id: s.id || `TEST-${1000 + idx}`,
        date: s.date || '2026-08-28',
        time: s.time || (idx % 2 === 0 ? '10:30 AM' : '03:45 PM'),
        doc: doc,
        actorType: actorType,
        actorName: actorName,
        farmerId: s.farmerId,
        farmer: farmerName,
        locality: farmerLocation,
        tankId: s.tankId,
        tank: tankName,
        tankSize: tankSize,
        testType: s.testType || s.recordType || (idx % 3 === 0 ? 'Water Quality Analysis' : idx % 3 === 1 ? 'Feed & Growth Test' : 'Health & Mortality'),
        status: s.status === 'COMPLETED' || s.status === 'Approved' ? 'Approved' : 'Pending Verification',
        readings: {
          ph: ph,
          do: doVal,
          salinity: `${salinity} ppt`,
          ammonia: `${ammonia} ppm`,
          abw: abw,
          biomass: biomass,
          fcr: fcr,
          waterColor: wq.waterColor || 'Light Green'
        },
        notes: s.notes || 'Routine sampling completed with verified parameter standards.'
      };
    });

    // 2. Add sample ASM Personal Tests if none in database
    const asmTestsCount = dbSubmissions.filter(t => t.actorType === 'ME').length;
    if (asmTestsCount === 0) {
      const personalSeed = [
        {
          id: 'TEST-ASM-01',
          date: '2026-08-29',
          time: '11:15 AM',
          doc: 65,
          actorType: 'ME',
          actorName: 'Me (ASM Ravi Kumar)',
          farmerId: 'F101',
          farmer: 'Bhaskar Rao',
          locality: 'Bhimavaram Central',
          tankId: 'T101',
          tank: 'Pond A1',
          tankSize: '15 Acres',
          testType: 'Water Quality Analysis',
          status: 'Approved',
          readings: {
            ph: '7.8',
            do: '5.8',
            salinity: '14 ppt',
            ammonia: '0.08 ppm',
            abw: '22.4g',
            biomass: '3,200 kg',
            fcr: '1.16',
            waterColor: 'Light Green'
          },
          notes: 'High DO maintained with aerators. Water alkalinity optimal at 135 ppm.'
        },
        {
          id: 'TEST-ASM-02',
          date: '2026-08-28',
          time: '04:30 PM',
          doc: 58,
          actorType: 'ME',
          actorName: 'Me (ASM Ravi Kumar)',
          farmerId: 'F102',
          farmer: 'Narasimha Murthy',
          locality: 'Chinnamiram East',
          tankId: 'T103',
          tank: 'Pond B1',
          tankSize: '11 Acres',
          testType: 'Feed & Growth Test',
          status: 'Approved',
          readings: {
            ph: '7.9',
            do: '5.4',
            salinity: '16 ppt',
            ammonia: '0.10 ppm',
            abw: '19.2g',
            biomass: '2,550 kg',
            fcr: '1.14',
            waterColor: 'Greenish'
          },
          notes: 'Feed intake optimal across check trays. Gut fullness 90%.'
        },
        {
          id: 'TEST-ASM-03',
          date: '2026-08-27',
          time: '09:00 AM',
          doc: 72,
          actorType: 'ME',
          actorName: 'Me (ASM Ravi Kumar)',
          farmerId: 'F103',
          farmer: 'Koteswara Rao',
          locality: 'Undi Rural',
          tankId: 'T105',
          tank: 'Pond C1',
          tankSize: '14 Acres',
          testType: 'Health & Mortality',
          status: 'Approved',
          readings: {
            ph: '7.7',
            do: '6.0',
            salinity: '15 ppt',
            ammonia: '0.05 ppm',
            abw: '24.8g',
            biomass: '3,600 kg',
            fcr: '1.18',
            waterColor: 'Light Brown'
          },
          notes: 'Zero mortality observed. Shell hardness excellent.'
        }
      ];
      return [...personalSeed, ...dbSubmissions];
    }

    return dbSubmissions;
  }, [db, getFarmerById, getTankById, getAgentById]);

  // Derived counts
  const totalCount = allTests.length;
  const byAgentsCount = allTests.filter(t => t.actorType === 'AGENT').length;
  const byMeCount = allTests.filter(t => t.actorType === 'ME').length;
  const approvedCount = allTests.filter(t => t.status === 'Approved').length;
  const pendingCount = allTests.filter(t => t.status !== 'Approved').length;

  const testTypes = useMemo(() => {
    return Array.from(new Set(allTests.map(t => t.testType)));
  }, [allTests]);

  // Filtered List
  const filteredTests = useMemo(() => {
    return allTests.filter(test => {
      // 1. Actor Tab Filter (All | By Agents | By Me)
      if (actorTab === 'AGENTS' && test.actorType !== 'AGENT') return false;
      if (actorTab === 'ME' && test.actorType !== 'ME') return false;

      // 2. Type Filter
      if (typeFilter !== 'ALL' && test.testType !== typeFilter) return false;

      // 3. Status Filter
      if (statusFilter === 'APPROVED' && test.status !== 'Approved') return false;
      if (statusFilter === 'PENDING' && test.status === 'Approved') return false;

      // 4. Search Filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = 
          test.farmer.toLowerCase().includes(term) ||
          test.tank.toLowerCase().includes(term) ||
          test.actorName.toLowerCase().includes(term) ||
          test.locality.toLowerCase().includes(term) ||
          test.testType.toLowerCase().includes(term);
        if (!matches) return false;
      }

      return true;
    });
  }, [allTests, actorTab, typeFilter, statusFilter, searchTerm]);

  return (
    <>
      <InchargeHeader title="Test History" />

      <div style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* ========================================================= */}
        {/* 1. TOP STATS BAR */}
        {/* ========================================================= */}
        <div style={styles.summaryBar}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Tests Logged</span>
            <span style={styles.summaryValue}>{totalCount}</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>By My Agents (Techs)</span>
            <span style={{ ...styles.summaryValue, color: '#0284C7' }}>{byAgentsCount} Tests</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>By Me (ASM Officer)</span>
            <span style={{ ...styles.summaryValue, color: '#1A2FB8' }}>{byMeCount} Tests</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Territory Farmers</span>
            <span style={{ ...styles.summaryValue, color: '#16A34A' }}>{(db?.farmers || []).length} Farmers</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Supervised Ponds</span>
            <span style={{ ...styles.summaryValue, color: '#0F172A' }}>{(db?.tanks || []).length} Ponds</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. ACTOR SEGMENT DROPDOWN BUTTON (All Records / By Agents / By Me) */}
        {/* ========================================================= */}
        <div style={styles.segmentBar}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              onClick={() => setIsActorDropdownOpen(prev => !prev)}
              style={styles.actorDropdownBtn}
              className="transition-all duration-150 active:scale-98 hover:border-indigo-300 cursor-pointer"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.actorDropdownIconBox}>
                  {actorTab === 'ALL' && <FileText size={15} color="#1A2FB8" />}
                  {actorTab === 'AGENTS' && <Users size={15} color="#0284C7" />}
                  {actorTab === 'ME' && <UserCheck size={15} color="#16A34A" />}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                    {actorTab === 'ALL' && `All Test Records (${totalCount})`}
                    {actorTab === 'AGENTS' && `By My Agents (${byAgentsCount})`}
                    {actorTab === 'ME' && `By Me (ASM Officer) (${byMeCount})`}
                  </div>
                </div>
              </div>
              <ChevronDown 
                size={16} 
                color="#64748B" 
                style={{ 
                  transform: isActorDropdownOpen ? 'rotate(180deg)' : 'none', 
                  transition: 'transform 0.2s ease',
                  marginLeft: '12px'
                }} 
              />
            </button>

            {/* Dropdown Menu Popup */}
            {isActorDropdownOpen && (
              <>
                <div 
                  onClick={() => setIsActorDropdownOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                />
                <div style={styles.actorDropdownMenu}>
                  <div style={styles.dropdownHeader}>FILTER BY LOGGED SOURCE</div>
                  
                  {/* Option 1: ALL */}
                  <button
                    type="button"
                    onClick={() => {
                      setActorTab('ALL');
                      setIsActorDropdownOpen(false);
                    }}
                    style={{
                      ...styles.dropdownOption,
                      backgroundColor: actorTab === 'ALL' ? '#EFF6FF' : 'transparent',
                    }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ ...styles.optionIconBox, backgroundColor: '#EFF6FF', color: '#1A2FB8' }}>
                        <FileText size={15} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', fontWeight: actorTab === 'ALL' ? '800' : '600', color: actorTab === 'ALL' ? '#1A2FB8' : '#0F172A' }}>
                          All Test Records
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          Total cluster submissions
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '800', padding: '2px 8px', borderRadius: '8px', backgroundColor: actorTab === 'ALL' ? '#DBEAFE' : '#F1F5F9', color: actorTab === 'ALL' ? '#1A2FB8' : '#475569' }}>
                      {totalCount}
                    </span>
                  </button>

                  {/* Option 2: AGENTS */}
                  <button
                    type="button"
                    onClick={() => {
                      setActorTab('AGENTS');
                      setIsActorDropdownOpen(false);
                    }}
                    style={{
                      ...styles.dropdownOption,
                      backgroundColor: actorTab === 'AGENTS' ? '#F0F9FF' : 'transparent',
                    }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ ...styles.optionIconBox, backgroundColor: '#F0F9FF', color: '#0284C7' }}>
                        <Users size={15} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', fontWeight: actorTab === 'AGENTS' ? '800' : '600', color: actorTab === 'AGENTS' ? '#0284C7' : '#0F172A' }}>
                          By My Agents
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          Field technicians supervised
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '800', padding: '2px 8px', borderRadius: '8px', backgroundColor: actorTab === 'AGENTS' ? '#BAE6FD' : '#F1F5F9', color: actorTab === 'AGENTS' ? '#0284C7' : '#475569' }}>
                      {byAgentsCount}
                    </span>
                  </button>

                  {/* Option 3: ME */}
                  <button
                    type="button"
                    onClick={() => {
                      setActorTab('ME');
                      setIsActorDropdownOpen(false);
                    }}
                    style={{
                      ...styles.dropdownOption,
                      backgroundColor: actorTab === 'ME' ? '#F0FDF4' : 'transparent',
                    }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ ...styles.optionIconBox, backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                        <UserCheck size={15} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', fontWeight: actorTab === 'ME' ? '800' : '600', color: actorTab === 'ME' ? '#16A34A' : '#0F172A' }}>
                          By Me (ASM Officer)
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          Personal direct verification logs
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '800', padding: '2px 8px', borderRadius: '8px', backgroundColor: actorTab === 'ME' ? '#BBF7D0' : '#F1F5F9', color: actorTab === 'ME' ? '#15803D' : '#475569' }}>
                      {byMeCount}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          <div style={styles.activeActorHint}>
            {actorTab === 'ALL' && <span>Showing full chronological test history across cluster</span>}
            {actorTab === 'AGENTS' && <span>Showing tests submitted by assigned field technicians</span>}
            {actorTab === 'ME' && <span>Showing personal tests logged directly by ASM</span>}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. MAIN TABLE CARD */}
        {/* ========================================================= */}
        <div style={styles.mainCard}>
          {/* Action & Filter Bar */}
          <div style={styles.actionBar}>
            <div style={styles.searchGroup}>
              <div style={styles.searchBox}>
                <Search size={17} color="#64748B" />
                <input 
                  type="text" 
                  placeholder="Search by farmer name, pond, technician, or village..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
              </div>

              {testTypes.length > 0 && (
                <select 
                  value={typeFilter} 
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={styles.selectFilter}
                >
                  <option value="ALL">All Test Types ({testTypes.length})</option>
                  {testTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              )}

              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.selectFilter}
              >
                <option value="ALL">All Status</option>
                <option value="APPROVED">Verified & Approved</option>
                <option value="PENDING">Pending Audit</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Date & Time</th>
                  <th style={styles.th}>Logged By</th>
                  <th style={styles.th}>Farmer & Locality</th>
                  <th style={styles.th}>Pond / Tank</th>
                  <th style={styles.th}>Test Category</th>
                  <th style={styles.th}>Key Parameter Readings</th>
                  <th style={styles.th}>Audit Status</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test) => {
                  const isApproved = test.status === 'Approved';
                  const isMe = test.actorType === 'ME';

                  return (
                    <tr key={test.id} style={styles.tr} className="hover:bg-slate-50/70 transition-colors">
                      {/* Date & Time */}
                      <td style={styles.td}>
                        <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px' }}>
                          {test.date}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} /> {test.time} • <span style={{ color: '#1A2FB8', fontWeight: '700' }}>Day {test.doc} DOC</span>
                        </div>
                      </td>

                      {/* Logged By (Actor) */}
                      <td style={styles.td}>
                        {isMe ? (
                          <div style={styles.actorMeBadge}>
                            <Shield size={12} />
                            <span>Me (ASM)</span>
                          </div>
                        ) : (
                          <div style={styles.actorAgentBadge}>
                            <User size={12} />
                            <span>{test.actorName}</span>
                          </div>
                        )}
                      </td>

                      {/* Farmer & Locality */}
                      <td style={styles.td}>
                        <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
                          {test.farmer}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          📍 {test.locality}
                        </div>
                      </td>

                      {/* Tank / Pond */}
                      <td style={styles.td}>
                        <span style={styles.tankBadge}>
                          <Droplets size={12} color="#1A2FB8" />
                          {test.tank} <span style={{ color: '#64748B', fontWeight: '500' }}>({test.tankSize})</span>
                        </span>
                      </td>

                      {/* Test Category */}
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <TestTube size={14} color="#1A2FB8" />
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                            {test.testType}
                          </span>
                        </div>
                      </td>

                      {/* Parameter Readings */}
                      <td style={styles.td}>
                        <div style={styles.readingsChipBox}>
                          <span style={styles.paramPill}>
                            pH: <b>{test.readings.ph}</b>
                          </span>
                          <span style={styles.paramPill}>
                            DO: <b>{test.readings.do} ppm</b>
                          </span>
                          <span style={styles.paramPill}>
                            Sal: <b>{test.readings.salinity}</b>
                          </span>
                          <span style={styles.paramPill}>
                            ABW: <b>{test.readings.abw}</b>
                          </span>
                        </div>
                      </td>

                      {/* Submission Status */}
                      <td style={styles.td}>
                        <span style={styles.approvedPill}>
                          <CheckCircle2 size={11} /> Logged
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <button 
                          type="button"
                          style={styles.reviewBtn}
                          onClick={() => setSelectedTestDetail(test)}
                          title="View Full Test Audit Record"
                          className="transition-all duration-150 active:scale-95 cursor-pointer"
                        >
                          <Eye size={14} />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredTests.length === 0 && (
                  <tr>
                    <td colSpan="8" style={styles.emptyTd}>
                      <TestTube size={32} color="#94A3B8" style={{ margin: '0 auto 8px' }} />
                      <p style={{ margin: 0, fontWeight: '600', color: '#475569' }}>
                        No test records found matching the current filters.
                      </p>
                      <button
                        type="button"
                        onClick={() => { setActorTab('ALL'); setTypeFilter('ALL'); setStatusFilter('ALL'); setSearchTerm(''); }}
                        style={styles.resetBtn}
                      >
                        Reset All Filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. FULL TEST REPORT AUDIT MODAL */}
      {/* ========================================================= */}
      {selectedTestDetail && createPortal(
        <div style={styles.modalBackdrop} onClick={() => setSelectedTestDetail(null)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.modalIconBox}>
                  <TestTube size={22} color="#1A2FB8" />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    {selectedTestDetail.testType} Report
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Record ID: {selectedTestDetail.id} • {selectedTestDetail.date} ({selectedTestDetail.time})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTestDetail(null)}
                style={styles.closeBtn}
              >
                <X size={20} />
              </button>
            </div>

            {/* Actor & Pond Identity Strip */}
            <div style={styles.modalIdentityStrip}>
              <div>
                <span style={styles.miniLabel}>LOGGED BY</span>
                <div style={{ fontSize: '13px', fontWeight: '800', color: selectedTestDetail.actorType === 'ME' ? '#1A2FB8' : '#0284C7' }}>
                  {selectedTestDetail.actorName}
                </div>
              </div>
              <div style={styles.modalDivider} />
              <div>
                <span style={styles.miniLabel}>FARMER & VILLAGE</span>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                  {selectedTestDetail.farmer} ({selectedTestDetail.locality})
                </div>
              </div>
              <div style={styles.modalDivider} />
              <div>
                <span style={styles.miniLabel}>POND & DOC</span>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                  {selectedTestDetail.tank} • Day {selectedTestDetail.doc} DOC
                </div>
              </div>
            </div>

            {/* Telemetry Parameter Grid */}
            <div style={{ marginTop: '18px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
                Water & Growth Telemetry Parameters
              </h4>
              <div style={styles.paramGrid}>
                <div style={styles.paramCard}>
                  <span style={styles.paramCardLabel}>pH Level</span>
                  <span style={styles.paramCardValue}>{selectedTestDetail.readings.ph}</span>
                  <span style={styles.paramCardStatus}>Optimal (7.5 - 8.5)</span>
                </div>
                <div style={styles.paramCard}>
                  <span style={styles.paramCardLabel}>Dissolved Oxygen</span>
                  <span style={{ ...styles.paramCardValue, color: '#16A34A' }}>{selectedTestDetail.readings.do} ppm</span>
                  <span style={styles.paramCardStatus}>Target &gt; 5.0 ppm</span>
                </div>
                <div style={styles.paramCard}>
                  <span style={styles.paramCardLabel}>Water Salinity</span>
                  <span style={styles.paramCardValue}>{selectedTestDetail.readings.salinity}</span>
                  <span style={styles.paramCardStatus}>Stable Range</span>
                </div>
                <div style={styles.paramCard}>
                  <span style={styles.paramCardLabel}>Total Ammonia</span>
                  <span style={styles.paramCardValue}>{selectedTestDetail.readings.ammonia}</span>
                  <span style={styles.paramCardStatus}>Safe (&lt; 0.1 ppm)</span>
                </div>
                <div style={styles.paramCard}>
                  <span style={styles.paramCardLabel}>Average Body Weight</span>
                  <span style={{ ...styles.paramCardValue, color: '#1A2FB8' }}>{selectedTestDetail.readings.abw}</span>
                  <span style={styles.paramCardStatus}>Sampling count verified</span>
                </div>
                <div style={styles.paramCard}>
                  <span style={styles.paramCardLabel}>Biomass Estimate</span>
                  <span style={styles.paramCardValue}>{selectedTestDetail.readings.biomass}</span>
                  <span style={styles.paramCardStatus}>FCR: {selectedTestDetail.readings.fcr}</span>
                </div>
              </div>
            </div>

            {/* Field Observations & Notes */}
            <div style={styles.notesBox}>
              <span style={styles.miniLabel}>FIELD OBSERVATIONS & AUDITOR NOTES</span>
              <p style={{ fontSize: '13px', color: '#334155', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                {selectedTestDetail.notes}
              </p>
            </div>

            {/* Modal Actions */}
            <div style={{ ...styles.modalFooter, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedTestDetail(null)}
                style={styles.closeModalActionBtn}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const styles = {
  summaryBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px 24px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    flexWrap: 'wrap',
    gap: '12px',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  summaryLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  summaryValue: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryDivider: {
    width: '1px',
    height: '32px',
    backgroundColor: '#F1F5F9',
  },
  segmentBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '8px 12px',
    marginBottom: '16px',
    gap: '12px',
    flexWrap: 'wrap',
  },
  actorDropdownBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '8px 14px',
    borderRadius: '10px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    cursor: 'pointer',
    minWidth: '240px',
  },
  actorDropdownIconBox: {
    width: '28px',
    height: '28px',
    borderRadius: '7px',
    backgroundColor: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actorDropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    width: '290px',
    maxWidth: 'calc(100vw - 36px)',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)',
    zIndex: 50,
    padding: '6px',
  },
  dropdownHeader: {
    fontSize: '10.5px',
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: '0.5px',
    padding: '6px 10px 4px',
  },
  dropdownOption: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '2px',
    textAlign: 'left',
  },
  optionIconBox: {
    width: '28px',
    height: '28px',
    borderRadius: '7px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activeActorHint: {
    fontSize: '11.5px',
    color: '#64748B',
    fontWeight: '500',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '20px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  searchGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '8px 14px',
    flex: '1 1 280px',
    minWidth: '240px',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '13px',
    color: '#0F172A',
    width: '100%',
  },
  selectFilter: {
    padding: '8px 12px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '12.5px',
    color: '#0F172A',
    fontWeight: '600',
    outline: 'none',
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    borderBottom: '2px solid #F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  th: {
    padding: '12px 14px',
    fontSize: '11px',
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
    verticalAlign: 'middle',
  },
  actorMeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #BFDBFE',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '800',
  },
  actorAgentBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    backgroundColor: '#F0F9FF',
    color: '#0284C7',
    border: '1px solid #BAE6FD',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
  },
  tankBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#0F172A',
  },
  readingsChipBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexWrap: 'wrap',
    maxWidth: '280px',
  },
  paramPill: {
    fontSize: '11px',
    backgroundColor: '#F1F5F9',
    color: '#334155',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #E2E8F0',
  },
  approvedPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    border: '1px solid #BBF7D0',
  },
  pendingPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    border: '1px solid #FDE68A',
  },
  reviewBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #DBEAFE',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  emptyTd: {
    padding: '36px 16px',
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: '10px',
    padding: '5px 14px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #BFDBFE',
    borderRadius: '6px',
    cursor: 'pointer',
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
    maxWidth: '680px',
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
  modalIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
  },
  modalIdentityStrip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '10px 14px',
    marginTop: '14px',
    gap: '10px',
    flexWrap: 'wrap',
  },
  miniLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    display: 'block',
  },
  modalDivider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#CBD5E1',
  },
  paramGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
  },
  paramCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  paramCardLabel: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '600',
  },
  paramCardValue: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#0F172A',
  },
  paramCardStatus: {
    fontSize: '10px',
    color: '#16A34A',
    fontWeight: '600',
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px 14px',
    marginTop: '16px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #F1F5F9',
    paddingTop: '16px',
    marginTop: '20px',
    gap: '10px',
  },
  fullAuditBtn: {
    padding: '8px 16px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  closeModalActionBtn: {
    padding: '8px 14px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
  }
};

export default Tests;


