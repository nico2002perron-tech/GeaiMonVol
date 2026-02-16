'use client';
import { useState, useEffect } from 'react';

export default function PremiumBanner() {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 30000);
        return () => clearTimeout(timer);
    }, []);

    if (!visible || dismissed) return null;

    return (
        <div style={{
            position: 'absolute',
            top: 62,
            right: 20,
            zIndex: 120,
            background: 'white',
            borderRadius: 14,
            padding: '12px 16px',
            boxShadow: '0 4px 24px rgba(26,43,66,0.1)',
            border: '1px solid rgba(46,125,219,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            maxWidth: 320,
            animation: 'fadeSlideIn 0.4s cubic-bezier(.22, 1, .36, 1)',
        }}>
            <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#1A2B42',
                    fontFamily: "'Fredoka', sans-serif",
                }}>
                    Premium · 5$/mois
                </div>
                <div style={{
                    fontSize: 11,
                    color: '#8FA3B8',
                    marginTop: 1,
                    lineHeight: 1.3,
                }}>
                    Alertes perso + Guide IA gratuit
                </div>
            </div>
            <button
                onClick={() => setDismissed(true)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#8FA3B8',
                    fontSize: 16,
                    cursor: 'pointer',
                    padding: 4,
                    lineHeight: 1,
                }}
            >
                ✕
            </button>

            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
