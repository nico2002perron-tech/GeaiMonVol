'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LandingHeader from '@/components/LandingHeader';
import FooterWithNewsletter from '@/components/layout/FooterWithNewsletter';
import { DEAL_LEVELS } from '@/lib/constants/deals';
import { CITY_COUNTRY, COUNTRY_FLAGS, mapPricesToDeals } from '@/lib/types/deals';
import type { DealItem } from '@/lib/types/deals';
import { PREMIUM_PRICE } from '@/lib/constants/premium';
import './landing.css';
import './deals.css';

const EMPTY_DEALS: any[] = [];

interface ClientLandingProps {
  initialDeals?: any[];
}

export default function ClientLanding({ initialDeals }: ClientLandingProps) {
  const stableInitial = initialDeals && initialDeals.length > 0 ? initialDeals : EMPTY_DEALS;
  const allDeals = useMemo(() => mapPricesToDeals(stableInitial), [stableInitial]);

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const topDeals = useMemo(() => allDeals.slice(0, 6), [allDeals]);

  const heroStats = useMemo(() => {
    const discounts = allDeals.filter(d => d.discount > 0).map(d => d.discount);
    const avg = discounts.length > 0 ? Math.round(discounts.reduce((a, b) => a + b, 0) / discounts.length) : 30;
    return { count: allDeals.length || 40, avg };
  }, [allDeals]);

  const handleSubscribe = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubscribed(true);
    } catch {
      setSubscribed(true);
    } finally {
      setSubmitting(false);
    }
  }, [email, submitting]);

  return (
    <div className="lp">
      <LandingHeader />

      {/* ═══ HERO ═══ */}
      <section className="lp-hero" style={{ minHeight: '85vh', display: 'flex', alignItems: 'center' }}>
        <div className="lp-ocean">
          <div className="lp-ocean-gradient" />
        </div>
        <div className="lp-hero-content" style={{ width: '100%' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
            <div className="lp-hero-badge">
              <span className="lp-hero-badge-dot" />
              {allDeals.length > 0 ? `${allDeals.length} deals en direct` : 'Scanning en direct'}
            </div>

            <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', lineHeight: 1.1, marginBottom: 16 }}>
              Les meilleurs deals de vols.{' '}
              <span>Livres dans ta boite.</span>
            </h1>

            <p className="lp-hero-sub" style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', maxWidth: 520, margin: '0 auto 32px' }}>
              Chaque semaine, on scanne les prix et on t&apos;envoie les deals les plus fous au depart de Montreal. <strong>Gratuit.</strong>
            </p>

            {!subscribed ? (
              <form onSubmit={handleSubscribe} style={{
                display: 'flex', gap: 8, maxWidth: 460, margin: '0 auto 16px',
                flexWrap: 'wrap', justifyContent: 'center',
              }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@courriel.com"
                  style={{
                    flex: '1 1 240px', padding: '14px 20px', borderRadius: 14,
                    border: '2px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff', fontSize: 16, fontFamily: "'Outfit', sans-serif",
                    outline: 'none', minHeight: 52,
                    backdropFilter: 'blur(8px)',
                  }}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="lp-btn-ocean"
                  style={{ minHeight: 52, fontSize: 15, padding: '14px 28px' }}
                >
                  <span className="lp-btn-ocean-glow" />
                  {submitting ? 'Un instant...' : "S'abonner gratuitement"}
                </button>
              </form>
            ) : (
              <div style={{
                padding: '16px 28px', borderRadius: 14,
                background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)',
                color: '#10B981', fontSize: 16, fontWeight: 700,
                fontFamily: "'Fredoka', sans-serif",
                maxWidth: 460, margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                Tu vas recevoir ton premier courriel bientot!
              </div>
            )}

            <p style={{
              fontSize: 12, color: 'rgba(255,255,255,0.35)',
              fontFamily: "'Outfit', sans-serif", margin: '0 0 40px',
            }}>
              Pas de spam. Desabonnement en 1 clic.
            </p>

            <div className="lp-hero-proof" style={{ justifyContent: 'center' }}>
              <div className="lp-hero-proof-item">
                <span className="lp-hero-proof-icon">📡</span>
                <div><strong>{heroStats.count}+</strong><span>destinations</span></div>
              </div>
              <div className="lp-hero-proof-sep" />
              <div className="lp-hero-proof-item">
                <span className="lp-hero-proof-icon">💰</span>
                <div><strong>-{heroStats.avg}%</strong><span>en moyenne</span></div>
              </div>
              <div className="lp-hero-proof-sep" />
              <div className="lp-hero-proof-item">
                <span className="lp-hero-proof-icon">⚡</span>
                <div><strong>24h</strong><span>mise a jour</span></div>
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

      {/* ═══ DEAL PREVIEW ═══ */}
      {topDeals.length > 0 && (
        <section style={{ background: '#F8FAFC', padding: '60px 24px 80px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <span className="lp-section-label">Cette semaine</span>
              <h2 className="lp-section-title">Les deals du moment</h2>
              <p style={{
                fontFamily: "'Outfit', sans-serif", fontSize: 16, color: '#64748B',
                margin: '8px 0 0', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto',
              }}>
                Voici un apercu de ce qu&apos;on envoie chaque semaine. Abonne-toi pour ne rien rater.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}>
              {topDeals.map((deal) => (
                <DealPreviewCard key={deal.code} deal={deal} />
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Link href="/deals" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 32px', borderRadius: 100,
                border: '2px solid #E2E8F0', background: 'white',
                color: '#0F172A', fontSize: 15, fontWeight: 700,
                fontFamily: "'Outfit', sans-serif", textDecoration: 'none',
                transition: 'all 0.2s',
              }}>
                Voir tous les {allDeals.length} deals
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-6-6l6 6-6 6" /></svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="lp-how" id="how">
        <div className="lp-how-header">
          <span className="lp-section-label">Simple comme bonjour</span>
          <h2 className="lp-section-title">Comment ca marche</h2>
        </div>
        <div className="lp-steps">
          <div className="lp-step">
            <div className="lp-step-icon lp-step-icon-1"><span>📧</span></div>
            <div className="lp-step-content">
              <div className="lp-step-num">01</div>
              <h3 className="lp-step-title">Inscris-toi</h3>
              <p className="lp-step-desc">Entre ton courriel et recois les meilleurs deals de vols depuis Montreal chaque semaine. Gratuit, sans engagement.</p>
            </div>
          </div>
          <div className="lp-step-arrow">
            <svg viewBox="0 0 80 24" fill="none">
              <path d="M0,12 L60,12" stroke="#BAE6FD" strokeWidth="2" strokeDasharray="6 4" />
              <path d="M55,6 L67,12 L55,18" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div className="lp-step">
            <div className="lp-step-icon lp-step-icon-2"><span>✈️</span></div>
            <div className="lp-step-content">
              <div className="lp-step-num">02</div>
              <h3 className="lp-step-title">Decouvre les deals</h3>
              <p className="lp-step-desc">On scanne Skyscanner chaque jour. Tu recois les vrais rabais — calcules sur 90 jours de donnees, pas des faux pourcentages.</p>
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
              <h3 className="lp-step-title">Planifie ton voyage</h3>
              <p className="lp-step-desc">Un deal te plait? Notre IA te genere un itineraire complet : activites, restos, budget. Tout en 30 secondes.</p>
              <span className="lp-step-premium">Premium</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ AI PLANNER SHOWCASE ═══ */}
      <section className="lp-ai-section">
        <div className="lp-ai-inner">
          <div className="lp-ai-text">
            <span className="lp-section-label">Planificateur IA</span>
            <h2 className="lp-ai-title">
              Ton itineraire complet.{' '}
              <span>En 30 secondes.</span>
            </h2>
            <p className="lp-ai-desc">
              Choisis ta destination, dis-nous tes vibes, et notre IA te genere un guide sur mesure : activites, restos, budget et horaire jour par jour.
            </p>
            <div className="lp-ai-features">
              <div className="lp-ai-feat">
                <span>🎯</span>
                <div>
                  <strong>Personnalise</strong>
                  <span>Adapte a ton style, ton budget et tes dates</span>
                </div>
              </div>
              <div className="lp-ai-feat">
                <span>⚡</span>
                <div>
                  <strong>Instantane</strong>
                  <span>Guide complet genere en moins de 30 secondes</span>
                </div>
              </div>
              <div className="lp-ai-feat">
                <span>🌍</span>
                <div>
                  <strong>Monde entier</strong>
                  <span>{heroStats.count}+ destinations couvertes</span>
                </div>
              </div>
            </div>
            <Link href="/planifier" className="lp-btn-ocean" style={{ marginTop: 8 }}>
              <span className="lp-btn-ocean-glow" />
              Essayer le planificateur
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-6-6l6 6-6 6" /></svg>
            </Link>
          </div>

          {/* Static mockup of the planner */}
          <div className="lp-ai-mockup">
            <div className="lp-ai-phone">
              <div className="lp-ai-phone-bar">
                <div className="lp-ai-phone-dot" />
                <span>GeaiMonVol — Guide IA</span>
              </div>
              <div className="lp-ai-phone-body">
                <div className="lp-ai-mock-dest">
                  <span className="lp-ai-mock-flag">🇪🇸</span>
                  <div>
                    <strong>Barcelone</strong>
                    <span>5 jours · Couple · Gastronomie</span>
                  </div>
                  <span className="lp-ai-mock-price">489$</span>
                </div>
                <div className="lp-ai-mock-day">
                  <div className="lp-ai-mock-day-num">Jour 1</div>
                  <div className="lp-ai-mock-item">
                    <span>🏛️</span> Sagrada Familia + Park Guell
                  </div>
                  <div className="lp-ai-mock-item">
                    <span>🍽️</span> Tapas au Mercat de la Boqueria
                  </div>
                  <div className="lp-ai-mock-item">
                    <span>🌅</span> Sunset au Bunkers del Carmel
                  </div>
                </div>
                <div className="lp-ai-mock-day">
                  <div className="lp-ai-mock-day-num">Jour 2</div>
                  <div className="lp-ai-mock-item">
                    <span>🏖️</span> Matinee a la Barceloneta
                  </div>
                  <div className="lp-ai-mock-item">
                    <span>🎨</span> Musee Picasso + El Born
                  </div>
                  <div className="lp-ai-mock-item lp-ai-mock-fade">
                    <span>🍷</span> Soiree au quartier Gracia...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section style={{ background: '#F8FAFC', padding: '96px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="lp-section-label">Tarifs</span>
            <h2 className="lp-section-title">Commence gratuitement</h2>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, color: '#64748B', margin: '8px 0 0' }}>
              Passe Premium quand tu veux planifier ton voyage avec l&apos;IA.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {/* Free */}
            <div style={{
              background: '#fff', borderRadius: 24, padding: '36px 28px',
              border: '1px solid #E2E8F0',
            }}>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Gratuit</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 42, fontWeight: 700, color: '#0F172A' }}>0$</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: '#94A3B8' }}>pour toujours</span>
              </div>
              {[
                '📧 Courriel hebdo avec les top deals',
                '📡 Acces au palmares des deals',
                '🔔 Alertes de prix (hebdo)',
                '🗺️ 1 guide IA — Quebec seulement',
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', fontFamily: "'Outfit', sans-serif", fontSize: 14, color: '#334155' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  {f}
                </div>
              ))}
            </div>

            {/* Premium */}
            <div style={{
              background: 'linear-gradient(135deg, #0F172A, #1E293B)',
              borderRadius: 24, padding: '36px 28px',
              border: '2px solid rgba(14,165,233,0.3)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: -12, right: 20,
                padding: '4px 14px', borderRadius: 100,
                background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
              }}>Le + populaire</div>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Premium</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 42, fontWeight: 700, color: '#0EA5E9' }}>{PREMIUM_PRICE}$</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>/mois CAD</span>
              </div>
              {[
                '📧 Alertes quotidiennes + prioritaires',
                '🗺️ Guides IA illimites — monde entier',
                '✈️ Tous les deals, aucune limite',
                '🏨 Analyse IA des packs vol + hotel',
                '📅 Calendrier des prix par destination',
                '👁️ Watchlist illimitee',
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', fontFamily: "'Outfit', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  {f}
                </div>
              ))}
              <Link href="/pricing" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 20, padding: '14px 24px', borderRadius: 14,
                background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                color: '#fff', fontSize: 15, fontWeight: 700,
                fontFamily: "'Outfit', sans-serif", textDecoration: 'none',
                minHeight: 48,
              }}>
                Passer Premium
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-6-6l6 6-6 6" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <FooterWithNewsletter />
    </div>
  );
}

/* ── Mini deal card for the landing page preview ── */
function DealPreviewCard({ deal }: { deal: DealItem }) {
  const level = DEAL_LEVELS[deal.dealLevel];
  const country = CITY_COUNTRY[deal.city] || '';
  const flag = COUNTRY_FLAGS[country] || '';
  const topColor = deal.dealLevel === 'lowest_ever' ? '#7C3AED'
    : deal.dealLevel === 'incredible' ? '#DC2626'
    : deal.dealLevel === 'great' ? '#F59E0B'
    : deal.dealLevel === 'good' ? '#10B981' : null;

  const bookingUrl = deal.bookingLink || `https://www.skyscanner.ca/transport/flights/yul/${(deal.code || '').toLowerCase()}/`;

  return (
    <div style={{
      background: '#fff', borderRadius: 18, overflow: 'hidden',
      border: topColor ? `2px solid ${topColor}30` : '1px solid #E2E8F0',
      transition: 'all 0.25s',
    }}>
      <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
        <Image src={deal.image} alt={deal.city} fill sizes="(max-width: 640px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
        {level && (
          <span style={{
            position: 'absolute', top: 10, right: 10,
            padding: '3px 10px', borderRadius: 100,
            background: level.bg, color: '#fff',
            fontSize: 10, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
          }}>
            {level.icon} {level.label}
          </span>
        )}
        {deal.discount > 0 && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            padding: '3px 8px', borderRadius: 6,
            background: 'rgba(0,0,0,0.6)', color: '#fff',
            fontSize: 11, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
          }}>
            -{deal.discount}%
          </span>
        )}
        <div style={{ position: 'absolute', bottom: 10, left: 12, color: '#fff', fontFamily: "'Fredoka', sans-serif" }}>
          <div style={{ fontSize: 18, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{flag} {deal.city}</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>
            {country}{deal.airline ? ` · ${deal.airline}` : ''}{deal.stops === 0 ? ' · Direct' : ''}
          </span>
          <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 700, color: '#0EA5E9', background: 'rgba(14,165,233,0.06)', padding: '2px 8px', borderRadius: 6 }}>
            YUL → {deal.code}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
          <div>
            {deal.oldPrice > deal.price && (
              <span style={{ fontSize: 12, color: '#94A3B8', textDecoration: 'line-through', marginRight: 6 }}>{Math.round(deal.oldPrice)} $</span>
            )}
            <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 24, fontWeight: 700, color: '#0EA5E9' }}>{Math.round(deal.price)} $</span>
            <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'Outfit', sans-serif", marginLeft: 4 }}>A/R</span>
          </div>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="deal-card__book-btn"
            style={{ fontSize: 12, padding: '8px 14px' }}
            onClick={(e) => e.stopPropagation()}
          >
            Reserver
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      </div>
    </div>
  );
}
