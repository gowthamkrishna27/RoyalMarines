import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, ChevronRight 
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';
import QuickRecordModal from '../components/QuickRecordModal';

const FarmerDetails = () => {
  const { farmerId } = useParams();
  const navigate = useNavigate();
  const session = getSession();
  const { getFarmerById, getTanksByFarmerId, db } = useMockData();

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedTankId, setSelectedTankId] = useState(null);

  const farmer = getFarmerById(farmerId) || db?.farmers?.find(f => f.id === farmerId);
  const ponds = getTanksByFarmerId ? getTanksByFarmerId(farmerId) : (db?.tanks || []).filter(t => t.farmerId === farmerId);

  if (!farmer) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <p>Farmer not found or not assigned to your account.</p>
          <button style={styles.backBtn} onClick={() => navigate('/farmers')}>
            ← Back to My Farmers
          </button>
        </div>
      </div>
    );
  }

  const handleOpenRecord = (pondId = null) => {
    setSelectedTankId(pondId || (ponds[0]?.id || ''));
    setIsRecordModalOpen(true);
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.topBar}>
        <button style={styles.backLink} onClick={() => navigate('/farmers')}>
          <ArrowLeft size={16} /> Back
        </button>

        <button 
          style={styles.newRecordBtn}
          onClick={() => handleOpenRecord()}
        >
          <Plus size={13} strokeWidth={2.5} /> + New Record
        </button>
      </div>

      {/* Farmer Profile Card */}
      <div style={styles.card}>
        <h1 style={styles.farmerName}>{farmer.name}</h1>
        
        <div style={styles.metaRow}>
          <span>📞 {farmer.phone || '98765 XXXXX'}</span>
          <span>•</span>
          <span>📍 {farmer.village || farmer.location || 'Nellore'}</span>
        </div>

        <div style={styles.divider} />

        <div style={styles.infoGrid}>
          <div style={styles.infoCol}>
            <span style={styles.infoLabel}>Assigned Ponds</span>
            <span style={styles.infoValue}>{ponds.length} Ponds</span>
          </div>
          <div style={styles.infoCol}>
            <span style={styles.infoLabel}>Assigned Technician</span>
            <span style={styles.infoValue}>{session?.name || 'Agent A'}</span>
          </div>
        </div>
      </div>

      {/* Ponds Section */}
      <div style={styles.pondsSection}>
        <div style={styles.sectionHeaderRow}>
          <span style={styles.sectionHeaderSmall}>PONDS ({ponds.length})</span>
        </div>

        <div style={styles.pondsList}>
          {ponds.length === 0 ? (
            <div style={styles.emptyPonds}>
              <span>No ponds registered for this farmer.</span>
            </div>
          ) : (
            ponds.map((pond, idx) => {
              const stockingDate = pond.stockingDate || '2026-06-12';
              const days = Math.floor((new Date() - new Date(stockingDate)) / (1000 * 60 * 60 * 24)) || 76;

              return (
                <div
                  key={pond.id}
                  style={styles.pondCard}
                  onClick={() => navigate(`/tanks/${pond.id}`)}
                >
                  <div style={styles.pondLeft}>
                    <div style={styles.pondHeaderRow}>
                      <span style={styles.pondTitle}>{pond.name || `Pond 0${idx + 1}`}</span>
                      <span style={styles.speciesTag}>{pond.species || 'Vannamei'}</span>
                    </div>

                    <div style={styles.pondSpecsRow}>
                      <span>{pond.size || pond.area || '2.5'} acres</span>
                      <span>•</span>
                      <span>{days} Days</span>
                      <span>•</span>
                      <span style={styles.activeTag}>Active</span>
                    </div>
                  </div>

                  <div style={styles.pondRight}>
                    <ChevronRight size={15} color="#94A3B8" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Record Modal */}
      <QuickRecordModal 
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        preselectedFarmerId={farmer.id}
        preselectedTankId={selectedTankId}
      />
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
  farmerName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#64748B',
    marginTop: '4px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#F1F5F9',
    margin: '12px 0',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  infoCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  infoLabel: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  pondsSection: {
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
  pondsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  pondCard: {
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
  pondLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  pondHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  pondTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
  },
  speciesTag: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#0018AD',
    backgroundColor: '#EDF0FF',
    padding: '1px 6px',
    borderRadius: '4px',
  },
  pondSpecsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    color: '#64748B',
  },
  activeTag: {
    color: '#16A34A',
    fontWeight: '600',
  },
  pondRight: {
    display: 'flex',
    alignItems: 'center',
  },
  emptyPonds: {
    padding: '24px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '12px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px dashed #CBD5E1',
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

export default FarmerDetails;
