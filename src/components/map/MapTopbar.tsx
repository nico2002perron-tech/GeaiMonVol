import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import Link from 'next/link';
import Image from 'next/image';

export default function MapTopbar({ prices = [] }: { prices?: any[] }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 24px',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(26,43,66,0.05)',
            zIndex: 100,
            flexShrink: 0,
        }}>
            {/* Gauche : logo + tagline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ position: 'relative', width: 28, height: 28 }}>
                        <Image
                            src="/logo_geai.png"
                            alt="Logo"
                            fill
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                    <span style={{
                        fontFamily: "'Fredoka', sans-serif",
                        fontWeight: 700,
                        fontSize: 17,
                        color: '#1A2B42',
                    }}>
                        Geai<span style={{ color: '#2E7DDB' }}>MonVol</span>
                    </span>
                </div>

                {/* Tagline compacte — pill dans la topbar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '3px 12px',
                    borderRadius: 100,
                    background: 'rgba(46,125,219,0.05)',
                    border: '1px solid rgba(46,125,219,0.08)',
                }}>
                    <span style={{ fontSize: 11, color: '#5A7089' }}>Meilleurs prix depuis</span>
                    <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #2E7DDB, #06B6D4)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>Montréal</span>
                    <span style={{ fontSize: 10 }}>✈️</span>
                </div>
            </div>

            {/* Droite : compteur + inscrire */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    borderRadius: 100,
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: '#16A34A',
                }}>
                    <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: '#16A34A',
                        animation: 'liveBlink 2s ease-in-out infinite',
                    }} />
                    900+ scannés
                </span>
                <button style={{
                    padding: '6px 14px',
                    borderRadius: 100,
                    border: '1px solid rgba(26,43,66,0.1)',
                    background: 'white',
                    color: '#1A2B42',
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: 'pointer',
                    fontFamily: "'Outfit', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                }} onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    alert('Lien copié ! Partagez-le avec vos amis.');
                }}>
                    <span>🤝</span>
                    Partager
                </button>
                <button style={{
                    padding: '6px 16px',
                    borderRadius: 100,
                    border: 'none',
                    background: '#1A2B42',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: "'Outfit', sans-serif",
                }}>
                    S'inscrire
                </button>
            </div>
        </div>
    );
}
