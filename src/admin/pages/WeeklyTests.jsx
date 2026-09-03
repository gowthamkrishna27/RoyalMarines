import React from 'react';
import PageHeader from '../components/PageHeader';
import { getRegions } from '../utils/adminMockData';
import { Filter, Calendar, Map, CheckSquare } from 'lucide-react';

const WeeklyTests = () => {
  const regions = getRegions();

  return (
    <>
      <PageHeader title="Organization-wide Weekly Tests" breadcrumbs={[{ label: 'Monitoring' }, { label: 'Weekly Tests', active: true }]} />
      <div className="content-inner">
        
        {/* Filters */}
        <div className="card" style={{ marginBottom: '24px', padding: '16px 24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-muted)' }}>Date Range</label>
              <div className="input-field" style={{ margin: 0 }}>
                <Calendar size={16} />
                <select style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none' }}>
                  <option>This Week (Aug 17 - Aug 23)</option>
                  <option>Last Week (Aug 10 - Aug 16)</option>
                  <option>This Month (August)</option>
                </select>
              </div>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-muted)' }}>Region</label>
              <div className="input-field" style={{ margin: 0 }}>
                <Map size={16} />
                <select style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none' }}>
                  <option>All Regions</option>
                  {regions.map(r => <option key={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-muted)' }}>Status</label>
              <div className="input-field" style={{ margin: 0 }}>
                <CheckSquare size={16} />
                <select style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none' }}>
                  <option>All Statuses</option>
                  <option>Completed</option>
                  <option>Due</option>
                  <option>Overdue</option>
                </select>
              </div>
            </div>
            <button className="btn-primary" style={{ padding: '10px 24px', height: '42px' }}>
              <Filter size={16} style={{ marginRight: '8px', display: 'inline' }} />
              Apply Filters
            </button>
          </div>
        </div>

        {/* Compliance Table */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Regional Compliance Summary</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Region</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Total Tanks</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Tests Completed</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Due Soon</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Overdue</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Compliance %</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((region) => {
                  const completed = Math.floor(region.tanks * (region.compliance / 100));
                  const overdue = Math.floor(region.tanks * 0.05); // Mock 5% overdue
                  const due = region.tanks - completed - overdue;
                  return (
                    <tr key={region.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>{region.name}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{region.tanks}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--status-green)', fontWeight: 600 }}>{completed}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--status-yellow)', fontWeight: 600 }}>{due}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--status-red)', fontWeight: 600 }}>{overdue}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${region.compliance}%`, height: '100%', backgroundColor: region.compliance >= 90 ? 'var(--status-green)' : 'var(--status-yellow)' }} />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{region.compliance}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
};

export default WeeklyTests;
