import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Droplets, Fish, Wheat, Skull, 
  ClipboardList, Camera, Clock, Lock, X 
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import QuickRecordModal from '../components/QuickRecordModal';

const TankDetails = () => {
  const { tankId } = useParams();
  const navigate = useNavigate();
  const { getTankById, getFarmerById, db } = useMockData();

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedReadRecord, setSelectedReadRecord] = useState(null);

  const tank = getTankById(tankId) || db?.tanks?.find(t => t.id === tankId);
  const farmer = tank ? (getFarmerById(tank.farmerId) || db?.farmers?.find(f => f.id === tank.farmerId)) : null;

  const pondSubmissions = (db?.submissions || [])
    .filter(s => s.tankId === tankId || s.tankName === tank?.name)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  if (!tank) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <p>Pond not found.</p>
          <button style={styles.backBtn} onClick={() => navigate('/farmers')}>
            ← Back to Farmers
          </button>
        </div>
      </div>
    );
  }

  const stockingDate = tank.stockingDate || '2026-06-12';
  const cultureDays = Math.floor((new Date() - new Date(stockingDate)) / (1000 * 60 * 60 * 24)) || 76;

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
      {/* 1. Top Bar: Back Link on Left, One Compact New Record Button on Right */}
      <div style={styles.topBar}>
        <button 
          style={styles.backLink}
          onClick={() => farmer ? navigate(`/farmers/${farmer.id}`) : navigate('/farmers')}
          aria-label="Go back"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <button 
          style={styles.newRecordBtn}
          onClick={() => setIsRecordModalOpen(true)}
          aria-label="New Record"
        >
          <Plus size={15} strokeWidth={2.6} /> New Record
        </button>
      </div>

      {/* 2. Tank Header Card */}
      <div style={styles.tankCard}>
        <div style={styles.tankHeaderRow}>
          <h1 style={styles.tankTitle}>{tank.name || 'Tank 3'}</h1>
          <span style={styles.activeBadge}>Active</span>
        </div>

        <div style={styles.farmerSubText}>
          Farmer: <span style={styles.farmerNameText}>{farmer?.name || 'Ravi'}</span>
        </div>

        <div style={styles.divider} />

        <div style={styles.specsGrid}>
          <div style={styles.specItem}>
            <span style={styles.specLabel}>Species</span>
            <span style={styles.specValue}>{tank.species || 'Vannamei'}</span>
          </div>

          <div style={styles.specItem}>
            <span style={styles.specLabel}>Pond Area</span>
            <span style={styles.specValue}>{tank.size || tank.area || '2.5'} Acres</span>
          </div>

          <div style={styles.specItem}>
            <span style={styles.specLabel}>Culture Days</span>
            <span style={{ ...styles.specValue, color: '#0018AD' }}>{cultureDays} Days</span>
          </div>

          <div style={styles.specItem}>
            <span style={styles.specLabel}>Stocking Date</span>
            <span style={styles.specValue}>{stockingDate}</span>
          </div>
        </div>
      </div>

      {/* 3. Recent Records Section */}
      <div style={styles.recordsSection}>
        <div style={styles.recordsHeaderRow}>
          <span style={styles.sectionTitle}>RECENT RECORDS</span>
          <span style={styles.recordsCount}>{pondSubmissions.length} Submitted</span>
        </div>

        <div style={styles.recordsList}>
          {pondSubmissions.length === 0 ? (
            <div style={styles.emptyRecordsBox}>
              <Clock size={24} color="#94A3B8" style={{ marginBottom: '6px' }} />
              <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '13px' }}>No field records yet</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                Tap "New Record" above to record field data for this pond.
              </div>
            </div>
          ) : (
            pondSubmissions.map((record) => (
              <div 
                key={record.id} 
                className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 cursor-pointer active:scale-99"
                style={styles.recordCard}
                onClick={() => setSelectedReadRecord(record)}
                title="Click to view submitted record details"
              >
                <div style={styles.recordLeft}>
                  <div style={styles.iconSquare}>
                    {getRecordIcon(record.testType || record.recordType)}
                  </div>
                  <div style={styles.recordInfo}>
                    <span style={styles.recordName}>
                      {record.testType || record.recordType || 'Water Analysis'}
                    </span>
                    <span style={styles.recordTimestamp}>
                      {record.date || '2026-08-26'} • {record.time || '10:32 AM'}
                    </span>
                  </div>
                </div>

                <div style={styles.recordRight}>
                  <span style={styles.submittedBadge}>
                    ✓ Submitted
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Read-Only Record Modal */}
      {selectedReadRecord && (
        <div className="animate-backdrop-in" style={styles.modalOverlay} onClick={() => setSelectedReadRecord(null)}>
          <div className="animate-modal-in" style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.lockPill}>
                  <Lock size={10} /> SUBMITTED RECORD • READ ONLY
                </div>
                <h3 style={styles.modalHeading}>
                  {selectedReadRecord.testType || selectedReadRecord.recordType || 'Water Quality'}
                </h3>
              </div>
              <button style={styles.modalCloseBtn} onClick={() => setSelectedReadRecord(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Pond</span>
                <span style={styles.modalValue}>{tank.name}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Farmer</span>
                <span style={styles.modalValue}>{farmer?.name || 'Ravi'}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Timestamp</span>
                <span style={styles.modalValue}>{selectedReadRecord.date} • {selectedReadRecord.time}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>GPS Accuracy</span>
                <span style={{ ...styles.modalValue, color: '#16A34A' }}>
                  ✓ {selectedReadRecord.gps?.locality || 'Bhimavaram, AP'} (±{selectedReadRecord.gps?.accuracy || 8}m)
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Record ID</span>
                <span style={styles.modalValue}>{selectedReadRecord.id || 'WQ-2026-00128'}</span>
              </div>

              {selectedReadRecord.data && (
                <div style={styles.dataContainer}>
                  <div style={styles.dataTitle}>Recorded Parameters</div>
                  {Object.entries(selectedReadRecord.data).map(([k, v]) => (
                    typeof v === 'object' ? null : (
                      <div key={k} style={styles.dataRow}>
                        <span style={styles.dataKey}>{k}:</span>
                        <span style={styles.dataVal}>{String(v)}</span>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.closeBtn} onClick={() => setSelectedReadRecord(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Record Action Modal */}
      <QuickRecordModal 
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        preselectedFarmerId={farmer?.id}
        preselectedTankId={tank.id}
      />
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
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#0F172A',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    padding: 0,
  },
  newRecordBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#0018AD',
    color: '#FFFFFF',
    border: 'none',
    width: '130px',
    height: '38px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 24, 173, 0.25)',
  },
  tankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  tankHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tankTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
    lineHeight: 1.2,
  },
  activeBadge: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    padding: '3px 10px',
    borderRadius: '6px',
  },
  farmerSubText: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '4px',
  },
  farmerNameText: {
    color: '#0F172A',
    fontWeight: '600',
  },
  divider: {
    height: '1px',
    backgroundColor: '#F1F5F9',
    margin: '18px 0',
  },
  specsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px 20px',
  },
  specItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  specLabel: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '500',
  },
  specValue: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
  },
  recordsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  recordsHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 2px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.5px',
  },
  recordsCount: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '500',
  },
  recordsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '14px 18px',
    minHeight: '68px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease',
  },
  recordLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  iconSquare: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#EDF0FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recordInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  recordName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
  },
  recordTimestamp: {
    fontSize: '12px',
    color: '#64748B',
  },
  recordRight: {
    display: 'flex',
    alignItems: 'center',
  },
  submittedBadge: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  emptyRecordsBox: {
    padding: '32px 16px',
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
    maxWidth: '440px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px 20px',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  lockPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#E2E8F0',
    padding: '2px 6px',
    borderRadius: '4px',
    marginBottom: '4px',
  },
  modalHeading: {
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
    padding: '18px 20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  modalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '8px',
    borderBottom: '1px solid #F1F5F9',
  },
  modalLabel: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '500',
  },
  modalValue: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  dataContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    padding: '12px 14px',
    border: '1px solid #E2E8F0',
    marginTop: '6px',
  },
  dataTitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  dataRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    padding: '3px 0',
  },
  dataKey: {
    color: '#64748B',
    textTransform: 'capitalize',
  },
  dataVal: {
    fontWeight: '700',
    color: '#0F172A',
  },
  modalFooter: {
    padding: '14px 20px',
    borderTop: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  closeBtn: {
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
  errorContainer: {
    padding: '40px 20px',
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #E2E8F0',
  },
  backBtn: {
    marginTop: '12px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#0018AD',
    color: '#FFFFFF',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

export default TankDetails;
