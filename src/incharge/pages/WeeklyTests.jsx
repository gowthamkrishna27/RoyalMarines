import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { 
  Search, Filter, Calendar, CheckCircle2, Clock, AlertTriangle, UserCheck,
  Eye, X, ArrowLeft, Droplets, TestTube, Users, ShieldCheck, Activity, ChevronRight, 
  Phone, MapPin, Layers, Award, Wheat, Skull, Pill, ClipboardList, Camera, Check, Info, AlertCircle, Bell
} from 'lucide-react';

const WeeklyTests = () => {
  const [dateFrom, setDateFrom] = useState('2026-09-01');
  const [dateTo, setDateTo] = useState('2026-09-01');
  const [selectedTechnician, setSelectedTechnician] = useState('ALL');
  const [selectedAgentForHistory, setSelectedAgentForHistory] = useState(null);
  const [selectedTestDetail, setSelectedTestDetail] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [dueTestsModalAgent, setDueTestsModalAgent] = useState(null);
  const [remindedTanks, setRemindedTanks] = useState({});
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyFilterType, setHistoryFilterType] = useState('ALL');

  const { db, getFarmersByAgentId, getTanksByFarmerId, getSubmissionsByAgentId, getAgentsByInchargeId, addNotification } = useMockData();
  
  const inchargeAgentsList = getAgentsByInchargeId ? getAgentsByInchargeId('INC001') : (db?.agents || []);
  const agents = inchargeAgentsList.map(a => {
    const farmers = getFarmersByAgentId(a.id);
    const tanks = farmers.reduce((acc, f) => acc + getTanksByFarmerId(f.id).length, 0);
    const tests = getSubmissionsByAgentId(a.id).length;
    const due = Math.max(0, Math.floor(tanks * 0.15));
    const overdue = Math.max(0, Math.floor(tanks * 0.05));
    const compliance = tanks > 0 ? Math.min(100, Math.round((tests / (tests + due + overdue || 1)) * 100)) : 100;
    return { 
      ...a, 
      mobile: a.phone || a.mobile || '+91 98480 22334',
      farmers: farmers.length, 
      tanks, 
      tests: Math.max(tests, 15), 
      due, 
      overdue, 
      compliance 
    };
  });

  // 0. Define Incharge "By Me" entity
  const inchargeEntity = {
    id: 'BY_ME',
    name: 'By me (Incharge Ravi Kumar)',
    shortName: 'Ravi Kumar (Incharge)',
    role: 'Area Incharge / ASM',
    mobile: '+91 94401 88990',
    locality: 'Cluster Head • All Areas',
    farmers: (db?.farmers || []).length,
    tanks: (db?.tanks || []).length,
    tests: 18,
    due: 2,
    overdue: 0,
    isMe: true
  };
  
  // Filter agents list based on Field Technician dropdown
  const filteredAgents = (() => {
    if (selectedTechnician === 'BY_ME') {
      return [inchargeEntity];
    }
    if (selectedTechnician === 'ALL' || !selectedTechnician) {
      return [inchargeEntity, ...agents];
    }
    return agents.filter(a => a.id === selectedTechnician);
  })();

  const totalAssignedTanks = agents.reduce((acc, a) => acc + a.tanks, 0);
  const totalCompletedTests = agents.reduce((acc, a) => acc + a.tests, 0) + inchargeEntity.tests;
  const totalDueTests = agents.reduce((acc, a) => acc + a.due, 0);
  const totalOverdueTests = agents.reduce((acc, a) => acc + a.overdue, 0);

  // Helper to fetch due tanks for reminding agents
  const getDueTanksForWeeklyAgent = (agent) => {
    if (!agent || agent.isMe) return [];
    const farmers = getFarmersByAgentId(agent.id);
    const list = [];
    farmers.forEach((farmer, fIdx) => {
      const tanks = getTanksByFarmerId(farmer.id);
      tanks.forEach((tank, tIdx) => {
        if (tank.status !== 'Harvested') {
          const isDueOrOverdue = tank.testStatus === 'Due' || tank.testStatus === 'Overdue' || (!tank.testStatus && tIdx === 0);
          if (isDueOrOverdue) {
            const isOverdue = tank.testStatus === 'Overdue' || (tIdx === 1);
            list.push({
              tankId: tank.id || `T-DUE-${farmer.id}-${tIdx + 1}`,
              tankName: tank.name || `Tank ${tIdx + 1}`,
              farmerId: farmer.id,
              farmerName: farmer.name,
              farmerPhone: farmer.phone || '+91 98480 12345',
              farmerLocality: farmer.location || farmer.village || agent.locality || 'Bhimavaram',
              agentId: agent.id,
              agentName: agent.name,
              agentPhone: agent.mobile || agent.phone,
              testStatus: isOverdue ? 'Overdue' : 'Due',
              isOverdue,
              scheduledDate: isOverdue ? '18 Aug 2026' : '26 Aug 2026',
              doc: tank.doc || (42 + ((fIdx * 12 + tIdx * 14) % 45)),
              testType: (fIdx + tIdx) % 2 === 0 ? 'Water Quality (pH, DO, Salinity)' : 'Feed & Check Tray Audit'
            });
          }
        }
      });
    });
    if (list.length === 0) {
      const f = farmers[0] || { name: 'Appala Raju', phone: '+91 98765 43234', village: agent.locality || 'Bhimavaram' };
      list.push({
        tankId: `T-DUE-${agent.id}-1`,
        tankName: 'Tank 1',
        farmerId: f.id || 'F101',
        farmerName: f.name,
        farmerPhone: f.phone || '+91 98765 43234',
        farmerLocality: f.village || agent.locality || 'Bhimavaram',
        agentId: agent.id,
        agentName: agent.name,
        agentPhone: agent.mobile || agent.phone,
        testStatus: 'Due',
        isOverdue: false,
        scheduledDate: '26 Aug 2026',
        doc: 48,
        testType: 'Water Quality (pH, DO, Salinity)'
      });
    }
    return list;
  };

  // Helper to fetch and build rich, verified test history across ALL 7 Test Categories
  const getAgentTestHistory = (agent) => {
    if (!agent) return [];
    const isMe = agent.id === 'BY_ME' || agent.isMe;
    const agentFarmers = isMe ? (db?.farmers || []) : (getFarmersByAgentId(agent.id) || []);
    const f1 = agentFarmers[0] || { name: 'Bhaskar Rao', locality: 'Chinnamiram' };
    const f2 = agentFarmers[1] || { name: 'Narasimha Murthy', locality: 'Chinnamiram East' };
    const f3 = agentFarmers[2] || { name: 'Koteswara Rao', locality: 'Undi Rural' };
    const f4 = agentFarmers[3] || { name: 'Srinivasa Rao', locality: 'Bhimavaram Central' };

    const prefix = isMe ? 'INC' : agent.id;
    const actorName = isMe ? 'Me (ASM Ravi Kumar - Incharge)' : agent.name;

    // Full 7-category test seed records
    return [
      // 1. Water Analysis
      {
        id: `TEST-${prefix}-01`,
        date: '2026-09-01',
        time: '09:15 AM',
        doc: 45,
        technicianId: agent.id,
        technicianName: actorName,
        farmerId: f1.id || 'F101',
        farmer: f1.name,
        locality: f1.locality || 'Chinnamiram',
        tankId: 'T101',
        tank: 'Tank 1',
        testType: 'Water Analysis',
        status: 'Approved',
        data: {
          doc: '45',
          date: '2026-09-01',
          salinity: '16',
          ph: '7.8',
          alkalinity: '140',
          hardness: '4800',
          ammonia: '0.05',
          nitrite: '0.02',
          k: '171.2',
          do: '5.6',
          h2s: '0.005',
          cl: '0.01',
          fe: '0.01',
          waterColor: 'Light Green',
          notes: 'Optimal water quality. Alkalinity and mineral balance (Hardness/K) maintained within target ranges.'
        },
        readings: {
          ph: '7.8',
          do: '5.6 ppm',
          salinity: '16 ppt',
          ammonia: '0.05 ppm',
          alkalinity: '140 ppm',
          hardness: '4,800 ppm',
          k: '171.2 ppm',
          waterColor: 'Light Green'
        },
        notes: 'Water parameters stable. High DO maintained with paddle wheel aerators.'
      },

      // 2. Feed Test
      {
        id: `TEST-${prefix}-02`,
        date: '2026-08-31',
        time: '03:45 PM',
        doc: 66,
        technicianId: agent.id,
        technicianName: actorName,
        farmerId: f1.id || 'F101',
        farmer: f1.name,
        locality: f1.locality || 'Chinnamiram',
        tankId: 'T101',
        tank: 'Tank 1',
        testType: 'Feed Test',
        status: 'Approved',
        data: {
          doc: '66',
          entryDate: '2026-08-31',
          seedCountLac: '2.50',
          abw: '21.9',
          dayFeed: '48.0',
          cumulativeFeed: '1500.0',
          totalBiomass: '1250.0',
          fcr: '1.20',
          chTrFeed: '250',
          chTrTime: '1 hr 45 min',
          remarks: 'Strong feed response observed in check tray. Gut fullness 95%.'
        },
        readings: {
          ph: '8.0',
          do: '4.9 ppm',
          salinity: '18 ppt',
          ammonia: '0.08 ppm',
          abw: '21.9g',
          biomass: '1,250 kg',
          fcr: '1.20',
          chTrFeed: '250g',
          chTrTime: '1 hr 45 min'
        },
        notes: 'Feed intake optimal across check trays. Gut fullness 95%.'
      },

      // 3. Disease Observation
      {
        id: `TEST-${prefix}-03`,
        date: '2026-08-30',
        time: '10:30 AM',
        doc: 72,
        technicianId: agent.id,
        technicianName: actorName,
        farmerId: f2.id || 'F102',
        farmer: f2.name,
        locality: f2.locality || 'Chinnamiram East',
        tankId: 'T103',
        tank: 'Tank 3',
        testType: 'Disease Observation',
        status: 'Approved',
        data: {
          doc: '72',
          whiteMuscle: 'Negative',
          whiteGut: 'Negative',
          moulting: 'Normal / Active',
          cramping: 'Negative',
          blackGill: 'Negative',
          vibriosis: 'Negative / Clear',
          ehp: 'Negative',
          hardShell: '94% Normal Hard',
          softShell: '6% (Regular Molt)',
          blackSpots: 'Negative',
          asds: 'Negative',
          wssv: 'Negative',
          looseShell: 'Negative',
          overallStatus: 'Healthy & Disease-Free',
          remarks: 'Hepatopancreas dark and full. Excellent antennae length and swimming vigor.'
        },
        readings: {
          healthStatus: '100% Disease-Free',
          wssv: 'Negative',
          ehp: 'Negative',
          whiteGut: 'Negative',
          moulting: 'Active / Normal',
          blackGill: 'Negative',
          shellQuality: '94% Hard Shell'
        },
        notes: 'Full disease panel checked. Zero pathology detected across all 13 health indicators.'
      },

      // 4. Mortality Test
      {
        id: `TEST-${prefix}-04`,
        date: '2026-08-29',
        time: '07:30 AM',
        doc: 55,
        technicianId: agent.id,
        technicianName: actorName,
        farmerId: f3.id || 'F103',
        farmer: f3.name,
        locality: f3.locality || 'Undi Rural',
        tankId: 'T105',
        tank: 'Tank 2',
        testType: 'Mortality Test',
        status: 'Approved',
        data: {
          doc: '55',
          dailyMortality: '6 pcs (Normal)',
          cumulativeMortality: '85 pcs',
          estimatedSurvival: '94.8%',
          perimeterInspection: 'Clean pond corners / Zero dead shrimp at drainage pit',
          probableCause: 'Normal natural molt loss',
          correctiveAction: 'Aeration boosted during night molt cycle',
          remarks: 'Mortality well below economic threshold. Normal crop cycle.'
        },
        readings: {
          dailyMortality: '6 pcs',
          cumulativeMortality: '85 pcs',
          survivalRate: '94.8%',
          perimeterCheck: 'Clean',
          actionTaken: 'Aeration Maintained'
        },
        notes: 'Morning inspection confirmed minimal mortality (6 pcs). Survival rate robust at 94.8%.'
      },

      // 5. Medication Test
      {
        id: `TEST-${prefix}-05`,
        date: '2026-08-28',
        time: '11:00 AM',
        doc: 60,
        technicianId: agent.id,
        technicianName: actorName,
        farmerId: f4.id || 'F104',
        farmer: f4.name,
        locality: f4.locality || 'Bhimavaram Central',
        tankId: 'T107',
        tank: 'Tank 1',
        testType: 'Medication Test',
        status: 'Approved',
        data: {
          doc: '60',
          medicineName: 'AquaCal Plus & Gut Probiotic (Bacillus subtilis)',
          dosage: '500 g / Acre + 10 g / kg feed binder',
          applicationMethod: 'Feed Top-Dressing (Morning Feed)',
          targetDiagnosis: 'Gut conditioning, molting mineral reinforcement & Vibrio suppression',
          administrationDoc: 'Day 60 DOC',
          clinicalResponse: '100% feed consumed, improved gut thickness after 48 hours',
          remarks: 'Farmer advised to maintain feed binder for 3 consecutive days.'
        },
        readings: {
          medicineName: 'AquaCal Plus Probiotic',
          dosage: '500 g / Acre',
          applicationMode: 'Feed Top-Dressing',
          targetDiagnosis: 'Gut Conditioning',
          clinicalResponse: '100% Feed Intake'
        },
        notes: 'Preventative medication applied as per biosecurity protocols. Excellent gut colonization.'
      },

      // 6. Farm Activity
      {
        id: `TEST-${prefix}-06`,
        date: '2026-08-27',
        time: '04:15 PM',
        doc: 62,
        technicianId: agent.id,
        technicianName: actorName,
        farmerId: f1.id || 'F101',
        farmer: f1.name,
        locality: f1.locality || 'Chinnamiram',
        tankId: 'T101',
        tank: 'Tank 2',
        testType: 'Farm Activity',
        status: 'Approved',
        data: {
          doc: '62',
          activityType: 'Aerator Servicing & Water Exchange',
          equipmentRunning: '8 Paddle Wheel Aerators (18 hrs / day)',
          laborDeployed: '3 Farm Technicians',
          waterExchangeVolume: '10% Bottom Drainage & Fresh Tidal Inflow',
          sludgeDrain: 'Sludge siphon completed at central drainage bowl',
          supervisorSignoff: 'Verified by Field Auditor & Farm Manager',
          remarks: 'Aerator gearboxes greased, water transparency improved to 35 cm.'
        },
        readings: {
          activityType: 'Aerator Maintenance & Exchange',
          laborCount: '3 Techs',
          equipmentHours: '18 hrs / day',
          waterExchange: '10% Volume',
          sludgeDrain: 'Completed'
        },
        notes: 'Routine pond maintenance completed. Sludge cleared from central pit successfully.'
      },

      // 7. Photo Observation (Kept with rich photographic evidence)
      {
        id: `TEST-${prefix}-07`,
        date: '2026-08-26',
        time: '02:30 PM',
        doc: 68,
        technicianId: agent.id,
        technicianName: actorName,
        farmerId: f2.id || 'F102',
        farmer: f2.name,
        locality: f2.locality || 'Chinnamiram East',
        tankId: 'T103',
        tank: 'Tank 3',
        testType: 'Photo Observation',
        status: 'Approved',
        data: {
          doc: '68',
          observationTitle: 'Mid-Cycle Shrimp Growth & Water Transparency Audit',
          locationTag: 'Chinnamiram East Farm Unit',
          gpsCoords: '16.5448° N, 81.5212° E (Verified On-Site)',
          totalPhotos: 3,
          remarks: 'High clarity visual inspection of shrimp batch, cast net haul, and water color.'
        },
        readings: {
          photoCount: '3 Photos',
          specimenCheck: 'Healthy Gut',
          waterVisual: 'Green Plankton',
          gpsVerified: '16.5448° N, 81.5212° E'
        },
        photos: [
          { url: 'https://images.unsplash.com/photo-1559884743-74a57598c6c2?w=600&auto=format&fit=crop&q=80', title: 'Shrimp Specimen Close-Up', caption: 'Full gut, clean rostrum, shiny cuticle.' },
          { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80', title: 'Cast Net Sampling Haul', caption: 'Uniform ABW (21.9g), active jump response.' },
          { url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&auto=format&fit=crop&q=80', title: 'Pond Water Color & Aeration', caption: 'Optimal green bloom, Secchi depth 35 cm.' }
        ],
        notes: 'Photo evidence logged with GPS metadata for farm compliance records.'
      }
    ];
  };

  const rawAgentTests = selectedAgentForHistory ? getAgentTestHistory(selectedAgentForHistory) : [];
  const filteredAgentTests = rawAgentTests.filter(test => {
    const matchesSearch = 
      test.farmer.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      test.tank.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      test.locality.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      test.id.toLowerCase().includes(historySearchTerm.toLowerCase());
    const matchesType = historyFilterType === 'ALL' || test.testType === historyFilterType;
    return matchesSearch && matchesType;
  });

  // Comprehensive 7 test types list
  const testTypesList = [
    'Water Analysis',
    'Feed Test',
    'Disease Observation',
    'Mortality Test',
    'Medication Test',
    'Farm Activity',
    'Photo Observation'
  ];

  // Helper for badge colors per test type
  const getTestTypeBadgeStyle = (type) => {
    switch (type) {
      case 'Water Analysis':
        return { bg: '#EFF6FF', text: '#1A2FB8', border: '#DBEAFE', icon: Droplets };
      case 'Feed Test':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A', icon: Wheat };
      case 'Disease Observation':
        return { bg: '#FFE4E6', text: '#E11D48', border: '#FECDD3', icon: Activity };
      case 'Mortality Test':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA', icon: Skull };
      case 'Medication Test':
        return { bg: '#F3E8FF', text: '#9333EA', border: '#E9D5FF', icon: Pill };
      case 'Farm Activity':
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', icon: ClipboardList };
      case 'Photo Observation':
        return { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD', icon: Camera };
      default:
        return { bg: '#EFF6FF', text: '#1A2FB8', border: '#DBEAFE', icon: TestTube };
    }
  };

  return (
    <>
      <InchargeHeader title="Weekly Tests" />

      <div style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto' }}>
        {/* Quick Summary Bar */}
        <div style={styles.summaryBar}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Monitored Tanks</span>
            <span style={styles.summaryValue}>{totalAssignedTanks}</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Completed Audits</span>
            <span style={{ ...styles.summaryValue, color: '#16A34A' }}>{totalCompletedTests}</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Due This Week</span>
            <span style={{ ...styles.summaryValue, color: '#D97706' }}>{totalDueTests}</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Overdue Samples</span>
            <span style={{ ...styles.summaryValue, color: '#DC2626' }}>{totalOverdueTests}</span>
          </div>
        </div>

        {/* Weekly Test Progress Card */}
        <div style={{ ...styles.mainCard, marginBottom: '20px', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Weekly Test Progress</h3>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '3px 0 0 0' }}>Current Week Cluster Testing Progress</p>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
              78% Completed
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {/* Completed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
                  <span style={{ fontWeight: '700', color: '#0F172A' }}>Completed</span>
                </div>
                <span style={{ fontWeight: '800', color: '#16A34A', fontSize: '13.5px' }}>78%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '78%', height: '100%', backgroundColor: '#16A34A', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Due */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284C7' }} />
                  <span style={{ fontWeight: '700', color: '#0F172A' }}>Due</span>
                </div>
                <span style={{ fontWeight: '800', color: '#0284C7', fontSize: '13.5px' }}>14%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '14%', height: '100%', backgroundColor: '#0284C7', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Overdue */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
                  <span style={{ fontWeight: '700', color: '#0F172A' }}>Overdue</span>
                </div>
                <span style={{ fontWeight: '800', color: '#DC2626', fontSize: '13.5px' }}>5%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '5%', height: '100%', backgroundColor: '#DC2626', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Scheduled */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8B5CF6' }} />
                  <span style={{ fontWeight: '700', color: '#0F172A' }}>Scheduled</span>
                </div>
                <span style={{ fontWeight: '800', color: '#8B5CF6', fontSize: '13.5px' }}>3%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '3%', height: '100%', backgroundColor: '#8B5CF6', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div style={styles.mainCard}>
          {/* Filter Configuration Inputs */}
          <div style={styles.filterGrid}>
            <div>
              <label style={styles.formLabel}>Date From</label>
              <input 
                type="date" 
                value={dateFrom} 
                onChange={e => setDateFrom(e.target.value)} 
                style={styles.formInput} 
              />
            </div>
            <div>
              <label style={styles.formLabel}>Date To</label>
              <input 
                type="date" 
                value={dateTo} 
                onChange={e => setDateTo(e.target.value)} 
                style={styles.formInput} 
              />
            </div>
            <div>
              <label style={styles.formLabel}>Field Technician</label>
              <select 
                style={styles.formInput} 
                value={selectedTechnician} 
                onChange={e => setSelectedTechnician(e.target.value)}
              >
                <option value="ALL">All Technicians & By Me</option>
                <option value="BY_ME">By me</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tests Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Technician / Auditor</th>
                  <th style={styles.th}>Supervised Tanks</th>
                  <th style={styles.th}>Completed Audits</th>
                  <th style={styles.th}>Due This Week</th>
                  <th style={styles.th}>Overdue</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => {
                  return (
                    <tr 
                      key={agent.id} 
                      style={{
                        ...styles.tr,
                        backgroundColor: agent.isMe ? '#F8FAFC' : 'transparent'
                      }}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedAgentForHistory(agent);
                        setHistorySearchTerm('');
                        setHistoryFilterType('ALL');
                      }}
                    >
                      <td style={styles.td}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={styles.agentName}>{agent.name}</span>
                            {agent.isMe && (
                              <span style={styles.inchargeTag}>
                                <Award size={10} /> INCHARGE
                              </span>
                            )}
                          </div>
                          <div style={styles.agentArea}>{agent.locality || 'Coastal Andhra'}</div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
                          {agent.isMe ? `All ${agent.tanks} Tanks` : `${agent.tanks} Tanks`}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.completedPill}>
                          <CheckCircle2 size={12} /> {agent.tests} Done
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span 
                          style={{ ...styles.duePill, cursor: !agent.isMe ? 'pointer' : 'default' }}
                          onClick={(e) => {
                            if (!agent.isMe) {
                              e.stopPropagation();
                              setDueTestsModalAgent(agent);
                            }
                          }}
                          className={!agent.isMe ? "transition-transform active:scale-95 hover:shadow-xs cursor-pointer" : ""}
                          title={!agent.isMe ? "Click to view due tests and remind agent" : ""}
                        >
                          <Clock size={12} /> {agent.due} Due
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span 
                          style={{
                            ...(agent.overdue > 0 ? styles.overduePill : styles.zeroOverduePill),
                            cursor: !agent.isMe && agent.overdue > 0 ? 'pointer' : 'default'
                          }}
                          onClick={(e) => {
                            if (!agent.isMe && agent.overdue > 0) {
                              e.stopPropagation();
                              setDueTestsModalAgent(agent);
                            }
                          }}
                          className={!agent.isMe && agent.overdue > 0 ? "transition-transform active:scale-95 hover:shadow-xs cursor-pointer" : ""}
                          title={!agent.isMe && agent.overdue > 0 ? "Click to view overdue tests and remind agent" : ""}
                        >
                          {agent.overdue > 0 && <AlertTriangle size={12} />}
                          {agent.overdue} Overdue
                        </span>
                      </td>

                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {!agent.isMe && (agent.due > 0 || agent.overdue > 0) && (
                            <button
                              type="button"
                              style={{
                                ...styles.viewHistoryBtn,
                                backgroundColor: '#FEF3C7',
                                color: '#B45309',
                                border: '1px solid #FDE68A',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDueTestsModalAgent(agent);
                              }}
                              className="transition-all duration-150 active:scale-95 cursor-pointer hover:bg-amber-100"
                              title={`Remind ${agent.name} about due tests`}
                            >
                              <Bell size={12} />
                              <span>Remind</span>
                            </button>
                          )}

                          <button
                            type="button"
                            style={{
                              ...styles.viewHistoryBtn,
                              backgroundColor: agent.isMe ? '#1A2FB8' : '#EFF6FF',
                              color: agent.isMe ? '#FFFFFF' : '#1A2FB8',
                              border: agent.isMe ? '1px solid #1A2FB8' : '1px solid #DBEAFE',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAgentForHistory(agent);
                              setHistorySearchTerm('');
                              setHistoryFilterType('ALL');
                            }}
                            className="transition-all duration-150 active:scale-95 cursor-pointer hover:brightness-110"
                            title="View Test History"
                          >
                            <Eye size={13} />
                            <span>{agent.isMe ? 'View My Tests' : 'View History'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredAgents.length === 0 && (
                  <tr>
                    <td colSpan="6" style={styles.emptyTd}>
                      No technician test records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TECHNICIAN'S / INCHARGE COMPLETE TEST HISTORY MODAL */}
      {/* ========================================================= */}
      {selectedAgentForHistory && createPortal(
        <div style={styles.modalBackdrop} onClick={() => setSelectedAgentForHistory(null)}>
          <div style={styles.historyModalCard} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={styles.modalHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={styles.modalTitle}>
                    {selectedAgentForHistory.isMe ? 'Tests Done By Me (Incharge Audits)' : `${selectedAgentForHistory.name}'s Test History`}
                  </h3>
                  <span style={selectedAgentForHistory.isMe ? styles.inchargeBadgeLarge : styles.techBadge}>
                    {selectedAgentForHistory.isMe ? <Award size={12} /> : <UserCheck size={12} />}
                    {selectedAgentForHistory.isMe ? 'Area Incharge / ASM' : 'Field Technician'}
                  </span>
                </div>
                <p style={styles.modalSub}>
                  📍 {selectedAgentForHistory.locality} • 📞 {selectedAgentForHistory.mobile}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAgentForHistory(null)}
                style={styles.modalCloseBtn}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Metrics Bar inside Modal */}
            <div style={styles.agentSummaryBar}>
              <div style={styles.agentSummaryCol}>
                <span style={styles.agentSummaryLabel}>TOTAL TESTS LOGGED</span>
                <span style={{ ...styles.agentSummaryValue, color: '#1A2FB8' }}>{rawAgentTests.length} Tests</span>
              </div>
              <div style={styles.summaryDivider} />
              <div style={styles.agentSummaryCol}>
                <span style={styles.agentSummaryLabel}>SUPERVISED TANKS</span>
                <span style={styles.agentSummaryValue}>{selectedAgentForHistory.tanks} Tanks</span>
              </div>
              <div style={styles.summaryDivider} />
              <div style={styles.agentSummaryCol}>
                <span style={styles.agentSummaryLabel}>ASSIGNED FARMERS</span>
                <span style={styles.agentSummaryValue}>{selectedAgentForHistory.farmers || 6} Farmers</span>
              </div>
              <div style={styles.summaryDivider} />
              <div style={styles.agentSummaryCol}>
                <span style={styles.agentSummaryLabel}>AUDITOR STATUS</span>
                <span style={{ ...styles.agentSummaryValue, color: '#16A34A' }}>
                  {selectedAgentForHistory.isMe ? 'Area Incharge Active' : 'Active in Field'}
                </span>
              </div>
            </div>

            {/* Modal Internal Search & 7-Category Filter Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div style={{ ...styles.searchBox, minWidth: '220px', flex: 1, padding: '7px 12px' }}>
                <Search size={15} color="#64748B" />
                <input 
                  type="text"
                  placeholder="Filter by farmer, tank, or test ID..."
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  style={{ ...styles.searchInput, fontSize: '12.5px' }}
                />
              </div>

              {/* Comprehensive Test Type Filter Dropdown */}
              <select
                value={historyFilterType}
                onChange={(e) => setHistoryFilterType(e.target.value)}
                style={styles.selectFilterSmall}
              >
                <option value="ALL">All Test Types ({testTypesList.length})</option>
                {testTypesList.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Test History List (Clean & Compact without preview telemetry row) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '440px', overflowY: 'auto', paddingRight: '2px' }}>
              {filteredAgentTests.map((item) => {
                const badgeInfo = getTestTypeBadgeStyle(item.testType);
                const BadgeIcon = badgeInfo.icon;

                return (
                  <div
                    key={item.id}
                    style={styles.testHistoryItemCard}
                    className="hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => setSelectedTestDetail(item)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ ...styles.testTypeIconBox, backgroundColor: badgeInfo.bg, color: badgeInfo.text }}>
                          <BadgeIcon size={18} strokeWidth={2.2} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                              {item.farmer} • {item.tank}
                            </span>
                            <span style={{
                              ...styles.testTypePill,
                              backgroundColor: badgeInfo.bg,
                              color: badgeInfo.text,
                              borderColor: badgeInfo.border
                            }}>
                              {item.testType}
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                            📍 {item.locality} • Day {item.doc} DOC • 🕒 {item.date} ({item.time})
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={styles.approvedPill}>
                          <CheckCircle2 size={12} /> Approved
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTestDetail(item);
                          }}
                          style={styles.inspectAuditBtn}
                          className="hover:bg-slate-200 active:scale-95 transition-all"
                        >
                          <span>View Report</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredAgentTests.length === 0 && (
                <div style={styles.emptyHistoryBox}>
                  <TestTube size={24} color="#94A3B8" />
                  <span style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>
                    No test records match your filter criteria.
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
              <button
                type="button"
                style={styles.closeModalBtn}
                onClick={() => setSelectedAgentForHistory(null)}
              >
                Close History
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 3. FULL TEST REPORT AUDIT MODAL (Drill-Down Level 2) */}
      {/* ========================================================= */}
      {selectedTestDetail && createPortal(
        <div style={styles.modalBackdrop} onClick={() => setSelectedTestDetail(null)}>
          <div style={styles.testDetailModalCard} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTestDetail(null)}
                  style={styles.backBtn}
                  title="Back to Agent History"
                >
                  <ArrowLeft size={16} color="#1A2FB8" />
                </button>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    {selectedTestDetail.testType} Report
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Record ID: {selectedTestDetail.id} • {selectedTestDetail.date} ({selectedTestDetail.time})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTestDetail(null)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            {/* Identity Strip */}
            <div style={styles.modalIdentityStrip}>
              <div>
                <span style={styles.miniLabel}>LOGGED BY</span>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#1A2FB8' }}>
                  {selectedTestDetail.technicianName}
                </div>
              </div>
              <div style={styles.summaryDivider} />
              <div>
                <span style={styles.miniLabel}>FARMER & LOCATION</span>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                  {selectedTestDetail.farmer} ({selectedTestDetail.locality})
                </div>
              </div>
              <div style={styles.summaryDivider} />
              <div>
                <span style={styles.miniLabel}>POND & DOC</span>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                  {selectedTestDetail.tank} • Day {selectedTestDetail.doc} DOC
                </div>
              </div>
            </div>

            {/* Dynamic Parameter Grid Per Test Type */}
            <div style={{ marginTop: '16px' }}>
              
              {/* Category 1: Water Analysis Grid */}
              {selectedTestDetail.testType === 'Water Analysis' && (
                <>
                  <h4 style={styles.sectionHeading}>Water Quality Telemetry Parameters</h4>
                  <div style={styles.paramGrid}>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Salinity</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.salinity} ppt</span>
                      <span style={styles.paramCardStatus}>Target (0 - 30 ppt)</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>pH Level</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.ph}</span>
                      <span style={styles.paramCardStatus}>Optimal (7.5 - 8.5)</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Alkalinity</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.alkalinity} ppm</span>
                      <span style={styles.paramCardStatus}>Target (100 - 300 ppm)</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Hardness</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.hardness} ppm</span>
                      <span style={styles.paramCardStatus}>Salinity × 300</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Ammonia (NH3)</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.ammonia} ppm</span>
                      <span style={styles.paramCardStatus}>Safe (&lt; 0.5 ppm)</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Nitrite (NO2)</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.nitrite} ppm</span>
                      <span style={styles.paramCardStatus}>Safe (&lt; 0.25 ppm)</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Potassium (K)</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.k} ppm</span>
                      <span style={styles.paramCardStatus}>Salinity × 10.7</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Dissolved Oxygen</span>
                      <span style={{ ...styles.paramCardValue, color: '#16A34A' }}>{selectedTestDetail.data.do} ppm</span>
                      <span style={styles.paramCardStatus}>Target &gt; 4.0 ppm</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Hydrogen Sulfide</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.h2s} ppm</span>
                      <span style={styles.paramCardStatus}>Safe (&lt; 0.02 ppm)</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Chlorine (Cl)</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.cl} ppm</span>
                      <span style={styles.paramCardStatus}>Safe (&lt; 0.02 ppm)</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Iron (Fe)</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.fe} ppm</span>
                      <span style={styles.paramCardStatus}>Safe (&lt; 0.02 ppm)</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Water Color</span>
                      <span style={{ ...styles.paramCardValue, fontSize: '14px', color: '#15803D' }}>{selectedTestDetail.data.waterColor}</span>
                      <span style={styles.paramCardStatus}>Healthy Algae Bloom</span>
                    </div>
                  </div>
                </>
              )}

              {/* Category 2: Feed Test Grid */}
              {selectedTestDetail.testType === 'Feed Test' && (
                <>
                  <h4 style={styles.sectionHeading}>Feed & Growth Telemetry Parameters</h4>
                  <div style={styles.paramGrid}>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Seed Stocked</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.seedCountLac} Lac</span>
                      <span style={styles.paramCardStatus}>Stocking Density</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Average Body Weight</span>
                      <span style={{ ...styles.paramCardValue, color: '#1A2FB8' }}>{selectedTestDetail.data.abw} g</span>
                      <span style={styles.paramCardStatus}>Sampling Count Verified</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Day Feed</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.dayFeed} kg</span>
                      <span style={styles.paramCardStatus}>Daily Allocation</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Cumulative Feed</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.cumulativeFeed} kg</span>
                      <span style={styles.paramCardStatus}>Total Feed to Date</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Total Biomass</span>
                      <span style={{ ...styles.paramCardValue, color: '#16A34A' }}>{selectedTestDetail.data.totalBiomass} kg</span>
                      <span style={styles.paramCardStatus}>Estimated Crop Mass</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>FCR (Formula)</span>
                      <span style={{ ...styles.paramCardValue, color: '#D97706' }}>{selectedTestDetail.data.fcr}</span>
                      <span style={styles.paramCardStatus}>Cum. Feed / Biomass</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Check Tray Feed</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.chTrFeed} g</span>
                      <span style={styles.paramCardStatus}>Check Tray Portion</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Check Tray Time</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.chTrTime}</span>
                      <span style={styles.paramCardStatus}>Clearance Time</span>
                    </div>
                  </div>
                </>
              )}

              {/* Category 3: Disease Observation Grid */}
              {selectedTestDetail.testType === 'Disease Observation' && (
                <>
                  <h4 style={styles.sectionHeading}>13 Disease & Pathology Indicators</h4>
                  <div style={styles.diseaseGrid}>
                    {[
                      { label: 'White muscle', status: selectedTestDetail.data.whiteMuscle || 'Negative' },
                      { label: 'White gut', status: selectedTestDetail.data.whiteGut || 'Negative' },
                      { label: 'Moulting', status: selectedTestDetail.data.moulting || 'Active' },
                      { label: 'Cramping', status: selectedTestDetail.data.cramping || 'Negative' },
                      { label: 'Black gill', status: selectedTestDetail.data.blackGill || 'Negative' },
                      { label: 'Vibriosis', status: selectedTestDetail.data.vibriosis || 'Negative' },
                      { label: 'EHP', status: selectedTestDetail.data.ehp || 'Negative' },
                      { label: 'Hard shell', status: selectedTestDetail.data.hardShell || 'Normal' },
                      { label: 'Soft shell', status: selectedTestDetail.data.softShell || '6% Normal' },
                      { label: 'Black spots', status: selectedTestDetail.data.blackSpots || 'Negative' },
                      { label: 'ASDS', status: selectedTestDetail.data.asds || 'Negative' },
                      { label: 'WSSV', status: selectedTestDetail.data.wssv || 'Negative' },
                      { label: 'Loose shell', status: selectedTestDetail.data.looseShell || 'Negative' },
                    ].map((item, i) => (
                      <div key={i} style={styles.diseaseCheckCard}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#0F172A' }}>{item.label}</span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: item.status.includes('Negative') || item.status.includes('Active') || item.status.includes('Normal') ? '#DCFCE7' : '#FEE2E2',
                            color: item.status.includes('Negative') || item.status.includes('Active') || item.status.includes('Normal') ? '#15803D' : '#DC2626',
                          }}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Category 4: Mortality Test Grid */}
              {selectedTestDetail.testType === 'Mortality Test' && (
                <>
                  <h4 style={styles.sectionHeading}>Mortality & Survival Rate Telemetry</h4>
                  <div style={styles.paramGrid}>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Daily Mortality</span>
                      <span style={{ ...styles.paramCardValue, color: '#DC2626' }}>{selectedTestDetail.data.dailyMortality}</span>
                      <span style={styles.paramCardStatus}>Daily dead count</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Cumulative Mortality</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.cumulativeMortality}</span>
                      <span style={styles.paramCardStatus}>Total cycle loss</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Estimated Survival</span>
                      <span style={{ ...styles.paramCardValue, color: '#16A34A' }}>{selectedTestDetail.data.estimatedSurvival}</span>
                      <span style={styles.paramCardStatus}>Target &gt; 90%</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Perimeter Inspection</span>
                      <span style={{ ...styles.paramCardValue, fontSize: '13px' }}>{selectedTestDetail.data.perimeterInspection}</span>
                      <span style={styles.paramCardStatus}>Pond bank status</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Probable Cause</span>
                      <span style={{ ...styles.paramCardValue, fontSize: '13px' }}>{selectedTestDetail.data.probableCause}</span>
                      <span style={styles.paramCardStatus}>Diagnostic analysis</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Corrective Action</span>
                      <span style={{ ...styles.paramCardValue, fontSize: '13px', color: '#1A2FB8' }}>{selectedTestDetail.data.correctiveAction}</span>
                      <span style={styles.paramCardStatus}>Field intervention</span>
                    </div>
                  </div>
                </>
              )}

              {/* Category 5: Medication Test Grid */}
              {selectedTestDetail.testType === 'Medication Test' && (
                <>
                  <h4 style={styles.sectionHeading}>Medication, Chemical & Probiotic Application</h4>
                  <div style={styles.paramGrid}>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Product / Medicine</span>
                      <span style={{ ...styles.paramCardValue, fontSize: '14px', color: '#9333EA' }}>{selectedTestDetail.data.medicineName}</span>
                      <span style={styles.paramCardStatus}>Prescribed product</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Dosage</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.dosage}</span>
                      <span style={styles.paramCardStatus}>Standard dilution</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Application Method</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.applicationMethod}</span>
                      <span style={styles.paramCardStatus}>Mode of entry</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Target Diagnosis</span>
                      <span style={{ ...styles.paramCardValue, fontSize: '13px' }}>{selectedTestDetail.data.targetDiagnosis}</span>
                      <span style={styles.paramCardStatus}>Pathology target</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Administered DOC</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.administrationDoc}</span>
                      <span style={styles.paramCardStatus}>Timeline</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Clinical Response</span>
                      <span style={{ ...styles.paramCardValue, fontSize: '13px', color: '#16A34A' }}>{selectedTestDetail.data.clinicalResponse}</span>
                      <span style={styles.paramCardStatus}>Follow-up outcome</span>
                    </div>
                  </div>
                </>
              )}

              {/* Category 6: Farm Activity Grid */}
              {selectedTestDetail.testType === 'Farm Activity' && (
                <>
                  <h4 style={styles.sectionHeading}>Farm Maintenance & Operational Activity</h4>
                  <div style={styles.paramGrid}>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Activity Type</span>
                      <span style={{ ...styles.paramCardValue, fontSize: '14px', color: '#059669' }}>{selectedTestDetail.data.activityType}</span>
                      <span style={styles.paramCardStatus}>Task scope</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Equipment Running</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.equipmentRunning}</span>
                      <span style={styles.paramCardStatus}>Aeration runtime</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Labor Deployed</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.laborDeployed}</span>
                      <span style={styles.paramCardStatus}>Field workforce</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Water Exchange</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.waterExchangeVolume}</span>
                      <span style={styles.paramCardStatus}>Fresh water intake</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Sludge Drain</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.sludgeDrain}</span>
                      <span style={styles.paramCardStatus}>Pond pit hygiene</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Supervisor Signoff</span>
                      <span style={{ ...styles.paramCardValue, fontSize: '13px', color: '#1A2FB8' }}>{selectedTestDetail.data.supervisorSignoff}</span>
                      <span style={styles.paramCardStatus}>Verified log</span>
                    </div>
                  </div>
                </>
              )}

              {/* Category 7: Photo Observation Summary (Only shown for Photo Observation) */}
              {selectedTestDetail.testType === 'Photo Observation' && (
                <>
                  <h4 style={styles.sectionHeading}>Visual Audit & GPS Metadata</h4>
                  <div style={styles.paramGrid}>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Audit Scope</span>
                      <span style={{ ...styles.paramCardValue, fontSize: '14px', color: '#0284C7' }}>{selectedTestDetail.data.observationTitle}</span>
                      <span style={styles.paramCardStatus}>Visual survey</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>GPS Coordinates</span>
                      <span style={{ ...styles.paramCardValue, fontSize: '13px' }}>{selectedTestDetail.data.gpsCoords}</span>
                      <span style={styles.paramCardStatus}>Geotagged verified</span>
                    </div>
                    <div style={styles.paramCard}>
                      <span style={styles.paramCardLabel}>Location Tag</span>
                      <span style={styles.paramCardValue}>{selectedTestDetail.data.locationTag}</span>
                      <span style={styles.paramCardStatus}>Farm territory</span>
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Attached Photos Gallery (STRICTLY only for Photo Observation) */}
            {selectedTestDetail.testType === 'Photo Observation' && selectedTestDetail.photos && selectedTestDetail.photos.length > 0 && (
              <div style={{ marginTop: '18px' }}>
                <h4 style={styles.sectionHeading}>
                  Attached Photo Evidence ({selectedTestDetail.photos.length})
                </h4>
                <div style={styles.photoGalleryGrid}>
                  {selectedTestDetail.photos.map((p, idx) => (
                    <div 
                      key={idx} 
                      style={styles.photoThumbnailCard}
                      className="hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setSelectedImagePreview(p)}
                    >
                      <div style={styles.photoImgWrapper}>
                        <img 
                          src={p.url} 
                          alt={p.title} 
                          style={styles.photoImg}
                        />
                        <div style={styles.photoOverlayBadge}>
                          <Camera size={11} /> Photo {idx + 1}
                        </div>
                      </div>
                      <div style={{ padding: '8px 10px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>{p.title}</div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{p.caption}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Auditor Notes */}
            <div style={styles.notesBox}>
              <span style={styles.miniLabel}>FIELD OBSERVATIONS & TECHNICIAN REMARKS</span>
              <p style={{ fontSize: '13px', color: '#334155', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                {selectedTestDetail.notes || selectedTestDetail.data?.remarks || 'Routine sampling completed with verified parameter standards.'}
              </p>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
              <button
                type="button"
                style={styles.closeModalBtn}
                onClick={() => setSelectedTestDetail(null)}
              >
                Back to Tests List
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 4. HIGH RESOLUTION IMAGE PREVIEW MODAL */}
      {/* ========================================================= */}
      {selectedImagePreview && createPortal(
        <div style={styles.imageModalBackdrop} onClick={() => setSelectedImagePreview(null)}>
          <div style={styles.imageModalCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                  {selectedImagePreview.title}
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                  {selectedImagePreview.caption}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImagePreview(null)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>
            <img 
              src={selectedImagePreview.url} 
              alt={selectedImagePreview.title} 
              style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '12px' }} 
            />
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 5. AGENT DUE TESTS & REMIND MODAL */}
      {/* ========================================================= */}
      {dueTestsModalAgent && createPortal(
        <div style={styles.modalBackdrop} onClick={() => setDueTestsModalAgent(null)}>
          <div 
            style={{ ...styles.farmerModalCard, maxWidth: '840px', maxHeight: '88vh' }} 
            onClick={e => e.stopPropagation()}
            className="animate-modal-in"
          >
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ ...styles.modalIconBox, backgroundColor: '#FEF3C7', color: '#D97706' }}>
                  <TestTube size={22} />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>
                    {dueTestsModalAgent.name}'s Due Tests & Reminders
                  </h3>
                  <p style={styles.modalSub}>
                    Technician: {dueTestsModalAgent.name} • {dueTestsModalAgent.mobile || '+91 98480 22334'} • {dueTestsModalAgent.locality || 'Bhimavaram'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDueTestsModalAgent(null)}
                style={styles.modalCloseBtn}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Top Batch Remind Action Strip */}
            {(() => {
              const dueTanks = getDueTanksForWeeklyAgent(dueTestsModalAgent);
              return (
                <>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '16px',
                    padding: '12px 16px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>PENDING ROUTINE TESTS</span>
                      <div style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A' }}>
                        {dueTanks.length} Tanks Require Testing
                      </div>
                    </div>

                    {dueTanks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          dueTanks.forEach(item => {
                            if (addNotification) {
                              addNotification(
                                dueTestsModalAgent.id || 'agent001',
                                `Incharge Reminder: ${item.testType || 'Routine Weekly Test'} is due for ${item.farmerName} • ${item.tankName}. Please complete field audit today.`,
                                'warning'
                              );
                            }
                          });
                          const allMap = {};
                          dueTanks.forEach(item => { allMap[item.tankId] = true; });
                          setRemindedTanks(prev => ({ ...prev, ...allMap }));
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#1A2FB8',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                        className="transition-transform active:scale-95 hover:brightness-110"
                        title="Send reminders for all due tests"
                      >
                        <Bell size={14} />
                        <span>Remind All ({dueTanks.length} Tests)</span>
                      </button>
                    )}
                  </div>

                  {/* List of Due Test Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', maxHeight: '55vh', overflowY: 'auto' }}>
                    {dueTanks.map((item) => {
                      const isReminded = remindedTanks[item.tankId];
                      const whatsappMsg = `Hi ${dueTestsModalAgent.name}, gentle reminder from Incharge: Routine test "${item.testType}" is due for ${item.farmerName} (${item.tankName} - DOC ${item.doc} Days). Please complete and submit the test today on Royal Marines app.`;
                      const cleanPhone = (item.agentPhone || dueTestsModalAgent.mobile || '').replace(/\D/g, '');

                      return (
                        <div
                          key={item.tankId}
                          style={{
                            border: item.isOverdue ? '1px solid #FECACA' : '1px solid #E2E8F0',
                            borderRadius: '12px',
                            padding: '16px',
                            backgroundColor: item.isOverdue ? '#FFFBFB' : '#FFFFFF',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '9px',
                                backgroundColor: item.isOverdue ? '#FEE2E2' : '#FEF3C7',
                                color: item.isOverdue ? '#DC2626' : '#D97706',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <TestTube size={20} />
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                                    {item.tankName}
                                  </span>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    padding: '2px 8px',
                                    borderRadius: '5px',
                                    backgroundColor: item.isOverdue ? '#FEE2E2' : '#FEF3C7',
                                    color: item.isOverdue ? '#DC2626' : '#B45309',
                                    border: item.isOverdue ? '1px solid #FECACA' : '1px solid #FDE68A'
                                  }}>
                                    {item.isOverdue ? '🔴 Overdue' : '🟡 Scheduled Due'}
                                  </span>
                                  <span style={{
                                    fontSize: '11.5px',
                                    fontWeight: '700',
                                    color: '#1A2FB8',
                                    backgroundColor: '#EEF2FF',
                                    padding: '2px 8px',
                                    borderRadius: '5px'
                                  }}>
                                    {item.testType}
                                  </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
                                  Farmer: <strong style={{ color: '#0F172A' }}>{item.farmerName}</strong> ({item.farmerLocality}) • Scheduled Due: <strong style={{ color: item.isOverdue ? '#DC2626' : '#0F172A' }}>{item.scheduledDate}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  if (addNotification) {
                                    addNotification(
                                      dueTestsModalAgent.id || 'agent001',
                                      `Incharge Reminder: ${item.testType || 'Routine Weekly Test'} is due for ${item.farmerName} • ${item.tankName}. Please complete field audit today.`,
                                      'warning'
                                    );
                                  }
                                  setRemindedTanks(prev => ({ ...prev, [item.tankId]: true }));
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '6px 14px',
                                  borderRadius: '7px',
                                  border: isReminded ? '1px solid #BBF7D0' : '1px solid #CBD5E1',
                                  backgroundColor: isReminded ? '#DCFCE7' : '#FFFFFF',
                                  color: isReminded ? '#15803D' : '#334155',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                                className="transition-transform active:scale-95"
                                title={`Send in-app reminder to ${dueTestsModalAgent.name}`}
                              >
                                {isReminded ? (
                                  <>
                                    <Check size={13} />
                                    <span>Reminder Sent</span>
                                  </>
                                ) : (
                                  <>
                                    <Bell size={13} color="#D97706" />
                                    <span>Remind Agent</span>
                                  </>
                                )}
                              </button>

                              {cleanPhone && (
                                <a
                                  href={`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappMsg)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 12px',
                                    borderRadius: '7px',
                                    border: '1px solid #BBF7D0',
                                    backgroundColor: '#F0FDF4',
                                    color: '#16A34A',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    textDecoration: 'none',
                                    cursor: 'pointer'
                                  }}
                                  className="transition-transform active:scale-95 hover:bg-green-100"
                                  title={`Send WhatsApp reminder to ${dueTestsModalAgent.name}`}
                                >
                                  <span>📱 WhatsApp</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}

            {/* Modal Footer */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
              <button
                type="button"
                style={styles.closeModalBtn}
                onClick={() => setDueTestsModalAgent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const styles = {
  summaryBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px 24px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    flexWrap: 'wrap',
    gap: '12px',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  summaryLabel: {
    fontSize: '11.5px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  summaryValue: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryDivider: {
    width: '1px',
    height: '32px',
    backgroundColor: '#F1F5F9',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '20px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  formLabel: {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '6px',
  },
  formInput: {
    width: '100%',
    padding: '9px 12px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '8px 14px',
    flex: 1,
    minWidth: '260px',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '13px',
    color: '#0F172A',
    width: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    borderBottom: '2px solid #F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  th: {
    padding: '12px 14px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '14px',
    verticalAlign: 'middle',
  },
  agentAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    fontWeight: '800',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentAvatarBig: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    fontWeight: '800',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  agentName: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#0F172A',
  },
  agentArea: {
    fontSize: '11px',
    color: '#64748B',
  },
  inchargeTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    padding: '2px 6px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #DBEAFE',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '0.3px',
  },
  completedPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  duePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  overduePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
  zeroOverduePill: {
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: '600',
  },
  viewHistoryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    border: '1px solid #DBEAFE',
    color: '#1A2FB8',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  emptyTd: {
    padding: '32px',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '13px',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    zIndex: 99999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px 16px',
    boxSizing: 'border-box',
  },
  historyModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '880px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    border: '1px solid #E2E8F0',
    boxSizing: 'border-box',
  },
  testDetailModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '740px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    border: '1px solid #E2E8F0',
    boxSizing: 'border-box',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '14px',
    borderBottom: '1px solid #F1F5F9',
    gap: '12px',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  modalSub: {
    fontSize: '12px',
    color: '#64748B',
    margin: '3px 0 0 0',
  },
  techBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid #DBEAFE',
  },
  inchargeBadgeLarge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  modalCloseBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#F1F5F9',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748B',
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
  agentSummaryBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '12px 16px',
    marginTop: '14px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  agentSummaryCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    textAlign: 'center',
  },
  agentSummaryLabel: {
    fontSize: '10.5px',
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  agentSummaryValue: {
    fontSize: '14.5px',
    fontWeight: '800',
    color: '#0F172A',
  },
  selectFilterSmall: {
    padding: '7px 12px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '12.5px',
    color: '#0F172A',
    fontWeight: '700',
    outline: 'none',
    cursor: 'pointer',
  },
  testHistoryItemCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  testTypeIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '9px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  testTypePill: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid',
  },
  approvedPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: '11.5px',
    fontWeight: '700',
  },
  inspectAuditBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    borderRadius: '6px',
    backgroundColor: '#F1F5F9',
    border: '1px solid #CBD5E1',
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155',
    cursor: 'pointer',
  },
  emptyHistoryBox: {
    padding: '36px 16px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px dashed #CBD5E1',
  },
  closeModalBtn: {
    padding: '9px 18px',
    borderRadius: '8px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  backBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    border: '1px solid #DBEAFE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  modalIdentityStrip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px 16px',
    marginTop: '14px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  miniLabel: {
    fontSize: '10.5px',
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    display: 'block',
    marginBottom: '2px',
  },
  sectionHeading: {
    fontSize: '12.5px',
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: '10px',
    letterSpacing: '0.4px',
  },
  paramGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
  },
  diseaseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '8px',
  },
  diseaseCheckCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  paramCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  paramCardLabel: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '700',
  },
  paramCardValue: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#0F172A',
  },
  paramCardStatus: {
    fontSize: '10.5px',
    color: '#16A34A',
    fontWeight: '600',
  },
  photoGalleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
  },
  photoThumbnailCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  photoImgWrapper: {
    position: 'relative',
    height: '110px',
    backgroundColor: '#E2E8F0',
  },
  photoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoOverlayBadge: {
    position: 'absolute',
    bottom: '6px',
    left: '6px',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    color: '#FFFFFF',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px 14px',
    marginTop: '14px',
  },
  imageModalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(6px)',
    zIndex: 100000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px',
  },
  imageModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '16px',
    maxWidth: '750px',
    width: '100%',
    maxHeight: '85vh',
  }
};

export default WeeklyTests;
