import { Metadata } from 'next';
import DestinationClient from './DestinationClient';

// Map code to destination info for SEO
const DESTINATION_MAP: Record<string, { city: string; country: string }> = {
    CDG: { city: 'Paris', country: 'France' },
    CUN: { city: 'Cancún', country: 'Mexique' },
    PUJ: { city: 'Punta Cana', country: 'Rép. Dominicaine' },
    VRA: { city: 'Varadero', country: 'Cuba' },
    HAV: { city: 'La Havane', country: 'Cuba' },
    FLL: { city: 'Fort Lauderdale', country: 'États-Unis' },
    JFK: { city: 'New York', country: 'États-Unis' },
    BCN: { city: 'Barcelone', country: 'Espagne' },
    LIS: { city: 'Lisbonne', country: 'Portugal' },
    FCO: { city: 'Rome', country: 'Italie' },
    LHR: { city: 'Londres', country: 'Royaume-Uni' },
    RAK: { city: 'Marrakech', country: 'Maroc' },
    BKK: { city: 'Bangkok', country: 'Thaïlande' },
    NRT: { city: 'Tokyo', country: 'Japon' },
    BOG: { city: 'Bogota', country: 'Colombie' },
    LIM: { city: 'Lima', country: 'Pérou' },
    GRU: { city: 'São Paulo', country: 'Brésil' },
    DPS: { city: 'Bali', country: 'Indonésie' },
    MIA: { city: 'Miami', country: 'États-Unis' },
    LAX: { city: 'Los Angeles', country: 'États-Unis' },
    KEF: { city: 'Reykjavik', country: 'Islande' },
    ATH: { city: 'Athènes', country: 'Grèce' },
    DUB: { city: 'Dublin', country: 'Irlande' },
    AMS: { city: 'Amsterdam', country: 'Pays-Bas' },
    OPO: { city: 'Porto', country: 'Portugal' },
    MBJ: { city: 'Montego Bay', country: 'Jamaïque' },
    SJO: { city: 'San José', country: 'Costa Rica' },
    CTG: { city: 'Cartagena', country: 'Colombie' },
    EZE: { city: 'Buenos Aires', country: 'Argentine' },
    SGN: { city: 'Ho Chi Minh', country: 'Vietnam' },
    MAD: { city: 'Madrid', country: 'Espagne' },
    BER: { city: 'Berlin', country: 'Allemagne' },
    YYZ: { city: 'Toronto', country: 'Canada' },
    YOW: { city: 'Ottawa', country: 'Canada' },
    YVR: { city: 'Vancouver', country: 'Canada' },
    YYC: { city: 'Calgary', country: 'Canada' },
    YEG: { city: 'Edmonton', country: 'Canada' },
    YWG: { city: 'Winnipeg', country: 'Canada' },
    YHZ: { city: 'Halifax', country: 'Canada' },
    YQB: { city: 'Québec', country: 'Canada' },
};

interface PageProps {
    params: Promise<{ code: string }>;
}

export async function generateStaticParams() {
    return Object.keys(DESTINATION_MAP).map(code => ({ code }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { code } = await params;
    const dest = DESTINATION_MAP[code.toUpperCase()];
    const city = dest?.city || code;
    const country = dest?.country || '';

    const upperCode = code.toUpperCase();

    return {
        title: `Vol pas cher Montréal → ${city} (${upperCode})`,
        description: `Meilleur prix pour un vol aller-retour Montréal (YUL) → ${city}${country ? `, ${country}` : ''} (${upperCode}). Calendrier des prix, analyse IA et alertes en temps réel.`,
        alternates: { canonical: `/destination/${upperCode}` },
        openGraph: {
            title: `Vol Montréal → ${city} à petit prix — GeaiMonVol`,
            description: `Compare les prix de vols YUL → ${upperCode}. Deals en temps réel, calendrier des meilleurs mois et analyse IA.`,
            type: 'website',
            url: `/destination/${upperCode}`,
        },
        twitter: {
            card: 'summary',
            title: `Vol Montréal → ${city} — GeaiMonVol`,
            description: `Les meilleurs deals de vols vers ${city} depuis Montréal.`,
        },
    };
}

export default async function DestinationPage({ params }: PageProps) {
    const { code } = await params;
    const upperCode = code.toUpperCase();
    const dest = DESTINATION_MAP[upperCode];

    return (
        <DestinationClient
            code={upperCode}
            city={dest?.city || upperCode}
            country={dest?.country || ''}
        />
    );
}
