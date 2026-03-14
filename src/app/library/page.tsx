'use client';

import { useAuth } from '@/lib/auth/AuthProvider';
import { usePremium } from '@/lib/hooks/usePremium';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import LandingHeader from '@/components/LandingHeader';
import PremiumUpsell from '@/components/ui/PremiumUpsell';
import { FREE_GUIDE_MAX } from '@/lib/constants/premium';
import '../landing.css';

interface GuidePreview {
  id: string;
  destination: string;
  country: string;
  departure_date: string;
  return_date: string;
  flight_price: number | null;
  budget_style: string;
  title: string;
  summary: string;
  days_count: number;
  total_budget: number | null;
  has_premium: boolean;
  highlights: string[];
  created_at: string;
}

const BUDGET_LABELS: Record<string, string> = {
  budget: 'Économique',
  moderate: 'Confortable',
  luxury: 'Luxe',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const { isPremium, guideCount, canGenerateGuide, loading: premLoading } = usePremium();
  const [guides, setGuides] = useState<GuidePreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    fetch('/api/guide')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setGuides(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  return (
    <div className="lp">
      <LandingHeader />

      <section className="lb-page">
        <div className="lb-header">
          <span className="lp-section-label">Mes guides</span>
          <h1 className="lp-section-title">Ma bibliothèque de voyages</h1>
          <p className="lb-subtitle">Retrouve tous tes itinéraires générés par GeaiAI.</p>

          {user && !premLoading && !isPremium && (
            <div className="guide-counter">
              <span className="guide-counter-icon">&#9993;</span>
              <span className="guide-counter-text">
                {guideCount}/{FREE_GUIDE_MAX} guide{FREE_GUIDE_MAX > 1 ? 's' : ''} utilisé{guideCount > 1 ? 's' : ''}
              </span>
              {!canGenerateGuide && <span className="guide-counter-full">Limite atteinte</span>}
            </div>
          )}
          {user && !premLoading && isPremium && (
            <div className="guide-counter guide-counter-premium">
              <span className="guide-counter-icon">&#9889;</span>
              <span className="guide-counter-text">{guideCount} guide{guideCount > 1 ? 's' : ''} généré{guideCount > 1 ? 's' : ''}</span>
              <span className="guide-counter-full" style={{ color: '#8B6914' }}>Illimité</span>
            </div>
          )}
        </div>

        {!user && !authLoading && (
          <div className="lb-empty">
            <p>Connecte-toi pour voir tes guides.</p>
            <Link href="/auth?redirect=/library" className="lb-cta">Se connecter</Link>
          </div>
        )}

        {loading && user && (
          <div className="lb-loading">
            <div className="lb-spinner" />
            <p>Chargement de tes guides...</p>
          </div>
        )}

        {!loading && user && guides.length === 0 && (
          <div className="lb-empty">
            <span className="lb-empty-icon">&#9992;</span>
            <p>Aucun guide encore. Génère ton premier itinéraire !</p>
            <Link href="/explore" className="lb-cta">Créer un guide</Link>
          </div>
        )}

        {!loading && user && !canGenerateGuide && !isPremium && !premLoading && (
          <PremiumUpsell feature="guide" inline />
        )}

        {!loading && guides.length > 0 && (
          <div className="lb-grid">
            {guides.map(g => (
              <Link href={`/library/${g.id}`} key={g.id} className="lb-card">
                {g.has_premium && <span className="lb-card-badge">Premium</span>}
                <div className="lb-card-top">
                  <h3 className="lb-card-title">{g.title}</h3>
                  <p className="lb-card-dest">{g.destination}{g.country ? `, ${g.country}` : ''}</p>
                </div>
                <p className="lb-card-summary">{g.summary}</p>
                <div className="lb-card-meta">
                  <span>{g.days_count} jour{g.days_count > 1 ? 's' : ''}</span>
                  <span>{formatDate(g.departure_date)} — {formatDate(g.return_date)}</span>
                </div>
                <div className="lb-card-footer">
                  {g.budget_style && <span className="lb-card-tag">{BUDGET_LABELS[g.budget_style] || g.budget_style}</span>}
                  {g.total_budget && <span className="lb-card-price">{Math.round(g.total_budget)}$/pers.</span>}
                  {g.flight_price && <span className="lb-card-price">Vol: {Math.round(g.flight_price)}$</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
