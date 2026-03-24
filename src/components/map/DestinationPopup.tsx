'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { CITY_IMAGES, COUNTRY_IMAGES, DEFAULT_CITY_IMAGE, DEAL_LEVELS, COUNTRY_SUBDESTINATIONS, ALL_INCLUSIVE_CODES } from '@/lib/constants/deals';
import type { SubDestination } from '@/lib/constants/deals';
import { AIRLINE_BAGGAGE } from '@/lib/constants/airlines';
import { useAuth } from '@/lib/auth/AuthProvider';
import { TIERS, PREMIUM_PRICE } from '@/lib/constants/premium';

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

interface HotelInfo {
    name: string;
    stars: number;
    pricePerNight: number;
    totalPrice: number;
    nights: number;
    rating: number;
    reviewCount: number;
    imageUrl: string;
    bookingUrl: string;
    isAllInclusive: boolean;
    amenities?: string[];
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

// ── Amenity icon mapping for hotel badges ──
const AMENITY_ICONS: Record<string, string> = {
    'Free Wi-Fi': '📶',
    'Wi-Fi': '📶',
    'Free parking': '🅿️',
    'Parking': '🅿️',
    'Outdoor pool': '🏊',
    'Pool': '🏊',
    'Indoor pool': '🏊',
    'Hot tub': '♨️',
    'Spa': '💆',
    'Beach access': '🏖️',
    'Beach': '🏖️',
    'Gym': '🏋️',
    'Fitness': '🏋️',
    'Restaurant': '🍽️',
    'Bar': '🍸',
    'Room service': '🛎️',
    'Air conditioning': '❄️',
    'Airport shuttle': '🚌',
};

// ── Destination travel tips & nearby connections ──
const DESTINATION_TIPS: Record<string, { tip: string; nearby?: { city: string; reason: string }[] }> = {
    'Le Caire': { tip: 'Les pyramides de Gizeh et le Sphinx sont à 20 min du centre-ville!', nearby: [{ city: 'Louxor', reason: 'la Vallée des Rois' }, { city: 'Charm el-Cheikh', reason: 'plongée en mer Rouge' }] },
    'Cairo': { tip: 'Les pyramides de Gizeh et le Sphinx sont à 20 min du centre-ville!', nearby: [{ city: 'Louxor', reason: 'la Vallée des Rois' }, { city: 'Charm el-Cheikh', reason: 'plongée en mer Rouge' }] },
    'Egypte': { tip: 'Les pyramides de Gizeh sont incontournables, et Louxor est magique!', nearby: [{ city: 'Le Caire', reason: 'les pyramides' }, { city: 'Louxor', reason: 'la Vallée des Rois' }] },
    'Lima': { tip: 'La gastronomie péruvienne est légendaire — ceviche, lomo saltado!', nearby: [{ city: 'Cuzco', reason: 'le Machu Picchu (vols internes ~60$)' }, { city: 'Arequipa', reason: 'le canyon de Colca' }] },
    'Perou': { tip: 'Le Pérou c\'est bien plus que Lima — Cuzco et le Machu Picchu sont un must!', nearby: [{ city: 'Cuzco', reason: 'le Machu Picchu' }, { city: 'Arequipa', reason: 'le canyon de Colca' }] },
    'Bogota': { tip: 'Le quartier La Candelaria est superbe, et le Museo del Oro est gratuit!', nearby: [{ city: 'Cartagena', reason: 'la vieille ville coloniale' }, { city: 'Medellin', reason: 'le climat éternel printemps' }] },
    'Colombie': { tip: 'La Colombie c\'est incroyable — Cartagena, Medellin, le café...', nearby: [{ city: 'Cartagena', reason: 'la côte Caraïbe' }, { city: 'Medellin', reason: 'la ville de l\'innovation' }] },
    'Paris': { tip: 'Évite les restos touristiques près de la Tour Eiffel — mange dans le Marais!', nearby: [{ city: 'Bruxelles', reason: 'à 1h20 en TGV' }, { city: 'Amsterdam', reason: 'à 3h15 en Thalys' }] },
    'Londres': { tip: 'La plupart des musées sont GRATUITS — British Museum, Tate Modern, etc.', nearby: [{ city: 'Paris', reason: 'à 2h15 en Eurostar' }, { city: 'Edinburgh', reason: 'vols internes ~30 GBP' }] },
    'Lisbonne': { tip: 'Prends le tram 28 pour traverser les plus beaux quartiers!', nearby: [{ city: 'Porto', reason: 'à 3h en train' }, { city: 'Sintra', reason: 'palais féeriques à 40 min' }] },
    'Barcelone': { tip: 'Réserve la Sagrada Familia en avance — c\'est souvent complet!', nearby: [{ city: 'Madrid', reason: 'à 2h30 en AVE' }, { city: 'Majorque', reason: 'vols internes ~30 EUR' }] },
    'Rome': { tip: 'Le Vatican est gratuit le dernier dimanche du mois!', nearby: [{ city: 'Florence', reason: 'à 1h30 en train' }, { city: 'Naples', reason: 'pizza originale + Pompéi' }] },
    'Tokyo': { tip: 'Le Japan Rail Pass se rentabilise en 2 jours — achète-le avant de partir!', nearby: [{ city: 'Kyoto', reason: 'temples et geishas à 2h15 en Shinkansen' }, { city: 'Osaka', reason: 'la capitale du street food' }] },
    'Bangkok': { tip: 'Les temples sont gratuits ou presque — Wat Pho, Wat Arun, incroyable!', nearby: [{ city: 'Chiang Mai', reason: 'temples dans la jungle' }, { city: 'Phuket', reason: 'plages paradisiaques' }] },
    'Thailande': { tip: 'La Thaïlande est super abordable — budget 30-50$/jour facilement!', nearby: [{ city: 'Chiang Mai', reason: 'le nord montagneux' }, { city: 'Krabi', reason: 'les îles Phi Phi' }] },
    'Cancun': { tip: 'Chichen Itza est à 2h en bus — une des 7 merveilles du monde!', nearby: [{ city: 'Playa del Carmen', reason: 'à 1h en bus' }, { city: 'Tulum', reason: 'ruines mayas sur la plage' }] },
    'Cancún': { tip: 'Chichen Itza est à 2h en bus — une des 7 merveilles du monde!', nearby: [{ city: 'Playa del Carmen', reason: 'à 1h en bus' }, { city: 'Tulum', reason: 'ruines mayas sur la plage' }] },
    'Mexique': { tip: 'Le Mexique c\'est énorme — combine plage à Cancun et culture à Mexico!', nearby: [{ city: 'Mexico', reason: 'la capitale historique' }, { city: 'Oaxaca', reason: 'gastronomie + culture' }] },
    'Punta Cana': { tip: 'Les tout-inclus sont parmi les meilleurs rapport qualité-prix des Caraïbes!', nearby: [{ city: 'Santo Domingo', reason: 'la plus vieille ville des Amériques' }] },
    'La Havane': { tip: 'Apporte du cash — les cartes de crédit canadiennes marchent rarement!', nearby: [{ city: 'Varadero', reason: 'la plage à 2h en bus' }, { city: 'Trinidad', reason: 'ville coloniale UNESCO' }] },
    'Cuba': { tip: 'Apporte du cash CAD ou EUR — les cartes fonctionnent rarement!', nearby: [{ city: 'La Havane', reason: 'autos classiques + culture' }, { city: 'Trinidad', reason: 'ville coloniale UNESCO' }] },
    'New York': { tip: 'Le ferry de Staten Island est GRATUIT et offre une vue incroyable sur la Statue de la Liberté!', nearby: [{ city: 'Washington', reason: 'à 3h en bus Megabus' }] },
    'Athenes': { tip: 'L\'Acropole est magique au coucher du soleil — évite midi!', nearby: [{ city: 'Santorin', reason: 'ferry ou vol interne ~40 EUR' }, { city: 'Crète', reason: 'plages + ruines minoennes' }] },
    'Grece': { tip: 'Les îles grecques sont magiques — combine Athènes + Santorin!', nearby: [{ city: 'Santorin', reason: 'couchers de soleil légendaires' }, { city: 'Mykonos', reason: 'ambiance festive' }] },
    'Marrakech': { tip: 'Négocie TOUT au souk — commence à 30% du prix demandé!', nearby: [{ city: 'Fès', reason: 'la plus ancienne médina' }, { city: 'Essaouira', reason: 'ville côtière à 3h' }] },
    'Maroc': { tip: 'Le Maroc est incroyable et très abordable depuis Montréal!', nearby: [{ city: 'Marrakech', reason: 'les souks et Jemaa el-Fna' }, { city: 'Fès', reason: 'la médina UNESCO' }] },
    'Istanbul': { tip: 'Sainte-Sophie et la Mosquée Bleue sont côte à côte — prévois une journée!', nearby: [{ city: 'Cappadoce', reason: 'montgolfières et grottes' }] },
    'Turquie': { tip: 'La Turquie offre un mix incroyable de culture et plages!', nearby: [{ city: 'Istanbul', reason: 'histoire millénaire' }, { city: 'Cappadoce', reason: 'paysages lunaires' }] },
    'Dublin': { tip: 'Le Guiness Storehouse vaut le détour — la vue du rooftop est malade!', nearby: [{ city: 'Galway', reason: 'la côte ouest sauvage' }, { city: 'Belfast', reason: 'Titanic Museum + Giant\'s Causeway' }] },
    'Reykjavik': { tip: 'Le Blue Lagoon c\'est touristique mais magique. Réserve en avance!', nearby: [{ city: 'Cercle d\'Or', reason: 'geysers + cascades en 1 jour' }] },
    'San José': { tip: 'Le Costa Rica c\'est la nature pure — forêts, volcans, plages!', nearby: [{ city: 'Monteverde', reason: 'forêt de nuages' }, { city: 'Manuel Antonio', reason: 'parc national + plage' }] },
    'Costa Rica': { tip: 'Pura Vida! Le Costa Rica c\'est nature, aventure et plages!', nearby: [{ city: 'Monteverde', reason: 'tyroliennes dans la canopée' }, { city: 'La Fortuna', reason: 'volcan Arenal + sources chaudes' }] },
    'Montego Bay': { tip: 'Les chutes de la rivière Dunn sont un incontournable!', nearby: [{ city: 'Negril', reason: 'Seven Mile Beach' }, { city: 'Ocho Rios', reason: 'plages et cascades' }] },
    'Jamaique': { tip: 'La Jamaïque c\'est reggae, plages et jerk chicken!', nearby: [{ city: 'Montego Bay', reason: 'la capitale touristique' }, { city: 'Kingston', reason: 'le musée Bob Marley' }] },
    'Vancouver': { tip: 'Stanley Park et Granville Island sont des musts — et c\'est gratuit!', nearby: [{ city: 'Victoria', reason: 'ferry scenic de 90 min' }, { city: 'Whistler', reason: 'montagnes à 2h' }] },
    'Calgary': { tip: 'Banff et Lake Louise sont à 1h30 — paysages de carte postale!', nearby: [{ city: 'Banff', reason: 'Rocheuses canadiennes' }, { city: 'Jasper', reason: 'Icefields Parkway' }] },
    'Toronto': { tip: 'Le quartier Kensington Market est super pour la bouffe de rue!', nearby: [{ city: 'Chutes Niagara', reason: 'à 1h30 en bus' }, { city: 'Ottawa', reason: 'la capitale à 4h' }] },
    'Varadero': { tip: 'La plage de Varadero fait 20 km de sable blanc!', nearby: [{ city: 'La Havane', reason: 'à 2h en bus' }] },
    'Porto': { tip: 'Le port est obligatoire — visite les caves de Vila Nova de Gaia!', nearby: [{ city: 'Lisbonne', reason: 'à 3h en train' }, { city: 'Vallée du Douro', reason: 'vignobles en bateau' }] },
    'Madrid': { tip: 'Le Musée du Prado est gratuit les 2 dernières heures chaque jour!', nearby: [{ city: 'Tolède', reason: 'ville médiévale à 30 min en train' }, { city: 'Séville', reason: 'à 2h30 en AVE' }] },
    'Amsterdam': { tip: 'Loue un vélo — c\'est LE moyen de transport à Amsterdam!', nearby: [{ city: 'Bruges', reason: 'à 3h en train' }, { city: 'Rotterdam', reason: 'architecture futuriste à 40 min' }] },
    'Prague': { tip: 'La bière est moins chère que l\'eau — et elle est excellente!', nearby: [{ city: 'Vienne', reason: 'à 4h en train' }, { city: 'Cesky Krumlov', reason: 'village médiéval UNESCO' }] },
    'Budapest': { tip: 'Les bains thermaux Szechenyi sont un must — surtout en hiver!', nearby: [{ city: 'Vienne', reason: 'à 2h40 en train' }, { city: 'Bratislava', reason: 'à 2h30 en bus' }] },
    'Bali': { tip: 'Ubud pour la culture, Seminyak pour la plage, Nusa Penida pour l\'aventure!', nearby: [{ city: 'Nusa Penida', reason: 'falaises et manta rays' }, { city: 'Gili Islands', reason: 'plongée + tortues' }] },
    'Japon': { tip: 'Le JR Pass est indispensable — Shinkansen illimité!', nearby: [{ city: 'Tokyo', reason: 'la mégalopole' }, { city: 'Kyoto', reason: 'les temples millénaires' }] },
    'Inde': { tip: 'Le Taj Mahal au lever du soleil c\'est inoubliable!', nearby: [{ city: 'Delhi', reason: 'porte d\'entrée' }, { city: 'Jaipur', reason: 'la ville rose du Rajasthan' }] },
    'Vietnam': { tip: 'Ha Long Bay en bateau c\'est féerique — prévois 2 jours!', nearby: [{ city: 'Hanoi', reason: 'street food légendaire' }, { city: 'Ho Chi Minh', reason: 'la ville dynamique du sud' }] },
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
            savings = `AYOYE! À ${Math.round(bestPrice)}$, tu sauves ${dollarSaved}$ vs le prix habituel! C'est le prix le plus bas que j'ai JAMAIS scanné!`;
        } else if (dealLevel === 'incredible') {
            savings = `Wow! À ce prix-là tu sauves ${dollarSaved}$ par rapport à la médiane de ${Math.round(refPrice)}$! J'ai analysé ${historyCount} prix en 90 jours — c'est un deal en OR!`;
        } else if (dealLevel === 'great') {
            savings = `Beau deal! Tu sauves ${dollarSaved}$ vs le prix habituel de ${Math.round(refPrice)}$. Mon scan de ${historyCount} prix confirme que c'est legit!`;
        } else {
            savings = `Pas pire! Tu sauves ${dollarSaved}$ par rapport au prix médian de ${Math.round(refPrice)}$. Basé sur ${historyCount} prix scannés.`;
        }
    } else if (historyCount >= 3) {
        savings = `Prix actuel: ${Math.round(bestPrice)}$ (médiane: ${Math.round(refPrice)}$ sur ${historyCount} scans). Pas de rabais fou, mais c'est un prix honnête!`;
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
    const { profile } = useAuth();
    const isPremium = profile?.plan === 'premium';
    const tier = isPremium ? TIERS.premium : TIERS.free;

    const [deals, setDeals] = useState<DestinationDeal[]>([]);
    const [loading, setLoading] = useState(false);
    const [liveSearching, setLiveSearching] = useState(false);
    const [error, setError] = useState('');
    const [sortMode, setSortMode] = useState<SortMode>('price');
    const [avgPrice, setAvgPrice] = useState(0);
    const [medianPrice, setMedianPrice] = useState(0);
    const [historyCount, setHistoryCount] = useState(0);
    const [popupToast, setPopupToast] = useState('');
    const overlayRef = useRef<HTMLDivElement>(null);

    // Hotel / Pack state
    const [hotels, setHotels] = useState<HotelInfo[]>([]);
    const [hotelsLoading, setHotelsLoading] = useState(false);

    // 2-step flow for all-inclusive
    const [packStep, setPackStep] = useState<1 | 2 | 3>(1);
    const [selectedFlight, setSelectedFlight] = useState<DestinationDeal | null>(null);
    const [selectedHotel, setSelectedHotel] = useState<HotelInfo | null>(null);
    const [pricingMode, setPricingMode] = useState<'per-person' | 'total-2' | 'family'>('per-person');
    const [familyAdults, setFamilyAdults] = useState(2);
    const [familyChildren, setFamilyChildren] = useState(1);

    // AI deal analysis (Step 3)
    const [packAnalysis, setPackAnalysis] = useState<any>(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);

    // AI hotel summaries
    const [hotelSummaries, setHotelSummaries] = useState<Record<string, string>>({});
    const summariesFetched = useRef(false);

    // Premium: price history chart data
    const [historyPoints, setHistoryPoints] = useState<{ date: string; price: number }[]>([]);
    const [historyStats, setHistoryStats] = useState<{ avg: number; min: number; max: number }>({ avg: 0, min: 0, max: 0 });
    const [historyDays, setHistoryDays] = useState<30 | 60 | 90>(90);
    const [historyLoading, setHistoryLoading] = useState(false);


    // Premium: Google Flights price insights (6-12 month historical)
    const [priceInsights, setPriceInsights] = useState<{
        lowest_price: number;
        price_level: 'low' | 'typical' | 'high';
        typical_price_range: [number, number];
        price_history: Array<[number, number]>;
    } | null>(null);
    const [insightsLoading, setInsightsLoading] = useState(false);

    // Premium: monthly historical analysis (1-3 years)
    interface MonthStats { month: number; median: number; avg: number; min: number; max: number; p25: number; p75: number; count: number; topAirline: string | null }
    const [monthlyData, setMonthlyData] = useState<{
        months: MonthStats[];
        grid: Record<string, Record<number, { median: number; avg: number; min: number; max: number; count: number } | null>>;
        totalDataPoints: number;
    } | null>(null);
    const [monthlyYears, setMonthlyYears] = useState<1 | 2 | 3>(1);
    const [monthlyLoading, setMonthlyLoading] = useState(false);

    // Calendar: extra dates for premium users (fetched from /api/prices/calendar)
    const [calendarDates, setCalendarDates] = useState<Record<string, { price: number; airline: string; stops: number; returnDate: string | null }>>({});
    // Calendar navigation: current month key "YYYY-MM"
    const [calMonth, setCalMonth] = useState('');

    // Premium: predictive forecast
    interface ForecastData {
        verdict: 'BUY_NOW' | 'BUY_SOON' | 'WAIT' | 'NEUTRAL';
        verdictScore: number;
        confidence: number;
        reasoning: string[];
        predicted7d: number;
        predicted14d: number;
        predicted30d: number;
        curve: Array<{ day: number; predicted: number; lower95: number; upper95: number }>;
        signals: Array<{ name: string; direction: 'bullish' | 'bearish' | 'neutral'; strength: number; score: number; label: string; detail: string }>;
        optimalWindow: { min: number; max: number; label: string };
        dataQuality: { points: number; spanDays: number; level: string };
        savingsDetail?: {
            currentPrice: number;
            avgHistorical: number;
            vsAvg: number;
            vsAvgPct: number;
            lowestSeen: number;
            highestSeen: number;
            potentialSaving7d: number;
            potentialSaving30d: number;
        };
        nextMonthComparison?: {
            currentMonth: string;
            nextMonth: string;
            currentMedian: number;
            nextMedian: number;
            difference: number;
            recommendation: string;
        } | null;
        priceContext?: string;
        pronostic?: {
            verdictLine: string;
            reasons: Array<{
                icon: string;
                text: string;
                impact: 'positive' | 'negative' | 'neutral';
            }>;
            monthlyOutlook: Array<{
                month: string;
                medianPrice: number;
                vsCurrent: number;
            }> | null;
            confidenceNote: string;
        };
    }
    const [forecast, setForecast] = useState<ForecastData | null>(null);
    const [forecastLoading, setForecastLoading] = useState(false);

    const flightMultiplier = pricingMode === 'total-2' ? 2 : pricingMode === 'family' ? familyAdults + familyChildren * 0.75 : 1;
    const hotelRooms = pricingMode === 'family' ? Math.ceil(familyAdults / 2) : 1;

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
        setHotels([]);
        setPackStep(1);
        setSelectedFlight(null);
        setSelectedHotel(null);
        setPricingMode('per-person');
        setFamilyAdults(2);
        setFamilyChildren(1);
        setHotelSummaries({});
        summariesFetched.current = false;
        setPackAnalysis(null);
        setAnalysisLoading(false);
        setHistoryPoints([]);
        setHistoryStats({ avg: 0, min: 0, max: 0 });
        setHistoryDays(90);
        setPriceInsights(null);
        setMonthlyData(null);
        setMonthlyYears(1);
        setForecast(null);
        setCalendarDates({});
        setCalMonth('');
    }, [isOpen]);

    // Fetch hotels: all-inclusive (free) or any destination (premium)
    const isAllInclusive = ALL_INCLUSIVE_CODES.includes(activeCode);
    const showPackFlow = isAllInclusive || isPremium; // Premium unlocks hotel flow everywhere
    useEffect(() => {
        if (!isOpen || !activeCode || activeCode.length < 3) return;
        if (!showPackFlow) {
            setHotels([]);
            return;
        }

        setHotelsLoading(true);
        fetch(`/api/prices/hotels?code=${encodeURIComponent(activeCode)}`)
            .then(res => {
                if (res.status === 403 || res.status === 401) {
                    // Not premium — no hotels for non-all-inclusive
                    return { hotels: [] };
                }
                return res.json();
            })
            .then(data => {
                if (data.hotels && data.hotels.length > 0) {
                    setHotels((data.hotels || []).filter((h: any) => !h.stars || h.stars >= 3));
                } else {
                    setHotels([]);
                }
            })
            .catch(() => setHotels([]))
            .finally(() => setHotelsLoading(false));
    }, [isOpen, activeCode, showPackFlow]);

    // Premium: fetch extended calendar dates (6 months of best-price-per-day)
    useEffect(() => {
        if (!isOpen || !activeCode || activeCode.length < 3 || !isPremium) return;
        fetch(`/api/prices/calendar?code=${encodeURIComponent(activeCode)}&months=6`)
            .then(res => res.json())
            .then(data => {
                if (data.dates) setCalendarDates(data.dates);
            })
            .catch(() => setCalendarDates({}));
    }, [isOpen, activeCode, isPremium]);

    // Premium: fetch price history (90-day time-series)
    useEffect(() => {
        if (!isOpen || !activeCity || !isPremium) return;
        setHistoryLoading(true);
        const param = activeCode.length >= 3 ? `code=${encodeURIComponent(activeCode)}` : `destination=${encodeURIComponent(activeCity)}`;
        fetch(`/api/prices/history?${param}&days=${historyDays}`)
            .then(res => res.json())
            .then(data => {
                setHistoryPoints(data.points || []);
                setHistoryStats({ avg: data.avg || 0, min: data.min || 0, max: data.max || 0 });
            })
            .catch(() => { setHistoryPoints([]); })
            .finally(() => setHistoryLoading(false));
    }, [isOpen, activeCity, activeCode, isPremium, historyDays]);


    // Premium: fetch Google Flights price insights (6-12 month historical)
    useEffect(() => {
        if (!isOpen || !activeCode || activeCode.length < 3 || !isPremium) return;
        setInsightsLoading(true);
        fetch(`/api/prices/insights?destination=${encodeURIComponent(activeCode)}`)
            .then(res => res.json())
            .then(data => {
                if (data.price_history && data.price_history.length > 0) {
                    setPriceInsights({
                        lowest_price: data.lowest_price,
                        price_level: data.price_level,
                        typical_price_range: data.typical_price_range,
                        price_history: data.price_history,
                    });
                }
            })
            .catch(() => { setPriceInsights(null); })
            .finally(() => setInsightsLoading(false));
    }, [isOpen, activeCode, isPremium]);

    // Premium: fetch monthly historical price data (1-3 years)
    useEffect(() => {
        if (!isOpen || !activeCode || activeCode.length < 3 || !isPremium) return;
        setMonthlyLoading(true);
        const param = activeCode.length >= 3 ? `code=${encodeURIComponent(activeCode)}` : `destination=${encodeURIComponent(activeCity)}`;
        fetch(`/api/prices/monthly?${param}&years=${monthlyYears}`)
            .then(res => res.json())
            .then(data => {
                if (data.months) {
                    setMonthlyData({
                        months: data.months,
                        grid: data.grid || {},
                        totalDataPoints: data.totalDataPoints || 0,
                    });
                }
            })
            .catch(() => { setMonthlyData(null); })
            .finally(() => setMonthlyLoading(false));
    }, [isOpen, activeCode, activeCity, isPremium, monthlyYears]);

    // Premium: fetch predictive forecast (needs deals loaded first for cheapestPrice)
    useEffect(() => {
        if (!isOpen || !activeCode || activeCode.length < 3 || !isPremium) return;
        if (deals.length === 0) return; // wait for deals
        // Use IQR-filtered best price to avoid outliers skewing forecast
        let filteredPrices = deals.map(d => d.price);
        if (filteredPrices.length >= 4) {
            const sorted = [...filteredPrices].sort((a, b) => a - b);
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const upper = q3 + 1.5 * (q3 - q1);
            filteredPrices = filteredPrices.filter(p => p <= upper);
        }
        const best = Math.min(...filteredPrices);
        if (best <= 0) return;
        setForecastLoading(true);
        const param = activeCode.length >= 3 ? `code=${encodeURIComponent(activeCode)}` : `destination=${encodeURIComponent(activeCity)}`;
        fetch(`/api/prices/forecast?${param}&price=${best}`)
            .then(res => res.json())
            .then(data => {
                if (data.verdict) setForecast(data);
            })
            .catch(() => { setForecast(null); })
            .finally(() => setForecastLoading(false));
    }, [isOpen, activeCode, activeCity, isPremium, deals]);

    // Recommended hotel: best price/rating combo
    const recommendedHotel = useMemo(() => {
        if (hotels.length === 0) return null;
        if (hotels.length === 1) return hotels[0];
        const maxPrice = Math.max(...hotels.map(h => h.pricePerNight));
        const maxRating = Math.max(...hotels.map(h => h.rating), 1);
        return hotels.reduce((best, h) => {
            const score = (maxPrice > 0 ? ((maxPrice - h.pricePerNight) / maxPrice) * 0.4 : 0)
                + (maxRating > 0 ? (h.rating / maxRating) * 0.6 : 0);
            const bestScore = (maxPrice > 0 ? ((maxPrice - best.pricePerNight) / maxPrice) * 0.4 : 0)
                + (maxRating > 0 ? (best.rating / maxRating) * 0.6 : 0);
            return score > bestScore ? h : best;
        });
    }, [hotels]);

    // Auto-select recommended hotel when entering step 2
    useEffect(() => {
        if (packStep === 2 && recommendedHotel && !selectedHotel) {
            setSelectedHotel(recommendedHotel);
        }
    }, [packStep, recommendedHotel, selectedHotel]);

    // Fetch AI hotel summaries when entering step 2
    useEffect(() => {
        if (packStep !== 2 || hotels.length === 0 || summariesFetched.current) return;
        summariesFetched.current = true;

        fetch('/api/prices/hotels/summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hotels: hotels.map(h => ({
                    name: h.name,
                    stars: h.stars,
                    rating: h.rating,
                    reviewCount: h.reviewCount,
                    pricePerNight: h.pricePerNight,
                    isAllInclusive: h.isAllInclusive,
                    amenities: (h as HotelInfo).amenities,
                })),
                destination: activeCity,
            }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.summaries) setHotelSummaries(data.summaries);
            })
            .catch(() => {});
    }, [packStep, hotels, activeCity]);

    // Trip nights from selected flight
    const selectedNights = useMemo(() => {
        if (!selectedFlight) return 7;
        const n = getTripNights(selectedFlight.departureDate, selectedFlight.returnDate);
        return n > 0 ? n : 7;
    }, [selectedFlight]);

    // Live combined total
    const combinedTotal = useMemo(() => {
        if (!selectedFlight || !selectedHotel) return null;
        return Math.round(selectedFlight.price * flightMultiplier + selectedHotel.pricePerNight * selectedNights * hotelRooms);
    }, [selectedFlight, selectedHotel, selectedNights, flightMultiplier, hotelRooms]);

    // Fetch AI pack analysis when entering step 3
    useEffect(() => {
        if (packStep !== 3 || !selectedFlight || !selectedHotel || packAnalysis) return;
        setAnalysisLoading(true);
        fetch('/api/prices/pack-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                destination: activeCity,
                destination_code: activeCode,
                flight_price: selectedFlight.price,
                hotel_name: selectedHotel.name,
                hotel_stars: selectedHotel.stars,
                hotel_rating: selectedHotel.rating,
                hotel_review_count: selectedHotel.reviewCount,
                hotel_price_per_night: selectedHotel.pricePerNight,
                hotel_amenities: (selectedHotel as any).amenities || [],
                nights: selectedNights,
                departure_date: selectedFlight.departureDate,
                return_date: selectedFlight.returnDate,
                airline: selectedFlight.airline,
                stops: selectedFlight.stops,
            }),
        })
            .then(res => res.json())
            .then(data => {
                if (!data.error) setPackAnalysis(data);
            })
            .catch(() => {})
            .finally(() => setAnalysisLoading(false));
    }, [packStep, selectedFlight, selectedHotel, activeCity, activeCode, selectedNights, packAnalysis]);

    // Hotel price stats
    const hotelAvgPrice = useMemo(() => {
        if (hotels.length === 0) return 0;
        return Math.round(hotels.reduce((s, h) => s + h.pricePerNight, 0) / hotels.length);
    }, [hotels]);

    // Best time to book — trend indicator based on SCAN dates (market observation)
    const priceTrend = useMemo(() => {
        if (deals.length < 4) return null;
        // Sort by scannedAt date (when the price was observed) to detect market trends
        const withScanDate = deals.filter(d => d.scannedAt);
        if (withScanDate.length < 4) return null;

        const sorted = [...withScanDate].sort((a, b) => a.scannedAt.localeCompare(b.scannedAt));
        const midpoint = Math.floor(sorted.length / 2);
        const olderHalf = sorted.slice(0, midpoint);
        const recentHalf = sorted.slice(midpoint);

        if (olderHalf.length === 0 || recentHalf.length === 0) return null;

        const avgRecent = recentHalf.reduce((s, d) => s + d.price, 0) / recentHalf.length;
        const avgOlder = olderHalf.reduce((s, d) => s + d.price, 0) / olderHalf.length;

        const pctChange = ((avgRecent - avgOlder) / avgOlder) * 100;

        if (pctChange < -5) return { direction: 'down' as const, pct: Math.abs(Math.round(pctChange)), label: 'Prix en baisse', color: '#10B981', icon: '\u{1F4C9}', advice: 'Les prix baissent \u2014 bon moment pour r\u00e9server!' };
        if (pctChange > 5) return { direction: 'up' as const, pct: Math.round(pctChange), label: 'Prix en hausse', color: '#EF4444', icon: '\u{1F4C8}', advice: 'Les prix montent \u2014 r\u00e9serve vite!' };
        return { direction: 'stable' as const, pct: 0, label: 'Prix stables', color: '#F59E0B', icon: '\u27A1\uFE0F', advice: 'Prix stables ces derni\u00e8res semaines.' };
    }, [deals]);

    const dateFlexibility = useMemo(() => {
        if (deals.length < 3) return null;
        // Group by departure week
        const weekMap: Record<string, { minPrice: number; date: string; deal: DestinationDeal }> = {};
        for (const deal of deals) {
            const d = new Date(deal.departureDate + 'T00:00:00');
            // Use ISO week start (Monday)
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay() + 1);
            const key = weekStart.toISOString().split('T')[0];
            if (!weekMap[key] || deal.price < weekMap[key].minPrice) {
                weekMap[key] = { minPrice: deal.price, date: deal.departureDate, deal };
            }
        }
        const weeks = Object.entries(weekMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([weekStart, data]) => ({
                weekStart,
                ...data,
            }));
        if (weeks.length < 2) return null;
        const cheapestWeek = weeks.reduce((best, w) => w.minPrice < best.minPrice ? w : best);
        return { weeks, cheapestWeek };
    }, [deals]);

    // ── Premium Analytics (computed from REAL deal data only, outliers removed) ──
    const premiumAnalytics = useMemo(() => {
        if (deals.length < 2) return null;

        // IQR outlier filter
        let filteredDeals = deals;
        if (deals.length >= 4) {
            const sorted = [...deals].sort((a, b) => a.price - b.price);
            const q1 = sorted[Math.floor(sorted.length * 0.25)].price;
            const q3 = sorted[Math.floor(sorted.length * 0.75)].price;
            const iqr = q3 - q1;
            const upper = q3 + 1.5 * iqr;
            filteredDeals = deals.filter(d => d.price <= upper);
        }
        if (filteredDeals.length < 2) return null;

        const prices = filteredDeals.map(d => d.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice || 1;
        const currentBest = minPrice;
        const refPrice = medianPrice || avgPrice;

        // 1. Deal Score (0–100) — how good is current best vs historical median/avg
        let dealScore = 0;
        const avgCurrent = prices.reduce((s, p) => s + p, 0) / prices.length;
        if (refPrice > 0 && historyCount >= 3) {
            // How far below historical median/avg is the current best? (0-65 points)
            const historyScore = Math.max(0, Math.min(65, Math.round(((refPrice - currentBest) / refPrice) * 200)));
            // How much better than the average current deal? (0-35 points)
            const spreadScore = avgCurrent > currentBest
                ? Math.max(0, Math.min(35, Math.round(((avgCurrent - currentBest) / avgCurrent) * 120)))
                : 0;
            dealScore = Math.min(100, historyScore + spreadScore);
        } else if (prices.length >= 4) {
            // No history but multiple deals — score based on spread
            const spreadScore = avgCurrent > currentBest
                ? Math.max(20, Math.min(70, Math.round(((avgCurrent - currentBest) / avgCurrent) * 200)))
                : 35;
            dealScore = spreadScore;
        } else {
            dealScore = 50; // neutral if no data
        }

        // 2. Cheapest month
        const monthMap: Record<number, { total: number; count: number; min: number }> = {};
        for (const deal of filteredDeals) {
            const m = new Date(deal.departureDate + 'T00:00:00').getMonth();
            if (!monthMap[m]) monthMap[m] = { total: 0, count: 0, min: Infinity };
            monthMap[m].total += deal.price;
            monthMap[m].count++;
            if (deal.price < monthMap[m].min) monthMap[m].min = deal.price;
        }
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        const monthEntries = Object.entries(monthMap).map(([m, data]) => ({
            month: parseInt(m),
            name: monthNames[parseInt(m)],
            avg: Math.round(data.total / data.count),
            min: Math.round(data.min),
            count: data.count,
        })).sort((a, b) => a.avg - b.avg);
        const cheapestMonth = monthEntries[0] || null;
        const expensiveMonth = monthEntries[monthEntries.length - 1] || null;
        const monthSaving = (cheapestMonth && expensiveMonth && expensiveMonth.avg > cheapestMonth.avg)
            ? expensiveMonth.avg - cheapestMonth.avg : 0;

        // 3. Direct vs stops analysis
        const directDeals = filteredDeals.filter(d => d.stops === 0);
        const stopDeals = filteredDeals.filter(d => d.stops > 0);
        const avgDirect = directDeals.length > 0 ? Math.round(directDeals.reduce((s, d) => s + d.price, 0) / directDeals.length) : 0;
        const avgWithStops = stopDeals.length > 0 ? Math.round(stopDeals.reduce((s, d) => s + d.price, 0) / stopDeals.length) : 0;
        const stopsSaving = avgDirect > avgWithStops && avgWithStops > 0 ? avgDirect - avgWithStops : 0;

        // 4. Best airline (cheapest average)
        const airlineMap: Record<string, { total: number; count: number; min: number }> = {};
        for (const deal of filteredDeals) {
            const airline = deal.airline || 'Inconnu';
            if (!airlineMap[airline]) airlineMap[airline] = { total: 0, count: 0, min: Infinity };
            airlineMap[airline].total += deal.price;
            airlineMap[airline].count++;
            if (deal.price < airlineMap[airline].min) airlineMap[airline].min = deal.price;
        }
        const airlines = Object.entries(airlineMap)
            .map(([name, data]) => ({ name, avg: Math.round(data.total / data.count), min: Math.round(data.min), count: data.count }))
            .sort((a, b) => a.avg - b.avg);
        const bestAirline = airlines[0] || null;

        // 5. Best trip duration (cheapest per night)
        const withNights = filteredDeals.filter(d => {
            const n = d.tripNights || getTripNights(d.departureDate, d.returnDate);
            return n > 0;
        }).map(d => {
            const n = d.tripNights || getTripNights(d.departureDate, d.returnDate);
            return { ...d, nights: n, perNight: Math.round(d.price / n) };
        }).sort((a, b) => a.perNight - b.perNight);
        const bestPerNight = withNights[0] || null;

        // 6. Buy recommendation
        let recommendation: { action: string; reason: string; urgency: 'buy' | 'wait' | 'neutral' } = {
            action: 'Prix correct', reason: 'Pas assez de données pour une recommandation précise.', urgency: 'neutral',
        };
        if (priceTrend && refPrice > 0) {
            if (priceTrend.direction === 'up' && dealScore >= 60) {
                recommendation = { action: 'Acheter maintenant', reason: 'Les prix montent et le deal actuel est bon — risque de payer plus cher en attendant.', urgency: 'buy' };
            } else if (priceTrend.direction === 'down' && dealScore < 50) {
                recommendation = { action: 'Attendre quelques jours', reason: 'Les prix sont en baisse — tu pourrais trouver mieux bientôt.', urgency: 'wait' };
            } else if (dealScore >= 75) {
                recommendation = { action: 'Excellent moment pour acheter', reason: `Ce prix est dans le top 25% des prix scannés sur ${historyCount} observations.`, urgency: 'buy' };
            } else if (priceTrend.direction === 'down') {
                recommendation = { action: 'Bon moment, mais surveille', reason: 'La tendance est à la baisse — bon prix mais ça pourrait encore descendre.', urgency: 'neutral' };
            } else {
                recommendation = { action: 'Prix dans la moyenne', reason: `Basé sur ${historyCount} scans. Ni exceptionnel ni mauvais.`, urgency: 'neutral' };
            }
        } else if (dealScore >= 70) {
            recommendation = { action: 'Bon prix détecté', reason: 'Ce prix est compétitif par rapport aux autres options disponibles.', urgency: 'buy' };
        }

        // Enhance with Google Flights price insights if available
        if (priceInsights) {
            if (priceInsights.price_level === 'low' && recommendation.urgency !== 'buy') {
                recommendation = {
                    action: 'Acheter maintenant',
                    reason: `Google Flights confirme: les prix sont actuellement BAS (fourchette typique: ${Math.round(priceInsights.typical_price_range[0])}$–${Math.round(priceInsights.typical_price_range[1])}$). C'est le bon moment!`,
                    urgency: 'buy',
                };
            } else if (priceInsights.price_level === 'high' && recommendation.urgency === 'buy') {
                recommendation = {
                    action: 'Bon deal, mais prix élevés',
                    reason: `Google Flights indique que les prix sont actuellement au-dessus de la normale (typique: ${Math.round(priceInsights.typical_price_range[0])}$–${Math.round(priceInsights.typical_price_range[1])}$). Surveille pour une baisse.`,
                    urgency: 'neutral',
                };
            }
        }

        // 7. Savings vs average (for "TON ÉCONOMIE" banner)
        const savingsVsAvg = refPrice > 0 ? Math.round(refPrice - currentBest) : 0;

        // 8. Price rarity — how rare is this price level?
        const atOrBelowBest = filteredDeals.filter(d => d.price <= currentBest * 1.02).length;
        const rarityPct = Math.round((atOrBelowBest / filteredDeals.length) * 100);
        let rarityLabel = '';
        if (rarityPct <= 5) rarityLabel = 'Extrêmement rare';
        else if (rarityPct <= 15) rarityLabel = 'Très rare';
        else if (rarityPct <= 30) rarityLabel = 'Peu fréquent';
        else rarityLabel = 'Fréquent';
        const priceRarity = { count: atOrBelowBest, total: filteredDeals.length, pct: rarityPct, label: rarityLabel };

        // 9. Best combination (price + direct + duration score)
        const scored = filteredDeals.filter(d => d.departureDate && d.returnDate).map(d => {
            const dur = d.durationMinutes || 999;
            const nights = d.tripNights || getTripNights(d.departureDate, d.returnDate);
            // Normalize scores (lower is better for all)
            const priceNorm = minPrice > 0 ? d.price / minPrice : 1;
            const stopsNorm = d.stops === 0 ? 0 : d.stops * 0.3;
            const durNorm = dur < 999 ? dur / 300 : 1; // 300 min = ~5h baseline
            // Weighted combo score (lower = better)
            const comboScore = priceNorm * 0.5 + stopsNorm * 0.3 + durNorm * 0.2;
            return { ...d, nights, comboScore };
        }).sort((a, b) => a.comboScore - b.comboScore);
        const bestCombo = scored[0] || null;

        // 10. Target price (for alert CTA)
        const targetPrice = historyCount >= 3
            ? Math.round(Math.min(currentBest * 0.95, minPrice + priceRange * 0.15))
            : Math.round(currentBest * 0.9);

        return {
            dealScore,
            cheapestMonth,
            expensiveMonth,
            monthSaving,
            monthEntries,
            avgDirect,
            avgWithStops,
            stopsSaving,
            directCount: directDeals.length,
            stopsCount: stopDeals.length,
            bestAirline,
            airlines,
            bestPerNight,
            recommendation,
            priceMin: minPrice,
            priceMax: maxPrice,
            savingsVsAvg,
            priceRarity,
            bestCombo,
            targetPrice,
        };
    }, [deals, avgPrice, medianPrice, historyCount, priceTrend, priceInsights]);

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
        const abortController = new AbortController();

        setLoading(true);
        setError('');
        setDeals([]);
        setLiveSearching(false);

        fetch(`/api/prices/destination?code=${encodeURIComponent(activeCode)}&name=${encodeURIComponent(activeCity)}`, { signal: abortController.signal })
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
                } else {
                    // No DB deals at all — show empty state (no slow live search)
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (err.name === 'AbortError') return;
                setError('Impossible de charger les dates');
                setLoading(false);
            });

        function fetchLiveDeals(existingDeals: DestinationDeal[]) {
            fetch(`/api/prices/search-live?code=${encodeURIComponent(activeCode)}&city=${encodeURIComponent(activeCity)}`, { signal: abortController.signal })
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

        return () => abortController.abort();
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

    // ── Premium lock overlay for gated sections ──
    const PremiumLock = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div style={{ position: 'relative', marginBottom: 12, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ filter: 'blur(8px)', pointerEvents: 'none', userSelect: 'none', transform: 'scale(1.02)' }}>
                {children}
            </div>
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'linear-gradient(135deg, rgba(15,23,42,0.55), rgba(30,41,59,0.45))',
                backdropFilter: 'blur(2px)', borderRadius: 16,
            }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(6,182,212,0.15))',
                    border: '1px solid rgba(14,165,233,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(14,165,233,0.2)',
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                </div>
                <span style={{
                    fontSize: 13, fontWeight: 700, color: '#fff',
                    fontFamily: "'Fredoka', sans-serif", textAlign: 'center',
                    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }}>
                    {label}
                </span>
                <a href="/pricing" style={{
                    fontSize: 12, fontWeight: 700, color: '#0F172A',
                    background: 'linear-gradient(135deg, #FFD700, #F59E0B)',
                    padding: '8px 22px', borderRadius: 100, textDecoration: 'none',
                    fontFamily: "'Outfit', sans-serif",
                    boxShadow: '0 4px 16px rgba(255,215,0,0.35)',
                    transition: 'transform 0.2s',
                }}>
                    Débloquer
                </a>
            </div>
        </div>
    );

    const shareDestination = () => {
        const text = `Vol Montréal → ${destination} dès ${cheapestPrice}$ A/R sur GeaiMonVol`;
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

                        {/* ═══ STEP INDICATOR (All-Inclusive only) ═══ */}
                        {showPackFlow && deals.length > 0 && hotels.length > 0 && (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 18, gap: 0,
                            }}>
                                {/* Step 1 circle */}
                                <div
                                    onClick={() => { if (packStep === 2 || packStep === 3) { setPackStep(1); } }}
                                    style={{
                                        width: 32, height: 32, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: packStep === 1
                                            ? 'linear-gradient(135deg, #0EA5E9, #06B6D4)'
                                            : selectedFlight ? '#10B981' : '#E2E8F0',
                                        color: (packStep === 1 || selectedFlight) ? '#fff' : '#94A3B8',
                                        cursor: packStep > 1 ? 'pointer' : 'default',
                                        transition: 'all 0.3s',
                                        boxShadow: packStep === 1 ? '0 2px 8px rgba(14,165,233,0.3)' : 'none',
                                    }}
                                >
                                    {selectedFlight && packStep > 1
                                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                                        : <span style={{ fontSize: 14 }}>&#9992;</span>
                                    }
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: packStep >= 1 ? '#0F172A' : '#94A3B8', fontFamily: "'Outfit', sans-serif", margin: '0 4px' }}>
                                    Vol
                                </div>
                                {/* Connector line */}
                                <div style={{
                                    width: 50, height: 2, borderRadius: 1, margin: '0 4px',
                                    background: selectedFlight ? '#10B981' : '#E2E8F0',
                                    transition: 'all 0.3s',
                                }} />
                                {/* Step 2 circle */}
                                <div
                                    onClick={() => { if (packStep === 3) setPackStep(2); }}
                                    style={{
                                        width: 32, height: 32, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: packStep === 2
                                            ? 'linear-gradient(135deg, #0EA5E9, #06B6D4)'
                                            : packStep === 3 && selectedHotel ? '#10B981' : '#E2E8F0',
                                        color: (packStep === 2 || (packStep === 3 && selectedHotel)) ? '#fff' : '#94A3B8',
                                        cursor: packStep === 3 ? 'pointer' : 'default',
                                        transition: 'all 0.3s',
                                        boxShadow: packStep === 2 ? '0 2px 8px rgba(14,165,233,0.3)' : 'none',
                                    }}
                                >
                                    {selectedHotel && packStep === 3
                                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                                        : <span style={{ fontSize: 13 }}>&#127976;</span>
                                    }
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: packStep >= 2 ? '#0F172A' : '#94A3B8', fontFamily: "'Outfit', sans-serif", margin: '0 4px' }}>
                                    Hotel
                                </div>
                                {/* Connector line */}
                                <div style={{
                                    width: 50, height: 2, borderRadius: 1, margin: '0 4px',
                                    background: packStep === 3 ? '#10B981' : selectedHotel ? '#0EA5E9' : '#E2E8F0',
                                    transition: 'all 0.3s',
                                }} />
                                {/* Step 3: GeAI Analysis */}
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: packStep === 3
                                        ? 'linear-gradient(135deg, #0F172A, #1E293B)'
                                        : '#E2E8F0',
                                    color: packStep === 3 ? '#fff' : '#94A3B8',
                                    transition: 'all 0.3s',
                                    boxShadow: packStep === 3 ? '0 2px 8px rgba(15,23,42,0.3)' : 'none',
                                }}>
                                    {packStep === 3
                                        ? <img src="/logo_geai.png" alt="GeAI" width={20} height={20} style={{ borderRadius: '50%' }} />
                                        : <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Fredoka', sans-serif" }}>IA</span>
                                    }
                                </div>
                            </div>
                        )}

                        {/* ── Pricing mode toggle (All-Inclusive) ── */}
                        {showPackFlow && deals.length > 0 && hotels.length > 0 && (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 14, gap: 0,
                            }}>
                                <div style={{
                                    display: 'flex', borderRadius: 8, overflow: 'hidden',
                                    border: '1px solid #E2E8F0', background: '#F8FAFC',
                                }}>
                                    <button
                                        onClick={() => setPricingMode('per-person')}
                                        style={{
                                            padding: '5px 12px', border: 'none', fontSize: 11, fontWeight: 600,
                                            fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                                            background: pricingMode === 'per-person' ? '#0EA5E9' : 'transparent',
                                            color: pricingMode === 'per-person' ? '#fff' : '#64748B',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        1 voyageur
                                    </button>
                                    <button
                                        onClick={() => setPricingMode('total-2')}
                                        style={{
                                            padding: '5px 12px', border: 'none', fontSize: 11, fontWeight: 600,
                                            fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                                            background: pricingMode === 'total-2' ? '#0EA5E9' : 'transparent',
                                            color: pricingMode === 'total-2' ? '#fff' : '#64748B',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        2 voyageurs
                                    </button>
                                    <button
                                        onClick={() => setPricingMode('family')}
                                        style={{
                                            padding: '5px 12px', border: 'none', fontSize: 11, fontWeight: 600,
                                            fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                                            background: pricingMode === 'family' ? '#0EA5E9' : 'transparent',
                                            color: pricingMode === 'family' ? '#fff' : '#64748B',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        Famille
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* Family configuration panel */}
                        {showPackFlow && deals.length > 0 && hotels.length > 0 && pricingMode === 'family' && (
                            <div style={{
                                marginTop: -6, marginBottom: 14, padding: '10px 14px', borderRadius: 10,
                                background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.1)',
                                display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center',
                            }}>
                                {/* Adults */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', fontFamily: "'Outfit', sans-serif" }}>Adultes</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <button onClick={() => setFamilyAdults(Math.max(1, familyAdults - 1))} style={{
                                            width: 24, height: 24, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff',
                                            cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#475569',
                                        }}>-</button>
                                        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", color: '#0F172A', minWidth: 20, textAlign: 'center' }}>
                                            {familyAdults}
                                        </span>
                                        <button onClick={() => setFamilyAdults(Math.min(4, familyAdults + 1))} style={{
                                            width: 24, height: 24, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff',
                                            cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#475569',
                                        }}>+</button>
                                    </div>
                                </div>
                                {/* Children */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', fontFamily: "'Outfit', sans-serif" }}>Enfants</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <button onClick={() => setFamilyChildren(Math.max(0, familyChildren - 1))} style={{
                                            width: 24, height: 24, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff',
                                            cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#475569',
                                        }}>-</button>
                                        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", color: '#0F172A', minWidth: 20, textAlign: 'center' }}>
                                            {familyChildren}
                                        </span>
                                        <button onClick={() => setFamilyChildren(Math.min(3, familyChildren + 1))} style={{
                                            width: 24, height: 24, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff',
                                            cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#475569',
                                        }}>+</button>
                                    </div>
                                </div>
                                {/* Room count info */}
                                <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>
                                    {Math.ceil(familyAdults / 2)} chambre{Math.ceil(familyAdults / 2) > 1 ? 's' : ''}
                                </span>
                            </div>
                        )}

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
                        {(!showPackFlow || packStep === 1) && (!isCountryLevel || selectedSubDest || subDestinations.length === 0) && (
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
                        {(!showPackFlow || packStep === 1) && bestPrice != null && bestPrice > 0 && !loading && deals.length > 0 && (() => {
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
                                                        {effHistory} prix analysés
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

                                    {/* Nearby destinations — internal flights advisory */}
                                    {geai.nearby.length > 0 && (
                                        <div style={{
                                            padding: '10px 12px', borderRadius: 10,
                                            background: 'rgba(245,158,11,0.06)',
                                            border: '1px solid rgba(245,158,11,0.15)',
                                        }}>
                                            <div style={{
                                                fontSize: 10, fontWeight: 700, color: '#F59E0B',
                                                fontFamily: "'Fredoka', sans-serif", marginBottom: 4,
                                                display: 'flex', alignItems: 'center', gap: 4,
                                            }}>
                                                <span style={{ fontSize: 13 }}>&#9888;&#65039;</span> Important — profite au max de ton voyage!
                                            </div>
                                            <div style={{
                                                fontSize: 11.5, color: 'rgba(255,255,255,0.75)',
                                                fontFamily: "'Outfit', sans-serif", lineHeight: 1.45,
                                                marginBottom: 8,
                                            }}>
                                                Informe-toi sur les vols internes pour pas juste rester a {destination}. Y&apos;a des places incroyables a decouvrir a cote :
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                {geai.nearby.map((n, idx) => (
                                                    <div key={idx} style={{
                                                        fontSize: 12, color: 'rgba(255,255,255,0.85)',
                                                        fontFamily: "'Outfit', sans-serif", lineHeight: 1.4,
                                                        display: 'flex', alignItems: 'flex-start', gap: 6,
                                                        padding: '5px 8px', borderRadius: 8,
                                                        background: 'rgba(245,158,11,0.05)',
                                                    }}>
                                                        <span style={{ fontSize: 14, flexShrink: 0 }}>&#9992;&#65039;</span>
                                                        <span>
                                                            <strong style={{ color: '#F59E0B' }}>{n.city}</strong> — {n.reason}
                                                            <span style={{
                                                                display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.5)',
                                                                marginTop: 1, fontStyle: 'italic',
                                                            }}>
                                                                Cherche &laquo; vol interne {destination} → {n.city} &raquo;
                                                            </span>
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* ── TREND INDICATOR ── */}
                        {(!showPackFlow || packStep === 1) && priceTrend && !loading && deals.length > 0 && (
                            tier.priceInsights ? (
                            <div style={{
                                marginBottom: 12, padding: '10px 14px', borderRadius: 12,
                                background: priceTrend.direction === 'down'
                                    ? 'rgba(16,185,129,0.06)'
                                    : priceTrend.direction === 'up'
                                        ? 'rgba(239,68,68,0.06)'
                                        : 'rgba(245,158,11,0.06)',
                                border: `1px solid ${priceTrend.direction === 'down'
                                    ? 'rgba(16,185,129,0.15)'
                                    : priceTrend.direction === 'up'
                                        ? 'rgba(239,68,68,0.15)'
                                        : 'rgba(245,158,11,0.15)'}`,
                                display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                                <span style={{ fontSize: 18, flexShrink: 0 }}>{priceTrend.icon}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 12, fontWeight: 700, color: priceTrend.color,
                                        fontFamily: "'Outfit', sans-serif",
                                        display: 'flex', alignItems: 'center', gap: 6,
                                    }}>
                                        {priceTrend.label}
                                        {priceTrend.pct > 0 && (
                                            <span style={{
                                                fontSize: 10, fontWeight: 600, padding: '1px 6px',
                                                borderRadius: 4, background: `${priceTrend.color}15`,
                                                color: priceTrend.color,
                                            }}>
                                                {priceTrend.direction === 'down' ? '-' : '+'}{priceTrend.pct}%
                                            </span>
                                        )}
                                    </div>
                                    <div style={{
                                        fontSize: 11, color: '#64748B', fontFamily: "'Outfit', sans-serif",
                                        marginTop: 2,
                                    }}>
                                        {priceTrend.advice}
                                    </div>
                                </div>
                            </div>
                            ) : (
                            <PremiumLock label="Tendance des prix">
                                <div style={{
                                    marginBottom: 12, padding: '10px 14px', borderRadius: 12,
                                    background: priceTrend.direction === 'down'
                                        ? 'rgba(16,185,129,0.06)'
                                        : priceTrend.direction === 'up'
                                            ? 'rgba(239,68,68,0.06)'
                                            : 'rgba(245,158,11,0.06)',
                                    border: `1px solid ${priceTrend.direction === 'down'
                                        ? 'rgba(16,185,129,0.15)'
                                        : priceTrend.direction === 'up'
                                            ? 'rgba(239,68,68,0.15)'
                                            : 'rgba(245,158,11,0.15)'}`,
                                    display: 'flex', alignItems: 'center', gap: 10,
                                }}>
                                    <span style={{ fontSize: 18, flexShrink: 0 }}>{priceTrend.icon}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 12, fontWeight: 700, color: priceTrend.color,
                                            fontFamily: "'Outfit', sans-serif",
                                            display: 'flex', alignItems: 'center', gap: 6,
                                        }}>
                                            {priceTrend.label}
                                            {priceTrend.pct > 0 && (
                                                <span style={{
                                                    fontSize: 10, fontWeight: 600, padding: '1px 6px',
                                                    borderRadius: 4, background: `${priceTrend.color}15`,
                                                    color: priceTrend.color,
                                                }}>
                                                    {priceTrend.direction === 'down' ? '-' : '+'}{priceTrend.pct}%
                                                </span>
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: 11, color: '#64748B', fontFamily: "'Outfit', sans-serif",
                                            marginTop: 2,
                                        }}>
                                            {priceTrend.advice}
                                        </div>
                                    </div>
                                </div>
                            </PremiumLock>
                            )
                        )}

                        {/* ═══ PREMIUM INTELLIGENCE PANEL ═══ */}
                        {(!showPackFlow || packStep === 1) && !loading && deals.length >= 2 && premiumAnalytics && (
                            tier.priceInsights ? (
                            <div style={{
                                marginBottom: 16, borderRadius: 18,
                                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                                border: '1px solid rgba(14,165,233,0.2)',
                                overflow: 'hidden',
                            }}>
                                {/* Header */}
                                <div style={{
                                    padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10,
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                        background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 2px 10px rgba(14,165,233,0.4)',
                                    }}>
                                        <img src="/logo_geai.png" alt="GeAI" width={22} height={22} style={{ borderRadius: '50%' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif" }}>
                                            Intelligence GeAI
                                        </div>
                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>
                                            {deals.length} vols · {historyCount > 0 ? `${historyCount} scans historiques` : 'analyse en cours'}
                                        </div>
                                    </div>
                                    <div style={{
                                        marginLeft: 'auto', padding: '3px 10px', borderRadius: 100,
                                        background: 'linear-gradient(135deg, #FFB800, #FFD700)',
                                        fontSize: 9, fontWeight: 800, color: '#5C4A00',
                                        fontFamily: "'Fredoka', sans-serif",
                                    }}>PREMIUM</div>
                                </div>

                                {/* ── 0. TON ÉCONOMIE GEAI — savings banner ── */}
                                {premiumAnalytics.savingsVsAvg > 15 && (
                                    <div style={{
                                        padding: '12px 16px',
                                        background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(6,182,212,0.08) 100%)',
                                        borderBottom: '1px solid rgba(16,185,129,0.15)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                                                background: 'linear-gradient(135deg, #10B981, #06B6D4)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 4px 15px rgba(16,185,129,0.4)',
                                            }}>
                                                <span style={{ fontSize: 20 }}>💸</span>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(16,185,129,0.7)', fontFamily: "'Outfit', sans-serif", letterSpacing: 0.5 }}>
                                                    TON ÉCONOMIE GEAI
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                                    <span style={{ fontSize: 24, fontWeight: 800, color: '#10B981', fontFamily: "'Fredoka', sans-serif" }}>
                                                        {premiumAnalytics.savingsVsAvg}$
                                                    </span>
                                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif" }}>
                                                        de moins que la moyenne
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                                                    Sur un couple: <strong style={{ color: '#10B981' }}>{premiumAnalytics.savingsVsAvg * 2}$ d&apos;économie</strong>
                                                    {premiumAnalytics.savingsVsAvg >= 50 && <span> · Ça vaut bien 5$/mois non? 😏</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── 1. VERDICT: Score + Recommandation (upgraded) ── */}
                                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                            {/* Animated score ring */}
                                            <div style={{
                                                width: 68, height: 68, borderRadius: '50%', position: 'relative',
                                                background: `conic-gradient(${premiumAnalytics.dealScore >= 70 ? '#10B981' : premiumAnalytics.dealScore >= 40 ? '#F59E0B' : '#EF4444'} ${premiumAnalytics.dealScore * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: premiumAnalytics.dealScore >= 70
                                                    ? '0 0 20px rgba(16,185,129,0.3), inset 0 0 20px rgba(16,185,129,0.1)'
                                                    : premiumAnalytics.dealScore >= 40
                                                    ? '0 0 15px rgba(245,158,11,0.2)'
                                                    : '0 0 15px rgba(239,68,68,0.2)',
                                            }}>
                                                <div style={{
                                                    width: 54, height: 54, borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <span style={{
                                                        fontSize: 22, fontWeight: 800, fontFamily: "'Fredoka', sans-serif", lineHeight: 1,
                                                        color: premiumAnalytics.dealScore >= 70 ? '#10B981' : premiumAnalytics.dealScore >= 40 ? '#F59E0B' : '#EF4444',
                                                    }}>{premiumAnalytics.dealScore}</span>
                                                    <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>/100</span>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", marginTop: 4, letterSpacing: 0.5 }}>
                                                {historyCount >= 15 ? 'HAUTE FIABILITÉ' : historyCount >= 5 ? 'FIABILITÉ MOY.' : 'DONNÉES LIMITÉES'}
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: 14, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                                                color: premiumAnalytics.recommendation.urgency === 'buy' ? '#10B981' : premiumAnalytics.recommendation.urgency === 'wait' ? '#F59E0B' : '#94A3B8',
                                                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
                                            }}>
                                                {premiumAnalytics.recommendation.urgency === 'buy' ? '✅' : premiumAnalytics.recommendation.urgency === 'wait' ? '⏳' : '➡️'}
                                                {premiumAnalytics.recommendation.action}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
                                                {premiumAnalytics.recommendation.reason}
                                            </div>
                                            {/* Rarity badge */}
                                            {premiumAnalytics.priceRarity.pct <= 30 && (
                                                <div style={{
                                                    marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5,
                                                    padding: '4px 10px', borderRadius: 8,
                                                    background: premiumAnalytics.priceRarity.pct <= 10 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.08)',
                                                    border: `1px solid ${premiumAnalytics.priceRarity.pct <= 10 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)'}`,
                                                }}>
                                                    <span style={{ fontSize: 11 }}>{premiumAnalytics.priceRarity.pct <= 10 ? '🔥' : '⚡'}</span>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                                                        color: premiumAnalytics.priceRarity.pct <= 10 ? '#EF4444' : '#F59E0B',
                                                    }}>
                                                        {premiumAnalytics.priceRarity.label} — ce prix n&apos;apparaît que {premiumAnalytics.priceRarity.pct}% du temps
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* "ET SI?" Retrospective */}
                                    {historyPoints.length >= 7 && (() => {
                                        const now = new Date();
                                        const ago7 = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
                                        const ago14 = new Date(now.getTime() - 14 * 86400000).toISOString().split('T')[0];
                                        const price7d = historyPoints.find(p => p.date >= ago7)?.price;
                                        const price14d = historyPoints.find(p => p.date >= ago14)?.price;
                                        const currentBest = premiumAnalytics.priceMin;
                                        const bestEver = historyStats.min;
                                        if (!price7d && !price14d) return null;
                                        return (
                                            <div style={{
                                                marginTop: 10, padding: '10px 12px', borderRadius: 10,
                                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                            }}>
                                                <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", letterSpacing: 0.5, marginBottom: 6 }}>
                                                    ET SI TU AVAIS ACHETÉ...
                                                </div>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {price7d && (
                                                        <div style={{
                                                            flex: 1, padding: '6px 8px', borderRadius: 8, textAlign: 'center',
                                                            background: price7d > currentBest ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                                                            border: `1px solid ${price7d > currentBest ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)'}`,
                                                        }}>
                                                            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>Il y a 7 jours</div>
                                                            <div style={{
                                                                fontSize: 14, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                                                color: price7d > currentBest ? '#10B981' : '#EF4444',
                                                            }}>
                                                                {price7d > currentBest ? '+' : ''}{Math.round(price7d - currentBest)}$
                                                            </div>
                                                            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>
                                                                {price7d > currentBest ? 'tu aurais payé plus' : 'c\'était moins cher'}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {price14d && (
                                                        <div style={{
                                                            flex: 1, padding: '6px 8px', borderRadius: 8, textAlign: 'center',
                                                            background: price14d > currentBest ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                                                            border: `1px solid ${price14d > currentBest ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)'}`,
                                                        }}>
                                                            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>Il y a 14 jours</div>
                                                            <div style={{
                                                                fontSize: 14, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                                                color: price14d > currentBest ? '#10B981' : '#EF4444',
                                                            }}>
                                                                {price14d > currentBest ? '+' : ''}{Math.round(price14d - currentBest)}$
                                                            </div>
                                                            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>
                                                                {price14d > currentBest ? 'tu aurais payé plus' : 'c\'était moins cher'}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {bestEver > 0 && bestEver < currentBest * 0.95 && (
                                                        <div style={{
                                                            flex: 1, padding: '6px 8px', borderRadius: 8, textAlign: 'center',
                                                            background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)',
                                                        }}>
                                                            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>Meilleur moment</div>
                                                            <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Fredoka', sans-serif", color: '#A78BFA' }}>
                                                                -{Math.round(currentBest - bestEver)}$
                                                            </div>
                                                            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>
                                                                le plus bas vu: {bestEver}$
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* ── 1b. EST-CE LE BON MOMENT? — Hero forecast section ── */}
                                {(forecastLoading || forecast) && (
                                    <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(180deg, rgba(139,92,246,0.04) 0%, transparent 100%)' }}>
                                        <div style={{ marginBottom: 14 }}>
                                            <div style={{
                                                fontSize: 14, fontWeight: 800, color: '#E2E8F0',
                                                fontFamily: "'Fredoka', sans-serif", letterSpacing: 0.5,
                                                display: 'flex', alignItems: 'center', gap: 8,
                                            }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: 28, height: 28, borderRadius: 8,
                                                    background: 'linear-gradient(135deg, #8B5CF6, #0EA5E9)',
                                                    fontSize: 14,
                                                }}>🎯</span>
                                                EST-CE LE BON MOMENT?
                                                <span style={{
                                                    fontSize: 8, padding: '3px 8px', borderRadius: 6,
                                                    background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(14,165,233,0.25))',
                                                    color: '#A78BFA', fontWeight: 800, letterSpacing: 0.3,
                                                    border: '1px solid rgba(139,92,246,0.3)',
                                                }}>IA BETA</span>
                                            </div>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif", marginTop: 4 }}>
                                                Notre analyse prédictive basée sur l&apos;historique réel des prix
                                            </div>
                                        </div>

                                        {forecastLoading ? (
                                            <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                                                Analyse en cours...
                                            </div>
                                        ) : forecast?.pronostic && (
                                            <>
                                                {/* Verdict + 3 reasons */}
                                                <div style={{
                                                    padding: '14px 16px', borderRadius: 14, marginBottom: 12,
                                                    background: forecast.verdict === 'BUY_NOW' ? 'rgba(16,185,129,0.12)' : forecast.verdict === 'BUY_SOON' ? 'rgba(52,211,153,0.1)' : forecast.verdict === 'WAIT' ? 'rgba(245,158,11,0.1)' : 'rgba(148,163,184,0.08)',
                                                    border: `1px solid ${forecast.verdict === 'BUY_NOW' ? 'rgba(16,185,129,0.25)' : forecast.verdict === 'BUY_SOON' ? 'rgba(52,211,153,0.2)' : forecast.verdict === 'WAIT' ? 'rgba(245,158,11,0.2)' : 'rgba(148,163,184,0.15)'}`,
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                                        <span style={{ fontSize: 28, lineHeight: 1 }}>
                                                            {forecast.verdict === 'BUY_NOW' ? '🔥' : forecast.verdict === 'BUY_SOON' ? '👀' : forecast.verdict === 'WAIT' ? '⏳' : '👌'}
                                                        </span>
                                                        <div style={{
                                                            fontSize: 15, fontWeight: 800, lineHeight: 1.4,
                                                            color: forecast.verdict === 'BUY_NOW' ? '#10B981' : forecast.verdict === 'BUY_SOON' ? '#34D399' : forecast.verdict === 'WAIT' ? '#F59E0B' : '#94A3B8',
                                                            fontFamily: "'Fredoka', sans-serif",
                                                        }}>
                                                            {forecast.pronostic.verdictLine}
                                                        </div>
                                                    </div>

                                                    {/* 3 clear reasons */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                        {forecast.pronostic.reasons.map((r, i) => (
                                                            <div key={i} style={{
                                                                display: 'flex', alignItems: 'center', gap: 10,
                                                                padding: '8px 12px', borderRadius: 10,
                                                                background: 'rgba(255,255,255,0.03)',
                                                                borderLeft: `3px solid ${r.impact === 'positive' ? 'rgba(16,185,129,0.5)' : r.impact === 'negative' ? 'rgba(239,68,68,0.4)' : 'rgba(148,163,184,0.3)'}`,
                                                            }}>
                                                                <span style={{ fontSize: 16, flexShrink: 0 }}>{r.icon}</span>
                                                                <span style={{
                                                                    fontSize: 12, fontWeight: 600, lineHeight: 1.4,
                                                                    color: r.impact === 'positive' ? '#10B981' : r.impact === 'negative' ? '#EF4444' : 'rgba(255,255,255,0.6)',
                                                                    fontFamily: "'Outfit', sans-serif",
                                                                }}>{r.text}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Monthly outlook */}
                                                {forecast.pronostic.monthlyOutlook && forecast.pronostic.monthlyOutlook.length >= 2 && (
                                                    <div style={{
                                                        padding: '12px 14px', borderRadius: 14, marginBottom: 12,
                                                        background: 'rgba(14,165,233,0.04)',
                                                        border: '1px solid rgba(14,165,233,0.1)',
                                                    }}>
                                                        <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", letterSpacing: 0.5, marginBottom: 8 }}>
                                                            PROCHAINS MOIS (saisonnier)
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            {forecast.pronostic.monthlyOutlook.map((mo, idx) => (
                                                                <div key={idx} style={{
                                                                    flex: 1, padding: '8px 4px', borderRadius: 10, textAlign: 'center',
                                                                    background: mo.vsCurrent < -15 ? 'rgba(16,185,129,0.08)' : mo.vsCurrent > 15 ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
                                                                    border: `1px solid ${mo.vsCurrent < -15 ? 'rgba(16,185,129,0.15)' : mo.vsCurrent > 15 ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)'}`,
                                                                }}>
                                                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif" }}>
                                                                        {mo.month}
                                                                    </div>
                                                                    <div style={{
                                                                        fontSize: 16, fontWeight: 800, fontFamily: "'Fredoka', sans-serif", marginTop: 3,
                                                                        color: mo.vsCurrent < -15 ? '#10B981' : mo.vsCurrent > 15 ? '#EF4444' : '#0EA5E9',
                                                                    }}>
                                                                        {mo.medianPrice}$
                                                                    </div>
                                                                    <div style={{
                                                                        fontSize: 10, fontWeight: 700, marginTop: 2,
                                                                        color: mo.vsCurrent < -5 ? '#10B981' : mo.vsCurrent > 5 ? '#EF4444' : 'rgba(255,255,255,0.3)',
                                                                        fontFamily: "'Outfit', sans-serif",
                                                                    }}>
                                                                        {mo.vsCurrent > 0 ? '+' : ''}{mo.vsCurrent}$
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif", marginTop: 6, textAlign: 'center' }}>
                                                            Médianes saisonnières vs votre prix actuel
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Confidence */}
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    padding: '5px 10px', borderRadius: 8,
                                                    background: 'rgba(255,255,255,0.02)',
                                                }}>
                                                    <span style={{ fontSize: 9 }}>
                                                        {forecast.confidence >= 70 ? '🟢' : forecast.confidence >= 45 ? '🟡' : '🟠'}
                                                    </span>
                                                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>
                                                        {forecast.pronostic.confidenceNote}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* ── 2b. GOOGLE FLIGHTS PRICE INSIGHTS (6-12 month historical) ── */}
                                {(priceInsights || insightsLoading) && (
                                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", marginBottom: 10, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            ANALYSE DE PRIX GOOGLE FLIGHTS
                                            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>6-12 mois d&apos;historique</span>
                                        </div>

                                        {insightsLoading ? (
                                            <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                                                Chargement des données Google Flights...
                                            </div>
                                        ) : priceInsights && (
                                            <>
                                                {/* Price Level Badge + Typical Range */}
                                                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                                                    <div style={{
                                                        flex: '1 1 140px', padding: '10px 12px', borderRadius: 12,
                                                        background: priceInsights.price_level === 'low' ? 'rgba(16,185,129,0.1)' : priceInsights.price_level === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                                        border: `1px solid ${priceInsights.price_level === 'low' ? 'rgba(16,185,129,0.2)' : priceInsights.price_level === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                                                    }}>
                                                        <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", letterSpacing: 0.5 }}>NIVEAU DE PRIX ACTUEL</div>
                                                        <div style={{
                                                            fontSize: 16, fontWeight: 800, fontFamily: "'Fredoka', sans-serif", marginTop: 4,
                                                            color: priceInsights.price_level === 'low' ? '#10B981' : priceInsights.price_level === 'high' ? '#EF4444' : '#F59E0B',
                                                        }}>
                                                            {priceInsights.price_level === 'low' ? 'Bas' : priceInsights.price_level === 'high' ? 'Élevé' : 'Normal'}
                                                        </div>
                                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                                                            {priceInsights.price_level === 'low' ? 'Prix sous la moyenne — bon moment!' : priceInsights.price_level === 'high' ? 'Prix au-dessus de la moyenne' : 'Prix dans la fourchette habituelle'}
                                                        </div>
                                                    </div>

                                                    <div style={{
                                                        flex: '1 1 140px', padding: '10px 12px', borderRadius: 12,
                                                        background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)',
                                                    }}>
                                                        <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", letterSpacing: 0.5 }}>FOURCHETTE TYPIQUE</div>
                                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                                                            <span style={{ fontSize: 16, fontWeight: 800, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif" }}>
                                                                {Math.round(priceInsights.typical_price_range[0])}$
                                                            </span>
                                                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>—</span>
                                                            <span style={{ fontSize: 16, fontWeight: 800, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif" }}>
                                                                {Math.round(priceInsights.typical_price_range[1])}$
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                                                            Prix habituel aller-retour
                                                        </div>
                                                        {priceInsights.lowest_price > 0 && (
                                                            <div style={{ fontSize: 10, fontWeight: 600, color: '#10B981', fontFamily: "'Outfit', sans-serif", marginTop: 4 }}>
                                                                Plus bas trouvé : {Math.round(priceInsights.lowest_price)}$
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>



                                            </>
                                        )}
                                    </div>
                                )}

                                {/* ── 2c. MONTHLY PRICE COMPASS — Best Month to Fly ── */}
                                {(monthlyLoading || (monthlyData && monthlyData.months.some(m => m.count > 0))) && (
                                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        {/* Header with year selector */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", letterSpacing: 0.5 }}>
                                                MEILLEUR MOIS POUR PARTIR
                                            </div>
                                            <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 2 }}>
                                                {([1, 2, 3] as const).map(y => (
                                                    <button key={y} onClick={() => setMonthlyYears(y)}
                                                        style={{
                                                            padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                                                            fontSize: 10, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                                                            background: monthlyYears === y ? 'linear-gradient(135deg, #0EA5E9, #06B6D4)' : 'transparent',
                                                            color: monthlyYears === y ? '#fff' : 'rgba(255,255,255,0.35)',
                                                            transition: 'all 0.2s',
                                                        }}>
                                                        {y}A
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {monthlyLoading ? (
                                            <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                                                Analyse des prix sur {monthlyYears} an{monthlyYears > 1 ? 's' : ''}...
                                            </div>
                                        ) : monthlyData && (() => {
                                            const monthsFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
                                            const monthsFullFr = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
                                            const withData = monthlyData.months.filter(m => m.count > 0);
                                            if (withData.length < 2) {
                                                return (
                                                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: "'Outfit', sans-serif" }}>
                                                        Pas encore assez de données historiques. Cette analyse deviendra plus riche au fil des scans.
                                                    </div>
                                                );
                                            }
                                            const cheapest = withData.reduce((a, b) => a.median < b.median ? a : b);
                                            const expensive = withData.reduce((a, b) => a.median > b.median ? a : b);
                                            const saving = expensive.median - cheapest.median;
                                            const savingPct = expensive.median > 0 ? Math.round((saving / expensive.median) * 100) : 0;
                                            const medians = withData.map(m => m.median);
                                            const globalMin = Math.min(...medians);
                                            const globalMax = Math.max(...medians);
                                            const globalRange = globalMax - globalMin || 1;
                                            const getColor = (median: number) => {
                                                const ratio = (median - globalMin) / globalRange;
                                                if (ratio < 0.33) return { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#10B981', ring: '#10B981' };
                                                if (ratio < 0.66) return { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#F59E0B', ring: '#F59E0B' };
                                                return { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#EF4444', ring: '#EF4444' };
                                            };
                                            const CX = 140, CY = 140, R = 105, nodeR = 24;
                                            return (
                                                <>
                                                    {/* ── Hero insight card ── */}
                                                    <div style={{
                                                        padding: '14px 16px', borderRadius: 14, marginBottom: 14,
                                                        background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(6,182,212,0.08) 100%)',
                                                        border: '1px solid rgba(16,185,129,0.2)',
                                                        display: 'flex', alignItems: 'center', gap: 14,
                                                    }}>
                                                        <div style={{
                                                            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                                                            background: 'linear-gradient(135deg, #10B981, #06B6D4)',
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                            boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
                                                        }}>
                                                            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>PARS EN</span>
                                                            <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Fredoka', sans-serif", lineHeight: 1.1 }}>
                                                                {monthsFr[cheapest.month]}
                                                            </span>
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#10B981', fontFamily: "'Outfit', sans-serif", marginBottom: 2 }}>
                                                                {monthsFullFr[cheapest.month]} est le mois le moins cher
                                                            </div>
                                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
                                                                Médiane de <strong style={{ color: '#10B981' }}>{cheapest.median}$</strong> (min. {cheapest.min}$)
                                                                {saving > 30 && (
                                                                    <> — <strong style={{ color: '#10B981' }}>{saving}$ de moins</strong> ({savingPct}%) vs {monthsFullFr[expensive.month]}</>
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                                                                Basé sur {monthlyData.totalDataPoints} prix scannés · {monthlyYears} an{monthlyYears > 1 ? 's' : ''}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* ── Circular Month Compass (SVG) ── */}
                                                    <svg viewBox={`0 0 ${CX * 2} ${CY * 2}`} width="100%" style={{ display: 'block', maxWidth: 320, margin: '0 auto' }}>
                                                        <defs>
                                                            <filter id="glow-best">
                                                                <feGaussianBlur stdDeviation="4" result="blur" />
                                                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                                            </filter>
                                                            <radialGradient id="compass-bg" cx="50%" cy="50%" r="50%">
                                                                <stop offset="0%" stopColor="rgba(14,165,233,0.06)" />
                                                                <stop offset="100%" stopColor="transparent" />
                                                            </radialGradient>
                                                        </defs>

                                                        {/* Background circle */}
                                                        <circle cx={CX} cy={CY} r={R + 10} fill="url(#compass-bg)" />

                                                        {/* Connecting lines from center to each month */}
                                                        {monthlyData.months.map((m, i) => {
                                                            if (m.count === 0) return null;
                                                            const angle = (i * 30 - 90) * Math.PI / 180;
                                                            const x = CX + R * Math.cos(angle);
                                                            const y = CY + R * Math.sin(angle);
                                                            return <line key={`line-${i}`} x1={CX} y1={CY} x2={x} y2={y}
                                                                stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
                                                        })}

                                                        {/* Filled area polygon connecting median-scaled positions */}
                                                        {(() => {
                                                            const areaPoints = monthlyData.months.map((m, i) => {
                                                                const angle = (i * 30 - 90) * Math.PI / 180;
                                                                const scale = m.count > 0 ? 0.35 + 0.55 * (1 - (m.median - globalMin) / globalRange) : 0.35;
                                                                const r = R * scale;
                                                                return `${(CX + r * Math.cos(angle)).toFixed(1)},${(CY + r * Math.sin(angle)).toFixed(1)}`;
                                                            });
                                                            return (
                                                                <polygon points={areaPoints.join(' ')}
                                                                    fill="rgba(14,165,233,0.08)" stroke="rgba(14,165,233,0.25)"
                                                                    strokeWidth="1.5" strokeLinejoin="round" />
                                                            );
                                                        })()}

                                                        {/* Month nodes */}
                                                        {monthlyData.months.map((m, i) => {
                                                            const angle = (i * 30 - 90) * Math.PI / 180;
                                                            const x = CX + R * Math.cos(angle);
                                                            const y = CY + R * Math.sin(angle);
                                                            const isBest = m.month === cheapest.month;
                                                            const isWorst = m.month === expensive.month;
                                                            const hasData = m.count > 0;
                                                            const col = hasData ? getColor(m.median) : { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.15)', ring: 'rgba(255,255,255,0.1)' };

                                                            return (
                                                                <g key={i} filter={isBest ? 'url(#glow-best)' : undefined}>
                                                                    {/* Outer ring */}
                                                                    <circle cx={x} cy={y} r={nodeR + 2}
                                                                        fill="none" stroke={col.ring} strokeWidth={isBest ? 2.5 : 1}
                                                                        opacity={isBest ? 1 : 0.4} />
                                                                    {/* Node background */}
                                                                    <circle cx={x} cy={y} r={nodeR}
                                                                        fill={isBest ? 'rgba(16,185,129,0.25)' : isWorst ? 'rgba(239,68,68,0.15)' : col.bg}
                                                                        stroke={col.border} strokeWidth="1" />
                                                                    {/* Month label */}
                                                                    <text x={x} y={hasData ? y - 5 : y + 1}
                                                                        textAnchor="middle" dominantBaseline="middle"
                                                                        fill={hasData ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)'}
                                                                        fontSize="8" fontWeight="700" fontFamily="Outfit">
                                                                        {monthsFr[i]}
                                                                    </text>
                                                                    {/* Price */}
                                                                    {hasData && (
                                                                        <text x={x} y={y + 7}
                                                                            textAnchor="middle" dominantBaseline="middle"
                                                                            fill={col.text} fontSize={isBest ? '11' : '9'}
                                                                            fontWeight="800" fontFamily="Fredoka">
                                                                            {m.median}$
                                                                        </text>
                                                                    )}
                                                                    {/* Best badge */}
                                                                    {isBest && hasData && (
                                                                        <>
                                                                            <circle cx={x + nodeR - 2} cy={y - nodeR + 2} r={6}
                                                                                fill="#10B981" stroke="#0F172A" strokeWidth="1.5" />
                                                                            <text x={x + nodeR - 2} y={y - nodeR + 3}
                                                                                textAnchor="middle" dominantBaseline="middle"
                                                                                fill="#fff" fontSize="7" fontWeight="800">&#10003;</text>
                                                                        </>
                                                                    )}
                                                                </g>
                                                            );
                                                        })}

                                                        {/* Center label */}
                                                        <circle cx={CX} cy={CY} r={28} fill="rgba(15,23,42,0.9)" stroke="rgba(14,165,233,0.2)" strokeWidth="1" />
                                                        <text x={CX} y={CY - 6} textAnchor="middle" dominantBaseline="middle"
                                                            fill="rgba(255,255,255,0.4)" fontSize="7" fontWeight="700" fontFamily="Outfit">MÉDIANE</text>
                                                        <text x={CX} y={CY + 7} textAnchor="middle" dominantBaseline="middle"
                                                            fill="#0EA5E9" fontSize="12" fontWeight="800" fontFamily="Fredoka">
                                                            {monthlyYears}A
                                                        </text>
                                                    </svg>

                                                    {/* ── Pro tips ── */}
                                                    {saving > 30 && (
                                                        <div style={{
                                                            marginTop: 12, padding: '10px 12px', borderRadius: 10,
                                                            background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.04))',
                                                            border: '1px solid rgba(16,185,129,0.12)',
                                                        }}>
                                                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6 }}>
                                                                <strong style={{ color: '#10B981' }}>Astuce GeAI :</strong> En choisissant {monthsFullFr[cheapest.month]} plutôt que {monthsFullFr[expensive.month]}, tu économises en moyenne <strong style={{ color: '#10B981' }}>{saving}$</strong> par personne ({savingPct}%). Sur un couple, c&apos;est <strong style={{ color: '#10B981' }}>{saving * 2}$ d&apos;économie</strong>.
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}


                                {/* ── 3. PRICE CALENDAR — compact single-month with navigation ── */}
                                {deals.length >= 3 && (() => {
                                    // Build merged price-per-date map
                                    const dateMap: Record<string, { price: number; airline: string; stops: number; bookingLink: string; returnDate: string }> = {};
                                    for (const d of deals) {
                                        const dk = d.departureDate.slice(0, 10);
                                        if (!dateMap[dk] || d.price < dateMap[dk].price) {
                                            dateMap[dk] = { price: Math.round(d.price), airline: d.airline, stops: d.stops, bookingLink: d.bookingLink, returnDate: d.returnDate };
                                        }
                                    }
                                    if (isPremium && calendarDates) {
                                        for (const [dk, cd] of Object.entries(calendarDates)) {
                                            if (!dateMap[dk] || cd.price < dateMap[dk].price) {
                                                const link = `https://www.skyscanner.ca/transport/flights/yul/${activeCode.toLowerCase()}/${dk.replace(/-/g, '')}/${cd.returnDate?.replace(/-/g, '') || ''}/?adultsv2=1&cabinclass=economy`;
                                                dateMap[dk] = { price: Math.round(cd.price), airline: cd.airline, stops: cd.stops, bookingLink: link, returnDate: cd.returnDate || '' };
                                            }
                                        }
                                    }
                                    const allCalPrices = Object.values(dateMap).map(d => d.price);
                                    if (allCalPrices.length < 2) return null;
                                    const calMin = Math.min(...allCalPrices);
                                    const calMax = Math.max(...allCalPrices);
                                    const calRange = calMax - calMin || 1;
                                    const totalDates = allCalPrices.length;

                                    const todayStr = new Date().toISOString().slice(0, 10);
                                    const futureKeys = Object.keys(dateMap).filter(dk => dk >= todayStr).sort();
                                    if (futureKeys.length === 0) return null;

                                    // Available months
                                    const firstMk = futureKeys[0].slice(0, 7);
                                    const lastMk = futureKeys[futureKeys.length - 1].slice(0, 7);
                                    const monthKeys: string[] = [];
                                    let cursor = firstMk;
                                    while (cursor <= lastMk) {
                                        monthKeys.push(cursor);
                                        const [cy, cm] = cursor.split('-').map(Number);
                                        cursor = cm === 12 ? `${cy + 1}-01` : `${cy}-${String(cm + 1).padStart(2, '0')}`;
                                    }
                                    // Free users: limit to first 2 months
                                    const availableMonths = isPremium ? monthKeys : monthKeys.slice(0, 2);
                                    if (availableMonths.length === 0) return null;

                                    // Current displayed month (default to first available)
                                    const activeMk = calMonth && availableMonths.includes(calMonth) ? calMonth : availableMonths[0];
                                    const activeIdx = availableMonths.indexOf(activeMk);
                                    const canPrev = activeIdx > 0;
                                    const canNext = activeIdx < availableMonths.length - 1;

                                    const [yr, mo] = activeMk.split('-');
                                    const monthIdx = parseInt(mo, 10) - 1;
                                    const daysInMonth = new Date(parseInt(yr), monthIdx + 1, 0).getDate();
                                    const startDow = (new Date(parseInt(yr), monthIdx, 1).getDay() + 6) % 7;
                                    const MOIS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
                                    const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

                                    // Count deals this month & find cheapest this month
                                    let dealsThisMonth = 0;
                                    let cheapestThisMonth = Infinity;
                                    for (let d = 1; d <= daysInMonth; d++) {
                                        const ds = `${yr}-${mo}-${String(d).padStart(2, '0')}`;
                                        if (dateMap[ds] && ds >= todayStr) {
                                            dealsThisMonth++;
                                            if (dateMap[ds].price < cheapestThisMonth) cheapestThisMonth = dateMap[ds].price;
                                        }
                                    }

                                    return (
                                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        {/* Header row */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", letterSpacing: 0.5 }}>
                                                CALENDRIER DES PRIX
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {[
                                                    { color: '#10B981', label: 'Bon' },
                                                    { color: '#F59E0B', label: 'Moy.' },
                                                    { color: '#EF4444', label: 'Cher' },
                                                ].map(l => (
                                                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <div style={{ width: 5, height: 5, borderRadius: 1, background: l.color, opacity: 0.7 }} />
                                                        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>{l.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Month navigation */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            marginBottom: 10, padding: '6px 4px',
                                            background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                                        }}>
                                            <button onClick={() => canPrev && setCalMonth(availableMonths[activeIdx - 1])}
                                                style={{
                                                    width: 28, height: 28, borderRadius: 8, border: 'none', cursor: canPrev ? 'pointer' : 'default',
                                                    background: canPrev ? 'rgba(14,165,233,0.1)' : 'transparent',
                                                    color: canPrev ? '#0EA5E9' : 'rgba(255,255,255,0.1)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                                                    transition: 'all 0.15s',
                                                }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                                            </button>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: "'Fredoka', sans-serif" }}>
                                                    {MOIS_FR[monthIdx]} {yr}
                                                </div>
                                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", marginTop: 1 }}>
                                                    {dealsThisMonth > 0 ? `${dealsThisMonth} vol${dealsThisMonth > 1 ? 's' : ''} · dès ${cheapestThisMonth}$` : 'Aucun vol ce mois'}
                                                </div>
                                            </div>
                                            <button onClick={() => canNext && setCalMonth(availableMonths[activeIdx + 1])}
                                                style={{
                                                    width: 28, height: 28, borderRadius: 8, border: 'none', cursor: canNext ? 'pointer' : 'default',
                                                    background: canNext ? 'rgba(14,165,233,0.1)' : 'transparent',
                                                    color: canNext ? '#0EA5E9' : 'rgba(255,255,255,0.1)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                                                    transition: 'all 0.15s',
                                                }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                                            </button>
                                        </div>

                                        {/* Day-of-week headers */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 3 }}>
                                            {JOURS.map((j, ji) => (
                                                <div key={ji} style={{
                                                    textAlign: 'center', fontSize: 8, fontWeight: 700,
                                                    color: ji >= 5 ? 'rgba(14,165,233,0.4)' : 'rgba(255,255,255,0.25)',
                                                    fontFamily: "'Outfit', sans-serif", padding: '2px 0',
                                                }}>
                                                    {j}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Day grid — single month */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                                            {Array.from({ length: startDow }, (_, i) => (
                                                <div key={`e-${i}`} style={{ height: 38 }} />
                                            ))}
                                            {Array.from({ length: daysInMonth }, (_, i) => {
                                                const day = i + 1;
                                                const dateStr = `${yr}-${mo}-${String(day).padStart(2, '0')}`;
                                                const info = dateMap[dateStr];
                                                const isPast = dateStr < todayStr;
                                                const isToday = dateStr === todayStr;

                                                if (!info || isPast) {
                                                    return (
                                                        <div key={day} style={{
                                                            height: 38, borderRadius: 8, display: 'flex', flexDirection: 'column',
                                                            alignItems: 'center', justifyContent: 'center',
                                                            background: isPast ? 'transparent' : 'rgba(255,255,255,0.02)',
                                                            opacity: isPast ? 0.3 : 1,
                                                            border: isToday ? '1px solid rgba(14,165,233,0.3)' : '1px solid transparent',
                                                        }}>
                                                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', fontFamily: "'Outfit', sans-serif" }}>{day}</span>
                                                        </div>
                                                    );
                                                }

                                                const ratio = (info.price - calMin) / calRange;
                                                const cellColor = ratio < 0.33 ? '#10B981' : ratio < 0.66 ? '#F59E0B' : '#EF4444';
                                                const cellBg = ratio < 0.33 ? 'rgba(16,185,129,0.15)' : ratio < 0.66 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
                                                const isCheapest = info.price === calMin;

                                                return (
                                                    <a key={day} href={info.bookingLink} target="_blank" rel="noopener noreferrer"
                                                        title={`${info.airline} · ${info.stops === 0 ? 'Direct' : info.stops + ' escale(s)'}${info.returnDate ? ` · Retour: ${info.returnDate}` : ''}`}
                                                        style={{
                                                            height: 38, borderRadius: 8, display: 'flex', flexDirection: 'column',
                                                            alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
                                                            background: cellBg,
                                                            border: isCheapest ? `1.5px solid ${cellColor}` : isToday ? '1px solid rgba(14,165,233,0.3)' : '1px solid transparent',
                                                            cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
                                                            position: 'relative',
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = `0 4px 14px ${cellColor}50`; e.currentTarget.style.zIndex = '2'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.zIndex = '0'; }}
                                                    >
                                                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{day}</span>
                                                        <span style={{ fontSize: 10, fontWeight: 800, color: cellColor, fontFamily: "'Fredoka', sans-serif", lineHeight: 1.2 }}>{info.price}$</span>
                                                    </a>
                                                );
                                            })}
                                        </div>

                                        {/* Month quick-jump pills (premium gets all, free gets 2) */}
                                        {availableMonths.length > 1 && (
                                            <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                                                {availableMonths.map(mk => {
                                                    const mIdx = parseInt(mk.split('-')[1], 10) - 1;
                                                    const isActive = mk === activeMk;
                                                    // Count deals for this month
                                                    const [my, mm] = mk.split('-');
                                                    const dim = new Date(parseInt(my), parseInt(mm, 10), 0).getDate();
                                                    let ct = 0;
                                                    for (let dd = 1; dd <= dim; dd++) {
                                                        const ds = `${my}-${mm}-${String(dd).padStart(2, '0')}`;
                                                        if (dateMap[ds] && ds >= todayStr) ct++;
                                                    }
                                                    return (
                                                        <button key={mk} onClick={() => setCalMonth(mk)}
                                                            style={{
                                                                padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                                                fontSize: 10, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                                                                background: isActive ? 'linear-gradient(135deg, #0EA5E9, #06B6D4)' : 'rgba(255,255,255,0.04)',
                                                                color: isActive ? '#fff' : ct > 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
                                                                transition: 'all 0.15s',
                                                            }}>
                                                            {MOIS_FR[mIdx].slice(0, 3)}{ct > 0 && <span style={{ fontSize: 8, marginLeft: 3, opacity: 0.6 }}>{ct}</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Free user upsell */}
                                        {!isPremium && monthKeys.length > 2 && (
                                            <a href="/pricing" style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                marginTop: 10, padding: '10px 14px', borderRadius: 12, textDecoration: 'none',
                                                background: 'linear-gradient(135deg, rgba(255,215,0,0.06), rgba(245,158,11,0.03))',
                                                border: '1px dashed rgba(255,215,0,0.2)',
                                            }}>
                                                <span style={{ fontSize: 14 }}>&#128274;</span>
                                                <div>
                                                    <div style={{ fontSize: 11, fontWeight: 800, color: '#FFD700', fontFamily: "'Fredoka', sans-serif" }}>
                                                        +{monthKeys.length - 2} mois disponibles en Premium
                                                    </div>
                                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>
                                                        {totalDates} dates · Navigue librement dans le calendrier
                                                    </div>
                                                </div>
                                            </a>
                                        )}
                                    </div>
                                    );
                                })()}

                                {/* ── 5. STATS GRID: Month / Direct vs Stops / $/night ── */}
                                <div style={{ padding: '12px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {premiumAnalytics.cheapestMonth && (
                                        <div style={{ flex: '1 1 45%', minWidth: 120, padding: '10px 12px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                            <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", letterSpacing: 0.5 }}>MOIS LE - CHER</div>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: '#10B981', fontFamily: "'Fredoka', sans-serif", marginTop: 2 }}>{premiumAnalytics.cheapestMonth.name}</div>
                                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif" }}>dès {premiumAnalytics.cheapestMonth.min}$ · moy. {premiumAnalytics.cheapestMonth.avg}$</div>
                                            {premiumAnalytics.monthSaving > 0 && <div style={{ fontSize: 10, fontWeight: 600, color: '#10B981', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>-{premiumAnalytics.monthSaving}$ vs {premiumAnalytics.expensiveMonth?.name}</div>}
                                        </div>
                                    )}
                                    {premiumAnalytics.directCount > 0 && premiumAnalytics.stopsCount > 0 && (
                                        <div style={{ flex: '1 1 45%', minWidth: 120, padding: '10px 12px', borderRadius: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                                            <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", letterSpacing: 0.5 }}>DIRECT VS ESCALE</div>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                                                <span style={{ fontSize: 15, fontWeight: 700, color: '#818CF8', fontFamily: "'Fredoka', sans-serif" }}>{premiumAnalytics.avgDirect}$</span>
                                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>direct</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: '#A78BFA', fontFamily: "'Fredoka', sans-serif" }}>{premiumAnalytics.avgWithStops}$</span>
                                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>escale</span>
                                            </div>
                                            {premiumAnalytics.stopsSaving > 0 && <div style={{ fontSize: 10, fontWeight: 600, color: '#818CF8', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>-{premiumAnalytics.stopsSaving}$ avec escale</div>}
                                        </div>
                                    )}
                                    {premiumAnalytics.bestPerNight && (
                                        <div style={{ flex: '1 1 45%', minWidth: 120, padding: '10px 12px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                                            <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", letterSpacing: 0.5 }}>MEILLEUR $/NUIT</div>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: '#F59E0B', fontFamily: "'Fredoka', sans-serif", marginTop: 2 }}>{premiumAnalytics.bestPerNight.perNight}$/nuit</div>
                                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif" }}>{premiumAnalytics.bestPerNight.nights}n · {Math.round(premiumAnalytics.bestPerNight.price)}$ total</div>
                                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>{formatDateFr(premiumAnalytics.bestPerNight.departureDate)} — {formatDateFr(premiumAnalytics.bestPerNight.returnDate)}</div>
                                        </div>
                                    )}
                                </div>


                                {/* ── NOTRE RECOMMANDATION VOL — best combo ── */}
                                {premiumAnalytics.bestCombo && (
                                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", marginBottom: 10, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            NOTRE RECOMMANDATION
                                            <span style={{
                                                fontSize: 7, padding: '2px 6px', borderRadius: 4,
                                                background: 'linear-gradient(135deg, rgba(255,184,0,0.15), rgba(255,215,0,0.1))',
                                                color: '#FFD700', fontWeight: 800,
                                            }}>GEAI PICK</span>
                                        </div>
                                        <div style={{
                                            padding: '14px', borderRadius: 14,
                                            background: 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(139,92,246,0.06) 100%)',
                                            border: '1px solid rgba(14,165,233,0.2)',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: 10,
                                                    background: 'linear-gradient(135deg, #0EA5E9, #8B5CF6)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 4px 15px rgba(14,165,233,0.3)',
                                                }}>
                                                    <span style={{ fontSize: 18 }}>✈️</span>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif" }}>
                                                        {premiumAnalytics.bestCombo.airline}
                                                    </div>
                                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif" }}>
                                                        {premiumAnalytics.bestCombo.stops === 0 ? 'Vol direct' : `${premiumAnalytics.bestCombo.stops} escale${premiumAnalytics.bestCombo.stops > 1 ? 's' : ''}`}
                                                        {premiumAnalytics.bestCombo.durationMinutes > 0 && ` · ${formatDuration(premiumAnalytics.bestCombo.durationMinutes)}`}
                                                        {premiumAnalytics.bestCombo.nights > 0 && ` · ${premiumAnalytics.bestCombo.nights} nuits`}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: "'Fredoka', sans-serif" }}>
                                                        {Math.round(premiumAnalytics.bestCombo.price)}$
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif" }}>
                                                    {formatDateFr(premiumAnalytics.bestCombo.departureDate)} → {formatDateFr(premiumAnalytics.bestCombo.returnDate)}
                                                </span>
                                            </div>
                                            <div style={{
                                                fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5,
                                                padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                                            }}>
                                                Meilleur rapport prix / confort / durée parmi {deals.length} options analysées.
                                                {premiumAnalytics.bestCombo.stops === 0 && premiumAnalytics.bestCombo.price <= premiumAnalytics.priceMin * 1.1 &&
                                                    ' Vol direct ET parmi les moins chers — combo rare!'
                                                }
                                            </div>
                                            {premiumAnalytics.bestCombo.bookingLink && (
                                                <a href={premiumAnalytics.bestCombo.bookingLink} target="_blank" rel="noopener noreferrer"
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                        marginTop: 8, padding: '10px', borderRadius: 10,
                                                        background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                                        color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                                                        textDecoration: 'none', cursor: 'pointer',
                                                        boxShadow: '0 4px 15px rgba(14,165,233,0.4)',
                                                    }}>
                                                    Réserver ce vol →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── Price Range Gauge ── */}
                                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", marginBottom: 8, letterSpacing: 0.5 }}>
                                        POSITION DU MEILLEUR PRIX ACTUEL
                                    </div>
                                    <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'linear-gradient(90deg, #10B981, #F59E0B, #EF4444)' }}>
                                        {(() => {
                                            const range = premiumAnalytics.priceMax - premiumAnalytics.priceMin || 1;
                                            const pos = Math.max(0, Math.min(100, ((bestPrice || premiumAnalytics.priceMin) - premiumAnalytics.priceMin) / range * 100));
                                            return <div style={{
                                                position: 'absolute', top: -4, left: `calc(${pos}% - 8px)`,
                                                width: 16, height: 16, borderRadius: '50%',
                                                background: '#fff', border: '3px solid #0EA5E9',
                                                boxShadow: '0 2px 8px rgba(14,165,233,0.5)',
                                            }} />;
                                        })()}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', fontFamily: "'Fredoka', sans-serif" }}>{premiumAnalytics.priceMin}$</span>
                                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>fourchette scannée</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', fontFamily: "'Fredoka', sans-serif" }}>{premiumAnalytics.priceMax}$</span>
                                    </div>
                                </div>

                                {/* ── ALERTE PRIX — CTA ── */}
                                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{
                                        padding: '14px', borderRadius: 14,
                                        background: 'linear-gradient(135deg, rgba(255,184,0,0.06) 0%, rgba(255,215,0,0.03) 100%)',
                                        border: '1px solid rgba(255,215,0,0.15)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                            <span style={{ fontSize: 22 }}>🔔</span>
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 800, color: '#FFD700', fontFamily: "'Fredoka', sans-serif" }}>
                                                    Surveille ce prix pour moi
                                                </div>
                                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif" }}>
                                                    On te notifie quand le prix descend à <strong style={{ color: '#10B981' }}>{premiumAnalytics.targetPrice}$</strong> ou moins
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                fetch('/api/watchlist', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        destination: activeCity,
                                                        destination_code: activeCode,
                                                        target_price: premiumAnalytics.targetPrice,
                                                    }),
                                                }).then(() => {
                                                    setPopupToast(`Alerte créée! On te prévient quand ${activeCity} descend à ${premiumAnalytics.targetPrice}$ ou moins.`);
                                                    setTimeout(() => setPopupToast(''), 4000);
                                                }).catch(() => {
                                                    setPopupToast('Erreur — réessaie plus tard.');
                                                    setTimeout(() => setPopupToast(''), 3000);
                                                });
                                            }}
                                            style={{
                                                width: '100%', padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                                background: 'linear-gradient(135deg, #FFB800, #FFD700)',
                                                color: '#5C4A00', fontSize: 12, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                                boxShadow: '0 4px 15px rgba(255,184,0,0.3)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            }}>
                                            Activer l&apos;alerte à {premiumAnalytics.targetPrice}$ →
                                        </button>
                                    </div>
                                </div>

                                {/* ── Arrogant Premium closer ── */}
                                <div style={{
                                    padding: '12px 16px', textAlign: 'center',
                                }}>
                                    <div style={{
                                        padding: '10px 14px', borderRadius: 12,
                                        background: 'linear-gradient(135deg, rgba(14,165,233,0.05), rgba(139,92,246,0.04))',
                                        border: '1px solid rgba(14,165,233,0.1)',
                                    }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
                                            {premiumAnalytics.savingsVsAvg >= 100
                                                ? <>Tu viens d&apos;économiser <strong style={{ color: '#10B981' }}>{premiumAnalytics.savingsVsAvg}$</strong> grâce à cette analyse. Ton abonnement Premium vient de se rentabiliser <strong style={{ color: '#FFD700' }}>20 fois</strong>. De rien. 😎</>
                                                : premiumAnalytics.savingsVsAvg >= 30
                                                ? <>Score de deal, prévisions, rareté du prix, meilleure compagnie, alerte automatique... tout ça pour 5$/mois. Honnêtement, c&apos;est <strong style={{ color: '#FFD700' }}>donné</strong>. 🤷</>
                                                : <>10 analyses, données en temps réel, pronostics personnalisés. Avoue que ça vaut <strong style={{ color: '#FFD700' }}>largement</strong> 5$/mois. On dit merci qui? 😏</>
                                            }
                                        </div>
                                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif", marginTop: 4 }}>
                                            GeAI Intelligence · Données mises à jour quotidiennement
                                        </div>
                                    </div>
                                </div>
                            </div>
                            ) : (
                            /* ── Premium Intelligence — Blurred Real Dashboard for free users ── */
                            <div style={{
                                marginBottom: 16, borderRadius: 18,
                                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                                border: '1px solid rgba(14,165,233,0.2)',
                                overflow: 'hidden', position: 'relative',
                            }}>
                                {/* Real header (identical to premium) */}
                                <div style={{
                                    padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10,
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                        background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 2px 10px rgba(14,165,233,0.4)',
                                    }}>
                                        <img src="/logo_geai.png" alt="GeAI" width={22} height={22} style={{ borderRadius: '50%' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif" }}>
                                            Intelligence GeAI
                                        </div>
                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>
                                            {deals.length} vols · {historyCount > 0 ? `${historyCount} scans historiques` : 'analyse en cours'}
                                        </div>
                                    </div>
                                    <div style={{
                                        marginLeft: 'auto', padding: '3px 10px', borderRadius: 100,
                                        background: 'linear-gradient(135deg, #FFB800, #FFD700)',
                                        fontSize: 9, fontWeight: 800, color: '#5C4A00',
                                        fontFamily: "'Fredoka', sans-serif",
                                    }}>PREMIUM</div>
                                </div>

                                {/* ── Blurred dashboard content (shows REAL data, blurred) ── */}
                                <div style={{ position: 'relative' }}>
                                    {/* Actual content with real data — blurred */}
                                    <div style={{
                                        filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none',
                                        transform: 'scale(1.01)',
                                    }}>
                                        {/* Savings banner */}
                                        {premiumAnalytics && premiumAnalytics.savingsVsAvg > 0 && (
                                            <div style={{
                                                padding: '12px 16px',
                                                background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(6,182,212,0.08) 100%)',
                                                borderBottom: '1px solid rgba(16,185,129,0.15)',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                                                        background: 'linear-gradient(135deg, #10B981, #06B6D4)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <span style={{ fontSize: 20 }}>💸</span>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(16,185,129,0.7)', fontFamily: "'Outfit', sans-serif", letterSpacing: 0.5 }}>
                                                            TON ÉCONOMIE GEAI
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                                            <span style={{ fontSize: 24, fontWeight: 800, color: '#10B981', fontFamily: "'Fredoka', sans-serif" }}>
                                                                {premiumAnalytics.savingsVsAvg}$
                                                            </span>
                                                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif" }}>
                                                                de moins que la moyenne
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Score + Recommendation */}
                                        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                                    <div style={{
                                                        width: 68, height: 68, borderRadius: '50%',
                                                        background: `conic-gradient(${premiumAnalytics ? (premiumAnalytics.dealScore >= 70 ? '#10B981' : premiumAnalytics.dealScore >= 40 ? '#F59E0B' : '#EF4444') : '#0EA5E9'} ${premiumAnalytics ? premiumAnalytics.dealScore * 3.6 : 200}deg, rgba(255,255,255,0.06) 0deg)`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <div style={{
                                                            width: 54, height: 54, borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            <span style={{
                                                                fontSize: 22, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                                                color: premiumAnalytics ? (premiumAnalytics.dealScore >= 70 ? '#10B981' : premiumAnalytics.dealScore >= 40 ? '#F59E0B' : '#EF4444') : '#0EA5E9',
                                                            }}>{premiumAnalytics?.dealScore || 72}</span>
                                                            <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>/100</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{
                                                        fontSize: 14, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                                                        color: premiumAnalytics?.recommendation.urgency === 'buy' ? '#10B981' : premiumAnalytics?.recommendation.urgency === 'wait' ? '#F59E0B' : '#94A3B8',
                                                        marginBottom: 4,
                                                    }}>
                                                        {premiumAnalytics?.recommendation.urgency === 'buy' ? '✅' : premiumAnalytics?.recommendation.urgency === 'wait' ? '⏳' : '➡️'}{' '}
                                                        {premiumAnalytics?.recommendation.action || 'Acheter maintenant'}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
                                                        {premiumAnalytics?.recommendation.reason || 'Les prix montent et le deal actuel est excellent.'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Best month + airline row */}
                                        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            <div style={{ flex: 1, padding: '12px 16px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                                                <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5, marginBottom: 4, fontFamily: "'Outfit', sans-serif" }}>MEILLEUR MOIS</div>
                                                <div style={{ fontSize: 18, fontWeight: 800, color: '#10B981', fontFamily: "'Fredoka', sans-serif" }}>
                                                    {premiumAnalytics?.cheapestMonth?.name || 'Juin'}
                                                </div>
                                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>
                                                    dès {premiumAnalytics?.cheapestMonth?.min || cheapestPrice}$
                                                </div>
                                            </div>
                                            <div style={{ flex: 1, padding: '12px 16px' }}>
                                                <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5, marginBottom: 4, fontFamily: "'Outfit', sans-serif" }}>MEILLEURE COMPAGNIE</div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: '#0EA5E9', fontFamily: "'Outfit', sans-serif" }}>
                                                    {premiumAnalytics?.bestAirline?.name || 'Air Canada'}
                                                </div>
                                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>
                                                    moy. {premiumAnalytics?.bestAirline?.avg || cheapestPrice + 50}$
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mini price chart silhouette */}
                                        <div style={{ padding: '12px 16px' }}>
                                            <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5, marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>HISTORIQUE 90 JOURS</div>
                                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 40 }}>
                                                {Array.from({ length: 20 }, (_, i) => {
                                                    const h = 15 + Math.sin(i * 0.7) * 12 + Math.random() * 8;
                                                    const isLow = i >= 14 && i <= 17;
                                                    return <div key={i} style={{
                                                        flex: 1, height: h, borderRadius: 2,
                                                        background: isLow ? 'rgba(16,185,129,0.6)' : 'rgba(14,165,233,0.3)',
                                                    }} />;
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Glass overlay with CTA ── */}
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: 'linear-gradient(180deg, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.65) 40%, rgba(15,23,42,0.85) 100%)',
                                        backdropFilter: 'blur(1px)',
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'flex-end',
                                        padding: '20px 16px',
                                    }}>
                                        {/* Urgency tag — only if real data supports it */}
                                        {premiumAnalytics && premiumAnalytics.recommendation.urgency === 'buy' && (
                                            <div style={{
                                                padding: '6px 14px', borderRadius: 100, marginBottom: 10,
                                                background: 'rgba(16,185,129,0.15)',
                                                border: '1px solid rgba(16,185,129,0.3)',
                                                fontSize: 11, fontWeight: 700, color: '#10B981',
                                                fontFamily: "'Outfit', sans-serif",
                                            }}>
                                                L&apos;IA recommande d&apos;acheter maintenant
                                            </div>
                                        )}

                                        {/* Savings + ROI line */}
                                        {premiumAnalytics && premiumAnalytics.savingsVsAvg > 10 && (
                                            <div style={{
                                                fontSize: 13, fontWeight: 700, color: '#fff',
                                                fontFamily: "'Outfit', sans-serif", textAlign: 'center',
                                                marginBottom: 6, textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                                            }}>
                                                Ce deal est <span style={{ color: '#10B981' }}>{premiumAnalytics.savingsVsAvg}$ sous la moyenne</span>
                                            </div>
                                        )}

                                        {premiumAnalytics && premiumAnalytics.savingsVsAvg > 10 && (
                                            <div style={{
                                                fontSize: 11, color: 'rgba(255,255,255,0.6)',
                                                fontFamily: "'Outfit', sans-serif", textAlign: 'center',
                                                marginBottom: 14, textShadow: '0 1px 6px rgba(0,0,0,0.8)',
                                            }}>
                                                Pour un couple : {premiumAnalytics.savingsVsAvg * 2}$ d&apos;économie · Abonnement : {PREMIUM_PRICE}$/mois
                                            </div>
                                        )}

                                        {/* CTA button */}
                                        <a href="/pricing" style={{
                                            textDecoration: 'none', display: 'block', width: '100%',
                                        }}>
                                            <div style={{
                                                padding: '14px 20px', borderRadius: 14, textAlign: 'center',
                                                background: 'linear-gradient(135deg, #FFD700, #F59E0B)',
                                                boxShadow: '0 6px 28px rgba(255,215,0,0.4)',
                                                cursor: 'pointer',
                                            }}>
                                                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: "'Fredoka', sans-serif" }}>
                                                    Débloquer l&apos;analyse complète
                                                </div>
                                                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(15,23,42,0.55)', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                                                    {premiumAnalytics && premiumAnalytics.savingsVsAvg > 20
                                                        ? `Rentabilisé dès le 1er vol · ROI ${Math.round(premiumAnalytics.savingsVsAvg / PREMIUM_PRICE)}x`
                                                        : `Score, prédictions, historique, alertes · ${PREMIUM_PRICE}$/mois`
                                                    }
                                                </div>
                                            </div>
                                        </a>

                                        {/* Hidden deals count */}
                                        {!tier.allDeals && sortedDeals.length > tier.dealsPerDestination && (
                                            <div style={{
                                                fontSize: 11, color: 'rgba(255,255,255,0.5)',
                                                fontFamily: "'Outfit', sans-serif", marginTop: 10, textAlign: 'center',
                                                textShadow: '0 1px 6px rgba(0,0,0,0.8)',
                                            }}>
                                                + <strong style={{ color: '#0EA5E9' }}>{sortedDeals.length - tier.dealsPerDestination} vols cachés</strong> sur {sortedDeals.length} trouvés
                                            </div>
                                        )}

                                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", marginTop: 8 }}>
                                            Sans engagement · Annulable en 1 clic
                                        </div>
                                    </div>
                                </div>
                            </div>
                            )
                        )}

                        {/* Error */}
                        {(!showPackFlow || packStep === 1) && error && (
                            <div style={{
                                padding: '12px 16px', borderRadius: 12,
                                background: 'rgba(239,68,68,0.06)', color: '#DC2626',
                                fontSize: 13, fontFamily: "'Outfit', sans-serif", marginBottom: 12,
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Loading skeleton */}
                        {(!showPackFlow || packStep === 1) && loading && !liveSearching && (
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




                        {/* ═══ STEP 2 — HOTEL SELECTION (All-Inclusive) ═══ */}
                        {showPackFlow && packStep === 2 && selectedFlight && (
                            <div style={{ animation: 'destFadeIn 0.3s ease-out' }}>

                                {/* Back button + selected flight summary */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
                                    padding: '10px 14px', borderRadius: 12,
                                    background: '#F0F9FF', border: '1px solid rgba(14,165,233,0.15)',
                                    cursor: 'pointer',
                                }} onClick={() => setPackStep(1)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', fontFamily: "'Outfit', sans-serif" }}>
                                            Vol selectionne
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {formatDateFr(selectedFlight.departureDate)} - {formatDateFr(selectedFlight.returnDate)}
                                            <span style={{ fontSize: 10, color: '#64748B' }}>
                                                {selectedFlight.airline} &middot; {formatStops(selectedFlight.stops)}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 700, color: '#0EA5E9', flexShrink: 0 }}>
                                        {Math.round(selectedFlight.price * flightMultiplier)} $
                                    </div>
                                </div>

                                {/* Step 2 title */}
                                <div style={{
                                    fontSize: 14, fontWeight: 700, color: '#0F172A',
                                    fontFamily: "'Fredoka', sans-serif",
                                    marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <span style={{
                                        width: 22, height: 22, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                        color: '#fff', fontSize: 11, fontWeight: 800,
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        fontFamily: "'Fredoka', sans-serif",
                                    }}>2</span>
                                    Choisis ton hotel
                                    <span style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>
                                        ({selectedNights} nuits)
                                    </span>
                                </div>

                                {/* Hotel loading */}
                                {hotelsLoading && (
                                    <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>
                                        Recherche des hotels...
                                    </div>
                                )}

                                {!hotelsLoading && hotels.length > 0 && (
                                    <>
                                        {/* ── HOTEL PRICE CHART ── */}
                                        <div style={{
                                            marginBottom: 14, padding: '14px 16px', borderRadius: 14,
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
                                                    Comparatif prix / nuit
                                                </span>
                                                <span style={{
                                                    fontSize: 11, fontWeight: 600, color: '#94A3B8',
                                                    fontFamily: "'Fredoka', sans-serif",
                                                }}>
                                                    Moy. {hotelAvgPrice} $
                                                </span>
                                            </div>
                                            {/* Bar chart */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {hotels.map((hotel, i) => {
                                                    const maxPrice = Math.max(hotelAvgPrice, ...hotels.map(h => h.pricePerNight));
                                                    const barWidth = Math.max(15, (hotel.pricePerNight / maxPrice) * 100);
                                                    const avgLinePos = (hotelAvgPrice / maxPrice) * 100;
                                                    const isSelected = selectedHotel?.name === hotel.name;
                                                    const isReco = recommendedHotel?.name === hotel.name;
                                                    const isBelow = hotel.pricePerNight < hotelAvgPrice;

                                                    return (
                                                        <div key={i} style={{
                                                            display: 'flex', alignItems: 'center', gap: 8,
                                                            cursor: 'pointer', padding: '2px 0', borderRadius: 4,
                                                            opacity: isSelected ? 1 : 0.75,
                                                            transition: 'all 0.2s',
                                                        }} onClick={() => setSelectedHotel(hotel)}>
                                                            <span style={{
                                                                fontSize: 9, fontWeight: 600, color: isSelected ? '#0F172A' : '#94A3B8',
                                                                fontFamily: "'Outfit', sans-serif",
                                                                width: 60, textAlign: 'right', flexShrink: 0,
                                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                            }}>
                                                                {hotel.name.split(' ').slice(0, 2).join(' ')}
                                                            </span>
                                                            <div style={{
                                                                flex: 1, height: 18, position: 'relative',
                                                                background: '#E2E8F0', borderRadius: 4, overflow: 'hidden',
                                                            }}>
                                                                <div style={{
                                                                    height: '100%', borderRadius: 4,
                                                                    width: `${barWidth}%`,
                                                                    background: isReco
                                                                        ? 'linear-gradient(90deg, #10B981, #34D399)'
                                                                        : isBelow
                                                                            ? 'linear-gradient(90deg, #0EA5E9, #38BDF8)'
                                                                            : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                                                                    transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                                                    paddingRight: 6,
                                                                    outline: isSelected ? '2px solid #0EA5E9' : 'none',
                                                                    outlineOffset: -1,
                                                                }}>
                                                                    <span style={{
                                                                        fontSize: 9, fontWeight: 700, color: '#fff',
                                                                        fontFamily: "'Fredoka', sans-serif",
                                                                        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                                                    }}>
                                                                        {Math.round(hotel.pricePerNight)}$
                                                                    </span>
                                                                </div>
                                                                <div style={{
                                                                    position: 'absolute', top: 0, bottom: 0,
                                                                    left: `${avgLinePos}%`,
                                                                    width: 2, background: '#DC2626', opacity: 0.6,
                                                                }} />
                                                            </div>
                                                            {/* Mini rating */}
                                                            {hotel.rating > 0 && (
                                                                <span style={{
                                                                    fontSize: 9, fontWeight: 600, color: '#64748B',
                                                                    fontFamily: "'Outfit', sans-serif", flexShrink: 0, width: 28,
                                                                }}>
                                                                    {hotel.rating}/5
                                                                </span>
                                                            )}
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
                                                    Recommande
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

                                        {/* ── HOTEL CARDS LIST ── */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                                            {hotels.map((hotel, i) => {
                                                const isSelected = selectedHotel?.name === hotel.name;
                                                const isReco = recommendedHotel?.name === hotel.name;
                                                const ratingPct = Math.min(100, (hotel.rating / 5) * 100);
                                                const ratingColor = hotel.rating >= 4 ? '#10B981' : hotel.rating >= 3 ? '#F59E0B' : '#EF4444';

                                                return (
                                                    <div
                                                        key={i}
                                                        onClick={() => setSelectedHotel(hotel)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: 12,
                                                            padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                                                            background: isSelected
                                                                ? 'linear-gradient(135deg, rgba(14,165,233,0.06), rgba(6,182,212,0.04))'
                                                                : '#F8FAFC',
                                                            border: isSelected
                                                                ? '2px solid #0EA5E9'
                                                                : '1px solid #E2E8F0',
                                                            transition: 'all 0.2s',
                                                            position: 'relative',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isSelected) e.currentTarget.style.borderColor = 'rgba(14,165,233,0.3)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isSelected) e.currentTarget.style.borderColor = '#E2E8F0';
                                                        }}
                                                    >
                                                        {/* Recommended badge */}
                                                        {isReco && (
                                                            <div style={{
                                                                position: 'absolute', top: -8, left: 12,
                                                                fontSize: 8, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
                                                                background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff',
                                                                fontFamily: "'Fredoka', sans-serif",
                                                                boxShadow: '0 2px 6px rgba(16,185,129,0.3)',
                                                            }}>
                                                                RECOMMANDE
                                                            </div>
                                                        )}

                                                        {/* Hotel image */}
                                                        {hotel.imageUrl && (
                                                            <div style={{
                                                                width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                                                                background: '#E2E8F0',
                                                            }}>
                                                                <img src={hotel.imageUrl} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            </div>
                                                        )}

                                                        {/* Hotel info */}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{
                                                                fontSize: 13, fontWeight: 600, color: '#0F172A',
                                                                fontFamily: "'Outfit', sans-serif",
                                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                            }}>
                                                                {hotel.name}
                                                            </div>
                                                            <div style={{
                                                                fontSize: 11, color: '#64748B', fontFamily: "'Outfit', sans-serif",
                                                                display: 'flex', alignItems: 'center', gap: 6, marginTop: 2,
                                                            }}>
                                                                {hotel.stars > 0 && (
                                                                    <span style={{ color: '#F59E0B', letterSpacing: -1 }}>
                                                                        {'★'.repeat(Math.min(hotel.stars, 5))}
                                                                    </span>
                                                                )}
                                                                {hotel.isAllInclusive && (
                                                                    <span style={{
                                                                        fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                                                                        background: 'rgba(14,165,233,0.1)', color: '#0284C7',
                                                                    }}>
                                                                        ALL-INCLUSIVE
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {/* Rating bar */}
                                                            {hotel.rating > 0 && (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                                    <div style={{
                                                                        width: 60, height: 5, borderRadius: 3,
                                                                        background: '#E2E8F0', overflow: 'hidden',
                                                                    }}>
                                                                        <div style={{
                                                                            height: '100%', borderRadius: 3,
                                                                            width: `${ratingPct}%`,
                                                                            background: ratingColor,
                                                                            transition: 'width 0.5s',
                                                                        }} />
                                                                    </div>
                                                                    <span style={{ fontSize: 10, fontWeight: 600, color: ratingColor, fontFamily: "'Fredoka', sans-serif" }}>
                                                                        {hotel.rating}/5
                                                                    </span>
                                                                    {hotel.reviewCount > 0 && (
                                                                        <span style={{ fontSize: 9, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>
                                                                            ({hotel.reviewCount} avis)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {/* Amenity badges */}
                                                            {hotel.amenities && hotel.amenities.length > 0 && (
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
                                                                    {hotel.amenities.slice(0, 5).map((a, idx) => {
                                                                        const icon = AMENITY_ICONS[a] || Object.entries(AMENITY_ICONS).find(([k]) => a.toLowerCase().includes(k.toLowerCase()))?.[1] || '';
                                                                        return (
                                                                            <span key={idx} style={{
                                                                                fontSize: 9, padding: '1px 5px', borderRadius: 4,
                                                                                background: 'rgba(14,165,233,0.06)', color: '#64748B',
                                                                                fontFamily: "'Outfit', sans-serif", fontWeight: 500,
                                                                                whiteSpace: 'nowrap',
                                                                            }}>
                                                                                {icon && <span style={{ marginRight: 2 }}>{icon}</span>}{a}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                            {/* AI summary */}
                                                            {hotelSummaries[hotel.name] && (
                                                                <div style={{
                                                                    fontSize: 10, color: '#64748B', fontFamily: "'Outfit', sans-serif",
                                                                    fontStyle: 'italic', marginTop: 4, lineHeight: 1.3,
                                                                    display: 'flex', alignItems: 'flex-start', gap: 4,
                                                                }}>
                                                                    <span style={{ fontSize: 10, flexShrink: 0, color: '#F59E0B' }}>&#9733;</span>
                                                                    {hotelSummaries[hotel.name]}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Price + select */}
                                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 700, color: isSelected ? '#0EA5E9' : '#0F172A' }}>
                                                                {Math.round(hotel.pricePerNight)} $
                                                            </div>
                                                            <div style={{ fontSize: 9, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>/nuit</div>
                                                            <div style={{ fontSize: 10, color: '#64748B', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                                                                {Math.round(hotel.pricePerNight * selectedNights)} $ total
                                                            </div>
                                                        </div>

                                                        {/* Radio indicator */}
                                                        <div style={{
                                                            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                                            border: isSelected ? '2px solid #0EA5E9' : '2px solid #CBD5E1',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            background: isSelected ? '#0EA5E9' : 'transparent',
                                                            transition: 'all 0.2s',
                                                        }}>
                                                            {isSelected && (
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* ── COMBINED TOTAL + CTAs ── */}
                                        {selectedHotel && (
                                            <div style={{
                                                padding: '16px 18px', borderRadius: 16,
                                                background: 'linear-gradient(135deg, rgba(14,165,233,0.04), rgba(6,182,212,0.06))',
                                                border: '1px solid rgba(14,165,233,0.15)',
                                            }}>
                                                {/* Breakdown */}
                                                <div style={{
                                                    display: 'flex', flexDirection: 'column', gap: 4,
                                                    fontSize: 13, fontFamily: "'Outfit', sans-serif", color: '#475569',
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span>&#9992; Vol A/R {pricingMode === 'total-2' ? '(×2)' : pricingMode === 'family' ? `(${familyAdults}A + ${familyChildren}E)` : ''}</span>
                                                        <span style={{ fontWeight: 600, fontFamily: "'Fredoka', sans-serif", color: '#0F172A' }}>
                                                            {Math.round(selectedFlight.price * flightMultiplier)} $
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span>
                                                            &#127976; {selectedHotel.name.slice(0, 25)}{selectedHotel.name.length > 25 ? '...' : ''}
                                                            {selectedHotel.stars > 0 ? ` ${'★'.repeat(selectedHotel.stars)}` : ''}
                                                            {hotelRooms > 1 ? ` \u00d7 ${hotelRooms} ch.` : ''} &#215; {selectedNights}n
                                                        </span>
                                                        <span style={{ fontWeight: 600, fontFamily: "'Fredoka', sans-serif", color: '#0F172A' }}>
                                                            {Math.round(selectedHotel.pricePerNight * selectedNights * hotelRooms)} $
                                                        </span>
                                                    </div>
                                                    <div style={{
                                                        borderTop: '2px solid rgba(14,165,233,0.15)', paddingTop: 8, marginTop: 4,
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    }}>
                                                        <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                                                            Total pack
                                                        </span>
                                                        <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 24, fontWeight: 700, color: '#0EA5E9' }}>
                                                            {combinedTotal} $
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* CTA: Go to GeAI Analysis */}
                                                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                                                    <button
                                                        onClick={() => setPackStep(3)}
                                                        style={{
                                                            flex: 1, textAlign: 'center', padding: '14px 0', borderRadius: 12,
                                                            background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                                                            color: '#fff', fontSize: 14, fontWeight: 700,
                                                            fontFamily: "'Outfit', sans-serif",
                                                            border: 'none', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                                            transition: 'all 0.2s',
                                                        }}
                                                    >
                                                        <img src="/logo_geai.png" alt="GeAI" width={20} height={20} style={{ borderRadius: '50%' }} />
                                                        Voir l&apos;analyse GeAI
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7l7 7-7 7"/></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* ═══ STEP 3 — AI DEAL ANALYSIS ═══ */}
                        {showPackFlow && packStep === 3 && selectedFlight && selectedHotel && (
                            !tier.aiPackAnalysis ? (
                            <PremiumLock label="Analyse IA des tout-inclus">
                                <div style={{
                                    padding: '20px 16px', borderRadius: 16,
                                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                                    border: '1px solid rgba(14,165,233,0.15)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <div style={{
                                            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                                            background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <img src="/logo_geai.png" alt="GeAI" width={26} height={26} style={{ borderRadius: '50%' }} />
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif" }}>
                                            Analyse IA du pack
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
                                        L&apos;IA analyse ton pack vol + hôtel pour trouver le meilleur rapport qualité-prix...
                                    </div>
                                </div>
                            </PremiumLock>
                            ) : (
                            <div style={{ animation: 'destFadeIn 0.3s ease-out' }}>

                                {/* Back to Step 2 */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
                                    padding: '10px 14px', borderRadius: 12,
                                    background: '#F0F9FF', border: '1px solid rgba(14,165,233,0.15)',
                                    cursor: 'pointer',
                                }} onClick={() => setPackStep(2)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', fontFamily: "'Outfit', sans-serif" }}>
                                            Pack selectionne
                                        </div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                                            {selectedFlight.airline} &middot; {selectedHotel.name}
                                        </div>
                                    </div>
                                    <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 700, color: '#0EA5E9', flexShrink: 0 }}>
                                        {combinedTotal} $
                                    </div>
                                </div>

                                {/* Loading state */}
                                {analysisLoading && (
                                    <div style={{
                                        textAlign: 'center', padding: '40px 20px',
                                    }}>
                                        <div style={{
                                            width: 50, height: 50, borderRadius: '50%', margin: '0 auto 16px',
                                            background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            animation: 'geaiBob 2s ease-in-out infinite',
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                        }}>
                                            <img src="/logo_geai.png" alt="GeAI" width={32} height={32} style={{ borderRadius: '50%' }} />
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', fontFamily: "'Fredoka', sans-serif", marginBottom: 4 }}>
                                            GeAI analyse ton pack...
                                        </div>
                                        <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>
                                            Comparaison des prix, avis, tendances
                                        </div>
                                        <div style={{
                                            marginTop: 16, height: 4, borderRadius: 2, background: '#E2E8F0',
                                            overflow: 'hidden', maxWidth: 200, margin: '16px auto 0',
                                        }}>
                                            <div style={{
                                                height: '100%', borderRadius: 2,
                                                background: 'linear-gradient(90deg, #0EA5E9, #06B6D4)',
                                                animation: 'destShimmer 1.5s ease-in-out infinite',
                                                backgroundSize: '200% 100%',
                                                width: '60%',
                                            }} />
                                        </div>
                                    </div>
                                )}

                                {/* Analysis loaded */}
                                {!analysisLoading && packAnalysis && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                                        {/* ── VERDICT CARD ── */}
                                        <div style={{
                                            padding: '16px 18px', borderRadius: 16,
                                            background: packAnalysis.aiAnalysis.verdict === 'achete'
                                                ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.04))'
                                                : packAnalysis.aiAnalysis.verdict === 'attends'
                                                    ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.04))'
                                                    : 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(6,182,212,0.04))',
                                            border: `1px solid ${packAnalysis.aiAnalysis.verdict === 'achete' ? 'rgba(16,185,129,0.2)' : packAnalysis.aiAnalysis.verdict === 'attends' ? 'rgba(245,158,11,0.2)' : 'rgba(14,165,233,0.2)'}`,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                                                    background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                }}>
                                                    <img src="/logo_geai.png" alt="GeAI" width={26} height={26} style={{ borderRadius: '50%' }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: "'Fredoka', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        Analyse GeAI
                                                        <span style={{
                                                            fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                                                            background: packAnalysis.aiAnalysis.verdict === 'achete' ? '#10B981' : packAnalysis.aiAnalysis.verdict === 'attends' ? '#F59E0B' : '#0EA5E9',
                                                            color: '#fff', fontFamily: "'Fredoka', sans-serif",
                                                        }}>
                                                            {packAnalysis.aiAnalysis.verdict === 'achete' ? 'ACHETE!' : packAnalysis.aiAnalysis.verdict === 'attends' ? 'ATTENDS' : 'BON DEAL'}
                                                        </span>
                                                        <span style={{ fontSize: 9, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>
                                                            {packAnalysis.aiAnalysis.confidence}% confiance
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 13, color: '#334155', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5, marginBottom: 12 }}>
                                                {packAnalysis.aiAnalysis.summary}
                                            </div>

                                            {/* Pros */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                                                {(packAnalysis.aiAnalysis.pros || []).map((pro: string, i: number) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#059669', fontFamily: "'Outfit', sans-serif" }}>
                                                        <span style={{ flexShrink: 0, marginTop: 1 }}>&#10003;</span>
                                                        <span>{pro}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Cons */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {(packAnalysis.aiAnalysis.cons || []).map((con: string, i: number) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#D97706', fontFamily: "'Outfit', sans-serif" }}>
                                                        <span style={{ flexShrink: 0, marginTop: 1 }}>&#9888;</span>
                                                        <span>{con}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* ── SAVINGS CARD ── */}
                                        {packAnalysis.savings.vsBookingSeparately > 0 && (
                                            <div style={{
                                                padding: '14px 16px', borderRadius: 14,
                                                background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.04))',
                                                border: '1px solid rgba(16,185,129,0.15)',
                                            }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', fontFamily: "'Outfit', sans-serif", marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: 16 }}>&#128176;</span>
                                                    Tes economies
                                                </div>
                                                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                                    {packAnalysis.savings.vsMedian > 0 && (
                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: 22, fontWeight: 700, color: '#059669', fontFamily: "'Fredoka', sans-serif" }}>
                                                                -{packAnalysis.savings.vsMedian}$
                                                            </div>
                                                            <div style={{ fontSize: 9, color: '#64748B', fontFamily: "'Outfit', sans-serif" }}>vs prix median</div>
                                                        </div>
                                                    )}
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: 22, fontWeight: 700, color: '#059669', fontFamily: "'Fredoka', sans-serif" }}>
                                                            ~{packAnalysis.savings.vsBookingSeparately}$
                                                        </div>
                                                        <div style={{ fontSize: 9, color: '#64748B', fontFamily: "'Outfit', sans-serif" }}>vs reserver separement</div>
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: 22, fontWeight: 700, color: '#059669', fontFamily: "'Fredoka', sans-serif" }}>
                                                            {packAnalysis.savings.totalSavingsPercent}%
                                                        </div>
                                                        <div style={{ fontSize: 9, color: '#64748B', fontFamily: "'Outfit', sans-serif" }}>economie totale</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* ── HOTEL REVIEW CARD ── */}
                                        <div style={{
                                            padding: '14px 16px', borderRadius: 14,
                                            background: '#F8FAFC', border: '1px solid #E2E8F0',
                                        }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif", marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: 14 }}>&#127976;</span>
                                                {selectedHotel.name}
                                                <span style={{
                                                    fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                                                    background: selectedHotel.rating >= 4 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                                    color: selectedHotel.rating >= 4 ? '#059669' : '#D97706',
                                                }}>
                                                    {packAnalysis.hotelHighlights.scoreDescription}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                {selectedHotel.stars > 0 && (
                                                    <span style={{ color: '#F59E0B', letterSpacing: -1, fontSize: 14 }}>
                                                        {'★'.repeat(Math.min(selectedHotel.stars, 5))}
                                                    </span>
                                                )}
                                                <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', fontFamily: "'Fredoka', sans-serif" }}>
                                                    {selectedHotel.rating}/5
                                                </span>
                                                {selectedHotel.reviewCount > 0 && (
                                                    <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>
                                                        ({selectedHotel.reviewCount} avis)
                                                    </span>
                                                )}
                                            </div>
                                            {/* AI review */}
                                            <div style={{
                                                fontSize: 12, color: '#475569', fontFamily: "'Outfit', sans-serif",
                                                lineHeight: 1.5, fontStyle: 'italic',
                                                padding: '10px 12px', borderRadius: 10,
                                                background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.08)',
                                            }}>
                                                &laquo; {packAnalysis.hotelHighlights.aiReview} &raquo;
                                            </div>
                                            {/* Top amenities */}
                                            {packAnalysis.hotelHighlights.topAmenities?.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                                                    {packAnalysis.hotelHighlights.topAmenities.map((a: string, i: number) => (
                                                        <span key={i} style={{
                                                            fontSize: 10, padding: '2px 8px', borderRadius: 6,
                                                            background: 'rgba(14,165,233,0.08)', color: '#0284C7',
                                                            fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                                                        }}>
                                                            {a}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* ── BEST TIME ADVICE ── */}
                                        <div style={{
                                            padding: '12px 14px', borderRadius: 12,
                                            background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                                            border: '1px solid rgba(14,165,233,0.15)',
                                            display: 'flex', alignItems: 'center', gap: 10,
                                        }}>
                                            <span style={{ fontSize: 20, flexShrink: 0 }}>&#9200;</span>
                                            <div>
                                                <div style={{ fontSize: 10, fontWeight: 700, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif", marginBottom: 2 }}>
                                                    Meilleur moment pour reserver
                                                </div>
                                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.4 }}>
                                                    {packAnalysis.aiAnalysis.bestTimeAdvice}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── FINAL CTAs ── */}
                                        <div style={{
                                            padding: '16px 18px', borderRadius: 16,
                                            background: 'linear-gradient(135deg, rgba(14,165,233,0.04), rgba(6,182,212,0.06))',
                                            border: '1px solid rgba(14,165,233,0.15)',
                                        }}>
                                            {/* Price breakdown */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', fontFamily: "'Fredoka', sans-serif" }}>
                                                    Total pack
                                                </span>
                                                <span style={{ fontSize: 24, fontWeight: 700, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif" }}>
                                                    {combinedTotal} $
                                                </span>
                                            </div>

                                            {/* Booking buttons */}
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <a
                                                    href={selectedFlight.bookingLink || `https://www.skyscanner.ca/transport/flights/yul/${activeCode.toLowerCase()}/`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    style={{
                                                        flex: 1, textAlign: 'center', padding: '12px 0', borderRadius: 12,
                                                        background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                                        color: '#fff', fontSize: 13, fontWeight: 700,
                                                        fontFamily: "'Outfit', sans-serif", textDecoration: 'none',
                                                    }}
                                                >
                                                    &#9992; Reserver le vol
                                                </a>
                                                {selectedHotel.bookingUrl && (
                                                    <a
                                                        href={selectedHotel.bookingUrl}
                                                        target="_blank" rel="noopener noreferrer"
                                                        style={{
                                                            flex: 1, textAlign: 'center', padding: '12px 0', borderRadius: 12,
                                                            background: '#0F172A',
                                                            color: '#fff', fontSize: 13, fontWeight: 700,
                                                            fontFamily: "'Outfit', sans-serif", textDecoration: 'none',
                                                        }}
                                                    >
                                                        &#127976; Reserver l&apos;hotel
                                                    </a>
                                                )}
                                            </div>

                                            {/* Pack alert */}
                                            <button
                                                onClick={async () => {
                                                    if (!selectedFlight || !selectedHotel || !combinedTotal) return;
                                                    try {
                                                        const res = await fetch('/api/watchlist/pack', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                destination: activeCity,
                                                                destination_code: activeCode,
                                                                target_price: combinedTotal,
                                                                flight_price: selectedFlight.price,
                                                                hotel_price_per_night: selectedHotel.pricePerNight,
                                                                hotel_name: selectedHotel.name,
                                                                nights: selectedNights,
                                                            }),
                                                        });
                                                        const data = await res.json();
                                                        if (res.ok) {
                                                            setPopupToast('Alerte pack activee!');
                                                        } else {
                                                            setPopupToast(data.error || 'Erreur');
                                                        }
                                                        setTimeout(() => setPopupToast(''), 3000);
                                                    } catch {
                                                        setPopupToast('Erreur de connexion');
                                                        setTimeout(() => setPopupToast(''), 3000);
                                                    }
                                                }}
                                                style={{
                                                    width: '100%', marginTop: 10, padding: '10px 0', borderRadius: 10,
                                                    border: '1px dashed rgba(14,165,233,0.3)', background: 'rgba(14,165,233,0.04)',
                                                    cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#0284C7',
                                                    fontFamily: "'Outfit', sans-serif",
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                                                M&apos;alerter si ce pack baisse sous {combinedTotal} $
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Analysis failed - show basic CTAs */}
                                {!analysisLoading && !packAnalysis && (
                                    <div style={{
                                        padding: '16px 18px', borderRadius: 16,
                                        background: '#F8FAFC', border: '1px solid #E2E8F0',
                                        textAlign: 'center',
                                    }}>
                                        <div style={{ fontSize: 13, color: '#64748B', fontFamily: "'Outfit', sans-serif", marginBottom: 12 }}>
                                            Analyse indisponible pour le moment
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <a
                                                href={selectedFlight.bookingLink || `https://www.skyscanner.ca/transport/flights/yul/${activeCode.toLowerCase()}/`}
                                                target="_blank" rel="noopener noreferrer"
                                                style={{
                                                    flex: 1, textAlign: 'center', padding: '12px 0', borderRadius: 12,
                                                    background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                                    color: '#fff', fontSize: 13, fontWeight: 700,
                                                    fontFamily: "'Outfit', sans-serif", textDecoration: 'none',
                                                }}
                                            >
                                                &#9992; Reserver le vol
                                            </a>
                                            {selectedHotel.bookingUrl && (
                                                <a
                                                    href={selectedHotel.bookingUrl}
                                                    target="_blank" rel="noopener noreferrer"
                                                    style={{
                                                        flex: 1, textAlign: 'center', padding: '12px 0', borderRadius: 12,
                                                        background: '#0F172A',
                                                        color: '#fff', fontSize: 13, fontWeight: 700,
                                                        fontFamily: "'Outfit', sans-serif", textDecoration: 'none',
                                                    }}
                                                >
                                                    &#127976; Reserver l&apos;hotel
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            )
                        )}

                        {/* ═══ DATE FLEXIBILITY SCROLLER ═══ */}
                        {(!showPackFlow || packStep === 1) && dateFlexibility && (
                            tier.priceInsights ? (
                            <div style={{
                                marginBottom: 14, padding: '12px 14px', borderRadius: 14,
                                background: '#F8FAFC', border: '1px solid #E2E8F0',
                            }}>
                                <div style={{
                                    fontSize: 11, fontWeight: 700, color: '#0F172A',
                                    fontFamily: "'Outfit', sans-serif", marginBottom: 8,
                                    display: 'flex', alignItems: 'center', gap: 5,
                                }}>
                                    <span style={{ fontSize: 14 }}>&#x1F4C5;</span>
                                    Flexibilit&eacute; des dates
                                    <span style={{
                                        fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                                        background: 'rgba(16,185,129,0.1)', color: '#059669',
                                    }}>
                                        sem. la - ch&egrave;re : {dateFlexibility.cheapestWeek.minPrice}$
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex', gap: 6, overflowX: 'auto',
                                    paddingBottom: 4,
                                    scrollbarWidth: 'thin',
                                }}>
                                    {dateFlexibility.weeks.map((w, i) => {
                                        const isCheapest = w.weekStart === dateFlexibility.cheapestWeek.weekStart;
                                        const d = new Date(w.weekStart + 'T00:00:00');
                                        const months = ['jan','f\u00e9v','mar','avr','mai','juin','juil','ao\u00fbt','sep','oct','nov','d\u00e9c'];
                                        return (
                                            <div key={i} style={{
                                                flexShrink: 0, padding: '6px 10px', borderRadius: 10,
                                                background: isCheapest
                                                    ? 'linear-gradient(135deg, #10B981, #059669)'
                                                    : 'rgba(14,165,233,0.06)',
                                                border: isCheapest ? 'none' : '1px solid #E2E8F0',
                                                textAlign: 'center', minWidth: 60,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                            }}
                                            onClick={() => {
                                                setSortMode('date');
                                            }}
                                            >
                                                <div style={{
                                                    fontSize: 10, fontWeight: 600,
                                                    fontFamily: "'Outfit', sans-serif",
                                                    color: isCheapest ? '#fff' : '#64748B',
                                                }}>
                                                    {d.getDate()} {months[d.getMonth()]}
                                                </div>
                                                <div style={{
                                                    fontSize: 14, fontWeight: 700,
                                                    fontFamily: "'Fredoka', sans-serif",
                                                    color: isCheapest ? '#fff' : '#0F172A',
                                                    marginTop: 2,
                                                }}>
                                                    {Math.round(w.minPrice)}$
                                                </div>
                                                {isCheapest && (
                                                    <div style={{
                                                        fontSize: 7, fontWeight: 800, color: 'rgba(255,255,255,0.9)',
                                                        fontFamily: "'Fredoka', sans-serif", marginTop: 1,
                                                    }}>
                                                        MEILLEUR
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            ) : (
                            <PremiumLock label="Meilleure semaine pour partir">
                                <div style={{
                                    marginBottom: 14, padding: '12px 14px', borderRadius: 14,
                                    background: '#F8FAFC', border: '1px solid #E2E8F0',
                                }}>
                                    <div style={{
                                        fontSize: 11, fontWeight: 700, color: '#0F172A',
                                        fontFamily: "'Outfit', sans-serif", marginBottom: 8,
                                        display: 'flex', alignItems: 'center', gap: 5,
                                    }}>
                                        <span style={{ fontSize: 14 }}>&#x1F4C5;</span>
                                        Flexibilit&eacute; des dates
                                        <span style={{
                                            fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                                            background: 'rgba(16,185,129,0.1)', color: '#059669',
                                        }}>
                                            sem. la - ch&egrave;re : {dateFlexibility.cheapestWeek.minPrice}$
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                                        {dateFlexibility.weeks.map((w, i) => {
                                            const isCheapest = w.weekStart === dateFlexibility.cheapestWeek.weekStart;
                                            const d = new Date(w.weekStart + 'T00:00:00');
                                            const months = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];
                                            return (
                                                <div key={i} style={{
                                                    flexShrink: 0, padding: '6px 10px', borderRadius: 10,
                                                    background: isCheapest
                                                        ? 'linear-gradient(135deg, #10B981, #059669)'
                                                        : 'rgba(14,165,233,0.06)',
                                                    border: isCheapest ? 'none' : '1px solid #E2E8F0',
                                                    textAlign: 'center', minWidth: 60,
                                                }}>
                                                    <div style={{ fontSize: 10, fontWeight: 600, fontFamily: "'Outfit', sans-serif", color: isCheapest ? '#fff' : '#64748B' }}>
                                                        {d.getDate()} {months[d.getMonth()]}
                                                    </div>
                                                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", color: isCheapest ? '#fff' : '#0F172A', marginTop: 2 }}>
                                                        {Math.round(w.minPrice)}$
                                                    </div>
                                                    {isCheapest && (
                                                        <div style={{ fontSize: 7, fontWeight: 800, color: 'rgba(255,255,255,0.9)', fontFamily: "'Fredoka', sans-serif", marginTop: 1 }}>
                                                            MEILLEUR
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </PremiumLock>
                            )
                        )}

                        {/* ═══ STEP 1 TITLE (All-Inclusive) ═══ */}
                        {showPackFlow && packStep === 1 && deals.length > 0 && hotels.length > 0 && (
                            <div style={{
                                fontSize: 14, fontWeight: 700, color: '#0F172A',
                                fontFamily: "'Fredoka', sans-serif",
                                marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <span style={{
                                    width: 22, height: 22, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                    color: '#fff', fontSize: 11, fontWeight: 800,
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: "'Fredoka', sans-serif",
                                }}>1</span>
                                Choisis ton vol
                            </div>
                        )}

                        {/* ═══ DEAL DATE CARDS ═══ */}
                        {(!showPackFlow || packStep === 1) && sortedDeals.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {sortedDeals.slice(0, tier.dealsPerDestination).map((deal, i) => {
                                    const isCheapest = deal.price === cheapestPrice;
                                    const nights = deal.tripNights || getTripNights(deal.departureDate, deal.returnDate);
                                    const dealDiscount = deal.discount || (avgPrice > deal.price
                                        ? Math.round(((avgPrice - deal.price) / avgPrice) * 100)
                                        : 0);
                                    const isBelow = avgPrice > 0 && deal.price < avgPrice;

                                    const isFlightSelected = showPackFlow && selectedFlight?.departureDate === deal.departureDate && selectedFlight?.returnDate === deal.returnDate && selectedFlight?.price === deal.price;
                                    const CardTag = (showPackFlow && hotels.length > 0) ? 'div' as const : 'a' as const;
                                    const cardLinkProps = (showPackFlow && hotels.length > 0)
                                        ? {}
                                        : { href: deal.bookingLink || fallbackUrl, target: '_blank' as const, rel: 'noopener noreferrer' };

                                    return (
                                        <CardTag
                                            key={`${deal.departureDate}-${deal.returnDate}-${i}`}
                                            {...cardLinkProps}
                                            onClick={(showPackFlow && hotels.length > 0) ? () => {
                                                setSelectedFlight(deal);
                                                setSelectedHotel(null);
                                                setPackStep(2);
                                            } : undefined}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 12,
                                                padding: '14px 16px',
                                                borderRadius: 14,
                                                background: isFlightSelected
                                                    ? 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(6,182,212,0.06))'
                                                    : isCheapest
                                                        ? 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.03))'
                                                        : isBelow
                                                            ? 'linear-gradient(135deg, rgba(14,165,233,0.04), rgba(14,165,233,0.01))'
                                                            : '#F8FAFC',
                                                border: isFlightSelected
                                                    ? '2px solid #0EA5E9'
                                                    : isCheapest
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
                                                {showPackFlow && pricingMode === 'total-2' && (
                                                    <div style={{ fontSize: 10, color: '#64748B', fontFamily: "'Outfit', sans-serif" }}>
                                                        {Math.round(deal.price * 2)} $ pour 2
                                                    </div>
                                                )}
                                                {showPackFlow && pricingMode === 'family' && (
                                                    <div style={{ fontSize: 10, color: '#64748B', fontFamily: "'Outfit', sans-serif" }}>
                                                        {Math.round(deal.price * flightMultiplier)} $ famille
                                                    </div>
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

                                            {/* Arrow or Select indicator */}
                                            <div style={{ flexShrink: 0, color: isFlightSelected ? '#0EA5E9' : '#94A3B8' }}>
                                                {(showPackFlow && hotels.length > 0) ? (
                                                    <div style={{
                                                        width: 20, height: 20, borderRadius: '50%',
                                                        border: isFlightSelected ? '2px solid #0EA5E9' : '2px solid #CBD5E1',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: isFlightSelected ? '#0EA5E9' : 'transparent',
                                                        transition: 'all 0.2s',
                                                    }}>
                                                        {isFlightSelected && (
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M7 17L17 7M17 7H7M17 7v10" />
                                                    </svg>
                                                )}
                                            </div>
                                        </CardTag>
                                    );
                                })}

                                {/* Premium upsell — show blurred real deal cards */}
                                {!tier.allDeals && sortedDeals.length > tier.dealsPerDestination && (() => {
                                    const hidden = sortedDeals.length - tier.dealsPerDestination;
                                    const previewDeals = sortedDeals.slice(tier.dealsPerDestination, tier.dealsPerDestination + 2);
                                    return (
                                        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
                                            {/* Blurred real deal cards */}
                                            <div style={{
                                                filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none',
                                                transform: 'scale(1.02)',
                                                display: 'flex', flexDirection: 'column', gap: 8,
                                            }}>
                                                {previewDeals.map((deal, i) => (
                                                    <div key={i} style={{
                                                        display: 'flex', alignItems: 'center', gap: 12,
                                                        padding: '14px 16px', borderRadius: 14,
                                                        background: '#F8FAFC', border: '1px solid #E2E8F0',
                                                    }}>
                                                        <div style={{
                                                            width: 56, height: 56, borderRadius: 12, flexShrink: 0,
                                                            background: '#E0F2FE',
                                                            display: 'flex', flexDirection: 'column',
                                                            alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", color: '#0284C7' }}>
                                                                {new Date(deal.departureDate + 'T00:00:00').getDate()}
                                                            </span>
                                                            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif", color: '#0284C7' }}>
                                                                {['jan','fev','mar','avr','mai','juin','juil','aout','sep','oct','nov','dec'][new Date(deal.departureDate + 'T00:00:00').getMonth()]}
                                                            </span>
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
                                                                {formatDateFr(deal.departureDate)} - {formatDateFr(deal.returnDate)}
                                                            </div>
                                                            <div style={{ fontSize: 11, color: '#64748B', fontFamily: "'Outfit', sans-serif" }}>
                                                                {deal.airline || 'Compagnie'} · {deal.stops === 0 ? 'Direct' : `${deal.stops} escale${deal.stops > 1 ? 's' : ''}`}
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', fontFamily: "'Fredoka', sans-serif" }}>
                                                            {Math.round(deal.price)}$
                                                        </div>
                                                    </div>
                                                ))}
                                                {hidden > 2 && (
                                                    <div style={{
                                                        padding: '12px', borderRadius: 14,
                                                        background: '#F8FAFC', border: '1px solid #E2E8F0',
                                                        textAlign: 'center', fontSize: 12, color: '#64748B',
                                                    }}>
                                                        + {hidden - 2} autres options
                                                    </div>
                                                )}
                                            </div>

                                            {/* Overlay CTA */}
                                            <a href="/pricing" style={{
                                                position: 'absolute', inset: 0,
                                                background: 'linear-gradient(180deg, rgba(248,250,252,0.4) 0%, rgba(248,250,252,0.85) 60%, rgba(248,250,252,0.95) 100%)',
                                                display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center', gap: 8,
                                                textDecoration: 'none', borderRadius: 16,
                                            }}>
                                                <div style={{
                                                    width: 44, height: 44, borderRadius: 14,
                                                    background: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(6,182,212,0.08))',
                                                    border: '1px solid rgba(14,165,233,0.25)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round">
                                                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                                                    </svg>
                                                </div>
                                                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: "'Fredoka', sans-serif" }}>
                                                    {hidden} vol{hidden > 1 ? 's' : ''} de plus
                                                </div>
                                                <div style={{
                                                    padding: '10px 24px', borderRadius: 100,
                                                    background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                                    color: '#fff', fontSize: 13, fontWeight: 700,
                                                    fontFamily: "'Outfit', sans-serif",
                                                    boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
                                                }}>
                                                    Voir tous les vols
                                                </div>
                                            </a>
                                        </div>
                                    );
                                })()}

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
                                    Pas encore de dates scannées
                                </div>
                                <div style={{ fontSize: 13, marginBottom: 20, lineHeight: 1.5, maxWidth: 320, margin: '0 auto 20px' }}>
                                    Les prix sont mis à jour automatiquement.
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
                        {(!showPackFlow || packStep === 1) && avgPrice > 0 && deals.length > 0 && (
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
                        {(!showPackFlow || packStep === 1) && <div style={{
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
                                    {showPackFlow && hotels.length > 0 ? 'Clique sur un vol pour passer a l\'etape 2' : 'Clique sur une date pour reserver sur Skyscanner'}
                                </span>
                            </div>
                        </div>}

                        {/* Link to full destination page */}
                        <a
                            href={`/destination/${destinationCode}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                padding: '10px 16px',
                                marginTop: 8,
                                borderRadius: 12,
                                background: '#F0F9FF',
                                border: '1px solid #BAE6FD',
                                color: '#0284C7',
                                fontSize: 13,
                                fontWeight: 600,
                                fontFamily: "'Outfit', sans-serif",
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            📊 Voir la page complète — historique, calendrier et stats
                            <span style={{ fontSize: 16 }}>&rarr;</span>
                        </a>

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
