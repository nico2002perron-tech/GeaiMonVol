import React from 'react';
import { DarkCard, SectionHeader } from './ui';
import { MonthStats } from './types';
import { MONTHS_FR } from './helpers';

interface MonthlyComparisonProps {
    monthlyData: { months: MonthStats[]; totalDataPoints: number } | null;
    monthlyLoading: boolean;
}

export default function MonthlyComparison({ monthlyData, monthlyLoading }: MonthlyComparisonProps) {
    return (
        <DarkCard>
            <SectionHeader icon="📅" title="Prix par mois" subtitle="Dernière année" />
            {monthlyLoading ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Analyse...</div>
            ) : monthlyData && (() => {
                const withData = monthlyData.months.filter(m => m.count > 0);
                if (withData.length < 2) return <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Pas assez de données.</div>;
                const cheapest = withData.reduce((a, b) => a.median < b.median ? a : b);
                const maxMedian = Math.max(...withData.map(m => m.median));
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {monthlyData.months.map((m, i) => {
                            if (m.count === 0) return null;
                            const barW = maxMedian > 0 ? (m.median / maxMedian) * 100 : 0;
                            const isCheap = m.month === cheapest.month;
                            return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 36, textAlign: 'right', fontSize: 11, fontWeight: 700, color: isCheap ? '#10B981' : 'rgba(255,255,255,0.5)', fontFamily: "'Outfit', sans-serif" }}>
                                        {MONTHS_FR[m.month]}
                                    </div>
                                    <div style={{ flex: 1, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.03)', overflow: 'hidden', position: 'relative' }}>
                                        <div style={{
                                            height: '100%', borderRadius: 6, width: `${barW}%`,
                                            background: isCheap ? 'linear-gradient(90deg, rgba(16,185,129,0.25), rgba(16,185,129,0.5))' : 'linear-gradient(90deg, rgba(14,165,233,0.15), rgba(14,165,233,0.35))',
                                            transition: 'width 0.5s',
                                        }} />
                                        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", color: isCheap ? '#10B981' : 'rgba(255,255,255,0.5)' }}>
                                            {Math.round(m.median)}$
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })()}
        </DarkCard>
    );
}
