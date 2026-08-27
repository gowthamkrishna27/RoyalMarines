import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Filter, MapPin, User, Droplet } from 'lucide-react';
import { getSession } from '../utils/agentAuth';
import { useMockData } from '../../context/MockDataContext';
import StatusBadge from '../components/StatusBadge';

const Reports = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const { db } = useMockData();

  // Consolidation View Mode: 'DATE', 'MONTH'
  const [consolidationMode, setConsolidationMode] = useState('DATE');

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState('ALL');
  const [selectedTank, setSelectedTank] = useState('ALL');

  useEffect(() => {
    const s = getSession();
    if (!s) {
      navigate('/login');
      return;
    }
    setSession(s);
  }, [navigate]);

  if (!session || !db) return null;

  // Agent locality (e.g. Chinnamiram from Profile)
  const agentLocality = session.locality || 'Chinnamiram';

  // Filter farmers to agent's assigned locality ONLY
  const localityFarmers = (db.farmers || []).filter(f => {
    if (agentLocality) {
      return f.location.toLowerCase().includes(agentLocality.toLowerCase());
    }
    return f.agentId === session.agentId;
  });

  const localityFarmerIds = new Set(localityFarmers.map(f => f.id));

  // Available tanks dependent on farmer selection (strictly within agent's locality)
  const availableTanks = selectedFarmer !== 'ALL'
    ? (db.tanks || []).filter(t => t.farmerId === selectedFarmer)
    : (db.tanks || []).filter(t => localityFarmerIds.has(t.farmerId));

  // Build submission list for agent's locality farmers ONLY
  const allSubmissions = (db.submissions || [])
    .filter(sub => localityFarmerIds.has(sub.farmerId))
    .map(sub => {
      const farmer = (db.farmers || []).find(f => f.id === sub.farmerId);
      const tank = (db.tanks || []).find(t => t.id === sub.tankId);
      const area = farmer ? farmer.location.split(',')[0].trim() : agentLocality;
      return {
        ...sub,
        farmerName: farmer ? farmer.name : sub.farmerId,
        tankName: tank ? tank.name : sub.tankId,
        area,
        month: (sub.date || '2026-08-01').substring(0, 7)
      };
    });

  // Filter Submissions
  const filteredSubmissions = allSubmissions.filter(sub => {
    if (consolidationMode === 'MONTH' && selectedMonth && sub.month !== selectedMonth) return false;
    if (startDate && sub.date < startDate) return false;
    if (endDate && sub.date > endDate) return false;
    if (selectedFarmer !== 'ALL' && sub.farmerId !== selectedFarmer) return false;
    if (selectedTank !== 'ALL' && sub.tankId !== selectedTank) return false;
    return true;
  });

  // Helper CSV Exporter
  const downloadCSV = (filename, headers, rows) => {
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // Export All Filtered Submissions CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Month', 'Locality / Area', 'Farmer Name', 'Pond (Tank)', 'Test Type', 'Status', 'Salinity (ppt)', 'pH', 'DO (mg/L)', 'Biomass', 'FCR'];
    const rows = filteredSubmissions.map(sub => [
      sub.date,
      sub.month,
      sub.area,
      sub.farmerName,
      sub.tankName,
      sub.testType || 'Water Analysis',
      sub.status,
      sub.data?.waterQuality?.salinity || '15',
      sub.data?.waterQuality?.ph || '7.8',
      sub.data?.waterQuality?.do || '5.2',
      sub.data?.biomass || '800kg',
      sub.data?.fcr || '1.2'
    ]);

    let targetName = 'all_locality';
    if (selectedFarmer !== 'ALL') {
      const f = localityFarmers.find(x => x.id === selectedFarmer);
      if (f) targetName = `farmer_${f.name.toLowerCase().replace(/\s+/g, '_')}`;
    }
    if (selectedTank !== 'ALL') {
      const t = availableTanks.find(x => x.id === selectedTank);
      if (t) targetName += `_tank_${t.name.toLowerCase().replace(/\s+/g, '_')}`;
    }

    const filename = `individual_report_${targetName}_${consolidationMode.toLowerCase()}_${Date.now()}.csv`;
    downloadCSV(filename, headers, rows);
  };

  // Export Individual Farmer Report
  const handleExportIndividualFarmer = (farmerId) => {
    const farmer = localityFarmers.find(f => f.id === farmerId);
    if (!farmer) return;

    const farmerSubs = allSubmissions.filter(s => s.farmerId === farmerId);
    const headers = ['Farmer ID', 'Farmer Name', 'Locality', 'Phone', 'Land Acres', 'Date', 'Pond (Tank)', 'Test Type', 'Salinity', 'pH', 'DO', 'Biomass', 'FCR', 'Status'];
    const rows = farmerSubs.map(sub => [
      farmer.id,
      farmer.name,
      farmer.location,
      farmer.phone,
      farmer.acres || '20',
      sub.date,
      sub.tankName,
      sub.testType || 'Water Analysis',
      sub.data?.waterQuality?.salinity || '15',
      sub.data?.waterQuality?.ph || '7.8',
      sub.data?.waterQuality?.do || '5.2',
      sub.data?.biomass || '800kg',
      sub.data?.fcr || '1.2',
      sub.status
    ]);

    const filename = `individual_farmer_${farmer.name.toLowerCase().replace(/\s+/g, '_')}_report_${Date.now()}.csv`;
    downloadCSV(filename, headers, rows);
  };

  // Export Individual Tank Report
  const handleExportIndividualTank = (tankId) => {
    const tank = (db.tanks || []).find(t => t.id === tankId);
    if (!tank) return;

    const farmer = localityFarmers.find(f => f.id === tank.farmerId);
    const tankSubs = allSubmissions.filter(s => s.tankId === tankId);

    const headers = ['Pond ID', 'Pond Name', 'Farmer Name', 'Locality', 'Date', 'Test Type', 'Salinity', 'pH', 'DO', 'ABW', 'Biomass', 'FCR', 'Status'];
    const rows = tankSubs.map(sub => [
      tank.id,
      tank.name,
      farmer ? farmer.name : tank.farmerId,
      farmer ? farmer.location : agentLocality,
      sub.date,
      sub.testType || 'Water Analysis',
      sub.data?.waterQuality?.salinity || '15',
      sub.data?.waterQuality?.ph || '7.8',
      sub.data?.waterQuality?.do || '5.2',
      tank.abw || '15g',
      sub.data?.biomass || tank.biomass || '1000kg',
      sub.data?.fcr || tank.fcr || '1.2',
      sub.status
    ]);

    const filename = `individual_pond_${tank.name.toLowerCase().replace(/\s+/g, '_')}_report_${Date.now()}.csv`;
    downloadCSV(filename, headers, rows);
  };

  // Selected Objects
  const selectedFarmerObj = selectedFarmer !== 'ALL' ? localityFarmers.find(f => f.id === selectedFarmer) : null;
  const selectedTankObj = selectedTank !== 'ALL' ? availableTanks.find(t => t.id === selectedTank) : null;

  return (
    <div style={{ paddingBottom: '30px' }}>
      {/* Page Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.iconCircle}>
            <FileText size={24} color="#2563D9" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={styles.title}>Locality Reports</h2>
              <span style={styles.localityBadge}>
                <MapPin size={12} /> {agentLocality}
              </span>
            </div>
            <div style={styles.subtitle}>Reports for farmers & tanks in {agentLocality} locality</div>
          </div>
        </div>
        <button className="btn-primary" onClick={handleExportCSV} style={styles.topExportBtn}>
          <Download size={16} /> Export {selectedFarmerObj ? `${selectedFarmerObj.name}'s` : agentLocality} CSV
        </button>
      </div>

      {/* Mode Selector Tabs */}
      <div className="card" style={{ padding: '12px', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#17233C', marginBottom: '10px' }}>
          Select Consolidation Type:
        </div>
        <div style={styles.tabContainer}>
          {[
            { id: 'DATE', label: '📅 Date-Wise', desc: 'Daily records' },
            { id: 'MONTH', label: '🗓️ Month-Wise', desc: 'Monthly summary' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setConsolidationMode(tab.id)}
              style={{
                ...styles.modeTab,
                ...(consolidationMode === tab.id ? styles.activeModeTab : {})
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: '700' }}>{tab.label}</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>{tab.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Consolidated Filters Card */}
      <div className="card" style={styles.filterCard}>
        <div style={styles.filterHeader}>
          <Filter size={18} color="#2563D9" />
          <h3 style={styles.filterTitle}>Filters ({agentLocality} Locality)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Date / Month Filter */}
          {consolidationMode === 'MONTH' ? (
            <div className="input-group">
              <label style={styles.label}>Select Month (Month-wise)</label>
              <div className="input-field">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="input-group">
                <label style={styles.label}>Start Date (Date-wise)</label>
                <div className="input-field">
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label style={styles.label}>End Date</label>
                <div className="input-field">
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* 2. Farmer Filter (Locality farmers only) */}
          <div className="input-group">
            <label style={styles.label}>Farmer ({agentLocality})</label>
            <div className="input-field">
              <select
                value={selectedFarmer}
                onChange={e => {
                  setSelectedFarmer(e.target.value);
                  setSelectedTank('ALL');
                }}
              >
                <option value="ALL">👥 All {agentLocality} Farmers</option>
                {localityFarmers.map(f => (
                  <option key={f.id} value={f.id}>👨‍🌾 {f.name} ({f.location})</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Pond / Tank Filter */}
          <div className="input-group">
            <label style={styles.label}>Pond / Tank</label>
            <div className="input-field">
              <select value={selectedTank} onChange={e => setSelectedTank(e.target.value)}>
                <option value="ALL">🌊 All Ponds / Tanks</option>
                {availableTanks.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Individual Quick Export Buttons */}
        {(selectedFarmerObj || selectedTankObj) && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #DCE4EE', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#17233C' }}>Individual Quick Export:</span>
            {selectedFarmerObj && (
              <button
                onClick={() => handleExportIndividualFarmer(selectedFarmerObj.id)}
                style={styles.individualBtn}
              >
                <User size={14} /> Export {selectedFarmerObj.name}'s Report
              </button>
            )}
            {selectedTankObj && (
              <button
                onClick={() => handleExportIndividualTank(selectedTankObj.id)}
                style={styles.individualTankBtn}
              >
                <Droplet size={14} /> Export {selectedTankObj.name} Report
              </button>
            )}
          </div>
        )}
      </div>

      {/* Consolidated Data Table Section */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #DCE4EE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: '#17233C' }}>
            {selectedFarmerObj ? `${selectedFarmerObj.name}'s Individual Report` : `${agentLocality} - ${consolidationMode === 'DATE' ? 'Date-Wise' : 'Month-Wise'} Report Data`}
          </h3>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
            Locality: {agentLocality}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Locality</th>
                <th style={styles.th}>Farmer</th>
                <th style={styles.th}>Pond (Tank)</th>
                <th style={styles.th}>Test Type</th>
                <th style={styles.th}>Salinity</th>
                <th style={styles.th}>FCR</th>
                <th style={styles.th}>Status</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Export Individual</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.length === 0 ? (
                <tr><td colSpan="9" style={styles.emptyTd}>No records found for {agentLocality} locality.</td></tr>
              ) : (
                filteredSubmissions.map((sub, idx) => (
                  <tr key={idx} style={styles.tr}>
                    <td style={styles.td}>{sub.date}</td>
                    <td style={styles.td}>📍 {sub.area}</td>
                    <td style={styles.td}>👨‍🌾 {sub.farmerName}</td>
                    <td style={styles.td}>🌊 {sub.tankName}</td>
                    <td style={styles.td}>{sub.testType || 'Water Analysis'}</td>
                    <td style={styles.td}>{sub.data?.waterQuality?.salinity || '15'} ppt</td>
                    <td style={styles.td}>{sub.data?.fcr || '1.2'}</td>
                    <td style={styles.td}><StatusBadge status={sub.status === 'PENDING_VERIFICATION' ? 'Due' : 'Completed'} /></td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button
                        onClick={() => handleExportIndividualFarmer(sub.farmerId)}
                        title={`Export CSV for ${sub.farmerName}`}
                        style={styles.rowExportBtn}
                      >
                        <Download size={14} /> Export Farmer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Action Box */}
      <div className="card" style={styles.bottomExportCard}>
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#17233C', marginBottom: '4px' }}>
            {selectedFarmerObj ? `Export ${selectedFarmerObj.name}'s Individual Report` : `Export ${agentLocality} Locality Reports`}
          </h4>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            {selectedFarmerObj ? `Download complete test logs for ${selectedFarmerObj.name} in ${agentLocality}` : `Download CSV report containing records strictly for ${agentLocality} locality farmers`}
          </p>
        </div>
        <button className="btn-primary" onClick={handleExportCSV} style={styles.exportBtn}>
          <Download size={18} /> Export {selectedFarmerObj ? `${selectedFarmerObj.name} CSV` : `${agentLocality} CSV`}
        </button>
      </div>
    </div>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  iconCircle: { width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#EAF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: '20px', fontWeight: '700', color: '#17233C', marginBottom: '2px' },
  localityBadge: { backgroundColor: '#EAF3FF', color: '#2563D9', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  subtitle: { fontSize: '13px', color: '#64748B' },
  topExportBtn: { width: 'auto', padding: '10px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' },

  tabContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' },
  modeTab: { padding: '10px 8px', borderRadius: '8px', border: '1px solid #DCE4EE', backgroundColor: '#FFFFFF', color: '#64748B', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  activeModeTab: { backgroundColor: '#0018AD', color: '#FFFFFF', borderColor: '#0018AD' },

  filterCard: { padding: '16px', marginBottom: '20px' },
  filterHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
  filterTitle: { fontSize: '15px', fontWeight: '700', color: '#17233C', margin: 0 },
  label: { fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '4px', display: 'block' },

  individualBtn: { padding: '6px 12px', borderRadius: '6px', backgroundColor: '#EDF0FF', color: '#0018AD', border: '1px solid #0018AD', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  individualTankBtn: { padding: '6px 12px', borderRadius: '6px', backgroundColor: '#EDF0FF', color: '#0018AD', border: '1px solid #0018AD', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' },

  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' },
  thead: { backgroundColor: '#F8FAFC', borderBottom: '1px solid #DCE4EE' },
  th: { padding: '12px 16px', fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #DCE4EE' },
  td: { padding: '12px 16px', color: '#17233C', whiteSpace: 'nowrap' },
  rowExportBtn: { padding: '4px 10px', borderRadius: '6px', border: '1px solid #0018AD', backgroundColor: '#FFFFFF', color: '#0018AD', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  emptyTd: { padding: '30px', textAlign: 'center', color: '#64748B' },
  bottomExportCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#FFFFFF', border: '1px solid #DCE4EE', flexWrap: 'wrap', gap: '16px' },
  exportBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '14px', fontWeight: '700', width: 'auto', backgroundColor: '#0018AD', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};

export default Reports;
