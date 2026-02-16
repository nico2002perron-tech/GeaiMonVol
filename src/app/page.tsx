'use client';
import dynamic from 'next/dynamic';

import ErrorBoundary from '@/components/ErrorBoundary';

const MapInterface = dynamic(
  () => import('@/components/map/MapInterface'),
  { ssr: false }
);

export default function Home() {
  return (
    <ErrorBoundary>
      <MapInterface />
    </ErrorBoundary>
  );
}
