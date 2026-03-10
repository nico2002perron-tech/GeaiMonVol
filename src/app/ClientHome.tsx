'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import LandingHeader from '@/components/LandingHeader';

const LandingGlobe = dynamic(() => import('@/components/map/CartoonGlobe'), {
  ssr: false,
  loading: () => (
    <div className="lp-globe-loading">
      <div className="lp-globe-loading-sphere" />
    </div>
  ),
});
import DestinationPopup from '@/components/map/DestinationPopup';
import { useLivePrices } from '@/lib/hooks/useLivePrices';
import { CITY_IMAGES, COUNTRY_IMAGES, DEFAULT_CITY_IMAGE, DEAL_LEVELS, CANADA_CODES } from '@/lib/constants/deals';
import { AIRLINE_BAGGAGE } from '@/lib/constants/airlines';
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

// ── Country flag emojis ──
const COUNTRY_FLAGS: Record<string, string> = {
  'France': '🇫🇷', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'Italie': '🇮🇹',
  'Grèce': '🇬🇷', 'Royaume-Uni': '🇬🇧', 'Irlande': '🇮🇪', 'Pays-Bas': '🇳🇱',
  'Allemagne': '🇩🇪', 'Mexique': '🇲🇽', 'Rép. Dominicaine': '🇩🇴',
  'Cuba': '🇨🇺', 'États-Unis': '🇺🇸', 'Maroc': '🇲🇦', 'Thaïlande': '🇹🇭',
  'Japon': '🇯🇵', 'Colombie': '🇨🇴', 'Pérou': '🇵🇪', 'Brésil': '🇧🇷',
  'Argentine': '🇦🇷', 'Indonésie': '🇮🇩', 'Vietnam': '🇻🇳', 'Islande': '🇮🇸',
  'Jamaïque': '🇯🇲', 'Costa Rica': '🇨🇷', 'Canada': '🇨🇦',
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
  scannedAt: string;
  medianPrice: number;
  avgPrice: number;
  historyCount: number;
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

function getTripNights(dep: string, ret: string): number {
  if (!dep || !ret) return 0;
  return Math.round((new Date(ret).getTime() - new Date(dep).getTime()) / 86400000);
}

function formatScannedAgo(scannedAt: string): string {
  if (!scannedAt) return '';
  const mins = Math.round((Date.now() - new Date(scannedAt).getTime()) / 60000);
  if (mins < 1) return 'scanne a l\'instant';
  if (mins < 60) return `scanne il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `scanne il y a ${hours}h`;
  const days = Math.round(hours / 24);
  return `scanne il y a ${days}j`;
}

function getViewerCount(city: string, discount: number): number {
  // Deterministic pseudo-random based on city name
  let hash = 0;
  for (let i = 0; i < city.length; i++) hash = ((hash << 5) - hash) + city.charCodeAt(i);
  const base = Math.abs(hash % 20) + 5; // 5-24
  const bonus = discount >= 40 ? 15 : discount >= 25 ? 8 : 0;
  return base + bonus;
}

// ── Animated Stats Counter ──
function AnimatedStats() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [counts, setCounts] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const targets = [40, 35, 24, 90];
    const duration = 2000;
    const start = Date.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    const frame = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = ease(progress);
      setCounts(targets.map(t => Math.round(t * eased)));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [visible]);

  const stats = [
    { value: `${counts[0]}+`, label: 'Destinations scannees', icon: '🌍' },
    { value: `-${counts[1]}%`, label: 'Rabais moyen detecte', icon: '📉' },
    { value: `${counts[2]}h`, label: 'Mise a jour des prix', icon: '⏱️' },
    { value: `${counts[3]}j`, label: 'D\'historique de prix', icon: '📊' },
  ];

  return (
    <section ref={ref} style={{
      padding: '80px 32px',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 500, height: 500,
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        maxWidth: 900, margin: '0 auto', position: 'relative',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 32, textAlign: 'center',
      }}>
        {stats.map((stat, i) => (
          <div key={i} style={{
            padding: '20px 0',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.15}s`,
          }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{stat.icon}</div>
            <div style={{
              fontSize: 42, fontWeight: 700, color: '#fff',
              fontFamily: "'Fredoka', sans-serif",
              lineHeight: 1,
              background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(255,255,255,0.55)',
              fontFamily: "'Outfit', sans-serif",
              marginTop: 10, letterSpacing: 0.3,
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
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
const BUDGET_PRESETS = [500, 750, 1000, 1500];

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
    const medianP = p.medianPrice || 0;
    const avgP = p.avgPrice || 0;
    const refPrice = medianP > 0 ? medianP : avgP; // prefer median

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const filtersRef = useRef<HTMLDivElement>(null);
  const heroVisualRef = useRef<HTMLDivElement>(null);

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

  // Scroll-triggered reveal animations
  useEffect(() => {
    const reveals = document.querySelectorAll('.lp-reveal, .lp-reveal-left, .lp-reveal-right');
    if (!reveals.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    reveals.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Hero parallax on scroll (respects prefers-reduced-motion)
  useEffect(() => {
    const el = heroVisualRef.current;
    if (!el) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          if (scrollY < 900) {
            el.style.transform = `translateY(${scrollY * 0.15}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
      scannedAt: '',
      medianPrice: d.oldPrice,
      avgPrice: d.oldPrice,
      historyCount: 0,
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
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes dealGlow{0%,100%{box-shadow:0 0 20px rgba(14,165,233,0.15)}50%{box-shadow:0 0 40px rgba(14,165,233,0.3)}}
        @keyframes dealFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes dealFadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes rankShine{0%{left:-100%}100%{left:200%}}
        @keyframes topDealGlow{0%,100%{box-shadow:0 0 15px var(--glow-color,rgba(124,58,237,0.15)),0 4px 20px rgba(0,0,0,0.06)}50%{box-shadow:0 0 30px var(--glow-color,rgba(124,58,237,0.3)),0 8px 32px rgba(0,0,0,0.08)}}
        @keyframes topBannerShine{0%{background-position:200% center}100%{background-position:-200% center}}
      `}</style>

      {/* ─── HEADER ─── */}
      <LandingHeader />

      {/* ─── HERO (OCEAN) ─── */}
      <section className="lp-hero">
        <div className="lp-ocean">
          <div className="lp-ocean-gradient" />
          <div className="lp-ocean-aurora" />
          {/* Floating particles */}
          <div className="lp-ocean-particles">
            {Array.from({ length: 18 }, (_, i) => {
              const size = 3 + (i % 5) * 2;
              const left = 5 + (i * 37 + 13) % 90;
              const duration = 10 + (i % 7) * 3;
              const delay = (i * 1.7) % 12;
              const colors = ['rgba(14,165,233,0.15)', 'rgba(6,182,212,0.12)', 'rgba(99,102,241,0.1)', 'rgba(16,185,129,0.1)'];
              return (
                <div
                  key={i}
                  className="lp-particle"
                  style={{
                    width: size,
                    height: size,
                    left: `${left}%`,
                    background: colors[i % 4],
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                    boxShadow: `0 0 ${size * 2}px ${colors[i % 4]}`,
                  }}
                />
              );
            })}
          </div>
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
              et GeaiAI te cree un itineraire complet en quelques secondes.
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

          <div className="lp-hero-visual" ref={heroVisualRef}>
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
              scannedAt: d.scannedAt, medianPrice: d.medianPrice, avgPrice: d.avgPrice,
              historyCount: d.historyCount,
            }))
          : STATIC_DEALS.map(d => ({
              city: d.city, code: d.code, price: d.price,
              oldPrice: d.oldPrice, discount: Math.round(((d.oldPrice - d.price) / d.oldPrice) * 100),
              image: d.image, category: d.category as 'canada' | 'monde' | 'tout-inclus',
              country: CITY_COUNTRY[d.city] || '', dealLevel: 'normal', airline: '',
              stops: -1, isLive: false, departureDate: '', returnDate: '', bookingLink: '', duration: 0,
              scannedAt: '', medianPrice: d.oldPrice, avgPrice: d.oldPrice, historyCount: 0,
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
                        {COUNTRY_FLAGS[d.country] && <span className="lp-ticker-flag">{COUNTRY_FLAGS[d.country]}</span>}
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
                        {COUNTRY_FLAGS[d.country] && <span className="lp-ticker-flag">{COUNTRY_FLAGS[d.country]}</span>}
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
            top: stickyFilters ? 76 : 'auto',
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
                  aria-label="Chercher une destination"
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
                    aria-label="Effacer la recherche"
                    style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      width: 24, height: 24, borderRadius: '50%', border: 'none',
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
                aria-label="Trier les deals"
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

              {/* View toggle */}
              <div style={{
                display: 'flex', border: '1px solid #E2E8F0', borderRadius: 10,
                overflow: 'hidden', flexShrink: 0,
              }}>
                <button onClick={() => setViewMode('grid')} style={{
                  padding: '10px 12px', border: 'none', cursor: 'pointer',
                  background: viewMode === 'grid' ? '#0EA5E9' : 'white',
                  color: viewMode === 'grid' ? '#fff' : '#94A3B8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', minWidth: 44, minHeight: 44,
                }} title="Grille" aria-label="Affichage en grille" aria-pressed={viewMode === 'grid'}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                </button>
                <button onClick={() => setViewMode('list')} style={{
                  padding: '10px 12px', border: 'none', borderLeft: '1px solid #E2E8F0', cursor: 'pointer',
                  background: viewMode === 'list' ? '#0EA5E9' : 'white',
                  color: viewMode === 'list' ? '#fff' : '#94A3B8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', minWidth: 44, minHeight: 44,
                }} title="Liste" aria-label="Affichage en liste" aria-pressed={viewMode === 'list'}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </button>
              </div>

              {/* Budget presets + custom */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, flexWrap: 'wrap' }}>
                {BUDGET_PRESETS.map(amount => {
                  const isActive = maxBudget === amount;
                  return (
                    <button
                      key={amount}
                      onClick={() => setMaxBudget(isActive ? 0 : amount)}
                      style={{
                        padding: '7px 12px', borderRadius: 10,
                        border: isActive ? '1.5px solid #0EA5E9' : '1px solid #E2E8F0',
                        background: isActive ? 'rgba(14,165,233,0.08)' : 'white',
                        color: isActive ? '#0EA5E9' : '#334155',
                        fontSize: 12, fontWeight: 700,
                        fontFamily: "'Fredoka', sans-serif",
                        cursor: 'pointer', transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      &lt; {amount}$
                    </button>
                  );
                })}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 0,
                  border: maxBudget > 0 && !BUDGET_PRESETS.includes(maxBudget) ? '1.5px solid #0EA5E9' : '1px solid #E2E8F0',
                  borderRadius: 12, overflow: 'hidden',
                  background: 'white', flexShrink: 0,
                  transition: 'border-color 0.2s',
                }}>
                  <span style={{
                    padding: '7px 6px 7px 10px', fontSize: 11, color: '#94A3B8',
                    fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}>
                    Max
                  </span>
                  <input
                    type="number"
                    value={maxBudget > 0 && !BUDGET_PRESETS.includes(maxBudget) ? maxBudget : ''}
                    onChange={(e) => setMaxBudget(parseInt(e.target.value) || 0)}
                    placeholder="--"
                    aria-label="Budget maximum personnalise"
                    style={{
                      width: 50, padding: '7px 2px', border: 'none',
                      fontSize: 13, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                      color: '#0F172A', textAlign: 'center', outline: 'none',
                      background: 'transparent',
                    }}
                  />
                  <span style={{
                    padding: '7px 8px 7px 0', fontSize: 12, color: '#94A3B8',
                    fontFamily: "'Fredoka', sans-serif", fontWeight: 600,
                  }}>$</span>
                </div>
                {maxBudget > 0 && (
                  <button
                    onClick={() => setMaxBudget(0)}
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      border: 'none', background: '#E2E8F0', color: '#64748B',
                      fontSize: 12, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%)',
                    backgroundSize: '400% 100%',
                    animation: 'shimmer 1.8s ease-in-out infinite',
                  }} />
                  <div style={{ padding: '18px 22px 22px' }}>
                    <div style={{ height: 14, width: '40%', borderRadius: 6, background: 'linear-gradient(90deg, #E2E8F0 25%, #d5dce6 37%, #E2E8F0 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.8s ease-in-out infinite', animationDelay: '0.15s', marginBottom: 10 }} />
                    <div style={{ height: 22, width: '60%', borderRadius: 6, background: 'linear-gradient(90deg, #E2E8F0 25%, #d5dce6 37%, #E2E8F0 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.8s ease-in-out infinite', animationDelay: '0.3s', marginBottom: 8 }} />
                    <div style={{ height: 12, width: '80%', borderRadius: 6, background: 'linear-gradient(90deg, #F1F5F9 25%, #e2e8f0 37%, #F1F5F9 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.8s ease-in-out infinite', animationDelay: '0.45s', marginBottom: 14 }} />
                    <div style={{ height: 32, width: '45%', borderRadius: 6, background: 'linear-gradient(90deg, #E0F2FE 25%, #bae6fd 37%, #E0F2FE 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.8s ease-in-out infinite', animationDelay: '0.6s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── FEATURED DEAL #1 ── */}
          {featured && (() => {
            const featTopColor = featured.dealLevel === 'lowest_ever' ? '#7C3AED'
              : featured.dealLevel === 'incredible' ? '#DC2626'
              : featured.dealLevel === 'great' ? '#EA580C' : '#0EA5E9';
            const featLevel = DEAL_LEVELS[featured.dealLevel];
            const featIsTop = ['lowest_ever', 'incredible', 'great'].includes(featured.dealLevel);
            return (
            <div
              onClick={() => openDealPopup(featured)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDealPopup(featured); } }}
              role="button"
              tabIndex={0}
              aria-label={`Deal #1 : ${featured.city} a ${Math.round(featured.price)}$${featured.discount > 0 ? `, -${featured.discount}%` : ''}`}
              className="deal-featured"
              style={{
                position: 'relative',
                borderRadius: 24, overflow: 'hidden',
                background: 'white',
                border: featIsTop ? `2px solid ${featTopColor}50` : '1.5px solid rgba(14,165,233,0.15)',
                marginBottom: 28,
                cursor: 'pointer',
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                animation: featIsTop ? 'topDealGlow 3s ease-in-out 0.3s infinite' : undefined,
                ...(featIsTop ? { ['--glow-color' as any]: `${featTopColor}25` } : {}),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 20px 60px ${featTopColor}18`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              {/* ── TOP DEAL BANNER — Featured ── */}
              {featIsTop && featLevel && (
                <div style={{
                  background: `linear-gradient(135deg, ${featTopColor}, ${featTopColor}CC)`,
                  padding: '8px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 800, color: '#fff',
                    fontFamily: "'Fredoka', sans-serif",
                    letterSpacing: 0.5,
                  }}>
                    {featLevel.icon} {featLevel.label}
                  </span>
                  <span style={{
                    fontSize: 14, fontWeight: 800, color: '#fff',
                    fontFamily: "'Fredoka', sans-serif",
                    background: 'rgba(255,255,255,0.2)',
                    padding: '3px 14px', borderRadius: 100,
                  }}>
                    Economise {featured.discount}%
                  </span>
                </div>
              )}

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
                  {featured.stops === 0 && (
                    <div style={{
                      padding: '5px 14px', borderRadius: 100,
                      background: '#10B981', color: '#fff',
                      fontSize: 12, fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                      display: 'flex', alignItems: 'center', gap: 4,
                      boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                    }}>
                      ✈ Direct
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
                    {featured.scannedAt && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", marginTop: 2, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                        {formatScannedAgo(featured.scannedAt)}
                      </div>
                    )}
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
                      {(() => {
                        const nights = getTripNights(featured.departureDate, featured.returnDate);
                        return nights > 0 ? (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#6366F1', fontFamily: "'Fredoka', sans-serif" }}>
                            {nights} nuits
                          </span>
                        ) : null;
                      })()}
                    </span>
                  )}
                  {featured.airline && <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', padding: '4px 12px', borderRadius: 8, background: '#F1F5F9', fontFamily: "'Outfit', sans-serif" }}>{featured.airline}</span>}
                  {featured.stops > 0 && <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', color: '#D97706', fontFamily: "'Outfit', sans-serif" }}>{`${featured.stops} escale${featured.stops > 1 ? 's' : ''}`}</span>}
                  {/* Baggage */}
                  {featured.airline && AIRLINE_BAGGAGE[featured.airline] && (
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 8,
                      fontFamily: "'Outfit', sans-serif",
                      background: AIRLINE_BAGGAGE[featured.airline].checked
                        ? 'rgba(16,185,129,0.08)' : AIRLINE_BAGGAGE[featured.airline].cabin
                          ? 'rgba(14,165,233,0.08)' : 'rgba(239,68,68,0.08)',
                      color: AIRLINE_BAGGAGE[featured.airline].checked
                        ? '#059669' : AIRLINE_BAGGAGE[featured.airline].cabin
                          ? '#0284C7' : '#DC2626',
                    }}>
                      {AIRLINE_BAGGAGE[featured.airline].checked ? '🧳 Bagage inclus' : AIRLINE_BAGGAGE[featured.airline].cabin ? '🎒 Cabine seul.' : '⚠️ Pas de bagage'}
                    </span>
                  )}
                  {/* Favorite */}
                  <button onClick={(e) => toggleFavorite(featured.city, e)} aria-label={favorites[featured.city] ? `Retirer ${featured.city} des favoris` : `Ajouter ${featured.city} aux favoris`} style={{
                    width: 44, height: 44, borderRadius: '50%', border: 'none',
                    background: favorites[featured.city] ? 'rgba(239,68,68,0.08)' : '#F1F5F9',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', fontSize: 16,
                  }}>
                    {favorites[featured.city] ? '❤️' : '🤍'}
                  </button>
                  {/* Share */}
                  <button onClick={(e) => shareDeal(featured, e)} aria-label={`Partager le deal pour ${featured.city}`} style={{
                    width: 44, height: 44, borderRadius: '50%', border: 'none',
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
          ); })()}

          {/* ── DEALS GRID / LIST ── */}
          {rest.length > 0 && viewMode === 'grid' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
            }}>
              {visibleRest.map((deal, idx) => {
                const rank = idx + 2;
                const rankColor = rank <= 3 ? RANK_COLORS[rank - 1] : undefined;
                const level = DEAL_LEVELS[deal.dealLevel];
                const viewers = getViewerCount(deal.city, deal.discount);
                const isTopDeal = ['lowest_ever', 'incredible', 'great'].includes(deal.dealLevel);
                const topColor = deal.dealLevel === 'lowest_ever' ? '#7C3AED'
                  : deal.dealLevel === 'incredible' ? '#DC2626'
                  : deal.dealLevel === 'great' ? '#EA580C' : null;
                const isAnimatedGlow = ['lowest_ever', 'incredible'].includes(deal.dealLevel);

                return (
                  <React.Fragment key={`${deal.code}-${deal.city}`}>
                    {/* CTA Alerts card at position 4 */}
                    {idx === 3 && !alertsEnabled && (
                      <div
                        style={{
                          background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                          borderRadius: 20, overflow: 'hidden',
                          border: '1px solid rgba(14,165,233,0.2)',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          padding: '36px 28px', textAlign: 'center',
                          animation: `dealFadeIn 0.5s ease-out 0.24s both`,
                        }}
                      >
                        <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
                        <h3 style={{
                          fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 700,
                          color: '#fff', margin: '0 0 8px', lineHeight: 1.2,
                        }}>Ne rate aucun deal</h3>
                        <p style={{
                          fontFamily: "'Outfit', sans-serif", fontSize: 13, color: '#94A3B8',
                          margin: '0 0 20px', lineHeight: 1.5,
                        }}>
                          Recois une alerte quand un prix chute sur tes destinations preferees.
                        </p>
                        <button
                          onClick={enableAlerts}
                          style={{
                            padding: '10px 24px', borderRadius: 100, border: 'none',
                            background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                            color: '#fff', fontSize: 13, fontWeight: 700,
                            fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                            boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
                            transition: 'all 0.2s',
                          }}
                        >
                          Activer les alertes
                        </button>
                      </div>
                    )}
                    <div
                      onClick={() => openDealPopup(deal)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDealPopup(deal); } }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Deal ${deal.city} a ${Math.round(deal.price)}$${deal.discount > 0 ? `, -${deal.discount}%` : ''}`}
                      style={{
                        background: 'white',
                        borderRadius: 20,
                        overflow: 'hidden',
                        border: isTopDeal && topColor
                          ? `2px solid ${topColor}40`
                          : '1px solid #E2E8F0',
                        cursor: 'pointer',
                        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                        animation: isAnimatedGlow
                          ? `dealFadeIn 0.5s ease-out ${Math.min(idx * 0.06, 0.6)}s both, topDealGlow 3s ease-in-out ${Math.min(idx * 0.06, 0.6) + 0.5}s infinite`
                          : `dealFadeIn 0.5s ease-out ${Math.min(idx * 0.06, 0.6)}s both`,
                        ...(isAnimatedGlow && topColor ? { ['--glow-color' as any]: `${topColor}25` } : {}),
                        boxShadow: isTopDeal && topColor && !isAnimatedGlow
                          ? `0 0 16px ${topColor}12, 0 4px 20px rgba(0,0,0,0.06)`
                          : undefined,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-6px)';
                        e.currentTarget.style.boxShadow = isTopDeal && topColor
                          ? `0 16px 48px ${topColor}20, 0 8px 32px rgba(15,23,42,0.08)`
                          : '0 16px 48px rgba(15,23,42,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = isTopDeal && !isAnimatedGlow && topColor
                          ? `0 0 16px ${topColor}12, 0 4px 20px rgba(0,0,0,0.06)` : '';
                      }}
                    >
                      {/* ── TOP DEAL BANNER ── */}
                      {isTopDeal && level && topColor && (
                        <div style={{
                          background: `linear-gradient(135deg, ${topColor}, ${topColor}CC)`,
                          backgroundSize: '400% 100%',
                          padding: '7px 16px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                          <span style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            fontSize: 11, fontWeight: 800, color: '#fff',
                            fontFamily: "'Fredoka', sans-serif",
                            letterSpacing: 0.5,
                          }}>
                            {level.icon} {level.label}
                          </span>
                          <span style={{
                            fontSize: 12, fontWeight: 800, color: '#fff',
                            fontFamily: "'Fredoka', sans-serif",
                            background: 'rgba(255,255,255,0.2)',
                            padding: '2px 10px', borderRadius: 100,
                          }}>
                            -{deal.discount}%
                          </span>
                        </div>
                      )}

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

                        {/* Direct flight badge */}
                        {deal.stops === 0 && (
                          <div style={{
                            position: 'absolute', top: level ? 40 : 12, right: 12,
                            padding: '3px 10px', borderRadius: 100,
                            background: '#10B981', color: '#fff',
                            fontSize: 10, fontWeight: 700,
                            fontFamily: "'Outfit', sans-serif",
                            display: 'flex', alignItems: 'center', gap: 3,
                            boxShadow: '0 2px 8px rgba(16,185,129,0.4)',
                          }}>
                            ✈ Direct
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
                            aria-label={favorites[deal.city] ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                            style={{
                              width: 44, height: 44, borderRadius: '50%', border: 'none',
                              background: favorites[deal.city] ? 'rgba(239,68,68,0.9)' : 'rgba(0,0,0,0.35)',
                              backdropFilter: 'blur(8px)',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s', fontSize: 16,
                              color: '#fff',
                            }}
                          >
                            {favorites[deal.city] ? '❤️' : '🤍'}
                          </button>
                          <button
                            onClick={(e) => shareDeal(deal, e)}
                            aria-label="Partager ce deal"
                            style={{
                              width: 44, height: 44, borderRadius: '50%', border: 'none',
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

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{
                            fontSize: 12, color: '#94A3B8',
                            fontFamily: "'Outfit', sans-serif",
                          }}>
                            {deal.country}
                            {deal.airline ? ` · ${deal.airline}` : ''}
                            {deal.stops > 0 ? ` · ${deal.stops} esc.` : ''}
                          </span>
                          {deal.isLive && viewers > 10 && (
                            <span style={{
                              fontSize: 10, color: '#F59E0B', fontWeight: 600,
                              fontFamily: "'Outfit', sans-serif",
                              display: 'flex', alignItems: 'center', gap: 3,
                            }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              {viewers} regardent
                            </span>
                          )}
                        </div>
                        {/* Baggage info */}
                        {deal.airline && AIRLINE_BAGGAGE[deal.airline] && (
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '2px 8px', borderRadius: 6, marginBottom: 6,
                            fontSize: 10, fontWeight: 600,
                            fontFamily: "'Outfit', sans-serif",
                            background: AIRLINE_BAGGAGE[deal.airline].checked
                              ? 'rgba(16,185,129,0.08)' : AIRLINE_BAGGAGE[deal.airline].cabin
                                ? 'rgba(14,165,233,0.08)' : 'rgba(239,68,68,0.08)',
                            color: AIRLINE_BAGGAGE[deal.airline].checked
                              ? '#059669' : AIRLINE_BAGGAGE[deal.airline].cabin
                                ? '#0284C7' : '#DC2626',
                          }}>
                            {AIRLINE_BAGGAGE[deal.airline].checked ? '🧳 Bagage inclus' : AIRLINE_BAGGAGE[deal.airline].cabin ? '🎒 Cabine seulement' : '⚠️ Aucun bagage inclus'}
                          </div>
                        )}

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
                            {(() => {
                              const nights = getTripNights(deal.departureDate, deal.returnDate);
                              return nights > 0 ? (
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: 'rgba(99,102,241,0.08)', color: '#6366F1', fontFamily: "'Fredoka', sans-serif" }}>
                                  {nights} nuits
                                </span>
                              ) : null;
                            })()}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                              {deal.oldPrice > deal.price && (
                                <span style={{ fontSize: 13, color: '#94A3B8', textDecoration: 'line-through' }}>{Math.round(deal.oldPrice)} $</span>
                              )}
                              <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 700, color: '#0EA5E9' }}>{Math.round(deal.price)} $</span>
                              <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>A/R</span>
                            </div>
                            {deal.scannedAt && (
                              <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'Outfit', sans-serif", marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                {formatScannedAgo(deal.scannedAt)}
                              </div>
                            )}
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
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* ── DEALS LIST VIEW ── */}
          {rest.length > 0 && viewMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visibleRest.map((deal, idx) => {
                const rank = idx + 2;
                const level = DEAL_LEVELS[deal.dealLevel];
                const nights = getTripNights(deal.departureDate, deal.returnDate);
                const viewers = getViewerCount(deal.city, deal.discount);
                const listTopColor = deal.dealLevel === 'lowest_ever' ? '#7C3AED'
                  : deal.dealLevel === 'incredible' ? '#DC2626'
                  : deal.dealLevel === 'great' ? '#EA580C' : null;
                const isListTop = !!listTopColor;

                return (
                  <div
                    key={`list-${deal.code}-${deal.city}`}
                    onClick={() => openDealPopup(deal)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDealPopup(deal); } }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Deal ${deal.city} a ${Math.round(deal.price)}$`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: isListTop ? `linear-gradient(90deg, ${listTopColor}06, white 20%)` : 'white',
                      borderRadius: 14,
                      border: isListTop ? `1.5px solid ${listTopColor}30` : '1px solid #E2E8F0',
                      borderLeft: isListTop ? `4px solid ${listTopColor}` : undefined,
                      padding: '12px 16px',
                      cursor: 'pointer', transition: 'all 0.2s',
                      animation: `dealFadeIn 0.3s ease-out ${Math.min(idx * 0.03, 0.3)}s both`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = isListTop && listTopColor ? listTopColor : '#0EA5E9';
                      e.currentTarget.style.boxShadow = isListTop && listTopColor
                        ? `0 4px 16px ${listTopColor}15` : '0 4px 16px rgba(14,165,233,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isListTop && listTopColor ? `${listTopColor}30` : '#E2E8F0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Rank */}
                    <span style={{
                      fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700,
                      color: rank <= 3 ? RANK_COLORS[rank - 1] : '#94A3B8',
                      minWidth: 28, textAlign: 'center',
                    }}>#{rank}</span>

                    {/* Image thumbnail */}
                    <div style={{ position: 'relative', width: 56, height: 42, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                      <Image src={deal.image} alt={deal.city} fill sizes="56px" style={{ objectFit: 'cover' }} />
                    </div>

                    {/* City + route */}
                    <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deal.city}</span>
                        {level && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 100, background: level.bg, color: '#fff', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap' }}>
                            {level.icon} {level.label}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>
                        {deal.country}{deal.airline ? ` · ${deal.airline}` : ''}
                      </span>
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                      {deal.stops === 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', color: '#059669', fontFamily: "'Outfit', sans-serif" }}>Direct</span>
                      )}
                      {deal.departureDate && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: '#E0F2FE', color: '#0284C7', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap' }}>
                          {formatDateRange(deal.departureDate, deal.returnDate)}
                          {nights > 0 ? ` · ${nights}n` : ''}
                        </span>
                      )}
                      {deal.airline && AIRLINE_BAGGAGE[deal.airline] && (
                        <span style={{
                          fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                          fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap',
                          background: AIRLINE_BAGGAGE[deal.airline].checked
                            ? 'rgba(16,185,129,0.08)' : AIRLINE_BAGGAGE[deal.airline].cabin
                              ? 'rgba(14,165,233,0.08)' : 'rgba(239,68,68,0.08)',
                          color: AIRLINE_BAGGAGE[deal.airline].checked
                            ? '#059669' : AIRLINE_BAGGAGE[deal.airline].cabin
                              ? '#0284C7' : '#DC2626',
                        }}>
                          {AIRLINE_BAGGAGE[deal.airline].checked ? '🧳' : AIRLINE_BAGGAGE[deal.airline].cabin ? '🎒' : '⚠️'}
                        </span>
                      )}
                    </div>

                    {/* Social proof */}
                    {deal.isLive && viewers > 10 && (
                      <span style={{ fontSize: 10, color: '#F59E0B', fontWeight: 600, fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        {viewers}
                      </span>
                    )}

                    {/* Price */}
                    <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
                        {deal.oldPrice > deal.price && (
                          <span style={{ fontSize: 11, color: '#94A3B8', textDecoration: 'line-through' }}>{Math.round(deal.oldPrice)}$</span>
                        )}
                        <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 700, color: listTopColor || '#0EA5E9' }}>{Math.round(deal.price)}$</span>
                      </div>
                      {deal.discount > 0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                          color: '#fff', padding: '1px 7px', borderRadius: 100,
                          background: listTopColor || '#10B981',
                        }}>-{deal.discount}%</span>
                      )}
                    </div>

                    {/* Arrow */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
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
                Voir les {remainingCount} autres deals
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
        <div className="lp-how-header lp-reveal">
          <span className="lp-section-label">Simple comme bonjour</span>
          <h2 className="lp-section-title">Comment ca marche</h2>
        </div>
        <div className="lp-steps">
          <div className="lp-step lp-reveal lp-reveal-delay-1">
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
          <div className="lp-step lp-reveal lp-reveal-delay-3">
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
          <div className="lp-step lp-reveal lp-reveal-delay-5">
            <div className="lp-step-icon lp-step-icon-3"><span>🗺️</span></div>
            <div className="lp-step-content">
              <div className="lp-step-num">03</div>
              <h3 className="lp-step-title">GeaiAI planifie ton trip</h3>
              <p className="lp-step-desc">GeaiAI te genere un itineraire complet : activites, restos, budget jour par jour. Tout ce que t&apos;as besoin.</p>
              <span className="lp-step-premium">Premium</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AI GUIDE FEATURE ─── */}
      <section className="lp-feature" id="guide">
        <div className="lp-feature-text lp-reveal-left">
          <span className="lp-section-label">Guide GeaiAI</span>
          <h2 className="lp-section-title">Ton guide de voyage, genere par GeaiAI</h2>
          <p className="lp-section-sub" style={{ marginBottom: 0 }}>
            Dis-nous ta destination, ton budget et tes preferences.
            On te genere un itineraire complet en quelques secondes.
          </p>
          <ul className="lp-feature-list">
            <li><span className="lp-feature-icon-mini">📅</span><span>Planning jour par jour adapte a ta duree de sejour</span></li>
            <li><span className="lp-feature-icon-mini">🍽️</span><span>Suggestions de restos, activites et spots photo</span></li>
            <li><span className="lp-feature-icon-mini">💰</span><span>Budget estime detaille pour tout le voyage</span></li>
            <li><span className="lp-feature-icon-mini">🤖</span><span>Assistant en temps reel pendant ton voyage</span></li>
          </ul>
          <Link href="/explore" className="lp-btn-primary">
            Essayer le Guide GeaiAI
            <ArrowIcon />
          </Link>
        </div>
        <div className="lp-feature-visual lp-reveal-right">
          <div className="lp-feature-visual-glow" />
          <div className="lp-mockup-msg user">
            <span className="label">Toi</span>
            Je pars 5 jours a Lisbonne avec 1 500 $ de budget. J&apos;aime la bouffe locale et les quartiers historiques.
          </div>
          <div className="lp-typing">
            <span className="lp-typing-dot" />
            <span className="lp-typing-dot" />
            <span className="lp-typing-dot" />
          </div>
          <div className="lp-mockup-msg ai">
            <span className="label">GeaiAI</span>
            Voici ton itineraire pour Lisbonne! Jour 1 : Quartier de l&apos;Alfama, degustation de pasteis de nata chez Manteigaria, coucher de soleil au Miradouro da Graca...
          </div>
          <div className="lp-mockup-msg ai" style={{ maxWidth: '70%' }}>
            <span className="label">Budget estime</span>
            Vols: 529$ · Hebergement: 420$ · Nourriture: 280$ · Activites: 180$
          </div>
        </div>
      </section>

      {/* ─── TRUSTED BY / PARTNER STRIP ─── */}
      <section style={{
        padding: '48px 32px',
        background: '#F8FAFC',
        borderTop: '1px solid #E2E8F0',
        borderBottom: '1px solid #E2E8F0',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{
            fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: 1.5, color: '#94A3B8', marginBottom: 24,
            fontFamily: "'Outfit', sans-serif",
          }}>
            Donnees en temps reel via
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 48, flexWrap: 'wrap', opacity: 0.45,
          }}>
            {/* Skyscanner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#0F172A"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>Skyscanner</span>
            </div>
            {/* Google Flights */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10z" fill="#0F172A"/><path d="M12 6v6l4 2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>Google Flights</span>
            </div>
            {/* Amadeus */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#0F172A"/><path d="M7 12h10M12 7v10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>Amadeus</span>
            </div>
            {/* Stripe */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#0F172A"/><path d="M12 8c-2 0-3 1-3 2s1 2 3 2 3 1 3 2-1 2-3 2M12 7v1m0 8v1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>Stripe</span>
            </div>
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
        <div className="lp-globe-inner lp-reveal">
          <span className="lp-section-label">Globe interactif</span>
          <h2 className="lp-section-title">Visualise les deals sur le globe 3D</h2>
          <p className="lp-section-sub">
            Explore les destinations en temps reel sur notre carte interactive.
            Chaque point represente un deal actif au depart de Montreal.
          </p>
          <div className="lp-globe-canvas">
            <LandingGlobe
              deals={[]}
              mapView="world"
              isMobile={false}
              onRegionSelect={() => {}}
              onHoverDeal={() => {}}
              onLeaveDeal={() => {}}
            />
          </div>
          <div style={{ marginTop: 48 }}>
            <Link href="/explore" className="lp-btn-light">
              Explorer le globe
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section style={{
        padding: '96px 32px',
        background: '#fff',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="lp-section-label">Ce que le monde en pense</span>
            <h2 className="lp-section-title">Des voyageurs satisfaits</h2>
            <p className="lp-section-sub">
              Des Quebecois comme toi qui ont trouve leurs deals grace a GeaiMonVol.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
          }}>
            {[
              {
                name: 'Marie-Eve L.',
                city: 'Montreal',
                text: 'J\'ai sauve 340$ sur mon vol pour Lisbonne! Le systeme de mediane est vraiment fiable — tu sais que c\'est un VRAI rabais, pas du marketing.',
                dest: 'Lisbonne',
                saved: 340,
                avatar: 'ME',
              },
              {
                name: 'Jean-Philippe R.',
                city: 'Laval',
                text: 'Le Guide GeaiAI m\'a planifie un itineraire de 10 jours au Japon en 30 secondes. C\'etait meilleur que ce que j\'aurais fait en 3 heures de recherche.',
                dest: 'Tokyo',
                saved: 520,
                avatar: 'JP',
              },
              {
                name: 'Camille B.',
                city: 'Quebec',
                text: 'J\'ai mis une alerte sur la Grece et 3 jours plus tard j\'avais un vol a -42%. Le Geai m\'a meme dit de checker les vols internes vers Santorin. Malade!',
                dest: 'Athenes',
                saved: 285,
                avatar: 'CB',
              },
            ].map((t, i) => (
              <div key={i} className={`lp-reveal lp-reveal-delay-${i + 1} lp-testimonial-card`} style={{
                padding: '28px 24px',
                borderRadius: 20,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex', flexDirection: 'column', gap: 16,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(14,165,233,0.1)';
                e.currentTarget.style.borderColor = 'rgba(14,165,233,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#E2E8F0';
              }}
              >
                {/* Stars */}
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                {/* Quote */}
                <p style={{
                  fontSize: 14, color: '#334155', lineHeight: 1.7,
                  fontFamily: "'Outfit', sans-serif",
                  margin: 0, flex: 1,
                }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                {/* Savings badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 10,
                  background: 'rgba(16,185,129,0.08)',
                  alignSelf: 'flex-start',
                }}>
                  <span style={{ fontSize: 13 }}>&#9992;&#65039;</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: '#059669',
                    fontFamily: "'Fredoka', sans-serif",
                  }}>
                    -{t.saved}$ sur {t.dest}
                  </span>
                </div>
                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12, fontWeight: 700,
                    fontFamily: "'Fredoka', sans-serif",
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color: '#0F172A',
                      fontFamily: "'Outfit', sans-serif",
                    }}>{t.name}</div>
                    <div style={{
                      fontSize: 11, color: '#94A3B8',
                      fontFamily: "'Outfit', sans-serif",
                    }}>{t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section style={{
        padding: '96px 32px',
        background: '#F8FAFC',
        borderTop: '1px solid #E2E8F0',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="lp-section-label">Questions frequentes</span>
            <h2 className="lp-section-title">Tout ce que tu veux savoir</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              {
                q: 'C\'est quoi exactement GeaiMonVol?',
                a: 'C\'est un outil qui scanne automatiquement les prix des vols depuis Montreal chaque jour sur Skyscanner. On te montre les vrais rabais bases sur la mediane des 90 derniers jours — pas des faux "50% de rabais" inventes.',
              },
              {
                q: 'Comment vous calculez les rabais?',
                a: 'On utilise la mediane des prix scannes sur 90 jours (minimum 3 scans). La mediane est plus fiable que la moyenne car elle resiste aux prix aberrants. Quand on dit -30%, c\'est un VRAI -30% par rapport au prix habituel.',
              },
              {
                q: 'Est-ce que je reserve directement sur GeaiMonVol?',
                a: 'Non! On te redirige vers Skyscanner pour la reservation. On est un comparateur intelligent, pas une agence de voyage. Tu reserves toujours sur un site de confiance.',
              },
              {
                q: 'C\'est quoi le Guide GeaiAI?',
                a: 'C\'est un assistant qui te genere un itineraire complet en quelques secondes : planning jour par jour, suggestions de restos et activites, budget detaille. Disponible avec le plan Premium.',
              },
              {
                q: 'Les alertes prix, ca marche comment?',
                a: 'Tu actives les alertes sur tes destinations preferees. Quand notre scan detecte une baisse de prix significative, on t\'envoie une notification. Tu rates plus jamais un bon deal!',
              },
              {
                q: 'Est-ce que c\'est gratuit?',
                a: 'La version de base est 100% gratuite : deals en direct, globe interactif, alertes prix. Le plan Premium ajoute le Guide GeaiAI, les alertes prioritaires et plus encore.',
              },
            ].map((faq, i) => (
              <details
                key={i}
                style={{
                  padding: '20px 24px',
                  borderRadius: 16,
                  background: '#fff',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <summary style={{
                  fontSize: 15, fontWeight: 700, color: '#0F172A',
                  fontFamily: "'Outfit', sans-serif",
                  listStyle: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 12,
                }}>
                  {faq.q}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <p style={{
                  fontSize: 14, color: '#64748B', lineHeight: 1.7,
                  fontFamily: "'Outfit', sans-serif",
                  margin: '14px 0 0',
                  paddingTop: 14,
                  borderTop: '1px solid #F1F5F9',
                }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS COUNTER (animated) ─── */}
      <AnimatedStats />

      {/* ─── FINAL CTA + NEWSLETTER ─── */}
      <section className="lp-final-cta">
        {/* Background decorative blobs */}
        <div className="lp-final-bg">
          <div className="lp-final-blob lp-final-blob-1" />
          <div className="lp-final-blob lp-final-blob-2" />
        </div>
        <div className="lp-final-inner lp-reveal">
          <span className="lp-section-label">Pret a partir?</span>
          <h2 className="lp-section-title">Trouve ton prochain vol maintenant</h2>
          <p className="lp-section-sub">
            Les prix changent chaque jour. Decouvre les deals en direct et planifie
            ton voyage avec le Guide GeaiAI.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <a href="#deals" className="lp-btn-primary">
              Voir les deals
              <ArrowIcon />
            </a>
            <Link href="/auth" className="lp-btn-secondary">
              Creer un compte
            </Link>
          </div>

          {/* Newsletter signup — redesigned */}
          <div className="lp-newsletter">
            <div className="lp-newsletter-header">
              <span className="lp-newsletter-icon">&#9993;</span>
              <span className="lp-newsletter-title">
                Ne rate pas les meilleures offres
              </span>
            </div>
            <p className="lp-newsletter-sub">
              Rejoins 500+ voyageurs quebecois. Un courriel par semaine avec les deals les plus fous.
            </p>
            <form
              className="lp-newsletter-form"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const btn = form.querySelector('.lp-newsletter-btn') as HTMLButtonElement;
                const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
                if (email && btn) {
                  btn.classList.add('sent');
                  btn.innerHTML = '<span class="lp-plane-fly">&#9992;</span> Envoye!';
                  setTimeout(() => {
                    form.reset();
                    btn.classList.remove('sent');
                    btn.innerHTML = "S'abonner";
                  }, 2500);
                }
              }}
            >
              <input
                name="email"
                type="email"
                required
                placeholder="ton@courriel.com"
                className="lp-newsletter-input"
              />
              <button type="submit" className="lp-newsletter-btn">
                S&apos;abonner
              </button>
            </form>
            <p className="lp-newsletter-privacy">
              Pas de spam, promis. Desabonnement en 1 clic.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div>
              <div className="lp-footer-brand">
                <Image src="/logo_geai.png" alt="GeaiMonVol" width={28} height={28} />
                <span>GeaiMonVol</span>
              </div>
              <p className="lp-footer-brand-desc">
                Les meilleurs deals de vols au depart de Montreal.
                Scanne automatique, alertes personnalisees et Guide GeaiAI.
              </p>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Produit</div>
              <Link href="/explore">Globe interactif</Link>
              <a href="#deals">Deals en direct</a>
              <a href="#guide">Guide GeaiAI</a>
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
        medianPrice={popupDeal?.medianPrice}
        avgPrice={popupDeal?.avgPrice}
        historyCount={popupDeal?.historyCount}
      />
    </div>
  );
}
