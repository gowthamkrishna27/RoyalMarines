import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Phone, KeyRound, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { login, isAuthenticated, updateStoredPassword } from '../utils/agentAuth';
import logo from '../../assets/logo-trans2.png';
import BackButton from '../../components/BackButton';

const AgentLogin = () => {
  const navigate = useNavigate();
  
  // Login State
  const [agentId, setAgentId] = useState('agent001');
  const [password, setPassword] = useState('agent123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password Flow State
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [forgotStep, setForgotStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotMsg, setForgotMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!agentId || !password) {
      setError('Please enter both Agent ID and Password');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const result = login(agentId, password);
      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error);
        setLoading(false);
      }
    }, 400);
  };

  const startForgotFlow = () => {
    setMode('forgot');
    setForgotStep(1);
    setMobile('');
    setOtp('');
    setGeneratedOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotMsg({ type: '', text: '' });
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    setForgotMsg({ type: '', text: '' });
    const cleanMobile = mobile.trim();
    if (!cleanMobile || cleanMobile.length < 10) {
      setForgotMsg({ type: 'error', text: 'Please enter a valid 10-digit mobile number.' });
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setForgotStep(2);
    setForgotMsg({ type: 'info', text: `OTP sent! (Demo Code: ${code})` });
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setForgotMsg({ type: '', text: '' });
    if (otp.trim() === generatedOtp || otp.trim() === '123456') {
      setForgotStep(3);
      setForgotMsg({ type: 'success', text: 'OTP verified! Set new password below.' });
    } else {
      setForgotMsg({ type: 'error', text: 'Invalid OTP code. Please retry.' });
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setForgotMsg({ type: '', text: '' });

    if (!newPassword || newPassword.length < 6) {
      setForgotMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    updateStoredPassword(agentId ? agentId.trim() : 'agent001', newPassword);
    setForgotStep(4);
    setTimeout(() => {
      setMode('login');
      setPassword('');
      setError('');
    }, 1800);
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.backBtnWrapper}>
        <BackButton fallback="/login" />
      </div>

      <div style={styles.loginCard}>
        {/* Logo & Header */}
        <div style={styles.header}>
          <img src={logo} alt="Royals Marine" style={styles.logo} />
          <h2 style={styles.title}>Technician Sign In</h2>
          <p style={styles.subtitle}>Enter your credentials to access field operations</p>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={styles.form}>
            <div>
              <label style={styles.label}>Agent / Technician ID</label>
              <div style={styles.inputBox}>
                <User size={16} color="#64748B" />
                <input
                  type="text"
                  placeholder="agent001"
                  value={agentId}
                  onChange={e => setAgentId(e.target.value)}
                  style={styles.inputField}
                  required
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>Password</label>
                <span style={styles.forgotLink} onClick={startForgotFlow}>
                  Forgot?
                </span>
              </div>
              <div style={styles.inputBox}>
                <Lock size={16} color="#64748B" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={styles.inputField}
                  required
                />
                <button
                  type="button"
                  style={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} color="#64748B" /> : <Eye size={16} color="#64748B" />}
                </button>
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
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>

            {/* Quick Demo Hint */}
            <div style={styles.demoHintBox}>
              <span>💡 Demo: ID: <b>agent001</b> • Pass: <b>agent123</b></span>
            </div>
          </form>
        ) : (
          /* Forgot Password Minimal Flow */
          <div style={styles.form}>
            <button 
              type="button" 
              style={styles.backToLoginBtn}
              onClick={() => setMode('login')}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>

            {forgotMsg.text && (
              <div style={{
                ...styles.forgotBanner,
                backgroundColor: forgotMsg.type === 'error' ? '#FEF2F2' : forgotMsg.type === 'success' ? '#F0FDF4' : '#E0F7F8',
                color: forgotMsg.type === 'error' ? '#DC2626' : forgotMsg.type === 'success' ? '#16A34A' : '#0EA5A8',
              }}>
                {forgotMsg.text}
              </div>
            )}

            {forgotStep === 1 && (
              <form onSubmit={handleSendOtp} style={styles.form}>
                <div>
                  <label style={styles.label}>Registered Mobile</label>
                  <div style={styles.inputBox}>
                    <Phone size={16} color="#64748B" />
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={mobile}
                      maxLength={10}
                      onChange={e => setMobile(e.target.value)}
                      style={styles.inputField}
                      required
                    />
                  </div>
                </div>
                <button type="submit" style={styles.submitBtn}>
                  Send OTP Code
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp} style={styles.form}>
                <div>
                  <label style={styles.label}>6-Digit OTP Code</label>
                  <div style={styles.inputBox}>
                    <KeyRound size={16} color="#64748B" />
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      maxLength={6}
                      onChange={e => setOtp(e.target.value)}
                      style={styles.inputField}
                      required
                    />
                  </div>
                </div>
                <button type="submit" style={styles.submitBtn}>
                  Verify OTP
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} style={styles.form}>
                <div>
                  <label style={styles.label}>New Password</label>
                  <div style={styles.inputBox}>
                    <Lock size={16} color="#64748B" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="New password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={styles.inputField}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label style={styles.label}>Confirm Password</label>
                  <div style={styles.inputBox}>
                    <Lock size={16} color="#64748B" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={styles.inputField}
                      required
                    />
                  </div>
                </div>
                <button type="submit" style={styles.submitBtn}>
                  Reset Password
                </button>
              </form>
            )}

            {forgotStep === 4 && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <CheckCircle size={44} color="#16A34A" style={{ marginBottom: '8px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>Password Updated</h4>
                <p style={{ fontSize: '12px', color: '#64748B' }}>Redirecting to sign in...</p>
              </div>
            )}
          </div>
        )}
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
    width: '90px',
    height: 'auto',
    marginBottom: '10px',
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
  forgotLink: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#0018AD',
    cursor: 'pointer',
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
  eyeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
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
    backgroundColor: '#0018AD',
    color: '#FFFFFF',
    border: 'none',
    padding: '11px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0, 24, 173, 0.3)',
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
  backToLoginBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    color: '#0018AD',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '6px',
  },
  forgotBanner: {
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
  },
};

export default AgentLogin;
