'use client';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';

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

const LEVEL_COLORS: Record<string, { bg: string; label: string; icon: string }> = {
    lowest_ever: { bg: '#7C3AED', label: 'PRIX RECORD', icon: '⚡' },
    incredible: { bg: '#DC2626', label: 'INCROYABLE', icon: '🔥' },
    great: { bg: '#EA580C', label: 'SUPER DEAL', icon: '✨' },
    good: { bg: '#2E7DDB', label: 'BON PRIX', icon: '👍' },
};

// Placeholder stories — will be replaced with Supabase data
const PLACEHOLDER_STORIES = [
    {
        id: 1,
        author: 'Marie-Ève L.',
        avatar: '🧑🦰',
        destination: 'Paris',
        code: 'CDG',
        dates: '12–19 mars 2025',
        rating: 5,
        title: 'Paris au printemps, un rêve devenu réalité',
        excerpt: 'On a trouvé ce deal à 195$ aller-retour sur GeaiMonVol et on a pas hésité une seconde. Le vol Air Transat était super confortable...',
        likes: 47,
        commentCount: 8,
        date: '22 mars 2025',
        dealLevel: 'lowest_ever',
        pricePaid: '195$',
        verified: true,
    },
    {
        id: 2,
        author: 'Alex T.',
        avatar: '🧔',
        destination: 'Cancún',
        code: 'CUN',
        dates: '5–12 février 2025',
        rating: 4,
        title: '7 jours all-inclusive à Cancún pour moins de 1000$',
        excerpt: 'Ma blonde et moi on cherchait une escapade soleil pas trop chère. Quand j\'ai vu le deal à 220$ sur GeaiMonVol...',
        likes: 34,
        commentCount: 3,
        date: '15 février 2025',
        dealLevel: 'incredible',
        pricePaid: '220$',
        verified: true,
    },
    {
        id: 3,
        author: 'François G.',
        avatar: '👨🦲',
        destination: 'Tokyo',
        code: 'NRT',
        dates: '1–14 avril 2025',
        rating: 5,
        title: '2 semaines au Japon pendant les cerisiers en fleurs',
        excerpt: 'Le deal Tokyo à 699$ c\'était déjà bien, mais le guide IA m\'a sauvé facilement 500$ en me suggérant des ryokans abordables...',
        likes: 89,
        commentCount: 12,
        date: '18 avril 2025',
        dealLevel: 'good',
        pricePaid: '699$',
        verified: true,
    },
];

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
    return (
        <div style={{ display: 'flex', gap: 1 }}>
            {[1, 2, 3, 4, 5].map(star => (
                <span key={star} style={{ fontSize: size, color: star <= rating ? '#F59E0B' : '#D1D5DB' }}>
                    ★
                </span>
            ))}
        </div>
    );
}

function StoryCard({ story, featured = false }: { story: any; featured?: boolean }) {
    const col = LEVEL_COLORS[story.dealLevel] || LEVEL_COLORS.good;
    return (
        <div
            className="deal-card"
            style={{
                background: 'white',
                borderRadius: 16,
                overflow: 'hidden',
                border: featured ? `2px solid ${col.bg}20` : '1px solid rgba(26,43,66,0.06)',
                boxShadow: featured ? `0 8px 32px ${col.bg}10` : '0 2px 12px rgba(26,43,66,0.05)',
                cursor: 'pointer',
                minWidth: featured ? 310 : 270,
                maxWidth: featured ? 340 : 290,
                flexShrink: 0,
            }}
        >
            {/* Header */}
            <div style={{
                background: `linear-gradient(135deg, ${col.bg}12 0%, ${col.bg}04 100%)`,
                padding: '14px 16px 10px',
                borderBottom: '1px solid rgba(26,43,66,0.04)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22 }}>{story.avatar}</span>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1A2B42', fontFamily: "'Outfit', sans-serif" }}>
                                {story.author}
                            </div>
                            <div style={{ fontSize: 9, color: '#8FA3B8' }}>{story.date}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {story.verified && (
                            <span style={{ fontSize: 8, background: '#ECFDF5', color: '#16A34A', padding: '2px 6px', borderRadius: 100, fontWeight: 700 }}>
                                ✓ Vérifié
                            </span>
                        )}
                        <span style={{ fontSize: 8, fontWeight: 800, background: col.bg, color: 'white', padding: '2px 7px', borderRadius: 100 }}>
                            {col.icon} {story.pricePaid}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#1A2B42', fontFamily: "'Outfit', sans-serif" }}>
                        YUL → {story.destination}
                    </span>
                    <span style={{ fontSize: 9, color: '#8FA3B8' }}>{story.dates}</span>
                </div>
                <div style={{ marginTop: 4 }}>
                    <StarRating rating={story.rating} />
                </div>
            </div>

            {/* Body */}
            <div style={{ padding: '12px 16px 14px' }}>
                <h3 style={{
                    fontSize: 13, fontWeight: 700, color: '#1A2B42', margin: '0 0 6px',
                    lineHeight: 1.3, fontFamily: "'Outfit', sans-serif",
                }}>
                    {story.title}
                </h3>
                <p style={{
                    fontSize: 11.5, color: '#5A7089', lineHeight: 1.5, margin: 0,
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any,
                    overflow: 'hidden',
                }}>
                    {story.excerpt}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 10, color: '#8FA3B8' }}>❤️ {story.likes}</span>
                        <span style={{ fontSize: 10, color: '#8FA3B8' }}>💬 {story.commentCount}</span>
                        <span style={{
                            fontSize: 8, fontWeight: 700, color: '#7C3AED',
                            background: 'rgba(124,58,237,0.06)', padding: '2px 6px',
                            borderRadius: 100,
                        }}>
                            🧠 Entraîne l'IA
                        </span>
                    </div>
                    <span style={{ fontSize: 10, color: '#2E7DDB', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                        Lire →
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function RecitsSection() {
    return (
        <div style={{ background: '#F8FAFC', padding: '60px 24px', overflow: 'hidden' }}>
            <AnimatedDiv>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '6px 16px', borderRadius: 100,
                        background: 'rgba(46,125,219,0.08)', marginBottom: 12,
                    }}>
                        <span>📖</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#2E7DDB', fontFamily: "'Outfit', sans-serif" }}>
                            Récits de voyageurs
                        </span>
                    </div>
                    <h2 style={{
                        fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 700,
                        color: '#1A2B42', margin: '0 0 8px',
                    }}>
                        Ils sont partis grâce à GeaiMonVol.
                    </h2>
                    <p style={{ fontSize: 14, color: '#5A7089', margin: '0 auto', maxWidth: 540, lineHeight: 1.6 }}>
                        De vrais voyageurs, de vrais deals, de vraies aventures.
                    </p>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '8px 18px', borderRadius: 100, marginTop: 12,
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(46,125,219,0.06))',
                        border: '1px solid rgba(124,58,237,0.1)',
                    }}>
                        <span style={{ fontSize: 14 }}>🧠</span>
                        <span style={{
                            fontSize: 12, fontWeight: 700,
                            background: 'linear-gradient(135deg, #7C3AED, #2E7DDB)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            Chaque récit entraîne notre IA à donner de meilleurs conseils voyage
                        </span>
                    </div>
                </div>
            </AnimatedDiv>

            {/* Story cards */}
            <AnimatedDiv delay={0.2}>
                <div style={{
                    display: 'flex', gap: 20, overflowX: 'auto',
                    padding: '0 0 20px', scrollbarWidth: 'none',
                    justifyContent: 'center',
                }}>
                    {PLACEHOLDER_STORIES.map((story, i) => (
                        <StoryCard key={story.id} story={story} featured={i === 0} />
                    ))}
                </div>
            </AnimatedDiv>

            {/* CTA */}
            <AnimatedDiv delay={0.4}>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 12,
                        background: 'white', borderRadius: 100,
                        padding: '6px 6px 6px 20px',
                        border: '1px solid rgba(26,43,66,0.06)',
                        boxShadow: '0 2px 12px rgba(26,43,66,0.06)',
                        flexWrap: 'wrap',
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2B42', fontFamily: "'Outfit', sans-serif" }}>
                                T'as voyagé avec nos deals ?
                            </span>
                            <span style={{ fontSize: 10, color: '#8FA3B8' }}>
                                🎁 1 mois Premium offert pour chaque récit
                            </span>
                        </div>
                        <Link href="/recits" style={{
                            padding: '10px 22px', borderRadius: 100, border: 'none',
                            background: 'linear-gradient(135deg, #2E7DDB, #1B5BA0)',
                            color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                            boxShadow: '0 4px 16px rgba(46,125,219,0.2)',
                            textDecoration: 'none',
                            display: 'inline-block',
                        }}>
                            Raconter mon voyage ✈️
                        </Link>
                    </div>
                </div>
            </AnimatedDiv>
        </div>
    );
}
