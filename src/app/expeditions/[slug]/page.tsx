import { Metadata } from 'next';
import { EXPEDITIONS } from '@/data/expeditions-seed';
import ExpeditionDetailClient from './ExpeditionDetailClient';

export function generateStaticParams() {
    return EXPEDITIONS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const exp = EXPEDITIONS.find((e) => e.slug === slug);
    return {
        title: exp ? `Expedition ${exp.title} | GeaiMonVol` : 'Expedition | GeaiMonVol',
        description: exp?.descriptionFr || 'Pack expédition nomade multi-étapes depuis Montréal',
    };
}

export default async function ExpeditionPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <ExpeditionDetailClient slug={slug} />;
}
