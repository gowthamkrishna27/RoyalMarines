import React, { useState } from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { Activity, Clock, ShieldCheck, UserCheck, AlertCircle, Search } from 'lucide-react';

const ActivityLog = () => {
  const { db } = useMockData();
  const [searchTerm, setSearchTerm] = useState('');
  
  const activities = (db?.activities || [
    { id: '1', time: 'Today, 11:20 AM', action: 'Approved Test', detail: 'Verified Weekly Water Quality for Tank 3 (Ramesh Kumar)', actor: 'M. Srinivas (ASM)' },
    { id: '2', time: 'Today, 09:45 AM', action: 'Requested Changes', detail: 'Flagged atypical DO reading on Tank 1 (Siva Prasad)', actor: 'M. Srinivas (ASM)' },
    { id: '3', time: 'Yesterday, 04:30 PM', action: 'Territory Allocation', detail: 'Assigned 3 new farms in Undi Mandal to Tech Ramesh', actor: 'M. Srinivas (ASM)' },
    { id: '4', time: '22 Aug, 02:15 PM', action: 'Farmer Enrolled', detail: 'Added new farmer Venkat Rao with 2 Vannamei ponds', actor: 'Tech Ramesh' },
  ]);

  const filteredActivities = activities.filter(act => 
    act.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.detail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <InchargeHeader title="ASM Activity & Audit Log" />

      <div style={{ padding: '24px 28px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={styles.card}>
          
          <div style={styles.headerRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#1A2FB8" />
              <h3 style={styles.cardTitle}>System Action Ledger</h3>
            </div>

            <div style={styles.searchBox}>
              <Search size={15} color="#64748B" />
              <input 
                type="text" 
                placeholder="Search audit trail..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>Action Category</th>
                  <th style={styles.th}>Event Description</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Actor</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((act, index) => {
                  const isApprove = act.action.toLowerCase().includes('approved');
                  const isChange = act.action.toLowerCase().includes('requested') || act.action.toLowerCase().includes('reject');
                  
                  return (
                    <tr key={act.id || index} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#64748B' }}>
                          <Clock size={13} color="#94A3B8" />
                          <span>{act.time}</span>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={isApprove ? styles.approveBadge : isChange ? styles.changeBadge : styles.neutralBadge}>
                          {act.action}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
                          {act.detail}
                        </span>
                      </td>

                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
                          {act.actor || 'M. Srinivas'}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {filteredActivities.length === 0 && (
                  <tr>
                    <td colSpan="4" style={styles.emptyTd}>No log entries match your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid #F1F5F9',
    flexWrap: 'wrap',
    gap: '12px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '6px 12px',
    minWidth: '240px',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '12.5px',
    color: '#0F172A',
    width: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '2px solid #E2E8F0',
  },
  th: {
    padding: '10px 14px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '13px 14px',
    verticalAlign: 'middle',
  },
  approveBadge: {
    display: 'inline-flex',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: '11.5px',
    fontWeight: '700',
  },
  changeBadge: {
    display: 'inline-flex',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    fontSize: '11.5px',
    fontWeight: '700',
  },
  neutralBadge: {
    display: 'inline-flex',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    fontSize: '11.5px',
    fontWeight: '700',
  },
  emptyTd: {
    padding: '32px',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '13px',
  },
};

export default ActivityLog;

