import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Droplet } from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';

const AddTanks = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [tanksData, setTanksData] = useState([]);
  const { createFarmerWithTanks } = useMockData();
  
  const farmerData = location.state?.farmerData;

  useEffect(() => {
    const s = getSession();
    if (!s) {
      navigate('/login');
      return;
    }
    setSession(s);

    if (!farmerData) {
      navigate('/dashboard');
      return;
    }

    const numTanks = parseInt(farmerData.numberOfTanks) || 1;
    const initialTanksArray = Array.from({ length: numTanks }, () => ({
      size: '',
      salinity: '',
      soilType: '',
      hatchery: '',
      brooder: '',
      seedDate: new Date().toISOString().split('T')[0],
      seedType: ''
    }));
    setTanksData(initialTanksArray);
  }, [farmerData, navigate]);

  if (!farmerData || !session) return null;

  const handleTankChange = (index, field, value) => {
    const newTanks = [...tanksData];
    newTanks[index][field] = value;
    setTanksData(newTanks);
  };

  const handleSave = () => {
    // Validate if necessary, then save
    const newFarmerId = createFarmerWithTanks(session.agentId, farmerData, tanksData);
    alert('Farmer and tanks saved successfully!');
    navigate('/dashboard');
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
              <Droplet size={20} color="#0018AD" />
            </div>
            <h3 style={styles.tankTitle}>Tank {index + 1}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="input-group">
              <label style={styles.label}>Tank Size (Acres)</label>
              <div className="input-field">
                <input 
                  type="number" 
                  value={tank.size} 
                  placeholder="e.g. 1.5"
                  onChange={e => handleTankChange(index, 'size', e.target.value)} 
                />
              </div>
            </div>
            
            <div className="input-group">
              <label style={styles.label}>Salinity (ppt)</label>
              <div className="input-field">
                <input 
                  type="number" 
                  value={tank.salinity} 
                  placeholder="e.g. 15"
                  onChange={e => handleTankChange(index, 'salinity', e.target.value)} 
                />
              </div>
            </div>

            <div className="input-group">
              <label style={styles.label}>Soil Type</label>
              <div className="input-field">
                <input 
                  type="text" 
                  value={tank.soilType} 
                  placeholder="e.g. Clay Loam"
                  onChange={e => handleTankChange(index, 'soilType', e.target.value)} 
                />
              </div>
            </div>

            <div className="input-group">
              <label style={styles.label}>Hatchery Name</label>
              <div className="input-field">
                <input 
                  type="text" 
                  value={tank.hatchery} 
                  placeholder="e.g. ABC Hatcheries"
                  onChange={e => handleTankChange(index, 'hatchery', e.target.value)} 
                />
              </div>
            </div>

            <div className="input-group">
              <label style={styles.label}>Brooder</label>
              <div className="input-field">
                <input 
                  type="text" 
                  value={tank.brooder} 
                  placeholder="e.g. SPF"
                  onChange={e => handleTankChange(index, 'brooder', e.target.value)} 
                />
              </div>
            </div>

            <div className="input-group">
              <label style={styles.label}>Seed Date</label>
              <div className="input-field">
                <input 
                  type="date" 
                  value={tank.seedDate} 
                  onChange={e => handleTankChange(index, 'seedDate', e.target.value)} 
                />
              </div>
            </div>
            
            <div className="input-group">
              <label style={styles.label}>Seed Type</label>
              <div className="input-field">
                <select value={tank.seedType} onChange={e => handleTankChange(index, 'seedType', e.target.value)}>
                  <option value="">Select Type</option>
                  <option value="Vannamei">Vannamei</option>
                  <option value="Monodon">Monodon</option>
                  <option value="Scampi">Scampi</option>
                  <option value="Fish">Fish</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: '24px', marginBottom: '40px' }}>
        <button className="btn-primary" style={{ backgroundColor: '#22A65A' }} onClick={handleSave}>
          <Save size={18} /> Save Farmer & Tanks
        </button>
      </div>

    </div>
  );
};

const styles = {
  header: { display: 'flex', alignItems: 'center', marginBottom: '20px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#17233C', fontWeight: '600', cursor: 'pointer', fontSize: '15px' },
  summaryBox: { display: 'flex', gap: '40px', padding: '12px' },
  summaryLabel: { fontSize: '12px', color: '#64748B', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' },
  summaryValue: { fontSize: '18px', fontWeight: '700', color: '#0018AD' },
  tankHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #DCE4EE', paddingBottom: '12px' },
  iconCircle: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EAF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tankTitle: { fontSize: '16px', fontWeight: '700', color: '#17233C' },
  label: { fontSize: '13px', fontWeight: '600', color: '#17233C', marginBottom: '8px', display: 'block' },
};

export default AddTanks;
