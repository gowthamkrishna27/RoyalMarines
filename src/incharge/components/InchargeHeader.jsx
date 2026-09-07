import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Clock } from 'lucide-react';
import { getInchargeSession } from '../utils/inchargeAuth';
import BackButton from '../../components/BackButton';
import topnavlogo from '../../assets/topnavlogo.png';

const InchargeHeader = ({ title = "Dashboard", showBack = false }) => {
  const navigate = useNavigate();
  const session = getInchargeSession();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    return `${dayName} ${dayNum} ${monthName}`;
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? '0' + minutes : minutes;
    const hourStr = hours < 10 ? '0' + hours : hours;
    return `${hourStr}:${minStr} ${ampm}`;
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(formatTime(now));
      setDateStr(formatDate(now));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={styles.header}>
      {/* 1. LEFT: Mobile Logo only (or BackButton when showBack is true) */}
      <div style={styles.leftGroup}>
        {showBack && <BackButton fallback="/incharge/dashboard" />}
        
        {/* Royals Marine Logo (Clickable to Dashboard) */}
        <div 
          style={styles.logoContainer}
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

      {/* 2. RIGHT: Constant Date/Time Badge + Profile Avatar */}
      <div style={styles.rightGroup}>
        {/* Live Date / Time Badge: 🕒 Mon 7 Sept | 01:45 PM */}
        <div style={styles.timeBadge} title="System Live Time">
          <Clock size={13} color="#2563EB" style={{ flexShrink: 0 }} />
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
          <User size={15} color="#1A2FB8" strokeWidth={2.4} />
        </button>
      </div>
    </header>
  );
};

const styles = {
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 'max(38px, calc(env(safe-area-inset-top, 0px) + 34px))',
    paddingBottom: '8px',
    paddingLeft: '14px',
    paddingRight: '14px',
    minHeight: '76px',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    boxSizing: 'border-box',
    width: '100%',
    gap: '6px',
  },
  leftGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  logoContainer: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  logoImg: {
    height: '28px',
    maxWidth: '100px',
    objectFit: 'contain',
    display: 'block',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    flexShrink: 0,
  },
  timeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '20px',
    padding: '3px 8px',
    fontSize: '10.5px',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
  },
  dateLabel: {
    color: '#64748B',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    fontSize: '10.5px',
  },
  verticalDivider: {
    color: '#CBD5E1',
    fontWeight: '400',
    margin: '0 2px',
    fontSize: '11px',
    lineHeight: 1,
    userSelect: 'none',
  },
  timeLabel: {
    color: '#1A2FB8',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    fontSize: '11px',
  },
  profileRoundBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#EFF6FF',
    border: '1.5px solid #DBEAFE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.15s',
  },
};

export default InchargeHeader;
