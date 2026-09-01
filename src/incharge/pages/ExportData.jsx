import React, { useState } from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { Download } from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { calculateBiomass, calculateFCR } from '../../admin/utils/adminMockData';

const ExportData = () => {
  const { db, getFarmersByAgentId, getTanksByFarmerId, getFarmerById } = useMockData();
  const [exportSuccess, setExportSuccess] = useState(false);
  
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [selectedTank, setSelectedTank] = useState('ALL');

  const agents = db.agents;
  const farmers = selectedAgent ? getFarmersByAgentId(selectedAgent) : [];
  const tanks = selectedFarmer ? getTanksByFarmerId(selectedFarmer) : [];

  const handleExport = () => {
    if (!selectedFarmer) {
      alert("Please select a farmer to export data.");
      return;
    }
    
    const farmer = getFarmerById(selectedFarmer);
    let selectedTanks = tanks;
    if (selectedTank !== 'ALL') {
      selectedTanks = tanks.filter(t => t.id === selectedTank);
    }
    
    const tests = db.submissions.filter(s => s.farmerId === farmer.id && (selectedTank === 'ALL' || s.tankId === selectedTank));

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "FARMER DETAILS\n";
    csvContent += "Name,Phone,Location,Acres,Water Source\n";
    csvContent += `"${farmer.name}","${farmer.phone}","${farmer.location}","${farmer.acres}","${farmer.waterSource}"\n\n`;

    csvContent += "TANKS\n";
    csvContent += "Tank Name,Status,Test Status,ABW,Biomass,FCR,Last Test,Next Test\n";
    selectedTanks.forEach(t => {
      const acres = parseFloat(t.acres) || 4.0;
      const abw = parseFloat(t.abw) || 20.0;
      const seedStockingLak = t.seedStockingLak || parseFloat((acres * 0.8).toFixed(1));
      const biomass = calculateBiomass(seedStockingLak, abw) || t.biomass;
      const feed = t.feed || (biomass * (t.fcr || 1.30));
      const fcr = calculateFCR(feed, biomass);
      
      csvContent += `"${t.name}","${t.status}","${t.testStatus}","${t.abw}","${biomass}","${fcr}","${t.lastTest}","${t.nextTest}"\n`;
    });
    
    csvContent += "\nTEST DETAILS\n";
    csvContent += "Test ID,Tank Name,Test Type,Date,Status,Salinity,pH,DO,Water Color\n";
    tests.forEach(test => {
      const waterData = test.data?.waterQuality || {};
      const tankObj = selectedTanks.find(t => t.id === test.tankId);
      const tName = tankObj ? tankObj.name : test.tankId;
      csvContent += `"${test.id}","${tName}","${test.testType}","${test.date}","${test.status}","${waterData.salinity || 'N/A'}","${waterData.ph || 'N/A'}","${waterData.do || 'N/A'}","${waterData.waterColor || 'N/A'}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${farmer.name.replace(/\s+/g, '_')}_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <>
      <InchargeHeader title="Export Data" />
      <div className="content-inner">
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Export Settings</h3>
          
          <div className="grid md:grid-cols-1" style={{ gap: '16px', marginBottom: '24px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>Select Agent</label>
              <select 
                style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', backgroundColor: '#f8fafc', borderRadius: '8px', outline: 'none' }}
                value={selectedAgent}
                onChange={e => {
                  setSelectedAgent(e.target.value);
                  setSelectedFarmer('');
                  setSelectedTank('ALL');
                }}
              >
                <option value="">-- Select Agent --</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>Select Farmer</label>
              <select 
                style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', backgroundColor: '#f8fafc', borderRadius: '8px', outline: 'none' }}
                value={selectedFarmer}
                onChange={e => {
                  setSelectedFarmer(e.target.value);
                  setSelectedTank('ALL');
                }}
                disabled={!selectedAgent}
              >
                <option value="">-- Select Farmer --</option>
                {farmers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>Select Tank</label>
              <select 
                style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', backgroundColor: '#f8fafc', borderRadius: '8px', outline: 'none' }}
                value={selectedTank}
                onChange={e => setSelectedTank(e.target.value)}
                disabled={!selectedFarmer}
              >
                <option value="ALL">All Tanks</option>
                {tanks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <button className="btn-primary" onClick={handleExport}>
            <Download size={18} /> Download Excel
          </button>

          {exportSuccess && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#dcfce7', color: 'var(--status-green)', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>
              Export successful. Excel file downloaded.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExportData;
