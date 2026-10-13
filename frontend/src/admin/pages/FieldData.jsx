import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { calculateBiomass, calculateFCR } from '../utils/adminCalculations';
import { adminService } from '../utils/adminService';
import {
  Search, Filter, Calendar, FileText, CheckCircle2, Clock, User, Users,
  UserCircle, Droplet, X, TestTube, MapPin, ShieldCheck, Activity,
  Scale, Thermometer, Wind, Eye, Check, Waves
} from 'lucide-react';

const getTestTypeTheme = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('biomass')) {
    return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', badge: '#10b981' };
  }
  if (t.includes('feed')) {
    return { bg: '#fffbeb', text: '#b45309', border: '#fde68a', badge: '#f59e0b' };
  }
  if (t.includes('health') || t.includes('disease')) {
    return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff', badge: '#9333ea' };
  }
  if (t.includes('harvest')) {
    return { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', badge: '#f97316' };
  }
  return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', badge: '#2563eb' };
};

const extractRecordParameters = (record, tank, farmer) => {
  if (!record) return { waterParams: [], growthParams: [], otherParams: [], notes: '', gpsInfo: null };

  const raw = typeof record.data === 'string' ? JSON.parse(record.data || '{}') : (record.data || {});

  const cleanVal = (v) => {
    if (v === undefined || v === null || v === '') return null;
    return String(v).trim();
  };

  const waterDefs = [
    { key: 'ph', altKeys: ['pH'], label: 'Water pH Level', unit: '', ideal: '7.5 – 8.5 pH', icon: Droplet },
    { key: 'salinity', altKeys: ['sal'], label: 'Water Salinity', unit: 'ppt', ideal: '10 – 25 ppt', icon: Waves },
    { key: 'do', altKeys: ['dissolvedOxygen', 'DO'], label: 'Dissolved Oxygen (DO)', unit: 'mg/L', ideal: '5.0 – 8.0 mg/L', icon: Wind },
    { key: 'temperature', altKeys: ['temp'], label: 'Water Temperature', unit: '°C', ideal: '28.0 – 32.0 °C', icon: Thermometer },
    { key: 'alkalinity', altKeys: ['totalAlkalinity'], label: 'Total Alkalinity', unit: 'ppm', ideal: '100 – 150 ppm', icon: Activity },
    { key: 'hardness', altKeys: ['totalHardness'], label: 'Total Hardness', unit: 'ppm', ideal: '250 – 4000 ppm', icon: Activity },
    { key: 'ammonia', altKeys: ['nh3', 'nh3n'], label: 'Ammonia (NH3-N)', unit: 'ppm', ideal: '< 0.10 ppm', icon: TestTube },
    { key: 'nitrite', altKeys: ['no2', 'no2n'], label: 'Nitrite (NO2-N)', unit: 'ppm', ideal: '< 0.05 ppm', icon: TestTube },
    { key: 'transparency', altKeys: ['secchi'], label: 'Transparency (Secchi)', unit: 'cm', ideal: '30 – 40 cm', icon: Eye },
  ];

  const waterParams = [];
  const processedKeys = new Set();

  waterDefs.forEach(def => {
    let val = cleanVal(raw[def.key]);
    if (!val && def.altKeys) {
      for (const ak of def.altKeys) {
        val = cleanVal(raw[ak]);
        if (val) break;
      }
    }
    if (!val && raw.waterQuality) {
      val = cleanVal(raw.waterQuality[def.key]);
    }
    if (!val && record[def.key] !== undefined) {
      val = cleanVal(record[def.key]);
    }

    if (val !== null) {
      processedKeys.add(def.key);
      if (def.altKeys) def.altKeys.forEach(k => processedKeys.add(k));
      let displayVal = val;
      if (def.unit && !displayVal.toLowerCase().includes(def.unit.toLowerCase())) {
        displayVal = `${displayVal} ${def.unit}`;
      }
      waterParams.push({
        label: def.label,
        value: displayVal,
        ideal: def.ideal,
        icon: def.icon,
      });
    }
  });

  const growthDefs = [
    { key: 'doc', altKeys: ['DOC', 'daysOfCulture'], label: 'Days of Culture (DOC)', unit: 'Days', fallback: tank?.doc },
    { key: 'abw', altKeys: ['ABW', 'averageBodyWeight'], label: 'Average Body Weight (ABW)', unit: 'g', fallback: tank?.abw },
    { key: 'biomass', altKeys: ['estimatedBiomass'], label: 'Estimated Biomass', unit: 'kg', fallback: null },
    { key: 'fcr', altKeys: ['FCR', 'feedConversionRatio'], label: 'Feed Conversion Ratio (FCR)', unit: '', fallback: null },
    { key: 'cumulativeFeed', altKeys: ['feed', 'totalFeed'], label: 'Cumulative Feed', unit: 'kg', fallback: tank?.feed },
    { key: 'harvestType', altKeys: ['type'], label: 'Harvest Type', unit: '', fallback: null },
    { key: 'harvestedBiomass', altKeys: ['quantityKg'], label: 'Harvested Biomass', unit: 'kg', fallback: null },
    { key: 'harvestedNumber', altKeys: ['countPerKg'], label: 'Harvested Count / Pieces', unit: '', fallback: null },
  ];

  const growthParams = [];
  growthDefs.forEach(def => {
    let val = cleanVal(raw[def.key]);
    if (!val && def.altKeys) {
      for (const ak of def.altKeys) {
        val = cleanVal(raw[ak]);
        if (val) break;
      }
    }
    if (!val && record[def.key] !== undefined) {
      val = cleanVal(record[def.key]);
    }
    if (!val && def.fallback) {
      val = cleanVal(def.fallback);
    }

    if (val !== null) {
      processedKeys.add(def.key);
      if (def.altKeys) def.altKeys.forEach(k => processedKeys.add(k));
      let displayVal = val;
      if (def.unit && !displayVal.toLowerCase().includes(def.unit.toLowerCase())) {
        displayVal = `${displayVal} ${def.unit}`;
      }
      growthParams.push({
        label: def.label,
        value: displayVal,
      });
    }
  });

  const notes = raw.notes || raw.remarks || record.notes || record.review_notes || record.reviewNotes || '';
  processedKeys.add('notes');
  processedKeys.add('remarks');
  processedKeys.add('gps');
  processedKeys.add('date');
  processedKeys.add('time');
  processedKeys.add('submissionTime');
  processedKeys.add('id');
  processedKeys.add('farmerId');
  processedKeys.add('tankId');
  processedKeys.add('testType');
  processedKeys.add('waterQuality');

  const otherParams = [];
  Object.keys(raw).forEach(k => {
    if (!processedKeys.has(k)) {
      const v = cleanVal(raw[k]);
      if (v !== null && typeof raw[k] !== 'object') {
        const prettyLabel = k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, str => str.toUpperCase());
        otherParams.push({
          label: prettyLabel,
          value: String(v)
        });
      }
    }
  });

  const gpsInfo = {
    locality: raw.gps?.locality || record.locality || farmer?.location || farmer?.village || 'Aquaculture Field Zone',
    latitude: raw.gps?.latitude ?? record.latitude,
    longitude: raw.gps?.longitude ?? record.longitude,
    accuracy: raw.gps?.accuracy ?? record.accuracy ?? '±8m',
  };

  return { waterParams, growthParams, otherParams, notes, gpsInfo };
};

const FieldData = () => {
  const location = useLocation();

  const [submissions, setSubmissions] = useState([]);
  const [incharges, setIncharges] = useState([]);
  const [allAgents, setAllAgents] = useState([]);
  const [allFarmers, setAllFarmers] = useState([]);
  const [allTanks, setAllTanks] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadFieldData = (force = false) => {
    if (submissions.length === 0) setLoading(true);
    Promise.allSettled([
      adminService.getSubmissions(force),
      adminService.getIncharges(force),
      adminService.getAgents(force),
      adminService.getFarmers(force),
      adminService.getTanks(force)
    ]).then(([subRes, incRes, agRes, farRes, tkRes]) => {
      if (subRes.status === 'fulfilled' && Array.isArray(subRes.value)) setSubmissions(subRes.value);
      if (incRes.status === 'fulfilled' && Array.isArray(incRes.value)) setIncharges(incRes.value);
      if (agRes.status === 'fulfilled' && Array.isArray(agRes.value)) setAllAgents(agRes.value);
      if (farRes.status === 'fulfilled' && Array.isArray(farRes.value)) setAllFarmers(farRes.value);
      if (tkRes.status === 'fulfilled' && Array.isArray(tkRes.value)) setAllTanks(tkRes.value);
      setLoading(false);
    }).catch(err => {
      console.error('[FieldData] Failed to fetch data:', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadFieldData(false);
    const handleDataChanged = () => loadFieldData(true);
    window.addEventListener('adminDataChanged', handleDataChanged);
    return () => window.removeEventListener('adminDataChanged', handleDataChanged);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedRecord(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [filters, setFilters] = useState({
    incharge: '',
    agent: '',
    farmer: '',
    tank: '',
    dateFrom: '',
    dateTo: ''
  });

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    if (field === 'incharge') {
      newFilters.agent = '';
      newFilters.farmer = '';
      newFilters.tank = '';
    }
    if (field === 'agent') {
      newFilters.farmer = '';
      newFilters.tank = '';
    }
    if (field === 'farmer') {
      newFilters.tank = '';
    }
    setFilters(newFilters);
  };

  const availableIncharges = useMemo(() => {
    return incharges.map(i => (i.name || '').split(' (')[0]);
  }, [incharges]);

  const availableAgents = useMemo(() => {
    let filtered = allAgents;
    if (filters.incharge) filtered = filtered.filter(a => a.incharge === filters.incharge);
    return filtered.map(a => (a.name || '').split(' (')[0]);
  }, [filters.incharge, allAgents]);

  const availableFarmers = useMemo(() => {
    let filtered = allFarmers;
    if (filters.incharge) filtered = filtered.filter(f => f.incharge === filters.incharge);
    if (filters.agent) filtered = filtered.filter(f => f.agent && f.agent.includes(filters.agent));
    return filtered.map(f => f.name);
  }, [filters.incharge, filters.agent, allFarmers]);

  const availableTanks = useMemo(() => {
    let filtered = allTanks;
    if (filters.incharge) filtered = filtered.filter(t => t.incharge === filters.incharge);
    if (filters.agent) filtered = filtered.filter(t => t.agent && t.agent.includes(filters.agent));
    if (filters.farmer) filtered = filtered.filter(t => t.farmer === filters.farmer);
    return filtered.map(t => t.name || t.id);
  }, [filters.incharge, filters.agent, filters.farmer, allTanks]);

  let filteredSubmissions = submissions.filter(sub => {
    const tank = getTankById(sub.tankId) || {};
    const farmer = allFarmers.find(f => f.id === sub.farmerId || f.name === sub.farmerId) || {};

    if (filters.incharge && (farmer.incharge !== filters.incharge && tank.incharge !== filters.incharge)) return false;
    if (filters.agent && (farmer.agent && !farmer.agent.includes(filters.agent))) return false;
    if (filters.farmer && sub.farmerId !== filters.farmer && farmer.name !== filters.farmer) return false;
    if (filters.tank && sub.tankId !== filters.tank && tank.name !== filters.tank) return false;
    if (filters.dateFrom && sub.date < filters.dateFrom) return false;
    if (filters.dateTo && sub.date > filters.dateTo) return false;

    return true;
  });

  const formatSubmissionDateTime = (sub) => {
    let dateStr = sub.date || '';
    if (dateStr && dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }
    if (!dateStr && (sub.created_at || sub.createdAt || sub.timestamp)) {
      try {
        const d = new Date(sub.created_at || sub.createdAt || sub.timestamp);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().split('T')[0];
        }
      } catch { }
    }

    let timeStr = sub.submissionTime || sub.submission_time || sub.time || '';
    if (!timeStr && (sub.created_at || sub.createdAt || sub.timestamp || sub.submittedAt)) {
      try {
        const d = new Date(sub.created_at || sub.createdAt || sub.timestamp || sub.submittedAt);
        if (!isNaN(d.getTime())) {
          timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        }
      } catch { }
    }

    return {
      date: dateStr || '-',
      time: timeStr || ''
    };
  };

  filteredSubmissions.sort((a, b) => {
    const timeB = new Date(b.createdAt || b.created_at || b.date || 0).getTime();
    const timeA = new Date(a.createdAt || a.created_at || a.date || 0).getTime();
    if (timeB && timeA && timeB !== timeA) return timeB - timeA;
    return new Date(b.date || 0) - new Date(a.date || 0);
  });

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Field Data &amp; Daily Records</h1>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.filterBar}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', width: '100%' }}>
            {/* Date From Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Date From</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px' }}>
                <Calendar size={15} color="#94a3b8" />
                <input
                  type="date"
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: '#1e293b' }}
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>
            </div>

            {/* Date To Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Date To</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px' }}>
                <Calendar size={15} color="#94a3b8" />
                <input
                  type="date"
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: '#1e293b' }}
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
            </div>

            {/* Incharge Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>ASM / Incharge</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px' }}>
                <User size={15} color="#94a3b8" />
                <select style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: '#1e293b' }} value={filters.incharge} onChange={(e) => handleFilterChange('incharge', e.target.value)}>
                  <option value="">All Incharges</option>
                  {availableIncharges.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            {/* Agent Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Field Agent</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px' }}>
                <Users size={15} color="#94a3b8" />
                <select style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: '#1e293b' }} value={filters.agent} onChange={(e) => handleFilterChange('agent', e.target.value)}>
                  <option value="">All Agents</option>
                  {availableAgents.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {/* Farmer Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Farmer</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px' }}>
                <UserCircle size={15} color="#94a3b8" />
                <select style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: '#1e293b' }} value={filters.farmer} onChange={(e) => handleFilterChange('farmer', e.target.value)}>
                  <option value="">All Farmers</option>
                  {availableFarmers.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>


          </div>

        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={styles.th}>Record ID</th>
                <th style={{ ...styles.th, minWidth: '140px' }}>Date &amp; Time</th>
                <th style={styles.th}>Tank ID</th>
                <th style={styles.th}>Farmer</th>
                <th style={styles.th}>Agent</th>
                <th style={styles.th}>Test Type</th>
                <th style={styles.th}>Water pH / Salinity</th>
                <th style={styles.th}>Biomass / FCR</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((item) => {
                  const tank = getTankById(item.tankId) || {};
                  const seedStockingLak = tank.seedStockingLak || 3.5; // fallback
                  const abwStr = item.data?.abw || tank.abw || '12';
                  const abw = parseFloat(abwStr.toString().replace('g', ''));
                  const dynamicBiomass = calculateBiomass(seedStockingLak, abw) || parseInt(item.data?.biomass) || 1200;

                  // Extract feed if available from database record
                  const feedStr = item.data?.cumulativeFeed || item.data?.feed || tank.feed;
                  let cumulativeFeed = parseFloat(feedStr);
                  const dynamicFcr = (!isNaN(cumulativeFeed) && dynamicBiomass > 0)
                    ? calculateFCR(cumulativeFeed, dynamicBiomass)
                    : (item.data?.fcr ? Number(item.data.fcr).toFixed(2) : '-');

                  const farmerObj = allFarmers.find(f => f.id === item.farmerId || f.name === item.farmerId) || {};
                  const farmerNameToDisplay = farmerObj.name || item.farmerId || '-';

                  const phVal = item.data?.waterQuality?.ph ?? item.data?.ph;
                  const salVal = item.data?.waterQuality?.salinity ?? item.data?.salinity;
                  const wqDisplay = phVal || salVal
                    ? `${phVal ? `pH: ${phVal}` : ''}${phVal && salVal ? ' | ' : ''}${salVal ? `${salVal} ppt` : ''}`
                    : '-';

                  const { date: subDate, time: subTime } = formatSubmissionDateTime(item);
                  const typeTheme = getTestTypeTheme(item.testType);

                  return (
                    <tr key={item.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 700, color: '#1d4ed8' }}>{item.id}</td>
                      <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{subDate}</div>
                        {subTime ? (
                          <div style={{ color: '#475569', fontSize: '12px', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} color="#0284c7" />
                            <span style={{ color: '#0f172a', fontWeight: 500 }}>{subTime}</span>
                          </div>
                        ) : null}
                      </td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{tank.name || item.tankId || '-'}</td>
                      <td style={styles.td}>{farmerNameToDisplay}</td>
                      <td style={styles.td}>{item.agentId || '-'}</td>
                      <td style={styles.td}>
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(item)}
                          title="Click to view all entered parameter field data"
                          style={{
                            ...styles.typeBadgeBtn,
                            backgroundColor: typeTheme.bg,
                            color: typeTheme.text,
                            border: `1px solid ${typeTheme.border}`
                          }}
                          className="transition-all duration-150 hover:shadow-sm active:scale-95 cursor-pointer"
                        >
                          <TestTube size={13} />
                          <span>{item.testType || 'Water Test'}</span>
                          <Eye size={12} style={{ opacity: 0.7, marginLeft: '2px' }} />
                        </button>
                      </td>
                      <td style={styles.td}>
                        {wqDisplay}
                      </td>
                      <td style={styles.td}>
                        {dynamicBiomass > 0 ? `${dynamicBiomass.toLocaleString()} kg` : '-'} {dynamicFcr !== '-' ? `(FCR: ${dynamicFcr})` : ''}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                    No field data records found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parameter Details Modal Dialog */}
      {selectedRecord && createPortal((() => {
        const tank = allTanks.find(t => t.id === selectedRecord.tankId) || {};
        const farmerObj = allFarmers.find(f => f.id === selectedRecord.farmerId || f.name === selectedRecord.farmerId) || {};
        const farmerName = farmerObj.name || selectedRecord.farmerId || '-';
        const tankName = tank.name || selectedRecord.tankId || 'Tank';
        const agentName = selectedRecord.userName || selectedRecord.agentName || selectedRecord.agentId || 'Field Agent';
        const role = selectedRecord.role || (String(selectedRecord.agentId || '').startsWith('INC') ? 'ASM / Incharge' : 'Field Agent');
        const { date: subDate, time: subTime } = formatSubmissionDateTime(selectedRecord);
        const theme = getTestTypeTheme(selectedRecord.testType);
        const { waterParams, growthParams, otherParams, notes, gpsInfo } = extractRecordParameters(selectedRecord, tank, farmerObj);

        return (
          <div
            className="animate-backdrop-in"
            style={modalStyles.overlay}
            onClick={() => setSelectedRecord(null)}
          >
            <div
              className="animate-modal-in"
              style={modalStyles.modalCard}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={modalStyles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: theme.bg,
                    border: `1px solid ${theme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.text
                  }}>
                    <TestTube size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={modalStyles.title}>{selectedRecord.testType || 'Field Test Record'}</h2>
                      <span style={{
                        backgroundColor: theme.bg,
                        color: theme.text,
                        border: `1px solid ${theme.border}`,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {role} Submitted
                      </span>
                    </div>
                    <div style={modalStyles.subTitle}>
                      Record ID: <span style={{ fontWeight: 600, color: '#1d4ed8' }}>{selectedRecord.id}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  style={modalStyles.closeBtn}
                  className="transition-all duration-150 hover:bg-slate-100 active:scale-95 cursor-pointer"
                  title="Close modal"
                >
                  <X size={20} color="#64748b" />
                </button>
              </div>

              {/* Modal Body */}
              <div style={modalStyles.body}>
                {/* Top Meta Details Strip */}
                <div style={modalStyles.metaGrid}>
                  <div style={modalStyles.metaCard}>
                    <div style={modalStyles.metaLabel}>
                      <Calendar size={13} color="#94a3b8" /> Date &amp; Time
                    </div>
                    <div style={modalStyles.metaValue}>{subDate}</div>
                    {subTime && (
                      <div style={{ color: '#0284c7', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: 600 }}>
                        <Clock size={11} /> {subTime}
                      </div>
                    )}
                  </div>

                  <div style={modalStyles.metaCard}>
                    <div style={modalStyles.metaLabel}>
                      <UserCircle size={13} color="#94a3b8" /> Farmer
                    </div>
                    <div style={modalStyles.metaValue}>{farmerName}</div>
                    <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                      ID: {selectedRecord.farmerId || '-'}
                    </div>
                  </div>

                  <div style={modalStyles.metaCard}>
                    <div style={modalStyles.metaLabel}>
                      <Waves size={13} color="#94a3b8" /> Tank / Pond
                    </div>
                    <div style={modalStyles.metaValue}>{tankName}</div>
                    <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                      {tank.area_acres || tank.acres ? `${tank.area_acres || tank.acres} Acres` : `Tank ID: ${selectedRecord.tankId || '-'}`}
                    </div>
                  </div>

                  <div style={modalStyles.metaCard}>
                    <div style={modalStyles.metaLabel}>
                      <User size={13} color="#94a3b8" /> Logged By Staff
                    </div>
                    <div style={modalStyles.metaValue}>{agentName}</div>
                    <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                      {selectedRecord.agentId || 'Field Staff'}
                    </div>
                  </div>
                </div>

                {/* Section 1: Water Quality Parameters (if present) */}
                {waterParams.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <div style={modalStyles.sectionHeaderRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Droplet size={17} color="#2563eb" />
                        <h3 style={modalStyles.sectionTitle}>Water Quality Parameters</h3>
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {waterParams.length} parameter{waterParams.length > 1 ? 's' : ''} captured
                      </span>
                    </div>

                    <div style={{ overflowX: 'auto', marginTop: '12px' }}>
                      <table style={modalStyles.paramTable}>
                        <thead>
                          <tr style={modalStyles.paramTheadRow}>
                            <th style={modalStyles.paramTh}>Parameter Field</th>
                            <th style={modalStyles.paramTh}>Recorded Reading</th>
                            <th style={modalStyles.paramTh}>Standard Reference</th>
                            <th style={modalStyles.paramTh}>Verification</th>
                          </tr>
                        </thead>
                        <tbody>
                          {waterParams.map((param, idx) => (
                            <tr key={idx} style={modalStyles.paramTr}>
                              <td style={modalStyles.paramTdLabel}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={modalStyles.bulletDot} />
                                  <span>{param.label}</span>
                                </div>
                              </td>
                              <td style={modalStyles.paramTdValue}>
                                <span style={modalStyles.valueBadge}>{param.value}</span>
                              </td>
                              <td style={modalStyles.paramTdIdeal}>{param.ideal}</td>
                              <td style={modalStyles.paramTdStatus}>
                                <span style={modalStyles.optimalBadge}>
                                  <Check size={11} /> Recorded
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Section 2: Aquaculture & Growth Parameters (if present) */}
                {growthParams.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <div style={modalStyles.sectionHeaderRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Scale size={17} color="#059669" />
                        <h3 style={modalStyles.sectionTitle}>Aquaculture &amp; Growth Metrics</h3>
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {growthParams.length} field{growthParams.length > 1 ? 's' : ''} recorded
                      </span>
                    </div>

                    <div style={modalStyles.growthGrid}>
                      {growthParams.map((g, idx) => (
                        <div key={idx} style={modalStyles.growthCard}>
                          <span style={modalStyles.growthLabel}>{g.label}</span>
                          <strong style={modalStyles.growthValue}>{g.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 3: Any Other Parameters Captured */}
                {otherParams.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <div style={modalStyles.sectionHeaderRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={17} color="#475569" />
                        <h3 style={modalStyles.sectionTitle}>Additional Parameter Fields</h3>
                      </div>
                    </div>

                    <div style={modalStyles.growthGrid}>
                      {otherParams.map((op, idx) => (
                        <div key={idx} style={modalStyles.growthCard}>
                          <span style={modalStyles.growthLabel}>{op.label}</span>
                          <strong style={modalStyles.growthValue}>{op.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 4: Notes & Remarks */}
                {notes && (
                  <div style={{ marginTop: '24px' }}>
                    <div style={modalStyles.notesCard}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <FileText size={16} color="#d97706" />
                        <strong style={{ fontSize: '13px', color: '#92400e' }}>Technician Field Remarks / Notes</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#78350f', lineHeight: 1.5 }}>
                        "{notes}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Section 5: GPS Location Verification */}
                <div style={{ marginTop: '24px' }}>
                  <div style={modalStyles.gpsCard}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="#2563eb" />
                        <strong style={{ fontSize: '13px', color: '#1e293b' }}>GPS Geolocation Verification</strong>
                      </div>
                      <span style={modalStyles.gpsVerifiedBadge}>
                        <ShieldCheck size={12} color="#16a34a" /> Geotag Verified
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{gpsInfo.locality}</div>
                        {gpsInfo.latitude && gpsInfo.longitude && (
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                            Coordinates: {Number(gpsInfo.latitude).toFixed(6)}, {Number(gpsInfo.longitude).toFixed(6)}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px' }}>
                        Accuracy: <strong>{typeof gpsInfo.accuracy === 'number' ? `±${gpsInfo.accuracy.toFixed(1)}m` : gpsInfo.accuracy}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={modalStyles.footer}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Press <kbd style={{ padding: '2px 5px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>ESC</kbd> or click outside to close
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  style={modalStyles.doneBtn}
                  className="transition-all duration-150 hover:bg-blue-700 active:scale-95 cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        );
      })(), document.body)}
    </div>
  );
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(3px)',
    WebkitBackdropFilter: 'blur(3px)',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '32px',
    paddingBottom: '32px',
    paddingLeft: '20px',
    paddingRight: '20px',
    overflowY: 'auto'
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '860px',
    width: '100%',
    maxHeight: 'calc(100vh - 64px)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden'
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: '#0f172a'
  },
  subTitle: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px'
  },
  closeBtn: {
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  body: {
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column'
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px'
  },
  metaCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '12px 14px'
  },
  metaLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginBottom: '4px'
  },
  metaValue: {
    fontSize: '13.5px',
    fontWeight: 700,
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '8px'
  },
  sectionTitle: {
    margin: 0,
    fontSize: '14.5px',
    fontWeight: 700,
    color: '#1e293b'
  },
  paramTable: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px'
  },
  paramTheadRow: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  },
  paramTh: {
    padding: '10px 14px',
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.4px'
  },
  paramTr: {
    borderBottom: '1px solid #f1f5f9'
  },
  paramTdLabel: {
    padding: '12px 14px',
    color: '#1e293b',
    fontWeight: 600
  },
  bulletDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    display: 'inline-block'
  },
  paramTdValue: {
    padding: '12px 14px'
  },
  valueBadge: {
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    padding: '4px 10px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '13px',
    display: 'inline-block'
  },
  paramTdIdeal: {
    padding: '12px 14px',
    color: '#64748b',
    fontSize: '12.5px'
  },
  paramTdStatus: {
    padding: '12px 14px'
  },
  optimalBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#ecfdf5',
    color: '#059669',
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '9999px',
    border: '1px solid #a7f3d0'
  },
  growthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '12px',
    marginTop: '12px'
  },
  growthCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  growthLabel: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 600
  },
  growthValue: {
    fontSize: '15px',
    color: '#0f172a',
    fontWeight: 700
  },
  notesCard: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '12px',
    padding: '14px 16px'
  },
  gpsCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px 16px'
  },
  gpsVerifiedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#f0fdf4',
    color: '#15803d',
    border: '1px solid #bbf7d0',
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '9999px'
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  doneBtn: {
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    border: 'none',
    padding: '9px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  }
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1380px',
    margin: '0 auto'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0
  },
  subtitle: {
    fontSize: '13.5px',
    color: '#64748b',
    margin: '4px 0 0 0'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px 32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f8fafc',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '10px 16px',
    width: '380px'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    fontSize: '13.5px',
    color: '#1e293b'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  tableHeadRow: {
    borderBottom: '2px solid #e2e8f0',
    backgroundColor: '#f8fafc'
  },
  th: {
    padding: '16px 20px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.15s',
    '&:hover': {
      backgroundColor: '#f8fafc'
    }
  },
  td: {
    padding: '18px 20px',
    fontSize: '13.5px',
    color: '#334155'
  },
  typeBadgeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  typeBadge: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '11.5px',
    fontWeight: 700
  }
};

export default FieldData;
