/**
 * Field Agent / Technician Role Module
 * Encapsulates routes, layouts, and authentication for field operations
 */
export { default as AgentRoutes } from './AgentRoutes';
export { default as Layout, AgentLayout } from './components/Layout';
export { default as AgentLogin } from './pages/AgentLogin';
export * from './utils/agentAuth';
