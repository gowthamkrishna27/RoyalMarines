import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scale, User, Phone, MapPin, CheckCircle, Plus, 
  Trash2, Info, FileSpreadsheet, Calendar, Sparkles 
} from 'lucide-react';
import { getSession } from '../utils/agentAuth';
import { useMockData } from '../../context/MockDataContext';
import QuickRecordModal from '../components/QuickRecordModal';

// Initial default harvest store
const initialHarvestStore = {
  'F001_T003': {
    tankSize: '2.5',
    seedNumber: '200000',
    stockingDate: '2026-06-01',
    harvests: [
      { id: 'h1', harvestType: 'Partial Harvest', date: '2026-08-10', doc: '70', abw: '12', harvestedNumber: '60000', harvestedBiomass: '720', remarks: 'First partial thinning' },
      { id: 'h2', harvestType: 'Partial Harvest', date: '2026-08-28', doc: '85', abw: '15', harvestedNumber: '133333', harvestedBiomass: '2000', remarks: 'Harvest completed successfully.' }
    ],
    totalFeed: '3600'
  },
  'F001_T001': {
    tankSize: '3.0',
    seedNumber: '300000',
    stockingDate: '2026-05-15',
    harvests: [
      { id: 'h1', harvestType: 'Partial Harvest', date: '2026-07-20', doc: '65', abw: '10', harvestedNumber: '100000', harvestedBiomass: '1000', remarks: 'Early partial reduction' },
      { id: 'h2', harvestType: 'Partial Harvest', date: '2026-08-15', doc: '90', abw: '16', harvestedNumber: '120000', harvestedBiomass: '1920', remarks: 'Second partial harvest' }
    ],
    totalFeed: '4200'
  }
};

const Harvest = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const { db, getFarmersByAgentId, getTanksByFarmerId } = useMockData();

  // State
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [selectedTankId, setSelectedTankId] = useState('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Store for harvest data per farmer + tank
  const [harvestData, setHarvestData] = useState(() => {
    const saved = localStorage.getItem('agent_harvest_store');
    return saved ? JSON.parse(saved) : initialHarvestStore;
  });

  useEffect(() => {
    const s = getSession();
    if (!s) {
      navigate('/login');
      return;
    }
    setSession(s);

    const agentFarmers = getFarmersByAgentId(s.agentId);
    setFarmers(agentFarmers);

    if (agentFarmers.length > 0) {
      setSelectedFarmerId(agentFarmers[0].id);
      const farmerTanks = getTanksByFarmerId(agentFarmers[0].id);
      if (farmerTanks.length > 0) {
        setSelectedTankId(farmerTanks[0].id);
      }
    }

    const handleStoreUpdate = (e) => {
      if (e.detail) setHarvestData(e.detail);
    };

    window.addEventListener('harvestStoreUpdated', handleStoreUpdate);
    return () => window.removeEventListener('harvestStoreUpdated', handleStoreUpdate);
  }, [navigate]);

  // Update selected tank when farmer changes
  const handleFarmerChange = (farmerId) => {
    setSelectedFarmerId(farmerId);
    const farmerTanks = getTanksByFarmerId(farmerId);
    if (farmerTanks.length > 0) {
      setSelectedTankId(farmerTanks[0].id);
    } else {
      setSelectedTankId('');
    }
  };

  if (!session) return null;

  const currentFarmer = farmers.find(f => f.id === selectedFarmerId) || (farmers.length > 0 ? farmers[0] : {
    name: 'Ravi',
    location: 'Chinnamiram',
    phone: '+91 9876543211'
  });

  const currentTanks = getTanksByFarmerId(selectedFarmerId);
  const activeTank = currentTanks.find(t => t.id === selectedTankId) || (currentTanks.length > 0 ? currentTanks[0] : { id: 'T003', name: 'Tank 3', acres: '2.5' });
  const activeTankKey = `${selectedFarmerId}_${selectedTankId}`;

  // Current tank harvest store
  const currentStore = harvestData[activeTankKey] || {
    tankSize: activeTank?.acres || '2.5',
    seedNumber: activeTank?.seedStocked || '200000',
    stockingDate: activeTank?.stockingDate || '2026-06-01',
    harvests: [],
    totalFeed: '3600'
  };

  const rawHarvests = currentStore.harvests || [];

  // Sort harvests chronologically
  const sortedHarvests = [...rawHarvests].sort((a, b) => {
    return new Date(a.date || 0) - new Date(b.date || 0);
  });

  // Dynamically assign sequence titles: Partial Harvest-1, Partial Harvest-2, ... Final Harvest
  let partialCount = 0;
  const sequencedHarvests = sortedHarvests.map((h) => {
    const isFinal = h.harvestType === 'Final Harvest' || h.isFinal;
    if (isFinal) {
      return { ...h, displayTitle: 'Final Harvest', isFinal: true };
    } else {
      partialCount += 1;
      return { ...h, displayTitle: `Partial Harvest-${partialCount}`, isFinal: false };
    }
  });

  // Auto-calculated totals
  const totalHarvestedSeed = sequencedHarvests.reduce((sum, h) => {
    const num = parseFloat(h.harvestedNumber) || 0;
    if (num > 0) return sum + num;
    const biomass = parseFloat(h.harvestedBiomass) || 0;
    const abw = parseFloat(h.abw) || 0;
    if (biomass > 0 && abw > 0) {
      return sum + Math.round((biomass * 1000) / abw);
    }
    return sum;
  }, 0);

  const totalHarvestedBiomass = sequencedHarvests.reduce((sum, h) => {
    return sum + (parseFloat(h.harvestedBiomass) || 0);
  }, 0);

  const totalFeed = parseFloat(currentStore.totalFeed) || 0;
  const seedStocked = parseFloat(currentStore.seedNumber) || 200000;
  
  const survivalPct = seedStocked > 0 && totalHarvestedSeed > 0
    ? ((totalHarvestedSeed / seedStocked) * 100).toFixed(2)
    : '0.00';

  const fcr = totalHarvestedBiomass > 0
    ? (totalFeed / totalHarvestedBiomass).toFixed(2)
    : '0.00';

  const removeHarvestRecord = (recordId) => {
    if (window.confirm('Delete this harvest record?')) {
      const updatedHarvests = rawHarvests.filter(h => h.id !== recordId);
      const updated = {
        ...harvestData,
        [activeTankKey]: {
          ...currentStore,
          harvests: updatedHarvests
        }
      };
      setHarvestData(updated);
      localStorage.setItem('agent_harvest_store', JSON.stringify(updated));
      setMessage('Harvest record deleted.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const updateMetaField = (field, val) => {
    const updated = {
      ...harvestData,
      [activeTankKey]: {
        ...currentStore,
        [field]: val
      }
    };
    setHarvestData(updated);
    localStorage.setItem('agent_harvest_store', JSON.stringify(updated));
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* 1. Header Bar */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.iconCircle}>
            <Scale size={24} color="#1A2FB8" strokeWidth={2.4} />
          </div>
          <div>
            <h2 style={styles.title}>Harvest Report & Management</h2>
            <div style={styles.subtitle}>Sequential partial & final harvest tracking with auto-generated analytics</div>
          </div>
        </div>

        <button 
          type="button" 
          style={styles.newHarvestBtn}
          onClick={() => setIsRecordModalOpen(true)}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Save Harvest Record</span>
        </button>
      </div>

      {message && (
        <div style={styles.successBanner}>
          <CheckCircle size={16} />
          <span>{message}</span>
        </div>
      )}

      {/* 2. Farmer & Tank Selector */}
      <div style={styles.card}>
        <div style={styles.selectorGrid}>
          <div>
            <label style={styles.miniLabel}>Select Farmer</label>
            <select 
              value={selectedFarmerId} 
              onChange={(e) => handleFarmerChange(e.target.value)}
              style={styles.selectInput}
            >
              {farmers.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.location || 'Chinnamiram'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.miniLabel}>Select Tank</label>
            <select 
              value={selectedTankId} 
              onChange={(e) => setSelectedTankId(e.target.value)}
              style={styles.selectInput}
            >
              {currentTanks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.acres || '2.5'} Acres)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Farmer Info Badges */}
        <div style={styles.farmerDetailsGrid}>
          <div style={styles.farmerBadge}>
            <User size={14} color="#1A2FB8" />
            <span><strong>Farmer:</strong> {currentFarmer.name}</span>
          </div>
          <div style={styles.farmerBadge}>
            <MapPin size={14} color="#16A34A" />
            <span><strong>Village:</strong> {currentFarmer.location || 'Chinnamiram'}</span>
          </div>
          <div style={styles.farmerBadge}>
            <Phone size={14} color="#64748B" />
            <span><strong>Phone:</strong> {currentFarmer.phone || '+91 9876543211'}</span>
          </div>
        </div>
      </div>

      {/* 3. Tank Origin & Stocking Parameters */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Tank Baseline Stocking Specs</h3>
        <div style={styles.specsGrid}>
          <div>
            <label style={styles.miniLabel}>Tank Size (Acres)</label>
            <input 
              type="text" 
              value={currentStore.tankSize || activeTank.acres || '2.5'} 
              onChange={(e) => updateMetaField('tankSize', e.target.value)}
              style={styles.specInput}
            />
          </div>
          <div>
            <label style={styles.miniLabel}>Seed Stocked (Nos)</label>
            <input 
              type="number" 
              value={currentStore.seedNumber || '200000'} 
              onChange={(e) => updateMetaField('seedNumber', e.target.value)}
              style={styles.specInput}
            />
          </div>
          <div>
            <label style={styles.miniLabel}>Stocking Date</label>
            <input 
              type="date" 
              value={currentStore.stockingDate || '2026-06-01'} 
              onChange={(e) => updateMetaField('stockingDate', e.target.value)}
              style={styles.specInput}
            />
          </div>
          <div>
            <label style={styles.miniLabel}>Total Feed Consumed (kg)</label>
            <input 
              type="number" 
              value={currentStore.totalFeed || '3600'} 
              onChange={(e) => updateMetaField('totalFeed', e.target.value)}
              style={styles.specInput}
            />
          </div>
        </div>
      </div>

      {/* 4. Automated Harvest Performance Report (KPIs) */}
      <div style={{ ...styles.card, borderLeft: '4px solid #1A2FB8' }}>
        <div style={styles.reportHeader}>
          <div>
            <h3 style={styles.sectionTitle}>Automated Harvest Performance Summary</h3>
            <span style={styles.reportSub}>Calculated dynamically from all partial and final harvest entries</span>
          </div>
          <span style={styles.autoCalcTag}>
            <Sparkles size={13} /> Auto-Computed
          </span>
        </div>

        <div style={styles.kpiGrid}>
          <div style={styles.kpiBox}>
            <span style={styles.kpiLabel}>Total Harvested Seed</span>
            <div style={styles.kpiVal}>{totalHarvestedSeed.toLocaleString()}</div>
            <span style={styles.kpiFoot}>Nos across all stages</span>
          </div>

          <div style={styles.kpiBox}>
            <span style={styles.kpiLabel}>Total Harvested Biomass</span>
            <div style={{ ...styles.kpiVal, color: '#1A2FB8' }}>{totalHarvestedBiomass.toLocaleString()} kg</div>
            <span style={styles.kpiFoot}>Aggregate crop yield</span>
          </div>

          <div style={styles.kpiBox}>
            <span style={styles.kpiLabel}>Survival Rate</span>
            <div style={{ ...styles.kpiVal, color: '#16A34A' }}>{survivalPct}%</div>
            <span style={styles.kpiFoot}>(Harvested ÷ Stocked) × 100</span>
          </div>

          <div style={styles.kpiBox}>
            <span style={styles.kpiLabel}>Calculated FCR</span>
            <div style={{ ...styles.kpiVal, color: '#D97706' }}>{fcr}</div>
            <span style={styles.kpiFoot}>Total Feed ÷ Biomass</span>
          </div>
        </div>
      </div>

      {/* 5. Dynamic Sequence Breakdown Table */}
      <div style={styles.card}>
        <div style={styles.tableHeaderSection}>
          <div>
            <h3 style={styles.sectionTitle}>Sequential Harvest Records ({sequencedHarvests.length})</h3>
            <span style={styles.reportSub}>Automatically ordered and numbered by chronological occurrence</span>
          </div>

          <button 
            type="button" 
            style={styles.recordSubBtn}
            onClick={() => setIsRecordModalOpen(true)}
          >
            <Plus size={14} /> Add Harvest Entry
          </button>
        </div>

        {sequencedHarvests.length === 0 ? (
          <div style={styles.emptyState}>
            <Scale size={36} color="#94A3B8" />
            <p style={{ margin: '8px 0 0 0', fontWeight: '600', color: '#475569' }}>
              No harvest records saved for {activeTank.name} yet.
            </p>
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>
              Click "Save Harvest Record" above to record Partial or Final harvests.
            </span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '12px' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  <th style={styles.th}>Sequence / Stage</th>
                  <th style={styles.th}>Harvest Date</th>
                  <th style={styles.th}>DOC (Days)</th>
                  <th style={styles.th}>ABW (gm)</th>
                  <th style={styles.th}>Harvested Seed</th>
                  <th style={styles.th}>Biomass (kg)</th>
                  <th style={styles.th}>Remarks</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sequencedHarvests.map((rec) => (
                  <tr key={rec.id} style={styles.tbodyRow}>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.stageBadge,
                        backgroundColor: rec.isFinal ? '#DCFCE7' : '#EFF6FF',
                        color: rec.isFinal ? '#15803D' : '#1A2FB8',
                        borderColor: rec.isFinal ? '#86EFAC' : '#BFDBFE',
                      }}>
                        {rec.displayTitle}
                      </span>
                    </td>
                    <td style={styles.td}>{rec.date || '-'}</td>
                    <td style={{ ...styles.td, fontWeight: '600' }}>{rec.doc} Days</td>
                    <td style={{ ...styles.td, fontWeight: '600' }}>{rec.abw} g</td>
                    <td style={{ ...styles.td, fontWeight: '700' }}>{parseFloat(rec.harvestedNumber || 0).toLocaleString()}</td>
                    <td style={{ ...styles.td, fontWeight: '700', color: '#1A2FB8' }}>{parseFloat(rec.harvestedBiomass || 0).toLocaleString()} kg</td>
                    <td style={{ ...styles.td, color: '#64748B', maxWidth: '200px' }}>{rec.remarks || 'Standard harvest'}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button 
                        type="button" 
                        style={styles.deleteBtn}
                        onClick={() => removeHarvestRecord(rec.id)}
                        title="Delete Record"
                      >
                        <Trash2 size={15} color="#DC2626" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Enterprise Information Card */}
      <div style={styles.infoCard}>
        <Info size={20} color="#1A2FB8" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={styles.infoCardText}>
          Every harvest is stored as a separate record. Users can record unlimited Partial Harvests followed by one Final Harvest for each tank. The system automatically generates the Harvest Report and calculates Total Harvested Seed, Total Biomass, Survival %, and FCR.
        </p>
      </div>

      {/* Harvest Entry Modal */}
      <QuickRecordModal 
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          const updatedStore = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
          setHarvestData(updatedStore);
        }}
        initialType="HARVEST_ENTRY"
        preselectedFarmerId={selectedFarmerId}
        preselectedTankId={selectedTankId}
        onSuccess={() => {
          const updatedStore = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
          setHarvestData(updatedStore);
          setMessage('Harvest record saved successfully!');
          setTimeout(() => setMessage(''), 3000);
        }}
      />
    </div>
  );
};

const styles = {
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  headerLeft: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px' 
  },
  iconCircle: { 
    width: '44px', 
    height: '44px', 
    borderRadius: '12px', 
    backgroundColor: '#F0F4FF', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  title: { 
    fontSize: '20px', 
    fontWeight: '700', 
    color: '#0F172A', 
    margin: '0 0 2px 0',
    letterSpacing: '-0.2px'
  },
  subtitle: { 
    fontSize: '13px', 
    color: '#64748B' 
  },
  newHarvestBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(26, 47, 184, 0.25)',
  },
  successBanner: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    padding: '12px 16px', 
    backgroundColor: '#DCFCE7', 
    color: '#15803D', 
    borderRadius: '10px', 
    border: '1px solid #86EFAC', 
    marginBottom: '16px', 
    fontSize: '13.5px', 
    fontWeight: '600' 
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: '14px', 
    padding: 'clamp(14px, 3.5vw, 24px)', 
    border: '1px solid #E2E8F0', 
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    marginBottom: '16px',
    boxSizing: 'border-box',
    width: '100%',
  },
  selectorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
    gap: '12px',
    marginBottom: '14px'
  },
  miniLabel: { 
    fontSize: '11.5px', 
    fontWeight: '600', 
    color: '#475569', 
    marginBottom: '5px', 
    display: 'block' 
  },
  selectInput: {
    width: '100%',
    height: '42px',
    padding: '0 12px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '13.5px',
    color: '#0F172A',
    fontWeight: '600',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
  farmerDetailsGrid: { 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: '8px', 
    paddingTop: '12px', 
    borderTop: '1px solid #F1F5F9' 
  },
  farmerBadge: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px', 
    fontSize: '12.5px', 
    color: '#334155', 
    backgroundColor: '#F8FAFC', 
    border: '1px solid #E2E8F0',
    padding: '6px 10px', 
    borderRadius: '8px' 
  },
  sectionTitle: { 
    fontSize: 'clamp(14.5px, 2.8vw, 16px)', 
    fontWeight: '700', 
    color: '#0F172A', 
    margin: 0,
    letterSpacing: '-0.1px'
  },
  specsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
    gap: '12px',
    marginTop: '12px'
  },
  specInput: {
    width: '100%',
    height: '40px',
    padding: '0 12px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '13.5px',
    color: '#0F172A',
    fontWeight: '600',
    outline: 'none',
    boxSizing: 'border-box'
  },
  reportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '14px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  reportSub: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
    display: 'block'
  },
  autoCalcTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#1A2FB8',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    padding: '4px 10px',
    borderRadius: '20px'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 135px), 1fr))',
    gap: '10px'
  },
  kpiBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '12px 14px',
    boxSizing: 'border-box',
  },
  kpiLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    display: 'block'
  },
  kpiVal: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0F172A',
    margin: '4px 0 2px 0'
  },
  kpiFoot: {
    fontSize: '11px',
    color: '#94A3B8'
  },
  tableHeaderSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  recordSubBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #BFDBFE',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  emptyState: {
    textAlign: 'center',
    padding: '32px 16px',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px dashed #CBD5E1',
    marginTop: '12px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  theadRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0'
  },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '700',
    color: '#475569',
    whiteSpace: 'nowrap'
  },
  tbodyRow: {
    borderBottom: '1px solid #F1F5F9'
  },
  td: {
    padding: '12px',
    color: '#1E293B',
    verticalAlign: 'middle'
  },
  stageBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid transparent',
    fontSize: '12px',
    fontWeight: '700'
  },
  deleteBtn: {
    background: '#FEE2E2',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    padding: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '12px',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginTop: '8px'
  },
  infoCardText: {
    fontSize: '12.5px',
    lineHeight: '1.5',
    color: '#1E40AF',
    margin: 0,
    fontWeight: '500'
  }
};

export default Harvest;
