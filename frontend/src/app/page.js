'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Map from '../components/Map/Map';
import { fetchRoutes, triggerSOSEmergency } from '../utils/api';
import { generateDirections } from '../utils/navigation';

export default function Home() {
  const [selectedRoute, setSelectedRoute] = useState('safest');
  const [transitMode, setTransitMode] = useState('walking');
  const [sosStatus, setSosStatus] = useState('idle');
  const [sosCountdown, setSosCountdown] = useState(3);
  const [navigationActive, setNavigationActive] = useState(false);
  const [navigationStep, setNavigationStep] = useState(0);
  const [simulatedCoords, setSimulatedCoords] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('unknown');
  const [toast, setToast] = useState(null);
  const [showDirectionsList, setShowDirectionsList] = useState(false);

  const [routeInfo, setRouteInfo] = useState(null);
  const [routePaths, setRoutePaths] = useState({
    safest: [],
    balanced: [],
    fastest: []
  });

  const currentCoords = routePaths[selectedRoute] || [];
  const directions = generateDirections(currentCoords, selectedRoute);

  useEffect(() => {
    async function loadRoutes() {
      const source = { lat: 12.9610, lng: 77.5655 };
      const destination = { lat: 12.9784, lng: 77.6408 };
      const data = await fetchRoutes(source, destination);
      if (data && data.routes && data.routes.length > 0) {
        const info = {};
        const paths = { safest: [], balanced: [], fastest: [] };
        data.routes.forEach(r => {
          const label = r.safety_label === 'green' ? 'safest' : r.safety_label === 'amber' ? 'balanced' : 'fastest';
          
          let speedFactor = 1.0;
          let baseSafety = r.safety_score;
          if (transitMode === 'biking') {
            speedFactor = 0.35;
            baseSafety = Math.max(30, r.safety_score - 5);
          } else if (transitMode === 'driving') {
            speedFactor = 0.15;
            baseSafety = Math.min(95, r.safety_score + 10);
          }

          info[label] = {
            distance: (r.distance_m / 1000).toFixed(1) + ' km',
            time: Math.round((r.eta_seconds * speedFactor) / 60) + ' min',
            safety: Math.round(baseSafety),
            details: r.details || { 
              lighting: `${Math.round(r.safety_score / 10)}/10`, 
              cctv: `${Math.round(Math.max(10, r.safety_score - 10) / 10)}/10`, 
              density: r.safety_score > 70 ? 'High' : r.safety_score > 40 ? 'Medium' : 'Low' 
            }
          };

          const coords = [];
          if (r.geojson && r.geojson.features) {
            r.geojson.features.forEach(feature => {
              if (feature.geometry && feature.geometry.coordinates) {
                const geomType = feature.geometry.type;
                if (geomType === 'LineString') {
                  feature.geometry.coordinates.forEach(pt => {
                    coords.push([pt[1], pt[0]]);
                  });
                } else if (geomType === 'Point') {
                  const pt = feature.geometry.coordinates;
                  coords.push([pt[1], pt[0]]);
                }
              }
            });
          }
          paths[label] = coords;
        });
        setRouteInfo(info);
        setRoutePaths(paths);
      } else {
        setRouteInfo(null);
        setRoutePaths({ safest: [], balanced: [], fastest: [] });
      }
    }
    loadRoutes();
  }, [transitMode]);

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

  useEffect(() => {
    let playInterval;
    if (navigationActive) {
      playInterval = setInterval(() => {
        setNavigationStep(step => {
          const nextStep = step + 1;
          if (nextStep < currentCoords.length) {
            setSimulatedCoords(currentCoords[nextStep]);
            return nextStep;
          } else {
            setNavigationActive(false);
            setSimulatedCoords(null);
            setToast('Arrived safely at Indiranagar Metro!');
            setTimeout(() => setToast(null), 4000);
            return 0;
          }
        });
      }, 3000);
    }
    return () => clearInterval(playInterval);
  }, [navigationActive, currentCoords]);

  const initiateSOS = () => {
    setSosCountdown(3);
    setSosStatus('countdown');
  };

  const cancelSOS = () => {
    setSosStatus('idle');
  };

  const triggerSOSBackend = async () => {
    setSosStatus('alerting');
    const result = await triggerSOSEmergency(12.9610, 77.5655);
    if (result && result.status === 'triggered') {
      setSosStatus('notified');
      setTimeout(() => setSosStatus('idle'), 4000);
    } else {
      setSosStatus('idle');
    }
  };

  const handleStartNavigation = () => {
    setNavigationStep(0);
    setSimulatedCoords(currentCoords[0]);
    setNavigationActive(true);
  };

  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      setToast('Geolocation is not supported by your browser.');
      setTimeout(() => setToast(null), 3000);
      setLocationPermission('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLocationPermission('granted');
        setToast('Real-time location connected.');
        setTimeout(() => setToast(null), 3000);
      },
      (error) => {
        console.error(error);
        setLocationPermission('denied');
        setToast('Location permission denied.');
        setTimeout(() => setToast(null), 3000);
      }
    );
  };

  const currentRoute = routeInfo ? (routeInfo[selectedRoute] || routeInfo.safest) : { distance: '-- km', time: '-- min', safety: 0 };

  return (
    <div className="bg-background text-on-surface font-sans overflow-hidden h-screen flex flex-col">
      <header className="fixed top-0 left-0 w-full h-16 z-50 flex justify-between items-center px-4 md:px-8 bg-white/70 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_2px_15px_-3px_rgba(0,78,62,0.03)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-md shadow-primary/10">
            <span className="material-symbols-outlined text-white text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
          </div>
          <div>
            <span className="font-display text-[18px] md:text-xl font-bold tracking-tight text-primary">SafeRoute</span>
            <span className="text-on-surface-variant font-medium text-xs block -mt-1">Bengaluru Safety Net</span>
          </div>
        </div>

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
              <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                Live Heatmap
              </span>
            </div>

            <div className="bg-surface-container-low p-1.5 rounded-2xl flex border border-outline-variant/15 gap-1 shadow-sm">
              <button 
                onClick={() => setTransitMode('walking')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold capitalize transition-all active-interaction ${
                  transitMode === 'walking' ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">directions_walk</span>
                Walk
              </button>
              <button 
                onClick={() => setTransitMode('biking')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold capitalize transition-all active-interaction ${
                  transitMode === 'biking' ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">directions_bike</span>
                Bike
              </button>
              <button 
                onClick={() => setTransitMode('driving')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold capitalize transition-all active-interaction ${
                  transitMode === 'driving' ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">directions_car</span>
                Drive
              </button>
            </div>

            <div className="space-y-4 relative before:absolute before:left-[21px] before:top-6 before:bottom-6 before:w-[2px] before:bg-outline-variant/30">
              <div className="relative flex gap-4 items-center">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 z-10 shadow-sm">
                  <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-1">Starting Point</span>
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
                      <span className="material-symbols-outlined text-[18px]">gps_fixed</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative flex gap-4 items-center">
                <div className="w-11 h-11 rounded-full bg-error/10 flex items-center justify-center shrink-0 z-10 shadow-sm">
                  <span className="material-symbols-outlined text-error text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-1">Destination</span>
                  <input 
                    className="w-full bg-white border border-primary/20 rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" 
                    type="text" 
                    defaultValue="Indiranagar Metro Station"
                  />
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
                  <div 
                    onClick={() => setSelectedRoute('safest')}
                    className={`rounded-2xl p-4 cursor-pointer transition-all border-2 active-interaction ${
                      selectedRoute === 'safest' 
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

                  <div 
                    onClick={() => setSelectedRoute('balanced')}
                    className={`rounded-2xl p-4 cursor-pointer transition-all border-2 active-interaction ${
                      selectedRoute === 'balanced' 
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

                  <div 
                    onClick={() => setSelectedRoute('fastest')}
                    className={`rounded-2xl p-4 cursor-pointer transition-all border-2 active-interaction ${
                      selectedRoute === 'fastest' 
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
            path={currentCoords}
          />

          <div className="absolute top-4 right-4 flex flex-col gap-2.5 z-10">
            <button className="bg-white/90 backdrop-blur-md shadow-lg border border-outline-variant/15 w-11 h-11 rounded-2xl flex items-center justify-center text-on-surface hover:bg-white transition-all active-interaction">
              <span className="material-symbols-outlined text-[20px]">layers</span>
            </button>
            <button 
              onClick={requestLocationPermission}
              className={`shadow-lg border w-11 h-11 rounded-2xl flex items-center justify-center transition-all active-interaction ${
                locationPermission === 'granted' 
                  ? 'bg-primary border-primary text-white' 
                  : 'bg-white/90 border-outline-variant/15 text-on-surface hover:bg-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">my_location</span>
            </button>
          </div>

          {!navigationActive ? (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[540px] glass-card rounded-3xl p-5 z-20 border border-white/60 shadow-2xl slide-up">
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
                      <span className="bg-primary-container text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
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
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[540px] bg-primary text-white rounded-3xl p-5 z-30 shadow-2xl slide-up border border-primary-container/20">
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
                      <p className="text-xs text-white/75 font-semibold mt-1">In {directions[navigationStep].distance} meters</p>
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
                    <span>Destination in {Math.max(1, Math.round(currentRoute.time.split(' ')[0] * (1 - (navigationStep / directions.length))))} mins</span>
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
        <div className="fixed inset-0 bg-error/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white p-6 transition-all duration-300">
          {sosStatus === 'countdown' && (
            <div className="text-center space-y-6">
              <div className="relative flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-4 border-white/30 flex items-center justify-center animate-ping absolute"></div>
                <div className="w-32 h-32 rounded-full bg-white text-error font-black text-6xl flex items-center justify-center shadow-2xl">
                  {sosCountdown}
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">Initiating Emergency SOS</h2>
                <p className="text-white/80 text-sm max-w-xs mx-auto">
                  Alerting police dispatch and your emergency contacts with your live location.
                </p>
              </div>
              <button 
                onClick={cancelSOS}
                className="bg-white text-error hover:bg-white/95 px-8 py-3.5 rounded-full font-bold shadow-2xl active-interaction text-sm uppercase tracking-wider"
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
                <p>🚨 <strong>Patrol:</strong> Hoysala 22 dispatched</p>
                <p>📞 <strong>Contacts:</strong> Priya Sharma notified via SMS</p>
              </div>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-primary text-white px-5 py-3 rounded-2xl flex items-center gap-2.5 z-[100] shadow-2xl font-bold text-sm border border-white/20 slide-up">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
          {toast}
        </div>
      )}
    </div>
  );
}
