'use client';
import React, { useState } from 'react';

export default function PremiumBanner() {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    return (
        <div className="premium-banner">
            <button className="premium-banner-close" onClick={() => setDismissed(true)}>✕</button>

            <div className="premium-banner-mascot">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
            </div>

            <div className="premium-banner-body">
                <div className="premium-banner-title">
                    Voyageur Premium
                    <span className="premium-banner-save">ÉCONOMISE 45%</span>
                </div>
                <div className="premium-banner-desc">
                    Alertes perso, packs Vol + Hôtel, Guide IA gratuit à chaque réservation.
                </div>
            </div>

            <div className="premium-banner-right">
                <div className="premium-banner-price-wrap">
                    <div className="premium-banner-price">5 $</div>
                    <div className="premium-banner-period">/ mois</div>
                </div>
                <a href="#" className="premium-banner-cta">
                    Découvrir
                </a>
            </div>
        </div>
    );
}
