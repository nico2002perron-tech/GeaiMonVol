'use client';
import { useEffect, useState } from 'react';

export default function Loader() {
    const [done, setDone] = useState(false);
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        setTimeout(() => setPhase(1), 300);   // Logo appears
        setTimeout(() => setPhase(2), 1200);  // Plane flies
        setTimeout(() => setPhase(3), 2200);  // Text appears
        setTimeout(() => setDone(true), 3000); // Fade out
    }, []);

    return (
        <div id="loader" className={done ? 'done' : ''} style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'linear-gradient(135deg, #0B1D35 0%, #132F52 50%, #1A3F6B 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            transition: 'opacity 0.8s ease, visibility 0.8s',
            overflow: 'hidden',
        }}>
            {/* Stars background */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        width: Math.random() * 3 + 1,
                        height: Math.random() * 3 + 1,
                        background: 'white',
                        borderRadius: '50%',
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        opacity: Math.random() * 0.5 + 0.2,
                        animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite ${Math.random() * 2}s`,
                    }} />
                ))}
            </div>

            {/* Globe silhouette */}
            <div style={{
                position: 'absolute',
                width: 400, height: 400,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 40% 40%, rgba(46,125,219,0.08) 0%, transparent 70%)',
                border: '1px solid rgba(46,125,219,0.06)',
                opacity: phase >= 1 ? 0.6 : 0,
                transition: 'opacity 1s ease',
            }} />

            {/* Plane flying across */}
            <div style={{
                position: 'absolute',
                fontSize: 32,
                transition: 'all 1.5s cubic-bezier(.22, 1, .36, 1)',
                transform: phase >= 2
                    ? 'translate(150px, -80px) rotate(-15deg) scale(0.8)'
                    : 'translate(-200px, 60px) rotate(-5deg) scale(1)',
                opacity: phase >= 1 ? 1 : 0,
                filter: phase >= 2 ? 'blur(1px)' : 'none',
            }}>
                ✈️
            </div>

            {/* Contrail / trail */}
            {phase >= 2 && (
                <div style={{
                    position: 'absolute',
                    width: 300, height: 2,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    transform: 'rotate(-12deg)',
                    animation: 'trailFade 1.5s ease forwards',
                }} />
            )}

            {/* Logo */}
            <div style={{
                position: 'relative', zIndex: 2,
                opacity: phase >= 1 ? 1 : 0,
                transform: phase >= 1 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
                transition: 'all 0.8s cubic-bezier(.22, 1, .36, 1)',
            }}>
                <div style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontSize: 36, fontWeight: 700,
                    color: 'white', letterSpacing: -0.5,
                    textAlign: 'center',
                }}>
                    Geai<span style={{ color: '#4A94E8' }}>Mon</span>Vol
                </div>
            </div>

            {/* Tagline */}
            <div style={{
                position: 'relative', zIndex: 2,
                marginTop: 16,
                opacity: phase >= 3 ? 1 : 0,
                transform: phase >= 3 ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.6s ease',
                fontSize: 14, fontWeight: 500,
                color: 'rgba(255,255,255,0.5)',
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: 2,
                textTransform: 'uppercase',
            }}>
                Scanning des meilleurs prix...
            </div>

            {/* Loading dots */}
            <div style={{
                display: 'flex', gap: 6,
                marginTop: 20,
                opacity: phase >= 1 ? 1 : 0,
                transition: 'opacity 0.5s',
            }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{
                        width: 6, height: 6,
                        borderRadius: '50%',
                        background: '#4A94E8',
                        animation: `loadDot 1.4s ease-in-out infinite ${i * 0.2}s`,
                    }} />
                ))}
            </div>

            <style>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 0.8; }
                }
                @keyframes trailFade {
                    0% { opacity: 0; width: 0; }
                    50% { opacity: 0.5; width: 300px; }
                    100% { opacity: 0; width: 350px; }
                }
                @keyframes loadDot {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
                    40% { transform: scale(1.2); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
