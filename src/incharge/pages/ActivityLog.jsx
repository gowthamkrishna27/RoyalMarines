import React from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';

const ActivityLog = () => {
  const { db } = useMockData();
  const activities = db.activities || [];

  return (
    <>
      <InchargeHeader title="Activity Log" />
      <div className="content-inner">
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Date & Time</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Action</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((act) => (
                  <tr key={act.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{act.time}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500 }}>{act.action}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{act.detail}</td>
                  </tr>
                ))}
                {activities.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No activities yet.</td>
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

export default ActivityLog;
