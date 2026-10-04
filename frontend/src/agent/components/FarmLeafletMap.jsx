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

  // Default coordinate: Bhimavaram Aquaculture Zone
  const centerLat = gps?.latitude || 16.5412;
  const centerLng = gps?.longitude || 81.5234;

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([centerLat, centerLng], 14.8, {
        animate: true,
        duration: 0.6,
      });
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

    L.marker([centerLat, centerLng], { icon: cleanUserBeacon, zIndexOffset: 1000 }).addTo(markersLayer);

    // 2. TANK LOCATIONS (Solid Big Colour Dots)
    const tankGeometries = [
      { offsetLat: 0.0035, offsetLng: -0.0042, name: 'Tank 1' },
      { offsetLat: 0.0042, offsetLng: 0.0050, name: 'Tank 2' },
      { offsetLat: -0.0038, offsetLng: -0.0035, name: 'Tank 3' },
      { offsetLat: -0.0045, offsetLng: 0.0048, name: 'Tank 4' },
    ];

    activeTanks.forEach((tank, idx) => {
      const geom = tankGeometries[idx % tankGeometries.length];
      const pLat = tank.latitude || (centerLat + geom.offsetLat);
      const pLng = tank.longitude || (centerLng + geom.offsetLng);
      const isSelected = activeSelectedTank?.id === tank.id || activeSelectedTank?.name === tank.name;

      // Color coding: Overdue = Red (#DC2626), Due = Amber (#D97706), Optimal/Normal = Brand Blue (#1A2FB8)
      const isOverdue = tank.testStatus === 'Overdue' || tank.isOverdue || tank.status === 'Overdue';
      const isDue = tank.due || tank.testStatus === 'Due' || tank.status === 'Due';
      const dotColor = isOverdue ? '#DC2626' : (isDue ? '#D97706' : '#1A2FB8');
      const dotSize = isSelected ? 24 : 20;

      // Solid Big Colour Dot Icon with crisp name badge
      const tankDotIcon = L.divIcon({
        className: 'solid-tank-dot-marker',
        html: `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -50%); cursor:pointer;">
            ${isSelected ? `
              <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:38px; height:38px; border-radius:50%; background:${dotColor}; opacity:0.32; animation:mapBeaconPulse 2s cubic-bezier(0.2, 0.6, 0.35, 1) infinite; pointer-events:none;"></div>
            ` : ''}

            <!-- Solid Big Colour Dot -->
            <div style="
              width:${dotSize}px;
              height:${dotSize}px;
              border-radius:50%;
              background:${dotColor};
              border:${isSelected ? '3px' : '2.5px'} solid #FFFFFF;
              box-shadow:0 3px 8px rgba(15,23,42,0.38);
              z-index:2;
              transition:transform 0.15s ease;
            "></div>

            <!-- Crisp Tank Name Badge -->
            <div style="
              margin-top:4px;
              background:rgba(255, 255, 255, 0.96);
              color:#0F172A;
              font-size:11px;
              font-weight:700;
              padding:2px 7px;
              border-radius:6px;
              box-shadow:0 2px 5px rgba(0,0,0,0.14);
              border:1px solid #E2E8F0;
              white-space:nowrap;
              pointer-events:none;
              line-height:1.2;
            ">
              ${tank.name}
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([pLat, pLng], { 
        icon: tankDotIcon,
        zIndexOffset: isSelected ? 500 : 100 
      }).addTo(markersLayer);

      const onSelect = () => {
        setInternalSelectedTank(tank);
        if (handleSelect) handleSelect(tank);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([pLat, pLng], { animate: true });
        }
      };

      marker.on('click', onSelect);
    });
  }, [centerLat, centerLng, gps, activeTanks, activeSelectedTank, handleSelect]);

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
