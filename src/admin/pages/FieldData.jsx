import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useMockData } from '../../context/MockDataContext';
import {
  getTankById, calculateBiomass, calculateFCR, getAgentById,
  getIncharges, getAgents, getFarmers, getTanks
} from '../utils/adminMockData';
import { Search, Filter, Calendar, FileText, CheckCircle2, Clock, User, Users, UserCircle, Droplet } from 'lucide-react';

const FieldData = () => {
  const mockData = useMockData();
  const db = mockData?.db;
  const submissions = db?.submissions || [];
  const location = useLocation();

  const incharges = getIncharges();
  const allAgents = getAgents();
  const allFarmers = getFarmers();
  const allTanks = getTanks();

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
    return incharges.map(i => i.name.split(' (')[0]);
  }, [incharges]);

  const availableAgents = useMemo(() => {
    let filtered = allAgents;
    if (filters.incharge) filtered = filtered.filter(a => a.incharge === filters.incharge);
    return filtered.map(a => a.name.split(' (')[0]);
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

  // Re-inject dummy logic if a specific agent is selected
  const selectedAgentObj = allAgents.find(a => a.name.split(' (')[0] === filters.agent);
  if (selectedAgentObj && selectedAgentObj.tests) {
    const expectedTests = selectedAgentObj.tests;
    const currentCompleted = filteredSubmissions.filter(s => s.status === 'COMPLETED').length;

    if (currentCompleted < expectedTests) {
      const needed = expectedTests - currentCompleted;
      const testTypes = ['Water Analysis', 'Feed Test', 'Medication', 'Disease Observation'];
      const farmerNames = ['Ashok', 'Ravi', 'Kumar', 'Siva', 'Ganesh'];
      const formattedAgentId = `agent${selectedAgentObj.id.split('-').pop().padStart(3, '0')}`;

      for (let i = 0; i < needed; i++) {
        const dummySub = {
          id: `SUB-GEN-${selectedAgentObj.id.split('-').pop()}-${i}`,
          agentId: formattedAgentId,
          farmerId: filters.farmer || farmerNames[i % 5],
          tankId: filters.tank || `Tank ${(i % 10) + 1}`,
          testType: testTypes[i % testTypes.length],
          date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          status: 'COMPLETED',
          submittedAgo: `${(i % 24) + 1} hours ago`,
          data: {
            abw: `${(10 + (i % 15))}g`,
            waterQuality: { salinity: '15', ph: '7.8', do: '5.2', waterColor: 'Greenish' },
            biomass: `${1000 + (i * 50)}`,
            fcr: (1.1 + (i % 10) * 0.05).toFixed(2)
          }
        };

        filteredSubmissions.push(dummySub);
      }
    }
  }

  filteredSubmissions.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Field Data &amp; Daily Records</h1>
          <p style={styles.subtitle}>Audit trail of field tests, daily water quality logs, and feed measurements.</p>
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

            {/* Tank Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Tank</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px' }}>
                <Droplet size={15} color="#94a3b8" />
                <select style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: '#1e293b' }} value={filters.tank} onChange={(e) => handleFilterChange('tank', e.target.value)}>
                  <option value="">All Tanks</option>
                  {availableTanks.map(t => <option key={t} value={t}>{t}</option>)}
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
                <th style={styles.th}>Date &amp; Time</th>
                <th style={styles.th}>Tank ID</th>
                <th style={styles.th}>Farmer</th>
                <th style={styles.th}>Agent</th>
                <th style={styles.th}>Test Type</th>
                <th style={styles.th}>Water pH / Salinity</th>
                <th style={styles.th}>Biomass / FCR</th>
                <th style={styles.th}>Status</th>
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

                  // Extract feed if available, otherwise estimate from old FCR to calculate dynamically
                  const feedStr = item.data?.cumulativeFeed || item.data?.feed || tank.feed;
                  let cumulativeFeed = parseFloat(feedStr);
                  if (isNaN(cumulativeFeed)) {
                    cumulativeFeed = dynamicBiomass * parseFloat(item.data?.fcr || 1.2);
                  }
                  const dynamicFcr = calculateFCR(cumulativeFeed, dynamicBiomass);

                  const farmerObj = (db?.farmers || []).find(f => f.id === item.farmerId || f.name === item.farmerId) || allFarmers.find(f => f.id === item.farmerId || f.name === item.farmerId) || {};
                  const farmerNameToDisplay = farmerObj.name || item.farmerId;

                  return (
                    <tr key={item.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 700, color: '#1d4ed8' }}>{item.id}</td>
                      <td style={styles.td}>{item.date} <span style={{ color: '#94a3b8', fontSize: '11px' }}>({item.submittedAgo})</span></td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{tank.name || item.tankId}</td>
                      <td style={styles.td}>{farmerNameToDisplay}</td>
                      <td style={styles.td}>{item.agentId}</td>
                      <td style={styles.td}>
                        <span style={styles.typeBadge}>{item.testType}</span>
                      </td>
                      <td style={styles.td}>
                        pH: {item.data?.waterQuality?.ph || '7.8'} | {item.data?.waterQuality?.salinity || '15'} ppt
                      </td>
                      <td style={styles.td}>
                        {dynamicBiomass.toLocaleString()} kg (FCR: {dynamicFcr})
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: item.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7',
                          color: item.status === 'COMPLETED' ? '#15803d' : '#b45309'
                        }}>
                          {item.status === 'COMPLETED' ? 'Verified' : 'Pending Verification'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                    No field data records found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
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
