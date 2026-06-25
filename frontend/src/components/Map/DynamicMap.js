'use client';

import { useEffect, useRef } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function DynamicMap({ 
  selectedRoute = 'safest', 
  userLocation = null,
  navigationPosition = null,
  navigationActive = false,
  currentBearing = 0,
  path = []
}) {
  const mapRef = useRef(null);
  
  const currentPath = path || [];
  const hasPath = currentPath.length > 0;

  const routeColors = {
    safest: '#0fa58a',
    balanced: '#F5A623',
    fastest: '#ba1a1a'
  };

  const activeColor = routeColors[selectedRoute] || routeColors.safest;

  const defaultCenter = [77.5655, 12.9610]; // MapLibre is [lng, lat]
  const centerPoint = hasPath ? currentPath[0] : defaultCenter;

  // Handle map animations
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    if (navigationActive && navigationPosition) {
      map.easeTo({
        center: navigationPosition,
        zoom: 18,
        pitch: 60,
        bearing: currentBearing,
        duration: 1000,
        essential: true
      });
    } else if (hasPath && currentPath.length > 1) {
      // Create a bounding box and fit bounds
      const bounds = currentPath.reduce((acc, coord) => {
        return [
          [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])],
          [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])]
        ];
      }, [[currentPath[0][0], currentPath[0][1]], [currentPath[0][0], currentPath[0][1]]]);
      
      map.fitBounds(bounds, {
        padding: 50,
        pitch: 0,
        bearing: 0,
        duration: 1500
      });
    }
  }, [hasPath, currentPath, navigationPosition, navigationActive, currentBearing]);

  const geojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: currentPath
    }
  };

  return (
    <div className="w-full h-full relative">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: centerPoint[0],
          latitude: centerPoint[1],
          zoom: 13
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        {hasPath && (
          <Source id="route" type="geojson" data={geojson}>
            {/* Background casing line */}
            <Layer
              id="route-casing"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': activeColor,
                'line-width': 14,
                'line-opacity': 0.2
              }}
            />
            {/* Core route line */}
            <Layer
              id="route-line"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': activeColor,
                'line-width': 6,
                'line-opacity': 0.85
              }}
            />
          </Source>
        )}

        {hasPath && !navigationActive && currentPath.length > 0 && (
          <>
            <Marker longitude={currentPath[0][0]} latitude={currentPath[0][1]} anchor="bottom">
              <div className="custom-pin">
                <div className="radar-wave bg-[#0fa58a]/30"></div>
                <div className="pin-marker">
                  <svg viewBox="0 0 24 30" width="30" height="38" fill="#0fa58a" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18c0-6.63-5.37-12-12-12zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
                  </svg>
                  <div className="pin-inner-dot bg-white"></div>
                </div>
                <div className="pin-shadow"></div>
              </div>
            </Marker>
            
            <Marker longitude={currentPath[currentPath.length - 1][0]} latitude={currentPath[currentPath.length - 1][1]} anchor="bottom">
              <div className="custom-pin">
                <div className="radar-wave bg-error/30"></div>
                <div className="pin-marker">
                  <svg viewBox="0 0 24 30" width="30" height="38" fill="#ba1a1a" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18c0-6.63-5.37-12-12-12zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
                  </svg>
                  <div className="pin-inner-dot bg-white"></div>
                </div>
                <div className="pin-shadow"></div>
              </div>
            </Marker>
          </>
        )}

        {/* User Location Marker */}
        {userLocation && !navigationActive && (
          <Marker longitude={userLocation[1]} latitude={userLocation[0]} anchor="center">
            <div className="user-avatar-marker">
              <div className="radar-wave bg-primary/40"></div>
              <div className="user-pulse-dot bg-[#006b59] border-2 border-white shadow-xl"></div>
            </div>
          </Marker>
        )}

        {/* Navigation Indicator */}
        {navigationActive && navigationPosition && (
          <Marker longitude={navigationPosition[0]} latitude={navigationPosition[1]} anchor="center">
            <div className="user-avatar-marker" style={{ transform: `rotate(${currentBearing}deg)` }}>
              <div className="radar-wave bg-primary/40"></div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-white shadow-xl shadow-primary/50 relative">
                  {/* Directional arrow pointing 'up' relative to the rotated container */}
                  <div className="absolute -top-1 w-0 h-0 border-l-4 border-r-4 border-b-[8px] border-l-transparent border-r-transparent border-b-white"></div>
              </div>
            </div>
          </Marker>
        )}
      </Map>
    </div>
  );
}
