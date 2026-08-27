import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSession } from '../agent/utils/agentAuth';

// --- Initial Data Seed ---

const initialRegions = [
  { id: 'REG001', name: 'Bhimavaram' },
  { id: 'REG002', name: 'Kakinada' }
];

const initialIncharges = [
  { id: 'INC001', name: 'Admin User', regionId: 'REG001', email: 'incharge@example.com' }
];

const initialAgents = [
  { id: 'agent001', name: 'Agent A', phone: '9000000001', inchargeId: 'INC001', status: 'ACTIVE', locality: 'Chinnamiram' },
  { id: 'agent002', name: 'Agent B', phone: '9000000002', inchargeId: 'INC001', status: 'ACTIVE', locality: 'Bhimavaram' },
  { id: 'agent003', name: 'Agent C', phone: '9000000003', inchargeId: 'INC001', status: 'ACTIVE', locality: 'Akuruvu' }
];

const initialFarmers = [
  { id: 'F001', name: 'Ashok', status: 'ACTIVE', agentId: 'agent002', phone: '+91 9876543210', location: 'Bhimavaram', waterSource: 'Borewell', acres: 25 },
  { id: 'F002', name: 'Ravi', status: 'ACTIVE', agentId: 'agent001', phone: '+91 9876543211', location: 'Chinnamiram', waterSource: 'Canal', acres: 20 },
  { id: 'F003', name: 'Kumar', status: 'ACTIVE', agentId: 'agent006', phone: '+91 9876543212', location: 'Kalla', waterSource: 'Borewell', acres: 18 },
  { id: 'F004', name: 'Ramesh', status: 'ACTIVE', agentId: 'agent003', phone: '+91 9876543213', location: 'Akuruvu', waterSource: 'Borewell', acres: 30 },
  { id: 'F005', name: 'Ganesh', status: 'ACTIVE', agentId: 'agent004', phone: '+91 9876543214', location: 'Narasapuram', waterSource: 'Canal', acres: 15 },
  { id: 'F006', name: 'Siva', status: 'ACTIVE', agentId: 'agent001', phone: '+91 9876543215', location: 'Chinnamiram', waterSource: 'Borewell', acres: 22 },
  { id: 'F007', name: 'Nagesh', status: 'ACTIVE', agentId: 'agent005', phone: '+91 9876543216', location: 'Undi', waterSource: 'Canal', acres: 12 },
  { id: 'F008', name: 'Srinu', status: 'ACTIVE', agentId: 'agent002', phone: '+91 9876543217', location: 'Bhimavaram', waterSource: 'Borewell', acres: 40 },
  { id: 'F009', name: 'Venkatesh', status: 'ACTIVE', agentId: 'agent004', phone: '+91 9876543218', location: 'Narasapuram', waterSource: 'Borewell', acres: 18 },
  { id: 'F010', name: 'Krishna', status: 'ACTIVE', agentId: 'agent003', phone: '+91 9876543219', location: 'Akuruvu', waterSource: 'Canal', acres: 28 },
  { id: 'F011', name: 'Ramu', status: 'ACTIVE', agentId: 'agent001', phone: '+91 9876543220', location: 'Chinnamiram', waterSource: 'Canal', acres: 16 },
  { id: 'F012', name: 'Subba Rao', status: 'ACTIVE', agentId: 'agent001', phone: '+91 9876543221', location: 'Chinnamiram', waterSource: 'Borewell', acres: 24 },
  { id: 'F013', name: 'Prasad', status: 'ACTIVE', agentId: 'agent001', phone: '+91 9876543222', location: 'Chinnamiram', waterSource: 'Canal', acres: 18 },
  { id: 'F014', name: 'Venkateswara Rao', status: 'ACTIVE', agentId: 'agent001', phone: '+91 9876543223', location: 'Chinnamiram', waterSource: 'River', acres: 32 }
];

const initialTanks = [
  { id: 'T001', name: 'Tank 1', farmerId: 'F001', agentId: 'agent002', status: 'ACTIVE', testStatus: 'Overdue', abw: '12g', biomass: '800kg', fcr: '1.2', lastTest: '10 Aug 2026', nextTest: '17 Aug 2026' },
  { id: 'T002', name: 'Tank 2', farmerId: 'F001', agentId: 'agent002', status: 'ACTIVE', testStatus: 'Due', abw: '14g', biomass: '950kg', fcr: '1.1', lastTest: '15 Aug 2026', nextTest: '22 Aug 2026' },
  { id: 'T003', name: 'Tank 3', farmerId: 'F002', agentId: 'agent001', status: 'ACTIVE', testStatus: 'Completed', abw: '10g', biomass: '600kg', fcr: '1.3', lastTest: '21 Aug 2026', nextTest: '28 Aug 2026' },
  { id: 'T004', name: 'Tank 4', farmerId: 'F004', agentId: 'agent003', status: 'ACTIVE', testStatus: 'Due', abw: '20g', biomass: '1500kg', fcr: '1.0', lastTest: '22 Aug 2026', nextTest: '29 Aug 2026' },
  { id: 'T007', name: 'Tank 7', farmerId: 'F005', agentId: 'agent004', status: 'ACTIVE', testStatus: 'Completed', abw: '11g', biomass: '700kg', fcr: '1.25', lastTest: '15 Aug 2026', nextTest: '22 Aug 2026' },
  { id: 'T008', name: 'Tank 8', farmerId: 'F006', agentId: 'agent001', status: 'ACTIVE', testStatus: 'Due', abw: '18g', biomass: '1200kg', fcr: '1.15', lastTest: '20 Aug 2026', nextTest: '27 Aug 2026' },
  { id: 'T009', name: 'Tank 9', farmerId: 'F007', agentId: 'agent005', status: 'ACTIVE', testStatus: 'Overdue', abw: '9g', biomass: '400kg', fcr: '1.4', lastTest: '08 Aug 2026', nextTest: '15 Aug 2026' },
  { id: 'T010', name: 'Tank 10', farmerId: 'F008', agentId: 'agent002', status: 'ACTIVE', testStatus: 'Due', abw: '16g', biomass: '2000kg', fcr: '1.2', lastTest: '19 Aug 2026', nextTest: '26 Aug 2026' },
  { id: 'T011', name: 'Tank 11', farmerId: 'F009', agentId: 'agent004', status: 'ACTIVE', testStatus: 'Due', abw: '13g', biomass: '900kg', fcr: '1.1', lastTest: '21 Aug 2026', nextTest: '28 Aug 2026' },
  { id: 'T012', name: 'Tank 12', farmerId: 'F010', agentId: 'agent003', status: 'ACTIVE', testStatus: 'Overdue', abw: '21g', biomass: '1600kg', fcr: '1.35', lastTest: '11 Aug 2026', nextTest: '18 Aug 2026' },
  { id: 'T013', name: 'Tank 13', farmerId: 'F011', agentId: 'agent001', status: 'ACTIVE', testStatus: 'Completed', abw: '15g', biomass: '1100kg', fcr: '1.12', lastTest: '24 Aug 2026', nextTest: '31 Aug 2026' },
  { id: 'T014', name: 'Tank 14', farmerId: 'F012', agentId: 'agent001', status: 'ACTIVE', testStatus: 'Due', abw: '17g', biomass: '1350kg', fcr: '1.18', lastTest: '20 Aug 2026', nextTest: '27 Aug 2026' },
  { id: 'T015', name: 'Tank 15', farmerId: 'F013', agentId: 'agent001', status: 'ACTIVE', testStatus: 'Overdue', abw: '11g', biomass: '750kg', fcr: '1.22', lastTest: '12 Aug 2026', nextTest: '19 Aug 2026' },
  { id: 'T016', name: 'Tank 16', farmerId: 'F014', agentId: 'agent001', status: 'ACTIVE', testStatus: 'Completed', abw: '22g', biomass: '1800kg', fcr: '1.08', lastTest: '25 Aug 2026', nextTest: '01 Sep 2026' }
];

const initialSubmissions = [
  // August 2026 Submissions (Chinnamiram - Agent A)
  {
    id: 'SUB001',
    agentId: 'agent001',
    farmerId: 'F002', // Ravi (Chinnamiram)
    tankId: 'T003',
    testType: 'Water Analysis',
    date: '2026-08-26',
    status: 'COMPLETED',
    submittedAgo: '1 hour ago',
    data: {
      waterQuality: { salinity: '16', ph: '7.9', do: '5.4', waterColor: 'Light Green' },
      biomass: '850kg',
      fcr: '1.15'
    }
  },
  {
    id: 'SUB002',
    agentId: 'agent001',
    farmerId: 'F006', // Siva (Chinnamiram)
    tankId: 'T008',
    testType: 'Feed Test',
    date: '2026-08-25',
    status: 'PENDING_VERIFICATION',
    submittedAgo: '1 day ago',
    data: {
      waterQuality: { salinity: '18', ph: '8.0', do: '4.9', waterColor: 'Brown' },
      biomass: '1250kg',
      fcr: '1.20'
    }
  },
  {
    id: 'SUB003',
    agentId: 'agent001',
    farmerId: 'F002', // Ravi (Chinnamiram)
    tankId: 'T003',
    testType: 'Medication',
    date: '2026-08-22',
    status: 'COMPLETED',
    submittedAgo: '4 days ago',
    data: {
      waterQuality: { salinity: '15', ph: '7.8', do: '5.2', waterColor: 'Light Green' },
      biomass: '800kg',
      fcr: '1.18'
    }
  },
  {
    id: 'SUB004',
    agentId: 'agent001',
    farmerId: 'F006', // Siva (Chinnamiram)
    tankId: 'T008',
    testType: 'Disease Observation',
    date: '2026-08-18',
    status: 'COMPLETED',
    submittedAgo: '8 days ago',
    data: {
      waterQuality: { salinity: '17', ph: '7.9', do: '5.0', waterColor: 'Greenish' },
      biomass: '1200kg',
      fcr: '1.22'
    }
  },
  {
    id: 'SUB005',
    agentId: 'agent001',
    farmerId: 'F002', // Ravi (Chinnamiram)
    tankId: 'T003',
    testType: 'Water Analysis',
    date: '2026-08-15',
    status: 'COMPLETED',
    submittedAgo: '11 days ago',
    data: {
      waterQuality: { salinity: '15', ph: '7.8', do: '5.1', waterColor: 'Light Green' },
      biomass: '750kg',
      fcr: '1.15'
    }
  },

  // July 2026 Submissions (Chinnamiram - Agent A)
  {
    id: 'SUB006',
    agentId: 'agent001',
    farmerId: 'F002', // Ravi (Chinnamiram)
    tankId: 'T003',
    testType: 'Water Analysis',
    date: '2026-07-28',
    status: 'COMPLETED',
    submittedAgo: '1 month ago',
    data: {
      waterQuality: { salinity: '16', ph: '7.9', do: '5.3', waterColor: 'Light Green' },
      biomass: '650kg',
      fcr: '1.25'
    }
  },
  {
    id: 'SUB007',
    agentId: 'agent001',
    farmerId: 'F006', // Siva (Chinnamiram)
    tankId: 'T008',
    testType: 'Feed Test',
    date: '2026-07-20',
    status: 'COMPLETED',
    submittedAgo: '1 month ago',
    data: {
      waterQuality: { salinity: '18', ph: '8.1', do: '4.7', waterColor: 'Brown' },
      biomass: '1000kg',
      fcr: '1.30'
    }
  },
  {
    id: 'SUB008',
    agentId: 'agent001',
    farmerId: 'F002', // Ravi (Chinnamiram)
    tankId: 'T003',
    testType: 'Water Analysis',
    date: '2026-07-12',
    status: 'COMPLETED',
    submittedAgo: '1 month ago',
    data: {
      waterQuality: { salinity: '15', ph: '7.8', do: '5.2', waterColor: 'Greenish' },
      biomass: '550kg',
      fcr: '1.28'
    }
  },

  // June 2026 Submissions (Chinnamiram - Agent A)
  {
    id: 'SUB009',
    agentId: 'agent001',
    farmerId: 'F002', // Ravi (Chinnamiram)
    tankId: 'T003',
    testType: 'Water Analysis',
    date: '2026-06-25',
    status: 'COMPLETED',
    submittedAgo: '2 months ago',
    data: {
      waterQuality: { salinity: '14', ph: '7.7', do: '5.5', waterColor: 'Light Green' },
      biomass: '450kg',
      fcr: '1.20'
    }
  },
  {
    id: 'SUB010',
    agentId: 'agent001',
    farmerId: 'F006', // Siva (Chinnamiram)
    tankId: 'T008',
    testType: 'Feed Test',
    date: '2026-06-18',
    status: 'COMPLETED',
    submittedAgo: '2 months ago',
    data: {
      waterQuality: { salinity: '17', ph: '8.0', do: '4.9', waterColor: 'Brown' },
      biomass: '800kg',
      fcr: '1.25'
    }
  },

  // Submissions for other locations (Bhimavaram, Narasapuram, Akuruvu, Undi)
  {
    id: 'SUB011',
    agentId: 'agent002',
    farmerId: 'F001',
    tankId: 'T001',
    testType: 'Water Analysis',
    date: '2026-08-22',
    status: 'COMPLETED',
    submittedAgo: '4 days ago',
    data: {
      waterQuality: { doc: '75', salinity: '5', ph: '8.3', alkalinity: '140', hardness: '1250', ammonia: '0.2', nitrite: '0.5', do: '4.5', k: '35', h2s: '0.1', cl: '0.2', fe: '0.03', waterColor: 'Golden yellow' },
      biomass: '1200kg',
      fcr: '1.2'
    }
  },
  {
    id: 'SUB003',
    agentId: 'agent001',
    farmerId: 'F001',
    tankId: 'T001',
    testType: 'Feed Test',
    date: '2026-08-22',
    status: 'PENDING_VERIFICATION',
    submittedAgo: '10 mins ago',
    data: {
      doc: '45', seed: '2 Lakh', abw: '12g', dayFeed: '50 Kg', 
      cumulativeFeed: '1500 Kg', totalBiomass: '1200kg', fcr: '1.25',
      checkTrayFeed: '10 grams', checkTrayTime: '1.5 hours',
      remarks: 'Normal feeding'
    }
  },
  {
    id: 'SUB004',
    agentId: 'agent001',
    farmerId: 'F001',
    tankId: 'T001',
    testType: 'Medication',
    date: '2026-08-22',
    status: 'COMPLETED',
    submittedAgo: '2 hrs ago',
    data: {
      type: 'Preventive', category: 'Probiotics', product: 'AquaPro', 
      dosage: '500 ml / Acre', date: '2026-08-22', remarks: 'Routine maintenance'
    }
  },
  {
    id: 'SUB005',
    agentId: 'agent001',
    farmerId: 'F001',
    tankId: 'T001',
    testType: 'Disease',
    date: '2026-08-22',
    status: 'COMPLETED',
    submittedAgo: '1 day ago',
    data: {
      observations: ['White muscle', 'Soft shell'], 
      remarks: 'Mild symptoms observed in check tray'
    }
  },
  {
    id: 'SUB006',
    agentId: 'agent001',
    farmerId: 'F001',
    tankId: 'T001',
    testType: 'Harvest',
    date: '2026-08-22',
    status: 'COMPLETED',
    submittedAgo: '2 days ago',
    data: {
      type: 'Partial Harvest', date: '2026-08-20', abw: '15g',
      harvestedNumber: '10000', harvestedBiomass: '150kg', remarks: 'Test harvest'
    }
  },
  {
    id: 'SUB012',
    agentId: 'agent004',
    farmerId: 'F005',
    tankId: 'T007',
    testType: 'Feed Test',
    date: '2026-08-21',
    status: 'COMPLETED',
    submittedAgo: '5 days ago',
    data: {
      waterQuality: { doc: '35', salinity: '10', ph: '8.5', alkalinity: '200', hardness: '1200', ammonia: '0.5', nitrite: '0.1', do: '4.0', k: '250', h2s: '0.05', cl: '0.1', fe: '0.1', waterColor: 'Green' },
      biomass: '800kg',
      fcr: '1.4'
    }
  },
  {
    id: 'SUB013',
    agentId: 'agent003',
    farmerId: 'F004',
    tankId: 'T004',
    testType: 'Water Analysis',
    date: '2026-08-24',
    status: 'COMPLETED',
    submittedAgo: '2 days ago',
    data: {
      waterQuality: { salinity: '12', ph: '7.6', do: '5.6', waterColor: 'Greenish' },
      biomass: '1500kg',
      fcr: '1.05'
    }
  }
];

// --- Context Definition ---

const MockDataContext = createContext(null);

export const MockDataProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Load from LocalStorage or Initialize
  useEffect(() => {
    const savedData = localStorage.getItem('aqua_feed_mock_database_v7');
    if (savedData) {
      setDb(JSON.parse(savedData));
    } else {
      const initialDb = {
        regions: initialRegions,
        incharges: initialIncharges,
        agents: initialAgents,
        farmers: initialFarmers,
        tanks: initialTanks,
        submissions: initialSubmissions,
        cultureCycles: [],
        drafts: [],
        notifications: [],
        activities: [
          { id: 1, time: '2026-08-26 10:00 AM', action: 'Completed Water Test', detail: 'Completed water test for Tank 3 (Ravi)' },
          { id: 2, time: '2026-08-25 04:30 PM', action: 'Feed Test Submitted', detail: 'Feed test submitted for Tank 8 (Siva)' }
        ]
      };
      setDb(initialDb);
      localStorage.setItem('aqua_feed_mock_database_v7', JSON.stringify(initialDb));
    }
  }, []);

  // Save to LocalStorage whenever DB changes
  useEffect(() => {
    if (db) {
      localStorage.setItem('aqua_feed_mock_database_v7', JSON.stringify(db));
    }
  }, [db]);

  // Sync profile changes to MockDataContext state
  useEffect(() => {
    const handleProfileUpdate = () => {
      const session = getSession();
      if (!session) return;
      setDb(prev => {
        if (!prev || !prev.agents) return prev;
        const updatedAgents = prev.agents.map(a => {
          if (a.id === session.agentId) {
            return {
              ...a,
              name: session.name || a.name,
              locality: session.locality || a.locality,
              phone: session.phone || a.phone,
              region: session.region || a.region
            };
          }
          return a;
        });
        return { ...prev, agents: updatedAgents };
      });
    };

    window.addEventListener('agentProfileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('agentProfileUpdated', handleProfileUpdate);
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const addActivity = (action, detail) => {
    const time = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    setDb(prev => ({
      ...prev,
      activities: [{ id: Date.now(), time, action, detail }, ...(prev.activities || [])]
    }));
  };

  // If db is not yet loaded, don't render children (avoid errors)
  if (!db) return null;

  // --- Selectors ---

  const getAgentById = (id) => (db?.agents || []).find(a => a.id === id);
  
  const getFarmersByAgentId = (agentId) => {
    if (!db || !db.farmers) return [];
    const session = getSession();
    const agent = (db.agents || []).find(a => a.id === agentId);
    
    // Agent area/locality from active session profile OR agent record
    const agentArea = (session && session.agentId === agentId && session.locality)
      ? session.locality
      : (agent && agent.locality ? agent.locality : '');

    return db.farmers.filter(f => {
      // If agent has an assigned area (e.g., 'Chinnamiram'), show ONLY farmers in that area
      if (agentArea) {
        return f.location.toLowerCase() === agentArea.toLowerCase();
      }
      return f.agentId === agentId;
    });
  };
  
  const getFarmerById = (id) => db.farmers.find(f => f.id === id);
  
  const getTanksByFarmerId = (farmerId) => db.tanks.filter(t => t.farmerId === farmerId);
  
  const getTankById = (id) => db.tanks.find(t => t.id === id);
  
  const getSubmissionsByAgentId = (agentId) => db.submissions.filter(s => s.agentId === agentId);

  const getAgentNotifications = (agentId) => (db.notifications || []).filter(n => n.agentId === agentId);

  // Advanced Selectors for Agent Dashboard
  const getAgentDashboardMetrics = (agentId) => {
    const farmers = getFarmersByAgentId(agentId);
    let totalTanks = 0;
    let testsCompleted = 0;
    let testsDue = 0;
    let overdue = 0;
    const todaysWork = [];

    farmers.forEach(farmer => {
      const farmerTanks = getTanksByFarmerId(farmer.id);
      totalTanks += farmerTanks.length;
      farmerTanks.forEach(tank => {
        if (tank.testStatus === 'Completed') testsCompleted++;
        if (tank.testStatus === 'Due') {
          testsDue++;
          todaysWork.push({ id: tank.id, farmerName: farmer.name, tankName: tank.name, type: 'Water Analysis', date: tank.nextTest, status: 'Due', tankId: tank.id });
        }
        if (tank.testStatus === 'Overdue') {
          overdue++;
          todaysWork.push({ id: tank.id, farmerName: farmer.name, tankName: tank.name, type: 'Weekly Test', date: tank.nextTest, status: 'Overdue', tankId: tank.id });
        }
      });
    });

    const pendingVerify = getSubmissionsByAgentId(agentId).filter(s => s.status === 'PENDING_VERIFICATION').length;
    const harvest = getSubmissionsByAgentId(agentId).filter(s => s.type === 'Harvest' || s.testType === 'Harvest').length;

    return {
      kpi: {
        assignedFarmers: farmers.length,
        totalTanks,
        testsCompleted,
        testsDue,
        overdue,
        harvest: harvest || 0,
        pendingVerify
      },
      todaysWork
    };
  };

  // Advanced Selectors for Incharge Dashboard
  const getInchargeDashboardMetrics = (inchargeId) => {
    const totalAgents = db.agents.length;
    const totalFarmers = db.farmers.length;
    const totalTanks = db.tanks.length;
    
    let testsCompleted = 0;
    let testsDue = 0;
    let overdueTests = 0;
    
    db.tanks.forEach(t => {
      if (t.testStatus === 'Completed') testsCompleted++;
      if (t.testStatus === 'Due') testsDue++;
      if (t.testStatus === 'Overdue') overdueTests++;
    });

    const pendingVerification = db.submissions.filter(s => s.status === 'PENDING_VERIFICATION').length;

    return {
      totalAgents,
      newAgentsMonth: 0,
      totalFarmers,
      newFarmersMonth: 0,
      totalTanks,
      newTanksMonth: 0,
      testsCompleted,
      testsDue,
      overdueTests,
      pendingVerification
    };
  };

  // --- Actions ---

  const updateTank = (tankId, updates) => {
    setDb(prev => ({
      ...prev,
      tanks: prev.tanks.map(t => t.id === tankId ? { ...t, ...updates } : t)
    }));
    showToast(`Tank ${tankId} updated!`);
  };

  const updateFarmer = (farmerId, updates) => {
    setDb(prev => ({
      ...prev,
      farmers: prev.farmers.map(f => f.id === farmerId ? { ...f, ...updates } : f)
    }));
    showToast(`Farmer ${farmerId} updated!`);
  };

  const submitRecord = (submissionData) => {
    const newSubmission = {
      id: `SUB${Date.now()}`,
      status: 'PENDING_VERIFICATION',
      submittedAgo: 'Just now',
      date: new Date().toISOString().split('T')[0],
      ...submissionData
    };
    
    setDb(prev => {
      const newTanks = prev.tanks.map(t => 
        t.id === submissionData.tankId ? { ...t, testStatus: 'Completed' } : t
      );
      const newDrafts = prev.drafts.filter(d => d.tankId !== submissionData.tankId);

      return {
        ...prev,
        submissions: [...prev.submissions, newSubmission],
        tanks: newTanks,
        drafts: newDrafts
      };
    });
    showToast('Record submitted for verification!');
  };

  const updateSubmissionStatus = (submissionId, newStatus) => {
    setDb(prev => ({
      ...prev,
      submissions: prev.submissions.map(s => 
        s.id === submissionId ? { ...s, status: newStatus } : s
      )
    }));
    showToast(`Submission marked as ${newStatus}`);
  };

  const assignFarmerToAgent = (farmerId, newAgentId) => {
    setDb(prev => {
      const newFarmers = prev.farmers.map(f => 
        f.id === farmerId ? { ...f, agentId: newAgentId } : f
      );
      const newTanks = prev.tanks.map(t =>
        t.farmerId === farmerId ? { ...t, agentId: newAgentId } : t
      );
      return { ...prev, farmers: newFarmers, tanks: newTanks };
    });
    showToast(`Farmer reassigned successfully!`);
  };

  const addAgent = (agentData) => {
    setDb(prev => {
      const nextId = `agent${String(prev.agents.length + 1).padStart(3, '0')}`;
      return {
        ...prev,
        agents: [...prev.agents, { ...agentData, id: nextId }]
      };
    });
    showToast(`Agent ${agentData.name} added!`);
  };

  const createFarmerWithTanks = (agentId, farmerData, tanksData) => {
    setDb(prev => {
      const nextFarmerNum = prev.farmers.length > 0 
        ? Math.max(...prev.farmers.map(f => parseInt(f.id.replace('F', '')) || 0)) + 1 
        : 1;
      const newFarmerId = `F${nextFarmerNum.toString().padStart(3, '0')}`;

      let nextTankNum = prev.tanks.length > 0 
        ? Math.max(...prev.tanks.map(t => parseInt(t.id.replace('T', '')) || 0)) + 1 
        : 1;

      const newTanks = tanksData.map((tankData, index) => {
        const tId = `T${(nextTankNum + index).toString().padStart(3, '0')}`;
        return {
          id: tId,
          name: `Tank ${index + 1}`,
          farmerId: newFarmerId,
          agentId,
          status: 'ACTIVE',
          testStatus: 'Completed',
          ...tankData,
          lastTest: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          nextTest: 'TBD'
        };
      });

      const newFarmer = {
        id: newFarmerId,
        name: farmerData.name,
        status: 'ACTIVE',
        agentId,
        phone: farmerData.phone,
        location: `${farmerData.village}, ${farmerData.area}`,
        acres: farmerData.acres,
        waterSource: farmerData.waterSource
      };

      showToast(`Added Farmer ${farmerData.name} with ${newTanks.length} tanks!`);
      
      return {
        ...prev,
        farmers: [...prev.farmers, newFarmer],
        tanks: [...prev.tanks, ...newTanks]
      };
    });
  };

  const addTank = (tankData) => {
    setDb(prev => {
      const nextTankNum = prev.tanks.length > 0 
        ? Math.max(...prev.tanks.map(t => parseInt(t.id.replace('T', '')) || 0)) + 1 
        : 1;
      const newTankId = `T${nextTankNum.toString().padStart(3, '0')}`;
      const farmer = prev.farmers.find(f => f.id === tankData.farmerId);
      const newTank = {
        id: newTankId,
        name: tankData.name || `Tank ${nextTankNum}`,
        farmerId: tankData.farmerId,
        agentId: tankData.agentId || farmer?.agentId || 'agent001',
        status: 'ACTIVE',
        testStatus: 'Due',
        abw: tankData.abw || '10g',
        biomass: tankData.biomass || '500kg',
        fcr: tankData.fcr || '1.2',
        lastTest: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        nextTest: 'TBD',
        acres: tankData.acres || '3 Acres',
        salinity: tankData.salinity || '15 ppt',
        waterSource: tankData.waterSource || 'Borewell'
      };
      showToast(`Tank ${newTank.name} (${newTankId}) added successfully!`);
      return {
        ...prev,
        tanks: [...prev.tanks, newTank]
      };
    });
  };

  const editTank = (tankId, updatedData) => {
    setDb(prev => ({
      ...prev,
      tanks: prev.tanks.map(t => t.id === tankId ? { ...t, ...updatedData } : t)
    }));
    showToast(`Tank ${tankId} updated successfully!`);
  };

  const deleteTank = (tankId) => {
    setDb(prev => ({
      ...prev,
      tanks: prev.tanks.filter(t => t.id !== tankId)
    }));
    showToast(`Tank ${tankId} deleted successfully!`);
  };

  const createFarmerByMobile = (farmerData) => {
    setDb(prev => {
      const cleanPhone = (farmerData.phone || '').replace(/[^0-9]/g, '');
      const existing = prev.farmers.find(f => (f.phone || '').replace(/[^0-9]/g, '') === cleanPhone);
      if (existing && cleanPhone.length > 5) {
        showToast(`Mobile ${farmerData.phone} linked to existing farmer ${existing.name} (${existing.id})!`);
        if (farmerData.agentId) {
          return {
            ...prev,
            farmers: prev.farmers.map(f => f.id === existing.id ? { ...f, agentId: farmerData.agentId } : f)
          };
        }
        return prev;
      }

      const nextFarmerNum = prev.farmers.length > 0 
        ? Math.max(...prev.farmers.map(f => parseInt(f.id.replace('F', '')) || 0)) + 1 
        : 1;
      const newFarmerId = `F${nextFarmerNum.toString().padStart(3, '0')}`;

      const newFarmer = {
        id: newFarmerId,
        name: farmerData.name,
        status: 'ACTIVE',
        agentId: farmerData.agentId || 'agent001',
        phone: farmerData.phone,
        location: farmerData.location || farmerData.village || 'Bhimavaram',
        acres: farmerData.acres || 10,
        waterSource: farmerData.waterSource || 'Borewell',
        mobileVerified: true,
        linkedAt: new Date().toLocaleDateString()
      };

      showToast(`Farmer ${farmerData.name} registered & linked via mobile ${farmerData.phone}!`);

      return {
        ...prev,
        farmers: [...prev.farmers, newFarmer]
      };
    });
  };

  const deleteFarmer = (farmerId) => {
    setDb(prev => ({
      ...prev,
      farmers: prev.farmers.filter(f => f.id !== farmerId),
      tanks: prev.tanks.filter(t => t.farmerId !== farmerId)
    }));
    showToast(`Farmer ${farmerId} and associated tanks removed.`);
  };

  const saveDraft = (draft) => {
    setDb(prev => {
      const existingIndex = prev.drafts.findIndex(d => d.tankId === draft.tankId);
      const newDrafts = [...prev.drafts];
      if (existingIndex >= 0) {
        newDrafts[existingIndex] = draft;
      } else {
        newDrafts.push(draft);
      }
      return { ...prev, drafts: newDrafts };
    });
    showToast('Draft saved!');
  };

  const getDraft = (tankId) => db.drafts.find(d => d.tankId === tankId) || null;

  const addNotification = (agentId, message, type = 'info') => {
    setDb(prev => ({
      ...prev,
      notifications: [{ id: Date.now(), agentId, message, type, read: false, time: new Date().toLocaleString() }, ...(prev.notifications || [])]
    }));
  };

  const markNotificationRead = (notificationId) => {
    setDb(prev => ({
      ...prev,
      notifications: (prev.notifications || []).map(n => n.id === notificationId ? { ...n, read: true } : n)
    }));
  };

  // --- Technician Field Operations Methods ---

  const getWeeklyCompliance = (agentId) => {
    if (!db || !db.farmers || !db.tanks) {
      return {
        completedCount: 0,
        dueCount: 0,
        overdueCount: 0,
        totalAssignedTanks: 0,
        isWeeklyTestSatisfied: false,
        lastTestDate: 'N/A',
        requiredByDate: '28 Aug 2026',
        progressText: '0 / 1',
        complianceRate: 0,
      };
    }

    const assignedFarmers = getFarmersByAgentId(agentId);
    const assignedFarmerIds = new Set(assignedFarmers.map(f => f.id));
    const assignedTanks = db.tanks.filter(t => assignedFarmerIds.has(t.farmerId) || t.agentId === agentId);
    
    let completedCount = 0;
    let dueCount = 0;
    let overdueCount = 0;
    let latestTestDate = null;

    assignedTanks.forEach(tank => {
      if (tank.testStatus === 'Completed') {
        completedCount++;
        if (tank.lastTest && tank.lastTest !== 'TBD') {
          latestTestDate = tank.lastTest;
        }
      } else if (tank.testStatus === 'Due') {
        dueCount++;
      } else if (tank.testStatus === 'Overdue') {
        overdueCount++;
      }
    });

    // Check recent submissions in last 7 days
    const recentSubs = (db.submissions || []).filter(s => s.agentId === agentId);
    if (recentSubs.length > 0) {
      completedCount = Math.max(completedCount, 1);
      if (!latestTestDate && recentSubs[0].date) {
        latestTestDate = recentSubs[0].date;
      }
    }

    const isWeeklyTestSatisfied = completedCount > 0;
    const totalTanks = assignedTanks.length || 1;
    const complianceRate = Math.round((completedCount / totalTanks) * 100);

    return {
      completedCount,
      dueCount,
      overdueCount,
      totalAssignedTanks: assignedTanks.length,
      isWeeklyTestSatisfied,
      lastTestDate: latestTestDate || '21 Aug 2026',
      requiredByDate: '28 Aug 2026',
      progressText: isWeeklyTestSatisfied ? '1 / 1' : '0 / 1',
      complianceRate,
    };
  };

  const getTechnicianAlerts = (agentId) => {
    if (!db) return [];
    const alerts = [];
    const assignedFarmers = getFarmersByAgentId(agentId);
    const assignedFarmerIds = new Set(assignedFarmers.map(f => f.id));
    const assignedTanks = db.tanks.filter(t => assignedFarmerIds.has(t.farmerId) || t.agentId === agentId);

    // 1. Weekly test due / overdue alerts
    assignedTanks.forEach(tank => {
      const farmer = assignedFarmers.find(f => f.id === tank.farmerId);
      const farmerName = farmer ? farmer.name : 'Farmer';
      if (tank.testStatus === 'Overdue') {
        alerts.push({
          id: `ALERT_OD_${tank.id}`,
          type: 'error',
          priority: 'CRITICAL',
          title: 'Weekly Test Overdue',
          message: `Mandatory test overdue for ${farmerName} • ${tank.name}`,
          time: 'Action Required',
          tankId: tank.id,
          farmerId: tank.farmerId,
        });
      } else if (tank.testStatus === 'Due') {
        alerts.push({
          id: `ALERT_DUE_${tank.id}`,
          type: 'warning',
          priority: 'ATTENTION',
          title: 'Weekly Test Due',
          message: `Weekly test scheduled for ${farmerName} • ${tank.name}`,
          time: 'Due This Week',
          tankId: tank.id,
          farmerId: tank.farmerId,
        });
      }
    });

    // 2. High ammonia / water quality alerts
    (db.submissions || [])
      .filter(s => s.agentId === agentId)
      .slice(0, 5)
      .forEach(sub => {
        const farmer = assignedFarmers.find(f => f.id === sub.farmerId);
        const farmerName = farmer ? farmer.name : 'Farmer';
        const tank = assignedTanks.find(t => t.id === sub.tankId);
        const tankName = tank ? tank.name : sub.tankId || 'Pond';

        const nh3 = parseFloat(sub.data?.waterQuality?.ammonia);
        if (!isNaN(nh3) && nh3 > 0.1) {
          alerts.push({
            id: `ALERT_NH3_${sub.id}`,
            type: 'error',
            priority: 'CRITICAL',
            title: 'High Ammonia Reading (NH3)',
            message: `Ammonia at ${nh3} mg/L in ${farmerName} • ${tankName}`,
            time: sub.submittedAgo || 'Recent',
            tankId: sub.tankId,
            farmerId: sub.farmerId,
          });
        }

        const doVal = parseFloat(sub.data?.waterQuality?.do);
        if (!isNaN(doVal) && doVal < 4.0 && doVal > 0) {
          alerts.push({
            id: `ALERT_DO_${sub.id}`,
            type: 'warning',
            priority: 'ATTENTION',
            title: 'Low Dissolved Oxygen (DO)',
            message: `DO at ${doVal} mg/L in ${farmerName} • ${tankName}. Aeration needed.`,
            time: sub.submittedAgo || 'Recent',
            tankId: sub.tankId,
            farmerId: sub.farmerId,
          });
        }
      });

    return alerts;
  };

  const getTechnicianActivityTimeline = (agentId) => {
    if (!db) return [];
    const assignedFarmers = getFarmersByAgentId(agentId);
    const assignedFarmerIds = new Set(assignedFarmers.map(f => f.id));
    
    // Combine submissions + explicit activities
    const timeline = [];

    (db.submissions || [])
      .filter(s => s.agentId === agentId || assignedFarmerIds.has(s.farmerId))
      .forEach(sub => {
        const farmer = assignedFarmers.find(f => f.id === sub.farmerId);
        const tank = (db.tanks || []).find(t => t.id === sub.tankId);
        timeline.push({
          id: sub.id,
          action: sub.testType || sub.recordType || 'Water Quality Test',
          farmerName: farmer ? farmer.name : 'Assigned Farmer',
          farmerId: sub.farmerId,
          tankName: tank ? tank.name : (sub.tankId || 'Pond 01'),
          tankId: sub.tankId,
          date: sub.date || 'Today',
          time: sub.submittedAgo || '10:30 AM',
          gpsVerified: true,
          status: 'COMPLETED',
          details: sub.data?.waterQuality ? `Salinity: ${sub.data.waterQuality.salinity || 16} ppt | pH: ${sub.data.waterQuality.ph || 7.8} | DO: ${sub.data.waterQuality.do || 5.2} mg/L` : 'Field verification completed',
          gps: sub.gps || { locality: 'Chinnamiram, Bhimavaram', accuracy: 8 }
        });
      });

    // Add explicit activities
    (db.activities || []).forEach(act => {
      timeline.push({
        id: `ACT_${act.id}`,
        action: act.action,
        farmerName: 'Field Audit',
        tankName: 'Pond Area',
        date: act.time?.split(' ')[0] || 'Today',
        time: act.time?.split(' ').slice(1).join(' ') || '10:00 AM',
        gpsVerified: true,
        status: 'COMPLETED',
        details: act.detail,
        gps: { locality: 'Bhimavaram Cluster', accuracy: 10 }
      });
    });

    return timeline.slice(0, 15);
  };

  const recordFieldEntry = (entryData) => {
    const {
      agentId = 'agent001',
      farmerId,
      tankId,
      recordType = 'WATER_QUALITY',
      data = {},
      gps = null,
      notes = '',
      photo = null,
      offline = false,
    } = entryData;

    const subId = `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const formattedDate = new Date().toISOString().split('T')[0];
    const farmer = (db?.farmers || []).find(f => f.id === farmerId);
    const tank = (db?.tanks || []).find(t => t.id === tankId);

    const newRecord = {
      id: subId,
      agentId,
      farmerId,
      tankId,
      recordType,
      testType: recordType === 'WATER_QUALITY' ? 'Water Analysis' :
                recordType === 'FEED_ENTRY' ? 'Feed Test' :
                recordType === 'BIOMASS_SAMPLING' ? 'Biomass Sampling' :
                recordType === 'MORTALITY_LOG' ? 'Mortality Log' :
                recordType === 'FARM_ACTIVITY' ? 'Farm Activity' :
                recordType === 'HARVEST' ? 'Harvest' : 'Field Test',
      date: formattedDate,
      submittedAgo: 'Just now',
      status: 'PENDING_VERIFICATION',
      data,
      notes,
      photo,
      gps: gps || {
        latitude: 16.5449,
        longitude: 81.5212,
        accuracy: 8,
        locality: farmer ? farmer.location : 'Bhimavaram',
        verified: true
      },
      offline: !!offline,
      createdAt: new Date().toISOString()
    };

    setDb(prev => {
      // Update tank status & performance metrics
      const newTanks = (prev.tanks || []).map(t => {
        if (t.id === tankId) {
          const tankUpdates = {
            ...t,
            lastTest: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            testStatus: 'Completed',
          };

          if (data.biomass) tankUpdates.biomass = data.biomass;
          if (data.abw) tankUpdates.abw = data.abw;
          if (data.fcr) tankUpdates.fcr = data.fcr;
          if (data.salinity) tankUpdates.salinity = `${data.salinity} ppt`;

          return tankUpdates;
        }
        return t;
      });

      const actionText = `${newRecord.testType} Logged`;
      const detailText = `${newRecord.testType} completed for ${farmer ? farmer.name : farmerId} • ${tank ? tank.name : tankId}`;
      const timeStr = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });

      const newActivities = [
        { id: Date.now(), time: timeStr, action: actionText, detail: detailText },
        ...(prev.activities || [])
      ];

      return {
        ...prev,
        submissions: [newRecord, ...(prev.submissions || [])],
        tanks: newTanks,
        activities: newActivities,
        drafts: (prev.drafts || []).filter(d => d.tankId !== tankId)
      };
    });

    showToast(`Field record saved successfully! GPS coordinates attached.`);
    return newRecord;
  };

  const addPondToFarmer = (farmerId, pondData) => {
    setDb(prev => {
      const nextTankNum = prev.tanks.length > 0 
        ? Math.max(...prev.tanks.map(t => parseInt(t.id.replace('T', '')) || 0)) + 1 
        : 1;
      const newTankId = `T${nextTankNum.toString().padStart(3, '0')}`;
      const farmer = prev.farmers.find(f => f.id === farmerId);

      const newPond = {
        id: newTankId,
        name: pondData.name || `Pond ${nextTankNum}`,
        farmerId,
        agentId: pondData.agentId || farmer?.agentId || 'agent001',
        status: pondData.status || 'ACTIVE',
        testStatus: 'Due',
        species: pondData.species || 'Vannamei',
        cultureType: pondData.cultureType || 'Semi-Intensive',
        stockingDate: pondData.stockingDate || new Date().toISOString().split('T')[0],
        seedQuantity: pondData.seedQuantity || '200,000',
        area: pondData.area ? `${pondData.area} Acres` : '2.5 Acres',
        acres: pondData.area ? `${pondData.area} Acres` : '2.5 Acres',
        waterArea: pondData.waterArea ? `${pondData.waterArea} Acres` : '2.2 Acres',
        abw: pondData.abw || '10g',
        biomass: pondData.biomass || '600kg',
        fcr: pondData.fcr || '1.15',
        salinity: pondData.salinity ? `${pondData.salinity} ppt` : '16 ppt',
        lastTest: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        nextTest: '28 Aug 2026',
        gps: pondData.gps || null,
        notes: pondData.notes || '',
      };

      showToast(`Pond ${newPond.name} added to farmer!`);
      return {
        ...prev,
        tanks: [...prev.tanks, newPond]
      };
    });
  };

  return (
    <MockDataContext.Provider value={{
      db,
      getAgentById,
      getFarmersByAgentId,
      getFarmerById,
      getTanksByFarmerId,
      getTankById,
      getSubmissionsByAgentId,
      getAgentNotifications,
      getAgentDashboardMetrics,
      getInchargeDashboardMetrics,
      getWeeklyCompliance,
      getTechnicianAlerts,
      getTechnicianActivityTimeline,
      recordFieldEntry,
      addPondToFarmer,
      updateTank,
      updateFarmer,
      submitRecord,
      updateSubmissionStatus,
      assignFarmerToAgent,
      createFarmerWithTanks,
      addTank,
      editTank,
      deleteTank,
      createFarmerByMobile,
      deleteFarmer,
      saveDraft,
      getDraft,
      addAgent,
      addActivity,
      addNotification,
      markNotificationRead
    }}>
      {children}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#0018AD',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0, 24, 173, 0.35)',
          zIndex: 9999,
          fontWeight: '600',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            backgroundColor: 'white',
            borderRadius: '50%'
          }}></span>
          {toastMessage}
        </div>
      )}
    </MockDataContext.Provider>
  );
};

export const useMockData = () => useContext(MockDataContext);
