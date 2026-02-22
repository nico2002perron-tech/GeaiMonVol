'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function MapTopbar({ prices = [] }: { prices?: any[] }) {
    const { user, profile, signOut } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const isPremium = profile?.plan === 'premium';
    const isAdmin = (profile as any)?.role === 'admin';
    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Voyageur';

    const handleSignOut = async () => {
        setMenuOpen(false);
        try {
            await signOut();
            window.location.href = '/';
        } catch (err) {
            console.error('Sign out error:', err);
            // Force redirect anyway
            window.location.href = '/';
        }
    };

    return (
        <>
            {/* Header dark compact */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 28px',
                background: '#0F1A2A',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                zIndex: 100,
                flexShrink: 0,
            }}>
                {/* Left: Logo + Montreal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <img src="/mascots/logo.png" alt="Logo Geai" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                        <span style={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontWeight: 700,
                            fontSize: 16,
                            color: 'white',
                        }}>
                            Geai<span style={{ color: '#60A5FA' }}>MonVol</span>
                        </span>
                    </div>
                    <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        Meilleurs prix depuis <span style={{ color: '#60A5FA', fontWeight: 700 }}>Montréal</span> ✈️
                    </span>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {!isPremium && (
                        <Link href="/pricing" style={{
                            padding: '4px 12px', borderRadius: 100, textDecoration: 'none',
                            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                            display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                        }}>
                            <span style={{ fontSize: 10 }}>⚡</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA' }}>Premium 5$/mois</span>
                        </Link>
                    )}

                    <Link href="/recits" style={{
                        padding: '5px 14px', borderRadius: 100, textDecoration: 'none',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                        ✍️ Récits
                    </Link>

                    {/* ═══ AUTH BUTTON ═══ */}
                    {!user ? (
                        <Link href="/auth" style={{
                            padding: '5px 14px', borderRadius: 100, border: 'none', textDecoration: 'none',
                            background: 'linear-gradient(135deg, #2E7DDB, #1B5BA0)',
                            color: 'white', fontWeight: 700, fontSize: 10, cursor: 'pointer',
                            fontFamily: "'Fredoka', sans-serif",
                            display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                            🔑 Se connecter
                        </Link>
                    ) : (
                        <div ref={menuRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                style={{
                                    padding: '5px 14px', borderRadius: 100, border: 'none',
                                    background: menuOpen ? 'rgba(46,125,219,0.2)' : 'rgba(255,255,255,0.08)',
                                    color: 'white', fontWeight: 700, fontSize: 10, cursor: 'pointer',
                                    fontFamily: "'Fredoka', sans-serif",
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    transition: 'all 0.2s',
                                }}
                            >
                                <div style={{
                                    width: 22, height: 22, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #2E7DDB, #60A5FA)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 10, fontWeight: 800, color: 'white',
                                }}>
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <span>{displayName}</span>
                                {isPremium && <span style={{ fontSize: 8, background: 'rgba(124,58,237,0.2)', color: '#A78BFA', padding: '1px 5px', borderRadius: 100, fontWeight: 800 }}>PRO</span>}
                                {isAdmin && <span style={{ fontSize: 8, background: 'rgba(232,72,85,0.2)', color: '#F87171', padding: '1px 5px', borderRadius: 100, fontWeight: 800 }}>ADMIN</span>}
                                <span style={{ fontSize: 8, transition: 'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : '' }}>▼</span>
                            </button>

                            {/* Dropdown */}
                            {menuOpen && (
                                <div style={{
                                    position: 'absolute', top: '100%', right: 0, marginTop: 6,
                                    width: 260, borderRadius: 16, overflow: 'hidden',
                                    background: '#1A2B42', border: '1px solid rgba(255,255,255,0.08)',
                                    boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                                    fontFamily: "'Fredoka', sans-serif",
                                    animation: 'qF 0.2s ease',
                                    zIndex: 200,
                                }}>
                                    {/* User info */}
                                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{displayName}</div>
                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{user.email}</div>
                                        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                                            <span style={{
                                                fontSize: 9, padding: '2px 8px', borderRadius: 100, fontWeight: 700,
                                                background: isPremium ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.06)',
                                                color: isPremium ? '#A78BFA' : 'rgba(255,255,255,0.4)',
                                            }}>
                                                {isPremium ? '⚡ Premium' : '🆓 Gratuit'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Menu items */}
                                    <div style={{ padding: '6px 0' }}>
                                        {/* Bucket List — Futurs voyages */}
                                        <Link href="/library?tab=bucketlist" onClick={() => setMenuOpen(false)} style={{
                                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                                            color: 'white', textDecoration: 'none', fontSize: 12, fontWeight: 600,
                                            transition: 'background 0.15s',
                                        }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <span style={{ fontSize: 14 }}>🪣</span>
                                            Ma Bucket List
                                            <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Futurs voyages</span>
                                        </Link>

                                        {/* Bibliothèque — Voyages complétés */}
                                        <Link href="/library?tab=completed" onClick={() => setMenuOpen(false)} style={{
                                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                                            color: 'white', textDecoration: 'none', fontSize: 12, fontWeight: 600,
                                            transition: 'background 0.15s',
                                        }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <span style={{ fontSize: 14 }}>📚</span>
                                            Ma bibliothèque
                                            <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Complétés</span>
                                        </Link>

                                        {/* Notifications */}
                                        <Link href="/onboarding" onClick={() => setMenuOpen(false)} style={{
                                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                                            color: 'white', textDecoration: 'none', fontSize: 12, fontWeight: 600,
                                            transition: 'background 0.15s',
                                        }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <span style={{ fontSize: 14 }}>🔔</span>
                                            Personnaliser mes notifications
                                        </Link>

                                        {!isPremium && (
                                            <Link href="/pricing" onClick={() => setMenuOpen(false)} style={{
                                                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                                                color: '#A78BFA', textDecoration: 'none', fontSize: 12, fontWeight: 600,
                                                transition: 'background 0.15s',
                                            }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.05)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <span style={{ fontSize: 14 }}>⚡</span>
                                                Passer à Premium
                                            </Link>
                                        )}
                                    </div>

                                    {/* Sign out */}
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '6px 0' }}>
                                        <button onClick={handleSignOut} style={{
                                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                                            width: '100%', border: 'none', background: 'transparent',
                                            color: '#F87171', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                            fontFamily: "'Fredoka', sans-serif",
                                            transition: 'background 0.15s',
                                        }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.05)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <span style={{ fontSize: 14 }}>🚪</span>
                                            Se déconnecter
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bande bleue accent */}
            <div style={{
                height: 2,
                background: 'linear-gradient(90deg, #2E7DDB 0%, #06B6D4 50%, #7C3AED 100%)',
                opacity: 0.6,
                flexShrink: 0,
            }} />

            {/* Animation keyframe for dropdown */}
            <style>{`@keyframes qF{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </>
    );
}
