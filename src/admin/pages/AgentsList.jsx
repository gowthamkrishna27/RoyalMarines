import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAgents, getIncharges, getRegions } from '../utils/adminMockData';
import {
  Plus, Search, ArrowLeftRight, UserX, Check, X,
  MapPin, Phone, Mail, ShieldAlert, UserCheck, Shield,
  Users, Building, Compass, Eye, Edit
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

  const [searchTerm, setSearchTerm] = useState('');
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

  // Default initial locality and incharge
  const defaultRegion = regions[1] || regions[0] || { id: 'REG-COASTAL', name: 'Coastal Andhra' };
  const defaultLocalities = getLocalitiesForRegion(defaultRegion.id);
  const defaultLocalityName = defaultLocalities[0]?.name || 'Nellore';
  const defaultIncharge = getInchargeForLocality(defaultLocalityName, defaultRegion.id);

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

  // Search filter
  const filteredAgents = agents.filter(ag => {
    const term = searchTerm.toLowerCase();
    return (
      ag.name?.toLowerCase().includes(term) ||
      ag.id?.toLowerCase().includes(term) ||
      ag.phone?.includes(term) ||
      ag.email?.toLowerCase().includes(term) ||
      ag.incharge?.toLowerCase().includes(term) ||
      ag.region?.toLowerCase().includes(term) ||
      ag.locality?.toLowerCase().includes(term) ||
      ag.assignedArea?.toLowerCase().includes(term)
    );
  });

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
  const openEditModal = (ag) => {
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
  const openTransferModal = (ag) => {
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
  const openDeactivateModal = (ag) => {
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
    <div style={styles.container}>
      {/* 1. Top Command Header */}
      <div style={styles.topHeader}>
        <div>
          <h1 style={styles.mainTitle}>FIELD AGENTS MANAGEMENT</h1>
          <p style={styles.mainSubtitle}>
            1 Locality = 1 Dedicated Incharge • Field agents assigned to specific operational areas under their incharge
          </p>
        </div>

        <div style={styles.topActions}>
          {/* Search Box */}
          <div style={styles.searchBox}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search agent, locality, area, incharge..."
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

          {/* + ADD AGENT Button */}
          <button
            style={styles.addBtn}
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>ADD FIELD AGENT</span>
          </button>
        </div>
      </div>

      {/* 2. Main Field Agents Table Card */}
      <div style={styles.tableCard}>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>AGENT NAME / ID</th>
                <th style={styles.th}>CONTACT</th>
                <th style={styles.th}>LOCALITY &amp; INCHARGE (HEAD)</th>
                <th style={styles.th}>ASSIGNED PARTICULAR AREA</th>
                <th style={styles.th}>ASSIGNED FARMERS</th>
                <th style={styles.th}>TESTS COMPLETED</th>
                <th style={styles.th}>DUE TESTS</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.length > 0 ? (
                filteredAgents.map(ag => {
                  const activeInc = getInchargeForLocality(ag.locality, ag.regionId);

                  return (
                    <tr key={ag.id} style={styles.tr}>
                      {/* Agent Name / ID (Clickable) */}
                      <td style={styles.td}>
                        <div
                          style={styles.nameColumnClickable}
                          onClick={() => navigate(`/admin/agents/${ag.id}`)}
                          title="Click to view full Agent Profile & Performance"
                        >
                          <span style={styles.agentNameClickable}>{ag.name}</span>
                          <span style={styles.empIdBadge}>{ag.id}</span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td style={styles.td}>
                        <div style={styles.contactColumn}>
                          <span style={styles.contactPhone}>{ag.phone}</span>
                          <span style={styles.contactEmail}>{ag.email}</span>
                        </div>
                      </td>

                      {/* Locality & Dedicated Incharge */}
                      <td style={styles.td}>
                        <div style={styles.localityColumn}>
                          <span style={styles.localityName}>{ag.locality}</span>
                          <div style={styles.inchargeTag}>
                            <Building size={11} color="#2563eb" />
                            <span>{activeInc?.name || ag.incharge}</span>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Particular Area */}
                      <td style={styles.td}>
                        <div style={styles.areaBadge}>
                          <Compass size={12} color="#0284c7" />
                          <span>{ag.assignedArea || `${ag.locality} Sub-Sector`}</span>
                        </div>
                      </td>

                      {/* Assigned Farmers */}
                      <td style={styles.td}>
                        <span style={styles.assignedFarmersText}>
                          {ag.farmers} {ag.farmers === 1 ? 'Farmer' : 'Farmers'}
                        </span>
                      </td>

                      {/* Tests Completed */}
                      <td style={styles.td}>
                        <span
                          style={{ ...styles.siteVisitsText, cursor: 'pointer', color: '#2563eb', textDecoration: 'underline' }}
                          onClick={() => navigate('/admin/field-data', { state: { searchTerm: ag.id } })}
                          title={`View tests for ${ag.shortName || ag.name}`}
                        >
                          {ag.tests || 0} Tests
                        </span>
                      </td>

                      {/* Due Tests */}
                      <td style={styles.td}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: '#fffbeb',
                          color: '#d97706',
                          border: '1px solid #fde68a'
                        }}>
                          {ag.dueTests !== undefined ? ag.dueTests : (ag.tanks ? Math.ceil(ag.tanks / 2) : 2)} Due
                        </span>
                      </td>

                      {/* Actions: View Details, Edit Details, Transfer & Deactivate */}
                      <td style={styles.td}>
                        <div style={styles.actionsGroup}>
                          {/* 1. View Details */}
                          <button
                            style={styles.viewBtn}
                            onClick={() => navigate(`/admin/agents/${ag.id}`)}
                            title="View full agent details and allocated farmers"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>

                          {/* 2. Edit Agent */}
                          <button
                            style={styles.editBtn}
                            onClick={() => openEditModal(ag)}
                            title="Edit Agent Details & Area"
                          >
                            <Edit size={13} />
                            <span>Edit</span>
                          </button>

                          {/* 3. Transfer */}
                          <button
                            style={styles.transferBtn}
                            onClick={() => openTransferModal(ag)}
                            title="Transfer agent to another Locality or Particular Area"
                          >
                            <ArrowLeftRight size={13} />
                            <span>Transfer</span>
                          </button>

                          {/* 4. Deactivate */}
                          <button
                            style={{
                              ...styles.deactivateBtn,
                              color: ag.status === 'ACTIVE' ? '#dc2626' : '#16a34a',
                              backgroundColor: ag.status === 'ACTIVE' ? '#fef2f2' : '#f0fdf4',
                              borderColor: ag.status === 'ACTIVE' ? '#fecaca' : '#bbf7d0'
                            }}
                            onClick={() => openDeactivateModal(ag)}
                            title={ag.status === 'ACTIVE' ? "Deactivate Agent" : "Reactivate Agent"}
                          >
                            <UserX size={13} />
                            <span>{ag.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                    No field agents found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Edit Agent Details */}
      {showEditModal && selectedAgent && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, width: '560px' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={styles.iconCircleBlue}>
                  <Edit size={18} color="#2563eb" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    Edit Agent: {selectedAgent.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Agent ID: {selectedAgent.id}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditAgentSubmit}>
              <div style={styles.modalBody}>
                {/* Agent Full Name & Role */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={styles.modalLabel}>Agent Full Name *</label>
                    <input
                      type="text"
                      value={editAgentForm.name}
                      onChange={(e) => setEditAgentForm({ ...editAgentForm, name: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Role Designation</label>
                    <input
                      type="text"
                      value={editAgentForm.roleSuffix}
                      onChange={(e) => setEditAgentForm({ ...editAgentForm, roleSuffix: e.target.value })}
                      style={styles.modalInput}
                    />
                  </div>
                </div>

                {/* Contact Phone & Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={styles.modalLabel}>Phone Number *</label>
                    <input
                      type="text"
                      value={editAgentForm.phone}
                      onChange={(e) => setEditAgentForm({ ...editAgentForm, phone: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Corporate Email</label>
                    <input
                      type="email"
                      value={editAgentForm.email}
                      onChange={(e) => setEditAgentForm({ ...editAgentForm, email: e.target.value })}
                      style={styles.modalInput}
                    />
                  </div>
                </div>

                {/* Region & Locality */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={styles.modalLabel}>Operating Region *</label>
                    <select
                      style={styles.modalSelect}
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
                    <label style={styles.modalLabel}>Assigned Locality *</label>
                    <select
                      style={styles.modalSelect}
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
                <div style={{ marginBottom: '12px' }}>
                  <label style={styles.modalLabel}>
                    Reporting Incharge (Head for {editAgentForm.locality})
                  </label>
                  <div style={styles.autoInchargeCard}>
                    <Building size={16} color="#2563eb" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        {editModalIncharge?.name || 'Regional Incharge'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Dedicated Incharge for {editAgentForm.locality}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned Particular Area & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={styles.modalLabel}>Assigned Particular Area / Zone *</label>
                    <input
                      type="text"
                      value={editAgentForm.assignedArea}
                      onChange={(e) => setEditAgentForm({ ...editAgentForm, assignedArea: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>

                  <div>
                    <label style={styles.modalLabel}>Status</label>
                    <select
                      style={styles.modalSelect}
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
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitBtn}
                >
                  Save Agent Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add New Agent */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  Add New Field Agent
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Assign agent to a particular area under the locality's incharge
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAgentSubmit}>
              <div style={styles.modalBody}>
                {/* Agent Name */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={styles.modalLabel}>Agent Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. K. Mahesh"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
                </div>

                {/* Role Designation */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={styles.modalLabel}>Role / Designation Suffix *</label>
                  <input
                    type="text"
                    placeholder="e.g. Field Agent - Mypadu"
                    value={newAgent.roleSuffix}
                    onChange={(e) => setNewAgent({ ...newAgent, roleSuffix: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
                </div>

                {/* Contact: Phone & Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={styles.modalLabel}>Phone Number *</label>
                    <input
                      type="text"
                      placeholder="+91 9876543216"
                      value={newAgent.phone}
                      onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Corporate Email</label>
                    <input
                      type="email"
                      placeholder="mahesh.agt@royalsmarine.com"
                      value={newAgent.email}
                      onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                      style={styles.modalInput}
                    />
                  </div>
                </div>

                {/* Region & Locality */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={styles.modalLabel}>Operating Region *</label>
                    <select
                      style={styles.modalSelect}
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
                    <label style={styles.modalLabel}>Assigned Locality *</label>
                    <select
                      style={styles.modalSelect}
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
                <div style={{ marginBottom: '12px' }}>
                  <label style={styles.modalLabel}>
                    Reporting Incharge (Dedicated Head for {newAgent.locality})
                  </label>
                  <div style={styles.autoInchargeCard}>
                    <Building size={16} color="#2563eb" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        {currentModalIncharge?.name || 'Assigned Regional Incharge'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Sole Incharge in charge of {newAgent.locality}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Particular Area Assignment */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={styles.modalLabel}>Assigned Particular Area / Zone *</label>
                  <input
                    type="text"
                    placeholder="e.g. Mypadu Coastal Area, Allur Shrimp Belt, Indukurpet Zone"
                    value={newAgent.assignedArea}
                    onChange={(e) => setNewAgent({ ...newAgent, assignedArea: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                    Specific village or tank cluster assigned to this agent under the incharge
                  </span>
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
                  Create Field Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Transfer Agent */}
      {showTransferModal && selectedAgent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowLeftRight size={18} color="#2563eb" />
                  Transfer Agent: {selectedAgent.name}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Current: {selectedAgent.locality} • Area: {selectedAgent.assignedArea || 'General'}
                </div>
              </div>
              <button onClick={() => setShowTransferModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit}>
              <div style={styles.modalBody}>
                {/* Destination Region */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={styles.modalLabel}>New Destination Region *</label>
                  <select
                    style={styles.modalSelect}
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
                <div style={{ marginBottom: '12px' }}>
                  <label style={styles.modalLabel}>New Destination Locality *</label>
                  <select
                    style={styles.modalSelect}
                    value={transferData.locality}
                    onChange={(e) => setTransferData({ ...transferData, locality: e.target.value })}
                  >
                    {getLocalitiesForRegion(transferData.regionId).map(loc => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                {/* Auto Assigned Incharge for Destination */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={styles.modalLabel}>New Reporting Incharge (Sole Locality Head)</label>
                  <div style={styles.autoInchargeCard}>
                    <Building size={16} color="#2563eb" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        {transferModalIncharge?.name || 'Regional Incharge'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Incharge for {transferData.locality}
                      </div>
                    </div>
                  </div>
                </div>

                {/* New Assigned Particular Area */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={styles.modalLabel}>New Assigned Particular Area / Zone *</label>
                  <input
                    type="text"
                    placeholder="e.g. Mypadu Coastal Area, Allur Delta"
                    value={transferData.assignedArea}
                    onChange={(e) => setTransferData({ ...transferData, assignedArea: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
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

      {/* Modal 4: Deactivate Confirmation */}
      {showDeactivateModal && selectedAgent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="#dc2626" />
                {selectedAgent.status === 'ACTIVE' ? 'Deactivate Field Agent' : 'Reactivate Field Agent'}
              </h3>
              <button onClick={() => setShowDeactivateModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: '1.5', margin: '0 0 14px 0' }}>
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
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                style={{
                  ...styles.submitBtn,
                  backgroundColor: selectedAgent.status === 'ACTIVE' ? '#dc2626' : '#16a34a'
                }}
              >
                {selectedAgent.status === 'ACTIVE' ? 'Confirm Deactivate' : 'Confirm Reactivate'}
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
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
  },
  mainTitle: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 4px 0',
    letterSpacing: '-0.3px'
  },
  mainSubtitle: {
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
    padding: '9px 14px',
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
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: 600,
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
    padding: '24px 32px',
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
  nameColumnClickable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    cursor: 'pointer'
  },
  agentNameClickable: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a',
    transition: 'color 0.15s',
    '&:hover': {
      color: '#2563eb',
      textDecoration: 'underline'
    }
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
  localityColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  localityName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a'
  },
  inchargeTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11.5px',
    color: '#2563eb',
    fontWeight: 600
  },
  areaBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#f0f9ff',
    color: '#0369a1',
    border: '1px solid #bae6fd',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 600
  },
  assignedFarmersText: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#16a34a'
  },
  siteVisitsText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155'
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
  viewBtn: {
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
  editBtn: {
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
  autoInchargeCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '10px 12px'
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
    width: '500px',
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
    marginBottom: '16px',
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

export default AgentsList;
