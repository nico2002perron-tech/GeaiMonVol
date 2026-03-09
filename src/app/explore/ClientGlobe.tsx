'use client';

import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';
import LandingHeader from '@/components/LandingHeader';
import '../landing.css';

const MapInterface = dynamic(
  () => import('@/components/map/MapInterface'),
  { ssr: false }
);

export default function ClientGlobe() {
  return (
    <div className="lp" style={{
      height: '100vh',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #BAE6FD 0%, #CCEEFE 12%, #DDF3FE 26%, #EBF7FF 40%, #F4FBFF 55%, #FAFEFF 70%, #FFFFFF 85%, #FFFFFF 100%)',
    }}>
      <LandingHeader />
      <ErrorBoundary>
        <MapInterface />
      </ErrorBoundary>
    </div>
  );
}
