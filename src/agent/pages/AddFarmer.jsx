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
    numberOfTanks: '2',
    extent: '',
    status: 'ACTIVE',
  });

  const [gpsData, setGpsData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [tanksData, setTanksData] = useState([]);

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

  const handleProceedToTanks = (e) => {
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

    const numTanks = parseInt(farmerForm.numberOfTanks) || 1;
    const defaultTankArea = farmerForm.extent && parseFloat(farmerForm.extent) > 0
      ? (parseFloat(farmerForm.extent) / numTanks).toFixed(1)
      : '2.5';
    const defaultWaterArea = (parseFloat(defaultTankArea) * 0.88).toFixed(1);

    const initialTanks = Array.from({ length: numTanks }, (_, i) => ({
      name: `Tank ${i + 1}`,
      area: defaultTankArea,
      waterArea: defaultWaterArea,
      salinity: '16',
      soilType: 'Loam',
      hatchery: 'Golden Marine Hatchery',
      brooder: 'Kona Bay',
      seedDate: new Date().toISOString().split('T')[0],
      seedStockingLak: '2.5',
      feedType: 'Premium',
      species: 'Vannamei',
      cultureType: 'Semi-Intensive',
      stockingDate: new Date().toISOString().split('T')[0],
      seedQuantity: '250,000',
      initialBiomass: '0',
      biomass: '600kg',
      abw: '10g',
      fcr: '1.15',
      status: 'ACTIVE',
      notes: '',
    }));

    setTanksData(initialTanks);
    setStep(2);
  };

  const handleTankChange = (index, field, value) => {
    setTanksData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddExtraTank = () => {
    setTanksData(prev => [
      ...prev,
      {
        name: `Tank ${prev.length + 1}`,
        area: '2.5',
        waterArea: '2.2',
        salinity: '16',
        soilType: 'Loam',
        hatchery: 'Golden Marine Hatchery',
        brooder: 'Kona Bay',
        seedDate: new Date().toISOString().split('T')[0],
        seedStockingLak: '2.5',
        feedType: 'Premium',
        species: 'Vannamei',
        cultureType: 'Semi-Intensive',
        stockingDate: new Date().toISOString().split('T')[0],
        seedQuantity: '250,000',
        initialBiomass: '0',
        biomass: '500kg',
        abw: '8g',
        fcr: '1.2',
        status: 'ACTIVE',
        notes: '',
      }
    ]);
  };

  const handleRemoveTank = (index) => {
    if (tanksData.length <= 1) {
      alert('At least one tank is required.');
      return;
    }
    setTanksData(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinalSave = () => {
    const agentId = session?.agentId || 'agent001';
    const calculatedAcres = tanksData.reduce((acc, p) => acc + (parseFloat(p.area) || 0), 0);
    const finalAcres = farmerForm.extent && parseFloat(farmerForm.extent) > 0 
      ? parseFloat(farmerForm.extent) 
      : calculatedAcres;

    const farmerPayload = {
      name: farmerForm.name.trim(),
      phone: farmerForm.phone.trim(),
      alternatePhone: farmerForm.alternatePhone.trim(),
      village: farmerForm.village.trim(),
      area: farmerForm.mandal.trim() || farmerForm.village.trim(),
      district: farmerForm.district,
      address: farmerForm.address,
      waterSource: farmerForm.waterSource,
      acres: finalAcres,
      extent: finalAcres,
      numberOfTanks: tanksData.length.toString(),
      status: farmerForm.status,
      gps: gpsData,
    };

    const createdFarmerId = createFarmerWithTanks(agentId, farmerPayload, tanksData);
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
          Step {step} of 2: {step === 1 ? 'Farmer Details' : 'Tank Setup'}
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

          <form onSubmit={handleProceedToTanks} style={styles.form}>
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
                <label style={styles.fieldLabel}>Initial Number of Tanks *</label>
                <select
                  name="numberOfTanks"
                  value={farmerForm.numberOfTanks}
                  onChange={handleFarmerChange}
                  style={styles.textInput}
                >
                  <option value="1">1 Tank</option>
                  <option value="2">2 Tanks</option>
                  <option value="3">3 Tanks</option>
                  <option value="4">4 Tanks</option>
                  <option value="5">5 Tanks</option>
                  <option value="6">6 Tanks</option>
                </select>
              </div>

              <div>
                <label style={styles.fieldLabel}>Extent (Acres)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  name="extent"
                  value={farmerForm.extent}
                  onChange={handleFarmerChange}
                  style={styles.textInput}
                  placeholder="e.g. 5.0"
                />
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
              <span>Continue to Tank Details</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      ) : (
        /* STEP 2: Tank Details Form */
        <div style={styles.step2Container}>
          <div style={styles.summaryCard}>
            <div>
              <span style={styles.summarySub}>Configuring tanks for</span>
              <h3 style={styles.summaryFarmerName}>{farmerForm.name}</h3>
              <span style={styles.summaryMeta}>
                📍 {farmerForm.village} • 📱 {farmerForm.phone} {farmerForm.extent ? `• 🌾 ${farmerForm.extent} Acres` : ''}
              </span>
            </div>

            <button
              type="button"
              className="transition-all duration-150 hover:bg-indigo-100 active:scale-95 cursor-pointer"
              style={styles.addPondBtn}
              onClick={handleAddExtraTank}
            >
              <Plus size={14} strokeWidth={2.5} /> Add Tank
            </button>
          </div>

          <div style={styles.pondsList}>
            {tanksData.map((tank, idx) => (
              <div key={idx} style={styles.pondCard}>
                <div style={styles.pondCardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={styles.pondNumBadge}>{idx + 1}</div>
                    <input
                      type="text"
                      value={tank.name}
                      onChange={(e) => handleTankChange(idx, 'name', e.target.value)}
                      style={styles.pondNameInput}
                      placeholder={`Tank ${idx + 1}`}
                      required
                    />
                  </div>

                  {tanksData.length > 1 && (
                    <button
                      type="button"
                      className="transition-all duration-150 hover:opacity-80 active:scale-90 cursor-pointer"
                      style={styles.removePondBtn}
                      onClick={() => handleRemoveTank(idx)}
                      title="Remove Tank"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div style={styles.grid2Col}>
                  {/* 1. Tank Size- Acres */}
                  <div>
                    <label style={styles.fieldLabel}>Tank Size (Acres) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tank.area}
                      onChange={(e) => handleTankChange(idx, 'area', e.target.value)}
                      style={styles.textInput}
                      placeholder="2.5"
                      required
                    />
                  </div>

                  {/* 2. Salinity */}
                  <div>
                    <label style={styles.fieldLabel}>Salinity (ppt) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tank.salinity}
                      onChange={(e) => handleTankChange(idx, 'salinity', e.target.value)}
                      style={styles.textInput}
                      placeholder="16"
                      required
                    />
                  </div>

                  {/* 3. Soil Type */}
                  <div>
                    <label style={styles.fieldLabel}>Soil Type *</label>
                    <select
                      value={tank.soilType}
                      onChange={(e) => handleTankChange(idx, 'soilType', e.target.value)}
                      style={styles.textInput}
                      required
                    >
                      <option value="Loam">Loam</option>
                      <option value="Clay">Clay</option>
                      <option value="Sandy">Sandy</option>
                      <option value="Clay Loam">Clay Loam</option>
                      <option value="Sandy Clay">Sandy Clay</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* 4. Hatchery Name */}
                  <div>
                    <label style={styles.fieldLabel}>Hatchery Name *</label>
                    <input
                      type="text"
                      value={tank.hatchery}
                      onChange={(e) => handleTankChange(idx, 'hatchery', e.target.value)}
                      style={styles.textInput}
                      placeholder="e.g. Golden Marine / BMR"
                      required
                    />
                  </div>

                  {/* 5. Brooder */}
                  <div>
                    <label style={styles.fieldLabel}>Brooder *</label>
                    <select
                      value={tank.brooder}
                      onChange={(e) => handleTankChange(idx, 'brooder', e.target.value)}
                      style={styles.textInput}
                      required
                    >
                      <option value="Syaqua">Syaqua</option>
                      <option value="Kona Bay">Kona Bay</option>
                      <option value="SIS">SIS (Shrimp Improvement Systems)</option>
                      <option value="American Penaeid">American Penaeid</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* 6. Seed Date */}
                  <div>
                    <label style={styles.fieldLabel}>Seed Date *</label>
                    <input
                      type="date"
                      value={tank.seedDate}
                      onChange={(e) => handleTankChange(idx, 'seedDate', e.target.value)}
                      style={styles.textInput}
                      required
                    />
                  </div>

                  {/* 7. Seed NumberStocking (Lak) */}
                  <div>
                    <label style={styles.fieldLabel}>Seed NumberStocking (Lak) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={tank.seedStockingLak}
                      onChange={(e) => handleTankChange(idx, 'seedStockingLak', e.target.value)}
                      style={styles.textInput}
                      placeholder="2.5"
                      required
                    />
                  </div>

                  {/* 8. Feed Type */}
                  <div>
                    <label style={styles.fieldLabel}>Feed Type *</label>
                    <select
                      value={tank.feedType}
                      onChange={(e) => handleTankChange(idx, 'feedType', e.target.value)}
                      style={styles.textInput}
                      required
                    >
                      <option value="Premium">Premium</option>
                      <option value="Functional">Functional</option>
                      <option value="Hypro">Hypro</option>
                      <option value="Tiger Feed">Tiger Feed</option>
                      <option value="Royals Supreme">Royals Supreme</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* 9. Species */}
                  <div>
                    <label style={styles.fieldLabel}>Species *</label>
                    <select
                      value={tank.species}
                      onChange={(e) => handleTankChange(idx, 'species', e.target.value)}
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
              <span>Save Farmer & {tanksData.length} Tanks</span>
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
    borderRadius: '14px',
    padding: 'clamp(14px, 3.5vw, 24px)',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    boxSizing: 'border-box',
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '14px',
    borderBottom: '1px solid #F1F5F9',
  },
  iconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 'clamp(17px, 3.5vw, 20px)',
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
    gap: '16px',
  },
  grid2Col: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
    gap: '12px 16px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '5px',
  },
  textInput: {
    width: '100%',
    height: '42px',
    padding: '0 12px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '13.5px',
    color: '#0F172A',
    boxSizing: 'border-box',
    outline: 'none',
  },
  gpsSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    padding: '12px 14px',
    border: '1px solid #E2E8F0',
  },
  gpsHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
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
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #BFDBFE',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  primaryActionBtn: {
    width: '100%',
    height: '46px',
    borderRadius: '12px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(26, 47, 184, 0.25)',
  },
  step2Container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: 'clamp(12px, 3vw, 18px)',
    border: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
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
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #BFDBFE',
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
    borderRadius: '14px',
    padding: 'clamp(14px, 3.5vw, 20px)',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    boxSizing: 'border-box',
    width: '100%',
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
    backgroundColor: '#1A2FB8',
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
    flexWrap: 'wrap',
  },
  secondaryBtn: {
    padding: '0 18px',
    height: '44px',
    borderRadius: '12px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    fontSize: '13.5px',
    fontWeight: '700',
    cursor: 'pointer',
    flex: '1 1 120px',
  },
  saveAllBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    padding: '0 20px',
    height: '44px',
    borderRadius: '12px',
    fontSize: '13.5px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(26, 47, 184, 0.25)',
    flex: '2 1 180px',
  },
};

export default AddFarmer;
