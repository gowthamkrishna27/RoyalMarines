import React, { useState, useMemo, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Scale, Wheat, Filter, Calendar, Map, MapPin, User, Users, Droplet, UserCircle, AlertCircle, FileSpreadsheet, Activity, CheckSquare } from 'lucide-react';

const Analytics = () => {
  const [regions, setRegions] = useState([]);
  const [incharges, setIncharges] = useState([]);
  const [agents, setAgents] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [allTanks, setAllTanks] = useState([]);
  
  const [dashboardData, setDashboardData] = useState(null);
  const [chartInterval, setChartInterval] = useState('Weekly');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/analytics/regions').then(r => r.json()).then(d => d.success && setRegions(d.data));
    fetch('/api/analytics/incharges').then(r => r.json()).then(d => d.success && setIncharges(d.data));
    fetch('/api/analytics/agents').then(r => r.json()).then(d => d.success && setAgents(d.data));
    fetch('/api/farmers').then(r => r.json()).then(d => d.success && setFarmers(d.data));
    fetch('/api/tanks').then(r => r.json()).then(d => d.success && setAllTanks(d.data));
  }, []);

  const [filters, setFilters] = useState({
    date: 'This Month',
    region: '',
    locality: '',
    incharge: '',
    agent: '',
    farmer: '',
    tank: ''
  });

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    if (field === 'region') {
      newFilters.locality = '';
      newFilters.incharge = '';
      newFilters.agent = '';
      newFilters.farmer = '';
      newFilters.tank = '';
    }
    if (field === 'locality') {
      newFilters.incharge = '';
      newFilters.agent = '';
      newFilters.farmer = '';
      newFilters.tank = '';
    }
    if (field === 'incharge') {
      newFilters.agent = '';
      newFilters.farmer = '';
      newFilters.tank = '';
    }
    if (field === 'agent') {
      newFilters.farmer = '';
      newFilters.tank = '';
    }
    if (field === 'farmer') {
      newFilters.tank = '';
    }
    setFilters(newFilters);
  };

  const availableLocalities = useMemo(() => {
    if (!filters.region) return [];
    const region = regions.find(r => r.name === filters.region);
    return region ? region.localities.map(l => l.name) : [];
  }, [filters.region, regions]);

  const availableIncharges = useMemo(() => {
    let filtered = incharges;
    if (filters.region) filtered = filtered.filter(i => i.region === filters.region);
    if (filters.locality) filtered = filtered.filter(i => i.locality === filters.locality);
    return filtered.map(i => i.name);
  }, [filters.region, filters.locality, incharges]);

  const availableAgents = useMemo(() => {
    let filtered = agents;
    if (filters.region) filtered = filtered.filter(a => a.region === filters.region);
    if (filters.locality) filtered = filtered.filter(a => a.locality === filters.locality);
    if (filters.incharge) filtered = filtered.filter(a => a.incharge === filters.incharge);
    return filtered.map(a => a.name);
  }, [filters.region, filters.locality, filters.incharge, agents]);

  const availableFarmers = useMemo(() => {
    let filtered = farmers;
    if (filters.region) filtered = filtered.filter(f => f.region === filters.region);
    if (filters.locality) filtered = filtered.filter(f => f.locality === filters.locality);
    if (filters.incharge) filtered = filtered.filter(f => f.incharge === filters.incharge);
    if (filters.agent) filtered = filtered.filter(f => f.agent === filters.agent);
    return filtered.map(f => f.name);
  }, [filters.region, filters.locality, filters.incharge, filters.agent, farmers]);

  const availableTanks = useMemo(() => {
    let filtered = allTanks;
    if (filters.region) filtered = filtered.filter(t => t.region === filters.region);
    if (filters.locality) filtered = filtered.filter(t => t.locality === filters.locality);
    if (filters.incharge) filtered = filtered.filter(t => t.incharge === filters.incharge);
    if (filters.agent) filtered = filtered.filter(t => t.agent === filters.agent);
    if (filters.farmer) filtered = filtered.filter(t => t.farmer === filters.farmer);
    return filtered.map(t => t.id);
  }, [filters.region, filters.locality, filters.incharge, filters.agent, filters.farmer, allTanks]);

  const filteredTanks = useMemo(() => {
    return allTanks.filter(t => {
      if (filters.region && t.region !== filters.region) return false;
      if (filters.locality && t.locality !== filters.locality) return false;
      if (filters.incharge && t.incharge !== filters.incharge) return false;
      if (filters.agent && t.agent !== filters.agent) return false;
      if (filters.farmer && t.farmer !== filters.farmer) return false;
      if (filters.tank && t.id !== filters.tank) return false;
      return true;
    });
  }, [filters, allTanks]);

  useEffect(() => {
    if (filteredTanks.length > 0) {
      setIsLoading(true);
      const tankIds = filteredTanks.map(t => t.id).join(',');
      fetch(`/api/analytics/dashboard-data?interval=${chartInterval}&tankIds=${tankIds}`)
        .then(r => r.json())
        .then(d => {
          if (d.success) setDashboardData(d.data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    } else {
      setDashboardData(null);
    }
  }, [filteredTanks, chartInterval]);

  const kpis = dashboardData?.kpis || {
    abw: 0, fcr: '0.00', feed: 0, activeTanks: 0, totalBiomass: 0, totalHarvest: 0, compliance: '0%', pending: 0
  };

  const trendData = dashboardData?.trend || [];
  const waterQualityData = dashboardData?.waterQuality || [];

  return (
    <>
      <PageHeader title="Management Analytics" subtitle="Enterprise performance and field testing dashboard" />
      <div className="content-inner">

        {/* Filters */}
        <div className="card" style={{ marginBottom: '24px', padding: '16px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Date Range</label>
              <div className="input-field" style={{ margin: 0, padding: '8px 12px' }}>
                <Calendar size={14} />
                <select
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '12px' }}
                  value={filters.date} onChange={(e) => handleFilterChange('date', e.target.value)}
                >
                  <option>This Week</option>
                  <option>Last Week</option>
                  <option>This Month</option>
                  <option>This Quarter</option>
                  <option>All Time</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Region</label>
              <div className="input-field" style={{ margin: 0, padding: '8px 12px' }}>
                <Map size={14} />
                <select
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '12px' }}
                  value={filters.region} onChange={(e) => handleFilterChange('region', e.target.value)}
                >
                  <option value="">All Regions</option>
                  {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Locality</label>
              <div className="input-field" style={{ margin: 0, padding: '8px 12px', opacity: filters.region ? 1 : 0.6 }}>
                <MapPin size={14} />
                <select
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '12px' }}
                  value={filters.locality} onChange={(e) => handleFilterChange('locality', e.target.value)}
                  disabled={!filters.region}
                >
                  <option value="">All Localities</option>
                  {availableLocalities.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>ASM / Incharge</label>
              <div className="input-field" style={{ margin: 0, padding: '8px 12px' }}>
                <User size={14} />
                <select
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '12px' }}
                  value={filters.incharge} onChange={(e) => handleFilterChange('incharge', e.target.value)}
                >
                  <option value="">All Incharges</option>
                  {availableIncharges.map(i => <option key={i} value={i}>{(i || '').split(' (')[0]}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Field Agent</label>
              <div className="input-field" style={{ margin: 0, padding: '8px 12px' }}>
                <Users size={14} />
                <select
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '12px' }}
                  value={filters.agent} onChange={(e) => handleFilterChange('agent', e.target.value)}
                >
                  <option value="">All Agents</option>
                  {availableAgents.map(a => <option key={a} value={a}>{(a || '').split(' (')[0]}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Farmer</label>
              <div className="input-field" style={{ margin: 0, padding: '8px 12px' }}>
                <UserCircle size={14} />
                <select
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '12px' }}
                  value={filters.farmer} onChange={(e) => handleFilterChange('farmer', e.target.value)}
                >
                  <option value="">All Farmers</option>
                  {availableFarmers.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Tank</label>
              <div className="input-field" style={{ margin: 0, padding: '8px 12px' }}>
                <Droplet size={14} />
                <select
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '12px' }}
                  value={filters.tank} onChange={(e) => handleFilterChange('tank', e.target.value)}
                >
                  <option value="">All Tanks</option>
                  {availableTanks.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', height: '100%', alignItems: 'center' }}>
              <button
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  backgroundColor: '#f1f5f9', 
                  color: '#475569', 
                  border: 'none', 
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                onClick={() => setFilters({ date: 'This Month', region: '', locality: '', incharge: '', agent: '', farmer: '', tank: '' })}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-4" style={{ gap: '20px', marginBottom: '24px' }}>
          
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', backgroundColor: '#eef2ff', color: '#6366f1', borderRadius: '8px' }}><Droplet size={20} /></div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Active Tanks</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>{kpis.activeTanks}</div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', backgroundColor: '#f0fdf4', color: '#22c55e', borderRadius: '8px' }}><Scale size={20} /></div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Total Biomass</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>{kpis.totalBiomass.toLocaleString()} kg</div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', backgroundColor: '#fffbeb', color: '#f59e0b', borderRadius: '8px' }}><Wheat size={20} /></div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Feed Consumed</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>{kpis.feed.toLocaleString()} kg</div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', backgroundColor: '#fdf4ff', color: '#d946ef', borderRadius: '8px' }}><Activity size={20} /></div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Average FCR</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>{kpis.fcr}</div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', backgroundColor: '#f8fafc', color: '#475569', borderRadius: '8px' }}><TrendingUp size={20} /></div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Average ABW</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>{kpis.abw} g</div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', backgroundColor: '#f0f9ff', color: '#0ea5e9', borderRadius: '8px' }}><FileSpreadsheet size={20} /></div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Total Harvest</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>{kpis.totalHarvest.toLocaleString()} kg</div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', backgroundColor: '#ecfdf5', color: '#10b981', borderRadius: '8px' }}><CheckSquare size={20} /></div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Test Compliance</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>{kpis.compliance}</div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px' }}><AlertCircle size={20} /></div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Pending Verification</div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444' }}>{kpis.pending}</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2" style={{ gap: '24px', marginBottom: '24px' }}>

          {/* Biomass vs Feed Trend */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Biomass vs Feed Consumption</h3>
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', padding: '2px' }}>
                {['Daily', 'Weekly', 'Monthly'].map(period => (
                  <button 
                    key={period}
                    style={{ 
                      padding: '4px 12px', 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      background: chartInterval === period ? '#fff' : 'transparent',
                      color: chartInterval === period ? '#0f172a' : '#64748b',
                      border: 'none',
                      borderRadius: '4px',
                      boxShadow: chartInterval === period ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => setChartInterval(period)}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ height: '300px' }}>
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '14px' }}>Loading...</div>
              ) : trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dx={-10} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                    <Line type="monotone" name="Biomass (kg)" dataKey="biomass" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                    <Line type="monotone" name="Feed (kg)" dataKey="feed" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '14px', background: '#f8fafc', borderRadius: '8px' }}>
                  No historical trend data available
                </div>
              )}
            </div>
          </div>

          {/* Water Quality Chart */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>WATER QUALITY PARAMETERS</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Dissolved Oxygen (DO) & pH Trends</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1d4ed8' }}></div> DO (mg/L)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }}></div> pH
                </div>
              </div>
            </div>

            <div style={{ height: '300px' }}>
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '14px' }}>Loading...</div>
              ) : waterQualityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={waterQualityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                    <YAxis yAxisId="left" domain={[3, 10]} ticks={[3, 5, 7, 9, 10]} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} />
                    <YAxis yAxisId="right" orientation="right" domain={[6, 9]} ticks={[6, 7, 8, 9]} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={10} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Line yAxisId="right" type="monotone" name="pH" dataKey="ph" stroke="#059669" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, fill: '#059669' }} />
                    <Line yAxisId="left" type="monotone" name="DO (mg/L)" dataKey="do" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, fill: '#1d4ed8' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '14px', background: '#f8fafc', borderRadius: '8px' }}>
                  No water quality data available
                </div>
              )}
            </div>
            
            {waterQualityData.length > 0 && (
              <div style={{ display: 'flex', gap: '24px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Avg DO</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                    {(waterQualityData.reduce((acc, curr) => acc + curr.do, 0) / waterQualityData.length).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Avg pH</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                    {(waterQualityData.reduce((acc, curr) => acc + curr.ph, 0) / waterQualityData.length).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default Analytics;
