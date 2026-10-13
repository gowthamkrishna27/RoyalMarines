import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import { Download, Table, CheckSquare, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { calculateBiomass, calculateFCR } from '../utils/adminCalculations';
import { adminService } from '../utils/adminService';
import {
  downloadAquaEnterpriseWorkbook,
  downloadSamplingExcel,
  downloadHarvestMasterExcel
} from '../../utils/excelReportGenerator';

const ExportCenter = () => {
  const [liveDb, setLiveDb] = useState({
    incharges: [],
    agents: [],
    farmers: [],
    tanks: [],
    submissions: [],
    harvests: []
  });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const loadExportData = (force = false) => {
    if (liveDb.farmers.length === 0) setLoading(true);
    Promise.allSettled([
      adminService.getIncharges(force),
      adminService.getAgents(force),
      adminService.getFarmers(force),
      adminService.getTanks(force),
      adminService.getSubmissions(force),
      adminService.getHarvests(force)
    ]).then(([incRes, agRes, farRes, tkRes, subRes, harRes]) => {
      setLiveDb({
        incharges: incRes.status === 'fulfilled' && Array.isArray(incRes.value) ? incRes.value : [],
        agents: agRes.status === 'fulfilled' && Array.isArray(agRes.value) ? agRes.value : [],
        farmers: farRes.status === 'fulfilled' && Array.isArray(farRes.value) ? farRes.value : [],
        tanks: tkRes.status === 'fulfilled' && Array.isArray(tkRes.value) ? tkRes.value : [],
        submissions: subRes.status === 'fulfilled' && Array.isArray(subRes.value) ? subRes.value : [],
        harvests: harRes.status === 'fulfilled' && Array.isArray(harRes.value) ? harRes.value : []
      });
      setLoading(false);
    }).catch(err => {
      console.error('[ExportCenter] Failed to load data:', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadExportData(false);
    const handleDataChanged = () => loadExportData(true);
    window.addEventListener('adminDataChanged', handleDataChanged);
    return () => window.removeEventListener('adminDataChanged', handleDataChanged);
  }, []);

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

  const incharges = liveDb.incharges;
  const agents = useMemo(() => {
    if (!selectedIncharge) return liveDb.agents;
    const targetInc = incharges.find(i => String(i.id) === String(selectedIncharge) || i.name === selectedIncharge);
    const incName = targetInc ? (targetInc.shortName || targetInc.name || '').toLowerCase() : selectedIncharge.toLowerCase();
    return liveDb.agents.filter(a => String(a.inchargeId) === String(selectedIncharge) || (incName && a.incharge?.toLowerCase().includes(incName)));
  }, [selectedIncharge, liveDb.agents, incharges]);

  const farmers = useMemo(() => {
    if (selectedAgent) {
      const targetAgent = agents.find(a => String(a.id) === String(selectedAgent) || a.name === selectedAgent);
      const agName = targetAgent ? (targetAgent.shortName || targetAgent.name || '').toLowerCase() : selectedAgent.toLowerCase();
      return liveDb.farmers.filter(f => String(f.agentId || f.agent_id) === String(selectedAgent) || (agName && f.agent?.toLowerCase().includes(agName)));
    }
    if (selectedIncharge) {
      const targetInc = incharges.find(i => String(i.id) === String(selectedIncharge) || i.name === selectedIncharge);
      const incName = targetInc ? (targetInc.shortName || targetInc.name || '').toLowerCase() : selectedIncharge.toLowerCase();
      return liveDb.farmers.filter(f => String(f.inchargeId || f.incharge_id) === String(selectedIncharge) || (incName && f.incharge?.toLowerCase().includes(incName)));
    }
    return liveDb.farmers;
  }, [selectedAgent, selectedIncharge, liveDb.farmers, agents, incharges]);

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

  const selectedCount = Object.values(selectedFields).filter(Boolean).length;

  const toggleField = (key) => {
    setSelectedFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAll = () => {
    const allSelected = {};
    fields.forEach(f => { allSelected[f.key] = true; });
    setSelectedFields(allSelected);
  };

  const handleClearAll = () => {
    const noneSelected = {};
    fields.forEach(f => { noneSelected[f.key] = false; });
    setSelectedFields(noneSelected);
  };

  const showToast = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDownload = () => {
    if (selectedCount === 0) {
      showToast('error', 'Please select at least one module/field to export.');
      return;
    }

    try {
      const success = downloadAquaEnterpriseWorkbook(
        liveDb,
        selectedAgent || null,
        selectedFarmer || 'ALL',
        'Royals_Marine_Export',
        null,
        null,
        selectedIncharge || null,
        selectedFields
      );

      if (success) {
        showToast('success', `Export generated successfully with ${selectedCount} selected module(s)!`);
      }
    } catch (err) {
      console.error('[ExportCenter] Export failed:', err);
      showToast('error', 'Failed to generate Excel export.');
    }
  };

  return (
    <>
      <PageHeader title="Export Center" />
      <div className="content-inner">

        {notification && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 18px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
            color: notification.type === 'error' ? '#991b1b' : '#166534',
            border: `1px solid ${notification.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
            fontSize: '14px',
            fontWeight: 500,
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{notification.message}</span>
          </div>
        )}

        <div className="grid md:grid-cols-3" style={{ gap: '24px' }}>

          {/* Export Scope Column */}
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
                <option value="">-- All Incharges (Statewide) --</option>
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
                  backgroundColor: '#f8fafc',
                  outline: 'none'
                }}
                value={selectedAgent}
                onChange={(e) => {
                  setSelectedAgent(e.target.value);
                  setSelectedFarmer('');
                }}
              >
                <option value="">
                  {selectedIncharge ? '-- All Agents under Incharge --' : '-- All Field Agents --'}
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
                  backgroundColor: '#f8fafc',
                  outline: 'none'
                }}
                value={selectedFarmer}
                onChange={(e) => setSelectedFarmer(e.target.value)}
              >
                <option value="">-- All Scoped Farmers ({farmers.length}) --</option>
                {farmers.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.village ? `• ${f.village}` : ''} {f.agent ? `(Agent: ${f.agent})` : ''}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px', display: 'block' }}>
                {selectedFarmer 
                  ? 'Filtering export strictly to the selected farmer and their individual ponds.' 
                  : `Exporting data for all ${farmers.length} farmer(s) currently matching the selected scope.`}
              </span>
            </div>
          </div>

          {/* Excel Columns & Module Selection */}
          <div className="card md:col-span-2" style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Table size={18} /> Excel Columns Selection
              </h3>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    color: '#1e293b',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                >
                  Deselect All
                </button>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
              Select the data points you want to include in the exported Excel spreadsheet. Only the selected modules will be exported as worksheets.
            </p>

            <div className="grid md:grid-cols-2" style={{ gap: '14px' }}>
              {fields.map(field => {
                const isSelected = !!selectedFields[field.key];
                return (
                  <div
                    key={field.key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '14px 16px', border: `1.5px solid ${isSelected ? '#22c55e' : 'var(--color-border)'}`,
                      borderRadius: '8px', cursor: 'pointer',
                      backgroundColor: isSelected ? '#f0fdf4' : 'white',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 1px 3px rgba(34, 197, 94, 0.1)' : 'none'
                    }}
                    onClick={() => toggleField(field.key)}
                  >
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '4px',
                      border: `1.5px solid ${isSelected ? 'var(--status-green)' : 'var(--color-text-muted)'}`,
                      backgroundColor: isSelected ? 'var(--status-green)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isSelected && <CheckSquare size={14} color="white" />}
                    </div>
                    <span style={{ fontSize: '13.5px', fontWeight: isSelected ? 600 : 500, color: isSelected ? '#0f172a' : 'var(--color-text-main)' }}>
                      {field.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions Bar */}
            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  {selectedCount === 0 ? (
                    <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={16} />
                      <span>0 modules selected. Check at least one module above to export.</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>{selectedCount}</span> of {fields.length} modules selected for export
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      downloadSamplingExcel(liveDb, selectedAgent || null, selectedFarmer || 'ALL', null, null, selectedIncharge || null);
                      showToast('success', 'Weekly Sampling (.xlsx) downloaded!');
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', backgroundColor: '#EFF6FF', color: '#1A2FB8', border: '1px solid #BFDBFE', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '12.5px' }}
                  >
                    <Download size={14} /> Sampling (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      downloadHarvestMasterExcel(liveDb, selectedAgent || null, selectedFarmer || 'ALL', selectedIncharge || null);
                      showToast('success', 'Harvest Master (.xlsx) downloaded!');
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '12.5px' }}
                  >
                    <Download size={14} /> Harvest (.xlsx)
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: selectedCount === 0 ? '#94a3b8' : '#1A2FB8',
                  cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedCount === 0 ? 0.6 : 1,
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '14px',
                  transition: 'all 0.15s ease'
                }}
                onClick={handleDownload}
                disabled={selectedCount === 0}
                title={selectedCount === 0 ? 'Please select at least one module to export' : `Export ${selectedCount} selected module(s)`}
              >
                <FileSpreadsheet size={18} />
                <span>
                  {selectedCount === 0 
                    ? 'Select at least 1 module to export (.xlsx)' 
                    : `Export Selected Modules (${selectedCount}) (.xlsx)`}
                </span>
              </button>
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
