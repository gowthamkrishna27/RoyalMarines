import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Scale, User, Phone, MapPin, CheckCircle, Plus, 
  Trash2, Info, FileSpreadsheet, Calendar, Sparkles,
  AlertTriangle, Lock, RefreshCw, X, ArrowRight, ArrowLeft, Check, Users, ChevronDown,
  Leaf, Flag, BadgeCheck
} from 'lucide-react';
import { getSession } from '../utils/agentAuth';
import { getInchargeSession } from '../../asm/utils/inchargeAuth';
import { useMockData } from '../../context/MockDataContext';
import apiClient from '../../utils/apiClient';

// Helper to load combined harvest stores
const loadHarvestStore = () => {
  try {
    const cleanStore = JSON.parse(localStorage.getItem('agent_harvest_clean_store') || '{}');
    const standardStore = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
    return { ...standardStore, ...cleanStore };
  } catch (e) {
    return {};
  }
};

const Harvest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);
  const { 
    db, 
    getFarmersByAgentId, 
    getTanksByFarmerId, 
    getFarmersByInchargeId, 
    getMyFarmersByInchargeId,
    refreshDb
  } = useMockData();

  // Detect whether current page is in Incharge / ASM context
  const isInchargeMode = location.pathname.startsWith('/asm') || 
                         location.pathname.startsWith('/incharge') || 
                         (!getSession() && !!getInchargeSession());

  // State
  const [farmers, setFarmers] = useState([]);
  const [asmFarmerScope, setAsmFarmerScope] = useState('ALL'); // 'ALL' | 'MY_FARMERS' | 'AGENT_FARMERS'
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [selectedTankId, setSelectedTankId] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Store for harvest data per farmer + tank
  const [harvestData, setHarvestData] = useState(() => loadHarvestStore());

  // Harvest Form Modal State (Partial vs Final)
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);
  const [modalHarvestType, setModalHarvestType] = useState('Partial Harvest'); // 'Partial Harvest' | 'Final Harvest'
  const [isFinalConfirmationOpen, setIsFinalConfirmationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDoc, setFormDoc] = useState('');
  const [formAbw, setFormAbw] = useState('');
  const [formHarvestedNumber, setFormHarvestedNumber] = useState('');
  const [formBiomass, setFormBiomass] = useState('');
  const [formFeed, setFormFeed] = useState('');
  const [formBuyer, setFormBuyer] = useState('');
  const [formRemarks, setFormRemarks] = useState('');

  // Restock Modal State
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockDoc, setRestockDoc] = useState(1);
  const [restockDate, setRestockDate] = useState(new Date().toISOString().split('T')[0]);
  const [restockAbw, setRestockAbw] = useState('0.5g');
  const [restockBiomass, setRestockBiomass] = useState('0 kg');
  const [restockFcr, setRestockFcr] = useState('1.10');
  const [isRestocking, setIsRestocking] = useState(false);

  useEffect(() => {
    // Determine context strictly based on URL route
    const isAsm = location.pathname.startsWith('/asm') || location.pathname.startsWith('/incharge');
    const agentSession = getSession();
    const inchargeSession = getInchargeSession();
    const activeSession = isAsm ? (inchargeSession || agentSession) : (agentSession || inchargeSession);

    const defaultAgentId = 'agent001';
    const resolvedSession = activeSession || {
      agentId: defaultAgentId,
      id: defaultAgentId,
      name: 'Ramesh Kumar',
      role: isAsm ? 'ASM' : 'AGENT',
    };
    setSession(resolvedSession);

    let resolvedFarmers = [];
    if (isAsm) {
      const incId = inchargeSession?.inchargeId || inchargeSession?.id || 'INC001';
      let inchargeAll = (getFarmersByInchargeId && getFarmersByInchargeId(incId)) || [];
      if (!inchargeAll.length && db?.farmers) {
        inchargeAll = db.farmers.filter(f => f.inchargeId === incId || f.incharge_id === incId);
      }

      if (asmFarmerScope === 'MY_FARMERS') {
        // Farmers directly assigned to ASM / Incharge
        resolvedFarmers = (getMyFarmersByInchargeId && getMyFarmersByInchargeId(incId)) || [];
        if (!resolvedFarmers.length) {
          resolvedFarmers = inchargeAll.filter(f => {
            const assigned = String(f.assignedTo || f.assigned_to || '').toLowerCase();
            return assigned === 'incharge' || !f.agentId || !f.agent_id;
          });
        }
      } else if (asmFarmerScope === 'AGENT_FARMERS') {
        // Farmers assigned to Agents under this ASM
        resolvedFarmers = inchargeAll.filter(f => {
          const assigned = String(f.assignedTo || f.assigned_to || '').toLowerCase();
          const hasAgent = !!(f.agentId || f.agent_id);
          return assigned === 'agent' || (hasAgent && assigned !== 'incharge');
        });
      } else {
        // All farmers under this ASM (both ASM personal & agent assigned)
        resolvedFarmers = inchargeAll;
      }
    } else {
      const currentAgentId = agentSession?.agentId || agentSession?.id || resolvedSession?.agentId || defaultAgentId;
      resolvedFarmers = (getFarmersByAgentId && getFarmersByAgentId(currentAgentId)) || [];
      
      // Strict fallback: ensure every farmer in the list is strictly assigned to this agent
      if (!resolvedFarmers.length && db?.farmers) {
        resolvedFarmers = db.farmers.filter(f => {
          const fAgent = String(f.agentId || f.agent_id || '').toLowerCase();
          return fAgent === String(currentAgentId).toLowerCase();
        });
      } else {
        resolvedFarmers = resolvedFarmers.filter(f => {
          const fAgent = String(f.agentId || f.agent_id || '').toLowerCase();
          return fAgent === String(currentAgentId).toLowerCase();
        });
      }
    }

    setFarmers(resolvedFarmers);

    // Read query params from URL (e.g., ?farmerId=...&tankId=...)
    const searchParams = new URLSearchParams(location.search);
    const paramFarmerId = searchParams.get('farmerId');
    const paramTankId = searchParams.get('tankId');

    if (resolvedFarmers.length > 0) {
      const defaultFarmerId = (paramFarmerId && resolvedFarmers.some(f => f.id === paramFarmerId))
        ? paramFarmerId
        : resolvedFarmers[0].id;
      
      setSelectedFarmerId(prev => (paramFarmerId || (prev && resolvedFarmers.some(f => f.id === prev)) ? (paramFarmerId || prev) : defaultFarmerId));

      const targetId = paramFarmerId || selectedFarmerId || defaultFarmerId;
      const farmerTanks = getTanksByFarmerId ? getTanksByFarmerId(targetId) : [];
      if (farmerTanks.length > 0) {
        if (paramTankId && farmerTanks.some(t => t.id === paramTankId)) {
          setSelectedTankId(paramTankId);
        } else {
          setSelectedTankId(prev => (prev && farmerTanks.some(t => t.id === prev)) ? prev : farmerTanks[0].id);
        }
      } else {
        setSelectedTankId('');
      }
    } else {
      setSelectedFarmerId('');
      setSelectedTankId('');
    }

    const handleStoreUpdate = (e) => {
      if (e.detail) {
        setHarvestData(e.detail);
      } else {
        setHarvestData(loadHarvestStore());
      }
    };

    window.addEventListener('harvestStoreUpdated', handleStoreUpdate);
    return () => window.removeEventListener('harvestStoreUpdated', handleStoreUpdate);
  }, [location.search, isInchargeMode, asmFarmerScope, db]);

  // Update selected tank when farmer changes
  const handleFarmerChange = (farmerId) => {
    setSelectedFarmerId(farmerId);
    const farmerTanks = getTanksByFarmerId ? getTanksByFarmerId(farmerId) : [];
    if (farmerTanks && farmerTanks.length > 0) {
      setSelectedTankId(farmerTanks[0].id);
    } else {
      setSelectedTankId('');
    }
  };

  if (!session) return null;

  const currentFarmer = farmers.find(f => f.id === selectedFarmerId) || (farmers.length > 0 ? farmers[0] : {
    name: 'Ravi',
    location: 'Chinnamiram',
    phone: '+91 9876543211'
  });

  const currentTanks = getTanksByFarmerId ? getTanksByFarmerId(selectedFarmerId) : [];
  const activeTank = currentTanks.find(t => t.id === selectedTankId) || (currentTanks.length > 0 ? currentTanks[0] : { id: 'T003', name: 'Tank 3', acres: '2.5' });
  const activeTankKey = `${selectedFarmerId}_${selectedTankId}`;

  // Current tank harvest store
  const currentStore = harvestData[activeTankKey] || {
    tankSize: activeTank?.acres || '2.5',
    seedNumber: activeTank?.seedStocked || '200000',
    stockingDate: activeTank?.stockingDate || '2026-06-01',
    harvests: [],
    totalFeed: '3600'
  };

  const normalizeId = (id) => String(id || '').trim().toLowerCase().replace(/^t0*/, 't');
  const isTankMatch = (idA, idB) => {
    if (!idA || !idB) return false;
    if (idA === idB) return true;
    return normalizeId(idA) === normalizeId(idB);
  };

  const currentCycleId = activeTank?.cultureCycleId || activeTank?.culture_cycle_id || 'CYCLE_1';

  const storedList = currentStore.harvests || [];
  const rawHarvests = [...storedList];

  // Merge from db.harvests
  (db?.harvests || []).forEach(h => {
    if (isTankMatch(h.tankId, selectedTankId)) {
      const exists = rawHarvests.some(r => r.id === h.id || (r.date === h.date && r.harvestedBiomass === h.quantityKg));
      if (!exists) {
        rawHarvests.push({
          id: h.id,
          date: h.date,
          doc: h.doc || activeTank?.doc || 77,
          abw: h.abw || activeTank?.abw || 25,
          harvestedBiomass: h.harvestedBiomass || h.harvested_biomass || h.quantityKg || h.quantity_kg || 0,
          harvestedNumber: h.harvestedNumber || h.harvested_number || (h.countPerKg && h.quantityKg ? h.countPerKg * h.quantityKg : 0),
          feedConsumed: h.feedConsumed || 0,
          fcr: h.fcr || activeTank?.fcr || '1.18',
          buyer: h.buyerName || h.buyer || 'Royals Marine Processing Unit 1',
          remarks: h.remarks || '',
          harvestType: h.harvestType || 'Partial Harvest',
          isFinal: h.isFinal || (h.harvestType === 'Final Harvest'),
          cultureCycleId: h.cultureCycleId || h.culture_cycle_id || 'CYCLE_1'
        });
      }
    }
  });

  // Merge from db.submissions
  (db?.submissions || []).forEach(sub => {
    if (isTankMatch(sub.tankId, selectedTankId)) {
      const isSubHarvest = (sub.testType || '').toUpperCase().includes('HARVEST') || 
                           (sub.recordType || '').toUpperCase().includes('HARVEST');
      if (isSubHarvest) {
        const sData = sub.data || {};
        const exists = rawHarvests.some(r => r.id === sub.id || (r.date === sub.date && r.harvestedBiomass === (sData.harvestedBiomass || sData.quantityKg)));
        if (!exists) {
          rawHarvests.push({
            id: sub.id,
            date: sub.date,
            doc: sData.doc || activeTank?.doc || 77,
            abw: sData.abw || activeTank?.abw || 25,
            harvestedBiomass: parseFloat(sData.harvestedBiomass || sData.quantityKg || 0),
            harvestedNumber: parseFloat(sData.harvestedNumber || 0),
            feedConsumed: parseFloat(sData.feedConsumed || 0),
            fcr: sData.fcr || activeTank?.fcr || '1.18',
            buyer: sData.buyer || 'Royals Marine Processing Unit 1',
            remarks: sData.remarks || '',
            harvestType: sData.harvestType || (sub.testType === 'Final Harvest' ? 'Final Harvest' : 'Partial Harvest'),
            isFinal: sub.testType === 'Final Harvest' || sData.harvestType === 'Final Harvest' || sData.isFinal,
            cultureCycleId: sData.cultureCycleId || activeTank?.cultureCycleId || 'CYCLE_1'
          });
        }
      }
    }
  });

  // Sort harvests chronologically
  const sortedHarvests = [...rawHarvests].sort((a, b) => {
    return new Date(a.date || 0) - new Date(b.date || 0);
  });

  // Check if current cycle already has a final harvest or is closed
  const hasFinalHarvestInCycle = sortedHarvests.some(h => 
    (h.cultureCycleId === currentCycleId || !h.cultureCycleId) && (h.isFinal || h.harvestType === 'Final Harvest')
  ) || String(activeTank?.status || '').toUpperCase() === 'HARVESTED' || 
     String(activeTank?.test_status || '').toUpperCase() === 'CYCLE CLOSED' ||
     currentStore.finalHarvestCompleted === true;

  // Dynamically assign sequence titles: Partial Harvest-1, Partial Harvest-2, ... Final Harvest
  let partialCount = 0;
  const sequencedHarvests = sortedHarvests.map((h) => {
    const isFinal = h.harvestType === 'Final Harvest' || h.isFinal;
    if (isFinal) {
      return { ...h, displayTitle: 'Final Harvest', isFinal: true };
    } else {
      partialCount += 1;
      return { ...h, displayTitle: `Partial Harvest-${partialCount}`, isFinal: false };
    }
  });

  // Filter current cycle harvests for performance stats, or show all if cycle unspecified
  const currentCycleHarvests = sequencedHarvests.filter(h => 
    !h.cultureCycleId || h.cultureCycleId === currentCycleId
  );
  const relevantHarvests = currentCycleHarvests.length > 0 ? currentCycleHarvests : sequencedHarvests;

  // Auto-calculated totals
  const totalHarvestedSeed = relevantHarvests.reduce((sum, h) => {
    const num = parseFloat(h.harvestedNumber) || 0;
    if (num > 0) return sum + num;
    const biomass = parseFloat(h.harvestedBiomass) || 0;
    const abw = parseFloat(h.abw) || 0;
    if (biomass > 0 && abw > 0) {
      return sum + Math.round((biomass * 1000) / abw);
    }
    return sum;
  }, 0);

  const totalHarvestedBiomass = relevantHarvests.reduce((sum, h) => {
    return sum + (parseFloat(h.harvestedBiomass) || 0);
  }, 0);

  const totalFeed = parseFloat(currentStore.totalFeed) || 0;
  const seedStocked = parseFloat(currentStore.seedNumber) || 200000;
  
  const survivalPct = seedStocked > 0 && totalHarvestedSeed > 0
    ? ((totalHarvestedSeed / seedStocked) * 100).toFixed(2)
    : '0.00';

  const fcr = totalHarvestedBiomass > 0
    ? (totalFeed / totalHarvestedBiomass).toFixed(2)
    : '0.00';

  // Auto calculate biomass from Harvest Number & ABW: (Harvest Number * ABW) / 1000
  const autoCalcBiomass = (numStr, abwStr) => {
    const num = parseFloat(numStr);
    const abw = parseFloat(abwStr);
    if (!isNaN(num) && num > 0 && !isNaN(abw) && abw > 0) {
      const kg = (num * abw) / 1000;
      return Number.isInteger(kg) ? String(kg) : String(parseFloat(kg.toFixed(2)));
    }
    return '';
  };

  const handleHarvestNumberChange = (val) => {
    setFormHarvestedNumber(val);
    const computed = autoCalcBiomass(val, formAbw);
    if (computed) {
      setFormBiomass(computed);
    }
  };

  const handleAbwChange = (val) => {
    setFormAbw(val);
    if (formHarvestedNumber) {
      const computed = autoCalcBiomass(formHarvestedNumber, val);
      if (computed) {
        setFormBiomass(computed);
      }
    }
  };

  // --- Cycle Cumulative Calculations for Final Harvest ---
  // Fetch and filter previous partial harvest records strictly for the same tank and culture cycle
  const seenHarvestKeys = new Set();
  const previousPartialHarvests = rawHarvests.filter((h) => {
    // 1. Tank match
    if (!isTankMatch(h.tankId || activeTank.id, selectedTankId)) return false;
    // 2. Same culture cycle
    const cycle = h.cultureCycleId || h.culture_cycle_id || 'CYCLE_1';
    if (cycle !== currentCycleId) return false;
    // 3. Must be partial harvest (not final)
    const isFinal = Boolean(
      h.isFinal || 
      String(h.harvestType || '').toLowerCase().includes('final') ||
      String(h.testType || '').toLowerCase().includes('final')
    );
    if (isFinal) return false;

    // 4. Deduplicate to include every valid partial harvest exactly once
    const uKey = h.id ? String(h.id) : `${h.date}_${h.harvestedBiomass}`;
    if (seenHarvestKeys.has(uKey)) return false;
    seenHarvestKeys.add(uKey);
    return true;
  });

  // Sum of previous partial harvest piece counts
  const prevPartialHarvestNumber = previousPartialHarvests.reduce((sum, h) => {
    const num = parseFloat(h.harvestedNumber) || 0;
    if (num > 0) return sum + num;
    const biomass = parseFloat(h.harvestedBiomass) || 0;
    const abw = parseFloat(h.abw) || 0;
    if (biomass > 0 && abw > 0) {
      return sum + Math.round((biomass * 1000) / abw);
    }
    return sum;
  }, 0);

  // Sum of previous partial harvest biomass (kg)
  const prevPartialBiomass = previousPartialHarvests.reduce((sum, h) => {
    return sum + (parseFloat(h.harvestedBiomass) || 0);
  }, 0);

  // Current Final Harvest inputs:
  const currentFinalNumber = parseFloat(formHarvestedNumber) || 
    (parseFloat(formBiomass) > 0 && parseFloat(formAbw) > 0 
      ? Math.round((parseFloat(formBiomass) * 1000) / parseFloat(formAbw)) 
      : 0);

  const currentFinalBiomass = parseFloat(formBiomass) || 
    (parseFloat(formHarvestedNumber) > 0 && parseFloat(formAbw) > 0 
      ? ((parseFloat(formHarvestedNumber) * parseFloat(formAbw)) / 1000) 
      : 0);

  // 1. Harvest Number in Final Harvest & 2. Total Harvested Seed
  const cumulativeTotalSeed = prevPartialHarvestNumber + currentFinalNumber;

  // 3. Total Biomass (kg) = sum of all previous partial harvest biomasses + current final harvest biomass
  const cumulativeTotalBiomass = prevPartialBiomass + currentFinalBiomass;

  // 4. Total Feed = feed consumed during previous partial harvest periods + feed consumed for the final harvest/current cycle
  // Avoid double-counting cumulative feed
  const prevHarvestsFeed = previousPartialHarvests.reduce((sum, h) => sum + (parseFloat(h.feedConsumed) || 0), 0);
  const tankStoreTotalFeed = parseFloat(currentStore.totalFeed) || 0;
  
  const tankFeedTests = (db?.submissions || []).filter(sub => 
    isTankMatch(sub.tankId, selectedTankId) && 
    ((sub.testType || '').toUpperCase().includes('FEED') || sub.recordType === 'FEED_ENTRY')
  );
  const latestFeedTest = tankFeedTests.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];
  const submissionCumFeed = parseFloat(latestFeedTest?.data?.cumulativeFeed || latestFeedTest?.data?.feed || 0);

  let cumulativeTotalFeed = 0;
  if (prevHarvestsFeed > 0) {
    cumulativeTotalFeed = prevHarvestsFeed;
  } else if (tankStoreTotalFeed > 0) {
    cumulativeTotalFeed = tankStoreTotalFeed;
  } else if (submissionCumFeed > 0) {
    cumulativeTotalFeed = submissionCumFeed;
  } else {
    cumulativeTotalFeed = 3600;
  }

  // 5. FCR = Total Feed ÷ Total Biomass
  const cumulativeFcr = cumulativeTotalBiomass > 0 
    ? (cumulativeTotalFeed / cumulativeTotalBiomass).toFixed(2) 
    : '0.00';

  // 6. Survival % = (Total Harvested Seed ÷ Stocked Seed) * 100
  const cumulativeSurvivalPct = seedStocked > 0 && cumulativeTotalSeed > 0
    ? Math.min(100, ((cumulativeTotalSeed / seedStocked) * 100)).toFixed(2)
    : '0.00';

  // Open harvest modal with specific type
  const openHarvestModal = (type = 'Partial Harvest') => {
    if (hasFinalHarvestInCycle) {
      setErrorMessage('A final harvest has already concluded this tank cycle. Please restock the tank to start a new cycle.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    setModalHarvestType(type || 'Partial Harvest');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDoc(activeTank?.doc ? String(activeTank.doc) : '');
    const currentAbw = activeTank?.abw ? String(parseFloat(activeTank.abw)) : '';
    setFormAbw(currentAbw);
    setFormHarvestedNumber('');
    setFormBiomass('');
    setFormFeed('');
    setFormBuyer('');
    setFormRemarks('');
    setIsHarvestModalOpen(true);
  };

  // Submission handler
  const handleHarvestSubmit = async (e) => {
    e.preventDefault();
    const isFinal = modalHarvestType === 'Final Harvest';

    if (!formDate) {
      alert('Please select a valid Harvest Date.');
      return;
    }

    const numDoc = parseInt(formDoc, 10);
    if (!numDoc || numDoc <= 0) {
      alert('Please enter a valid Days of Culture (DOC) greater than 0.');
      return;
    }

    const numAbw = parseFloat(formAbw);
    if (!numAbw || numAbw <= 0) {
      alert('Please enter a valid average body weight (ABW) greater than 0.');
      return;
    }

    const numHarvestNumber = parseFloat(formHarvestedNumber);
    if (!isFinal) {
      if (!numHarvestNumber || numHarvestNumber <= 0) {
        alert('Please enter a valid Harvest Number greater than 0.');
        return;
      }
    }

    // Auto-compute biomass if not already set
    let numBiomass = parseFloat(formBiomass);
    if ((!numBiomass || numBiomass <= 0) && numHarvestNumber > 0 && numAbw > 0) {
      numBiomass = parseFloat(((numHarvestNumber * numAbw) / 1000).toFixed(2));
      setFormBiomass(String(numBiomass));
    }

    if (!numBiomass || numBiomass <= 0) {
      alert('Please enter a valid harvested biomass greater than 0 kg.');
      return;
    }

    const numFeed = isFinal ? cumulativeTotalFeed : (parseFloat(formFeed) || 0);

    // For final harvest, show confirmation dialog if not confirmed yet
    if (isFinal && !isFinalConfirmationOpen) {
      setIsFinalConfirmationOpen(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const calculatedCount = numHarvestNumber > 0 
        ? Math.round(numHarvestNumber) 
        : (numBiomass > 0 && numAbw > 0 ? Math.round((numBiomass * 1000) / numAbw) : 0);
      const countPerKg = numAbw > 0 ? Math.round(1000 / numAbw) : 40;
      const calculatedBatchFcr = numBiomass > 0 && numFeed > 0 ? (numFeed / numBiomass).toFixed(2) : '1.18';

      // 1. Submit to Backend API
      const harvestRes = await apiClient.post('/harvests', {
        tankId: activeTank.id,
        farmerId: selectedFarmerId,
        date: formDate,
        harvestedBiomass: numBiomass,
        quantityKg: numBiomass,
        abw: `${numAbw}g`,
        doc: numDoc,
        feedConsumed: numFeed,
        buyerName: formBuyer || (isFinal ? 'Royals Marine Processing Unit 1' : 'Local Harvest Operation'),
        remarks: formRemarks || (isFinal ? 'Final drainage harvest and cycle closure' : 'Partial thinning harvest'),
        harvestType: modalHarvestType,
        isFinal,
        cultureCycleId: currentCycleId,
        harvestedNumber: calculatedCount,
        ...(isFinal ? {
          totalBiomass: cumulativeTotalBiomass,
          totalHarvestedSeed: cumulativeTotalSeed,
          totalFeed: cumulativeTotalFeed,
          fcr: cumulativeFcr,
        } : {})
      });

      const savedHarvest = harvestRes.data?.data || harvestRes.data;

      // 2. Submit test submission record with full cumulative totals in data JSON
      const subId = `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await apiClient.post('/submissions', {
        id: subId,
        farmerId: selectedFarmerId,
        tankId: activeTank.id,
        testType: isFinal ? 'Final Harvest' : 'Harvest',
        recordType: 'HARVEST_ENTRY',
        date: formDate,
        data: {
          ...savedHarvest,
          harvestType: modalHarvestType,
          isFinal,
          abw: numAbw,
          doc: numDoc,
          harvestedBiomass: numBiomass,
          harvestedNumber: calculatedCount,
          feedConsumed: numFeed,
          fcr: isFinal ? cumulativeFcr : calculatedBatchFcr,
          cultureCycleId: currentCycleId,
          buyer: formBuyer,
          remarks: formRemarks,
          ...(isFinal ? {
            totalBiomass: cumulativeTotalBiomass,
            totalHarvestedSeed: cumulativeTotalSeed,
            totalFeed: cumulativeTotalFeed,
            cumulativeFcr,
            survivalPct: cumulativeSurvivalPct,
          } : {})
        },
        status: 'PENDING_VERIFICATION'
      }).catch(err => console.warn('[Harvest] Submission sync warning:', err));

      // 3. Update localStorage
      const newRecord = {
        id: savedHarvest?.id || `HARV_${Date.now()}`,
        harvestType: savedHarvest?.harvestType || modalHarvestType,
        displayTitle: isFinal ? 'Final Harvest' : `Partial Harvest-${partialCount + 1}`,
        isFinal,
        date: formDate,
        doc: Number(formDoc),
        abw: numAbw,
        countPerKg,
        harvestedNumber: calculatedCount,
        harvestedBiomass: numBiomass,
        feedConsumed: numFeed,
        fcr: isFinal ? cumulativeFcr : calculatedBatchFcr,
        remarks: formRemarks,
        buyer: formBuyer,
        cultureCycleId: currentCycleId,
        recordedAt: new Date().toISOString(),
        ...(isFinal ? {
          totalBiomass: cumulativeTotalBiomass,
          totalHarvestedSeed: cumulativeTotalSeed,
          totalFeed: cumulativeTotalFeed,
          cumulativeFcr,
          survivalPct: cumulativeSurvivalPct,
        } : {})
      };

      const updatedHarvests = [...rawHarvests, newRecord];
      const updatedTotalFeed = isFinal ? cumulativeTotalFeed.toString() : (totalFeed + numFeed).toString();

      const updatedStore = {
        ...harvestData,
        [activeTankKey]: {
          ...currentStore,
          harvests: updatedHarvests,
          totalFeed: updatedTotalFeed,
          finalHarvestCompleted: isFinal ? true : (currentStore.finalHarvestCompleted || false)
        }
      };

      setHarvestData(updatedStore);
      localStorage.setItem('agent_harvest_clean_store', JSON.stringify(updatedStore));
      localStorage.setItem('agent_harvest_store', JSON.stringify(updatedStore));
      window.dispatchEvent(new CustomEvent('harvestStoreUpdated', { detail: updatedStore }));
      window.dispatchEvent(new CustomEvent('harvestCreated', { detail: newRecord }));

      // Refresh mock context / DB cache
      if (refreshDb) refreshDb();

      setIsHarvestModalOpen(false);
      setIsFinalConfirmationOpen(false);
      setMessage(isFinal 
        ? 'Final harvest logged successfully! Tank cycle has been closed and testing locked.' 
        : 'Partial harvest recorded successfully! Tank remains active.'
      );
      setTimeout(() => setMessage(''), 4500);
    } catch (err) {
      console.error('[Harvest submit error]', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to record harvest');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Restock tank handler to start a new cycle
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    setIsRestocking(true);
    setErrorMessage('');

    try {
      const res = await apiClient.post(`/tanks/${activeTank.id}/restock`, {
        doc: Number(restockDoc),
        stockingDate: restockDate,
        abw: restockAbw,
        biomass: restockBiomass,
        fcr: restockFcr
      });

      // Clear local completed flag
      const updatedStore = {
        ...harvestData,
        [activeTankKey]: {
          ...currentStore,
          finalHarvestCompleted: false,
          totalFeed: '0',
          stockingDate: restockDate,
          doc: Number(restockDoc)
        }
      };
      setHarvestData(updatedStore);
      localStorage.setItem('agent_harvest_clean_store', JSON.stringify(updatedStore));
      localStorage.setItem('agent_harvest_store', JSON.stringify(updatedStore));
      window.dispatchEvent(new CustomEvent('harvestStoreUpdated', { detail: updatedStore }));

      if (refreshDb) refreshDb();

      setIsRestockModalOpen(false);
      setMessage(`Tank ${activeTank.name} restocked successfully! New cycle has been initiated.`);
      setTimeout(() => setMessage(''), 4500);
    } catch (err) {
      console.error('[Restock error]', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to restock tank');
    } finally {
      setIsRestocking(false);
    }
  };

  const removeHarvestRecord = (recordId) => {
    if (window.confirm('Delete this harvest record?')) {
      const updatedHarvests = rawHarvests.filter(h => h.id !== recordId);
      const updated = {
        ...harvestData,
        [activeTankKey]: {
          ...currentStore,
          harvests: updatedHarvests
        }
      };
      setHarvestData(updated);
      try {
        localStorage.setItem('agent_harvest_clean_store', JSON.stringify(updated));
        localStorage.setItem('agent_harvest_store', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('harvestStoreUpdated', { detail: updated }));
      } catch (e) {
        console.error(e);
      }
      setMessage('Harvest record deleted.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const updateMetaField = (field, val) => {
    const updated = {
      ...harvestData,
      [activeTankKey]: {
        ...currentStore,
        [field]: val
      }
    };
    setHarvestData(updated);
    try {
      localStorage.setItem('agent_harvest_clean_store', JSON.stringify(updated));
      localStorage.setItem('agent_harvest_store', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('harvestStoreUpdated', { detail: updated }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* 1. Header Bar with Back button */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button 
            type="button" 
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(isIncharge ? '/incharge/dashboard' : '/dashboard');
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              color: '#334155',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              marginRight: '6px'
            }}
            title="Go Back"
          >
            <ArrowLeft size={16} strokeWidth={2.4} /> Back
          </button>
          <div style={styles.iconCircle}>
            <Scale size={24} color="#1A2FB8" strokeWidth={2.4} />
          </div>
          <div>
            <h2 style={styles.title}>Harvest Report & Management</h2>
            <span style={styles.subtitle}>
              Current Cycle: <strong>{currentCycleId}</strong> • Tank Status: <strong style={{ color: hasFinalHarvestInCycle ? '#DC2626' : '#16A34A' }}>{hasFinalHarvestInCycle ? 'Harvested / Closed' : 'Active Culture'}</strong>
            </span>
          </div>
        </div>

        {/* Action Button: Single "Add Harvest" button directly opening Harvest Entry Modal OR Restock Tank */}
        <div>
          {!hasFinalHarvestInCycle ? (
            <button 
              type="button" 
              style={styles.addHarvestMainBtn}
              onClick={() => openHarvestModal('Partial Harvest')}
              className="transition-all hover:brightness-105 active:scale-98 cursor-pointer"
              title="Add Harvest Record"
              id="add-harvest-btn"
            >
              <Plus size={17} strokeWidth={2.5} />
              <span>Add Harvest</span>
            </button>
          ) : (
            <button 
              type="button" 
              style={styles.restockBtn}
              onClick={() => setIsRestockModalOpen(true)}
              className="transition-all hover:brightness-105 active:scale-98 cursor-pointer"
              title="Restock this tank and begin a new production cycle"
            >
              <RefreshCw size={16} strokeWidth={2.4} />
              <span>Restock Tank / Start New Cycle</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div style={styles.successBanner}>
          <CheckCircle size={16} />
          <span>{message}</span>
        </div>
      )}

      {errorMessage && (
        <div style={styles.errorBanner}>
          <AlertTriangle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Cycle Closed Warning Banner */}
      {hasFinalHarvestInCycle && (
        <div style={styles.cycleClosedCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.lockIconBox}>
              <Lock size={20} color="#DC2626" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#991B1B' }}>
                Production Cycle Closed ({currentCycleId})
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#B91C1C' }}>
                Final harvest has been completed for this tank. Routine field tests and additional harvests are closed for this cycle.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsRestockModalOpen(true)}
            style={styles.restockSmallBtn}
          >
            <RefreshCw size={14} /> Start New Cycle
          </button>
        </div>
      )}

      {/* 2. Farmer & Tank Selector */}
      <div style={styles.card}>
        {/* In ASM / Incharge mode, show filters: All, My Farmers (assigned to ASM), Farmers (assigned to Agent) */}
        {isInchargeMode && (
          <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} color="#1A2FB8" />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>Farmer Category Filter:</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setAsmFarmerScope('ALL')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    border: asmFarmerScope === 'ALL' ? '1px solid #1A2FB8' : '1px solid #E2E8F0',
                    backgroundColor: asmFarmerScope === 'ALL' ? '#1A2FB8' : '#F8FAFC',
                    color: asmFarmerScope === 'ALL' ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  All Farmers
                </button>
                <button
                  type="button"
                  onClick={() => setAsmFarmerScope('MY_FARMERS')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    border: asmFarmerScope === 'MY_FARMERS' ? '1px solid #10B981' : '1px solid #E2E8F0',
                    backgroundColor: asmFarmerScope === 'MY_FARMERS' ? '#10B981' : '#F8FAFC',
                    color: asmFarmerScope === 'MY_FARMERS' ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Farmers assigned directly to ASM"
                >
                  <span>My Farmers</span>
                  <span style={{ 
                    fontSize: '10px', 
                    padding: '1px 5px', 
                    borderRadius: '10px', 
                    backgroundColor: asmFarmerScope === 'MY_FARMERS' ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                    color: asmFarmerScope === 'MY_FARMERS' ? '#FFFFFF' : '#64748B'
                  }}>ASM</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAsmFarmerScope('AGENT_FARMERS')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    border: asmFarmerScope === 'AGENT_FARMERS' ? '1px solid #6366F1' : '1px solid #E2E8F0',
                    backgroundColor: asmFarmerScope === 'AGENT_FARMERS' ? '#6366F1' : '#F8FAFC',
                    color: asmFarmerScope === 'AGENT_FARMERS' ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Farmers assigned to Field Agents"
                >
                  <span>Farmers</span>
                  <span style={{ 
                    fontSize: '10px', 
                    padding: '1px 5px', 
                    borderRadius: '10px', 
                    backgroundColor: asmFarmerScope === 'AGENT_FARMERS' ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                    color: asmFarmerScope === 'AGENT_FARMERS' ? '#FFFFFF' : '#64748B'
                  }}>Agent</span>
                </button>
              </div>
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B' }}>
              {asmFarmerScope === 'MY_FARMERS' && 'Showing farmers assigned directly to ASM.'}
              {asmFarmerScope === 'AGENT_FARMERS' && 'Showing farmers assigned to Field Agents.'}
              {asmFarmerScope === 'ALL' && 'Showing all farmers under your regional supervision.'}
            </div>
          </div>
        )}

        <div style={styles.selectorGrid}>
          <div>
            <label style={styles.miniLabel}>
              Select Farmer {isInchargeMode && (
                <span style={{ color: '#64748B', fontWeight: '500' }}>
                  ({asmFarmerScope === 'MY_FARMERS' ? 'My Farmers' : asmFarmerScope === 'AGENT_FARMERS' ? 'Agent Farmers' : 'All'})
                </span>
              )}
            </label>
            <select 
              value={selectedFarmerId} 
              onChange={(e) => handleFarmerChange(e.target.value)}
              style={styles.selectInput}
            >
              {farmers.length === 0 ? (
                <option value="" disabled>No farmers found for this filter</option>
              ) : (
                farmers.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.location || 'Chinnamiram'}) {isInchargeMode ? (f.assignedTo === 'Incharge' || !f.agentId ? '• [ASM]' : `• [Agent: ${f.agent || f.agentId || 'Assigned'}]`) : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label style={styles.miniLabel}>Select Tank</label>
            <select 
              value={selectedTankId} 
              onChange={(e) => setSelectedTankId(e.target.value)}
              style={styles.selectInput}
            >
              {currentTanks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.acres || '2.5'} Acres) - {t.cultureCycleId || t.culture_cycle_id || 'CYCLE_1'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Farmer Info Badges */}
        <div style={styles.farmerDetailsGrid}>
          <div style={styles.farmerBadge}>
            <User size={14} color="#1A2FB8" />
            <span><strong>Farmer:</strong> {currentFarmer.name}</span>
          </div>
          <div style={styles.farmerBadge}>
            <MapPin size={14} color="#16A34A" />
            <span><strong>Village:</strong> {currentFarmer.location || 'Chinnamiram'}</span>
          </div>
          <div style={styles.farmerBadge}>
            <Phone size={14} color="#64748B" />
            <span><strong>Phone:</strong> {currentFarmer.phone || '+91 9876543211'}</span>
          </div>
          <div style={{ ...styles.farmerBadge, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}>
            <Scale size={14} color="#1A2FB8" />
            <span><strong>Production Cycle:</strong> {currentCycleId}</span>
          </div>
        </div>
      </div>

      {/* 3. Tank Origin & Stocking Parameters */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Tank Baseline Stocking Specs</h3>
        <div style={styles.specsGrid}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={styles.miniLabel}>Tank Size (Acres)</label>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fixed</span>
            </div>
            <input 
              type="text" 
              value={activeTank?.acres ? `${activeTank.acres} Acres` : (currentStore.tankSize ? `${currentStore.tankSize} Acres` : '2.5 Acres')} 
              readOnly
              disabled
              style={styles.specInputReadOnly}
              title="Tank size is fixed from the pond profile"
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={styles.miniLabel}>Seed Stocked (Nos)</label>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fixed</span>
            </div>
            <input 
              type="text" 
              value={(Number(activeTank?.seedStocked || activeTank?.seedNumber || currentStore.seedNumber || 200000)).toLocaleString()} 
              readOnly
              disabled
              style={styles.specInputReadOnly}
              title="Seed stocked is fixed from stocking records"
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={styles.miniLabel}>Stocking Date</label>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fixed</span>
            </div>
            <input 
              type="text" 
              value={activeTank?.stockingDate || activeTank?.seedDate || currentStore.stockingDate || '2026-06-01'} 
              readOnly
              disabled
              style={styles.specInputReadOnly}
              title="Stocking date is fixed from cycle initialization"
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={styles.miniLabel}>Total Feed Consumed (kg)</label>
              <span style={{ fontSize: '10px', color: '#1A2FB8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Editable</span>
            </div>
            <input 
              type="number" 
              value={currentStore.totalFeed !== undefined && currentStore.totalFeed !== null ? currentStore.totalFeed : '3600'} 
              onChange={(e) => updateMetaField('totalFeed', e.target.value)}
              style={{ ...styles.specInput, borderColor: '#1A2FB8', backgroundColor: '#FFFFFF' }}
              placeholder="Enter feed consumed (kg)"
              title="Total feed consumed across the crop cycle"
            />
          </div>
        </div>
      </div>

      {/* 4. Dynamic Sequence Breakdown Table */}
      <div style={styles.card}>
        <div style={styles.tableHeaderSection}>
          <div>
            <h3 style={styles.sectionTitle}>Sequential Harvest Records ({sequencedHarvests.length})</h3>
            <span style={styles.reportSub}>Sequential display of all harvests logged for this pond</span>
          </div>

          {!hasFinalHarvestInCycle && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                style={styles.recordSubBtn}
                onClick={() => openHarvestModal('Partial Harvest')}
              >
                <Plus size={14} /> Add Partial Harvest
              </button>
              <button 
                type="button" 
                style={{ ...styles.recordSubBtn, backgroundColor: '#FFFBEB', color: '#B45309', borderColor: '#FDE68A' }}
                onClick={() => openHarvestModal('Final Harvest')}
              >
                <CheckCircle size={14} /> Add Final Harvest
              </button>
            </div>
          )}
        </div>

        {sequencedHarvests.length === 0 ? (
          <div style={styles.emptyState}>
            <Scale size={36} color="#94A3B8" />
            <p style={{ margin: '8px 0 0 0', fontWeight: '600', color: '#475569' }}>
              No harvest records saved for {activeTank.name} yet.
            </p>
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>
              Click "Add Harvest" above to record entries.
            </span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '12px' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  <th style={styles.th}>Sequence / Stage</th>
                  <th style={styles.th}>Cycle</th>
                  <th style={styles.th}>Harvest Date</th>
                  <th style={styles.th}>DOC (Days)</th>
                  <th style={styles.th}>ABW (gm)</th>
                  <th style={styles.th}>Harvest Number</th>
                  <th style={styles.th}>Biomass (kg)</th>
                  <th style={styles.th}>Remarks</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sequencedHarvests.map((rec) => (
                  <tr key={rec.id} style={styles.tbodyRow}>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.stageBadge,
                        backgroundColor: rec.isFinal ? '#DCFCE7' : '#EFF6FF',
                        color: rec.isFinal ? '#15803D' : '#1A2FB8',
                        borderColor: rec.isFinal ? '#86EFAC' : '#BFDBFE',
                      }}>
                        {rec.displayTitle}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.cycleBadge}>
                        {rec.cultureCycleId || 'CYCLE_1'}
                      </span>
                    </td>
                    <td style={styles.td}>{rec.date || '-'}</td>
                    <td style={{ ...styles.td, fontWeight: '600' }}>{rec.doc} Days</td>
                    <td style={{ ...styles.td, fontWeight: '600' }}>{rec.abw} g</td>
                    <td style={{ ...styles.td, fontWeight: '700' }}>{parseFloat(rec.harvestedNumber || 0).toLocaleString()}</td>
                    <td style={{ ...styles.td, fontWeight: '700', color: '#1A2FB8' }}>{parseFloat(rec.harvestedBiomass || 0).toLocaleString()} kg</td>
                    <td style={{ ...styles.td, color: '#64748B', maxWidth: '200px' }}>{rec.remarks || 'Standard harvest'}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button 
                        type="button" 
                        style={styles.deleteBtn}
                        onClick={() => removeHarvestRecord(rec.id)}
                        title="Delete Record"
                      >
                        <Trash2 size={15} color="#DC2626" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HARVEST ENTRY FORM MODAL */}
      {isHarvestModalOpen && (
        <div 
          style={styles.cleanModalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsHarvestModalOpen(false);
              setIsFinalConfirmationOpen(false);
            }
          }}
        >
          <div style={styles.cleanModalCard}>
            {/* Modal Header */}
            <div style={styles.cleanModalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BadgeCheck size={24} color="#2563EB" strokeWidth={2.4} />
                </div>
                <div>
                  <h3 style={styles.cleanModalTitle}>Harvest Entry</h3>
                  <span style={styles.cleanModalSubtitle}>
                    {activeTank.name || 'Tank 2'} • Farmer: {currentFarmer.name || 'Bhanu'} • Cycle: {currentCycleId || 'CYCLE_1'}
                  </span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsHarvestModalOpen(false);
                  setIsFinalConfirmationOpen(false);
                }}
                style={styles.cleanCloseBtn}
                className="hover:text-slate-800 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleHarvestSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={styles.cleanModalBody}>
                {/* 1. Harvest Type Selection Cards: 2 Parallel Side-by-Side Cards */}
                <div style={styles.harvestTypeGrid}>
                  {/* Partial Harvest Card */}
                  <div
                    onClick={() => setModalHarvestType('Partial Harvest')}
                    style={{
                      ...styles.typeCardParallel,
                      borderColor: modalHarvestType === 'Partial Harvest' ? '#2563EB' : '#E2E8F0',
                      backgroundColor: modalHarvestType === 'Partial Harvest' ? '#EFF6FF' : '#FFFFFF',
                      boxShadow: modalHarvestType === 'Partial Harvest' ? '0 1px 4px rgba(37, 99, 235, 0.12)' : 'none',
                    }}
                    className="cursor-pointer transition-all hover:border-blue-400"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        ...styles.cleanRadio,
                        borderColor: modalHarvestType === 'Partial Harvest' ? '#2563EB' : '#CBD5E1',
                        backgroundColor: modalHarvestType === 'Partial Harvest' ? '#2563EB' : 'transparent',
                      }}>
                        {modalHarvestType === 'Partial Harvest' && (
                          <div style={styles.cleanRadioDot} />
                        )}
                      </div>
                      <Leaf size={18} color={modalHarvestType === 'Partial Harvest' ? '#2563EB' : '#475569'} strokeWidth={2.2} />
                      <span style={{
                        fontSize: '14.5px',
                        fontWeight: '700',
                        color: modalHarvestType === 'Partial Harvest' ? '#1E40AF' : '#1E293B'
                      }}>
                        Partial Harvest
                      </span>
                    </div>
                    <p style={styles.typeCardDesc}>
                      Record a partial harvest from the current cycle.
                    </p>
                  </div>

                  {/* Final Harvest Card */}
                  <div
                    onClick={() => setModalHarvestType('Final Harvest')}
                    style={{
                      ...styles.typeCardParallel,
                      borderColor: modalHarvestType === 'Final Harvest' ? '#2563EB' : '#E2E8F0',
                      backgroundColor: modalHarvestType === 'Final Harvest' ? '#EFF6FF' : '#FFFFFF',
                      boxShadow: modalHarvestType === 'Final Harvest' ? '0 1px 4px rgba(37, 99, 235, 0.12)' : 'none',
                    }}
                    className="cursor-pointer transition-all hover:border-blue-400"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        ...styles.cleanRadio,
                        borderColor: modalHarvestType === 'Final Harvest' ? '#2563EB' : '#CBD5E1',
                        backgroundColor: modalHarvestType === 'Final Harvest' ? '#2563EB' : 'transparent',
                      }}>
                        {modalHarvestType === 'Final Harvest' && (
                          <div style={styles.cleanRadioDot} />
                        )}
                      </div>
                      <Flag size={18} color={modalHarvestType === 'Final Harvest' ? '#2563EB' : '#334155'} strokeWidth={2.2} />
                      <span style={{
                        fontSize: '14.5px',
                        fontWeight: '700',
                        color: modalHarvestType === 'Final Harvest' ? '#1E40AF' : '#1E293B'
                      }}>
                        Final Harvest
                      </span>
                    </div>
                    <p style={styles.typeCardDesc}>
                      Complete the cycle and close the pond.
                    </p>
                  </div>
                </div>

                {/* Form Fields: Pure Clean White */}
                {/* Harvest Date */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={styles.fieldLabel}>
                    Harvest Date <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input 
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    style={styles.fieldInput}
                    required
                  />
                </div>

                {/* Days of Culture (DOC) */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={styles.fieldLabel}>
                    Days of Culture (DOC) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input 
                    type="number"
                    value={formDoc}
                    onChange={(e) => setFormDoc(e.target.value)}
                    placeholder="e.g. 60"
                    min="1"
                    style={styles.fieldInput}
                    required
                  />
                </div>

                {/* ABW and Harvest Number Row (2-columns) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={styles.fieldLabel}>
                      Average Body Weight (ABW) (g) <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input 
                      type="number"
                      step="0.1"
                      value={formAbw}
                      onChange={(e) => handleAbwChange(e.target.value)}
                      placeholder="e.g. 16.5"
                      min="0.1"
                      style={styles.fieldInput}
                      required
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ ...styles.fieldLabel, marginBottom: 0 }}>
                        {modalHarvestType === 'Final Harvest' ? 'Harvest Number (Final Batch)' : 'Harvest Number'} <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      {modalHarvestType === 'Final Harvest' && (
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#1D4ED8', backgroundColor: '#EFF6FF', padding: '2px 6px', borderRadius: '4px' }}>
                          Total: {cumulativeTotalSeed.toLocaleString()} pcs
                        </span>
                      )}
                    </div>
                    <input 
                      type="number"
                      step="1"
                      value={formHarvestedNumber}
                      onChange={(e) => handleHarvestNumberChange(e.target.value)}
                      placeholder={modalHarvestType === 'Final Harvest' ? "Final batch pieces (e.g. 48000)" : "e.g. 45000"}
                      min="1"
                      style={styles.fieldInput}
                      required={modalHarvestType === 'Partial Harvest'}
                    />
                    {modalHarvestType === 'Final Harvest' && (
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '3px' }}>
                        Prev partials ({prevPartialHarvestNumber.toLocaleString()}) + final ({currentFinalNumber.toLocaleString()}) = <strong>{cumulativeTotalSeed.toLocaleString()} pcs</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Harvested Biomass Row (Auto-calculated: Harvest Number * ABW) */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ ...styles.fieldLabel, marginBottom: 0 }}>
                      {modalHarvestType === 'Final Harvest' ? 'Harvested Biomass (Final Batch) (kg)' : 'Harvested Biomass (kg)'} <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <span style={{
                      fontSize: '11px',
                      color: '#2563EB',
                      backgroundColor: '#EFF6FF',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Sparkles size={11} color="#2563EB" />
                      Auto: (Harvest Number × ABW) ÷ 1,000
                    </span>
                  </div>
                  <input 
                    type="number"
                    step="0.01"
                    value={formBiomass}
                    onChange={(e) => setFormBiomass(e.target.value)}
                    placeholder="Calculated automatically from Harvest Number & ABW"
                    min="0.01"
                    style={{
                      ...styles.fieldInput,
                      backgroundColor: '#F8FAFC',
                      fontWeight: '600',
                      color: '#1E40AF'
                    }}
                    required
                  />
                  {modalHarvestType === 'Final Harvest' && (
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '3px' }}>
                      Prev biomass ({Number(prevPartialBiomass.toFixed(2)).toLocaleString()} kg) + final ({Number(currentFinalBiomass.toFixed(2)).toLocaleString()} kg) = <strong>{Number(cumulativeTotalBiomass.toFixed(2)).toLocaleString()} kg</strong>
                    </span>
                  )}
                </div>

                {/* Buyer / Processing Plant (Text box for both Partial and Final Harvest) */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={styles.fieldLabel}>Buyer / Processing Plant</label>
                  <input 
                    type="text"
                    value={formBuyer}
                    onChange={(e) => setFormBuyer(e.target.value)}
                    placeholder="Enter buyer or processing plant name..."
                    style={styles.fieldInput}
                  />
                </div>

                {/* Cycle Cumulative Summary Box for Final Harvest */}
                {modalHarvestType === 'Final Harvest' && (
                  <div style={styles.cumulativeSummaryCard}>
                    <div style={styles.cumulativeHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={16} color="#1D4ED8" strokeWidth={2.4} />
                        <span style={styles.cumulativeTitle}>Cycle Cumulative Summary (Final Harvest)</span>
                      </div>
                      <span style={styles.cumulativeBadge}>
                        {previousPartialHarvests.length} Partial{previousPartialHarvests.length === 1 ? '' : 's'} + Final • {currentCycleId}
                      </span>
                    </div>

                    <div style={styles.cumulativeGrid}>
                      {/* 1. Total Harvested Seed */}
                      <div style={styles.cumKpiItem}>
                        <span style={styles.cumKpiLabel}>Total Harvested Seed</span>
                        <div style={styles.cumKpiValue}>
                          {cumulativeTotalSeed.toLocaleString()} <span style={styles.cumKpiUnit}>pcs</span>
                        </div>
                        <div style={styles.cumKpiHelper}>
                          {prevPartialHarvestNumber.toLocaleString()} prev + {currentFinalNumber.toLocaleString()} final
                        </div>
                      </div>

                      {/* 2. Total Biomass (kg) */}
                      <div style={styles.cumKpiItem}>
                        <span style={styles.cumKpiLabel}>Total Biomass</span>
                        <div style={{ ...styles.cumKpiValue, color: '#1D4ED8' }}>
                          {Number(cumulativeTotalBiomass.toFixed(2)).toLocaleString()} <span style={styles.cumKpiUnit}>kg</span>
                        </div>
                        <div style={styles.cumKpiHelper}>
                          {Number(prevPartialBiomass.toFixed(2)).toLocaleString()} kg prev + {Number(currentFinalBiomass.toFixed(2)).toLocaleString()} kg final
                        </div>
                      </div>

                      {/* 3. Total Feed (kg) */}
                      <div style={styles.cumKpiItem}>
                        <span style={styles.cumKpiLabel}>Total Feed</span>
                        <div style={{ ...styles.cumKpiValue, color: '#D97706' }}>
                          {Number(cumulativeTotalFeed.toFixed(2)).toLocaleString()} <span style={styles.cumKpiUnit}>kg</span>
                        </div>
                        <div style={styles.cumKpiHelper}>
                          Cycle cumulative feed
                        </div>
                      </div>

                      {/* 4. FCR */}
                      <div style={styles.cumKpiItem}>
                        <span style={styles.cumKpiLabel}>Calculated FCR</span>
                        <div style={{ ...styles.cumKpiValue, color: '#059669' }}>
                          {cumulativeFcr}
                        </div>
                        <div style={styles.cumKpiHelper}>
                          Total Feed ÷ Total Biomass
                        </div>
                      </div>

                      {/* 5. Survival % */}
                      <div style={{ ...styles.cumKpiItem, gridColumn: 'span 2' }}>
                        <span style={styles.cumKpiLabel}>Survival Rate</span>
                        <div style={{ ...styles.cumKpiValue, color: '#7C3AED' }}>
                          {cumulativeSurvivalPct}%
                        </div>
                        <div style={styles.cumKpiHelper}>
                          Stocked: {seedStocked.toLocaleString()} seeds • Harvested: {cumulativeTotalSeed.toLocaleString()} shrimp
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Weighment Notes / Remarks */}
                <div style={{ marginBottom: '6px' }}>
                  <label style={styles.fieldLabel}>Weighment Notes / Remarks</label>
                  <textarea 
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    placeholder="Enter notes or remarks..."
                    rows={3}
                    style={{
                      ...styles.fieldInput,
                      resize: 'vertical',
                      minHeight: '72px',
                      lineHeight: '1.4'
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={styles.cleanFooter}>
                <button 
                  type="button"
                  onClick={() => {
                    setIsHarvestModalOpen(false);
                    setIsFinalConfirmationOpen(false);
                  }}
                  style={styles.cleanFooterCancelBtn}
                  className="transition-all hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={styles.cleanFooterSubmitBtn}
                  className="transition-all hover:brightness-105 active:scale-98 cursor-pointer"
                >
                  {isSubmitting 
                    ? 'Saving...' 
                    : modalHarvestType === 'Final Harvest' 
                      ? 'Save Final Harvest' 
                      : 'Save Partial Harvest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FINAL HARVEST CONFIRMATION DIALOG */}
      {isFinalConfirmationOpen && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: '480px' }}>
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <div style={styles.confirmIconCircle}>
                <AlertTriangle size={32} color="#DC2626" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: '14px 0 6px 0' }}>
                Confirm Final Harvest Submission?
              </h3>
              <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.5', margin: 0 }}>
                You are about to record the <strong>Final Harvest</strong> for <strong>{activeTank.name}</strong> ({currentCycleId}).
              </p>
              
              <div style={{
                margin: '16px 0',
                padding: '12px 14px',
                backgroundColor: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#1E3A8A', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Cycle Final Summary Preview
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12.5px' }}>
                  <div>Total Seed: <strong>{cumulativeTotalSeed.toLocaleString()} pcs</strong></div>
                  <div>Total Biomass: <strong>{Number(cumulativeTotalBiomass.toFixed(2)).toLocaleString()} kg</strong></div>
                  <div>Total Feed: <strong>{Number(cumulativeTotalFeed.toFixed(2)).toLocaleString()} kg</strong></div>
                  <div>Final FCR: <strong>{cumulativeFcr}</strong></div>
                  <div style={{ gridColumn: 'span 2' }}>Final Survival: <strong>{cumulativeSurvivalPct}%</strong></div>
                </div>
              </div>

              <div style={styles.confirmCallout}>
                <ul style={{ margin: 0, paddingLeft: '18px', textAlign: 'left', fontSize: '12.5px', color: '#991B1B', lineHeight: '1.6' }}>
                  <li>All routine testing will be locked for this cycle.</li>
                  <li>No further harvests can be logged for this cycle.</li>
                  <li>Tank status will become <strong>Harvested (Cycle Closed)</strong>.</li>
                  <li>Previous partial harvest records will remain fully preserved.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsFinalConfirmationOpen(false)}
                  style={styles.cancelBtn}
                >
                  Go Back & Review
                </button>
                <button 
                  type="button" 
                  onClick={handleHarvestSubmit}
                  disabled={isSubmitting}
                  style={styles.confirmFinalBtn}
                >
                  <Check size={16} />
                  <span>{isSubmitting ? 'Finalizing...' : 'Yes, Confirm Final Harvest'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESTOCK TANK MODAL */}
      {isRestockModalOpen && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: '520px' }}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Restock Tank & Start New Cycle</h3>
                <span style={styles.modalSubtitle}>
                  {activeTank.name} • Restocking will advance from {currentCycleId} to next cycle
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                style={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={styles.modalBody}>
                <div style={{
                  ...styles.typeBanner,
                  backgroundColor: '#EFF6FF',
                  borderColor: '#BFDBFE',
                  color: '#1E40AF',
                }}>
                  <RefreshCw size={16} color="#1A2FB8" />
                  <span>Restocking resets tank status to <strong>ACTIVE</strong> and re-enables routine testing and harvests under a linked new cycle. Previous harvest histories are preserved!</span>
                </div>

                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Stocking Date</label>
                    <input 
                      type="date"
                      value={restockDate}
                      onChange={(e) => setRestockDate(e.target.value)}
                      style={styles.formInput}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Initial DOC</label>
                    <input 
                      type="number"
                      value={restockDoc}
                      onChange={(e) => setRestockDoc(e.target.value)}
                      min="1"
                      style={styles.formInput}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Initial ABW</label>
                    <input 
                      type="text"
                      value={restockAbw}
                      onChange={(e) => setRestockAbw(e.target.value)}
                      placeholder="e.g. 0.5g"
                      style={styles.formInput}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Initial Biomass</label>
                    <input 
                      type="text"
                      value={restockBiomass}
                      onChange={(e) => setRestockBiomass(e.target.value)}
                      placeholder="e.g. 0 kg"
                      style={styles.formInput}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button 
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isRestocking}
                  style={{ ...styles.submitBtn, backgroundColor: '#1A2FB8' }}
                >
                  <RefreshCw size={16} />
                  <span>{isRestocking ? 'Restocking...' : 'Restock Tank & Start Cycle'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  headerLeft: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px' 
  },
  iconCircle: { 
    width: '44px', 
    height: '44px', 
    borderRadius: '12px', 
    backgroundColor: '#F0F4FF', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  title: { 
    fontSize: '20px', 
    fontWeight: '700', 
    color: '#0F172A', 
    margin: '0 0 2px 0',
    letterSpacing: '-0.2px'
  },
  subtitle: { 
    fontSize: '13px', 
    color: '#64748B' 
  },
  addHarvestMainBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 18px',
    fontSize: '13.5px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(26, 47, 184, 0.25)',
  },
  cleanModalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(241, 245, 249, 0.78)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 99999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '24px 16px',
    overflowY: 'auto',
    boxSizing: 'border-box'
  },
  cleanModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '94vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(15, 23, 42, 0.06)',
    border: '1px solid #E2E8F0'
  },
  cleanModalHeader: {
    padding: '16px 24px 12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF'
  },
  cleanModalIconBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  cleanModalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: '-0.2px'
  },
  cleanModalSubtitle: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
    display: 'block'
  },
  cleanCloseBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#94A3B8',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px'
  },
  cleanModalBody: {
    padding: '4px 24px 18px 24px',
    overflowY: 'auto',
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  harvestTypeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '14px'
  },
  typeCardParallel: {
    padding: '14px 14px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    userSelect: 'none'
  },
  cleanRadio: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: '1.5px solid #CBD5E1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  cleanRadioDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#FFFFFF'
  },
  typeCardDesc: {
    margin: '4px 0 0 28px',
    fontSize: '11.5px',
    color: '#64748B',
    lineHeight: '1.4'
  },
  fieldLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1E293B',
    display: 'block',
    marginBottom: '6px'
  },
  fieldInput: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '13.5px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease'
  },
  cleanFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #F1F5F9',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#FFFFFF'
  },
  cleanFooterCancelBtn: {
    padding: '8px 20px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    fontSize: '13.5px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  cleanFooterSubmitBtn: {
    padding: '8px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#1D4ED8',
    color: '#FFFFFF',
    fontSize: '13.5px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(29, 78, 216, 0.3)'
  },
  radioInnerDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
  },
  partialHarvestBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 18px',
    fontSize: '13.5px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(26, 47, 184, 0.25)',
  },
  finalHarvestBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#EA580C',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 18px',
    fontSize: '13.5px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
  },
  restockBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#0F766E',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 18px',
    fontSize: '13.5px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(15, 118, 110, 0.25)',
  },
  successBanner: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    padding: '12px 16px', 
    backgroundColor: '#DCFCE7', 
    color: '#15803D', 
    borderRadius: '10px', 
    border: '1px solid #86EFAC', 
    marginBottom: '16px', 
    fontSize: '13.5px', 
    fontWeight: '600' 
  },
  errorBanner: {
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    padding: '12px 16px', 
    backgroundColor: '#FEE2E2', 
    color: '#991B1B', 
    borderRadius: '10px', 
    border: '1px solid #FCA5A5', 
    marginBottom: '16px', 
    fontSize: '13.5px', 
    fontWeight: '600' 
  },
  cycleClosedCard: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '12px',
    padding: '14px 18px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  },
  lockIconBox: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#FEE2E2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  restockSmallBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#991B1B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: '14px', 
    padding: 'clamp(14px, 3.5vw, 24px)', 
    border: '1px solid #E2E8F0', 
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    marginBottom: '16px',
    boxSizing: 'border-box',
    width: '100%',
  },
  selectorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
    gap: '12px',
    marginBottom: '14px'
  },
  miniLabel: { 
    fontSize: '11.5px', 
    fontWeight: '600', 
    color: '#475569', 
    marginBottom: '5px', 
    display: 'block' 
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
    fontWeight: '600',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
  farmerDetailsGrid: { 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: '8px', 
    paddingTop: '12px', 
    borderTop: '1px solid #F1F5F9' 
  },
  farmerBadge: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px', 
    fontSize: '12.5px', 
    color: '#334155', 
    backgroundColor: '#F8FAFC', 
    border: '1px solid #E2E8F0',
    padding: '6px 10px', 
    borderRadius: '8px' 
  },
  sectionTitle: { 
    fontSize: 'clamp(14.5px, 2.8vw, 16px)', 
    fontWeight: '700', 
    color: '#0F172A', 
    margin: 0,
    letterSpacing: '-0.1px'
  },
  specsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
    gap: '12px',
    marginTop: '12px'
  },
  specInput: {
    width: '100%',
    height: '40px',
    padding: '0 12px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '13.5px',
    color: '#0F172A',
    fontWeight: '600',
    outline: 'none',
    boxSizing: 'border-box'
  },
  specInputReadOnly: {
    width: '100%',
    height: '40px',
    padding: '0 12px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F1F5F9',
    fontSize: '13.5px',
    color: '#475569',
    fontWeight: '600',
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'not-allowed'
  },
  reportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '14px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  reportSub: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
    display: 'block'
  },
  autoCalcTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#1A2FB8',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    padding: '4px 10px',
    borderRadius: '20px'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 135px), 1fr))',
    gap: '10px'
  },
  kpiBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '12px 14px',
    boxSizing: 'border-box',
  },
  kpiLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    display: 'block'
  },
  kpiVal: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0F172A',
    margin: '4px 0 2px 0'
  },
  kpiFoot: {
    fontSize: '11px',
    color: '#94A3B8'
  },
  tableHeaderSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  recordSubBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #BFDBFE',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  emptyState: {
    textAlign: 'center',
    padding: '32px 16px',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px dashed #CBD5E1',
    marginTop: '12px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  theadRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0'
  },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '700',
    color: '#475569',
    whiteSpace: 'nowrap'
  },
  tbodyRow: {
    borderBottom: '1px solid #F1F5F9'
  },
  td: {
    padding: '12px',
    color: '#1E293B',
    verticalAlign: 'middle'
  },
  stageBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid transparent',
    fontSize: '12px',
    fontWeight: '700'
  },
  cycleBadge: {
    display: 'inline-block',
    padding: '3px 7px',
    borderRadius: '4px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    fontSize: '11px',
    fontWeight: '700'
  },
  deleteBtn: {
    background: '#FEE2E2',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    padding: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(241, 245, 249, 0.78)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 99999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px',
    boxSizing: 'border-box'
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '620px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    border: '1px solid #E2E8F0'
  },
  modalHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #F1F5F9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: '800',
    color: '#0F172A'
  },
  modalSubtitle: {
    fontSize: '12.5px',
    color: '#64748B',
    marginTop: '2px',
    display: 'block'
  },
  closeBtn: {
    background: '#F1F5F9',
    border: 'none',
    borderRadius: '8px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748B'
  },
  modalBody: {
    padding: '18px 20px',
    overflowY: 'auto',
    flex: 1
  },
  typeBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid transparent',
    fontSize: '12.5px',
    lineHeight: '1.45',
    marginBottom: '16px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155'
  },
  formInput: {
    height: '40px',
    padding: '0 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '13.5px',
    fontWeight: '600',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box'
  },
  formHelper: {
    fontSize: '11.5px',
    color: '#64748B',
    marginTop: '2px'
  },
  formTextarea: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  modalFooter: {
    padding: '14px 20px',
    borderTop: '1px solid #F1F5F9',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px'
  },
  cancelBtn: {
    padding: '9px 16px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    fontSize: '13.5px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '9px 18px',
    borderRadius: '8px',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '13.5px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer'
  },
  confirmIconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#FEE2E2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto'
  },
  confirmCallout: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '12px 14px',
    marginTop: '14px'
  },
  confirmFinalBtn: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    fontSize: '13.5px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer'
  },
  cumulativeSummaryCard: {
    backgroundColor: '#F8FAFC',
    border: '1.5px solid #DBEAFE',
    borderRadius: '12px',
    padding: '14px 16px',
    marginBottom: '16px'
  },
  cumulativeHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
    paddingBottom: '8px',
    borderBottom: '1px solid #E2E8F0'
  },
  cumulativeTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1E3A8A',
    letterSpacing: '-0.1px'
  },
  cumulativeBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#1D4ED8',
    backgroundColor: '#EFF6FF',
    padding: '2px 8px',
    borderRadius: '10px',
    border: '1px solid #BFDBFE'
  },
  cumulativeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  cumKpiItem: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
  },
  cumKpiLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  cumKpiValue: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: '1.2'
  },
  cumKpiUnit: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B'
  },
  cumKpiHelper: {
    fontSize: '10.5px',
    color: '#64748B',
    lineHeight: '1.3',
    marginTop: '2px'
  }
};

export default Harvest;
