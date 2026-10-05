import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, ArrowRight } from 'lucide-react';
import { loginIncharge } from '../utils/inchargeAuth';
import logo from '../../assets/logo-trans2.png';
import loginBg from '../../assets/Serene Aquaculture Pond at Sunrise.png';
import BackButton from '../../components/BackButton';

const InchargeLogin = () => {
  const [identifier, setIdentifier] = useState('INC001');
  const [password, setPassword] = useState('incharge123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!identifier || !password) {
      setError('Please enter both ASM ID/Mobile and Password');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = loginIncharge(identifier, password);
      if (result.success) {
        const target = location.pathname.includes('incharge') ? '/incharge/dashboard' : '/asm/dashboard';
        navigate(target);
      } else {
        setError(result.error);
        setLoading(false);
      }
    }, 350);
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.backBtnWrapper}>
        <BackButton 
          fallback="/login" 
          variant="light" 
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.85)', 
            backdropFilter: 'blur(8px)', 
            border: '1px solid rgba(255, 255, 255, 0.6)', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
          }} 
        />
      </div>

      <div style={styles.loginContainer}>
        {/* Brand Header */}
        <div style={styles.header}>
          <img src={logo} alt="Royals Marine Food" style={styles.brandLogo} />
          <h2 style={styles.title}>ASM Sign In</h2>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputBox}>
            <User size={19} color="#94A3B8" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="ASM ID or Mobile Number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={styles.inputField}
              required
            />
          </div>

          <div style={styles.inputBox}>
            <Lock size={19} color="#94A3B8" style={{ flexShrink: 0 }} />
            <input
              type="password"
              placeholder="Password / PIN"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.inputField}
              required
            />
          </div>

          <button 
            type="submit" 
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.8 : 1,
            }}
            disabled={loading}
          >
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>

          <div style={styles.demoHintBox}>
            Demo: <strong>INC001</strong> • Password: <strong>incharge123</strong>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '65px',
    paddingBottom: '40px',
    paddingLeft: '20px',
    paddingRight: '20px',
    fontFamily: "'Inter', sans-serif",
    position: 'relative',
    backgroundImage: `url("${loginBg}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center top',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    boxSizing: 'border-box',
  },
  backBtnWrapper: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 10,
  },
  loginContainer: {
    width: '100%',
    maxWidth: '340px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
    boxSizing: 'border-box',
  },
  header: {
    textAlign: 'center',
    marginBottom: '18px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  brandLogo: {
    width: '115px',
    height: 'auto',
    marginBottom: '12px',
    display: 'block',
    filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.16))',
  },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.3px',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  inputBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '13px 18px',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  },
  inputField: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    fontSize: '15px',
    color: '#0F172A',
    fontWeight: '500',
  },
  errorBanner: {
    width: '100%',
    backgroundColor: 'rgba(254, 242, 242, 0.95)',
    color: '#DC2626',
    border: '1px solid #FECACA',
    borderRadius: '12px',
    padding: '9px 12px',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '12px',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  submitBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#0062E0',
    color: '#FFFFFF',
    border: 'none',
    height: '48px',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(0, 98, 224, 0.35)',
    marginTop: '6px',
    transition: 'all 0.2s ease',
  },
  demoHintBox: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#475569',
    marginTop: '4px',
    fontWeight: '500',
  },
};

export default InchargeLogin;
