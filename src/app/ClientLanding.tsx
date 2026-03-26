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

      {/* ═══ HERO — Product-first ═══ */}
      <section className="lp-hero" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center' }}>
        <div className="lp-ocean">
          <div className="lp-ocean-gradient" />
        </div>
        <div className="lp-hero-content" style={{ width: '100%' }}>
          <div style={{ maxWidth: 740, margin: '0 auto', textAlign: 'center' }}>
            <div className="lp-hero-badge">
              <span className="lp-hero-badge-dot" />
              {allDeals.length > 0 ? `${allDeals.length} deals en direct` : 'Scanning en direct'}
            </div>

            <h1 style={{ fontSize: 'clamp(36px, 7vw, 64px)', lineHeight: 1.05, marginBottom: 20, letterSpacing: '-1px' }}>
              Ton agent de voyage IA.{' '}
              <span>Il connait tous les deals.</span>
            </h1>

            <p className="lp-hero-sub" style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', maxWidth: 560, margin: '0 auto 36px' }}>
              GeaiAI scanne les prix en direct et te trouve les meilleurs vols depuis Montreal. Dis-lui ou tu veux aller.
            </p>

            {/* Primary CTA — Talk to agent */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              <Link href="/agent" className="lp-btn-ocean" style={{ fontSize: 17, padding: '18px 36px', minHeight: 56 }}>
                <span className="lp-btn-ocean-glow" />
                Parler avec GeaiAI
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-6-6l6 6-6 6" /></svg>
              </Link>
              <Link href="/deals" className="lp-btn-glass" style={{ fontSize: 15, padding: '16px 28px' }}>
                Voir les deals
              </Link>
            </div>

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", margin: '0 0 44px' }}>
              Gratuit. Aucun compte requis.
            </p>

            {/* Stats */}
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

      {/* ═══ AGENT PREVIEW — Show, don't tell ═══ */}
      <section style={{ background: '#F8FAFC', padding: '60px 24px 0' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className="lp-preview-phone">
            <div className="lp-preview-bar">
              <div className="lp-preview-bar-dot" />
              <span>GeaiAI — Agent de voyage</span>
            </div>
            <div className="lp-preview-chat">
              <div className="lp-preview-msg lp-preview-user">
                <div className="lp-preview-bubble lp-preview-bubble-user">Je veux du beach pas cher, max 500$</div>
              </div>
              <div className="lp-preview-msg lp-preview-ai">
                <div className="lp-preview-avatar">🐦</div>
                <div className="lp-preview-bubble lp-preview-bubble-ai">
                  Ayoye j&apos;ai exactement ce qu&apos;il te faut! 🏖️{'\n\n'}
                  Check ca:{'\n'}
                  {topDeals.slice(0, 3).map((d, i) => (
                    <span key={i}>
                      {COUNTRY_FLAGS[CITY_COUNTRY[d.city] || ''] || ''} <strong>{d.city}</strong> — {Math.round(d.price)}$ A/R
                      {d.discount > 0 ? ` (-${d.discount}%)` : ''}
                      {i < 2 ? '\n' : ''}
                    </span>
                  ))}
                  {topDeals.length === 0 && (
                    <>🇲🇽 <strong>Cancun</strong> — 389$ A/R (-32%){'\n'}🇩🇴 <strong>Punta Cana</strong> — 425$ A/R (-28%){'\n'}🇨🇺 <strong>Varadero</strong> — 449$ A/R</>
                  )}
                  {'\n\n'}Tu veux que je te planifie un itineraire? 🗺️
                </div>
              </div>
            </div>
            <div className="lp-preview-input">
              <span>Ecris ton message...</span>
              <Link href="/agent" className="lp-preview-try">Essayer</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DEAL PREVIEW ═══ */}
      {topDeals.length > 0 && (
        <section style={{ background: '#F8FAFC', padding: '60px 24px 80px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <span className="lp-section-label">En direct</span>
              <h2 className="lp-section-title">Les deals que GeaiAI surveille</h2>
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
          <span className="lp-section-label">Comment ca marche</span>
          <h2 className="lp-section-title">Simple comme bonjour</h2>
        </div>
        <div className="lp-steps">
          <div className="lp-step">
            <div className="lp-step-icon lp-step-icon-1"><span>💬</span></div>
            <div className="lp-step-content">
              <div className="lp-step-num">01</div>
              <h3 className="lp-step-title">Parle a GeaiAI</h3>
              <p className="lp-step-desc">Dis-lui ou tu veux aller, ton budget, tes vibes. Il connait tous les deals en direct depuis Montreal.</p>
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
              <h3 className="lp-step-title">Choisis ton deal</h3>
              <p className="lp-step-desc">L&apos;agent te montre les vrais prix — calcules sur 90 jours de donnees. Pas de faux rabais.</p>
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
              <h3 className="lp-step-title">Reserve ou planifie</h3>
              <p className="lp-step-desc">Reserve directement sur Skyscanner, ou demande a l&apos;agent un itineraire complet avec l&apos;IA.</p>
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
              Passe Premium quand tu veux debloquer tout le potentiel de l&apos;agent.
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
                '💬 Chat illimite avec GeaiAI',
                '📡 Acces au palmares des deals',
                '📧 Courriel hebdo avec les top deals',
                '🔔 Alertes de prix (hebdo)',
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
                '🗺️ Itineraires IA complets — monde entier',
                '📧 Alertes quotidiennes + prioritaires',
                '✈️ Tous les deals, aucune limite',
                '📅 Calendrier des prix par destination',
                '👁️ Watchlist illimitee',
                '🏨 Analyse IA des packs vol + hotel',
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

      {/* ═══ NEWSLETTER (secondary) ═══ */}
      <section style={{ background: 'white', padding: '64px 24px' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
            Recois les deals par courriel
          </h3>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>
            Chaque semaine, les meilleurs deals directement dans ta boite. Gratuit, pas de spam.
          </p>
          {!subscribed ? (
            <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 8, maxWidth: 440, margin: '0 auto' }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@courriel.com"
                style={{
                  flex: 1, padding: '14px 18px', borderRadius: 14,
                  border: '1.5px solid #E2E8F0', background: '#fff',
                  color: '#0F172A', fontSize: 15, fontFamily: "'Outfit', sans-serif",
                  outline: 'none',
                }}
              />
              <button type="submit" disabled={submitting} className="lp-btn-ocean" style={{ padding: '14px 24px', fontSize: 14 }}>
                <span className="lp-btn-ocean-glow" />
                {submitting ? '...' : "S'abonner"}
              </button>
            </form>
          ) : (
            <div style={{
              padding: '14px 24px', borderRadius: 14,
              background: '#ECFDF5', border: '1.5px solid #A7F3D0',
              color: '#059669', fontSize: 15, fontWeight: 600, fontFamily: "'Fredoka', sans-serif",
            }}>
              Tu vas recevoir ton premier courriel bientot!
            </div>
          )}
        </div>
      </section>

      <FooterWithNewsletter />
    </div>
  );
}

/* ── Deal card ── */
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
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="deal-card__book-btn" style={{ fontSize: 12, padding: '8px 14px' }} onClick={(e) => e.stopPropagation()}>
            Reserver
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      </div>
    </div>
  );
}
