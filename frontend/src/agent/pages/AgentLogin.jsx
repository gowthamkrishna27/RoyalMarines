import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff, KeyRound, ArrowRight } from 'lucide-react';
import { login, isAuthenticated, updateStoredPassword } from '../utils/agentAuth';
import logo from '../../assets/logo-trans2.png';
import loginBg from '../../assets/Serene Aquaculture Pond at Sunrise.png';
import BackButton from '../../components/BackButton';

const AgentLogin = () => {
  const navigate = useNavigate();
  const pinInputRef = useRef(null);

  // Login State
  const [agentId, setAgentId] = useState('agent001');
  const [pin, setPin] = useState('1234');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPinFocused, setIsPinFocused] = useState(false);

  // Forgot Password Flow State
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [forgotStep, setForgotStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!agentId || !pin) {
      setError('Please enter both Agent ID and 4-digit PIN');
      return;
    }

    setLoading(true);

    try {
      const result = await login(agentId, pin);
      if (result && result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(result?.error || 'Invalid Agent ID or PIN');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
      setLoading(false);
    }
  };

  const handlePinChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setPin(val);
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
      setForgotMsg({ type: 'success', text: 'OTP verified! Set new 4-digit PIN below.' });
    } else {
      setForgotMsg({ type: 'error', text: 'Invalid OTP code. Please retry.' });
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setForgotMsg({ type: '', text: '' });

    if (!newPassword || newPassword.length < 4) {
      setForgotMsg({ type: 'error', text: 'PIN must be 4 digits.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotMsg({ type: 'error', text: 'PINs do not match.' });
      return;
    }

    updateStoredPassword(agentId ? agentId.trim() : 'agent001', newPassword);
    setForgotStep(4);
    setTimeout(() => {
      setMode('login');
      setPin(newPassword);
      setError('');
    }, 1600);
  };

  return (
    <div style={styles.pageWrapper}>
      {/* Top Left Navigation Back Button */}
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

      {/* Floating Login Container */}
      <div style={styles.loginContainer}>
        {/* Brand Header: Circular Logo & Title */}
        <div style={styles.header}>
          <img 
            src={logo} 
            alt="Royals Marine Food" 
            style={styles.brandLogo} 
          />
          <h2 style={styles.title}>Technician Sign In</h2>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={styles.form}>
            {/* Input 1: Agent / Technician ID (with User icon inside) */}
            <div style={styles.inputBox}>
              <User size={19} color="#94A3B8" strokeWidth={2} style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Agent / Technician ID"
                value={agentId}
                onChange={e => setAgentId(e.target.value)}
                style={styles.inputField}
                required
              />
            </div>

            {/* Input 2: PIN (4 digits) */}
            <div style={styles.pinSection}>
              <label style={styles.pinLabel}>PIN (4 digits)</label>
              <div 
                style={{
                  ...styles.pinInputContainer,
                  borderColor: isPinFocused ? '#0062E0' : '#E2E8F0',
                  boxShadow: isPinFocused ? '0 0 0 3px rgba(0, 98, 224, 0.15)' : '0 4px 14px rgba(0, 0, 0, 0.04)',
                }}
                onClick={() => pinInputRef.current?.focus()}
              >
                {/* 4 Circle Indicators */}
                <div style={styles.circlesRow}>
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = idx < pin.length;
                    return (
                      <div
                        key={idx}
                        style={{
                          ...styles.circle,
                          ...(isFilled
                            ? showPin
                              ? styles.circleDigit
                              : styles.circleFilled
                            : styles.circleEmpty),
                        }}
                      >
                        {isFilled && showPin ? pin[idx] : null}
                      </div>
                    );
                  })}
                </div>

                {/* Eye toggle button */}
                <button
                  type="button"
                  style={styles.eyeBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPin(!showPin);
                  }}
                  title={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? (
                    <Eye size={19} color="#64748B" strokeWidth={1.8} />
                  ) : (
                    <EyeOff size={19} color="#64748B" strokeWidth={1.8} />
                  )}
                </button>

                {/* Hidden input capturing numeric keystrokes */}
                <input
                  ref={pinInputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={handlePinChange}
                  onFocus={() => setIsPinFocused(true)}
                  onBlur={() => setIsPinFocused(false)}
                  style={styles.hiddenPinInput}
                  aria-label="4-digit PIN"
                />
              </div>
            </div>

            {/* Submit Button: Sign In -> */}
            <button
              type="submit"
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.8 : 1,
              }}
              disabled={loading}
            >
              {loading ? (
                'Signing In...'
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} strokeWidth={2.5} />
                </>
              )}
            </button>

            {/* Subtext info */}
            <div style={styles.footerRow}>
              <span style={styles.demoHint}>
                Demo: <strong>agent001</strong> • PIN: <strong>1234</strong>
              </span>
              <span style={styles.forgotLink} onClick={startForgotFlow}>
                Forgot PIN?
              </span>
            </div>
          </form>
        ) : (
          /* Forgot Password Flow */
          <div style={styles.forgotCard}>
            <button style={styles.backToLoginBtn} onClick={() => setMode('login')}>
              ← Back to Sign In
            </button>

            <h3 style={styles.forgotTitle}>Reset Technician PIN</h3>
            <p style={styles.forgotSubtitle}>
              {forgotStep === 1 && 'Enter your registered mobile number to receive an OTP.'}
              {forgotStep === 2 && 'Enter the 6-digit OTP code sent to your mobile.'}
              {forgotStep === 3 && 'Enter your new 4-digit PIN.'}
              {forgotStep === 4 && 'PIN updated successfully! Redirecting...'}
            </p>

            {forgotMsg.text && (
              <div
                style={{
                  ...styles.forgotBanner,
                  backgroundColor:
                    forgotMsg.type === 'error'
                      ? '#FEF2F2'
                      : forgotMsg.type === 'success'
                      ? '#F0FDF4'
                      : '#EFF6FF',
                  color:
                    forgotMsg.type === 'error'
                      ? '#DC2626'
                      : forgotMsg.type === 'success'
                      ? '#16A34A'
                      : '#2563EB',
                }}
              >
                {forgotMsg.text}
              </div>
            )}

            {forgotStep === 1 && (
              <form onSubmit={handleSendOtp} style={styles.form}>
                <div style={styles.inputBox}>
                  <User size={18} color="#94A3B8" />
                  <input
                    type="tel"
                    placeholder="10-digit Mobile Number"
                    value={mobile}
                    onChange={e => setMobile(e.target.value.replace(/[^0-9]/g, '').slice(10))}
                    style={styles.inputField}
                    required
                  />
                </div>
                <button type="submit" style={styles.submitBtn}>
                  <span>Send OTP</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp} style={styles.form}>
                <div style={styles.inputBox}>
                  <KeyRound size={18} color="#94A3B8" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="6-Digit OTP"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    style={styles.inputField}
                    required
                  />
                </div>
                <button type="submit" style={styles.submitBtn}>
                  <span>Verify OTP</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} style={styles.form}>
                <div style={styles.inputBox}>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="New 4-digit PIN"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                    style={styles.inputField}
                    required
                  />
                </div>
                <div style={styles.inputBox}>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="Confirm 4-digit PIN"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                    style={styles.inputField}
                    required
                  />
                </div>
                <button type="submit" style={styles.submitBtn}>
                  <span>Set New PIN</span>
                  <ArrowRight size={18} />
                </button>
              </form>
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
    gap: '13px',
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
  pinSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  pinLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '6px',
    display: 'block',
    paddingLeft: '4px',
  },
  pinInputContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '14px 18px',
    position: 'relative',
    cursor: 'text',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  },
  circlesRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  circle: {
    width: '17px',
    height: '17px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    transition: 'all 0.15s ease',
  },
  circleEmpty: {
    backgroundColor: 'transparent',
    border: '2px solid #CBD5E1',
  },
  circleFilled: {
    backgroundColor: '#0062E0',
    border: '2px solid #0062E0',
  },
  circleDigit: {
    backgroundColor: '#EFF6FF',
    border: '2px solid #0062E0',
    color: '#0062E0',
    fontSize: '11px',
    fontWeight: '800',
  },
  eyeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748B',
    zIndex: 4,
  },
  hiddenPinInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'text',
    zIndex: 1,
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
  footerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '4px',
    padding: '0 4px',
  },
  demoHint: {
    fontSize: '11px',
    color: '#475569',
    fontWeight: '500',
  },
  forgotLink: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#0062E0',
    cursor: 'pointer',
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
  forgotCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    backdropFilter: 'blur(16px)',
    borderRadius: '20px',
    padding: '24px 20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxSizing: 'border-box',
  },
  backToLoginBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    color: '#0062E0',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '4px',
    alignSelf: 'flex-start',
  },
  forgotTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  forgotSubtitle: {
    fontSize: '12px',
    color: '#64748B',
    margin: 0,
    lineHeight: '1.4',
  },
  forgotBanner: {
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
  },
};

export default AgentLogin;
