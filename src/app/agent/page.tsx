import { Metadata } from 'next';
import { getDeals } from '@/lib/services/getDeals';
import { mapPricesToDeals } from '@/lib/types/deals';
import AgentClient from './AgentClient';

export const metadata: Metadata = {
  title: 'GeaiAI — Agent de voyage IA | GeaiMonVol',
  description:
    'Parle avec GeaiAI, ton agent de voyage IA. Il connait tous les deals de vols en direct depuis Montreal et te trouve la destination parfaite.',
};

export const revalidate = 300;

export default async function AgentPage() {
  const raw = await getDeals();
  const deals = mapPricesToDeals(raw);
  return <AgentClient deals={deals} />;
}
