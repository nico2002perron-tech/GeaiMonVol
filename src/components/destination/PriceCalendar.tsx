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

function getPriceColor(price: number, minPrice: number, maxPrice: number): string {
    if (maxPrice === minPrice) return '#10B981';
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    if (ratio < 0.25) return '#10B981'; // green — cheap
    if (ratio < 0.5) return '#84CC16';  // lime
    if (ratio < 0.75) return '#F59E0B'; // amber
    return '#EF4444'; // red — expensive
}

export default function PriceCalendar({ dates, destinationCode }: PriceCalendarProps) {
    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(now.getMonth());
    const [currentYear, setCurrentYear] = useState(now.getFullYear());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Price range for color coding
    const allPrices = useMemo(() => Object.values(dates).map(d => d.price), [dates]);
    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
    const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 1;

    // Build calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startPad = firstDay.getDay(); // 0=Sun

        const days: Array<{ date: string; day: number; info: CalendarDate | null; isPast: boolean }> = [];

        // Padding
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
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(y => y - 1);
        } else {
            setCurrentMonth(m => m - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(y => y + 1);
        } else {
            setCurrentMonth(m => m + 1);
        }
    };

    const selectedInfo = selectedDate ? dates[selectedDate] : null;

    return (
        <div>
            <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#0F172A',
                fontFamily: "'Outfit', sans-serif",
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
            }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Calendrier des prix
            </div>

            <div style={{
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
            }}>
                {/* Month nav */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                }}>
                    <button
                        onClick={goToPrevMonth}
                        style={{
                            background: 'none',
                            border: '1px solid #E2E8F0',
                            borderRadius: 8,
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: 14,
                            color: '#475569',
                        }}
                    >
                        &larr;
                    </button>
                    <span style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#0F172A',
                        fontFamily: "'Fredoka', sans-serif",
                    }}>
                        {MONTH_NAMES[currentMonth]} {currentYear}
                    </span>
                    <button
                        onClick={goToNextMonth}
                        style={{
                            background: 'none',
                            border: '1px solid #E2E8F0',
                            borderRadius: 8,
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: 14,
                            color: '#475569',
                        }}
                    >
                        &rarr;
                    </button>
                </div>

                {/* Day headers */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    padding: '8px 8px 0',
                }}>
                    {DAY_NAMES.map(d => (
                        <div key={d} style={{
                            textAlign: 'center',
                            fontSize: 10,
                            fontWeight: 600,
                            color: '#94A3B8',
                            fontFamily: "'Outfit', sans-serif",
                            padding: '4px 0',
                        }}>
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 2,
                    padding: '4px 8px 8px',
                }}>
                    {calendarDays.map((cell, i) => {
                        if (!cell.date) {
                            return <div key={`pad-${i}`} />;
                        }

                        const hasPrice = cell.info !== null;
                        const isSelected = cell.date === selectedDate;
                        const isToday = cell.date === new Date().toISOString().split('T')[0];

                        return (
                            <button
                                key={cell.date}
                                onClick={() => hasPrice && !cell.isPast ? setSelectedDate(cell.date) : null}
                                style={{
                                    position: 'relative',
                                    padding: '6px 2px',
                                    borderRadius: 10,
                                    border: isSelected ? '2px solid #0EA5E9' : isToday ? '2px solid #CBD5E1' : '1px solid transparent',
                                    background: hasPrice && !cell.isPast
                                        ? `${getPriceColor(cell.info!.price, minPrice, maxPrice)}12`
                                        : 'transparent',
                                    cursor: hasPrice && !cell.isPast ? 'pointer' : 'default',
                                    opacity: cell.isPast ? 0.3 : 1,
                                    textAlign: 'center',
                                    minHeight: 48,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1,
                                    transition: 'all 0.15s',
                                }}
                            >
                                <span style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: isSelected ? '#0EA5E9' : '#475569',
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    {cell.day}
                                </span>
                                {hasPrice && !cell.isPast && (
                                    <span style={{
                                        fontSize: 9,
                                        fontWeight: 700,
                                        color: getPriceColor(cell.info!.price, minPrice, maxPrice),
                                        fontFamily: "'Fredoka', sans-serif",
                                    }}>
                                        {cell.info!.price}$
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Selected date detail */}
                {selectedInfo && selectedDate && (
                    <div style={{
                        padding: '12px 16px',
                        borderTop: '1px solid #E2E8F0',
                        background: '#F0F9FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 8,
                    }}>
                        <div>
                            <div style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#0F172A',
                                fontFamily: "'Fredoka', sans-serif",
                            }}>
                                {selectedInfo.price} $ — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}
                            </div>
                            <div style={{
                                fontSize: 11,
                                color: '#64748B',
                                fontFamily: "'Outfit', sans-serif",
                                marginTop: 2,
                            }}>
                                {selectedInfo.airline}{selectedInfo.stops === 0 ? ' · Direct' : selectedInfo.stops > 0 ? ` · ${selectedInfo.stops} escale${selectedInfo.stops > 1 ? 's' : ''}` : ''}
                                {selectedInfo.returnDate && ` · Retour ${new Date(selectedInfo.returnDate + 'T00:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}`}
                            </div>
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 12,
                    padding: '8px 16px 12px',
                    borderTop: selectedInfo ? 'none' : '1px solid #E2E8F0',
                }}>
                    {[
                        { color: '#10B981', label: 'Bon prix' },
                        { color: '#84CC16', label: 'Moyen' },
                        { color: '#F59E0B', label: 'Élevé' },
                        { color: '#EF4444', label: 'Cher' },
                    ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                            <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
