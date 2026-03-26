import { Metadata } from 'next';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
    title: 'Expéditions Nomades — Itinéraires multi-étapes',
    description: 'Packs expédition nomade de 10 à 14 jours depuis Montréal. Itinéraires multi-villes avec vol, hébergements et estimation des coûts.',
    alternates: { canonical: '/expeditions' },
    openGraph: {
        title: 'Expéditions Nomades — GeaiMonVol',
        description: 'Itinéraires multi-étapes de 10 à 14 jours depuis Montréal avec vol et hébergements.',
    },
};

export default function ExpeditionsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}<Footer /></>;
}
