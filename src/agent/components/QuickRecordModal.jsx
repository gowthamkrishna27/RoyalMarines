import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Droplets, Fish, Wheat, Skull, ClipboardList, Camera, 
  MapPin, Check, RefreshCw, Pill, Scale, Info, CheckCircle, Activity 
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';
import { getInchargeSession } from '../../incharge/utils/inchargeAuth';
import { getStoredGPS, captureDeviceGPS, generateVerifiedFallbackGPS } from '../utils/gpsService';
import { queueOfflineRecord } from '../utils/syncService';
import MarineLoader from '../../components/MarineLoader';

// 7 Routine Field Modules (Harvest has its own dedicated button)
const RECORD_TYPES = [
  { key: 'WATER_QUALITY', label: 'Water Analysis', icon: Droplets },
  { key: 'FEED_ENTRY', label: 'Feed Test', icon: Wheat },
  { key: 'DISEASE', label: 'Disease', icon: Activity },
  { key: 'MORTALITY_LOG', label: 'Mortality', icon: Skull },
  { key: 'MEDICATION', label: 'Medication', icon: Pill },
  { key: 'FARM_ACTIVITY', label: 'Farm Activity', icon: ClipboardList },
  { key: 'PHOTO_OBSERVATION', label: 'Photo', icon: Camera },
];

const QuickRecordModal = ({ 
  isOpen, 
  onClose, 
  initialType = 'WATER_QUALITY', 
  preselectedFarmerId = null, 
  preselectedTankId = null, 
  onSuccess,
  userRole = null
}) => {
  const { db, getFarmersByAgentId, getTanksByFarmerId, getMyFarmersByInchargeId, getMyTanksByInchargeId, recordFieldEntry } = useMockData();
  const session = getSession();
  const inchargeSession = getInchargeSession();

  const isIncharge = Boolean(
    userRole === 'INCHARGE' ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/incharge')) ||
    (inchargeSession && inchargeSession.inchargeId && !session?.agentId)
  );

  const currentInchargeId = inchargeSession?.inchargeId || 'INC001';
  const currentAgentId = session?.agentId || 'agent001';

  const [activeTab, setActiveTab] = useState(initialType || 'WATER_QUALITY');
  const [selectedFarmerId, setSelectedFarmerId] = useState(preselectedFarmerId || '');
  const [selectedTankId, setSelectedTankId] = useState(preselectedTankId || '');
  
  // GPS & Submission States
  const [gpsData, setGpsData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState(null);

  // Harvest form state
  const [harvestForm, setHarvestForm] = useState({
    harvestType: 'Partial Harvest', // 'Partial Harvest' | 'Final Harvest'
    date: new Date().toISOString().split('T')[0],
    doc: '85',
    abw: '15',
    harvestedNumber: '133333',
    harvestedBiomass: '2000',
    remarks: 'Harvest completed successfully.',
  });

  // Other form states
  const [activityForm, setActivityForm] = useState({
    activityType: 'Probiotic Application',
    notes: 'Applied during morning aeration.',
  });

  const [waterForm, setWaterForm] = useState({
    date: new Date().toISOString().split('T')[0],
    doc: '35',
    salinity: '16',
    ph: '7.8',
    do: '5.6',
    temperature: '28.6',
    alkalinity: '140',
    hardness: '4800',
    ammonia: '0.05',
    nitrite: '0.02',
    k: '171.2',
    h2s: '0.005',
    cl: '0.01',
    fe: '0.01',
    waterColor: 'Light Green',
    notes: 'Normal pond water quality parameters.',
  });

  const handleWaterSalinityChange = (val) => {
    const num = parseFloat(val);
    setWaterForm(prev => ({
      ...prev,
      salinity: val,
      hardness: !isNaN(num) && num > 0 ? String(Math.round(num * 300)) : prev.hardness,
      k: !isNaN(num) && num > 0 ? String(Number((num * 10.7).toFixed(1))) : prev.k,
    }));
  };

  const [feedForm, setFeedForm] = useState({
    date: new Date().toISOString().split('T')[0],
    doc: '36',
    seedLac: '2.5',
    abw: '12.5',
    dayFeedKg: '35.0',
    cumulativeFeed: '1080.0',
    totalBiomass: '1250',
    fcr: '0.86',
    checkTrayFeedGr: '150',
    checkTrayTime: '1.5 hrs',
    feedType: 'Starter-1',
    remarks: 'Good check tray feed intake. Trays clear.',
  });

  const handleFeedMetricChange = (field, val) => {
    setFeedForm(prev => {
      const updated = { ...prev, [field]: val };
      const cum = parseFloat(field === 'cumulativeFeed' ? val : updated.cumulativeFeed);
      const bio = parseFloat(field === 'totalBiomass' ? val : updated.totalBiomass);
      if (!isNaN(cum) && !isNaN(bio) && bio > 0) {
        updated.fcr = (cum / bio).toFixed(2);
      }
      return updated;
    });
  };

  const DISEASE_SYMPTOMS = [
    'White muscle',
    'White gut',
    'Moulting',
    'Cramping',
    'Black gill',
    'Vibriosis',
    'EHP',
    'Hard shell',
    'Soft shell',
    'Black spots',
    'ASDS',
    'WSSV',
    'Loose shell'
  ];

  const [diseaseForm, setDiseaseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    doc: '36',
    selectedDiseases: ['White gut'],
    severity: 'Mild',
    affectedPercentage: '< 5%',
    actionTaken: 'Gut probiotic applied with feed',
    remarks: 'White gut symptoms noticed in check tray observation.',
  });

  const toggleDiseaseSymptom = (symptom) => {
    setDiseaseForm(prev => {
      const exists = prev.selectedDiseases.includes(symptom);
      const updated = exists
        ? prev.selectedDiseases.filter(s => s !== symptom)
        : [...prev.selectedDiseases, symptom];
      return { ...prev, selectedDiseases: updated };
    });
  };

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

  const assignedFarmers = isIncharge
    ? (getMyFarmersByInchargeId ? getMyFarmersByInchargeId(currentInchargeId) : (db?.farmers || []).filter(f => f.inchargeId === currentInchargeId && (!f.agentId || f.assignedTo === 'Incharge')))
    : (getFarmersByAgentId ? getFarmersByAgentId(currentAgentId) : (db?.farmers || []));

  const tanks = selectedFarmerId && getTanksByFarmerId 
    ? getTanksByFarmerId(selectedFarmerId) 
    : (isIncharge
        ? (getMyTanksByInchargeId ? getMyTanksByInchargeId(currentInchargeId) : [])
        : (db?.tanks || []));

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialType || 'WATER_QUALITY');

      const farmersList = assignedFarmers;
      const allTanks = isIncharge ? (getMyTanksByInchargeId ? getMyTanksByInchargeId(currentInchargeId) : []) : (db?.tanks || []);

      if (preselectedTankId) {
        const foundTank = allTanks.find(t => t.id === preselectedTankId);
        if (foundTank && foundTank.farmerId) {
          setSelectedFarmerId(foundTank.farmerId);
        } else if (farmersList.length > 0) {
          setSelectedFarmerId(farmersList[0].id);
        }
        setSelectedTankId(preselectedTankId);
      } else if (preselectedFarmerId) {
        setSelectedFarmerId(preselectedFarmerId);
        const farmerTanks = getTanksByFarmerId ? getTanksByFarmerId(preselectedFarmerId) : [];
        if (farmerTanks.length > 0) {
          setSelectedTankId(farmerTanks[0].id);
        }
      } else if (farmersList.length > 0) {
        setSelectedFarmerId(farmersList[0].id);
        const defaultTanks = getTanksByFarmerId ? getTanksByFarmerId(farmersList[0].id) : [];
        if (defaultTanks.length > 0) {
          setSelectedTankId(defaultTanks[0].id);
        }
      }

      const stored = getStoredGPS();
      if (stored) {
        setGpsData(stored);
      } else {
        refreshGPS();
      }
      setSubmittedRecord(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialType, preselectedFarmerId, preselectedTankId, isIncharge]);

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

  const currentTabObj = RECORD_TYPES.find(t => t.key === activeTab) || (activeTab === 'HARVEST_ENTRY' ? { icon: Scale } : RECORD_TYPES[0]);
  const CurrentIcon = currentTabObj.icon;

  const selectedTank = tanks.find(p => p.id === selectedTankId);
  const currentStoreKey = `${selectedFarmerId}_${selectedTankId}`;
  const currentTankStore = (JSON.parse(localStorage.getItem('agent_harvest_store') || '{}'))[currentStoreKey];
  const isSelectedTankClosed = selectedTank?.status === 'Harvested' || 
    selectedTank?.status === 'Completed' || 
    selectedTank?.finalHarvestCompleted ||
    (currentTankStore?.harvests || []).some(h => h.harvestType === 'Final Harvest' || h.isFinal);

  const getHeaderTitle = () => {
    if (activeTab === 'HARVEST_ENTRY') return 'Harvest Entry';
    if (activeTab === 'WATER_QUALITY') return 'Water Analysis Entry';
    if (activeTab === 'FEED_ENTRY') return 'Feed Test Entry';
    if (activeTab === 'DISEASE') return 'Disease Observation';
    if (activeTab === 'MORTALITY_LOG') return 'Mortality Entry';
    if (activeTab === 'MEDICATION') return 'Medication Entry';
    if (activeTab === 'FARM_ACTIVITY') return 'Farm Activity Entry';
    if (activeTab === 'PHOTO_OBSERVATION') return 'Photo Observation';
    return 'Field Entry';
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isSelectedTankClosed) {
      alert('This tank has already completed its final harvest. No further records can be entered for this crop cycle.');
      return;
    }

    const farmer = assignedFarmers.find(f => f.id === selectedFarmerId);
    const tank = tanks.find(p => p.id === selectedTankId);
    const farmerName = farmer?.name || 'Ravi';
    const tankName = tank?.name || 'Tank 3';

    let testTypeName = 'Harvest';
    let formData = {};

    if (activeTab === 'HARVEST_ENTRY') {
      const isFinal = harvestForm.harvestType === 'Final Harvest';
      testTypeName = 'Harvest';
      formData = {
        harvestType: harvestForm.harvestType,
        isFinal,
        date: harvestForm.date,
        doc: harvestForm.doc,
        abw: harvestForm.abw,
        harvestedNumber: harvestForm.harvestedNumber,
        harvestedBiomass: harvestForm.harvestedBiomass,
        remarks: harvestForm.remarks,
      };

      // Also persist to local agent harvest store for immediate offline report synchronization
      try {
        const storeKey = `${selectedFarmerId}_${selectedTankId}`;
        const existingStore = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
        const tankStore = existingStore[storeKey] || {
          pondSize: tank?.acres || '2.5',
          seedNumber: tank?.seedStocked || '200000',
          stockingDate: tank?.stockingDate || '2026-06-01',
          harvests: [],
          totalFeed: '16000'
        };

        const newHarvestEntry = {
          id: `h_${Date.now()}`,
          harvestType: harvestForm.harvestType,
          isFinal,
          date: harvestForm.date,
          doc: harvestForm.doc,
          abw: harvestForm.abw,
          harvestedNumber: harvestForm.harvestedNumber,
          harvestedBiomass: harvestForm.harvestedBiomass,
          remarks: harvestForm.remarks,
          createdAt: new Date().toISOString()
        };

        const updatedStore = {
          ...existingStore,
          [storeKey]: {
            ...tankStore,
            harvests: [...(tankStore.harvests || []), newHarvestEntry]
          }
        };

        localStorage.setItem('agent_harvest_store', JSON.stringify(updatedStore));
        window.dispatchEvent(new CustomEvent('harvestStoreUpdated', { detail: updatedStore }));
      } catch (err) {
        console.error('Error updating harvest store:', err);
      }

    } else if (activeTab === 'WATER_QUALITY') {
      testTypeName = 'Water Analysis';
      formData = waterForm;
    } else if (activeTab === 'FEED_ENTRY') {
      testTypeName = 'Feed Test';
      formData = feedForm;
    } else if (activeTab === 'DISEASE') {
      testTypeName = 'Disease';
      formData = {
        date: diseaseForm.date,
        doc: diseaseForm.doc,
        observations: diseaseForm.selectedDiseases,
        diseaseList: diseaseForm.selectedDiseases.join(', '),
        severity: diseaseForm.severity,
        affectedPercentage: diseaseForm.affectedPercentage,
        actionTaken: diseaseForm.actionTaken,
        remarks: diseaseForm.remarks,
      };
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
      formData = { photoName: photoName || 'tank_photo.jpg' };
    }

    const recordId = `FR-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const formattedDate = `${now.getDate()} Aug ${now.getFullYear()}`;
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const submissionPayload = {
      id: recordId,
      agentId: isIncharge ? null : (session?.agentId || 'agent001'),
      agentName: isIncharge ? (inchargeSession?.name || 'Direct Incharge') : (session?.name || 'Agent A'),
      inchargeId: currentInchargeId,
      submittedBy: isIncharge ? 'Incharge' : 'Agent',
      farmerId: selectedFarmerId,
      farmerName,
      tankId: selectedTankId,
      tankName,
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
    }, 400);
  };

  // 1. Loading State
  if (isSubmitting) {
    return createPortal(
      <div className="animate-backdrop-in" style={styles.overlay}>
        <div className="animate-modal-in" style={{ ...styles.modalCard, padding: '40px 24px', textAlign: 'center', margin: 'auto' }}>
          <MarineLoader message="Saving Harvest Record..." size="compact" />
        </div>
      </div>,
      document.body
    );
  }

  // 2. Success State
  if (submittedRecord) {
    return createPortal(
      <div className="animate-backdrop-in" style={styles.overlay} onClick={onClose}>
        <div className="animate-modal-in" style={{ ...styles.modalCard, margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
          <div style={styles.successBox}>
            <div style={styles.successIconCircle}>
              <CheckCircle size={36} color="#16A34A" />
            </div>
            <h3 style={styles.successTitle}>Record Saved Successfully</h3>
            <p style={styles.successSub}>
              {submittedRecord.testType} for <strong>{submittedRecord.farmerName}</strong> • <strong>{submittedRecord.tankName}</strong>
            </p>

            <div style={styles.successDetailsCard}>
              {activeTab === 'HARVEST_ENTRY' && (
                <>
                  <div style={styles.successDetailRow}>
                    <span>Harvest Type:</span>
                    <strong>{harvestForm.harvestType}</strong>
                  </div>
                  <div style={styles.successDetailRow}>
                    <span>Harvested Biomass:</span>
                    <strong>{harvestForm.harvestedBiomass} kg</strong>
                  </div>
                  <div style={styles.successDetailRow}>
                    <span>Harvested Seed:</span>
                    <strong>{harvestForm.harvestedNumber}</strong>
                  </div>
                </>
              )}
              {activeTab === 'WATER_QUALITY' && (
                <>
                  <div style={styles.successDetailRow}>
                    <span>DOC / Date:</span>
                    <strong>DOC {waterForm.doc} • {waterForm.date}</strong>
                  </div>
                  <div style={styles.successDetailRow}>
                    <span>Salinity / pH / DO:</span>
                    <strong>{waterForm.salinity} ppt • pH {waterForm.ph} • DO {waterForm.do} mg/L</strong>
                  </div>
                  <div style={styles.successDetailRow}>
                    <span>Alkalinity / Hardness:</span>
                    <strong>{waterForm.alkalinity} ppm • {waterForm.hardness} ppm</strong>
                  </div>
                  <div style={styles.successDetailRow}>
                    <span>Ammonia / Nitrite / K:</span>
                    <strong>NH3: {waterForm.ammonia} • NO2: {waterForm.nitrite} • K: {waterForm.k} ppm</strong>
                  </div>
                  <div style={styles.successDetailRow}>
                    <span>Gases / Water Color:</span>
                    <strong>H2S: {waterForm.h2s} • Cl: {waterForm.cl} • {waterForm.waterColor}</strong>
                  </div>
                </>
              )}
              {activeTab === 'FEED_ENTRY' && (
                <>
                  <div style={styles.successDetailRow}>
                    <span>DOC / Date:</span>
                    <strong>DOC {feedForm.doc} • {feedForm.date}</strong>
                  </div>
                  <div style={styles.successDetailRow}>
                    <span>Seed (lac) / ABW:</span>
                    <strong>{feedForm.seedLac} lac • {feedForm.abw} g</strong>
                  </div>
                  <div style={styles.successDetailRow}>
                    <span>Day Feed / Cumulative:</span>
                    <strong>{feedForm.dayFeedKg} kg • {feedForm.cumulativeFeed} kg</strong>
                  </div>
                  <div style={styles.successDetailRow}>
                    <span>Biomass / FCR:</span>
                    <strong>{feedForm.totalBiomass} kg • FCR {feedForm.fcr}</strong>
                  </div>
                  <div style={styles.successDetailRow}>
                    <span>Check Tray (Feed / Time):</span>
                    <strong>{feedForm.checkTrayFeedGr} gr • {feedForm.checkTrayTime}</strong>
                  </div>
                </>
              )}
              {activeTab === 'DISEASE' && (
                <>
                  <div style={styles.successDetailRow}>
                    <span>DOC / Date:</span>
                    <strong>DOC {diseaseForm.doc} • {diseaseForm.date}</strong>
                  </div>
                  <div style={styles.successDetailRow}>
                    <span>Symptoms / Diseases:</span>
                    <strong style={{ color: '#DC2626' }}>{diseaseForm.selectedDiseases.join(', ') || 'None Selected'}</strong>
                  </div>
                  <div style={styles.successDetailRow}>
                    <span>Severity / Population:</span>
                    <strong>{diseaseForm.severity} • {diseaseForm.affectedPercentage}</strong>
                  </div>
                  {diseaseForm.actionTaken && (
                    <div style={styles.successDetailRow}>
                      <span>Action Taken:</span>
                      <strong>{diseaseForm.actionTaken}</strong>
                    </div>
                  )}
                </>
              )}
              {activeTab === 'MORTALITY_LOG' && (
                <>
                  <div style={styles.successDetailRow}>
                    <span>Count / Reason:</span>
                    <strong>{mortalityForm.count} ({mortalityForm.reason})</strong>
                  </div>
                </>
              )}
              {activeTab === 'MEDICATION' && (
                <>
                  <div style={styles.successDetailRow}>
                    <span>Medicine / Dosage:</span>
                    <strong>{medicationForm.medicineName} ({medicationForm.dosage})</strong>
                  </div>
                </>
              )}
              {activeTab === 'FARM_ACTIVITY' && (
                <>
                  <div style={styles.successDetailRow}>
                    <span>Activity Type:</span>
                    <strong>{activityForm.activityType}</strong>
                  </div>
                </>
              )}
              {activeTab === 'PHOTO_OBSERVATION' && (
                <>
                  <div style={styles.successDetailRow}>
                    <span>Photo Status:</span>
                    <strong>Attached ({photoName || 'Photo Attached'})</strong>
                  </div>
                </>
              )}
              <div style={styles.successDetailRow}>
                <span>Location:</span>
                <span style={{ color: '#16A34A', fontWeight: '600' }}>✔ GPS Verified</span>
              </div>
            </div>

            <button 
              type="button" 
              className="transition-all duration-200 hover:brightness-110 active:scale-98 cursor-pointer"
              style={styles.primaryButton}
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

  // 3. Main Modal Form
  return createPortal(
    <div className="animate-backdrop-in" style={styles.overlay} onClick={onClose}>
      <div className="animate-modal-in" style={{ ...styles.modalCard, margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
        {/* ----------------- HEADER ----------------- */}
        <div style={styles.header}>
          <div style={styles.headerTitleWrap}>
            <div style={styles.headerIconBadge}>
              <CurrentIcon size={20} color="#1A2FB8" strokeWidth={2.4} />
            </div>
            <h2 style={styles.title}>{getHeaderTitle()}</h2>
          </div>
          <button 
            type="button" 
            style={styles.closeBtn} 
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} color="#64748B" />
          </button>
        </div>

        {/* ----------------- MODULE NAVIGATION (Routine Field Entry Tabs) ----------------- */}
        {activeTab !== 'HARVEST_ENTRY' && (
          <div style={styles.moduleNavGrid}>
            {RECORD_TYPES.map((t) => {
              const Icon = t.icon;
              const isSelected = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  className="transition-all duration-150 active:scale-95 cursor-pointer"
                  style={{
                    ...styles.moduleButton,
                    backgroundColor: isSelected ? '#1A2FB8' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#334155',
                    borderColor: isSelected ? '#1A2FB8' : '#CBD5E1',
                    fontWeight: isSelected ? '700' : '600',
                    boxShadow: isSelected ? '0 2px 6px rgba(26, 47, 184, 0.2)' : 'none',
                  }}
                  onClick={() => setActiveTab(t.key)}
                >
                  <Icon size={14} color={isSelected ? '#FFFFFF' : '#64748B'} strokeWidth={2.2} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* ----------------- FARM INFORMATION ----------------- */}
          <div style={styles.twoColGrid}>
            <div>
              <label style={styles.fieldLabel}>Farmer *</label>
              <div style={styles.selectWrapper}>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => {
                    const fid = e.target.value;
                    setSelectedFarmerId(fid);
                    const fTanks = getTanksByFarmerId ? getTanksByFarmerId(fid) : [];
                    if (fTanks.length > 0) setSelectedTankId(fTanks[0].id);
                    else setSelectedTankId('');
                  }}
                  style={styles.selectInput}
                  required
                >
                  {assignedFarmers.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={styles.fieldLabel}>Tank *</label>
              <div style={styles.selectWrapper}>
                <select
                  value={selectedTankId}
                  onChange={(e) => setSelectedTankId(e.target.value)}
                  style={styles.selectInput}
                  required
                >
                  {tanks.map((p) => {
                    const pStoreKey = `${selectedFarmerId}_${p.id}`;
                    const pStore = (JSON.parse(localStorage.getItem('agent_harvest_store') || '{}'))[pStoreKey];
                    const pDone = p.status === 'Harvested' || p.status === 'Completed' || p.finalHarvestCompleted || (pStore?.harvests || []).some(h => h.harvestType === 'Final Harvest' || h.isFinal);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} {pDone ? '• [Final Harvest Done - Closed]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Locked Notice if selected tank has completed final harvest */}
          {isSelectedTankClosed && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#FEF2F2',
              border: '1.5px solid #FCA5A5',
              color: '#991B1B',
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              marginTop: '4px',
              marginBottom: '4px'
            }}>
              <Lock size={18} color="#DC2626" style={{ flexShrink: 0 }} />
              <div>
                <strong>Final Harvest Completed:</strong> This pond has completed its final harvest. No further records or modifications can be entered for this crop cycle.
              </div>
            </div>
          )}

          {/* ----------------- GPS VERIFICATION CARD ----------------- */}
          <div style={styles.gpsCard}>
            <div style={styles.gpsLeft}>
              <MapPin size={16} color="#16A34A" style={{ flexShrink: 0 }} />
              <div style={styles.gpsTextCol}>
                <span style={styles.gpsLocationText}>
                  {gpsData?.locality || 'Chinnamiram, Bhimavaram'}
                </span>
                <span style={styles.gpsStatusText}>
                  ✔ Verified (±{gpsData?.accuracy || 10}m)
                </span>
              </div>
            </div>

            <button 
              type="button" 
              className="transition-all duration-150 hover:bg-slate-50 active:scale-90 cursor-pointer"
              style={styles.gpsRefreshBtn}
              onClick={refreshGPS}
              disabled={gpsLoading}
              title="Refresh GPS Coordinates"
            >
              <RefreshCw size={14} color="#1A2FB8" className={gpsLoading ? 'spin-animation' : ''} />
            </button>
          </div>

          {/* ----------------- HARVEST MODULE FIELDS ----------------- */}
          {activeTab === 'HARVEST_ENTRY' && (
            <div style={styles.harvestDetailsCard}>
              <h3 style={styles.sectionCardTitle}>Harvest Details</h3>

              {/* Harvest Type Radio Buttons */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Harvest Type *</label>
                <div style={styles.radioGroup}>
                  <button
                    type="button"
                    className="transition-all duration-150 cursor-pointer"
                    onClick={() => setHarvestForm(prev => ({ ...prev, harvestType: 'Partial Harvest' }))}
                    style={{
                      ...styles.radioCard,
                      borderColor: harvestForm.harvestType === 'Partial Harvest' ? '#1A2FB8' : '#CBD5E1',
                      backgroundColor: harvestForm.harvestType === 'Partial Harvest' ? '#F0F4FF' : '#FFFFFF',
                    }}
                  >
                    <input
                      type="radio"
                      name="harvestType"
                      value="Partial Harvest"
                      checked={harvestForm.harvestType === 'Partial Harvest'}
                      onChange={() => setHarvestForm(prev => ({ ...prev, harvestType: 'Partial Harvest' }))}
                      style={styles.radioNative}
                    />
                    <span style={{
                      fontWeight: harvestForm.harvestType === 'Partial Harvest' ? '700' : '500',
                      color: harvestForm.harvestType === 'Partial Harvest' ? '#1A2FB8' : '#334155',
                      fontSize: '14px'
                    }}>
                      Partial Harvest
                    </span>
                  </button>

                  <button
                    type="button"
                    className="transition-all duration-150 cursor-pointer"
                    onClick={() => setHarvestForm(prev => ({ ...prev, harvestType: 'Final Harvest' }))}
                    style={{
                      ...styles.radioCard,
                      borderColor: harvestForm.harvestType === 'Final Harvest' ? '#1A2FB8' : '#CBD5E1',
                      backgroundColor: harvestForm.harvestType === 'Final Harvest' ? '#F0F4FF' : '#FFFFFF',
                    }}
                  >
                    <input
                      type="radio"
                      name="harvestType"
                      value="Final Harvest"
                      checked={harvestForm.harvestType === 'Final Harvest'}
                      onChange={() => setHarvestForm(prev => ({ ...prev, harvestType: 'Final Harvest' }))}
                      style={styles.radioNative}
                    />
                    <span style={{
                      fontWeight: harvestForm.harvestType === 'Final Harvest' ? '700' : '500',
                      color: harvestForm.harvestType === 'Final Harvest' ? '#1A2FB8' : '#334155',
                      fontSize: '14px'
                    }}>
                      Final Harvest
                    </span>
                  </button>
                </div>
              </div>

              {/* Harvest Date */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Harvest Date *</label>
                <input
                  type="date"
                  value={harvestForm.date}
                  onChange={(e) => setHarvestForm({ ...harvestForm, date: e.target.value })}
                  style={styles.inputField}
                  required
                />
              </div>

              {/* DOC & ABW in 2-Column Grid */}
              <div style={styles.twoColGrid}>
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>DOC (Days) *</label>
                  <input
                    type="number"
                    value={harvestForm.doc}
                    onChange={(e) => setHarvestForm({ ...harvestForm, doc: e.target.value })}
                    placeholder="85"
                    style={styles.inputField}
                    required
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>ABW (gm) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={harvestForm.abw}
                    onChange={(e) => setHarvestForm({ ...harvestForm, abw: e.target.value })}
                    placeholder="15"
                    style={styles.inputField}
                    required
                  />
                </div>
              </div>

              {/* Harvested Number & Harvested Biomass in 2-Column Grid */}
              <div style={styles.twoColGrid}>
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Harvested Number *</label>
                  <input
                    type="number"
                    value={harvestForm.harvestedNumber}
                    onChange={(e) => setHarvestForm({ ...harvestForm, harvestedNumber: e.target.value })}
                    placeholder="133333"
                    style={styles.inputField}
                    required
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Harvested Biomass (kg) *</label>
                  <input
                    type="number"
                    value={harvestForm.harvestedBiomass}
                    onChange={(e) => setHarvestForm({ ...harvestForm, harvestedBiomass: e.target.value })}
                    placeholder="2000"
                    style={styles.inputField}
                    required
                  />
                </div>
              </div>

              {/* Remarks (Optional) */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Remarks (Optional)</label>
                <textarea
                  value={harvestForm.remarks}
                  onChange={(e) => setHarvestForm({ ...harvestForm, remarks: e.target.value })}
                  placeholder="Harvest completed successfully."
                  rows={3}
                  style={styles.textareaField}
                />
              </div>
            </div>
          )}

          {/* ----------------- WATER QUALITY MODULE ----------------- */}
          {activeTab === 'WATER_QUALITY' && (
            <div style={styles.harvestDetailsCard}>
              <div style={styles.sectionHeaderWrap}>
                <h3 style={styles.sectionCardTitle}>Water Quality Analysis</h3>
                <span style={styles.sectionBadge}>Sampling Standard</span>
              </div>

              {/* 1. DOC / Date */}
              <div style={styles.waterGrid}>
                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>DOC / Date *</span>
                  </div>
                  <input
                    type="date"
                    value={waterForm.date}
                    onChange={(e) => setWaterForm({ ...waterForm, date: e.target.value })}
                    style={styles.inputField}
                    required
                  />
                </div>
                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>DOC (Days of Culture) *</span>
                  </div>
                  <input
                    type="number"
                    value={waterForm.doc}
                    onChange={(e) => setWaterForm({ ...waterForm, doc: e.target.value })}
                    style={styles.inputField}
                    placeholder="35"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* 2. Core Physico-Chemical Parameters */}
              <div style={styles.formSectionDivider} />
              <div style={styles.subSectionTitle}>Physico-Chemical Parameters</div>

              <div style={styles.waterGrid}>
                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>Salinity (ppt) *</span>
                    <span style={styles.rangeBadge}>0-30 ppt</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={waterForm.salinity}
                    onChange={(e) => handleWaterSalinityChange(e.target.value)}
                    style={styles.inputField}
                    placeholder="16"
                    min="0"
                    max="30"
                    required
                  />
                </div>

                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>pH Value *</span>
                    <span style={styles.rangeBadge}>7.5-8.5</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={waterForm.ph}
                    onChange={(e) => setWaterForm({ ...waterForm, ph: e.target.value })}
                    style={styles.inputField}
                    placeholder="7.8"
                    required
                  />
                </div>

                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>DO (mg/L) *</span>
                    <span style={{ 
                      ...styles.rangeBadge, 
                      color: parseFloat(waterForm.do) < 4 ? '#DC2626' : '#15803D', 
                      backgroundColor: parseFloat(waterForm.do) < 4 ? '#FEE2E2' : '#DCFCE7' 
                    }}>
                      {parseFloat(waterForm.do) < 4 ? 'Alert < 4' : 'Optimal ≥ 4'}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={waterForm.do}
                    onChange={(e) => setWaterForm({ ...waterForm, do: e.target.value })}
                    style={styles.inputField}
                    placeholder="5.6"
                    required
                  />
                </div>

                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>Temperature (°C)</span>
                    <span style={styles.rangeBadge}>Ambient</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={waterForm.temperature}
                    onChange={(e) => setWaterForm({ ...waterForm, temperature: e.target.value })}
                    style={styles.inputField}
                    placeholder="28.6"
                  />
                </div>
              </div>

              {/* 3. Minerals & Buffering Capacity */}
              <div style={styles.formSectionDivider} />
              <div style={styles.subSectionTitle}>Minerals & Buffering Capacity</div>

              <div style={styles.waterGrid}>
                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>Alkalinity (ppm) *</span>
                    <span style={styles.rangeBadge}>100-300 ppm</span>
                  </div>
                  <input
                    type="number"
                    value={waterForm.alkalinity}
                    onChange={(e) => setWaterForm({ ...waterForm, alkalinity: e.target.value })}
                    style={styles.inputField}
                    placeholder="140"
                    required
                  />
                </div>

                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>Hardness (ppm)</span>
                    <span style={styles.formulaBadge}>1 ppt = 300</span>
                  </div>
                  <input
                    type="number"
                    value={waterForm.hardness}
                    onChange={(e) => setWaterForm({ ...waterForm, hardness: e.target.value })}
                    style={styles.inputField}
                    placeholder="4800"
                  />
                </div>

                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>K - Potassium (ppm)</span>
                    <span style={styles.formulaBadge}>1 ppt = 10.7</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={waterForm.k}
                    onChange={(e) => setWaterForm({ ...waterForm, k: e.target.value })}
                    style={styles.inputField}
                    placeholder="171.2"
                  />
                </div>

                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>Water Color *</span>
                  </div>
                  <div style={styles.selectWrapper}>
                    <select
                      value={waterForm.waterColor}
                      onChange={(e) => setWaterForm({ ...waterForm, waterColor: e.target.value })}
                      style={styles.selectInput}
                      required
                    >
                      <option value="Light Green">Light Green (Optimal)</option>
                      <option value="Greenish Brown">Greenish Brown</option>
                      <option value="Brown">Brown (Diatom)</option>
                      <option value="Dark Green">Dark Green (Dense)</option>
                      <option value="Clear / Low Bloom">Clear / Low Bloom</option>
                      <option value="Turbid / Muddy">Turbid / Muddy</option>
                      <option value="Yellowish Green">Yellowish Green</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Toxicity & Chemical Trace Elements */}
              <div style={styles.formSectionDivider} />
              <div style={styles.subSectionTitle}>Toxicity & Dissolved Gases</div>

              <div style={styles.waterGrid}>
                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>Ammonia - NH3 *</span>
                    <span style={styles.rangeBadge}>0 - 0.5 ppm</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={waterForm.ammonia}
                    onChange={(e) => setWaterForm({ ...waterForm, ammonia: e.target.value })}
                    style={styles.inputField}
                    placeholder="0.05"
                    required
                  />
                </div>

                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>Nitrite - NO2 *</span>
                    <span style={styles.rangeBadge}>0 - 0.25 ppm</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={waterForm.nitrite}
                    onChange={(e) => setWaterForm({ ...waterForm, nitrite: e.target.value })}
                    style={styles.inputField}
                    placeholder="0.02"
                    required
                  />
                </div>

                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>H2S - Hydrogen Sulfide</span>
                    <span style={styles.rangeBadge}>0 - 0.02 ppm</span>
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    value={waterForm.h2s}
                    onChange={(e) => setWaterForm({ ...waterForm, h2s: e.target.value })}
                    style={styles.inputField}
                    placeholder="0.005"
                  />
                </div>

                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>Cl - Chlorine / Chloride</span>
                    <span style={styles.rangeBadge}>0 - 0.02 ppm</span>
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    value={waterForm.cl}
                    onChange={(e) => setWaterForm({ ...waterForm, cl: e.target.value })}
                    style={styles.inputField}
                    placeholder="0.01"
                  />
                </div>

                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>Fe - Iron (ppm)</span>
                    <span style={styles.rangeBadge}>0 - 0.02 ppm</span>
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    value={waterForm.fe}
                    onChange={(e) => setWaterForm({ ...waterForm, fe: e.target.value })}
                    style={styles.inputField}
                    placeholder="0.01"
                  />
                </div>
              </div>

              {/* 5. Remarks */}
              <div style={{ ...styles.fieldGroup, marginTop: '6px' }}>
                <label style={styles.fieldLabel}>Remarks / Observations</label>
                <textarea
                  value={waterForm.notes}
                  onChange={(e) => setWaterForm({ ...waterForm, notes: e.target.value })}
                  placeholder="Water quality remarks and observations..."
                  rows={2}
                  style={styles.textareaField}
                />
              </div>
            </div>
          )}

          {/* ----------------- FEED ENTRY MODULE ----------------- */}
          {activeTab === 'FEED_ENTRY' && (
            <div style={styles.harvestDetailsCard}>
              <div style={styles.sectionHeaderWrap}>
                <h3 style={styles.sectionCardTitle}>Feed Testing & Performance</h3>
                <span style={styles.sectionBadge}>Daily Feed Register</span>
              </div>

              {/* 1. Timeline & Crop Stage */}
              <div style={styles.waterGrid}>
                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>DOC / Date *</span>
                  </div>
                  <input
                    type="date"
                    value={feedForm.date}
                    onChange={(e) => setFeedForm({ ...feedForm, date: e.target.value })}
                    style={styles.inputField}
                    required
                  />
                </div>
                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>DOC (Days of Culture) *</span>
                  </div>
                  <input
                    type="number"
                    value={feedForm.doc}
                    onChange={(e) => setFeedForm({ ...feedForm, doc: e.target.value })}
                    style={styles.inputField}
                    placeholder="36"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* 2. Stocking & Growth Parameters */}
              <div style={styles.formSectionDivider} />
              <div style={styles.subSectionTitle}>Stock & Growth Metrics</div>

              <div style={styles.waterGrid}>
                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>Seed (lac) *</span>
                    <span style={styles.rangeBadge}>Lakhs</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={feedForm.seedLac}
                    onChange={(e) => setFeedForm({ ...feedForm, seedLac: e.target.value })}
                    style={styles.inputField}
                    placeholder="2.5"
                    required
                  />
                </div>

                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>ABW (g) *</span>
                    <span style={styles.rangeBadge}>Avg Weight</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={feedForm.abw}
                    onChange={(e) => setFeedForm({ ...feedForm, abw: e.target.value })}
                    style={styles.inputField}
                    placeholder="12.5"
                    required
                  />
                </div>
              </div>

              {/* 3. Daily & Cumulative Feed */}
              <div style={styles.formSectionDivider} />
              <div style={styles.subSectionTitle}>Feed Consumption & Biomass</div>

              <div style={styles.waterGrid}>
                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>Day feed (Kg) *</span>
                    <span style={styles.rangeBadge}>Daily Rations</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={feedForm.dayFeedKg}
                    onChange={(e) => setFeedForm({ ...feedForm, dayFeedKg: e.target.value })}
                    style={styles.inputField}
                    placeholder="35.0"
                    required
                  />
                </div>

                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>Cumulative Feed (Kg) *</span>
                    <span style={styles.rangeBadge}>Total TCF</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={feedForm.cumulativeFeed}
                    onChange={(e) => handleFeedMetricChange('cumulativeFeed', e.target.value)}
                    style={styles.inputField}
                    placeholder="1080.0"
                    required
                  />
                </div>

                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>Total Biomass (Kg) *</span>
                    <span style={styles.rangeBadge}>Estimated</span>
                  </div>
                  <input
                    type="number"
                    step="1"
                    value={feedForm.totalBiomass}
                    onChange={(e) => handleFeedMetricChange('totalBiomass', e.target.value)}
                    style={styles.inputField}
                    placeholder="1250"
                    required
                  />
                </div>

                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>FCR *</span>
                    <span style={styles.formulaBadge}>Cum Feed / Biomass</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={feedForm.fcr}
                    onChange={(e) => setFeedForm({ ...feedForm, fcr: e.target.value })}
                    style={styles.inputField}
                    placeholder="0.86"
                    required
                  />
                </div>
              </div>

              {/* 4. Check Tray Testing (CH TR) */}
              <div style={styles.formSectionDivider} />
              <div style={styles.subSectionTitle}>Check Tray Testing (CH TR)</div>

              <div style={styles.waterGrid}>
                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>CH TR Feed (gr) *</span>
                    <span style={styles.rangeBadge}>Per Tray</span>
                  </div>
                  <input
                    type="number"
                    step="1"
                    value={feedForm.checkTrayFeedGr}
                    onChange={(e) => setFeedForm({ ...feedForm, checkTrayFeedGr: e.target.value })}
                    style={styles.inputField}
                    placeholder="150"
                    required
                  />
                </div>

                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>CH TR Time *</span>
                    <span style={styles.rangeBadge}>Duration</span>
                  </div>
                  <input
                    type="text"
                    value={feedForm.checkTrayTime}
                    onChange={(e) => setFeedForm({ ...feedForm, checkTrayTime: e.target.value })}
                    style={styles.inputField}
                    placeholder="1.5 hrs"
                    required
                  />
                </div>

                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>Feed Type / Brand</span>
                  </div>
                  <div style={styles.selectWrapper}>
                    <select
                      value={feedForm.feedType}
                      onChange={(e) => setFeedForm({ ...feedForm, feedType: e.target.value })}
                      style={styles.selectInput}
                    >
                      <option value="Starter-1">Starter-1 (0.8mm Crumble)</option>
                      <option value="Starter-2">Starter-2 (1.2mm Pellets)</option>
                      <option value="Grower-1">Grower-1 (1.6mm Pellets)</option>
                      <option value="Grower-2">Grower-2 (2.0mm Pellets)</option>
                      <option value="Finisher">Finisher (2.3mm Pellets)</option>
                      <option value="Royals Supreme">Royals Supreme</option>
                      <option value="Hypro+ Premium">Hypro+ Premium</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 5. Remarks */}
              <div style={{ ...styles.fieldGroup, marginTop: '6px' }}>
                <label style={styles.fieldLabel}>Remarks</label>
                <textarea
                  value={feedForm.remarks}
                  onChange={(e) => setFeedForm({ ...feedForm, remarks: e.target.value })}
                  placeholder="Feed consumption status, tray check observations, feeding remarks..."
                  rows={2}
                  style={styles.textareaField}
                />
              </div>
            </div>
          )}

          {/* ----------------- DISEASE MODULE ----------------- */}
          {activeTab === 'DISEASE' && (
            <div style={styles.harvestDetailsCard}>
              <div style={styles.sectionHeaderWrap}>
                <h3 style={styles.sectionCardTitle}>Disease & Health Observation</h3>
                <span style={{ ...styles.sectionBadge, color: '#DC2626', backgroundColor: '#FEE2E2', borderColor: '#FECACA' }}>
                  Field Diagnosis
                </span>
              </div>

              {/* 1. Timeline & Crop Stage */}
              <div style={styles.waterGrid}>
                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>DOC / Date *</span>
                  </div>
                  <input
                    type="date"
                    value={diseaseForm.date}
                    onChange={(e) => setDiseaseForm({ ...diseaseForm, date: e.target.value })}
                    style={styles.inputField}
                    required
                  />
                </div>
                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>DOC (Days of Culture) *</span>
                  </div>
                  <input
                    type="number"
                    value={diseaseForm.doc}
                    onChange={(e) => setDiseaseForm({ ...diseaseForm, doc: e.target.value })}
                    style={styles.inputField}
                    placeholder="36"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* 2. Disease / Symptom Multi-Select Matrix */}
              <div style={styles.formSectionDivider} />
              <div style={styles.subSectionTitle}>Select Observed Symptoms & Diseases</div>

              <div style={styles.diseaseChipGrid}>
                {DISEASE_SYMPTOMS.map(symptom => {
                  const isSelected = diseaseForm.selectedDiseases.includes(symptom);
                  return (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => toggleDiseaseSymptom(symptom)}
                      style={{
                        ...styles.diseaseChip,
                        ...(isSelected ? styles.diseaseChipSelected : {})
                      }}
                    >
                      <div style={{
                        ...styles.diseaseCheckbox,
                        ...(isSelected ? styles.diseaseCheckboxSelected : {})
                      }}>
                        {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                      </div>
                      <span style={{ fontWeight: isSelected ? '700' : '500' }}>{symptom}</span>
                    </button>
                  );
                })}
              </div>

              {/* 3. Severity & Impact */}
              <div style={styles.formSectionDivider} />
              <div style={styles.subSectionTitle}>Severity & Impact Assessment</div>

              <div style={styles.waterGrid}>
                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>Severity Level *</span>
                    <span style={{
                      ...styles.rangeBadge,
                      color: diseaseForm.severity === 'Severe' || diseaseForm.severity === 'Critical' ? '#DC2626' : '#D97706',
                      backgroundColor: diseaseForm.severity === 'Severe' || diseaseForm.severity === 'Critical' ? '#FEE2E2' : '#FEF3C7',
                      borderColor: diseaseForm.severity === 'Severe' || diseaseForm.severity === 'Critical' ? '#FECACA' : '#FDE68A'
                    }}>
                      {diseaseForm.severity}
                    </span>
                  </div>
                  <div style={styles.selectWrapper}>
                    <select
                      value={diseaseForm.severity}
                      onChange={(e) => setDiseaseForm({ ...diseaseForm, severity: e.target.value })}
                      style={styles.selectInput}
                      required
                    >
                      <option value="Mild">Mild (Initial Signs)</option>
                      <option value="Moderate">Moderate (Observable in Trays)</option>
                      <option value="Severe">Severe (Spread in Tank)</option>
                      <option value="Critical">Critical (Immediate Treatment Needed)</option>
                    </select>
                  </div>
                </div>

                <div style={styles.waterFieldWrap}>
                  <div style={styles.labelWithBadge}>
                    <span style={styles.fieldLabelText}>Affected Population (%) *</span>
                  </div>
                  <div style={styles.selectWrapper}>
                    <select
                      value={diseaseForm.affectedPercentage}
                      onChange={(e) => setDiseaseForm({ ...diseaseForm, affectedPercentage: e.target.value })}
                      style={styles.selectInput}
                      required
                    >
                      <option value="< 5%">&lt; 5% (Low Incidence)</option>
                      <option value="5 - 10%">5 - 10% (Noticeable)</option>
                      <option value="10 - 25%">10 - 25% (Elevated)</option>
                      <option value="> 25%">&gt; 25% (Widespread)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Action / Treatment Taken */}
              <div style={{ ...styles.fieldGroup, marginTop: '4px' }}>
                <label style={styles.fieldLabel}>Action / Treatment Taken</label>
                <input
                  type="text"
                  value={diseaseForm.actionTaken}
                  onChange={(e) => setDiseaseForm({ ...diseaseForm, actionTaken: e.target.value })}
                  placeholder="e.g. Applied gut probiotic, reduced feed by 25%, salt addition"
                  style={styles.inputField}
                />
              </div>

              {/* 5. Remarks */}
              <div style={{ ...styles.fieldGroup, marginTop: '2px' }}>
                <label style={styles.fieldLabel}>Remarks / Field Diagnosis</label>
                <textarea
                  value={diseaseForm.remarks}
                  onChange={(e) => setDiseaseForm({ ...diseaseForm, remarks: e.target.value })}
                  placeholder="Detailed symptoms, check tray observations, swimming behavior remarks..."
                  rows={2}
                  style={styles.textareaField}
                />
              </div>
            </div>
          )}

          {/* ----------------- MORTALITY MODULE ----------------- */}
          {activeTab === 'MORTALITY_LOG' && (
            <div style={styles.harvestDetailsCard}>
              <h3 style={styles.sectionCardTitle}>Mortality Record</h3>
              <div style={styles.twoColGrid}>
                <div>
                  <label style={styles.fieldLabel}>Mortality Count *</label>
                  <input
                    type="number"
                    value={mortalityForm.count}
                    onChange={(e) => setMortalityForm({ ...mortalityForm, count: e.target.value })}
                    style={styles.inputField}
                    placeholder="25"
                    required
                  />
                </div>
                <div>
                  <label style={styles.fieldLabel}>Reason *</label>
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
            </div>
          )}

          {/* ----------------- MEDICATION MODULE ----------------- */}
          {activeTab === 'MEDICATION' && (
            <div style={styles.harvestDetailsCard}>
              <h3 style={styles.sectionCardTitle}>Medication & Probiotics</h3>
              <div style={styles.twoColGrid}>
                <div>
                  <label style={styles.fieldLabel}>Medicine / Product *</label>
                  <input
                    type="text"
                    value={medicationForm.medicineName}
                    onChange={(e) => setMedicationForm({ ...medicationForm, medicineName: e.target.value })}
                    style={styles.inputField}
                    placeholder="Probiotic Mix"
                    required
                  />
                </div>
                <div>
                  <label style={styles.fieldLabel}>Dosage *</label>
                  <input
                    type="text"
                    value={medicationForm.dosage}
                    onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                    style={styles.inputField}
                    placeholder="1 kg / acre"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* ----------------- FARM ACTIVITY MODULE ----------------- */}
          {activeTab === 'FARM_ACTIVITY' && (
            <div style={styles.harvestDetailsCard}>
              <h3 style={styles.sectionCardTitle}>Activity Log</h3>
              <div>
                <label style={styles.fieldLabel}>Activity Type *</label>
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
            </div>
          )}

          {/* ----------------- PHOTO OBSERVATION MODULE ----------------- */}
          {activeTab === 'PHOTO_OBSERVATION' && (
            <div style={styles.harvestDetailsCard}>
              <h3 style={styles.sectionCardTitle}>Attach Field Observation Photo</h3>
              <div>
                <label style={styles.fieldLabel}>Select File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoName(e.target.files[0]?.name || 'Photo Attached')}
                  style={styles.inputField}
                />
              </div>
            </div>
          )}

          {/* ----------------- SUBMIT BUTTON ----------------- */}
          <button 
            type="submit" 
            disabled={isSelectedTankClosed}
            className="transition-all duration-200 hover:brightness-110 active:scale-98 cursor-pointer"
            style={{
              ...styles.primaryButton,
              backgroundColor: isSelectedTankClosed ? '#94A3B8' : '#1A2FB8',
              cursor: isSelectedTankClosed ? 'not-allowed' : 'pointer',
              opacity: isSelectedTankClosed ? 0.7 : 1,
            }}
          >
            {isSelectedTankClosed 
              ? 'Tank Closed (Final Harvest Done)' 
              : (activeTab === 'HARVEST_ENTRY' ? 'Save Harvest Record' : `Save ${currentTabObj.label} Record`)}
          </button>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: 'max(10px, env(safe-area-inset-top, 10px)) 10px max(10px, env(safe-area-inset-bottom, 10px)) 10px',
    boxSizing: 'border-box',
    backdropFilter: 'blur(3px)',
  },
  modalOverlay: {
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
    padding: 'max(10px, env(safe-area-inset-top, 10px)) 10px max(10px, env(safe-area-inset-bottom, 10px)) 10px',
    boxSizing: 'border-box',
    backdropFilter: 'blur(3px)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '92vh',
    maxHeight: '92dvh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
    border: '1px solid #E2E8F0',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: 'clamp(14px, 3.5vw, 24px)',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  headerTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerIconBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#F0F4FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 'clamp(16px, 4vw, 19px)',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.2px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    minWidth: '40px',
    minHeight: '40px',
  },
  moduleNavGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 105px), 1fr))',
    gap: '6px',
    marginBottom: '18px',
  },
  moduleButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    minHeight: '40px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    fontSize: 'clamp(11px, 2.2vw, 12px)',
    padding: '0 6px',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  twoColGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
    gap: '10px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldLabel: {
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#475569',
    margin: 0,
  },
  selectWrapper: {
    position: 'relative',
    width: '100%',
  },
  selectInput: {
    width: '100%',
    height: '42px',
    padding: '0 12px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '13.5px',
    color: '#0F172A',
    fontWeight: '500',
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  inputField: {
    width: '100%',
    height: '42px',
    padding: '0 12px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '13.5px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textareaField: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '13.5px',
    color: '#0F172A',
    outline: 'none',
    resize: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    lineHeight: '1.4',
  },
  gpsCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '10px 14px',
  },
  gpsLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  gpsTextCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  gpsLocationText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0F172A',
  },
  gpsStatusText: {
    fontSize: '11.5px',
    fontWeight: '500',
    color: '#15803D',
  },
  gpsRefreshBtn: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    cursor: 'pointer',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  harvestDetailsCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionCardTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.1px',
  },
  radioGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  radioCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    cursor: 'pointer',
    userSelect: 'none',
  },
  radioNative: {
    accentColor: '#1A2FB8',
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  primaryButton: {
    width: '100%',
    height: '48px',
    borderRadius: '14px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(26, 47, 184, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '4px',
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  infoCardText: {
    fontSize: '12px',
    lineHeight: '1.5',
    color: '#1E40AF',
    margin: 0,
    fontWeight: '500',
  },
  successBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '10px',
    padding: '16px 0',
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
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },
  successSub: {
    fontSize: '13.5px',
    color: '#64748B',
    margin: '0 0 10px 0',
  },
  successDetailsCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    boxSizing: 'border-box',
    marginBottom: '10px',
  },
  successDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#334155',
  },
  sectionHeaderWrap: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionBadge: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#1A2FB8',
    backgroundColor: '#EFF6FF',
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1px solid #DBEAFE',
  },
  formSectionDivider: {
    height: '1px',
    backgroundColor: '#E2E8F0',
    margin: '6px 0 2px 0',
  },
  subSectionTitle: {
    fontSize: '11.5px',
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginBottom: '-2px',
  },
  waterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px 14px',
    width: '100%',
  },
  waterFieldWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
    boxSizing: 'border-box',
  },
  labelWithBadge: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '20px',
    gap: '4px',
    width: '100%',
  },
  fieldLabelText: {
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#475569',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rangeBadge: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#1A2FB8',
    backgroundColor: '#EFF6FF',
    padding: '1px 6px',
    borderRadius: '4px',
    border: '1px solid #DBEAFE',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  formulaBadge: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    padding: '1px 6px',
    borderRadius: '4px',
    border: '1px solid #A7F3D0',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  diseaseChipGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 130px), 1fr))',
    gap: '8px',
    marginTop: '2px',
  },
  diseaseChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 10px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    color: '#334155',
    fontSize: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    boxSizing: 'border-box',
    userSelect: 'none',
  },
  diseaseChipSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    color: '#B91C1C',
    boxShadow: '0 1px 4px rgba(239, 68, 68, 0.12)',
  },
  diseaseCheckbox: {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
    border: '1.5px solid #CBD5E1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
  },
  diseaseCheckboxSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
};

export default QuickRecordModal;
