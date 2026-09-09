import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFarmers, getRegions, getAgents, getIncharges, calculateBiomass, calculateFCR } from '../utils/adminMockData';
import { useMockData } from '../../context/MockDataContext';
import {
  Search, Plus, Trash2, CheckCircle2, X, MapPin, Phone,
  User, ShieldAlert, Tractor, Layers, Edit3, TrendingUp,
  ChevronDown, ChevronUp, RotateCcw, Filter, Users, Sparkles,
  ExternalLink, Building2, Check, ArrowRight
} from 'lucide-react';

const FarmersList = () => {
  const navigate = useNavigate();
  const { db, createFarmerWithTanks, updateFarmer, deleteFarmer } = useMockData();
  const regions = getRegions();
  const allAgents = getAgents();
  const allIncharges = getIncharges();

  // Load farmers reactively from unified data context
  const [farmers, setFarmers] = useState(() => getFarmers());

  // Keep farmers in sync whenever db changes
  useEffect(() => {
    setFarmers(getFarmers());
  }, [db]);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [tankFilter, setTankFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Expanded tanks breakdown per farmer (toggle row)
  const [expandedFarmerIds, setExpandedFarmerIds] = useState({});

  // Toast feedback state
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
    waterSource: 'Creek / Estuary',
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

  // Toggle tank breakdown dropdown
  const toggleTankExpand = (farmerId, e) => {
    e.stopPropagation();
    setExpandedFarmerIds(prev => ({
      ...prev,
      [farmerId]: !prev[farmerId]
    }));
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setRegionFilter('ALL');
    setTankFilter('ALL');
    setStatusFilter('ALL');
  };

  const hasActiveFilters = searchTerm !== '' || regionFilter !== 'ALL' || tankFilter !== 'ALL' || statusFilter !== 'ALL';

  // Handle Tank Count changes in form
  const handleTankCountChange = (count) => {
    const num = Math.max(1, Math.min(10, parseInt(count) || 1));
    const currentSizes = [...newFarmer.tankSizes];

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

    const farmerPayload = {
      name: newFarmer.name.trim(),
      phone: newFarmer.phone.trim(),
      region: selectedRegionObj.name,
      regionId: selectedRegionObj.id,
      location: `${newFarmer.village.trim() || newFarmer.locality}, ${newFarmer.locality}`,
      locality: newFarmer.locality,
      village: newFarmer.village.trim() || `${newFarmer.locality} Village`,
      agentId: selectedAgentObj.id,
      agent: selectedAgentObj.name,
      incharge: selectedAgentObj.incharge || 'Ravi Kumar',
      waterSource: newFarmer.waterSource,
      acres: `${totalAcresCalculated.toFixed(1)} Acres`,
      totalAcres: totalAcresCalculated,
      extent: totalAcresCalculated,
      tanks: newFarmer.tankCount,
      tankBreakdown: tankBreakdown,
      status: 'Active'
    };

    if (createFarmerWithTanks) {
      createFarmerWithTanks(selectedAgentObj.id, farmerPayload, tankBreakdown);
    } else {
      setFarmers(prev => [{ ...farmerPayload, id: newId }, ...prev]);
    }

    showToast(`Farmer ${farmerPayload.name} added successfully!`);
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
  const openEditModal = (farmer, e) => {
    if (e) e.stopPropagation();
    setSelectedFarmer(farmer);
    const regObj = regions.find(r => r.name === farmer.region || r.id === farmer.regionId) || defaultRegion;
    const agtObj = allAgents.find(a => a.name === farmer.agent || a.id === farmer.agentId) || allAgents[0];

    setEditFarmer({
      id: farmer.id,
      name: farmer.name,
      phone: farmer.phone || '',
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
      location: `${editFarmer.village.trim() || editFarmer.locality}, ${editFarmer.locality}`,
      village: editFarmer.village.trim() || `${editFarmer.locality} Village`,
      agentId: selectedAgentObj.id,
      agent: selectedAgentObj.name,
      incharge: selectedAgentObj.incharge || selectedFarmer.incharge || 'Ravi Kumar',
      waterSource: editFarmer.waterSource,
      totalAcres: acresNum,
      acres: `${acresNum.toFixed(1)} Acres`,
      status: editFarmer.status
    };

    if (updateFarmer) {
      updateFarmer(selectedFarmer.id, updatedFarmer);
    }
    setFarmers(prev => prev.map(f => f.id === selectedFarmer.id ? updatedFarmer : f));
    showToast(`Farmer ${updatedFarmer.name} (${updatedFarmer.id}) details updated!`);
    setShowEditModal(false);
    setSelectedFarmer(null);
  };

  // 3. Delete / Remove Farmer
  const openDeleteModal = (farmer, e) => {
    if (e) e.stopPropagation();
    setSelectedFarmer(farmer);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedFarmer) return;

    if (deleteFarmer) {
      deleteFarmer(selectedFarmer.id);
    }
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

  // Helper to generate initials avatar
  const getInitials = (name) => {
    if (!name) return 'FM';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Filter and sort farmers alphabetically
  const filtered = useMemo(() => {
    return farmers.filter(f => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
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
        (tankFilter === '1' && (f.tanks === 1 || !f.tanks)) ||
        (tankFilter === 'MULTI' && (f.tanks > 1));
      const matchesStatus =
        statusFilter === 'ALL' ||
        (f.status || 'Active').toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesRegion && matchesTank && matchesStatus;
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [farmers, searchTerm, regionFilter, tankFilter, statusFilter]);

  // Summary statistics
  const totalFarmersCount = farmers.length;
  const totalTanksCount = farmers.reduce((acc, f) => acc + (f.tanks || 1), 0);
  const totalAcresCount = farmers.reduce((acc, f) => acc + (f.totalAcres || parseFloat(f.acres) || 0), 0);
  const avgTanksPerFarmer = (totalTanksCount / (totalFarmersCount || 1)).toFixed(1);

  return (
    <div style={styles.pageContainer}>
      {/* ────────────────────────────────────────────────
          COMPACT PAGE HEADER
          ──────────────────────────────────────────────── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <nav aria-label="Breadcrumb" style={styles.breadcrumb}>
            <span
              style={styles.breadcrumbLink}
              onClick={() => navigate('/admin/dashboard')}
            >
              Dashboard
            </span>
            <span style={styles.breadcrumbSeparator}>/</span>
            <span style={styles.breadcrumbActive}>Farmers</span>
          </nav>
          <div style={styles.titleRow}>
            <h1 style={styles.pageTitle}>Farmers</h1>
            <span style={styles.countPill}>{filtered.length} total</span>
          </div>
          <p style={styles.pageSubtitle}>
            Manage farmers, tanks and cultivation records.
          </p>
        </div>

        <div style={styles.headerRight}>
          <button
            style={styles.primaryButton}
            onClick={() => setShowAddModal(true)}
            aria-label="Add new farmer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Farmer</span>
          </button>
        </div>
      </header>

      {/* ────────────────────────────────────────────────
          SUMMARY CARDS (Horizontal Row, 16px Radius, Soft Shadow)
          ──────────────────────────────────────────────── */}
      <section style={styles.summaryGrid} aria-label="Key Performance Indicators">
        {/* Total Farmers Card */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTop}>
            <span style={styles.summaryCardLabel}>TOTAL FARMERS</span>
            <div style={{ ...styles.iconContainer, backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <Users size={18} strokeWidth={2} />
            </div>
          </div>
          <div style={styles.summaryCardBody}>
            <div style={styles.summaryCardNumber}>{totalFarmersCount}</div>
            <div style={styles.summaryTrend}>
              <span style={styles.trendBadgeSuccess}>Active Directory</span>
              <span style={styles.trendContext}>100% verified</span>
            </div>
          </div>
        </div>

        {/* Total Active Tanks Card */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTop}>
            <span style={styles.summaryCardLabel}>TOTAL ACTIVE TANKS</span>
            <div style={{ ...styles.iconContainer, backgroundColor: '#F0FDF4', color: '#16A34A' }}>
              <Layers size={18} strokeWidth={2} />
            </div>
          </div>
          <div style={styles.summaryCardBody}>
            <div style={{ ...styles.summaryCardNumber, color: '#16A34A' }}>
              {totalTanksCount}
            </div>
            <div style={styles.summaryTrend}>
              <span style={styles.trendBadgeNeutral}>Avg {avgTanksPerFarmer} tanks</span>
              <span style={styles.trendContext}>per farmer</span>
            </div>
          </div>
        </div>

        {/* Total Cultivated Land Card */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTop}>
            <span style={styles.summaryCardLabel}>TOTAL CULTIVATED LAND</span>
            <div style={{ ...styles.iconContainer, backgroundColor: '#F8FAFC', color: '#0F172A' }}>
              <MapPin size={18} strokeWidth={2} />
            </div>
          </div>
          <div style={styles.summaryCardBody}>
            <div style={{ ...styles.summaryCardNumber, color: '#0F172A' }}>
              {totalAcresCount.toFixed(1)} <span style={styles.unitText}>Acres</span>
            </div>
            <div style={styles.summaryTrend}>
              <span style={styles.trendBadgeNeutral}>Across {regions.length} Regions</span>
              <span style={styles.trendContext}>water monitored</span>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────
          STICKY FILTER TOOLBAR (44px Height, 12px Radius)
          ──────────────────────────────────────────────── */}
      <div style={styles.stickyFilterToolbar}>
        {/* Search Input */}
        <div style={styles.searchBox}>
          <Search size={15} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search farmers, ID, village, agent, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
            aria-label="Search directory"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={styles.clearSearchBtn}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Selects & Actions */}
        <div style={styles.filterControls}>
          {/* Region Select */}
          <div style={styles.selectWrapper}>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              style={styles.filterSelect}
              aria-label="Filter by region"
            >
              <option value="ALL">All Regions</option>
              {regions.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
            <ChevronDown size={14} style={styles.selectArrow} />
          </div>

          {/* Tank Count Select */}
          <div style={styles.selectWrapper}>
            <select
              value={tankFilter}
              onChange={(e) => setTankFilter(e.target.value)}
              style={styles.filterSelect}
              aria-label="Filter by tank count"
            >
              <option value="ALL">All Tank Counts</option>
              <option value="1">Single Tank (1)</option>
              <option value="MULTI">Multiple Tanks (2+)</option>
            </select>
            <ChevronDown size={14} style={styles.selectArrow} />
          </div>

          {/* Status Select */}
          <div style={styles.selectWrapper}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.filterSelect}
              aria-label="Filter by status"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown size={14} style={styles.selectArrow} />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              style={styles.resetButton}
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────
          PREMIUM ENTERPRISE TABLE
          ──────────────────────────────────────────────── */}
      <div style={styles.tableCard}>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={{ ...styles.th, width: '22%' }}>FARMER NAME</th>
                <th style={{ ...styles.th, width: '16%' }}>LOCATION</th>
                <th style={{ ...styles.th, width: '18%' }}>FIELD AGENT</th>
                <th style={{ ...styles.th, width: '13%' }}>REGION</th>
                <th style={{ ...styles.th, width: '10%' }}>TOTAL ACRES</th>
                <th style={{ ...styles.th, width: '11%' }}>TANKS</th>
                <th style={{ ...styles.th, width: '10%', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((item, index) => {
                  const totalAcresVal = item.totalAcres || parseFloat(item.acres) || 0;
                  const tankCount = item.tanks || 1;
                  const avgPerTank = (totalAcresVal / tankCount).toFixed(1);
                  const isExpanded = !!expandedFarmerIds[item.id];
                  const hasMultipleTanks = tankCount > 1 || (item.tankBreakdown && item.tankBreakdown.length > 1);
                  const initials = getInitials(item.name);
                  const isAlternate = index % 2 === 1;

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        style={{
                          ...styles.tableRow,
                          backgroundColor: isAlternate ? '#FAFCFF' : '#FFFFFF'
                        }}
                      >
                        {/* 1. Farmer Name Column */}
                        <td style={styles.td}>
                          <div
                            style={styles.farmerCell}
                            onClick={() => navigate(`/admin/farmers/${item.id}`)}
                            title="Click to view full farmer profile & growth graphs"
                          >
                            <div style={styles.avatar}>
                              {initials}
                            </div>
                            <div style={styles.farmerInfo}>
                              <span style={styles.farmerName}>{item.name}</span>
                              <span style={styles.farmerId}>{item.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Location Column */}
                        <td style={styles.td}>
                          <div style={styles.locationCell}>
                            <div style={styles.villageRow}>
                              <MapPin size={13} style={styles.locationPin} />
                              <span style={styles.villageText}>{item.village || item.locality}</span>
                            </div>
                            <span style={styles.localitySubtext}>
                              {item.locality || item.location}
                            </span>
                          </div>
                        </td>

                        {/* 3. Field Agent & Incharge Column */}
                        <td style={styles.td}>
                          <div style={styles.agentCell}>
                            <div style={styles.agentNameRow}>
                              <span
                                style={styles.agentName}
                                onClick={() => {
                                  const ag = allAgents.find(a => a.name === item.agent || a.id === item.agentId);
                                  if (ag) navigate(`/admin/agents/${ag.id}`);
                                  else navigate('/admin/agents');
                                }}
                                title="View Agent Profile"
                              >
                                {item.agent || 'Assigned Technician'}
                              </span>
                              <span style={styles.roleBadge}>Agent</span>
                            </div>
                            <span
                              style={styles.inchargeSubtext}
                              onClick={() => navigate('/admin/incharges')}
                              title="View Incharges"
                            >
                              Incharge: {item.incharge || 'Ravi Kumar'}
                            </span>
                          </div>
                        </td>

                        {/* 4. Region Column */}
                        <td style={styles.td}>
                          <span style={styles.regionBadge}>
                            {item.region || 'Coastal Andhra'}
                          </span>
                        </td>

                        {/* 5. Total Acres Column */}
                        <td style={styles.td}>
                          <div style={styles.acresCell}>
                            <span style={styles.acresValue}>
                              {totalAcresVal.toFixed(1)}
                            </span>
                            <span style={styles.acresUnit}>Acres</span>
                          </div>
                        </td>

                        {/* 6. Tanks Column (Clean Green Badge + Avg + Inline Toggle) */}
                        <td style={styles.td}>
                          <div style={styles.tanksCell}>
                            <div style={styles.tanksHeaderRow}>
                              <span style={styles.tanksBadge}>
                                {tankCount} {tankCount > 1 ? 'Tanks' : 'Tank'}
                              </span>
                              {hasMultipleTanks && (
                                <button
                                  type="button"
                                  style={styles.expandTankBtn}
                                  onClick={(e) => toggleTankExpand(item.id, e)}
                                  title={isExpanded ? 'Collapse tank breakdown' : 'Expand tank breakdown'}
                                >
                                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                </button>
                              )}
                            </div>
                            <span style={styles.tanksAvgText}>
                              Avg {avgPerTank} Ac/Tank
                            </span>
                          </div>
                        </td>

                        {/* 7. Action Icon Buttons Column */}
                        <td style={styles.td}>
                          <div style={styles.actionsCell}>
                            {/* View Growth (Primary Blue Icon Button) */}
                            <button
                              style={styles.viewGrowthBtn}
                              onClick={() => navigate(`/admin/farmers/${item.id}`)}
                              title="View Growth & Performance Graphs"
                              aria-label="View Growth"
                            >
                              <TrendingUp size={15} strokeWidth={2.2} />
                            </button>

                            {/* Edit (Ghost Button) */}
                            <button
                              style={styles.ghostActionBtn}
                              onClick={(e) => openEditModal(item, e)}
                              title="Edit Farmer Record"
                              aria-label="Edit Farmer"
                            >
                              <Edit3 size={15} strokeWidth={2} />
                            </button>

                            {/* Delete (Ghost Danger Button) */}
                            <button
                              style={styles.ghostDeleteBtn}
                              onClick={(e) => openDeleteModal(item, e)}
                              title="Remove Farmer"
                              aria-label="Remove Farmer"
                            >
                              <Trash2 size={15} strokeWidth={2} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Tank Breakdown Sub-row */}
                      {isExpanded && (
                        <tr style={styles.expandedSubRow}>
                          <td colSpan={7} style={styles.expandedTd}>
                            <div style={styles.expandedContent}>
                              <div style={styles.expandedHeader}>
                                <span style={styles.expandedTitle}>
                                  Tank Breakdown ({tankCount} Active Tanks)
                                </span>
                                <span style={styles.expandedSubtitle}>
                                  Total Area: {totalAcresVal.toFixed(1)} Acres • Water Source: {item.waterSource || 'Creek / Estuary'}
                                </span>
                              </div>
                              <div style={styles.tankChipsGrid}>
                                {item.tankBreakdown && item.tankBreakdown.length > 0 ? (
                                  item.tankBreakdown.map((t, tIdx) => {
                                    const fcrVal = getDynamicFCR(t);
                                    return (
                                      <div key={t.id || tIdx} style={styles.tankDetailChip}>
                                        <div style={styles.tankChipTitle}>
                                          <Layers size={13} color="#2563EB" />
                                          <strong>{t.name || `Tank ${tIdx + 1}`}</strong>
                                        </div>
                                        <div style={styles.tankChipDetails}>
                                          <span><strong>{t.acres}</strong> Acres</span>
                                          <span style={styles.dotDivider}>•</span>
                                          <span style={styles.fcrHighlight}>FCR: {fcrVal.toFixed(2)}</span>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div style={styles.tankDetailChip}>
                                    <div style={styles.tankChipTitle}>
                                      <Layers size={13} color="#2563EB" />
                                      <strong>Tank 1</strong>
                                    </div>
                                    <div style={styles.tankChipDetails}>
                                      <span><strong>{totalAcresVal.toFixed(1)}</strong> Acres</span>
                                      <span style={styles.dotDivider}>•</span>
                                      <span style={styles.fcrHighlight}>FCR: 1.30</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                /* ────────────────────────────────────────────────
                   PREMIUM EMPTY STATE
                   ──────────────────────────────────────────────── */
                <tr>
                  <td colSpan={7} style={styles.emptyStateCell}>
                    <div style={styles.emptyStateContainer}>
                      <div style={styles.emptyStateIconCircle}>
                        <Tractor size={32} strokeWidth={1.5} color="#64748B" />
                      </div>
                      <h3 style={styles.emptyStateTitle}>No Farmers Found</h3>
                      <p style={styles.emptyStateDescription}>
                        {hasActiveFilters
                          ? 'No farmers match your current filter criteria. Try resetting or adjusting your filters.'
                          : 'No farmer records exist in this directory yet.'}
                      </p>
                      <div style={styles.emptyStateActions}>
                        {hasActiveFilters && (
                          <button
                            style={styles.secondaryButton}
                            onClick={handleResetFilters}
                          >
                            <RotateCcw size={14} />
                            <span>Reset Filters</span>
                          </button>
                        )}
                        <button
                          style={styles.primaryButton}
                          onClick={() => setShowAddModal(true)}
                        >
                          <Plus size={16} strokeWidth={2.5} />
                          <span>Add New Farmer</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ────────────────────────────────────────────────
          MODAL: ADD NEW FARMER
          ──────────────────────────────────────────────── */}
      {showAddModal && (
        <div style={styles.modalBackdrop} onClick={() => setShowAddModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Add Aquaculture Farmer</h3>
                <p style={styles.modalSubtitle}>Register a new farmer with pond allocations and field agent assignments.</p>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowAddModal(false)}
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddFarmerSubmit}>
              <div style={styles.modalBody}>
                {/* Farmer Name & Phone */}
                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Farmer Full Name <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. K. Venkateswara Rao"
                      value={newFarmer.name}
                      onChange={(e) => setNewFarmer({ ...newFarmer, name: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Phone Number <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="text"
                      placeholder="+91 9440123456"
                      value={newFarmer.phone}
                      onChange={(e) => setNewFarmer({ ...newFarmer, phone: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                </div>

                {/* Region & Locality */}
                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Region</label>
                    <select
                      style={styles.formSelect}
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
                    <label style={styles.formLabel}>Locality / District</label>
                    <select
                      style={styles.formSelect}
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
                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Village Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Mypadu Coastal"
                      value={newFarmer.village}
                      onChange={(e) => setNewFarmer({ ...newFarmer, village: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Assigned Field Agent</label>
                    <select
                      style={styles.formSelect}
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
                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Source of Water</label>
                    <select
                      style={styles.formSelect}
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
                    <label style={styles.formLabel}>Number of Cultivated Tanks</label>
                    <select
                      style={styles.formSelect}
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

                {/* Dynamic Tank Acreage Allocation Card */}
                <div style={styles.formAllocationCard}>
                  <div style={styles.allocationHeader}>
                    <span style={styles.allocationTitle}>Tank Acreage Spread Allocation</span>
                    <span style={styles.allocationTotal}>
                      Total: {newFarmer.tankSizes.reduce((a, b) => a + (parseFloat(b) || 0), 0).toFixed(1)} Acres
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(newFarmer.tankCount, 3)}, 1fr)`, gap: '10px' }}>
                    {newFarmer.tankSizes.map((size, index) => (
                      <div key={index}>
                        <label style={styles.subFormLabel}>Tank {index + 1} (Acres)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={size}
                          onChange={(e) => handleTankSizeChange(index, e.target.value)}
                          style={styles.formInput}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={styles.secondaryButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.primaryButton}
                >
                  Create Farmer Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────
          MODAL: EDIT FARMER DETAILS
          ──────────────────────────────────────────────── */}
      {showEditModal && selectedFarmer && (
        <div style={styles.modalBackdrop} onClick={() => setShowEditModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Edit Farmer Details</h3>
                <p style={styles.modalSubtitle}>Updating records for {selectedFarmer.name} ({selectedFarmer.id})</p>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowEditModal(false)}
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditFarmerSubmit}>
              <div style={styles.modalBody}>
                {/* Farmer Name & Phone */}
                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Farmer Full Name <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="text"
                      value={editFarmer.name}
                      onChange={(e) => setEditFarmer({ ...editFarmer, name: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Phone Number <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="text"
                      value={editFarmer.phone}
                      onChange={(e) => setEditFarmer({ ...editFarmer, phone: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                </div>

                {/* Region & Locality */}
                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Assigned Region <span style={{ color: '#DC2626' }}>*</span></label>
                    <select
                      style={styles.formSelect}
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
                    <label style={styles.formLabel}>Locality / District <span style={{ color: '#DC2626' }}>*</span></label>
                    <select
                      style={styles.formSelect}
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
                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Village Name <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="text"
                      value={editFarmer.village}
                      onChange={(e) => setEditFarmer({ ...editFarmer, village: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Assigned Field Agent</label>
                    <select
                      style={styles.formSelect}
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

                {/* Water Source, Total Acres & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={styles.formLabel}>Source of Water</label>
                    <select
                      style={styles.formSelect}
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
                    <label style={styles.formLabel}>Total Acres <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={editFarmer.totalAcres}
                      onChange={(e) => setEditFarmer({ ...editFarmer, totalAcres: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Status</label>
                    <select
                      style={styles.formSelect}
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
                  style={styles.secondaryButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.primaryButton}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────
          MODAL: DELETE CONFIRMATION
          ──────────────────────────────────────────────── */}
      {showDeleteModal && selectedFarmer && (
        <div style={styles.modalBackdrop} onClick={() => setShowDeleteModal(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.dangerIconBadge}>
                  <ShieldAlert size={20} color="#DC2626" />
                </div>
                <div>
                  <h3 style={{ ...styles.modalTitle, color: '#0F172A' }}>Remove Farmer</h3>
                  <p style={styles.modalSubtitle}>Permanent directory action</p>
                </div>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowDeleteModal(false)}
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <p style={styles.deleteConfirmText}>
                Are you sure you want to permanently remove <strong>{selectedFarmer.name}</strong> ({selectedFarmer.id})? All associated cultivation records and links will be unassigned.
              </p>

              <div style={styles.deleteWarningCard}>
                <div style={styles.warningItem}>
                  <span style={styles.warningLabel}>Region:</span> {selectedFarmer.region} ({selectedFarmer.locality})
                </div>
                <div style={styles.warningItem}>
                  <span style={styles.warningLabel}>Cultivation:</span> {selectedFarmer.acres} across {selectedFarmer.tanks || 1} Tank(s)
                </div>
                <div style={styles.warningItem}>
                  <span style={styles.warningLabel}>Field Agent:</span> {selectedFarmer.agent}
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={styles.secondaryButton}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={styles.dangerButton}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────
          TOAST FEEDBACK
          ──────────────────────────────────────────────── */}
      {toastMessage && (
        <div style={styles.toastContainer}>
          <CheckCircle2 size={16} color="#FFFFFF" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────
   ENTERPRISE DESIGN SYSTEM STYLES (Strict Tokens)
   ──────────────────────────────────────────────── */
const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1440px',
    margin: '0 auto',
    width: '100%',
    paddingBottom: '32px'
  },

  /* Header Section */
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px'
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#64748B',
    marginBottom: '2px'
  },
  breadcrumbLink: {
    cursor: 'pointer',
    color: '#64748B',
    transition: 'color 0.15s ease'
  },
  breadcrumbSeparator: {
    color: '#CBD5E1'
  },
  breadcrumbActive: {
    color: '#0F172A',
    fontWeight: 600
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: '-0.02em',
    margin: 0,
    lineHeight: '1.2'
  },
  countPill: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    fontSize: '12px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '9999px',
    border: '1px solid #E2E8F0'
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#64748B',
    margin: 0
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },

  /* Buttons */
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '9px 16px',
    fontSize: '13.5px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, transform 0.1s ease',
    boxShadow: '0 1px 2px rgba(37, 99, 235, 0.12)'
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FFFFFF',
    color: '#334155',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '9px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  },
  dangerButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '9px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  },

  /* Summary Cards */
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px'
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '108px',
    boxShadow: '0 4px 18px rgba(15, 23, 42, 0.06)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    cursor: 'default'
  },
  summaryCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryCardLabel: {
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#64748B',
    letterSpacing: '0.04em',
    textTransform: 'uppercase'
  },
  iconContainer: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryCardBody: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: '8px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  summaryCardNumber: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: '-0.02em',
    lineHeight: '1'
  },
  unitText: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#64748B'
  },
  summaryTrend: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  trendBadgeSuccess: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: '4px'
  },
  trendBadgeNeutral: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: '4px'
  },
  trendContext: {
    fontSize: '11.5px',
    color: '#94A3B8'
  },

  /* Sticky Filter Toolbar */
  stickyFilterToolbar: {
    position: 'sticky',
    top: '0',
    zIndex: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    padding: '6px 14px'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: '1 1 280px',
    maxWidth: '400px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '6px 12px',
    height: '34px',
    boxSizing: 'border-box'
  },
  searchIcon: {
    color: '#94A3B8',
    flexShrink: 0
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    fontSize: '13px',
    color: '#0F172A'
  },
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center'
  },
  filterControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  selectWrapper: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center'
  },
  filterSelect: {
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '6px 28px 6px 10px',
    fontSize: '12.5px',
    fontWeight: 500,
    color: '#334155',
    outline: 'none',
    cursor: 'pointer',
    height: '34px'
  },
  selectArrow: {
    position: 'absolute',
    right: '9px',
    pointerEvents: 'none',
    color: '#64748B'
  },
  resetButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: 'none',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#64748B',
    cursor: 'pointer',
    height: '34px',
    backgroundColor: '#F8FAFC'
  },

  /* Enterprise Table Card */
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 18px rgba(15, 23, 42, 0.06)',
    overflow: 'hidden'
  },
  tableWrapper: {
    overflowX: 'auto',
    width: '100%'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px'
  },
  tableHeaderRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0'
  },
  th: {
    padding: '12px 16px',
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap'
  },
  tableRow: {
    borderBottom: '1px solid #F1F5F9',
    transition: 'background-color 0.15s ease'
  },
  td: {
    padding: '13px 16px',
    verticalAlign: 'middle',
    color: '#334155'
  },

  /* 1. Farmer Name Column Styles */
  farmerCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer'
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '12px',
    flexShrink: 0,
    border: '1px solid #DBEAFE'
  },
  farmerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  farmerName: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: '#0F172A',
    lineHeight: '1.3'
  },
  farmerId: {
    fontSize: '11.5px',
    color: '#64748B',
    fontWeight: 500,
    fontFamily: 'monospace'
  },

  /* 2. Location Column Styles */
  locationCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  villageRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  locationPin: {
    color: '#94A3B8',
    flexShrink: 0
  },
  villageText: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1E293B'
  },
  localitySubtext: {
    fontSize: '11.5px',
    color: '#64748B'
  },

  /* 3. Field Agent Column Styles */
  agentCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  agentNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  agentName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0F172A',
    cursor: 'pointer'
  },
  roleBadge: {
    fontSize: '10.5px',
    fontWeight: 500,
    backgroundColor: '#F1F5F9',
    color: '#475569',
    padding: '1px 5px',
    borderRadius: '4px'
  },
  inchargeSubtext: {
    fontSize: '11.5px',
    color: '#64748B',
    cursor: 'pointer'
  },

  /* 4. Region Column Styles */
  regionBadge: {
    display: 'inline-block',
    fontSize: '11.5px',
    fontWeight: 500,
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    border: '1px solid #DBEAFE',
    padding: '3px 9px',
    borderRadius: '9999px',
    whiteSpace: 'nowrap'
  },

  /* 5. Total Acres Column Styles */
  acresCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px'
  },
  acresValue: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0F172A'
  },
  acresUnit: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: 500
  },

  /* 6. Tanks Column Styles */
  tanksCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  tanksHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  tanksBadge: {
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: '#F0FDF4',
    color: '#16A34A',
    border: '1px solid #BBF7D0',
    padding: '2px 7px',
    borderRadius: '6px'
  },
  expandTankBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '4px',
    backgroundColor: '#F1F5F9'
  },
  tanksAvgText: {
    fontSize: '11px',
    color: '#64748B'
  },

  /* 7. Action Buttons Styles */
  actionsCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  viewGrowthBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '7px',
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    border: '1px solid #BFDBFE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  ghostActionBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '7px',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  ghostDeleteBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '7px',
    backgroundColor: '#FFFFFF',
    color: '#DC2626',
    border: '1px solid #FEE2E2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },

  /* Expandable Sub-Row Styles */
  expandedSubRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0'
  },
  expandedTd: {
    padding: '12px 20px'
  },
  expandedContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  expandedHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px'
  },
  expandedTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#0F172A'
  },
  expandedSubtitle: {
    fontSize: '11.5px',
    color: '#64748B'
  },
  tankChipsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  tankDetailChip: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '6px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  },
  tankChipTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    color: '#1E293B'
  },
  tankChipDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#475569'
  },
  dotDivider: {
    color: '#CBD5E1'
  },
  fcrHighlight: {
    color: '#2563EB',
    fontWeight: 600
  },

  /* Empty State Styles */
  emptyStateCell: {
    padding: '48px 24px',
    textAlign: 'center'
  },
  emptyStateContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '380px',
    margin: '0 auto',
    gap: '8px'
  },
  emptyStateIconCircle: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px'
  },
  emptyStateTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0
  },
  emptyStateDescription: {
    fontSize: '13px',
    color: '#64748B',
    lineHeight: '1.5',
    margin: 0
  },
  emptyStateActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '12px'
  },

  /* Modals */
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    backdropFilter: 'blur(2px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '540px',
    maxWidth: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px 16px',
    borderBottom: '1px solid #F1F5F9'
  },
  modalTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0
  },
  modalSubtitle: {
    fontSize: '12.5px',
    color: '#64748B',
    margin: '3px 0 0 0'
  },
  modalCloseButton: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center'
  },
  modalBody: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    maxHeight: '75vh',
    overflowY: 'auto'
  },
  formGrid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  formLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '5px'
  },
  subFormLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 500,
    color: '#64748B',
    marginBottom: '4px'
  },
  formInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box'
  },
  formSelect: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer'
  },
  formAllocationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    padding: '14px'
  },
  allocationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  allocationTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0F172A'
  },
  allocationTotal: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#2563EB'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '16px 24px',
    backgroundColor: '#F8FAFC',
    borderTop: '1px solid #F1F5F9'
  },

  /* Delete Modal Specifics */
  dangerIconBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#FEE2E2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteConfirmText: {
    fontSize: '13.5px',
    color: '#334155',
    lineHeight: '1.5',
    margin: 0
  },
  deleteWarningCard: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '10px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  warningItem: {
    fontSize: '12px',
    color: '#991B1B'
  },
  warningLabel: {
    fontWeight: 600
  },

  /* Toast Notification */
  toastContainer: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.2)',
    zIndex: 9999
  }
};

export default FarmersList;
