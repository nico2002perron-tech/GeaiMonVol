'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import LandingHeader from '@/components/LandingHeader';
import DealsFilterBar from '@/components/deals/DealsFilterBar';
import DealsGrid from '@/components/deals/DealsGrid';
import DestinationPopup from '@/components/map/DestinationPopup';
import FooterWithNewsletter from '@/components/layout/FooterWithNewsletter';
import { useLivePrices } from '@/lib/hooks/useLivePrices';
import { CITY_COUNTRY, mapPricesToDeals } from '@/lib/types/deals';
import type { DealItem, FilterTab, SortMode } from '@/lib/types/deals';
import '../landing.css';
import '../deals.css';

const EMPTY_DEALS: any[] = [];

export default function ClientDeals({ initialDeals }: { initialDeals?: any[] }) {
  const stableInitial = initialDeals && initialDeals.length > 0 ? initialDeals : EMPTY_DEALS;

  const [cachedImages, setCachedImages] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<FilterTab>('tous');
  const [sortMode, setSortMode] = useState<SortMode>('deal');
  const [searchQuery, setSearchQuery] = useState('');
  const [stickyFilters, setStickyFilters] = useState(false);
  const [maxBudget, setMaxBudget] = useState(0);
  const [shareToast, setShareToast] = useState('');
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupDeal, setPopupDeal] = useState<DealItem | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/images')
      .then(r => r.ok ? r.json() : {})
      .then(data => { if (data && Object.keys(data).length > 0) setCachedImages(data); })
      .catch(() => {});
  }, []);

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
      if (next[city]) delete next[city]; else next[city] = true;
      localStorage.setItem('geai_favorites', JSON.stringify(Object.keys(next)));
      return next;
    });
  }, []);

  const enableAlerts = useCallback(async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setAlertsEnabled(true);
      localStorage.setItem('geai_alerts', 'true');
      new Notification('GeaiMonVol', { body: 'Tu recevras les alertes de baisses de prix!', icon: '/logo_geai.png' });
    }
  }, []);

  const shareDeal = useCallback((deal: DealItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const price = deal.totalPackPrice ? Math.round(deal.totalPackPrice) : Math.round(deal.price);
    const text = `Vol Montreal → ${deal.city} a ${price}$ ${deal.totalPackPrice ? 'vol+hotel/pers' : 'A/R'}${deal.discount > 0 ? ` (-${deal.discount}%)` : ''}`;
    if (navigator.share) {
      navigator.share({ title: `Deal GeaiMonVol - ${deal.city}`, text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${window.location.href}`).then(() => {
        setShareToast('Lien copie!');
        setTimeout(() => setShareToast(''), 2000);
      }).catch(() => {});
    }
  }, []);

  const openDealPopup = useCallback((deal: DealItem) => {
    setPopupDeal(deal);
    setPopupOpen(true);
  }, []);

  const ssrDeals = useMemo(() => mapPricesToDeals(stableInitial), [stableInitial]);
  const { prices: livePrices, isLive, lastUpdated } = useLivePrices();

  const allDeals = useMemo(() => {
    if (isLive && livePrices && livePrices.length > 0) return mapPricesToDeals(livePrices);
    if (ssrDeals.length > 0) return ssrDeals;
    return [];
  }, [livePrices, isLive, ssrDeals]);

  const dealsWithImages = useMemo(() => {
    if (Object.keys(cachedImages).length === 0) return allDeals;
    return allDeals.map(d => {
      const country = CITY_COUNTRY[d.city] || '';
      return { ...d, image: cachedImages[d.city] || cachedImages[country] || d.image };
    });
  }, [allDeals, cachedImages]);

  const filteredDeals = useMemo(() => {
    let result = dealsWithImages.filter(d => d.historyCount < 3 || d.dealLevel !== 'normal');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d => d.city.toLowerCase().includes(q) || d.country.toLowerCase().includes(q) || d.code.toLowerCase().includes(q));
    }
    if (maxBudget > 0) result = result.filter(d => d.price <= maxBudget);
    if (activeFilter === 'favoris') result = result.filter(d => favorites[d.city]);
    else if (activeFilter === 'top') result = result.filter(d => ['lowest_ever', 'incredible', 'great', 'good'].includes(d.dealLevel));
    else if (activeFilter === 'tout-inclus') result = result.filter(d => d.category === 'tout-inclus');
    else if (activeFilter !== 'tous') result = result.filter(d => d.category === activeFilter);

    const lo: Record<string, number> = { lowest_ever: 0, incredible: 1, great: 2, good: 3, slight: 4, normal: 5 };
    if (sortMode === 'deal') result.sort((a, b) => (lo[a.dealLevel] ?? 5) - (lo[b.dealLevel] ?? 5) || b.discount - a.discount);
    else if (sortMode === 'price') result.sort((a, b) => (a.totalPackPrice || a.price) - (b.totalPackPrice || b.price));
    else if (sortMode === 'discount') result.sort((a, b) => b.discount - a.discount);
    return result;
  }, [dealsWithImages, activeFilter, sortMode, searchQuery, maxBudget, favorites]);

  useEffect(() => {
    const el = filtersRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setStickyFilters(!entry.isIntersecting), { threshold: 0, rootMargin: '-60px 0px 0px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const timeAgo = useMemo(() => {
    if (!lastUpdated) return null;
    const mins = Math.round((Date.now() - new Date(lastUpdated).getTime()) / 60000);
    if (mins < 1) return "a l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    return `il y a ${Math.round(mins / 60)}h`;
  }, [lastUpdated]);

  return (
    <div className="lp">
      <LandingHeader />

      <section style={{ background: '#F8FAFC', padding: '100px 24px 96px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 100,
              background: allDeals.length > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(14,165,233,0.08)',
              marginBottom: 16, fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600,
              color: allDeals.length > 0 ? '#059669' : '#0284C7',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: allDeals.length > 0 ? '#10B981' : '#0EA5E9',
                animation: 'dealPulse 2s ease-in-out infinite',
              }} />
              {allDeals.length > 0 ? `En direct${timeAgo ? ` · ${timeAgo}` : ''}` : 'Deals du moment'}
            </div>
            <h1 style={{
              fontFamily: "'Fredoka', sans-serif", fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 700, color: '#0F172A', margin: '0 0 8px', lineHeight: 1.15,
            }}>
              Les meilleurs deals depuis Montreal
            </h1>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, color: '#64748B', margin: 0 }}>
              {allDeals.length} destination{allDeals.length > 1 ? 's' : ''} scannee{allDeals.length > 1 ? 's' : ''} · Prix via Skyscanner
            </p>
          </div>

          <DealsFilterBar
            activeFilter={activeFilter} sortMode={sortMode} searchQuery={searchQuery}
            maxBudget={maxBudget} isSticky={stickyFilters} allDeals={allDeals}
            filteredCount={filteredDeals.length} favCount={favCount}
            onFilterChange={setActiveFilter} onSortChange={setSortMode}
            onSearchChange={setSearchQuery} onBudgetChange={setMaxBudget}
            filtersRef={filtersRef}
          />

          <DealsGrid
            deals={filteredDeals} allDealsCount={allDeals.length} favorites={favorites}
            alertsEnabled={alertsEnabled} onToggleFavorite={toggleFavorite} onShare={shareDeal}
            onOpenPopup={openDealPopup} onEnableAlerts={enableAlerts}
          />
        </div>
      </section>

      <FooterWithNewsletter />

      {shareToast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, padding: '12px 28px', borderRadius: 100,
          background: '#0F172A', color: '#fff', fontSize: 14, fontWeight: 600,
          fontFamily: "'Outfit', sans-serif", boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
          {shareToast}
        </div>
      )}

      <DestinationPopup
        isOpen={popupOpen} onClose={() => setPopupOpen(false)}
        destination={popupDeal?.city || ''} destinationCode={popupDeal?.code || ''}
        bestPrice={popupDeal?.price} discount={popupDeal?.discount}
        dealLevel={popupDeal?.dealLevel} medianPrice={popupDeal?.medianPrice}
        avgPrice={popupDeal?.avgPrice} historyCount={popupDeal?.historyCount}
      />
    </div>
  );
}
