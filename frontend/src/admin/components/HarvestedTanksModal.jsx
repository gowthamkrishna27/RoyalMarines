import React, { useState } from 'react';
import { X, CheckCircle2, Search, Scale, User, MapPin } from 'lucide-react';
import HarvestReportModal from './HarvestReportModal';
import { useMockData } from '../../context/MockDataContext';

const HarvestedTanksModal = ({ onClose, tanks = null, farmers = null, harvests = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTank, setSelectedTank] = useState(null);
  const mockData = useMockData();
  const db = mockData?.db;
  
  const tanksList = Array.isArray(tanks) && tanks.length > 0 ? tanks : (db?.tanks || []);
  const farmersList = Array.isArray(farmers) && farmers.length > 0 ? farmers : (db?.farmers || []);
  const harvestsList = Array.isArray(harvests) && harvests.length > 0 ? harvests : (db?.harvests || []);

  // Get harvested tanks from genuine DB records
  const rawHarvestedTanks = tanksList.filter(t => (t.status || '').toUpperCase() === 'HARVESTED');
  
  // Map them to include farmer info
  const harvestedTanks = rawHarvestedTanks.map(tank => {
    const farmer = farmersList.find(f => String(f.id) === String(tank.farmerId || tank.farmer_id));
    return {
      ...tank,
      farmer: farmer?.name || tank.farmerName || 'Unknown Farmer',
      location: farmer?.location || farmer?.village || tank.location || 'Unknown Location',
      extent: farmer?.acres ? `${farmer.acres} Acres` : tank.size || 'Unknown Size'
    };
  });

  // Calculate genuine statistics
  const totalClosedCount = harvestedTanks.length;

  const harvestedTankIds = new Set(rawHarvestedTanks.map(t => String(t.id)));
  const relatedHarvests = harvestsList.filter(h => harvestedTankIds.has(String(h.tankId)));
  const totalRealizedBiomass = relatedHarvests.reduce((sum, h) => sum + (Number(h.quantityKg) || 0), 0)
    || rawHarvestedTanks.reduce((sum, t) => sum + (Number(String(t.biomass || 0).replace(/[^0-9.]/g, '')) || 0), 0);

  const validWeights = rawHarvestedTanks
    .map(t => parseFloat(String(t.abw || '').replace(/[^0-9.]/g, '')))
    .filter(v => !isNaN(v) && v > 0);
  const avgWeight = validWeights.length > 0
    ? (validWeights.reduce((a, b) => a + b, 0) / validWeights.length).toFixed(1)
    : '0.0';
  const countEst = Number(avgWeight) > 0 ? Math.round(1000 / Number(avgWeight)) : 0;

  const validFcrs = rawHarvestedTanks
    .map(t => parseFloat(t.fcr))
    .filter(v => !isNaN(v) && v > 0);
  const avgFcr = validFcrs.length > 0
    ? (validFcrs.reduce((a, b) => a + b, 0) / validFcrs.length).toFixed(2)
    : '-';

  const filteredTanks = harvestedTanks.filter(tank => 
    tank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tank.farmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tank.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div style={styles.modalOverlay} onClick={onClose}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()} className="animate-modal-in">
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.iconBox}>
                <CheckCircle2 size={20} color="#16A34A" />
              </div>
              <div style={styles.headerText}>
                <h3 style={styles.title}>
                  Harvested Tanks — Completed Cycles ({harvestedTanks.length})
                </h3>
              </div>
            </div>
            <button onClick={onClose} style={styles.closeBtn} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>

          {/* Top Summary Bar with Genuine Metrics */}
          <div style={styles.summaryContainer}>
            <div style={styles.summaryCard}>
              <span style={styles.summaryLabel}>TOTAL CLOSED TANKS</span>
              <span style={styles.summaryValue}>{totalClosedCount} Tanks</span>
            </div>
            <div style={styles.summaryCard}>
              <span style={styles.summaryLabel}>TOTAL REALIZED BIOMASS</span>
              <span style={{ ...styles.summaryValue, color: '#2563EB' }}>
                {totalRealizedBiomass > 0 ? `${Math.round(totalRealizedBiomass).toLocaleString()} kg` : '0 kg'}
              </span>
            </div>
            <div style={styles.summaryCard}>
              <span style={styles.summaryLabel}>AVG FINAL WEIGHT</span>
              <span style={{ ...styles.summaryValue, color: '#16A34A' }}>
                {Number(avgWeight) > 0 ? (
                  <>
                    {avgWeight}g <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>({countEst > 0 ? `~${countEst} count` : ''})</span>
                  </>
                ) : (
                  '-'
                )}
              </span>
            </div>
            <div style={styles.summaryCard}>
              <span style={styles.summaryLabel}>AVG CYCLE FCR</span>
              <span style={{ ...styles.summaryValue, color: '#D97706' }}>{avgFcr}</span>
            </div>
          </div>

          {/* Search Bar */}
          <div style={styles.searchContainer}>
            <Search size={16} color="#64748B" style={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search harvested tanks by name, farmer, village, or technician..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tanks List */}
          <div style={styles.listContainer}>
            {filteredTanks.length === 0 ? (
              <div style={styles.emptyNotice}>
                No harvested tanks found matching your search.
              </div>
            ) : (
              filteredTanks.map((tank) => (
                <div key={tank.id} style={styles.listItem}>
                  <div style={styles.listItemLeft}>
                    <div style={styles.itemIconBox}>
                      <Scale size={18} color="#16A34A" />
                    </div>
                    <div style={styles.itemDetails}>
                      <div style={styles.itemTitleRow}>
                        <h4 style={styles.itemTitle}>{tank.name}</h4>
                        <span style={styles.itemStatus}>✓ Final Harvest Completed</span>
                      </div>
                      <div style={styles.itemMeta}>
                        <span style={styles.metaItem}><User size={13} /> Farmer: <strong>{tank.farmer}</strong></span>
                        <span style={styles.metaDot}>•</span>
                        <span style={styles.metaItem}><MapPin size={13} /> {tank.location}</span>
                        <span style={styles.metaDot}>•</span>
                        <span style={styles.metaItem}>Extent: {tank.extent}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    style={styles.viewBtn}
                    onClick={() => setSelectedTank(tank)}
                  >
                    <Scale size={14} />
                    <span>View Report</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Render detailed report modal with genuine harvests if a tank is selected */}
      {selectedTank && (
        <HarvestReportModal 
          tank={selectedTank} 
          harvests={harvestsList}
          onClose={() => setSelectedTank(null)} 
        />
      )}
    </>
  );
};

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 9998,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px 16px',
    boxSizing: 'border-box',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '920px',
    maxHeight: '90vh',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    border: '1px solid #E2E8F0',
    overflowY: 'auto',
    position: 'relative'
  },
  header: {
    padding: '20px 24px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #F1F5F9'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  iconBox: {
    width: '38px',
    height: '38px',
    backgroundColor: '#DCFCE7',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: '-0.01em'
  },
  subtitle: {
    margin: 0,
    fontSize: '12.5px',
    color: '#64748B'
  },
  closeBtn: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748B',
    transition: 'background-color 0.15s ease'
  },
  summaryContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    padding: '14px 16px',
    margin: '16px 24px 0',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px solid #E2E8F0'
  },
  summaryCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  summaryLabel: {
    fontSize: '10.5px',
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px'
  },
  summaryValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0F172A'
  },
  searchContainer: {
    margin: '16px 24px 8px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  searchIcon: {
    position: 'absolute',
    left: '14px'
  },
  searchInput: {
    width: '100%',
    padding: '0 16px 0 40px',
    height: '42px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    fontSize: '13px',
    outline: 'none',
    color: '#0F172A',
    backgroundColor: '#FFFFFF'
  },
  listContainer: {
    padding: '12px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '48vh',
    overflowY: 'auto'
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    transition: 'background-color 0.15s ease'
  },
  listItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  itemIconBox: {
    width: '36px',
    height: '36px',
    backgroundColor: '#DCFCE7',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  itemDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  itemTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  itemTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 700,
    color: '#0F172A'
  },
  itemStatus: {
    backgroundColor: '#DCFCE7',
    color: '#16A34A',
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '6px'
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12.5px',
    color: '#64748B'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  metaDot: {
    color: '#CBD5E1'
  },
  viewBtn: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '12.5px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)',
    transition: 'all 0.15s ease'
  },
  emptyNotice: {
    padding: '32px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#64748B'
  }
};

export default HarvestedTanksModal;
