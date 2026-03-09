'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LandingHeader from '@/components/LandingHeader';
import DestinationPopup from '@/components/map/DestinationPopup';
import { useLivePrices } from '@/lib/hooks/useLivePrices';
import { CITY_IMAGES, COUNTRY_IMAGES, DEFAULT_CITY_IMAGE, DEAL_LEVELS, CANADA_CODES } from '@/lib/constants/deals';
import './landing.css';

// ── City → Country mapping ──
const CITY_COUNTRY: Record<string, string> = {
  'Paris': 'France', 'Barcelone': 'Espagne', 'Madrid': 'Espagne',
  'Lisbonne': 'Portugal', 'Porto': 'Portugal', 'Rome': 'Italie',
  'Athènes': 'Grèce', 'Londres': 'Royaume-Uni', 'Dublin': 'Irlande',
  'Amsterdam': 'Pays-Bas', 'Berlin': 'Allemagne',
  'Cancún': 'Mexique', 'Riviera Maya': 'Mexique',
  'Punta Cana': 'Rép. Dominicaine',
  'Cuba (Varadero)': 'Cuba', 'Varadero': 'Cuba', 'La Havane': 'Cuba',
  'Fort Lauderdale': 'États-Unis', 'Miami': 'États-Unis',
  'New York': 'États-Unis', 'Los Angeles': 'États-Unis',
  'Marrakech': 'Maroc', 'Bangkok': 'Thaïlande', 'Tokyo': 'Japon',
  'Bogota': 'Colombie', 'Cartagena': 'Colombie',
  'Lima': 'Pérou', 'São Paulo': 'Brésil', 'Buenos Aires': 'Argentine',
  'Bali': 'Indonésie', 'Ho Chi Minh': 'Vietnam',
  'Reykjavik': 'Islande', 'Montego Bay': 'Jamaïque',
  'San José': 'Costa Rica',
  'Toronto': 'Canada', 'Ottawa': 'Canada', 'Vancouver': 'Canada',
  'Calgary': 'Canada', 'Edmonton': 'Canada', 'Winnipeg': 'Canada',
  'Halifax': 'Canada', 'Québec': 'Canada',
};

// ── Static fallback deals (shown when DB has no data) ──
const STATIC_DEALS = [
  { city: 'Paris', code: 'CDG', price: 549, oldPrice: 820, airline: 'Air Transat', stops: 0, category: 'monde' as const, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=500&fit=crop' },
  { city: 'Lisbonne', code: 'LIS', price: 489, oldPrice: 780, airline: 'TAP Portugal', stops: 0, category: 'monde' as const, image: 'https://images.unsplash.com/photo-1570481662006-a3a1374699e8?w=800&h=500&fit=crop' },
  { city: 'Barcelone', code: 'BCN', price: 519, oldPrice: 750, airline: 'Air Canada', stops: 0, category: 'monde' as const, image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=500&fit=crop' },
  { city: 'Rome', code: 'FCO', price: 559, oldPrice: 820, airline: 'Air Transat', stops: 0, category: 'monde' as const, image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=500&fit=crop' },
  { city: 'Tokyo', code: 'NRT', price: 689, oldPrice: 1050, airline: 'ANA', stops: 1, category: 'monde' as const, image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=500&fit=crop' },
  { city: 'Reykjavik', code: 'KEF', price: 399, oldPrice: 620, airline: 'Icelandair', stops: 0, category: 'monde' as const, image: 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=800&h=500&fit=crop' },
  { city: 'Londres', code: 'LHR', price: 479, oldPrice: 710, airline: 'Air Canada', stops: 0, category: 'monde' as const, image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=500&fit=crop' },
  { city: 'Athènes', code: 'ATH', price: 599, oldPrice: 880, airline: 'Air Transat', stops: 0, category: 'monde' as const, image: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&h=500&fit=crop' },
  { city: 'Dublin', code: 'DUB', price: 429, oldPrice: 640, airline: 'Aer Lingus', stops: 0, category: 'monde' as const, image: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800&h=500&fit=crop' },
  { city: 'Marrakech', code: 'RAK', price: 649, oldPrice: 950, airline: 'Royal Air Maroc', stops: 1, category: 'monde' as const, image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800&h=500&fit=crop' },
  { city: 'Fort Lauderdale', code: 'FLL', price: 199, oldPrice: 340, airline: 'Spirit', stops: 0, category: 'monde' as const, image: 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=800&h=500&fit=crop' },
  { city: 'New York', code: 'JFK', price: 179, oldPrice: 310, airline: 'JetBlue', stops: 0, category: 'monde' as const, image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=500&fit=crop' },
  { city: 'Bogota', code: 'BOG', price: 449, oldPrice: 680, airline: 'Avianca', stops: 1, category: 'monde' as const, image: 'https://images.unsplash.com/photo-1568385247005-0d371d214a94?w=800&h=500&fit=crop' },
  { city: 'Vancouver', code: 'YVR', price: 289, oldPrice: 410, airline: 'WestJet', stops: 0, category: 'canada' as const, image: 'https://images.unsplash.com/photo-1609825488888-3a766db05542?w=800&h=500&fit=crop' },
  { city: 'Calgary', code: 'YYC', price: 249, oldPrice: 380, airline: 'WestJet', stops: 0, category: 'canada' as const, image: 'https://images.unsplash.com/photo-1561489413-985b06da5bee?w=800&h=500&fit=crop' },
  { city: 'Halifax', code: 'YHZ', price: 199, oldPrice: 310, airline: 'Air Canada', stops: 0, category: 'canada' as const, image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&h=500&fit=crop' },
  { city: 'Toronto', code: 'YYZ', price: 129, oldPrice: 220, airline: 'Porter', stops: 0, category: 'canada' as const, image: 'https://images.unsplash.com/photo-1517090504332-af2bd570e1cb?w=800&h=500&fit=crop' },
  { city: 'Punta Cana', code: 'PUJ', price: 649, oldPrice: 1050, airline: 'Air Transat', stops: 0, category: 'tout-inclus' as const, image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&h=500&fit=crop' },
  { city: 'Cancún', code: 'CUN', price: 599, oldPrice: 920, airline: 'Sunwing', stops: 0, category: 'tout-inclus' as const, image: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800&h=500&fit=crop' },
  { city: 'Varadero', code: 'VRA', price: 549, oldPrice: 880, airline: 'Air Transat', stops: 0, category: 'tout-inclus' as const, image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=500&fit=crop' },
  { city: 'Montego Bay', code: 'MBJ', price: 579, oldPrice: 890, airline: 'WestJet', stops: 0, category: 'tout-inclus' as const, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop' },
  { city: 'San José', code: 'SJO', price: 449, oldPrice: 700, airline: 'Air Canada', stops: 1, category: 'tout-inclus' as const, image: 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=800&h=500&fit=crop' },
];

// ── Unified deal type ──
interface DealItem {
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
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
  } catch { return dateStr; }
}

function formatDateRange(dep: string, ret: string): string {
  if (!dep) return '';
  const d = formatDateShort(dep);
  const r = ret ? formatDateShort(ret) : '';
  return r ? `${d} - ${r}` : d;
}

type FilterTab = 'tous' | 'favoris' | 'top' | 'canada' | 'monde' | 'tout-inclus';
type SortMode = 'deal' | 'price' | 'discount';

const FILTER_TABS: { id: FilterTab; label: string; icon: string }[] = [
  { id: 'tous', label: 'Tous', icon: '🌎' },
  { id: 'favoris', label: 'Favoris', icon: '❤️' },
  { id: 'top', label: 'Top deals', icon: '🔥' },
  { id: 'canada', label: 'Canada', icon: '🍁' },
  { id: 'monde', label: 'International', icon: '✈️' },
  { id: 'tout-inclus', label: 'Tout-inclus', icon: '🏖️' },
];

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'deal', label: 'Meilleurs deals' },
  { id: 'price', label: 'Prix le plus bas' },
  { id: 'discount', label: 'Plus gros rabais %' },
];

const RANK_COLORS = ['#F59E0B', '#94A3B8', '#D97706'];

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14m-6-6l6 6-6 6" />
  </svg>
);

// Helper: map raw price data (from SSR or API) to DealItem[]
function mapPricesToDeals(prices: any[]): DealItem[] {
  const deals: DealItem[] = [];
  const seen = new Set<string>();
  const ALL_INCLUSIVE_CODES = ['CUN', 'PUJ', 'VRA', 'HAV', 'MBJ', 'SJO'];

  for (const p of prices) {
    const city = p.destination;
    if (seen.has(city)) continue;
    seen.add(city);

    const code = p.destination_code || '';
    const isCanadian = CANADA_CODES.includes(code) || code === 'CA' || city === 'Canada';
    const isToutInclus = ALL_INCLUSIVE_CODES.includes(code);
    const discount = p.discount || 0;
    const avgPrice = p.avgPrice || 0;

    deals.push({
      city,
      code,
      country: CITY_COUNTRY[city] || '',
      price: p.price,
      oldPrice: avgPrice > p.price ? avgPrice : 0,
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
    });
  }

  return deals;
}

const EMPTY_DEALS: any[] = [];

interface ClientHomeProps {
  initialDeals?: any[];
}

export default function ClientHome({ initialDeals }: ClientHomeProps) {
  const stableInitial = initialDeals && initialDeals.length > 0 ? initialDeals : EMPTY_DEALS;
  const [activeFilter, setActiveFilter] = useState<FilterTab>('tous');
  const [sortMode, setSortMode] = useState<SortMode>('deal');
  const [searchQuery, setSearchQuery] = useState('');
  const [stickyFilters, setStickyFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9);
  const [maxBudget, setMaxBudget] = useState(0);
  const [shareToast, setShareToast] = useState('');
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Favorites (localStorage) — using Record instead of Set to avoid useMemo issues
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const stored = localStorage.getItem('geai_favorites');
      if (stored) {
        const arr: string[] = JSON.parse(stored);
        const obj: Record<string, boolean> = {};
        for (const c of arr) obj[c] = true;
        setFavorites(obj);
      }
      if (localStorage.getItem('geai_alerts') === 'true') setAlertsEnabled(true);
    } catch {}
  }, []);

  const favCount = useMemo(() => Object.keys(favorites).length, [favorites]);

  const toggleFavorite = useCallback((city: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = { ...prev };
      if (next[city]) delete next[city];
      else next[city] = true;
      localStorage.setItem('geai_favorites', JSON.stringify(Object.keys(next)));
      return next;
    });
  }, []);

  const enableAlerts = useCallback(async () => {
    if (!('Notification' in window)) {
      setShareToast('Notifications non supportees par ce navigateur');
      setTimeout(() => setShareToast(''), 3000);
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setAlertsEnabled(true);
      localStorage.setItem('geai_alerts', 'true');
      new Notification('GeaiMonVol', {
        body: 'Tu recevras les alertes de baisses de prix!',
        icon: '/logo_geai.png',
      });
    }
  }, []);

  const shareDeal = useCallback((deal: DealItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Vol Montreal → ${deal.city} a ${Math.round(deal.price)}$ A/R${deal.discount > 0 ? ` (-${deal.discount}%)` : ''}`;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `Deal GeaiMonVol - ${deal.city}`, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
        setShareToast('Lien copie!');
        setTimeout(() => setShareToast(''), 2000);
      }).catch(() => {});
    }
  }, []);

  // SSR deals mapped once — shown INSTANTLY on page load
  const ssrDeals = useMemo(() => mapPricesToDeals(stableInitial), [stableInitial]);

  // Live prices from Skyscanner scans (refreshes in background)
  const { prices: livePrices, isLive, lastUpdated } = useLivePrices();

  // Destination popup state
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupDeal, setPopupDeal] = useState<DealItem | null>(null);

  const openDealPopup = useCallback((deal: DealItem) => {
    setPopupDeal(deal);
    setPopupOpen(true);
  }, []);

  // Sticky filters on scroll
  useEffect(() => {
    const el = filtersRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyFilters(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-60px 0px 0px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── Deals: live → SSR → static fallback (never empty) ──
  const allDeals: DealItem[] = useMemo(() => {
    if (isLive && livePrices && livePrices.length > 0) {
      return mapPricesToDeals(livePrices);
    }
    if (ssrDeals.length > 0) return ssrDeals;

    // Fallback: static deals so the site is never empty
    return STATIC_DEALS.map(d => ({
      city: d.city,
      code: d.code,
      country: CITY_COUNTRY[d.city] || '',
      price: d.price,
      oldPrice: d.oldPrice,
      discount: Math.round(((d.oldPrice - d.price) / d.oldPrice) * 100),
      dealLevel: Math.round(((d.oldPrice - d.price) / d.oldPrice) * 100) >= 35 ? 'great' : 'good',
      airline: d.airline,
      stops: d.stops,
      image: d.image,
      category: d.category,
      isLive: false,
      departureDate: '',
      returnDate: '',
      bookingLink: `https://www.skyscanner.ca/transport/flights/yul/${d.code.toLowerCase()}/`,
      duration: 0,
    }));
  }, [livePrices, isLive, ssrDeals]);

  // ── Filter + Search ──
  const filteredDeals = useMemo(() => {
    let result = [...allDeals];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d =>
        d.city.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q)
      );
    }

    // Budget filter
    if (maxBudget > 0) {
      result = result.filter(d => d.price <= maxBudget);
    }

    // Category filter
    if (activeFilter === 'favoris') {
      result = result.filter(d => favorites[d.city]);
    } else if (activeFilter === 'top') {
      result = result.filter(d => ['lowest_ever', 'incredible', 'great', 'good'].includes(d.dealLevel));
    } else if (activeFilter !== 'tous') {
      result = result.filter(d => d.category === activeFilter);
    }

    // Sort
    const levelOrder: Record<string, number> = {
      lowest_ever: 0, incredible: 1, great: 2, good: 3, slight: 4, normal: 5,
    };

    if (sortMode === 'deal') {
      result.sort((a, b) => {
        const ld = (levelOrder[a.dealLevel] ?? 5) - (levelOrder[b.dealLevel] ?? 5);
        if (ld !== 0) return ld;
        return b.discount - a.discount;
      });
    } else if (sortMode === 'price') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortMode === 'discount') {
      result.sort((a, b) => b.discount - a.discount);
    }

    return result;
  }, [allDeals, activeFilter, sortMode, searchQuery, maxBudget, favorites]);

  // Reset visible count when filters change
  useEffect(() => { setVisibleCount(9); }, [activeFilter, searchQuery, sortMode, maxBudget]);

  const featured = filteredDeals[0];
  const rest = filteredDeals.slice(1);
  const visibleRest = rest.slice(0, visibleCount);
  const hasMore = rest.length > visibleCount;
  const remainingCount = rest.length - visibleCount;

  // Time ago string
  const timeAgo = useMemo(() => {
    if (!lastUpdated) return null;
    const mins = Math.round((Date.now() - new Date(lastUpdated).getTime()) / 60000);
    if (mins < 1) return 'à l\'instant';
    if (mins < 60) return `il y a ${mins} min`;
    return `il y a ${Math.round(mins / 60)}h`;
  }, [lastUpdated]);

  return (
    <div className="lp">
      <style>{`
        @keyframes dealPulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes dealGlow{0%,100%{box-shadow:0 0 20px rgba(14,165,233,0.15)}50%{box-shadow:0 0 40px rgba(14,165,233,0.3)}}
        @keyframes dealFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes dealFadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes rankShine{0%{left:-100%}100%{left:200%}}
      `}</style>

      {/* ─── HEADER ─── */}
      <LandingHeader />

      {/* ─── HERO (OCEAN) ─── */}
      <section className="lp-hero">
        <div className="lp-ocean">
          <div className="lp-ocean-gradient" />
        </div>
        <div className="lp-hero-content">
          <div className="lp-hero-text">
            <div className="lp-hero-badge">
              <span className="lp-hero-badge-dot" />
              Scanning en direct
            </div>
            <h1>
              Voyage moins cher,<br />
              <span>voyage plus souvent.</span>
            </h1>
            <p className="lp-hero-sub">
              On detecte les baisses de prix sur les vols au depart de Montreal
              et notre IA te cree un itineraire complet en quelques secondes.
            </p>
            <div className="lp-hero-actions">
              <a href="#deals" className="lp-btn-ocean">
                <span className="lp-btn-ocean-glow" />
                Voir les deals
                <ArrowIcon />
              </a>
              <a href="#how" className="lp-btn-glass">
                Comment ca marche
              </a>
            </div>
            <div className="lp-hero-proof">
              <div className="lp-hero-proof-item">
                <span className="lp-hero-proof-icon">📡</span>
                <div>
                  <strong>40+</strong>
                  <span>destinations scannees</span>
                </div>
              </div>
              <div className="lp-hero-proof-sep" />
              <div className="lp-hero-proof-item">
                <span className="lp-hero-proof-icon">💰</span>
                <div>
                  <strong>-35%</strong>
                  <span>en moyenne</span>
                </div>
              </div>
              <div className="lp-hero-proof-sep" />
              <div className="lp-hero-proof-item">
                <span className="lp-hero-proof-icon">⚡</span>
                <div>
                  <strong>24h</strong>
                  <span>mise a jour</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lp-hero-visual">
            {(() => {
              // Pick top 3 deals with highest discount for hero cards
              const heroDeals = allDeals
                .filter(d => d.discount >= 20 && d.image)
                .sort((a, b) => b.discount - a.discount)
                .slice(0, 3);
              // Fallback if no live data yet
              const cards = heroDeals.length >= 3 ? heroDeals : [
                { city: 'Lisbonne', code: 'LIS', price: 529, oldPrice: 780, discount: 32, image: 'https://images.unsplash.com/photo-1570481662006-a3a1374699e8?w=400&h=200&fit=crop' },
                { city: 'Tokyo', code: 'TYO', price: 689, oldPrice: 1050, discount: 34, image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=200&fit=crop' },
                { city: 'Punta Cana', code: 'PUJ', price: 899, oldPrice: 1350, discount: 33, image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=400&h=200&fit=crop' },
              ];
              const floatClasses = ['lp-hero-card-float-1', 'lp-hero-card-float-2', 'lp-hero-card-float-3'];
              const icons = ['🔥', '✈️', '🏖️'];
              return cards.map((c, i) => (
                <div key={i} className={`lp-hero-card ${floatClasses[i]}`}>
                  <div className="lp-hero-card-img">
                    <Image src={c.image} alt={`Deal vol ${c.city}`} fill sizes="(max-width: 768px) 160px, 220px" priority={i === 0} style={{ objectFit: 'cover' }} />
                    <span className="lp-hero-card-badge">{icons[i]} -{c.discount}%</span>
                  </div>
                  <div className="lp-hero-card-body">
                    <div className="lp-hero-card-route"><strong>YUL</strong> &rarr; <strong>{c.code}</strong></div>
                    <div className="lp-hero-card-city">{c.city}</div>
                    <div className="lp-hero-card-price">
                      {c.oldPrice > c.price && <span className="old">{Math.round(c.oldPrice)} $</span>}
                      <span className="current">{Math.round(c.price)} $</span>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
        <div className="lp-wave-divider">
          <svg viewBox="0 0 1440 140" preserveAspectRatio="none">
            <path d="M0,50 C240,110 480,10 720,60 C960,110 1200,20 1440,70 L1440,140 L0,140 Z" fill="white" opacity="0.3" />
            <path d="M0,70 C300,30 600,100 900,50 C1100,20 1300,80 1440,55 L1440,140 L0,140 Z" fill="white" opacity="0.5" />
            <path d="M0,90 C200,70 500,110 800,80 C1100,50 1300,100 1440,85 L1440,140 L0,140 Z" fill="#F8FAFC" />
          </svg>
        </div>
      </section>

      {/* ─── TICKER BAR ─── */}
      {(() => {
        // Use live deals for ticker when available, otherwise static
        const tickerDeals = allDeals.length >= 6
          ? allDeals.filter(d => d.discount >= 15).slice(0, 12).map(d => ({
              city: d.city, code: d.code, price: d.price, oldPrice: d.oldPrice,
              discount: d.discount, image: d.image, category: d.category,
              country: d.country, dealLevel: d.dealLevel, airline: d.airline,
              stops: d.stops, isLive: d.isLive, departureDate: d.departureDate,
              returnDate: d.returnDate, bookingLink: d.bookingLink, duration: d.duration,
            }))
          : STATIC_DEALS.map(d => ({
              city: d.city, code: d.code, price: d.price,
              oldPrice: d.oldPrice, discount: Math.round(((d.oldPrice - d.price) / d.oldPrice) * 100),
              image: d.image, category: d.category as 'canada' | 'monde' | 'tout-inclus',
              country: CITY_COUNTRY[d.city] || '', dealLevel: 'normal', airline: '',
              stops: -1, isLive: false, departureDate: '', returnDate: '', bookingLink: '', duration: 0,
            }));
        const half = Math.ceil(tickerDeals.length / 2);
        const row1 = tickerDeals.slice(0, half);
        const row2 = tickerDeals.slice(half);
        return (
          <section className="lp-ticker">
            <div className="lp-ticker-row">
              <div className="lp-ticker-track lp-ticker-left">
                {[...Array(2)].map((_, i) => (
                  <div className="lp-ticker-list" key={i} aria-hidden={i === 1}>
                    {row1.map((d) => (
                      <button type="button" onClick={() => openDealPopup(d)} className="lp-ticker-card" key={`${i}-${d.code}`}>
                        <span className="lp-ticker-emoji">{d.discount >= 35 ? '🔥' : d.discount >= 25 ? '✨' : '✈️'}</span>
                        <span className="lp-ticker-city">{d.city}</span>
                        <span className="lp-ticker-arrow">✈</span>
                        {d.oldPrice > d.price && <span className="lp-ticker-old">{Math.round(d.oldPrice)}$</span>}
                        <span className="lp-ticker-price">{Math.round(d.price)}$</span>
                        <span className="lp-ticker-pct">-{d.discount}%</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-ticker-row">
              <div className="lp-ticker-track lp-ticker-right">
                {[...Array(2)].map((_, i) => (
                  <div className="lp-ticker-list" key={i} aria-hidden={i === 1}>
                    {row2.map((d) => (
                      <button type="button" onClick={() => openDealPopup(d)} className="lp-ticker-card" key={`${i}-${d.code}`}>
                        <span className="lp-ticker-emoji">{d.discount >= 35 ? '🔥' : d.discount >= 25 ? '✨' : '✈️'}</span>
                        <span className="lp-ticker-city">{d.city}</span>
                        <span className="lp-ticker-arrow">✈</span>
                        {d.oldPrice > d.price && <span className="lp-ticker-old">{Math.round(d.oldPrice)}$</span>}
                        <span className="lp-ticker-price">{Math.round(d.price)}$</span>
                        <span className="lp-ticker-pct">-{d.discount}%</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ══════════════════════════════════════════════════════
          ─── DEALS — LA SECTION PRINCIPALE ───
          ══════════════════════════════════════════════════════ */}
      <section className="lp-deals" id="deals" style={{ background: '#F8FAFC', padding: '80px 24px 96px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* ── Header ── */}
          <div ref={filtersRef} style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 100,
              background: allDeals.length > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(14,165,233,0.08)',
              marginBottom: 16,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13, fontWeight: 600,
              color: allDeals.length > 0 ? '#059669' : '#0284C7',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: allDeals.length > 0 ? '#10B981' : '#0EA5E9',
                animation: 'dealPulse 2s ease-in-out infinite',
                boxShadow: allDeals.length > 0 ? '0 0 8px rgba(16,185,129,0.5)' : '0 0 8px rgba(14,165,233,0.5)',
              }} />
              {allDeals.length > 0 ? `En direct${timeAgo ? ` · ${timeAgo}` : ''}` : 'Deals du moment'}
            </div>
            <h2 style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 700, color: '#0F172A',
              margin: '0 0 8px', lineHeight: 1.15,
            }}>
              Les meilleurs deals depuis Montreal
            </h2>
            <p style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 16, color: '#64748B', margin: '0 0 16px',
            }}>
              {allDeals.length} destination{allDeals.length > 1 ? 's' : ''} scannee{allDeals.length > 1 ? 's' : ''} · Prix via Skyscanner
            </p>
            <button
              onClick={enableAlerts}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 100,
                border: alertsEnabled ? '2px solid #10B981' : '2px solid #E2E8F0',
                background: alertsEnabled ? 'rgba(16,185,129,0.06)' : 'white',
                color: alertsEnabled ? '#059669' : '#334155',
                fontSize: 13, fontWeight: 600,
                fontFamily: "'Outfit', sans-serif",
                cursor: alertsEnabled ? 'default' : 'pointer',
                transition: 'all 0.3s',
              }}
            >
              <span style={{ fontSize: 16 }}>{alertsEnabled ? '🔔' : '🔕'}</span>
              {alertsEnabled ? 'Alertes activees' : 'Activer les alertes prix'}
              {alertsEnabled && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </button>
          </div>

          {/* ── Search + Filter + Sort — unified bar ── */}
          <div style={{
            position: stickyFilters ? 'sticky' : 'relative',
            top: stickyFilters ? 0 : 'auto',
            zIndex: stickyFilters ? 50 : 'auto',
            background: stickyFilters ? 'rgba(248,250,252,0.95)' : 'transparent',
            backdropFilter: stickyFilters ? 'blur(12px)' : 'none',
            WebkitBackdropFilter: stickyFilters ? 'blur(12px)' : 'none',
            padding: stickyFilters ? '12px 0' : '0',
            marginBottom: 28,
            transition: 'padding 0.3s, background 0.3s',
            borderBottom: stickyFilters ? '1px solid #E2E8F0' : 'none',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            }}>
              {/* Search input */}
              <div style={{
                position: 'relative', flex: '1 1 200px', minWidth: 180, maxWidth: 280,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Chercher une destination..."
                  style={{
                    width: '100%', padding: '10px 14px 10px 38px',
                    borderRadius: 14, border: '1.5px solid #E2E8F0',
                    background: 'white', color: '#0F172A',
                    fontSize: 13, fontWeight: 500,
                    fontFamily: "'Outfit', sans-serif",
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#0EA5E9';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      width: 20, height: 20, borderRadius: '50%', border: 'none',
                      background: '#E2E8F0', color: '#64748B', fontSize: 11,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    &times;
                  </button>
                )}
              </div>

              {/* Category pills */}
              <div style={{
                display: 'flex', gap: 4,
                background: 'white', padding: 4, borderRadius: 100,
                border: '1px solid #E2E8F0',
                overflowX: 'auto', flex: '1 1 auto',
              }}>
                {FILTER_TABS.map(tab => {
                  const isActive = activeFilter === tab.id;
                  const count = tab.id === 'tous' ? allDeals.length
                    : tab.id === 'favoris' ? favCount
                    : tab.id === 'top' ? allDeals.filter(d => ['lowest_ever', 'incredible', 'great', 'good'].includes(d.dealLevel)).length
                    : allDeals.filter(d => d.category === tab.id).length;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id)}
                      style={{
                        padding: '8px 14px', borderRadius: 100, border: 'none',
                        background: isActive ? '#0EA5E9' : 'transparent',
                        color: isActive ? '#fff' : '#334155',
                        fontSize: 12.5, fontWeight: 600,
                        fontFamily: "'Outfit', sans-serif",
                        cursor: 'pointer', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: 5,
                        whiteSpace: 'nowrap',
                        boxShadow: isActive ? '0 2px 8px rgba(14,165,233,0.25)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: 13 }}>{tab.icon}</span>
                      {tab.label}
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: '1px 6px', borderRadius: 100,
                        background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(14,165,233,0.06)',
                        color: isActive ? '#fff' : '#94A3B8',
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sort */}
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                style={{
                  padding: '9px 30px 9px 12px', borderRadius: 12,
                  border: '1px solid #E2E8F0', background: 'white', color: '#0F172A',
                  fontSize: 12.5, fontWeight: 600,
                  fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
                  flexShrink: 0,
                }}
              >
                {SORT_OPTIONS.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>

              {/* Budget max input */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 0,
                border: maxBudget > 0 ? '1.5px solid #0EA5E9' : '1px solid #E2E8F0',
                borderRadius: 12, overflow: 'hidden',
                background: 'white', flexShrink: 0,
                transition: 'border-color 0.2s',
              }}>
                <span style={{
                  padding: '8px 8px 8px 10px', fontSize: 12, color: '#94A3B8',
                  fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                  whiteSpace: 'nowrap', background: maxBudget > 0 ? 'rgba(14,165,233,0.04)' : 'transparent',
                }}>
                  Max
                </span>
                <input
                  type="number"
                  value={maxBudget > 0 ? maxBudget : ''}
                  onChange={(e) => setMaxBudget(parseInt(e.target.value) || 0)}
                  placeholder="--"
                  style={{
                    width: 56, padding: '8px 4px', border: 'none',
                    fontSize: 14, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                    color: '#0F172A', textAlign: 'center', outline: 'none',
                    background: 'transparent',
                  }}
                />
                <span style={{
                  padding: '8px 10px 8px 0', fontSize: 13, color: '#94A3B8',
                  fontFamily: "'Fredoka', sans-serif", fontWeight: 600,
                }}>$</span>
                {maxBudget > 0 && (
                  <button
                    onClick={() => setMaxBudget(0)}
                    style={{
                      border: 'none', background: 'none', color: '#94A3B8',
                      cursor: 'pointer', padding: '0 8px 0 0', fontSize: 14,
                      display: 'flex', alignItems: 'center',
                    }}
                  >&times;</button>
                )}
              </div>
            </div>

            {/* Active filters summary */}
            {(searchQuery || activeFilter !== 'tous' || maxBudget > 0) && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
                fontFamily: "'Outfit', sans-serif", fontSize: 12, color: '#64748B',
              }}>
                <span>{filteredDeals.length} resultat{filteredDeals.length !== 1 ? 's' : ''}</span>
                {searchQuery && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 10px', borderRadius: 8,
                    background: 'rgba(14,165,233,0.08)', color: '#0284C7', fontWeight: 600,
                  }}>
                    &ldquo;{searchQuery}&rdquo;
                    <button onClick={() => setSearchQuery('')} style={{
                      border: 'none', background: 'none', color: '#0284C7',
                      cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1,
                    }}>&times;</button>
                  </span>
                )}
                {activeFilter !== 'tous' && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 10px', borderRadius: 8,
                    background: 'rgba(14,165,233,0.08)', color: '#0284C7', fontWeight: 600,
                  }}>
                    {FILTER_TABS.find(t => t.id === activeFilter)?.icon} {FILTER_TABS.find(t => t.id === activeFilter)?.label}
                    <button onClick={() => setActiveFilter('tous')} style={{
                      border: 'none', background: 'none', color: '#0284C7',
                      cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1,
                    }}>&times;</button>
                  </span>
                )}
                {maxBudget > 0 && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 10px', borderRadius: 8,
                    background: 'rgba(14,165,233,0.08)', color: '#0284C7', fontWeight: 600,
                  }}>
                    Max {maxBudget} $
                    <button onClick={() => setMaxBudget(0)} style={{
                      border: 'none', background: 'none', color: '#0284C7',
                      cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1,
                    }}>&times;</button>
                  </span>
                )}
                <button onClick={() => { setSearchQuery(''); setActiveFilter('tous'); setMaxBudget(0); }} style={{
                  border: 'none', background: 'none', color: '#94A3B8',
                  cursor: 'pointer', fontSize: 11, fontWeight: 600, textDecoration: 'underline',
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  Reinitialiser
                </button>
              </div>
            )}
          </div>

          {/* ── SKELETON LOADING ── */}
          {allDeals.length === 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} style={{
                  background: 'white', borderRadius: 20, overflow: 'hidden',
                  border: '1px solid #E2E8F0',
                }}>
                  <div style={{
                    height: 180,
                    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'dealPulse 2s ease-in-out infinite',
                  }} />
                  <div style={{ padding: '18px 22px 22px' }}>
                    <div style={{ height: 14, width: '40%', borderRadius: 6, background: '#E2E8F0', marginBottom: 10 }} />
                    <div style={{ height: 22, width: '60%', borderRadius: 6, background: '#E2E8F0', marginBottom: 8 }} />
                    <div style={{ height: 12, width: '80%', borderRadius: 6, background: '#F1F5F9', marginBottom: 14 }} />
                    <div style={{ height: 32, width: '45%', borderRadius: 6, background: '#E0F2FE' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── FEATURED DEAL #1 ── */}
          {featured && (
            <div
              onClick={() => openDealPopup(featured)}
              className="deal-featured"
              style={{
                position: 'relative',
                borderRadius: 24, overflow: 'hidden',
                background: 'white',
                border: '1.5px solid rgba(14,165,233,0.15)',
                marginBottom: 28,
                cursor: 'pointer',
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(14,165,233,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              {/* Image — full width on mobile, side on desktop */}
              <div style={{ position: 'relative', height: 220 }}>
                <Image src={featured.image} alt={featured.city} fill sizes="100vw" style={{ objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }} />

                {/* Badges on image */}
                <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
                  <div style={{
                    padding: '5px 14px', borderRadius: 100,
                    background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                    color: '#fff', fontSize: 12, fontWeight: 800,
                    fontFamily: "'Fredoka', sans-serif",
                    boxShadow: '0 2px 12px rgba(245,158,11,0.4)',
                  }}>#1 Deal</div>
                  {DEAL_LEVELS[featured.dealLevel] && (
                    <div style={{
                      padding: '5px 14px', borderRadius: 100,
                      background: DEAL_LEVELS[featured.dealLevel].bg,
                      color: '#fff', fontSize: 12, fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      {DEAL_LEVELS[featured.dealLevel].icon} {DEAL_LEVELS[featured.dealLevel].label}
                    </div>
                  )}
                </div>

                {/* Price overlay on image */}
                <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>YUL</span>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>✈</span>
                      <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{featured.code}</span>
                    </div>
                    <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.1, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{featured.city}</h3>
                    {featured.country && <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontFamily: "'Outfit', sans-serif" }}>{featured.country}</span>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {featured.oldPrice > featured.price && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'line-through', fontFamily: "'Outfit', sans-serif" }}>{Math.round(featured.oldPrice)} $</div>}
                    <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: '#fff', lineHeight: 1, textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>{Math.round(featured.price)} $</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif" }}>aller-retour</div>
                  </div>
                </div>

                {featured.discount > 0 && (
                  <div style={{ position: 'absolute', top: 16, right: 16, padding: '5px 12px', borderRadius: 100, background: '#10B981', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", boxShadow: '0 2px 10px rgba(16,185,129,0.4)' }}>-{featured.discount}%</div>
                )}
              </div>

              {/* Info bar below image */}
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {featured.departureDate && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', padding: '4px 12px', borderRadius: 8, background: '#E0F2FE', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                      {formatDateRange(featured.departureDate, featured.returnDate)}
                    </span>
                  )}
                  {featured.airline && <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', padding: '4px 12px', borderRadius: 8, background: '#F1F5F9', fontFamily: "'Outfit', sans-serif" }}>{featured.airline}</span>}
                  {featured.stops >= 0 && <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 8, background: featured.stops === 0 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: featured.stops === 0 ? '#059669' : '#D97706', fontFamily: "'Outfit', sans-serif" }}>{featured.stops === 0 ? 'Direct' : `${featured.stops} escale${featured.stops > 1 ? 's' : ''}`}</span>}
                  {/* Favorite */}
                  <button onClick={(e) => toggleFavorite(featured.city, e)} style={{
                    width: 34, height: 34, borderRadius: '50%', border: 'none',
                    background: favorites[featured.city] ? 'rgba(239,68,68,0.08)' : '#F1F5F9',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', fontSize: 16,
                  }}>
                    {favorites[featured.city] ? '❤️' : '🤍'}
                  </button>
                  {/* Share */}
                  <button onClick={(e) => shareDeal(featured, e)} style={{
                    width: 34, height: 34, borderRadius: '50%', border: 'none',
                    background: '#F1F5F9', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  </button>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 14, background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: "'Outfit', sans-serif", boxShadow: '0 4px 16px rgba(14,165,233,0.25)' }}>
                  Voir les dates et prix
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-6-6l6 6-6 6" /></svg>
                </div>
              </div>
            </div>
          )}

          {/* ── DEALS GRID ── */}
          {rest.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}>
              {visibleRest.map((deal, idx) => {
                const rank = idx + 2; // #1 is featured
                const rankColor = rank <= 3 ? RANK_COLORS[rank - 1] : undefined;
                const level = DEAL_LEVELS[deal.dealLevel];

                return (
                  <div
                    key={`${deal.code}-${deal.city}`}
                    onClick={() => openDealPopup(deal)}
                    style={{
                      background: 'white',
                      borderRadius: 20,
                      overflow: 'hidden',
                      border: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                      animation: `dealFadeIn 0.5s ease-out ${Math.min(idx * 0.06, 0.6)}s both`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = '0 16px 48px rgba(15,23,42,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Image */}
                    <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                      <Image
                        src={deal.image}
                        alt={deal.city}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        style={{ objectFit: 'cover', transition: 'transform 0.5s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      />

                      {/* Rank badge */}
                      <div style={{
                        position: 'absolute', top: 12, left: 12,
                        width: 32, height: 32, borderRadius: '50%',
                        background: rankColor
                          ? `linear-gradient(135deg, ${rankColor}, ${rankColor}CC)`
                          : 'rgba(0,0,0,0.4)',
                        backdropFilter: rankColor ? 'none' : 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: rankColor ? `0 2px 8px ${rankColor}66` : 'none',
                      }}>
                        <span style={{
                          fontFamily: "'Fredoka', sans-serif",
                          fontSize: 12, fontWeight: 700, color: '#fff',
                        }}>#{rank}</span>
                      </div>

                      {/* Deal badge */}
                      {level && (
                        <div style={{
                          position: 'absolute', top: 12, right: 12,
                          padding: '4px 10px', borderRadius: 100,
                          background: level.bg, color: '#fff',
                          fontSize: 10, fontWeight: 700,
                          fontFamily: "'Outfit', sans-serif",
                          display: 'flex', alignItems: 'center', gap: 3,
                          boxShadow: `0 2px 8px ${level.bg}66`,
                        }}>
                          {level.icon} {level.label}
                        </div>
                      )}

                      {/* Discount */}
                      {deal.discount > 0 && (
                        <div style={{
                          position: 'absolute', bottom: 12, right: 12,
                          padding: '3px 10px', borderRadius: 100,
                          background: '#10B981', color: '#fff',
                          fontSize: 12, fontWeight: 700,
                          fontFamily: "'Fredoka', sans-serif",
                        }}>
                          -{deal.discount}%
                        </div>
                      )}

                      {/* Favorite + Share */}
                      <div style={{
                        position: 'absolute', bottom: 12, left: 12,
                        display: 'flex', gap: 6,
                      }}>
                        <button
                          onClick={(e) => toggleFavorite(deal.city, e)}
                          style={{
                            width: 32, height: 32, borderRadius: '50%', border: 'none',
                            background: favorites[deal.city] ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.35)',
                            backdropFilter: 'blur(8px)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s', fontSize: 14,
                            color: '#fff',
                          }}
                        >
                          {favorites[deal.city] ? '❤️' : '🤍'}
                        </button>
                        <button
                          onClick={(e) => shareDeal(deal, e)}
                          style={{
                            width: 32, height: 32, borderRadius: '50%', border: 'none',
                            background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                        </button>
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '16px 20px 18px' }}>
                      {/* City + Country */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <h3 style={{
                          fontFamily: "'Fredoka', sans-serif",
                          fontSize: 20, fontWeight: 700, color: '#0F172A',
                          margin: 0, lineHeight: 1.2,
                        }}>{deal.city}</h3>
                        <span style={{
                          fontFamily: "'Fredoka', sans-serif",
                          fontSize: 11, fontWeight: 700, color: '#0EA5E9',
                          background: 'rgba(14,165,233,0.06)', padding: '2px 8px', borderRadius: 6,
                        }}>YUL → {deal.code}</span>
                      </div>

                      {/* Country + stops */}
                      <span style={{
                        fontSize: 12, color: '#94A3B8', display: 'block',
                        fontFamily: "'Outfit', sans-serif", marginBottom: 10,
                      }}>
                        {deal.country}
                        {deal.airline ? ` · ${deal.airline}` : ''}
                        {deal.stops >= 0 ? ` · ${deal.stops === 0 ? 'Direct' : `${deal.stops} esc.`}` : ''}
                      </span>

                      {/* Date badge */}
                      {deal.departureDate && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '3px 10px', borderRadius: 8,
                          background: '#E0F2FE',
                          fontSize: 11, fontWeight: 600, color: '#0284C7',
                          fontFamily: "'Outfit', sans-serif", marginBottom: 10,
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                          {formatDateRange(deal.departureDate, deal.returnDate)}
                        </div>
                      )}

                      {/* Price + CTA row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          {deal.oldPrice > deal.price && (
                            <span style={{ fontSize: 13, color: '#94A3B8', textDecoration: 'line-through' }}>{Math.round(deal.oldPrice)} $</span>
                          )}
                          <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 700, color: '#0EA5E9' }}>{Math.round(deal.price)} $</span>
                          <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>A/R</span>
                        </div>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '8px 16px', borderRadius: 12,
                          background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                          color: '#fff', fontSize: 12, fontWeight: 700,
                          fontFamily: "'Outfit', sans-serif",
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap',
                        }}>
                          Voir les dates
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-6-6l6 6-6 6" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── VOIR PLUS BUTTON ── */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button
                onClick={() => setVisibleCount(prev => prev + 9)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '14px 36px', borderRadius: 100,
                  border: '2px solid #E2E8F0',
                  background: 'white', color: '#0F172A',
                  fontSize: 15, fontWeight: 700,
                  fontFamily: "'Outfit', sans-serif",
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0EA5E9';
                  e.currentTarget.style.color = '#0EA5E9';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(14,165,233,0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.color = '#0F172A';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                Voir plus de deals
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 100,
                  background: 'rgba(14,165,233,0.08)', color: '#0EA5E9',
                }}>
                  +{remainingCount}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          )}

          {/* Empty state — no live data yet */}
          {allDeals.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '64px 24px',
              color: '#94A3B8', fontFamily: "'Outfit', sans-serif",
              background: 'white', borderRadius: 24,
              border: '1px solid #E2E8F0',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📡</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                Scan en cours...
              </div>
              <div style={{ fontSize: 15, color: '#64748B', maxWidth: 420, margin: '0 auto 24px' }}>
                Les prix sont scannes quotidiennement sur Skyscanner.
                Les deals apparaitront ici automatiquement apres le premier scan.
              </div>
              <Link href="/explore" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 14,
                background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                color: '#fff', fontSize: 14, fontWeight: 700,
                fontFamily: "'Outfit', sans-serif",
                textDecoration: 'none',
              }}>
                Explorer le globe en attendant
                <ArrowIcon />
              </Link>
            </div>
          )}

          {/* Empty state — filter has no results */}
          {allDeals.length > 0 && filteredDeals.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              color: '#94A3B8', fontFamily: "'Outfit', sans-serif",
              background: 'white', borderRadius: 20, border: '1px solid #E2E8F0',
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>&#9992;</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Aucun deal ne correspond
              </div>
              <div style={{ fontSize: 13, marginBottom: 16 }}>
                {searchQuery ? `Aucun resultat pour "${searchQuery}"` : 'Essaie une autre categorie'}
              </div>
              <button
                onClick={() => { setSearchQuery(''); setActiveFilter('tous'); setMaxBudget(0); }}
                style={{
                  padding: '10px 24px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                }}
              >
                Voir tous les deals
              </button>
            </div>
          )}

          {/* Globe CTA */}
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link href="/explore" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 100,
              border: '2px solid #E2E8F0',
              background: 'white', color: '#334155',
              fontSize: 15, fontWeight: 600,
              fontFamily: "'Outfit', sans-serif",
              textDecoration: 'none',
              transition: 'all 0.25s',
            }}>
              Explorer sur le globe 3D
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="lp-how" id="how">
        <div className="lp-how-header">
          <span className="lp-section-label">Simple comme bonjour</span>
          <h2 className="lp-section-title">Comment ca marche</h2>
        </div>
        <div className="lp-steps">
          <div className="lp-step">
            <div className="lp-step-icon lp-step-icon-1"><span>📡</span></div>
            <div className="lp-step-content">
              <div className="lp-step-num">01</div>
              <h3 className="lp-step-title">On scanne les prix pour toi</h3>
              <p className="lp-step-desc">Chaque jour, on compare les prix des vols depuis Montreal sur Skyscanner. Tu vois les vrais deals, pas des faux rabais.</p>
            </div>
          </div>
          <div className="lp-step-arrow">
            <svg viewBox="0 0 80 24" fill="none">
              <path d="M0,12 L60,12" stroke="#BAE6FD" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M55,6 L67,12 L55,18" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div className="lp-step">
            <div className="lp-step-icon lp-step-icon-2"><span>🎯</span></div>
            <div className="lp-step-content">
              <div className="lp-step-num">02</div>
              <h3 className="lp-step-title">Choisis ta destination</h3>
              <p className="lp-step-desc">Clique sur un deal pour voir toutes les dates disponibles avec le prix exact. Tu es redirige sur Skyscanner pour reserver.</p>
            </div>
          </div>
          <div className="lp-step-arrow">
            <svg viewBox="0 0 80 24" fill="none">
              <path d="M0,12 L60,12" stroke="#BAE6FD" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M55,6 L67,12 L55,18" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div className="lp-step">
            <div className="lp-step-icon lp-step-icon-3"><span>🗺️</span></div>
            <div className="lp-step-content">
              <div className="lp-step-num">03</div>
              <h3 className="lp-step-title">L&apos;IA planifie ton trip</h3>
              <p className="lp-step-desc">Notre IA te genere un itineraire complet : activites, restos, budget jour par jour. Tout ce que t&apos;as besoin.</p>
              <span className="lp-step-premium">Premium</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AI GUIDE FEATURE ─── */}
      <section className="lp-feature" id="guide">
        <div className="lp-feature-text">
          <span className="lp-section-label">Intelligence artificielle</span>
          <h2 className="lp-section-title">Ton guide de voyage, genere par IA</h2>
          <p className="lp-section-sub" style={{ marginBottom: 0 }}>
            Dis-nous ta destination, ton budget et tes preferences.
            On te genere un itineraire complet en quelques secondes.
          </p>
          <ul className="lp-feature-list">
            <li><span className="lp-feature-check"><CheckIcon /></span><span>Planning jour par jour adapte a ta duree de sejour</span></li>
            <li><span className="lp-feature-check"><CheckIcon /></span><span>Suggestions de restos, activites et spots photo</span></li>
            <li><span className="lp-feature-check"><CheckIcon /></span><span>Budget estime detaille pour tout le voyage</span></li>
            <li><span className="lp-feature-check"><CheckIcon /></span><span>Assistant en temps reel pendant ton voyage</span></li>
          </ul>
          <Link href="/explore" className="lp-btn-primary">
            Essayer le guide IA
            <ArrowIcon />
          </Link>
        </div>
        <div className="lp-feature-visual">
          <div className="lp-feature-visual-glow" />
          <div className="lp-mockup-msg user">
            <span className="label">Toi</span>
            Je pars 5 jours a Lisbonne avec 1 500 $ de budget. J&apos;aime la bouffe locale et les quartiers historiques.
          </div>
          <div className="lp-mockup-msg ai">
            <span className="label">GeaiMonVol IA</span>
            Voici ton itineraire pour Lisbonne! Jour 1 : Quartier de l&apos;Alfama, degustation de pasteis de nata chez Manteigaria, coucher de soleil au Miradouro da Graca...
          </div>
          <div className="lp-mockup-msg ai" style={{ opacity: 0.6, maxWidth: '70%' }}>
            <span className="label">Budget estime</span>
            Vols: 529$ · Hebergement: 420$ · Nourriture: 280$ · Activites: 180$
          </div>
        </div>
      </section>

      {/* Wave into dark globe section */}
      <div className="lp-wave-divider-dark">
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path d="M0,40 C360,90 720,10 1080,60 C1260,85 1380,40 1440,50 L1440,100 L0,100 Z" fill="#020810" opacity="0.4" />
          <path d="M0,55 C240,25 600,80 960,35 C1200,5 1380,65 1440,45 L1440,100 L0,100 Z" fill="#020810" />
        </svg>
      </div>

      {/* ─── GLOBE SECTION ─── */}
      <section className="lp-globe-section">
        <div className="lp-globe-inner">
          <span className="lp-section-label">Globe interactif</span>
          <h2 className="lp-section-title">Visualise les deals sur le globe 3D</h2>
          <p className="lp-section-sub">
            Explore les destinations en temps reel sur notre carte interactive.
            Chaque point represente un deal actif au depart de Montreal.
          </p>
          <div className="lp-globe-preview">
            <div className="lp-globe-dots">
              <div className="lp-globe-dot" style={{ width: 6, height: 6, top: '28%', left: '55%', animationDelay: '0s' }} />
              <div className="lp-globe-dot" style={{ width: 5, height: 5, top: '35%', left: '48%', animationDelay: '0.5s' }} />
              <div className="lp-globe-dot" style={{ width: 7, height: 7, top: '42%', left: '60%', animationDelay: '1s' }} />
              <div className="lp-globe-dot" style={{ width: 5, height: 5, top: '22%', left: '42%', animationDelay: '1.5s' }} />
              <div className="lp-globe-dot" style={{ width: 6, height: 6, top: '50%', left: '35%', animationDelay: '2s' }} />
              <div className="lp-globe-dot" style={{ width: 8, height: 8, top: '38%', left: '68%', animationDelay: '0.8s' }} />
              <div className="lp-globe-dot" style={{ width: 5, height: 5, top: '55%', left: '52%', animationDelay: '2.5s' }} />
              <div className="lp-globe-dot" style={{ width: 6, height: 6, top: '30%', left: '72%', animationDelay: '1.2s' }} />
            </div>
          </div>
          <div style={{ marginTop: 48 }}>
            <Link href="/explore" className="lp-btn-light">
              Explorer le globe
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="lp-final-cta">
        <div className="lp-final-inner">
          <span className="lp-section-label">Pret a partir?</span>
          <h2 className="lp-section-title">Trouve ton prochain vol maintenant</h2>
          <p className="lp-section-sub">
            Les prix changent chaque jour. Decouvre les deals en direct et planifie
            ton voyage avec notre guide IA.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#deals" className="lp-btn-primary">
              Voir les deals
              <ArrowIcon />
            </a>
            <Link href="/auth" className="lp-btn-secondary">
              Creer un compte
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div>
              <div className="lp-footer-brand">
                <Image src="/logo_geai.png" alt="" width={28} height={28} />
                <span>GeaiMonVol</span>
              </div>
              <p className="lp-footer-brand-desc">
                Les meilleurs deals de vols au depart de Montreal.
                Scanne automatique, alertes personnalisees et guide de voyage IA.
              </p>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Produit</div>
              <Link href="/explore">Globe interactif</Link>
              <a href="#deals">Deals en direct</a>
              <a href="#guide">Guide IA</a>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Destinations</div>
              <a href="#deals">Canada</a>
              <a href="#deals">International</a>
              <a href="#deals">Tout-inclus</a>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Compte</div>
              <Link href="/auth">Connexion</Link>
              <Link href="/auth">Inscription</Link>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span className="lp-footer-copy">&copy; 2026 GeaiMonVol. Montreal, QC.</span>
            <span className="lp-footer-made">Fait avec ❤️ au Quebec</span>
          </div>
        </div>
      </footer>

      {/* Share toast */}
      {shareToast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, padding: '12px 28px', borderRadius: 100,
          background: '#0F172A', color: '#fff', fontSize: 14, fontWeight: 600,
          fontFamily: "'Outfit', sans-serif",
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          animation: 'dealFadeIn 0.3s ease-out',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
          {shareToast}
        </div>
      )}

      {/* Destination popup */}
      <DestinationPopup
        isOpen={popupOpen}
        onClose={() => setPopupOpen(false)}
        destination={popupDeal?.city || ''}
        destinationCode={popupDeal?.code || ''}
        bestPrice={popupDeal?.price}
        discount={popupDeal?.discount}
        dealLevel={popupDeal?.dealLevel}
      />
    </div>
  );
}
