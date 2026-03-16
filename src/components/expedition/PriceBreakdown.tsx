'use client';

import type { ExpeditionPricing } from '@/features/expeditions/expedition.types';

interface PriceBreakdownProps {
    pricing: ExpeditionPricing;
    locked: boolean;
}

export default function PriceBreakdown({ pricing, locked }: PriceBreakdownProps) {
    const { flightPrice, perStopCost, accommodationTotal, grandTotal } = pricing;

    return (
        <div>
            {/* Section title */}
            <div style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#FFFFFF',
                fontFamily: "'Fredoka', sans-serif",
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
            }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                Estimation des couts
            </div>

            {/* Pricing table */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 16,
                overflow: 'hidden',
                backdropFilter: 'blur(12px)',
            }}>
                {/* Header row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr auto',
                    padding: '12px 20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.03)',
                }}>
                    <div style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.4)',
                        fontFamily: "'Outfit', sans-serif",
                        textTransform: 'uppercase' as const,
                        letterSpacing: 0.5,
                    }}>
                        Poste
                    </div>
                    <div style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.4)',
                        fontFamily: "'Outfit', sans-serif",
                        textTransform: 'uppercase' as const,
                        letterSpacing: 0.5,
                    }}>
                        Details
                    </div>
                    <div style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.4)',
                        fontFamily: "'Outfit', sans-serif",
                        textTransform: 'uppercase' as const,
                        letterSpacing: 0.5,
                        textAlign: 'right',
                        minWidth: 80,
                    }}>
                        Total
                    </div>
                </div>

                {/* All price rows — blurred if locked */}
                <div style={{
                    filter: locked ? 'blur(6px)' : 'none',
                    userSelect: locked ? 'none' : 'auto',
                }}>
                    {/* Row 1: Flight */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr auto',
                        padding: '14px 20px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    }}>
                        <div style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#FFFFFF',
                            fontFamily: "'Outfit', sans-serif",
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}>
                            <span style={{ fontSize: 16 }}>&#9992;</span>
                            Vol aller-retour
                        </div>
                        <div style={{
                            fontSize: 12,
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontFamily: "'Outfit', sans-serif",
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            YUL &#8594; destination
                        </div>
                        <div style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: flightPrice != null ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
                            fontFamily: "'Fredoka', sans-serif",
                            textAlign: 'right',
                            minWidth: 80,
                        }}>
                            {flightPrice != null ? `${flightPrice} $` : '\u2014'}
                        </div>
                    </div>

                    {/* Accommodation rows per stop */}
                    {perStopCost.map((stop, i) => (
                        <div key={i} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr auto',
                            padding: '12px 20px',
                            borderBottom: i < perStopCost.length - 1
                                ? '1px solid rgba(255, 255, 255, 0.04)'
                                : 'none',
                        }}>
                            <div style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#FFFFFF',
                                fontFamily: "'Outfit', sans-serif",
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}>
                                <span style={{ fontSize: 14 }}>&#127976;</span>
                                Hebergement {stop.city}
                            </div>
                            <div style={{
                                fontSize: 12,
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontFamily: "'Outfit', sans-serif",
                                display: 'flex',
                                alignItems: 'center',
                            }}>
                                {stop.nights} nuit{stop.nights > 1 ? 's' : ''} {'\u00D7'} {stop.pricePerNight}$
                            </div>
                            <div style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: stop.total > 0 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)',
                                fontFamily: "'Fredoka', sans-serif",
                                textAlign: 'right',
                                minWidth: 80,
                            }}>
                                {stop.total > 0 ? `${stop.total} $` : '\u2014'}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Separator line */}
                <div style={{
                    height: 1,
                    background: 'linear-gradient(to right, transparent, rgba(0, 212, 255, 0.3), transparent)',
                    margin: '0 20px',
                }} />

                {/* Grand total row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    padding: '18px 20px',
                    background: 'rgba(0, 212, 255, 0.06)',
                    filter: locked ? 'blur(6px)' : 'none',
                    userSelect: locked ? 'none' : 'auto',
                }}>
                    <div style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        fontFamily: "'Outfit', sans-serif",
                    }}>
                        Total estime
                    </div>
                    <div style={{
                        fontSize: 26,
                        fontWeight: 800,
                        color: '#00D4FF',
                        fontFamily: "'Fredoka', sans-serif",
                        textAlign: 'right',
                    }}>
                        {grandTotal != null
                            ? `${grandTotal} $`
                            : accommodationTotal > 0
                                ? `${accommodationTotal} $ + vol`
                                : '\u2014'
                        }
                    </div>
                </div>
            </div>

            {/* Upsell CTA when locked */}
            {locked && (
                <div style={{
                    marginTop: 16,
                    padding: '16px 24px',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.04) 100%)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    textAlign: 'center',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        marginBottom: 6,
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#00D4FF',
                            fontFamily: "'Fredoka', sans-serif",
                        }}>
                            Debloquer les prix detailles
                        </span>
                    </div>
                    <p style={{
                        fontSize: 12,
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontFamily: "'Outfit', sans-serif",
                        margin: 0,
                        lineHeight: 1.5,
                    }}>
                        Passez Premium pour acceder aux prix en temps reel, aux liens de reservation et aux estimations completes.
                    </p>
                </div>
            )}
        </div>
    );
}
