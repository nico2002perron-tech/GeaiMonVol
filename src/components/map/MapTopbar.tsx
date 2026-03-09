'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function MapTopbar({ prices = [] }: { prices?: any[] }) {
    const { user, profile, signOut } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const isAdmin = (profile as any)?.role === 'admin';
    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Voyageur';
    const dealCount = useMemo(() => (prices || []).length, [prices]);

    const handleSignOut = async () => {
        setMenuOpen(false);
        try { await signOut(); } catch { }
        window.location.href = '/';
    };

    return (
        <>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                height: 56,
                background: 'rgba(4,8,16,0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                zIndex: 100,
                flexShrink: 0,
                position: 'relative',
            }}>
                {/* Left: Logo + nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                        <img src="/logo_geai.png" alt="Logo" style={{
                            width: 28, height: 28, objectFit: 'contain',
                            filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.15))',
                        }} />
                        <span style={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontWeight: 700, fontSize: 17, color: 'white',
                        }}>
                            Geai<span style={{ color: '#0EA5E9' }}>MonVol</span>
                        </span>
                    </Link>

                    <nav style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 12 }}>
                        {[
                            { label: 'Accueil', href: '/' },
                            { label: 'Deals', href: '/#deals' },
                        ].map((link) => (
                            <Link key={link.label} href={link.href} className="topbar-nav-link" style={{
                                padding: '6px 14px', borderRadius: 8,
                                fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)',
                                textDecoration: 'none',
                                fontFamily: "'Outfit', sans-serif",
                                transition: 'all 0.2s ease',
                            }}>
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Center: Live indicator */}
                <div style={{
                    position: 'absolute', left: '50%', top: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 14px', borderRadius: 100,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <span style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#4ADE80',
                        display: 'inline-block', animation: 'liveBlink 2s infinite',
                        boxShadow: '0 0 8px rgba(74,222,128,0.5)',
                    }} />
                    <span style={{
                        fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)',
                        fontFamily: "'Outfit', sans-serif",
                    }}>
                        {dealCount > 0 ? (
                            <><span style={{ color: '#4ADE80', fontWeight: 700 }}>{dealCount}</span> deals live</>
                        ) : 'Scanning...'}
                    </span>
                </div>

                {/* Right: Auth */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!user ? (
                        <Link href="/auth" className="topbar-auth-btn" style={{
                            padding: '7px 20px', borderRadius: 100, textDecoration: 'none',
                            background: 'rgba(14,165,233,0.15)',
                            border: '1px solid rgba(14,165,233,0.2)',
                            color: '#7DD3FC', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                            display: 'flex', alignItems: 'center', gap: 7,
                            transition: 'all 0.3s ease',
                        }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
                            </svg>
                            Se connecter
                        </Link>
                    ) : (
                        <div ref={menuRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="topbar-user-btn"
                                style={{
                                    padding: '4px 14px 4px 4px', borderRadius: 100,
                                    border: menuOpen ? '1px solid rgba(14,165,233,0.2)' : '1px solid rgba(255,255,255,0.08)',
                                    background: menuOpen ? 'rgba(14,165,233,0.1)' : 'rgba(255,255,255,0.04)',
                                    color: 'white', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                                    fontFamily: "'Outfit', sans-serif",
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    transition: 'all 0.25s ease',
                                }}
                            >
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 800, color: 'white',
                                }}>
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ color: 'rgba(255,255,255,0.75)' }}>{displayName}</span>
                                {isAdmin && <span style={{
                                    fontSize: 9, background: 'rgba(248,113,113,0.12)', color: '#F87171',
                                    padding: '2px 7px', borderRadius: 100, fontWeight: 800,
                                }}>ADMIN</span>}
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round"
                                    style={{ transition: 'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : '' }}>
                                    <path d="M6 9l6 6 6-6"/>
                                </svg>
                            </button>

                            {menuOpen && (
                                <div style={{
                                    position: 'absolute', top: '100%', right: 0, marginTop: 8,
                                    width: 260, borderRadius: 16, overflow: 'hidden',
                                    background: 'rgba(8,14,28,0.97)', backdropFilter: 'blur(24px)',
                                    WebkitBackdropFilter: 'blur(24px)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                                    fontFamily: "'Outfit', sans-serif",
                                    animation: 'qF 0.2s cubic-bezier(0.16,1,0.3,1)',
                                    zIndex: 200,
                                }}>
                                    <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{displayName}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{user.email}</div>
                                    </div>
                                    <div style={{ padding: '6px 0' }}>
                                        <Link href="/" onClick={() => setMenuOpen(false)} className="topbar-dropdown-item" style={{
                                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
                                            color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13, fontWeight: 500,
                                            transition: 'all 0.15s ease',
                                        }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                            Accueil
                                        </Link>
                                        <a href="/#deals" onClick={() => setMenuOpen(false)} className="topbar-dropdown-item" style={{
                                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
                                            color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13, fontWeight: 500,
                                            transition: 'all 0.15s ease',
                                        }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                                            Deals
                                        </a>
                                    </div>
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '6px 0' }}>
                                        <button onClick={handleSignOut} className="topbar-dropdown-item" style={{
                                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
                                            width: '100%', border: 'none', background: 'transparent',
                                            color: 'rgba(248,113,113,0.75)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                            fontFamily: "'Outfit', sans-serif",
                                            transition: 'all 0.15s ease',
                                        }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                            Se deconnecter
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom edge glow */}
            <div style={{
                height: 1,
                background: 'linear-gradient(90deg, transparent 5%, rgba(14,165,233,0.1) 30%, rgba(14,165,233,0.2) 50%, rgba(14,165,233,0.1) 70%, transparent 95%)',
                flexShrink: 0,
            }} />

            <style>{`
                @keyframes qF{from{opacity:0;transform:translateY(-6px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
                @keyframes liveBlink{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.3)}}
                .topbar-nav-link:hover{color:rgba(255,255,255,0.9)!important;background:rgba(255,255,255,0.05)!important;}
                .topbar-auth-btn:hover{border-color:rgba(14,165,233,0.35)!important;background:rgba(14,165,233,0.2)!important;}
                .topbar-user-btn:hover{border-color:rgba(255,255,255,0.12)!important;background:rgba(255,255,255,0.06)!important;}
                .topbar-dropdown-item:hover{background:rgba(255,255,255,0.04)!important;color:white!important;}
            `}</style>
        </>
    );
}
