import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { LocateFixed, Maximize2, Minimize2, X } from 'lucide-react';

const FarmLeafletMap = ({ 
  gps, 
  tanks = [],
  selectedTank,
  onSelectTank,
  ponds, 
  selectedPond, 
  onSelectPond 
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const polygonsLayerRef = useRef(null);

  const activeTanks = (tanks && tanks.length > 0) ? tanks : (ponds || []);
  const [internalSelectedTank, setInternalSelectedTank] = useState(null);
  const activeSelectedTank = selectedTank || selectedPond || internalSelectedTank;
  const handleSelect = onSelectTank || onSelectPond;

  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Look for valid coordinates from activeTanks if available
  const tanksWithCoords = (activeTanks || []).filter(t => t.latitude != null && t.longitude != null && !isNaN(Number(t.latitude)) && !isNaN(Number(t.longitude)));
  
  const defaultCenterLat = tanksWithCoords.length > 0 ? Number(tanksWithCoords[0].latitude) : 16.5412;
  const defaultCenterLng = tanksWithCoords.length > 0 ? Number(tanksWithCoords[0].longitude) : 81.5234;

  const centerLat = (gps?.latitude != null && !isNaN(Number(gps.latitude))) ? Number(gps.latitude) : defaultCenterLat;
  const centerLng = (gps?.longitude != null && !isNaN(Number(gps.longitude))) ? Number(gps.longitude) : defaultCenterLng;

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      if (tanksWithCoords.length > 0) {
        const allPoints = tanksWithCoords.map(t => [Number(t.latitude), Number(t.longitude)]);
        if (gps?.latitude && gps?.longitude) {
          allPoints.push([Number(gps.latitude), Number(gps.longitude)]);
        }
        const bounds = L.latLngBounds(allPoints);
        mapInstanceRef.current.fitBounds(bounds, { padding: [45, 45], maxZoom: 16.2, animate: true });
      } else {
        mapInstanceRef.current.flyTo([centerLat, centerLng], 15.5, {
          animate: true,
          duration: 0.6,
        });
      }
    }
  };

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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map with clean default view
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 14.8,
        zoomControl: false,
        attributionControl: false,
      });

      // Clean Basemap: CartoDB Voyager with API key support or Google Satellite
      const initialUrl = mapType === 'satellite' ? satelliteUrl : cartoVoyagerUrl;
      const tileLayer = L.tileLayer(initialUrl, {
        maxZoom: 20,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);

      // Clean Zoom Control positioned at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const polygonsLayer = L.layerGroup().addTo(map);
      const markersLayer = L.layerGroup().addTo(map);
      
      polygonsLayerRef.current = polygonsLayer;
      markersLayerRef.current = markersLayer;
      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;

      // Handle orientation change and container resize
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

  // Switch between Clean Basemap (CartoDB Voyager) and High-Res Satellite
  useEffect(() => {
    if (!tileLayerRef.current || !mapInstanceRef.current) return;

    const tileUrl = mapType === 'satellite'
      ? satelliteUrl
      : cartoVoyagerUrl;

    tileLayerRef.current.setUrl(tileUrl);
  }, [mapType, cartoVoyagerUrl]);

  // Update center, technician beacon, and tank markers with solid big colour dots
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const polygonsLayer = polygonsLayerRef.current;
    if (!map || !markersLayer || !polygonsLayer) return;

    markersLayer.clearLayers();
    polygonsLayer.clearLayers();

    const pointsToFit = [];

    // 1. LIVE TECHNICIAN GPS RADAR BEACON (Pulsating Dot)
    const cleanUserBeacon = L.divIcon({
      className: 'clean-user-beacon',
      html: `
        <div style="position:relative; width:28px; height:28px; display:flex; align-items:center; justify-content:center; transform:translate(-50%, -50%); pointer-events:none;">
          <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(26, 47, 184, 0.22); animation:mapBeaconPulse 2s cubic-bezier(0.2, 0.6, 0.35, 1) infinite;"></div>
          <div style="width:13px; height:13px; border-radius:50%; background:#1A2FB8; border:2.5px solid #FFFFFF; box-shadow:0 2px 5px rgba(0,0,0,0.22); z-index:2;"></div>
        </div>
      `,
      iconSize: [0, 0],
    });

    const userMarker = L.marker([centerLat, centerLng], { icon: cleanUserBeacon, zIndexOffset: 1000 }).addTo(markersLayer);
    userMarker.bindTooltip(`
      <div style="font-family:sans-serif; font-size:11px; padding:2px;">
        <strong>Live Position (Field Agent)</strong><br/>
        <span style="color:#64748B;">GPS: ${centerLat.toFixed(6)}°N, ${centerLng.toFixed(6)}°E</span>
      </div>
    `, { direction: 'top', offset: [0, -10] });
    pointsToFit.push([centerLat, centerLng]);

    // 2. REALISTIC POND POLYGONS + CENTER STATUS BADGES
    const fallbackGeometries = [
      { offsetLat: 0.0035, offsetLng: -0.0042 },
      { offsetLat: 0.0042, offsetLng: 0.0050 },
      { offsetLat: -0.0038, offsetLng: -0.0035 },
      { offsetLat: -0.0045, offsetLng: 0.0048 },
    ];

    activeTanks.forEach((tank, idx) => {
      // Strictly use actual database GPS coordinates when present
      let pLat = (tank.latitude != null && !isNaN(Number(tank.latitude))) ? Number(tank.latitude) : null;
      let pLng = (tank.longitude != null && !isNaN(Number(tank.longitude))) ? Number(tank.longitude) : null;

      // Fallback only if no coordinates provided in database
      if (pLat == null || pLng == null) {
        const geom = fallbackGeometries[idx % fallbackGeometries.length];
        pLat = centerLat + geom.offsetLat;
        pLng = centerLng + geom.offsetLng;
      }

      pointsToFit.push([pLat, pLng]);

      const isSelected = activeSelectedTank?.id === tank.id || activeSelectedTank?.name === tank.name;
      const isHarvested = tank.status === 'Harvested';
      const isOverdue = (tank.testStatus === 'Overdue' || tank.isOverdue || tank.status === 'Overdue') && !isHarvested;
      const isDue = (tank.due || tank.testStatus === 'Due' || tank.status === 'Due') && !isHarvested && !isOverdue;

      // Aquaculture Theme Colors based on Status & Map Layer
      const statusKey = isHarvested ? 'harvested' : (isOverdue ? 'overdue' : (isDue ? 'due' : 'optimal'));
      const themeColors = {
        optimal: {
          fill: mapType === 'satellite' ? '#0284C7' : '#38BDF8',
          stroke: mapType === 'satellite' ? '#38BDF8' : '#0284C7',
          dot: '#0284C7',
          glow: 'rgba(2, 132, 199, 0.4)',
          tagBg: '#EFF6FF',
          tagText: '#1D4ED8',
          label: 'Optimal',
        },
        due: {
          fill: '#F59E0B',
          stroke: '#D97706',
          dot: '#D97706',
          glow: 'rgba(217, 119, 6, 0.4)',
          tagBg: '#FEF3C7',
          tagText: '#B45309',
          label: 'Due',
        },
        overdue: {
          fill: '#EF4444',
          stroke: '#DC2626',
          dot: '#DC2626',
          glow: 'rgba(220, 38, 38, 0.4)',
          tagBg: '#FEE2E2',
          tagText: '#B91C1C',
          label: 'Overdue',
        },
        harvested: {
          fill: '#64748B',
          stroke: '#475569',
          dot: '#64748B',
          glow: 'rgba(100, 116, 139, 0.3)',
          tagBg: '#F1F5F9',
          tagText: '#475569',
          label: 'Harvested',
        },
      }[statusKey];

      const onSelect = () => {
        setInternalSelectedTank(tank);
        if (handleSelect) handleSelect(tank);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([pLat, pLng], 16.5, { animate: true, duration: 0.5 });
        }
      };

      // B. CENTER STATUS BADGE (Floating Aquaculture Card Pin)
      const badgeIcon = L.divIcon({
        className: 'aquaculture-center-badge-marker',
        html: `
          <div style="position:relative; display:flex; align-items:center; justify-content:center; transform:translate(-50%, -50%); cursor:pointer; pointer-events:auto;">
            ${isSelected ? `
              <div style="position:absolute; width:52px; height:52px; border-radius:50%; background:${themeColors.glow}; animation:mapBeaconPulse 2s cubic-bezier(0.2, 0.6, 0.35, 1) infinite; pointer-events:none;"></div>
            ` : ''}

            <!-- Floating Pond Pill Badge -->
            <div style="
              display:flex;
              align-items:center;
              gap:6px;
              background:rgba(255, 255, 255, 0.96);
              backdrop-filter:blur(8px);
              border:${isSelected ? '2px solid #1A2FB8' : '1.5px solid #E2E8F0'};
              border-radius:18px;
              padding:3px 8px 3px 6px;
              box-shadow:0 3px 12px rgba(15, 23, 42, ${isSelected ? '0.35' : '0.18'});
              transition:transform 0.15s ease, box-shadow 0.15s ease;
              z-index:2;
            ">
              <!-- Water Status Indicator Dot -->
              <span style="
                width:8px;
                height:8px;
                border-radius:50%;
                background:${themeColors.dot};
                box-shadow:0 0 5px ${themeColors.dot};
                flex-shrink:0;
              "></span>

              <!-- Pond Name -->
              <span style="
                font-size:11px;
                font-weight:700;
                color:#0F172A;
                letter-spacing:-0.2px;
                white-space:nowrap;
                line-height:1.2;
              ">
                ${tank.name}
              </span>

              <!-- Mini Acre / Metric Tag -->
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
                ${tank.size ? String(tank.size).split(' ')[0] + ' Ac' : '1.5 Ac'}
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

      // Tooltip with comprehensive aquaculture telemetry
      const telemetryDetails = [
        `<strong>${tank.name}</strong> • <span style="color:${themeColors.tagText}; font-weight:700;">${themeColors.label}</span>`,
        `Farmer: <strong>${tank.farmer || 'Farmer'}</strong>`,
        `Area: <strong>${tank.size || '1.5 Acres'}</strong>${tank.doc ? ` • DOC <strong>${tank.doc}</strong>` : ''}${tank.abw ? ` • ABW <strong>${tank.abw}</strong>` : ''}`,
        `<span style="color:#64748B; font-size:10px;">GPS: ${pLat.toFixed(6)}°N, ${pLng.toFixed(6)}°E</span>`
      ].join('<br/>');

      marker.bindTooltip(`
        <div style="font-family:-apple-system, BlinkMacSystemFont, sans-serif; font-size:11px; padding:3px 1px; line-height:1.45; min-width:130px;">
          ${telemetryDetails}
        </div>
      `, { direction: 'top', offset: [0, -14] });

      marker.on('click', onSelect);
    });

    // Auto-fit bounds so all assigned ponds and live technician location fit in view
    if (pointsToFit.length > 0) {
      try {
        const bounds = L.latLngBounds(pointsToFit);
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [45, 45],
            maxZoom: 16.2,
            animate: true,
          });
        }
      } catch (e) {
        console.warn('Map fitBounds error:', e);
      }
    }
  }, [centerLat, centerLng, gps, activeTanks, activeSelectedTank, handleSelect, mapType]);

  return (
    <div style={isFullscreen ? styles.fullscreenWrapper : styles.mapWrapper}>
      {/* Clean Segmented Map/Satellite Control */}
      <div style={isFullscreen ? styles.mapTypeControlsFullscreen : styles.mapTypeControls}>
        <button
          type="button"
          style={{
            ...styles.typeBtn,
            backgroundColor: mapType === 'roadmap' ? '#1A2FB8' : 'transparent',
            color: mapType === 'roadmap' ? '#FFFFFF' : '#64748B',
            fontWeight: mapType === 'roadmap' ? '600' : '500',
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
            fontWeight: mapType === 'satellite' ? '600' : '500',
          }}
          onClick={() => setMapType('satellite')}
        >
          Satellite
        </button>
      </div>

      {/* Top Right Actions: Full Screen Toggle + Recenter */}
      <div style={isFullscreen ? styles.topRightControlsFullscreen : styles.topRightControls}>
        {isFullscreen ? (
          <button
            type="button"
            className="transition-all duration-150 hover:bg-slate-100 active:scale-95 cursor-pointer"
            style={styles.exitFullscreenBtn}
            onClick={() => setIsFullscreen(false)}
            title="Exit Full Screen (Esc)"
          >
            <Minimize2 size={14} color="#0F172A" strokeWidth={2.4} />
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#0F172A' }}>Exit Full Screen</span>
          </button>
        ) : (
          <button
            type="button"
            className="transition-all duration-150 hover:bg-slate-50 active:scale-95 cursor-pointer"
            style={styles.iconBtn}
            onClick={() => setIsFullscreen(true)}
            title="View Full Screen"
            aria-label="View Full Screen"
          >
            <Maximize2 size={15} color="#1A2FB8" strokeWidth={2.2} />
          </button>
        )}

        <button
          type="button"
          className="transition-all duration-150 hover:bg-slate-50 active:scale-95 cursor-pointer"
          style={styles.iconBtn}
          onClick={handleRecenter}
          title="Re-center to my location"
          aria-label="Re-center to my location"
        >
          <LocateFixed size={15} color="#1A2FB8" strokeWidth={2.2} />
        </button>
      </div>

      {/* Leaflet Map DOM Canvas */}
      <div ref={mapContainerRef} style={styles.mapElement} />

      {/* Floating Bottom Drawer in Fullscreen Mode */}
      {isFullscreen && activeSelectedTank && (
        <div style={styles.fullscreenDrawer} className="animate-fade-in">
          <div style={styles.drawerLeft}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                {activeSelectedTank.name}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: activeSelectedTank.due ? '#FEF3C7' : '#DCFCE7',
                color: activeSelectedTank.due ? '#B45309' : '#15803D',
              }}>
                {activeSelectedTank.status || 'Optimal'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              {activeSelectedTank.farmer || 'Assigned Tank'} • {activeSelectedTank.distance || '0.8 km away'}
            </div>
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
      )}
    </div>
  );
};

const styles = {
  mapWrapper: {
    width: '100%',
    height: 'clamp(240px, 38vh, 360px)',
    borderRadius: '12px',
    overflow: 'hidden',
    border: 'none',
    position: 'relative',
    zIndex: 1,
    boxShadow: 'none',
    outline: 'none',
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
    borderRadius: 0,
    overflow: 'hidden',
    outline: 'none',
  },
  mapElement: {
    width: '100%',
    height: '100%',
    outline: 'none',
    border: 'none',
  },
  mapTypeControls: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    zIndex: 999,
    display: 'flex',
    borderRadius: '8px',
    padding: '2px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
    border: '1px solid #E2E8F0',
  },
  mapTypeControlsFullscreen: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    zIndex: 999,
    display: 'flex',
    borderRadius: '10px',
    padding: '3px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.12)',
    border: '1px solid #CBD5E1',
  },
  topRightControls: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  topRightControlsFullscreen: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  iconBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(8px)',
    border: '1px solid #E2E8F0',
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
  typeBtn: {
    border: 'none',
    padding: '4px 10px',
    fontSize: '11px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    transition: 'all 0.15s ease',
  },
  fullscreenDrawer: {
    position: 'absolute',
    bottom: '24px',
    left: '16px',
    right: '16px',
    maxWidth: '520px',
    margin: '0 auto',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    backdropFilter: 'blur(12px)',
    borderRadius: '14px',
    padding: '12px 18px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    zIndex: 1000,
  },
  drawerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  closeDrawerBtn: {
    background: 'none',
    border: 'none',
    padding: '6px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default FarmLeafletMap;
