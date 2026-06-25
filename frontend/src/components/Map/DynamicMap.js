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
  navigationActive = false,
  path = []
}) {
  const currentPath = path || [];
  const hasPath = currentPath.length > 0;

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

  const defaultCenter = [12.9610, 77.5655];
  const centerPoint = hasPath ? currentPath[0] : defaultCenter;

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        center={centerPoint} 
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
        
        {hasPath && (
          <>
            <Polyline 
              positions={currentPath} 
              pathOptions={{ 
                color: activeColor, 
                weight: 6, 
                opacity: 0.85,
                lineJoin: 'round',
                lineCap: 'round',
                smoothFactor: 1
              }} 
            />
            
            <Polyline 
              positions={currentPath} 
              pathOptions={{ 
                color: activeColor, 
                weight: 14, 
                opacity: 0.2,
                lineJoin: 'round',
                lineCap: 'round',
                smoothFactor: 1
              }} 
            />

            {startIcon && (
              <Marker position={currentPath[0]} icon={startIcon}>
                <Popup>
                  <div className="p-1 font-sans">
                    <p className="font-bold text-primary text-sm">Start Location</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {endIcon && (
              <Marker position={currentPath[currentPath.length - 1]} icon={endIcon}>
                <Popup>
                  <div className="p-1 font-sans">
                    <p className="font-bold text-error text-sm">Destination</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </>
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
