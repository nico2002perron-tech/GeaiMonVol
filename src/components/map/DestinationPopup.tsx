'use client';

import { useState, useEffect, useRef } from 'react';
import { CITY_IMAGES, COUNTRY_IMAGES, DEFAULT_CITY_IMAGE, DEAL_LEVELS, COUNTRY_SUBDESTINATIONS } from '@/lib/constants/deals';
import type { SubDestination } from '@/lib/constants/deals';

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
    discount?: number;
    tripNights?: number;
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
        const day = d.getDate();
        const months = ['jan', 'fev', 'mar', 'avr', 'mai', 'juin', 'juil', 'aout', 'sep', 'oct', 'nov', 'dec'];
        return `${day} ${months[d.getMonth()]}`;
    } catch { return dateStr; }
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

function getTripNights(dep: string, ret: string): number {
    if (!dep || !ret) return 0;
    return Math.round((new Date(ret).getTime() - new Date(dep).getTime()) / 86400000);
}

type SortMode = 'date' | 'price';

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
    const [sortMode, setSortMode] = useState<SortMode>('date');
    const [avgPrice, setAvgPrice] = useState(0);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Country-level detection
    const isCountryLevel = destinationCode.length === 2 && destinationCode === destinationCode.toUpperCase();
    const subDestinations: SubDestination[] = isCountryLevel ? (COUNTRY_SUBDESTINATIONS[destinationCode] || []) : [];
    const [selectedSubDest, setSelectedSubDest] = useState<SubDestination | null>(null);

    const activeCode = selectedSubDest?.code || destinationCode;
    const activeCity = selectedSubDest?.city || destination;
    const fallbackUrl = `https://www.skyscanner.ca/transport/flights/yul/${activeCode.toLowerCase()}/`;

    // Reset when popup opens
    useEffect(() => {
        if (!isOpen) return;
        setSelectedSubDest(null);
        setDeals([]);
        setError('');
        setAvgPrice(0);
        setSortMode('date');
    }, [isOpen]);

    // Fetch deals when destination changes
    useEffect(() => {
        if (!isOpen || !activeCity) return;

        // For country-level with sub-destinations, wait for city pick
        if (isCountryLevel && subDestinations.length > 0 && !selectedSubDest) {
            setDeals([]);
            setLoading(false);
            return;
        }

        const canLiveSearch = activeCode.length >= 3;

        setLoading(true);
        setError('');
        setDeals([]);
        setLiveSearching(false);

        fetch(`/api/prices/destination?name=${encodeURIComponent(activeCity)}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setError(data.error);
                    setLoading(false);
                    return;
                }

                const dbDeals: DestinationDeal[] = data.deals || [];
                if (data.avgPrice) setAvgPrice(data.avgPrice);

                if (dbDeals.length > 0) {
                    setDeals(dbDeals);
                    setLoading(false);

                    // If few results, also trigger live search to fill in gaps
                    if (dbDeals.length < 4 && canLiveSearch) {
                        setLiveSearching(true);
                        fetchLiveDeals(dbDeals);
                    }
                } else if (canLiveSearch) {
                    // No DB deals — do live search
                    setLiveSearching(true);
                    fetchLiveDeals([]);
                } else {
                    setLoading(false);
                }
            })
            .catch(() => {
                setError('Impossible de charger les dates');
                setLoading(false);
            });

        function fetchLiveDeals(existingDeals: DestinationDeal[]) {
            fetch(`/api/prices/search-live?code=${encodeURIComponent(activeCode)}&city=${encodeURIComponent(activeCity)}`)
                .then((res) => res.json())
                .then((liveData) => {
                    if (liveData.deals && liveData.deals.length > 0) {
                        // Merge: keep existing + add new dates not already present
                        const existingDates = new Set(existingDeals.map(d => d.departureDate));
                        const newDeals = liveData.deals.filter(
                            (d: DestinationDeal) => !existingDates.has(d.departureDate)
                        );
                        const merged = [...existingDeals, ...newDeals]
                            .sort((a, b) => a.departureDate.localeCompare(b.departureDate));
                        setDeals(merged);
                    }
                })
                .catch(() => {})
                .finally(() => {
                    setLiveSearching(false);
                    setLoading(false);
                });
        }
    }, [isOpen, activeCity, activeCode, isCountryLevel, selectedSubDest, subDestinations.length]);

    // Close on ESC
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const imgSrc = CITY_IMAGES[destination] || COUNTRY_IMAGES[destination] || DEFAULT_CITY_IMAGE;
    const level = dealLevel ? DEAL_LEVELS[dealLevel] : null;

    // Sort deals
    const sortedDeals = [...deals].sort((a, b) => {
        if (sortMode === 'price') return a.price - b.price;
        return a.departureDate.localeCompare(b.departureDate);
    });

    const cheapestPrice = deals.length > 0 ? Math.min(...deals.map(d => d.price)) : 0;

    return (
        <>
            <div
                ref={overlayRef}
                onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 500,
                    background: 'rgba(2, 8, 16, 0.6)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 16,
                    animation: 'destFadeIn 0.25s ease-out',
                }}
            >
                <div
                    style={{
                        position: 'relative', width: '100%', maxWidth: 560,
                        maxHeight: 'calc(100vh - 32px)',
                        background: '#fff',
                        borderRadius: 24,
                        boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
                        overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                        animation: 'destSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                >
                    {/* ═══ HERO IMAGE ═══ */}
                    <div style={{ position: 'relative', height: 180, flexShrink: 0 }}>
                        <img
                            src={imgSrc}
                            alt={destination}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_CITY_IMAGE; }}
                        />
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
                        }} />

                        {/* Close */}
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute', top: 12, right: 12,
                                width: 36, height: 36, borderRadius: '50%',
                                border: 'none', background: 'rgba(0,0,0,0.4)',
                                backdropFilter: 'blur(12px)', color: '#fff',
                                fontSize: 18, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
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

                        {/* City name */}
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
                                fontSize: 13, color: 'rgba(255,255,255,0.9)',
                                fontFamily: "'Outfit', sans-serif",
                                marginTop: 4, display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                                    padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                }}>
                                    YUL &rarr; {activeCode}
                                </span>
                                {bestPrice != null && (
                                    <span style={{
                                        fontWeight: 700, fontFamily: "'Fredoka', sans-serif", fontSize: 16,
                                    }}>
                                        {Math.round(bestPrice)} $
                                    </span>
                                )}
                                {discount != null && discount > 0 && (
                                    <span style={{
                                        background: 'rgba(16,185,129,0.3)', color: '#6EE7B7',
                                        padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                                    }}>
                                        -{discount}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ═══ CONTENT ═══ */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 24px' }}>

                        {/* ── City picker (country-level) ── */}
                        {isCountryLevel && subDestinations.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{
                                    fontSize: 13, fontWeight: 600, color: '#0F172A',
                                    fontFamily: "'Outfit', sans-serif", marginBottom: 8,
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    Choisis ta ville
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
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
                                                    borderRadius: 12, overflow: 'hidden',
                                                    cursor: 'pointer', background: 'none', padding: 0,
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <img
                                                    src={sub.image}
                                                    alt={sub.city}
                                                    style={{
                                                        width: '100%', height: 70, objectFit: 'cover', display: 'block',
                                                        filter: isSelected ? 'brightness(1.05)' : 'brightness(0.85)',
                                                    }}
                                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_CITY_IMAGE; }}
                                                />
                                                <div style={{
                                                    position: 'absolute', inset: 0,
                                                    background: isSelected
                                                        ? 'linear-gradient(to top, rgba(14,165,233,0.7), transparent 60%)'
                                                        : 'linear-gradient(to top, rgba(0,0,0,0.6), transparent 60%)',
                                                }} />
                                                <div style={{
                                                    position: 'absolute', bottom: 4, left: 6,
                                                    fontSize: 11, fontWeight: 700, color: '#fff',
                                                    fontFamily: "'Outfit', sans-serif",
                                                    textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                                                }}>
                                                    {sub.city}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                {!selectedSubDest && (
                                    <div style={{
                                        textAlign: 'center', marginTop: 8,
                                        fontSize: 12, color: '#94A3B8', fontFamily: "'Outfit', sans-serif",
                                    }}>
                                        Choisis une ville pour voir les dates
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Header bar: count + sort + Skyscanner link ── */}
                        {(!isCountryLevel || selectedSubDest || subDestinations.length === 0) && (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                marginBottom: 12, gap: 8,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: (loading || liveSearching) ? '#F59E0B' : deals.length > 0 ? '#10B981' : '#94A3B8',
                                        animation: (loading || liveSearching) ? 'destPulse 1.5s ease-in-out infinite' : 'none',
                                    }} />
                                    <span style={{
                                        fontSize: 13, fontWeight: 600, color: '#0F172A',
                                        fontFamily: "'Outfit', sans-serif",
                                    }}>
                                        {loading
                                            ? 'Chargement...'
                                            : liveSearching
                                                ? `Recherche en cours...`
                                                : deals.length > 0
                                                    ? `${deals.length} date${deals.length > 1 ? 's' : ''} disponible${deals.length > 1 ? 's' : ''}`
                                                    : 'Aucune date trouvee'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    {/* Sort toggle */}
                                    {deals.length > 1 && (
                                        <div style={{
                                            display: 'flex', borderRadius: 8, overflow: 'hidden',
                                            border: '1px solid #E2E8F0',
                                        }}>
                                            <button
                                                onClick={() => setSortMode('date')}
                                                style={{
                                                    padding: '4px 10px', border: 'none', fontSize: 11, fontWeight: 600,
                                                    fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                                                    background: sortMode === 'date' ? '#0EA5E9' : '#fff',
                                                    color: sortMode === 'date' ? '#fff' : '#64748B',
                                                }}
                                            >
                                                Date
                                            </button>
                                            <button
                                                onClick={() => setSortMode('price')}
                                                style={{
                                                    padding: '4px 10px', border: 'none', fontSize: 11, fontWeight: 600,
                                                    fontFamily: "'Outfit', sans-serif", cursor: 'pointer',
                                                    background: sortMode === 'price' ? '#0EA5E9' : '#fff',
                                                    color: sortMode === 'price' ? '#fff' : '#64748B',
                                                }}
                                            >
                                                Prix
                                            </button>
                                        </div>
                                    )}
                                    {/* Skyscanner link */}
                                    <a
                                        href={fallbackUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            fontSize: 11, fontWeight: 600, color: '#0284C7',
                                            fontFamily: "'Outfit', sans-serif", textDecoration: 'none',
                                            display: 'flex', alignItems: 'center', gap: 3,
                                            padding: '4px 10px', borderRadius: 8,
                                            background: 'rgba(14,165,233,0.06)',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        Skyscanner
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div style={{
                                padding: '12px 16px', borderRadius: 12,
                                background: 'rgba(239,68,68,0.06)', color: '#DC2626',
                                fontSize: 13, fontFamily: "'Outfit', sans-serif", marginBottom: 12,
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Loading skeleton */}
                        {loading && !liveSearching && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} style={{
                                        height: 72, borderRadius: 14,
                                        background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'destShimmer 1.5s ease-in-out infinite',
                                    }} />
                                ))}
                            </div>
                        )}

                        {/* ═══ DEAL DATE CARDS ═══ */}
                        {sortedDeals.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {sortedDeals.map((deal, i) => {
                                    const isCheapest = deal.price === cheapestPrice;
                                    const nights = deal.tripNights || getTripNights(deal.departureDate, deal.returnDate);
                                    const dealDiscount = deal.discount || (avgPrice > deal.price
                                        ? Math.round(((avgPrice - deal.price) / avgPrice) * 100)
                                        : 0);

                                    return (
                                        <a
                                            key={`${deal.departureDate}-${deal.returnDate}-${i}`}
                                            href={deal.bookingLink || fallbackUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 12,
                                                padding: '14px 16px',
                                                borderRadius: 14,
                                                background: isCheapest ? 'linear-gradient(135deg, rgba(14,165,233,0.05), rgba(6,182,212,0.03))' : '#F8FAFC',
                                                border: isCheapest ? '2px solid rgba(14,165,233,0.2)' : '1px solid #E2E8F0',
                                                textDecoration: 'none', color: 'inherit',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'none';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {/* Date column */}
                                            <div style={{
                                                width: 56, height: 56, borderRadius: 12, flexShrink: 0,
                                                background: isCheapest ? '#0EA5E9' : '#E0F2FE',
                                                display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <span style={{
                                                    fontSize: 18, fontWeight: 700, lineHeight: 1,
                                                    fontFamily: "'Fredoka', sans-serif",
                                                    color: isCheapest ? '#fff' : '#0284C7',
                                                }}>
                                                    {new Date(deal.departureDate + 'T00:00:00').getDate()}
                                                </span>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                                                    fontFamily: "'Outfit', sans-serif",
                                                    color: isCheapest ? 'rgba(255,255,255,0.85)' : '#0284C7',
                                                }}>
                                                    {['jan','fev','mar','avr','mai','juin','juil','aout','sep','oct','nov','dec'][new Date(deal.departureDate + 'T00:00:00').getMonth()]}
                                                </span>
                                            </div>

                                            {/* Info column */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                {/* Date range */}
                                                <div style={{
                                                    fontSize: 14, fontWeight: 600, color: '#0F172A',
                                                    fontFamily: "'Outfit', sans-serif",
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                }}>
                                                    {formatDateFr(deal.departureDate)} - {formatDateFr(deal.returnDate)}
                                                    {nights > 0 && (
                                                        <span style={{
                                                            fontSize: 10, fontWeight: 600,
                                                            padding: '1px 6px', borderRadius: 6,
                                                            background: 'rgba(99,102,241,0.08)', color: '#6366F1',
                                                        }}>
                                                            {nights}n
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Airline + stops */}
                                                <div style={{
                                                    fontSize: 12, color: '#64748B', marginTop: 3,
                                                    fontFamily: "'Outfit', sans-serif",
                                                    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                                                }}>
                                                    {deal.airline && <span style={{ fontWeight: 500 }}>{deal.airline}</span>}
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 3,
                                                        padding: '1px 6px', borderRadius: 4,
                                                        background: deal.stops === 0 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                                        color: deal.stops === 0 ? '#059669' : '#D97706',
                                                        fontWeight: 600, fontSize: 10,
                                                    }}>
                                                        {formatStops(deal.stops)}
                                                        {deal.durationMinutes > 0 && ` · ${formatDuration(deal.durationMinutes)}`}
                                                    </span>
                                                    {deal.seatsRemaining != null && deal.seatsRemaining <= 4 && (
                                                        <span style={{
                                                            fontSize: 10, fontWeight: 600,
                                                            color: deal.seatsRemaining <= 2 ? '#DC2626' : '#D97706',
                                                        }}>
                                                            {deal.seatsRemaining} place{deal.seatsRemaining > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Price column */}
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{
                                                    fontSize: 20, fontWeight: 700, lineHeight: 1,
                                                    fontFamily: "'Fredoka', sans-serif",
                                                    color: isCheapest ? '#0284C7' : '#0F172A',
                                                }}>
                                                    {Math.round(deal.price)} $
                                                </div>
                                                {dealDiscount > 0 && (
                                                    <span style={{
                                                        display: 'inline-block', marginTop: 3,
                                                        fontSize: 10, fontWeight: 700,
                                                        padding: '1px 6px', borderRadius: 6,
                                                        background: dealDiscount >= 30 ? '#10B981' : dealDiscount >= 20 ? '#0EA5E9' : '#94A3B8',
                                                        color: '#fff',
                                                    }}>
                                                        -{dealDiscount}%
                                                    </span>
                                                )}
                                                {isCheapest && (
                                                    <div style={{
                                                        fontSize: 9, fontWeight: 700, color: '#0EA5E9',
                                                        fontFamily: "'Outfit', sans-serif", marginTop: 2,
                                                    }}>
                                                        MEILLEUR PRIX
                                                    </div>
                                                )}
                                            </div>

                                            {/* Arrow */}
                                            <div style={{ flexShrink: 0, color: '#94A3B8' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                                                </svg>
                                            </div>
                                        </a>
                                    );
                                })}

                                {/* Live search in progress indicator */}
                                {liveSearching && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        padding: '14px', borderRadius: 14,
                                        background: 'rgba(245,158,11,0.06)', border: '1px dashed rgba(245,158,11,0.3)',
                                    }}>
                                        <div style={{
                                            width: 6, height: 6, borderRadius: '50%',
                                            background: '#F59E0B',
                                            animation: 'destPulse 1.5s ease-in-out infinite',
                                        }} />
                                        <span style={{
                                            fontSize: 12, color: '#D97706', fontWeight: 600,
                                            fontFamily: "'Outfit', sans-serif",
                                        }}>
                                            Recherche de dates supplementaires...
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Empty state ── */}
                        {!loading && !liveSearching && !error && deals.length === 0 && (!isCountryLevel || selectedSubDest || subDestinations.length === 0) && (
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
                                    Cherche directement sur Skyscanner en attendant.
                                </div>
                                <a
                                    href={fallbackUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '12px 24px', borderRadius: 14,
                                        background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                        color: '#fff', fontSize: 14, fontWeight: 700,
                                        fontFamily: "'Outfit', sans-serif",
                                        textDecoration: 'none',
                                        boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
                                    }}
                                >
                                    Chercher sur Skyscanner
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M7 17L17 7M17 7H7M17 7v10" />
                                    </svg>
                                </a>
                            </div>
                        )}

                        {/* ── Average price info ── */}
                        {avgPrice > 0 && deals.length > 0 && (
                            <div style={{
                                marginTop: 12, padding: '10px 14px', borderRadius: 12,
                                background: '#F8FAFC', border: '1px solid #E2E8F0',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <span style={{
                                    fontSize: 12, color: '#64748B',
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    Prix moyen (90 jours)
                                </span>
                                <span style={{
                                    fontSize: 14, fontWeight: 700, color: '#94A3B8',
                                    fontFamily: "'Fredoka', sans-serif",
                                    textDecoration: 'line-through',
                                }}>
                                    {avgPrice} $
                                </span>
                            </div>
                        )}

                        {/* ── Tip ── */}
                        <div style={{
                            marginTop: 12, padding: '10px 14px', borderRadius: 12,
                            background: 'rgba(14,165,233,0.04)',
                            border: '1px solid rgba(14,165,233,0.08)',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <span style={{ fontSize: 14, flexShrink: 0 }}>&#128161;</span>
                            <span style={{
                                fontSize: 11, color: '#64748B', lineHeight: 1.4,
                                fontFamily: "'Outfit', sans-serif",
                            }}>
                                Clique sur une date pour reserver directement sur Skyscanner. Les prix sont scannes automatiquement.
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
