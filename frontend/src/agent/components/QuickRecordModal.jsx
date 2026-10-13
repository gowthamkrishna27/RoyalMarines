import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Droplets, MapPin, CheckCircle, RefreshCw, ChevronDown,
  Check, Plus, Lock, Calendar, Clock, ChevronUp, Scale
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';
import { getInchargeSession } from '../../incharge/utils/inchargeAuth';
import { getStoredGPS, captureDeviceGPS, requestSubmissionGPS } from '../utils/gpsService';
import { queueOfflineRecord } from '../utils/syncService';
import MarineLoader from '../../components/MarineLoader';

const QuickRecordModal = ({
  isOpen,
  onClose,
  initialType = 'WATER_QUALITY',
  preselectedFarmerId = null,
  preselectedTankId = null,
  onSuccess,
  userRole = null
}) => {
  const { db, getFarmersByAgentId, getTanksByFarmerId, recordFieldEntry } = useMockData();
  const session = getSession();
  const inchargeSession = getInchargeSession();

  const isIncharge = Boolean(
    userRole === 'INCHARGE' ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/incharge')) ||
    (inchargeSession && inchargeSession.inchargeId && !session?.agentId)
  );

  const currentInchargeId = inchargeSession?.inchargeId || 'INC001';
  const currentAgentId = session?.agentId || 'agent001';

  // Active module: default to WATER_QUALITY
  const [activeTab, setActiveTab] = useState(initialType || 'WATER_QUALITY');
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);

  // Farmers and Tanks
  const assignedFarmers = getFarmersByAgentId ? getFarmersByAgentId(currentAgentId) : (db?.farmers || []);
  const [selectedFarmerId, setSelectedFarmerId] = useState(preselectedFarmerId || assignedFarmers[0]?.id || '');

  const farmerTanks = getTanksByFarmerId ? getTanksByFarmerId(selectedFarmerId) : (db?.tanks || []).filter(t => t.farmerId === selectedFarmerId);
  const tanks = farmerTanks;
  const [selectedTankId, setSelectedTankId] = useState(preselectedTankId || tanks[0]?.id || '');

  // GPS & Submission States
  const [gpsData, setGpsData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState(null);

  // Minimal Necessary Water Quality Parameters
  const [waterForm, setWaterForm] = useState({
    date: new Date().toISOString().split('T')[0],
    doc: '',
    salinity: '',
    ph: '',
    do: '',
    temperature: '',
    // Optional deeper params kept available in state
    alkalinity: '',
    hardness: '',
    ammonia: '',
    nitrite: '',
    notes: '',
  });

  // Dedicated Harvest form if opened with initialType === 'HARVEST_ENTRY'
  const [harvestForm, setHarvestForm] = useState({
    harvestType: 'Partial Harvest',
    date: new Date().toISOString().split('T')[0],
    doc: '',
    abw: '',
    harvestedNumber: '',
    harvestedBiomass: '',
    remarks: '',
  });

  // Keep farmer & tank synced
  useEffect(() => {
    if (preselectedFarmerId) setSelectedFarmerId(preselectedFarmerId);
  }, [preselectedFarmerId]);

  useEffect(() => {
    if (preselectedTankId) setSelectedTankId(preselectedTankId);
  }, [preselectedTankId]);

  useEffect(() => {
    if (initialType) setActiveTab(initialType);
  }, [initialType]);

  useEffect(() => {
    const fTanks = getTanksByFarmerId ? getTanksByFarmerId(selectedFarmerId) : [];
    if (fTanks.length > 0 && !fTanks.some(t => t.id === selectedTankId)) {
      setSelectedTankId(fTanks[0].id);
    }
  }, [selectedFarmerId]);

  // Load GPS
  useEffect(() => {
    if (!isOpen) return;
    const stored = getStoredGPS(180000);
    if (stored) {
      setGpsData(stored);
      if (stored.isStale) {
        refreshGPS();
      }
    } else {
      refreshGPS();
    }
  }, [isOpen]);

  const refreshGPS = async () => {
    setGpsLoading(true);
    try {
      const live = await captureDeviceGPS({ timeout: 15000, desiredAccuracy: 20 });
      setGpsData(live);
    } catch {
      const stored = getStoredGPS();
      if (stored) setGpsData(stored);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSalinityChange = (val) => {
    const num = parseFloat(val);
    setWaterForm(prev => ({
      ...prev,
      salinity: val,
      hardness: !isNaN(num) && num > 0 ? String(Math.round(num * 300)) : prev.hardness,
    }));
  };

  if (!isOpen) return null;

  // Selected Tank Status Check
  const selectedTank = tanks.find(t => t.id === selectedTankId);
  const isSelectedTankClosed = selectedTank?.status === 'Harvested' || selectedTank?.status === 'Completed';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSelectedTankClosed) {
      alert('This tank has already completed its final harvest. No further records can be entered.');
      return;
    }

    setIsSubmitting(true);

    let locationFix;
    try {
      // Capture device GPS at the exact moment of pressing Submit
      locationFix = await requestSubmissionGPS({ timeout: 12000 });
      setGpsData(locationFix);
    } catch (err) {
      setIsSubmitting(false);
      alert('Location access is required to submit this record. Please enable location permission and try again.');
      return;
    }

    const farmer = assignedFarmers.find(f => f.id === selectedFarmerId);
    const tank = tanks.find(p => p.id === selectedTankId);
    const farmerName = farmer?.name || 'Farmer';
    const tankName = tank?.name || 'Tank 1';

    const isHarvest = activeTab === 'HARVEST_ENTRY';
    const testTypeName = isHarvest ? 'Harvest' : 'Water Analysis';
    const formData = isHarvest ? harvestForm : waterForm;

    const recordId = `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date(locationFix.timestamp || Date.now());
    const formattedDate = now.toISOString().split('T')[0];
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const resolvedRole = isIncharge ? 'Incharge' : 'Agent';
    const resolvedUserId = isIncharge
      ? (inchargeSession?.inchargeId || inchargeSession?.id || 'INC001')
      : (session?.agentId || session?.id || 'agent001');
    const resolvedUserName = isIncharge
      ? (inchargeSession?.name || 'Incharge')
      : (session?.name || 'Ramesh');

    const submissionPayload = {
      id: recordId,
      submissionId: recordId,
      userId: resolvedUserId,
      userName: resolvedUserName,
      role: resolvedRole,
      agentId: resolvedUserId,
      agentName: resolvedUserName,
      inchargeId: isIncharge ? resolvedUserId : (session?.inchargeId || 'INC001'),
      submittedBy: resolvedRole,
      farmerId: selectedFarmerId,
      farmerName,
      tankId: selectedTankId,
      tankName,
      testType: testTypeName,
      recordType: isHarvest ? 'HARVEST_ENTRY' : 'WATER_QUALITY',
      date: formattedDate,
      time: formattedTime,
      submissionTime: formattedTime,
      timestamp: now.toISOString(),
      submittedAt: now.toISOString(),
      latitude: locationFix.latitude,
      longitude: locationFix.longitude,
      accuracy: locationFix.accuracy,
      locality: locationFix.locality || (farmer?.location || 'Coastal Aquaculture Zone'),
      data: formData,
      gps: {
        latitude: locationFix.latitude,
        longitude: locationFix.longitude,
        accuracy: locationFix.accuracy,
        timestamp: locationFix.timestamp,
        locality: locationFix.locality,
        verified: true,
      },
      readOnly: true,
      lockedAt: now.toISOString(),
    };

    try {
      if (recordFieldEntry) {
        await recordFieldEntry(submissionPayload);
      } else {
        queueOfflineRecord(submissionPayload);
      }

      setIsSubmitting(false);
      setSubmittedRecord(submissionPayload);
      if (onSuccess) onSuccess(submissionPayload);
    } catch (saveErr) {
      setIsSubmitting(false);
      alert('Failed to save record: ' + (saveErr.message || 'Error occurred'));
    }
  };

  // 1. Loading State
  if (isSubmitting) {
    return createPortal(
      <div style={styles.overlay}>
        <div style={styles.modalCardLoading}>
          <MarineLoader message="Acquiring GPS & Submitting..." size="compact" />
        </div>
      </div>,
      document.body
    );
  }

  // 2. Success State
  if (submittedRecord) {
    return createPortal(
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
          <div style={styles.successBox}>
            <div style={styles.successIconCircle}>
              <CheckCircle size={38} color="#16A34A" />
            </div>
            <h3 style={styles.successTitle}>Record Saved</h3>
            <p style={styles.successSub}>
              {submittedRecord.testType} for <strong>{submittedRecord.farmerName}</strong> • <strong>{submittedRecord.tankName}</strong>
            </p>

            {/* Summary Pills */}
            <div style={styles.successPillGrid}>
              <div style={styles.successPill}>
                <span style={styles.successPillLabel}>Salinity</span>
                <strong style={styles.successPillVal}>{waterForm.salinity} ppt</strong>
              </div>
              <div style={styles.successPill}>
                <span style={styles.successPillLabel}>pH</span>
                <strong style={styles.successPillVal}>{waterForm.ph}</strong>
              </div>
              <div style={styles.successPill}>
                <span style={styles.successPillLabel}>DO</span>
                <strong style={styles.successPillVal}>{waterForm.do} mg/L</strong>
              </div>
              <div style={styles.successPill}>
                <span style={styles.successPillLabel}>Temp</span>
                <strong style={styles.successPillVal}>{waterForm.temperature} °C</strong>
              </div>
            </div>

            <button
              type="button"
              className="transition-all duration-150 active:scale-95 cursor-pointer"
              style={styles.primaryBtn}
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // 3. Main Minimal Modal Card
  return createPortal(
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIconCircle}>
              {activeTab === 'HARVEST_ENTRY' ? (
                <Scale size={18} color="#1A2FB8" strokeWidth={2.4} />
              ) : (
                <Droplets size={18} color="#1A2FB8" strokeWidth={2.4} />
              )}
            </div>
            <div>
              <h2 style={styles.title}>
                {activeTab === 'HARVEST_ENTRY' ? 'New Harvest Entry' : 'New Test Record'}
              </h2>
              <p style={styles.subtitle}>
                {activeTab === 'HARVEST_ENTRY' ? 'Log pond harvest data' : 'Enter necessary water parameters'}
              </p>
            </div>
          </div>
          <button
            type="button"
            style={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} color="#64748B" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.formBody}>
          {assignedFarmers.length === 0 && (
            <div style={{ padding: '10px 14px', backgroundColor: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA', color: '#991B1B', fontSize: '13px', lineHeight: 1.4 }}>
              No farmers registered yet. Please register a farmer first to log field records.
            </div>
          )}

          {/* Target Farmer & Tank Selectors */}
          <div style={styles.twoColRow}>
            <div style={styles.fieldCol}>
              <label style={styles.label}>Farmer</label>
              <div style={styles.selectWrap}>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  style={styles.select}
                  required
                >
                  {assignedFarmers.length > 0 ? (
                    assignedFarmers.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))
                  ) : (
                    <option value="">No farmers registered</option>
                  )}
                </select>
                <ChevronDown size={14} color="#64748B" style={styles.selectArrow} />
              </div>
            </div>

            <div style={styles.fieldCol}>
              <label style={styles.label}>Tank</label>
              <div style={styles.selectWrap}>
                <select
                  value={selectedTankId}
                  onChange={(e) => setSelectedTankId(e.target.value)}
                  style={styles.select}
                  required
                >
                  {tanks.length > 0 ? (
                    tanks.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))
                  ) : (
                    <option value="">No tanks available</option>
                  )}
                </select>
                <ChevronDown size={14} color="#64748B" style={styles.selectArrow} />
              </div>
            </div>
          </div>

          {/* Date & DOC */}
          <div style={styles.twoColRow}>
            <div style={styles.fieldCol}>
              <label style={styles.label}>Date</label>
              <input
                type="date"
                value={waterForm.date}
                onChange={(e) => setWaterForm({ ...waterForm, date: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.fieldCol}>
              <label style={styles.label}>DOC (Days)</label>
              <input
                type="number"
                value={waterForm.doc}
                onChange={(e) => setWaterForm({ ...waterForm, doc: e.target.value })}
                placeholder="35"
                style={styles.input}
                min="1"
                required
              />
            </div>
          </div>

          {/* Core Necessary Parameters (2x2 Grid) */}
          <div style={styles.sectionHeader}>
            <span style={styles.sectionLabel}>NECESSARY PARAMETERS</span>
          </div>

          <div style={styles.paramGrid}>
            {/* 1. Salinity */}
            <div style={styles.paramCard}>
              <div style={styles.paramHeader}>
                <span style={styles.paramTitle}>Salinity</span>
                <span style={styles.paramUnit}>ppt</span>
              </div>
              <input
                type="number"
                step="0.1"
                value={waterForm.salinity}
                onChange={(e) => handleSalinityChange(e.target.value)}
                placeholder="16.0"
                style={styles.paramInput}
                required
              />
            </div>

            {/* 2. pH */}
            <div style={styles.paramCard}>
              <div style={styles.paramHeader}>
                <span style={styles.paramTitle}>pH Level</span>
                <span style={styles.paramUnit}>7.5 - 8.3</span>
              </div>
              <input
                type="number"
                step="0.1"
                value={waterForm.ph}
                onChange={(e) => setWaterForm({ ...waterForm, ph: e.target.value })}
                placeholder="7.8"
                style={styles.paramInput}
                required
              />
            </div>

            {/* 3. Dissolved Oxygen (DO) */}
            <div style={styles.paramCard}>
              <div style={styles.paramHeader}>
                <span style={styles.paramTitle}>D.O.</span>
                <span style={styles.paramUnit}>mg/L</span>
              </div>
              <input
                type="number"
                step="0.1"
                value={waterForm.do}
                onChange={(e) => setWaterForm({ ...waterForm, do: e.target.value })}
                placeholder="5.6"
                style={styles.paramInput}
                required
              />
            </div>

            {/* 4. Temperature */}
            <div style={styles.paramCard}>
              <div style={styles.paramHeader}>
                <span style={styles.paramTitle}>Temperature</span>
                <span style={styles.paramUnit}>°C</span>
              </div>
              <input
                type="number"
                step="0.1"
                value={waterForm.temperature}
                onChange={(e) => setWaterForm({ ...waterForm, temperature: e.target.value })}
                placeholder="28.5"
                style={styles.paramInput}
                required
              />
            </div>
          </div>

          {/* Optional Collapsible More Parameters */}
          <div style={{ marginTop: '10px' }}>
            <button
              type="button"
              style={styles.moreToggleBtn}
              onClick={() => setShowAdvancedParams(!showAdvancedParams)}
            >
              <span>{showAdvancedParams ? 'Hide' : '+ More'} Parameters (Ammonia, Alkalinity)</span>
              {showAdvancedParams ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAdvancedParams && (
              <div style={styles.advancedGrid}>
                <div style={styles.paramCardSmall}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitleSmall}>Alkalinity</span>
                    <span style={styles.paramUnit}>ppm</span>
                  </div>
                  <input
                    type="number"
                    value={waterForm.alkalinity}
                    onChange={(e) => setWaterForm({ ...waterForm, alkalinity: e.target.value })}
                    placeholder="140"
                    style={styles.paramInputSmall}
                  />
                </div>

                <div style={styles.paramCardSmall}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitleSmall}>Ammonia (NH3)</span>
                    <span style={styles.paramUnit}>ppm</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={waterForm.ammonia}
                    onChange={(e) => setWaterForm({ ...waterForm, ammonia: e.target.value })}
                    placeholder="0.05"
                    style={styles.paramInputSmall}
                  />
                </div>
              </div>
            )}
          </div>

          {/* GPS Verified Status Pill */}
          <div style={styles.gpsRow}>
            <div style={styles.gpsBadge}>
              <span style={{ ...styles.gpsDot, backgroundColor: gpsLoading ? '#3B82F6' : '#16A34A' }} />
              <span style={styles.gpsText}>
                {gpsLoading
                  ? 'Acquiring high-accuracy GPS...'
                  : `${gpsData?.locality || 'Chinnamiram, Bhimavaram'} • ±${gpsData?.accuracy || 8}m GPS`}
              </span>
            </div>
            <button
              type="button"
              onClick={refreshGPS}
              style={styles.gpsRefreshBtn}
              title="Refresh high-accuracy GPS"
              disabled={gpsLoading}
            >
              <RefreshCw size={12} color={gpsLoading ? '#3B82F6' : '#64748B'} className={gpsLoading ? 'spin-animation' : ''} />
            </button>
          </div>

          {/* Action Buttons */}
          <div style={styles.actionRow}>
            <button
              type="button"
              style={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="transition-all duration-150 active:scale-95 cursor-pointer"
              style={styles.primaryBtn}
            >
              <Check size={16} strokeWidth={2.5} /> Save Record
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    boxSizing: 'border-box',
  },
  modalCard: {
    width: '100%',
    maxWidth: '430px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.22), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(226, 232, 240, 0.9)',
    overflow: 'hidden',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '92vh',
  },
  modalCardLoading: {
    width: '100%',
    maxWidth: '320px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: '36px 24px',
    textAlign: 'center',
    boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.2)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #F1F5F9',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerIconCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#EEF2FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 1.2,
    margin: 0,
  },
  subtitle: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '2px',
    margin: 0,
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    outline: 'none',
  },
  formBody: {
    padding: '16px 20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  twoColRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  fieldCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#475569',
  },
  selectWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  select: {
    width: '100%',
    height: '38px',
    padding: '0 28px 0 10px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    fontSize: '12.5px',
    color: '#0F172A',
    fontWeight: '500',
    appearance: 'none',
    cursor: 'pointer',
    outline: 'none',
  },
  selectArrow: {
    position: 'absolute',
    right: '10px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    height: '38px',
    padding: '0 10px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    fontSize: '12.5px',
    color: '#0F172A',
    fontWeight: '500',
    boxSizing: 'border-box',
    outline: 'none',
  },
  sectionHeader: {
    marginTop: '4px',
    marginBottom: '-4px',
  },
  sectionLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.4px',
  },
  paramGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  paramCard: {
    backgroundColor: '#F8FAFC',
    border: '1.5px solid #E2E8F0',
    borderRadius: '12px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    transition: 'border-color 0.15s ease',
  },
  paramHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paramTitle: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#475569',
  },
  paramUnit: {
    fontSize: '10px',
    color: '#94A3B8',
    fontWeight: '500',
  },
  paramInput: {
    border: 'none',
    background: 'transparent',
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
    outline: 'none',
    padding: 0,
    width: '100%',
  },
  moreToggleBtn: {
    background: 'none',
    border: 'none',
    color: '#2563EB',
    fontSize: '11.5px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: 0,
    cursor: 'pointer',
    outline: 'none',
  },
  advancedGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '8px',
  },
  paramCardSmall: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  paramTitleSmall: {
    fontSize: '10.5px',
    fontWeight: '600',
    color: '#64748B',
  },
  paramInputSmall: {
    border: 'none',
    background: 'transparent',
    fontSize: '14px',
    fontWeight: '600',
    color: '#0F172A',
    outline: 'none',
    padding: 0,
    width: '100%',
  },
  gpsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '6px 10px',
    marginTop: '2px',
  },
  gpsBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  gpsDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#16A34A',
  },
  gpsText: {
    fontSize: '10.5px',
    color: '#475569',
    fontWeight: '500',
  },
  gpsRefreshBtn: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '8px',
  },
  cancelBtn: {
    flex: '1',
    height: '40px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    color: '#64748B',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    outline: 'none',
  },
  primaryBtn: {
    flex: '2',
    height: '40px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #2563EB 0%, #1A2FB8 100%)',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
    outline: 'none',
  },
  successBox: {
    padding: '32px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  successIconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#DCFCE7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  successSub: {
    fontSize: '12.5px',
    color: '#64748B',
    margin: 0,
  },
  successPillGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    width: '100%',
    margin: '8px 0',
  },
  successPill: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  successPillLabel: {
    fontSize: '10px',
    color: '#64748B',
    fontWeight: '500',
  },
  successPillVal: {
    fontSize: '13px',
    color: '#1A2FB8',
    fontWeight: '700',
    marginTop: '1px',
  },
};

export default QuickRecordModal;
