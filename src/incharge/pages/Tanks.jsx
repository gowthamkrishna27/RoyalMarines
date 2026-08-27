import React, { useState } from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { Search, Filter, Eye, X } from 'lucide-react';
import TankModal from '../../components/TankModal';

const Tanks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTank, setSelectedTank] = useState(null);
  const [isTankModalOpen, setIsTankModalOpen] = useState(false);
  const [editingTank, setEditingTank] = useState(null);
  const { db, getFarmerById, getAgentById } = useMockData();
  
  const mockInchargeTanks = db.tanks.map(t => {
    const farmer = getFarmerById(t.farmerId);
    const agent = getAgentById(t.agentId);
    const hasPending = db.submissions.some(s => s.tankId === t.id && s.status === 'PENDING_VERIFICATION');
    let status = t.testStatus;
    if (hasPending) status = 'Pending Verification';

    return {
      id: t.id,
      name: t.name,
      farmer: farmer ? farmer.name : 'Unknown',
      locality: farmer ? farmer.location : 'Unknown',
      agent: agent ? agent.name : 'Unknown',
      lastTest: t.lastTest,
      nextDue: t.nextTest,
      status: status
    };
  });

  const filteredTanks = mockInchargeTanks.filter(tank => 
    tank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tank.farmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tank.locality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return { bg: '#dcfce7', text: 'var(--status-green)' };
      case 'Due': return { bg: '#fee2e2', text: 'var(--status-red)' };
      case 'Pending Verification': return { bg: '#fef3c7', text: 'var(--status-yellow)' };
      default: return { bg: '#f1f5f9', text: 'var(--color-text-muted)' };
    }
  };

  return (
    <>
      <InchargeHeader title="Tanks Management" />
      <div className="content-inner">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', flex: 1, maxWidth: '500px' }}>
              <div className="input-field" style={{ flex: 1, margin: 0, padding: '8px 12px' }}>
                <Search size={18} color="var(--color-text-muted)" />
                <input 
                  type="text" 
                  placeholder="Search tanks..." 
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
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn-primary"
                style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}
                onClick={() => { setEditingTank(null); setIsTankModalOpen(true); }}
              >
                + Add Tank
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Tank</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Farmer</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Locality</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Assigned Agent</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Last Test</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Next Due</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTanks.map((tank) => {
                  const statusStyle = getStatusColor(tank.status);
                  const rawTank = db.tanks.find(t => t.id === tank.id);
                  return (
                    <tr key={tank.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px', fontWeight: 500 }}>{tank.name}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{tank.farmer}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{tank.locality}</td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>
                        <span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontWeight: 500 }}>
                          {tank.agent}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{tank.lastTest}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text-muted)' }}>{tank.nextDue}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                          backgroundColor: statusStyle.bg, color: statusStyle.text
                        }}>
                          {tank.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}
                          onClick={() => setSelectedTank(tank)}
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#f1f5f9',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                          onClick={() => {
                            setEditingTank(rawTank || { id: tank.id, name: tank.name });
                            setIsTankModalOpen(true);
                          }}
                        >
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TankModal
        isOpen={isTankModalOpen}
        onClose={() => setIsTankModalOpen(false)}
        tank={editingTank}
      />

      {/* Inspect Tank Modal */}
      {selectedTank && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button
              onClick={() => setSelectedTank(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Tank Details</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Tank Name</p><p style={{ fontWeight: 600 }}>{selectedTank.name}</p></div>
              <div><p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Farmer</p><p style={{ fontWeight: 600 }}>{selectedTank.farmer}</p></div>
              <div><p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Locality</p><p style={{ fontWeight: 600 }}>{selectedTank.locality}</p></div>
              <div><p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Assigned Agent</p><p style={{ fontWeight: 600 }}>{selectedTank.agent}</p></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Last Test</p><p style={{ fontWeight: 600 }}>{selectedTank.lastTest}</p></div>
                <div><p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Next Due</p><p style={{ fontWeight: 600 }}>{selectedTank.nextDue}</p></div>
              </div>
              <div><p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Status</p>
                <span style={{
                  padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                  backgroundColor: getStatusColor(selectedTank.status).bg,
                  color: getStatusColor(selectedTank.status).text
                }}>
                  {selectedTank.status}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => setSelectedTank(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Tanks;
