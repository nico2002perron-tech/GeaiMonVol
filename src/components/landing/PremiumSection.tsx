'use client';
import { useRef, useState, useEffect } from 'react';

function useInView(ref: React.RefObject<HTMLDivElement | null>) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setVisible(true); },
            { threshold: 0.15 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return visible;
}

function AnimatedDiv({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const visible = useInView(ref);
    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: `all 0.6s cubic-bezier(.25,.46,.45,.94) ${delay}s`,
        }}>
            {children}
        </div>
    );
}

const PERKS = [
    { icon: '🔔', title: 'Alertes personnalisées', desc: 'Reçois une notification dès qu\'un prix chute sur tes destinations favorites.' },
    { icon: '📉', title: 'Historique des prix', desc: 'Vois l\'évolution du prix sur 30 jours pour savoir si c\'est vraiment un bon deal.' },
    { icon: '🤖', title: 'Guides IA', desc: 'Un guide de voyage personnalisé généré par IA pour chaque destination.' },
    { icon: '⚡', title: 'Accès prioritaire', desc: 'Les deals apparaissent 2h avant pour les membres Premium.' },
    { icon: '🏨', title: 'Hôtels & Plans', desc: 'Accède aux sections Hôtels et Planning pour organiser ton voyage au complet.' },
    { icon: '💬', title: 'Support prioritaire', desc: 'Une question ? On te répond en moins d\'une heure.' },
];

export default function PremiumSection() {
    return (
        <div style={{
            background: 'linear-gradient(135deg, #1A2B42 0%, #1E3A5F 100%)',
            padding: '80px 24px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Orbes */}
            <div style={{
                position: 'absolute', top: -100, left: '20%',
                width: 300, height: 300, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(46,125,219,0.15), transparent 70%)',
            }} />
            <div style={{
                position: 'absolute', bottom: -80, right: '10%',
                width: 250, height: 250, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)',
            }} />

            {/* Titre */}
            <AnimatedDiv>
                <div style={{ textAlign: 'center', marginBottom: 50, position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 16px', borderRadius: 100,
                        background: 'rgba(46,125,219,0.15)', marginBottom: 16,
                    }}>
                        <span style={{ fontSize: 14 }}>⚡</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA', fontFamily: "'Outfit', sans-serif" }}>
                            GeaiMonVol Premium
                        </span>
                    </div>
                    <h2 style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontSize: 32, fontWeight: 700, color: 'white', marginBottom: 8,
                    }}>
                        Voyage comme un pro.
                    </h2>
                    <p style={{
                        fontSize: 15, color: 'rgba(255,255,255,0.5)',
                        maxWidth: 460, margin: '0 auto',
                        fontFamily: "'Outfit', sans-serif",
                    }}>
                        Pour 5$/mois, accède à tout ce dont t'as besoin pour ne plus jamais payer trop cher.
                    </p>
                </div>
            </AnimatedDiv>

            {/* 6 perks en grille 3x2 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 20,
                maxWidth: 900,
                margin: '0 auto 40px',
                position: 'relative',
                zIndex: 1,
            }}>
                {PERKS.map((perk, i) => (
                    <AnimatedDiv key={i} delay={i * 0.1}>
                        <div className="perk-card" style={{
                            background: 'rgba(255,255,255,0.06)',
                            borderRadius: 16,
                            padding: '24px 20px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(8px)',
                            transition: 'transform 0.3s ease, box-shadow 0.3s',
                        }}>
                            <div style={{ fontSize: 28, marginBottom: 12 }}>{perk.icon}</div>
                            <h4 style={{
                                fontFamily: "'Fredoka', sans-serif",
                                fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 6,
                            }}>
                                {perk.title}
                            </h4>
                            <p style={{
                                fontSize: 12.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5,
                                fontFamily: "'Outfit', sans-serif",
                            }}>
                                {perk.desc}
                            </p>
                        </div>
                    </AnimatedDiv>
                ))}
            </div>

            {/* CTA */}
            <AnimatedDiv delay={0.3}>
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 12,
                        background: 'white', borderRadius: 100,
                        padding: '4px 4px 4px 24px',
                    }}>
                        <span style={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontSize: 22, fontWeight: 800, color: '#1A2B42',
                        }}>
                            5$<span style={{ fontSize: 14, fontWeight: 600, color: '#8FA3B8' }}>/mois</span>
                        </span>
                        <button style={{
                            padding: '12px 28px', borderRadius: 100, border: 'none',
                            background: 'linear-gradient(135deg, #2E7DDB, #1B5BA0)',
                            color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                            boxShadow: '0 4px 16px rgba(46,125,219,0.3)',
                        }}>
                            Commencer maintenant →
                        </button>
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 10 }}>
                        Annule quand tu veux · Pas de contrat
                    </p>
                </div>
            </AnimatedDiv>
        </div>
    );
}
