import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, ArrowRight, Filter } from 'lucide-react';
import { getSession } from '../utils/agentAuth';
import { useMockData } from '../../context/MockDataContext';
import StatusBadge from '../components/StatusBadge';

const Tests = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState(location.state?.initialTab || 'Due');
  const { getFarmersByAgentId, getTanksByFarmerId, db } = useMockData();

  useEffect(() => {
    const s = getSession();
    if (!s) {
      navigate('/login');
      return;
    }
    setSession(s);
    if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab);
    }
  }, [navigate, location.state]);

  if (!session) return null;

  const allTests = getFarmersByAgentId(session.agentId).flatMap(farmer => 
    getTanksByFarmerId(farmer.id).map(tank => ({
      id: tank.id,
      farmerName: farmer.name,
      tankName: tank.name,
      type: 'Weekly Test',
      date: tank.nextTest,
      lastTest: tank.lastTest,
      status: tank.testStatus
    }))
  );

  // Filter based on active tab
  const filteredTests = allTests.filter(test => {
    if (activeTab === 'Pending Verification' || activeTab === 'Pending') {
      return test.status === 'Pending' || test.status === 'Pending Verification' || test.status === 'Due';
    }
    return test.status === activeTab;
  });

  return (
    <div>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.iconCircle}>
            <ClipboardList size={24} color="#2563D9" />
          </div>
          <div>
            <h2 style={styles.title}>Weekly Tests</h2>
            <div style={styles.subtitle}>Track your field testing schedule</div>
          </div>
        </div>
      </div>

      <div style={styles.tabsContainer}>
        <div style={styles.tabs}>
          <div 
            style={{...styles.tab, ...(activeTab === 'Due' ? styles.activeTab : {})}} 
            onClick={() => setActiveTab('Due')}
          >
            Due ({allTests.filter(t => t.status === 'Due').length})
          </div>
          <div 
            style={{...styles.tab, ...(activeTab === 'Overdue' ? styles.activeTab : {})}} 
            onClick={() => setActiveTab('Overdue')}
          >
            Overdue ({allTests.filter(t => t.status === 'Overdue').length})
          </div>
          <div 
            style={{...styles.tab, ...(activeTab === 'Completed' ? styles.activeTab : {})}} 
            onClick={() => setActiveTab('Completed')}
          >
            Completed ({allTests.filter(t => t.status === 'Completed').length})
          </div>
          <div 
            style={{...styles.tab, ...(activeTab === 'Pending Verification' || activeTab === 'Pending' ? styles.activeTab : {})}} 
            onClick={() => setActiveTab('Pending Verification')}
          >
            Pending ({allTests.filter(t => t.status === 'Pending' || t.status === 'Pending Verification' || t.status === 'Due').length})
          </div>
        </div>
      </div>

      <div style={styles.list}>
        {filteredTests.length === 0 ? (
          <div style={styles.emptyState}>
            No {activeTab.toLowerCase()} tests found.
          </div>
        ) : (
          filteredTests.map(test => (
            <div 
              key={test.id} 
              className="card" 
              style={styles.taskCard}
              onClick={() => navigate(`/tanks/${test.id}`)}
            >
              <div style={styles.taskInfo}>
                <div style={styles.taskHeader}>
                  <span style={styles.farmerName}>{test.farmerName}</span>
                  <span style={styles.tankName}>{test.tankName}</span>
                </div>
                <div style={styles.taskMeta}>
                  {test.type} • {activeTab === 'Completed' ? `Completed on ${test.lastTest}` : `Due ${test.date}`}
                </div>
              </div>
              <div style={styles.taskAction}>
                <StatusBadge status={test.status} />
                <ArrowRight size={18} color="var(--color-primary)" style={{ marginLeft: '12px' }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#EAF3FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#17233C',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    fontWeight: '600',
  },
  tabsContainer: {
    marginBottom: '24px',
    overflowX: 'auto',
  },
  tabs: {
    display: 'flex',
    gap: '12px',
    borderBottom: '1px solid #DCE4EE',
  },
  tab: {
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748B',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  activeTab: {
    color: '#2563D9',
    borderBottom: '2px solid #2563D9',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  taskCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  taskInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  taskHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  farmerName: {
    fontWeight: '700',
    color: '#17233C',
    fontSize: '15px',
  },
  tankName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#2563D9',
    backgroundColor: '#EAF3FF',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  taskMeta: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: '500',
  },
  taskAction: {
    display: 'flex',
    alignItems: 'center',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#64748B',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px dashed #DCE4EE',
    fontSize: '14px',
    fontWeight: '500',
  }
};

export default Tests;
