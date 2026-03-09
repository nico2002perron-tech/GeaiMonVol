'use client';

import { useState, useEffect, useRef } from 'react';
import { usePriceHistory } from '@/lib/hooks/usePriceHistory';
import { CITY_IMAGES, COUNTRY_IMAGES, DEFAULT_CITY_IMAGE, DEAL_LEVELS, COUNTRY_SUBDESTINATIONS } from '@/lib/constants/deals';
import type { SubDestination } from '@/lib/constants/deals';
import PriceHistoryChart from '@/components/ui/PriceHistoryChart';

interface DestinationDeal {
    price: number;
    currency: string;
    airline: string;
    airlineLogo?: string;
    operatingAirline?: string;
    stops: number;
    departureDate: string;
    returnDate: string;
    durationMinutes: number;
    returnDurationMinutes?: number;
    returnStops?: number;
    bookingLink: string;
    monthLabel?: string;
    source: string;
    scannedAt: string;
    tags?: string[];
    seatsRemaining?: number;
    totalOptions?: number;
}

interface DestinationPopupProps {
    isOpen: boolean;
    onClose: () => void;
    destination: string;
    destinationCode: string;
    bestPrice?: number;
    dealLevel?: string;
    discount?: number;
}

function formatDateFr(dateStr: string): string {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

function formatDateShort(dateStr: string): string {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
    } catch {
        return dateStr;
    }
}

function formatStops(stops: number): string {
    if (stops <= 0) return 'Direct';
    if (stops === 1) return '1 escale';
    return `${stops} escales`;
}

function formatDuration(mins: number): string {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

export default function DestinationPopup({
    isOpen,
    onClose,
    destination,
    destinationCode,
    bestPrice,
    dealLevel,
    discount,
}: DestinationPopupProps) {
    const [deals, setDeals] = useState<DestinationDeal[]>([]);
    const [loading, setLoading] = useState(false);
    const [liveSearching, setLiveSearching] = useState(false);
    const [error, setError] = useState('');
    const [chartDays, setChartDays] = useState(30);
    const overlayRef = useRef<HTMLDivElement>(null);
    const { points: historyPoints, avg: historyAvg, min: historyMin, max: historyMax, loading: historyLoading } = usePriceHistory(isOpen ? destination : null, chartDays);

    // Detect country-level deal (2-letter country code like "MX", "BS", "FR")
    const isCountryLevel = destinationCode.length === 2 && destinationCode === destinationCode.toUpperCase();
    const subDestinations: SubDestination[] = isCountryLevel ? (COUNTRY_SUBDESTINATIONS[destinationCode] || []) : [];
    const [selectedSubDest, setSelectedSubDest] = useState<SubDestination | null>(null);

    // Active code/city for search (either the sub-destination or the original)
    const activeCode = selectedSubDest?.code || destinationCode;
    const activeCity = selectedSubDest?.city || destination;

    // Fallback Skyscanner URL
    const fallbackUrl = `https://www.skyscanner.ca/transport/flights/yul/${activeCode.toLowerCase()}/`;

    // Reset when popup opens
    useEffect(() => {
        if (!isOpen) return;
        setSelectedSubDest(null);
        setDeals([]);
        setError('');
    }, [isOpen]);

    // Fetch deals when destination/sub-destination changes
    useEffect(() => {
        if (!isOpen || !activeCity) return;

        // For country-level deals with sub-destinations, wait for user to pick a city
        if (isCountryLevel && subDestinations.length > 0 && !selectedSubDest) {
            setDeals([]);
            setLoading(false);
            return;
        }

        // Country-level codes (2-letter) can't be searched directly — need airport code
        const canLiveSearch = activeCode.length >= 3;

        setLoading(true);
        setError('');
        setDeals([]);
        setLiveSearching(false);

        // Step 1: Try fetching pre-scanned dates from DB
        fetch(`/api/prices/destination?name=${encodeURIComponent(activeCity)}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setError(data.error);
                    setLoading(false);
                    return;
                }

                const dbDeals: DestinationDeal[] = data.deals || [];
                const datedDeals = dbDeals.filter(d => d.departureDate);

                if (datedDeals.length > 0) {
                    setDeals(datedDeals);
                    setLoading(false);
                } else if (canLiveSearch) {
                    // Step 2: No dated deals in DB — do live search (only for airport codes)
                    setLiveSearching(true);
                    fetch(`/api/prices/search-live?code=${encodeURIComponent(activeCode)}&city=${encodeURIComponent(activeCity)}`)
                        .then((res) => res.json())
                        .then((liveData) => {
                            if (liveData.deals && liveData.deals.length > 0) {
                                setDeals(liveData.deals);
                            }
                        })
                        .catch(() => {})
                        .finally(() => {
                            setLiveSearching(false);
                            setLoading(false);
                        });
                } else {
                    // Country code without city picker — just show fallback
                    setLoading(false);
                }
            })
            .catch(() => {
                setError('Impossible de charger les dates');
                setLoading(false);
            });
    }, [isOpen, activeCity, activeCode, isCountryLevel, selectedSubDest, subDestinations.length]);

    // Close on ESC
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const imgSrc = CITY_IMAGES[destination] || COUNTRY_IMAGES[destination] || DEFAULT_CITY_IMAGE;
    const level = dealLevel ? DEAL_LEVELS[dealLevel] : null;
    const cheapestDeal = deals.length > 0 ? deals[0] : null;

    return (
        <>
            {/* Overlay */}
            <div
                ref={overlayRef}
                onClick={(e) => {
                    if (e.target === overlayRef.current) onClose();
                }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 500,
                    background: 'rgba(2, 8, 16, 0.6)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                    animation: 'destFadeIn 0.25s ease-out',
                }}
            >
                {/* Modal */}
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: 520,
                        maxHeight: 'calc(100vh - 32px)',
                        background: 'rgba(255, 255, 255, 0.97)',
                        backdropFilter: 'blur(40px)',
                        WebkitBackdropFilter: 'blur(40px)',
                        borderRadius: 24,
                        border: '1px solid rgba(255, 255, 255, 0.6)',
                        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.2), 0 8px 30px rgba(0, 0, 0, 0.1)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        animation: 'destSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                >
                    {/* Hero Image */}
                    <div style={{ position: 'relative', height: 200, flexShrink: 0 }}>
                        <img
                            src={imgSrc}
                            alt={destination}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_CITY_IMAGE; }}
                        />
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
                        }} />

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute', top: 12, right: 12,
                                width: 36, height: 36, borderRadius: '50%',
                                border: 'none',
                                background: 'rgba(0, 0, 0, 0.4)',
                                backdropFilter: 'blur(12px)',
                                color: '#fff', fontSize: 18, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.4)')}
                        >
                            &times;
                        </button>

                        {/* Deal badge */}
                        {level && (
                            <div style={{
                                position: 'absolute', top: 12, left: 12,
                                padding: '5px 12px', borderRadius: 20,
                                background: level.bg, color: '#fff',
                                fontSize: 11, fontWeight: 700,
                                fontFamily: "'Outfit', sans-serif",
                                display: 'flex', alignItems: 'center', gap: 4,
                                boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                            }}>
                                {level.icon} {level.label}
                            </div>
                        )}

                        {/* City name over image */}
                        <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
                            <h2 style={{
                                margin: 0, fontSize: 28, fontWeight: 700, color: '#fff',
                                fontFamily: "'Fredoka', sans-serif",
                                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                lineHeight: 1.1,
                            }}>
                                {destination}
                            </h2>
                            <div style={{
                                fontSize: 14, color: 'rgba(255,255,255,0.85)',
                                fontFamily: "'Outfit', sans-serif",
                                marginTop: 4,
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    background: 'rgba(255,255,255,0.15)',
                                    backdropFilter: 'blur(8px)',
                                    padding: '3px 10px', borderRadius: 8,
                                    fontSize: 12, fontWeight: 600,
                                }}>
                                    YUL &rarr; {destinationCode}
                                </span>
                                {bestPrice != null && (
                                    <span style={{
                                        fontWeight: 700,
                                        fontFamily: "'Fredoka', sans-serif",
                                        fontSize: 16,
                                    }}>
                                        {Math.round(bestPrice)} $
                                    </span>
                                )}
                                {discount != null && discount > 0 && (
                                    <span style={{
                                        background: 'rgba(16, 185, 129, 0.3)',
                                        color: '#6EE7B7',
                                        padding: '2px 8px', borderRadius: 10,
                                        fontSize: 11, fontWeight: 600,
                                    }}>
                                        -{discount}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content — scrollable */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 24px' }}>

                        {/* ═══ CITY PICKER (country-level deals) ═══ */}
                        {isCountryLevel && subDestinations.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                                <div style={{
                                    fontSize: 13, fontWeight: 600, color: '#0F172A',
                                    fontFamily: "'Outfit', sans-serif",
                                    marginBottom: 10,
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    Ou veux-tu aller?
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: subDestinations.length <= 2 ? '1fr 1fr' : 'repeat(auto-fill, minmax(130px, 1fr))',
                                    gap: 8,
                                }}>
                                    {subDestinations.map((sub) => {
                                        const isSelected = selectedSubDest?.code === sub.code;
                                        return (
                                            <button
                                                key={sub.code}
                                                onClick={() => setSelectedSubDest(isSelected ? null : sub)}
                                                style={{
                                                    position: 'relative',
                                                    border: isSelected ? '2px solid #0EA5E9' : '2px solid transparent',
                                                    borderRadius: 14,
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    background: 'none',
                                                    padding: 0,
                                                    transition: 'all 0.25s ease',
                                                    transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                                                    boxShadow: isSelected ? '0 4px 16px rgba(14,165,233,0.25)' : '0 2px 8px rgba(0,0,0,0.06)',
                                                }}
                                            >
                                                <img
                                                    src={sub.image}
                                                    alt={sub.city}
                                                    style={{
                                                        width: '100%',
                                                        height: 80,
                                                        objectFit: 'cover',
                                                        display: 'block',
                                                        filter: isSelected ? 'brightness(1.05)' : 'brightness(0.9)',
                                                        transition: 'filter 0.2s',
                                                    }}
                                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_CITY_IMAGE; }}
                                                />
                                                <div style={{
                                                    position: 'absolute', inset: 0,
                                                    background: isSelected
                                                        ? 'linear-gradient(to top, rgba(14,165,233,0.7) 0%, transparent 60%)'
                                                        : 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
                                                    transition: 'background 0.2s',
                                                }} />
                                                <div style={{
                                                    position: 'absolute', bottom: 6, left: 8, right: 8,
                                                }}>
                                                    <div style={{
                                                        fontSize: 12, fontWeight: 700, color: '#fff',
                                                        fontFamily: "'Outfit', sans-serif",
                                                        textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                                                        lineHeight: 1.2,
                                                    }}>
                                                        {sub.city}
                                                    </div>
                                                    <div style={{
                                                        fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
                                                        fontFamily: "'Fredoka', sans-serif",
                                                    }}>
                                                        {sub.code}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <div style={{
                                                        position: 'absolute', top: 6, right: 6,
                                                        width: 20, height: 20, borderRadius: '50%',
                                                        background: '#0EA5E9',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                {!selectedSubDest && (
                                    <div style={{
                                        textAlign: 'center', marginTop: 10,
                                        fontSize: 12, color: '#94A3B8',
                                        fontFamily: "'Outfit', sans-serif",
                                    }}>
                                        Choisis une ville pour voir les dates et prix
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Section header (shown when not waiting for city pick) */}
                        {(!isCountryLevel || selectedSubDest || subDestinations.length === 0) && (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: 16,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: (loading || liveSearching) ? '#F59E0B' : deals.length > 0 ? '#10B981' : '#94A3B8',
                                    boxShadow: (loading || liveSearching)
                                        ? '0 0 8px rgba(245,158,11,0.4)'
                                        : deals.length > 0 ? '0 0 8px rgba(16,185,129,0.4)' : 'none',
                                    animation: (loading || liveSearching) ? 'destPulse 1.5s ease-in-out infinite' : 'none',
                                }} />
                                <span style={{
                                    fontSize: 14, fontWeight: 600, color: '#0F172A',
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    {loading
                                        ? 'Chargement...'
                                        : liveSearching
                                            ? `Recherche ${activeCity} sur Skyscanner...`
                                            : deals.length > 0
                                                ? `${deals.length} date${deals.length > 1 ? 's' : ''} pour ${activeCity}`
                                                : `Aucune date pour ${activeCity}`}
                                </span>
                            </div>
                            {/* Always-visible Skyscanner link */}
                            <a
                                href={fallbackUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    fontSize: 11, fontWeight: 600, color: '#0284C7',
                                    fontFamily: "'Outfit', sans-serif",
                                    textDecoration: 'none',
                                    display: 'flex', alignItems: 'center', gap: 3,
                                    padding: '4px 10px', borderRadius: 8,
                                    background: 'rgba(14,165,233,0.06)',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Skyscanner
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
                            </a>
                        </div>
                        )}

                        {/* Error state */}
                        {error && (
                            <div style={{
                                padding: '12px 16px', borderRadius: 12,
                                background: 'rgba(239,68,68,0.06)',
                                color: '#DC2626', fontSize: 13,
                                fontFamily: "'Outfit', sans-serif",
                                marginBottom: 16,
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Loading skeleton */}
                        {(loading || liveSearching) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} style={{
                                        height: 88, borderRadius: 16,
                                        background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'destShimmer 1.5s ease-in-out infinite',
                                    }} />
                                ))}
                                {liveSearching && (
                                    <div style={{
                                        textAlign: 'center', padding: '8px 0',
                                        fontSize: 12, color: '#94A3B8',
                                        fontFamily: "'Outfit', sans-serif",
                                    }}>
                                        Recherche des meilleurs prix pour les 4 prochains mois...
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Deal date cards */}
                        {!loading && !liveSearching && deals.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {deals.map((deal, i) => {
                                    const isCheapest = i === 0;
                                    const seats = deal.seatsRemaining;
                                    const isUrgent = seats != null && seats <= 3;
                                    const hasTags = deal.tags && deal.tags.length > 0;
                                    const tripDays = deal.departureDate && deal.returnDate
                                        ? Math.round((new Date(deal.returnDate).getTime() - new Date(deal.departureDate).getTime()) / 86400000)
                                        : 0;

                                    return (
                                        <div
                                            key={`${deal.departureDate}-${i}`}
                                            style={{
                                                padding: '16px',
                                                borderRadius: 16,
                                                background: isCheapest
                                                    ? 'linear-gradient(135deg, rgba(14,165,233,0.06), rgba(6,182,212,0.04))'
                                                    : '#F8FAFC',
                                                border: isCheapest
                                                    ? '2px solid rgba(14,165,233,0.2)'
                                                    : isUrgent
                                                        ? '1px solid rgba(239,68,68,0.2)'
                                                        : '1px solid #E2E8F0',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            {/* Top badges row */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                flexWrap: 'wrap', marginBottom: 10,
                                            }}>
                                                {isCheapest && (
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                        padding: '3px 10px', borderRadius: 8,
                                                        background: '#0EA5E9', color: '#fff',
                                                        fontSize: 10, fontWeight: 700,
                                                        fontFamily: "'Outfit', sans-serif",
                                                    }}>
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                        MEILLEUR PRIX
                                                    </span>
                                                )}
                                                {/* Seats remaining badge */}
                                                {seats != null && (
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                        padding: '3px 10px', borderRadius: 8,
                                                        background: isUrgent ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                                        color: isUrgent ? '#DC2626' : '#D97706',
                                                        fontSize: 10, fontWeight: 700,
                                                        fontFamily: "'Outfit', sans-serif",
                                                        animation: isUrgent ? 'destPulse 2s ease-in-out infinite' : 'none',
                                                    }}>
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                                            <circle cx="12" cy="7" r="4"/>
                                                        </svg>
                                                        {isUrgent
                                                            ? `${seats} billet${seats > 1 ? 's' : ''} restant${seats > 1 ? 's' : ''}`
                                                            : `${seats} places dispo`}
                                                    </span>
                                                )}
                                                {/* Trip duration badge */}
                                                {tripDays > 0 && (
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 3,
                                                        padding: '3px 8px', borderRadius: 8,
                                                        background: 'rgba(99,102,241,0.08)',
                                                        color: '#6366F1',
                                                        fontSize: 10, fontWeight: 600,
                                                        fontFamily: "'Outfit', sans-serif",
                                                    }}>
                                                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                                        {tripDays} nuits
                                                    </span>
                                                )}
                                            </div>

                                            {/* Date + Price row */}
                                            <div style={{
                                                display: 'flex', justifyContent: 'space-between',
                                                alignItems: 'flex-start', marginBottom: 10,
                                            }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    {/* Date */}
                                                    <div style={{
                                                        fontSize: 15, fontWeight: 700, color: '#0F172A',
                                                        fontFamily: "'Outfit', sans-serif",
                                                        display: 'flex', alignItems: 'center', gap: 6,
                                                    }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                                                        {deal.departureDate
                                                            ? `${formatDateShort(deal.departureDate)} - ${formatDateShort(deal.returnDate)}`
                                                            : deal.monthLabel || 'Dates flexibles'}
                                                    </div>

                                                    {/* Airline */}
                                                    <div style={{
                                                        fontSize: 12, color: '#64748B',
                                                        fontFamily: "'Outfit', sans-serif",
                                                        marginTop: 5,
                                                        display: 'flex', alignItems: 'center', gap: 6,
                                                    }}>
                                                        {deal.airlineLogo && (
                                                            <img src={deal.airlineLogo} alt="" style={{
                                                                width: 18, height: 18, borderRadius: 4,
                                                                objectFit: 'contain', background: '#fff',
                                                                border: '1px solid #E2E8F0',
                                                            }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                                                        )}
                                                        {deal.airline && (
                                                            <span style={{ fontWeight: 600, color: '#334155' }}>{deal.airline}</span>
                                                        )}
                                                        {deal.operatingAirline && (
                                                            <span style={{ fontSize: 10, color: '#94A3B8' }}>
                                                                op. {deal.operatingAirline}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Flight details: stops + duration (aller & retour) */}
                                                    <div style={{
                                                        fontSize: 11, color: '#64748B',
                                                        fontFamily: "'Outfit', sans-serif",
                                                        marginTop: 6,
                                                        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                                                    }}>
                                                        {/* Outbound */}
                                                        <span style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                                            padding: '2px 8px', borderRadius: 6,
                                                            background: deal.stops === 0 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                                            color: deal.stops === 0 ? '#059669' : '#D97706',
                                                            fontWeight: 600,
                                                        }}>
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-6-6l6 6-6 6"/></svg>
                                                            {formatStops(deal.stops)}
                                                            {deal.durationMinutes > 0 && (
                                                                <span style={{ color: '#94A3B8', fontWeight: 500 }}>
                                                                    {formatDuration(deal.durationMinutes)}
                                                                </span>
                                                            )}
                                                        </span>
                                                        {/* Return */}
                                                        {(deal.returnStops != null || deal.returnDurationMinutes) && (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                padding: '2px 8px', borderRadius: 6,
                                                                background: (deal.returnStops ?? 0) === 0 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                                                color: (deal.returnStops ?? 0) === 0 ? '#059669' : '#D97706',
                                                                fontWeight: 600,
                                                            }}>
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m6 6l-6-6 6-6"/></svg>
                                                                {formatStops(deal.returnStops ?? deal.stops)}
                                                                {deal.returnDurationMinutes && deal.returnDurationMinutes > 0 && (
                                                                    <span style={{ color: '#94A3B8', fontWeight: 500 }}>
                                                                        {formatDuration(deal.returnDurationMinutes)}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        )}
                                                        {/* Total options */}
                                                        {deal.totalOptions && deal.totalOptions > 1 && (
                                                            <span style={{ color: '#94A3B8', fontSize: 10 }}>
                                                                {deal.totalOptions} vols trouves
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Price */}
                                                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                                                    <div style={{
                                                        fontSize: 24, fontWeight: 700,
                                                        color: isCheapest ? '#0284C7' : '#0F172A',
                                                        fontFamily: "'Fredoka', sans-serif",
                                                        lineHeight: 1,
                                                    }}>
                                                        {Math.round(deal.price)} $
                                                    </div>
                                                    <div style={{
                                                        fontSize: 10, color: '#94A3B8',
                                                        fontFamily: "'Outfit', sans-serif",
                                                        marginTop: 2,
                                                    }}>
                                                        aller-retour
                                                    </div>
                                                    {deal.price > 0 && tripDays > 0 && (
                                                        <div style={{
                                                            fontSize: 10, color: '#0EA5E9',
                                                            fontFamily: "'Fredoka', sans-serif",
                                                            fontWeight: 600, marginTop: 3,
                                                        }}>
                                                            {Math.round(deal.price / tripDays)} $/nuit
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Skyscanner booking button */}
                                            <a
                                                href={deal.bookingLink || fallbackUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', gap: 8,
                                                    width: '100%',
                                                    padding: isCheapest ? '12px 16px' : '10px 16px',
                                                    borderRadius: 12,
                                                    border: 'none',
                                                    background: isCheapest
                                                        ? 'linear-gradient(135deg, #0EA5E9, #06B6D4)'
                                                        : 'rgba(14, 165, 233, 0.08)',
                                                    color: isCheapest ? '#fff' : '#0284C7',
                                                    fontSize: isCheapest ? 14 : 13,
                                                    fontWeight: 700,
                                                    fontFamily: "'Outfit', sans-serif",
                                                    textDecoration: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                    e.currentTarget.style.boxShadow = isCheapest
                                                        ? '0 6px 20px rgba(14,165,233,0.35)'
                                                        : '0 2px 8px rgba(14,165,233,0.15)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'none';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            >
                                                {isCheapest ? 'Reserver sur Skyscanner' : 'Voir sur Skyscanner'}
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                                                </svg>
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* No deals state */}
                        {!loading && !liveSearching && !error && deals.length === 0 && (
                            <div style={{
                                textAlign: 'center', padding: '32px 16px',
                                color: '#94A3B8', fontFamily: "'Outfit', sans-serif",
                            }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>&#9992;</div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                                    Pas encore de dates scannees
                                </div>
                                <div style={{ fontSize: 13, marginBottom: 20, lineHeight: 1.5, maxWidth: 320, margin: '0 auto 20px' }}>
                                    Les prix sont mis a jour automatiquement.
                                    En attendant, cherche directement sur Skyscanner.
                                </div>
                                <a
                                    href={fallbackUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '13px 28px', borderRadius: 14,
                                        background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                        color: '#fff', fontSize: 14, fontWeight: 700,
                                        fontFamily: "'Outfit', sans-serif",
                                        textDecoration: 'none',
                                        boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(14,165,233,0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(14,165,233,0.3)';
                                    }}
                                >
                                    Chercher sur Skyscanner
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M7 17L17 7M17 7H7M17 7v10" />
                                    </svg>
                                </a>
                            </div>
                        )}

                        {/* Price history chart */}
                        {(historyPoints.length >= 2 || historyLoading) && (
                            <div style={{ marginTop: 20 }}>
                                <PriceHistoryChart
                                    points={historyPoints}
                                    avg={historyAvg}
                                    min={historyMin}
                                    max={historyMax}
                                    days={chartDays}
                                    onDaysChange={setChartDays}
                                    loading={historyLoading}
                                />
                            </div>
                        )}

                        {/* Footer tip */}
                        <div style={{
                            marginTop: 20, padding: '12px 16px', borderRadius: 12,
                            background: 'rgba(14,165,233,0.04)',
                            border: '1px solid rgba(14,165,233,0.08)',
                            display: 'flex', alignItems: 'flex-start', gap: 8,
                        }}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}>&#128161;</span>
                            <span style={{
                                fontSize: 12, color: '#64748B', lineHeight: 1.5,
                                fontFamily: "'Outfit', sans-serif",
                            }}>
                                Les prix sont scannes automatiquement depuis Skyscanner.
                                Clique sur une date pour etre redirige directement vers la page de reservation.
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes destFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes destSlideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes destPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                @keyframes destShimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </>
    );
}
