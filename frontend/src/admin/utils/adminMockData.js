// Official Administrative Hierarchy of Andhra Pradesh (MySQL Real-aligned)
export const adminRegions = [
  {
    id: 'REG001',
    code: 'REG001',
    name: 'Bhimavaram',
    shortName: 'Bhimavaram',
    farmers: 3,
    tanks: 6,
    avgFcr: 1.25,
    compliance: 96,
    incharges: 1,
    agents: 2,
    status: 'ACTIVE',
    localities: [
      { id: 'LOC-BV01', name: 'Chinnamiram', fcr: 1.22, farmers: 1, tanks: 2 },
      { id: 'LOC-BV02', name: 'Bhimavaram', fcr: 1.25, farmers: 1, tanks: 2 },
      { id: 'LOC-BV03', name: 'Losari', fcr: 1.27, farmers: 1, tanks: 2 },
      { id: 'LOC-BV04', name: 'Gollavanitippa', fcr: 1.21, farmers: 1, tanks: 2 },
      { id: 'LOC-BV05', name: 'Akuruvu', fcr: 1.24, farmers: 0, tanks: 0 }
    ]
  },
  {
    id: 'REG002',
    code: 'REG002',
    name: 'Kakinada',
    shortName: 'Kakinada',
    farmers: 1,
    tanks: 1,
    avgFcr: 1.30,
    compliance: 94,
    incharges: 1,
    agents: 1,
    status: 'ACTIVE',
    localities: [
      { id: 'LOC-KK01', name: 'Vakalapudi', fcr: 1.28, farmers: 1, tanks: 1 },
      { id: 'LOC-KK02', name: 'Kakinada Port', fcr: 1.30, farmers: 0, tanks: 0 },
      { id: 'LOC-KK03', name: 'Coringa', fcr: 1.32, farmers: 0, tanks: 0 }
    ]
  },
  {
    id: 'REG003',
    code: 'REG003',
    name: 'Narasapuram',
    shortName: 'Narasapuram',
    farmers: 1,
    tanks: 1,
    avgFcr: 1.28,
    compliance: 95,
    incharges: 1,
    agents: 1,
    status: 'ACTIVE',
    localities: [
      { id: 'LOC-NS01', name: 'Mogalthur', fcr: 1.26, farmers: 1, tanks: 1 },
      { id: 'LOC-NS02', name: 'Narasapuram Town', fcr: 1.28, farmers: 0, tanks: 0 }
    ]
  },
  {
    id: 'REG-COASTAL',
    code: 'REG-COASTAL',
    name: 'Coastal Andhra',
    shortName: 'Coastal Andhra',
    farmers: 5,
    tanks: 8,
    avgFcr: 1.26,
    compliance: 95,
    incharges: 2,
    agents: 3,
    status: 'ACTIVE',
    localities: [
      { id: 'LOC-C01', name: 'Bhimavaram', fcr: 1.25, farmers: 3, tanks: 6 },
      { id: 'LOC-C02', name: 'Kakinada', fcr: 1.30, farmers: 1, tanks: 1 },
      { id: 'LOC-C03', name: 'Narasapuram', fcr: 1.28, farmers: 1, tanks: 1 },
      { id: 'LOC-C04', name: 'Nellore', fcr: 1.35, farmers: 0, tanks: 0 }
    ]
  }
];

// Dedicated Incharges (Aligned with MySQL incharges & users table)
export const adminIncharges = [
  {
    id: 'INC001',
    name: 'Ravi Kumar',
    shortName: 'Ravi Kumar',
    role: 'Incharge - Bhimavaram',
    regionId: 'REG001',
    region: 'Bhimavaram',
    locality: 'Bhimavaram Central',
    phone: '+91 9121006439',
    email: 'ravi@royalsmarine.com',
    agents: 2,
    farmers: 4,
    tanks: 7,
    compliance: 96,
    status: 'ACTIVE'
  },
  {
    id: 'INC002',
    name: 'Rajesh Varma',
    shortName: 'Rajesh Varma',
    role: 'Incharge - Kakinada',
    regionId: 'REG002',
    region: 'Kakinada',
    locality: 'Kakinada Port',
    phone: '+91 9121006440',
    email: 'rajesh@royalsmarine.com',
    agents: 1,
    farmers: 1,
    tanks: 1,
    compliance: 94,
    status: 'ACTIVE'
  },
  {
    id: '1',
    name: 'Bharadwaj Reddy',
    shortName: 'Bharadwaj Reddy',
    role: 'Incharge - Bhimavaram South',
    regionId: 'REG001',
    region: 'Bhimavaram',
    locality: 'Bhimavaram South',
    phone: '+91 9121006438',
    email: 'bharadwaj@royalsmarine.com',
    agents: 1,
    farmers: 0,
    tanks: 0,
    compliance: 95,
    status: 'ACTIVE'
  }
];

// Field Agents (Aligned with MySQL agents & users table)
export const adminAgents = [
  {
    id: 'agent001',
    name: 'Ramesh',
    shortName: 'Ramesh',
    role: 'Field Agent - Chinnamiram',
    inchargeId: 'INC001',
    incharge: 'Ravi Kumar',
    regionId: 'REG001',
    region: 'Bhimavaram',
    locality: 'Chinnamiram',
    assignedArea: 'Chinnamiram Aqua Belt',
    phone: '+91 9000000001',
    email: 'ramesh@royalsmarine.com',
    farmers: 2,
    tanks: 4,
    siteVisits: 8,
    tests: 62,
    compliance: 96.0,
    status: 'ACTIVE'
  },
  {
    id: 'agent002',
    name: 'Suresh',
    shortName: 'Suresh',
    role: 'Field Agent - Bhimavaram',
    inchargeId: 'INC001',
    incharge: 'Ravi Kumar',
    regionId: 'REG001',
    region: 'Bhimavaram',
    locality: 'Bhimavaram',
    assignedArea: 'Bhimavaram & Mogalthur',
    phone: '+91 9000000002',
    email: 'suresh@royalsmarine.com',
    farmers: 2,
    tanks: 3,
    siteVisits: 6,
    tests: 48,
    compliance: 94.0,
    status: 'ACTIVE'
  },
  {
    id: 'agent003',
    name: 'Mahesh',
    shortName: 'Mahesh',
    role: 'Field Agent - Akuruvu',
    inchargeId: 'INC002',
    incharge: 'Rajesh Varma',
    regionId: 'REG002',
    region: 'Kakinada',
    locality: 'Akuruvu',
    assignedArea: 'Vakalapudi & Akuruvu Area',
    phone: '+91 9000000003',
    email: 'mahesh@royalsmarine.com',
    farmers: 1,
    tanks: 1,
    siteVisits: 5,
    tests: 38,
    compliance: 92.5,
    status: 'ACTIVE'
  }
];

// Farmers (Aligned with MySQL farmers table)
export const adminFarmers = [
  {
    id: '1',
    farmer_code: 'FAR001',
    name: 'Gowtham Krishna',
    phone: '9963545352',
    village: 'Chinnamiram',
    totalAcres: 10.0,
    acres: '10.00 Acres',
    agentId: 'agent001',
    agent: 'Ramesh',
    inchargeId: 'INC001',
    incharge: 'Ravi Kumar',
    region: 'Bhimavaram',
    location: 'Chinnamiram, Bhimavaram',
    status: 'ACTIVE',
    waterSource: 'Canal',
    tanks: 2
  },
  {
    id: 'F002',
    farmer_code: 'FAR002',
    name: 'Venkat Rao',
    phone: '9848011223',
    village: 'Losari',
    totalAcres: 12.5,
    acres: '12.50 Acres',
    agentId: 'agent001',
    agent: 'Ramesh',
    inchargeId: 'INC001',
    incharge: 'Ravi Kumar',
    region: 'Bhimavaram',
    location: 'Losari, Bhimavaram',
    status: 'ACTIVE',
    waterSource: 'Borewell',
    tanks: 2
  },
  {
    id: 'F003',
    farmer_code: 'FAR003',
    name: 'Satyanarayana Raju',
    phone: '9848022334',
    village: 'Gollavanitippa',
    totalAcres: 8.0,
    acres: '8.00 Acres',
    agentId: 'agent002',
    agent: 'Suresh',
    inchargeId: 'INC001',
    incharge: 'Ravi Kumar',
    region: 'Bhimavaram',
    location: 'Gollavanitippa, Bhimavaram',
    status: 'ACTIVE',
    waterSource: 'Canal',
    tanks: 2
  },
  {
    id: 'F004',
    farmer_code: 'FAR004',
    name: 'Subba Rao',
    phone: '9848033445',
    village: 'Vakalapudi',
    totalAcres: 15.0,
    acres: '15.00 Acres',
    agentId: 'agent003',
    agent: 'Mahesh',
    inchargeId: 'INC002',
    incharge: 'Rajesh Varma',
    region: 'Kakinada',
    location: 'Vakalapudi, Kakinada',
    status: 'ACTIVE',
    waterSource: 'Creek',
    tanks: 1
  },
  {
    id: 'F005',
    farmer_code: 'FAR005',
    name: 'Prasad Varma',
    phone: '9848044556',
    village: 'Mogalthur',
    totalAcres: 6.0,
    acres: '6.00 Acres',
    agentId: 'agent002',
    agent: 'Suresh',
    inchargeId: 'INC001',
    incharge: 'Ravi Kumar',
    region: 'Narasapuram',
    location: 'Mogalthur, Narasapuram',
    status: 'ACTIVE',
    waterSource: 'Canal',
    tanks: 1
  }
];

// Tanks (Aligned with MySQL tanks table)
export const adminTanks = [
  {
    id: 'T001',
    name: 'Tank 1',
    farmerId: '1',
    farmer_id: 'F001',
    farmer: 'Gowtham Krishna',
    agentId: 'agent001',
    agent: 'Ramesh',
    inchargeId: 'INC001',
    incharge: 'Ravi Kumar',
    region: 'Bhimavaram',
    locality: 'Chinnamiram',
    currentCycle: 'Cycle 1 (2026)',
    status: 'ACTIVE',
    testStatus: 'Due',
    abw: 16.5,
    biomass: 1650,
    fcr: 1.22,
    doc: 65,
    salinity: 15,
    lastTest: '07 Oct 2026',
    nextDue: 'Due This Week'
  },
  {
    id: 'T002',
    name: 'Tank 2',
    farmerId: '1',
    farmer_id: 'F001',
    farmer: 'Gowtham Krishna',
    agentId: 'agent001',
    agent: 'Ramesh',
    inchargeId: 'INC001',
    incharge: 'Ravi Kumar',
    region: 'Bhimavaram',
    locality: 'Chinnamiram',
    currentCycle: 'Cycle 1 (2026)',
    status: 'ACTIVE',
    testStatus: 'Completed',
    abw: 18.2,
    biomass: 1900,
    fcr: 1.18,
    doc: 72,
    salinity: 14,
    lastTest: '07 Oct 2026',
    nextDue: 'Next Week'
  },
  {
    id: 'T003',
    name: 'Tank 1',
    farmerId: 'F002',
    farmer_id: 'F002',
    farmer: 'Venkat Rao',
    agentId: 'agent001',
    agent: 'Ramesh',
    inchargeId: 'INC001',
    incharge: 'Ravi Kumar',
    region: 'Bhimavaram',
    locality: 'Losari',
    currentCycle: 'Cycle 1 (2026)',
    status: 'ACTIVE',
    testStatus: 'Due',
    abw: 12.0,
    biomass: 1200,
    fcr: 1.25,
    doc: 48,
    salinity: 18,
    lastTest: '01 Oct 2026',
    nextDue: 'Due This Week'
  },
  {
    id: 'T004',
    name: 'Tank 2',
    farmerId: 'F002',
    farmer_id: 'F002',
    farmer: 'Venkat Rao',
    agentId: 'agent001',
    agent: 'Ramesh',
    inchargeId: 'INC001',
    incharge: 'Ravi Kumar',
    region: 'Bhimavaram',
    locality: 'Losari',
    currentCycle: 'Cycle 1 (2026)',
    status: 'ACTIVE',
    testStatus: 'Overdue',
    abw: 14.1,
    biomass: 1450,
    fcr: 1.29,
    doc: 55,
    salinity: 17,
    lastTest: '24 Sep 2026',
    nextDue: 'Overdue'
  },
  {
    id: 'T005',
    name: 'Tank 1',
    farmerId: 'F003',
    farmer_id: 'F003',
    farmer: 'Satyanarayana Raju',
    agentId: 'agent002',
    agent: 'Suresh',
    inchargeId: 'INC001',
    incharge: 'Ravi Kumar',
    region: 'Bhimavaram',
    locality: 'Gollavanitippa',
    currentCycle: 'Cycle 1 (2026)',
    status: 'ACTIVE',
    testStatus: 'Completed',
    abw: 22.0,
    biomass: 2400,
    fcr: 1.15,
    doc: 85,
    salinity: 12,
    lastTest: '06 Oct 2026',
    nextDue: 'Next Week'
  },
  {
    id: 'T006',
    name: 'Tank 2',
    farmerId: 'F003',
    farmer_id: 'F003',
    farmer: 'Satyanarayana Raju',
    agentId: 'agent002',
    agent: 'Suresh',
    inchargeId: 'INC001',
    incharge: 'Ravi Kumar',
    region: 'Bhimavaram',
    locality: 'Gollavanitippa',
    currentCycle: 'Cycle 1 (2026)',
    status: 'ACTIVE',
    testStatus: 'Due',
    abw: 15.4,
    biomass: 1500,
    fcr: 1.21,
    doc: 58,
    salinity: 13,
    lastTest: '30 Sep 2026',
    nextDue: 'Due This Week'
  },
  {
    id: 'T007',
    name: 'Tank 1',
    farmerId: 'F004',
    farmer_id: 'F004',
    farmer: 'Subba Rao',
    agentId: 'agent003',
    agent: 'Mahesh',
    inchargeId: 'INC002',
    incharge: 'Rajesh Varma',
    region: 'Kakinada',
    locality: 'Vakalapudi',
    currentCycle: 'Cycle 1 (2026)',
    status: 'ACTIVE',
    testStatus: 'Due',
    abw: 19.8,
    biomass: 2100,
    fcr: 1.20,
    doc: 76,
    salinity: 16,
    lastTest: '02 Oct 2026',
    nextDue: 'Due This Week'
  },
  {
    id: 'T008',
    name: 'Tank 1',
    farmerId: 'F005',
    farmer_id: 'F005',
    farmer: 'Prasad Varma',
    agentId: 'agent002',
    agent: 'Suresh',
    inchargeId: 'INC001',
    incharge: 'Ravi Kumar',
    region: 'Narasapuram',
    locality: 'Mogalthur',
    currentCycle: 'Cycle 1 (2026)',
    status: 'Harvested',
    testStatus: 'Completed',
    abw: 26.5,
    biomass: 2800,
    fcr: 1.14,
    doc: 105,
    salinity: 15,
    lastTest: '05 Oct 2026',
    nextDue: 'Harvest Closed'
  }
];

export const adminLocalityFcrData = [
  { locality: 'Bhimavaram', fcr: 1.25 },
  { locality: 'Chinnamiram', fcr: 1.22 },
  { locality: 'Losari', fcr: 1.27 },
  { locality: 'Gollavanitippa', fcr: 1.21 },
  { locality: 'Kakinada', fcr: 1.30 },
  { locality: 'Narasapuram', fcr: 1.28 }
];

export const adminActivities = [];
export const adminTrendData = [];
export const adminWeeklyCompliance = {
  completed: 72,
  due: 13,
  overdue: 5,
  notDue: 10
};
export const adminVerifications = [];

// Unified DB accessor
const getLiveDb = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('aqua_feed_clean_database_v1') || localStorage.getItem('aqua_feed_mock_database_v11');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
};

// Helper methods
export const getRegions = (explicitDb = null) => {
  const liveDb = explicitDb || getLiveDb();
  if (liveDb && Array.isArray(liveDb.regions) && liveDb.regions.length > 0) {
    return liveDb.regions.map(r => {
      const codeOrId = r.code || r.id;
      const foundAdmin = adminRegions.find(ar =>
        ar.id === codeOrId ||
        ar.code === codeOrId ||
        ar.name?.toLowerCase() === r.name?.toLowerCase()
      );
      const localities = foundAdmin?.localities || [
        { id: `LOC-${codeOrId}`, name: r.name, fcr: parseFloat(r.avg_fcr) || 1.25, farmers: 0, tanks: 0 }
      ];
      return {
        id: codeOrId,
        code: codeOrId,
        name: r.name,
        shortName: r.name,
        farmers: r.farmersCount || (foundAdmin?.farmers || 0),
        tanks: r.active_ponds || r.tanksCount || (foundAdmin?.tanks || 0),
        avgFcr: parseFloat(r.avg_fcr) || (foundAdmin?.avgFcr || 1.25),
        compliance: foundAdmin?.compliance || 95,
        incharges: foundAdmin?.incharges || 1,
        agents: foundAdmin?.agents || 1,
        status: r.status || 'ACTIVE',
        localities,
        ...r
      };
    });
  }
  return adminRegions;
};

export const getRegionById = (id, explicitDb = null) => {
  if (!id) return null;
  const list = getRegions(explicitDb);
  return list.find(r => 
    String(r.id) === String(id) || 
    r.code === id || 
    r.name?.toLowerCase() === String(id).toLowerCase()
  );
};

export const getIncharges = (explicitDb = null) => {
  const liveDb = explicitDb || getLiveDb();
  if (liveDb && Array.isArray(liveDb.incharges) && liveDb.incharges.length > 0) {
    return liveDb.incharges.filter(Boolean).map(inc => {
      const incAgents = (liveDb.agents || []).filter(a => a && (a.inchargeId === inc.id || a.incharge_id === inc.id));
      const incAgentIds = incAgents.map(a => a.id);
      const incFarmers = (liveDb.farmers || []).filter(f => f && (f.inchargeId === inc.id || f.incharge_id === inc.id || (f.agentId && incAgentIds.includes(f.agentId))));
      const incFarmerIds = incFarmers.map(f => f.id);
      const incTanks = (liveDb.tanks || []).filter(t => t && (incFarmerIds.includes(t.farmerId || t.farmer_id) || t.inchargeId === inc.id || t.incharge_id === inc.id));
      const incName = inc.name || inc.fullName || inc.username || (inc.id ? `Incharge ${inc.id}` : 'Area Sales Manager');
      return {
        id: inc.id || `INC-${Date.now()}`,
        name: incName,
        shortName: inc.shortName || (typeof incName === 'string' ? incName.split('(')[0].trim() : incName),
        role: inc.role || `Incharge - ${inc.locality || inc.region || incName}`,
        regionId: inc.regionId || inc.region_id || 'REG001',
        region: inc.region || (inc.id === 'INC002' ? 'Kakinada' : 'Bhimavaram'),
        locality: inc.locality || (inc.id === 'INC002' ? 'Kakinada Port' : 'Bhimavaram Central'),
        phone: inc.phone || (inc.id === 'INC002' ? '+91 9121006440' : '+91 9121006439'),
        email: inc.email || (inc.id === 'INC002' ? 'rajesh@royalsmarine.com' : 'ravi@royalsmarine.com'),
        agents: incAgents.length || (inc.id === 'INC002' ? 1 : 2),
        farmers: incFarmers.length || (inc.id === 'INC002' ? 1 : 4),
        tanks: incTanks.length || (inc.id === 'INC002' ? 1 : 7),
        compliance: 95,
        status: inc.status || 'ACTIVE'
      };
    });
  }
  return adminIncharges;
};

export const getInchargesByRegion = (regionId, explicitDb = null) => {
  return getIncharges(explicitDb).filter(i => 
    i.regionId === regionId || 
    i.region === regionId ||
    (regionId === 'REG001' && (i.region === 'Bhimavaram' || i.regionId === '1')) ||
    (regionId === 'REG002' && (i.region === 'Kakinada' || i.regionId === '2'))
  );
};

export const getInchargeById = (id, explicitDb = null) => {
  if (!id) return null;
  const list = getIncharges(explicitDb);
  return list.find(i => 
    String(i.id) === String(id) || 
    i.user_id === id || 
    i.userId === id ||
    i.name?.toLowerCase() === String(id).toLowerCase()
  );
};

export const getAgents = (explicitDb = null) => {
  const liveDb = explicitDb || getLiveDb();
  if (liveDb && Array.isArray(liveDb.agents) && liveDb.agents.length > 0) {
    return liveDb.agents.filter(Boolean).map(a => {
      const incharge = (liveDb.incharges || []).find(i => i && (i.id === a.inchargeId || i.id === a.incharge_id));
      const agentFarmers = (liveDb.farmers || []).filter(f => f && (f.agentId === a.id || f.agent_id === a.id));
      const farmerIds = agentFarmers.map(f => f.id);
      const agentTanks = (liveDb.tanks || []).filter(t => t && (farmerIds.includes(t.farmerId || t.farmer_id) || t.agentId === a.id || t.agent_id === a.id));
      const agName = a.name || a.username || (a.id ? `Agent ${a.id}` : 'Field Agent');
      return {
        id: a.id || `AGT-${Date.now()}`,
        name: agName,
        shortName: a.shortName || (typeof agName === 'string' ? agName.split('(')[0].trim() : agName),
        role: a.role || `Field Agent - ${a.locality || 'Field'}`,
        inchargeId: a.inchargeId || a.incharge_id || (a.id === 'agent003' ? 'INC002' : 'INC001'),
        incharge: incharge?.name || (a.id === 'agent003' ? 'Rajesh Varma' : 'Ravi Kumar'),
        regionId: a.regionId || incharge?.regionId || (a.id === 'agent003' ? 'REG002' : 'REG001'),
        region: a.region || incharge?.region || (a.id === 'agent003' ? 'Kakinada' : 'Bhimavaram'),
        locality: a.locality || 'Bhimavaram',
        assignedArea: a.assignedArea || a.locality || 'Aqua Belt',
        phone: a.phone || '+91 9000000001',
        email: a.email || `${String(agName).toLowerCase().replace(/\s+/g, '')}@royalsmarine.com`,
        farmers: a.farmersCount !== undefined ? a.farmersCount : agentFarmers.length,
        tanks: a.tanksCount !== undefined ? a.tanksCount : agentTanks.length,
        siteVisits: a.siteVisits || 6,
        tests: a.tests || 42,
        compliance: a.complianceRate || 94.0,
        status: a.status || 'ACTIVE'
      };
    });
  }
  return adminAgents;
};

export const getAgentsByIncharge = (inchargeId, explicitDb = null) => {
  return getAgents(explicitDb).filter(a => 
    a.inchargeId === inchargeId ||
    (inchargeId === 'INC001' && (a.id === 'agent001' || a.id === 'agent002')) ||
    (inchargeId === 'INC002' && a.id === 'agent003')
  );
};

export const getAgentById = (id, explicitDb = null) => {
  if (!id) return null;
  const list = getAgents(explicitDb);
  return list.find(a => 
    String(a.id) === String(id) || 
    a.username === id || 
    a.name?.toLowerCase() === String(id).toLowerCase()
  );
};

export const getFarmers = (explicitDb = null) => {
  const liveDb = explicitDb || getLiveDb();
  if (liveDb && Array.isArray(liveDb.farmers) && liveDb.farmers.length > 0) {
    return liveDb.farmers.map(f => {
      const agent = (liveDb.agents || []).find(a => a && (a.id === (f.agentId || f.agent_id)));
      const incharge = (liveDb.incharges || []).find(i => i && (i.id === (f.inchargeId || f.incharge_id || agent?.inchargeId)));
      const fTanks = (liveDb.tanks || []).filter(t => {
        if (!t) return false;
        const tFId = t.farmerId || t.farmer_id;
        return tFId === f.id || tFId === f.farmer_code || ((f.id === '1' || f.id === 'F001' || f.farmer_code === 'FAR001') && (tFId === 'F001' || tFId === '1'));
      });
      const totalAcres = parseFloat(f.acres || f.total_acres || f.extent) || (fTanks.length > 0 ? fTanks.reduce((sum, t) => sum + (parseFloat(t.size || t.acres) || 2.5), 0) : 10.0);
      return {
        id: f.id,
        farmer_code: f.farmer_code || f.id,
        name: f.name,
        agentId: f.agentId || f.agent_id || agent?.id || 'agent001',
        agent: agent ? agent.name : (f.agent || 'Assigned Technician'),
        inchargeId: f.inchargeId || f.incharge_id || incharge?.id || (f.id === 'F004' ? 'INC002' : 'INC001'),
        incharge: incharge ? incharge.name : (f.incharge || (f.id === 'F004' ? 'Rajesh Varma' : 'Ravi Kumar')),
        region: f.region || (f.incharge_id === 'INC002' || f.id === 'F004' ? 'Kakinada' : f.id === 'F005' ? 'Narasapuram' : 'Bhimavaram'),
        locality: f.location || f.village || agent?.locality || 'Bhimavaram',
        assignedArea: agent?.locality || f.location || 'Bhimavaram',
        phone: f.phone || '+91 9876543210',
        village: f.village || f.location || 'Bhimavaram',
        acres: `${totalAcres} Acres`,
        totalAcres: totalAcres,
        waterSource: f.waterSource || f.water_source || 'Canal',
        tanks: fTanks.length || parseInt(f.numberOfTanks) || 1,
        tankBreakdown: fTanks.map((t, idx) => ({
          id: t.id,
          name: t.name || `Tank ${idx + 1}`,
          acres: parseFloat(t.size || t.acres) || (totalAcres / (fTanks.length || 1)),
          doc: t.doc || 45,
          abw: parseFloat(t.abw) || 14.5,
          fcr: parseFloat(t.fcr) || 1.18,
          biomass: parseInt(String(t.biomass || '').replace(/\D/g, '')) || 1200,
          waterSource: t.waterSource || t.water_source || f.waterSource || 'Canal',
          salinity: parseInt(String(t.salinity || '').replace(/\D/g, '')) || 16,
          soilType: t.soilType || 'Loam',
          hatcheryName: t.hatchery || 'Golden Marine Hatchery',
          brooder: t.brooder || 'Kona Bay',
          seedDate: t.stockingDate || t.stocking_date || '2026-05-20',
          seedStockingLak: parseFloat(t.seedStockingLak) || 2.5,
          feed: 5000,
          feedType: t.feedType || 'Premium Pellets',
          status: t.status || 'Active',
          testStatus: t.testStatus || t.test_status || 'Due',
          lastTest: t.lastTest || t.last_test || '07 Oct 2026',
          nextTest: t.nextTest || t.next_test || 'Due This Week'
        })),
        status: f.status || 'Active'
      };
    });
  }
  return adminFarmers;
};

export const getFarmersByAgent = (agentId, explicitDb = null) => {
  return getFarmers(explicitDb).filter(f => f.agentId === agentId);
};

export const getFarmersByIncharge = (inchargeId, explicitDb = null) => {
  const incharge = getInchargeById(inchargeId, explicitDb);
  const incName = incharge ? (incharge.name || '').split(' ')[0] : '';
  const agents = getAgentsByIncharge(inchargeId, explicitDb);
  const agentIds = agents.map(a => a.id);
  return getFarmers(explicitDb)
    .filter(f =>
      f.inchargeId === inchargeId ||
      (incName && f.incharge?.includes(incName)) ||
      agentIds.includes(f.agentId)
    )
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
};

export const getFarmerById = (id, explicitDb = null) => {
  if (!id) return null;
  const list = getFarmers(explicitDb);
  return list.find(f => 
    String(f.id) === String(id) || 
    f.farmer_code === id || 
    ((String(id) === '1' || id === 'F001' || id === 'FAR001') && (String(f.id) === '1' || f.id === 'F001' || f.farmer_code === 'FAR001'))
  );
};

export const getTanks = (explicitDb = null) => {
  const liveDb = explicitDb || getLiveDb();
  if (liveDb && Array.isArray(liveDb.tanks) && liveDb.tanks.length > 0) {
    return liveDb.tanks.map((t, idx) => {
      const farmer = (liveDb.farmers || []).find(f => {
        if (!f) return false;
        const tFId = t.farmerId || t.farmer_id;
        return f.id === tFId || f.farmer_code === tFId || ((tFId === 'F001' || tFId === '1') && (f.id === '1' || f.id === 'F001' || f.farmer_code === 'FAR001'));
      });
      const agent = (liveDb.agents || []).find(a => a && (a.id === (t.agentId || t.agent_id)));
      const incharge = (liveDb.incharges || []).find(i => i && (i.id === (t.inchargeId || t.incharge_id || agent?.inchargeId)));
      const tStatus = t.testStatus || t.test_status || 'Due';
      return {
        id: t.id,
        name: t.name || `Tank ${idx + 1}`,
        farmerId: t.farmerId || t.farmer_id,
        farmer: farmer ? farmer.name : (t.farmerName || 'Farmer'),
        agent: agent ? agent.name : (t.agentId ? 'Assigned Tech' : 'Direct Incharge'),
        incharge: incharge ? incharge.name : (t.incharge || 'Ravi Kumar'),
        region: farmer?.region || 'Bhimavaram',
        locality: farmer?.location || farmer?.village || 'Bhimavaram',
        currentCycle: t.currentCycle || 'Cycle 1 (2026)',
        abw: parseFloat(t.abw) || 14.5,
        biomass: parseInt(String(t.biomass || '').replace(/\D/g, '')) || 1200,
        feed: 2500,
        fcr: parseFloat(t.fcr) || 1.18,
        compliance: tStatus === 'Completed' ? 100 : tStatus === 'Overdue' ? 60 : 85,
        lastTest: t.lastTest || t.last_test || '07 Oct 2026',
        nextDue: t.nextTest || t.next_test || 'Due This Week',
        status: t.status || 'Active',
        testStatus: tStatus,
        doc: t.doc || 45,
        salinity: t.salinity ? parseInt(String(t.salinity).replace(/\D/g, '')) : 15
      };
    });
  }
  return adminTanks;
};

export const getTanksByFarmer = (farmerId, explicitDb = null) => {
  return getTanks(explicitDb).filter(t => 
    t.farmerId === farmerId || 
    t.farmer_id === farmerId ||
    ((farmerId === '1' || farmerId === 'F001' || farmerId === 'FAR001') && (t.farmerId === '1' || t.farmerId === 'F001' || t.farmer_id === 'F001'))
  );
};

export const getTanksByIncharge = (inchargeId, explicitDb = null) => {
  const farmers = getFarmersByIncharge(inchargeId, explicitDb);
  const farmerIds = farmers.map(f => f.id);
  return getTanks(explicitDb)
    .filter(t => farmerIds.includes(t.farmerId) || t.inchargeId === inchargeId)
    .sort((a, b) => {
      const fA = farmers.find(f => f.id === a.farmerId);
      const fB = farmers.find(f => f.id === b.farmerId);
      const nameA = fA ? fA.name : '';
      const nameB = fB ? fB.name : '';
      const farmerDiff = nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
      if (farmerDiff !== 0) return farmerDiff;
      return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
    });
};

export const getTankById = (id, explicitDb = null) => {
  if (!id) return null;
  const list = getTanks(explicitDb);
  return list.find(t => String(t.id).toLowerCase() === String(id).toLowerCase());
};

export const getActivities = () => adminActivities;

// Dynamic FCR Calculations
export const calculateBiomass = (seedStockingLak, abw) => {
  if (!seedStockingLak || !abw) return 0;
  return seedStockingLak * abw * 100;
};

export const calculateFCR = (cumulativeFeed, biomass) => {
  if (!biomass || biomass <= 0 || !cumulativeFeed) return "0.00";
  return (cumulativeFeed / biomass).toFixed(2);
};
