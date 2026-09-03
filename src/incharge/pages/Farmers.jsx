import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { 
  Search, Filter, Eye, X, UserPlus, Phone, MapPin, 
  Users, Droplets, CheckCircle2, Calendar, ShieldCheck, User,
  TrendingUp, Activity, Scale, Fish, Layers, Sparkles
} from 'lucide-react';

const Farmers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocality, setFilterLocality] = useState('ALL');
  const { db, createFarmerWithTanks, getTanksByFarmerId, getAgentById, getFarmersByInchargeId } = useMockData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTankModalOpen, setIsTankModalOpen] = useState(false);
  const [tanksData, setTanksData] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  // Form State
  const [farmerName, setFarmerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [areaMandal, setAreaMandal] = useState('');
  const [village, setVillage] = useState('');
  const [totalLandArea, setTotalLandArea] = useState('');
  const [waterSource, setWaterSource] = useState('');
  const [numberOfTanks, setNumberOfTanks] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const allFarmersList = db?.farmers || [];
  const farmers = allFarmersList.map(f => {
    const tanks = getTanksByFarmerId(f.id);
    const agent = getAgentById(f.agentId);
    return {
      ...f,
      locality: f.location || f.village || 'Bhimavaram',
      tanks: tanks.length,
      acres: f.acres || 5,
      agent: agent ? agent.name : 'Direct Incharge',
      lastTest: tanks[0] ? tanks[0].lastTest : '22 Aug',
      nextTest: tanks[0] ? tanks[0].nextTest : '29 Aug',
      status: f.status === 'ACTIVE' ? 'Active' : 'Active'
    };
  });

  const localities = Array.from(new Set(farmers.map(f => f.locality).filter(Boolean)));

  const filteredFarmers = farmers
    .filter(farmer => {
      const matchesSearch = 
        farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farmer.locality.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farmer.phone.includes(searchTerm);
      const matchesLocality = filterLocality === 'ALL' || farmer.locality === filterLocality;
      return matchesSearch && matchesLocality;
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));

  const totalAcres = farmers.reduce((acc, f) => acc + (parseFloat(f.acres) || 0), 0);
  const totalTanks = farmers.reduce((acc, f) => acc + f.tanks, 0);

  const handleAddFarmer = (e) => {
    e.preventDefault();
    setPhoneError('');
    if (!farmerName || !phoneNumber || !numberOfTanks) return;

    const isDuplicatePhone = (db?.farmers || []).some(f => f.phone === phoneNumber);
    if (isDuplicatePhone) {
      setPhoneError("A farmer with this phone number already exists.");
      return;
    }

    const numTanks = parseInt(numberOfTanks) || 1;
    const initialTanksArray = Array.from({ length: numTanks }, () => ({
      size: '2',
      salinity: '15',
      soilType: 'Clay',
      broodname: 'SPF Vannamei',
      seedDate: new Date().toISOString().split('T')[0],
      seedStocking: '100000',
      feedType: 'Starter Feed',
      registeredLocation: village || areaMandal || 'Bhimavaram'
    }));
    setTanksData(initialTanksArray);
    setIsModalOpen(false);
    setIsTankModalOpen(true);
  };

  const handleSaveTanks = () => {
    createFarmerWithTanks(
      null,
      {
        name: farmerName,
        phone: phoneNumber,
        village: village || 'Bhimavaram',
        area: areaMandal || 'Coastal Cluster',
        acres: totalLandArea || 5,
        waterSource: waterSource || 'Canal'
      },
      tanksData
    );

    setFarmerName('');
    setPhoneNumber('');
    setAreaMandal('');
    setVillage('');
    setTotalLandArea('');
    setWaterSource('');
    setNumberOfTanks('');
    setPhoneError('');
    setTanksData([]);
    setIsTankModalOpen(false);
  };

  const handleTankChange = (index, field, value) => {
    const newTanks = [...tanksData];
    newTanks[index][field] = value;
    setTanksData(newTanks);
  };

  return (
    <>
      <InchargeHeader title="Farmers" />

      <div style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto' }}>
        {/* Summary Quick Bar */}
        <div style={styles.summaryBar}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Farmers</span>
            <span style={styles.summaryValue}>{farmers.length}</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Cultivation Area</span>
            <span style={styles.summaryValue}>{totalAcres.toFixed(1)} Acres</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Active Ponds / Tanks</span>
            <span style={styles.summaryValue}>{totalTanks} Tanks</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Active Status</span>
            <span style={{ ...styles.summaryValue, color: '#16A34A' }}>100% Active</span>
          </div>
        </div>

        {/* Main Content Table Card */}
        <div style={styles.mainCard}>
          <div style={styles.actionBar}>
            <div style={styles.searchGroup}>
              <div style={styles.searchBox}>
                <Search size={17} color="#64748B" />
                <input
                  type="text"
                  placeholder="Search farmer by name, phone, or village..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
              </div>

              {localities.length > 0 && (
                <select 
                  value={filterLocality} 
                  onChange={(e) => setFilterLocality(e.target.value)}
                  style={styles.selectFilter}
                >
                  <option value="ALL">All Villages ({localities.length})</option>
                  {localities.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              )}
            </div>

            <button 
              type="button"
              style={styles.addFarmerBtn} 
              onClick={() => setIsModalOpen(true)}
              className="transition-all duration-150 active:scale-98 cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Add Farmer</span>
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Farmer Name</th>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.th}>Village / Area</th>
                  <th style={styles.th}>Land Size</th>
                  <th style={styles.th}>Ponds</th>
                  <th style={styles.th}>Assigned Technician</th>
                  <th style={styles.th}>Last Audit</th>
                  <th style={styles.th}>Next Audit</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFarmers.map((farmer) => (
                  <tr key={farmer.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div 
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                        onClick={() => setSelectedFarmer(farmer)}
                        title="Click to view farmer tanks & growth details"
                      >
                        <div style={styles.farmerAvatar}>
                          {farmer.name ? farmer.name[0] : 'F'}
                        </div>
                        <div>
                          <div style={{ ...styles.farmerNameText, color: '#1A2FB8', fontWeight: '800' }}>
                            {farmer.name}
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <TrendingUp size={11} color="#16A34A" /> View Tank Growth
                          </span>
                        </div>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#475569' }}>
                        <Phone size={13} color="#64748B" />
                        <span>{farmer.phone}</span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#0F172A', fontWeight: '500' }}>
                        <MapPin size={13} color="#1A2FB8" />
                        <span>{farmer.locality}</span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                        {farmer.acres} Acres
                      </span>
                    </td>

                    <td style={styles.td}>
                      <span style={styles.tanksBadge}>
                        <Droplets size={12} color="#0284C7" />
                        {farmer.tanks} Tanks
                      </span>
                    </td>

                    <td style={styles.td}>
                      <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: '600' }}>
                        {farmer.agent}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <span style={{ fontSize: '12.5px', color: '#64748B' }}>{farmer.lastTest}</span>
                    </td>

                    <td style={styles.td}>
                      <span style={{ fontSize: '12.5px', color: '#1A2FB8', fontWeight: '600' }}>{farmer.nextTest}</span>
                    </td>

                    <td style={styles.td}>
                      <span style={styles.statusPill}>
                        <CheckCircle2 size={12} /> {farmer.status}
                      </span>
                    </td>

                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <button 
                        type="button"
                        style={styles.actionBtn}
                        onClick={() => setSelectedFarmer(farmer)}
                        title="View Farmer Profile"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredFarmers.length === 0 && (
                  <tr>
                    <td colSpan="10" style={styles.emptyTd}>
                      No farmers found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Farmer Modal */}
      {isModalOpen && createPortal(
        <div style={styles.modalBackdrop} onClick={() => { setIsModalOpen(false); setPhoneError(''); }}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.modalIconBox}>
                  <UserPlus size={20} color="#1A2FB8" />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>Add New Farmer</h3>
                  <p style={styles.modalSub}>Step 1: Enter farmer and cultivation details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setPhoneError(''); }}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddFarmer} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label style={styles.formLabel}>Farmer Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ramesh Kumar" 
                  required 
                  value={farmerName} 
                  onChange={e => setFarmerName(e.target.value)} 
                  style={styles.formInput}
                />
              </div>

              <div>
                <label style={styles.formLabel}>Mobile Phone Number *</label>
                <input 
                  type="tel" 
                  placeholder="e.g. +91 98765 43210" 
                  required 
                  value={phoneNumber} 
                  onChange={e => { setPhoneNumber(e.target.value); setPhoneError(''); }} 
                  style={{ ...styles.formInput, borderColor: phoneError ? '#DC2626' : '#E2E8F0' }}
                />
                {phoneError && <span style={{ color: '#DC2626', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>{phoneError}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={styles.formLabel}>Area / Mandal</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Bhimavaram" 
                    value={areaMandal} 
                    onChange={e => setAreaMandal(e.target.value)} 
                    style={styles.formInput}
                  />
                </div>
                <div>
                  <label style={styles.formLabel}>Village</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Chinnamiram" 
                    value={village} 
                    onChange={e => setVillage(e.target.value)} 
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={styles.formLabel}>Total Acres</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="e.g. 5" 
                    value={totalLandArea} 
                    onChange={e => setTotalLandArea(e.target.value)} 
                    style={styles.formInput}
                  />
                </div>
                <div>
                  <label style={styles.formLabel}>Number of Tanks *</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 2" 
                    required 
                    value={numberOfTanks} 
                    onChange={e => setNumberOfTanks(e.target.value)} 
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div>
                <label style={styles.formLabel}>Water Source</label>
                <select
                  style={styles.formInput}
                  value={waterSource}
                  onChange={e => setWaterSource(e.target.value)}
                >
                  <option value="">Select Water Source</option>
                  <option value="Canal">Canal</option>
                  <option value="Borewell">Borewell</option>
                  <option value="River / Creek">River / Creek</option>
                  <option value="Seawater Intake">Seawater Intake</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  style={styles.cancelBtn}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.saveBtn}>
                  Next: Add Tanks Information →
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Tank Details Modal */}
      {isTankModalOpen && createPortal(
        <div style={styles.modalBackdrop} onClick={() => setIsTankModalOpen(false)}>
          <div style={{ ...styles.modalCard, maxWidth: '780px' }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Configure Tank Parameters</h3>
                <p style={styles.modalSub}>Step 2: Enter specific pond specs for {farmerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTankModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '12px 0' }}>
              {tanksData.map((tank, index) => (
                <div key={index} style={{ marginBottom: '20px', padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#1A2FB8', marginBottom: '12px' }}>
                    Tank #{index + 1} Configuration
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={styles.formLabel}>Tank Size (Acres)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 1.5" 
                        value={tank.size} 
                        onChange={e => handleTankChange(index, 'size', e.target.value)} 
                        style={styles.formInput}
                      />
                    </div>
                    <div>
                      <label style={styles.formLabel}>Salinity (ppt)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 15" 
                        value={tank.salinity} 
                        onChange={e => handleTankChange(index, 'salinity', e.target.value)} 
                        style={styles.formInput}
                      />
                    </div>
                    <div>
                      <label style={styles.formLabel}>Soil Type</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Clay" 
                        value={tank.soilType} 
                        onChange={e => handleTankChange(index, 'soilType', e.target.value)} 
                        style={styles.formInput}
                      />
                    </div>
                    <div>
                      <label style={styles.formLabel}>Broodstock Type</label>
                      <input 
                        type="text" 
                        placeholder="SPF Vannamei" 
                        value={tank.broodname} 
                        onChange={e => handleTankChange(index, 'broodname', e.target.value)} 
                        style={styles.formInput}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
              <button 
                type="button" 
                style={styles.cancelBtn} 
                onClick={() => setIsTankModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                style={styles.saveBtn} 
                onClick={handleSaveTanks}
              >
                Save Farmer & Complete Registration
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Inspect Farmer & Tank Growth Modal */}
      {selectedFarmer && (() => {
        const farmerTanks = getTanksByFarmerId(selectedFarmer.id);
        const displayTanks = farmerTanks.length > 0 ? farmerTanks : [
          { id: 'T001', name: 'Tank 1', size: selectedFarmer.acres ? (selectedFarmer.acres / 2).toFixed(1) : '2.5', species: 'SPF Vannamei', doc: 68, abw: '22.8g', biomass: '2,850 kg', fcr: '1.18', survival: '89%', salinity: '16', soilType: 'Clay Loam', seedStocking: '150000', lastTest: selectedFarmer.lastTest, nextTest: selectedFarmer.nextTest },
          { id: 'T002', name: 'Tank 2', size: selectedFarmer.acres ? (selectedFarmer.acres / 2).toFixed(1) : '2.5', species: 'SPF Vannamei', doc: 54, abw: '17.2g', biomass: '2,150 kg', fcr: '1.14', survival: '91%', salinity: '15', soilType: 'Clay Loam', seedStocking: '150000', lastTest: selectedFarmer.lastTest, nextTest: selectedFarmer.nextTest }
        ];

        const farmerExtent = String(selectedFarmer.acres || '').toLowerCase().includes('acre')
          ? selectedFarmer.acres
          : `${selectedFarmer.acres || 0} Acres`;

        return createPortal(
          <div style={styles.modalBackdrop} onClick={() => setSelectedFarmer(null)}>
            <div style={styles.modalCardWide} onClick={e => e.stopPropagation()}>
              
              {/* Header */}
              <div style={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={styles.farmerDetailAvatar}>
                    {selectedFarmer.name ? selectedFarmer.name[0] : 'F'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={styles.modalTitle}>{selectedFarmer.name}</h3>
                      <span style={styles.activePondBadge}>
                        <CheckCircle2 size={12} /> Active Farmer
                      </span>
                    </div>
                    <p style={styles.modalSub}>
                      📞 {selectedFarmer.phone} • 📍 {selectedFarmer.locality || selectedFarmer.village} • 👤 Tech: {selectedFarmer.agent}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFarmer(null)}
                  style={styles.modalCloseBtn}
                  className="transition-all hover:bg-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Farmer Profile Overview Bar */}
              <div style={styles.farmerSummaryBar}>
                <div style={styles.farmerSummaryCol}>
                  <span style={styles.farmerSummaryLabel}>Total Extent</span>
                  <span style={styles.farmerSummaryValue}>{farmerExtent}</span>
                </div>
                <div style={styles.farmerSummaryDivider} />
                <div style={styles.farmerSummaryCol}>
                  <span style={styles.farmerSummaryLabel}>Supervised Tanks</span>
                  <span style={styles.farmerSummaryValue}>{displayTanks.length} Tanks</span>
                </div>
                <div style={styles.farmerSummaryDivider} />
                <div style={styles.farmerSummaryCol}>
                  <span style={styles.farmerSummaryLabel}>Assigned Technician</span>
                  <span style={{ ...styles.farmerSummaryValue, color: '#1A2FB8' }}>{selectedFarmer.agent}</span>
                </div>
                <div style={styles.farmerSummaryDivider} />
                <div style={styles.farmerSummaryCol}>
                  <span style={styles.farmerSummaryLabel}>Next Audit Due</span>
                  <span style={{ ...styles.farmerSummaryValue, color: '#16A34A' }}>{selectedFarmer.nextTest || '28 Aug 2026'}</span>
                </div>
              </div>

              {/* Tank Growth Section */}
              <div style={{ marginTop: '20px' }}>
                <div style={styles.growthSectionTitleRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={16} color="#1A2FB8" />
                    <h4 style={styles.growthSectionTitle}>Tanks & Growth Performance ({displayTanks.length})</h4>
                  </div>
                  <span style={styles.growthLiveBadge}>
                    <Activity size={12} color="#16A34A" /> Live Telemetry
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                  {displayTanks.map((tank, idx) => {
                    const doc = tank.doc || (55 + (idx * 12));
                    const rawAbw = parseFloat(tank.abw) || (18.5 + (idx * 3.8));
                    const abwVal = typeof rawAbw === 'number' ? rawAbw.toFixed(1) : '20.0';
                    const biomassVal = tank.biomass || `${Math.round(parseFloat(abwVal) * 120 * 0.88)} kg`;
                    const fcrVal = tank.fcr || (1.15 + (idx * 0.03)).toFixed(2);
                    const survivalVal = tank.survival || (88 + (idx * 2)) + '%';
                    const progressPercent = Math.min(100, Math.round((parseFloat(abwVal) / 30) * 100));

                    const rawSize = tank.size || tank.acres || '2.5';
                    const sizeDisplay = String(rawSize).toLowerCase().includes('acre')
                      ? rawSize
                      : `${rawSize} Acres`;

                    return (
                      <div key={tank.id || idx} style={styles.tankGrowthCard}>
                        {/* Tank Header */}
                        <div style={styles.tankGrowthHeader}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={styles.tankIconBox}>
                              <Droplets size={16} color="#1A2FB8" />
                            </div>
                            <div>
                              <span style={styles.tankCardTitle}>{tank.name || `Tank ${idx + 1}`}</span>
                              <span style={styles.tankSpeciesText}>
                                {tank.species || tank.broodname || 'SPF Vannamei'} • {sizeDisplay}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={styles.activePondBadge}>
                              <CheckCircle2 size={12} /> Active Culture
                            </span>
                          </div>
                        </div>

                        {/* 4 Core Growth Metrics Grid */}
                        <div style={styles.growthGrid}>
                          <div style={styles.growthMetricTile}>
                            <span style={styles.growthMetricLabel}>Days of Culture (DOC)</span>
                            <span style={styles.growthMetricValue}>Day {doc}</span>
                            <span style={styles.growthMetricSub}>Stocked: {tank.seedDate || 'Active cycle'}</span>
                          </div>

                          <div style={styles.growthMetricTile}>
                            <span style={styles.growthMetricLabel}>Avg Body Weight (ABW)</span>
                            <span style={{ ...styles.growthMetricValue, color: '#16A34A' }}>{abwVal}g</span>
                            <span style={styles.growthMetricSub}>ADG: +0.28 g/day</span>
                          </div>

                          <div style={styles.growthMetricTile}>
                            <span style={styles.growthMetricLabel}>Present Biomass</span>
                            <span style={styles.growthMetricValue}>{biomassVal}</span>
                            <span style={styles.growthMetricSub}>Est. Survival: {survivalVal}</span>
                          </div>

                          <div style={styles.growthMetricTile}>
                            <span style={styles.growthMetricLabel}>Present FCR</span>
                            <span style={{ ...styles.growthMetricValue, color: '#1A2FB8' }}>{fcrVal}</span>
                            <span style={styles.growthMetricSub}>Feed Efficiency: High</span>
                          </div>
                        </div>

                        {/* Target Harvest Growth Progress Bar */}
                        <div style={styles.progressContainer}>
                          <div style={styles.progressLabelRow}>
                            <span style={styles.progressText}>
                              Growth Target Progress (30g Target Harvest)
                            </span>
                            <span style={styles.progressPercentText}>
                              {abwVal}g / 30g ({progressPercent}%)
                            </span>
                          </div>
                          <div style={styles.progressBarTrack}>
                            <div style={{ ...styles.progressBarFill, width: `${progressPercent}%` }} />
                          </div>
                        </div>

                        {/* Tank Telemetry & Specs */}
                        <div style={styles.tankTelemetryRow}>
                          <span><strong>Salinity:</strong> {tank.salinity || 16} ppt</span>
                          <span>•</span>
                          <span><strong>Soil:</strong> {tank.soilType || 'Clay Loam'}</span>
                          <span>•</span>
                          <span><strong>Stocking:</strong> {tank.seedStocking ? `${parseInt(tank.seedStocking)/100000} Lakh` : '1.5 Lakh Seed'}</span>
                          <span>•</span>
                          <span><strong>Last Tested:</strong> {tank.lastTest || selectedFarmer.lastTest || '22 Aug'}</span>
                          <span>•</span>
                          <span><strong>Next Due:</strong> {tank.nextTest || selectedFarmer.nextTest || '29 Aug'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                <button 
                  type="button"
                  style={styles.saveBtn} 
                  onClick={() => setSelectedFarmer(null)}
                >
                  Close Profile
                </button>
              </div>

            </div>
          </div>,
          document.body
        );
      })()}
    </>
  );
};

const styles = {
  summaryBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px 24px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    flexWrap: 'wrap',
    gap: '12px',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  summaryLabel: {
    fontSize: '11.5px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  summaryValue: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryDivider: {
    width: '1px',
    height: '32px',
    backgroundColor: '#F1F5F9',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '20px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  searchGroup: {
    display: 'flex',
    gap: '12px',
    flex: 1,
    maxWidth: '650px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '8px 14px',
    flex: 1,
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '13px',
    color: '#0F172A',
    width: '100%',
  },
  selectFilter: {
    padding: '8px 14px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#0F172A',
    fontWeight: '500',
    outline: 'none',
    cursor: 'pointer',
  },
  addFarmerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 18px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
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
  farmerAvatar: {
    width: '32px',
    height: '32px',
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
  farmerNameText: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#0F172A',
  },
  farmerIdTag: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '500',
  },
  tanksBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#F0F9FF',
    border: '1px solid #E0F2FE',
    padding: '3px 9px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#0284C7',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 9px',
    borderRadius: '12px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  actionBtn: {
    padding: '6px 10px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #DBEAFE',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  emptyTd: {
    padding: '32px',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '13px',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    zIndex: 99999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px 16px',
    boxSizing: 'border-box',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    border: '1px solid #E2E8F0',
    boxSizing: 'border-box',
  },
  modalCardWide: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '820px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    border: '1px solid #E2E8F0',
    boxSizing: 'border-box',
  },
  farmerDetailAvatar: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    fontWeight: '800',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activePondBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  farmerSummaryBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px 16px',
    marginTop: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  farmerSummaryCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    textAlign: 'center',
  },
  farmerSummaryLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  farmerSummaryValue: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#0F172A',
  },
  farmerSummaryDivider: {
    width: '1px',
    height: '28px',
    backgroundColor: '#E2E8F0',
  },
  growthSectionTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  growthSectionTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  growthLiveBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#16A34A',
    backgroundColor: '#F0FDF4',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid #DCFCE7',
  },
  tankGrowthCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  tankGrowthHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tankIconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tankCardTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#0F172A',
    display: 'block',
  },
  tankSpeciesText: {
    fontSize: '11.5px',
    color: '#64748B',
  },
  growthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '10px',
  },
  growthMetricTile: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #F1F5F9',
    borderRadius: '8px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  growthMetricLabel: {
    fontSize: '10.5px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  growthMetricValue: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
  },
  growthMetricSub: {
    fontSize: '10.5px',
    color: '#94A3B8',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  progressLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: '11.5px',
    fontWeight: '600',
    color: '#475569',
  },
  progressPercentText: {
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#1A2FB8',
  },
  progressBarTrack: {
    height: '7px',
    backgroundColor: '#E2E8F0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1A2FB8',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  tankTelemetryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11.5px',
    color: '#64748B',
    flexWrap: 'wrap',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '14px',
    borderBottom: '1px solid #F1F5F9',
  },
  modalIconBox: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  modalSub: {
    fontSize: '12px',
    color: '#64748B',
    margin: '2px 0 0 0',
  },
  modalCloseBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#F1F5F9',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748B',
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
  formLabel: {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '6px',
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
  },
  cancelBtn: {
    padding: '10px 16px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '10px 20px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    border: '1px solid #F1F5F9',
  },
  detailLabel: {
    fontSize: '12.5px',
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
};

export default Farmers;

