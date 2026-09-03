import React, { useState } from 'react';
import { X, CheckCircle2, Search, Scale, User, MapPin } from 'lucide-react';
import HarvestReportModal from './HarvestReportModal';
import { useMockData } from '../../context/MockDataContext';

const injectStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('modal-animations')) {
    const style = document.createElement('style');
    style.id = 'modal-animations';
    style.innerHTML = `
      @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes modalFadeIn { from { opacity: 0; transform: translateY(15px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    `;
    document.head.appendChild(style);
  }
};
injectStyles();

const HarvestedTanksModal = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTank, setSelectedTank] = useState(null);
  const mockData = useMockData();
  const db = mockData?.db;
  
  // Get harvested tanks from the DB
  const rawHarvestedTanks = db?.tanks?.filter(t => t.status === 'Harvested') || [];
  
  // Map them to include farmer info
  const harvestedTanks = rawHarvestedTanks.map(tank => {
    const farmer = db?.farmers?.find(f => f.id === tank.farmerId);
    return {
      ...tank,
      farmer: farmer?.name || 'Unknown Farmer',
      location: farmer?.location || 'Unknown Location',
      extent: farmer?.acres ? `${farmer.acres} Acres` : tank.size || 'Unknown Size'
    };
  });

  const filteredTanks = harvestedTanks.filter(tank => 
    tank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tank.farmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tank.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.iconBox}>
                <CheckCircle2 size={24} color="#16a34a" />
              </div>
              <div style={styles.headerText}>
                <h2 style={styles.title}>
                  Harvested Tanks — Completed Final Harvest ({harvestedTanks.length})
                </h2>
                <div style={styles.subtitle}>
                  Tanks with final crop drainage, settlement weighment logs, and closed culture cycles
                </div>
              </div>
            </div>
            <button onClick={onClose} style={styles.closeBtn}>
              <X size={20} />
            </button>
          </div>

          {/* Top Summary Bar */}
          <div style={styles.summaryContainer}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>TOTAL CLOSED TANKS</div>
              <div style={styles.summaryValue}>{harvestedTanks.length} Tanks</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>TOTAL REALIZED BIOMASS</div>
              <div style={{ ...styles.summaryValue, color: '#2563eb' }}>17,800 kg</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>AVG FINAL WEIGHT</div>
              <div style={{ ...styles.summaryValue, color: '#16a34a' }}>32.2g <span style={{fontSize:'16px', fontWeight:500}}>(~31 count)</span></div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>AVG CYCLE FCR</div>
              <div style={{ ...styles.summaryValue, color: '#d97706' }}>1.17</div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={styles.searchContainer}>
            <Search size={18} color="#94a3b8" style={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search harvested tanks by name, farmer, village, or technician..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tanks List */}
          <div style={styles.listContainer} className="custom-scrollbar">
            {filteredTanks.map((tank) => (
              <div key={tank.id} style={styles.listItem}>
                <div style={styles.listItemLeft}>
                  <div style={styles.itemIconBox}>
                    <Scale size={20} color="#16a34a" />
                  </div>
                  <div style={styles.itemDetails}>
                    <div style={styles.itemTitleRow}>
                      <h3 style={styles.itemTitle}>{tank.name}</h3>
                      <span style={styles.itemStatus}>✓ Final Harvest Completed</span>
                    </div>
                    <div style={styles.itemMeta}>
                      <span style={styles.metaItem}><User size={14} /> Farmer: {tank.farmer}</span>
                      <span style={styles.metaDot}>•</span>
                      <span style={styles.metaItem}><MapPin size={14} /> {tank.location}</span>
                      <span style={styles.metaDot}>•</span>
                      <span style={styles.metaItem}>Extent: {tank.extent}</span>
                    </div>
                  </div>
                </div>
                <button 
                  style={styles.viewBtn}
                  onClick={() => setSelectedTank(tank)}
                >
                  <Scale size={16} /> View Harvest Report
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Render detailed report modal if a tank is selected */}
      {selectedTank && (
        <HarvestReportModal 
          tank={selectedTank} 
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
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(4px)',
    zIndex: 9998,
    padding: '6vh 24px',
    animation: 'overlayFadeIn 0.2s ease-out',
    overflowY: 'auto',
    boxSizing: 'border-box'
  },
  modalContent: {
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '960px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: '1px solid #e2e8f0',
    animation: 'modalFadeIn 0.3s ease-out',
    position: 'relative'
  },
  header: {
    padding: '16px 24px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  iconBox: {
    width: '40px',
    height: '40px',
    backgroundColor: '#dcfce7',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
    color: '#0f172a'
  },
  subtitle: {
    fontSize: '12px',
    color: '#64748b'
  },
  closeBtn: {
    background: '#f1f5f9',
    border: 'none',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b'
  },
  summaryContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px 24px',
    margin: '0 24px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0'
  },
  summaryCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  summaryLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  summaryValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0f172a'
  },
  searchContainer: {
    margin: '12px 24px 8px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px 10px 36px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    color: '#0f172a'
  },
  listContainer: {
    padding: '8px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff'
  },
  listItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  itemIconBox: {
    width: '40px',
    height: '40px',
    backgroundColor: '#dcfce7',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  itemTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  itemTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
    color: '#0f172a'
  },
  itemStatus: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '12px'
  },
  itemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#64748b'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  metaDot: {
    color: '#cbd5e1'
  },
  viewBtn: {
    backgroundColor: '#1e3a8a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer'
  }
};

export default HarvestedTanksModal;
