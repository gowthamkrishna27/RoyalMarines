import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMockData } from '../../context/MockDataContext';
import { getTankById, calculateBiomass, calculateFCR, getAgentById } from '../utils/adminMockData';
import { Search, Filter, Calendar, FileText, CheckCircle2, Clock } from 'lucide-react';

const FieldData = () => {
  const mockData = useMockData();
  const db = mockData?.db;
  const submissions = db?.submissions || [];
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(location.state?.searchTerm || '');

  let filteredSubmissions = submissions.filter(sub => {
    return sub.tankId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.farmerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.testType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.agentId?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const targetAgent = getAgentById(searchTerm.toUpperCase());
  if (targetAgent && targetAgent.tests) {
    const expectedTests = targetAgent.tests;
    const currentCompleted = filteredSubmissions.filter(s => s.status === 'COMPLETED').length;
    
    if (currentCompleted < expectedTests) {
      const needed = expectedTests - currentCompleted;
      const testTypes = ['Water Analysis', 'Feed Test', 'Medication', 'Disease Observation'];
      const farmerNames = ['Ashok', 'Ravi', 'Kumar', 'Siva', 'Ganesh'];
      const formattedAgentId = `agent${targetAgent.id.split('-').pop().padStart(3, '0')}`;
      
      for (let i = 0; i < needed; i++) {
        const dummySub = {
          id: `SUB-GEN-${targetAgent.id.split('-').pop()}-${i}`,
          agentId: formattedAgentId,
          farmerId: farmerNames[i % 5],
          tankId: `Tank ${(i % 10) + 1}`,
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
    
    filteredSubmissions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

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
          <div style={styles.searchBox}>
            <Search size={17} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by Tank, Farmer ID, or Test Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
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

                  return (
                    <tr key={item.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 700, color: '#1d4ed8' }}>{item.id}</td>
                      <td style={styles.td}>{item.date} <span style={{ color: '#94a3b8', fontSize: '11px' }}>({item.submittedAgo})</span></td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{tank.name || item.tankId}</td>
                      <td style={styles.td}>{item.farmerId}</td>
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
