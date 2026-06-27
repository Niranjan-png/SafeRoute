'use client';

import dynamic from 'next/dynamic';

import { motion } from 'framer-motion';

const DynamicMap = dynamic(() => import('./DynamicMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface-container flex flex-col items-center justify-center relative overflow-hidden font-outfit">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 blur-[80px] rounded-full"></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        {/* Pulsing Map Pin */}
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-primary rounded-full blur-md"
          />
          <div className="w-16 h-16 bg-surface border border-outline-variant/30 rounded-2xl shadow-xl flex items-center justify-center relative z-10">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              location_on
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <h3 className="text-xl font-bold text-on-surface bg-clip-text text-transparent bg-gradient-to-r from-on-surface to-on-surface/70">
            SafeRoute Map
          </h3>
          <div className="flex items-center gap-2">
            <motion.div 
              className="w-1.5 h-1.5 bg-primary rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />
            <motion.div 
              className="w-1.5 h-1.5 bg-primary rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div 
              className="w-1.5 h-1.5 bg-primary rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
});

export default function Map({ selectedRoute, userLocation, navigationPosition, navigationActive, currentBearing, path, showHeatmap, visibleLayers }) {
  return (
    <DynamicMap 
      selectedRoute={selectedRoute} 
      userLocation={userLocation} 
      navigationPosition={navigationPosition} 
      navigationActive={navigationActive} 
      currentBearing={currentBearing}
      path={path}
      showHeatmap={showHeatmap}
      visibleLayers={visibleLayers}
    />
  );
}
