import React, { useState } from 'react';
import { 
  Lock, Droplets, Fish, Wheat, Skull, ClipboardList, 
  Camera, MapPin, CheckCircle, Clock, Search, X 
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';

const History = () => {
  const session = getSession();
  const { db } = useMockData();

  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const submissions = (db?.submissions || [])
    .filter(s => !s.agentId || !session?.agentId || s.agentId === session.agentId)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const filterOptions = [
    { id: 'ALL', label: 'All' },
    { id: 'WATER', label: 'Water' },
    { id: 'FEED', label: 'Feed' },
    { id: 'BIOMASS', label: 'Biomass' },
    { id: 'MORTALITY', label: 'Mortality' },
    { id: 'ACTIVITY', label: 'Activity' },
    { id: 'PHOTO', label: 'Photo' },
  ];

  const filteredSubmissions = submissions.filter(item => {
    const type = (item.testType || item.recordType || '').toUpperCase();
    if (activeFilter === 'WATER' && !type.includes('WATER')) return false;
    if (activeFilter === 'BIOMASS' && !type.includes('BIOMASS')) return false;
    if (activeFilter === 'FEED' && !type.includes('FEED')) return false;
    if (activeFilter === 'MORTALITY' && !type.includes('MORTALITY')) return false;
    if (activeFilter === 'ACTIVITY' && !type.includes('ACTIVITY') && !type.includes('FARM')) return false;
    if (activeFilter === 'PHOTO' && !type.includes('PHOTO') && !type.includes('OBSERVATION')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const farmer = (item.farmerName || item.farmerId || '').toLowerCase();
      const tank = (item.tankName || item.tankId || '').toLowerCase();
      return farmer.includes(q) || tank.includes(q);
    }
    return true;
  });

  const getRecordIcon = (type = '') => {
    const t = type.toUpperCase();
    if (t.includes('WATER')) return <Droplets size={18} color="#0018AD" />;
    if (t.includes('BIOMASS')) return <Fish size={18} color="#2563D9" />;
    if (t.includes('FEED')) return <Wheat size={18} color="#D97706" />;
    if (t.includes('MORTALITY')) return <Skull size={18} color="#DC2626" />;
    if (t.includes('PHOTO')) return <Camera size={18} color="#059669" />;
    return <ClipboardList size={18} color="#7C3AED" />;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <span style={styles.headerTag}>RECORDS AUDIT</span>
          <h1 style={styles.headerTitle}>History</h1>
        </div>
        <span style={styles.readOnlyPill}>
          <Lock size={10} /> Read Only
        </span>
      </div>

      {/* Search Bar */}
      <div style={styles.searchBox}>
        <Search size={15} color="#64748B" />
        <input
          type="text"
          placeholder="Search farmer or pond..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        {searchQuery && (
          <button style={styles.clearBtn} onClick={() => setSearchQuery('')}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={styles.filterTabs}>
        {filterOptions.map((f) => (
          <button
            key={f.id}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeFilter === f.id ? '#0018AD' : '#FFFFFF',
              color: activeFilter === f.id ? '#FFFFFF' : '#64748B',
              borderColor: activeFilter === f.id ? '#0018AD' : '#CBD5E1',
            }}
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Records List */}
      <div style={styles.recordsList}>
        {filteredSubmissions.length === 0 ? (
          <div style={styles.emptyState}>
            <Clock size={28} color="#94A3B8" style={{ marginBottom: '6px' }} />
            <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '13px' }}>No submitted records</div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              Records you submit will appear here in read-only mode.
            </div>
          </div>
        ) : (
          filteredSubmissions.map((record) => (
            <div
              key={record.id}
              style={styles.recordCard}
              onClick={() => setSelectedRecord(record)}
            >
              <div style={styles.recordLeft}>
                <div style={styles.iconContainer}>
                  {getRecordIcon(record.testType || record.recordType)}
                </div>
                <div style={styles.recordTextGroup}>
                  <span style={styles.recordTitle}>
                    {record.testType || record.recordType || 'Water Analysis'}
                  </span>
                  <span style={styles.recordTarget}>
                    {record.farmerName || record.farmerId || 'Farmer'} • {record.tankName || record.tankId || 'Pond 01'}
                  </span>
                </div>
              </div>

              <div style={styles.recordRight}>
                <span style={styles.recordTime}>
                  {record.date || '27 Aug'} • {record.time || '10:32 AM'}
                </span>
                <span style={styles.submittedStatus}>
                  ✓ Submitted
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Read-Only Record Detail Modal */}
      {selectedRecord && (
        <div style={styles.modalOverlay} onClick={() => setSelectedRecord(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.lockBadge}>
                  <Lock size={11} /> SUBMITTED RECORD • READ ONLY
                </div>
                <h3 style={styles.modalTitle}>
                  {selectedRecord.testType || selectedRecord.recordType || 'Water Quality'}
                </h3>
              </div>
              <button style={styles.modalCloseBtn} onClick={() => setSelectedRecord(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Farmer</span>
                <span style={styles.detailValue}>{selectedRecord.farmerName || selectedRecord.farmerId}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Pond</span>
                <span style={styles.detailValue}>{selectedRecord.tankName || selectedRecord.tankId}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Timestamp</span>
                <span style={styles.detailValue}>{selectedRecord.date} • {selectedRecord.time}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>GPS Locality</span>
                <span style={{ ...styles.detailValue, color: '#16A34A', fontWeight: '700' }}>
                  ✓ {selectedRecord.gps?.locality || 'Bhimavaram, AP'} (±{selectedRecord.gps?.accuracy || 8}m)
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Record ID</span>
                <span style={styles.detailValue}>{selectedRecord.id || 'WQ-2026-00128'}</span>
              </div>

              {selectedRecord.data && (
                <div style={styles.dataBox}>
                  <div style={styles.dataBoxTitle}>Recorded Parameters</div>
                  {Object.entries(selectedRecord.data).map(([key, val]) => (
                    typeof val === 'object' ? null : (
                      <div key={key} style={styles.paramRow}>
                        <span style={styles.paramKey}>{key}:</span>
                        <span style={styles.paramVal}>{String(val)}</span>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.closeModalBtn} onClick={() => setSelectedRecord(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingBottom: '24px',
    maxWidth: '480px',
    margin: '0 auto',
    width: '100%',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '4px',
  },
  headerTag: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.4px',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0F172A',
    margin: '1px 0 0 0',
  },
  readOnlyPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '9px 12px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    fontSize: '13px',
    color: '#0F172A',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
  },
  filterTabs: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
  },
  tabBtn: {
    padding: '6px 12px',
    borderRadius: '14px',
    border: '1px solid',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  recordsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '12px 14px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  recordLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconContainer: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#EDF0FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recordTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  recordTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  recordTarget: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '500',
  },
  recordRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '3px',
  },
  recordTime: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '500',
  },
  submittedStatus: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#16A34A',
  },
  emptyState: {
    padding: '30px 16px',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px dashed #CBD5E1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '16px',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '420px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  lockBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#E2E8F0',
    padding: '2px 6px',
    borderRadius: '4px',
    marginBottom: '3px',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    padding: '4px',
  },
  modalBody: {
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '6px',
    borderBottom: '1px solid #F1F5F9',
  },
  detailLabel: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  dataBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    padding: '10px 12px',
    border: '1px solid #E2E8F0',
    marginTop: '4px',
  },
  dataBoxTitle: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: '6px',
  },
  paramRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    padding: '2px 0',
  },
  paramKey: {
    color: '#64748B',
    textTransform: 'capitalize',
  },
  paramVal: {
    fontWeight: '700',
    color: '#0F172A',
  },
  modalFooter: {
    padding: '12px 16px',
    borderTop: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  closeModalBtn: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#0018AD',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

export default History;
