import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAsmBasePath } from '../utils/asmNavigation';

const Verifications = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const base = getAsmBasePath(location.pathname);

  useEffect(() => {
    navigate(`${base}/tests`, { replace: true });
  }, [navigate, base]);

  return null;
};

export default Verifications;
