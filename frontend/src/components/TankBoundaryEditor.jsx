import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { 
  X, MapPin, Navigation, Undo2, RotateCcw, Check, CheckCircle2, 
  AlertCircle, ShieldCheck, Play, Pause, Square, Layers, Crosshair, 
  HelpCircle, Eye, Info
} from 'lucide-react';

// Spherical geodesic polygon area calculation
// 1 Acre = 4046.8564224 m²
export const calculatePolygonArea = (latLngs) => {
  if (!latLngs || latLngs.length < 3) return { sqMeters: 0, acres: 0 };
  const R = 6378137; // Earth's mean radius in meters
  let area = 0;
  const n = latLngs.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const p1 = latLngs[i];
    const p2 = latLngs[j];
    const lat1 = (p1[0] * Math.PI) / 180;
    const lat2 = (p2[0] * Math.PI) / 180;
    const lng1 = (p1[1] * Math.PI) / 180;
    const lng2 = (p2[1] * Math.PI) / 180;
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs((area * R * R) / 2.0);
  const acres = area / 4046.8564224;
  return {
    sqMeters: Math.round(area),
    acres: Number(acres.toFixed(4)),
  };
};

// Haversine distance in meters
export const getDistanceMeters = (p1, p2) => {
  const R = 6378137;
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLng = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1[0] * Math.PI) / 180) *
      Math.cos((p2[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Convert stored GeoJSON Polygon to Leaflet [lat, lng] array
export const geojsonToLeafletPoints = (geojson) => {
  if (!geojson || geojson.type !== 'Polygon' || !Array.isArray(geojson.coordinates)) {
    return [];
  }
  const ring = geojson.coordinates[0] || [];
  if (ring.length === 0) return [];
  // GeoJSON uses [lng, lat]. Last coordinate usually repeats the first.
  const isClosed = ring.length > 1 && 
    ring[0][0] === ring[ring.length - 1][0] && 
    ring[0][1] === ring[ring.length - 1][1];
  const uniqueRing = isClosed ? ring.slice(0, -1) : ring;
  return uniqueRing.map(pt => [Number(pt[1]), Number(pt[0])]);
};

// Convert Leaflet [lat, lng] array to canonical GeoJSON Polygon
export const leafletPointsToGeoJSON = (latLngs, pointsMetadata = null) => {
  if (!latLngs || latLngs.length < 3) return null;
  // GeoJSON standard: [longitude, latitude], closed ring (first coordinate repeated at end)
  const ring = latLngs.map(pt => [Number(pt[1]), Number(pt[0])]);
  ring.push([Number(latLngs[0][1]), Number(latLngs[0][0])]);

  return {
    type: 'Polygon',
    coordinates: [ring],
    ...(pointsMetadata && pointsMetadata.length > 0 ? { points: pointsMetadata } : {})
  };
};

const TankBoundaryEditor = ({
  isOpen,
  onClose,
  onSaveBoundary,
  initialBoundary = null,
  tankName = 'Tank',
  enteredAcres = '',
  initialLocation = null,
}) => {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'gps'
  const [mapType, setMapType] = useState('satellite'); // 'satellite' | 'roadmap'
  const [isReviewMode, setIsReviewMode] = useState(false);

  // Manual Drawing State
  const [manualPoints, setManualPoints] = useState([]);
  const [isPolygonClosed, setIsPolygonClosed] = useState(false);

  // GPS Walk State
  const [gpsPoints, setGpsPoints] = useState([]);
  const [gpsRawMeta, setGpsRawMeta] = useState([]);
  const [isWalking, setIsWalking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gpsCurrentPos, setGpsCurrentPos] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [walkDurationSec, setWalkDurationSec] = useState(0);
  const [totalWalkDistance, setTotalWalkDistance] = useState(0);
  const [gpsError, setGpsError] = useState(null);

  // Map DOM refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const drawLayerRef = useRef(null);
  const watchIdRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Default coordinate center (Bhimavaram region by default)
  const defaultCenter = [
    initialLocation?.latitude || 16.5412,
    initialLocation?.longitude || 81.5234
  ];

  // Initialize from initialBoundary if provided
  useEffect(() => {
    if (initialBoundary && initialBoundary.coordinates) {
      const existingPoints = geojsonToLeafletPoints(initialBoundary);
      if (existingPoints.length >= 3) {
        setManualPoints(existingPoints);
        setIsPolygonClosed(true);
        if (initialBoundary.boundaryMethod === 'gps_walk') {
          setActiveTab('gps');
          setGpsPoints(existingPoints);
          if (initialBoundary.points) setGpsRawMeta(initialBoundary.points);
        }
      }
    }
  }, [initialBoundary, isOpen]);

  // Clean up GPS tracking & timers on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Timer for GPS walk
  useEffect(() => {
    if (isWalking && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setWalkDurationSec(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isWalking, isPaused]);

  // Map initialization
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 17,
        zoomControl: false,
        attributionControl: false,
      });

      // Layer group for our custom drawings
      const drawGroup = L.layerGroup().addTo(map);
      drawLayerRef.current = drawGroup;

      mapInstanceRef.current = map;
      updateTileLayer();

      // Click handler for Manual Drawing
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        handleMapClick(lat, lng);
      });
    }

    // Trigger invalidateSize to fit modal animation
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
      centerOnExistingData();
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen, activeTab]);

  // Toggle Tile Layer (Google Satellite vs Street)
  const updateTileLayer = () => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const satelliteUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
    const streetUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const tileUrl = mapType === 'satellite' ? satelliteUrl : streetUrl;

    const newLayer = L.tileLayer(tileUrl, { maxZoom: 21 });
    newLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  };

  useEffect(() => {
    updateTileLayer();
  }, [mapType]);

  // Fit bounds helper
  const centerOnExistingData = () => {
    if (!mapInstanceRef.current) return;
    const currentPoints = activeTab === 'manual' ? manualPoints : gpsPoints;
    if (currentPoints.length > 0) {
      const bounds = L.latLngBounds(currentPoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 18.5 });
    } else if (initialLocation?.latitude && initialLocation?.longitude) {
      mapInstanceRef.current.setView([initialLocation.latitude, initialLocation.longitude], 17.5);
    }
  };

  // Re-render markers and polygon lines on map whenever points or state change
  useEffect(() => {
    if (!mapInstanceRef.current || !drawLayerRef.current) return;
    drawLayerRef.current.clearLayers();

    const points = activeTab === 'manual' ? manualPoints : gpsPoints;
    const closed = activeTab === 'manual' ? isPolygonClosed : isReviewMode;

    if (points.length === 0 && !gpsCurrentPos) return;

    // 1. Draw connecting polyline or closed polygon
    if (points.length >= 2) {
      if (closed && points.length >= 3) {
        L.polygon(points, {
          color: '#2563EB',
          weight: 3,
          fillColor: '#3B82F6',
          fillOpacity: 0.28,
          dashArray: null,
        }).addTo(drawLayerRef.current);
      } else {
        L.polyline(points, {
          color: activeTab === 'manual' ? '#F59E0B' : '#10B981',
          weight: 3,
          dashArray: activeTab === 'manual' ? '6, 6' : null,
        }).addTo(drawLayerRef.current);
      }
    }

    // 2. Draw vertex markers
    points.forEach((pt, idx) => {
      const isStart = idx === 0;
      const markerColor = isStart ? '#10B981' : (activeTab === 'manual' ? '#2563EB' : '#059669');
      
      const customIcon = L.divIcon({
        className: 'custom-tank-vertex',
        html: `
          <div style="
            background: ${markerColor};
            color: #FFFFFF;
            width: ${isStart ? '26px' : '22px'};
            height: ${isStart ? '26px' : '22px'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            border: 2px solid #FFFFFF;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            cursor: pointer;
          ">
            ${isStart ? '★' : idx + 1}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker(pt, {
        icon: customIcon,
        draggable: activeTab === 'manual' && !isReviewMode,
      });

      if (activeTab === 'manual' && !isReviewMode) {
        marker.on('dragend', (e) => {
          const newPos = e.target.getLatLng();
          setManualPoints(prev => {
            const updated = [...prev];
            updated[idx] = [newPos.lat, newPos.lng];
            return updated;
          });
        });

        // Clicking start point closes polygon if >= 3 points
        if (isStart && points.length >= 3 && !isPolygonClosed) {
          marker.on('click', () => {
            setIsPolygonClosed(true);
          });
        }
      }

      marker.addTo(drawLayerRef.current);
    });

    // 3. For GPS Walk: Draw current position marker with pulsing accuracy circle
    if (activeTab === 'gps' && gpsCurrentPos) {
      if (gpsAccuracy) {
        L.circle(gpsCurrentPos, {
          radius: gpsAccuracy,
          color: '#10B981',
          fillColor: '#10B981',
          fillOpacity: 0.15,
          weight: 1,
        }).addTo(drawLayerRef.current);
      }

      const pulseIcon = L.divIcon({
        className: 'custom-pulse-marker',
        html: `
          <div style="position: relative; width: 20px; height: 20px;">
            <div style="
              position: absolute; width: 100%; height: 100%;
              background: #10B981; border-radius: 50%;
              opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              position: absolute; top: 3px; left: 3px; width: 14px; height: 14px;
              background: #059669; border-radius: 50%; border: 2px solid #FFFFFF;
              box-shadow: 0 0 8px rgba(16,185,129,0.8);
            "></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker(gpsCurrentPos, { icon: pulseIcon }).addTo(drawLayerRef.current);
    }
  }, [manualPoints, isPolygonClosed, gpsPoints, gpsCurrentPos, gpsAccuracy, activeTab, isReviewMode]);

  // Click handler for Manual Drawing
  const handleMapClick = (lat, lng) => {
    if (activeTab !== 'manual' || isReviewMode) return;
    if (isPolygonClosed) return; // Must click edit or reset to add more

    setManualPoints(prev => [...prev, [lat, lng]]);
  };

  const handleUndoManual = () => {
    if (isPolygonClosed) {
      setIsPolygonClosed(false);
      return;
    }
    setManualPoints(prev => prev.slice(0, -1));
  };

  const handleResetManual = () => {
    setManualPoints([]);
    setIsPolygonClosed(false);
    setIsReviewMode(false);
  };

  const handleCloseManual = () => {
    if (manualPoints.length < 3) {
      alert('A boundary polygon requires at least 3 points.');
      return;
    }
    setIsPolygonClosed(true);
  };

  // --- GPS Walk Logic ---
  const handleStartWalk = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsError(null);
    setIsWalking(true);
    setIsPaused(false);
    setGpsPoints([]);
    setGpsRawMeta([]);
    setWalkDurationSec(0);
    setTotalWalkDistance(0);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const currentCoord = [latitude, longitude];
        setGpsCurrentPos(currentCoord);
        setGpsAccuracy(Math.round(accuracy));

        // Center map on user location if first point
        if (mapInstanceRef.current && (!gpsPoints || gpsPoints.length === 0)) {
          mapInstanceRef.current.setView(currentCoord, 18.5);
        }

        // Noise filter: accuracy must be within 20m
        if (accuracy > 20) {
          console.warn(`GPS point skipped due to high inaccuracy (±${accuracy}m)`);
          return;
        }

        // Check if movement from last point >= 1.5m to avoid jitter
        setGpsPoints(prev => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const dist = getDistanceMeters(last, currentCoord);
            if (dist < 1.5) return prev; // minor jitter
            setTotalWalkDistance(d => Math.round((d + dist) * 10) / 10);
          }
          return [...prev, currentCoord];
        });

        setGpsRawMeta(prev => [
          ...prev,
          {
            lat: latitude,
            lng: longitude,
            accuracy: Math.round(accuracy),
            timestamp: pos.timestamp || Date.now(),
          }
        ]);
      },
      (err) => {
        console.error('GPS Walk error:', err);
        setGpsError(err.message || 'Unable to retrieve high-accuracy GPS position.');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000,
      }
    );
  };

  const handlePauseResumeWalk = () => {
    if (isPaused) {
      // Resume
      setIsPaused(false);
    } else {
      // Pause
      setIsPaused(true);
    }
  };

  const handleFinishGpsWalk = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation?.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWalking(false);
    setIsPaused(false);

    if (gpsPoints.length < 3) {
      alert('GPS walk recorded fewer than 3 boundary points. Please walk around the perimeter of the tank.');
      return;
    }

    setIsReviewMode(true);
  };

  const handleResetGps = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation?.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWalking(false);
    setIsPaused(false);
    setGpsPoints([]);
    setGpsRawMeta([]);
    setWalkDurationSec(0);
    setTotalWalkDistance(0);
    setIsReviewMode(false);
  };

  // Recenter on device GPS right now
  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        mapInstanceRef.current?.flyTo(coords, 18, { animate: true });
      },
      () => {
        alert('Could not determine your current location.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Calculations
  const activePoints = activeTab === 'manual' ? manualPoints : gpsPoints;
  const areaCalc = calculatePolygonArea(activePoints);

  // Distance back to start point (for GPS Walk closure)
  const distanceToStart = (activeTab === 'gps' && gpsPoints.length >= 2 && gpsCurrentPos)
    ? getDistanceMeters(gpsCurrentPos, gpsPoints[0])
    : null;

  // Format timer
  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Compute Quality rating
  const computeQualityRating = () => {
    if (activeTab === 'manual') return 'Verified Map Mark';
    if (!gpsRawMeta || gpsRawMeta.length === 0) return 'Standard GPS';
    const avgAcc = gpsRawMeta.reduce((sum, p) => sum + (p.accuracy || 10), 0) / gpsRawMeta.length;
    if (avgAcc <= 5) return `High Accuracy (±${avgAcc.toFixed(1)}m)`;
    if (avgAcc <= 10) return `Good Accuracy (±${avgAcc.toFixed(1)}m)`;
    return `Moderate (±${avgAcc.toFixed(1)}m)`;
  };

  // Final confirmation action
  const handleConfirmBoundary = () => {
    const points = activeTab === 'manual' ? manualPoints : gpsPoints;
    if (points.length < 3) {
      alert('Invalid boundary: at least 3 points required.');
      return;
    }

    const geojson = leafletPointsToGeoJSON(points, activeTab === 'gps' ? gpsRawMeta : null);
    const finalData = {
      boundaryCoordinates: geojson,
      boundaryMethod: activeTab === 'manual' ? 'manual_map' : 'gps_walk',
      boundaryAreaAcres: areaCalc.acres,
      boundaryQuality: computeQualityRating(),
      boundaryCapturedAt: new Date().toISOString(),
    };

    onSaveBoundary(finalData);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div style={styles.modalOverlay}>
      <div style={styles.modalCard}>
        {/* Modal Top Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.headerIconCircle}>
              <MapPin size={20} color="#2563EB" />
            </div>
            <div>
              <h2 style={styles.modalTitle}>Register Tank Boundary — {tankName}</h2>
              <p style={styles.modalSub}>
                Capture exact satellite coordinates for area verification and GPS mapping
              </p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose} type="button" title="Close">
            <X size={20} color="#64748B" />
          </button>
        </div>

        {/* Tab Switcher */}
        {!isReviewMode && (
          <div style={styles.tabContainer}>
            <button
              type="button"
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'manual' ? styles.tabBtnActive : {})
              }}
              onClick={() => {
                if (isWalking) {
                  if (!window.confirm('Switching tabs will discard current GPS walk. Proceed?')) return;
                  handleResetGps();
                }
                setActiveTab('manual');
              }}
            >
              <Layers size={17} />
              <span>Method 1: Manual Satellite Map</span>
            </button>
            <button
              type="button"
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'gps' ? styles.tabBtnActive : {})
              }}
              onClick={() => {
                setActiveTab('gps');
              }}
            >
              <Navigation size={17} />
              <span>Method 2: Walk-Around GPS Tracking</span>
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div style={styles.body}>
          {/* Map Section */}
          <div style={styles.mapWrapper}>
            <div ref={mapContainerRef} style={styles.mapContainer} />

            {/* Map Overlay Controls */}
            <div style={styles.mapFloatingControls}>
              <button
                type="button"
                style={styles.floatingBtn}
                onClick={() => setMapType(m => m === 'satellite' ? 'roadmap' : 'satellite')}
                title="Toggle Satellite / Street View"
              >
                <Layers size={16} />
                <span>{mapType === 'satellite' ? 'Street' : 'Satellite'}</span>
              </button>
              <button
                type="button"
                style={styles.floatingBtn}
                onClick={handleLocateMe}
                title="Center on My Device Location"
              >
                <Crosshair size={16} />
                <span>Locate Me</span>
              </button>
            </div>

            {/* Real-time Area Badge (Top Right of Map) */}
            {activePoints.length >= 3 && (
              <div style={styles.areaBadge}>
                <div style={styles.areaBadgeLabel}>Calculated Area</div>
                <div style={styles.areaBadgeValue}>
                  {areaCalc.acres} Acres
                  <span style={styles.areaBadgeSub}> ({areaCalc.sqMeters.toLocaleString()} m²)</span>
                </div>
              </div>
            )}
          </div>

          {/* Action & Info Panel Below / Beside Map */}
          <div style={styles.actionPanel}>
            {/* REVIEW & CONFIRMATION VIEW */}
            {isReviewMode || (activeTab === 'manual' && isPolygonClosed) ? (
              <div style={styles.reviewCard}>
                <div style={styles.reviewHeader}>
                  <CheckCircle2 size={24} color="#16A34A" />
                  <div>
                    <h3 style={styles.reviewTitle}>Boundary Ready for Confirmation</h3>
                    <p style={styles.reviewSub}>Review the recorded polygon parameters before saving.</p>
                  </div>
                </div>

                <div style={styles.specsGrid}>
                  <div style={styles.specItem}>
                    <span style={styles.specLabel}>Capture Method</span>
                    <span style={styles.specVal}>
                      {activeTab === 'manual' ? 'Manual Satellite Marking' : 'Walk-Around GPS Tracking'}
                    </span>
                  </div>
                  <div style={styles.specItem}>
                    <span style={styles.specLabel}>Calculated Polygon Area</span>
                    <span style={{ ...styles.specVal, color: '#16A34A', fontWeight: 700 }}>
                      {areaCalc.acres} Acres
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      ({areaCalc.sqMeters.toLocaleString()} sq. meters)
                    </span>
                  </div>
                  {enteredAcres && (
                    <div style={styles.specItem}>
                      <span style={styles.specLabel}>Entered Tank Size</span>
                      <span style={styles.specVal}>{enteredAcres}</span>
                      <span style={{ fontSize: '11px', color: '#0369A1' }}>
                        *Entered acreage will NOT be overwritten
                      </span>
                    </div>
                  )}
                  <div style={styles.specItem}>
                    <span style={styles.specLabel}>Boundary Vertices</span>
                    <span style={styles.specVal}>{activePoints.length} points</span>
                  </div>
                  <div style={styles.specItem}>
                    <span style={styles.specLabel}>Quality Assessment</span>
                    <span style={styles.specVal}>{computeQualityRating()}</span>
                  </div>
                  <div style={styles.specItem}>
                    <span style={styles.specLabel}>Capture Time</span>
                    <span style={styles.specVal}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div style={styles.reviewActions}>
                  <button
                    type="button"
                    style={styles.confirmBtn}
                    onClick={handleConfirmBoundary}
                  >
                    <Check size={18} />
                    <span>Confirm Tank Boundary</span>
                  </button>
                  <button
                    type="button"
                    style={styles.adjustBtn}
                    onClick={() => {
                      setIsReviewMode(false);
                      setIsPolygonClosed(false);
                    }}
                  >
                    <Undo2 size={16} />
                    <span>Adjust Points</span>
                  </button>
                </div>
              </div>
            ) : activeTab === 'manual' ? (
              /* METHOD 1: MANUAL SATELLITE DRAWING PANEL */
              <div style={styles.controlsCard}>
                <div style={styles.instructionBanner}>
                  <Info size={18} color="#2563EB" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Instructions:</strong> Click on the satellite map around the tank to place corner points. Drag any marker to adjust. Place at least 3 points, then click <strong>"Close Boundary"</strong> or click point 1.
                  </div>
                </div>

                <div style={styles.manualMetricsRow}>
                  <div>
                    <span style={styles.metricLabel}>Points Placed:</span>{' '}
                    <strong>{manualPoints.length}</strong>
                  </div>
                  {manualPoints.length >= 3 && (
                    <div>
                      <span style={styles.metricLabel}>Current Area:</span>{' '}
                      <strong style={{ color: '#2563EB' }}>{areaCalc.acres} Acres</strong>
                    </div>
                  )}
                </div>

                <div style={styles.btnRow}>
                  <button
                    type="button"
                    style={styles.closeBoundaryBtn}
                    disabled={manualPoints.length < 3}
                    onClick={handleCloseManual}
                  >
                    <Check size={16} />
                    <span>Close Boundary ({manualPoints.length} pts)</span>
                  </button>

                  <button
                    type="button"
                    style={styles.secondaryBtn}
                    disabled={manualPoints.length === 0}
                    onClick={handleUndoManual}
                  >
                    <Undo2 size={15} />
                    <span>Undo Point</span>
                  </button>

                  <button
                    type="button"
                    style={styles.dangerBtn}
                    disabled={manualPoints.length === 0}
                    onClick={handleResetManual}
                  >
                    <RotateCcw size={15} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            ) : (
              /* METHOD 2: GPS WALK-AROUND PANEL */
              <div style={styles.controlsCard}>
                <div style={styles.instructionBanner}>
                  <Navigation size={18} color="#059669" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>GPS Walk Instructions:</strong> Walk continuously along the edge of the tank. The application records high-accuracy GPS breadcrumbs. When you return close to the starting point, click <strong>"Finish & Close Boundary"</strong>.
                  </div>
                </div>

                {gpsError && (
                  <div style={styles.errorAlert}>
                    <AlertCircle size={16} color="#DC2626" />
                    <span>{gpsError}</span>
                  </div>
                )}

                {/* Live GPS Walk Metrics */}
                <div style={styles.gpsMetricsGrid}>
                  <div style={styles.gpsMetricBox}>
                    <span style={styles.gpsMetricTitle}>GPS Accuracy</span>
                    <span style={{
                      ...styles.gpsMetricVal,
                      color: gpsAccuracy <= 5 ? '#16A34A' : gpsAccuracy <= 10 ? '#D97706' : '#DC2626'
                    }}>
                      {gpsAccuracy != null ? `±${gpsAccuracy}m` : '--'}
                    </span>
                    <span style={styles.gpsMetricSub}>
                      {gpsAccuracy <= 5 ? 'High Accuracy' : gpsAccuracy <= 10 ? 'Acceptable' : 'Weak Signal'}
                    </span>
                  </div>

                  <div style={styles.gpsMetricBox}>
                    <span style={styles.gpsMetricTitle}>Timer</span>
                    <span style={styles.gpsMetricVal}>{formatTimer(walkDurationSec)}</span>
                    <span style={styles.gpsMetricSub}>{isWalking ? (isPaused ? 'Paused' : 'Recording') : 'Idle'}</span>
                  </div>

                  <div style={styles.gpsMetricBox}>
                    <span style={styles.gpsMetricTitle}>Points Logged</span>
                    <span style={styles.gpsMetricVal}>{gpsPoints.length}</span>
                    <span style={styles.gpsMetricSub}>bread-crumbs</span>
                  </div>

                  <div style={styles.gpsMetricBox}>
                    <span style={styles.gpsMetricTitle}>Distance Walked</span>
                    <span style={styles.gpsMetricVal}>{totalWalkDistance} m</span>
                    <span style={styles.gpsMetricSub}>
                      {distanceToStart != null ? `Start: ${distanceToStart}m away` : 'perimeter'}
                    </span>
                  </div>
                </div>

                {/* Distance to start notice */}
                {distanceToStart != null && distanceToStart <= 10 && gpsPoints.length >= 3 && (
                  <div style={styles.nearStartNotice}>
                    <CheckCircle2 size={16} color="#16A34A" />
                    <span>You are {distanceToStart}m from the starting point! Ready to close boundary.</span>
                  </div>
                )}

                {/* GPS Walk Control Buttons */}
                <div style={styles.btnRow}>
                  {!isWalking ? (
                    <button
                      type="button"
                      style={styles.startWalkBtn}
                      onClick={handleStartWalk}
                    >
                      <Play size={16} fill="#FFFFFF" />
                      <span>Start GPS Walk</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        style={styles.finishWalkBtn}
                        disabled={gpsPoints.length < 3}
                        onClick={handleFinishGpsWalk}
                      >
                        <Square size={16} fill="#FFFFFF" />
                        <span>Finish & Close Boundary</span>
                      </button>

                      <button
                        type="button"
                        style={styles.pauseBtn}
                        onClick={handlePauseResumeWalk}
                      >
                        {isPaused ? <Play size={16} /> : <Pause size={16} />}
                        <span>{isPaused ? 'Resume' : 'Pause'}</span>
                      </button>

                      <button
                        type="button"
                        style={styles.dangerBtn}
                        onClick={handleResetGps}
                      >
                        <RotateCcw size={15} />
                        <span>Discard</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '920px',
    height: '92vh',
    maxHeight: '840px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  headerIconCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSub: {
    margin: '2px 0 0',
    fontSize: '12px',
    color: '#64748B',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748B',
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
    padding: '4px 16px',
    gap: '8px',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748B',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabBtnActive: {
    color: '#2563EB',
    borderBottom: '2px solid #2563EB',
    backgroundColor: '#EFF6FF',
    borderRadius: '8px 8px 0 0',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
    minHeight: '260px',
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  mapFloatingControls: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    display: 'flex',
    gap: '8px',
    zIndex: 1000,
  },
  floatingBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#1E293B',
    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
    cursor: 'pointer',
  },
  areaBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    color: '#FFFFFF',
    padding: '8px 14px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    zIndex: 1000,
    textAlign: 'right',
  },
  areaBadgeLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#94A3B8',
  },
  areaBadgeValue: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#38BDF8',
  },
  areaBadgeSub: {
    fontSize: '11px',
    fontWeight: '400',
    color: '#CBD5E1',
  },
  actionPanel: {
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E2E8F0',
    padding: '16px 20px',
    maxHeight: '260px',
    overflowY: 'auto',
  },
  instructionBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    backgroundColor: '#F0F9FF',
    border: '1px solid #BAE6FD',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '12px',
    color: '#0369A1',
    lineHeight: '1.4',
    marginBottom: '12px',
  },
  manualMetricsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    fontSize: '13px',
    color: '#334155',
  },
  metricLabel: {
    color: '#64748B',
  },
  btnRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  closeBoundaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    backgroundColor: '#F1F5F9',
    color: '#334155',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  dangerBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FCA5A5',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  gpsMetricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    marginBottom: '12px',
  },
  gpsMetricBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '8px 12px',
    textAlign: 'center',
  },
  gpsMetricTitle: {
    fontSize: '10px',
    textTransform: 'uppercase',
    color: '#64748B',
    fontWeight: '600',
    display: 'block',
  },
  gpsMetricVal: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
    margin: '3px 0',
    display: 'block',
  },
  gpsMetricSub: {
    fontSize: '10px',
    color: '#94A3B8',
    display: 'block',
  },
  startWalkBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '11px 22px',
    backgroundColor: '#059669',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
  },
  finishWalkBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  pauseBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 14px',
    backgroundColor: '#F1F5F9',
    color: '#334155',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  nearStartNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #86EFAC',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    color: '#15803D',
    fontWeight: '600',
    marginBottom: '12px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    color: '#DC2626',
    marginBottom: '10px',
  },
  reviewCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  reviewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  reviewTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewSub: {
    margin: '2px 0 0',
    fontSize: '12px',
    color: '#64748B',
  },
  specsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    padding: '12px 14px',
  },
  specItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  specLabel: {
    fontSize: '11px',
    color: '#64748B',
  },
  specVal: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1E293B',
  },
  reviewActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '4px',
  },
  confirmBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '11px 22px',
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
  },
  adjustBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    backgroundColor: '#F1F5F9',
    color: '#334155',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default TankBoundaryEditor;
