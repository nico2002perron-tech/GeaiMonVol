'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function MapTopbar({ prices = [] }: { prices?: any[] }) {
    const { user, profile, signOut } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        const handleScroll = () => setScrolled(window.scrollY > 20);
        document.addEventListener('mousedown', handleClick);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleClick);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const isPremium = profile?.plan === 'premium';
    const isAdmin = (profile as any)?.role === 'admin';
    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Voyageur';

    const dealCount = useMemo(() => (prices || []).length, [prices]);

    const handleSignOut = async () => {
        setMenuOpen(false);
        try {
            await signOut();
            window.location.href = '/';
        } catch (err) {
            console.error('Sign out error:', err);
            window.location.href = '/';
        }
    };

    const navLinks = [
        { label: 'Deals', href: '#deals', icon: null },
        { label: 'Premium', href: '/pricing', icon: null },
        { label: 'Recits', href: '/recits', icon: null },
    ];

    return (
        <>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 28px',
                height: 52,
                background: scrolled
                    ? 'rgba(2,4,8,0.97)'
                    : 'rgba(4,8,16,0.95)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                zIndex: 100,
                flexShrink: 0,
                transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
                position: 'relative',
            }}>
                {/* Left: Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                        <img src="/mascots/logo.png" alt="Logo Geai" style={{
                            width: 30, height: 30, objectFit: 'contain',
                            filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.2))',
                        }} />
                        <span style={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontWeight: 700,
                            fontSize: 18,
                            color: 'white',
                            letterSpacing: -0.3,
                        }}>
                            Geai<span style={{ color: '#00D4FF' }}>MonVol</span>
                        </span>
                    </Link>

                    {/* Nav links — desktop only */}
                    <div role="navigation" style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        marginLeft: 8,
                    }}>
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="topbar-nav-link"
                                style={{
                                    padding: '6px 14px', borderRadius: 8,
                                    fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
                                    textDecoration: 'none',
                                    fontFamily: "'Outfit', sans-serif",
                                    transition: 'all 0.2s ease',
                                    letterSpacing: 0.2,
                                }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Center: Live indicator — integrated into header */}
                <div style={{
                    position: 'absolute', left: '50%', top: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 100,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.04)',
                }}>
                    <span style={{
                        width: 5, height: 5, borderRadius: '50%', background: '#4ADE80',
                        display: 'inline-block', animation: 'liveBlink 2s infinite',
                        boxShadow: '0 0 8px rgba(74,222,128,0.5)',
                    }} />
                    <span style={{
                        fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)',
                        fontFamily: "'Outfit', sans-serif",
                    }}>
                        {dealCount > 0 ? (
                            <><span style={{ color: '#4ADE80', fontWeight: 700 }}>{dealCount}</span> deals live</>
                        ) : 'Scanning...'}
                    </span>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!isPremium && (
                        <Link href="/pricing" className="topbar-premium-btn" style={{
                            padding: '6px 16px', borderRadius: 100, textDecoration: 'none',
                            background: 'linear-gradient(135deg, rgba(217,149,51,0.12), rgba(255,200,80,0.06))',
                            border: '1px solid rgba(217,149,51,0.2)',
                            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                            position: 'relative', overflow: 'hidden',
                            transition: 'all 0.3s ease',
                        }}>
                            <div style={{
                                position: 'absolute', top: 0, left: '-100%',
                                width: '60%', height: '100%',
                                background: 'linear-gradient(90deg, transparent, rgba(217,149,51,0.12), transparent)',
                                animation: 'premShimmer 4s ease-in-out infinite',
                            }} />
                            <span style={{
                                fontSize: 11, fontWeight: 700, position: 'relative',
                                background: 'linear-gradient(135deg, #FFD777, #D99533)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontFamily: "'Outfit', sans-serif",
                            }}>Premium</span>
                        </Link>
                    )}

                    {/* AUTH BUTTON */}
                    {!user ? (
                        <Link href="/auth" className="topbar-auth-btn" style={{
                            padding: '6px 18px', borderRadius: 100, textDecoration: 'none',
                            background: 'linear-gradient(135deg, rgba(0,180,220,0.2), rgba(0,212,255,0.1))',
                            border: '1px solid rgba(0,212,255,0.15)',
                            color: 'white', fontWeight: 700, fontSize: 11, cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                            display: 'flex', alignItems: 'center', gap: 6,
                            transition: 'all 0.3s ease',
                        }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
                            </svg>
                            Connexion
                        </Link>
                    ) : (
                        <div ref={menuRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="topbar-user-btn"
                                style={{
                                    padding: '4px 12px 4px 4px', borderRadius: 100,
                                    border: menuOpen ? '1px solid rgba(0,212,255,0.15)' : '1px solid rgba(255,255,255,0.06)',
                                    background: menuOpen ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.04)',
                                    color: 'white', fontWeight: 600, fontSize: 11, cursor: 'pointer',
                                    fontFamily: "'Outfit', sans-serif",
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    transition: 'all 0.25s ease',
                                }}
                            >
                                <div style={{
                                    width: 26, height: 26, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #00A5CC, #00D4FF)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 800, color: 'white',
                                    boxShadow: '0 0 12px rgba(0,212,255,0.2)',
                                }}>
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{displayName}</span>
                                {isPremium && <span style={{
                                    fontSize: 8, background: 'rgba(217,149,51,0.15)', color: '#FFD777',
                                    padding: '2px 6px', borderRadius: 100, fontWeight: 800,
                                }}>PRO</span>}
                                {isAdmin && <span style={{
                                    fontSize: 8, background: 'rgba(248,113,113,0.12)', color: '#F87171',
                                    padding: '2px 6px', borderRadius: 100, fontWeight: 800,
                                }}>ADMIN</span>}
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round"
                                    style={{ transition: 'transform 0.25s ease', transform: menuOpen ? 'rotate(180deg)' : '' }}>
                                    <path d="M6 9l6 6 6-6"/>
                                </svg>
                            </button>

                            {/* Dropdown */}
                            {menuOpen && (
                                <div style={{
                                    position: 'absolute', top: '100%', right: 0, marginTop: 8,
                                    width: 260, borderRadius: 16, overflow: 'hidden',
                                    background: 'rgba(6,13,26,0.95)', backdropFilter: 'blur(24px)',
                                    WebkitBackdropFilter: 'blur(24px)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 1px rgba(0,212,255,0.08)',
                                    fontFamily: "'Outfit', sans-serif",
                                    animation: 'qF 0.25s cubic-bezier(0.16,1,0.3,1)',
                                    zIndex: 200,
                                }}>
                                    <div style={{ padding: '16px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{displayName}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{user.email}</div>
                                        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                                            <span style={{
                                                fontSize: 9, padding: '3px 10px', borderRadius: 100, fontWeight: 700,
                                                background: isPremium ? 'rgba(217,149,51,0.12)' : 'rgba(255,255,255,0.04)',
                                                color: isPremium ? '#FFD777' : 'rgba(255,255,255,0.35)',
                                                border: isPremium ? '1px solid rgba(217,149,51,0.15)' : '1px solid rgba(255,255,255,0.04)',
                                            }}>
                                                {isPremium ? 'Premium' : 'Plan Gratuit'}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ padding: '4px 0' }}>
                                        {[
                                            { href: '/library?tab=bucketlist', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round"><path d="M12 2L15 8.5L22 9.5L17 14.5L18 21.5L12 18.5L6 21.5L7 14.5L2 9.5L9 8.5L12 2Z"/></svg>, label: 'Ma Bucket List', sub: 'Futurs voyages' },
                                            { href: '/library?tab=completed', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, label: 'Bibliotheque', sub: 'Completes' },
                                            { href: '/onboarding', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>, label: 'Notifications', sub: '' },
                                        ].map((item) => (
                                            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                                                className="topbar-dropdown-item"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                                                    color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 12, fontWeight: 600,
                                                    transition: 'all 0.15s ease',
                                                }}
                                            >
                                                {item.icon}
                                                {item.label}
                                                {item.sub && <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>{item.sub}</span>}
                                            </Link>
                                        ))}
                                        {!isPremium && (
                                            <Link href="/pricing" onClick={() => setMenuOpen(false)}
                                                className="topbar-dropdown-item"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                                                    color: '#FFD777', textDecoration: 'none', fontSize: 12, fontWeight: 600,
                                                    transition: 'all 0.15s ease',
                                                }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD777" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                                                Passer a Premium
                                            </Link>
                                        )}
                                    </div>
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '4px 0' }}>
                                        <button onClick={handleSignOut}
                                            className="topbar-dropdown-item"
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                                                width: '100%', border: 'none', background: 'transparent',
                                                color: 'rgba(248,113,113,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                                fontFamily: "'Outfit', sans-serif",
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
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

            {/* Subtle bottom edge glow */}
            <div style={{
                height: 1,
                background: 'linear-gradient(90deg, transparent 5%, rgba(0,212,255,0.08) 30%, rgba(0,212,255,0.15) 50%, rgba(0,212,255,0.08) 70%, transparent 95%)',
                flexShrink: 0,
            }} />

            <style>{`
                @keyframes qF{from{opacity:0;transform:translateY(-6px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
                @keyframes premShimmer{0%,80%,100%{left:-100%}40%{left:120%}}
                @keyframes liveBlink{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.3)}}
                .topbar-nav-link:hover{color:rgba(255,255,255,0.85)!important;background:rgba(255,255,255,0.04)!important;}
                .topbar-premium-btn:hover{border-color:rgba(217,149,51,0.35)!important;background:linear-gradient(135deg, rgba(217,149,51,0.18), rgba(255,200,80,0.1))!important;transform:translateY(-1px);}
                .topbar-auth-btn:hover{border-color:rgba(0,212,255,0.25)!important;background:linear-gradient(135deg, rgba(0,180,220,0.25), rgba(0,212,255,0.15))!important;}
                .topbar-user-btn:hover{border-color:rgba(255,255,255,0.1)!important;background:rgba(255,255,255,0.06)!important;}
                .topbar-dropdown-item:hover{background:rgba(255,255,255,0.04)!important;color:white!important;}
            `}</style>
        </>
    );
}
