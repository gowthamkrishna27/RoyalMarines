import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutGrid, Globe, Users, UserCheck, Tractor, 
  ClipboardList, BarChart3, Download, History, Settings
} from 'lucide-react';

const AdminSidebar = ({ onNavigate, isMobileDrawer = false }) => {
  const navSections = [
    {
      title: null,
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutGrid size={18} /> }
      ]
    },
    {
      title: 'Operations',
      items: [
        { name: 'Regions & Localities', path: '/admin/regions', icon: <Globe size={18} /> },
        { name: 'ASMs', path: '/admin/incharges', icon: <Users size={18} /> },
        { name: 'Agents', path: '/admin/agents', icon: <UserCheck size={18} /> },
        { name: 'Farmers', path: '/admin/farmers', icon: <Tractor size={18} /> },
        { name: 'Field Data', path: '/admin/field-data', icon: <ClipboardList size={18} /> }
      ]
    },
    {
      title: 'Analytics',
      items: [
        { name: 'Analytics Suite', path: '/admin/analytics', icon: <BarChart3 size={18} /> },
        { name: 'Export Center', path: '/admin/export-center', icon: <Download size={18} /> }
      ]
    },
    {
      title: 'Administration',
      items: [
        { name: 'Audit Logs', path: '/admin/activity-log', icon: <History size={18} /> },
        { name: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> }
      ]
    }
  ];

  return (
    <aside style={{
      ...styles.sidebarContainer,
      ...(isMobileDrawer ? styles.mobileSidebarOverride : {})
    }}>
      <nav style={styles.navWrapper}>
        {navSections.map((section, sIdx) => (
          <div key={sIdx} style={styles.sectionGroup}>
            {section.title && (
              <div style={styles.sectionTitle}>
                {section.title}
              </div>
            )}
            <div style={styles.sectionItems}>
              {section.items.map((item, iIdx) => (
                <NavLink
                  key={iIdx}
                  to={item.path}
                  onClick={() => onNavigate && onNavigate()}
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
                        color: isActive ? '#FFFFFF' : '#64748B',
                        flexShrink: 0
                      }}>
                        {item.icon}
                      </span>
                      <span style={{ 
                        fontSize: '13px', 
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#FFFFFF' : '#0F172A',
                        letterSpacing: '-0.01em'
                      }}>
                        {item.name}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
};

const styles = {
  sidebarContainer: {
    width: '240px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '16px 12px',
    margin: '16px 0 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 96px)',
    overflowY: 'auto',
    flexShrink: 0,
    boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  mobileSidebarOverride: {
    width: '100%',
    margin: 0,
    border: 'none',
    boxShadow: 'none',
    height: 'auto',
    borderRadius: 0,
    padding: '8px 4px',
  },
  navWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  sectionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#94A3B8',
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    padding: '4px 10px 4px',
  },
  sectionItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '10px',
    textDecoration: 'none',
    transition: 'all 0.15s ease-in-out',
    cursor: 'pointer'
  },
  activeLink: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
  },
  inactiveLink: {
    backgroundColor: 'transparent',
    color: '#0F172A',
  }
};

export default AdminSidebar;
