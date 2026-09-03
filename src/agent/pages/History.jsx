import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Lock, Droplets, Fish, Wheat, Skull, ClipboardList, 
  Camera, MapPin, CheckCircle, Clock, Search, X, Scale,
  Pill, Activity
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';

const History = () => {
  const session = getSession();
  const { db } = useMockData();

  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Retrieve harvest store records to merge with submissions
  const harvestStore = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
  const harvestSubmissions = [];
  Object.entries(harvestStore).forEach(([key, tStore]) => {
    const [fId, tId] = key.split('_');
    const farmer = (db?.farmers || []).find(f => f.id === fId);
    const tank = (db?.tanks || []).find(t => t.id === tId);

    // Sort harvests chronologically for consistent sequence numbering
    const sortedTankHarvests = [...(tStore?.harvests || [])].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    let partialSeq = 0;

    sortedTankHarvests.forEach(h => {
      const existsInDb = (db?.submissions || []).some(s => s.id === h.id || (s.tankId === tId && s.date === h.date && (s.testType === h.harvestType || s.testType === h.displayTitle)));
      if (!existsInDb) {
        const isFinal = Boolean(h.isFinal || h.harvestType === 'Final Harvest' || (h.displayTitle && h.displayTitle.includes('Final')));
        let hType = 'Final Harvest';
        if (!isFinal) {
          partialSeq += 1;
          hType = `Partial Harvest - ${partialSeq}`;
        }

        harvestSubmissions.push({
          id: h.id || `H-${Date.now()}-${Math.random()}`,
          agentId: session?.agentId || 'agent001',
          farmerId: fId,
          farmerName: farmer?.name || 'Ravi',
          tankId: tId,
          tankName: tank?.name || 'Tank 1',
          testType: hType,
          recordType: 'HARVEST_ENTRY',
          date: h.date || '28 Aug',
          time: '10:00 AM',
          data: {
            harvestType: hType,
            isFinal,
            doc: h.doc,
            abw: h.abw,
            harvestedNumber: h.harvestedNumber,
            harvestedBiomass: h.harvestedBiomass,
            remarks: h.remarks,
          },
          readOnly: true,
        });
      }
    });
  });

  const allSubmissions = [...(db?.submissions || []), ...harvestSubmissions];
  const submissions = allSubmissions
    .filter(s => !s.agentId || !session?.agentId || s.agentId === session.agentId)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const filterOptions = [
    { id: 'ALL', label: 'All' },
    { id: 'WATER', label: 'Water' },
    { id: 'FEED', label: 'Feed' },
    { id: 'DISEASE', label: 'Disease' },
    { id: 'MEDICATION', label: 'Medication' },
    { id: 'MORTALITY', label: 'Mortality' },
    { id: 'HARVEST', label: 'Harvest' },
    { id: 'ACTIVITY', label: 'Activity' },
    { id: 'PHOTO', label: 'Photo' },
  ];

  // Helper to get Farmer Name (removes farmerId like F002)
  const getFarmerName = (record) => {
    if (record?.farmerName && !record.farmerName.startsWith('F00') && !record.farmerName.startsWith('FAR-')) {
      return record.farmerName;
    }
    const farmer = (db?.farmers || []).find(f => f.id === record?.farmerId);
    if (farmer?.name) return farmer.name;
    const farmerMap = {
      'F001': 'Ravi',
      'F002': 'Ravi',
      'F003': 'Nagesh',
      'F004': 'Venkatesh',
      'F005': 'Balaiah',
      'F006': 'Siva',
      'F007': 'K. Prasad',
      'F008': 'Ch. Babu',
      'F009': 'M. Naidu',
    };
    return farmerMap[record?.farmerId] || record?.farmerName || 'Ravi';
  };

  // Helper to get Tank Number (removes tankId like T003 -> Tank 3)
  const getTankName = (record) => {
    if (record?.tankName && !record.tankName.startsWith('T00') && !record.tankName.startsWith('tank-0')) {
      return record.tankName;
    }
    const tank = (db?.tanks || []).find(t => t.id === record?.tankId);
    if (tank?.name) return tank.name;
    if (record?.tankId) {
      const num = record.tankId.replace(/\D/g, '');
      if (num) return `Tank ${parseInt(num, 10)}`;
    }
    return 'Tank 1';
  };

  // Helper to format record display name with sequential partial harvest numbers
  const getRecordDisplayName = (record) => {
    const rawType = record.testType || record.recordType || 'Water Analysis';
    const upper = rawType.toUpperCase();
    if (upper.includes('HARVEST') || upper.includes('PARTIAL') || upper.includes('FINAL')) {
      if (record.data?.isFinal || upper === 'FINAL HARVEST' || upper.includes('FINAL')) {
        return 'Final Harvest';
      }
      const match = rawType.match(/Partial Harvest\s*[-–]?\s*(\d+)/i);
      if (match) {
        return `Partial Harvest - ${match[1]}`;
      }
      const sameTankHarvests = submissions
        .filter(s => (s.tankId === record.tankId || s.tankName === record.tankName) && 
          ((s.testType || s.recordType || '').toUpperCase().includes('HARVEST') || (s.testType || s.recordType || '').toUpperCase().includes('PARTIAL')))
        .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
      
      const partialsOnly = sameTankHarvests.filter(s => {
        const t = (s.testType || s.recordType || '').toUpperCase();
        return !s.data?.isFinal && !t.includes('FINAL');
      });
      const idx = partialsOnly.findIndex(s => s.id === record.id);
      if (idx >= 0) {
        return `Partial Harvest - ${idx + 1}`;
      }
      return 'Partial Harvest - 1';
    }
    if (upper.includes('DISEASE')) return 'Disease Observation';
    if (upper.includes('MEDICAT') || upper.includes('MEDICINE')) return 'Medication';
    return rawType;
  };

  const filteredSubmissions = submissions.filter(item => {
    const type = (item.testType || item.recordType || '').toUpperCase();
    if (activeFilter === 'WATER' && !type.includes('WATER')) return false;
    if (activeFilter === 'FEED' && !type.includes('FEED')) return false;
    if (activeFilter === 'DISEASE' && !type.includes('DISEASE')) return false;
    if (activeFilter === 'MEDICATION' && !type.includes('MEDICAT') && !type.includes('MEDICINE')) return false;
    if (activeFilter === 'MORTALITY' && !type.includes('MORTALITY')) return false;
    if (activeFilter === 'HARVEST' && !type.includes('HARVEST') && !type.includes('PARTIAL') && !type.includes('FINAL')) return false;
    if (activeFilter === 'ACTIVITY' && !type.includes('ACTIVITY') && !type.includes('FARM')) return false;
    if (activeFilter === 'PHOTO' && (!type.includes('PHOTO') || type.includes('DISEASE'))) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const farmer = getFarmerName(item).toLowerCase();
      const tank = getTankName(item).toLowerCase();
      return farmer.includes(q) || tank.includes(q);
    }
    return true;
  });

  const getRecordIcon = (type = '') => {
    const t = type.toUpperCase();
    if (t.includes('WATER')) return <Droplets size={18} color="#0018AD" />;
    if (t.includes('FEED')) return <Wheat size={18} color="#D97706" />;
    if (t.includes('DISEASE')) return <Activity size={18} color="#DC2626" />;
    if (t.includes('MEDICAT') || t.includes('MEDICINE')) return <Pill size={18} color="#0284C7" />;
    if (t.includes('MORTALITY')) return <Skull size={18} color="#DC2626" />;
    if (t.includes('HARVEST') || t.includes('PARTIAL') || t.includes('FINAL')) return <Scale size={18} color="#15803D" />;
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
          placeholder="Search farmer or tank..."
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
                    {getRecordDisplayName(record)}
                  </span>
                  <span style={styles.recordTarget}>
                    {getFarmerName(record)} • {getTankName(record)}
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
      {selectedRecord && createPortal(
        <div 
          className="animate-backdrop-in"
          style={styles.modalOverlay} 
          onClick={() => setSelectedRecord(null)}
        >
          <div 
            className="animate-modal-in"
            style={styles.modalCard} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderLeft}>
                <div style={styles.headerIconCircle}>
                  {getRecordIcon(selectedRecord.testType || selectedRecord.recordType)}
                </div>
                <div>
                  <div style={styles.lockBadge}>
                    <Lock size={10} strokeWidth={2.4} /> SUBMITTED RECORD • READ ONLY
                  </div>
                  <h3 style={styles.modalTitle}>
                    {getRecordDisplayName(selectedRecord)}
                  </h3>
                </div>
              </div>
              <button 
                type="button"
                style={styles.modalCloseBtn} 
                onClick={() => setSelectedRecord(null)}
                aria-label="Close"
              >
                <X size={18} strokeWidth={2.4} />
              </button>
            </div>

            {/* Body */}
            <div style={styles.modalBody}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Farmer</span>
                <span style={styles.detailValue}>{getFarmerName(selectedRecord)}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Tank Number</span>
                <span style={styles.detailValue}>{getTankName(selectedRecord)}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Timestamp</span>
                <span style={styles.detailValue}>{selectedRecord.date || 'Today'} • {selectedRecord.time || '10:30 AM'}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>GPS Locality</span>
                <span style={{ ...styles.detailValue, color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} /> {selectedRecord.gps?.locality || 'Bhimavaram, AP'} (±{selectedRecord.gps?.accuracy || 8}m)
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Record ID</span>
                <span style={{ ...styles.detailValue, fontFamily: 'monospace', color: '#1A2FB8', letterSpacing: '0.5px' }}>
                  {selectedRecord.id || 'WQ-2026-00128'}
                </span>
              </div>

              {selectedRecord.data && (
                <div style={styles.dataBox}>
                  <div style={styles.dataBoxTitle}>Recorded Parameters</div>
                  <div style={styles.paramGrid}>
                    {Object.entries(selectedRecord.data).map(([key, val]) => (
                      typeof val === 'object' ? null : (
                        <div key={key} style={styles.paramRow}>
                          <span style={styles.paramKey}>{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span style={styles.paramVal}>{String(val)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={styles.modalFooter}>
              <button 
                type="button"
                className="transition-all duration-150 active:scale-98 cursor-pointer"
                style={styles.closeModalBtn} 
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
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
    width: '100vw',
    height: '100vh',
    height: '100dvh',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
    padding: '16px',
    boxSizing: 'border-box',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '440px',
    maxHeight: 'calc(100vh - 32px)',
    maxHeight: 'calc(100dvh - 32px)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    position: 'relative',
    margin: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    flexShrink: 0,
  },
  modalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerIconCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#EDF0FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lockBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '9.5px',
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#E2E8F0',
    padding: '2px 6px',
    borderRadius: '4px',
    marginBottom: '2px',
    letterSpacing: '0.3px',
  },
  modalTitle: {
    fontSize: '15.5px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },
  modalCloseBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalBody: {
    padding: '16px 18px',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '8px',
    borderBottom: '1px solid #F1F5F9',
  },
  detailLabel: {
    fontSize: '12.5px',
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  dataBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    padding: '12px 14px',
    border: '1px solid #E2E8F0',
    marginTop: '4px',
  },
  dataBoxTitle: {
    fontSize: '10.5px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginBottom: '8px',
  },
  paramGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  paramRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12.5px',
    padding: '2px 0',
  },
  paramKey: {
    color: '#64748B',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  paramVal: {
    fontWeight: '700',
    color: '#0F172A',
  },
  modalFooter: {
    padding: '12px 18px',
    borderTop: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    flexShrink: 0,
  },
  closeModalBtn: {
    width: '100%',
    height: '42px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(26, 47, 184, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default History;
