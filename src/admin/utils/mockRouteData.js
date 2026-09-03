// src/admin/utils/mockRouteData.js

export const getMockRouteData = (date, employeeId) => {
  // Base coordinates near Bhimavaram, AP (Hub of Aquaculture)
  const baseLat = 16.5449;
  const baseLng = 81.5212;

  // Generate a plausible day route
  const route = [
    {
      id: 1,
      time: '09:00 AM',
      type: 'LOGIN',
      lat: baseLat,
      lng: baseLng,
      locationName: 'Regional Office, Bhimavaram',
      duration: '0 mins',
      battery: 100,
      speed: 0,
      purpose: 'Start of Day'
    },
    {
      id: 2,
      time: '09:18 AM',
      type: 'MOVING',
      lat: baseLat + 0.015,
      lng: baseLng + 0.020,
      locationName: 'En route to Undi Road',
      duration: '18 mins',
      battery: 96,
      speed: 45, // km/h
      purpose: 'Travelling'
    },
    {
      id: 3,
      time: '09:42 AM',
      type: 'TANK_VISIT',
      lat: baseLat + 0.040,
      lng: baseLng + 0.035,
      locationName: 'Tank-12 (Ashok Aqua)',
      duration: '45 mins',
      battery: 92,
      speed: 0,
      purpose: 'Water Quality Testing & Feed Adjustment',
      tankId: 'T-12',
      farmer: 'Ashok'
    },
    {
      id: 4,
      time: '10:30 AM',
      type: 'FARMER_VISIT',
      lat: baseLat + 0.042,
      lng: baseLng + 0.040,
      locationName: 'Ashok Residence',
      duration: '30 mins',
      battery: 88,
      speed: 0,
      purpose: 'Discussing Feed Usage and Yield'
    },
    {
      id: 5,
      time: '11:05 AM',
      type: 'MOVING',
      lat: baseLat + 0.025,
      lng: baseLng + 0.060,
      locationName: 'En route to Akividu',
      duration: '15 mins',
      battery: 85,
      speed: 55,
      purpose: 'Travelling'
    },
    {
      id: 6,
      time: '11:20 AM',
      type: 'TANK_VISIT',
      lat: baseLat + 0.010,
      lng: baseLng + 0.080,
      locationName: 'Tank-18 (Ravi Ponds)',
      duration: '50 mins',
      battery: 79,
      speed: 0,
      purpose: 'Disease Observation',
      tankId: 'T-18',
      farmer: 'Ravi'
    },
    {
      id: 7,
      time: '12:30 PM',
      type: 'LONG_STOP',
      lat: baseLat + 0.012,
      lng: baseLng + 0.082,
      locationName: 'Akividu Center',
      duration: '45 mins',
      battery: 75,
      speed: 0,
      purpose: 'Lunch Break'
    },
    {
      id: 8,
      time: '01:25 PM',
      type: 'MOVING',
      lat: baseLat - 0.010,
      lng: baseLng + 0.050,
      locationName: 'State Highway 42',
      duration: '20 mins',
      battery: 70,
      speed: 60,
      purpose: 'Travelling'
    },
    {
      id: 9,
      time: '02:10 PM',
      type: 'TANK_VISIT',
      lat: baseLat - 0.030,
      lng: baseLng + 0.020,
      locationName: 'Tank-22 (Siva Aqua Farms)',
      duration: '1 hr 10 mins',
      battery: 62,
      speed: 0,
      purpose: 'Harvest Planning & DO Check',
      tankId: 'T-22',
      farmer: 'Siva'
    },
    {
      id: 10,
      time: '03:45 PM',
      type: 'MOVING',
      lat: baseLat - 0.015,
      lng: baseLng + 0.005,
      locationName: 'En route back to Office',
      duration: '25 mins',
      battery: 55,
      speed: 50,
      purpose: 'Travelling'
    },
    {
      id: 11,
      time: '04:15 PM',
      type: 'FARMER_VISIT',
      lat: baseLat - 0.005,
      lng: baseLng + 0.002,
      locationName: 'Local Feed Dealer',
      duration: '40 mins',
      battery: 50,
      speed: 0,
      purpose: 'Stock Verification'
    },
    {
      id: 12,
      time: '05:45 PM',
      type: 'LOGOUT',
      lat: baseLat,
      lng: baseLng,
      locationName: 'Regional Office, Bhimavaram',
      duration: '0 mins',
      battery: 45,
      speed: 0,
      purpose: 'End of Day'
    }
  ];

  const assignedTanks = [
    { id: 'T-12', name: 'Tank-12', farmer: 'Ashok', status: 'Completed', arrival: '09:42 AM', duration: '45 mins', verified: true },
    { id: 'T-18', name: 'Tank-18', farmer: 'Ravi', status: 'Completed', arrival: '11:20 AM', duration: '50 mins', verified: true },
    { id: 'T-22', name: 'Tank-22', farmer: 'Siva', status: 'Delayed', arrival: '02:10 PM', duration: '1h 10m', verified: true },
    { id: 'T-25', name: 'Tank-25', farmer: 'Ganesh', status: 'Missed', arrival: '-', duration: '-', verified: false }
  ];

  return {
    employeeInfo: {
      name: employeeId === 'emp-2' ? 'Srinivas (Incharge)' : 'Ravi Kumar (Agent)',
      id: employeeId || 'EMP-014',
      role: employeeId === 'emp-2' ? 'Incharge' : 'Field Agent',
      phone: '+91 9876543210',
      area: 'Bhimavaram & Akividu',
      status: 'Offline',
      loginTime: '09:00 AM',
      logoutTime: '05:45 PM',
      workingHours: '8h 45m',
      currentLocation: 'Regional Office, Bhimavaram',
      gpsStatus: 'Active',
      battery: '45%',
      internet: 'Strong (4G)',
      productivityScore: 88,
      totalDistance: '42 km',
      tankVisits: 3,
      farmerVisits: 2
    },
    route,
    assignedTanks,
    stats: {
      distance: '42 km',
      workingHours: '8h 45m',
      travelTime: '2h 15m',
      idleTime: '1h 25m', // Includes lunch and dealer visit
      tankVisits: 3,
      farmerVisits: 2,
      avgVisitDuration: '48 mins',
      avgSpeed: '35 km/h',
      maxSpeed: '65 km/h',
      assignedCompleted: 3,
      missed: 1,
      gpsAccuracy: 'High (~4m)',
      batteryUsage: '55% used'
    },
    alerts: [
      { id: 1, type: 'WARNING', title: 'Assigned Tank Not Visited', message: 'Tank-25 was assigned but no GPS presence detected.' },
      { id: 2, type: 'INFO', title: 'Delayed Visit', message: 'Tank-22 visit was delayed by 1 hour from schedule.' }
    ]
  };
};
