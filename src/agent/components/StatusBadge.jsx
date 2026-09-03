import React from 'react';

const StatusBadge = ({ status = '' }) => {
  let bgColor, textColor, borderColor;

  const s = (status || '').toLowerCase();

  if (['completed', 'verified', 'approved', 'active', 'success', 'pass'].includes(s)) {
    bgColor = '#E8F8EE';
    textColor = '#22A65A';
    borderColor = '#22A65A';
  } else if (['due', 'pending', 'pending verification', 'pending verify', 'warning'].includes(s)) {
    bgColor = '#FFF5D6';
    textColor = '#E9A400';
    borderColor = '#E9A400';
  } else if (['overdue', 'rejected', 'error', 'failed', 'inactive'].includes(s)) {
    bgColor = '#FDECEC';
    textColor = '#DC3F3F';
    borderColor = '#DC3F3F';
  } else {
    bgColor = '#EAF3FF';
    textColor = '#2563D9';
    borderColor = '#DCE4EE';
  }

  return (
    <span style={{
      backgroundColor: bgColor,
      color: textColor,
      border: `1px solid ${borderColor}`,
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      display: 'inline-block'
    }}>
      {status}
    </span>
  );
};

export default StatusBadge;
