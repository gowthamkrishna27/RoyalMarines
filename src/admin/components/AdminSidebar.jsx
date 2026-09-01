import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutGrid, Globe, Users, UserCheck, Tractor, 
  ClipboardList, ShieldCheck, BarChart3, Download, 
  History, Settings 
} from 'lucide-react';

const AdminSidebar = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutGrid size={18} /> },
    { name: 'Regions & Localities', path: '/admin/regions', icon: <Globe size={18} /> },
    { name: 'Incharges', path: '/admin/incharges', icon: <Users size={18} /> },
    { name: 'Agents', path: '/admin/agents', icon: <UserCheck size={18} /> },
    { name: 'Farmers', path: '/admin/farmers', icon: <Tractor size={18} /> },
    { name: 'Field Data', path: '/admin/field-data', icon: <ClipboardList size={18} /> },

    { name: 'Analytics Suite', path: '/admin/analytics', icon: <BarChart3 size={18} /> },
    { name: 'Export Center', path: '/admin/export-center', icon: <Download size={18} /> },
    { name: 'Audit Logs', path: '/admin/activity-log', icon: <History size={18} /> },
    { name: 'System Settings', path: '/admin/settings', icon: <Settings size={18} /> }
  ];

  return (
    <aside style={styles.sidebarContainer}>
      <div style={styles.portalTag}>
        ENTERPRISE ADMIN PORTAL
      </div>

      <nav style={styles.navList}>
        {menuItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.activeLink : styles.inactiveLink)
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: isActive ? '#ffffff' : '#475569',
                  transition: 'color 0.15s'
                }}>
                  {item.icon}
                </span>
                <span style={{ 
                  fontSize: '13.5px', 
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : '#334155'
                }}>
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

const styles = {
  sidebarContainer: {
    width: '235px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '16px 10px',
    margin: '16px 0 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 100px)',
    overflowY: 'auto',
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  portalTag: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#94a3b8',
    letterSpacing: '0.6px',
    padding: '6px 12px 14px 12px',
    textTransform: 'uppercase',
    borderBottom: '1px solid #f1f5f9',
    marginBottom: '8px'
  },
  navList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '10px',
    textDecoration: 'none',
    transition: 'all 0.15s ease-in-out',
    cursor: 'pointer'
  },
  activeLink: {
    backgroundColor: '#1d4ed8', // Vibrant deep blue as seen in screenshot
    boxShadow: '0 2px 6px rgba(29, 78, 216, 0.25)'
  },
  inactiveLink: {
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: '#f8fafc'
    }
  }
};

export default AdminSidebar;
