'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LandingHeader from '@/components/LandingHeader';
import FooterWithNewsletter from '@/components/layout/FooterWithNewsletter';
import { DEAL_LEVELS } from '@/lib/constants/deals';
import { PREMIUM_PRICE } from '@/lib/constants/premium';
import { CITY_COUNTRY, COUNTRY_FLAGS, mapPricesToDeals } from '@/lib/types/deals';
import type { DealItem } from '@/lib/types/deals';
import './landing.css';
import './deals.css';

const EMPTY_DEALS: any[] = [];

interface QuizStep {
  intro?: string;
  q: string;
  options: { label: string; value: string }[];
  reactions: Record<string, string>;
}

const QUIZ: QuizStep[] = [
  {
    intro: "Salut! Moi c'est GeaiAI, ton buddy de voyage. En 5 petites questions, j'te trouve LA destination de tes reves. Let's go!",
    q: "C'est quoi ton mood vacances en ce moment?",
    options: [
      { label: '🏖️ Plage & chill', value: 'plage' },
      { label: '🏛️ Ville & culture', value: 'ville' },
      { label: '🧗 Aventure & nature', value: 'aventure' },
      { label: '🎲 Surprise-moi!', value: 'surprise' },
    ],
    reactions: {
      plage: "Ohhh les orteils dans le sable, un drink a la main! J'te comprends tellement!",
      ville: "Un(e) urbain(e)! Genre tu marches 25km par jour en vacances et tu trouves ca relax",
      aventure: "YESSS! T'es du genre a sauter en parachute avant le dejeuner!",
      surprise: "Oooh tu me fais confiance les yeux fermes? Bold move, j'aime ca",
    },
  },
  {
    q: "Le matin en vacances, tu fais quoi?",
    options: [
      { label: '😴 J\'dors jusqu\'a midi', value: 'dodo' },
      { label: '☀️ Sunrise + cafe', value: 'sunrise' },
      { label: '🏃 Run + explore', value: 'actif' },
      { label: '🎉 J\'me couche a 6h du mat', value: 'party' },
    ],
    reactions: {
      dodo: "Le roi/la reine du hamac! Zero jugement, des fois faut juste decrocher",
      sunrise: "Aww cute! Y'a rien de mieux qu'un cafe avec un view de malade au lever du soleil",
      actif: "T'es une MACHINE! Genre tu planifies 47 activites par jour et tu les fais TOUTES",
      party: "HAHAHA le genre qui decouvre la ville de nuit! Les meilleurs souvenirs se font apres minuit, c'est connu",
    },
  },
  {
    q: "On parle bouffe. T'es comment?",
    options: [
      { label: '🌮 Street food a 3$', value: 'street' },
      { label: '🍽️ Bon resto de temps en temps', value: 'modere' },
      { label: '👨‍🍳 Full gastronomie', value: 'gastro' },
      { label: '🏨 All-inclusive, open bar', value: 'allinc' },
    ],
    reactions: {
      street: "LES VRAIS SAVENT! Les meilleurs repas de ma vie c'etait dans des stands de rue a 3$",
      modere: "Smart! Le pad thai a 2$ le midi, le resto fancy le soir. Equilibre parfait",
      gastro: "Un(e) gourmet! Genre tu reserves au resto avant de reserver ton vol??",
      allinc: "Le bracelet au poignet pis tu stress pu! Y'a zero honte la-dedans",
    },
  },
  {
    q: "Tu voyages avec qui?",
    options: [
      { label: '🎒 Solo, just me', value: 'solo' },
      { label: '💑 En couple', value: 'couple' },
      { label: '🎉 Gang d\'amis', value: 'amis' },
      { label: '👨‍👩‍👧‍👦 Famille', value: 'famille' },
    ],
    reactions: {
      solo: "Main character energy! Voyager solo c'est la meilleure facon de se connaitre (et de faire ce qu'on veut)",
      couple: "Awww! Rien de mieux que decouvrir le monde a deux. Y'a-tu un anniversaire a feter?",
      amis: "ROAD TRIP ENERGY! Ca va etre chaotique, ca va etre drole, pis quelqu'un va se perdre garanti",
      famille: "Les meilleurs souvenirs! Faut juste trouver un spot qui plait a tout le monde (le vrai defi)",
    },
  },
  {
    q: "Derniere question (la plus importante): t'arrives a l'aeroport...",
    options: [
      { label: '⏰ 4h d\'avance, lounge VIP', value: 'early' },
      { label: '😎 Pile a l\'heure', value: 'ontime' },
      { label: '🏃 En courant, gate ferme', value: 'late' },
      { label: '🛒 Pas encore fait ma valise', value: 'chaos' },
    ],
    reactions: {
      early: "Hahaha le genre organise! Tu dois avoir un spreadsheet Excel pour tes vacances, avoue",
      ontime: "Efficace! Pas de temps perdu, juste... du stress modere. Respire",
      late: "AH NON! Genre tu cours en flip-flops dans le terminal avec ton passeport entre les dents??",
      chaos: "HAHAHA t'es mon genre de personne! \"On verra rendu la\" c'est ta philosophie de vie!",
    },
  },
];

interface ClientLandingProps {
  initialDeals?: any[];
}

export default function ClientLanding({ initialDeals }: ClientLandingProps) {
  const stableInitial = initialDeals && initialDeals.length > 0 ? initialDeals : EMPTY_DEALS;
  const allDeals = useMemo(() => mapPricesToDeals(stableInitial), [stableInitial]);

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── GeaiAI Chat state ──
  type ChatMsg = { role: 'ai' | 'user'; text: string };
  const [chatStarted, setChatStarted] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatStep, setChatStep] = useState(0);
  const [aiTyping, setAiTyping] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [chatDone, setChatDone] = useState(false);
  const answersRef = useRef<{ q: string; a: string }[]>([]);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatMessages, aiTyping]);

  const startChat = useCallback(() => {
    setChatStarted(true);
    setAiTyping(true);
    setTimeout(() => {
      setAiTyping(false);
      setChatMessages([{ role: 'ai', text: QUIZ[0].intro! }]);
    }, 900);
    setTimeout(() => setAiTyping(true), 1200);
    setTimeout(() => {
      setAiTyping(false);
      setChatMessages(prev => [...prev, { role: 'ai', text: QUIZ[0].q }]);
    }, 1900);
    setTimeout(() => setShowReplies(true), 2100);
  }, []);

  const pickAnswer = useCallback((value: string, label: string) => {
    const step = chatStep;
    const currentQ = QUIZ[step];

    // User message instantly
    setChatMessages(prev => [...prev, { role: 'user', text: label }]);
    answersRef.current = [...answersRef.current, { q: currentQ.q, a: label }];
    setShowReplies(false);

    // AI reaction with typing delay
    setTimeout(() => setAiTyping(true), 250);
    setTimeout(() => {
      setAiTyping(false);
      setChatMessages(prev => [...prev, { role: 'ai', text: currentQ.reactions[value] || "Nice!" }]);
    }, 1000);

    if (step < QUIZ.length - 1) {
      // Next question
      setTimeout(() => setAiTyping(true), 1400);
      setTimeout(() => {
        const next = step + 1;
        setChatStep(next);
        setAiTyping(false);
        setChatMessages(prev => [...prev, { role: 'ai', text: QUIZ[next].q }]);
      }, 2100);
      setTimeout(() => setShowReplies(true), 2300);
    } else {
      // Final — AI personality reveal
      setTimeout(() => setAiTyping(true), 1400);
      setTimeout(() => {
        setAiTyping(false);
        setChatMessages(prev => [...prev, { role: 'ai', text: "Hmm attends 2 sec, j'analyse ton profil voyageur..." }]);
      }, 2200);
      setTimeout(() => {
        setAiTyping(true);
        fetchReveal();
      }, 3000);
    }
  }, [chatStep]);

  const fetchReveal = useCallback(async () => {
    try {
      const res = await fetch('/api/geai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answersRef.current,
          deals: allDeals.slice(0, 20).map(d => ({
            city: d.city, country: d.country, price: Math.round(d.price),
            discount: d.discount, dealLevel: d.dealLevel,
          })),
        }),
      });

      setAiTyping(false);

      if (!res.ok || !res.body) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';

      setChatMessages(prev => [...prev, { role: 'ai', text: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        const current = text;
        setChatMessages(prev => {
          const msgs = [...prev];
          msgs[msgs.length - 1] = { role: 'ai', text: current };
          return msgs;
        });
      }
      setChatDone(true);
    } catch {
      setAiTyping(false);
      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: "Oups j'ai eu un petit bug! Mais clique sur 'Planifier mon voyage' et je vais te preparer quelque chose de malade!",
      }]);
      setChatDone(true);
    }
  }, [allDeals]);

  const resetChat = useCallback(() => {
    setChatStarted(false);
    setChatMessages([]);
    setChatStep(0);
    setAiTyping(false);
    setShowReplies(false);
    setChatDone(false);
    answersRef.current = [];
  }, []);

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

      {/* ═══ HERO — EMAIL SIGNUP ═══ */}
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

            {/* ── Email signup form ── */}
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

      {/* ═══ GEAIAI CHAT — Interactive AI travel buddy ═══ */}
      {allDeals.length > 0 && (
        <section className="lp-chat-section">
          <div className="lp-chat-glow" />
          <div className="lp-chat-outer">
            <div className="lp-chat-label-row">
              <span className="lp-chat-badge">✨ Mini-jeu IA</span>
              <h2 className="lp-chat-heading">
                Parle avec GeaiAI.{' '}
                <span>Trouve ta destination.</span>
              </h2>
              <p className="lp-chat-subheading">
                Notre IA te pose 5 questions et te genere un profil voyageur personnalise avec des recommandations.
              </p>
            </div>

            {/* Phone-style chat container */}
            <div className="lp-chat-phone">
              {/* Header bar */}
              <div className="lp-chat-header">
                <div className="lp-chat-header-avatar">🐦</div>
                <div>
                  <div className="lp-chat-header-name">GeaiAI</div>
                  <div className="lp-chat-header-status">
                    <span className="lp-chat-online-dot" />
                    En ligne
                  </div>
                </div>
                {chatStep > 0 && !chatDone && (
                  <div className="lp-chat-step-indicator">{chatStep}/{QUIZ.length}</div>
                )}
              </div>

              {/* Message area */}
              <div className="lp-chat-body" ref={chatBodyRef}>
                {!chatStarted ? (
                  <div className="lp-chat-start">
                    <div className="lp-chat-start-avatar">🐦</div>
                    <h3 className="lp-chat-start-title">Salut! Moi c&apos;est GeaiAI</h3>
                    <p className="lp-chat-start-desc">
                      En 5 questions, je trouve ta destination de reve parmi {allDeals.length}+ deals au depart de Montreal.
                    </p>
                    <button className="lp-chat-start-btn" onClick={startChat}>
                      Commencer le quiz
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-6-6l6 6-6 6" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="lp-chat-messages">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`lp-chat-msg ${msg.role === 'ai' ? 'lp-chat-msg-ai' : 'lp-chat-msg-user'}`}>
                        {msg.role === 'ai' && <div className="lp-chat-msg-avatar">🐦</div>}
                        <div className={`lp-chat-bubble ${msg.role === 'ai' ? 'lp-chat-bubble-ai' : 'lp-chat-bubble-user'}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {aiTyping && (
                      <div className="lp-chat-msg lp-chat-msg-ai">
                        <div className="lp-chat-msg-avatar">🐦</div>
                        <div className="lp-chat-bubble lp-chat-bubble-ai lp-chat-typing">
                          <span className="lp-chat-dot" />
                          <span className="lp-chat-dot" />
                          <span className="lp-chat-dot" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick replies / Actions */}
              {chatStarted && (
                <div className="lp-chat-footer">
                  {showReplies && chatStep < QUIZ.length && (
                    <div className="lp-chat-replies">
                      {QUIZ[chatStep].options.map(opt => (
                        <button key={opt.value} className="lp-chat-reply-btn" onClick={() => pickAnswer(opt.value, opt.label)}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {chatDone && (
                    <div className="lp-chat-done-actions">
                      <Link href="/planifier" className="lp-chat-cta-main">
                        Planifier mon voyage
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-6-6l6 6-6 6" /></svg>
                      </Link>
                      <button className="lp-chat-cta-reset" onClick={resetChat}>Recommencer</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

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
      {/* Image */}
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

      {/* Body */}
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
