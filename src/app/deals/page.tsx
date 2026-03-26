import { Metadata } from 'next';
import ClientDeals from './ClientDeals';
import { getDeals } from '@/lib/services/getDeals';

export const metadata: Metadata = {
    title: 'Deals de vols — GeaiMonVol',
    description: 'Tous les deals de vols depuis Montreal en temps reel. Prix scannes quotidiennement sur Skyscanner.',
};

export const revalidate = 300;

export default async function DealsPage() {
    const deals = await getDeals();
    return <ClientDeals initialDeals={deals} />;
}
