'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

function CountUpStat({ target }: { target: string }) {
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

    return <div ref={ref} className="landing-footer-stat-num">{display}</div>;
}

const STATS = [
    { num: '200+', label: 'vols scannes / jour', icon: '✈️' },
    { num: '4.8/5', label: 'satisfaction voyageurs', icon: '⭐' },
    { num: '35%', label: "d'economie moyenne", icon: '💰' },
    { num: '5,000+', label: 'alertes envoyees', icon: '🔔' },
];

const PRODUCT_LINKS = [
    { label: 'Explorer les deals', href: '#' },
    { label: 'Premium', href: '/pricing' },
    { label: 'Recits de voyage', href: '/recits' },
    { label: 'Planificateur Quebec', href: '#' },
];

const INFO_LINKS = [
    { label: 'Comment ca marche', href: '#how-it-works' },
    { label: 'Transparence & vie privee', href: '#' },
    { label: 'FAQ', href: '#' },
    { label: 'Contact', href: '#' },
];

export default function Footer() {
    const [email, setEmail] = useState('');

    return (
        <div className="landing-footer">
            <div className="landing-footer-inner">
                {/* Social proof stats */}
                <div className="landing-footer-stats">
                    {STATS.map((stat, i) => (
                        <div key={i} className="landing-footer-stat">
                            <div className="landing-footer-stat-icon">
                                <span>{stat.icon}</span>
                            </div>
                            <CountUpStat target={stat.num} />
                            <div className="landing-footer-stat-label">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Grid columns */}
                <div className="landing-footer-grid">
                    {/* Brand column */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <div style={{ position: 'relative', width: 28, height: 28 }}>
                                <Image src="/logo_geai.png" alt="Logo" fill style={{ objectFit: 'contain' }} />
                            </div>
                            <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 18, color: 'white' }}>
                                Geai<span style={{ color: '#2F6BFF' }}>MonVol</span>
                            </span>
                        </div>
                        <p className="landing-footer-brand-desc">
                            Les meilleurs deals de vols depuis Montreal, trouves par notre IA et livres en temps reel.
                        </p>
                    </div>

                    {/* Produit */}
                    <div>
                        <h4 className="landing-footer-heading">Produit</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {PRODUCT_LINKS.map((link, i) => (
                                <Link key={i} href={link.href} className="landing-footer-link">
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Infos */}
                    <div>
                        <h4 className="landing-footer-heading">Infos</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {INFO_LINKS.map((link, i) => (
                                <Link key={i} href={link.href} className="landing-footer-link">
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="landing-footer-heading">Alertes deals</h4>
                        <p className="landing-footer-brand-desc" style={{ marginBottom: 12 }}>
                            Recois les meilleurs deals directement dans ta boite.
                        </p>
                        <div className="landing-footer-newsletter">
                            <input
                                type="email"
                                placeholder="ton@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <button type="button">S&apos;inscrire</button>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="landing-footer-bottom">
                    <p className="landing-footer-copy">
                        &copy; {new Date().getFullYear()} GeaiMonVol &middot; Fait avec ❤️ a Rimouski
                    </p>
                    <div className="landing-footer-legal">
                        {['Conditions', 'Confidentialite', 'Cookies'].map((txt, i) => (
                            <span key={i}>{txt}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
