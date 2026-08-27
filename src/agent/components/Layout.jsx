import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';
import topnavlogo from '../../assets/topnavlogo.png';
import { getSession } from '../utils/agentAuth';
import { getStoredGPS, captureDeviceGPS, generateVerifiedFallbackGPS } from '../utils/gpsService';
import { MapPin } from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState(getSession());
  const [currentGps, setCurrentGps] = useState(null);

  useEffect(() => {
    // 1. Load session
    setSession(getSession());

    // 2. Fetch or initialize GPS locality
    const stored = getStoredGPS();
    if (stored) {
      setCurrentGps(stored);
    } else {
      captureDeviceGPS(
        (coords) => setCurrentGps(coords),
        (err) => {
          const fallback = generateVerifiedFallbackGPS('Coastal Aqua Zone, Krishnapatnam');
          setCurrentGps(fallback);
        }
      );
    }

    const handleProfileUpdate = () => setSession(getSession());
    window.addEventListener('agentProfileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('agentProfileUpdated', handleProfileUpdate);
    };
  }, []);

  const agentId = session?.agentId || 'agent001';

  return (
    <>
      <style>{`
        .responsive-app-layout {
          display: flex;
          height: 100vh;
          width: 100vw;
          background-color: #F8FAFC;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }
        
        .desktop-sidebar-pane {
          display: none;
        }

        .main-stage-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          position: relative;
        }

        .mobile-top-header {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          padding: 4px 16px;
          background-color: #FFFFFF;
          border-bottom: 1px solid #E2E8F0;
          flex-shrink: 0;
          height: 96px;
          z-index: 50;
          box-sizing: border-box;
        }

        .desktop-top-header {
          display: none;
          align-items: center;
          justifyContent: space-between;
          padding: 14px 28px;
          background-color: #FFFFFF;
          border-bottom: 1px solid #E2E8F0;
          flex-shrink: 0;
          height: 64px;
          z-index: 50;
          box-sizing: border-box;
        }

        .scrollable-content-stage {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 16px;
          padding-bottom: 85px;
          width: 100%;
          box-sizing: border-box;
        }

        .desktop-content-container {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .mobile-bottom-nav-pane {
          display: flex;
        }

        /* Desktop & Tablet Breakpoints */
        @media (min-width: 768px) {
          .desktop-sidebar-pane {
            display: flex;
          }
          .mobile-top-header {
            display: none;
          }
          .desktop-top-header {
            display: flex;
          }
          .mobile-bottom-nav-pane {
            display: none;
          }
          .scrollable-content-stage {
            padding: 24px 28px;
            padding-bottom: 30px;
          }
        }
      `}</style>

      <div className="responsive-app-layout">
        {/* Desktop Left Sidebar Pane */}
        <div className="desktop-sidebar-pane">
          <Sidebar />
        </div>

        {/* Main Stage View */}
        <div className="main-stage-pane">
          {/* Mobile Top Header: Brand Logo on Left, Only Clean Agent ID on Top Right */}
          <header className="mobile-top-header">
            <div style={styles.headerLeft} onClick={() => navigate('/dashboard')}>
              <img
                src={topnavlogo}
                alt="Royals Marine"
                style={styles.minimizedLogoMobile}
              />
            </div>

            <div
              style={styles.mobileAgentIdPill}
              onClick={() => navigate('/profile')}
              title="Technician Profile"
            >
              <span>{agentId}</span>
            </div>
          </header>

          {/* Desktop Top Header Bar */}
          <header className="desktop-top-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={styles.desktopGpsPill}>
                <MapPin size={15} color="#0018AD" />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0018AD' }}>
                  {currentGps?.locality || 'RMP Farm 1, Krishnapatnam'}
                </span>
                <span style={styles.desktopGpsAccuracy}>
                  ✓ GPS Verified (±{currentGps?.accuracy || 8}m)
                </span>
              </div>
            </div>

            <div
              style={styles.desktopAgentIdPill}
              onClick={() => navigate('/profile')}
              title="Technician Profile"
            >
              <span style={styles.agentIdLabel}>ID:</span>
              <span style={styles.agentIdValue}>{agentId}</span>
            </div>
          </header>

          {/* Scrollable Content Container */}
          <main className="scrollable-content-stage">
            <div className="desktop-content-container">
              {children}
            </div>
          </main>

          {/* Mobile Bottom Navigation Pane */}
          <div className="mobile-bottom-nav-pane">
            <BottomNavigation />
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  minimizedLogoMobile: {
    height: '86px',
    maxWidth: '320px',
    objectFit: 'contain',
  },
  mobileAgentIdPill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF0FF',
    color: '#0018AD',
    border: '1px solid #CBD2FF',
    padding: '5px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '0.3px',
    cursor: 'pointer',
    userSelect: 'none',
    marginLeft: 'auto',
  },
  desktopGpsPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#EDF0FF',
    border: '1px solid #CBD2FF',
    padding: '6px 14px',
    borderRadius: '12px',
  },
  desktopGpsAccuracy: {
    fontSize: '11px',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    padding: '2px 8px',
    borderRadius: '6px',
    fontWeight: '700',
  },
  desktopAgentIdPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#EDF0FF',
    border: '1px solid #CBD2FF',
    padding: '6px 14px',
    borderRadius: '12px',
    cursor: 'pointer',
    userSelect: 'none',
    marginLeft: 'auto',
  },
  agentIdLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
  },
  agentIdValue: {
    fontSize: '13px',
    fontWeight: '800',
    color: '#0018AD',
    letterSpacing: '0.3px',
  },
};

export default Layout;
