'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { usePremium } from '@/lib/hooks/usePremium';

export default function LandingHeader() {
  const { user, profile, signOut } = useAuth();
  const { isPremium, loading: premLoading } = usePremium();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Voyageur';

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    try { await signOut(); } catch { }
    window.location.href = '/';
  };

  return (
    <>
    <header className="lp-header">
      <div className="lp-header-inner">
        <Link href="/" className="lp-logo">
          <span className="lp-logo-text">Geai<strong>MonVol</strong></span>
        </Link>

        <nav className="lp-nav">
          <div className="lp-nav-pill">
            <Link href="/deals" className="lp-nav-link">Deals</Link>
            <Link href="/planifier" className="lp-nav-link">Planifier</Link>
            <Link href="/pricing" className="lp-nav-link">Tarifs</Link>
          </div>
        </nav>

        <div className="lp-header-right">
          {!user ? (
            <>
              <Link href="/auth" className="lp-h-login">Se connecter</Link>
              <Link href="/auth" className="lp-h-signup">Commencer</Link>
            </>
          ) : (
            <div ref={menuRef} className="lp-h-user">
              <button className={`lp-h-user-btn${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
                <span className="lp-h-avatar">{displayName.charAt(0).toUpperCase()}</span>
                <span className="lp-h-name">{displayName}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {menuOpen && (
                <div className="lp-h-drop">
                  <div className="lp-h-drop-top">
                    <span className="lp-h-drop-avatar">{displayName.charAt(0).toUpperCase()}</span>
                    <div>
                      <div className="lp-h-drop-name">{displayName}</div>
                      <div className="lp-h-drop-email">{user.email}</div>
                    </div>
                  </div>
                  <div className="lp-h-drop-sep" />
                  <Link href="/deals" className="lp-h-drop-link" onClick={() => setMenuOpen(false)}>
                    Deals en direct
                  </Link>
                  <Link href="/planifier" className="lp-h-drop-link" onClick={() => setMenuOpen(false)}>
                    Planifier un voyage
                  </Link>
                  <Link href="/library" className="lp-h-drop-link" onClick={() => setMenuOpen(false)}>
                    Mes guides
                  </Link>
                  <Link href="/pricing" className="lp-h-drop-link" onClick={() => setMenuOpen(false)}>
                    Tarifs
                  </Link>
                  <div className="lp-h-drop-sep" />
                  <button className="lp-h-drop-link lp-h-drop-logout" onClick={handleSignOut}>Se deconnecter</button>
                </div>
              )}
            </div>
          )}
          <button className={`lp-burger${mobileMenuOpen ? ' open' : ''}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={mobileMenuOpen}>
            <span /><span /><span />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lp-mob">
          <Link href="/deals" onClick={() => setMobileMenuOpen(false)}>Deals</Link>
          <Link href="/planifier" onClick={() => setMobileMenuOpen(false)}>Planifier</Link>
          <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>Tarifs</Link>
          {user && <Link href="/library" onClick={() => setMobileMenuOpen(false)}>Mes guides</Link>}
          <div className="lp-mob-sep" />
          {!user ? (
            <>
              <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="lp-mob-login">Se connecter</Link>
              <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="lp-mob-signup">Commencer</Link>
            </>
          ) : (
            <>
              <div className="lp-mob-user">
                <span className="lp-h-avatar">{displayName.charAt(0).toUpperCase()}</span>
                <div>
                  <strong>{displayName}</strong>
                  <span>{user.email}</span>
                </div>
              </div>
              <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="lp-mob-logout">Se deconnecter</button>
            </>
          )}
        </div>
      )}
    </header>
    </>
  );
}
