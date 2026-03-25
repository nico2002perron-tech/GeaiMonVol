import React from 'react';
import { DarkCard, SectionHeader } from './ui';
import { TravelIntel } from './types';

interface TravelIntelligenceProps {
    travelIntel: TravelIntel | null;
    intelLoading: boolean;
    city: string;
}

export default function TravelIntelligence({ travelIntel, intelLoading, city }: TravelIntelligenceProps) {
    return (
        <DarkCard style={{ border: '1px solid rgba(14,165,233,0.12)' }}>
            <SectionHeader
                icon="🧠"
                title="Intelligence Voyage GeAI"
                subtitle={`Tout ce que tu dois savoir sur ${city}`}
            />

            {intelLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <img src="/logo_geai.png" alt="" width={32} height={32} style={{ borderRadius: '50%', marginBottom: 8 }} />
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>
                        GeAI analyse {city} en profondeur...
                    </div>
                </div>
            ) : travelIntel && (
                <>
                    {/* ── Tagline + Score ── */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
                        padding: '14px 16px', borderRadius: 14,
                        background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(6,182,212,0.04))',
                        border: '1px solid rgba(14,165,233,0.15)',
                    }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                            background: `conic-gradient(${travelIntel.overallScore >= 75 ? '#10B981' : travelIntel.overallScore >= 50 ? '#F59E0B' : '#EF4444'} ${travelIntel.overallScore * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <div style={{
                                width: 46, height: 46, borderRadius: '50%', background: '#0F172A',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <span style={{
                                    fontSize: 20, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                    color: travelIntel.overallScore >= 75 ? '#10B981' : travelIntel.overallScore >= 50 ? '#F59E0B' : '#EF4444',
                                }}>{travelIntel.overallScore}</span>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: "'Fredoka', sans-serif", lineHeight: 1.3 }}>
                                {travelIntel.tagline}
                            </div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif", marginTop: 4 }}>
                                Score global basé sur météo, sécurité, budget et expérience
                            </div>
                        </div>
                    </div>

                    {/* ── Monthly Matrix ── */}
                    {travelIntel.monthlyMatrix && travelIntel.monthlyMatrix.length === 12 && (
                        <div style={{ marginBottom: 20, overflowX: 'auto' }}>
                            <div style={{
                                fontSize: 12, fontWeight: 700, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif",
                                marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                📊 Quand partir? — Matrice mensuelle
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(12, 1fr)', gap: '2px', minWidth: 600 }}>
                                <div style={{ padding: 4 }} />
                                {travelIntel.monthlyMatrix.map((m, i) => (
                                    <div key={i} style={{
                                        textAlign: 'center', padding: '6px 0', fontSize: 10, fontWeight: 700,
                                        color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif",
                                    }}>{m.month}</div>
                                ))}

                                {(['weather', 'crowd', 'price', 'overall'] as const).map(cat => {
                                    const labels = { weather: '☀️ Météo', crowd: '👥 Foule', price: '💰 Prix', overall: '⭐ Global' };
                                    const colors = { weather: '#F59E0B', crowd: '#818CF8', price: '#10B981', overall: '#0EA5E9' };
                                    return [
                                        <div key={`${cat}-label`} style={{
                                            padding: '6px 8px 6px 0', fontSize: 10, fontWeight: 700,
                                            color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif",
                                            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center',
                                        }}>{labels[cat]}</div>,
                                        ...travelIntel.monthlyMatrix.map((m, i) => {
                                            const val = m[cat];
                                            const opacity = val / 5;
                                            return (
                                                <div key={`${cat}-${i}`} style={{
                                                    textAlign: 'center', padding: '8px 2px', borderRadius: 6,
                                                    background: `${colors[cat]}${Math.round(opacity * 40).toString(16).padStart(2, '0')}`,
                                                    transition: 'background 0.3s',
                                                }}>
                                                    <span style={{
                                                        fontSize: 12, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                                        color: val >= 4 ? colors[cat] : val >= 3 ? `${colors[cat]}AA` : 'rgba(255,255,255,0.25)',
                                                    }}>{val}</span>
                                                </div>
                                            );
                                        }),
                                    ];
                                })}
                            </div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: "'Outfit', sans-serif", marginTop: 6, textAlign: 'center' }}>
                                5 = idéal · 1 = à éviter — Foule: 5 = calme · Prix: 5 = pas cher
                            </div>
                        </div>
                    )}

                    {/* ── Weather + Beach row ── */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                        <div style={{
                            flex: '1 1 220px', padding: '14px 16px', borderRadius: 14,
                            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)',
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', fontFamily: "'Fredoka', sans-serif", marginBottom: 8 }}>
                                ☀️ Météo & Saisons
                            </div>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif", margin: '0 0 8px', lineHeight: 1.5 }}>
                                {travelIntel.weather.summary}
                            </p>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                                {travelIntel.weather.bestMonths.map((m, i) => (
                                    <span key={i} style={{
                                        padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                                        background: 'rgba(16,185,129,0.1)', color: '#10B981', fontFamily: "'Outfit', sans-serif",
                                    }}>✓ {m}</span>
                                ))}
                            </div>
                            {travelIntel.weather.avoidMonths.length > 0 && (
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {travelIntel.weather.avoidMonths.map((m, i) => (
                                        <span key={i} style={{
                                            padding: '2px 6px', borderRadius: 6, fontSize: 9,
                                            background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontFamily: "'Outfit', sans-serif",
                                        }}>✗ {m}</span>
                                    ))}
                                </div>
                            )}
                            {travelIntel.weather.hurricaneRisk && (
                                <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)' }}>
                                    <span style={{ fontSize: 10, color: '#EF4444', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                                        🌀 {travelIntel.weather.hurricaneRisk}
                                    </span>
                                </div>
                            )}
                        </div>

                        {travelIntel.beach?.hasBeach && (
                            <div style={{
                                flex: '1 1 220px', padding: '14px 16px', borderRadius: 14,
                                background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.12)',
                            }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif", marginBottom: 8 }}>
                                    🏖️ Plage & Eau
                                </div>
                                {travelIntel.beach.algaeSeason && (
                                    <div style={{
                                        padding: '6px 10px', borderRadius: 8, marginBottom: 8,
                                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.12)',
                                    }}>
                                        <span style={{ fontSize: 10, color: '#F59E0B', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                                            🌿 Algues: {travelIntel.beach.algaeSeason}
                                        </span>
                                    </div>
                                )}
                                {travelIntel.beach.jellyfishRisk && (
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>
                                        🪼 Méduses: {travelIntel.beach.jellyfishRisk}
                                    </div>
                                )}
                                {travelIntel.beach.waterClarity && (
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", marginBottom: 6 }}>
                                        💧 Eau: {travelIntel.beach.waterClarity}
                                    </div>
                                )}
                                {travelIntel.beach.bestBeaches && travelIntel.beach.bestBeaches.length > 0 && (
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {travelIntel.beach.bestBeaches.map((b, i) => (
                                            <span key={i} style={{
                                                padding: '2px 8px', borderRadius: 6, fontSize: 9,
                                                background: 'rgba(14,165,233,0.08)', color: '#0EA5E9', fontFamily: "'Outfit', sans-serif",
                                            }}>🏝 {b}</span>
                                        ))}
                                    </div>
                                )}
                                {travelIntel.beach.tip && (
                                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", margin: '6px 0 0', fontStyle: 'italic' }}>
                                        💡 {travelIntel.beach.tip}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Budget + Practical row ── */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                        <div style={{
                            flex: '1 1 220px', padding: '14px 16px', borderRadius: 14,
                            background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)',
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', fontFamily: "'Fredoka', sans-serif", marginBottom: 10 }}>
                                💰 Budget quotidien (CAD)
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                                {[
                                    { label: 'Éco', value: travelIntel.budget.dailyBudgetLow, color: '#10B981' },
                                    { label: 'Confort', value: travelIntel.budget.dailyBudgetMid, color: '#0EA5E9' },
                                    { label: 'Luxe', value: travelIntel.budget.dailyBudgetHigh, color: '#FFD700' },
                                ].map((b, i) => (
                                    <div key={i} style={{
                                        flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 10,
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                    }}>
                                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>{b.label}</div>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: b.color, fontFamily: "'Fredoka', sans-serif" }}>{b.value}$</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6 }}>
                                🍽️ Repas: {travelIntel.budget.mealCheap} (éco) / {travelIntel.budget.mealMid} (resto)<br />
                                🍺 Bière: {travelIntel.budget.beerPrice}<br />
                                💱 {travelIntel.budget.exchangeInfo}<br />
                                💵 Pourboire: {travelIntel.budget.tipping}
                            </div>
                        </div>

                        <div style={{
                            flex: '1 1 220px', padding: '14px 16px', borderRadius: 14,
                            background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)',
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', fontFamily: "'Fredoka', sans-serif", marginBottom: 10 }}>
                                📋 Infos pratiques
                            </div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.8 }}>
                                🛂 Visa: {travelIntel.practical.visa}<br />
                                🛡️ Sécurité: {travelIntel.practical.safety} {'⭐'.repeat(travelIntel.practical.safetyScore)}<br />
                                🗣️ Langue: {travelIntel.practical.language}<br />
                                🇬🇧 Anglais: {travelIntel.practical.english}<br />
                                ⏰ {travelIntel.practical.timezone}<br />
                                🔌 {travelIntel.practical.plugType}<br />
                                📱 {travelIntel.practical.cellService}<br />
                                🚰 Eau: {travelIntel.practical.drinkingWater}<br />
                                ✈️ Vol: {travelIntel.practical.flightTime}
                                {travelIntel.practical.vaccines && <><br />💉 {travelIntel.practical.vaccines}</>}
                            </div>
                        </div>
                    </div>

                    {/* ── Food ── */}
                    {travelIntel.food && (
                        <div style={{
                            padding: '14px 16px', borderRadius: 14, marginBottom: 16,
                            background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)',
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', fontFamily: "'Fredoka', sans-serif", marginBottom: 10 }}>
                                🍽️ Gastronomie locale
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                                {travelIntel.food.mustTry.slice(0, 6).map((f, i) => (
                                    <div key={i} style={{
                                        flex: '1 1 150px', padding: '10px 12px', borderRadius: 10,
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                    }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: "'Fredoka', sans-serif" }}>{f.name}</div>
                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.4, marginTop: 2 }}>{f.description}</div>
                                        <div style={{ fontSize: 10, color: '#10B981', fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginTop: 3 }}>{f.price}</div>
                                    </div>
                                ))}
                            </div>
                            {travelIntel.food.bestFoodAreas.length > 0 && (
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif" }}>
                                    📍 Quartiers food: {travelIntel.food.bestFoodAreas.join(' · ')}
                                </div>
                            )}
                            {travelIntel.food.streetFood && (
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", marginTop: 4 }}>
                                    🥡 Street food: {travelIntel.food.streetFood}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Culture Do's & Don'ts ── */}
                    {travelIntel.culture && (
                        <div style={{
                            padding: '14px 16px', borderRadius: 14, marginBottom: 16,
                            background: 'rgba(129,140,248,0.04)', border: '1px solid rgba(129,140,248,0.1)',
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#818CF8', fontFamily: "'Fredoka', sans-serif", marginBottom: 10 }}>
                                🎭 Culture & Étiquette
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#10B981', fontFamily: "'Outfit', sans-serif", marginBottom: 4, textTransform: 'uppercase' }}>À faire</div>
                                    {travelIntel.culture.dos.map((d, i) => (
                                        <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: "'Outfit', sans-serif", marginBottom: 3 }}>
                                            ✅ {d}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', fontFamily: "'Outfit', sans-serif", marginBottom: 4, textTransform: 'uppercase' }}>À éviter</div>
                                    {travelIntel.culture.donts.map((d, i) => (
                                        <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: "'Outfit', sans-serif", marginBottom: 3 }}>
                                            ❌ {d}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.6 }}>
                                👔 {travelIntel.culture.dressCode}
                                {travelIntel.culture.bargaining && <><br />🤝 {travelIntel.culture.bargaining}</>}
                            </div>
                            {travelIntel.culture.festivals.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif", marginBottom: 4, textTransform: 'uppercase' }}>
                                        Festivals & événements
                                    </div>
                                    {travelIntel.culture.festivals.map((f, i) => (
                                        <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", marginBottom: 2 }}>
                                            🎉 {f}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Day Trips ── */}
                    {travelIntel.dayTrips && travelIntel.dayTrips.length > 0 && (
                        <div style={{
                            padding: '14px 16px', borderRadius: 14, marginBottom: 16,
                            background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.1)',
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif", marginBottom: 10 }}>
                                🗺️ Excursions à proximité
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {travelIntel.dayTrips.map((t, i) => (
                                    <div key={i} style={{
                                        display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 10,
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                    }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: "'Fredoka', sans-serif" }}>{t.name}</div>
                                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>{t.description}</div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: 10, color: '#0EA5E9', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{t.distance}</div>
                                            <div style={{ fontSize: 10, color: '#10B981', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>{t.cost}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Transport ── */}
                    {travelIntel.transportation && (
                        <div style={{
                            padding: '14px 16px', borderRadius: 14, marginBottom: 16,
                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontFamily: "'Fredoka', sans-serif", marginBottom: 8 }}>
                                🚕 Se déplacer
                            </div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.8 }}>
                                🛬 Aéroport → ville: {travelIntel.transportation.fromAirport}<br />
                                🚌 Transport local: {travelIntel.transportation.localTransport}<br />
                                📱 Uber/taxi: {travelIntel.transportation.uber}
                                {travelIntel.transportation.renting && <><br />🚗 Location: {travelIntel.transportation.renting}</>}
                            </div>
                        </div>
                    )}

                    {/* ── Pro Tips ── */}
                    {travelIntel.proTips && travelIntel.proTips.length > 0 && (
                        <div style={{
                            padding: '14px 16px', borderRadius: 14,
                            background: 'linear-gradient(135deg, rgba(255,215,0,0.06), rgba(255,184,0,0.03))',
                            border: '1px solid rgba(255,215,0,0.12)',
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#FFD700', fontFamily: "'Fredoka', sans-serif", marginBottom: 10 }}>
                                🏆 Conseils de pro
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {travelIntel.proTips.map((tip, i) => (
                                    <div key={i} style={{
                                        display: 'flex', gap: 8, alignItems: 'flex-start',
                                        padding: '8px 10px', borderRadius: 8,
                                        background: 'rgba(255,255,255,0.02)',
                                    }}>
                                        <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1.3 }}>💡</span>
                                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.5 }}>
                                            {tip}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </DarkCard>
    );
}
