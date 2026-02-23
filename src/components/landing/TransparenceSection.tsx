'use client';
import { useRef, useState, useEffect } from 'react';
import { useInView } from '@/lib/hooks/useInView';

function AnimatedDiv({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const visible = useInView(ref);
    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: `all 0.6s cubic-bezier(.25,.46,.45,.94) ${delay}s`,
        }}>
            {children}
        </div>
    );
}

const STEPS = [
    {
        icon: '📖',
        title: 'Tu racontes',
        desc: 'Tu partages ton récit de voyage — destination, budget, conseils, coups de cœur.',
        color: '#2E7DDB',
    },
    {
        icon: '🔒',
        title: 'On anonymise',
        desc: 'Ton nom et tes infos personnelles sont séparés du contenu. L\'IA ne voit que les données de voyage.',
        color: '#16A34A',
    },
    {
        icon: '🧠',
        title: 'L\'IA apprend',
        desc: 'Notre agent IA analyse les récits pour comprendre les vrais bons plans, pas juste les prix.',
        color: '#7C3AED',
    },
    {
        icon: '🎯',
        title: 'Tout le monde en profite',
        desc: 'Les prochains voyageurs reçoivent des conseils personnalisés basés sur des expériences réelles.',
        color: '#EA580C',
    },
];

const GUARANTEES = [
    { icon: '🚫', title: 'Aucune vente de données', desc: 'Tes infos ne sont jamais vendues ou partagées à des tiers.' },
    { icon: '👤', title: 'Anonymisation complète', desc: 'L\'IA ne reçoit que le contenu du récit, jamais ton identité.' },
    { icon: '🗑️', title: 'Droit de suppression', desc: 'Tu peux supprimer ton récit et tes données à tout moment.' },
    { icon: '🤖', title: 'Modération IA', desc: 'Un agent IA surveille les contenus pour filtrer le spam et les abus.' },
];

export default function TransparenceSection() {
    return (
        <div style={{ background: 'white', padding: '60px 24px' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <AnimatedDiv>
                    <div style={{ textAlign: 'center', marginBottom: 40 }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '6px 16px', borderRadius: 100,
                            background: 'rgba(22,163,74,0.08)', marginBottom: 12,
                        }}>
                            <span>🛡️</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', fontFamily: "'Outfit', sans-serif" }}>
                                Transparence & Protection
                            </span>
                        </div>
                        <h2 style={{
                            fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 700,
                            color: '#1A2B42', margin: '0 0 8px',
                        }}>
                            Tes données, tes règles.
                        </h2>
                        <p style={{ fontSize: 13, color: '#5A7089', margin: '0 auto', maxWidth: 520, lineHeight: 1.6 }}>
                            On utilise l'intelligence collective de la communauté pour améliorer les guides IA — mais jamais au détriment de ta vie privée.
                        </p>
                    </div>
                </AnimatedDiv>

                {/* Process steps */}
                <AnimatedDiv delay={0.2}>
                    <div style={{
                        display: 'flex', gap: 16, alignItems: 'stretch',
                        flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32,
                    }}>
                        {STEPS.map((step, i) => (
                            <div key={i} className="step-card" style={{ flex: '1 1 170px', maxWidth: 200 }}>
                                <div style={{
                                    background: '#F8FAFC', borderRadius: 16, padding: '20px 16px',
                                    textAlign: 'center', border: '1px solid rgba(26,43,66,0.05)',
                                    height: '100%', position: 'relative',
                                }}>
                                    {i < STEPS.length - 1 && (
                                        <div style={{
                                            position: 'absolute', right: -12, top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: 14, color: '#D1D5DB', zIndex: 5,
                                        }}>→</div>
                                    )}
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 12, margin: '0 auto 10px',
                                        background: `${step.color}10`, border: `2px solid ${step.color}20`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 20,
                                    }}>{step.icon}</div>
                                    <div style={{
                                        fontSize: 10, fontWeight: 800, color: step.color,
                                        letterSpacing: 0.5, marginBottom: 4,
                                    }}>
                                        ÉTAPE {i + 1}
                                    </div>
                                    <h4 style={{
                                        fontSize: 14, fontWeight: 700, color: '#1A2B42',
                                        margin: '0 0 4px', fontFamily: "'Outfit', sans-serif",
                                    }}>
                                        {step.title}
                                    </h4>
                                    <p style={{ fontSize: 11, color: '#5A7089', lineHeight: 1.4, margin: 0 }}>
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </AnimatedDiv>

                {/* Guarantees */}
                <AnimatedDiv delay={0.4}>
                    <div style={{
                        background: 'linear-gradient(135deg, #0F1A2A 0%, #1A2B42 100%)',
                        borderRadius: 18, padding: '24px 28px',
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 16,
                    }}>
                        {GUARANTEES.map((g, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 20, flexShrink: 0 }}>{g.icon}</span>
                                <div>
                                    <div style={{
                                        fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 2,
                                        fontFamily: "'Outfit', sans-serif",
                                    }}>
                                        {g.title}
                                    </div>
                                    <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, margin: 0 }}>
                                        {g.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </AnimatedDiv>
            </div>
        </div>
    );
}
