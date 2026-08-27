import React, { useState } from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { Filter, Download } from 'lucide-react';

const Reports = () => {
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportDataBlocks, setReportDataBlocks] = useState([]);
  const { db, getFarmersByAgentId, getTanksByFarmerId } = useMockData();
  
  // State bindings
  const [filterDateFrom, setFilterDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [filterDateTo, setFilterDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAgent, setSelectedAgent] = useState('');
  
  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [selectedTank, setSelectedTank] = useState('');
  const [selectedTestType, setSelectedTestType] = useState('all');

  const availableFarmers = selectedAgent ? getFarmersByAgentId(selectedAgent) : [];
  const farmerObj = availableFarmers.find(f => f.id === selectedFarmer);
  
  const availableTanks = selectedFarmer ? (getTanksByFarmerId(selectedFarmer) || []) : [];
  const tankObj = selectedTank && selectedTank !== 'all' ? availableTanks.find(t => t.id === selectedTank) : null;

  const flattenObject = (ob) => {
    let toReturn = {};
    for (let i in ob) {
      if (!ob.hasOwnProperty(i)) continue;
      if ((typeof ob[i]) == 'object' && ob[i] !== null && !Array.isArray(ob[i])) {
        let flatObject = flattenObject(ob[i]);
        for (let x in flatObject) {
          if (!flatObject.hasOwnProperty(x)) continue;
          toReturn[x] = flatObject[x]; // Do not prefix with parent key
        }
      } else {
        toReturn[i] = ob[i];
      }
    }
    return toReturn;
  };

  const handleGenerateReport = () => {
    let filtered = db.submissions || [];
    
    if (selectedAgent) filtered = filtered.filter(s => s.agentId === selectedAgent);
    if (selectedFarmer) filtered = filtered.filter(s => s.farmerId === selectedFarmer);
    if (selectedTank && selectedTank !== 'all') filtered = filtered.filter(s => s.tankId === selectedTank);
    if (selectedTestType && selectedTestType !== 'all') filtered = filtered.filter(s => s.testType === selectedTestType);

    if (filtered.length === 0) {
      alert("No test data found for the selected criteria. Cannot generate report.");
      setReportGenerated(false);
      setReportDataBlocks([]);
      return;
    }

    // Group by test type
    const grouped = {};
    filtered.forEach(sub => {
      if (!grouped[sub.testType]) grouped[sub.testType] = [];
      grouped[sub.testType].push(sub);
    });

    const blocks = Object.keys(grouped).map(type => {
      const submissions = grouped[type];
      
      // Determine columns for this block
      const allHeadersSet = new Set(['Date', 'Tank No', 'Status']);
      submissions.forEach(sub => {
        Object.keys(flattenObject(sub.data || {})).forEach(k => allHeadersSet.add(k));
      });
      const headers = Array.from(allHeadersSet);

      return {
        testType: type,
        headers,
        submissions
      };
    });

    setReportDataBlocks(blocks);
    setReportGenerated(true);
  };

  const generateCSV = (blocks, filename) => {
    const csvRows = [];
    
    blocks.forEach(block => {
      // Calculate commas to prepend to center the text in the CSV
      const totalColumns = block.headers.length;
      const commasToPrepend = Math.max(0, Math.floor(totalColumns / 2) - 1);
      const prefix = ','.repeat(commasToPrepend);

      // Title Row
      csvRows.push(`${prefix}"${block.testType} Report"`);
      // Farmer Info Rows
      csvRows.push(`${prefix}Farmer Name,"${farmerObj ? farmerObj.name : '-'}"`);
      csvRows.push(`${prefix}Village,"${farmerObj ? farmerObj.location : '-'}"`);
      csvRows.push(`${prefix}Phone Number,"${farmerObj ? farmerObj.phone : '-'}"`);
      
      // Header Row
      const formattedHeaders = block.headers.map(h => h.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim());
      csvRows.push(formattedHeaders.map(h => `"${h}"`).join(','));
      
      // Data Rows
      block.submissions.forEach(sub => {
        const flatData = flattenObject(sub.data || {});
        const rowValues = block.headers.map(h => {
          let val = '-';
          if (h === 'Date') val = sub.date;
          else if (h === 'Tank No') val = sub.tankId.replace('T', '');
          else if (h === 'Status') val = sub.status;
          else {
             val = flatData[h];
             if (Array.isArray(val)) val = val.join('; ');
             else val = val || '-';
          }
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvRows.push(rowValues.join(','));
      });
      
      // Empty row between blocks
      csvRows.push('');
      csvRows.push('');
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename || `aqua_report_${new Date().getTime()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <InchargeHeader title="Reports" />
      <div className="content-inner">
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Report Filters</h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4" style={{ gap: '16px', marginBottom: '20px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label style={styles.label}>Date From</label>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="input-field" style={{ width: '100%' }} />
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label style={styles.label}>Date To</label>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="input-field" style={{ width: '100%' }} />
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label style={styles.label}>Agent Name</label>
              <select className="input-field" style={{ width: '100%' }} value={selectedAgent} onChange={e => { setSelectedAgent(e.target.value); setSelectedFarmer(''); setSelectedTank(''); }}>
                <option value="">Select Agent</option>
                {db.agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          {selectedAgent && (
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
               <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Farmer Details</h4>
               <div className="grid md:grid-cols-3" style={{ gap: '16px' }}>
                 <div className="input-group" style={{ margin: 0 }}>
                   <label style={styles.label}>Farmer Name</label>
                   <select className="input-field" style={{ width: '100%' }} value={selectedFarmer} onChange={e => { setSelectedFarmer(e.target.value); setSelectedTank(''); }}>
                     <option value="">Select Farmer</option>
                     {availableFarmers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                   </select>
                 </div>
                 <div className="input-group" style={{ margin: 0 }}>
                   <label style={styles.label}>Mobile Number</label>
                   <div style={styles.readOnlyBlock}>
                     {farmerObj ? farmerObj.phone : '-'}
                   </div>
                 </div>
                 <div className="input-group" style={{ margin: 0 }}>
                   <label style={styles.label}>Village</label>
                   <div style={styles.readOnlyBlock}>
                     {farmerObj ? farmerObj.location : '-'}
                   </div>
                 </div>
               </div>
               
               {selectedFarmer && (
                 <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
                   <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Tank Details & Tests</h4>
                   <div className="grid md:grid-cols-2" style={{ gap: '16px', maxWidth: '600px', marginBottom: '16px' }}>
                     <div className="input-group" style={{ margin: 0 }}>
                       <label style={styles.label}>Tank Selection</label>
                       <select className="input-field" style={{ width: '100%' }} value={selectedTank} onChange={e => setSelectedTank(e.target.value)}>
                         <option value="">Select Tank</option>
                         <option value="all">All Tanks</option>
                         {availableTanks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                       </select>
                     </div>
                     <div className="input-group" style={{ margin: 0 }}>
                       <label style={styles.label}>Test Type</label>
                       <select className="input-field" style={{ width: '100%' }} value={selectedTestType} onChange={e => setSelectedTestType(e.target.value)}>
                         <option value="all">All Tests</option>
                         <option value="Water Analysis">Water Quality</option>
                         <option value="Feed Test">Feed</option>
                         <option value="Medication">Medication</option>
                         <option value="Disease">Disease</option>
                         <option value="Harvest">Harvest</option>
                       </select>
                     </div>
                   </div>
                   
                   {tankObj && (
                      <div className="grid md:grid-cols-4 lg:grid-cols-5" style={{ gap: '12px', padding: '12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                        <div><strong style={styles.tankLabel}>Size:</strong> <div style={styles.tankValue}>{tankObj.size || '-'}</div></div>
                        <div><strong style={styles.tankLabel}>Salinity:</strong> <div style={styles.tankValue}>{tankObj.salinity || '-'}</div></div>
                        <div><strong style={styles.tankLabel}>Soil Type:</strong> <div style={styles.tankValue}>{tankObj.soilType || '-'}</div></div>
                        <div><strong style={styles.tankLabel}>Brood Name:</strong> <div style={styles.tankValue}>{tankObj.broodname || '-'}</div></div>
                        <div><strong style={styles.tankLabel}>Seed Date:</strong> <div style={styles.tankValue}>{tankObj.seedDate || '-'}</div></div>
                        <div><strong style={styles.tankLabel}>Seed Stocking:</strong> <div style={styles.tankValue}>{tankObj.seedStocking || '-'}</div></div>
                        <div><strong style={styles.tankLabel}>Feed Type:</strong> <div style={styles.tankValue}>{tankObj.feedType || '-'}</div></div>
                        <div><strong style={styles.tankLabel}>Reg. Location:</strong> <div style={styles.tankValue}>{tankObj.registeredLocation || '-'}</div></div>
                      </div>
                   )}
                 </div>
               )}
            </div>
          )}

          {selectedFarmer && (selectedTank || selectedTestType !== 'all') && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn-primary" onClick={handleGenerateReport} style={{ padding: '14px 32px', fontSize: '15px' }}>
                <Filter size={18} style={{ marginRight: '8px' }} /> Generate Report
              </button>
            </div>
          )}
        </div>

        {reportGenerated && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Test Details Report</h3>
              <button onClick={() => generateCSV(reportDataBlocks, 'aqua_all_tests_report.csv')} style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                padding: '8px 16px', backgroundColor: 'var(--status-green)', 
                color: 'white', border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontSize: '13px', fontWeight: 600
              }}>
                <Download size={16} /> Download All Tests (Excel)
              </button>
            </div>

            {reportDataBlocks.map((block, index) => (
              <div key={index} style={{ marginBottom: '40px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', border: '1px solid var(--color-border)' }}>
                  <thead>
                    <tr>
                      <th colSpan={block.headers.length} style={{ ...styles.th, backgroundColor: '#e2e8f0', textAlign: 'center', fontSize: '16px', borderBottom: '1px solid var(--color-border)', position: 'relative' }}>
                        {block.testType} Report
                        <button 
                          onClick={() => generateCSV([block], `aqua_${block.testType.replace(/\s+/g, '_').toLowerCase()}_report.csv`)}
                          style={{
                            position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 12px', backgroundColor: 'var(--color-primary)',
                            color: 'white', border: 'none', borderRadius: '6px',
                            cursor: 'pointer', fontSize: '12px', fontWeight: 600
                          }}>
                          <Download size={14} /> Download Excel
                        </button>
                      </th>
                    </tr>
                    <tr>
                      <td colSpan={block.headers.length} style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>
                        <strong style={{ color: 'var(--color-text-muted)' }}>Farmer Name:</strong> <span style={{ fontWeight: 600, color: 'var(--color-text-main)', marginLeft: '8px' }}>{farmerObj ? farmerObj.name : '-'}</span>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={block.headers.length} style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>
                        <strong style={{ color: 'var(--color-text-muted)' }}>Village:</strong> <span style={{ fontWeight: 500, color: 'var(--color-text-main)', marginLeft: '8px' }}>{farmerObj ? farmerObj.location : '-'}</span>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={block.headers.length} style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid var(--color-border)' }}>
                        <strong style={{ color: 'var(--color-text-muted)' }}>Phone Number:</strong> <span style={{ fontWeight: 500, color: 'var(--color-text-main)', marginLeft: '8px' }}>{farmerObj ? farmerObj.phone : '-'}</span>
                      </td>
                    </tr>
                    
                    <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                      {block.headers.map(header => (
                        <th key={header} style={{ ...styles.th, textTransform: 'capitalize' }}>
                          {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.submissions.map((sub, idx) => {
                      const flatData = flattenObject(sub.data || {});
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          {block.headers.map(header => {
                            let val = '-';
                            if (header === 'Date') val = sub.date;
                            else if (header === 'Tank No') val = sub.tankId.replace('T', '');
                            else if (header === 'Status') val = (
                              <span style={{
                                padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                                backgroundColor: sub.status === 'COMPLETED' ? '#dcfce7' : '#f1f5f9',
                                color: sub.status === 'COMPLETED' ? 'var(--status-green)' : 'var(--color-text-muted)'
                              }}>
                                {sub.status}
                              </span>
                            );
                            else {
                              val = flatData[header];
                              if (Array.isArray(val)) val = val.join(', ');
                              else val = val || '-';
                            }
                            return <td key={header} style={styles.td}>{val}</td>;
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}

          </div>
        )}
      </div>
    </>
  );
};

const styles = {
  label: { display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: '#475569' },
  readOnlyBlock: { 
    width: '100%', 
    padding: '10px 12px', 
    backgroundColor: '#e2e8f0', 
    color: '#334155', 
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    minHeight: '42px',
    display: 'flex',
    alignItems: 'center'
  },
  tankLabel: { fontSize: '12px', color: 'var(--color-text-muted)' },
  tankValue: { fontSize: '14px', fontWeight: 500, color: 'var(--color-text-main)', marginTop: '4px' },
  th: { padding: '12px 16px', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' },
  td: { padding: '12px 16px', fontSize: '14px', color: 'var(--color-text-main)', fontWeight: 500 }
};

export default Reports;
