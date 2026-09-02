import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRegions, getFarmers, getAgents, getIncharges } from '../utils/adminMockData';
import {
  MapPin, Plus, FileSpreadsheet, Search, Check, X,
  Layers, Compass, Building, User, Phone, Droplets,
  Eye, Edit, ArrowRight, ShieldCheck, Tractor, Filter, SortAsc, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';

const Regions = () => {
  const navigate = useNavigate();
  const regions = getRegions();
  const allIncharges = getIncharges();

  // Normalizer for legacy records in localStorage
  const normalizeFarmerData = (list) => {
    return list.map(f => {
      let reg = f.region;
      let loc = f.locality;

      // Fix legacy region strings
      if (f.region?.includes('Central') || f.region?.includes('South') || f.region?.includes('Coastal')) {
        reg = 'Coastal Andhra';
      } else if (f.region?.includes('North') || f.region?.includes('Uttar')) {
        reg = 'North Andhra (Uttarandhra)';
      } else if (f.region?.includes('Rayalaseema')) {
        reg = 'Rayalaseema';
      }

      // Fix legacy locality strings
      if (f.locality?.includes('Bhimavaram') || f.village?.includes('Undi') || f.village?.includes('Akividu')) {
        loc = 'Bhimavaram';
      } else if (f.locality?.includes('Nellore') || f.village?.includes('Mypadu') || f.village?.includes('Indukurpet')) {
        loc = 'Nellore';
      } else if (f.locality?.includes('Kavali') || f.village?.includes('Allur')) {
        loc = 'Kavali';
      } else if (f.locality?.includes('Kakinada') || f.village?.includes('Coringa')) {
        loc = 'Kakinada';
      } else if (f.locality?.includes('Visakhapatnam') || f.village?.includes('Bheemili')) {
        loc = 'Visakhapatnam';
      } else if (f.locality?.includes('Tirupati') || f.village?.includes('Renigunta')) {
        loc = 'Tirupati';
      }

      return {
        ...f,
        region: reg || 'Coastal Andhra',
        locality: loc || 'Nellore'
      };
    });
  };

  // 1. Load Agents from localStorage or mock data
  const [agents, setAgents] = useState(() => {
    const saved = localStorage.getItem('royal_admin_agents_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return normalizeFarmerData(parsed);
      } catch (e) { }
    }
    return getAgents();
  });

  // 2. Load Farmers from localStorage or mock data
  const [farmers, setFarmers] = useState(() => {
    const saved = localStorage.getItem('royal_admin_farmers_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return normalizeFarmerData(parsed);
      } catch (e) { }
    }
    return getFarmers();
  });

  // Geographic Filter States
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedLocality, setSelectedLocality] = useState('ALL');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Profile Modals
  const [selectedFarmerDetails, setSelectedFarmerDetails] = useState(null);
  const [selectedInchargeDetails, setSelectedInchargeDetails] = useState(null);
  const [selectedAgentDetails, setSelectedAgentDetails] = useState(null);

  // Add Locality Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLocalityName, setNewLocalityName] = useState('');
  const [targetRegionId, setTargetRegionId] = useState(regions[1]?.id || regions[0]?.id);
  const [successToast, setSuccessToast] = useState('');

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  // Helper to find Incharge object
  const getInchargeDetails = (inchargeName, localityName, regionName) => {
    if (!inchargeName) return allIncharges[0];
    let found = allIncharges.find(inc =>
      inc.name === inchargeName ||
      inc.shortName === inchargeName ||
      inchargeName.toLowerCase().includes(inc.shortName?.toLowerCase() || '___')
    );
    if (!found && localityName) {
      found = allIncharges.find(inc => inc.locality?.toLowerCase() === localityName.toLowerCase());
    }
    return found || allIncharges[0];
  };

  // Helper to find Field Agent object
  const getAgentDetails = (agentName, agentId, localityName) => {
    if (agentId) {
      const byId = agents.find(ag => ag.id === agentId);
      if (byId) return byId;
    }
    if (agentName) {
      const byName = agents.find(ag =>
        ag.name === agentName ||
        ag.shortName === agentName ||
        agentName.toLowerCase().includes(ag.shortName?.toLowerCase() || '___')
      );
      if (byName) return byName;
    }
    if (localityName) {
      const byLoc = agents.find(ag => ag.locality?.toLowerCase() === localityName.toLowerCase());
      if (byLoc) return byLoc;
    }
    return agents[0];
  };

  // Helper to match Farmer Region
  const matchesFarmerRegion = (farmer, targetRegion) => {
    if (targetRegion === 'ALL') return true;
    const fReg = (farmer.region || '').toLowerCase();
    const tReg = targetRegion.toLowerCase();

    if (tReg.includes('north') || tReg.includes('uttar')) {
      if (fReg.includes('north') || fReg.includes('uttar')) return true;
    }
    if (tReg.includes('coastal') || tReg.includes('central') || tReg.includes('south')) {
      if (fReg.includes('coastal') || fReg.includes('central') || fReg.includes('south')) return true;
    }
    if (tReg.includes('rayalaseema')) {
      if (fReg.includes('rayalaseema') || fReg.includes('rayala')) return true;
    }

    // Check locality membership in official regions tree
    const targetRegObj = regions.find(r => r.name.toLowerCase() === tReg || r.id.toLowerCase() === tReg);
    if (targetRegObj?.localities) {
      const fLoc = (farmer.locality || '').toLowerCase();
      const inRegion = targetRegObj.localities.some(loc => {
        const lName = loc.name.toLowerCase();
        return fLoc.includes(lName) || lName.includes(fLoc);
      });
      if (inRegion) return true;
    }

    return fReg.includes(tReg) || tReg.includes(fReg);
  };

  // Helper to match Farmer Locality
  const matchesFarmerLocality = (farmer, targetLocality) => {
    if (targetLocality === 'ALL') return true;
    const fLoc = (farmer.locality || '').toLowerCase().trim();
    const tLoc = targetLocality.toLowerCase().trim();

    if (fLoc === tLoc) return true;
    if (fLoc.includes(tLoc) || tLoc.includes(fLoc)) return true;

    // Check area or village or agent info
    const fArea = (farmer.assignedArea || '').toLowerCase();
    const fVillage = (farmer.village || '').toLowerCase();
    const fAgent = (farmer.agent || '').toLowerCase();
    if (fArea.includes(tLoc) || fVillage.includes(tLoc) || fAgent.includes(tLoc)) return true;

    return false;
  };

  // Helper to match Farmer Area
  const matchesFarmerArea = (farmer, targetArea) => {
    if (targetArea === 'ALL') return true;
    const tArea = targetArea.toLowerCase().trim();
    const fArea = (farmer.assignedArea || '').toLowerCase().trim();
    const fVillage = (farmer.village || '').toLowerCase().trim();

    if (fArea === tArea || fVillage === tArea) return true;
    if (fArea.includes(tArea) || tArea.includes(fArea)) return true;
    if (fVillage.includes(tArea) || tArea.includes(fVillage)) return true;

    return false;
  };

  // Get dynamic list of localities for selected region
  const availableLocalities = React.useMemo(() => {
    if (selectedRegion === 'ALL') {
      const allLocs = [];
      regions.forEach(r => {
        r.localities?.forEach(loc => {
          if (!allLocs.find(l => l.name === loc.name)) {
            allLocs.push(loc);
          }
        });
      });
      return allLocs;
    }
    const foundReg = regions.find(r => r.name === selectedRegion || r.id === selectedRegion);
    return foundReg?.localities || [];
  }, [selectedRegion, regions]);

  // Reset locality and area if region changes
  const handleRegionChange = (newReg) => {
    setSelectedRegion(newReg);
    setSelectedLocality('ALL');
    setSelectedArea('ALL');
  };

  // Reset area if locality changes
  const handleLocalityChange = (newLoc) => {
    setSelectedLocality(newLoc);
    setSelectedArea('ALL');
  };

  // Get dynamic list of operational areas / zones for the selected locality/region
  const availableAreas = React.useMemo(() => {
    const areaSet = new Set();

    // From agents
    agents.forEach(ag => {
      const matchReg = matchesFarmerRegion(ag, selectedRegion);
      const matchLoc = matchesFarmerLocality(ag, selectedLocality);
      if (matchReg && matchLoc && ag.assignedArea) {
        areaSet.add(ag.assignedArea);
      }
    });

    // From farmers
    farmers.forEach(f => {
      const matchReg = matchesFarmerRegion(f, selectedRegion);
      const matchLoc = matchesFarmerLocality(f, selectedLocality);
      if (matchReg && matchLoc) {
        if (f.assignedArea) areaSet.add(f.assignedArea);
        if (f.village) areaSet.add(f.village);
      }
    });

    return Array.from(areaSet);
  }, [selectedRegion, selectedLocality, agents, farmers]);

  // Filter and sort farmers alphabetically
  const filteredAndSortedFarmers = React.useMemo(() => {
    const filtered = farmers.filter(f => {
      // 1. Region Filter
      if (!matchesFarmerRegion(f, selectedRegion)) return false;

      // 2. Locality Filter
      if (!matchesFarmerLocality(f, selectedLocality)) return false;

      // 3. Area Filter
      if (!matchesFarmerArea(f, selectedArea)) return false;

      // 4. Search Term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          f.name?.toLowerCase().includes(term) ||
          f.id?.toLowerCase().includes(term) ||
          f.phone?.includes(term) ||
          f.village?.toLowerCase().includes(term) ||
          f.locality?.toLowerCase().includes(term) ||
          f.agent?.toLowerCase().includes(term) ||
          f.incharge?.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      return true;
    });

    // Sort strictly in Alphabetical Order (A to Z) by Farmer Name
    return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [farmers, selectedRegion, selectedLocality, selectedArea, searchTerm]);

  // Metric for Bar Graph below the farmers table
  const [barMetric, setBarMetric] = useState('ACRES'); // 'ACRES' | 'TANKS' | 'FCR'

  // Prepare Bar Graph data for the current active list of farmers (sorted A to Z)
  const barChartData = React.useMemo(() => {
    return filteredAndSortedFarmers.map(f => {
      const acresVal = f.totalAcres || parseFloat(f.acres) || 0;
      const tanksCount = f.tanks || f.tankBreakdown?.length || 1;
      const fcrVal = f.tankBreakdown?.[0]?.fcr || 1.35;

      return {
        id: f.id,
        name: f.name,
        shortName: f.name.length > 18 ? f.name.substring(0, 16) + '…' : f.name,
        acres: Number(acresVal.toFixed(1)),
        tanks: tanksCount,
        fcr: Number(fcrVal.toFixed(2)),
        locality: f.locality,
        village: f.assignedArea || f.village
      };
    });
  }, [filteredAndSortedFarmers]);

  // Handle Excel Export for Current Filtered List
  const handleExportFilteredExcel = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += `ROYAL'S MARINE FOOD - FARMERS DIRECTORY REPORT\n`;
    csv += `Region Filter: ${selectedRegion} | Locality Filter: ${selectedLocality} | Area Filter: ${selectedArea}\n`;
    csv += `Total Records: ${filteredAndSortedFarmers.length} | Generated On: ${new Date().toLocaleDateString()}\n\n`;
    csv += "FARMER ID,FARMER NAME,PHONE,REGION,LOCALITY,VILLAGE/AREA,ACRES,AGENT,INCHARGE,TANKS,STATUS\n";

    filteredAndSortedFarmers.forEach(f => {
      csv += `${f.id},"${f.name}",${f.phone},"${f.region}","${f.locality}","${f.assignedArea || f.village}","${f.acres}","${f.agent}","${f.incharge}",${f.tanks},"${f.status || 'Active'}"\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Farmers_${selectedRegion.replace(/\s+/g, '_')}_${selectedLocality.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredAndSortedFarmers.length} farmers report!`);
  };

  // Add new locality handler
  const handleAddLocality = (e) => {
    e.preventDefault();
    if (!newLocalityName.trim()) return;

    showToast(`Locality "${newLocalityName.trim()}" added successfully to system registry!`);
    setNewLocalityName('');
    setShowAddModal(false);
  };

  return (
    <div style={styles.container}>
      {/* 1. Top Header Banner */}
      <div style={styles.topHeader}>
        <div>
          <h1 style={styles.mainTitle}>REGIONS &amp; LOCALITIES COMMAND CENTER</h1>
          <p style={styles.mainSubtitle}>
            Filter farmers by Region, Locality, and Operational Area • Alphabetical Directory &amp; Complete Farmer Profiles
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            style={styles.exportBtn}
            onClick={handleExportFilteredExcel}
          >
            <FileSpreadsheet size={15} />
            <span>Export Directory ({filteredAndSortedFarmers.length})</span>
          </button>
          <button
            style={styles.addLocalityBtn}
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            <span>Add New Locality</span>
          </button>
        </div>
      </div>

      {/* 2. Cascading Geographic Selector Card (Region -> Locality -> Area) */}
      <div style={styles.filterCard}>
        <div style={styles.filterGrid}>
          {/* Step 1: Select Region */}
          <div style={styles.filterField}>
            <label style={styles.filterLabel}>1. SELECT REGION</label>
            <select
              style={styles.filterSelect}
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
            >
              <option value="ALL">All Regions (Andhra Pradesh)</option>
              {regions.map(reg => (
                <option key={reg.id} value={reg.name}>{reg.name}</option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Locality */}
          <div style={styles.filterField}>
            <label style={styles.filterLabel}>2. SELECT LOCALITY / CITY</label>
            <select
              style={styles.filterSelect}
              value={selectedLocality}
              onChange={(e) => handleLocalityChange(e.target.value)}
            >
              <option value="ALL">All Localities ({availableLocalities.length} Towns)</option>
              {availableLocalities.map(loc => (
                <option key={loc.id || loc.name} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Step 3: Select Area / Zone */}
          <div style={styles.filterField}>
            <label style={styles.filterLabel}>3. SELECT OPERATIONAL AREA / ZONE</label>
            <select
              style={styles.filterSelect}
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
            >
              <option value="ALL">All Areas / Villages in Locality</option>
              {availableAreas.map((area, idx) => (
                <option key={idx} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {/* Step 4: Search input */}
          <div style={styles.filterField}>
            <label style={styles.filterLabel}>SEARCH FARMERS</label>
            <div style={styles.searchBox}>
              <Search size={15} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search name, phone, tank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>×</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Alphabetical Farmers Directory Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeaderRow}>
          <div>
            <h2 style={styles.tableTitle}>
              Farmers List
            </h2>
          </div>
        </div>

        <div style={{ overflowX: 'auto', marginTop: '12px' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>FARMER NAME &amp; ID</th>
                <th style={styles.th}>CONTACT</th>
                <th style={styles.th}>REGION &amp; LOCALITY</th>
                <th style={styles.th}>ASSIGNED AREA / VILLAGE</th>
                <th style={styles.th}>LOCALITY INCHARGE &amp; AGENT</th>
                <th style={styles.th}>TOTAL LAND &amp; TANKS</th>
                <th style={styles.th}>STATUS</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedFarmers.length > 0 ? (
                filteredAndSortedFarmers.map(farmer => (
                  <tr key={farmer.id} style={styles.tr}>
                    {/* Farmer Name & ID (Clickable to View All Details) */}
                    <td style={styles.td}>
                      <div
                        style={styles.farmerNameBlock}
                        onClick={() => setSelectedFarmerDetails(farmer)}
                        title="Click to view all farmer details and tank telemetry"
                      >
                        <span style={styles.farmerNameLink}>{farmer.name}</span>
                        <span style={styles.farmerIdBadge}>{farmer.id}</span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td style={styles.td}>
                      <div style={styles.contactBlock}>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{farmer.phone}</span>
                      </div>
                    </td>

                    {/* Region & Locality */}
                    <td style={styles.td}>
                      <div style={styles.regionBlock}>
                        <span style={styles.localityBadge}>{farmer.locality}</span>
                        <span style={styles.regionSubText}>{farmer.region}</span>
                      </div>
                    </td>

                    {/* Assigned Area / Village */}
                    <td style={styles.td}>
                      <div style={styles.areaChip}>
                        <Compass size={12} color="#0284c7" />
                        <span>{farmer.assignedArea || farmer.village}</span>
                      </div>
                    </td>

                    {/* Incharge & Field Agent (Clickable to view details) */}
                    <td style={styles.td}>
                      <div style={styles.agentBlock}>
                        <div
                          style={styles.inchargeTextRowClickable}
                          onClick={() => {
                            const incObj = getInchargeDetails(farmer.incharge, farmer.locality, farmer.region);
                            setSelectedInchargeDetails(incObj);
                          }}
                          title={`Click to view full details for Incharge: ${farmer.incharge}`}
                        >
                          <Building size={12} color="#2563eb" />
                          <span style={styles.inchargeLinkText}>{farmer.incharge}</span>
                        </div>
                        <div
                          style={styles.agentTextRowClickable}
                          onClick={() => {
                            const agObj = getAgentDetails(farmer.agent, farmer.agentId, farmer.locality);
                            setSelectedAgentDetails(agObj);
                          }}
                          title={`Click to view full details for Field Agent: ${farmer.agent}`}
                        >
                          <User size={12} color="#0284c7" />
                          <span style={styles.agentLinkText}>{farmer.agent}</span>
                        </div>
                      </div>
                    </td>



                    {/* Total Land & Tanks */}
                    <td style={styles.td}>
                      <div style={styles.landBlock}>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>{farmer.acres}</span>
                        <span style={styles.tanksSubText}>
                          {farmer.tanks || farmer.tankBreakdown?.length || 1} Tanks
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: farmer.status === 'Inactive' ? '#fee2e2' : '#dcfce7',
                        color: farmer.status === 'Inactive' ? '#dc2626' : '#16a34a'
                      }}>
                        {farmer.status || 'Active'}
                      </span>
                    </td>

                    {/* Actions: View Details / Drilldown */}
                    <td style={styles.td}>
                      <div style={styles.actionBtnGroup}>
                        <button
                          style={styles.viewDetailsBtn}
                          onClick={() => setSelectedFarmerDetails(farmer)}
                          title="Quick View Farmer Profile"
                        >
                          <Eye size={13} />
                          <span>Quick View</span>
                        </button>
                        <button
                          style={styles.drilldownBtn}
                          onClick={() => navigate(`/admin/farmers/${farmer.id}`)}
                          title="Open Full Growth Trajectory & Water Quality Telemetry"
                        >
                          <span>Full Analytics</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                    No farmers found matching the selected Region, Locality, or Area.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Farmers Cultivation & Acreage Bar Graph Card */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeaderRow}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} color="#2563eb" />
              <h2 style={styles.chartTitle}>
                Farmers Cultivation &amp; Acreage Distribution (Bar Graph)
              </h2>
            </div>
            <p style={styles.chartSubtitle}>
              Comparison of Land Holding (Acres), Active Tanks, and Efficiency for farmers in selected area (A to Z)
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div style={styles.metricToggleGroup}>
            <button
              style={{
                ...styles.metricToggleBtn,
                backgroundColor: barMetric === 'ACRES' ? '#2563eb' : '#f8fafc',
                color: barMetric === 'ACRES' ? '#ffffff' : '#475569',
                borderColor: barMetric === 'ACRES' ? '#2563eb' : '#cbd5e1'
              }}
              onClick={() => setBarMetric('ACRES')}
            >
              Total Land (Acres)
            </button>
            <button
              style={{
                ...styles.metricToggleBtn,
                backgroundColor: barMetric === 'TANKS' ? '#16a34a' : '#f8fafc',
                color: barMetric === 'TANKS' ? '#ffffff' : '#475569',
                borderColor: barMetric === 'TANKS' ? '#16a34a' : '#cbd5e1'
              }}
              onClick={() => setBarMetric('TANKS')}
            >
              Active Tanks Count
            </button>
            <button
              style={{
                ...styles.metricToggleBtn,
                backgroundColor: barMetric === 'FCR' ? '#0284c7' : '#f8fafc',
                color: barMetric === 'FCR' ? '#ffffff' : '#475569',
                borderColor: barMetric === 'FCR' ? '#0284c7' : '#cbd5e1'
              }}
              onClick={() => setBarMetric('FCR')}
            >
              Feed Conversion (FCR)
            </button>
          </div>
        </div>

        {barChartData.length > 0 ? (
          <div style={{ height: '300px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 15, right: 30, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  domain={barMetric === 'FCR' ? [1.0, 1.8] : [0, 'auto']}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#334155', fontWeight: 500 }}
                />
                <RechartsTooltip
                  formatter={(value) => [
                    barMetric === 'ACRES' ? `${value} Acres` : barMetric === 'TANKS' ? `${value} Tanks` : `${value} FCR`,
                    barMetric === 'ACRES' ? 'Cultivated Land' : barMetric === 'TANKS' ? 'Active Tanks' : 'Feed Conversion Ratio'
                  ]}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? `${item.name} (${item.locality} • ${item.village})` : label;
                  }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Bar
                  dataKey={barMetric === 'ACRES' ? 'acres' : barMetric === 'TANKS' ? 'tanks' : 'fcr'}
                  fill={barMetric === 'ACRES' ? '#2563eb' : barMetric === 'TANKS' ? '#16a34a' : '#0284c7'}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  {barChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        barMetric === 'ACRES'
                          ? (index % 2 === 0 ? '#2563eb' : '#3b82f6')
                          : barMetric === 'TANKS'
                            ? (index % 2 === 0 ? '#16a34a' : '#22c55e')
                            : '#0284c7'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '13.5px' }}>
            No farmer data available for the bar graph in current selection.
          </div>
        )}
      </div>

      {/* Modal 1: Comprehensive Farmer Details Modal */}
      {selectedFarmerDetails && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, width: '680px' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.iconCircleGreen}>
                  <Tractor size={20} color="#16a34a" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    {selectedFarmerDetails.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Farmer ID: <strong>{selectedFarmerDetails.id}</strong> • Status: <span style={{ color: '#16a34a', fontWeight: 700 }}>{selectedFarmerDetails.status || 'Active'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedFarmerDetails(null)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* 4 Block Info Grid */}
              <div style={styles.modalInfoGrid}>
                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>PHONE NUMBER</span>
                  <span style={styles.modalInfoValue}>{selectedFarmerDetails.phone}</span>
                </div>

                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>REGION &amp; LOCALITY</span>
                  <span style={styles.modalInfoValue}>
                    {selectedFarmerDetails.locality}, {selectedFarmerDetails.region}
                  </span>
                </div>

                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>OPERATIONAL AREA / VILLAGE</span>
                  <span style={{ ...styles.modalInfoValue, color: '#0284c7' }}>
                    {selectedFarmerDetails.assignedArea || selectedFarmerDetails.village}
                  </span>
                </div>



                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>DEDICATED INCHARGE</span>
                  <span style={{ ...styles.modalInfoValue, color: '#2563eb' }}>
                    {selectedFarmerDetails.incharge}
                  </span>
                </div>

                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>ASSIGNED FIELD AGENT</span>
                  <span style={styles.modalInfoValue}>{selectedFarmerDetails.agent}</span>
                </div>

                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>TOTAL CULTIVATED LAND</span>
                  <span style={{ ...styles.modalInfoValue, fontWeight: 800 }}>
                    {selectedFarmerDetails.acres}
                  </span>
                </div>

                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>NUMBER OF TANKS</span>
                  <span style={{ ...styles.modalInfoValue, fontWeight: 800, color: '#16a34a' }}>
                    {selectedFarmerDetails.tanks || selectedFarmerDetails.tankBreakdown?.length || 1} Tanks
                  </span>
                </div>
              </div>

              {/* Multi-tank Breakdown Section */}
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
                  Tank Specifications &amp; Acreage Breakdown:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  {selectedFarmerDetails.tankBreakdown && selectedFarmerDetails.tankBreakdown.length > 0 ? (
                    selectedFarmerDetails.tankBreakdown.map((tank, idx) => (
                      <div key={tank.id || idx} style={styles.tankSpecCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>{tank.name}</span>
                          <span style={styles.tankAcresBadge}>{tank.acres} Ac</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>
                          <div>DOC: <strong>{tank.doc || 50} Days</strong></div>
                          <div>ABW: <strong>{tank.abw || 16}g</strong> • FCR: <strong>{tank.fcr || 1.32}</strong></div>
                          <div>Hatchery: <strong>{tank.hatcheryName || 'Apex Marine'}</strong></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={styles.tankSpecCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>Tank 1</span>
                        <span style={styles.tankAcresBadge}>{selectedFarmerDetails.acres}</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>
                        <div>Status: <strong>Active Cultivation</strong></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setSelectedFarmerDetails(null)}
                style={styles.cancelBtn}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = selectedFarmerDetails.id;
                  setSelectedFarmerDetails(null);
                  navigate(`/admin/farmers/${id}`);
                }}
                style={styles.submitBtn}
              >
                <span>View Full Growth &amp; Telemetry Curves</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Comprehensive Incharge Details Modal */}
      {selectedInchargeDetails && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, width: '620px' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.iconCircleBlue}>
                  <Building size={20} color="#2563eb" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17.5px', fontWeight: 800, color: '#0f172a' }}>
                    {selectedInchargeDetails.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Incharge ID: <strong>{selectedInchargeDetails.id}</strong> • Role: <span style={{ color: '#2563eb', fontWeight: 700 }}>{selectedInchargeDetails.role || 'Locality Head'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedInchargeDetails(null)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* 6 Block Info Grid */}
              <div style={styles.modalInfoGrid}>
                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>PHONE NUMBER</span>
                  <span style={styles.modalInfoValue}>{selectedInchargeDetails.phone || '+91 9876543211'}</span>
                </div>

                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>CORPORATE EMAIL</span>
                  <span style={styles.modalInfoValue}>{selectedInchargeDetails.email || `${selectedInchargeDetails.shortName?.toLowerCase().replace(/\s+/g, '') || 'incharge'}.inc@royalsmarine.com`}</span>
                </div>

                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>ASSIGNED REGION</span>
                  <span style={styles.modalInfoValue}>{selectedInchargeDetails.region || 'Coastal Andhra'}</span>
                </div>

                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>HEADQUARTERS LOCALITY</span>
                  <span style={{ ...styles.modalInfoValue, color: '#2563eb', fontWeight: 800 }}>
                    {selectedInchargeDetails.locality || 'Nellore'}
                  </span>
                </div>

                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>FIELD AGENTS UNDER INCHARGE</span>
                  <span style={{ ...styles.modalInfoValue, fontWeight: 800, color: '#0f172a' }}>
                    {selectedInchargeDetails.agents || 2} Agents Assigned
                  </span>
                </div>

                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>JURISDICTION OVERVIEW</span>
                  <span style={{ ...styles.modalInfoValue, fontWeight: 800, color: '#16a34a' }}>
                    {selectedInchargeDetails.farmers || 3} Farmers • {selectedInchargeDetails.tanks || 6} Tanks
                  </span>
                </div>
              </div>

              {/* Status & Compliance Highlight */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <div style={styles.kpiMiniBadge}>
                  <ShieldCheck size={16} color="#16a34a" />
                  <span>Sampling Compliance: <strong>{selectedInchargeDetails.compliance || 95}%</strong></span>
                </div>
                <div style={styles.kpiMiniBadge}>
                  <Check size={16} color="#2563eb" />
                  <span>Locality Status: <strong>{selectedInchargeDetails.status || 'ACTIVE'}</strong></span>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setSelectedInchargeDetails(null)}
                style={styles.cancelBtn}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedInchargeDetails(null);
                  navigate('/admin/incharges');
                }}
                style={styles.submitBtn}
              >
                <span>Manage Incharge &amp; Teams</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Comprehensive Field Agent Details Modal */}
      {selectedAgentDetails && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, width: '620px' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={styles.iconCircleBlue}>
                  <User size={20} color="#2563eb" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17.5px', fontWeight: 800, color: '#0f172a' }}>
                    {selectedAgentDetails.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Agent ID: <strong>{selectedAgentDetails.id}</strong> • Status: <span style={{ color: '#16a34a', fontWeight: 700 }}>{selectedAgentDetails.status || 'ACTIVE'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedAgentDetails(null)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* 6 Block Info Grid */}
              <div style={styles.modalInfoGrid}>
                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>PHONE NUMBER</span>
                  <span style={styles.modalInfoValue}>{selectedAgentDetails.phone || '+91 9876543213'}</span>
                </div>

                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>CORPORATE EMAIL</span>
                  <span style={styles.modalInfoValue}>{selectedAgentDetails.email || `${selectedAgentDetails.shortName?.toLowerCase().replace(/\s+/g, '') || 'agent'}.agt@royalsmarine.com`}</span>
                </div>

                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>REGION &amp; LOCALITY</span>
                  <span style={styles.modalInfoValue}>{selectedAgentDetails.locality}, {selectedAgentDetails.region || 'Coastal Andhra'}</span>
                </div>

                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>REPORTING INCHARGE</span>
                  <span style={{ ...styles.modalInfoValue, color: '#2563eb', fontWeight: 700 }}>
                    {selectedAgentDetails.incharge}
                  </span>
                </div>

                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>ASSIGNED PARTICULAR AREA / ZONE</span>
                  <span style={{ ...styles.modalInfoValue, color: '#0284c7', fontWeight: 800 }}>
                    {selectedAgentDetails.assignedArea || `${selectedAgentDetails.locality} Area`}
                  </span>
                </div>

                <div style={styles.modalInfoBlock}>
                  <span style={styles.modalInfoLabel}>ALLOCATED FARMERS &amp; TANKS</span>
                  <span style={{ ...styles.modalInfoValue, color: '#16a34a', fontWeight: 800 }}>
                    {selectedAgentDetails.farmers || 2} Farmers • {selectedAgentDetails.tanks || 4} Tanks
                  </span>
                </div>
              </div>

              {/* 3 Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '14px' }}>
                <div style={styles.agentMetricCard}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    {selectedAgentDetails.siteVisits || 6}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Site Visits</div>
                </div>

                <div style={styles.agentMetricCard}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#2563eb' }}>
                    {selectedAgentDetails.tests || 45}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Tests Submitted</div>
                </div>

                <div style={styles.agentMetricCard}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>
                    {selectedAgentDetails.compliance || 95}%
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Field Compliance</div>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setSelectedAgentDetails(null)}
                style={styles.cancelBtn}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = selectedAgentDetails.id;
                  setSelectedAgentDetails(null);
                  navigate(`/admin/agents/${id}`);
                }}
                style={styles.submitBtn}
              >
                <span>Open Full Agent Profile</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Add Locality */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, width: '480px' }}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="#2563eb" />
                Add New Locality
              </h3>
              <button onClick={() => setShowAddModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddLocality}>
              <div style={styles.modalBody}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={styles.modalLabel}>Region *</label>
                  <select
                    style={styles.modalSelect}
                    value={targetRegionId}
                    onChange={(e) => setTargetRegionId(e.target.value)}
                  >
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={styles.modalLabel}>Locality / Town Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Sullurpeta, Avanigadda"
                    value={newLocalityName}
                    onChange={(e) => setNewLocalityName(e.target.value)}
                    style={styles.modalInput}
                    required
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitBtn}
                >
                  Create Locality
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {successToast && (
        <div style={styles.toast}>
          <Check size={16} />
          <span>{successToast}</span>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1380px',
    margin: '0 auto'
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  },
  mainTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 4px 0',
    letterSpacing: '-0.3px'
  },
  mainSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0
  },
  addLocalityBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '9px 16px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
    transition: 'background-color 0.15s'
  },
  exportBtn: {
    backgroundColor: '#ffffff',
    color: '#0284c7',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    padding: '9px 16px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  },
  filterCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px 32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  filterCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f1f5f9'
  },
  filterCardTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1e293b',
    letterSpacing: '0.5px'
  },
  sortBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    border: '1px solid #bbf7d0',
    borderRadius: '6px',
    padding: '3px 8px',
    fontSize: '11.5px',
    fontWeight: 700
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px'
  },
  filterField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  filterLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#475569',
    letterSpacing: '0.4px'
  },
  filterSelect: {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1.5px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    fontSize: '13px',
    fontWeight: 500,
    color: '#0f172a',
    outline: 'none',
    cursor: 'pointer',
    transition: 'border-color 0.15s'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f8fafc',
    border: '1.5px solid #cbd5e1',
    borderRadius: '8px',
    padding: '9px 14px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    fontSize: '13px',
    color: '#1e293b'
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '16px',
    padding: 0
  },
  activeFilterChipsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '14px',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9'
  },
  chipPill: {
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '3px 8px',
    fontSize: '11.5px'
  },
  resetFilterBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: '11.5px',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px 32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px 32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  chartHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '14px',
    paddingBottom: '14px',
    borderBottom: '1px solid #f1f5f9'
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0
  },
  chartSubtitle: {
    fontSize: '12.5px',
    color: '#64748b',
    margin: '3px 0 0 0'
  },
  metricToggleGroup: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap'
  },
  metricToggleBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  tableHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  },
  tableTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0
  },
  tableSubtitle: {
    fontSize: '12.5px',
    color: '#64748b',
    margin: '3px 0 0 0'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  theadRow: {
    borderBottom: '2px solid #e2e8f0',
    backgroundColor: '#f8fafc'
  },
  th: {
    padding: '16px 20px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.4px'
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.15s',
    '&:hover': {
      backgroundColor: '#f8fafc'
    }
  },
  td: {
    padding: '18px 20px',
    verticalAlign: 'middle',
    fontSize: '13px',
    color: '#334155'
  },
  farmerNameBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    cursor: 'pointer'
  },
  farmerNameLink: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a',
    transition: 'color 0.15s',
    '&:hover': {
      color: '#2563eb',
      textDecoration: 'underline'
    }
  },
  farmerIdBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#2563eb'
  },
  contactBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  regionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  localityBadge: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a'
  },
  regionSubText: {
    fontSize: '11px',
    color: '#64748b'
  },
  areaChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#f0f9ff',
    color: '#0369a1',
    border: '1px solid #bae6fd',
    borderRadius: '4px',
    padding: '3px 7px',
    fontSize: '11.5px',
    fontWeight: 600
  },
  agentBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  inchargeTextRowClickable: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: '4px',
    transition: 'background-color 0.15s',
    '&:hover': {
      backgroundColor: '#eff6ff'
    }
  },
  inchargeLinkText: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#2563eb',
    textDecoration: 'underline',
    textDecorationColor: '#bfdbfe'
  },
  agentTextRowClickable: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: '4px',
    transition: 'background-color 0.15s',
    '&:hover': {
      backgroundColor: '#f0f9ff'
    }
  },
  agentLinkText: {
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#0369a1',
    textDecoration: 'underline',
    textDecorationColor: '#bae6fd'
  },
  iconCircleBlue: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  kpiMiniBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    color: '#334155'
  },
  agentMetricCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px 12px',
    textAlign: 'center'
  },

  landBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px'
  },
  tanksSubText: {
    fontSize: '11.5px',
    color: '#16a34a',
    fontWeight: 700
  },
  statusBadge: {
    fontSize: '10.5px',
    fontWeight: 800,
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.4px',
    display: 'inline-block'
  },
  actionBtnGroup: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  viewDetailsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#f8fafc',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11.5px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  drilldownBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11.5px',
    fontWeight: 600,
    cursor: 'pointer'
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
    borderRadius: '16px',
    maxWidth: '92vw',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f1f5f9'
  },
  iconCircleGreen: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#f0fdf4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer'
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column'
  },
  modalInfoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    backgroundColor: '#f8fafc',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0'
  },
  modalInfoBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  modalInfoLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.4px'
  },
  modalInfoValue: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: '#0f172a'
  },
  tankSpecCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px 12px'
  },
  tankAcresBadge: {
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    border: '1px solid #bbf7d0',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '11px',
    fontWeight: 700
  },
  modalLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '5px'
  },
  modalInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  modalSelect: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '16px'
  },
  cancelBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#475569',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  submitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 18px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#15803d',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 9999
  }
};

export default Regions;
