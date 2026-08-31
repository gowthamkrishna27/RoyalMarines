import React, { useState, useEffect, useRef } from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { useMockData } from '../../context/MockDataContext';
import { 
  Filter, Download, FileSpreadsheet, Calendar, User, Droplets, 
  CheckCircle2, ChevronRight, ChevronDown, FileText, Table, Printer, BarChart3, ShieldCheck
} from 'lucide-react';
import { 
  downloadAquaEnterpriseWorkbook, 
  downloadSamplingExcel, 
  downloadHarvestMasterExcel 
} from '../../utils/excelReportGenerator';

const Reports = () => {
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportDataBlocks, setReportDataBlocks] = useState([]);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { db, getFarmersByAgentId, getTanksByFarmerId } = useMockData();
  
  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          toReturn[x] = flatObject[x];
        }
      } else {
        toReturn[i] = ob[i];
      }
    }
    return toReturn;
  };

  const handleGenerateReport = () => {
    let filtered = db?.submissions || [];
    
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

    const grouped = {};
    filtered.forEach(sub => {
      const type = sub.testType || sub.recordType || 'Water Quality';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(sub);
    });

    const blocks = Object.keys(grouped).map(type => {
      const submissions = grouped[type];
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
      const totalColumns = block.headers.length;
      const commasToPrepend = Math.max(0, Math.floor(totalColumns / 2) - 1);
      const prefix = ','.repeat(commasToPrepend);

      csvRows.push(`${prefix}"${block.testType} Report"`);
      csvRows.push(`${prefix}Farmer Name,"${farmerObj ? farmerObj.name : '-'}"`);
      csvRows.push(`${prefix}Village,"${farmerObj ? farmerObj.location : '-'}"`);
      csvRows.push(`${prefix}Phone Number,"${farmerObj ? farmerObj.phone : '-'}"`);
      
      const formattedHeaders = block.headers.map(h => h.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim());
      csvRows.push(formattedHeaders.map(h => `"${h}"`).join(','));
      
      block.submissions.forEach(sub => {
        const flatData = flattenObject(sub.data || {});
        const rowValues = block.headers.map(h => {
          let val = '-';
          if (h === 'Date') val = sub.date;
          else if (h === 'Tank No') val = sub.tankId ? sub.tankId.replace(/\D/g, '') : '1';
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

  const handleExportOption = (type) => {
    setIsExportDropdownOpen(false);
    if (type === 'WORKBOOK') {
      downloadAquaEnterpriseWorkbook(db, selectedAgent, selectedFarmer, 'Enterprise_Field_Report');
    } else if (type === 'SAMPLING') {
      downloadSamplingExcel(db, selectedAgent, selectedFarmer);
    } else if (type === 'HARVEST') {
      downloadHarvestMasterExcel(db, selectedAgent);
    } else if (type === 'CSV') {
      if (reportDataBlocks.length > 0) {
        generateCSV(reportDataBlocks, 'Aqua_Regional_Operations_Ledger.csv');
      } else {
        // Generate quick CSV from all submissions
        const sampleBlocks = [{
          testType: 'Regional Field Tests',
          headers: ['Date', 'Tank No', 'Status'],
          submissions: db?.submissions || []
        }];
        generateCSV(sampleBlocks, 'Aqua_Regional_Operations_Ledger.csv');
      }
    } else if (type === 'PRINT') {
      window.print();
    }
  };

  return (
    <>
      <InchargeHeader title="Reports & Export Center" />

      <div style={styles.pageContainer}>
        
        {/* Top Header Row with Export Files Dropdown */}
        <div style={styles.topHeaderRow}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <h2 style={styles.pageHeading}>Reports & Data Exports</h2>
            <p style={styles.pageSubheading}>
              Generate field performance analytics, water quality sampling sheets, and enterprise audit workbooks.
            </p>
          </div>

          {/* Export Files Dropdown Button */}
          <div style={styles.dropdownWrapper} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsExportDropdownOpen(prev => !prev)}
              style={styles.exportDropdownBtn}
              className="transition-all duration-150 active:scale-95 cursor-pointer shadow-sm hover:bg-blue-900"
            >
              <Download size={16} />
              <span>Export Files</span>
              <ChevronDown size={15} style={{ transform: isExportDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>

            {/* Dropdown Menu */}
            {isExportDropdownOpen && (
              <div style={styles.exportDropdownMenu}>
                <div style={styles.dropdownHeader}>
                  <span>Select Export Format & Dataset</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleExportOption('WORKBOOK')}
                  style={styles.dropdownItem}
                  className="hover:bg-blue-50 transition-colors"
                >
                  <div style={{ ...styles.dropdownIconBox, backgroundColor: '#EFF6FF', color: '#1A2FB8' }}>
                    <FileSpreadsheet size={16} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Complete Workbook (.xlsx)</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Full multi-tab master audit sheets & telemetry</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportOption('SAMPLING')}
                  style={styles.dropdownItem}
                  className="hover:bg-blue-50 transition-colors"
                >
                  <div style={{ ...styles.dropdownIconBox, backgroundColor: '#ECFDF5', color: '#059669' }}>
                    <Table size={16} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Sampling Sheet (.xlsx)</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Water quality parameters, pH, DO & salinity</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportOption('HARVEST')}
                  style={styles.dropdownItem}
                  className="hover:bg-blue-50 transition-colors"
                >
                  <div style={{ ...styles.dropdownIconBox, backgroundColor: '#FEF3C7', color: '#D97706' }}>
                    <BarChart3 size={16} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Harvest Master (.xlsx)</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Harvest logs, counts, biomass & FCR totals</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportOption('CSV')}
                  style={styles.dropdownItem}
                  className="hover:bg-blue-50 transition-colors"
                >
                  <div style={{ ...styles.dropdownIconBox, backgroundColor: '#F1F5F9', color: '#475569' }}>
                    <FileText size={16} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Raw Audit Data (.csv)</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Universal CSV dataset for spreadsheet imports</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportOption('PRINT')}
                  style={{ ...styles.dropdownItem, borderTop: '1px solid #F1F5F9' }}
                  className="hover:bg-blue-50 transition-colors"
                >
                  <div style={{ ...styles.dropdownIconBox, backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
                    <Printer size={16} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>Print / Save PDF (.pdf)</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Clean regional executive summary format</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Configuration Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} color="#1A2FB8" />
              <h3 style={styles.cardTitle}>Report Query & Filter Parameters</h3>
            </div>
            <span style={styles.activeTag}>Enterprise Excel Ready</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '16px' }}>
            <div>
              <label style={styles.formLabel}>Date From</label>
              <input 
                type="date" 
                value={filterDateFrom} 
                onChange={e => setFilterDateFrom(e.target.value)} 
                style={styles.formInput} 
              />
            </div>
            <div>
              <label style={styles.formLabel}>Date To</label>
              <input 
                type="date" 
                value={filterDateTo} 
                onChange={e => setFilterDateTo(e.target.value)} 
                style={styles.formInput} 
              />
            </div>
            <div>
              <label style={styles.formLabel}>Field Technician</label>
              <select 
                style={styles.formInput} 
                value={selectedAgent} 
                onChange={e => { setSelectedAgent(e.target.value); setSelectedFarmer(''); setSelectedTank(''); }}
              >
                <option value="">Select Technician</option>
                {(db?.agents || []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          {/* Conditional Farmer & Tank Selection Box */}
          {selectedAgent && (
            <div style={styles.subFilterBox}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={styles.formLabel}>Farmer Name</label>
                  <select 
                    style={styles.formInput} 
                    value={selectedFarmer} 
                    onChange={e => { setSelectedFarmer(e.target.value); setSelectedTank(''); }}
                  >
                    <option value="">Select Farmer</option>
                    {availableFarmers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.formLabel}>Farmer Contact</label>
                  <div style={styles.readOnlyBlock}>
                    {farmerObj ? farmerObj.phone : '—'}
                  </div>
                </div>
                <div>
                  <label style={styles.formLabel}>Farm Locality</label>
                  <div style={styles.readOnlyBlock}>
                    {farmerObj ? farmerObj.location : '—'}
                  </div>
                </div>
              </div>

              {selectedFarmer && (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={styles.formLabel}>Tank / Pond</label>
                      <select 
                        style={styles.formInput} 
                        value={selectedTank} 
                        onChange={e => setSelectedTank(e.target.value)}
                      >
                        <option value="">All Supervised Tanks</option>
                        {availableTanks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={styles.formLabel}>Record Category</label>
                      <select 
                        style={styles.formInput} 
                        value={selectedTestType} 
                        onChange={e => setSelectedTestType(e.target.value)}
                      >
                        <option value="all">All Field Records</option>
                        <option value="Water Quality Analysis">Water Quality</option>
                        <option value="Feed Test">Feed Consumption</option>
                        <option value="Weekly Sampling">Weekly Sampling</option>
                        <option value="Harvest">Harvest Summary</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button 
              type="button"
              className="transition-all duration-150 active:scale-98 cursor-pointer"
              onClick={handleGenerateReport} 
              style={styles.generateBtn}
            >
              <Filter size={16} />
              <span>Generate Audit Preview</span>
            </button>
          </div>
        </div>

        {/* Generated Report Card */}
        {reportGenerated && (
          <div style={{ ...styles.card, marginTop: '24px' }}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={styles.cardTitle}>Regional Field Operations Audit Ledger</h3>
                <span style={styles.cardSub}>Official enterprise Excel spreadsheets matching aqua sampling and harvest master formats</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  type="button"
                  onClick={() => downloadSamplingExcel(db, selectedAgent, selectedFarmer)} 
                  style={styles.downloadSecBtn}
                  className="transition-all duration-150 active:scale-98 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Sampling Sheet (.xlsx)</span>
                </button>
                <button 
                  type="button"
                  onClick={() => downloadHarvestMasterExcel(db, selectedAgent)} 
                  style={styles.downloadGreenBtn}
                  className="transition-all duration-150 active:scale-98 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Harvest Master (.xlsx)</span>
                </button>
                <button 
                  type="button"
                  onClick={() => downloadAquaEnterpriseWorkbook(db, selectedAgent, selectedFarmer, 'Incharge_Field_Report')} 
                  style={styles.downloadMainBtn}
                  className="transition-all duration-150 active:scale-98 cursor-pointer"
                >
                  <FileSpreadsheet size={15} />
                  <span>Complete Workbook (.xlsx)</span>
                </button>
              </div>
            </div>

            {reportDataBlocks.map((block, index) => (
              <div key={index} style={{ marginTop: '24px', overflowX: 'auto' }}>
                <div style={styles.tableHeaderBanner}>
                  <span style={{ fontWeight: '800', fontSize: '14px', color: '#1A2FB8' }}>
                    {block.testType} Ledger ({block.submissions.length} records)
                  </span>
                  <button 
                    type="button"
                    onClick={() => generateCSV([block], `aqua_${block.testType.replace(/\s+/g, '_').toLowerCase()}_report.csv`)}
                    style={styles.csvBtn}
                  >
                    <Download size={13} />
                    <span>Download Section CSV</span>
                  </button>
                </div>

                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      {block.headers.map(header => (
                        <th key={header} style={styles.th}>
                          {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.submissions.map((sub, idx) => {
                      const flatData = flattenObject(sub.data || {});
                      return (
                        <tr key={idx} style={styles.tr}>
                          {block.headers.map(header => {
                            let val = '-';
                            if (header === 'Date') val = sub.date;
                            else if (header === 'Tank No') val = sub.tankId ? `Tank ${sub.tankId.replace(/\D/g, '') || '1'}` : 'Tank 1';
                            else if (header === 'Status') val = (
                              <span style={styles.statusPill}>
                                <CheckCircle2 size={11} /> {sub.status || 'Verified'}
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
  pageContainer: {
    padding: '20px 20px 80px 20px',
    maxWidth: '1440px',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  topHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '14px',
  },
  pageHeading: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  pageSubheading: {
    fontSize: '12.5px',
    color: '#64748B',
    margin: '3px 0 0 0',
    lineHeight: 1.4,
  },
  dropdownWrapper: {
    position: 'relative',
    display: 'inline-block',
  },
  exportDropdownBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 18px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  exportDropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '320px',
    maxWidth: 'calc(100vw - 36px)',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.18), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
    zIndex: 100,
    overflow: 'hidden',
  },
  dropdownHeader: {
    padding: '10px 14px',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #F1F5F9',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '10px 14px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px solid #F8FAFC',
    cursor: 'pointer',
    textAlign: 'left',
  },
  dropdownIconBox: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid #F1F5F9',
    flexWrap: 'wrap',
    gap: '12px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  cardSub: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
    display: 'block',
  },
  activeTag: {
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
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '6px',
  },
  formInput: {
    width: '100%',
    padding: '9px 12px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
  },
  subFilterBox: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
  },
  readOnlyBlock: {
    width: '100%',
    padding: '9px 12px',
    backgroundColor: '#F1F5F9',
    color: '#334155',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    boxSizing: 'border-box',
  },
  generateBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 24px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  downloadSecBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    border: '1px solid #BFDBFE',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  downloadGreenBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#ECFDF5',
    color: '#059669',
    border: '1px solid #A7F3D0',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  downloadMainBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  tableHeaderBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: '10px 16px',
    borderRadius: '8px 8px 0 0',
    border: '1px solid #E2E8F0',
    borderBottom: 'none',
  },
  csvBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: '#FFFFFF',
    color: '#1A2FB8',
    border: '1px solid #DBEAFE',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    border: '1px solid #E2E8F0',
  },
  thRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '2px solid #E2E8F0',
  },
  th: {
    padding: '10px 14px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#0F172A',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
};

export default Reports;

