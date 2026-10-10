import React, { useState, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import { Download, Table, CheckSquare, FileSpreadsheet } from 'lucide-react';
import {
  getIncharges,
  getAgentsByIncharge,
  getFarmersByAgent,
  getFarmersByIncharge,
  getFarmerById,
  getTanksByFarmer,
  calculateBiomass,
  calculateFCR
} from '../utils/adminMockData';
import { useMockData } from '../../context/MockDataContext';
import {
  downloadAquaEnterpriseWorkbook,
  downloadSamplingExcel,
  downloadHarvestMasterExcel
} from '../../utils/excelReportGenerator';

const ExportCenter = () => {
  const { db } = useMockData();
  const [selectedFields, setSelectedFields] = useState({
    farmerDetails: true,
    tankDetails: true,
    waterQuality: true,
    feedRecords: true,
    medication: false,
    disease: false,
    harvest: false,
    weeklyTests: true,
    siteVisits: false,
    verifications: false
  });

  const [selectedIncharge, setSelectedIncharge] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState('');

  const incharges = useMemo(() => getIncharges(db), [db]);
  const agents = useMemo(() => {
    return selectedIncharge ? getAgentsByIncharge(selectedIncharge, db) : [];
  }, [selectedIncharge, db]);

  // When agent is selected, show only that agent's farmers.
  // When incharge is selected (and no agent selected), show only that incharge's farmers!
  const farmers = useMemo(() => {
    if (selectedAgent) {
      return getFarmersByAgent(selectedAgent, db);
    }
    if (selectedIncharge) {
      return getFarmersByIncharge(selectedIncharge, db);
    }
    return [];
  }, [selectedAgent, selectedIncharge, db]);

  const handleDownload = () => {
    downloadAquaEnterpriseWorkbook(
      db,
      selectedAgent || null,
      selectedFarmer || 'ALL',
      'Royals_Marine_Export',
      null,
      null,
      selectedIncharge || null
    );

    // If a specific farmer is chosen, also generate their single-farmer summary CSV
    if (selectedFarmer) {
      const farmer = getFarmerById(selectedFarmer, db);
      const tanks = getTanksByFarmer(selectedFarmer, db);

      if (farmer) {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "FARMER DETAILS\n";
        csvContent += "Name,Phone,Village,Acres,Agent,Incharge,Region,Status\n";
        csvContent += `${farmer.name || 'Farmer'},${farmer.phone || 'N/A'},${farmer.village || 'N/A'},${farmer.acres || 'N/A'},${farmer.agent || 'N/A'},${farmer.incharge || 'N/A'},${farmer.region || 'N/A'},${farmer.status || 'Active'}\n\n`;

        csvContent += "TANKS\n";
        csvContent += "Tank Name,Culture Cycle,ABW (g),Biomass (kg),FCR,Weekly Compliance (%)\n";

        tanks.forEach(tank => {
          const acres = parseFloat(tank.acres) || 4.0;
          const abw = parseFloat(tank.abw) || 20.0;
          const seedStockingLak = tank.seedStockingLak || parseFloat((acres * 0.8).toFixed(1));
          const biomass = calculateBiomass(seedStockingLak, abw) || tank.biomass;
          const feed = tank.feed || (biomass * (tank.fcr || 1.30));
          const fcr = calculateFCR(feed, biomass);

          csvContent += `${tank.name},${tank.currentCycle},${abw},${biomass},${fcr},${tank.compliance}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${farmer.name.replace(/\s+/g, '_')}_data.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const toggleField = (key) => {
    setSelectedFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fields = [
    { key: 'farmerDetails', label: 'Farmer Details' },
    { key: 'tankDetails', label: 'Tank Basic Details' },
    { key: 'waterQuality', label: 'Water Quality Records' },
    { key: 'feedRecords', label: 'Feed Consumption' },
    { key: 'medication', label: 'Medication Usage' },
    { key: 'disease', label: 'Disease Observations' },
    { key: 'harvest', label: 'Harvest Data' },
    { key: 'weeklyTests', label: 'Weekly Test Status' },
    { key: 'siteVisits', label: 'Agent Site Visits / GPS' },
    { key: 'verifications', label: 'Incharge Verifications' },
  ];

  return (
    <>
      <PageHeader title="Export Center" />
      <div className="content-inner">

        <div className="grid md:grid-cols-3" style={{ gap: '24px' }}>

          <div className="card md:col-span-1" style={{ alignSelf: 'flex-start', padding: '24px 32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FilterIcon /> Export Scope
            </h3>

            <div className="input-group">
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Select Incharge (ASM)
              </label>
              <select
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: '#f8fafc', outline: 'none' }}
                value={selectedIncharge}
                onChange={(e) => {
                  setSelectedIncharge(e.target.value);
                  setSelectedAgent('');
                  setSelectedFarmer('');
                }}
              >
                <option value="">-- Select Incharge --</option>
                {incharges.map(inc => (
                  <option key={inc.id} value={inc.id}>
                    {inc.name} ({inc.region || 'Regional Head'})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Select Agent <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(Optional)</span>
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: !selectedIncharge ? '#f1f5f9' : '#f8fafc',
                  cursor: !selectedIncharge ? 'not-allowed' : 'pointer',
                  outline: 'none'
                }}
                value={selectedAgent}
                onChange={(e) => {
                  setSelectedAgent(e.target.value);
                  setSelectedFarmer('');
                }}
                disabled={!selectedIncharge}
              >
                <option value="">
                  {selectedIncharge ? '-- All Agents under Incharge --' : '-- Select Incharge First --'}
                </option>
                {agents.map(ag => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.locality || ag.assignedArea || 'Field Agent'})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Select Farmer <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(Optional)</span>
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: (!selectedIncharge && !selectedAgent) ? '#f1f5f9' : '#f8fafc',
                  cursor: (!selectedIncharge && !selectedAgent) ? 'not-allowed' : 'pointer',
                  outline: 'none'
                }}
                value={selectedFarmer}
                onChange={(e) => setSelectedFarmer(e.target.value)}
                disabled={!selectedIncharge && !selectedAgent}
              >
                {!selectedIncharge && !selectedAgent ? (
                  <option value="">-- Select Incharge First --</option>
                ) : selectedAgent ? (
                  <option value="">-- All Farmers under Agent ({farmers.length}) --</option>
                ) : (
                  <option value="">-- All Farmers under Incharge ({farmers.length}) --</option>
                )}
                {farmers.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.village ? `• ${f.village}` : ''} {!selectedAgent && f.agent ? `(Agent: ${f.agent})` : (!selectedAgent && !f.agent ? '(Direct Incharge)' : '')}
                  </option>
                ))}
              </select>
              {selectedIncharge && (
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                  {selectedAgent
                    ? `Showing ${farmers.length} farmer(s) reporting to selected agent.`
                    : `Showing all ${farmers.length} farmer(s) under this incharge (both direct and via agents).`}
                </span>
              )}
            </div>
          </div>

          <div className="card md:col-span-2" style={{ padding: '24px 32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Table size={18} /> Excel Columns Selection
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              Select the data points you want to include in the exported Excel spreadsheet.
            </p>

            <div className="grid md:grid-cols-2" style={{ gap: '20px' }}>
              {fields.map(field => (
                <div
                  key={field.key}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '16px', border: '1px solid var(--color-border)',
                    borderRadius: '8px', cursor: 'pointer',
                    backgroundColor: selectedFields[field.key] ? '#f0fdf4' : 'white',
                    borderColor: selectedFields[field.key] ? '#86efac' : 'var(--color-border)'
                  }}
                  onClick={() => toggleField(field.key)}
                >
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '4px',
                    border: `1px solid ${selectedFields[field.key] ? 'var(--status-green)' : 'var(--color-text-muted)'}`,
                    backgroundColor: selectedFields[field.key] ? 'var(--status-green)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {selectedFields[field.key] && <CheckSquare size={14} color="white" />}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: selectedFields[field.key] ? 600 : 500, color: 'var(--color-text-main)' }}>
                    {field.label}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                {Object.values(selectedFields).filter(Boolean).length} modules selected for export
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => downloadSamplingExcel(db, selectedAgent || null, selectedFarmer || 'ALL', null, null, selectedIncharge || null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', backgroundColor: '#EFF6FF', color: '#1A2FB8', border: '1px solid #BFDBFE', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '12.5px' }}
                >
                  <Download size={14} /> Sampling (.xlsx)
                </button>
                <button
                  onClick={() => downloadHarvestMasterExcel(db, selectedAgent || null, selectedFarmer || 'ALL', selectedIncharge || null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '12.5px' }}
                >
                  <Download size={14} /> Harvest (.xlsx)
                </button>
                <button
                  className="btn-primary"
                  style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1A2FB8' }}
                  onClick={handleDownload}
                >
                  <FileSpreadsheet size={16} /> Complete Workbook (.xlsx)
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </>
  );
};

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);

export default ExportCenter;
