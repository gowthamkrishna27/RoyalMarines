import React, { createContext, useContext, useState, useEffect } from "react";
import { getSession } from "../agent/utils/agentAuth";
import { apiClient } from "../utils/apiClient";
import { adminService } from "../admin/utils/adminService";
import { calculateCurrentDoc } from "../utils/docCalculator";
// Zero mock data - Initial state is empty arrays until populated by MySQL APIs
const initialRegions = [];
const initialIncharges = [];
const initialAgents = [];
const initialFarmers = [];
const initialTanks = [];
const initialSubmissions = [];

// --- Context Definition ---

const MockDataContext = createContext(null);

// Auto-normalize all tanks so every farmer's tanks are named Tank 1, Tank 2, ...
const normalizeTanks = (tanks) => {
  if (!Array.isArray(tanks)) return [];
  const countMap = {};
  return tanks.map((tank) => {
    let fId = tank.farmerId || tank.farmer_id || "UNKNOWN";
    if (fId === "1" || fId === "FAR001") fId = "F001";
    countMap[fId] = (countMap[fId] || 0) + 1;
    const currentDoc = calculateCurrentDoc(tank);
    return {
      ...tank,
      farmerId: tank.farmerId || tank.farmer_id || fId,
      name: tank.name || `Tank ${countMap[fId]}`,
      doc: currentDoc,
      enteredDoc: tank.enteredDoc !== undefined ? tank.enteredDoc : (tank.doc !== undefined && tank.doc !== null ? Number(tank.doc) : 0),
      baselineDoc: tank.baselineDoc !== undefined ? tank.baselineDoc : (tank.doc !== undefined && tank.doc !== null ? Number(tank.doc) : 0),
      stockingDate: tank.stockingDate || tank.stocking_date || tank.seedDate || tank.seed_date || null,
      seedDate: tank.seedDate || tank.seed_date || tank.stockingDate || tank.stocking_date || null,
    };
  });
};

// Helper to deduplicate farmers by ID or (name + phone/village)
export const deduplicateFarmers = (farmers) => {
  if (!Array.isArray(farmers)) return [];
  const seenIds = new Set();
  const seenIdentity = new Set();
  return farmers.filter((f) => {
    if (!f) return false;
    const id = String(f.id || "").trim();
    const cleanPhone = (f.phone || "").replace(/\D/g, "");
    const cleanName = (f.name || "").trim().toLowerCase();
    const cleanLoc = (f.village || f.location || "").trim().toLowerCase();
    const identity = `${cleanName}_${cleanPhone || cleanLoc}`;

    if (id && seenIds.has(id)) return false;
    if (identity && seenIdentity.has(identity)) return false;

    if (id) seenIds.add(id);
    if (identity) seenIdentity.add(identity);
    return true;
  });
};

const getInitialDb = () => {
  // Business data starts empty - authoritative source is live MySQL API
  const fallbackDb = {
    regions: initialRegions,
    incharges: initialIncharges,
    agents: initialAgents,
    farmers: initialFarmers,
    tanks: normalizeTanks(initialTanks),
    submissions: initialSubmissions,
    harvests: [],
    cultureCycles: [],
    drafts: [],
    notifications: [],
    activities: [],
  };

  if (typeof window === "undefined") return fallbackDb;

  // Clean up legacy stale local storage keys confirmed to cause data pollution
  [
    "aqua_feed_clean_database_v1",
    "aqua_feed_mock_database_v7",
    "aqua_feed_mock_database_v8",
    "aqua_feed_mock_database_v9",
    "aqua_feed_mock_database_v10",
    "aqua_feed_mock_database_v11",
    "agent_harvest_store",
    "royal_admin_incharges_data",
    "royal_admin_agents_data",
    "royal_admin_farmers_data",
  ].forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  });

  // Preserve legitimately stored user drafts
  try {
    const savedDrafts = localStorage.getItem("aqua_feed_drafts");
    if (savedDrafts) {
      fallbackDb.drafts = JSON.parse(savedDrafts) || [];
    }
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
  {
    key: "WATER_QUALITY",
    label: "Water Analysis",
    matchKeys: ["WATER"],
    icon: "Droplets",
  },
  { key: "FEED_ENTRY", label: "Feed Test", matchKeys: ["FEED"], icon: "Wheat" },
  {
    key: "DISEASE",
    label: "Disease Observation",
    matchKeys: ["DISEASE"],
    icon: "Activity",
  },
  {
    key: "MEDICATION",
    label: "Medication",
    matchKeys: ["MEDICAT", "MEDICINE"],
    icon: "Pill",
  },
  {
    key: "MORTALITY_LOG",
    label: "Mortality Check",
    matchKeys: ["MORTALITY"],
    icon: "Skull",
  },
  {
    key: "FARM_ACTIVITY",
    label: "Farm Activity",
    matchKeys: ["ACTIVITY", "FARM"],
    icon: "ClipboardList",
  },
  {
    key: "PHOTO_OBSERVATION",
    label: "Photo Observation",
    matchKeys: ["PHOTO"],
    icon: "Camera",
  },
];

export const getTankOverdueBreakdown = (tank, submissions = []) => {
  if (!tank) {
    return {
      overdueTests: ROUTINE_TEST_TYPES,
      completedLastWeek: [],
      overdueCount: ROUTINE_TEST_TYPES.length,
      isOverdue: true,
      summaryText: "Overdue tests from last week",
    };
  }

  const harvestStore =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("agent_harvest_store") || "{}")
      : {};
  const storeKey = `${tank.farmerId}_${tank.id}`;
  const tankHarvests = harvestStore[storeKey]?.harvests || [];
  const isFinalDone =
    tank.status === "Harvested" ||
    tank.status === "Completed" ||
    tank.finalHarvestCompleted ||
    tankHarvests.some((h) => h.isFinal || h.harvestType === "Final Harvest");

  if (isFinalDone) {
    return {
      overdueTests: [],
      completedLastWeek: [],
      overdueCount: 0,
      isOverdue: false,
      summaryText: "Harvest Completed",
    };
  }

  const tankSubs = (submissions || []).filter(
    (s) =>
      (s.tankId === tank.id || s.tankName === tank.name) &&
      !(s.testType || s.recordType || "").toUpperCase().includes("HARVEST"),
  );

  const completedLastWeek = [];
  const uncompletedLastWeek = [];

  ROUTINE_TEST_TYPES.forEach((test) => {
    const foundLastWeek = tankSubs.find((s) => {
      const typeUpper = (s.testType || s.recordType || "").toUpperCase();
      const matches = test.matchKeys.some((k) => typeUpper.includes(k));
      if (!matches) return false;
      const d = s.date || s.createdAt;
      return isDateInLastMondaySundayWeek(d);
    });

    if (foundLastWeek) {
      completedLastWeek.push({
        ...test,
        completedAt: foundLastWeek.date || "Last Week",
        recordId: foundLastWeek.id,
      });
    } else {
      uncompletedLastWeek.push(test);
    }
  });

  const overdueTests = uncompletedLastWeek;
  const overdueCount =
    overdueTests.length > 0 ? overdueTests.length : ROUTINE_TEST_TYPES.length;

  return {
    overdueTests,
    completedLastWeek,
    overdueCount,
    isOverdue: true,
    summaryText: `${overdueCount} overdue test${overdueCount > 1 ? "s" : ""} from last week`,
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
      summaryText: "All 7 tests due this week",
    };
  }

  const harvestStore =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("agent_harvest_store") || "{}")
      : {};
  const storeKey = `${tank.farmerId}_${tank.id}`;
  const tankHarvests = harvestStore[storeKey]?.harvests || [];
  const isFinalDone =
    tank.status === "Harvested" ||
    tank.status === "Completed" ||
    tank.finalHarvestCompleted ||
    tankHarvests.some((h) => h.isFinal || h.harvestType === "Final Harvest");

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
      summaryText: "Harvest Completed - Cycle Closed",
    };
  }

  const tankSubs = (submissions || []).filter(
    (s) =>
      (s.tankId === tank.id || s.tankName === tank.name) &&
      !(s.testType || s.recordType || "").toUpperCase().includes("HARVEST"),
  );

  const completedTests = [];
  const dueTests = [];

  ROUTINE_TEST_TYPES.forEach((test) => {
    const foundThisWeek = tankSubs.find((s) => {
      const typeUpper = (s.testType || s.recordType || "").toUpperCase();
      const matches = test.matchKeys.some((k) => typeUpper.includes(k));
      if (!matches) return false;
      const d = s.date || s.createdAt;
      return isDateInCurrentMondaySundayWeek(d);
    });

    if (foundThisWeek) {
      completedTests.push({
        ...test,
        completedAt: foundThisWeek.date || "This Week",
        recordId: foundThisWeek.id,
      });
    } else {
      dueTests.push(test);
    }
  });

  const dueCount = dueTests.length;
  const completedCount = completedTests.length;
  const summaryText =
    dueCount === 0
      ? "All routine tests up to date for this week"
      : `${dueCount} test${dueCount > 1 ? "s" : ""} due this week (${dueTests
          .slice(0, 2)
          .map((t) => t.label)
          .join(", ")}${dueCount > 2 ? "..." : ""})`;

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
  if (!tank)
    return {
      testStatus: "Due",
      isDue: true,
      lastTest: "TBD",
      nextTest: "Due This Week",
      dueCount: ROUTINE_TEST_TYPES.length,
      completedCount: 0,
      allUpToDate: false,
    };

  const breakdown = getTankWeeklyTestBreakdown(tank, submissions);
  if (breakdown.isHarvested) {
    return {
      testStatus: "Completed",
      isDue: false,
      status: "Harvested",
      lastTest: tank.lastTest || "Harvest Done",
      nextTest: "Cycle Closed",
      dueThisWeek: false,
      dueCount: 0,
      completedCount: breakdown.completedCount,
      allUpToDate: true,
    };
  }

  const tankSubs = (submissions || []).filter(
    (s) =>
      (s.tankId === tank.id || s.tankName === tank.name) &&
      !(s.testType || s.recordType || "").toUpperCase().includes("HARVEST"),
  );
  const latestSub = tankSubs.length > 0 ? tankSubs[0] : null;
  const latestTestDate = latestSub?.date || tank.lastTest || "TBD";

  if (breakdown.allUpToDate) {
    return {
      testStatus: "Completed",
      isDue: false,
      status: tank.status || "ACTIVE",
      lastTest: latestTestDate,
      nextTest: "Next Week (Mon-Sun)",
      dueThisWeek: false,
      dueCount: 0,
      completedCount: breakdown.completedCount,
      allUpToDate: true,
    };
  }

  return {
    testStatus: "Due",
    isDue: true,
    status: tank.status || "ACTIVE",
    lastTest: latestTestDate,
    nextTest: "Due This Week",
    dueThisWeek: true,
    dueCount: breakdown.dueCount,
    completedCount: breakdown.completedCount,
    allUpToDate: false,
  };
};

export const MockDataProvider = ({ children }) => {
  const [db, setDb] = useState(getInitialDb);
  const [toastMessage, setToastMessage] = useState("");
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);
  const [dbError, setDbError] = useState(null);

  // Granular, authoritative refresh methods:
  const refreshFarmers = async () => {
    try {
      const res = await apiClient.get("/farmers");
      const list = Array.isArray(res?.data) ? res.data : [];
      const deduplicated = deduplicateFarmers(list);
      setDb((prev) => ({ ...prev, farmers: deduplicated }));
      return deduplicated;
    } catch (err) {
      console.error("[MockDataContext] refreshFarmers error:", err.message);
      setDbError(`Farmers fetch failed: ${err.message}`);
      throw err;
    }
  };

  const refreshTanks = async () => {
    try {
      const res = await apiClient.get("/tanks");
      const list = Array.isArray(res?.data) ? res.data : [];
      const normalized = normalizeTanks(list);
      setDb((prev) => ({ ...prev, tanks: normalized }));
      return normalized;
    } catch (err) {
      console.error("[MockDataContext] refreshTanks error:", err.message);
      setDbError(`Tanks fetch failed: ${err.message}`);
      throw err;
    }
  };

  const refreshSubmissions = async () => {
    try {
      const res = await apiClient.get("/submissions");
      const list = Array.isArray(res?.data) ? res.data : [];
      setDb((prev) => ({ ...prev, submissions: list }));
      return list;
    } catch (err) {
      console.error("[MockDataContext] refreshSubmissions error:", err.message);
      setDbError(`Submissions fetch failed: ${err.message}`);
      throw err;
    }
  };

  const refreshHarvests = async () => {
    try {
      const res = await apiClient.get("/harvests");
      const list = Array.isArray(res?.data) ? res.data : [];
      setDb((prev) => ({ ...prev, harvests: list }));
      return list;
    } catch (err) {
      console.error("[MockDataContext] refreshHarvests error:", err.message);
      setDbError(`Harvests fetch failed: ${err.message}`);
      throw err;
    }
  };

  // Comprehensive initial load
  const fetchDataFromDb = async () => {
    setIsLoadingDb(true);
    setDbError(null);
    try {
      const [
        farmersRes,
        tanksRes,
        subsRes,
        harvestsRes,
        agentsRes,
        regionsRes,
        inchargesRes,
        notifsRes,
      ] = await Promise.allSettled([
        apiClient.get("/farmers"),
        apiClient.get("/tanks"),
        apiClient.get("/submissions"),
        apiClient.get("/harvests"),
        apiClient.get("/analytics/agents"),
        apiClient.get("/analytics/regions"),
        apiClient.get("/analytics/incharges"),
        apiClient.get("/notifications"),
      ]);

      const errors = [];
      if (farmersRes.status === 'rejected') errors.push(`Farmers: ${farmersRes.reason?.message}`);
      if (tanksRes.status === 'rejected') errors.push(`Tanks: ${tanksRes.reason?.message}`);
      if (subsRes.status === 'rejected') errors.push(`Submissions: ${subsRes.reason?.message}`);
      if (harvestsRes.status === 'rejected') errors.push(`Harvests: ${harvestsRes.reason?.message}`);

      if (errors.length > 0) {
        console.warn("[MockDataContext] DB endpoint errors:", errors);
        setDbError(errors.join("; "));
      }

      setDb(prev => {
        // Authoritative from MySQL: if fulfilled, respect the returned array even if empty []
        const rawFarmers = farmersRes.status === 'fulfilled' && Array.isArray(farmersRes.value?.data)
          ? farmersRes.value.data
          : prev.farmers;
        const mergedFarmers = deduplicateFarmers(rawFarmers);

        const rawTanks = tanksRes.status === 'fulfilled' && Array.isArray(tanksRes.value?.data)
          ? tanksRes.value.data
          : prev.tanks;
        const mergedTanks = normalizeTanks(rawTanks);

        const mergedSubs = subsRes.status === 'fulfilled' && Array.isArray(subsRes.value?.data)
          ? subsRes.value.data
          : (prev.submissions || []);

        const mergedHarvests = harvestsRes.status === 'fulfilled' && Array.isArray(harvestsRes.value?.data)
          ? harvestsRes.value.data
          : (prev.harvests || []);

        const mergedAgents = agentsRes.status === 'fulfilled' && Array.isArray(agentsRes.value?.data)
          ? agentsRes.value.data
          : (prev.agents || []);

        const mergedRegions = regionsRes.status === 'fulfilled' && Array.isArray(regionsRes.value?.data)
          ? regionsRes.value.data
          : (prev.regions || []);

        const mergedIncharges = inchargesRes.status === 'fulfilled' && Array.isArray(inchargesRes.value?.data)
          ? inchargesRes.value.data
          : (prev.incharges || []);

        const mergedNotifications = notifsRes.status === 'fulfilled' && Array.isArray(notifsRes.value?.data)
          ? notifsRes.value.data
          : (prev.notifications || []);

        return {
          ...prev,
          farmers: mergedFarmers,
          tanks: mergedTanks,
          submissions: mergedSubs,
          harvests: mergedHarvests,
          agents: mergedAgents,
          regions: mergedRegions,
          incharges: mergedIncharges,
          notifications: mergedNotifications,
        };
      });
      setDbConnected(errors.length === 0);
    } catch (err) {
      console.warn("[MockDataContext] Live DB fetch error:", err.message);
      setDbConnected(false);
      setDbError(err.message);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchDataFromDb();

    // Targeted event listeners: refresh only datasets affected by the specific mutation
    const handleFarmerRefresh = () => {
      refreshFarmers().catch(() => {});
    };
    const handleTankRefresh = () => {
      refreshTanks().catch(() => {});
    };
    const handleSubmissionRefresh = () => {
      refreshSubmissions().catch(() => {});
      refreshTanks().catch(() => {});
    };
    const handleHarvestRefresh = () => {
      refreshHarvests().catch(() => {});
      refreshTanks().catch(() => {});
      refreshFarmers().catch(() => {});
    };
    const handleAdminRefresh = () => {
      fetchDataFromDb().catch(() => {});
    };

    window.addEventListener('farmerCreated', handleFarmerRefresh);
    window.addEventListener('farmerDeleted', handleFarmerRefresh);
    window.addEventListener('tankCreated', handleTankRefresh);
    window.addEventListener('submissionCreated', handleSubmissionRefresh);
    window.addEventListener('harvestCreated', handleHarvestRefresh);
    window.addEventListener('adminDataChanged', handleAdminRefresh);
    window.addEventListener('complianceFollowupCreated', refreshNotifications);

    return () => {
      window.removeEventListener('farmerCreated', handleFarmerRefresh);
      window.removeEventListener('farmerDeleted', handleFarmerRefresh);
      window.removeEventListener('tankCreated', handleTankRefresh);
      window.removeEventListener('submissionCreated', handleSubmissionRefresh);
      window.removeEventListener('harvestCreated', handleHarvestRefresh);
      window.removeEventListener('adminDataChanged', handleAdminRefresh);
      window.removeEventListener('complianceFollowupCreated', refreshNotifications);
    };
  }, []);

    // Data source is exclusively MySQL DB via API - no redundant synchronous localStorage serialization

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

    const getAgentById = (id) => (db?.agents || []).find(a => a.id === id || a.username === id);

    const getFarmersByAgentId = (agentId) => {
      if (!db || !db.farmers || !agentId) return [];
      const cleanId = String(agentId).trim().toLowerCase();
      // Also look up agent record to match username or id
      const agentRec = (db.agents || []).find(a => 
        String(a.id).trim().toLowerCase() === cleanId || 
        String(a.username || '').trim().toLowerCase() === cleanId
      );
      const possibleIds = new Set([cleanId]);
      if (agentRec) {
        if (agentRec.id) possibleIds.add(String(agentRec.id).trim().toLowerCase());
        if (agentRec.username) possibleIds.add(String(agentRec.username).trim().toLowerCase());
      }
      return db.farmers.filter(f => {
        const fAgentId = String(f.agentId || f.agent_id || '').trim().toLowerCase();
        return fAgentId && possibleIds.has(fAgentId);
      });
    };

    const getFarmerById = (id) => {
      if (!db || !db.farmers || !id) return null;
      return db.farmers.find(f =>
        f.id === id ||
        f.farmer_code === id ||
        ((id === '1' || id === 'F001' || id === 'FAR001') && (f.id === '1' || f.id === 'F001' || f.farmer_code === 'FAR001'))
      );
    };

    const getTanksByFarmerId = (farmerId) => {
      if (!db || !db.tanks || !farmerId) return [];
      const farmerExists = (db.farmers || []).some(f => f.id === farmerId || f.farmer_code === farmerId);
      if (!farmerExists) return [];
      const fTanks = db.tanks.filter(t =>
        !t.isOrphaned &&
        t.hasValidFarmer !== false &&
        (t.farmerId === farmerId ||
        t.farmer_id === farmerId ||
        ((farmerId === '1' || farmerId === 'F001' || farmerId === 'FAR001') && (t.farmerId === '1' || t.farmerId === 'F001' || t.farmer_id === 'F001')))
      );
      return fTanks.map((t, idx) => ({
        ...t,
        name: t.name || `Tank ${idx + 1}`
      }));
    };

    const getTankById = (id) => {
      if (!db || !db.tanks || !id) return null;
      const cleanId = String(id).trim().toLowerCase();
      const numId = cleanId.replace(/^t0*/, '');
      const tank = db.tanks.find(t => {
        const tId = String(t.id || '').trim().toLowerCase();
        if (tId === cleanId) return true;
        if (tId && numId && tId.replace(/^t0*/, '') === numId) return true;
        if (String(t.tank_id || '').trim().toLowerCase() === cleanId) return true;
        if (String(t.name || '').trim().toLowerCase() === cleanId) return true;
        return false;
      });
      if (!tank) return null;
      return tank;
    };

    const getSubmissionsByAgentId = (agentId) => (db?.submissions || []).filter(s => s.agentId === agentId || s.userId === agentId);

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
  const getAgentsByInchargeId = (inchargeId = "INC001") => {
    if (!db || !db.agents) return [];
    return db.agents.filter(
      (a) =>
        a.inchargeId === inchargeId ||
        a.incharge_id === inchargeId ||
        !a.inchargeId,
    );
  };

  const getFarmersByInchargeId = (inchargeId = "INC001") => {
    if (!db || !db.farmers) return [];
    const inchargeAgentIds = (db.agents || [])
      .filter(
        (a) => a.inchargeId === inchargeId || a.incharge_id === inchargeId,
      )
      .map((a) => a.id);
    return db.farmers
      .filter(
        (f) =>
          f.inchargeId === inchargeId ||
          f.incharge_id === inchargeId ||
          (f.agentId && inchargeAgentIds.includes(f.agentId)) ||
          (f.agent_id && inchargeAgentIds.includes(f.agent_id)) ||
          !f.inchargeId,
      )
      .sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, {
          sensitivity: "base",
        }),
      );
  };

  // Personal Incharge Farmers (Assigned directly by Admin to Incharge or registered by Incharge)
  const getMyFarmersByInchargeId = (inchargeId = "INC001") => {
    if (!db || !db.farmers) return [];
    const list = db.farmers
      .filter(
        (f) =>
          (f.inchargeId === inchargeId &&
            (!f.agentId || f.assignedTo === "Incharge")) ||
          (!f.agentId && f.inchargeId === inchargeId),
      )
      .sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, {
          sensitivity: "base",
        }),
      );
    return deduplicateFarmers(list);
  };

  // Personal Incharge Tanks (Tanks under Incharge's personal farmers or direct incharge supervision)
  const getMyTanksByInchargeId = (inchargeId = "INC001") => {
    if (!db || !db.tanks) return [];
    const myFarmers = getMyFarmersByInchargeId(inchargeId);
    const myFarmerIds = new Set(myFarmers.map((f) => f.id));
    return db.tanks
      .filter((t) => {
        if (t.isOrphaned || t.hasValidFarmer === false) return false;
        const fId = t.farmerId || t.farmer_id;
        const farmerExists = (db.farmers || []).some(f => f.id === fId || f.farmer_code === fId);
        if (!farmerExists) return false;
        return (
          (t.inchargeId === inchargeId &&
            (!t.agentId || t.assignedTo === "Incharge")) ||
          myFarmerIds.has(fId)
        );
      })
      .sort((a, b) => {
        const fA = myFarmers.find((f) => f.id === a.farmerId);
        const fB = myFarmers.find((f) => f.id === b.farmerId);
        const nameA = fA ? fA.name : "";
        const nameB = fB ? fB.name : "";
        const farmerDiff = nameA.localeCompare(nameB, undefined, {
          sensitivity: "base",
        });
        if (farmerDiff !== 0) return farmerDiff;
        return (a.name || "").localeCompare(b.name || "", undefined, {
          numeric: true,
          sensitivity: "base",
        });
      });
  };

  const getTanksByInchargeId = (inchargeId = "INC001") => {
    if (!db || !db.tanks) return [];
    const inchargeFarmers = getFarmersByInchargeId(inchargeId);
    const farmerIds = new Set(inchargeFarmers.map((f) => f.id));
    return db.tanks
      .filter((t) => {
        if (t.isOrphaned || t.hasValidFarmer === false) return false;
        const fId = t.farmerId || t.farmer_id;
        const farmerExists = (db.farmers || []).some(f => f.id === fId || f.farmer_code === fId);
        if (!farmerExists) return false;
        return farmerIds.has(fId) || t.inchargeId === inchargeId;
      })
      .sort((a, b) => {
        const fA = inchargeFarmers.find((f) => f.id === a.farmerId);
        const fB = inchargeFarmers.find((f) => f.id === b.farmerId);
        const nameA = fA ? fA.name : "";
        const nameB = fB ? fB.name : "";
        const farmerDiff = nameA.localeCompare(nameB, undefined, {
          sensitivity: "base",
        });
        if (farmerDiff !== 0) return farmerDiff;
        return (a.name || "").localeCompare(b.name || "", undefined, {
          numeric: true,
          sensitivity: "base",
        });
      });
  };

  const assignFarmerToIncharge = async (farmerId, inchargeId) => {
    try {
      await apiClient.put(`/farmers/${farmerId}`, { inchargeId });
      setDb((prev) => ({
        ...prev,
        farmers: prev.farmers.map((f) =>
          f.id === farmerId ? { ...f, inchargeId } : f,
        ),
      }));
      adminService.clearCache('/farmers');
      adminService.clearCache('/analytics/summary');
      window.dispatchEvent(new CustomEvent('adminDataChanged'));
      showToast(`Farmer assigned to Incharge!`);
    } catch (err) {
      console.error("[MockDataContext] assignFarmerToIncharge failed:", err);
      showToast(`Failed to assign farmer: ${err.message || 'API error'}`);
      throw err;
    }
  };

  const assignTankToIncharge = async (tankId, inchargeId) => {
    try {
      await apiClient.put(`/tanks/${tankId}`, { inchargeId });
      setDb((prev) => ({
        ...prev,
        tanks: prev.tanks.map((t) =>
          t.id === tankId ? { ...t, inchargeId } : t,
        ),
      }));
      adminService.clearCache('/tanks');
      adminService.clearCache('/analytics/summary');
      window.dispatchEvent(new CustomEvent('adminDataChanged'));
      showToast(`Tank assigned to Incharge!`);
    } catch (err) {
      console.error("[MockDataContext] assignTankToIncharge failed:", err);
      showToast(`Failed to assign tank: ${err.message || 'API error'}`);
      throw err;
    }
  };

  const assignAgentToIncharge = (agentId, inchargeId) => {
    setDb((prev) => ({
      ...prev,
      agents: prev.agents.map((a) =>
        a.id === agentId ? { ...a, inchargeId } : a,
      ),
    }));
    showToast(`Technician assigned to Incharge!`);
  };

  const getInchargeDashboardMetrics = (inchargeId = "INC001") => {
    const agents = getAgentsByInchargeId(inchargeId);
    const farmers = getFarmersByInchargeId(inchargeId);
    const tanks = getTanksByInchargeId(inchargeId);

    let testsCompleted = 0;
    let testsDue = 0;
    let overdueTests = 0;

    tanks.forEach((t) => {
      if (t.testStatus === "Completed") testsCompleted++;
      if (t.testStatus === "Due") testsDue++;
      if (t.testStatus === "Overdue") overdueTests++;
    });

    const tankIds = tanks.map((t) => t.id);
    const pendingVerification = (db.submissions || []).filter(
      (s) => tankIds.includes(s.tankId) && s.status === "PENDING_VERIFICATION",
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
      pendingVerification,
    };
  };

  // --- Actions ---

  const updateTank = async (tankId, updates) => {
    try {
      const res = await apiClient.put(`/tanks/${tankId}`, updates);
      const canonicalTank = res?.data || { id: tankId, ...updates };

      setDb((prev) => ({
        ...prev,
        tanks: prev.tanks.map((t) =>
          t.id === tankId ? { ...t, ...canonicalTank } : t,
        ),
      }));

      adminService.clearCache('/tanks');
      adminService.clearCache('/farmers');
      adminService.clearCache('/analytics/summary');

      window.dispatchEvent(new CustomEvent('tankCreated', { detail: canonicalTank }));
      window.dispatchEvent(new CustomEvent('adminDataChanged'));
      showToast(`Tank ${canonicalTank.name || tankId} updated!`);
      return canonicalTank;
    } catch (err) {
      console.error("[MockDataContext] updateTank failed:", err);
      showToast(`Failed to update tank: ${err.message || 'API error'}`);
      throw err;
    }
  };

  const updateFarmer = async (farmerId, updates) => {
    try {
      const res = await apiClient.put(`/farmers/${farmerId}`, updates);
      const canonicalFarmer = res?.data || { id: farmerId, ...updates };

      setDb((prev) => ({
        ...prev,
        farmers: prev.farmers.map((f) =>
          f.id === farmerId ? { ...f, ...canonicalFarmer } : f,
        ),
      }));

      adminService.clearCache('/farmers');
      adminService.clearCache('/analytics/summary');

      window.dispatchEvent(new CustomEvent('adminDataChanged'));
      showToast(`Farmer ${canonicalFarmer.name || farmerId} updated!`);
      return canonicalFarmer;
    } catch (err) {
      console.error("[MockDataContext] updateFarmer failed:", err);
      showToast(`Failed to update farmer: ${err.message || 'API error'}`);
      throw err;
    }
  };

  const submitRecord = async (submissionData) => {
    try {
      const res = await apiClient.post("/submissions", {
        farmerId: submissionData.farmerId,
        tankId: submissionData.tankId,
        testType: submissionData.testType || "Water Quality Test",
        agentId: submissionData.agentId || submissionData.userId || "agent001",
        userId: submissionData.userId || submissionData.agentId || "agent001",
        userName: submissionData.userName || submissionData.agentName || null,
        role: submissionData.role || submissionData.submittedBy || "Agent",
        date: submissionData.date || new Date().toISOString().split("T")[0],
        submissionTime:
          submissionData.submissionTime ||
          new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        accuracy:
          submissionData.accuracy || submissionData.gps?.accuracy || null,
        latitude:
          submissionData.latitude || submissionData.gps?.latitude || null,
        longitude:
          submissionData.longitude || submissionData.gps?.longitude || null,
        locality:
          submissionData.locality || submissionData.gps?.locality || null,
        data: submissionData.data || submissionData,
      });

      const canonicalSub = res?.data;
      if (!canonicalSub) {
        throw new Error(res?.message || "Failed to submit record to database");
      }

      setDb((prev) => {
        const formattedDate = new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const newTanks = prev.tanks.map((t) => {
          if (t.id === submissionData.tankId) {
            const isFinal =
              submissionData.harvest &&
              (submissionData.harvest.type === "Final" ||
                submissionData.harvest.harvestType === "Final Harvest");
            return {
              ...t,
              testStatus: "Completed",
              isOverdue: false,
              lastTest: formattedDate,
              nextTest: "Due Next Week",
              ...(isFinal
                ? { status: "Harvested", finalHarvestCompleted: true }
                : {}),
            };
          }
          return t;
        });
        const newDrafts = prev.drafts.filter(
          (d) => d.tankId !== submissionData.tankId,
        );

        const farmer = prev.farmers.find((f) => f.id === submissionData.farmerId);
        const tank = prev.tanks.find((t) => t.id === submissionData.tankId);
        const actionText = `${submissionData.testType || "Test"} Submitted`;
        const detailText = `${submissionData.testType || "Test"} completed for ${farmer ? farmer.name : "Farmer"} • ${tank ? tank.name : "Tank"}`;
        const timeStr = `${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

        return {
          ...prev,
          submissions: [canonicalSub, ...prev.submissions.filter(s => s.id !== canonicalSub.id)],
          tanks: newTanks,
          drafts: newDrafts,
          activities: [
            {
              id: Date.now(),
              time: timeStr,
              action: actionText,
              detail: detailText,
            },
            ...(prev.activities || []),
          ],
        };
      });

      adminService.clearCache('/submissions');
      adminService.clearCache('/tanks');
      adminService.clearCache('/admin/submission-locations?date=today');
      adminService.clearCache('/analytics/summary');

      window.dispatchEvent(new CustomEvent('submissionCreated', { detail: canonicalSub }));
      window.dispatchEvent(new CustomEvent('adminDataChanged'));
      showToast("Record submitted for verification!");
      return canonicalSub;
    } catch (err) {
      console.error("[MockDataContext] submitRecord failed:", err);
      showToast(`Failed to submit record: ${err.message || 'API error'}`);
      throw err;
    }
  };

  const updateSubmissionStatus = async (submissionId, newStatus, notes = "") => {
    try {
      const res = await apiClient.patch(`/submissions/${submissionId}/verify`, {
        status: newStatus,
        notes,
      });
      const canonicalSub = res?.data;

      setDb((prev) => ({
        ...prev,
        submissions: prev.submissions.map((s) =>
          s.id === submissionId ? { ...s, status: newStatus, ...(canonicalSub || {}) } : s,
        ),
      }));

      adminService.clearCache('/submissions');
      adminService.clearCache('/admin/submission-locations?date=today');
      adminService.clearCache('/analytics/summary');

      window.dispatchEvent(new CustomEvent('submissionCreated', { detail: canonicalSub }));
      window.dispatchEvent(new CustomEvent('adminDataChanged'));
      showToast(`Submission marked as ${newStatus}`);
      return canonicalSub;
    } catch (err) {
      console.error("[MockDataContext] updateSubmissionStatus failed:", err);
      showToast(`Failed to update submission: ${err.message || 'API error'}`);
      throw err;
    }
  };

  const assignFarmerToAgent = async (farmerId, newAgentId) => {
    try {
      await apiClient.put(`/farmers/${farmerId}`, { agentId: newAgentId });
      setDb((prev) => {
        const newFarmers = prev.farmers.map((f) =>
          f.id === farmerId ? { ...f, agentId: newAgentId } : f,
        );
        const newTanks = prev.tanks.map((t) =>
          t.farmerId === farmerId ? { ...t, agentId: newAgentId } : t,
        );
        return { ...prev, farmers: newFarmers, tanks: newTanks };
      });

      adminService.clearCache('/farmers');
      adminService.clearCache('/tanks');
      adminService.clearCache('/analytics/summary');

      window.dispatchEvent(new CustomEvent('adminDataChanged'));
      showToast(`Farmer reassigned successfully!`);
    } catch (err) {
      console.error("[MockDataContext] assignFarmerToAgent failed:", err);
      showToast(`Failed to reassign farmer: ${err.message || 'API error'}`);
      throw err;
    }
  };

  const addAgent = (agentData) => {
    setDb((prev) => {
      const nextId = `agent${String(prev.agents.length + 1).padStart(3, "0")}`;
      return {
        ...prev,
        agents: [...prev.agents, { ...agentData, id: nextId }],
      };
    });
    showToast(`Agent ${agentData.name} added!`);
  };

  const createFarmerWithTanks = async (agentId, farmerData, tanksData = []) => {
    const cleanPhone = (farmerData.phone || "").replace(/\D/g, "");
    const cleanName = (farmerData.name || "").trim().toLowerCase();
    const cleanLoc = (farmerData.village || farmerData.location || "")
      .trim()
      .toLowerCase();

    // Check client-side for existing duplicate farmer
    const existingFarmer = (db.farmers || []).find((f) => {
      const fPhone = (f.phone || "").replace(/\D/g, "");
      if (cleanPhone && fPhone && cleanPhone === fPhone) return true;
      const fName = (f.name || "").trim().toLowerCase();
      const fLoc = (f.village || f.location || "").trim().toLowerCase();
      if (
        cleanName &&
        fName &&
        cleanName === fName &&
        (cleanLoc === fLoc || !cleanLoc || !fLoc)
      )
        return true;
      return false;
    });

    if (existingFarmer) {
      showToast(`Farmer ${farmerData.name} is already registered!`);
      return existingFarmer;
    }

    const isAssignedToIncharge =
      farmerData.assignedTo === "Incharge" ||
      (!agentId &&
        !farmerData.agentId &&
        (farmerData.inchargeId ||
          farmerData.role === "INCHARGE" ||
          farmerData.role === "ASM"));
    const targetAgentId = isAssignedToIncharge
      ? null
      : agentId || farmerData.agentId || null;
    const targetInchargeId =
      farmerData.inchargeId ||
      (targetAgentId
        ? db.agents?.find((a) => a.id === targetAgentId)?.inchargeId || null
        : null);
    const assignedTo = isAssignedToIncharge
      ? "Incharge"
      : farmerData.assignedTo || (targetAgentId ? "Agent" : "Incharge");
    const assignedBy =
      farmerData.assignedBy ||
      (isAssignedToIncharge
        ? "Incharge"
        : targetAgentId
          ? "Agent"
          : "Incharge");

    const totalAcres =
      farmerData.acres || farmerData.extent || (tanksData.length ? tanksData.length * 2.5 : null);

    const farmerPayload = {
      name: farmerData.name,
      phone: farmerData.phone,
      location:
        farmerData.location ||
        (farmerData.village
          ? `${farmerData.village}${farmerData.area ? `, ${farmerData.area}` : ""}`
          : "Bhimavaram"),
      acres: totalAcres != null ? parseFloat(totalAcres) : null,
      waterSource: farmerData.waterSource || "Canal",
      agentId: targetAgentId,
      inchargeId: targetInchargeId,
      assignedTo: assignedTo,
      assignedBy: assignedBy,
      status: farmerData.status || "ACTIVE",
    };

    // 1. Post farmer to backend MySQL
    const farmerRes = await apiClient.post("/farmers", farmerPayload);
    const canonicalFarmer = farmerRes?.data;
    if (!canonicalFarmer || !canonicalFarmer.id) {
      throw new Error(farmerRes?.message || "Failed to register farmer in database");
    }

    // 2. Post tanks linked to canonicalFarmer.id
    const savedTanks = [];
    const failedTanks = [];

    for (let i = 0; i < tanksData.length; i++) {
      const tankItem = tanksData[i];
      const tankPayload = {
        name: tankItem.name || `Tank ${i + 1}`,
        farmerId: canonicalFarmer.id,
        acres: tankItem.acres != null ? String(tankItem.acres) : (tankItem.area != null ? String(tankItem.area) : "2.5"),
        size: tankItem.size || (tankItem.acres ? `${tankItem.acres} Acres` : "2.5 Acres"),
        waterSource: tankItem.waterSource || canonicalFarmer.waterSource || "Canal",
        salinity: tankItem.salinity ? `${tankItem.salinity} ppt` : "16 ppt",
        species: tankItem.species || "Vannamei",
        cultureType: tankItem.cultureType || "Semi-Intensive",
        stockingDate: tankItem.stockingDate || tankItem.seedDate || new Date().toISOString().split("T")[0],
        seedDate: tankItem.seedDate || tankItem.stockingDate || null,
        seedStockingLak: tankItem.seedStockingLak || tankItem.seed_stocking_lak || tankItem.seedStocked || "2.5",
        doc: tankItem.doc != null && tankItem.doc !== "" ? Number(tankItem.doc) : 0,
        abw: tankItem.abw ? String(tankItem.abw) : "12g",
        biomass: tankItem.biomass ? String(tankItem.biomass) : "800kg",
        fcr: tankItem.fcr ? String(tankItem.fcr) : "1.2",
        boundaryCoordinates: tankItem.boundaryCoordinates || null,
        boundaryMethod: tankItem.boundaryMethod || null,
        boundaryAreaAcres: tankItem.boundaryAreaAcres || null,
        boundaryQuality: tankItem.boundaryQuality || null,
        boundaryCapturedAt: tankItem.boundaryCapturedAt || null,
      };

      try {
        const tankRes = await apiClient.post("/tanks", tankPayload);
        if (tankRes?.data) {
          savedTanks.push(tankRes.data);
        }
      } catch (tErr) {
        console.error(`[MockDataContext] Failed to create tank "${tankPayload.name}":`, tErr);
        failedTanks.push({ name: tankPayload.name, error: tErr.message });
      }
    }

    // Update in-memory db with authoritative records
    setDb((prev) => ({
      ...prev,
      farmers: deduplicateFarmers([canonicalFarmer, ...prev.farmers.filter((f) => f.id !== canonicalFarmer.id)]),
      tanks: normalizeTanks([...prev.tanks.filter((t) => !savedTanks.some((st) => st.id === t.id)), ...savedTanks]),
      activities: [
        {
          id: Date.now(),
          time: `${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
          action: "Farmer Registered",
          detail: `Added Farmer ${canonicalFarmer.name} (${canonicalFarmer.id}) with ${savedTanks.length} tanks`,
        },
        ...(prev.activities || []),
      ],
    }));

    // Invalidate caches
    adminService.clearCache('/farmers');
    adminService.clearCache('/tanks');
    adminService.clearCache('/analytics/summary');

    // Notify listeners
    window.dispatchEvent(new CustomEvent('farmerCreated', { detail: canonicalFarmer }));
    if (savedTanks.length > 0) {
      window.dispatchEvent(new CustomEvent('tankCreated', { detail: savedTanks }));
    }
    window.dispatchEvent(new CustomEvent('adminDataChanged'));

    if (failedTanks.length > 0) {
      const partialMsg = `Farmer ${canonicalFarmer.name} registered, but ${failedTanks.length} of ${tanksData.length} tank(s) failed to save.`;
      showToast(partialMsg);
      const partialErr = new Error(partialMsg);
      partialErr.partialFailure = true;
      partialErr.farmer = canonicalFarmer;
      partialErr.failedTanks = failedTanks;
      throw partialErr;
    }

    showToast(`Added Farmer ${canonicalFarmer.name} with ${savedTanks.length} tanks!`);
    return canonicalFarmer;
  };

  const addTank = async (tankData) => {
    try {
      const res = await apiClient.post("/tanks", tankData);
      const canonicalTank = res?.data;
      if (!canonicalTank) {
        throw new Error(res?.message || "Failed to create tank in database");
      }

      setDb((prev) => ({
        ...prev,
        tanks: normalizeTanks([...prev.tanks.filter((t) => t.id !== canonicalTank.id), canonicalTank]),
      }));

      adminService.clearCache('/tanks');
      adminService.clearCache('/farmers');
      adminService.clearCache('/analytics/summary');

      window.dispatchEvent(new CustomEvent('tankCreated', { detail: canonicalTank }));
      window.dispatchEvent(new CustomEvent('adminDataChanged'));
      showToast(`Tank ${canonicalTank.name} added successfully!`);
      return canonicalTank;
    } catch (err) {
      console.error("[MockDataContext] addTank failed:", err);
      showToast(`Failed to add tank: ${err.message || 'API error'}`);
      throw err;
    }
  };

  const editTank = async (tankId, updatedData) => {
    try {
      const res = await apiClient.put(`/tanks/${tankId}`, updatedData);
      const canonicalTank = res?.data || { id: tankId, ...updatedData };

      setDb((prev) => ({
        ...prev,
        tanks: prev.tanks.map((t) =>
          t.id === tankId ? { ...t, ...canonicalTank } : t,
        ),
      }));

      adminService.clearCache('/tanks');
      adminService.clearCache('/farmers');
      adminService.clearCache('/analytics/summary');

      window.dispatchEvent(new CustomEvent('tankCreated', { detail: canonicalTank }));
      window.dispatchEvent(new CustomEvent('adminDataChanged'));
      showToast(`Tank ${canonicalTank.name || tankId} updated successfully!`);
      return canonicalTank;
    } catch (err) {
      console.error("[MockDataContext] editTank failed:", err);
      showToast(`Failed to update tank: ${err.message || 'API error'}`);
      throw err;
    }
  };

  const deleteTank = async (tankId) => {
    try {
      await apiClient.delete(`/tanks/${tankId}`);
      setDb((prev) => ({
        ...prev,
        tanks: prev.tanks.filter((t) => t.id !== tankId),
      }));

      adminService.clearCache('/tanks');
      adminService.clearCache('/farmers');
      adminService.clearCache('/analytics/summary');

      window.dispatchEvent(new CustomEvent('adminDataChanged'));
      showToast(`Tank ${tankId} deleted successfully!`);
    } catch (err) {
      console.error("[MockDataContext] deleteTank failed:", err);
      showToast(`Failed to delete tank: ${err.message || 'API error'}`);
      throw err;
    }
  };

  const createFarmerByMobile = async (farmerData) => {
    const cleanPhone = (farmerData.phone || "").replace(/[^0-9]/g, "");
    const existing = db.farmers.find(
      (f) => (f.phone || "").replace(/[^0-9]/g, "") === cleanPhone,
    );
    if (existing && cleanPhone.length > 5) {
      showToast(
        `Mobile ${farmerData.phone} linked to existing farmer ${existing.name} (${existing.id})!`,
      );
      if (farmerData.agentId) {
        return updateFarmer(existing.id, { agentId: farmerData.agentId });
      }
      return existing;
    }

    return createFarmerWithTanks(farmerData.agentId, {
      name: farmerData.name,
      phone: farmerData.phone,
      location: farmerData.location || farmerData.village || "Bhimavaram",
      acres: farmerData.acres || 10,
      waterSource: farmerData.waterSource || "Borewell",
    }, []);
  };

  const deleteFarmer = async (farmerId) => {
    try {
      await apiClient.delete(`/farmers/${farmerId}`);
      setDb((prev) => ({
        ...prev,
        farmers: prev.farmers.filter((f) => f.id !== farmerId && f.farmer_code !== farmerId),
        tanks: prev.tanks.filter((t) => t.farmerId !== farmerId && t.farmer_id !== farmerId),
      }));

      adminService.clearCache('/farmers');
      adminService.clearCache('/tanks');
      adminService.clearCache('/analytics/summary');

      window.dispatchEvent(new CustomEvent('adminDataChanged'));
      window.dispatchEvent(new CustomEvent('farmerDeleted', { detail: { farmerId } }));
      showToast(`Farmer ${farmerId} and associated tanks removed.`);
    } catch (err) {
      console.error("[MockDataContext] deleteFarmer failed:", err);
      showToast(`Failed to delete farmer: ${err.message || 'API error'}`);
      throw err;
    }
  };

  const saveDraft = (draft) => {
    setDb((prev) => {
      const existingIndex = prev.drafts.findIndex(
        (d) => d.tankId === draft.tankId,
      );
      const newDrafts = [...prev.drafts];
      if (existingIndex >= 0) {
        newDrafts[existingIndex] = draft;
      } else {
        newDrafts.push(draft);
      }
      return { ...prev, drafts: newDrafts };
    });
    showToast("Draft saved!");
  };

  const getDraft = (tankId) =>
    db.drafts.find((d) => d.tankId === tankId) || null;

  const addNotification = (agentId, message, type = "info", meta = {}) => {
    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const date = now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
    setDb((prev) => ({
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
          ...meta,
        },
        ...(prev.notifications || []),
      ],
    }));
  };

  const markNotificationRead = async (notificationId) => {
    setDb((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) =>
        n.id === notificationId ? { ...n, read: true, isRead: true } : n,
      ),
    }));
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    } catch (err) {
      console.warn("[MockDataContext] Error persisting markNotificationRead:", err);
    }
  };

  const markAllNotificationsRead = async (targetId) => {
    setDb((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) =>
        !targetId || n.agentId === targetId || n.userId === targetId ? { ...n, read: true, isRead: true } : n,
      ),
    }));
    try {
      await apiClient.patch('/notifications/read-all', { userId: targetId });
    } catch (err) {
      console.warn("[MockDataContext] Error persisting markAllNotificationsRead:", err);
    }
  };

  const refreshNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      if (res && Array.isArray(res.data)) {
        setDb(prev => ({ ...prev, notifications: res.data }));
      }
    } catch (err) {
      console.warn("[MockDataContext] Error refreshing notifications:", err);
    }
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
        lastTestDate: "N/A",
        requiredByDate: "28 Aug 2026",
        progressText: "0 / 1",
        complianceRate: 0,
      };
    }

    const assignedFarmers = getFarmersByAgentId(agentId);
    const assignedFarmerIds = new Set(assignedFarmers.map((f) => f.id));
    const assignedTanks = db.tanks.filter(
      (t) => assignedFarmerIds.has(t.farmerId) || t.agentId === agentId,
    );

    let completedCount = 0;
    let dueCount = 0;
    let overdueCount = 0;
    let latestTestDate = null;

    assignedTanks.forEach((tank) => {
      if (tank.testStatus === "Completed") {
        completedCount++;
        if (tank.lastTest && tank.lastTest !== "TBD") {
          latestTestDate = tank.lastTest;
        }
      } else if (tank.testStatus === "Due") {
        dueCount++;
      } else if (tank.testStatus === "Overdue") {
        overdueCount++;
      }
    });

    // Check recent submissions in last 7 days
    const recentSubs = (db.submissions || []).filter(
      (s) => s.agentId === agentId,
    );
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
      lastTestDate: latestTestDate || "21 Aug 2026",
      requiredByDate: "28 Aug 2026",
      progressText: isWeeklyTestSatisfied ? "1 / 1" : "0 / 1",
      complianceRate,
    };
  };

  const getTechnicianAlerts = (agentId) => {
    if (!db) return [];
    const alerts = [];
    const assignedFarmers = getFarmersByAgentId(agentId);
    const assignedFarmerIds = new Set(assignedFarmers.map((f) => f.id));
    const assignedTanks = db.tanks.filter(
      (t) => assignedFarmerIds.has(t.farmerId) || t.agentId === agentId,
    );

    // 1. Weekly test due / overdue alerts
    assignedTanks.forEach((tank) => {
      const farmer = assignedFarmers.find((f) => f.id === tank.farmerId);
      const farmerName = farmer ? farmer.name : "Farmer";
      if (tank.testStatus === "Overdue") {
        alerts.push({
          id: `ALERT_OD_${tank.id}`,
          type: "error",
          priority: "CRITICAL",
          title: "Weekly Test Overdue",
          message: `Mandatory test overdue for ${farmerName} • ${tank.name}`,
          time: "Action Required",
          tankId: tank.id,
          farmerId: tank.farmerId,
        });
      } else if (tank.testStatus === "Due") {
        alerts.push({
          id: `ALERT_DUE_${tank.id}`,
          type: "warning",
          priority: "ATTENTION",
          title: "Weekly Test Due",
          message: `Weekly test scheduled for ${farmerName} • ${tank.name}`,
          time: "Due This Week",
          tankId: tank.id,
          farmerId: tank.farmerId,
        });
      }
    });

    // 2. High ammonia / water quality alerts
    (db.submissions || [])
      .filter((s) => s.agentId === agentId)
      .slice(0, 5)
      .forEach((sub) => {
        const farmer = assignedFarmers.find((f) => f.id === sub.farmerId);
        const farmerName = farmer ? farmer.name : "Farmer";
        const tank = assignedTanks.find((t) => t.id === sub.tankId);
        const tankName = tank ? tank.name : sub.tankId || "Tank";

        const nh3 = parseFloat(sub.data?.waterQuality?.ammonia);
        if (!isNaN(nh3) && nh3 > 0.1) {
          alerts.push({
            id: `ALERT_NH3_${sub.id}`,
            type: "error",
            priority: "CRITICAL",
            title: "High Ammonia Reading (NH3)",
            message: `Ammonia at ${nh3} mg/L in ${farmerName} • ${tankName}`,
            time: sub.submittedAgo || "Recent",
            tankId: sub.tankId,
            farmerId: sub.farmerId,
          });
        }

        const doVal = parseFloat(sub.data?.waterQuality?.do);
        if (!isNaN(doVal) && doVal < 4.0 && doVal > 0) {
          alerts.push({
            id: `ALERT_DO_${sub.id}`,
            type: "warning",
            priority: "ATTENTION",
            title: "Low Dissolved Oxygen (DO)",
            message: `DO at ${doVal} mg/L in ${farmerName} • ${tankName}. Aeration needed.`,
            time: sub.submittedAgo || "Recent",
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
    const assignedFarmerIds = new Set(assignedFarmers.map((f) => f.id));

    // Combine submissions + explicit activities
    const timeline = [];

    (db.submissions || [])
      .filter((s) => s.agentId === agentId || assignedFarmerIds.has(s.farmerId))
      .forEach((sub) => {
        const farmer = assignedFarmers.find((f) => f.id === sub.farmerId);
        const tank = (db.tanks || []).find((t) => t.id === sub.tankId);
        timeline.push({
          id: sub.id,
          action: sub.testType || sub.recordType || "Water Quality Test",
          farmerName: farmer ? farmer.name : "Assigned Farmer",
          farmerId: sub.farmerId,
          tankName: tank ? tank.name : sub.tankId || "Tank 01",
          tankId: sub.tankId,
          date: sub.date || "Today",
          time: sub.submittedAgo || "10:30 AM",
          gpsVerified: true,
          status: "COMPLETED",
          details: sub.data?.waterQuality
            ? `Salinity: ${sub.data.waterQuality.salinity || 16} ppt | pH: ${sub.data.waterQuality.ph || 7.8} | DO: ${sub.data.waterQuality.do || 5.2} mg/L`
            : "Field verification completed",
          gps: sub.gps || { locality: "Chinnamiram, Bhimavaram", accuracy: 8 },
        });
      });

    // Add explicit activities
    (db.activities || []).forEach((act) => {
      timeline.push({
        id: `ACT_${act.id}`,
        action: act.action,
        farmerName: "Field Audit",
        tankName: "Tank Area",
        date: act.time?.split(" ")[0] || "Today",
        time: act.time?.split(" ").slice(1).join(" ") || "10:00 AM",
        gpsVerified: true,
        status: "COMPLETED",
        details: act.detail,
        gps: { locality: "Bhimavaram Cluster", accuracy: 10 },
      });
    });

    return timeline.slice(0, 15);
  };

  const recordFieldEntry = async (entryData) => {
    const {
      agentId = "agent001",
      farmerId,
      tankId,
      recordType = "WATER_QUALITY",
      data = {},
      gps = null,
      notes = "",
      photo = null,
      offline = false,
    } = entryData;

    const formattedDate = new Date().toISOString().split("T")[0];
    const farmer = (db?.farmers || []).find((f) => f.id === farmerId);
    const tank = (db?.tanks || []).find((t) => t.id === tankId);

    const resolvedUserId =
      entryData.userId || entryData.agentId || agentId || "agent001";
    const resolvedUserName = entryData.userName || entryData.agentName || null;
    const resolvedRole =
      entryData.role ||
      entryData.submittedBy ||
      (String(resolvedUserId).startsWith("INC") ? "Incharge" : "Agent");
    const resolvedLatitude =
      entryData.latitude != null
        ? entryData.latitude
        : gps?.latitude != null
          ? gps.latitude
          : null;
    const resolvedLongitude =
      entryData.longitude != null
        ? entryData.longitude
        : gps?.longitude != null
          ? gps.longitude
          : null;
    const resolvedAccuracy =
      entryData.accuracy != null
        ? entryData.accuracy
        : gps?.accuracy != null
          ? gps.accuracy
          : null;
    const resolvedTime =
      entryData.submissionTime ||
      entryData.time ||
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

    try {
      const subRes = await apiClient.post("/submissions", {
        farmerId,
        tankId,
        testType:
          recordType === "WATER_QUALITY"
            ? "Water Analysis"
            : recordType === "FEED_ENTRY"
              ? "Feed Test"
              : recordType === "DISEASE" || recordType === "DISEASE_OBSERVATION"
                ? "Disease"
                : recordType === "BIOMASS_SAMPLING"
                  ? "Biomass"
                  : recordType === "MORTALITY_LOG"
                    ? "Mortality"
                    : recordType === "MEDICATION"
                      ? "Medication"
                      : recordType === "FARM_ACTIVITY"
                        ? "Farm Activity"
                        : recordType === "HARVEST" || recordType === "HARVEST_ENTRY"
                          ? "Harvest"
                          : recordType === "PHOTO_OBSERVATION"
                            ? "Photo"
                            : "Field Test",
        agentId: resolvedUserId,
        userId: resolvedUserId,
        userName: resolvedUserName,
        role: resolvedRole,
        date: formattedDate,
        submissionTime: resolvedTime,
        status: "PENDING_VERIFICATION",
        data,
        latitude: resolvedLatitude,
        longitude: resolvedLongitude,
        accuracy: resolvedAccuracy,
        locality:
          entryData.locality ||
          (gps?.locality || (farmer ? farmer.location : "Aquaculture Zone")),
      });

      const canonicalSub = subRes?.data;
      if (!canonicalSub) {
        throw new Error(subRes?.message || "Failed to save submission to database");
      }

      let canonicalHarvest = null;
      if (recordType === "HARVEST_ENTRY" || recordType === "HARVEST") {
        const hRes = await apiClient.post("/harvests", {
          farmerId,
          tankId,
          date: formattedDate,
          quantityKg: parseFloat(data.harvestedBiomass || data.quantityKg || 0),
          countPerKg: parseFloat(
            data.abw ? 1000 / parseFloat(data.abw) : data.countPerKg || 40,
          ),
          quality: data.quality || "Grade A",
          pricePerKg: parseFloat(data.pricePerKg || 380),
          revenue:
            parseFloat(data.harvestedBiomass || data.quantityKg || 0) *
            parseFloat(data.pricePerKg || 380),
          harvestType: data.harvestType || (data.isFinal ? "Final Harvest" : "Partial Harvest"),
          isFinal: Boolean(data.isFinal || data.harvestType === "Final Harvest"),
        });
        canonicalHarvest = hRes?.data;
      }

      // Update in-memory state
      setDb((prev) => {
        const newTanks = (prev.tanks || []).map((t) => {
          if (t.id === tankId) {
            const tankUpdates = {
              ...t,
              lastTest: new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
              testStatus: "Completed",
            };

            if (data.biomass) tankUpdates.biomass = data.biomass;
            if (data.abw) tankUpdates.abw = data.abw;
            if (data.fcr) tankUpdates.fcr = data.fcr;
            if (data.salinity) tankUpdates.salinity = `${data.salinity} ppt`;

            if (
              (recordType === "HARVEST_ENTRY" || recordType === "HARVEST") &&
              (data.harvestType === "Final Harvest" || data.isFinal)
            ) {
              tankUpdates.status = "Harvested";
              tankUpdates.finalHarvestCompleted = true;
            }

            return tankUpdates;
          }
          return t;
        });

        const actionText = `${canonicalSub.testType || "Field Test"} Logged`;
        const detailText = `${canonicalSub.testType || "Field Test"} completed for ${farmer ? farmer.name : farmerId} • ${tank ? tank.name : tankId}`;
        const timeStr = new Date().toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        return {
          ...prev,
          submissions: [canonicalSub, ...prev.submissions.filter((s) => s.id !== canonicalSub.id)],
          tanks: newTanks,
          harvests: canonicalHarvest ? [canonicalHarvest, ...(prev.harvests || []).filter((h) => h.id !== canonicalHarvest.id)] : prev.harvests,
          activities: [
            { id: Date.now(), time: timeStr, action: actionText, detail: detailText },
            ...(prev.activities || []),
          ],
          drafts: (prev.drafts || []).filter((d) => d.tankId !== tankId),
        };
      });

      // Clear caches
      adminService.clearCache('/submissions');
      adminService.clearCache('/tanks');
      adminService.clearCache('/admin/submission-locations?date=today');
      adminService.clearCache('/analytics/summary');
      if (canonicalHarvest) {
        adminService.clearCache('/harvests');
        adminService.clearCache('/farmers');
      }

      window.dispatchEvent(new CustomEvent('submissionCreated', { detail: canonicalSub }));
      if (canonicalHarvest) {
        window.dispatchEvent(new CustomEvent('harvestCreated', { detail: canonicalHarvest }));
      }
      window.dispatchEvent(new CustomEvent('adminDataChanged'));

      showToast(`Field record saved successfully! GPS coordinates attached.`);
      return canonicalSub;
    } catch (err) {
      console.error("[MockDataContext] recordFieldEntry failed:", err);
      showToast(`Failed to save field record: ${err.message || 'API error'}`);
      throw err;
    }
  };

  const addPondToFarmer = async (farmerId, pondData) => {
    try {
      const farmer = db.farmers?.find((f) => f.id === farmerId);
      const res = await apiClient.post("/tanks", {
        name: pondData.name || `Tank ${(db.tanks?.filter((t) => t.farmerId === farmerId).length || 0) + 1}`,
        farmerId,
        acres: pondData.acres || pondData.area || 2.5,
        size: pondData.size || (pondData.area ? `${pondData.area} Acres` : "2.5 Acres"),
        waterSource: pondData.waterSource || farmer?.waterSource || "Canal",
        salinity: pondData.salinity ? `${pondData.salinity} ppt` : "16 ppt",
        species: pondData.species || "Vannamei",
        cultureType: pondData.cultureType || "Semi-Intensive",
        stockingDate: pondData.stockingDate || pondData.seedDate || new Date().toISOString().split("T")[0],
        seedDate: pondData.seedDate || pondData.stockingDate || null,
        seedStockingLak: pondData.seedStockingLak || pondData.seed_stocking_lak || pondData.seedStocked || "2.5",
        doc: pondData.doc != null && pondData.doc !== "" ? Number(pondData.doc) : 0,
        abw: pondData.abw || "10g",
        biomass: pondData.biomass || "600kg",
        fcr: pondData.fcr || "1.15",
        boundaryCoordinates: pondData.boundaryCoordinates || null,
        boundaryMethod: pondData.boundaryMethod || null,
        boundaryAreaAcres: pondData.boundaryAreaAcres || null,
        boundaryQuality: pondData.boundaryQuality || null,
        boundaryCapturedAt: pondData.boundaryCapturedAt || null,
      });

      const canonicalTank = res?.data;
      if (!canonicalTank) {
        throw new Error(res?.message || "Failed to add tank to database");
      }

      setDb((prev) => ({
        ...prev,
        tanks: normalizeTanks([...prev.tanks.filter((t) => t.id !== canonicalTank.id), canonicalTank]),
      }));

      adminService.clearCache('/tanks');
      adminService.clearCache('/farmers');
      adminService.clearCache('/analytics/summary');

      window.dispatchEvent(new CustomEvent('tankCreated', { detail: canonicalTank }));
      window.dispatchEvent(new CustomEvent('adminDataChanged'));
      showToast(`Tank ${canonicalTank.name} added to farmer!`);
      return canonicalTank;
    } catch (err) {
      console.error("[MockDataContext] addPondToFarmer error:", err);
      showToast(`Failed to add tank: ${err.message || 'API error'}`);
      throw err;
    }
  };

  const addTankToFarmer = addPondToFarmer;

  // Weekly Tank-Test Compliance & Follow-up Messaging Methods
  const getComplianceDueList = async (params = null, force = false) => {
    return adminService.getComplianceDueList(params, force);
  };

  const submitFollowup = async (payload) => {
    const res = await adminService.submitFollowup(payload);
    window.dispatchEvent(new CustomEvent('complianceFollowupCreated', { detail: res }));
    return res;
  };

  const getFollowupHistory = async (tankId, cycleKey = null) => {
    return adminService.getFollowupHistory(tankId, cycleKey);
  };

  return (
    <MockDataContext.Provider
      value={{
        db,
        fetchDataFromDb,
        refreshDb: fetchDataFromDb,
        isLoadingDb,
        dbConnected,
        getComplianceDueList,
        submitFollowup,
        getFollowupHistory,
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
        markAllNotificationsRead,
        refreshNotifications,
        refreshDb: fetchDataFromDb,
        fetchDataFromDb,
        refreshFarmers,
        refreshTanks,
        refreshSubmissions,
        refreshHarvests,
        dbError,
        dbConnected,
        isLoadingDb,
      }}
    >
      {children}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            backgroundColor: "#1A2FB8",
            color: "white",
            padding: "12px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0, 24, 173, 0.35)",
            zIndex: 9999,
            fontWeight: "600",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              backgroundColor: "white",
              borderRadius: "50%",
            }}
          ></span>
          {toastMessage}
        </div>
      )}
    </MockDataContext.Provider>
  );
};

export const useMockData = () => useContext(MockDataContext);
