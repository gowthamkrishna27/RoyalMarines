import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Save, Send, MapPin, AlertTriangle, Droplet, Fish, Pill, Bug, ChevronRight, Check, Edit3 } from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';

const STEPS = [
  'GPS Verification',
  'Water Quality',
  'Feed',
  'Medication',
  'Disease',
  'Submit Tests'
];

const DISEASE_OPTIONS = [
  'White muscle', 'White gut', 'Moulting', 'Cramping', 
  'Black gill', 'Vibriosis', 'EHP', 'Hard shell', 
  'Soft shell', 'Black spots', 'ASDS', 'WSSV', 
  'Loose shell', 'Other'
];

const SiteVisit = () => {
  const { tankId } = useParams();
  const navigate = useNavigate();
  const [tank, setTank] = useState(null);
  const [session, setSession] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [returnToSubmit, setReturnToSubmit] = useState(false);
  const { getTankById, getDraft, saveDraft, submitRecord } = useMockData();
  
  // GPS State
  const [gpsStatus, setGpsStatus] = useState('pending');

  // Form State
  const [formData, setFormData] = useState({
    water: { doc: '', salinity: '', ph: '', alkalinity: '', hardness: '', ammonia: '', nitrite: '', k: '', do: '', h2s: '', chlorine: '', iron: '', waterColour: '' },
    feed: { doc: '', seed: '', abw: '', dayFeed: '', cumulativeFeed: '', totalBiomass: '', fcr: '', checkTrayFeed: '', checkTrayTime: '', remarks: '' },
    medication: { treatmentType: '', category: '', product: '', dosage: '', remarks: '' },
    disease: { observations: [], remarks: '' },
    harvest: { type: 'None', date: '', abw: '', harvestedNumber: '', harvestedBiomass: '', finalDoc: '', finalAbw: '', finalBiomass: '', totalBiomass: '', totalFeed: '', remarks: '' }
  });

  useEffect(() => {
    const s = getSession();
    setSession(s);
    
    setTank(getTankById(tankId));

    // Load draft if exists
    const draft = getDraft(tankId);
    if (draft) {
      setFormData(draft.formData);
      setCurrentStep('MENU'); 
      setGpsStatus('success'); 
    }
  }, [tankId, getTankById, getDraft]);

  // FCR Calculation Effect
  useEffect(() => {
    const cumFeed = parseFloat(formData.feed.cumulativeFeed);
    const biomass = parseFloat(formData.feed.totalBiomass);
    if (!isNaN(cumFeed) && !isNaN(biomass) && biomass > 0) {
      const fcr = (cumFeed / biomass).toFixed(2);
      if (formData.feed.fcr !== fcr) {
        setFormData(prev => ({ ...prev, feed: { ...prev.feed, fcr } }));
      }
    } else if (formData.feed.fcr !== '') {
      setFormData(prev => ({ ...prev, feed: { ...prev.feed, fcr: '' } }));
    }
  }, [formData.feed.cumulativeFeed, formData.feed.totalBiomass, formData.feed.fcr]);

  if (!tank || !session) return <div style={styles.loading}>Initializing Visit...</div>;

  const isTankClosed = tank.status === 'Harvested' || tank.status === 'Completed' || tank.finalHarvestCompleted;

  if (isTankClosed) {
    return (
      <div style={{ padding: '32px 20px', maxWidth: '500px', margin: '40px auto', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #CBD5E1', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
          <CheckCircle size={28} color="#1D4ED8" />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: '0 0 8px 0' }}>Final Harvest Completed</h2>
        <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.5, margin: '0 0 24px 0' }}>
          {tank.name} has already completed its final harvest. No new visits or field test records can be entered for this closed crop cycle.
        </p>
        <button 
          type="button"
          onClick={() => navigate(`/tanks/${tankId}`)}
          style={{ backgroundColor: '#1A2FB8', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer' }}
        >
          ← Return to Tank Details
        </button>
      </div>
    );
  }

  const handleNext = () => {
    if (currentStep === 0) {
      setCurrentStep('MENU');
    } else if (typeof currentStep === 'number' && currentStep >= 1 && currentStep <= 4) {
      if (returnToSubmit) {
        setCurrentStep(5);
        setReturnToSubmit(false);
      } else {
        setCurrentStep('MENU');
      }
    } else if (currentStep === 'MENU') {
      setCurrentStep(5);
    }
  };

  const handleBack = () => {
    if (currentStep === 'MENU') {
      navigate(`/tanks/${tankId}`);
    } else if (typeof currentStep === 'number' && currentStep >= 1 && currentStep <= 4) {
      if (returnToSubmit) {
        setCurrentStep(5);
        setReturnToSubmit(false);
      } else {
        setCurrentStep('MENU');
      }
    } else if (currentStep === 5) {
      setCurrentStep('MENU');
    } else {
      navigate(`/tanks/${tankId}`);
    }
  };

  const updateFormData = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const toggleDisease = (diseaseStr) => {
    setFormData(prev => {
      const current = prev.disease.observations;
      const updated = current.includes(diseaseStr) 
        ? current.filter(d => d !== diseaseStr) 
        : [...current, diseaseStr];
      return { ...prev, disease: { ...prev.disease, observations: updated } };
    });
  };

  const checkWaterWarning = (field, value) => {
    return null;
  };

  const renderInput = (section, field, label, type="text", placeholder="") => {
    const value = formData[section][field];
    const warning = section === 'water' ? checkWaterWarning(field, value) : null;
    
    return (
      <div className="input-group">
        <label style={styles.label}>{label}</label>
        <div className="input-field" style={warning ? { border: '1px solid var(--status-orange)' } : {}}>
          <input 
            type={type} 
            placeholder={placeholder}
            value={value}
            readOnly={field === 'fcr'}
            style={field === 'fcr' ? { color: 'var(--color-primary)', fontWeight: 'bold' } : {}}
            onChange={e => updateFormData(section, field, e.target.value)}
          />
        </div>
        {warning && (
          <div style={styles.warningText}>
            <AlertTriangle size={12} /> {warning}
          </div>
        )}
      </div>
    );
  };

  const handleSaveDraft = () => {
    saveDraft({
      tankId,
      agentId: session.agentId,
      formData,
      lastSaved: new Date().toISOString()
    });
    alert('Draft saved successfully!');
  };

  const handleSubmit = () => {
    submitRecord({
      tankId,
      agentId: session.agentId,
      formData,
      submittedAt: new Date().toISOString()
    });
    alert('Site Visit submitted successfully! Pending verification.');
    navigate('/dashboard');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'MENU':
        return (
          <div style={styles.menuContainer}>
            <div style={styles.menuHeaderRow}>
              <div>
                <div style={styles.menuLabel}>Farmer</div>
                <div style={styles.menuValue}>Ashok</div>
              </div>
              <div>
                <div style={styles.menuLabel}>GPS</div>
                <div style={styles.menuStatusVerified}><Check size={14} style={{ marginRight: 4 }}/> Verified</div>
              </div>
            </div>
            <div style={styles.menuHeaderRow}>
              <div>
                <div style={styles.menuLabel}>Test Date</div>
                <div style={styles.menuValue}>22 Aug 2026</div>
              </div>
            </div>

            <div style={styles.menuList}>
              <div style={styles.menuCard} onClick={() => { setCurrentStep(1); setReturnToSubmit(false); }}>
                <div style={styles.menuCardIconWrapper}>
                  <div style={styles.menuCardNumber}>01</div>
                  <Droplet size={24} color="#003399" />
                </div>
                <div style={styles.menuCardContent}>
                  <div style={styles.menuCardTitle}>Water Analysis</div>
                  <div style={styles.menuCardSubtitle}>Last Test: 20 Aug 2026</div>
                  <div style={styles.menuCardStatusDue}>Status: Due</div>
                </div>
                <div style={styles.menuCardAction}>ENTER TEST <ChevronRight size={16} /></div>
              </div>

              <div style={styles.menuCard} onClick={() => { setCurrentStep(2); setReturnToSubmit(false); }}>
                <div style={styles.menuCardIconWrapper}>
                  <div style={styles.menuCardNumber}>02</div>
                  <Fish size={24} color="#003399" />
                </div>
                <div style={styles.menuCardContent}>
                  <div style={styles.menuCardTitle}>Feed Test</div>
                  <div style={styles.menuCardSubtitle}>Last Test: 20 Aug 2026</div>
                  <div style={styles.menuCardStatusDue}>Status: Due</div>
                </div>
                <div style={styles.menuCardAction}>ENTER TEST <ChevronRight size={16} /></div>
              </div>

              <div style={styles.menuCard} onClick={() => { setCurrentStep(3); setReturnToSubmit(false); }}>
                <div style={styles.menuCardIconWrapper}>
                  <div style={styles.menuCardNumber}>03</div>
                  <Pill size={24} color="#15803d" />
                </div>
                <div style={styles.menuCardContent}>
                  <div style={styles.menuCardTitle}>Medication</div>
                  <div style={styles.menuCardSubtitle}>Last Record: 18 Aug 2026</div>
                </div>
                <div style={styles.menuCardAction}>ADD RECORD <ChevronRight size={16} /></div>
              </div>

              <div style={styles.menuCard} onClick={() => { setCurrentStep(4); setReturnToSubmit(false); }}>
                <div style={styles.menuCardIconWrapper}>
                  <div style={styles.menuCardNumber}>04</div>
                  <Bug size={24} color="#b45309" />
                </div>
                <div style={styles.menuCardContent}>
                  <div style={styles.menuCardTitle}>Disease Observation</div>
                  <div style={styles.menuCardSubtitle}>Last Record: 18 Aug 2026</div>
                </div>
                <div style={styles.menuCardAction}>ADD OBSERVATION <ChevronRight size={16} /></div>
              </div>
            </div>
            
            <div style={styles.siteVerifiedBox}>
              <MapPin size={20} color="#15803d" />
              <div>
                <div style={styles.siteVerifiedTitle}>SITE VERIFIED</div>
                <div style={styles.siteVerifiedText}>You are within permitted location.</div>
              </div>
            </div>
          </div>
        );
      case 0:
        return (
          <div style={styles.stepContainer}>
            <div style={styles.gpsBox}>
              {/* GPS Signal Beacon */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '30px',
                backgroundColor: gpsStatus === 'success' ? '#dcfce7' : gpsStatus === 'error' ? '#fef2f2' : '#eff6ff',
                border: gpsStatus === 'success' ? '2px solid #22c55e' : gpsStatus === 'error' ? '2px solid #ef4444' : '2px solid #3b82f6',
                marginBottom: '16px'
              }}>
                <span style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: gpsStatus === 'success' ? '#22c55e' : gpsStatus === 'error' ? '#ef4444' : '#3b82f6',
                  boxShadow: gpsStatus === 'success' ? '0 0 10px #22c55e' : gpsStatus === 'error' ? '0 0 10px #ef4444' : 'none'
                }}></span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: gpsStatus === 'success' ? '#15803d' : gpsStatus === 'error' ? '#b91c1c' : '#1d4ed8'
                }}>
                  {gpsStatus === 'success' ? '🟢 GPS SIGNAL: VERIFIED (GREEN)' : gpsStatus === 'error' ? '🔴 GPS SIGNAL: OUT OF RANGE (RED)' : '🔵 GPS SIGNAL: SEARCHING...'}
                </span>
              </div>

              <h3 style={{ margin: '8px 0 16px 0', fontSize: '18px', fontWeight: '700' }}>GPS Location Signal Verification</h3>
              
              {gpsStatus === 'success' && (
                <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '20px' }}>
                  <div style={{ color: '#166534', fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>
                    <CheckCircle size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }}/>
                    GPS Signal Active & Verified (In Range)
                  </div>
                  <div style={{ fontSize: '13px', color: '#15803d' }}>
                    Latitude: 16.5449° N | Longitude: 81.5212° E (Accuracy: ±3m, Distance from Tank: 12m)
                  </div>
                </div>
              )}

              {gpsStatus === 'error' && (
                <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '20px' }}>
                  <div style={{ color: '#991b1b', fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>
                    ⚠️ GPS Signal Out of Range (Red Light Signal)
                  </div>
                  <div style={{ fontSize: '13px', color: '#b91c1c' }}>
                    Device location is 1.4km away from registered tank coordinates. Please stand closer to the tank bank.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
                <button 
                  className="btn-primary" 
                  style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#16a34a' }} 
                  onClick={() => setGpsStatus('success')}
                >
                  🟢 Verify GPS (Green Signal)
                </button>
                <button 
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                  onClick={() => setGpsStatus('error')}
                >
                  🔴 Out Of Range (Red Signal)
                </button>
              </div>
            </div>
          </div>
        );
      
      case 1:
        return (
          <div style={styles.stepContainer}>
            <div className="grid grid-cols-1 md:grid-cols-2">
              {renderInput('water', 'doc', 'DOC / Date', 'date')}
              {renderInput('water', 'salinity', 'Salinity (ppt)', 'number')}
              {renderInput('water', 'ph', 'pH', 'number')}
              {renderInput('water', 'alkalinity', 'Alkalinity (ppm)', 'number')}
              {renderInput('water', 'hardness', 'Hardness', 'number')}
              {renderInput('water', 'ammonia', 'Ammonia', 'number')}
              {renderInput('water', 'nitrite', 'Nitrite', 'number')}
              {renderInput('water', 'k', 'Potassium (K)', 'number')}
              {renderInput('water', 'do', 'DO (mg/L)', 'number')}
              {renderInput('water', 'h2s', 'H2S', 'number')}
              {renderInput('water', 'chlorine', 'Chlorine', 'number')}
              {renderInput('water', 'iron', 'Iron', 'number')}
              {renderInput('water', 'waterColour', 'Water Colour', 'text', 'e.g. Greenish')}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div style={styles.stepContainer}>
            <div className="grid grid-cols-1 md:grid-cols-2">
              {renderInput('feed', 'doc', 'DOC', 'number')}
              {renderInput('feed', 'seed', 'Seed', 'number')}
              {renderInput('feed', 'abw', 'ABW', 'number')}
              {renderInput('feed', 'dayFeed', 'Day Feed (kg)', 'number')}
              {renderInput('feed', 'cumulativeFeed', 'Cumulative Feed (kg)', 'number')}
              {renderInput('feed', 'totalBiomass', 'Total Biomass (kg)', 'number')}
              {renderInput('feed', 'fcr', 'FCR (Auto-Calculated)', 'text')}
              {renderInput('feed', 'checkTrayFeed', 'Check-tray Feed', 'text')}
              {renderInput('feed', 'checkTrayTime', 'Check-tray Time', 'time')}
              {renderInput('feed', 'remarks', 'Remarks', 'text')}
            </div>
          </div>
        );

      case 3:
        return (
          <div style={styles.stepContainer}>
            <div className="input-group">
              <label style={styles.label}>Treatment Type</label>
              <div className="input-field">
                <select value={formData.medication.treatmentType} onChange={e => updateFormData('medication', 'treatmentType', e.target.value)}>
                  <option value="">Select Type</option>
                  <option value="Preventive">Preventive</option>
                  <option value="Curative">Curative</option>
                </select>
              </div>
            </div>
            {renderInput('medication', 'category', 'Category', 'text', 'e.g. Probiotics')}
            {renderInput('medication', 'product', 'Product Name', 'text')}
            {renderInput('medication', 'dosage', 'Dosage', 'text')}
            {renderInput('medication', 'remarks', 'Remarks', 'text')}
          </div>
        );

      case 4:
        return (
          <div style={styles.stepContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ ...styles.label, margin: 0 }}>Observed Shrimp Diseases</label>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>📷 Shrimp Photo Compilation</span>
            </div>
            
            <div className="grid grid-cols-2" style={{ gap: '12px', marginBottom: '20px' }}>
              {DISEASE_OPTIONS.map(disease => (
                <label key={disease} style={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={formData.disease.observations.includes(disease)}
                    onChange={() => toggleDisease(disease)}
                  />
                  <span>{disease}</span>
                </label>
              ))}
            </div>

            {/* Shrimp Disease Photo Compilation Section */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--color-text-main)' }}>
                  🦐 Shrimp Disease Photo Compilation
                </h4>
                <label style={{
                  padding: '6px 12px',
                  backgroundColor: '#0284c7',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  📷 Upload Shrimp Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        alert(`Uploaded photo: ${e.target.files[0].name} attached to Disease Compilation!`);
                      }
                    }}
                  />
                </label>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                Select visual symptom reference photos to compile with this test record:
              </p>

              {/* Sample Reference Photo Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                {[
                  { name: 'White Gut', color: '#fef3c7', border: '#f59e0b', desc: 'White intestinal tract' },
                  { name: 'WSSV Spot', color: '#fee2e2', border: '#ef4444', desc: 'White spots on carapace' },
                  { name: 'EHP Micro', color: '#f3e8ff', border: '#a855f7', desc: 'Hepatopancreas atrophy' },
                  { name: 'Black Gill', color: '#f1f5f9', border: '#475569', desc: 'Black gill necrosis' },
                  { name: 'Loose Shell', color: '#e0f2fe', border: '#0284c7', desc: 'Soft muscle flaccidity' }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    style={{
                      border: `2px solid ${item.border}`,
                      backgroundColor: item.color,
                      borderRadius: '8px',
                      padding: '10px',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (!formData.disease.observations.includes(item.name)) {
                        toggleDisease(item.name);
                      }
                      alert(`Selected ${item.name} shrimp photo reference for disease compilation.`);
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>🦐</div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>{item.name}</div>
                    <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {renderInput('disease', 'remarks', 'Remarks', 'text', 'Additional observations or photo details')}
          </div>
        );

      case 5:
        return (
          <div style={styles.stepContainer}>
            <div style={styles.reviewBox}>
              {/* 1. Water Quality */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                <h4 style={{ ...styles.reviewTitle, margin: 0, border: 'none', padding: 0 }}>1. WATER QUALITY</h4>
                <button 
                  style={styles.editSectionBtn}
                  onClick={() => { setCurrentStep(1); setReturnToSubmit(true); }}
                >
                  <Edit3 size={14} /> Edit
                </button>
              </div>
              
              {/* 2. Feed */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                <h4 style={{ ...styles.reviewTitle, margin: 0, border: 'none', padding: 0 }}>2. FEED</h4>
                <button 
                  style={styles.editSectionBtn}
                  onClick={() => { setCurrentStep(2); setReturnToSubmit(true); }}
                >
                  <Edit3 size={14} /> Edit
                </button>
              </div>

              {/* 3. Medication */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                <h4 style={{ ...styles.reviewTitle, margin: 0, border: 'none', padding: 0 }}>3. MEDICATION</h4>
                <button 
                  style={styles.editSectionBtn}
                  onClick={() => { setCurrentStep(3); setReturnToSubmit(true); }}
                >
                  <Edit3 size={14} /> Edit
                </button>
              </div>

              {/* 4. Disease */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0', paddingBottom: '4px' }}>
                <h4 style={{ ...styles.reviewTitle, margin: 0, border: 'none', padding: 0 }}>4. DISEASE</h4>
                <button 
                  style={styles.editSectionBtn}
                  onClick={() => { setCurrentStep(4); setReturnToSubmit(true); }}
                >
                  <Edit3 size={14} /> Edit
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={handleBack}>
          <ArrowLeft size={20} />
          <span>{currentStep === 0 ? 'Cancel Visit' : 'Back'}</span>
        </button>
        {currentStep > 0 && currentStep < 5 && (
          <button style={styles.draftBtn} onClick={handleSaveDraft}>
            <Save size={16} /> Save Draft
          </button>
        )}
      </div>

      <div className="card">
        <div style={styles.cardHeader}>
          <h2 style={{...styles.title, textAlign: currentStep === 'MENU' ? 'center' : 'left'}}>{currentStep === 'MENU' ? `${tank.name} - Tests` : STEPS[currentStep]}</h2>
          {currentStep !== 'MENU' && <div style={styles.subtitle}>{tank.name} - Step {currentStep + 1} of {STEPS.length}</div>}
        </div>

        {/* Progress Bar */}
        {currentStep !== 'MENU' && (
          <div style={styles.progressContainer}>
            <div style={{
              ...styles.progressBar, 
              width: `${((currentStep + 1) / STEPS.length) * 100}%`
            }}></div>
          </div>
        )}

        {/* Content */}
        {renderStepContent()}

        {/* Footer Actions */}
        <div style={styles.footer}>
          {currentStep === 0 ? (
            <button 
              className="btn-primary"
              onClick={handleNext}
              disabled={gpsStatus !== 'success'}
            >
              Continue
            </button>
          ) : currentStep === 'MENU' ? (
            <button 
              className="btn-primary"
              onClick={handleNext}
              style={{ width: '100%', padding: '16px', fontSize: '15px' }}
            >
              EDIT & SUBMIT
            </button>
          ) : currentStep === 5 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <button 
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#EAF3FF',
                  color: '#2563D9',
                  border: '1px solid #2563D9',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onClick={() => { setCurrentStep(1); setReturnToSubmit(true); }}
              >
                <Edit3 size={16} /> Edit Test Data
              </button>
              <button 
                className="btn-primary"
                style={{ backgroundColor: '#22A65A', width: '100%', padding: '16px', fontSize: '15px' }}
                onClick={handleSubmit}
              >
                <Send size={18} /> SUBMIT TESTS
              </button>
            </div>
          ) : (
            <button 
              className="btn-primary"
              onClick={handleNext}
              style={{ width: '100%', padding: '16px', fontSize: '15px' }}
            >
              Save & Return
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#17233C', fontWeight: '600', cursor: 'pointer', fontSize: '15px' },
  draftBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#EAF3FF', border: '1px solid #DCE4EE', padding: '6px 12px', borderRadius: '6px', color: '#2563D9', fontWeight: '600', cursor: 'pointer', fontSize: '13px' },
  cardHeader: { marginBottom: '16px' },
  title: { fontSize: '20px', fontWeight: '700', color: '#17233C', marginBottom: '4px' },
  subtitle: { fontSize: '13px', color: '#64748B' },
  progressContainer: { height: '6px', backgroundColor: '#DCE4EE', borderRadius: '3px', overflow: 'hidden', marginBottom: '24px' },
  progressBar: { height: '100%', backgroundColor: '#2563D9', transition: 'width 0.3s ease' },
  stepContainer: { minHeight: '250px' },
  gpsBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px dashed #DCE4EE' },
  label: { fontSize: '13px', fontWeight: '600', color: '#17233C', marginBottom: '8px', display: 'block' },
  warningText: { color: '#E9A400', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#EAF3FF', padding: '10px 12px', borderRadius: '6px' },
  footer: { marginTop: '24px', borderTop: '1px solid #DCE4EE', paddingTop: '20px' },
  reviewBox: { backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #DCE4EE', fontSize: '14px' },
  reviewTitle: { fontSize: '13px', fontWeight: '700', color: '#2563D9', marginTop: '20px', marginBottom: '8px', textTransform: 'uppercase', borderBottom: '1px solid #DCE4EE', paddingBottom: '4px' },
  reviewGrid: { gap: '8px', fontSize: '13px', color: '#64748B' },
  loading: { padding: '40px', textAlign: 'center', color: '#64748B' },
  
  editDataBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#EAF3FF',
    color: '#2563D9',
    border: '1px solid #2563D9',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  editSectionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: '#EAF3FF',
    color: '#2563D9',
    border: '1px solid #DCE4EE',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  // Menu Styles
  menuContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },
  menuHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  menuLabel: { fontSize: '12px', color: '#64748B', fontWeight: '600', marginBottom: '2px' },
  menuValue: { fontSize: '15px', color: '#17233C', fontWeight: '700' },
  menuStatusVerified: { display: 'flex', alignItems: 'center', color: '#22A65A', fontSize: '14px', fontWeight: '600' },
  menuList: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' },
  menuCard: { display: 'flex', alignItems: 'center', padding: '16px', backgroundColor: '#FFFFFF', border: '1px solid #DCE4EE', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(23, 35, 60, 0.04)' },
  menuCardIconWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF3FF', borderRadius: '8px', padding: '8px 12px', marginRight: '16px', minWidth: '60px' },
  menuCardNumber: { fontSize: '12px', fontWeight: '700', color: '#2563D9', marginBottom: '4px' },
  menuCardContent: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
  menuCardTitle: { fontSize: '15px', fontWeight: '700', color: '#17233C' },
  menuCardSubtitle: { fontSize: '13px', color: '#64748B' },
  menuCardStatusDue: { fontSize: '12px', fontWeight: '600', color: '#DC3F3F' },
  menuCardAction: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700', color: '#2563D9' },
  siteVerifiedBox: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: '#E8F8EE', border: '1px dashed #22A65A', borderRadius: '8px', marginTop: '16px' },
  siteVerifiedTitle: { fontSize: '14px', fontWeight: '700', color: '#22A65A' },
  siteVerifiedText: { fontSize: '13px', color: '#166534', marginTop: '2px' },
};

export default SiteVisit;