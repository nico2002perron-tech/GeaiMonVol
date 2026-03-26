'use client';

import React, { useMemo, useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LandingHeader from '@/components/LandingHeader';
import FooterWithNewsletter from '@/components/layout/FooterWithNewsletter';
import { DEAL_LEVELS } from '@/lib/constants/deals';
import { CITY_COUNTRY, COUNTRY_FLAGS, mapPricesToDeals } from '@/lib/types/deals';
import type { DealItem } from '@/lib/types/deals';
import { PREMIUM_PRICE } from '@/lib/constants/premium';
import './landing.css';

const EMPTY_DEALS: any[] = [];

interface ClientLandingProps {
  initialDeals?: any[];
}

export default function ClientLanding({ initialDeals }: ClientLandingProps) {
  const stableInitial = initialDeals && initialDeals.length > 0 ? initialDeals : EMPTY_DEALS;
  const allDeals = useMemo(() => mapPricesToDeals(stableInitial), [stableInitial]);
  const topDeals = useMemo(() => allDeals.slice(0, 6), [allDeals]);

  const heroStats = useMemo(() => {
    const discounts = allDeals.filter(d => d.discount > 0).map(d => d.discount);
    const avg = discounts.length > 0 ? Math.round(discounts.reduce((a, b) => a + b, 0) / discounts.length) : 30;
    return { count: allDeals.length || 40, avg };
  }, [allDeals]);

  return (
    <div className="lp lp-dark">
      <LandingHeader />

      {/* Background effects */}
      <div className="lp-bg-grid" />
      <div className="lp-aurora lp-aurora-1" />
      <div className="lp-aurora lp-aurora-2" />
      <div className="lp-aurora lp-aurora-3" />

      {/* ═══ HERO ═══ */}
      <section className="lp-hero-dark">
        <div className="lp-hero-inner">
          <div className="lp-pill-badge">
            <span className="lp-pill-dot" />
            {allDeals.length > 0 ? `${allDeals.length} deals scannes en direct` : 'Scanning en direct'}
          </div>

          <h1 className="lp-hero-h1">
            Ton agent de voyage
            <br />
            <span className="lp-gradient-text">propulse par l&apos;IA.</span>
          </h1>

          <p className="lp-hero-p">
            GeaiAI scanne les prix en temps reel et te trouve les meilleurs vols depuis Montreal. Dis-lui ou tu veux aller.
          </p>

          <div className="lp-hero-ctas">
            <Link href="/agent" className="lp-cta-glow">
              <span className="lp-cta-glow-border" />
              <span className="lp-cta-glow-inner">
                Parler avec GeaiAI
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-6-6l6 6-6 6" /></svg>
              </span>
            </Link>
            <Link href="/deals" className="lp-cta-ghost">
              Voir les deals en direct
            </Link>
          </div>

          <div className="lp-stats-row">
            <div className="lp-stat-card">
              <span className="lp-stat-num">{heroStats.count}+</span>
              <span className="lp-stat-label">Destinations</span>
            </div>
            <div className="lp-stat-card">
              <span className="lp-stat-num">-{heroStats.avg}%</span>
              <span className="lp-stat-label">En moyenne</span>
            </div>
            <div className="lp-stat-card">
              <span className="lp-stat-num">24h</span>
              <span className="lp-stat-label">Mise a jour</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ AGENT PREVIEW ═══ */}
      <section className="lp-section">
        <div className="lp-preview-wrap">
          <div className="lp-glass-card lp-preview-card">
            <div className="lp-preview-bar">
              <div className="lp-preview-bar-dot" />
              <span>GeaiAI</span>
              <span className="lp-preview-bar-tag">Agent IA</span>
            </div>
            <div className="lp-preview-chat">
              <div className="lp-preview-msg lp-preview-user">
                <div className="lp-preview-bubble lp-preview-bubble-user">Je veux du beach pas cher, max 500$</div>
              </div>
              <div className="lp-preview-msg lp-preview-ai">
                <div className="lp-preview-avatar">🐦</div>
                <div className="lp-preview-bubble lp-preview-bubble-ai">
                  Ayoye j&apos;ai exactement ce qu&apos;il te faut! 🏖️{'\n\n'}
                  {topDeals.slice(0, 3).map((d, i) => (
                    <span key={i}>
                      {COUNTRY_FLAGS[CITY_COUNTRY[d.city] || ''] || ''} <strong>{d.city}</strong> — {Math.round(d.price)}$ A/R
                      {d.discount > 0 ? ` (-${d.discount}%)` : ''}
                      {i < 2 ? '\n' : ''}
                    </span>
                  ))}
                  {topDeals.length === 0 && (
                    <>🇲🇽 <strong>Cancun</strong> — 389$ A/R (-32%){'\n'}🇩🇴 <strong>Punta Cana</strong> — 425$ A/R{'\n'}🇨🇺 <strong>Varadero</strong> — 449$ A/R</>
                  )}
                  {'\n\n'}Tu veux que je te planifie un itineraire? 🗺️
                </div>
              </div>
            </div>
            <div className="lp-preview-input">
              <span>Ecris ton message...</span>
              <Link href="/agent" className="lp-preview-try">Essayer maintenant</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES BENTO ═══ */}
      <section className="lp-section">
        <div className="lp-section-header">
          <span className="lp-pill-badge lp-pill-badge-sm">Comment ca marche</span>
          <h2 className="lp-h2">Tout ce dont tu as besoin<br /><span className="lp-gradient-text">pour voyager mieux.</span></h2>
        </div>

        <div className="lp-bento">
          <div className="lp-glass-card lp-bento-item lp-bento-featured">
            <div className="lp-bento-icon">💬</div>
            <h3 className="lp-bento-title">Parle a ton agent</h3>
            <p className="lp-bento-desc">Dis a GeaiAI ou tu veux aller, ton budget, tes vibes. Il connait tous les deals en direct et te recommande les meilleures options.</p>
          </div>
          <div className="lp-glass-card lp-bento-item">
            <div className="lp-bento-icon">📡</div>
            <h3 className="lp-bento-title">Scan en temps reel</h3>
            <p className="lp-bento-desc">Prix calcules sur 90 jours de donnees. Pas de faux rabais.</p>
          </div>
          <div className="lp-glass-card lp-bento-item">
            <div className="lp-bento-icon">🗺️</div>
            <h3 className="lp-bento-title">Itineraires IA</h3>
            <p className="lp-bento-desc">Activites, restos, budget — genere en 30 secondes.</p>
          </div>
          <div className="lp-glass-card lp-bento-item">
            <div className="lp-bento-icon">🔔</div>
            <h3 className="lp-bento-title">Alertes de prix</h3>
            <p className="lp-bento-desc">Le prix baisse? Tu le sais en premier.</p>
          </div>
          <div className="lp-glass-card lp-bento-item">
            <div className="lp-bento-icon">✈️</div>
            <h3 className="lp-bento-title">Reserve direct</h3>
            <p className="lp-bento-desc">Un clic vers Skyscanner pour le meilleur prix garanti.</p>
          </div>
        </div>
      </section>

      {/* ═══ DEALS ═══ */}
      {topDeals.length > 0 && (
        <section className="lp-section">
          <div className="lp-section-header">
            <span className="lp-pill-badge lp-pill-badge-sm">En direct maintenant</span>
            <h2 className="lp-h2">Les deals que GeaiAI surveille.</h2>
          </div>

          <div className="lp-deals-grid">
            {topDeals.map((deal) => (
              <DealCard key={deal.code} deal={deal} />
            ))}
          </div>

          <div className="lp-center-link">
            <Link href="/deals" className="lp-cta-ghost">
              Voir les {allDeals.length} deals
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-6-6l6 6-6 6" /></svg>
            </Link>
          </div>
        </section>
      )}

      {/* ═══ PRICING ═══ */}
      <section className="lp-section">
        <div className="lp-section-header">
          <span className="lp-pill-badge lp-pill-badge-sm">Tarifs</span>
          <h2 className="lp-h2">Commence gratuitement.</h2>
        </div>

        <div className="lp-pricing-grid">
          <div className="lp-glass-card lp-price-card">
            <div className="lp-price-name">Gratuit</div>
            <div className="lp-price-amount">0$<span>/toujours</span></div>
            <div className="lp-price-features">
              {['Chat illimite avec GeaiAI', 'Palmares des deals', 'Courriel hebdo', 'Alertes de prix (hebdo)'].map((f, i) => (
                <div key={i} className="lp-price-feat">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  {f}
                </div>
              ))}
            </div>
            <Link href="/auth" className="lp-cta-ghost lp-price-btn">
              Commencer
            </Link>
          </div>

          <div className="lp-glass-card lp-price-card lp-price-card-pro">
            <div className="lp-price-card-pro-border" />
            <div className="lp-price-popular">Le + populaire</div>
            <div className="lp-price-name lp-price-name-pro">Premium</div>
            <div className="lp-price-amount lp-price-amount-pro">{PREMIUM_PRICE}$<span>/mois CAD</span></div>
            <div className="lp-price-features">
              {['Itineraires IA illimites', 'Alertes quotidiennes', 'Tous les deals sans limite', 'Calendrier des prix', 'Watchlist illimitee', 'Analyse IA vol + hotel'].map((f, i) => (
                <div key={i} className="lp-price-feat">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  {f}
                </div>
              ))}
            </div>
            <Link href="/pricing" className="lp-cta-glow lp-price-btn">
              <span className="lp-cta-glow-border" />
              <span className="lp-cta-glow-inner lp-price-btn-inner">Passer Premium</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="lp-section lp-final">
        <div className="lp-final-card">
          <div className="lp-final-glow" />
          <h2 className="lp-final-h2">Pret a trouver ton<br /><span className="lp-gradient-text">prochain vol?</span></h2>
          <p className="lp-final-p">Parle a GeaiAI. Gratuit, pas de compte requis.</p>
          <Link href="/agent" className="lp-cta-glow">
            <span className="lp-cta-glow-border" />
            <span className="lp-cta-glow-inner">
              Lancer GeaiAI
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-6-6l6 6-6 6" /></svg>
            </span>
          </Link>
        </div>
      </section>

      <FooterWithNewsletter />
    </div>
  );
}

/* ── Dark deal card ── */
function DealCard({ deal }: { deal: DealItem }) {
  const level = DEAL_LEVELS[deal.dealLevel];
  const country = CITY_COUNTRY[deal.city] || '';
  const flag = COUNTRY_FLAGS[country] || '';
  const bookingUrl = deal.bookingLink || `https://www.skyscanner.ca/transport/flights/yul/${(deal.code || '').toLowerCase()}/`;

  return (
    <div className="lp-glass-card lp-deal-card">
      <div className="lp-deal-img">
        <Image src={deal.image} alt={deal.city} fill sizes="(max-width: 640px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
        <div className="lp-deal-img-overlay" />
        {level && (
          <span className="lp-deal-badge" style={{ background: level.bg }}>
            {level.icon} {level.label}
          </span>
        )}
        {deal.discount > 0 && (
          <span className="lp-deal-pct">-{deal.discount}%</span>
        )}
      </div>
      <div className="lp-deal-body">
        <div className="lp-deal-top">
          <span className="lp-deal-city">{flag} {deal.city}</span>
          <span className="lp-deal-route">YUL → {deal.code}</span>
        </div>
        <div className="lp-deal-meta">
          {country}{deal.airline ? ` · ${deal.airline}` : ''}{deal.stops === 0 ? ' · Direct' : ''}
        </div>
        <div className="lp-deal-bottom">
          <div>
            {deal.oldPrice > deal.price && (
              <span className="lp-deal-old">{Math.round(deal.oldPrice)} $</span>
            )}
            <span className="lp-deal-price">{Math.round(deal.price)} $</span>
            <span className="lp-deal-ar">A/R</span>
          </div>
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="lp-deal-book">
            Reserver
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      </div>
    </div>
  );
}
