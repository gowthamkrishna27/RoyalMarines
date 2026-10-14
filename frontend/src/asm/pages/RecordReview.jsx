import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { getAsmBasePath } from '../utils/asmNavigation';
import { 
  ArrowLeft, CheckCircle2, XCircle, AlertCircle, 
  MapPin, ShieldCheck, User, Droplets, Calendar, Clock, 
  TestTube, Check, AlertTriangle, FileText, CheckCircle
} from 'lucide-react';

const RecordReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const base = getAsmBasePath(location.pathname);
  const { db, getFarmerById, getTankById, getAgentById, updateSubmissionStatus, addNotification } = useMockData();
  const [record, setRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(''); // 'Reject' or 'Request Changes'
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const s = (db?.submissions || []).find(v => v.id === id);
    if (s) {
      const farmer = getFarmerById(s.farmerId);
      const tank = getTankById(s.tankId);
      const agent = getAgentById(s.agentId);
      const farmerName = farmer ? farmer.name : (s.farmerName || 'Ravi');
      const tankName = tank ? tank.name : (s.tankName || (s.tankId ? `Tank ${s.tankId.replace(/\D/g, '') || '1'}` : 'Tank 1'));
      const agentName = agent ? agent.name : 'Ramesh';

      setRecord({
        id: s.id,
        farmer: farmerName,
        tank: tankName,
        testType: s.testType || s.recordType || 'Water Quality Analysis',
        date: s.date || 'Today',
        time: s.time || s.submissionTime || '10:30 AM',
        agent: agentName,
        agentId: s.agentId || 'A001',
        submitted: s.submittedAgo || '15 mins ago',
        status: s.status || 'PENDING_VERIFICATION',
        gpsLocality: s.locality || s.gps?.locality || 'Bhimavaram Cluster',
        gpsAccuracy: s.gpsAccuracy || s.gps?.accuracy || 8,
        latitude: s.latitude != null ? Number(s.latitude) : (s.gps?.latitude != null ? Number(s.gps.latitude) : (s.gps?.lat != null ? Number(s.gps.lat) : 16.5449)),
        longitude: s.longitude != null ? Number(s.longitude) : (s.gps?.longitude != null ? Number(s.gps.longitude) : (s.gps?.lng != null ? Number(s.gps.lng) : 81.5212)),
        data: s.data || s.formData?.water || s.formData || {},
        raw: s
      });
    }
  }, [id, db, getFarmerById, getTankById, getAgentById]);

  if (!record) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
        Loading record details...
      </div>
    );
  }

  const handleApprove = () => {
    updateSubmissionStatus(record.id, 'Approved');
    addNotification(record.agentId, `Record for ${record.tank} (${record.farmer}) was Approved by Cluster Incharge.`, 'success');
    navigate(`${base}/tests`);
  };

  const openModal = (action) => {
    setModalAction(action);
    setRemarks('');
    setShowModal(true);
  };

  const handleModalSubmit = () => {
    if (!remarks) return;
    const status = modalAction === 'Reject' ? 'Rejected' : 'Changes Requested';
    updateSubmissionStatus(record.id, status);
    
    addNotification(
      record.agentId, 
      `Record for ${record.tank} (${record.farmer}) was ${status}. Remarks: ${remarks}`, 
      status === 'Rejected' ? 'error' : 'warning'
    );

    setShowModal(false);
    navigate(`${base}/tests`);
  };

  const d = record.data || {};
  const isWaterTest = record.testType === 'Water Analysis' || record.testType === 'Water Quality Analysis' || record.testType === 'Water Quality Test' || !!d.ph || !!d.salinity || !!d.alkalinity;

  const buildWaterParameterItems = () => {
    if (!isWaterTest) {
      return [
        { label: 'Dissolved Oxygen (DO)', value: d.do ? `${d.do} mg/L` : '6.5 mg/L', ideal: '> 4.0 mg/L', status: parseFloat(d.do) < 4 ? 'warning' : 'optimal' },
        { label: 'Water pH Level', value: d.ph ? `${d.ph} pH` : '7.8 pH', ideal: '7.5 - 8.5 pH', status: (parseFloat(d.ph) < 7.5 || parseFloat(d.ph) > 8.5) ? 'warning' : 'optimal' },
        { label: 'Salinity', value: d.salinity ? `${d.salinity} ppt` : '14 ppt', ideal: '0 - 30 ppt', status: (parseFloat(d.salinity) < 0 || parseFloat(d.salinity) > 30) ? 'warning' : 'optimal' },
        { label: 'Total Alkalinity', value: d.alkalinity ? `${d.alkalinity} ppm` : '130 ppm', ideal: '100 - 300 ppm', status: (parseFloat(d.alkalinity) < 100 || parseFloat(d.alkalinity) > 300) ? 'warning' : 'optimal' },
        { label: 'Total Hardness', value: d.hardness ? `${d.hardness} ppm` : '310 ppm', ideal: 'Salinity × 300 ppm', status: 'optimal' },
        { label: 'Ammonia (NH3)', value: d.ammonia ? `${d.ammonia} ppm` : '0.08 ppm', ideal: '< 0.5 ppm', status: parseFloat(d.ammonia) > 0.5 ? 'warning' : 'optimal' },
        { label: d.nitrate ? 'Nitrate (NO3)' : 'Nitrite (NO2)', value: d.nitrate ? `${d.nitrate} ppm` : (d.nitrite ? `${d.nitrite} ppm` : '0.04 ppm'), ideal: d.nitrate ? '< 20 ppm' : '< 0.25 ppm', status: (d.nitrate ? parseFloat(d.nitrate) > 20 : parseFloat(d.nitrite) > 0.25) ? 'warning' : 'optimal' },
        { label: 'Water Temperature', value: d.temperature ? `${d.temperature} °C` : '29.2 °C', ideal: '28 - 32 °C', status: 'optimal' },
      ];
    }

    const salVal = d.salinity !== undefined && d.salinity !== '' ? parseFloat(d.salinity) : null;
    const phVal = d.ph !== undefined && d.ph !== '' ? parseFloat(d.ph) : null;
    const alkVal = d.alkalinity !== undefined && d.alkalinity !== '' ? parseFloat(d.alkalinity) : null;
    const doVal = d.do !== undefined && d.do !== '' ? parseFloat(d.do) : null;
    const nh3Val = d.ammonia !== undefined && d.ammonia !== '' ? parseFloat(d.ammonia) : null;
    const no2Val = d.nitrite !== undefined && d.nitrite !== '' ? parseFloat(d.nitrite) : null;
    const h2sVal = d.h2s !== undefined && d.h2s !== '' ? parseFloat(d.h2s) : null;
    const clVal = (d.cl ?? d.chlorine) !== undefined && (d.cl ?? d.chlorine) !== '' ? parseFloat(d.cl ?? d.chlorine) : null;
    const feVal = (d.fe ?? d.iron) !== undefined && (d.fe ?? d.iron) !== '' ? parseFloat(d.fe ?? d.iron) : null;

    return [
      {
        label: 'DOC (Day of Culture)',
        value: d.doc ? `Day ${d.doc}` : 'Not Specified',
        ideal: 'Cycle Tracking',
        status: 'optimal'
      },
      {
        label: 'Salinity',
        value: salVal !== null ? `${salVal} ppt` : (d.salinity || '14 ppt'),
        ideal: '0 - 30 ppt',
        status: salVal !== null && (salVal < 0 || salVal > 30) ? 'warning' : 'optimal'
      },
      {
        label: 'pH Level',
        value: phVal !== null ? `${phVal}` : (d.ph || '7.8'),
        ideal: '7.5 - 8.5',
        status: phVal !== null && (phVal < 7.5 || phVal > 8.5) ? 'warning' : 'optimal'
      },
      {
        label: 'Alkalinity',
        value: alkVal !== null ? `${alkVal} ppm` : (d.alkalinity ? `${d.alkalinity} ppm` : '130 ppm'),
        ideal: '100 - 300 ppm',
        status: alkVal !== null && (alkVal < 100 || alkVal > 300) ? 'warning' : 'optimal'
      },
      {
        label: 'Hardness',
        value: d.hardness ? `${d.hardness} ppm` : (salVal !== null ? `${Math.round(salVal * 300)} ppm` : '4200 ppm'),
        ideal: 'Salinity × 300 ppm',
        status: 'optimal'
      },
      {
        label: 'Potassium (K)',
        value: d.k ? `${d.k} ppm` : (salVal !== null ? `${(salVal * 10.7).toFixed(1)} ppm` : '149.8 ppm'),
        ideal: 'Salinity × 10.7 ppm',
        status: 'optimal'
      },
      {
        label: 'Dissolved Oxygen (DO)',
        value: doVal !== null ? `${doVal} mg/L` : (d.do ? `${d.do} mg/L` : '6.5 mg/L'),
        ideal: '> 4.0 mg/L (<4 Alert)',
        status: doVal !== null && doVal < 4.0 ? 'warning' : 'optimal'
      },
      {
        label: 'Ammonia (NH3)',
        value: nh3Val !== null ? `${nh3Val} ppm` : (d.ammonia ? `${d.ammonia} ppm` : '0.05 ppm'),
        ideal: '0 - 0.5 ppm (<0.5 Alert)',
        status: nh3Val !== null && nh3Val > 0.5 ? 'warning' : 'optimal'
      },
      {
        label: d.nitrate ? 'Nitrate (NO3)' : 'Nitrite (NO2)',
        value: (d.nitrate !== undefined && d.nitrate !== '') ? `${d.nitrate} ppm` : (no2Val !== null ? `${no2Val} ppm` : (d.nitrite ? `${d.nitrite} ppm` : '0.02 ppm')),
        ideal: d.nitrate ? '< 20 ppm' : '0 - 0.25 ppm (<0.25 Alert)',
        status: d.nitrate ? (parseFloat(d.nitrate) > 20 ? 'warning' : 'optimal') : (no2Val !== null && no2Val > 0.25 ? 'warning' : 'optimal')
      },
      {
        label: 'Hydrogen Sulfide (H2S)',
        value: h2sVal !== null ? `${h2sVal} ppm` : (d.h2s ? `${d.h2s} ppm` : '0.005 ppm'),
        ideal: '0 - 0.02 ppm (<0.02 Alert)',
        status: h2sVal !== null && h2sVal > 0.02 ? 'warning' : 'optimal'
      },
      {
        label: 'Chlorine (Cl)',
        value: clVal !== null ? `${clVal} ppm` : ((d.cl || d.chlorine) ? `${d.cl || d.chlorine} ppm` : '0.004 ppm'),
        ideal: '0 - 0.02 ppm (<0.02 Alert)',
        status: clVal !== null && clVal > 0.02 ? 'warning' : 'optimal'
      },
      {
        label: 'Iron (Fe)',
        value: feVal !== null ? `${feVal} ppm` : ((d.fe || d.iron) ? `${d.fe || d.iron} ppm` : '0.01 ppm'),
        ideal: '0 - 0.02 ppm',
        status: feVal !== null && feVal > 0.02 ? 'warning' : 'optimal'
      },
      {
        label: 'Water Color',
        value: d.waterColor || d.waterColour || 'Greenish',
        ideal: 'Algae / Bloom Condition',
        status: 'optimal'
      }
    ];
  };

  const parameterItems = buildWaterParameterItems();

  return (
    <>
      <div style={{ padding: '24px 28px', maxWidth: '1300px', margin: '0 auto' }}>
        {/* Top Breadcrumb Navigation */}
        <button 
          type="button"
          onClick={() => navigate(`${base}/tests`)}
          style={styles.backLinkBtn}
          className="transition-all duration-150 active:scale-98 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Test History</span>
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* ========================================================= */}
          {/* LEFT: Test Data & Observations */}
          {/* ========================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Main Test Data Card */}
            <div style={styles.card}>
              <div style={styles.cardHeaderRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={styles.headerIconBox}>
                    <TestTube size={20} color="#1A2FB8" />
                  </div>
                  <div>
                    <h2 style={styles.cardTitle}>{record.testType} Data</h2>
                    <span style={styles.cardSub}>Captured via Technician Mobile App</span>
                  </div>
                </div>
                <div style={styles.verifiedTag}>
                  <ShieldCheck size={14} color="#16A34A" />
                  <span>Agent Submitted</span>
                </div>
              </div>

              {/* Telemetry Parameter Table */}
              <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                <table style={styles.paramTable}>
                  <thead>
                    <tr style={styles.paramThRow}>
                      <th style={styles.paramTh}>Parameter</th>
                      <th style={styles.paramTh}>Recorded Reading</th>
                      <th style={styles.paramTh}>Standard Reference</th>
                      <th style={styles.paramTh}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parameterItems.map((item, idx) => (
                      <tr key={idx} style={styles.paramTr}>
                        <td style={styles.paramTdLabel}>{item.label}</td>
                        <td style={styles.paramTdValue}>{item.value}</td>
                        <td style={styles.paramTdIdeal}>{item.ideal}</td>
                        <td style={styles.paramTdStatus}>
                          <span style={item.status === 'warning' ? styles.warningBadge : styles.optimalBadge}>
                            {item.status === 'warning' ? 'Alert' : 'Optimal'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Geolocation & Device Verification Card */}
            <div style={styles.card}>
              <div style={styles.cardHeaderRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MapPin size={18} color="#1A2FB8" />
                  <h3 style={styles.cardTitle}>GPS Location Verification</h3>
                </div>
                <span style={styles.verifiedBadge}>
                  <CheckCircle size={12} /> Geotag Verified
                </span>
              </div>

              <div style={styles.gpsVerificationRow}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
                    {record.gpsLocality || record.gps?.locality || 'Chinnamiram, Bhimavaram Cluster'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                    Coordinates: {Number(record.latitude || 16.5449).toFixed(6)}° N, {Number(record.longitude || 81.5212).toFixed(6)}° E • Accuracy: ±{record.gpsAccuracy || 8}m
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <a 
                    href={`https://www.google.com/maps?q=${record.latitude || 16.5449},${record.longitude || 81.5212}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '11px', color: '#1A2FB8', fontWeight: '600', textDecoration: 'underline' }}
                  >
                    View Map ↗
                  </a>
                  <div style={{ fontSize: '11.5px', color: '#16A34A', fontWeight: '700' }}>
                    ✓ Within Pond Boundary
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT: Agent Identity & Read-Only Summary */}
          {/* ========================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Metadata Card */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Submission Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Farmer:</span>
                  <span style={styles.infoValue}>{record.farmer}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Pond / Tank:</span>
                  <span style={styles.infoValue}>{record.tank}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Field Technician:</span>
                  <span style={styles.infoValue}>{record.agent}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Recorded Time:</span>
                  <span style={styles.infoValue}>{record.date} • {record.time}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Status:</span>
                  <span style={styles.approvedBadge}>
                    <CheckCircle2 size={11} /> Submitted
                  </span>
                </div>
              </div>
            </div>

            {/* Incharge Supervision Notice Card */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Supervision Summary</h3>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '6px 0 16px 0', lineHeight: 1.5 }}>
                Field test record logged by <strong>{record.agent}</strong>. ASM has view-only access to monitor all technician test observations.
              </p>

              <button 
                type="button"
                onClick={() => navigate(`${base}/tests`)}
                style={styles.backToHistoryBtn}
                className="transition-all duration-150 active:scale-98 cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Return to Test History</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

const styles = {
  backLinkBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#1A2FB8',
    fontSize: '13px',
    fontWeight: '700',
    marginBottom: '20px',
    padding: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '20px 22px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '14px',
    borderBottom: '1px solid #F1F5F9',
  },
  headerIconBox: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  cardSub: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
    display: 'block',
  },
  verifiedTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #DCFCE7',
    color: '#16A34A',
    fontSize: '10.5px',
    fontWeight: '800',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  paramTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  paramThRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  },
  paramTh: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  paramTr: {
    borderBottom: '1px solid #F1F5F9',
  },
  paramTdLabel: {
    padding: '11px 14px',
    fontWeight: '700',
    color: '#0F172A',
  },
  paramTdValue: {
    padding: '11px 14px',
    fontWeight: '800',
    color: '#1A2FB8',
  },
  paramTdIdeal: {
    padding: '11px 14px',
    color: '#64748B',
    fontSize: '12px',
  },
  paramTdStatus: {
    padding: '11px 14px',
  },
  optimalBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 9px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  warningBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 9px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
  paramBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  paramLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
  },
  paramValue: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
  },
  paramIdeal: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '500',
  },
  notesBox: {
    display: 'flex',
    gap: '10px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px 16px',
    marginTop: '12px',
  },
  notesText: {
    fontSize: '13px',
    color: '#334155',
    lineHeight: 1.5,
    margin: 0,
  },
  gpsVerificationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    padding: '10px 14px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #DCFCE7',
    borderRadius: '8px',
  },
  gpsText: {
    fontSize: '12px',
    color: '#166534',
  },
  geoValidPill: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#15803D',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #F8FAFC',
  },
  infoLabel: {
    fontSize: '12.5px',
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F172A',
  },
  pendingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  approveBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13.5px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  requestBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px',
    backgroundColor: '#FFFFFF',
    color: '#D97706',
    border: '1px solid #FCD34D',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  rejectBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px',
    backgroundColor: '#FFF1F2',
    color: '#DC2626',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(2px)',
    zIndex: 100,
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
    maxWidth: '480px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    paddingBottom: '12px',
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
  formLabel: {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '6px',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  modalCancelBtn: {
    padding: '9px 18px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  modalSubmitBtn: {
    padding: '9px 18px',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  backToHistoryBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '10px 16px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  }
};

export default RecordReview;

