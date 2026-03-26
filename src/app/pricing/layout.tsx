import { Metadata } from 'next';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
    title: 'Tarifs — Gratuit et Premium',
    description: 'Compare les plans GeaiMonVol. Gratuit : deals en temps réel + analyse IA. Premium : Pack Builder vol + hôtel, calendrier des prix, alertes prioritaires. À partir de 4,99$/mois.',
    alternates: { canonical: '/pricing' },
    openGraph: {
        title: 'Tarifs GeaiMonVol — Gratuit vs Premium',
        description: 'Deals gratuits + Premium à 4,99$/mois pour le Pack Builder IA, calendrier des prix et alertes prioritaires.',
    },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}<Footer /></>;
}
