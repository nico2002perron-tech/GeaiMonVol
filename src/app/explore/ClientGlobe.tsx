'use client';

import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';
import MissionPopup from '@/components/landing/MissionPopup';

const MapInterface = dynamic(
  () => import('@/components/map/MapInterface'),
  { ssr: false }
);

export default function ClientGlobe() {
  return (
    <div style={{ background: '#020408', minHeight: '100vh' }}>
      <ErrorBoundary>
        <MapInterface />
        <MissionPopup />
      </ErrorBoundary>
    </div>
  );
}
