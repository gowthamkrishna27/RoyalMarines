import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Scale, CheckCircle2, Droplets, Calendar, 
  Fish, Wheat, ArrowRight, Sparkles, AlertCircle, 
  Building, FileText, Check, Lock
} from 'lucide-react';

const TakeHarvestModal = ({ 
  isOpen, 
  onClose, 
  tank, 
  farmer, 
  onSuccess 
}) => {
  if (!isOpen || !tank) return null;

  const farmerName = farmer?.name || tank.farmer || tank.farmerName || 'Farmer';
  const farmerLocality = farmer?.location || farmer?.locality || farmer?.village || tank.locality || 'Bhimavaram';
  const tankName = tank.name || `Tank ${tank.id}`;
  const pondSize = String(tank.size || tank.acres || '2.5').replace(/\s*acres?/i, '') + ' Acres';
  const initialStock = parseInt(tank.seedStocked || tank.seedNumber || '150000', 10);
  const currentDoc = parseInt(tank.doc || 77, 10);
  const defaultAbw = tank.abw ? parseFloat(tank.abw) : 24.5;

  // Form State
  const [harvestType, setHarvestType] = useState('Partial Harvest'); // 'Partial Harvest' | 'Final Harvest'
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [doc, setDoc] = useState(currentDoc);
  const [abw, setAbw] = useState(defaultAbw);
  const [biomass, setBiomass] = useState('');
  const [feedConsumed, setFeedConsumed] = useState('');
  const [buyer, setBuyer] = useState('Royals Marine Processing Unit 1');
  const [remarks, setRemarks] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [savedData, setSavedData] = useState(null);

  // Dynamic calculations
  const numAbw = parseFloat(abw) || 0;
  const numBiomass = parseFloat(biomass) || 0;
  const numFeed = parseFloat(feedConsumed) || 0;

  const countPerKg = numAbw > 0 ? Math.round(1000 / numAbw) : 0;
  const calculatedShrimpCount = numBiomass > 0 && numAbw > 0 ? Math.round((numBiomass * 1000) / numAbw) : 0;
  const calculatedFcr = numBiomass > 0 && numFeed > 0 ? (numFeed / numBiomass).toFixed(2) : (numBiomass > 0 ? '1.16' : '0.00');

  // Auto-suggest feed based on biomass input
  useEffect(() => {
    if (numBiomass > 0 && (!feedConsumed || feedConsumed === '')) {
      const estimatedFeed = Math.round(numBiomass * 1.16);
      setFeedConsumed(estimatedFeed.toString());
    }
  }, [numBiomass]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!numBiomass || numBiomass <= 0) {
      alert('Please enter a valid harvest biomass in kg.');
      return;
    }
    if (!numAbw || numAbw <= 0) {
      alert('Please enter average body weight (ABW).');
      return;
    }

    const isFinal = harvestType === 'Final Harvest';
    const storeKey = `${tank.farmerId || farmer?.id}_${tank.id}`;

    const newHarvestRecord = {
      id: `harvest_${Date.now()}`,
      harvestType: harvestType,
      displayTitle: isFinal ? 'Final Harvest (Cycle Closed)' : 'Partial Harvest',
      isFinal: isFinal,
      date: harvestDate,
      doc: parseInt(doc, 10) || currentDoc,
      abw: numAbw,
      countPerKg: countPerKg,
      harvestedNumber: calculatedShrimpCount,
      harvestedBiomass: numBiomass,
      feedConsumed: numFeed || Math.round(numBiomass * 1.16),
      fcr: calculatedFcr,
      remarks: remarks || (isFinal ? 'Complete pond harvest and cycle closure' : 'Partial thinning harvest'),
      buyer: buyer || 'Royals Marine Processing Unit 1',
      recordedAt: new Date().toISOString()
    };

    try {
      const store = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
      const existingTankStore = store[storeKey] || {
        farmerId: farmer?.id || tank.farmerId,
        tankId: tank.id,
        seedNumber: initialStock.toString(),
        totalFeed: '0',
        harvests: []
      };

      const existingHarvests = Array.isArray(existingTankStore.harvests) ? existingTankStore.harvests : [];
      const updatedHarvests = [...existingHarvests, newHarvestRecord];
      const updatedTotalFeed = (parseFloat(existingTankStore.totalFeed || 0) + (numFeed || Math.round(numBiomass * 1.16))).toString();

      store[storeKey] = {
        ...existingTankStore,
        harvests: updatedHarvests,
        totalFeed: updatedTotalFeed,
        finalHarvestCompleted: isFinal ? true : (existingTankStore.finalHarvestCompleted || false)
      };

      localStorage.setItem('agent_harvest_store', JSON.stringify(store));
      window.dispatchEvent(new CustomEvent('harvestStoreUpdated', { detail: store }));

      setSavedData(newHarvestRecord);
      setIsSubmitted(true);

      if (onSuccess) {
        onSuccess(newHarvestRecord);
      }
    } catch (err) {
      console.error('Failed to save harvest report:', err);
      alert('Failed to save harvest report. Please try again.');
    }
  };

  const handleDone = () => {
    setIsSubmitted(false);
    onClose();
  };

  return createPortal(
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div 
        style={styles.modalCard} 
        onClick={e => e.stopPropagation()} 
        className="animate-modal-in"
      >
        {/* ========================================================= */}
        {/* SUCCESS VIEW */}
        {/* ========================================================= */}
        {isSubmitted && savedData ? (
          <div style={styles.successContainer}>
            <div style={styles.successIconCircle}>
              <CheckCircle2 size={44} color="#16A34A" strokeWidth={2.4} />
            </div>

            <h3 style={styles.successTitle}>
              {savedData.isFinal ? 'Final Harvest Recorded!' : 'Partial Harvest Recorded!'}
            </h3>

            <p style={styles.successSub}>
              New harvest entry successfully recorded for <strong>{tankName}</strong> ({farmerName}).
            </p>

            {/* Summary KPI Cards */}
            <div style={styles.successGrid}>
              <div style={styles.successCard}>
                <span style={styles.successCardLabel}>Harvest Type</span>
                <span style={{ 
                  ...styles.successCardVal, 
                  color: savedData.isFinal ? '#16A34A' : '#1A2FB8',
                  fontSize: '14px',
                  fontWeight: '800'
                }}>
                  {savedData.displayTitle}
                </span>
              </div>

              <div style={styles.successCard}>
                <span style={styles.successCardLabel}>Harvested Biomass</span>
                <span style={{ ...styles.successCardVal, color: '#1A2FB8' }}>
                  {savedData.harvestedBiomass.toLocaleString()} kg
                </span>
              </div>

              <div style={styles.successCard}>
                <span style={styles.successCardLabel}>Average Weight (ABW)</span>
                <span style={{ ...styles.successCardVal, color: '#0F172A' }}>
                  {savedData.abw} g (~{savedData.countPerKg} count)
                </span>
              </div>

              <div style={styles.successCard}>
                <span style={styles.successCardLabel}>Est. Shrimp Harvested</span>
                <span style={{ ...styles.successCardVal, color: '#0F172A' }}>
                  {savedData.harvestedNumber.toLocaleString()} pcs
                </span>
              </div>

              <div style={styles.successCard}>
                <span style={styles.successCardLabel}>Batch FCR</span>
                <span style={{ ...styles.successCardVal, color: '#16A34A' }}>
                  {savedData.fcr}
                </span>
              </div>

              <div style={styles.successCard}>
                <span style={styles.successCardLabel}>Date & DOC</span>
                <span style={{ ...styles.successCardVal, color: '#475569', fontSize: '13px' }}>
                  {savedData.date} (Day {savedData.doc})
                </span>
              </div>
            </div>

            {savedData.isFinal && (
              <div style={styles.finalClosureBanner}>
                <Lock size={16} color="#15803D" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Cycle Closed:</strong> This pond has concluded its culture cycle. Final harvest metrics and survival summary are now archived.
                </span>
              </div>
            )}

            <button 
              type="button" 
              onClick={handleDone}
              style={styles.donePrimaryBtn}
              className="transition-all duration-150 hover:brightness-110 active:scale-98 cursor-pointer"
            >
              Done & Return to Tank
            </button>
          </div>
        ) : (
          /* ========================================================= */
          /* HARVEST FORM ENTRY VIEW */
          /* ========================================================= */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Modal Header */}
            <div style={styles.header}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={styles.headerIconCircle}>
                  <Scale size={20} color="#1A2FB8" strokeWidth={2.4} />
                </div>
                <div>
                  <h2 style={styles.headerTitle}>Record Harvest Report</h2>
                  <p style={styles.headerSub}>
                    {farmerName} • <strong>{tankName}</strong> ({pondSize}) • {farmerLocality}
                  </p>
                </div>
              </div>

              <button 
                type="button" 
                onClick={onClose} 
                style={styles.closeBtn}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={styles.body}>
              {/* 1. Harvest Type Selection (Partial vs Final) */}
              <div style={styles.sectionBox}>
                <label style={styles.sectionHeading}>Select Harvest Type</label>
                <div style={styles.typeToggleGrid}>
                  {/* Partial Harvest Option */}
                  <button
                    type="button"
                    onClick={() => setHarvestType('Partial Harvest')}
                    style={{
                      ...styles.typeBtn,
                      borderColor: harvestType === 'Partial Harvest' ? '#1A2FB8' : '#CBD5E1',
                      backgroundColor: harvestType === 'Partial Harvest' ? '#EFF6FF' : '#FFFFFF',
                    }}
                    className="transition-all duration-150 cursor-pointer"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          ...styles.radioIndicator,
                          borderColor: harvestType === 'Partial Harvest' ? '#1A2FB8' : '#94A3B8',
                          backgroundColor: harvestType === 'Partial Harvest' ? '#1A2FB8' : 'transparent',
                        }}>
                          {harvestType === 'Partial Harvest' && <div style={styles.radioInnerDot} />}
                        </div>
                        <span style={{ 
                          fontSize: '14px', 
                          fontWeight: '800', 
                          color: harvestType === 'Partial Harvest' ? '#1A2FB8' : '#0F172A' 
                        }}>
                          Partial Harvest
                        </span>
                      </div>
                      <span style={styles.partialTag}>Thinning</span>
                    </div>
                    <p style={styles.typeDesc}>
                      Selective netting to reduce density. Culture continues in the pond.
                    </p>
                  </button>

                  {/* Final Harvest Option */}
                  <button
                    type="button"
                    onClick={() => setHarvestType('Final Harvest')}
                    style={{
                      ...styles.typeBtn,
                      borderColor: harvestType === 'Final Harvest' ? '#16A34A' : '#CBD5E1',
                      backgroundColor: harvestType === 'Final Harvest' ? '#F0FDF4' : '#FFFFFF',
                    }}
                    className="transition-all duration-150 cursor-pointer"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          ...styles.radioIndicator,
                          borderColor: harvestType === 'Final Harvest' ? '#16A34A' : '#94A3B8',
                          backgroundColor: harvestType === 'Final Harvest' ? '#16A34A' : 'transparent',
                        }}>
                          {harvestType === 'Final Harvest' && <div style={styles.radioInnerDot} />}
                        </div>
                        <span style={{ 
                          fontSize: '14px', 
                          fontWeight: '800', 
                          color: harvestType === 'Final Harvest' ? '#15803D' : '#0F172A' 
                        }}>
                          Final Harvest
                        </span>
                      </div>
                      <span style={styles.finalTag}>Cycle Complete</span>
                    </div>
                    <p style={styles.typeDesc}>
                      Complete pond drainage harvest. Concludes culture cycle.
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Core Harvest Input Parameters */}
              <div style={styles.formGrid}>
                {/* Harvest Date */}
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>
                    Harvest Date <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={styles.inputWrapper}>
                    <Calendar size={15} color="#64748B" style={styles.inputIcon} />
                    <input 
                      type="date"
                      value={harvestDate}
                      onChange={(e) => setHarvestDate(e.target.value)}
                      style={styles.textInput}
                      required
                    />
                  </div>
                </div>

                {/* Day of Culture (DOC) */}
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>
                    Day of Culture (DOC) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={styles.inputWrapper}>
                    <input 
                      type="number"
                      value={doc}
                      onChange={(e) => setDoc(e.target.value)}
                      placeholder="e.g. 77"
                      min="1"
                      style={{ ...styles.textInput, paddingLeft: '12px' }}
                      required
                    />
                    <span style={styles.inputUnit}>Days</span>
                  </div>
                </div>

                {/* Average Body Weight (ABW) */}
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>
                    Average Body Weight (ABW) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={styles.inputWrapper}>
                    <input 
                      type="number"
                      step="0.1"
                      value={abw}
                      onChange={(e) => setAbw(e.target.value)}
                      placeholder="e.g. 24.5"
                      min="1"
                      style={{ ...styles.textInput, paddingLeft: '12px' }}
                      required
                    />
                    <span style={styles.inputUnit}>Grams</span>
                  </div>
                  {numAbw > 0 && (
                    <span style={styles.helperText}>
                      ~{countPerKg} Count / kg grade
                    </span>
                  )}
                </div>

                {/* Harvested Biomass (kg) */}
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>
                    Harvested Biomass <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={styles.inputWrapper}>
                    <input 
                      type="number"
                      step="1"
                      value={biomass}
                      onChange={(e) => setBiomass(e.target.value)}
                      placeholder="e.g. 1250"
                      min="1"
                      style={{ ...styles.textInput, paddingLeft: '12px' }}
                      required
                    />
                    <span style={styles.inputUnit}>Kg</span>
                  </div>
                  {calculatedShrimpCount > 0 && (
                    <span style={styles.helperText}>
                      ≈ {calculatedShrimpCount.toLocaleString()} shrimp pieces
                    </span>
                  )}
                </div>

                {/* Feed Consumed (kg) */}
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>
                    Feed Consumed for Batch
                  </label>
                  <div style={styles.inputWrapper}>
                    <input 
                      type="number"
                      step="1"
                      value={feedConsumed}
                      onChange={(e) => setFeedConsumed(e.target.value)}
                      placeholder="e.g. 1450"
                      style={{ ...styles.textInput, paddingLeft: '12px' }}
                    />
                    <span style={styles.inputUnit}>Kg</span>
                  </div>
                  {numBiomass > 0 && numFeed > 0 && (
                    <span style={styles.helperText}>
                      Calculated FCR: <strong>{calculatedFcr}</strong>
                    </span>
                  )}
                </div>

                {/* Buyer / Processing Plant */}
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Buyer / Processing Plant</label>
                  <div style={styles.inputWrapper}>
                    <Building size={15} color="#64748B" style={styles.inputIcon} />
                    <input 
                      type="text"
                      value={buyer}
                      onChange={(e) => setBuyer(e.target.value)}
                      placeholder="e.g. Royals Marine Export Unit 1"
                      style={styles.textInput}
                    />
                  </div>
                </div>
              </div>

              {/* Remarks / Field Notes */}
              <div style={{ ...styles.inputGroup, marginTop: '12px' }}>
                <label style={styles.inputLabel}>Field Remarks / Weighment Notes</label>
                <textarea 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. High quality export grade Vannamei. Drag netting completed in morning."
                  rows={2}
                  style={styles.textarea}
                />
              </div>

              {/* Live Preview Summary Card */}
              {numBiomass > 0 && numAbw > 0 && (
                <div style={styles.livePreviewCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Sparkles size={14} color="#1A2FB8" />
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#1A2FB8', textTransform: 'uppercase' }}>
                      Calculated Harvest Preview
                    </span>
                  </div>
                  <div style={styles.previewGrid}>
                    <div>
                      <span style={styles.previewLabel}>Grade Count</span>
                      <strong style={styles.previewVal}>~{countPerKg} count/kg</strong>
                    </div>
                    <div>
                      <span style={styles.previewLabel}>Estimated Count</span>
                      <strong style={styles.previewVal}>{calculatedShrimpCount.toLocaleString()} pcs</strong>
                    </div>
                    <div>
                      <span style={styles.previewLabel}>Batch FCR</span>
                      <strong style={{ ...styles.previewVal, color: '#16A34A' }}>{calculatedFcr}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={styles.footer}>
              <button 
                type="button" 
                onClick={onClose}
                style={styles.cancelBtn}
                className="transition-all active:scale-95 cursor-pointer"
              >
                Cancel
              </button>

              <button 
                type="submit"
                style={{
                  ...styles.submitBtn,
                  backgroundColor: harvestType === 'Final Harvest' ? '#16A34A' : '#1A2FB8',
                }}
                className="transition-all hover:brightness-110 active:scale-98 cursor-pointer"
              >
                <Scale size={16} />
                <span>Save {harvestType} Report</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

const styles = {
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    backdropFilter: 'blur(5px)',
    zIndex: 99999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px',
    boxSizing: 'border-box',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '640px',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.3)',
    border: '1px solid #E2E8F0',
    boxSizing: 'border-box',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #F1F5F9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flexShrink: 0,
  },
  headerIconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: '1px solid #DBEAFE',
  },
  headerTitle: {
    fontSize: '16.5px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  headerSub: {
    fontSize: '12px',
    color: '#64748B',
    margin: '2px 0 0 0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: '18px 20px',
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionHeading: {
    fontSize: '12px',
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  typeToggleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  typeBtn: {
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1.5px solid #CBD5E1',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    textAlign: 'left',
    backgroundColor: '#FFFFFF',
  },
  radioIndicator: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid #94A3B8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
  },
  partialTag: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '5px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #DBEAFE',
  },
  finalTag: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '5px',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    border: '1px solid #BBF7D0',
  },
  typeDesc: {
    fontSize: '11.5px',
    color: '#64748B',
    margin: 0,
    lineHeight: 1.35,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '12px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  inputLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  textInput: {
    width: '100%',
    height: '40px',
    padding: '8px 12px 8px 36px',
    borderRadius: '9px',
    border: '1.5px solid #CBD5E1',
    fontSize: '13.5px',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
  inputUnit: {
    position: 'absolute',
    right: '12px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748B',
    pointerEvents: 'none',
  },
  helperText: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#1A2FB8',
    marginTop: '1px',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '9px',
    border: '1.5px solid #CBD5E1',
    fontSize: '13px',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  livePreviewCard: {
    backgroundColor: '#F8FAFC',
    border: '1.5px solid #DBEAFE',
    borderRadius: '10px',
    padding: '12px 14px',
    marginTop: '4px',
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  previewLabel: {
    display: 'block',
    fontSize: '10.5px',
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  previewVal: {
    fontSize: '13.5px',
    color: '#0F172A',
    fontWeight: '800',
    marginTop: '2px',
  },
  footer: {
    padding: '14px 20px',
    borderTop: '1px solid #F1F5F9',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    backgroundColor: '#FFFFFF',
    flexShrink: 0,
  },
  cancelBtn: {
    padding: '9px 18px',
    borderRadius: '9px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    fontSize: '13px',
    fontWeight: '700',
  },
  submitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '9px 22px',
    borderRadius: '9px',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '13.5px',
    fontWeight: '800',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
  },

  // Success State Styles
  successContainer: {
    padding: '36px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  successIconCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: '#DCFCE7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    border: '2px solid #BBF7D0',
  },
  successTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0F172A',
    margin: '0 0 6px 0',
  },
  successSub: {
    fontSize: '13px',
    color: '#64748B',
    margin: '0 0 20px 0',
    maxWidth: '400px',
  },
  successGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    width: '100%',
    marginBottom: '20px',
  },
  successCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    padding: '12px',
    border: '1px solid #E2E8F0',
    textAlign: 'left',
  },
  successCardLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  successCardVal: {
    fontSize: '15px',
    fontWeight: '800',
    marginTop: '3px',
    display: 'block',
  },
  finalClosureBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '12.5px',
    color: '#15803D',
    marginBottom: '20px',
    textAlign: 'left',
    width: '100%',
    boxSizing: 'border-box',
  },
  donePrimaryBtn: {
    padding: '10px 28px',
    borderRadius: '10px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '14px',
    fontWeight: '800',
    width: '100%',
    maxWidth: '280px',
    boxShadow: '0 2px 8px rgba(26, 47, 184, 0.25)',
  }
};

export default TakeHarvestModal;
