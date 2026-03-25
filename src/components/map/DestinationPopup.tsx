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

                        {/* ── CTA: Analyse Premium sur la page destination ── */}
                        {(!showPackFlow || packStep === 1) && !loading && deals.length > 0 && (
                            <a
                                href={`/destination/${activeCode}`}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    marginBottom: 16, padding: '16px 18px', borderRadius: 16,
                                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                                    border: '1px solid rgba(14,165,233,0.2)',
                                    textDecoration: 'none', color: '#fff',
                                    transition: 'all 0.3s',
                                }}
                            >
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                    background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(14,165,233,0.3)',
                                }}>
                                    <img src="/logo_geai.png" alt="GeAI" width={28} height={28} style={{ borderRadius: '50%' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 13, fontWeight: 700, color: '#fff',
                                        fontFamily: "'Fredoka', sans-serif",
                                        display: 'flex', alignItems: 'center', gap: 8,
                                    }}>
                                        Analyse complète
                                        <span style={{
                                            fontSize: 8, fontWeight: 800, padding: '2px 6px',
                                            borderRadius: 4, background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                            color: '#fff', letterSpacing: 0.5,
                                        }}>PREMIUM</span>
                                    </div>
                                    <div style={{
                                        fontSize: 11, color: 'rgba(255,255,255,0.6)',
                                        fontFamily: "'Outfit', sans-serif", marginTop: 3,
                                    }}>
                                        Calendrier des prix, pronostic IA, meilleur temps pour partir...
                                    </div>
                                </div>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </a>
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
