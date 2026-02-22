'use client';
import { useRef, useState, useEffect } from 'react';

function useInView(ref: React.RefObject<HTMLDivElement | null>) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setVisible(true); },
            { threshold: 0.1 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return visible;
}

/* ═══════════════════════════════════════
   MINI MOCKUP — ALERT NOTIFICATION
   ═══════════════════════════════════════ */
function AlertMockup() {
    return (
        <div style={{
            width: 200, animation: 'premFloat 4s ease-in-out infinite',
        }}>
            <div style={{
                background: '#131F34', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.4)', overflow: 'hidden',
            }}>
                {/* Head */}
                <div style={{
                    padding: '7px 10px', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, fontWeight: 800, color: '#16A34A' }}>
                        <span style={{
                            width: 4, height: 4, borderRadius: '50%', background: '#16A34A',
                            display: 'inline-block', animation: 'premBlink 2s infinite',
                        }} />
                        ALERTE PRIX
                    </div>
                    <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)' }}>Maintenant</span>
                </div>
                {/* Body */}
                <div style={{ padding: 10 }}>
                    <h4 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 12, fontWeight: 700, marginBottom: 3, color: 'white' }}>
                        🔥 Lisbonne a droppé !
                    </h4>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
                        YUL → LIS · Direct · 5-12 mars
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 700, color: '#4ADE80' }}>329$</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textDecoration: 'line-through' }}>680$</span>
                        <span style={{
                            fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 100,
                            background: 'rgba(220,38,38,0.15)', color: '#F87171',
                        }}>-52%</span>
                    </div>
                    <button style={{
                        display: 'block', width: '100%', padding: 7, borderRadius: 8,
                        background: '#16A34A', color: '#fff', border: 'none',
                        fontSize: 10, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", cursor: 'pointer',
                    }}>Voir le deal →</button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   MINI MOCKUP — PRICE CHART
   ═══════════════════════════════════════ */
function ChartMockup() {
    return (
        <div style={{
            width: 220, animation: 'premFloat 5s ease-in-out infinite 0.5s',
        }}>
            <div style={{
                background: '#131F34', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                padding: 14, boxShadow: '0 12px 35px rgba(0,0,0,0.4)',
            }}>
                {/* Head */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
                }}>
                    <h5 style={{ fontSize: 10, fontWeight: 700, color: 'white', margin: 0 }}>YUL → LIS · 30j</h5>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>Historique</span>
                </div>
                {/* SVG Chart */}
                <div style={{ height: 60, marginBottom: 10 }}>
                    <svg viewBox="0 0 200 60" fill="none" style={{ width: '100%', height: '100%' }}>
                        <line x1="0" y1="15" x2="200" y2="15" stroke="rgba(255,255,255,.04)" strokeDasharray="3" />
                        <line x1="0" y1="30" x2="200" y2="30" stroke="rgba(255,255,255,.04)" strokeDasharray="3" />
                        <line x1="0" y1="45" x2="200" y2="45" stroke="rgba(255,255,255,.04)" strokeDasharray="3" />
                        <line x1="0" y1="27" x2="200" y2="27" stroke="rgba(255,255,255,.12)" strokeDasharray="5 3" />
                        <defs>
                            <linearGradient id="premChartGrad" x1="0" y1="0" x2="200" y2="0">
                                <stop offset="0%" stopColor="#60A5FA" />
                                <stop offset="100%" stopColor="#4ADE80" />
                            </linearGradient>
                        </defs>
                        <path d="M0,22 C25,20 45,28 70,32 C95,36 115,40 135,33 C155,26 170,12 190,8" stroke="url(#premChartGrad)" strokeWidth="2" strokeLinecap="round" fill="none" />
                        <path d="M0,22 C25,20 45,28 70,32 C95,36 115,40 135,33 C155,26 170,12 190,8 L190,60 L0,60Z" fill="url(#premChartGrad)" opacity="0.1" />
                        <circle cx="190" cy="8" r="3.5" fill="#4ADE80" stroke="#131F34" strokeWidth="2" />
                        <text x="170" y="5" fill="#4ADE80" fontSize="7" fontWeight="700" fontFamily="Fredoka">329$</text>
                    </svg>
                </div>
                {/* Verdict */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px',
                    borderRadius: 8, background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.15)',
                }}>
                    <span style={{ fontSize: 14 }}>✅</span>
                    <div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#4ADE80', display: 'block' }}>Achète maintenant</span>
                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>Plus bas que 91% des billets ce mois</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   MINI MOCKUP — PACK VOYAGE
   ═══════════════════════════════════════ */
function PackMockup() {
    const items = [
        { icon: '✈️', title: 'Vol direct', sub: 'Air Transat · 5-12 mars', price: '329$', priceColor: '#4ADE80' },
        { icon: '🏨', title: 'Casa do Principe', sub: '3★ · Alfama · 7 nuits', price: '504$', priceColor: 'white' },
        { icon: '🤖', title: 'Guide IA 7 jours', sub: 'Itinéraire + restos', price: 'Gratuit', priceColor: '#4ADE80' },
    ];

    return (
        <div style={{
            width: 220, animation: 'premFloat 4.5s ease-in-out infinite 0.3s',
        }}>
            <div style={{
                background: '#131F34', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden', boxShadow: '0 12px 35px rgba(0,0,0,0.4)',
            }}>
                {/* Head */}
                <div style={{
                    padding: '10px 12px',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(46,125,219,0.05))',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <h5 style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", margin: 0, color: 'white' }}>
                        Pack Lisbonne 🇵🇹
                    </h5>
                    <span style={{
                        fontSize: 7, fontWeight: 800, padding: '2px 7px', borderRadius: 100,
                        background: 'linear-gradient(135deg, #7C3AED, #2E7DDB)', color: '#fff',
                    }}>PRÊT</span>
                </div>
                {/* Items */}
                <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {items.map((item, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
                            borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.03)',
                        }}>
                            <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                            <div style={{ flex: 1 }}>
                                <strong style={{ fontSize: 10, display: 'block', color: 'white' }}>{item.title}</strong>
                                <small style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{item.sub}</small>
                            </div>
                            <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 11, fontWeight: 700, color: item.priceColor }}>
                                {item.price}
                            </span>
                        </div>
                    ))}
                </div>
                {/* Total */}
                <div style={{
                    padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                }}>
                    <div>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', display: 'block' }}>Total</span>
                        <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 700, color: 'white' }}>833$</span>
                    </div>
                    <span style={{
                        fontSize: 8, fontWeight: 700, color: '#4ADE80',
                        background: 'rgba(22,163,74,0.1)', padding: '2px 7px', borderRadius: 100,
                    }}>-420$</span>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   FEATURE CARD WRAPPER
   ═══════════════════════════════════════ */
function FeatureCard({ visGradient, emoji, label, labelColor, title, desc, children, delay = 0 }: {
    visGradient: string; emoji: string; label: string; labelColor: string; title: string; desc: string;
    children: React.ReactNode; delay?: number;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const visible = useInView(ref);

    return (
        <div ref={ref} style={{
            borderRadius: 20, overflow: 'hidden',
            border: '1px solid rgba(245,166,35,0.35)',
            background: 'rgba(255,255,255,0.02)',
            display: 'flex', flexDirection: 'column',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: `all 0.6s cubic-bezier(.25,.46,.45,.94) ${delay}s`,
            position: 'relative',
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(245,166,35,0.55)';
                e.currentTarget.style.boxShadow = '0 4px 30px rgba(245,166,35,0.12), 0 0 15px rgba(255,215,119,0.06)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(245,166,35,0.35)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {/* Visual top */}
            <div style={{
                position: 'relative', height: 240,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', background: visGradient,
            }}>
                {children}
            </div>
            {/* Text bottom */}
            <div style={{ padding: '20px 20px 24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                <div style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' as const,
                    marginBottom: 8, fontFamily: "'Fredoka', sans-serif",
                    display: 'flex', alignItems: 'center', gap: 4,
                }}>
                    <span style={{ WebkitTextFillColor: 'initial', color: labelColor, fontSize: 11 }}>{emoji}</span>
                    <span style={{
                        background: 'linear-gradient(135deg, #FFD777, #F5A623, #FFE4A0, #FFD777)',
                        backgroundSize: '200% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: 'premGoldShift 4s ease infinite',
                    }}>{label}</span>
                </div>
                <h3 style={{
                    fontFamily: "'Fredoka', sans-serif", fontSize: 17, fontWeight: 700,
                    lineHeight: 1.3, marginBottom: 8,
                    background: 'linear-gradient(135deg, #FFD777, #F5A623, #FFE4A0, #FFD777)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'premGoldShift 4s ease infinite',
                }}>{title}</h3>
                <p style={{
                    fontSize: 12.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6,
                    fontFamily: "'Fredoka', sans-serif", margin: 0,
                }}>{desc}</p>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   COMPARISON TABLE
   ═══════════════════════════════════════ */
const TABLE_ROWS = [
    { feature: 'Carte interactive des deals', free: 'check', prem: 'check' },
    { feature: 'Prix en temps réel', free: 'check', prem: 'check' },
    { feature: 'Filtres par mois et région', free: 'check', prem: 'check' },
    { feature: 'Alertes personnalisées', free: 'x', prem: 'check' },
    { feature: 'Accès prioritaire (2h avant)', free: 'x', prem: 'check' },
    { feature: 'Watchlist illimitée', free: 'x', prem: 'check' },
    { feature: '« Meilleur moment pour acheter »', free: 'x', prem: 'check' },
    { feature: 'Historique de prix 30 jours', free: 'x', prem: 'check' },
    { feature: 'Packs Vol + Hôtel + Guide', free: 'x', prem: 'check' },
    { feature: 'Guide IA personnalisé', free: '10$/guide', prem: 'Gratuit ✓' },
];

function ComparisonTable() {
    const ref = useRef<HTMLDivElement>(null);
    const visible = useInView(ref);

    return (
        <div ref={ref} style={{
            maxWidth: 680, margin: '0 auto 56px', position: 'relative', zIndex: 2,
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s cubic-bezier(.25,.46,.45,.94)',
        }}>
            <table style={{
                width: '100%', borderCollapse: 'separate', borderSpacing: 0,
                background: 'rgba(255,255,255,0.02)', borderRadius: 20,
                border: '1px solid rgba(245,166,35,0.1)', overflow: 'hidden',
            }}>
                <thead>
                    <tr>
                        <th style={{
                            padding: '20px 16px 14px', textAlign: 'left' as const, fontSize: 12,
                            fontWeight: 700, color: 'rgba(255,255,255,0.5)',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}>Fonctionnalité</th>
                        <th style={{
                            padding: '20px 16px 14px', textAlign: 'center' as const, fontSize: 11,
                            fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' as const,
                            color: 'rgba(255,255,255,0.35)', width: 120,
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}>Gratuit</th>
                        <th style={{
                            padding: '20px 16px 14px', textAlign: 'center' as const, fontSize: 11,
                            fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' as const,
                            color: '#FFD777', width: 120, position: 'relative' as const,
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(245,166,35,0.04)',
                        }}>
                            <div style={{
                                position: 'absolute', top: -1, left: -1, right: -1, height: 3,
                                background: 'linear-gradient(90deg, #C4841D, #FFD777, #F5A623)',
                                borderRadius: '20px 20px 0 0',
                            }} />
                            Premium 5$/m ⭐
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {TABLE_ROWS.map((row, i) => (
                        <tr key={i}>
                            <td style={{
                                padding: '13px 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)',
                                fontWeight: 600, borderBottom: i === TABLE_ROWS.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                            }}>{row.feature}</td>
                            <td style={{
                                padding: '13px 16px', textAlign: 'center' as const, width: 120, fontSize: 15,
                                borderBottom: i === TABLE_ROWS.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                            }}>
                                {row.free === 'check'
                                    ? <span style={{ color: '#4ADE80' }}>✓</span>
                                    : row.free === 'x'
                                        ? <span style={{ color: 'rgba(255,255,255,0.15)' }}>✗</span>
                                        : <span style={{ color: '#60A5FA', fontWeight: 700, fontSize: 12 }}>{row.free}</span>
                                }
                            </td>
                            <td style={{
                                padding: '13px 16px', textAlign: 'center' as const, width: 120, fontSize: 15,
                                background: 'rgba(245,166,35,0.02)',
                                borderBottom: i === TABLE_ROWS.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)',
                            }}>
                                {row.prem === 'check'
                                    ? <span style={{ color: '#4ADE80' }}>✓</span>
                                    : <span style={{ color: '#4ADE80', fontWeight: 700, fontSize: 12 }}>{row.prem}</span>
                                }
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ═══════════════════════════════════════
   MAIN PREMIUM SECTION
   ═══════════════════════════════════════ */
export default function PremiumSection() {
    const ctaRef = useRef<HTMLDivElement>(null);
    const ctaVisible = useInView(ctaRef);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(window.innerWidth <= 768);
        const h = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);

    return (
        <section style={{
            position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(175deg, #0F1A2A 0%, #152240 40%, #1A2B42 70%, #0F1A2A 100%)',
            padding: isMobile ? '70px 16px 60px' : '90px 24px 80px',
        }}>
            {/* ═══ KEYFRAME ANIMATIONS ═══ */}
            <style>{`
                @keyframes premFloat { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-5px) rotate(0deg)} }
                @keyframes premBlink { 0%,100%{opacity:1} 50%{opacity:.3} }
                @keyframes premOrbDrift { 0%,100%{transform:translate(0,0)} 33%{transform:translate(30px,-20px)} 66%{transform:translate(-20px,15px)} }
                @keyframes premGlow { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.12);opacity:1} }
                @keyframes premSpin { to{transform:rotate(360deg)} }
                @keyframes premBorderShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
                @keyframes premMascotFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
                @keyframes premBadgePop { to{transform:scale(1)} }
                @keyframes premShimmer { 0%{left:-100%} 50%,100%{left:200%} }
                @keyframes premGoldShift { 0%{background-position:0% center} 50%{background-position:100% center} 100%{background-position:0% center} }
                @keyframes premFadeUp { to{opacity:1;transform:translateY(0)} }
            `}</style>

            {/* ═══ BACKGROUND ORBS + GRID ═══ */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute', width: 600, height: 600, top: -200, left: -150, borderRadius: '50%',
                    filter: 'blur(90px)', background: 'radial-gradient(circle, rgba(245,166,35,0.08), transparent 70%)',
                    animation: 'premOrbDrift 22s ease-in-out infinite',
                }} />
                <div style={{
                    position: 'absolute', width: 500, height: 500, bottom: -180, right: -120, borderRadius: '50%',
                    filter: 'blur(90px)', background: 'radial-gradient(circle, rgba(196,132,29,0.07), transparent 70%)',
                    animation: 'premOrbDrift 26s ease-in-out infinite reverse',
                }} />
                <div style={{
                    position: 'absolute', width: 400, height: 400, top: '40%', left: '55%', borderRadius: '50%',
                    filter: 'blur(90px)', background: 'radial-gradient(circle, rgba(46,125,219,0.05), transparent 70%)',
                    animation: 'premOrbDrift 20s ease-in-out infinite 3s',
                }} />
            </div>
            {/* Grid overlay */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
                WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, #000 20%, transparent 60%)',
                maskImage: 'radial-gradient(ellipse at 50% 30%, #000 20%, transparent 60%)',
            }} />

            {/* ═══ HEADER WITH MASCOT ═══ */}
            <div style={{
                textAlign: 'center', position: 'relative', zIndex: 2, marginBottom: 56,
                opacity: 0, transform: 'translateY(25px)',
                animation: 'premFadeUp 0.7s ease forwards',
            }}>
                {/* Mascot circle */}
                <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 20px' }}>
                    {/* Outer golden glow */}
                    <div style={{
                        position: 'absolute', inset: -20, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(245,166,35,0.2), rgba(255,215,119,0.08), transparent 70%)',
                        animation: 'premGlow 4s ease-in-out infinite',
                    }} />
                    {/* Outer dashed ring */}
                    <div style={{
                        position: 'absolute', inset: -8, borderRadius: '50%',
                        border: '2px dashed rgba(245,166,35,0.3)',
                        animation: 'premSpin 25s linear infinite',
                    }} />
                    {/* Inner solid ring — gold shimmer */}
                    <div style={{
                        position: 'absolute', inset: -2, borderRadius: '50%', padding: 2,
                        background: 'linear-gradient(135deg, #FFD777, #F5A623, #C4841D, #FFD777)',
                        backgroundSize: '300% 300%',
                        animation: 'premBorderShift 4s ease infinite',
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                    }} />
                    {/* White circle with image */}
                    <div style={{
                        position: 'relative', width: '100%', height: '100%', borderRadius: '50%',
                        background: 'linear-gradient(145deg, #fff, #FFF9EC)',
                        boxShadow: '0 8px 32px rgba(245,166,35,0.2), 0 2px 8px rgba(0,0,0,0.08), inset 0 -2px 6px rgba(245,166,35,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                        animation: 'premMascotFloat 4s ease-in-out infinite', zIndex: 2,
                    }}>
                        <img
                            src="/mascots/premium-gold.png"
                            alt="GeaiMonVol Premium"
                            style={{ width: '70%', height: '70%', objectFit: 'contain', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.1))' }}
                        />
                    </div>
                    {/* Star badge */}
                    <div style={{
                        position: 'absolute', top: -4, right: -4, width: 32, height: 32, borderRadius: 10,
                        background: 'linear-gradient(135deg, #F5A623, #C4841D)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, boxShadow: '0 4px 12px rgba(245,166,35,0.35)', zIndex: 3,
                        transform: 'scale(0)', animation: 'premBadgePop 0.5s cubic-bezier(.34,1.56,.64,1) forwards 0.3s',
                    }}>⭐</div>
                </div>

                {/* Badge pill */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '7px 18px', borderRadius: 100, marginBottom: 22,
                    background: 'linear-gradient(135deg, rgba(245,166,35,0.1), rgba(255,215,119,0.06))',
                    border: '1px solid rgba(245,166,35,0.25)', position: 'relative', overflow: 'hidden',
                }}>
                    {/* Shimmer */}
                    <div style={{
                        position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,215,119,0.12), transparent)',
                        animation: 'premShimmer 3.5s ease-in-out infinite',
                    }} />
                    <span style={{ fontSize: 12, position: 'relative' }}>⭐</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#FFD777', position: 'relative', fontFamily: "'Fredoka', sans-serif" }}>
                        GeaiMonVol Premium
                    </span>
                </div>

                {/* Heading */}
                <h2 style={{
                    fontFamily: "'Fredoka', sans-serif", fontSize: isMobile ? 28 : 40, fontWeight: 700,
                    lineHeight: 1.12, marginBottom: 14, color: 'white',
                }}>
                    Arrête de chercher.<br />
                    <span style={{
                        fontStyle: 'normal',
                        background: 'linear-gradient(135deg, #FFD777, #F5A623, #FFE4A0, #FFD777)',
                        backgroundSize: '200% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: 'premGoldShift 4s ease infinite',
                    }}>
                        On te trouve les deals.
                    </span>
                </h2>

                {/* Subtitle */}
                <p style={{
                    fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 480,
                    margin: '0 auto', lineHeight: 1.65, fontFamily: "'Fredoka', sans-serif",
                }}>
                    Le gratuit te montre les prix. Le Premium te dit{' '}
                    <strong style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>quand acheter</strong>, te notifie{' '}
                    <strong style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>avant tout le monde</strong>, et prépare{' '}
                    <strong style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>ton voyage au complet</strong>.
                </p>
            </div>

            {/* ═══ 3 FEATURE CARDS ═══ */}
            <div style={{
                maxWidth: 1000, margin: '0 auto 56px',
                display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16,
                position: 'relative', zIndex: 2,
                ...(isMobile ? { maxWidth: 380 } : {}),
            }}>
                <FeatureCard
                    visGradient="linear-gradient(145deg, rgba(196,132,29,0.12), rgba(245,166,35,0.06))"
                    emoji="🔔" label="ALERTES PERSO" labelColor="#16A34A"
                    title="Prix en chute ? Tu le sais avant tout le monde."
                    desc="Choisis tes destinations, on te notifie dès qu'un prix chute — 2h avant les utilisateurs gratuits."
                    delay={0}
                >
                    <AlertMockup />
                </FeatureCard>

                <FeatureCard
                    visGradient="linear-gradient(145deg, rgba(196,132,29,0.12), rgba(245,166,35,0.06))"
                    emoji="📉" label="TIMING D'ACHAT" labelColor="#60A5FA"
                    title="On te dit si c'est le bon moment — ou pas."
                    desc="Historique 30 jours + score clair. Tu sais si tu dois acheter maintenant ou attendre que ça baisse encore."
                    delay={0.1}
                >
                    <ChartMockup />
                </FeatureCard>

                <FeatureCard
                    visGradient="linear-gradient(145deg, rgba(196,132,29,0.12), rgba(245,166,35,0.06))"
                    emoji="🧳" label="PACKS VOYAGE" labelColor="#A78BFA"
                    title="Vol + Hôtel + Guide IA. Tout prêt."
                    desc="Quand un prix chute, on prépare le pack complet. Tu réserves, tu pars. Le guide IA est inclus avec Premium."
                    delay={0.2}
                >
                    <PackMockup />
                </FeatureCard>
            </div>

            {/* ═══ COMPARISON TABLE ═══ */}
            <ComparisonTable />

            {/* ═══ BOTTOM CTA ═══ */}
            <div ref={ctaRef} style={{
                textAlign: 'center', position: 'relative', zIndex: 2,
                opacity: ctaVisible ? 1 : 0, transform: ctaVisible ? 'translateY(0)' : 'translateY(25px)',
                transition: 'all 0.6s cubic-bezier(.25,.46,.45,.94)',
            }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: isMobile ? 10 : 16,
                    background: 'linear-gradient(135deg, #ffffff, #FFF9EC)',
                    borderRadius: 100,
                    padding: isMobile ? '5px 5px 5px 20px' : '6px 6px 6px 30px',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.3), 0 0 20px rgba(245,166,35,0.08)',
                    marginBottom: 14,
                    border: '1px solid rgba(245,166,35,0.15)',
                }}>
                    <span style={{
                        fontFamily: "'Fredoka', sans-serif", fontWeight: 700, color: '#5A6B80',
                        display: 'flex', alignItems: 'baseline', gap: 2,
                    }}>
                        <span style={{ fontSize: isMobile ? 16 : 18 }}>5$</span>
                        <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, color: '#8FA3B8' }}>/mois</span>
                    </span>
                    <button
                        style={{
                            padding: isMobile ? '13px 28px' : '16px 38px', borderRadius: 100, border: 'none',
                            background: 'linear-gradient(135deg, #FFD777 0%, #F5A623 40%, #C4841D 100%)',
                            backgroundSize: '200% auto',
                            color: '#fff', fontSize: isMobile ? 15 : 17, fontWeight: 700, cursor: 'pointer',
                            fontFamily: "'Fredoka', sans-serif",
                            boxShadow: '0 4px 20px rgba(245,166,35,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
                            transition: 'all 0.3s cubic-bezier(.25,.46,.45,.94)',
                            textShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            position: 'relative',
                            overflow: 'hidden',
                            letterSpacing: 0.3,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 8px 36px rgba(245,166,35,0.5), inset 0 1px 0 rgba(255,255,255,0.25)';
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                            e.currentTarget.style.backgroundPosition = '100% center';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,166,35,0.35), inset 0 1px 0 rgba(255,255,255,0.25)';
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.backgroundPosition = '0% center';
                        }}
                    >
                        ⭐ Devenir Premium →
                    </button>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 20, flexWrap: 'wrap',
                }}>
                    {['🚫 Pas de contrat', '💳 Annule en 1 clic', '🔒 Paiement sécurisé'].map((txt, i) => (
                        <span key={i} style={{
                            fontSize: 11, color: 'rgba(255,255,255,0.28)', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}>{txt}</span>
                    ))}
                </div>
            </div>
        </section>
    );
}
