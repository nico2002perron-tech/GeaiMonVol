import { CITY_IMAGES, COUNTRY_IMAGES, DEFAULT_CITY_IMAGE, CANADA_CODES, ALL_INCLUSIVE_CODES } from '@/lib/constants/deals';

// ── City → Country mapping ──
export const CITY_COUNTRY: Record<string, string> = {
  'Paris': 'France', 'Barcelone': 'Espagne', 'Madrid': 'Espagne',
  'Lisbonne': 'Portugal', 'Porto': 'Portugal', 'Rome': 'Italie',
  'Athenes': 'Grèce', 'Athènes': 'Grèce',
  'Londres': 'Royaume-Uni', 'Dublin': 'Irlande',
  'Amsterdam': 'Pays-Bas', 'Berlin': 'Allemagne',
  'Cancun': 'Mexique', 'Cancún': 'Mexique', 'Riviera Maya': 'Mexique',
  'Punta Cana': 'République dominicaine',
  'Santo Domingo': 'République dominicaine',
  'Puerto Plata': 'République dominicaine',
  'Cuba (Varadero)': 'Cuba', 'Varadero': 'Cuba', 'La Havane': 'Cuba',
  'Kingston': 'Jamaïque', 'Montego Bay': 'Jamaïque',
  'Nassau': 'Bahamas', 'Freeport': 'Bahamas',
  'Guatemala City': 'Guatemala',
  'San Jose': 'Costa Rica', 'San José': 'Costa Rica',
  'Bridgetown': 'Barbade',
  'Belize City': 'Belize',
  'Fort Lauderdale': 'États-Unis', 'Miami': 'États-Unis',
  'New York': 'États-Unis', 'Los Angeles': 'États-Unis',
  'Las Vegas': 'États-Unis', 'Orlando': 'États-Unis',
  'Toronto': 'Canada', 'Ottawa': 'Canada', 'Vancouver': 'Canada',
  'Calgary': 'Canada', 'Edmonton': 'Canada', 'Winnipeg': 'Canada',
  'Halifax': 'Canada', 'Québec': 'Canada',
  'Bogota': 'Colombie', 'Cartagena': 'Colombie', 'Medellin': 'Colombie',
  'Lima': 'Pérou', 'Cusco': 'Pérou',
  'São Paulo': 'Brésil', 'Rio de Janeiro': 'Brésil',
  'Buenos Aires': 'Argentine',
  'Marrakech': 'Maroc', 'Bangkok': 'Thaïlande', 'Phuket': 'Thaïlande',
  'Tokyo': 'Japon', 'Osaka': 'Japon',
  'Bali': 'Indonésie', 'Ho Chi Minh': 'Vietnam', 'Hanoi': 'Vietnam',
  'Seoul': 'Corée du Sud', 'Delhi': 'Inde', 'Mumbai': 'Inde',
  'Istanbul': 'Turquie', 'Le Caire': 'Égypte',
  'Reykjavik': 'Islande',
};

// ── Country flag emojis ──
export const COUNTRY_FLAGS: Record<string, string> = {
  'France': '🇫🇷', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Italie': '🇮🇹',
  'Grèce': '🇬🇷', 'Royaume-Uni': '🇬🇧', 'Irlande': '🇮🇪', 'Pays-Bas': '🇳🇱',
  'Allemagne': '🇩🇪', 'Mexique': '🇲🇽', 'République dominicaine': '🇩🇴',
  'Cuba': '🇨🇺', 'États-Unis': '🇺🇸', 'Maroc': '🇲🇦', 'Thaïlande': '🇹🇭',
  'Japon': '🇯🇵', 'Colombie': '🇨🇴', 'Pérou': '🇵🇪', 'Brésil': '🇧🇷',
  'Argentine': '🇦🇷', 'Indonésie': '🇮🇩', 'Vietnam': '🇻🇳', 'Islande': '🇮🇸',
  'Jamaïque': '🇯🇲', 'Costa Rica': '🇨🇷', 'Canada': '🇨🇦',
  'Bahamas': '🇧🇸', 'Barbade': '🇧🇧', 'Guatemala': '🇬🇹', 'Belize': '🇧🇿',
  'Turquie': '🇹🇷', 'Inde': '🇮🇳', 'Corée du Sud': '🇰🇷', 'Égypte': '🇪🇬',
  'Porto Rico': '🇵🇷',
};

// ── Unified deal type ──
export interface DealItem {
  city: string;
  code: string;
  country: string;
  price: number;
  oldPrice: number;
  discount: number;
  dealLevel: string;
  airline: string;
  stops: number;
  image: string;
  category: 'canada' | 'monde' | 'tout-inclus';
  isLive: boolean;
  departureDate: string;
  returnDate: string;
  bookingLink: string;
  duration: number;
  scannedAt: string;
  medianPrice: number;
  avgPrice: number;
  historyCount: number;
  hotelPrice?: number;
  hotelTotal?: number;
  hotelName?: string;
  hotelStars?: number;
  hotelRating?: number;
  hotelImage?: string;
  hotelBookingUrl?: string;
  hotelNights?: number;
  totalPackPrice?: number;
  hotelPremiumOnly?: boolean;
}

export type FilterTab = 'tous' | 'favoris' | 'top' | 'canada' | 'monde' | 'tout-inclus';
export type SortMode = 'deal' | 'price' | 'discount';

export const FILTER_TABS: { id: FilterTab; label: string; icon: string }[] = [
  { id: 'tous', label: 'Tous', icon: '🌎' },
  { id: 'favoris', label: 'Favoris', icon: '❤️' },
  { id: 'top', label: 'Top deals', icon: '🔥' },
  { id: 'canada', label: 'Canada', icon: '🍁' },
  { id: 'monde', label: 'International', icon: '✈️' },
  { id: 'tout-inclus', label: 'Tout-inclus', icon: '🏖️' },
];

export const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'deal', label: 'Meilleurs deals' },
  { id: 'price', label: 'Prix le plus bas' },
  { id: 'discount', label: 'Plus gros rabais %' },
];

// ── Helpers ──

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
  } catch { return dateStr; }
}

export function formatDateRange(dep: string, ret: string): string {
  if (!dep) return '';
  const d = formatDateShort(dep);
  const r = ret ? formatDateShort(ret) : '';
  return r ? `${d} - ${r}` : d;
}

export function getTripNights(dep: string, ret: string): number {
  if (!dep || !ret) return 0;
  return Math.round((new Date(ret).getTime() - new Date(dep).getTime()) / 86400000);
}

export function formatScannedAgo(scannedAt: string): string {
  if (!scannedAt) return '';
  const mins = Math.round((Date.now() - new Date(scannedAt).getTime()) / 60000);
  if (mins < 1) return "scanne a l'instant";
  if (mins < 60) return `scanne il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `scanne il y a ${hours}h`;
  const days = Math.round(hours / 24);
  return `scanne il y a ${days}j`;
}

// ── Map raw price data to DealItem[] ──
export function mapPricesToDeals(prices: any[]): DealItem[] {
  const deals: DealItem[] = [];
  const seen = new Set<string>();

  for (const p of prices) {
    const city = p.destination;
    if (seen.has(city)) continue;
    seen.add(city);

    const code = p.destination_code || '';
    const isCanadian = CANADA_CODES.includes(code) || code === 'CA' || city === 'Canada';
    const isToutInclus = ALL_INCLUSIVE_CODES.includes(code);
    const discount = p.discount || 0;
    const medianP = p.medianPrice || 0;
    const avgP = p.avgPrice || 0;
    const refPrice = medianP > 0 ? medianP : avgP;

    deals.push({
      city,
      code,
      country: CITY_COUNTRY[city] || '',
      price: p.price,
      oldPrice: refPrice > p.price ? refPrice : 0,
      discount,
      dealLevel: p.dealLevel || 'normal',
      airline: p.airline || p.raw_data?.flights?.[0]?.airline || '',
      stops: p.stops ?? -1,
      image: CITY_IMAGES[city] || COUNTRY_IMAGES[city] || DEFAULT_CITY_IMAGE,
      category: isCanadian ? 'canada' : isToutInclus ? 'tout-inclus' : 'monde',
      isLive: true,
      departureDate: p.departure_date || '',
      returnDate: p.return_date || '',
      bookingLink: p.bookingLink || p.raw_data?.booking_link || '',
      duration: p.duration || p.raw_data?.duration_minutes || 0,
      scannedAt: p.scanned_at || p.scannedAt || '',
      medianPrice: medianP,
      avgPrice: avgP,
      historyCount: p.historyCount || 0,
      hotelPrice: p.hotelPrice,
      hotelTotal: p.hotelTotal,
      hotelName: p.hotelName,
      hotelStars: p.hotelStars,
      hotelRating: p.hotelRating,
      hotelImage: p.hotelImage,
      hotelBookingUrl: p.hotelBookingUrl,
      hotelNights: p.hotelNights,
      totalPackPrice: p.totalPackPrice,
      hotelPremiumOnly: p.hotelPremiumOnly || false,
    });
  }

  return deals;
}
