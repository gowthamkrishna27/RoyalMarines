import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFarmerById, getFarmers, getTanksByFarmer, calculateBiomass, calculateFCR } from '../utils/adminMockData';
import PageHeader from '../components/PageHeader';
import { 
  Database, Download, TrendingUp, Activity, 
  ArrowLeft, Droplets, Edit, X, Check, Fish, UserCheck, 
  ShieldCheck, AlertCircle, FileSpreadsheet 
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';

const FarmerDetail = () => {
  const { farmerId } = useParams();
  const navigate = useNavigate();
  
  // Load farmer from localStorage or fallback mock data
  const [farmer, setFarmer] = useState(() => {
    const savedFarmers = localStorage.getItem('royal_admin_farmers_data');
    if (savedFarmers) {
      try {
        const parsed = JSON.parse(savedFarmers);
        const found = parsed.find(f => f.id === farmerId);
        if (found) return found;
      } catch (e) {}
    }
    return getFarmerById(farmerId) || getFarmers()[0];
  });

  // Load and construct tanks with individual specifications
  const [tanksList, setTanksList] = useState(() => {
    const rawTanks = farmer?.tankBreakdown || getTanksByFarmer(farmer?.id) || [];
    const sourceTanks = rawTanks.length > 0 ? rawTanks : [
      { 
        id: `T-${farmer?.id || '349'}-1`, 
        name: 'Tank 1', 
        acres: farmer?.totalAcres || parseFloat(farmer?.acres) || 4.5,
        doc: 65,
        abw: 24.5, 
        biomass: 3800, 
        fcr: 1.30
      }
    ];

    return sourceTanks.map((t, idx) => {
      const acres = parseFloat(t.acres) || 4.0;
      const abw = t.abw || (20.0 + idx * 3.5);
      const seedStockingLak = t.seedStockingLak || parseFloat((acres * 0.8).toFixed(1));
      const biomass = calculateBiomass(seedStockingLak, abw);
      const feed = t.feed || (biomass * (t.fcr || 1.30)); // fallback feed if not present in mock
      const fcr = calculateFCR(feed, biomass);
      
      return {
        id: t.id || `T-${farmer?.id || '349'}-${idx + 1}`,
        name: t.name || `Tank ${idx + 1}`,
        acres,
        doc: t.doc || (50 + idx * 5),
        abw,
        biomass,
        fcr,
        feed,
        currentCycle: t.currentCycle || `Cycle 1 (2026)`,
        compliance: t.compliance || 100,
        waterSource: t.waterSource || farmer?.waterSource || (idx % 2 === 0 ? 'Creek / Estuary' : 'Sea / Coastal Canal'),
        salinity: t.salinity || (14 + (idx * 2)),
        soilType: t.soilType || (idx % 3 === 0 ? 'Clay Loam' : idx % 3 === 1 ? 'Loam' : 'Clay'),
        hatcheryName: t.hatcheryName || (idx % 2 === 0 ? 'Apex Marine Hatcheries (Nellore)' : 'BMR Marine SPF Hatchery'),
        brooder: t.brooder || (idx % 2 === 0 ? 'Kona Bay (USA)' : 'Syaqua (Thailand)'),
        seedDate: t.seedDate || `2026-05-${10 + idx * 5}`,
        seedStockingLak,
        feedType: t.feedType || (idx % 2 === 0 ? 'Premium Pellets (Royal Pro)' : 'Functional Feed (Aqua Boost)')
      };
    });
  });

  const [activeTankIndex, setActiveTankIndex] = useState(0);
  const [growthMetric, setGrowthMetric] = useState('ABW'); // 'ABW', 'BIOMASS', 'FCR', 'FEED'
  const [toastMessage, setToastMessage] = useState('');
  const [showEditTankModal, setShowEditTankModal] = useState(false);

  const activeTank = tanksList[activeTankIndex] || tanksList[0];

  // Edit Tank Form State
  const [editTankForm, setEditTankForm] = useState({
    name: '',
    acres: 4.5,
    waterSource: 'Creek / Estuary',
    salinity: 15,
    soilType: 'Loam',
    hatcheryName: '',
    brooder: 'Kona Bay',
    seedDate: '2026-05-15',
    seedStockingLak: 3.5,
    feedType: 'Premium Pellets',
    currentCycle: 'Cycle 1 (2026)',
    abw: 24.5,
    fcr: 1.30
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Open Edit Modal for active tank
  const openEditTankModal = () => {
    setEditTankForm({
      name: activeTank.name || `Tank ${activeTankIndex + 1}`,
      acres: activeTank.acres || 4.5,
      waterSource: activeTank.waterSource || 'Creek / Estuary',
      salinity: activeTank.salinity || 15,
      soilType: activeTank.soilType || 'Loam',
      hatcheryName: activeTank.hatcheryName || 'Apex Marine Hatcheries',
      brooder: activeTank.brooder || 'Kona Bay',
      seedDate: activeTank.seedDate || '2026-05-15',
      seedStockingLak: activeTank.seedStockingLak || 3.5,
      feedType: activeTank.feedType || 'Premium Pellets',
      currentCycle: activeTank.currentCycle || 'Cycle 1 (2026)',
      abw: activeTank.abw || 24.5,
      fcr: activeTank.fcr || 1.30
    });
    setShowEditTankModal(true);
  };

  // Save Tank Edit Changes
  const handleSaveTankDetails = (e) => {
    e.preventDefault();

    const updatedAcres = parseFloat(editTankForm.acres) || activeTank.acres;
    const updatedABW = parseFloat(editTankForm.abw) || activeTank.abw;
    const updatedSeedStockingLak = parseFloat(editTankForm.seedStockingLak) || activeTank.seedStockingLak;
    const updatedBiomass = calculateBiomass(updatedSeedStockingLak, updatedABW);
    // Since FCR is derived from feed and biomass, we preserve feed and recalculate FCR,
    // but the edit modal's FCR is considered "Target FCR". We'll just store the target FCR as targetFcr
    // and keep the actual fcr calculated dynamically.
    const updatedTargetFcr = parseFloat(editTankForm.fcr) || 1.30;
    const updatedFCR = calculateFCR(activeTank.feed, updatedBiomass);

    const updatedTank = {
      ...activeTank,
      name: editTankForm.name.trim(),
      acres: updatedAcres,
      waterSource: editTankForm.waterSource,
      salinity: parseFloat(editTankForm.salinity) || 15,
      soilType: editTankForm.soilType,
      hatcheryName: editTankForm.hatcheryName.trim(),
      brooder: editTankForm.brooder,
      seedDate: editTankForm.seedDate,
      seedStockingLak: updatedSeedStockingLak,
      feedType: editTankForm.feedType,
      currentCycle: editTankForm.currentCycle.trim(),
      abw: updatedABW,
      biomass: updatedBiomass,
      fcr: updatedFCR,
      targetFcr: updatedTargetFcr
    };

    const updatedTanksList = tanksList.map((t, idx) => idx === activeTankIndex ? updatedTank : t);
    setTanksList(updatedTanksList);

    // Calculate new total acres for farmer
    const newTotalAcres = updatedTanksList.reduce((acc, t) => acc + (t.acres || 0), 0);
    const updatedFarmer = {
      ...farmer,
      totalAcres: newTotalAcres,
      acres: `${newTotalAcres.toFixed(1)} Acres`,
      waterSource: updatedTank.waterSource,
      tankBreakdown: updatedTanksList
    };

    setFarmer(updatedFarmer);

    // Update in localStorage
    const savedFarmers = localStorage.getItem('royal_admin_farmers_data');
    if (savedFarmers) {
      try {
        const parsed = JSON.parse(savedFarmers);
        const updatedAll = parsed.map(f => f.id === farmer.id ? updatedFarmer : f);
        localStorage.setItem('royal_admin_farmers_data', JSON.stringify(updatedAll));
      } catch (err) {}
    }

    showToast(`Details for ${updatedTank.name} updated successfully!`);
    setShowEditTankModal(false);
  };

  // Clean, realistic Water Quality Logs for active tank
  const baseSal = activeTank.salinity || 16;
  const agentShortName = farmer?.agent ? farmer.agent.split(' ')[0] + ' ' + (farmer.agent.split(' ')[1] || '') : 'P. Raju';

  const waterQualityLogs = [
    {
      id: 1,
      doc: activeTank.doc || 65,
      date: '2026-08-20',
      agent: agentShortName,
      salinity: baseSal,
      ph: 7.9,
      alkalinity: 145,
      hardness: baseSal * 300,
      ammonia: 0.05,
      nitrite: 0.02,
      potassium: parseFloat((baseSal * 10.7).toFixed(1)),
      do: 5.8,
      h2s: 0.00,
      cl: 0.01,
      fe: 0.01,
      waterColor: 'Light Green'
    },
    {
      id: 2,
      doc: (activeTank.doc || 65) - 10,
      date: '2026-08-10',
      agent: agentShortName,
      salinity: Math.max(1, baseSal - 1),
      ph: 8.1,
      alkalinity: 150,
      hardness: Math.max(1, baseSal - 1) * 300,
      ammonia: 0.08,
      nitrite: 0.03,
      potassium: parseFloat(((Math.max(1, baseSal - 1)) * 10.7).toFixed(1)),
      do: 5.4,
      h2s: 0.00,
      cl: 0.01,
      fe: 0.01,
      waterColor: 'Greenish Brown'
    },
    {
      id: 3,
      doc: (activeTank.doc || 65) - 20,
      date: '2026-07-31',
      agent: agentShortName,
      salinity: Math.max(1, baseSal - 2),
      ph: 8.0,
      alkalinity: 140,
      hardness: Math.max(1, baseSal - 2) * 300,
      ammonia: 0.04,
      nitrite: 0.01,
      potassium: parseFloat(((Math.max(1, baseSal - 2)) * 10.7).toFixed(1)),
      do: 6.2,
      h2s: 0.00,
      cl: 0.00,
      fe: 0.01,
      waterColor: 'Light Green'
    },
    {
      id: 4,
      doc: (activeTank.doc || 65) - 30,
      date: '2026-07-21',
      agent: agentShortName,
      salinity: Math.max(1, baseSal - 3),
      ph: 7.8,
      alkalinity: 135,
      hardness: Math.max(1, baseSal - 3) * 300,
      ammonia: 0.02,
      nitrite: 0.01,
      potassium: parseFloat(((Math.max(1, baseSal - 3)) * 10.7).toFixed(1)),
      do: 6.6,
      h2s: 0.00,
      cl: 0.00,
      fe: 0.00,
      waterColor: 'Clear Green'
    },
    {
      id: 5,
      doc: 20,
      date: '2026-07-06',
      agent: agentShortName,
      salinity: Math.max(1, baseSal - 3),
      ph: 7.7,
      alkalinity: 130,
      hardness: Math.max(1, baseSal - 3) * 300,
      ammonia: 0.01,
      nitrite: 0.00,
      potassium: parseFloat(((Math.max(1, baseSal - 3)) * 10.7).toFixed(1)),
      do: 7.1,
      h2s: 0.00,
      cl: 0.00,
      fe: 0.00,
      waterColor: 'Clear'
    }
  ];

  // Historical growth sampling data
  const docDays = [10, 20, 30, 40, 50, 60, 70];
  const growthData = docDays.map(doc => {
    const entry = { doc: `DOC ${doc}`, docNum: doc };
    const tankAcres = activeTank.acres || 4.0;
    const baseABW = (doc / 70) * (activeTank.abw || 24.0);
    
    const abwVal = parseFloat(baseABW.toFixed(2));
    const biomassVal = calculateBiomass(activeTank.seedStockingLak, abwVal);
    const hypotheticalFcr = 0.88 + (doc / 70) * 0.44;
    const feedVal = Math.round(biomassVal * hypotheticalFcr);
    const fcrVal = parseFloat(calculateFCR(feedVal, biomassVal));

    entry.abw = abwVal;
    entry.biomass = biomassVal;
    entry.fcr = fcrVal;
    entry.feed = feedVal;

    return entry;
  });

  // Helper to generate visual ASCII / Progress bar for Excel cells
  const generateProgressBar = (current, max, length = 12) => {
    const filled = Math.min(length, Math.max(1, Math.round((current / max) * length)));
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  // 1. Download Formatted, Styled Excel (.xls) with Embedded Visual Charts & Formatted Tables
  const handleDownloadFormattedExcel = () => {
    const maxABW = Math.max(...growthData.map(g => g.abw), 30);
    const maxBiomass = Math.max(...growthData.map(g => g.biomass), 4000);

    // Build embedded SVG Visual Growth Chart to include directly in Excel
    const chartSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="680" height="220" viewBox="0 0 680 220" style="background:#ffffff; font-family:'Segoe UI',sans-serif;">
        <rect width="680" height="220" fill="#f8fafc" rx="8" stroke="#e2e8f0" stroke-width="1"/>
        <text x="20" y="28" font-size="14" font-weight="bold" fill="#0f172a">${activeTank.name} Growth Trajectory &amp; Biomass Curve (DOC 10 - DOC 70)</text>
        <line x1="60" y1="45" x2="60" y2="175" stroke="#cbd5e1" stroke-width="1.5"/>
        <line x1="60" y1="175" x2="640" y2="175" stroke="#cbd5e1" stroke-width="1.5"/>
        
        <!-- Y-Axis Gridlines & Labels -->
        <line x1="60" y1="145" x2="640" y2="145" stroke="#f1f5f9" stroke-width="1"/>
        <text x="25" y="149" font-size="10" fill="#64748b">10g</text>
        <line x1="60" y1="110" x2="640" y2="110" stroke="#f1f5f9" stroke-width="1"/>
        <text x="25" y="114" font-size="10" fill="#64748b">20g</text>
        <line x1="60" y1="75" x2="640" y2="75" stroke="#f1f5f9" stroke-width="1"/>
        <text x="25" y="79" font-size="10" fill="#64748b">30g</text>

        <!-- Growth Trajectory Curve (ABW) -->
        <polyline fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
          points="80,165 160,150 240,132 320,112 400,90 480,72 560,55" />
        
        <!-- Biomass Bars Underlay -->
        <rect x="72" y="158" width="16" height="17" fill="#93c5fd" opacity="0.6" rx="2"/>
        <rect x="152" y="142" width="16" height="33" fill="#93c5fd" opacity="0.6" rx="2"/>
        <rect x="232" y="120" width="16" height="55" fill="#93c5fd" opacity="0.6" rx="2"/>
        <rect x="312" y="98" width="16" height="77" fill="#93c5fd" opacity="0.6" rx="2"/>
        <rect x="392" y="76" width="16" height="99" fill="#93c5fd" opacity="0.6" rx="2"/>
        <rect x="472" y="58" width="16" height="117" fill="#93c5fd" opacity="0.6" rx="2"/>
        <rect x="552" y="42" width="16" height="133" fill="#93c5fd" opacity="0.6" rx="2"/>

        <!-- Data Dots -->
        <circle cx="80" cy="165" r="4.5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="160" cy="150" r="4.5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="240" cy="132" r="4.5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="320" cy="112" r="4.5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="400" cy="90" r="4.5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="480" cy="72" r="4.5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="560" cy="55" r="4.5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5"/>

        <!-- X-Axis Labels -->
        <text x="70" y="195" font-size="11" font-weight="600" fill="#475569">DOC 10</text>
        <text x="150" y="195" font-size="11" font-weight="600" fill="#475569">DOC 20</text>
        <text x="230" y="195" font-size="11" font-weight="600" fill="#475569">DOC 30</text>
        <text x="310" y="195" font-size="11" font-weight="600" fill="#475569">DOC 40</text>
        <text x="390" y="195" font-size="11" font-weight="600" fill="#475569">DOC 50</text>
        <text x="470" y="195" font-size="11" font-weight="600" fill="#475569">DOC 60</text>
        <text x="550" y="195" font-size="11" font-weight="600" fill="#475569">DOC 70</text>

        <!-- Legend -->
        <circle cx="460" cy="24" r="4" fill="#2563eb"/>
        <text x="470" y="28" font-size="11" font-weight="600" fill="#334155">ABW (g) Curve</text>
        <rect x="560" y="20" width="10" height="8" fill="#93c5fd" opacity="0.7"/>
        <text x="575" y="28" font-size="11" font-weight="600" fill="#334155">Biomass (kg)</text>
      </svg>
    `;

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
         <x:ExcelWorkbook>
          <x:ExcelWorksheets>
           <x:ExcelWorksheet>
            <x:Name>${activeTank.name} Report</x:Name>
            <x:WorksheetOptions>
             <x:DisplayGridlines/>
            </x:WorksheetOptions>
           </x:ExcelWorksheet>
          </x:ExcelWorksheets>
         </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; }
          table { border-collapse: collapse; margin-bottom: 22px; width: 100%; }
          .main-header { background-color: #1e3a8a; color: #ffffff; font-size: 15pt; font-weight: bold; padding: 12px; text-align: center; }
          .sub-title { background-color: #2563eb; color: #ffffff; font-size: 12pt; font-weight: bold; padding: 8px 12px; }
          .meta-label { background-color: #f8fafc; font-weight: bold; color: #475569; padding: 6px 10px; border: 1px solid #cbd5e1; width: 18%; }
          .meta-value { background-color: #ffffff; color: #0f172a; padding: 6px 10px; border: 1px solid #cbd5e1; width: 32%; }
          .section-title { background-color: #0284c7; color: #ffffff; font-size: 12pt; font-weight: bold; padding: 8px 12px; }
          .tbl-th { background-color: #f1f5f9; color: #334155; font-weight: bold; padding: 8px 10px; border: 1px solid #cbd5e1; text-align: left; }
          .tbl-td { padding: 7px 10px; border: 1px solid #e2e8f0; vertical-align: middle; color: #1e293b; }
          .tbl-td-bold { padding: 7px 10px; border: 1px solid #e2e8f0; vertical-align: middle; font-weight: bold; color: #0f172a; }
          .graph-box { background-color: #ffffff; border: 1px solid #cbd5e1; padding: 16px; text-align: center; }
          .progress-bar { font-family: 'Courier New', monospace; font-size: 10pt; color: #2563eb; font-weight: bold; letter-spacing: -1px; }
          .alert-txt { color: #dc2626; font-weight: bold; }
          .ok-txt { color: #16a34a; font-weight: 600; }
        </style>
      </head>
      <body>
        <!-- Header Banner -->
        <table>
          <tr>
            <td colspan="7" class="main-header">
              ROYAL'S MARINE FOOD — AQUACULTURE FIELD PERFORMANCE REPORT
            </td>
          </tr>
          <tr>
            <td colspan="7" class="sub-title">
              Farmer: ${farmer.name.toUpperCase()} (ID: ${farmer.id}) • Selected: ${activeTank.name.toUpperCase()}
            </td>
          </tr>
        </table>

        <!-- Farmer & Incharge Metadata Table -->
        <table>
          <tr>
            <td class="meta-label">Farmer Full Name:</td>
            <td class="meta-value"><strong>${farmer.name}</strong></td>
            <td class="meta-label">Farmer ID:</td>
            <td class="meta-value">${farmer.id}</td>
          </tr>
          <tr>
            <td class="meta-label">Contact Phone:</td>
            <td class="meta-value">${farmer.phone}</td>
            <td class="meta-label">Total Land &amp; Tanks:</td>
            <td class="meta-value">${farmer.acres} (${tanksList.length} Cultivated Tanks)</td>
          </tr>
          <tr>
            <td class="meta-label">Region &amp; Locality:</td>
            <td class="meta-value">${farmer.region} (${farmer.locality})</td>
            <td class="meta-label">Village Name:</td>
            <td class="meta-value">${farmer.village}</td>
          </tr>
          <tr>
            <td class="meta-label">Collecting Field Agent:</td>
            <td class="meta-value"><strong>${farmer.agent}</strong></td>
            <td class="meta-label">Regional Incharge:</td>
            <td class="meta-value">${farmer.incharge}</td>
          </tr>
        </table>

        <!-- Section 1: Tank Specifications Table -->
        <table>
          <tr>
            <td colspan="4" class="section-title">
              1. TANK SETUP SPECIFICATIONS &amp; BIOPHYSICAL ORIGIN: ${activeTank.name.toUpperCase()}
            </td>
          </tr>
          <tr>
            <td class="tbl-th" style="width: 25%;">PARAMETER</td>
            <td class="tbl-th" style="width: 25%;">SPECIFICATION VALUE</td>
            <td class="tbl-th" style="width: 25%;">PARAMETER</td>
            <td class="tbl-th" style="width: 25%;">SPECIFICATION VALUE</td>
          </tr>
          <tr>
            <td class="tbl-td-bold">Tank Label / Spread</td>
            <td class="tbl-td">${activeTank.name} (${activeTank.acres} Acres)</td>
            <td class="tbl-td-bold">Source of Water</td>
            <td class="tbl-td">${activeTank.waterSource || farmer.waterSource || 'Creek / Estuary'}</td>
          </tr>
          <tr>
            <td class="tbl-td-bold">Baseline Salinity</td>
            <td class="tbl-td">${activeTank.salinity} ppt</td>
            <td class="tbl-td-bold">Soil Type</td>
            <td class="tbl-td">${activeTank.soilType || 'Clay Loam'}</td>
          </tr>
          <tr>
            <td class="tbl-td-bold">Hatchery SPF Source</td>
            <td class="tbl-td">${activeTank.hatcheryName || 'Apex Marine Hatcheries'}</td>
            <td class="tbl-td-bold">Brooder Lineage</td>
            <td class="tbl-td">${activeTank.brooder || 'Kona Bay'}</td>
          </tr>
          <tr>
            <td class="tbl-td-bold">Seed Stocking Date</td>
            <td class="tbl-td">${activeTank.seedDate || '2026-05-15'}</td>
            <td class="tbl-td-bold">Stocking Count (Lakhs)</td>
            <td class="tbl-td">${activeTank.seedStockingLak} Lakhs (${((activeTank.seedStockingLak * 100000) / (activeTank.acres * 4046.86)).toFixed(1)} / m²)</td>
          </tr>
          <tr>
            <td class="tbl-td-bold">Feed Type / Diet</td>
            <td class="tbl-td">${activeTank.feedType || 'Premium Pellets'}</td>
            <td class="tbl-td-bold">Culture Cycle</td>
            <td class="tbl-td">${activeTank.currentCycle || 'Cycle 1 (2026)'}</td>
          </tr>
        </table>

        <!-- Section 2: Visual Growth Graphs & Progress Curves -->
        <table>
          <tr>
            <td colspan="7" class="section-title">
              2. TANK GROWTH TRAJECTORY, VISUAL GRAPHS &amp; FEED CONVERSION: ${activeTank.name.toUpperCase()}
            </td>
          </tr>
          <tr>
            <td colspan="7" class="graph-box">
              ${chartSvg}
            </td>
          </tr>
          <tr>
            <td class="tbl-th">Day of Culture</td>
            <td class="tbl-th">Average Body Weight (ABW)</td>
            <td class="tbl-th">ABW Visual Growth Bar</td>
            <td class="tbl-th">Estimated Biomass (kg)</td>
            <td class="tbl-th">Biomass Progression Bar</td>
            <td class="tbl-th">FCR Efficiency</td>
            <td class="tbl-th">Cumulative Feed Intake (kg)</td>
          </tr>
          ${growthData.map(g => `
            <tr>
              <td class="tbl-td-bold">${g.doc}</td>
              <td class="tbl-td">${g.abw} g</td>
              <td class="tbl-td"><span class="progress-bar">${generateProgressBar(g.abw, maxABW)}</span> (${Math.round((g.abw / maxABW) * 100)}%)</td>
              <td class="tbl-td">${g.biomass.toLocaleString()} kg</td>
              <td class="tbl-td"><span class="progress-bar">${generateProgressBar(g.biomass, maxBiomass)}</span></td>
              <td class="tbl-td">${g.fcr}</td>
              <td class="tbl-td">${g.feed.toLocaleString()} kg</td>
            </tr>
          `).join('')}
        </table>

        <!-- Section 3: Water Quality Table -->
        <table>
          <tr>
            <td colspan="14" class="section-title">
              3. WATER QUALITY &amp; CHEMICAL TELEMETRY AUDIT LOG: ${activeTank.name.toUpperCase()}
            </td>
          </tr>
          <tr>
            <td class="tbl-th">DOC / Date</td>
            <td class="tbl-th">Field Agent</td>
            <td class="tbl-th">Salinity</td>
            <td class="tbl-th">pH</td>
            <td class="tbl-th">Alkalinity</td>
            <td class="tbl-th">Hardness</td>
            <td class="tbl-th">Ammonia (NH3)</td>
            <td class="tbl-th">Nitrite (NO2)</td>
            <td class="tbl-th">Potassium (K)</td>
            <td class="tbl-th">DO (mg/L)</td>
            <td class="tbl-th">H2S</td>
            <td class="tbl-th">Cl</td>
            <td class="tbl-th">Fe</td>
            <td class="tbl-th">Water Color</td>
          </tr>
          ${waterQualityLogs.map(w => `
            <tr>
              <td class="tbl-td-bold">DOC ${w.doc} (${w.date})</td>
              <td class="tbl-td">${w.agent}</td>
              <td class="tbl-td">${w.salinity} ppt</td>
              <td class="tbl-td">${w.ph}</td>
              <td class="tbl-td">${w.alkalinity} ppm</td>
              <td class="tbl-td">${w.hardness} ppm</td>
              <td class="tbl-td">${w.ammonia > 0.5 ? `<span class="alert-cell">${w.ammonia}</span>` : w.ammonia}</td>
              <td class="tbl-td">${w.nitrite > 0.25 ? `<span class="alert-cell">${w.nitrite}</span>` : w.nitrite}</td>
              <td class="tbl-td">${w.potassium} ppm</td>
              <td class="tbl-td">${w.do < 4.0 ? `<span class="alert-cell">${w.do} mg/L (ALERT)</span>` : `<span class="ok-txt">${w.do} mg/L</span>`}</td>
              <td class="tbl-td">${w.h2s}</td>
              <td class="tbl-td">${w.cl}</td>
              <td class="tbl-td">${w.fe}</td>
              <td class="tbl-td">${w.waterColor}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${farmer.name.replace(/\s+/g, '_')}_${activeTank.name}_Master_Analytics.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Master Excel Report for ${activeTank.name} downloaded successfully!`);
  };

  return (
    <div style={styles.container}>
      {/* Top Header & Breadcrumb */}
      <div style={styles.topNavRow}>
        <button onClick={() => navigate('/admin/farmers')} style={styles.backBtn}>
          <ArrowLeft size={15} />
          <span>Back to All Farmers</span>
        </button>
      </div>

      <PageHeader 
        title={`Farmer & Tank Analytics: ${farmer.name}`} 
        breadcrumbs={[
          { label: 'Organization' },
          { label: 'Farmers', path: '/admin/farmers' }, 
          { label: farmer.name, active: true }
        ]} 
      />

      {/* 1. Farmer Master Profile Card */}
      <div style={styles.card}>
        <div style={styles.profileHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={styles.farmerTitle}>{farmer.name}</h2>
              <span style={styles.idBadge}>{farmer.id}</span>
              <span style={styles.activePill}>{farmer.status || 'Active'}</span>
            </div>
            <p style={styles.profileSubtitle}>
              {farmer.region} • {farmer.locality} • {farmer.village}
            </p>
          </div>

          {/* Export Action: Master Formatted Excel */}
          <button 
            style={styles.exportExcelBtn}
            onClick={handleDownloadFormattedExcel}
            title="Download structured, styled Excel spreadsheet with embedded visual charts"
          >
            <FileSpreadsheet size={15} />
            <span>Download Formatted Excel (With Graphs)</span>
          </button>
        </div>

        {/* 4 Clean Profile Details Blocks */}
        <div style={styles.profileGrid}>
          <div style={styles.profileBlock}>
            <span style={styles.blockLabel}>CONTACT NUMBER</span>
            <span style={styles.blockValue}>{farmer.phone}</span>
          </div>
          <div style={styles.profileBlock}>
            <span style={styles.blockLabel}>TOTAL LAND &amp; TANKS</span>
            <span style={styles.blockValue}>
              {farmer.acres} • {tanksList.length} {tanksList.length > 1 ? 'Tanks' : 'Tank'}
            </span>
          </div>
          <div style={styles.profileBlock}>
            <span style={styles.blockLabel}>FIELD AGENT</span>
            <span style={styles.blockValue}>{farmer.agent}</span>
          </div>
          <div style={styles.profileBlock}>
            <span style={styles.blockLabel}>REGIONAL INCHARGE</span>
            <span style={styles.blockValue}>{farmer.incharge}</span>
          </div>
        </div>
      </div>

      {/* 2. Tank Tabs Navigation Bar */}
      <div style={styles.tankTabsContainer}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={styles.selectTankLabel}>Select Tank:</span>
            {tanksList.map((tank, idx) => (
              <button
                key={tank.id || idx}
                style={{
                  ...styles.tankNavTab,
                  ...(activeTankIndex === idx ? styles.tankNavTabActive : {})
                }}
                onClick={() => setActiveTankIndex(idx)}
              >
                <Database size={14} color={activeTankIndex === idx ? '#2563eb' : '#64748b'} />
                <span>{tank.name} ({tank.acres} Ac)</span>
              </button>
            ))}
          </div>

          <button 
            style={styles.editTankQuickBtn}
            onClick={openEditTankModal}
          >
            <Edit size={13} />
            <span>Edit {activeTank.name} Details</span>
          </button>
        </div>
      </div>

      {/* 3. Section: Tank Specifications & Pond Setup */}
      <div style={styles.card}>
        <div style={styles.sectionHeaderRow}>
          <div>
            <h3 style={styles.sectionCardTitle}>
              {activeTank.name} Setup Specifications
            </h3>
            <p style={styles.sectionCardSubtitle}>
              Biophysical specifications and pond origin parameters
            </p>
          </div>

          <button 
            style={styles.editTankSpecsPrimaryBtn}
            onClick={openEditTankModal}
          >
            <Edit size={13} />
            <span>Edit Specs</span>
          </button>
        </div>

        {/* Tank Specifications Grid */}
        <div style={styles.specsGrid}>
          <div style={styles.specItemCard}>
            <span style={styles.specLabel}>TANK SIZE</span>
            <span style={styles.specPrimaryValue}>{activeTank.acres} Acres</span>
            <span style={styles.specFootnote}>Cultivated Water Spread</span>
          </div>

          <div style={styles.specItemCard}>
            <span style={styles.specLabel}>SOURCE OF WATER</span>
            <span style={styles.specPrimaryValue}>{activeTank.waterSource || farmer.waterSource || 'Creek / Estuary'}</span>
            <span style={styles.specFootnote}>Primary Water Intake</span>
          </div>

          <div style={styles.specItemCard}>
            <span style={styles.specLabel}>SALINITY</span>
            <span style={styles.specPrimaryValue}>{activeTank.salinity} ppt</span>
            <span style={styles.specFootnote}>Baseline Pond Salinity</span>
          </div>

          <div style={styles.specItemCard}>
            <span style={styles.specLabel}>SOIL TYPE</span>
            <span style={styles.specPrimaryValue}>{activeTank.soilType || 'Clay Loam'}</span>
            <span style={styles.specFootnote}>Soil Composition</span>
          </div>

          <div style={styles.specItemCard}>
            <span style={styles.specLabel}>HATCHERY NAME</span>
            <span style={styles.specPrimaryValue}>{activeTank.hatcheryName || 'Apex Hatcheries'}</span>
            <span style={styles.specFootnote}>SPF Certified Source</span>
          </div>

          <div style={styles.specItemCard}>
            <span style={styles.specLabel}>BROODER LINEAGE</span>
            <span style={styles.specPrimaryValue}>{activeTank.brooder || 'Kona Bay'}</span>
            <span style={styles.specFootnote}>Genetic Line</span>
          </div>

          <div style={styles.specItemCard}>
            <span style={styles.specLabel}>SEED DATE</span>
            <span style={styles.specPrimaryValue}>{activeTank.seedDate || '2026-05-15'}</span>
            <span style={styles.specFootnote}>Stocking Date</span>
          </div>

          <div style={styles.specItemCard}>
            <span style={styles.specLabel}>SEED STOCKING</span>
            <span style={styles.specPrimaryValue}>{activeTank.seedStockingLak} Lakhs</span>
            <span style={styles.specFootnote}>
              Density: {((activeTank.seedStockingLak * 100000) / (activeTank.acres * 4046.86)).toFixed(1)} / m²
            </span>
          </div>

          <div style={styles.specItemCard}>
            <span style={styles.specLabel}>FEED TYPE</span>
            <span style={styles.specPrimaryValue}>{activeTank.feedType || 'Premium Pellets'}</span>
            <span style={styles.specFootnote}>Commercial Diet</span>
          </div>
        </div>
      </div>

      {/* 4. Section: Tank Growth Graph Trajectory */}
      <div style={styles.card}>
        <div style={styles.sectionHeaderRow}>
          <div>
            <h3 style={styles.sectionCardTitle}>
              {activeTank.name} Growth Trajectory &amp; Feed Curve
            </h3>
            <p style={styles.sectionCardSubtitle}>
              Sampling telemetry across Day of Culture (DOC 10 to DOC 70)
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div style={styles.metricToggleGroup}>
            <button 
              style={{
                ...styles.metricTab,
                ...(growthMetric === 'ABW' ? styles.metricTabActive : {})
              }}
              onClick={() => setGrowthMetric('ABW')}
            >
              Average Weight (ABW)
            </button>
            <button 
              style={{
                ...styles.metricTab,
                ...(growthMetric === 'BIOMASS' ? styles.metricTabActive : {})
              }}
              onClick={() => setGrowthMetric('BIOMASS')}
            >
              Biomass (kg)
            </button>
            <button 
              style={{
                ...styles.metricTab,
                ...(growthMetric === 'FCR' ? styles.metricTabActive : {})
              }}
              onClick={() => setGrowthMetric('FCR')}
            >
              FCR
            </button>
            <button 
              style={{
                ...styles.metricTab,
                ...(growthMetric === 'FEED' ? styles.metricTabActive : {})
              }}
              onClick={() => setGrowthMetric('FEED')}
            >
              Feed (kg)
            </button>
          </div>
        </div>

        {/* Growth Graph */}
        <div style={{ height: '260px', marginTop: '12px' }}>
          <ResponsiveContainer width="100%" height="100%">
            {growthMetric === 'BIOMASS' || growthMetric === 'FEED' ? (
              <AreaChart data={growthData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="areaGradientSimple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="doc" 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  unit=" kg"
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    backgroundColor: '#ffffff'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey={growthMetric.toLowerCase()}
                  name={growthMetric === 'BIOMASS' ? 'Estimated Biomass' : 'Feed Intake'}
                  stroke="#2563eb" 
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaGradientSimple)"
                />
              </AreaChart>
            ) : (
              <LineChart data={growthData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="doc" 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis 
                  domain={growthMetric === 'FCR' ? [0.8, 2.0] : [0, 'auto']}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  unit={growthMetric === 'ABW' ? 'g' : ''}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    backgroundColor: '#ffffff'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey={growthMetric.toLowerCase()}
                  name={growthMetric === 'ABW' ? 'Body Weight (ABW)' : 'FCR Ratio'}
                  stroke="#2563eb" 
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#2563eb' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Section: Water Quality Parameters (Clean Table) */}
      <div style={styles.card}>
        <div style={styles.sectionHeaderRow}>
          <div>
            <h3 style={styles.sectionCardTitle}>
              {activeTank.name} Water Quality Telemetry
            </h3>
            <p style={styles.sectionCardSubtitle}>
              On-site field measurements submitted by agent <strong>{farmer.agent}</strong>
            </p>
          </div>

          <div style={styles.simpleAuditBadge}>
            <ShieldCheck size={14} color="#64748b" />
            <span>Agent Verified On-Site</span>
          </div>
        </div>

        {/* Clean Standard Threshold Note */}
        <div style={styles.thresholdNoteRow}>
          <span style={styles.thresholdNoteText}>
            <strong>Standard Thresholds:</strong> Salinity 0–30 ppt • pH 7.5–8.5 • Alkalinity 100–300 ppm • Ammonia &lt;0.5 mg/L • Nitrite &lt;0.25 mg/L • DO &gt;4.0 mg/L
          </span>
        </div>

        {/* Water Quality Table */}
        <div style={{ overflowX: 'auto', marginTop: '10px' }}>
          <table style={styles.qualityTable}>
            <thead>
              <tr style={styles.qualityTheadRow}>
                <th style={styles.qualityTh}>DOC / DATE</th>
                <th style={styles.qualityTh}>AGENT</th>
                <th style={styles.qualityTh}>SALINITY</th>
                <th style={styles.qualityTh}>pH</th>
                <th style={styles.qualityTh}>ALKALINITY</th>
                <th style={styles.qualityTh}>HARDNESS</th>
                <th style={styles.qualityTh}>AMMONIA</th>
                <th style={styles.qualityTh}>NITRITE</th>
                <th style={styles.qualityTh}>POTASSIUM</th>
                <th style={styles.qualityTh}>DO</th>
                <th style={styles.qualityTh}>H2S</th>
                <th style={styles.qualityTh}>Cl</th>
                <th style={styles.qualityTh}>Fe</th>
                <th style={styles.qualityTh}>COLOR</th>
              </tr>
            </thead>
            <tbody>
              {waterQualityLogs.map((log) => {
                const isCriticalDO = log.do < 4.0;
                const isCriticalAmmonia = log.ammonia > 0.5;
                const isCriticalNitrite = log.nitrite > 0.25;

                return (
                  <tr key={log.id} style={styles.qualityTr}>
                    <td style={styles.qualityTd}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>DOC {log.doc}</span>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>{log.date}</span>
                    </td>
                    <td style={styles.qualityTd}>
                      <span style={{ fontWeight: 500, color: '#334155' }}>{log.agent}</span>
                    </td>
                    <td style={styles.qualityTd}>
                      <span>{log.salinity} ppt</span>
                    </td>
                    <td style={styles.qualityTd}>
                      <span>{log.ph}</span>
                    </td>
                    <td style={styles.qualityTd}>
                      <span>{log.alkalinity} ppm</span>
                    </td>
                    <td style={styles.qualityTd}>
                      <span>{log.hardness} ppm</span>
                    </td>
                    <td style={styles.qualityTd}>
                      <span style={{ color: isCriticalAmmonia ? '#dc2626' : '#334155', fontWeight: isCriticalAmmonia ? 700 : 500 }}>
                        {log.ammonia}
                      </span>
                    </td>
                    <td style={styles.qualityTd}>
                      <span style={{ color: isCriticalNitrite ? '#dc2626' : '#334155', fontWeight: isCriticalNitrite ? 700 : 500 }}>
                        {log.nitrite}
                      </span>
                    </td>
                    <td style={styles.qualityTd}>
                      <span>{log.potassium} ppm</span>
                    </td>
                    <td style={styles.qualityTd}>
                      {isCriticalDO ? (
                        <span style={styles.criticalDOBadge}>
                          {log.do} mg/L
                        </span>
                      ) : (
                        <span>{log.do} mg/L</span>
                      )}
                    </td>
                    <td style={styles.qualityTd}>
                      <span style={{ color: '#64748b' }}>{log.h2s}</span>
                    </td>
                    <td style={styles.qualityTd}>
                      <span style={{ color: '#64748b' }}>{log.cl}</span>
                    </td>
                    <td style={styles.qualityTd}>
                      <span style={{ color: '#64748b' }}>{log.fe}</span>
                    </td>
                    <td style={styles.qualityTd}>
                      <span style={styles.colorPill}>{log.waterColor}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Edit Tank Details */}
      {showEditTankModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, width: '600px' }}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  Edit {activeTank.name} Specifications
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Farmer: {farmer.name} ({farmer.id})
                </div>
              </div>
              <button onClick={() => setShowEditTankModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTankDetails}>
              <div style={styles.modalBody}>
                {/* 1. Tank Name, Size & Water Source */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={styles.modalLabel}>Tank Name *</label>
                    <input 
                      type="text" 
                      value={editTankForm.name}
                      onChange={(e) => setEditTankForm({ ...editTankForm, name: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Size (Acres) *</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0.1"
                      value={editTankForm.acres}
                      onChange={(e) => setEditTankForm({ ...editTankForm, acres: e.target.value })}
                      style={styles.modalInput}
                      required
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Source of Water</label>
                    <select 
                      style={styles.modalSelect}
                      value={editTankForm.waterSource}
                      onChange={(e) => setEditTankForm({ ...editTankForm, waterSource: e.target.value })}
                    >
                      <option value="Creek / Estuary">Creek / Estuary</option>
                      <option value="Sea / Coastal Canal">Sea / Coastal Canal</option>
                      <option value="Borewell / Ground Water">Borewell / Ground Water</option>
                      <option value="River / Freshwater Canal">River / Freshwater Canal</option>
                      <option value="Reservoir / Agricultural Canal">Reservoir / Agricultural Canal</option>
                      <option value="Other">Other Source</option>
                    </select>
                  </div>
                </div>

                {/* 2. Salinity & Soil Type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={styles.modalLabel}>Salinity (ppt)</label>
                    <input 
                      type="number" 
                      step="0.5"
                      value={editTankForm.salinity}
                      onChange={(e) => setEditTankForm({ ...editTankForm, salinity: e.target.value })}
                      style={styles.modalInput}
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Soil Type</label>
                    <select 
                      style={styles.modalSelect}
                      value={editTankForm.soilType}
                      onChange={(e) => setEditTankForm({ ...editTankForm, soilType: e.target.value })}
                    >
                      <option value="Loam">Loam</option>
                      <option value="Clay">Clay</option>
                      <option value="Sandy">Sandy</option>
                      <option value="Clay Loam">Clay Loam</option>
                      <option value="Sandy Loam">Sandy Loam</option>
                    </select>
                  </div>
                </div>

                {/* 3. Hatchery Name & Brooder */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={styles.modalLabel}>Hatchery Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Apex Marine Hatcheries"
                      value={editTankForm.hatcheryName}
                      onChange={(e) => setEditTankForm({ ...editTankForm, hatcheryName: e.target.value })}
                      style={styles.modalInput}
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Brooder Lineage</label>
                    <select 
                      style={styles.modalSelect}
                      value={editTankForm.brooder}
                      onChange={(e) => setEditTankForm({ ...editTankForm, brooder: e.target.value })}
                    >
                      <option value="Kona Bay">Kona Bay</option>
                      <option value="Syaqua">Syaqua</option>
                      <option value="SIS">SIS</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* 4. Seed Date & Stocking Count (Lak) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={styles.modalLabel}>Seed Date</label>
                    <input 
                      type="date" 
                      value={editTankForm.seedDate}
                      onChange={(e) => setEditTankForm({ ...editTankForm, seedDate: e.target.value })}
                      style={styles.modalInput}
                    />
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Stocking Count (Lakhs)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={editTankForm.seedStockingLak}
                      onChange={(e) => setEditTankForm({ ...editTankForm, seedStockingLak: e.target.value })}
                      style={styles.modalInput}
                    />
                  </div>
                </div>

                {/* 5. Feed Type & Target FCR */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={styles.modalLabel}>Feed Type</label>
                    <select 
                      style={styles.modalSelect}
                      value={editTankForm.feedType}
                      onChange={(e) => setEditTankForm({ ...editTankForm, feedType: e.target.value })}
                    >
                      <option value="Premium Pellets">Premium Pellets</option>
                      <option value="Functional Feed">Functional Feed</option>
                      <option value="Hypro Feed">Hypro Feed</option>
                      <option value="Tiger Feed">Tiger Feed</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.modalLabel}>Target FCR</label>
                    <input 
                      type="number" 
                      step="0.05"
                      value={editTankForm.fcr}
                      onChange={(e) => setEditTankForm({ ...editTankForm, fcr: e.target.value })}
                      style={styles.modalInput}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button 
                  type="button" 
                  onClick={() => setShowEditTankModal(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={styles.submitBtn}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div style={styles.toast}>
          <Check size={15} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '1360px',
    margin: '0 auto'
  },
  topNavRow: {
    display: 'flex',
    alignItems: 'center'
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '24px 32px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  },
  profileHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '16px'
  },
  farmerTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0
  },
  idBadge: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
    fontSize: '11.5px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '5px',
    border: '1px solid #e2e8f0'
  },
  activePill: {
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '9999px',
    border: '1px solid #bbf7d0'
  },
  profileSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: '4px 0 0 0'
  },
  exportExcelBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#15803d',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 14px',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(21, 128, 61, 0.25)',
    transition: 'background-color 0.15s'
  },
  exportCsvBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#ffffff',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '7px 12px',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  profileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '16px 20px',
    border: '1px solid #e2e8f0'
  },
  profileBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  blockLabel: {
    fontSize: '10.5px',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.4px'
  },
  blockValue: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: '#0f172a'
  },
  tankTabsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '16px 24px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  },
  selectTankLabel: {
    fontSize: '12.5px',
    fontWeight: 700,
    color: '#475569',
    marginRight: '4px'
  },
  tankNavTab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12.5px',
    fontWeight: 600,
    color: '#475569',
    cursor: 'pointer'
  },
  tankNavTabActive: {
    backgroundColor: '#eff6ff',
    border: '1px solid #93c5fd',
    color: '#2563eb',
    fontWeight: 700
  },
  editTankQuickBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#2563eb',
    cursor: 'pointer'
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f1f5f9'
  },
  sectionCardTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0
  },
  sectionCardSubtitle: {
    fontSize: '12px',
    color: '#64748b',
    margin: '2px 0 0 0'
  },
  editTankSpecsPrimaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#ffffff',
    color: '#2563eb',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  simpleAuditBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '11.5px',
    fontWeight: 600
  },
  specsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  specItemCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  specLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.4px',
    textTransform: 'uppercase'
  },
  specPrimaryValue: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a',
    lineHeight: '1.3'
  },
  specFootnote: {
    fontSize: '10.5px',
    color: '#94a3b8'
  },
  metricToggleGroup: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    borderRadius: '6px',
    padding: '2px',
    gap: '2px'
  },
  metricTab: {
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#64748b',
    cursor: 'pointer'
  },
  metricTabActive: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    fontWeight: 700
  },
  thresholdNoteRow: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '6px 12px',
    marginBottom: '8px'
  },
  thresholdNoteText: {
    fontSize: '11.5px',
    color: '#475569',
    lineHeight: '1.4'
  },
  qualityTable: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '12px'
  },
  qualityTheadRow: {
    borderBottom: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc'
  },
  qualityTh: {
    padding: '12px 16px',
    fontSize: '10.5px',
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    whiteSpace: 'nowrap'
  },
  qualityTr: {
    borderBottom: '1px solid #f1f5f9'
  },
  qualityTd: {
    padding: '14px 16px',
    verticalAlign: 'middle',
    color: '#334155',
    fontSize: '12.5px',
    fontWeight: 500
  },
  criticalDOBadge: {
    color: '#dc2626',
    fontWeight: 700,
    backgroundColor: '#fee2e2',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  colorPill: {
    fontSize: '11px',
    color: '#475569',
    backgroundColor: '#f1f5f9',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #e2e8f0'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    maxWidth: '92vw',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '20px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    paddingBottom: '10px',
    borderBottom: '1px solid #f1f5f9'
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px'
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column'
  },
  modalLabel: {
    display: 'block',
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '4px'
  },
  modalInput: {
    width: '100%',
    padding: '7px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    fontSize: '12.5px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  modalSelect: {
    width: '100%',
    padding: '7px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    fontSize: '12.5px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '14px'
  },
  cancelBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#475569',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '6px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#15803d',
    color: '#ffffff',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 9999
  }
};

export default FarmerDetail;
