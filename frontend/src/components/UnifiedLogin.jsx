import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Eye, EyeOff, Fingerprint, Phone, MessageSquare, 
  HelpCircle, X, CheckCircle2, HardHat, LayoutTemplate, 
  Shield, ArrowRight, Lock, KeyRound, Sparkles, AlertCircle
} from 'lucide-react';
import { login as loginAgent } from '../agent/utils/agentAuth';
import { loginIncharge } from '../asm/utils/inchargeAuth';
import { loginAdmin } from '../admin/utils/adminAuth';
import logo from '../assets/logo-trans2.png';
import topnavlogo from '../assets/topnavlogo.png';
import loginBg from '../assets/Serene Aquaculture Pond at Sunrise.png';
import BackButton from './BackButton';

// Pre-configured Unique IDs for easy selection & reference
const roleProfiles = {
  agent: {
    label: 'Field Agent',
    icon: HardHat,
    color: '#0060E6',
    activeBg: '#EFF6FF',
    defaultId: 'agent001',
    defaultPin: '1234',
    title: 'Technician / Agent Sign In',
    presetUsers: [
      { id: 'agent001', name: 'Ramesh', area: 'Bhimavaram', pin: '1234' },
      { id: 'agent002', name: 'Suresh', area: 'Narasapuram', pin: '1234' },
      { id: 'agent003', name: 'Mahesh', area: 'Akuruvu', pin: '1234' },
    ],
    redirectPath: '/dashboard',
  },
  asm: {
    label: 'ASM',
    icon: LayoutTemplate,
    color: '#0284C7',
    activeBg: '#F0F9FF',
    defaultId: 'INC001',
    defaultPin: '1234',
    title: 'Area Sales Manager (ASM) Sign In',
    presetUsers: [
      { id: 'INC001', name: 'Ravi Kumar', area: 'Bhimavaram Region', pin: '1234' },
      { id: 'INC002', name: 'Rajesh Varma', area: 'Godavari Delta', pin: '1234' },
    ],
    redirectPath: '/incharge/dashboard',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    color: '#4F46E5',
    activeBg: '#EEF2FF',
    defaultId: 'ADM001',
    defaultPin: '1234',
    title: 'Executive Admin Sign In',
    presetUsers: [
      { id: 'ADM001', name: 'System Administrator', area: 'Headquarters', pin: '1234' },
    ],
    redirectPath: '/admin/dashboard',
  }
};

const UnifiedLogin = ({ initialRole = 'agent' }) => {
  const navigate = useNavigate();

  // Active Role State
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const currentConfig = roleProfiles[selectedRole] || roleProfiles.agent;

  // Credentials State
  const [uniqueId, setUniqueId] = useState(currentConfig.defaultId);
  const [customIdMode, setCustomIdMode] = useState(false);
  const [pinDigits, setPinDigits] = useState(['1', '2', '3', '4']);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bioToast, setBioToast] = useState('');

  // Modals State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const [showHelplineModal, setShowHelplineModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotMobile, setForgotMobile] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  // 4 PIN Input Refs for auto-advancing focus
  const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Update credentials when role tab changes
  useEffect(() => {
    const config = roleProfiles[selectedRole] || roleProfiles.agent;
    setUniqueId(config.defaultId);
    setCustomIdMode(false);
    setPinDigits(['1', '2', '3', '4']);
    setError('');
  }, [selectedRole]);

  // Handle single digit changes with auto-advance
  const handleDigitChange = (index, value) => {
    const numeric = value.replace(/[^0-9]/g, '');

    // Handle backspace or clearing
    if (!numeric) {
      const next = [...pinDigits];
      next[index] = '';
      setPinDigits(next);
      return;
    }

    // Handle pasting multiple digits
    if (numeric.length > 1) {
      const chars = numeric.slice(0, 4).split('');
      const next = [...pinDigits];
      chars.forEach((c, i) => {
        if (index + i < 4) next[index + i] = c;
      });
      setPinDigits(next);
      const nextFocus = Math.min(3, index + chars.length);
      pinRefs[nextFocus]?.current?.focus();
      return;
    }

    // Single digit input
    const next = [...pinDigits];
    next[index] = numeric;
    setPinDigits(next);

    // Auto advance to next box
    if (index < 3) {
      pinRefs[index + 1]?.current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinRefs[index - 1]?.current?.focus();
    }
  };

  // Biometric / Quick PIN Simulation
  const handleBiometricClick = () => {
    setPinDigits(['1', '2', '3', '4']);
    setBioToast(`Biometric verified for ${uniqueId}!`);
    setTimeout(() => setBioToast(''), 2200);
  };

  // Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const fullPin = pinDigits.join('');
    if (!uniqueId) {
      setError('Please select or enter your Unique ID');
      return;
    }
    if (fullPin.length < 4) {
      setError('Please enter all 4 digits of your PIN');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      let result = { success: false, error: 'Authentication failed' };

      if (selectedRole === 'agent') {
        result = loginAgent(uniqueId, fullPin);
      } else if (selectedRole === 'asm') {
        result = loginIncharge(uniqueId, fullPin === '1234' ? 'incharge123' : fullPin);
      } else if (selectedRole === 'admin') {
        result = loginAdmin(uniqueId, fullPin === '1234' ? 'admin123' : fullPin);
      }

      if (result.success) {
        navigate(currentConfig.redirectPath, { replace: true });
      } else {
        setError(result.error || 'Invalid Unique ID or PIN. (Demo PIN: 1234)');
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div style={styles.pageWrapper}>
      {/* Top Header Bar: Back Button on Left, Feedback Button on Right */}
      <div style={styles.topBar}>
        <BackButton 
          fallback="/login" 
          variant="light" 
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.90)', 
            backdropFilter: 'blur(10px)', 
            border: '1px solid rgba(255, 255, 255, 0.7)', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)' 
          }} 
        />

        <button 
          type="button" 
          style={styles.feedbackTopBtn} 
          onClick={() => setShowFeedbackModal(true)}
        >
          <MessageSquare size={14} color="#0060E6" />
          <span>Feedback</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div style={styles.cardContainer}>
        {/* Brand Header */}
        <div style={styles.headerSection}>
          <img src={logo} alt="Royals Marine Food" style={styles.logoImg} />
          <h1 style={styles.brandTitle}>
            Login to <span style={{ color: '#0060E6' }}>Royals Marine</span>
          </h1>
        </div>

        {/* 1. Segmented Role Tabs Pill (Field Agent | ASM | Admin) */}
        <div style={styles.roleTabsPill}>
          {Object.entries(roleProfiles).map(([roleKey, roleItem]) => {
            const Icon = roleItem.icon;
            const isActive = selectedRole === roleKey;
            return (
              <button
                key={roleKey}
                type="button"
                onClick={() => setSelectedRole(roleKey)}
                style={{
                  ...styles.roleTabBtn,
                  ...(isActive ? {
                    backgroundColor: '#FFFFFF',
                    color: roleItem.color,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    fontWeight: '700',
                  } : {
                    color: '#64748B',
                  })
                }}
              >
                <Icon size={15} color={isActive ? roleItem.color : '#64748B'} strokeWidth={isActive ? 2.5 : 2} />
                <span>{roleItem.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error Notice */}
        {error && (
          <div style={styles.errorBanner}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Biometric Toast */}
        {bioToast && (
          <div style={styles.bioToastBanner}>
            <CheckCircle2 size={16} />
            <span>{bioToast}</span>
          </div>
        )}

        {/* 2. Login Form */}
        <form onSubmit={handleSubmit} style={styles.formSection}>
          {/* Unique ID Dropdown or Custom Input */}
          <div style={styles.fieldBlock}>
            {!customIdMode ? (
              <div style={styles.selectWrapper}>
                <select
                  value={uniqueId}
                  onChange={(e) => {
                    if (e.target.value === '__CUSTOM__') {
                      setCustomIdMode(true);
                      setUniqueId('');
                    } else {
                      setUniqueId(e.target.value);
                    }
                  }}
                  style={styles.selectInput}
                >
                  <option disabled value="">Select {currentConfig.label} Unique ID</option>
                  {currentConfig.presetUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.id} — {user.name} ({user.area})
                    </option>
                  ))}
                  <option value="__CUSTOM__">✏️ Enter Custom Unique ID...</option>
                </select>
              </div>
            ) : (
              <div style={styles.customInputWrapper}>
                <div style={styles.inputBoxWithIcon}>
                  <User size={18} color="#94A3B8" />
                  <input
                    type="text"
                    placeholder={`Enter ${currentConfig.label} Unique ID`}
                    value={uniqueId}
                    onChange={(e) => setUniqueId(e.target.value)}
                    style={styles.textInput}
                    autoFocus
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCustomIdMode(false);
                    setUniqueId(currentConfig.defaultId);
                  }}
                  style={styles.switchModeLink}
                >
                  Choose from list
                </button>
              </div>
            )}
          </div>

          {/* 3. PIN (4 digits) Row with 4 Boxes + Eye Toggle + Biometric Button */}
          <div style={styles.fieldBlock}>
            <div style={styles.pinBoxesRow}>
              {/* 4 Digit Boxes */}
              {[0, 1, 2, 3].map((idx) => {
                const digit = pinDigits[idx];
                const isFilled = Boolean(digit);
                return (
                  <input
                    key={idx}
                    ref={pinRefs[idx]}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    style={{
                      ...styles.digitBox,
                      borderColor: isFilled ? '#0060E6' : '#E2E8F0',
                      backgroundColor: isFilled ? '#F8FAFC' : '#F1F5F9',
                    }}
                    aria-label={`PIN Digit ${idx + 1}`}
                  />
                );
              })}

              {/* Eye Toggle Box */}
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={styles.pinActionBtn}
                title={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <Eye size={18} color="#0060E6" /> : <EyeOff size={18} color="#64748B" />}
              </button>

              {/* Fingerprint / Biometric Box */}
              <button
                type="button"
                onClick={handleBiometricClick}
                style={styles.biometricBtn}
                title="Quick Demo Biometric Authentication"
              >
                <Fingerprint size={20} color="#EA580C" />
              </button>
            </div>
          </div>

          {/* 4. Large Action Button: Login */}
          <button
            type="submit"
            style={{
              ...styles.loginBtn,
              backgroundColor: currentConfig.color,
              opacity: loading ? 0.75 : 1,
            }}
            disabled={loading}
          >
            <span>{loading ? 'Verifying...' : 'Login'}</span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>

          {/* 5. Secondary "or" Action */}
          <div style={styles.orRow}>
            <div style={styles.orLine} />
            <span style={styles.orText}>or</span>
            <div style={styles.orLine} />
          </div>

          <button
            type="button"
            style={styles.secondaryBtn}
            onClick={() => navigate('/login')}
          >
            <Shield size={16} color="#0060E6" />
            <span>View All Operational Portals</span>
          </button>

          {/* 6. Footer Links: Forgot PIN & Helpline */}
          <div style={styles.footerLinksRow}>
            <button
              type="button"
              style={styles.forgotPinBtn}
              onClick={() => {
                setShowForgotModal(true);
                setForgotMobile('');
                setForgotMsg('');
              }}
            >
              Forgot PIN?
            </button>

            <button
              type="button"
              style={styles.helplineBtn}
              onClick={() => setShowHelplineModal(true)}
            >
              <Phone size={14} color="#EA580C" />
              <span>Helpline & Contacts</span>
            </button>
          </div>
        </form>
      </div>

      {/* Copyright Footer */}
      <div style={styles.copyrightText}>
        © 2026 Royals Marine Food Pvt. Ltd. All rights reserved.
      </div>

      {/* ============================================================== */}
      {/* FEEDBACK MODAL                                                 */}
      {/* ============================================================== */}
      {showFeedbackModal && (
        <div style={styles.modalOverlay} onClick={() => setShowFeedbackModal(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Technician & Staff Feedback</h3>
              <button 
                type="button" 
                style={styles.closeBtn} 
                onClick={() => setShowFeedbackModal(false)}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            {feedbackSubmitted ? (
              <div style={styles.feedbackSuccess}>
                <CheckCircle2 size={36} color="#16A34A" />
                <h4>Thank You!</h4>
                <p>Your operational feedback has been logged to the technical desk.</p>
                <button
                  type="button"
                  style={styles.modalPrimaryBtn}
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setFeedbackSubmitted(false);
                    setFeedbackText('');
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <div style={styles.modalBody}>
                <p style={styles.modalDesc}>
                  Encountering issues with farm visits, test logs, or account access? Let the Royals Marine support team know.
                </p>
                <textarea
                  rows={4}
                  placeholder="Describe your feedback or technical issue..."
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  style={styles.modalTextarea}
                />
                <button
                  type="button"
                  style={styles.modalPrimaryBtn}
                  onClick={() => {
                    if (feedbackText.trim()) setFeedbackSubmitted(true);
                  }}
                >
                  Submit Feedback
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* HELPLINE & CONTACTS MODAL                                       */}
      {/* ============================================================== */}
      {showHelplineModal && (
        <div style={styles.modalOverlay} onClick={() => setShowHelplineModal(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Helpline & Support Desk</h3>
              <button 
                type="button" 
                style={styles.closeBtn} 
                onClick={() => setShowHelplineModal(false)}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.contactItem}>
                <Phone size={18} color="#0060E6" />
                <div>
                  <strong>Field Operations Helpline</strong>
                  <div>+91 98765 43210 (Toll-Free 24/7)</div>
                </div>
              </div>

              <div style={styles.contactItem}>
                <MessageSquare size={18} color="#16A34A" />
                <div>
                  <strong>WhatsApp Field Support Desk</strong>
                  <div>+91 80088 12345 (Instant Chat)</div>
                </div>
              </div>

              <div style={styles.contactItem}>
                <Shield size={18} color="#4F46E5" />
                <div>
                  <strong>ASM & Regional Desk</strong>
                  <div>support@royalsmarine.com</div>
                </div>
              </div>

              <div style={styles.demoNote}>
                Aqua Field Operations • Royals Marine Food Pvt. Ltd.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FORGOT PIN MODAL                                               */}
      {/* ============================================================== */}
      {showForgotModal && (
        <div style={styles.modalOverlay} onClick={() => setShowForgotModal(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Reset 4-Digit PIN</h3>
              <button 
                type="button" 
                style={styles.closeBtn} 
                onClick={() => setShowForgotModal(false)}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            <div style={styles.modalBody}>
              <p style={styles.modalDesc}>
                Enter the registered mobile number for Unique ID <strong>{uniqueId}</strong> to receive a reset code.
              </p>

              <div style={styles.inputBoxWithIcon}>
                <Phone size={18} color="#94A3B8" />
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={forgotMobile}
                  onChange={e => setForgotMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  style={styles.textInput}
                />
              </div>

              {forgotMsg && (
                <div style={styles.forgotResultMsg}>
                  {forgotMsg}
                </div>
              )}

              <button
                type="button"
                style={styles.modalPrimaryBtn}
                onClick={() => {
                  if (forgotMobile.length >= 10) {
                    setForgotMsg('✅ OTP sent to registered number. Default PIN is 1234.');
                    setTimeout(() => {
                      setPinDigits(['1', '2', '3', '4']);
                      setShowForgotModal(false);
                    }, 2000);
                  } else {
                    setForgotMsg('Please enter a valid 10-digit mobile number.');
                  }
                }}
              >
                Send Reset Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    fontFamily: "'Inter', sans-serif",
    position: 'relative',
    backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.25) 0%, rgba(2, 6, 23, 0.35) 100%), url("${loginBg}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    boxSizing: 'border-box',
  },
  topBar: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  feedbackTopBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.7)',
    borderRadius: '12px',
    padding: '7px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#0060E6',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'all 0.2s ease',
  },
  cardContainer: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '28px 24px',
    boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
    boxSizing: 'border-box',
  },
  headerSection: {
    textAlign: 'center',
    marginBottom: '18px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoImg: {
    width: '84px',
    height: 'auto',
    marginBottom: '8px',
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))',
  },
  brandTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  roleTabsPill: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: '14px',
    padding: '4px',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '4px',
    marginBottom: '18px',
    boxSizing: 'border-box',
  },
  roleTabBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    padding: '8px 4px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  errorBanner: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FECACA',
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxSizing: 'border-box',
  },
  bioToastBanner: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    color: '#16A34A',
    border: '1px solid #BBF7D0',
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '700',
    marginBottom: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxSizing: 'border-box',
    animation: 'fade-in 0.2s ease',
  },
  formSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldBlock: {
    width: '100%',
  },
  selectWrapper: {
    position: 'relative',
    width: '100%',
  },
  selectInput: {
    width: '100%',
    appearance: 'none',
    backgroundColor: '#F1F5F9',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '13px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#0F172A',
    cursor: 'pointer',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
  },
  customInputWrapper: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  inputBoxWithIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F1F5F9',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '12px 14px',
    boxSizing: 'border-box',
  },
  textInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    fontSize: '14px',
    fontWeight: '600',
    color: '#0F172A',
  },
  switchModeLink: {
    background: 'none',
    border: 'none',
    color: '#0060E6',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-end',
    padding: '2px 4px',
  },
  pinBoxesRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr) 44px 44px',
    gap: '8px',
    width: '100%',
    alignItems: 'center',
  },
  digitBox: {
    width: '100%',
    height: '46px',
    borderRadius: '12px',
    textAlign: 'center',
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F172A',
    outline: 'none',
    transition: 'all 0.15s ease',
    boxSizing: 'border-box',
  },
  pinActionBtn: {
    height: '46px',
    width: '44px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  biometricBtn: {
    height: '46px',
    width: '44px',
    borderRadius: '12px',
    border: '1px solid #FFEDD5',
    backgroundColor: '#FFF7ED',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  loginBtn: {
    width: '100%',
    height: '48px',
    borderRadius: '14px',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0, 96, 230, 0.35)',
    transition: 'all 0.2s ease',
    marginTop: '4px',
  },
  orRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '2px 0',
  },
  orLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#E2E8F0',
  },
  orText: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#94A3B8',
  },
  secondaryBtn: {
    width: '100%',
    height: '42px',
    borderRadius: '12px',
    border: '1px solid #BFDBFE',
    backgroundColor: '#EFF6FF',
    color: '#0060E6',
    fontSize: '13px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  footerLinksRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 2px 0 2px',
  },
  forgotPinBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
  },
  helplineBtn: {
    background: 'none',
    border: 'none',
    color: '#EA580C',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: 0,
  },
  copyrightText: {
    marginTop: '20px',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.85)',
    textShadow: '0 1px 4px rgba(0,0,0,0.4)',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '16px',
    boxSizing: 'border-box',
  },
  modalCard: {
    width: '100%',
    maxWidth: '380px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    boxSizing: 'border-box',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  modalDesc: {
    fontSize: '13px',
    color: '#64748B',
    margin: 0,
    lineHeight: '1.45',
  },
  modalTextarea: {
    width: '100%',
    border: '1px solid #CBD5E1',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  modalPrimaryBtn: {
    width: '100%',
    height: '44px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#0060E6',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    fontSize: '13px',
    color: '#1E293B',
  },
  demoNote: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '6px',
  },
  feedbackSuccess: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 0',
  },
  forgotResultMsg: {
    padding: '8px 12px',
    backgroundColor: '#EFF6FF',
    color: '#0060E6',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
  },
};

export default UnifiedLogin;
