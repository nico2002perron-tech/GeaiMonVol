'use client';
import dynamic from 'next/dynamic';

const MapInterface = dynamic(
  () => import('@/components/map/MapInterface'),
  { ssr: false }
);

export default function Home() {
  return <MapInterface />;
}
