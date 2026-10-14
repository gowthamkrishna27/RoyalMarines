import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Scale, User, Phone, MapPin, CheckCircle, Plus, 
  Trash2, Info, FileSpreadsheet, Calendar, Sparkles,
  AlertTriangle, Lock, RefreshCw, X, ArrowRight, Check, Users
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
  const [formDoc, setFormDoc] = useState(77);
  const [formAbw, setFormAbw] = useState(24.5);
  const [formBiomass, setFormBiomass] = useState('');
  const [formFeed, setFormFeed] = useState('');
  const [formBuyer, setFormBuyer] = useState('Royals Marine Processing Unit 1');
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
          harvestedBiomass: h.quantityKg || h.quantity_kg || 0,
          harvestedNumber: h.harvestedNumber || (h.countPerKg && h.quantityKg ? h.countPerKg * h.quantityKg : 0),
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

  // Open harvest modal with specific type
  const openHarvestModal = (type) => {
    if (hasFinalHarvestInCycle) {
      setErrorMessage('A final harvest has already concluded this tank cycle. Please restock the tank to start a new cycle.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    setModalHarvestType(type);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDoc(activeTank?.doc || 77);
    setFormAbw(activeTank?.abw ? parseFloat(activeTank.abw) : 24.5);
    setFormBiomass('');
    setFormFeed('');
    setFormBuyer('Royals Marine Processing Unit 1');
    setFormRemarks('');
    setIsHarvestModalOpen(true);
  };

  // Submission handler
  const handleHarvestSubmit = async (e) => {
    e.preventDefault();
    const numBiomass = parseFloat(formBiomass);
    const numAbw = parseFloat(formAbw);
    const numFeed = parseFloat(formFeed) || 0;

    if (!numBiomass || numBiomass <= 0) {
      alert('Please enter a valid harvested biomass greater than 0 kg.');
      return;
    }
    if (!numAbw || numAbw <= 0) {
      alert('Please enter a valid average body weight (ABW) greater than 0.');
      return;
    }

    // For final harvest, show confirmation dialog if not confirmed yet
    if (modalHarvestType === 'Final Harvest' && !isFinalConfirmationOpen) {
      setIsFinalConfirmationOpen(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const isFinal = modalHarvestType === 'Final Harvest';
      const calculatedCount = numBiomass > 0 && numAbw > 0 ? Math.round((numBiomass * 1000) / numAbw) : 0;
      const countPerKg = numAbw > 0 ? Math.round(1000 / numAbw) : 40;
      const calculatedBatchFcr = numBiomass > 0 && numFeed > 0 ? (numFeed / numBiomass).toFixed(2) : '1.18';

      // 1. Submit to Backend API
      const harvestRes = await apiClient.post('/harvests', {
        tankId: activeTank.id,
        farmerId: selectedFarmerId,
        date: formDate,
        quantityKg: numBiomass,
        countPerKg,
        abw: `${numAbw}g`,
        doc: Number(formDoc),
        feedConsumed: numFeed,
        quality: 'Grade A',
        pricePerKg: 380,
        revenue: numBiomass * 380,
        buyerName: formBuyer || 'Royals Marine Processing Unit 1',
        remarks: formRemarks || (isFinal ? 'Final drainage harvest and cycle closure' : 'Partial thinning harvest'),
        harvestType: modalHarvestType,
        isFinal,
        cultureCycleId: currentCycleId
      });

      const savedHarvest = harvestRes.data?.data || harvestRes.data;

      // 2. Submit test submission record
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
          doc: formDoc,
          harvestedBiomass: numBiomass,
          harvestedNumber: calculatedCount,
          feedConsumed: numFeed,
          fcr: calculatedBatchFcr,
          cultureCycleId: currentCycleId
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
        fcr: calculatedBatchFcr,
        remarks: formRemarks,
        buyer: formBuyer,
        cultureCycleId: currentCycleId,
        recordedAt: new Date().toISOString()
      };

      const updatedHarvests = [...rawHarvests, newRecord];
      const updatedTotalFeed = (totalFeed + numFeed).toString();

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
      {/* 1. Header Bar with TWO explicit buttons */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
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

        {/* Action Buttons: Partial Harvest & Final Harvest OR Restock Tank */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {!hasFinalHarvestInCycle ? (
            <>
              {/* Button 1: Partial Harvest */}
              <button 
                type="button" 
                style={styles.partialHarvestBtn}
                onClick={() => openHarvestModal('Partial Harvest')}
                className="transition-all hover:brightness-105 active:scale-98 cursor-pointer"
                title="Record Partial / Intermediate Harvest"
              >
                <Scale size={16} strokeWidth={2.4} />
                <span>Partial Harvest</span>
              </button>

              {/* Button 2: Final Harvest */}
              <button 
                type="button" 
                style={styles.finalHarvestBtn}
                onClick={() => openHarvestModal('Final Harvest')}
                className="transition-all hover:brightness-105 active:scale-98 cursor-pointer"
                title="Record Final Pond Drainage & Conclude Cycle"
              >
                <CheckCircle size={16} strokeWidth={2.4} />
                <span>Final Harvest</span>
              </button>
            </>
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
            <label style={styles.miniLabel}>Tank Size (Acres)</label>
            <input 
              type="text" 
              value={currentStore.tankSize || activeTank.acres || '2.5'} 
              onChange={(e) => updateMetaField('tankSize', e.target.value)}
              style={styles.specInput}
            />
          </div>
          <div>
            <label style={styles.miniLabel}>Seed Stocked (Nos)</label>
            <input 
              type="number" 
              value={currentStore.seedNumber || '200000'} 
              onChange={(e) => updateMetaField('seedNumber', e.target.value)}
              style={styles.specInput}
            />
          </div>
          <div>
            <label style={styles.miniLabel}>Stocking Date</label>
            <input 
              type="date" 
              value={currentStore.stockingDate || '2026-06-01'} 
              onChange={(e) => updateMetaField('stockingDate', e.target.value)}
              style={styles.specInput}
            />
          </div>
          <div>
            <label style={styles.miniLabel}>Total Feed Consumed (kg)</label>
            <input 
              type="number" 
              value={currentStore.totalFeed || '3600'} 
              onChange={(e) => updateMetaField('totalFeed', e.target.value)}
              style={styles.specInput}
            />
          </div>
        </div>
      </div>

      {/* 4. Automated Harvest Performance Report (KPIs) */}
      <div style={{ ...styles.card, borderLeft: '4px solid #1A2FB8' }}>
        <div style={styles.reportHeader}>
          <div>
            <h3 style={styles.sectionTitle}>Automated Harvest Performance Summary ({currentCycleId})</h3>
            <span style={styles.reportSub}>Consolidated biomass and survival metrics for {activeTank.name}</span>
          </div>
          <span style={styles.autoCalcTag}>
            <Sparkles size={13} /> Auto-Computed
          </span>
        </div>

        <div style={styles.kpiGrid}>
          <div style={styles.kpiBox}>
            <span style={styles.kpiLabel}>Total Harvested Seed</span>
            <div style={styles.kpiVal}>{totalHarvestedSeed.toLocaleString()}</div>
            <span style={styles.kpiFoot}>Nos across all stages</span>
          </div>

          <div style={styles.kpiBox}>
            <span style={styles.kpiLabel}>Total Harvested Biomass</span>
            <div style={{ ...styles.kpiVal, color: '#1A2FB8' }}>{totalHarvestedBiomass.toLocaleString()} kg</div>
            <span style={styles.kpiFoot}>Aggregate crop yield</span>
          </div>

          <div style={styles.kpiBox}>
            <span style={styles.kpiLabel}>Survival Rate</span>
            <div style={{ ...styles.kpiVal, color: '#16A34A' }}>{survivalPct}%</div>
            <span style={styles.kpiFoot}>(Harvested ÷ Stocked) × 100</span>
          </div>

          <div style={styles.kpiBox}>
            <span style={styles.kpiLabel}>Calculated FCR</span>
            <div style={{ ...styles.kpiVal, color: '#D97706' }}>{fcr}</div>
            <span style={styles.kpiFoot}>Total Feed ÷ Biomass</span>
          </div>
        </div>
      </div>

      {/* 5. Dynamic Sequence Breakdown Table */}
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
              Click "Partial Harvest" or "Final Harvest" above to record entries.
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
                  <th style={styles.th}>Harvested Seed</th>
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
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>
                  {modalHarvestType === 'Final Harvest' ? 'Final Harvest Entry' : 'Partial Harvest Entry'}
                </h3>
                <span style={styles.modalSubtitle}>
                  {activeTank.name} • Farmer: {currentFarmer.name} • Cycle: {currentCycleId}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsHarvestModalOpen(false);
                  setIsFinalConfirmationOpen(false);
                }}
                style={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleHarvestSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={styles.modalBody}>
                {/* Type Notification Pill */}
                <div style={{
                  ...styles.typeBanner,
                  backgroundColor: modalHarvestType === 'Final Harvest' ? '#FEF3C7' : '#EFF6FF',
                  borderColor: modalHarvestType === 'Final Harvest' ? '#FCD34D' : '#BFDBFE',
                  color: modalHarvestType === 'Final Harvest' ? '#92400E' : '#1E40AF',
                }}>
                  {modalHarvestType === 'Final Harvest' ? (
                    <>
                      <AlertTriangle size={16} color="#B45309" />
                      <span><strong>Notice:</strong> Submitting a Final Harvest will conclude cycle <strong>{currentCycleId}</strong>, close all routine tests, and permanently close harvest submissions for this cycle.</span>
                    </>
                  ) : (
                    <>
                      <Info size={16} color="#1A2FB8" />
                      <span><strong>Notice:</strong> This partial harvest will be recorded as a new sequential entry without overwriting previous harvests. The tank remains <strong>Active</strong>.</span>
                    </>
                  )}
                </div>

                {/* Form Fields Grid */}
                <div style={styles.formGrid}>
                  {/* Harvest Date */}
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Harvest Date <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input 
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      style={styles.formInput}
                      required
                    />
                  </div>

                  {/* DOC */}
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Days of Culture (DOC) <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input 
                      type="number"
                      value={formDoc}
                      onChange={(e) => setFormDoc(e.target.value)}
                      placeholder="e.g. 77"
                      min="1"
                      style={styles.formInput}
                      required
                    />
                  </div>

                  {/* ABW */}
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Average Body Weight (ABW in g) <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input 
                      type="number"
                      step="0.1"
                      value={formAbw}
                      onChange={(e) => setFormAbw(e.target.value)}
                      placeholder="e.g. 24.5"
                      min="0.1"
                      style={styles.formInput}
                      required
                    />
                    {parseFloat(formAbw) > 0 && (
                      <span style={styles.formHelper}>
                        ~{Math.round(1000 / parseFloat(formAbw))} Count / kg
                      </span>
                    )}
                  </div>

                  {/* Biomass */}
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Harvested Biomass (kg) <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input 
                      type="number"
                      step="1"
                      value={formBiomass}
                      onChange={(e) => setFormBiomass(e.target.value)}
                      placeholder="e.g. 1250"
                      min="1"
                      style={styles.formInput}
                      required
                    />
                    {parseFloat(formBiomass) > 0 && parseFloat(formAbw) > 0 && (
                      <span style={styles.formHelper}>
                        ≈ {Math.round((parseFloat(formBiomass) * 1000) / parseFloat(formAbw)).toLocaleString()} shrimp pieces
                      </span>
                    )}
                  </div>

                  {/* Feed Consumed */}
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Feed Consumed for Batch (kg)</label>
                    <input 
                      type="number"
                      step="1"
                      value={formFeed}
                      onChange={(e) => setFormFeed(e.target.value)}
                      placeholder="e.g. 1450"
                      style={styles.formInput}
                    />
                  </div>

                  {/* Buyer */}
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Buyer / Processing Plant</label>
                    <input 
                      type="text"
                      value={formBuyer}
                      onChange={(e) => setFormBuyer(e.target.value)}
                      placeholder="e.g. Royals Marine Processing Unit 1"
                      style={styles.formInput}
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div style={{ ...styles.formGroup, marginTop: '12px' }}>
                  <label style={styles.formLabel}>Weighment Notes / Remarks</label>
                  <textarea 
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    placeholder="Enter notes on shrimp quality, count sampling, net weighment, etc."
                    rows={2}
                    style={styles.formTextarea}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={styles.modalFooter}>
                <button 
                  type="button"
                  onClick={() => {
                    setIsHarvestModalOpen(false);
                    setIsFinalConfirmationOpen(false);
                  }}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    ...styles.submitBtn,
                    backgroundColor: modalHarvestType === 'Final Harvest' ? '#EA580C' : '#1A2FB8',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  <Scale size={16} />
                  <span>
                    {isSubmitting ? 'Saving...' : `Save ${modalHarvestType} Record`}
                  </span>
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
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    backdropFilter: 'blur(4px)',
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
  }
};

export default Harvest;
