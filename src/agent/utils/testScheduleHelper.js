// Configuration of 7 routine weekly field modules
export const ROUTINE_TESTS = [
  { 
    key: 'WATER_QUALITY', 
    label: 'Water Analysis', 
    matchKeys: ['WATER', 'WATER ANALYSIS', 'WATER_QUALITY'],
    shortDesc: 'Salinity, pH, DO, Ammonia, Alkalinity'
  },
  { 
    key: 'FEED_ENTRY', 
    label: 'Feed Test', 
    matchKeys: ['FEED', 'FEED TEST', 'FEED_ENTRY'],
    shortDesc: 'Daily feeding rate, check tray intake, FCR'
  },
  { 
    key: 'DISEASE', 
    label: 'Disease Observation', 
    matchKeys: ['DISEASE', 'DISEASE OBSERVATION', 'DISEASE_OBSERVATION'],
    shortDesc: 'White gut, muscle necrosis, moulting check'
  },
  { 
    key: 'MEDICATION', 
    label: 'Medication', 
    matchKeys: ['MEDICATION', 'MEDICINE'],
    shortDesc: 'Probiotics, minerals, sanitizers dosage'
  },
  { 
    key: 'MORTALITY_LOG', 
    label: 'Mortality Check', 
    matchKeys: ['MORTALITY', 'MORTALITY CHECK', 'MORTALITY_LOG'],
    shortDesc: 'Dead shrimp count, mortality log, cause'
  },
  { 
    key: 'FARM_ACTIVITY', 
    label: 'Farm Activity', 
    matchKeys: ['FARM_ACTIVITY', 'ACTIVITY', 'FARM ACTIVITY'],
    shortDesc: 'Aerator run, water exchange, liming'
  },
  { 
    key: 'PHOTO_OBSERVATION', 
    label: 'Photo Observation', 
    matchKeys: ['PHOTO', 'PHOTO OBSERVATION', 'PHOTO_OBSERVATION'],
    shortDesc: 'Pond visual audit & shrimp sample photo'
  },
];

/**
 * Calculates the weekly routine test completion for a given tank.
 * Matches against actual submissions in the mock database.
 */
export const getTankWeeklySchedule = (tank, submissions = []) => {
  if (!tank) {
    return {
      testList: ROUTINE_TESTS.map(t => ({ ...t, isDone: false, completedDate: null })),
      doneCount: 0,
      dueCount: 7,
      dueTests: ROUTINE_TESTS,
      isAllDone: false,
      dueSummaryText: ROUTINE_TESTS.map(t => t.label).join(', ')
    };
  }

  const safeSubs = Array.isArray(submissions) ? submissions.filter(Boolean) : [];
  const tankId = tank.id || '';
  const tankName = tank.name || '';
  const farmerId = tank.farmerId || '';

  const tankSubs = safeSubs.filter(s => {
    if (!s) return false;
    if (tankId && s.tankId === tankId) return true;
    if (tankName && farmerId && s.tankName === tankName && s.farmerId === farmerId) return true;
    if (tankName && s.tankName === tankName) return true;
    return false;
  });

  const testList = ROUTINE_TESTS.map(test => {
    const foundSub = tankSubs.find(s => {
      const typeStr = String(s?.testType || s?.recordType || '').toUpperCase();
      return test.matchKeys.some(m => typeStr.includes(m));
    });

    return {
      ...test,
      isDone: Boolean(foundSub),
      completedDate: foundSub ? (foundSub.date || '2026-09-01') : null,
      submission: foundSub || null
    };
  });

  const doneCount = testList.filter(t => t.isDone).length;
  const dueTests = testList.filter(t => !t.isDone);
  const dueCount = dueTests.length;

  return {
    testList,
    doneCount,
    dueCount,
    dueTests,
    isAllDone: dueCount === 0,
    dueSummaryText: dueTests.map(t => t.label).join(', ')
  };
};