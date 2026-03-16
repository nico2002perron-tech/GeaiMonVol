'use client';

interface BestMonthsProps {
    dates: Record<string, { price: number }>;
}

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function BestMonths({ dates }: BestMonthsProps) {
    // Aggregate average price per month
    const monthStats: Record<number, { sum: number; count: number }> = {};

    for (const [dateStr, info] of Object.entries(dates)) {
        const monthIdx = parseInt(dateStr.split('-')[1], 10) - 1;
        if (!monthStats[monthIdx]) monthStats[monthIdx] = { sum: 0, count: 0 };
        monthStats[monthIdx].sum += info.price;
        monthStats[monthIdx].count += 1;
    }

    const monthAvgs: Array<{ month: number; avg: number; count: number }> = [];
    for (let m = 0; m < 12; m++) {
        const stats = monthStats[m];
        if (stats && stats.count > 0) {
            monthAvgs.push({ month: m, avg: Math.round(stats.sum / stats.count), count: stats.count });
        }
    }

    if (monthAvgs.length === 0) return null;

    const maxAvg = Math.max(...monthAvgs.map(m => m.avg));
    const minAvg = Math.min(...monthAvgs.map(m => m.avg));

    function getBarColor(avg: number): string {
        if (maxAvg === minAvg) return '#10B981';
        const ratio = (avg - minAvg) / (maxAvg - minAvg);
        if (ratio < 0.3) return '#10B981';
        if (ratio < 0.6) return '#F59E0B';
        return '#EF4444';
    }

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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 20V10" />
                    <path d="M18 20V4" />
                    <path d="M6 20v-4" />
                </svg>
                Meilleurs mois pour partir
            </div>

            <div style={{
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                padding: '16px 12px',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: 4,
                    height: 100,
                }}>
                    {Array.from({ length: 12 }, (_, m) => {
                        const stat = monthAvgs.find(s => s.month === m);
                        const hasData = !!stat;
                        const barHeight = hasData
                            ? 20 + ((stat!.avg - minAvg) / (maxAvg - minAvg || 1)) * 70
                            : 10;

                        return (
                            <div
                                key={m}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    flex: 1,
                                    gap: 4,
                                }}
                                title={hasData ? `${MONTH_NAMES[m]}: ${stat!.avg} $ (${stat!.count} prix)` : `${MONTH_NAMES[m]}: aucune donnée`}
                            >
                                {hasData && (
                                    <span style={{
                                        fontSize: 8,
                                        fontWeight: 700,
                                        color: getBarColor(stat!.avg),
                                        fontFamily: "'Fredoka', sans-serif",
                                    }}>
                                        {stat!.avg}$
                                    </span>
                                )}
                                <div style={{
                                    width: '100%',
                                    maxWidth: 28,
                                    height: barHeight,
                                    borderRadius: '6px 6px 2px 2px',
                                    background: hasData ? getBarColor(stat!.avg) : '#E2E8F0',
                                    opacity: hasData ? 0.85 : 0.3,
                                    transition: 'height 0.3s ease',
                                }} />
                            </div>
                        );
                    })}
                </div>

                {/* Month labels */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 6,
                }}>
                    {MONTH_NAMES.map(name => (
                        <span key={name} style={{
                            fontSize: 9,
                            color: '#94A3B8',
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 600,
                            flex: 1,
                            textAlign: 'center',
                        }}>
                            {name}
                        </span>
                    ))}
                </div>

                {/* Legend */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 16,
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: '1px solid #F1F5F9',
                }}>
                    {[
                        { color: '#10B981', label: 'Bon prix' },
                        { color: '#F59E0B', label: 'Moyen' },
                        { color: '#EF4444', label: 'Élevé' },
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
