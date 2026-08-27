import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAgentById, getAgents, getFarmers, getRegions, getIncharges } from '../utils/adminMockData';
import PageHeader from '../components/PageHeader';
import { 
  ArrowLeft, Edit, Phone, Mail, MapPin, Building, 
  Compass, Sprout, Database, CheckSquare, Eye, X, 
  Check, UserCheck, Shield, Layers, Tractor, Droplets 
} from 'lucide-react';

const AgentDetail = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const regions = getRegions();
  const allIncharges = getIncharges();

  // 1. Load Agent from localStorage or fallback
  const [agent, setAgent] = useState(() => {
    const savedAgents = localStorage.getItem('royal_admin_agents_data');
    if (savedAgents) {
      try {
        const parsed = JSON.parse(savedAgents);
        const found = parsed.find(a => a.id === agentId);
        if (found) return found;
      } catch (e) {}
    }
    return getAgentById(agentId) || getAgents()[0];
  });

  // 2. Load Farmers from localStorage or fallback
  const [farmersList, setFarmersList] = useState(() => {
    const savedFarmers = localStorage.getItem('royal_admin_farmers_data');
    if (savedFarmers) {
      try {
        return JSON.parse(savedFarmers);
      } catch (e) {}
    }
    return getFarmers();
  });

  const [toastMessage, setToastMessage] = useState('');
  const [showEditAgentModal, setShowEditAgentModal] = useState(false);
  const [showEditFarmerModal, setShowEditFarmerModal] = useState(false);
  const [selectedFarmerToEdit, setSelectedFarmerToEdit] = useState(null);

  // Edit Agent Form State
  const [editAgentForm, setEditAgentForm] = useState({
    name: '',
    roleSuffix: '',
    phone: '',
    email: '',
    regionId: 'REG-COASTAL',
    locality: 'Nellore',
    assignedArea: '',
    status: 'ACTIVE'
  });

  // Edit Farmer Form State
  const [editFarmerForm, setEditFarmerForm] = useState({
    id: '',
    name: '',
    phone: '',
    village: '',
    waterSource: 'Creek / Estuary',
    acres: '4.5 Acres',
    totalAcres: 4.5,
    status: 'Active'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Helper: Get Incharge for Locality
  const getInchargeForLocality = (localityName, regionId) => {
    if (!localityName) return allIncharges[0];
    const found = allIncharges.find(inc => 
      inc.locality?.toLowerCase().trim() === localityName.toLowerCase().trim()
    );
    if (found) return found;
    const byRegion = allIncharges.find(inc => inc.regionId === regionId);
    return byRegion || allIncharges[0];
  };

  // Helper: Get localities for region
  const getLocalitiesForRegion = (regionId) => {
    const region = regions.find(r => r.id === regionId);
    return region?.localities || [];
  };

  // Filter and sort farmers reporting to this agent
  const allocatedFarmers = farmersList.filter(f => 
    f.agentId === agent.id || 
    f.agent?.toLowerCase().includes(agent.name.toLowerCase().split(' ')[0]) ||
    f.agent?.toLowerCase().includes(agent.shortName?.toLowerCase() || '')
  ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // 1. Open Edit Agent Modal
  const openEditAgentModal = () => {
    const regObj = regions.find(r => r.id === agent.regionId || r.name === agent.region) || regions[0];
    setEditAgentForm({
      name: agent.shortName || agent.name.split('(')[0].trim(),
      roleSuffix: agent.role || agent.name.split('(')[1]?.replace(')', '')?.trim() || 'Field Agent',
      phone: agent.phone || '',
      email: agent.email || '',
      regionId: regObj.id,
      locality: agent.locality || 'Nellore',
      assignedArea: agent.assignedArea || 'Designated Area',
      status: agent.status || 'ACTIVE'
    });
    setShowEditAgentModal(true);
  };

  // Handle Save Agent Details
  const handleSaveAgentDetails = (e) => {
    e.preventDefault();
    if (!editAgentForm.name.trim()) return;

    const selectedRegionObj = regions.find(r => r.id === editAgentForm.regionId) || regions[0];
    const dedicatedIncharge = getInchargeForLocality(editAgentForm.locality, selectedRegionObj.id);
    const fullName = `${editAgentForm.name.trim()} (${editAgentForm.roleSuffix.trim()})`;

    const updatedAgent = {
      ...agent,
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

    setAgent(updatedAgent);

    // Save to localStorage agents list
    const savedAgents = localStorage.getItem('royal_admin_agents_data');
    if (savedAgents) {
      try {
        const parsed = JSON.parse(savedAgents);
        const updatedAll = parsed.map(a => a.id === agent.id ? updatedAgent : a);
        localStorage.setItem('royal_admin_agents_data', JSON.stringify(updatedAll));
      } catch (err) {}
    }

    showToast(`Agent details for ${updatedAgent.name} updated successfully!`);
    setShowEditAgentModal(false);
  };

  // 2. Open Edit Farmer Modal
  const openEditFarmerModal = (farmer) => {
    setSelectedFarmerToEdit(farmer);
    setEditFarmerForm({
      id: farmer.id,
      name: farmer.name,
      phone: farmer.phone,
      village: farmer.village,
      waterSource: farmer.waterSource || 'Creek / Estuary',
      acres: farmer.acres,
      totalAcres: farmer.totalAcres || parseFloat(farmer.acres) || 4.5,
      status: farmer.status || 'Active'
    });
    setShowEditFarmerModal(true);
  };

  // Handle Save Farmer Details
  const handleSaveFarmerDetails = (e) => {
    e.preventDefault();
    if (!editFarmerForm.name.trim() || !selectedFarmerToEdit) return;

    const acresNum = parseFloat(editFarmerForm.totalAcres) || 4.5;
    const updatedFarmer = {
      ...selectedFarmerToEdit,
      name: editFarmerForm.name.trim(),
      phone: editFarmerForm.phone.trim(),
      village: editFarmerForm.village.trim(),
      waterSource: editFarmerForm.waterSource,
      totalAcres: acresNum,
      acres: `${acresNum.toFixed(1)} Acres`,
      status: editFarmerForm.status
    };

    const updatedFarmersList = farmersList.map(f => f.id === selectedFarmerToEdit.id ? updatedFarmer : f);
    setFarmersList(updatedFarmersList);
    localStorage.setItem('royal_admin_farmers_data', JSON.stringify(updatedFarmersList));

    showToast(`Farmer ${updatedFarmer.name} (${updatedFarmer.id}) details updated!`);
    setShowEditFarmerModal(false);
  };

  const editModalIncharge = getInchargeForLocality(editAgentForm.locality, editAgentForm.regionId);

  return (
    <div style={styles.container}>
      {/* Top Header & Breadcrumbs */}
      <div style={styles.topNavRow}>
        <button onClick={() => navigate('/admin/agents')} style={styles.backBtn}>
          <ArrowLeft size={15} />
          <span>Back to All Field Agents</span>
        </button>
      </div>

      <PageHeader 
        title={`Field Agent Profile: ${agent.name}`} 
        breadcrumbs={[
          { label: 'Organization' },
          { label: 'Agents', path: '/admin/agents' }, 
          { label: agent.name, active: true }
        ]} 
      />

      {/* 1. Master Agent Profile Card */}
      <div style={styles.card}>
        <div style={styles.profileHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={styles.agentTitle}>{agent.name}</h2>
              <span style={styles.idBadge}>{agent.id}</span>
              <span style={{
                ...styles.activePill,
                backgroundColor: agent.status === 'ACTIVE' ? '#f0fdf4' : '#fef2f2',
                color: agent.status === 'ACTIVE' ? '#16a34a' : '#dc2626',
                borderColor: agent.status === 'ACTIVE' ? '#bbf7d0' : '#fecaca'
              }}>
                {agent.status}
              </span>
            </div>
            <p style={styles.profileSubtitle}>
              {agent.region} • {agent.locality} • Assigned Area: <strong>{agent.assignedArea || `${agent.locality} Sector`}</strong>
            </p>
          </div>

          <button 
            style={styles.editAgentBtn}
            onClick={openEditAgentModal}
          >
            <Edit size={14} />
            <span>Edit Agent Details</span>
          </button>
        </div>

        {/* 4 Information Blocks */}
        <div style={styles.profileGrid}>
          <div style={styles.profileBlock}>
            <span style={styles.blockLabel}>CONTACT NUMBER</span>
            <span style={styles.blockValue}>{agent.phone}</span>
          </div>

          <div style={styles.profileBlock}>
            <span style={styles.blockLabel}>CORPORATE EMAIL</span>
            <span style={styles.blockValue}>{agent.email}</span>
          </div>

          <div style={styles.profileBlock}>
            <span style={styles.blockLabel}>REPORTING INCHARGE</span>
            <span style={{ ...styles.blockValue, color: '#2563eb' }}>{agent.incharge}</span>
          </div>

          <div style={styles.profileBlock}>
            <span style={styles.blockLabel}>ASSIGNED PARTICULAR AREA</span>
            <span style={{ ...styles.blockValue, color: '#0369a1' }}>
              {agent.assignedArea || `${agent.locality} Operational Area`}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Key Performance Metrics */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconBox, backgroundColor: '#fef3c7', color: '#d97706' }}>
            <Sprout size={20} />
          </div>
          <div>
            <div style={styles.kpiValue}>{allocatedFarmers.length}</div>
            <div style={styles.kpiLabel}>Allocated Farmers</div>
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconBox, backgroundColor: '#f3e8ff', color: '#7e22ce' }}>
            <Database size={20} />
          </div>
          <div>
            <div style={styles.kpiValue}>
              {allocatedFarmers.reduce((acc, f) => acc + (f.tanks || f.tankBreakdown?.length || 1), 0)}
            </div>
            <div style={styles.kpiLabel}>Tanks Monitored</div>
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconBox, backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <CheckSquare size={20} />
          </div>
          <div>
            <div style={styles.kpiValue}>{agent.tests || 45}</div>
            <div style={styles.kpiLabel}>Telemetry Tests Submitted</div>
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconBox, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <UserCheck size={20} />
          </div>
          <div>
            <div style={styles.kpiValue}>{agent.compliance || 95}%</div>
            <div style={styles.kpiLabel}>Field Sampling Compliance</div>
          </div>
        </div>
      </div>

      {/* 3. Farmers Allocated to this Agent (With Edit & View Growth) */}
      <div style={styles.card}>
        <div style={styles.sectionHeaderRow}>
          <div>
            <h3 style={styles.sectionCardTitle}>
              Farmers Allocated to {agent.shortName || agent.name} ({allocatedFarmers.length})
            </h3>
            <p style={styles.sectionCardSubtitle}>
              Pond clusters, acreage, and telemetry status assigned to this field agent
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto', marginTop: '10px' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>FARMER NAME / ID</th>
                <th style={styles.th}>CONTACT</th>
                <th style={styles.th}>VILLAGE</th>
                <th style={styles.th}>SOURCE OF WATER</th>
                <th style={styles.th}>LAND &amp; TANKS</th>
                <th style={styles.th}>STATUS</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {allocatedFarmers.length > 0 ? (
                allocatedFarmers.map(farmer => (
                  <tr key={farmer.id} style={styles.tr}>
                    {/* Name & ID */}
                    <td style={styles.td}>
                      <div 
                        style={styles.nameColumnClickable}
                        onClick={() => navigate(`/admin/farmers/${farmer.id}`)}
                        title="Click to view full Farmer & Tank Growth Analytics"
                      >
                        <span style={styles.farmerName}>{farmer.name}</span>
                        <span style={styles.farmerIdBadge}>{farmer.id}</span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td style={styles.td}>
                      <span>{farmer.phone}</span>
                    </td>

                    {/* Village */}
                    <td style={styles.td}>
                      <span>{farmer.village}</span>
                    </td>

                    {/* Water Source */}
                    <td style={styles.td}>
                      <span style={styles.waterSourcePill}>
                        <Droplets size={12} color="#0284c7" />
                        <span>{farmer.waterSource || 'Creek / Estuary'}</span>
                      </span>
                    </td>

                    {/* Land & Tanks */}
                    <td style={styles.td}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        {farmer.acres} • {farmer.tanks || farmer.tankBreakdown?.length || 1} Tanks
                      </span>
                    </td>

                    {/* Status */}
                    <td style={styles.td}>
                      <span style={styles.activePill}>{farmer.status || 'Active'}</span>
                    </td>

                    {/* Actions: View Growth & Edit Farmer */}
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {/* 1. View Growth Analytics */}
                        <button 
                          style={styles.viewGrowthBtn}
                          onClick={() => navigate(`/admin/farmers/${farmer.id}`)}
                          title="View Growth Trajectory & Water Quality Telemetry"
                        >
                          <Eye size={13} />
                          <span>View Growth</span>
                        </button>

                        {/* 2. Edit Farmer Details */}
                        <button 
                          style={styles.editFarmerBtn}
                          onClick={() => openEditFarmerModal(farmer)}
                          title="Edit farmer details, village, and water source"
                        >
                          <Edit size={13} />
                          <span>Edit Farmer</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '13.5px' }}>
                    No farmers are currently allocated under this agent.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Edit Agent Details */}
      {showEditAgentModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, width: '560px' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={styles.iconCircleBlue}>
                  <Edit size={18} color="#2563eb" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    Edit Agent: {agent.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Agent ID: {agent.id}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowEditAgentModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAgentDetails}>
              <div style={styles.modalBody}>
                {/* Name & Role */}
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
                        Sole Incharge for {editAgentForm.locality}
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
                  onClick={() => setShowEditAgentModal(false)}
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

      {/* Modal 2: Edit Farmer Details */}
      {showEditFarmerModal && selectedFarmerToEdit && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, width: '520px' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={styles.iconCircleGreen}>
                  <Edit size={18} color="#16a34a" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    Edit Farmer: {selectedFarmerToEdit.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    ID: {selectedFarmerToEdit.id} • Assigned Agent: {agent.name}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowEditFarmerModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFarmerDetails}>
              <div style={styles.modalBody}>
                {/* Farmer Name & Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={styles.modalLabel}>Farmer Full Name *</label>
                    <input 
                      type="text"
                      value={editFarmerForm.name}
                      onChange={(e) => setEditFarmerForm({ ...editFarmerForm, name: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Phone Number *</label>
                    <input 
                      type="text"
                      value={editFarmerForm.phone}
                      onChange={(e) => setEditFarmerForm({ ...editFarmerForm, phone: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                </div>

                {/* Village & Water Source */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={styles.modalLabel}>Village Name *</label>
                    <input 
                      type="text"
                      value={editFarmerForm.village}
                      onChange={(e) => setEditFarmerForm({ ...editFarmerForm, village: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Source of Water</label>
                    <select 
                      style={styles.modalSelect}
                      value={editFarmerForm.waterSource}
                      onChange={(e) => setEditFarmerForm({ ...editFarmerForm, waterSource: e.target.value })}
                    >
                      <option value="Creek / Estuary">Creek / Estuary</option>
                      <option value="Sea / Coastal Canal">Sea / Coastal Canal</option>
                      <option value="Borewell / Ground Water">Borewell / Ground Water</option>
                      <option value="River / Freshwater Canal">River / Freshwater Canal</option>
                      <option value="Reservoir / Agricultural Canal">Reservoir / Agricultural Canal</option>
                      <option value="Other">Other Source</option>
                    </select>
                  </div>
                </div>

                {/* Total Acres & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={styles.modalLabel}>Total Land (Acres) *</label>
                    <input 
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={editFarmerForm.totalAcres}
                      onChange={(e) => setEditFarmerForm({ ...editFarmerForm, totalAcres: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Account Status</label>
                    <select 
                      style={styles.modalSelect}
                      value={editFarmerForm.status}
                      onChange={(e) => setEditFarmerForm({ ...editFarmerForm, status: e.target.value })}
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
                  onClick={() => setShowEditFarmerModal(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={styles.submitBtn}
                >
                  Save Farmer Details
                </button>
              </div>
            </form>
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
    gap: '16px',
    maxWidth: '1360px',
    margin: '0 auto'
  },
  topNavRow: {
    display: 'flex',
    alignItems: 'center'
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '20px 22px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  },
  profileHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '16px'
  },
  agentTitle: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0
  },
  idBadge: {
    backgroundColor: '#f1f5f9',
    color: '#2563eb',
    fontSize: '11.5px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '5px',
    border: '1px solid #e2e8f0'
  },
  activePill: {
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '9999px',
    border: '1px solid #bbf7d0'
  },
  profileSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: '4px 0 0 0'
  },
  editAgentBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '7px 14px',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  profileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '14px 16px',
    border: '1px solid #e2e8f0'
  },
  profileBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  blockLabel: {
    fontSize: '10.5px',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.4px'
  },
  blockValue: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: '#0f172a'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px'
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  },
  kpiIconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  kpiValue: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: '1.2'
  },
  kpiLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    marginTop: '2px'
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '12px',
    paddingBottom: '10px',
    borderBottom: '1px solid #f1f5f9'
  },
  sectionCardTitle: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0
  },
  sectionCardSubtitle: {
    fontSize: '12px',
    color: '#64748b',
    margin: '2px 0 0 0'
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
    padding: '10px 12px',
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
    padding: '12px',
    verticalAlign: 'middle',
    fontSize: '13px',
    color: '#334155'
  },
  nameColumnClickable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    cursor: 'pointer'
  },
  farmerName: {
    fontSize: '13.5px',
    fontWeight: 700,
    color: '#0f172a'
  },
  farmerIdBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#2563eb'
  },
  waterSourcePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#f0f9ff',
    color: '#0369a1',
    border: '1px solid #bae6fd',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '11.5px',
    fontWeight: 600
  },
  viewGrowthBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#f8fafc',
    color: '#2563eb',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11.5px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  editFarmerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    border: '1px solid #bbf7d0',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11.5px',
    fontWeight: 600,
    cursor: 'pointer'
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
  iconCircleGreen: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#f0fdf4',
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

export default AgentDetail;
