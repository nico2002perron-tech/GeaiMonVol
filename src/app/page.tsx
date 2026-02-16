'use client';
import './legacy.css';
import ClientOnly from '@/components/ClientOnly';
import MapInterface from '@/components/map/MapInterface';

export default function Home() {
  return (
    <ClientOnly>
      <MapInterface />
    </ClientOnly>
  );
}
