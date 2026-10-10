import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { getRegions } from '../utils/adminMockData';
import { useMockData } from '../../context/MockDataContext';
import { Filter, Calendar, Map, CheckSquare } from 'lucide-react';

const WeeklyTests = () => {
  const { db, isLoadingDb, dbConnected } = useMockData();
  const regions = getRegions(db);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState('All Regions');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Statuses');

  const filteredRegions = regions.filter((r) => {
    if (selectedRegionFilter !== 'All Regions' && r.name !== selectedRegionFilter) return false;
    return true;
  });

  return (
    <>
      <PageHeader title="Organization-wide Weekly Tests" />
      <div className="content-inner">
        
        {/* Filters */}
        <div className="card" style={{ marginBottom: '24px', padding: '16px 24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-muted)' }}>Date Range</label>
              <div className="input-field" style={{ margin: 0 }}>
                <Calendar size={16} />
                <select style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none' }}>
                  <option>Current Week</option>
                  <option>Previous Week</option>
                  <option>Current Month</option>
                </select>
              </div>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-muted)' }}>Region</label>
              <div className="input-field" style={{ margin: 0 }}>
                <Map size={16} />
                <select 
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none' }}
                  value={selectedRegionFilter}
                  onChange={(e) => setSelectedRegionFilter(e.target.value)}
                >
                  <option>All Regions</option>
                  {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-muted)' }}>Status</label>
              <div className="input-field" style={{ margin: 0 }}>
                <CheckSquare size={16} />
                <select 
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none' }}
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                >
                  <option>All Statuses</option>
                  <option>Completed</option>
                  <option>Due</option>
                  <option>Overdue</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Table */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Regional Compliance Summary</h3>
          {isLoadingDb ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Loading compliance metrics from database...
            </div>
          ) : filteredRegions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No regions found.
            </div>
          ) : (
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
                  {filteredRegions.map((region) => {
                    const allTanks = db?.tanks || [];
                    const regionTanks = allTanks.filter(t => 
                      String(t.regionId) === String(region.id) || 
                      String(t.region).toLowerCase() === String(region.name).toLowerCase() ||
                      (region.code && String(t.regionId) === String(region.code))
                    );

                    const totalTanks = regionTanks.length > 0 ? regionTanks.length : (region.tanks || 0);
                    const completed = regionTanks.filter(t => (t.testStatus || t.test_status || '').toLowerCase() === 'completed').length;
                    const overdue = regionTanks.filter(t => (t.testStatus || t.test_status || '').toLowerCase() === 'overdue').length;
                    const due = regionTanks.filter(t => (t.testStatus || t.test_status || '').toLowerCase() === 'due').length;
                    const compliance = totalTanks > 0 ? Math.round((completed / totalTanks) * 100) : 0;

                    return (
                      <tr key={region.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>{region.name}</td>
                        <td style={{ padding: '16px', fontSize: '14px' }}>{totalTanks}</td>
                        <td style={{ padding: '16px', fontSize: '14px', color: 'var(--status-green)', fontWeight: 600 }}>{completed}</td>
                        <td style={{ padding: '16px', fontSize: '14px', color: 'var(--status-yellow)', fontWeight: 600 }}>{due}</td>
                        <td style={{ padding: '16px', fontSize: '14px', color: 'var(--status-red)', fontWeight: 600 }}>{overdue}</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '60px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${compliance}%`, height: '100%', backgroundColor: compliance >= 90 ? 'var(--status-green)' : 'var(--status-yellow)' }} />
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{compliance}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default WeeklyTests;
