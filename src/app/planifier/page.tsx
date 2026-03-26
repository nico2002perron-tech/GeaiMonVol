import { Metadata } from 'next';
import { getDeals } from '@/lib/services/getDeals';
import { mapPricesToDeals } from '@/lib/types/deals';
import PlanifierClient from './PlanifierClient';

export const metadata: Metadata = {
  title: 'Planificateur de voyage | GeaiMonVol',
  description:
    'Planifie ton voyage en 30 secondes. Trouve ta destination ideale, decouvre les deals, et genere un itineraire personnalise avec l\'IA.',
};

export default async function PlanifierPage() {
  const raw = await getDeals();
  const deals = mapPricesToDeals(raw);
  return <PlanifierClient deals={deals} />;
}
