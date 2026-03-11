'use client';
import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

interface NavbarProps {
    onOpenHowItWorks?: () => void;
    dark?: boolean;
}

export default function Navbar({ onOpenHowItWorks, dark }: NavbarProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className={dark ? 'nav-dark' : ''}>
            <Link href="/" className="logo">
                <Image src="/logo_geai.png" alt="GeaiMonVol" className="logo-img" width={40} height={40} />
                <div className="logo-word">
                    <span className="jet">Geai</span>
                    <span className="bleu">MonVol</span>
                </div>
            </Link>

            {/* Desktop menu */}
            <ul className="nav-menu">
                <li><Link href="#deals">Aubaines</Link></li>
                <li>
                    <button onClick={(e) => { e.preventDefault(); onOpenHowItWorks?.(); }} className="nav-link-btn">
                        Comment ça marche
                    </button>
                </li>
                <li><Link href="/explore">Globe</Link></li>
                <li><Link href="/auth" className="nav-cta">Se connecter</Link></li>
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
                    <Link href="/" onClick={() => setMenuOpen(false)}>Carte interactive</Link>
                    <Link href="#deals" onClick={() => setMenuOpen(false)}>Aubaines</Link>
                    <button onClick={() => { onOpenHowItWorks?.(); setMenuOpen(false); }} className="nav-link-btn">
                        Comment ça marche
                    </button>
                    <Link href="/explore" onClick={() => setMenuOpen(false)}>Globe</Link>
                    <Link href="/auth" onClick={() => setMenuOpen(false)} className="nav-cta" style={{ textAlign: 'center' }}>
                        Se connecter
                    </Link>
                </div>
            )}
        </nav>
    );
}
