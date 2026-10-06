import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid, Globe, Users, UserCheck, Tractor,
  ClipboardList, BarChart3, Download, History, Settings, Database
} from 'lucide-react';

const AdminSidebar = ({ onNavigate, isMobileDrawer = false }) => {
  const navSections = [
    {
      title: 'ENTERPRISE ADMIN PORTAL',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutGrid size={20} /> },
        { name: 'Regions & Localities', path: '/admin/regions', icon: <Globe size={20} /> },
        { name: 'ASMs', path: '/admin/incharges', icon: <Users size={20} /> },
        { name: 'Agents', path: '/admin/agents', icon: <UserCheck size={20} /> },
        { name: 'Farmers', path: '/admin/farmers', icon: <Tractor size={20} /> },
        { name: 'Field Data', path: '/admin/field-data', icon: <ClipboardList size={20} /> },
        { name: 'Analytics Suite', path: '/admin/analytics', icon: <BarChart3 size={20} /> },
        { name: 'Export Center', path: '/admin/export-center', icon: <Download size={20} /> },
        { name: 'Audit Logs', path: '/admin/activity-log', icon: <History size={20} /> },
        { name: 'System Settings', path: '/admin/settings', icon: <Settings size={20} /> }
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
              <div style={styles.sectionTitleWrapper}>
                <div style={styles.sectionTitle}>
                  {section.title}
                </div>
                <div style={styles.separator} />
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
                        color: isActive ? '#FFFFFF' : '#475569',
                        flexShrink: 0
                      }}>
                        {item.icon}
                      </span>
                      <span style={{
                        fontSize: '14.5px',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#FFFFFF' : '#1E293B',
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
    gap: '8px'
  },
  sectionTitleWrapper: {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 10px 4px'
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#94A3B8',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    marginBottom: '16px'
  },
  separator: {
    height: '1px',
    backgroundColor: '#F1F5F9',
    width: '100%'
  },
  sectionItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 16px',
    borderRadius: '12px',
    textDecoration: 'none',
    transition: 'all 0.15s ease-in-out',
    cursor: 'pointer'
  },
  activeLink: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
  },
  inactiveLink: {
    backgroundColor: 'transparent',
    color: '#1E293B',
  }
};

export default AdminSidebar;
