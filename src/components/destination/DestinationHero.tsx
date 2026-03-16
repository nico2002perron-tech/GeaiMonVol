'use client';

import { DEAL_LEVELS } from '@/lib/constants/deals';

interface DestinationHeroProps {
    destination: string;
    destinationCode: string;
    country: string;
    currentPrice: number | null;
    dealLevel: string;
    discount: number;
    imageUrl: string;
    cheapestAirline?: string;
}

export default function DestinationHero({
    destination,
    destinationCode,
    country,
    currentPrice,
    dealLevel,
    discount,
    imageUrl,
    cheapestAirline,
}: DestinationHeroProps) {
    const level = DEAL_LEVELS[dealLevel] || DEAL_LEVELS.normal;

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: 320,
            borderRadius: 24,
            overflow: 'hidden',
            marginBottom: 24,
        }}>
            {/* Background image */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.6)',
            }} />

            {/* Content overlay */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '32px 28px',
            }}>
                {/* Deal badge */}
                {dealLevel && dealLevel !== 'normal' && (
                    <div style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        padding: '6px 14px',
                        borderRadius: 100,
                        background: level.bg,
                        color: level.textColor || '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "'Outfit', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                        {level.icon} {level.label}
                    </div>
                )}

                {/* Route */}
                <div style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.8)',
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 500,
                    marginBottom: 4,
                    letterSpacing: 1,
                }}>
                    YUL &rarr; {destinationCode}
                </div>

                {/* Destination name */}
                <h1 style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: '#fff',
                    fontFamily: "'Fredoka', sans-serif",
                    margin: '0 0 4px 0',
                    textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}>
                    {destination}
                </h1>

                {/* Country */}
                <div style={{
                    fontSize: 15,
                    color: 'rgba(255,255,255,0.85)',
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 500,
                    marginBottom: 12,
                }}>
                    {country}
                </div>

                {/* Price row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 12,
                }}>
                    {currentPrice && (
                        <>
                            <span style={{
                                fontSize: 14,
                                color: 'rgba(255,255,255,0.7)',
                                fontFamily: "'Outfit', sans-serif",
                            }}>
                                À partir de
                            </span>
                            <span style={{
                                fontSize: 40,
                                fontWeight: 800,
                                color: '#fff',
                                fontFamily: "'Fredoka', sans-serif",
                                textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                            }}>
                                {currentPrice} $
                            </span>
                            {discount > 0 && (
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: 100,
                                    background: 'rgba(16,185,129,0.9)',
                                    color: '#fff',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    fontFamily: "'Fredoka', sans-serif",
                                }}>
                                    -{discount}%
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* Airline */}
                {cheapestAirline && (
                    <div style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.6)',
                        fontFamily: "'Outfit', sans-serif",
                        marginTop: 6,
                    }}>
                        Vol le moins cher avec {cheapestAirline}
                    </div>
                )}
            </div>
        </div>
    );
}
