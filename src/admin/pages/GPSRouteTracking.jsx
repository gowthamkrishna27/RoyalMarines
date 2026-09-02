import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Search, Calendar, Download, Play, Pause, Square, MapPin,
  Clock, Battery, Wifi, Activity, User, Briefcase, Navigation,
  AlertTriangle, Info, CheckCircle2, XCircle, Droplet, UserCircle, Map
} from 'lucide-react';
import { getMockRouteData } from '../utils/mockRouteData';

// Custom Map Icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const icons = {
  LOGIN: createCustomIcon('#22c55e'),
  LOGOUT: createCustomIcon('#ef4444'),
  TANK_VISIT: createCustomIcon('#3b82f6'),
  FARMER_VISIT: createCustomIcon('#f59e0b'),
  LONG_STOP: createCustomIcon('#eab308'),
  MOVING: createCustomIcon('#94a3b8')
};

// Component to dynamically fit bounds of the map based on route
const RouteBounds = ({ route }) => {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 0) {
      const bounds = L.latLngBounds(route.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);
  return null;
};

const GPSRouteTracking = () => {
  const [employeeType, setEmployeeType] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [trackingData, setTrackingData] = useState(null);
  
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const replayInterval = useRef(null);

  // Mock search results based on type
  const employeeList = [
    { id: 'emp-1', name: 'Ravi Kumar', type: 'Agent', status: 'Online' },
    { id: 'emp-2', name: 'Srinivas', type: 'Incharge', status: 'Offline' },
    { id: 'emp-3', name: 'Sai Teja', type: 'Agent', status: 'Online' },
  ].filter(e => employeeType === 'All' || e.type === employeeType.slice(0, -1) || e.type === employeeType);

  useEffect(() => {
    if (selectedEmployee) {
      setTrackingData(getMockRouteData(date, selectedEmployee));
      setReplayIndex(0);
      setIsReplaying(false);
      clearInterval(replayInterval.current);
    }
  }, [selectedEmployee, date]);

  // Replay Logic
  const handlePlayPause = () => {
    if (!trackingData || !trackingData.route) return;
    
    if (isReplaying) {
      setIsReplaying(false);
      clearInterval(replayInterval.current);
    } else {
      setIsReplaying(true);
      if (replayIndex >= trackingData.route.length - 1) {
        setReplayIndex(0);
      }
      replayInterval.current = setInterval(() => {
        setReplayIndex(prev => {
          if (prev >= trackingData.route.length - 1) {
            clearInterval(replayInterval.current);
            setIsReplaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 800); // Replay speed
    }
  };

  const handleStop = () => {
    setIsReplaying(false);
    clearInterval(replayInterval.current);
    setReplayIndex(0);
  };

  const getVisibleRoute = () => {
    if (!trackingData || !trackingData.route) return [];
    if (isReplaying || replayIndex > 0) {
      return trackingData.route.slice(0, replayIndex + 1);
    }
    return trackingData.route;
  };

  const visibleRoute = getVisibleRoute();
  const polylinePositions = visibleRoute.map(p => [p.lat, p.lng]);

  return (
    <div style={styles.container}>
      {/* HEADER & FILTERS (Sticky) */}
      <div style={styles.stickyHeader}>
        <div style={styles.headerTitleRow}>
          <div>
            <h1 style={styles.pageTitle}>GPS Route Tracking</h1>
            <p style={styles.pageSubtitle}>Track and replay complete movement history during working hours.</p>
          </div>
          <div style={styles.actionButtons}>
            <button style={styles.exportBtn}><Download size={16} /> Export PDF</button>
            <button style={styles.exportBtn}><Download size={16} /> Export Excel</button>
          </div>
        </div>

        <div style={styles.filterBar}>
          <select style={styles.select} value={employeeType} onChange={e => setEmployeeType(e.target.value)}>
            <option value="All">All Employees</option>
            <option value="Agents">Agents</option>
            <option value="Incharges">Incharges</option>
          </select>

          <div style={styles.searchBox}>
            <Search size={16} color="#94a3b8" />
            <select 
              style={styles.searchInput} 
              value={selectedEmployee} 
              onChange={e => setSelectedEmployee(e.target.value)}
            >
              <option value="">▼ Select Employee</option>
              {employeeList.map(e => (
                <option key={e.id} value={e.id}>{e.status === 'Online' ? '🟢 ' : '⚪ '}{e.name} ({e.id}) - {e.type}</option>
              ))}
            </select>
          </div>

          <div style={styles.datePickerContainer}>
            <Calendar size={16} color="#94a3b8" />
            <input type="date" style={styles.dateInput} value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <button style={styles.primaryBtn} disabled={!selectedEmployee}>
            <Map size={16} /> View Route
          </button>
        </div>
      </div>

      {trackingData ? (
        <div style={styles.mainContent}>
          {/* LEFT SIDEBAR - Summary & Stats */}
          <div style={styles.sidebarColumn}>
            {/* Employee Summary Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.empPhoto}><User size={24} color="#1d4ed8" /></div>
                <div>
                  <h3 style={styles.empName}>{trackingData.employeeInfo.name}</h3>
                  <p style={styles.empId}>{trackingData.employeeInfo.id} • {trackingData.employeeInfo.role}</p>
                </div>
              </div>
              <div style={styles.grid2Col}>
                <div style={styles.statItem}><MapPin size={14} /> <span>{trackingData.employeeInfo.area}</span></div>
                <div style={styles.statItem}><Clock size={14} /> <span>{trackingData.employeeInfo.workingHours}</span></div>
                <div style={styles.statItem}><Navigation size={14} /> <span>{trackingData.employeeInfo.totalDistance}</span></div>
                <div style={styles.statItem}><Battery size={14} /> <span>{trackingData.employeeInfo.battery}</span></div>
                <div style={styles.statItem}><Wifi size={14} /> <span>{trackingData.employeeInfo.internet}</span></div>
                <div style={styles.statItem}><Activity size={14} /> <span>{trackingData.employeeInfo.productivityScore}/100</span></div>
              </div>
            </div>

            {/* Daily Stats */}
            <div style={styles.card}>
              <h4 style={styles.cardTitle}>Daily Statistics</h4>
              <div style={styles.statsGrid}>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Travel Time</div>
                  <div style={styles.statValue}>{trackingData.stats.travelTime}</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Idle Time</div>
                  <div style={styles.statValue}>{trackingData.stats.idleTime}</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Avg Speed</div>
                  <div style={styles.statValue}>{trackingData.stats.avgSpeed}</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Tank Visits</div>
                  <div style={styles.statValue}>{trackingData.stats.tankVisits}</div>
                </div>
              </div>
            </div>

            {/* Smart Alerts */}
            {trackingData.alerts.length > 0 && (
              <div style={styles.card}>
                <h4 style={styles.cardTitle}>Smart Alerts</h4>
                <div style={styles.alertsList}>
                  {trackingData.alerts.map(alert => (
                    <div key={alert.id} style={{...styles.alertItem, borderLeftColor: alert.type === 'WARNING' ? '#ef4444' : '#f59e0b'}}>
                      <div style={styles.alertIcon}>
                        {alert.type === 'WARNING' ? <AlertTriangle size={16} color="#ef4444" /> : <Info size={16} color="#f59e0b" />}
                      </div>
                      <div>
                        <div style={styles.alertTitle}>{alert.title}</div>
                        <div style={styles.alertMsg}>{alert.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MAIN COLUMN - Map & Replay */}
          <div style={styles.mapColumn}>
            <div style={styles.mapWrapper}>
              <MapContainer 
                center={[visibleRoute[0]?.lat || 16.5449, visibleRoute[0]?.lng || 81.5212]} 
                zoom={12} 
                style={{ height: '100%', width: '100%', borderRadius: '12px' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                
                <RouteBounds route={trackingData.route} />
                
                {polylinePositions.length > 1 && (
                  <Polyline positions={polylinePositions} color="#3b82f6" weight={4} opacity={0.8} />
                )}

                {visibleRoute.map(point => (
                  <Marker 
                    key={point.id} 
                    position={[point.lat, point.lng]} 
                    icon={icons[point.type] || icons.MOVING}
                  >
                    <Popup>
                      <div style={styles.popupContent}>
                        <strong>{point.locationName}</strong>
                        <div style={styles.popupRow}><span>Time:</span> {point.time}</div>
                        <div style={styles.popupRow}><span>Duration:</span> {point.duration}</div>
                        <div style={styles.popupRow}><span>Purpose:</span> {point.purpose}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Replay Controls Overlay */}
              <div style={styles.replayControls}>
                <button onClick={handlePlayPause} style={styles.replayBtn}>
                  {isReplaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button onClick={handleStop} style={styles.replayBtn}>
                  <Square size={18} />
                </button>
                <div style={styles.replayProgress}>
                  <div style={{
                    height: '100%', 
                    backgroundColor: '#1d4ed8', 
                    width: `${((replayIndex + 1) / trackingData.route.length) * 100}%`
                  }} />
                </div>
                <span style={styles.replayTime}>
                  {visibleRoute[visibleRoute.length - 1]?.time || '00:00 AM'}
                </span>
              </div>
            </div>
            
            {/* BOTTOM SECTION - Timeline & Tanks */}
            <div style={styles.bottomSection}>
              <div style={{...styles.card, flex: 1}}>
                <h4 style={styles.cardTitle}>Route Timeline</h4>
                <div style={styles.timeline}>
                  {trackingData.route.map((item, idx) => (
                    <div key={item.id} style={styles.timelineItem}>
                      <div style={styles.timelineTime}>{item.time}</div>
                      <div style={styles.timelineDotLine}>
                        <div style={{...styles.timelineDot, backgroundColor: item.type === 'LOGIN' ? '#22c55e' : item.type === 'LOGOUT' ? '#ef4444' : '#3b82f6'}} />
                        {idx !== trackingData.route.length - 1 && <div style={styles.timelineLine} />}
                      </div>
                      <div style={styles.timelineContent}>
                        <div style={styles.timelineTitle}>{item.locationName}</div>
                        <div style={styles.timelineDesc}>{item.purpose} • {item.duration}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{...styles.card, flex: 1}}>
                <h4 style={styles.cardTitle}>Tank Visit Verification</h4>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>Tank</th>
                      <th style={styles.th}>Farmer</th>
                      <th style={styles.th}>Time</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trackingData.assignedTanks.map((t, idx) => (
                      <tr key={idx} style={styles.tdRow}>
                        <td style={styles.td}><strong>{t.name}</strong></td>
                        <td style={styles.td}>{t.farmer}</td>
                        <td style={styles.td}>{t.arrival}</td>
                        <td style={styles.td}>
                          {t.verified ? <CheckCircle2 size={16} color="#16a34a" /> : <XCircle size={16} color="#ef4444" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <Navigation size={48} color="#cbd5e1" />
          <h3>Select an employee to view tracking data</h3>
          <p>Choose an agent or incharge and select a date to replay their daily route.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1600px',
    margin: '0 auto',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  stickyHeader: {
    position: 'sticky',
    top: 0,
    backgroundColor: '#f8fafc',
    zIndex: 10,
    paddingBottom: '20px',
    marginBottom: '20px',
    borderBottom: '1px solid #e2e8f0'
  },
  headerTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  pageTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#0f172a'
  },
  pageSubtitle: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#64748b'
  },
  actionButtons: {
    display: 'flex',
    gap: '12px'
  },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155'
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#1d4ed8',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff'
  },
  filterBar: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: '12px 20px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  select: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    outline: 'none',
    fontSize: '14px',
    color: '#1e293b'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '0 14px',
    flex: 1,
    height: '42px'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '14px',
    backgroundColor: 'transparent'
  },
  datePickerContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '0 14px',
    height: '42px'
  },
  dateInput: {
    border: 'none',
    outline: 'none',
    fontSize: '14px'
  },
  mainContent: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start'
  },
  sidebarColumn: {
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    flexShrink: 0
  },
  mapColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
  },
  cardTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#0f172a'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px'
  },
  empPhoto: {
    width: '48px',
    height: '48px',
    borderRadius: '24px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  empName: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: '#1e293b'
  },
  empId: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#64748b'
  },
  grid2Col: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#475569'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  statBox: {
    backgroundColor: '#f8fafc',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #f1f5f9'
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '4px'
  },
  statValue: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0f172a'
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  alertItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderLeftWidth: '4px',
    borderRadius: '8px'
  },
  alertIcon: {
    marginTop: '2px'
  },
  alertTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1e293b'
  },
  alertMsg: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px'
  },
  mapWrapper: {
    height: '500px',
    width: '100%',
    borderRadius: '16px',
    overflow: 'hidden',
    position: 'relative',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
  },
  replayControls: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ffffff',
    borderRadius: '30px',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    zIndex: 1000 // Leaflet map container is z-index 400
  },
  replayBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#1d4ed8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '16px',
    transition: 'background-color 0.2s',
    ':hover': { backgroundColor: '#eff6ff' }
  },
  replayProgress: {
    width: '150px',
    height: '6px',
    backgroundColor: '#e2e8f0',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  replayTime: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    minWidth: '65px',
    textAlign: 'right'
  },
  bottomSection: {
    display: 'flex',
    gap: '24px'
  },
  timeline: {
    maxHeight: '350px',
    overflowY: 'auto',
    paddingRight: '10px'
  },
  timelineItem: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px'
  },
  timelineTime: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    width: '65px',
    paddingTop: '2px'
  },
  timelineDotLine: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  timelineDot: {
    width: '12px',
    height: '12px',
    borderRadius: '6px',
    zIndex: 2
  },
  timelineLine: {
    width: '2px',
    flex: 1,
    backgroundColor: '#e2e8f0',
    margin: '4px 0'
  },
  timelineContent: {
    flex: 1,
    paddingBottom: '16px'
  },
  timelineTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1e293b'
  },
  timelineDesc: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  thRow: {
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0'
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    fontWeight: 600,
    color: '#64748b'
  },
  tdRow: {
    borderBottom: '1px solid #f1f5f9'
  },
  td: {
    padding: '12px',
    color: '#334155'
  },
  popupContent: {
    fontSize: '13px'
  },
  popupRow: {
    marginTop: '4px',
    '& span': { fontWeight: 600, color: '#64748b' }
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px dashed #cbd5e1'
  }
};

export default GPSRouteTracking;
