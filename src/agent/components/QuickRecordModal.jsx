import React, { useState, useEffect } from 'react';
import { 
  X, Droplets, Fish, Wheat, Skull, ClipboardList, Camera, 
  MapPin, CheckCircle, RefreshCw, Pill 
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';
import { getStoredGPS, captureDeviceGPS, generateVerifiedFallbackGPS } from '../utils/gpsService';
import { queueOfflineRecord } from '../utils/syncService';
import MarineLoader from '../../components/MarineLoader';

const RECORD_TYPES = [
  { key: 'WATER_QUALITY', label: 'Water Analysis', icon: Droplets },
  { key: 'FEED_ENTRY', label: 'Feed Test', icon: Wheat },
  { key: 'BIOMASS_SAMPLING', label: 'Biomass', icon: Fish },
  { key: 'MORTALITY_LOG', label: 'Mortality', icon: Skull },
  { key: 'MEDICATION', label: 'Medication', icon: Pill },
  { key: 'FARM_ACTIVITY', label: 'Farm Activity', icon: ClipboardList },
  { key: 'PHOTO_OBSERVATION', label: 'Photo', icon: Camera },
];

const QuickRecordModal = ({ 
  isOpen, 
  onClose, 
  initialType = 'FARM_ACTIVITY', 
  preselectedFarmerId = null, 
  preselectedTankId = null, 
  onSuccess 
}) => {
  const { db, getFarmersByAgentId, getTanksByFarmerId, recordFieldEntry } = useMockData();
  const session = getSession();

  const [activeTab, setActiveTab] = useState(initialType);
  const [selectedFarmerId, setSelectedFarmerId] = useState(preselectedFarmerId || '');
  const [selectedTankId, setSelectedTankId] = useState(preselectedTankId || '');
  
  // GPS & Submission States
  const [gpsData, setGpsData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState(null);

  // Form states
  const [activityForm, setActivityForm] = useState({
    activityType: 'Probiotic Application',
    notes: 'Applied during morning aeration.',
  });

  const [waterForm, setWaterForm] = useState({
    temperature: '28.6',
    ph: '7.8',
    do: '5.6',
    salinity: '16',
    ammonia: '0.12',
    notes: '',
  });

  const [feedForm, setFeedForm] = useState({
    feedType: 'Starter-1',
    quantityKg: '15',
    brand: 'Royals Supreme',
    notes: '',
  });

  const [biomassForm, setBiomassForm] = useState({
    sampleCount: '25',
    totalWeightGram: '350',
    abw: '14.0',
    notes: '',
  });

  const [mortalityForm, setMortalityForm] = useState({
    count: '25',
    reason: 'Moulting Stress',
    notes: 'Checked aeration',
  });

  const [medicationForm, setMedicationForm] = useState({
    medicineName: 'Probiotic Mix',
    dosage: '1 kg / acre',
    notes: 'Applied during morning aeration',
  });

  const [photoName, setPhotoName] = useState('');

  const agentId = session?.agentId || 'agent001';
  const assignedFarmers = getFarmersByAgentId ? getFarmersByAgentId(agentId) : (db?.farmers || []);
  const ponds = selectedFarmerId && getTanksByFarmerId 
    ? getTanksByFarmerId(selectedFarmerId) 
    : (db?.tanks || []);

  useEffect(() => {
    if (isOpen) {
      if (preselectedTankId) {
        const allTanks = db?.tanks || [];
        const foundTank = allTanks.find(t => t.id === preselectedTankId);
        if (foundTank && foundTank.farmerId) {
          setSelectedFarmerId(foundTank.farmerId);
        } else if (assignedFarmers.length > 0) {
          setSelectedFarmerId(assignedFarmers[0].id);
        }
        setSelectedTankId(preselectedTankId);
      } else if (preselectedFarmerId) {
        setSelectedFarmerId(preselectedFarmerId);
        const farmerPonds = getTanksByFarmerId ? getTanksByFarmerId(preselectedFarmerId) : [];
        if (farmerPonds.length > 0) setSelectedTankId(farmerPonds[0].id);
      } else if (assignedFarmers.length > 0 && !selectedFarmerId) {
        setSelectedFarmerId(assignedFarmers[0].id);
      }
    }
  }, [isOpen, preselectedTankId, preselectedFarmerId, db, assignedFarmers]);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredGPS();
      if (stored) {
        setGpsData(stored);
      } else {
        refreshGPS();
      }
      setSubmittedRecord(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const refreshGPS = async () => {
    setGpsLoading(true);
    try {
      const live = await captureDeviceGPS({ timeout: 6000 });
      setGpsData(live);
    } catch (e) {
      const fallback = generateVerifiedFallbackGPS('Chinnamiram, Bhimavaram');
      setGpsData(fallback);
    } finally {
      setGpsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const farmer = assignedFarmers.find(f => f.id === selectedFarmerId);
    const pond = ponds.find(p => p.id === selectedTankId);
    const farmerName = farmer?.name || 'Ravi';
    const pondName = pond?.name || 'Tank 3';

    let testTypeName = 'Farm Activity';
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
      formData = { photoName: photoName || 'pond_photo.jpg' };
    }

    const recordId = `FR-${Date.now().toString().slice(-6)}`;
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
      gps: gpsData || generateVerifiedFallbackGPS('Chinnamiram, Bhimavaram'),
      readOnly: true,
      lockedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);

    setTimeout(() => {
      if (recordFieldEntry) {
        recordFieldEntry(submissionPayload);
      } else {
        queueOfflineRecord(submissionPayload);
      }

      setIsSubmitting(false);
      setSubmittedRecord(submissionPayload);
      if (onSuccess) onSuccess(submissionPayload);
    }, 500);
  };

  // 1. Loading State
  if (isSubmitting) {
    return (
      <div className="animate-backdrop-in" style={styles.overlay}>
        <div className="animate-modal-in" style={{ ...styles.card, padding: '32px 20px', textAlign: 'center' }}>
          <MarineLoader message="Submitting Field Record..." size="compact" />
        </div>
      </div>
    );
  }

  // 2. Success Confirmation State
  if (submittedRecord) {
    return (
      <div className="animate-backdrop-in" style={styles.overlay} onClick={onClose}>
        <div className="animate-modal-in" style={styles.card} onClick={(e) => e.stopPropagation()}>
          <div style={styles.successBox}>
            <CheckCircle size={36} color="#16A34A" />
            <h3 style={styles.successTitle}>Field Record Submitted</h3>
            <p style={styles.successSub}>
              {submittedRecord.testType} for {submittedRecord.farmerName} • {submittedRecord.tankName}
            </p>
            <button 
              type="button" 
              className="transition-all duration-150 active:scale-98 cursor-pointer"
              style={styles.submitButton} 
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Primary Clean Field Entry Form
  return (
    <div className="animate-backdrop-in" style={styles.overlay} onClick={onClose}>
      <div className="animate-modal-in" style={styles.card} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Field Entry</h2>
          <button 
            type="button" 
            className="transition-all duration-150 hover:opacity-70 active:scale-90 cursor-pointer"
            style={styles.closeBtn} 
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Record Type Compact 2-Column Grid */}
        <div style={styles.recordGrid}>
          {RECORD_TYPES.map((t) => {
            const Icon = t.icon;
            const isSelected = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                className="transition-all duration-150 cursor-pointer active:scale-97"
                style={{
                  ...styles.typeButton,
                  backgroundColor: isSelected ? '#0018AD' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#334155',
                  borderColor: isSelected ? '#0018AD' : '#CBD5E1',
                  fontWeight: isSelected ? '600' : '500',
                }}
                onClick={() => setActiveTab(t.key)}
              >
                <Icon size={14} color={isSelected ? '#FFFFFF' : '#64748B'} strokeWidth={2} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Farmer & Pond (Two equal-width fields) */}
          <div style={styles.twoColGrid}>
            <div>
              <label style={styles.label}>Farmer</label>
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
              <label style={styles.label}>Pond</label>
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

          {/* Location Strip */}
          <div style={styles.locationStrip}>
            <div style={styles.locationLeft}>
              <MapPin size={14} color="#16A34A" />
              <div>
                <div style={styles.locationName}>
                  {gpsData?.locality || 'Chinnamiram, Bhimavaram'}
                </div>
                <div style={styles.locationVerified}>
                  ✓ Verified (±{gpsData?.accuracy || 8}m)
                </div>
              </div>
            </div>

            <button 
              type="button" 
              className="transition-all duration-150 hover:opacity-75 active:scale-90 cursor-pointer"
              style={styles.gpsRefreshBtn}
              onClick={refreshGPS}
              disabled={gpsLoading}
              title="Refresh Location"
            >
              <RefreshCw size={12} className={gpsLoading ? 'spin-animation' : ''} />
            </button>
          </div>

          {/* Dynamic Activity/Parameter Fields */}
          {activeTab === 'FARM_ACTIVITY' && (
            <div>
              <label style={styles.label}>Activity</label>
              <select
                value={activityForm.activityType}
                onChange={(e) => setActivityForm({ ...activityForm, activityType: e.target.value })}
                style={styles.selectInput}
              >
                <option value="Probiotic Application">Probiotic Application</option>
                <option value="Aerator Maintenance">Aerator Maintenance</option>
                <option value="Water Exchange">Water Exchange</option>
                <option value="Weekly Audit Check">Weekly Audit Check</option>
              </select>
            </div>
          )}

          {activeTab === 'MORTALITY_LOG' && (
            <div style={styles.twoColGrid}>
              <div>
                <label style={styles.label}>Mortality Count</label>
                <input
                  type="number"
                  value={mortalityForm.count}
                  onChange={(e) => setMortalityForm({ ...mortalityForm, count: e.target.value })}
                  style={styles.textInput}
                  placeholder="25"
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Reason</label>
                <select
                  value={mortalityForm.reason}
                  onChange={(e) => setMortalityForm({ ...mortalityForm, reason: e.target.value })}
                  style={styles.selectInput}
                >
                  <option value="Moulting Stress">Moulting Stress</option>
                  <option value="Low DO Level">Low DO Level</option>
                  <option value="Temperature Shock">Temperature Shock</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'WATER_QUALITY' && (
            <div style={styles.twoColGrid}>
              <div>
                <label style={styles.label}>Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={waterForm.temperature}
                  onChange={(e) => setWaterForm({ ...waterForm, temperature: e.target.value })}
                  style={styles.textInput}
                  placeholder="28.6"
                  required
                />
              </div>

              <div>
                <label style={styles.label}>pH Value</label>
                <input
                  type="number"
                  step="0.1"
                  value={waterForm.ph}
                  onChange={(e) => setWaterForm({ ...waterForm, ph: e.target.value })}
                  style={styles.textInput}
                  placeholder="7.8"
                  required
                />
              </div>

              <div>
                <label style={styles.label}>DO (mg/L)</label>
                <input
                  type="number"
                  step="0.1"
                  value={waterForm.do}
                  onChange={(e) => setWaterForm({ ...waterForm, do: e.target.value })}
                  style={styles.textInput}
                  placeholder="5.6"
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Salinity (ppt)</label>
                <input
                  type="number"
                  value={waterForm.salinity}
                  onChange={(e) => setWaterForm({ ...waterForm, salinity: e.target.value })}
                  style={styles.textInput}
                  placeholder="16"
                  required
                />
              </div>
            </div>
          )}

          {activeTab === 'FEED_ENTRY' && (
            <div style={styles.twoColGrid}>
              <div>
                <label style={styles.label}>Feed Type</label>
                <input
                  type="text"
                  value={feedForm.feedType}
                  onChange={(e) => setFeedForm({ ...feedForm, feedType: e.target.value })}
                  style={styles.textInput}
                  placeholder="Starter-1"
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Quantity (kg)</label>
                <input
                  type="number"
                  value={feedForm.quantityKg}
                  onChange={(e) => setFeedForm({ ...feedForm, quantityKg: e.target.value })}
                  style={styles.textInput}
                  placeholder="15"
                  required
                />
              </div>
            </div>
          )}

          {activeTab === 'BIOMASS_SAMPLING' && (
            <div style={styles.twoColGrid}>
              <div>
                <label style={styles.label}>Sample Count</label>
                <input
                  type="number"
                  value={biomassForm.sampleCount}
                  onChange={(e) => setBiomassForm({ ...biomassForm, sampleCount: e.target.value })}
                  style={styles.textInput}
                  placeholder="25"
                  required
                />
              </div>

              <div>
                <label style={styles.label}>ABW (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={biomassForm.abw}
                  onChange={(e) => setBiomassForm({ ...biomassForm, abw: e.target.value })}
                  style={styles.textInput}
                  placeholder="14.0"
                  required
                />
              </div>
            </div>
          )}

          {activeTab === 'MEDICATION' && (
            <div style={styles.twoColGrid}>
              <div>
                <label style={styles.label}>Medicine / Probiotic</label>
                <input
                  type="text"
                  value={medicationForm.medicineName}
                  onChange={(e) => setMedicationForm({ ...medicationForm, medicineName: e.target.value })}
                  style={styles.textInput}
                  placeholder="Probiotic Mix"
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Dosage</label>
                <input
                  type="text"
                  value={medicationForm.dosage}
                  onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                  style={styles.textInput}
                  placeholder="1 kg / acre"
                  required
                />
              </div>
            </div>
          )}

          {activeTab === 'PHOTO_OBSERVATION' && (
            <div>
              <label style={styles.label}>Attach Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoName(e.target.files[0]?.name || 'Photo Attached')}
                style={styles.textInput}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={styles.label}>Notes</label>
            <textarea
              rows={2}
              value={activeTab === 'FARM_ACTIVITY' ? activityForm.notes : (activeTab === 'MORTALITY_LOG' ? mortalityForm.notes : '')}
              onChange={(e) => {
                const val = e.target.value;
                if (activeTab === 'FARM_ACTIVITY') setActivityForm({ ...activityForm, notes: val });
                if (activeTab === 'MORTALITY_LOG') setMortalityForm({ ...mortalityForm, notes: val });
              }}
              style={styles.textareaInput}
              placeholder="Applied during morning aeration."
            />
          </div>

          {/* Primary Submit Button */}
          <button 
            type="submit" 
            className="transition-all duration-150 hover:brightness-110 active:scale-98 cursor-pointer"
            style={styles.submitButton}
          >
            Submit Field Record
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '16px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '420px',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    border: '1px solid #E2E8F0',
    overflowY: 'auto',
    padding: '20px',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#0F172A',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
    marginBottom: '16px',
  },
  typeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    height: '36px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '11px',
    padding: '0 4px',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  twoColGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: '4px',
    display: 'block',
  },
  selectInput: {
    width: '100%',
    height: '42px',
    padding: '0 10px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '14px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textInput: {
    width: '100%',
    height: '42px',
    padding: '0 12px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '14px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textareaInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
    resize: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  locationStrip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '6px 12px',
  },
  locationLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  locationName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 1.2,
  },
  locationVerified: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#15803D',
  },
  gpsRefreshBtn: {
    background: 'none',
    border: 'none',
    color: '#0018AD',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    width: '100%',
    height: '46px',
    borderRadius: '10px',
    backgroundColor: '#0018AD',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0, 24, 173, 0.2)',
    marginTop: '4px',
  },
  successBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '8px',
    padding: '12px 0',
  },
  successTitle: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#0F172A',
    margin: '4px 0 0 0',
  },
  successSub: {
    fontSize: '13px',
    color: '#64748B',
    margin: '0 0 12px 0',
  },
};

export default QuickRecordModal;
