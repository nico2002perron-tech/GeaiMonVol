'use client';

import React from 'react';

export interface AIAnalysis {
    verdict: 'ACHETER' | 'SURVEILLER' | 'ATTENDRE' | 'URGENT';
    verdictEmoji: string;
    confiance: number;
    resume: string;
    analyse_prix: {
        position: 'bas' | 'normal' | 'eleve';
        vs_moyenne: string;
        vs_plus_bas: string;
        percentile: string;
    };
    tendance: {
        direction: 'baisse' | 'stable' | 'hausse';
        description: string;
        momentum: string;
    };
    saisonnalite: {
        mois_actuel: string;
        meilleur_mois: string;
        pire_mois: string;
        conseil: string;
    };
    recommandation: {
        action: string;
        raison_principale: string;
        economie_potentielle: string;
        fenetre_optimale: string;
    };
    risques: Array<{
        type: string;
        description: string;
        probabilite: 'faible' | 'moyenne' | 'elevee';
    }>;
    points_cles: Array<{
        icon: string;
        titre: string;
        detail: string;
        impact: 'positif' | 'negatif' | 'neutre';
    }>;
    conseil_agent: string;
    note_donnees: string;
    _meta?: {
        destination: string;
        code: string;
        currentPrice: number;
        dataPoints: number;
        generatedAt: string;
    };
}

interface AIAnalysisCardProps {
    analysis: AIAnalysis | null;
    loading: boolean;
    city: string;
}

const VERDICT_CONFIG = {
    URGENT: {
        gradient: 'linear-gradient(135deg, #7C3AED, #6D28D9, #5B21B6)',
        bg: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)',
        border: '#C4B5FD',
        color: '#6D28D9',
        label: 'OPPORTUNITÉ RARE',
        badge: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    },
    ACHETER: {
        gradient: 'linear-gradient(135deg, #059669, #047857, #065F46)',
        bg: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
        border: '#6EE7B7',
        color: '#059669',
        label: 'BON MOMENT',
        badge: 'linear-gradient(135deg, #10B981, #059669)',
    },
    SURVEILLER: {
        gradient: 'linear-gradient(135deg, #0077B6, #0369A1, #075985)',
        bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
        border: '#93C5FD',
        color: '#0077B6',
        label: 'À SURVEILLER',
        badge: 'linear-gradient(135deg, #3B82F6, #0077B6)',
    },
    ATTENDRE: {
        gradient: 'linear-gradient(135deg, #D97706, #B45309, #92400E)',
        bg: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
        border: '#FCD34D',
        color: '#D97706',
        label: 'PATIENCE',
        badge: 'linear-gradient(135deg, #F59E0B, #D97706)',
    },
};

const TREND_ICONS: Record<string, string> = {
    baisse: '📉',
    stable: '➡️',
    hausse: '📈',
};

const RISK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    faible: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
    moyenne: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
    elevee: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
};

const IMPACT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    positif: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
    negatif: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
    neutre: { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' },
};

export default function AIAnalysisCard({ analysis, loading, city }: AIAnalysisCardProps) {
    if (loading) {
        return (
            <div style={{
                background: '#fff', borderRadius: 20, border: '2px solid #E0F2FE',
                padding: '40px 24px', textAlign: 'center', marginBottom: 24,
                boxShadow: '0 4px 20px rgba(0,119,182,0.06)',
            }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
                <div style={{
                    fontSize: 15, fontWeight: 700, color: '#0077B6',
                    fontFamily: "'Fredoka', sans-serif", marginBottom: 6,
                }}>Votre agent analyse les données...</div>
                <div style={{
                    fontSize: 12, color: '#94A3B8', fontFamily: "'Outfit', sans-serif",
                }}>Analyse de {city} en cours — scans, tendances, saisonnalité</div>
                <div style={{
                    margin: '16px auto 0', width: 120, height: 4, borderRadius: 2,
                    background: '#E0F2FE', overflow: 'hidden',
                }}>
                    <div style={{
                        width: '40%', height: '100%', borderRadius: 2,
                        background: 'linear-gradient(90deg, #00B4D8, #0077B6)',
                        animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                </div>
            </div>
        );
    }

    if (!analysis) return null;

    const config = VERDICT_CONFIG[analysis.verdict] || VERDICT_CONFIG.SURVEILLER;

    return (
        <div style={{ marginBottom: 24 }}>
            {/* ═══ HEADER ═══ */}
            <div style={{
                fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: "'Fredoka', sans-serif",
                marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10,
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: config.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, boxShadow: `0 3px 12px ${config.color}40`,
                }}>🤖</div>
                <div>
                    <div>Analyse IA — Agent de voyage</div>
                    <div style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', fontFamily: "'Outfit', sans-serif" }}>
                        Recommandation basée sur {analysis.note_donnees || 'les données de scans'}
                    </div>
                </div>
            </div>

            <div style={{
                background: '#fff', borderRadius: 20, overflow: 'hidden',
                border: '2px solid #E0F2FE',
                boxShadow: '0 4px 20px rgba(0,119,182,0.06)',
            }}>
                {/* ═══ VERDICT HERO ═══ */}
                <div style={{
                    background: config.gradient,
                    padding: '24px 20px',
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Decorative circles */}
                    <div style={{
                        position: 'absolute', top: -30, right: -30,
                        width: 100, height: 100, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: -20, left: -20,
                        width: 70, height: 70, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.05)',
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <span style={{ fontSize: 36, lineHeight: 1 }}>{analysis.verdictEmoji || '🤖'}</span>
                            <div>
                                <div style={{
                                    display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)',
                                    fontSize: 10, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                    letterSpacing: 1, marginBottom: 6,
                                }}>{config.label}</div>
                                <div style={{
                                    fontSize: 20, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                    lineHeight: 1.3,
                                }}>{analysis.recommandation?.action || analysis.resume}</div>
                            </div>
                        </div>

                        <div style={{
                            fontSize: 13, fontWeight: 500, fontFamily: "'Outfit', sans-serif",
                            lineHeight: 1.6, opacity: 0.9,
                        }}>{analysis.resume}</div>

                        {/* Confidence bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
                            <div style={{
                                flex: 1, height: 6, borderRadius: 3,
                                background: 'rgba(255,255,255,0.15)',
                            }}>
                                <div style={{
                                    width: `${Math.min(100, analysis.confiance || 50)}%`,
                                    height: '100%', borderRadius: 3,
                                    background: 'rgba(255,255,255,0.7)',
                                    transition: 'width 0.5s',
                                }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Fredoka', sans-serif" }}>
                                {analysis.confiance || 50}% confiance
                            </span>
                        </div>
                    </div>
                </div>

                {/* ═══ ANALYSE PRIX + TENDANCE ═══ */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 12, padding: '16px 16px 0',
                }}>
                    {/* Prix */}
                    <div style={{
                        background: config.bg, borderRadius: 14,
                        border: `1.5px solid ${config.border}`,
                        padding: '14px 16px',
                    }}>
                        <div style={{
                            fontSize: 10, fontWeight: 700, color: config.color,
                            fontFamily: "'Fredoka', sans-serif", letterSpacing: 0.5,
                            marginBottom: 8, textTransform: 'uppercase',
                        }}>Position du prix</div>
                        <div style={{
                            fontSize: 12, fontWeight: 600, color: '#334155',
                            fontFamily: "'Outfit', sans-serif", lineHeight: 1.5,
                        }}>
                            {analysis.analyse_prix?.vs_moyenne}
                        </div>
                        <div style={{
                            fontSize: 11, color: '#64748B', fontFamily: "'Outfit', sans-serif",
                            marginTop: 4,
                        }}>
                            {analysis.analyse_prix?.percentile}
                        </div>
                    </div>

                    {/* Tendance */}
                    <div style={{
                        background: analysis.tendance?.direction === 'baisse' ? '#ECFDF5' : analysis.tendance?.direction === 'hausse' ? '#FEF2F2' : '#F8FAFC',
                        borderRadius: 14,
                        border: `1.5px solid ${analysis.tendance?.direction === 'baisse' ? '#A7F3D0' : analysis.tendance?.direction === 'hausse' ? '#FECACA' : '#E2E8F0'}`,
                        padding: '14px 16px',
                    }}>
                        <div style={{
                            fontSize: 10, fontWeight: 700,
                            color: analysis.tendance?.direction === 'baisse' ? '#059669' : analysis.tendance?.direction === 'hausse' ? '#DC2626' : '#475569',
                            fontFamily: "'Fredoka', sans-serif", letterSpacing: 0.5,
                            marginBottom: 8, textTransform: 'uppercase',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <span>{TREND_ICONS[analysis.tendance?.direction || 'stable']}</span>
                            Tendance
                        </div>
                        <div style={{
                            fontSize: 12, fontWeight: 600, color: '#334155',
                            fontFamily: "'Outfit', sans-serif", lineHeight: 1.5,
                        }}>
                            {analysis.tendance?.description}
                        </div>
                    </div>
                </div>

                {/* ═══ POINTS CLÉS ═══ */}
                {analysis.points_cles && analysis.points_cles.length > 0 && (
                    <div style={{ padding: '16px 16px 0' }}>
                        <div style={{
                            fontSize: 12, fontWeight: 800, color: '#0F172A',
                            fontFamily: "'Fredoka', sans-serif", marginBottom: 10,
                        }}>Points clés de l'analyse</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {analysis.points_cles.map((pt, i) => {
                                const colors = IMPACT_COLORS[pt.impact] || IMPACT_COLORS.neutre;
                                return (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 10,
                                        padding: '12px 14px', borderRadius: 12,
                                        background: colors.bg,
                                        border: `1px solid ${colors.border}`,
                                    }}>
                                        <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{pt.icon}</span>
                                        <div>
                                            <div style={{
                                                fontSize: 12, fontWeight: 800, color: colors.text,
                                                fontFamily: "'Fredoka', sans-serif", marginBottom: 2,
                                            }}>{pt.titre}</div>
                                            <div style={{
                                                fontSize: 12, fontWeight: 500, color: '#475569',
                                                fontFamily: "'Outfit', sans-serif", lineHeight: 1.5,
                                            }}>{pt.detail}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ═══ SAISONNALITÉ ═══ */}
                {analysis.saisonnalite && (
                    <div style={{ padding: '16px 16px 0' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
                            border: '1.5px solid #FDBA74',
                            borderRadius: 14, padding: '14px 16px',
                        }}>
                            <div style={{
                                fontSize: 10, fontWeight: 700, color: '#C2410C',
                                fontFamily: "'Fredoka', sans-serif", letterSpacing: 0.5,
                                marginBottom: 8, textTransform: 'uppercase',
                            }}>📅 Saisonnalité</div>
                            <div style={{
                                fontSize: 12, fontWeight: 600, color: '#334155',
                                fontFamily: "'Outfit', sans-serif", lineHeight: 1.6,
                                marginBottom: 6,
                            }}>
                                {analysis.saisonnalite.mois_actuel}
                            </div>
                            <div style={{
                                display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8,
                            }}>
                                <div style={{
                                    padding: '6px 10px', borderRadius: 8,
                                    background: '#ECFDF5', border: '1px solid #A7F3D0',
                                    fontSize: 11, fontWeight: 600, color: '#059669',
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    ✅ {analysis.saisonnalite.meilleur_mois}
                                </div>
                                <div style={{
                                    padding: '6px 10px', borderRadius: 8,
                                    background: '#FEF2F2', border: '1px solid #FECACA',
                                    fontSize: 11, fontWeight: 600, color: '#DC2626',
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    ❌ {analysis.saisonnalite.pire_mois}
                                </div>
                            </div>
                            <div style={{
                                fontSize: 11, fontWeight: 600, color: '#92400E',
                                fontFamily: "'Outfit', sans-serif", marginTop: 8, lineHeight: 1.5,
                            }}>
                                💡 {analysis.saisonnalite.conseil}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ RISQUES ═══ */}
                {analysis.risques && analysis.risques.length > 0 && (
                    <div style={{ padding: '16px 16px 0' }}>
                        <div style={{
                            fontSize: 12, fontWeight: 800, color: '#0F172A',
                            fontFamily: "'Fredoka', sans-serif", marginBottom: 10,
                        }}>Risques à considérer</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {analysis.risques.map((risk, i) => {
                                const colors = RISK_COLORS[risk.probabilite] || RISK_COLORS.moyenne;
                                return (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 14px', borderRadius: 10,
                                        background: colors.bg,
                                        border: `1px solid ${colors.border}`,
                                    }}>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: 6,
                                            background: colors.text, color: '#fff',
                                            fontSize: 9, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                            textTransform: 'uppercase', flexShrink: 0,
                                        }}>{risk.probabilite}</span>
                                        <span style={{
                                            fontSize: 12, fontWeight: 500, color: '#334155',
                                            fontFamily: "'Outfit', sans-serif", lineHeight: 1.4,
                                        }}>{risk.description}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ═══ CONSEIL DE L'AGENT ═══ */}
                {analysis.conseil_agent && (
                    <div style={{ padding: '16px 16px 0' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)',
                            border: '2px solid #BAE6FD',
                            borderRadius: 16, padding: '18px 18px',
                            position: 'relative',
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                            }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 10,
                                    background: 'linear-gradient(135deg, #0077B6, #023E8A)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 16,
                                }}>✈️</div>
                                <div>
                                    <div style={{
                                        fontSize: 12, fontWeight: 800, color: '#0077B6',
                                        fontFamily: "'Fredoka', sans-serif",
                                    }}>Mot de votre agent GeAI</div>
                                    <div style={{
                                        fontSize: 9, fontWeight: 600, color: '#64748B',
                                        fontFamily: "'Outfit', sans-serif",
                                    }}>Conseil personnalisé basé sur les données</div>
                                </div>
                            </div>
                            <div style={{
                                fontSize: 13, fontWeight: 500, color: '#1E293B',
                                fontFamily: "'Outfit', sans-serif", lineHeight: 1.7,
                                fontStyle: 'italic',
                            }}>
                                "{analysis.conseil_agent}"
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ RECOMMANDATION FINALE ═══ */}
                {analysis.recommandation && (
                    <div style={{ padding: '16px' }}>
                        <div style={{
                            background: config.bg, borderRadius: 14,
                            border: `2px solid ${config.border}`,
                            padding: '16px 18px',
                            display: 'flex', flexDirection: 'column', gap: 8,
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <span style={{
                                    padding: '4px 10px', borderRadius: 8,
                                    background: config.badge, color: '#fff',
                                    fontSize: 11, fontWeight: 800, fontFamily: "'Fredoka', sans-serif",
                                }}>{analysis.verdict}</span>
                                <span style={{
                                    fontSize: 13, fontWeight: 700, color: config.color,
                                    fontFamily: "'Outfit', sans-serif",
                                }}>{analysis.recommandation.raison_principale}</span>
                            </div>
                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
                            }}>
                                <div style={{
                                    padding: '8px 12px', borderRadius: 10,
                                    background: '#fff', border: '1px solid #E2E8F0',
                                }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', fontFamily: "'Fredoka', sans-serif", textTransform: 'uppercase', marginBottom: 4 }}>
                                        Économie potentielle
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', fontFamily: "'Outfit', sans-serif" }}>
                                        {analysis.recommandation.economie_potentielle}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '8px 12px', borderRadius: 10,
                                    background: '#fff', border: '1px solid #E2E8F0',
                                }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', fontFamily: "'Fredoka', sans-serif", textTransform: 'uppercase', marginBottom: 4 }}>
                                        Fenêtre idéale
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0077B6', fontFamily: "'Outfit', sans-serif" }}>
                                        {analysis.recommandation.fenetre_optimale}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
