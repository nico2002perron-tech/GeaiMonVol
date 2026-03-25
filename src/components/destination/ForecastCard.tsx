import React from 'react';
import { DarkCard, SectionHeader } from './ui';
import { ForecastData } from './types';

interface ForecastCardProps {
    forecast: ForecastData | null;
    forecastLoading: boolean;
}

export default function ForecastCard({ forecast, forecastLoading }: ForecastCardProps) {
    return (
        <DarkCard>
            <SectionHeader icon="🔮" title="Pronostic IA" subtitle="Analyse prédictive basée sur l'historique" />
            {forecastLoading ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Analyse en cours...</div>
            ) : forecast?.pronostic && (
                <>
                    <div style={{
                        padding: '16px 18px', borderRadius: 14, marginBottom: 14,
                        background: forecast.verdict === 'BUY_NOW' ? 'rgba(16,185,129,0.12)' : forecast.verdict === 'WAIT' ? 'rgba(245,158,11,0.1)' : 'rgba(148,163,184,0.08)',
                        border: `1px solid ${forecast.verdict === 'BUY_NOW' ? 'rgba(16,185,129,0.25)' : forecast.verdict === 'WAIT' ? 'rgba(245,158,11,0.2)' : 'rgba(148,163,184,0.15)'}`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <span style={{ fontSize: 32, lineHeight: 1 }}>
                                {forecast.verdict === 'BUY_NOW' ? '🔥' : forecast.verdict === 'BUY_SOON' ? '👀' : forecast.verdict === 'WAIT' ? '⏳' : '👌'}
                            </span>
                            <div style={{
                                fontSize: 17, fontWeight: 800, lineHeight: 1.4, fontFamily: "'Fredoka', sans-serif",
                                color: forecast.verdict === 'BUY_NOW' ? '#10B981' : forecast.verdict === 'WAIT' ? '#F59E0B' : '#94A3B8',
                            }}>
                                {forecast.pronostic.verdictLine}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {forecast.pronostic.reasons.map((r, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10,
                                    background: 'rgba(255,255,255,0.03)',
                                    borderLeft: `3px solid ${r.impact === 'positive' ? 'rgba(16,185,129,0.5)' : r.impact === 'negative' ? 'rgba(239,68,68,0.4)' : 'rgba(148,163,184,0.3)'}`,
                                }}>
                                    <span style={{ fontSize: 18 }}>{r.icon}</span>
                                    <span style={{
                                        fontSize: 13, fontWeight: 600, lineHeight: 1.4, fontFamily: "'Outfit', sans-serif",
                                        color: r.impact === 'positive' ? '#10B981' : r.impact === 'negative' ? '#EF4444' : 'rgba(255,255,255,0.6)',
                                    }}>{r.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {forecast.optimalWindow && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 14px', borderRadius: 10,
                            background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.12)',
                        }}>
                            <span>🎯</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#FFD700', fontFamily: "'Outfit', sans-serif" }}>
                                Fenêtre optimale : {forecast.optimalWindow.label}
                            </span>
                        </div>
                    )}
                </>
            )}
        </DarkCard>
    );
}
