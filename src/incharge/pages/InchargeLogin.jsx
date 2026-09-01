import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, LayoutTemplate } from 'lucide-react';
import { loginIncharge } from '../utils/inchargeAuth';
import logo from '../../assets/logo-trans2.png';
import BackButton from '../../components/BackButton';

const InchargeLogin = () => {
  const [identifier, setIdentifier] = useState('INC001');
  const [password, setPassword] = useState('incharge123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!identifier || !password) {
      setError('Please enter both Incharge ID/Mobile and Password');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = loginIncharge(identifier, password);
      if (result.success) {
        navigate('/incharge/dashboard');
      } else {
        setError(result.error);
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.backBtnWrapper}>
        <BackButton fallback="/login" />
      </div>

      <div style={styles.loginCard}>
        <div style={styles.header}>
          <img src={logo} alt="Royals Marine Food" style={styles.logo} />
          <h2 style={styles.title}>Incharge Sign In</h2>
          <p style={styles.subtitle}>Regional operations & field team allocations</p>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <div>
            <label style={styles.label}>Incharge ID or Mobile</label>
            <div style={styles.inputBox}>
              <User size={16} color="#64748B" />
              <input
                type="text"
                placeholder="INC001"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={styles.inputField}
                required
              />
            </div>
          </div>

          <div>
            <label style={styles.label}>Password</label>
            <div style={styles.inputBox}>
              <Lock size={16} color="#64748B" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.inputField}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
          >
            <span>{loading ? 'Signing in...' : 'Sign In as Incharge'}</span>
            <ArrowRight size={16} />
          </button>

          <div style={styles.demoHintBox}>
            <span>💡 Demo: ID: <b>INC001</b> • Pass: <b>incharge123</b></span>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'Inter', sans-serif",
    position: 'relative',
  },
  backBtnWrapper: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 10,
  },
  loginCard: {
    width: '100%',
    maxWidth: '380px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: '28px 24px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  logo: {
    width: '120px',
    height: 'auto',
    margin: '0 auto 16px auto',
    display: 'block',
    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
  },
  title: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0F172A',
    margin: '0 0 2px 0',
  },
  subtitle: {
    fontSize: '12px',
    color: '#64748B',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '4px',
    display: 'block',
  },
  inputBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '9px 12px',
  },
  inputField: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    fontSize: '13px',
    color: '#0F172A',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '14px',
    textAlign: 'center',
  },
  submitBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#0284C7',
    color: '#FFFFFF',
    border: 'none',
    padding: '11px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(2, 132, 199, 0.3)',
    marginTop: '4px',
  },
  demoHintBox: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#64748B',
    padding: '8px',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    marginTop: '4px',
  },
};

export default InchargeLogin;
