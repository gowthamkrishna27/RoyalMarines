import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Field Agent / Technician Pages
import AgentDashboard from './pages/AgentDashboard';
import Farmers from './pages/Farmers';
import FarmerDetails from './pages/FarmerDetails';
import TankDetails from './pages/TankDetails';
import SiteVisit from './pages/SiteVisit';
import AddFarmer from './pages/AddFarmer';
import AddTanks from './pages/AddTanks';
import History from './pages/History';
import Tests from './pages/Tests';
import Reports from './pages/Reports';
import Harvest from './pages/Harvest';
import MyAnalytics from './pages/MyAnalytics';
import Profile from './pages/Profile';

/**
 * Subrouter for Field Agent / Technician Portal
 * Handles all technician-specific routes and pages
 */
const AgentRoutes = () => {
  return (
    <Routes>
      {/* Primary Dashboard */}
      <Route index element={<AgentDashboard />} />
      <Route path="dashboard" element={<AgentDashboard />} />

      {/* Farmer & Pond/Tank Management */}
      <Route path="farmers" element={<Farmers />} />
      <Route path="farmers/:farmerId" element={<FarmerDetails />} />
      <Route path="add-farmer" element={<AddFarmer />} />
      <Route path="add-tanks" element={<AddTanks />} />
      <Route path="tanks/:tankId" element={<TankDetails />} />
      <Route path="ponds/:tankId" element={<TankDetails />} />

      {/* Field Operations & Visits */}
      <Route path="visit/:tankId" element={<SiteVisit />} />
      <Route path="harvest" element={<Harvest />} />

      {/* Test Logs & Testing Schedule */}
      <Route path="tests" element={<History />} />
      <Route path="history" element={<History />} />
      <Route path="weekly-tests" element={<Tests />} />

      {/* Analytics, Reports & Profile */}
      <Route path="reports" element={<Reports />} />
      <Route path="analytics" element={<MyAnalytics />} />
      <Route path="my-analytics" element={<MyAnalytics />} />
      <Route path="profile" element={<Profile />} />

      {/* Explicit /technician/* subpaths (for root routing fallback compatibility) */}
      <Route path="technician" element={<AgentDashboard />} />
      <Route path="technician/dashboard" element={<AgentDashboard />} />
      <Route path="technician/farmers" element={<Farmers />} />
      <Route path="technician/farmers/:farmerId" element={<FarmerDetails />} />
      <Route path="technician/tanks/:tankId" element={<TankDetails />} />
      <Route path="technician/ponds/:tankId" element={<TankDetails />} />
      <Route path="technician/visit/:tankId" element={<SiteVisit />} />
      <Route path="technician/add-farmer" element={<AddFarmer />} />
      <Route path="technician/add-tanks" element={<AddTanks />} />
      <Route path="technician/tests" element={<History />} />
      <Route path="technician/history" element={<History />} />
      <Route path="technician/weekly-tests" element={<Tests />} />
      <Route path="technician/reports" element={<Reports />} />
      <Route path="technician/harvest" element={<Harvest />} />
      <Route path="technician/analytics" element={<MyAnalytics />} />
      <Route path="technician/profile" element={<Profile />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AgentRoutes;
