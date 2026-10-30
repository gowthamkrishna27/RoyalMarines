import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Droplets, MapPin, CheckCircle, RefreshCw, ChevronDown,
  Check, Plus, Lock, Calendar, Clock, ChevronUp, Scale, Wheat, Bug,
  Activity, Pill, Skull, ClipboardList, Camera, ArrowLeft, Search,
  ChevronRight, Sparkles, Filter, AlertTriangle, Layers
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { calculateCurrentDoc } from '../../utils/docCalculator';
import { getSession } from '../utils/agentAuth';
import { getInchargeSession } from '../../incharge/utils/inchargeAuth';
import { isAdminAuthenticated, getAdminSession } from '../../admin/utils/adminAuth';
import { getStoredGPS, captureDeviceGPS, requestSubmissionGPS } from '../utils/gpsService';
import { queueOfflineRecord } from '../utils/syncService';
import MarineLoader from '../../components/MarineLoader';

// Complete enterprise catalog of all 8 routine and field test modules in Royals Marine
export const AVAILABLE_TEST_TYPES = [
  {
    key: 'WATER_QUALITY',
    label: 'Water Analysis',
    badge: 'Routine Weekly',
    categoryGroup: 'ROUTINE',
    icon: Droplets,
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    badgeBg: '#DBEAFE',
    badgeColor: '#1E40AF',
    description: 'pH, Salinity, Ammonia, DO, Alkalinity, Nitrate, Hardness, H2S, Cl & Iron',
    keywords: ['water', 'ph', 'salinity', 'ammonia', 'do', 'alkalinity', 'nitrate', 'hardness', 'chlorine', 'iron', 'quality'],
  },
  {
    key: 'FEED_ENTRY',
    label: 'Feed Test & Audit',
    badge: 'Daily & Audit',
    categoryGroup: 'ROUTINE',
    icon: Wheat,
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    badgeBg: '#FEF3C7',
    badgeColor: '#92400E',
    description: 'Daily feed consumption, check tray intake time, count, ABW & FCR tracking',
    keywords: ['feed', 'tray', 'count', 'abw', 'fcr', 'biomass', 'consumption', 'seed', 'eating'],
  },
  {
    key: 'DISEASE_ENTRY',
    label: 'Disease Observation',
    badge: 'Clinical Health',
    categoryGroup: 'HEALTH',
    icon: Bug,
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    badgeBg: '#FEE2E2',
    badgeColor: '#991B1B',
    description: '13 clinical pathologies screening (White gut, Muscle necrosis, EHP, WSSV)',
    keywords: ['disease', 'pathology', 'white gut', 'muscle', 'ehp', 'wssv', 'vibrio', 'black gill', 'health', 'symptoms'],
  },
  {
    key: 'MEDICATION',
    label: 'Medication & Probiotics',
    badge: 'Treatment',
    categoryGroup: 'HEALTH',
    icon: Pill,
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    badgeBg: '#EDE9FE',
    badgeColor: '#5B21B6',
    description: 'Preventive and curative treatments, probiotics, minerals, sanitizers & dosage',
    keywords: ['medication', 'medicine', 'probiotics', 'minerals', 'sanitizers', 'curative', 'preventive', 'treatment', 'dose'],
  },
  {
    key: 'MORTALITY_LOG',
    label: 'Mortality Check',
    badge: 'Surveillance',
    categoryGroup: 'HEALTH',
    icon: Skull,
    color: '#991B1B',
    bgColor: '#FEF2F2',
    borderColor: '#FECDD3',
    badgeBg: '#FFE4E6',
    badgeColor: '#881337',
    description: 'Observed dead shrimp count, mortality log, cause analysis & actions taken',
    keywords: ['mortality', 'dead', 'death', 'casualty', 'loss', 'gills', 'cramping', 'die-off'],
  },
  {
    key: 'FARM_ACTIVITY',
    label: 'Farm Activity',
    badge: 'Operations',
    categoryGroup: 'OPERATIONS',
    icon: ClipboardList,
    color: '#0D9488',
    bgColor: '#F0FDFA',
    borderColor: '#99F6E4',
    badgeBg: '#CCFBF1',
    badgeColor: '#115E59',
    description: 'Aerator surveillance, water exchange, liming & routine pond operations',
    keywords: ['activity', 'farm', 'aerator', 'liming', 'water exchange', 'sludge', 'operations', 'dike', 'maintenance'],
  },
  {
    key: 'PHOTO_OBSERVATION',
    label: 'Photo Observation',
    badge: 'Visual Audit',
    categoryGroup: 'OPERATIONS',
    icon: Camera,
    color: '#0284C7',
    bgColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    badgeBg: '#E0F2FE',
    badgeColor: '#075985',
    description: 'Pond visual audit, Secchi disc transparency, water bloom & shrimp appearance',
    keywords: ['photo', 'visual', 'audit', 'transparency', 'secchi', 'color', 'appearance', 'camera', 'sample'],
  },
  {
    key: 'HARVEST_ENTRY',
    label: 'Harvest Record',
    badge: 'Harvesting',
    categoryGroup: 'OPERATIONS',
    icon: Scale,
    color: '#16A34A',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    badgeBg: '#DCFCE7',
    badgeColor: '#166534',
    description: 'Partial or final pond harvest biomass, count, ABW & yield calculation',
    keywords: ['harvest', 'partial', 'final', 'yield', 'biomass', 'sale', 'abw', 'crop'],
  },
];

// Helper to reliably extract and format stocked seed count and lakhs representation for any tank
export const resolveTankSeedStocked = (t) => {
  if (!t) return { count: 250000, lakhs: '2.5 Lakhs', displayFull: '2,50,000 (2.5 Lakhs)', countFormatted: '2,50,000', raw: 2.5 };
  
  let raw = t.seedStocked ?? t.seed_stocking_lak ?? t.seedStockingLak ?? t.seed ?? t.seed_stocked ?? t.seedNumber ?? t.seedCountLac ?? null;

  if (raw == null && t.id) {
    try {
      const store = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
      const tankStore = store[t.id];
      if (tankStore?.seedNumber) raw = tankStore.seedNumber;
    } catch (e) {}
  }

  let num = parseFloat(raw);
  if (isNaN(num) || num <= 0) {
    const acres = parseFloat(t.acres || t.area || 2.5);
    num = acres > 0 ? parseFloat((acres * 1.0).toFixed(1)) : 2.5;
  }

  let seedCount = 0;
  let lakhsStr = '';

  if (num <= 50) {
    seedCount = Math.round(num * 100000);
    lakhsStr = `${num} Lakhs`;
  } else {
    seedCount = Math.round(num);
    const inLakhs = (seedCount / 100000).toFixed(seedCount % 100000 === 0 ? 1 : 2);
    lakhsStr = `${inLakhs} Lakhs`;
  }

  return {
    raw: num,
    count: seedCount,
    countFormatted: seedCount.toLocaleString(),
    lakhs: lakhsStr,
    displayFull: lakhsStr ? `${seedCount.toLocaleString()} (${lakhsStr})` : seedCount.toLocaleString()
  };
};

const QuickRecordModalInner = ({
  isOpen,
  onClose,
  initialType = null,
  startWithSelector = false,
  preselectedFarmerId = null,
  preselectedTankId = null,
  onSuccess,
  userRole = null
}) => {
  const { db, getFarmersByAgentId, getFarmersByInchargeId, getTanksByFarmerId, recordFieldEntry } = useMockData();
  const session = getSession();
  const inchargeSession = getInchargeSession();
  const adminSession = getAdminSession();

  const isAdmin = Boolean(
    userRole === 'ADMIN' ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) ||
    (adminSession && !session?.agentId && !inchargeSession?.inchargeId && isAdminAuthenticated())
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
  const [isSelectingType, setIsSelectingType] = useState(Boolean(startWithSelector || !initialType));
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);

  // Normalize canonical tab key
  const canonicalActiveTab = useMemo(() => {
    if (activeTab === 'DISEASE') return 'DISEASE_ENTRY';
    if (activeTab === 'MORTALITY') return 'MORTALITY_LOG';
    if (activeTab === 'ACTIVITY') return 'FARM_ACTIVITY';
    if (activeTab === 'HARVEST') return 'HARVEST_ENTRY';
    return activeTab || 'WATER_QUALITY';
  }, [activeTab]);

  // Farmers and Tanks
  const assignedFarmers = isAdmin
    ? (db?.farmers || [])
    : isIncharge
      ? ((getFarmersByInchargeId && getFarmersByInchargeId(currentInchargeId)) || db?.farmers || [])
      : ((getFarmersByAgentId && getFarmersByAgentId(currentAgentId)) || (db?.farmers || []));
  const [selectedFarmerId, setSelectedFarmerId] = useState(preselectedFarmerId || assignedFarmers[0]?.id || '');

  const farmerTanks = getTanksByFarmerId ? getTanksByFarmerId(selectedFarmerId) : (db?.tanks || []).filter(t => t.farmerId === selectedFarmerId);
  const tanks = farmerTanks;
  const [selectedTankId, setSelectedTankId] = useState(preselectedTankId || tanks[0]?.id || '');

  // Authoritative selected tank reference and resolved seed stocking metrics
  const currentTank = tanks.find(x => x.id === selectedTankId) || tanks[0] || null;
  const tankSeedInfo = useMemo(() => resolveTankSeedStocked(currentTank), [currentTank]);

  // GPS & Submission States
  const [gpsData, setGpsData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState(null);

  // 1. Water Analysis Parameters
  const [waterForm, setWaterForm] = useState({
    date: new Date().toISOString().split('T')[0],
    doc: '',
    ph: '',
    ammonia: '',
    nitrate: '',
    salinity: '',
    alkalinity: '',
    hardness: '',
    do: '',
    h2s: '',
    cl: '',
    fe: '',
    waterColor: '',
    temperature: '',
    nitrite: '',
    notes: '',
  });

  // 2. Dedicated Harvest form
  const [harvestForm, setHarvestForm] = useState({
    harvestType: 'Partial Harvest',
    date: new Date().toISOString().split('T')[0],
    doc: '',
    abw: '',
    harvestedNumber: '',
    harvestedBiomass: '',
    remarks: '',
    abwObservation: '',
  });

  // Previous harvest ABW tracking for the currently selected tank
  const previousHarvestAbw = useMemo(() => {
    if (!selectedTankId) return null;
    let list = [];
    try {
      const cleanStore = JSON.parse(localStorage.getItem('agent_harvest_clean_store') || '{}');
      const standardStore = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
      const store = { ...standardStore, ...cleanStore };
      const storeKey = `${selectedFarmerId}_${selectedTankId}`;
      if (store[storeKey]?.harvests && Array.isArray(store[storeKey].harvests)) {
        list = [...store[storeKey].harvests];
      } else if (store[selectedTankId]?.harvests && Array.isArray(store[selectedTankId].harvests)) {
        list = [...store[selectedTankId].harvests];
      }
    } catch (e) {}

    if (db?.submissions && Array.isArray(db.submissions)) {
      const harvestSubs = db.submissions.filter(s => 
        (s.tankId === selectedTankId || s.pondId === selectedTankId) &&
        (s.testType === 'Harvest' || s.recordType === 'HARVEST_ENTRY' || s.recordType === 'HARVEST')
      );
      harvestSubs.forEach(s => {
        const abwVal = parseFloat(s.data?.abw || s.abw || 0);
        if (abwVal > 0) {
          list.push({
            date: s.date || s.createdAt,
            abw: abwVal
          });
        }
      });
    }

    if (list.length === 0) return null;
    const sorted = [...list].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    const last = sorted[sorted.length - 1];
    const val = parseFloat(last?.abw);
    return !isNaN(val) && val > 0 ? val : null;
  }, [selectedTankId, selectedFarmerId, db?.submissions]);

  const numEnteredAbw = parseFloat(harvestForm.abw) || 0;
  const isAbwLowerThanPrevious = previousHarvestAbw !== null && numEnteredAbw > 0 && numEnteredAbw < previousHarvestAbw;

  // 3. Dedicated Feed form
  const [feedForm, setFeedForm] = useState({
    date: new Date().toISOString().split('T')[0],
    doc: '',
    seed: '', // Seed Stocked (read-only from original tank details)
    estimatedStock: '', // Estimated Stock (manual entry)
    count: '', // Count (manual entry)
    abw: '', // ABW (read-only, auto-calculated from Count: 1000 / Count)
    dayFeed: '',
    cumulativeFeed: '',
    fcr: '',
    checkTrayFeed: '',
    checkTrayTime: '', // CH TR Time (Feed Consumption Time) (manual entry)
    remarks: '',
  });

  // 4. Dedicated Disease form
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
    status: {},
    affectedShrimpPct: '',
    others: '',
    remarks: '',
  });

  // 5. Dedicated Medication form
  const [medicationForm, setMedicationForm] = useState({
    date: new Date().toISOString().split('T')[0],
    doc: '',
    treatmentType: 'Preventive',
    category: 'Probiotics',
    medicineName: '',
    dosage: '',
    dosageUnit: 'kg/acre',
    purpose: 'Routine Health Management',
    applicationMethod: 'Water',
    remarks: '',
  });

  // 6. Dedicated Mortality form
  const [mortalityForm, setMortalityForm] = useState({
    date: new Date().toISOString().split('T')[0],
    doc: '',
    deadCount: '',
    severity: 'Low',
    suspectedCause: 'Low Dissolved Oxygen',
    shrimpCondition: 'Normal Appearance',
    actionTaken: 'Aeration Increased',
    remarks: '',
  });

  // 7. Dedicated Farm Activity form
  const [farmActivityForm, setFarmActivityForm] = useState({
    date: new Date().toISOString().split('T')[0],
    doc: '',
    activityType: 'Aerator Surveillance',
    equipmentUsed: '',
    duration: '',
    status: 'Completed',
    remarks: '',
  });

  // 8. Dedicated Photo Observation form
  const [photoObservationForm, setPhotoObservationForm] = useState({
    date: new Date().toISOString().split('T')[0],
    doc: '',
    category: 'Pond Water Condition',
    transparencyCm: '',
    waterColor: '',
    shrimpVisual: 'Active swimming',
    summary: '',
    notes: '',
  });

  const toggleDiseaseStatus = (disease, level) => {
    setDiseaseForm(prev => {
      const current = prev.status[disease];
      const newStatus = { ...prev.status };
      if (current === level) {
        delete newStatus[disease];
      } else {
        newStatus[disease] = level;
      }
      return { ...prev, status: newStatus };
    });
  };

  // Auto-calculate ABW (1000 / Count) and FCR
  const handleFeedChange = (field, val) => {
    setFeedForm(prev => {
      const updated = { ...prev, [field]: val };

      if (field === 'count') {
        const countNum = parseFloat(val);
        if (!isNaN(countNum) && countNum > 0) {
          const calcAbw = 1000 / countNum;
          updated.abw = calcAbw % 1 === 0 ? String(calcAbw) : String(parseFloat(calcAbw.toFixed(2)));
        } else {
          updated.abw = '';
        }
      }

      const cumFeed = parseFloat(field === 'cumulativeFeed' ? val : updated.cumulativeFeed);
      const estStock = parseFloat(field === 'estimatedStock' ? val : updated.estimatedStock);
      const currentAbw = parseFloat(updated.abw);

      if (!isNaN(cumFeed) && cumFeed > 0 && !isNaN(estStock) && estStock > 0 && !isNaN(currentAbw) && currentAbw > 0) {
        const estBiomassKg = (estStock * currentAbw) / 1000;
        if (estBiomassKg > 0) {
          updated.fcr = (cumFeed / estBiomassKg).toFixed(2);
        }
      } else if (field === 'cumulativeFeed' || field === 'estimatedStock' || field === 'count') {
        updated.fcr = '';
      }

      return updated;
    });
  };

  // Auto-calculate Harvest number from Biomass and ABW
  const handleHarvestChange = (field, val) => {
    setHarvestForm(prev => {
      const updated = { ...prev, [field]: val };
      if (field === 'abw' || field === 'harvestedBiomass') {
        const abwVal = parseFloat(field === 'abw' ? val : updated.abw);
        const biomassVal = parseFloat(field === 'harvestedBiomass' ? val : updated.harvestedBiomass);
        if (!isNaN(abwVal) && abwVal > 0 && !isNaN(biomassVal) && biomassVal > 0) {
          const count = Math.round((biomassVal * 1000) / abwVal);
          updated.harvestedNumber = String(count);
        }
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
    if (initialType) {
      setActiveTab(initialType);
      if (!startWithSelector) setIsSelectingType(false);
    }
  }, [initialType, startWithSelector]);

  // Reset or initialize state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setSubmittedRecord(null);
      if (startWithSelector || !initialType) {
        setIsSelectingType(true);
      } else {
        setIsSelectingType(false);
        setActiveTab(initialType);
      }
    }
  }, [isOpen, startWithSelector, initialType]);

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
      try {
        const currentDoc = typeof calculateCurrentDoc === 'function' ? calculateCurrentDoc(t) : t.doc;
        if (currentDoc !== undefined && currentDoc !== null && !isNaN(Number(currentDoc))) {
          initialDoc = String(currentDoc);
        } else if (t.doc !== undefined && t.doc !== null && t.doc !== '') {
          initialDoc = String(t.doc);
        }
      } catch (docErr) {
        initialDoc = t.doc != null && t.doc !== '' ? String(t.doc) : '';
      }

      const seedInfo = resolveTankSeedStocked(t);

      setWaterForm(prev => ({ ...prev, doc: initialDoc }));
      setFeedForm(prev => ({
        ...prev,
        doc: initialDoc,
        seed: seedInfo.displayFull,
        estimatedStock: '',
        count: '',
        abw: '',
        checkTrayTime: '',
      }));
      setDiseaseForm(prev => ({ ...prev, doc: initialDoc }));
      setHarvestForm(prev => ({ ...prev, doc: initialDoc }));
      setMedicationForm(prev => ({ ...prev, doc: initialDoc }));
      setMortalityForm(prev => ({ ...prev, doc: initialDoc }));
      setFarmActivityForm(prev => ({ ...prev, doc: initialDoc }));
      setPhotoObservationForm(prev => ({ ...prev, doc: initialDoc }));
    }
  }, [selectedFarmerId, selectedTankId, tanks]);

  // Filter available test types by search query and category pill
  const filteredAvailableTests = useMemo(() => {
    return AVAILABLE_TEST_TYPES.filter(t => {
      if (selectedCategoryFilter !== 'ALL' && t.categoryGroup !== selectedCategoryFilter) {
        return false;
      }
      if (testSearchQuery.trim()) {
        const q = testSearchQuery.toLowerCase().trim();
        const matchesName = t.label.toLowerCase().includes(q);
        const matchesDesc = t.description.toLowerCase().includes(q);
        const matchesKeywords = (t.keywords || []).some(k => k.toLowerCase().includes(q));
        return matchesName || matchesDesc || matchesKeywords;
      }
      return true;
    });
  }, [selectedCategoryFilter, testSearchQuery]);

  const currentTestMeta = useMemo(() => {
    return AVAILABLE_TEST_TYPES.find(t => t.key === canonicalActiveTab) || AVAILABLE_TEST_TYPES[0];
  }, [canonicalActiveTab]);

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

  // Selected Tank Status Check
  const selectedTank = tanks.find(t => t.id === selectedTankId);
  const isSelectedTankClosed = selectedTank?.status === 'Harvested' || selectedTank?.status === 'Completed';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSelectedTankClosed) {
      alert('This tank has already completed its final harvest. No further records can be entered.');
      return;
    }

    if (canonicalActiveTab === 'WATER_QUALITY') {
      if (!waterForm.ph || !waterForm.ammonia || !waterForm.nitrate || !waterForm.salinity) {
        alert('Please fill all mandatory water analysis parameters:\n• pH Level\n• Ammonia (NH3)\n• Nitrate (NO3)\n• Salinity');
        return;
      }
    } else if (canonicalActiveTab === 'FEED_ENTRY') {
      if (!feedForm.date) {
        alert('Please specify the feed record date.');
        return;
      }
    } else if (canonicalActiveTab === 'DISEASE_ENTRY') {
      if (!diseaseForm.date) {
        alert('Please specify the disease inspection date.');
        return;
      }
    } else if (canonicalActiveTab === 'MEDICATION') {
      if (!medicationForm.medicineName || !medicationForm.dosage) {
        alert('Please enter the Product / Medicine Name and Dosage Amount.');
        return;
      }
    } else if (canonicalActiveTab === 'MORTALITY_LOG') {
      if (mortalityForm.deadCount === '' || isNaN(Number(mortalityForm.deadCount))) {
        alert('Please enter the observed dead shrimp count (enter 0 if none).');
        return;
      }
    } else if (canonicalActiveTab === 'FARM_ACTIVITY') {
      if (!farmActivityForm.activityType) {
        alert('Please select an activity type.');
        return;
      }
    } else if (canonicalActiveTab === 'PHOTO_OBSERVATION') {
      if (!photoObservationForm.category) {
        alert('Please select an observation target category.');
        return;
      }
    } else if (canonicalActiveTab === 'HARVEST_ENTRY') {
      if (!harvestForm.abw || !harvestForm.harvestedBiomass) {
        alert('Please enter Average Body Weight (ABW in grams) and Harvested Biomass (kg).');
        return;
      }
      if (isAbwLowerThanPrevious && !harvestForm.abwObservation?.trim()) {
        alert(`Observation Required: Entered ABW (${harvestForm.abw}g) is less than the previous harvest (${previousHarvestAbw}g). Please enter an explanation in the observation box.`);
        return;
      }
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

    const isHarvest = canonicalActiveTab === 'HARVEST_ENTRY';
    const isFeed = canonicalActiveTab === 'FEED_ENTRY';
    const isDisease = canonicalActiveTab === 'DISEASE_ENTRY';
    const isMedication = canonicalActiveTab === 'MEDICATION';
    const isMortality = canonicalActiveTab === 'MORTALITY_LOG';
    const isActivity = canonicalActiveTab === 'FARM_ACTIVITY';
    const isPhoto = canonicalActiveTab === 'PHOTO_OBSERVATION';
    const isWater = canonicalActiveTab === 'WATER_QUALITY';

    let testTypeName = 'Water Analysis';
    let recordTypeKey = 'WATER_QUALITY';
    let formData = waterForm;

    if (isHarvest) {
      testTypeName = 'Harvest';
      recordTypeKey = 'HARVEST_ENTRY';
      formData = harvestForm;
    } else if (isFeed) {
      testTypeName = 'Feed Check Analysis';
      recordTypeKey = 'FEED_ENTRY';
      formData = feedForm;
    } else if (isDisease) {
      testTypeName = 'Disease Inspection';
      recordTypeKey = 'DISEASE';
      formData = diseaseForm;
    } else if (isMedication) {
      testTypeName = 'Medication';
      recordTypeKey = 'MEDICATION';
      formData = medicationForm;
    } else if (isMortality) {
      testTypeName = 'Mortality Check';
      recordTypeKey = 'MORTALITY_LOG';
      formData = mortalityForm;
    } else if (isActivity) {
      testTypeName = 'Farm Activity';
      recordTypeKey = 'FARM_ACTIVITY';
      formData = farmActivityForm;
    } else if (isPhoto) {
      testTypeName = 'Photo Observation';
      recordTypeKey = 'PHOTO_OBSERVATION';
      formData = photoObservationForm;
    }

    const recordId = `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date(locationFix.timestamp || Date.now());
    const formattedDate = (formData.date) || now.toISOString().split('T')[0];
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

    let enrichedData = { ...formData };
    if (isFeed) {
      enrichedData = {
        ...formData,
        chTrTime: formData.checkTrayTime,
        checkTrayTime: formData.checkTrayTime,
        chTrFeed: formData.checkTrayFeed,
        count: formData.count,
        abw: formData.abw,
        estimatedStock: formData.estimatedStock,
        seed: tankSeedInfo.count,
        seedStocked: tankSeedInfo.count,
        seedStockedFormatted: tankSeedInfo.displayFull,
        seedCountLac: tankSeedInfo.lakhs,
      };
    } else if (isMedication) {
      enrichedData = {
        ...formData,
        treatmentType: formData.treatmentType,
        category: formData.category,
        medicineName: formData.medicineName,
        dosage: formData.dosage,
        dosageUnit: formData.dosageUnit,
        purpose: formData.purpose,
        applicationMethod: formData.applicationMethod,
        notes: formData.remarks,
      };
    } else if (isMortality) {
      enrichedData = {
        ...formData,
        deadCount: formData.deadCount,
        severity: formData.severity,
        suspectedCause: formData.suspectedCause,
        shrimpCondition: formData.shrimpCondition,
        actionTaken: formData.actionTaken,
        notes: formData.remarks,
      };
    } else if (isActivity) {
      enrichedData = {
        ...formData,
        activityType: formData.activityType,
        equipmentUsed: formData.equipmentUsed,
        duration: formData.duration,
        status: formData.status,
        notes: formData.remarks,
      };
    } else if (isPhoto) {
      enrichedData = {
        ...formData,
        category: formData.category,
        transparencyCm: formData.transparencyCm,
        waterColor: formData.waterColor,
        shrimpVisual: formData.shrimpVisual,
        summary: formData.summary,
        notes: formData.notes,
      };
    } else if (isHarvest) {
      const trimmedObs = harvestForm.abwObservation ? harvestForm.abwObservation.trim() : '';
      const baseRemarks = harvestForm.remarks ? harvestForm.remarks.trim() : '';
      const combinedRemarks = trimmedObs
        ? (baseRemarks ? `[Observation: ${trimmedObs}] ${baseRemarks}` : `[Observation: ${trimmedObs}]`)
        : baseRemarks;

      enrichedData = {
        ...formData,
        harvestType: formData.harvestType,
        abw: formData.abw,
        harvestedBiomass: formData.harvestedBiomass,
        harvestedNumber: formData.harvestedNumber,
        remarks: combinedRemarks,
        abwObservation: trimmedObs,
      };
      if (selectedTankId) {
        try {
          const store = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
          const storeKey = `${selectedFarmerId}_${selectedTankId}`;
          if (!store[storeKey]) store[storeKey] = { harvests: [] };
          store[storeKey].harvests = store[storeKey].harvests || [];
          store[storeKey].harvests.push({
            id: recordId,
            date: formattedDate,
            type: formData.harvestType,
            abw: parseFloat(formData.abw) || 0,
            biomassKg: parseFloat(formData.harvestedBiomass) || 0,
            count: parseFloat(formData.harvestedNumber) || 0,
            doc: formData.doc,
            remarks: combinedRemarks,
            abwObservation: trimmedObs,
            timestamp: now.toISOString()
          });
          localStorage.setItem('agent_harvest_store', JSON.stringify(store));
          try {
            const cleanStore = JSON.parse(localStorage.getItem('agent_harvest_clean_store') || '{}');
            cleanStore[storeKey] = store[storeKey];
            localStorage.setItem('agent_harvest_clean_store', JSON.stringify(cleanStore));
          } catch (e2) {}
        } catch (e) {}
      }
    } else if (isWater) {
      enrichedData = {
        ...formData,
        ph: formData.ph ?? '',
        ammonia: formData.ammonia ?? '',
        nitrate: formData.nitrate ?? '',
        salinity: formData.salinity ?? '',
        doc: formData.doc ?? '',
        alkalinity: formData.alkalinity ?? '',
        hardness: formData.hardness ?? '',
        do: formData.do ?? '',
        h2s: formData.h2s ?? '',
        cl: formData.cl ?? '',
        chlorine: formData.cl ?? '',
        fe: formData.fe ?? '',
        iron: formData.fe ?? '',
        waterColor: formData.waterColor ?? '',
        waterColour: formData.waterColor ?? '',
        nitrite: formData.nitrate ?? '',
      };
    }

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
            <h3 style={styles.successTitle}>Record Saved Successfully</h3>
            <p style={styles.successSub}>
              {submittedRecord.testType} for <strong>{submittedRecord.farmerName}</strong> • <strong>{submittedRecord.tankName}</strong>
            </p>

            {/* Tailored Summary Pills for all 8 test kinds */}
            <div style={styles.successPillGrid}>
              {canonicalActiveTab === 'DISEASE_ENTRY' ? (
                <>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Reported Issues</span>
                    <strong style={{ ...styles.successPillVal, color: Object.keys(diseaseForm.status).length > 0 ? '#DC2626' : '#16A34A' }}>
                      {Object.keys(diseaseForm.status).length > 0 ? `${Object.keys(diseaseForm.status).length} detected` : 'All Normal'}
                    </strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>DOC</span>
                    <strong style={styles.successPillVal}>{diseaseForm.doc || '—'}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Affected %</span>
                    <strong style={styles.successPillVal}>{diseaseForm.affectedShrimpPct ? `${diseaseForm.affectedShrimpPct}%` : 'Negligible'}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Status</span>
                    <strong style={{ ...styles.successPillVal, color: '#16A34A' }}>Screened</strong>
                  </div>
                </>
              ) : canonicalActiveTab === 'FEED_ENTRY' ? (
                <>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Seed Stocked</span>
                    <strong style={{ ...styles.successPillVal, color: '#16A34A' }}>{tankSeedInfo.displayFull}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Day / Cum Feed</span>
                    <strong style={styles.successPillVal}>{feedForm.dayFeed || '0'} / {feedForm.cumulativeFeed || '0'} kg</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Count / ABW</span>
                    <strong style={styles.successPillVal}>{feedForm.count ? `${feedForm.count} /kg` : '—'} • {feedForm.abw ? `${feedForm.abw}g` : '—'}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>FCR</span>
                    <strong style={{ ...styles.successPillVal, color: '#16A34A' }}>{feedForm.fcr || '—'}</strong>
                  </div>
                </>
              ) : canonicalActiveTab === 'MEDICATION' ? (
                <>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Medicine / Product</span>
                    <strong style={styles.successPillVal}>{medicationForm.medicineName || 'Applied'}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Dosage</span>
                    <strong style={{ ...styles.successPillVal, color: '#7C3AED' }}>{medicationForm.dosage} {medicationForm.dosageUnit}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Treatment Mode</span>
                    <strong style={styles.successPillVal}>{medicationForm.treatmentType}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Method</span>
                    <strong style={styles.successPillVal}>{medicationForm.applicationMethod}</strong>
                  </div>
                </>
              ) : canonicalActiveTab === 'MORTALITY_LOG' ? (
                <>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Dead Count</span>
                    <strong style={{ ...styles.successPillVal, color: '#DC2626' }}>{mortalityForm.deadCount} shrimps</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Severity</span>
                    <strong style={styles.successPillVal}>{mortalityForm.severity}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Primary Cause</span>
                    <strong style={styles.successPillVal}>{mortalityForm.suspectedCause}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Condition</span>
                    <strong style={styles.successPillVal}>{mortalityForm.shrimpCondition}</strong>
                  </div>
                </>
              ) : canonicalActiveTab === 'FARM_ACTIVITY' ? (
                <>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Activity Type</span>
                    <strong style={styles.successPillVal}>{farmActivityForm.activityType}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Duration</span>
                    <strong style={styles.successPillVal}>{farmActivityForm.duration || 'Logged'}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Equipment/Materials</span>
                    <strong style={styles.successPillVal}>{farmActivityForm.equipmentUsed || 'Operations'}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Status</span>
                    <strong style={{ ...styles.successPillVal, color: '#16A34A' }}>{farmActivityForm.status}</strong>
                  </div>
                </>
              ) : canonicalActiveTab === 'PHOTO_OBSERVATION' ? (
                <>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Visual Target</span>
                    <strong style={styles.successPillVal}>{photoObservationForm.category}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Transparency</span>
                    <strong style={styles.successPillVal}>{photoObservationForm.transparencyCm ? `${photoObservationForm.transparencyCm} cm` : 'Secchi Logged'}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Water Color</span>
                    <strong style={styles.successPillVal}>{photoObservationForm.waterColor || 'Recorded'}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Visual Activity</span>
                    <strong style={{ ...styles.successPillVal, color: '#16A34A' }}>{photoObservationForm.shrimpVisual}</strong>
                  </div>
                </>
              ) : canonicalActiveTab === 'HARVEST_ENTRY' ? (
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
                    <strong style={{ ...styles.successPillVal, color: '#16A34A' }}>{harvestForm.harvestedBiomass} kg</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>DOC</span>
                    <strong style={styles.successPillVal}>{harvestForm.doc || '—'}</strong>
                  </div>
                  {harvestForm.remarks && (
                    <div style={{ ...styles.successPill, gridColumn: 'span 2' }}>
                      <span style={styles.successPillLabel}>Harvest Remarks</span>
                      <strong style={styles.successPillVal}>{harvestForm.remarks}</strong>
                    </div>
                  )}
                  {harvestForm.abwObservation && (
                    <div style={{ ...styles.successPill, gridColumn: 'span 2', backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }}>
                      <span style={{ ...styles.successPillLabel, color: '#92400E' }}>Lower ABW Observation</span>
                      <strong style={{ ...styles.successPillVal, color: '#B45309' }}>{harvestForm.abwObservation}</strong>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>pH Level</span>
                    <strong style={styles.successPillVal}>{waterForm.ph || '-'}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Ammonia</span>
                    <strong style={styles.successPillVal}>{waterForm.ammonia ? `${waterForm.ammonia} ppm` : '-'}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Nitrate</span>
                    <strong style={styles.successPillVal}>{waterForm.nitrate ? `${waterForm.nitrate} ppm` : '-'}</strong>
                  </div>
                  <div style={styles.successPill}>
                    <span style={styles.successPillLabel}>Salinity</span>
                    <strong style={styles.successPillVal}>{waterForm.salinity ? `${waterForm.salinity} ppt` : '-'}</strong>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '6px' }}>
              <button
                type="button"
                className="transition-all duration-150 active:scale-95 cursor-pointer"
                style={{ ...styles.cancelBtn, flex: 1, height: '42px' }}
                onClick={() => {
                  setSubmittedRecord(null);
                  setIsSelectingType(true);
                }}
              >
                + Record Another Test
              </button>
              <button
                type="button"
                className="transition-all duration-150 active:scale-95 cursor-pointer"
                style={{ ...styles.primaryBtn, flex: 1, height: '42px' }}
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // 3. Main Minimal Modal Card
  return createPortal(
    <div style={styles.overlay} onClick={onClose}>
      <style>{`
        .test-card-hover {
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .test-card-hover:hover {
          transform: translateY(-2px);
          border-color: #1A2FB8 !important;
          box-shadow: 0 6px 16px -2px rgba(26, 47, 184, 0.12);
        }
        .test-card-hover:active {
          transform: scale(0.98);
        }
      `}</style>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {isSelectingType ? (
          <div style={styles.selectorContainer}>
            {/* Header */}
            <div style={styles.header}>
              <div style={styles.headerLeft}>
                <div style={{ ...styles.headerIconCircle, backgroundColor: '#EFF6FF' }}>
                  <Layers size={18} color="#1A2FB8" strokeWidth={2.4} />
                </div>
                <div>
                  <h2 style={styles.title}>Select Test Record</h2>
                  <p style={styles.subtitle}>Choose from all 8 available field tests & observations</p>
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

            <div style={styles.selectorBody}>
              {/* Target Farmer & Tank Selectors */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>Target Farmer</label>
                  <div style={styles.selectWrap}>
                    <select
                      value={selectedFarmerId}
                      onChange={(e) => setSelectedFarmerId(e.target.value)}
                      style={styles.select}
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
                  <label style={styles.label}>Target Tank</label>
                  <div style={styles.selectWrap}>
                    <select
                      value={selectedTankId}
                      onChange={(e) => setSelectedTankId(e.target.value)}
                      style={styles.select}
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

              {isSelectedTankClosed && (
                <div style={styles.tankClosedAlert}>
                  <AlertTriangle size={15} color="#DC2626" />
                  <span>This tank has completed its final harvest. No new records can be added.</span>
                </div>
              )}

              {/* Search and Category Filter Bar */}
              <div style={styles.filterSection}>
                <div style={styles.searchWrap}>
                  <Search size={15} color="#64748B" style={styles.searchIcon} />
                  <input
                    type="text"
                    value={testSearchQuery}
                    onChange={(e) => setTestSearchQuery(e.target.value)}
                    placeholder="Search all tests (e.g. Water, ABW, Disease, Lime)..."
                    style={styles.searchInput}
                  />
                  {testSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTestSearchQuery('')}
                      style={styles.searchClearBtn}
                    >
                      <X size={13} color="#64748B" />
                    </button>
                  )}
                </div>

                {/* Category Filter Pills */}
                <div style={styles.categoryPillsRow}>
                  {[
                    { id: 'ALL', label: 'All Tests (8)' },
                    { id: 'ROUTINE', label: 'Routine (2)' },
                    { id: 'HEALTH', label: 'Health & Care (3)' },
                    { id: 'OPERATIONS', label: 'Operations & Yield (3)' },
                  ].map((cat) => {
                    const active = selectedCategoryFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryFilter(cat.id)}
                        style={{
                          ...styles.catFilterPill,
                          backgroundColor: active ? '#1A2FB8' : '#F1F5F9',
                          color: active ? '#FFFFFF' : '#475569',
                          fontWeight: active ? '700' : '500',
                          border: active ? '1px solid #1A2FB8' : '1px solid #E2E8F0',
                        }}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Test Selection Grid */}
              <div style={styles.testsGrid}>
                {filteredAvailableTests.map((test) => {
                  const Icon = test.icon;
                  return (
                    <button
                      key={test.key}
                      type="button"
                      className="test-card-hover"
                      disabled={isSelectedTankClosed}
                      onClick={() => {
                        setActiveTab(test.key);
                        setIsSelectingType(false);
                      }}
                      style={{
                        ...styles.testOptionCard,
                        opacity: isSelectedTankClosed ? 0.6 : 1,
                        cursor: isSelectedTankClosed ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <div style={{ ...styles.testOptionIconBox, backgroundColor: test.bgColor, borderColor: test.borderColor }}>
                        <Icon size={20} color={test.color} strokeWidth={2.4} />
                      </div>

                      <div style={styles.testOptionDetails}>
                        <div style={styles.testOptionHeaderRow}>
                          <span style={styles.testOptionTitle}>{test.label}</span>
                          <span style={{ ...styles.testOptionBadge, backgroundColor: test.badgeBg, color: test.badgeColor }}>
                            {test.badge}
                          </span>
                        </div>
                        <p style={styles.testOptionDesc}>{test.description}</p>
                      </div>

                      <div style={styles.testOptionChevron}>
                        <ChevronRight size={18} color="#94A3B8" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header with All Tests back button */}
            <div style={styles.header}>
              <div style={styles.headerLeft}>
                <button
                  type="button"
                  onClick={() => setIsSelectingType(true)}
                  style={styles.backToSelectorBtn}
                  title="Choose another test"
                >
                  <ArrowLeft size={14} strokeWidth={2.5} />
                  <span>All Tests</span>
                </button>

                <div style={{ ...styles.headerIconCircle, backgroundColor: currentTestMeta.bgColor }}>
                  <currentTestMeta.icon size={18} color={currentTestMeta.color} strokeWidth={2.4} />
                </div>

                <div>
                  <h2 style={styles.title}>New {currentTestMeta.label} Record</h2>
                  <p style={styles.subtitle}>{currentTestMeta.description}</p>
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

            {/* Horizontal Test Tabs Scroller */}
            <div style={styles.testTabsScroller}>
              {AVAILABLE_TEST_TYPES.map((t) => {
                const Icon = t.icon;
                const isTabActive = canonicalActiveTab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    style={{
                      ...styles.testTabBtn,
                      backgroundColor: isTabActive ? '#1A2FB8' : '#FFFFFF',
                      color: isTabActive ? '#FFFFFF' : '#475569',
                      border: isTabActive ? '1.5px solid #1A2FB8' : '1px solid #E2E8F0',
                      fontWeight: isTabActive ? '700' : '500',
                    }}
                  >
                    <Icon size={14} color={isTabActive ? '#FFFFFF' : t.color} strokeWidth={2.3} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
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
                    placeholder="e.g. 45"
                    style={styles.input}
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Feed Grid Parameters */}
              <div style={styles.sectionHeader}>
                <span style={styles.sectionLabel}>FEEDING & GROWTH PARAMETERS</span>
              </div>

              <div style={styles.paramGrid}>
                {/* 1. Seed Stocked (Read-only, from original tank details) */}
                <div style={{ ...styles.paramCard, backgroundColor: '#F1F5F9', border: '1.5px solid #CBD5E1' }}>
                  <div style={styles.paramHeader}>
                    <span style={{ ...styles.paramTitle, color: '#334155' }}>Seed Stocked</span>
                    <span style={{ ...styles.paramUnit, color: '#166534', fontWeight: 600 }}>{tankSeedInfo.lakhs}</span>
                  </div>
                  <input
                    type="text"
                    value={tankSeedInfo.displayFull}
                    readOnly
                    placeholder="From tank details"
                    style={{ ...styles.paramInput, color: '#1E293B', fontWeight: 600, cursor: 'not-allowed' }}
                  />
                  <span style={{ ...styles.paramStatus, color: '#64748B' }}>Original Tank Stock (Read-only)</span>
                </div>

                {/* 2. Estimated Stock (Manual Entry) */}
                <div style={styles.paramCard}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitle}>Estimated Stock</span>
                    <span style={styles.paramUnit}>Nos</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={feedForm.estimatedStock}
                    onChange={(e) => handleFeedChange('estimatedStock', e.target.value)}
                    placeholder={`e.g. ${Math.round(tankSeedInfo.count * 0.95).toLocaleString()}`}
                    style={styles.paramInput}
                  />
                  <span style={styles.paramStatus}>Current Estimated Population</span>
                </div>

                {/* 3. Count (Manual Entry) */}
                <div style={styles.paramCard}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitle}>Count</span>
                    <span style={styles.paramUnit}>per Kg</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={feedForm.count}
                    onChange={(e) => handleFeedChange('count', e.target.value)}
                    placeholder="e.g. 200"
                    style={styles.paramInput}
                  />
                  <span style={styles.paramStatus}>Count per Kg (Count &gt; 0)</span>
                </div>

                {/* 4. ABW (Average Body Weight - Auto Calculated: 1000 / Count) */}
                <div style={{ ...styles.paramCard, backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE' }}>
                  <div style={styles.paramHeader}>
                    <span style={{ ...styles.paramTitle, color: '#1E40AF', fontWeight: '800' }}>ABW</span>
                    <span style={{ ...styles.paramUnit, color: '#2563EB', fontWeight: '700' }}>grams</span>
                  </div>
                  <input
                    type="text"
                    value={feedForm.abw}
                    readOnly
                    placeholder="1000 / Count"
                    style={{ ...styles.paramInput, color: '#1E40AF', fontWeight: '800', cursor: 'default' }}
                  />
                  <span style={{ ...styles.paramStatus, color: '#2563EB', fontWeight: '600' }}>
                    Auto: 1000 ÷ Count
                  </span>
                </div>

                {/* 5. Day Feed (Kg) */}
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

                {/* 6. Cumulative Feed (Kg) */}
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

                {/* 7. FCR - Formula: Cumulative Feed / Biomass */}
                <div style={{ ...styles.paramCard, backgroundColor: '#F8FAFC', border: '1.5px solid #E2E8F0' }}>
                  <div style={styles.paramHeader}>
                    <span style={{ ...styles.paramTitle, color: '#0F172A', fontWeight: '700' }}>FCR</span>
                    <span style={{ ...styles.paramUnit, color: '#64748B', fontWeight: '600' }}>Ratio</span>
                  </div>
                  <input
                    type="text"
                    value={feedForm.fcr}
                    readOnly
                    placeholder="Auto-calculated"
                    style={{ ...styles.paramInput, color: '#0F172A', fontWeight: '700', fontSize: '16px' }}
                  />
                  <span style={{ ...styles.paramStatus, color: '#64748B', fontWeight: '500' }}>
                    Cum Feed ÷ Biomass
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

                {/* 9. CH TR Time (Feed Consumption Time - Manual Entry) */}
                <div style={styles.paramCard}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitle}>CH TR Time</span>
                    <span style={styles.paramUnit}>Duration</span>
                  </div>
                  <input
                    type="text"
                    value={feedForm.checkTrayTime}
                    onChange={(e) => handleFeedChange('checkTrayTime', e.target.value)}
                    placeholder="e.g. 01:30 or 90 mins"
                    style={styles.paramInput}
                  />
                  <span style={styles.paramStatus}>CH TR Time (Feed Consumption Time)</span>
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

              {/* Others - Additional disease-related information */}
              <div style={{ marginTop: '12px' }}>
                <label style={styles.label}>Others</label>
                <textarea
                  value={diseaseForm.others}
                  onChange={(e) => setDiseaseForm({ ...diseaseForm, others: e.target.value })}
                  placeholder="Enter any other observations, symptoms, or disease details not covered above..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '13px',
                    color: '#0F172A',
                    fontFamily: 'inherit',
                    backgroundColor: '#F8FAFC',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', display: 'block' }}>
                  Write descriptions, observations, symptoms, or other relevant details not covered by existing parameters.
                </span>
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
          ) : canonicalActiveTab === 'MEDICATION' ? (
            <>
              {/* Test Date & DOC */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>
                    Application Date <span style={{ color: '#DC2626', fontWeight: 'bold' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={medicationForm.date}
                    onChange={(e) => setMedicationForm({ ...medicationForm, date: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>DOC (Day of Culture)</label>
                  <input
                    type="number"
                    min="0"
                    value={medicationForm.doc || ''}
                    onChange={(e) => setMedicationForm({ ...medicationForm, doc: e.target.value })}
                    placeholder="e.g. 45"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Treatment Type & Category */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>Treatment Type</label>
                  <div style={styles.selectWrap}>
                    <select
                      value={medicationForm.treatmentType}
                      onChange={(e) => setMedicationForm({ ...medicationForm, treatmentType: e.target.value })}
                      style={styles.select}
                    >
                      <option value="Preventive">Preventive</option>
                      <option value="Curative">Curative</option>
                      <option value="Water Conditioning">Water Conditioning</option>
                      <option value="Post-Molting Support">Post-Molting Support</option>
                    </select>
                    <ChevronDown size={14} color="#64748B" style={styles.selectArrow} />
                  </div>
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Product Category</label>
                  <div style={styles.selectWrap}>
                    <select
                      value={medicationForm.category}
                      onChange={(e) => setMedicationForm({ ...medicationForm, category: e.target.value })}
                      style={styles.select}
                    >
                      <option value="Probiotics">Probiotics / Bio-augmentation</option>
                      <option value="Minerals">Minerals & Ionic Balancers</option>
                      <option value="Vitamins">Vitamins & Immunity Boosters</option>
                      <option value="Disinfectants">Sanitizers & Disinfectants</option>
                      <option value="Feed Additives">Gut Probiotics / Feed Additives</option>
                      <option value="Other">Other Aquaculture Input</option>
                    </select>
                    <ChevronDown size={14} color="#64748B" style={styles.selectArrow} />
                  </div>
                </div>
              </div>

              {/* Product Name & Dosage */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>
                    Product Name <span style={{ color: '#DC2626', fontWeight: 'bold' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={medicationForm.medicineName}
                    onChange={(e) => setMedicationForm({ ...medicationForm, medicineName: e.target.value })}
                    placeholder="e.g. AquaPro BioClean"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>
                    Dosage & Unit <span style={{ color: '#DC2626', fontWeight: 'bold' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      value={medicationForm.dosage}
                      onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                      placeholder="e.g. 500"
                      style={{ ...styles.input, flex: 2 }}
                      required
                    />
                    <div style={{ ...styles.selectWrap, flex: 3 }}>
                      <select
                        value={medicationForm.dosageUnit}
                        onChange={(e) => setMedicationForm({ ...medicationForm, dosageUnit: e.target.value })}
                        style={styles.select}
                      >
                        <option value="kg/acre">kg/acre</option>
                        <option value="g/kg feed">g/kg feed</option>
                        <option value="L/acre">L/acre</option>
                        <option value="ppm">ppm</option>
                        <option value="g/acre">g/acre</option>
                      </select>
                      <ChevronDown size={14} color="#64748B" style={styles.selectArrow} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Method & Purpose */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>Application Method</label>
                  <div style={styles.selectWrap}>
                    <select
                      value={medicationForm.applicationMethod}
                      onChange={(e) => setMedicationForm({ ...medicationForm, applicationMethod: e.target.value })}
                      style={styles.select}
                    >
                      <option value="Water">Direct Water Broadcasting</option>
                      <option value="Feed Mix">Feed Top-dressing / Mixing</option>
                      <option value="Soil">Soil Surface Application</option>
                    </select>
                    <ChevronDown size={14} color="#64748B" style={styles.selectArrow} />
                  </div>
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Primary Purpose</label>
                  <input
                    type="text"
                    value={medicationForm.purpose}
                    onChange={(e) => setMedicationForm({ ...medicationForm, purpose: e.target.value })}
                    placeholder="e.g. Maintain gut microflora"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Remarks */}
              <div style={styles.fieldCol}>
                <label style={styles.label}>Application Notes & Field Remarks</label>
                <textarea
                  value={medicationForm.remarks}
                  onChange={(e) => setMedicationForm({ ...medicationForm, remarks: e.target.value })}
                  placeholder="Record manufacturer batch, weather conditions, or farmer feedback..."
                  style={styles.textarea}
                  rows={2}
                />
              </div>
            </>
          ) : canonicalActiveTab === 'MORTALITY_LOG' ? (
            <>
              {/* Test Date & DOC */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>
                    Check Date <span style={{ color: '#DC2626', fontWeight: 'bold' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={mortalityForm.date}
                    onChange={(e) => setMortalityForm({ ...mortalityForm, date: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>DOC (Day of Culture)</label>
                  <input
                    type="number"
                    min="0"
                    value={mortalityForm.doc || ''}
                    onChange={(e) => setMortalityForm({ ...mortalityForm, doc: e.target.value })}
                    placeholder="e.g. 45"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Dead Count & Severity Level */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>
                    Observed Dead Shrimp Count <span style={{ color: '#DC2626', fontWeight: 'bold' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={mortalityForm.deadCount}
                    onChange={(e) => {
                      const count = e.target.value;
                      const num = parseInt(count, 10);
                      let sev = 'Low';
                      if (!isNaN(num)) {
                        if (num > 50) sev = 'Critical';
                        else if (num > 10) sev = 'Moderate';
                      }
                      setMortalityForm({ ...mortalityForm, deadCount: count, severity: sev });
                    }}
                    placeholder="Enter 0 if none found"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Severity Level</label>
                  <div style={styles.selectWrap}>
                    <select
                      value={mortalityForm.severity}
                      onChange={(e) => setMortalityForm({ ...mortalityForm, severity: e.target.value })}
                      style={{
                        ...styles.select,
                        color: mortalityForm.severity === 'Critical' ? '#DC2626' : mortalityForm.severity === 'Moderate' ? '#D97706' : '#16A34A',
                        fontWeight: '700',
                      }}
                    >
                      <option value="Low">Low (≤ 10 shrimp)</option>
                      <option value="Moderate">Moderate (11 - 50 shrimp)</option>
                      <option value="Critical">Critical (&gt; 50 shrimp)</option>
                    </select>
                    <ChevronDown size={14} color="#64748B" style={styles.selectArrow} />
                  </div>
                </div>
              </div>

              {/* Suspected Cause & Shrimp Physical Condition */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>Suspected Cause</label>
                  <div style={styles.selectWrap}>
                    <select
                      value={mortalityForm.suspectedCause}
                      onChange={(e) => setMortalityForm({ ...mortalityForm, suspectedCause: e.target.value })}
                      style={styles.select}
                    >
                      <option value="Low Dissolved Oxygen">Low Dissolved Oxygen (DO)</option>
                      <option value="Moulting Stress">Moulting Stress / Incomplete Ecdysis</option>
                      <option value="Ammonia / Nitrite Spike">Ammonia / Nitrite Toxicity</option>
                      <option value="Disease / Pathogen Infection">Disease / Pathogen Infection</option>
                      <option value="Temperature Shock">Sudden Weather / Temp Drop</option>
                      <option value="Unknown / Under Investigation">Under Investigation</option>
                    </select>
                    <ChevronDown size={14} color="#64748B" style={styles.selectArrow} />
                  </div>
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Physical Condition</label>
                  <div style={styles.selectWrap}>
                    <select
                      value={mortalityForm.shrimpCondition}
                      onChange={(e) => setMortalityForm({ ...mortalityForm, shrimpCondition: e.target.value })}
                      style={styles.select}
                    >
                      <option value="Normal Appearance">Normal Shell & Appendages</option>
                      <option value="Soft Shell">Soft / Loose Shell</option>
                      <option value="Black Gills">Black / Brown Gills</option>
                      <option value="Tail Cramp / Redness">Red Body / Tail Cramp</option>
                      <option value="Empty Gut">Empty Gut / Hepatopancreas Shrinkage</option>
                    </select>
                    <ChevronDown size={14} color="#64748B" style={styles.selectArrow} />
                  </div>
                </div>
              </div>

              {/* Action Taken */}
              <div style={styles.fieldCol}>
                <label style={styles.label}>Immediate Corrective Action</label>
                <div style={styles.selectWrap}>
                  <select
                    value={mortalityForm.actionTaken}
                    onChange={(e) => setMortalityForm({ ...mortalityForm, actionTaken: e.target.value })}
                    style={styles.select}
                  >
                    <option value="Aeration Increased">Aeration Increased (Full HP active)</option>
                    <option value="Water Exchange Done">Bottom Siphoned & Water Exchanged</option>
                    <option value="Probiotics Applied">Probiotics & Oxygen Enhancers Added</option>
                    <option value="Feeding Reduced">Feed Rations Reduced / Withheld</option>
                    <option value="Lab Sample Dispatched">Samples Sent for PCR / Pathology</option>
                  </select>
                  <ChevronDown size={14} color="#64748B" style={styles.selectArrow} />
                </div>
              </div>

              {/* Field Notes */}
              <div style={styles.fieldCol}>
                <label style={styles.label}>Location / Observations</label>
                <textarea
                  value={mortalityForm.remarks}
                  onChange={(e) => setMortalityForm({ ...mortalityForm, remarks: e.target.value })}
                  placeholder="e.g. Mortalities noticed near check tray #2 and inlet corner..."
                  style={styles.textarea}
                  rows={2}
                />
              </div>
            </>
          ) : canonicalActiveTab === 'FARM_ACTIVITY' ? (
            <>
              {/* Test Date & DOC */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>
                    Activity Date <span style={{ color: '#DC2626', fontWeight: 'bold' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={farmActivityForm.date}
                    onChange={(e) => setFarmActivityForm({ ...farmActivityForm, date: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>DOC (Day of Culture)</label>
                  <input
                    type="number"
                    min="0"
                    value={farmActivityForm.doc || ''}
                    onChange={(e) => setFarmActivityForm({ ...farmActivityForm, doc: e.target.value })}
                    placeholder="e.g. 45"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Activity Type & Status */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>
                    Activity Type <span style={{ color: '#DC2626', fontWeight: 'bold' }}>*</span>
                  </label>
                  <div style={styles.selectWrap}>
                    <select
                      value={farmActivityForm.activityType}
                      onChange={(e) => setFarmActivityForm({ ...farmActivityForm, activityType: e.target.value })}
                      style={styles.select}
                      required
                    >
                      <option value="Aerator Surveillance">Aerator Surveillance & RPM Check</option>
                      <option value="Water Exchange">Pond Water Exchange / Top-up</option>
                      <option value="Pond Liming">Liming (CaCO3 / Dolomite)</option>
                      <option value="Mesh / Net Cleaning">Netting / Filter Mesh Cleaning</option>
                      <option value="Bottom Siphoning">Central Pond Bottom Siphoning</option>
                      <option value="Probiotics Broadcasting">Bio-ferment / Probiotics Spread</option>
                      <option value="Cast Net Sampling">Cast Net Shrimp Biometrics</option>
                      <option value="Generator Maintenance">Backup Generator / Motor Service</option>
                    </select>
                    <ChevronDown size={14} color="#64748B" style={styles.selectArrow} />
                  </div>
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Operational Status</label>
                  <div style={styles.selectWrap}>
                    <select
                      value={farmActivityForm.status}
                      onChange={(e) => setFarmActivityForm({ ...farmActivityForm, status: e.target.value })}
                      style={styles.select}
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Scheduled">Scheduled / Planned</option>
                    </select>
                    <ChevronDown size={14} color="#64748B" style={styles.selectArrow} />
                  </div>
                </div>
              </div>

              {/* Equipment Used & Duration */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>Equipment / Material Applied</label>
                  <input
                    type="text"
                    value={farmActivityForm.equipmentUsed}
                    onChange={(e) => setFarmActivityForm({ ...farmActivityForm, equipmentUsed: e.target.value })}
                    placeholder="e.g. 4x Paddlewheel Aerators, 50kg Lime"
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Duration / Volume</label>
                  <input
                    type="text"
                    value={farmActivityForm.duration}
                    onChange={(e) => setFarmActivityForm({ ...farmActivityForm, duration: e.target.value })}
                    placeholder="e.g. 2 hours / 10% water"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Remarks */}
              <div style={styles.fieldCol}>
                <label style={styles.label}>Operational Remarks</label>
                <textarea
                  value={farmActivityForm.remarks}
                  onChange={(e) => setFarmActivityForm({ ...farmActivityForm, remarks: e.target.value })}
                  placeholder="Record crew observations, maintenance notes, or machine serials..."
                  style={styles.textarea}
                  rows={2}
                />
              </div>
            </>
          ) : canonicalActiveTab === 'PHOTO_OBSERVATION' ? (
            <>
              {/* Test Date & DOC */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>
                    Observation Date <span style={{ color: '#DC2626', fontWeight: 'bold' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={photoObservationForm.date}
                    onChange={(e) => setPhotoObservationForm({ ...photoObservationForm, date: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>DOC (Day of Culture)</label>
                  <input
                    type="number"
                    min="0"
                    value={photoObservationForm.doc || ''}
                    onChange={(e) => setPhotoObservationForm({ ...photoObservationForm, doc: e.target.value })}
                    placeholder="e.g. 45"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Target Category & Shrimp Visual Activity */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>
                    Audit Target <span style={{ color: '#DC2626', fontWeight: 'bold' }}>*</span>
                  </label>
                  <div style={styles.selectWrap}>
                    <select
                      value={photoObservationForm.category}
                      onChange={(e) => setPhotoObservationForm({ ...photoObservationForm, category: e.target.value })}
                      style={styles.select}
                      required
                    >
                      <option value="Pond Water Condition">Pond Water & Bloom Condition</option>
                      <option value="Shrimp Health & Morphology">Shrimp Body & Gut Inspection</option>
                      <option value="Check Tray Feed Intake">Check Tray Feed Consumption</option>
                      <option value="Aerator & Equipment Status">Aerator & Farm Infrastructure</option>
                      <option value="Pond Bottom / Sediment">Central Drain / Sediment Quality</option>
                    </select>
                    <ChevronDown size={14} color="#64748B" style={styles.selectArrow} />
                  </div>
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Visual Activity</label>
                  <div style={styles.selectWrap}>
                    <select
                      value={photoObservationForm.shrimpVisual}
                      onChange={(e) => setPhotoObservationForm({ ...photoObservationForm, shrimpVisual: e.target.value })}
                      style={styles.select}
                    >
                      <option value="Active swimming">Active swimming & quick response</option>
                      <option value="Bottom resting">Resting on pond floor normally</option>
                      <option value="Surface edging">Surfacing / swimming near edges</option>
                      <option value="Sluggish / Lethargic">Sluggish / slow jump response</option>
                    </select>
                    <ChevronDown size={14} color="#64748B" style={styles.selectArrow} />
                  </div>
                </div>
              </div>

              {/* Water Secchi Transparency & Color */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>Secchi Transparency (cm)</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={photoObservationForm.transparencyCm}
                    onChange={(e) => setPhotoObservationForm({ ...photoObservationForm, transparencyCm: e.target.value })}
                    placeholder="e.g. 35 cm"
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Water Color Hue</label>
                  <input
                    type="text"
                    value={photoObservationForm.waterColor}
                    onChange={(e) => setPhotoObservationForm({ ...photoObservationForm, waterColor: e.target.value })}
                    placeholder="e.g. Light Green / Tea Color"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Summary & Field Notes */}
              <div style={styles.fieldCol}>
                <label style={styles.label}>Observation Summary</label>
                <input
                  type="text"
                  value={photoObservationForm.summary}
                  onChange={(e) => setPhotoObservationForm({ ...photoObservationForm, summary: e.target.value })}
                  placeholder="e.g. Clear green bloom with active feeding on tray #1"
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldCol}>
                <label style={styles.label}>Detailed Field Notes</label>
                <textarea
                  value={photoObservationForm.notes}
                  onChange={(e) => setPhotoObservationForm({ ...photoObservationForm, notes: e.target.value })}
                  placeholder="Record camera angle, lighting, or specific shrimp biometrics noted..."
                  style={styles.textarea}
                  rows={2}
                />
              </div>
            </>
          ) : canonicalActiveTab === 'HARVEST_ENTRY' ? (
            <>
              {/* Test Date & DOC */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>
                    Harvest Date <span style={{ color: '#DC2626', fontWeight: 'bold' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={harvestForm.date}
                    onChange={(e) => handleHarvestChange('date', e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>DOC (Day of Culture)</label>
                  <input
                    type="number"
                    min="0"
                    value={harvestForm.doc || ''}
                    onChange={(e) => handleHarvestChange('doc', e.target.value)}
                    placeholder="e.g. 95"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Harvest Type & ABW */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>Harvest Type</label>
                  <div style={styles.selectWrap}>
                    <select
                      value={harvestForm.harvestType}
                      onChange={(e) => handleHarvestChange('harvestType', e.target.value)}
                      style={styles.select}
                    >
                      <option value="Partial">Partial Harvest (Thinning)</option>
                      <option value="Final">Final Harvest (Pond Closeout)</option>
                    </select>
                    <ChevronDown size={14} color="#64748B" style={styles.selectArrow} />
                  </div>
                </div>

                <div style={styles.fieldCol}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ ...styles.label, marginBottom: 0 }}>
                      Average Body Weight (ABW) <span style={{ color: '#DC2626', fontWeight: 'bold' }}>*</span>
                    </label>
                    {previousHarvestAbw !== null && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: isAbwLowerThanPrevious ? '#B45309' : '#15803D',
                        backgroundColor: isAbwLowerThanPrevious ? '#FEF3C7' : '#DCFCE7',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: `1px solid ${isAbwLowerThanPrevious ? '#FDE68A' : '#86EFAC'}`
                      }}>
                        Prev: {previousHarvestAbw}g
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={harvestForm.abw}
                    onChange={(e) => handleHarvestChange('abw', e.target.value)}
                    placeholder="e.g. 25.5 g"
                    style={{
                      ...styles.input,
                      borderColor: isAbwLowerThanPrevious ? '#F59E0B' : undefined,
                      backgroundColor: isAbwLowerThanPrevious ? '#FFFBEB' : '#FFFFFF',
                    }}
                    required
                  />
                </div>
              </div>

              {/* Dynamic Observation Text Box when entered ABW is lower than previous cut */}
              {isAbwLowerThanPrevious && (
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: '#FFFBEB',
                  border: '1.5px solid #FCD34D',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginTop: '4px',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B45309', fontWeight: '700', fontSize: '12.5px' }}>
                    <AlertTriangle size={16} color="#D97706" />
                    <span>Observation Required: ABW ({numEnteredAbw}g) is less than previous harvest ({previousHarvestAbw}g)</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#78350F', lineHeight: '1.4' }}>
                    Average body weight is lower than the previous cut. Please enter field observation / reason for this variance:
                  </p>
                  <textarea
                    value={harvestForm.abwObservation || ''}
                    onChange={(e) => handleHarvestChange('abwObservation', e.target.value)}
                    placeholder="e.g. Selective harvest of smaller stock from shallow area, sample variance, partial molting..."
                    rows={2}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #F59E0B',
                      backgroundColor: '#FFFFFF',
                      fontSize: '12.5px',
                      color: '#0F172A',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* Harvested Biomass & Calculated Total Shrimps */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>
                    Harvested Biomass (kg) <span style={{ color: '#DC2626', fontWeight: 'bold' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={harvestForm.harvestedBiomass}
                    onChange={(e) => handleHarvestChange('harvestedBiomass', e.target.value)}
                    placeholder="e.g. 1850 kg"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Est. Total Shrimps Harvested</label>
                  <div
                    style={{
                      ...styles.input,
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#F1F5F9',
                      fontWeight: '700',
                      color: '#1A2FB8',
                    }}
                  >
                    {harvestForm.totalShrimps
                      ? `${Number(harvestForm.totalShrimps).toLocaleString()} pcs`
                      : 'Auto-calculated (Biomass/ABW)'}
                  </div>
                </div>
              </div>

              {/* Buyer / Plant Name & Remarks */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>Buyer / Processing Plant</label>
                  <input
                    type="text"
                    value={harvestForm.buyerName}
                    onChange={(e) => handleHarvestChange('buyerName', e.target.value)}
                    placeholder="e.g. Royal Seafoods Bhimavaram"
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.label}>Harvest Remarks</label>
                  <input
                    type="text"
                    value={harvestForm.remarks}
                    onChange={(e) => handleHarvestChange('remarks', e.target.value)}
                    placeholder="e.g. Prime grade, clean shell"
                    style={styles.input}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Test Date & DOC */}
              <div style={styles.twoColRow}>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>
                    Test Date <span style={{ color: '#DC2626', fontWeight: 'bold' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={waterForm.date}
                    onChange={(e) => setWaterForm({ ...waterForm, date: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.fieldCol}>
                  <label style={styles.label}>DOC (Day of Culture)</label>
                  <input
                    type="number"
                    min="0"
                    value={waterForm.doc || ''}
                    onChange={(e) => setWaterForm({ ...waterForm, doc: e.target.value })}
                    placeholder="e.g. 45"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.paramGrid}>
                {/* 1. pH: 7.5 to 8.5 */}
                <div style={styles.paramCard}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitle}>
                      pH Level <span style={{ color: '#DC2626', fontWeight: 'bold' }}>*</span>
                    </span>
                    <span style={styles.paramUnit}>pH</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={waterForm.ph}
                    onChange={(e) => setWaterForm({ ...waterForm, ph: e.target.value })}
                    placeholder="7.8"
                    style={styles.paramInput}
                    required
                  />
                </div>

                {/* 2. Ammonia: NH3 */}
                <div style={styles.paramCard}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitle}>
                      Ammonia (NH3) <span style={{ color: '#DC2626', fontWeight: 'bold' }}>*</span>
                    </span>
                    <span style={styles.paramUnit}>ppm</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={waterForm.ammonia}
                    onChange={(e) => setWaterForm({ ...waterForm, ammonia: e.target.value })}
                    placeholder="0.05"
                    style={styles.paramInput}
                    required
                  />
                </div>

                {/* 3. Nitrate: NO3 */}
                <div style={styles.paramCard}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitle}>
                      Nitrate (NO3) <span style={{ color: '#DC2626', fontWeight: 'bold' }}>*</span>
                    </span>
                    <span style={styles.paramUnit}>ppm</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={waterForm.nitrate}
                    onChange={(e) => setWaterForm({ ...waterForm, nitrate: e.target.value })}
                    placeholder="2.0"
                    style={styles.paramInput}
                    required
                  />
                </div>

                {/* 4. Salinity */}
                <div style={styles.paramCard}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitle}>
                      Salinity <span style={{ color: '#DC2626', fontWeight: 'bold' }}>*</span>
                    </span>
                    <span style={styles.paramUnit}>ppt</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="45"
                    value={waterForm.salinity}
                    onChange={(e) => handleSalinityChange(e.target.value)}
                    placeholder="16.0"
                    style={styles.paramInput}
                    required
                  />
                </div>
              </div>

              {/* Optional Parameters Displayed Directly */}
              <div style={styles.advancedGrid}>
                {/* Alkalinity */}
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

                {/* Hardness */}
                <div style={styles.paramCardSmall}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitleSmall}>Hardness</span>
                    <span style={styles.paramUnit}>ppm</span>
                  </div>
                  <input
                    type="number"
                    value={waterForm.hardness}
                    onChange={(e) => setWaterForm({ ...waterForm, hardness: e.target.value })}
                    placeholder="1500"
                    style={styles.paramInputSmall}
                  />
                </div>

                {/* DO */}
                <div style={styles.paramCardSmall}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitleSmall}>Dissolved Oxygen (DO)</span>
                    <span style={styles.paramUnit}>mg/L</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={waterForm.do}
                    onChange={(e) => setWaterForm({ ...waterForm, do: e.target.value })}
                    placeholder="5.6"
                    style={styles.paramInputSmall}
                  />
                </div>

                {/* H2S */}
                <div style={styles.paramCardSmall}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitleSmall}>H2S</span>
                    <span style={styles.paramUnit}>ppm</span>
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    value={waterForm.h2s}
                    onChange={(e) => setWaterForm({ ...waterForm, h2s: e.target.value })}
                    placeholder="0.01"
                    style={styles.paramInputSmall}
                  />
                </div>

                {/* Chlorine (CL) */}
                <div style={styles.paramCardSmall}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitleSmall}>Chlorine (CL)</span>
                    <span style={styles.paramUnit}>ppm</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={waterForm.cl}
                    onChange={(e) => setWaterForm({ ...waterForm, cl: e.target.value })}
                    placeholder="0.00"
                    style={styles.paramInputSmall}
                  />
                </div>

                {/* Iron (Fe) */}
                <div style={styles.paramCardSmall}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitleSmall}>Iron (Fe)</span>
                    <span style={styles.paramUnit}>ppm</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={waterForm.fe}
                    onChange={(e) => setWaterForm({ ...waterForm, fe: e.target.value })}
                    placeholder="0.01"
                    style={styles.paramInputSmall}
                  />
                </div>

                {/* Water Color */}
                <div style={styles.paramCardSmall}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitleSmall}>Water Color</span>
                  </div>
                  <input
                    type="text"
                    value={waterForm.waterColor}
                    onChange={(e) => setWaterForm({ ...waterForm, waterColor: e.target.value })}
                    placeholder="e.g. Light Green"
                    style={styles.paramInputSmall}
                  />
                </div>

                {/* Temperature */}
                <div style={styles.paramCardSmall}>
                  <div style={styles.paramHeader}>
                    <span style={styles.paramTitleSmall}>Temperature</span>
                    <span style={styles.paramUnit}>°C</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={waterForm.temperature}
                    onChange={(e) => setWaterForm({ ...waterForm, temperature: e.target.value })}
                    placeholder="28.5"
                    style={styles.paramInputSmall}
                  />
                </div>
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
              onClick={() => setIsSelectingType(true)}
            >
              All Tests
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
      </>
    )}
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
  selectorContainer: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
    overflow: 'hidden',
  },
  selectorBody: {
    padding: '16px 20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  tankClosedAlert: {
    padding: '10px 14px',
    backgroundColor: '#FEF2F2',
    borderRadius: '10px',
    border: '1px solid #FECACA',
    color: '#991B1B',
    fontSize: '12px',
    lineHeight: 1.4,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  searchWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    height: '38px',
    padding: '0 34px 0 34px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#F8FAFC',
    fontSize: '12.5px',
    color: '#0F172A',
    fontWeight: '500',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease, background-color 0.15s ease',
  },
  searchClearBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillsRow: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    paddingBottom: '2px',
  },
  catFilterPill: {
    padding: '5px 12px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
    outline: 'none',
  },
  testsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '10px',
    marginTop: '2px',
  },
  testOptionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    backgroundColor: '#FFFFFF',
    border: '1.5px solid #E2E8F0',
    borderRadius: '14px',
    textAlign: 'left',
    cursor: 'pointer',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  },
  testOptionIconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  testOptionDetails: {
    flex: 1,
    minWidth: 0,
  },
  testOptionHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
    marginBottom: '2px',
  },
  testOptionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  testOptionBadge: {
    fontSize: '9.5px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    whiteSpace: 'nowrap',
  },
  testOptionDesc: {
    fontSize: '11px',
    color: '#64748B',
    margin: 0,
    lineHeight: 1.35,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  testOptionChevron: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  backToSelectorBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 10px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#F8FAFC',
    color: '#1A2FB8',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.15s ease',
  },
  testTabsScroller: {
    display: 'flex',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
  },
  testTabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '11.5px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  textarea: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    fontSize: '12.5px',
    color: '#0F172A',
    fontWeight: '500',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'vertical',
    minHeight: '60px',
  },
};

const QuickRecordModal = (props) => {
  if (!props.isOpen) return null;
  return <QuickRecordModalInner {...props} />;
};

export default React.memo(QuickRecordModal);
