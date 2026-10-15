import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tractor, Box, TrendingUp, Activity,
  AlertCircle, ArrowUpRight, MapPin, Database, Archive,
  Search, X, TestTube, Bell, Check, Clock, Filter, ChevronDown, ChevronUp,
  ClipboardList, UserCheck, UserX
} from 'lucide-react';

import adminService from '../utils/adminService';
import HarvestedTanksModal from '../components/HarvestedTanksModal';

const DASHBOARD_CACHE_KEY = 'royal_admin_dashboard_cache_v1';
const CACHE_MAX_AGE_MS = 60 * 1000; // 60s max session cache freshness

const getInitialDashboardCache = () => {
  try {
    const raw = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.summary && parsed.updatedAt) {
        if (Date.now() - parsed.updatedAt < CACHE_MAX_AGE_MS) {
          return parsed;
        }
      }
    }
  } catch {}
  return null;
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  const initialCache = useMemo(() => getInitialDashboardCache(), []);

  const [summary, setSummary] = useState(initialCache?.summary || null);
  const [allTanks, setAllTanks] = useState(initialCache?.tanks || []);
  const [farmers, setFarmers] = useState(initialCache?.farmers || []);
  const [agents, setAgents] = useState(initialCache?.agents || []);
  const [incharges, setIncharges] = useState(initialCache?.incharges || []);
  const [liveHarvests, setLiveHarvests] = useState(initialCache?.harvests || []);
  const [submissions, setSubmissions] = useState(initialCache?.submissions || []);
  const [isLoading, setIsLoading] = useState(!initialCache);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  const [showDueTestsModal, setShowDueTestsModal] = useState(false);
  const [dueTab, setDueTab] = useState('ALL'); // 'ALL' | 'OVERDUE' | 'DUE'
  const [dueSearch, setDueSearch] = useState('');
  const [remindedTanks, setRemindedTanks] = useState({});

  const [todayLocationCount, setTodayLocationCount] = useState(initialCache?.todayLocationCount ?? null);

  const loadDashboardData = async (force = false) => {
    try {
      if (force || !summary) {
        setIsLoading(true);
      } else {
        setIsSyncing(true);
      }
      setError(null);
      const [sum, tks, fms, ags, incs, hrvs, subs, todayLocs] = await Promise.all([
        adminService.getSummary(force),
        adminService.getTanks(force),
        adminService.getFarmers(force),
        adminService.getAgents(force),
        adminService.getIncharges(force),
        adminService.getHarvests(force),
        adminService.getSubmissions(force),
        adminService.getTodaySubmissions(force).catch(() => [])
      ]);
      setSummary(sum);
      setAllTanks(Array.isArray(tks) ? tks : []);
      setFarmers(Array.isArray(fms) ? fms : []);
      setAgents(Array.isArray(ags) ? ags : []);
      setIncharges(Array.isArray(incs) ? incs : []);
      setLiveHarvests(Array.isArray(hrvs) ? hrvs : []);
      setSubmissions(Array.isArray(subs) ? subs : []);
      if (Array.isArray(todayLocs)) {
        setTodayLocationCount(todayLocs.length);
      }

      try {
        const payload = JSON.stringify({
          summary: sum,
          tanks: tks,
          farmers: fms,
          agents: ags,
          incharges: incs,
          harvests: hrvs,
          submissions: subs,
          todayLocationCount: Array.isArray(todayLocs) ? todayLocs.length : null,
          updatedAt: Date.now()
        });
        sessionStorage.setItem(DASHBOARD_CACHE_KEY, payload);
      } catch {}
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Could not connect to live database API. Please check your connection.');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadDashboardData(false);
    const handleRefresh = () => {
      try {
        sessionStorage.removeItem(DASHBOARD_CACHE_KEY);
      } catch {}
      loadDashboardData(true);
    };
    window.addEventListener('submissionCreated', handleRefresh);
    window.addEventListener('harvestCreated', handleRefresh);
    window.addEventListener('farmerCreated', handleRefresh);
    window.addEventListener('tankCreated', handleRefresh);
    window.addEventListener('adminDataChanged', handleRefresh);
    return () => {
      window.removeEventListener('submissionCreated', handleRefresh);
      window.removeEventListener('harvestCreated', handleRefresh);
      window.removeEventListener('farmerCreated', handleRefresh);
      window.removeEventListener('tankCreated', handleRefresh);
      window.removeEventListener('adminDataChanged', handleRefresh);
    };
  }, []);

  // Real database statistics derived directly from MySQL API
  const totalFarmers = summary?.totalFarmers ?? farmers.length;
  const activeFarmers = summary?.activeFarmers ?? farmers.filter(f => (f.status || '').toUpperCase() === 'ACTIVE').length;
  const inactiveFarmers = summary?.inactiveFarmers ?? farmers.filter(f => (f.status || '').toUpperCase() === 'INACTIVE').length;
  const totalTanks = summary?.totalTanks ?? allTanks.length;
  const activeTanks = summary?.activeTanks ?? allTanks.filter(t => (t.status || '').toUpperCase() === 'ACTIVE').length;
  const harvestedTanks = summary?.harvestedTanks ?? allTanks.filter(t => (t.status || '').toUpperCase() === 'HARVESTED').length;
  const totalIncharges = summary?.totalIncharges ?? incharges.length;
  const avgAbwVal = summary?.avgAbw || '0.0g';

  // Real Due and Overdue Tests across all tanks
  const dueAndOverdueTanks = (allTanks || [])
    .filter(t => (t.status || '').toUpperCase() !== 'HARVESTED' && ['due', 'overdue', 'pending'].includes((t.testStatus || t.test_status || '').toLowerCase()))
    .map((t, idx) => {
      const farmer = (farmers || []).find(f => String(f.id) === String(t.farmerId || t.farmer_id));
      const agent = (agents || []).find(a => String(a.id) === String(t.agentId || t.agent_id));
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

  const [docInput, setDocInput] = useState('');
  const [showHarvestedModal, setShowHarvestedModal] = useState(false);

  // Unified live records combining Harvests and Test Submissions
  const allRecords = useMemo(() => {
    // 1. Live harvest records
    const harvestList = (liveHarvests || []).map((h, idx) => ({
      id: h.id ? `hrv_${h.id}` : `hrv_${idx}`,
      farmerName: h.farmerName || h.farmer_name || '-',
      tankName: h.tankName || h.tank_name || h.tankId || '-',
      abw: h.abw ? (String(h.abw).includes('g') ? h.abw : `${h.abw}g`) : (h.countPerKg ? `${(1000 / h.countPerKg).toFixed(1)}g` : '-'),
      fcr: h.fcr != null && h.fcr !== '' ? Number(h.fcr).toFixed(2) : '-',
      doc: h.doc != null && h.doc !== '' ? Number(h.doc) : null,
      date: h.date || h.harvest_date || '-',
      quality: h.quality || h.harvest_type || 'Harvest',
      timestamp: new Date(h.date || h.harvest_date || 0).getTime()
    }));

    // 2. Submissions / test records
    const submissionList = (submissions || []).map((s, idx) => {
      const raw = s.data || {};
      const abwVal = s.abw || raw.abw;
      const fcrVal = s.fcr || raw.fcr;
      const docVal = s.doc != null ? s.doc : raw.doc;
      const testType = s.testType || s.test_type || (raw.testType) || 'Field Test';
      const dateVal = s.date || (s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : '-');

      return {
        id: s.id ? `sub_${s.id}` : `sub_${idx}`,
        farmerName: s.farmerName || s.farmer_name || 'Farmer',
        tankName: s.tankName || s.tank_name || s.tankId || '-',
        abw: abwVal ? (String(abwVal).includes('g') ? abwVal : `${abwVal}g`) : '-',
        fcr: fcrVal != null && fcrVal !== '' ? Number(fcrVal).toFixed(2) : '-',
        doc: docVal != null && docVal !== '' ? Number(docVal) : null,
        date: dateVal,
        quality: testType,
        timestamp: new Date(s.createdAt || s.date || 0).getTime()
      };
    });

    const combined = [...harvestList, ...submissionList];
    return combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [liveHarvests, submissions]);

  // When DOC is entered: specific DOC details 1st, then descending order DOC farmers; otherwise all farmers
  const filteredHarvests = useMemo(() => {
    const trimmed = String(docInput || '').trim();
    if (!trimmed) {
      return allRecords;
    }

    const targetDoc = parseInt(trimmed, 10);
    if (isNaN(targetDoc)) {
      return allRecords;
    }

    // 1. That specific DOC details 1st
    const exactMatches = allRecords
      .filter(r => r.doc !== null && Number(r.doc) === targetDoc)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // 2. Later on: descending order DOC farmers
    const lowerDescending = allRecords
      .filter(r => r.doc !== null && Number(r.doc) < targetDoc)
      .sort((a, b) => {
        const diff = (Number(b.doc) || 0) - (Number(a.doc) || 0);
        if (diff !== 0) return diff;
        return (b.timestamp || 0) - (a.timestamp || 0);
      });

    return [...exactMatches, ...lowerDescending];
  }, [allRecords, docInput]);

  // Show the first 5 records in the combined Harvest and FCR section (Requirement 4)
  const displayedHarvestRecords = filteredHarvests.slice(0, 5);

  // Today's Date and Today Submissions Count
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const todaySubmissionsCount = useMemo(() => {
    if (todayLocationCount !== null) return todayLocationCount;
    if (!Array.isArray(submissions)) return 0;
    return submissions.filter(s => {
      const sDate = s.date || (s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : '');
      return sDate === todayDateStr;
    }).length;
  }, [todayLocationCount, submissions, todayDateStr]);

  return (
    <div style={styles.dashboardContainer}>

      {/* 1. Header Section with Today Submissions option */}
      <div style={styles.headerRow}>
        <h1 style={styles.headerTitle}>Royal's Marine Operational Dashboard</h1>

        <button
          type="button"
          onClick={() => navigate('/admin/submission-locations')}
          style={styles.todaySubmissionsBtn}
          title="Click to view Today's Submissions List"
        >
          <div style={styles.todaySubmissionsIconWrap}>
            <ClipboardList size={18} color="#0284C7" />
          </div>
          <span style={styles.todaySubmissionsTitle}>Today Submissions</span>
          <span style={styles.todayCountPill}>
            {todaySubmissionsCount} Today
          </span>
          <ArrowUpRight size={15} color="#0284C7" />
        </button>
      </div>

      {/* Error State Alert Banner with Retry */}
      {error && (
        <div style={styles.errorBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} color="#DC2626" />
            <span style={{ color: '#B91C1C', fontWeight: 600, fontSize: '14px' }}>
              {error}
            </span>
          </div>
          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            style={styles.retryBtn}
          >
            Retry Connection
          </button>
        </div>
      )}

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
          <div style={styles.kpiValue}>
            {isLoading ? <div style={styles.skeletonValue} /> : totalFarmers}
          </div>
          <div style={styles.kpiLink}>View All Farmers <ArrowUpRight size={14} /></div>
        </div>

        {/* Card 1b: Active Farmers */}
        <div
          style={styles.kpiCard}
          onClick={() => navigate('/admin/farmers?status=Active')}
          title="Click to view active farmers"
        >
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>ACTIVE FARMERS</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#DCFCE7', color: '#16A34A' }}>
              <UserCheck size={18} />
            </div>
          </div>
          <div style={styles.kpiValue}>
            {isLoading ? <div style={styles.skeletonValue} /> : activeFarmers}
          </div>
          <div style={{ ...styles.kpiLink, color: '#16A34A' }}>View Active <ArrowUpRight size={14} /></div>
        </div>

        {/* Card 1c: Inactive Farmers */}
        <div
          style={styles.kpiCard}
          onClick={() => navigate('/admin/farmers?status=Inactive')}
          title="Click to view inactive farmers"
        >
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>INACTIVE FARMERS</span>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: '#FEE2E2', color: '#DC2626' }}>
              <UserX size={18} />
            </div>
          </div>
          <div style={styles.kpiValue}>
            {isLoading ? <div style={styles.skeletonValue} /> : inactiveFarmers}
          </div>
          <div style={{ ...styles.kpiLink, color: '#DC2626' }}>View Inactive <ArrowUpRight size={14} /></div>
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
          <div style={styles.kpiValue}>
            {isLoading ? <div style={styles.skeletonValue} /> : totalTanks}
          </div>
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
          <div style={styles.kpiValue}>
            {isLoading ? <div style={styles.skeletonValue} /> : activeTanks}
          </div>
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
          <div style={styles.kpiValue}>
            {isLoading ? <div style={styles.skeletonValue} /> : harvestedTanks}
          </div>
          <div style={{ ...styles.kpiLink, color: '#9333EA' }}>View Harvested <ArrowUpRight size={14} /></div>
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
            {isLoading ? (
              <div style={{ ...styles.skeletonValue, width: '48px', height: '30px' }} />
            ) : (
              <>
                <span>{totalIncharges}</span>
                <span style={{ fontSize: '18px', fontWeight: '700' }}>Incharges</span>
              </>
            )}
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
          <div style={{ ...styles.kpiValue, color: '#DC2626' }}>
            {isLoading ? (
              <div style={{ ...styles.skeletonValue, width: '90px', backgroundColor: '#FEE2E2' }} />
            ) : (
              `${dueAndOverdueTanks.length} Tanks`
            )}
          </div>
          <div style={{ ...styles.kpiLink, color: '#DC2626', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>View All Due Tests <ArrowUpRight size={12} /></div>
            <span>({isLoading ? '...' : overdueCount} Overdue)</span>
          </div>
        </div>
      </div>

      {/* 3. Operational Harvest & Records Section */}
      <div style={styles.sectionCard}>
        {/* Section Header */}
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitleRow}>
            <TrendingUp size={20} color="#2563EB" />
            <h2 style={styles.sectionTitle}>Harvest &amp; FCR Records</h2>
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
              {isLoading ? (
                [1, 2, 3].map((n) => (
                  <tr key={`skel-${n}`} style={styles.tableRow}>
                    <td style={styles.tdPrimary}>
                      <div style={{ height: '16px', width: '130px', borderRadius: '4px', backgroundColor: '#E2E8F0' }} />
                    </td>
                    <td style={styles.td}>
                      <div style={{ height: '16px', width: '60px', borderRadius: '4px', backgroundColor: '#E2E8F0' }} />
                    </td>
                    <td style={styles.tdWeight}>
                      <div style={{ height: '16px', width: '50px', borderRadius: '4px', backgroundColor: '#E2E8F0' }} />
                    </td>
                    <td style={styles.tdFcr}>
                      <div style={{ height: '16px', width: '40px', borderRadius: '4px', backgroundColor: '#E2E8F0' }} />
                    </td>
                    <td style={styles.tdDoc}>
                      <div style={{ height: '16px', width: '35px', borderRadius: '4px', backgroundColor: '#E2E8F0' }} />
                    </td>
                    <td style={styles.tdDate}>
                      <div style={{ height: '16px', width: '85px', borderRadius: '4px', backgroundColor: '#E2E8F0' }} />
                    </td>
                    <td style={styles.td}>
                      <div style={{ height: '22px', width: '70px', borderRadius: '6px', backgroundColor: '#E2E8F0' }} />
                    </td>
                  </tr>
                ))
              ) : displayedHarvestRecords.length === 0 ? (
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
                      <td style={styles.tdFcr}>{record.fcr && record.fcr !== '-' ? (!isNaN(Number(record.fcr)) ? Number(record.fcr).toFixed(2) : record.fcr) : '-'}</td>
                      <td style={styles.tdDoc}>{record.doc != null && record.doc !== '' ? record.doc : '-'}</td>
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

        {/* ONE Show More button that navigates to the existing full combined records page (Requirement 5) */}
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
              onClick={() => navigate('/admin/field-data')}
              title="Click to view full Harvest & FCR records page"
            >
              <span>Show More ({filteredHarvests.length - 5} Remaining)</span>
              <ArrowUpRight size={16} />
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
        <HarvestedTanksModal
          onClose={() => setShowHarvestedModal(false)}
          tanks={allTanks}
          farmers={farmers}
          harvests={liveHarvests}
        />
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

  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '8px'
  },

  headerTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.02em'
  },

  todaySubmissionsBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #BAE6FD',
    borderRadius: '14px',
    padding: '8px 16px',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(2, 132, 199, 0.08)',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit'
  },

  todaySubmissionsIconWrap: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    backgroundColor: '#E0F2FE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #BAE6FD',
    flexShrink: 0
  },

  todaySubmissionsTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: '-0.01em'
  },

  todayCountPill: {
    fontSize: '11.5px',
    fontWeight: 700,
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    border: '1px solid #BBF7D0',
    padding: '2px 8px',
    borderRadius: '12px',
    letterSpacing: '0.02em'
  },

  headerSubtitle: {
    fontSize: '15px',
    color: '#64748B',
    margin: 0,
    fontWeight: 400
  },

  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
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
    letterSpacing: '-0.02em',
    minHeight: '32px',
    display: 'flex',
    alignItems: 'center'
  },

  skeletonValue: {
    height: '28px',
    width: '52px',
    borderRadius: '6px',
    backgroundColor: '#E2E8F0',
    display: 'inline-block'
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
  },

  errorBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 18px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '10px',
    marginBottom: '8px'
  },

  retryBtn: {
    padding: '6px 14px',
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '12.5px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  }
};

export default AdminDashboard;
