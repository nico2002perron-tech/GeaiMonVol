import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import Link from 'next/link';

export default function MapTopbar() {
    const { user, profile, loading } = useAuth();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(window.innerWidth <= 768);
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '6px 10px' : '10px 24px',
            height: isMobile ? 40 : 50,
            background: 'linear-gradient(180deg, rgba(244,248,251,0.95) 60%, rgba(244,248,251,0))',
            pointerEvents: 'none',
        }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, pointerEvents: 'auto' }}>
                <span style={{ fontSize: isMobile ? 20 : 28 }}>🐦</span>
                <span style={{
                    fontSize: isMobile ? 14 : 18,
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                    color: '#1A2B42',
                }}>
                    Geai<span style={{ color: '#2E7DDB' }}>Mon</span>Vol
                </span>
            </div>

            {/* Right side buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, pointerEvents: 'auto' }}>
                <button style={{
                    background: 'none',
                    border: 'none',
                    fontSize: isMobile ? 10 : 13,
                    color: '#8FA3B8',
                    cursor: 'pointer',
                    fontFamily: "'Outfit', sans-serif",
                    whiteSpace: 'nowrap',
                    padding: isMobile ? '4px 6px' : '6px 12px',
                }}>
                    Comment ça marche?
                </button>

                {!loading && (
                    <>
                        {user ? (
                            <Link
                                href="/profile"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: isMobile ? '4px 8px' : '8px 18px',
                                    borderRadius: 100,
                                    background: isMobile ? 'none' : 'rgba(255,255,255,0.85)',
                                    border: isMobile ? 'none' : '1px solid rgba(26,43,66,0.06)',
                                    fontSize: isMobile ? 11 : 13,
                                    fontWeight: 600,
                                    color: '#1A2B42',
                                    textDecoration: 'none',
                                    fontFamily: "'Outfit', sans-serif",
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <div style={{
                                    width: isMobile ? 18 : 22,
                                    height: isMobile ? 18 : 22,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #2E7DDB, #4A94E8)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: isMobile ? 9 : 10,
                                    fontWeight: 700,
                                    color: 'white',
                                }}>
                                    {(profile?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                                </div>
                                {!isMobile && (profile?.full_name?.split(' ')[0] || 'Profil')}
                            </Link>
                        ) : (
                            <button style={{
                                background: '#1A2B42',
                                color: 'white',
                                border: 'none',
                                borderRadius: 100,
                                fontSize: isMobile ? 11 : 13,
                                fontWeight: 600,
                                padding: isMobile ? '5px 12px' : '8px 18px',
                                cursor: 'pointer',
                                fontFamily: "'Outfit', sans-serif",
                                whiteSpace: 'nowrap',
                            }} onClick={() => window.location.href = '/auth'}>
                                S'inscrire
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
