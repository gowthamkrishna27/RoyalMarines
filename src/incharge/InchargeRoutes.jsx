import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import MyFarmers from './pages/MyFarmers';
import MyTanks from './pages/MyTanks';
import Farmers from './pages/Farmers';
import Tanks from './pages/Tanks';
import Allocations from './pages/Allocations';
import Tests from './pages/Tests';
import Verifications from './pages/Verifications';
import RecordReview from './pages/RecordReview';
import WeeklyTests from './pages/WeeklyTests';
import Reports from './pages/Reports';
import ExportData from './pages/ExportData';
import ActivityLog from './pages/ActivityLog';
import Settings from './pages/Settings';

// Shared Pages for Farmer & Tank Operations
import FarmerDetails from '../agent/pages/FarmerDetails';
import TankDetails from '../agent/pages/TankDetails';
import SiteVisit from '../agent/pages/SiteVisit';
import AddFarmer from '../agent/pages/AddFarmer';
import AddTanks from '../agent/pages/AddTanks';

const InchargeRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="agents" element={<Agents />} />
      <Route path="my-farmers" element={<MyFarmers />} />
      <Route path="my-tanks" element={<MyTanks />} />
      <Route path="farmers" element={<Farmers />} />
      <Route path="farmers/:farmerId" element={<FarmerDetails />} />
      <Route path="add-farmer" element={<AddFarmer />} />
      <Route path="add-tanks" element={<AddTanks />} />
      <Route path="tanks" element={<Tanks />} />
      <Route path="tanks/:tankId" element={<TankDetails />} />
      <Route path="visit/:tankId" element={<SiteVisit />} />
      <Route path="allocations" element={<Allocations />} />
      <Route path="tests" element={<Tests />} />
      <Route path="history" element={<Tests />} />
      <Route path="verifications" element={<Verifications />} />
      <Route path="verifications/:id" element={<RecordReview />} />
      <Route path="weekly-tests" element={<WeeklyTests />} />
      <Route path="reports" element={<Reports />} />
      <Route path="export-data" element={<ExportData />} />
      <Route path="activity-log" element={<ActivityLog />} />
      <Route path="settings" element={<Settings />} />
      <Route path="profile" element={<Settings />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default InchargeRoutes;
