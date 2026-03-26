'use client';
import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useAuth } from '@/lib/auth/AuthProvider';
import NotificationBell from './NotificationBell';

interface NavbarProps {
    dark?: boolean;
}

export default function Navbar({ dark }: NavbarProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const { user, profile } = useAuth();
    const isPremium = profile?.plan === 'premium';

    return (
        <nav className={dark ? 'nav-dark' : ''}>
            <Link href="/" className="logo">
                <Image src="/logo_geai.png" alt="GeaiMonVol" className="logo-img" width={40} height={40} />
                <div className="logo-word">
                    <span className="jet">Geai</span>
                    <span className="bleu">MonVol</span>
                </div>
                {isPremium && <span className="premium-badge-nav">Premium</span>}
            </Link>

            {/* Desktop menu */}
            <ul className="nav-menu">
                <li><Link href="/agent">GeaiAI</Link></li>
                <li><Link href="/deals">Deals</Link></li>
                <li><Link href="/pricing">Tarifs</Link></li>
                {user && <li style={{ display: 'flex', alignItems: 'center' }}><NotificationBell /></li>}
                {user ? (
                    <li><Link href="/profile" className="nav-cta">Mon profil</Link></li>
                ) : (
                    <li><Link href="/auth" className="nav-cta">Se connecter</Link></li>
                )}
            </ul>

            {/* Mobile hamburger */}
            <button
                className="nav-hamburger"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu"
            >
                <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
                <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
                <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
            </button>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="nav-mobile-menu">
                    <Link href="/agent" onClick={() => setMenuOpen(false)}>GeaiAI</Link>
                    <Link href="/deals" onClick={() => setMenuOpen(false)}>Deals</Link>
                    <Link href="/pricing" onClick={() => setMenuOpen(false)}>Tarifs</Link>
                    {user && <Link href="/inbox" onClick={() => setMenuOpen(false)}>Notifications</Link>}
                    {user ? (
                        <Link href="/profile" onClick={() => setMenuOpen(false)} className="nav-cta" style={{ textAlign: 'center' }}>
                            Mon profil
                        </Link>
                    ) : (
                        <Link href="/auth" onClick={() => setMenuOpen(false)} className="nav-cta" style={{ textAlign: 'center' }}>
                            Se connecter
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
}
