import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../utils/adminService';
import PageHeader from '../components/PageHeader';
import { Users, HardHat, Sprout, Database, Eye } from 'lucide-react';

const RegionDetail = () => {
  const { regionId } = useParams();
  const navigate = useNavigate();

  const [region, setRegion] = useState(null);
  const [incharges, setIncharges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!regionId) return;
    setLoading(true);
    Promise.allSettled([
      adminService.getRegions(),
      adminService.getIncharges(),
      adminService.getAgents(),
      adminService.getFarmers(),
      adminService.getTanks()
    ]).then(([regRes, incRes, agRes, farRes, tkRes]) => {
      if (!isMounted) return;
      const allRegs = regRes.status === 'fulfilled' && Array.isArray(regRes.value) ? regRes.value : [];
      const allIncs = incRes.status === 'fulfilled' && Array.isArray(incRes.value) ? incRes.value : [];
      const allAgs = agRes.status === 'fulfilled' && Array.isArray(agRes.value) ? agRes.value : [];
      const allFars = farRes.status === 'fulfilled' && Array.isArray(farRes.value) ? farRes.value : [];
      const allTks = tkRes.status === 'fulfilled' && Array.isArray(tkRes.value) ? tkRes.value : [];

      const currentReg = allRegs.find(r => String(r.id) === String(regionId) || String(r.code) === String(regionId));
      if (currentReg) {
        const regIncs = allIncs.filter(i => String(i.region_id || i.regionId) === String(currentReg.id) || i.region === currentReg.name);
        const regAgs = allAgs.filter(a => String(a.regionId) === String(currentReg.id) || a.region === currentReg.name);
        const regFars = allFars.filter(f => String(f.regionId) === String(currentReg.id) || f.region === currentReg.name);
        const regTks = allTks.filter(t => String(t.regionId) === String(currentReg.id) || t.region === currentReg.name);

        setRegion({
          ...currentReg,
          incharges: regIncs.length,
          agents: regAgs.length,
          farmers: regFars.length,
          tanks: regTks.length
        });
        setIncharges(regIncs);
      } else {
        setRegion(null);
      }
      setLoading(false);
    }).catch(err => {
      console.error('[RegionDetail] Failed to load data:', err);
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [regionId]);

  if (!region) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
          {loading ? 'Loading Region Details...' : 'Region Not Found'}
        </h3>
        <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>
          {loading ? 'Retrieving real-time records from the aquaculture database.' : 'The requested region record could not be found.'}
        </p>
        <button
          onClick={() => navigate('/admin/regions')}
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
          Back to Regions List
        </button>
      </div>
    );
  }

  const kpis = [
    { title: 'Total Incharges', value: region.incharges, icon: <Users size={20} />, color: '#38bdf8', bg: '#f0f9ff' },
    { title: 'Total Agents', value: region.agents, icon: <HardHat size={20} />, color: '#10b981', bg: '#ecfdf5' },
    { title: 'Total Farmers', value: region.farmers, icon: <Sprout size={20} />, color: '#f59e0b', bg: '#fffbeb' },
    { title: 'Total Tanks', value: region.tanks, icon: <Database size={20} />, color: '#8b5cf6', bg: '#f5f3ff' },
  ];

  return (
    <>
      <PageHeader
        title={`${region.name} Region Details`}
      />
      <div className="content-inner">

        {/* Region KPIs */}
        <div className="grid md:grid-cols-4" style={{ gap: '16px', marginBottom: '24px' }}>
          {kpis.map((kpi, idx) => (
            <div key={idx} className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: kpi.bg, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {kpi.icon}
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-main)', lineHeight: '1.2' }}>{kpi.value}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>{kpi.title}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Incharges Table */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Incharges in {region.name} Region</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Incharge Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Incharge ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Agents</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Farmers</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Tanks</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Compliance</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incharges.map((incharge) => (
                  <tr key={incharge.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{incharge.name}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{incharge.id}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{incharge.agents}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{incharge.farmers}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{incharge.tanks}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${incharge.compliance}%`, height: '100%', backgroundColor: incharge.compliance >= 90 ? 'var(--status-green)' : 'var(--status-yellow)' }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{incharge.compliance}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => navigate(`/admin/incharges/${incharge.id}`)}>
                        <Eye size={16} /> Drill-down
                      </button>
                    </td>
                  </tr>
                ))}
                {incharges.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No incharges found for this region.</td>
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

export default RegionDetail;
