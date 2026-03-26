import { Metadata } from 'next';
import ClientLanding from './ClientLanding';
import { getDeals } from '@/lib/services/getDeals';

export const metadata: Metadata = {
    title: 'GeaiMonVol — Deals de vols pas cher depuis Montreal',
    description: 'Recois les meilleurs deals de vols depuis Montreal chaque semaine par courriel. Scanning automatique, alertes de prix et planificateur de voyage IA.',
    alternates: { canonical: '/' },
};

export const revalidate = 300;

export default async function Home() {
    const deals = await getDeals();
    return <ClientLanding initialDeals={deals} />;
}
