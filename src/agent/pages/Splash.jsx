import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/agentAuth';
import topnavlogo from '../../assets/topnavlogo.png';
import MarineLoader from '../../components/MarineLoader';

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated()) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.content}>
        <img src={topnavlogo} alt="Royals Marine" style={styles.logoImage} />
        <MarineLoader message="INITIALIZING MARINE NETWORK..." />
        
        <button
          onClick={() => {
            if (isAuthenticated()) {
              navigate('/dashboard');
            } else {
              navigate('/login');
            }
          }}
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
    color: '#0018AD',
    marginBottom: '8px',
    letterSpacing: '0.5px',
  },
  titleDark: {
    color: '#0F172A',
  },
  subtitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#0018AD',
    marginBottom: '8px',
  },
  accentText: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0018AD',
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
