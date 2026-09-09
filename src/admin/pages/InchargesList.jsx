import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIncharges, getRegions, getAgents, getFarmers } from '../utils/adminMockData';
import {
  Plus, Search, ArrowLeftRight, UserX, Check, X,
  MapPin, Phone, Mail, ShieldAlert, UserCheck, Edit,
  Users, UserPlus, UserMinus, Shield, CheckCircle2, Tractor,
  Briefcase, Eye, RotateCcw, ChevronDown, Sparkles, Building2, Globe
} from 'lucide-react';

const InchargesList = () => {
  const navigate = useNavigate();
  const regions = getRegions();

  // 1. Load Incharges from localStorage or fallback mock data
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

  // 2. Load Agents from localStorage or fallback mock data
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

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('royal_admin_incharges_data', JSON.stringify(incharges));
  }, [incharges]);

  useEffect(() => {
    localStorage.setItem('royal_admin_agents_data', JSON.stringify(agents));
  }, [agents]);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showAssignAgentModal, setShowAssignAgentModal] = useState(false);

  const [selectedIncharge, setSelectedIncharge] = useState(null);
  const [selectedAgentToAssign, setSelectedAgentToAssign] = useState('');

  const defaultReg = regions[1] || regions[0] || { id: 'REG-COASTAL', name: 'Coastal Andhra' };
  const defaultLoc = defaultReg.localities?.[0]?.name || 'Nellore';

  // New Incharge Form
  const [newIncharge, setNewIncharge] = useState({
    name: '',
    roleSuffix: 'Incharge - Nellore',
    phone: '+91 ',
    email: '',
    regionId: defaultReg.id,
    locality: defaultLoc
  });

  // Edit Incharge Form
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    shortName: '',
    role: '',
    phone: '',
    email: '',
    regionId: '',
    locality: '',
    status: 'ACTIVE'
  });

  // Transfer Form
  const [transferData, setTransferData] = useState({
    regionId: defaultReg.id,
    locality: defaultLoc,
    reason: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Helper: Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'AS';
    const cleanName = name.split('(')[0].trim();
    const parts = cleanName.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Filter incharges based on search term, region, and status
  const filteredIncharges = useMemo(() => {
    return incharges.map(inc => {
      // Dynamic recalculation of agents assigned to this incharge
      const assignedAgentsList = agents.filter(a => a.inchargeId === inc.id || a.incharge?.includes(inc.shortName || inc.name.split(' ')[0]));
      const totalFarmersUnderIncharge = assignedAgentsList.reduce((acc, a) => acc + (a.farmers || 0), 0);
      return {
        ...inc,
        agents: assignedAgentsList.length,
        farmers: totalFarmersUnderIncharge > 0 ? totalFarmersUnderIncharge : inc.farmers
      };
    }).filter(inc => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        inc.name?.toLowerCase().includes(term) ||
        inc.id?.toLowerCase().includes(term) ||
        inc.phone?.includes(term) ||
        inc.email?.toLowerCase().includes(term) ||
        inc.region?.toLowerCase().includes(term) ||
        inc.locality?.toLowerCase().includes(term);

      const matchesRegion = regionFilter === 'ALL' || inc.region === regionFilter || inc.region?.includes(regionFilter);
      const matchesStatus = statusFilter === 'ALL' || (inc.status || 'ACTIVE').toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [incharges, agents, searchTerm, regionFilter, statusFilter]);

  // Helper: Get active agents reporting to an incharge
  const getAssignedAgents = (incharge) => {
    if (!incharge) return [];
    return agents.filter(a => a.inchargeId === incharge.id || a.incharge?.includes(incharge.shortName || incharge.name.split(' ')[0]));
  };

  // Helper: Get agents available to assign (not already under this incharge)
  const getAvailableAgentsForAssignment = (incharge) => {
    if (!incharge) return [];
    return agents.filter(a => a.inchargeId !== incharge.id && !a.incharge?.includes(incharge.shortName || incharge.name.split(' ')[0]));
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setRegionFilter('ALL');
    setStatusFilter('ALL');
  };

  const hasActiveFilters = searchTerm !== '' || regionFilter !== 'ALL' || statusFilter !== 'ALL';

  // Summary Metrics calculations
  const totalASMsCount = incharges.length;
  const activeASMsCount = incharges.filter(i => (i.status || 'ACTIVE') === 'ACTIVE').length;
  const totalAgentsSupervised = agents.filter(a => a.inchargeId || a.incharge).length;
  const totalFarmersScopeCovered = filteredIncharges.reduce((acc, i) => acc + (i.farmers || 0), 0);

  // 1. Handle Add Incharge
  const handleAddInchargeSubmit = (e) => {
    e.preventDefault();
    if (!newIncharge.name.trim()) return;

    const nextNumber = incharges.length + 1;
    const newId = `EMP-INC-${String(nextNumber).padStart(2, '0')}`;
    const selectedRegionObj = regions.find(r => r.id === newIncharge.regionId) || regions[0];
    const fullName = `${newIncharge.name.trim()} (${newIncharge.roleSuffix.trim()})`;

    const createdIncharge = {
      id: newId,
      name: fullName,
      shortName: newIncharge.name.trim(),
      role: newIncharge.roleSuffix.trim(),
      regionId: selectedRegionObj.id,
      region: selectedRegionObj.name,
      locality: newIncharge.locality,
      phone: newIncharge.phone.trim(),
      email: newIncharge.email.trim() || `${newIncharge.name.trim().toLowerCase().replace(/\s+/g, '')}.inc@royalsmarine.com`,
      agents: 0,
      farmers: 0,
      tanks: 0,
      compliance: 95,
      status: 'ACTIVE'
    };

    setIncharges(prev => [createdIncharge, ...prev]);
    showToast(`Incharge ${createdIncharge.name} added successfully!`);
    setShowAddModal(false);
    setNewIncharge({
      name: '',
      roleSuffix: 'Incharge - Nellore',
      phone: '+91 ',
      email: '',
      regionId: defaultReg.id,
      locality: defaultLoc
    });
  };

  // 2. Open Edit Incharge Modal
  const openEditModal = (inc, e) => {
    if (e) e.stopPropagation();
    setSelectedIncharge(inc);
    setEditForm({
      id: inc.id,
      name: inc.name,
      shortName: inc.shortName || inc.name.split('(')[0].trim(),
      role: inc.role || 'Incharge',
      phone: inc.phone,
      email: inc.email,
      regionId: inc.regionId || 'REG-SOUTH',
      locality: inc.locality,
      status: inc.status || 'ACTIVE'
    });
    setShowEditModal(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return;

    const selectedRegionObj = regions.find(r => r.id === editForm.regionId) || regions[0];

    const updatedIncharge = {
      ...selectedIncharge,
      name: editForm.name.trim(),
      shortName: editForm.shortName.trim(),
      role: editForm.role.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
      regionId: selectedRegionObj.id,
      region: selectedRegionObj.name,
      locality: editForm.locality,
      status: editForm.status
    };

    setIncharges(prev => prev.map(item => item.id === selectedIncharge.id ? updatedIncharge : item));

    // Update incharge name references in assigned agents
    setAgents(prev => prev.map(a => {
      if (a.inchargeId === selectedIncharge.id) {
        return { ...a, incharge: updatedIncharge.name };
      }
      return a;
    }));

    showToast(`Incharge details for ${updatedIncharge.name} updated successfully!`);
    setShowEditModal(false);
  };

  // 3. Open Team / Assign Agents Modal
  const openTeamModal = (inc, e) => {
    if (e) e.stopPropagation();
    setSelectedIncharge(inc);
    const unassigned = getAvailableAgentsForAssignment(inc);
    setSelectedAgentToAssign(unassigned[0]?.id || '');
    setShowTeamModal(true);
  };

  // Handle Assign Agent to Incharge
  const handleAssignAgentToIncharge = (agentId) => {
    if (!selectedIncharge || !agentId) return;

    const agentObj = agents.find(a => a.id === agentId);
    if (!agentObj) return;

    const updatedAgents = agents.map(a => {
      if (a.id === agentId) {
        return {
          ...a,
          inchargeId: selectedIncharge.id,
          incharge: selectedIncharge.name
        };
      }
      return a;
    });

    setAgents(updatedAgents);
    showToast(`Agent ${agentObj.name} assigned to ${selectedIncharge.name}!`);
    setShowAssignAgentModal(false);
  };

  // Handle Unassign / Remove Agent from Incharge
  const handleUnassignAgent = (agentId) => {
    const agentObj = agents.find(a => a.id === agentId);
    if (!agentObj || !selectedIncharge) return;

    const updatedAgents = agents.map(a => {
      if (a.id === agentId) {
        return {
          ...a,
          inchargeId: null,
          incharge: 'Unassigned / HQ Pool'
        };
      }
      return a;
    });

    setAgents(updatedAgents);
    showToast(`Agent ${agentObj.name} unassigned from ${selectedIncharge.name}.`);
  };

  // 4. Handle Transfer
  const openTransferModal = (inc, e) => {
    if (e) e.stopPropagation();
    setSelectedIncharge(inc);
    const targetRegion = regions.find(r => r.id !== inc.regionId) || regions[0];
    setTransferData({
      regionId: targetRegion.id,
      locality: targetRegion.localities?.[0]?.name || '',
      reason: ''
    });
    setShowTransferModal(true);
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!selectedIncharge) return;

    const targetRegionObj = regions.find(r => r.id === transferData.regionId) || regions[0];

    const updatedIncharge = {
      ...selectedIncharge,
      regionId: targetRegionObj.id,
      region: targetRegionObj.name,
      locality: transferData.locality
    };

    setIncharges(prev => prev.map(item => item.id === selectedIncharge.id ? updatedIncharge : item));
    showToast(`Incharge ${selectedIncharge.name} transferred to ${targetRegionObj.name} (${transferData.locality}).`);
    setShowTransferModal(false);
  };

  // 5. Handle Deactivate / Reactivate
  const openDeactivateModal = (inc, e) => {
    if (e) e.stopPropagation();
    setSelectedIncharge(inc);
    setShowDeactivateModal(true);
  };

  const handleConfirmDeactivate = () => {
    if (!selectedIncharge) return;

    const newStatus = selectedIncharge.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setIncharges(prev => prev.map(item => {
      if (item.id === selectedIncharge.id) {
        return { ...item, status: newStatus };
      }
      return item;
    }));

    showToast(`Incharge ${selectedIncharge.name} status changed to ${newStatus}.`);
    setShowDeactivateModal(false);
  };

  return (
    <div style={styles.pageContainer}>
      {/* ────────────────────────────────────────────────
          1. COMPACT PAGE HEADER
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
            <span style={styles.breadcrumbLink} onClick={() => navigate('/admin/regions')}>
              Operations
            </span>
            <span style={styles.breadcrumbSeparator}>/</span>
            <span style={styles.breadcrumbActive}>ASMs</span>
          </nav>
          <div style={styles.titleRow}>
            <h1 style={styles.pageTitle}>ASM Personnel Management</h1>
            <span style={styles.countPill}>{filteredIncharges.length} active</span>
          </div>
          <p style={styles.pageSubtitle}>
            Manage regional ASM operations, assignments, jurisdictions, and personnel.
          </p>
        </div>

        <div style={styles.headerRight}>
          <button
            style={styles.primaryButton}
            onClick={() => setShowAddModal(true)}
            aria-label="Add new Incharge"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Incharge</span>
          </button>
        </div>
      </header>

      {/* ────────────────────────────────────────────────
          2. SUMMARY KPI CARDS (Horizontal Row, 16px Radius)
          ──────────────────────────────────────────────── */}
      <section style={styles.summaryGrid} aria-label="ASM Operational Summary">
        {/* Total ASMs Card */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTop}>
            <span style={styles.summaryCardLabel}>TOTAL ASMS</span>
            <div style={{ ...styles.iconContainer, backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <Users size={18} strokeWidth={2} />
            </div>
          </div>
          <div style={styles.summaryCardBody}>
            <div style={styles.summaryCardNumber}>{totalASMsCount}</div>
            <div style={styles.summaryTrend}>
              <span style={styles.trendBadgeSuccess}>{activeASMsCount} Active</span>
              <span style={styles.trendContext}>in service</span>
            </div>
          </div>
        </div>

        {/* Field Agents Supervised Card */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTop}>
            <span style={styles.summaryCardLabel}>FIELD AGENTS MANAGED</span>
            <div style={{ ...styles.iconContainer, backgroundColor: '#F0FDF4', color: '#16A34A' }}>
              <UserCheck size={18} strokeWidth={2} />
            </div>
          </div>
          <div style={styles.summaryCardBody}>
            <div style={{ ...styles.summaryCardNumber, color: '#16A34A' }}>
              {totalAgentsSupervised}
            </div>
            <div style={styles.summaryTrend}>
              <span style={styles.trendBadgeNeutral}>Direct Reports</span>
              <span style={styles.trendContext}>across zones</span>
            </div>
          </div>
        </div>

        {/* Total Farmers Scope Card */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTop}>
            <span style={styles.summaryCardLabel}>FARMERS SCOPE</span>
            <div style={{ ...styles.iconContainer, backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <Tractor size={18} strokeWidth={2} />
            </div>
          </div>
          <div style={styles.summaryCardBody}>
            <div style={{ ...styles.summaryCardNumber, color: '#0F172A' }}>
              {totalFarmersScopeCovered} <span style={styles.unitText}>Farmers</span>
            </div>
            <div style={styles.summaryTrend}>
              <span style={styles.trendBadgeNeutral}>Cultivation Scope</span>
              <span style={styles.trendContext}>monitored</span>
            </div>
          </div>
        </div>

        {/* Operating Jurisdictions Card */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryCardTop}>
            <span style={styles.summaryCardLabel}>OPERATING REGIONS</span>
            <div style={{ ...styles.iconContainer, backgroundColor: '#F8FAFC', color: '#0F172A' }}>
              <Globe size={18} strokeWidth={2} />
            </div>
          </div>
          <div style={styles.summaryCardBody}>
            <div style={{ ...styles.summaryCardNumber, color: '#0F172A' }}>
              {regions.length} <span style={styles.unitText}>Zones</span>
            </div>
            <div style={styles.summaryTrend}>
              <span style={styles.trendBadgeNeutral}>Territories</span>
              <span style={styles.trendContext}>Andhra Pradesh</span>
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
            placeholder="Search ASM, ID, region, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
            aria-label="Search ASM personnel"
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

        {/* Filters Controls */}
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
          4. PERSONNEL TABLE (16px Radius White Card)
          ──────────────────────────────────────────────── */}
      <div style={styles.tableCard}>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={{ ...styles.th, width: '22%' }}>EMPLOYEE ID / NAME</th>
                <th style={{ ...styles.th, width: '20%' }}>CONTACT</th>
                <th style={{ ...styles.th, width: '16%' }}>REGION &amp; LOCALITY</th>
                <th style={{ ...styles.th, width: '12%', textAlign: 'center' }}>AGENTS MANAGED</th>
                <th style={{ ...styles.th, width: '10%' }}>FARMERS SCOPE</th>
                <th style={{ ...styles.th, width: '8%', textAlign: 'center' }}>STATUS</th>
                <th style={{ ...styles.th, width: '12%', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncharges.length > 0 ? (
                filteredIncharges.map((inc, index) => {
                  const assignedAgents = getAssignedAgents(inc);
                  const initials = getInitials(inc.name);
                  const isAlternate = index % 2 === 1;
                  const isActive = (inc.status || 'ACTIVE') === 'ACTIVE';

                  return (
                    <tr
                      key={inc.id}
                      style={{
                        ...styles.tableRow,
                        backgroundColor: isAlternate ? '#FAFCFF' : '#FFFFFF'
                      }}
                    >
                      {/* 1. Employee ID / Name Column */}
                      <td style={styles.td}>
                        <div style={styles.employeeCell}>
                          <div style={styles.avatar}>
                            {initials}
                          </div>
                          <div style={styles.employeeInfo}>
                            <span style={styles.employeeName}>{inc.name}</span>
                            <div style={styles.idRoleRow}>
                              <span style={styles.employeeId}>{inc.id}</span>
                              <span style={styles.roleTag}>{inc.role || 'Regional ASM'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Contact Column */}
                      <td style={styles.td}>
                        <div style={styles.contactCell}>
                          <div style={styles.contactItem}>
                            <Phone size={12} style={styles.contactIcon} />
                            <span style={styles.contactPhone}>{inc.phone}</span>
                          </div>
                          <div style={styles.contactItem}>
                            <Mail size={12} style={styles.contactIcon} />
                            <span style={styles.contactEmail}>{inc.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Region & Locality Column */}
                      <td style={styles.td}>
                        <div style={styles.regionCell}>
                          <span style={styles.regionName}>{inc.region}</span>
                          <div style={styles.localityRow}>
                            <MapPin size={12} style={styles.locationIcon} />
                            <span style={styles.localityName}>{inc.locality}</span>
                          </div>
                        </div>
                      </td>

                      {/* 4. Agents Managed Column (Clickable rounded badge) */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <button
                          type="button"
                          style={styles.agentsBadgeButton}
                          onClick={(e) => openTeamModal(inc, e)}
                          title="Click to view & assign Field Agents"
                        >
                          <Users size={13} strokeWidth={2} />
                          <span>{assignedAgents.length} {assignedAgents.length === 1 ? 'Agent' : 'Agents'}</span>
                        </button>
                      </td>

                      {/* 5. Farmers Scope Column */}
                      <td style={styles.td}>
                        <div style={styles.farmersScopeCell}>
                          <span style={styles.farmersNumber}>{inc.farmers}</span>
                          <span style={styles.farmersLabel}>Farmers</span>
                        </div>
                      </td>

                      {/* 6. Status Column (Compact 28px Pill) */}
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

                      {/* 7. Actions Column */}
                      <td style={styles.td}>
                        <div style={styles.actionsGroup}>
                          {/* 1. Edit */}
                          <button
                            style={styles.actionGhostBtn}
                            onClick={(e) => openEditModal(inc, e)}
                            title="Edit Incharge Details"
                            aria-label="Edit Incharge"
                          >
                            <Edit size={14} strokeWidth={2} />
                            <span>Edit</span>
                          </button>

                          {/* 2. Assign Agents */}
                          <button
                            style={styles.actionBlueBtn}
                            onClick={(e) => openTeamModal(inc, e)}
                            title="Assign Field Agents"
                            aria-label="Assign Agents"
                          >
                            <UserPlus size={14} strokeWidth={2} />
                            <span>Assign Agents</span>
                          </button>

                          {/* 3. Transfer */}
                          <button
                            style={styles.actionGhostBtn}
                            onClick={(e) => openTransferModal(inc, e)}
                            title="Transfer Region"
                            aria-label="Transfer Incharge"
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
                            onClick={(e) => openDeactivateModal(inc, e)}
                            title={isActive ? 'Deactivate Incharge' : 'Reactivate Incharge'}
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
                  <td colSpan={7} style={styles.emptyStateCell}>
                    <div style={styles.emptyStateContainer}>
                      <div style={styles.emptyStateIconCircle}>
                        <Users size={32} strokeWidth={1.5} color="#64748B" />
                      </div>
                      <h3 style={styles.emptyStateTitle}>No ASM Personnel Found</h3>
                      <p style={styles.emptyStateDescription}>
                        {hasActiveFilters
                          ? 'No regional incharge records match your current filter criteria. Try resetting your search or filters.'
                          : 'No ASM personnel records have been added to the system yet.'}
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
                          <span>Add Incharge</span>
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
          MODAL 1: EDIT INCHARGE DETAILS
          ──────────────────────────────────────────────── */}
      {showEditModal && selectedIncharge && (
        <div style={styles.modalBackdrop} onClick={() => setShowEditModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.modalIconBlue}>
                  <Edit size={18} color="#2563EB" />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>Edit ASM Profile</h3>
                  <p style={styles.modalSubtitle}>Employee ID: {selectedIncharge.id}</p>
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

            <form onSubmit={handleEditSubmit}>
              <div style={styles.modalBody}>
                {/* Full Name & Designation */}
                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Full Name &amp; Title <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Role / Jurisdiction Label</label>
                    <input
                      type="text"
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                </div>

                {/* Phone & Email */}
                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Contact Phone <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Corporate Email <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                </div>

                {/* Region & Locality */}
                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Operating Region</label>
                    <select
                      style={styles.formSelect}
                      value={editForm.regionId}
                      onChange={(e) => {
                        const rId = e.target.value;
                        const rObj = regions.find(r => r.id === rId);
                        setEditForm({
                          ...editForm,
                          regionId: rId,
                          locality: rObj?.localities?.[0]?.name || ''
                        });
                      }}
                    >
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.formLabel}>Locality Headquarters</label>
                    <select
                      style={styles.formSelect}
                      value={editForm.locality}
                      onChange={(e) => setEditForm({ ...editForm, locality: e.target.value })}
                    >
                      {regions.find(r => r.id === editForm.regionId)?.localities?.map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status Toggle */}
                <div>
                  <label style={styles.formLabel}>Account &amp; Operations Status</label>
                  <select
                    style={styles.formSelect}
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE (In Service)</option>
                    <option value="INACTIVE">INACTIVE (On Leave / Suspended)</option>
                  </select>
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
                  Save Incharge Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────
          MODAL 2: TEAM & ASSIGN AGENTS
          ──────────────────────────────────────────────── */}
      {showTeamModal && selectedIncharge && (
        <div style={styles.modalBackdrop} onClick={() => setShowTeamModal(false)}>
          <div style={{ ...styles.modalContent, width: '660px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.modalIconBlue}>
                  <Users size={18} color="#2563EB" />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>Supervised Field Team</h3>
                  <p style={styles.modalSubtitle}>
                    {selectedIncharge.name} • {selectedIncharge.region} ({selectedIncharge.locality})
                  </p>
                </div>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowTeamModal(false)}
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Assign New Agent Bar */}
              <div style={styles.assignAgentCard}>
                <div style={styles.assignAgentTitle}>
                  <UserPlus size={15} color="#2563EB" />
                  <span>Assign Field Agent to {selectedIncharge.shortName || selectedIncharge.name.split(' ')[0]}</span>
                </div>

                {getAvailableAgentsForAssignment(selectedIncharge).length > 0 ? (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select
                      style={{ ...styles.formSelect, flex: 1 }}
                      value={selectedAgentToAssign}
                      onChange={(e) => setSelectedAgentToAssign(e.target.value)}
                    >
                      {getAvailableAgentsForAssignment(selectedIncharge).map(ag => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name} ({ag.locality} • Currently: {ag.incharge || 'Unassigned'})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      style={{ ...styles.primaryButton, whiteSpace: 'nowrap', height: '38px', padding: '0 14px' }}
                      onClick={() => handleAssignAgentToIncharge(selectedAgentToAssign || getAvailableAgentsForAssignment(selectedIncharge)[0]?.id)}
                    >
                      + Assign Agent
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '12.5px', color: '#64748B' }}>
                    All field agents in the organization are currently allocated.
                  </div>
                )}
              </div>

              {/* Active Assigned Agents List */}
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>
                  Currently Assigned Field Agents ({getAssignedAgents(selectedIncharge).length})
                </div>

                {getAssignedAgents(selectedIncharge).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                    {getAssignedAgents(selectedIncharge).map(ag => (
                      <div key={ag.id} style={styles.assignedAgentRow}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{ag.name}</span>
                            <span style={styles.agentIdBadge}>{ag.id}</span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                            {ag.locality} • Area: <strong>{ag.assignedArea || 'Designated Area'}</strong> • Scope: <strong>{ag.farmers || 0} Farmers</strong>
                          </div>
                        </div>

                        <button
                          style={styles.unassignButton}
                          onClick={() => handleUnassignAgent(ag.id)}
                          title="Unassign agent from incharge"
                        >
                          <UserMinus size={13} />
                          <span>Unassign</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyAgentsBox}>
                    No field agents are currently assigned under this incharge. Use the dropdown above to allocate field agents.
                  </div>
                )}
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                style={styles.primaryButton}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────
          MODAL 3: ADD NEW INCHARGE
          ──────────────────────────────────────────────── */}
      {showAddModal && (
        <div style={styles.modalBackdrop} onClick={() => setShowAddModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.modalIconBlue}>
                  <UserPlus size={18} color="#2563EB" />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>Add Regional Incharge</h3>
                  <p style={styles.modalSubtitle}>Create a new regional operations supervisor account</p>
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

            <form onSubmit={handleAddInchargeSubmit}>
              <div style={styles.modalBody}>
                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Incharge Full Name <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. M. Srinivas"
                      value={newIncharge.name}
                      onChange={(e) => setNewIncharge({ ...newIncharge, name: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Role Designation <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Incharge - Kakinada"
                      value={newIncharge.roleSuffix}
                      onChange={(e) => setNewIncharge({ ...newIncharge, roleSuffix: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                </div>

                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Phone Number <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                      type="text"
                      placeholder="+91 9876543212"
                      value={newIncharge.phone}
                      onChange={(e) => setNewIncharge({ ...newIncharge, phone: e.target.value })}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Email Address</label>
                    <input
                      type="email"
                      placeholder="srinivas.inc@royalsmarine.com"
                      value={newIncharge.email}
                      onChange={(e) => setNewIncharge({ ...newIncharge, email: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                </div>

                <div style={styles.formGrid2}>
                  <div>
                    <label style={styles.formLabel}>Assigned Region <span style={{ color: '#DC2626' }}>*</span></label>
                    <select
                      style={styles.formSelect}
                      value={newIncharge.regionId}
                      onChange={(e) => {
                        const regId = e.target.value;
                        const regObj = regions.find(r => r.id === regId);
                        setNewIncharge({
                          ...newIncharge,
                          regionId: regId,
                          locality: regObj?.localities?.[0]?.name || ''
                        });
                      }}
                    >
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.formLabel}>Headquarters Locality <span style={{ color: '#DC2626' }}>*</span></label>
                    <select
                      style={styles.formSelect}
                      value={newIncharge.locality}
                      onChange={(e) => setNewIncharge({ ...newIncharge, locality: e.target.value })}
                    >
                      {regions.find(r => r.id === newIncharge.regionId)?.localities?.map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
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
                  Create Incharge Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────
          MODAL 4: TRANSFER INCHARGE
          ──────────────────────────────────────────────── */}
      {showTransferModal && selectedIncharge && (
        <div style={styles.modalBackdrop} onClick={() => setShowTransferModal(false)}>
          <div style={{ ...styles.modalContent, width: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.modalIconBlue}>
                  <ArrowLeftRight size={18} color="#2563EB" />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>Transfer Incharge</h3>
                  <p style={styles.modalSubtitle}>{selectedIncharge.name}</p>
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
                <div style={styles.transferCurrentCard}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Current Jurisdiction:</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>
                    {selectedIncharge.region} • {selectedIncharge.locality}
                  </div>
                </div>

                <div>
                  <label style={styles.formLabel}>New Destination Region <span style={{ color: '#DC2626' }}>*</span></label>
                  <select
                    style={styles.formSelect}
                    value={transferData.regionId}
                    onChange={(e) => {
                      const regId = e.target.value;
                      const regObj = regions.find(r => r.id === regId);
                      setTransferData({
                        ...transferData,
                        regionId: regId,
                        locality: regObj?.localities?.[0]?.name || ''
                      });
                    }}
                  >
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.formLabel}>New Headquarters Locality <span style={{ color: '#DC2626' }}>*</span></label>
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
          MODAL 5: DEACTIVATE / REACTIVATE CONFIRMATION
          ──────────────────────────────────────────────── */}
      {showDeactivateModal && selectedIncharge && (
        <div style={styles.modalBackdrop} onClick={() => setShowDeactivateModal(false)}>
          <div style={{ ...styles.modalContent, width: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  ...styles.modalIconCircle,
                  backgroundColor: selectedIncharge.status === 'ACTIVE' ? '#FEE2E2' : '#DCFCE7'
                }}>
                  <ShieldAlert
                    size={20}
                    color={selectedIncharge.status === 'ACTIVE' ? '#DC2626' : '#16A34A'}
                  />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>
                    {selectedIncharge.status === 'ACTIVE' ? 'Deactivate Incharge' : 'Reactivate Incharge'}
                  </h3>
                  <p style={styles.modalSubtitle}>Operations status change</p>
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
                {selectedIncharge.status === 'ACTIVE' ? (
                  <>Are you sure you want to deactivate <strong>{selectedIncharge.name}</strong> ({selectedIncharge.id})? This will suspend their regional management operations access.</>
                ) : (
                  <>Reactivate <strong>{selectedIncharge.name}</strong> ({selectedIncharge.id}) and restore their regional operations privileges?</>
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
                onClick={handleConfirmDeactivate}
                style={{
                  ...styles.primaryButton,
                  backgroundColor: selectedIncharge.status === 'ACTIVE' ? '#DC2626' : '#16A34A'
                }}
              >
                {selectedIncharge.status === 'ACTIVE' ? 'Confirm Deactivate' : 'Confirm Reactivate'}
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

  /* 1. Employee Column */
  employeeCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
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
  employeeInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  employeeName: {
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

  /* 3. Region & Locality Column */
  regionCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  regionName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0F172A'
  },
  localityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  locationIcon: {
    color: '#94A3B8',
    flexShrink: 0
  },
  localityName: {
    fontSize: '11.5px',
    color: '#64748B'
  },

  /* 4. Agents Managed Column */
  agentsBadgeButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    border: '1px solid #BFDBFE',
    borderRadius: '8px',
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },

  /* 5. Farmers Scope Column */
  farmersScopeCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px'
  },
  farmersNumber: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#16A34A'
  },
  farmersLabel: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: 500
  },

  /* 6. Status Column */
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

  /* 7. Action Buttons */
  actionsGroup: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    flexWrap: 'wrap'
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
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '16px 24px',
    backgroundColor: '#F8FAFC',
    borderTop: '1px solid #F1F5F9'
  },

  /* Assign Agent Modal Specifics */
  assignAgentCard: {
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '8px'
  },
  assignAgentTitle: {
    fontSize: '12.5px',
    fontWeight: 600,
    color: '#1E40AF',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px'
  },
  assignedAgentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '10px 14px'
  },
  agentIdBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    padding: '1px 5px',
    borderRadius: '4px'
  },
  unassignButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FECACA',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '11.5px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  emptyAgentsBox: {
    padding: '24px',
    textAlign: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    color: '#64748B',
    fontSize: '12.5px',
    border: '1px dashed #CBD5E1'
  },

  /* Transfer Modal Specifics */
  transferCurrentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    padding: '10px 14px'
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

export default InchargesList;
