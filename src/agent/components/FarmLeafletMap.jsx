import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';

const FarmLeafletMap = ({ 
  gps, 
  ponds = [], 
  selectedPond, 
  onSelectPond 
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const polygonsLayerRef = useRef(null);

  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite'

  // Default coordinate: Bhimavaram Aquaculture Zone
  const centerLat = gps?.latitude || 16.5412;
  const centerLng = gps?.longitude || 81.5234;

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([centerLat, centerLng], 14.6, {
        animate: true,
        duration: 0.8,
      });
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 14.6,
        zoomControl: false,
        attributionControl: false,
      });

      // Google Maps Standard Roadmap Tiles
      const tileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
      }).addTo(map);

      // Clean Zoom Control
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const polygonsLayer = L.layerGroup().addTo(map);
      const markersLayer = L.layerGroup().addTo(map);
      
      polygonsLayerRef.current = polygonsLayer;
      markersLayerRef.current = markersLayer;
      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch between Google Maps Roadmap and Satellite
  useEffect(() => {
    if (!tileLayerRef.current || !mapInstanceRef.current) return;

    const tileUrl = mapType === 'satellite'
      ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' // Google Hybrid Satellite
      : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'; // Google Standard Roadmap

    tileLayerRef.current.setUrl(tileUrl);
  }, [mapType]);

  // Update center, pond water bodies, and pond markers (Radius removed)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const polygonsLayer = polygonsLayerRef.current;
    if (!map || !markersLayer || !polygonsLayer) return;

    markersLayer.clearLayers();
    polygonsLayer.clearLayers();

    // 1. LIVE TECHNICIAN BEACON (Clean dot only, no radius)
    const gmapsUserIcon = L.divIcon({
      className: 'gmaps-user-marker',
      html: `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -50%); pointer-events:none;">
          <div style="width:16px; height:16px; border-radius:50%; background:#1A73E8; border:2.5px solid #FFFFFF; box-shadow:0 1px 5px rgba(0,0,0,0.3); z-index:2;"></div>
          <div style="background:#1A73E8; color:#FFFFFF; font-size:9px; font-weight:800; padding:1px 5px; border-radius:4px; margin-top:2px; white-space:nowrap; box-shadow:0 1px 3px rgba(0,0,0,0.25); border:1px solid #FFFFFF;">You</div>
        </div>
      `,
      iconSize: [0, 0],
    });

    L.marker([centerLat, centerLng], { icon: gmapsUserIcon, zIndexOffset: 1000 }).addTo(markersLayer);

    // 2. SAMPLE FAR-AWAY POND / TANK WATER BODIES (Spread out across wider area)
    const pondGeometries = [
      { offsetLat: 0.0035, offsetLng: -0.0042, width: 0.0016, height: 0.0012, name: 'Tank 1' },
      { offsetLat: 0.0042, offsetLng: 0.0050, width: 0.0018, height: 0.0012, name: 'Tank 2' },
      { offsetLat: -0.0038, offsetLng: -0.0035, width: 0.0016, height: 0.0012, name: 'Tank 3' },
      { offsetLat: -0.0045, offsetLng: 0.0048, width: 0.0018, height: 0.0012, name: 'Tank 4' },
    ];

    ponds.forEach((pond, idx) => {
      const geom = pondGeometries[idx % pondGeometries.length];
      const pLat = centerLat + geom.offsetLat;
      const pLng = centerLng + geom.offsetLng;
      const isSelected = selectedPond?.id === pond.id;

      // Draw rectangular water tank polygon on map
      const bounds = [
        [pLat - geom.height / 2, pLng - geom.width / 2],
        [pLat + geom.height / 2, pLng + geom.width / 2],
      ];

      const pondPolygon = L.rectangle(bounds, {
        color: isSelected ? '#0018AD' : (pond.due ? '#EA4335' : '#0284C7'),
        weight: isSelected ? 2.5 : 1.5,
        fillColor: isSelected ? '#0018AD' : '#38BDF8',
        fillOpacity: isSelected ? 0.35 : 0.22,
        dashArray: isSelected ? null : '2, 3',
      }).addTo(polygonsLayer);

      pondPolygon.on('click', () => {
        if (onSelectPond) onSelectPond(pond);
      });

      // 3. POND / AQUACULTURE TANK WATER SYMBOL PIN
      const pinBg = isSelected ? '#0018AD' : (pond.due ? '#FEF2F2' : '#FFFFFF');
      const pinBorder = isSelected ? '#0018AD' : (pond.due ? '#EA4335' : '#0284C7');
      const textColor = isSelected ? '#FFFFFF' : '#0F172A';
      const waveColor = isSelected ? '#93C5FD' : (pond.due ? '#EF4444' : '#0284C7');

      const pondSymbolIcon = L.divIcon({
        className: 'gmaps-pond-symbol-marker',
        html: `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -100%); cursor:pointer;">
            
            <!-- Aquaculture Tank Symbol Badge -->
            <div style="
              display:flex;
              align-items:center;
              gap:5px;
              background:${pinBg};
              border:1.5px solid ${pinBorder};
              padding:3px 7px 3px 5px;
              border-radius:16px;
              box-shadow:0 3px 8px rgba(0,0,0,0.2);
              transform:${isSelected ? 'scale(1.12)' : 'scale(1)'};
              transition:transform 0.15s ease;
              white-space:nowrap;
            ">
              <!-- Water Wave / Pond Tank Icon -->
              <div style="
                width:20px;
                height:20px;
                border-radius:50%;
                background:${isSelected ? 'rgba(255,255,255,0.2)' : '#E0F2FE'};
                display:flex;
                align-items:center;
                justify-content:center;
              ">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${waveColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                  <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                  <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                </svg>
              </div>

              <!-- Tank Label -->
              <span style="
                font-size:11px;
                font-weight:700;
                color:${textColor};
                font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              ">
                ${pond.name}
              </span>

              ${pond.due && !isSelected ? '<span style="width:6px;height:6px;border-radius:50%;background:#EA4335;"></span>' : ''}
            </div>

            <!-- Pointer Arrow Indicator -->
            <div style="
              width:0;
              height:0;
              border-left:5px solid transparent;
              border-right:5px solid transparent;
              border-top:6px solid ${pinBorder};
              margin-top:-1px;
            "></div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([pLat, pLng], { 
        icon: pondSymbolIcon,
        zIndexOffset: isSelected ? 500 : 100 
      }).addTo(markersLayer);

      marker.on('click', () => {
        if (onSelectPond) onSelectPond(pond);
      });
    });
  }, [centerLat, centerLng, gps, ponds, selectedPond, onSelectPond]);

  return (
    <div style={styles.mapWrapper}>
      {/* Google Maps Style Map/Satellite Toggle */}
      <div style={styles.mapTypeControls}>
        <button
          type="button"
          style={{
            ...styles.typeBtn,
            backgroundColor: mapType === 'roadmap' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.88)',
            color: mapType === 'roadmap' ? '#1A73E8' : '#5F6368',
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
            backgroundColor: mapType === 'satellite' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.88)',
            color: mapType === 'satellite' ? '#1A73E8' : '#5F6368',
            fontWeight: mapType === 'satellite' ? '700' : '500',
          }}
          onClick={() => setMapType('satellite')}
        >
          Satellite
        </button>
      </div>

      {/* Google Maps Style Recenter Button */}
      <button
        type="button"
        className="transition-all duration-150 hover:bg-slate-50 active:scale-90 cursor-pointer"
        style={styles.recenterBtn}
        onClick={handleRecenter}
        title="Re-center to my location"
        aria-label="Re-center to my location"
      >
        <LocateFixed size={16} color="#1A73E8" strokeWidth={2.4} />
      </button>

      <div ref={mapContainerRef} style={styles.mapElement} />
    </div>
  );
};

const styles = {
  mapWrapper: {
    width: '100%',
    height: '230px',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid #DADCE0',
    position: 'relative',
    zIndex: 1,
    boxShadow: '0 1px 3px rgba(60, 64, 67, 0.08)',
  },
  mapElement: {
    width: '100%',
    height: '100%',
  },
  mapTypeControls: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    zIndex: 999,
    display: 'flex',
    borderRadius: '6px',
    overflow: 'hidden',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
    border: '1px solid #DADCE0',
  },
  typeBtn: {
    border: 'none',
    padding: '4px 10px',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'Roboto, Arial, sans-serif',
    transition: 'all 0.15s ease',
  },
  recenterBtn: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: 999,
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
    border: '1px solid #DADCE0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  },
};

export default FarmLeafletMap;
