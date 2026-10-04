import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';

const TodaysWork = ({ tasks }) => {
  const navigate = useNavigate();
  return (
    <div style={styles.container}>
      <div className="section-title">
        <span>Today's Work</span>
        <span className="link" onClick={() => navigate('/tests')} style={{ cursor: 'pointer' }}>View All</span>
      </div>
      
      <div style={styles.list}>
        {tasks.map(task => (
          <div 
            key={task.id} 
            className="card" 
            style={styles.taskCard}
            onClick={() => navigate(`/tanks/${task.tankId}`)}
          >
            <div style={styles.taskInfo}>
              <div style={styles.taskHeader}>
                <span style={styles.farmerName}>{task.farmerName}</span>
                <span style={styles.tankName}>{task.tankName}</span>
              </div>
              <div style={styles.taskMeta}>
                {task.type} • {task.date}
              </div>
            </div>
            <div style={styles.taskAction}>
              <StatusBadge status={task.status} />
              <ArrowRight size={18} color="var(--color-primary)" style={{ marginLeft: '12px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginTop: '24px',
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
  },
  taskInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  taskHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  farmerName: {
    fontWeight: '600',
    fontSize: '15px',
    color: 'var(--color-text-main)',
  },
  tankName: {
    fontSize: '12px',
    color: '#2563D9',
    backgroundColor: '#EAF3FF',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '500',
  },
  taskMeta: {
    fontSize: '13px',
    color: '#64748B',
  },
  taskAction: {
    display: 'flex',
    alignItems: 'center',
  }
};

export default TodaysWork;
