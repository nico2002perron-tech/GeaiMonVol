'use client';
import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";

interface NavbarProps {
    onOpenHowItWorks?: () => void;
}

export default function Navbar({ onOpenHowItWorks }: NavbarProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav>
            <Link href="/" className="logo">
                <Image src="/logo_geai.png" alt="GeaiMonVol" className="logo-img" width={40} height={40} />
                <div className="logo-word">
                    <span className="jet">Geai</span>
                    <span className="bleu">MonVol</span>
                </div>
            </Link>

            {/* Desktop menu */}
            <ul className="nav-menu">
                {/* Map is now home, so no link needed or it can trigger something else */}
                <li><Link href="#deals">Aubaines</Link></li>
                <li>
                    <button onClick={(e) => { e.preventDefault(); onOpenHowItWorks?.(); }} className="nav-link-btn">
                        Comment ça marche
                    </button>
                </li>
                <li><Link href="#explore">Activités</Link></li>
                <li><Link href="/pricing">Forfaits</Link></li>
                <li><Link href="#signup" className="nav-cta">S'inscrire</Link></li>
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
                    <Link href="#explore" onClick={() => setMenuOpen(false)}>Activités</Link>
                    <Link href="/pricing" onClick={() => setMenuOpen(false)}>Forfaits</Link>
                    <Link href="#signup" onClick={() => setMenuOpen(false)} className="nav-cta" style={{ textAlign: 'center' }}>
                        S'inscrire
                    </Link>
                </div>
            )}
        </nav>
    );
}
