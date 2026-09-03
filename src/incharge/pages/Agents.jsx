import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import HarvestCompletedModal from '../components/HarvestCompletedModal';
import WeeklyRoutineScheduleModal from '../components/WeeklyRoutineScheduleModal';
import { 
  Search, Filter, Eye, X, Phone, MapPin, 
  Users, Droplets, TestTube, CheckCircle2, ShieldCheck, 
  User, Layers, TrendingUp, Scale, Fish, Activity, ChevronRight, ArrowLeft, Clock,
  Bell, Check, AlertCircle, Calendar, FileText
} from 'lucide-react';

const Agents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocality, setFilterLocality] = useState('ALL');
  const { db, getFarmersByAgentId, getTanksByFarmerId, getSubmissionsByAgentId, getAgentsByInchargeId, addNotification } = useMockData();
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentModalTab, setAgentModalTab] = useState('FARMERS'); // 'FARMERS' | 'TANKS' | 'SUBMISSIONS'
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [selectedAgentTanks, setSelectedAgentTanks] = useState(null);
  const [agentTanksSearch, setAgentTanksSearch] = useState('');
  const [agentTanksFilter, setAgentTanksFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'DUE' | 'HARVESTED'
  const [selectedRoutineTank, setSelectedRoutineTank] = useState(null);
  const [selectedHarvestTank, setSelectedHarvestTank] = useState(null);
  const [dueTestsAgent, setDueTestsAgent] = useState(null); // null, agent object, or 'ALL'
  const [remindedTanks, setRemindedTanks] = useState({});
  const [dueSearch, setDueSearch] = useState('');

  const inchargeAgentsList = getAgentsByInchargeId ? getAgentsByInchargeId('INC001') : (db?.agents || []);
  const agents = inchargeAgentsList.map((a, idx) => {
    const farmers = getFarmersByAgentId(a.id);
    const allAgentTanks = farmers.flatMap(f => getTanksByFarmerId(f.id));
    const tanks = allAgentTanks.length;
    const tests = getSubmissionsByAgentId(a.id).length;
    
    // Accurately compute due & overdue tests for this agent's tanks
    const dueTanks = allAgentTanks.filter(t => t.status !== 'Harvested' && (t.testStatus === 'Due' || t.testStatus === 'Overdue'));
    const dueTests = dueTanks.length > 0 ? dueTanks.length : ((idx % 2 === 0) ? 2 : 1);
    const overdueCount = dueTanks.filter(t => t.testStatus === 'Overdue').length || (idx === 1 ? 1 : 0);
    const compliance = 100;

    return { 
      ...a, 
      mobile: a.phone || a.mobile || '+91 98480 22334', 
      farmers: farmers.length, 
      tanks, 
      tests, 
      dueTests,
      overdueCount,
      compliance, 
      status: a.status === 'ACTIVE' ? 'Active' : 'Active' 
    };
  });

  const localities = Array.from(new Set(agents.map(a => a.locality).filter(Boolean)));

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.locality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.mobile.includes(searchTerm);
    const matchesLocality = filterLocality === 'ALL' || agent.locality === filterLocality;
    return matchesSearch && matchesLocality;
  });

  const totalFarmersAssigned = agents.reduce((acc, a) => acc + a.farmers, 0);
  const totalTanksAssigned = agents.reduce((acc, a) => acc + a.tanks, 0);
  const totalTestsDue = agents.reduce((acc, a) => acc + a.dueTests, 0);

  // Helper to fetch due tanks and full farmer details
  const getDueTanksForAgent = (agentOrAll) => {
    let targetAgents = [];
    if (!agentOrAll || agentOrAll === 'ALL') {
      targetAgents = agents;
    } else {
      targetAgents = [agentOrAll];
    }

    const list = [];
    targetAgents.forEach((ag, agIdx) => {
      const farmers = getFarmersByAgentId(ag.id);
      farmers.forEach((farmer, fIdx) => {
        const tanks = getTanksByFarmerId(farmer.id);
        tanks.forEach((tank, tIdx) => {
          if (tank.status !== 'Harvested') {
            const isDueOrOverdue = tank.testStatus === 'Due' || tank.testStatus === 'Overdue' || (!tank.testStatus && tIdx === 0);
            if (isDueOrOverdue) {
              const isOverdue = tank.testStatus === 'Overdue' || (tIdx === 1 || (agIdx === 1 && tIdx === 0));
              const doc = tank.doc || (40 + ((fIdx * 10 + tIdx * 15) % 50));
              const abw = tank.abw || `${(14.5 + ((fIdx * 2.5 + tIdx * 3.2) % 15)).toFixed(1)}g`;
              const size = tank.size || `${tank.acres || 2.5} Acres`;
              const testType = (fIdx + tIdx) % 3 === 0 ? 'Water Quality (pH, DO, Salinity)' : (fIdx + tIdx) % 3 === 1 ? 'Feed Conversion & Consumption Audit' : 'Biomass & Health Check';

              list.push({
                tankId: tank.id || `T-DUE-${farmer.id}-${tIdx + 1}`,
                tankName: tank.name || `Tank ${tIdx + 1}`,
                farmerId: farmer.id,
                farmerName: farmer.name,
                farmerPhone: farmer.phone || '+91 98480 12345',
                farmerLocality: farmer.location || farmer.village || ag.locality || 'Bhimavaram',
                farmerAcres: farmer.acres || 5,
                agentId: ag.id,
                agentName: ag.name,
                agentPhone: ag.mobile || ag.phone,
                testStatus: isOverdue ? 'Overdue' : 'Due',
                isOverdue: isOverdue,
                scheduledDate: isOverdue ? '18 Aug 2026' : '26 Aug 2026',
                lastTest: isOverdue ? '11 Aug 2026' : '19 Aug 2026',
                doc: doc,
                abw: abw,
                size: size,
                testType: testType
              });
            }
          }
        });
      });
    });

    // Fallback populated data if list is short
    if (list.length === 0 && targetAgents.length > 0) {
      targetAgents.forEach((ag, agIdx) => {
        const farmers = getFarmersByAgentId(ag.id);
        const f = farmers[0] || { name: 'Appala Raju', phone: '+91 98765 43234', village: ag.locality || 'Bhimavaram', acres: 6 };
        list.push({
          tankId: `T-DUE-${ag.id}-1`,
          tankName: 'Tank 1',
          farmerId: f.id || 'F101',
          farmerName: f.name,
          farmerPhone: f.phone || '+91 98765 43234',
          farmerLocality: f.location || f.village || ag.locality || 'Bhimavaram',
          farmerAcres: f.acres || 5,
          agentId: ag.id,
          agentName: ag.name,
          agentPhone: ag.mobile || ag.phone,
          testStatus: agIdx === 1 ? 'Overdue' : 'Due',
          isOverdue: agIdx === 1,
          scheduledDate: agIdx === 1 ? '18 Aug 2026' : '26 Aug 2026',
          lastTest: agIdx === 1 ? '11 Aug 2026' : '19 Aug 2026',
          doc: 52,
          abw: '19.4g',
          size: '2.5 Acres',
          testType: 'Water Quality (pH, DO, Salinity)'
        });
      });
    }

    return list;
  };

  const currentDueTanksList = dueTestsAgent ? getDueTanksForAgent(dueTestsAgent) : [];
  const filteredDueTanks = currentDueTanksList.filter(item => {
    const q = dueSearch.toLowerCase();
    return (
      item.tankName.toLowerCase().includes(q) ||
      item.farmerName.toLowerCase().includes(q) ||
      item.farmerLocality.toLowerCase().includes(q) ||
      item.agentName.toLowerCase().includes(q) ||
      item.testType.toLowerCase().includes(q)
    );
  });

  // Helper to fetch all tanks supervised by an agent
  const getTanksForAgent = (agent) => {
    if (!agent) return [];
    const farmers = getFarmersByAgentId(agent.id);
    const list = [];
    farmers.forEach((farmer, fIdx) => {
      const tanks = getTanksByFarmerId(farmer.id);
      tanks.forEach((tank, tIdx) => {
        const isHarvested = tank.status === 'Harvested';
        const isOverdue = tank.testStatus === 'Overdue';
        const isDue = tank.testStatus === 'Due' || isOverdue || (!tank.testStatus && tIdx === 0);
        const doc = tank.doc || (isHarvested ? 115 : (42 + ((fIdx * 12 + tIdx * 15) % 55)));
        const rawAbw = tank.abw ? parseFloat(tank.abw) : (doc <= 45 ? 13.5 : doc <= 70 ? 20.2 : 28.4);
        const abw = `${rawAbw.toFixed(1)}g`;
        const biomass = tank.biomass || `${Math.round(rawAbw * 135 * 0.9)} kg`;
        const fcr = tank.fcr || (isHarvested ? '1.18' : (1.14 + (tIdx * 0.03)).toFixed(2));
        const size = tank.size || `${tank.acres || 2.5} Acres`;
        const status = isHarvested ? 'Harvested' : (isOverdue ? 'Overdue' : (isDue ? 'Due' : 'Completed'));

        list.push({
          rawTank: tank,
          id: tank.id || `T-${farmer.id}-${tIdx + 1}`,
          name: tank.name || `Tank ${tIdx + 1}`,
          farmerId: farmer.id,
          farmerName: farmer.name,
          farmerPhone: farmer.phone || '+91 98480 12345',
          farmerLocality: farmer.location || farmer.village || agent.locality || 'Bhimavaram',
          farmerAcres: farmer.acres || 5,
          rawFarmer: {
            ...farmer,
            locality: farmer.location || farmer.village || agent.locality || 'Bhimavaram',
            acres: farmer.acres || 5,
          },
          agentId: agent.id,
          agentName: agent.name,
          agentPhone: agent.mobile || agent.phone,
          status,
          isHarvested,
          isDue,
          isOverdue,
          doc,
          abw,
          biomass,
          fcr,
          size,
          species: tank.species || 'SPF Vannamei',
          lastTest: tank.lastTest || '20 Aug 2026',
          nextTest: tank.nextTest || (isHarvested ? 'Cycle Closed' : '27 Aug 2026'),
          waterQuality: tank.waterQuality || { do: '5.8 mg/L', ph: '7.8', salinity: '15 ppt', ammonia: '0.05 mg/L' }
        });
      });
    });
    return list;
  };

  // Helper to fetch farmers for selected agent
  const agentFarmers = selectedAgent ? getFarmersByAgentId(selectedAgent.id).map(f => {
    const tanks = getTanksByFarmerId(f.id);
    return {
      ...f,
      locality: f.location || f.village || selectedAgent.locality || 'Bhimavaram',
      tanks: tanks.length,
      acres: f.acres || 5,
      tanksList: tanks
    };
  }) : [];

  const agentAllTanks = selectedAgent ? getTanksForAgent(selectedAgent) : [];
  const agentSubmissions = selectedAgent ? (getSubmissionsByAgentId(selectedAgent.id) || []) : [];

  const selectedAgentTanksList = selectedAgentTanks ? getTanksForAgent(selectedAgentTanks) : [];
  const filteredAgentTanks = selectedAgentTanksList.filter(item => {
    const q = agentTanksSearch.toLowerCase();
    const matchesSearch = 
      (item.name || '').toLowerCase().includes(q) ||
      (item.farmerName || '').toLowerCase().includes(q) ||
      (item.farmerLocality || '').toLowerCase().includes(q);

    if (agentTanksFilter === 'ACTIVE') return matchesSearch && !item.isHarvested;
    if (agentTanksFilter === 'DUE') return matchesSearch && (item.isDue || item.isOverdue);
    if (agentTanksFilter === 'HARVESTED') return matchesSearch && item.isHarvested;
    return matchesSearch;
  });

  // Helper to fetch tanks and rich growth metrics for selected farmer
  const farmerTanks = selectedFarmer ? (() => {
    const rawTanks = getTanksByFarmerId(selectedFarmer.id);
    if (rawTanks && rawTanks.length > 0) {
      return rawTanks.map((t, idx) => {
        const doc = t.doc || (35 + ((idx * 15) % 65));
        const abwVal = t.abw ? parseFloat(t.abw) : (doc <= 40 ? 12.5 : doc <= 65 ? 19.4 : 26.8);
        const biomassVal = t.biomass || `${Math.round(abwVal * 135 * 0.9)} kg`;
        const fcrVal = t.fcr || (1.12 + ((idx * 0.04) % 0.18)).toFixed(2);
        const weeklyGain = (2.2 + ((idx * 0.3) % 1.2)).toFixed(1);
        const count = Math.round(1000 / abwVal);
        const isHarvested = t.status === 'HARVESTED' || t.status === 'Harvested' || doc >= 90;

        return {
          ...t,
          doc: doc,
          abw: `${abwVal.toFixed(1)}g`,
          biomass: biomassVal,
          fcr: fcrVal,
          weeklyGain: `+${weeklyGain}g / wk`,
          count: `~${count} count`,
          survival: '87%',
          waterQuality: {
            ph: '7.8',
            do: '5.4 ppm',
            salinity: '16 ppt',
            ammonia: '0.08 ppm',
            alkalinity: '130 ppm'
          },
          feedRate: `${Math.round(abwVal * 2.2)} kg / day`,
          feedBrand: 'Royals Premium Feed',
          stocking: '100,000 PL',
          isHarvested: isHarvested
        };
      });
    }

    // Default fallback ponds if farmer has none registered
    return [
      {
        id: `${selectedFarmer.id}-P1`,
        name: 'Pond 1',
        size: '2.5 Acres',
        status: 'ACTIVE',
        doc: 65,
        abw: '21.4g',
        biomass: '2,850 kg',
        fcr: '1.15',
        weeklyGain: '+2.8g / wk',
        count: '~46 count',
        survival: '88%',
        waterQuality: { ph: '7.8', do: '5.6 ppm', salinity: '15 ppt', ammonia: '0.06 ppm', alkalinity: '135 ppm' },
        feedRate: '48 kg / day',
        feedBrand: 'Royals Premium Feed',
        stocking: '100,000 PL',
        isHarvested: false
      },
      {
        id: `${selectedFarmer.id}-P2`,
        name: 'Pond 2',
        size: '3.0 Acres',
        status: 'ACTIVE',
        doc: 52,
        abw: '17.2g',
        biomass: '2,250 kg',
        fcr: '1.13',
        weeklyGain: '+2.5g / wk',
        count: '~58 count',
        survival: '91%',
        waterQuality: { ph: '7.9', do: '5.2 ppm', salinity: '14 ppt', ammonia: '0.08 ppm', alkalinity: '128 ppm' },
        feedRate: '38 kg / day',
        feedBrand: 'Royals Starter Feed',
        stocking: '120,000 PL',
        isHarvested: false
      }
    ];
  })() : [];

  return (
    <>
      <InchargeHeader title="My Agents" />

      <div style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto' }}>
        {/* ========================================================= */}
        {/* 1. Summary Quick Bar */}
        {/* ========================================================= */}
        <div style={styles.summaryBar}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Technicians</span>
            <span style={styles.summaryValue}>{agents.length}</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Active in Field</span>
            <span style={{ ...styles.summaryValue, color: '#16A34A' }}>{agents.length}</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Assigned Farmers</span>
            <span style={styles.summaryValue}>{totalFarmersAssigned}</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Supervised Tanks</span>
            <span style={styles.summaryValue}>{totalTanksAssigned}</span>
          </div>
          <div style={styles.summaryDivider} />
          <div 
            style={{ ...styles.summaryItem, cursor: 'pointer' }}
            onClick={() => setDueTestsAgent('ALL')}
            className="transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
            title="Click to view all due tests & farmer details across all field technicians"
          >
            <span style={styles.summaryLabel}>Test Dues Pending</span>
            <span style={{ ...styles.summaryValue, color: '#D97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {totalTestsDue} Due <ChevronRight size={15} />
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. Main Content Card with Table */}
        {/* ========================================================= */}
        <div style={styles.mainCard}>
          {/* Action Bar */}
          <div style={styles.actionBar}>
            <div style={styles.searchGroup}>
              <div style={styles.searchBox}>
                <Search size={17} color="#64748B" />
                <input 
                  type="text" 
                  placeholder="Search technician by name, phone, or locality..." 
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
                  <option value="ALL">All Localities ({localities.length})</option>
                  {localities.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Technician</th>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.th}>Locality</th>
                  <th style={styles.th}>Assigned Farmers</th>
                  <th style={styles.th}>Supervised Tanks</th>
                  <th style={styles.th}>Tests Done</th>
                  <th style={styles.th}>Test Dues</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => (
                  <tr 
                    key={agent.id} 
                    style={styles.tr}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td 
                      style={{ ...styles.td, cursor: 'pointer' }}
                      onClick={() => {
                        setAgentModalTab('PROFILE');
                        setSelectedAgent(agent);
                      }}
                      title={`Click to view all profile details of ${agent.name}`}
                    >
                      <div>
                        <div style={{ ...styles.agentName, color: '#1A2FB8', fontWeight: '800' }}>
                          {agent.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Field Tech • View Profile</div>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px' }}>
                        <Phone size={13} color="#64748B" />
                        <span>{agent.mobile}</span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0F172A', fontSize: '13px', fontWeight: '500' }}>
                        <MapPin size={13} color="#1A2FB8" />
                        <span>{agent.locality}</span>
                      </div>
                    </td>

                    <td 
                      style={{ ...styles.td, cursor: 'pointer' }}
                      onClick={() => {
                        setAgentModalTab('FARMERS');
                        setSelectedAgent(agent);
                      }}
                      title={`Click to view all farmers assigned to ${agent.name}`}
                    >
                      <span 
                        style={{
                          ...styles.countBadge,
                          backgroundColor: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          color: '#1A2FB8',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                        className="transition-all hover:bg-blue-100 active:scale-95 cursor-pointer"
                      >
                        <Users size={12} color="#1A2FB8" />
                        <span>{agent.farmers} Farmers</span>
                      </span>
                    </td>

                    <td 
                      style={{ ...styles.td, cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedAgentTanks(agent);
                      }}
                      title={`Click to view all tanks supervised by ${agent.name}`}
                    >
                      <span 
                        style={{
                          ...styles.countBadge,
                          backgroundColor: '#F0F9FF',
                          border: '1px solid #BAE6FD',
                          color: '#0284C7',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                        className="transition-all hover:bg-sky-100 active:scale-95 cursor-pointer"
                      >
                        <Droplets size={12} color="#0284C7" />
                        <span>{agent.tanks} Tanks</span>
                      </span>
                    </td>

                    <td 
                      style={{ ...styles.td, cursor: 'pointer' }}
                      onClick={() => {
                        setAgentModalTab('SUBMISSIONS');
                        setSelectedAgent(agent);
                      }}
                      title={`Click to view field test logs by ${agent.name}`}
                    >
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                        {agent.tests} Tests
                      </span>
                    </td>

                    <td style={styles.td}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDueTestsAgent(agent);
                        }}
                        title={`Click to view ${agent.name}'s due tests and farmer details`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '7px',
                          backgroundColor: agent.overdueCount > 0 ? '#FEE2E2' : '#FEF3C7',
                          color: agent.overdueCount > 0 ? '#DC2626' : '#B45309',
                          fontSize: '12px',
                          fontWeight: '700',
                          border: agent.overdueCount > 0 ? '1px solid #FECACA' : '1px solid #FDE68A',
                          cursor: 'pointer'
                        }}
                        className="transition-transform active:scale-95 hover:shadow-xs cursor-pointer"
                      >
                        <Clock size={12} />
                        <span>{agent.dueTests} {agent.dueTests === 1 ? 'Test Due' : 'Tests Due'}</span>
                        <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredAgents.length === 0 && (
                  <tr>
                    <td colSpan="7" style={styles.emptyTd}>
                      No field technicians match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. AGENT DETAILS & MULTI-TAB MODAL (Profile, Farmers, Tanks, Tests) */}
      {/* ========================================================= */}
      {selectedAgent && createPortal(
        <div style={styles.modalBackdrop} onClick={() => setSelectedAgent(null)}>
          <div 
            style={{ ...styles.agentModalCard, maxWidth: '800px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }} 
            onClick={e => e.stopPropagation()}
            className="animate-modal-in"
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              backgroundColor: '#FFFFFF',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                <div style={styles.modalIconBox}>
                  <User size={22} color="#1A2FB8" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                      {selectedAgent.name}
                    </h3>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0' }}>
                      ● Active Field Tech
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0 0' }}>
                    📍 Cluster: <strong>{selectedAgent.locality}</strong> • 📞 <strong>{selectedAgent.mobile}</strong>
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedAgent(null)}
                style={styles.modalCloseBtn}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Agent Stats Grid (5 stats) */}
            <div style={{ padding: '14px 20px 0 20px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ ...styles.agentStatsGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', marginBottom: '14px' }}>
                <div 
                  style={{ ...styles.agentStatBox, cursor: 'pointer', backgroundColor: agentModalTab === 'FARMERS' ? '#EFF6FF' : '#FFFFFF' }}
                  onClick={() => setAgentModalTab('FARMERS')}
                  className="transition-transform active:scale-95 cursor-pointer"
                  title="Click to view assigned farmers"
                >
                  <span style={styles.miniLabel}>ASSIGNED FARMERS</span>
                  <span style={{ ...styles.agentStatsVal, color: '#1A2FB8' }}>{agentFarmers.length} Farmers</span>
                </div>
                <div 
                  style={{ ...styles.agentStatBox, cursor: 'pointer', backgroundColor: agentModalTab === 'TANKS' ? '#F0F9FF' : '#FFFFFF' }}
                  onClick={() => setAgentModalTab('TANKS')}
                  className="transition-transform active:scale-95 cursor-pointer"
                  title="Click to view supervised tanks"
                >
                  <span style={styles.miniLabel}>SUPERVISED TANKS</span>
                  <span style={{ ...styles.agentStatsVal, color: '#0284C7' }}>{selectedAgent.tanks} Tanks</span>
                </div>
                <div 
                  style={{ ...styles.agentStatBox, cursor: 'pointer', backgroundColor: agentModalTab === 'SUBMISSIONS' ? '#F0FDF4' : '#FFFFFF' }}
                  onClick={() => setAgentModalTab('SUBMISSIONS')}
                  className="transition-transform active:scale-95 cursor-pointer"
                  title="Click to view test submissions"
                >
                  <span style={styles.miniLabel}>TESTS LOGGED</span>
                  <span style={{ ...styles.agentStatsVal, color: '#16A34A' }}>{selectedAgent.tests} Tests</span>
                </div>
                <div 
                  style={{ ...styles.agentStatBox, cursor: 'pointer', border: '1px solid #FDE68A', backgroundColor: '#FFFDF5' }}
                  onClick={() => setDueTestsAgent(selectedAgent)}
                  className="transition-transform active:scale-95 hover:shadow-xs cursor-pointer"
                  title={`Click to view ${selectedAgent.name}'s due tests and farmer details`}
                >
                  <span style={styles.miniLabel}>TESTS DUE</span>
                  <span style={{ ...styles.agentStatsVal, color: '#D97706', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    {selectedAgent.dueTests} Due <ChevronRight size={13} />
                  </span>
                </div>
                <div style={styles.agentStatBox}>
                  <span style={styles.miniLabel}>TERRITORY</span>
                  <span style={styles.agentStatsVal}>{selectedAgent.locality}</span>
                </div>
              </div>

              {/* Tab Navigation Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
                {[
                  { key: 'PROFILE', label: '👤 Agent Overview', count: null },
                  { key: 'FARMERS', label: '🌾 Assigned Farmers', count: agentFarmers.length },
                  { key: 'TANKS', label: '💧 Supervised Tanks', count: agentAllTanks.length },
                  { key: 'SUBMISSIONS', label: '📝 Test Logs', count: agentSubmissions.length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setAgentModalTab(tab.key)}
                    style={{
                      padding: '8px 14px',
                      borderTopLeftRadius: '8px',
                      borderTopRightRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: agentModalTab === tab.key ? '800' : '600',
                      backgroundColor: agentModalTab === tab.key ? '#FFFFFF' : 'transparent',
                      color: agentModalTab === tab.key ? '#1A2FB8' : '#64748B',
                      border: 'none',
                      borderBottom: agentModalTab === tab.key ? '2px solid #1A2FB8' : '2px solid transparent',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    className="transition-all"
                  >
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        backgroundColor: agentModalTab === tab.key ? '#EFF6FF' : '#E2E8F0',
                        color: agentModalTab === tab.key ? '#1A2FB8' : '#475569'
                      }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Body Content */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, backgroundColor: '#F8FAFC' }}>
              
              {/* TAB 1: PROFILE & OVERVIEW */}
              {agentModalTab === 'PROFILE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: '0 0 10px 0' }}>
                      Technician Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>FULL NAME</span>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{selectedAgent.name}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>PHONE NUMBER</span>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{selectedAgent.mobile}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>ASSIGNED LOCALITY / CLUSTER</span>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{selectedAgent.locality}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>COMPLIANCE SCORE</span>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#16A34A', marginTop: '2px' }}>100% On-Time Testing</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                        Quick Portfolio Access
                      </h4>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setAgentModalTab('FARMERS')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px',
                          borderRadius: '10px',
                          backgroundColor: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        className="transition-transform active:scale-98"
                      >
                        <Users size={20} color="#1A2FB8" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#1A2FB8' }}>View All {agentFarmers.length} Farmers</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>Tap to inspect farmer details & ponds</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAgentModalTab('TANKS')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px',
                          borderRadius: '10px',
                          backgroundColor: '#F0F9FF',
                          border: '1px solid #BAE6FD',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        className="transition-transform active:scale-98"
                      >
                        <Droplets size={20} color="#0284C7" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0284C7' }}>View All {agentAllTanks.length} Tanks</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>Live ABW, Biomass, FCR telemetry</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ASSIGNED FARMERS */}
              {agentModalTab === 'FARMERS' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                      Assigned Farmers ({agentFarmers.length})
                    </h4>
                    <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                      Click any farmer to inspect details & tanks
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {agentFarmers.map((farmer) => (
                      <div
                        key={farmer.id}
                        style={styles.farmerCard}
                        onClick={() => setSelectedFarmer(farmer)}
                        className="transition-all duration-150 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <div>
                            <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A' }}>
                              {farmer.name}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                              📞 {farmer.phone}
                            </div>
                          </div>

                          <span style={styles.tanksCountBadge}>
                            <Droplets size={12} color="#0284C7" />
                            {farmer.tanks || farmer.tanksList?.length || 2} Tanks
                          </span>
                        </div>

                        <div style={styles.farmerMetaRow}>
                          <span style={styles.metaChip}>📍 {farmer.locality}</span>
                          <span style={styles.metaChip}>🌾 {farmer.acres} Acres</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFarmer(farmer);
                          }}
                          style={styles.inspectGrowthBtn}
                          className="transition-all duration-150 active:scale-98 cursor-pointer hover:bg-blue-900"
                        >
                          <span>Inspect Farmer & Tanks</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    ))}

                    {agentFarmers.length === 0 && (
                      <div style={styles.emptyFarmersBox}>
                        <Users size={24} color="#94A3B8" />
                        <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: '#64748B' }}>
                          No farmers assigned to this agent yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SUPERVISED TANKS */}
              {agentModalTab === 'TANKS' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                      Supervised Culture Tanks ({agentAllTanks.length})
                    </h4>
                    <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                      Click any farmer name to view full profile
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {agentAllTanks.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderLeft: `4px solid ${item.isHarvested ? '#94A3B8' : (item.isDue || item.isOverdue ? '#F59E0B' : '#10B981')}`,
                          borderRadius: '12px',
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                        }}
                      >
                        {/* Tank Header & Farmer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div>
                            <div 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                              onClick={() => setSelectedFarmer(item.rawFarmer)}
                              title="Click to view farmer details"
                            >
                              <span style={{ fontSize: '14px', fontWeight: '800', color: '#1A2FB8', textDecoration: 'underline' }}>
                                {item.farmerName}
                              </span>
                              <ChevronRight size={13} color="#1A2FB8" />
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                              📍 {item.farmerLocality} • 📞 {item.farmerPhone}
                            </div>
                          </div>

                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: item.isHarvested ? '#F1F5F9' : (item.isOverdue ? '#FEF2F2' : (item.isDue ? '#FEF3C7' : '#DCFCE7')),
                            color: item.isHarvested ? '#475569' : (item.isOverdue ? '#DC2626' : (item.isDue ? '#B45309' : '#15803D')),
                            border: `1px solid ${item.isHarvested ? '#CBD5E1' : (item.isOverdue ? '#FECACA' : (item.isDue ? '#FDE68A' : '#BBF7D0'))}`,
                            whiteSpace: 'nowrap',
                          }}>
                            {item.isHarvested ? 'Harvested' : (item.isOverdue ? 'Overdue' : (item.isDue ? 'Test Due' : 'Up to Date'))}
                          </span>
                        </div>

                        {/* Tank Strip */}
                        <div style={{ backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Droplets size={13} color="#1A2FB8" />
                              <strong style={{ fontSize: '13px', color: '#0F172A' }}>{item.name}</strong>
                              <span style={{ fontSize: '11.5px', color: '#64748B' }}>({item.size} • {item.species})</span>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#1A2FB8', backgroundColor: '#EFF6FF', padding: '1px 7px', borderRadius: '4px', border: '1px solid #DBEAFE' }}>
                              Day {item.doc} DOC
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                            <div style={{ backgroundColor: '#FFFFFF', padding: '5px', borderRadius: '5px', border: '1px solid #EDF2F7', textAlign: 'center' }}>
                              <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Weight (ABW)</div>
                              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A' }}>{item.abw}</div>
                            </div>
                            <div style={{ backgroundColor: '#FFFFFF', padding: '5px', borderRadius: '5px', border: '1px solid #EDF2F7', textAlign: 'center' }}>
                              <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Biomass</div>
                              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A' }}>{item.biomass}</div>
                            </div>
                            <div style={{ backgroundColor: '#FFFFFF', padding: '5px', borderRadius: '5px', border: '1px solid #EDF2F7', textAlign: 'center' }}>
                              <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Feed (FCR)</div>
                              <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#16A34A' }}>{item.fcr}</div>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedFarmer(item.rawFarmer)}
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              backgroundColor: '#FFFFFF',
                              color: '#1A2FB8',
                              border: '1px solid #BFDBFE',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            <User size={12} /> View Farmer Details
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedRoutineTank({ tank: item.rawTank, farmer: item.rawFarmer })}
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              backgroundColor: '#1A2FB8',
                              color: '#FFFFFF',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            <Calendar size={12} /> Routine Schedule
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: SUBMISSIONS */}
              {agentModalTab === 'SUBMISSIONS' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                      Field Test Records ({agentSubmissions.length})
                    </h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {agentSubmissions.map((sub, idx) => (
                      <div
                        key={sub.id || idx}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                            {sub.testType || sub.title || 'Water Quality Test'}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', backgroundColor: '#DCFCE7', padding: '2px 7px', borderRadius: '4px' }}>
                            Verified
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                          Farmer: <strong style={{ color: '#0F172A' }}>{sub.farmerName || 'Appala Raju'}</strong> • Tank: <strong>{sub.tankName || 'Tank 1'}</strong> • Date: {sub.date || 'Today'}
                        </div>
                      </div>
                    ))}

                    {agentSubmissions.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '30px', color: '#64748B', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <TestTube size={24} color="#94A3B8" style={{ margin: '0 auto 6px' }} />
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>No test submissions yet</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#FFFFFF' }}>
              <button 
                type="button"
                style={styles.closeBtnAction} 
                onClick={() => setSelectedAgent(null)}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 4. DEDICATED AGENT SUPERVISED TANKS MODAL */}
      {/* ========================================================= */}
      {selectedAgentTanks && createPortal(
        <div style={styles.modalBackdrop} onClick={() => setSelectedAgentTanks(null)}>
          <div 
            style={{ ...styles.agentModalCard, maxWidth: '720px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }} 
            onClick={e => e.stopPropagation()}
            className="animate-modal-in"
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              backgroundColor: '#FFFFFF',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                <div style={{ ...styles.modalIconBox, backgroundColor: '#F0F9FF', color: '#0284C7' }}>
                  <Droplets size={22} color="#0284C7" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                      {selectedAgentTanks.name}'s Supervised Tanks
                    </h3>
                    <span style={{ fontSize: '11.5px', fontWeight: '700', backgroundColor: '#F0F9FF', color: '#0284C7', padding: '2px 8px', borderRadius: '10px', border: '1px solid #BAE6FD' }}>
                      {selectedAgentTanksList.length} Tanks Total
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Cultivation ponds supervised by <strong>{selectedAgentTanks.name}</strong> across assigned farmers
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedAgentTanks(null)}
                style={styles.modalCloseBtn}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <Search size={14} color="#64748B" style={{ flexShrink: 0 }} />
                <input 
                  type="text"
                  placeholder="Search tank, farmer, or village..."
                  value={agentTanksSearch}
                  onChange={(e) => setAgentTanksSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '12px', color: '#0F172A', backgroundColor: 'transparent' }}
                />
                {agentTanksSearch && (
                  <button type="button" onClick={() => setAgentTanksSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <X size={13} color="#94A3B8" />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                {[
                  { key: 'ALL', label: `All (${selectedAgentTanksList.length})` },
                  { key: 'DUE', label: `Due (${selectedAgentTanksList.filter(t => t.isDue || t.isOverdue).length})` },
                  { key: 'ACTIVE', label: `Active (${selectedAgentTanksList.filter(t => !t.isHarvested).length})` },
                  { key: 'HARVESTED', label: `Harvested (${selectedAgentTanksList.filter(t => t.isHarvested).length})` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setAgentTanksFilter(tab.key)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: agentTanksFilter === tab.key ? '700' : '600',
                      backgroundColor: agentTanksFilter === tab.key ? '#0284C7' : '#FFFFFF',
                      color: agentTanksFilter === tab.key ? '#FFFFFF' : '#475569',
                      border: agentTanksFilter === tab.key ? '1px solid #0284C7' : '1px solid #CBD5E1',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                    className="transition-all"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tanks List */}
            <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1, backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredAgentTanks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748B', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <Droplets size={28} color="#94A3B8" style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontWeight: '700', color: '#0F172A', margin: '0 0 2px', fontSize: '13px' }}>No tanks found</p>
                  <span style={{ fontSize: '12px' }}>No tanks match your search or filter.</span>
                </div>
              ) : (
                filteredAgentTanks.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderLeft: `4px solid ${item.isHarvested ? '#94A3B8' : (item.isDue || item.isOverdue ? '#F59E0B' : '#10B981')}`,
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                    }}
                  >
                    {/* Top Row: Farmer info & Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                          onClick={() => setSelectedFarmer(item.rawFarmer)}
                          title="Click to view full farmer profile"
                        >
                          <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#1A2FB8', textDecoration: 'underline' }}>
                            {item.farmerName}
                          </span>
                          <ChevronRight size={13} color="#1A2FB8" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748B', marginTop: '2px', flexWrap: 'wrap' }}>
                          <span>📍 {item.farmerLocality}</span>
                          <span>•</span>
                          <span>📞 {item.farmerPhone}</span>
                        </div>
                      </div>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: item.isHarvested ? '#F1F5F9' : (item.isOverdue ? '#FEF2F2' : (item.isDue ? '#FEF3C7' : '#DCFCE7')),
                        color: item.isHarvested ? '#475569' : (item.isOverdue ? '#DC2626' : (item.isDue ? '#B45309' : '#15803D')),
                        border: `1px solid ${item.isHarvested ? '#CBD5E1' : (item.isOverdue ? '#FECACA' : (item.isDue ? '#FDE68A' : '#BBF7D0'))}`,
                        fontSize: '11px',
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        {item.isHarvested ? <CheckCircle2 size={11} color="#16A34A" /> : (item.isDue ? <Clock size={11} /> : <CheckCircle2 size={11} />)}
                        {item.isHarvested ? 'Harvested' : (item.isOverdue ? 'Overdue' : (item.isDue ? 'Test Due' : 'Up to Date'))}
                      </span>
                    </div>

                    {/* Tank Details & Telemetry */}
                    <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Droplets size={13} color="#0284C7" />
                          <strong style={{ fontSize: '13px', color: '#0F172A' }}>{item.name}</strong>
                          <span style={{ fontSize: '11.5px', color: '#64748B' }}>({item.size} • {item.species})</span>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#1A2FB8', backgroundColor: '#EFF6FF', padding: '1px 7px', borderRadius: '4px', border: '1px solid #DBEAFE' }}>
                          Day {item.doc} DOC
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        <div style={{ backgroundColor: '#FFFFFF', padding: '5px 4px', borderRadius: '5px', border: '1px solid #EDF2F7', textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Weight (ABW)</div>
                          <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A' }}>{item.abw}</div>
                        </div>

                        <div style={{ backgroundColor: '#FFFFFF', padding: '5px 4px', borderRadius: '5px', border: '1px solid #EDF2F7', textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Biomass</div>
                          <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A' }}>{item.biomass}</div>
                        </div>

                        <div style={{ backgroundColor: '#FFFFFF', padding: '5px 4px', borderRadius: '5px', border: '1px solid #EDF2F7', textAlign: 'center' }}>
                          <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Feed (FCR)</div>
                          <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#16A34A' }}>{item.fcr}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: '#64748B' }}>
                        <span>Last Test: <strong style={{ color: '#334155' }}>{item.lastTest}</strong></span>
                        <span>Next Due: <strong style={{ color: item.isDue ? '#B45309' : '#15803D' }}>{item.nextTest}</strong></span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedFarmer(item.rawFarmer)}
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          backgroundColor: '#FFFFFF',
                          color: '#1A2FB8',
                          border: '1px solid #BFDBFE',
                          padding: '7px 8px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                        className="transition-all hover:bg-blue-50 active:scale-95"
                      >
                        <User size={12} /> Farmer Details
                      </button>

                      {item.isHarvested ? (
                        <button
                          type="button"
                          onClick={() => setSelectedHarvestTank({
                            ...item.rawTank,
                            farmer: item.farmerName,
                            farmerId: item.farmerId,
                            locality: item.farmerLocality,
                            size: item.size
                          })}
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            border: '1px solid #FDE68A',
                            padding: '7px 8px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          <Scale size={12} /> Harvest Report
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedRoutineTank({ tank: item.rawTank, farmer: item.rawFarmer })}
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            backgroundColor: '#1A2FB8',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '7px 8px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                          className="transition-all hover:brightness-110 active:scale-95"
                        >
                          <Calendar size={12} /> Routine Schedule
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                style={styles.closeBtnAction} 
                onClick={() => setSelectedAgentTanks(null)}
              >
                Close Tanks View
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 5. FARMER DETAILS & TANKS GROWTH MODAL */}
      {/* ========================================================= */}
      {selectedFarmer && createPortal(
        <div style={styles.modalBackdrop} onClick={() => setSelectedFarmer(null)}>
          <div style={styles.farmerModalCard} onClick={e => e.stopPropagation()} className="animate-modal-in">
            {/* Header */}
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedFarmer(null)}
                  style={styles.backModalBtn}
                  title="Back"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h3 style={styles.modalTitle}>{selectedFarmer.name} — Farm & Growth Details</h3>
                  <p style={styles.modalSub}>
                    📍 {selectedFarmer.locality || selectedFarmer.location || selectedFarmer.village || 'Bhimavaram'} • 📞 {selectedFarmer.phone} • 🌾 {selectedFarmer.acres || 5} Acres Farm
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

            {/* Farmer Quick Bio Banner */}
            <div style={styles.farmerBioBanner}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.farmerBioIcon}>
                  <Fish size={18} color="#1A2FB8" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                    Assigned Field Technician: <span style={{ color: '#1A2FB8' }}>{selectedAgent?.name || 'Ramesh'}</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                    Water Source: {selectedFarmer.waterSource || 'Canal'} • Supervised Culture Tanks: {farmerTanks.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Tanks Growth & Telemetry Cards List */}
            <div style={{ marginTop: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Pond-by-Pond Culture Growth & Telemetry ({farmerTanks.length} Tanks)
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '520px', overflowY: 'auto' }}>
                {farmerTanks.map((tank, idx) => (
                  <div key={tank.id || idx} style={styles.tankGrowthCard}>
                    {/* Tank Top Bar */}
                    <div style={styles.tankCardHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={styles.tankIconBox}>
                          <Droplets size={16} color="#1A2FB8" />
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                            {tank.name || `Pond ${idx + 1}`}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                            Size: {tank.size || '2.5 Acres'} • {tank.stocking || '100,000 PL'} Stocking
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedHarvestTank({
                            ...tank,
                            farmer: selectedFarmer?.name,
                            farmerId: selectedFarmer?.id,
                            locality: selectedFarmer?.locality,
                            size: tank.size || '20 Acres'
                          })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #FDE68A',
                            cursor: 'pointer'
                          }}
                          className="transition-transform active:scale-95 hover:brightness-95 cursor-pointer"
                          title="View Full Harvest Records, Partial Cuts & Standing Crop"
                        >
                          <Scale size={12} color="#92400E" />
                          <span>Harvest Report</span>
                        </button>

                        <span style={tank.isHarvested ? styles.harvestedTagBtn : styles.activeCultureTag}>
                          <CheckCircle2 size={12} />
                          <span>{tank.isHarvested ? 'Harvested' : 'Active Culture'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Growth Metrics Grid */}
                    <div style={styles.growthGrid}>
                      <div style={styles.growthMetricBox}>
                        <span style={styles.growthLabel}>ABW (Body Wt)</span>
                        <span style={{ ...styles.growthVal, color: '#1A2FB8' }}>{tank.abw}</span>
                        <span style={styles.growthSub}>{tank.count}</span>
                      </div>

                      <div style={styles.growthMetricBox}>
                        <span style={styles.growthLabel}>Estimated Biomass</span>
                        <span style={styles.growthVal}>{tank.biomass}</span>
                        <span style={styles.growthSub}>Weekly Gain: {tank.weeklyGain}</span>
                      </div>

                      <div style={styles.growthMetricBox}>
                        <span style={styles.growthLabel}>Feed Ratio (FCR)</span>
                        <span style={{ ...styles.growthVal, color: '#16A34A' }}>{tank.fcr}</span>
                        <span style={styles.growthSub}>Daily Feed: {tank.feedRate}</span>
                      </div>

                      <div style={styles.growthMetricBox}>
                        <span style={styles.growthLabel}>Water Quality (DO / pH)</span>
                        <span style={styles.growthVal}>DO {tank.waterQuality?.do}</span>
                        <span style={styles.growthSub}>pH {tank.waterQuality?.ph} • Sal {tank.waterQuality?.salinity}</span>
                      </div>
                    </div>

                    {/* Tank Bottom Details */}
                    <div style={styles.tankDetailsFooter}>
                      <span>Feed: <b>{tank.feedBrand}</b></span>
                      <span>•</span>
                      <span>Ammonia: <b>{tank.waterQuality?.ammonia}</b></span>
                      <span>•</span>
                      <span>Alkalinity: <b>{tank.waterQuality?.alkalinity}</b></span>
                      <span>•</span>
                      <span>Survival: <b style={{ color: '#16A34A' }}>{tank.survival}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
              <button 
                type="button"
                style={styles.closeBtnAction} 
                onClick={() => setSelectedFarmer(null)}
              >
                Close Farmer View
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 6. WEEKLY ROUTINE SCHEDULE MODAL */}
      {/* ========================================================= */}
      {selectedRoutineTank && (
        <WeeklyRoutineScheduleModal
          tank={selectedRoutineTank.tank}
          farmer={selectedRoutineTank.farmer}
          onClose={() => setSelectedRoutineTank(null)}
        />
      )}

      {/* ========================================================= */}
      {/* 5. DUE TESTS & FARMER DETAILS MODAL (Clean & Intuitive) */}
      {/* ========================================================= */}
      {dueTestsAgent && createPortal(
        <div style={styles.modalBackdrop} onClick={() => setDueTestsAgent(null)}>
          <div 
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
            onClick={e => e.stopPropagation()}
            className="animate-modal-in"
          >
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              backgroundColor: '#FFFFFF',
              gap: '10px',
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: '800', color: '#D97706', letterSpacing: '0.4px', marginBottom: '2px', textTransform: 'uppercase' }}>
                  <TestTube size={12} style={{ flexShrink: 0 }} /> Field Sampling & Test Dues
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    {dueTestsAgent === 'ALL' ? 'All Pending Test Dues' : `${dueTestsAgent.name}'s Due Tests`}
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#FEF3C7', color: '#B45309', padding: '1px 8px', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                    {currentDueTanksList.length} Tests Pending
                  </span>
                </div>
                <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0', lineHeight: 1.3 }}>
                  Ponds requiring routine water quality, growth sampling, or feed audits
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDueTestsAgent(null)}
                style={styles.modalCloseBtn}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick KPI Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #F1F5F9'
            }}>
              <div style={{ backgroundColor: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                <span style={{ fontSize: '9.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block' }}>TOTAL DUE</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{currentDueTanksList.length} Tanks</span>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #FECACA', textAlign: 'center' }}>
                <span style={{ fontSize: '9.5px', color: '#DC2626', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block' }}>OVERDUE</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#DC2626' }}>
                  {currentDueTanksList.filter(t => t.isOverdue).length} Critical
                </span>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #BFDBFE', textAlign: 'center' }}>
                <span style={{ fontSize: '9.5px', color: '#1A2FB8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block' }}>FARMERS</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#1A2FB8' }}>
                  {new Set(currentDueTanksList.map(t => t.farmerName)).size} Impacted
                </span>
              </div>
            </div>

            {/* Search Filter & Remind Action Bar */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#FFFFFF', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F8FAFC', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', flex: 1, minWidth: 0 }}>
                <Search size={14} color="#64748B" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search tank, farmer, or technician..."
                  value={dueSearch}
                  onChange={(e) => setDueSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '12px', color: '#0F172A', backgroundColor: 'transparent' }}
                />
                {dueSearch && (
                  <button type="button" onClick={() => setDueSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <X size={13} color="#94A3B8" />
                  </button>
                )}
              </div>

              {filteredDueTanks.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    filteredDueTanks.forEach(item => {
                      if (addNotification) {
                        addNotification(
                          item.agentId || 'agent001',
                          `Incharge Reminder: ${item.testType || 'Routine Weekly Test'} is due for ${item.farmerName} • ${item.tankName}. Please complete field audit today.`,
                          'warning'
                        );
                      }
                    });
                    const allMap = {};
                    filteredDueTanks.forEach(item => { allMap[item.tankId] = true; });
                    setRemindedTanks(prev => ({ ...prev, ...allMap }));
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: '#1A2FB8',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                  className="transition-transform active:scale-95 hover:brightness-110"
                  title="Send reminders for all due tests"
                >
                  <Bell size={13} />
                  <span>Remind All ({filteredDueTanks.length})</span>
                </button>
              )}
            </div>

            {/* List of Due Test Cards */}
            <div style={{ padding: '12px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, backgroundColor: '#F8FAFC' }}>
              {filteredDueTanks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <CheckCircle2 size={30} color="#16A34A" style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontWeight: '700', color: '#0F172A', margin: '0 0 2px', fontSize: '13px' }}>All Tests Up to Date</p>
                  <span style={{ fontSize: '12px' }}>No due or overdue tests match your criteria.</span>
                </div>
              ) : (
                filteredDueTanks.map((item) => {
                  const isReminded = remindedTanks[item.tankId];
                  const whatsappMsg = `Hi ${item.agentName}, reminder from Incharge: Routine test "${item.testType}" is due for ${item.farmerName} (${item.tankName} - DOC ${item.doc} Days). Please record on the app today.`;
                  const cleanPhone = (item.agentPhone || '').replace(/\D/g, '');

                  return (
                    <div
                      key={item.tankId}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderLeft: `4px solid ${item.isOverdue ? '#DC2626' : '#F59E0B'}`,
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
                      }}
                    >
                      {/* Row 1: Farmer Info & Status Pill */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span 
                              style={{ fontSize: '14.5px', fontWeight: '800', color: '#1A2FB8', cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => {
                                const f = getFarmersByAgentId(item.agentId).find(f => f.id === item.farmerId) || {
                                  id: item.farmerId,
                                  name: item.farmerName,
                                  phone: item.farmerPhone,
                                  locality: item.farmerLocality,
                                  acres: item.farmerAcres
                                };
                                setDueTestsAgent(null);
                                setSelectedFarmer(f);
                              }}
                              title="Click to view full farmer profile"
                            >
                              {item.farmerName}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>
                              ({item.farmerAcres || 5} Acres Farm)
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748B', marginTop: '2px', flexWrap: 'wrap' }}>
                            <span>📍 {item.farmerLocality}</span>
                            <span>•</span>
                            <span>📞 {item.farmerPhone}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: item.isOverdue ? '#FEF2F2' : '#FEF3C7',
                          color: item.isOverdue ? '#DC2626' : '#B45309',
                          border: `1px solid ${item.isOverdue ? '#FECACA' : '#FDE68A'}`,
                          fontSize: '11px',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          {item.isOverdue ? <AlertCircle size={11} /> : <Clock size={11} />}
                          {item.isOverdue ? `Overdue (${item.scheduledDate})` : `Due: ${item.scheduledDate}`}
                        </span>
                      </div>

                      {/* Row 2: Tank Specifications & Required Test */}
                      <div style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Droplets size={13} color="#1A2FB8" style={{ flexShrink: 0 }} />
                            <strong style={{ fontSize: '13px', color: '#0F172A' }}>{item.tankName}</strong>
                            <span style={{ fontSize: '11.5px', color: '#64748B' }}>({item.size})</span>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#1A2FB8', backgroundColor: '#EFF6FF', padding: '1px 7px', borderRadius: '4px', border: '1px solid #DBEAFE' }}>
                            Day {item.doc} DOC
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', fontSize: '11.5px' }}>
                          <span style={{ color: '#0F172A', fontWeight: '600' }}>
                            🧪 Required: <strong style={{ color: '#1A2FB8' }}>{item.testType}</strong>
                          </span>
                          <span style={{ color: '#64748B' }}>
                            Weight: <strong style={{ color: '#16A34A' }}>{item.abw}</strong>
                          </span>
                        </div>

                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          👤 Assigned Tech: <strong style={{ color: '#0F172A' }}>{item.agentName}</strong> (📞 {item.agentPhone})
                        </div>
                      </div>

                      {/* Row 3: Symmetrical Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '2px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const f = getFarmersByAgentId(item.agentId).find(f => f.id === item.farmerId) || {
                              id: item.farmerId,
                              name: item.farmerName,
                              phone: item.farmerPhone,
                              locality: item.farmerLocality,
                              acres: item.farmerAcres
                            };
                            setDueTestsAgent(null);
                            setSelectedFarmer(f);
                          }}
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            backgroundColor: '#FFFFFF',
                            color: '#1A2FB8',
                            border: '1px solid #BFDBFE',
                            padding: '7px 8px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                          className="transition-all hover:bg-blue-50 active:scale-95"
                        >
                          <User size={12} /> View Farmer
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (addNotification) {
                              addNotification(
                                item.agentId || 'agent001',
                                `Incharge Reminder: ${item.testType || 'Routine Weekly Test'} is due for ${item.farmerName} • ${item.tankName}. Please complete field audit today.`,
                                'warning'
                              );
                            }
                            setRemindedTanks(prev => ({ ...prev, [item.tankId]: true }));
                          }}
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            backgroundColor: isReminded ? '#DCFCE7' : '#FFFFFF',
                            color: isReminded ? '#15803D' : '#334155',
                            border: isReminded ? '1px solid #BBF7D0' : '1px solid #CBD5E1',
                            padding: '7px 8px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                          className="transition-all active:scale-95"
                          title={`Send in-app reminder to ${item.agentName}`}
                        >
                          {isReminded ? <Check size={12} /> : <Bell size={12} color="#D97706" />}
                          <span>{isReminded ? 'Reminded' : 'Remind Tech'}</span>
                        </button>

                        {cleanPhone && (
                          <a
                            href={`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappMsg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '7px 8px',
                              borderRadius: '8px',
                              border: '1px solid #BBF7D0',
                              backgroundColor: '#F0FDF4',
                              color: '#16A34A',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              textDecoration: 'none',
                              cursor: 'pointer'
                            }}
                            className="transition-all hover:bg-green-100 active:scale-95"
                            title={`Send WhatsApp message to ${item.agentName}`}
                          >
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                style={styles.closeBtnAction} 
                onClick={() => setDueTestsAgent(null)}
              >
                Close Due Tests
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Harvest Completed Modal if clicked */}
      {selectedHarvestTank && (
        <HarvestCompletedModal 
          isOpen={Boolean(selectedHarvestTank)}
          tank={selectedHarvestTank}
          farmer={selectedFarmer || { name: selectedHarvestTank.farmer, location: selectedHarvestTank.locality }}
          onClose={() => setSelectedHarvestTank(null)}
        />
      )}
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
    boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
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
  addAgentBtn: {
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
    minWidth: '760px',
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
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '12px 14px',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
  },
  agentAvatar: {
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
  agentName: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#0F172A',
  },
  agentIdTag: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '500',
  },
  countBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#0F172A',
    whiteSpace: 'nowrap',
  },
  progressBar: {
    width: '50px',
    height: '6px',
    backgroundColor: '#E2E8F0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: '3px',
  },
  complianceText: {
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#16A34A',
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
  viewPortfolioBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #BFDBFE',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(3px)',
    zIndex: 99999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px',
    boxSizing: 'border-box',
  },
  agentModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '88vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    border: '1px solid #E2E8F0',
    boxSizing: 'border-box',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '14px',
    borderBottom: '1px solid #F1F5F9',
    gap: '10px',
  },
  modalIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: '15.5px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
    lineHeight: 1.3,
  },
  modalSub: {
    fontSize: '11.5px',
    color: '#64748B',
    margin: '3px 0 0 0',
    lineHeight: 1.3,
  },
  modalCloseBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#64748B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  agentStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginTop: '14px',
  },
  agentStatBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  agentStatsVal: {
    fontSize: '13.5px',
    fontWeight: '800',
    color: '#0F172A',
    display: 'block',
  },
  miniLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    display: 'block',
  },
  farmerCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  farmerAvatarPill: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13.5px',
    fontWeight: '800',
    flexShrink: 0,
  },
  tanksCountBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    backgroundColor: '#F0F9FF',
    border: '1px solid #BAE6FD',
    color: '#0284C7',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: '700',
    flexShrink: 0,
  },
  farmerMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  metaChip: {
    fontSize: '11.5px',
    color: '#475569',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '2px 8px',
    borderRadius: '6px',
    fontWeight: '500',
  },
  inspectGrowthBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '100%',
    padding: '8px 14px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  emptyFarmersBox: {
    padding: '30px 16px',
    textAlign: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    border: '1px dashed #CBD5E1',
  },
  closeBtnAction: {
    padding: '8px 18px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  farmerModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '780px',
    maxHeight: '92vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    border: '1px solid #E2E8F0',
    boxSizing: 'border-box',
  },
  backModalBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#F1F5F9',
    border: '1px solid #CBD5E1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#475569',
  },
  farmerBioBanner: {
    backgroundColor: '#F0F9FF',
    border: '1px solid #BAE6FD',
    borderRadius: '10px',
    padding: '12px 14px',
    marginTop: '14px',
  },
  farmerBioIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tankGrowthCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
  },
  tankCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '12px',
    borderBottom: '1px solid #F1F5F9',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tankIconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  docBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #DBEAFE',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: '800',
  },
  harvestedTagBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    border: '1px solid #FDE68A',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '800',
    cursor: 'pointer',
  },
  activeCultureTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    backgroundColor: '#DCFCE7',
    color: '#16A34A',
    border: '1px solid #BBF7D0',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '800',
  },
  growthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '10px',
    marginTop: '12px',
  },
  growthMetricBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  growthLabel: {
    fontSize: '10.5px',
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  growthVal: {
    fontSize: '14.5px',
    fontWeight: '800',
    color: '#0F172A',
  },
  growthSub: {
    fontSize: '10.5px',
    color: '#64748B',
    fontWeight: '500',
  },
  tankDetailsFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11.5px',
    color: '#475569',
    marginTop: '10px',
    paddingTop: '8px',
    borderTop: '1px dashed #E2E8F0',
    flexWrap: 'wrap',
  },
};

export default Agents;
