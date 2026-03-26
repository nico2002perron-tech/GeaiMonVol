'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import LandingHeader from '@/components/LandingHeader';
import DealsFilterBar from '@/components/deals/DealsFilterBar';
import DealsGrid from '@/components/deals/DealsGrid';
import DestinationPopup from '@/components/map/DestinationPopup';
import DestinationComparator from '@/components/DestinationComparator';
import { HomePremiumBanner } from '@/components/ui/PremiumNudge';
import FooterWithNewsletter from '@/components/layout/FooterWithNewsletter';
import { useLivePrices } from '@/lib/hooks/useLivePrices';
import { CITY_IMAGES, COUNTRY_IMAGES, DEFAULT_CITY_IMAGE } from '@/lib/constants/deals';
import { CITY_COUNTRY, mapPricesToDeals } from '@/lib/types/deals';
import type { DealItem, FilterTab, SortMode } from '@/lib/types/deals';
import './landing.css';
import './deals.css';

const EMPTY_DEALS: any[] = [];

interface ClientHomeV2Props {
  initialDeals?: any[];
}

export default function ClientHomeV2({ initialDeals }: ClientHomeV2Props) {
  const stableInitial = initialDeals && initialDeals.length > 0 ? initialDeals : EMPTY_DEALS;

  // ── State ──
  const [cachedImages, setCachedImages] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<FilterTab>('tous');
  const [sortMode, setSortMode] = useState<SortMode>('deal');
  const [searchQuery, setSearchQuery] = useState('');
  const [stickyFilters, setStickyFilters] = useState(false);
  const [maxBudget, setMaxBudget] = useState(0);
  const [shareToast, setShareToast] = useState('');
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showComparator, setShowComparator] = useState(false);

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupDeal, setPopupDeal] = useState<DealItem | null>(null);

  const filtersRef = useRef<HTMLDivElement>(null);

  // ── Cached images from Supabase ──
  useEffect(() => {
    fetch('/api/images')
      .then(r => r.ok ? r.json() : {})
      .then(data => { if (data && Object.keys(data).length > 0) setCachedImages(data); })
      .catch(() => {});
  }, []);

  // ── Favorites (localStorage) ──
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
    const displayPrice = deal.totalPackPrice ? Math.round(deal.totalPackPrice) : Math.round(deal.price);
    const priceLabel = deal.totalPackPrice ? 'vol+hotel/pers' : 'A/R';
    const text = `Vol Montreal → ${deal.city} a ${displayPrice}$ ${priceLabel}${deal.discount > 0 ? ` (-${deal.discount}%)` : ''}`;
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

  const openDealPopup = useCallback((deal: DealItem) => {
    setPopupDeal(deal);
    setPopupOpen(true);
  }, []);

  // ── Deals pipeline ──
  const ssrDeals = useMemo(() => mapPricesToDeals(stableInitial), [stableInitial]);
  const { prices: livePrices, isLive, lastUpdated } = useLivePrices();

  const allDeals: DealItem[] = useMemo(() => {
    if (isLive && livePrices && livePrices.length > 0) return mapPricesToDeals(livePrices);
    if (ssrDeals.length > 0) return ssrDeals;
    return [];
  }, [livePrices, isLive, ssrDeals]);

  // Override images with Supabase cache
  const dealsWithImages = useMemo(() => {
    if (Object.keys(cachedImages).length === 0) return allDeals;
    return allDeals.map(d => {
      const country = CITY_COUNTRY[d.city] || '';
      return { ...d, image: cachedImages[d.city] || cachedImages[country] || d.image };
    });
  }, [allDeals, cachedImages]);

  // ── Filter + Sort ──
  const filteredDeals = useMemo(() => {
    let result = dealsWithImages.filter(d => {
      if (d.historyCount < 3) return true;
      return d.dealLevel !== 'normal';
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d =>
        d.city.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q)
      );
    }

    if (maxBudget > 0) result = result.filter(d => d.price <= maxBudget);

    if (activeFilter === 'favoris') {
      result = result.filter(d => favorites[d.city]);
    } else if (activeFilter === 'top') {
      result = result.filter(d => ['lowest_ever', 'incredible', 'great', 'good'].includes(d.dealLevel));
    } else if (activeFilter === 'tout-inclus') {
      result = result.filter(d => d.category === 'tout-inclus');
    } else if (activeFilter !== 'tous') {
      result = result.filter(d => d.category === activeFilter);
    }

    const levelOrder: Record<string, number> = {
      lowest_ever: 0, incredible: 1, great: 2, good: 3, slight: 4, normal: 5,
    };
    if (sortMode === 'deal') {
      result.sort((a, b) => {
        const ld = (levelOrder[a.dealLevel] ?? 5) - (levelOrder[b.dealLevel] ?? 5);
        return ld !== 0 ? ld : b.discount - a.discount;
      });
    } else if (sortMode === 'price') {
      result.sort((a, b) => (a.totalPackPrice || a.price) - (b.totalPackPrice || b.price));
    } else if (sortMode === 'discount') {
      result.sort((a, b) => b.discount - a.discount);
    }

    return result;
  }, [dealsWithImages, activeFilter, sortMode, searchQuery, maxBudget, favorites]);

  // ── Sticky filters observer ──
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

  // ── Scroll reveal ──
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

  // Hero stats from real data
  const heroStats = useMemo(() => {
    const destCount = allDeals.length;
    const discounts = allDeals.filter(d => d.discount > 0).map(d => d.discount);
    const avgDiscount = discounts.length > 0
      ? Math.round(discounts.reduce((a, b) => a + b, 0) / discounts.length)
      : 0;
    return { destCount, avgDiscount };
  }, [allDeals]);

  const timeAgo = useMemo(() => {
    if (!lastUpdated) return null;
    const mins = Math.round((Date.now() - new Date(lastUpdated).getTime()) / 60000);
    if (mins < 1) return "a l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    return `il y a ${Math.round(mins / 60)}h`;
  }, [lastUpdated]);

  return (
    <div className="lp">
      {/* ─── HEADER ─── */}
      <LandingHeader />

      {/* ─── HERO (simplified) ─── */}
      <section className="lp-hero">
        <div className="lp-ocean">
          <div className="lp-ocean-gradient" />
        </div>
        <div className="lp-hero-content">
          <div className="lp-hero-text" style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
            <div className="lp-hero-badge">
              <span className="lp-hero-badge-dot" />
              Scanning en direct — prix mis a jour 24/7
            </div>
            <h1>
              Des deals de vols <span>qui ont de l&apos;allure.</span>
            </h1>
            <p className="lp-hero-sub">
              On detecte les meilleurs deals sur les vols au depart de Montreal.
            </p>

            <div className="lp-hero-actions" style={{ justifyContent: 'center' }}>
              <a href="#deals" className="lp-btn-ocean">
                <span className="lp-btn-ocean-glow" />
                Voir les deals en direct
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14m-6-6l6 6-6 6" />
                </svg>
              </a>
            </div>

            <div className="lp-hero-proof" style={{ justifyContent: 'center' }}>
              <div className="lp-hero-proof-item">
                <span className="lp-hero-proof-icon">📡</span>
                <div>
                  <strong>{heroStats.destCount}+</strong>
                  <span>destinations</span>
                </div>
              </div>
              <div className="lp-hero-proof-sep" />
              <div className="lp-hero-proof-item">
                <span className="lp-hero-proof-icon">💰</span>
                <div>
                  <strong>-{heroStats.avgDiscount}%</strong>
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
        </div>
        <div className="lp-wave-divider">
          <svg viewBox="0 0 1440 140" preserveAspectRatio="none">
            <path d="M0,90 C200,70 500,110 800,80 C1100,50 1300,100 1440,85 L1440,140 L0,140 Z" fill="#F8FAFC" />
          </svg>
        </div>
      </section>

      {/* ─── DEALS (main content — immediately after hero) ─── */}
      <section id="deals" className="lp-deals" style={{ background: '#F8FAFC', padding: '40px 24px 96px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
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
                minHeight: 44,
              }}
            >
              <span style={{ fontSize: 16 }}>{alertsEnabled ? '🔔' : '🔕'}</span>
              {alertsEnabled ? 'Alertes activees' : 'Activer les alertes prix'}
              {alertsEnabled && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </button>
          </div>

          {/* Filter bar */}
          <DealsFilterBar
            activeFilter={activeFilter}
            sortMode={sortMode}
            searchQuery={searchQuery}
            maxBudget={maxBudget}
            isSticky={stickyFilters}
            allDeals={allDeals}
            filteredCount={filteredDeals.length}
            favCount={favCount}
            onFilterChange={setActiveFilter}
            onSortChange={setSortMode}
            onSearchChange={setSearchQuery}
            onBudgetChange={setMaxBudget}
            filtersRef={filtersRef}
          />

          {/* Deals grid */}
          <DealsGrid
            deals={filteredDeals}
            allDealsCount={allDeals.length}
            favorites={favorites}
            alertsEnabled={alertsEnabled}
            onToggleFavorite={toggleFavorite}
            onShare={shareDeal}
            onOpenPopup={openDealPopup}
            onEnableAlerts={enableAlerts}
          />
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

      {/* ─── PREMIUM BANNER (single) ─── */}
      <HomePremiumBanner />

      {/* ─── FOOTER WITH NEWSLETTER ─── */}
      <FooterWithNewsletter />

      {/* Share toast */}
      {shareToast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, padding: '12px 28px', borderRadius: 100,
          background: '#0F172A', color: '#fff', fontSize: 14, fontWeight: 600,
          fontFamily: "'Outfit', sans-serif",
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
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

      {/* Floating compare bar */}
      {compareList.length >= 2 && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, display: 'flex', gap: 8, alignItems: 'center',
          padding: '12px 20px', borderRadius: 16,
          background: 'linear-gradient(135deg, #0F172A, #1E293B)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <span style={{ fontSize: 13, color: '#fff', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
            {compareList.length} destinations
          </span>
          <button
            onClick={() => setShowComparator(true)}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Comparer
          </button>
          <button
            onClick={() => setCompareList([])}
            style={{
              padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent', color: '#94A3B8', fontSize: 12, fontWeight: 600,
              fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Effacer
          </button>
        </div>
      )}

      {/* Comparator modal */}
      <DestinationComparator
        isOpen={showComparator}
        onClose={() => setShowComparator(false)}
        deals={compareList.map(city => {
          const deal = filteredDeals.find((d: DealItem) => d.city === city) || allDeals.find((d: DealItem) => d.city === city);
          return deal ? {
            destination: deal.city,
            destination_code: deal.code,
            price: deal.price,
            totalPackPrice: deal.totalPackPrice,
            airline: deal.airline,
            stops: deal.stops,
            dealLevel: deal.dealLevel,
            discount: deal.discount,
            hotelPrice: deal.hotelPrice,
            hotelName: deal.hotelName,
            hotelStars: deal.hotelStars,
            hotelRating: deal.hotelRating,
            departure_date: deal.departureDate,
            return_date: deal.returnDate,
          } : null;
        }).filter(Boolean) as any[]}
        onRemove={(dest) => setCompareList(prev => prev.filter(d => d !== dest))}
      />
    </div>
  );
}
