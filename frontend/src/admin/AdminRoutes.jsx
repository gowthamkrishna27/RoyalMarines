import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AdminDashboard from './pages/AdminDashboard';
import Regions from './pages/Regions';
import RegionDetail from './pages/RegionDetail';
import InchargesList from './pages/InchargesList';
import InchargeDetail from './pages/InchargeDetail';
import AgentsList from './pages/AgentsList';
import AgentDetail from './pages/AgentDetail';
import FarmersList from './pages/FarmersList';
import FarmerDetail from './pages/FarmerDetail';
import TanksList from './pages/TanksList';
import TankHistory from './pages/TankHistory';
import FieldData from './pages/FieldData';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import ExportCenter from './pages/ExportCenter';
import ActivityLog from './pages/ActivityLog';
import Settings from './pages/Settings';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="regions" element={<Regions />} />
      <Route path="regions/:regionId" element={<RegionDetail />} />
      <Route path="incharges" element={<InchargesList />} />
      <Route path="incharges/:inchargeId" element={<InchargeDetail />} />
      <Route path="agents" element={<AgentsList />} />
      <Route path="agents/:agentId" element={<AgentDetail />} />
      <Route path="farmers" element={<FarmersList />} />
      <Route path="farmers/:farmerId" element={<FarmerDetail />} />
      <Route path="tanks" element={<TanksList />} />
      <Route path="tanks/:tankId" element={<TankHistory />} />
      <Route path="field-data" element={<FieldData />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="reports" element={<Reports />} />
      <Route path="export-center" element={<ExportCenter />} />
      <Route path="activity-log" element={<ActivityLog />} />
      <Route path="audit-logs" element={<ActivityLog />} />
      <Route path="settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
