import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../agent/utils/agentAuth';
import { isInchargeAuthenticated } from '../incharge/utils/inchargeAuth';
import { isAdminAuthenticated } from '../admin/utils/adminAuth';
import topnavlogo from '../assets/topnavlogo.png';
import MarineLoader from '../components/MarineLoader';

const Splash = () => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    if (isAdminAuthenticated()) {
      navigate('/admin/dashboard', { replace: true });
    } else if (isInchargeAuthenticated()) {
      navigate('/incharge/dashboard', { replace: true });
    } else if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleRedirect();
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.content}>
        <img src={topnavlogo} alt="Royals Marine" style={styles.logoImage} />
        <MarineLoader message="" />

        <button
          onClick={handleRedirect}
          style={styles.skipBtn}
        >
          Click to continue →
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '24px 16px',
    boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif",
  },
  content: {
    maxWidth: '420px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    marginTop: '24px',
    background: 'none',
    border: 'none',
    color: '#64748B',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '8px',
  },
  logoImage: {
    width: '100%',
    maxWidth: '320px',
    height: 'auto',
    marginBottom: '20px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#1A2FB8',
    marginBottom: '8px',
    letterSpacing: '0.5px',
  },
  titleDark: {
    color: '#0F172A',
  },
  subtitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1A2FB8',
    marginBottom: '8px',
  },
  accentText: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1A2FB8',
    letterSpacing: '1px',
    marginBottom: '24px',
  },
  description: {
    fontSize: '14px',
    color: '#64748B',
    maxWidth: '250px',
    lineHeight: '1.5',
  },
  loaderContainer: {
    width: '100%',
    paddingBottom: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  loaderBar: {
    width: '160px',
    height: '4px',
    backgroundColor: '#DCE4EE',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  loaderProgress: {
    width: '40%',
    height: '100%',
    backgroundColor: '#2563D9',
    borderRadius: '2px',
    animation: 'loading 2s infinite ease-in-out',
  },
  loadingText: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: '1px',
  }
};

// Add animation keyframes to document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes loading {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(250%); }
    }
  `;
  document.head.appendChild(style);
}

export default Splash;
