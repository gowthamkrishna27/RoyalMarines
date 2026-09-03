import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, CheckCircle2, Clock, Plus, Phone, MapPin, 
  Layers, ShieldCheck, Scale, ArrowLeft, Droplets, Wheat, Activity, Pill, Skull, ClipboardList, Camera
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getTankWeeklySchedule, ROUTINE_TESTS } from '../../agent/utils/testScheduleHelper';
import QuickRecordModal from '../../agent/components/QuickRecordModal';

const WeeklyRoutineScheduleModal = ({ isOpen, onClose, tank, farmer }) => {
  const { db, getFarmerById } = useMockData();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState('WATER_QUALITY');

  if (!isOpen || !tank) return null;

  const resolvedFarmer = farmer || (tank.farmerId ? getFarmerById(tank.farmerId) : null) || {
    name: tank.farmer || 'Farmer',
    phone: '+91 9876543215',
    location: tank.locality || 'Chinnamiram',
    assignedAgent: tank.agent || 'Ramesh'
  };

  const weeklySchedule = getTankWeeklySchedule(tank, db?.submissions || []);
  const doc = tank.doc || 77;
  const pondSize = String(tank.size || tank.acres || '2.5').replace(/\s*acres?/i, '') + ' Acres';

  const handleOpenRecord = (testKey) => {
    setModalInitialType(testKey);
    setIsRecordModalOpen(true);
  };

  return createPortal(
    <>
      <div 
        className="animate-backdrop-in"
        style={styles.backdrop}
        onClick={onClose}
      >
        <div 
          className="animate-modal-in"
          style={styles.modalCard}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Header with Back and Action Buttons */}
          <div style={styles.topHeaderBar}>
            <button 
              type="button" 
              style={styles.backButton}
              onClick={onClose}
              aria-label="Back"
            >
              <ArrowLeft size={18} strokeWidth={2.4} />
              <span>Back</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                type="button" 
                style={styles.harvestActionBtn}
                onClick={() => handleOpenRecord('HARVEST_ENTRY')}
                title="Record Crop Harvest"
              >
                <Scale size={14} strokeWidth={2.4} />
                <span>Harvest</span>
              </button>

              <button 
                type="button" 
                style={styles.primaryNewRecordBtn}
                onClick={() => handleOpenRecord('WATER_QUALITY')}
                title="New Record"
              >
                <Plus size={15} strokeWidth={2.6} />
                <span>New Record</span>
              </button>
            </div>
          </div>

          {/* 2. Farmer Summary Card */}
          <div style={styles.farmerCard}>
            <div style={styles.farmerGrid}>
              <div style={styles.farmerCol}>
                <span style={styles.farmerColLabel}>PHONE</span>
                <div style={styles.farmerValRow}>
                  <Phone size={14} color="#1A2FB8" />
                  <span style={styles.farmerValText}>{resolvedFarmer.phone || '+91 9876543215'}</span>
                </div>
              </div>

              <div style={styles.farmerCol}>
                <span style={styles.farmerColLabel}>VILLAGE</span>
                <div style={styles.farmerValRow}>
                  <MapPin size={14} color="#16A34A" />
                  <span style={styles.farmerValText}>{resolvedFarmer.location || resolvedFarmer.village || 'Chinnamiram'}</span>
                </div>
              </div>

              <div style={styles.farmerCol}>
                <span style={styles.farmerColLabel}>ASSIGNED TANKS</span>
                <div style={styles.farmerValRow}>
                  <Layers size={14} color="#475569" />
                  <span style={styles.farmerValText}>1 Tank</span>
                </div>
              </div>

              <div style={styles.farmerCol}>
                <span style={styles.farmerColLabel}>ASSIGNED TECHNICIAN</span>
                <div style={styles.farmerValRow}>
                  <ShieldCheck size={14} color="#0284C7" />
                  <span style={styles.farmerValText}>{resolvedFarmer.assignedAgent || resolvedFarmer.agent || 'Ramesh'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Tank Information Card */}
          <div style={styles.tankCard}>
            <div style={styles.tankTopRow}>
              <div style={styles.tankTitleGroup}>
                <h2 style={styles.tankTitle}>{tank.name || 'Tank 1'}</h2>
                <span style={styles.speciesPillBadge}>{tank.species || 'Vannamei'}</span>
              </div>

              {weeklySchedule.isAllDone ? (
                <span style={styles.allDoneBadge}>
                  <CheckCircle2 size={13} color="#15803D" strokeWidth={2.4} />
                  <span>All Tests Done</span>
                </span>
              ) : (
                <span style={styles.weeklyTestDueBadge}>
                  <Clock size={13} strokeWidth={2.4} color="#B45309" />
                  <span>Weekly Test Due</span>
                </span>
              )}
            </div>

            <div style={styles.tankSpecsStrip}>
              <div style={styles.tankSpecItem}>
                <span style={styles.tankSpecLabel}>POND SIZE</span>
                <span style={styles.tankSpecValue}>{pondSize}</span>
              </div>

              <div style={styles.specDivider} />

              <div style={styles.tankSpecItem}>
                <span style={styles.tankSpecLabel}>CURRENT DOC</span>
                <span style={{ ...styles.tankSpecValue, color: '#1A2FB8' }}>{doc} Days</span>
              </div>

              <div style={styles.specDivider} />

              <div style={styles.tankSpecItem}>
                <span style={styles.tankSpecLabel}>WEEKLY STATUS</span>
                <span style={{ 
                  ...styles.tankSpecValue, 
                  color: weeklySchedule.isAllDone ? '#16A34A' : '#D97706' 
                }}>
                  {weeklySchedule.isAllDone ? 'Completed (7/7 Done)' : 'Test Due (Mon-Sun)'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Weekly Routine Tests Card (Matching Image 2) */}
          <div style={styles.weeklyScheduleCard}>
            <div style={styles.scheduleHeaderRow}>
              <div>
                <div style={styles.scheduleMiniTag}>WEEKLY TEST SCHEDULE • MON - SUN</div>
                <h3 style={styles.scheduleTitle}>
                  Weekly Routine Tests ({weeklySchedule.doneCount}/7 Done)
                </h3>
              </div>

              <span style={weeklySchedule.isAllDone ? styles.allTestsDoneBadge : styles.testsDueBadge}>
                {weeklySchedule.isAllDone ? (
                  <>
                    <CheckCircle2 size={13} color="#15803D" /> All Tests Completed
                  </>
                ) : (
                  <>
                    {weeklySchedule.dueCount} Tests Due This Week
                  </>
                )}
              </span>
            </div>

            <div style={styles.scheduleList}>
              {weeklySchedule.testList.map((test) => {
                const isDone = test.isDone;

                return (
                  <div 
                    key={test.key}
                    style={{
                      ...styles.testRowCard,
                      backgroundColor: isDone ? '#F0FDF4' : '#FEFCE8',
                      borderColor: isDone ? '#BBF7D0' : '#FEF08A',
                    }}
                  >
                    <div style={styles.testRowLeft}>
                      <div style={{
                        ...styles.testIconBadge,
                        backgroundColor: isDone ? '#DCFCE7' : '#FEF3C7',
                        color: isDone ? '#16A34A' : '#D97706',
                      }}>
                        {isDone ? (
                          <CheckCircle2 size={18} strokeWidth={2.4} color="#16A34A" />
                        ) : (
                          <Clock size={18} strokeWidth={2.4} color="#D97706" />
                        )}
                      </div>

                      <div>
                        <div style={styles.testRowTitle}>{test.label}</div>
                        <div style={{
                          ...styles.testRowSub,
                          color: isDone ? '#15803D' : '#92400E',
                        }}>
                          {isDone 
                            ? `Completed (${test.completedDate || '2026-09-01'})` 
                            : 'Due this week • Click to record'}
                        </div>
                      </div>
                    </div>

                    <div style={styles.testRowRight}>
                      {isDone ? (
                        <span style={styles.doneBadgePill}>
                          ✓ Done
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="transition-all duration-150 hover:brightness-110 active:scale-95 cursor-pointer"
                          style={styles.recordTestBtn}
                          onClick={() => handleOpenRecord(test.key)}
                          title={`Record ${test.label}`}
                        >
                          <Plus size={13} strokeWidth={2.8} /> Record
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Quick Record Modal */}
      <QuickRecordModal 
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        initialType={modalInitialType}
        preselectedFarmerId={resolvedFarmer.id}
        preselectedTankId={tank.id}
        userRole="INCHARGE"
      />
    </>,
    document.body
  );
};

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '16px',
    boxSizing: 'border-box',
    backdropFilter: 'blur(3px)',
  },
  modalCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '92vh',
    maxHeight: '92dvh',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
    border: '1px solid #E2E8F0',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: 'clamp(14px, 3.5vw, 20px)',
    boxSizing: 'border-box',
  },
  topHeaderBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#0F172A',
    fontWeight: '700',
    fontSize: '15px',
    cursor: 'pointer',
    padding: '4px 0',
  },
  harvestActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  primaryNewRecordBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    height: '38px',
    padding: '0 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(26, 47, 184, 0.25)',
  },
  farmerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '14px 16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  farmerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px 16px',
  },
  farmerCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  farmerColLabel: {
    fontSize: '10.5px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.4px',
  },
  farmerValRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  farmerValText: {
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#0F172A',
  },
  tankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  tankTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tankTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  tankTitle: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  speciesPillBadge: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#1A2FB8',
    backgroundColor: '#EEF2FF',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid #C7D2FE',
  },
  weeklyTestDueBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '8px',
    backgroundColor: '#FEF3C7',
    border: '1px solid #FDE68A',
    color: '#B45309',
    fontSize: '11.5px',
    fontWeight: '700',
  },
  allDoneBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '8px',
    backgroundColor: '#DCFCE7',
    border: '1px solid #86EFAC',
    color: '#15803D',
    fontSize: '11.5px',
    fontWeight: '700',
  },
  tankSpecsStrip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    padding: '10px 14px',
    border: '1px solid #E2E8F0',
  },
  tankSpecItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  tankSpecLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.3px',
  },
  tankSpecValue: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  specDivider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#CBD5E1',
  },
  weeklyScheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  scheduleHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  scheduleMiniTag: {
    fontSize: '10.5px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.4px',
    marginBottom: '2px',
  },
  scheduleTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  testsDueBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '8px',
    backgroundColor: '#FEF3C7',
    border: '1px solid #FDE68A',
    color: '#B45309',
    fontSize: '11.5px',
    fontWeight: '700',
  },
  allTestsDoneBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '8px',
    backgroundColor: '#DCFCE7',
    border: '1px solid #86EFAC',
    color: '#15803D',
    fontSize: '11.5px',
    fontWeight: '700',
  },
  scheduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  testRowCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid',
    gap: '10px',
    transition: 'all 0.15s ease',
  },
  testRowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0,
    flex: 1,
  },
  testIconBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  testRowTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  testRowSub: {
    fontSize: '11.5px',
    fontWeight: '500',
    marginTop: '1px',
  },
  testRowRight: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  doneBadgePill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#DCFCE7',
    color: '#16A34A',
    fontWeight: '700',
    fontSize: '11.5px',
  },
  recordTestBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    padding: '5px 12px',
    borderRadius: '8px',
    fontSize: '11.5px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(26, 47, 184, 0.25)',
  }
};

export default WeeklyRoutineScheduleModal;