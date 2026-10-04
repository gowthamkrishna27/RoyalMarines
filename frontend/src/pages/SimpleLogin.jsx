import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import topnavlogo from '../assets/topnavlogo.png';
import loginBg from '../assets/Serene Aquaculture Pond at Sunrise.png';
import { login as loginAgent } from '../agent/utils/agentAuth';
import { loginIncharge } from '../asm/utils/inchargeAuth';

const SimpleLogin = () => {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('agent001');
  const [pinBoxes, setPinBoxes] = useState(['1', '2', '3', '4']);
  const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePinChange = (val, index) => {
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const newBoxes = [...pinBoxes];
    newBoxes[index] = digit;
    setPinBoxes(newBoxes);
    setError('');

    // Advance to next box if digit entered
    if (digit && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!pinBoxes[index] && index > 0) {
        const newBoxes = [...pinBoxes];
        newBoxes[index - 1] = '';
        setPinBoxes(newBoxes);
        pinRefs[index - 1].current?.focus();
      } else {
        const newBoxes = [...pinBoxes];
        newBoxes[index] = '';
        setPinBoxes(newBoxes);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      pinRefs[index - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
    if (pasteData) {
      const newBoxes = ['', '', '', ''];
      for (let i = 0; i < pasteData.length; i++) {
        newBoxes[i] = pasteData[i];
      }
      setPinBoxes(newBoxes);
      const nextIndex = Math.min(pasteData.length, 3);
      pinRefs[nextIndex].current?.focus();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const cleanId = (identifier || '').trim();
    const fullPin = pinBoxes.join('');

    if (!cleanId) {
      setError('Please enter your User ID or Mobile');
      return;
    }

    if (fullPin.length < 4) {
      setError('Please enter all 4 digits of your PIN');
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate with live backend API (Aiven MySQL)
      let backendUser = null;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: cleanId, password: fullPin }),
        });
        const data = await res.json();
        if (data.success && data.data?.token) {
          localStorage.setItem('auth_token', data.data.token);
          if (data.data.user) {
            backendUser = data.data.user;
            localStorage.setItem('auth_user', JSON.stringify(data.data.user));
          }
        }
      } catch {
        // graceful offline fallback
      }

      // 2. Automatically detect role from backend or ID prefix
      const upper = cleanId.toUpperCase();
      const isAsm =
        backendUser?.role === 'ASM' ||
        upper.startsWith('INC') ||
        upper.startsWith('ASM') ||
        cleanId === '9876543210';

      let success = false;
      let targetRoute = '/dashboard';

      if (isAsm) {
        const res = loginIncharge(cleanId, fullPin);
        success = res.success || !!backendUser;
        targetRoute = '/asm/dashboard';
      } else {
        const res = loginAgent(cleanId, fullPin);
        success = res.success || !!backendUser;
        targetRoute = '/dashboard';
      }

      if (success) {
        navigate(targetRoute, { replace: true });
      } else {
        setError('Invalid User ID or PIN. Please check and try again.');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.content}>
        {/* Big Scale Brand Logo */}
        <div style={styles.header}>
          <img src={topnavlogo} alt="Royals Marine Food" style={styles.logo} />
        </div>

        {/* Floating White Card (Matches user screenshot) */}
        <div style={styles.card}>
          <form onSubmit={handleLogin} style={styles.form}>
            {/* User ID / Mobile Input */}
            <div style={styles.inputWrapper}>
              <User size={18} strokeWidth={1.8} color="#64748B" style={styles.iconLeft} />
              <input
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError('');
                }}
                placeholder="agent001"
                required
                style={styles.input}
              />
            </div>

            {/* 4 PIN Boxes + 5th Eye Toggle Box */}
            <div style={styles.pinBoxesContainer}>
              {pinBoxes.map((digit, idx) => (
                <input
                  key={idx}
                  ref={pinRefs[idx]}
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(e.target.value, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  autoComplete="one-time-code"
                  placeholder="•"
                  style={styles.pinBox}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1A2FB8';
                    e.target.style.boxShadow = '0 0 0 3px rgba(26, 47, 184, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E2E8F0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              ))}

              {/* 5th Box: Eye Toggle */}
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={styles.pinEyeBox}
                aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                title={showPin ? 'Hide PIN' : 'Show PIN'}
                className="transition-colors hover:bg-slate-50"
              >
                {showPin ? (
                  <EyeOff size={19} strokeWidth={1.8} color="#1A2FB8" />
                ) : (
                  <Eye size={19} strokeWidth={1.8} color="#556987" />
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && <div style={styles.errorText}>{error}</div>}

            {/* Login Button with Arrow */}
            <button type="submit" disabled={loading} style={styles.signInButton} className="transition-all hover:brightness-105 active:scale-[0.99]">
              <div style={styles.buttonContent}>
                <span>{loading ? 'Logging In...' : 'Login'}</span>
                {!loading && <ArrowRight size={17} strokeWidth={2.4} />}
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: `linear-gradient(180deg, rgba(230, 242, 255, 0.90) 0%, rgba(236, 245, 255, 0.82) 40%, rgba(240, 248, 255, 0.45) 70%, rgba(255, 255, 255, 0) 100%), url("${loginBg}")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center bottom',
    backgroundSize: 'cover',
    backgroundAttachment: 'fixed',
    padding: '32px 20px',
    boxSizing: 'border-box',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  content: {
    width: '100%',
    maxWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 2,
    margin: 'auto 0',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '18px',
  },
  logo: {
    width: '230px',
    height: 'auto',
    maxHeight: '130px',
    objectFit: 'contain',
    filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.08))',
    transition: 'transform 0.2s ease',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '24px 20px',
    boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    boxSizing: 'border-box',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
  },
  iconLeft: {
    position: 'absolute',
    left: '16px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    height: '48px',
    padding: '0 16px 0 46px',
    backgroundColor: '#FFFFFF',
    borderRadius: '13px',
    border: '1.2px solid #E2E8F0',
    fontSize: '15px',
    fontWeight: '500',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  pinBoxesContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '9px',
    width: '100%',
  },
  pinBox: {
    width: '100%',
    height: '48px',
    backgroundColor: '#FFFFFF',
    borderRadius: '13px',
    border: '1.2px solid #E2E8F0',
    fontSize: '22px',
    fontWeight: '700',
    textAlign: 'center',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    transition: 'all 0.15s ease',
  },
  pinEyeBox: {
    width: '100%',
    height: '48px',
    backgroundColor: '#FFFFFF',
    borderRadius: '13px',
    border: '1.2px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    transition: 'all 0.15s ease',
  },
  errorText: {
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '13px',
    textAlign: 'center',
  },
  signInButton: {
    width: '100%',
    height: '48px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '13px',
    fontSize: '15.5px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(26, 47, 184, 0.35)',
    transition: 'transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
  },
  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
};

export default SimpleLogin;
