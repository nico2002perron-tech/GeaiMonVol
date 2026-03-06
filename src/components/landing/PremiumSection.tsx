'use client';
import { useRef, useState } from 'react';
import { useInView } from '@/lib/hooks/useInView';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

const FREE_FEATURES = [
    'Carte interactive des deals',
    'Prix en temps réel',
    'Filtres par mois et région',
];

const PREMIUM_FEATURES = [
    'Tout le Gratuit, plus :',
    'Alertes personnalisées',
    'Accès prioritaire (2h avant)',
    'Watchlist illimitée',
    '« Meilleur moment pour acheter »',
    'Historique de prix 30 jours',
    'Packs Vol + Hôtel + Guide',
    'Guide IA personnalisé inclus',
];

export default function PremiumSection() {
    const ref = useRef<HTMLDivElement>(null);
    const visible = useInView(ref, { threshold: 0.1 });
    const isMobile = useIsMobile();
    const [annual, setAnnual] = useState(false);

    return (
        <section className="glass-section" style={{
            padding: isMobile ? '70px 16px 60px' : '90px 24px 80px',
        }}>
            {/* Interstellar nebula glows */}
            <div style={{
                position: 'absolute', top: '20%', left: '30%',
                width: 500, height: 500, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,212,255,0.06), rgba(0,180,200,0.03), transparent 70%)',
                filter: 'blur(80px)', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '15%', right: '25%',
                width: 450, height: 450, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(32,199,184,0.04), transparent 70%)',
                filter: 'blur(70px)', pointerEvents: 'none',
            }} />

            {/* Header */}
            <div ref={ref} style={{
                textAlign: 'center', position: 'relative', zIndex: 2, marginBottom: 48,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(25px)',
                transition: 'all 0.7s cubic-bezier(.25,.46,.45,.94)',
            }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 18px', borderRadius: 100,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    marginBottom: 20,
                }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif" }}>
                        Nos forfaits
                    </span>
                </div>
                <h2 style={{
                    fontFamily: "'Fredoka', sans-serif", fontSize: isMobile ? 28 : 40, fontWeight: 700,
                    lineHeight: 1.12, marginBottom: 14, color: 'white',
                }}>
                    Gratuit ou Premium ?
                </h2>
                <p style={{
                    fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 480,
                    margin: '0 auto', lineHeight: 1.65, fontFamily: "'Outfit', sans-serif",
                }}>
                    Le gratuit te montre les prix. Le Premium te dit{' '}
                    <strong style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>quand acheter</strong> et prépare{' '}
                    <strong style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>ton voyage au complet</strong>.
                </p>

                {/* Billing toggle */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 12,
                    padding: '4px 6px', borderRadius: 100,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    marginTop: 16,
                }}>
                    <button
                        onClick={() => setAnnual(false)}
                        style={{
                            padding: '6px 16px', borderRadius: 100, border: 'none',
                            background: !annual ? 'rgba(0,212,255,0.15)' : 'transparent',
                            color: !annual ? 'white' : 'rgba(255,255,255,0.4)',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                            transition: 'all 0.3s ease',
                        }}
                    >
                        Mensuel
                    </button>
                    <button
                        onClick={() => setAnnual(true)}
                        style={{
                            padding: '6px 16px', borderRadius: 100, border: 'none',
                            background: annual ? 'rgba(0,212,255,0.15)' : 'transparent',
                            color: annual ? 'white' : 'rgba(255,255,255,0.4)',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                            transition: 'all 0.3s ease',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}
                    >
                        Annuel
                        <span style={{
                            fontSize: 9, fontWeight: 800, color: '#4ADE80',
                            background: 'rgba(74,222,128,0.1)',
                            padding: '2px 6px', borderRadius: 100,
                        }}>-20%</span>
                    </button>
                </div>
            </div>

            {/* 2 Pricing Cards */}
            <div style={{
                maxWidth: 700, margin: '0 auto 40px',
                display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20,
                position: 'relative', zIndex: 2,
            }}>
                {/* FREE Card */}
                <div className="glass-card" style={{ padding: '32px 24px' }}>
                    <div style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
                        textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.4)',
                        marginBottom: 8, fontFamily: "'Outfit', sans-serif",
                    }}>
                        Gratuit
                    </div>
                    <div style={{
                        fontFamily: "'Fredoka', sans-serif", fontSize: 42, fontWeight: 700,
                        color: 'white', lineHeight: 1, marginBottom: 4,
                    }}>
                        0$
                        <span style={{
                            fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.35)',
                            fontFamily: "'Outfit', sans-serif",
                        }}>/mois</span>
                    </div>
                    <p style={{
                        fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24,
                        fontFamily: "'Outfit', sans-serif",
                    }}>
                        Pour découvrir les deals
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {FREE_FEATURES.map((f, i) => (
                            <li key={i} style={{
                                fontSize: 13, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 8,
                                fontFamily: "'Outfit', sans-serif",
                            }}>
                                <span style={{ color: '#4ADE80', fontSize: 14 }}>✓</span>
                                {f}
                            </li>
                        ))}
                    </ul>
                    <button style={{
                        display: 'block', width: '100%', marginTop: 24, padding: '14px 0',
                        borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent', color: 'rgba(255,255,255,0.6)',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        fontFamily: "'Fredoka', sans-serif",
                        transition: 'all 0.3s ease',
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                    >
                        Commencer gratuitement
                    </button>
                </div>

                {/* PREMIUM Card */}
                <div className="glass-card" style={{
                    padding: '32px 24px',
                    border: '1px solid rgba(0,212,255,0.2)',
                    boxShadow: '0 0 30px rgba(0,212,255,0.06), 0 0 60px rgba(0,212,255,0.03)',
                    position: 'relative',
                }}>
                    {/* POPULAIRE badge */}
                    <div style={{
                        position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #00A5CC, #00D4FF)',
                        color: 'white', fontSize: 10, fontWeight: 800,
                        padding: '4px 14px', borderRadius: 100, letterSpacing: 1,
                        boxShadow: '0 4px 12px rgba(0,212,255,0.3)',
                    }}>
                        POPULAIRE
                    </div>

                    <div style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
                        textTransform: 'uppercase' as const, color: '#00D4FF',
                        marginBottom: 8, fontFamily: "'Outfit', sans-serif",
                    }}>
                        Premium
                    </div>
                    <div style={{
                        fontFamily: "'Fredoka', sans-serif", fontSize: 42, fontWeight: 700,
                        color: 'white', lineHeight: 1, marginBottom: 4,
                    }}>
                        {annual ? '3.99$' : '4.99$'}
                        <span style={{
                            fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.35)',
                            fontFamily: "'Outfit', sans-serif",
                        }}>{annual ? '/mois (facturé 47.88$/an)' : '/mois'}</span>
                    </div>
                    <p style={{
                        fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24,
                        fontFamily: "'Outfit', sans-serif",
                    }}>
                        Pour voyager malin
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {PREMIUM_FEATURES.map((f, i) => (
                            <li key={i} style={{
                                fontSize: 13, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 8,
                                fontFamily: "'Outfit', sans-serif",
                                ...(i === 0 ? { fontWeight: 700, color: 'rgba(255,255,255,0.7)' } : {}),
                            }}>
                                {i === 0
                                    ? <span style={{ color: '#00D4FF', fontSize: 14 }}>+</span>
                                    : <span style={{ color: '#4ADE80', fontSize: 14 }}>✓</span>
                                }
                                {f}
                            </li>
                        ))}
                    </ul>
                    <button style={{
                        display: 'block', width: '100%', marginTop: 24, padding: '14px 0',
                        borderRadius: 100, border: 'none',
                        background: 'linear-gradient(135deg, #00A5CC, #00D4FF)',
                        color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        fontFamily: "'Fredoka', sans-serif",
                        boxShadow: '0 4px 20px rgba(0,212,255,0.3)',
                        animation: 'ctaPulse 3s ease-in-out infinite',
                        transition: 'all 0.3s ease',
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                            e.currentTarget.style.boxShadow = '0 8px 36px rgba(0,212,255,0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,212,255,0.3)';
                        }}
                    >
                        Devenir Premium
                    </button>
                </div>
            </div>

            {/* Trust badges */}
            <div style={{
                textAlign: 'center', position: 'relative', zIndex: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 20, flexWrap: 'wrap',
            }}>
                {['Pas de contrat', 'Annule en 1 clic', 'Paiement sécurisé'].map((txt, i) => (
                    <span key={i} style={{
                        fontSize: 11, color: 'rgba(255,255,255,0.28)', fontWeight: 600,
                    }}>{txt}</span>
                ))}
            </div>
        </section>
    );
}
