'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

function CountUpStat({ target, suffix = '' }: { target: string; suffix?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [display, setDisplay] = useState(target);
    const counted = useRef(false);

    useEffect(() => {
        if (!ref.current) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !counted.current) {
                counted.current = true;
                const numMatch = target.match(/[\d,.]+/);
                if (!numMatch) return;
                const numStr = numMatch[0].replace(/,/g, '');
                const endVal = parseFloat(numStr);
                const prefix = target.slice(0, target.indexOf(numMatch[0]));
                const suffixPart = target.slice(target.indexOf(numMatch[0]) + numMatch[0].length);
                const duration = 2000;
                const start = performance.now();
                const animate = (now: number) => {
                    const t = Math.min((now - start) / duration, 1);
                    const ease = 1 - Math.pow(1 - t, 3);
                    const current = Math.round(ease * endVal);
                    const formatted = numMatch[0].includes(',')
                        ? current.toLocaleString('en-US')
                        : numMatch[0].includes('.') ? (ease * endVal).toFixed(1) : String(current);
                    setDisplay(prefix + formatted + suffixPart);
                    if (t < 1) requestAnimationFrame(animate);
                };
                requestAnimationFrame(animate);
            }
        }, { threshold: 0.3 });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target]);

    return <div ref={ref} style={{ color: '#06B6D4' }}>{display}</div>;
}

export default function Footer() {
    const [email, setEmail] = useState('');

    return (
        <div style={{
            background: 'linear-gradient(180deg, #062A3E 0%, #031520 100%)',
            padding: '60px 24px 30px',
            fontFamily: "'Outfit', sans-serif",
        }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                {/* Social proof stats */}
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap',
                    marginBottom: 48, paddingBottom: 32,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                    {[
                        { num: '200+', label: 'vols scannés / jour', icon: '✈️' },
                        { num: '4.8/5', label: 'satisfaction voyageurs', icon: '⭐' },
                        { num: '35%', label: "d'économie moyenne", icon: '💰' },
                        { num: '5,000+', label: 'alertes envoyées', icon: '🔔' },
                    ].map((stat, i) => (
                        <div key={i} style={{ textAlign: 'center', minWidth: 120 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: '50%',
                                background: 'rgba(0,212,255,0.06)',
                                border: '1px solid rgba(0,212,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 8px',
                            }}>
                                <span style={{ fontSize: 18 }}>{stat.icon}</span>
                            </div>
                            <div style={{
                                fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 700,
                                lineHeight: 1,
                            }}>
                                <CountUpStat target={stat.num} />
                            </div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, fontWeight: 500 }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3 columns + newsletter */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 32,
                    marginBottom: 40,
                }}>
                    {/* Brand column */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <div style={{ position: 'relative', width: 28, height: 28 }}>
                                <Image src="/logo_geai.png" alt="Logo" fill style={{ objectFit: 'contain' }} />
                            </div>
                            <span style={{
                                fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 18, color: 'white',
                            }}>
                                Geai<span style={{ color: '#00D4FF' }}>MonVol</span>
                            </span>
                        </div>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, maxWidth: 220 }}>
                            Les meilleurs deals de vols depuis Montréal, trouvés par notre IA et livrés en temps réel.
                        </p>
                    </div>

                    {/* Produit */}
                    <div>
                        <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
                            Produit
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { label: 'Explorer les deals', href: '#' },
                                { label: 'Premium', href: '/pricing' },
                                { label: 'Récits de voyage', href: '/recits' },
                                { label: 'Planificateur Québec', href: '#' },
                            ].map((link, i) => (
                                <Link key={i} href={link.href} style={{
                                    fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
                                    transition: 'color 0.2s',
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#00D4FF')}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                                >{link.label}</Link>
                            ))}
                        </div>
                    </div>

                    {/* Infos */}
                    <div>
                        <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
                            Infos
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { label: 'Comment ça marche', href: '#how-it-works' },
                                { label: 'Transparence & vie privée', href: '#' },
                                { label: 'FAQ', href: '#' },
                                { label: 'Contact', href: '#' },
                            ].map((link, i) => (
                                <Link key={i} href={link.href} style={{
                                    fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
                                    transition: 'color 0.2s',
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#00D4FF')}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                                >{link.label}</Link>
                            ))}
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
                            Alertes deals
                        </h4>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, marginBottom: 12 }}>
                            Reçois les meilleurs deals directement dans ta boîte.
                        </p>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <input
                                type="email"
                                placeholder="ton@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{
                                    flex: 1, padding: '9px 12px', borderRadius: 10,
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white', fontSize: 12,
                                    fontFamily: "'Outfit', sans-serif",
                                    outline: 'none',
                                    minWidth: 0,
                                }}
                            />
                            <button style={{
                                padding: '9px 16px', borderRadius: 10, border: 'none',
                                background: 'linear-gradient(135deg, #0891B2, #06B6D4)',
                                color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                fontFamily: "'Outfit', sans-serif",
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 12px rgba(6,182,212,0.2)',
                                animation: 'ctaPulse 3s ease-in-out infinite',
                            }}>
                                S'inscrire
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 12,
                }}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                        © {new Date().getFullYear()} GeaiMonVol · Fait avec ❤️ à Rimouski
                    </p>
                    <div style={{ display: 'flex', gap: 16 }}>
                        {['Conditions', 'Confidentialité', 'Cookies'].map((txt, i) => (
                            <span key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
                            >{txt}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
