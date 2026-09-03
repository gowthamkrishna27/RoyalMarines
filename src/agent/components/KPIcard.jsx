import React from 'react';

const KPIcard = ({ value, label, colorClass, onClick }) => {
  // Map color class to actual CSS variable for the border
  const getBorderColor = () => {
    switch (colorClass) {
      case 'blue': return '#0018AD';
      case 'green': return '#22A65A';
      case 'yellow': return '#E9A400';
      case 'red': return '#DC3F3F';
      case 'orange': return '#E9A400';
      case 'teal': return '#0018AD';
      default: return '#0018AD';
    }
  };

  const style = {
    ...styles.card,
    borderRight: `4px solid ${getBorderColor()}`,
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
  };

  return (
    <div style={style} className="card" onClick={onClick} title={`Click to view ${label}`}>
      <div style={styles.value}>{value}</div>
      <div style={styles.label}>{label}</div>
    </div>
  );
};

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '16px',
    height: '90px',
  },
  value: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--color-text-main)',
    marginBottom: '4px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
  }
};

export default KPIcard;
