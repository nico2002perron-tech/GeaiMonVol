'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   ScrollJourney — cinematic flight tracker + section reveals
   
   Features:
   1. Flight Progress Tracker (vertical flight path on right)
   2. Section Reveal Animations (Intersection Observer)
   3. Mini-Globe Sticky Nav (top-left when globe out of view)
   4. Parallax Depth (starfield moves on scroll)
   ═══════════════════════════════════════════════════════════════ */

const WAYPOINTS = [
    { id: 'globe', label: 'Départ', icon: '🌍', pct: 0 },
    { id: 'deals', label: 'Deals', icon: '✈️', pct: 25 },
    { id: 'how-it-works', label: 'Comment', icon: '⚙️', pct: 50 },
    { id: 'premium', label: 'Premium', icon: '💎', pct: 70 },
    { id: 'recits-section', label: 'Récits', icon: '📖', pct: 85 },
    { id: 'footer', label: 'Arrivée', icon: '🏁', pct: 100 },
];

// ─── Section Reveal Hook ───
export function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(el); // only animate once
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return { ref, isVisible };
}

// ─── Reveal wrapper component ───
export function RevealSection({
    children,
    direction = 'up',
    delay = 0,
    className,
    style,
    id,
}: {
    children: React.ReactNode;
    direction?: 'up' | 'left' | 'right' | 'scale';
    delay?: number;
    className?: string;
    style?: React.CSSProperties;
    id?: string;
}) {
    const { ref, isVisible } = useScrollReveal();

    const transforms: Record<string, string> = {
        up: 'translateY(40px)',
        left: 'translateX(-40px)',
        right: 'translateX(40px)',
        scale: 'scale(0.92)',
    };

    return (
        <div
            ref={ref}
            id={id}
            className={className}
            style={{
                ...style,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'none' : transforms[direction],
                transition: `opacity 0.7s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}s, transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}s`,
                willChange: 'opacity, transform',
            }}
        >
            {children}
        </div>
    );
}

// ─── Flight Progress Tracker ───
export function FlightTracker() {
    const [scrollPct, setScrollPct] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollTop = window.scrollY;
                    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const pct = Math.min(100, (scrollTop / docHeight) * 100);
                    setScrollPct(pct);
                    setVisible(scrollTop > 300);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollTo = useCallback((id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    return (
        <>
            <style>{`
                @keyframes planeFloat{0%,100%{transform:translateX(-50%) translateY(-2px)}50%{transform:translateX(-50%) translateY(2px)}}
                @keyframes waypointPulse{0%,100%{box-shadow:0 0 0 0 rgba(0,212,255,0.3)}50%{box-shadow:0 0 0 6px rgba(0,212,255,0)}}
                @keyframes trackerFadeIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
                .flight-tracker{position:fixed;right:16px;top:50%;transform:translateY(-50%);z-index:999;display:flex;flex-direction:column;align-items:center;pointer-events:auto;}
                .flight-tracker .track{position:relative;width:3px;height:280px;border-radius:3px;background:linear-gradient(180deg,rgba(0,212,255,0.08),rgba(0,212,255,0.15),rgba(167,139,250,0.08));}
                .flight-tracker .track-fill{position:absolute;top:0;left:0;width:100%;border-radius:3px;background:linear-gradient(180deg,#00D4FF,#7DF9FF,#A78BFA);transition:height 0.3s ease-out;box-shadow:0 0 8px rgba(0,212,255,0.3);}
                .flight-tracker .plane{position:absolute;left:50%;transform:translateX(-50%);transition:top 0.3s ease-out;animation:planeFloat 3s ease-in-out infinite;font-size:16px;filter:drop-shadow(0 0 6px rgba(0,212,255,0.5));z-index:2;}
                .flight-tracker .waypoint{position:absolute;left:50%;transform:translateX(-50%);width:8px;height:8px;border-radius:50%;border:1.5px solid rgba(0,212,255,0.3);background:rgba(5,10,26,0.9);transition:all 0.3s ease;cursor:pointer;z-index:1;}
                .flight-tracker .waypoint.passed{background:rgba(0,212,255,0.6);border-color:#00D4FF;animation:waypointPulse 2s ease-in-out infinite;}
                .flight-tracker .waypoint:hover{transform:translateX(-50%) scale(1.5);border-color:#00D4FF;}
                .flight-tracker .wp-label{position:absolute;right:18px;white-space:nowrap;font-size:9px;font-weight:600;color:rgba(255,255,255,0.25);font-family:'Outfit',sans-serif;letter-spacing:0.5px;transition:all 0.3s ease;pointer-events:none;}
                .flight-tracker .waypoint:hover+.wp-label,.flight-tracker .waypoint.passed+.wp-label{color:rgba(255,255,255,0.7);}
                @media(max-width:768px){.flight-tracker{right:8px;}.flight-tracker .track{height:200px;}.flight-tracker .wp-label{display:none;}}
            `}</style>

            <div
                className="flight-tracker"
                style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(-50%)' : 'translateY(-50%) translateX(20px)',
                    transition: 'opacity 0.5s ease, transform 0.5s ease',
                }}
            >
                <div className="track">
                    {/* Fill bar */}
                    <div className="track-fill" style={{ height: `${scrollPct}%` }} />

                    {/* Airplane */}
                    <div className="plane" style={{ top: `calc(${scrollPct}% - 10px)` }}>
                        ✈️
                    </div>

                    {/* Waypoints */}
                    {WAYPOINTS.map((wp) => (
                        <div key={wp.id} style={{ position: 'absolute', top: `${wp.pct}%`, left: '50%' }}>
                            <div
                                className={`waypoint ${scrollPct >= wp.pct ? 'passed' : ''}`}
                                onClick={() => scrollTo(wp.id)}
                                title={wp.label}
                            />
                            <div className="wp-label" style={{ top: -3 }}>
                                {wp.icon} {wp.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

// ─── Mini Globe Sticky Button ───
export function MiniGlobeNav() {
    const [showMini, setShowMini] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setShowMini(window.scrollY > window.innerHeight * 0.9);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <style>{`
                @keyframes miniGlobeSpin{0%{transform:rotateY(0deg)}100%{transform:rotateY(360deg)}}
                @keyframes miniGlobeIn{from{opacity:0;transform:scale(0.3) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
                .mini-globe-btn{position:fixed;top:14px;left:14px;z-index:1001;width:38px;height:38px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#1a4a8a,#0a1e3d,#050a1a);border:1.5px solid rgba(0,212,255,0.25);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.4),0 0 12px rgba(0,212,255,0.15);transition:all 0.3s ease;overflow:hidden;}
                .mini-globe-btn:hover{transform:scale(1.15);border-color:rgba(0,212,255,0.5);box-shadow:0 4px 24px rgba(0,0,0,0.4),0 0 20px rgba(0,212,255,0.3);}
                .mini-globe-btn .dots{position:absolute;inset:4px;border-radius:50%;background:repeating-conic-gradient(rgba(0,212,255,0.15) 0deg 2deg,transparent 2deg 12deg);animation:miniGlobeSpin 8s linear infinite;}
                .mini-globe-btn .shine{position:absolute;top:5px;left:8px;width:8px;height:5px;background:rgba(125,249,255,0.25);border-radius:50%;filter:blur(2px);}
                @media(max-width:768px){.mini-globe-btn{width:32px;height:32px;top:10px;left:10px;}}
            `}</style>

            {showMini && (
                <button
                    className="mini-globe-btn"
                    onClick={scrollToTop}
                    title="Retour au globe"
                    style={{
                        animation: 'miniGlobeIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
                    }}
                >
                    <div className="dots" />
                    <div className="shine" />
                    <span style={{ position: 'relative', zIndex: 1, fontSize: 16 }}>🌍</span>
                </button>
            )}
        </>
    );
}

// ─── Parallax Starfield Controller ───
export function useParallax() {
    useEffect(() => {
        const starfield = document.querySelector('.starfield-layer') as HTMLElement;
        if (!starfield) return;

        let ticking = false;
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    // Stars move at 30% of scroll speed for parallax depth
                    starfield.style.transform = `translateY(${scrollY * -0.3}px)`;
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
}
