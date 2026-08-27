import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Droplets, Database, Calendar } from 'lucide-react';
import { useMockData } from '../context/MockDataContext';

const TankModal = ({ isOpen, onClose, tank = null, farmerId = null, defaultAgentId = null }) => {
  const { addTank, editTank, deleteTank, db } = useMockData();
  const [formData, setFormData] = useState({
    name: '',
    farmerId: farmerId || '',
    agentId: defaultAgentId || 'agent001',
    acres: '3 Acres',
    salinity: '15 ppt',
    waterSource: 'Borewell',
    abw: '12g',
    biomass: '800kg',
    fcr: '1.2',
    testStatus: 'Due'
  });

  const isEditing = Boolean(tank);

  useEffect(() => {
    if (tank) {
      setFormData({
        name: tank.name || '',
        farmerId: tank.farmerId || farmerId || '',
        agentId: tank.agentId || defaultAgentId || 'agent001',
        acres: tank.acres || '3 Acres',
        salinity: tank.salinity || '15 ppt',
        waterSource: tank.waterSource || 'Borewell',
        abw: tank.abw || '12g',
        biomass: tank.biomass || '800kg',
        fcr: tank.fcr || '1.2',
        testStatus: tank.testStatus || 'Due'
      });
    } else {
      setFormData({
        name: '',
        farmerId: farmerId || (db.farmers[0] ? db.farmers[0].id : ''),
        agentId: defaultAgentId || 'agent001',
        acres: '3 Acres',
        salinity: '15 ppt',
        waterSource: 'Borewell',
        abw: '12g',
        biomass: '800kg',
        fcr: '1.2',
        testStatus: 'Due'
      });
    }
  }, [tank, farmerId, defaultAgentId, db]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter a Tank Name.');
      return;
    }

    if (isEditing) {
      editTank(tank.id, formData);
    } else {
      addTank(formData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove Tank "${tank.name}"? This action cannot be undone.`)) {
      deleteTank(tank.id);
      onClose();
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard}>
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
              placeholder="e.g. Tank 1 or North Pond 2"
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
              <label style={styles.label}>Tank Size / Acres</label>
              <input
                type="text"
                placeholder="e.g. 4 Acres"
                value={formData.acres}
                onChange={(e) => setFormData({ ...formData, acres: e.target.value })}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Salinity Level</label>
              <input
                type="text"
                placeholder="e.g. 15 ppt"
                value={formData.salinity}
                onChange={(e) => setFormData({ ...formData, salinity: e.target.value })}
                style={styles.input}
              />
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
                placeholder="12g"
                value={formData.abw}
                onChange={(e) => setFormData({ ...formData, abw: e.target.value })}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Biomass</label>
              <input
                type="text"
                placeholder="800kg"
                value={formData.biomass}
                onChange={(e) => setFormData({ ...formData, biomass: e.target.value })}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>FCR Ratio</label>
              <input
                type="text"
                placeholder="1.2"
                value={formData.fcr}
                onChange={(e) => setFormData({ ...formData, fcr: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  backgroundColor: '#FDECEC',
                  color: '#DC3F3F',
                  border: '1px solid #DC3F3F',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px'
                }}
              >
                <Trash2 size={16} /> Remove Tank
              </button>
            ) : <div></div>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DCE4EE',
                  color: '#17233C',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: 'auto', padding: '8px 20px', fontSize: '14px', gap: '6px', backgroundColor: '#2563D9', color: '#FFFFFF' }}
              >
                <Save size={16} /> {isEditing ? 'Save Changes' : 'Create Tank'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(23, 35, 60, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '520px',
    padding: '24px',
    boxShadow: '0 20px 25px -5px rgba(23, 35, 60, 0.1), 0 10px 10px -5px rgba(23, 35, 60, 0.04)'
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
