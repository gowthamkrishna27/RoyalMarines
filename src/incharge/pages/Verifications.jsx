import React from 'react';
import { useNavigate } from 'react-router-dom';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';

const Verifications = () => {
  const navigate = useNavigate();
  const { db, getFarmerById, getTankById, getAgentById } = useMockData();

  const verifications = db.submissions
    .filter(s => s.status === 'PENDING_VERIFICATION')
    .map(s => {
      const farmer = getFarmerById(s.farmerId);
      const tank = getTankById(s.tankId);
      const agent = getAgentById(s.agentId);
      return {
        id: s.id,
        farmer: farmer ? farmer.name : 'Unknown',
        tank: tank ? tank.name : 'Unknown',
        testType: s.testType || 'Weekly Test',
        date: s.date,
        agent: agent ? agent.name : 'Unknown',
        submitted: s.submittedAgo || 'Just now',
        status: 'Pending'
      };
    });

  return (
    <>
      <InchargeHeader title="Pending Verifications" />
      <div className="content-inner">
        <div className="card">
          {verifications.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No pending verifications.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Farmer / Tank</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Test Type</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Test Date</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Agent</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Submitted Time</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px', fontWeight: 500 }}>{item.farmer} - {item.tank}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{item.testType}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{item.date}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{item.agent}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>
                        <span style={{ backgroundColor: '#fef3c7', color: 'var(--status-yellow)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
                          {item.submitted}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--status-yellow)' }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button 
                          onClick={() => navigate(`/incharge/verifications/${item.id}`)}
                          style={{ 
                            padding: '6px 16px', backgroundColor: 'var(--color-bg-main)', 
                            border: '1px solid var(--color-border)', borderRadius: '6px',
                            fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text-main)'
                          }}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Verifications;
