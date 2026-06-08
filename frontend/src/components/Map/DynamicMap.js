'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function MapController({ path, navigationPosition, navigationActive }) {
  const map = useMap();
  
  useEffect(() => {
    if (navigationActive && navigationPosition) {
      map.panTo(navigationPosition, { animate: true, duration: 0.8 });
    } else if (path && path.length > 0) {
      map.fitBounds(path, { padding: [100, 100], animate: true, duration: 1.5 });
    }
  }, [path, navigationPosition, navigationActive, map]);
  
  return null;
}

export default function DynamicMap({ 
  selectedRoute = 'safest', 
  userLocation = null,
  navigationPosition = null,
  navigationActive = false
}) {
  const routes = {
    safest: [
      [12.9610, 77.5655],
      [12.9612, 77.5670],
      [12.9615, 77.5700],
      [12.9620, 77.5740],
      [12.9645, 77.5780],
      [12.9660, 77.5850],
      [12.9680, 77.5920],
      [12.9698, 77.5975],
      [12.9715, 77.6080],
      [12.9725, 77.6150],
      [12.9731, 77.6210],
      [12.9750, 77.6280],
      [12.9765, 77.6350],
      [12.9784, 77.6408],
    ],
    balanced: [
      [12.9610, 77.5655],
      [12.9580, 77.5700],
      [12.9550, 77.5800],
      [12.9560, 77.5900],
      [12.9520, 77.6050],
      [12.9540, 77.6150],
      [12.9560, 77.6250],
      [12.9620, 77.6300],
      [12.9700, 77.6350],
      [12.9784, 77.6408],
    ],
    fastest: [
      [12.9610, 77.5655],
      [12.9680, 77.5720],
      [12.9730, 77.5780],
      [12.9780, 77.5850],
      [12.9790, 77.5980],
      [12.9800, 77.6120],
      [12.9795, 77.6250],
      [12.9784, 77.6408],
    ]
  };

  const currentPath = routes[selectedRoute] || routes.safest;

  const routeColors = {
    safest: '#0fa58a',
    balanced: '#F5A623',
    fastest: '#ba1a1a'
  };

  const activeColor = routeColors[selectedRoute] || routeColors.safest;

  const startIcon = typeof window !== 'undefined' ? L.divIcon({
    className: 'leaflet-custom-marker-start',
    html: `<div class="custom-pin">
             <div class="radar-wave bg-[#0fa58a]/30"></div>
             <div class="pin-marker">
               <svg viewBox="0 0 24 30" width="30" height="38" fill="#0fa58a" xmlns="http://www.w3.org/2000/svg">
                 <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18c0-6.63-5.37-12-12-12zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
               </svg>
               <div class="pin-inner-dot bg-white"></div>
             </div>
             <div class="pin-shadow"></div>
           </div>`,
    iconSize: [40, 50],
    iconAnchor: [20, 42]
  }) : null;

  const endIcon = typeof window !== 'undefined' ? L.divIcon({
    className: 'leaflet-custom-marker-end',
    html: `<div class="custom-pin">
             <div class="radar-wave bg-error/30"></div>
             <div class="pin-marker">
               <svg viewBox="0 0 24 30" width="30" height="38" fill="#ba1a1a" xmlns="http://www.w3.org/2000/svg">
                 <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18c0-6.63-5.37-12-12-12zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
               </svg>
               <div class="pin-inner-dot bg-white"></div>
             </div>
             <div class="pin-shadow"></div>
           </div>`,
    iconSize: [40, 50],
    iconAnchor: [20, 42]
  }) : null;

  const userIcon = typeof window !== 'undefined' ? L.divIcon({
    className: 'leaflet-user-location-marker',
    html: `<div class="user-avatar-marker">
             <div class="radar-wave bg-primary/40"></div>
             <div class="user-pulse-dot bg-[#006b59] border-2 border-white shadow-xl"></div>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  }) : null;

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        center={currentPath[0]} 
        zoom={13} 
        zoomControl={false}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <MapController 
          path={currentPath} 
          navigationPosition={navigationPosition} 
          navigationActive={navigationActive} 
        />
        
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <Polyline 
          positions={currentPath} 
          pathOptions={{ 
            color: activeColor, 
            weight: 6, 
            opacity: 0.85,
            lineJoin: 'round',
            lineCap: 'round'
          }} 
        />
        
        <Polyline 
          positions={currentPath} 
          pathOptions={{ 
            color: activeColor, 
            weight: 14, 
            opacity: 0.2,
            lineJoin: 'round',
            lineCap: 'round'
          }} 
        />

        {startIcon && (
          <Marker position={currentPath[0]} icon={startIcon}>
            <Popup>
              <div className="p-1 font-sans">
                <p className="font-bold text-primary text-sm">Start: BMSCE</p>
                <p className="text-xs text-on-surface-variant">Bull Temple Road</p>
              </div>
            </Popup>
          </Marker>
        )}

        {endIcon && (
          <Marker position={currentPath[currentPath.length - 1]} icon={endIcon}>
            <Popup>
              <div className="p-1 font-sans">
                <p className="font-bold text-error text-sm">Destination</p>
                <p className="text-xs text-on-surface-variant">Indiranagar Metro Station</p>
              </div>
            </Popup>
          </Marker>
        )}

        {userLocation && userIcon && !navigationActive && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="p-1 text-xs font-semibold">Your current location</div>
            </Popup>
          </Marker>
        )}

        {navigationActive && navigationPosition && userIcon && (
          <Marker position={navigationPosition} icon={userIcon} />
        )}

        <ZoomControl position="bottomright" />
      </MapContainer>
    </div>
  );
}
