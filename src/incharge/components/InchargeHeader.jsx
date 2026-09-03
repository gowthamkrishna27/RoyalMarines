import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Shield, Clock } from 'lucide-react';
import { getInchargeSession } from '../utils/inchargeAuth';
import { useMockData } from '../../context/MockDataContext';
import BackButton from '../../components/BackButton';
import topnavlogo from '../../assets/topnavlogo.png';

const InchargeHeader = ({ title = "Dashboard", showBack = false }) => {
  const navigate = useNavigate();
  const session = getInchargeSession();
  const { db } = useMockData();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  const pendingVerificationsCount = (db?.submissions || []).filter(s => s.status === 'PENDING_VERIFICATION').length;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setDateStr(now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={styles.header}>
      {/* 1. LEFT: Mobile Logo only (or BackButton when showBack is true) */}
      <div style={styles.leftGroup}>
        {showBack && <BackButton fallback="/incharge/dashboard" />}
        
        {/* Royals Marine Logo (Only visible on mobile/tablet where sidebar is hidden) */}
        <div 
          className="flex lg:hidden items-center cursor-pointer"
          onClick={() => navigate('/incharge/dashboard')}
          title="Royals Marine"
        >
          <img 
            src={topnavlogo} 
            alt="Royals Marine" 
            style={styles.logoImg}
          />
        </div>
      </div>

      {/* 2. RIGHT: Date/Time + Profile Symbol */}
      <div style={styles.rightGroup}>
        {/* Live Date / Time Badge: Clock Mon, 31 Aug | 11:10 AM */}
        <div style={styles.timeBadge} title="System Live Time">
          <Clock size={13} color="#1A2FB8" />
          <span style={styles.dateLabel}>{dateStr}</span>
          <span style={styles.verticalDivider}>|</span>
          <span style={styles.timeLabel}>{timeStr}</span>
        </div>

        {/* User Profile Button */}
        <button 
          type="button" 
          onClick={() => navigate('/incharge/settings')}
          style={styles.profileRoundBtn}
          title="ASM Profile & Settings"
          aria-label="Profile"
          className="transition-all duration-150 active:scale-95 cursor-pointer hover:bg-blue-100 hover:border-blue-300"
        >
          <User size={18} color="#1A2FB8" strokeWidth={2.4} />
        </button>
      </div>
    </header>
  );
};

const styles = {
  header: {
    height: '58px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    position: 'sticky',
    top: 0,
    zIndex: 30,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  leftGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  },
  menuBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    border: '1px solid #DBEAFE',
    color: '#1A2FB8',
    cursor: 'pointer',
    flexShrink: 0,
  },
  logoImg: {
    height: '42px',
    maxWidth: '180px',
    objectFit: 'contain',
    display: 'block',
  },
  inchargeTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    fontSize: '9px',
    fontWeight: '800',
    padding: '1.5px 5px',
    borderRadius: '4px',
    border: '1px solid #DBEAFE',
    letterSpacing: '0.4px',
    whiteSpace: 'nowrap',
  },
  titleText: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  timeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '5px 12px',
    fontSize: '12px',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  dateLabel: {
    color: '#64748B',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    fontSize: '12px',
  },
  verticalDivider: {
    color: '#CBD5E1',
    fontWeight: '400',
    margin: '0 6px',
    fontSize: '12px',
    lineHeight: 1,
  },
  timeLabel: {
    color: '#1A2FB8',
    fontWeight: '800',
    whiteSpace: 'nowrap',
    fontSize: '12px',
  },
  profileRoundBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#EFF6FF',
    border: '1px solid #DBEAFE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.15s',
  },
  bellBtn: {
    position: 'relative',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.15s',
  },
  bellBadge: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    fontSize: '9px',
    fontWeight: '800',
    width: '15px',
    height: '15px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5px solid #FFFFFF',
  },
};

export default InchargeHeader;
