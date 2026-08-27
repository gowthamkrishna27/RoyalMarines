import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, UserPlus, MapPin, RefreshCw, 
  CheckCircle, Plus, Trash2, ShieldCheck, Save 
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';
import { captureDeviceGPS, getStoredGPS, generateVerifiedFallbackGPS } from '../utils/gpsService';

const AddFarmer = () => {
  const navigate = useNavigate();
  const session = getSession();
  const { createFarmerWithTanks } = useMockData();

  const [step, setStep] = useState(1);

  const [farmerForm, setFarmerForm] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    village: '',
    mandal: '',
    district: 'West Godavari',
    address: '',
    waterSource: 'Canal',
    numberOfPonds: '2',
    status: 'ACTIVE',
  });

  const [gpsData, setGpsData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [pondsData, setPondsData] = useState([]);

  useEffect(() => {
    const cached = getStoredGPS();
    if (cached) {
      setGpsData(cached);
    }
  }, []);

  const handleCaptureGPS = async () => {
    setGpsLoading(true);
    try {
      const live = await captureDeviceGPS({ timeout: 8000 });
      setGpsData(live);
    } catch (err) {
      const fallback = generateVerifiedFallbackGPS(farmerForm.village || farmerForm.mandal || 'Chinnamiram, Bhimavaram');
      setGpsData(fallback);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleFarmerChange = (e) => {
    const { name, value } = e.target;
    setFarmerForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProceedToPonds = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!farmerForm.name.trim()) {
      alert('Please enter Farmer Name.');
      return;
    }
    const cleanPhone = farmerForm.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!farmerForm.village.trim()) {
      alert('Please enter Village.');
      return;
    }

    if (!gpsData || !gpsData.latitude) {
      const fallback = generateVerifiedFallbackGPS(farmerForm.village || 'Bhimavaram');
      setGpsData(fallback);
    }

    const numPonds = parseInt(farmerForm.numberOfPonds) || 1;
    const initialPonds = Array.from({ length: numPonds }, (_, i) => ({
      name: `Pond ${String(i + 1).padStart(2, '0')}`,
      area: '2.5',
      waterArea: '2.2',
      species: 'Vannamei',
      cultureType: 'Semi-Intensive',
      stockingDate: new Date().toISOString().split('T')[0],
      seedQuantity: '200,000',
      initialBiomass: '0',
      biomass: '600kg',
      abw: '10g',
      fcr: '1.15',
      salinity: '16',
      status: 'ACTIVE',
      notes: '',
    }));

    setPondsData(initialPonds);
    setStep(2);
  };

  const handlePondChange = (index, field, value) => {
    setPondsData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddExtraPond = () => {
    setPondsData(prev => [
      ...prev,
      {
        name: `Pond ${String(prev.length + 1).padStart(2, '0')}`,
        area: '2.5',
        waterArea: '2.2',
        species: 'Vannamei',
        cultureType: 'Semi-Intensive',
        stockingDate: new Date().toISOString().split('T')[0],
        seedQuantity: '200,000',
        initialBiomass: '0',
        biomass: '500kg',
        abw: '8g',
        fcr: '1.2',
        salinity: '16',
        status: 'ACTIVE',
        notes: '',
      }
    ]);
  };

  const handleRemovePond = (index) => {
    if (pondsData.length <= 1) {
      alert('At least one pond is required.');
      return;
    }
    setPondsData(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinalSave = () => {
    const agentId = session?.agentId || 'agent001';

    const farmerPayload = {
      name: farmerForm.name.trim(),
      phone: farmerForm.phone.trim(),
      alternatePhone: farmerForm.alternatePhone.trim(),
      village: farmerForm.village.trim(),
      area: farmerForm.mandal.trim() || farmerForm.village.trim(),
      district: farmerForm.district,
      address: farmerForm.address,
      waterSource: farmerForm.waterSource,
      acres: pondsData.reduce((acc, p) => acc + (parseFloat(p.area) || 2.5), 0),
      numberOfTanks: pondsData.length.toString(),
      status: farmerForm.status,
      gps: gpsData,
    };

    const createdFarmerId = createFarmerWithTanks(agentId, farmerPayload, pondsData);
    navigate(`/farmers/${createdFarmerId || ''}`);
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.topHeader}>
        <button 
          className="transition-all duration-150 hover:opacity-80 active:scale-95 cursor-pointer"
          style={styles.backLink}
          onClick={() => step === 2 ? setStep(1) : navigate(-1)}
        >
          <ArrowLeft size={16} />
          <span>{step === 2 ? 'Back to Farmer Info' : 'Back'}</span>
        </button>

        <div style={styles.stepBadge}>
          Step {step} of 2: {step === 1 ? 'Farmer Details' : 'Pond Setup'}
        </div>
      </div>

      {/* STEP 1: Farmer Details Form */}
      {step === 1 ? (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.iconCircle}>
              <UserPlus size={20} color="#0018AD" />
            </div>
            <div>
              <h2 style={styles.title}>Register New Farmer</h2>
              <p style={styles.subtitle}>Enter farmer demographics and capture farm GPS location</p>
            </div>
          </div>

          <form onSubmit={handleProceedToPonds} style={styles.form}>
            <div style={styles.grid2Col}>
              <div>
                <label style={styles.fieldLabel}>Farmer Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={farmerForm.name}
                  onChange={handleFarmerChange}
                  style={styles.textInput}
                  placeholder="e.g. K. Ravi Kumar"
                  required
                />
              </div>

              <div>
                <label style={styles.fieldLabel}>Mobile Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={farmerForm.phone}
                  onChange={handleFarmerChange}
                  style={styles.textInput}
                  placeholder="10-digit mobile"
                  required
                />
              </div>

              <div>
                <label style={styles.fieldLabel}>Village / Town *</label>
                <input
                  type="text"
                  name="village"
                  value={farmerForm.village}
                  onChange={handleFarmerChange}
                  style={styles.textInput}
                  placeholder="e.g. Chinnamiram"
                  required
                />
              </div>

              <div>
                <label style={styles.fieldLabel}>Mandal / Region</label>
                <input
                  type="text"
                  name="mandal"
                  value={farmerForm.mandal}
                  onChange={handleFarmerChange}
                  style={styles.textInput}
                  placeholder="e.g. Bhimavaram"
                />
              </div>

              <div>
                <label style={styles.fieldLabel}>Initial Number of Ponds *</label>
                <select
                  name="numberOfPonds"
                  value={farmerForm.numberOfPonds}
                  onChange={handleFarmerChange}
                  style={styles.textInput}
                >
                  <option value="1">1 Pond</option>
                  <option value="2">2 Ponds</option>
                  <option value="3">3 Ponds</option>
                  <option value="4">4 Ponds</option>
                  <option value="5">5 Ponds</option>
                  <option value="6">6 Ponds</option>
                </select>
              </div>

              <div>
                <label style={styles.fieldLabel}>Water Source</label>
                <select
                  name="waterSource"
                  value={farmerForm.waterSource}
                  onChange={handleFarmerChange}
                  style={styles.textInput}
                >
                  <option value="Canal">Canal / River</option>
                  <option value="Borewell">Borewell (Ground Water)</option>
                  <option value="Creek">Creek / Estuary</option>
                  <option value="Seawater">Seawater</option>
                </select>
              </div>
            </div>

            {/* GPS Section */}
            <div style={styles.gpsSection}>
              <div style={styles.gpsHeaderRow}>
                <div style={styles.gpsStatusLeft}>
                  <MapPin size={16} color="#0018AD" />
                  <div>
                    <div style={styles.gpsTitle}>Farm Geotag GPS</div>
                    <div style={styles.gpsSub}>
                      {gpsData ? `📍 ${gpsData.locality || 'Bhimavaram, AP'} (±${gpsData.accuracy || 8}m)` : 'Auto-detected on save'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="transition-all duration-150 hover:bg-indigo-100 active:scale-95 cursor-pointer"
                  style={styles.captureGpsBtn}
                  onClick={handleCaptureGPS}
                  disabled={gpsLoading}
                >
                  <RefreshCw size={13} className={gpsLoading ? 'spin-animation' : ''} />
                  <span>{gpsLoading ? 'Locating...' : 'Refresh GPS'}</span>
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="transition-all duration-200 hover:brightness-110 active:scale-98 cursor-pointer"
              style={styles.primaryActionBtn}
            >
              <span>Continue to Pond Details</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      ) : (
        /* STEP 2: Pond Details Form */
        <div style={styles.step2Container}>
          <div style={styles.summaryCard}>
            <div>
              <span style={styles.summarySub}>Configuring ponds for</span>
              <h3 style={styles.summaryFarmerName}>{farmerForm.name}</h3>
              <span style={styles.summaryMeta}>
                📍 {farmerForm.village} • 📱 {farmerForm.phone}
              </span>
            </div>

            <button
              type="button"
              className="transition-all duration-150 hover:bg-indigo-100 active:scale-95 cursor-pointer"
              style={styles.addPondBtn}
              onClick={handleAddExtraPond}
            >
              <Plus size={14} strokeWidth={2.5} /> Add Pond
            </button>
          </div>

          <div style={styles.pondsList}>
            {pondsData.map((pond, idx) => (
              <div key={idx} style={styles.pondCard}>
                <div style={styles.pondCardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={styles.pondNumBadge}>{idx + 1}</div>
                    <input
                      type="text"
                      value={pond.name}
                      onChange={(e) => handlePondChange(idx, 'name', e.target.value)}
                      style={styles.pondNameInput}
                      placeholder={`Pond ${idx + 1}`}
                      required
                    />
                  </div>

                  {pondsData.length > 1 && (
                    <button
                      type="button"
                      className="transition-all duration-150 hover:opacity-80 active:scale-90 cursor-pointer"
                      style={styles.removePondBtn}
                      onClick={() => handleRemovePond(idx)}
                      title="Remove Pond"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div style={styles.grid2Col}>
                  <div>
                    <label style={styles.fieldLabel}>Pond Area (Acres) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={pond.area}
                      onChange={(e) => handlePondChange(idx, 'area', e.target.value)}
                      style={styles.textInput}
                      placeholder="2.5"
                      required
                    />
                  </div>

                  <div>
                    <label style={styles.fieldLabel}>Species *</label>
                    <select
                      value={pond.species}
                      onChange={(e) => handlePondChange(idx, 'species', e.target.value)}
                      style={styles.textInput}
                    >
                      <option value="Vannamei">Vannamei</option>
                      <option value="Monodon">Monodon (Black Tiger)</option>
                      <option value="Scampi">Scampi</option>
                      <option value="Fish">Fish / Tilapia</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.footerActionRow}>
            <button
              type="button"
              className="transition-all duration-150 hover:bg-slate-50 active:scale-98 cursor-pointer"
              style={styles.secondaryBtn}
              onClick={() => setStep(1)}
            >
              ← Back
            </button>

            <button
              type="button"
              className="transition-all duration-200 hover:brightness-110 active:scale-98 cursor-pointer"
              style={styles.saveAllBtn}
              onClick={handleFinalSave}
            >
              <Save size={15} />
              <span>Save Farmer & {pondsData.length} Ponds</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#0F172A',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    padding: 0,
  },
  stepBadge: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#0018AD',
    backgroundColor: '#EDF0FF',
    padding: '4px 12px',
    borderRadius: '8px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '20px',
  },
  iconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#EDF0FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '12px',
    color: '#64748B',
    margin: '2px 0 0 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  grid2Col: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '14px 16px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '6px',
  },
  textInput: {
    width: '100%',
    height: '40px',
    padding: '0 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '14px',
    color: '#0F172A',
    boxSizing: 'border-box',
    outline: 'none',
  },
  gpsSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    padding: '12px 14px',
    border: '1px solid #E2E8F0',
  },
  gpsHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsStatusLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  gpsTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#0F172A',
  },
  gpsSub: {
    fontSize: '11px',
    color: '#64748B',
  },
  captureGpsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#EDF0FF',
    color: '#0018AD',
    border: '1px solid #CBD2FF',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  primaryActionBtn: {
    width: '100%',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: '#0018AD',
    color: '#FFFFFF',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 24, 173, 0.25)',
  },
  step2Container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '16px 20px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summarySub: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '500',
  },
  summaryFarmerName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
    margin: '2px 0',
  },
  summaryMeta: {
    fontSize: '12px',
    color: '#64748B',
  },
  addPondBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#EDF0FF',
    color: '#0018AD',
    border: '1px solid #CBD2FF',
    padding: '7px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  pondsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  pondCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '16px 18px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  pondCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #F1F5F9',
  },
  pondNumBadge: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#0018AD',
    color: '#FFFFFF',
    fontSize: '11px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pondNameInput: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
  },
  removePondBtn: {
    background: 'none',
    border: 'none',
    color: '#DC2626',
    cursor: 'pointer',
    padding: '4px',
  },
  footerActionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginTop: '6px',
  },
  secondaryBtn: {
    padding: '0 18px',
    height: '42px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  saveAllBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#0018AD',
    color: '#FFFFFF',
    border: 'none',
    padding: '0 20px',
    height: '42px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 24, 173, 0.25)',
  },
};

export default AddFarmer;
