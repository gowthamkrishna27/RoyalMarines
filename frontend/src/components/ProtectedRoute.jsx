import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../agent/utils/agentAuth';
import { isInchargeAuthenticated } from '../incharge/utils/inchargeAuth';
import { isAdminAuthenticated } from '../admin/utils/adminAuth';

/**
 * All protected routes require both a role session AND a valid JWT token.
 * Without the auth_token in localStorage, users are redirected to login.
 */

const hasValidToken = () => !!localStorage.getItem('auth_token');

/**
 * Route Guard for Admin Portal (/admin/*)
 * Only allows authenticated Super Admins / Executives
 */
export const AdminProtectedRoute = ({ children }) => {
  if (!isAdminAuthenticated() || !hasValidToken()) {
    return <Navigate to="/admin-login" replace />;
  }
  return children;
};

/**
 * Route Guard for ASM / Incharge Portal (/asm/* and /incharge/*)
 * Only allows authenticated Area Sales Managers / Incharges
 */
export const AsmProtectedRoute = ({ children }) => {
  if (!isInchargeAuthenticated() || !hasValidToken()) {
    return <Navigate to="/asm-login" replace />;
  }
  return children;
};

export const InchargeProtectedRoute = AsmProtectedRoute;

/**
 * Route Guard for Field Technician / Agent Portal (/technician/* and field routes)
 * Allows authenticated Technicians, or higher roles (Incharge, Admin) reviewing field data
 */
export const AgentProtectedRoute = ({ children }) => {
  if (!hasValidToken()) {
    return <Navigate to="/login" replace />;
  }
  if (!isAuthenticated() && !isInchargeAuthenticated() && !isAdminAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Default export alias for general protected route
export const ProtectedRoute = AgentProtectedRoute;
export default AgentProtectedRoute;
