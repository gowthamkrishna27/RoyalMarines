import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Plus, Phone, MapPin, User, CheckCircle2,
  Scale, Wheat, Fish, Activity, TrendingUp, Droplets,
  Skull, Pill, ClipboardList, Camera, Clock, Lock,
  X, Info, Sparkles, FileText, ChevronRight, Layers, ShieldCheck, Bug,
  Send, AlertTriangle, MessageSquare
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import QuickRecordModal from '../components/QuickRecordModal';
import HarvestCompletedModal from '../../asm/components/HarvestCompletedModal';
import TakeHarvestModal from '../../asm/components/TakeHarvestModal';
import { getTankWeeklySchedule } from '../utils/testScheduleHelper';
import { getSession } from '../utils/agentAuth';
import { getInchargeSession } from '../../asm/utils/inchargeAuth';
import adminService from '../../admin/utils/adminService';

// Standard baseline harvest records for clean state
const defaultTankHarvests = [];

const TABS = [
  { id: 'OVERVIEW', label: 'Overview', icon: Layers },
  { id: 'WATER', label: 'Water', icon: Droplets },
  { id: 'FEED', label: 'Feed', icon: Wheat },
  { id: 'DISEASE', label: 'Disease', icon: Bug },
  { id: 'BIOMASS', label: 'Biomass', icon: Fish },
  { id: 'MEDICATION', label: 'Medication', icon: Pill },
  { id: 'MORTALITY', label: 'Mortality', icon: Skull },
  { id: 'ACTIVITY', label: 'Activity', icon: ClipboardList },
  { id: 'HARVEST', label: 'Harvest', icon: Scale },
  { id: 'REPORTS', label: 'Reports', icon: FileText },
];

const TankDetails = () => {
  const { tankId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isIncharge = location.pathname.startsWith('/incharge') || location.pathname.startsWith('/asm');
  const { getTankById, getFarmerById, db, editTank } = useMockData();
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);
  const [isTakeHarvestModalOpen, setIsTakeHarvestModalOpen] = useState(false);
  const [isHarvestTypeChoiceOpen, setIsHarvestTypeChoiceOpen] = useState(false);
  const [selectedHarvestType, setSelectedHarvestType] = useState('Partial Harvest');
  const [modalInitialType, setModalInitialType] = useState('WATER_QUALITY');
  const [selectedReadRecord, setSelectedReadRecord] = useState(null);
  const [harvestStore, setHarvestStore] = useState(() => {
    try {
      const saved = localStorage.getItem('agent_harvest_store');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [tankCompliance, setTankCompliance] = useState(null);
  const [tankFollowups, setTankFollowups] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState('');
  const [replyError, setReplyError] = useState('');

  const loadTankCompliance = async () => {
    if (!tankId) return;
    try {
      const res = await adminService.getComplianceDueList({ tankId });
      if (res?.allTanks && res.allTanks.length > 0) {
        setTankCompliance(res.allTanks[0]);
      }
      const history = await adminService.getFollowupHistory(tankId);
      setTankFollowups(history || []);
    } catch (e) {
      console.warn('[TankDetails] Error fetching compliance:', e);
    }
  };

  useEffect(() => {
    loadTankCompliance();
    const handleRefresh = () => loadTankCompliance();
    window.addEventListener('complianceFollowupCreated', handleRefresh);
    window.addEventListener('submissionCreated', handleRefresh);
    return () => {
      window.removeEventListener('complianceFollowupCreated', handleRefresh);
      window.removeEventListener('submissionCreated', handleRefresh);
    };
  }, [tankId]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    const trimmed = (replyText || '').trim();
    if (!trimmed) {
      setReplyError('Please write a reply before submitting.');
      return;
    }
    setIsSubmittingReply(true);
    setReplyError('');
    setReplySuccess('');
    try {
      const currentSenderId = inchargeSession?.inchargeId || inchargeSession?.id || agentSession?.agentId || agentSession?.id || 'agent001';
      const currentSenderName = inchargeSession?.name || agentSession?.name || 'Ramesh';
      const currentSenderRole = inchargeSession ? 'ASM' : 'AGENT';
      await adminService.submitFollowup({
        tankId: tankId,
        cycleKey: tankCompliance?.cycleKey,
        senderId: currentSenderId,
        senderName: currentSenderName,
        senderRole: currentSenderRole,
        message: trimmed
      });
      setReplyText('');
      setReplySuccess('Reply recorded successfully in conversation!');
      await loadTankCompliance();
      setTimeout(() => setReplySuccess(''), 4000);
    } catch (err) {
      setReplyError(err.message || 'Failed to submit reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const stateTank = location.state?.tank;
  const stateFarmer = location.state?.farmer;

  const rawTank = (getTankById ? getTankById(tankId) : null) ||
    db?.tanks?.find(t => {
      const tId = String(t.id || '').toLowerCase();
      const target = String(tankId || '').toLowerCase();
      return tId === target || tId.replace(/^t0*/, '') === target.replace(/^t0*/, '') || t.name === tankId;
    }) ||
    stateTank;

  const rawFarmer = stateFarmer || (rawTank?.farmerId ? ((getFarmerById ? getFarmerById(rawTank.farmerId) : null) || db?.farmers?.find(f => f.id === rawTank.farmerId || String(f.id) === String(rawTank.farmerId))) : null);

  // Authorization check: Agent can only view tanks belonging to his assigned farmers; ASM/Incharge can view all tanks
  const agentSession = getSession ? getSession() : null;
  const inchargeSession = getInchargeSession ? getInchargeSession() : null;
  const currentAgentId = String(agentSession?.agentId || agentSession?.id || 'agent001').trim().toLowerCase();
  const farmerAgentId = String(rawFarmer?.agentId || rawFarmer?.agent_id || rawTank?.agentId || rawTank?.agent_id || '').trim().toLowerCase();
  const isAuthorized = isIncharge || (farmerAgentId && farmerAgentId === currentAgentId) || !farmerAgentId;

  const tank = isAuthorized ? rawTank : null;
  const farmer = isAuthorized ? (rawFarmer || (tank ? { id: tank.farmerId, name: tank.farmerName || 'Farmer' } : null)) : null;

  // Farmer assigned tanks count
  const farmerTanks = farmer ? (db?.tanks || []).filter(t => t.farmerId === farmer.id) : [];
  const assignedTanksCount = farmerTanks.length > 0 ? farmerTanks.length : 0;
  const assignedTanksText = assignedTanksCount === 1 ? '1 Tank' : `${assignedTanksCount} Tanks`;

  // Listen for harvest updates
  useEffect(() => {
    const handleStoreUpdate = (e) => {
      if (e.detail) setHarvestStore(e.detail);
    };
    window.addEventListener('harvestStoreUpdated', handleStoreUpdate);
    return () => window.removeEventListener('harvestStoreUpdated', handleStoreUpdate);
  }, []);

  const normalizeId = (id) => String(id || '').trim().toLowerCase().replace(/^t0*/, 't');
  const isTankMatch = (idA, idB) => {
    if (!idA || !idB) return false;
    if (idA === idB) return true;
    return normalizeId(idA) === normalizeId(idB);
  };

  if (!tank || !farmer) {
    return (
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '28px', borderRadius: '12px', border: '1px solid #E2E8F0', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>Tank Not Accessible</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748B' }}>
            This tank is either not registered or belongs to a farmer not assigned to your account.
          </p>
          <button
            type="button"
            onClick={handleBack}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#1A2FB8', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer' }}
          >
            ← Back to Farmers
          </button>
        </div>
      </div>
    );
  }

  const storeKey = `${farmer?.id || ''}_${tank.id}`;
  const tankStoreData = harvestStore[storeKey];

  // Submissions for this tank
  const tankSubmissions = (db?.submissions || [])
    .filter(s => isTankMatch(s.tankId, tank.id) || (tank.name && s.tankName === tank.name))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  // Retrieve harvests from local storage and database
  let rawHarvests = [];
  if (tankStoreData && Array.isArray(tankStoreData.harvests)) {
    rawHarvests = [...tankStoreData.harvests];
  }

  // Also include harvests from db.harvests
  (db?.harvests || []).forEach(h => {
    if (isTankMatch(h.tankId, tank.id)) {
      const exists = rawHarvests.some(r => r.id === h.id || (r.date === h.date && r.harvestedBiomass === h.quantityKg));
      if (!exists) {
        rawHarvests.push({
          id: h.id,
          date: h.date,
          doc: h.doc || tank.doc || 77,
          abw: h.abw || tank.abw || 25,
          harvestedBiomass: h.quantityKg || h.quantity_kg || 0,
          harvestedNumber: h.harvestedNumber || (h.countPerKg && h.quantityKg ? h.countPerKg * h.quantityKg : 0),
          feedConsumed: h.feedConsumed || 0,
          fcr: h.fcr || tank.fcr || '1.18',
          buyer: h.buyerName || h.buyer || 'Royals Marine Processing Unit 1',
          remarks: h.remarks || '',
          harvestType: h.harvestType || 'Partial Harvest',
          isFinal: h.isFinal || (h.harvestType === 'Final Harvest')
        });
      }
    }
  });

  // Also include harvests from tankSubmissions where testType or recordType is harvest
  tankSubmissions.forEach(sub => {
    const isSubHarvest = (sub.testType || '').toUpperCase().includes('HARVEST') ||
      (sub.recordType || '').toUpperCase().includes('HARVEST');
    if (isSubHarvest) {
      const sData = sub.data || {};
      const exists = rawHarvests.some(r => r.id === sub.id || (r.date === sub.date && r.harvestedBiomass === (sData.harvestedBiomass || sData.quantityKg)));
      if (!exists) {
        rawHarvests.push({
          id: sub.id,
          date: sub.date,
          doc: sData.doc || tank.doc || 77,
          abw: sData.abw || tank.abw || 25,
          harvestedBiomass: parseFloat(sData.harvestedBiomass || sData.quantityKg || 0),
          harvestedNumber: parseFloat(sData.harvestedNumber || 0),
          feedConsumed: parseFloat(sData.feedConsumed || 0),
          fcr: sData.fcr || tank.fcr || '1.18',
          buyer: sData.buyer || 'Royals Marine Processing Unit 1',
          remarks: sData.remarks || '',
          harvestType: sData.harvestType || (sub.testType === 'Final Harvest' ? 'Final Harvest' : 'Partial Harvest'),
          isFinal: sub.testType === 'Final Harvest' || sData.harvestType === 'Final Harvest' || sData.isFinal
        });
      }
    }
  });

  // Sort harvests chronologically
  const sortedHarvests = [...rawHarvests].sort((a, b) => {
    return new Date(a.date || 0) - new Date(b.date || 0);
  });

  // Dynamically assign sequence titles: Partial Harvest, Partial Harvest 2, Partial Harvest 3, ... Final Harvest
  let partialCount = 0;
  const sequencedHarvests = sortedHarvests.map((h) => {
    const isFinal = h.harvestType === 'Final Harvest' || h.isFinal;
    if (isFinal) {
      return { ...h, displayTitle: 'Final Harvest', isFinal: true };
    } else {
      partialCount += 1;
      const autoTitle = partialCount === 1 ? 'Partial Harvest' : `Partial Harvest ${partialCount}`;
      let cleanTitle = h.displayTitle;
      if (!cleanTitle || cleanTitle === 'Partial Harvest-1' || cleanTitle === 'Partial Harvest #1' || cleanTitle === 'Partial Harvest 1') {
        cleanTitle = autoTitle;
      } else if (cleanTitle.match(/^Partial Harvest[-\s#]*(\d+)$/i)) {
        const num = cleanTitle.match(/^Partial Harvest[-\s#]*(\d+)$/i)[1];
        cleanTitle = num === '1' ? 'Partial Harvest' : `Partial Harvest ${num}`;
      } else if (!cleanTitle.startsWith('Partial Harvest')) {
        cleanTitle = autoTitle;
      }
      return { ...h, displayTitle: cleanTitle, isFinal: false };
    }
  });

  const nextPartialTitle = partialCount === 0 ? 'Partial Harvest' : `Partial Harvest ${partialCount + 1}`;

  const hasFinalHarvest = sequencedHarvests.some(h => h.isFinal || h.harvestType === 'Final Harvest') || 
    (tank.status === 'Harvested' || tank.status === 'Completed' || tank.finalHarvestCompleted || tankStoreData?.finalHarvestCompleted);

  const filterSubmissions = (type) => {
    const target = type.toUpperCase();
    return tankSubmissions.filter(s => {
      const st = (s.testType || s.recordType || '').toUpperCase();
      if (target === 'FEED') {
        return st.includes('FEED') || (s.data && (s.data.dayFeed !== undefined || s.data.cumulativeFeed !== undefined));
      }
      if (target === 'DISEASE') {
        return st.includes('DISEASE') || (s.data && (s.data.observations !== undefined || s.data.status !== undefined));
      }
      return st.includes(target);
    });
  };

  // Automated performance calculations
  const seedStocked = parseFloat(tankStoreData?.seedNumber || tank.seedStocked || 1000000);
  const totalFeedUsed = parseFloat(tankStoreData?.totalFeed || 16000);

  // Find latest field records for present metrics
  const latestFeedTest = tankSubmissions.find(s =>
    (s.testType || s.recordType || '').toUpperCase().includes('FEED')
  );
  const latestBiomassTest = tankSubmissions.find(s =>
    (s.testType || s.recordType || '').toUpperCase().includes('BIOMASS')
  );

  // Present Biomass (Current active standing biomass in pond)
  const presentBiomass = parseFloat(
    latestFeedTest?.data?.totalBiomass ||
    latestBiomassTest?.data?.totalBiomass ||
    tank.biomass ||
    '14035'
  );

  // Present FCR (Current feed conversion ratio)
  const calcFCR = (totalFeedUsed > 0 && presentBiomass > 0)
    ? (totalFeedUsed / presentBiomass).toFixed(2)
    : (latestFeedTest?.data?.fcr || tank.fcr || '1.14');
  const presentFCR = parseFloat(calcFCR) > 3.5 ? (latestFeedTest?.data?.fcr || tank.fcr || '1.14') : calcFCR;

  // Present Estimated Survival %
  const calcSurvival = (seedStocked > 0 && presentBiomass > 0)
    ? Math.min(99.5, ((presentBiomass * 1000) / (seedStocked * (parseFloat(tank.abw || latestFeedTest?.data?.abw || 18.4) || 18.4)) * 100)).toFixed(1)
    : '76.3';
  const presentSurvivalPct = (parseFloat(calcSurvival) < 15 || parseFloat(calcSurvival) > 100)
    ? (tank.survival ? `${parseFloat(tank.survival)}` : '76.3')
    : calcSurvival;

  // Final Harvest Metrics (when completed)
  const totalHarvestedSeed = sequencedHarvests.reduce((sum, h) => {
    const num = parseFloat(h.harvestedNumber) || 0;
    if (num > 0) return sum + num;
    const biomass = parseFloat(h.harvestedBiomass) || 0;
    const abw = parseFloat(h.abw) || 0;
    if (biomass > 0 && abw > 0) {
      return sum + Math.round((biomass * 1000) / abw);
    }
    return sum;
  }, 0);

  const totalBiomass = sequencedHarvests.reduce((sum, h) => {
    return sum + (parseFloat(h.harvestedBiomass) || 0);
  }, 0);

  const finalSurvivalPct = (seedStocked > 0 && totalHarvestedSeed > 0)
    ? ((totalHarvestedSeed / seedStocked) * 100).toFixed(2)
    : '76.33';

  const finalFCR = totalBiomass > 0
    ? (totalFeedUsed / totalBiomass).toFixed(2)
    : '1.14';

  const cultureDays = 77; // As requested in example
  const weeklySchedule = getTankWeeklySchedule(tank, db?.submissions || []);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (location.pathname.startsWith('/asm')) {
      if (farmer?.id) {
        navigate(`/asm/farmers/${farmer.id}`);
      } else {
        navigate('/asm/farmers');
      }
    } else if (location.pathname.startsWith('/incharge')) {
      if (farmer?.id) {
        navigate(`/incharge/farmers/${farmer.id}`);
      } else {
        navigate('/incharge/my-tanks');
      }
    } else {
      if (farmer?.id) {
        navigate(`/farmers/${farmer.id}`);
      } else {
        navigate('/farmers');
      }
    }
  };

  return (
    <div style={styles.pageContainer}>
      {/* ========================================================= */}
      {/* 1. PAGE HEADER */}
      {/* ========================================================= */}
      <div style={styles.topHeaderBar}>
        <button
          type="button"
          style={styles.backButton}
          onClick={handleBack}
          aria-label="Back"
        >
          <ArrowLeft size={18} strokeWidth={2.4} />
          <span>Back</span>
        </button>

        {hasFinalHarvest ? (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#F1F5F9',
            border: '1.5px solid #CBD5E1',
            padding: '8px 16px',
            borderRadius: '10px',
            color: '#475569',
            fontSize: '13px',
            fontWeight: '700',
          }}>
            <Lock size={15} color="#64748B" />
            <span>Final Harvest Completed • Tank Closed</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button" 
              style={styles.harvestActionBtn}
              onClick={() => {
                setIsHarvestTypeChoiceOpen(true);
              }}
              title="Record Crop Harvest"
            >
              <Scale size={15} strokeWidth={2.4} />
              <span>Harvest</span>
            </button>

            <button
              type="button"
              style={styles.primaryNewRecordBtn}
              onClick={() => {
                setModalInitialType('WATER_QUALITY');
                setIsRecordModalOpen(true);
              }}
              title="New Record"
            >
              <Plus size={16} strokeWidth={2.6} />
              <span>New Record</span>
            </button>
          </div>
        )}
      </div>

      {/* Final Harvest Closed Alert Banner */}
      {hasFinalHarvest && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#EFF6FF',
          border: '1.5px solid #BFDBFE',
          padding: '14px 18px',
          borderRadius: '12px',
          color: '#1E3A8A',
        }}>
          <Lock size={20} color="#1D4ED8" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#1E3A8A' }}>
              Final Harvest Completed & Crop Cycle Closed
            </div>
            <div style={{ fontSize: '12.5px', color: '#3B82F6', marginTop: '2px' }}>
              This tank has completed its final crop harvest. Data entry is closed for this cycle.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. COMPACT MINIMAL TANK & FARMER SUMMARY */}
      {/* ========================================================= */}
      <div style={styles.minimalHeroCard}>
        <div style={styles.heroTopRow}>
          <div style={styles.heroTitleGroup}>
            <h1 style={styles.heroTankTitle}>{tank.name || 'Tank 1'}</h1>
            <span style={styles.heroBadgePrimary}>{tank.species || 'Vannamei'}</span>
            <span style={styles.heroBadgeMuted}>{cultureDays}d DOC</span>
            <span style={styles.heroBadgeMuted}>{tank.acres || tank.area || '2.5'} Ac</span>
          </div>

          {hasFinalHarvest ? (
            <span style={styles.statusPillHarvested}>
              <CheckCircle2 size={12} strokeWidth={2.4} /> Harvested
            </span>
          ) : tankCompliance?.followupStatus === 'ADDRESSED' ? (
            <span style={{
              ...styles.statusPillDone,
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              border: '1px solid #BBF7D0'
            }}>
              <CheckCircle2 size={12} strokeWidth={2.4} /> Addressed (Settled)
            </span>
          ) : !weeklySchedule.isAllDone ? (
            <span style={styles.statusPillDue}>
              <Clock size={12} strokeWidth={2.4} /> Test Due
            </span>
          ) : (
            <span style={styles.statusPillDone}>
              <CheckCircle2 size={12} strokeWidth={2.4} /> Active
            </span>
          )}
        </div>

        <div style={styles.heroMetaRow}>
          <span style={styles.heroMetaItem}>
            <User size={13} color="#64748B" />
            <strong style={{ color: '#0F172A' }}>{farmer?.name || 'Farmer'}</strong>
          </span>
          <span style={styles.heroMetaDot}>•</span>
          <span style={styles.heroMetaItem}>
            <MapPin size={13} color="#64748B" />
            {farmer?.location || 'Bhimavaram'}
          </span>
          {farmer?.phone && (
            <>
              <span style={styles.heroMetaDot}>•</span>
              <a href={`tel:${farmer.phone}`} style={styles.heroPhoneLink}>
                <Phone size={12} color="#1A2FB8" />
                {farmer.phone}
              </a>
            </>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MINIMAL PERFORMANCE METRICS (4 Clean Cards) */}
      {/* ========================================================= */}
      <div style={styles.minimalKpiGrid}>
        {/* Metric 1: Biomass */}
        <div style={styles.minimalKpiCard}>
          <span style={styles.minimalKpiLabel}>
            {hasFinalHarvest ? 'Total Biomass' : 'Biomass'}
          </span>
          <div style={{ ...styles.minimalKpiValue, color: '#16A34A' }}>
            {hasFinalHarvest ? `${totalBiomass.toLocaleString()} kg` : `${presentBiomass.toLocaleString()} kg`}
          </div>
        </div>

        {/* Metric 2: FCR */}
        <div style={styles.minimalKpiCard}>
          <span style={styles.minimalKpiLabel}>FCR</span>
          <div style={{ ...styles.minimalKpiValue, color: '#1A2FB8' }}>
            {hasFinalHarvest ? finalFCR : presentFCR}
          </div>
        </div>

        {/* Metric 3: Feed Used */}
        <div style={styles.minimalKpiCard}>
          <span style={styles.minimalKpiLabel}>Feed Used</span>
          <div style={styles.minimalKpiValue}>
            {totalFeedUsed.toLocaleString()} kg
          </div>
        </div>

        {/* Metric 4: Survival % */}
        <div style={styles.minimalKpiCard}>
          <span style={styles.minimalKpiLabel}>Survival</span>
          <div style={{ ...styles.minimalKpiValue, color: '#0D9488' }}>
            {hasFinalHarvest ? `${finalSurvivalPct}%` : `${presentSurvivalPct}%`}
          </div>
        </div>
      </div>

      {/* 4b. Weekly Testing Due & Follow-up Conversation (Requirement 5) */}
      {!hasFinalHarvest && (tankCompliance || tankFollowups.length > 0) && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: tankCompliance && !tankCompliance.isCompliant ? '1px solid #FECACA' : '1px solid #E2E8F0',
          padding: '16px 20px',
          margin: '16px 0',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
        }}>
          {/* Card Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: tankCompliance && !tankCompliance.isCompliant ? '#FEF2F2' : '#F0FDF4',
                color: tankCompliance && !tankCompliance.isCompliant ? '#DC2626' : '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Clock size={17} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    Weekly Test Due &amp; Follow-up Conversation
                  </h3>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: tankCompliance && !tankCompliance.isCompliant ? '#FEE2E2' : '#DCFCE7',
                    color: tankCompliance && !tankCompliance.isCompliant ? '#DC2626' : '#166534',
                    border: tankCompliance && !tankCompliance.isCompliant ? '1px solid #FECACA' : '1px solid #BBF7D0'
                  }}>
                    {tankCompliance && !tankCompliance.isCompliant
                      ? `${tankCompliance.daysOverdue} Days Overdue (Test Pending)`
                      : 'Compliant (Tested within 7 days)'}
                  </span>
                  {tankCompliance && !tankCompliance.isCompliant && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: tankCompliance.followupStatus === 'ADDRESSED' ? '#DCFCE7' : '#FEF3C7',
                      color: tankCompliance.followupStatus === 'ADDRESSED' ? '#15803D' : '#B45309',
                      border: tankCompliance.followupStatus === 'ADDRESSED' ? '1px solid #BBF7D0' : '1px solid #FDE68A'
                    }}>
                      {tankCompliance.followupStatus === 'ADDRESSED' ? '✓ Addressed (No Test Needed This Week)' : '🟡 Awaiting Follow-up'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Last test: <strong>{tankCompliance?.lastTestDisplay || tank.lastTest || 'None'}</strong> • {tankCompliance.followupStatus === 'ADDRESSED' ? <span>Follow-up: <strong>Settled by Supervisor</strong></span> : <span>Next test due by: <strong>{tankCompliance?.dueDateDisplay || tank.nextTest || 'This Week'}</strong></span>}
                </div>
              </div>
            </div>

            {/* Quick Record Test CTA */}
            {tankCompliance?.followupStatus === 'ADDRESSED' ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                border: '1px solid #BBF7D0',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                <CheckCircle2 size={14} color="#15803D" />
                <span>Test Not Required (Addressed)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setModalInitialType('WATER_QUALITY');
                  setIsRecordModalOpen(true);
                }}
                style={{
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)'
                }}
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Record Qualifying Test Now</span>
              </button>
            )}
          </div>

          {/* Conversation Thread */}
          {tankFollowups.length > 0 && (
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '12px',
              marginBottom: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Conversation History ({tankFollowups.length} Messages)
              </span>
              {tankFollowups.map((fup) => {
                const isAdmin = (fup.senderRole || '').toUpperCase() === 'ADMIN';
                const isAsm = (fup.senderRole || '').toUpperCase() === 'INCHARGE' || (fup.senderRole || '').toUpperCase() === 'ASM';
                return (
                  <div key={fup.id} style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    padding: '8px 12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: isAdmin ? '#DCFCE7' : isAsm ? '#DBEAFE' : '#FEF3C7',
                          color: isAdmin ? '#166534' : isAsm ? '#1E40AF' : '#92400E',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          {fup.senderRole}
                        </span>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                          {fup.senderName}
                        </span>
                        {fup.recipientName && (
                          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                            → {fup.recipientName}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                        {fup.createdAtDisplay}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#334155', lineHeight: '1.4' }}>
                      {fup.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reply Form */}
          <form onSubmit={handleReplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {replyError && (
              <div style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#FEE2E2', color: '#B91C1C', fontSize: '12px' }}>
                {replyError}
              </div>
            )}
            {replySuccess && (
              <div style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#DCFCE7', color: '#15803D', fontSize: '12px' }}>
                {replySuccess}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Reply to follow-up (e.g. 'Visiting pond today at 3pm to test water quality & DO')..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={isSubmittingReply}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={isSubmittingReply || !replyText.trim()}
                style={{
                  backgroundColor: '#03358F',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: isSubmittingReply || !replyText.trim() ? 'not-allowed' : 'pointer',
                  opacity: isSubmittingReply || !replyText.trim() ? 0.6 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Send size={13} />
                <span>{isSubmittingReply ? 'Sending...' : 'Send Reply'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. ACTIVITY SECTIONS TABS */}
      {/* ========================================================= */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabsScrollRow}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                style={{
                  ...styles.tabButton,
                  backgroundColor: isSelected ? '#1A2FB8' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  borderColor: isSelected ? '#1A2FB8' : '#E2E8F0',
                  fontWeight: isSelected ? '700' : '600',
                  boxShadow: isSelected ? '0 2px 8px rgba(26, 47, 184, 0.2)' : 'none',
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={15} color={isSelected ? '#FFFFFF' : '#64748B'} strokeWidth={2.2} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. TAB CONTENT: HARVEST RECORDS & HISTORY */}
      {/* ========================================================= */}
      {activeTab === 'HARVEST' && (
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeaderRow}>
            <div>
              <h3 style={styles.sectionTitle}>Harvest Records</h3>
              <span style={styles.sectionSub}>Sequential timeline of recorded harvests</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                style={{
                  ...styles.addHarvestActionBtn,
                  backgroundColor: '#FFFFFF',
                  color: '#1A2FB8',
                  border: '1px solid #BFDBFE'
                }}
                onClick={() => {
                  setIsHarvestModalOpen(true);
                }}
                title="View Full Harvest Summary & Timeline"
              >
                <FileText size={14} />
                <span>View Full Report</span>
              </button>

              {!hasFinalHarvest ? (
                <button
                  type="button"
                  style={styles.addHarvestActionBtn}
                  onClick={() => {
                    setIsHarvestTypeChoiceOpen(true);
                  }}
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>New Harvest</span>
                </button>
              ) : (
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#F1F5F9', padding: '5px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                  <Lock size={12} color="#64748B" /> Tank Locked
                </span>
              )}
            </div>
          </div>

          {/* History List styled identically to Water Records */}
          <div style={{ marginTop: '12px' }}>
            {sequencedHarvests.length === 0 ? (
              <div style={styles.emptyStateBoxMinimal}>
                <Clock size={20} color="#94A3B8" />
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                  No harvest records logged yet
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sequencedHarvests.map((h, idx) => (
                  <div 
                    key={h.id || idx}
                    style={styles.recordListItem}
                    onClick={() => {
                      setSelectedReadRecord({
                        id: h.id || `harvest_${idx}`,
                        testType: h.displayTitle,
                        recordType: 'HARVEST_ENTRY',
                        date: h.date,
                        time: h.time || 'Harvest Logged',
                        farmerId: farmer?.id,
                        tankId: tank.id,
                        gps: h.gps || { locality: farmer?.location || farmer?.village || 'Chinnamiram', accuracy: 10 },
                        data: {
                          'Harvest Type': h.harvestType || (h.isFinal ? 'Final Harvest' : 'Partial Harvest'),
                          'DOC (Day of Culture)': `Day ${h.doc}`,
                          'Harvested Biomass': `${parseFloat(h.harvestedBiomass || 0).toLocaleString()} kg`,
                          'Average Body Weight (ABW)': `${h.abw} g`,
                          'Shrimp Count / kg': `${h.countPerKg || (h.abw > 0 ? Math.round(1000 / parseFloat(h.abw)) : 40)} count`,
                          'Est. Shrimp Harvested': `${parseFloat(h.harvestedNumber || 0).toLocaleString()} pcs`,
                          'Cumulative Feed': `${parseFloat(h.feedConsumed || 0).toLocaleString()} kg`,
                          'Batch FCR': h.fcr || '1.18',
                          'Buyer / Processing Unit': h.buyer || 'Royals Marine Processing Unit 1',
                          'Remarks': h.remarks || (h.isFinal ? 'Complete pond drainage harvest' : 'Partial thinning harvest')
                        }
                      });
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        ...styles.recordIconCircle,
                        backgroundColor: h.isFinal ? '#DCFCE7' : '#EFF6FF',
                      }}>
                        <Scale size={15} color={h.isFinal ? '#15803D' : '#1A2FB8'} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={styles.recordItemTitle}>{h.displayTitle}</span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: h.isFinal ? '#DCFCE7' : '#EFF6FF',
                            color: h.isFinal ? '#15803D' : '#1A2FB8',
                            border: `1px solid ${h.isFinal ? '#86EFAC' : '#BFDBFE'}`,
                          }}>
                            {h.isFinal ? 'Final Harvest' : 'Partial Harvest'}
                          </span>
                        </div>
                        <div style={styles.recordItemTime}>
                          {h.date} • {parseFloat(h.harvestedBiomass || 0).toLocaleString()} kg • {h.abw}g ABW • DOC {h.doc}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        ...styles.verifiedTag,
                        backgroundColor: h.isFinal ? '#DCFCE7' : '#EFF6FF',
                        color: h.isFinal ? '#15803D' : '#1A2FB8',
                      }}>
                        {h.isFinal ? '✓ Finalized' : '✓ Verified'}
                      </span>
                      <ChevronRight size={15} color="#94A3B8" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* ========================================================= */}
          {/* 7. HARVEST SUMMARY CARD (Displayed only upon Final Harvest) */}
          {/* ========================================================= */}
          {hasFinalHarvest && (
            <div style={styles.harvestSummaryBox}>
              <div style={styles.harvestSummaryHeader}>
                <h4 style={styles.harvestSummaryTitle}>Final Harvest Summary</h4>
                <span style={styles.autoCalculatedBadge}>
                  <Sparkles size={13} /> Auto Calculated
                </span>
              </div>

              <div style={styles.summaryFieldsGrid}>
                <div style={styles.summaryFieldItem}>
                  <span style={styles.summaryFieldLabel}>Seed Stocked</span>
                  <span style={styles.summaryFieldValue}>{seedStocked.toLocaleString()}</span>
                </div>

                <div style={styles.summaryFieldItem}>
                  <span style={styles.summaryFieldLabel}>Total Harvested (Cumulative)</span>
                  <span style={styles.summaryFieldValue}>{totalHarvestedSeed.toLocaleString()}</span>
                </div>

                <div style={styles.summaryFieldItem}>
                  <span style={styles.summaryFieldLabel}>Total Biomass (Harvest Weight)</span>
                  <span style={{ ...styles.summaryFieldValue, color: '#1A2FB8' }}>{totalBiomass.toLocaleString()} kg</span>
                </div>

                <div style={styles.summaryFieldItem}>
                  <span style={styles.summaryFieldLabel}>Cumulative Feed Used</span>
                  <span style={styles.summaryFieldValue}>{totalFeedUsed.toLocaleString()} kg</span>
                </div>

                <div style={styles.summaryFieldItem}>
                  <span style={styles.summaryFieldLabel}>Final FCR</span>
                  <span style={{ ...styles.summaryFieldValue, color: '#1A2FB8' }}>{finalFCR}</span>
                </div>

                <div style={styles.summaryFieldItem}>
                  <span style={styles.summaryFieldLabel}>Final Survival %</span>
                  <span style={{ ...styles.summaryFieldValue, color: '#16A34A' }}>{finalSurvivalPct}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB CONTENT: OVERVIEW */}
      {/* ========================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>Tank Biophysical Specifications</h3>
          <div style={styles.overviewGrid}>
            <div style={styles.overviewItem}>
              <span style={styles.infoLabel}>Water Spread</span>
              <span style={styles.overviewVal}>{tank.acres || '2.5'} Acres</span>
            </div>
            <div style={styles.overviewItem}>
              <span style={styles.infoLabel}>Water Intake Source</span>
              <span style={styles.overviewVal}>{tank.waterSource || 'Borewell / Creek'}</span>
            </div>
            <div style={styles.overviewItem}>
              <span style={styles.infoLabel}>Baseline Salinity</span>
              <span style={styles.overviewVal}>{tank.salinity || '16'} ppt</span>
            </div>
            <div style={styles.overviewItem}>
              <span style={styles.infoLabel}>Soil Texture</span>
              <span style={styles.overviewVal}>{tank.soilType || 'Clay Loam'}</span>
            </div>
            <div style={styles.overviewItem}>
              <span style={styles.infoLabel}>Stocking Date</span>
              <span style={styles.overviewVal}>{tank.stockingDate || '2026-06-12'}</span>
            </div>
            <div style={styles.overviewItem}>
              <span style={styles.infoLabel}>Certified Seed Source</span>
              <span style={styles.overviewVal}>Apex SPF Hatcheries</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB CONTENT: FIELD RECORDS (Water, Feed, Biomass, etc.) */}
      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* TAB CONTENT: FIELD RECORDS (Water, Feed, Biomass, etc.) */}
      {/* ========================================================= */}
      {['WATER', 'FEED', 'DISEASE', 'BIOMASS', 'MEDICATION', 'MORTALITY', 'ACTIVITY', 'REPORTS'].includes(activeTab) && (() => {
        const tabLabel = TABS.find(t => t.id === activeTab)?.label || 'Test';
        const tabRecords = activeTab === 'REPORTS' ? tankSubmissions : filterSubmissions(activeTab);

        return (
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeaderRow}>
              <h3 style={styles.sectionTitle}>{tabLabel} Records</h3>

              {!hasFinalHarvest ? (
                <button
                  type="button"
                  style={styles.addHarvestActionBtn}
                  onClick={() => {
                    setModalInitialType(
                      activeTab === 'WATER' ? 'WATER_QUALITY' :
                        activeTab === 'FEED' ? 'FEED_ENTRY' :
                          activeTab === 'DISEASE' ? 'DISEASE_ENTRY' :
                            activeTab === 'MEDICATION' ? 'MEDICATION' :
                              activeTab === 'MORTALITY' ? 'MORTALITY_LOG' :
                                activeTab === 'ACTIVITY' ? 'FARM_ACTIVITY' : 'WATER_QUALITY'
                    );
                    setIsRecordModalOpen(true);
                  }}
                >
                  <Plus size={14} /> New Entry
                </button>
              ) : (
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#F1F5F9', padding: '5px 12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                  <Lock size={12} color="#64748B" /> Tank Locked
                </span>
              )}
            </div>

            <div style={{ marginTop: '12px' }}>
              {tabRecords.length === 0 ? (
                <div style={styles.emptyStateBoxMinimal}>
                  <Clock size={20} color="#94A3B8" />
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                    No {tabLabel.toLowerCase()} records logged yet
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tabRecords.map((rec) => (
                    <div
                      key={rec.id}
                      style={styles.recordListItem}
                      onClick={() => setSelectedReadRecord(rec)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={styles.recordIconCircle}>
                          <FileText size={15} color="#1A2FB8" />
                        </div>
                        <div>
                          <span style={styles.recordItemTitle}>{rec.testType || rec.recordType || 'Field Test'}</span>
                          <div style={styles.recordItemTime}>{rec.date} • {rec.time || '10:30 AM'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={styles.verifiedTag}>✓ Verified</span>
                        <ChevronRight size={15} color="#94A3B8" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* READ-ONLY RECORD MODAL */}
      {/* ========================================================= */}
      {selectedReadRecord && createPortal(
        <div
          className="animate-backdrop-in"
          style={styles.modalOverlay}
          onClick={() => setSelectedReadRecord(null)}
        >
          <div
            className="animate-modal-in"
            style={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.readOnlyTag}>
                  <Lock size={10} strokeWidth={2.4} /> RECORD DETAILS • READ ONLY
                </div>
                <h3 style={styles.modalHeading}>
                  {selectedReadRecord.testType || selectedReadRecord.recordType}
                </h3>
              </div>
              <button
                type="button"
                style={styles.closeBtn}
                onClick={() => setSelectedReadRecord(null)}
                aria-label="Close"
              >
                <X size={18} strokeWidth={2.4} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Farmer</span>
                <span style={styles.modalVal}>{farmer?.name}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Tank</span>
                <span style={styles.modalVal}>{tank.name}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Timestamp</span>
                <span style={styles.modalVal}>{selectedReadRecord.date} • {selectedReadRecord.time || 'Recorded'}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>GPS Location</span>
                <span style={{ ...styles.modalVal, color: '#16A34A' }}>
                  📍 {selectedReadRecord.gps?.locality || 'Chinnamiram'} (±{selectedReadRecord.gps?.accuracy || 10}m)
                </span>
              </div>

              {selectedReadRecord.data && (() => {
                let parsedData = selectedReadRecord.data;
                if (typeof parsedData === 'string') {
                  try { parsedData = JSON.parse(parsedData); } catch (e) { parsedData = {}; }
                }
                if (!parsedData || typeof parsedData !== 'object' || Array.isArray(parsedData)) {
                  return null;
                }
                return (
                  <div style={styles.dataContainer}>
                    <div style={styles.dataHeading}>Logged Field Parameters</div>
                    {Object.entries(parsedData).map(([k, v]) => {
                      if (v && typeof v === 'object' && !Array.isArray(v)) {
                        const detected = Object.entries(v);
                        return (
                          <div key={k} style={{ ...styles.dataRow, flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                            <span style={styles.dataKey}>{k.replace(/([A-Z])/g, ' $1')}:</span>
                            {detected.length === 0 ? (
                              <span style={{ ...styles.dataVal, color: '#16A34A', fontWeight: '700' }}>None Detected (Normal)</span>
                            ) : (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                                {detected.map(([diseaseName, level]) => (
                                  <span
                                    key={diseaseName}
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: '700',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      backgroundColor: level === 'Severe' ? '#FEE2E2' : '#FEF3C7',
                                      color: level === 'Severe' ? '#DC2626' : '#B45309',
                                      border: level === 'Severe' ? '1px solid #FECACA' : '1px solid #FDE68A'
                                    }}
                                  >
                                    {diseaseName}: {level}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div key={k} style={styles.dataRow}>
                          <span style={styles.dataKey}>{k.replace(/([A-Z])/g, ' $1')}:</span>
                          <span style={styles.dataVal}>{String(v)}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                className="transition-all duration-150 active:scale-98 cursor-pointer"
                style={styles.modalDoneBtn}
                onClick={() => setSelectedReadRecord(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* QUICK RECORD MODAL */}
      {/* ========================================================= */}
      <QuickRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          const updated = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
          setHarvestStore(updated);
        }}
        initialType={modalInitialType}
        preselectedFarmerId={farmer?.id}
        preselectedTankId={tank.id}
        onSuccess={() => {
          const updated = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
          setHarvestStore(updated);
        }}
      />

      {/* ========================================================= */}
      {/* HARVEST TYPE SELECTION MODAL (1. Partial Harvest, 2. Final Harvest) */}
      {/* ========================================================= */}
      {isHarvestTypeChoiceOpen && createPortal(
        <div 
          className="animate-backdrop-in"
          style={styles.modalOverlay}
          onClick={() => setIsHarvestTypeChoiceOpen(false)}
        >
          <div 
            className="animate-modal-in"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '92%',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                  Select Harvest Type
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                  Record new harvest for <strong>{tank.name}</strong> ({farmer?.name})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHarvestTypeChoiceOpen(false)}
                style={styles.closeBtn}
                aria-label="Close"
              >
                <X size={18} strokeWidth={2.4} />
              </button>
            </div>

            {/* Options List */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Option 1: Partial Harvest */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setIsHarvestTypeChoiceOpen(false);
                  setSelectedHarvestType('Partial Harvest');
                  setIsTakeHarvestModalOpen(true);
                }}
                className="transition-all duration-150 hover:border-blue-500 hover:shadow-md cursor-pointer"
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1.5px solid #BFDBFE',
                  backgroundColor: '#F8FAFC',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1A2FB8',
                  fontWeight: '800',
                  fontSize: '15px',
                  flexShrink: 0,
                }}>
                  1
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                      Partial Harvest
                    </span>
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: '700',
                      color: '#1A2FB8',
                      backgroundColor: '#EFF6FF',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid #BFDBFE',
                    }}>
                      Next: {nextPartialTitle}
                    </span>
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#475569', lineHeight: 1.45 }}>
                    Net a portion of shrimp to reduce biomass and promote accelerated growth. Pond culture continues actively.
                  </p>
                </div>
                <ChevronRight size={18} color="#1A2FB8" style={{ marginTop: '8px', flexShrink: 0 }} />
              </div>

              {/* Option 2: Final Harvest */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setIsHarvestTypeChoiceOpen(false);
                  setSelectedHarvestType('Final Harvest');
                  setIsTakeHarvestModalOpen(true);
                }}
                className="transition-all duration-150 hover:border-emerald-500 hover:shadow-md cursor-pointer"
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1.5px solid #BBF7D0',
                  backgroundColor: '#F8FAFC',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16A34A',
                  fontWeight: '800',
                  fontSize: '15px',
                  flexShrink: 0,
                }}>
                  2
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                      Final Harvest
                    </span>
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: '700',
                      color: '#B91C1C',
                      backgroundColor: '#FEF2F2',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid #FECACA',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Lock size={11} /> Locks Tank
                    </span>
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#475569', lineHeight: 1.45 }}>
                    Complete pond harvest and drainage. Concludes culture cycle and permanently locks this tank from any further entries.
                  </p>
                </div>
                <ChevronRight size={18} color="#16A34A" style={{ marginTop: '8px', flexShrink: 0 }} />
              </div>
            </div>

            <div style={{
              padding: '12px 24px 16px 24px',
              backgroundColor: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                type="button"
                onClick={() => setIsHarvestTypeChoiceOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* TAKE NEW HARVEST REPORT MODAL (PARTIAL / FINAL) */}
      {/* ========================================================= */}
      {isTakeHarvestModalOpen && (
        <TakeHarvestModal
          isOpen={isTakeHarvestModalOpen}
          initialHarvestType={selectedHarvestType}
          onClose={() => {
            setIsTakeHarvestModalOpen(false);
            const updated = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
            setHarvestStore(updated);
          }}
          tank={tank}
          farmer={farmer}
          onSuccess={(savedRec) => {
            setIsTakeHarvestModalOpen(false);
            const updated = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
            setHarvestStore(updated);
            if (savedRec?.isFinal) {
              if (typeof editTank === 'function') {
                editTank(tank.id, {
                  status: 'Harvested',
                  testStatus: 'Completed',
                  nextTest: 'Cycle Closed'
                });
              }
            }
          }}
        />
      )}

      {/* ========================================================= */}
      {/* COMPLETE HARVEST CROP SUMMARY & TIMELINE MODAL */}
      {/* ========================================================= */}
      {isHarvestModalOpen && (
        <HarvestCompletedModal
          isOpen={isHarvestModalOpen}
          onClose={() => {
            setIsHarvestModalOpen(false);
            const updated = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
            setHarvestStore(updated);
          }}
          tank={tank}
          farmer={farmer}
        />
      )}
    </div>
  );
};

const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    paddingBottom: '32px',
    boxSizing: 'border-box',
  },
  topHeaderBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '2px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#0F172A',
    fontWeight: '700',
    fontSize: '14.5px',
    cursor: 'pointer',
    padding: '4px 0',
  },
  harvestActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #BFDBFE',
    height: '36px',
    padding: '0 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
    transition: 'all 0.15s ease',
  },
  primaryNewRecordBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    height: '36px',
    padding: '0 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(26, 47, 184, 0.2)',
  },
  minimalHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '14px 16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    boxSizing: 'border-box',
  },
  heroTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  heroTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  heroTankTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  heroBadgePrimary: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#1A2FB8',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  heroBadgeMuted: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  statusPillDue: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    border: '1px solid #FDE68A',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  statusPillDone: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    border: '1px solid #86EFAC',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  statusPillHarvested: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#1D4ED8',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  heroMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12.5px',
    color: '#64748B',
    flexWrap: 'wrap',
  },
  heroMetaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#475569',
  },
  heroMetaDot: {
    color: '#CBD5E1',
    fontWeight: '700',
  },
  heroPhoneLink: {
    color: '#1A2FB8',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
  },
  minimalKpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))',
    gap: '8px',
    width: '100%',
    boxSizing: 'border-box',
  },
  minimalKpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '10px 12px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    boxSizing: 'border-box',
  },
  minimalKpiLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  minimalKpiValue: {
    fontSize: 'clamp(14px, 3.5vw, 17px)',
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: '-0.2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  emptyStateBoxMinimal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '24px 16px',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    border: '1px dashed #E2E8F0',
  },
  tabsContainer: {
    width: '100%',
    paddingBottom: '2px',
    boxSizing: 'border-box',
  },
  tabsScrollRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    paddingBottom: '4px',
    width: '100%',
  },
  tabButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: '36px',
    padding: '0 12px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    boxSizing: 'border-box',
    transition: 'all 0.15s ease',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: 'clamp(14px, 3.5vw, 24px)',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    boxSizing: 'border-box',
    width: '100%',
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.2px',
  },
  sectionSub: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '2px',
    display: 'block',
  },
  addHarvestActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #BFDBFE',
    borderRadius: '10px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  harvestTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13.5px',
  },
  tableHeadRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  tableHeadCell: {
    padding: '12px 14px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '700',
    color: '#475569',
    whiteSpace: 'nowrap',
  },
  tableBodyRow: {
    borderBottom: '1px solid #F1F5F9',
  },
  tableCell: {
    padding: '14px',
    color: '#1E293B',
    verticalAlign: 'middle',
  },
  harvestStagePill: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid transparent',
    fontSize: '12px',
    fontWeight: '700',
  },
  dateText: {
    color: '#475569',
    fontWeight: '500',
  },
  numberBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  biomassBold: {
    fontWeight: '800',
    color: '#1A2FB8',
  },
  completedStatusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  harvestSummaryBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '20px',
  },
  harvestSummaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  harvestSummaryTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  autoCalculatedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#1A2FB8',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    padding: '3px 8px',
    borderRadius: '12px',
  },
  summaryFieldsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '14px',
  },
  summaryFieldItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  summaryFieldLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
  },
  summaryFieldValue: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0F172A',
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  },
  overviewItem: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  overviewVal: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyStateBox: {
    textAlign: 'center',
    padding: '36px 16px',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px dashed #CBD5E1',
  },
  recordListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px 16px',
    cursor: 'pointer',
  },
  recordIconCircle: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#F0F4FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordItemTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
    display: 'block',
  },
  recordItemTime: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
  },
  verifiedTag: {
    fontSize: '11.5px',
    fontWeight: '600',
    color: '#16A34A',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    height: '100dvh',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
    padding: '16px',
    boxSizing: 'border-box',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '460px',
    maxHeight: 'calc(100vh - 32px)',
    maxHeight: 'calc(100dvh - 32px)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #E2E8F0',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    margin: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '10px',
    borderBottom: '1px solid #F1F5F9',
  },
  readOnlyTag: {
    fontSize: '9.5px',
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#E2E8F0',
    padding: '2px 6px',
    borderRadius: '4px',
    letterSpacing: '0.3px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '3px',
  },
  modalHeading: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  modalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    paddingBottom: '6px',
    borderBottom: '1px solid #F8FAFC',
  },
  modalLabel: {
    color: '#64748B',
    fontWeight: '500',
  },
  modalVal: {
    color: '#0F172A',
    fontWeight: '700',
    textAlign: 'right',
  },
  dataContainer: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '12px 14px',
    marginTop: '4px',
  },
  dataHeading: {
    fontSize: '10.5px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginBottom: '8px',
  },
  dataRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12.5px',
    padding: '2px 0',
  },
  dataKey: {
    color: '#64748B',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  dataVal: {
    fontWeight: '700',
    color: '#0F172A',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: '8px',
    borderTop: '1px solid #F1F5F9',
  },
  modalDoneBtn: {
    width: '100%',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(26, 47, 184, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyTestDueBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '8px',
    backgroundColor: '#FEF3C7',
    border: '1px solid #FDE68A',
    color: '#B45309',
    fontSize: '12px',
    fontWeight: '700',
  },
  weeklyScheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: 'clamp(16px, 3.5vw, 24px)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(15, 23, 42, 0.03)',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  scheduleHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  scheduleMiniTag: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.4px',
    marginBottom: '2px',
  },
  scheduleTitle: {
    fontSize: 'clamp(15px, 3vw, 17px)',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },
  testsDueBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 12px',
    borderRadius: '8px',
    backgroundColor: '#FEF3C7',
    border: '1px solid #FDE68A',
    color: '#B45309',
    fontSize: '12px',
    fontWeight: '700',
  },
  allTestsDoneBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 12px',
    borderRadius: '8px',
    backgroundColor: '#DCFCE7',
    border: '1px solid #86EFAC',
    color: '#15803D',
    fontSize: '12px',
    fontWeight: '700',
  },
  scheduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  testRowCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid',
    gap: '12px',
    transition: 'all 0.15s ease',
  },
  testRowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
    flex: 1,
  },
  testIconBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  testRowTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
  },
  testRowSub: {
    fontSize: '12px',
    fontWeight: '500',
    marginTop: '2px',
  },
  testRowRight: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  doneBadgePill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '6px',
    backgroundColor: '#DCFCE7',
    color: '#16A34A',
    fontWeight: '700',
    fontSize: '12px',
  },
  recordTestBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(26, 47, 184, 0.25)',
  }
};

export default TankDetails;
