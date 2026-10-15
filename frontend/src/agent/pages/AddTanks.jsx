import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Droplet, MapPin } from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';
import TankBoundaryEditor from '../../components/TankBoundaryEditor';

const AddTanks = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [tanksData, setTanksData] = useState([]);
  const [boundaryModalTankIndex, setBoundaryModalTankIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { createFarmerWithTanks } = useMockData();

  const farmerData = location.state?.farmerData;

  useEffect(() => {
    const s = getSession() || { agentId: 'agent001', name: 'Ramesh Kumar', role: 'AGENT' };
    setSession(s);

    if (!farmerData) {
      navigate('/dashboard');
      return;
    }

    const numTanks = parseInt(farmerData.numberOfTanks) || 1;
    const initialTanksArray = Array.from({ length: numTanks }, () => ({
      size: '2.5',
      salinity: '16',
      soilType: 'Loam',
      hatchery: 'Golden Marine Hatchery',
      brooder: 'Kona Bay',
      customBrooder: '',
      seedDate: new Date().toISOString().split('T')[0],
      seedStockingLak: '2.5',
      feedType: 'Premium',
      species: 'Vannamei'
    }));
    setTanksData(initialTanksArray);
  }, [farmerData, navigate]);

  if (!farmerData || !session) return null;

  const handleTankChange = (index, field, value) => {
    const newTanks = [...tanksData];
    newTanks[index][field] = value;
    setTanksData(newTanks);
  };

  const handleSave = async () => {
    if (isSaving) return;

    for (let i = 0; i < tanksData.length; i++) {
      const t = tanksData[i];
      if ((t.brooder === 'Others' || t.brooder === 'Other') && !t.customBrooder?.trim()) {
        alert(`Please specify other brooder details for Tank ${i + 1}.`);
        return;
      }
    }

    const resolvedTanks = tanksData.map(tank => ({
      ...tank,
      brooder: (tank.brooder === 'Others' || tank.brooder === 'Other')
        ? (tank.customBrooder?.trim() || 'Others')
        : tank.brooder,
      customBrooder: tank.customBrooder?.trim() || '',
    }));

    setIsSaving(true);
    try {
      await createFarmerWithTanks(session.agentId, farmerData, resolvedTanks);
      setIsSaving(false);
      alert('Farmer and tanks saved successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error('[AddTanks] handleSave failed:', err);
      setIsSaving(false);
      if (err.partialFailure) {
        alert(`Farmer was created (ID: ${err.farmerId}), but some tanks failed to save: ${err.message}.`);
        navigate('/dashboard');
      } else {
        const msg = err.response?.data?.message || err.message || 'Failed to save farmer and tanks to database';
        alert(`Error saving farmer: ${msg}`);
      }
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={styles.summaryBox}>
          <div>
            <div style={styles.summaryLabel}>Farmer Name</div>
            <div style={styles.summaryValue}>{farmerData.name}</div>
          </div>
          <div>
            <div style={styles.summaryLabel}>Total Tanks</div>
            <div style={styles.summaryValue}>{farmerData.numberOfTanks}</div>
          </div>
        </div>
      </div>

      {tanksData.map((tank, index) => (
        <div key={index} className="card" style={{ marginBottom: '16px' }}>
          <div style={styles.tankHeader}>
            <div style={styles.iconCircle}>
              <Droplet size={20} color="#1A2FB8" />
            </div>
            <h3 style={styles.tankTitle}>Tank {index + 1}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '16px' }}>
            {/* 1. Tank Size- Acres */}
            <div className="input-group">
              <label style={styles.label}>Tank Size (Acres) *</label>
              <div className="input-field">
                <input
                  type="number"
                  step="0.1"
                  value={tank.size}
                  placeholder="e.g. 2.5"
                  onChange={e => handleTankChange(index, 'size', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 2. Salinity */}
            <div className="input-group">
              <label style={styles.label}>Salinity (ppt) *</label>
              <div className="input-field">
                <input
                  type="number"
                  step="0.1"
                  value={tank.salinity}
                  placeholder="e.g. 16"
                  onChange={e => handleTankChange(index, 'salinity', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 3. Soil Type */}
            <div className="input-group">
              <label style={styles.label}>Soil Type *</label>
              <div className="input-field">
                <select value={tank.soilType} onChange={e => handleTankChange(index, 'soilType', e.target.value)} required>
                  <option value="Loam">Loam</option>
                  <option value="Clay">Clay</option>
                  <option value="Sandy">Sandy</option>
                  <option value="Clay Loam">Clay Loam</option>
                  <option value="Sandy Clay">Sandy Clay</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* 4. Hatchery Name */}
            <div className="input-group">
              <label style={styles.label}>Hatchery Name *</label>
              <div className="input-field">
                <input
                  type="text"
                  value={tank.hatchery}
                  placeholder="e.g. Golden Marine / BMR"
                  onChange={e => handleTankChange(index, 'hatchery', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 5. Brooder */}
            <div className="input-group">
              <label style={styles.label}>Brooder *</label>
              <div className="input-field">
                <select value={tank.brooder} onChange={e => handleTankChange(index, 'brooder', e.target.value)} required>
                  <option value="Syaqua">Syaqua</option>
                  <option value="Kona Bay">Kona Bay</option>
                  <option value="SIS">SIS (Shrimp Improvement Systems)</option>
                  <option value="American Penaeid">American Penaeid</option>
                  <option value="Others">Others</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {(tank.brooder === 'Others' || tank.brooder === 'Other') && (
                <div style={{ marginTop: '8px' }}>
                  <label style={{ ...styles.label, fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
                    Specify Other Brooder Details *
                  </label>
                  <input
                    type="text"
                    value={tank.customBrooder || ''}
                    onChange={e => handleTankChange(index, 'customBrooder', e.target.value)}
                    style={styles.input}
                    placeholder="Enter other brooder details (mandatory)"
                    required
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* 6. Seed Date */}
            <div className="input-group">
              <label style={styles.label}>Seed Date *</label>
              <div className="input-field">
                <input
                  type="date"
                  value={tank.seedDate}
                  onChange={e => handleTankChange(index, 'seedDate', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 7. Seed NumberStocking (Lak) */}
            <div className="input-group">
              <label style={styles.label}>Seed NumberStocking (Lak) *</label>
              <div className="input-field">
                <input
                  type="number"
                  step="0.01"
                  value={tank.seedStockingLak}
                  placeholder="e.g. 2.5"
                  onChange={e => handleTankChange(index, 'seedStockingLak', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 8. Feed Type */}
            <div className="input-group">
              <label style={styles.label}>Feed Type *</label>
              <div className="input-field">
                <select value={tank.feedType} onChange={e => handleTankChange(index, 'feedType', e.target.value)} required>
                  <option value="Premium">Premium</option>
                  <option value="Functional">Functional</option>
                  <option value="Hypro">Hypro</option>
                  <option value="Tiger Feed">Tiger Feed</option>
                  <option value="Royals Supreme">Royals Supreme</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* 9. Species */}
            <div className="input-group">
              <label style={styles.label}>Species *</label>
              <div className="input-field">
                <select value={tank.species} onChange={e => handleTankChange(index, 'species', e.target.value)}>
                  <option value="Vannamei">Vannamei</option>
                  <option value="Monodon">Monodon (Black Tiger)</option>
                  <option value="Scampi">Scampi</option>
                  <option value="Fish">Fish / Tilapia</option>
                </select>
              </div>
            </div>

            {/* Tank Boundary (Satellite / GPS Walk) Registration */}
            <div style={{
              gridColumn: '1 / -1',
              marginTop: '12px',
              padding: '12px 14px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="#2563EB" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                    Tank Boundary Registration
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    {tank.boundaryCoordinates
                      ? `✓ Captured via ${tank.boundaryMethod === 'gps_walk' ? 'GPS Walk' : 'Satellite'} (${tank.boundaryAreaAcres || '--'} Acres)`
                      : 'Capture boundary via Satellite Map or Walk-Around GPS (Optional)'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBoundaryModalTankIndex(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 14px',
                  backgroundColor: tank.boundaryCoordinates ? '#EFF6FF' : '#2563EB',
                  color: tank.boundaryCoordinates ? '#2563EB' : '#FFFFFF',
                  border: tank.boundaryCoordinates ? '1px solid #BFDBFE' : 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {tank.boundaryCoordinates ? 'Edit Boundary' : '+ Set Boundary'}
              </button>
            </div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: '24px', marginBottom: '40px' }}>
        <button
          className="btn-primary"
          style={{
            backgroundColor: '#22A65A',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.7 : 1
          }}
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save size={18} /> {isSaving ? 'Saving...' : 'Save Farmer & Tanks'}
        </button>
      </div>

      {boundaryModalTankIndex !== null && (
        <TankBoundaryEditor
          isOpen={boundaryModalTankIndex !== null}
          onClose={() => setBoundaryModalTankIndex(null)}
          onSaveBoundary={(boundaryData) => {
            setTanksData(prev => {
              const updated = [...prev];
              updated[boundaryModalTankIndex] = {
                ...updated[boundaryModalTankIndex],
                boundaryCoordinates: boundaryData.boundaryCoordinates,
                boundaryMethod: boundaryData.boundaryMethod,
                boundaryAreaAcres: boundaryData.boundaryAreaAcres,
                boundaryQuality: boundaryData.boundaryQuality,
                boundaryCapturedAt: boundaryData.boundaryCapturedAt,
              };
              return updated;
            });
            setBoundaryModalTankIndex(null);
          }}
          initialBoundary={tanksData[boundaryModalTankIndex]?.boundaryCoordinates ? {
            coordinates: tanksData[boundaryModalTankIndex].boundaryCoordinates.coordinates,
            boundaryMethod: tanksData[boundaryModalTankIndex].boundaryMethod,
            points: tanksData[boundaryModalTankIndex].boundaryCoordinates.points || null,
          } : null}
          tankName={`Tank ${boundaryModalTankIndex + 1}`}
          enteredAcres={tanksData[boundaryModalTankIndex]?.size ? `${tanksData[boundaryModalTankIndex].size} Acres` : ''}
          initialLocation={null}
        />
      )}

    </div>
  );
};

const styles = {
  header: { display: 'flex', alignItems: 'center', marginBottom: '20px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#17233C', fontWeight: '600', cursor: 'pointer', fontSize: '15px' },
  summaryBox: { display: 'flex', gap: '40px', padding: '12px' },
  summaryLabel: { fontSize: '12px', color: '#64748B', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' },
  summaryValue: { fontSize: '18px', fontWeight: '700', color: '#1A2FB8' },
  tankHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #DCE4EE', paddingBottom: '12px' },
  iconCircle: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EAF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tankTitle: { fontSize: '16px', fontWeight: '700', color: '#17233C' },
  label: { fontSize: '13px', fontWeight: '600', color: '#17233C', marginBottom: '8px', display: 'block' },
};

export default AddTanks;
