import React, { useState, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import { getRegions, getIncharges, getAgents, getFarmers, getTanks } from '../utils/adminMockData';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Scale, Wheat, Filter, Calendar, Map, MapPin, User, Users, Droplet, UserCircle } from 'lucide-react';

const Analytics = () => {
  const regions = getRegions();
  const incharges = getIncharges();
  const agents = getAgents();
  const farmers = getFarmers();
  const allTanks = getTanks();

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
    // Cascading resets
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

  // Derive dropdown options based on current filters
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

  // Filter tanks for KPIs
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

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (filteredTanks.length === 0) return { abw: 0, fcr: 0, feed: 0 };
    const totalAbw = filteredTanks.reduce((sum, t) => sum + t.abw, 0);
    const totalFeed = filteredTanks.reduce((sum, t) => sum + t.feed, 0);
    const totalBiomass = filteredTanks.reduce((sum, t) => sum + (t.biomass || 0), 0);
    const fcrValue = totalBiomass > 0 ? (totalFeed / totalBiomass).toFixed(2) : "0.00";

    return {
      abw: (totalAbw / filteredTanks.length).toFixed(1),
      fcr: fcrValue,
      feed: totalFeed.toLocaleString()
    };
  }, [filteredTanks]);

  // Dynamic Chart Data
  const trendData = useMemo(() => {
    // Generate trend based on the number of filtered tanks to make it look dynamic
    const scale = filteredTanks.length > 0 ? (filteredTanks.length / allTanks.length) : 0;
    return [
      { week: 'Week 1', biomass: Math.floor(12000 * scale), feed: Math.floor(14000 * scale) },
      { week: 'Week 2', biomass: Math.floor(15000 * scale), feed: Math.floor(18000 * scale) },
      { week: 'Week 3', biomass: Math.floor(21000 * scale), feed: Math.floor(24000 * scale) },
      { week: 'Week 4', biomass: Math.floor(28000 * scale), feed: Math.floor(33000 * scale) },
    ];
  }, [filteredTanks, allTanks.length]);

  const comparisonData = useMemo(() => {
    if (filteredTanks.length === 0) return [];

    // Group by an appropriate level based on filters
    let groupKey = 'region';
    if (filters.farmer) groupKey = 'id'; // Tank ID
    else if (filters.agent) groupKey = 'farmer';
    else if (filters.incharge) groupKey = 'agent';
    else if (filters.locality) groupKey = 'incharge';
    else if (filters.region) groupKey = 'locality';

    const grouped = {};
    filteredTanks.forEach(t => {
      const key = t[groupKey] || 'Unknown';
      if (!grouped[key]) grouped[key] = { name: key, sumFeed: 0, sumBiomass: 0 };
      grouped[key].sumFeed += t.feed || 0;
      grouped[key].sumBiomass += t.biomass || 0;
    });

    return Object.values(grouped).map(g => {
      const fcrVal = g.sumBiomass > 0 ? (g.sumFeed / g.sumBiomass) : 0;
      return {
        name: g.name.split(' (')[0], // simplify names like "K. V. Rajesh (Incharge...)"
        fcr: Number(fcrVal.toFixed(2))
      };
    });
  }, [filteredTanks, filters]);

  const waterQualityData = [
    { day: 'Mon', do: 5.4, ph: 7.8 },
    { day: 'Tue', do: 5.8, ph: 7.9 },
    { day: 'Wed', do: 5.3, ph: 7.7 },
    { day: 'Thu', do: 5.9, ph: 8.1 },
    { day: 'Fri', do: 6.2, ph: 8.0 },
    { day: 'Sat', do: 5.9, ph: 7.9 },
    { day: 'Sun', do: 6.1, ph: 8.0 }
  ];

  return (
    <>
      <PageHeader title="Management Analytics" breadcrumbs={[{ label: 'Monitoring' }, { label: 'Analytics', active: true }]} />
      <div className="content-inner">

        {/* Filters */}
        <div className="card" style={{ marginBottom: '24px', padding: '24px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', alignItems: 'flex-end' }}>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-muted)' }}>Date Range</label>
              <div className="input-field" style={{ margin: 0, padding: '10px 16px' }}>
                <Calendar size={14} />
                <select
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '13px' }}
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-muted)' }}>Region</label>
              <div className="input-field" style={{ margin: 0, padding: '10px 16px' }}>
                <Map size={14} />
                <select
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '13px' }}
                  value={filters.region} onChange={(e) => handleFilterChange('region', e.target.value)}
                >
                  <option value="">All Regions</option>
                  {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-muted)' }}>Locality</label>
              <div className="input-field" style={{ margin: 0, padding: '10px 16px', opacity: filters.region ? 1 : 0.6 }}>
                <MapPin size={14} />
                <select
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '13px' }}
                  value={filters.locality} onChange={(e) => handleFilterChange('locality', e.target.value)}
                  disabled={!filters.region}
                >
                  <option value="">All Localities</option>
                  {availableLocalities.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-muted)' }}>ASM / Incharge</label>
              <div className="input-field" style={{ margin: 0, padding: '10px 16px' }}>
                <User size={14} />
                <select
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '13px' }}
                  value={filters.incharge} onChange={(e) => handleFilterChange('incharge', e.target.value)}
                >
                  <option value="">All Incharges</option>
                  {availableIncharges.map(i => <option key={i} value={i}>{i.split(' (')[0]}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-muted)' }}>Field Agent</label>
              <div className="input-field" style={{ margin: 0, padding: '10px 16px' }}>
                <Users size={14} />
                <select
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '13px' }}
                  value={filters.agent} onChange={(e) => handleFilterChange('agent', e.target.value)}
                >
                  <option value="">All Agents</option>
                  {availableAgents.map(a => <option key={a} value={a}>{a.split(' (')[0]}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-muted)' }}>Farmer</label>
              <div className="input-field" style={{ margin: 0, padding: '10px 16px' }}>
                <UserCircle size={14} />
                <select
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '13px' }}
                  value={filters.farmer} onChange={(e) => handleFilterChange('farmer', e.target.value)}
                >
                  <option value="">All Farmers</option>
                  {availableFarmers.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-muted)' }}>Tank</label>
              <div className="input-field" style={{ margin: 0, padding: '10px 16px' }}>
                <Droplet size={14} />
                <select
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '13px' }}
                  value={filters.tank} onChange={(e) => handleFilterChange('tank', e.target.value)}
                >
                  <option value="">All Tanks</option>
                  {availableTanks.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', gridColumn: '1 / -1', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                className="btn-secondary"
                style={{ padding: '8px 16px', height: '36px', fontSize: '13px' }}
                onClick={() => setFilters({ date: 'This Month', region: '', locality: '', incharge: '', agent: '', farmer: '', tank: '' })}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-3" style={{ gap: '24px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: '#eef2ff', color: '#818cf8', borderRadius: '10px' }}><TrendingUp size={24} /></div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Average ABW</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700 }}>{kpis.abw}g</div>
            <div style={{ fontSize: '13px', color: 'var(--status-green)', marginTop: '8px', fontWeight: 600 }}>Filtered Data</div>
          </div>

          <div className="card" style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: '#f0f9ff', color: '#38bdf8', borderRadius: '10px' }}><Scale size={24} /></div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Average FCR</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700 }}>{kpis.fcr}</div>
            <div style={{ fontSize: '13px', color: 'var(--status-green)', marginTop: '8px', fontWeight: 600 }}>Filtered Data</div>
          </div>

          <div className="card" style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: '#fffbeb', color: '#f59e0b', borderRadius: '10px' }}><Wheat size={24} /></div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Total Feed Consumed</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700 }}>{kpis.feed} kg</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px' }}>Filtered Data</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2" style={{ gap: '24px', marginBottom: '24px' }}>

          {/* Biomass vs Feed Trend */}
          <div className="card" style={{ padding: '24px 32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Biomass vs Feed Consumption Trend</h3>
            <div style={{ height: '300px' }}>
              {filteredTanks.length > 0 ? (
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
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>No data available</div>
              )}
            </div>
          </div>

          {/* Conditional Chart 2 */}
          {filters.farmer && filters.tank ? (
            <div className="card" style={{ padding: '24px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>WATER QUALITY PARAMETERS</h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Weekly Dissolved Oxygen (DO) & pH Trends</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1d4ed8' }}></div> DO (mg/L)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }}></div> pH
                  </div>
                </div>
              </div>
              
              <div style={{ height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={waterQualityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis domain={[4, 9]} ticks={[4, 6, 8, 9]} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    
                    <Area type="monotone" dataKey="ph" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorPh)" activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="do" stroke="#1d4ed8" strokeWidth={2} fillOpacity={1} fill="url(#colorDo)" activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '24px 32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>FCR Comparison Breakdown</h3>
              <div style={{ height: '300px' }}>
                {filteredTanks.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-10} domain={[0, 2]} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                      <Bar dataKey="fcr" name="FCR" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>No data available</div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </>
  );
};

export default Analytics;
