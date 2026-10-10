import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { Search, Filter, Eye, X, AlertCircle } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';

const Verifications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get('/submissions');
        if (res?.data && Array.isArray(res.data)) {
          setSubmissions(res.data);
        } else {
          setSubmissions([]);
        }
      } catch (err) {
        console.error('Failed to load submissions:', err);
        setError('Unable to load verification data from database. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const filteredSubmissions = submissions.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.farmerName && s.farmerName.toLowerCase().includes(term)) ||
      (s.farmer_name && s.farmer_name.toLowerCase().includes(term)) ||
      (s.tankName && s.tankName.toLowerCase().includes(term)) ||
      (s.tank_name && s.tank_name.toLowerCase().includes(term)) ||
      (s.userName && s.userName.toLowerCase().includes(term)) ||
      (s.user_name && s.user_name.toLowerCase().includes(term)) ||
      (s.testType && s.testType.toLowerCase().includes(term)) ||
      (s.test_type && s.test_type.toLowerCase().includes(term)) ||
      (s.status && s.status.toLowerCase().includes(term))
    );
  });

  return (
    <>
      <PageHeader title="Organization Verifications Monitoring" />
      <div className="content-inner">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', flex: 1, maxWidth: '500px' }}>
              <div className="input-field" style={{ flex: 1, margin: 0, padding: '8px 12px' }}>
                <Search size={18} color="var(--color-text-muted)" />
                <input 
                  type="text" 
                  placeholder="Search by Farmer, Tank, or Agent..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding: '16px', marginBottom: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Loading verification records from database...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Submission ID</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Agent / User</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Farmer &amp; Tank</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Test Type</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Date / Time</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((v) => {
                      const displayStatus = (v.status || 'PENDING').toUpperCase();
                      const isApproved = displayStatus.includes('APPROV') || displayStatus.includes('VERIF') || displayStatus.includes('COMPLET');
                      const isRejected = displayStatus.includes('REJECT') || displayStatus.includes('FLAG');
                      const isPending = !isApproved && !isRejected;

                      return (
                        <tr key={v.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '16px', fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}>
                            {v.id}
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px' }}>
                            {v.user_name || v.userName || v.agent_id || v.agentId || 'Field Agent'}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 600 }}>{v.farmer_name || v.farmerName || v.farmer_id || 'Farmer'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{v.tank_name || v.tankName || v.tank_id || 'Tank'}</div>
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px' }}>{v.test_type || v.testType || 'Water Test'}</td>
                          <td style={{ padding: '16px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                            {v.date} {v.submission_time ? `(${v.submission_time})` : ''}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ 
                              padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                              backgroundColor: isPending ? '#fffbeb' : (isApproved ? '#ecfdf5' : '#fef2f2'),
                              color: isPending ? 'var(--status-yellow)' : (isApproved ? 'var(--status-green)' : 'var(--status-red)')
                            }}>
                              {displayStatus}
                            </span>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => setSelectedVerification(v)}
                            >
                              <Eye size={16} /> Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedVerification && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
            <button 
              onClick={() => setSelectedVerification(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Verification Details</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Verification ID</p>
                  <p style={{ fontWeight: 600 }}>{selectedVerification.id}</p>
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Status</p>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                    backgroundColor: '#ecfdf5',
                    color: 'var(--status-green)'
                  }}>
                    {selectedVerification.status}
                  </span>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Agent / User</p>
                  <p style={{ fontWeight: 500 }}>{selectedVerification.user_name || selectedVerification.userName || selectedVerification.agent_id || 'Staff'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Farmer</p>
                  <p style={{ fontWeight: 500 }}>{selectedVerification.farmer_name || selectedVerification.farmerName || 'Farmer'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Tank</p>
                  <p style={{ fontWeight: 500 }}>{selectedVerification.tank_name || selectedVerification.tankName || 'Tank'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Test Type</p>
                  <p style={{ fontWeight: 500 }}>{selectedVerification.test_type || selectedVerification.testType}</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Date</p>
                  <p style={{ fontWeight: 500 }}>{selectedVerification.date}</p>
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Time</p>
                  <p style={{ fontWeight: 500 }}>{selectedVerification.submission_time || 'N/A'}</p>
                </div>
              </div>

            </div>
            
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => setSelectedVerification(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Verifications;
