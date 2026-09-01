import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFarmers, getRegions, getAgents, getIncharges, calculateBiomass, calculateFCR } from '../utils/adminMockData';
import PageHeader from '../components/PageHeader';
import {
  Search, Filter, Eye, Plus, Trash2, Check, X,
  MapPin, Phone, User, ShieldAlert, Tractor, Layers, Edit, SortAsc
} from 'lucide-react';

const FarmersList = () => {
  const navigate = useNavigate();
  const regions = getRegions();
  const allAgents = getAgents();
  const allIncharges = getIncharges();

  // Load farmers from localStorage or mock data
  const [farmers, setFarmers] = useState(() => {
    const saved = localStorage.getItem('royal_admin_farmers_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return getFarmers();
      }
    }
    return getFarmers();
  });

  // Save to localStorage whenever farmers change
  useEffect(() => {
    localStorage.setItem('royal_admin_farmers_data', JSON.stringify(farmers));
  }, [farmers]);

  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [tankFilter, setTankFilter] = useState('ALL');

  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  const defaultRegion = regions[1] || regions[0] || { id: 'REG-COASTAL', name: 'Coastal Andhra' };
  const defaultLocs = defaultRegion.localities || [];
  const defaultLocName = defaultLocs[0]?.name || 'Nellore';

  // New Farmer Form State
  const [newFarmer, setNewFarmer] = useState({
    name: '',
    phone: '+91 ',
    regionId: defaultRegion.id,
    locality: defaultLocName,
    village: '',
    agentId: allAgents[0]?.id || 'EMP-AGT-01',
    waterSource: 'Creek / Estuary', // Source of Water
    tankCount: 1,
    tankSizes: [4.5] // array of numbers representing acres of each tank
  });

  // Edit Farmer Form State
  const [editFarmer, setEditFarmer] = useState({
    id: '',
    name: '',
    phone: '',
    regionId: defaultRegion.id,
    locality: defaultLocName,
    village: '',
    agentId: allAgents[0]?.id || 'EMP-AGT-01',
    waterSource: 'Creek / Estuary',
    totalAcres: 4.5,
    status: 'Active'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Helper to get localities for a region
  const getLocalitiesForRegion = (regionId) => {
    const region = regions.find(r => r.id === regionId);
    return region?.localities || [];
  };

  // Helper to get agents for a region
  const getAgentsForRegion = (regionId) => {
    return allAgents.filter(a => a.regionId === regionId);
  };

  // Handle Tank Count changes in form
  const handleTankCountChange = (count) => {
    const num = Math.max(1, Math.min(10, parseInt(count) || 1));
    const currentSizes = [...newFarmer.tankSizes];

    // Adjust array length
    if (num > currentSizes.length) {
      while (currentSizes.length < num) {
        currentSizes.push(3.0);
      }
    } else if (num < currentSizes.length) {
      currentSizes.length = num;
    }

    setNewFarmer({
      ...newFarmer,
      tankCount: num,
      tankSizes: currentSizes
    });
  };

  // Handle individual tank size changes
  const handleTankSizeChange = (index, value) => {
    const val = parseFloat(value) || 0;
    const updated = [...newFarmer.tankSizes];
    updated[index] = val;
    setNewFarmer({ ...newFarmer, tankSizes: updated });
  };

  // 1. Add Farmer Submit
  const handleAddFarmerSubmit = (e) => {
    e.preventDefault();
    if (!newFarmer.name.trim()) return;

    const nextNumber = farmers.length + 1;
    const newId = `FAR-${String(100 + nextNumber)}`;
    const selectedRegionObj = regions.find(r => r.id === newFarmer.regionId) || regions[0];
    const selectedAgentObj = allAgents.find(a => a.id === newFarmer.agentId) || allAgents[0];

    const totalAcresCalculated = newFarmer.tankSizes.reduce((acc, s) => acc + (parseFloat(s) || 0), 0);

    const tankBreakdown = newFarmer.tankSizes.map((size, idx) => ({
      id: `T-${newId}-${idx + 1}`,
      name: `Tank ${idx + 1}`,
      acres: parseFloat(size) || 0,
      waterSource: newFarmer.waterSource,
      doc: 35,
      abw: 14.0,
      fcr: 1.30,
      biomass: Math.round((parseFloat(size) || 0) * 800)
    }));

    const createdFarmer = {
      id: newId,
      name: newFarmer.name.trim(),
      phone: newFarmer.phone.trim(),
      region: selectedRegionObj.name,
      regionId: selectedRegionObj.id,
      locality: newFarmer.locality,
      village: newFarmer.village.trim() || `${newFarmer.locality} Village`,
      agentId: selectedAgentObj.id,
      agent: selectedAgentObj.name,
      incharge: selectedAgentObj.incharge,
      waterSource: newFarmer.waterSource,
      acres: `${totalAcresCalculated.toFixed(1)} Acres`,
      totalAcres: totalAcresCalculated,
      tanks: newFarmer.tankCount,
      tankBreakdown: tankBreakdown,
      status: 'Active'
    };

    setFarmers(prev => [createdFarmer, ...prev]);
    showToast(`Farmer ${createdFarmer.name} (${createdFarmer.id}) added successfully!`);
    setShowAddModal(false);

    // Reset Form
    setNewFarmer({
      name: '',
      phone: '+91 ',
      regionId: defaultRegion.id,
      locality: defaultLocName,
      village: '',
      agentId: allAgents[0]?.id || 'EMP-AGT-01',
      waterSource: 'Creek / Estuary',
      tankCount: 1,
      tankSizes: [4.5]
    });
  };

  // 2. Open Edit Farmer Modal
  const openEditModal = (farmer) => {
    setSelectedFarmer(farmer);
    const regObj = regions.find(r => r.name === farmer.region || r.id === farmer.regionId) || defaultRegion;
    const agtObj = allAgents.find(a => a.name === farmer.agent || a.id === farmer.agentId) || allAgents[0];

    setEditFarmer({
      id: farmer.id,
      name: farmer.name,
      phone: farmer.phone,
      regionId: regObj.id,
      locality: farmer.locality || defaultLocName,
      village: farmer.village || '',
      agentId: agtObj?.id || allAgents[0]?.id,
      waterSource: farmer.waterSource || 'Creek / Estuary',
      totalAcres: farmer.totalAcres || parseFloat(farmer.acres) || 4.5,
      status: farmer.status || 'Active'
    });
    setShowEditModal(true);
  };

  // Handle Edit Farmer Submit
  const handleEditFarmerSubmit = (e) => {
    e.preventDefault();
    if (!editFarmer.name.trim() || !selectedFarmer) return;

    const selectedRegionObj = regions.find(r => r.id === editFarmer.regionId) || defaultRegion;
    const selectedAgentObj = allAgents.find(a => a.id === editFarmer.agentId) || allAgents[0];
    const acresNum = parseFloat(editFarmer.totalAcres) || 4.5;

    const updatedFarmer = {
      ...selectedFarmer,
      name: editFarmer.name.trim(),
      phone: editFarmer.phone.trim(),
      region: selectedRegionObj.name,
      regionId: selectedRegionObj.id,
      locality: editFarmer.locality,
      village: editFarmer.village.trim() || `${editFarmer.locality} Village`,
      agentId: selectedAgentObj.id,
      agent: selectedAgentObj.name,
      incharge: selectedAgentObj.incharge,
      waterSource: editFarmer.waterSource,
      totalAcres: acresNum,
      acres: `${acresNum.toFixed(1)} Acres`,
      status: editFarmer.status
    };

    setFarmers(prev => prev.map(f => f.id === selectedFarmer.id ? updatedFarmer : f));
    showToast(`Farmer ${updatedFarmer.name} (${updatedFarmer.id}) details updated!`);
    setShowEditModal(false);
    setSelectedFarmer(null);
  };

  // 3. Delete / Remove Farmer
  const openDeleteModal = (farmer) => {
    setSelectedFarmer(farmer);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedFarmer) return;

    setFarmers(prev => prev.filter(f => f.id !== selectedFarmer.id));
    showToast(`Farmer ${selectedFarmer.name} (${selectedFarmer.id}) removed from directory.`);
    setShowDeleteModal(false);
    setSelectedFarmer(null);
  };

  // Helper to calculate FCR for a tank
  const getDynamicFCR = (tank) => {
    const acres = parseFloat(tank.acres) || 4.0;
    const abw = parseFloat(tank.abw) || 20.0;
    const seedStockingLak = tank.seedStockingLak || parseFloat((acres * 0.8).toFixed(1));
    const biomass = calculateBiomass(seedStockingLak, abw) || tank.biomass;
    const feed = tank.feed || (biomass * (tank.fcr || 1.30));
    return parseFloat(calculateFCR(feed, biomass));
  };

  // Filter and sort farmers alphabetically
  const filtered = farmers.filter(f => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      f.name?.toLowerCase().includes(term) ||
      f.id?.toLowerCase().includes(term) ||
      f.village?.toLowerCase().includes(term) ||
      f.agent?.toLowerCase().includes(term) ||
      f.incharge?.toLowerCase().includes(term) ||
      f.region?.toLowerCase().includes(term) ||
      f.phone?.includes(term) ||
      (f.locality && f.locality.toLowerCase().includes(term));

    const matchesRegion = regionFilter === 'ALL' || f.region === regionFilter || f.region?.includes(regionFilter);
    const matchesTank =
      tankFilter === 'ALL' ||
      (tankFilter === '1' && f.tanks === 1) ||
      (tankFilter === 'MULTI' && f.tanks > 1);

    return matchesSearch && matchesRegion && matchesTank;
  }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // Calculate totals
  const totalFarmersCount = farmers.length;
  const totalTanksCount = farmers.reduce((acc, f) => acc + (f.tanks || 1), 0);
  const totalAcresCount = farmers.reduce((acc, f) => acc + (f.totalAcres || parseFloat(f.acres) || 0), 0);

  return (
    <div style={styles.container}>
      {/* Top Header Row with Page Title + Action Button */}
      <div style={styles.topHeader}>
        <div>
          <PageHeader
            title="All Farmers Directory"
            breadcrumbs={[{ label: 'Organization' }, { label: 'Farmers', active: true }]}
          />
        </div>
        <button
          style={styles.addFarmerBtn}
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>ADD NEW FARMER</span>
        </button>
      </div>

      {/* Summary Stat Chips Bar */}
      <div style={styles.summaryBar}>
        <div style={styles.summaryChip}>
          <span style={styles.chipLabel}>TOTAL FARMERS</span>
          <span style={styles.chipValue}>{totalFarmersCount}</span>
        </div>
        <div style={styles.summaryChip}>
          <span style={styles.chipLabel}>TOTAL ACTIVE TANKS</span>
          <span style={{ ...styles.chipValue, color: '#2563eb' }}>{totalTanksCount} Tanks</span>
        </div>
        <div style={styles.summaryChip}>
          <span style={styles.chipLabel}>TOTAL CULTIVATED LAND</span>
          <span style={{ ...styles.chipValue, color: '#16a34a' }}>{totalAcresCount.toFixed(1)} Acres</span>
        </div>
      </div>

      <div style={styles.card}>
        {/* Search & Filter Bar */}
        <div style={styles.filterBar}>


          <div style={styles.filterGroup}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: 700 }}>
              <SortAsc size={14} color="#16a34a" />
              <span>Alphabetical (A-Z)</span>
            </div>



            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              style={styles.selectFilter}
            >
              <option value="ALL">All Regions</option>
              {regions.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>

            <select
              value={tankFilter}
              onChange={(e) => setTankFilter(e.target.value)}
              style={styles.selectFilter}
            >
              <option value="ALL">All Tank Counts</option>
              <option value="1">Single Tank (1)</option>
              <option value="MULTI">Multiple Tanks (2+)</option>
            </select>
          </div>
        </div>

        {/* Farmers Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>FARMER NAME / ID</th>
                <th style={styles.th}>VILLAGE &amp; LOCALITY</th>
                <th style={styles.th}>AGENT &amp; INCHARGE</th>
                <th style={styles.th}>REGION</th>
                <th style={styles.th}>TOTAL ACRES</th>
                <th style={styles.th}>TOTAL TANKS &amp; SPREAD PER TANK</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((item) => {
                  const totalAcresVal = item.totalAcres || parseFloat(item.acres) || 0;
                  const avgPerTank = (totalAcresVal / (item.tanks || 1)).toFixed(2);

                  return (
                    <tr key={item.id} style={styles.tr}>
                      {/* Farmer Name & ID */}
                      <td style={styles.td}>
                        <div
                          style={{ display: 'flex', flexDirection: 'column', gap: '3px', cursor: 'pointer' }}
                          onClick={() => navigate(`/admin/farmers/${item.id}`)}
                          title="Click to view Tank Growth Graphs"
                        >
                          <span style={styles.farmerName}>{item.name}</span>
                          <span style={styles.farmerId}>{item.id}</span>
                        </div>
                      </td>

                      {/* Village & Locality */}
                      <td style={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={styles.villageText}>{item.village}</span>
                          <span style={styles.localityText}>{item.locality}</span>
                        </div>
                      </td>

                      {/* Agent & Incharge */}
                      <td style={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span
                            style={{ ...styles.agentText, cursor: 'pointer', color: '#0369a1', textDecoration: 'underline', textDecorationColor: '#bae6fd' }}
                            onClick={() => {
                              const ag = allAgents.find(a => a.name === item.agent || a.id === item.agentId);
                              if (ag) navigate(`/admin/agents/${ag.id}`);
                              else navigate('/admin/agents');
                            }}
                            title="Click to view full Agent Profile"
                          >
                            {item.agent}
                          </span>
                          <span
                            style={{ ...styles.inchargeText, cursor: 'pointer', color: '#2563eb', textDecoration: 'underline', textDecorationColor: '#bfdbfe' }}
                            onClick={() => navigate('/admin/incharges')}
                            title="Click to view Incharges & Teams"
                          >
                            Incharge: {item.incharge}
                          </span>
                        </div>
                      </td>

                      {/* Region */}
                      <td style={styles.td}>
                        <span style={styles.regionText}>{item.region}</span>
                      </td>

                      {/* Total Acres */}
                      <td style={styles.td}>
                        <span style={styles.acresBadge}>
                          {item.acres}
                        </span>
                      </td>

                      {/* Total Tanks & No. of Acres Each Tank is Spreaded */}
                      <td style={styles.td}>
                        <div
                          style={{ ...styles.tanksContainer, cursor: 'pointer' }}
                          onClick={() => navigate(`/admin/farmers/${item.id}`)}
                          title="Click to view Tank Growth Graphs"
                        >
                          {/* Tank count tag */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{
                              ...styles.tanksCountBadge,
                              backgroundColor: item.tanks > 1 ? '#eff6ff' : '#f0fdf4',
                              color: item.tanks > 1 ? '#2563eb' : '#16a34a',
                              borderColor: item.tanks > 1 ? '#bfdbfe' : '#bbf7d0'
                            }}>
                              {item.tanks} {item.tanks > 1 ? 'Tanks' : 'Tank'}
                            </span>
                            <span style={styles.avgSpreadText}>
                              {item.tanks > 1 ? `(Avg: ${avgPerTank} Ac/Tank)` : `(${totalAcresVal} Ac spread)`}
                            </span>
                          </div>

                          {/* Individual Tank Acreage Spread Breakdown */}
                          <div style={styles.tankBreakdownList}>
                            {item.tankBreakdown && item.tankBreakdown.length > 0 ? (
                              item.tankBreakdown.map((t, idx) => (
                                <span key={t.id || idx} style={styles.tankSpreadChip}>
                                  <strong style={{ color: '#1e293b' }}>{t.name}:</strong> {t.acres} Ac <span style={{ color: '#2563eb', marginLeft: '4px', fontWeight: 600 }}>(FCR: {getDynamicFCR(t).toFixed(2)})</span>
                                </span>
                              ))
                            ) : (
                              <span style={styles.tankSpreadChip}>
                                <strong style={{ color: '#1e293b' }}>Tank 1:</strong> {item.acres}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actions: View Growth & Delete */}
                      <td style={styles.td}>
                        <div style={styles.actionBtnGroup}>
                          <button
                            style={styles.viewBtn}
                            onClick={() => navigate(`/admin/farmers/${item.id}`)}
                            title="View Tank Growth Graphs & Performance"
                          >
                            <Eye size={13} />
                            <span>View Growth</span>
                          </button>

                          <button
                            style={styles.editFarmerBtn}
                            onClick={() => openEditModal(item)}
                            title="Edit Farmer Details"
                          >
                            <Edit size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            style={styles.deleteBtn}
                            onClick={() => openDeleteModal(item)}
                            title="Remove Farmer from Directory"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                    No farmers found matching current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Farmer */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tractor size={20} color="#2563eb" />
                Add New Aquaculture Farmer
              </h3>
              <button onClick={() => setShowAddModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddFarmerSubmit}>
              <div style={styles.modalBody}>
                {/* Name & Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={styles.modalLabel}>Farmer Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. K. Venkateswara Rao"
                      value={newFarmer.name}
                      onChange={(e) => setNewFarmer({ ...newFarmer, name: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Phone Number *</label>
                    <input
                      type="text"
                      placeholder="+91 9440123456"
                      value={newFarmer.phone}
                      onChange={(e) => setNewFarmer({ ...newFarmer, phone: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                </div>

                {/* Region & Locality */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={styles.modalLabel}>Region</label>
                    <select
                      style={styles.modalSelect}
                      value={newFarmer.regionId}
                      onChange={(e) => {
                        const regId = e.target.value;
                        const locs = getLocalitiesForRegion(regId);
                        const agts = getAgentsForRegion(regId);
                        setNewFarmer({
                          ...newFarmer,
                          regionId: regId,
                          locality: locs[0]?.name || '',
                          agentId: agts[0]?.id || ''
                        });
                      }}
                    >
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Locality</label>
                    <select
                      style={styles.modalSelect}
                      value={newFarmer.locality}
                      onChange={(e) => setNewFarmer({ ...newFarmer, locality: e.target.value })}
                    >
                      {getLocalitiesForRegion(newFarmer.regionId).map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Village & Assigned Field Agent */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={styles.modalLabel}>Village Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Mypadu Coastal"
                      value={newFarmer.village}
                      onChange={(e) => setNewFarmer({ ...newFarmer, village: e.target.value })}
                      style={styles.modalInput}
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Assigned Field Agent</label>
                    <select
                      style={styles.modalSelect}
                      value={newFarmer.agentId}
                      onChange={(e) => setNewFarmer({ ...newFarmer, agentId: e.target.value })}
                    >
                      {getAgentsForRegion(newFarmer.regionId).map(ag => (
                        <option key={ag.id} value={ag.id}>{ag.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Source of Water & Number of Tanks */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={styles.modalLabel}>Source of Water *</label>
                    <select
                      style={styles.modalSelect}
                      value={newFarmer.waterSource}
                      onChange={(e) => setNewFarmer({ ...newFarmer, waterSource: e.target.value })}
                    >
                      <option value="Creek / Estuary">Creek / Estuary</option>
                      <option value="Sea / Coastal Canal">Sea / Coastal Canal</option>
                      <option value="Borewell / Ground Water">Borewell / Ground Water</option>
                      <option value="River / Freshwater Canal">River / Freshwater Canal</option>
                      <option value="Reservoir / Agricultural Canal">Reservoir / Agricultural Canal</option>
                      <option value="Other">Other Source</option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Number of Cultivated Tanks</label>
                    <select
                      style={styles.modalSelect}
                      value={newFarmer.tankCount}
                      onChange={(e) => handleTankCountChange(e.target.value)}
                    >
                      <option value="1">1 Tank</option>
                      <option value="2">2 Tanks</option>
                      <option value="3">3 Tanks</option>
                      <option value="4">4 Tanks</option>
                      <option value="5">5 Tanks</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Tank Acreage Inputs */}
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                  <label style={{ ...styles.modalLabel, color: '#0f172a', fontWeight: 700, marginBottom: '8px' }}>
                    Tank Acreage Spread Allocation (Acres per Tank)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(newFarmer.tankCount, 3)}, 1fr)`, gap: '10px' }}>
                    {newFarmer.tankSizes.map((size, index) => (
                      <div key={index}>
                        <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Tank {index + 1} (Acres)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={size}
                          onChange={(e) => handleTankSizeChange(index, e.target.value)}
                          style={{ ...styles.modalInput, marginTop: '2px' }}
                          required
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#2563eb', fontWeight: 700 }}>
                    Total Cultivated Spread: {newFarmer.tankSizes.reduce((a, b) => a + (parseFloat(b) || 0), 0).toFixed(1)} Acres
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitBtn}
                >
                  Create Farmer Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Farmer Details */}
      {showEditModal && selectedFarmer && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, width: '560px' }}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={18} color="#2563eb" />
                Edit Farmer: {selectedFarmer.name}
              </h3>
              <button onClick={() => setShowEditModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditFarmerSubmit}>
              <div style={styles.modalBody}>
                {/* Farmer Name & Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={styles.modalLabel}>Farmer Full Name *</label>
                    <input
                      type="text"
                      value={editFarmer.name}
                      onChange={(e) => setEditFarmer({ ...editFarmer, name: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Phone Number *</label>
                    <input
                      type="text"
                      value={editFarmer.phone}
                      onChange={(e) => setEditFarmer({ ...editFarmer, phone: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                </div>

                {/* Region & Locality */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={styles.modalLabel}>Assigned Region *</label>
                    <select
                      style={styles.modalSelect}
                      value={editFarmer.regionId}
                      onChange={(e) => {
                        const rId = e.target.value;
                        const rLocs = getLocalitiesForRegion(rId);
                        const rAgents = getAgentsForRegion(rId);
                        setEditFarmer({
                          ...editFarmer,
                          regionId: rId,
                          locality: rLocs[0]?.name || '',
                          agentId: rAgents[0]?.id || ''
                        });
                      }}
                    >
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Locality *</label>
                    <select
                      style={styles.modalSelect}
                      value={editFarmer.locality}
                      onChange={(e) => setEditFarmer({ ...editFarmer, locality: e.target.value })}
                    >
                      {getLocalitiesForRegion(editFarmer.regionId).map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Village & Assigned Field Agent */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={styles.modalLabel}>Village Name *</label>
                    <input
                      type="text"
                      value={editFarmer.village}
                      onChange={(e) => setEditFarmer({ ...editFarmer, village: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Assigned Field Agent</label>
                    <select
                      style={styles.modalSelect}
                      value={editFarmer.agentId}
                      onChange={(e) => setEditFarmer({ ...editFarmer, agentId: e.target.value })}
                    >
                      {allAgents.map(ag => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name} ({ag.locality})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Source of Water, Total Acres & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={styles.modalLabel}>Source of Water</label>
                    <select
                      style={styles.modalSelect}
                      value={editFarmer.waterSource}
                      onChange={(e) => setEditFarmer({ ...editFarmer, waterSource: e.target.value })}
                    >
                      <option value="Creek / Estuary">Creek / Estuary</option>
                      <option value="Sea / Coastal Canal">Sea / Coastal Canal</option>
                      <option value="Borewell / Ground Water">Borewell / Ground Water</option>
                      <option value="River / Freshwater Canal">River / Freshwater Canal</option>
                      <option value="Reservoir / Agricultural Canal">Reservoir / Agricultural Canal</option>
                      <option value="Other">Other Source</option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Total Acres *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={editFarmer.totalAcres}
                      onChange={(e) => setEditFarmer({ ...editFarmer, totalAcres: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Status</label>
                    <select
                      style={styles.modalSelect}
                      value={editFarmer.status}
                      onChange={(e) => setEditFarmer({ ...editFarmer, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitBtn}
                >
                  Save Farmer Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete / Remove Farmer Confirmation */}
      {showDeleteModal && selectedFarmer && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} color="#dc2626" />
                Remove Farmer Record
              </h3>
              <button onClick={() => setShowDeleteModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                Are you sure you want to permanently remove <strong>{selectedFarmer.name}</strong> ({selectedFarmer.id}) from the directory?
              </p>

              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600 }}>
                  • Region: {selectedFarmer.region} ({selectedFarmer.locality})
                </div>
                <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600, marginTop: '4px' }}>
                  • Total Land: {selectedFarmer.acres} across {selectedFarmer.tanks} Tank(s)
                </div>
                <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600, marginTop: '4px' }}>
                  • Assigned Agent: {selectedFarmer.agent}
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{ ...styles.submitBtn, backgroundColor: '#dc2626' }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div style={styles.toast}>
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '1380px',
    margin: '0 auto'
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  },
  addFarmerBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '9px 18px',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
    transition: 'background-color 0.15s',
    flexShrink: 0
  },
  summaryBar: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  summaryChip: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '12px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  },
  chipLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.4px'
  },
  chipValue: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#0f172a'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px 32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f8fafc',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '10px 16px',
    width: '380px'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    fontSize: '13px',
    color: '#1e293b'
  },
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '16px',
    padding: 0
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  selectFilter: {
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '9px 16px',
    fontSize: '13px',
    color: '#334155',
    outline: 'none',
    cursor: 'pointer'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  theadRow: {
    borderBottom: '2px solid #e2e8f0',
    backgroundColor: '#f8fafc'
  },
  th: {
    padding: '16px 20px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.4px'
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.15s',
    '&:hover': {
      backgroundColor: '#f8fafc'
    }
  },
  td: {
    padding: '18px 20px',
    verticalAlign: 'middle',
    fontSize: '13px',
    color: '#334155'
  },
  farmerName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a'
  },
  farmerId: {
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#2563eb'
  },
  villageText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1e293b'
  },
  localityText: {
    fontSize: '12px',
    color: '#64748b'
  },
  agentText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a'
  },
  inchargeText: {
    fontSize: '11.5px',
    color: '#64748b'
  },
  regionText: {
    fontSize: '12.5px',
    fontWeight: 500,
    color: '#334155',
    lineHeight: '1.3'
  },
  acresBadge: {
    fontSize: '13.5px',
    fontWeight: 800,
    color: '#0f172a'
  },
  tanksContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  tanksCountBadge: {
    fontSize: '11.5px',
    fontWeight: 800,
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid',
    letterSpacing: '0.3px',
    display: 'inline-block'
  },
  avgSpreadText: {
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#64748b'
  },
  tankBreakdownList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px'
  },
  tankSpreadChip: {
    fontSize: '11px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '2px 7px',
    borderRadius: '5px',
    border: '1px solid #e2e8f0'
  },
  actionBtnGroup: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center'
  },
  viewBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  editFarmerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#f8fafc',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  deleteBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '480px',
    maxWidth: '92vw',
    padding: '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px'
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer'
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column'
  },
  modalLabel: {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '5px'
  },
  modalInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  modalSelect: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '16px'
  },
  cancelBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#475569',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '8px 18px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#15803d',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 9999
  }
};

export default FarmersList;
