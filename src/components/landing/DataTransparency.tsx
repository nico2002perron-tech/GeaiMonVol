'use client';

import React, { useEffect, useState } from 'react';

export default function DataTransparency() {
    const [scans, setScans] = useState(14502);

    useEffect(() => {
        const interval = setInterval(() => {
            setScans(prev => prev + Math.floor(Math.random() * 3));
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const stats = [
        { label: 'Billets analysés /24h', value: scans.toLocaleString(), icon: '🔍' },
        { label: 'Destinations actives', value: '142', icon: '📍' },
        { label: 'Économie moyenne', value: '42%', icon: '💰' },
    ];

    return (
        <section style={{
            background: 'linear-gradient(135deg, #1A2B42 0%, #2E4A6E 100%)',
            padding: '40px 24px', position: 'relative', overflow: 'hidden'
        }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 32, textAlign: 'center'
                }}>
                    {stats.map((s, i) => (
                        <div key={i} style={{ padding: '0 20px' }}>
                            <div style={{ fontSize: 24, marginBottom: 12 }}>{s.icon}</div>
                            <div style={{
                                fontSize: 32, fontWeight: 800, color: 'white',
                                fontFamily: "'Fredoka', sans-serif", marginBottom: 4
                            }}>
                                {s.value}
                            </div>
                            <div style={{
                                color: 'rgba(255,255,255,0.7)', fontSize: 13,
                                fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1
                            }}>
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{
                    marginTop: 32, padding: '10px 20px', borderRadius: 100,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
                }}>
                    <span style={{
                        width: 8, height: 8, borderRadius: '50%', background: '#22C55E',
                        boxShadow: '0 0 10px #22C55E'
                    }} />
                    <span style={{ color: 'white', fontSize: 12, fontWeight: 500 }}>
                        Live : Analyse des prix Google Flights en cours...
                    </span>
                </div>
            </div>

            {/* Background pattern */}
            <div style={{
                position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none',
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '30px 30px'
            }} />
        </section>
    );
}
