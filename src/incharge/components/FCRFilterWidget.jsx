import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Search, Scale, Fish, Droplets, 
  CheckCircle2, Clock, AlertTriangle, Maximize2, 
  X, Filter, ChevronRight, Award, Layers, ArrowUpDown
} from 'lucide-react';
import { createPortal } from 'react-dom';

const FCRFilterWidget = ({ 
  tanks = [], 
  onSelectTank, 
  onSelectHarvestTank 
}) => {
  const [docInput, setDocInput] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFullModalOpen, setIsFullModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('ASC'); // 'ASC' | 'DESC' for FCR

  // Filter & Sort Tanks based on DOC and FCR criteria
  const processedTanks = useMemo(() => {
    const numericDoc = parseInt(docInput, 10);
    const hasDocNumber = !isNaN(numericDoc) && numericDoc > 0;

    return tanks.filter(tank => {
      // 1. Text Search Match
      const matchesSearch = 
        !searchTerm || 
        tank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tank.farmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tank.locality.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // 2. Specific Numeric DOC Input Match (within ± 8 days window or exact)
      if (hasDocNumber) {
        const tankDoc = parseInt(tank.doc, 10) || 0;
        // If user typed 60, match tanks with DOC around 60 (52 - 68) or exact
        return Math.abs(tankDoc - numericDoc) <= 8 || tankDoc === numericDoc;
      }

      // 3. Preset Range Filter Match
      if (selectedPreset === 'DOC_1_45') return (tank.doc || 0) <= 45 && !tank.isHarvested;
      if (selectedPreset === 'DOC_46_75') return (tank.doc || 0) >= 46 && (tank.doc || 0) <= 75 && !tank.isHarvested;
      if (selectedPreset === 'DOC_76_95') return (tank.doc || 0) >= 76 && (tank.doc || 0) <= 95 && !tank.isHarvested;
      if (selectedPreset === 'DOC_96_PLUS') return (tank.doc || 0) >= 96 && !tank.isHarvested;
      if (selectedPreset === 'HARVESTED') return tank.isHarvested;

      return true; // 'ALL'
    });
  }, [tanks, docInput, selectedPreset, searchTerm]);

  // STRICT USER RULE: Active tanks at TOP sorted by FCR, Harvested tanks at BOTTOM
  const sortedTanks = useMemo(() => {
    const active = processedTanks.filter(t => !t.isHarvested);
    const harvested = processedTanks.filter(t => t.isHarvested);

    // Sort Active tanks by FCR (best FCR first)
    active.sort((a, b) => {
      const fcrA = parseFloat(a.fcr) || 999;
      const fcrB = parseFloat(b.fcr) || 999;
      return sortOrder === 'ASC' ? fcrA - fcrB : fcrB - fcrA;
    });

    // Sort Harvested tanks by FCR or DOC
    harvested.sort((a, b) => {
      const fcrA = parseFloat(a.fcr) || 999;
      const fcrB = parseFloat(b.fcr) || 999;
      return fcrA - fcrB;
    });

    return [...active, ...harvested];
  }, [processedTanks, sortOrder]);

  const activeCount = sortedTanks.filter(t => !t.isHarvested).length;
  const harvestedCount = sortedTanks.filter(t => t.isHarvested).length;

  // Average Active FCR calculation
  const avgActiveFcr = useMemo(() => {
    const active = sortedTanks.filter(t => !t.isHarvested && parseFloat(t.fcr));
    if (active.length === 0) return '1.18';
    const sum = active.reduce((acc, t) => acc + parseFloat(t.fcr), 0);
    return (sum / active.length).toFixed(2);
  }, [sortedTanks]);

  const getFcrStyle = (fcrStr) => {
    const num = parseFloat(fcrStr) || 1.20;
    if (num <= 1.18) {
      return {
        bg: '#DCFCE7',
        color: '#15803D',
        border: '#BBF7D0',
        label: 'Optimal FCR',
      };
    } else if (num <= 1.30) {
      return {
        bg: '#EFF6FF',
        color: '#1A2FB8',
        border: '#BFDBFE',
        label: 'Standard',
      };
    } else {
      return {
        bg: '#FEF3C7',
        color: '#92400E',
        border: '#FDE68A',
        label: 'Elevated',
      };
    }
  };

  const handleTankClick = (tank) => {
    if (tank.isHarvested) {
      if (onSelectHarvestTank) onSelectHarvestTank(tank);
    } else {
      if (onSelectTank) onSelectTank(tank);
    }
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. DASHBOARD WIDGET CARD (Spans 2 Grid Columns) */}
      {/* ========================================================= */}
      <div 
        style={styles.widgetCard}
        className="col-span-1 md:col-span-2 shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Widget Header */}
        <div style={styles.widgetHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.widgetIconBox}>
              <TrendingUp size={18} color="#1A2FB8" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={styles.widgetTitle}>FCR Data Filter by DOC</h3>
                <span style={styles.countBadge}>
                  {sortedTanks.length} Tanks
                </span>
              </div>
              <p style={styles.widgetSub}>
                Analyze feed conversion ratio at specific culture days (DOC)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsFullModalOpen(true)}
              style={styles.expandBtn}
              className="transition-all duration-150 active:scale-95 cursor-pointer"
              title="Expand to Full Screen Analysis Table"
            >
              <Maximize2 size={13} />
              <span>Full View</span>
            </button>
          </div>
        </div>

        {/* Filter Input & Controls Bar */}
        <div style={styles.filterBar}>
          {/* DOC Number Direct Input */}
          <div style={styles.docInputContainer}>
            <span style={styles.docInputPrefix}>DOC:</span>
            <input 
              type="number" 
              placeholder="Enter day (e.g. 45, 60, 75, 90)..."
              value={docInput}
              onChange={(e) => {
                setDocInput(e.target.value);
                if (e.target.value) {
                  setSelectedPreset('CUSTOM');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsFullModalOpen(true);
                }
              }}
              style={styles.docInput}
              min="1"
              max="150"
            />
            {docInput && (
              <button
                type="button"
                onClick={() => { setDocInput(''); setSelectedPreset('ALL'); }}
                style={styles.clearInputBtn}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Preset Filter Chips */}
          <div style={styles.presetChipGroup}>
            <button
              type="button"
              onClick={() => { setSelectedPreset('ALL'); setDocInput(''); setIsFullModalOpen(true); }}
              style={{
                ...styles.presetChip,
                ...(selectedPreset === 'ALL' && !docInput ? styles.activeChip : {})
              }}
            >
              All DOC
            </button>
            <button
              type="button"
              onClick={() => { setSelectedPreset('DOC_1_45'); setDocInput(''); setIsFullModalOpen(true); }}
              style={{
                ...styles.presetChip,
                ...(selectedPreset === 'DOC_1_45' ? styles.activeChip : {})
              }}
            >
              DOC ≤ 45
            </button>
            <button
              type="button"
              onClick={() => { setSelectedPreset('DOC_46_75'); setDocInput(''); setIsFullModalOpen(true); }}
              style={{
                ...styles.presetChip,
                ...(selectedPreset === 'DOC_46_75' ? styles.activeChip : {})
              }}
            >
              DOC 46-75
            </button>
            <button
              type="button"
              onClick={() => { setSelectedPreset('DOC_76_95'); setDocInput(''); setIsFullModalOpen(true); }}
              style={{
                ...styles.presetChip,
                ...(selectedPreset === 'DOC_76_95' ? styles.activeChip : {})
              }}
            >
              DOC 76-95
            </button>
            <button
              type="button"
              onClick={() => { setSelectedPreset('DOC_96_PLUS'); setDocInput(''); setIsFullModalOpen(true); }}
              style={{
                ...styles.presetChip,
                ...(selectedPreset === 'DOC_96_PLUS' ? styles.activeChip : {})
              }}
            >
              DOC 96+
            </button>
            <button
              type="button"
              onClick={() => { setSelectedPreset('HARVESTED'); setDocInput(''); setIsFullModalOpen(true); }}
              style={{
                ...styles.presetChip,
                ...(selectedPreset === 'HARVESTED' ? styles.activeHarvestChip : {})
              }}
            >
              Harvested ({tanks.filter(t => t.isHarvested).length})
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. FULL SCREEN EXPANDED FCR ANALYSIS MODAL */}
      {/* ========================================================= */}
      {isFullModalOpen && createPortal(
        <div style={styles.modalBackdrop} onClick={() => setIsFullModalOpen(false)}>
          <div style={styles.modalCardWide} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={styles.widgetIconBox}>
                  <TrendingUp size={22} color="#1A2FB8" />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Detailed FCR & Feed Efficiency Analysis by DOC
                  </h2>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Active ponds sorted by lowest FCR at top • Harvested completed ponds grouped at bottom
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFullModalOpen(false)}
                style={styles.closeModalBtn}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Filter Bar */}
            <div style={{ ...styles.filterBar, marginTop: '16px' }}>
              <div style={styles.docInputContainer}>
                <span style={styles.docInputPrefix}>Filter DOC:</span>
                <input 
                  type="number" 
                  placeholder="Enter day of culture..."
                  value={docInput}
                  onChange={(e) => setDocInput(e.target.value)}
                  style={styles.docInput}
                />
              </div>

              <div style={styles.searchInputBox}>
                <Search size={15} color="#64748B" />
                <input 
                  type="text" 
                  placeholder="Search farmer or village..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
              </div>

              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                style={styles.sortToggleBtn}
              >
                <ArrowUpDown size={14} />
                <span>FCR: {sortOrder === 'ASC' ? 'Lowest First (Optimal)' : 'Highest First'}</span>
              </button>
            </div>

            {/* Modal Table */}
            <div style={{ overflowX: 'auto', marginTop: '16px' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Pond / Tank</th>
                    <th style={styles.th}>Farmer Name</th>
                    <th style={styles.th}>Village / Area</th>
                    <th style={styles.th}>Pond Size</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Culture Day (DOC)</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>ABW / Count</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Current Biomass</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Feed Ratio (FCR)</th>
                    <th style={styles.th}>Culture Status</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTanks.map((tank, idx) => {
                    const fcrMeta = getFcrStyle(tank.fcr);
                    const isHarvested = tank.isHarvested;
                    const abw = tank.abw ? String(tank.abw).replace(/g/i, '') : '20.0';
                    const countPerKg = Math.round(1000 / (parseFloat(abw) || 20));

                    return (
                      <tr 
                        key={tank.id || idx}
                        style={{
                          ...styles.tr,
                          backgroundColor: isHarvested ? '#F8FAFC' : '#FFFFFF'
                        }}
                      >
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '13.5px' }}>
                              {tank.name}
                            </span>
                          </div>
                        </td>

                        <td style={styles.td}>
                          <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px' }}>
                            {tank.farmer}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                            {tank.locality}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: '600' }}>
                            {tank.size}
                          </span>
                        </td>

                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <span style={{ fontWeight: '800', color: '#1A2FB8', fontSize: '13px' }}>
                            Day {tank.doc}
                          </span>
                        </td>

                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <span style={{ fontWeight: '800', color: '#16A34A', fontSize: '13px' }}>
                            {abw}g
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>
                            ~{countPerKg} Count
                          </span>
                        </td>

                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <span style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px' }}>
                            {tank.biomass || '2,400 kg'}
                          </span>
                        </td>

                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: fcrMeta.bg,
                            color: fcrMeta.color,
                            border: `1px solid ${fcrMeta.border}`,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: '800',
                            fontSize: '13px'
                          }}>
                            {tank.fcr} FCR
                          </div>
                        </td>

                        <td style={styles.td}>
                          {isHarvested ? (
                            <span style={styles.harvestedTag}>
                              ✓ Harvest Completed
                            </span>
                          ) : (
                            <span style={styles.activeTag}>
                              <CheckCircle2 size={11} /> Active Culture
                            </span>
                          )}
                        </td>

                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsFullModalOpen(false);
                              handleTankClick(tank);
                            }}
                            style={styles.viewBtn}
                            className="transition-transform active:scale-95 cursor-pointer"
                          >
                            {isHarvested ? 'Harvest Report' : 'Inspect Tank'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div style={styles.modalFooter}>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                Showing {sortedTanks.length} total tanks ({activeCount} Active, {harvestedCount} Harvested)
              </span>
              <button
                type="button"
                onClick={() => setIsFullModalOpen(false)}
                style={styles.closeBtn}
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const styles = {
  widgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxSizing: 'border-box',
  },
  widgetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '8px',
  },
  widgetIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  widgetTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  widgetSub: {
    fontSize: '11.5px',
    color: '#64748B',
    margin: '2px 0 0 0',
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    fontSize: '11px',
    fontWeight: '700',
    padding: '1px 7px',
    borderRadius: '10px',
    border: '1px solid #BFDBFE',
  },
  expandBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#F8FAFC',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: '700',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  docInputContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    border: '1.5px solid #CBD5E1',
    borderRadius: '8px',
    padding: '4px 8px',
    gap: '4px',
    minWidth: '180px',
    flex: '1 1 180px',
  },
  docInputPrefix: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#1A2FB8',
    textTransform: 'uppercase',
  },
  docInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#0F172A',
    width: '100%',
  },
  clearInputBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '2px',
  },
  presetChipGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexWrap: 'wrap',
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  activeChip: {
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    borderColor: '#1A2FB8',
  },
  activeHarvestChip: {
    backgroundColor: '#475569',
    color: '#FFFFFF',
    borderColor: '#475569',
  },
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
    padding: '20px 16px',
    boxSizing: 'border-box',
  },
  modalCardWide: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '1080px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    border: '1px solid #E2E8F0',
    boxSizing: 'border-box',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid #F1F5F9',
  },
  closeModalBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
  },
  searchInputBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '6px 10px',
    gap: '6px',
    flex: '1 1 200px',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '12.5px',
    width: '100%',
  },
  sortToggleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1.5px solid #BFDBFE',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1.5px solid #E2E8F0',
  },
  th: {
    padding: '10px 12px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '10px 12px',
    verticalAlign: 'middle',
    fontSize: '12.5px',
  },
  viewBtn: {
    padding: '5px 10px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #BFDBFE',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: '700',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #F1F5F9',
    paddingTop: '16px',
    marginTop: '20px',
  },
  closeBtn: {
    padding: '8px 18px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
  }
};

export default FCRFilterWidget;
