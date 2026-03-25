import React from 'react';

export function PremiumLock({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ filter: 'blur(6px)', opacity: 0.55, pointerEvents: 'none', userSelect: 'none' }}>
                {children}
            </div>
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(2px)', borderRadius: 16, zIndex: 2,
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderRadius: 16,
                    padding: '20px 32px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxWidth: 340,
                }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#FFD700', fontFamily: "'Fredoka', sans-serif", marginBottom: 6 }}>
                        {label}
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif", margin: '0 0 14px', lineHeight: 1.5 }}>
                        Passe Premium pour acc&eacute;der &agrave; l&apos;analyse compl&egrave;te.
                    </p>
                    <a href="/pricing" style={{
                        display: 'inline-block', background: 'linear-gradient(135deg, #FFB800, #FFD700)',
                        color: '#5C4A00', fontSize: 13, fontWeight: 700, fontFamily: "'Fredoka', sans-serif",
                        padding: '10px 28px', borderRadius: 100, textDecoration: 'none',
                    }}>
                        Débloquer — 4,99$/mois
                    </a>
                </div>
            </div>
        </div>
    );
}

export function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
            }}>{icon}</div>
            <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: "'Fredoka', sans-serif" }}>{title}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit', sans-serif" }}>{subtitle}</div>
            </div>
        </div>
    );
}

export function DarkCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            borderRadius: 18, padding: '22px 20px', marginBottom: 24,
            border: '1px solid rgba(14,165,233,0.08)',
            ...style,
        }}>
            {children}
        </div>
    );
}

export function RatingDots({ value, color }: { value: number; color: string }) {
    return (
        <div style={{ display: 'flex', gap: 3 }}>
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: i <= value ? color : 'rgba(255,255,255,0.08)',
                    transition: 'background 0.3s',
                }} />
            ))}
        </div>
    );
}
