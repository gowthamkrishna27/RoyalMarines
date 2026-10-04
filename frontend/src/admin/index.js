/**
 * System Admin / Executive Role Module
 * Encapsulates routes, layouts, and authentication for administrative operations
 */
export { default as AdminRoutes } from './AdminRoutes';
export { default as AdminLayout } from './components/AdminLayout';
export { default as AdminLogin } from './pages/AdminLogin';
export * from './utils/adminAuth';
