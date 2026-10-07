import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Filter, Calendar, RefreshCw, User, Shield, Crosshair,
  Clock, CheckCircle2, ChevronRight, Layers, Eye, Navigation,
  AlertCircle, Radio
} from 'lucide-react';
import apiClient from '../../utils/apiClient';

// Custom Map Icons
const createMarkerIcon = (role, isSelected = false) => {
  const isAgent = role?.toLowerCase() === 'agent';
  const primaryColor = isAgent ? '#2563EB' : '#EA580C'; // 🔵 Agent / 🟠 Incharge
  const darkColor = isAgent ? '#1D4ED8' : '#C2410C';
  const haloColor = isAgent ? 'rgba(37, 99, 235, 0.35)' : 'rgba(234, 88, 12, 0.35)';

  const iconHtml = `
    <div style="position: relative; width: 36px; height: 44px; display: flex; align-items: center; justify-content: center;">
      ${isSelected ? `<div style="position: absolute; top: -6px; left: -6px; width: 48px; height: 48px; border-radius: 50%; background: ${haloColor}; animation: pulseRing 1.5s infinite;"></div>` : ''}
      <svg viewBox="0 0 36 44" width="36" height="44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 6px rgba(15, 23, 42, 0.4));">
        <path d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 44 18 44C18 44 36 31.5 36 18C36 8.06 27.94 0 18 0Z" fill="${darkColor}"/>
        <circle cx="18" cy="18" r="14" fill="${primaryColor}"/>
        ${isAgent 
          ? `<circle cx="18" cy="18" r="6" fill="#FFFFFF"/>`
          : `<polygon points="18,11 20.2,15.5 25.1,16.2 21.6,19.6 22.4,24.5 18,22.2 13.6,24.5 14.4,19.6 10.9,16.2 15.8,15.5" fill="#FFFFFF"/>`
        }
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'custom-submission-pin',
    html: iconHtml,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44]
  });
};

// Map controller to automatically fit bounds to visible markers
const MapBoundsController = ({ markers, selectedMarkerId, markerRefs }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (markers && markers.length > 0) {
      if (markers.length === 1) {
        const m = markers[0];
        map.flyTo([m.latitude, m.longitude], 15, { animate: true, duration: 0.8 });
      } else {
        const bounds = L.latLngBounds(markers.map(m => [m.latitude, m.longitude]));
        map.fitBounds(bounds, { padding: [55, 55], maxZoom: 15, animate: true });
      }
    } else {
      // Default to coastal Andhra aquaculture hub (Bhimavaram)
      map.setView([16.5449, 81.5212], 11, { animate: true });
    }
  }, [markers, map]);

  useEffect(() => {
    if (selectedMarkerId && markerRefs.current[selectedMarkerId]) {
      const markerInstance = markerRefs.current[selectedMarkerId];
      const target = markers.find(m => m.submissionId === selectedMarkerId);
      if (target) {
        map.flyTo([target.latitude, target.longitude], 16, { animate: true, duration: 1.0 });
        setTimeout(() => {
          markerInstance.openPopup();
        }, 1100);
      }
    }
  }, [selectedMarkerId, markerRefs, markers, map]);

  return null;
};

const SubmissionLocationMap = () => {
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedUserId, setSelectedUserId] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('today');
  const [customDateValue, setCustomDateValue] = useState(new Date().toISOString().split('T')[0]);

  const [submissions, setSubmissions] = useState([]);
  const [fieldStaff, setFieldStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);

  const markerRefs = useRef({});

  // 1. Fetch Field Staff (Agents & Incharges) from MySQL database
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await apiClient.get('/admin/field-staff');
        if (res?.data && Array.isArray(res.data)) {
          setFieldStaff(res.data);
        }
      } catch (err) {
        console.warn('[Staff fetch error]', err.message);
        // Fallback default staff list
        setFieldStaff([
          { id: 'agent001', name: 'Ramesh', role: 'Agent' },
          { id: 'agent002', name: 'Suresh', role: 'Agent' },
          { id: 'agent003', name: 'Mahesh', role: 'Agent' },
          { id: 'INC001', name: 'Ravi Kumar', role: 'Incharge' },
          { id: 'INC002', name: 'Rajesh Varma', role: 'Incharge' }
        ]);
      }
    };
    fetchStaff();
  }, []);

  // 2. Fetch Submission Locations with Active Filters
  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (selectedRole && selectedRole !== 'ALL') {
        queryParams.set('role', selectedRole);
      }
      if (selectedUserId && selectedUserId !== 'ALL') {
        queryParams.set('userId', selectedUserId);
      }
      
      const effectiveDate = selectedDate === 'custom' ? customDateValue : selectedDate;
      if (effectiveDate && effectiveDate !== 'ALL') {
        queryParams.set('date', effectiveDate);
      }

      const res = await apiClient.get(`/admin/submission-locations?${queryParams.toString()}`);
      if (res?.data && Array.isArray(res.data)) {
        // Filter out records without valid coordinates
        const validCoords = res.data.filter(
          item => item.latitude != null && item.longitude != null &&
                  !isNaN(item.latitude) && !isNaN(item.longitude)
        );
        setSubmissions(validCoords);
      } else {
        setSubmissions([]);
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('[Error loading submission locations]', err);
      setError('Failed to load submission locations from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [selectedRole, selectedUserId, selectedDate, customDateValue]);

  // Handle Role Filter Change
  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setSelectedRole(newRole);
    // If current selected user does not match the new role, reset to ALL
    if (newRole !== 'ALL') {
      const currentStaff = fieldStaff.find(s => s.id === selectedUserId);
      if (currentStaff && currentStaff.role.toLowerCase() !== newRole.toLowerCase()) {
        setSelectedUserId('ALL');
      }
    }
  };

  // Filter staff list according to selected role
  const filteredStaffOptions = useMemo(() => {
    if (selectedRole === 'ALL') return fieldStaff;
    return fieldStaff.filter(s => s.role.toLowerCase() === selectedRole.toLowerCase());
  }, [fieldStaff, selectedRole]);

  // Center coordinate calculation
  const defaultCenter = useMemo(() => {
    if (submissions.length > 0) {
      return [submissions[0].latitude, submissions[0].longitude];
    }
    return [16.5449, 81.5212]; // Bhimavaram cluster center
  }, [submissions]);

  // Summary counts
  const agentCount = useMemo(() => submissions.filter(s => s.role?.toLowerCase() === 'agent').length, [submissions]);
  const inchargeCount = useMemo(() => submissions.filter(s => s.role?.toLowerCase() === 'incharge').length, [submissions]);

  // Focus marker on clicking table row or "View" button
  const handleFocusSubmission = (sub) => {
    setSelectedMarkerId(sub.submissionId);
  };

  // Helper date formatter
  const formatDateDisplay = (dateStr, fallbackTime) => {
    if (!dateStr) return fallbackTime || 'Today';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div style={styles.container}>
      {/* Header Bar */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIconWrapper}>
            <MapPin size={24} color="#0284C7" />
          </div>
          <div>
            <div style={styles.headerTitleRow}>
              <h1 style={styles.headerTitle}>Submission Locations</h1>
              <span style={styles.liveBadge}>
                <span style={styles.pulseDot} />
                REAL-TIME GPS
              </span>
            </div>
            <p style={styles.headerSubtitle}>
              Live geographic visualization of field test & record submissions across aquaculture clusters
            </p>
          </div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.statPills}>
            <div style={styles.statPill}>
              <span style={styles.statDotAgent} />
              <span style={styles.statLabel}>Agent:</span>
              <strong style={styles.statValue}>{agentCount}</strong>
            </div>
            <div style={styles.statPill}>
              <span style={styles.statDotIncharge} />
              <span style={styles.statLabel}>Incharge:</span>
              <strong style={styles.statValue}>{inchargeCount}</strong>
            </div>
            <div style={{ ...styles.statPill, background: '#F0FDF4', borderColor: '#BBF7D0' }}>
              <span style={styles.statLabel}>Total:</span>
              <strong style={{ ...styles.statValue, color: '#16A34A' }}>{submissions.length}</strong>
            </div>
          </div>

          <button
            onClick={fetchLocations}
            style={styles.refreshBtn}
            title="Refresh submission locations from database"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div style={styles.filterCard}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            <Shield size={14} style={{ marginRight: 6, color: '#64748B' }} />
            Role
          </label>
          <select
            value={selectedRole}
            onChange={handleRoleChange}
            style={styles.select}
          >
            <option value="ALL">All Roles</option>
            <option value="Agent">Agent (🔵)</option>
            <option value="Incharge">Incharge (🟠)</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            <User size={14} style={{ marginRight: 6, color: '#64748B' }} />
            User
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            style={styles.select}
          >
            <option value="ALL">Select Agent / Incharge (All)</option>
            {filteredStaffOptions.map(staff => (
              <option key={staff.id} value={staff.id}>
                {staff.name} ({staff.role})
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            <Calendar size={14} style={{ marginRight: 6, color: '#64748B' }} />
            Date
          </label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={styles.select}
          >
            <option value="today">Today (07 Oct 2026)</option>
            <option value="2026-10-06">Yesterday (06 Oct 2026)</option>
            <option value="ALL">All Recorded Dates</option>
            <option value="custom">Custom Date Pick...</option>
          </select>
        </div>

        {selectedDate === 'custom' && (
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Select Date</label>
            <input
              type="date"
              value={customDateValue}
              onChange={(e) => setCustomDateValue(e.target.value)}
              style={styles.dateInput}
            />
          </div>
        )}

        <div style={styles.filterStatusWrapper}>
          <span style={styles.filterStatusText}>
            Showing <strong>{submissions.length}</strong> location point{submissions.length === 1 ? '' : 's'}
          </span>
          <span style={styles.filterRefreshedText}>
            Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div style={styles.mapContainerCard}>
        <div style={styles.mapLegend}>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: '#2563EB' }} />
            <span>Agent Submission</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: '#EA580C' }} />
            <span>Incharge Submission</span>
          </div>
          <div style={styles.legendDivider} />
          <div style={styles.legendHelp}>
            Click marker or "View" below to inspect GPS details
          </div>
        </div>

        <MapContainer
          center={defaultCenter}
          zoom={11}
          style={{ width: '100%', height: '520px', borderRadius: '12px' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBoundsController
            markers={submissions}
            selectedMarkerId={selectedMarkerId}
            markerRefs={markerRefs}
          />

          {submissions.map((sub) => {
            const isAgent = sub.role?.toLowerCase() === 'agent';
            const isSelected = selectedMarkerId === sub.submissionId;
            const icon = createMarkerIcon(sub.role, isSelected);

            return (
              <Marker
                key={sub.submissionId}
                position={[sub.latitude, sub.longitude]}
                icon={icon}
                ref={(ref) => {
                  if (ref) markerRefs.current[sub.submissionId] = ref;
                }}
                eventHandlers={{
                  click: () => setSelectedMarkerId(sub.submissionId)
                }}
              >
                <Popup className="submission-gps-popup" minWidth={260} maxWidth={320}>
                  <div style={styles.popupCard}>
                    {/* Popup Header */}
                    <div style={{
                      ...styles.popupHeader,
                      borderLeftColor: isAgent ? '#2563EB' : '#EA580C'
                    }}>
                      <div>
                        <div style={styles.popupRoleBadgeRow}>
                          <span style={isAgent ? styles.badgeAgent : styles.badgeIncharge}>
                            {sub.role}
                          </span>
                          <span style={styles.popupSubId}>
                            {sub.submissionId}
                          </span>
                        </div>
                        <h4 style={styles.popupUserName}>{sub.userName}</h4>
                      </div>
                    </div>

                    {/* Popup Body Details */}
                    <div style={styles.popupBody}>
                      <div style={styles.popupField}>
                        <span style={styles.popupFieldLabel}>Submitted:</span>
                        <span style={styles.popupFieldValue}>
                          {formatDateDisplay(sub.date || sub.submittedAt, '07 Oct 2026')}&nbsp;•&nbsp;
                          <strong>{sub.submissionTime || 'Field Time'}</strong>
                        </span>
                      </div>

                      {sub.testType && (
                        <div style={styles.popupField}>
                          <span style={styles.popupFieldLabel}>Record Type:</span>
                          <span style={styles.popupFieldValue}>{sub.testType}</span>
                        </div>
                      )}

                      {sub.tankId && (
                        <div style={styles.popupField}>
                          <span style={styles.popupFieldLabel}>Tank / Farmer:</span>
                          <span style={styles.popupFieldValue}>
                            {sub.tankId} {sub.farmerId ? `(${sub.farmerId})` : ''}
                          </span>
                        </div>
                      )}

                      {sub.locality && (
                        <div style={styles.popupField}>
                          <span style={styles.popupFieldLabel}>Locality:</span>
                          <span style={styles.popupFieldValue}>📍 {sub.locality}</span>
                        </div>
                      )}

                      <div style={styles.popupGpsBox}>
                        <div style={styles.popupGpsRow}>
                          <span>Latitude:</span>
                          <code style={styles.popupCode}>{sub.latitude?.toFixed(6)}</code>
                        </div>
                        <div style={styles.popupGpsRow}>
                          <span>Longitude:</span>
                          <code style={styles.popupCode}>{sub.longitude?.toFixed(6)}</code>
                        </div>
                        <div style={styles.popupGpsRow}>
                          <span>Accuracy:</span>
                          <span style={styles.accuracyTag}>
                            {sub.accuracy ? `± ${Math.round(sub.accuracy)} meters` : 'High precision'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {submissions.length === 0 && !loading && (
          <div style={styles.emptyMapOverlay}>
            <AlertCircle size={32} color="#94A3B8" />
            <h4 style={styles.emptyTitle}>No Submissions Found</h4>
            <p style={styles.emptyDesc}>
              No verified GPS submissions match your current filter selection.
              Select another agent, incharge, or date range.
            </p>
          </div>
        )}
      </div>

      {/* Today's Submissions Table List */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeaderRow}>
          <div>
            <h3 style={styles.tableTitle}>
              {selectedDate === 'today' ? "Today's Submissions" : 'Submissions List'}
            </h3>
            <p style={styles.tableSubtitle}>
              Click "View" on any record to center the map on that submission location
            </p>
          </div>
          <span style={styles.tableCountBadge}>
            {submissions.length} Total Record{submissions.length === 1 ? '' : 's'}
          </span>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>User</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>Submission ID</th>
                <th style={styles.th}>GPS Coordinates</th>
                <th style={styles.th}>Accuracy</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Location</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={styles.noDataCell}>
                    No submission records available for the selected filters.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => {
                  const isAgent = sub.role?.toLowerCase() === 'agent';
                  const isSelected = selectedMarkerId === sub.submissionId;

                  return (
                    <tr
                      key={sub.submissionId}
                      style={{
                        ...styles.tr,
                        backgroundColor: isSelected ? '#F0F9FF' : 'transparent',
                        fontWeight: isSelected ? 600 : 400
                      }}
                      onClick={() => handleFocusSubmission(sub)}
                    >
                      <td style={styles.td}>
                        <div style={styles.userCell}>
                          <div style={{
                            ...styles.avatarSmall,
                            background: isAgent ? '#DBEAFE' : '#FFEDD5',
                            color: isAgent ? '#1E40AF' : '#C2410C'
                          }}>
                            {sub.userName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div style={styles.userNameText}>{sub.userName}</div>
                            <div style={styles.userIdSubText}>{sub.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={isAgent ? styles.badgeAgent : styles.badgeIncharge}>
                          {isAgent ? '🔵 Agent' : '🟠 Incharge'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.timeCell}>
                          <Clock size={13} style={{ marginRight: 5, color: '#64748B' }} />
                          <span>{sub.submissionTime || '09:00 AM'}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.subIdCell}>{sub.submissionId}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.coordsCell}>
                          <code>{sub.latitude?.toFixed(4)}°N, {sub.longitude?.toFixed(4)}°E</code>
                          {sub.locality && (
                            <span style={styles.localitySubtext}>📍 {sub.locality}</span>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.accuracyTag}>
                          ± {Math.round(sub.accuracy || 12)}m
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFocusSubmission(sub);
                          }}
                          style={{
                            ...styles.viewBtn,
                            ...(isSelected ? styles.viewBtnActive : {})
                          }}
                        >
                          <Eye size={13} style={{ marginRight: 4 }} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Clean, professional styling matching the RoyalMarines admin theme
const styles = {
  container: {
    padding: '24px 28px',
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    color: '#0F172A'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  headerIconWrapper: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    backgroundColor: '#E0F2FE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #BAE6FD'
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  headerTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.02em'
  },
  liveBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '12px',
    letterSpacing: '0.04em'
  },
  pulseDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#16A34A'
  },
  headerSubtitle: {
    fontSize: '13.5px',
    color: '#64748B',
    margin: '3px 0 0 0'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap'
  },
  statPills: {
    display: 'flex',
    gap: '8px'
  },
  statPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '20px',
    fontSize: '12.5px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
  },
  statDotAgent: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#2563EB'
  },
  statDotIncharge: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#EA580C'
  },
  statLabel: {
    color: '#64748B'
  },
  statValue: {
    color: '#0F172A',
    fontWeight: '700'
  },
  refreshBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '16px 20px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '180px'
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    display: 'flex',
    alignItems: 'center'
  },
  select: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '13.5px',
    color: '#1E293B',
    outline: 'none',
    cursor: 'pointer',
    fontWeight: '500'
  },
  dateInput: {
    padding: '7px 10px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: '13px',
    color: '#1E293B'
  },
  filterStatusWrapper: {
    marginLeft: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px'
  },
  filterStatusText: {
    fontSize: '13px',
    color: '#334155'
  },
  filterRefreshedText: {
    fontSize: '11.5px',
    color: '#94A3B8'
  },
  mapContainerCard: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '8px',
    marginBottom: '24px',
    boxShadow: '0 4px 12px rgba(15,23,42,0.06)'
  },
  mapLegend: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    backdropFilter: 'blur(8px)',
    borderRadius: '10px',
    padding: '10px 14px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#334155'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },
  legendDivider: {
    width: '1px',
    height: '14px',
    backgroundColor: '#CBD5E1'
  },
  legendHelp: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '400'
  },
  emptyMapOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '24px 32px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    maxWidth: '380px'
  },
  emptyTitle: {
    margin: '10px 0 6px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#334155'
  },
  emptyDesc: {
    margin: 0,
    fontSize: '13px',
    color: '#64748B',
    lineHeight: '1.4'
  },
  popupCard: {
    padding: '4px'
  },
  popupHeader: {
    paddingLeft: '8px',
    borderLeftWidth: '3px',
    borderLeftStyle: 'solid',
    marginBottom: '10px'
  },
  popupRoleBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px'
  },
  popupSubId: {
    fontSize: '11px',
    color: '#64748B',
    fontFamily: 'monospace'
  },
  popupUserName: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '700',
    color: '#0F172A'
  },
  popupBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '12.5px'
  },
  popupField: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    color: '#334155'
  },
  popupFieldLabel: {
    color: '#64748B',
    fontWeight: '500'
  },
  popupFieldValue: {
    fontWeight: '600',
    textAlign: 'right'
  },
  popupGpsBox: {
    marginTop: '6px',
    padding: '8px 10px',
    backgroundColor: '#F8FAFC',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  popupGpsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11.5px',
    color: '#475569'
  },
  popupCode: {
    backgroundColor: '#EEF2F6',
    padding: '1px 4px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#0F172A'
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '20px 24px',
    boxShadow: '0 2px 6px rgba(15,23,42,0.04)'
  },
  tableHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  tableTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: '700',
    color: '#0F172A'
  },
  tableSubtitle: {
    margin: '3px 0 0 0',
    fontSize: '13px',
    color: '#64748B'
  },
  tableCountBadge: {
    fontSize: '12px',
    fontWeight: '700',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    padding: '4px 10px',
    borderRadius: '12px'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13.5px'
  },
  thRow: {
    borderBottom: '1px solid #E2E8F0'
  },
  th: {
    padding: '10px 14px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.03em'
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  },
  td: {
    padding: '12px 14px',
    color: '#1E293B'
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  avatarSmall: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    flexShrink: 0
  },
  userNameText: {
    fontSize: '13.5px',
    fontWeight: '600',
    color: '#0F172A'
  },
  userIdSubText: {
    fontSize: '11px',
    color: '#64748B'
  },
  badgeAgent: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8'
  },
  badgeIncharge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: '#FFEDD5',
    color: '#C2410C'
  },
  timeCell: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: '#334155'
  },
  subIdCell: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#64748B',
    backgroundColor: '#F8FAFC',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #E2E8F0'
  },
  coordsCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  localitySubtext: {
    fontSize: '11.5px',
    color: '#64748B'
  },
  accuracyTag: {
    fontSize: '11.5px',
    fontWeight: '600',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  viewBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#0284C7',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  viewBtnActive: {
    backgroundColor: '#0284C7',
    color: '#FFFFFF',
    borderColor: '#0284C7'
  },
  noDataCell: {
    padding: '32px 14px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '13.5px'
  }
};

export default SubmissionLocationMap;
