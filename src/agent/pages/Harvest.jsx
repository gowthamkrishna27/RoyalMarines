import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, User, Phone, MapPin, CheckCircle, Save, Grid, List, Plus, Trash2 } from 'lucide-react';
import { getSession } from '../utils/agentAuth';
import { useMockData } from '../../context/MockDataContext';

// Initial default harvest data
const initialHarvestStore = {
  'F001_T001': {
    pondSize: '10',
    seedNumber: '1000000',
    stockingDate: '2024-06-21',
    harvests: [
      { id: 'h1', doc: '60', abw: '10', harvestedNumber: '200000', harvestedBiomass: '2000' },
      { id: 'h2', doc: '85', abw: '15', harvestedNumber: '133333', harvestedBiomass: '2000' },
      { id: 'h3', doc: '100', abw: '20', harvestedNumber: '150000', harvestedBiomass: '3000' }
    ],
    totalFeed: '16000'
  }
};

// Helper to convert store data to dynamic harvests array cleanly
const getTankHarvests = (store) => {
  if (!store) return [{ id: 'h1', doc: '', abw: '', harvestedNumber: '', harvestedBiomass: '' }];
  if (Array.isArray(store.harvests) && store.harvests.length > 0) {
    return store.harvests;
  }
  if (Array.isArray(store.partials) && store.partials.length > 0) {
    const list = [...store.partials];
    if (store.finalHarvest && (store.finalHarvest.harvestedNumber || store.finalHarvest.harvestedBiomass)) {
      list.push({ id: 'h_final', ...store.finalHarvest });
    }
    return list;
  }
  const result = [];
  if (store.partial1 && (store.partial1.doc || store.partial1.abw || store.partial1.harvestedNumber || store.partial1.harvestedBiomass)) {
    result.push({ id: 'h1', ...store.partial1 });
  }
  if (store.partial2 && (store.partial2.doc || store.partial2.abw || store.partial2.harvestedNumber || store.partial2.harvestedBiomass)) {
    result.push({ id: 'h2', ...store.partial2 });
  }
  if (store.partial3 && (store.partial3.doc || store.partial3.abw || store.partial3.harvestedNumber || store.partial3.harvestedBiomass)) {
    result.push({ id: 'h3', ...store.partial3 });
  }
  if (store.finalHarvest && (store.finalHarvest.doc || store.finalHarvest.abw || store.finalHarvest.harvestedNumber || store.finalHarvest.harvestedBiomass)) {
    result.push({ id: 'h_final', ...store.finalHarvest });
  }
  if (result.length === 0) {
    result.push({ id: 'h1', doc: '', abw: '', harvestedNumber: '', harvestedBiomass: '' });
  }
  return result;
};

const Harvest = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const { getFarmersByAgentId, getTanksByFarmerId } = useMockData();

  // State
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [selectedTankId, setSelectedTankId] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'grid'
  const [message, setMessage] = useState('');
  const [deletingIndex, setDeletingIndex] = useState(null);

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
    name: 'No Assigned Farmers',
    location: '-',
    phone: '-'
  });

  const currentTanks = getTanksByFarmerId(selectedFarmerId);
  const activeTankKey = `${selectedFarmerId}_${selectedTankId}`;

  // Current tank harvest form state
  const currentStore = harvestData[activeTankKey] || {
    pondSize: '10',
    seedNumber: '1000000',
    stockingDate: '2024-06-21',
    harvests: [
      { id: 'h1', doc: '', abw: '', harvestedNumber: '', harvestedBiomass: '' }
    ],
    totalFeed: ''
  };

  const harvests = getTankHarvests(currentStore);

  const updateTankMeta = (field, value) => {
    const updated = {
      ...harvestData,
      [activeTankKey]: {
        ...currentStore,
        harvests: harvests,
        [field]: value
      }
    };
    setHarvestData(updated);
    localStorage.setItem('agent_harvest_store', JSON.stringify(updated));
  };

  const addHarvest = () => {
    const newHarvest = {
      id: `h_${Date.now()}`,
      doc: '',
      abw: '',
      harvestedNumber: '',
      harvestedBiomass: ''
    };
    const updatedHarvests = [...harvests, newHarvest];
    const updated = {
      ...harvestData,
      [activeTankKey]: {
        ...currentStore,
        harvests: updatedHarvests
      }
    };
    setHarvestData(updated);
    localStorage.setItem('agent_harvest_store', JSON.stringify(updated));
  };

  const updateHarvest = (index, field, value) => {
    const updatedHarvests = harvests.map((h, idx) => {
      if (idx === index) {
        return { ...h, [field]: value };
      }
      return h;
    });
    const updated = {
      ...harvestData,
      [activeTankKey]: {
        ...currentStore,
        harvests: updatedHarvests
      }
    };
    setHarvestData(updated);
    localStorage.setItem('agent_harvest_store', JSON.stringify(updated));
  };

  const removeHarvest = (index) => {
    if (harvests.length <= 1) {
      alert('At least one harvest record is required.');
      return;
    }
    const updatedHarvests = harvests.filter((_, idx) => idx !== index);
    const updated = {
      ...harvestData,
      [activeTankKey]: {
        ...currentStore,
        harvests: updatedHarvests
      }
    };
    setHarvestData(updated);
    localStorage.setItem('agent_harvest_store', JSON.stringify(updated));
    setDeletingIndex(null);
  };

  // Auto-calculated totals across all added harvests
  const totalHarvestedSeed = harvests.reduce((sum, h) => {
    const directNum = parseFloat(h.harvestedNumber) || 0;
    if (directNum > 0) return sum + directNum;
    const biomass = parseFloat(h.harvestedBiomass) || 0;
    const abw = parseFloat(h.abw) || 0;
    if (biomass > 0 && abw > 0) {
      return sum + Math.round((biomass * 1000) / abw);
    }
    return sum;
  }, 0);

  const totalBiomass = harvests.reduce((sum, h) => sum + (parseFloat(h.harvestedBiomass) || 0), 0);
  const totalFeed = parseFloat(currentStore.totalFeed) || 0;

  const seedNumber = parseFloat(currentStore.seedNumber) || 0;
  const fcr = totalBiomass > 0 ? (totalFeed / totalBiomass).toFixed(2) : '0.00';
  const autoSurvivalPct = seedNumber > 0 && totalHarvestedSeed > 0
    ? ((totalHarvestedSeed / seedNumber) * 100).toFixed(2)
    : '0.00';

  const survivalPct = currentStore.manualSurvival !== undefined && currentStore.manualSurvival !== ''
    ? currentStore.manualSurvival
    : autoSurvivalPct;

  const handleSave = () => {
    localStorage.setItem('agent_harvest_store', JSON.stringify(harvestData));
    setMessage('Harvest records saved successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div style={{ paddingBottom: '30px' }}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.iconCircle}>
            <Ship size={24} color="#0018AD" />
          </div>
          <div>
            <h2 style={styles.title}>Harvest Management</h2>
            <div style={styles.subtitle}>Dynamic harvest tracking & auto metrics</div>
          </div>
        </div>

        {/* View Toggle */}
        <div style={styles.toggleGroup}>
          <button 
            style={{ ...styles.toggleBtn, ...(viewMode === 'cards' ? styles.activeToggle : {}) }}
            onClick={() => setViewMode('cards')}
            title="Options Form View"
          >
            <List size={16} /> Options
          </button>
          <button 
            style={{ ...styles.toggleBtn, ...(viewMode === 'grid' ? styles.activeToggle : {}) }}
            onClick={() => setViewMode('grid')}
            title="Excel Spreadsheet View"
          >
            <Grid size={16} /> Matrix Grid
          </button>
        </div>
      </div>

      {message && (
        <div style={styles.successBanner}>
          <CheckCircle size={16} />
          <span>{message}</span>
        </div>
      )}

      {/* 1. Farmer & Tank Selector Bar */}
      <div className="card" style={styles.farmerCard}>
        <div style={styles.farmerSelectRow}>
          <div style={{ flex: 1 }}>
            <label style={styles.selectLabel}>Select Farmer</label>
            <div className="input-field" style={{ backgroundColor: '#FFFFFF' }}>
              <User size={16} color="#64748B" style={{ marginLeft: '10px' }} />
              <select 
                value={selectedFarmerId} 
                onChange={(e) => handleFarmerChange(e.target.value)}
                style={{ fontWeight: '700', color: '#17233C' }}
              >
                {farmers.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.location || 'Mahadev Patnam'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Farmer Info Badges */}
        <div style={styles.farmerDetailsGrid}>
          <div style={styles.farmerBadge}>
            <User size={14} color="#2563D9" />
            <span><strong>Farmer:</strong> {currentFarmer.name}</span>
          </div>
          <div style={styles.farmerBadge}>
            <MapPin size={14} color="#22A65A" />
            <span><strong>Village:</strong> {currentFarmer.location || 'Mahadev Patnam'}</span>
          </div>
          <div style={styles.farmerBadge}>
            <Phone size={14} color="#0EA5A8" />
            <span><strong>Phone:</strong> {currentFarmer.phone || '9849433337'}</span>
          </div>
        </div>
      </div>

      {/* 2. Tank Selector Pills */}
      <div style={styles.tankTabsRow}>
        {currentTanks.length === 0 ? (
          <div style={styles.tankTabActive}>Tank-1</div>
        ) : (
          currentTanks.map((t, idx) => (
            <div 
              key={t.id} 
              style={{
                ...styles.tankTab,
                ...(selectedTankId === t.id ? styles.tankTabActive : {})
              }}
              onClick={() => setSelectedTankId(t.id)}
            >
              {t.name || `Tank-${idx + 1}`}
            </div>
          ))
        )}
      </div>

      {/* 3. Tank Basic Parameters */}
      <div className="card" style={styles.metaCard}>
        <h4 style={styles.sectionHeader}>Tank Parameters & Stocking</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label style={styles.miniLabel}>Pond Size (Ac)</label>
            <div className="input-field">
              <input 
                type="number" 
                value={currentStore.pondSize} 
                onChange={(e) => updateTankMeta('pondSize', e.target.value)}
                placeholder="e.g. 10" 
              />
            </div>
          </div>

          <div>
            <label style={styles.miniLabel}>Seed Number</label>
            <div className="input-field">
              <input 
                type="number" 
                value={currentStore.seedNumber} 
                onChange={(e) => updateTankMeta('seedNumber', e.target.value)}
                placeholder="e.g. 1000000" 
              />
            </div>
          </div>

          <div>
            <label style={styles.miniLabel}>Seed Stocking Date</label>
            <div className="input-field">
              <input 
                type="date" 
                value={currentStore.stockingDate} 
                onChange={(e) => updateTankMeta('stockingDate', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* VIEW MODE A: Dynamic Harvest Cards */}
      {viewMode === 'cards' ? (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Dynamic Harvest Cards Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#17233C', margin: 0 }}>
              Harvest Records ({harvests.length})
            </h3>
          </div>

          {/* Render Dynamic Harvest Cards */}
          {harvests.map((item, idx) => (
            <div key={item.id || idx} className="card" style={{ ...styles.stageCard, borderLeft: '4px solid #E9A400' }}>
              <div style={styles.stageCardHeader}>
                <div style={{ ...styles.stageBadge, backgroundColor: '#FFF5D6', color: '#B45309' }}>
                  Harvest {idx + 1}
                </div>
                <h3 style={styles.stageTitle}>Harvest Entry {idx + 1}</h3>
                {harvests.length > 1 && idx === harvests.length - 1 && (
                  <button 
                    onClick={() => setDeletingIndex(idx === deletingIndex ? null : idx)}
                    title="Remove this harvest entry"
                    style={{
                      marginLeft: 'auto',
                      background: deletingIndex === idx ? '#FDECEC' : 'none',
                      border: deletingIndex === idx ? '1px solid #DC3F3F' : 'none',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={16} color="#DC3F3F" />
                  </button>
                )}
              </div>

              {deletingIndex === idx && (
                <div style={{
                  backgroundColor: '#FDECEC',
                  border: '1px solid #DC3F3F',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#991B1B' }}>
                    ⚠️ Confirm delete Harvest Entry {idx + 1}?
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#DC3F3F',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                      onClick={() => removeHarvest(idx)}
                    >
                      Confirm Delete
                    </button>
                    <button 
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#FFFFFF',
                        color: '#64748B',
                        border: '1px solid #DCE4EE',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setDeletingIndex(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3" style={{ width: '100%', boxSizing: 'border-box' }}>
                <div style={{ minWidth: 0 }}>
                  <label style={styles.miniLabel}>DOC</label>
                  <div className="input-field" style={{ padding: '8px 10px' }}>
                    <input 
                      type="number" 
                      value={item.doc || ''} 
                      onChange={e => updateHarvest(idx, 'doc', e.target.value)}
                      placeholder="e.g. 60"
                    />
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={styles.miniLabel}>ABW (g)</label>
                  <div className="input-field" style={{ padding: '8px 10px' }}>
                    <input 
                      type="number" 
                      value={item.abw || ''} 
                      onChange={e => updateHarvest(idx, 'abw', e.target.value)}
                      placeholder="e.g. 10"
                    />
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={styles.miniLabel}>Harvested Number</label>
                  <div className="input-field" style={{ padding: '8px 10px' }}>
                    <input 
                      type="number" 
                      value={item.harvestedNumber || ''} 
                      onChange={e => updateHarvest(idx, 'harvestedNumber', e.target.value)}
                      placeholder="e.g. 200000"
                    />
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={styles.miniLabel}>Harvested Biomass (kg)</label>
                  <div className="input-field" style={{ padding: '8px 10px' }}>
                    <input 
                      type="number" 
                      value={item.harvestedBiomass || ''} 
                      onChange={e => updateHarvest(idx, 'harvestedBiomass', e.target.value)}
                      placeholder="e.g. 2000"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Additional Add Harvest Button below harvests list */}
          <button 
            onClick={addHarvest}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#EAF3FF',
              color: '#2563D9',
              border: '1px dashed #2563D9',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              marginTop: '4px'
            }}
          >
            <Plus size={18} /> Add Another Harvest
          </button>
        </div>
      ) : (
        /* VIEW MODE B: Spreadsheet Matrix Table View */
        <div className="card" style={{ marginTop: '20px', padding: '16px', overflowX: 'auto' }}>
          <h3 style={styles.sectionHeader}>Harvest Matrix Grid View</h3>
          <table style={styles.gridTable}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableTh}>Field Parameter</th>
                <th style={styles.tableTh}>Tank-1</th>
                <th style={styles.tableTh}>Tank-2</th>
                <th style={styles.tableTh}>Tank-3</th>
                <th style={styles.tableTh}>Tank-4</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={styles.tdLabel}>Pond Size (Ac)</td>
                <td style={styles.tdVal}>{currentStore.pondSize}</td>
                <td style={styles.tdVal}>-</td>
                <td style={styles.tdVal}>-</td>
                <td style={styles.tdVal}>-</td>
              </tr>
              <tr>
                <td style={styles.tdLabel}>Seed Number</td>
                <td style={styles.tdVal}>{currentStore.seedNumber}</td>
                <td style={styles.tdVal}>-</td>
                <td style={styles.tdVal}>-</td>
                <td style={styles.tdVal}>-</td>
              </tr>
              <tr>
                <td style={styles.tdLabel}>Seed Stocking Date</td>
                <td style={styles.tdVal}>{currentStore.stockingDate}</td>
                <td style={styles.tdVal}>-</td>
                <td style={styles.tdVal}>-</td>
                <td style={styles.tdVal}>-</td>
              </tr>

              {/* Dynamic Harvest Rows */}
              {harvests.map((h, idx) => (
                <React.Fragment key={h.id || idx}>
                  <tr style={{ backgroundColor: '#FEF08A' }}>
                    <td colSpan="5" style={{ fontWeight: '700', padding: '6px 10px', color: '#854D0E' }}>
                      Harvest {idx + 1}
                    </td>
                  </tr>
                  <tr><td style={styles.tdLabel}>DOC</td><td style={styles.tdVal}>{h.doc}</td><td></td><td></td><td></td></tr>
                  <tr><td style={styles.tdLabel}>ABW</td><td style={styles.tdVal}>{h.abw}</td><td></td><td></td><td></td></tr>
                  <tr><td style={styles.tdLabel}>Harvested Number</td><td style={styles.tdVal}>{h.harvestedNumber}</td><td></td><td></td><td></td></tr>
                  <tr><td style={styles.tdLabel}>Harvested Biomass</td><td style={styles.tdVal}>{h.harvestedBiomass}</td><td></td><td></td><td></td></tr>
                </React.Fragment>
              ))}

              {/* Summary Rows */}
              <tr style={{ borderTop: '2px solid #17233C', backgroundColor: '#F3F6FA' }}>
                <td style={{ ...styles.tdLabel, fontWeight: '700' }}>Total Harvested Seed</td>
                <td style={{ ...styles.tdVal, fontWeight: '700', color: '#2563D9' }}>{totalHarvestedSeed.toLocaleString()}</td>
                <td></td><td></td><td></td>
              </tr>
              <tr style={{ backgroundColor: '#F3F6FA' }}>
                <td style={{ ...styles.tdLabel, fontWeight: '700' }}>Total Biomass (kg)</td>
                <td style={{ ...styles.tdVal, fontWeight: '700', color: '#22A65A' }}>{totalBiomass.toLocaleString()}</td>
                <td></td><td></td><td></td>
              </tr>
              <tr style={{ backgroundColor: '#F3F6FA' }}>
                <td style={{ ...styles.tdLabel, fontWeight: '700' }}>Total Feed (kg)</td>
                <td style={{ ...styles.tdVal, fontWeight: '700' }}>{totalFeed}</td>
                <td></td><td></td><td></td>
              </tr>
              <tr style={{ backgroundColor: '#F3F6FA' }}>
                <td style={{ ...styles.tdLabel, fontWeight: '700' }}>FCR</td>
                <td style={{ ...styles.tdVal, fontWeight: '700', color: '#0018AD' }}>{fcr}</td>
                <td></td><td></td><td></td>
              </tr>
              <tr style={{ backgroundColor: '#F3F6FA' }}>
                <td style={{ ...styles.tdLabel, fontWeight: '700' }}>Survival %</td>
                <td style={{ ...styles.tdVal, fontWeight: '700', color: '#22A65A' }}>{survivalPct}%</td>
                <td></td><td></td><td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Calculated Summary Card (Positioned below all Harvest Options) */}
      <div className="card" style={styles.summaryCard}>
        <div style={styles.summaryHeader}>
          <h3 style={styles.summaryTitle}>Harvest Summary & Metrics</h3>
          <span style={styles.autoCalcBadge}>⚡ Auto Calculated</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3" style={{ marginBottom: '16px' }}>
          <div style={styles.kpiMiniBox}>
            <div style={styles.kpiMiniLabel}>Total Harvested Seed</div>
            <div style={styles.kpiMiniValue}>{totalHarvestedSeed.toLocaleString()}</div>
          </div>

          <div style={styles.kpiMiniBox}>
            <div style={styles.kpiMiniLabel}>Total Biomass</div>
            <div style={{ ...styles.kpiMiniValue, color: '#22A65A' }}>{totalBiomass.toLocaleString()} kg</div>
          </div>

          <div style={styles.kpiMiniBox}>
            <div style={styles.kpiMiniLabel}>Total Feed (kg)</div>
            <div className="input-field" style={{ height: '36px', marginTop: '4px' }}>
              <input 
                type="number" 
                value={currentStore.totalFeed || ''} 
                onChange={(e) => updateTankMeta('totalFeed', e.target.value)}
                placeholder="e.g. 16000"
                style={{ fontSize: '15px', fontWeight: '700' }}
              />
            </div>
          </div>

          <div style={styles.kpiMiniBox}>
            <div style={styles.kpiMiniLabel}>Calculated FCR</div>
            <div style={{ ...styles.kpiMiniValue, color: '#0018AD' }}>{fcr}</div>
          </div>

          <div style={styles.kpiMiniBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={styles.kpiMiniLabel}>Survival Rate %</div>
              {currentStore.manualSurvival !== undefined && currentStore.manualSurvival !== '' && (
                <span 
                  onClick={() => updateTankMeta('manualSurvival', '')}
                  style={{ fontSize: '10px', color: '#2563D9', cursor: 'pointer', fontWeight: '700' }}
                  title="Reset to Auto-calculated Survival Rate"
                >
                  ⚡ Auto ({autoSurvivalPct}%)
                </span>
              )}
            </div>
            <div className="input-field" style={{ height: '36px', marginTop: '4px', display: 'flex', alignItems: 'center' }}>
              <input 
                type="number" 
                step="0.01"
                value={currentStore.manualSurvival !== undefined && currentStore.manualSurvival !== '' ? currentStore.manualSurvival : autoSurvivalPct} 
                onChange={(e) => updateTankMeta('manualSurvival', e.target.value)}
                placeholder="e.g. 85.0"
                style={{ fontSize: '15px', fontWeight: '700', color: '#22A65A' }}
              />
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#22A65A', paddingRight: '8px' }}>%</span>
            </div>
          </div>
        </div>

        <button 
          className="btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '15px' }}
          onClick={handleSave}
        >
          <Save size={18} /> Save Harvest Record
        </button>
      </div>
    </div>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  iconCircle: { width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#EAF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: '20px', fontWeight: '700', color: '#17233C', marginBottom: '2px' },
  subtitle: { fontSize: '13px', color: '#64748B' },
  toggleGroup: { display: 'flex', gap: '4px', backgroundColor: '#EAF3FF', padding: '4px', borderRadius: '8px' },
  toggleBtn: { display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#64748B', cursor: 'pointer' },
  activeToggle: { backgroundColor: '#FFFFFF', color: '#2563D9', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  successBanner: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#E8F8EE', color: '#22A65A', borderRadius: '8px', border: '1px solid #22A65A', marginBottom: '16px', fontSize: '14px', fontWeight: '600' },
  farmerCard: { padding: '16px', marginBottom: '16px' },
  farmerSelectRow: { marginBottom: '12px' },
  selectLabel: { fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px', display: 'block' },
  farmerDetailsGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '12px', borderTop: '1px solid #DCE4EE' },
  farmerBadge: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#17233C', backgroundColor: '#F3F6FA', padding: '6px 12px', borderRadius: '6px' },
  tankTabsRow: { display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px' },
  tankTab: { padding: '8px 16px', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid #DCE4EE', color: '#64748B', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  tankTabActive: { backgroundColor: '#2563D9', color: '#FFFFFF', borderColor: '#2563D9' },
  metaCard: { padding: '16px' },
  sectionHeader: { fontSize: '15px', fontWeight: '700', color: '#17233C', marginBottom: '12px' },
  miniLabel: { fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '4px', display: 'block' },
  stageCard: { padding: '16px' },
  stageCardHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  stageBadge: { padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' },
  stageTitle: { fontSize: '16px', fontWeight: '700', color: '#17233C', margin: 0 },
  summaryCard: { padding: '20px', marginTop: '20px', backgroundColor: '#FFFFFF', border: '1px solid #DCE4EE' },
  summaryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  summaryTitle: { fontSize: '16px', fontWeight: '700', color: '#17233C', margin: 0 },
  autoCalcBadge: { fontSize: '11px', fontWeight: '700', color: '#2563D9', backgroundColor: '#EAF3FF', padding: '4px 8px', borderRadius: '12px' },
  kpiMiniBox: { backgroundColor: '#F3F6FA', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DCE4EE' },
  kpiMiniLabel: { fontSize: '12px', fontWeight: '600', color: '#64748B' },
  kpiMiniValue: { fontSize: '18px', fontWeight: '700', color: '#17233C', marginTop: '2px' },
  gridTable: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  tableHeaderRow: { backgroundColor: '#17233C', color: '#FFFFFF' },
  tableTh: { padding: '8px 10px', textAlign: 'left', fontWeight: '700' },
  tdLabel: { padding: '6px 10px', borderBottom: '1px solid #DCE4EE', color: '#17233C', fontWeight: '500' },
  tdVal: { padding: '6px 10px', borderBottom: '1px solid #DCE4EE', color: '#17233C', fontWeight: '600' }
};

export default Harvest;
