import React, { useState } from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { Search, Filter, Eye } from 'lucide-react';

const Tests = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { db, getFarmerById, getTankById, getAgentById } = useMockData();
  
  const mockInchargeVerifications = db.submissions.map(s => {
    const farmer = getFarmerById(s.farmerId);
    const tank = getTankById(s.tankId);
    const agent = getAgentById(s.agentId);
    return {
      id: s.id,
      date: s.date,
      agent: agent ? agent.name : 'Unknown',
      farmer: farmer ? farmer.name : 'Unknown',
      tank: tank ? tank.name : 'Unknown',
      testType: s.testType || 'Water Analysis',
      status: s.status === 'PENDING_VERIFICATION' ? 'Pending' : 'Approved'
    };
  });

  const filteredTests = mockInchargeVerifications.filter(test => 
    test.farmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.testType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.agent.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <InchargeHeader title="Tests Management" />
      <div className="content-inner">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', flex: 1, maxWidth: '500px' }}>
              <div className="input-field" style={{ flex: 1, margin: 0, padding: '8px 12px' }}>
                <Search size={18} color="var(--color-text-muted)" />
                <input 
                  type="text" 
                  placeholder="Search tests..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Agent</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Farmer</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Tank</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Test Type</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test) => (
                  <tr key={test.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{test.date}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500 }}>{test.agent}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{test.farmer}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{test.tank}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{test.testType}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                        backgroundColor: test.status === 'Approved' ? '#dcfce7' : '#fef3c7',
                        color: test.status === 'Approved' ? 'var(--status-green)' : 'var(--status-yellow)'
                      }}>
                        {test.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}>
                        <Eye size={18} />
                      </button>
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

export default Tests;
