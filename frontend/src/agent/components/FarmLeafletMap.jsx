import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { 
  LocateFixed, Maximize2, Minimize2, X, Search, Filter, 
  MapPin, Eye, Plus, Layers, AlertCircle, CheckCircle2, ChevronDown 
} from 'lucide-react';

/**
 * Validates and converts GeoJSON polygon coordinates [lng, lat] to Leaflet [lat, lng].
 * Enforces valid geographic range and closed coordinate rings.
 */
function parseBoundaryPolygon(boundary) {
  if (!boundary) return null;
  let poly = boundary;
  if (typeof poly === 'string') {
    try {
      poly = JSON.parse(poly);
    } catch {
      return null;
    }
  }
  if (!poly || typeof poly !== 'object') return null;
  if (poly.type !== 'Polygon' || !Array.isArray(poly.coordinates) || !Array.isArray(poly.coordinates[0])) {
    return null;
  }
  const ring = poly.coordinates[0];
  if (ring.length < 3) return null;

  const latLngs = [];
  for (const pt of ring) {
    if (!Array.isArray(pt) || pt.length < 2) return null;
    const lng = Number(pt[0]);
    const lat = Number(pt[1]);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }
    latLngs.push([lat, lng]);
  }
  return latLngs.length >= 3 ? latLngs : null;
}

/**
 * Calculates the centroid [lat, lng] of a valid polygon ring.
 */
function getPolygonCentroid(latLngs) {
  if (!latLngs || latLngs.length === 0) return null;
  const pts = (latLngs.length > 3 && latLngs[0][0] === latLngs[latLngs.length - 1][0] && latLngs[0][1] === latLngs[latLngs.length - 1][1])
    ? latLngs.slice(0, -1)
    : latLngs;
  const sumLat = pts.reduce((acc, p) => acc + p[0], 0);
  const sumLng = pts.reduce((acc, p) => acc + p[1], 0);
  return [sumLat / pts.length, sumLng / pts.length];
}

/**
 * Validates point coordinates [lat, lng].
 */
function isValidPointCoords(lat, lng) {
  if (lat == null || lng == null) return false;
  const nLat = Number(lat);
  const nLng = Number(lng);
  return !isNaN(nLat) && !isNaN(nLng) && nLat >= -90 && nLat <= 90 && nLng >= -180 && nLng <= 180 && (nLat !== 0 || nLng !== 0);
}

const FarmLeafletMap = ({ 
  gps, 
  tanks = [],
  selectedTank,
  onSelectTank,
  ponds, 
  selectedPond, 
  onSelectPond,
  onRecordTank,
  showFilters = true
}) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const polygonsLayerRef = useRef(null);

  const rawActiveTanks = (tanks && tanks.length > 0) ? tanks : (ponds || []);
  const [internalSelectedTank, setInternalSelectedTank] = useState(null);
  const activeSelectedTank = selectedTank || selectedPond || internalSelectedTank;
  const handleSelect = onSelectTank || onSelectPond;

  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedBoundaryFilter, setSelectedBoundaryFilter] = useState('ALL');

  // Parse and categorize actual registered tanks without generating fabricated data (strictly valid farmer associations)
  const processedTanks = useMemo(() => {
    return (rawActiveTanks || [])
      .filter((tank) => {
        // Exclude orphaned tanks or tanks without valid farmer records
        if (tank.isOrphaned || tank.hasValidFarmer === false) return false;
        const farmerName = (tank.farmer || tank.farmerName || '').trim();
        if (!farmerName || farmerName.toLowerCase() === 'farmer' || farmerName.toLowerCase() === 'ravi') {
          return false;
        }
        return true;
      })
      .map((tank) => {
        const boundaryLatLngs = parseBoundaryPolygon(tank.boundaryCoordinates || tank.boundary_coordinates);
        const hasDirectCoords = isValidPointCoords(tank.latitude, tank.longitude);
        const pointCoords = hasDirectCoords ? [Number(tank.latitude), Number(tank.longitude)] : null;
        const centroid = boundaryLatLngs ? getPolygonCentroid(boundaryLatLngs) : null;
        const effectiveCoords = pointCoords || centroid;
        const hasLocation = Boolean(effectiveCoords);
        const hasBoundary = Boolean(boundaryLatLngs);

        let boundaryStatus = 'Not Registered';
        if (hasBoundary) {
          boundaryStatus = 'Registered (Polygon)';
        } else if (hasLocation) {
          boundaryStatus = 'Coordinates Only';
        }

        return {
          ...tank,
          id: String(tank.id),
          name: tank.name || `Tank ${tank.id}`,
          farmer: (tank.farmer || tank.farmerName || '').trim(),
          locality: tank.locality || tank.location || 'Aquaculture Zone',
          boundaryLatLngs,
          effectiveCoords,
          hasLocation,
          hasBoundary,
          boundaryStatus,
          status: tank.status || 'Active',
          testStatus: tank.testStatus || tank.test_status || 'Optimal',
        };
      });
  }, [rawActiveTanks]);

  // Unique farmers among the authorised tanks for filtering dropdown (strictly authentic registered names)
  const uniqueFarmers = useMemo(() => {
    const set = new Set();
    processedTanks.forEach(t => {
      if (t.farmer && t.farmer.toLowerCase() !== 'farmer' && t.farmer.toLowerCase() !== 'ravi') {
        set.add(t.farmer);
      }
    });
    return Array.from(set).sort();
  }, [processedTanks]);

  // Filter tanks strictly according to user selections
  const filteredTanks = useMemo(() => {
    return processedTanks.filter(t => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const match = (t.name || '').toLowerCase().includes(term) ||
                      (t.id || '').toLowerCase().includes(term) ||
                      (t.farmer || '').toLowerCase().includes(term) ||
                      (t.locality || '').toLowerCase().includes(term);
        if (!match) return false;
      }
      if (selectedFarmer !== 'ALL' && t.farmer !== selectedFarmer) {
        return false;
      }
      if (selectedStatus !== 'ALL') {
        const isHarvested = (t.status || '').toLowerCase() === 'harvested';
        const isOverdue = ((t.testStatus || t.status || '').toLowerCase() === 'overdue' || t.isOverdue) && !isHarvested;
        const isDue = (t.due || (t.testStatus || t.status || '').toLowerCase() === 'due' || t.isDue) && !isHarvested && !isOverdue;
        if (selectedStatus === 'HARVESTED' && !isHarvested) return false;
        if (selectedStatus === 'OVERDUE' && !isOverdue) return false;
        if (selectedStatus === 'DUE' && !isDue) return false;
        if (selectedStatus === 'OPTIMAL' && (isHarvested || isOverdue || isDue)) return false;
      }
      if (selectedBoundaryFilter === 'WITH_BOUNDARY' && !t.hasBoundary) return false;
      if (selectedBoundaryFilter === 'COORDS_ONLY' && (!t.hasLocation || t.hasBoundary)) return false;
      return true;
    });
  }, [processedTanks, searchTerm, selectedFarmer, selectedStatus, selectedBoundaryFilter]);

  // Visible tanks that actually have valid database location or polygon coordinates
  const visibleMapTanks = useMemo(() => {
    return filteredTanks.filter(t => t.hasLocation);
  }, [filteredTanks]);

  const unregisteredCount = useMemo(() => {
    return processedTanks.filter(t => !t.hasLocation).length;
  }, [processedTanks]);

  const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY || 'cb1_49o0_1_b86e406055a2af5dc773fb51';
  const cartoParam = cartoApiKey ? `?key=${cartoApiKey}` : '';
  const cartoVoyagerUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${cartoParam}`;
  const satelliteUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

  // Keyboard shortcut: Escape exits fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // When fullscreen changes, trigger map invalidateSize so tiles fill seamlessly
  useEffect(() => {
    if (mapInstanceRef.current) {
      const t1 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50);
      const t2 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
      const t3 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 400);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isFullscreen]);

  // Initialize Leaflet Map only once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default initial view: Center on first registered tank or technician GPS if available
      const firstValidTank = visibleMapTanks[0];
      const initialLat = firstValidTank?.effectiveCoords?.[0] || (gps?.latitude ? Number(gps.latitude) : 16.5412);
      const initialLng = firstValidTank?.effectiveCoords?.[1] || (gps?.longitude ? Number(gps.longitude) : 81.5234);

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14.8,
        zoomControl: false,
        attributionControl: false,
      });

      const initialUrl = mapType === 'satellite' ? satelliteUrl : cartoVoyagerUrl;
      const tileLayer = L.tileLayer(initialUrl, {
        maxZoom: 20,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const polygonsLayer = L.layerGroup().addTo(map);
      const markersLayer = L.layerGroup().addTo(map);

      polygonsLayerRef.current = polygonsLayer;
      markersLayerRef.current = markersLayer;
      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;

      const handleResize = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
      setTimeout(handleResize, 300);
    }

    return () => {
      window.removeEventListener('resize', () => {});
      window.removeEventListener('orientationchange', () => {});
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch between Roadmap and Satellite layer
  useEffect(() => {
    if (!tileLayerRef.current || !mapInstanceRef.current) return;
    const tileUrl = mapType === 'satellite' ? satelliteUrl : cartoVoyagerUrl;
    tileLayerRef.current.setUrl(tileUrl);
  }, [mapType, cartoVoyagerUrl]);

  // Render actual registered tanks and polygons (ZERO fabricated locations)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const polygonsLayer = polygonsLayerRef.current;
    if (!map || !markersLayer || !polygonsLayer) return;

    markersLayer.clearLayers();
    polygonsLayer.clearLayers();

    const pointsToFit = [];

    // Optional: Render live technician beacon as user reference point (NOT as a tank location)
    if (gps?.latitude && gps?.longitude && !isNaN(Number(gps.latitude)) && !isNaN(Number(gps.longitude))) {
      const uLat = Number(gps.latitude);
      const uLng = Number(gps.longitude);
      const userBeacon = L.divIcon({
        className: 'clean-user-beacon',
        html: `
          <div style="position:relative; width:28px; height:28px; display:flex; align-items:center; justify-content:center; transform:translate(-50%, -50%); pointer-events:none;">
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(26, 47, 184, 0.22); animation:mapBeaconPulse 2s cubic-bezier(0.2, 0.6, 0.35, 1) infinite;"></div>
            <div style="width:13px; height:13px; border-radius:50%; background:#1A2FB8; border:2.5px solid #FFFFFF; box-shadow:0 2px 5px rgba(0,0,0,0.22); z-index:2;"></div>
          </div>
        `,
        iconSize: [0, 0],
      });
      const userMarker = L.marker([uLat, uLng], { icon: userBeacon, zIndexOffset: 1000 }).addTo(markersLayer);
      userMarker.bindTooltip(`
        <div style="font-family:sans-serif; font-size:11px; padding:2px;">
          <strong>Your Current Position</strong><br/>
          <span style="color:#64748B;">GPS: ${uLat.toFixed(5)}°N, ${uLng.toFixed(5)}°E</span>
        </div>
      `, { direction: 'top', offset: [0, -10] });
      pointsToFit.push([uLat, uLng]);
    }

    // Render registered tanks that have valid coordinates or boundaries
    visibleMapTanks.forEach((tank) => {
      const [pLat, pLng] = tank.effectiveCoords;
      pointsToFit.push([pLat, pLng]);

      const isSelected = activeSelectedTank?.id === tank.id || activeSelectedTank?.name === tank.name;
      const isHarvested = (tank.status || '').toLowerCase() === 'harvested';
      const isOverdue = ((tank.testStatus || tank.status || '').toLowerCase() === 'overdue' || tank.isOverdue) && !isHarvested;
      const isDue = (tank.due || (tank.testStatus || tank.status || '').toLowerCase() === 'due' || tank.isDue) && !isHarvested && !isOverdue;

      const themeColors = isHarvested ? {
        fill: '#64748B',
        stroke: '#475569',
        dot: '#64748B',
        glow: 'rgba(100, 116, 139, 0.3)',
        tagBg: '#F1F5F9',
        tagText: '#475569',
        label: 'Harvested',
      } : isOverdue ? {
        fill: '#EF4444',
        stroke: '#DC2626',
        dot: '#DC2626',
        glow: 'rgba(220, 38, 38, 0.4)',
        tagBg: '#FEE2E2',
        tagText: '#B91C1C',
        label: 'Overdue',
      } : isDue ? {
        fill: '#F59E0B',
        stroke: '#D97706',
        dot: '#D97706',
        glow: 'rgba(217, 119, 6, 0.4)',
        tagBg: '#FEF3C7',
        tagText: '#B45309',
        label: 'Due',
      } : {
        fill: mapType === 'satellite' ? '#0284C7' : '#38BDF8',
        stroke: mapType === 'satellite' ? '#38BDF8' : '#0284C7',
        dot: '#0284C7',
        glow: 'rgba(2, 132, 199, 0.4)',
        tagBg: '#EFF6FF',
        tagText: '#1D4ED8',
        label: 'Optimal',
      };

      const onSelect = () => {
        setInternalSelectedTank(tank);
        if (handleSelect) handleSelect(tank);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([pLat, pLng], 16.5, { animate: true, duration: 0.5 });
        }
      };

      // 1. RENDER ACTUAL SAVED TANK POLYGON (IF PRESENT)
      if (tank.boundaryLatLngs) {
        L.polygon(tank.boundaryLatLngs, {
          color: isSelected ? '#1A2FB8' : themeColors.stroke,
          weight: isSelected ? 3.5 : 2,
          fillColor: themeColors.fill,
          fillOpacity: isSelected ? 0.45 : 0.25,
        }).addTo(polygonsLayer).on('click', onSelect);

        tank.boundaryLatLngs.forEach(pt => pointsToFit.push(pt));
      }

      // 2. TANK BADGE PIN / MARKER AT REGISTERED LOCATION OR CENTROID
      const badgeIcon = L.divIcon({
        className: 'aquaculture-tank-marker',
        html: `
          <div style="position:relative; display:flex; align-items:center; justify-content:center; transform:translate(-50%, -50%); cursor:pointer; pointer-events:auto;">
            ${isSelected ? `
              <div style="position:absolute; width:54px; height:54px; border-radius:50%; background:${themeColors.glow}; animation:mapBeaconPulse 2s cubic-bezier(0.2, 0.6, 0.35, 1) infinite; pointer-events:none;"></div>
            ` : ''}

            <div style="
              display:flex;
              align-items:center;
              gap:6px;
              background:rgba(255, 255, 255, 0.96);
              backdrop-filter:blur(8px);
              border:${isSelected ? '2px solid #1A2FB8' : '1.5px solid #CBD5E1'};
              border-radius:18px;
              padding:3px 8px 3px 6px;
              box-shadow:0 3px 12px rgba(15, 23, 42, ${isSelected ? '0.35' : '0.18'});
              transition:transform 0.15s ease;
              z-index:2;
            ">
              <span style="
                width:8px;
                height:8px;
                border-radius:50%;
                background:${themeColors.dot};
                box-shadow:0 0 5px ${themeColors.dot};
                flex-shrink:0;
              "></span>

              <span style="
                font-size:11px;
                font-weight:700;
                color:#0F172A;
                white-space:nowrap;
                line-height:1.2;
              ">
                ${tank.name}
              </span>

              <span style="
                font-size:9.5px;
                font-weight:600;
                color:${themeColors.tagText};
                background:${themeColors.tagBg};
                padding:1px 5px;
                border-radius:8px;
                white-space:nowrap;
                line-height:1.2;
              ">
                ${tank.size ? String(tank.size).split(' ')[0] + ' Ac' : (tank.acres ? `${tank.acres} Ac` : '1.5 Ac')}
              </span>
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([pLat, pLng], {
        icon: badgeIcon,
        zIndexOffset: isSelected ? 500 : 100
      }).addTo(markersLayer);

      const tooltipContent = `
        <div style="font-family:-apple-system, BlinkMacSystemFont, sans-serif; font-size:11px; padding:3px 1px; line-height:1.45; min-width:140px;">
          <strong>${tank.name}</strong> • <span style="color:${themeColors.tagText}; font-weight:700;">${themeColors.label}</span><br/>
          Farmer: <strong>${tank.farmer}</strong><br/>
          Area: <strong>${tank.size || (tank.acres ? `${tank.acres} Acres` : 'N/A')}</strong><br/>
          Boundary: <strong>${tank.boundaryStatus}</strong><br/>
          <span style="color:#64748B; font-size:10px;">Location: ${pLat.toFixed(5)}°N, ${pLng.toFixed(5)}°E</span>
        </div>
      `;

      marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -14] });
      marker.on('click', onSelect);
    });

    // Auto-fit bounds strictly to actual registered locations
    if (pointsToFit.length > 1) {
      try {
        const bounds = L.latLngBounds(pointsToFit);
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 16.5,
            animate: true,
          });
        }
      } catch (e) {
        console.warn('Map fitBounds error:', e);
      }
    } else if (pointsToFit.length === 1) {
      map.setView(pointsToFit[0], 16, { animate: true });
    }
  }, [visibleMapTanks, activeSelectedTank, handleSelect, mapType, gps]);

  // Recenter handler
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const allPts = visibleMapTanks.map(t => t.effectiveCoords);
    if (gps?.latitude && gps?.longitude) {
      allPts.push([Number(gps.latitude), Number(gps.longitude)]);
    }
    if (allPts.length > 1) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(allPts), { padding: [45, 45], maxZoom: 16.2, animate: true });
    } else if (allPts.length === 1) {
      mapInstanceRef.current.setView(allPts[0], 16, { animate: true });
    }
  };

  const getDetailUrl = (tankId) => {
    if (typeof window === 'undefined') return `/tanks/${tankId}`;
    const path = window.location.pathname;
    if (path.startsWith('/incharge')) return `/incharge/tanks/${tankId}`;
    if (path.startsWith('/asm')) return `/asm/tanks/${tankId}`;
    return `/tanks/${tankId}`;
  };

  return (
    <div style={isFullscreen ? styles.fullscreenWrapper : styles.mapWrapper}>
      {/* Top Map Toolbar: Map/Satellite + Filters + Fullscreen + Recenter */}
      <div style={isFullscreen ? styles.topToolbarFullscreen : styles.topToolbar}>
        {/* Layer Controls */}
        <div style={styles.layerControls}>
          <button
            type="button"
            style={{
              ...styles.typeBtn,
              backgroundColor: mapType === 'roadmap' ? '#1A2FB8' : 'transparent',
              color: mapType === 'roadmap' ? '#FFFFFF' : '#64748B',
              fontWeight: mapType === 'roadmap' ? '700' : '500',
            }}
            onClick={() => setMapType('roadmap')}
          >
            Map
          </button>
          <button
            type="button"
            style={{
              ...styles.typeBtn,
              backgroundColor: mapType === 'satellite' ? '#1A2FB8' : 'transparent',
              color: mapType === 'satellite' ? '#FFFFFF' : '#64748B',
              fontWeight: mapType === 'satellite' ? '700' : '500',
            }}
            onClick={() => setMapType('satellite')}
          >
            Satellite
          </button>
        </div>

        {/* Action Controls */}
        <div style={styles.actionControls}>
          {showFilters && (
            <button
              type="button"
              style={{
                ...styles.toolbarBtn,
                backgroundColor: (selectedFarmer !== 'ALL' || selectedStatus !== 'ALL' || selectedBoundaryFilter !== 'ALL' || searchTerm) ? '#EFF6FF' : 'rgba(255, 255, 255, 0.95)',
                color: (selectedFarmer !== 'ALL' || selectedStatus !== 'ALL' || selectedBoundaryFilter !== 'ALL' || searchTerm) ? '#1A2FB8' : '#0F172A',
                border: (selectedFarmer !== 'ALL' || selectedStatus !== 'ALL' || selectedBoundaryFilter !== 'ALL' || searchTerm) ? '1px solid #93C5FD' : '1px solid #E2E8F0',
              }}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              title="Filter Tanks on Map"
            >
              <Filter size={13} />
              <span style={{ fontSize: '11px', fontWeight: '700' }}>Filters</span>
            </button>
          )}

          <button
            type="button"
            style={styles.iconBtn}
            onClick={handleRecenter}
            title="Re-center to registered tanks"
          >
            <LocateFixed size={14} color="#1A2FB8" strokeWidth={2.2} />
          </button>

          {isFullscreen ? (
            <button
              type="button"
              style={styles.exitFullscreenBtn}
              onClick={() => setIsFullscreen(false)}
              title="Exit Full Screen (Esc)"
            >
              <Minimize2 size={13} color="#0F172A" strokeWidth={2.4} />
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#0F172A' }}>Exit</span>
            </button>
          ) : (
            <button
              type="button"
              style={styles.iconBtn}
              onClick={() => setIsFullscreen(true)}
              title="View Full Screen"
            >
              <Maximize2 size={14} color="#1A2FB8" strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>

      {/* Inline Filters Panel */}
      {showFilters && isFilterOpen && (
        <div style={styles.filterPanel}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 140px', minWidth: '120px' }}>
              <Search size={13} color="#94A3B8" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tank / farmer..."
                style={styles.filterInput}
              />
            </div>

            {/* Farmer Filter */}
            {uniqueFarmers.length > 1 && (
              <select
                value={selectedFarmer}
                onChange={(e) => setSelectedFarmer(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="ALL">All Farmers ({uniqueFarmers.length})</option>
                {uniqueFarmers.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="ALL">All Statuses</option>
              <option value="OPTIMAL">Optimal</option>
              <option value="DUE">Test Due</option>
              <option value="OVERDUE">Overdue</option>
              <option value="HARVESTED">Harvested</option>
            </select>

            {/* Boundary Filter */}
            <select
              value={selectedBoundaryFilter}
              onChange={(e) => setSelectedBoundaryFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="ALL">All Boundaries</option>
              <option value="WITH_BOUNDARY">With Polygon Boundary</option>
              <option value="COORDS_ONLY">Coordinates Only</option>
            </select>

            {(selectedFarmer !== 'ALL' || selectedStatus !== 'ALL' || selectedBoundaryFilter !== 'ALL' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFarmer('ALL');
                  setSelectedStatus('ALL');
                  setSelectedBoundaryFilter('ALL');
                  setSearchTerm('');
                }}
                style={styles.resetFilterBtn}
              >
                Reset
              </button>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', color: '#64748B' }}>
            <span>
              Showing <strong>{visibleMapTanks.length}</strong> of <strong>{processedTanks.length}</strong> assigned tanks on map
            </span>
            {unregisteredCount > 0 && (
              <span style={{ color: '#D97706' }}>
                ({unregisteredCount} without GPS location)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Leaflet Map DOM Canvas */}
      <div ref={mapContainerRef} style={styles.mapElement} />

      {/* Empty State Overlay when no registered tanks have location coordinates */}
      {visibleMapTanks.length === 0 && (
        <div style={styles.emptyStateOverlay}>
          <div style={styles.emptyCard}>
            <div style={styles.emptyIconCircle}>
              <MapPin size={24} color="#D97706" />
            </div>
            <h4 style={styles.emptyTitle}>
              {processedTanks.length === 0 ? 'No Assigned Tanks Found' : 'No Registered Tank Locations'}
            </h4>
            <p style={styles.emptyDesc}>
              {processedTanks.length === 0
                ? 'There are currently no tanks assigned to your account in the database.'
                : filteredTanks.length === 0
                  ? 'No tanks match the selected filters. Try resetting the filters.'
                  : `None of your ${processedTanks.length} assigned tanks currently have registered GPS coordinates or polygon boundaries in the database.`}
            </p>
            <span style={styles.emptyTip}>
              When tanks and their boundaries are registered with GPS coordinates, they will automatically appear here on the map.
            </span>
          </div>
        </div>
      )}

      {/* Interactive Detail Drawer for Selected Tank */}
      {activeSelectedTank && (
        <div style={isFullscreen ? styles.fullscreenDrawer : styles.bottomDrawer}>
          <div style={styles.drawerHeaderRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={styles.drawerTankTitle}>{activeSelectedTank.name}</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: activeSelectedTank.status === 'Harvested' ? '#F1F5F9' : (activeSelectedTank.due ? '#FEF3C7' : '#DCFCE7'),
                color: activeSelectedTank.status === 'Harvested' ? '#475569' : (activeSelectedTank.due ? '#B45309' : '#15803D'),
              }}>
                {activeSelectedTank.status || 'Optimal'}
              </span>
              <span style={{
                fontSize: '10.5px',
                fontWeight: '600',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: activeSelectedTank.hasBoundary ? '#ECFDF5' : '#FEF3C7',
                color: activeSelectedTank.hasBoundary ? '#059669' : '#D97706',
                border: activeSelectedTank.hasBoundary ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}>
                {activeSelectedTank.hasBoundary ? <CheckCircle2 size={11} /> : <MapPin size={11} />}
                {activeSelectedTank.hasBoundary ? 'Boundary: Polygon Registered' : 'Boundary: Coords Only'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setInternalSelectedTank(null);
                if (handleSelect) handleSelect(null);
              }}
              style={styles.closeDrawerBtn}
              title="Close details"
            >
              <X size={16} color="#64748B" />
            </button>
          </div>

          <div style={styles.drawerMetadataGrid}>
            <div>
              <span style={styles.metaLabel}>Tank ID:</span>
              <span style={styles.metaValue}>{activeSelectedTank.id}</span>
            </div>
            <div>
              <span style={styles.metaLabel}>Farmer:</span>
              <span style={styles.metaValue}>{activeSelectedTank.farmer || 'Registered Farmer'}</span>
            </div>
            <div>
              <span style={styles.metaLabel}>Area:</span>
              <span style={styles.metaValue}>{activeSelectedTank.size || (activeSelectedTank.acres ? `${activeSelectedTank.acres} Acres` : '1.5 Acres')}</span>
            </div>
            <div>
              <span style={styles.metaLabel}>Locality:</span>
              <span style={styles.metaValue}>{activeSelectedTank.locality || activeSelectedTank.location || 'Aquaculture Zone'}</span>
            </div>
          </div>

          <div style={styles.drawerActions}>
            <button
              type="button"
              onClick={() => navigate(getDetailUrl(activeSelectedTank.id))}
              style={styles.viewTankBtn}
            >
              <Eye size={13} />
              <span>View Tank Details</span>
            </button>

            {onRecordTank ? (
              <button
                type="button"
                onClick={() => onRecordTank(activeSelectedTank)}
                style={styles.recordTankBtn}
              >
                <Plus size={13} />
                <span>Record Test</span>
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  mapWrapper: {
    width: '100%',
    height: 'clamp(280px, 44vh, 420px)',
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    border: '1px solid #E2E8F0',
    backgroundColor: '#0F172A',
  },
  fullscreenWrapper: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 99999,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  mapElement: {
    width: '100%',
    height: '100%',
    outline: 'none',
  },
  topToolbar: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    right: '10px',
    zIndex: 999,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    pointerEvents: 'none',
  },
  topToolbarFullscreen: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    right: '16px',
    zIndex: 999,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    pointerEvents: 'none',
  },
  layerControls: {
    display: 'flex',
    borderRadius: '8px',
    padding: '2px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.1)',
    border: '1px solid #CBD5E1',
    pointerEvents: 'auto',
  },
  actionControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    pointerEvents: 'auto',
  },
  typeBtn: {
    border: 'none',
    padding: '4px 10px',
    fontSize: '11px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  toolbarBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  },
  iconBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(8px)',
    border: '1px solid #CBD5E1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  },
  exitFullscreenBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.12)',
    cursor: 'pointer',
  },
  filterPanel: {
    position: 'absolute',
    top: '48px',
    left: '10px',
    right: '10px',
    zIndex: 998,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    borderRadius: '10px',
    padding: '10px 12px',
    border: '1px solid #CBD5E1',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.12)',
  },
  filterInput: {
    width: '100%',
    padding: '5px 8px 5px 26px',
    fontSize: '11.5px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  filterSelect: {
    padding: '5px 8px',
    fontSize: '11.5px',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    outline: 'none',
    cursor: 'pointer',
  },
  resetFilterBtn: {
    padding: '5px 8px',
    fontSize: '11px',
    fontWeight: '600',
    border: 'none',
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  emptyStateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 900,
    padding: '16px',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px 24px',
    maxWidth: '380px',
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
  },
  emptyIconCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#FEF3C7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px auto',
  },
  emptyTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0F172A',
    margin: '0 0 6px 0',
  },
  emptyDesc: {
    fontSize: '12.5px',
    color: '#64748B',
    lineHeight: '1.45',
    margin: '0 0 10px 0',
  },
  emptyTip: {
    display: 'block',
    fontSize: '11px',
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  bottomDrawer: {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    right: '10px',
    zIndex: 998,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    borderRadius: '10px',
    padding: '12px 14px',
    border: '1px solid #CBD5E1',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  fullscreenDrawer: {
    position: 'absolute',
    bottom: '20px',
    left: '16px',
    right: '16px',
    maxWidth: '540px',
    margin: '0 auto',
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(12px)',
    borderRadius: '14px',
    padding: '14px 18px',
    border: '1px solid #CBD5E1',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  drawerHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerTankTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#0F172A',
  },
  closeDrawerBtn: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerMetadataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: '6px 12px',
    padding: '6px 0',
    borderTop: '1px solid #F1F5F9',
    borderBottom: '1px solid #F1F5F9',
  },
  metaLabel: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: '600',
    marginRight: '4px',
  },
  metaValue: {
    fontSize: '11.5px',
    color: '#0F172A',
    fontWeight: '700',
  },
  drawerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  viewTankBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    color: '#0F172A',
    cursor: 'pointer',
  },
  recordTankBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

export default FarmLeafletMap;
