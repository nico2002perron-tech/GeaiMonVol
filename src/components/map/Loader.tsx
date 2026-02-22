'use client';
import { useEffect, useState } from 'react';

export default function Loader() {
    const [done, setDone] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDone(true), 2500);
        return () => clearTimeout(timer);
    }, []);

    if (done) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#0F172A',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.8s ease',
            opacity: done ? 0 : 1,
        }}>
            <div style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 32,
                fontWeight: 700,
                color: 'white',
                letterSpacing: -0.5,
                marginBottom: 24,
            }}>
                Geai<span style={{ color: '#4A94E8' }}>Mon</span>Vol
            </div>
            <div style={{
                width: 160,
                height: 3,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 4,
                overflow: 'hidden',
            }}>
                <div style={{
                    height: '100%',
                    borderRadius: 4,
                    background: 'linear-gradient(90deg, #2E7DDB, #4A94E8)',
                    animation: 'loaderFill 2.2s cubic-bezier(.4,0,.2,1) forwards',
                }} />
            </div>
            <div style={{
                marginTop: 14,
                fontSize: 13,
                color: 'rgba(255,255,255,0.4)',
                fontFamily: "'Outfit', sans-serif",
            }}>
                Scanning des meilleurs prix...
            </div>
            <style>{`
                @keyframes loaderFill {
                    0% { width: 0; }
                    50% { width: 70%; }
                    85% { width: 94%; }
                    100% { width: 100%; }
                }
            `}</style>
        </div>
    );
}
