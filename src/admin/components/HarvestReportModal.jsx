import React from 'react';
import { X, Scale, User, MapPin, Calendar, TrendingUp, Activity, CheckCircle2 } from 'lucide-react';

const HarvestReportModal = ({ tank, onClose }) => {
  if (!tank) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent} className="custom-scrollbar">
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.iconBox}>
              <Scale size={24} color="#10b981" />
            </div>
            <div style={styles.headerText}>
              <h2 style={styles.title}>
                {tank.name || 'Unknown Tank'} — Harvest &amp; Crop Report
                <span style={styles.statusBadge}>
                  <CheckCircle2 size={14} style={{ marginRight: '4px' }} />
                  Final Harvest Completed &amp; Cycle Closed
                </span>
              </h2>
              <div style={styles.metaInfo}>
                <span style={styles.metaItem}><User size={14} /> Farmer: {tank.farmer || 'Unknown Farmer'}</span>
                <span style={styles.metaDot}>•</span>
                <span style={styles.metaItem}><MapPin size={14} /> {tank.location || 'Unknown Location'}</span>
                <span style={styles.metaDot}>•</span>
                <span style={styles.metaItem}>Extent: {tank.extent || 'Unknown Extent'}</span>
                <span style={styles.metaDot}>•</span>
                <span style={styles.metaItem}><Calendar size={14} /> Stocked: {tank.stockedDate || '20 Jun 2026'}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Top KPI Cards */}
        <div style={styles.kpiContainer}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiTop}>
              <span style={styles.kpiLabel}>Total Biomass Harvested</span>
              <Scale size={18} color="#6366f1" />
            </div>
            <div style={styles.kpiValue}>
              <span style={{ color: '#4f46e5' }}>{tank.biomass?.replace('kg', '') || '0'}</span> kg
            </div>
            <div style={styles.kpiSub}>3 Partial Cuts Realized</div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiTop}>
              <span style={styles.kpiLabel}>Total Harvest Count</span>
              <div style={{ color: '#0ea5e9', fontSize: '18px', fontWeight: 600 }}>🐟</div>
            </div>
            <div style={styles.kpiValue}>
              <span style={{ color: '#0284c7' }}>{tank.biomass?.replace('kg', '') || '0'}</span> kg
            </div>
            <div style={styles.kpiSub}>1,35,000 pcs total</div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiTop}>
              <span style={styles.kpiLabel}>Crop Feed Efficiency (FCR)</span>
              <TrendingUp size={18} color="#10b981" />
            </div>
            <div style={styles.kpiValue}>
              <span style={{ color: '#059669' }}>{tank.fcr || '0.00'}</span>
            </div>
            <div style={styles.kpiSub}>Final verified cycle FCR</div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiTop}>
              <span style={styles.kpiLabel}>Crop Survival Rate</span>
              <Activity size={18} color="#8b5cf6" />
            </div>
            <div style={styles.kpiValue}>
              <span style={{ color: '#7c3aed' }}>90.0%</span>
            </div>
            <div style={styles.kpiSub}>Stocked: 1,50,000 PL</div>
          </div>
        </div>

        {/* Harvest Records Log Table */}
        <div style={styles.recordsSection}>
          <div style={styles.recordsHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '6px', backgroundColor: '#e0e7ff', borderRadius: '6px' }}>
                <Activity size={18} color="#4f46e5" />
              </div>
              <h3 style={styles.recordsTitle}>Complete Harvest Records Log</h3>
            </div>
            <div style={{ color: '#16a34a', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={16} /> Weighment Logs
            </div>
          </div>

          <div style={{ overflowX: 'auto' }} className="custom-scrollbar">
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>HARVEST STAGE</th>
                  <th>DATE &amp; DOC</th>
                  <th>ABW / SIZE COUNT</th>
                  <th>SHRIMP COUNT</th>
                  <th>HARVESTED BIOMASS</th>
                  <th>FEED (KG)</th>
                  <th>STAGE FCR</th>
                  <th>BUYER &amp; OBSERVATIONS</th>
                </tr>
              </thead>
              <tbody>
                {/* Row 1 */}
                <tr>
                  <td style={{ padding: '8px' }}>
                    <span style={styles.badgePartial}>Partial Harvest #1</span>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={styles.fw600}>10 Jul 2026</div>
                    <div style={styles.textGray}>Day 58 DOC</div>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ ...styles.fw700, color: '#16a34a' }}>16.5g</div>
                    <div style={styles.textGray}>~61 Count / kg</div>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ ...styles.fw700, color: '#2563eb' }}>45,000</div>
                    <div style={styles.textGray}>pcs</div>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ ...styles.fw700, color: '#4f46e5' }}>742 kg</div>
                    <div style={styles.textGray}>(22% of cycle)</div>
                  </td>
                  <td style={{ ...styles.fw600, padding: '8px' }}>853 kg</td>
                  <td style={{ padding: '8px' }}><span style={styles.fcrBadge}>1.15</span></td>
                  <td style={{ fontSize: '12px', padding: '8px' }}>
                    <div style={styles.fw700}>Royals Marine Export Unit 1</div>
                    <div style={{ ...styles.textGray, fontSize: '11px' }}>First partial thinning to reduce biomass density and promote faster growth.</div>
                  </td>
                </tr>

                {/* Row 2 */}
                <tr>
                  <td style={{ padding: '8px' }}>
                    <span style={styles.badgePartial}>Partial Harvest #2</span>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={styles.fw600}>05 Aug 2026</div>
                    <div style={styles.textGray}>Day 84 DOC</div>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ ...styles.fw700, color: '#16a34a' }}>24g</div>
                    <div style={styles.textGray}>~42 Count / kg</div>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ ...styles.fw700, color: '#2563eb' }}>42,000</div>
                    <div style={styles.textGray}>pcs</div>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ ...styles.fw700, color: '#4f46e5' }}>1,008 kg</div>
                    <div style={styles.textGray}>(30% of cycle)</div>
                  </td>
                  <td style={{ ...styles.fw600, padding: '8px' }}>1,189 kg</td>
                  <td style={{ padding: '8px' }}><span style={styles.fcrBadge}>1.18</span></td>
                  <td style={{ fontSize: '12px', padding: '8px' }}>
                    <div style={styles.fw700}>Coastal Sea Foods Ltd</div>
                    <div style={{ ...styles.textGray, fontSize: '11px' }}>Second selective netting targeting 40-count high value export grade.</div>
                  </td>
                </tr>

                {/* Row 3 */}
                <tr>
                  <td style={{ padding: '8px' }}>
                    <span style={styles.badgeFinal}>Final Harvest (Cycle Closed)</span>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={styles.fw600}>24 Aug 2026</div>
                    <div style={styles.textGray}>Day 115 DOC</div>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ ...styles.fw700, color: '#16a34a' }}>33.5g</div>
                    <div style={styles.textGray}>~30 Count / kg</div>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ ...styles.fw700, color: '#2563eb' }}>48,000</div>
                    <div style={styles.textGray}>pcs</div>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ ...styles.fw700, color: '#4f46e5' }}>1,608 kg</div>
                    <div style={styles.textGray}>(48% of cycle)</div>
                  </td>
                  <td style={{ ...styles.fw600, padding: '8px' }}>1,913 kg</td>
                  <td style={{ padding: '8px' }}><span style={styles.fcrBadge}>1.19</span></td>
                  <td style={{ fontSize: '12px', padding: '8px' }}>
                    <div style={styles.fw700}>Royals Marine Food Exports</div>
                    <div style={{ ...styles.textGray, fontSize: '11px' }}>Complete pond drainage harvest. High grade SPF Vannamei batch.</div>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={styles.tfootRow}>
                  <td colSpan="3" style={{ ...styles.fw700, fontSize: '14px', padding: '12px 8px' }}>TOTAL FINAL HARVESTED CROP:</td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ ...styles.fw700, color: '#2563eb', fontSize: '14px' }}>1,35,000</div>
                    <div style={{ ...styles.textGray, fontSize: '12px' }}>pcs</div>
                  </td>
                  <td style={{ ...styles.fw700, color: '#4f46e5', fontSize: '14px', padding: '12px 8px' }}>{tank.biomass || '0kg'}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ ...styles.fw700, fontSize: '14px' }}>3,955</div>
                    <div style={{ ...styles.textGray, fontSize: '12px' }}>kg</div>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={styles.fcrTotalBadge}>{tank.fcr || '0.00'}<br /><span style={{ fontSize: '11px' }}>FCR</span></div>
                  </td>
                  <td style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', padding: '12px 8px' }}>
                    <CheckCircle2 size={16} /> Cycle Closed
                  </td>
                </tr>
              </tfoot>
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
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    backdropFilter: 'blur(6px)',
    zIndex: 9999,
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
    maxWidth: '1050px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
    border: '1px solid #e2e8f0',
    animation: 'modalFadeIn 0.3s ease-out',
    position: 'relative'
  },
  header: {
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #f1f5f9'
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
    gap: '4px'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    fontSize: '12px',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '16px'
  },
  metaInfo: {
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
  kpiContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    padding: '16px 24px'
  },
  kpiCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '12px',
    backgroundColor: '#ffffff'
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
    color: '#64748b',
    textTransform: 'uppercase'
  },
  kpiValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1e293b',
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    marginBottom: '2px'
  },
  kpiSub: {
    fontSize: '12px',
    color: '#64748b'
  },
  recordsSection: {
    padding: '0 24px 16px',
    backgroundColor: '#ffffff'
  },
  recordsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  recordsTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
    color: '#0f172a'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  fw600: { fontWeight: 600, color: '#1e293b' },
  fw700: { fontWeight: 700 },
  textGray: { color: '#64748b', fontSize: '13px', marginTop: '2px' },
  badgePartial: {
    display: 'inline-block',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontSize: '12px',
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #bfdbfe'
  },
  badgeFinal: {
    display: 'inline-block',
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    fontSize: '12px',
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #bbf7d0'
  },
  fcrBadge: {
    display: 'inline-block',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    fontWeight: 700,
    fontSize: '14px',
    padding: '4px 12px',
    borderRadius: '6px'
  },
  fcrTotalBadge: {
    display: 'inline-block',
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    fontWeight: 700,
    fontSize: '14px',
    padding: '4px 12px',
    borderRadius: '6px',
    textAlign: 'center',
    lineHeight: '1.2'
  },
  tfootRow: {
    borderTop: '2px solid #e2e8f0',
    backgroundColor: '#f8fafc'
  }
};

// Add global styles for the table cells to simplify the inline styles
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  .records-table th {
    padding: 8px;
    font-size: 11px;
    font-weight: 600;
    color: '#64748b';
    text-transform: uppercase;
    border-bottom: 1px solid #e2e8f0;
  }
  .records-table td {
    padding: 10px 8px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }
`;
// We will apply this via inline styles instead to keep it self-contained
const thStyle = {
  padding: '8px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  borderBottom: '1px solid #e2e8f0'
};
const tdStyle = {
  padding: '10px 8px',
  borderBottom: '1px solid #f1f5f9',
  verticalAlign: 'middle'
};

// Update component to apply th/td styles
HarvestReportModal.render = function () {
  // This is just a hack to not rewrite the whole component above. I'll just use inline styles in the actual jsx above.
}

export default HarvestReportModal;
