'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Map from '../components/Map/Map';
import Logo from '../components/Logo';
import { fetchRoutes, triggerSOSEmergency } from '../utils/api';
import { getDistance, getBearing } from '../utils/navigation';
import { fetchOSRMRoutes, getStepIcon } from '../utils/osrm';

export default function Home() {
  const [selectedRoute, setSelectedRoute] = useState('safest');
  const [transitMode, setTransitMode] = useState('walking');
  const [sosStatus, setSosStatus] = useState('idle');
  const [sosCountdown, setSosCountdown] = useState(3);
  const [navigationActive, setNavigationActive] = useState(false);
  const [navigationStep, setNavigationStep] = useState(0);
  const [simulatedCoords, setSimulatedCoords] = useState(null);
  const [currentBearing, setCurrentBearing] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('unknown');
  const [toast, setToast] = useState(null);
  const [showDirectionsList, setShowDirectionsList] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState({
    police: false,
    cctv: false,
    hospitals: false,
    metro: false,
    streetlights: false,
    busStands: false,
    womenSafety: false,
  });

  const [showMethodology, setShowMethodology] = useState(false);

  const toggleLayer = (key) => {
    setVisibleLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Source location mode: 'gps' or 'manual'
  const [sourceMode, setSourceMode] = useState('gps');
  const [sourceText, setSourceText] = useState('');
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [resolvedSource, setResolvedSource] = useState(null);

  const BENGALURU_LANDMARKS = {
    'BMS College of Engineering': { lat: 12.9410, lng: 77.5655 },
    'Koramangala': { lat: 12.9352, lng: 77.6245 },
    'Indiranagar': { lat: 12.9784, lng: 77.6408 },
    'Indiranagar Metro Station': { lat: 12.9784, lng: 77.6408 },
    'MG Road': { lat: 12.9756, lng: 77.6068 },
    'MG Road Metro': { lat: 12.9756, lng: 77.6068 },
    'Whitefield': { lat: 12.9698, lng: 77.7500 },
    'Majestic': { lat: 12.9716, lng: 77.5946 },
    'Majestic Bus Station': { lat: 12.9716, lng: 77.5946 },
    'JP Nagar': { lat: 12.9063, lng: 77.5857 },
    'HSR Layout': { lat: 12.9116, lng: 77.6389 },
    'Jayanagar': { lat: 12.9250, lng: 77.5838 },
    'Brigade Road': { lat: 12.9730, lng: 77.6070 },
    'Church Street': { lat: 12.9750, lng: 77.6060 },
    'Cubbon Park': { lat: 12.9763, lng: 77.5929 },
    'Lalbagh': { lat: 12.9507, lng: 77.5848 },
    'Bannerghatta Road': { lat: 12.9063, lng: 77.5970 },
  };

  const handleSourceTextChange = (text) => {
    setSourceText(text);
    if (text.length > 1) {
      const matches = Object.keys(BENGALURU_LANDMARKS).filter(name =>
        name.toLowerCase().includes(text.toLowerCase())
      );
      setSourceSuggestions(matches.slice(0, 5));
    } else {
      setSourceSuggestions([]);
    }
    // Clear resolved source if text changed
    setResolvedSource(null);
  };

  const selectSourceSuggestion = (name) => {
    setSourceText(name);
    setResolvedSource(BENGALURU_LANDMARKS[name]);
    setSourceSuggestions([]);
  };

  const performSourceSearch = () => {
    if (sourceSuggestions.length > 0) {
      selectSourceSuggestion(sourceSuggestions[0]);
    } else {
      const query = sourceText.toLowerCase().trim();
      const bestMatch = Object.keys(BENGALURU_LANDMARKS).find(name =>
        name.toLowerCase() === query || name.toLowerCase().includes(query)
      );
      if (bestMatch) {
        selectSourceSuggestion(bestMatch);
      } else {
        setToast(`Location "${sourceText}" not found. Try BMS College, Koramangala, etc.`);
        setTimeout(() => setToast(null), 3000);
      }
    }
  };

  // Destination state
  const [destinationText, setDestinationText] = useState('Indiranagar Metro Station');
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [resolvedDestination, setResolvedDestination] = useState({ lat: 12.9784, lng: 77.6408 });

  const handleDestinationTextChange = (text) => {
    setDestinationText(text);
    if (text.length > 1) {
      const matches = Object.keys(BENGALURU_LANDMARKS).filter(name =>
        name.toLowerCase().includes(text.toLowerCase())
      );
      setDestinationSuggestions(matches.slice(0, 5));
    } else {
      setDestinationSuggestions([]);
    }
    setResolvedDestination(null);
  };

  const selectDestinationSuggestion = (name) => {
    setDestinationText(name);
    setResolvedDestination(BENGALURU_LANDMARKS[name]);
    setDestinationSuggestions([]);
  };

  const performDestinationSearch = () => {
    if (destinationSuggestions.length > 0) {
      selectDestinationSuggestion(destinationSuggestions[0]);
    } else {
      const query = destinationText.toLowerCase().trim();
      const bestMatch = Object.keys(BENGALURU_LANDMARKS).find(name =>
        name.toLowerCase() === query || name.toLowerCase().includes(query)
      );
      if (bestMatch) {
        selectDestinationSuggestion(bestMatch);
      } else {
        setToast(`Destination "${destinationText}" not found. Try Indiranagar, MG Road, etc.`);
        setTimeout(() => setToast(null), 3000);
      }
    }
  };

  const [routeInfo, setRouteInfo] = useState(null);
  const [routePaths, setRoutePaths] = useState({
    safest: [],
    balanced: [],
    fastest: []
  });
  const [osrmDirections, setOsrmDirections] = useState({ safest: [], balanced: [], fastest: [] });
  const [lastFetchCoords, setLastFetchCoords] = useState(null);
  const lastFetchModeRef = useRef(transitMode);

  const currentCoords = routePaths[selectedRoute] || [];
  const directions = osrmDirections[selectedRoute] || [];

  // Load default route preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPref = localStorage.getItem('route_preference');
      if (savedPref) {
        setSelectedRoute(savedPref);
      }
    }
  }, []);

  // Set up real-time geolocation tracking with watchPosition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!navigator.geolocation) {
      setLocationPermission('denied');
      return;
    }

    let watchId;

    const startWatching = () => {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
          setLocationPermission('granted');
        },
        (error) => {
          console.warn('Geolocation tracking unavailable (using fallback coordinates):', error.message || error);
          setLocationPermission('denied');
          if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    };

    startWatching();

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Fetch routing whenever transit mode, location, source, or destination changes
  useEffect(() => {
    async function loadRoutes() {
      let source;
      if (sourceMode === 'manual' && resolvedSource) {
        source = resolvedSource;
      } else if (userLocation) {
        source = { lat: userLocation[0], lng: userLocation[1] };
      } else {
        source = { lat: 12.9610, lng: 77.5655 };
      }
      const destination = resolvedDestination || { lat: 12.9784, lng: 77.6408 };

      // Prevent redundant fetches if movement is minor (under 50m) — only in GPS mode
      // Always re-fetch when transit mode changes (walk/bike/drive)
      const modeChanged = lastFetchModeRef.current !== transitMode;
      if (!modeChanged && sourceMode === 'gps' && lastFetchCoords && userLocation) {
        const dist = getDistance(lastFetchCoords[0], lastFetchCoords[1], userLocation[0], userLocation[1]);
        if (dist < 50) return;
      }
      lastFetchModeRef.current = transitMode;

      // Fetch safety scores from backend
      const data = await fetchRoutes(source, destination);

      // Fetch real road-following routes from OSRM
      const osrmRoutes = await fetchOSRMRoutes(source, destination, transitMode);

      if (osrmRoutes && osrmRoutes.length > 0) {
        // Use OSRM for road geometry, backend for safety scores
        const labels = ['safest', 'balanced', 'fastest'];
        const info = {};
        const paths = { safest: [], balanced: [], fastest: [] };
        const dirs = { safest: [], balanced: [], fastest: [] };

        // Get safety scores from backend if available
        const backendRoutes = data?.routes || [];

        osrmRoutes.forEach((osrmRoute, idx) => {
          const label = labels[Math.min(idx, labels.length - 1)];
          // Avoid overwriting if we already assigned this label
          if (info[label]) return;

          // Get matching backend safety data or generate from index
          const backendRoute = backendRoutes[idx];
          let safetyScore = backendRoute ? backendRoute.safety_score : (85 - idx * 15);
          let baseSafety = safetyScore;

          // Since the public OSRM demo server only supports driving speeds for all profiles,
          // we manually calculate realistic walking and biking times based on standard speeds.
          let durationS = osrmRoute.duration_s;
          if (transitMode === 'walking') {
            durationS = osrmRoute.distance_m / 1.4; // 1.4 m/s (~5 km/h)
          } else if (transitMode === 'biking') {
            durationS = osrmRoute.distance_m / 4.2; // 4.2 m/s (~15 km/h)
          }

          // Apply safety modifiers based on transit mode
          if (transitMode === 'biking') {
            baseSafety = Math.max(30, safetyScore - 5);
          } else if (transitMode === 'driving') {
            baseSafety = Math.min(95, safetyScore + 10);
          }

          info[label] = {
            distance: (osrmRoute.distance_m / 1000).toFixed(1) + ' km',
            time: Math.max(1, Math.round(durationS / 60)) + ' min',
            safety: Math.round(baseSafety),
            details: backendRoute?.details || {
              lighting: `${Math.round(baseSafety / 10)}/10`,
              cctv: `${Math.round(Math.max(10, baseSafety - 10) / 10)}/10`,
              density: baseSafety > 70 ? 'High' : baseSafety > 40 ? 'Medium' : 'Low'
            }
          };

          paths[label] = osrmRoute.coordinates;

          // Use OSRM's step-by-step directions
          dirs[label] = osrmRoute.steps
            .filter(s => s.type !== 'arrive' || s.distance > 0)
            .map(s => ({
              instruction: s.instruction,
              distance: s.distance,
              icon: getStepIcon(s),
              street: s.name,
              coord: s.coord,
            }));
        });

        setRouteInfo(info);
        setRoutePaths(paths);
        setOsrmDirections(dirs);
        if (userLocation) {
          setLastFetchCoords(userLocation);
        }
      } else if (data && data.routes && data.routes.length > 0) {
        // Fallback to backend paths if OSRM fails
        const info = {};
        const paths = { safest: [], balanced: [], fastest: [] };
        data.routes.forEach(r => {
          const label = r.safety_label === 'green' ? 'safest' : r.safety_label === 'amber' ? 'balanced' : 'fastest';
          let fallbackDurationS = r.distance_m / 1.4;
          let baseSafety = r.safety_score;
          if (transitMode === 'biking') { fallbackDurationS = r.distance_m / 4.2; baseSafety = Math.max(30, r.safety_score - 5); }
          else if (transitMode === 'driving') { fallbackDurationS = r.distance_m / 8.3; baseSafety = Math.min(95, r.safety_score + 10); }

          info[label] = {
            distance: (r.distance_m / 1000).toFixed(1) + ' km',
            time: Math.max(1, Math.round(fallbackDurationS / 60)) + ' min',
            safety: Math.round(baseSafety),
            details: r.details || { lighting: `${Math.round(r.safety_score / 10)}/10`, cctv: `${Math.round(Math.max(10, r.safety_score - 10) / 10)}/10`, density: r.safety_score > 70 ? 'High' : r.safety_score > 40 ? 'Medium' : 'Low' }
          };
          const coords = [];
          if (r.geojson?.features) {
            r.geojson.features.forEach(f => {
              if (f.geometry?.coordinates) {
                if (f.geometry.type === 'LineString') f.geometry.coordinates.forEach(pt => coords.push([pt[0], pt[1]]));
                else if (f.geometry.type === 'Point') coords.push([f.geometry.coordinates[0], f.geometry.coordinates[1]]);
              }
            });
          }
          paths[label] = coords;
        });
        setRouteInfo(info);
        setRoutePaths(paths);
        if (userLocation) setLastFetchCoords(userLocation);
      } else {
        setRouteInfo(null);
        setRoutePaths({ safest: [], balanced: [], fastest: [] });
      }
    }
    loadRoutes();
  }, [transitMode, userLocation, sourceMode, resolvedSource, resolvedDestination]);

  const triggerSOSBackend = async () => {
    setSosStatus('alerting');
    
    // Retrieve live location if available, otherwise default to fallbacks
    let lat = 12.9610;
    let lng = 77.5655;
    if (userLocation) {
      lat = userLocation[0];
      lng = userLocation[1];
    }

    // Retrieve contacts and custom message from local storage
    let contacts = null;
    let customMessage = null;
    if (typeof window !== 'undefined') {
      const savedContacts = localStorage.getItem('emergency_contacts');
      if (savedContacts) {
        try {
          contacts = JSON.parse(savedContacts);
        } catch (e) {
          console.error(e);
        }
      }
      customMessage = localStorage.getItem('sos_custom_message');
    }

    const result = await triggerSOSEmergency(lat, lng, contacts, customMessage);
    if (result && result.status === 'triggered') {
      setSosStatus('notified');
      setTimeout(() => setSosStatus('idle'), 4000);
    } else {
      setSosStatus('idle');
    }
  };

  useEffect(() => {
    let timer;
    if (sosStatus === 'countdown') {
      if (sosCountdown > 0) {
        timer = setTimeout(() => setSosCountdown(c => c - 1), 1000);
      } else {
        triggerSOSBackend();
      }
    }
    return () => clearTimeout(timer);
  }, [sosStatus, sosCountdown]);

  // GPS-based navigation: track real user position along the route
  useEffect(() => {
    if (!navigationActive || !userLocation || !directions.length) return;

    // Find the closest direction step to the user's current GPS position
    let closestIdx = navigationStep;
    let minDist = Infinity;

    for (let i = navigationStep; i < directions.length; i++) {
      const step = directions[i];
      if (step.coord) {
        const d = getDistance(userLocation[0], userLocation[1], step.coord[0], step.coord[1]);
        if (d < minDist) {
          minDist = d;
          closestIdx = i;
        }
      }
    }

    // Advance to next step if user is within 30m of the next waypoint
    if (closestIdx > navigationStep && minDist < 50) {
      // eslint-disable-next-line
      setNavigationStep(closestIdx);
    }

    // Update bearing based on next waypoint
    if (closestIdx < directions.length) {
      const nextStep = directions[closestIdx];
      if (nextStep.coord) {
        // userLocation is [lat, lng], step.coord is [lng, lat]
        setCurrentBearing(getBearing(userLocation[0], userLocation[1], nextStep.coord[1], nextStep.coord[0]));
      }
    }

    // Check if user reached the destination (within 30m of last step)
    const lastStep = directions[directions.length - 1];
    if (lastStep?.coord) {
      const distToEnd = getDistance(userLocation[0], userLocation[1], lastStep.coord[0], lastStep.coord[1]);
      if (distToEnd < 30) {
        setNavigationActive(false);
        setSimulatedCoords(null);
        setToast(`Arrived safely at ${destinationText}!`);
        setTimeout(() => setToast(null), 4000);
      }
    }

    // Update navigation position to user's real location
    setSimulatedCoords([userLocation[1], userLocation[0]]);
  }, [navigationActive, userLocation, directions, navigationStep, destinationText]);

  // Auto-switch selected route if the current selectedRoute is not available in routeInfo
  useEffect(() => {
    if (routeInfo && !routeInfo[selectedRoute]) {
      const keys = Object.keys(routeInfo);
      if (keys.length > 0) {
        // eslint-disable-next-line
        setSelectedRoute(keys[0]);
      }
    }
  }, [routeInfo, selectedRoute]);

  const initiateSOS = () => {
    setSosCountdown(3);
    setSosStatus('countdown');
  };

  const cancelSOS = () => {
    setSosStatus('idle');
  };

  const handleStartNavigation = () => {
    setNavigationStep(0);
    setSimulatedCoords(currentCoords[0]); // [lng, lat]
    if (currentCoords.length > 1) {
      setCurrentBearing(getBearing(currentCoords[0][1], currentCoords[0][0], currentCoords[1][1], currentCoords[1][0]));
    } else {
      setCurrentBearing(0);
    }
    setNavigationActive(true);
  };

  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      setToast('Geolocation is not supported by your browser.');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setToast('Requesting GPS live location...');
    setTimeout(() => setToast(null), 2500);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLocationPermission('granted');
        setToast('Real-time location connected.');
        setTimeout(() => setToast(null), 3000);
      },
      (error) => {
        console.error('Error requesting location:', error);
        setLocationPermission('denied');
        setToast('Location permission denied.');
        setTimeout(() => setToast(null), 3000);
      }
    );
  };

  const currentRoute = routeInfo
    ? (routeInfo[selectedRoute] || routeInfo.safest || routeInfo.balanced || routeInfo.fastest || { distance: '-- km', time: '-- min', safety: 0 })
    : { distance: '-- km', time: '-- min', safety: 0 };

  return (
    <div className="bg-background text-on-surface font-sans overflow-hidden h-screen flex flex-col">
      <header className="fixed top-0 left-0 w-full h-16 z-50 flex justify-between items-center px-4 md:px-8 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <Logo />

        <div className="hidden lg:flex items-center gap-2 bg-primary/5 border border-primary/10 text-primary px-3 py-1.5 rounded-full text-[12px] font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Live Heatmap: Police Heatmap Active (Indiranagar Zone)
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={initiateSOS}
            className="text-white bg-error hover:bg-error/95 active-interaction px-5 py-2.5 rounded-full font-bold shadow-lg shadow-error/20 flex items-center gap-2 text-[14px] leading-none transition-all"
          >
            <span className="material-symbols-outlined text-[18px] animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
              emergency
            </span>
            SOS Alert
          </button>

          <button
            onClick={() => setShowMethodology(true)}
            className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors active-interaction"
            title="Safety Science Methodology"
          >
            <span className="material-symbols-outlined text-[20px]">science</span>
          </button>

          <Link href="/settings" className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors active-interaction">
            <span className="material-symbols-outlined text-[22px]">account_circle</span>
          </Link>
        </div>
      </header>

      <main className="pt-16 h-full flex flex-col md:flex-row relative">
        <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] z-40 bg-white border-r border-outline-variant/20 w-full md:w-[400px] flex flex-col shadow-2xl md:shadow-[10px_0_30px_-15px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-display text-lg text-on-surface font-bold">Plan Safe Trip</h2>
                <p className="text-on-surface-variant text-xs font-medium">Using live crowd & streetlight analytics</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                  Live Heatmap
                </span>
                <button
                  onClick={() => setShowMethodology(true)}
                  className="text-[10px] text-primary hover:underline font-extrabold flex items-center gap-0.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[12px]">menu_book</span>
                  How it Works
                </button>
              </div>
            </div>

            <div className="bg-surface-container-low p-1.5 rounded-2xl flex border border-outline-variant/15 gap-1 shadow-sm">
              <button
                onClick={() => setTransitMode('walking')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold capitalize transition-all active-interaction ${transitMode === 'walking' ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">directions_walk</span>
                Walk
              </button>
              <button
                onClick={() => setTransitMode('biking')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold capitalize transition-all active-interaction ${transitMode === 'biking' ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">directions_bike</span>
                Bike
              </button>
              <button
                onClick={() => setTransitMode('driving')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold capitalize transition-all active-interaction ${transitMode === 'driving' ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">directions_car</span>
                Drive
              </button>
            </div>

            <div className="space-y-0 relative">
              {/* Vertical connecting line - positioned precisely between the two icons */}
              <div className="absolute left-[21px] top-[72px] bottom-[52px] w-[2px] bg-outline-variant/30 z-0"></div>

              {/* Source / Starting Point */}
              <div className="relative flex gap-4 items-start">
                <div className="w-11 h-11 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center shrink-0 z-10 shadow-sm mt-6">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="4" fill="currentColor" className="text-primary"/>
                    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary"/>
                    <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2" className="text-primary"/>
                    <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" className="text-primary"/>
                    <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="2" className="text-primary"/>
                    <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" className="text-primary"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Starting Point</span>
                    <div className="flex items-center bg-surface-container-low rounded-lg border border-outline-variant/15 p-0.5 gap-0.5">
                      <button
                        onClick={() => { setSourceMode('gps'); setSourceSuggestions([]); }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${sourceMode === 'gps' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2"/><line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="2"/><line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2"/></svg>
                        GPS
                      </button>
                      <button
                        onClick={() => setSourceMode('manual')}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${sourceMode === 'manual' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        Manual
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    {sourceMode === 'gps' ? (
                      <div className="relative flex items-center">
                        <input
                          className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-3 pr-10 py-2.5 text-sm font-semibold text-on-surface/85 cursor-pointer outline-none"
                          onClick={requestLocationPermission}
                          readOnly
                          type="text"
                          value={locationPermission === 'granted' ? "Live Location Connected" : "BMS College of Engineering"}
                        />
                        <button
                          onClick={requestLocationPermission}
                          className="absolute right-2.5 text-primary hover:bg-primary/5 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-primary"><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2"/><line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="2"/><line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2"/></svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <input
                            className="w-full bg-white border border-primary/20 rounded-xl pl-3 pr-10 py-2.5 text-sm font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            type="text"
                            placeholder="Type a Bengaluru location..."
                            value={sourceText}
                            onChange={(e) => handleSourceTextChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                performSourceSearch();
                              }
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={performSourceSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer outline-none flex items-center justify-center"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>
                          </button>
                          {sourceSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline-variant/20 rounded-xl shadow-xl z-50 overflow-hidden">
                              {sourceSuggestions.map((name) => (
                                <button
                                  key={name}
                                  onClick={() => selectSourceSuggestion(name)}
                                  className="w-full text-left px-3 py-2.5 text-sm font-semibold text-on-surface hover:bg-primary/5 flex items-center gap-2 transition-colors border-b border-outline-variant/10 last:border-0"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-primary shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
                                  {name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {resolvedSource && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-primary font-bold">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-primary shrink-0"><path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm-1.5 14.5l-5-5 1.41-1.41L10.5 13.67l7.09-7.08L19 8l-8.5 8.5z"/></svg>
                            Location set: {resolvedSource.lat.toFixed(4)}, {resolvedSource.lng.toFixed(4)}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Destination */}
              <div className="relative flex gap-4 items-start mt-4">
                <div className="w-11 h-11 rounded-full bg-error/10 border-2 border-white flex items-center justify-center shrink-0 z-10 shadow-sm mt-6">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-error">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-1">Destination</span>
                  <div className="relative mt-2">
                    <div className="relative">
                      <input
                        className="w-full bg-white border border-primary/20 rounded-xl pl-3 pr-10 py-2.5 text-sm font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        type="text"
                        placeholder="Type destination..."
                        value={destinationText}
                        onChange={(e) => handleDestinationTextChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            performDestinationSearch();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={performDestinationSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error transition-colors cursor-pointer outline-none flex items-center justify-center"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>
                      </button>

                      {destinationSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline-variant/20 rounded-xl shadow-xl z-50 overflow-hidden">
                          {destinationSuggestions.map((name) => (
                            <button
                              key={name}
                              onClick={() => selectDestinationSuggestion(name)}
                              className="w-full text-left px-3 py-2.5 text-sm font-semibold text-on-surface hover:bg-error/5 flex items-center gap-2 transition-colors border-b border-outline-variant/10 last:border-0"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-error shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {resolvedDestination && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-error font-bold">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-error shrink-0"><path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm-1.5 14.5l-5-5 1.41-1.41L10.5 13.67l7.09-7.08L19 8l-8.5 8.5z"/></svg>
                        Location set: {resolvedDestination.lat.toFixed(4)}, {resolvedDestination.lng.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-label-caps text-on-surface-variant uppercase tracking-wider text-[11px] font-bold">Suggested Routes</h3>
                {routeInfo && (
                  <button
                    onClick={() => setShowDirectionsList(!showDirectionsList)}
                    className="text-[11px] text-primary font-black hover:underline active-interaction flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {showDirectionsList ? 'visibility_off' : 'format_list_bulleted'}
                    </span>
                    {showDirectionsList ? 'Hide Directions' : 'View Directions'}
                  </button>
                )}
              </div>

              {!routeInfo ? (
                <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-6 text-center text-on-surface-variant font-medium text-xs">
                  <span className="material-symbols-outlined text-[32px] animate-spin text-primary block mb-2">sync</span>
                  Fetching safest paths from server...
                </div>
              ) : (
                <>
                  {routeInfo.safest && (
                    <div
                      onClick={() => setSelectedRoute('safest')}
                      className={`rounded-2xl p-4 cursor-pointer transition-all border-2 active-interaction ${selectedRoute === 'safest'
                          ? 'bg-primary/5 border-primary shadow-sm'
                          : 'bg-surface-container-low border-transparent hover:bg-surface-container hover:border-outline-variant/30'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-on-surface text-[15px] flex items-center gap-1.5">
                            Safest Route
                            <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                          </span>
                          <span className="text-xs text-on-surface-variant block mt-0.5">
                            {routeInfo.safest.distance} • {routeInfo.safest.time}
                          </span>
                        </div>
                        <div className="bg-primary text-white font-black px-2.5 py-1 rounded-xl text-sm shadow-sm">
                          {routeInfo.safest.safety}
                        </div>
                      </div>

                      {selectedRoute === 'safest' && (
                        <div className="mt-3.5 pt-3.5 border-t border-primary/10 grid grid-cols-3 gap-1.5">
                          <div className="text-center">
                            <span className="block text-[9px] uppercase text-on-surface-variant font-bold">Lighting</span>
                            <span className="text-primary font-extrabold text-xs">{routeInfo.safest.details?.lighting || '9/10'}</span>
                          </div>
                          <div className="text-center border-x border-primary/10">
                            <span className="block text-[9px] uppercase text-on-surface-variant font-bold">CCTV</span>
                            <span className="text-primary font-extrabold text-xs">{routeInfo.safest.details?.cctv || '8/10'}</span>
                          </div>
                          <div className="text-center">
                            <span className="block text-[9px] uppercase text-on-surface-variant font-bold">Density</span>
                            <span className="text-primary font-extrabold text-xs">{routeInfo.safest.details?.density || 'High'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {routeInfo.balanced && (
                    <div
                      onClick={() => setSelectedRoute('balanced')}
                      className={`rounded-2xl p-4 cursor-pointer transition-all border-2 active-interaction ${selectedRoute === 'balanced'
                          ? 'bg-amber-500/5 border-amber-500 shadow-sm'
                          : 'bg-surface-container-low border-transparent hover:bg-surface-container hover:border-outline-variant/30'
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-on-surface text-[15px] flex items-center gap-1.5">
                            Balanced Route
                            <span className="material-symbols-outlined text-amber-500 text-[18px]">balance</span>
                          </span>
                          <span className="text-xs text-on-surface-variant block mt-0.5">
                            {routeInfo.balanced.distance} • {routeInfo.balanced.time}
                          </span>
                        </div>
                        <div className="bg-amber-500/10 text-amber-700 font-extrabold px-2.5 py-1 rounded-xl text-sm">
                          {routeInfo.balanced.safety}
                        </div>
                      </div>
                    </div>
                  )}

                  {routeInfo.fastest && (
                    <div
                      onClick={() => setSelectedRoute('fastest')}
                      className={`rounded-2xl p-4 cursor-pointer transition-all border-2 active-interaction ${selectedRoute === 'fastest'
                          ? 'bg-error/5 border-error shadow-sm'
                          : 'bg-surface-container-low border-transparent hover:bg-surface-container hover:border-outline-variant/30'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-on-surface text-[15px] flex items-center gap-1.5">
                            Fastest Route
                            <span className="material-symbols-outlined text-error text-[18px]">speed</span>
                          </span>
                          <span className="text-xs text-on-surface-variant block mt-0.5">
                            {routeInfo.fastest.distance} • {routeInfo.fastest.time}
                          </span>
                        </div>
                        <div className="bg-error/10 text-error font-extrabold px-2.5 py-1 rounded-xl text-sm">
                          {routeInfo.fastest.safety}
                        </div>
                      </div>
                      {selectedRoute === 'fastest' && (
                        <div className="mt-3 bg-error/10 text-error px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          Low streetlight coverage detected
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {showDirectionsList && (
              <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-4 space-y-3 slide-up max-h-72 overflow-y-auto">
                <span className="text-[10px] text-on-surface-variant uppercase font-black tracking-wider block mb-1">
                  Turn-by-turn directions ({selectedRoute})
                </span>

                {directions.map((step, idx) => (
                  <div key={idx} className="flex gap-3 items-start text-xs border-b border-outline-variant/10 pb-2.5 last:border-0 last:pb-0">
                    <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">
                      {step.icon}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-on-surface/85 leading-normal">{step.instruction}</p>
                      {step.distance > 0 && (
                        <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{step.distance} meters</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 grid grid-cols-2 gap-2">
            <Link href="/reports" className="flex items-center justify-center gap-2 text-on-surface-variant bg-white border border-outline-variant/25 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-surface-container-lowest hover:text-primary active-interaction shadow-sm">
              <span className="material-symbols-outlined text-[18px]">group</span>
              Safety Feed
            </Link>
            <Link href="/settings" className="flex items-center justify-center gap-2 text-on-surface-variant bg-white border border-outline-variant/25 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-surface-container-lowest hover:text-primary active-interaction shadow-sm">
              <span className="material-symbols-outlined text-[18px]">settings</span>
              Settings
            </Link>
          </div>
        </aside>

        <section className="flex-1 relative md:ml-[400px] h-[calc(100vh-64px)] z-0 bg-surface-container-high">
          <Map
            selectedRoute={selectedRoute}
            userLocation={userLocation}
            navigationPosition={simulatedCoords}
            navigationActive={navigationActive}
            currentBearing={currentBearing}
            path={currentCoords}
            showHeatmap={showHeatmap}
            visibleLayers={visibleLayers}
          />

          <div className="absolute top-4 right-4 flex flex-col gap-2.5 z-10">
            <button 
              onClick={() => setShowLayersPanel(!showLayersPanel)}
              className={`backdrop-blur-md shadow-lg border w-11 h-11 rounded-2xl flex items-center justify-center transition-all active-interaction ${
                showLayersPanel || Object.values(visibleLayers).some(v => v) || showHeatmap
                  ? 'bg-primary border-primary text-white' 
                  : 'bg-white/90 border-outline-variant/15 text-on-surface hover:bg-white'
              }`}
              title="Toggle Map Layers"
            >
              <span className="material-symbols-outlined text-[20px]">layers</span>
            </button>
            <button
              onClick={requestLocationPermission}
              className={`shadow-lg border w-11 h-11 rounded-2xl flex items-center justify-center transition-all active-interaction ${locationPermission === 'granted'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white/90 border-outline-variant/15 text-on-surface hover:bg-white'
                }`}
            >
              <span className="material-symbols-outlined text-[20px]">my_location</span>
            </button>
          </div>

          {/* Layers Control Panel */}
          {showLayersPanel && (
            <div className="absolute top-[120px] right-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-outline-variant/15 p-3 w-52 max-h-[320px] overflow-y-auto slide-up-centered">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-bold text-on-surface">Map Layers</span>
                <button onClick={() => setShowLayersPanel(false)} className="text-on-surface-variant hover:text-error transition-all">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
              <div className="space-y-1.5">
                {[
                  { key: 'heatmap', label: 'Crime Heatmap', icon: 'local_fire_department', color: '#D32F2F' },
                  { key: 'police', label: 'Police Stations', icon: 'local_police', color: '#1565C0' },
                  { key: 'cctv', label: 'CCTV Cameras', icon: 'videocam', color: '#7B1FA2' },
                  { key: 'hospitals', label: 'Hospitals', icon: 'local_hospital', color: '#D32F2F' },
                  { key: 'metro', label: 'Metro Stations', icon: 'train', color: '#2E7D32' },
                  { key: 'streetlights', label: 'Streetlights', icon: 'lightbulb', color: '#FFA000' },
                  { key: 'busStands', label: 'Bus Stands', icon: 'directions_bus', color: '#00838F' },
                  { key: 'womenSafety', label: 'Women Safety', icon: 'female', color: '#E91E63' },
                ].map(layer => {
                  const isActive = layer.key === 'heatmap' ? showHeatmap : visibleLayers[layer.key];
                  return (
                    <button
                      key={layer.key}
                      onClick={() => layer.key === 'heatmap' ? setShowHeatmap(!showHeatmap) : toggleLayer(layer.key)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                        isActive
                          ? 'bg-surface-container-low text-on-surface'
                          : 'text-on-surface-variant hover:bg-surface-container-low/50'
                      }`}
                    >
                      <span 
                        className="material-symbols-outlined text-[16px]" 
                        style={{ color: isActive ? layer.color : '#9E9E9E', fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                      >{layer.icon}</span>
                      <span className="flex-1 text-left">{layer.label}</span>
                      <div className={`w-7 h-4 rounded-full transition-all flex items-center ${isActive ? 'justify-end' : 'justify-start'}`} style={{ backgroundColor: isActive ? layer.color : '#E0E0E0' }}>
                        <div className="w-3 h-3 rounded-full bg-white shadow-sm mx-0.5"></div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[8px] text-on-surface-variant mt-3 font-medium border-t border-outline-variant/10 pt-2">Data: NCRB, BBMP, BMRCL, KSP</p>
            </div>
          )}

          {/* Heatmap Legend */}
          {showHeatmap && (
            <div className="absolute bottom-28 left-4 md:left-[416px] z-10 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-outline-variant/15 p-3 slide-up-centered">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                  <span className="text-[11px] font-bold text-on-surface">Crime Density</span>
                </div>
                <button 
                  onClick={() => setShowHeatmap(false)}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-all"
                  title="Hide Heatmap"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-on-surface-variant font-semibold">Low</span>
                <div className="w-28 h-2.5 rounded-full" style={{ background: 'linear-gradient(to right, rgba(15,165,138,0.4), rgba(255,235,59,0.7), rgba(255,152,0,0.8), rgba(244,67,54,0.9), rgba(183,28,28,1))' }}></div>
                <span className="text-[9px] text-on-surface-variant font-semibold">High</span>
              </div>
              <p className="text-[8px] text-on-surface-variant mt-1.5 font-medium">Source: NCRB & Bengaluru Police Data</p>
            </div>
          )}

          {!navigationActive ? (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[540px] glass-card rounded-3xl p-5 z-20 border border-white/60 shadow-2xl slide-up-centered">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                  <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[26px]">
                      {transitMode === 'walking' ? 'directions_walk' : transitMode === 'biking' ? 'directions_bike' : 'directions_car'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface text-[17px]">{currentRoute.distance}</span>
                      <span className="text-on-surface-variant/40 text-xs">•</span>
                      <span className="font-bold text-on-surface text-[17px]">{currentRoute.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="bg-primary/15 text-primary px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider">
                        Safety Score
                      </span>
                      <span className="text-primary font-black text-sm">{currentRoute.safety}%</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleStartNavigation}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-white h-12 px-6 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/15 active-interaction transition-all shrink-0"
                >
                  Start Safe Walk
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[540px] bg-primary text-white rounded-3xl p-5 z-30 shadow-2xl slide-up-centered border border-primary-container/20">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white text-[28px]">
                      {directions[navigationStep]?.icon || 'navigation'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-white/70 uppercase font-black tracking-wider block">Current Instruction</span>
                    <p className="text-base font-extrabold leading-snug mt-0.5 truncate-3-lines">
                      {directions[navigationStep]?.instruction || 'Proceed along path'}
                    </p>
                    {directions[navigationStep]?.distance > 0 && (
                      <p className="text-xs text-white/75 font-semibold mt-1">In {directions[navigationStep]?.distance} meters</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>Active Route: {selectedRoute} ({transitMode})</span>
                    <span>Step {navigationStep + 1} of {directions.length}</span>
                  </div>

                  <div className="w-full h-2 bg-white/25 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-1000"
                      style={{ width: `${((navigationStep + 1) / directions.length) * 100}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] font-semibold text-white/80 pt-1">
                    <span className="flex items-center gap-1">
                      <span className="dot-pulse w-2 h-2 bg-white rounded-full"></span>
                      GPS Tracking active
                    </span>
                    <span>
                      Destination in {
                        (currentRoute?.time && currentRoute.time !== '-- min' && directions.length > 0)
                          ? Math.max(1, Math.round(parseFloat(currentRoute.time.split(' ')[0]) * (1 - (navigationStep / directions.length))))
                          : '--'
                      } mins
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setNavigationActive(false);
                      setSimulatedCoords(null);
                      setToast('Navigation paused.');
                      setTimeout(() => setToast(null), 3000);
                    }}
                    className="flex-1 bg-white/15 hover:bg-white/20 text-white h-11 rounded-xl text-xs font-bold active-interaction transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">pause</span>
                    Pause Trip
                  </button>
                  <button
                    onClick={() => {
                      setNavigationActive(false);
                      setSimulatedCoords(null);
                      setToast('Navigation cancelled.');
                      setTimeout(() => setToast(null), 3000);
                    }}
                    className="flex-1 bg-error hover:bg-error/95 text-white h-11 rounded-xl text-xs font-bold active-interaction transition-all flex items-center justify-center gap-1.5 shadow-md shadow-error/20"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                    Exit Navigation
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {sosStatus !== 'idle' && (
        <div className="fixed inset-0 bg-error/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white p-6 transition-all duration-300">
          {sosStatus === 'countdown' && (
            <div className="text-center space-y-8">
              <div className="relative flex items-center justify-center">
                <div className="w-44 h-44 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-ping absolute"></div>
                <div className="w-36 h-36 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center animate-pulse absolute"></div>
                <div className="w-28 h-28 rounded-full bg-white text-error font-display font-black text-5xl flex items-center justify-center shadow-[0_10px_35px_rgba(244,63,94,0.4)] relative z-10">
                  {sosCountdown}
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="font-display text-3xl font-black tracking-tight text-white">Initiating Emergency SOS</h2>
                <p className="text-white/80 text-sm max-w-sm mx-auto font-medium">
                  Alerting police dispatch and your emergency contacts with your live location.
                </p>
              </div>
              <button
                onClick={cancelSOS}
                className="bg-white text-error hover:bg-white/95 px-8 py-3.5 rounded-full font-extrabold shadow-2xl active-interaction text-sm uppercase tracking-wider transition-all"
              >
                Cancel SOS
              </button>
            </div>
          )}

          {sosStatus === 'alerting' && (
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center animate-pulse mx-auto">
                <span className="material-symbols-outlined text-[48px] animate-spin">sync</span>
              </div>
              <h2 className="font-display text-2xl font-black">Sending Alert Details...</h2>
              <p className="text-white/70 text-xs">Accessing backend emergency router</p>
            </div>
          )}

          {sosStatus === 'notified' && (
            <div className="text-center space-y-4 max-w-sm">
              <div className="w-20 h-20 bg-white text-error rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <h2 className="font-display text-2xl font-extrabold">Help is on the way!</h2>
              <p className="text-white/90 text-sm">
                SMS alert sent successfully. Police Dispatch reference #2847 has been created for your live GPS location.
              </p>
              <div className="bg-white/10 p-4 rounded-2xl text-[13px] font-medium border border-white/20 text-left space-y-1">
                <p className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M12 2L1 21h22L12 2zm0 3.83L19.53 19H4.47L12 5.83zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"/></svg>
                  <span><strong>Patrol:</strong> Hoysala 22 dispatched</span>
                </p>
                <p className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1.003 1.003 0 011.01-.24c1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.1.31.03.66-.25 1.02l-2.2 2.2z"/></svg>
                  <span><strong>Contacts:</strong> Priya Sharma notified via SMS</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {showMethodology && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl max-w-2xl w-full border border-slate-100 max-h-[80vh] flex flex-col slide-up relative">
            
            {/* Sticky Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-display font-black text-xl text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[24px]">science</span>
                  Safety Science & Routing Methodology
                </h3>
                <p className="text-[11px] text-on-surface-variant font-semibold mt-0.5">
                  SafeRoute Bengaluru algorithm weights, spatial models, and data pipeline frameworks.
                </p>
              </div>
              <button
                onClick={() => setShowMethodology(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-error hover:text-white transition-all active-interaction shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2 py-6 space-y-8">
              
              {/* Composite Score Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary w-7 h-7 rounded-lg flex items-center justify-center text-[15px] font-bold">1</span>
                  <h4 className="font-display font-bold text-sm text-on-surface">Composite Safety Index (0–100)</h4>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Every street segment is evaluated using active regional geometry and features. The Safety Score ($S$) is calculated as a composite weighted sum of positive features minus crime penalties, bound between $[0, 100]$:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { title: "CCTV Camera Coverage (30%)", icon: "videocam", color: "bg-purple-500/10 text-purple-600 border-purple-200/20", desc: "Density of active CCTV assets within 200m radius of the street segment." },
                    { title: "Human Activity & Crowd (25%)", icon: "groups", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200/20", desc: "Density of POIs, shops, metro/bus transit points, and crowd signals." },
                    { title: "Emergency Services (20%)", icon: "local_police", color: "bg-blue-500/10 text-blue-600 border-blue-200/20", desc: "Proximity to police stations, pink booths, hospitals, and Namma 112 posts." },
                    { title: "Streetlight Luminosity (15%)", icon: "lightbulb", color: "bg-amber-500/10 text-amber-600 border-amber-200/20", desc: "Streetlight spacing density per 100m of segment based on BBMP records." },
                    { title: "Inverse Crime Risk (10%)", icon: "gavel", color: "bg-rose-500/10 text-rose-600 border-rose-200/20", desc: "Absence of nearby incident logs from NCRB and local reports (inverted scale)." }
                  ].map((attr, idx) => (
                    <div key={idx} className={`p-3.5 rounded-2xl border ${attr.color} space-y-1.5`}>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">{attr.icon}</span>
                        <span className="font-extrabold text-[12px]">{attr.title}</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-on-surface-variant font-medium">{attr.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Routing Cost Function Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary w-7 h-7 rounded-lg flex items-center justify-center text-[15px] font-bold">2</span>
                  <h4 className="font-display font-bold text-sm text-on-surface">Routing Cost Function</h4>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Dijkstra's pathfinding weight is adjusted to account for segment safety scores and transit profile constraints. The modified routing cost ($C$) for a road segment of length $L$ is calculated as:
                </p>

                <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl text-center font-mono my-3 shadow-inner relative overflow-hidden select-all">
                  <div className="absolute top-2 left-3 text-[8px] tracking-widest text-slate-500 uppercase font-bold">Mathematical Model</div>
                  <p className="text-base font-bold text-primary tracking-wide pt-1">
                    C = L &times; (1 + &beta; &times; (1 - S / 100))
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-on-surface-variant font-semibold">Where the Safety Influence Coefficient (&beta;) adapts to user selected choices:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="bg-surface-container-low border border-outline-variant/15 p-3 rounded-xl">
                      <span className="font-black text-primary text-[11px] block">Safest Route (&beta; = 10.0)</span>
                      <span className="text-[10px] text-on-surface-variant leading-normal block mt-1">
                        High penalty detours. The graph router detours up to 10x physical distance to avoid poorly lit or unmonitored roads.
                      </span>
                    </div>
                    <div className="bg-surface-container-low border border-outline-variant/15 p-3 rounded-xl">
                      <span className="font-black text-amber-700 text-[11px] block">Balanced Route (&beta; = 2.0)</span>
                      <span className="text-[10px] text-on-surface-variant leading-normal block mt-1">
                        Compromise mode. Moderately balances route lengths with safety indices for optimized speed-to-safety paths.
                      </span>
                    </div>
                    <div className="bg-surface-container-low border border-outline-variant/15 p-3 rounded-xl">
                      <span className="font-black text-slate-700 text-[11px] block">Fastest Route (&beta; = 0.0)</span>
                      <span className="text-[10px] text-on-surface-variant leading-normal block mt-1">
                        Direct shortest path. Safety scoring penalties are ignored (cost equals actual physical distance).
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spatial Mechanics Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary w-7 h-7 rounded-lg flex items-center justify-center text-[15px] font-bold">3</span>
                  <h4 className="font-display font-bold text-sm text-on-surface">Spatial Constraints & Modifiers</h4>
                </div>
                <div className="space-y-3.5 text-xs text-on-surface-variant leading-relaxed">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">location_searching</span>
                    <div>
                      <h5 className="font-bold text-on-surface text-[12px]">UTM Zone 43N (EPSG:32643) Projection</h5>
                      <p className="text-[10.5px] mt-0.5 font-medium leading-relaxed">
                        To calculate precise distance thresholds (like the 200m CCTV coverage area), all spatial math is projected from WGS 84 (lat/lng coordinates) to UTM Zone 43N meters using PostGIS functions.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">schedule</span>
                    <div>
                      <h5 className="font-bold text-on-surface text-[12px]">Time-of-Day Multipliers</h5>
                      <p className="text-[10.5px] mt-0.5 font-medium leading-relaxed">
                        Safety metrics automatically adjust for nighttime risk profiles. Base safety scores are multiplied by time-of-day coefficients:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2 font-mono text-[9px]">
                        <span className="bg-surface-container border border-outline-variant/20 px-2 py-1 rounded">00:00–05:00 (0.65x)</span>
                        <span className="bg-surface-container border border-outline-variant/20 px-2 py-1 rounded">22:00–00:00 (0.70x)</span>
                        <span className="bg-surface-container border border-outline-variant/20 px-2 py-1 rounded">20:00–22:00 (0.85x)</span>
                        <span className="bg-surface-container border border-outline-variant/20 px-2 py-1 rounded">Daytime (1.00x)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">hub</span>
                    <div>
                      <h5 className="font-bold text-on-surface text-[12px]">KD-Tree Snapping</h5>
                      <p className="text-[10.5px] mt-0.5 font-medium leading-relaxed">
                        For sub-millisecond route calculation latencies, raw GPS inputs snap to the closest OpenStreetMap graph intersection node via a SciPy-based `cKDTree` spatial index.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Sticky Footer */}
            <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setShowMethodology(false)}
                className="bg-primary hover:bg-primary/95 text-white font-bold text-xs h-10 px-6 rounded-full shadow-md active-interaction transition-all"
              >
                Close Science Panel
              </button>
            </div>
            
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-primary text-white px-5 py-3 rounded-2xl flex items-center gap-2.5 z-[100] shadow-2xl font-bold text-sm border border-white/20 slide-up-centered">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
          {toast}
        </div>
      )}
    </div>
  );
}
