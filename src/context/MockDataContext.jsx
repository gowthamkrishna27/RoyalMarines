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
  // Incharge Personal Farmers (Assigned by Admin directly to Incharge Ravi Kumar INC001)
  { id: 'F101', name: 'Bhaskar Rao', status: 'ACTIVE', agentId: null, inchargeId: 'INC001', assignedTo: 'Incharge', assignedBy: 'Admin', phone: '+91 9876543230', location: 'Bhimavaram Central', waterSource: 'Borewell', acres: 30 },
  { id: 'F102', name: 'Narasimha Murthy', status: 'ACTIVE', agentId: null, inchargeId: 'INC001', assignedTo: 'Incharge', assignedBy: 'Admin', phone: '+91 9876543231', location: 'Chinnamiram East', waterSource: 'Canal', acres: 22 },
  { id: 'F103', name: 'Koteswara Rao', status: 'ACTIVE', agentId: null, inchargeId: 'INC001', assignedTo: 'Incharge', assignedBy: 'Admin', phone: '+91 9876543232', location: 'Undi Rural', waterSource: 'Borewell', acres: 28 },
  { id: 'F104', name: 'Satyanarayana', status: 'ACTIVE', agentId: null, inchargeId: 'INC001', assignedTo: 'Incharge', assignedBy: 'Admin', phone: '+91 9876543233', location: 'Akuruvu Coast', waterSource: 'Seawater Intake', acres: 35 },
  { id: 'F105', name: 'Appala Raju', status: 'ACTIVE', agentId: null, inchargeId: 'INC001', assignedTo: 'Incharge', assignedBy: 'Admin', phone: '+91 9876543234', location: 'Narasapuram Creek', waterSource: 'Canal', acres: 25 },

  // Agent Assigned Farmers (Delegated to Field Technicians / Agents)
  { id: 'F001', name: 'Ashok', status: 'ACTIVE', agentId: 'agent002', inchargeId: 'INC001', assignedTo: 'Agent', assignedBy: 'Incharge', phone: '+91 9876543210', location: 'Bhimavaram', waterSource: 'Borewell', acres: 25 },
  { id: 'F002', name: 'Ravi', status: 'ACTIVE', agentId: 'agent001', inchargeId: 'INC001', assignedTo: 'Agent', assignedBy: 'Incharge', phone: '+91 9876543211', location: 'Chinnamiram', waterSource: 'Canal', acres: 20 },
  { id: 'F003', name: 'Kumar', status: 'ACTIVE', agentId: 'agent006', inchargeId: 'INC001', assignedTo: 'Agent', assignedBy: 'Incharge', phone: '+91 9876543212', location: 'Kalla', waterSource: 'Borewell', acres: 18 },
  { id: 'F004', name: 'Ramesh', status: 'ACTIVE', agentId: 'agent003', inchargeId: 'INC001', assignedTo: 'Agent', assignedBy: 'Incharge', phone: '+91 9876543213', location: 'Akuruvu', waterSource: 'Borewell', acres: 30 },
  { id: 'F005', name: 'Ganesh', status: 'ACTIVE', agentId: 'agent004', inchargeId: 'INC001', assignedTo: 'Agent', assignedBy: 'Incharge', phone: '+91 9876543214', location: 'Narasapuram', waterSource: 'Canal', acres: 15 },
  { id: 'F006', name: 'Siva', status: 'ACTIVE', agentId: 'agent001', inchargeId: 'INC001', assignedTo: 'Agent', assignedBy: 'Incharge', phone: '+91 9876543215', location: 'Chinnamiram', waterSource: 'Borewell', acres: 22 },
  { id: 'F007', name: 'Nagesh', status: 'ACTIVE', agentId: 'agent005', inchargeId: 'INC001', assignedTo: 'Agent', assignedBy: 'Incharge', phone: '+91 9876543216', location: 'Undi', waterSource: 'Canal', acres: 12 },
  { id: 'F008', name: 'Srinu', status: 'ACTIVE', agentId: 'agent002', inchargeId: 'INC001', assignedTo: 'Agent', assignedBy: 'Incharge', phone: '+91 9876543217', location: 'Bhimavaram', waterSource: 'Borewell', acres: 40 },
  { id: 'F009', name: 'Venkatesh', status: 'ACTIVE', agentId: 'agent004', inchargeId: 'INC001', assignedTo: 'Agent', assignedBy: 'Incharge', phone: '+91 9876543218', location: 'Narasapuram', waterSource: 'Borewell', acres: 18 },
  { id: 'F010', name: 'Krishna', status: 'ACTIVE', agentId: 'agent003', inchargeId: 'INC001', assignedTo: 'Agent', assignedBy: 'Incharge', phone: '+91 9876543219', location: 'Akuruvu', waterSource: 'Canal', acres: 28 },
  { id: 'F011', name: 'Ramu', status: 'ACTIVE', agentId: 'agent001', inchargeId: 'INC001', assignedTo: 'Agent', assignedBy: 'Incharge', phone: '+91 9876543220', location: 'Chinnamiram', waterSource: 'Canal', acres: 16 },
  { id: 'F012', name: 'Subba Rao', status: 'ACTIVE', agentId: 'agent001', inchargeId: 'INC001', assignedTo: 'Agent', assignedBy: 'Incharge', phone: '+91 9876543221', location: 'Chinnamiram', waterSource: 'Borewell', acres: 24 },
  { id: 'F013', name: 'Prasad', status: 'ACTIVE', agentId: 'agent001', inchargeId: 'INC001', assignedTo: 'Agent', assignedBy: 'Incharge', phone: '+91 9876543222', location: 'Chinnamiram', waterSource: 'Canal', acres: 18 },
  { id: 'F014', name: 'Venkateswara Rao', status: 'ACTIVE', agentId: 'agent001', inchargeId: 'INC001', assignedTo: 'Agent', assignedBy: 'Incharge', phone: '+91 9876543223', location: 'Chinnamiram', waterSource: 'River', acres: 32 }
];

const initialTanks = [
  // Incharge Personal Tanks (Under Incharge's direct supervision)
  { id: 'T101', name: 'Pond A1', farmerId: 'F101', agentId: null, inchargeId: 'INC001', assignedTo: 'Incharge', status: 'ACTIVE', testStatus: 'Completed', abw: '24.5g', biomass: '3200kg', fcr: '1.16', lastTest: '22 Aug 2026', nextTest: '29 Aug 2026', size: '15 Acres', doc: 72 },
  { id: 'T102', name: 'Pond A2', farmerId: 'F101', agentId: null, inchargeId: 'INC001', assignedTo: 'Incharge', status: 'ACTIVE', testStatus: 'Due', abw: '19.2g', biomass: '2550kg', fcr: '1.14', lastTest: '18 Aug 2026', nextTest: '25 Aug 2026', size: '15 Acres', doc: 58 },
  { id: 'T103', name: 'Pond B1', farmerId: 'F102', agentId: null, inchargeId: 'INC001', assignedTo: 'Incharge', status: 'ACTIVE', testStatus: 'Due', abw: '21.8g', biomass: '2800kg', fcr: '1.18', lastTest: '19 Aug 2026', nextTest: '26 Aug 2026', size: '11 Acres', doc: 65 },
  { id: 'T104', name: 'Pond B2', farmerId: 'F102', agentId: null, inchargeId: 'INC001', assignedTo: 'Incharge', status: 'ACTIVE', testStatus: 'Completed', abw: '16.0g', biomass: '2100kg', fcr: '1.12', lastTest: '23 Aug 2026', nextTest: '30 Aug 2026', size: '11 Acres', doc: 48 },
  { id: 'T105', name: 'Pond C1', farmerId: 'F103', agentId: null, inchargeId: 'INC001', assignedTo: 'Incharge', status: 'ACTIVE', testStatus: 'Overdue', abw: '27.5g', biomass: '3600kg', fcr: '1.20', lastTest: '10 Aug 2026', nextTest: '17 Aug 2026', size: '14 Acres', doc: 80 },
  { id: 'T106', name: 'Pond C2', farmerId: 'F103', agentId: null, inchargeId: 'INC001', assignedTo: 'Incharge', status: 'ACTIVE', testStatus: 'Due', abw: '20.0g', biomass: '2650kg', fcr: '1.15', lastTest: '17 Aug 2026', nextTest: '24 Aug 2026', size: '14 Acres', doc: 60 },
  { id: 'T107', name: 'Pond D1', farmerId: 'F104', agentId: null, inchargeId: 'INC001', assignedTo: 'Incharge', status: 'ACTIVE', testStatus: 'Due', abw: '17.5g', biomass: '2300kg', fcr: '1.14', lastTest: '19 Aug 2026', nextTest: '26 Aug 2026', size: '18 Acres', doc: 52 },
  { id: 'T108', name: 'Pond D2', farmerId: 'F104', agentId: null, inchargeId: 'INC001', assignedTo: 'Incharge', status: 'Harvested', testStatus: 'Completed', abw: '33.5g', biomass: '5200kg', fcr: '1.18', lastTest: '24 Aug 2026', nextTest: 'Cycle Closed', size: '17 Acres', doc: 115 },
  { id: 'T109', name: 'Pond E1', farmerId: 'F105', agentId: null, inchargeId: 'INC001', assignedTo: 'Incharge', status: 'ACTIVE', testStatus: 'Due', abw: '21.2g', biomass: '2750kg', fcr: '1.17', lastTest: '20 Aug 2026', nextTest: '27 Aug 2026', size: '25 Acres', doc: 64 },

  // Agent Assigned Tanks (Under assigned Field Technicians)
  { id: 'T001', name: 'Tank 1', farmerId: 'F001', agentId: 'agent002', inchargeId: 'INC001', status: 'ACTIVE', testStatus: 'Overdue', abw: '12g', biomass: '800kg', fcr: '1.2', lastTest: '10 Aug 2026', nextTest: '17 Aug 2026', size: '12.5 Acres', doc: 45 },
  { id: 'T002', name: 'Tank 2', farmerId: 'F001', agentId: 'agent002', inchargeId: 'INC001', status: 'ACTIVE', testStatus: 'Due', abw: '14g', biomass: '950kg', fcr: '1.1', lastTest: '15 Aug 2026', nextTest: '22 Aug 2026', size: '12.5 Acres', doc: 52 },
  { id: 'T003', name: 'Tank 1', farmerId: 'F002', agentId: 'agent001', inchargeId: 'INC001', status: 'ACTIVE', testStatus: 'Completed', abw: '10g', biomass: '600kg', fcr: '1.3', lastTest: '21 Aug 2026', nextTest: '28 Aug 2026', size: '20 Acres', doc: 38 },
  { id: 'T004', name: 'Tank 1', farmerId: 'F004', agentId: 'agent003', inchargeId: 'INC001', status: 'ACTIVE', testStatus: 'Due', abw: '20g', biomass: '1500kg', fcr: '1.0', lastTest: '22 Aug 2026', nextTest: '29 Aug 2026', size: '30 Acres', doc: 68 },
  { id: 'T007', name: 'Tank 1', farmerId: 'F005', agentId: 'agent004', inchargeId: 'INC001', status: 'Harvested', testStatus: 'Completed', abw: '31.2g', biomass: '4850kg', fcr: '1.24', lastTest: '15 Aug 2026', nextTest: 'Cycle Closed', size: '15 Acres', doc: 110 },
  { id: 'T008', name: 'Tank 1', farmerId: 'F006', agentId: 'agent001', inchargeId: 'INC001', status: 'ACTIVE', testStatus: 'Due', abw: '18g', biomass: '1200kg', fcr: '1.15', lastTest: '20 Aug 2026', nextTest: '27 Aug 2026', size: '22 Acres', doc: 59 },
  { id: 'T009', name: 'Tank 1', farmerId: 'F007', agentId: 'agent005', inchargeId: 'INC001', status: 'ACTIVE', testStatus: 'Overdue', abw: '9g', biomass: '400kg', fcr: '1.4', lastTest: '08 Aug 2026', nextTest: '15 Aug 2026', size: '12 Acres', doc: 34 },
  { id: 'T010', name: 'Tank 1', farmerId: 'F008', agentId: 'agent002', inchargeId: 'INC001', status: 'ACTIVE', testStatus: 'Due', abw: '16g', biomass: '2000kg', fcr: '1.2', lastTest: '19 Aug 2026', nextTest: '26 Aug 2026', size: '40 Acres', doc: 55 },
  { id: 'T011', name: 'Tank 1', farmerId: 'F009', agentId: 'agent004', inchargeId: 'INC001', status: 'ACTIVE', testStatus: 'Due', abw: '13g', biomass: '900kg', fcr: '1.1', lastTest: '21 Aug 2026', nextTest: '28 Aug 2026', size: '18 Acres', doc: 48 },
  { id: 'T012', name: 'Tank 1', farmerId: 'F010', agentId: 'agent003', inchargeId: 'INC001', status: 'ACTIVE', testStatus: 'Overdue', abw: '21g', biomass: '1600kg', fcr: '1.35', lastTest: '11 Aug 2026', nextTest: '18 Aug 2026', size: '28 Acres', doc: 70 },
  { id: 'T013', name: 'Tank 1', farmerId: 'F011', agentId: 'agent001', inchargeId: 'INC001', status: 'ACTIVE', testStatus: 'Completed', abw: '15g', biomass: '1100kg', fcr: '1.12', lastTest: '24 Aug 2026', nextTest: '31 Aug 2026', size: '16 Acres', doc: 51 },
  { id: 'T014', name: 'Tank 1', farmerId: 'F012', agentId: 'agent001', inchargeId: 'INC001', status: 'ACTIVE', testStatus: 'Due', abw: '17g', biomass: '1350kg', fcr: '1.18', lastTest: '20 Aug 2026', nextTest: '27 Aug 2026', size: '24 Acres', doc: 56 },
  { id: 'T015', name: 'Tank 1', farmerId: 'F013', agentId: 'agent001', inchargeId: 'INC001', status: 'ACTIVE', testStatus: 'Overdue', abw: '11g', biomass: '750kg', fcr: '1.22', lastTest: '12 Aug 2026', nextTest: '19 Aug 2026', size: '18 Acres', doc: 39 },
  { id: 'T016', name: 'Tank 1', farmerId: 'F014', agentId: 'agent001', inchargeId: 'INC001', status: 'Harvested', testStatus: 'Completed', abw: '32.0g', biomass: '5000kg', fcr: '1.08', lastTest: '25 Aug 2026', nextTest: 'Cycle Closed', size: '32 Acres', doc: 112 }
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
    id: 'SUB014',
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
    id: 'SUB015',
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
    id: 'SUB016',
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
    activities: [
      { id: 1, time: '26 Aug 10:00 AM', action: 'Completed Water Test', detail: 'Completed water test for Tank 1 (Ravi)' },
      { id: 2, time: '25 Aug 04:30 PM', action: 'Feed Test Submitted', detail: 'Feed test submitted for Tank 1 (Siva)' }
    ]
  };

  if (typeof window === 'undefined') return fallbackDb;

  ['aqua_feed_mock_database_v7', 'aqua_feed_mock_database_v8', 'aqua_feed_mock_database_v9'].forEach(k => {
    try { localStorage.removeItem(k); } catch (e) { }
  });

  try {
    const savedData = localStorage.getItem('aqua_feed_mock_database_v10');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (parsed && Array.isArray(parsed.tanks) && parsed.tanks.length > 0) {
        parsed.tanks = normalizeTanks(parsed.tanks);
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error parsing storage:', e);
  }

  try {
    localStorage.setItem('aqua_feed_mock_database_v10', JSON.stringify(fallbackDb));
  } catch (e) { }
  return fallbackDb;
};

export const MockDataProvider = ({ children }) => {
  const [db, setDb] = useState(getInitialDb);
  const [toastMessage, setToastMessage] = useState('');

  // Save to LocalStorage whenever DB changes
  useEffect(() => {
    if (db) {
      try {
        localStorage.setItem('aqua_feed_mock_database_v10', JSON.stringify(db));
      } catch (e) { }
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
    showToast(`Farmer assigned to Incharge!`);
  };

  const assignTankToIncharge = (tankId, inchargeId) => {
    setDb(prev => ({
      ...prev,
      tanks: prev.tanks.map(t => t.id === tankId ? { ...t, inchargeId } : t)
    }));
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
      const newTanks = prev.tanks.map(t => {
        if (t.id === submissionData.tankId) {
          const isFinal = submissionData.harvest && (submissionData.harvest.type === 'Final' || submissionData.harvest.harvestType === 'Final Harvest');
          return {
            ...t,
            testStatus: 'Completed',
            ...(isFinal ? { status: 'Harvested', finalHarvestCompleted: true } : {})
          };
        }
        return t;
      });
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

      let startTankNum = prev.tanks.length > 0
        ? Math.max(...prev.tanks.map(t => parseInt(t.id.replace('T', '')) || 0)) + 1
        : 1;

      const newTanks = tanksData.map((tankData, index) => {
        const tankNum = startTankNum + index;
        return {
          id: `T${tankNum.toString().padStart(3, '0')}`,
          name: `Tank ${index + 1}`,
          farmerId: newFarmerId,
          agentId: agentId || farmerData.agentId || null,
          inchargeId: farmerData.inchargeId || (agentId ? (prev.agents.find(a => a.id === agentId)?.inchargeId || 'INC001') : 'INC001'),
          status: 'ACTIVE',
          testStatus: 'Due',
          abw: '12g',
          biomass: '800kg',
          fcr: '1.2',
          ...tankData,
          lastTest: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          nextTest: 'TBD'
        };
      });

      const newFarmer = {
        id: newFarmerId,
        name: farmerData.name,
        status: 'ACTIVE',
        agentId: agentId || farmerData.agentId || null,
        inchargeId: farmerData.inchargeId || (agentId ? (prev.agents.find(a => a.id === agentId)?.inchargeId || 'INC001') : 'INC001'),
        assignedBy: farmerData.assignedBy || (agentId ? 'Agent' : 'Incharge'),
        phone: farmerData.phone,
        location: farmerData.location || `${farmerData.village}, ${farmerData.area}`,
        acres: farmerData.acres,
        extent: farmerData.extent || farmerData.acres,
        waterSource: farmerData.waterSource,
        gps: farmerData.gps
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
