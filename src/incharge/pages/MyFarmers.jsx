import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import QuickRecordModal from '../../agent/components/QuickRecordModal';
import HarvestCompletedModal from '../components/HarvestCompletedModal';
import { 
  Search, Filter, Eye, X, Phone, MapPin, 
  Users, Droplets, CheckCircle2, Calendar, ShieldCheck, User,
  TrendingUp, Activity, Scale, Fish, Layers, Sparkles, UserCheck, Shield, UserPlus, FileText, Award
} from 'lucide-react';

const MyFarmers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocality, setFilterLocality] = useState('ALL');
  const { db, createFarmerWithTanks, getTanksByFarmerId, getAgentById, getMyFarmersByInchargeId } = useMockData();
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [selectedHarvestTank, setSelectedHarvestTank] = useState(null);

  // Form State for Adding New Farmer & Quick Recording
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTankModalOpen, setIsTankModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordModalType, setRecordModalType] = useState('WATER_QUALITY');
  const [tanksData, setTanksData] = useState([]);
  const [farmerName, setFarmerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [areaMandal, setAreaMandal] = useState('');
  const [village, setVillage] = useState('');
  const [totalLandArea, setTotalLandArea] = useState('');
  const [waterSource, setWaterSource] = useState('');
  const [numberOfTanks, setNumberOfTanks] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Personal Farmers specifically allocated by Admin directly to this incharge (INC001)
  const inchargeFarmersList = getMyFarmersByInchargeId ? getMyFarmersByInchargeId('INC001') : [];
  
  const myFarmers = inchargeFarmersList.map(f => {
    const tanks = getTanksByFarmerId(f.id);
    const agent = getAgentById(f.agentId);
    return {
      ...f,
      locality: f.location || f.village || 'Bhimavaram',
      tanks: tanks.length,
      acres: f.acres || 5,
      agent: agent ? agent.name : 'Unassigned',
      lastTest: tanks[0] ? tanks[0].lastTest : '22 Aug',
      nextTest: tanks[0] ? tanks[0].nextTest : '29 Aug',
      status: f.status === 'ACTIVE' ? 'Active' : 'Active'
    };
  });

  const localities = Array.from(new Set(myFarmers.map(f => f.locality).filter(Boolean)));

  const filteredFarmers = myFarmers
    .filter(farmer => {
      const matchesSearch = 
        farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farmer.locality.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farmer.phone.includes(searchTerm);
      const matchesLocality = filterLocality === 'ALL' || farmer.locality === filterLocality;
      return matchesSearch && matchesLocality;
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));

  const totalAcres = myFarmers.reduce((acc, f) => acc + (parseFloat(f.acres) || 0), 0);
  const totalTanks = myFarmers.reduce((acc, f) => acc + f.tanks, 0);

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

  const handleTankChange = (index, field, value) => {
    const updated = [...tanksData];
    updated[index] = { ...updated[index], [field]: value };
    setTanksData(updated);
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
        waterSource: waterSource || 'Canal',
        inchargeId: 'INC001'
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

  return (
    <>
      <InchargeHeader 
        title="My Farmers" 
      />

      <div style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* Admin Allocation Notice Banner with New Farmer Button */}
        <div style={styles.adminBanner} className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
            <div style={styles.adminBannerIcon}>
              <Shield size={18} color="#1A2FB8" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                  Admin Allocated Farmers
                </span>
                <span style={styles.adminAllocPill}>
                  <UserCheck size={11} /> {myFarmers.length} Assigned Farmers
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', lineHeight: 1.35 }}>
                These aquaculture farmers and ponds are assigned to your supervision by the central administrator.
              </div>
            </div>
          </div>

          {/* Action Buttons: 3 equal columns on mobile, flex row on tablet/desktop */}
          <div className="grid grid-cols-3 gap-2 w-full md:w-auto md:flex md:items-center">
            <button
              type="button"
              onClick={() => { setRecordModalType('WATER_QUALITY'); setIsRecordModalOpen(true); }}
              style={styles.recordBannerBtn}
              className="transition-all duration-150 active:scale-95 cursor-pointer"
              title="Record Water Analysis, Feed, or Disease"
            >
              <Droplets size={14} />
              <span>New Record</span>
            </button>
            <button
              type="button"
              onClick={() => { setRecordModalType('HARVEST_ENTRY'); setIsRecordModalOpen(true); }}
              style={styles.harvestBannerBtn}
              className="transition-all duration-150 active:scale-95 cursor-pointer"
              title="Record Crop Harvest"
            >
              <Scale size={14} />
              <span>Harvest</span>
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={styles.newFarmerBannerBtn}
              className="transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <UserPlus size={14} />
              <span>New Farmer</span>
            </button>
          </div>
        </div>

        {/* 1. Summary Quick Bar */}
        <div style={styles.summaryBar}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Assigned Farmers</span>
            <span style={styles.summaryValue}>{myFarmers.length}</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Cultivation Area</span>
            <span style={{ ...styles.summaryValue, color: '#1A2FB8' }}>{totalAcres.toFixed(1)} Acres</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Active Ponds / Tanks</span>
            <span style={{ ...styles.summaryValue, color: '#0284C7' }}>{totalTanks} Tanks</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Supervision Status</span>
            <span style={{ ...styles.summaryValue, color: '#16A34A' }}>100% Active</span>
          </div>
        </div>

        {/* 2. Main Table Card */}
        <div style={styles.mainCard}>
          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div style={styles.searchGroup}>
              <div style={styles.searchBox}>
                <Search size={17} color="#64748B" />
                <input 
                  type="text" 
                  placeholder="Search my farmers by name, phone, or village..." 
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

            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto sm:flex sm:items-center">
              <button 
                type="button"
                style={styles.recordBtn}
                onClick={() => { setRecordModalType('WATER_QUALITY'); setIsRecordModalOpen(true); }}
                className="transition-all duration-150 active:scale-95 cursor-pointer"
                title="Record Water Analysis, Feed, or Disease"
              >
                <Droplets size={14} />
                <span>New Record</span>
              </button>

              <button 
                type="button"
                style={styles.harvestBtn}
                onClick={() => { setRecordModalType('HARVEST_ENTRY'); setIsRecordModalOpen(true); }}
                className="transition-all duration-150 active:scale-95 cursor-pointer"
                title="Record Pond Harvest"
              >
                <Scale size={14} />
                <span>Harvest</span>
              </button>

              <button 
                type="button"
                style={styles.addBtn}
                onClick={() => setIsModalOpen(true)}
                className="transition-all duration-150 active:scale-95 cursor-pointer"
              >
                <UserPlus size={15} />
                <span>New Farmer</span>
              </button>
            </div>
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
                        title="View Farmer Profile & Tank Growth"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredFarmers.length === 0 && (
                  <tr>
                    <td colSpan="10" style={styles.emptyTd}>
                      No assigned farmers found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Step 1: Add New Farmer Modal */}
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

      {/* Step 2: Tank Baseline Configurations Modal */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Droplets size={16} color="#1A2FB8" />
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>Tank #{index + 1}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={styles.formLabel}>Size (Acres)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={tank.size} 
                        onChange={e => handleTankChange(index, 'size', e.target.value)} 
                        style={styles.formInput} 
                      />
                    </div>
                    <div>
                      <label style={styles.formLabel}>Salinity (ppt)</label>
                      <input 
                        type="number" 
                        value={tank.salinity} 
                        onChange={e => handleTankChange(index, 'salinity', e.target.value)} 
                        style={styles.formInput} 
                      />
                    </div>
                    <div>
                      <label style={styles.formLabel}>Soil Type</label>
                      <select 
                        value={tank.soilType} 
                        onChange={e => handleTankChange(index, 'soilType', e.target.value)} 
                        style={styles.formInput}
                      >
                        <option value="Clay">Clay</option>
                        <option value="Sandy Clay">Sandy Clay</option>
                        <option value="Loamy">Loamy</option>
                        <option value="Clay Loam">Clay Loam</option>
                      </select>
                    </div>
                    <div>
                      <label style={styles.formLabel}>Broodstock / Species</label>
                      <input 
                        type="text" 
                        value={tank.broodname} 
                        onChange={e => handleTankChange(index, 'broodname', e.target.value)} 
                        style={styles.formInput} 
                      />
                    </div>
                    <div>
                      <label style={styles.formLabel}>Stocking Date</label>
                      <input 
                        type="date" 
                        value={tank.seedDate} 
                        onChange={e => handleTankChange(index, 'seedDate', e.target.value)} 
                        style={styles.formInput} 
                      />
                    </div>
                    <div>
                      <label style={styles.formLabel}>Seed Stocking Count</label>
                      <input 
                        type="number" 
                        value={tank.seedStocking} 
                        onChange={e => handleTankChange(index, 'seedStocking', e.target.value)} 
                        style={styles.formInput} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
              <button 
                type="button" 
                style={styles.cancelBtn}
                onClick={() => { setIsTankModalOpen(false); setIsModalOpen(true); }}
              >
                ← Back
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
                      📞 {selectedFarmer.phone} • 📍 {selectedFarmer.locality} • 👤 Tech: {selectedFarmer.agent}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFarmer(null)}
                  style={styles.modalCloseBtn}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Farmer Profile Overview Bar */}
              <div style={styles.farmerSummaryBar}>
                <div style={styles.farmerSummaryCol}>
                  <span style={styles.farmerSummaryLabel}>Total Extent</span>
                  <span style={styles.farmerSummaryValue}>{selectedFarmer.acres} Acres</span>
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
                  <span style={{ ...styles.farmerSummaryValue, color: '#16A34A' }}>{selectedFarmer.nextTest}</span>
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
                    const tankAcres = String(tank.size || tank.acres || '2.5').replace(/\s*acres?/i, '');

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
                                {tank.species || tank.broodname || 'SPF Vannamei'} • {tankAcres} Acres
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedHarvestTank({
                                ...tank,
                                farmer: selectedFarmer.name,
                                farmerId: selectedFarmer.id,
                                locality: selectedFarmer.locality || selectedFarmer.village,
                                size: tankAcres + ' Acres'
                              })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: '#FEF3C7',
                                color: '#92400E',
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '3px 9px',
                                borderRadius: '6px',
                                border: '1px solid #FDE68A',
                                cursor: 'pointer'
                              }}
                              className="transition-transform active:scale-95"
                              title="View Full Harvest Records, FCR & Biomass Audit"
                            >
                              <Scale size={11} /> Harvest Report
                            </button>
                            <span style={tank.status === 'Harvested' ? styles.harvestedPondBadge || styles.activePondBadge : styles.activePondBadge}>
                              <CheckCircle2 size={12} /> {tank.status === 'Harvested' ? 'Harvested' : 'Active Culture'}
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
                          <span><strong>Last Tested:</strong> {tank.lastTest || selectedFarmer.lastTest || '22 Aug 2026'}</span>
                          <span>•</span>
                          <span><strong>Next Due:</strong> {tank.nextTest || selectedFarmer.nextTest || '29 Aug 2026'}</span>
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

      {/* Harvest Completed Comprehensive Modal */}
      {selectedHarvestTank && (
        <HarvestCompletedModal
          isOpen={Boolean(selectedHarvestTank)}
          onClose={() => setSelectedHarvestTank(null)}
          tank={selectedHarvestTank}
          farmer={selectedFarmer || { name: selectedHarvestTank?.farmer, location: selectedHarvestTank?.locality }}
        />
      )}

      {/* Quick Record & Harvest Modal */}
      <QuickRecordModal 
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        initialType={recordModalType}
        userRole="INCHARGE"
      />
    </>
  );
};

const styles = {
  adminBanner: {
    backgroundColor: '#EFF6FF',
    border: '1px solid #DBEAFE',
    borderRadius: '12px',
    padding: '14px 20px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  adminBannerIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#DBEAFE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  adminAllocPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 10px',
    borderRadius: '14px',
    whiteSpace: 'nowrap',
  },
  recordBannerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    backgroundColor: '#FFFFFF',
    border: '1.5px solid #BFDBFE',
    color: '#1A2FB8',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(26, 47, 184, 0.06)',
    whiteSpace: 'nowrap',
    height: '36px',
    boxSizing: 'border-box',
  },
  harvestBannerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    backgroundColor: '#FEF3C7',
    border: '1.5px solid #FDE68A',
    color: '#92400E',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(146, 64, 14, 0.06)',
    whiteSpace: 'nowrap',
    height: '36px',
    boxSizing: 'border-box',
  },
  newFarmerBannerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(22, 163, 74, 0.25)',
    whiteSpace: 'nowrap',
    height: '36px',
    boxSizing: 'border-box',
  },
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
    padding: '8px 12px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
    outline: 'none',
    cursor: 'pointer',
  },
  recordBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    padding: '6px 12px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1.5px solid #BFDBFE',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(26, 47, 184, 0.06)',
    whiteSpace: 'nowrap',
    height: '36px',
    boxSizing: 'border-box',
  },
  harvestBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    padding: '6px 12px',
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    border: '1.5px solid #FDE68A',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(146, 64, 14, 0.06)',
    whiteSpace: 'nowrap',
    height: '36px',
    boxSizing: 'border-box',
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    padding: '6px 12px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(26, 47, 184, 0.25)',
    whiteSpace: 'nowrap',
    height: '36px',
    boxSizing: 'border-box',
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
    maxWidth: '540px',
    maxHeight: '88vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    boxSizing: 'border-box',
    border: '1px solid #E2E8F0',
    animation: 'modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  modalCardWide: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '840px',
    maxHeight: '88vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    boxSizing: 'border-box',
    border: '1px solid #E2E8F0',
    animation: 'modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  modalIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '14px',
    borderBottom: '1px solid #F1F5F9',
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
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
  },
  formLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '4px',
  },
  formInput: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    boxSizing: 'border-box',
  },
  cancelBtn: {
    padding: '9px 16px',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '9px 20px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
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
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px 16px',
    marginTop: '16px',
    gap: '12px',
    alignItems: 'center',
  },
  farmerSummaryCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '3px',
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
    display: 'none',
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
};

export default MyFarmers;
