import React, { useState } from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { Search, Filter, Eye, X } from 'lucide-react';

const Agents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { db, addAgent, getFarmersByAgentId, getTanksByFarmerId, getSubmissionsByAgentId } = useMockData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  // Form State
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentMobile, setNewAgentMobile] = useState('');
  const [newAgentLocality, setNewAgentLocality] = useState('');

  const agents = db.agents.map(a => {
    const farmers = getFarmersByAgentId(a.id);
    const tanks = farmers.reduce((acc, f) => acc + getTanksByFarmerId(f.id).length, 0);
    const tests = getSubmissionsByAgentId(a.id).length;
    // mock compliance logic
    const compliance = 100;
    return { ...a, mobile: a.phone, farmers: farmers.length, tanks, tests, compliance, status: a.status === 'ACTIVE' ? 'Active' : 'Inactive' };
  });

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.locality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddAgent = (e) => {
    e.preventDefault();
    if (!newAgentName || !newAgentMobile || !newAgentLocality) return;

    addAgent({
      name: newAgentName,
      phone: newAgentMobile,
      locality: newAgentLocality,
      status: 'ACTIVE',
      inchargeId: 'INC001'
    });
    
    // Reset and close
    setNewAgentName('');
    setNewAgentMobile('');
    setNewAgentLocality('');
    setIsModalOpen(false);
  };

  return (
    <>
      <InchargeHeader title="My Agents" />
      <div className="content-inner">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', flex: 1, maxWidth: '500px' }}>
              <div className="input-field" style={{ flex: 1, margin: 0, padding: '8px 12px' }}>
                <Search size={18} color="var(--color-text-muted)" />
                <input 
                  type="text" 
                  placeholder="Search agents..." 
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
                Filter
              </button>
            </div>
            <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setIsModalOpen(true)}>
              + Add Agent
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Agent Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Mobile Number</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Locality</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Farmers</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Tanks</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Tests</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Compliance</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px', fontWeight: 500 }}>{agent.name}</td>
                    <td style={{ padding: '16px', color: 'var(--color-text-muted)', fontSize: '14px' }}>{agent.mobile}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{agent.locality}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{agent.farmers}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{agent.tanks}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{agent.tests}</td>
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
                        backgroundColor: agent.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                        color: agent.status === 'Active' ? 'var(--status-green)' : 'var(--color-text-muted)'
                      }}>
                        {agent.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredAgents.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No agents found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Agent Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Add New Agent</h2>
            
            <form onSubmit={handleAddAgent}>
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Agent Name</label>
                <div className="input-field" style={{ backgroundColor: '#f1f5f9' }}>
                  <input type="text" placeholder="Enter name" required value={newAgentName} onChange={e => setNewAgentName(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Mobile Number</label>
                <div className="input-field" style={{ backgroundColor: '#f1f5f9' }}>
                  <input type="tel" placeholder="Enter 10-digit number" required value={newAgentMobile} onChange={e => setNewAgentMobile(e.target.value)} />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Locality</label>
                <div className="input-field" style={{ backgroundColor: '#f1f5f9' }}>
                  <input type="text" placeholder="Enter locality" required value={newAgentLocality} onChange={e => setNewAgentLocality(e.target.value)} />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Agent Modal */}
      {selectedAgent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button 
              onClick={() => setSelectedAgent(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Agent Details</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Name</p><p style={{ fontWeight: 600 }}>{selectedAgent.name}</p></div>
              <div><p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Mobile</p><p style={{ fontWeight: 600 }}>{selectedAgent.mobile}</p></div>
              <div><p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Locality</p><p style={{ fontWeight: 600 }}>{selectedAgent.locality}</p></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Farmers</p><p style={{ fontWeight: 600 }}>{selectedAgent.farmers}</p></div>
                <div><p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Tanks</p><p style={{ fontWeight: 600 }}>{selectedAgent.tanks}</p></div>
                <div><p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Tests</p><p style={{ fontWeight: 600 }}>{selectedAgent.tests}</p></div>
              </div>
              <div><p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Status</p>
                <span style={{ 
                  padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                  backgroundColor: selectedAgent.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                  color: selectedAgent.status === 'Active' ? 'var(--status-green)' : 'var(--color-text-muted)'
                }}>
                  {selectedAgent.status}
                </span>
              </div>
            </div>
            
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => setSelectedAgent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Agents;
