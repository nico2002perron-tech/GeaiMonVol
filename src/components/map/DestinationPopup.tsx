'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { CITY_IMAGES, COUNTRY_IMAGES, DEFAULT_CITY_IMAGE, DEAL_LEVELS, COUNTRY_SUBDESTINATIONS } from '@/lib/constants/deals';
import type { SubDestination } from '@/lib/constants/deals';
import { AIRLINE_BAGGAGE } from '@/lib/constants/airlines';

interface DestinationDeal {
    price: number;
    currency: string;
    airline: string;
    airlineLogo?: string;
    operatingAirline?: string;
    stops: number;
    departureDate: string;
    returnDate: string;
    durationMinutes: number;
    returnDurationMinutes?: number;
    returnStops?: number;
    bookingLink: string;
    monthLabel?: string;
    source: string;
    scannedAt: string;
    tags?: string[];
    seatsRemaining?: number;
    totalOptions?: number;
    discount?: number;
    tripNights?: number;
}

interface DestinationPopupProps {
    isOpen: boolean;
    onClose: () => void;
    destination: string;
    destinationCode: string;
    bestPrice?: number;
    dealLevel?: string;
    discount?: number;
    medianPrice?: number;
    avgPrice?: number;
    historyCount?: number;
}

// ── Destination travel tips & nearby connections ──
const DESTINATION_TIPS: Record<string, { tip: string; nearby?: { city: string; reason: string }[] }> = {
    'Le Caire': { tip: 'Les pyramides de Gizeh et le Sphinx sont a 20 min du centre-ville!', nearby: [{ city: 'Louxor', reason: 'la Vallee des Rois' }, { city: 'Charm el-Cheikh', reason: 'plongee en mer Rouge' }] },
    'Cairo': { tip: 'Les pyramides de Gizeh et le Sphinx sont a 20 min du centre-ville!', nearby: [{ city: 'Louxor', reason: 'la Vallee des Rois' }, { city: 'Charm el-Cheikh', reason: 'plongee en mer Rouge' }] },
    'Egypte': { tip: 'Les pyramides de Gizeh sont incontournables, et Louxor est magique!', nearby: [{ city: 'Le Caire', reason: 'les pyramides' }, { city: 'Louxor', reason: 'la Vallee des Rois' }] },
    'Lima': { tip: 'La gastronomie peruvienne est legendaire — ceviche, lomo saltado!', nearby: [{ city: 'Cuzco', reason: 'le Machu Picchu (vols internes ~60$)' }, { city: 'Arequipa', reason: 'le canyon de Colca' }] },
    'Perou': { tip: 'Le Perou c\'est bien plus que Lima — Cuzco et le Machu Picchu sont un must!', nearby: [{ city: 'Cuzco', reason: 'le Machu Picchu' }, { city: 'Arequipa', reason: 'le canyon de Colca' }] },
    'Bogota': { tip: 'Le quartier La Candelaria est superbe, et le Museo del Oro est gratuit!', nearby: [{ city: 'Cartagena', reason: 'la vieille ville coloniale' }, { city: 'Medellin', reason: 'le climat eternel printemps' }] },
    'Colombie': { tip: 'La Colombie c\'est incroyable — Cartagena, Medellin, le cafe...', nearby: [{ city: 'Cartagena', reason: 'la cote Caraibe' }, { city: 'Medellin', reason: 'la ville de l\'innovation' }] },
    'Paris': { tip: 'Evite les restos touristiques pres de la Tour Eiffel — mange dans le Marais!', nearby: [{ city: 'Bruxelles', reason: 'a 1h20 en TGV' }, { city: 'Amsterdam', reason: 'a 3h15 en Thalys' }] },
    'Londres': { tip: 'La plupart des musees sont GRATUITS — British Museum, Tate Modern, etc.', nearby: [{ city: 'Paris', reason: 'a 2h15 en Eurostar' }, { city: 'Edinburgh', reason: 'vols internes ~30 GBP' }] },
    'Lisbonne': { tip: 'Prends le tram 28 pour traverser les plus beaux quartiers!', nearby: [{ city: 'Porto', reason: 'a 3h en train' }, { city: 'Sintra', reason: 'palais feeeriques a 40 min' }] },
    'Barcelone': { tip: 'Reserve la Sagrada Familia en avance — c\'est souvent complet!', nearby: [{ city: 'Madrid', reason: 'a 2h30 en AVE' }, { city: 'Majorque', reason: 'vols internes ~30 EUR' }] },
    'Rome': { tip: 'Le Vatican est gratuit le dernier dimanche du mois!', nearby: [{ city: 'Florence', reason: 'a 1h30 en train' }, { city: 'Naples', reason: 'pizza originale + Pompei' }] },
    'Tokyo': { tip: 'Le Japan Rail Pass se rentabilise en 2 jours — achete-le avant de partir!', nearby: [{ city: 'Kyoto', reason: 'temples et geishas a 2h15 en Shinkansen' }, { city: 'Osaka', reason: 'la capitale du street food' }] },
    'Bangkok': { tip: 'Les temples sont gratuits ou presque — Wat Pho, Wat Arun, incroyable!', nearby: [{ city: 'Chiang Mai', reason: 'temples dans la jungle' }, { city: 'Phuket', reason: 'plages paradisiaques' }] },
    'Thailande': { tip: 'La Thailande est super abordable — budget 30-50$/jour facilement!', nearby: [{ city: 'Chiang Mai', reason: 'le nord montagneux' }, { city: 'Krabi', reason: 'les iles Phi Phi' }] },
    'Cancun': { tip: 'Chichen Itza est a 2h en bus — un des 7 merveilles du monde!', nearby: [{ city: 'Playa del Carmen', reason: 'a 1h en bus' }, { city: 'Tulum', reason: 'ruines mayas sur la plage' }] },
    'Cancún': { tip: 'Chichen Itza est a 2h en bus — un des 7 merveilles du monde!', nearby: [{ city: 'Playa del Carmen', reason: 'a 1h en bus' }, { city: 'Tulum', reason: 'ruines mayas sur la plage' }] },
    'Mexique': { tip: 'Le Mexique c\'est enorme — combine plage a Cancun et culture a Mexico!', nearby: [{ city: 'Mexico', reason: 'la capitale historique' }, { city: 'Oaxaca', reason: 'gastronomie + culture' }] },
    'Punta Cana': { tip: 'Les tout-inclus sont parmi les meilleurs rapport qualite-prix des Caraibes!', nearby: [{ city: 'Santo Domingo', reason: 'la plus vieille ville des Ameriques' }] },
    'La Havane': { tip: 'Apporte du cash — les cartes de credit canadiennes marchent rarement!', nearby: [{ city: 'Varadero', reason: 'la plage a 2h en bus' }, { city: 'Trinidad', reason: 'ville coloniale UNESCO' }] },
    'Cuba': { tip: 'Apporte du cash CAD ou EUR — les cartes fonctionnent rarement!', nearby: [{ city: 'La Havane', reason: 'autos classiques + culture' }, { city: 'Trinidad', reason: 'ville coloniale UNESCO' }] },
    'New York': { tip: 'Le ferry de Staten Island est GRATUIT et offre une vue incroyable sur la Statue de la Liberte!', nearby: [{ city: 'Washington', reason: 'a 3h en bus Megabus' }] },
    'Athenes': { tip: 'L\'Acropole est magique au coucher du soleil — evite midi!', nearby: [{ city: 'Santorin', reason: 'ferry ou vol interne ~40 EUR' }, { city: 'Crete', reason: 'plages + ruines minoennes' }] },
    'Grece': { tip: 'Les iles grecques sont magiques — combine Athenes + Santorin!', nearby: [{ city: 'Santorin', reason: 'couchers de soleil legendaires' }, { city: 'Mykonos', reason: 'ambiance festive' }] },
    'Marrakech': { tip: 'Negocie TOUT au souk — commence a 30% du prix demande!', nearby: [{ city: 'Fes', reason: 'la plus ancienne medina' }, { city: 'Essaouira', reason: 'ville cotiere a 3h' }] },
    'Maroc': { tip: 'Le Maroc est incroyable et tres abordable depuis Montreal!', nearby: [{ city: 'Marrakech', reason: 'les souks et Jemaa el-Fna' }, { city: 'Fes', reason: 'la medina UNESCO' }] },
    'Istanbul': { tip: 'Sainte-Sophie et la Mosquee Bleue sont cote a cote — prevois une journee!', nearby: [{ city: 'Cappadoce', reason: 'montgolfieres et grottes' }] },
    'Turquie': { tip: 'La Turquie offre un mix incroyable de culture et plages!', nearby: [{ city: 'Istanbul', reason: 'histoire millénaire' }, { city: 'Cappadoce', reason: 'paysages lunaires' }] },
    'Dublin': { tip: 'Le Guiness Storehouse vaut le detour — la vue du rooftop est malade!', nearby: [{ city: 'Galway', reason: 'la cote ouest sauvage' }, { city: 'Belfast', reason: 'Titanic Museum + Giant\'s Causeway' }] },
    'Reykjavik': { tip: 'Le Blue Lagoon c\'est touristique mais magique. Reserve en avance!', nearby: [{ city: 'Cercle d\'Or', reason: 'geysers + cascades en 1 jour' }] },
    'San José': { tip: 'Le Costa Rica c\'est la nature pure — forets, volcans, plages!', nearby: [{ city: 'Monteverde', reason: 'foret de nuages' }, { city: 'Manuel Antonio', reason: 'parc national + plage' }] },
    'Costa Rica': { tip: 'Pura Vida! Le Costa Rica c\'est nature, aventure et plages!', nearby: [{ city: 'Monteverde', reason: 'tyroliennes dans la canopee' }, { city: 'La Fortuna', reason: 'volcan Arenal + sources chaudes' }] },
    'Montego Bay': { tip: 'Les chutes de la riviere Dunn sont un incontournable!', nearby: [{ city: 'Negril', reason: 'Seven Mile Beach' }, { city: 'Ocho Rios', reason: 'plages et cascades' }] },
    'Jamaique': { tip: 'La Jamaique c\'est reggae, plages et jerk chicken!', nearby: [{ city: 'Montego Bay', reason: 'la capitale touristique' }, { city: 'Kingston', reason: 'le musee Bob Marley' }] },
    'Vancouver': { tip: 'Stanley Park et Granville Island sont des musts — et c\'est gratuit!', nearby: [{ city: 'Victoria', reason: 'ferry scenic de 90 min' }, { city: 'Whistler', reason: 'montagnes a 2h' }] },
    'Calgary': { tip: 'Banff et Lake Louise sont a 1h30 — paysages de carte postale!', nearby: [{ city: 'Banff', reason: 'Rocheuses canadiennes' }, { city: 'Jasper', reason: 'Icefields Parkway' }] },
    'Toronto': { tip: 'Le quartier Kensington Market est super pour la bouffe de rue!', nearby: [{ city: 'Chutes Niagara', reason: 'a 1h30 en bus' }, { city: 'Ottawa', reason: 'la capitale a 4h' }] },
    'Varadero': { tip: 'La plage de Varadero fait 20 km de sable blanc!', nearby: [{ city: 'La Havane', reason: 'a 2h en bus' }] },
    'Porto': { tip: 'Le port est obligatoire — visite les caves de Vila Nova de Gaia!', nearby: [{ city: 'Lisbonne', reason: 'a 3h en train' }, { city: 'Vallee du Douro', reason: 'vignobles en bateau' }] },
    'Madrid': { tip: 'Le Musee du Prado est gratuit les 2 dernieres heures chaque jour!', nearby: [{ city: 'Tolede', reason: 'ville medievale a 30 min en train' }, { city: 'Seville', reason: 'a 2h30 en AVE' }] },
    'Amsterdam': { tip: 'Loue un velo — c\'est LE moyen de transport a Amsterdam!', nearby: [{ city: 'Bruges', reason: 'a 3h en train' }, { city: 'Rotterdam', reason: 'architecture futuriste a 40 min' }] },
    'Prague': { tip: 'La biere est moins chere que l\'eau — et elle est excellente!', nearby: [{ city: 'Vienne', reason: 'a 4h en train' }, { city: 'Cesky Krumlov', reason: 'village medieval UNESCO' }] },
    'Budapest': { tip: 'Les bains thermaux Szechenyi sont un must — surtout en hiver!', nearby: [{ city: 'Vienne', reason: 'a 2h40 en train' }, { city: 'Bratislava', reason: 'a 2h30 en bus' }] },
    'Bali': { tip: 'Ubud pour la culture, Seminyak pour la plage, Nusa Penida pour l\'aventure!', nearby: [{ city: 'Nusa Penida', reason: 'falaises et manta rays' }, { city: 'Gili Islands', reason: 'plongee + tortues' }] },
    'Japon': { tip: 'Le JR Pass est indispensable — Shinkansen illimite!', nearby: [{ city: 'Tokyo', reason: 'la megalopole' }, { city: 'Kyoto', reason: 'les temples millénaires' }] },
    'Inde': { tip: 'Le Taj Mahal au lever du soleil c\'est inoubliable!', nearby: [{ city: 'Delhi', reason: 'porte d\'entree' }, { city: 'Jaipur', reason: 'la ville rose du Rajasthan' }] },
    'Vietnam': { tip: 'Ha Long Bay en bateau c\'est feerique — prevois 2 jours!', nearby: [{ city: 'Hanoi', reason: 'street food legendaire' }, { city: 'Ho Chi Minh', reason: 'la ville dynamique du sud' }] },
};

function formatDateFr(dateStr: string): string {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        const day = d.getDate();
        const months = ['jan', 'fev', 'mar', 'avr', 'mai', 'juin', 'juil', 'aout', 'sep', 'oct', 'nov', 'dec'];
        return `${day} ${months[d.getMonth()]}`;
    } catch { return dateStr; }
}

function formatStops(stops: number): string {
    if (stops <= 0) return 'Direct';
    if (stops === 1) return '1 escale';
    return `${stops} escales`;
}

function formatDuration(mins: number): string {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

function getTripNights(dep: string, ret: string): number {
    if (!dep || !ret) return 0;
    return Math.round((new Date(ret).getTime() - new Date(dep).getTime()) / 86400000);
}

// ── GeAI mascot quote for popup ──
function getGeaiPopupQuote(
    destination: string,
    bestPrice: number,
    medianPrice: number,
    avgPrice: number,
    historyCount: number,
    dealLevel?: string
): { savings: string; tip: string | null; nearby: { city: string; reason: string }[] } {
    const refPrice = medianPrice > 0 ? medianPrice : avgPrice;
    const dollarSaved = refPrice > bestPrice ? Math.round(refPrice - bestPrice) : 0;

    // Savings message
    let savings = '';
    if (dollarSaved > 0 && historyCount >= 3) {
        if (dealLevel === 'lowest_ever') {
            savings = `AYOYE! A ${Math.round(bestPrice)}$, tu sauves ${dollarSaved}$ vs le prix habituel! C'est le prix le plus bas que j'ai JAMAIS scanne!`;
        } else if (dealLevel === 'incredible') {
            savings = `Wow! A ce prix-la tu sauves ${dollarSaved}$ par rapport a la mediane de ${Math.round(refPrice)}$! J'ai analyse ${historyCount} prix en 90 jours — c'est un deal en OR!`;
        } else if (dealLevel === 'great') {
            savings = `Beau deal! Tu sauves ${dollarSaved}$ vs le prix habituel de ${Math.round(refPrice)}$. Mon scan de ${historyCount} prix confirme que c'est legit!`;
        } else {
            savings = `Pas pire! Tu sauves ${dollarSaved}$ par rapport au prix median de ${Math.round(refPrice)}$. Basé sur ${historyCount} prix scannes.`;
        }
    } else if (historyCount >= 3) {
        savings = `Prix actuel: ${Math.round(bestPrice)}$ (mediane: ${Math.round(refPrice)}$ sur ${historyCount} scans). Pas de rabais fou, mais c'est un prix honnete!`;
    } else {
        savings = `Prix actuel: ${Math.round(bestPrice)}$. J'ai pas encore assez de data pour comparer — je continue de scanner!`;
    }

    // Destination-specific tip
    const tips = DESTINATION_TIPS[destination];
    const tip = tips?.tip || null;
    const nearby = tips?.nearby || [];

    return { savings, tip, nearby };
}

type SortMode = 'date' | 'price';

export default function DestinationPopup({
    isOpen,
    onClose,
    destination,
    destinationCode,
    bestPrice,
    dealLevel,
    discount,
    medianPrice: propMedianPrice,
    avgPrice: propAvgPrice,
    historyCount: propHistoryCount,
}: DestinationPopupProps) {
    const [deals, setDeals] = useState<DestinationDeal[]>([]);
    const [loading, setLoading] = useState(false);
    const [liveSearching, setLiveSearching] = useState(false);
    const [error, setError] = useState('');
    const [sortMode, setSortMode] = useState<SortMode>('date');
    const [avgPrice, setAvgPrice] = useState(0);
    const [medianPrice, setMedianPrice] = useState(0);
    const [historyCount, setHistoryCount] = useState(0);
    const [popupToast, setPopupToast] = useState('');
    const overlayRef = useRef<HTMLDivElement>(null);

    // Country-level detection
    const isCountryLevel = destinationCode.length === 2 && destinationCode === destinationCode.toUpperCase();
    const subDestinations: SubDestination[] = isCountryLevel ? (COUNTRY_SUBDESTINATIONS[destinationCode] || []) : [];
    const [selectedSubDest, setSelectedSubDest] = useState<SubDestination | null>(null);

    const activeCode = selectedSubDest?.code || destinationCode;
    const activeCity = selectedSubDest?.city || destination;
    const fallbackUrl = `https://www.skyscanner.ca/transport/flights/yul/${activeCode.toLowerCase()}/`;

    // Reset when popup opens
    useEffect(() => {
        if (!isOpen) return;
        setSelectedSubDest(null);
        setDeals([]);
        setError('');
        setAvgPrice(0);
        setMedianPrice(0);
        setHistoryCount(0);
        setSortMode('date');
    }, [isOpen]);

    // Fetch deals when destination changes
    useEffect(() => {
        if (!isOpen || !activeCity) return;

        // For country-level with sub-destinations, wait for city pick
        if (isCountryLevel && subDestinations.length > 0 && !selectedSubDest) {
            setDeals([]);
            setLoading(false);
            return;
        }

        const canLiveSearch = activeCode.length >= 3;

        setLoading(true);
        setError('');
        setDeals([]);
        setLiveSearching(false);

        fetch(`/api/prices/destination?name=${encodeURIComponent(activeCity)}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setError(data.error);
                    setLoading(false);
                    return;
                }

                const dbDeals: DestinationDeal[] = data.deals || [];
                if (data.avgPrice) setAvgPrice(data.avgPrice);
                if (data.medianPrice) setMedianPrice(data.medianPrice);
                if (data.historyCount) setHistoryCount(data.historyCount);

                if (dbDeals.length > 0) {
                    setDeals(dbDeals);
                    setLoading(false);

                    // If few results, also trigger live search to fill in gaps
                    if (dbDeals.length < 4 && canLiveSearch) {
                        setLiveSearching(true);
                        fetchLiveDeals(dbDeals);
                    }
                } else if (canLiveSearch) {
                    // No DB deals — do live search
                    setLiveSearching(true);
                    fetchLiveDeals([]);
                } else {
                    setLoading(false);
                }
            })
            .catch(() => {
                setError('Impossible de charger les dates');
                setLoading(false);
            });

        function fetchLiveDeals(existingDeals: DestinationDeal[]) {
            fetch(`/api/prices/search-live?code=${encodeURIComponent(activeCode)}&city=${encodeURIComponent(activeCity)}`)
                .then((res) => res.json())
                .then((liveData) => {
                    if (liveData.deals && liveData.deals.length > 0) {
                        // Merge: keep existing + add new dates not already present
                        const existingDates = new Set(existingDeals.map(d => d.departureDate));
                        const newDeals = liveData.deals.filter(
                            (d: DestinationDeal) => !existingDates.has(d.departureDate)
                        );
                        const merged = [...existingDeals, ...newDeals]
                            .sort((a, b) => a.departureDate.localeCompare(b.departureDate));
                        setDeals(merged);
                    }
                })
                .catch(() => {})
                .finally(() => {
                    setLiveSearching(false);
                    setLoading(false);
                });
        }
    }, [isOpen, activeCity, activeCode, isCountryLevel, selectedSubDest, subDestinations.length]);

    // Close on ESC
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const imgSrc = CITY_IMAGES[destination] || COUNTRY_IMAGES[destination] || DEFAULT_CITY_IMAGE;
    const level = dealLevel ? DEAL_LEVELS[dealLevel] : null;

    // Sort deals
    const sortedDeals = [...deals].sort((a, b) => {
        if (sortMode === 'price') return a.price - b.price;
        return a.departureDate.localeCompare(b.departureDate);
    });

    const cheapestPrice = deals.length > 0 ? Math.min(...deals.map(d => d.price)) : 0;

    const shareDestination = () => {
        const text = `Vol Montreal → ${destination} des ${cheapestPrice}$ A/R sur GeaiMonVol`;
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({ title: `Deal GeaiMonVol - ${destination}`, text, url }).catch(() => {});
        } else {
            navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
                setPopupToast('Lien copie!');
                setTimeout(() => setPopupToast(''), 2000);
            }).catch(() => {});
        }
    };

    return (
        <>
            <div
                ref={overlayRef}
                onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 500,
                    background: 'rgba(2, 8, 16, 0.6)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 16,
                    animation: 'destFadeIn 0.25s ease-out',
                }}
            >
                <div
                    style={{
                        position: 'relative', width: '100%', maxWidth: 560,
                        maxHeight: 'calc(100vh - 32px)',
                        background: '#fff',
                        borderRadius: 24,
                        boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
                        overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                        animation: 'destSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                >
                    {/* ═══ HERO IMAGE ═══ */}
                    <div style={{ position: 'relative', height: 180, flexShrink: 0 }}>
                        <img
                            src={imgSrc}
                            alt={destination}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_CITY_IMAGE; }}
                        />
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
                        }} />

                        {/* Close */}
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute', top: 12, right: 12,
                                width: 36, height: 36, borderRadius: '50%',
                                border: 'none', background: 'rgba(0,0,0,0.4)',
                                backdropFilter: 'blur(12px)', color: '#fff',
                                fontSize: 18, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            &times;
                        </button>

                        {/* Deal badge */}
                        {level && (
                            <div style={{
                                position: 'absolute', top: 12, left: 12,
                                padding: '5px 12px', borderRadius: 20,
                                background: level.bg, color: '#fff',
                                fontSize: 11, fontWeight: 700,
                                fontFamily: "'Outfit', sans-serif",
                                display: 'flex', alignItems: 'center', gap: 4,
                                boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                            }}>
                                {level.icon} {level.label}
                            </div>
                        )}

                        {/* City name */}
                        <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
                            <h2 style={{
                                margin: 0, fontSize: 28, fontWeight: 700, color: '#fff',
                                fontFamily: "'Fredoka', sans-serif",
                                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                lineHeight: 1.1,
                            }}>
                                {destination}
                            </h2>
                            <div style={{
                                fontSize: 13, color: 'rgba(255,255,255,0.9)',
                                fontFamily: "'Outfit', sans-serif",
                                marginTop: 4, display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                                    padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                }}>
                                    YUL &rarr; {activeCode}
                                </span>
                                {bestPrice != null && (
                                    <span style={{
                                        fontWeight: 700, fontFamily: "'Fredoka', sans-serif", fontSize: 16,
                                    }}>
                                        {Math.round(bestPrice)} $
                                    </span>
                                )}
                                {discount != null && discount > 0 && (
                                    <span style={{
                                        background: 'rgba(16,185,129,0.3)', color: '#6EE7B7',
                                        padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                                    }}>
                                        -{discount}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ═══ CONTENT ═══ */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 24px' }}>

                        {/* ── City picker (country-level) ── */}
                        {isCountryLevel && subDestinations.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{
                                    fontSize: 13, fontWeight: 600, color: '#0F172A',
                                    fontFamily: "'Outfit', sans-serif", marginBottom: 8,
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    Choisis ta ville
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                    gap: 8,
                                }}>
                                    {subDestinations.map((sub) => {
                                        const isSelected = selectedSubDest?.code === sub.code;
                                        return (
                                            <button
                                                key={sub.code}
                                                onClick={() => setSelectedSubDest(isSelected ? null : sub)}
                                                style={{
                                                    position: 'relative',
                                                    border: isSelected ? '2px solid #0EA5E9' : '2px solid transparent',
                                                    borderRadius: 12, overflow: 'hidden',
                                                    cursor: 'pointer', background: 'none', padding: 0,
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <img
                                                    src={sub.image}
                                                    alt={sub.city}
                                                    style={{
                                                        width: '100%', height: 70, objectFit: 'cover', display: 'block',
                                                        filter: isSelected ? 'brightness(1.05)' : 'brightness(0.85)',
                                                    }}
                                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_CITY_IMAGE; }}
                                                />
                                                <div style={{
                                                    position: 'absolute', inset: 0,
                                                    background: isSelected
                                                        ? 'linear-gradient(to top, rgba(14,165,233,0.7), transparent 60%)'
                                                        : 'linear-gradient(to top, rgba(0,0,0,0.6), transparent 60%)',
                                                }} />
                                                <div style={{
                                                    position: 'absolute', bottom: 4, left: 6,
                                                    fontSize: 11, fontWeight: 700, color: '#fff',
                                                    fontFamily: "'Outfit', sans-serif",
                                                    textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                                                }}>
                                                    {sub.city}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                {!selectedSubDest && (
                                    <div style={{
                                        textAlign: 'center', marginTop: 8,
                                        fontSize: 12, color: '#94A3B8', fontFamily: "'Outfit', sans-serif",
                                    }}>
                                        Choisis une ville pour voir les dates
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Header bar: count + sort + Skyscanner link ── */}
                        {(!isCountryLevel || selectedSubDest || subDestinations.length === 0) && (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                marginBottom: 12, gap: 8,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: (loading || liveSearching) ? '#F59E0B' : deals.length > 0 ? '#10B981' : '#94A3B8',
                                        animation: (loading || liveSearching) ? 'destPulse 1.5s ease-in-out infinite' : 'none',
                                    }} />
                                    <span style={{
                                        fontSize: 13, fontWeight: 600, color: '#0F172A',
                                        fontFamily: "'Outfit', sans-serif",
                                    }}>
                                        {loading
                                            ? 'Chargement...'
                                            : liveSearching
                                                ? `Recherche en cours...`
                                                : deals.length > 0
                                                    ? `${deals.length} date${deals.length > 1 ? 's' : ''} disponible${deals.length > 1 ? 's' : ''}`
                                                    : 'Aucune date trouvee'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    {/* Sort toggle */}
                                    {deals.length > 1 && (
                                        <div style={{
                                            display: 'flex', borderRadius: 8, overflow: 'hidden',
                                            border: '1px solid #E2E8F0',
                                        }}>
                                            <button
                                                onClick={() => setSortMode('date')}
                                                style={{
                                                    padding: '4px 10px', border: 'none', fontSize: 11, fontWeight: 600,
                                                    fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                                                    background: sortMode === 'date' ? '#0EA5E9' : '#fff',
                                                    color: sortMode === 'date' ? '#fff' : '#64748B',
                                                }}
                                            >
                                                Date
                                            </button>
                                            <button
                                                onClick={() => setSortMode('price')}
                                                style={{
                                                    padding: '4px 10px', border: 'none', fontSize: 11, fontWeight: 600,
                                                    fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                                                    background: sortMode === 'price' ? '#0EA5E9' : '#fff',
                                                    color: sortMode === 'price' ? '#fff' : '#64748B',
                                                }}
                                            >
                                                Prix
                                            </button>
                                        </div>
                                    )}
                                    {/* Skyscanner link */}
                                    <a
                                        href={fallbackUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            fontSize: 11, fontWeight: 600, color: '#0284C7',
                                            fontFamily: "'Outfit', sans-serif", textDecoration: 'none',
                                            display: 'flex', alignItems: 'center', gap: 3,
                                            padding: '4px 10px', borderRadius: 8,
                                            background: 'rgba(14,165,233,0.06)',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        Skyscanner
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* ═══ GeAI MASCOT ═══ */}
                        {bestPrice != null && bestPrice > 0 && !loading && deals.length > 0 && (() => {
                            const effMedian = medianPrice || propMedianPrice || 0;
                            const effAvg = avgPrice || propAvgPrice || 0;
                            const effHistory = historyCount || propHistoryCount || 0;
                            const geai = getGeaiPopupQuote(destination, bestPrice, effMedian, effAvg, effHistory, dealLevel);

                            return (
                                <div style={{
                                    marginBottom: 16, padding: '14px 16px', borderRadius: 16,
                                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                                    border: '1px solid rgba(14,165,233,0.15)',
                                    animation: 'geaiBounce 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both',
                                }}>
                                    {/* Header */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
                                    }}>
                                        <div style={{
                                            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                                            background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            position: 'relative',
                                            animation: 'geaiBob 3s ease-in-out infinite',
                                            boxShadow: '0 2px 12px rgba(14,165,233,0.4)',
                                        }}>
                                            <img src="/logo_geai.png" alt="GeAI" width={26} height={26} style={{ borderRadius: '50%' }} />
                                            <span style={{
                                                position: 'absolute', bottom: -3, right: -6,
                                                fontSize: 7, fontWeight: 800, padding: '1px 5px',
                                                borderRadius: 4, background: '#F59E0B', color: '#fff',
                                                fontFamily: "'Fredoka', sans-serif",
                                                boxShadow: '0 1px 4px rgba(245,158,11,0.4)',
                                            }}>IA</span>
                                        </div>
                                        <div>
                                            <div style={{
                                                fontSize: 12, fontWeight: 700, color: '#0EA5E9',
                                                fontFamily: "'Fredoka', sans-serif",
                                                display: 'flex', alignItems: 'center', gap: 6,
                                            }}>
                                                Le Geai dit :
                                                {effHistory >= 3 && (
                                                    <span style={{
                                                        fontSize: 9, fontWeight: 600, padding: '1px 7px',
                                                        borderRadius: 100, background: 'rgba(14,165,233,0.15)',
                                                        color: 'rgba(14,165,233,0.7)', fontFamily: "'Outfit', sans-serif",
                                                    }}>
                                                        {effHistory} prix analyses
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Savings message */}
                                    <div style={{
                                        fontSize: 13, color: 'rgba(255,255,255,0.9)',
                                        fontFamily: "'Outfit', sans-serif", lineHeight: 1.5,
                                        marginBottom: (geai.tip || geai.nearby.length > 0) ? 12 : 0,
                                    }}>
                                        {geai.savings}
                                    </div>

                                    {/* Travel tip */}
                                    {geai.tip && (
                                        <div style={{
                                            padding: '10px 12px', borderRadius: 10,
                                            background: 'rgba(14,165,233,0.08)',
                                            border: '1px solid rgba(14,165,233,0.12)',
                                            marginBottom: geai.nearby.length > 0 ? 10 : 0,
                                        }}>
                                            <div style={{
                                                fontSize: 10, fontWeight: 700, color: '#0EA5E9',
                                                fontFamily: "'Fredoka', sans-serif", marginBottom: 4,
                                                display: 'flex', alignItems: 'center', gap: 4,
                                            }}>
                                                <span style={{ fontSize: 13 }}>&#128161;</span> Conseil du Geai
                                            </div>
                                            <div style={{
                                                fontSize: 12, color: 'rgba(255,255,255,0.8)',
                                                fontFamily: "'Outfit', sans-serif", lineHeight: 1.45,
                                            }}>
                                                {geai.tip}
                                            </div>
                                        </div>
                                    )}

                                    {/* Nearby destinations */}
                                    {geai.nearby.length > 0 && (
                                        <div style={{
                                            padding: '10px 12px', borderRadius: 10,
                                            background: 'rgba(245,158,11,0.06)',
                                            border: '1px solid rgba(245,158,11,0.12)',
                                        }}>
                                            <div style={{
                                                fontSize: 10, fontWeight: 700, color: '#F59E0B',
                                                fontFamily: "'Fredoka', sans-serif", marginBottom: 6,
                                                display: 'flex', alignItems: 'center', gap: 4,
                                            }}>
                                                <span style={{ fontSize: 12 }}>&#9992;&#65039;</span> A proximite
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {geai.nearby.map((n, idx) => (
                                                    <div key={idx} style={{
                                                        fontSize: 12, color: 'rgba(255,255,255,0.8)',
                                                        fontFamily: "'Outfit', sans-serif", lineHeight: 1.4,
                                                        display: 'flex', alignItems: 'flex-start', gap: 6,
                                                    }}>
                                                        <span style={{
                                                            fontSize: 8, color: '#F59E0B', marginTop: 4, flexShrink: 0,
                                                        }}>&#9679;</span>
                                                        <span><strong style={{ color: '#F59E0B' }}>{n.city}</strong> — {n.reason}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Error */}
                        {error && (
                            <div style={{
                                padding: '12px 16px', borderRadius: 12,
                                background: 'rgba(239,68,68,0.06)', color: '#DC2626',
                                fontSize: 13, fontFamily: "'Outfit', sans-serif", marginBottom: 12,
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Loading skeleton */}
                        {loading && !liveSearching && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} style={{
                                        height: 72, borderRadius: 14,
                                        background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'destShimmer 1.5s ease-in-out infinite',
                                    }} />
                                ))}
                            </div>
                        )}

                        {/* ═══ PRICE VS AVERAGE CHART ═══ */}
                        {avgPrice > 0 && sortedDeals.length > 1 && (
                            <div style={{
                                marginBottom: 16, padding: '14px 16px', borderRadius: 16,
                                background: 'linear-gradient(135deg, #F0F9FF, #F8FAFC)',
                                border: '1px solid #E0F2FE',
                            }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginBottom: 10,
                                }}>
                                    <span style={{
                                        fontSize: 12, fontWeight: 700, color: '#0F172A',
                                        fontFamily: "'Outfit', sans-serif",
                                        display: 'flex', alignItems: 'center', gap: 5,
                                    }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-6 6"/></svg>
                                        Prix vs moyenne 90 jours
                                    </span>
                                    <span style={{
                                        fontSize: 11, fontWeight: 600, color: '#94A3B8',
                                        fontFamily: "'Fredoka', sans-serif",
                                    }}>
                                        Moy. {avgPrice} $
                                    </span>
                                </div>
                                {/* Mini bar chart */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {sortedDeals.slice(0, 8).map((deal, i) => {
                                        const maxPrice = Math.max(avgPrice, ...sortedDeals.map(d => d.price));
                                        const barWidth = Math.max(15, (deal.price / maxPrice) * 100);
                                        const avgLinePos = (avgPrice / maxPrice) * 100;
                                        const isBelow = deal.price < avgPrice;
                                        const isCheap = deal.price === cheapestPrice;

                                        return (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{
                                                    fontSize: 9, fontWeight: 600, color: '#94A3B8',
                                                    fontFamily: "'Outfit', sans-serif",
                                                    width: 36, textAlign: 'right', flexShrink: 0,
                                                }}>
                                                    {formatDateFr(deal.departureDate).split(' ')[0]}{' '}
                                                    {['jan','fev','mar','avr','mai','jun','jul','aou','sep','oct','nov','dec'][new Date(deal.departureDate + 'T00:00:00').getMonth()]}
                                                </span>
                                                <div style={{
                                                    flex: 1, height: 18, position: 'relative',
                                                    background: '#E2E8F0', borderRadius: 4, overflow: 'hidden',
                                                }}>
                                                    {/* Price bar */}
                                                    <div style={{
                                                        height: '100%', borderRadius: 4,
                                                        width: `${barWidth}%`,
                                                        background: isCheap
                                                            ? 'linear-gradient(90deg, #10B981, #34D399)'
                                                            : isBelow
                                                                ? 'linear-gradient(90deg, #0EA5E9, #38BDF8)'
                                                                : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                                                        transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                                        paddingRight: 6,
                                                    }}>
                                                        <span style={{
                                                            fontSize: 9, fontWeight: 700, color: '#fff',
                                                            fontFamily: "'Fredoka', sans-serif",
                                                            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                                        }}>
                                                            {Math.round(deal.price)}$
                                                        </span>
                                                    </div>
                                                    {/* Average price line */}
                                                    <div style={{
                                                        position: 'absolute', top: 0, bottom: 0,
                                                        left: `${avgLinePos}%`,
                                                        width: 2, background: '#DC2626',
                                                        opacity: 0.6,
                                                    }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Legend */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 12, marginTop: 8,
                                    justifyContent: 'center',
                                }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#64748B', fontFamily: "'Outfit', sans-serif" }}>
                                        <span style={{ width: 8, height: 8, borderRadius: 2, background: '#10B981' }} />
                                        Meilleur prix
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#64748B', fontFamily: "'Outfit', sans-serif" }}>
                                        <span style={{ width: 8, height: 8, borderRadius: 2, background: '#0EA5E9' }} />
                                        Sous la moyenne
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#64748B', fontFamily: "'Outfit', sans-serif" }}>
                                        <span style={{ width: 2, height: 10, background: '#DC2626', opacity: 0.6 }} />
                                        Moyenne
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* ═══ DEAL DATE CARDS ═══ */}
                        {sortedDeals.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {sortedDeals.map((deal, i) => {
                                    const isCheapest = deal.price === cheapestPrice;
                                    const nights = deal.tripNights || getTripNights(deal.departureDate, deal.returnDate);
                                    const dealDiscount = deal.discount || (avgPrice > deal.price
                                        ? Math.round(((avgPrice - deal.price) / avgPrice) * 100)
                                        : 0);
                                    const isBelow = avgPrice > 0 && deal.price < avgPrice;

                                    return (
                                        <a
                                            key={`${deal.departureDate}-${deal.returnDate}-${i}`}
                                            href={deal.bookingLink || fallbackUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 12,
                                                padding: '14px 16px',
                                                borderRadius: 14,
                                                background: isCheapest
                                                    ? 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.03))'
                                                    : isBelow
                                                        ? 'linear-gradient(135deg, rgba(14,165,233,0.04), rgba(14,165,233,0.01))'
                                                        : '#F8FAFC',
                                                border: isCheapest
                                                    ? '2px solid rgba(16,185,129,0.25)'
                                                    : isBelow
                                                        ? '1px solid rgba(14,165,233,0.15)'
                                                        : '1px solid #E2E8F0',
                                                textDecoration: 'none', color: 'inherit',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'none';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {/* Date column */}
                                            <div style={{
                                                width: 56, height: 56, borderRadius: 12, flexShrink: 0,
                                                background: isCheapest ? '#10B981' : isBelow ? '#0EA5E9' : '#E0F2FE',
                                                display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <span style={{
                                                    fontSize: 18, fontWeight: 700, lineHeight: 1,
                                                    fontFamily: "'Fredoka', sans-serif",
                                                    color: (isCheapest || isBelow) ? '#fff' : '#0284C7',
                                                }}>
                                                    {new Date(deal.departureDate + 'T00:00:00').getDate()}
                                                </span>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                                                    fontFamily: "'Outfit', sans-serif",
                                                    color: (isCheapest || isBelow) ? 'rgba(255,255,255,0.85)' : '#0284C7',
                                                }}>
                                                    {['jan','fev','mar','avr','mai','juin','juil','aout','sep','oct','nov','dec'][new Date(deal.departureDate + 'T00:00:00').getMonth()]}
                                                </span>
                                            </div>

                                            {/* Info column */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                {/* Date range */}
                                                <div style={{
                                                    fontSize: 14, fontWeight: 600, color: '#0F172A',
                                                    fontFamily: "'Outfit', sans-serif",
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                }}>
                                                    {formatDateFr(deal.departureDate)} - {formatDateFr(deal.returnDate)}
                                                    {nights > 0 && (
                                                        <span style={{
                                                            fontSize: 10, fontWeight: 600,
                                                            padding: '1px 6px', borderRadius: 6,
                                                            background: 'rgba(99,102,241,0.08)', color: '#6366F1',
                                                        }}>
                                                            {nights}n
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Airline + stops */}
                                                <div style={{
                                                    fontSize: 12, color: '#64748B', marginTop: 3,
                                                    fontFamily: "'Outfit', sans-serif",
                                                    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                                                }}>
                                                    {deal.airline && <span style={{ fontWeight: 500 }}>{deal.airline}</span>}
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 3,
                                                        padding: '1px 6px', borderRadius: 4,
                                                        background: deal.stops === 0 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                                        color: deal.stops === 0 ? '#059669' : '#D97706',
                                                        fontWeight: 600, fontSize: 10,
                                                    }}>
                                                        {formatStops(deal.stops)}
                                                        {deal.durationMinutes > 0 && ` · ${formatDuration(deal.durationMinutes)}`}
                                                    </span>
                                                    {deal.seatsRemaining != null && deal.seatsRemaining <= 4 && (
                                                        <span style={{
                                                            fontSize: 10, fontWeight: 600,
                                                            color: deal.seatsRemaining <= 2 ? '#DC2626' : '#D97706',
                                                        }}>
                                                            {deal.seatsRemaining} place{deal.seatsRemaining > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                    {/* Baggage info */}
                                                    {deal.airline && (() => {
                                                        const bag = AIRLINE_BAGGAGE[deal.airline];
                                                        if (!bag) return null;
                                                        return (
                                                            <span style={{
                                                                fontSize: 10, fontWeight: 600,
                                                                padding: '1px 6px', borderRadius: 4,
                                                                background: bag.checked
                                                                    ? 'rgba(16,185,129,0.08)'
                                                                    : bag.cabin
                                                                        ? 'rgba(14,165,233,0.08)'
                                                                        : 'rgba(239,68,68,0.08)',
                                                                color: bag.checked
                                                                    ? '#059669'
                                                                    : bag.cabin
                                                                        ? '#0284C7'
                                                                        : '#DC2626',
                                                            }}>
                                                                {bag.checked ? '🧳 Bagage inclus' : bag.cabin ? '🎒 Cabine seul.' : '⚠️ Pas de bagage'}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Price column */}
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{
                                                    fontSize: 20, fontWeight: 700, lineHeight: 1,
                                                    fontFamily: "'Fredoka', sans-serif",
                                                    color: isCheapest ? '#059669' : isBelow ? '#0284C7' : '#0F172A',
                                                }}>
                                                    {Math.round(deal.price)} $
                                                </div>
                                                {dealDiscount > 0 && (
                                                    <span style={{
                                                        display: 'inline-block', marginTop: 3,
                                                        fontSize: 10, fontWeight: 700,
                                                        padding: '1px 6px', borderRadius: 6,
                                                        background: dealDiscount >= 30 ? '#10B981' : dealDiscount >= 20 ? '#0EA5E9' : '#94A3B8',
                                                        color: '#fff',
                                                    }}>
                                                        -{dealDiscount}%
                                                    </span>
                                                )}
                                                {isCheapest && (
                                                    <div style={{
                                                        fontSize: 9, fontWeight: 700, color: '#059669',
                                                        fontFamily: "'Outfit', sans-serif", marginTop: 2,
                                                    }}>
                                                        MEILLEUR PRIX
                                                    </div>
                                                )}
                                            </div>

                                            {/* Arrow */}
                                            <div style={{ flexShrink: 0, color: '#94A3B8' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                                                </svg>
                                            </div>
                                        </a>
                                    );
                                })}

                                {/* Live search in progress indicator */}
                                {liveSearching && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        padding: '14px', borderRadius: 14,
                                        background: 'rgba(245,158,11,0.06)', border: '1px dashed rgba(245,158,11,0.3)',
                                    }}>
                                        <div style={{
                                            width: 6, height: 6, borderRadius: '50%',
                                            background: '#F59E0B',
                                            animation: 'destPulse 1.5s ease-in-out infinite',
                                        }} />
                                        <span style={{
                                            fontSize: 12, color: '#D97706', fontWeight: 600,
                                            fontFamily: "'Outfit', sans-serif",
                                        }}>
                                            Recherche de dates supplementaires...
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Empty state ── */}
                        {!loading && !liveSearching && !error && deals.length === 0 && (!isCountryLevel || selectedSubDest || subDestinations.length === 0) && (
                            <div style={{
                                textAlign: 'center', padding: '32px 16px',
                                color: '#94A3B8', fontFamily: "'Outfit', sans-serif",
                            }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>&#9992;</div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                                    Pas encore de dates scannees
                                </div>
                                <div style={{ fontSize: 13, marginBottom: 20, lineHeight: 1.5, maxWidth: 320, margin: '0 auto 20px' }}>
                                    Les prix sont mis a jour automatiquement.
                                    Cherche directement sur Skyscanner en attendant.
                                </div>
                                <a
                                    href={fallbackUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '12px 24px', borderRadius: 14,
                                        background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                        color: '#fff', fontSize: 14, fontWeight: 700,
                                        fontFamily: "'Outfit', sans-serif",
                                        textDecoration: 'none',
                                        boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
                                    }}
                                >
                                    Chercher sur Skyscanner
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M7 17L17 7M17 7H7M17 7v10" />
                                    </svg>
                                </a>
                            </div>
                        )}

                        {/* ── Average price info ── */}
                        {avgPrice > 0 && deals.length > 0 && (
                            <div style={{
                                marginTop: 12, padding: '10px 14px', borderRadius: 12,
                                background: '#F8FAFC', border: '1px solid #E2E8F0',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <span style={{
                                    fontSize: 12, color: '#64748B',
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    Prix moyen (90 jours)
                                </span>
                                <span style={{
                                    fontSize: 14, fontWeight: 700, color: '#94A3B8',
                                    fontFamily: "'Fredoka', sans-serif",
                                    textDecoration: 'line-through',
                                }}>
                                    {avgPrice} $
                                </span>
                            </div>
                        )}


                        {/* ── Share + Tip row ── */}
                        <div style={{
                            marginTop: 12, display: 'flex', gap: 8,
                        }}>
                            <button
                                onClick={shareDestination}
                                style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    padding: '10px 14px', borderRadius: 12,
                                    border: '1px solid #E2E8F0', background: '#fff',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    fontSize: 12, fontWeight: 600, color: '#334155',
                                    fontFamily: "'Outfit', sans-serif",
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                                Partager ce deal
                            </button>
                            <div style={{
                                flex: 1, padding: '10px 14px', borderRadius: 12,
                                background: 'rgba(14,165,233,0.04)',
                                border: '1px solid rgba(14,165,233,0.08)',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <span style={{ fontSize: 13, flexShrink: 0 }}>&#128161;</span>
                                <span style={{
                                    fontSize: 10, color: '#64748B', lineHeight: 1.3,
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    Clique sur une date pour reserver sur Skyscanner
                                </span>
                            </div>
                        </div>

                        {/* Share toast */}
                        {popupToast && (
                            <div style={{
                                marginTop: 8, padding: '8px 16px', borderRadius: 10,
                                background: '#0F172A', color: '#fff',
                                fontSize: 12, fontWeight: 600,
                                fontFamily: "'Outfit', sans-serif",
                                textAlign: 'center',
                                animation: 'destFadeIn 0.25s ease-out',
                            }}>
                                {popupToast}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes destFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes destSlideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes destPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                @keyframes destShimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                @keyframes geaiBounce {
                    0% { transform: scale(0.85) translateX(-6px); opacity: 0; }
                    50% { transform: scale(1.02) translateX(1px); }
                    100% { transform: scale(1) translateX(0); opacity: 1; }
                }
                @keyframes geaiBob {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    25% { transform: translateY(-2px) rotate(2deg); }
                    75% { transform: translateY(1px) rotate(-1deg); }
                }
            `}</style>
        </>
    );
}
