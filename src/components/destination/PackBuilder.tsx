import React, { useState, useMemo } from 'react';
import { DarkCard, SectionHeader } from './ui';
import { FlightDeal, HotelInfo, PackAnalysis } from './types';
import { formatDateFr, formatDuration, getTripNights, starRating, AMENITY_ICONS } from './helpers';

interface PackBuilderProps {
    city: string;
    code: string;
    isAllInclusive: boolean;
    flights: FlightDeal[];
    sortedFlights: FlightDeal[];
    hotels: HotelInfo[];
    hotelsLoading: boolean;
    packStep: 0 | 1 | 2;
    setPackStep: (s: 0 | 1 | 2) => void;
    selectedFlight: FlightDeal | null;
    setSelectedFlight: (f: FlightDeal | null) => void;
    selectedHotel: HotelInfo | null;
    setSelectedHotel: (h: HotelInfo | null) => void;
    selectedNights: number;
    combinedTotal: number | null;
    recommendedHotel: HotelInfo | null;
    packAnalysis: PackAnalysis | null;
    setPackAnalysis: (a: PackAnalysis | null) => void;
    analysisLoading: boolean;
}

// ── Deal level config ──
const DEAL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
    lowest_ever: { label: 'PRIX RECORD', color: '#A855F7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)', icon: '🏆' },
    incredible: { label: 'INCROYABLE', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', icon: '🔥' },
    great: { label: 'SUPER DEAL', color: '#FFB800', bg: 'rgba(255,184,0,0.1)', border: 'rgba(255,184,0,0.25)', icon: '⚡' },
    good: { label: 'BON PRIX', color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', icon: '👍' },
    slight: { label: 'CORRECT', color: '#64748B', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.15)', icon: '👌' },
    normal: { label: '', color: '', bg: '', border: '', icon: '' },
};

type FlightSort = 'price' | 'direct' | 'duration' | 'deal';
type HotelSort = 'recommended' | 'price' | 'rating';

export default function PackBuilder({
    city, code, isAllInclusive,
    flights, sortedFlights, hotels, hotelsLoading,
    packStep, setPackStep,
    selectedFlight, setSelectedFlight,
    selectedHotel, setSelectedHotel,
    selectedNights, combinedTotal,
    recommendedHotel,
    packAnalysis, setPackAnalysis, analysisLoading,
}: PackBuilderProps) {
    const [flightSort, setFlightSort] = useState<FlightSort>('price');
    const [hotelSort, setHotelSort] = useState<HotelSort>('recommended');

    // ── Sorted flights with active sort ──
    const displayFlights = useMemo(() => {
        const list = [...flights].slice(0, 20);
        switch (flightSort) {
            case 'price': return list.sort((a, b) => a.price - b.price);
            case 'direct': return list.sort((a, b) => a.stops - b.stops || a.price - b.price);
            case 'duration': return list.sort((a, b) => (a.durationMinutes || 999) - (b.durationMinutes || 999));
            case 'deal': return list.sort((a, b) => (b.discount || 0) - (a.discount || 0));
            default: return list;
        }
    }, [flights, flightSort]);

    // ── Sorted hotels ──
    const displayHotels = useMemo(() => {
        const list = [...hotels];
        switch (hotelSort) {
            case 'price': return list.sort((a, b) => a.pricePerNight - b.pricePerNight);
            case 'rating': return list.sort((a, b) => b.rating - a.rating);
            case 'recommended':
            default: {
                const maxP = Math.max(...list.map(h => h.pricePerNight), 1);
                const maxR = Math.max(...list.map(h => h.rating), 1);
                return list.sort((a, b) => {
                    const sa = ((maxP - a.pricePerNight) / maxP) * 0.4 + (a.rating / maxR) * 0.6;
                    const sb = ((maxP - b.pricePerNight) / maxP) * 0.4 + (b.rating / maxR) * 0.6;
                    return sb - sa;
                });
            }
        }
    }, [hotels, hotelSort]);

    // ── Stats ──
    const cheapestFlight = flights.length > 0 ? Math.min(...flights.map(f => f.price)) : null;
    const cheapestHotel = hotels.length > 0 ? Math.min(...hotels.map(h => h.pricePerNight)) : null;
    const directCount = flights.filter(f => f.stops === 0).length;
    const bestDeal = flights.find(f => f.dealLevel && f.dealLevel !== 'normal');

    // ── Pill button helper ──
    const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
        <button onClick={onClick} style={{
            padding: '6px 14px', borderRadius: 100, border: 'none', cursor: 'pointer',
            fontSize: 10, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
            background: active ? 'linear-gradient(135deg, #0EA5E9, #06B6D4)' : 'rgba(255,255,255,0.05)',
            color: active ? '#fff' : 'rgba(255,255,255,0.4)',
            transition: 'all 0.2s',
        }}>{children}</button>
    );

    return (
        <DarkCard style={{ border: '1px solid rgba(255,215,0,0.15)', padding: 0, overflow: 'hidden' }}>
            {/* ════════════════════════════════════════════
                HEADER — Route visual
               ════════════════════════════════════════════ */}
            <div style={{
                padding: '24px 22px 18px',
                background: 'linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(255,215,0,0.04) 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
                {/* Route visual */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                        background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(14,165,233,0.3)',
                    }}>
                        <span style={{ fontSize: 22 }}>🧳</span>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'Fredoka', sans-serif" }}>
                            Constructeur de Pack
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>
                            Vol + Hôtel pour {city} — {isAllInclusive ? 'Tout-inclus' : 'Sur mesure'}
                        </div>
                    </div>
                </div>

                {/* Route bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 0,
                    padding: '12px 16px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif" }}>YUL</div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>Montréal</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                        <div style={{ flex: 1, height: 2, background: 'linear-gradient(90deg, #0EA5E9, rgba(255,215,0,0.4), #FFD700)', borderRadius: 2 }} />
                        <span style={{ fontSize: 16, margin: '0 -4px', position: 'relative', top: -1 }}>✈️</span>
                        <div style={{ flex: 1, height: 2, background: 'linear-gradient(90deg, #FFD700, rgba(255,215,0,0.4), #0EA5E9)', borderRadius: 2 }} />
                    </div>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#FFD700', fontFamily: "'Fredoka', sans-serif" }}>{code}</div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>{city}</div>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════
                PROGRESS BAR
               ════════════════════════════════════════════ */}
            <div style={{ padding: '16px 22px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20 }}>
                    {[
                        { n: 1, label: 'Vol', icon: '✈️', value: selectedFlight ? `${Math.round(selectedFlight.price)}$` : null },
                        { n: 2, label: 'Hôtel', icon: '🏨', value: selectedHotel ? `${Math.round(selectedHotel.pricePerNight)}$/n` : null },
                    ].map((s, idx) => {
                        const done = packStep > s.n || (s.n === 1 && selectedFlight && packStep >= 2);
                        const active = packStep === s.n;
                        const upcoming = packStep < s.n;
                        return (
                            <React.Fragment key={s.n}>
                                {idx > 0 && (
                                    <div style={{
                                        flex: 1, height: 3, borderRadius: 2, margin: '0 -2px',
                                        background: done ? 'linear-gradient(90deg, #10B981, #0EA5E9)' : 'rgba(255,255,255,0.06)',
                                        transition: 'background 0.5s',
                                    }} />
                                )}
                                <div
                                    onClick={() => {
                                        if (done && s.n === 1) { setPackStep(1); setSelectedHotel(null); setPackAnalysis(null); }
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '8px 14px', borderRadius: 12,
                                        background: active ? 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(6,182,212,0.06))' : done ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                                        border: active ? '2px solid rgba(14,165,233,0.4)' : done ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(255,255,255,0.05)',
                                        cursor: done ? 'pointer' : 'default',
                                        transition: 'all 0.3s', flexShrink: 0,
                                    }}
                                >
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                        background: done ? '#10B981' : active ? 'linear-gradient(135deg, #0EA5E9, #06B6D4)' : 'rgba(255,255,255,0.06)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: done ? 14 : 13, color: '#fff', fontWeight: 800,
                                        boxShadow: active ? '0 2px 12px rgba(14,165,233,0.3)' : 'none',
                                    }}>
                                        {done ? '✓' : s.icon}
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: 11, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                                            color: active ? '#0EA5E9' : done ? '#10B981' : 'rgba(255,255,255,0.25)',
                                        }}>
                                            {s.value || s.label}
                                        </div>
                                        {s.value && (
                                            <div style={{ fontSize: 8, color: done ? 'rgba(16,185,129,0.6)' : 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif" }}>
                                                {s.label}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}

                    {/* Connector to total */}
                    <div style={{
                        flex: 1, height: 3, borderRadius: 2, margin: '0 -2px',
                        background: combinedTotal ? 'linear-gradient(90deg, #0EA5E9, #FFD700)' : 'rgba(255,255,255,0.06)',
                        transition: 'background 0.5s',
                    }} />

                    {/* Total pill */}
                    <div style={{
                        padding: '8px 16px', borderRadius: 12, flexShrink: 0,
                        background: combinedTotal ? 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,184,0,0.06))' : 'rgba(255,255,255,0.02)',
                        border: combinedTotal ? '2px solid rgba(255,215,0,0.25)' : '1px solid rgba(255,255,255,0.05)',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            fontSize: combinedTotal ? 15 : 11, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                            color: combinedTotal ? '#FFD700' : 'rgba(255,255,255,0.2)',
                        }}>
                            {combinedTotal ? `${combinedTotal}$` : '—'}
                        </div>
                        <div style={{ fontSize: 8, color: combinedTotal ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.15)', fontFamily: "'Outfit', sans-serif" }}>
                            Total/pers.
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════
                STEP 0 — CTA
               ════════════════════════════════════════════ */}
            {packStep === 0 && flights.length > 0 && (
                <div style={{ padding: '0 22px 24px' }}>
                    {/* Stats preview */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <div style={{
                            flex: 1, padding: '12px', borderRadius: 12, textAlign: 'center',
                            background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.1)',
                        }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif" }}>
                                {flights.length}
                            </div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>
                                vols trouvés
                            </div>
                            {cheapestFlight && (
                                <div style={{ fontSize: 10, color: '#10B981', fontWeight: 700, fontFamily: "'Fredoka', sans-serif", marginTop: 2 }}>
                                    dès {Math.round(cheapestFlight)}$
                                </div>
                            )}
                        </div>
                        {hotels.length > 0 && (
                            <div style={{
                                flex: 1, padding: '12px', borderRadius: 12, textAlign: 'center',
                                background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.1)',
                            }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: '#FFD700', fontFamily: "'Fredoka', sans-serif" }}>
                                    {hotels.length}
                                </div>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>
                                    hôtels {isAllInclusive ? 'tout-inclus' : 'disponibles'}
                                </div>
                                {cheapestHotel && (
                                    <div style={{ fontSize: 10, color: '#10B981', fontWeight: 700, fontFamily: "'Fredoka', sans-serif", marginTop: 2 }}>
                                        dès {Math.round(cheapestHotel)}$/nuit
                                    </div>
                                )}
                            </div>
                        )}
                        {directCount > 0 && (
                            <div style={{
                                flex: 1, padding: '12px', borderRadius: 12, textAlign: 'center',
                                background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)',
                            }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981', fontFamily: "'Fredoka', sans-serif" }}>
                                    {directCount}
                                </div>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>
                                    vols directs
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Deal highlight */}
                    {bestDeal && bestDeal.dealLevel && DEAL_CONFIG[bestDeal.dealLevel]?.label && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                            background: DEAL_CONFIG[bestDeal.dealLevel].bg,
                            border: `1px solid ${DEAL_CONFIG[bestDeal.dealLevel].border}`,
                        }}>
                            <span style={{ fontSize: 18 }}>{DEAL_CONFIG[bestDeal.dealLevel].icon}</span>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: DEAL_CONFIG[bestDeal.dealLevel].color, fontFamily: "'Fredoka', sans-serif" }}>
                                    {DEAL_CONFIG[bestDeal.dealLevel].label} — {bestDeal.airline} à {Math.round(bestDeal.price)}$
                                </div>
                                {bestDeal.discount && bestDeal.discount > 0 && (
                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif" }}>
                                        {Math.round(bestDeal.discount)}% sous le prix médian
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    <button
                        onClick={() => setPackStep(1)}
                        style={{
                            width: '100%', padding: '18px 20px', borderRadius: 16, cursor: 'pointer',
                            background: 'linear-gradient(135deg, #0EA5E9, #06B6D4, #0EA5E9)',
                            backgroundSize: '200% 200%',
                            border: 'none', color: '#fff', fontSize: 16, fontWeight: 800,
                            fontFamily: "'Fredoka', sans-serif",
                            boxShadow: '0 6px 28px rgba(14,165,233,0.35)',
                            transition: 'all 0.3s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 36px rgba(14,165,233,0.45)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(14,165,233,0.35)'; }}
                    >
                        <span>Construire mon pack</span>
                        <span style={{ fontSize: 20 }}>→</span>
                    </button>
                </div>
            )}

            {/* ════════════════════════════════════════════
                STEP 1 — Flight selection
               ════════════════════════════════════════════ */}
            {packStep >= 1 && (
                <div style={{ padding: '0 22px 22px', animation: 'destFadeIn 0.3s ease-out' }}>
                    {/* Step header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 24, height: 24, borderRadius: '50%',
                                background: selectedFlight ? '#10B981' : 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 800, color: '#fff',
                            }}>{selectedFlight ? '✓' : '1'}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: selectedFlight ? '#10B981' : '#0EA5E9', fontFamily: "'Fredoka', sans-serif" }}>
                                {selectedFlight ? `${selectedFlight.airline} — ${Math.round(selectedFlight.price)}$` : 'Choisis ton vol'}
                            </div>
                        </div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>
                            {flights.length} vol{flights.length > 1 ? 's' : ''}
                        </div>
                    </div>

                    {packStep === 1 && (
                        <>
                            {/* Sort pills */}
                            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                                <Pill active={flightSort === 'price'} onClick={() => setFlightSort('price')}>💰 Meilleur prix</Pill>
                                {directCount > 0 && <Pill active={flightSort === 'direct'} onClick={() => setFlightSort('direct')}>🎯 Direct d&apos;abord</Pill>}
                                <Pill active={flightSort === 'duration'} onClick={() => setFlightSort('duration')}>⏱ Plus court</Pill>
                                {flights.some(f => f.discount && f.discount > 5) && (
                                    <Pill active={flightSort === 'deal'} onClick={() => setFlightSort('deal')}>🔥 Meilleurs deals</Pill>
                                )}
                            </div>

                            {/* Flight list */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto', paddingRight: 4 }}>
                                {displayFlights.map((f, i) => {
                                    const nights = f.tripNights || getTripNights(f.departureDate, f.returnDate);
                                    const isSelected = selectedFlight === f;
                                    const deal = f.dealLevel && f.dealLevel !== 'normal' ? DEAL_CONFIG[f.dealLevel] : null;
                                    const isCheapest = i === 0 && flightSort === 'price';

                                    return (
                                        <div key={`${f.departureDate}-${f.airline}-${i}`}
                                            onClick={() => {
                                                setSelectedFlight(f);
                                                setSelectedHotel(null);
                                                setPackAnalysis(null);
                                                setPackStep(2);
                                            }}
                                            style={{
                                                borderRadius: 14, cursor: 'pointer', overflow: 'hidden',
                                                background: isSelected ? 'rgba(14,165,233,0.08)' : 'rgba(255,255,255,0.02)',
                                                border: isSelected ? '2px solid #0EA5E9' : isCheapest ? '1px solid rgba(16,185,129,0.25)' : deal ? `1px solid ${deal.border}` : '1px solid rgba(255,255,255,0.06)',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                                        >
                                            {/* Deal badge bar */}
                                            {(deal || isCheapest) && (
                                                <div style={{
                                                    padding: '4px 14px',
                                                    background: isCheapest && !deal ? 'rgba(16,185,129,0.08)' : deal?.bg || '',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span style={{ fontSize: 12 }}>{isCheapest && !deal ? '🏷️' : deal?.icon}</span>
                                                        <span style={{
                                                            fontSize: 9, fontWeight: 800, letterSpacing: 0.5,
                                                            color: isCheapest && !deal ? '#10B981' : deal?.color || '',
                                                            fontFamily: "'Fredoka', sans-serif",
                                                        }}>
                                                            {isCheapest && !deal ? 'MEILLEUR PRIX' : deal?.label}
                                                        </span>
                                                    </div>
                                                    {f.discount && f.discount > 0 && (
                                                        <span style={{
                                                            fontSize: 9, fontWeight: 800, color: '#10B981',
                                                            fontFamily: "'Fredoka', sans-serif",
                                                        }}>
                                                            -{Math.round(f.discount)}%
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                                {/* Date + nights column */}
                                                <div style={{ textAlign: 'center', minWidth: 56, flexShrink: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: "'Fredoka', sans-serif" }}>
                                                        {formatDateFr(f.departureDate)}
                                                    </div>
                                                    <div style={{
                                                        fontSize: 9, fontWeight: 600, marginTop: 3,
                                                        padding: '2px 6px', borderRadius: 4,
                                                        background: 'rgba(14,165,233,0.08)', color: '#0EA5E9',
                                                        fontFamily: "'Outfit', sans-serif", display: 'inline-block',
                                                    }}>
                                                        {nights > 0 ? `${nights} nuits` : '—'}
                                                    </div>
                                                </div>

                                                {/* Flight info — center */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    {/* Airline + route mini */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: "'Outfit', sans-serif" }}>
                                                            {f.airline}
                                                        </span>
                                                    </div>
                                                    {/* Route visualization */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>YUL</span>
                                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#0EA5E9', flexShrink: 0 }} />
                                                            <div style={{ flex: 1, height: 1.5, background: f.stops === 0 ? '#0EA5E9' : 'rgba(255,255,255,0.15)', position: 'relative' }}>
                                                                {f.stops > 0 && Array.from({ length: f.stops }).map((_, si) => (
                                                                    <div key={si} style={{
                                                                        position: 'absolute', top: -2.5, width: 6, height: 6, borderRadius: '50%',
                                                                        background: '#1E293B', border: '1.5px solid rgba(245,158,11,0.6)',
                                                                        left: `${((si + 1) / (f.stops + 1)) * 100}%`, transform: 'translateX(-50%)',
                                                                    }} />
                                                                ))}
                                                            </div>
                                                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#FFD700', flexShrink: 0 }} />
                                                        </div>
                                                        <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>{code}</span>
                                                    </div>
                                                    {/* Details line */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                                        <span style={{
                                                            fontSize: 9, fontWeight: 600, fontFamily: "'Outfit', sans-serif",
                                                            color: f.stops === 0 ? '#10B981' : 'rgba(255,255,255,0.45)',
                                                        }}>
                                                            {f.stops === 0 ? '✓ Direct' : `${f.stops} escale${f.stops > 1 ? 's' : ''}`}
                                                        </span>
                                                        {f.durationMinutes > 0 && (
                                                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>
                                                                {formatDuration(f.durationMinutes)}
                                                            </span>
                                                        )}
                                                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: "'Outfit', sans-serif" }}>
                                                            {formatDateFr(f.departureDate)} → {formatDateFr(f.returnDate)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Price — right */}
                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <div style={{
                                                        fontSize: 20, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                                        color: isCheapest ? '#10B981' : deal ? deal.color : '#0EA5E9',
                                                    }}>
                                                        {Math.round(f.price)}$
                                                    </div>
                                                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>
                                                        aller-retour
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* ════════════════════════════════════════════
                        STEP 2 — Hotel selection
                       ════════════════════════════════════════════ */}
                    {packStep === 2 && selectedFlight && (
                        <div style={{ marginTop: 16, animation: 'destFadeIn 0.3s ease-out' }}>
                            {/* Selected flight recap */}
                            <div
                                onClick={() => { setPackStep(1); setSelectedHotel(null); setPackAnalysis(null); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 14px', borderRadius: 12, marginBottom: 16, cursor: 'pointer',
                                    background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(14,165,233,0.3)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.12)'}
                            >
                                <span style={{ fontSize: 18 }}>✈️</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: "'Fredoka', sans-serif" }}>
                                        {selectedFlight.airline} · {Math.round(selectedFlight.price)}$
                                    </div>
                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>
                                        {formatDateFr(selectedFlight.departureDate)} → {formatDateFr(selectedFlight.returnDate)} · {selectedFlight.stops === 0 ? 'Direct' : `${selectedFlight.stops} escale`} · {selectedNights} nuits
                                    </div>
                                </div>
                                <span style={{ fontSize: 10, color: '#0EA5E9', fontFamily: "'Outfit', sans-serif", fontWeight: 600, flexShrink: 0 }}>
                                    ✎ Modifier
                                </span>
                            </div>

                            {/* Hotel header + sort */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                        width: 24, height: 24, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12, fontWeight: 800, color: '#fff',
                                    }}>2</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif" }}>
                                        Choisis ton hôtel
                                    </div>
                                </div>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>
                                    {hotels.length} hôtel{hotels.length > 1 ? 's' : ''}
                                </div>
                            </div>

                            {/* Hotel sort pills */}
                            {hotels.length > 1 && (
                                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                                    <Pill active={hotelSort === 'recommended'} onClick={() => setHotelSort('recommended')}>⭐ Recommandé</Pill>
                                    <Pill active={hotelSort === 'price'} onClick={() => setHotelSort('price')}>💰 Prix</Pill>
                                    <Pill active={hotelSort === 'rating'} onClick={() => setHotelSort('rating')}>🏅 Note</Pill>
                                </div>
                            )}

                            {hotelsLoading ? (
                                <div style={{
                                    textAlign: 'center', padding: '40px 0',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                                }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: '50%',
                                        border: '3px solid rgba(14,165,233,0.15)', borderTopColor: '#0EA5E9',
                                        animation: 'spin 1s linear infinite',
                                    }} />
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                                        Recherche d&apos;hôtels à {city}...
                                    </div>
                                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                </div>
                            ) : hotels.length === 0 ? (
                                <div style={{
                                    textAlign: 'center', padding: '30px 20px', borderRadius: 14,
                                    background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
                                }}>
                                    <div style={{ fontSize: 32, marginBottom: 8 }}>🏨</div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                                        Aucun hôtel disponible pour ces dates.
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {displayHotels.map((h, i) => {
                                        const isSelected = selectedHotel?.name === h.name;
                                        const isRec = recommendedHotel?.name === h.name;
                                        const ratingColor = h.rating >= 8.5 ? '#10B981' : h.rating >= 7 ? '#0EA5E9' : h.rating >= 5 ? '#F59E0B' : '#EF4444';
                                        const ratingLabel = h.rating >= 9 ? 'Exceptionnel' : h.rating >= 8 ? 'Excellent' : h.rating >= 7 ? 'Très bien' : h.rating >= 6 ? 'Bien' : 'Correct';
                                        const hotelTotal = Math.round(selectedFlight.price + h.pricePerNight * selectedNights);

                                        return (
                                            <div key={h.name + i}
                                                onClick={() => { setSelectedHotel(h); setPackAnalysis(null); }}
                                                style={{
                                                    borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                                                    background: isSelected ? 'rgba(14,165,233,0.06)' : 'rgba(255,255,255,0.015)',
                                                    border: isSelected ? '2px solid #0EA5E9' : isRec ? '2px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(14,165,233,0.2)'; }}
                                                onMouseLeave={e => { if (!isSelected && !isRec) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                                            >
                                                {/* Image with overlay */}
                                                {h.imageUrl && (
                                                    <div style={{ position: 'relative', height: 140, width: '100%' }}>
                                                        <div style={{
                                                            height: '100%', width: '100%',
                                                            backgroundImage: `url(${h.imageUrl})`,
                                                            backgroundSize: 'cover', backgroundPosition: 'center',
                                                        }} />
                                                        {/* Bottom gradient */}
                                                        <div style={{
                                                            position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
                                                            background: 'linear-gradient(transparent, rgba(15,23,42,0.9))',
                                                        }} />
                                                        {/* Badges on image */}
                                                        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 6 }}>
                                                            {isRec && (
                                                                <div style={{
                                                                    padding: '4px 10px', borderRadius: 8,
                                                                    background: 'linear-gradient(135deg, #FFB800, #FFD700)',
                                                                    fontSize: 9, fontWeight: 800, color: '#5C4A00', fontFamily: "'Fredoka', sans-serif",
                                                                    boxShadow: '0 2px 8px rgba(255,184,0,0.3)',
                                                                }}>
                                                                    ⭐ RECOMMANDÉ
                                                                </div>
                                                            )}
                                                            {h.isAllInclusive && (
                                                                <div style={{
                                                                    padding: '4px 10px', borderRadius: 8,
                                                                    background: 'rgba(16,185,129,0.9)', backdropFilter: 'blur(4px)',
                                                                    fontSize: 9, fontWeight: 800, color: '#fff', fontFamily: "'Fredoka', sans-serif",
                                                                }}>
                                                                    🍹 TOUT-INCLUS
                                                                </div>
                                                            )}
                                                        </div>
                                                        {isSelected && (
                                                            <div style={{
                                                                position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%',
                                                                background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                color: '#fff', fontSize: 16, fontWeight: 800,
                                                                boxShadow: '0 2px 8px rgba(14,165,233,0.4)',
                                                            }}>✓</div>
                                                        )}
                                                        {/* Name overlay on image bottom */}
                                                        <div style={{ position: 'absolute', bottom: 8, left: 12, right: 12 }}>
                                                            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: "'Fredoka', sans-serif", lineHeight: 1.2, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                                                                {h.name}
                                                            </div>
                                                            {h.stars > 0 && (
                                                                <div style={{ fontSize: 11, color: '#FFD700', textShadow: '0 1px 3px rgba(0,0,0,0.5)', marginTop: 2 }}>
                                                                    {starRating(h.stars)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div style={{ padding: '14px 16px' }}>
                                                    {/* Rating + price row */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                                        {/* Rating badge */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <div style={{
                                                                width: 42, height: 42, borderRadius: 10,
                                                                background: `${ratingColor}18`,
                                                                border: `2px solid ${ratingColor}35`,
                                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                            }}>
                                                                <span style={{ fontSize: 16, fontWeight: 800, color: ratingColor, fontFamily: "'Fredoka', sans-serif", lineHeight: 1 }}>
                                                                    {h.rating.toFixed(1)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 11, fontWeight: 700, color: ratingColor, fontFamily: "'Outfit', sans-serif" }}>
                                                                    {ratingLabel}
                                                                </div>
                                                                {h.reviewCount > 0 && (
                                                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>
                                                                        {h.reviewCount.toLocaleString()} avis
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Price per night */}
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: 20, fontWeight: 800, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif" }}>
                                                                {Math.round(h.pricePerNight)}$
                                                            </div>
                                                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>/nuit</div>
                                                        </div>
                                                    </div>

                                                    {/* Amenities */}
                                                    {h.amenities && h.amenities.length > 0 && (
                                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                                                            {h.amenities.slice(0, 6).map((a, j) => (
                                                                <span key={j} style={{
                                                                    padding: '3px 8px', borderRadius: 6, fontSize: 9,
                                                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                                                                    color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif",
                                                                }}>
                                                                    {AMENITY_ICONS[a] || '·'} {a}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Pack total for this hotel */}
                                                    <div style={{
                                                        padding: '10px 14px', borderRadius: 10,
                                                        background: 'linear-gradient(135deg, rgba(14,165,233,0.06), rgba(255,215,0,0.04))',
                                                        border: '1px solid rgba(14,165,233,0.1)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    }}>
                                                        <div>
                                                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>
                                                                Pack complet · {selectedNights} nuits
                                                            </div>
                                                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif", marginTop: 1 }}>
                                                                ✈️ {Math.round(selectedFlight.price)}$ + 🏨 {Math.round(h.pricePerNight * selectedNights)}$
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            fontSize: 18, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                                            color: '#FFD700',
                                                        }}>
                                                            {hotelTotal}$
                                                            <span style={{ fontSize: 9, color: 'rgba(255,215,0,0.5)', marginLeft: 2 }}>/pers.</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ════════════════════════════════════════════
                                PACK SUMMARY (when both selected)
                               ════════════════════════════════════════════ */}
                            {selectedFlight && selectedHotel && (
                                <div style={{ marginTop: 20, animation: 'destFadeIn 0.4s ease-out' }}>
                                    {/* Big price hero */}
                                    <div style={{
                                        padding: '24px 20px', borderRadius: 18, textAlign: 'center',
                                        background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,184,0,0.04), rgba(14,165,233,0.06))',
                                        border: '2px solid rgba(255,215,0,0.2)',
                                        marginBottom: 16,
                                    }}>
                                        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,215,0,0.5)', fontFamily: "'Outfit', sans-serif", letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
                                            TON PACK {isAllInclusive ? 'TOUT-INCLUS' : 'SUR MESURE'}
                                        </div>
                                        <div style={{ fontSize: 42, fontWeight: 800, color: '#FFD700', fontFamily: "'Fredoka', sans-serif", lineHeight: 1 }}>
                                            {combinedTotal}$
                                        </div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,215,0,0.4)', fontFamily: "'Outfit', sans-serif", marginTop: 4 }}>par personne · tout compris</div>

                                        {/* Trip summary line */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
                                            marginTop: 14, padding: '10px 0',
                                            borderTop: '1px solid rgba(255,255,255,0.05)',
                                        }}>
                                            {[
                                                { icon: '📅', value: `${selectedNights} nuits`, sub: `${formatDateFr(selectedFlight.departureDate)} → ${formatDateFr(selectedFlight.returnDate)}` },
                                                { icon: '✈️', value: selectedFlight.airline, sub: selectedFlight.stops === 0 ? 'Direct' : `${selectedFlight.stops} escale` },
                                                { icon: '🏨', value: `${selectedHotel.stars > 0 ? starRating(selectedHotel.stars) + ' ' : ''}${selectedHotel.rating.toFixed(1)}`, sub: selectedHotel.name.length > 16 ? selectedHotel.name.slice(0, 16) + '…' : selectedHotel.name },
                                            ].map((item, i) => (
                                                <div key={i} style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: 14 }}>{item.icon}</div>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: "'Fredoka', sans-serif", marginTop: 2 }}>{item.value}</div>
                                                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", marginTop: 1 }}>{item.sub}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Price breakdown */}
                                        <div style={{
                                            display: 'flex', justifyContent: 'center', gap: 20,
                                            marginTop: 10, padding: '8px 0',
                                        }}>
                                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>
                                                ✈️ Vol <strong style={{ color: '#0EA5E9' }}>{Math.round(selectedFlight.price)}$</strong>
                                            </div>
                                            <div style={{ color: 'rgba(255,255,255,0.15)' }}>+</div>
                                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>
                                                🏨 Hôtel <strong style={{ color: '#0EA5E9' }}>{Math.round(selectedHotel.pricePerNight * selectedNights)}$</strong>
                                                <span style={{ color: 'rgba(255,255,255,0.25)' }}> ({selectedNights}n × {Math.round(selectedHotel.pricePerNight)}$)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Savings badges */}
                                    {packAnalysis && packAnalysis.savings && (
                                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                            {packAnalysis.savings.vsMedian !== 0 && (
                                                <div style={{
                                                    flex: 1, padding: '10px 12px', borderRadius: 12, textAlign: 'center',
                                                    background: packAnalysis.savings.vsMedian > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)',
                                                    border: `1px solid ${packAnalysis.savings.vsMedian > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)'}`,
                                                }}>
                                                    <div style={{
                                                        fontSize: 18, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                                        color: packAnalysis.savings.vsMedian > 0 ? '#10B981' : '#EF4444',
                                                    }}>
                                                        {packAnalysis.savings.vsMedian > 0 ? '-' : '+'}{Math.abs(Math.round(packAnalysis.savings.vsMedian))}$
                                                    </div>
                                                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>vs prix médian</div>
                                                </div>
                                            )}
                                            {packAnalysis.savings.totalSavingsPercent !== 0 && (
                                                <div style={{
                                                    flex: 1, padding: '10px 12px', borderRadius: 12, textAlign: 'center',
                                                    background: packAnalysis.savings.totalSavingsPercent > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)',
                                                    border: `1px solid ${packAnalysis.savings.totalSavingsPercent > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)'}`,
                                                }}>
                                                    <div style={{
                                                        fontSize: 18, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                                        color: packAnalysis.savings.totalSavingsPercent > 0 ? '#10B981' : '#EF4444',
                                                    }}>
                                                        {packAnalysis.savings.totalSavingsPercent > 0 ? '-' : '+'}{Math.abs(Math.round(packAnalysis.savings.totalSavingsPercent))}%
                                                    </div>
                                                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>économie totale</div>
                                                </div>
                                            )}
                                            {packAnalysis.history.dataPoints > 0 && (
                                                <div style={{
                                                    flex: 1, padding: '10px 12px', borderRadius: 12, textAlign: 'center',
                                                    background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.12)',
                                                }}>
                                                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif" }}>
                                                        {packAnalysis.history.dataPoints}
                                                    </div>
                                                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>prix analysés</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* AI Analysis */}
                                    {analysisLoading && (
                                        <div style={{
                                            padding: '20px', borderRadius: 14, textAlign: 'center',
                                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                            marginBottom: 16,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                                <img src="/logo_geai.png" alt="" width={24} height={24} style={{ borderRadius: '50%' }} />
                                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                                                    GeAI analyse ton pack...
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {packAnalysis && (
                                        <>
                                            {/* Verdict card */}
                                            <div style={{
                                                padding: '16px 18px', borderRadius: 14, marginBottom: 12,
                                                background: packAnalysis.aiAnalysis.verdict === 'achete' ? 'rgba(16,185,129,0.1)' : packAnalysis.aiAnalysis.verdict === 'attends' ? 'rgba(245,158,11,0.08)' : 'rgba(14,165,233,0.08)',
                                                border: `1px solid ${packAnalysis.aiAnalysis.verdict === 'achete' ? 'rgba(16,185,129,0.2)' : packAnalysis.aiAnalysis.verdict === 'attends' ? 'rgba(245,158,11,0.2)' : 'rgba(14,165,233,0.15)'}`,
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                                    <div style={{
                                                        width: 44, height: 44, borderRadius: 14,
                                                        background: packAnalysis.aiAnalysis.verdict === 'achete' ? 'rgba(16,185,129,0.15)' : packAnalysis.aiAnalysis.verdict === 'attends' ? 'rgba(245,158,11,0.12)' : 'rgba(14,165,233,0.12)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                                                    }}>
                                                        {packAnalysis.aiAnalysis.verdict === 'achete' ? '🔥' : packAnalysis.aiAnalysis.verdict === 'attends' ? '⏳' : '👍'}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{
                                                            fontSize: 16, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                                            color: packAnalysis.aiAnalysis.verdict === 'achete' ? '#10B981' : packAnalysis.aiAnalysis.verdict === 'attends' ? '#F59E0B' : '#0EA5E9',
                                                        }}>
                                                            {packAnalysis.aiAnalysis.verdict === 'achete' ? 'Achète maintenant!' : packAnalysis.aiAnalysis.verdict === 'attends' ? 'Attends un peu' : 'Bon deal!'}
                                                        </div>
                                                        {/* Confidence bar */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                                                <div style={{
                                                                    height: '100%', borderRadius: 2,
                                                                    width: `${packAnalysis.aiAnalysis.confidence}%`,
                                                                    background: packAnalysis.aiAnalysis.confidence >= 70 ? '#10B981' : packAnalysis.aiAnalysis.confidence >= 40 ? '#F59E0B' : '#EF4444',
                                                                    transition: 'width 1s ease-out',
                                                                }} />
                                                            </div>
                                                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", flexShrink: 0 }}>
                                                                {packAnalysis.aiAnalysis.confidence}% confiance
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontFamily: "'Outfit', sans-serif", margin: 0, lineHeight: 1.6 }}>
                                                    {packAnalysis.aiAnalysis.summary}
                                                </p>
                                            </div>

                                            {/* Pros & Cons */}
                                            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                                <div style={{
                                                    flex: 1, padding: '12px 14px', borderRadius: 12,
                                                    background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)',
                                                }}>
                                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#10B981', fontFamily: "'Outfit', sans-serif", marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Points forts</div>
                                                    {packAnalysis.aiAnalysis.pros.map((p, i) => (
                                                        <div key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif", marginBottom: 4, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                                            <span style={{ color: '#10B981', flexShrink: 0 }}>✓</span> {p}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div style={{
                                                    flex: 1, padding: '12px 14px', borderRadius: 12,
                                                    background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.08)',
                                                }}>
                                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', fontFamily: "'Outfit', sans-serif", marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>À considérer</div>
                                                    {packAnalysis.aiAnalysis.cons.map((c, i) => (
                                                        <div key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif", marginBottom: 4, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                                            <span style={{ color: '#EF4444', flexShrink: 0 }}>!</span> {c}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Hotel review + best time */}
                                            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                                {packAnalysis.hotelHighlights.aiReview && (
                                                    <div style={{
                                                        flex: 2, padding: '12px 14px', borderRadius: 12,
                                                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                                                    }}>
                                                        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' }}>
                                                            Avis voyageurs
                                                        </div>
                                                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: "'Outfit', sans-serif", margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
                                                            &ldquo;{packAnalysis.hotelHighlights.aiReview}&rdquo;
                                                        </p>
                                                    </div>
                                                )}
                                                {packAnalysis.aiAnalysis.bestTimeAdvice && (
                                                    <div style={{
                                                        flex: 1, padding: '12px 14px', borderRadius: 12,
                                                        background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.1)',
                                                    }}>
                                                        <div style={{ fontSize: 9, fontWeight: 700, color: '#FFD700', fontFamily: "'Outfit', sans-serif", letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' }}>
                                                            Conseil
                                                        </div>
                                                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: "'Outfit', sans-serif", margin: 0, lineHeight: 1.6 }}>
                                                            {packAnalysis.aiAnalysis.bestTimeAdvice}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Booking CTAs */}
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <a href={selectedFlight.bookingLink || `https://www.skyscanner.ca/transport/flights/yul/${code.toLowerCase()}/`}
                                            target="_blank" rel="noopener noreferrer"
                                            style={{
                                                flex: 1, textAlign: 'center', padding: '14px', borderRadius: 14,
                                                background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                                color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                                                textDecoration: 'none',
                                                boxShadow: '0 4px 16px rgba(14,165,233,0.25)',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            ✈️ Réserver le vol · {Math.round(selectedFlight.price)}$
                                        </a>
                                        {selectedHotel.bookingUrl && (
                                            <a href={selectedHotel.bookingUrl} target="_blank" rel="noopener noreferrer"
                                                style={{
                                                    flex: 1, textAlign: 'center', padding: '14px', borderRadius: 14,
                                                    background: 'linear-gradient(135deg, #FFB800, #FFD700)',
                                                    color: '#5C4A00', fontSize: 13, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                                                    textDecoration: 'none',
                                                    boxShadow: '0 4px 16px rgba(255,184,0,0.25)',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                            >
                                                🏨 Réserver l&apos;hôtel · {Math.round(selectedHotel.pricePerNight * selectedNights)}$
                                            </a>
                                        )}
                                    </div>

                                    {/* Reset link */}
                                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                                        <button
                                            onClick={() => {
                                                setPackStep(1);
                                                setSelectedFlight(null);
                                                setSelectedHotel(null);
                                                setPackAnalysis(null);
                                            }}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif",
                                                textDecoration: 'underline', padding: 4,
                                            }}
                                        >
                                            Recommencer un nouveau pack
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </DarkCard>
    );
}
