import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInchargeById, getAgentsByIncharge, getFarmersByIncharge, getTanksByIncharge } from '../utils/adminMockData';
import PageHeader from '../components/PageHeader';
import { HardHat, Sprout, Database, CheckSquare, Eye, Users, Droplets, MapPin, Phone } from 'lucide-react';

const InchargeDetail = () => {
  const { inchargeId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('agents');
  
  const incharge = getInchargeById(inchargeId);
  const agents = getAgentsByIncharge(inchargeId);
  const farmers = getFarmersByIncharge(inchargeId);
  const tanks = getTanksByIncharge(inchargeId);

  if (!incharge) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Incharge not found</div>;
  }

  const kpis = [
    { title: 'Assigned Technicians', value: agents.length, icon: <HardHat size={20} />, color: '#10b981', bg: '#ecfdf5' },
    { title: 'Assigned Farmers', value: farmers.length, icon: <Sprout size={20} />, color: '#f59e0b', bg: '#fffbeb' },
    { title: 'Assigned Tanks / Ponds', value: tanks.length, icon: <Database size={20} />, color: '#8b5cf6', bg: '#f5f3ff' },
    { title: 'Cluster Compliance', value: `${incharge.compliance}%`, icon: <CheckSquare size={20} />, color: '#38bdf8', bg: '#f0f9ff' },
  ];

  return (
    <>
      <PageHeader 
        title={`Incharge: ${incharge.name}`} 
        breadcrumbs={[
          { label: 'Organization' },
          { label: 'Regions' }, 
          { label: incharge.region },
          { label: incharge.name, active: true }
        ]} 
      />
      <div className="content-inner">
        
        {/* Incharge KPIs */}
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

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('agents')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: activeTab === 'agents' ? '700' : '500',
              backgroundColor: activeTab === 'agents' ? '#1A2FB8' : 'transparent',
              color: activeTab === 'agents' ? '#FFFFFF' : '#64748B',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Users size={15} />
            <span>Assigned Technicians ({agents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('farmers')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: activeTab === 'farmers' ? '700' : '500',
              backgroundColor: activeTab === 'farmers' ? '#1A2FB8' : 'transparent',
              color: activeTab === 'farmers' ? '#FFFFFF' : '#64748B',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Sprout size={15} />
            <span>Assigned Farmers ({farmers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tanks')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: activeTab === 'tanks' ? '700' : '500',
              backgroundColor: activeTab === 'tanks' ? '#1A2FB8' : 'transparent',
              color: activeTab === 'tanks' ? '#FFFFFF' : '#64748B',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Droplets size={15} />
            <span>Assigned Tanks & Ponds ({tanks.length})</span>
          </button>
        </div>

        {/* 1. Agents Tab */}
        {activeTab === 'agents' && (
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Field Technicians assigned to {incharge.name}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Agent Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Locality</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Farmers</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Tanks</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Tests Done</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Compliance</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>{agent.name}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{agent.locality}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{agent.farmers}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{agent.tanks}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{agent.tests}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${agent.compliance}%`, height: '100%', backgroundColor: agent.compliance >= 90 ? 'var(--status-green)' : 'var(--status-yellow)' }} />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{agent.compliance}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => navigate(`/admin/agents/${agent.id}`)}>
                          <Eye size={16} /> Drill-down
                        </button>
                      </td>
                    </tr>
                  ))}
                  {agents.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No agents found for this incharge.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Farmers Tab */}
        {activeTab === 'farmers' && (
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Farmers assigned to {incharge.name}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Farmer Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Village / Area</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Assigned Technician</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Total Land</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Ponds</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {farmers.map((farmer) => (
                    <tr key={farmer.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>{farmer.name}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} color="#1A2FB8" />
                          <span>{farmer.village || farmer.locality || farmer.assignedArea}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{farmer.agent || 'Direct Incharge Assignment'}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{farmer.acres || `${farmer.totalAcres || 5.0} Acres`}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{farmer.tanks || farmer.tankBreakdown?.length || 1} Tanks</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: '700',
                          backgroundColor: '#DCFCE7',
                          color: '#16A34A'
                        }}>
                          {farmer.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => navigate(`/admin/farmers/${farmer.id}`)}>
                          <Eye size={16} /> Drill-down
                        </button>
                      </td>
                    </tr>
                  ))}
                  {farmers.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No farmers assigned directly to this incharge.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Tanks Tab */}
        {activeTab === 'tanks' && (
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Tanks & Ponds assigned to {incharge.name}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Tank / Pond</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Farmer Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Pond Area</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>DOC</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Biomass</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Water Source</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Culture Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tanks.map((tank) => (
                    <tr key={tank.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px', fontWeight: 600, color: 'var(--color-text-main)' }}>{tank.name || 'Tank 1'}</td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500' }}>{tank.farmer || tank.farmerName || 'Assigned Farmer'}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{tank.acres ? `${tank.acres} Acres` : '3.0 Acres'}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>Day {tank.doc || 45}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{tank.biomass ? `${tank.biomass} kg` : '1200 kg'}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{tank.waterSource || 'Borewell / Creek'}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: '700',
                          backgroundColor: '#EFF6FF',
                          color: '#1A2FB8'
                        }}>
                          {tank.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {tanks.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No tanks assigned to this incharge.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default InchargeDetail;
