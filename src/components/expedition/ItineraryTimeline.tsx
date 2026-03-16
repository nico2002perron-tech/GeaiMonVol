'use client';

interface TimelineStop {
    stopOrder: number;
    city: string;
    country: string;
    nights: number;
    descriptionFr: string;
    highlights: string[];
    accommodationType: string;
}

interface ItineraryTimelineProps {
    stops: TimelineStop[];
    locked: boolean;
}

const ACCOM_LABELS: Record<string, string> = {
    hotel: 'Hotel',
    villa: 'Villa',
    hostel: 'Hostel',
    apartment: 'Appartement',
    resort: 'Resort',
    guesthouse: 'Guesthouse',
};

export default function ItineraryTimeline({ stops, locked }: ItineraryTimelineProps) {
    return (
        <div>
            {/* Section title */}
            <div style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#FFFFFF',
                fontFamily: "'Fredoka', sans-serif",
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
            }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
                Itineraire jour par jour
            </div>

            {/* Timeline container */}
            <div style={{ position: 'relative', paddingLeft: 40 }}>
                {/* Vertical line */}
                <div style={{
                    position: 'absolute',
                    left: 15,
                    top: 12,
                    bottom: 12,
                    width: 2,
                    background: 'linear-gradient(to bottom, #00D4FF, rgba(0, 212, 255, 0.15))',
                    borderRadius: 2,
                }} />

                {stops.map((stop, i) => {
                    const isLocked = locked && i >= 2;

                    return (
                        <div
                            key={stop.stopOrder}
                            style={{
                                position: 'relative',
                                marginBottom: i < stops.length - 1 ? 28 : 0,
                                filter: isLocked ? 'blur(6px)' : 'none',
                                userSelect: isLocked ? 'none' : 'auto',
                                transition: 'filter 0.3s ease',
                            }}
                        >
                            {/* Numbered circle on the timeline */}
                            <div style={{
                                position: 'absolute',
                                left: -33,
                                top: 16,
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                background: '#020810',
                                border: '2px solid #00D4FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 800,
                                color: '#00D4FF',
                                fontFamily: "'Fredoka', sans-serif",
                                boxShadow: '0 0 12px rgba(0, 212, 255, 0.3)',
                                zIndex: 2,
                            }}>
                                {stop.stopOrder}
                            </div>

                            {/* Stop card — glass morphism */}
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 16,
                                padding: '18px 20px',
                                backdropFilter: 'blur(12px)',
                            }}>
                                {/* Header row */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    marginBottom: 10,
                                }}>
                                    <div>
                                        <div style={{
                                            fontSize: 17,
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: 100,
                                            background: 'rgba(0, 212, 255, 0.12)',
                                            border: '1px solid rgba(0, 212, 255, 0.25)',
                                            color: '#00D4FF',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            fontFamily: "'Fredoka', sans-serif",
                                        }}>
                                            {stop.nights} nuit{stop.nights > 1 ? 's' : ''}
                                        </span>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: 100,
                                            background: 'rgba(255, 255, 255, 0.06)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            fontSize: 11,
                                            fontWeight: 600,
                                            color: 'rgba(255, 255, 255, 0.5)',
                                            fontFamily: "'Outfit', sans-serif",
                                        }}>
                                            {ACCOM_LABELS[stop.accommodationType] || stop.accommodationType}
                                        </span>
                                    </div>
                                </div>

                                {/* Description */}
                                <p style={{
                                    fontSize: 13,
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontFamily: "'Outfit', sans-serif",
                                    lineHeight: 1.6,
                                    margin: '0 0 12px',
                                }}>
                                    {stop.descriptionFr}
                                </p>

                                {/* Highlights chips */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {stop.highlights.map((h, j) => (
                                        <span key={j} style={{
                                            padding: '4px 12px',
                                            borderRadius: 100,
                                            background: 'rgba(0, 212, 255, 0.08)',
                                            border: '1px solid rgba(0, 212, 255, 0.15)',
                                            color: 'rgba(0, 212, 255, 0.85)',
                                            fontSize: 10,
                                            fontWeight: 600,
                                            fontFamily: "'Outfit', sans-serif",
                                        }}>
                                            {h}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Locked overlay message */}
                {locked && stops.length > 2 && (
                    <div style={{
                        textAlign: 'center',
                        marginTop: 16,
                        padding: '14px 20px',
                        borderRadius: 12,
                        background: 'rgba(0, 212, 255, 0.06)',
                        border: '1px solid rgba(0, 212, 255, 0.15)',
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }}>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span style={{
                            fontSize: 12,
                            color: 'rgba(0, 212, 255, 0.8)',
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 600,
                        }}>
                            Passez Premium pour voir l&#39;itineraire complet
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
