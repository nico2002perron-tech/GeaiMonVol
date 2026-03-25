import React from 'react';
import { DarkCard, SectionHeader } from './ui';

interface PriceInsightsCardProps {
    priceInsights: {
        lowest_price: number;
        price_level: 'low' | 'typical' | 'high';
        typical_price_range: [number, number];
    } | null;
    insightsLoading: boolean;
}

export default function PriceInsightsCard({ priceInsights, insightsLoading }: PriceInsightsCardProps) {
    return (
        <DarkCard>
            <SectionHeader icon="📊" title="Analyse Google Flights" subtitle="6-12 mois d'historique" />
            {insightsLoading ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: "'Outfit', sans-serif" }}>Chargement...</div>
            ) : priceInsights && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{
                        flex: '1 1 200px', padding: '14px 16px', borderRadius: 14,
                        background: priceInsights.price_level === 'low' ? 'rgba(16,185,129,0.1)' : priceInsights.price_level === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                        border: `1px solid ${priceInsights.price_level === 'low' ? 'rgba(16,185,129,0.2)' : priceInsights.price_level === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Niveau actuel</div>
                        <div style={{
                            fontSize: 22, fontWeight: 800, fontFamily: "'Fredoka', sans-serif", marginTop: 6,
                            color: priceInsights.price_level === 'low' ? '#10B981' : priceInsights.price_level === 'high' ? '#EF4444' : '#F59E0B',
                        }}>
                            {priceInsights.price_level === 'low' ? 'Bas' : priceInsights.price_level === 'high' ? 'Élevé' : 'Normal'}
                        </div>
                    </div>
                    <div style={{
                        flex: '1 1 200px', padding: '14px 16px', borderRadius: 14,
                        background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)',
                    }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Fourchette typique</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
                            <span style={{ fontSize: 22, fontWeight: 800, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif" }}>{Math.round(priceInsights.typical_price_range[0])}$</span>
                            <span style={{ color: 'rgba(255,255,255,0.35)' }}>—</span>
                            <span style={{ fontSize: 22, fontWeight: 800, color: '#0EA5E9', fontFamily: "'Fredoka', sans-serif" }}>{Math.round(priceInsights.typical_price_range[1])}$</span>
                        </div>
                    </div>
                </div>
            )}
        </DarkCard>
    );
}
