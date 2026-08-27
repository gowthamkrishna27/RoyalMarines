import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
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

const InchargeRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="agents" element={<Agents />} />
      <Route path="farmers" element={<Farmers />} />
      <Route path="tanks" element={<Tanks />} />
      <Route path="allocations" element={<Allocations />} />
      <Route path="tests" element={<Tests />} />
      <Route path="verifications" element={<Verifications />} />
      <Route path="verifications/:id" element={<RecordReview />} />
      <Route path="weekly-tests" element={<WeeklyTests />} />
      <Route path="reports" element={<Reports />} />
      <Route path="export-data" element={<ExportData />} />
      <Route path="activity-log" element={<ActivityLog />} />
      <Route path="settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default InchargeRoutes;
