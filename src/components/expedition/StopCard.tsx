'use client';

interface Accommodation {
    name: string;
    type: string;
    price_per_night: number | null;
    rating: number | null;
    booking_url: string | null;
}

interface StopCardStop {
    stop_order: number;
    city: string;
    country: string | null;
    nights: number;
    description_fr: string;
    highlights: string[];
    accommodation_type: string;
    accommodations: Accommodation[];
}

interface StopCardProps {
    stop: StopCardStop;
    locked: boolean;
}

const ACCOM_TYPE_LABELS: Record<string, string> = {
    hotel: 'Hotel',
    villa: 'Villa',
    hostel: 'Hostel',
    apartment: 'Appartement',
    resort: 'Resort',
    guesthouse: 'Guesthouse',
};

function StarRating({ rating }: { rating: number }) {
    const fullStars = Math.floor(rating / 2);
    const halfStar = rating % 2 >= 1;
    const stars: string[] = [];
    for (let i = 0; i < fullStars; i++) stars.push('full');
    if (halfStar) stars.push('half');
    const empty = 5 - stars.length;
    for (let i = 0; i < empty; i++) stars.push('empty');

    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            {stars.map((type, i) => (
                <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={type === 'empty' ? 'none' : '#F59E0B'} stroke="#F59E0B" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ))}
            <span style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.45)',
                fontFamily: "'Outfit', sans-serif",
                marginLeft: 4,
            }}>
                {rating}/10
            </span>
        </span>
    );
}

export default function StopCard({ stop, locked }: StopCardProps) {
    const hasAccommodations = stop.accommodations && stop.accommodations.length > 0;

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 16,
            padding: 20,
            backdropFilter: 'blur(12px)',
        }}>
            {/* Header: city + nights */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
            }}>
                <div>
                    <div style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        fontFamily: "'Fredoka', sans-serif",
                    }}>
                        {stop.city}
                    </div>
                    {stop.country && (
                        <div style={{
                            fontSize: 12,
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontFamily: "'Outfit', sans-serif",
                            marginTop: 2,
                        }}>
                            {stop.country}
                        </div>
                    )}
                </div>
                <span style={{
                    padding: '5px 14px',
                    borderRadius: 100,
                    background: 'rgba(0, 212, 255, 0.12)',
                    border: '1px solid rgba(0, 212, 255, 0.25)',
                    color: '#00D4FF',
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "'Fredoka', sans-serif",
                }}>
                    {stop.nights} nuit{stop.nights > 1 ? 's' : ''}
                </span>
            </div>

            {/* Accommodations grid */}
            {hasAccommodations ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 14,
                }}>
                    {stop.accommodations.map((accom, i) => (
                        <div
                            key={i}
                            style={{
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: 12,
                                padding: '14px 16px',
                                transition: 'border-color 0.2s ease',
                            }}
                        >
                            {/* Accommodation name */}
                            <div style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#FFFFFF',
                                fontFamily: "'Outfit', sans-serif",
                                marginBottom: 4,
                            }}>
                                {accom.name}
                            </div>

                            {/* Type badge */}
                            <div style={{
                                fontSize: 10,
                                color: 'rgba(255, 255, 255, 0.4)',
                                fontFamily: "'Outfit', sans-serif",
                                marginBottom: 8,
                            }}>
                                {ACCOM_TYPE_LABELS[accom.type] || accom.type}
                            </div>

                            {/* Rating stars */}
                            {accom.rating != null && accom.rating > 0 && (
                                <div style={{ marginBottom: 10 }}>
                                    <StarRating rating={accom.rating} />
                                </div>
                            )}

                            {/* Price — blurred if locked */}
                            <div style={{
                                filter: locked ? 'blur(6px)' : 'none',
                                userSelect: locked ? 'none' : 'auto',
                                display: 'flex',
                                alignItems: 'baseline',
                                justifyContent: 'space-between',
                                marginBottom: 10,
                            }}>
                                <div>
                                    <span style={{
                                        fontSize: 20,
                                        fontWeight: 800,
                                        color: '#00D4FF',
                                        fontFamily: "'Fredoka', sans-serif",
                                    }}>
                                        {accom.price_per_night != null ? `${Math.round(accom.price_per_night)} $` : '\u2014'}
                                    </span>
                                    <span style={{
                                        fontSize: 11,
                                        color: 'rgba(255, 255, 255, 0.4)',
                                        fontFamily: "'Outfit', sans-serif",
                                    }}>
                                        /nuit
                                    </span>
                                </div>
                                {accom.price_per_night != null && (
                                    <div style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontFamily: "'Fredoka', sans-serif",
                                    }}>
                                        {Math.round(accom.price_per_night * stop.nights)} $ total
                                    </div>
                                )}
                            </div>

                            {/* Booking link — blurred if locked */}
                            {accom.booking_url && (
                                <div style={{
                                    filter: locked ? 'blur(6px)' : 'none',
                                    pointerEvents: locked ? 'none' : 'auto',
                                }}>
                                    <a
                                        href={accom.booking_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'block',
                                            textAlign: 'center',
                                            padding: '8px 16px',
                                            borderRadius: 10,
                                            background: 'rgba(0, 212, 255, 0.12)',
                                            border: '1px solid rgba(0, 212, 255, 0.25)',
                                            color: '#00D4FF',
                                            fontSize: 12,
                                            fontWeight: 700,
                                            fontFamily: "'Outfit', sans-serif",
                                            textDecoration: 'none',
                                            transition: 'background 0.2s ease',
                                        }}
                                    >
                                        Voir sur Booking
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    padding: '24px 20px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    textAlign: 'center',
                }}>
                    <div style={{
                        fontSize: 13,
                        color: 'rgba(255, 255, 255, 0.35)',
                        fontFamily: "'Outfit', sans-serif",
                    }}>
                        Hebergements a venir
                    </div>
                    <div style={{
                        fontSize: 11,
                        color: 'rgba(255, 255, 255, 0.2)',
                        fontFamily: "'Outfit', sans-serif",
                        marginTop: 4,
                    }}>
                        Nos prix seront disponibles sous peu pour {stop.city}
                    </div>
                </div>
            )}
        </div>
    );
}
