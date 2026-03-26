'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DealItem, COUNTRY_FLAGS } from '@/lib/types/deals';
import { DEAL_LEVELS } from '@/lib/constants/deals';
import { useAuth } from '@/lib/auth/AuthProvider';
import { usePremium } from '@/lib/hooks/usePremium';
import './planifier.css';

// ══════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════

const VIBE_CHOICES = [
  {
    question: "Qu'est-ce qui te fait tripper?",
    a: { id: 'plage', label: 'Plage & soleil', icon: '🏖️', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop' },
    b: { id: 'ville', label: 'Ville & culture', icon: '🏛️', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop' },
  },
  {
    question: 'Ton énergie en voyage?',
    a: { id: 'aventure', label: 'Aventure & adrénaline', icon: '🧗', img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop' },
    b: { id: 'detente', label: 'Relax & zen', icon: '🧘', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6e?w=600&h=400&fit=crop' },
  },
  {
    question: 'Ta priorité #1?',
    a: { id: 'gastronomie', label: 'Gastronomie', icon: '🍽️', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop' },
    b: { id: 'nightlife', label: 'Ambiance & nightlife', icon: '🎶', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop' },
  },
];

const DEST_VIBES: Record<string, string[]> = {
  plage: ['Cancún', 'Cancun', 'Punta Cana', 'Varadero', 'Bali', 'Montego Bay', 'Nassau', 'Fort Lauderdale', 'Miami', 'Phuket', 'Bridgetown', 'Freeport', 'Cuba (Varadero)'],
  ville: ['Paris', 'Barcelone', 'New York', 'Tokyo', 'Rome', 'Londres', 'Berlin', 'Amsterdam', 'Madrid', 'Lisbonne', 'Istanbul', 'Seoul', 'Bogota', 'Buenos Aires', 'Porto'],
  aventure: ['Reykjavik', 'Cusco', 'Lima', 'San Jose', 'San José', 'Medellin', 'Guatemala City', 'Marrakech', 'Ho Chi Minh', 'Hanoi', 'Belize City', 'Cartagena'],
  detente: ['Bali', 'Phuket', 'Bangkok', 'Cancún', 'Cancun', 'Punta Cana', 'Nassau', 'Bridgetown', 'Porto', 'Lisbonne', 'Varadero', 'Fort Lauderdale'],
  gastronomie: ['Paris', 'Rome', 'Tokyo', 'Osaka', 'Barcelone', 'Lisbonne', 'Porto', 'Lima', 'Bangkok', 'Marrakech', 'Istanbul', 'Buenos Aires'],
  nightlife: ['Barcelone', 'Berlin', 'Amsterdam', 'New York', 'Bogota', 'Buenos Aires', 'Bangkok', 'Cancún', 'Las Vegas', 'Montego Bay'],
};

const GROUPS = [
  { id: 'solo', icon: '🎒', label: 'Solo' },
  { id: 'couple', icon: '💑', label: 'Couple' },
  { id: 'friends', icon: '🎉', label: 'Amis' },
  { id: 'family', icon: '👨‍👩‍👧‍👦', label: 'Famille' },
];

const MONTHS = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

const VIBES_DIRECT = [
  { id: 'culture', icon: '🏛️', label: 'Culture' },
  { id: 'plage', icon: '🏖️', label: 'Plage' },
  { id: 'aventure', icon: '🧗', label: 'Aventure' },
  { id: 'gastronomie', icon: '🍽️', label: 'Gastro' },
  { id: 'nightlife', icon: '🎶', label: 'Nightlife' },
  { id: 'famille', icon: '👨‍👩‍👧', label: 'Famille' },
];

const CHEAP_MONTHS = [1, 2, 3, 4, 5, 10, 11];
const EXPENSIVE_MONTHS = [6, 7, 8, 12];

type Step = 'mode' | 'vibes' | 'when' | 'who' | 'reveal' | 'search' | 'details' | 'generating';

// ══════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════

export default function PlanifierClient({ deals }: { deals: DealItem[] }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isPremium } = usePremium();

  const [step, setStep] = useState<Step>('mode');

  // ── Inspire path ──
  const [vibeIdx, setVibeIdx] = useState(0);
  const [vibes, setVibes] = useState<string[]>([]);
  const [month, setMonth] = useState<number | null>(null);
  const [group, setGroup] = useState('couple');
  const [budget, setBudget] = useState(1200);

  // ── Direct path ──
  const [query, setQuery] = useState('');
  const [pickedDeal, setPickedDeal] = useState<DealItem | null>(null);
  const [depDate, setDepDate] = useState('');
  const [retDate, setRetDate] = useState('');
  const [vibe, setVibe] = useState('culture');

  // ── Common ──
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ═══ Search results (direct path) ═══
  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return deals.filter(d =>
      d.city.toLowerCase().includes(q) ||
      d.country.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, deals]);

  // ═══ Matched destinations (inspire path) ═══
  const matched = useMemo(() => {
    if (vibes.length === 0) return [];
    const scored = deals.map(deal => {
      let score = 0;
      for (const v of vibes) {
        if ((DEST_VIBES[v] || []).some(c => deal.city.includes(c) || c.includes(deal.city))) score += 1;
      }
      if (deal.dealLevel === 'lowest_ever') score += 2;
      else if (deal.dealLevel === 'incredible') score += 1.5;
      else if (deal.dealLevel === 'great') score += 1;
      else if (deal.dealLevel === 'good') score += 0.5;
      if (deal.price > budget) score -= 2;
      return { deal, score };
    });
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => ({ ...s, pct: Math.min(97, Math.round(52 + s.score * 14)) }));
  }, [vibes, deals, budget]);

  // ═══ Progress bar ═══
  const progress = useMemo(() => {
    const inspireSteps: Step[] = ['vibes', 'when', 'who', 'reveal'];
    const directSteps: Step[] = ['search', 'details', 'generating'];
    if (step === 'mode') return { total: 0, current: 0 };
    if (inspireSteps.includes(step)) return { total: 4, current: inspireSteps.indexOf(step) + 1 };
    return { total: 3, current: directSteps.indexOf(step) + 1 };
  }, [step]);

  // ═══ Back navigation ═══
  const goBack = useCallback(() => {
    const inspire: Step[] = ['mode', 'vibes', 'when', 'who', 'reveal'];
    const direct: Step[] = ['mode', 'search', 'details'];
    const flow = ['vibes', 'when', 'who', 'reveal'].includes(step) ? inspire : direct;
    const i = flow.indexOf(step);
    if (i > 0) {
      setStep(flow[i - 1]);
      if (step === 'vibes') { setVibes([]); setVibeIdx(0); }
      if (step === 'when') { setVibeIdx(0); }
    }
    setError('');
  }, [step]);

  // ═══ Vibe pick ═══
  const pickVibe = (id: string) => {
    const next = [...vibes, id];
    setVibes(next);
    if (vibeIdx < VIBE_CHOICES.length - 1) {
      setTimeout(() => setVibeIdx(vibeIdx + 1), 250);
    } else {
      setTimeout(() => setStep('when'), 350);
    }
  };

  // ═══ Generate itinerary ═══
  const generate = async (deal: DealItem) => {
    if (!user) { router.push('/auth'); return; }
    setLoading(true);
    setError('');
    setStep('generating');

    try {
      const res = await fetch('/api/guide/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: deal.city,
          destination_code: deal.code,
          country: deal.country,
          departure_date: depDate || deal.departureDate || undefined,
          return_date: retDate || deal.returnDate || undefined,
          price: deal.price,
          airline: deal.airline,
          stops: deal.stops,
          preferences: vibes.length > 0 ? vibes : [vibe],
          budget_style: budget < 600 ? 'budget' : budget > 1500 ? 'luxury' : 'moderate',
          quiz_context: {
            group,
            vibe: vibes[0] || vibe,
            interests: vibes.length > 0 ? vibes : [vibe],
            energy: 'mixed',
            food: ['all'],
            accommodation: 'hotel',
            transport: 'mixed',
          },
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Erreur de generation');
        setStep(vibes.length > 0 ? 'reveal' : 'details');
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.guide_id) router.push(`/library/${data.guide_id}`);
      else { setError('Guide genere mais pas de redirection.'); setStep('reveal'); }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setStep(vibes.length > 0 ? 'reveal' : 'details');
    } finally {
      setLoading(false);
    }
  };

  // helper
  const flag = (country: string) => COUNTRY_FLAGS[country] || '';
  const level = (dl: string) => DEAL_LEVELS[dl] || DEAL_LEVELS.normal;

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════

  return (
    <div className="planner">

      {/* ── Top bar ── */}
      {step === 'mode' && (
        <Link href="/" className="planner-home">GeaiMonVol</Link>
      )}
      {step !== 'mode' && (
        <>
          <div className="planner-progress">
            <div className="planner-progress-bar">
              {Array.from({ length: progress.total }).map((_, i) => (
                <div key={i} className={`planner-progress-seg ${i < progress.current - 1 ? 'done' : ''} ${i === progress.current - 1 ? 'active' : ''}`} />
              ))}
            </div>
          </div>
          {step !== 'generating' && (
            <button className="planner-back" onClick={goBack} aria-label="Retour">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5m7-7l-7 7 7 7" /></svg>
            </button>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════
           STEP: MODE SELECT
           ═══════════════════════════════════════ */}
      {step === 'mode' && (
        <div className="planner-step">
          <div className="step-title">Planifie ton voyage</div>
          <div className="step-subtitle">En 30 secondes, on te trouve la destination parfaite et on planifie tout.</div>

          <div className="mode-grid">
            <button className="mode-card mode-inspire" onClick={() => setStep('vibes')}>
              <div className="mode-icon">✨</div>
              <div className="mode-title">Inspire-moi</div>
              <div className="mode-desc">J'sais pas trop ou aller. Trouve-moi LA destination parfaite.</div>
            </button>
            <button className="mode-card mode-direct" onClick={() => setStep('search')}>
              <div className="mode-icon">🎯</div>
              <div className="mode-title">J'sais ou j'vais</div>
              <div className="mode-desc">Montre-moi les deals et cree mon itineraire.</div>
            </button>
          </div>

          <Link href="/deals" style={{ marginTop: 36, fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'underline' }}>
            Ou explore tous les deals →
          </Link>
        </div>
      )}

      {/* ═══════════════════════════════════════
           STEP: VIBES (Inspire — "ça ou ça?")
           ═══════════════════════════════════════ */}
      {step === 'vibes' && vibeIdx < VIBE_CHOICES.length && (
        <div className="planner-step" key={`v${vibeIdx}`}>
          <div className="step-counter">{vibeIdx + 1} / {VIBE_CHOICES.length}</div>
          <div className="step-title">{VIBE_CHOICES[vibeIdx].question}</div>
          <div className="step-subtitle">Tap ton choix.</div>

          <div className="vibe-pair">
            {[VIBE_CHOICES[vibeIdx].a, VIBE_CHOICES[vibeIdx].b].map(opt => (
              <button key={opt.id} className="vibe-card" onClick={() => pickVibe(opt.id)}>
                <div className="vibe-card-bg" style={{ backgroundImage: `url(${opt.img})` }} />
                <div className="vibe-card-overlay" />
                <div className="vibe-card-label">
                  <span className="vibe-icon">{opt.icon}</span>
                  <span className="vibe-text">{opt.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
           STEP: WHEN (Month picker)
           ═══════════════════════════════════════ */}
      {step === 'when' && (
        <div className="planner-step">
          <div className="step-title">Quand tu pars?</div>
          <div className="step-subtitle">Les points verts = meilleurs prix en general.</div>

          <div className="month-grid">
            {MONTHS.map((name, i) => {
              const m = i + 1;
              const dot = CHEAP_MONTHS.includes(m) ? 'cheap' : EXPENSIVE_MONTHS.includes(m) ? 'expensive' : 'moderate';
              return (
                <button
                  key={name}
                  className={`month-btn ${month === i ? 'selected' : ''}`}
                  onClick={() => { setMonth(i); setTimeout(() => setStep('who'), 300); }}
                >
                  <div className="month-name">{name}</div>
                  <span className={`month-dot ${dot}`} />
                </button>
              );
            })}
          </div>

          <div className="month-legend">
            <span><span className="month-dot cheap" /> Bon prix</span>
            <span><span className="month-dot moderate" /> Moyen</span>
            <span><span className="month-dot expensive" /> Cher</span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
           STEP: WHO + BUDGET
           ═══════════════════════════════════════ */}
      {step === 'who' && (
        <div className="planner-step">
          <div className="step-title">Qui vient?</div>
          <div className="step-subtitle">Et ton budget max par personne (vol A/R).</div>

          <div className="avatar-grid">
            {GROUPS.map(g => (
              <button key={g.id} className={`avatar-btn ${group === g.id ? 'selected' : ''}`} onClick={() => setGroup(g.id)}>
                <span className="avatar-emoji">{g.icon}</span>
                <span className="avatar-label">{g.label}</span>
              </button>
            ))}
          </div>

          <div className="budget-wrap">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Budget vol</span>
              <span className="budget-value">{budget}$</span>
            </div>
            <input type="range" min={200} max={2000} step={50} value={budget} onChange={e => setBudget(+e.target.value)} className="budget-slider" />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>200$</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>2 000$</span>
            </div>
          </div>

          <button className="btn btn-primary" style={{ marginTop: 36 }} onClick={() => setStep('reveal')}>
            Voir mes matchs ✨
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════
           STEP: REVEAL (Inspire results)
           ═══════════════════════════════════════ */}
      {step === 'reveal' && (
        <div className="planner-step">
          <div className="step-title">{matched.length > 0 ? 'Tes matchs parfaits' : 'Aucun match'}</div>
          <div className="step-subtitle">
            {matched.length > 0
              ? `${deals.length} destinations analysees. Voici ton top ${matched.length}.`
              : 'Essaie un budget plus eleve ou d\'autres vibes.'}
          </div>

          {error && (
            <div className="planner-error">
              {error}
              {error.includes('Premium') && <Link href="/pricing">Voir les plans Premium →</Link>}
            </div>
          )}

          <div className="reveal-list">
            {matched.map(({ deal, pct }, i) => {
              const lv = level(deal.dealLevel);
              return (
                <div key={deal.code + i} className="reveal-card">
                  <div className="reveal-img" style={{ backgroundImage: `url(${deal.image})` }} />
                  <div className="reveal-info">
                    <div className="reveal-match">{pct}% match</div>
                    <div className="reveal-city">{flag(deal.country)} {deal.city}</div>
                    <div className="reveal-country">{deal.country}</div>
                    <div className="reveal-price-row">
                      <span className="reveal-price">{deal.price}$</span>
                      {deal.oldPrice > 0 && <span className="reveal-old-price">{deal.oldPrice}$</span>}
                      {deal.discount > 0 && (
                        <span className="deal-tag" style={{ background: lv.bg, color: lv.textColor || '#fff' }}>
                          {lv.icon} -{deal.discount}%
                        </span>
                      )}
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 14 }}
                      onClick={() => generate(deal)}
                      disabled={loading}
                    >
                      {loading ? <span className="spinner" /> : 'Planifier ce voyage →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {matched.length === 0 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => { setVibes([]); setVibeIdx(0); setStep('vibes'); }}>
                Recommencer
              </button>
              <Link href="/deals" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Explorer les deals
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════
           STEP: SEARCH (Direct path)
           ═══════════════════════════════════════ */}
      {step === 'search' && (
        <div className="planner-step">
          <div className="step-title">Ou veux-tu aller?</div>
          <div className="step-subtitle">Tape une destination pour voir les deals en direct.</div>

          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Paris, Cancun, Tokyo, Bali..."
              autoFocus
            />

            {results.length > 0 && (
              <div className="search-results">
                {results.map((d, i) => {
                  const lv = level(d.dealLevel);
                  return (
                    <button
                      key={d.code + i}
                      className="search-item"
                      onClick={() => { setPickedDeal(d); setQuery(''); setStep('details'); }}
                    >
                      <div className="search-item-thumb" style={{ backgroundImage: `url(${d.image})` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="search-item-city">{flag(d.country)} {d.city}</div>
                        <div className="search-item-meta">{d.country} · {d.code}</div>
                      </div>
                      <div>
                        <div className="search-item-price">{d.price}$</div>
                        {d.discount > 0 && (
                          <span className="deal-tag" style={{ background: lv.bg, color: lv.textColor || '#fff', fontSize: 10 }}>
                            -{d.discount}%
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {query.length >= 2 && results.length === 0 && (
              <div className="search-results" style={{ padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>Aucun deal pour « {query} »</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>Essaie un autre nom</div>
              </div>
            )}
          </div>

          {/* Popular quick picks */}
          <div style={{ marginTop: 40, maxWidth: 480, width: '100%' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10, fontWeight: 700, letterSpacing: 0.5 }}>
              DESTINATIONS POPULAIRES
            </div>
            <div className="chip-row">
              {deals.slice(0, 8).map((d, i) => (
                <button key={d.code + i} className="chip" onClick={() => { setPickedDeal(d); setStep('details'); }}>
                  {flag(d.country)} {d.city} · {d.price}$
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
           STEP: DETAILS (Direct path — customize)
           ═══════════════════════════════════════ */}
      {step === 'details' && pickedDeal && (
        <div className="planner-step">
          <div className="step-title">{flag(pickedDeal.country)} {pickedDeal.city}</div>
          <div className="step-subtitle">Personnalise et genere ton itineraire.</div>

          <div className="detail-form">
            {/* Deal banner */}
            <div className="detail-banner">
              <div className="detail-banner-img" style={{ backgroundImage: `url(${pickedDeal.image})` }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{pickedDeal.city}, {pickedDeal.country}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span className="detail-banner-price">{pickedDeal.price}$</span>
                  {pickedDeal.oldPrice > 0 && (
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' }}>{pickedDeal.oldPrice}$</span>
                  )}
                  {pickedDeal.discount > 0 && (() => {
                    const lv = level(pickedDeal.dealLevel);
                    return <span className="deal-tag" style={{ background: lv.bg, color: lv.textColor || '#fff' }}>{lv.icon} -{pickedDeal.discount}%</span>;
                  })()}
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Depart</label>
                <input type="date" value={depDate} onChange={e => setDepDate(e.target.value)} className="form-input" />
              </div>
              <div className="form-field">
                <label className="form-label">Retour</label>
                <input type="date" value={retDate} onChange={e => setRetDate(e.target.value)} className="form-input" />
              </div>
            </div>

            {/* Group */}
            <label className="form-label">Tu voyages...</label>
            <div className="chip-row">
              {GROUPS.map(g => (
                <button key={g.id} className={`chip ${group === g.id ? 'on' : ''}`} onClick={() => setGroup(g.id)}>
                  {g.icon} {g.label}
                </button>
              ))}
            </div>

            {/* Vibe */}
            <label className="form-label">Ton vibe</label>
            <div className="chip-row">
              {VIBES_DIRECT.map(v => (
                <button key={v.id} className={`chip ${vibe === v.id ? 'on' : ''}`} onClick={() => setVibe(v.id)}>
                  {v.icon} {v.label}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="planner-error">
                {error}
                {error.includes('Premium') && <Link href="/pricing">Voir les plans Premium →</Link>}
              </div>
            )}

            {/* CTA */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '16px 24px' }}
              onClick={() => generate(pickedDeal)}
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Generation en cours...</> : 'Generer mon itineraire →'}
            </button>

            {!isPremium && (
              <p style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
                Gratuit pour le Quebec · <Link href="/pricing" style={{ color: '#0EA5E9' }}>Premium</Link> pour le monde entier
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
           STEP: GENERATING (Loading)
           ═══════════════════════════════════════ */}
      {step === 'generating' && (
        <div className="planner-step">
          <div className="loading-globe">🌍</div>
          <div className="step-title" style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}>GeaiAI planifie ton voyage...</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
            Restaurants, activites, directions, tips d'inities... On prepare tout pour toi.
          </div>
        </div>
      )}
    </div>
  );
}
