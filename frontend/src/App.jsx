import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Global Reactive Context & Error Boundary
import { MockDataProvider } from './context/MockDataContext';
import ErrorBoundary from './components/ErrorBoundary';

// Role-Based Route Guards
import { 
  AdminProtectedRoute, 
  AsmProtectedRoute, 
  AgentProtectedRoute 
} from './components/ProtectedRoute';

// Public & Multi-Portal Launch Pages
import Splash from './pages/Splash';
import PortalSelector from './pages/PortalSelector';
import SimpleLogin from './pages/SimpleLogin';

// -----------------------------------------------------------------------------
// WEB APP ROLE 1: FIELD AGENT (Field Operations, Ponds & Testing)
// -----------------------------------------------------------------------------
import { AgentLogin, AgentLayout, AgentRoutes } from './agent';

// -----------------------------------------------------------------------------
// WEB APP ROLE 2: ASM (Area Sales Manager / Regional Operations & Verifications)
// -----------------------------------------------------------------------------
import { AsmLogin, AsmLayout, AsmRoutes } from './asm';

// -----------------------------------------------------------------------------
// SEPARATE FLOW: SYSTEM ADMIN (Executive Control, Master Data & Global Analytics)
// -----------------------------------------------------------------------------
import { AdminLogin, AdminLayout, AdminRoutes } from './admin';

function App() {
  return (
    <ErrorBoundary>
      <MockDataProvider>
        <Router>
          <Routes>
            {/* ========================================================= */}
            {/* 1. PUBLIC ENTRY & UNIFIED SIMPLE LOGIN                    */}
            {/* ========================================================= */}
            <Route path="/" element={<Splash />} />
            <Route path="/login" element={<SimpleLogin />} />
            <Route path="/portal-selector" element={<PortalSelector />} />

            {/* ========================================================= */}
            {/* 2. WEB APP FLOW: FIELD AGENT PORTAL                       */}
            {/* ========================================================= */}
            <Route path="/agent-login" element={<SimpleLogin />} />
            <Route
              path="/agent/*"
              element={
                <AgentProtectedRoute>
                  <AgentLayout>
                    <AgentRoutes />
                  </AgentLayout>
                </AgentProtectedRoute>
              }
            />
            <Route
              path="/technician/*"
              element={
                <AgentProtectedRoute>
                  <AgentLayout>
                    <AgentRoutes />
                  </AgentLayout>
                </AgentProtectedRoute>
              }
            />

            {/* ========================================================= */}
            {/* 3. WEB APP FLOW: ASM (AREA SALES MANAGER) PORTAL          */}
            {/* ========================================================= */}
            <Route path="/asm-login" element={<SimpleLogin />} />
            <Route path="/incharge-login" element={<SimpleLogin />} />
            <Route
              path="/asm/*"
              element={
                <AsmProtectedRoute>
                  <AsmLayout>
                    <AsmRoutes />
                  </AsmLayout>
                </AsmProtectedRoute>
              }
            />
            <Route
              path="/incharge/*"
              element={
                <AsmProtectedRoute>
                  <AsmLayout>
                    <AsmRoutes />
                  </AsmLayout>
                </AsmProtectedRoute>
              }
            />

            {/* ========================================================= */}
            {/* 4. SEPARATE FLOW: SYSTEM ADMIN MANAGEMENT PORTAL          */}
            {/* ========================================================= */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route
              path="/admin/*"
              element={
                <AdminProtectedRoute>
                  <AdminLayout>
                    <AdminRoutes />
                  </AdminLayout>
                </AdminProtectedRoute>
              }
            />

            {/* ========================================================= */}
            {/* 5. DIRECT FIELD SHORTCUTS (Root paths for Agent)          */}
            {/* ========================================================= */}
            <Route
              path="/*"
              element={
                <AgentProtectedRoute>
                  <AgentLayout>
                    <AgentRoutes />
                  </AgentLayout>
                </AgentProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </MockDataProvider>
    </ErrorBoundary>
  );
}

export default App;
