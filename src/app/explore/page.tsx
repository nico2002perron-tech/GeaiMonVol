import { Metadata } from 'next';
import ClientGlobe from './ClientGlobe';

export const metadata: Metadata = {
    title: 'Explorer les vols — Carte interactive',
    description: 'Explore les destinations depuis Montréal sur une carte interactive. Génère des guides de voyage IA personnalisés pour chaque destination.',
    alternates: { canonical: '/explore' },
};

export default function ExplorePage() {
  return <ClientGlobe />;
}
