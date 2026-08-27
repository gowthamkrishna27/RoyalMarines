import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIncharges, getRegions, getAgents, getFarmers } from '../utils/adminMockData';
import { 
  Plus, Search, ArrowLeftRight, UserX, Check, X, 
  MapPin, Phone, Mail, ShieldAlert, UserCheck, Edit,
  Users, UserPlus, UserMinus, Shield, CheckCircle2, Tractor, Briefcase, Eye 
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

  const [searchTerm, setSearchTerm] = useState('');
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

  // Filter incharges based on search term
  const filteredIncharges = incharges.map(inc => {
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
    return (
      inc.name?.toLowerCase().includes(term) ||
      inc.id?.toLowerCase().includes(term) ||
      inc.phone?.includes(term) ||
      inc.email?.toLowerCase().includes(term) ||
      inc.region?.toLowerCase().includes(term) ||
      inc.locality?.toLowerCase().includes(term)
    );
  });

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
  const openEditModal = (inc) => {
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
  const openTeamModal = (inc) => {
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
  const openTransferModal = (inc) => {
    setSelectedIncharge(inc);
    const targetRegion = regions.find(r => r.id !== inc.regionId) || regions[0];
    setTransferData({
      regionId: targetRegion.id,
      locality: targetRegion.localities[0]?.name || '',
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
  const openDeactivateModal = (inc) => {
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
    <div style={styles.container}>
      {/* 1. Header Row */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>INCHARGE PERSONNEL MANAGEMENT</h1>
          <p style={styles.pageSubtitle}>
            Manage regional operations incharges, jurisdiction scopes, agent assignments, and transfer logs
          </p>
        </div>

        <div style={styles.topActions}>
          {/* Search Bar */}
          <div style={styles.searchBox}>
            <Search size={16} color="#94a3b8" />
            <input 
              type="text"
              placeholder="Search incharge, ID, region.."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={styles.clearSearchBtn}>
                ×
              </button>
            )}
          </div>

          {/* + ADD INCHARGE button */}
          <button 
            style={styles.addBtn}
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>ADD INCHARGE</span>
          </button>
        </div>
      </div>

      {/* 2. Main Incharges Table Card */}
      <div style={styles.tableCard}>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>EMPLOYEE ID / NAME</th>
                <th style={styles.th}>CONTACT</th>
                <th style={styles.th}>REGION &amp; LOCALITY</th>
                <th style={styles.th}>AGENTS MANAGED</th>
                <th style={styles.th}>FARMERS SCOPE</th>
                <th style={styles.th}>STATUS</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncharges.length > 0 ? (
                filteredIncharges.map(inc => {
                  const assignedAgents = getAssignedAgents(inc);

                  return (
                    <tr key={inc.id} style={styles.tr}>
                      {/* Employee ID / Name */}
                      <td style={styles.td}>
                        <div style={styles.nameColumn}>
                          <span style={styles.inchargeName}>{inc.name}</span>
                          <span style={styles.empIdBadge}>{inc.id}</span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td style={styles.td}>
                        <div style={styles.contactColumn}>
                          <span style={styles.contactPhone}>{inc.phone}</span>
                          <span style={styles.contactEmail}>{inc.email}</span>
                        </div>
                      </td>

                      {/* Region & Locality */}
                      <td style={styles.td}>
                        <div style={styles.regionColumn}>
                          <span style={styles.regionName}>{inc.region}</span>
                          <span style={styles.localityName}>{inc.locality}</span>
                        </div>
                      </td>

                      {/* Agents Managed (Clickable to open Team modal) */}
                      <td style={styles.td}>
                        <button 
                          style={styles.agentsManagedBtn}
                          onClick={() => openTeamModal(inc)}
                          title="Click to view & assign Field Agents"
                        >
                          <Users size={14} />
                          <span>{assignedAgents.length} {assignedAgents.length === 1 ? 'Agent' : 'Agents'}</span>
                        </button>
                      </td>

                      {/* Farmers Scope */}
                      <td style={styles.td}>
                        <span style={styles.farmersScopeText}>
                          {inc.farmers} Farmers
                        </span>
                      </td>

                      {/* Status */}
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: inc.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                          color: inc.status === 'ACTIVE' ? '#16a34a' : '#dc2626'
                        }}>
                          {inc.status}
                        </span>
                      </td>

                      {/* Actions: Edit, Team / Assign, Transfer, Deactivate */}
                      <td style={styles.td}>
                        <div style={styles.actionsGroup}>
                          {/* 1. Edit Incharge Details */}
                          <button 
                            style={styles.editBtn}
                            onClick={() => openEditModal(inc)}
                            title="Edit Incharge Details & Contact"
                          >
                            <Edit size={13} />
                            <span>Edit</span>
                          </button>

                          {/* 2. Assign / Manage Team */}
                          <button 
                            style={styles.teamBtn}
                            onClick={() => openTeamModal(inc)}
                            title="View & Assign Field Agents under this Incharge"
                          >
                            <UserPlus size={13} />
                            <span>Assign Agents</span>
                          </button>

                          {/* 3. Transfer Region */}
                          <button 
                            style={styles.transferBtn}
                            onClick={() => openTransferModal(inc)}
                            title="Transfer to another Region or Locality"
                          >
                            <ArrowLeftRight size={13} />
                            <span>Transfer</span>
                          </button>

                          {/* 4. Deactivate */}
                          <button 
                            style={{
                              ...styles.deactivateBtn,
                              color: inc.status === 'ACTIVE' ? '#dc2626' : '#16a34a',
                              backgroundColor: inc.status === 'ACTIVE' ? '#fef2f2' : '#f0fdf4',
                              borderColor: inc.status === 'ACTIVE' ? '#fecaca' : '#bbf7d0'
                            }}
                            onClick={() => openDeactivateModal(inc)}
                            title={inc.status === 'ACTIVE' ? "Deactivate Incharge" : "Reactivate Incharge"}
                          >
                            <UserX size={13} />
                            <span>{inc.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                    No incharges found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Edit Incharge Details */}
      {showEditModal && selectedIncharge && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, width: '560px' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={styles.iconCircleBlue}>
                  <Edit size={18} color="#2563eb" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    Edit Incharge Details: {selectedIncharge.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Employee ID: {selectedIncharge.id}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={styles.modalBody}>
                {/* Full Name & Designation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={styles.modalLabel}>Full Name &amp; Title *</label>
                    <input 
                      type="text" 
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Role / Jurisdiction Label</label>
                    <input 
                      type="text" 
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      style={styles.modalInput}
                    />
                  </div>
                </div>

                {/* Phone & Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={styles.modalLabel}>Contact Phone *</label>
                    <input 
                      type="text" 
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Corporate Email *</label>
                    <input 
                      type="email" 
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                </div>

                {/* Region & Locality */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={styles.modalLabel}>Operating Region</label>
                    <select 
                      style={styles.modalSelect}
                      value={editForm.regionId}
                      onChange={(e) => {
                        const rId = e.target.value;
                        const rObj = regions.find(r => r.id === rId);
                        setEditForm({
                          ...editForm,
                          regionId: rId,
                          locality: rObj?.localities[0]?.name || ''
                        });
                      }}
                    >
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Locality Headquarters</label>
                    <select 
                      style={styles.modalSelect}
                      value={editForm.locality}
                      onChange={(e) => setEditForm({ ...editForm, locality: e.target.value })}
                    >
                      {regions.find(r => r.id === editForm.regionId)?.localities.map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status Toggle */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={styles.modalLabel}>Account &amp; Operations Status</label>
                  <select 
                    style={styles.modalSelect}
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
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={styles.submitBtn}
                >
                  Save Incharge Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Details & Team / Assign Agent */}
      {showTeamModal && selectedIncharge && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, width: '680px' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={styles.iconCircleBlue}>
                  <Users size={18} color="#2563eb" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    Team &amp; Field Agents: {selectedIncharge.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Region: {selectedIncharge.region} ({selectedIncharge.locality})
                  </div>
                </div>
              </div>
              <button onClick={() => setShowTeamModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Assign New Agent Bar */}
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px', marginBottom: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserPlus size={16} />
                  <span>Assign Field Agent to {selectedIncharge.shortName || selectedIncharge.name.split(' ')[0]}</span>
                </div>
                
                {getAvailableAgentsForAssignment(selectedIncharge).length > 0 ? (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select 
                      style={{ ...styles.modalSelect, backgroundColor: '#ffffff' }}
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
                      style={{ ...styles.submitBtn, whiteSpace: 'nowrap', padding: '8px 16px' }}
                      onClick={() => handleAssignAgentToIncharge(selectedAgentToAssign || getAvailableAgentsForAssignment(selectedIncharge)[0]?.id)}
                    >
                      + Assign Agent
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                    All field agents in the organization are currently allocated.
                  </div>
                )}
              </div>

              {/* Active Assigned Agents List */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
                  Active Assigned Field Agents ({getAssignedAgents(selectedIncharge).length})
                </div>

                {getAssignedAgents(selectedIncharge).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                    {getAssignedAgents(selectedIncharge).map(ag => (
                      <div key={ag.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px 14px'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>{ag.name}</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', backgroundColor: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>
                              {ag.id}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                            {ag.locality} • Assigned Area: <strong>{ag.assignedArea || 'Designated Area'}</strong> • Phone: {ag.phone} • Scope: <strong>{ag.farmers || 0} Farmers</strong>
                          </div>
                        </div>

                        <button 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          onClick={() => handleUnassignAgent(ag.id)}
                          title="Unassign this agent from incharge"
                        >
                          <UserMinus size={12} />
                          <span>Unassign</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '10px', color: '#64748b', fontSize: '13px', border: '1px dashed #cbd5e1' }}>
                    No field agents are currently assigned under this incharge. Use the dropdown above to allocate field agents.
                  </div>
                )}
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button 
                type="button" 
                onClick={() => setShowTeamModal(false)}
                style={styles.submitBtn}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add New Incharge */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                Add New Regional Incharge
              </h3>
              <button onClick={() => setShowAddModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddInchargeSubmit}>
              <div style={styles.modalBody}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={styles.modalLabel}>Incharge Full Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. M. Srinivas" 
                    value={newIncharge.name}
                    onChange={(e) => setNewIncharge({ ...newIncharge, name: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={styles.modalLabel}>Role Designation *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Incharge - Kakinada" 
                    value={newIncharge.roleSuffix}
                    onChange={(e) => setNewIncharge({ ...newIncharge, roleSuffix: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={styles.modalLabel}>Phone Number *</label>
                    <input 
                      type="text" 
                      placeholder="+91 9876543212" 
                      value={newIncharge.phone}
                      onChange={(e) => setNewIncharge({ ...newIncharge, phone: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Email Address</label>
                    <input 
                      type="email" 
                      placeholder="srinivas.inc@royalsmarine.com" 
                      value={newIncharge.email}
                      onChange={(e) => setNewIncharge({ ...newIncharge, email: e.target.value })}
                      style={styles.modalInput}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={styles.modalLabel}>Assigned Region *</label>
                    <select 
                      style={styles.modalSelect}
                      value={newIncharge.regionId}
                      onChange={(e) => {
                        const regId = e.target.value;
                        const regObj = regions.find(r => r.id === regId);
                        setNewIncharge({
                          ...newIncharge,
                          regionId: regId,
                          locality: regObj?.localities[0]?.name || ''
                        });
                      }}
                    >
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Headquarters Locality *</label>
                    <select 
                      style={styles.modalSelect}
                      value={newIncharge.locality}
                      onChange={(e) => setNewIncharge({ ...newIncharge, locality: e.target.value })}
                    >
                      {regions.find(r => r.id === newIncharge.regionId)?.localities.map(loc => (
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
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={styles.submitBtn}
                >
                  Create Incharge Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Transfer Incharge */}
      {showTransferModal && selectedIncharge && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeftRight size={18} color="#2563eb" />
                Transfer Incharge: {selectedIncharge.name}
              </h3>
              <button onClick={() => setShowTransferModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit}>
              <div style={styles.modalBody}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Current Assignment:</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {selectedIncharge.region} • {selectedIncharge.locality}
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={styles.modalLabel}>New Destination Region *</label>
                  <select 
                    style={styles.modalSelect}
                    value={transferData.regionId}
                    onChange={(e) => {
                      const regId = e.target.value;
                      const regObj = regions.find(r => r.id === regId);
                      setTransferData({
                        ...transferData,
                        regionId: regId,
                        locality: regObj?.localities[0]?.name || ''
                      });
                    }}
                  >
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={styles.modalLabel}>New Headquarters Locality *</label>
                  <select 
                    style={styles.modalSelect}
                    value={transferData.locality}
                    onChange={(e) => setTransferData({ ...transferData, locality: e.target.value })}
                  >
                    {regions.find(r => r.id === transferData.regionId)?.localities.map(loc => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button 
                  type="button" 
                  onClick={() => setShowTransferModal(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={styles.submitBtn}
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Deactivate Confirmation */}
      {showDeactivateModal && selectedIncharge && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="#dc2626" />
                {selectedIncharge.status === 'ACTIVE' ? 'Deactivate Incharge' : 'Reactivate Incharge'}
              </h3>
              <button onClick={() => setShowDeactivateModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: '1.5', margin: '0 0 14px 0' }}>
                {selectedIncharge.status === 'ACTIVE' ? (
                  <>Are you sure you want to deactivate <strong>{selectedIncharge.name}</strong> ({selectedIncharge.id})? This will suspend their portal management access.</>
                ) : (
                  <>Reactivate <strong>{selectedIncharge.name}</strong> ({selectedIncharge.id}) and restore their regional operations access?</>
                )}
              </p>
            </div>

            <div style={styles.modalFooter}>
              <button 
                type="button" 
                onClick={() => setShowDeactivateModal(false)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleConfirmDeactivate}
                style={{
                  ...styles.submitBtn,
                  backgroundColor: selectedIncharge.status === 'ACTIVE' ? '#dc2626' : '#16a34a'
                }}
              >
                {selectedIncharge.status === 'ACTIVE' ? 'Confirm Deactivate' : 'Confirm Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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
    gap: '20px',
    maxWidth: '1380px',
    margin: '0 auto'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 4px 0',
    letterSpacing: '-0.3px'
  },
  pageSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0
  },
  topActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '8px 12px',
    width: '280px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
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
  addBtn: {
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
    transition: 'background-color 0.15s'
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '16px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
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
    padding: '12px 14px',
    fontSize: '11px',
    fontWeight: 700,
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
    padding: '14px',
    verticalAlign: 'middle',
    fontSize: '13px',
    color: '#334155'
  },
  nameColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  inchargeName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a'
  },
  empIdBadge: {
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#2563eb'
  },
  contactColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  contactPhone: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a'
  },
  contactEmail: {
    fontSize: '11.5px',
    color: '#64748b'
  },
  regionColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  regionName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a'
  },
  localityName: {
    fontSize: '11.5px',
    color: '#64748b'
  },
  agentsManagedBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '12.5px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  farmersScopeText: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#16a34a'
  },
  statusBadge: {
    fontSize: '10.5px',
    fontWeight: 800,
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.4px',
    display: 'inline-block'
  },
  actionsGroup: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    flexWrap: 'wrap'
  },
  editBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#f8fafc',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  teamBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  transferBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #dbeafe',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  deactivateBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    border: '1px solid',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  iconCircleBlue: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f1f5f9'
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
    fontSize: '12px',
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

export default InchargesList;
