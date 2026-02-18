import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import Link from 'next/link';

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
                    <span style={{ fontSize: 22 }}>🐦</span>
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

            {/* Droite : Partagez + compteur + inscrire */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link href="/recits" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 12px',
                    borderRadius: 100,
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(46,125,219,0.06))',
                    border: '1px solid rgba(124,58,237,0.12)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                }}>
                    <span style={{ fontSize: 11 }}>✍️</span>
                    <span style={{
                        fontSize: 10.5, fontWeight: 700,
                        background: 'linear-gradient(135deg, #7C3AED, #2E7DDB)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontFamily: "'Outfit', sans-serif",
                    }}>Partagez votre voyage</span>
                </Link>
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
