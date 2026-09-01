import React, { useState } from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { Search, Filter, Calendar, CheckCircle2, Clock, AlertTriangle, UserCheck } from 'lucide-react';

const WeeklyTests = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('Week 35 (Current)');
  const { db, getFarmersByAgentId, getTanksByFarmerId, getSubmissionsByAgentId, getAgentsByInchargeId } = useMockData();
  
  const inchargeAgentsList = getAgentsByInchargeId ? getAgentsByInchargeId('INC001') : (db?.agents || []);
  const agents = inchargeAgentsList.map(a => {
    const farmers = getFarmersByAgentId(a.id);
    const tanks = farmers.reduce((acc, f) => acc + getTanksByFarmerId(f.id).length, 0);
    const tests = getSubmissionsByAgentId(a.id).length;
    const due = Math.max(0, Math.floor(tanks * 0.15));
    const overdue = Math.max(0, Math.floor(tanks * 0.05));
    const compliance = tanks > 0 ? Math.min(100, Math.round((tests / (tests + due + overdue || 1)) * 100)) : 100;
    return { ...a, tanks, tests, due, overdue, compliance };
  });
  
  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.locality || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAssignedTanks = agents.reduce((acc, a) => acc + a.tanks, 0);
  const totalCompletedTests = agents.reduce((acc, a) => acc + a.tests, 0);
  const totalDueTests = agents.reduce((acc, a) => acc + a.due, 0);
  const totalOverdueTests = agents.reduce((acc, a) => acc + a.overdue, 0);
  const avgCompliance = agents.length > 0 ? Math.round(agents.reduce((acc, a) => acc + a.compliance, 0) / agents.length) : 100;

  return (
    <>
      <InchargeHeader title="Weekly Test Compliance" />

      <div style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto' }}>
        {/* Quick Summary Bar */}
        <div style={styles.summaryBar}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Monitored Ponds</span>
            <span style={styles.summaryValue}>{totalAssignedTanks}</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Completed Audits</span>
            <span style={{ ...styles.summaryValue, color: '#16A34A' }}>{totalCompletedTests}</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Due This Week</span>
            <span style={{ ...styles.summaryValue, color: '#D97706' }}>{totalDueTests}</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Overdue Samples</span>
            <span style={{ ...styles.summaryValue, color: '#DC2626' }}>{totalOverdueTests}</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Overall Compliance</span>
            <span style={{ ...styles.summaryValue, color: '#1A2FB8' }}>{avgCompliance}%</span>
          </div>
        </div>

        {/* Weekly Test Compliance Progress Card */}
        <div style={{ ...styles.mainCard, marginBottom: '20px', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Weekly Test Compliance</h3>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '3px 0 0 0' }}>Current Week Cluster Testing Progress</p>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
              78% Completed
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {/* Completed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
                  <span style={{ fontWeight: '700', color: '#0F172A' }}>Completed</span>
                </div>
                <span style={{ fontWeight: '800', color: '#16A34A', fontSize: '13.5px' }}>78%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '78%', height: '100%', backgroundColor: '#16A34A', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Due */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284C7' }} />
                  <span style={{ fontWeight: '700', color: '#0F172A' }}>Due</span>
                </div>
                <span style={{ fontWeight: '800', color: '#0284C7', fontSize: '13.5px' }}>14%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '14%', height: '100%', backgroundColor: '#0284C7', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Overdue */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
                  <span style={{ fontWeight: '700', color: '#0F172A' }}>Overdue</span>
                </div>
                <span style={{ fontWeight: '800', color: '#DC2626', fontSize: '13.5px' }}>5%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '5%', height: '100%', backgroundColor: '#DC2626', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Scheduled */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8B5CF6' }} />
                  <span style={{ fontWeight: '700', color: '#0F172A' }}>Scheduled</span>
                </div>
                <span style={{ fontWeight: '800', color: '#8B5CF6', fontSize: '13.5px' }}>3%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '3%', height: '100%', backgroundColor: '#8B5CF6', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div style={styles.mainCard}>
          <div style={styles.actionBar}>
            <div style={styles.searchGroup}>
              <div style={styles.searchBox}>
                <Search size={17} color="#64748B" />
                <input 
                  type="text" 
                  placeholder="Search technician by name or assigned area..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
              </div>

              <div style={styles.weekSelectWrapper}>
                <Calendar size={15} color="#1A2FB8" />
                <select 
                  value={selectedWeek} 
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  style={styles.weekSelect}
                >
                  <option value="Week 35 (Current)">Week 35 (Current Cycle)</option>
                  <option value="Week 34 (Aug 16 - Aug 22)">Week 34 (Aug 16 - Aug 22)</option>
                  <option value="Week 33 (Aug 09 - Aug 15)">Week 33 (Aug 09 - Aug 15)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Compliance Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Technician</th>
                  <th style={styles.th}>Supervised Ponds</th>
                  <th style={styles.th}>Completed Audits</th>
                  <th style={styles.th}>Due This Week</th>
                  <th style={styles.th}>Overdue</th>
                  <th style={styles.th}>Weekly Compliance</th>
                  <th style={styles.th}>Compliance Grade</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => {
                  const isExcellent = agent.compliance >= 90;
                  const isModerate = agent.compliance >= 75 && agent.compliance < 90;

                  return (
                    <tr key={agent.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={styles.agentAvatar}>
                            {agent.name ? agent.name[0] : 'T'}
                          </div>
                          <div>
                            <div style={styles.agentName}>{agent.name}</div>
                            <div style={styles.agentArea}>{agent.locality || 'Coastal Andhra'}</div>
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
                          {agent.tanks} Ponds
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.completedPill}>
                          <CheckCircle2 size={12} /> {agent.tests} Done
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.duePill}>
                          <Clock size={12} /> {agent.due} Due
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={agent.overdue > 0 ? styles.overduePill : styles.zeroOverduePill}>
                          {agent.overdue > 0 && <AlertTriangle size={12} />}
                          {agent.overdue} Overdue
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={styles.progressBarBg}>
                            <div 
                              style={{ 
                                ...styles.progressBarFill, 
                                width: `${agent.compliance}%`,
                                backgroundColor: isExcellent ? '#16A34A' : isModerate ? '#D97706' : '#DC2626'
                              }} 
                            />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                            {agent.compliance}%
                          </span>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={isExcellent ? styles.gradeGood : isModerate ? styles.gradeAvg : styles.gradePoor}>
                          {isExcellent ? 'Excellent' : isModerate ? 'Moderate' : 'Action Needed'}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {filteredAgents.length === 0 && (
                  <tr>
                    <td colSpan="7" style={styles.emptyTd}>
                      No technician compliance records found.
                    </td>
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
  summaryBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px 24px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    flexWrap: 'wrap',
    gap: '12px',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  summaryLabel: {
    fontSize: '11.5px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  summaryValue: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryDivider: {
    width: '1px',
    height: '32px',
    backgroundColor: '#F1F5F9',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '20px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  searchGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    maxWidth: '650px',
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '8px 14px',
    flex: 1,
    minWidth: '260px',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '13px',
    color: '#0F172A',
    width: '100%',
  },
  weekSelectWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#EFF6FF',
    border: '1px solid #DBEAFE',
    borderRadius: '8px',
    padding: '0 12px',
  },
  weekSelect: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '13px',
    fontWeight: '600',
    color: '#1A2FB8',
    padding: '8px 0',
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    borderBottom: '2px solid #F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  th: {
    padding: '12px 14px',
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
    padding: '14px',
    verticalAlign: 'middle',
  },
  agentAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    fontWeight: '800',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentName: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#0F172A',
  },
  agentArea: {
    fontSize: '11px',
    color: '#64748B',
  },
  completedPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  duePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  overduePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
  zeroOverduePill: {
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: '600',
  },
  progressBarBg: {
    width: '80px',
    height: '6px',
    backgroundColor: '#E2E8F0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
  },
  gradeGood: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#F0FDF4',
    border: '1px solid #DCFCE7',
    color: '#16A34A',
  },
  gradeAvg: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#FFFBEB',
    border: '1px solid #FEF3C7',
    color: '#D97706',
  },
  gradePoor: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FEE2E2',
    color: '#DC2626',
  },
  emptyTd: {
    padding: '32px',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '13px',
  },
};

export default WeeklyTests;

