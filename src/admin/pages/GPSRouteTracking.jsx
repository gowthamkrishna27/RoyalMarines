import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search, Calendar, Download, Play, Pause, Square, MapPin,
  Clock, Battery, Wifi, Activity, User, Briefcase, Navigation,
  AlertTriangle, Info, CheckCircle2, XCircle, Droplet, UserCircle, Map as MapIcon, ChevronRight
} from 'lucide-react';
import { getMockRouteData } from '../utils/mockRouteData';
import * as XLSX from 'xlsx';

// Custom Map Icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(15,23,42,0.35);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const icons = {
  LOGIN: createCustomIcon('#16A34A'),
  LOGOUT: createCustomIcon('#DC2626'),
  TANK_VISIT: createCustomIcon('#2563EB'),
  FARMER_VISIT: createCustomIcon('#F59E0B'),
  LONG_STOP: createCustomIcon('#EAB308'),
  MOVING: createCustomIcon('#94A3B8')
};

// Component to dynamically fit bounds of the map based on route
const RouteBounds = ({ route }) => {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 0) {
      const bounds = L.latLngBounds(route.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [route, map]);
  return null;
};

const GPSRouteTracking = () => {
  const [employeeType, setEmployeeType] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState('emp-1');
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

  const handleExportExcel = () => {
    if (!trackingData) return alert("No tracking data available to export.");
    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet
    const summaryData = [
      ['GPS Route Tracking Report'],
      [],
      ['Employee Name', trackingData.employeeInfo.name],
      ['Employee ID', trackingData.employeeInfo.id],
      ['Role', trackingData.employeeInfo.role],
      ['Date', date],
      ['Area', trackingData.employeeInfo.area],
      ['Total Distance', trackingData.employeeInfo.totalDistance],
      ['Working Hours', trackingData.employeeInfo.workingHours],
      ['Travel Time', trackingData.stats.travelTime],
      ['Idle Time', trackingData.stats.idleTime],
      ['Average Speed', trackingData.stats.avgSpeed],
      ['Tank Visits', trackingData.stats.tankVisits],
      ['Productivity Score', trackingData.employeeInfo.productivityScore]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // 2. Timeline Sheet
    const timelineData = trackingData.route.map(r => ({
      'Time': r.time,
      'Type': r.type,
      'Location': r.locationName,
      'Purpose': r.purpose,
      'Duration': r.duration,
      'Latitude': r.lat,
      'Longitude': r.lng
    }));
    const wsTimeline = XLSX.utils.json_to_sheet(timelineData);
    XLSX.utils.book_append_sheet(wb, wsTimeline, 'Route Timeline');

    // 3. Tank Visits Sheet
    const tanksData = trackingData.assignedTanks.map(t => ({
      'Tank Name': t.name,
      'Farmer': t.farmer,
      'Arrival Time': t.arrival,
      'Verified Status': t.verified ? 'Completed' : 'Missed'
    }));
    const wsTanks = XLSX.utils.json_to_sheet(tanksData);
    XLSX.utils.book_append_sheet(wb, wsTanks, 'Tank Visits');

    // Save
    XLSX.writeFile(wb, `GPS_Tracking_${trackingData.employeeInfo.id}_${date}.xlsx`);
  };

  const visibleRoute = getVisibleRoute();
  const polylinePositions = visibleRoute.map(p => [p.lat, p.lng]);

  return (
    <div style={styles.container}>
      {/* SECTION HEADER & FILTERS */}
      <div style={styles.sectionHeaderCard}>
        <div style={styles.headerTitleRow}>
          <div>
            <h2 style={styles.sectionTitle}>Agent Tracking &amp; Live Map</h2>
          </div>
          <div style={styles.actionButtons}>
            <button
              type="button"
              style={styles.exportBtn}
              onClick={handleExportExcel}
            >
              <Download size={15} />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={styles.filterBar}>
          <select
            style={styles.selectInput}
            value={employeeType}
            onChange={e => setEmployeeType(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="Agents">Agents</option>
            <option value="Incharges">Incharges</option>
          </select>

          <div style={styles.searchSelectBox}>
            <Search size={16} color="#64748B" />
            <select
              style={styles.selectInputBare}
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
            >
              <option value="">Select Employee...</option>
              {employeeList.map(e => (
                <option key={e.id} value={e.id}>
                  {e.status === 'Online' ? '🟢 ' : '⚪ '}{e.name} ({e.id}) - {e.type}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.datePickerContainer}>
            <Calendar size={16} color="#64748B" />
            <input
              type="date"
              style={styles.dateInput}
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <button
            type="button"
            style={styles.viewRouteBtn}
            disabled={!selectedEmployee}
            onClick={() => {
              if (selectedEmployee) {
                setTrackingData(getMockRouteData(date, selectedEmployee));
              }
            }}
          >
            <MapIcon size={15} />
            <span>View Route</span>
          </button>
        </div>
      </div>

      {trackingData ? (
        <div style={styles.mainGrid}>
          {/* LEFT COLUMN - Agent Summary, Daily Stats, Alerts */}
          <div style={styles.leftColumn}>
            {/* 1. Agent Summary Card */}
            <div style={styles.card}>
              <div style={styles.agentHeader}>
                <div style={styles.agentAvatar}>
                  <User size={20} color="#2563EB" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <h3 style={styles.agentName}>{trackingData.employeeInfo.name}</h3>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: trackingData.employeeInfo.status === 'Online' ? '#DCFCE7' : '#F1F5F9',
                      color: trackingData.employeeInfo.status === 'Online' ? '#16A34A' : '#64748B'
                    }}>
                      {trackingData.employeeInfo.status}
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.specsGrid}>
                <div style={styles.specItem}>
                  <MapPin size={14} color="#64748B" />
                  <span style={styles.specText}>{trackingData.employeeInfo.area}</span>
                </div>
                <div style={styles.specItem}>
                  <Clock size={14} color="#64748B" />
                  <span style={styles.specText}>{trackingData.employeeInfo.workingHours}</span>
                </div>
                <div style={styles.specItem}>
                  <Navigation size={14} color="#64748B" />
                  <span style={styles.specText}>{trackingData.employeeInfo.totalDistance}</span>
                </div>
                <div style={styles.specItem}>
                  <Battery size={14} color="#64748B" />
                  <span style={styles.specText}>{trackingData.employeeInfo.battery}</span>
                </div>
                <div style={styles.specItem}>
                  <Wifi size={14} color="#64748B" />
                  <span style={styles.specText}>{trackingData.employeeInfo.internet}</span>
                </div>
                <div style={styles.specItem}>
                  <Activity size={14} color="#2563EB" />
                  <span style={{ ...styles.specText, fontWeight: 700, color: '#2563EB' }}>
                    Score: {trackingData.employeeInfo.productivityScore}/100
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Daily Statistics Card */}
            <div style={styles.card}>
              <h4 style={styles.cardTitle}>Daily Statistics</h4>
              <div style={styles.statsGrid}>
                <div style={styles.statBox}>
                  <span style={styles.statLabel}>TRAVEL TIME</span>
                  <span style={styles.statValue}>{trackingData.stats.travelTime}</span>
                </div>
                <div style={styles.statBox}>
                  <span style={styles.statLabel}>IDLE TIME</span>
                  <span style={styles.statValue}>{trackingData.stats.idleTime}</span>
                </div>
                <div style={styles.statBox}>
                  <span style={styles.statLabel}>AVG SPEED</span>
                  <span style={styles.statValue}>{trackingData.stats.avgSpeed}</span>
                </div>
                <div style={styles.statBox}>
                  <span style={styles.statLabel}>TANK VISITS</span>
                  <span style={styles.statValue}>{trackingData.stats.tankVisits}</span>
                </div>
              </div>
            </div>

            {/* 3. Smart Alerts Card */}
            {trackingData.alerts && trackingData.alerts.length > 0 && (
              <div style={styles.card}>
                <h4 style={styles.cardTitle}>Smart Alerts</h4>
                <div style={styles.alertsList}>
                  {trackingData.alerts.map(alert => (
                    <div
                      key={alert.id}
                      style={{
                        ...styles.alertItem,
                        borderLeftColor: alert.type === 'WARNING' ? '#DC2626' : '#F59E0B'
                      }}
                    >
                      <div style={{ flexShrink: 0, marginTop: '2px' }}>
                        {alert.type === 'WARNING' ? (
                          <AlertTriangle size={16} color="#DC2626" />
                        ) : (
                          <Info size={16} color="#F59E0B" />
                        )}
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

          {/* RIGHT COLUMN - Live Map & Replay + Timeline & Tank Verification */}
          <div style={styles.rightColumn}>
            {/* Live Map Card */}
            <div style={styles.mapCard}>
              <div style={styles.mapContainer}>
                <MapContainer
                  center={[visibleRoute[0]?.lat || 16.5449, visibleRoute[0]?.lng || 81.5212]}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <RouteBounds route={trackingData.route} />

                  {polylinePositions.length > 1 && (
                    <Polyline positions={polylinePositions} color="#2563EB" weight={4} opacity={0.85} />
                  )}

                  {visibleRoute.map(point => (
                    <Marker
                      key={point.id}
                      position={[point.lat, point.lng]}
                      icon={icons[point.type] || icons.MOVING}
                    >
                      <Popup>
                        <div style={styles.popupContent}>
                          <div style={styles.popupTitle}>{point.locationName}</div>
                          <div style={styles.popupRow}><span>Time:</span> <strong>{point.time}</strong></div>
                          <div style={styles.popupRow}><span>Duration:</span> {point.duration}</div>
                          <div style={styles.popupRow}><span>Purpose:</span> {point.purpose}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {/* Playback Control Bar */}
              <div style={styles.playbackBar}>
                <div style={styles.playbackLeft}>
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    style={styles.playBtn}
                    aria-label={isReplaying ? "Pause replay" : "Play route replay"}
                  >
                    {isReplaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>

                  <button
                    type="button"
                    onClick={handleStop}
                    style={styles.stopBtn}
                    aria-label="Stop replay"
                  >
                    <Square size={14} />
                  </button>
                </div>

                <div style={styles.progressBarWrapper}>
                  <div
                    style={{
                      ...styles.progressBarFill,
                      width: `${((replayIndex + 1) / trackingData.route.length) * 100}%`
                    }}
                  />
                </div>

                <div style={styles.playbackTimestamp}>
                  <Clock size={13} color="#64748B" />
                  <span>{visibleRoute[visibleRoute.length - 1]?.time || '09:00 AM'}</span>
                </div>
              </div>
            </div>

            {/* Bottom Row - Route Timeline & Tank Visit Verification */}
            <div style={styles.bottomSplit}>
              {/* Route Timeline */}
              <div style={styles.card}>
                <div style={styles.cardHeaderFlex}>
                  <h4 style={styles.cardTitle}>Route Timeline</h4>
                  <span style={styles.timelineCountBadge}>{trackingData.route.length} Checkpoints</span>
                </div>

                <div style={styles.timelineList}>
                  {trackingData.route.map((item, idx) => (
                    <div key={item.id} style={styles.timelineItem}>
                      <div style={styles.timelineTimeCol}>
                        {item.time}
                      </div>

                      <div style={styles.timelineNodeCol}>
                        <div
                          style={{
                            ...styles.timelineNode,
                            backgroundColor: item.type === 'LOGIN' ? '#16A34A' : item.type === 'LOGOUT' ? '#DC2626' : '#2563EB'
                          }}
                        />
                        {idx !== trackingData.route.length - 1 && (
                          <div style={styles.timelineConnector} />
                        )}
                      </div>

                      <div style={styles.timelineContentCol}>
                        <div style={styles.timelineTitle}>{item.locationName}</div>
                        <div style={styles.timelineSubtitle}>
                          {item.purpose} {item.duration ? `• ${item.duration}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tank Visit Verification */}
              <div style={styles.card}>
                <div style={styles.cardHeaderFlex}>
                  <h4 style={styles.cardTitle}>Tank Verification</h4>
                  <span style={styles.timelineCountBadge}>{trackingData.assignedTanks.length} Tanks</span>
                </div>

                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeaderRow}>
                        <th style={styles.th}>Tank</th>
                        <th style={styles.th}>Farmer</th>
                        <th style={styles.th}>Arrival</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trackingData.assignedTanks.map((t, idx) => (
                        <tr key={idx} style={styles.tableRow}>
                          <td style={styles.tdBold}>{t.name}</td>
                          <td style={styles.td}>{t.farmer}</td>
                          <td style={styles.td}>{t.arrival}</td>
                          <td style={styles.td}>
                            {t.verified ? (
                              <span style={styles.verifiedChip}>
                                <CheckCircle2 size={13} />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span style={styles.missedChip}>
                                <XCircle size={13} />
                                <span>Missed</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIconBox}>
            <Navigation size={32} color="#64748B" />
          </div>
          <h3 style={styles.emptyTitle}>Select an employee to view tracking data</h3>
          <p style={styles.emptyDesc}>Choose a field agent or incharge and date to inspect route history and pond visits.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    fontFamily: 'Inter, system-ui, sans-serif'
  },

  sectionHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '20px 24px',
    boxShadow: '0 4px 18px rgba(15, 23, 42, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },

  headerTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  },

  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.01em'
  },

  sectionSubtitle: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748B',
    margin: '3px 0 0 0'
  },

  actionButtons: {
    display: 'flex',
    gap: '10px'
  },

  exportBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    color: '#0F172A',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
    transition: 'all 0.15s ease'
  },

  filterBar: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },

  selectInput: {
    padding: '0 12px',
    height: '42px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    outline: 'none',
    fontSize: '13px',
    fontWeight: 500,
    color: '#0F172A',
    backgroundColor: '#F8FAFC'
  },

  searchSelectBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '0 12px',
    flex: '1 1 220px',
    height: '42px',
    backgroundColor: '#F8FAFC'
  },

  selectInputBare: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '13px',
    fontWeight: 500,
    color: '#0F172A',
    backgroundColor: 'transparent'
  },

  datePickerContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '0 12px',
    height: '42px',
    backgroundColor: '#F8FAFC'
  },

  dateInput: {
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    color: '#0F172A',
    backgroundColor: 'transparent'
  },

  viewRouteBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0 18px',
    height: '42px',
    backgroundColor: '#2563EB',
    border: 'none',
    borderRadius: '10px',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
    transition: 'all 0.15s ease'
  },

  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '20px',
    alignItems: 'flex-start'
  },

  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },

  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '20px',
    boxShadow: '0 4px 18px rgba(15, 23, 42, 0.06)'
  },

  cardHeaderFlex: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },

  cardTitle: {
    margin: '0 0 14px 0',
    fontSize: '15px',
    fontWeight: 600,
    color: '#0F172A'
  },

  agentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '14px',
    borderBottom: '1px solid #F1F5F9'
  },

  agentAvatar: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },

  agentName: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 700,
    color: '#0F172A'
  },

  agentSub: {
    margin: '2px 0 0 0',
    fontSize: '12px',
    color: '#64748B'
  },

  statusBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '6px'
  },

  specsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },

  specItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12.5px',
    color: '#334155'
  },

  specText: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },

  statBox: {
    backgroundColor: '#F8FAFC',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },

  statLabel: {
    fontSize: '10.5px',
    fontWeight: 600,
    color: '#64748B',
    letterSpacing: '0.4px'
  },

  statValue: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#0F172A'
  },

  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },

  alertItem: {
    display: 'flex',
    gap: '10px',
    padding: '10px 12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    borderLeftWidth: '3px'
  },

  alertTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0F172A'
  },

  alertMsg: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px'
  },

  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    boxShadow: '0 4px 18px rgba(15, 23, 42, 0.06)'
  },

  mapContainer: {
    height: '420px',
    width: '100%'
  },

  playbackBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 20px',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E2E8F0'
  },

  playbackLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  playBtn: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },

  stopBtn: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },

  progressBarWrapper: {
    flex: 1,
    height: '6px',
    backgroundColor: '#F1F5F9',
    borderRadius: '999px',
    overflow: 'hidden'
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    transition: 'width 0.2s ease'
  },

  playbackTimestamp: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#0F172A',
    flexShrink: 0
  },

  bottomSplit: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },

  timelineCountBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    padding: '2px 8px',
    borderRadius: '6px'
  },

  timelineList: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '320px',
    overflowY: 'auto'
  },

  timelineItem: {
    display: 'flex',
    gap: '12px',
    position: 'relative'
  },

  timelineTimeCol: {
    width: '70px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    paddingTop: '2px',
    flexShrink: 0
  },

  timelineNodeCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '16px',
    flexShrink: 0
  },

  timelineNode: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    marginTop: '6px',
    zIndex: 1
  },

  timelineConnector: {
    width: '2px',
    flex: 1,
    backgroundColor: '#E2E8F0',
    margin: '4px 0'
  },

  timelineContentCol: {
    flex: 1,
    paddingBottom: '16px'
  },

  timelineTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0F172A'
  },

  timelineSubtitle: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px'
  },

  tableContainer: {
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    overflow: 'hidden'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },

  tableHeaderRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0'
  },

  th: {
    padding: '10px 14px',
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.4px'
  },

  tableRow: {
    borderBottom: '1px solid #F1F5F9',
    transition: 'background-color 0.15s ease'
  },

  td: {
    padding: '12px 14px',
    fontSize: '12.5px',
    color: '#64748B'
  },

  tdBold: {
    padding: '12px 14px',
    fontSize: '12.5px',
    fontWeight: 600,
    color: '#0F172A'
  },

  verifiedChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    padding: '2px 8px',
    borderRadius: '6px'
  },

  missedChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    padding: '2px 8px',
    borderRadius: '6px'
  },

  popupContent: {
    padding: '4px 6px',
    fontFamily: 'Inter, system-ui, sans-serif'
  },

  popupTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A',
    marginBottom: '4px'
  },

  popupRow: {
    fontSize: '12px',
    color: '#475569',
    marginTop: '2px'
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '48px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 4px 18px rgba(15, 23, 42, 0.06)'
  },

  emptyIconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px'
  },

  emptyTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 6px 0'
  },

  emptyDesc: {
    fontSize: '13px',
    color: '#64748B',
    margin: 0,
    maxWidth: '380px'
  }
};

export default GPSRouteTracking;
