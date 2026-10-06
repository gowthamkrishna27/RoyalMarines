import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Phone, MapPin, User, CheckCircle2, 
  Scale, Wheat, Fish, Activity, TrendingUp, Droplets, 
  Skull, Pill, ClipboardList, Camera, Clock, Lock, 
  X, Info, Sparkles, FileText, ChevronRight, Layers, ShieldCheck
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import QuickRecordModal from '../components/QuickRecordModal';
import HarvestCompletedModal from '../../asm/components/HarvestCompletedModal';
import TakeHarvestModal from '../../asm/components/TakeHarvestModal';
import { getTankWeeklySchedule } from '../utils/testScheduleHelper';

// Standard baseline harvest records for clean state
const defaultTankHarvests = [];

const TABS = [
  { id: 'OVERVIEW', label: 'Overview', icon: Layers },
  { id: 'WATER', label: 'Water', icon: Droplets },
  { id: 'FEED', label: 'Feed', icon: Wheat },
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
  const isIncharge = location.pathname.startsWith('/incharge');
  const { getTankById, getFarmerById, db } = useMockData();
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);
  const [isTakeHarvestModalOpen, setIsTakeHarvestModalOpen] = useState(false);
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

  const stateTank = location.state?.tank;
  const stateFarmer = location.state?.farmer;

  const resolvedTank = (getTankById ? getTankById(tankId) : null) || 
    db?.tanks?.find(t => t.id === tankId || String(t.id).toLowerCase() === String(tankId).toLowerCase() || t.name === tankId) || 
    stateTank || {
      id: tankId || 'T1',
      name: tankId && tankId.startsWith('T') ? `Tank ${tankId.replace('T', '')}` : (tankId || 'Tank 1'),
      species: 'Vannamei (Shrimp)',
      acres: '11',
      area: '11',
      farmerId: stateFarmer?.id || '',
      status: 'Active',
      seedStocked: 95000,
      stockingDate: '2026-06-20',
      waterSource: 'Canal',
      salinity: '14 ppt',
      soilType: 'Clay Loam'
    };

  const tank = resolvedTank;
  const farmer = stateFarmer || (tank?.farmerId ? ((getFarmerById ? getFarmerById(tank.farmerId) : null) || db?.farmers?.find(f => f.id === tank.farmerId)) : null) || {
    id: 'F1',
    name: tank.farmerName || 'Farmer',
    phone: '+91 9876543231',
    location: 'Chinnamiram East',
    assignedAgent: 'Ramesh'
  };

  // Farmer assigned tanks count
  const farmerTanks = farmer ? (db?.tanks || []).filter(t => t.farmerId === farmer.id) : [];
  const assignedTanksCount = farmerTanks.length > 0 ? farmerTanks.length : 2;
  const assignedTanksText = assignedTanksCount === 1 ? '1 Tank' : `${assignedTanksCount} Tanks`;

  // Listen for harvest updates
  useEffect(() => {
    const handleStoreUpdate = (e) => {
      if (e.detail) setHarvestStore(e.detail);
    };
    window.addEventListener('harvestStoreUpdated', handleStoreUpdate);
    return () => window.removeEventListener('harvestStoreUpdated', handleStoreUpdate);
  }, []);

  const storeKey = `${farmer?.id || ''}_${tank.id}`;
  const tankStoreData = harvestStore[storeKey];

  // Retrieve harvests from local storage
  let rawHarvests = [];
  if (tankStoreData && Array.isArray(tankStoreData.harvests)) {
    rawHarvests = tankStoreData.harvests;
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
    } else if (isIncharge) {
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
                setIsTakeHarvestModalOpen(true);
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
                    setIsTakeHarvestModalOpen(true);
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
      {/* TAB CONTENT: FIELD RECORDS (Water, Feed, Biomass, etc.) */}
      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* TAB CONTENT: FIELD RECORDS (Water, Feed, Biomass, etc.) */}
      {/* ========================================================= */}
      {['WATER', 'FEED', 'BIOMASS', 'MEDICATION', 'MORTALITY', 'ACTIVITY', 'REPORTS'].includes(activeTab) && (() => {
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
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} /> Closed
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

      {/* ========================================================= */}
      {/* TAKE NEW HARVEST REPORT MODAL (PARTIAL / FINAL) */}
      {/* ========================================================= */}
      {isTakeHarvestModalOpen && (
        <TakeHarvestModal
          isOpen={isTakeHarvestModalOpen}
          onClose={() => {
            setIsTakeHarvestModalOpen(false);
            const updated = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
            setHarvestStore(updated);
          }}
          tank={tank}
          farmer={farmer}
          onSuccess={() => {
            const updated = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
            setHarvestStore(updated);
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
