import React from 'react';
import { X, Scale, User, MapPin, Calendar, TrendingUp, Activity, CheckCircle2 } from 'lucide-react';

const HarvestReportModal = ({ tank, harvests = [], onClose }) => {
  if (!tank) return null;

  const tankHarvests = (harvests || []).filter(h => String(h.tankId) === String(tank.id));

  const totalBiomassKg = tankHarvests.reduce((acc, h) => acc + (Number(h.quantityKg) || 0), 0)
    || Number(String(tank.biomass || 0).replace(/[^0-9.]/g, '')) || 0;

  const totalPieces = tankHarvests.reduce((acc, h) => {
    const qty = Number(h.quantityKg) || 0;
    const cnt = Number(h.countPerKg) || 0;
    return acc + (qty && cnt ? Math.round(qty * cnt) : 0);
  }, 0);

  const totalFeedKg = tankHarvests.reduce((acc, h) => {
    if (h.feedConsumed) return acc + Number(h.feedConsumed);
    const qty = Number(h.quantityKg) || 0;
    const fcr = Number(h.fcr) || 0;
    return acc + (qty && fcr ? Math.round(qty * fcr) : 0);
  }, 0);

  const stageCount = tankHarvests.length;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()} className="animate-modal-in">
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.iconBox}>
              <Scale size={20} color="#16A34A" />
            </div>
            <div style={styles.headerText}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={styles.title}>
                  {tank.name || 'Unknown Tank'} — Harvest &amp; Crop Report
                </h3>
                <span style={styles.statusBadge}>
                  <CheckCircle2 size={13} style={{ marginRight: '4px' }} />
                  Final Harvest Completed
                </span>
              </div>
              <div style={styles.metaInfo}>
                <span style={styles.metaItem}><User size={13} /> Farmer: <strong>{tank.farmer || tank.farmerName || 'Unknown Farmer'}</strong></span>
                <span style={styles.metaDot}>•</span>
                <span style={styles.metaItem}><MapPin size={13} /> {tank.location || 'Unknown Location'}</span>
                <span style={styles.metaDot}>•</span>
                <span style={styles.metaItem}>Extent: {tank.extent || tank.size || 'Unknown Extent'}</span>
                {tank.stockedDate && (
                  <>
                    <span style={styles.metaDot}>•</span>
                    <span style={styles.metaItem}><Calendar size={13} /> Stocked: {tank.stockedDate}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Top KPI Cards */}
        <div style={styles.kpiContainer}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiTop}>
              <span style={styles.kpiLabel}>Total Biomass Harvested</span>
              <Scale size={16} color="#2563EB" />
            </div>
            <div style={styles.kpiValue}>
              <span style={{ color: '#2563EB' }}>{Math.round(totalBiomassKg).toLocaleString()}</span> kg
            </div>
            <div style={styles.kpiSub}>{stageCount > 0 ? `${stageCount} Cut${stageCount !== 1 ? 's' : ''} Realized` : 'Total Pond Biomass'}</div>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiTop}>
              <span style={styles.kpiLabel}>Total Harvest Count</span>
              <Activity size={16} color="#0284C7" />
            </div>
            <div style={styles.kpiValue}>
              <span style={{ color: '#0284C7' }}>{totalPieces > 0 ? totalPieces.toLocaleString() : '-'}</span> {totalPieces > 0 ? 'pcs' : ''}
            </div>
            <div style={styles.kpiSub}>Calculated piece count</div>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiTop}>
              <span style={styles.kpiLabel}>Crop Feed Efficiency (FCR)</span>
              <TrendingUp size={16} color="#16A34A" />
            </div>
            <div style={styles.kpiValue}>
              <span style={{ color: '#16A34A' }}>{tank.fcr || (tankHarvests.find(h => h.fcr)?.fcr) || '-'}</span>
            </div>
            <div style={styles.kpiSub}>Cycle FCR</div>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiTop}>
              <span style={styles.kpiLabel}>Crop Survival Rate</span>
              <Activity size={16} color="#9333EA" />
            </div>
            <div style={styles.kpiValue}>
              <span style={{ color: '#9333EA' }}>{tank.survivalRate || '-'}</span>
            </div>
            <div style={styles.kpiSub}>{tank.stockingDensity ? `Density: ${tank.stockingDensity}` : 'Cycle Status'}</div>
          </div>
        </div>

        {/* Harvest Records Log Table */}
        <div style={styles.recordsSection}>
          <div style={styles.recordsHeader}>
            <h4 style={styles.recordsTitle}>Harvest Records Log</h4>
            <span style={styles.weighmentBadge}>
              <CheckCircle2 size={14} />
              <span>Verified Weighment Logs</span>
            </span>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.th}>HARVEST STAGE</th>
                  <th style={styles.th}>DATE &amp; DOC</th>
                  <th style={styles.th}>ABW / COUNT</th>
                  <th style={styles.th}>SHRIMP COUNT</th>
                  <th style={styles.th}>BIOMASS</th>
                  <th style={styles.th}>FEED (KG)</th>
                  <th style={styles.th}>STAGE FCR</th>
                  <th style={styles.th}>BUYER</th>
                </tr>
              </thead>
              <tbody>
                {tankHarvests.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B', fontSize: '14px' }}>
                      No individual harvest weighment logs recorded for this tank.
                    </td>
                  </tr>
                ) : (
                  tankHarvests.map((h, idx) => {
                    const stageName = h.harvestType || (h.isFinal ? 'Final Harvest' : `Harvest Stage #${idx + 1}`);
                    const isFinalStage = String(stageName).toLowerCase().includes('final');
                    const pcs = h.quantityKg && h.countPerKg ? Math.round(h.quantityKg * h.countPerKg) : null;
                    const feedKg = h.feedConsumed ? h.feedConsumed : (h.quantityKg && h.fcr ? Math.round(h.quantityKg * Number(h.fcr)) : null);
                    const displayAbw = h.abw ? (String(h.abw).includes('g') ? h.abw : `${h.abw}g`) : (h.countPerKg ? `${(1000 / h.countPerKg).toFixed(1)}g` : '-');

                    return (
                      <tr key={h.id || idx} style={styles.tableRow}>
                        <td style={styles.td}>
                          <span style={isFinalStage ? styles.badgeFinal : styles.badgePartial}>{stageName}</span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.fw600}>{h.date || '-'}</div>
                          {h.doc != null && <div style={styles.textGray}>Day {h.doc} DOC</div>}
                        </td>
                        <td style={styles.td}>
                          <div style={{ ...styles.fw700, color: '#16A34A' }}>{displayAbw}</div>
                          {h.countPerKg ? <div style={styles.textGray}>~{h.countPerKg} Count / kg</div> : null}
                        </td>
                        <td style={styles.td}>
                          <div style={{ ...styles.fw700, color: '#2563EB' }}>{pcs ? `${pcs.toLocaleString()} pcs` : '-'}</div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ ...styles.fw700, color: '#0F172A' }}>{h.quantityKg ? `${Number(h.quantityKg).toLocaleString()} kg` : '-'}</div>
                        </td>
                        <td style={styles.td}>{feedKg ? `${Number(feedKg).toLocaleString()} kg` : '-'}</td>
                        <td style={styles.td}><span style={styles.fcrBadge}>{h.fcr ? Number(h.fcr).toFixed(2) : '-'}</span></td>
                        <td style={styles.td}>
                          <div style={styles.fw700}>{h.buyerName || 'Exporter'}</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {tankHarvests.length > 0 && (
                <tfoot>
                  <tr style={styles.tfootRow}>
                    <td colSpan="3" style={{ ...styles.fw700, fontSize: '13px', padding: '12px 14px' }}>
                      TOTAL HARVESTED CROP:
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ ...styles.fw700, color: '#2563EB', fontSize: '13px' }}>
                        {totalPieces > 0 ? `${totalPieces.toLocaleString()} pcs` : '-'}
                      </div>
                    </td>
                    <td style={{ ...styles.fw700, color: '#0F172A', fontSize: '13px', padding: '12px 14px' }}>
                      {totalBiomassKg > 0 ? `${Math.round(totalBiomassKg).toLocaleString()} kg` : '-'}
                    </td>
                    <td style={{ ...styles.fw700, fontSize: '13px', padding: '12px 14px' }}>
                      {totalFeedKg > 0 ? `${Math.round(totalFeedKg).toLocaleString()} kg` : '-'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={styles.fcrTotalBadge}>{tank.fcr || '-'} FCR</span>
                    </td>
                    <td style={{ color: '#94A3B8', padding: '12px 14px' }}>
                      —
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
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
    zIndex: 9999,
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
    maxWidth: '1020px',
    maxHeight: '90vh',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    border: '1px solid #E2E8F0',
    overflowY: 'auto',
    position: 'relative'
  },
  header: {
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #F1F5F9'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
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
    gap: '4px'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: '-0.01em'
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    color: '#16A34A',
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '6px'
  },
  metaInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12.5px',
    color: '#64748B',
    flexWrap: 'wrap'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  metaDot: {
    color: '#CBD5E1'
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
  kpiContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    padding: '16px 24px'
  },
  kpiCard: {
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px 16px',
    backgroundColor: '#F8FAFC'
  },
  kpiTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px'
  },
  kpiValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0F172A',
    marginBottom: '2px'
  },
  kpiSub: {
    fontSize: '11.5px',
    color: '#64748B'
  },
  recordsSection: {
    padding: '0 24px 24px'
  },
  recordsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  recordsTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 600,
    color: '#0F172A'
  },
  weighmentBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#16A34A'
  },
  tableWrapper: {
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  tableHeaderRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0'
  },
  th: {
    padding: '10px 14px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px'
  },
  tableRow: {
    borderBottom: '1px solid #F1F5F9',
    transition: 'background-color 0.15s ease'
  },
  td: {
    padding: '12px 14px',
    fontSize: '12.5px',
    color: '#0F172A',
    verticalAlign: 'middle'
  },
  fw600: { fontWeight: 600, color: '#0F172A' },
  fw700: { fontWeight: 700, color: '#0F172A' },
  textGray: { color: '#64748B', fontSize: '11.5px', marginTop: '2px' },
  badgePartial: {
    display: 'inline-block',
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '6px'
  },
  badgeFinal: {
    display: 'inline-block',
    backgroundColor: '#DCFCE7',
    color: '#16A34A',
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '6px'
  },
  fcrBadge: {
    display: 'inline-block',
    backgroundColor: '#F1F5F9',
    color: '#0F172A',
    fontWeight: 700,
    fontSize: '12.5px',
    padding: '2px 8px',
    borderRadius: '6px'
  },
  fcrTotalBadge: {
    display: 'inline-block',
    backgroundColor: '#DCFCE7',
    color: '#16A34A',
    fontWeight: 700,
    fontSize: '12px',
    padding: '3px 8px',
    borderRadius: '6px'
  },
  tfootRow: {
    borderTop: '2px solid #E2E8F0',
    backgroundColor: '#F8FAFC'
  }
};

export default HarvestReportModal;
