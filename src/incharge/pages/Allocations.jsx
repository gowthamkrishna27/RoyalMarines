import React, { useState } from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { CheckCircle, MapPin, Users, UserSquare, ArrowRight, ArrowLeft } from 'lucide-react';

const steps = [
  { id: 1, title: 'Select Locality', icon: MapPin },
  { id: 2, title: 'Select Agent', icon: Users },
  { id: 3, title: 'Select Farmers', icon: UserSquare },
  { id: 4, title: 'Review & Allocate', icon: CheckCircle }
];

const mockLocalities = ['Bhimavaram', 'Chinnamiram', 'Akuruvu', 'Undi', 'Narasapuram'];

const Allocations = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLocality, setSelectedLocality] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedFarmers, setSelectedFarmers] = useState([]);
  const [success, setSuccess] = useState(false);

  const { db, getFarmersByAgentId, getTanksByFarmerId, assignFarmerToAgent, getAgentById } = useMockData();

  const availableAgents = db.agents.map(a => {
    const farmers = getFarmersByAgentId(a.id);
    return {
      id: a.id,
      name: a.name,
      locality: a.locality,
      farmers: farmers.length,
      compliance: 100
    };
  });

  const availableFarmers = db.farmers.filter(f => {
    const assignedAgent = getAgentById(f.agentId);
    return !assignedAgent;
  }).map(f => {
    const tanks = getTanksByFarmerId(f.id);
    return {
      id: f.id,
      name: f.name,
      acres: f.acres,
      tanks: tanks.length,
      agentId: f.agentId
    };
  });

  const toggleFarmer = (farmerId) => {
    setSelectedFarmers(prev =>
      prev.includes(farmerId) ? prev.filter(id => id !== farmerId) : [...prev, farmerId]
    );
  };

  const handleAllocate = () => {
    selectedFarmers.forEach(fId => assignFarmerToAgent(fId, selectedAgent.id));
    setSuccess(true);
  };

  const reset = () => {
    setCurrentStep(1);
    setSelectedLocality('');
    setSelectedAgent(null);
    setSelectedFarmers([]);
    setSuccess(false);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <>
      <InchargeHeader title="Farmer Allocations" />
      <div className="content-inner">
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>

          {/* Stepper Header */}
          {!success && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', left: '10%', right: '10%', height: '2px', backgroundColor: 'var(--color-border)', zIndex: 0 }} />
              {steps.map(step => (
                <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '25%' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: currentStep >= step.id ? 'var(--color-primary)' : 'white',
                    border: `2px solid ${currentStep >= step.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    color: currentStep >= step.id ? 'white' : 'var(--color-text-muted)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    {currentStep > step.id ? <CheckCircle size={16} /> : <span>{step.id}</span>}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: currentStep >= step.id ? 600 : 400, color: currentStep >= step.id ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Step 1 */}
          {currentStep === 1 && !success && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Select Locality</h3>
              <div className="grid md:grid-cols-3">
                {mockLocalities.map(loc => (
                  <div
                    key={loc}
                    onClick={() => setSelectedLocality(loc)}
                    style={{
                      padding: '16px', border: `2px solid ${selectedLocality === loc ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                      backgroundColor: selectedLocality === loc ? '#f1f5f9' : 'white'
                    }}
                  >
                    <MapPin size={20} color={selectedLocality === loc ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                    <span style={{ fontWeight: 500 }}>{loc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && !success && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Select Agent</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {availableAgents.map(agent => (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    style={{
                      padding: '16px', border: `2px solid ${selectedAgent?.id === agent.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      backgroundColor: selectedAgent?.id === agent.id ? '#f1f5f9' : 'white'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{agent.name}</h4>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{agent.locality}</p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      <p>Farmers: {agent.farmers}</p>
                      <p>Compliance: <span style={{ color: agent.compliance > 90 ? 'var(--status-green)' : 'var(--status-yellow)' }}>{agent.compliance}%</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && !success && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Select Farmers to Allocate</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {availableFarmers.map(farmer => (
                  <div
                    key={farmer.id}
                    onClick={() => toggleFarmer(farmer.id)}
                    style={{
                      padding: '12px 16px', border: '1px solid var(--color-border)',
                      borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFarmers.includes(farmer.id)}
                      readOnly
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>{farmer.name}</span>
                      <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        <span>{farmer.acres} Acres</span>
                        <span>{farmer.tanks} Tanks</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4 */}
          {currentStep === 4 && !success && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Review & Allocate</h3>
              <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Target Locality</p>
                    <p style={{ fontWeight: 600, fontSize: '16px' }}>{selectedLocality}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Selected Agent</p>
                    <p style={{ fontWeight: 600, fontSize: '16px' }}>{selectedAgent?.name}</p>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Selected Farmers ({selectedFarmers.length})</p>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', fontWeight: 500 }}>
                    {availableFarmers.filter(f => selectedFarmers.includes(f.id)).map(f => (
                      <li key={f.id} style={{ marginBottom: '4px' }}>{f.name} - {f.tanks} Tanks</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {success && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', color: 'var(--status-green)',
                display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px'
              }}>
                <CheckCircle size={32} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Allocation Successful</h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
                Successfully allocated {selectedFarmers.length} farmers to {selectedAgent?.name}.
              </p>
              <button className="btn-primary" onClick={reset} style={{ width: 'auto', padding: '12px 32px' }}>
                Allocate More Farmers
              </button>
            </div>
          )}

          {/* Footer Actions */}
          {!success && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 24px', backgroundColor: 'white',
                  border: '1px solid var(--color-border)', borderRadius: '8px',
                  cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentStep === 1 ? 0.5 : 1, fontWeight: 500
                }}
              >
                <ArrowLeft size={18} /> Back
              </button>

              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !selectedLocality) ||
                    (currentStep === 2 && !selectedAgent) ||
                    (currentStep === 3 && selectedFarmers.length === 0)
                  }
                  className="btn-primary"
                  style={{ width: 'auto', padding: '10px 24px' }}
                >
                  Continue <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleAllocate}
                  className="btn-primary"
                  style={{ width: 'auto', padding: '10px 24px', backgroundColor: 'var(--status-green)' }}
                >
                  Confirm Allocation
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Allocations;
