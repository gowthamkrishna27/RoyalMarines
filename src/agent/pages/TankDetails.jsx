import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Droplets, Fish, Wheat, Skull, 
  ClipboardList, Camera, Clock 
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import QuickRecordModal from '../components/QuickRecordModal';

const TankDetails = () => {
  const { tankId } = useParams();
  const navigate = useNavigate();
  const { getTankById, getFarmerById, db } = useMockData();

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

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
      {/* Top Header */}
      <div style={styles.topBar}>
        <button 
          style={styles.backLink}
          onClick={() => farmer ? navigate(`/farmers/${farmer.id}`) : navigate('/farmers')}
        >
          <ArrowLeft size={16} /> {farmer?.name || 'Back'}
        </button>

        <button 
          style={styles.newRecordBtn}
          onClick={() => setIsRecordModalOpen(true)}
        >
          <Plus size={13} strokeWidth={2.5} /> + New Record
        </button>
      </div>

      {/* Pond Summary Card */}
      <div style={styles.card}>
        <div style={styles.pondHeader}>
          <h1 style={styles.pondTitle}>{tank.name || 'Pond 01'}</h1>
          <span style={styles.activeTag}>Active</span>
        </div>

        <div style={styles.farmerLinkText}>
          Farmer: <b>{farmer?.name || 'Assigned Farmer'}</b>
        </div>

        <div style={styles.divider} />

        <div style={styles.specsGrid}>
          <div style={styles.specCol}>
            <span style={styles.specLabel}>Species</span>
            <span style={styles.specVal}>{tank.species || 'Vannamei'}</span>
          </div>
          <div style={styles.specCol}>
            <span style={styles.specLabel}>Pond Area</span>
            <span style={styles.specVal}>{tank.size || tank.area || '2.5'} Acres</span>
          </div>
          <div style={styles.specCol}>
            <span style={styles.specLabel}>Culture Days</span>
            <span style={{ ...styles.specVal, color: '#0018AD' }}>{cultureDays} Days</span>
          </div>
          <div style={styles.specCol}>
            <span style={styles.specLabel}>Stocking Date</span>
            <span style={styles.specVal}>{stockingDate}</span>
          </div>
        </div>
      </div>

      {/* Recent Pond Records */}
      <div style={styles.recordsSection}>
        <div style={styles.sectionHeaderRow}>
          <span style={styles.sectionHeaderSmall}>RECENT RECORDS</span>
          <span style={styles.sectionCount}>{pondSubmissions.length} Submitted</span>
        </div>

        <div style={styles.recordsList}>
          {pondSubmissions.length === 0 ? (
            <div style={styles.emptyRecords}>
              <Clock size={24} color="#94A3B8" style={{ marginBottom: '6px' }} />
              <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '13px' }}>No records yet</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                Tap "+ New Record" below to record field data.
              </div>
            </div>
          ) : (
            pondSubmissions.map((record) => (
              <div 
                key={record.id} 
                style={styles.recordItem}
                onClick={() => navigate('/tests')}
              >
                <div style={styles.recordLeft}>
                  <div style={styles.iconContainer}>
                    {getRecordIcon(record.testType || record.recordType)}
                  </div>
                  <div style={styles.recordTextGroup}>
                    <span style={styles.recordTitle}>
                      {record.testType || record.recordType || 'Water Quality'}
                    </span>
                    <span style={styles.recordTime}>
                      {record.date || 'Today'} • {record.time || '10:32 AM'}
                    </span>
                  </div>
                </div>

                <div style={styles.recordRight}>
                  <span style={styles.submittedStatus}>✓ Submitted</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sticky Bottom Button */}
      <div style={styles.bottomBar}>
        <button 
          style={styles.primaryActionButton}
          onClick={() => setIsRecordModalOpen(true)}
        >
          <Plus size={16} strokeWidth={2.5} /> + CREATE NEW FIELD RECORD
        </button>
      </div>

      {/* Record Modal */}
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
    gap: '16px',
    paddingBottom: '80px',
    maxWidth: '480px',
    margin: '0 auto',
    width: '100%',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '4px',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    color: '#0F172A',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    padding: 0,
  },
  newRecordBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#0018AD',
    color: '#FFFFFF',
    border: 'none',
    padding: '7px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '14px 16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  pondHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pondTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },
  activeTag: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    padding: '2px 7px',
    borderRadius: '6px',
  },
  farmerLinkText: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '4px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#F1F5F9',
    margin: '12px 0',
  },
  specsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  specCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  specLabel: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '500',
  },
  specVal: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  recordsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '2px',
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 2px',
  },
  sectionHeaderSmall: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.4px',
  },
  sectionCount: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '500',
  },
  recordsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  recordItem: {
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
  recordTime: {
    fontSize: '11px',
    color: '#94A3B8',
  },
  recordRight: {
    display: 'flex',
    alignItems: 'center',
  },
  submittedStatus: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#16A34A',
  },
  emptyRecords: {
    padding: '24px 16px',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px dashed #CBD5E1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'fixed',
    bottom: '68px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '480px',
    padding: '0 16px',
    boxSizing: 'border-box',
    zIndex: 800,
  },
  primaryActionButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#0018AD',
    color: '#FFFFFF',
    border: 'none',
    padding: '13px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0, 24, 173, 0.35)',
  },
  errorContainer: {
    padding: '40px 20px',
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
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
