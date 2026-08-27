import React from 'react';
import PageHeader from '../components/PageHeader';
import { getActivities } from '../utils/adminMockData';
import { Shield, Users, HardHat, Search } from 'lucide-react';

const ActivityLog = () => {
  const activities = getActivities();

  return (
    <>
      <PageHeader title="Organization Activity Log" breadcrumbs={[{ label: 'System' }, { label: 'Activity Log', active: true }]} />
      <div className="content-inner">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div className="input-field" style={{ flex: 1, maxWidth: '400px', margin: 0, padding: '8px 12px' }}>
              <Search size={18} color="var(--color-text-muted)" />
              <input type="text" placeholder="Search logs..." />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Time</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>User & Role</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Action</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Module</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Region</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((act) => (
                  <tr key={act.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px', fontSize: '13px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {act.time}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {act.role === 'Admin' ? <Shield size={14} color="#818cf8" /> : (act.role === 'Incharge' ? <Users size={14} color="#38bdf8" /> : <HardHat size={14} color="#10b981" />)}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600 }}>{act.user}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{act.role}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{act.action}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{act.detail}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, backgroundColor: '#f1f5f9', color: 'var(--color-text-muted)' }}>
                        {act.module}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{act.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActivityLog;
