import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, ChevronRight, Scale, Clock, CheckCircle2 
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';
import QuickRecordModal from '../components/QuickRecordModal';
import { getTankWeeklySchedule } from '../utils/testScheduleHelper';

const FarmerDetails = () => {
  const { farmerId } = useParams();
  const navigate = useNavigate();
  const session = getSession();
  const { getFarmerById, getTanksByFarmerId, db } = useMockData();

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedTankId, setSelectedTankId] = useState(null);
  const [modalInitialType, setModalInitialType] = useState('WATER_QUALITY');

  const farmer = getFarmerById(farmerId) || db?.farmers?.find(f => f.id === farmerId);
  const tanks = getTanksByFarmerId ? getTanksByFarmerId(farmerId) : (db?.tanks || []).filter(t => t.farmerId === farmerId);

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

  const handleOpenRecord = (tankId = null) => {
    setSelectedTankId(tankId || (tanks[0]?.id || ''));
    setModalInitialType('WATER_QUALITY');
    setIsRecordModalOpen(true);
  };

  const handleOpenHarvest = (tankId = null) => {
    setSelectedTankId(tankId || (tanks[0]?.id || ''));
    setModalInitialType('HARVEST_ENTRY');
    setIsRecordModalOpen(true);
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.topBar}>
        <button style={styles.backLink} onClick={() => navigate('/farmers')}>
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            style={styles.harvestBtn}
            onClick={() => handleOpenHarvest()}
            title="Record Crop Harvest"
          >
            <Scale size={14} strokeWidth={2.4} /> Harvest
          </button>

          <button 
            style={styles.newRecordBtn}
            onClick={() => handleOpenRecord()}
            title="Record Field Test"
          >
            <Plus size={14} strokeWidth={2.5} /> New Record
          </button>
        </div>
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
            <span style={styles.infoLabel}>Total Extent</span>
            <span style={styles.infoValue}>{farmer.extent || farmer.acres ? `${farmer.extent || farmer.acres} Acres` : 'N/A'}</span>
          </div>
          <div style={styles.infoCol}>
            <span style={styles.infoLabel}>Assigned Tanks</span>
            <span style={styles.infoValue}>{tanks.length} Tanks</span>
          </div>
          <div style={styles.infoCol}>
            <span style={styles.infoLabel}>Assigned Technician</span>
            <span style={styles.infoValue}>{session?.name || 'Ramesh'}</span>
          </div>
        </div>
      </div>

      {/* Tanks Section */}
      <div style={styles.pondsSection}>
        <div style={styles.sectionHeaderRow}>
          <span style={styles.sectionHeaderSmall}>TANKS ({tanks.length})</span>
        </div>

        <div style={styles.pondsList}>
          {tanks.length === 0 ? (
            <div style={styles.emptyPonds}>
              <span>No tanks registered for this farmer.</span>
            </div>
          ) : (
            tanks.map((tank, idx) => {
              const stockingDate = tank.stockingDate || '2026-06-12';
              const days = Math.floor((new Date() - new Date(stockingDate)) / (1000 * 60 * 60 * 24)) || 82;
              const harvestStore = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
              const tKey = `${farmer.id}_${tank.id}`;
              const tStore = harvestStore[tKey];
              const isDone = tank.status === 'Harvested' || tank.status === 'Completed' || tank.finalHarvestCompleted || (tStore?.harvests || []).some(h => h.harvestType === 'Final Harvest' || h.isFinal);
              const weeklySchedule = getTankWeeklySchedule(tank, db?.submissions || []);

              return (
                <div
                  key={tank.id}
                  style={styles.pondCard}
                  onClick={() => navigate(`/tanks/${tank.id}`)}
                >
                  <div style={styles.pondLeft}>
                    <div style={styles.pondHeaderRow}>
                      <span style={styles.pondTitle}>{tank.name || `Tank ${idx + 1}`}</span>
                      <span style={styles.speciesTag}>{tank.species || 'Vannamei'}</span>
                    </div>

                    <div style={styles.pondSpecsRow}>
                      <span>{tank.size || tank.area || '22 Acres'} acres</span>
                      <span>•</span>
                      <span>{days} Days</span>
                      <span>•</span>
                      {isDone ? (
                        <span style={{
                          ...styles.activeTag,
                          backgroundColor: '#EFF6FF',
                          color: '#1D4ED8',
                        }}>
                          Harvest Completed
                        </span>
                      ) : !weeklySchedule.isAllDone ? (
                        <span style={styles.dueTagBadge}>
                          {weeklySchedule.dueCount} Tests Due
                        </span>
                      ) : (
                        <span style={styles.activeTag}>All Tests Done</span>
                      )}
                    </div>

                    {!isDone && !weeklySchedule.isAllDone && (
                      <div style={styles.dueSummaryLine}>
                        Due this week: {weeklySchedule.dueSummaryText}
                      </div>
                    )}
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
        initialType={modalInitialType}
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
    gap: '20px',
    width: '100%',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '4px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    color: '#0F172A',
    fontWeight: '700',
    fontSize: '13.5px',
    cursor: 'pointer',
    padding: 0,
  },
  harvestBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1.5px solid #BFDBFE',
    height: '38px',
    padding: '0 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.15s ease',
  },
  newRecordBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    height: '38px',
    padding: '0 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(26, 47, 184, 0.22)',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: 'clamp(14px, 3.5vw, 22px)',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    boxSizing: 'border-box',
    width: '100%',
  },
  farmerName: {
    fontSize: 'clamp(18px, 4vw, 22px)',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12.5px',
    color: '#64748B',
    marginTop: '4px',
    flexWrap: 'wrap',
  },
  divider: {
    height: '1px',
    backgroundColor: '#F1F5F9',
    margin: '14px 0',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
    gap: '12px',
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
  dueTagBadge: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    fontWeight: '700',
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid #FDE68A',
  },
  dueSummaryLine: {
    fontSize: '11.5px',
    color: '#92400E',
    fontWeight: '500',
    marginTop: '4px',
    lineHeight: '1.4',
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
