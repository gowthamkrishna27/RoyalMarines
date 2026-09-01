import React from 'react';
import PageHeader from '../components/PageHeader';
import { FileText, Calendar, Map, Filter, Download } from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';

const Reports = () => {
  const [consolidationMode, setConsolidationMode] = useState('DATE');
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedFarmer, setSelectedFarmer] = useState('ALL');
  const [selectedTank, setSelectedTank] = useState('ALL');

  const { db } = useMockData();

  const allAreas = Array.from(new Set((db.farmers || []).map(f => f.location.split(',')[0].trim()))).filter(Boolean);

  const filteredFarmers = (db.farmers || [])
    .filter(f => selectedFarmer === 'ALL' || f.id === selectedFarmer)
    .filter(f => selectedArea === 'ALL' || f.location.toLowerCase().includes(selectedArea.toLowerCase()));

  const handleExportCSV = () => {
    let headers = ['Farmer Name', 'Area/Location', 'Land Acres', 'Water Source', 'Total Ponds (Tanks)'];
    let rows = filteredFarmers.map(f => {
      const pondsCount = (db.tanks || []).filter(t => t.farmerId === f.id).length;
      return [f.name, f.location, f.acres, f.waterSource, pondsCount];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `admin_consolidated_report_${consolidationMode.toLowerCase()}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <PageHeader title="Consolidated Reports" breadcrumbs={[{ label: 'Reports' }, { label: 'Generate Reports', active: true }]} />
      <div className="content-inner">

        <div className="card" style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '64px', height: '64px', backgroundColor: '#f1f5f9', borderRadius: '16px',
              display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px', color: 'var(--color-primary)'
            }}>
              <FileText size={32} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Organization Consolidated Report Generator</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Date-wise, Month-wise, Area-wise, Farmer-wise & Pond-wise consolidated exports</p>
          </div>

          {/* Mode Selector */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Consolidation Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              {[
                { id: 'DATE', label: '📅 Date-Wise' },
                { id: 'MONTH', label: '🗓️ Month-Wise' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setConsolidationMode(tab.id)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: consolidationMode === tab.id ? 'var(--color-primary)' : '#f8fafc',
                    color: consolidationMode === tab.id ? 'white' : 'var(--color-text-main)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2" style={{ gap: '24px', marginBottom: '28px' }}>
            {consolidationMode === 'MONTH' ? (
              <div className="input-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Select Month (Month-wise)</label>
                <input type="month" className="input-field" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ width: '100%' }} />
              </div>
            ) : (
              <>
                <div className="input-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Start Date (Date-wise)</label>
                  <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div className="input-group">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>End Date</label>
                  <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%' }} />
                </div>
              </>
            )}

            <div className="input-group">
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Area / Region (All Areas)</label>
              <select className="input-field" value={selectedArea} onChange={e => setSelectedArea(e.target.value)} style={{ width: '100%' }}>
                <option value="ALL">🌐 All Areas (Consolidated)</option>
                {allAreas.map(area => (
                  <option key={area} value={area}>📍 {area}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Farmer (Farmer-wise)</label>
              <select className="input-field" value={selectedFarmer} onChange={e => setSelectedFarmer(e.target.value)} style={{ width: '100%' }}>
                <option value="ALL">👥 All Farmers (Consolidated)</option>
                {(db.farmers || []).map(f => (
                  <option key={f.id} value={f.id}>👨‍🌾 {f.name} ({f.location})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'flex-end', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
            <button className="btn-secondary" onClick={() => { setSelectedArea('ALL'); setSelectedFarmer('ALL'); setConsolidationMode('DATE'); }} style={{ padding: '12px 24px' }}>Reset Filters</button>
            <button className="btn-primary" onClick={handleExportCSV} style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} /> Export Consolidated CSV
            </button>
          </div>
        </div>

      </div>
    </>
  );
};

export default Reports;
