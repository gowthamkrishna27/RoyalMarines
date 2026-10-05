import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSession } from '../agent/utils/agentAuth';
import { apiClient } from '../utils/apiClient';

// --- Initial Data Seed ---

const initialRegions = [
  { id: 'REG001', name: 'Bhimavaram' },
  { id: 'REG002', name: 'Kakinada' }
];

const initialIncharges = [
  { id: 'INC001', name: 'Ravi Kumar', regionId: 'REG001', email: 'incharge@example.com' }
];

const initialAgents = [
  { id: 'agent001', name: 'Ramesh', phone: '9000000001', inchargeId: 'INC001', status: 'ACTIVE', locality: 'Chinnamiram' },
  { id: 'agent002', name: 'Suresh', phone: '9000000002', inchargeId: 'INC001', status: 'ACTIVE', locality: 'Bhimavaram' },
  { id: 'agent003', name: 'Mahesh', phone: '9000000003', inchargeId: 'INC001', status: 'ACTIVE', locality: 'Akuruvu' }
];

const initialFarmers = [];
const initialTanks = [];
const initialSubmissions = [];

// --- Context Definition ---

const MockDataContext = createContext(null);

// Auto-normalize all tanks so every farmer's tanks are named Tank 1, Tank 2, ...
const normalizeTanks = (tanks) => {
  if (!Array.isArray(tanks)) return [];
  const countMap = {};
  return tanks.map(tank => {
    const fId = tank.farmerId || 'UNKNOWN';
    countMap[fId] = (countMap[fId] || 0) + 1;
    return {
      ...tank,
      name: `Tank ${countMap[fId]}`
    };
  });
};

const getInitialDb = () => {
  const fallbackDb = {
    regions: initialRegions,
    incharges: initialIncharges,
    agents: initialAgents,
    farmers: initialFarmers,
    tanks: normalizeTanks(initialTanks),
    submissions: initialSubmissions,
    cultureCycles: [],
    drafts: [],
    notifications: [],
    activities: []
  };

  if (typeof window === 'undefined') return fallbackDb;

  ['aqua_feed_mock_database_v7', 'aqua_feed_mock_database_v8', 'aqua_feed_mock_database_v9', 'aqua_feed_mock_database_v10', 'aqua_feed_mock_database_v11', 'agent_harvest_store'].forEach(k => {
    try { localStorage.removeItem(k); } catch (e) {}
  });

  try {
    const savedData = localStorage.getItem('aqua_feed_clean_database_v1');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (parsed) {
        parsed.tanks = normalizeTanks(parsed.tanks || []);
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error parsing storage:', e);
  }

  try {
    localStorage.setItem('aqua_feed_clean_database_v1', JSON.stringify(fallbackDb));
  } catch (e) {}
  return fallbackDb;
};


// Helper to check if date falls in current Monday-Sunday calendar week
export const isDateInCurrentMondaySundayWeek = (dateInput) => {
  if (!dateInput) return false;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return false;

    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return d >= monday && d <= sunday;
  } catch (e) {
    return false;
  }
};

// Helper to check if date falls in previous Monday-Sunday calendar week
export const isDateInLastMondaySundayWeek = (dateInput) => {
  if (!dateInput) return false;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return false;

    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() - distanceToMonday);
    thisMonday.setHours(0, 0, 0, 0);

    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);
    lastMonday.setHours(0, 0, 0, 0);

    const lastSunday = new Date(thisMonday);
    lastSunday.setMilliseconds(-1);

    return d >= lastMonday && d <= lastSunday;
  } catch (e) {
    return false;
  }
};

export const ROUTINE_TEST_TYPES = [
  { key: 'WATER_QUALITY', label: 'Water Analysis', matchKeys: ['WATER'], icon: 'Droplets' },
  { key: 'FEED_ENTRY', label: 'Feed Test', matchKeys: ['FEED'], icon: 'Wheat' },
  { key: 'DISEASE', label: 'Disease Observation', matchKeys: ['DISEASE'], icon: 'Activity' },
  { key: 'MEDICATION', label: 'Medication', matchKeys: ['MEDICAT', 'MEDICINE'], icon: 'Pill' },
  { key: 'MORTALITY_LOG', label: 'Mortality Check', matchKeys: ['MORTALITY'], icon: 'Skull' },
  { key: 'FARM_ACTIVITY', label: 'Farm Activity', matchKeys: ['ACTIVITY', 'FARM'], icon: 'ClipboardList' },
  { key: 'PHOTO_OBSERVATION', label: 'Photo Observation', matchKeys: ['PHOTO'], icon: 'Camera' },
];

export const getTankOverdueBreakdown = (tank, submissions = []) => {
  if (!tank) {
    return { overdueTests: ROUTINE_TEST_TYPES, completedLastWeek: [], overdueCount: ROUTINE_TEST_TYPES.length, isOverdue: true, summaryText: 'Overdue tests from last week' };
  }

  const harvestStore = (typeof window !== 'undefined') ? JSON.parse(localStorage.getItem('agent_harvest_store') || '{}') : {};
  const storeKey = `${tank.farmerId}_${tank.id}`;
  const tankHarvests = harvestStore[storeKey]?.harvests || [];
  const isFinalDone = tank.status === 'Harvested' || tank.status === 'Completed' || tank.finalHarvestCompleted || tankHarvests.some(h => h.isFinal || h.harvestType === 'Final Harvest');

  if (isFinalDone) {
    return { overdueTests: [], completedLastWeek: [], overdueCount: 0, isOverdue: false, summaryText: 'Harvest Completed' };
  }

  const tankSubs = (submissions || []).filter(s => 
    (s.tankId === tank.id || s.tankName === tank.name) &&
    !((s.testType || s.recordType || '').toUpperCase().includes('HARVEST'))
  );

  const completedLastWeek = [];
  const uncompletedLastWeek = [];

  ROUTINE_TEST_TYPES.forEach(test => {
    const foundLastWeek = tankSubs.find(s => {
      const typeUpper = (s.testType || s.recordType || '').toUpperCase();
      const matches = test.matchKeys.some(k => typeUpper.includes(k));
      if (!matches) return false;
      const d = s.date || s.createdAt;
      return isDateInLastMondaySundayWeek(d);
    });

    if (foundLastWeek) {
      completedLastWeek.push({
        ...test,
        completedAt: foundLastWeek.date || 'Last Week',
        recordId: foundLastWeek.id,
      });
    } else {
      uncompletedLastWeek.push(test);
    }
  });

  const overdueTests = uncompletedLastWeek;
  const overdueCount = overdueTests.length > 0 ? overdueTests.length : ROUTINE_TEST_TYPES.length;

  return {
    overdueTests,
    completedLastWeek,
    overdueCount,
    isOverdue: true,
    summaryText: `${overdueCount} overdue test${overdueCount > 1 ? 's' : ''} from last week`,
  };
};

export const getTankWeeklyTestBreakdown = (tank, submissions = []) => {
  if (!tank) {
    return {
      dueTests: ROUTINE_TEST_TYPES,
      completedTests: [],
      allUpToDate: false,
      hasCompletedAny: false,
      totalTestsCount: ROUTINE_TEST_TYPES.length,
      completedCount: 0,
      dueCount: ROUTINE_TEST_TYPES.length,
      summaryText: 'All 7 tests due this week',
    };
  }

  const harvestStore = (typeof window !== 'undefined') ? JSON.parse(localStorage.getItem('agent_harvest_store') || '{}') : {};
  const storeKey = `${tank.farmerId}_${tank.id}`;
  const tankHarvests = harvestStore[storeKey]?.harvests || [];
  const isFinalDone = tank.status === 'Harvested' || 
    tank.status === 'Completed' || 
    tank.finalHarvestCompleted ||
    tankHarvests.some(h => h.isFinal || h.harvestType === 'Final Harvest');

  if (isFinalDone) {
    return {
      dueTests: [],
      completedTests: [],
      allUpToDate: true,
      isHarvested: true,
      hasCompletedAny: true,
      totalTestsCount: ROUTINE_TEST_TYPES.length,
      completedCount: ROUTINE_TEST_TYPES.length,
      dueCount: 0,
      summaryText: 'Harvest Completed - Cycle Closed',
    };
  }

  const tankSubs = (submissions || []).filter(s => 
    (s.tankId === tank.id || s.tankName === tank.name) &&
    !((s.testType || s.recordType || '').toUpperCase().includes('HARVEST'))
  );

  const completedTests = [];
  const dueTests = [];

  ROUTINE_TEST_TYPES.forEach(test => {
    const foundThisWeek = tankSubs.find(s => {
      const typeUpper = (s.testType || s.recordType || '').toUpperCase();
      const matches = test.matchKeys.some(k => typeUpper.includes(k));
      if (!matches) return false;
      const d = s.date || s.createdAt;
      return isDateInCurrentMondaySundayWeek(d);
    });

    if (foundThisWeek) {
      completedTests.push({
        ...test,
        completedAt: foundThisWeek.date || 'This Week',
        recordId: foundThisWeek.id,
      });
    } else {
      dueTests.push(test);
    }
  });

  const dueCount = dueTests.length;
  const completedCount = completedTests.length;
  const summaryText = dueCount === 0
    ? 'All routine tests up to date for this week'
    : `${dueCount} test${dueCount > 1 ? 's' : ''} due this week (${dueTests.slice(0, 2).map(t => t.label).join(', ')}${dueCount > 2 ? '...' : ''})`;

  return {
    dueTests,
    completedTests,
    allUpToDate: dueCount === 0,
    hasCompletedAny: completedCount > 0,
    totalTestsCount: ROUTINE_TEST_TYPES.length,
    completedCount,
    dueCount,
    summaryText,
  };
};

export const getTankWeeklyComputedStatus = (tank, submissions = []) => {
  if (!tank) return { testStatus: 'Due', isDue: true, lastTest: 'TBD', nextTest: 'Due This Week', dueCount: ROUTINE_TEST_TYPES.length, completedCount: 0, allUpToDate: false };

  const breakdown = getTankWeeklyTestBreakdown(tank, submissions);
  if (breakdown.isHarvested) {
    return {
      testStatus: 'Completed',
      isDue: false,
      status: 'Harvested',
      lastTest: tank.lastTest || 'Harvest Done',
      nextTest: 'Cycle Closed',
      dueThisWeek: false,
      dueCount: 0,
      completedCount: breakdown.completedCount,
      allUpToDate: true,
    };
  }

  const tankSubs = (submissions || []).filter(s => 
    (s.tankId === tank.id || s.tankName === tank.name) &&
    !((s.testType || s.recordType || '').toUpperCase().includes('HARVEST'))
  );
  const latestSub = tankSubs.length > 0 ? tankSubs[0] : null;
  const latestTestDate = latestSub?.date || tank.lastTest || 'TBD';

  if (breakdown.allUpToDate) {
    return {
      testStatus: 'Completed',
      isDue: false,
      status: tank.status || 'ACTIVE',
      lastTest: latestTestDate,
      nextTest: 'Next Week (Mon-Sun)',
      dueThisWeek: false,
      dueCount: 0,
      completedCount: breakdown.completedCount,
      allUpToDate: true,
    };
  }

  return {
    testStatus: 'Due',
    isDue: true,
    status: tank.status || 'ACTIVE',
    lastTest: latestTestDate,
    nextTest: 'Due This Week',
    dueThisWeek: true,
    dueCount: breakdown.dueCount,
    completedCount: breakdown.completedCount,
    allUpToDate: false,
  };
};

export const MockDataProvider = ({ children }) => {
  const [db, setDb] = useState(getInitialDb);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);

  const fetchDataFromDb = async () => {
    setIsLoadingDb(true);
    try {
      const [farmersRes, tanksRes, subsRes, harvestsRes, agentsRes, regionsRes, inchargesRes] = await Promise.allSettled([
        apiClient.get('/farmers'),
        apiClient.get('/tanks'),
        apiClient.get('/submissions'),
        apiClient.get('/harvests'),
        apiClient.get('/analytics/agents'),
        apiClient.get('/analytics/regions'),
        apiClient.get('/analytics/incharges'),
      ]);

      const apiFarmers = farmersRes.status === 'fulfilled' && farmersRes.value?.data ? farmersRes.value.data : null;
      const apiTanks = tanksRes.status === 'fulfilled' && tanksRes.value?.data ? tanksRes.value.data : null;
      const apiSubs = subsRes.status === 'fulfilled' && subsRes.value?.data ? subsRes.value.data : null;
      const apiHarvests = harvestsRes.status === 'fulfilled' && harvestsRes.value?.data ? harvestsRes.value.data : null;
      const apiAgents = agentsRes.status === 'fulfilled' && agentsRes.value?.data ? agentsRes.value.data : null;
      const apiRegions = regionsRes.status === 'fulfilled' && regionsRes.value?.data ? regionsRes.value.data : null;
      const apiIncharges = inchargesRes.status === 'fulfilled' && inchargesRes.value?.data ? inchargesRes.value.data : null;

      if (apiFarmers || apiTanks || apiSubs) {
        setDb(prev => {
          const mergedFarmers = apiFarmers && apiFarmers.length > 0 ? apiFarmers : prev.farmers;
          const rawTanks = apiTanks && apiTanks.length > 0 ? apiTanks : prev.tanks;
          const mergedTanks = normalizeTanks(rawTanks);
          const mergedSubs = apiSubs ? apiSubs : prev.submissions;
          const mergedHarvests = apiHarvests ? apiHarvests : prev.harvests;
          const mergedAgents = apiAgents && apiAgents.length > 0 ? apiAgents : prev.agents;
          const mergedRegions = apiRegions && apiRegions.length > 0 ? apiRegions : prev.regions;
          const mergedIncharges = apiIncharges && apiIncharges.length > 0 ? apiIncharges : prev.incharges;

          return {
            ...prev,
            farmers: mergedFarmers,
            tanks: mergedTanks,
            submissions: mergedSubs,
            harvests: mergedHarvests,
            agents: mergedAgents,
            regions: mergedRegions,
            incharges: mergedIncharges,
          };
        });
        setDbConnected(true);
      }
    } catch (err) {
      console.warn('[MockDataContext] Live DB fetch error:', err.message);
      setDbConnected(false);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchDataFromDb();
  }, []);

  // Save to LocalStorage whenever DB changes
  useEffect(() => {
    if (db) {
      try {
        localStorage.setItem('aqua_feed_clean_database_v1', JSON.stringify(db));
      } catch (e) {}
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

  const logActivity = (action, detail) => {
    const now = new Date();
    const time = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setDb(prev => ({
      ...prev,
      activities: [{ id: Date.now(), time, action, detail }, ...(prev.activities || [])]
    }));
  };

  const addActivity = logActivity;

  // If db is not yet loaded, don't render children (avoid errors)
  if (!db) return null;

  // --- Selectors ---

  const getAgentById = (id) => (db?.agents || []).find(a => a.id === id);

  const getFarmersByAgentId = (agentId) => {
    if (!db || !db.farmers) return [];
    return db.farmers.filter(f => f.agentId === agentId);
  };

  const getFarmerById = (id) => db.farmers.find(f => f.id === id);

  const getTanksByFarmerId = (farmerId) => {
    if (!db || !db.tanks) return [];
    const fTanks = db.tanks.filter(t => t.farmerId === farmerId);
    return fTanks.map((t, idx) => ({
      ...t,
      name: `Tank ${idx + 1}`
    }));
  };

  const getTankById = (id) => {
    if (!db || !db.tanks) return null;
    const tank = db.tanks.find(t => t.id === id);
    if (!tank) return null;
    const farmerTanks = db.tanks.filter(t => t.farmerId === tank.farmerId);
    const tankIndex = farmerTanks.findIndex(t => t.id === id);
    return {
      ...tank,
      name: `Tank ${tankIndex >= 0 ? tankIndex + 1 : 1}`
    };
  };

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

  // Advanced Selectors for Incharge Dashboard & Scope
  const getAgentsByInchargeId = (inchargeId = 'INC001') => {
    if (!db || !db.agents) return [];
    return db.agents.filter(a => a.inchargeId === inchargeId || !a.inchargeId);
  };

  const getFarmersByInchargeId = (inchargeId = 'INC001') => {
    if (!db || !db.farmers) return [];
    const inchargeAgentIds = (db.agents || [])
      .filter(a => a.inchargeId === inchargeId)
      .map(a => a.id);
    return db.farmers
      .filter(f =>
        f.inchargeId === inchargeId ||
        (f.agentId && inchargeAgentIds.includes(f.agentId)) ||
        !f.inchargeId
      )
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
  };

  // Personal Incharge Farmers (Assigned directly by Admin to Incharge or registered by Incharge)
  const getMyFarmersByInchargeId = (inchargeId = 'INC001') => {
    if (!db || !db.farmers) return [];
    return db.farmers
      .filter(f => (f.inchargeId === inchargeId && (!f.agentId || f.assignedTo === 'Incharge')) || (!f.agentId && f.inchargeId === inchargeId))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
  };

  // Personal Incharge Tanks (Tanks under Incharge's personal farmers or direct incharge supervision)
  const getMyTanksByInchargeId = (inchargeId = 'INC001') => {
    if (!db || !db.tanks) return [];
    const myFarmers = getMyFarmersByInchargeId(inchargeId);
    const myFarmerIds = myFarmers.map(f => f.id);
    return db.tanks
      .filter(t => (t.inchargeId === inchargeId && (!t.agentId || t.assignedTo === 'Incharge')) || myFarmerIds.includes(t.farmerId))
      .sort((a, b) => {
        const fA = myFarmers.find(f => f.id === a.farmerId);
        const fB = myFarmers.find(f => f.id === b.farmerId);
        const nameA = fA ? fA.name : '';
        const nameB = fB ? fB.name : '';
        const farmerDiff = nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
        if (farmerDiff !== 0) return farmerDiff;
        return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
      });
  };

  const getTanksByInchargeId = (inchargeId = 'INC001') => {
    if (!db || !db.tanks) return [];
    const inchargeFarmers = getFarmersByInchargeId(inchargeId);
    const farmerIds = inchargeFarmers.map(f => f.id);
    return db.tanks
      .filter(t => farmerIds.includes(t.farmerId) || t.inchargeId === inchargeId)
      .sort((a, b) => {
        const fA = inchargeFarmers.find(f => f.id === a.farmerId);
        const fB = inchargeFarmers.find(f => f.id === b.farmerId);
        const nameA = fA ? fA.name : '';
        const nameB = fB ? fB.name : '';
        const farmerDiff = nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
        if (farmerDiff !== 0) return farmerDiff;
        return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
      });
  };

  const assignFarmerToIncharge = (farmerId, inchargeId) => {
    setDb(prev => ({
      ...prev,
      farmers: prev.farmers.map(f => f.id === farmerId ? { ...f, inchargeId } : f)
    }));
    apiClient.put(`/farmers/${farmerId}`, { inchargeId }).catch(() => {});
    showToast(`Farmer assigned to Incharge!`);
  };

  const assignTankToIncharge = (tankId, inchargeId) => {
    setDb(prev => ({
      ...prev,
      tanks: prev.tanks.map(t => t.id === tankId ? { ...t, inchargeId } : t)
    }));
    apiClient.put(`/tanks/${tankId}`, { inchargeId }).catch(() => {});
    showToast(`Tank assigned to Incharge!`);
  };

  const assignAgentToIncharge = (agentId, inchargeId) => {
    setDb(prev => ({
      ...prev,
      agents: prev.agents.map(a => a.id === agentId ? { ...a, inchargeId } : a)
    }));
    showToast(`Technician assigned to Incharge!`);
  };

  const getInchargeDashboardMetrics = (inchargeId = 'INC001') => {
    const agents = getAgentsByInchargeId(inchargeId);
    const farmers = getFarmersByInchargeId(inchargeId);
    const tanks = getTanksByInchargeId(inchargeId);

    let testsCompleted = 0;
    let testsDue = 0;
    let overdueTests = 0;

    tanks.forEach(t => {
      if (t.testStatus === 'Completed') testsCompleted++;
      if (t.testStatus === 'Due') testsDue++;
      if (t.testStatus === 'Overdue') overdueTests++;
    });

    const tankIds = tanks.map(t => t.id);
    const pendingVerification = (db.submissions || []).filter(s =>
      tankIds.includes(s.tankId) && s.status === 'PENDING_VERIFICATION'
    ).length;

    return {
      totalAgents: agents.length,
      newAgentsMonth: 0,
      totalFarmers: farmers.length,
      newFarmersMonth: 0,
      totalTanks: tanks.length,
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
    apiClient.put(`/tanks/${tankId}`, updates).catch(() => {});
    showToast(`Tank ${tankId} updated!`);
  };

  const updateFarmer = (farmerId, updates) => {
    setDb(prev => ({
      ...prev,
      farmers: prev.farmers.map(f => f.id === farmerId ? { ...f, ...updates } : f)
    }));
    apiClient.put(`/farmers/${farmerId}`, updates).catch(() => {});
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
      const formattedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const newTanks = prev.tanks.map(t => {
        if (t.id === submissionData.tankId) {
          const isFinal = submissionData.harvest && (submissionData.harvest.type === 'Final' || submissionData.harvest.harvestType === 'Final Harvest');
          return {
            ...t,
            testStatus: 'Completed',
            isOverdue: false,
            lastTest: formattedDate,
            nextTest: 'Due Next Week',
            ...(isFinal ? { status: 'Harvested', finalHarvestCompleted: true } : {})
          };
        }
        return t;
      });
      const newDrafts = prev.drafts.filter(d => d.tankId !== submissionData.tankId);

      const farmer = prev.farmers.find(f => f.id === submissionData.farmerId);
      const tank = prev.tanks.find(t => t.id === submissionData.tankId);
      const actionText = `${submissionData.testType || 'Test'} Submitted`;
      const detailText = `${submissionData.testType || 'Test'} completed for ${farmer ? farmer.name : 'Farmer'} • ${tank ? tank.name : 'Tank'}`;
      const timeStr = `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      return {
        ...prev,
        submissions: [...prev.submissions, newSubmission],
        tanks: newTanks,
        drafts: newDrafts,
        activities: [{ id: Date.now(), time: timeStr, action: actionText, detail: detailText }, ...(prev.activities || [])]
      };
    });
    apiClient.post('/submissions', {
      id: newSubmission.id,
      farmerId: submissionData.farmerId,
      tankId: submissionData.tankId,
      testType: submissionData.testType || 'Water Quality Test',
      agentId: submissionData.agentId || 'agent001',
      date: newSubmission.date,
      data: submissionData.data || submissionData
    }).catch(() => {});
    showToast('Record submitted for verification!');
  };

  const updateSubmissionStatus = (submissionId, newStatus, notes = '') => {
    setDb(prev => ({
      ...prev,
      submissions: prev.submissions.map(s =>
        s.id === submissionId ? { ...s, status: newStatus } : s
      )
    }));
    apiClient.patch(`/submissions/${submissionId}/verify`, { status: newStatus, notes }).catch(() => {});
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
    apiClient.put(`/farmers/${farmerId}`, { agentId: newAgentId }).catch(() => {});
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

  const createFarmerWithTanks = (agentId, farmerData, tanksData = []) => {
    let newFarmerId = null;
    setDb(prev => {
      const nextFarmerNum = prev.farmers.length > 0
        ? Math.max(...prev.farmers.map(f => parseInt((f.id || '').replace(/\D/g, '')) || 0)) + 1
        : 1;
      newFarmerId = `F${nextFarmerNum.toString().padStart(3, '0')}`;

      let startTankNum = prev.tanks.length > 0
        ? Math.max(...prev.tanks.map(t => parseInt((t.id || '').replace(/\D/g, '')) || 0)) + 1
        : 1;

      const targetAgentId = agentId || farmerData.agentId || 'agent001';
      const targetInchargeId = farmerData.inchargeId || (targetAgentId ? (prev.agents?.find(a => a.id === targetAgentId)?.inchargeId || 'INC001') : 'INC001');

      const newTanks = (tanksData || []).map((tankData, index) => {
        const tankNum = startTankNum + index;
        return {
          id: `T${tankNum.toString().padStart(3, '0')}`,
          name: tankData.name || `Tank ${index + 1}`,
          farmerId: newFarmerId,
          agentId: targetAgentId,
          inchargeId: targetInchargeId,
          status: 'ACTIVE',
          testStatus: 'Due',
          isOverdue: false,
          abw: tankData.abw || '12g',
          biomass: tankData.biomass || '800kg',
          fcr: tankData.fcr || '1.2',
          acres: tankData.area || tankData.acres || '2.5 Acres',
          size: tankData.area ? `${tankData.area} Acres` : (tankData.size || '2.5 Acres'),
          salinity: tankData.salinity ? `${tankData.salinity} ppt` : '16 ppt',
          waterSource: tankData.waterSource || farmerData.waterSource || 'Canal',
          species: tankData.species || 'Vannamei',
          cultureType: tankData.cultureType || 'Semi-Intensive',
          stockingDate: tankData.stockingDate || new Date().toISOString().split('T')[0],
          ...tankData,
          lastTest: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          nextTest: 'Due This Week'
        };
      });

      const totalAcres = farmerData.acres || farmerData.extent || (newTanks.length * 2.5);
      const newFarmer = {
        id: newFarmerId,
        name: farmerData.name,
        status: farmerData.status || 'ACTIVE',
        agentId: targetAgentId,
        inchargeId: targetInchargeId,
        assignedTo: targetAgentId ? 'Agent' : 'Incharge',
        assignedBy: farmerData.assignedBy || (targetAgentId ? 'Agent' : 'Incharge'),
        phone: farmerData.phone,
        location: farmerData.location || (farmerData.village ? `${farmerData.village}${farmerData.area ? `, ${farmerData.area}` : ''}` : 'Bhimavaram'),
        village: farmerData.village || farmerData.location || 'Bhimavaram',
        acres: totalAcres,
        extent: totalAcres,
        numberOfTanks: String(newTanks.length || 1),
        waterSource: farmerData.waterSource || 'Canal',
        gps: farmerData.gps || null
      };

      apiClient.post('/farmers', newFarmer).then(() => {
        newTanks.forEach(t => apiClient.post('/tanks', t).catch(() => {}));
      }).catch(() => {});
      showToast(`Added Farmer ${farmerData.name} with ${newTanks.length} tanks!`);

      return {
        ...prev,
        farmers: [...prev.farmers, newFarmer],
        tanks: [...prev.tanks, ...newTanks],
        activities: [
          {
            id: Date.now(),
            time: `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            action: 'Farmer Registered',
            detail: `Added Farmer ${newFarmer.name} (${newFarmer.id}) with ${newTanks.length} tanks`
          },
          ...(prev.activities || [])
        ]
      };
    });
    return newFarmerId;
  };

  const addTank = (tankData) => {
    setDb(prev => {
      const nextTankNum = prev.tanks.length > 0
        ? Math.max(...prev.tanks.map(t => parseInt(t.id.replace('T', '')) || 0)) + 1
        : 1;
      const newTankId = `T${nextTankNum.toString().padStart(3, '0')}`;
      const farmer = prev.farmers.find(f => f.id === tankData.farmerId);
      const existingFarmerTanks = prev.tanks.filter(t => t.farmerId === tankData.farmerId);
      const defaultFarmerTankName = `Tank ${existingFarmerTanks.length + 1}`;
      const newTank = {
        id: newTankId,
        name: tankData.name || defaultFarmerTankName,
        farmerId: tankData.farmerId,
        agentId: tankData.agentId || farmer?.agentId || null,
        inchargeId: tankData.inchargeId || farmer?.inchargeId || 'INC001',
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
      apiClient.post('/tanks', newTank).catch(() => {});
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
    apiClient.put(`/tanks/${tankId}`, updatedData).catch(() => {});
    showToast(`Tank ${tankId} updated successfully!`);
  };

  const deleteTank = (tankId) => {
    setDb(prev => ({
      ...prev,
      tanks: prev.tanks.filter(t => t.id !== tankId)
    }));
    apiClient.delete(`/tanks/${tankId}`).catch(() => {});
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
    apiClient.delete(`/farmers/${farmerId}`).catch(() => {});
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

  const addNotification = (agentId, message, type = 'info', meta = {}) => {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    setDb(prev => ({
      ...prev,
      notifications: [
        {
          id: `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          agentId,
          message,
          type,
          read: false,
          time,
          date,
          createdAt: now.toISOString(),
          ...meta
        },
        ...(prev.notifications || [])
      ]
    }));
  };

  const markNotificationRead = (notificationId) => {
    setDb(prev => ({
      ...prev,
      notifications: (prev.notifications || []).map(n => n.id === notificationId ? { ...n, read: true } : n)
    }));
  };

  const markAllNotificationsRead = (agentId) => {
    setDb(prev => ({
      ...prev,
      notifications: (prev.notifications || []).map(n => (!agentId || n.agentId === agentId) ? { ...n, read: true } : n)
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
        const tankName = tank ? tank.name : sub.tankId || 'Tank';

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
          tankName: tank ? tank.name : (sub.tankId || 'Tank 01'),
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
        tankName: 'Tank Area',
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
          (recordType === 'DISEASE' || recordType === 'DISEASE_OBSERVATION') ? 'Disease' :
            recordType === 'BIOMASS_SAMPLING' ? 'Biomass' :
              recordType === 'MORTALITY_LOG' ? 'Mortality' :
                recordType === 'MEDICATION' ? 'Medication' :
                  recordType === 'FARM_ACTIVITY' ? 'Farm Activity' :
                    (recordType === 'HARVEST' || recordType === 'HARVEST_ENTRY') ? 'Harvest' :
                      recordType === 'PHOTO_OBSERVATION' ? 'Photo' : 'Field Test',
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

          if ((recordType === 'HARVEST_ENTRY' || recordType === 'HARVEST') && (data.harvestType === 'Final Harvest' || data.isFinal)) {
            tankUpdates.status = 'Harvested';
            tankUpdates.finalHarvestCompleted = true;
          }

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

    apiClient.post('/submissions', {
      id: newRecord.id,
      farmerId: newRecord.farmerId,
      tankId: newRecord.tankId,
      testType: newRecord.testType,
      agentId: newRecord.agentId,
      date: newRecord.date,
      status: newRecord.status,
      data: newRecord.data
    }).catch(() => {});

    if (recordType === 'HARVEST_ENTRY' || recordType === 'HARVEST') {
      apiClient.post('/harvests', {
        farmerId: newRecord.farmerId,
        tankId: newRecord.tankId,
        date: newRecord.date,
        quantityKg: parseFloat(data.harvestedBiomass || data.quantityKg || 0),
        countPerKg: parseFloat(data.abw ? (1000 / parseFloat(data.abw)) : (data.countPerKg || 40)),
        quality: data.quality || 'Grade A',
        pricePerKg: parseFloat(data.pricePerKg || 380),
        revenue: parseFloat(data.harvestedBiomass || data.quantityKg || 0) * parseFloat(data.pricePerKg || 380)
      }).catch(() => {});
    }
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

      const newTank = {
        id: newTankId,
        name: pondData.name || `Tank ${nextTankNum}`,
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

      apiClient.post('/tanks', newTank).catch(() => {});
      showToast(`Tank ${newTank.name} added to farmer!`);
      return {
        ...prev,
        tanks: [...prev.tanks, newTank]
      };
    });
  };

  const addTankToFarmer = addPondToFarmer;

  return (
    <MockDataContext.Provider value={{
      db,
      fetchDataFromDb,
      refreshDb: fetchDataFromDb,
      isLoadingDb,
      dbConnected,
      getAgentById,
      getFarmersByAgentId,
      getFarmerById,
      getTanksByFarmerId,
      getTankById,
      getSubmissionsByAgentId,
      getAgentNotifications,
      getAgentDashboardMetrics,
      getInchargeDashboardMetrics,
      getAgentsByInchargeId,
      getFarmersByInchargeId,
      getMyFarmersByInchargeId,
      getTanksByInchargeId,
      getMyTanksByInchargeId,
      assignFarmerToIncharge,
      assignTankToIncharge,
      assignAgentToIncharge,
      getWeeklyCompliance,
      getTankWeeklyTestBreakdown,
      getTankOverdueBreakdown,
      getTankWeeklyComputedStatus,
      ROUTINE_TEST_TYPES,
      getTechnicianAlerts,
      getTechnicianActivityTimeline,
      recordFieldEntry,
      addPondToFarmer,
      addTankToFarmer,
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
      logActivity,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead
    }}>
      {children}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#1A2FB8',
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
