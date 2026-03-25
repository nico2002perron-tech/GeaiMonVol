import React from 'react';
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
    return (
        <DarkCard style={{ border: '1px solid rgba(255,215,0,0.15)' }}>
            <SectionHeader
                icon="🧳"
                title="Constructeur de Pack"
                subtitle={`Vol + Hôtel pour ${city} — ${isAllInclusive ? 'Tout-inclus' : 'Sur mesure'}`}
            />

            {/* ── Step indicator ── */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                {[
                    { n: 1, label: 'Vol', icon: '✈️' },
                    { n: 2, label: 'Hôtel', icon: '🏨' },
                ].map(s => {
                    const active = packStep >= s.n;
                    const current = packStep === s.n;
                    return (
                        <div key={s.n} style={{
                            flex: 1, padding: '10px 14px', borderRadius: 12, textAlign: 'center',
                            background: current ? 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(6,182,212,0.1))' : active ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                            border: current ? '2px solid #0EA5E9' : active ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.06)',
                            cursor: active && !current ? 'pointer' : 'default',
                            transition: 'all 0.3s',
                        }}
                        onClick={() => { if (s.n === 1 && packStep >= 1) { setPackStep(1); setSelectedHotel(null); setPackAnalysis(null); } }}
                        >
                            <div style={{ fontSize: 16 }}>{s.icon}</div>
                            <div style={{
                                fontSize: 11, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                                color: current ? '#0EA5E9' : active ? '#10B981' : 'rgba(255,255,255,0.3)',
                                marginTop: 2,
                            }}>
                                {selectedFlight && s.n === 1 ? `${Math.round(selectedFlight.price)}$` : selectedHotel && s.n === 2 ? `${Math.round(selectedHotel.pricePerNight)}$/n` : `Étape ${s.n}`}
                            </div>
                            <div style={{ fontSize: 9, color: active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)', fontFamily: "'Outfit', sans-serif" }}>
                                {s.label}
                            </div>
                        </div>
                    );
                })}
                {/* Combined total */}
                <div style={{
                    flex: 1, padding: '10px 14px', borderRadius: 12, textAlign: 'center',
                    background: combinedTotal ? 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,184,0,0.06))' : 'rgba(255,255,255,0.03)',
                    border: combinedTotal ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(255,255,255,0.06)',
                }}>
                    <div style={{ fontSize: 16 }}>💰</div>
                    <div style={{
                        fontSize: combinedTotal ? 13 : 11, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                        color: combinedTotal ? '#FFD700' : 'rgba(255,255,255,0.3)', marginTop: 2,
                    }}>
                        {combinedTotal ? `${combinedTotal}$` : '—'}
                    </div>
                    <div style={{ fontSize: 9, color: combinedTotal ? 'rgba(255,215,0,0.6)' : 'rgba(255,255,255,0.2)', fontFamily: "'Outfit', sans-serif" }}>
                        Total/pers.
                    </div>
                </div>
            </div>

            {/* ── STEP 0: CTA to start ── */}
            {packStep === 0 && flights.length > 0 && (
                <button
                    onClick={() => setPackStep(1)}
                    style={{
                        width: '100%', padding: '16px', borderRadius: 14, cursor: 'pointer',
                        background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)', border: 'none',
                        color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                        boxShadow: '0 4px 20px rgba(14,165,233,0.3)', transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Construire mon pack vol + hôtel →
                </button>
            )}

            {/* ── STEP 1: Flight selection ── */}
            {packStep >= 1 && (
                <div style={{ animation: 'destFadeIn 0.3s ease-out' }}>
                    <div style={{
                        fontSize: 13, fontWeight: 700, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif",
                        marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <span style={{
                            width: 22, height: 22, borderRadius: '50%', display: 'inline-flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                            background: selectedFlight ? '#10B981' : 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                            color: '#fff',
                        }}>{selectedFlight ? '✓' : '1'}</span>
                        {selectedFlight ? `Vol sélectionné — ${Math.round(selectedFlight.price)}$` : 'Choisis ton vol'}
                    </div>

                    {packStep === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
                            {sortedFlights.map((f, i) => {
                                const nights = f.tripNights || getTripNights(f.departureDate, f.returnDate);
                                const isSelected = selectedFlight === f;
                                return (
                                    <div key={`${f.departureDate}-${i}`}
                                        onClick={() => {
                                            setSelectedFlight(f);
                                            setSelectedHotel(null);
                                            setPackAnalysis(null);
                                            setPackStep(2);
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                                            background: isSelected ? 'rgba(14,165,233,0.1)' : i === 0 ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.03)',
                                            border: isSelected ? '2px solid #0EA5E9' : i === 0 ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.06)',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <div style={{ textAlign: 'center', minWidth: 52 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: "'Fredoka', sans-serif" }}>
                                                {formatDateFr(f.departureDate)}
                                            </div>
                                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>
                                                {nights > 0 ? `${nights} nuits` : ''}
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontFamily: "'Outfit', sans-serif" }}>
                                                {f.airline} · {f.stops === 0 ? 'Direct' : `${f.stops} escale${f.stops > 1 ? 's' : ''}`}
                                                {f.durationMinutes > 0 && <span style={{ color: 'rgba(255,255,255,0.35)' }}> · {formatDuration(f.durationMinutes)}</span>}
                                            </div>
                                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                                                {formatDateFr(f.departureDate)} → {formatDateFr(f.returnDate)}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: 17, fontWeight: 800, color: i === 0 ? '#10B981' : '#0EA5E9', fontFamily: "'Fredoka', sans-serif" }}>
                                                {Math.round(f.price)}$
                                            </div>
                                            {i === 0 && <div style={{ fontSize: 8, fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>Meilleur prix</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── STEP 2: Hotel selection ── */}
                    {packStep === 2 && selectedFlight && (
                        <div style={{ marginTop: 16, animation: 'destFadeIn 0.3s ease-out' }}>
                            <button onClick={() => { setPackStep(1); setSelectedHotel(null); setPackAnalysis(null); }}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                    fontSize: 11, color: '#0EA5E9', fontFamily: "'Outfit', sans-serif",
                                    fontWeight: 600, marginBottom: 12,
                                }}>
                                ← Changer de vol
                            </button>

                            <div style={{
                                fontSize: 13, fontWeight: 700, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif",
                                marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <span style={{
                                    width: 22, height: 22, borderRadius: '50%', display: 'inline-flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                                    background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)', color: '#fff',
                                }}>2</span>
                                Choisis ton hôtel
                            </div>

                            {hotelsLoading ? (
                                <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                                    Recherche d&apos;hôtels à {city}...
                                </div>
                            ) : hotels.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                                    Aucun hôtel disponible pour le moment.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {hotels.map((h, i) => {
                                        const isSelected = selectedHotel?.name === h.name;
                                        const isRec = recommendedHotel?.name === h.name;
                                        const ratingColor = h.rating >= 8.5 ? '#10B981' : h.rating >= 7 ? '#0EA5E9' : h.rating >= 5 ? '#F59E0B' : '#EF4444';
                                        const ratingLabel = h.rating >= 9 ? 'Exceptionnel' : h.rating >= 8 ? 'Excellent' : h.rating >= 7 ? 'Très bien' : h.rating >= 6 ? 'Bien' : 'Correct';

                                        return (
                                            <div key={h.name + i}
                                                onClick={() => { setSelectedHotel(h); setPackAnalysis(null); }}
                                                style={{
                                                    borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                                                    background: isSelected ? 'rgba(14,165,233,0.08)' : 'rgba(255,255,255,0.03)',
                                                    border: isSelected ? '2px solid #0EA5E9' : isRec ? '2px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {h.imageUrl && (
                                                    <div style={{ position: 'relative', height: 120, width: '100%' }}>
                                                        <div style={{
                                                            height: '100%', width: '100%',
                                                            backgroundImage: `url(${h.imageUrl})`,
                                                            backgroundSize: 'cover', backgroundPosition: 'center',
                                                        }} />
                                                        {isRec && (
                                                            <div style={{
                                                                position: 'absolute', top: 8, left: 8, padding: '3px 10px', borderRadius: 6,
                                                                background: 'linear-gradient(135deg, #FFB800, #FFD700)',
                                                                fontSize: 9, fontWeight: 800, color: '#5C4A00', fontFamily: "'Fredoka', sans-serif",
                                                            }}>
                                                                RECOMMANDÉ
                                                            </div>
                                                        )}
                                                        {isSelected && (
                                                            <div style={{
                                                                position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%',
                                                                background: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                color: '#fff', fontSize: 14, fontWeight: 800,
                                                            }}>✓</div>
                                                        )}
                                                    </div>
                                                )}

                                                <div style={{ padding: '12px 14px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: "'Fredoka', sans-serif", lineHeight: 1.3 }}>
                                                                {h.name}
                                                            </div>
                                                            {h.stars > 0 && (
                                                                <div style={{ fontSize: 11, color: '#FFD700', marginTop: 2 }}>
                                                                    {starRating(h.stars)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                            <div style={{ fontSize: 18, fontWeight: 800, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif" }}>
                                                                {Math.round(h.pricePerNight)}$
                                                            </div>
                                                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>/nuit</div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                        <div style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                                            padding: '5px 10px', borderRadius: 8,
                                                            background: `${ratingColor}15`, border: `1px solid ${ratingColor}30`,
                                                        }}>
                                                            <span style={{ fontSize: 15, fontWeight: 800, color: ratingColor, fontFamily: "'Fredoka', sans-serif" }}>
                                                                {h.rating.toFixed(1)}
                                                            </span>
                                                            <div>
                                                                <div style={{ fontSize: 10, fontWeight: 700, color: ratingColor, fontFamily: "'Outfit', sans-serif" }}>
                                                                    {ratingLabel}
                                                                </div>
                                                                {h.reviewCount > 0 && (
                                                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif" }}>
                                                                        {h.reviewCount.toLocaleString()} avis
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {h.isAllInclusive && (
                                                            <span style={{
                                                                padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700,
                                                                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                                                                color: '#10B981', fontFamily: "'Fredoka', sans-serif",
                                                            }}>TOUT-INCLUS</span>
                                                        )}
                                                    </div>

                                                    {h.amenities && h.amenities.length > 0 && (
                                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                            {h.amenities.slice(0, 6).map((a, j) => (
                                                                <span key={j} style={{
                                                                    padding: '2px 7px', borderRadius: 6, fontSize: 9,
                                                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                                                                    color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif",
                                                                }}>
                                                                    {AMENITY_ICONS[a] || '·'} {a}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {selectedFlight && (
                                                        <div style={{
                                                            marginTop: 8, padding: '8px 10px', borderRadius: 8,
                                                            background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.1)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        }}>
                                                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>
                                                                Vol + {selectedNights}n hôtel
                                                            </span>
                                                            <span style={{ fontSize: 14, fontWeight: 800, color: '#FFD700', fontFamily: "'Fredoka', sans-serif" }}>
                                                                {Math.round(selectedFlight.price + h.pricePerNight * selectedNights)}$ /pers.
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ── Pack Summary (when both selected) ── */}
                            {selectedFlight && selectedHotel && (
                                <div style={{
                                    marginTop: 16, padding: '18px', borderRadius: 16,
                                    background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,184,0,0.04))',
                                    border: '1px solid rgba(255,215,0,0.2)',
                                }}>
                                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                                        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,215,0,0.6)', fontFamily: "'Outfit', sans-serif", letterSpacing: 1, textTransform: 'uppercase' }}>
                                            TON PACK {isAllInclusive ? 'TOUT-INCLUS' : 'SUR MESURE'}
                                        </div>
                                        <div style={{ fontSize: 34, fontWeight: 800, color: '#FFD700', fontFamily: "'Fredoka', sans-serif", marginTop: 4 }}>
                                            {combinedTotal}$ <span style={{ fontSize: 14, color: 'rgba(255,215,0,0.5)' }}>/pers.</span>
                                        </div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", marginTop: 4 }}>
                                            ✈️ {selectedFlight.airline} · {Math.round(selectedFlight.price)}$ &nbsp;+&nbsp; 🏨 {selectedHotel.name} · {Math.round(selectedHotel.pricePerNight * selectedNights)}$ ({selectedNights}n)
                                        </div>
                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit', sans-serif", marginTop: 4 }}>
                                            {formatDateFr(selectedFlight.departureDate)} → {formatDateFr(selectedFlight.returnDate)}
                                        </div>
                                    </div>

                                    {analysisLoading && (
                                        <div style={{ textAlign: 'center', padding: '12px', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: "'Outfit', sans-serif" }}>
                                            <img src="/logo_geai.png" alt="" width={20} height={20} style={{ borderRadius: '50%', verticalAlign: 'middle', marginRight: 6 }} />
                                            GeAI analyse ton pack...
                                        </div>
                                    )}
                                    {packAnalysis && (
                                        <div style={{ marginTop: 12 }}>
                                            <div style={{
                                                padding: '12px 14px', borderRadius: 12, marginBottom: 10,
                                                background: packAnalysis.aiAnalysis.verdict === 'achete' ? 'rgba(16,185,129,0.1)' : packAnalysis.aiAnalysis.verdict === 'attends' ? 'rgba(245,158,11,0.1)' : 'rgba(14,165,233,0.08)',
                                                border: `1px solid ${packAnalysis.aiAnalysis.verdict === 'achete' ? 'rgba(16,185,129,0.2)' : packAnalysis.aiAnalysis.verdict === 'attends' ? 'rgba(245,158,11,0.2)' : 'rgba(14,165,233,0.15)'}`,
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                    <span style={{ fontSize: 22 }}>
                                                        {packAnalysis.aiAnalysis.verdict === 'achete' ? '🔥' : packAnalysis.aiAnalysis.verdict === 'attends' ? '⏳' : '👍'}
                                                    </span>
                                                    <div style={{
                                                        fontSize: 14, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                                        color: packAnalysis.aiAnalysis.verdict === 'achete' ? '#10B981' : packAnalysis.aiAnalysis.verdict === 'attends' ? '#F59E0B' : '#0EA5E9',
                                                    }}>
                                                        {packAnalysis.aiAnalysis.verdict === 'achete' ? 'Achète maintenant!' : packAnalysis.aiAnalysis.verdict === 'attends' ? 'Attends un peu' : 'Bon deal!'}
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif", margin: 0, lineHeight: 1.5 }}>
                                                    {packAnalysis.aiAnalysis.summary}
                                                </p>
                                            </div>

                                            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                                <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                                                    {packAnalysis.aiAnalysis.pros.map((p, i) => (
                                                        <div key={i} style={{ fontSize: 11, color: '#10B981', fontFamily: "'Outfit', sans-serif", marginBottom: 3, display: 'flex', gap: 4 }}>
                                                            <span>✅</span> {p}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.08)' }}>
                                                    {packAnalysis.aiAnalysis.cons.map((c, i) => (
                                                        <div key={i} style={{ fontSize: 11, color: '#EF4444', fontFamily: "'Outfit', sans-serif", marginBottom: 3, display: 'flex', gap: 4 }}>
                                                            <span>⚠️</span> {c}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {packAnalysis.hotelHighlights.aiReview && (
                                                <div style={{
                                                    padding: '10px 12px', borderRadius: 10,
                                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                                    marginBottom: 10,
                                                }}>
                                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' }}>
                                                        Avis voyageurs
                                                    </div>
                                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif", margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                                                        &ldquo;{packAnalysis.hotelHighlights.aiReview}&rdquo;
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                        <a href={selectedFlight.bookingLink || `https://www.skyscanner.ca/transport/flights/yul/${code.toLowerCase()}/`}
                                            target="_blank" rel="noopener noreferrer"
                                            style={{
                                                flex: 1, textAlign: 'center', padding: '12px', borderRadius: 12,
                                                background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                                color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                                                textDecoration: 'none',
                                            }}>
                                            ✈️ Réserver le vol
                                        </a>
                                        {selectedHotel.bookingUrl && (
                                            <a href={selectedHotel.bookingUrl} target="_blank" rel="noopener noreferrer"
                                                style={{
                                                    flex: 1, textAlign: 'center', padding: '12px', borderRadius: 12,
                                                    background: 'linear-gradient(135deg, #FFB800, #FFD700)',
                                                    color: '#5C4A00', fontSize: 12, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                                                    textDecoration: 'none',
                                                }}>
                                                🏨 Réserver l&apos;hôtel
                                            </a>
                                        )}
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
