import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const RecordReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { db, getFarmerById, getTankById, getAgentById, updateSubmissionStatus, addNotification } = useMockData();
  const [record, setRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(''); // 'Reject' or 'Request Changes'
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const s = db.submissions.find(v => v.id === id);
    if (s) {
      const farmer = getFarmerById(s.farmerId);
      const tank = getTankById(s.tankId);
      const agent = getAgentById(s.agentId);
      setRecord({
        id: s.id,
        farmer: farmer ? farmer.name : 'Unknown',
        tank: tank ? tank.name : 'Unknown',
        testType: s.testType || 'Weekly Test',
        date: s.date,
        agent: agent ? agent.name : 'Unknown',
        submitted: s.submittedAgo || 'Just now',
        status: s.status
      });
    }
  }, [id, db, getFarmerById, getTankById, getAgentById]);

  if (!record) return <div>Loading...</div>;

  const handleApprove = () => {
    updateSubmissionStatus(record.id, 'Approved');
    const s = db.submissions.find(v => v.id === record.id);
    if (s) {
      addNotification(s.agentId, `Record for Tank ${record.tank} (${record.farmer}) was Approved.`, 'success');
    }
    navigate('/incharge/verifications');
  };

  const openModal = (action) => {
    setModalAction(action);
    setShowModal(true);
  };

  const handleModalSubmit = () => {
    if (!remarks) return;
    const status = modalAction === 'Reject' ? 'Rejected' : 'Changes Requested';
    updateSubmissionStatus(record.id, status);
    
    // Notify the agent
    // Since record.agent holds agent name, we should retrieve agentId. Actually wait, we only stored agent name in `record`. Let's get the original agentId from `s.agentId`. 
    // We need to modify `record` to include `agentId` to do this correctly, or we can look it up.
    const s = db.submissions.find(v => v.id === record.id);
    if (s) {
      addNotification(s.agentId, `Record for Tank ${record.tank} (${record.farmer}) was ${status}. Reason: ${remarks}`, status === 'Rejected' ? 'error' : 'warning');
    }

    setShowModal(false);
    navigate('/incharge/verifications');
  };

  const mockWaterData = [
    { label: 'DOC', value: '8.5 mg/L', status: 'normal' },
    { label: 'Salinity', value: '15 ppt', status: 'normal' },
    { label: 'pH', value: '7.8', status: 'normal' },
    { label: 'Alkalinity', value: '120 mg/L', status: 'normal' },
    { label: 'Hardness', value: '300 mg/L', status: 'normal' },
    { label: 'Ammonia', value: '0.1 mg/L', status: 'warning' },
    { label: 'Nitrite', value: '0.05 mg/L', status: 'normal' },
    { label: 'DO', value: '6.2 mg/L', status: 'normal' },
  ];

  return (
    <>
      <InchargeHeader title={`Test Verification - ${record.testType}`} />
      <div className="content-inner">
        <button 
          onClick={() => navigate('/incharge/verifications')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', marginBottom: '24px', fontWeight: 500 }}
        >
          <ArrowLeft size={18} /> Back to Pending Verifications
        </button>

        <div className="grid md:grid-cols-3" style={{ gap: '24px' }}>
          
          <div className="md:col-span-2">
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                Test Details
              </h3>
              
              <div className="grid grid-cols-2" style={{ gap: '16px', marginBottom: '32px' }}>
                {mockWaterData.map((data, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{data.label}</span>
                    <span style={{ fontWeight: 600, color: data.status === 'warning' ? 'var(--status-orange)' : 'var(--color-text-main)' }}>
                      {data.value}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Agent Remarks</h4>
                <div style={{ padding: '16px', backgroundColor: '#f1f5f9', borderRadius: '8px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                  Water colour slightly brownish. Farmer applied probiotics yesterday.
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Record Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Farmer</span>
                  <span style={{ fontWeight: 500 }}>{record.farmer}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Tank</span>
                  <span style={{ fontWeight: 500 }}>{record.tank}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Agent</span>
                  <span style={{ fontWeight: 500 }}>{record.agent}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Submitted</span>
                  <span style={{ fontWeight: 500 }}>{record.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>GPS Verified</span>
                  <span style={{ fontWeight: 500, color: 'var(--status-green)' }}>Yes (12m variance)</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={handleApprove}
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--status-green)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  <CheckCircle size={18} /> Approve Record
                </button>
                <button 
                  onClick={() => openModal('Request Changes')}
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <AlertCircle size={18} /> Request Changes
                </button>
                <button 
                  onClick={() => openModal('Reject')}
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: 'var(--status-red)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <XCircle size={18} /> Reject Record
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>{modalAction}</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>Please provide a reason and remarks for this action.</p>
            
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Remarks / Reason</label>
              <textarea 
                rows="4" 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px', resize: 'vertical' }}
                placeholder="Enter details..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary" style={{ width: 'auto', padding: '10px 24px' }}>Cancel</button>
              <button onClick={handleModalSubmit} className="btn-primary" style={{ width: 'auto', padding: '10px 24px', backgroundColor: modalAction === 'Reject' ? 'var(--status-red)' : 'var(--color-primary)' }}>
                Confirm {modalAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecordReview;
