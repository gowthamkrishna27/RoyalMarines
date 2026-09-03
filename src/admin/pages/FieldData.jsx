import React, { useState } from 'react';
import { useMockData } from '../../context/MockDataContext';
import { Search, Filter, Calendar, FileText, CheckCircle2, Clock } from 'lucide-react';

const FieldData = () => {
  const mockData = useMockData();
  const db = mockData?.db;
  const submissions = db?.submissions || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      sub.tankId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.farmerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.testType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'ALL') return matchesSearch;
    return matchesSearch && sub.status === filterType;
  });

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

          <div style={styles.filterPills}>
            {['ALL', 'PENDING_VERIFICATION', 'COMPLETED'].map((type) => (
              <button
                key={type}
                style={{
                  ...styles.pillBtn,
                  ...(filterType === type ? styles.activePill : {})
                }}
                onClick={() => setFilterType(type)}
              >
                {type === 'ALL' ? 'All Records' : type === 'PENDING_VERIFICATION' ? 'Pending Review' : 'Verified'}
              </button>
            ))}
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
                filteredSubmissions.map((item) => (
                  <tr key={item.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: 700, color: '#1d4ed8' }}>{item.id}</td>
                    <td style={styles.td}>{item.date} <span style={{ color: '#94a3b8', fontSize: '11px' }}>({item.submittedAgo})</span></td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{item.tankId}</td>
                    <td style={styles.td}>{item.farmerId}</td>
                    <td style={styles.td}>{item.agentId}</td>
                    <td style={styles.td}>
                      <span style={styles.typeBadge}>{item.testType}</span>
                    </td>
                    <td style={styles.td}>
                      pH: {item.data?.waterQuality?.ph || '7.8'} | {item.data?.waterQuality?.salinity || '15'} ppt
                    </td>
                    <td style={styles.td}>
                      {item.data?.biomass || '1200kg'} (FCR: {item.data?.fcr || '1.2'})
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
                ))
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
    gap: '20px',
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
    fontWeight: 800,
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
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f8fafc',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '8px 14px',
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
  filterPills: {
    display: 'flex',
    gap: '8px'
  },
  pillBtn: {
    padding: '6px 14px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#64748b',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  activePill: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
    color: '#ffffff'
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
    padding: '12px 14px',
    fontSize: '12px',
    fontWeight: 700,
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
    padding: '14px',
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
