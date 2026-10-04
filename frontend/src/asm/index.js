/**
 * ASM (Area Sales Manager / Regional Incharge) Role Module
 * Encapsulates routes, layouts, and authentication for regional operations
 */
export { default as AsmRoutes, InchargeRoutes } from './AsmRoutes';
export { default as AsmLayout, default as InchargeLayout } from './components/InchargeLayout';
export { default as AsmLogin, default as InchargeLogin } from './pages/InchargeLogin';
export * from './utils/inchargeAuth';

// ASM naming aliases
export {
  loginIncharge as loginAsm,
  logoutIncharge as logoutAsm,
  isInchargeAuthenticated as isAsmAuthenticated,
  getInchargeSession as getAsmSession,
} from './utils/inchargeAuth';
