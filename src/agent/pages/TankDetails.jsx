import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Phone, MapPin, User, CheckCircle2, 
  Scale, Wheat, Fish, Activity, TrendingUp, Droplets, 
  Skull, Pill, ClipboardList, Camera, Clock, Lock, 
  X, Info, Sparkles, FileText, ChevronRight, Layers, ShieldCheck
} from 'lucide-react';
import { useMockData, getTankWeeklyTestBreakdown, ROUTINE_TEST_TYPES } from '../../context/MockDataContext';
import QuickRecordModal from '../components/QuickRecordModal';

// Standard baseline harvest records for demo (no final harvest by default)
const defaultTankHarvests = [
  { id: 'h1', harvestType: 'Partial Harvest', date: '2026-08-20', doc: '60', abw: '10', harvestedNumber: '200000', harvestedBiomass: '2000', remarks: 'First partial thinning completed' },
  { id: 'h2', harvestType: 'Partial Harvest', date: '2026-09-05', doc: '85', abw: '15', harvestedNumber: '133333', harvestedBiomass: '2000', remarks: 'Second partial harvest completed' },
];

const TABS = [
  { id: 'OVERVIEW', label: 'Overview', icon: Layers },
  { id: 'WATER', label: 'Water Analysis', icon: Droplets },
  { id: 'FEED', label: 'Feed Test', icon: Wheat },
  { id: 'BIOMASS', label: 'Biomass', icon: Fish },
  { id: 'MEDICATION', label: 'Medication', icon: Pill },
  { id: 'MORTALITY', label: 'Mortality', icon: Skull },
  { id: 'ACTIVITY', label: 'Farm Activity', icon: ClipboardList },
  { id: 'HARVEST', label: 'Harvest History', icon: Scale },
];

const TankDetails = () => {
  const { tankId } = useParams();
  const navigate = useNavigate();
  const { getTankById, getFarmerById, db } = useMockData();
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
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

  const tank = (getTankById ? getTankById(tankId) : null) || db?.tanks?.find(t => t.id === tankId) || {
    id: tankId || 'T003',
    name: `Tank ${tankId ? tankId.replace(/\D/g, '') || '1' : '1'}`,
    species: 'Vannamei',
    acres: '2.5',
    area: '2.5',
    farmerId: 'F001',
    status: 'Active',
    seedStocked: 100000,
    stockingDate: '2026-06-12',
    waterSource: 'Borewell / Creek',
    salinity: '16',
    soilType: 'Clay Loam'
  };

  const farmer = tank ? ((getFarmerById ? getFarmerById(tank.farmerId) : null) || db?.farmers?.find(f => f.id === tank.farmerId)) : {
    id: 'F001',
    name: 'Ravi',
    phone: '+91 9876543211',
    location: 'Chinnamiram',
    assignedAgent: 'Agent A',
    tanks: ['Tank 1']
  };

  // Farmer assigned tanks count
  const farmerTanks = (db?.tanks || []).filter(t => t.farmerId === farmer?.id);
  const assignedTanksCount = farmerTanks.length > 0 ? farmerTanks.length : 1;
  const assignedTanksText = assignedTanksCount === 1 ? '1 Tank' : `${assignedTanksCount} Tanks`;

  // Listen for harvest updates
  useEffect(() => {
    const handleStoreUpdate = (e) => {
      if (e.detail) setHarvestStore(e.detail);
    };
    window.addEventListener('harvestStoreUpdated', handleStoreUpdate);
    return () => window.removeEventListener('harvestStoreUpdated', handleStoreUpdate);
  }, []);

  const storeKey = `${farmer?.id || 'F001'}_${tank.id}`;
  const tankStoreData = harvestStore[storeKey];

  // Retrieve harvests from local storage or fallback to defaults only for specific mock tanks
  let rawHarvests = [];
  if (tankStoreData && Array.isArray(tankStoreData.harvests)) {
    rawHarvests = tankStoreData.harvests;
  } else if (tank.id === 'T003' || tank.id === 'tank-01') {
    rawHarvests = defaultTankHarvests;
  } else {
    rawHarvests = [];
  }

  // Sort harvests chronologically
  const sortedHarvests = [...rawHarvests].sort((a, b) => {
    return new Date(a.date || 0) - new Date(b.date || 0);
  });

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

  const hasFinalHarvest = sequencedHarvests.some(h => h.isFinal || h.harvestType === 'Final Harvest') || 
    (tank.status === 'Harvested' || tank.status === 'Completed' || tank.finalHarvestCompleted);

  // Submissions for this tank
  const tankSubmissions = (db?.submissions || [])
    .filter(s => s.tankId === tank.id || s.tankName === tank.name)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const filterSubmissions = (type) => {
    return tankSubmissions.filter(s => {
      const st = (s.testType || s.recordType || '').toUpperCase();
      return st.includes(type.toUpperCase());
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
  const presentFCR = (totalFeedUsed > 0 && presentBiomass > 0)
    ? (totalFeedUsed / presentBiomass).toFixed(2)
    : (latestFeedTest?.data?.fcr || tank.fcr || '1.14');

  // Present Estimated Survival %
  const presentSurvivalPct = (seedStocked > 0 && presentBiomass > 0)
    ? Math.min(99.5, ((presentBiomass * 1000) / (seedStocked * (parseFloat(tank.abw || latestFeedTest?.data?.abw || 18.4) || 18.4)) * 100)).toFixed(2)
    : '76.33';

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
  const weeklyBreakdown = getTankWeeklyTestBreakdown(tank, db?.submissions);

  return (
    <div style={styles.pageContainer}>
      {/* ========================================================= */}
      {/* 1. PAGE HEADER */}
      {/* ========================================================= */}
      <div style={styles.topHeaderBar}>
        <button 
          type="button"
          style={styles.backButton}
          onClick={() => farmer?.id ? navigate(`/farmers/${farmer.id}`) : navigate('/farmers')}
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
                setModalInitialType('HARVEST_ENTRY');
                setIsRecordModalOpen(true);
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
      {/* 2. FARMER INFORMATION CARD */}
      {/* ========================================================= */}
      <div style={styles.farmerCard}>
        <div style={styles.farmerHeaderRow}>
          <div>
            <h2 style={styles.farmerPrimaryName}>{farmer?.name || 'Ravi'}</h2>
          </div>

          <div style={styles.technicianBadge}>
            <User size={14} color="#1A2FB8" />
            <span>Assigned: <strong>{farmer?.assignedAgent || 'Agent A'}</strong></span>
          </div>
        </div>

        <div style={styles.farmerDivider} />

        <div style={styles.farmerDetailsGrid}>
          <div style={styles.farmerInfoCol}>
            <span style={styles.infoLabel}>Phone</span>
            <div style={styles.infoValueRow}>
              <Phone size={15} color="#1A2FB8" />
              <span style={styles.infoValueText}>{farmer?.phone || '+91 9876543211'}</span>
            </div>
          </div>

          <div style={styles.farmerInfoCol}>
            <span style={styles.infoLabel}>Village</span>
            <div style={styles.infoValueRow}>
              <MapPin size={15} color="#16A34A" />
              <span style={styles.infoValueText}>{farmer?.location || 'Chinnamiram'}</span>
            </div>
          </div>

          <div style={styles.farmerInfoCol}>
            <span style={styles.infoLabel}>Assigned Tanks</span>
            <div style={styles.infoValueRow}>
              <Layers size={15} color="#475569" />
              <span style={styles.infoValueText}>{assignedTanksText}</span>
            </div>
          </div>

          <div style={styles.farmerInfoCol}>
            <span style={styles.infoLabel}>Assigned Technician</span>
            <div style={styles.infoValueRow}>
              <ShieldCheck size={15} color="#0284C7" />
              <span style={styles.infoValueText}>{farmer?.assignedAgent || 'Agent A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. TANK INFORMATION CARD */}
      {/* ========================================================= */}
      <div style={styles.tankCard}>
        <div style={styles.tankTopRow}>
          <div style={styles.tankTitleGroup}>
            <h1 style={styles.tankMainTitle}>{tank.name || 'Tank 3'}</h1>
            <span style={styles.speciesPillBadge}>{tank.species || 'Vannamei'}</span>
          </div>

          {hasFinalHarvest ? (
            <span style={{ ...styles.activeStatusPill, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8' }}>
              <CheckCircle2 size={13} strokeWidth={2.4} color="#1D4ED8" />
              <span>Harvest Completed</span>
            </span>
          ) : tank.testStatus === 'Due' || tank.isDue ? (
            <span style={{ ...styles.activeStatusPill, backgroundColor: '#FEF3C7', borderColor: '#FDE68A', color: '#D97706' }}>
              <Clock size={13} strokeWidth={2.4} color="#D97706" />
              <span>Weekly Test Due</span>
            </span>
          ) : (
            <span style={styles.activeStatusPill}>
              <CheckCircle2 size={13} strokeWidth={2.4} />
              <span>Active • Up to date</span>
            </span>
          )}
        </div>

        <div style={styles.tankSpecsStrip}>
          <div style={styles.tankSpecItem}>
            <span style={styles.tankSpecLabel}>Pond Size</span>
            <span style={styles.tankSpecValue}>{tank.acres || tank.area || '2.5'} Acres</span>
          </div>

          <div style={styles.specSeparator} />

          <div style={styles.tankSpecItem}>
            <span style={styles.tankSpecLabel}>Current DOC</span>
            <span style={{ ...styles.tankSpecValue, color: '#1A2FB8' }}>{cultureDays} Days</span>
          </div>

          <div style={styles.specSeparator} />

          <div style={styles.tankSpecItem}>
            <span style={styles.tankSpecLabel}>Weekly Status</span>
            <span style={{ ...styles.tankSpecValue, color: hasFinalHarvest ? '#1D4ED8' : (tank.testStatus === 'Due' || tank.isDue ? '#D97706' : '#16A34A') }}>
              {hasFinalHarvest ? 'Harvest Completed' : (tank.testStatus === 'Due' || tank.isDue ? 'Test Due (Mon-Sun)' : 'Completed (Mon-Sun)')}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3.5. WEEKLY ROUTINE TESTS CHECKLIST (Mon - Sun) */}
      {/* ========================================================= */}
      {!hasFinalHarvest && (
        <div style={styles.weeklyTestsCard}>
          <div style={styles.weeklyHeaderRow}>
            <div>
              <span style={styles.weeklyCardTag}>WEEKLY TEST SCHEDULE • MON - SUN</span>
              <h3 style={styles.weeklyCardHeading}>
                Weekly Routine Tests ({weeklyBreakdown.completedCount}/{weeklyBreakdown.totalTestsCount} Done)
              </h3>
            </div>
            <span style={{
              ...styles.weeklyStatusBadge,
              backgroundColor: weeklyBreakdown.allUpToDate ? '#DCFCE7' : '#FEF3C7',
              color: weeklyBreakdown.allUpToDate ? '#15803D' : '#D97706',
              borderColor: weeklyBreakdown.allUpToDate ? '#86EFAC' : '#FDE68A',
            }}>
              {weeklyBreakdown.allUpToDate ? '✓ All Tests Done This Week' : `${weeklyBreakdown.dueCount} Tests Due This Week`}
            </span>
          </div>

          <div style={styles.weeklyGrid}>
            {ROUTINE_TEST_TYPES.map((test) => {
              const isCompleted = weeklyBreakdown.completedTests.some(ct => ct.key === test.key);
              const completedRecord = weeklyBreakdown.completedTests.find(ct => ct.key === test.key);

              return (
                <div 
                  key={test.key}
                  style={{
                    ...styles.weeklyItemCard,
                    borderColor: isCompleted ? '#86EFAC' : '#FDE68A',
                    backgroundColor: isCompleted ? '#F0FDF4' : '#FFFDF5',
                  }}
                  onClick={() => {
                    if (!isCompleted) {
                      setModalInitialType(test.key);
                      setIsRecordModalOpen(true);
                    }
                  }}
                >
                  <div style={styles.weeklyItemLeft}>
                    <div style={{
                      ...styles.weeklyIconBadge,
                      backgroundColor: isCompleted ? '#DCFCE7' : '#FEF3C7',
                      color: isCompleted ? '#16A34A' : '#D97706',
                    }}>
                      {isCompleted ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                    </div>
                    <div>
                      <span style={styles.weeklyItemName}>{test.label}</span>
                      <span style={styles.weeklyItemStatus}>
                        {isCompleted ? `Completed (${completedRecord?.completedAt || 'This Week'})` : 'Due this week • Click to record'}
                      </span>
                    </div>
                  </div>

                  <div style={styles.weeklyItemRight}>
                    {isCompleted ? (
                      <span style={styles.completedPill}>✓ Done</span>
                    ) : (
                      <button 
                        type="button"
                        style={styles.recordNowBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalInitialType(test.key);
                          setIsRecordModalOpen(true);
                        }}
                      >
                        <Plus size={12} strokeWidth={2.5} /> Record
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. QUICK PERFORMANCE SUMMARY (6 Cards Grid) */}
      {/* ========================================================= */}
      <div style={styles.summaryGrid}>
        {/* Card 1: Seed Stocked */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiIconWrap}>
            <Fish size={18} color="#1A2FB8" />
          </div>
          <div style={styles.kpiContent}>
            <span style={styles.kpiLabel}>Seed Stocked</span>
            <div style={styles.kpiValue}>{seedStocked.toLocaleString()}</div>
            <span style={styles.kpiFootnote}>Baseline Stocking</span>
          </div>
        </div>

        {/* Card 2: Total Harvested */}
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconWrap, backgroundColor: '#EFF6FF' }}>
            <Scale size={18} color="#2563EB" />
          </div>
          <div style={styles.kpiContent}>
            <span style={styles.kpiLabel}>Total Harvested</span>
            <div style={{ ...styles.kpiValue, color: hasFinalHarvest ? '#0F172A' : '#94A3B8' }}>
              {hasFinalHarvest ? totalHarvestedSeed.toLocaleString() : '--'}
            </div>
            <span style={styles.kpiFootnote}>
              {hasFinalHarvest ? 'Cumulative Count' : 'Pending Final Harvest'}
            </span>
          </div>
        </div>

        {/* Card 3: Present Biomass / Total Harvest Weight */}
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconWrap, backgroundColor: '#F0FDF4' }}>
            <TrendingUp size={18} color="#16A34A" />
          </div>
          <div style={styles.kpiContent}>
            <span style={styles.kpiLabel}>
              {hasFinalHarvest ? 'Total Harvest Weight' : 'Present Biomass'}
            </span>
            <div style={{ ...styles.kpiValue, color: '#16A34A' }}>
              {hasFinalHarvest ? `${totalBiomass.toLocaleString()} kg` : `${presentBiomass.toLocaleString()} kg`}
            </div>
            <span style={styles.kpiFootnote}>
              {hasFinalHarvest ? 'Cumulative Harvest Weight' : 'Current Standing Biomass'}
            </span>
          </div>
        </div>

        {/* Card 4: Feed Used */}
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconWrap, backgroundColor: '#FEF3C7' }}>
            <Wheat size={18} color="#D97706" />
          </div>
          <div style={styles.kpiContent}>
            <span style={styles.kpiLabel}>Feed Used</span>
            <div style={styles.kpiValue}>{totalFeedUsed.toLocaleString()} kg</div>
            <span style={styles.kpiFootnote}>Cumulative Feed</span>
          </div>
        </div>

        {/* Card 5: Present FCR / Final FCR */}
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconWrap, backgroundColor: '#F3E8FF' }}>
            <Activity size={18} color="#7E22CE" />
          </div>
          <div style={styles.kpiContent}>
            <span style={styles.kpiLabel}>
              {hasFinalHarvest ? 'Final FCR' : 'Present FCR'}
            </span>
            <div style={{ ...styles.kpiValue, color: '#1A2FB8' }}>
              {hasFinalHarvest ? finalFCR : presentFCR}
            </div>
            <span style={styles.kpiFootnote}>
              {hasFinalHarvest ? 'Feed Conversion Ratio' : 'Current Feed Conversion'}
            </span>
          </div>
        </div>

        {/* Card 6: Present Survival % / Final Survival % */}
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconWrap, backgroundColor: '#DCFCE7' }}>
            <CheckCircle2 size={18} color="#15803D" />
          </div>
          <div style={styles.kpiContent}>
            <span style={styles.kpiLabel}>
              {hasFinalHarvest ? 'Final Survival %' : 'Present Survival %'}
            </span>
            <div style={{ ...styles.kpiValue, color: '#15803D' }}>
              {hasFinalHarvest ? `${finalSurvivalPct}%` : `${presentSurvivalPct}%`}
            </div>
            <span style={styles.kpiFootnote}>
              {hasFinalHarvest ? 'Crop Recovery Rate' : 'Current Estimated Rate'}
            </span>
          </div>
        </div>
      </div>

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
      {/* 6. TAB CONTENT: HARVEST HISTORY */}
      {/* ========================================================= */}
      {activeTab === 'HARVEST' && (
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeaderRow}>
            <div>
              <h3 style={styles.sectionTitle}>Harvest History</h3>
              <span style={styles.sectionSub}>Sequential timeline of recorded partial and final harvests</span>
            </div>

            {!hasFinalHarvest ? (
              <button 
                type="button" 
                style={styles.addHarvestActionBtn}
                onClick={() => {
                  setModalInitialType('HARVEST_ENTRY');
                  setIsRecordModalOpen(true);
                }}
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Record Harvest</span>
              </button>
            ) : (
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#1E3A8A', backgroundColor: '#EFF6FF', padding: '6px 12px', borderRadius: '8px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={13} color="#1D4ED8" /> Final Harvest Done
              </span>
            )}
          </div>

          {/* Timeline / Table of Harvest Events */}
          {sequencedHarvests.length === 0 ? (
            <div style={{ ...styles.emptyStateBox, margin: '20px 0' }}>
              <Scale size={32} color="#94A3B8" />
              <p style={{ margin: '8px 0 0 0', fontWeight: '600', color: '#475569' }}>
                No harvest records logged for this tank yet.
              </p>
              <span style={{ fontSize: '13px', color: '#94A3B8' }}>
                Use "Record Harvest" to enter partial or final harvest data.
              </span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: '16px' }}>
              <table style={styles.harvestTable}>
                <thead>
                  <tr style={styles.tableHeadRow}>
                    <th style={styles.tableHeadCell}>Harvest</th>
                    <th style={styles.tableHeadCell}>Harvest Date</th>
                    <th style={styles.tableHeadCell}>DOC</th>
                    <th style={styles.tableHeadCell}>ABW</th>
                    <th style={styles.tableHeadCell}>Harvested Number</th>
                    <th style={styles.tableHeadCell}>Harvested Biomass</th>
                    <th style={styles.tableHeadCell}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sequencedHarvests.map((h, idx) => (
                    <tr key={h.id || idx} style={styles.tableBodyRow}>
                      <td style={styles.tableCell}>
                        <span style={{
                          ...styles.harvestStagePill,
                          backgroundColor: h.isFinal ? '#DCFCE7' : '#EFF6FF',
                          color: h.isFinal ? '#15803D' : '#1A2FB8',
                          borderColor: h.isFinal ? '#86EFAC' : '#BFDBFE',
                        }}>
                          {h.displayTitle}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={styles.dateText}>{h.date}</span>
                      </td>
                      <td style={styles.tableCell}>
                        <strong style={{ color: '#0F172A' }}>{h.doc}</strong>
                      </td>
                      <td style={styles.tableCell}>
                        <strong style={{ color: '#0F172A' }}>{h.abw} gm</strong>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={styles.numberBold}>{parseFloat(h.harvestedNumber || 0).toLocaleString()}</span>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={styles.biomassBold}>{parseFloat(h.harvestedBiomass || 0).toLocaleString()} kg</span>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={styles.completedStatusBadge}>
                          ✓ Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pending Final Harvest Info Note */}
          {!hasFinalHarvest && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#F8FAFC',
              border: '1.5px dashed #CBD5E1',
              borderRadius: '10px',
              fontSize: '12.5px',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Info size={18} color="#64748B" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#0F172A' }}>Final Harvest Pending:</strong> This tank is in active culture. Final harvest data is not shown because the final harvest has not been recorded yet.
              </div>
            </div>
          )}

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
      {/* TAB CONTENT: FIELD RECORDS (Water, Feed, Biomass, Medication, Mortality, Farm Activity) */}
      {/* ========================================================= */}
      {['WATER', 'FEED', 'BIOMASS', 'MEDICATION', 'MORTALITY', 'ACTIVITY'].includes(activeTab) && (
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeaderRow}>
            <div>
              <h3 style={styles.sectionTitle}>
                {TABS.find(t => t.id === activeTab)?.label} History
              </h3>
              <span style={styles.sectionSub}>Submitted field test history for {tank.name}</span>
            </div>
          </div>

          {(() => {
            const tabRecords = tankSubmissions.filter(s => {
              const st = (s.testType || s.recordType || '').toUpperCase();
              if (activeTab === 'WATER') return st.includes('WATER');
              if (activeTab === 'FEED') return st.includes('FEED');
              if (activeTab === 'BIOMASS') return st.includes('BIOMASS');
              if (activeTab === 'MEDICATION') return st.includes('MEDICAT') || st.includes('MEDICINE');
              if (activeTab === 'MORTALITY') return st.includes('MORTALITY');
              if (activeTab === 'ACTIVITY') return st.includes('ACTIVITY') || st.includes('FARM');
              return true;
            });

            return (
              <div style={{ marginTop: '16px' }}>
                {tabRecords.length === 0 ? (
                  <div style={styles.emptyStateBox}>
                    <Clock size={32} color="#94A3B8" />
                    <p style={{ margin: '8px 0 0 0', fontWeight: '600', color: '#475569' }}>
                      No {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} records logged for this tank.
                    </p>
                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>
                      Test history logs will appear here once submitted.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {tabRecords.map((rec) => (
                      <div 
                        key={rec.id}
                        style={styles.recordListItem}
                        onClick={() => setSelectedReadRecord(rec)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={styles.recordIconCircle}>
                            <FileText size={16} color="#1A2FB8" />
                          </div>
                          <div>
                            <span style={styles.recordItemTitle}>{rec.testType || rec.recordType || 'Field Test'}</span>
                            <div style={styles.recordItemTime}>{rec.date} • {rec.time || '10:30 AM'} • By {rec.agentName || 'Technician'}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={styles.verifiedTag}>✓ Verified</span>
                          <ChevronRight size={16} color="#94A3B8" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

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

              {selectedReadRecord.data && (
                <div style={styles.dataContainer}>
                  <div style={styles.dataHeading}>Logged Field Parameters</div>
                  {Object.entries(selectedReadRecord.data).map(([k, v]) => (
                    typeof v === 'object' ? null : (
                      <div key={k} style={styles.dataRow}>
                        <span style={styles.dataKey}>{k.replace(/([A-Z])/g, ' $1')}:</span>
                        <span style={styles.dataVal}>{String(v)}</span>
                      </div>
                    )
                  ))}
                </div>
              )}
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
    </div>
  );
};

const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
    paddingBottom: '40px',
    boxSizing: 'border-box',
  },
  topHeaderBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '4px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#0F172A',
    fontWeight: '700',
    fontSize: '15px',
    cursor: 'pointer',
    padding: '4px 0',
  },
  harvestActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1.5px solid #BFDBFE',
    height: '42px',
    padding: '0 18px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.15s ease',
  },
  primaryNewRecordBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    height: '42px',
    padding: '0 20px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(26, 47, 184, 0.25)',
  },
  farmerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: 'clamp(14px, 3.5vw, 24px)',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    boxSizing: 'border-box',
    width: '100%',
  },
  farmerHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '10px',
  },
  cardHeaderSmallTag: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    display: 'block',
  },
  farmerPrimaryName: {
    fontSize: 'clamp(18px, 4vw, 22px)',
    fontWeight: '800',
    color: '#0F172A',
    margin: '2px 0 0 0',
    letterSpacing: '-0.2px',
  },
  technicianBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    color: '#1A2FB8',
    padding: '6px 12px',
    borderRadius: '10px',
    fontSize: '12.5px',
  },
  farmerDivider: {
    height: '1px',
    backgroundColor: '#F1F5F9',
    margin: '14px 0',
  },
  farmerDetailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))',
    gap: '14px',
  },
  farmerInfoCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  infoLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  infoValueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  infoValueText: {
    fontSize: '13.5px',
    fontWeight: '600',
    color: '#0F172A',
  },
  tankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: 'clamp(14px, 3.5vw, 24px)',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    boxSizing: 'border-box',
    width: '100%',
  },
  tankTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  tankTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  tankMainTitle: {
    fontSize: 'clamp(20px, 4.5vw, 24px)',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  speciesPillBadge: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#1A2FB8',
    backgroundColor: '#F0F4FF',
    border: '1px solid #CBD2FF',
    padding: '3px 8px',
    borderRadius: '8px',
  },
  activeStatusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    border: '1px solid #86EFAC',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  tankSpecsStrip: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '14px',
    paddingTop: '14px',
    borderTop: '1px solid #F1F5F9',
    flexWrap: 'wrap',
  },
  tankSpecItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '70px',
  },
  tankSpecLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tankSpecValue: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
  },
  specSeparator: {
    width: '1px',
    height: '20px',
    backgroundColor: '#E2E8F0',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 135px), 1fr))',
    gap: '10px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '14px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '10px',
    boxSizing: 'border-box',
  },
  kpiIconWrap: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    backgroundColor: '#F0F4FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  kpiLabel: {
    fontSize: '11.5px',
    fontWeight: '600',
    color: '#64748B',
  },
  kpiValue: {
    fontSize: 'clamp(17px, 3.5vw, 20px)',
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: '-0.2px',
  },
  kpiFootnote: {
    fontSize: '10.5px',
    color: '#94A3B8',
    marginTop: '1px',
  },
  tabsContainer: {
    width: '100%',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    paddingBottom: '2px',
  },
  tabsScrollRow: {
    display: 'flex',
    gap: '8px',
    paddingBottom: '4px',
    width: 'max-content',
    minWidth: '100%',
  },
  tabButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: '38px',
    padding: '0 14px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    fontSize: '12.5px',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    boxSizing: 'border-box',
    flexShrink: 0,
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
  weeklyTestsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: 'clamp(14px, 3.5vw, 20px)',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    boxSizing: 'border-box',
    width: '100%',
  },
  weeklyHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '14px',
  },
  weeklyCardTag: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
    display: 'block',
  },
  weeklyCardHeading: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: '2px 0 0 0',
  },
  weeklyStatusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '20px',
    border: '1px solid',
    fontSize: '12px',
    fontWeight: '700',
  },
  weeklyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
    gap: '10px',
  },
  weeklyItemCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  weeklyItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  weeklyIconBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  weeklyItemName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
    display: 'block',
  },
  weeklyItemStatus: {
    fontSize: '11px',
    color: '#64748B',
    display: 'block',
    marginTop: '1px',
  },
  weeklyItemRight: {
    display: 'flex',
    alignItems: 'center',
  },
  completedPill: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  recordNowBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  }
};

export default TankDetails;
