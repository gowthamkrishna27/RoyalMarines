import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tractor, Box, TrendingUp, Activity,
  AlertCircle, ArrowUpRight, MapPin, Database, Archive,
  Search, X, TestTube, Bell, Check, Clock, Filter, Plus, ChevronDown, ChevronUp
} from 'lucide-react';

import { useMockData } from '../../context/MockDataContext';
import { getRegions } from '../utils/adminMockData';
import HarvestedTanksModal from '../components/HarvestedTanksModal';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const mockData = useMockData();
  const db = mockData?.db;
  const regions = getRegions(db);

  const [showDueTestsModal, setShowDueTestsModal] = useState(false);
  const [dueTab, setDueTab] = useState('ALL'); // 'ALL' | 'OVERDUE' | 'DUE'
  const [dueSearch, setDueSearch] = useState('');
  const [remindedTanks, setRemindedTanks] = useState({});

  // Retrieve all tanks first from MySQL database
  const allTanks = db?.tanks || [];

  // Real database statistics
  const totalFarmers = db?.farmers?.length || 0;
  const totalTanks = allTanks.length || 0;
  const activeTanks = allTanks.filter(t => (t.status || '').toUpperCase() === 'ACTIVE').length;
  const harvestedTanks = allTanks.filter(t => (t.status || '').toUpperCase() === 'HARVESTED').length;
  const totalIncharges = db?.incharges?.length || 0;

  // Real Average ABW calculated from active tanks
  const validAbwTanks = allTanks.filter(t => parseFloat(t.abw) > 0);
  const avgAbwVal = validAbwTanks.length > 0 
    ? (validAbwTanks.reduce((sum, t) => sum + parseFloat(t.abw), 0) / validAbwTanks.length).toFixed(1) + 'g'
    : '0.0g';

  // Real Due and Overdue Tests across all tanks
  const dueAndOverdueTanks = allTanks
    .filter(t => (t.status || '').toUpperCase() !== 'HARVESTED' && ['due', 'overdue', 'pending'].includes((t.testStatus || t.test_status || '').toLowerCase()))
    .map((t, idx) => {
      const farmer = (db?.farmers || []).find(f => String(f.id) === String(t.farmerId));
      const agent = (db?.agents || []).find(a => String(a.id) === String(t.agentId));
      const isOverdue = (t.testStatus || t.test_status || '').toLowerCase() === 'overdue';
      const testType = 'Routine Water & Telemetry Audit';

      return {
        id: t.id,
        tankName: t.name || `Tank ${idx + 1}`,
        farmerName: farmer ? farmer.name : (t.farmerName || 'Farmer'),
        phone: farmer ? (farmer.phone || '') : '',
        locality: farmer ? (farmer.location || farmer.village || farmer.locality || '') : (t.location || ''),
        agentName: agent ? agent.name : (t.agent_name || 'Assigned Staff'),
        agentPhone: agent ? (agent.phone || '') : '',
        doc: t.doc || 0,
        abw: t.abw ? (String(t.abw).includes('g') ? t.abw : `${t.abw}g`) : '0.0g',
        size: t.size || '2.5 Acres',
        lastTest: t.lastTest || t.last_test || 'Pending',
        nextDue: t.nextTest || t.next_test || 'Due This Week',
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

  // Harvest & FCR Records directly from real MySQL database
  const liveHarvests = db?.harvests || [];
  const [docInput, setDocInput] = useState('');
  const [showHarvestedModal, setShowHarvestedModal] = useState(false);
  const [showAllHarvests, setShowAllHarvests] = useState(false);

  // When DOC is entered: specific DOC details 1st, then descending order DOC farmers; otherwise all farmers
  const filteredHarvests = useMemo(() => {
    const trimmed = String(docInput || '').trim();
    if (!trimmed) {
      // Otherwise display all farmers
      return liveHarvests;
    }

    const targetDoc = parseInt(trimmed, 10);
    if (isNaN(targetDoc)) {
      return liveHarvests;
    }

    // 1. That specific DOC details 1st
    const exactMatches = liveHarvests
      .filter(r => Number(r.doc) === targetDoc)
      .sort((a, b) => new Date(b.date || b.harvest_date || 0) - new Date(a.date || a.harvest_date || 0));

    // 2. Later on: descending order DOC farmers
    const lowerDescending = liveHarvests
      .filter(r => Number(r.doc) < targetDoc)
      .sort((a, b) => {
        const diff = (Number(b.doc) || 0) - (Number(a.doc) || 0);
        if (diff !== 0) return diff;
        return new Date(b.date || b.harvest_date || 0) - new Date(a.date || a.harvest_date || 0);
      });

    return [...exactMatches, ...lowerDescending];
  }, [liveHarvests, docInput]);

  // Initially show ONLY 5 records, or all remaining records if present and expanded
  const displayedHarvestRecords = showAllHarvests
    ? filteredHarvests
    : filteredHarvests.slice(0, 5);

  return (
    <div style={styles.dashboardContainer}>

      {/* 1. Header Section */}
      <div style={styles.headerSection}>
        <div style={styles.headerBadge}>ORGANIZATION-WIDE CONTROL CENTER</div>
        <h1 style={styles.headerTitle}>Royal's Marine Operational Dashboard</h1>
        <p style={styles.headerSubtitle}>Real-time feed performance, FCR analytics, crop health, and multi-region operations.</p>
      </div>

      {/* 2. KPI Stat Cards Row */}
      <div style={styles.kpiGrid}>
        {/* Card 1: Total Farmers */}
        <div
          style={styles.kpiCard}
          onClick={() => navigate('/admin/farmers')}
          title="Click to view all registered farmers"
        >
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>TOTAL FARMERS</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#F0F4F8', color: '#03358F' }}>
              <Tractor size={18} />
            </div>
          </div>
          <div style={styles.kpiValue}>{totalFarmers}</div>
          <div style={styles.kpiLink}>View All Farmers <ArrowUpRight size={14} /></div>
        </div>

        {/* Card 2: Total Tanks */}
        <div
          style={styles.kpiCard}
          onClick={() => navigate('/admin/tanks')}
          title="Click to view all tanks"
        >
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>TOTAL TANKS</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#F0F4F8', color: '#03358F' }}>
              <Database size={18} />
            </div>
          </div>
          <div style={styles.kpiValue}>{totalTanks}</div>
          <div style={styles.kpiLink}>View All Tanks <ArrowUpRight size={14} /></div>
        </div>

        {/* Card 3: Active Tanks */}
        <div
          style={styles.kpiCard}
          onClick={() => navigate('/admin/tanks')}
          title="Click to view active tanks"
        >
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>ACTIVE TANKS</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#F0F4F8', color: '#03358F' }}>
              <Box size={18} />
            </div>
          </div>
          <div style={styles.kpiValue}>{activeTanks}</div>
          <div style={styles.kpiLink}>View Active <ArrowUpRight size={14} /></div>
        </div>

        {/* Card 4: Harvested Tanks */}
        <div
          style={styles.kpiCard}
          onClick={() => setShowHarvestedModal(true)}
          title="Click to view harvested tanks archive"
        >
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>HARVESTED TANKS</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#F3E8FF', color: '#9333EA' }}>
              <Archive size={18} />
            </div>
          </div>
          <div style={styles.kpiValue}>{harvestedTanks}</div>
          <div style={{ ...styles.kpiLink, color: '#9333EA' }}>View Harvested <ArrowUpRight size={14} /></div>
        </div>

        {/* Card 5: Average ABW */}
        <div
          style={styles.kpiCard}
          title="Average body weight across active ponds"
        >
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>AVERAGE ABW</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#F8FAFC', color: '#64748B' }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={styles.kpiValue}>{avgAbwVal}</div>
          <div style={styles.kpiSubtext}>Mean Body Weight</div>
        </div>

        {/* Card 6: Total Incharges */}
        <div
          style={styles.kpiCard}
          onClick={() => navigate('/admin/incharges')}
          title="Click to view incharges"
        >
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>TOTAL INCHARGES</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#F0F4F8', color: '#03358F' }}>
              <MapPin size={18} />
            </div>
          </div>
          <div style={{ ...styles.kpiValue, marginBottom: '2px', display: 'flex', flexDirection: 'column' }}>
            <span>{totalIncharges}</span>
            <span style={{ fontSize: '18px', fontWeight: '700' }}>Incharges</span>
          </div>
          <div style={{ ...styles.kpiLink, marginTop: '8px' }}>View Incharges <ArrowUpRight size={14} /></div>
        </div>

        {/* Card 7: Tests Due */}
        <div
          style={{ ...styles.kpiCard, border: '1px solid #FECACA' }}
          onClick={() => setShowDueTestsModal(true)}
          title="Click to view all organization-wide due & overdue tests"
        >
          <div style={styles.kpiHeader}>
            <span style={{ ...styles.kpiLabel, color: '#64748B' }}>TESTS DUE</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#FEE2E2', color: '#DC2626' }}>
              <AlertCircle size={18} />
            </div>
          </div>
          <div style={{ ...styles.kpiValue, color: '#DC2626' }}>{dueAndOverdueTanks.length} Tanks</div>
          <div style={{ ...styles.kpiLink, color: '#DC2626', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>View All Due Tests <ArrowUpRight size={12} /></div>
            <span>({overdueCount} Overdue)</span>
          </div>
        </div>
      </div>

      {/* 3. Combined Harvest & FCR Records Section */}
      <div style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionTitleRow}>
              <TrendingUp size={20} color="#2563EB" />
              <h2 style={styles.sectionTitle}>Harvest &amp; FCR Records</h2>
              <span style={styles.countBadge}>{filteredHarvests.length} Total Records</span>
            </div>
          </div>

          <div style={styles.harvestControls}>
            <div style={styles.docInputWrapper}>
              <span style={styles.docInputLabel}>DOC Filter:</span>
              <input
                type="number"
                style={styles.docInput}
                placeholder="e.g. 65"
                value={docInput}
                onChange={e => setDocInput(e.target.value)}
              />
              {docInput && (
                <button
                  type="button"
                  onClick={() => setDocInput('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '0 4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Clear DOC filter to show all farmers"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              style={styles.viewHarvestedBtn}
              onClick={() => setShowHarvestedModal(true)}
            >
              <span>View All Harvested Tanks</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* Combined Harvest + FCR Records Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.th}>Farmer Name</th>
                <th style={styles.th}>Tank</th>
                <th style={styles.th}>ABW</th>
                <th style={styles.th}>FCR</th>
                <th style={styles.th}>DOC</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Quality / Type</th>
              </tr>
            </thead>
            <tbody>
              {displayedHarvestRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} style={styles.emptyTableTd}>
                    No harvest or FCR records found.
                  </td>
                </tr>
              ) : (
                displayedHarvestRecords.map((record) => {
                  const displayAbw = record.abw ? (String(record.abw).includes('g') ? record.abw : `${record.abw}g`) : (record.countPerKg ? `${(1000 / record.countPerKg).toFixed(1)}g` : '-');
                  return (
                    <tr key={record.id} style={styles.tableRow}>
                      <td style={styles.tdPrimary}>
                        <span style={{ fontWeight: 600 }}>{record.farmerName || record.farmer_name || '-'}</span>
                      </td>
                      <td style={styles.td}>{record.tankName || record.tank_name || record.tankId || '-'}</td>
                      <td style={styles.tdWeight}>{displayAbw}</td>
                      <td style={styles.tdFcr}>{record.fcr ? Number(record.fcr).toFixed(2) : '-'}</td>
                      <td style={styles.tdDoc}>{record.doc != null ? record.doc : '-'}</td>
                      <td style={styles.tdDate}>{record.date || record.harvest_date || '-'}</td>
                      <td style={styles.td}>
                        <span style={styles.typeChip}>{record.quality || record.harvest_type || 'Harvest'}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ONE Show More / Show Less button - reveals remaining records in place if present */}
        {filteredHarvests.length > 5 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <button
              type="button"
              className="btn-primary"
              style={{
                padding: '10px 28px',
                backgroundColor: '#03358F',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(3, 53, 143, 0.2)',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setShowAllHarvests(prev => !prev)}
            >
              {showAllHarvests ? (
                <>
                  <span>Show Less</span>
                  <ChevronUp size={16} />
                </>
              ) : (
                <>
                  <span>Show More ({filteredHarvests.length - 5} Remaining)</span>
                  <ChevronDown size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Due & Overdue Tests Comprehensive Organization Modal */}
      {showDueTestsModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowDueTestsModal(false)}
        >
          <div
            style={styles.modalCard}
            onClick={e => e.stopPropagation()}
            className="animate-modal-in"
          >
            {/* Header */}
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={styles.modalAlertIconBox}>
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>
                    Organization-wide Tests Due &amp; Overdue ({dueAndOverdueTanks.length})
                  </h3>
                  <p style={styles.modalSubtitle}>
                    Active culture tanks requiring water telemetry testing, feed sampling, or routine technician audits
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDueTestsModal(false)}
                style={styles.modalCloseBtn}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Top KPI Strip inside modal */}
            <div style={styles.modalKpiStrip}>
              <div style={styles.modalKpiBox}>
                <span style={styles.modalKpiLabel}>TOTAL TESTS DUE</span>
                <div style={styles.modalKpiVal}>{dueAndOverdueTanks.length} Tanks</div>
              </div>
              <div style={styles.modalKpiBox}>
                <span style={styles.modalKpiLabel}>CRITICAL OVERDUE</span>
                <div style={{ ...styles.modalKpiVal, color: '#DC2626' }}>{overdueCount} Tanks</div>
              </div>
              <div style={styles.modalKpiBox}>
                <span style={styles.modalKpiLabel}>DUE THIS WEEK</span>
                <div style={{ ...styles.modalKpiVal, color: '#D97706' }}>{dueSoonCount} Tanks</div>
              </div>
              <div style={styles.modalKpiBox}>
                <span style={styles.modalKpiLabel}>FARMERS IMPACTED</span>
                <div style={{ ...styles.modalKpiVal, color: '#2563EB' }}>
                  {new Set(dueAndOverdueTanks.map(t => t.farmerName)).size} Farmers
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div style={styles.modalFiltersRow}>
              {/* Tabs */}
              <div style={styles.modalTabGroup}>
                <button
                  type="button"
                  onClick={() => setDueTab('ALL')}
                  style={{
                    ...styles.modalTabBtn,
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
                    ...styles.modalTabBtn,
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
                    ...styles.modalTabBtn,
                    backgroundColor: dueTab === 'DUE' ? '#FFFFFF' : 'transparent',
                    color: dueTab === 'DUE' ? '#D97706' : '#64748B',
                    boxShadow: dueTab === 'DUE' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  🟡 Due Soon ({dueSoonCount})
                </button>
              </div>

              {/* Search */}
              <div style={styles.modalSearchBox}>
                <Search size={15} color="#64748B" />
                <input
                  type="text"
                  placeholder="Search by tank, farmer, village, or agent..."
                  value={dueSearch}
                  onChange={(e) => setDueSearch(e.target.value)}
                  style={styles.modalSearchInput}
                />
              </div>
            </div>

            {/* List of Due Test Cards */}
            <div style={styles.dueCardsList}>
              {filteredDueTanks.length === 0 ? (
                <div style={styles.emptyDueNotice}>
                  No due tests found matching your criteria.
                </div>
              ) : (
                filteredDueTanks.map((tank) => {
                  const isReminded = remindedTanks[tank.id];
                  return (
                    <div
                      key={tank.id}
                      style={{
                        ...styles.dueItemCard,
                        border: tank.isOverdue ? '1px solid #FECACA' : '1px solid #E2E8F0',
                        backgroundColor: tank.isOverdue ? '#FFFBFB' : '#FFFFFF'
                      }}
                    >
                      {/* Card Top Row */}
                      <div style={styles.dueItemTopRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            ...styles.dueItemIconBox,
                            backgroundColor: tank.isOverdue ? '#FEE2E2' : '#FEF3C7',
                            color: tank.isOverdue ? '#DC2626' : '#D97706'
                          }}>
                            <TestTube size={18} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={styles.dueTankName}>{tank.tankName}</span>
                              <span style={{
                                ...styles.dueStatusBadge,
                                backgroundColor: tank.isOverdue ? '#FEE2E2' : '#FEF3C7',
                                color: tank.isOverdue ? '#DC2626' : '#B45309',
                                border: tank.isOverdue ? '1px solid #FECACA' : '1px solid #FDE68A'
                              }}>
                                {tank.isOverdue ? '🔴 Overdue for Testing' : '🟡 Scheduled Due'}
                              </span>
                              <span style={styles.dueTestTypeBadge}>
                                {tank.testType}
                              </span>
                            </div>
                            <div style={styles.dueFarmerSub}>
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
                              ...styles.remindBtn,
                              borderColor: isReminded ? '#BBF7D0' : '#E2E8F0',
                              backgroundColor: isReminded ? '#DCFCE7' : '#FFFFFF',
                              color: isReminded ? '#15803D' : '#334155'
                            }}
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
                            style={styles.viewTankBtn}
                          >
                            <span>View Tank</span>
                            <ArrowUpRight size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Details Strip */}
                      <div style={styles.dueItemDetailsStrip}>
                        <div>
                          <span style={styles.dueDetailLbl}>SCHEDULED DUE</span>
                          <span style={{ ...styles.dueDetailVal, color: tank.isOverdue ? '#DC2626' : '#0F172A' }}>{tank.nextDue}</span>
                        </div>
                        <div>
                          <span style={styles.dueDetailLbl}>LAST AUDIT DATE</span>
                          <span style={styles.dueDetailVal}>{tank.lastTest}</span>
                        </div>
                        <div>
                          <span style={styles.dueDetailLbl}>ASSIGNED TECH</span>
                          <span style={{ ...styles.dueDetailVal, color: '#2563EB' }}>{tank.agentName}</span>
                        </div>
                        <div>
                          <span style={styles.dueDetailLbl}>CULTURE DOC / ABW</span>
                          <span style={styles.dueDetailVal}>Day {tank.doc} DOC ({tank.abw})</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setShowDueTestsModal(false)}
                style={styles.modalFooterCloseBtn}
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
    gap: '16px',
    maxWidth: '1440px',
    margin: '0 auto',
    fontFamily: 'Inter, system-ui, sans-serif',
    padding: '0 0 24px 0'
  },

  headerSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '32px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)'
  },

  headerBadge: {
    backgroundColor: '#F0F4F8',
    color: '#03358F',
    fontSize: '12px',
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: '6px',
    marginBottom: '16px',
    letterSpacing: '0.5px'
  },

  headerTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 8px 0',
    letterSpacing: '-0.02em'
  },

  headerSubtitle: {
    fontSize: '15px',
    color: '#64748B',
    margin: 0,
    fontWeight: 400
  },

  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '16px'
  },

  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 18px rgba(15, 23, 42, 0.06)',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease'
  },

  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },

  kpiLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    letterSpacing: '0.4px',
    textTransform: 'uppercase'
  },

  kpiIconWrapper: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },

  kpiValue: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#0F172A',
    marginBottom: '6px',
    lineHeight: '1',
    letterSpacing: '-0.02em'
  },

  kpiSubtext: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#64748B',
    marginTop: 'auto',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  kpiLink: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#03358F',
    marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap'
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    boxShadow: '0 4px 18px rgba(15, 23, 42, 0.06)'
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '16px'
  },

  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.01em'
  },

  countBadge: {
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '12px',
    marginLeft: '6px'
  },

  sectionSubtitle: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748B',
    margin: '4px 0 0 0'
  },

  harvestControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },

  docInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '0 12px',
    backgroundColor: '#F8FAFC',
    height: '40px'
  },

  docInputLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748B'
  },

  docInput: {
    border: 'none',
    outline: 'none',
    width: '64px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#0F172A',
    backgroundColor: 'transparent'
  },

  addRecordBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0 14px',
    height: '40px',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    borderRadius: '10px',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },

  viewHarvestedBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0 14px',
    height: '40px',
    backgroundColor: '#FFFFFF',
    color: '#2563EB',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },

  tableContainer: {
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },

  tableHeaderRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0'
  },

  th: {
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px'
  },

  tableRow: {
    borderBottom: '1px solid #F1F5F9',
    transition: 'background-color 0.15s ease'
  },

  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#64748B',
    fontWeight: 500
  },

  tdPrimary: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#0F172A',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  tdWeight: {
    padding: '14px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#0F172A'
  },

  tdFcr: {
    padding: '14px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#0F172A'
  },

  tdDoc: {
    padding: '14px 16px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#2563EB'
  },

  tdDate: {
    padding: '14px 16px',
    fontSize: '12px',
    color: '#64748B'
  },

  newBadge: {
    color: '#16A34A',
    fontSize: '10px',
    fontWeight: 700,
    backgroundColor: '#DCFCE7',
    padding: '2px 6px',
    borderRadius: '4px'
  },

  typeChip: {
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: '#F1F5F9',
    color: '#475569',
    padding: '3px 8px',
    borderRadius: '6px'
  },

  emptyTableTd: {
    padding: '32px 16px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#64748B'
  },

  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 99999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px 16px',
    boxSizing: 'border-box'
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '920px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    border: '1px solid #E2E8F0',
    boxSizing: 'border-box'
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '16px',
    borderBottom: '1px solid #F1F5F9',
    gap: '12px'
  },

  modalAlertIconBox: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },

  modalTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.01em'
  },

  modalSubtitle: {
    fontSize: '12.5px',
    color: '#64748B',
    margin: '4px 0 0 0'
  },

  modalCloseBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748B',
    transition: 'background-color 0.15s ease'
  },

  modalKpiStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '12px',
    marginTop: '16px',
    padding: '14px 16px',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px solid #E2E8F0'
  },

  modalKpiBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },

  modalKpiLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px'
  },

  modalKpiVal: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0F172A'
  },

  modalFiltersRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginTop: '16px',
    flexWrap: 'wrap'
  },

  modalTabGroup: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#F1F5F9',
    padding: '4px',
    borderRadius: '10px'
  },

  modalTabBtn: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },

  modalSearchBox: {
    flex: '1 1 240px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '0 12px',
    backgroundColor: '#FFFFFF',
    height: '38px'
  },

  modalSearchInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '13px',
    color: '#0F172A',
    backgroundColor: 'transparent'
  },

  dueCardsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
    maxHeight: '48vh',
    overflowY: 'auto'
  },

  emptyDueNotice: {
    padding: '36px',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '13px'
  },

  dueItemCard: {
    borderRadius: '12px',
    padding: '16px 18px',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)'
  },

  dueItemTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '10px'
  },

  dueItemIconBox: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },

  dueTankName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0F172A'
  },

  dueStatusBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '6px'
  },

  dueTestTypeBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    padding: '2px 8px',
    borderRadius: '6px'
  },

  dueFarmerSub: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '3px'
  },

  remindBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },

  viewTankBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },

  dueItemDetailsStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '8px',
    marginTop: '12px',
    paddingTop: '10px',
    borderTop: '1px solid #F1F5F9'
  },

  dueDetailLbl: {
    fontSize: '10.5px',
    color: '#64748B',
    fontWeight: 600,
    display: 'block',
    textTransform: 'uppercase'
  },

  dueDetailVal: {
    fontSize: '12.5px',
    fontWeight: 600,
    color: '#0F172A'
  },

  modalFooter: {
    marginTop: '16px',
    paddingTop: '14px',
    borderTop: '1px solid #F1F5F9',
    display: 'flex',
    justifyContent: 'flex-end'
  },

  modalFooterCloseBtn: {
    padding: '8px 20px',
    borderRadius: '8px',
    backgroundColor: '#2563EB',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  }
};

export default AdminDashboard;
