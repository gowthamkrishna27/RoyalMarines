import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAgents, getIncharges, getRegions } from '../utils/adminMockData';
import {
  Plus, Search, ArrowLeftRight, UserX, Check, X,
  MapPin, Phone, Mail, ShieldAlert, UserCheck, Shield,
  Users, Building, Compass, Eye, Edit, RotateCcw,
  ChevronDown, CheckCircle2, Tractor, ClipboardList,
  AlertCircle, Clock, Sparkles, Building2, Globe
} from 'lucide-react';

const AgentsList = () => {
  const navigate = useNavigate();
  const regions = getRegions();

  // 1. Load Incharges from localStorage or fallback
  const [incharges, setIncharges] = useState(() => {
    const saved = localStorage.getItem('royal_admin_incharges_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return getIncharges();
      }
    }
    return getIncharges();
  });

  // 2. Load Agents from localStorage or fallback
  const [agents, setAgents] = useState(() => {
    const saved = localStorage.getItem('royal_admin_agents_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return getAgents();
      }
    }
    return getAgents();
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('royal_admin_agents_data', JSON.stringify(agents));
  }, [agents]);

  // Filters and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NAME');
  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState(null);

  // Helper: Find the SINGLE Incharge for a specific Locality (1 Locality = 1 Incharge)
  const getInchargeForLocality = (localityName, regionId) => {
    if (!localityName) return incharges[0];
    const found = incharges.find(inc =>
      inc.locality?.toLowerCase().trim() === localityName.toLowerCase().trim()
    );
    if (found) return found;
    // Fallback by region
    const byRegion = incharges.find(inc => inc.regionId === regionId);
    return byRegion || incharges[0];
  };

  // Helper: Get localities for region
  const getLocalitiesForRegion = (regionId) => {
    const region = regions.find(r => r.id === regionId);
    return region?.localities || [];
  };

  // Helper: Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'AG';
    const cleanName = name.split('(')[0].trim();
    const parts = cleanName.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Default initial locality and incharge
  const defaultRegion = regions[1] || regions[0] || { id: 'REG-COASTAL', name: 'Coastal Andhra' };
  const defaultLocalities = getLocalitiesForRegion(defaultRegion.id);
  const defaultLocalityName = defaultLocalities[0]?.name || 'Nellore';

  // New Agent Form state
  const [newAgent, setNewAgent] = useState({
    name: '',
    roleSuffix: 'Field Agent - Mypadu',
    phone: '+91 ',
    email: '',
    regionId: defaultRegion.id,
    locality: defaultLocalityName,
    assignedArea: 'Mypadu Coastal Area'
  });

  // Edit Agent Form state
  const [editAgentForm, setEditAgentForm] = useState({
    id: '',
    name: '',
    roleSuffix: '',
    phone: '',
    email: '',
    regionId: defaultRegion.id,
    locality: defaultLocalityName,
    assignedArea: '',
    status: 'ACTIVE'
  });

  // Transfer Agent Form state
  const [transferData, setTransferData] = useState({
    regionId: defaultRegion.id,
    locality: defaultLocalityName,
    assignedArea: 'Mypadu Coastal Area',
    reason: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setRegionFilter('ALL');
    setStatusFilter('ALL');
    setSortBy('NAME');
  };

  const hasActiveFilters = searchTerm !== '' || regionFilter !== 'ALL' || statusFilter !== 'ALL' || sortBy !== 'NAME';

  // Filter and sort agents
  const filteredAgents = useMemo(() => {
    return agents.filter(ag => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        ag.name?.toLowerCase().includes(term) ||
        ag.id?.toLowerCase().includes(term) ||
        ag.phone?.includes(term) ||
        ag.email?.toLowerCase().includes(term) ||
        ag.incharge?.toLowerCase().includes(term) ||
        ag.region?.toLowerCase().includes(term) ||
        ag.locality?.toLowerCase().includes(term) ||
        ag.assignedArea?.toLowerCase().includes(term);

      const matchesRegion = regionFilter === 'ALL' || ag.region === regionFilter || ag.region?.includes(regionFilter);
      const matchesStatus = statusFilter === 'ALL' || (ag.status || 'ACTIVE').toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesRegion && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'NAME') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'FARMERS') {
        return (b.farmers || 0) - (a.farmers || 0);
      } else if (sortBy === 'TESTS') {
        return (b.tests || 0) - (a.tests || 0);
      } else if (sortBy === 'DUE') {
        const dueA = a.dueTests !== undefined ? a.dueTests : (a.tanks ? Math.ceil(a.tanks / 2) : 2);
        const dueB = b.dueTests !== undefined ? b.dueTests : (b.tanks ? Math.ceil(b.tanks / 2) : 2);
        return dueB - dueA;
      }
      return 0;
    });
  }, [agents, searchTerm, regionFilter, statusFilter, sortBy]);

  // Summary Metrics calculations
  const totalAgentsCount = agents.length;
  const activeAgentsCount = agents.filter(a => (a.status || 'ACTIVE') === 'ACTIVE').length;
  const totalAssignedFarmers = agents.reduce((acc, a) => acc + (a.farmers || 0), 0);
  const totalTestsCompleted = agents.reduce((acc, a) => acc + (a.tests || 0), 0);
  const totalDueTests = agents.reduce((acc, a) => {
    const due = a.dueTests !== undefined ? a.dueTests : (a.tanks ? Math.ceil(a.tanks / 2) : 2);
    return acc + due;
  }, 0);

  // 1. Handle Add Agent
  const handleAddAgentSubmit = (e) => {
    e.preventDefault();
    if (!newAgent.name.trim() || !newAgent.assignedArea.trim()) return;

    const nextNumber = agents.length + 1;
    const newId = `EMP-AGT-${String(nextNumber).padStart(2, '0')}`;
    const selectedRegionObj = regions.find(r => r.id === newAgent.regionId) || defaultRegion;

    // Strict 1-to-1 Rule: 1 Locality has only 1 Incharge
    const dedicatedIncharge = getInchargeForLocality(newAgent.locality, selectedRegionObj.id);

    const fullName = `${newAgent.name.trim()} (${newAgent.roleSuffix.trim()})`;

    const createdAgent = {
      id: newId,
      name: fullName,
      shortName: newAgent.name.trim(),
      role: newAgent.roleSuffix.trim(),
      inchargeId: dedicatedIncharge.id,
      incharge: dedicatedIncharge.name,
      regionId: selectedRegionObj.id,
      region: selectedRegionObj.name,
      locality: newAgent.locality,
      assignedArea: newAgent.assignedArea.trim(),
      phone: newAgent.phone.trim(),
      email: newAgent.email.trim() || `${newAgent.name.trim().toLowerCase().replace(/\s+/g, '')}.agt@royalsmarine.com`,
      farmers: 1,
      tanks: 2,
      siteVisits: 0,
      tests: 12,
      compliance: 90.0,
      status: 'ACTIVE'
    };

    setAgents(prev => [createdAgent, ...prev]);
    showToast(`Field Agent ${createdAgent.name} assigned under ${dedicatedIncharge.name} for ${createdAgent.assignedArea}!`);
    setShowAddModal(false);

    setNewAgent({
      name: '',
      roleSuffix: 'Field Agent - Mypadu',
      phone: '+91 ',
      email: '',
      regionId: defaultRegion.id,
      locality: defaultLocalityName,
      assignedArea: 'Mypadu Coastal Area'
    });
  };

  // 2. Open Edit Agent Modal
  const openEditModal = (ag, e) => {
    if (e) e.stopPropagation();
    setSelectedAgent(ag);
    const regObj = regions.find(r => r.id === ag.regionId || r.name === ag.region) || defaultRegion;

    setEditAgentForm({
      id: ag.id,
      name: ag.shortName || ag.name.split('(')[0].trim(),
      roleSuffix: ag.role || ag.name.split('(')[1]?.replace(')', '')?.trim() || 'Field Agent',
      phone: ag.phone || '',
      email: ag.email || '',
      regionId: regObj.id,
      locality: ag.locality || defaultLocalityName,
      assignedArea: ag.assignedArea || 'Designated Area',
      status: ag.status || 'ACTIVE'
    });
    setShowEditModal(true);
  };

  // Handle Edit Agent Submit
  const handleEditAgentSubmit = (e) => {
    e.preventDefault();
    if (!editAgentForm.name.trim() || !selectedAgent) return;

    const selectedRegionObj = regions.find(r => r.id === editAgentForm.regionId) || defaultRegion;
    const dedicatedIncharge = getInchargeForLocality(editAgentForm.locality, selectedRegionObj.id);
    const fullName = `${editAgentForm.name.trim()} (${editAgentForm.roleSuffix.trim()})`;

    const updatedAgent = {
      ...selectedAgent,
      name: fullName,
      shortName: editAgentForm.name.trim(),
      role: editAgentForm.roleSuffix.trim(),
      phone: editAgentForm.phone.trim(),
      email: editAgentForm.email.trim(),
      regionId: selectedRegionObj.id,
      region: selectedRegionObj.name,
      locality: editAgentForm.locality,
      assignedArea: editAgentForm.assignedArea.trim(),
      inchargeId: dedicatedIncharge.id,
      incharge: dedicatedIncharge.name,
      status: editAgentForm.status
    };

    setAgents(prev => prev.map(a => a.id === selectedAgent.id ? updatedAgent : a));

    // Also update agent references in saved farmers
    const savedFarmers = localStorage.getItem('royal_admin_farmers_data');
    if (savedFarmers) {
      try {
        const parsed = JSON.parse(savedFarmers);
        const updatedFarmers = parsed.map(f => {
          if (f.agentId === selectedAgent.id) {
            return {
              ...f,
              agent: updatedAgent.name,
              incharge: dedicatedIncharge.name,
              locality: updatedAgent.locality,
              region: updatedAgent.region
            };
          }
          return f;
        });
        localStorage.setItem('royal_admin_farmers_data', JSON.stringify(updatedFarmers));
      } catch (err) { }
    }

    showToast(`Agent ${updatedAgent.name} updated successfully!`);
    setShowEditModal(false);
  };

  // 3. Handle Transfer
  const openTransferModal = (ag, e) => {
    if (e) e.stopPropagation();
    setSelectedAgent(ag);
    const targetRegion = regions.find(r => r.id !== ag.regionId) || regions[0];
    const targetLoc = targetRegion.localities?.[0]?.name || '';

    setTransferData({
      regionId: targetRegion.id,
      locality: targetLoc,
      assignedArea: ag.assignedArea || 'Designated Area',
      reason: ''
    });
    setShowTransferModal(true);
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!selectedAgent) return;

    const selectedRegionObj = regions.find(r => r.id === transferData.regionId) || defaultRegion;
    const dedicatedIncharge = getInchargeForLocality(transferData.locality, selectedRegionObj.id);

    setAgents(prev => prev.map(ag => {
      if (ag.id === selectedAgent.id) {
        return {
          ...ag,
          regionId: selectedRegionObj.id,
          region: selectedRegionObj.name,
          locality: transferData.locality,
          assignedArea: transferData.assignedArea.trim(),
          inchargeId: dedicatedIncharge.id,
          incharge: dedicatedIncharge.name
        };
      }
      return ag;
    }));

    showToast(`Transferred ${selectedAgent.shortName || selectedAgent.name} under ${dedicatedIncharge.name} (${transferData.assignedArea})`);
    setShowTransferModal(false);
    setSelectedAgent(null);
  };

  // 4. Handle Deactivate / Reactivate
  const openDeactivateModal = (ag, e) => {
    if (e) e.stopPropagation();
    setSelectedAgent(ag);
    setShowDeactivateModal(true);
  };

  const handleToggleStatus = () => {
    if (!selectedAgent) return;

    const newStatus = selectedAgent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setAgents(prev => prev.map(ag => {
      if (ag.id === selectedAgent.id) {
        return { ...ag, status: newStatus };
      }
      return ag;
    }));

    showToast(`${selectedAgent.name} marked as ${newStatus}`);
    setShowDeactivateModal(false);
    setSelectedAgent(null);
  };

  // Active incharge lookup for current modal selections
  const currentModalIncharge = getInchargeForLocality(newAgent.locality, newAgent.regionId);
  const editModalIncharge = getInchargeForLocality(editAgentForm.locality, editAgentForm.regionId);
  const transferModalIncharge = getInchargeForLocality(transferData.locality, transferData.regionId);

  return (
    <div style={styles.pageContainer}>
      {/* ────────────────────────────────────────────────
          1. COMPACT PAGE HEADER
          ──────────────────────────────────────────────── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.titleRow}>
            <h1 style={styles.pageTitle}>Agents Management</h1>
          </div>
        </div>

        <div style={styles.headerRight}>
          <button
            style={styles.primaryButton}
            onClick={() => setShowAddModal(true)}
            aria-label="Add new Field Agent"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Agent</span>
          </button>
        </div>
      </header>

      {/* ────────────────────────────────────────────────
          2. SUMMARY KPI CARDS (Horizontal Row, 16px Radius)
          ──────────────────────────────────────────────── */}
      <section style={styles.summaryGrid} aria-label="Field Operations Summary">
        {/* Total Field Agents Card */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTop}>
            <span style={styles.summaryCardLabel}>FIELD AGENTS</span>
            <div style={{ ...styles.iconContainer, backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <Users size={18} strokeWidth={2} />
            </div>
          </div>
          <div style={styles.summaryCardBody}>
            <div style={styles.summaryCardNumber}>{totalAgentsCount}</div>
            <div style={styles.summaryTrend}>
              <span style={styles.trendBadgeSuccess}>{activeAgentsCount} Active</span>
              <span style={styles.trendContext}>on field</span>
            </div>
          </div>
        </div>

        {/* Assigned Farmers Card */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTop}>
            <span style={styles.summaryCardLabel}>ASSIGNED FARMERS</span>
            <div style={{ ...styles.iconContainer, backgroundColor: '#F0FDF4', color: '#16A34A' }}>
              <Tractor size={18} strokeWidth={2} />
            </div>
          </div>
          <div style={styles.summaryCardBody}>
            <div style={{ ...styles.summaryCardNumber, color: '#16A34A' }}>
              {totalAssignedFarmers}
            </div>
            <div style={styles.summaryTrend}>
              <span style={styles.trendBadgeNeutral}>Cultivators</span>
              <span style={styles.trendContext}>supervised</span>
            </div>
          </div>
        </div>

        {/* Total Tests Completed Card */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTop}>
            <span style={styles.summaryCardLabel}>TESTS COMPLETED</span>
            <div style={{ ...styles.iconContainer, backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <ClipboardList size={18} strokeWidth={2} />
            </div>
          </div>
          <div style={styles.summaryCardBody}>
            <div style={{ ...styles.summaryCardNumber, color: '#2563EB' }}>
              {totalTestsCompleted} <span style={styles.unitText}>Tests</span>
            </div>
            <div style={styles.summaryTrend}>
              <span style={styles.trendBadgeNeutral}>Water / Soil</span>
              <span style={styles.trendContext}>verified</span>
            </div>
          </div>
        </div>

        {/* Due Tests Card */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTop}>
            <span style={styles.summaryCardLabel}>TESTS DUE</span>
            <div style={{ ...styles.iconContainer, backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <Clock size={18} strokeWidth={2} />
            </div>
          </div>
          <div style={styles.summaryCardBody}>
            <div style={{ ...styles.summaryCardNumber, color: '#D97706' }}>
              {totalDueTests} <span style={styles.unitText}>Pending</span>
            </div>
            <div style={styles.summaryTrend}>
              <span style={styles.trendBadgeWarning}>Action Required</span>
              <span style={styles.trendContext}>this cycle</span>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────
          3. UNIFIED STICKY FILTER TOOLBAR (44px Height, 12px Radius)
          ──────────────────────────────────────────────── */}
      <div style={styles.stickyFilterToolbar}>
        {/* Search Input */}
        <div style={styles.searchBox}>
          <Search size={15} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search agent, locality, area, incharge..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
            aria-label="Search field agents"
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

        {/* Filter Selects & Sort Controls */}
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

          {/* Status Select */}
          <div style={styles.selectWrapper}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.filterSelect}
              aria-label="Filter by status"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <ChevronDown size={14} style={styles.selectArrow} />
          </div>

          {/* Sort Select */}
          <div style={styles.selectWrapper}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.filterSelect}
              aria-label="Sort agents"
            >
              <option value="NAME">Sort: Name (A-Z)</option>
              <option value="FARMERS">Sort: Farmers (High-Low)</option>
              <option value="TESTS">Sort: Tests (High-Low)</option>
              <option value="DUE">Sort: Due Tests</option>
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
          4. AGENTS TABLE (16px Radius White Card)
          ──────────────────────────────────────────────── */}
      <div style={styles.tableCard}>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={{ ...styles.th, width: '20%' }}>AGENT NAME</th>
                <th style={{ ...styles.th, width: '17%' }}>CONTACT</th>
                <th style={{ ...styles.th, width: '16%' }}>LOCATION &amp; ASM</th>
                <th style={{ ...styles.th, width: '10%' }}>REGION</th>
                <th style={{ ...styles.th, width: '8%', textAlign: 'center' }}>FARMERS</th>
                <th style={{ ...styles.th, width: '8%', textAlign: 'center' }}>TESTS</th>
                <th style={{ ...styles.th, width: '8%', textAlign: 'center' }}>DUE TESTS</th>
                <th style={{ ...styles.th, width: '7%', textAlign: 'center' }}>STATUS</th>
                <th style={{ ...styles.th, width: '12%', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.length > 0 ? (
                filteredAgents.map((ag, index) => {
                  const activeInc = getInchargeForLocality(ag.locality, ag.regionId);
                  const isAlternate = index % 2 === 1;
                  const isActive = (ag.status || 'ACTIVE') === 'ACTIVE';
                  const dueCount = ag.dueTests !== undefined ? ag.dueTests : (ag.tanks ? Math.ceil(ag.tanks / 2) : 2);

                  return (
                    <tr
                      key={ag.id}
                      style={{
                        ...styles.tableRow,
                        backgroundColor: isAlternate ? '#FAFCFF' : '#FFFFFF'
                      }}
                    >
                      {/* 1. Agent Name Column */}
                      <td style={styles.td}>
                        <div
                          style={styles.agentCell}
                          onClick={() => navigate(`/admin/agents/${ag.id}`)}
                          title="Click to view full Agent Profile & Performance"
                        >
                          <span style={styles.agentName}>{ag.name}</span>
                        </div>
                      </td>

                      {/* 2. Contact Column */}
                      <td style={styles.td}>
                        <div style={styles.contactCell}>
                          <div style={styles.contactItem}>
                            <Phone size={12} style={styles.contactIcon} />
                            <span style={styles.contactPhone}>{ag.phone}</span>
                          </div>
                          <div style={styles.contactItem}>
                            <Mail size={12} style={styles.contactIcon} />
                            <span style={styles.contactEmail}>{ag.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Location Column (Village/Area & Assigned ASM) */}
                      <td style={styles.td}>
                        <div style={styles.locationCell}>
                          <div style={styles.villageRow}>
                            <MapPin size={12} style={styles.locationIcon} />
                            <span style={styles.villageText}>
                              {ag.assignedArea || `${ag.locality} Sub-Sector`}
                            </span>
                          </div>
                          <div
                            style={styles.inchargeLink}
                            onClick={() => navigate('/admin/incharges')}
                            title="Click to view Incharge details"
                          >
                            <Building2 size={11} color="#2563EB" />
                            <span>ASM: {activeInc?.shortName || activeInc?.name?.split('(')[0]?.trim() || ag.incharge}</span>
                          </div>
                        </div>
                      </td>

                      {/* 4. Region Column */}
                      <td style={styles.td}>
                        <span style={styles.regionBadge}>
                          {ag.locality || ag.region || 'Coastal'}
                        </span>
                      </td>

                      {/* 5. Farmers Column */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <div style={styles.metricCell}>
                          <span style={styles.farmersNumber}>{ag.farmers}</span>
                          <span style={styles.metricCaption}>Farmers</span>
                        </div>
                      </td>

                      {/* 6. Tests Column (Clickable to field data) */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <button
                          type="button"
                          style={styles.testsLinkButton}
                          onClick={() => navigate('/admin/field-data', { state: { searchTerm: ag.id } })}
                          title={`View test records for ${ag.shortName || ag.name}`}
                        >
                          <span style={styles.testsNumber}>{ag.tests || 0}</span>
                          <span style={styles.testsCaption}>Tests</span>
                        </button>
                      </td>

                      {/* 7. Due Tests Column (Amber Warning Badge) */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={styles.dueBadge}>
                          {dueCount} Due
                        </span>
                      </td>

                      {/* 8. Status Column */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={{
                          ...styles.statusPill,
                          backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2',
                          color: isActive ? '#15803D' : '#DC2626',
                          borderColor: isActive ? '#BBF7D0' : '#FECACA'
                        }}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* 9. Actions Column */}
                      <td style={styles.td}>
                        <div style={styles.actionsGroup}>
                          {/* 1. View */}
                          <button
                            style={styles.actionBlueBtn}
                            onClick={() => navigate(`/admin/agents/${ag.id}`)}
                            title="View Full Agent Profile & Allocated Farmers"
                            aria-label="View Agent"
                          >
                            <Eye size={14} strokeWidth={2} />
                            <span>View</span>
                          </button>

                          {/* 2. Edit */}
                          <button
                            style={styles.actionGhostBtn}
                            onClick={(e) => openEditModal(ag, e)}
                            title="Edit Agent Details & Area"
                            aria-label="Edit Agent"
                          >
                            <Edit size={14} strokeWidth={2} />
                            <span>Edit</span>
                          </button>

                          {/* 3. Transfer */}
                          <button
                            style={styles.actionGhostBtn}
                            onClick={(e) => openTransferModal(ag, e)}
                            title="Transfer Agent to another Locality or Area"
                            aria-label="Transfer Agent"
                          >
                            <ArrowLeftRight size={14} strokeWidth={2} />
                            <span>Transfer</span>
                          </button>

                          {/* 4. Deactivate / Reactivate */}
                          <button
                            style={{
                              ...styles.actionDangerBtn,
                              color: isActive ? '#DC2626' : '#16A34A',
                              backgroundColor: isActive ? '#FFFFFF' : '#F0FDF4',
                              borderColor: isActive ? '#FEE2E2' : '#BBF7D0'
                            }}
                            onClick={(e) => openDeactivateModal(ag, e)}
                            title={isActive ? 'Deactivate Field Agent' : 'Reactivate Field Agent'}
                            aria-label={isActive ? 'Deactivate' : 'Reactivate'}
                          >
                            <UserX size={14} strokeWidth={2} />
                            <span>{isActive ? 'Deactivate' : 'Reactivate'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* ────────────────────────────────────────────────
                   PREMIUM EMPTY STATE
                   ──────────────────────────────────────────────── */
                <tr>
                  <td colSpan={9} style={styles.emptyStateCell}>
                    <div style={styles.emptyStateContainer}>
                      <div style={styles.emptyStateIconCircle}>
                        <UserCheck size={32} strokeWidth={1.5} color="#64748B" />
                      </div>
                      <h3 style={styles.emptyStateTitle}>No Agents Found</h3>
                      <p style={styles.emptyStateDescription}>
                        {hasActiveFilters
                          ? 'No field agents match your current filter criteria. Try resetting your search or filters.'
                          : 'No field agent records have been added to the system yet.'}
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
                          <span>Add Agent</span>
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
          MODAL 1: EDIT AGENT DETAILS
          ──────────────────────────────────────────────── */}
      {showEditModal && selectedAgent && (
        <div style={styles.modalBackdrop} onClick={() => setShowEditModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.modalIconBlue}>
                  <Edit size={18} color="#2563EB" />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>Edit Agent Profile</h3>
                  <p style={styles.modalSubtitle}>Agent ID: {selectedAgent.id}</p>
                </div>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowEditModal(false)}
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditAgentSubmit}>
              <div style={styles.modalBody}>
                {/* Full Name & Designation */}
                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Agent Full Name <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="text"
                      value={editAgentForm.name}
                      onChange={(e) => setEditAgentForm({ ...editAgentForm, name: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Role / Designation Suffix</label>
                    <input
                      type="text"
                      value={editAgentForm.roleSuffix}
                      onChange={(e) => setEditAgentForm({ ...editAgentForm, roleSuffix: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                </div>

                {/* Contact Phone & Email */}
                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Contact Phone <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="text"
                      value={editAgentForm.phone}
                      onChange={(e) => setEditAgentForm({ ...editAgentForm, phone: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Corporate Email</label>
                    <input
                      type="email"
                      value={editAgentForm.email}
                      onChange={(e) => setEditAgentForm({ ...editAgentForm, email: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                </div>

                {/* Region & Locality */}
                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Operating Region *</label>
                    <select
                      style={styles.formSelect}
                      value={editAgentForm.regionId}
                      onChange={(e) => {
                        const regId = e.target.value;
                        const locs = getLocalitiesForRegion(regId);
                        setEditAgentForm({
                          ...editAgentForm,
                          regionId: regId,
                          locality: locs[0]?.name || ''
                        });
                      }}
                    >
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={styles.formLabel}>Assigned Locality *</label>
                    <select
                      style={styles.formSelect}
                      value={editAgentForm.locality}
                      onChange={(e) => setEditAgentForm({ ...editAgentForm, locality: e.target.value })}
                    >
                      {getLocalitiesForRegion(editAgentForm.regionId).map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Auto Dedicated Incharge */}
                <div>
                  <label style={styles.formLabel}>
                    Reporting Incharge (Head for {editAgentForm.locality})
                  </label>
                  <div style={styles.autoInchargeCard}>
                    <Building2 size={16} color="#2563EB" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                        {editModalIncharge?.name || 'Regional Incharge'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        Dedicated Incharge for {editAgentForm.locality}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned Particular Area & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={styles.formLabel}>Assigned Particular Area / Zone <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="text"
                      value={editAgentForm.assignedArea}
                      onChange={(e) => setEditAgentForm({ ...editAgentForm, assignedArea: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>

                  <div>
                    <label style={styles.formLabel}>Status</label>
                    <select
                      style={styles.formSelect}
                      value={editAgentForm.status}
                      onChange={(e) => setEditAgentForm({ ...editAgentForm, status: e.target.value })}
                    >
                      <option value="ACTIVE">ACTIVE (In Service)</option>
                      <option value="INACTIVE">INACTIVE (Suspended)</option>
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
                  Save Agent Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────
          MODAL 2: ADD NEW FIELD AGENT
          ──────────────────────────────────────────────── */}
      {showAddModal && (
        <div style={styles.modalBackdrop} onClick={() => setShowAddModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.modalIconBlue}>
                  <UserCheck size={18} color="#2563EB" />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>Add Field Agent</h3>
                  <p style={styles.modalSubtitle}>Assign agent to an operational area under regional incharge</p>
                </div>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowAddModal(false)}
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAgentSubmit}>
              <div style={styles.modalBody}>
                {/* Agent Name & Role */}
                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Agent Full Name <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. K. Mahesh"
                      value={newAgent.name}
                      onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>

                  <div>
                    <label style={styles.formLabel}>Role / Designation Suffix <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Field Agent - Mypadu"
                      value={newAgent.roleSuffix}
                      onChange={(e) => setNewAgent({ ...newAgent, roleSuffix: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                </div>

                {/* Contact: Phone & Email */}
                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Phone Number <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="text"
                      placeholder="+91 9876543216"
                      value={newAgent.phone}
                      onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Corporate Email</label>
                    <input
                      type="email"
                      placeholder="mahesh.agt@royalsmarine.com"
                      value={newAgent.email}
                      onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                </div>

                {/* Region & Locality */}
                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Operating Region <span style={{ color: '#DC2626' }}>*</span></label>
                    <select
                      style={styles.formSelect}
                      value={newAgent.regionId}
                      onChange={(e) => {
                        const regId = e.target.value;
                        const locs = getLocalitiesForRegion(regId);
                        const firstLoc = locs[0]?.name || '';
                        setNewAgent({
                          ...newAgent,
                          regionId: regId,
                          locality: firstLoc
                        });
                      }}
                    >
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={styles.formLabel}>Assigned Locality <span style={{ color: '#DC2626' }}>*</span></label>
                    <select
                      style={styles.formSelect}
                      value={newAgent.locality}
                      onChange={(e) => setNewAgent({ ...newAgent, locality: e.target.value })}
                    >
                      {getLocalitiesForRegion(newAgent.regionId).map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dedicated Incharge for this Locality */}
                <div>
                  <label style={styles.formLabel}>
                    Reporting Incharge (Dedicated Head for {newAgent.locality})
                  </label>
                  <div style={styles.autoInchargeCard}>
                    <Building2 size={16} color="#2563EB" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                        {currentModalIncharge?.name || 'Assigned Regional Incharge'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        Sole Incharge in charge of {newAgent.locality}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Particular Area Assignment */}
                <div>
                  <label style={styles.formLabel}>Assigned Particular Area / Zone <span style={{ color: '#DC2626' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Mypadu Coastal Area, Allur Shrimp Belt"
                    value={newAgent.assignedArea}
                    onChange={(e) => setNewAgent({ ...newAgent, assignedArea: e.target.value })}
                    style={styles.formInput}
                    required
                  />
                  <span style={{ fontSize: '11px', color: '#64748B', marginTop: '3px', display: 'block' }}>
                    Specific village or tank cluster assigned to this agent under the incharge
                  </span>
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
                  Create Field Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────
          MODAL 3: TRANSFER AGENT
          ──────────────────────────────────────────────── */}
      {showTransferModal && selectedAgent && (
        <div style={styles.modalBackdrop} onClick={() => setShowTransferModal(false)}>
          <div style={{ ...styles.modalContent, width: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.modalIconBlue}>
                  <ArrowLeftRight size={18} color="#2563EB" />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>Transfer Agent</h3>
                  <p style={styles.modalSubtitle}>{selectedAgent.name}</p>
                </div>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowTransferModal(false)}
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit}>
              <div style={styles.modalBody}>
                {/* Current assignment display */}
                <div style={styles.transferCurrentCard}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Current Assignment:</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>
                    {selectedAgent.region} • {selectedAgent.locality} ({selectedAgent.assignedArea || 'General Area'})
                  </div>
                </div>

                {/* Destination Region */}
                <div>
                  <label style={styles.formLabel}>New Destination Region <span style={{ color: '#DC2626' }}>*</span></label>
                  <select
                    style={styles.formSelect}
                    value={transferData.regionId}
                    onChange={(e) => {
                      const regId = e.target.value;
                      const locs = getLocalitiesForRegion(regId);
                      setTransferData({
                        ...transferData,
                        regionId: regId,
                        locality: locs[0]?.name || ''
                      });
                    }}
                  >
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Destination Locality */}
                <div>
                  <label style={styles.formLabel}>New Destination Locality <span style={{ color: '#DC2626' }}>*</span></label>
                  <select
                    style={styles.formSelect}
                    value={transferData.locality}
                    onChange={(e) => setTransferData({ ...transferData, locality: e.target.value })}
                  >
                    {regions.find(r => r.id === transferData.regionId)?.localities?.map(loc => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                {/* Auto Assigned Incharge */}
                <div>
                  <label style={styles.formLabel}>New Reporting Incharge (Sole Locality Head)</label>
                  <div style={styles.autoInchargeCard}>
                    <Building2 size={16} color="#2563EB" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                        {transferModalIncharge?.name || 'Regional Incharge'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        Incharge for {transferData.locality}
                      </div>
                    </div>
                  </div>
                </div>

                {/* New Area */}
                <div>
                  <label style={styles.formLabel}>New Assigned Particular Area / Zone <span style={{ color: '#DC2626' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Mypadu Coastal Area, Allur Delta"
                    value={transferData.assignedArea}
                    onChange={(e) => setTransferData({ ...transferData, assignedArea: e.target.value })}
                    style={styles.formInput}
                    required
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  style={styles.secondaryButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.primaryButton}
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────
          MODAL 4: DEACTIVATE CONFIRMATION
          ──────────────────────────────────────────────── */}
      {showDeactivateModal && selectedAgent && (
        <div style={styles.modalBackdrop} onClick={() => setShowDeactivateModal(false)}>
          <div style={{ ...styles.modalContent, width: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  ...styles.modalIconCircle,
                  backgroundColor: selectedAgent.status === 'ACTIVE' ? '#FEE2E2' : '#DCFCE7'
                }}>
                  <ShieldAlert
                    size={20}
                    color={selectedAgent.status === 'ACTIVE' ? '#DC2626' : '#16A34A'}
                  />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>
                    {selectedAgent.status === 'ACTIVE' ? 'Deactivate Field Agent' : 'Reactivate Field Agent'}
                  </h3>
                  <p style={styles.modalSubtitle}>Field operations access status</p>
                </div>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowDeactivateModal(false)}
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <p style={styles.deleteConfirmText}>
                {selectedAgent.status === 'ACTIVE' ? (
                  <>Are you sure you want to deactivate <strong>{selectedAgent.name}</strong> ({selectedAgent.id})? Their sampling portal access will be temporarily suspended.</>
                ) : (
                  <>Reactivate <strong>{selectedAgent.name}</strong> ({selectedAgent.id}) and restore field testing access?</>
                )}
              </p>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                style={styles.secondaryButton}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                style={{
                  ...styles.primaryButton,
                  backgroundColor: selectedAgent.status === 'ACTIVE' ? '#DC2626' : '#16A34A'
                }}
              >
                {selectedAgent.status === 'ACTIVE' ? 'Confirm Deactivate' : 'Confirm Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────
          TOAST NOTIFICATION
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

  /* Summary Cards */
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
    fontSize: '13px',
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
  trendBadgeWarning: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
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
    maxWidth: '380px',
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

  /* Table Card */
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

  /* 1. Agent Details Column */
  agentCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer'
  },
  avatar: {
    width: '36px',
    height: '36px',
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
  agentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  agentName: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: '#0F172A',
    lineHeight: '1.3'
  },
  idRoleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  employeeId: {
    fontSize: '11.5px',
    color: '#64748B',
    fontWeight: 500,
    fontFamily: 'monospace'
  },
  roleTag: {
    fontSize: '10px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    padding: '1px 5px',
    borderRadius: '4px',
    fontWeight: 500
  },

  /* 2. Contact Column */
  contactCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  contactIcon: {
    color: '#94A3B8',
    flexShrink: 0
  },
  contactPhone: {
    fontSize: '12.5px',
    fontWeight: 500,
    color: '#0F172A'
  },
  contactEmail: {
    fontSize: '11.5px',
    color: '#64748B'
  },

  /* 3. Location Column */
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
  locationIcon: {
    color: '#94A3B8',
    flexShrink: 0
  },
  villageText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0F172A'
  },
  inchargeLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11.5px',
    color: '#2563EB',
    fontWeight: 500,
    cursor: 'pointer'
  },

  /* 4. Region Column */
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

  /* 5. Farmers & Metric Columns */
  metricCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1px'
  },
  farmersNumber: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#16A34A'
  },
  metricCaption: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: 500
  },

  /* 6. Tests Link Button */
  testsLinkButton: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0
  },
  testsNumber: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#2563EB',
    textDecoration: 'underline'
  },
  testsCaption: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: 500
  },

  /* 7. Due Tests Badge */
  dueBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    border: '1px solid #FDE68A',
    padding: '3px 8px',
    borderRadius: '9999px'
  },

  /* 8. Status Column */
  statusPill: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: '9999px',
    border: '1px solid',
    letterSpacing: '0.02em',
    lineHeight: '1.2'
  },

  /* 9. Action Buttons */
  actionsGroup: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    flexWrap: 'wrap'
  },
  actionBlueBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    border: '1px solid #BFDBFE',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11.5px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  actionGhostBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#FFFFFF',
    color: '#334155',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11.5px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  actionDangerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    borderRadius: '6px',
    border: '1px solid',
    padding: '5px 10px',
    fontSize: '11.5px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },

  /* Empty State */
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
  modalIconBlue: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalIconCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
  autoInchargeCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: '8px',
    padding: '10px 12px'
  },
  transferCurrentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    padding: '10px 14px'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '16px 24px',
    backgroundColor: '#F8FAFC',
    borderTop: '1px solid #F1F5F9'
  },

  /* Deactivate Modal Specifics */
  deleteConfirmText: {
    fontSize: '13.5px',
    color: '#334155',
    lineHeight: '1.5',
    margin: 0
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

export default AgentsList;
