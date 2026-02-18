'use client';
import React from 'react';

const PILLARS = [
    {
        icon: '🛡️',
        title: 'Protection des données',
        desc: 'Nous n\'utilisons vos données que pour améliorer vos propres alertes. Vos informations de paiement sont gérées par Stripe.'
    },
    {
        icon: '🤖',
        title: 'Éthique IA',
        desc: 'Nos prix sont analysés en temps réel par des modèles entraînés sur des données publiques. Zéro manipulation, juste de l\'analyse.'
    },
    {
        icon: '🔎',
        title: 'Zéro commission',
        desc: 'Nous sommes payés par abonnement, pas par commission. Notre seul objectif est de vous trouver le prix le plus bas.'
    }
];

export default function TransparenceSection() {
    return (
        <section style={{
            padding: '80px 24px',
            background: '#1A2B42',
            color: 'white',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Décorations d'arrière-plan */}
            <div style={{
                position: 'absolute', top: -100, right: -100, width: 300, height: 300,
                background: 'radial-gradient(circle, rgba(46,125,219,0.1) 0%, transparent 70%)',
                borderRadius: '50%'
            }} />
            <div style={{
                position: 'absolute', bottom: -50, left: -50, width: 200, height: 200,
                background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)',
                borderRadius: '50%'
            }} />

            <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <div style={{
                    display: 'flex', flexDirection: 'column',
                    gap: 60, alignItems: 'center'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)',
                            fontSize: 10, fontWeight: 700, marginBottom: 16,
                            textTransform: 'uppercase', letterSpacing: 0.5
                        }}>
                            ✨ Notre Engagement
                        </div>
                        <h2 style={{
                            fontFamily: "'Fredoka', sans-serif", fontSize: 28,
                            fontWeight: 700, marginBottom: 20, lineHeight: 1.2
                        }}>
                            Transparence Totale & IA Éthique
                        </h2>
                        <p style={{
                            fontSize: 15, color: 'rgba(255,255,255,0.6)',
                            lineHeight: 1.6, marginBottom: 32
                        }}>
                            Chez GeaiMonVol, la technologie est au service de votre portefeuille.
                            Nous croyons en une IA transparente qui ne cache rien de ses sources ni de ses méthodes.
                        </p>

                        <div style={{ display: 'grid', gap: 24 }}>
                            {PILLARS.map(p => (
                                <div key={p.title} style={{ display: 'flex', gap: 16 }}>
                                    <span style={{ fontSize: 24 }}>{p.icon}</span>
                                    <div>
                                        <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{p.title}</h4>
                                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                                            {p.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{
                        flex: 1, position: 'relative',
                    }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 24, padding: 32, backdropFilter: 'blur(10px)',
                            position: 'relative', overflow: 'hidden'
                        }}>
                            <div style={{
                                fontSize: 11, fontWeight: 800, color: '#60A5FA',
                                marginBottom: 20, letterSpacing: 1
                            }}>
                                SOURCE CODE INTEGRITY
                            </div>

                            {/* Simulation de code/logs */}
                            <div style={{
                                fontFamily: "'Courier New', monospace", fontSize: 11,
                                color: 'rgba(255,255,255,0.4)', lineHeight: 1.8
                            }}>
                                <div style={{ color: '#10B981' }}>{'>'} Fetching latest historical_prices...</div>
                                <div>[OK] Comparison baseline set: 5y_seasonal_avg</div>
                                <div style={{ color: '#F59E0B' }}>{'>'} Analyzing deal: YUL -{' >'} LIS (385$)</div>
                                <div>[ANALYSIS] Confidence score: 98.4%</div>
                                <div>[COMP] Local typical range: 680$ - 920$</div>
                                <div style={{ color: '#16A34A', fontWeight: 700 }}>VERIFIED DEAL: -53% Record Low</div>
                                <div style={{ animation: 'liveBlink 2s infinite' }}>_</div>
                            </div>

                            <div style={{
                                marginTop: 30, paddingTop: 20,
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex', alignItems: 'center', gap: 12
                            }}>
                                <div style={{
                                    width: 10, height: 10, borderRadius: '50%',
                                    background: '#10B981', boxShadow: '0 0 8px #10B981'
                                }} />
                                <span style={{ fontSize: 11, fontWeight: 700 }}>SYSTÈME OPÉRATIONNEL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
