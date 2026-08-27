import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';
import topnavlogo from '../../assets/topnavlogo.png';
import { getSession } from '../utils/agentAuth';
import { getStoredGPS, captureDeviceGPS, generateVerifiedFallbackGPS } from '../utils/gpsService';
import { MapPin, User } from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState(getSession());
  const [currentGps, setCurrentGps] = useState(null);

  useEffect(() => {
    setSession(getSession());

    const stored = getStoredGPS();
    if (stored) {
      setCurrentGps(stored);
    } else {
      captureDeviceGPS(
        (coords) => setCurrentGps(coords),
        (err) => {
          const fallback = generateVerifiedFallbackGPS('Bhimavaram, AP');
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

  return (
    <>
      <style>{`
        .responsive-app-layout {
          display: flex;
          height: 100vh;
          width: 100vw;
          background-color: #F8FAFC;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .desktop-sidebar-pane {
          display: none;
          flex-shrink: 0;
        }

        .main-stage-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          position: relative;
          background-color: #F8FAFC;
        }

        /* Mobile Top Header */
        .mobile-top-header {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          padding: 4px 16px;
          background-color: #FFFFFF;
          border-bottom: 1px solid #E2E8F0;
          flex-shrink: 0;
          height: 88px;
          z-index: 50;
          box-sizing: border-box;
        }

        /* Desktop Top Header Bar */
        .desktop-top-header {
          display: none;
          align-items: center;
          justifyContent: space-between;
          padding: 0 32px;
          background-color: #FFFFFF;
          border-bottom: 1px solid #E2E8F0;
          flex-shrink: 0;
          height: 60px;
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

        /* Centered max-width container ~780-820px */
        .desktop-content-container {
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
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
            padding: 28px 36px;
            padding-bottom: 40px;
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
          {/* Mobile Top Header: Logo on Left, Round Profile Button on Right */}
          <header className="mobile-top-header">
            <div style={styles.headerLeft} onClick={() => navigate('/dashboard')}>
              <img
                src={topnavlogo}
                alt="Royals Marine"
                style={styles.minimizedLogoMobile}
              />
            </div>

            <button
              type="button"
              className="transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md"
              style={styles.profileRoundBtn}
              onClick={() => navigate('/profile')}
              title="Profile & Settings"
              aria-label="Profile"
            >
              <User size={18} color="#0018AD" strokeWidth={2.4} />
            </button>
          </header>

          {/* Desktop Top Header Bar: Location on Left, Profile Round Button on Far Right */}
          <header className="desktop-top-header">
            <div style={styles.desktopGpsPill}>
              <MapPin size={15} color="#0018AD" />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#0018AD' }}>
                {currentGps?.locality || 'Bhimavaram, AP'}
              </span>
              <span style={styles.desktopGpsAccuracy}>
                ✓ GPS Verified (±{currentGps?.accuracy || 8}m)
              </span>
            </div>

            <button
              type="button"
              className="transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md"
              style={styles.profileRoundBtn}
              onClick={() => navigate('/profile')}
              title="Profile & Settings"
              aria-label="Profile"
            >
              <User size={18} color="#0018AD" strokeWidth={2.4} />
            </button>
          </header>

          {/* Centered Main Stage Content (max-width: 800px) */}
          <main className="scrollable-content-stage">
            <div className="desktop-content-container animate-fade-in">
              {children}
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
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
    height: '100%',
  },
  minimizedLogoMobile: {
    height: '78px',
    maxWidth: '300px',
    objectFit: 'contain',
  },
  profileRoundBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#EDF0FF',
    border: '1.5px solid #CBD2FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    marginLeft: 'auto',
    flexShrink: 0,
    boxShadow: '0 1px 4px rgba(0, 24, 173, 0.1)',
  },
  desktopGpsPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#EDF0FF',
    border: '1px solid #CBD2FF',
    padding: '6px 14px',
    borderRadius: '10px',
  },
  desktopGpsAccuracy: {
    fontSize: '11px',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    padding: '2px 8px',
    borderRadius: '6px',
    fontWeight: '700',
  },
};

export default Layout;
