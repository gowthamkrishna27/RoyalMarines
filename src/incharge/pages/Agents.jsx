import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import HarvestCompletedModal from '../components/HarvestCompletedModal';
import { 
  Search, Filter, Eye, X, Phone, MapPin, 
  Users, Droplets, TestTube, CheckCircle2, ShieldCheck, 
  User, Layers, TrendingUp, Scale, Fish, Activity, ChevronRight, ArrowLeft, Clock
} from 'lucide-react';

const Agents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocality, setFilterLocality] = useState('ALL');
  const { db, getFarmersByAgentId, getTanksByFarmerId, getSubmissionsByAgentId, getAgentsByInchargeId } = useMockData();
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [selectedHarvestTank, setSelectedHarvestTank] = useState(null);

  const inchargeAgentsList = getAgentsByInchargeId ? getAgentsByInchargeId('INC001') : (db?.agents || []);
  const agents = inchargeAgentsList.map(a => {
    const farmers = getFarmersByAgentId(a.id);
    const tanks = farmers.reduce((acc, f) => acc + getTanksByFarmerId(f.id).length, 0);
    const tests = getSubmissionsByAgentId(a.id).length;
    const compliance = 100;
    return { 
      ...a, 
      mobile: a.phone || a.mobile || '+91 98480 22334', 
      farmers: farmers.length, 
      tanks, 
      tests, 
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
                  <th style={styles.th}>Compliance</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => (
                  <tr 
                    key={agent.id} 
                    style={styles.tr}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={styles.agentAvatar}>
                          {agent.name ? agent.name[0] : 'A'}
                        </div>
                        <div>
                          <div style={styles.agentName}>{agent.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>Field Tech</div>
                        </div>
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

                    <td style={styles.td}>
                      <span style={styles.countBadge}>
                        <Users size={12} color="#1A2FB8" />
                        {agent.farmers} Farmers
                      </span>
                    </td>

                    <td style={styles.td}>
                      <span style={styles.countBadge}>
                        <Droplets size={12} color="#0284C7" />
                        {agent.tanks} Tanks
                      </span>
                    </td>

                    <td style={styles.td}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                        {agent.tests}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={styles.progressBar}>
                          <div style={{ ...styles.progressFill, width: `${agent.compliance}%` }} />
                        </div>
                        <span style={styles.complianceText}>{agent.compliance}%</span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <span style={styles.statusPill}>
                        <CheckCircle2 size={12} /> {agent.status}
                      </span>
                    </td>

                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <button 
                        type="button"
                        style={styles.viewPortfolioBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAgent(agent);
                        }}
                        title="View Agent's Farmers"
                        className="transition-all duration-150 active:scale-95 cursor-pointer"
                      >
                        <Users size={14} />
                        <span>View Farmers</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredAgents.length === 0 && (
                  <tr>
                    <td colSpan="9" style={styles.emptyTd}>
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
      {/* 3. AGENT'S FARMERS BREAKDOWN MODAL (Level 1 Drill-Down) */}
      {/* ========================================================= */}
      {selectedAgent && createPortal(
        <div style={styles.modalBackdrop} onClick={() => setSelectedAgent(null)}>
          <div style={styles.agentModalCard} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
                <div style={styles.modalIconBox}>
                  <Users size={20} color="#1A2FB8" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={styles.modalTitle}>{selectedAgent.name}'s Farmers</h3>
                  <p style={styles.modalSub}>
                    Field Tech • 📍 {selectedAgent.locality} • 📞 {selectedAgent.mobile}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedAgent(null)}
                style={styles.modalCloseBtn}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Agent Stats Grid (2x2 Grid) */}
            <div style={styles.agentStatsGrid}>
              <div style={styles.agentStatBox}>
                <span style={styles.miniLabel}>ASSIGNED FARMERS</span>
                <span style={styles.agentStatsVal}>{agentFarmers.length} Farmers</span>
              </div>
              <div style={styles.agentStatBox}>
                <span style={styles.miniLabel}>SUPERVISED TANKS</span>
                <span style={{ ...styles.agentStatsVal, color: '#0284C7' }}>{selectedAgent.tanks} Ponds</span>
              </div>
              <div style={styles.agentStatBox}>
                <span style={styles.miniLabel}>COMPLIANCE</span>
                <span style={{ ...styles.agentStatsVal, color: '#16A34A' }}>{selectedAgent.compliance}%</span>
              </div>
              <div style={styles.agentStatBox}>
                <span style={styles.miniLabel}>TERRITORY</span>
                <span style={styles.agentStatsVal}>{selectedAgent.locality}</span>
              </div>
            </div>

            {/* Farmers List Section */}
            <div style={{ marginTop: '18px' }}>
              <div style={{ marginBottom: '10px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Assigned Farmers Portfolio ({agentFarmers.length})
                </h4>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                  Tap any farmer to inspect tanks & shrimp growth
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '2px' }}>
                {agentFarmers.map((farmer) => (
                  <div
                    key={farmer.id}
                    style={styles.farmerCard}
                    onClick={() => setSelectedFarmer(farmer)}
                    className="transition-all duration-150 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={styles.farmerAvatarPill}>
                          {farmer.name ? farmer.name[0] : 'F'}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>
                            {farmer.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                            📞 {farmer.phone}
                          </div>
                        </div>
                      </div>

                      <span style={styles.tanksCountBadge}>
                        <Droplets size={12} color="#0284C7" />
                        {farmer.tanks || farmer.tanksList?.length || 2} Ponds
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
                      <span>Inspect Tanks & Growth</span>
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

            {/* Modal Footer */}
            <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
              <button 
                type="button"
                style={styles.closeBtnAction} 
                onClick={() => setSelectedAgent(null)}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 4. FARMER DETAILS & TANKS GROWTH MODAL (Level 2 Drill-Down) */}
      {/* ========================================================= */}
      {selectedFarmer && createPortal(
        <div style={styles.modalBackdrop} onClick={() => setSelectedFarmer(null)}>
          <div style={styles.farmerModalCard} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedFarmer(null)}
                  style={styles.backModalBtn}
                  title="Back to Agent's Farmers"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h3 style={styles.modalTitle}>{selectedFarmer.name} — Farm & Growth Details</h3>
                  <p style={styles.modalSub}>
                    📍 {selectedFarmer.locality} • 📞 {selectedFarmer.phone} • 🌾 {selectedFarmer.acres || 5} Acres Farm
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
                    Assigned Field Technician: <span style={{ color: '#1A2FB8' }}>{selectedAgent?.name || 'Agent A'}</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                    Water Source: {selectedFarmer.waterSource || 'Canal'} • Supervised Culture Ponds: {farmerTanks.length}
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
                        <span style={styles.docBadge}>
                          <Clock size={12} /> Day {tank.doc} DOC
                        </span>

                        {tank.isHarvested ? (
                          <button
                            type="button"
                            onClick={() => setSelectedHarvestTank(tank)}
                            style={styles.harvestedTagBtn}
                          >
                            <CheckCircle2 size={12} />
                            <span>Harvest Completed</span>
                          </button>
                        ) : (
                          <span style={styles.activeCultureTag}>
                            <Activity size={12} />
                            <span>Active Culture</span>
                          </span>
                        )}
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

      {/* Harvest Completed Modal if clicked */}
      {selectedHarvestTank && (
        <HarvestCompletedModal 
          tank={selectedHarvestTank}
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
