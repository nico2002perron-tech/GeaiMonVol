import React, { useState, useMemo } from 'react';
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
const DEAL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string; glow: string }> = {
    lowest_ever: { label: 'PRIX RECORD', color: '#7C3AED', bg: 'linear-gradient(135deg, #F3E8FF, #EDE9FE)', border: '#C4B5FD', icon: '🏆', glow: 'rgba(124,58,237,0.15)' },
    incredible:  { label: 'INCROYABLE', color: '#DC2626', bg: 'linear-gradient(135deg, #FEF2F2, #FFE4E6)', border: '#FCA5A5', icon: '🔥', glow: 'rgba(220,38,38,0.12)' },
    great:       { label: 'SUPER DEAL', color: '#D97706', bg: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', border: '#FCD34D', icon: '⚡', glow: 'rgba(217,119,6,0.12)' },
    good:        { label: 'BON PRIX', color: '#059669', bg: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', border: '#6EE7B7', icon: '👍', glow: 'rgba(5,150,105,0.1)' },
    slight:      { label: 'CORRECT', color: '#6B7280', bg: 'linear-gradient(135deg, #F9FAFB, #F3F4F6)', border: '#D1D5DB', icon: '👌', glow: 'none' },
    normal:      { label: '', color: '', bg: '', border: '', icon: '', glow: 'none' },
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

    const cheapestFlight = flights.length > 0 ? Math.min(...flights.map(f => f.price)) : null;
    const cheapestHotel = hotels.length > 0 ? Math.min(...hotels.map(h => h.pricePerNight)) : null;
    const directCount = flights.filter(f => f.stops === 0).length;
    const bestDeal = flights.find(f => f.dealLevel && f.dealLevel !== 'normal');

    // ── Pill ──
    const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
        <button onClick={onClick} style={{
            padding: '7px 16px', borderRadius: 100, cursor: 'pointer',
            fontSize: 11, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
            background: active ? 'linear-gradient(135deg, #00B4D8, #0077B6)' : '#fff',
            color: active ? '#fff' : '#64748B',
            border: active ? 'none' : '1.5px solid #E2E8F0',
            boxShadow: active ? '0 2px 8px rgba(0,180,216,0.25)' : 'none',
            transition: 'all 0.2s',
        }}>{children}</button>
    );

    return (
        <div style={{
            borderRadius: 24, overflow: 'hidden', marginBottom: 24,
            background: '#fff',
            border: '2px solid #E0F2FE',
            boxShadow: '0 8px 40px rgba(0,119,182,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        }}>
            {/* ════════════════════════════════════════════
                HEADER — Bright gradient banner
               ════════════════════════════════════════════ */}
            <div style={{
                padding: '22px 24px 20px',
                background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 50%, #023E8A 100%)',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', bottom: -20, left: '40%', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                        <div style={{
                            width: 46, height: 46, borderRadius: 14,
                            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                        }}>🧳</div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Fredoka', sans-serif" }}>
                                Constructeur de Pack
                            </div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif" }}>
                                {isAllInclusive ? '🍹 Tout-inclus' : '✨ Sur mesure'} · Vol + Hôtel pour {city}
                            </div>
                        </div>
                    </div>

                    {/* Route bar */}
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        padding: '14px 20px', borderRadius: 16,
                        background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                    }}>
                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: "'Fredoka', sans-serif" }}>YUL</div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif" }}>Montréal</div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />
                            <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.3)', position: 'relative' }}>
                                <div style={{
                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                    background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 10px',
                                    fontSize: 14,
                                }}>✈️</div>
                            </div>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFD700', flexShrink: 0, boxShadow: '0 0 8px rgba(255,215,0,0.5)' }} />
                        </div>
                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#FFD700', fontFamily: "'Fredoka', sans-serif" }}>{code}</div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif" }}>{city}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════
                PROGRESS STEPS
               ════════════════════════════════════════════ */}
            <div style={{ padding: '18px 24px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20 }}>
                    {[
                        { n: 1, label: 'Vol', icon: '✈️', value: selectedFlight ? `${Math.round(selectedFlight.price)}$` : null },
                        { n: 2, label: 'Hôtel', icon: '🏨', value: selectedHotel ? `${Math.round(selectedHotel.pricePerNight)}$/n` : null },
                    ].map((s, idx) => {
                        const done = packStep > s.n || (s.n === 1 && selectedFlight && packStep >= 2);
                        const active = packStep === s.n;
                        return (
                            <React.Fragment key={s.n}>
                                {idx > 0 && (
                                    <div style={{
                                        flex: 1, height: 3, borderRadius: 2, margin: '0 4px',
                                        background: done ? 'linear-gradient(90deg, #10B981, #00B4D8)' : '#E2E8F0',
                                        transition: 'background 0.5s',
                                    }} />
                                )}
                                <div
                                    onClick={() => { if (done && s.n === 1) { setPackStep(1); setSelectedHotel(null); setPackAnalysis(null); } }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 16px', borderRadius: 14, flexShrink: 0,
                                        background: active ? '#EFF6FF' : done ? '#ECFDF5' : '#F8FAFC',
                                        border: active ? '2px solid #00B4D8' : done ? '2px solid #10B981' : '2px solid #E2E8F0',
                                        cursor: done ? 'pointer' : 'default',
                                        transition: 'all 0.3s',
                                        boxShadow: active ? '0 2px 12px rgba(0,180,216,0.15)' : 'none',
                                    }}
                                >
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                        background: done ? '#10B981' : active ? 'linear-gradient(135deg, #00B4D8, #0077B6)' : '#E2E8F0',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: done ? 16 : 15, color: done || active ? '#fff' : '#94A3B8', fontWeight: 800,
                                        boxShadow: active ? '0 3px 12px rgba(0,180,216,0.3)' : done ? '0 3px 12px rgba(16,185,129,0.3)' : 'none',
                                    }}>
                                        {done ? '✓' : s.icon}
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: 12, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                                            color: active ? '#0077B6' : done ? '#059669' : '#94A3B8',
                                        }}>
                                            {s.value || s.label}
                                        </div>
                                        {s.value && (
                                            <div style={{ fontSize: 9, color: done ? '#6EE7B7' : '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>{s.label}</div>
                                        )}
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}

                    <div style={{
                        flex: 1, height: 3, borderRadius: 2, margin: '0 4px',
                        background: combinedTotal ? 'linear-gradient(90deg, #00B4D8, #FFB800)' : '#E2E8F0',
                        transition: 'background 0.5s',
                    }} />

                    {/* Total */}
                    <div style={{
                        padding: '10px 20px', borderRadius: 14, flexShrink: 0, textAlign: 'center',
                        background: combinedTotal ? 'linear-gradient(135deg, #FFF7ED, #FFFBEB)' : '#F8FAFC',
                        border: combinedTotal ? '2px solid #FBBF24' : '2px solid #E2E8F0',
                        boxShadow: combinedTotal ? '0 2px 12px rgba(251,191,36,0.15)' : 'none',
                    }}>
                        <div style={{
                            fontSize: combinedTotal ? 17 : 12, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                            color: combinedTotal ? '#D97706' : '#CBD5E1',
                        }}>
                            {combinedTotal ? `${combinedTotal}$` : '—'}
                        </div>
                        <div style={{ fontSize: 8, color: combinedTotal ? '#92400E' : '#CBD5E1', fontFamily: "'Outfit', sans-serif" }}>
                            Total/pers.
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════
                STEP 0 — CTA
               ════════════════════════════════════════════ */}
            {packStep === 0 && flights.length > 0 && (
                <div style={{ padding: '0 24px 28px' }}>
                    {/* Stats cards */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                        <div style={{
                            flex: 1, padding: '16px 12px', borderRadius: 16, textAlign: 'center',
                            background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                            border: '1.5px solid #93C5FD',
                        }}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#1D4ED8', fontFamily: "'Fredoka', sans-serif" }}>
                                {flights.length}
                            </div>
                            <div style={{ fontSize: 10, color: '#3B82F6', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                                vols trouvés
                            </div>
                            {cheapestFlight && (
                                <div style={{
                                    marginTop: 6, padding: '4px 10px', borderRadius: 8,
                                    background: '#DCFCE7', display: 'inline-block',
                                }}>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: '#15803D', fontFamily: "'Fredoka', sans-serif" }}>
                                        dès {Math.round(cheapestFlight)}$
                                    </span>
                                </div>
                            )}
                        </div>

                        {hotels.length > 0 && (
                            <div style={{
                                flex: 1, padding: '16px 12px', borderRadius: 16, textAlign: 'center',
                                background: isAllInclusive ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' : 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
                                border: isAllInclusive ? '1.5px solid #6EE7B7' : '1.5px solid #FDBA74',
                            }}>
                                <div style={{ fontSize: 28, fontWeight: 800, color: isAllInclusive ? '#059669' : '#C2410C', fontFamily: "'Fredoka', sans-serif" }}>
                                    {hotels.length}
                                </div>
                                <div style={{ fontSize: 10, color: isAllInclusive ? '#10B981' : '#EA580C', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                                    {isAllInclusive ? 'tout-inclus 🍹' : 'hôtels'}
                                </div>
                                {cheapestHotel && (
                                    <div style={{
                                        marginTop: 6, padding: '4px 10px', borderRadius: 8,
                                        background: '#DCFCE7', display: 'inline-block',
                                    }}>
                                        <span style={{ fontSize: 12, fontWeight: 800, color: '#15803D', fontFamily: "'Fredoka', sans-serif" }}>
                                            dès {Math.round(cheapestHotel)}$/n
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {directCount > 0 && (
                            <div style={{
                                flex: 1, padding: '16px 12px', borderRadius: 16, textAlign: 'center',
                                background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
                                border: '1.5px solid #86EFAC',
                            }}>
                                <div style={{ fontSize: 28, fontWeight: 800, color: '#15803D', fontFamily: "'Fredoka', sans-serif" }}>
                                    {directCount}
                                </div>
                                <div style={{ fontSize: 10, color: '#16A34A', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                                    vols directs ✓
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Deal alert */}
                    {bestDeal && bestDeal.dealLevel && DEAL_CONFIG[bestDeal.dealLevel]?.label && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '14px 18px', borderRadius: 14, marginBottom: 18,
                            background: DEAL_CONFIG[bestDeal.dealLevel].bg,
                            border: `2px solid ${DEAL_CONFIG[bestDeal.dealLevel].border}`,
                            boxShadow: `0 4px 16px ${DEAL_CONFIG[bestDeal.dealLevel].glow}`,
                        }}>
                            <span style={{ fontSize: 24 }}>{DEAL_CONFIG[bestDeal.dealLevel].icon}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: DEAL_CONFIG[bestDeal.dealLevel].color, fontFamily: "'Fredoka', sans-serif" }}>
                                    {DEAL_CONFIG[bestDeal.dealLevel].label}
                                </div>
                                <div style={{ fontSize: 11, color: '#64748B', fontFamily: "'Outfit', sans-serif" }}>
                                    {bestDeal.airline} à <strong>{Math.round(bestDeal.price)}$</strong>
                                    {bestDeal.discount && bestDeal.discount > 0 ? ` · ${Math.round(bestDeal.discount)}% sous le prix médian` : ''}
                                </div>
                            </div>
                            {bestDeal.discount && bestDeal.discount > 10 && (
                                <div style={{
                                    padding: '6px 12px', borderRadius: 10,
                                    background: '#DCFCE7', border: '1px solid #86EFAC',
                                }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#15803D', fontFamily: "'Fredoka', sans-serif" }}>
                                        -{Math.round(bestDeal.discount)}%
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CTA */}
                    <button
                        onClick={() => setPackStep(1)}
                        style={{
                            width: '100%', padding: '20px 24px', borderRadius: 18, cursor: 'pointer',
                            background: 'linear-gradient(135deg, #FF6B35, #F7418F, #FF6B35)',
                            backgroundSize: '200% 200%',
                            border: 'none', color: '#fff', fontSize: 17, fontWeight: 800,
                            fontFamily: "'Fredoka', sans-serif",
                            boxShadow: '0 8px 32px rgba(255,107,53,0.3), 0 2px 8px rgba(247,65,143,0.2)',
                            transition: 'all 0.3s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                            letterSpacing: 0.3,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(255,107,53,0.4), 0 4px 12px rgba(247,65,143,0.25)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,107,53,0.3), 0 2px 8px rgba(247,65,143,0.2)'; }}
                    >
                        Construire mon pack {isAllInclusive ? 'tout-inclus' : ''} →
                    </button>
                </div>
            )}

            {/* ════════════════════════════════════════════
                STEP 1 — Flights
               ════════════════════════════════════════════ */}
            {packStep >= 1 && (
                <div style={{ padding: '0 24px 24px' }}>
                    {/* Step header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 26, height: 26, borderRadius: '50%',
                                background: selectedFlight ? '#10B981' : 'linear-gradient(135deg, #00B4D8, #0077B6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13, fontWeight: 800, color: '#fff',
                                boxShadow: selectedFlight ? '0 2px 8px rgba(16,185,129,0.3)' : '0 2px 8px rgba(0,180,216,0.3)',
                            }}>{selectedFlight ? '✓' : '1'}</div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: selectedFlight ? '#059669' : '#0077B6', fontFamily: "'Fredoka', sans-serif" }}>
                                {selectedFlight ? `${selectedFlight.airline} — ${Math.round(selectedFlight.price)}$` : 'Choisis ton vol'}
                            </span>
                        </div>
                        <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                            {flights.length} vol{flights.length > 1 ? 's' : ''}
                        </span>
                    </div>

                    {packStep === 1 && (
                        <>
                            {/* Sort pills */}
                            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                                <Pill active={flightSort === 'price'} onClick={() => setFlightSort('price')}>💰 Meilleur prix</Pill>
                                {directCount > 0 && <Pill active={flightSort === 'direct'} onClick={() => setFlightSort('direct')}>🎯 Direct d&apos;abord</Pill>}
                                <Pill active={flightSort === 'duration'} onClick={() => setFlightSort('duration')}>⏱ Plus court</Pill>
                                {flights.some(f => f.discount && f.discount > 5) && (
                                    <Pill active={flightSort === 'deal'} onClick={() => setFlightSort('deal')}>🔥 Deals</Pill>
                                )}
                            </div>

                            {/* Flight list */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflowY: 'auto', paddingRight: 2 }}>
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
                                                borderRadius: 16, cursor: 'pointer', overflow: 'hidden',
                                                background: '#fff',
                                                border: isSelected ? '2px solid #00B4D8' : isCheapest ? '2px solid #10B981' : deal ? `2px solid ${deal.border}` : '1.5px solid #E2E8F0',
                                                boxShadow: isSelected ? '0 4px 16px rgba(0,180,216,0.15)' : isCheapest ? '0 4px 16px rgba(16,185,129,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isSelected ? '0 4px 16px rgba(0,180,216,0.15)' : '0 2px 8px rgba(0,0,0,0.04)'; }}
                                        >
                                            {/* Deal badge bar */}
                                            {(deal || isCheapest) && (
                                                <div style={{
                                                    padding: '6px 16px',
                                                    background: isCheapest && !deal ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' : deal?.bg || '',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span style={{ fontSize: 13 }}>{isCheapest && !deal ? '🏷️' : deal?.icon}</span>
                                                        <span style={{
                                                            fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                                                            color: isCheapest && !deal ? '#059669' : deal?.color || '',
                                                            fontFamily: "'Fredoka', sans-serif",
                                                        }}>
                                                            {isCheapest && !deal ? 'MEILLEUR PRIX' : deal?.label}
                                                        </span>
                                                    </div>
                                                    {f.discount && f.discount > 0 && (
                                                        <span style={{
                                                            padding: '2px 8px', borderRadius: 6,
                                                            background: '#DCFCE7', border: '1px solid #86EFAC',
                                                            fontSize: 10, fontWeight: 800, color: '#15803D',
                                                            fontFamily: "'Fredoka', sans-serif",
                                                        }}>
                                                            -{Math.round(f.discount)}%
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                                                {/* Date block */}
                                                <div style={{ textAlign: 'center', minWidth: 58, flexShrink: 0 }}>
                                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', fontFamily: "'Fredoka', sans-serif" }}>
                                                        {formatDateFr(f.departureDate)}
                                                    </div>
                                                    <div style={{
                                                        fontSize: 9, fontWeight: 700, marginTop: 4,
                                                        padding: '3px 8px', borderRadius: 6,
                                                        background: '#EFF6FF', color: '#1D4ED8',
                                                        fontFamily: "'Outfit', sans-serif", display: 'inline-block',
                                                    }}>
                                                        {nights > 0 ? `${nights} nuits` : '—'}
                                                    </div>
                                                </div>

                                                {/* Flight info */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>
                                                        {f.airline}
                                                    </div>
                                                    {/* Route dots */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                                        <span style={{ fontSize: 9, fontWeight: 800, color: '#0077B6', fontFamily: "'Outfit', sans-serif" }}>YUL</span>
                                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00B4D8', flexShrink: 0 }} />
                                                            <div style={{ flex: 1, height: 2, background: f.stops === 0 ? '#00B4D8' : '#E2E8F0', position: 'relative' }}>
                                                                {f.stops > 0 && Array.from({ length: f.stops }).map((_, si) => (
                                                                    <div key={si} style={{
                                                                        position: 'absolute', top: -3, width: 8, height: 8, borderRadius: '50%',
                                                                        background: '#fff', border: '2px solid #F59E0B',
                                                                        left: `${((si + 1) / (f.stops + 1)) * 100}%`, transform: 'translateX(-50%)',
                                                                    }} />
                                                                ))}
                                                            </div>
                                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
                                                        </div>
                                                        <span style={{ fontSize: 9, fontWeight: 800, color: '#92400E', fontFamily: "'Outfit', sans-serif" }}>{code}</span>
                                                    </div>
                                                    {/* Details */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{
                                                            fontSize: 10, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                                                            color: f.stops === 0 ? '#059669' : '#64748B',
                                                            padding: '1px 6px', borderRadius: 4,
                                                            background: f.stops === 0 ? '#DCFCE7' : 'transparent',
                                                        }}>
                                                            {f.stops === 0 ? '✓ Direct' : `${f.stops} escale${f.stops > 1 ? 's' : ''}`}
                                                        </span>
                                                        {f.durationMinutes > 0 && (
                                                            <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>
                                                                {formatDuration(f.durationMinutes)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Price */}
                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <div style={{
                                                        fontSize: 22, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                                        color: isCheapest ? '#059669' : deal ? deal.color : '#0077B6',
                                                    }}>
                                                        {Math.round(f.price)}$
                                                    </div>
                                                    <div style={{ fontSize: 9, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>aller-retour</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* ════════════════════════════════════════════
                        STEP 2 — Hotels
                       ════════════════════════════════════════════ */}
                    {packStep === 2 && selectedFlight && (
                        <div style={{ marginTop: 16 }}>
                            {/* Selected flight recap */}
                            <div
                                onClick={() => { setPackStep(1); setSelectedHotel(null); setPackAnalysis(null); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 16px', borderRadius: 14, marginBottom: 18, cursor: 'pointer',
                                    background: '#F0FDF4', border: '1.5px solid #86EFAC',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00B4D8'; e.currentTarget.style.background = '#EFF6FF'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#86EFAC'; e.currentTarget.style.background = '#F0FDF4'; }}
                            >
                                <span style={{ fontSize: 20 }}>✈️</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', fontFamily: "'Fredoka', sans-serif" }}>
                                        {selectedFlight.airline} · {Math.round(selectedFlight.price)}$
                                    </div>
                                    <div style={{ fontSize: 10, color: '#64748B', fontFamily: "'Outfit', sans-serif" }}>
                                        {formatDateFr(selectedFlight.departureDate)} → {formatDateFr(selectedFlight.returnDate)} · {selectedFlight.stops === 0 ? 'Direct' : `${selectedFlight.stops} escale`} · {selectedNights} nuits
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: 10, color: '#0077B6', fontFamily: "'Outfit', sans-serif", fontWeight: 700,
                                    padding: '4px 10px', borderRadius: 8, background: '#EFF6FF',
                                }}>
                                    ✎ Modifier
                                </span>
                            </div>

                            {/* Hotel header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                        width: 26, height: 26, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #00B4D8, #0077B6)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 13, fontWeight: 800, color: '#fff',
                                        boxShadow: '0 2px 8px rgba(0,180,216,0.3)',
                                    }}>2</div>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0077B6', fontFamily: "'Fredoka', sans-serif" }}>
                                        Choisis ton hôtel
                                    </span>
                                </div>
                                <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                                    {hotels.length} hôtel{hotels.length > 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Hotel sort */}
                            {hotels.length > 1 && (
                                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                                    <Pill active={hotelSort === 'recommended'} onClick={() => setHotelSort('recommended')}>⭐ Recommandé</Pill>
                                    <Pill active={hotelSort === 'price'} onClick={() => setHotelSort('price')}>💰 Prix</Pill>
                                    <Pill active={hotelSort === 'rating'} onClick={() => setHotelSort('rating')}>🏅 Note</Pill>
                                </div>
                            )}

                            {hotelsLoading ? (
                                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: '50%', margin: '0 auto 12px',
                                        border: '3px solid #E0F2FE', borderTopColor: '#00B4D8',
                                        animation: 'spin 0.8s linear infinite',
                                    }} />
                                    <div style={{ color: '#64748B', fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>
                                        Recherche d&apos;hôtels à {city}...
                                    </div>
                                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                </div>
                            ) : hotels.length === 0 ? (
                                <div style={{
                                    textAlign: 'center', padding: '36px 24px', borderRadius: 18,
                                    background: '#F8FAFC', border: '2px dashed #E2E8F0',
                                }}>
                                    <div style={{ fontSize: 36, marginBottom: 8 }}>🏨</div>
                                    <div style={{ color: '#64748B', fontSize: 13, fontFamily: "'Outfit', sans-serif" }}>
                                        Aucun hôtel disponible pour ces dates.
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {displayHotels.map((h, i) => {
                                        const isSelected = selectedHotel?.name === h.name;
                                        const isRec = recommendedHotel?.name === h.name;
                                        const ratingColor = h.rating >= 8.5 ? '#059669' : h.rating >= 7 ? '#0077B6' : h.rating >= 5 ? '#D97706' : '#DC2626';
                                        const ratingBg = h.rating >= 8.5 ? '#DCFCE7' : h.rating >= 7 ? '#DBEAFE' : h.rating >= 5 ? '#FEF3C7' : '#FEE2E2';
                                        const ratingLabel = h.rating >= 9 ? 'Exceptionnel' : h.rating >= 8 ? 'Excellent' : h.rating >= 7 ? 'Très bien' : h.rating >= 6 ? 'Bien' : 'Correct';
                                        const hotelTotal = Math.round(selectedFlight.price + h.pricePerNight * selectedNights);

                                        return (
                                            <div key={h.name + i}
                                                onClick={() => { setSelectedHotel(h); setPackAnalysis(null); }}
                                                style={{
                                                    borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
                                                    background: '#fff',
                                                    border: isSelected ? '2.5px solid #00B4D8' : isRec ? '2.5px solid #FBBF24' : '1.5px solid #E2E8F0',
                                                    boxShadow: isSelected ? '0 6px 24px rgba(0,180,216,0.15)' : '0 2px 12px rgba(0,0,0,0.04)',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isSelected ? '0 6px 24px rgba(0,180,216,0.15)' : '0 2px 12px rgba(0,0,0,0.04)'; }}
                                            >
                                                {/* Image */}
                                                {h.imageUrl && (
                                                    <div style={{ position: 'relative', height: 160, width: '100%' }}>
                                                        <div style={{
                                                            height: '100%', width: '100%',
                                                            backgroundImage: `url(${h.imageUrl})`,
                                                            backgroundSize: 'cover', backgroundPosition: 'center',
                                                        }} />
                                                        <div style={{
                                                            position: 'absolute', bottom: 0, left: 0, right: 0, height: 70,
                                                            background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
                                                        }} />
                                                        {/* Badges */}
                                                        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                                                            {isRec && (
                                                                <div style={{
                                                                    padding: '5px 12px', borderRadius: 10,
                                                                    background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                                                                    fontSize: 10, fontWeight: 800, color: '#fff', fontFamily: "'Fredoka', sans-serif",
                                                                    boxShadow: '0 2px 10px rgba(251,191,36,0.4)',
                                                                }}>⭐ RECOMMANDÉ</div>
                                                            )}
                                                            {h.isAllInclusive && (
                                                                <div style={{
                                                                    padding: '5px 12px', borderRadius: 10,
                                                                    background: 'linear-gradient(135deg, #10B981, #059669)',
                                                                    fontSize: 10, fontWeight: 800, color: '#fff', fontFamily: "'Fredoka', sans-serif",
                                                                    boxShadow: '0 2px 10px rgba(16,185,129,0.4)',
                                                                }}>🍹 TOUT-INCLUS</div>
                                                            )}
                                                        </div>
                                                        {isSelected && (
                                                            <div style={{
                                                                position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%',
                                                                background: '#00B4D8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                color: '#fff', fontSize: 18, fontWeight: 800,
                                                                boxShadow: '0 2px 10px rgba(0,180,216,0.4)',
                                                            }}>✓</div>
                                                        )}
                                                        {/* Name on image */}
                                                        <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14 }}>
                                                            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'Fredoka', sans-serif", textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
                                                                {h.name}
                                                            </div>
                                                            {h.stars > 0 && (
                                                                <div style={{ fontSize: 12, color: '#FBBF24', textShadow: '0 1px 4px rgba(0,0,0,0.5)', marginTop: 2 }}>
                                                                    {starRating(h.stars)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div style={{ padding: '16px 18px' }}>
                                                    {/* Rating + Price */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{
                                                                width: 46, height: 46, borderRadius: 12,
                                                                background: ratingBg,
                                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                            }}>
                                                                <span style={{ fontSize: 18, fontWeight: 800, color: ratingColor, fontFamily: "'Fredoka', sans-serif", lineHeight: 1 }}>
                                                                    {h.rating.toFixed(1)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 12, fontWeight: 700, color: ratingColor, fontFamily: "'Outfit', sans-serif" }}>{ratingLabel}</div>
                                                                {h.reviewCount > 0 && (
                                                                    <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>
                                                                        {h.reviewCount.toLocaleString()} avis
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: 22, fontWeight: 800, color: '#0077B6', fontFamily: "'Fredoka', sans-serif" }}>
                                                                {Math.round(h.pricePerNight)}$
                                                            </div>
                                                            <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>/nuit</div>
                                                        </div>
                                                    </div>

                                                    {/* Amenities */}
                                                    {h.amenities && h.amenities.length > 0 && (
                                                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                                                            {h.amenities.slice(0, 6).map((a, j) => (
                                                                <span key={j} style={{
                                                                    padding: '4px 10px', borderRadius: 8, fontSize: 10,
                                                                    background: '#F1F5F9', color: '#475569', fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                                                                }}>
                                                                    {AMENITY_ICONS[a] || '·'} {a}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Pack total */}
                                                    <div style={{
                                                        padding: '12px 16px', borderRadius: 14,
                                                        background: 'linear-gradient(135deg, #EFF6FF, #FFF7ED)',
                                                        border: '1.5px solid #BAE6FD',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    }}>
                                                        <div>
                                                            <div style={{ fontSize: 10, color: '#64748B', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                                                                Pack complet · {selectedNights} nuits
                                                            </div>
                                                            <div style={{ fontSize: 9, color: '#94A3B8', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                                                                ✈️ {Math.round(selectedFlight.price)}$ + 🏨 {Math.round(h.pricePerNight * selectedNights)}$
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            fontSize: 22, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                                            color: '#D97706',
                                                        }}>
                                                            {hotelTotal}$
                                                            <span style={{ fontSize: 10, color: '#92400E', marginLeft: 2 }}>/pers.</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ════════════════════════════════════════════
                                PACK SUMMARY
                               ════════════════════════════════════════════ */}
                            {selectedFlight && selectedHotel && (
                                <div style={{ marginTop: 24 }}>
                                    {/* Price hero */}
                                    <div style={{
                                        padding: '28px 24px', borderRadius: 22, textAlign: 'center',
                                        background: 'linear-gradient(135deg, #FF6B35 0%, #F7418F 50%, #7C3AED 100%)',
                                        position: 'relative', overflow: 'hidden',
                                        boxShadow: '0 12px 40px rgba(255,107,53,0.25)',
                                        marginBottom: 18,
                                    }}>
                                        {/* Decorative */}
                                        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                                        <div style={{ position: 'absolute', bottom: -15, left: 20, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit', sans-serif", letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                                                {isAllInclusive ? '🍹 TON PACK TOUT-INCLUS' : '✨ TON PACK SUR MESURE'}
                                            </div>
                                            <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', fontFamily: "'Fredoka', sans-serif", lineHeight: 1, textShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
                                                {combinedTotal}$
                                            </div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif", marginTop: 6 }}>
                                                par personne · aller-retour + {selectedNights} nuits
                                            </div>

                                            {/* Trip summary chips */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                                marginTop: 16, flexWrap: 'wrap',
                                            }}>
                                                {[
                                                    { emoji: '📅', text: `${formatDateFr(selectedFlight.departureDate)} → ${formatDateFr(selectedFlight.returnDate)}` },
                                                    { emoji: '✈️', text: `${selectedFlight.airline} · ${selectedFlight.stops === 0 ? 'Direct' : selectedFlight.stops + ' escale'}` },
                                                    { emoji: '🏨', text: `${selectedHotel.name.length > 20 ? selectedHotel.name.slice(0, 20) + '…' : selectedHotel.name}` },
                                                ].map((chip, ci) => (
                                                    <div key={ci} style={{
                                                        padding: '5px 12px', borderRadius: 10,
                                                        background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
                                                        fontSize: 10, color: '#fff', fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                                                    }}>
                                                        {chip.emoji} {chip.text}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Breakdown */}
                                            <div style={{
                                                display: 'flex', justifyContent: 'center', gap: 16,
                                                marginTop: 14, padding: '10px 0 0',
                                                borderTop: '1px solid rgba(255,255,255,0.15)',
                                            }}>
                                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit', sans-serif" }}>
                                                    ✈️ Vol <strong>{Math.round(selectedFlight.price)}$</strong>
                                                </span>
                                                <span style={{ color: 'rgba(255,255,255,0.3)' }}>+</span>
                                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit', sans-serif" }}>
                                                    🏨 Hôtel <strong>{Math.round(selectedHotel.pricePerNight * selectedNights)}$</strong>
                                                    <span style={{ opacity: 0.6 }}> ({selectedNights}n × {Math.round(selectedHotel.pricePerNight)}$)</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Savings badges */}
                                    {packAnalysis && packAnalysis.savings && (packAnalysis.savings.vsMedian !== 0 || packAnalysis.savings.totalSavingsPercent !== 0) && (
                                        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                                            {packAnalysis.savings.vsMedian !== 0 && (
                                                <div style={{
                                                    flex: 1, padding: '14px', borderRadius: 16, textAlign: 'center',
                                                    background: packAnalysis.savings.vsMedian > 0 ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' : 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
                                                    border: `1.5px solid ${packAnalysis.savings.vsMedian > 0 ? '#6EE7B7' : '#FCA5A5'}`,
                                                }}>
                                                    <div style={{
                                                        fontSize: 22, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                                        color: packAnalysis.savings.vsMedian > 0 ? '#059669' : '#DC2626',
                                                    }}>
                                                        {packAnalysis.savings.vsMedian > 0 ? '−' : '+'}{Math.abs(Math.round(packAnalysis.savings.vsMedian))}$
                                                    </div>
                                                    <div style={{ fontSize: 10, color: '#64748B', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>vs prix médian</div>
                                                </div>
                                            )}
                                            {packAnalysis.savings.totalSavingsPercent !== 0 && (
                                                <div style={{
                                                    flex: 1, padding: '14px', borderRadius: 16, textAlign: 'center',
                                                    background: packAnalysis.savings.totalSavingsPercent > 0 ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' : 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
                                                    border: `1.5px solid ${packAnalysis.savings.totalSavingsPercent > 0 ? '#6EE7B7' : '#FCA5A5'}`,
                                                }}>
                                                    <div style={{
                                                        fontSize: 22, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                                        color: packAnalysis.savings.totalSavingsPercent > 0 ? '#059669' : '#DC2626',
                                                    }}>
                                                        {packAnalysis.savings.totalSavingsPercent > 0 ? '−' : '+'}{Math.abs(Math.round(packAnalysis.savings.totalSavingsPercent))}%
                                                    </div>
                                                    <div style={{ fontSize: 10, color: '#64748B', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>économie</div>
                                                </div>
                                            )}
                                            {packAnalysis.history.dataPoints > 0 && (
                                                <div style={{
                                                    flex: 1, padding: '14px', borderRadius: 16, textAlign: 'center',
                                                    background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                                                    border: '1.5px solid #93C5FD',
                                                }}>
                                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#1D4ED8', fontFamily: "'Fredoka', sans-serif" }}>
                                                        {packAnalysis.history.dataPoints}
                                                    </div>
                                                    <div style={{ fontSize: 10, color: '#64748B', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>prix analysés</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* AI Loading */}
                                    {analysisLoading && (
                                        <div style={{
                                            padding: '24px', borderRadius: 18, textAlign: 'center',
                                            background: '#F8FAFC', border: '1.5px solid #E2E8F0', marginBottom: 16,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                                <img src="/logo_geai.png" alt="" width={28} height={28} style={{ borderRadius: '50%' }} />
                                                <span style={{ color: '#64748B', fontSize: 13, fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                                                    GeAI analyse ton pack...
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {packAnalysis && (
                                        <>
                                            {/* AI Verdict */}
                                            <div style={{
                                                padding: '18px 20px', borderRadius: 18, marginBottom: 14,
                                                background: packAnalysis.aiAnalysis.verdict === 'achete' ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' : packAnalysis.aiAnalysis.verdict === 'attends' ? 'linear-gradient(135deg, #FFFBEB, #FEF3C7)' : 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                                                border: `2px solid ${packAnalysis.aiAnalysis.verdict === 'achete' ? '#6EE7B7' : packAnalysis.aiAnalysis.verdict === 'attends' ? '#FCD34D' : '#93C5FD'}`,
                                                boxShadow: packAnalysis.aiAnalysis.verdict === 'achete' ? '0 4px 20px rgba(16,185,129,0.12)' : '0 4px 20px rgba(0,0,0,0.05)',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                                                    <div style={{
                                                        width: 48, height: 48, borderRadius: 14,
                                                        background: '#fff',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                                    }}>
                                                        {packAnalysis.aiAnalysis.verdict === 'achete' ? '🔥' : packAnalysis.aiAnalysis.verdict === 'attends' ? '⏳' : '👍'}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{
                                                            fontSize: 18, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                                            color: packAnalysis.aiAnalysis.verdict === 'achete' ? '#059669' : packAnalysis.aiAnalysis.verdict === 'attends' ? '#D97706' : '#1D4ED8',
                                                        }}>
                                                            {packAnalysis.aiAnalysis.verdict === 'achete' ? 'Achète maintenant!' : packAnalysis.aiAnalysis.verdict === 'attends' ? 'Attends un peu' : 'Bon deal!'}
                                                        </div>
                                                        {/* Confidence bar */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                                            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                                                                <div style={{
                                                                    height: '100%', borderRadius: 3,
                                                                    width: `${packAnalysis.aiAnalysis.confidence}%`,
                                                                    background: packAnalysis.aiAnalysis.confidence >= 70 ? 'linear-gradient(90deg, #10B981, #059669)' : packAnalysis.aiAnalysis.confidence >= 40 ? 'linear-gradient(90deg, #FBBF24, #F59E0B)' : '#EF4444',
                                                                    transition: 'width 1s ease-out',
                                                                }} />
                                                            </div>
                                                            <span style={{ fontSize: 10, color: '#64748B', fontFamily: "'Outfit', sans-serif", fontWeight: 700, flexShrink: 0 }}>
                                                                {packAnalysis.aiAnalysis.confidence}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: 13, color: '#475569', fontFamily: "'Outfit', sans-serif", margin: 0, lineHeight: 1.7 }}>
                                                    {packAnalysis.aiAnalysis.summary}
                                                </p>
                                            </div>

                                            {/* Pros & Cons */}
                                            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                                                <div style={{
                                                    flex: 1, padding: '14px 16px', borderRadius: 16,
                                                    background: '#F0FDF4', border: '1.5px solid #BBF7D0',
                                                }}>
                                                    <div style={{ fontSize: 10, fontWeight: 800, color: '#059669', fontFamily: "'Outfit', sans-serif", marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        ✅ Points forts
                                                    </div>
                                                    {packAnalysis.aiAnalysis.pros.map((p, i) => (
                                                        <div key={i} style={{ fontSize: 12, color: '#1E293B', fontFamily: "'Outfit', sans-serif", marginBottom: 5, display: 'flex', gap: 6, alignItems: 'flex-start', lineHeight: 1.5 }}>
                                                            <span style={{ color: '#10B981', flexShrink: 0, fontSize: 10, marginTop: 2 }}>●</span> {p}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div style={{
                                                    flex: 1, padding: '14px 16px', borderRadius: 16,
                                                    background: '#FFF7ED', border: '1.5px solid #FED7AA',
                                                }}>
                                                    <div style={{ fontSize: 10, fontWeight: 800, color: '#C2410C', fontFamily: "'Outfit', sans-serif", marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        ⚠️ À considérer
                                                    </div>
                                                    {packAnalysis.aiAnalysis.cons.map((c, i) => (
                                                        <div key={i} style={{ fontSize: 12, color: '#1E293B', fontFamily: "'Outfit', sans-serif", marginBottom: 5, display: 'flex', gap: 6, alignItems: 'flex-start', lineHeight: 1.5 }}>
                                                            <span style={{ color: '#F59E0B', flexShrink: 0, fontSize: 10, marginTop: 2 }}>●</span> {c}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Hotel review + advice */}
                                            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                                                {packAnalysis.hotelHighlights.aiReview && (
                                                    <div style={{
                                                        flex: 2, padding: '14px 16px', borderRadius: 16,
                                                        background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                                                    }}>
                                                        <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', fontFamily: "'Outfit', sans-serif", letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' }}>
                                                            💬 Avis voyageurs
                                                        </div>
                                                        <p style={{ fontSize: 12, color: '#475569', fontFamily: "'Outfit', sans-serif", margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
                                                            &ldquo;{packAnalysis.hotelHighlights.aiReview}&rdquo;
                                                        </p>
                                                    </div>
                                                )}
                                                {packAnalysis.aiAnalysis.bestTimeAdvice && (
                                                    <div style={{
                                                        flex: 1, padding: '14px 16px', borderRadius: 16,
                                                        background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', border: '1.5px solid #FDE68A',
                                                    }}>
                                                        <div style={{ fontSize: 10, fontWeight: 800, color: '#92400E', fontFamily: "'Outfit', sans-serif", letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' }}>
                                                            💡 Conseil
                                                        </div>
                                                        <p style={{ fontSize: 12, color: '#78350F', fontFamily: "'Outfit', sans-serif", margin: 0, lineHeight: 1.6 }}>
                                                            {packAnalysis.aiAnalysis.bestTimeAdvice}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* CTAs */}
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <a href={selectedFlight.bookingLink || `https://www.skyscanner.ca/transport/flights/yul/${code.toLowerCase()}/`}
                                            target="_blank" rel="noopener noreferrer"
                                            style={{
                                                flex: 1, textAlign: 'center', padding: '16px', borderRadius: 16,
                                                background: 'linear-gradient(135deg, #00B4D8, #0077B6)',
                                                color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                                                textDecoration: 'none',
                                                boxShadow: '0 6px 20px rgba(0,119,182,0.25)',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,119,182,0.35)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,119,182,0.25)'; }}
                                        >
                                            ✈️ Réserver le vol · {Math.round(selectedFlight.price)}$
                                        </a>
                                        {selectedHotel.bookingUrl && (
                                            <a href={selectedHotel.bookingUrl} target="_blank" rel="noopener noreferrer"
                                                style={{
                                                    flex: 1, textAlign: 'center', padding: '16px', borderRadius: 16,
                                                    background: 'linear-gradient(135deg, #FF6B35, #F7418F)',
                                                    color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                                                    textDecoration: 'none',
                                                    boxShadow: '0 6px 20px rgba(255,107,53,0.25)',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(255,107,53,0.35)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,107,53,0.25)'; }}
                                            >
                                                🏨 Réserver l&apos;hôtel · {Math.round(selectedHotel.pricePerNight * selectedNights)}$
                                            </a>
                                        )}
                                    </div>

                                    {/* Reset */}
                                    <div style={{ textAlign: 'center', marginTop: 14 }}>
                                        <button
                                            onClick={() => {
                                                setPackStep(1);
                                                setSelectedFlight(null);
                                                setSelectedHotel(null);
                                                setPackAnalysis(null);
                                            }}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                fontSize: 11, color: '#94A3B8', fontFamily: "'Outfit', sans-serif",
                                                fontWeight: 600, padding: 6,
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.color = '#0077B6'}
                                            onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
                                        >
                                            ↻ Recommencer un nouveau pack
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
