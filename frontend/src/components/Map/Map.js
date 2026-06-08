'use client';

import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./DynamicMap'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      background: 'var(--surface-hover)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'var(--font-outfit)',
      color: 'var(--foreground)'
    }}>
      Loading SafeRoute Map...
    </div>
  )
});

export default function Map({ selectedRoute, userLocation, navigationPosition, navigationActive, path }) {
  return (
    <DynamicMap 
      selectedRoute={selectedRoute} 
      userLocation={userLocation} 
      navigationPosition={navigationPosition} 
      navigationActive={navigationActive} 
      path={path}
    />
  );
}
