'use client';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
const NextImage = Image;

function useInView(ref: React.RefObject<HTMLDivElement | null>, threshold = 0.15) {
    const [visible, setVisible] = useState(false);
    const [ratio, setRatio] = useState(0);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) setVisible(true);
                setRatio(e.intersectionRatio);
            },
            { threshold: [0, 0.15, 0.3, 0.5, 0.7, 1], rootMargin: '0px 0px -30px 0px' }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return { visible, ratio };
}

const STEPS = [
    {
        num: '01',
        title: 'On scanne pour toi',
        desc: 'Notre geai bleu parcourt des centaines de vols chaque jour depuis Montréal pour dénicher les prix qui sortent de l\'ordinaire.',
        mascot: '/mascots/step1-scanner.png',
        color: '#2E7DDB',
        colorDark: '#1B5BA0',
    },
    {
        num: '02',
        title: 'On compare les prix',
        desc: 'Chaque prix est comparé à l\'historique des 30 derniers jours. Si c\'est un rabais réel, on le garde. Sinon, poubelle.',
        mascot: '/mascots/step2-comparer.png',
        color: '#7C3AED',
        colorDark: '#5B21B6',
    },
    {
        num: '03',
        title: 'Tu reçois les deals',
        desc: 'Les meilleurs deals apparaissent sur la carte en temps réel. Tu cliques, tu vois le prix, tu réserves directement.',
        mascot: '/mascots/step3-deals.png',
        color: '#EA580C',
        colorDark: '#C2410C',
    },
    {
        num: '04',
        title: 'Tu pars en voyage',
        desc: 'C\'est aussi simple que ça. Pas de frais cachés, pas d\'intermédiaire. On te pointe vers le meilleur prix, tu réserves.',
        mascot: '/mascots/step4-voyage.png',
        color: '#16A34A',
        colorDark: '#15803D',
    },
];

function StepRow({ step, index }: { step: typeof STEPS[number]; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const { visible } = useInView(ref);
    const isEven = index % 2 === 1;

    return (
        <div
            ref={ref}
            className={`hiw-step-row ${isEven ? 'hiw-step-row-reverse' : ''} ${visible ? 'hiw-step-visible' : ''}`}
            style={{
                transitionDelay: `${index * 0.1}s`,
            }}
        >
            {/* Mascot side */}
            <div className="hiw-mascot-side">
                <div className={`hiw-mascot-container ${visible ? 'hiw-mascot-animate' : ''}`}>
                    {/* Glow */}
                    <div
                        className="hiw-mascot-glow"
                        style={{
                            background: `radial-gradient(circle, ${step.color}, transparent 70%)`,
                        }}
                    />
                    {/* Dashed ring */}
                    <div
                        className="hiw-mascot-ring"
                        style={{
                            borderColor: step.color,
                            animationDirection: isEven ? 'reverse' : 'normal',
                        }}
                    />
                    {/* Image circle */}
                    <div
                        className="hiw-mascot-img-wrap"
                        style={{ border: `3px solid ${step.color}25` }}
                    >
                        <img
                            src={step.mascot}
                            alt={step.title}
                            style={{
                                width: '72%',
                                height: '72%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.08))',
                            }}
                        />
                    </div>
                    {/* Step number badge */}
                    <div
                        className="hiw-step-number"
                        style={{
                            background: `linear-gradient(135deg, ${step.color}, ${step.colorDark})`,
                        }}
                    >
                        {step.num}
                    </div>
                </div>
            </div>

            {/* Text side */}
            <div className="hiw-text-side">
                <div style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: step.color,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase' as const,
                    marginBottom: 8,
                    opacity: 0.7,
                    fontFamily: "'Outfit', sans-serif",
                }}>
                    ÉTAPE {step.num}
                </div>
                <h3 style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#1A2B42',
                    marginBottom: 12,
                    lineHeight: 1.25,
                }}>
                    {step.title}
                </h3>
                <p className="hiw-step-desc" style={{
                    fontSize: 15,
                    color: '#5A7089',
                    lineHeight: 1.7,
                    fontFamily: "'Outfit', sans-serif",
                }}>
                    {step.desc}
                </p>
            </div>

            {/* Center dot on timeline (desktop only) */}
            <div className="hiw-center-dot" style={{ background: step.color }} />
        </div>
    );
}

export default function HowItWorks() {
    const headerRef = useRef<HTMLDivElement>(null);
    const { visible: headerVisible } = useInView(headerRef);

    return (
        <section style={{
            background: '#F8FAFC',
            padding: '100px 24px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Decorative orbs */}
            <div style={{
                position: 'absolute', top: -120, right: -80,
                width: 500, height: 500, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(46,125,219,0.06), transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: -100, left: -60,
                width: 400, height: 400, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(124,58,237,0.04), transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* Header */}
            <div
                ref={headerRef}
                className={`hiw-header ${headerVisible ? 'hiw-header-visible' : ''}`}
            >
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 18px', borderRadius: 100,
                    background: 'rgba(46,125,219,0.08)',
                    border: '1px solid rgba(46,125,219,0.12)',
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
                        fontSize: 12, fontWeight: 700, color: '#2E7DDB',
                        fontFamily: "'Outfit', sans-serif",
                    }}>
                        Comment ça marche ?
                    </span>
                </div>
                <h2 className="hiw-title" style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 700, color: '#1A2B42',
                    marginBottom: 12, lineHeight: 1.15,
                }}>
                    Ton geai bleu cherche,<br />tu voyages.
                </h2>
                <p style={{
                    fontSize: 16, color: '#5A7089', maxWidth: 480,
                    margin: '0 auto', fontFamily: "'Outfit', sans-serif",
                    lineHeight: 1.6,
                }}>
                    En 4 étapes simples, passe de «&nbsp;j&apos;aimerais voyager&nbsp;» à «&nbsp;je pars quand ?!&nbsp;»
                </p>

                {/* Scroll hint arrow */}
                <div className="hiw-scroll-hint">
                    <span style={{ fontSize: 11, color: '#8FA3B8', fontWeight: 600 }}>Découvre comment</span>
                    <div className="hiw-scroll-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E7DDB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Steps — zigzag timeline */}
            <div className="hiw-steps-container">
                {STEPS.map((step, i) => (
                    <StepRow key={i} step={step} index={i} />
                ))}
            </div>
        </section>
    );
}
