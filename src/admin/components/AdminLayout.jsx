import React, { useState } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import { X } from 'lucide-react';

const AdminLayout = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div style={styles.layoutContainer}>
      <AdminHeader onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)} />
      
      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="animate-backdrop-in"
          style={styles.mobileBackdrop}
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <div 
            className="animate-drawer-in"
            style={styles.mobileDrawer}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.drawerHeader}>
              <span style={styles.drawerTitle}>ADMIN MENU</span>
              <button 
                type="button"
                style={styles.drawerCloseBtn}
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>
            <div style={styles.drawerBody}>
              <AdminSidebar onNavigate={() => setIsMobileSidebarOpen(false)} isMobileDrawer={true} />
            </div>
          </div>
        </div>
      )}

      <div style={styles.bodyWrapper}>
        <div className="hidden lg:flex flex-shrink-0">
          <AdminSidebar />
        </div>
        <main style={styles.mainContent}>
          <div className="w-full max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const styles = {
  layoutContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    height: '100dvh',
    width: '100vw',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  bodyWrapper: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  mainContent: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: 'clamp(12px, 3vw, 24px)',
    paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
    boxSizing: 'border-box',
    width: '100%',
  },
  mobileBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    zIndex: 99999,
    display: 'flex',
  },
  mobileDrawer: {
    width: '84%',
    maxWidth: '300px',
    height: '100%',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
    paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
    boxSizing: 'border-box',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #E2E8F0',
  },
  drawerTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.6px',
  },
  drawerCloseBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  drawerBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
  }
};

export default AdminLayout;
