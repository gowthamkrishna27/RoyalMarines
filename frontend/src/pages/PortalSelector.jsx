import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, HardHat, LayoutTemplate, Lock } from 'lucide-react';
import logo from '../assets/logo-trans2.png';
import loginBg from '../assets/Serene Aquaculture Pond at Sunrise.png';
import BackButton from '../components/BackButton';

const PortalSelector = () => {
  const navigate = useNavigate();

  // Primary Web App Portals (Operational: Agent & ASM)
  const operationalPortals = [
    {
      title: 'Agent Portal',
      subtitle: 'Field Operations, Pond Monitoring & Test Submissions',
      icon: HardHat,
      color: '#1A2FB8',
      bg: '#EDF0FF',
      path: '/agent-login',
      badge: 'Field Ops',
    },
    {
      title: 'ASM Portal',
      subtitle: 'Area Sales Manager • Regional Oversight & Verifications',
      icon: LayoutTemplate,
      color: '#2563EB',
      bg: '#EAF3FF',
      path: '/asm-login',
      badge: 'Regional Ops',
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.backBtnWrapper}>
        <BackButton
          fallback="/"
          variant="light"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.7)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        />
      </div>

      <div style={styles.contentWrapper}>
        {/* Brand Header */}
        <div style={styles.header}>
          <img src={logo} alt="Royals Marine Food" style={styles.logo} />
          <h1 style={styles.brandTitle}>Royals Marine Food</h1>
          <p style={styles.brandSubtitle}>Aqua Field Management & Operations Suite</p>
        </div>

        {/* Section 1: Web App Operational Logins (Agent & ASM) */}
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>OPERATIONS PORTALS</span>
        </div>

        <div style={styles.portalGrid}>
          {operationalPortals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.title}
                style={styles.portalCard}
                onClick={() => navigate(portal.path)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = portal.color;
                  e.currentTarget.style.boxShadow = `0 8px 20px -4px ${portal.color}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.04)';
                }}
              >
                <div style={styles.cardLeft}>
                  <div style={{ ...styles.iconWrapper, backgroundColor: portal.bg }}>
                    <Icon size={22} color={portal.color} />
                  </div>
                  <div>
                    <div style={styles.titleRow}>
                      <h2 style={styles.portalTitle}>{portal.title}</h2>
                      <span style={{ ...styles.portalBadge, color: portal.color, backgroundColor: portal.bg }}>
                        {portal.badge}
                      </span>
                    </div>
                    <p style={styles.portalSubtitle}>{portal.subtitle}</p>
                  </div>
                </div>

                <div style={{ ...styles.enterIconCircle, color: portal.color }}>
                  <ArrowRight size={18} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Section 2: Separate Flow for Admin Page */}
        <div style={styles.adminDivider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>EXECUTIVE BACKOFFICE</span>
          <div style={styles.dividerLine} />
        </div>

        <div
          style={styles.adminCard}
          onClick={() => navigate('/admin-login')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = '#4F46E5';
            e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(79, 70, 229, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = '#CBD5E1';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.03)';
          }}
        >
          <div style={styles.cardLeft}>
            <div style={{ ...styles.iconWrapper, backgroundColor: '#EEF2FF' }}>
              <Shield size={22} color="#4F46E5" />
            </div>
            <div>
              <div style={styles.titleRow}>
                <h2 style={styles.adminPortalTitle}>Admin Portal</h2>
                <span style={styles.adminBadge}>Separate Flow</span>
              </div>
              <p style={styles.portalSubtitle}>System Configuration, Global Analytics & Master Data</p>
            </div>
          </div>

          <div style={{ ...styles.enterIconCircle, color: '#4F46E5' }}>
            <ArrowRight size={18} />
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <Lock size={12} style={{ display: 'inline', marginRight: '5px' }} />
          <span>Royals Marine Food Pvt. Ltd. • Secure Access</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    fontFamily: "'Inter', sans-serif",
    position: 'relative',
    boxSizing: 'border-box',
    backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.40) 0%, rgba(2, 6, 23, 0.55) 100%), url("${loginBg}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
  },
  backBtnWrapper: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 10,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: '480px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '32px 28px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  logo: {
    width: '120px',
    height: 'auto',
    margin: '0 auto 12px auto',
    display: 'block',
    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.08))',
  },
  brandTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: '-0.4px',
    margin: '0 0 4px 0',
  },
  brandSubtitle: {
    fontSize: '13px',
    color: '#64748B',
    margin: 0,
    fontWeight: '500',
  },
  sectionHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    paddingLeft: '4px',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.8px',
    color: '#64748B',
  },
  portalGrid: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  portalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    boxSizing: 'border-box',
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  iconWrapper: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  portalTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },
  portalBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '6px',
    letterSpacing: '0.2px',
  },
  portalSubtitle: {
    fontSize: '12px',
    color: '#64748B',
    margin: '3px 0 0 0',
    lineHeight: '1.4',
  },
  adminDivider: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '22px 0 12px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.8px',
    color: '#94A3B8',
  },
  adminCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: '14px',
    border: '1px solid #CBD5E1',
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    boxSizing: 'border-box',
  },
  adminPortalTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1E1B4B',
    margin: 0,
  },
  adminBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '6px',
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    letterSpacing: '0.2px',
  },
  enterIconCircle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: '12px',
  },
  footer: {
    marginTop: '28px',
    fontSize: '12px',
    color: '#94A3B8',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default PortalSelector;
