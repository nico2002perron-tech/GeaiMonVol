'use client';
import { useRef } from 'react';
import Image from 'next/image';
import { useInView } from '@/lib/hooks/useInView';
const NextImage = Image;

const STEP_ICONS: Record<string, React.ReactNode> = {
    scan: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/></svg>
    ),
    chart: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18"/><path d="M5 20V10"/><path d="M9 20V4"/><path d="M13 20v-8"/><path d="M17 20V8"/></svg>
    ),
    bell: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    ),
    plane: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8l-8.2-1.8c-.4-.1-.8.1-.9.5L3 9l7 4 4 7 2.3-.9c.4-.1.6-.5.5-.9z"/></svg>
    ),
};

const STEPS = [
    {
        num: '01',
        title: 'On scanne pour toi',
        desc: 'Notre geai bleu parcourt des centaines de vols chaque jour depuis Montréal pour dénicher les prix qui sortent de l\'ordinaire.',
        icon: 'scan' as const,
    },
    {
        num: '02',
        title: 'On compare les prix',
        desc: 'Chaque prix est comparé à l\'historique des 30 derniers jours. Si c\'est un rabais réel, on le garde. Sinon, poubelle.',
        icon: 'chart' as const,
    },
    {
        num: '03',
        title: 'Tu reçois les deals',
        desc: 'Les meilleurs deals apparaissent sur la carte en temps réel. Tu cliques, tu vois le prix, tu réserves directement.',
        icon: 'bell' as const,
    },
    {
        num: '04',
        title: 'Tu pars en voyage',
        desc: 'C\'est aussi simple que ça. Pas de frais cachés, pas d\'intermédiaire. On te pointe vers le meilleur prix, tu réserves.',
        icon: 'plane' as const,
    },
];

function GlassStepCard({ step, index }: { step: typeof STEPS[number]; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const visible = useInView(ref);

    return (
        <div
            ref={ref}
            className="glass-card"
            style={{
                padding: '32px 24px',
                textAlign: 'center',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.6s cubic-bezier(.25,.46,.45,.94) ${index * 0.12}s`,
            }}
        >
            {/* Step number */}
            <div style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 36,
                fontWeight: 700,
                color: '#00D4FF',
                lineHeight: 1,
                marginBottom: 16,
            }}>
                {step.num}
            </div>

            {/* Icon */}
            <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(0,212,255,0.08)',
                border: '1.5px solid rgba(0,212,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
            }}>
                {STEP_ICONS[step.icon]}
            </div>

            {/* Title */}
            <h3 style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: 12,
                lineHeight: 1.25,
            }}>
                {step.title}
            </h3>

            {/* Description */}
            <p style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.7,
                fontFamily: "'Outfit', sans-serif",
            }}>
                {step.desc}
            </p>
        </div>
    );
}

export default function HowItWorks() {
    const headerRef = useRef<HTMLDivElement>(null);
    const headerVisible = useInView(headerRef);

    return (
        <section className="glass-section" style={{
            padding: '100px 24px',
        }}>
            {/* Interstellar nebula glows */}
            <div style={{
                position: 'absolute', top: '15%', left: '50%',
                transform: 'translateX(-50%)',
                width: 600, height: 600, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,212,255,0.06), rgba(0,180,200,0.03), transparent 70%)',
                filter: 'blur(80px)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '10%', right: '20%',
                width: 400, height: 400, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(32,199,184,0.04), transparent 70%)',
                filter: 'blur(60px)',
                pointerEvents: 'none',
            }} />

            {/* Header */}
            <div
                ref={headerRef}
                style={{
                    textAlign: 'center',
                    marginBottom: 64,
                    position: 'relative',
                    zIndex: 1,
                    opacity: headerVisible ? 1 : 0,
                    transform: headerVisible ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'all 0.8s cubic-bezier(.25,.46,.45,.94)',
                }}
            >
                {/* Pill */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 18px', borderRadius: 100,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    marginBottom: 20,
                }}>
                    <div style={{ position: 'relative', width: 22, height: 22 }}>
                        <NextImage
                            src="/logo_geai.png"
                            alt="Logo"
                            fill
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                    <span style={{
                        fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                        fontFamily: "'Outfit', sans-serif",
                    }}>
                        Comment ça marche ?
                    </span>
                </div>

                <h2 style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontSize: 38,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginBottom: 12,
                    lineHeight: 1.15,
                }}>
                    Ton geai bleu cherche,<br />tu voyages.
                </h2>

                <p style={{
                    fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 480,
                    margin: '0 auto', fontFamily: "'Outfit', sans-serif",
                    lineHeight: 1.6,
                }}>
                    En 4 étapes simples, passe de «&nbsp;j&apos;aimerais voyager&nbsp;» à «&nbsp;je pars quand ?!&nbsp;»
                </p>
            </div>

            {/* 4 Glass Cards Grid */}
            <div style={{
                maxWidth: 900,
                margin: '0 auto 56px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                position: 'relative',
                zIndex: 1,
            }}>
                {STEPS.map((step, i) => (
                    <GlassStepCard key={i} step={step} index={i} />
                ))}
            </div>

            {/* Bottom CTA */}
            <div style={{
                textAlign: 'center', position: 'relative', zIndex: 2,
            }}>
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 10,
                        padding: '16px 36px', borderRadius: 100, border: 'none',
                        background: 'linear-gradient(135deg, #0891B2, #06B6D4)',
                        color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                        fontFamily: "'Fredoka', sans-serif",
                        boxShadow: '0 4px 24px rgba(6,182,212,0.3)',
                        textDecoration: 'none',
                        animation: 'ctaPulse 3s ease-in-out infinite',
                        transition: 'transform 0.3s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
                >
                    Explorer les deals
                </a>
                <div style={{
                    marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.3)',
                    fontFamily: "'Outfit', sans-serif",
                }}>
                    Gratuit · Aucune inscription requise
                </div>
            </div>
        </section>
    );
}
