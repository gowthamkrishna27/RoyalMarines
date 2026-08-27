import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, HardHat, LayoutTemplate } from 'lucide-react';
import logo from '../assets/logo-trans2.png';
import BackButton from '../components/BackButton';

const PortalSelector = () => {
  const navigate = useNavigate();

  const portals = [
    {
      title: 'Technician Portal',
      subtitle: 'Field Operations & Farm Monitoring',
      icon: HardHat,
      color: '#0018AD',
      bg: '#EDF0FF',
      path: '/agent-login',
      badge: 'Mobile / Field',
    },
    {
      title: 'Incharge Portal',
      subtitle: 'Regional Oversight & Allocations',
      icon: LayoutTemplate,
      color: '#2563EB',
      bg: '#EAF3FF',
      path: '/incharge-login',
      badge: 'Regional Ops',
    },
    {
      title: 'Admin Portal',
      subtitle: 'System Control & Global Analytics',
      icon: Shield,
      color: '#4F46E5',
      bg: '#EEF2FF',
      path: '/admin-login',
      badge: 'Executive',
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.backBtnWrapper}>
        <BackButton fallback="/" />
      </div>

      <div style={styles.contentWrapper}>
        {/* Minimal Header */}
        <div style={styles.header}>
          <img src={logo} alt="Royals Marine Food" style={styles.logo} />
          <h1 style={styles.brandTitle}>Royals Marine Food</h1>
          <p style={styles.brandSubtitle}>Aquaculture Monitoring & Feed Management System</p>
        </div>

        {/* Minimal Portal Cards */}
        <div style={styles.portalGrid}>
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.title}
                style={styles.portalCard}
                onClick={() => navigate(portal.path)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = portal.color;
                  e.currentTarget.style.boxShadow = `0 12px 24px -6px ${portal.color}25`;
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

        {/* Minimal Footer Info */}
        <div style={styles.footer}>
          <span>Royals Marine Food Pvt. Ltd. • Secure Access</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
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
  contentWrapper: {
    width: '100%',
    maxWidth: '460px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logo: {
    width: '110px',
    height: 'auto',
    marginBottom: '14px',
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
  portalGrid: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  portalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
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
  portalTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },
  portalBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '8px',
  },
  portalSubtitle: {
    fontSize: '12px',
    color: '#64748B',
    margin: '2px 0 0 0',
  },
  enterIconCircle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  footer: {
    marginTop: '32px',
    fontSize: '12px',
    color: '#94A3B8',
    textAlign: 'center',
  },
};

export default PortalSelector;
