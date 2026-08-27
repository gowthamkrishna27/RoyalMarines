import React, { useState } from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { Search, Filter, Eye } from 'lucide-react';

const WeeklyTests = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { db, getFarmersByAgentId, getTanksByFarmerId, getSubmissionsByAgentId } = useMockData();
  
  const agents = db.agents.map(a => {
    const farmers = getFarmersByAgentId(a.id);
    const tanks = farmers.reduce((acc, f) => acc + getTanksByFarmerId(f.id).length, 0);
    const tests = getSubmissionsByAgentId(a.id).length;
    return { ...a, tanks, tests, compliance: 100 }; // Mock compliance
  });
  
  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.locality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <InchargeHeader title="Weekly Test Compliance" />
      <div className="content-inner">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', flex: 1, maxWidth: '600px' }}>
              <div className="input-field" style={{ flex: 1, margin: 0, padding: '8px 12px' }}>
                <Search size={18} color="var(--color-text-muted)" />
                <input 
                  type="text" 
                  placeholder="Search agents..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select className="input-field" style={{ margin: 0, padding: '8px 12px', width: 'auto', backgroundColor: 'white', border: '1px solid var(--color-border)' }}>
                <option>Week 34 (Aug 16 - Aug 22)</option>
                <option>Week 33 (Aug 9 - Aug 15)</option>
              </select>
              <button style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                padding: '8px 16px', backgroundColor: 'white', 
                border: '1px solid var(--color-border)', borderRadius: '8px',
                cursor: 'pointer'
              }}>
                <Filter size={18} />
                Filters
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Agent</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Assigned Tanks</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Completed</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Due</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Overdue</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Compliance</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px', fontWeight: 500 }}>{agent.name}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{agent.tanks}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{agent.tests}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{Math.floor(agent.tanks * 0.1)}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'var(--status-red)' }}>{Math.floor(agent.tanks * 0.05)}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${agent.compliance}%`, height: '100%', backgroundColor: agent.compliance > 90 ? 'var(--status-green)' : 'var(--status-yellow)' }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{agent.compliance}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                        backgroundColor: agent.compliance > 90 ? '#dcfce7' : '#fef3c7',
                        color: agent.compliance > 90 ? 'var(--status-green)' : 'var(--status-yellow)'
                      }}>
                        {agent.compliance > 90 ? 'Good' : 'Average'}
                      </span>
                    </td>
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

export default WeeklyTests;
