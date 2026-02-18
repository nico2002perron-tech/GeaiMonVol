'use client';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
// Renaming to avoid potential conflict with global Image
const NextImage = Image;

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

const STEPS = [
    {
        num: '01',
        title: 'On scanne pour toi',
        desc: 'Notre geai bleu parcourt des centaines de vols chaque jour depuis Montréal pour dénicher les prix qui sortent de l\'ordinaire.',
        mascot: '🔍',
        color: '#2E7DDB',
    },
    {
        num: '02',
        title: 'On compare les prix',
        desc: 'Chaque prix est comparé à l\'historique des 30 derniers jours. Si c\'est un rabais réel, on le garde. Sinon, poubelle.',
        mascot: '📊',
        color: '#7C3AED',
    },
    {
        num: '03',
        title: 'Tu reçois les deals',
        desc: 'Les meilleurs deals apparaissent sur la carte en temps réel. Tu cliques, tu vois le prix, tu réserves directement.',
        mascot: '🎯',
        color: '#EA580C',
    },
    {
        num: '04',
        title: 'Tu pars en voyage',
        desc: 'C\'est aussi simple que ça. Pas de frais cachés, pas d\'intermédiaire. On te pointe vers le meilleur prix, tu réserves.',
        mascot: '✈️',
        color: '#16A34A',
    },
];

export default function HowItWorks() {
    return (
        <div style={{
            background: '#F8FAFC',
            padding: '80px 24px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Orbes décoratifs */}
            <div style={{
                position: 'absolute', top: -100, right: -100,
                width: 400, height: 400, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(46,125,219,0.04), transparent 70%)',
            }} />
            <div style={{
                position: 'absolute', bottom: -80, left: -80,
                width: 300, height: 300, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(124,58,237,0.03), transparent 70%)',
            }} />

            {/* Titre */}
            <AnimatedDiv>
                <div style={{ textAlign: 'center', marginBottom: 60, position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '6px 16px', borderRadius: 100,
                        background: 'rgba(46,125,219,0.08)', marginBottom: 16,
                    }}>
                        <div style={{ position: 'relative', width: 22, height: 22 }}>
                            <NextImage
                                src="/logo_geai.png"
                                alt="Logo"
                                fill
                                style={{ objectFit: 'contain' }}
                            />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#2E7DDB', fontFamily: "'Outfit', sans-serif" }}>
                            Comment ça marche ?
                        </span>
                    </div>
                    <h2 style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontSize: 32, fontWeight: 700, color: '#1A2B42', marginBottom: 8,
                    }}>
                        Ton geai bleu cherche,<br />tu voyages.
                    </h2>
                    <p style={{
                        fontSize: 15, color: '#5A7089', maxWidth: 500,
                        margin: '0 auto', fontFamily: "'Outfit', sans-serif",
                    }}>
                        En 4 étapes simples, passe de "j'aimerais voyager" à "je pars quand ?!"
                    </p>
                </div>
            </AnimatedDiv>

            {/* 4 cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 24,
                maxWidth: 1100,
                margin: '0 auto',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Ligne de connexion */}
                <div style={{
                    position: 'absolute', top: 50, left: '12%', right: '12%',
                    height: 2,
                    background: 'linear-gradient(90deg, #2E7DDB, #7C3AED, #EA580C, #16A34A)',
                    opacity: 0.15, borderRadius: 10,
                }} />

                {STEPS.map((step, i) => (
                    <AnimatedDiv key={i} delay={i * 0.15}>
                        <div style={{
                            background: 'white',
                            borderRadius: 20,
                            padding: '28px 24px',
                            textAlign: 'center',
                            border: '1px solid rgba(26,43,66,0.05)',
                            boxShadow: '0 2px 12px rgba(26,43,66,0.04)',
                            transition: 'transform 0.3s ease, box-shadow 0.3s',
                            cursor: 'default',
                        }}
                            className="step-card"
                        >
                            {/* Mascotte */}
                            <div style={{
                                width: 56, height: 56, borderRadius: 16,
                                margin: '0 auto 16px',
                                background: `linear-gradient(135deg, ${step.color}15, ${step.color}08)`,
                                border: `2px solid ${step.color}20`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 26,
                                animation: `float 3s ease-in-out ${i * 0.5}s infinite`,
                            }}>
                                {step.mascot}
                            </div>
                            <div style={{
                                fontSize: 11, fontWeight: 800, color: step.color,
                                letterSpacing: 1, marginBottom: 8, opacity: 0.7,
                                fontFamily: "'Outfit', sans-serif",
                            }}>
                                ÉTAPE {step.num}
                            </div>
                            <h3 style={{
                                fontFamily: "'Fredoka', sans-serif",
                                fontSize: 17, fontWeight: 700, color: '#1A2B42', marginBottom: 8,
                            }}>
                                {step.title}
                            </h3>
                            <p style={{
                                fontSize: 13, color: '#5A7089', lineHeight: 1.6,
                                fontFamily: "'Outfit', sans-serif",
                            }}>
                                {step.desc}
                            </p>
                        </div>
                    </AnimatedDiv>
                ))}
            </div>
        </div>
    );
}
