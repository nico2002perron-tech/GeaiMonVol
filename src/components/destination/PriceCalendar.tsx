'use client';

import { useState, useMemo } from 'react';

interface CalendarDate {
    price: number;
    airline: string;
    stops: number;
    returnDate: string | null;
}

interface PriceCalendarProps {
    dates: Record<string, CalendarDate>;
    destinationCode: string;
}

const MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function getPriceColor(price: number, minPrice: number, maxPrice: number): { text: string; bg: string; border: string } {
    if (maxPrice === minPrice) return { text: '#059669', bg: '#DCFCE7', border: '#86EFAC' };
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    if (ratio < 0.25) return { text: '#059669', bg: '#DCFCE7', border: '#86EFAC' };
    if (ratio < 0.5)  return { text: '#65A30D', bg: '#ECFCCB', border: '#BEF264' };
    if (ratio < 0.75) return { text: '#D97706', bg: '#FEF3C7', border: '#FCD34D' };
    return { text: '#DC2626', bg: '#FEE2E2', border: '#FCA5A5' };
}

export default function PriceCalendar({ dates, destinationCode }: PriceCalendarProps) {
    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(now.getMonth());
    const [currentYear, setCurrentYear] = useState(now.getFullYear());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const allPrices = useMemo(() => Object.values(dates).map(d => d.price), [dates]);
    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
    const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 1;

    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startPad = firstDay.getDay();

        const days: Array<{ date: string; day: number; info: CalendarDate | null; isPast: boolean }> = [];

        for (let i = 0; i < startPad; i++) {
            days.push({ date: '', day: 0, info: null, isPast: true });
        }

        const today = new Date().toISOString().split('T')[0];

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const info = dates[dateStr] || null;
            const isPast = dateStr < today;
            days.push({ date: dateStr, day: d, info, isPast });
        }

        return days;
    }, [currentYear, currentMonth, dates]);

    const goToPrevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else setCurrentMonth(m => m - 1);
    };
    const goToNextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else setCurrentMonth(m => m + 1);
    };

    // Count prices in current month
    const monthPriceCount = calendarDays.filter(d => d.info && !d.isPast).length;
    const monthCheapest = calendarDays.filter(d => d.info && !d.isPast).reduce((best, d) => {
        if (!best || (d.info && d.info.price < best.price)) return d.info!;
        return best;
    }, null as CalendarDate | null);

    const selectedInfo = selectedDate ? dates[selectedDate] : null;
    const isLowest = selectedInfo && selectedInfo.price === minPrice;

    return (
        <div>
            {/* Title */}
            <div style={{
                fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: "'Fredoka', sans-serif",
                marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10,
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #00B4D8, #0077B6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, boxShadow: '0 3px 12px rgba(0,180,216,0.25)',
                }}>📅</div>
                <div>
                    <div>Calendrier des prix</div>
                    <div style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>
                        Clique sur une date pour voir les détails
                    </div>
                </div>
            </div>

            <div style={{
                background: '#fff', borderRadius: 20, overflow: 'hidden',
                border: '2px solid #E0F2FE',
                boxShadow: '0 4px 20px rgba(0,119,182,0.06)',
            }}>
                {/* Month nav */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: 'linear-gradient(135deg, #F0F9FF, #EFF6FF)',
                    borderBottom: '1.5px solid #BAE6FD',
                }}>
                    <button onClick={goToPrevMonth} style={{
                        background: '#fff', border: '1.5px solid #BAE6FD', borderRadius: 10,
                        padding: '8px 14px', cursor: 'pointer', fontSize: 16, color: '#0077B6',
                        fontWeight: 700, transition: 'all 0.2s',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >←</button>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', fontFamily: "'Fredoka', sans-serif" }}>
                            {MONTH_NAMES[currentMonth]} {currentYear}
                        </div>
                        {monthPriceCount > 0 && monthCheapest && (
                            <div style={{ fontSize: 11, color: '#059669', fontFamily: "'Outfit', sans-serif", fontWeight: 700, marginTop: 2 }}>
                                {monthPriceCount} prix · dès {Math.round(monthCheapest.price)}$
                            </div>
                        )}
                    </div>

                    <button onClick={goToNextMonth} style={{
                        background: '#fff', border: '1.5px solid #BAE6FD', borderRadius: 10,
                        padding: '8px 14px', cursor: 'pointer', fontSize: 16, color: '#0077B6',
                        fontWeight: 700, transition: 'all 0.2s',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >→</button>
                </div>

                {/* Day headers */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                    padding: '12px 12px 4px',
                }}>
                    {DAY_NAMES.map(d => (
                        <div key={d} style={{
                            textAlign: 'center', fontSize: 12, fontWeight: 700,
                            color: '#64748B', fontFamily: "'Outfit', sans-serif",
                            padding: '6px 0',
                        }}>
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 4, padding: '4px 12px 12px',
                }}>
                    {calendarDays.map((cell, i) => {
                        if (!cell.date) return <div key={`pad-${i}`} />;

                        const hasPrice = cell.info !== null;
                        const isSelected = cell.date === selectedDate;
                        const isToday = cell.date === new Date().toISOString().split('T')[0];
                        const isCheapestDay = hasPrice && cell.info!.price === minPrice;
                        const colors = hasPrice ? getPriceColor(cell.info!.price, minPrice, maxPrice) : null;

                        return (
                            <button
                                key={cell.date}
                                onClick={() => hasPrice && !cell.isPast ? setSelectedDate(cell.date) : null}
                                style={{
                                    position: 'relative',
                                    padding: '8px 4px',
                                    borderRadius: 12,
                                    border: isSelected ? '2.5px solid #0077B6' : isToday ? '2px solid #BAE6FD' : isCheapestDay && !cell.isPast ? `2px solid ${colors!.border}` : '1.5px solid transparent',
                                    background: hasPrice && !cell.isPast ? colors!.bg : isToday ? '#F8FAFC' : 'transparent',
                                    cursor: hasPrice && !cell.isPast ? 'pointer' : 'default',
                                    opacity: cell.isPast ? 0.25 : 1,
                                    textAlign: 'center',
                                    minHeight: 64,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', gap: 2,
                                    transition: 'all 0.15s',
                                    boxShadow: isSelected ? '0 2px 10px rgba(0,119,182,0.15)' : hasPrice && !cell.isPast ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                                }}
                                onMouseEnter={e => { if (hasPrice && !cell.isPast && !isSelected) e.currentTarget.style.transform = 'scale(1.05)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                {/* Cheapest badge */}
                                {isCheapestDay && !cell.isPast && (
                                    <div style={{
                                        position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
                                        padding: '1px 6px', borderRadius: 6,
                                        background: '#059669', color: '#fff',
                                        fontSize: 7, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                        whiteSpace: 'nowrap', letterSpacing: 0.3,
                                    }}>
                                        DEAL
                                    </div>
                                )}

                                <span style={{
                                    fontSize: 14, fontWeight: 700,
                                    color: isSelected ? '#0077B6' : '#1E293B',
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    {cell.day}
                                </span>
                                {hasPrice && !cell.isPast && (
                                    <span style={{
                                        fontSize: 12, fontWeight: 800,
                                        color: colors!.text,
                                        fontFamily: "'Fredoka', sans-serif",
                                        lineHeight: 1,
                                    }}>
                                        {Math.round(cell.info!.price)}$
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Selected date detail */}
                {selectedInfo && selectedDate && (
                    <div style={{
                        padding: '16px 20px', margin: '0 12px 12px',
                        borderRadius: 14,
                        background: isLowest ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' : 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                        border: isLowest ? '1.5px solid #6EE7B7' : '1.5px solid #93C5FD',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: 10,
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    fontSize: 22, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                    color: isLowest ? '#059669' : '#0077B6',
                                }}>
                                    {Math.round(selectedInfo.price)}$
                                </span>
                                {isLowest && (
                                    <span style={{
                                        padding: '3px 8px', borderRadius: 6,
                                        background: '#059669', color: '#fff',
                                        fontSize: 9, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                    }}>MEILLEUR PRIX</span>
                                )}
                            </div>
                            <div style={{ fontSize: 13, color: '#475569', fontFamily: "'Outfit', sans-serif", fontWeight: 600, marginTop: 4 }}>
                                📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                                ✈️ {selectedInfo.airline}
                                {selectedInfo.stops === 0 ? ' · Direct ✓' : selectedInfo.stops > 0 ? ` · ${selectedInfo.stops} escale${selectedInfo.stops > 1 ? 's' : ''}` : ''}
                                {selectedInfo.returnDate && ` · Retour ${new Date(selectedInfo.returnDate + 'T00:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}`}
                            </div>
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: 16,
                    padding: '10px 20px 14px',
                }}>
                    {[
                        { color: '#059669', bg: '#DCFCE7', label: 'Bon prix' },
                        { color: '#65A30D', bg: '#ECFCCB', label: 'Moyen' },
                        { color: '#D97706', bg: '#FEF3C7', label: 'Élevé' },
                        { color: '#DC2626', bg: '#FEE2E2', label: 'Cher' },
                    ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 4, background: item.bg, border: `1.5px solid ${item.color}40` }} />
                            <span style={{ fontSize: 11, color: '#64748B', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
