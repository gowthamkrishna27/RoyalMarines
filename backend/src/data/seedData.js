/**
 * Seed data for Royals Marine Food Aquafeed Management System.
 * Matches domain models used across Agent, ASM/Incharge, and Admin portals.
 */

export const initialRegions = [
  { id: 'REG001', name: 'Bhimavaram', activePonds: 18, totalYield: '42.5 Tons', avgFCR: 1.15 },
  { id: 'REG002', name: 'Kakinada', activePonds: 12, totalYield: '28.0 Tons', avgFCR: 1.18 },
  { id: 'REG003', name: 'Narasapuram', activePonds: 15, totalYield: '36.2 Tons', avgFCR: 1.14 },
];

export const initialIncharges = [
  { id: 'INC001', name: 'Ravi Kumar', regionId: 'REG001', email: 'incharge@example.com', phone: '9876543210' },
  { id: 'INC002', name: 'Srinivasa Rao', regionId: 'REG002', email: 'srinivas@example.com', phone: '9876543211' },
];

export const initialAgents = [
  { id: 'agent001', name: 'Ramesh', phone: '9000000001', inchargeId: 'INC001', status: 'ACTIVE', locality: 'Chinnamiram', activePonds: 6 },
  { id: 'agent002', name: 'Suresh', phone: '9000000002', inchargeId: 'INC001', status: 'ACTIVE', locality: 'Bhimavaram', activePonds: 5 },
  { id: 'agent003', name: 'Mahesh', phone: '9000000003', inchargeId: 'INC001', status: 'ACTIVE', locality: 'Akuruvu', activePonds: 4 },
  { id: 'agent004', name: 'Ganesh', phone: '9000000004', inchargeId: 'INC001', status: 'ACTIVE', locality: 'Narasapuram', activePonds: 4 },
  { id: 'agent005', name: 'Nagesh', phone: '9000000005', inchargeId: 'INC001', status: 'ACTIVE', locality: 'Undi', activePonds: 3 },
  { id: 'agent006', name: 'Kumar', phone: '9000000006', inchargeId: 'INC001', status: 'ACTIVE', locality: 'Kalla', activePonds: 3 },
];

export const initialFarmers = [];
export const initialTanks = [];
export const initialSubmissions = [];
export const initialHarvests = [];

export const authUsers = [
  { id: 'ADM001', name: 'Executive Administrator', role: 'ADMIN', username: 'ADM001', phone: '9999999999', password: 'admin123', email: 'admin@royalsmarine.com' },
  { id: 'INC001', name: 'Ravi Kumar', role: 'ASM', username: 'INC001', phone: '9876543210', password: 'incharge123', email: 'incharge@royalsmarine.com', region: 'Bhimavaram' },
  { id: 'agent001', name: 'Ramesh', role: 'AGENT', username: 'agent001', phone: '9000000001', password: 'agent123', locality: 'Chinnamiram' },
  { id: 'agent002', name: 'Suresh', role: 'AGENT', username: 'agent002', phone: '9000000002', password: 'agent123', locality: 'Bhimavaram' },
];
