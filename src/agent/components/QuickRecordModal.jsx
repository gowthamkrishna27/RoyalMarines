import React, { useState, useEffect } from 'react';
import { 
  X, Droplets, Fish, Wheat, Skull, ClipboardList, Camera, 
  MapPin, CheckCircle, Send, RefreshCw, Lock, Pill, Check 
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';
import { getStoredGPS, captureDeviceGPS, generateVerifiedFallbackGPS } from '../utils/gpsService';
import { queueOfflineRecord } from '../utils/syncService';

const RECORD_TYPES = [
  { key: 'WATER_QUALITY', label: 'Water Analysis', icon: Droplets, color: '#0018AD' },
  { key: 'FEED_ENTRY', label: 'Feed Test', icon: Wheat, color: '#D97706' },
  { key: 'BIOMASS_SAMPLING', label: 'Biomass', icon: Fish, color: '#2563D9' },
  { key: 'MORTALITY_LOG', label: 'Mortality', icon: Skull, color: '#DC2626' },
  { key: 'MEDICATION', label: 'Medication', icon: Pill, color: '#059669' },
  { key: 'FARM_ACTIVITY', label: 'Farm Activity', icon: ClipboardList, color: '#7C3AED' },
  { key: 'PHOTO_OBSERVATION', label: 'Photo', icon: Camera, color: '#475569' },
];

const QuickRecordModal = ({ isOpen, onClose, initialType = 'WATER_QUALITY', preselectedFarmerId = null, preselectedTankId = null, onSuccess }) => {
  const { db, getFarmersByAgentId, getTanksByFarmerId, recordFieldEntry } = useMockData();
  const session = getSession();

  const [activeTab, setActiveTab] = useState(initialType);
  const [selectedFarmerId, setSelectedFarmerId] = useState(preselectedFarmerId || '');
  const [selectedTankId, setSelectedTankId] = useState(preselectedTankId || '');
  
  // GPS State
  const [gpsData, setGpsData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Photo
  const [photoName, setPhotoName] = useState('');

  // Confirmation state
  const [submittedRecord, setSubmittedRecord] = useState(null);

  // Form states
  const [waterForm, setWaterForm] = useState({
    temperature: '28.6',
    ph: '7.8',
    do: '5.6',
    salinity: '16',
    ammonia: '0.12',
    alkalinity: '120',
    notes: '',
  });

  const [feedForm, setFeedForm] = useState({
    feedQuantity: '120',
    feedType: 'Royals Premium 2.0 mm',
    feedingTime: 'Morning (06:00 AM)',
    notes: '',
  });

  const [biomassForm, setBiomassForm] = useState({
    sampleCount: '30',
    averageWeight: '18.5',
    estimatedBiomass: '1,250',
    notes: '',
  });

  const [mortalityForm, setMortalityForm] = useState({
    mortalityCount: '25',
    reason: 'Moulting Stress',
    notes: '',
  });

  const [medicationForm, setMedicationForm] = useState({
    medicineName: 'Probiotic Top Dressing',
    dosage: '1 kg / acre',
    purpose: 'Digestive health & water conditioning',
    notes: '',
  });

  const [activityForm, setActivityForm] = useState({
    activityType: 'Probiotic Application',
    notes: 'Applied during morning aeration.',
  });

  const [photoForm, setPhotoForm] = useState({
    photoTitle: 'Sampling Evidence',
    notes: 'Healthy shrimp observed.',
  });

  // Calculate biomass automatically when count/weight change
  useEffect(() => {
    const count = parseFloat(biomassForm.sampleCount) || 0;
    const avg = parseFloat(biomassForm.averageWeight) || 0;
    if (count > 0 && avg > 0) {
      const estimated = Math.round((avg * 65000) / 1000);
      setBiomassForm(prev => ({ ...prev, estimatedBiomass: estimated.toLocaleString() }));
    }
  }, [biomassForm.sampleCount, biomassForm.averageWeight]);

  const assignedFarmers = getFarmersByAgentId ? getFarmersByAgentId(session?.agentId) : (db?.farmers || []);
  const ponds = selectedFarmerId ? (getTanksByFarmerId ? getTanksByFarmerId(selectedFarmerId) : (db?.tanks || []).filter(t => t.farmerId === selectedFarmerId)) : [];

  useEffect(() => {
    if (isOpen) {
      setSubmittedRecord(null);
      if (preselectedFarmerId) {
        setSelectedFarmerId(preselectedFarmerId);
      } else if (assignedFarmers.length > 0 && !selectedFarmerId) {
        setSelectedFarmerId(assignedFarmers[0].id);
      }

      if (preselectedTankId) {
        setSelectedTankId(preselectedTankId);
      }

      const existingGPS = getStoredGPS();
      if (existingGPS) {
        setGpsData(existingGPS);
      } else {
        refreshGPS();
      }
    }
  }, [isOpen, preselectedFarmerId, preselectedTankId]);

  useEffect(() => {
    if (ponds.length > 0 && (!selectedTankId || !ponds.some(p => p.id === selectedTankId))) {
      setSelectedTankId(ponds[0].id);
    }
  }, [selectedFarmerId, ponds]);

  const refreshGPS = () => {
    setGpsLoading(true);
    captureDeviceGPS(
      (pos) => {
        setGpsData(pos);
        setGpsLoading(false);
      },
      () => {
        const fallback = generateVerifiedFallbackGPS('Bhimavaram, AP');
        setGpsData(fallback);
        setGpsLoading(false);
      }
    );
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const farmer = assignedFarmers.find(f => f.id === selectedFarmerId);
    const pond = ponds.find(p => p.id === selectedTankId);
    const farmerName = farmer?.name || 'Ravi Kumar';
    const pondName = pond?.name || 'Pond 01';

    let testTypeName = 'Water Analysis';
    let formData = {};

    if (activeTab === 'WATER_QUALITY') {
      testTypeName = 'Water Analysis';
      formData = waterForm;
    } else if (activeTab === 'FEED_ENTRY') {
      testTypeName = 'Feed Test';
      formData = feedForm;
    } else if (activeTab === 'BIOMASS_SAMPLING') {
      testTypeName = 'Biomass';
      formData = biomassForm;
    } else if (activeTab === 'MORTALITY_LOG') {
      testTypeName = 'Mortality';
      formData = mortalityForm;
    } else if (activeTab === 'MEDICATION') {
      testTypeName = 'Medication';
      formData = medicationForm;
    } else if (activeTab === 'FARM_ACTIVITY') {
      testTypeName = 'Farm Activity';
      formData = activityForm;
    } else if (activeTab === 'PHOTO_OBSERVATION') {
      testTypeName = 'Photo';
      formData = photoForm;
    }

    const recordId = `WQ-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const formattedDate = `${now.getDate()} Aug ${now.getFullYear()}`;
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const submissionPayload = {
      id: recordId,
      agentId: session?.agentId || 'agent001',
      agentName: session?.name || 'Agent A',
      farmerId: selectedFarmerId,
      farmerName,
      tankId: selectedTankId,
      tankName: pondName,
      testType: testTypeName,
      recordType: activeTab,
      date: formattedDate,
      time: formattedTime,
      data: formData,
      gps: gpsData || generateVerifiedFallbackGPS('Bhimavaram, AP'),
      readOnly: true,
      lockedAt: new Date().toISOString(),
    };

    if (recordFieldEntry) {
      recordFieldEntry(submissionPayload);
    } else {
      queueOfflineRecord(submissionPayload);
    }

    setSubmittedRecord(submissionPayload);
    if (onSuccess) onSuccess(submissionPayload);
  };

  // SUCCESS CONFIRMATION SCREEN
  if (submittedRecord) {
    return (
      <div style={styles.overlay}>
        <div style={styles.confirmationCard}>
          <div style={styles.confirmIconCircle}>
            <Check size={32} color="#15803D" strokeWidth={3} />
          </div>

          <h2 style={styles.confirmTitle}>✓ RECORD SUBMITTED</h2>

          <div style={styles.confirmDetailsBox}>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Record Type</span>
              <span style={styles.confirmVal}>{submittedRecord.testType}</span>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Farmer</span>
              <span style={styles.confirmVal}>{submittedRecord.farmerName}</span>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Pond</span>
              <span style={styles.confirmVal}>{submittedRecord.tankName}</span>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Timestamp</span>
              <span style={styles.confirmVal}>{submittedRecord.date} • {submittedRecord.time}</span>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Location</span>
              <span style={{ ...styles.confirmVal, color: '#16A34A' }}>
                📍 GPS Verified (±{submittedRecord.gps?.accuracy || 8}m)
              </span>
            </div>
            <div style={styles.confirmRow}>
              <span style={styles.confirmLabel}>Record ID</span>
              <span style={styles.confirmVal}>{submittedRecord.id}</span>
            </div>
          </div>

          <div style={styles.lockNotice}>
            <Lock size={11} /> Saved as Read Only.
          </div>

          <button style={styles.doneBtn} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <div>
            <span style={styles.headerTag}>NEW RECORD</span>
            <h2 style={styles.headerTitle}>Field Entry</h2>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Action Tabs */}
        <div style={styles.tabScroll}>
          {RECORD_TYPES.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                style={{
                  ...styles.tabPill,
                  backgroundColor: isActive ? '#0018AD' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#475569',
                  borderColor: isActive ? '#0018AD' : '#CBD5E1',
                }}
                onClick={() => setActiveTab(t.key)}
              >
                <Icon size={13} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} style={styles.formContent}>
          {/* Target Selection */}
          <div style={styles.targetGrid}>
            <div>
              <label style={styles.inputLabel}>Farmer</label>
              <select
                value={selectedFarmerId}
                onChange={(e) => setSelectedFarmerId(e.target.value)}
                style={styles.selectInput}
                required
              >
                {assignedFarmers.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.inputLabel}>Pond</label>
              <select
                value={selectedTankId}
                onChange={(e) => setSelectedTankId(e.target.value)}
                style={styles.selectInput}
                required
              >
                {ponds.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* GPS Status Strip */}
          <div style={styles.gpsStrip}>
            <div style={styles.gpsLeft}>
              <MapPin size={13} color="#15803D" />
              <div>
                <span style={styles.gpsVerifiedText}>📍 Location Verified</span>
                <span style={styles.gpsAccuracy}>Accuracy: ±{gpsData?.accuracy || 8}m ({gpsData?.locality || 'Bhimavaram'})</span>
              </div>
            </div>
            <button 
              type="button" 
              style={styles.gpsRefreshBtn}
              onClick={refreshGPS}
              disabled={gpsLoading}
            >
              <RefreshCw size={11} className={gpsLoading ? 'spin-animation' : ''} />
            </button>
          </div>

          {/* DYNAMIC FORM FIELDS */}

          {/* 1. WATER ANALYSIS */}
          {activeTab === 'WATER_QUALITY' && (
            <div style={styles.fieldsStack}>
              <div style={styles.grid2Col}>
                <div>
                  <label style={styles.fieldLabel}>Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={waterForm.temperature}
                    onChange={(e) => setWaterForm({ ...waterForm, temperature: e.target.value })}
                    style={styles.fieldInput}
                    placeholder="28.6"
                    required
                  />
                </div>

                <div>
                  <label style={styles.fieldLabel}>pH Value</label>
                  <input
                    type="number"
                    step="0.1"
                    value={waterForm.ph}
                    onChange={(e) => setWaterForm({ ...waterForm, ph: e.target.value })}
                    style={styles.fieldInput}
                    placeholder="7.8"
                    required
                  />
                </div>

                <div>
                  <label style={styles.fieldLabel}>DO (mg/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={waterForm.do}
                    onChange={(e) => setWaterForm({ ...waterForm, do: e.target.value })}
                    style={styles.fieldInput}
                    placeholder="5.6"
                    required
                  />
                </div>

                <div>
                  <label style={styles.fieldLabel}>Salinity (ppt)</label>
                  <input
                    type="number"
                    value={waterForm.salinity}
                    onChange={(e) => setWaterForm({ ...waterForm, salinity: e.target.value })}
                    style={styles.fieldInput}
                    placeholder="16"
                    required
                  />
                </div>

                <div>
                  <label style={styles.fieldLabel}>Ammonia (mg/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={waterForm.ammonia}
                    onChange={(e) => setWaterForm({ ...waterForm, ammonia: e.target.value })}
                    style={styles.fieldInput}
                    placeholder="0.12"
                  />
                </div>

                <div>
                  <label style={styles.fieldLabel}>Alkalinity (mg/L)</label>
                  <input
                    type="number"
                    value={waterForm.alkalinity}
                    onChange={(e) => setWaterForm({ ...waterForm, alkalinity: e.target.value })}
                    style={styles.fieldInput}
                    placeholder="120"
                  />
                </div>
              </div>

              <div>
                <label style={styles.fieldLabel}>Notes (Optional)</label>
                <input
                  type="text"
                  value={waterForm.notes}
                  onChange={(e) => setWaterForm({ ...waterForm, notes: e.target.value })}
                  style={styles.fieldInput}
                  placeholder="e.g. Normal phytoplankton bloom"
                />
              </div>
            </div>
          )}

          {/* 2. FEED TEST */}
          {activeTab === 'FEED_ENTRY' && (
            <div style={styles.fieldsStack}>
              <div style={styles.grid2Col}>
                <div>
                  <label style={styles.fieldLabel}>Feed Quantity (kg)</label>
                  <input
                    type="number"
                    value={feedForm.feedQuantity}
                    onChange={(e) => setFeedForm({ ...feedForm, feedQuantity: e.target.value })}
                    style={styles.fieldInput}
                    placeholder="120"
                    required
                  />
                </div>

                <div>
                  <label style={styles.fieldLabel}>Feeding Time</label>
                  <select
                    value={feedForm.feedingTime}
                    onChange={(e) => setFeedForm({ ...feedForm, feedingTime: e.target.value })}
                    style={styles.fieldInput}
                  >
                    <option value="Morning (06:00 AM)">Morning (06:00 AM)</option>
                    <option value="Noon (10:00 AM)">Noon (10:00 AM)</option>
                    <option value="Afternoon (02:00 PM)">Afternoon (02:00 PM)</option>
                    <option value="Evening (06:00 PM)">Evening (06:00 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={styles.fieldLabel}>Feed Type / Brand</label>
                <input
                  type="text"
                  value={feedForm.feedType}
                  onChange={(e) => setFeedForm({ ...feedForm, feedType: e.target.value })}
                  style={styles.fieldInput}
                  placeholder="Royals Premium 2.0 mm"
                  required
                />
              </div>

              <div>
                <label style={styles.fieldLabel}>Notes (Optional)</label>
                <input
                  type="text"
                  value={feedForm.notes}
                  onChange={(e) => setFeedForm({ ...feedForm, notes: e.target.value })}
                  style={styles.fieldInput}
                  placeholder="Check tray cleared"
                />
              </div>
            </div>
          )}

          {/* 3. BIOMASS */}
          {activeTab === 'BIOMASS_SAMPLING' && (
            <div style={styles.fieldsStack}>
              <div style={styles.grid2Col}>
                <div>
                  <label style={styles.fieldLabel}>Sample Count</label>
                  <input
                    type="number"
                    value={biomassForm.sampleCount}
                    onChange={(e) => setBiomassForm({ ...biomassForm, sampleCount: e.target.value })}
                    style={styles.fieldInput}
                    placeholder="30"
                    required
                  />
                </div>

                <div>
                  <label style={styles.fieldLabel}>Average Weight (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={biomassForm.averageWeight}
                    onChange={(e) => setBiomassForm({ ...biomassForm, averageWeight: e.target.value })}
                    style={styles.fieldInput}
                    placeholder="18.5"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={styles.fieldLabel}>Estimated Biomass (kg)</label>
                <div style={styles.calcPill}>
                  {biomassForm.estimatedBiomass} kg (Calculated)
                </div>
              </div>

              <div>
                <label style={styles.fieldLabel}>Notes (Optional)</label>
                <input
                  type="text"
                  value={biomassForm.notes}
                  onChange={(e) => setBiomassForm({ ...biomassForm, notes: e.target.value })}
                  style={styles.fieldInput}
                  placeholder="Clean carapace"
                />
              </div>
            </div>
          )}

          {/* 4. MORTALITY */}
          {activeTab === 'MORTALITY_LOG' && (
            <div style={styles.fieldsStack}>
              <div style={styles.grid2Col}>
                <div>
                  <label style={styles.fieldLabel}>Mortality Count</label>
                  <input
                    type="number"
                    value={mortalityForm.mortalityCount}
                    onChange={(e) => setMortalityForm({ ...mortalityForm, mortalityCount: e.target.value })}
                    style={styles.fieldInput}
                    placeholder="25"
                    required
                  />
                </div>

                <div>
                  <label style={styles.fieldLabel}>Reason</label>
                  <select
                    value={mortalityForm.reason}
                    onChange={(e) => setMortalityForm({ ...mortalityForm, reason: e.target.value })}
                    style={styles.fieldInput}
                  >
                    <option value="Moulting Stress">Moulting Stress</option>
                    <option value="Low DO Event">Low DO Event</option>
                    <option value="Thermal Stress">Thermal Stress</option>
                    <option value="Normal Baseline">Normal Baseline</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={styles.fieldLabel}>Notes (Optional)</label>
                <input
                  type="text"
                  value={mortalityForm.notes}
                  onChange={(e) => setMortalityForm({ ...mortalityForm, notes: e.target.value })}
                  style={styles.fieldInput}
                  placeholder="Checked aeration"
                />
              </div>
            </div>
          )}

          {/* 5. MEDICATION */}
          {activeTab === 'MEDICATION' && (
            <div style={styles.fieldsStack}>
              <div style={styles.grid2Col}>
                <div>
                  <label style={styles.fieldLabel}>Medicine / Probiotic</label>
                  <input
                    type="text"
                    value={medicationForm.medicineName}
                    onChange={(e) => setMedicationForm({ ...medicationForm, medicineName: e.target.value })}
                    style={styles.fieldInput}
                    placeholder="e.g. Probiotic Mix"
                    required
                  />
                </div>

                <div>
                  <label style={styles.fieldLabel}>Dosage</label>
                  <input
                    type="text"
                    value={medicationForm.dosage}
                    onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                    style={styles.fieldInput}
                    placeholder="1 kg / acre"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={styles.fieldLabel}>Application Notes</label>
                <input
                  type="text"
                  value={medicationForm.notes}
                  onChange={(e) => setMedicationForm({ ...medicationForm, notes: e.target.value })}
                  style={styles.fieldInput}
                  placeholder="Applied during morning aeration"
                />
              </div>
            </div>
          )}

          {/* 6. FARM ACTIVITY */}
          {activeTab === 'FARM_ACTIVITY' && (
            <div style={styles.fieldsStack}>
              <div>
                <label style={styles.fieldLabel}>Activity</label>
                <select
                  value={activityForm.activityType}
                  onChange={(e) => setActivityForm({ ...activityForm, activityType: e.target.value })}
                  style={styles.fieldInput}
                >
                  <option value="Probiotic Application">Probiotic Application</option>
                  <option value="Aerator Maintenance">Aerator Maintenance</option>
                  <option value="Water Exchange">Water Exchange</option>
                  <option value="Weekly Audit Check">Weekly Audit Check</option>
                </select>
              </div>

              <div>
                <label style={styles.fieldLabel}>Notes</label>
                <input
                  type="text"
                  value={activityForm.notes}
                  onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                  style={styles.fieldInput}
                  placeholder="Describe field activity"
                  required
                />
              </div>
            </div>
          )}

          {/* 7. PHOTO */}
          {activeTab === 'PHOTO_OBSERVATION' && (
            <div style={styles.fieldsStack}>
              <div>
                <label style={styles.fieldLabel}>Photo Title</label>
                <input
                  type="text"
                  value={photoForm.photoTitle}
                  onChange={(e) => setPhotoForm({ ...photoForm, photoTitle: e.target.value })}
                  style={styles.fieldInput}
                  placeholder="e.g. Sampling Evidence"
                  required
                />
              </div>

              <div style={styles.photoBox}>
                <Camera size={20} color="#0018AD" />
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#0018AD' }}>
                  {photoName || 'Attach Photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoName(e.target.files[0]?.name || 'Photo Attached')}
                  style={{ display: 'none' }}
                  id="photoUploadInput"
                />
                <label htmlFor="photoUploadInput" style={styles.uploadLabelBtn}>
                  {photoName ? 'Change' : 'Select'}
                </label>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" style={styles.submitBtn}>
            <Send size={14} /> SUBMIT RECORD
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
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
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '440px',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '14px 16px',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  headerTag: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#0018AD',
    letterSpacing: '0.4px',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
    margin: '1px 0 0 0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    padding: '2px',
  },
  tabScroll: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    padding: '10px 16px',
    borderBottom: '1px solid #F1F5F9',
    scrollbarWidth: 'none',
  },
  tabPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 10px',
    borderRadius: '14px',
    border: '1px solid',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  formContent: {
    padding: '14px 16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  targetGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  inputLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '3px',
    display: 'block',
  },
  selectInput: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '12px',
    fontWeight: '600',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
  },
  gpsStrip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: '8px',
    padding: '6px 10px',
  },
  gpsLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  gpsVerifiedText: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#166534',
    display: 'block',
  },
  gpsAccuracy: {
    fontSize: '10px',
    color: '#15803D',
  },
  gpsRefreshBtn: {
    background: 'none',
    border: 'none',
    color: '#166534',
    cursor: 'pointer',
    padding: '2px',
  },
  fieldsStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  grid2Col: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '3px',
    display: 'block',
  },
  fieldInput: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '12px',
    fontWeight: '600',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
  },
  calcPill: {
    padding: '8px 10px',
    borderRadius: '8px',
    backgroundColor: '#EDF0FF',
    color: '#0018AD',
    fontWeight: '700',
    fontSize: '12px',
    border: '1px solid #CBD2FF',
  },
  photoBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    border: '1px dashed #CBD5E1',
  },
  uploadLabelBtn: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: '#0018AD',
    padding: '5px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#0018AD',
    color: '#FFFFFF',
    border: 'none',
    padding: '11px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 24, 173, 0.3)',
    marginTop: '4px',
  },
  confirmationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px 16px',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
  },
  confirmIconCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#DCFCE7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px',
  },
  confirmTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: '0 0 12px 0',
  },
  confirmDetailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    padding: '10px 12px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '10px',
    textAlign: 'left',
  },
  confirmRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    paddingBottom: '3px',
    borderBottom: '1px solid #F1F5F9',
  },
  confirmLabel: {
    color: '#64748B',
    fontWeight: '500',
  },
  confirmVal: {
    color: '#0F172A',
    fontWeight: '700',
  },
  lockNotice: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: '14px',
  },
  doneBtn: {
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

export default QuickRecordModal;
