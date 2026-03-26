import { Metadata } from 'next';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
    title: 'Ma bibliothèque de guides',
    description: 'Retrouve tous tes itinéraires de voyage générés par l\'IA GeaiMonVol. Guides personnalisés jour par jour avec budget, hébergement et activités.',
    alternates: { canonical: '/library' },
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
    return <>{children}<Footer /></>;
}
