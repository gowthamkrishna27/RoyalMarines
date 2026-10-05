import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Plus, Check, AlertTriangle,
  ChevronRight, X, UserCheck, Users, Phone,
  ArrowLeft, Fish, Droplets, Scale, Calendar, AlertCircle
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getAsmBasePath } from '../utils/asmNavigation';
import HarvestCompletedModal from '../components/HarvestCompletedModal';
import WeeklyRoutineScheduleModal from '../components/WeeklyRoutineScheduleModal';

const MyFarmers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const base = getAsmBasePath(location.pathname);
  const { db, getMyFarmersByInchargeId, getTanksByFarmerId, getAgentsByInchargeId } = useMockData();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [selectedTankIndex, setSelectedTankIndex] = useState(0);
  const [selectedRoutineTank, setSelectedRoutineTank] = useState(null);
  const [selectedHarvestTank, setSelectedHarvestTank] = useState(null);

  // Incharge / ASM assigned farmers
  const inchargeFarmers = getMyFarmersByInchargeId ? getMyFarmersByInchargeId('INC001') : [];
  const farmerList = inchargeFarmers.length > 0
    ? inchargeFarmers
    : (db?.farmers || []).filter(f => f.inchargeId === 'INC001' && (!f.agentId || f.assignedTo === 'Incharge'));

  const inchargeAgents = getAgentsByInchargeId ? getAgentsByInchargeId('INC001') : (db?.agents || []);

  const farmerItems = farmerList.map((farmer, fIdx) => {
    const tanks = getTanksByFarmerId ? getTanksByFarmerId(farmer.id) : (db?.tanks || []).filter(t => t.farmerId === farmer.id);
    const hasPendingTest = tanks.some(p => p.testStatus === 'Pending' || p.testStatus === 'Overdue' || p.testStatus === 'Due');

    const formattedTanks = tanks.map((t, tIdx) => {
      const doc = t.doc || (35 + ((fIdx * 12 + tIdx * 18) % 65));
      const abw = t.abw || `${(12.5 + ((fIdx * 3.1 + tIdx * 2.8) % 18)).toFixed(1)}g`;
      const biomass = t.biomass || `${(2200 + ((fIdx * 450 + tIdx * 320) % 2800))} kg`;
      const fcr = t.fcr || (1.2 + ((fIdx + tIdx) % 5) * 0.08).toFixed(2);
      const size = t.size || `${t.acres || 2.5} Acres`;
      const species = t.species || 'Vannamei (Shrimp)';
      const stocking = t.stockingCount || (80000 + ((fIdx + tIdx) * 15000));
      const feedBrand = t.feedBrand || 'Royals Supreme Pellets';
      const isDue = t.testStatus === 'Due' || t.testStatus === 'Pending' || (!t.testStatus && tIdx === 0);
      const isOverdue = t.testStatus === 'Overdue' || (tIdx === 1);

      const waterQuality = {
        do: `${(5.4 + ((fIdx + tIdx) % 4) * 0.4).toFixed(1)} ppm`,
        ph: `${(7.6 + ((fIdx + tIdx) % 5) * 0.2).toFixed(1)}`,
        salinity: `${12 + (fIdx + tIdx) % 8} ppt`,
        ammonia: `${(0.04 + ((fIdx + tIdx) % 5) * 0.02).toFixed(2)} ppm`,
        alkalinity: `${120 + ((fIdx + tIdx) % 6) * 5} ppm`
      };

      return {
        ...t,
        rawTank: t,
        rawFarmer: farmer,
        farmerName: farmer.name,
        farmerPhone: farmer.phone,
        farmerLocality: farmer.village || farmer.location || 'Chinnamiram',
        doc,
        abw,
        biomass,
        fcr,
        size,
        species,
        stocking,
        feedBrand,
        waterQuality,
        isDue,
        isOverdue,
        isHarvested: t.status === 'Harvested',
        lastTest: t.lastTested || '3 days ago',
        nextTest: isOverdue ? 'Overdue today' : (isDue ? 'Due Tomorrow' : 'In 5 days')
      };
    });

    const regionName = farmer.region || farmer.zone || farmer.district || 'Coastal Region';
    const localityName = farmer.locality || farmer.village || farmer.location || 'Chinnamiram';

    return {
      ...farmer,
      regionName,
      localityName,
      region: regionName,
      locality: localityName,
      villageName: localityName,
      tankCount: formattedTanks.length || parseInt(farmer.numberOfTanks) || 1,
      testStatus: hasPendingTest ? 'Test Due' : 'Up to date',
      isDue: hasPendingTest,
      tanksList: formattedTanks
    };
  });

  const dueCount = farmerItems.filter(f => f.isDue).length;
  const upToDateCount = farmerItems.filter(f => !f.isDue).length;

  const filteredFarmers = farmerItems.filter(f => {
    if (filterMode === 'DUE' && !f.isDue) return false;
    if (filterMode === 'UP_TO_DATE' && f.isDue) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        (f.regionName || '').toLowerCase().includes(q) ||
        (f.localityName || '').toLowerCase().includes(q) ||
        (f.villageName || '').toLowerCase().includes(q) ||
        (f.phone || '').includes(q)
      );
    }
    return true;
  });

  const farmerTanks = selectedFarmer ? (selectedFarmer.tanksList || getTanksByFarmerId(selectedFarmer.id) || []) : [];
  const activeTank = farmerTanks[selectedTankIndex] || farmerTanks[0];

  return (
    <>
      <div style={styles.container}>
        {/* Top Work Category Switcher: My Farmers vs My Agents (Mobile Only, Hidden on Desktop) */}
        <div className="flex lg:hidden items-center mb-1">
          <div style={{
            display: 'flex',
            width: '100%',
            backgroundColor: '#F1F5F9',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            gap: '4px'
          }}>
            <button
              type="button"
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '9px 12px',
                borderRadius: '9px',
                border: 'none',
                fontSize: '13.5px',
                fontWeight: '800',
                cursor: 'pointer',
                backgroundColor: '#1A2FB8',
                color: '#FFFFFF',
                boxShadow: '0 2px 6px rgba(26, 47, 184, 0.28)',
                transition: 'all 0.15s ease'
              }}
              className="transition-all active:scale-98"
            >
              <UserCheck size={16} />
              <span>My Farmers</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                padding: '2px 6px',
                borderRadius: '10px',
                backgroundColor: '#FFFFFF',
                color: '#1A2FB8',
                marginLeft: '2px'
              }}>
                {farmerItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate(`${base}/agents`)}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '9px 12px',
                borderRadius: '9px',
                border: 'none',
                fontSize: '13.5px',
                fontWeight: '800',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: '#475569',
                transition: 'all 0.15s ease'
              }}
              className="transition-all active:scale-98"
            >
              <Users size={16} />
              <span>My Agents</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                padding: '2px 6px',
                borderRadius: '10px',
                backgroundColor: '#E2E8F0',
                color: '#475569',
                marginLeft: '2px'
              }}>
                {inchargeAgents.length}
              </span>
            </button>
          </div>
        </div>

        {/* Header */}
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.headerTitle}>My Farmers</h1>
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

        {/* Farmers List Cards or Empty State */}
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
                onClick={() => {
                  setSelectedFarmer(farmer);
                  setSelectedTankIndex(0);
                }}
                className="transition-all hover:border-slate-300 hover:shadow-sm active:scale-[0.99] cursor-pointer"
              >
                <div style={styles.cardLeft}>
                  <span style={styles.farmerName}>{farmer.name}</span>
                  <span style={styles.farmerLocation}>
                    {farmer.localityName || farmer.villageName || farmer.locality || 'Chinnamiram'}, {farmer.regionName || farmer.region || 'Coastal Region'}
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
      {/* FARMER DETAILS & TANKS GROWTH MODAL */}
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
                    {selectedFarmer.locality || selectedFarmer.localityName || selectedFarmer.villageName || selectedFarmer.village || 'Chinnamiram'}, {selectedFarmer.region || selectedFarmer.regionName || 'Coastal Region'} • {selectedFarmer.acres || 5} Acres
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
                      {selectedFarmer.locality || selectedFarmer.localityName || selectedFarmer.villageName || selectedFarmer.village || 'Chinnamiram'}, {selectedFarmer.region || selectedFarmer.regionName || 'Coastal Region'} • Water: {selectedFarmer.waterSource || 'Canal'} • {farmerTanks.length} Ponds
                    </div>
                  </div>
                </div>

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
                    <span>Call Farmer</span>
                  </a>
                )}
              </div>
            </div>

            {/* Farmer Tanks Section with direct redirection */}
            <div style={{ marginTop: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    ({farmerTanks.length})
                  </h4>
                  <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0 0' }}>

                  </p>
                </div>
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

            {/* Footer */}
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

      {/* Routine Schedule Modal */}
      {selectedRoutineTank && (
        <WeeklyRoutineScheduleModal
          tank={selectedRoutineTank.tank}
          farmer={selectedRoutineTank.farmer}
          onClose={() => setSelectedRoutineTank(null)}
        />
      )}

      {/* Harvest Modal */}
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
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
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
  farmerBioBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '12px 14px',
    marginTop: '14px',
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
  tankGrowthCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  tankCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tankIconBox: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  docBadge: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#1A2FB8',
    backgroundColor: '#EFF6FF',
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1px solid #DBEAFE',
  },
  dueBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    border: '1px solid #FDE68A',
  },
  overdueBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FECACA',
  },
  okBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    border: '1px solid #BBF7D0',
  },
  harvestedBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: '1px solid #CBD5E1',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  metricCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    padding: '8px 10px',
    border: '1px solid #F1F5F9',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  metricLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#0F172A',
  },
  metricSub: {
    fontSize: '10px',
    color: '#94A3B8',
  },
  waterBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    padding: '10px 12px',
    border: '1px solid #E2E8F0',
  },
  paramBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: '6px',
    padding: '6px',
    textAlign: 'center',
    border: '1px solid #EDF2F7',
  },
  paramLabel: {
    fontSize: '9.5px',
    fontWeight: '700',
    color: '#64748B',
    display: 'block',
  },
  paramVal: {
    fontSize: '12px',
    fontWeight: '800',
    color: '#0F172A',
    display: 'block',
    marginTop: '2px',
  },
  closeBtnAction: {
    padding: '8px 18px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#F8FAFC',
    color: '#334155',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
  }
};

export default MyFarmers;
