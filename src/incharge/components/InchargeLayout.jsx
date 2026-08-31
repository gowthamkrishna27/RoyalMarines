import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import InchargeSidebar from './InchargeSidebar';
import InchargeBottomNavigation from './InchargeBottomNavigation';

export const InchargeNavContext = createContext({
  isMobileSidebarOpen: false,
  toggleMobileSidebar: () => {},
  closeMobileSidebar: () => {}
});

export const useInchargeNav = () => useContext(InchargeNavContext);

const InchargeLayout = ({ children }) => {
  const location = useLocation();
  const scrollContainerRef = useRef(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsMobileSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  const toggleMobileSidebar = () => setIsMobileSidebarOpen(prev => !prev);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  return (
    <InchargeNavContext.Provider value={{ isMobileSidebarOpen, toggleMobileSidebar, closeMobileSidebar }}>
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--color-bg-main)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Mobile Backdrop Overlay for Sidebar */}
        {isMobile && isMobileSidebarOpen && (
          <div 
            onClick={closeMobileSidebar}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(2px)',
              zIndex: 998,
              transition: 'opacity 0.2s ease'
            }}
          />
        )}

        <InchargeSidebar 
          isMobile={isMobile}
          isOpen={isMobileSidebarOpen}
          onClose={closeMobileSidebar}
        />

        <div style={{
          marginLeft: isMobile ? 0 : '260px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          width: isMobile ? '100vw' : 'calc(100vw - 260px)',
          transition: 'margin-left 0.25s ease'
        }}>
          <div 
            ref={scrollContainerRef}
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              WebkitOverflowScrolling: 'touch',
              paddingBottom: isMobile ? '72px' : '0'
            }}
          >
            {children}
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar with popup sheets */}
        <InchargeBottomNavigation />
      </div>
    </InchargeNavContext.Provider>
  );
};

export default InchargeLayout;
