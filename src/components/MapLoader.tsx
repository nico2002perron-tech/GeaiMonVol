'use client';

import dynamic from 'next/dynamic';

const MapInterface = dynamic(
    () => import('@/components/map/MapInterface'),
    { ssr: false }
);

export default function MapLoader() {
    return <MapInterface />;
}
