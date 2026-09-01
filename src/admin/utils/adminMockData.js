// Official Administrative Hierarchy of Andhra Pradesh (3 Regions & All Cities/Towns)
export const adminRegions = [
  { 
    id: 'REG-NORTH', 
    code: 'REG-NORTH',
    name: 'North Andhra (Uttarandhra)', 
    shortName: 'North Andhra',
    farmers: 4, 
    tanks: 8, 
    avgFcr: 1.38,
    compliance: 95, 
    incharges: 1, 
    agents: 3,
    status: 'Active',
    localities: [
      { id: 'LOC-N01', name: 'Visakhapatnam', fcr: 1.35, farmers: 2, tanks: 4 },
      { id: 'LOC-N02', name: 'Srikakulam', fcr: 1.40, farmers: 1, tanks: 2 },
      { id: 'LOC-N03', name: 'Vizianagaram', fcr: 1.38, farmers: 1, tanks: 2 },
      { id: 'LOC-N04', name: 'Bheemunipatnam (Bhimili)', fcr: 1.36, farmers: 0, tanks: 0 },
      { id: 'LOC-N05', name: 'Anakapalle', fcr: 1.42, farmers: 0, tanks: 0 },
      { id: 'LOC-N06', name: 'Narsipatnam', fcr: 1.41, farmers: 0, tanks: 0 },
      { id: 'LOC-N07', name: 'Paderu', fcr: 1.44, farmers: 0, tanks: 0 },
      { id: 'LOC-N08', name: 'Araku Valley', fcr: 1.45, farmers: 0, tanks: 0 },
      { id: 'LOC-N09', name: 'Parvathipuram', fcr: 1.39, farmers: 0, tanks: 0 },
      { id: 'LOC-N10', name: 'Palasa', fcr: 1.37, farmers: 0, tanks: 0 },
      { id: 'LOC-N11', name: 'Tekkali', fcr: 1.40, farmers: 0, tanks: 0 },
      { id: 'LOC-N12', name: 'Ichchapuram', fcr: 1.38, farmers: 0, tanks: 0 },
      { id: 'LOC-N13', name: 'Bobbili', fcr: 1.42, farmers: 0, tanks: 0 },
      { id: 'LOC-N14', name: 'Salur', fcr: 1.43, farmers: 0, tanks: 0 }
    ]
  },
  { 
    id: 'REG-COASTAL', 
    code: 'REG-COASTAL',
    name: 'Coastal Andhra', 
    shortName: 'Coastal Andhra',
    farmers: 8, 
    tanks: 14, 
    avgFcr: 1.39,
    compliance: 94, 
    incharges: 4, 
    agents: 8,
    status: 'Active',
    localities: [
      { id: 'LOC-C01', name: 'Vijayawada', fcr: 1.38, farmers: 1, tanks: 2 },
      { id: 'LOC-C02', name: 'Guntur', fcr: 1.40, farmers: 1, tanks: 2 },
      { id: 'LOC-C03', name: 'Rajamahendravaram (Rajahmundry)', fcr: 1.37, farmers: 0, tanks: 0 },
      { id: 'LOC-C04', name: 'Kakinada', fcr: 1.42, farmers: 2, tanks: 3 },
      { id: 'LOC-C05', name: 'Amalapuram', fcr: 1.39, farmers: 0, tanks: 0 },
      { id: 'LOC-C06', name: 'Mandapeta', fcr: 1.41, farmers: 0, tanks: 0 },
      { id: 'LOC-C07', name: 'Ramachandrapuram', fcr: 1.40, farmers: 0, tanks: 0 },
      { id: 'LOC-C08', name: 'Ravulapalem', fcr: 1.38, farmers: 0, tanks: 0 },
      { id: 'LOC-C09', name: 'Eluru', fcr: 1.43, farmers: 0, tanks: 0 },
      { id: 'LOC-C10', name: 'Bhimavaram', fcr: 1.36, farmers: 3, tanks: 5 },
      { id: 'LOC-C11', name: 'Tadepalligudem', fcr: 1.39, farmers: 0, tanks: 0 },
      { id: 'LOC-C12', name: 'Tanuku', fcr: 1.40, farmers: 0, tanks: 0 },
      { id: 'LOC-C13', name: 'Nidadavole', fcr: 1.41, farmers: 0, tanks: 0 },
      { id: 'LOC-C14', name: 'Gudivada', fcr: 1.42, farmers: 0, tanks: 0 },
      { id: 'LOC-C15', name: 'Machilipatnam', fcr: 1.39, farmers: 0, tanks: 0 },
      { id: 'LOC-C16', name: 'Avanigadda', fcr: 1.40, farmers: 0, tanks: 0 },
      { id: 'LOC-C17', name: 'Jaggayyapeta', fcr: 1.44, farmers: 0, tanks: 0 },
      { id: 'LOC-C18', name: 'Mangalagiri', fcr: 1.39, farmers: 0, tanks: 0 },
      { id: 'LOC-C19', name: 'Tenali', fcr: 1.41, farmers: 0, tanks: 0 },
      { id: 'LOC-C20', name: 'Narasaraopet', fcr: 1.42, farmers: 0, tanks: 0 },
      { id: 'LOC-C21', name: 'Sattenapalle', fcr: 1.43, farmers: 0, tanks: 0 },
      { id: 'LOC-C22', name: 'Chilakaluripet', fcr: 1.40, farmers: 0, tanks: 0 },
      { id: 'LOC-C23', name: 'Bapatla', fcr: 1.38, farmers: 0, tanks: 0 },
      { id: 'LOC-C24', name: 'Chirala', fcr: 1.39, farmers: 0, tanks: 0 },
      { id: 'LOC-C25', name: 'Ongole', fcr: 1.41, farmers: 0, tanks: 0 },
      { id: 'LOC-C26', name: 'Markapur', fcr: 1.44, farmers: 0, tanks: 0 },
      { id: 'LOC-C27', name: 'Kandukur', fcr: 1.42, farmers: 0, tanks: 0 },
      { id: 'LOC-C28', name: 'Kavali', fcr: 1.45, farmers: 2, tanks: 4 },
      { id: 'LOC-C29', name: 'Nellore', fcr: 1.35, farmers: 3, tanks: 6 },
      { id: 'LOC-C30', name: 'Atmakur', fcr: 1.42, farmers: 0, tanks: 0 },
      { id: 'LOC-C31', name: 'Venkatagiri', fcr: 1.43, farmers: 0, tanks: 0 },
      { id: 'LOC-C32', name: 'Naidupeta', fcr: 1.40, farmers: 0, tanks: 0 },
      { id: 'LOC-C33', name: 'Sullurpeta', fcr: 1.39, farmers: 0, tanks: 0 }
    ]
  },
  { 
    id: 'REG-RAYALASEEMA', 
    code: 'REG-RAYALASEEMA',
    name: 'Rayalaseema', 
    shortName: 'Rayalaseema',
    farmers: 2, 
    tanks: 4, 
    avgFcr: 1.42,
    compliance: 93, 
    incharges: 1, 
    agents: 2,
    status: 'Active',
    localities: [
      { id: 'LOC-R01', name: 'Kurnool', fcr: 1.44, farmers: 0, tanks: 0 },
      { id: 'LOC-R02', name: 'Nandyal', fcr: 1.42, farmers: 0, tanks: 0 },
      { id: 'LOC-R03', name: 'Adoni', fcr: 1.45, farmers: 0, tanks: 0 },
      { id: 'LOC-R04', name: 'Yemmiganur', fcr: 1.46, farmers: 0, tanks: 0 },
      { id: 'LOC-R05', name: 'Dhone', fcr: 1.43, farmers: 0, tanks: 0 },
      { id: 'LOC-R06', name: 'Anantapur', fcr: 1.45, farmers: 0, tanks: 0 },
      { id: 'LOC-R07', name: 'Hindupur', fcr: 1.46, farmers: 0, tanks: 0 },
      { id: 'LOC-R08', name: 'Guntakal', fcr: 1.44, farmers: 0, tanks: 0 },
      { id: 'LOC-R09', name: 'Tadipatri', fcr: 1.43, farmers: 0, tanks: 0 },
      { id: 'LOC-R10', name: 'Dharmavaram', fcr: 1.45, farmers: 0, tanks: 0 },
      { id: 'LOC-R11', name: 'Kadiri', fcr: 1.47, farmers: 0, tanks: 0 },
      { id: 'LOC-R12', name: 'Puttaparthi', fcr: 1.44, farmers: 0, tanks: 0 },
      { id: 'LOC-R13', name: 'Kadapa', fcr: 1.41, farmers: 0, tanks: 0 },
      { id: 'LOC-R14', name: 'Proddatur', fcr: 1.42, farmers: 0, tanks: 0 },
      { id: 'LOC-R15', name: 'Pulivendula', fcr: 1.43, farmers: 0, tanks: 0 },
      { id: 'LOC-R16', name: 'Rayachoti', fcr: 1.44, farmers: 0, tanks: 0 },
      { id: 'LOC-R17', name: 'Madanapalle', fcr: 1.42, farmers: 0, tanks: 0 },
      { id: 'LOC-R18', name: 'Rajampet', fcr: 1.41, farmers: 0, tanks: 0 },
      { id: 'LOC-R19', name: 'Tirupati', fcr: 1.38, farmers: 2, tanks: 4 },
      { id: 'LOC-R20', name: 'Srikalahasti', fcr: 1.40, farmers: 0, tanks: 0 },
      { id: 'LOC-R21', name: 'Renigunta', fcr: 1.39, farmers: 0, tanks: 0 },
      { id: 'LOC-R22', name: 'Puttur', fcr: 1.42, farmers: 0, tanks: 0 },
      { id: 'LOC-R23', name: 'Chittoor', fcr: 1.43, farmers: 0, tanks: 0 },
      { id: 'LOC-R24', name: 'Palamaner', fcr: 1.44, farmers: 0, tanks: 0 },
      { id: 'LOC-R25', name: 'Kuppam', fcr: 1.45, farmers: 0, tanks: 0 }
    ]
  }
];

// Dedicated Incharges (1 Incharge per Locality)
export const adminIncharges = [
  { 
    id: 'EMP-INC-01', 
    name: 'K. V. Rajesh (Incharge - Nellore)', 
    shortName: 'K. V. Rajesh',
    role: 'Incharge - Nellore',
    regionId: 'REG-COASTAL', 
    region: 'Coastal Andhra', 
    locality: 'Nellore',
    phone: '+91 9876543211',
    email: 'rajesh.inc@royalsmarine.com',
    agents: 2, 
    farmers: 3, 
    tanks: 6, 
    compliance: 95, 
    status: 'ACTIVE' 
  },
  { 
    id: 'EMP-INC-02', 
    name: 'M. Srinivas (Incharge - Bhimavaram)', 
    shortName: 'M. Srinivas',
    role: 'Incharge - Bhimavaram',
    regionId: 'REG-COASTAL', 
    region: 'Coastal Andhra', 
    locality: 'Bhimavaram',
    phone: '+91 9876543212',
    email: 'srinivas.inc@royalsmarine.com',
    agents: 2, 
    farmers: 3, 
    tanks: 5, 
    compliance: 94, 
    status: 'ACTIVE' 
  },
  { 
    id: 'EMP-INC-03', 
    name: 'B. Subba Rao (Incharge - Kavali)', 
    shortName: 'B. Subba Rao',
    role: 'Incharge - Kavali',
    regionId: 'REG-COASTAL', 
    region: 'Coastal Andhra', 
    locality: 'Kavali',
    phone: '+91 9876543217',
    email: 'subbarao.inc@royalsmarine.com',
    agents: 1, 
    farmers: 2, 
    tanks: 4, 
    compliance: 92, 
    status: 'ACTIVE' 
  },
  { 
    id: 'EMP-INC-04', 
    name: 'T. Prasad (Incharge - Kakinada)', 
    shortName: 'T. Prasad',
    role: 'Incharge - Kakinada',
    regionId: 'REG-COASTAL', 
    region: 'Coastal Andhra', 
    locality: 'Kakinada',
    phone: '+91 9876543218',
    email: 'prasad.inc@royalsmarine.com',
    agents: 1, 
    farmers: 2, 
    tanks: 3, 
    compliance: 93, 
    status: 'ACTIVE' 
  },
  { 
    id: 'EMP-INC-05', 
    name: 'A. V. Ramana (Incharge - Visakhapatnam)', 
    shortName: 'A. V. Ramana',
    role: 'Incharge - Visakhapatnam',
    regionId: 'REG-NORTH', 
    region: 'North Andhra (Uttarandhra)', 
    locality: 'Visakhapatnam',
    phone: '+91 9876543221',
    email: 'ramana.inc@royalsmarine.com',
    agents: 1, 
    farmers: 2, 
    tanks: 4, 
    compliance: 96, 
    status: 'ACTIVE' 
  },
  { 
    id: 'EMP-INC-06', 
    name: 'C. Reddappa (Incharge - Tirupati)', 
    shortName: 'C. Reddappa',
    role: 'Incharge - Tirupati',
    regionId: 'REG-RAYALASEEMA', 
    region: 'Rayalaseema', 
    locality: 'Tirupati',
    phone: '+91 9876543222',
    email: 'reddappa.inc@royalsmarine.com',
    agents: 1, 
    farmers: 2, 
    tanks: 4, 
    compliance: 93, 
    status: 'ACTIVE' 
  }
];

// Field Agents Assigned to Particular Areas under Incharges
export const adminAgents = [
  { 
    id: 'EMP-AGT-01', 
    name: 'P. Raju (Field Agent - Mypadu)', 
    shortName: 'P. Raju',
    role: 'Field Agent - Mypadu',
    inchargeId: 'EMP-INC-01', 
    incharge: 'K. V. Rajesh (Incharge - Nellore)', 
    regionId: 'REG-COASTAL',
    region: 'Coastal Andhra', 
    locality: 'Nellore', 
    assignedArea: 'Mypadu Coastal Area',
    phone: '+91 9876543213',
    email: 'raju.agt@royalsmarine.com',
    farmers: 3, 
    tanks: 6, 
    siteVisits: 8, 
    tests: 62, 
    compliance: 96.0, 
    status: 'ACTIVE' 
  },
  { 
    id: 'EMP-AGT-04', 
    name: 'K. Ramesh (Field Agent - Indukurpet)', 
    shortName: 'K. Ramesh',
    role: 'Field Agent - Indukurpet',
    inchargeId: 'EMP-INC-01', 
    incharge: 'K. V. Rajesh (Incharge - Nellore)', 
    regionId: 'REG-COASTAL',
    region: 'Coastal Andhra', 
    locality: 'Nellore', 
    assignedArea: 'Indukurpet Aqua Belt',
    phone: '+91 9876543219',
    email: 'ramesh.agt@royalsmarine.com',
    farmers: 2, 
    tanks: 4, 
    siteVisits: 6, 
    tests: 48, 
    compliance: 94.0, 
    status: 'ACTIVE' 
  },
  { 
    id: 'EMP-AGT-05', 
    name: 'N. Harish (Field Agent - Allur)', 
    shortName: 'N. Harish',
    role: 'Field Agent - Allur',
    inchargeId: 'EMP-INC-03', 
    incharge: 'B. Subba Rao (Incharge - Kavali)', 
    regionId: 'REG-COASTAL',
    region: 'Coastal Andhra', 
    locality: 'Kavali', 
    assignedArea: 'Allur Estuary Area',
    phone: '+91 9876543220',
    email: 'harish.agt@royalsmarine.com',
    farmers: 2, 
    tanks: 4, 
    siteVisits: 5, 
    tests: 38, 
    compliance: 92.5, 
    status: 'ACTIVE' 
  },
  { 
    id: 'EMP-AGT-02', 
    name: 'V. Kumar (Field Agent - Akividu)', 
    shortName: 'V. Kumar',
    role: 'Field Agent - Akividu',
    inchargeId: 'EMP-INC-02', 
    incharge: 'M. Srinivas (Incharge - Bhimavaram)', 
    regionId: 'REG-COASTAL',
    region: 'Coastal Andhra', 
    locality: 'Bhimavaram', 
    assignedArea: 'Akividu West Belt',
    phone: '+91 9876543214',
    email: 'kumar.agt@royalsmarine.com',
    farmers: 2, 
    tanks: 3, 
    siteVisits: 4, 
    tests: 45, 
    compliance: 91.5, 
    status: 'ACTIVE' 
  },
  { 
    id: 'EMP-AGT-03', 
    name: 'Ch. Suresh (Field Agent - Coringa)', 
    shortName: 'Ch. Suresh',
    role: 'Field Agent - Coringa',
    inchargeId: 'EMP-INC-04', 
    incharge: 'T. Prasad (Incharge - Kakinada)', 
    regionId: 'REG-COASTAL',
    region: 'Coastal Andhra', 
    locality: 'Kakinada', 
    assignedArea: 'Coringa Creek Area',
    phone: '+91 9876543215',
    email: 'suresh.agt@royalsmarine.com',
    farmers: 1, 
    tanks: 2, 
    siteVisits: 3, 
    tests: 34, 
    compliance: 90.0, 
    status: 'ACTIVE' 
  },
  { 
    id: 'EMP-AGT-06', 
    name: 'G. Naidu (Field Agent - Bheemili)', 
    shortName: 'G. Naidu',
    role: 'Field Agent - Bheemili',
    inchargeId: 'EMP-INC-05', 
    incharge: 'A. V. Ramana (Incharge - Visakhapatnam)', 
    regionId: 'REG-NORTH',
    region: 'North Andhra (Uttarandhra)', 
    locality: 'Visakhapatnam', 
    assignedArea: 'Bheemili Coastal Estuary',
    phone: '+91 9876543223',
    email: 'naidu.agt@royalsmarine.com',
    farmers: 2, 
    tanks: 4, 
    siteVisits: 7, 
    tests: 50, 
    compliance: 95.0, 
    status: 'ACTIVE' 
  },
  { 
    id: 'EMP-AGT-07', 
    name: 'S. Prasad (Field Agent - Renigunta)', 
    shortName: 'S. Prasad',
    role: 'Field Agent - Renigunta',
    inchargeId: 'EMP-INC-06', 
    incharge: 'C. Reddappa (Incharge - Tirupati)', 
    regionId: 'REG-RAYALASEEMA',
    region: 'Rayalaseema', 
    locality: 'Tirupati', 
    assignedArea: 'Renigunta Aqua Reservoir Zone',
    phone: '+91 9876543224',
    email: 'prasad.agt@royalsmarine.com',
    farmers: 2, 
    tanks: 4, 
    siteVisits: 6, 
    tests: 42, 
    compliance: 93.0, 
    status: 'ACTIVE' 
  }
];

export const adminFarmers = [
  { 
    id: 'FAR-003', 
    name: 'V. Subba Rao', 
    agentId: 'EMP-AGT-01', 
    agent: 'P. Raju (Field Agent - Mypadu)', 
    incharge: 'K. V. Rajesh (Incharge - Nellore)', 
    region: 'Coastal Andhra', 
    locality: 'Nellore', 
    assignedArea: 'Mypadu Coastal Area',
    phone: '+91 9440334455', 
    village: 'Mypadu Coastal', 
    acres: '8.0 Acres', 
    totalAcres: 8.0,
    waterSource: 'Creek / Estuary',
    tanks: 3, 
    tankBreakdown: [
      { id: 'T-003-1', name: 'Tank 1', acres: 3.0, doc: 70, abw: 26.5, fcr: 1.35, biomass: 4200, waterSource: 'Creek / Estuary', salinity: 18, soilType: 'Clay Loam', hatcheryName: 'Apex Marine Hatcheries (Nellore)', brooder: 'Kona Bay', seedDate: '2026-05-15', seedStockingLak: 2.5, feed: 8944, feedType: 'Premium Pellets' },
      { id: 'T-003-2', name: 'Tank 2', acres: 2.5, doc: 55, abw: 18.0, fcr: 1.30, biomass: 2800, waterSource: 'Sea / Coastal Canal', salinity: 20, soilType: 'Clay', hatcheryName: 'BMR Marine SPF Hatchery', brooder: 'Syaqua', seedDate: '2026-05-25', seedStockingLak: 2.0, feed: 4680, feedType: 'Functional Feed' },
      { id: 'T-003-3', name: 'Tank 3', acres: 2.5, doc: 40, abw: 12.0, fcr: 1.25, biomass: 1600, waterSource: 'Creek / Estuary', salinity: 16, soilType: 'Loam', hatcheryName: 'Apex Marine Hatcheries (Nellore)', brooder: 'Kona Bay', seedDate: '2026-06-05', seedStockingLak: 2.0, feed: 3000, feedType: 'Premium Pellets' }
    ],
    status: 'Active' 
  },
  { 
    id: 'FAR-349', 
    name: 'Imported Test Farmer 2', 
    agentId: 'EMP-AGT-02', 
    agent: 'V. Kumar (Field Agent - Akividu)', 
    incharge: 'M. Srinivas (Incharge - Bhimavaram)', 
    region: 'Coastal Andhra', 
    locality: 'Bhimavaram', 
    assignedArea: 'Akividu West Belt',
    phone: '9876543298', 
    village: 'Akividu East', 
    acres: '4.5 Acres', 
    totalAcres: 4.5,
    waterSource: 'River / Freshwater Canal',
    tanks: 1, 
    tankBreakdown: [
      { id: 'T-349-1', name: 'Tank 1', acres: 4.5, doc: 45, abw: 12.5, fcr: 1.22, biomass: 1500, waterSource: 'River / Freshwater Canal', salinity: 12, soilType: 'Loam', hatcheryName: 'Apex Marine Hatcheries', brooder: 'Kona Bay', seedDate: '2026-05-20', seedStockingLak: 3.5, feed: 5338, feedType: 'Premium Pellets' }
    ],
    status: 'Active' 
  },
  { 
    id: 'FAR-581', 
    name: 'Imported Test Farmer 1', 
    agentId: 'EMP-AGT-02', 
    agent: 'V. Kumar (Field Agent - Akividu)', 
    incharge: 'M. Srinivas (Incharge - Bhimavaram)', 
    region: 'Coastal Andhra', 
    locality: 'Bhimavaram', 
    assignedArea: 'Akividu West Belt',
    phone: '9876543299', 
    village: 'Undi Rural', 
    acres: '6.0 Acres', 
    totalAcres: 6.0,
    waterSource: 'Creek / Estuary',
    tanks: 1, 
    tankBreakdown: [
      { id: 'T-581-1', name: 'Tank 1', acres: 6.0, doc: 52, abw: 15.0, fcr: 1.25, biomass: 2100, waterSource: 'Creek / Estuary', salinity: 15, soilType: 'Clay Loam', hatcheryName: 'BMR Marine SPF Hatchery', brooder: 'Syaqua', seedDate: '2026-05-18', seedStockingLak: 4.5, feed: 8438, feedType: 'Functional Feed' }
    ],
    status: 'Active' 
  },
  { 
    id: 'FAR-005', 
    name: 'B. Nageswara Rao', 
    agentId: 'EMP-AGT-05', 
    agent: 'N. Harish (Field Agent - Allur)', 
    incharge: 'B. Subba Rao (Incharge - Kavali)', 
    region: 'Coastal Andhra', 
    locality: 'Kavali', 
    assignedArea: 'Allur Estuary Area',
    phone: '+91 9440556677', 
    village: 'Allur Village', 
    acres: '5.0 Acres', 
    totalAcres: 5.0,
    waterSource: 'Sea / Coastal Canal',
    tanks: 1, 
    tankBreakdown: [
      { id: 'T-005-1', name: 'Tank 1', acres: 5.0, doc: 65, abw: 22.0, fcr: 1.40, biomass: 3200, waterSource: 'Sea / Coastal Canal', salinity: 22, soilType: 'Clay Loam', hatcheryName: 'Apex Marine Hatcheries', brooder: 'Kona Bay', seedDate: '2026-05-10', seedStockingLak: 4.0, feed: 12320, feedType: 'Premium Pellets' }
    ],
    status: 'Active' 
  },
  { 
    id: 'FAR-004', 
    name: 'Ch. Satyanarayana', 
    agentId: 'EMP-AGT-03', 
    agent: 'Ch. Suresh (Field Agent - Coringa)', 
    incharge: 'T. Prasad (Incharge - Kakinada)', 
    region: 'Coastal Andhra', 
    locality: 'Kakinada', 
    assignedArea: 'Coringa Creek Area',
    phone: '+91 9440445566', 
    village: 'Coringa Creek', 
    acres: '3.5 Acres', 
    totalAcres: 3.5,
    waterSource: 'Creek / Estuary',
    tanks: 1, 
    tankBreakdown: [
      { id: 'T-004-1', name: 'Tank 1', acres: 3.5, doc: 48, abw: 14.2, fcr: 1.35, biomass: 1800, waterSource: 'Creek / Estuary', salinity: 14, soilType: 'Loam', hatcheryName: 'Apex Marine Hatcheries', brooder: 'Kona Bay', seedDate: '2026-05-22', seedStockingLak: 2.8, feed: 5368, feedType: 'Premium Pellets' }
    ],
    status: 'Active' 
  },
  { 
    id: 'FAR-002', 
    name: 'M. Srinivas', 
    agentId: 'EMP-AGT-01', 
    agent: 'P. Raju (Field Agent - Mypadu)', 
    incharge: 'K. V. Rajesh (Incharge - Nellore)', 
    region: 'Coastal Andhra', 
    locality: 'Nellore', 
    assignedArea: 'Mypadu Coastal Area',
    phone: '+91 9440223344', 
    village: 'Indukurpet Coastal', 
    acres: '6.0 Acres', 
    totalAcres: 6.0,
    waterSource: 'Borewell / Ground Water',
    tanks: 2, 
    tankBreakdown: [
      { id: 'T-002-1', name: 'Tank 1', acres: 3.0, doc: 60, abw: 20.5, fcr: 1.38, biomass: 3100, waterSource: 'Borewell / Ground Water', salinity: 10, soilType: 'Sandy Loam', hatcheryName: 'Apex Marine Hatcheries', brooder: 'Kona Bay', seedDate: '2026-05-12', seedStockingLak: 2.4, feed: 6790, feedType: 'Premium Pellets' },
      { id: 'T-002-2', name: 'Tank 2', acres: 3.0, doc: 45, abw: 13.5, fcr: 1.28, biomass: 1900, waterSource: 'Borewell / Ground Water', salinity: 10, soilType: 'Sandy Loam', hatcheryName: 'Apex Marine Hatcheries', brooder: 'Kona Bay', seedDate: '2026-05-28', seedStockingLak: 2.4, feed: 4147, feedType: 'Functional Feed' }
    ],
    status: 'Active' 
  }
];

export const adminTanks = [
  { id: 'T001', name: 'Tank 1', farmerId: 'FAR-349', farmer: 'Imported Test Farmer 2', agent: 'V. Kumar', incharge: 'M. Srinivas', region: 'Coastal Andhra', locality: 'Bhimavaram', currentCycle: 'Cycle 1 (2026)', abw: 12.5, biomass: 1500, feed: 1800, fcr: 1.22, compliance: 100, lastTest: '22 Aug 2026', nextDue: '29 Aug 2026' },
  { id: 'T002', name: 'Tank 1', farmerId: 'FAR-581', farmer: 'Imported Test Farmer 1', agent: 'V. Kumar', incharge: 'M. Srinivas', region: 'Coastal Andhra', locality: 'Bhimavaram', currentCycle: 'Cycle 1 (2026)', abw: 15.0, biomass: 2100, feed: 2625, fcr: 1.25, compliance: 85, lastTest: '22 Aug 2026', nextDue: '29 Aug 2026' },
  { id: 'T003', name: 'Tank 1', farmerId: 'FAR-005', farmer: 'B. Nageswara Rao', agent: 'N. Harish', incharge: 'B. Subba Rao', region: 'Coastal Andhra', locality: 'Kavali', currentCycle: 'Cycle 1 (2026)', abw: 22.0, biomass: 3200, feed: 4480, fcr: 1.40, compliance: 90, lastTest: '21 Aug 2026', nextDue: '28 Aug 2026' },
  { id: 'T004', name: 'Tank 1', farmerId: 'FAR-004', farmer: 'Ch. Satyanarayana', agent: 'Ch. Suresh', incharge: 'T. Prasad', region: 'Coastal Andhra', locality: 'Kakinada', currentCycle: 'Cycle 1 (2026)', abw: 14.2, biomass: 1800, feed: 2430, fcr: 1.35, compliance: 92, lastTest: '20 Aug 2026', nextDue: '27 Aug 2026' },
  { id: 'T005', name: 'Tank 1', farmerId: 'FAR-003', farmer: 'V. Subba Rao', agent: 'P. Raju', incharge: 'K. V. Rajesh', region: 'Coastal Andhra', locality: 'Nellore', currentCycle: 'Cycle 1 (2026)', abw: 26.5, biomass: 4200, feed: 5670, fcr: 1.35, compliance: 100, lastTest: '23 Aug 2026', nextDue: '30 Aug 2026' }
];

export const adminLocalityFcrData = [
  { locality: 'Nellore', fcr: 1.35 },
  { locality: 'Kavali', fcr: 1.45 },
  { locality: 'Bhimavaram', fcr: 1.36 },
  { locality: 'Kakinada', fcr: 1.42 },
  { locality: 'Visakhapatnam', fcr: 1.35 },
  { locality: 'Tirupati', fcr: 1.38 }
];

export const adminActivities = [
  { id: 1, action: 'Incharge K. V. Rajesh approved Water Analysis', detail: 'FAR-003 - Tank 1', time: '10 mins ago', module: 'Verifications', user: 'K. V. Rajesh', role: 'Incharge', region: 'Coastal Andhra' },
  { id: 2, action: 'Agent P. Raju submitted Feed Sampling', detail: 'FAR-003 - Tank 2', time: '25 mins ago', module: 'Field Data', user: 'P. Raju', role: 'Agent', region: 'Coastal Andhra' },
  { id: 3, action: 'Incharge M. Srinivas allocated field agent', detail: 'V. Kumar -> Akividu West Belt', time: '45 mins ago', module: 'Allocations', user: 'M. Srinivas', role: 'Incharge', region: 'Coastal Andhra' },
  { id: 4, action: 'Admin viewed Region', detail: 'North Andhra (Uttarandhra)', time: '1 hour ago', module: 'Monitoring', user: 'Admin', role: 'Admin', region: 'Organization' }
];

export const adminTrendData = [
  { name: '16 Aug', tests: 350 },
  { name: '17 Aug', tests: 620 },
  { name: '18 Aug', tests: 650 },
  { name: '19 Aug', tests: 520 },
  { name: '20 Aug', tests: 780 },
  { name: '21 Aug', tests: 620 },
  { name: '22 Aug', tests: 770 }
];

export const adminWeeklyCompliance = {
  completed: 72,
  due: 13,
  overdue: 5,
  notDue: 10
};

export const adminVerifications = [
  { id: 'V001', region: 'Coastal Andhra', incharge: 'K. V. Rajesh', agent: 'P. Raju', farmer: 'V. Subba Rao', tank: 'Tank 1', testType: 'Water Analysis', submitted: '10 mins ago', status: 'Pending' },
  { id: 'V002', region: 'Coastal Andhra', incharge: 'B. Subba Rao', agent: 'N. Harish', farmer: 'B. Nageswara Rao', tank: 'Tank 1', testType: 'Feed Test', submitted: '25 mins ago', status: 'Approved' },
  { id: 'V003', region: 'Coastal Andhra', incharge: 'T. Prasad', agent: 'Ch. Suresh', farmer: 'Ch. Satyanarayana', tank: 'Tank 1', testType: 'Medication', submitted: '2 hours ago', status: 'Rejected' }
];

// Helper methods
export const getRegions = () => adminRegions;
export const getRegionById = (id) => adminRegions.find(r => r.id === id || r.code === id);

export const getIncharges = () => adminIncharges;
export const getInchargesByRegion = (regionId) => adminIncharges.filter(i => i.regionId === regionId);
export const getInchargeById = (id) => adminIncharges.find(i => i.id === id);

export const getAgents = () => adminAgents;
export const getAgentsByIncharge = (inchargeId) => adminAgents.filter(a => a.inchargeId === inchargeId);
export const getAgentById = (id) => adminAgents.find(a => a.id === id);

export const getFarmers = () => adminFarmers;
export const getFarmersByAgent = (agentId) => adminFarmers.filter(f => f.agentId === agentId);
export const getFarmersByIncharge = (inchargeId) => {
  const incharge = getInchargeById(inchargeId);
  const incName = incharge ? incharge.name.split(' ')[0] : '';
  const agents = getAgentsByIncharge(inchargeId);
  const agentIds = agents.map(a => a.id);
  return adminFarmers
    .filter(f => 
      f.inchargeId === inchargeId || 
      (incName && f.incharge?.includes(incName)) ||
      agentIds.includes(f.agentId)
    )
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
};
export const getFarmerById = (id) => adminFarmers.find(f => f.id === id);

export const getTanks = () => adminTanks;
export const getTanksByFarmer = (farmerId) => adminTanks.filter(t => t.farmerId === farmerId);
export const getTanksByIncharge = (inchargeId) => {
  const farmers = getFarmersByIncharge(inchargeId);
  const farmerIds = farmers.map(f => f.id);
  return adminTanks
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
export const getTankById = (id) => adminTanks.find(t => t.id === id);

export const getActivities = () => adminActivities;

// Dynamic FCR Calculations
export const calculateBiomass = (seedStockingLak, abw) => {
  if (!seedStockingLak || !abw) return 0;
  // biomass in kg = (seed count in lakhs * 100,000) * (abw in grams / 1,000) = seedStockingLak * abw * 100
  return seedStockingLak * abw * 100;
};

export const calculateFCR = (cumulativeFeed, biomass) => {
  if (!biomass || biomass <= 0 || !cumulativeFeed) return "0.00";
  return (cumulativeFeed / biomass).toFixed(2);
};
