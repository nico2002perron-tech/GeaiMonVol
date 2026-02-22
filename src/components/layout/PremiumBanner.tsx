'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function PremiumBanner() {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    return (
        <div className="premium-banner" id="premiumBanner">
            <button
                className="premium-banner-close"
                onClick={() => setVisible(false)}
                aria-label="Close banner"
            >
                &times;
            </button>

            {/* MASCOT PLACEHOLDER */}
            <div className="premium-banner-mascot">MASCOT</div>

            <div className="premium-banner-body">
                <div className="premium-banner-title">
                    Voyageur Premium
                    <span className="premium-banner-save">Economisez gros</span>
                </div>
                <div className="premium-banner-desc">Alertes perso, packs Vol + Hotel, Guide IA gratuit a chaque reservation.</div>
            </div>

            <div className="premium-banner-right">
                <div className="premium-banner-price-wrap">
                    <div className="premium-banner-price">5 $</div>
                    <div className="premium-banner-period">/ mois</div>
                </div>
                <Link href="/pricing" className="premium-banner-cta">
                    Decouvrir
                </Link>
            </div>
        </div>
    );
}
