import React, { useState, useMemo, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Scale, Wheat, Calendar, Map, MapPin, User, Users, Droplet, UserCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';

const Analytics = () => {
  const [regions, setRegions] = useState([]);
  const [incharges, setIncharges] = useState([]);
  const [agents, setAgents] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [allTanks, setAllTanks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [regRes, incRes, agRes, farRes, tankRes, subRes] = await Promise.allSettled([
          apiClient.get('/analytics/regions'),
          apiClient.get('/analytics/incharges'),
          apiClient.get('/analytics/agents'),
          apiClient.get('/farmers'),
          apiClient.get('/tanks'),
          apiClient.get('/submissions'),
        ]);

        if (regRes.status === 'fulfilled' && Array.isArray(regRes.value?.data)) setRegions(regRes.value.data);
        if (incRes.status === 'fulfilled' && Array.isArray(incRes.value?.data)) setIncharges(incRes.value.data);
        if (agRes.status === 'fulfilled' && Array.isArray(agRes.value?.data)) setAgents(agRes.value.data);
        if (farRes.status === 'fulfilled' && Array.isArray(farRes.value?.data)) setFarmers(farRes.value.data);
        if (tankRes.status === 'fulfilled' && Array.isArray(tankRes.value?.data)) setAllTanks(tankRes.value.data);
        if (subRes.status === 'fulfilled' && Array.isArray(subRes.value?.data)) setSubmissions(subRes.value.data);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
        setError('Unable to load analytics data from database.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [filters, setFilters] = useState({
    date: 'All Time',
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

  // Derive dropdown options based on current filters
  const availableLocalities = useMemo(() => {
    if (!filters.region) return [];
    const region = regions.find(r => r.name === filters.region || r.code === filters.region);
    return region && Array.isArray(region.localities) ? region.localities.map(l => l.name) : [];
  }, [filters.region, regions]);

  const availableIncharges = useMemo(() => {
    let filtered = incharges;
    if (filters.region) filtered = filtered.filter(i => i.region === filters.region || i.regionId === filters.region);
    if (filters.locality) filtered = filtered.filter(i => i.locality === filters.locality);
    return filtered.map(i => i.name).filter(Boolean);
  }, [filters.region, filters.locality, incharges]);

  const availableAgents = useMemo(() => {
    let filtered = agents;
    if (filters.region) filtered = filtered.filter(a => a.region === filters.region || a.regionId === filters.region);
    if (filters.locality) filtered = filtered.filter(a => a.locality === filters.locality);
    if (filters.incharge) filtered = filtered.filter(a => a.incharge === filters.incharge || a.incharge_name === filters.incharge);
    return filtered.map(a => a.name).filter(Boolean);
  }, [filters.region, filters.locality, filters.incharge, agents]);

  const availableFarmers = useMemo(() => {
    let filtered = farmers;
    if (filters.region) filtered = filtered.filter(f => f.region === filters.region || f.regionId === filters.region);
    if (filters.locality) filtered = filtered.filter(f => f.locality === filters.locality || f.location === filters.locality);
    if (filters.incharge) filtered = filtered.filter(f => f.incharge === filters.incharge);
    if (filters.agent) filtered = filtered.filter(f => f.agent === filters.agent);
    return filtered.map(f => f.name).filter(Boolean);
  }, [filters.region, filters.locality, filters.incharge, filters.agent, farmers]);

  const availableTanks = useMemo(() => {
    let filtered = allTanks;
    if (filters.region) filtered = filtered.filter(t => t.region === filters.region);
    if (filters.locality) filtered = filtered.filter(t => t.locality === filters.locality);
    if (filters.incharge) filtered = filtered.filter(t => t.incharge === filters.incharge);
    if (filters.agent) filtered = filtered.filter(t => t.agent === filters.agent);
    if (filters.farmer) filtered = filtered.filter(t => (t.farmer === filters.farmer || t.farmerName === filters.farmer));
    return filtered.map(t => t.name || t.id).filter(Boolean);
  }, [filters.region, filters.locality, filters.incharge, filters.agent, filters.farmer, allTanks]);

  // Filter tanks for KPIs
  const filteredTanks = useMemo(() => {
    return allTanks.filter(t => {
      if (filters.region && t.region !== filters.region) return false;
      if (filters.locality && t.locality !== filters.locality) return false;
      if (filters.incharge && t.incharge !== filters.incharge) return false;
      if (filters.agent && t.agent !== filters.agent) return false;
      if (filters.farmer && t.farmer !== filters.farmer && t.farmerName !== filters.farmer) return false;
      if (filters.tank && t.id !== filters.tank && t.name !== filters.tank) return false;
      return true;
    });
  }, [filters, allTanks]);

  // Filter submissions corresponding to filtered tanks
  const filteredSubmissions = useMemo(() => {
    const tankIds = new Set(filteredTanks.map(t => String(t.id)));
    const farmerNames = new Set(filteredTanks.map(t => t.farmer || t.farmerName));
    return submissions.filter(s => {
      if (filteredTanks.length > 0) {
        return tankIds.has(String(s.tankId || s.tank_id)) || farmerNames.has(s.farmerName || s.farmer_name);
      }
      return true;
    });
  }, [filteredTanks, submissions]);

  // Calculate real KPIs
  const kpis = useMemo(() => {
    if (filteredTanks.length === 0) return { abw: '0.0', fcr: '0.00', feed: '0' };
    const validAbwTanks = filteredTanks.filter(t => parseFloat(t.abw) > 0);
    const avgAbw = validAbwTanks.length > 0 
      ? (validAbwTanks.reduce((sum, t) => sum + parseFloat(t.abw), 0) / validAbwTanks.length).toFixed(1) 
      : '0.0';

    const validFcrTanks = filteredTanks.filter(t => parseFloat(t.fcr) > 0);
    const avgFcr = validFcrTanks.length > 0 
      ? (validFcrTanks.reduce((sum, t) => sum + parseFloat(t.fcr), 0) / validFcrTanks.length).toFixed(2) 
      : '0.00';

    const totalFeed = filteredTanks.reduce((sum, t) => sum + (parseFloat(t.feed) || 0), 0);

    return {
      abw: avgAbw,
      fcr: avgFcr,
      feed: totalFeed > 0 ? totalFeed.toLocaleString() : 'N/A'
    };
  }, [filteredTanks]);

  // Real Database Trend Data from Submissions / Tanks
  const trendData = useMemo(() => {
    if (filteredTanks.length === 0) return [];

    // Group real biomass and feed records by week from submissions
    const weekMap = {};
    filteredSubmissions.forEach(s => {
      const dateStr = s.date || (s.created_at ? String(s.created_at).split('T')[0] : '');
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const weekLabel = `Wk ${Math.ceil(d.getDate() / 7)} (${d.toLocaleString('default', { month: 'short' })})`;
      
      const payload = typeof s.data === 'string' ? JSON.parse(s.data) : (s.data || {});
      const bio = parseFloat(payload.biomass) || 0;
      const fd = parseFloat(payload.feed) || 0;

      if (!weekMap[weekLabel]) {
        weekMap[weekLabel] = { week: weekLabel, biomass: 0, feed: 0, count: 0 };
      }
      weekMap[weekLabel].biomass += bio;
      weekMap[weekLabel].feed += fd;
      weekMap[weekLabel].count += 1;
    });

    const entries = Object.values(weekMap);
    if (entries.length > 0) {
      return entries.sort((a, b) => a.week.localeCompare(b.week));
    }

    // Fallback to real tank biomass grouped by status if no weekly telemetry logs
    return filteredTanks.slice(0, 6).map((t, i) => ({
      week: t.name || `Tank ${i + 1}`,
      biomass: parseInt(String(t.biomass || '0').replace(/\D/g, '')) || 0,
      feed: parseFloat(t.feed) || 0,
    })).filter(item => item.biomass > 0 || item.feed > 0);
  }, [filteredTanks, filteredSubmissions]);

  // Real Water Quality Data extracted from Submissions
  const waterQualityData = useMemo(() => {
    const list = [];
    filteredSubmissions.forEach(s => {
      const payload = typeof s.data === 'string' ? JSON.parse(s.data) : (s.data || {});
      const wq = payload.waterQuality || payload;
      const phVal = parseFloat(wq.ph);
      const doVal = parseFloat(wq.do);

      if (!isNaN(phVal) || !isNaN(doVal)) {
        const dateStr = s.date || (s.created_at ? String(s.created_at).split('T')[0] : '');
        const dayLabel = dateStr ? new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }) : 'Log';
        list.push({
          day: `${dayLabel} (${s.id})`,
          ph: !isNaN(phVal) ? Number(phVal.toFixed(1)) : 7.5,
          do: !isNaN(doVal) ? Number(doVal.toFixed(1)) : 5.5,
        });
      }
    });

    return list.slice(-10); // Return up to last 10 real telemetry points
  }, [filteredSubmissions]);

  return (
    <>
      <PageHeader title="Management Analytics" />
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
                  <option>All Time</option>
                  <option>This Month</option>
                  <option>This Week</option>
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
                  {availableIncharges.map(i => <option key={i} value={i}>{i}</option>)}
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
                  {availableAgents.map(a => <option key={a} value={a}>{a}</option>)}
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
                onClick={() => setFilters({ date: 'All Time', region: '', locality: '', incharge: '', agent: '', farmer: '', tank: '' })}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: '16px', marginBottom: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid md:grid-cols-3" style={{ gap: '24px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: '#eef2ff', color: '#818cf8', borderRadius: '10px' }}><TrendingUp size={24} /></div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Average ABW</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700 }}>{kpis.abw}g</div>
            <div style={{ fontSize: '13px', color: 'var(--status-green)', marginTop: '8px', fontWeight: 600 }}>Live Database Calculation</div>
          </div>

          <div className="card" style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: '#f0f9ff', color: '#38bdf8', borderRadius: '10px' }}><Scale size={24} /></div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Average FCR</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700 }}>{kpis.fcr}</div>
            <div style={{ fontSize: '13px', color: 'var(--status-green)', marginTop: '8px', fontWeight: 600 }}>Live Database Calculation</div>
          </div>

          <div className="card" style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: '#fffbeb', color: '#f59e0b', borderRadius: '10px' }}><Wheat size={24} /></div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Total Feed Consumed</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700 }}>{kpis.feed} kg</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px' }}>Active Farm Records</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2" style={{ gap: '24px', marginBottom: '24px' }}>

          {/* Biomass vs Feed Trend */}
          <div className="card" style={{ padding: '24px 32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Biomass vs Feed Consumption Trend</h3>
            <div style={{ height: '300px' }}>
              {trendData.length > 0 ? (
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
                  No biomass or feed records found for current selection.
                </div>
              )}
            </div>
          </div>

          {/* Real Water Quality Parameters */}
          <div className="card" style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>WATER QUALITY PARAMETERS</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Live Dissolved Oxygen (DO) &amp; pH Telemetry</p>
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
              {waterQualityData.length > 0 ? (
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
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
                  No water quality telemetry records found for current selection.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </>
  );
};

export default Analytics;
