import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Droplets, MapPin, CheckCircle, RefreshCw, ChevronDown,
  Check, Plus, Lock, Calendar, Clock, ChevronUp, Scale, Wheat, Bug
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';
import { getInchargeSession } from '../../incharge/utils/inchargeAuth';
import { getStoredGPS, captureDeviceGPS, requestSubmissionGPS } from '../utils/gpsService';
import { queueOfflineRecord } from '../utils/syncService';
import MarineLoader from '../../components/MarineLoader';

const QuickRecordModalInner = ({
  isOpen,
  onClose,
  initialType = 'WATER_QUALITY',
  preselectedFarmerId = null,
  preselectedTankId = null,
  onSuccess,
  userRole = null
}) => {
  const { db, getFarmersByAgentId, getTanksByFarmerId, recordFieldEntry, getFarmersByInchargeId } = useMockData();
  const session = getSession();
  const inchargeSession = getInchargeSession();

  const isAdmin = Boolean(
    userRole === 'ADMIN' ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'))
  );

  const isIncharge = Boolean(
    !isAdmin && (
      userRole === 'INCHARGE' ||
      userRole === 'ASM' ||
      (typeof window !== 'undefined' && (
        window.location.pathname.startsWith('/incharge') ||
        window.location.pathname.startsWith('/asm')
      )) ||
      (inchargeSession && inchargeSession.inchargeId && !session?.agentId)
    )
  );

  const currentInchargeId = inchargeSession?.inchargeId || 'INC001';
  const currentAgentId = session?.agentId || 'agent001';

  // Active module: default to WATER_QUALITY
  const [activeTab, setActiveTab] = useState(initialType || 'WATER_QUALITY');
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);

  // Farmers and Tanks
  const assignedFarmers = isAdmin
    ? (db?.farmers || [])
    : isIncharge
      ? ((getFarmersByInchargeId && getFarmersByInchargeId(currentInchargeId)) || db?.farmers || [])
      : ((getFarmersByAgentId && getFarmersByAgentId(currentAgentId)) || db?.farmers || []);
  const [selectedFarmerId, setSelectedFarmerId] = useState(preselectedFarmerId || assignedFarmers[0]?.id || '');

  const farmerTanks = getTanksByFarmerId ? getTanksByFarmerId(selectedFarmerId) : (db?.tanks || []).filter(t => t.farmerId === selectedFarmerId);
  const tanks = farmerTanks;
  const [selectedTankId, setSelectedTankId] = useState(preselectedTankId || tanks[0]?.id || '');

  // GPS & Submission States
  const [gpsData, setGpsData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState(null);

  // Complete Water Quality Telemetry Parameters
  const [waterForm, setWaterForm] = useState({
    date: new Date().toISOString().split('T')[0],
    doc: '',
    salinity: '',
    ph: '',
    alkalinity: '',
    hardness: '',
    ammonia: '',
    nitrite: '',
    k: '',
    do: '',
    h2s: '',
    cl: '',
    fe: '',
    waterColor: 'Greenish',
    temperature: '',
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

  // Dedicated Feed form (Matching exact Feed slide specification)
  const [feedForm, setFeedForm] = useState({
    date: new Date().toISOString().split('T')[0],
    doc: '',
    seed: '',
    abw: '',
    dayFeed: '',
    cumulativeFeed: '',
    totalBiomass: '',
    fcr: '',
    checkTrayFeed: '',
    checkTrayTime: '10:30',
    remarks: '',
  });

  // Dedicated Disease form (Matching exact Disease slide specification)
  const DISEASE_LIST = [
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
    doc: '',
    // Map of disease name -> status ('Normal', 'Mild', 'Severe')
    status: {},
    affectedShrimpPct: '',
    remarks: '',
  });

  const toggleDiseaseStatus = (disease, level) => {
    setDiseaseForm(prev => {
      const current = prev.status[disease];
      const newStatus = { ...prev.status };
      if (current === level) {
        // Uncheck / return to unaffected
        delete newStatus[disease];
      } else {
        newStatus[disease] = level;
      }
      return { ...prev, status: newStatus };
    });
  };

  // Auto-calculate FCR: Cumulative Feed / Total Biomass
  const handleFeedChange = (field, val) => {
    setFeedForm(prev => {
      const updated = { ...prev, [field]: val };
      const cumFeed = parseFloat(field === 'cumulativeFeed' ? val : updated.cumulativeFeed);
      const biomass = parseFloat(field === 'totalBiomass' ? val : updated.totalBiomass);
      if (!isNaN(cumFeed) && !isNaN(biomass) && biomass > 0) {
        updated.fcr = (cumFeed / biomass).toFixed(2);
      } else if (field === 'cumulativeFeed' || field === 'totalBiomass') {
        updated.fcr = '';
      }
      return updated;
    });
  };

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

  // Pre-fill initial DOC and Seed only when tank is first loaded or explicitly switched
  const prevTankKeyRef = useRef(null);
  useEffect(() => {
    if (!selectedTankId || tanks.length === 0) return;
    const tankKey = `${selectedFarmerId}_${selectedTankId}`;
    if (prevTankKeyRef.current === tankKey) return;

    const t = tanks.find(x => x.id === selectedTankId);
    if (t) {
      prevTankKeyRef.current = tankKey;

      let initialDoc = '';
      if (t.doc !== undefined && t.doc !== null && t.doc !== '') {
        initialDoc = String(t.doc);
      } else if (t.stockingDate) {
        const diffDays = Math.floor((new Date() - new Date(t.stockingDate)) / 86400000);
        initialDoc = String(Math.max(0, diffDays));
      }

      const initialSeed = t.seedStocked 
        ? String((parseFloat(t.seedStocked) / 100000).toFixed(1)) 
        : (t.seed ? String(t.seed) : (t.seedStockingLak ? String(t.seedStockingLak) : ''));

      setWaterForm(prev => ({
        ...prev,
        doc: initialDoc
      }));
      setFeedForm(prev => ({
        ...prev,
        doc: initialDoc,
        seed: initialSeed
      }));
      setDiseaseForm(prev => ({
        ...prev,
        doc: initialDoc
      }));
      setHarvestForm(prev => ({
        ...prev,
        doc: initialDoc
      }));
    }
  }, [selectedFarmerId, selectedTankId, tanks]);

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
    setWaterForm(prev => {
      const next = { ...prev, salinity: val };
      if (!isNaN(num) && num > 0) {
        // 1 Salinity = 300 ppm hardness
        next.hardness = String(Math.round(num * 300));
        // 1 Salinity = 10.7 ppm Potassium (K)
        next.k = String((num * 10.7).toFixed(1));
      }
      return next;
    });
  };

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
    const isFeed = activeTab === 'FEED_ENTRY';
    const isDisease = activeTab === 'DISEASE_ENTRY';
    const testTypeName = isHarvest 
      ? 'Harvest' 
      : (isFeed ? 'Feed Check Analysis' : (isDisease ? 'Disease Inspection' : 'Water Analysis'));
    const recordTypeKey = isHarvest 
      ? 'HARVEST_ENTRY' 
      : (isFeed ? 'FEED_ENTRY' : (isDisease ? 'DISEASE_ENTRY' : 'WATER_QUALITY'));
    const formData = isHarvest ? harvestForm : (isFeed ? feedForm : (isDisease ? diseaseForm : waterForm));

    const recordId = `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date(locationFix.timestamp || Date.now());
    const formattedDate = (isFeed ? feedForm.date : (isHarvest ? harvestForm.date : (isDisease ? diseaseForm.date : waterForm.date))) || now.toISOString().split('T')[0];
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const resolvedRole = isAdmin ? 'Admin' : (isIncharge ? 'Incharge' : 'Agent');
    const resolvedUserId = isAdmin
      ? 'ADMIN'
      : isIncharge
        ? (inchargeSession?.inchargeId || inchargeSession?.id || 'INC001')
        : (session?.agentId || session?.id || 'agent001');
    const resolvedUserName = isAdmin
      ? 'Administrator'
      : isIncharge
        ? (inchargeSession?.name || 'Incharge')
        : (session?.name || 'Technician');

    const enrichedData = isHarvest || isFeed || isDisease ? formData : {
      ...formData,
      cl: formData.cl ?? formData.chlorine ?? '',
      chlorine: formData.chlorine ?? formData.cl ?? '',
      fe: formData.fe ?? formData.iron ?? '',
      iron: formData.iron ?? formData.fe ?? '',
      waterColor: formData.waterColor ?? formData.waterColour ?? 'Greenish',
      waterColour: formData.waterColour ?? formData.waterColor ?? 'Greenish',
    };

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
      recordType: recordTypeKey,
      date: formattedDate,
      time: formattedTime,
      submissionTime: formattedTime,
      timestamp: now.toISOString(),
      submittedAt: now.toISOString(),
      latitude: locationFix.latitude,
      longitude: locationFix.longitude,
      accuracy: locationFix.accuracy,
      locality: locationFix.locality || (farmer?.location || 'Coastal Aquaculture Zone'),
      data: enrichedData,
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
              {activeTab === 'DISEASE_ENTRY' ? (
                <>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Reported Issues</span>
                    <strong style={{ ...styles.successPillVal, color: Object.keys(diseaseForm.status).length > 0 ? '#DC2626' : '#16A34A' }}>
                      {Object.keys(diseaseForm.status).length > 0 ? `${Object.keys(diseaseForm.status).length} detected` : 'All Normal'}
                    </strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>DOC</span>
                    <strong style={styles.successPillVal}>{diseaseForm.doc || '77'}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Affected %</span>
                    <strong style={styles.successPillVal}>{diseaseForm.affectedShrimpPct ? `${diseaseForm.affectedShrimpPct}%` : 'Negligible'}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Status</span>
                    <strong style={{ ...styles.successPillVal, color: '#16A34A' }}>Health Checked</strong>
                  </div>
                </>
              ) : activeTab === 'FEED_ENTRY' ? (
                <>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Day / Cum Feed</span>
                    <strong style={styles.successPillVal}>{feedForm.dayFeed || '0'} / {feedForm.cumulativeFeed || '0'} kg</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>ABW</span>
                    <strong style={styles.successPillVal}>{feedForm.abw || '0'} g</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Total Biomass</span>
                    <strong style={styles.successPillVal}>{feedForm.totalBiomass || '0'} kg</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>FCR</span>
                    <strong style={{ ...styles.successPillVal, color: '#16A34A' }}>{feedForm.fcr || '1.14'}</strong>
                  </div>
                </>
              ) : activeTab === 'HARVEST_ENTRY' ? (
                <>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Harvest Type</span>
                    <strong style={styles.successPillVal}>{harvestForm.harvestType}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>ABW</span>
                    <strong style={styles.successPillVal}>{harvestForm.abw} g</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Biomass</span>
                    <strong style={styles.successPillVal}>{harvestForm.harvestedBiomass} kg</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>DOC</span>
                    <strong style={styles.successPillVal}>{harvestForm.doc || '77'}</strong>
                  </div>
                </>
              ) : (
                <>
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
                    <strong style={styles.successPillVal}>{waterForm.temperature || '28.5'} °C</strong>
                  </div>
                </>
              )}
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
              ) : activeTab === 'FEED_ENTRY' ? (
                <Wheat size={18} color="#1A2FB8" strokeWidth={2.4} />
              ) : activeTab === 'DISEASE_ENTRY' ? (
                <Bug size={18} color="#DC2626" strokeWidth={2.4} />
              ) : (
                <Droplets size={18} color="#1A2FB8" strokeWidth={2.4} />
              )}
            </div>
            <div>
              <h2 style={styles.title}>
                {activeTab === 'HARVEST_ENTRY' 
                  ? 'New Harvest Entry' 
                  : activeTab === 'FEED_ENTRY' 
                  ? 'New Feed Record' 
                  : activeTab === 'DISEASE_ENTRY'
                  ? 'Disease Inspection Log'
                  : 'New Test Record'}
              </h2>
              <p style={styles.subtitle}>
                {activeTab === 'HARVEST_ENTRY' 
                  ? 'Log pond harvest data' 
                  : activeTab === 'FEED_ENTRY' 
                  ? 'Log feed check, biomass & FCR data' 
                  : activeTab === 'DISEASE_ENTRY'
                  ? 'Assess shrimp symptoms & clinical conditions'
                  : 'Enter necessary water parameters'}
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

          {/* ==================================================================== */}
          {/* A. FEED ENTRY FORM: Matches Exact Feed Slide Requirements */}
          {/* ==================================================================== */}
          {activeTab === 'FEED_ENTRY' ? (
            <>
              {/* 1. DOC - Data entry date */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>Data Entry Date</label>
                  <input
                    type="date"
                    value={feedForm.date}
                    onChange={(e) => handleFeedChange('date', e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>DOC (Day of Culture)</label>
                  <input
                    type="number"
                    value={feedForm.doc}
                    onChange={(e) => handleFeedChange('doc', e.target.value)}
                    placeholder="e.g. 77"
                    style={styles.input}
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Feed Grid Parameters */}
              <div style={styles.sectionHeader}>
                <span style={styles.sectionLabel}>FEEDING & BIOMASS PARAMETERS</span>
              </div>

              <div style={styles.paramGrid}>
                {/* 2. Seed (lac) */}
                <div style={styles.paramCard}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitle}>Seed Stocked</span>
                    <span style={styles.paramUnit}>lac</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={feedForm.seed}
                    onChange={(e) => handleFeedChange('seed', e.target.value)}
                    placeholder="e.g. 2.5"
                    style={styles.paramInput}
                    required
                  />
                  <span style={styles.paramStatus}>Stocking in Lakhs</span>
                </div>

                {/* 3. ABW (Average Body Weight) */}
                <div style={styles.paramCard}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitle}>ABW</span>
                    <span style={styles.paramUnit}>grams</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={feedForm.abw}
                    onChange={(e) => handleFeedChange('abw', e.target.value)}
                    placeholder="e.g. 18.5"
                    style={styles.paramInput}
                    required
                  />
                  <span style={styles.paramStatus}>Average Body Weight</span>
                </div>

                {/* 4. Day Feed (Kg) */}
                <div style={styles.paramCard}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitle}>Day Feed</span>
                    <span style={styles.paramUnit}>Kg</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={feedForm.dayFeed}
                    onChange={(e) => handleFeedChange('dayFeed', e.target.value)}
                    placeholder="e.g. 120"
                    style={styles.paramInput}
                    required
                  />
                  <span style={styles.paramStatus}>Daily Feed Given</span>
                </div>

                {/* 5. Cumulative Feed (Kg) */}
                <div style={styles.paramCard}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitle}>Cumulative Feed</span>
                    <span style={styles.paramUnit}>Kg</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={feedForm.cumulativeFeed}
                    onChange={(e) => handleFeedChange('cumulativeFeed', e.target.value)}
                    placeholder="e.g. 16000"
                    style={styles.paramInput}
                    required
                  />
                  <span style={styles.paramStatus}>Total Feed to Date</span>
                </div>

                {/* 6. Total Biomass (Kg) */}
                <div style={styles.paramCard}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitle}>Total Biomass</span>
                    <span style={styles.paramUnit}>Kg</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={feedForm.totalBiomass}
                    onChange={(e) => handleFeedChange('totalBiomass', e.target.value)}
                    placeholder="e.g. 14035"
                    style={styles.paramInput}
                    required
                  />
                  <span style={styles.paramStatus}>Standing Biomass</span>
                </div>

                {/* 7. FCR - Formula: Cumulative Feed / Total Biomass */}
                <div style={{ ...styles.paramCard, backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE' }}>
                  <div style={styles.paramHeader}>
                    <span style={{ ...styles.paramTitle, color: '#1E40AF', fontWeight: '800' }}>FCR</span>
                    <span style={{ ...styles.paramUnit, color: '#2563EB', fontWeight: '700' }}>Formula Ratio</span>
                  </div>
                  <input
                    type="text"
                    value={feedForm.fcr}
                    readOnly
                    placeholder="Auto-calculated"
                    style={{ ...styles.paramInput, color: '#1E40AF', fontWeight: '800', fontSize: '17px' }}
                  />
                  <span style={{ ...styles.paramStatus, color: '#2563EB', fontWeight: '600' }}>
                    Cum Feed ÷ Total Biomass
                  </span>
                </div>

                {/* 8. CH TR Feed (gr) */}
                <div style={styles.paramCard}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitle}>CH TR Feed</span>
                    <span style={styles.paramUnit}>grams</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={feedForm.checkTrayFeed}
                    onChange={(e) => handleFeedChange('checkTrayFeed', e.target.value)}
                    placeholder="e.g. 250"
                    style={styles.paramInput}
                  />
                  <span style={styles.paramStatus}>Check-tray Feed</span>
                </div>

                {/* 9. CH TR Time */}
                <div style={styles.paramCard}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitle}>CH TR Time</span>
                    <span style={styles.paramUnit}>Check Time</span>
                  </div>
                  <input
                    type="time"
                    value={feedForm.checkTrayTime}
                    onChange={(e) => handleFeedChange('checkTrayTime', e.target.value)}
                    style={styles.paramInput}
                  />
                  <span style={styles.paramStatus}>Check-tray Time</span>
                </div>
              </div>

              {/* 10. Remarks */}
              <div style={{ marginTop: '12px' }}>
                <label style={styles.label}>Remarks</label>
                <textarea
                  value={feedForm.remarks}
                  onChange={(e) => handleFeedChange('remarks', e.target.value)}
                  placeholder="Feed adjustment notes, shrimp appetite, tray observations..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    color: '#0F172A',
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
            </>
          ) : activeTab === 'DISEASE_ENTRY' ? (
            <>
              {/* Date & DOC */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>Inspection Date</label>
                  <input
                    type="date"
                    value={diseaseForm.date}
                    onChange={(e) => setDiseaseForm({ ...diseaseForm, date: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>DOC (Day of Culture)</label>
                  <input
                    type="number"
                    value={diseaseForm.doc}
                    onChange={(e) => setDiseaseForm(prev => ({ ...prev, doc: e.target.value }))}
                    placeholder="e.g. 77"
                    style={styles.input}
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Disease Checklist Header */}
              <div style={styles.sectionHeader}>
                <span style={styles.sectionLabel}>DISEASE & PATHOLOGY SCREENING ({DISEASE_LIST.length} PARAMETERS)</span>
              </div>

              {/* Responsive Disease Card List */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '8px',
                marginTop: '8px'
              }}>
                {DISEASE_LIST.map((disease) => {
                  const currentLevel = diseaseForm.status[disease]; // undefined, 'Mild', or 'Severe'
                  const isPresent = Boolean(currentLevel);

                  return (
                    <div 
                      key={disease}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: isPresent 
                          ? (currentLevel === 'Severe' ? '1.5px solid #EF4444' : '1.5px solid #F59E0B') 
                          : '1px solid #E2E8F0',
                        backgroundColor: isPresent 
                          ? (currentLevel === 'Severe' ? '#FEF2F2' : '#FFFBEB') 
                          : '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ 
                          fontSize: '13px', 
                          fontWeight: isPresent ? '700' : '600',
                          color: isPresent ? (currentLevel === 'Severe' ? '#B91C1C' : '#B45309') : '#1E293B' 
                        }}>
                          {disease}
                        </span>
                        {isPresent ? (
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            backgroundColor: currentLevel === 'Severe' ? '#FEE2E2' : '#FEF3C7',
                            color: currentLevel === 'Severe' ? '#DC2626' : '#D97706',
                          }}>
                            {currentLevel}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '500' }}>
                            Normal
                          </span>
                        )}
                      </div>

                      {/* Tri-state buttons: Normal / Mild / Severe */}
                      <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (currentLevel) {
                              setDiseaseForm(prev => {
                                const next = { ...prev.status };
                                delete next[disease];
                                return { ...prev, status: next };
                              });
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '4px 6px',
                            fontSize: '11px',
                            fontWeight: !isPresent ? '700' : '500',
                            borderRadius: '6px',
                            border: !isPresent ? '1px solid #CBD5E1' : '1px solid #F1F5F9',
                            backgroundColor: !isPresent ? '#F1F5F9' : '#FFFFFF',
                            color: !isPresent ? '#334155' : '#94A3B8',
                            cursor: 'pointer'
                          }}
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleDiseaseStatus(disease, 'Mild')}
                          style={{
                            flex: 1,
                            padding: '4px 6px',
                            fontSize: '11px',
                            fontWeight: currentLevel === 'Mild' ? '700' : '500',
                            borderRadius: '6px',
                            border: currentLevel === 'Mild' ? '1px solid #F59E0B' : '1px solid #F1F5F9',
                            backgroundColor: currentLevel === 'Mild' ? '#FEF3C7' : '#FFFFFF',
                            color: currentLevel === 'Mild' ? '#B45309' : '#64748B',
                            cursor: 'pointer'
                          }}
                        >
                          Mild
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleDiseaseStatus(disease, 'Severe')}
                          style={{
                            flex: 1,
                            padding: '4px 6px',
                            fontSize: '11px',
                            fontWeight: currentLevel === 'Severe' ? '700' : '500',
                            borderRadius: '6px',
                            border: currentLevel === 'Severe' ? '1px solid #EF4444' : '1px solid #F1F5F9',
                            backgroundColor: currentLevel === 'Severe' ? '#FEE2E2' : '#FFFFFF',
                            color: currentLevel === 'Severe' ? '#DC2626' : '#64748B',
                            cursor: 'pointer'
                          }}
                        >
                          Severe
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Affected % and Remarks */}
              <div style={{ ...styles.twoColRow, marginTop: '12px' }}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>Estimated Population Affected (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={diseaseForm.affectedShrimpPct}
                    onChange={(e) => setDiseaseForm({ ...diseaseForm, affectedShrimpPct: e.target.value })}
                    placeholder="e.g. 5%"
                    style={styles.input}
                  />
                </div>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>Clinical Symptoms / Action Taken</label>
                  <input
                    type="text"
                    value={diseaseForm.remarks}
                    onChange={(e) => setDiseaseForm({ ...diseaseForm, remarks: e.target.value })}
                    placeholder="Treatment applied, isolation, sample sent..."
                    style={styles.input}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Date (Insert Date Box) & DOC */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={styles.label}>Date</label>
                    <span style={styles.rangeHint}></span>
                  </div>
                  <input
                    type="date"
                    value={waterForm.date}
                    onChange={(e) => setWaterForm({ ...waterForm, date: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.fieldCol}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={styles.label}>DOC</label>
                    <span style={styles.rangeHint}></span>
                  </div>
                  <input
                    type="number"
                    value={waterForm.doc}
                    onChange={(e) => setWaterForm(prev => ({ ...prev, doc: e.target.value }))}
                    placeholder="e.g. 45"
                    style={styles.input}
                    min="0"
                    required
                  />
                </div>
              </div>

          {/* Water Quality Telemetry Parameters (Responsive Grid) */}
          <div style={styles.sectionHeader}>
            <span style={styles.sectionLabel}>WATER QUALITY</span>
          </div>

          <div style={styles.paramGrid}>
            {/* 1. Salinity: 0-30 ppt */}
            <div style={styles.paramCard}>
              <div style={styles.paramHeader}>
                <span style={styles.paramTitle}>Salinity</span>
                <span style={styles.paramUnit}></span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="40"
                value={waterForm.salinity}
                onChange={(e) => handleSalinityChange(e.target.value)}
                placeholder="16.0"
                style={styles.paramInput}
                required
              />
              <span style={styles.paramStatus}></span>
            </div>

            {/* 2. pH: 7.5 to 8.5 */}
            <div style={styles.paramCard}>
              <div style={styles.paramHeader}>
                <span style={styles.paramTitle}>pH Level</span>
                <span style={styles.paramUnit}></span>
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
              <span style={styles.paramStatus}></span>
            </div>

            {/* 3. Alkalinity: 100-300 ppm */}
            <div style={styles.paramCard}>
              <div style={styles.paramHeader}>
                <span style={styles.paramTitle}>Alkalinity</span>
                <span style={styles.paramUnit}></span>
              </div>
              <input
                type="number"
                step="1"
                value={waterForm.alkalinity}
                onChange={(e) => setWaterForm({ ...waterForm, alkalinity: e.target.value })}
                placeholder="140"
                style={styles.paramInput}
              />
              <span style={styles.paramStatus}></span>
            </div>

            {/* 4. Hardness: based on salinity (1 salinity-300 ppm) */}
            <div style={styles.paramCard}>
              <div style={styles.paramHeader}>
                <span style={styles.paramTitle}>Hardness</span>
                <span style={styles.paramUnit}>ppm</span>
              </div>
              <input
                type="number"
                step="1"
                value={waterForm.hardness}
                onChange={(e) => setWaterForm({ ...waterForm, hardness: e.target.value })}
                placeholder="4800"
                style={styles.paramInput}
              />
              <span style={styles.paramStatus}></span>
            </div>

            {/* 5. Potassium (K): based on salinity (1 salinity - 10.7ppm) */}
            <div style={styles.paramCard}>
              <div style={styles.paramHeader}>
                <span style={styles.paramTitle}>Potassium (K)</span>
                <span style={styles.paramUnit}>ppm</span>
              </div>
              <input
                type="number"
                step="0.1"
                value={waterForm.k}
                onChange={(e) => setWaterForm({ ...waterForm, k: e.target.value })}
                placeholder="171.2"
                style={styles.paramInput}
              />
              <span style={styles.paramStatus}></span>
            </div>

            {/* 6. Dissolved Oxygen (DO): (<4 alert) */}
            <div style={styles.paramCard}>
              <div style={styles.paramHeader}>
                <span style={styles.paramTitle}>DO (Dissolved Oxygen)</span>
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
              <span style={{
                ...styles.paramStatus,
                color: (parseFloat(waterForm.do) > 0 && parseFloat(waterForm.do) < 4) ? '#DC2626' : '#16A34A',
                fontWeight: (parseFloat(waterForm.do) > 0 && parseFloat(waterForm.do) < 4) ? '700' : '500'
              }}>
              </span>
            </div>

            {/* 7. Ammonia: (0 - >0.5) */}
            <div style={styles.paramCard}>
              <div style={styles.paramHeader}>
                <span style={styles.paramTitle}>Ammonia (NH3)</span>
                <span style={styles.paramUnit}>ppm</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={waterForm.ammonia}
                onChange={(e) => setWaterForm({ ...waterForm, ammonia: e.target.value })}
                placeholder="0.05"
                style={styles.paramInput}
              />
              <span style={{
                ...styles.paramStatus,
                color: (parseFloat(waterForm.ammonia) > 0.5) ? '#DC2626' : '#64748B'
              }}>
              </span>
            </div>

            {/* 8. Nitrite: (0 - >0.25) */}
            <div style={styles.paramCard}>
              <div style={styles.paramHeader}>
                <span style={styles.paramTitle}>Nitrite (NO2)</span>
                <span style={styles.paramUnit}>ppm</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={waterForm.nitrite}
                onChange={(e) => setWaterForm({ ...waterForm, nitrite: e.target.value })}
                placeholder="0.02"
                style={styles.paramInput}
              />
              <span style={{
                ...styles.paramStatus,
                color: (parseFloat(waterForm.nitrite) > 0.25) ? '#DC2626' : '#64748B'
              }}>

              </span>
            </div>

            {/* 9. Hydrogen Sulfide (H2S): (0 - >0.02) */}
            <div style={styles.paramCard}>
              <div style={styles.paramHeader}>
                <span style={styles.paramTitle}>H2S (Hydrogen Sulfide)</span>
                <span style={styles.paramUnit}>ppm</span>
              </div>
              <input
                type="number"
                step="0.001"
                value={waterForm.h2s}
                onChange={(e) => setWaterForm({ ...waterForm, h2s: e.target.value })}
                placeholder="0.005"
                style={styles.paramInput}
              />
              <span style={{
                ...styles.paramStatus,
                color: (parseFloat(waterForm.h2s) > 0.02) ? '#DC2626' : '#64748B'
              }}>

              </span>
            </div>

            {/* 10. Chlorine (Cl): (0 - >0.02) */}
            <div style={styles.paramCard}>
              <div style={styles.paramHeader}>
                <span style={styles.paramTitle}>Chlorine (Cl)</span>
                <span style={styles.paramUnit}>ppm</span>
              </div>
              <input
                type="number"
                step="0.001"
                value={waterForm.cl}
                onChange={(e) => setWaterForm({ ...waterForm, cl: e.target.value })}
                placeholder="0.004"
                style={styles.paramInput}
              />
              <span style={{
                ...styles.paramStatus,
                color: (parseFloat(waterForm.cl) > 0.02) ? '#DC2626' : '#64748B'
              }}>

              </span>
            </div>

            {/* 11. Iron (Fe): (0 - 0.02) */}
            <div style={styles.paramCard}>
              <div style={styles.paramHeader}>
                <span style={styles.paramTitle}>Iron (Fe)</span>
                <span style={styles.paramUnit}>ppm</span>
              </div>
              <input
                type="number"
                step="0.001"
                value={waterForm.fe}
                onChange={(e) => setWaterForm({ ...waterForm, fe: e.target.value })}
                placeholder="0.01"
                style={styles.paramInput}
              />
              <span style={{
                ...styles.paramStatus,
                color: (parseFloat(waterForm.fe) > 0.02) ? '#DC2626' : '#64748B'
              }}>
              </span>
            </div>

            {/* 12. Water Color */}
            <div style={styles.paramCard}>
              <div style={styles.paramHeader}>
                <span style={styles.paramTitle}>Water Color</span>
                <span style={styles.paramUnit}></span>
              </div>
              <select
                value={waterForm.waterColor}
                onChange={(e) => setWaterForm({ ...waterForm, waterColor: e.target.value })}
                style={styles.paramSelect}
              >
                <option value="Greenish">Greenish (Optimal Plankton)</option>
                <option value="Light Green">Light Green (Healthy Green Algae)</option>
                <option value="Golden Brown">Golden Brown (Diatom Bloom)</option>
                <option value="Brownish">Brownish (Mixed Algae)</option>
                <option value="Dark Green">Dark Green (Dense Bloom)</option>
                <option value="Clear / Turbid">Clear / Turbid</option>
              </select>
              <span style={styles.paramStatus}></span>
            </div>
          </div>

          {/* Optional Temperature */}
          <div style={{ ...styles.paramCard, marginTop: '4px' }}>
            <div style={styles.paramHeader}>
              <span style={styles.paramTitle}>Water Temperature (Optional)</span>
              <span style={styles.paramUnit}>°C</span>
            </div>
            <input
              type="number"
              step="0.1"
              value={waterForm.temperature}
              onChange={(e) => setWaterForm({ ...waterForm, temperature: e.target.value })}
              placeholder="28.5"
              style={styles.paramInput}
            />
          </div>
            </>
          )}

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
    maxWidth: '560px',
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
  paramStatus: {
    fontSize: '9.5px',
    color: '#64748B',
    fontWeight: '500',
    marginTop: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  paramSelect: {
    border: 'none',
    background: 'transparent',
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
    outline: 'none',
    padding: '2px 0',
    width: '100%',
    cursor: 'pointer',
  },
  rangeHint: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#2563EB',
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

const QuickRecordModal = (props) => {
  if (!props.isOpen) return null;
  return <QuickRecordModalInner {...props} />;
};

export default React.memo(QuickRecordModal);
