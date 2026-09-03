import React, { useState } from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { 
  Search, Filter, Eye, X, Plus, Droplets, MapPin, 
  User, Calendar, CheckCircle2, Clock, AlertCircle, Edit3, Shield, UserCheck, Award 
} from 'lucide-react';
import TankModal from '../../components/TankModal';
import HarvestCompletedModal from '../components/HarvestCompletedModal';

const MyTanks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTank, setSelectedTank] = useState(null);
  const [selectedHarvestTank, setSelectedHarvestTank] = useState(null);
  const [isTankModalOpen, setIsTankModalOpen] = useState(false);
  const [editingTank, setEditingTank] = useState(null);
  const { db, getFarmerById, getAgentById, getMyTanksByInchargeId } = useMockData();
  
  // Personal Tanks specifically allocated to this Incharge (INC001) by Admin
  const inchargeTanksList = getMyTanksByInchargeId ? getMyTanksByInchargeId('INC001') : [];
  
  const myTanks = inchargeTanksList.map(t => {
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
      status: status,
      rawTank: t
    };
  });

  const filteredTanks = myTanks
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

  const activeTanksCount = myTanks.filter(t => t.status !== 'Harvested').length;
  const harvestedCount = myTanks.filter(t => t.status === 'Harvested').length;
  const pendingCount = myTanks.filter(t => t.status === 'Pending Verification').length;

  const handleOpenNewTank = () => {
    setEditingTank(null);
    setIsTankModalOpen(true);
  };

  const handleEditTank = (tank) => {
    setEditingTank(tank.rawTank || tank);
    setIsTankModalOpen(true);
  };

  return (
    <>
      <InchargeHeader 
        title="My Tanks" 
      />

      <div style={{ padding: '24px 28px', maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* Admin Assigned Personal Portfolio Banner */}
        <div style={styles.adminBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.adminBannerIcon}>
              <Shield size={18} color="#1A2FB8" />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
                Admin Assigned Personal Tanks & Ponds
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                These cultivation tanks are directly assigned to Incharge Ravi Kumar for dedicated supervision, sampling, and growth auditing.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={styles.adminAllocPill}>
              <Droplets size={13} /> {myTanks.length} Assigned Tanks
            </span>
            <button
              type="button"
              onClick={handleOpenNewTank}
              style={styles.newTankBannerBtn}
              className="transition-all duration-150 active:scale-98 cursor-pointer"
            >
              <Plus size={15} />
              <span>New Tank</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Bar */}
        <div style={styles.summaryBar}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>My Personal Tanks</span>
            <span style={styles.summaryValue}>{myTanks.length}</span>
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
                  placeholder="Search my tanks by name, farmer, or village..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
              </div>

              <div style={styles.filterPillGroup}>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  style={{
                    ...styles.filterPill,
                    backgroundColor: statusFilter === 'ALL' ? '#1A2FB8' : '#F8FAFC',
                    color: statusFilter === 'ALL' ? '#FFFFFF' : '#475569',
                    borderColor: statusFilter === 'ALL' ? '#1A2FB8' : '#E2E8F0',
                  }}
                >
                  All ({myTanks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  style={{
                    ...styles.filterPill,
                    backgroundColor: statusFilter === 'ACTIVE' ? '#1A2FB8' : '#F8FAFC',
                    color: statusFilter === 'ACTIVE' ? '#FFFFFF' : '#475569',
                    borderColor: statusFilter === 'ACTIVE' ? '#1A2FB8' : '#E2E8F0',
                  }}
                >
                  Active ({activeTanksCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('HARVESTED')}
                  style={{
                    ...styles.filterPill,
                    backgroundColor: statusFilter === 'HARVESTED' ? '#1A2FB8' : '#F8FAFC',
                    color: statusFilter === 'HARVESTED' ? '#FFFFFF' : '#475569',
                    borderColor: statusFilter === 'HARVESTED' ? '#1A2FB8' : '#E2E8F0',
                  }}
                >
                  Harvested ({harvestedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('PENDING')}
                  style={{
                    ...styles.filterPill,
                    backgroundColor: statusFilter === 'PENDING' ? '#1A2FB8' : '#F8FAFC',
                    color: statusFilter === 'PENDING' ? '#FFFFFF' : '#475569',
                    borderColor: statusFilter === 'PENDING' ? '#1A2FB8' : '#E2E8F0',
                  }}
                >
                  Pending ({pendingCount})
                </button>
              </div>
            </div>

            <button 
              type="button"
              style={styles.addBtn}
              onClick={handleOpenNewTank}
              className="transition-all duration-150 active:scale-98 cursor-pointer"
            >
              <Plus size={16} />
              <span>New Tank</span>
            </button>
          </div>

          {/* Table */}
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
                  const isHarvested = tank.status === 'Harvested';
                  const isPending = tank.status === 'Pending Verification';

                  return (
                    <tr key={tank.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            ...styles.tankIconBox,
                            backgroundColor: isHarvested ? '#F1F5F9' : '#EFF6FF',
                            color: isHarvested ? '#64748B' : '#1A2FB8'
                          }}>
                            <Droplets size={16} />
                          </div>
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>{tank.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>DOC: Day {tank.doc}</div>
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} color="#1A2FB8" />
                          <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0F172A' }}>{tank.farmer}</span>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#475569' }}>
                          <MapPin size={13} color="#64748B" />
                          <span>{tank.locality}</span>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                          {tank.size}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: '600' }}>
                          {tank.agent}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={{ fontSize: '12.5px', color: '#64748B' }}>{tank.lastTest}</span>
                      </td>

                      <td style={styles.td}>
                        <span style={{ fontSize: '12.5px', color: '#1A2FB8', fontWeight: '700' }}>{tank.nextDue}</span>
                      </td>

                      <td style={styles.td}>
                        {isHarvested ? (
                          <button
                            type="button"
                            onClick={() => setSelectedHarvestTank(rawTank || tank)}
                            style={{ ...styles.harvestedBadge, cursor: 'pointer', border: 'none' }}
                            className="transition-transform active:scale-95 hover:opacity-90"
                            title="Click to view full harvest, FCR, biomass & shrimp counts"
                          >
                            <Award size={11} /> ✓ Harvest Completed
                          </button>
                        ) : isPending ? (
                          <span style={styles.pendingBadge}>
                            <AlertCircle size={11} /> Pending Review
                          </span>
                        ) : (
                          <span style={styles.activeBadge}>
                            <CheckCircle2 size={11} /> Active Culture
                          </span>
                        )}
                      </td>

                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (isHarvested) {
                                setSelectedHarvestTank(rawTank || tank);
                              } else {
                                setSelectedTank(tank);
                              }
                            }}
                            style={styles.actionBtn}
                            title={isHarvested ? "View Full Harvest & FCR Details" : "Quick Inspect"}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditTank(tank)}
                            style={{ ...styles.actionBtn, color: '#475569' }}
                            title="Edit Parameters"
                          >
                            <Edit3 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredTanks.length === 0 && (
                  <tr>
                    <td colSpan="9" style={styles.emptyTd}>
                      No assigned tanks found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Inspect Modal */}
      {selectedTank && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedTank(null)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.tankIconBox}>
                  <Droplets size={18} color="#1A2FB8" />
                </div>
                <div>
                  <h3 style={styles.modalTitle}>{selectedTank.name}</h3>
                  <p style={styles.modalSub}>Farmer: {selectedTank.farmer} • {selectedTank.locality}</p>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
              <div style={styles.infoTile}>
                <span style={styles.infoLabel}>Culture Cycle</span>
                <span style={styles.infoValue}>Day {selectedTank.doc}</span>
              </div>
              <div style={styles.infoTile}>
                <span style={styles.infoLabel}>Pond Size</span>
                <span style={styles.infoValue}>{selectedTank.size}</span>
              </div>
              <div style={styles.infoTile}>
                <span style={styles.infoLabel}>Assigned Technician</span>
                <span style={{ ...styles.infoValue, color: '#1A2FB8' }}>{selectedTank.agent}</span>
              </div>
              <div style={styles.infoTile}>
                <span style={styles.infoLabel}>Status</span>
                <span style={{ ...styles.infoValue, color: selectedTank.status === 'Harvested' ? '#64748B' : '#16A34A' }}>
                  {selectedTank.status}
                </span>
              </div>
              <div style={styles.infoTile}>
                <span style={styles.infoLabel}>Last Sample Test</span>
                <span style={styles.infoValue}>{selectedTank.lastTest}</span>
              </div>
              <div style={styles.infoTile}>
                <span style={styles.infoLabel}>Next Audit Due</span>
                <span style={{ ...styles.infoValue, color: '#1A2FB8' }}>{selectedTank.nextDue}</span>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => { const t = selectedTank; setSelectedTank(null); handleEditTank(t); }}
                style={styles.editFullBtn}
              >
                <Edit3 size={14} />
                <span>Edit Full Parameters</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTank(null)}
                style={styles.closeBtn}
              >
                Close
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

      {/* Add / Edit Tank Modal */}
      {isTankModalOpen && (
        <TankModal
          isOpen={isTankModalOpen}
          onClose={() => { setIsTankModalOpen(false); setEditingTank(null); }}
          tank={editingTank}
          defaultAgentId="agent001"
        />
      )}
    </>
  );
};

const styles = {
  adminBanner: {
    backgroundColor: '#EFF6FF',
    border: '1px solid #DBEAFE',
    borderRadius: '12px',
    padding: '14px 20px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  adminBannerIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#DBEAFE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  adminAllocPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    fontSize: '12px',
    fontWeight: '700',
    padding: '5px 14px',
    borderRadius: '20px',
  },
  newTankBannerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '20px',
    padding: '5px 14px',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(22, 163, 74, 0.25)',
  },
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
    gap: '12px',
    flex: 1,
    maxWidth: '850px',
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
    minWidth: '220px',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '13px',
    color: '#0F172A',
    width: '100%',
  },
  filterPillGroup: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterPill: {
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
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
  tankIconBox: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activeBadge: {
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
  harvestedBadge: {
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
  pendingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#FEF3C7',
    color: '#B45309',
  },
  actionBtn: {
    padding: '6px 10px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #DBEAFE',
    borderRadius: '6px',
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
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '14px',
    borderBottom: '1px solid #F1F5F9',
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
  infoTile: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #F1F5F9',
    borderRadius: '8px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  infoLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#0F172A',
  },
  editFullBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #DBEAFE',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  closeBtn: {
    padding: '8px 16px',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default MyTanks;
