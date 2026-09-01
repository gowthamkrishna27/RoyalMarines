import React, { useState } from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { 
  CheckCircle2, MapPin, Users, UserSquare, ArrowRight, 
  ArrowLeft, Droplets, ShieldCheck, Check, RotateCcw, Search,
  Filter, UserCheck, Layers, Plus, CheckSquare, Square
} from 'lucide-react';

const steps = [
  { id: 1, title: 'Locality Cluster', icon: MapPin },
  { id: 2, title: 'Assign Technician', icon: Users },
  { id: 3, title: 'Select Farmers', icon: UserSquare },
  { id: 4, title: 'Review & Allocate', icon: CheckCircle2 }
];

const mockLocalities = ['Bhimavaram Cluster', 'Chinnamiram Area', 'Akuruvu Zone', 'Undi Mandal', 'Narasapuram Coast'];

const Allocations = () => {
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'WIZARD'
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLocality, setSelectedLocality] = useState('Bhimavaram Cluster');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedFarmers, setSelectedFarmers] = useState([]);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [success, setSuccess] = useState(false);

  const { db, getFarmersByAgentId, getTanksByFarmerId, assignFarmerToAgent, getAgentById, getAgentsByInchargeId, getFarmersByInchargeId } = useMockData();

  const inchargeAgentsList = getAgentsByInchargeId ? getAgentsByInchargeId('INC001') : (db?.agents || []);
  const availableAgents = inchargeAgentsList
    .map(a => {
      const farmers = getFarmersByAgentId(a.id);
      const tanks = farmers.reduce((acc, f) => acc + getTanksByFarmerId(f.id).length, 0);
      return {
        id: a.id,
        name: a.name,
        locality: a.locality || 'Coastal Andhra',
        farmers: farmers.sort((x, y) => (x.name || '').localeCompare(y.name || '', undefined, { sensitivity: 'base' })),
        farmerCount: farmers.length,
        tankCount: tanks,
        compliance: 100
      };
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));

  const inchargeFarmersList = getFarmersByInchargeId ? getFarmersByInchargeId('INC001') : (db?.farmers || []);
  const allFarmers = inchargeFarmersList
    .map(f => {
      const tanks = getTanksByFarmerId(f.id);
      const assignedAgent = getAgentById(f.agentId);
      return {
        id: f.id,
        name: f.name,
        acres: f.acres || 5,
        tanks: tanks.length,
        agentId: f.agentId,
        locality: f.location || f.village || 'Bhimavaram',
        assignedAgentName: assignedAgent ? assignedAgent.name : 'Unassigned'
      };
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));

  const filteredStepFarmers = allFarmers.filter(farmer => 
    farmer.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
    farmer.locality.toLowerCase().includes(farmerSearch.toLowerCase()) ||
    farmer.assignedAgentName.toLowerCase().includes(farmerSearch.toLowerCase())
  );

  const totalAssignedFarmersCount = allFarmers.filter(f => f.agentId).length;
  const totalTanksCount = allFarmers.reduce((acc, f) => acc + f.tanks, 0);
  const unassignedFarmersCount = allFarmers.filter(f => !f.agentId).length;

  const toggleFarmer = (farmerId) => {
    setSelectedFarmers(prev =>
      prev.includes(farmerId) ? prev.filter(id => id !== farmerId) : [...prev, farmerId]
    );
  };

  const handleSelectAllFiltered = () => {
    const ids = filteredStepFarmers.map(f => f.id);
    const allSelected = ids.every(id => selectedFarmers.includes(id));
    if (allSelected) {
      setSelectedFarmers(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedFarmers(prev => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleStartWizardForAgent = (agent) => {
    setSelectedAgent(agent);
    setCurrentStep(3);
    setActiveTab('WIZARD');
  };

  const handleAllocate = () => {
    if (!selectedAgent) return;
    selectedFarmers.forEach(fId => assignFarmerToAgent(fId, selectedAgent.id));
    setSuccess(true);
  };

  const reset = () => {
    setCurrentStep(1);
    setSelectedLocality('Bhimavaram Cluster');
    setSelectedAgent(null);
    setSelectedFarmers([]);
    setFarmerSearch('');
    setSuccess(false);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <>
      <InchargeHeader title="Field Territory & Farm Allocation" />

      <div style={{ padding: '24px 28px', maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Navigation Tabs & Quick Stats */}
        <div style={styles.topControlBar}>
          <div style={styles.tabContainer}>
            <button
              type="button"
              onClick={() => { setActiveTab('OVERVIEW'); if (success) reset(); }}
              style={{
                ...styles.tabBtn,
                backgroundColor: activeTab === 'OVERVIEW' ? '#1A2FB8' : '#FFFFFF',
                color: activeTab === 'OVERVIEW' ? '#FFFFFF' : '#475569',
                borderColor: activeTab === 'OVERVIEW' ? '#1A2FB8' : '#CBD5E1',
              }}
            >
              <Users size={15} />
              <span>Current Allocations ({availableAgents.length} Techs)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('WIZARD')}
              style={{
                ...styles.tabBtn,
                backgroundColor: activeTab === 'WIZARD' ? '#1A2FB8' : '#FFFFFF',
                color: activeTab === 'WIZARD' ? '#FFFFFF' : '#475569',
                borderColor: activeTab === 'WIZARD' ? '#1A2FB8' : '#CBD5E1',
              }}
            >
              <Plus size={15} />
              <span>Allocate Farms Wizard</span>
            </button>
          </div>

          <div style={styles.kpiQuickRow}>
            <div style={styles.kpiChip}>
              <span style={styles.kpiChipLabel}>Technicians:</span>
              <span style={styles.kpiChipVal}>{availableAgents.length}</span>
            </div>
            <div style={styles.kpiChip}>
              <span style={styles.kpiChipLabel}>Assigned Farmers:</span>
              <span style={{ ...styles.kpiChipVal, color: '#16A34A' }}>{totalAssignedFarmersCount}</span>
            </div>
            <div style={styles.kpiChip}>
              <span style={styles.kpiChipLabel}>Supervised Tanks:</span>
              <span style={{ ...styles.kpiChipVal, color: '#0284C7' }}>{totalTanksCount}</span>
            </div>
            {unassignedFarmersCount > 0 && (
              <div style={{ ...styles.kpiChip, backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }}>
                <span style={{ ...styles.kpiChipLabel, color: '#92400E' }}>Unassigned:</span>
                <span style={{ ...styles.kpiChipVal, color: '#B45309' }}>{unassignedFarmersCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: CURRENT TERRITORY ALLOCATIONS OVERVIEW TABLE */}
        {/* ========================================================= */}
        {activeTab === 'OVERVIEW' && (
          <div style={styles.card}>
            <div style={styles.sectionHeaderRow}>
              <div>
                <h3 style={styles.mainTitle}>Current Territory Deployments</h3>
                <p style={styles.mainSub}>Technician assignments and supervised farm clusters across Bhimavaram region</p>
              </div>
              <button
                type="button"
                onClick={() => { reset(); setActiveTab('WIZARD'); }}
                style={styles.newAllocBtn}
                className="transition-all duration-150 active:scale-98 cursor-pointer"
              >
                <Plus size={15} />
                <span>New Farm Allocation</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto', marginTop: '16px' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Field Technician</th>
                    <th style={styles.th}>Cluster Locality</th>
                    <th style={styles.th}>Assigned Farmers (Alphabetical)</th>
                    <th style={styles.th}>Total Farms</th>
                    <th style={styles.th}>Supervised Tanks</th>
                    <th style={styles.th}>Compliance</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {availableAgents.map((agent) => (
                    <tr key={agent.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={styles.agentAvatarBox}>
                            {agent.name ? agent.name[0] : 'A'}
                          </div>
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>{agent.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>Active Technician</div>
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', color: '#475569' }}>
                          <MapPin size={13} color="#1A2FB8" />
                          <span>{agent.locality}</span>
                        </div>
                      </td>

                      <td style={{ ...styles.td, maxWidth: '340px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {agent.farmers.length === 0 ? (
                            <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>No farmers currently assigned</span>
                          ) : (
                            agent.farmers.map(f => (
                              <span key={f.id} style={styles.farmerPill}>
                                {f.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.countBadge}>
                          <UserSquare size={13} color="#16A34A" />
                          {agent.farmerCount} Farmers
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.countBadge}>
                          <Droplets size={13} color="#0284C7" />
                          {agent.tankCount} Tanks
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.complianceChip}>
                          100% Active
                        </span>
                      </td>

                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleStartWizardForAgent(agent)}
                          style={styles.reassignBtn}
                          className="transition-all duration-150 active:scale-95 cursor-pointer"
                        >
                          <UserCheck size={13} />
                          <span>Reallocate</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: STEP-BY-STEP ALLOCATION WIZARD */}
        {/* ========================================================= */}
        {activeTab === 'WIZARD' && (
          <div style={styles.card}>

            {/* Stepper Header */}
            {!success && (
              <div style={styles.stepperContainer}>
                <div style={styles.stepperTrack} />
                {steps.map(step => {
                  const isPassed = currentStep > step.id;
                  const isCurrent = currentStep === step.id;
                  return (
                    <div key={step.id} style={styles.stepCol}>
                      <div style={{
                        ...styles.stepCircle,
                        backgroundColor: isPassed ? '#16A34A' : isCurrent ? '#1A2FB8' : '#FFFFFF',
                        borderColor: isPassed ? '#16A34A' : isCurrent ? '#1A2FB8' : '#CBD5E1',
                        color: isPassed || isCurrent ? '#FFFFFF' : '#64748B',
                      }}>
                        {isPassed ? <Check size={16} /> : <span>{step.id}</span>}
                      </div>
                      <span style={{
                        ...styles.stepTitle,
                        color: isCurrent ? '#1A2FB8' : isPassed ? '#16A34A' : '#64748B',
                        fontWeight: isCurrent ? '800' : '600',
                      }}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* STEP 1: Select Locality */}
            {currentStep === 1 && !success && (
              <div>
                <div style={styles.stepHeadingRow}>
                  <h3 style={styles.stepHeading}>1. Select Target Cluster Locality</h3>
                  <p style={styles.stepSub}>Choose the aquaculture region you want to configure allocations for</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '16px' }}>
                  {mockLocalities.map(loc => {
                    const isSelected = selectedLocality === loc;
                    return (
                      <div
                        key={loc}
                        onClick={() => setSelectedLocality(loc)}
                        style={{
                          ...styles.selectOptionBox,
                          borderColor: isSelected ? '#1A2FB8' : '#E2E8F0',
                          backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                        }}
                        className="transition-all duration-150 active:scale-98 cursor-pointer"
                      >
                        <div style={{
                          ...styles.iconWrapper,
                          backgroundColor: isSelected ? '#DBEAFE' : '#F1F5F9',
                          color: isSelected ? '#1A2FB8' : '#64748B'
                        }}>
                          <MapPin size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: isSelected ? '#1A2FB8' : '#0F172A' }}>{loc}</div>
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Active Farm Region</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Select Technician */}
            {currentStep === 2 && !success && (
              <div>
                <div style={styles.stepHeadingRow}>
                  <h3 style={styles.stepHeading}>2. Select Assignee Technician</h3>
                  <p style={styles.stepSub}>Choose the field technician who will be responsible for sampling audits</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                  {availableAgents.map(agent => {
                    const isSelected = selectedAgent?.id === agent.id;
                    return (
                      <div
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent)}
                        style={{
                          ...styles.agentOptionBox,
                          borderColor: isSelected ? '#1A2FB8' : '#E2E8F0',
                          backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                        }}
                        className="transition-all duration-150 active:scale-98 cursor-pointer"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={styles.agentAvatarBox}>
                            {agent.name ? agent.name[0] : 'A'}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: isSelected ? '#1A2FB8' : '#0F172A' }}>{agent.name}</div>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>{agent.locality}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>Currently Assigned</div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{agent.farmerCount} Farmers</div>
                          </div>
                          <span style={styles.complianceChip}>100% On-Time</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Select Farmers */}
            {currentStep === 3 && !success && (
              <div>
                <div style={styles.stepHeadingRow}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={styles.stepHeading}>3. Select Farmers to Allocate</h3>
                      <p style={styles.stepSub}>Select the farms to assign under <strong>{selectedAgent?.name || 'Selected Technician'}</strong></p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      style={styles.selectAllBtn}
                      className="transition-all duration-150 active:scale-95 cursor-pointer"
                    >
                      {filteredStepFarmers.every(f => selectedFarmers.includes(f.id)) ? (
                        <>
                          <CheckSquare size={14} color="#1A2FB8" />
                          <span>Deselect All</span>
                        </>
                      ) : (
                        <>
                          <Square size={14} />
                          <span>Select All ({filteredStepFarmers.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Farmer Search Filter */}
                <div style={styles.searchBox}>
                  <Search size={16} color="#64748B" />
                  <input
                    type="text"
                    placeholder="Filter farmers by name, village, or current tech..."
                    value={farmerSearch}
                    onChange={e => setFarmerSearch(e.target.value)}
                    style={styles.searchInput}
                  />
                  {farmerSearch && (
                    <button type="button" onClick={() => setFarmerSearch('')} style={styles.clearSearchBtn}>
                      ✕
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                  {filteredStepFarmers.map(farmer => {
                    const isChecked = selectedFarmers.includes(farmer.id);
                    return (
                      <div
                        key={farmer.id}
                        onClick={() => toggleFarmer(farmer.id)}
                        style={{
                          ...styles.farmerCheckRow,
                          borderColor: isChecked ? '#1A2FB8' : '#E2E8F0',
                          backgroundColor: isChecked ? '#F0F9FF' : '#FFFFFF',
                        }}
                        className="transition-all duration-150 active:scale-98 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#1A2FB8' }}
                        />
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>{farmer.name}</div>
                            <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                              📍 {farmer.locality} • Current: <span style={{ color: '#1A2FB8', fontWeight: '600' }}>{farmer.assignedAgentName}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', fontWeight: '600' }}>
                            <span style={{ color: '#334155' }}>{farmer.acres} Acres</span>
                            <span style={{ color: '#1A2FB8' }}>{farmer.tanks} Ponds</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredStepFarmers.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                      No farmers found matching "{farmerSearch}".
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: Review & Confirm */}
            {currentStep === 4 && !success && (
              <div>
                <div style={styles.stepHeadingRow}>
                  <h3 style={styles.stepHeading}>4. Review & Confirm Allocation</h3>
                  <p style={styles.stepSub}>Confirm technician assignment before applying field changes</p>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Target Cluster Locality</span>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginTop: '2px' }}>{selectedLocality}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Assigned Field Technician</span>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#1A2FB8', marginTop: '2px' }}>{selectedAgent?.name}</div>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                      Farms Being Allocated ({selectedFarmers.length})
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                      {allFarmers.filter(f => selectedFarmers.includes(f.id)).map(f => (
                        <div key={f.id} style={{ padding: '8px 12px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
                          ✓ {f.name} ({f.tanks} Ponds)
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUCCESS STATE */}
            {success && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={styles.successIconBox}>
                  <CheckCircle2 size={36} color="#16A34A" />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px 0' }}>
                  Territory Allocation Confirmed
                </h2>
                <p style={{ color: '#64748B', fontSize: '14px', margin: '0 auto 28px auto', maxWidth: '440px' }}>
                  Successfully updated field assignments. {selectedFarmers.length} farmers have been delegated to {selectedAgent?.name}.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button 
                    type="button"
                    onClick={() => { reset(); setActiveTab('OVERVIEW'); }}
                    style={styles.allocateMoreBtn}
                    className="transition-all duration-150 active:scale-98 cursor-pointer"
                  >
                    <Users size={16} />
                    <span>View Territory Deployments</span>
                  </button>
                  <button 
                    type="button"
                    onClick={reset}
                    style={{ ...styles.allocateMoreBtn, backgroundColor: '#FFFFFF', color: '#1A2FB8', border: '1px solid #1A2FB8' }}
                    className="transition-all duration-150 active:scale-98 cursor-pointer"
                  >
                    <RotateCcw size={16} />
                    <span>Allocate More Farms</span>
                  </button>
                </div>
              </div>
            )}

            {/* FOOTER ACTIONS */}
            {!success && (
              <div style={styles.footerRow}>
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  style={{
                    ...styles.backBtn,
                    opacity: currentStep === 1 ? 0.4 : 1,
                    cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={
                      (currentStep === 1 && !selectedLocality) ||
                      (currentStep === 2 && !selectedAgent) ||
                      (currentStep === 3 && selectedFarmers.length === 0)
                    }
                    style={{
                      ...styles.continueBtn,
                      opacity: ((currentStep === 1 && !selectedLocality) || (currentStep === 2 && !selectedAgent) || (currentStep === 3 && selectedFarmers.length === 0)) ? 0.5 : 1,
                      cursor: ((currentStep === 1 && !selectedLocality) || (currentStep === 2 && !selectedAgent) || (currentStep === 3 && selectedFarmers.length === 0)) ? 'not-allowed' : 'pointer',
                    }}
                    className="transition-all duration-150 active:scale-98 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAllocate}
                    style={styles.confirmBtn}
                    className="transition-all duration-150 active:scale-98 cursor-pointer"
                  >
                    <ShieldCheck size={18} />
                    <span>Confirm Allocation</span>
                  </button>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </>
  );
};

const styles = {
  topControlBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
  },
  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  kpiQuickRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  kpiChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '12px',
  },
  kpiChipLabel: {
    color: '#64748B',
    fontWeight: '500',
  },
  kpiChipVal: {
    fontWeight: '800',
    color: '#0F172A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '28px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  mainTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  mainSub: {
    fontSize: '12.5px',
    color: '#64748B',
    marginTop: '2px',
  },
  newAllocBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    borderBottom: '2px solid #F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  th: {
    padding: '12px 14px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '14px',
    verticalAlign: 'middle',
  },
  agentAvatarBox: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    fontWeight: '800',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  farmerPill: {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: '600',
    color: '#0F172A',
  },
  countBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#0F172A',
  },
  complianceChip: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '10px',
  },
  reassignBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #DBEAFE',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  stepperContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '36px',
    position: 'relative',
  },
  stepperTrack: {
    position: 'absolute',
    top: '16px',
    left: '12%',
    right: '12%',
    height: '2px',
    backgroundColor: '#E2E8F0',
    zIndex: 0,
  },
  stepCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1,
    width: '25%',
  },
  stepCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: '12px',
    textAlign: 'center',
  },
  stepHeadingRow: {
    marginBottom: '16px',
  },
  stepHeading: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  stepSub: {
    fontSize: '13px',
    color: '#64748B',
    margin: '4px 0 0 0',
  },
  selectAllBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #DBEAFE',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '8px 12px',
    marginTop: '12px',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '13px',
    color: '#0F172A',
    width: '100%',
  },
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    fontSize: '12px',
  },
  selectOptionBox: {
    padding: '16px',
    border: '2px solid',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconWrapper: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentOptionBox: {
    padding: '14px 18px',
    border: '2px solid',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  farmerCheckRow: {
    padding: '12px 16px',
    border: '1px solid',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  successIconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#DCFCE7',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto 20px auto',
  },
  allocateMoreBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13.5px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '32px',
    paddingTop: '20px',
    borderTop: '1px solid #F1F5F9',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
  },
  continueBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 24px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
  },
  confirmBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 24px',
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
  },
};

export default Allocations;

