import React, { useState } from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { Download, FileSpreadsheet, CheckCircle2, User, Droplets } from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { downloadAquaEnterpriseWorkbook } from '../../utils/excelReportGenerator';

const ExportData = () => {
  const { db, getFarmersByAgentId, getTanksByFarmerId, getFarmerById } = useMockData();
  const [exportSuccess, setExportSuccess] = useState(false);
  
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [selectedTank, setSelectedTank] = useState('ALL');

  const agents = db?.agents || [];
  const farmers = selectedAgent ? getFarmersByAgentId(selectedAgent) : [];
  const tanks = selectedFarmer ? getTanksByFarmerId(selectedFarmer) : [];

  const handleExport = () => {
    if (!selectedFarmer) {
      alert("Please select a farmer to export data.");
      return;
    }
    
    downloadAquaEnterpriseWorkbook(db, selectedAgent, selectedFarmer, 'Farmer_Aqua_Export');
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <>
      <InchargeHeader title="Direct Data & Workbook Export" />

      <div style={{ padding: '24px 28px', maxWidth: '780px', margin: '0 auto' }}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>Export Dataset Configuration</h3>
              <p style={styles.cardSub}>Select the technician and farmer whose dataset you want to export</p>
            </div>
            <span style={styles.badge}>XLSX / CSV Ready</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            <div>
              <label style={styles.formLabel}>Field Technician</label>
              <select 
                style={styles.formInput}
                value={selectedAgent}
                onChange={e => {
                  setSelectedAgent(e.target.value);
                  setSelectedFarmer('');
                  setSelectedTank('ALL');
                }}
              >
                <option value="">-- Select Technician --</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.locality || 'Coastal'})</option>)}
              </select>
            </div>

            <div>
              <label style={styles.formLabel}>Aquaculture Farmer</label>
              <select 
                style={{ ...styles.formInput, opacity: !selectedAgent ? 0.6 : 1 }}
                value={selectedFarmer}
                onChange={e => {
                  setSelectedFarmer(e.target.value);
                  setSelectedTank('ALL');
                }}
                disabled={!selectedAgent}
              >
                <option value="">-- Select Farmer --</option>
                {farmers.map(f => <option key={f.id} value={f.id}>{f.name} ({f.location || 'Cluster'})</option>)}
              </select>
            </div>

            <div>
              <label style={styles.formLabel}>Target Tank / Pond</label>
              <select 
                style={{ ...styles.formInput, opacity: !selectedFarmer ? 0.6 : 1 }}
                value={selectedTank}
                onChange={e => setSelectedTank(e.target.value)}
                disabled={!selectedFarmer}
              >
                <option value="ALL">All Tanks & Culture Cycles</option>
                {tanks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="button"
              className="transition-all duration-150 active:scale-98 cursor-pointer"
              onClick={handleExport}
              disabled={!selectedFarmer}
              style={{
                ...styles.exportBtn,
                opacity: !selectedFarmer ? 0.5 : 1,
                cursor: !selectedFarmer ? 'not-allowed' : 'pointer'
              }}
            >
              <FileSpreadsheet size={16} />
              <span>Export Enterprise Excel Workbook</span>
            </button>
          </div>

          {exportSuccess && (
            <div style={styles.successBanner}>
              <CheckCircle2 size={16} color="#16A34A" />
              <span>Export completed successfully. Enterprise workbook downloaded.</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const styles = {
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '28px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid #F1F5F9',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  cardSub: {
    fontSize: '12.5px',
    color: '#64748B',
    margin: '3px 0 0 0',
  },
  badge: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#1A2FB8',
    backgroundColor: '#EFF6FF',
    border: '1px solid #DBEAFE',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  formLabel: {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '6px',
  },
  formInput: {
    width: '100%',
    padding: '11px 14px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '13.5px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
  },
  exportBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13.5px',
    fontWeight: '700',
  },
  successBanner: {
    marginTop: '20px',
    padding: '12px 16px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #DCFCE7',
    color: '#166534',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: '600',
  },
};

export default ExportData;

