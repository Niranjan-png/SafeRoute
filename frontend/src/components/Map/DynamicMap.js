'use client';

import { useEffect, useRef } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { crimeHeatmapGeoJSON } from '../../data/crimeHeatmapData';
import {
  POLICE_STATIONS,
  CCTV_CAMERAS,
  HOSPITALS,
  METRO_STATIONS,
  STREETLIGHT_ZONES,
  BUS_STANDS,
  WOMEN_SAFETY_POINTS
} from '../../data/safetyInfrastructureData';

export default function DynamicMap({
  selectedRoute = 'safest',
  userLocation = null,
  navigationPosition = null,
  navigationActive = false,
  currentBearing = 0,
  path = [],
  showHeatmap = true,
  visibleLayers = {}
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
        {/* 3D Buildings */}
        <Layer
          id="3d-buildings"
          source="carto"
          source-layer="building"
          type="fill-extrusion"
          minzoom={15}
          paint={{
            'fill-extrusion-color': '#e2e8f0',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15, 0,
              15.05, ['coalesce', ['get', 'render_height'], ['get', 'height'], 20]
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15, 0,
              15.05, ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0]
            ],
            'fill-extrusion-opacity': 0.8
          }}
        />

        {/* Crime Safety Heatmap Layer */}
        {showHeatmap && (
          <Source id="crime-heatmap" type="geojson" data={crimeHeatmapGeoJSON}>
            <Layer
              id="crime-heat"
              type="heatmap"
              paint={{
                // Increase weight based on intensity property
                'heatmap-weight': [
                  'interpolate', ['linear'],
                  ['get', 'intensity'],
                  0, 0,
                  1, 1
                ],
                // Increase intensity as zoom level increases
                'heatmap-intensity': [
                  'interpolate', ['linear'],
                  ['zoom'],
                  10, 0.8,
                  15, 2.5
                ],
                // Assign color values for heatmap density
                'heatmap-color': [
                  'interpolate', ['linear'],
                  ['heatmap-density'],
                  0, 'rgba(0, 0, 0, 0)',
                  0.1, 'rgba(15, 165, 138, 0.15)',
                  0.3, 'rgba(255, 235, 59, 0.4)',
                  0.5, 'rgba(255, 152, 0, 0.55)',
                  0.7, 'rgba(244, 67, 54, 0.7)',
                  1, 'rgba(183, 28, 28, 0.85)'
                ],
                // Adjust heatmap radius by zoom level
                'heatmap-radius': [
                  'interpolate', ['linear'],
                  ['zoom'],
                  10, 20,
                  13, 35,
                  16, 50
                ],
                // Fade out heatmap at high zooms
                'heatmap-opacity': [
                  'interpolate', ['linear'],
                  ['zoom'],
                  14, 0.8,
                  18, 0.3
                ]
              }}
            />
          </Source>
        )}

        {/* Police Stations */}
        {visibleLayers.police && POLICE_STATIONS.map((s, i) => (
          <Marker key={`police-${i}`} longitude={s.coords[0]} latitude={s.coords[1]} anchor="center">
            <div className="infra-marker" title={s.name}>
              <div style={{ background: '#1565C0' }} className="w-3.5 h-3.5 rounded-sm flex items-center justify-center shadow-sm border-[0.5px] border-white/80">
                <span className="material-symbols-outlined text-white text-[9px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_police</span>
              </div>
            </div>
          </Marker>
        ))}

        {/* CCTV Cameras */}
        {visibleLayers.cctv && CCTV_CAMERAS.map((c, i) => (
          <Marker key={`cctv-${i}`} longitude={c.coords[0]} latitude={c.coords[1]} anchor="center">
            <div className="infra-marker" title={`${c.area} (${c.count} cameras)`}>
              <div style={{ background: '#E0F2F1' }} className="w-3.5 h-3.5 rounded-sm flex items-center justify-center shadow-sm border border-teal-500/30">
                <span className="material-symbols-outlined text-teal-900 text-[9px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
              </div>
            </div>
          </Marker>
        ))}

        {/* Hospitals */}
        {visibleLayers.hospitals && HOSPITALS.map((h, i) => (
          <Marker key={`hosp-${i}`} longitude={h.coords[0]} latitude={h.coords[1]} anchor="center">
            <div className="infra-marker" title={h.name}>
              <div style={{ background: '#C62828' }} className="w-3.5 h-3.5 rounded-sm flex items-center justify-center shadow-sm border-[0.5px] border-white/80">
                <span className="material-symbols-outlined text-white text-[9px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
              </div>
            </div>
          </Marker>
        ))}

        {/* Metro Stations */}
        {visibleLayers.metro && METRO_STATIONS.map((m, i) => {
          const bg = m.line === 'purple' ? '#6A1B9A' : m.line === 'green' ? '#2E7D32' : '#EF6C00';
          return (
            <Marker key={`metro-${i}`} longitude={m.coords[0]} latitude={m.coords[1]} anchor="center">
              <div className="infra-marker" title={m.name}>
                <div style={{ background: bg }} className="w-3 h-3 rounded-sm flex items-center justify-center shadow-sm border-[0.5px] border-white/80">
                  <span className="material-symbols-outlined text-white text-[8px]" style={{ fontVariationSettings: "'FILL' 1" }}>train</span>
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Streetlight Coverage — radial glow effect */}
        {visibleLayers.streetlights && STREETLIGHT_ZONES.map((s, i) => {
          const glowColor = s.status === 'good' ? 'rgba(255,235,59,0.25)' : s.status === 'moderate' ? 'rgba(255,183,77,0.20)' : 'rgba(0,0,0,0)';
          const borderColor = s.status === 'good' ? 'rgba(255,235,59,0.5)' : s.status === 'moderate' ? 'rgba(255,183,77,0.4)' : 'rgba(211,47,47,0.3)';
          const dotColor = s.status === 'good' ? '#F9A825' : s.status === 'moderate' ? '#FF8F00' : '#C62828';
          const glowSize = s.status === 'poor' ? 20 : Math.max(25, Math.min(45, s.coverage * 0.45));
          return (
            <Marker key={`light-${i}`} longitude={s.coords[0]} latitude={s.coords[1]} anchor="center">
              <div className="streetlight-marker" title={`${s.area} — ${s.coverage}% coverage`}>
                <div className="streetlight-glow" style={{
                  width: `${glowSize}px`,
                  height: `${glowSize}px`,
                  background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{ background: dotColor }} className="w-2.5 h-2.5 rounded-full flex items-center justify-center border-[0.5px] border-white/60">
                    <span className="material-symbols-outlined text-white text-[6px]" style={{ fontVariationSettings: "'FILL' 1" }}>{s.status === 'poor' ? 'light_off' : 'lightbulb'}</span>
                  </div>
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Bus Stands */}
        {visibleLayers.busStands && BUS_STANDS.map((b, i) => (
          <Marker key={`bus-${i}`} longitude={b.coords[0]} latitude={b.coords[1]} anchor="center">
            <div className="infra-marker" title={b.name}>
              <div style={{ background: '#00695C' }} className="w-3.5 h-3.5 rounded-sm flex items-center justify-center shadow-sm border-[0.5px] border-white/80">
                <span className="material-symbols-outlined text-white text-[9px]" style={{ fontVariationSettings: "'FILL' 1" }}>directions_bus</span>
              </div>
            </div>
          </Marker>
        ))}

        {/* Women Safety Points */}
        {visibleLayers.womenSafety && WOMEN_SAFETY_POINTS.map((w, i) => (
          <Marker key={`ws-${i}`} longitude={w.coords[0]} latitude={w.coords[1]} anchor="center">
            <div className="infra-marker" title={w.name}>
              <div style={{ background: '#AD1457' }} className="w-3.5 h-3.5 rounded-sm flex items-center justify-center shadow-sm border-[0.5px] border-white/80">
                <span className="material-symbols-outlined text-white text-[9px]" style={{ fontVariationSettings: "'FILL' 1" }}>{w.type === 'she_team' ? 'shield' : w.type === 'pink_booth' ? 'support_agent' : 'help'}</span>
              </div>
            </div>
          </Marker>
        ))}

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
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18c0-6.63-5.37-12-12-12zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
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
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18c0-6.63-5.37-12-12-12zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
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
