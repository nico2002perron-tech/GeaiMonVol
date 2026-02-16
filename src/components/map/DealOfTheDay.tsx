'use client';
import { useState, useEffect } from 'react';

export default function DealOfTheDay() {
    const [show, setShow] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 4000);
        return () => clearTimeout(timer);
    }, []);

    if (dismissed || !show) return null;

    return (
        <div style={{
            position: 'absolute',
            top: 110,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            width: 360,
            maxWidth: 'calc(100vw - 32px)',
            animation: 'dealDayIn 0.6s cubic-bezier(.22, 1, .36, 1)',
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
            }}>
                {/* Header */}
                <div style={{
                    padding: '14px 18px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 12px',
                            background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                            borderRadius: 100,
                            fontSize: 11,
                            fontWeight: 800,
                            color: 'white',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                        }}>
                            🔥 Deal du jour
                        </span>
                        <span style={{
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.4)',
                            fontFamily: "'Outfit', sans-serif",
                        }}>
                            Expire dans 8h
                        </span>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.06)',
                            border: 'none', color: 'rgba(255,255,255,0.3)',
                            fontSize: 12, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Destination */}
                <div style={{ padding: '0 18px 6px' }}>
                    <div style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontSize: 26, fontWeight: 700,
                        color: 'white', lineHeight: 1.2,
                    }}>
                        Montréal → Paris ✈️
                    </div>
                    <div style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.4)',
                        marginTop: 4,
                        fontFamily: "'Outfit', sans-serif",
                    }}>
                        Aller-retour · Direct · Mars–Avril 2026
                    </div>
                </div>

                {/* Price reveal zone */}
                <div style={{ padding: '12px 18px 18px' }}>
                    {!revealed ? (
                        <button
                            onClick={() => setRevealed(true)}
                            style={{
                                width: '100%',
                                padding: '14px 0',
                                borderRadius: 14,
                                border: '2px dashed rgba(245,158,11,0.4)',
                                background: 'rgba(245,158,11,0.06)',
                                cursor: 'pointer',
                                fontSize: 15,
                                fontWeight: 700,
                                color: '#F59E0B',
                                fontFamily: "'Fredoka', sans-serif",
                                transition: 'all 0.3s',
                                animation: 'revealPulse 2s ease-in-out infinite',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                        >
                            <span style={{ fontSize: 20 }}>🎁</span>
                            Cliquez pour révéler le prix
                        </button>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            animation: 'priceReveal 0.6s cubic-bezier(.34, 1.56, .64, 1)',
                        }}>
                            <div style={{
                                fontSize: 14,
                                color: 'rgba(255,255,255,0.4)',
                                textDecoration: 'line-through',
                                marginBottom: 4,
                                fontFamily: "'Outfit', sans-serif",
                            }}>
                                Prix habituel : 850 $
                            </div>
                            <div style={{
                                fontFamily: "'Fredoka', sans-serif",
                                fontSize: 48,
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #4ADE80, #22D3EE)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                lineHeight: 1,
                            }}>
                                195 $
                            </div>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                marginTop: 8,
                                padding: '4px 14px',
                                background: 'rgba(74,222,128,0.1)',
                                border: '1px solid rgba(74,222,128,0.2)',
                                borderRadius: 100,
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#4ADE80',
                            }}>
                                🎉 Tu économises 655 $ (-77%)
                            </div>
                            <button
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    marginTop: 14,
                                    padding: '12px 0',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #2E7DDB, #4A94E8)',
                                    color: 'white',
                                    fontFamily: "'Fredoka', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(46,125,219,0.4)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                Voir ce deal →
                            </button>
                        </div>
                    )}
                </div>

                {/* Viewers count */}
                <div style={{
                    padding: '10px 18px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.35)',
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: '#EF4444',
                            animation: 'pulse 2s infinite',
                        }} />
                        14 personnes regardent ce deal
                    </span>
                    <span>🔒 Prix garanti 24h</span>
                </div>
            </div>

            <style>{`
                @keyframes dealDayIn {
                    0% { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.95); }
                    100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                }
                @keyframes revealPulse {
                    0%, 100% { border-color: rgba(245,158,11,0.2); box-shadow: 0 0 0 0 rgba(245,158,11,0); }
                    50% { border-color: rgba(245,158,11,0.5); box-shadow: 0 0 20px rgba(245,158,11,0.1); }
                }
                @keyframes priceReveal {
                    0% { transform: scale(0.5); opacity: 0; }
                    60% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
