'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export default function MissionPopup() {
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);
    const [typedText, setTypedText] = useState('');
    const [showCursor, setShowCursor] = useState(true);
    const [valuesVisible, setValuesVisible] = useState([false, false, false]);
    const modalRef = useRef<HTMLDivElement>(null);
    const mascotWrapRef = useRef<HTMLDivElement>(null);
    const mascotImgRef = useRef<HTMLImageElement>(null);

    const fullText = "On trouve les vrais deals, tu vis l'expérience.";

    // Show popup on mount
    useEffect(() => {
        const alreadySeen = sessionStorage.getItem('mission-seen');
        if (!alreadySeen) {
            const t = setTimeout(() => setVisible(true), 600);
            return () => clearTimeout(t);
        }
    }, []);

    // Typewriter
    useEffect(() => {
        if (!visible || closing) return;
        let idx = 0;
        const t = setInterval(() => {
            idx++;
            setTypedText(fullText.slice(0, idx));
            if (idx >= fullText.length) {
                clearInterval(t);
                setTimeout(() => setShowCursor(false), 1500);
            }
        }, 28);
        return () => clearInterval(t);
    }, [visible, closing]);

    // Stagger values
    useEffect(() => {
        if (!visible || closing) return;
        const timers = [
            setTimeout(() => setValuesVisible(v => [true, v[1], v[2]]), 2200),
            setTimeout(() => setValuesVisible(v => [v[0], true, v[2]]), 2400),
            setTimeout(() => setValuesVisible(v => [v[0], v[1], true]), 2600),
        ];
        return () => timers.forEach(clearTimeout);
    }, [visible, closing]);

    // Parallax tilt
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!modalRef.current || !mascotWrapRef.current || !mascotImgRef.current) return;
        const rect = modalRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        mascotWrapRef.current.style.transform = `rotateX(${y * -12}deg) rotateY(${x * 12}deg)`;
        mascotImgRef.current.style.transform = `translateX(${x * 8}px) translateY(${y * 6}px)`;
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (mascotWrapRef.current) mascotWrapRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
        if (mascotImgRef.current) mascotImgRef.current.style.transform = 'translateX(0) translateY(0)';
    }, []);

    const closeModal = useCallback(() => {
        setClosing(true);
        sessionStorage.setItem('mission-seen', '1');
        setTimeout(() => setVisible(false), 400);
    }, []);

    if (!visible) return null;

    return (
        <>
            <style>{`
                @keyframes mmOverlayIn{to{background:rgba(0,0,0,0.35);backdrop-filter:blur(10px)}}
                @keyframes mmOverlayOut{to{background:rgba(0,0,0,0);backdrop-filter:blur(0px);pointer-events:none}}
                @keyframes mmModalIn{to{transform:scale(1) translateY(0);opacity:1}}
                @keyframes mmModalOut{to{transform:scale(0.95) translateY(15px);opacity:0}}
                @keyframes mmBarShift{0%{background-position:0% center}50%{background-position:100% center}100%{background-position:0% center}}
                @keyframes mmPulse{0%{transform:scale(0.9);opacity:.4}100%{transform:scale(1.35);opacity:0}}
                @keyframes mmGlow{0%,100%{transform:scale(1);opacity:.3}50%{transform:scale(1.05);opacity:.6}}
                @keyframes mmRing{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
                @keyframes mmBlink{0%,100%{opacity:1}50%{opacity:0}}
                @keyframes mmFadeUp{to{opacity:1;transform:translateY(0)}}
                @keyframes mmHalo{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:.7;transform:scale(1.06)}}
                @keyframes mmShimmer{0%{left:-100%}50%,100%{left:200%}}
                @keyframes mmSparkle {
                    0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
                    50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
                }
            `}</style>

            {/* Overlay */}
            <div
                onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0)', backdropFilter: 'blur(0px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: closing ? 'mmOverlayOut .4s ease forwards' : 'mmOverlayIn .5s ease forwards',
                    padding: 24,
                }}
            >
                {/* Modal */}
                <div
                    ref={modalRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        position: 'relative', width: '100%', maxWidth: 520,
                        background: 'linear-gradient(170deg,#F8FAFF 0%,#EBF0F8 30%,#E2EAF5 65%,#D8E2F0 100%)',
                        borderRadius: 28,
                        border: '1px solid rgba(26,58,107,0.1)',
                        boxShadow: '0 24px 64px rgba(26,58,107,0.1),0 8px 32px rgba(0,0,0,0.06),inset 0 0 0 1px rgba(255,255,255,0.7)',
                        overflow: 'hidden',
                        transform: 'scale(0.85) translateY(30px)', opacity: 0,
                        animation: closing ? 'mmModalOut .3s ease forwards' : 'mmModalIn .5s cubic-bezier(.25,.46,.45,.94) forwards .15s',
                    }}
                >
                    {/* Top bar */}
                    <div style={{
                        height: 3,
                        background: 'linear-gradient(90deg,#2E7DDB,#60A5FA,#2E5A9E,#1A3A6B,#2E5A9E,#60A5FA,#2E7DDB)',
                        backgroundSize: '300% auto',
                        animation: 'mmBarShift 5s ease infinite',
                    }} />

                    {/* Close */}
                    <button
                        onClick={closeModal}
                        style={{
                            position: 'absolute', top: 14, right: 14, zIndex: 10,
                            width: 34, height: 34, borderRadius: '50%', border: 'none',
                            background: 'rgba(26,58,107,0.06)', color: 'rgba(26,58,107,0.4)',
                            fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all .25s ease',
                            fontFamily: "'Fredoka', sans-serif",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(26,58,107,0.12)';
                            e.currentTarget.style.color = '#1A3A6B';
                            e.currentTarget.style.transform = 'rotate(90deg)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(26,58,107,0.06)';
                            e.currentTarget.style.color = 'rgba(26,58,107,0.4)';
                            e.currentTarget.style.transform = 'rotate(0deg)';
                        }}
                    >✕</button>

                    {/* Mascot */}
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0 0', perspective: 600 }}>
                        <div ref={mascotWrapRef} style={{
                            position: 'relative', width: 120, height: 120,
                            transition: 'transform .15s ease-out',
                            transformStyle: 'preserve-3d',
                        }}>
                            {/* Pulse rings */}
                            <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: '1px solid rgba(26,58,107,0.06)', animation: 'mmPulse 3.5s ease-out infinite' }} />
                            <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: '1px solid rgba(26,58,107,0.06)', animation: 'mmPulse 3.5s ease-out infinite 1.75s' }} />
                            {/* Glow */}
                            <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'radial-gradient(circle,rgba(26,58,107,0.08),rgba(96,165,250,0.04),transparent 70%)', animation: 'mmGlow 4s ease-in-out infinite' }} />
                            {/* Gradient ring */}
                            <div style={{
                                position: 'absolute', inset: -3, borderRadius: '50%', padding: 2,
                                background: 'linear-gradient(135deg,#2E7DDB,#60A5FA,#2E5A9E,#1A3A6B,#2E5A9E,#60A5FA,#2E7DDB)',
                                backgroundSize: '300% 300%',
                                animation: 'mmRing 4s ease infinite',
                                WebkitMask: 'linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)',
                                WebkitMaskComposite: 'xor',
                                maskComposite: 'exclude' as any,
                            }} />
                            {/* Circle */}
                            <div style={{
                                position: 'relative', width: '100%', height: '100%', borderRadius: '50%',
                                background: 'white',
                                boxShadow: '0 8px 24px rgba(26,58,107,0.08),0 2px 6px rgba(0,0,0,0.03)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', zIndex: 2,
                            }}>
                                <img
                                    ref={mascotImgRef}
                                    src="/mascots/photo%20pour%20popup.png"
                                    alt="Geai bleu"
                                    style={{
                                        width: '100%', height: '100%', objectFit: 'cover',
                                        filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.06))',
                                        transition: 'transform .15s ease-out',
                                    }}
                                />
                            </div>
                            {/* Eye sparkles */}
                            <div style={{ position: 'absolute', top: '38%', left: '33%', zIndex: 5, pointerEvents: 'none' }}>
                                <span style={{ position: 'absolute', fontSize: 10, color: 'white', animation: 'mmSparkle 2s ease-in-out infinite', filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.9))' }}>✦</span>
                                <span style={{ position: 'absolute', fontSize: 7, top: 4, left: 6, color: 'white', animation: 'mmSparkle 2s ease-in-out infinite 0.5s', filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.8))' }}>✦</span>
                            </div>
                            <div style={{ position: 'absolute', top: '38%', right: '33%', zIndex: 5, pointerEvents: 'none' }}>
                                <span style={{ position: 'absolute', fontSize: 10, color: 'white', animation: 'mmSparkle 2s ease-in-out infinite 0.3s', filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.9))' }}>✦</span>
                                <span style={{ position: 'absolute', fontSize: 7, top: 4, left: -4, color: 'white', animation: 'mmSparkle 2s ease-in-out infinite 0.8s', filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.8))' }}>✦</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '20px 32px 32px', textAlign: 'center' }}>
                        {/* Title */}
                        <h2 style={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontSize: 28, fontWeight: 800, lineHeight: 1.15, marginBottom: 10,
                            background: 'linear-gradient(135deg,#2E7DDB,#60A5FA,#2E5A9E,#1A3A6B)',
                            backgroundSize: '200% auto',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            animation: 'mmBarShift 5s ease infinite, mmFadeUp .5s ease forwards .5s',
                            opacity: 0, transform: 'translateY(10px)',
                        }}>
                            Notre Mission
                        </h2>

                        {/* Typewriter */}
                        <div style={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontSize: 14, color: '#5A6B80', lineHeight: 1.7,
                            marginBottom: 24, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto',
                            minHeight: 56,
                        }}>
                            {typedText}
                            {showCursor && (
                                <span style={{
                                    display: 'inline-block', width: 2, height: 14,
                                    background: 'linear-gradient(to bottom,#60A5FA,#1A3A6B)',
                                    verticalAlign: 'text-bottom',
                                    animation: 'mmBlink .7s step-end infinite',
                                    marginLeft: 2, borderRadius: 1,
                                }} />
                            )}
                        </div>

                        {/* Values */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
                            {[
                                { num: '01', icon: 'coupon', title: 'Payer le moins cher', desc: "Chaque prix est comparé sur 30 jours. Si c'est pas un vrai deal, on l'affiche pas.", iconBg: 'rgba(26,58,107,0.07)' },
                                { num: '02', icon: '🗺️', title: 'Organiser ton voyage', desc: 'On te prépare les deals, les packs et les guides pour que tu partes sans stress.', iconBg: 'rgba(46,125,219,0.07)' },
                                { num: '03', icon: 'share', title: 'Donner aux suivants', desc: 'Partagez vos voyages et inspirez la communauté à découvrir le monde.', iconBg: 'rgba(26,58,107,0.07)' },
                            ].map((v, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        padding: '14px 18px', borderRadius: 16,
                                        background: 'white', border: '1px solid rgba(26,58,107,0.06)',
                                        boxShadow: '0 2px 8px rgba(26,58,107,0.04)',
                                        transition: 'all .35s cubic-bezier(.25,.46,.45,.94)',
                                        cursor: 'default', position: 'relative', overflow: 'hidden', textAlign: 'left',
                                        opacity: valuesVisible[idx] ? 1 : 0,
                                        transform: valuesVisible[idx] ? 'translateY(0)' : 'translateY(10px)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(26,58,107,0.08)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,58,107,0.04)';
                                    }}
                                >
                                    {/* Number */}
                                    <span style={{
                                        position: 'absolute', top: 8, right: 12,
                                        fontSize: 11, fontWeight: 800,
                                        background: 'linear-gradient(135deg,#60A5FA,#1A3A6B)',
                                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                        opacity: 0.25,
                                        fontFamily: "'Fredoka', sans-serif",
                                    }}>{v.num}</span>

                                    {/* Icon */}
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 20, background: v.iconBg,
                                        transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)',
                                    }}>
                                        {v.icon === 'share' ? (
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E7DDB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                            </svg>
                                        ) : v.icon === 'coupon' ? (
                                            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                                                <rect x="2" y="8" width="28" height="16" rx="3" fill="none" stroke="#2E7DDB" strokeWidth="2" />
                                                <circle cx="2" cy="16" r="3" fill="#E2EAF5" stroke="#2E7DDB" strokeWidth="1.5" />
                                                <circle cx="30" cy="16" r="3" fill="#E2EAF5" stroke="#2E7DDB" strokeWidth="1.5" />
                                                <text x="16" y="16" textAnchor="middle" dominantBaseline="central" fontFamily="Fredoka" fontWeight="800" fontSize="11" fill="#2E7DDB">%</text>
                                            </svg>
                                        ) : v.icon}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2B42', marginBottom: 2, fontFamily: "'Fredoka', sans-serif" }}>{v.title}</div>
                                        <div style={{ fontSize: 11.5, color: '#5A6B80', fontWeight: 500, lineHeight: 1.5, fontFamily: "'Fredoka', sans-serif" }}>{v.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <div style={{
                                position: 'absolute', inset: -6, borderRadius: 100,
                                background: 'linear-gradient(135deg,rgba(46,125,219,0.15),rgba(26,58,107,0.12))',
                                filter: 'blur(10px)',
                                animation: 'mmHalo 3s ease-in-out infinite',
                                zIndex: 0,
                            }} />
                            <button
                                onClick={closeModal}
                                style={{
                                    position: 'relative', zIndex: 1,
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    padding: '13px 30px', borderRadius: 100, border: 'none',
                                    background: 'linear-gradient(135deg,#2E7DDB,#1A3A6B)',
                                    backgroundSize: '200% auto',
                                    color: 'white', fontSize: 14, fontWeight: 700,
                                    fontFamily: "'Fredoka', sans-serif", cursor: 'pointer',
                                    boxShadow: '0 4px 16px rgba(26,58,107,0.2)',
                                    transition: 'all .3s cubic-bezier(.25,.46,.45,.94)',
                                    overflow: 'hidden',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(26,58,107,0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,58,107,0.2)';
                                }}
                            >
                                Découvrir les deals ✈️
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
