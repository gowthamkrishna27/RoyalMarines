import React, { useState } from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { 
  Search, Filter, Eye, X, Plus, Droplets, MapPin, 
  User, Calendar, CheckCircle2, Clock, AlertCircle, Edit3, Award 
} from 'lucide-react';
import TankModal from '../../components/TankModal';
import HarvestCompletedModal from '../components/HarvestCompletedModal';

const Tanks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTank, setSelectedTank] = useState(null);
  const [selectedHarvestTank, setSelectedHarvestTank] = useState(null);
  const [isTankModalOpen, setIsTankModalOpen] = useState(false);
  const [editingTank, setEditingTank] = useState(null);
  const { db, getFarmerById, getAgentById, getTanksByInchargeId } = useMockData();
  
  const allTanksList = db?.tanks || [];
  const mockInchargeTanks = allTanksList.map(t => {
    const farmer = getFarmerById(t.farmerId);
    const agent = getAgentById(t.agentId);
    const hasPending = (db?.submissions || []).some(s => s.tankId === t.id && s.status === 'PENDING_VERIFICATION');
    let status = t.status === 'Harvested' ? 'Harvested' : (t.testStatus || 'Active');
    if (hasPending) status = 'Pending Verification';

    return {
      id: t.id,
      name: t.name || (t.id ? `Tank ${t.id.replace(/\D/g, '') || '1'}` : 'Tank 1'),
      farmer: farmer ? farmer.name : 'Ravi',
      locality: farmer ? (farmer.location || farmer.village || 'Bhimavaram') : 'Bhimavaram',
      agent: agent ? agent.name : 'Direct Incharge',
      size: t.size || '2.0 Acres',
      doc: t.doc || 45,
      lastTest: t.lastTest || '22 Aug',
      nextDue: t.nextTest || '29 Aug',
      status: status
    };
  });

  const filteredTanks = mockInchargeTanks
    .filter(tank => {
      const matchesSearch = 
        tank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tank.farmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tank.locality.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (statusFilter === 'ACTIVE') return matchesSearch && tank.status !== 'Harvested';
      if (statusFilter === 'HARVESTED') return matchesSearch && tank.status === 'Harvested';
      if (statusFilter === 'PENDING') return matchesSearch && tank.status === 'Pending Verification';
      return matchesSearch;
    })
    .sort((a, b) => {
      const farmerDiff = (a.farmer || '').localeCompare(b.farmer || '', undefined, { sensitivity: 'base' });
      if (farmerDiff !== 0) return farmerDiff;
      return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
    });

  const activeTanksCount = mockInchargeTanks.filter(t => t.status !== 'Harvested').length;
  const harvestedCount = mockInchargeTanks.filter(t => t.status === 'Harvested').length;
  const pendingCount = mockInchargeTanks.filter(t => t.status === 'Pending Verification').length;

  return (
    <>
      <InchargeHeader 
        title="Tanks" 
      />

      <div style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto' }}>
        {/* Quick Summary Bar */}
        <div style={styles.summaryBar}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Tanks</span>
            <span style={styles.summaryValue}>{mockInchargeTanks.length}</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Active Culture</span>
            <span style={{ ...styles.summaryValue, color: '#1A2FB8' }}>{activeTanksCount} Tanks</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Harvested & Closed</span>
            <span style={{ ...styles.summaryValue, color: '#64748B' }}>{harvestedCount} Tanks</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Pending Audit</span>
            <span style={{ ...styles.summaryValue, color: '#D97706' }}>{pendingCount} Records</span>
          </div>
        </div>

        {/* Main Table Card */}
        <div style={styles.mainCard}>
          <div style={styles.actionBar}>
            <div style={styles.searchGroup}>
              <div style={styles.searchBox}>
                <Search size={17} color="#64748B" />
                <input 
                  type="text" 
                  placeholder="Search tanks by tank name, farmer, or village..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
              </div>

              <div style={styles.tabGroup}>
                <button 
                  type="button" 
                  style={{ ...styles.tabPill, ...(statusFilter === 'ALL' ? styles.activeTabPill : {}) }}
                  onClick={() => setStatusFilter('ALL')}
                >
                  All ({mockInchargeTanks.length})
                </button>
                <button 
                  type="button" 
                  style={{ ...styles.tabPill, ...(statusFilter === 'ACTIVE' ? styles.activeTabPill : {}) }}
                  onClick={() => setStatusFilter('ACTIVE')}
                >
                  Active ({activeTanksCount})
                </button>
                <button 
                  type="button" 
                  style={{ ...styles.tabPill, ...(statusFilter === 'PENDING' ? styles.activeTabPill : {}) }}
                  onClick={() => setStatusFilter('PENDING')}
                >
                  Pending Audit ({pendingCount})
                </button>
              </div>
            </div>

            <button 
              type="button"
              className="transition-all duration-150 active:scale-98 cursor-pointer"
              style={styles.addTankBtn}
              onClick={() => { setEditingTank(null); setIsTankModalOpen(true); }}
            >
              <Plus size={16} />
              <span>Add New Tank</span>
            </button>
          </div>

          {/* Data Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Tank / Pond</th>
                  <th style={styles.th}>Farmer Name</th>
                  <th style={styles.th}>Village / Area</th>
                  <th style={styles.th}>Pond Size</th>
                  <th style={styles.th}>Assigned Technician</th>
                  <th style={styles.th}>Last Test</th>
                  <th style={styles.th}>Next Audit</th>
                  <th style={styles.th}>Culture Status</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTanks.map((tank) => {
                  const rawTank = (db?.tanks || []).find(t => t.id === tank.id);
                  const isPending = tank.status === 'Pending Verification';
                  const isHarvested = tank.status === 'Harvested';

                  return (
                    <tr key={tank.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={styles.tankIconCircle}>
                            <Droplets size={15} color="#1A2FB8" />
                          </div>
                          <div>
                            <div style={styles.tankTitle}>{tank.name}</div>
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>
                          {tank.farmer}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#475569' }}>
                          <MapPin size={12} color="#1A2FB8" />
                          <span>{tank.locality}</span>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.sizeBadge}>{tank.size}</span>
                      </td>

                      <td style={styles.td}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
                          {tank.agent}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={{ fontSize: '12.5px', color: '#64748B' }}>{tank.lastTest}</span>
                      </td>

                      <td style={styles.td}>
                        <span style={{ fontSize: '12.5px', color: '#1A2FB8', fontWeight: '600' }}>{tank.nextDue}</span>
                      </td>

                      <td style={styles.td}>
                        {isPending ? (
                          <span style={styles.pendingPill}>
                            <Clock size={11} /> Pending Review
                          </span>
                        ) : isHarvested ? (
                          <button
                            type="button"
                            onClick={() => setSelectedHarvestTank(rawTank || tank)}
                            style={{ ...styles.harvestedPill, cursor: 'pointer', border: 'none' }}
                            className="transition-transform active:scale-95 hover:opacity-90"
                            title="Click to view full harvest, FCR, biomass & shrimp counts"
                          >
                            <Award size={12} /> ✓ Harvest Completed
                          </button>
                        ) : (
                          <span style={styles.activePill}>
                            <CheckCircle2 size={11} /> Active Culture
                          </span>
                        )}
                      </td>

                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button 
                            type="button"
                            style={styles.actionIconBtn}
                            onClick={() => {
                              if (isHarvested) {
                                setSelectedHarvestTank(rawTank || tank);
                              } else {
                                setSelectedTank(tank);
                              }
                            }}
                            title={isHarvested ? "View Full Harvest & FCR Details" : "View Tank Parameters"}
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            type="button"
                            style={styles.editBtn}
                            onClick={() => {
                              setEditingTank(rawTank || { id: tank.id, name: tank.name });
                              setIsTankModalOpen(true);
                            }}
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredTanks.length === 0 && (
                  <tr>
                    <td colSpan="9" style={styles.emptyTd}>
                      No tanks found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inspect Active Tank Modal */}
      {selectedTank && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedTank(null)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.modalIconBox}>
                  <Droplets size={20} color="#1A2FB8" />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>{selectedTank.name}</h3>
                  <p style={styles.modalSub}>{selectedTank.farmer} • {selectedTank.locality}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTank(null)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Farmer:</span>
                <span style={styles.detailValue}>{selectedTank.farmer}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Pond Size:</span>
                <span style={styles.detailValue}>{selectedTank.size}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Assigned Technician:</span>
                <span style={{ ...styles.detailValue, color: '#1A2FB8' }}>{selectedTank.agent}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Last Test Date:</span>
                <span style={styles.detailValue}>{selectedTank.lastTest}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Next Scheduled Audit:</span>
                <span style={{ ...styles.detailValue, color: '#16A34A' }}>{selectedTank.nextDue}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Status:</span>
                <span style={{ ...styles.detailValue, fontWeight: '800' }}>{selectedTank.status}</span>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                style={styles.saveBtn} 
                onClick={() => setSelectedTank(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Harvest Completed Comprehensive Modal */}
      {selectedHarvestTank && (
        <HarvestCompletedModal
          isOpen={Boolean(selectedHarvestTank)}
          onClose={() => setSelectedHarvestTank(null)}
          tank={selectedHarvestTank}
          farmer={getFarmerById(selectedHarvestTank?.farmerId) || { name: selectedHarvestTank?.farmer, location: selectedHarvestTank?.locality }}
        />
      )}

      {/* Edit / Add Tank Modal */}
      {isTankModalOpen && (
        <TankModal
          isOpen={isTankModalOpen}
          onClose={() => setIsTankModalOpen(false)}
          tank={editingTank}
          onSuccess={() => {
            setIsTankModalOpen(false);
          }}
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
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
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
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    maxWidth: '700px',
    flexWrap: 'wrap',
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
    minWidth: '260px',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '13px',
    color: '#0F172A',
    width: '100%',
  },
  tabGroup: {
    display: 'flex',
    gap: '6px',
  },
  tabPill: {
    padding: '6px 12px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    cursor: 'pointer',
  },
  activeTabPill: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    color: '#1A2FB8',
    fontWeight: '700',
  },
  addTankBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
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
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '14px',
    verticalAlign: 'middle',
  },
  tankIconCircle: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tankTitle: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#0F172A',
  },
  tankIdTag: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '500',
  },
  sizeBadge: {
    display: 'inline-flex',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    fontSize: '12px',
    fontWeight: '600',
    color: '#334155',
  },
  pendingPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  harvestedPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  activePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  actionIconBtn: {
    padding: '6px 8px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #DBEAFE',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  editBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    backgroundColor: '#F8FAFC',
    color: '#334155',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyTd: {
    padding: '32px',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '13px',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(2px)',
    zIndex: 60,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '14px',
    borderBottom: '1px solid #F1F5F9',
  },
  modalIconBox: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  modalSub: {
    fontSize: '12px',
    color: '#64748B',
    margin: '2px 0 0 0',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    border: '1px solid #F1F5F9',
  },
  detailLabel: {
    fontSize: '12.5px',
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  saveBtn: {
    padding: '10px 20px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

export default Tanks;
