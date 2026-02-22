'use client';
import { useState, useEffect } from 'react';

export default function Onboarding() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!show) return;

        const dismiss = () => setShow(false);
        window.addEventListener('click', dismiss, { once: true });

        const autoHide = setTimeout(() => setShow(false), 6000);
        return () => {
            window.removeEventListener('click', dismiss);
            clearTimeout(autoHide);
        };
    }, [show]);

    if (!show) return null;

    return (
        <div style={{
            position: 'absolute',
            top: '38%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 110,
            pointerEvents: 'none',
            animation: 'tooltipIn 0.5s cubic-bezier(.22, 1, .36, 1)',
        }}>
            <div style={{
                background: 'white',
                borderRadius: 12,
                padding: '10px 18px',
                boxShadow: '0 4px 20px rgba(26,43,66,0.12)',
                border: '1px solid rgba(46,125,219,0.1)',
                fontSize: 13,
                fontWeight: 600,
                color: '#1A2B42',
                fontFamily: "'Outfit', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
            }}>
                <span style={{ fontSize: 16 }}>👆</span>
                Clique sur un deal pour voir les détails
            </div>
            {/* Arrow pointing up */}
            <div style={{
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '8px solid white',
                margin: '0 auto',
                marginTop: -1,
                transform: 'rotate(180deg)',
                filter: 'drop-shadow(0 -1px 1px rgba(26,43,66,0.06))',
            }} />
            <style>{`
                @keyframes tooltipIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(8px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `}</style>
        </div>
    );
}
