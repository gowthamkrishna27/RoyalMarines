import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAgents, getIncharges, getRegions, getFarmers } from '../utils/adminMockData';
import { useMockData } from '../../context/MockDataContext';
import {
  Plus, Search, ArrowLeftRight, UserX, Check, X,
  MapPin, Phone, Mail, ShieldAlert, UserCheck, Shield,
  Users, Building, Compass, Eye, Edit, RotateCcw,
  ChevronDown, CheckCircle2, Tractor, ClipboardList,
  AlertCircle, Clock, Sparkles, Building2, Globe, TestTube, Bell, Activity, Droplets
} from 'lucide-react';

const AgentsList = () => {
  const navigate = useNavigate();
  const regions = getRegions();
  const { db, addNotification } = useMockData();

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

  // 3. Load Farmers from localStorage or fallback
  const [farmersList] = useState(() => {
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

  const [selectedAgentForFarmers, setSelectedAgentForFarmers] = useState(null);
  const [farmerModalSearch, setFarmerModalSearch] = useState('');

  // Tests & Due Tests Modal States
  const [selectedAgentForTests, setSelectedAgentForTests] = useState(null);
  const [testsModalSearch, setTestsModalSearch] = useState('');
  const [testsModalFilter, setTestsModalFilter] = useState('ALL');

  const [selectedAgentForDueTests, setSelectedAgentForDueTests] = useState(null);
  const [dueModalSearch, setDueModalSearch] = useState('');
  const [remindedTanks, setRemindedTanks] = useState({});

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

  // Filter assigned farmers for the selected agent modal
  const filteredAgentFarmers = useMemo(() => {
    if (!selectedAgentForFarmers) return [];
    return farmersList.filter(f =>
      f.agentId === selectedAgentForFarmers.id ||
      f.agent?.toLowerCase().includes(selectedAgentForFarmers.name.toLowerCase().split(' ')[0]) ||
      f.agent?.toLowerCase().includes(selectedAgentForFarmers.shortName?.toLowerCase() || '') ||
      (f.locality && selectedAgentForFarmers.locality && f.locality.toLowerCase().trim() === selectedAgentForFarmers.locality.toLowerCase().trim())
    ).filter(f => {
      if (!farmerModalSearch) return true;
      const term = farmerModalSearch.toLowerCase();
      return (
        f.name?.toLowerCase().includes(term) ||
        f.phone?.includes(term) ||
        f.village?.toLowerCase().includes(term) ||
        f.waterSource?.toLowerCase().includes(term) ||
        f.locality?.toLowerCase().includes(term)
      );
    });
  }, [selectedAgentForFarmers, farmersList, farmerModalSearch]);

  // Compute test records for the selected agent
  const filteredAgentTests = useMemo(() => {
    if (!selectedAgentForTests) return [];
    const ag = selectedAgentForTests;
    const rawSubs = (db?.submissions || []).filter(s =>
      s.agentId === ag.id ||
      s.agentName?.toLowerCase().includes(ag.name.toLowerCase().split(' ')[0]) ||
      (ag.name.toLowerCase().includes('mahesh') && s.agentId === 'agent003') ||
      (ag.name.toLowerCase().includes('ramesh') && s.agentId === 'agent001') ||
      (ag.name.toLowerCase().includes('suresh') && s.agentId === 'agent002')
    );

    const farmers = (db?.farmers || []).filter(f =>
      f.agentId === ag.id ||
      (ag.name.toLowerCase().includes('mahesh') && f.agentId === 'agent003') ||
      (ag.name.toLowerCase().includes('ramesh') && f.agentId === 'agent001') ||
      (ag.name.toLowerCase().includes('suresh') && f.agentId === 'agent002')
    );
    const farmerNames = farmers.length > 0 ? farmers.map(f => f.name) : ['Ashok', 'Ravi', 'Krishna', 'Siva', 'Subba Rao'];

    const testTypes = [
      { type: 'Water Telemetry Analysis', category: 'WATER', icon: '💧', params: 'pH: 7.8 • DO: 6.2 mg/L • Salinity: 18 ppt • Temp: 29.4°C' },
      { type: 'Weekly Feed & Biomass Sampling', category: 'FEED', icon: '⚖️', params: 'ABW: 16.4g • Feed Consumption: 85 kg/day • FCR: 1.18' },
      { type: 'Soil & Alkaline Tray Audit', category: 'WATER', icon: '🧪', params: 'Alkalinity: 140 ppm • Ammonia: 0.02 ppm • Nitrite: 0.01 ppm' },
      { type: 'Shrimp Health & Swimming Biocheck', category: 'HEALTH', icon: '🦐', params: 'Gut Fullness: 95% • Activity: Active • Zero Disease Symptoms' }
    ];

    const result = [...rawSubs.map((s, i) => {
      const farmer = (db?.farmers || []).find(f => f.id === s.farmerId) || { name: s.farmerId || farmerNames[i % farmerNames.length] };
      const tank = (db?.tanks || []).find(t => t.id === s.tankId) || { name: `Tank ${(i % 3) + 1}`, doc: 45 + (i * 3) };
      const tt = testTypes[i % testTypes.length];
      return {
        id: s.id || `TEST-RM-${ag.id}-${100 + i}`,
        date: s.date || '2026-08-24',
        time: s.time || '09:30 AM',
        farmerName: farmer.name,
        tankName: tank.name || 'Tank 1',
        doc: tank.doc || (45 + i),
        testType: s.type || tt.type,
        category: tt.category,
        params: s.params || tt.params,
        status: 'VERIFIED'
      };
    })];

    const targetCount = ag.tests || 42;
    for (let i = result.length; i < targetCount; i++) {
      const tt = testTypes[i % testTypes.length];
      const fName = farmerNames[i % farmerNames.length];
      const dayOffset = Math.floor(i / 3);
      const dateObj = new Date(2026, 7, 24 - dayOffset);
      const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      result.push({
        id: `TEST-RM-${ag.name.substring(0,3).toUpperCase()}-${200 + i}`,
        date: dateStr,
        time: `${(8 + (i % 8)).toString().padStart(2, '0')}:${(15 * (i % 4)).toString().padStart(2, '0')} ${i % 2 === 0 ? 'AM' : 'PM'}`,
        farmerName: fName,
        tankName: `Tank ${(i % 2) + 1}`,
        doc: 30 + ((i * 2) % 65),
        testType: tt.type,
        category: tt.category,
        params: tt.params,
        status: 'VERIFIED'
      });
    }

    return result.filter(item => {
      const matchesFilter = testsModalFilter === 'ALL' || item.category === testsModalFilter;
      if (!matchesFilter) return false;
      if (!testsModalSearch) return true;
      const term = testsModalSearch.toLowerCase();
      return (
        item.id.toLowerCase().includes(term) ||
        item.farmerName.toLowerCase().includes(term) ||
        item.tankName.toLowerCase().includes(term) ||
        item.testType.toLowerCase().includes(term) ||
        item.params.toLowerCase().includes(term)
      );
    });
  }, [selectedAgentForTests, db, testsModalFilter, testsModalSearch]);

  // Compute due tests for the selected agent
  const filteredAgentDueTests = useMemo(() => {
    if (!selectedAgentForDueTests) return [];
    const ag = selectedAgentForDueTests;
    const farmers = (db?.farmers || []).filter(f =>
      f.agentId === ag.id ||
      (ag.name.toLowerCase().includes('mahesh') && f.agentId === 'agent003') ||
      (ag.name.toLowerCase().includes('ramesh') && f.agentId === 'agent001') ||
      (ag.name.toLowerCase().includes('suresh') && f.agentId === 'agent002')
    );
    const farmerIds = farmers.map(f => f.id);

    const agentTanks = (db?.tanks || []).filter(t =>
      (farmerIds.includes(t.farmerId) || t.agentId === ag.id) &&
      t.status !== 'Harvested' &&
      (t.testStatus === 'Due' || t.testStatus === 'Overdue')
    );

    let list = [];
    if (agentTanks.length > 0) {
      list = agentTanks.map((t, idx) => {
        const farmer = farmers.find(f => f.id === t.farmerId) || (db?.farmers || []).find(f => f.id === t.farmerId) || { name: 'Local Farmer', phone: ag.phone, locality: ag.locality };
        const isOverdue = t.testStatus === 'Overdue' || idx === 0;
        return {
          tankId: t.id,
          tankName: t.name || `Tank ${idx + 1}`,
          farmerId: farmer.id,
          farmerName: farmer.name,
          farmerPhone: farmer.phone || ag.phone,
          farmerLocality: farmer.location || farmer.locality || ag.locality,
          doc: t.doc || 45,
          abw: t.abw || '16.5g',
          acres: t.size || '10 Acres',
          testType: idx % 2 === 0 ? 'Routine Water Quality & Ammonia Telemetry' : 'Weekly Feed Conversion & Biomass Audit',
          isOverdue: isOverdue,
          dueDate: isOverdue ? '18 Aug 2026' : '26 Aug 2026',
          daysText: isOverdue ? 'Overdue by 5 days' : 'Due this cycle'
        };
      });
    } else {
      const dueCount = ag.dueTests !== undefined ? ag.dueTests : (ag.name === 'Mahesh' ? 1 : ag.name === 'Ramesh' ? 3 : 2);
      const testTypesList = [
        'Routine Water Quality & Dissolved Oxygen Telemetry',
        'Weekly Feed Conversion & Biomass Audit',
        'Soil Composition & Ammonia Tray Analysis'
      ];
      for (let i = 0; i < dueCount; i++) {
        const f = farmers[i % (farmers.length || 1)] || { id: `F00${i+1}`, name: i === 0 ? 'Krishna' : i === 1 ? 'Ramesh' : 'Ashok', phone: '+91 9876543219', locality: ag.locality, acres: '28 Acres' };
        const isOverdue = i === 0 && (ag.name === 'Ramesh' || ag.name === 'Suresh');
        list.push({
          tankId: `T-DUE-${ag.id}-${i + 1}`,
          tankName: `Tank ${i + 1}`,
          farmerId: f.id,
          farmerName: f.name,
          farmerPhone: f.phone,
          farmerLocality: f.locality || ag.locality,
          doc: 38 + (i * 12),
          abw: `${12 + (i * 4)}g`,
          acres: `${10 + (i * 5)} Acres`,
          testType: testTypesList[i % testTypesList.length],
          isOverdue: isOverdue,
          dueDate: isOverdue ? '18 Aug 2026' : '26 Aug 2026',
          daysText: isOverdue ? 'Overdue by 4 days' : 'Due this cycle'
        });
      }
    }

    if (!dueModalSearch) return list;
    const term = dueModalSearch.toLowerCase();
    return list.filter(item =>
      item.farmerName.toLowerCase().includes(term) ||
      item.tankName.toLowerCase().includes(term) ||
      item.testType.toLowerCase().includes(term) ||
      item.farmerLocality.toLowerCase().includes(term)
    );
  }, [selectedAgentForDueTests, db, dueModalSearch]);

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
                <th style={{ ...styles.th, width: '22%' }}>AGENT NAME</th>
                <th style={{ ...styles.th, width: '20%' }}>CONTACT</th>
                <th style={{ ...styles.th, width: '18%' }}>LOCATION &amp; ASM</th>
                <th style={{ ...styles.th, width: '12%' }}>REGION</th>
                <th style={{ ...styles.th, width: '10%', textAlign: 'center' }}>TESTS</th>
                <th style={{ ...styles.th, width: '10%', textAlign: 'center' }}>DUE TESTS</th>
                <th style={{ ...styles.th, width: '8%', textAlign: 'center' }}>ACTIONS</th>
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

                      {/* 5. Tests Column (Clickable to tests modal) */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <button
                          type="button"
                          style={styles.testsLinkButton}
                          onClick={() => {
                            setSelectedAgentForTests(ag);
                            setTestsModalSearch('');
                            setTestsModalFilter('ALL');
                          }}
                          title={`Click to view test records conducted by ${ag.shortName || ag.name}`}
                        >
                          <span style={styles.testsNumber}>{ag.tests || 42}</span>
                          <span style={styles.testsCaption}>Tests</span>
                        </button>
                      </td>

                      {/* 6. Due Tests Column (Amber Warning Badge - Clickable to due tests modal) */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <button
                          type="button"
                          style={{
                            ...styles.dueBadge,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => {
                            setSelectedAgentForDueTests(ag);
                            setDueModalSearch('');
                          }}
                          title={`Click to view pending due tests for ${ag.name}`}
                        >
                          {dueCount} Due
                        </button>
                      </td>

                      {/* 7. Actions Column */}
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
          5. ASSIGNED FARMERS MODAL
          ──────────────────────────────────────────────── */}
      {selectedAgentForFarmers && (
        <div style={styles.modalOverlay} onClick={() => setSelectedAgentForFarmers(null)}>
          <div
            style={{
              ...styles.modalContainer,
              maxWidth: '850px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Tractor size={22} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={styles.modalTitle}>
                      Farmers Assigned to {selectedAgentForFarmers.name}
                    </h3>
                    <span style={{
                      backgroundColor: '#EFF6FF',
                      color: '#2563EB',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {filteredAgentFarmers.length} {filteredAgentFarmers.length === 1 ? 'Farmer' : 'Farmers'}
                    </span>
                  </div>
                  <p style={styles.modalSubtitle}>
                    {selectedAgentForFarmers.locality} • {selectedAgentForFarmers.phone} • {selectedAgentForFarmers.assignedArea || `${selectedAgentForFarmers.locality} Sector`}
                  </p>
                </div>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setSelectedAgentForFarmers(null)}
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div style={{ padding: '14px 20px 0', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ ...styles.searchBox, flex: 1 }}>
                <Search size={15} style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search assigned farmers by name, phone, village, water source..."
                  value={farmerModalSearch}
                  onChange={(e) => setFarmerModalSearch(e.target.value)}
                  style={styles.searchInput}
                />
                {farmerModalSearch && (
                  <button
                    type="button"
                    onClick={() => setFarmerModalSearch('')}
                    style={styles.clearSearchBtn}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body: Farmers List */}
            <div style={{ ...styles.modalBody, flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredAgentFarmers.length > 0 ? (
                filteredAgentFarmers.map((farmer, fIdx) => (
                  <div
                    key={farmer.id || fIdx}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '16px',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
                    }}
                  >
                    {/* Top Row: Farmer Name, Contact, Status, Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                            {farmer.name}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: farmer.status === 'Inactive' ? '#FEE2E2' : '#DCFCE7',
                            color: farmer.status === 'Inactive' ? '#DC2626' : '#16A34A'
                          }}>
                            {farmer.status || 'Active'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px', fontSize: '12px', color: '#64748B' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} />
                            <strong style={{ color: '#334155' }}>{farmer.phone}</strong>
                          </span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} />
                            {farmer.assignedArea || farmer.village || farmer.location || 'Local Belt'} ({farmer.locality})
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          backgroundColor: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/admin/farmers/${farmer.id}`)}
                      >
                        <span>Full Analytics</span>
                        <Eye size={13} />
                      </button>
                    </div>

                    {/* Meta details strip */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '10px',
                      marginTop: '12px',
                      padding: '10px 12px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Agent</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{selectedAgentForFarmers.name}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 600 }}>Total Cultivation</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{farmer.acres || `${farmer.totalAcres || 5} Acres`}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 600 }}>Tanks Count</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{farmer.tanks || farmer.tankBreakdown?.length || 1} Units</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 600 }}>Water Source</span>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{farmer.waterSource || 'Creek / Estuary'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 20px', color: '#64748B' }}>
                  <Tractor size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>
                    No assigned farmers found
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                    {farmerModalSearch ? 'Try a different search term.' : 'This agent does not have any allocated farmers yet.'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#F8FAFC'
            }}>
              <button
                type="button"
                onClick={() => navigate(`/admin/agents/${selectedAgentForFarmers.id}`)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <span>Open Full Agent Profile</span>
                <Eye size={13} />
              </button>
              <button
                type="button"
                onClick={() => setSelectedAgentForFarmers(null)}
                style={styles.secondaryButton}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────
          6. AGENT TESTS COMPLETED MODAL
          ──────────────────────────────────────────────── */}
      {selectedAgentForTests && (
        <div style={styles.modalOverlay} onClick={() => setSelectedAgentForTests(null)}>
          <div
            style={{
              ...styles.modalContainer,
              maxWidth: '900px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <TestTube size={22} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={styles.modalTitle}>
                      Test Records: {selectedAgentForTests.name}
                    </h3>
                    <span style={{
                      backgroundColor: '#EFF6FF',
                      color: '#2563EB',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {filteredAgentTests.length} Records Verified
                    </span>
                  </div>
                  <p style={styles.modalSubtitle}>
                    {selectedAgentForTests.locality} • {selectedAgentForTests.phone} • Field Sampling &amp; Telemetry Audits
                  </p>
                </div>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setSelectedAgentForTests(null)}
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div style={{ padding: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Search Bar */}
                <div style={{ ...styles.searchBox, flex: 1, minWidth: '220px' }}>
                  <Search size={15} style={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search tests by ID, farmer, tank, parameter..."
                    value={testsModalSearch}
                    onChange={(e) => setTestsModalSearch(e.target.value)}
                    style={styles.searchInput}
                  />
                  {testsModalSearch && (
                    <button
                      type="button"
                      onClick={() => setTestsModalSearch('')}
                      style={styles.clearSearchBtn}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '6px', backgroundColor: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
                  {[
                    { id: 'ALL', label: 'All Tests' },
                    { id: 'WATER', label: 'Water Analysis' },
                    { id: 'FEED', label: 'Feed & Biomass' },
                    { id: 'HEALTH', label: 'Health Check' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTestsModalFilter(tab.id)}
                      style={{
                        border: 'none',
                        background: testsModalFilter === tab.id ? '#FFFFFF' : 'transparent',
                        color: testsModalFilter === tab.id ? '#0F172A' : '#64748B',
                        fontWeight: testsModalFilter === tab.id ? 700 : 500,
                        fontSize: '12px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        boxShadow: testsModalFilter === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Body: Test Records List */}
            <div style={{ ...styles.modalBody, flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#F8FAFC' }}>
              {filteredAgentTests.length > 0 ? (
                filteredAgentTests.map((tItem, idx) => (
                  <div
                    key={tItem.id || idx}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB', fontFamily: 'monospace' }}>
                            {tItem.id}
                          </span>
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                            {tItem.farmerName} • {tItem.tankName}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748B', backgroundColor: '#F1F5F9', padding: '1px 6px', borderRadius: '4px' }}>
                            Day {tItem.doc} DOC
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '1px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#DCFCE7',
                            color: '#15803D'
                          }}>
                            ✓ {tItem.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginTop: '4px' }}>
                          {tItem.testType}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                          {tItem.params}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
                          {tItem.date}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          {tItem.time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 20px', color: '#64748B' }}>
                  <TestTube size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>
                    No test records found
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                    {testsModalSearch ? 'Try adjusting your search keywords.' : 'No telemetry records matching this filter.'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#FFFFFF'
            }}>
              <button
                type="button"
                onClick={() => navigate('/admin/field-data', { state: { searchTerm: selectedAgentForTests.id } })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <span>Open Field Data Center</span>
                <Eye size={13} />
              </button>
              <button
                type="button"
                onClick={() => setSelectedAgentForTests(null)}
                style={styles.secondaryButton}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────
          7. AGENT DUE TESTS MODAL
          ──────────────────────────────────────────────── */}
      {selectedAgentForDueTests && (
        <div style={styles.modalOverlay} onClick={() => setSelectedAgentForDueTests(null)}>
          <div
            style={{
              ...styles.modalContainer,
              maxWidth: '850px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <AlertCircle size={22} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={styles.modalTitle}>
                      Due Tests: {selectedAgentForDueTests.name}
                    </h3>
                    <span style={{
                      backgroundColor: '#FEF3C7',
                      color: '#B45309',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid #FDE68A'
                    }}>
                      {filteredAgentDueTests.length} Tests Due
                    </span>
                  </div>
                  <p style={styles.modalSubtitle}>
                    {selectedAgentForDueTests.locality} • {selectedAgentForDueTests.phone} • Active tanks requiring routine field telemetry
                  </p>
                </div>
              </div>
              <button
                style={styles.modalCloseButton}
                onClick={() => setSelectedAgentForDueTests(null)}
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick KPI Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #F1F5F9'
            }}>
              <div style={{ backgroundColor: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <span style={{ fontSize: '9.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block' }}>TOTAL DUE</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{filteredAgentDueTests.length} Tanks</span>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #FECACA', textAlign: 'center' }}>
                <span style={{ fontSize: '9.5px', color: '#DC2626', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block' }}>CRITICAL OVERDUE</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#DC2626' }}>
                  {filteredAgentDueTests.filter(t => t.isOverdue).length} Critical
                </span>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #BFDBFE', textAlign: 'center' }}>
                <span style={{ fontSize: '9.5px', color: '#1A2FB8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block' }}>FARMERS</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#1A2FB8' }}>
                  {new Set(filteredAgentDueTests.map(t => t.farmerName)).size} Impacted
                </span>
              </div>
            </div>

            {/* Modal Search Bar */}
            <div style={{ padding: '12px 20px 0', display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
              <div style={{ ...styles.searchBox, flex: 1 }}>
                <Search size={15} style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search due tests by farmer, tank, or locality..."
                  value={dueModalSearch}
                  onChange={(e) => setDueModalSearch(e.target.value)}
                  style={styles.searchInput}
                />
                {dueModalSearch && (
                  <button
                    type="button"
                    onClick={() => setDueModalSearch('')}
                    style={styles.clearSearchBtn}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body: Due Tests List */}
            <div style={{ ...styles.modalBody, flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#F8FAFC' }}>
              {filteredAgentDueTests.length > 0 ? (
                filteredAgentDueTests.map((item, idx) => {
                  const isReminded = remindedTanks[item.tankId];
                  return (
                    <div
                      key={item.tankId || idx}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderLeft: `4px solid ${item.isOverdue ? '#DC2626' : '#F59E0B'}`,
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
                      }}
                    >
                      {/* Row 1: Farmer & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span
                              style={{ fontSize: '15px', fontWeight: 700, color: '#1A2FB8', cursor: 'pointer' }}
                              onClick={() => {
                                setSelectedAgentForDueTests(null);
                                navigate(`/admin/farmers/${item.farmerId}`);
                              }}
                              title="View Farmer Analytics"
                            >
                              {item.farmerName}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                              • {item.tankName} ({item.acres})
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748B', backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                              Day {item.doc} DOC • ABW {item.abw}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
                            📍 {item.farmerLocality} • 📞 {item.farmerPhone}
                          </div>
                        </div>

                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '6px',
                          backgroundColor: item.isOverdue ? '#FEE2E2' : '#FEF3C7',
                          color: item.isOverdue ? '#DC2626' : '#B45309',
                          border: `1px solid ${item.isOverdue ? '#FECACA' : '#FDE68A'}`
                        }}>
                          {item.daysText}
                        </span>
                      </div>

                      {/* Row 2: Required Test & Actions */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                        paddingTop: '8px',
                        borderTop: '1px solid #F1F5F9'
                      }}>
                        <div style={{ fontSize: '12.5px', color: '#334155' }}>
                          <strong>Required:</strong> {item.testType}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (addNotification) {
                                addNotification(
                                  selectedAgentForDueTests.id,
                                  `Admin Reminder: ${item.testType} is due for ${item.farmerName} • ${item.tankName}.`,
                                  'warning'
                                );
                              }
                              setRemindedTanks(prev => ({ ...prev, [item.tankId]: true }));
                              showToast(`Reminder sent to ${selectedAgentForDueTests.name}!`);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              backgroundColor: isReminded ? '#DCFCE7' : '#EFF6FF',
                              color: isReminded ? '#15803D' : '#2563EB',
                              border: `1px solid ${isReminded ? '#BBF7D0' : '#BFDBFE'}`,
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <Bell size={12} />
                            <span>{isReminded ? 'Reminded ✓' : 'Remind Tech'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAgentForDueTests(null);
                              navigate(`/admin/farmers/${item.farmerId}`);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#F8FAFC',
                              color: '#475569',
                              border: '1px solid #E2E8F0',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <span>Farmer Details</span>
                            <Eye size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 20px', color: '#64748B' }}>
                  <CheckCircle2 size={32} color="#16A34A" style={{ margin: '0 auto 10px' }} />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>
                    All Tests Up to Date
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                    {dueModalSearch ? 'No due tests matched your search.' : 'No due or overdue tests found for this agent.'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#FFFFFF'
            }}>
              {filteredAgentDueTests.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const allMap = {};
                    filteredAgentDueTests.forEach(item => { allMap[item.tankId] = true; });
                    setRemindedTanks(prev => ({ ...prev, ...allMap }));
                    showToast(`Reminders broadcasted to ${selectedAgentForDueTests.name} for all ${filteredAgentDueTests.length} due tanks!`);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#1A2FB8',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Bell size={13} />
                  <span>Remind All ({filteredAgentDueTests.length})</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedAgentForDueTests(null)}
                style={styles.secondaryButton}
              >
                Close
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
  farmersLinkButton: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'background-color 0.15s ease'
  },
  testsNumber: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#2563EB'
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
