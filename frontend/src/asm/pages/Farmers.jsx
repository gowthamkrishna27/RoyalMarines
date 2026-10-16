import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Plus, Check, AlertTriangle,
  ChevronRight, X, Phone, ArrowLeft,
  Fish, Droplets, Scale, FileText
} from 'lucide-react';
import { useMockData, deduplicateFarmers } from '../../context/MockDataContext';
import { getAsmBasePath } from '../utils/asmNavigation';
import { getInchargeSession } from '../utils/inchargeAuth';
import QuickRecordModal from '../../agent/components/QuickRecordModal';

const Farmers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const base = getAsmBasePath(location.pathname);
  const session = getInchargeSession ? getInchargeSession() : null;
  const currentInchargeId = session?.inchargeId || session?.id || 'INC001';

  const { db, getAgentsByInchargeId, getTanksByFarmerId, refreshDb } = useMockData();

  // Search, filter, and modal states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'DUE' | 'UP_TO_DATE'
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  // Quick Record Modal State for ASM
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedRecordFarmerId, setSelectedRecordFarmerId] = useState(null);
  const [selectedRecordTankId, setSelectedRecordTankId] = useState(null);

  // 1. Retrieve all agents under this ASM
  const inchargeAgents = useMemo(() => {
    const list = getAgentsByInchargeId ? getAgentsByInchargeId(currentInchargeId) : [];
    if (list && list.length > 0) return list;
    return (db?.agents || []).filter(a =>
      a.inchargeId === currentInchargeId || a.incharge_id === currentInchargeId || !a.inchargeId
    );
  }, [getAgentsByInchargeId, currentInchargeId, db?.agents]);

  const inchargeAgentIds = useMemo(() => {
    return inchargeAgents.map(a => String(a.id || '').trim().toLowerCase());
  }, [inchargeAgents]);

  const agentMap = useMemo(() => {
    const map = new Map();
    (db?.agents || []).forEach(a => {
      if (a?.id) {
        map.set(String(a.id).trim().toLowerCase(), a);
      }
    });
    return map;
  }, [db?.agents]);

  // 2. Retrieve all farmers managed under these agents
  const farmersUnderAgents = useMemo(() => {
    const allFarmers = db?.farmers || [];
    let list = allFarmers.filter(f => {
      if (!f) return false;
      const fAgentId = String(f.agentId || f.agent_id || '').trim().toLowerCase();
      return fAgentId && inchargeAgentIds.includes(fAgentId);
    });

    // Fallback if specific incharge filter yields empty in test/dev
    if (list.length === 0) {
      list = allFarmers.filter(f => f.agentId || f.agent_id);
    }

    return deduplicateFarmers ? deduplicateFarmers(list) : list;
  }, [db?.farmers, inchargeAgentIds]);

  // 3. Process farmer items with tanks & status
  const farmerItems = useMemo(() => {
    return farmersUnderAgents.map((farmer, fIdx) => {
      const tanks = getTanksByFarmerId
        ? getTanksByFarmerId(farmer.id)
        : (db?.tanks || []).filter(t => t.farmerId === farmer.id);

      const fAgentId = String(farmer.agentId || farmer.agent_id || '').trim().toLowerCase();
      const assignedAgent = agentMap.get(fAgentId) || { name: 'Field Agent', id: fAgentId || 'N/A' };

      const formattedTanks = tanks.map((t, tIdx) => {
        const doc = t.doc || (35 + ((fIdx * 12 + tIdx * 18) % 65));
        const abw = t.abw || `${(12.5 + ((fIdx * 3.1 + tIdx * 2.8) % 18)).toFixed(1)}g`;
        const biomass = t.biomass || `${(2200 + ((fIdx * 450 + tIdx * 320) % 2800))} kg`;
        const size = t.size || `${t.acres || 2.5} Acres`;
        const species = t.species || 'Vannamei (Shrimp)';
        const isHarvested = t.status === 'Harvested' || t.status === 'Completed' || t.finalHarvestCompleted;
        const isDue = !isHarvested && (t.testStatus === 'Due' || t.testStatus === 'Pending' || (!t.testStatus && tIdx === 0));
        const isOverdue = !isHarvested && (t.testStatus === 'Overdue' || (tIdx === 1));

        return {
          ...t,
          rawTank: t,
          rawFarmer: farmer,
          farmerName: farmer.name,
          farmerPhone: farmer.phone,
          farmerLocality: farmer.village || farmer.location || 'Bhimavaram',
          doc,
          abw,
          biomass,
          size,
          species,
          isDue,
          isOverdue,
          isHarvested,
          lastTest: t.lastTested || '3 days ago',
          nextTest: isOverdue ? 'Overdue today' : (isDue ? 'Due Tomorrow' : 'In 5 days')
        };
      });

      const dueTanksCount = formattedTanks.filter(t => t.isDue || t.isOverdue).length;
      const hasPendingTest = dueTanksCount > 0;

      const village = farmer.village || farmer.location || 'Bhimavaram';
      const district = farmer.district || farmer.region || 'West Godavari';
      const agentText = assignedAgent.name ? ` • Agent: ${assignedAgent.name}` : '';
      const locationSubtitle = `${village}, ${district}${agentText}`;

      return {
        ...farmer,
        village,
        district,
        locationSubtitle,
        assignedAgentName: assignedAgent.name || 'Assigned Agent',
        assignedAgentId: assignedAgent.id,
        tanksList: formattedTanks,
        tankCount: formattedTanks.length || parseInt(farmer.numberOfTanks) || 1,
        testStatus: hasPendingTest ? 'Test Due' : 'Up to date',
        isDue: hasPendingTest,
      };
    });
  }, [farmersUnderAgents, getTanksByFarmerId, db?.tanks, agentMap]);

  // Counts for filter chips
  const dueCount = useMemo(() => farmerItems.filter(f => f.isDue).length, [farmerItems]);
  const upToDateCount = useMemo(() => farmerItems.filter(f => !f.isDue).length, [farmerItems]);

  // Filtered farmers based on search and tab selection
  const filteredFarmers = useMemo(() => {
    return farmerItems.filter(f => {
      if (filterMode === 'DUE' && !f.isDue) return false;
      if (filterMode === 'UP_TO_DATE' && f.isDue) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (f.name || '').toLowerCase().includes(q);
        const matchesLoc = (f.locationSubtitle || '').toLowerCase().includes(q);
        const matchesPhone = (f.phone || '').includes(q);
        return matchesName || matchesLoc || matchesPhone;
      }
      return true;
    });
  }, [farmerItems, filterMode, searchQuery]);

  const farmerTanks = selectedFarmer ? (selectedFarmer.tanksList || []) : [];

  return (
    <>
      <div style={styles.container}>
        {/* Clean Header */}
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.headerTitle}>Farmers</h1>
          </div>

          <button
            type="button"
            className="transition-all duration-150 active:scale-95 cursor-pointer"
            style={styles.addFarmerBtn}
            onClick={() => navigate(`${base}/add-farmer`)}
          >
            <Plus size={16} strokeWidth={2.8} />
            <span>Add Farmer</span>
          </button>
        </div>

        {/* Search Bar */}
        <div style={styles.searchBox}>
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search farmers, tanks, or village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button style={styles.clearBtn} onClick={() => setSearchQuery('')} type="button">
              <X size={14} color="#94A3B8" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div style={styles.filterTabs}>
          <button
            type="button"
            style={{
              ...styles.tabBtn,
              backgroundColor: filterMode === 'ALL' ? '#1A2FB8' : '#FFFFFF',
              color: filterMode === 'ALL' ? '#FFFFFF' : '#475569',
              borderColor: filterMode === 'ALL' ? '#1A2FB8' : '#E2E8F0',
              fontWeight: filterMode === 'ALL' ? '700' : '600',
            }}
            onClick={() => setFilterMode('ALL')}
          >
            <span>All ({farmerItems.length})</span>
          </button>

          <button
            type="button"
            style={{
              ...styles.tabBtn,
              backgroundColor: filterMode === 'DUE' ? '#D97706' : '#FFFFFF',
              color: filterMode === 'DUE' ? '#FFFFFF' : '#D97706',
              borderColor: filterMode === 'DUE' ? '#D97706' : '#FED7AA',
              fontWeight: filterMode === 'DUE' ? '700' : '600',
            }}
            onClick={() => setFilterMode('DUE')}
          >
            <AlertTriangle size={13} color={filterMode === 'DUE' ? '#FFFFFF' : '#D97706'} />
            <span style={{ marginLeft: '4px' }}>Test Due ({dueCount})</span>
          </button>

          <button
            type="button"
            style={{
              ...styles.tabBtn,
              backgroundColor: filterMode === 'UP_TO_DATE' ? '#16A34A' : '#FFFFFF',
              color: filterMode === 'UP_TO_DATE' ? '#FFFFFF' : '#16A34A',
              borderColor: filterMode === 'UP_TO_DATE' ? '#16A34A' : '#BBF7D0',
              fontWeight: filterMode === 'UP_TO_DATE' ? '700' : '600',
            }}
            onClick={() => setFilterMode('UP_TO_DATE')}
          >
            <Check size={13} strokeWidth={3} color={filterMode === 'UP_TO_DATE' ? '#FFFFFF' : '#16A34A'} />
            <span style={{ marginLeft: '4px' }}>Up to date ({upToDateCount})</span>
          </button>
        </div>

        {/* Farmers List Cards */}
        <div style={styles.farmersList}>
          {filteredFarmers.length === 0 ? (
            <div style={styles.emptyState}>
              <span>No farmers found.</span>
            </div>
          ) : (
            filteredFarmers.map((farmer) => (
              <div
                key={farmer.id}
                style={styles.farmerCard}
                onClick={() => setSelectedFarmer(farmer)}
                className="transition-all hover:border-slate-300 hover:shadow-sm active:scale-[0.99] cursor-pointer"
              >
                <div style={styles.cardLeft}>
                  <span style={styles.farmerName}>{farmer.name}</span>
                  <span style={styles.farmerLocation}>
                    {farmer.locationSubtitle}
                  </span>
                </div>

                <div style={styles.cardRight}>
                  {farmer.isDue ? (
                    <span style={styles.statusDue}>
                      <AlertTriangle size={11} strokeWidth={2.5} color="#D97706" />
                      <span>Test Due</span>
                    </span>
                  ) : (
                    <span style={styles.statusUpToDate}>
                      <Check size={11} strokeWidth={2.5} color="#16A34A" />
                      <span>Up to date</span>
                    </span>
                  )}
                  <ChevronRight size={14} color="#94A3B8" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* FARMER DETAILS & TANKS POPUP MODAL (Consistent with My Farmers) */}
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
                  <h3 style={styles.modalTitle}>{selectedFarmer.name}</h3>
                  <p style={styles.modalSub}>
                    {selectedFarmer.village}, {selectedFarmer.district} • {farmerTanks.length} {farmerTanks.length === 1 ? 'Tank' : 'Tanks'} • Agent: {selectedFarmer.assignedAgentName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFarmer(null)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            {/* Farmer Quick Bio Banner */}
            <div style={styles.farmerBioBanner}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={styles.farmerBioIcon}>
                    <Fish size={17} color="#1A2FB8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                      {selectedFarmer.name} • {selectedFarmer.phone || '+91 98480 12345'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      {selectedFarmer.village}, {selectedFarmer.district} • Agent: {selectedFarmer.assignedAgentName} • {farmerTanks.length} Ponds
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedFarmer.phone && (
                    <a
                      href={`tel:${selectedFarmer.phone}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: '#1A2FB8',
                        color: '#FFFFFF',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textDecoration: 'none'
                      }}
                      className="hover:bg-blue-900 transition-all active:scale-95"
                    >
                      <Phone size={13} />
                      <span>Call</span>
                    </a>
                  )}

                  {/* Log Record Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRecordFarmerId(selectedFarmer.id);
                      setSelectedRecordTankId(farmerTanks[0]?.id || null);
                      setIsRecordModalOpen(true);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: '#0F172A',
                      color: '#FFFFFF',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    className="hover:bg-slate-800 transition-all active:scale-95"
                  >
                    <Plus size={13} strokeWidth={2.8} />
                    <span>New Record</span>
                  </button>

                  {/* Harvest Action */}
                  <button
                    type="button"
                    onClick={() => {
                      const fId = selectedFarmer.id;
                      const tId = farmerTanks[0]?.id || '';
                      setSelectedFarmer(null);
                      navigate(`${base}/harvest?farmerId=${fId}&tankId=${tId}`);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: '#EFF6FF',
                      color: '#1A2FB8',
                      border: '1px solid #BFDBFE',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                    className="hover:bg-blue-100 transition-all active:scale-95"
                  >
                    <Scale size={13} />
                    <span>Harvest</span>
                  </button>

                  {/* View Full Profile */}
                  <button
                    type="button"
                    onClick={() => {
                      const fId = selectedFarmer.id;
                      setSelectedFarmer(null);
                      navigate(`${base}/farmers/${fId}`);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: '#FFFFFF',
                      color: '#475569',
                      border: '1px solid #E2E8F0',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                    className="hover:bg-slate-50 transition-all active:scale-95"
                  >
                    <FileText size={13} />
                    <span>Full Profile</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Farmer Tanks Section with direct navigation */}
            <div style={{ marginTop: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Active Tanks ({farmerTanks.length})
                </h4>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '12px'
              }}>
                {farmerTanks.map((tank, idx) => (
                  <button
                    key={tank.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedFarmer(null);
                      navigate(`${base}/tanks/${tank.id || tank.rawTank?.id || `T${idx + 1}`}`, {
                        state: { farmer: selectedFarmer, tank: tank.rawTank || tank }
                      });
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '1.5px solid #E2E8F0',
                      backgroundColor: '#FFFFFF',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
                    }}
                    className="transition-all hover:border-blue-600 hover:shadow-md hover:bg-blue-50/10 active:scale-[0.98] cursor-pointer"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          backgroundColor: '#EFF6FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1A2FB8',
                          flexShrink: 0
                        }}>
                          <Droplets size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                            {tank.name || `Tank ${idx + 1}`}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                            {tank.species || 'Vannamei'} • {tank.size || `${tank.acres || 2.5} Acres`}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} color="#94A3B8" />
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      marginTop: '2px',
                      paddingTop: '8px',
                      borderTop: '1px solid #F1F5F9'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#1A2FB8',
                        backgroundColor: '#EFF6FF',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        Day {tank.doc || 45} DOC
                      </span>
                      {tank.isHarvested ? (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#475569',
                          backgroundColor: '#F1F5F9',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          Harvested
                        </span>
                      ) : tank.isDue ? (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#B45309',
                          backgroundColor: '#FEF3C7',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          Test Due
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#15803D',
                          backgroundColor: '#DCFCE7',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          Up to date
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                style={styles.closeBtnAction}
                onClick={() => setSelectedFarmer(null)}
              >
                Close Farmer Details
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Quick Record Modal for logging test as ASM */}
      {isRecordModalOpen && (
        <QuickRecordModal
          isOpen={isRecordModalOpen}
          onClose={() => {
            setIsRecordModalOpen(false);
            setSelectedRecordFarmerId(null);
            setSelectedRecordTankId(null);
          }}
          preselectedFarmerId={selectedRecordFarmerId}
          preselectedTankId={selectedRecordTankId}
          userRole="ASM"
          onSuccess={() => {
            setIsRecordModalOpen(false);
            if (refreshDb) refreshDb();
          }}
        />
      )}
    </>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    width: '100%',
    padding: '16px',
    maxWidth: '1200px',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '2px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0F172A',
    margin: '2px 0 0 0',
    letterSpacing: '-0.02em',
  },
  addFarmerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    minHeight: '36px',
    padding: '0 14px',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '0 14px',
    minHeight: '42px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    fontSize: '13.5px',
    color: '#0F172A',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
  },
  filterTabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    paddingBottom: '2px',
  },
  tabBtn: {
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
  },
  farmersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  farmerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '13px 16px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  cardLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
    flex: 1,
  },
  farmerName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: '1.25',
  },
  farmerLocation: {
    fontSize: '12.5px',
    fontWeight: '400',
    color: '#64748B',
    lineHeight: '1.25',
  },
  cardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  statusUpToDate: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    padding: '3px 9px',
    borderRadius: '20px',
  },
  statusDue: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    padding: '3px 9px',
    borderRadius: '20px',
  },
  emptyState: {
    padding: '36px 16px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '13.5px',
    fontWeight: '500',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
  },

  // Modal styles
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    zIndex: 99999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px',
    boxSizing: 'border-box',
  },
  farmerModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '820px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    border: '1px solid #E2E8F0',
    padding: '20px',
    overflowY: 'auto',
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
  modalTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  modalSub: {
    fontSize: '12px',
    color: '#64748B',
    margin: '3px 0 0 0',
  },
  backModalBtn: {
    background: '#F1F5F9',
    border: 'none',
    borderRadius: '8px',
    padding: '6px',
    color: '#475569',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '4px',
  },
  farmerBioBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    padding: '12px 14px',
    marginTop: '14px',
    border: '1px solid #E2E8F0',
  },
  farmerBioIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  closeBtnAction: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#475569',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

export default Farmers;
