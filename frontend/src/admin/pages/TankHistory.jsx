import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTankById } from '../utils/adminMockData';
import { useMockData } from '../../context/MockDataContext';
import PageHeader from '../components/PageHeader';
import { Database, Droplet, Wheat, Pill, Bug, Fish, MapPin, CheckSquare, History } from 'lucide-react';

const TankHistory = () => {
  const { tankId } = useParams();
  const navigate = useNavigate();
  const { db } = useMockData();
  const tank = getTankById(tankId, db);
  const [activeTab, setActiveTab] = useState('basic');

  if (!tank) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
          Loading Tank History...
        </h3>
        <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>
          Retrieving real-time records from the aquaculture database.
        </p>
        <button
          onClick={() => navigate('/admin/tanks')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            backgroundColor: '#1A2FB8',
            color: 'white',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Back to Tanks List
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: <Database size={16} /> },
    { id: 'water', label: 'Water Quality', icon: <Droplet size={16} /> },
    { id: 'feed', label: 'Feed History', icon: <Wheat size={16} /> },
    { id: 'medication', label: 'Medication', icon: <Pill size={16} /> },
    { id: 'disease', label: 'Disease', icon: <Bug size={16} /> },
    { id: 'harvest', label: 'Harvest', icon: <Fish size={16} /> },
    { id: 'visits', label: 'Site Visits', icon: <MapPin size={16} /> },
    { id: 'verifications', label: 'Verifications', icon: <CheckSquare size={16} /> },
  ];

  return (
    <>
      <PageHeader
        title={`Tank History: ${tank.name} (${tank.farmer})`}
      />
      <div className="content-inner">

        {/* Culture Cycle Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <History size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Culture Cycle Archive</h3>
          </div>
          <select style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: '#f8fafc', fontSize: '14px', fontWeight: 500, outline: 'none' }}>
            <option value="current">Current: {tank.currentCycle}</option>
            <option value="prev1">Previous: Cycle 2 (2025)</option>
            <option value="prev2">Previous: Cycle 1 (2025)</option>
          </select>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', marginBottom: '24px', paddingBottom: '4px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 16px', borderRadius: '12px',
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                fontSize: '14px', fontWeight: 600,
                backgroundColor: activeTab === tab.id ? 'var(--color-primary)' : 'white',
                color: activeTab === tab.id ? 'white' : 'var(--color-text-muted)',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(23, 56, 115, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Areas */}
        <div className="card" style={{ minHeight: '400px' }}>
          {activeTab === 'basic' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Tank Basic Information</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4" style={{ gap: '20px' }}>
                <div><div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Tank Size</div><div style={{ fontSize: '15px', fontWeight: 600 }}>{tank.acres ? `${tank.acres} Acres` : (tank.size || '-')}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Soil Type</div><div style={{ fontSize: '15px', fontWeight: 600 }}>{tank.soilType || tank.soil_type || '-'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Hatchery</div><div style={{ fontSize: '15px', fontWeight: 600 }}>{tank.hatcheryName || tank.hatchery_name || '-'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Seed Date</div><div style={{ fontSize: '15px', fontWeight: 600 }}>{tank.seedDate || tank.seed_date || '-'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Seed Stocking</div><div style={{ fontSize: '15px', fontWeight: 600 }}>{tank.seedStockingLak != null ? `${tank.seedStockingLak} Lakhs` : (tank.stockingCount ? `${tank.stockingCount} PL` : '-')}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Feed Type</div><div style={{ fontSize: '15px', fontWeight: 600 }}>{tank.feedType || tank.feed_type || '-'}</div></div>
              </div>
            </div>
          )}

          {activeTab === 'water' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Historical Water Quality</h3>
              {(() => {
                const tankSubmissions = (db?.submissions || []).filter(s =>
                  String(s.tankId) === String(tank.id) || s.tank_name === tank.name
                );

                if (tankSubmissions.length === 0) {
                  return (
                    <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      No historical water quality records found for this tank in the database.
                    </div>
                  );
                }

                return (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                          <th style={{ padding: '12px', fontWeight: 600, fontSize: '13px' }}>Date</th>
                          <th style={{ padding: '12px', fontWeight: 600, fontSize: '13px' }}>DOC</th>
                          <th style={{ padding: '12px', fontWeight: 600, fontSize: '13px' }}>Salinity (ppt)</th>
                          <th style={{ padding: '12px', fontWeight: 600, fontSize: '13px' }}>pH</th>
                          <th style={{ padding: '12px', fontWeight: 600, fontSize: '13px' }}>Ammonia</th>
                          <th style={{ padding: '12px', fontWeight: 600, fontSize: '13px' }}>DO</th>
                          <th style={{ padding: '12px', fontWeight: 600, fontSize: '13px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tankSubmissions.map((s) => {
                          const isWarning = s.ph && (parseFloat(s.ph) > 8.5 || parseFloat(s.ph) < 7.0);
                          return (
                            <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '12px', fontSize: '14px' }}>{s.date || s.submission_date || '-'}</td>
                              <td style={{ padding: '12px', fontSize: '14px' }}>{s.doc ?? '-'}</td>
                              <td style={{ padding: '12px', fontSize: '14px' }}>{s.salinity != null ? s.salinity : (s.water_salinity != null ? s.water_salinity : '-')}</td>
                              <td style={{ padding: '12px', fontSize: '14px', color: isWarning ? 'var(--status-red)' : 'inherit', fontWeight: isWarning ? 600 : 'normal' }}>{s.ph ?? '-'}</td>
                              <td style={{ padding: '12px', fontSize: '14px' }}>{s.ammonia ?? '-'}</td>
                              <td style={{ padding: '12px', fontSize: '14px' }}>{s.do != null ? `${s.do} mg/L` : (s.dissolved_oxygen != null ? `${s.dissolved_oxygen} mg/L` : '-')}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                                  backgroundColor: isWarning ? '#fef2f2' : '#dcfce7',
                                  color: isWarning ? 'var(--status-red)' : 'var(--status-green)',
                                }}>
                                  {isWarning ? 'Warning: High pH' : 'Normal'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab !== 'basic' && activeTab !== 'water' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
              <Database size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
              <p>Historical records for {activeTab} will appear here.</p>
              <p style={{ fontSize: '13px' }}>Data is synchronized from Agent field submissions.</p>
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default TankHistory;
