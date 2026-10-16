import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Activity, Calculator, CheckCircle2, Calendar, 
  Layers, AlertCircle, Sparkles, Scale, Clock, Save
} from 'lucide-react';

/**
 * Calculates stock density in pcs/sq.m.
 * 1 Acre = 4,046.86 sq meters
 */
const calculateStockDensity = (seedStocked, acres) => {
  const numAcres = parseFloat(acres) || 1;
  const numSeed = parseFloat(seedStocked) || 0;
  if (numAcres <= 0 || numSeed <= 0) return '0.0';
  const sqm = numAcres * 4046.86;
  return (numSeed / sqm).toFixed(1);
};

const SamplingModal = ({
  isOpen,
  onClose,
  tank,
  farmer,
  onSave,
  existingEntry = null,
  isViewOnly = false,
}) => {
  if (!isOpen || !tank) return null;

  // 1. INBUILT DETAILS (Auto-filled from selected tank)
  const tankNumber = tank.name || (tank.id ? `Tank ${String(tank.id).replace(/\D/g, '') || '1'}` : 'Tank 1');
  const acres = tank.acres || tank.area || tank.size?.split(' ')?.[0] || '2.5';
  const dateOfStocking = tank.stockingDate || tank.seedDate || '2026-06-12';
  const seedStocked = parseFloat(tank.seedQuantity || tank.seedStocked || (tank.seedStockingLak ? parseFloat(tank.seedStockingLak) * 100000 : 250000)) || 250000;
  const stockDensity = tank.stockDensity || calculateStockDensity(seedStocked, acres);

  // Helper date strings
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultPrevDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  })();

  // 2. USER INPUT FORM STATE
  const [formData, setFormData] = useState({
    previousSamplingDate: defaultPrevDate,
    presentSamplingDate: todayStr,
    presentCount: '',
    lastCount: '',
    weeklyGrowthIncrement: '',
    adgWeek: '',
    overallAdg: '',
    dayFeed: '',
    number: '',
    cumulativeFeed: '',
    noBasedOnTcf: '',
    biomass: '',
    survival: '',
    fcr: '',
  });

  const [touchedFields, setTouchedFields] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  // Load existing entry if editing or viewing
  useEffect(() => {
    if (existingEntry) {
      setFormData({
        previousSamplingDate: existingEntry.previousSamplingDate || defaultPrevDate,
        presentSamplingDate: existingEntry.presentSamplingDate || todayStr,
        presentCount: existingEntry.presentCount != null ? String(existingEntry.presentCount) : '',
        lastCount: existingEntry.lastCount != null ? String(existingEntry.lastCount) : '',
        weeklyGrowthIncrement: existingEntry.weeklyGrowthIncrement != null ? String(existingEntry.weeklyGrowthIncrement) : '',
        adgWeek: existingEntry.adgWeek != null ? String(existingEntry.adgWeek) : '',
        overallAdg: existingEntry.overallAdg != null ? String(existingEntry.overallAdg) : '',
        dayFeed: existingEntry.dayFeed != null ? String(existingEntry.dayFeed) : '',
        number: existingEntry.number != null ? String(existingEntry.number) : '',
        cumulativeFeed: existingEntry.cumulativeFeed != null ? String(existingEntry.cumulativeFeed) : '',
        noBasedOnTcf: existingEntry.noBasedOnTcf != null ? String(existingEntry.noBasedOnTcf) : '',
        biomass: existingEntry.biomass != null ? String(existingEntry.biomass) : '',
        survival: existingEntry.survival != null ? String(existingEntry.survival) : '',
        fcr: existingEntry.fcr != null ? String(existingEntry.fcr) : '',
      });
    } else {
      // Suggest realistic base from current tank if available
      const lastAbwNum = parseFloat(tank.abw) || 18.0;
      const lastCountEst = lastAbwNum > 0 ? Math.round(1000 / lastAbwNum) : 55;
      const presentCountEst = Math.max(20, Math.round(lastCountEst - 7));
      setFormData({
        previousSamplingDate: defaultPrevDate,
        presentSamplingDate: todayStr,
        presentCount: '',
        lastCount: '',
        weeklyGrowthIncrement: '',
        adgWeek: '',
        overallAdg: '',
        dayFeed: tank.dayFeed || '',
        number: '',
        cumulativeFeed: tank.cumulativeFeed || '',
        noBasedOnTcf: '',
        biomass: tank.biomass ? String(tank.biomass).replace(/\D/g, '') : '',
        survival: tank.survival ? String(tank.survival).replace('%', '') : '',
        fcr: tank.fcr || '',
      });
      setTouchedFields({});
      setErrorMsg('');
    }
  }, [existingEntry, tank, isOpen]);

  // DOC calculated from Date of Stocking to Present Sampling Date
  const currentDoc = useMemo(() => {
    if (formData.presentSamplingDate && dateOfStocking) {
      const d1 = new Date(dateOfStocking);
      const d2 = new Date(formData.presentSamplingDate);
      const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
      return Math.max(1, diff || (tank.doc || 45));
    }
    return tank.doc || 45;
  }, [formData.presentSamplingDate, dateOfStocking, tank.doc]);

  // 3. AUTO-CALCULATED FIELDS
  // a) Duration Between Sampling (days)
  const durationBetweenSampling = useMemo(() => {
    if (formData.previousSamplingDate && formData.presentSamplingDate) {
      const d1 = new Date(formData.previousSamplingDate);
      const d2 = new Date(formData.presentSamplingDate);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    return 7;
  }, [formData.previousSamplingDate, formData.presentSamplingDate]);

  // b) Present ABW (g) = 1000 / Present Count
  const presentAbwNum = useMemo(() => {
    const count = parseFloat(formData.presentCount);
    if (count > 0) {
      return parseFloat((1000 / count).toFixed(2));
    }
    // Fallback if user enters Biomass and Number
    const bio = parseFloat(formData.biomass);
    const num = parseFloat(formData.number);
    if (bio > 0 && num > 0) {
      return parseFloat(((bio * 1000) / num).toFixed(2));
    }
    return null;
  }, [formData.presentCount, formData.biomass, formData.number]);

  // c) Last ABW (g) = 1000 / Last Count
  const lastAbwNum = useMemo(() => {
    const count = parseFloat(formData.lastCount);
    if (count > 0) {
      return parseFloat((1000 / count).toFixed(2));
    }
    return null;
  }, [formData.lastCount]);

  // Dynamic suggestions for user fields (only when user has not manually modified them)
  useEffect(() => {
    if (isViewOnly) return;
    if (presentAbwNum != null && lastAbwNum != null) {
      const growth = parseFloat((presentAbwNum - lastAbwNum).toFixed(2));
      if (!touchedFields.weeklyGrowthIncrement && !isNaN(growth)) {
        setFormData(prev => ({ ...prev, weeklyGrowthIncrement: String(growth) }));
      }
      if (!touchedFields.adgWeek && durationBetweenSampling > 0 && !isNaN(growth)) {
        const adg = (growth / durationBetweenSampling).toFixed(2);
        setFormData(prev => ({ ...prev, adgWeek: String(adg) }));
      }
    }
    if (presentAbwNum != null && currentDoc > 0 && !touchedFields.overallAdg) {
      const oAdg = (presentAbwNum / currentDoc).toFixed(2);
      setFormData(prev => ({ ...prev, overallAdg: String(oAdg) }));
    }
    // Auto-calculate FCR if TCF and Biomass provided
    const tcf = parseFloat(formData.cumulativeFeed);
    const bio = parseFloat(formData.biomass);
    if (tcf > 0 && bio > 0 && !touchedFields.fcr) {
      const calcFcr = (tcf / bio).toFixed(2);
      setFormData(prev => ({ ...prev, fcr: String(calcFcr) }));
    }
    // Auto-calculate Survival % if Number and Seed Stocked provided
    const pop = parseFloat(formData.number);
    if (pop > 0 && seedStocked > 0 && !touchedFields.survival) {
      const calcSurv = Math.min(100, (pop / seedStocked) * 100).toFixed(1);
      setFormData(prev => ({ ...prev, survival: String(calcSurv) }));
    }
  }, [presentAbwNum, lastAbwNum, durationBetweenSampling, currentDoc, formData.cumulativeFeed, formData.biomass, formData.number, touchedFields, isViewOnly, seedStocked]);

  const handleChange = (field, value) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewOnly) {
      onClose();
      return;
    }

    // Validation
    if (!formData.presentSamplingDate) {
      setErrorMsg('Please select a Present Sampling Date.');
      return;
    }
    if (!formData.presentCount || parseFloat(formData.presentCount) <= 0) {
      setErrorMsg('Please enter a valid Present Count (pieces/kg).');
      return;
    }

    const payload = {
      id: existingEntry?.id || `SMP-${Date.now()}`,
      tankId: tank.id,
      tankNumber,
      acres,
      dateOfStocking,
      doc: currentDoc,
      stockDensity: `${stockDensity} pcs/sq.m`,
      
      // Auto-calculated fields
      durationBetweenSampling,
      durationDays: durationBetweenSampling,
      presentAbw: presentAbwNum != null ? `${presentAbwNum}g` : '--',
      presentAbwNum: presentAbwNum || 0,
      lastAbw: lastAbwNum != null ? `${lastAbwNum}g` : '--',
      lastAbwNum: lastAbwNum || 0,

      // User fields
      previousSamplingDate: formData.previousSamplingDate,
      presentSamplingDate: formData.presentSamplingDate,
      date: formData.presentSamplingDate,
      presentCount: parseFloat(formData.presentCount) || 0,
      lastCount: parseFloat(formData.lastCount) || 0,
      weeklyGrowthIncrement: parseFloat(formData.weeklyGrowthIncrement) || (presentAbwNum && lastAbwNum ? parseFloat((presentAbwNum - lastAbwNum).toFixed(2)) : 0),
      adgWeek: parseFloat(formData.adgWeek) || 0,
      overallAdg: parseFloat(formData.overallAdg) || 0,
      dayFeed: parseFloat(formData.dayFeed) || 0,
      number: parseFloat(formData.number) || 0,
      cumulativeFeed: parseFloat(formData.cumulativeFeed) || 0,
      noBasedOnTcf: parseFloat(formData.noBasedOnTcf) || 0,
      biomass: parseFloat(formData.biomass) || 0,
      survival: parseFloat(formData.survival) || 0,
      fcr: parseFloat(formData.fcr) || 1.15,
      createdAt: new Date().toISOString(),
    };

    if (onSave) {
      onSave(payload);
    }
    onClose();
  };

  return createPortal(
    <div 
      className="animate-backdrop-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div 
        className="animate-modal-in"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* MODAL HEADER */}
        {/* ========================================================= */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAFC',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              color: '#1A2FB8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #BFDBFE'
            }}>
              <Activity size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>
                  {isViewOnly ? 'Sampling Data Inspection' : (existingEntry ? 'Edit Sampling Record' : 'New Sampling Entry')}
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#1A2FB8',
                  backgroundColor: '#EFF6FF',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #BFDBFE'
                }}>
                  {tankNumber}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                Farmer: <strong style={{ color: '#0F172A' }}>{farmer?.name || 'Farmer'}</strong> • Culture Cycle Tracking
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ========================================================= */}
        {/* MODAL BODY (SCROLLABLE) */}
        {/* ========================================================= */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              borderRadius: '8px',
              border: '1px solid #FECACA',
              fontSize: '12.5px',
              fontWeight: '600'
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* PART 1: INBUILT FIELDS (AUTO-FILLED) */}
          {/* ------------------------------------------------------------- */}
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#1A2FB8', letterSpacing: '0.04em' }}>
                  Part 1: Inbuilt Fields
                </span>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#15803D', backgroundColor: '#DCFCE7', padding: '1px 6px', borderRadius: '4px', border: '1px solid #BBF7D0' }}>
                  ✓ Auto-filled from Tank
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Fetched automatically
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
            }}>
              {/* Tank Number */}
              <div style={inbuiltFieldBox}>
                <span style={inbuiltLabel}>Tank Number</span>
                <span style={inbuiltValue}>{tankNumber}</span>
              </div>

              {/* Acres */}
              <div style={inbuiltFieldBox}>
                <span style={inbuiltLabel}>Acres</span>
                <span style={inbuiltValue}>{acres} Acres</span>
              </div>

              {/* Date of Stocking */}
              <div style={inbuiltFieldBox}>
                <span style={inbuiltLabel}>Date of Stocking</span>
                <span style={inbuiltValue}>{dateOfStocking}</span>
              </div>

              {/* DOC (Days of Culture) */}
              <div style={{ ...inbuiltFieldBox, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}>
                <span style={{ ...inbuiltLabel, color: '#1D4ED8' }}>DOC (Culture Days)</span>
                <span style={{ ...inbuiltValue, color: '#1A2FB8' }}>Day {currentDoc}</span>
              </div>

              {/* Stock Density */}
              <div style={inbuiltFieldBox}>
                <span style={inbuiltLabel}>Stock Density</span>
                <span style={inbuiltValue}>{stockDensity} pcs/m²</span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* PART 3: AUTO-CALCULATED FIELDS (Displayed prominently) */}
          {/* ------------------------------------------------------------- */}
          <div style={{
            backgroundColor: '#F0FDF4',
            borderRadius: '12px',
            border: '1.5px solid #BBF7D0',
            padding: '14px 16px',
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calculator size={15} color="#059669" />
                <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#047857', letterSpacing: '0.04em' }}>
                  Part 3: Auto-Calculated Fields
                </span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#059669', backgroundColor: '#E6F4EA', padding: '1px 6px', borderRadius: '4px' }}>
                  Real-time
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>
                Calculated dynamically from inputs
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}>
              {/* Duration Between Sampling */}
              <div style={autoCalcCard}>
                <span style={autoCalcLabel}>Duration Between Sampling</span>
                <div style={autoCalcValue}>
                  {durationBetweenSampling} <span style={{ fontSize: '13px', fontWeight: '600', color: '#047857' }}>Days</span>
                </div>
                <span style={autoCalcHint}>
                  {formData.previousSamplingDate || 'Start'} → {formData.presentSamplingDate || 'Today'}
                </span>
              </div>

              {/* Present ABW (g) */}
              <div style={{ ...autoCalcCard, borderColor: '#86EFAC', backgroundColor: '#FFFFFF' }}>
                <span style={autoCalcLabel}>Present ABW (Average Weight)</span>
                <div style={{ ...autoCalcValue, color: '#047857' }}>
                  {presentAbwNum != null ? `${presentAbwNum}` : '--'} <span style={{ fontSize: '13px', fontWeight: '600', color: '#047857' }}>g</span>
                </div>
                <span style={autoCalcHint}>
                  {formData.presentCount ? `Formula: 1000 / ${formData.presentCount} Count` : 'Enter Present Count'}
                </span>
              </div>

              {/* Last ABW */}
              <div style={autoCalcCard}>
                <span style={autoCalcLabel}>Last ABW</span>
                <div style={autoCalcValue}>
                  {lastAbwNum != null ? `${lastAbwNum}` : '--'} <span style={{ fontSize: '13px', fontWeight: '600', color: '#047857' }}>g</span>
                </div>
                <span style={autoCalcHint}>
                  {formData.lastCount ? `Formula: 1000 / ${formData.lastCount} Count` : 'Enter Last Count'}
                </span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* PART 2: USER INPUT FIELDS */}
          {/* ------------------------------------------------------------- */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#0F172A', letterSpacing: '0.04em' }}>
                  Part 2: User Input Fields
                </span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  (Agent entry parameters)
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                * indicates key sampling fields
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
            }}>
              {/* Previous Sampling Date */}
              <div>
                <label style={fieldLabel}>Previous Sampling Date *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    value={formData.previousSamplingDate}
                    onChange={(e) => handleChange('previousSamplingDate', e.target.value)}
                    style={inputStyle}
                    disabled={isViewOnly}
                    required
                  />
                </div>
              </div>

              {/* Present Sampling Date */}
              <div>
                <label style={fieldLabel}>Present Sampling Date *</label>
                <input
                  type="date"
                  value={formData.presentSamplingDate}
                  onChange={(e) => handleChange('presentSamplingDate', e.target.value)}
                  style={inputStyle}
                  disabled={isViewOnly}
                  required
                />
              </div>

              {/* Present Count */}
              <div>
                <label style={fieldLabel}>
                  Present Count (pcs/kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  placeholder="e.g. 50"
                  value={formData.presentCount}
                  onChange={(e) => handleChange('presentCount', e.target.value)}
                  style={{ ...inputStyle, borderColor: formData.presentCount ? '#059669' : '#CBD5E1' }}
                  disabled={isViewOnly}
                  required
                />
              </div>

              {/* Last Count */}
              <div>
                <label style={fieldLabel}>Last Count (pcs/kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  placeholder="e.g. 60"
                  value={formData.lastCount}
                  onChange={(e) => handleChange('lastCount', e.target.value)}
                  style={inputStyle}
                  disabled={isViewOnly}
                />
              </div>

              {/* Weekly Growth Increment (g) */}
              <div>
                <label style={fieldLabel}>Weekly Growth Increment (g)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 3.33"
                  value={formData.weeklyGrowthIncrement}
                  onChange={(e) => handleChange('weeklyGrowthIncrement', e.target.value)}
                  style={inputStyle}
                  disabled={isViewOnly}
                />
              </div>

              {/* ADG for Week (g) */}
              <div>
                <label style={fieldLabel}>ADG for Week (g/day)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 0.48"
                  value={formData.adgWeek}
                  onChange={(e) => handleChange('adgWeek', e.target.value)}
                  style={inputStyle}
                  disabled={isViewOnly}
                />
              </div>

              {/* Overall ADG */}
              <div>
                <label style={fieldLabel}>Overall ADG (g/day)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 0.44"
                  value={formData.overallAdg}
                  onChange={(e) => handleChange('overallAdg', e.target.value)}
                  style={inputStyle}
                  disabled={isViewOnly}
                />
              </div>

              {/* Day Feed */}
              <div>
                <label style={fieldLabel}>Day Feed (kg/day)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g. 240"
                  value={formData.dayFeed}
                  onChange={(e) => handleChange('dayFeed', e.target.value)}
                  style={inputStyle}
                  disabled={isViewOnly}
                />
              </div>

              {/* Number (Population pcs) */}
              <div>
                <label style={fieldLabel}>Number (Estimated Population)</label>
                <input
                  type="number"
                  step="100"
                  placeholder="e.g. 210000"
                  value={formData.number}
                  onChange={(e) => handleChange('number', e.target.value)}
                  style={inputStyle}
                  disabled={isViewOnly}
                />
              </div>

              {/* Cumulative Feed (TCF) */}
              <div>
                <label style={fieldLabel}>Cumulative Feed (TCF kg)</label>
                <input
                  type="number"
                  step="1"
                  placeholder="e.g. 4800"
                  value={formData.cumulativeFeed}
                  onChange={(e) => handleChange('cumulativeFeed', e.target.value)}
                  style={inputStyle}
                  disabled={isViewOnly}
                />
              </div>

              {/* No. Based on TCF */}
              <div>
                <label style={fieldLabel}>No. Based on TCF</label>
                <input
                  type="number"
                  step="100"
                  placeholder="e.g. 208000"
                  value={formData.noBasedOnTcf}
                  onChange={(e) => handleChange('noBasedOnTcf', e.target.value)}
                  style={inputStyle}
                  disabled={isViewOnly}
                />
              </div>

              {/* Biomass */}
              <div>
                <label style={fieldLabel}>Biomass (kg)</label>
                <input
                  type="number"
                  step="1"
                  placeholder="e.g. 4200"
                  value={formData.biomass}
                  onChange={(e) => handleChange('biomass', e.target.value)}
                  style={inputStyle}
                  disabled={isViewOnly}
                />
              </div>

              {/* Survival (%) */}
              <div>
                <label style={fieldLabel}>Survival (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g. 84.0"
                  value={formData.survival}
                  onChange={(e) => handleChange('survival', e.target.value)}
                  style={inputStyle}
                  disabled={isViewOnly}
                />
              </div>

              {/* FCR */}
              <div>
                <label style={fieldLabel}>FCR (Feed Conversion Ratio)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1.15"
                  value={formData.fcr}
                  onChange={(e) => handleChange('fcr', e.target.value)}
                  style={inputStyle}
                  disabled={isViewOnly}
                />
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* MODAL FOOTER BUTTONS */}
          {/* ========================================================= */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px',
            marginTop: '8px',
            paddingTop: '16px',
            borderTop: '1px solid #E2E8F0',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
              className="hover:bg-slate-50 transition-colors"
            >
              {isViewOnly ? 'Close' : 'Cancel'}
            </button>

            {!isViewOnly && (
              <button
                type="submit"
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#1A2FB8',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(26, 47, 184, 0.25)'
                }}
                className="hover:brightness-110 active:scale-98 transition-all"
              >
                <Save size={15} />
                <span>Save Sampling Entry</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// Sub-styles
const inbuiltFieldBox = {
  backgroundColor: '#FFFFFF',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #E2E8F0',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const inbuiltLabel = {
  fontSize: '10.5px',
  fontWeight: '700',
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
};

const inbuiltValue = {
  fontSize: '13px',
  fontWeight: '800',
  color: '#0F172A',
};

const autoCalcCard = {
  backgroundColor: '#FFFFFF',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #D1FAE5',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const autoCalcLabel = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#065F46',
};

const autoCalcValue = {
  fontSize: '19px',
  fontWeight: '800',
  color: '#047857',
  lineHeight: 1.2,
};

const autoCalcHint = {
  fontSize: '10px',
  color: '#64748B',
  marginTop: '2px',
};

const fieldLabel = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '700',
  color: '#334155',
  marginBottom: '4px',
};

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid #CBD5E1',
  fontSize: '13px',
  color: '#0F172A',
  backgroundColor: '#FFFFFF',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
};

export default SamplingModal;
