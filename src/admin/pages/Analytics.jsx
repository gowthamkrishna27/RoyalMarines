import React from 'react';
import PageHeader from '../components/PageHeader';
import { getRegions } from '../utils/adminMockData';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Scale, Wheat } from 'lucide-react';

const Analytics = () => {
  const regions = getRegions();

  // Mock comparison data
  const comparisonData = [
    { name: 'Bhimavaram', fcr: 1.2, abw: 18.5, feed: 45000 },
    { name: 'Narsapur', fcr: 1.35, abw: 16.2, feed: 38000 },
    { name: 'Undi', fcr: 1.15, abw: 20.1, feed: 52000 },
    { name: 'Palakollu', fcr: 1.4, abw: 14.8, feed: 22000 },
  ];

  const trendData = [
    { week: 'Week 1', biomass: 12000, feed: 14000 },
    { week: 'Week 2', biomass: 15000, feed: 18000 },
    { week: 'Week 3', biomass: 21000, feed: 24000 },
    { week: 'Week 4', biomass: 28000, feed: 33000 },
  ];

  return (
    <>
      <PageHeader title="Management Analytics" breadcrumbs={[{ label: 'Monitoring' }, { label: 'Analytics', active: true }]} />
      <div className="content-inner">
        
        {/* KPI Cards */}
        <div className="grid md:grid-cols-3" style={{ gap: '20px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: '#eef2ff', color: '#818cf8', borderRadius: '10px' }}><TrendingUp size={24} /></div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Average ABW</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800 }}>17.4g</div>
            <div style={{ fontSize: '13px', color: 'var(--status-green)', marginTop: '8px', fontWeight: 600 }}>+1.2g from last week</div>
          </div>
          
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: '#f0f9ff', color: '#38bdf8', borderRadius: '10px' }}><Scale size={24} /></div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Organization FCR</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800 }}>1.28</div>
            <div style={{ fontSize: '13px', color: 'var(--status-green)', marginTop: '8px', fontWeight: 600 }}>-0.05 from last cycle</div>
          </div>
          
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: '#fffbeb', color: '#f59e0b', borderRadius: '10px' }}><Wheat size={24} /></div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Total Feed Consumed</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800 }}>157,000 kg</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px' }}>Active cycle</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2" style={{ gap: '24px', marginBottom: '24px' }}>
          
          {/* Biomass vs Feed Trend */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Biomass vs Feed Consumption (Organization)</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" name="Biomass (kg)" dataKey="biomass" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                  <Line type="monotone" name="Feed (kg)" dataKey="feed" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* FCR Comparison */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Regional FCR Comparison</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-10} domain={[0, 2]} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                  <Bar dataKey="fcr" name="FCR" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </>
  );
};

export default Analytics;
