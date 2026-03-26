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
// Data
// ══════════════════════════════════════════════

const VIBE_CHOICES = [
  {
    q: "Qu'est-ce qui te fait tripper?",
    a: { id: 'plage', label: 'Plage & soleil', icon: '🏖️', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&h=900&fit=crop' },
    b: { id: 'ville', label: 'Ville & culture', icon: '🏛️', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=900&h=900&fit=crop' },
  },
  {
    q: 'Ton energie en voyage?',
    a: { id: 'aventure', label: 'Aventure', icon: '🧗', img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=900&h=900&fit=crop' },
    b: { id: 'detente', label: 'Relax & zen', icon: '🧘', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6e?w=900&h=900&fit=crop' },
  },
  {
    q: 'Ta priorite #1?',
    a: { id: 'gastronomie', label: 'Gastronomie', icon: '🍽️', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&h=900&fit=crop' },
    b: { id: 'nightlife', label: 'Nightlife', icon: '🎶', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&h=900&fit=crop' },
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

const MONTHS = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
const CHEAP = [1, 2, 3, 4, 5, 10, 11];
const EXPENSIVE = [6, 7, 8, 12];

const VIBES_DIRECT = [
  { id: 'culture', icon: '🏛️', label: 'Culture' },
  { id: 'plage', icon: '🏖️', label: 'Plage' },
  { id: 'aventure', icon: '🧗', label: 'Aventure' },
  { id: 'gastronomie', icon: '🍽️', label: 'Gastro' },
  { id: 'nightlife', icon: '🎶', label: 'Nightlife' },
  { id: 'famille', icon: '👨‍👩‍👧', label: 'Famille' },
];

type Step = 'entry' | 'vibes' | 'when' | 'who' | 'reveal' | 'detail' | 'loading';

// ══════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════

export default function PlanifierClient({ deals }: { deals: DealItem[] }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isPremium } = usePremium();

  const [step, setStep] = useState<Step>('entry');

  // Inspire
  const [vi, setVi] = useState(0);
  const [vibes, setVibes] = useState<string[]>([]);
  const [month, setMonth] = useState<number | null>(null);
  const [group, setGroup] = useState('couple');
  const [budget, setBudget] = useState(1200);

  // Direct
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<DealItem | null>(null);
  const [dep, setDep] = useState('');
  const [ret, setRet] = useState('');
  const [vibe, setVibe] = useState('culture');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Helpers ──
  const fl = (c: string) => COUNTRY_FLAGS[c] || '';
  const lv = (d: string) => DEAL_LEVELS[d] || DEAL_LEVELS.normal;

  // ── Search ──
  const results = useMemo(() => {
    if (!q || q.length < 2) return [];
    const lo = q.toLowerCase();
    return deals.filter(d =>
      d.city.toLowerCase().includes(lo) || d.country.toLowerCase().includes(lo) || d.code.toLowerCase().includes(lo)
    ).slice(0, 8);
  }, [q, deals]);

  // ── Matched destinations ──
  const matched = useMemo(() => {
    if (vibes.length === 0) return [];
    const scored = deals.map(deal => {
      let s = 0;
      for (const v of vibes) if ((DEST_VIBES[v] || []).some(c => deal.city.includes(c) || c.includes(deal.city))) s++;
      if (deal.dealLevel === 'lowest_ever') s += 2;
      else if (deal.dealLevel === 'incredible') s += 1.5;
      else if (deal.dealLevel === 'great') s += 1;
      else if (deal.dealLevel === 'good') s += 0.5;
      if (deal.price > budget) s -= 2;
      return { deal, s };
    });
    return scored.filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3)
      .map(x => ({ ...x, pct: Math.min(97, Math.round(52 + x.s * 14)) }));
  }, [vibes, deals, budget]);

  // ── Budget counter ──
  const inBudget = useMemo(() => deals.filter(d => d.price <= budget).length, [deals, budget]);

  // ── Progress ──
  const inspireSteps: Step[] = ['vibes', 'when', 'who', 'reveal'];
  const directSteps: Step[] = ['detail', 'loading'];
  const progress = useMemo(() => {
    if (step === 'entry') return null;
    if (inspireSteps.includes(step)) return { total: 4, cur: inspireSteps.indexOf(step) + 1 };
    if (directSteps.includes(step)) return { total: 2, cur: directSteps.indexOf(step) + 1 };
    return null;
  }, [step]);

  // ── Navigation ──
  const goBack = useCallback(() => {
    const iFlow: Step[] = ['entry', 'vibes', 'when', 'who', 'reveal'];
    const dFlow: Step[] = ['entry', 'detail'];
    const flow = inspireSteps.includes(step) ? iFlow : dFlow;
    const i = flow.indexOf(step);
    if (i > 0) { setStep(flow[i - 1]); if (step === 'vibes') { setVibes([]); setVi(0); } }
    setError('');
  }, [step]);

  // ── Vibe pick (full-screen split) ──
  const pickVibe = (id: string) => {
    setVibes(prev => [...prev, id]);
    if (vi < VIBE_CHOICES.length - 1) setTimeout(() => setVi(vi + 1), 300);
    else setTimeout(() => setStep('when'), 400);
  };

  // ── Generate ──
  const generate = async (deal: DealItem) => {
    if (!user) { router.push('/auth'); return; }
    setLoading(true); setError(''); setStep('loading');
    try {
      const res = await fetch('/api/guide/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: deal.city, destination_code: deal.code, country: deal.country,
          departure_date: dep || deal.departureDate || undefined,
          return_date: ret || deal.returnDate || undefined,
          price: deal.price, airline: deal.airline, stops: deal.stops,
          preferences: vibes.length > 0 ? vibes : [vibe],
          budget_style: budget < 600 ? 'budget' : budget > 1500 ? 'luxury' : 'moderate',
          quiz_context: { group, vibe: vibes[0] || vibe, interests: vibes.length > 0 ? vibes : [vibe], energy: 'mixed', food: ['all'], accommodation: 'hotel', transport: 'mixed' },
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Erreur'); setStep(vibes.length > 0 ? 'reveal' : 'detail'); setLoading(false); return;
      }
      const data = await res.json();
      if (data.guide_id) router.push(`/library/${data.guide_id}`);
      else { setError('Erreur de redirection'); setStep('reveal'); }
    } catch (e: any) {
      setError(e.message || 'Erreur'); setStep(vibes.length > 0 ? 'reveal' : 'detail');
    } finally { setLoading(false); }
  };

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════

  return (
    <div className="planner">

      {/* ── Chrome (progress + back + logo) ── */}
      {progress && (
        <div className="p-chrome">
          {step !== 'loading' && (
            <button className="p-back" onClick={goBack} aria-label="Retour">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5m7-7l-7 7 7 7" /></svg>
            </button>
          )}
          <div className="p-progress">
            {Array.from({ length: progress.total }).map((_, i) => (
              <div key={i} className={`p-seg ${i < progress.cur - 1 ? 'done' : ''} ${i === progress.cur - 1 ? 'active' : ''}`} />
            ))}
          </div>
          <Link href="/" className="p-logo">GeaiMonVol</Link>
        </div>
      )}

      {/* ═══════════════════════════════════════════
           ENTRY — Search + Inspire + Trending
           ═══════════════════════════════════════════ */}
      {step === 'entry' && (
        <div className="entry">
          <div className="entry-emoji">✈️</div>
          <h1 className="entry-title">Ou tu t'envoles?</h1>
          <p className="entry-sub">Trouve les meilleurs deals et planifie ton voyage en 30 secondes.</p>

          {/* Search */}
          <div className="entry-search">
            <span className="entry-search-icon">🔍</span>
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Paris, Cancun, Tokyo, Bali..."
              autoFocus
            />
            {results.length > 0 && (
              <div className="s-dropdown">
                {results.map((d, i) => {
                  const l = lv(d.dealLevel);
                  return (
                    <button key={d.code + i} className="s-item" onClick={() => { setPicked(d); setQ(''); setStep('detail'); }}>
                      <div className="s-thumb" style={{ backgroundImage: `url(${d.image})` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="s-city">{fl(d.country)} {d.city}</div>
                        <div className="s-meta">{d.country} · {d.code}</div>
                      </div>
                      <div>
                        <div className="s-price">{d.price}$</div>
                        {d.discount > 0 && (
                          <span className="deal-tag" style={{ background: l.bg, color: l.textColor || '#fff' }}>-{d.discount}%</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {q.length >= 2 && results.length === 0 && (
              <div className="s-dropdown" style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                Aucun deal pour « {q} »
              </div>
            )}
          </div>

          {/* Inspire CTA */}
          <button className="inspire-cta" onClick={() => { setStep('vibes'); setVi(0); setVibes([]); }}>
            ✨ J'sais pas encore — inspire-moi
          </button>

          {/* Trending deals */}
          {deals.length > 0 && (
            <div className="trending">
              <div className="trending-label">En ce moment</div>
              <div className="trending-row">
                {deals.slice(0, 10).map((d, i) => (
                  <button key={d.code + i} className="trending-card" onClick={() => { setPicked(d); setStep('detail'); }}>
                    <div className="trending-card-img" style={{ backgroundImage: `url(${d.image})` }} />
                    <div className="trending-card-body">
                      <div className="trending-card-city">{fl(d.country)} {d.city}</div>
                      <div className="trending-card-price">{d.price}$</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Link href="/" style={{ marginTop: 32, fontSize: 12, color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
            ← Retour a l'accueil
          </Link>
        </div>
      )}

      {/* ═══════════════════════════════════════════
           VIBES — Full-screen split "ça ou ça?"
           ═══════════════════════════════════════════ */}
      {step === 'vibes' && vi < VIBE_CHOICES.length && (
        <div className="vibe-screen" key={`v${vi}`}>
          {/* Question overlay */}
          <div className="vibe-question">
            <div className="vibe-q-counter">{vi + 1} / {VIBE_CHOICES.length}</div>
            <div className="vibe-q-text">{VIBE_CHOICES[vi].q}</div>
            <div className="vibe-q-hint">Choisis un cote.</div>
          </div>

          {/* 50/50 split */}
          <div className="vibe-split">
            {[VIBE_CHOICES[vi].a, VIBE_CHOICES[vi].b].map(opt => (
              <button key={opt.id} className="vibe-half" onClick={() => pickVibe(opt.id)}>
                <div className="vibe-half-bg" style={{ backgroundImage: `url(${opt.img})` }} />
                <div className="vibe-half-overlay" />
                <div className="vibe-half-label">
                  <span className="vibe-half-icon">{opt.icon}</span>
                  <span className="vibe-half-text">{opt.label}</span>
                </div>
              </button>
            ))}
            <div className="vibe-or">ou</div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
           WHEN — Month picker
           ═══════════════════════════════════════════ */}
      {step === 'when' && (
        <div className="step">
          <h2 className="step-title">Quand tu decolles?</h2>
          <p className="step-sub">Les points verts = meilleurs prix en general.</p>

          <div className="month-grid">
            {MONTHS.map((name, i) => {
              const m = i + 1;
              const dot = CHEAP.includes(m) ? 'cheap' : EXPENSIVE.includes(m) ? 'expensive' : 'mid';
              return (
                <button key={name} className={`month-btn ${month === i ? 'on' : ''}`} onClick={() => { setMonth(i); setTimeout(() => setStep('who'), 300); }}>
                  <div className="m-name">{name}</div>
                  <span className={`m-dot ${dot}`} />
                </button>
              );
            })}
          </div>

          <div className="m-legend">
            <span><span className="m-dot cheap" /> Bon prix</span>
            <span><span className="m-dot mid" /> Moyen</span>
            <span><span className="m-dot expensive" /> Cher</span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
           WHO + BUDGET
           ═══════════════════════════════════════════ */}
      {step === 'who' && (
        <div className="step">
          <h2 className="step-title">Derniere question.</h2>
          <p className="step-sub">Qui vient et c'est quoi ton budget vol?</p>

          <div className="who-grid">
            {GROUPS.map(g => (
              <button key={g.id} className={`who-btn ${group === g.id ? 'on' : ''}`} onClick={() => setGroup(g.id)}>
                <span className="who-emoji">{g.icon}</span>
                <span className="who-label">{g.label}</span>
              </button>
            ))}
          </div>

          <div className="budget-area">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Budget par personne</span>
              <span className="budget-val">{budget}$</span>
            </div>
            <input type="range" min={200} max={2000} step={50} value={budget} onChange={e => setBudget(+e.target.value)} className="budget-slider" />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>200$</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>2 000$</span>
            </div>
            <div className="budget-counter"><strong>{inBudget}</strong> destinations dans ton budget</div>
          </div>

          <button className="btn btn-cyan" style={{ marginTop: 36, padding: '18px 36px', fontSize: 17 }} onClick={() => setStep('reveal')}>
            Voir mes matchs ✨
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════
           REVEAL — Big result cards
           ═══════════════════════════════════════════ */}
      {step === 'reveal' && (
        <div className="step">
          <h2 className="step-title">{matched.length > 0 ? 'Tes matchs parfaits' : 'Aucun match'}</h2>
          <p className="step-sub">
            {matched.length > 0
              ? `${deals.length} destinations analysees. Voici ton top ${matched.length}.`
              : 'Essaie un budget plus eleve ou d\'autres vibes.'}
          </p>

          {error && (
            <div className="planner-error">
              {error}
              {error.includes('Premium') && <Link href="/pricing">Voir les plans Premium →</Link>}
            </div>
          )}

          <div className="reveal-list">
            {matched.map(({ deal, pct }, i) => {
              const l = lv(deal.dealLevel);
              return (
                <div key={deal.code + i} className="reveal-card">
                  <div className="reveal-hero" style={{ backgroundImage: `url(${deal.image})` }}>
                    <div className="reveal-hero-overlay" />
                    <div className="reveal-hero-match">{pct}% match</div>
                  </div>
                  <div className="reveal-body">
                    <div className="reveal-city">{fl(deal.country)} {deal.city}</div>
                    <div className="reveal-country">{deal.country}</div>
                    <div className="reveal-price-row">
                      <span className="reveal-price">{deal.price}$</span>
                      {deal.oldPrice > 0 && <span className="reveal-old">{deal.oldPrice}$</span>}
                      {deal.discount > 0 && (
                        <span className="deal-tag" style={{ background: l.bg, color: l.textColor || '#fff' }}>{l.icon} -{deal.discount}%</span>
                      )}
                    </div>
                    <button className="btn btn-cyan" style={{ width: '100%', justifyContent: 'center' }} onClick={() => generate(deal)} disabled={loading}>
                      {loading ? <span className="spinner" /> : 'Planifier ce voyage →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {matched.length === 0 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => { setVibes([]); setVi(0); setStep('vibes'); }}>Recommencer</button>
              <Link href="/deals" className="btn btn-cyan" style={{ textDecoration: 'none' }}>Explorer les deals</Link>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════
           DETAIL — Hero + form (direct path)
           ═══════════════════════════════════════════ */}
      {step === 'detail' && picked && (
        <div className="detail-screen">
          {/* Hero */}
          <div className="detail-hero" style={{ backgroundImage: `url(${picked.image})` }}>
            <div className="detail-hero-overlay" />
            <div className="detail-hero-content">
              <div className="detail-hero-city">{fl(picked.country)} {picked.city}</div>
              <div className="detail-hero-row">
                <span className="detail-hero-price">{picked.price}$</span>
                {picked.oldPrice > 0 && <span className="detail-hero-old">{picked.oldPrice}$</span>}
                {picked.discount > 0 && (() => {
                  const l = lv(picked.dealLevel);
                  return <span className="deal-tag" style={{ background: l.bg, color: l.textColor || '#fff' }}>{l.icon} -{picked.discount}%</span>;
                })()}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="detail-form-area">
            <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
              Personnalise ton itineraire
            </h3>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Depart</label>
                <input type="date" value={dep} onChange={e => setDep(e.target.value)} className="form-input" />
              </div>
              <div className="form-field">
                <label className="form-label">Retour</label>
                <input type="date" value={ret} onChange={e => setRet(e.target.value)} className="form-input" />
              </div>
            </div>

            <label className="form-label">Tu voyages...</label>
            <div className="chip-row">
              {GROUPS.map(g => (
                <button key={g.id} className={`chip ${group === g.id ? 'on' : ''}`} onClick={() => setGroup(g.id)}>
                  {g.icon} {g.label}
                </button>
              ))}
            </div>

            <label className="form-label">Ton vibe</label>
            <div className="chip-row">
              {VIBES_DIRECT.map(v => (
                <button key={v.id} className={`chip ${vibe === v.id ? 'on' : ''}`} onClick={() => setVibe(v.id)}>
                  {v.icon} {v.label}
                </button>
              ))}
            </div>

            {error && (
              <div className="planner-error">
                {error}
                {error.includes('Premium') && <Link href="/pricing">Voir les plans Premium →</Link>}
              </div>
            )}

            <button className="btn btn-cyan" style={{ width: '100%', justifyContent: 'center', marginTop: 4, padding: '18px 24px' }} onClick={() => generate(picked)} disabled={loading}>
              {loading ? <><span className="spinner" /> Generation...</> : 'Generer mon itineraire →'}
            </button>

            {!isPremium && (
              <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
                Gratuit pour le Quebec · <Link href="/pricing" style={{ color: '#0EA5E9' }}>Premium</Link> pour le monde entier
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
           LOADING
           ═══════════════════════════════════════════ */}
      {step === 'loading' && (
        <div className="loading-screen">
          <div className="loading-orb">🌍</div>
          <h2 className="step-title" style={{ fontSize: 'clamp(22px, 5vw, 32px)' }}>GeaiAI planifie ton voyage...</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: 340, lineHeight: 1.6 }}>
            Restaurants, activites, directions, tips d'inities... On prepare tout.
          </p>
        </div>
      )}
    </div>
  );
}
