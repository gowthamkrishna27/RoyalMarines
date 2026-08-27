import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare, 
  Droplets, 
  Network, 
  TestTube, 
  CheckCircle, 
  Calendar, 
  BarChart, 
  Download, 
  Activity, 
  Settings,
  LogOut
} from 'lucide-react';
import { logoutIncharge } from '../utils/inchargeAuth';

const navItems = [
  { path: '/incharge/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/incharge/agents', label: 'My Agents', icon: Users },
  { path: '/incharge/farmers', label: 'Farmers', icon: UserSquare },
  { path: '/incharge/tanks', label: 'Tanks', icon: Droplets },
  { path: '/incharge/allocations', label: 'Allocations', icon: Network },
  { path: '/incharge/tests', label: 'Tests', icon: TestTube },
  { path: '/incharge/verifications', label: 'Verifications', icon: CheckCircle },
  { path: '/incharge/weekly-tests', label: 'Weekly Tests', icon: Calendar },
  { path: '/incharge/reports', label: 'Reports', icon: BarChart },
  { path: '/incharge/export-data', label: 'Export Data', icon: Download },
  { path: '/incharge/activity-log', label: 'Activity Log', icon: Activity },
  { path: '/incharge/settings', label: 'Settings', icon: Settings },
];

const InchargeSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutIncharge();
    navigate('/incharge-login');
  };

  return (
    <div style={{
      width: '260px',
      height: '100vh',
      backgroundColor: 'var(--color-secondary)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--color-border)',
      position: 'fixed',
      left: 0,
      top: 0
    }}>
      <div style={{
        padding: '24px 20px',
        fontSize: '20px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: 'var(--color-accent)',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'var(--color-primary)'
        }}>
          <Droplets size={20} />
        </div>
        AquaFeed
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
                color: isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                backgroundColor: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                borderLeft: isActive ? '4px solid var(--color-accent)' : '4px solid transparent',
                transition: 'all 0.2s'
              })}
            >
              <Icon size={20} />
              <span style={{ fontSize: '15px', fontWeight: 500 }}>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <button 
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 24px',
            color: 'rgba(255,255,255,0.7)',
            background: 'none',
            border: 'none',
            width: '100%',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 500,
            textAlign: 'left'
          }}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default InchargeSidebar;
