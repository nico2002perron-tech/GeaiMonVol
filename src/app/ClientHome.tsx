'use client';

import { useState, useMemo } from 'react';
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

// ── Static fallback deals ──
const STATIC_DEALS = [
  { city: 'Paris', code: 'CDG', price: 549, oldPrice: 820, dates: 'Mai - Juin', tag: 'Classique', tagIcon: '🗼', category: 'monde' as const, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=500&fit=crop' },
  { city: 'Lisbonne', code: 'LIS', price: 529, oldPrice: 780, dates: 'Avril - Mai', tag: 'Top Deal', tagIcon: '🔥', category: 'monde' as const, image: 'https://images.unsplash.com/photo-1570481662006-a3a1374699e8?w=800&h=500&fit=crop' },
  { city: 'Tokyo', code: 'TYO', price: 689, oldPrice: 1050, dates: 'Septembre', tag: 'Tendance', tagIcon: '✈️', category: 'monde' as const, image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=500&fit=crop' },
  { city: 'Vancouver', code: 'YVR', price: 289, oldPrice: 410, dates: 'Mai - Sept.', tag: 'Canada', tagIcon: '🍁', category: 'canada' as const, image: 'https://images.unsplash.com/photo-1609825488888-3a766db05542?w=800&h=500&fit=crop' },
  { city: 'Calgary', code: 'YYC', price: 249, oldPrice: 380, dates: 'Juin - Aout', tag: 'Rocheuses', tagIcon: '🏔️', category: 'canada' as const, image: 'https://images.unsplash.com/photo-1561489413-985b06da5bee?w=800&h=500&fit=crop' },
  { city: 'Halifax', code: 'YHZ', price: 199, oldPrice: 310, dates: 'Juillet - Sept.', tag: 'Maritimes', tagIcon: '🌊', category: 'canada' as const, image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&h=500&fit=crop' },
  { city: 'Punta Cana', code: 'PUJ', price: 899, oldPrice: 1350, dates: 'Dec. - Mars', tag: 'Tout-inclus', tagIcon: '🏖️', category: 'tout-inclus' as const, image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&h=500&fit=crop' },
  { city: 'Cancún', code: 'CUN', price: 849, oldPrice: 1200, dates: 'Janv. - Avril', tag: 'Tout-inclus', tagIcon: '🌴', category: 'tout-inclus' as const, image: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800&h=500&fit=crop' },
  { city: 'Varadero', code: 'VRA', price: 749, oldPrice: 1100, dates: 'Nov. - Avril', tag: 'Tout-inclus', tagIcon: '☀️', category: 'tout-inclus' as const, image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=500&fit=crop' },
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

type FilterTab = 'tous' | 'top' | 'canada' | 'monde' | 'tout-inclus';
type SortMode = 'deal' | 'price' | 'discount';

const FILTER_TABS: { id: FilterTab; label: string; icon: string }[] = [
  { id: 'tous', label: 'Tous', icon: '🌎' },
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

const DISCOUNT_STEPS = [0, 20, 25, 30, 35, 40] as const;

const DISCOUNT_COLORS: Record<number, string> = {
  0: '#94A3B8',
  20: '#0EA5E9',
  25: '#0284C7',
  30: '#059669',
  35: '#D97706',
  40: '#DC2626',
};

const DISCOUNT_LABELS: Record<number, string> = {
  0: 'Tous',
  20: '20%+',
  25: '25%+',
  30: '30%+',
  35: '35%+',
  40: '40%+',
};

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

interface ClientHomeProps {
  initialDeals?: any[];
}

export default function ClientHome({ initialDeals = [] }: ClientHomeProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('tous');
  const [sortMode, setSortMode] = useState<SortMode>('deal');
  const [minDiscount, setMinDiscount] = useState(20);

  // SSR deals mapped once — shown INSTANTLY on page load
  const ssrDeals = useMemo(() => mapPricesToDeals(initialDeals), [initialDeals]);

  // Live prices from Skyscanner scans (refreshes in background)
  const { prices: livePrices, isLive, lastUpdated } = useLivePrices();

  // Destination popup state
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupDeal, setPopupDeal] = useState<DealItem | null>(null);

  const openDealPopup = (deal: DealItem) => {
    setPopupDeal(deal);
    setPopupOpen(true);
  };

  // ── Deals: use live data when available, otherwise SSR pre-fetched data ──
  const allDeals: DealItem[] = useMemo(() => {
    // If live API data is loaded, use it (freshest)
    if (isLive && livePrices && livePrices.length > 0) {
      return mapPricesToDeals(livePrices);
    }
    // Otherwise use SSR pre-fetched deals (instant on page load)
    return ssrDeals;
  }, [livePrices, isLive, ssrDeals]);

  // ── Filter ──
  const filteredDeals = useMemo(() => {
    // Apply minimum discount filter
    let result = allDeals.filter(d => d.discount >= minDiscount);

    if (activeFilter === 'top') {
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
  }, [allDeals, activeFilter, sortMode, minDiscount]);

  const featured = filteredDeals[0];
  const rest = filteredDeals.slice(1);

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
                    <Image src={c.image} alt={c.city} fill style={{ objectFit: 'cover' }} />
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

      {/* ─── HOW IT WORKS ─── */}
      <section className="lp-how" id="how">
        <div className="lp-how-header">
          <span className="lp-section-label">Facile</span>
          <h2 className="lp-section-title">3 etapes. C&apos;est tout.</h2>
        </div>
        <div className="lp-steps">
          <div className="lp-step">
            <div className="lp-step-icon lp-step-icon-1"><span>📡</span></div>
            <div className="lp-step-content">
              <div className="lp-step-num">01</div>
              <h3 className="lp-step-title">On scanne pour toi</h3>
              <p className="lp-step-desc">Les meilleurs prix de vols depuis Montreal, scannes chaque jour automatiquement.</p>
            </div>
          </div>
          <div className="lp-step-arrow">
            <svg viewBox="0 0 80 24" fill="none">
              <path d="M0,12 L60,12" stroke="#BAE6FD" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M55,6 L67,12 L55,18" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div className="lp-step">
            <div className="lp-step-icon lp-step-icon-2"><span>🔔</span></div>
            <div className="lp-step-content">
              <div className="lp-step-num">02</div>
              <h3 className="lp-step-title">Tu recois les deals</h3>
              <p className="lp-step-desc">Alerte email instantanee quand un prix chute sur ta destination preferee.</p>
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
              <p className="lp-step-desc">Itineraire complet genere par IA : activites, restos, budget jour par jour.</p>
              <span className="lp-step-premium">Premium</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ─── DEALS — LA SECTION PRINCIPALE ───
          ══════════════════════════════════════════════════════ */}
      <section className="lp-deals" id="deals" style={{ background: '#F8FAFC', padding: '80px 24px 96px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* ── Header ── */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
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
              fontSize: 16, color: '#64748B', margin: 0,
            }}>
              {allDeals.length} destination{allDeals.length > 1 ? 's' : ''} scannee{allDeals.length > 1 ? 's' : ''} · Prix via Skyscanner
            </p>
          </div>

          {/* ── Filter + Discount + Sort bar ── */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32,
          }}>
            {/* Row 1: Category pills + Sort */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12,
            }}>
              {/* Filter pills */}
              <div style={{
                display: 'flex', gap: 6,
                background: 'white', padding: 5, borderRadius: 100,
                border: '1px solid #E2E8F0',
                overflowX: 'auto',
                flexShrink: 0,
              }}>
                {FILTER_TABS.map(tab => {
                  const base = allDeals.filter(d => d.discount >= minDiscount);
                  const isActive = activeFilter === tab.id;
                  const count = tab.id === 'tous' ? base.length
                    : tab.id === 'top' ? base.filter(d => ['lowest_ever', 'incredible', 'great', 'good'].includes(d.dealLevel)).length
                    : base.filter(d => d.category === tab.id).length;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id)}
                      style={{
                        padding: '9px 18px',
                        borderRadius: 100,
                        border: 'none',
                        background: isActive ? '#0EA5E9' : 'transparent',
                        color: isActive ? '#fff' : '#334155',
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "'Outfit', sans-serif",
                        cursor: 'pointer',
                        transition: 'all 0.25s',
                        display: 'flex', alignItems: 'center', gap: 6,
                        whiteSpace: 'nowrap',
                        boxShadow: isActive ? '0 2px 8px rgba(14,165,233,0.3)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: 15 }}>{tab.icon}</span>
                      {tab.label}
                      {count > 0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          padding: '1px 7px', borderRadius: 100,
                          background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(14,165,233,0.08)',
                          color: isActive ? '#fff' : '#0284C7',
                        }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Sort dropdown */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: "'Outfit', sans-serif",
              }}>
                <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>Trier :</span>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  style={{
                    padding: '8px 32px 8px 14px',
                    borderRadius: 12, border: '1px solid #E2E8F0',
                    background: 'white', color: '#0F172A',
                    fontSize: 13, fontWeight: 600,
                    fontFamily: "'Outfit', sans-serif",
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                  }}
                >
                  {SORT_OPTIONS.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Discount filter — prominent */}
            <div style={{
              background: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: 20,
              padding: '14px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              flexWrap: 'wrap',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>
              {/* Label */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: "'Outfit', sans-serif",
                flexShrink: 0,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: `linear-gradient(135deg, ${DISCOUNT_COLORS[minDiscount] || '#0EA5E9'}15, ${DISCOUNT_COLORS[minDiscount] || '#0EA5E9'}08)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={DISCOUNT_COLORS[minDiscount] || '#0EA5E9'} strokeWidth="2.5" strokeLinecap="round">
                    <line x1="19" y1="5" x2="5" y2="19" />
                    <circle cx="6.5" cy="6.5" r="2.5" />
                    <circle cx="17.5" cy="17.5" r="2.5" />
                  </svg>
                </div>
                <div>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: '#0F172A',
                    lineHeight: 1.2,
                  }}>
                    Rabais minimum
                  </div>
                  <div style={{
                    fontSize: 11, color: '#94A3B8', fontWeight: 500,
                  }}>
                    vs prix moyen des 90 derniers jours
                  </div>
                </div>
              </div>

              {/* Discount step buttons */}
              <div style={{
                display: 'flex', gap: 6, flex: 1,
                justifyContent: 'center',
              }}>
                {DISCOUNT_STEPS.map((step) => {
                  const isActive = minDiscount === step;
                  const color = DISCOUNT_COLORS[step];
                  const count = allDeals.filter(d => d.discount >= step).length;
                  return (
                    <button
                      key={step}
                      onClick={() => setMinDiscount(step)}
                      style={{
                        position: 'relative',
                        padding: isActive ? '10px 16px' : '10px 14px',
                        borderRadius: 14,
                        border: isActive ? `2px solid ${color}` : '2px solid transparent',
                        background: isActive ? `${color}10` : '#F8FAFC',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                        minWidth: 56,
                        boxShadow: isActive ? `0 4px 16px ${color}25` : 'none',
                      }}
                    >
                      <span style={{
                        fontSize: 16, fontWeight: 800,
                        fontFamily: "'Fredoka', sans-serif",
                        color: isActive ? color : '#64748B',
                        lineHeight: 1,
                        transition: 'color 0.2s',
                      }}>
                        {step === 0 ? 'Tous' : `-${step}%`}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        color: isActive ? color : '#94A3B8',
                        fontFamily: "'Outfit', sans-serif",
                        transition: 'color 0.2s',
                      }}>
                        {count} vol{count !== 1 ? 's' : ''}
                      </span>
                      {isActive && (
                        <div style={{
                          position: 'absolute', top: -4, right: -4,
                          width: 14, height: 14, borderRadius: '50%',
                          background: color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: `0 2px 6px ${color}40`,
                        }}>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── FEATURED DEAL #1 ── */}
          {featured && (
            <div
              onClick={() => openDealPopup(featured)}
              style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
                borderRadius: 24,
                overflow: 'hidden',
                background: 'white',
                border: '1px solid rgba(14,165,233,0.15)',
                marginBottom: 32,
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                animation: 'dealGlow 4s ease-in-out infinite',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(14,165,233,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              {/* Image */}
              <div style={{ position: 'relative', minHeight: 280 }}>
                <Image
                  src={featured.image}
                  alt={featured.city}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  style={{ objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.1), rgba(0,0,0,0.35))',
                }} />

                {/* #1 Rank badge */}
                <div style={{
                  position: 'absolute', top: 20, left: 20,
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
                  overflow: 'hidden',
                }}>
                  <span style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontSize: 20, fontWeight: 700, color: '#fff',
                    position: 'relative', zIndex: 1,
                  }}>#1</span>
                  <div style={{
                    position: 'absolute', top: 0, width: '40%', height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    animation: 'rankShine 3s ease-in-out infinite',
                  }} />
                </div>

                {/* Deal badge */}
                {DEAL_LEVELS[featured.dealLevel] && (
                  <div style={{
                    position: 'absolute', top: 20, right: 20,
                    padding: '7px 16px', borderRadius: 100,
                    background: DEAL_LEVELS[featured.dealLevel].bg,
                    color: '#fff', fontSize: 13, fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                    display: 'flex', alignItems: 'center', gap: 5,
                    boxShadow: `0 4px 16px ${DEAL_LEVELS[featured.dealLevel].bg}66`,
                  }}>
                    {DEAL_LEVELS[featured.dealLevel].icon} {DEAL_LEVELS[featured.dealLevel].label}
                  </div>
                )}

                {/* Discount badge */}
                {featured.discount > 0 && (
                  <div style={{
                    position: 'absolute', bottom: 20, right: 20,
                    padding: '6px 14px', borderRadius: 100,
                    background: '#10B981', color: '#fff',
                    fontSize: 16, fontWeight: 700,
                    fontFamily: "'Fredoka', sans-serif",
                    boxShadow: '0 4px 12px rgba(16,185,129,0.4)',
                  }}>
                    -{featured.discount}%
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{
                padding: '32px 36px',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 6,
                }}>
                  <span style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontSize: 13, fontWeight: 700, color: '#0EA5E9',
                    letterSpacing: 0.5,
                  }}>YUL</span>
                  <span style={{
                    flex: 1, height: 1, maxWidth: 60,
                    background: 'linear-gradient(90deg, #E2E8F0, #0EA5E9, #E2E8F0)',
                  }} />
                  <span style={{ fontSize: 14, color: '#94A3B8' }}>✈</span>
                  <span style={{
                    flex: 1, height: 1, maxWidth: 60,
                    background: 'linear-gradient(90deg, #E2E8F0, #0EA5E9, #E2E8F0)',
                  }} />
                  <span style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontSize: 13, fontWeight: 700, color: '#0EA5E9',
                    letterSpacing: 0.5,
                  }}>{featured.code}</span>
                </div>

                <h3 style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: 'clamp(26px, 3vw, 34px)',
                  fontWeight: 700, color: '#0F172A',
                  margin: '0 0 4px', lineHeight: 1.1,
                }}>{featured.city}</h3>
                <span style={{
                  fontSize: 15, color: '#64748B',
                  fontFamily: "'Outfit', sans-serif",
                  marginBottom: 20,
                }}>{featured.country}</span>

                {/* Date + Airline info */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 16, flexWrap: 'wrap',
                }}>
                  {featured.departureDate && (
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: '#0F172A',
                      padding: '5px 14px', borderRadius: 8,
                      background: '#E0F2FE',
                      fontFamily: "'Outfit', sans-serif",
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                      {formatDateRange(featured.departureDate, featured.returnDate)}
                    </span>
                  )}
                  {featured.airline && (
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: '#334155',
                      padding: '5px 14px', borderRadius: 8,
                      background: '#F1F5F9',
                      fontFamily: "'Outfit', sans-serif",
                    }}>{featured.airline}</span>
                  )}
                  {featured.stops >= 0 && (
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      padding: '5px 14px', borderRadius: 8,
                      background: featured.stops === 0 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      color: featured.stops === 0 ? '#059669' : '#D97706',
                      fontFamily: "'Outfit', sans-serif",
                    }}>{featured.stops === 0 ? 'Direct' : `${featured.stops} escale${featured.stops > 1 ? 's' : ''}`}</span>
                  )}
                  {featured.isLive && (
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      padding: '5px 10px', borderRadius: 8,
                      background: 'rgba(16,185,129,0.1)',
                      color: '#059669',
                      fontFamily: "'Outfit', sans-serif",
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: '#10B981',
                        animation: 'dealPulse 2s ease-in-out infinite',
                      }} />
                      Live
                    </span>
                  )}
                </div>

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
                  <span style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontSize: 44, fontWeight: 700, color: '#0EA5E9',
                    lineHeight: 1,
                  }}>{ featured.price < 1000 ? `${Math.round(featured.price)}` : `${Math.round(featured.price).toLocaleString('fr-CA')}`} $</span>
                  {featured.oldPrice > featured.price && (
                    <span style={{
                      fontSize: 18, color: '#94A3B8',
                      textDecoration: 'line-through',
                    }}>{Math.round(featured.oldPrice)} $</span>
                  )}
                  <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>aller-retour</span>
                </div>

                {/* CTAs */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {/* Primary: open popup to see all dates */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '14px 28px', borderRadius: 16,
                    background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                    color: '#fff', fontSize: 15, fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                    boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
                    transition: 'all 0.25s',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    Voir les dates
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14m-6-6l6 6-6 6" />
                    </svg>
                  </div>
                  {/* Secondary: direct to Skyscanner */}
                  {featured.bookingLink && (
                    <a
                      href={featured.bookingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '14px 22px', borderRadius: 16,
                        background: 'rgba(14,165,233,0.08)',
                        color: '#0284C7', fontSize: 14, fontWeight: 600,
                        fontFamily: "'Outfit', sans-serif",
                        textDecoration: 'none',
                        transition: 'all 0.25s',
                        border: '1px solid rgba(14,165,233,0.15)',
                      }}
                    >
                      Skyscanner
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
                    </a>
                  )}
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
              {rest.map((deal, idx) => {
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
                    </div>

                    {/* Body */}
                    <div style={{ padding: '18px 22px 22px' }}>
                      {/* Route */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                      }}>
                        <span style={{
                          fontFamily: "'Fredoka', sans-serif",
                          fontSize: 11, fontWeight: 700, color: '#0EA5E9',
                          letterSpacing: 0.5,
                        }}>YUL</span>
                        <span style={{ flex: 1, height: 1, background: '#E2E8F0', maxWidth: 40 }} />
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>✈</span>
                        <span style={{ flex: 1, height: 1, background: '#E2E8F0', maxWidth: 40 }} />
                        <span style={{
                          fontFamily: "'Fredoka', sans-serif",
                          fontSize: 11, fontWeight: 700, color: '#0EA5E9',
                          letterSpacing: 0.5,
                        }}>{deal.code}</span>
                      </div>

                      <h3 style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontSize: 22, fontWeight: 700, color: '#0F172A',
                        margin: '0 0 2px',
                      }}>{deal.city}</h3>

                      {/* Info line: country, airline, stops */}
                      <span style={{
                        fontSize: 13, color: '#94A3B8', display: 'block',
                        fontFamily: "'Outfit', sans-serif",
                        marginBottom: deal.departureDate ? 6 : 12,
                      }}>
                        {deal.country}
                        {deal.airline ? ` · ${deal.airline}` : ''}
                        {deal.stops >= 0 ? ` · ${deal.stops === 0 ? 'Direct' : `${deal.stops} esc.`}` : ''}
                      </span>

                      {/* Date badge */}
                      {deal.departureDate && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 12px', borderRadius: 8,
                          background: '#E0F2FE',
                          fontSize: 11, fontWeight: 600, color: '#0284C7',
                          fontFamily: "'Outfit', sans-serif",
                          marginBottom: 12,
                        }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                          {formatDateRange(deal.departureDate, deal.returnDate)}
                        </div>
                      )}

                      {/* Price row */}
                      <div style={{
                        display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12,
                      }}>
                        {deal.oldPrice > deal.price && (
                          <span style={{
                            fontSize: 14, color: '#94A3B8', textDecoration: 'line-through',
                          }}>{Math.round(deal.oldPrice)} $</span>
                        )}
                        <span style={{
                          fontFamily: "'Fredoka', sans-serif",
                          fontSize: 28, fontWeight: 700, color: '#0EA5E9',
                        }}>{Math.round(deal.price)} $</span>
                        <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>A/R</span>
                      </div>

                      {/* CTAs */}
                      <div style={{
                        display: 'flex', gap: 8,
                      }}>
                        {/* See dates button (primary) */}
                        <div style={{
                          flex: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '9px 14px', borderRadius: 12,
                          background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                          color: '#fff',
                          fontSize: 12, fontWeight: 700,
                          fontFamily: "'Outfit', sans-serif",
                          transition: 'all 0.25s',
                        }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                          Voir les dates
                        </div>
                        {/* Direct Skyscanner link */}
                        {deal.bookingLink && (
                          <a
                            href={deal.bookingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                              padding: '9px 14px', borderRadius: 12,
                              background: 'rgba(14,165,233,0.08)',
                              color: '#0284C7',
                              fontSize: 12, fontWeight: 600,
                              fontFamily: "'Outfit', sans-serif",
                              textDecoration: 'none',
                              transition: 'all 0.25s',
                              border: '1px solid rgba(14,165,233,0.12)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Skyscanner
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>&#9992;</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>
                Aucun deal dans cette categorie
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Essaie un autre filtre
              </div>
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
