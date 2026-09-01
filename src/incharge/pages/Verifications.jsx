import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Verifications = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/incharge/tests', { replace: true });
  }, [navigate]);

  return null;
};

export default Verifications;
