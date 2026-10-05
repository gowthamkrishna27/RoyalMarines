import { useLocation } from 'react-router-dom';

/**
 * Returns the active base path ('/asm' or '/incharge') based on current URL
 */
export const getAsmBasePath = (pathname = '') => {
  if (typeof pathname === 'string' && pathname.startsWith('/incharge')) {
    return '/incharge';
  }
  return '/asm';
};

/**
 * React hook to get the current ASM portal base path and helper navigation paths
 */
export const useAsmPaths = () => {
  const location = useLocation();
  const base = getAsmBasePath(location.pathname);

  return {
    base,
    dashboard: `${base}/dashboard`,
    agents: `${base}/agents`,
    myFarmers: `${base}/my-farmers`,
    farmers: `${base}/farmers`,
    myTanks: `${base}/my-tanks`,
    tanks: `${base}/tanks`,
    weeklyTests: `${base}/weekly-tests`,
    tests: `${base}/tests`,
    verifications: `${base}/verifications`,
    reports: `${base}/reports`,
    exportData: `${base}/export-data`,
    activityLog: `${base}/activity-log`,
    settings: `${base}/settings`,
    profile: `${base}/settings`,
  };
};
