'use client';
import { useState, useEffect } from 'react';

export default function PremiumBanner() {
    const [visible, setVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        // localStorage check
        const isDismissed = localStorage.getItem('premium_banner_dismissed');
        if (isDismissed) return () => window.removeEventListener('resize', checkMobile);

        const delay = window.innerWidth <= 768 ? 30000 : 15000;
        const timer = setTimeout(() => setVisible(true), delay);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    const handleDismiss = () => {
        setVisible(false);
        localStorage.setItem('premium_banner_dismissed', 'true');
    };

    if (!visible) return null;

    return (
        <div style={{
            position: isMobile ? 'fixed' : 'absolute',
            bottom: isMobile ? 80 : 'auto',
            top: isMobile ? 'auto' : 62,
            right: isMobile ? 16 : 20,
            left: isMobile ? 16 : 'auto',
            zIndex: 120,
            background: isMobile ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(8px)',
            borderRadius: 14,
            padding: isMobile ? '8px 12px' : '12px 16px',
            boxShadow: '0 4px 24px rgba(26,43,66,0.1)',
            border: '1px solid rgba(46,125,219,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            maxWidth: isMobile ? 'none' : 260,
            animation: isMobile ? 'panelSlideUp 0.4s ease-out' : 'fadeSlideIn 0.4s ease-out',
        }}>
            <div style={{
                width: isMobile ? 28 : 36,
                height: isMobile ? 28 : 36,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}>
                <svg width={isMobile ? 14 : 18} height={isMobile ? 14 : 18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: isMobile ? 12 : 13,
                    fontWeight: 700,
                    color: '#1A2B42',
                    fontFamily: "'Fredoka', sans-serif",
                }}>
                    Premium · 5$/mois
                </div>
                <div style={{
                    fontSize: isMobile ? 10 : 11,
                    color: '#8FA3B8',
                    marginTop: 0,
                    lineHeight: 1.2,
                }}>
                    Alertes perso + Guide IA gratuit
                </div>
            </div>
            <button
                onClick={handleDismiss}
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
                @keyframes panelSlideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
