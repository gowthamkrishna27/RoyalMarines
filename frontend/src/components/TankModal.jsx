import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Trash2, Droplets, Database, Calendar, MapPin } from 'lucide-react';
import { useMockData } from '../context/MockDataContext';
import TankBoundaryEditor from './TankBoundaryEditor';

const TankModal = ({ isOpen, onClose, tank = null, farmerId = null, defaultAgentId = null }) => {
  const { addTank, editTank, deleteTank, db } = useMockData();
  const [formData, setFormData] = useState({
    name: '',
    farmerId: farmerId || '',
    agentId: defaultAgentId || 'agent001',
    acres: '3 Acres',
    salinity: '16 ppt',
    soilType: 'Loam',
    hatchery: 'Golden Marine Hatchery',
    brooder: 'Kona Bay',
    customBrooder: '',
    seedDate: new Date().toISOString().split('T')[0],
    seedStockingLak: '2.5',
    feedType: 'Premium',
    waterSource: 'Borewell',
    abw: '12g',
    biomass: '800kg',
    fcr: '1.2',
    testStatus: 'Due',
    boundaryCoordinates: null,
    boundaryMethod: null,
    boundaryAreaAcres: null,
    boundaryQuality: null,
    boundaryCapturedAt: null,
  });

  const [showBoundaryEditor, setShowBoundaryEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const isEditing = Boolean(tank);

  useEffect(() => {
    if (tank) {
      setFormData({
        name: tank.name || '',
        farmerId: tank.farmerId || farmerId || '',
        agentId: tank.agentId || defaultAgentId || 'agent001',
        acres: tank.acres || (tank.area ? `${tank.area} Acres` : '3 Acres'),
        salinity: tank.salinity ? (String(tank.salinity).includes('ppt') ? tank.salinity : `${tank.salinity} ppt`) : '16 ppt',
        soilType: tank.soilType || 'Loam',
        hatchery: tank.hatchery || 'Golden Marine Hatchery',
        brooder: tank.brooder || 'Kona Bay',
        customBrooder: tank.customBrooder || '',
        seedDate: tank.seedDate || (tank.stockingDate || new Date().toISOString().split('T')[0]),
        seedStockingLak: tank.seedStockingLak || '2.5',
        feedType: tank.feedType || 'Premium',
        waterSource: tank.waterSource || 'Borewell',
        abw: tank.abw || '12g',
        biomass: tank.biomass || '800kg',
        fcr: tank.fcr || '1.2',
        testStatus: tank.testStatus || 'Due',
        boundaryCoordinates: tank.boundaryCoordinates || null,
        boundaryMethod: tank.boundaryMethod || null,
        boundaryAreaAcres: tank.boundaryAreaAcres != null ? tank.boundaryAreaAcres : null,
        boundaryQuality: tank.boundaryQuality || null,
        boundaryCapturedAt: tank.boundaryCapturedAt || null,
      });
    } else {
      const targetFarmerId = farmerId || (db?.farmers?.[0]?.id || '');
      const existingFarmerTanks = (db?.tanks || []).filter(t => t.farmerId === targetFarmerId);
      const defaultTankName = `Tank ${existingFarmerTanks.length + 1}`;

      setFormData({
        name: defaultTankName,
        farmerId: targetFarmerId,
        agentId: defaultAgentId || 'agent001',
        acres: '',
        salinity: '',
        soilType: '',
        hatchery: '',
        brooder: '',
        customBrooder: '',
        seedDate: '',
        seedStockingLak: '',
        feedType: '',
        waterSource: '',
        abw: '',
        biomass: '',
        fcr: '',
        testStatus: 'Due',
        boundaryCoordinates: null,
        boundaryMethod: null,
        boundaryAreaAcres: null,
        boundaryQuality: null,
        boundaryCapturedAt: null,
      });
    }
    setErrorMsg('');
  }, [tank, farmerId, defaultAgentId, db]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!formData.name) {
      alert('Please enter a Tank Name.');
      return;
    }

    if ((formData.brooder === 'Others' || formData.brooder === 'Other') && !formData.customBrooder?.trim()) {
      alert('Please specify other brooder details.');
      return;
    }

    const payload = {
      ...formData,
      stockingDate: formData.seedDate || formData.stockingDate,
      seedDate: formData.seedDate || formData.stockingDate,
      brooder: (formData.brooder === 'Others' || formData.brooder === 'Other')
        ? (formData.customBrooder?.trim() || 'Others')
        : formData.brooder,
      ...(formData.boundaryCoordinates !== undefined ? {
        boundaryCoordinates: formData.boundaryCoordinates,
        boundaryMethod: formData.boundaryMethod,
        boundaryAreaAcres: formData.boundaryAreaAcres,
        boundaryQuality: formData.boundaryQuality,
        boundaryCapturedAt: formData.boundaryCapturedAt,
      } : {}),
    };

    setSaving(true);
    setErrorMsg('');
    try {
      if (isEditing) {
        await editTank(tank.id, payload);
      } else {
        await addTank(payload);
      }
      setSaving(false);
      onClose();
    } catch (err) {
      console.error('[TankModal] Save operation failed:', err);
      setSaving(false);
      const msg = err.response?.data?.message || err.message || 'Failed to save tank to database';
      setErrorMsg(msg);
      alert(`Error saving tank: ${msg}`);
    }
  };

  const handleSaveBoundary = (boundaryData) => {
    setFormData(prev => ({
      ...prev,
      boundaryCoordinates: boundaryData.boundaryCoordinates,
      boundaryMethod: boundaryData.boundaryMethod,
      boundaryAreaAcres: boundaryData.boundaryAreaAcres,
      boundaryQuality: boundaryData.boundaryQuality,
      boundaryCapturedAt: boundaryData.boundaryCapturedAt,
    }));
  };

  const handleDelete = async () => {
    if (saving) return;
    if (window.confirm(`Are you sure you want to remove Tank "${tank.name}"? This action cannot be undone.`)) {
      setSaving(true);
      setErrorMsg('');
      try {
        await deleteTank(tank.id);
        setSaving(false);
        onClose();
      } catch (err) {
        console.error('[TankModal] Delete operation failed:', err);
        setSaving(false);
        const msg = err.response?.data?.message || err.message || 'Failed to delete tank from database';
        setErrorMsg(msg);
        alert(`Error deleting tank: ${msg}`);
      }
    }
  };

  return createPortal(
    <div className="animate-backdrop-in" style={styles.overlay} onClick={onClose}>
      <div className="animate-modal-in" style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} color="#2563D9" />
            <h3 style={styles.modalTitle}>{isEditing ? `Edit Tank (${tank.id})` : 'Add New Tank'}</h3>
          </div>
          <button style={styles.closeBtn} onClick={onClose} type="button">
            <X size={20} color="#64748B" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={styles.label}>Tank Name / Number *</label>
            <input
              type="text"
              placeholder="e.g. Tank 1 or North Tank 2"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={styles.input}
              required
            />
          </div>

          {!farmerId && (
            <div>
              <label style={styles.label}>Farmer Assignment *</label>
              <select
                value={formData.farmerId}
                onChange={(e) => setFormData({ ...formData, farmerId: e.target.value })}
                style={styles.input}
              >
                {db.farmers.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.id}) - {f.location}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={styles.label}>Tank Size (Acres) *</label>
              <input
                type="text"
                placeholder="e.g. 2.5 Acres"
                value={formData.acres}
                onChange={(e) => setFormData({ ...formData, acres: e.target.value })}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Salinity Level *</label>
              <input
                type="text"
                placeholder="e.g. 16 ppt"
                value={formData.salinity}
                onChange={(e) => setFormData({ ...formData, salinity: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={styles.label}>Soil Type *</label>
              <select
                value={formData.soilType}
                onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                style={styles.input}
              >
                <option value="">Select Soil Type</option>
                <option value="Loam">Loam</option>
                <option value="Clay">Clay</option>
                <option value="Sandy">Sandy</option>
                <option value="Clay Loam">Clay Loam</option>
                <option value="Sandy Clay">Sandy Clay</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Hatchery Name *</label>
              <input
                type="text"
                placeholder="e.g. Golden Marine Hatchery"
                value={formData.hatchery}
                onChange={(e) => setFormData({ ...formData, hatchery: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={styles.label}>Brooder *</label>
              <select
                value={formData.brooder}
                onChange={(e) => setFormData({ ...formData, brooder: e.target.value })}
                style={styles.input}
              >
                <option value="">Select Brooder</option>
                <option value="Syaqua">Syaqua</option>
                <option value="Kona Bay">Kona Bay</option>
                <option value="SIS">SIS (Shrimp Improvement Systems)</option>
                <option value="American Penaeid">American Penaeid</option>
                <option value="Others">Others</option>
              </select>
              {(formData.brooder === 'Others' || formData.brooder === 'Other') && (
                <div style={{ marginTop: '8px' }}>
                  <label style={{ ...styles.label, fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
                    Specify Other Brooder Details *
                  </label>
                  <input
                    type="text"
                    value={formData.customBrooder || ''}
                    onChange={(e) => setFormData({ ...formData, customBrooder: e.target.value })}
                    style={styles.input}
                    placeholder="Enter other brooder details (mandatory)"
                    required
                    autoFocus
                  />
                </div>
              )}
            </div>
            <div>
              <label style={styles.label}>Seed Date *</label>
              <input
                type="date"
                value={formData.seedDate}
                onChange={(e) => setFormData({ ...formData, seedDate: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={styles.label}>Seed NumberStocking (Lak) *</label>
              <input
                type="text"
                placeholder="e.g. 2.5"
                value={formData.seedStockingLak}
                onChange={(e) => setFormData({ ...formData, seedStockingLak: e.target.value })}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Feed Type *</label>
              <select
                value={formData.feedType}
                onChange={(e) => setFormData({ ...formData, feedType: e.target.value })}
                style={styles.input}
              >
                <option value="">Select Feed Type</option>
                <option value="Premium">Premium</option>
                <option value="Functional">Functional</option>
                <option value="Hypro">Hypro</option>
                <option value="Tiger Feed">Tiger Feed</option>
                <option value="Royals Supreme">Royals Supreme</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={styles.label}>Water Source</label>
              <select
                value={formData.waterSource}
                onChange={(e) => setFormData({ ...formData, waterSource: e.target.value })}
                style={styles.input}
              >
                <option value="">Select Water Source</option>
                <option value="Borewell">Borewell</option>
                <option value="Canal">Canal Water</option>
                <option value="Creek">Creek / Estuary</option>
                <option value="Seawater">Seawater Intake</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Test Compliance Status</label>
              <select
                value={formData.testStatus}
                onChange={(e) => setFormData({ ...formData, testStatus: e.target.value })}
                style={styles.input}
              >
                <option value="Due">Test Due</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={styles.label}>ABW (g)</label>
              <input
                type="text"
                placeholder="e.g. 12g"
                value={formData.abw}
                onChange={(e) => setFormData({ ...formData, abw: e.target.value })}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Biomass</label>
              <input
                type="text"
                placeholder="e.g. 800kg"
                value={formData.biomass}
                onChange={(e) => setFormData({ ...formData, biomass: e.target.value })}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>FCR Ratio</label>
              <input
                type="text"
                placeholder="e.g. 1.2"
                value={formData.fcr}
                onChange={(e) => setFormData({ ...formData, fcr: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          {/* Tank Boundary (Satellite / GPS Walk) Section */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '12px 14px',
            marginTop: '4px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="#2563EB" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Tank Boundary Registration</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    {formData.boundaryCoordinates
                      ? `Captured via ${formData.boundaryMethod === 'gps_walk' ? 'GPS Walk' : 'Satellite Map'} (${formData.boundaryAreaAcres || '--'} Acres)`
                      : 'Capture boundary via Satellite or GPS Walk (Optional)'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBoundaryEditor(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: formData.boundaryCoordinates ? '#EFF6FF' : '#2563EB',
                  color: formData.boundaryCoordinates ? '#2563EB' : '#FFFFFF',
                  border: formData.boundaryCoordinates ? '1px solid #BFDBFE' : 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {formData.boundaryCoordinates ? 'Edit Boundary' : '+ Set Boundary'}
              </button>
            </div>
            {formData.boundaryCoordinates && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                color: '#15803D'
              }}>
                <span>✓ Verified Boundary: <strong>{formData.boundaryAreaAcres} Acres</strong> ({formData.boundaryQuality || 'High'})</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    boundaryCoordinates: null,
                    boundaryMethod: null,
                    boundaryAreaAcres: null,
                    boundaryQuality: null,
                    boundaryCapturedAt: null,
                  }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#DC2626',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {errorMsg && (
            <div style={{ color: '#DC2626', fontSize: '13px', marginTop: '8px', padding: '8px', backgroundColor: '#FEE2E2', borderRadius: '6px' }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  backgroundColor: '#FDECEC',
                  color: '#DC3F3F',
                  border: '1px solid #DC3F3F',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  opacity: saving ? 0.6 : 1
                }}
              >
                <Trash2 size={16} /> {saving ? 'Deleting...' : 'Remove Tank'}
              </button>
            ) : <div></div>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DCE4EE',
                  color: '#17233C',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{
                  width: 'auto',
                  padding: '8px 20px',
                  fontSize: '14px',
                  gap: '6px',
                  backgroundColor: '#2563D9',
                  color: '#FFFFFF',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                <Save size={16} /> {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Tank')}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showBoundaryEditor && (
        <TankBoundaryEditor
          isOpen={showBoundaryEditor}
          onClose={() => setShowBoundaryEditor(false)}
          onSaveBoundary={handleSaveBoundary}
          initialBoundary={formData.boundaryCoordinates ? {
            coordinates: formData.boundaryCoordinates.coordinates,
            boundaryMethod: formData.boundaryMethod,
            points: formData.boundaryCoordinates.points || null,
          } : null}
          tankName={formData.name || 'Tank'}
          enteredAcres={formData.acres}
          initialLocation={null}
        />
      )}
    </div>,
    document.body
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    height: '100dvh',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
    padding: '16px',
    boxSizing: 'border-box',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: 'calc(100vh - 32px)',
    maxHeight: 'calc(100dvh - 32px)',
    padding: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    margin: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #DCE4EE',
    paddingBottom: '12px'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#17233C',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748B',
    padding: '4px',
    borderRadius: '50%'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#17233C',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #DCE4EE',
    backgroundColor: '#FFFFFF',
    color: '#17233C',
    boxSizing: 'border-box'
  }
};

export default TankModal;
