'use client';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import LandingHeader from '@/components/LandingHeader';
import { PREMIUM_PRICE } from '@/lib/constants/premium';
import '../landing.css';

function PricingContent() {
  const { user, profile, loading } = useAuth();
  const searchParams = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const isPremium = profile?.plan === 'premium';

  async function handleCheckout() {
    if (!user) {
      window.location.href = '/auth?redirect=/pricing';
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setCheckoutLoading(false);
    }
  }

  async function handleManage() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/subscription', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setPortalLoading(false);
    }
  }

  return (
    <div className="lp">
      <LandingHeader />

      <section className="pr-page">
        {/* Header */}
        <div className="pr-header">
          <span className="lp-section-label">Tarifs</span>
          <h1 className="lp-section-title">Passe au niveau supérieur</h1>
          <p className="pr-subtitle">
            Découvre les meilleurs deals aériens du Québec.<br />
            Passe Premium pour débloquer tout le potentiel de GeaiMonVol.
          </p>
        </div>

        {/* Status banners */}
        {success && (
          <div className="pr-banner pr-banner-success">
            <span className="pr-banner-icon">&#10003;</span>
            Bienvenue dans le club Premium ! Tes features sont maintenant actives.
          </div>
        )}
        {canceled && (
          <div className="pr-banner pr-banner-cancel">
            Paiement annulé. Tu peux réessayer quand tu veux.
          </div>
        )}

        {/* Plans grid */}
        <div className="pr-plans">
          {/* FREE */}
          <div className="pr-plan">
            <div className="pr-plan-badge pr-badge-launch">Gratuit pour toujours</div>
            <div className="pr-plan-top">
              <div className="pr-plan-name">Gratuit</div>
              <div className="pr-plan-price">0$<span>/pour toujours</span></div>
              <p className="pr-plan-desc">Tout ce qu&apos;il faut pour trouver des deals et réserver tes tout-inclus.</p>
            </div>
            <ul className="pr-plan-features">
              <li><span className="pr-ck">&#10003;</span>Palmarès des deals en temps réel</li>
              <li><span className="pr-ck">&#10003;</span>Analyse IA Agent de Voyage</li>
              <li><span className="pr-ck">&#10003;</span>Carte interactive</li>
              <li><span className="pr-ck">&#10003;</span>5 deals par destination</li>
              <li><span className="pr-ck">&#10003;</span>Alertes courriel + digest hebdo</li>
              <li><span className="pr-ck">&#10003;</span>3 destinations en watchlist</li>
              <li><span className="pr-ck">&#10003;</span>1 guide IA — Québec</li>
              <li className="pr-feat-locked"><span className="pr-x">&#10005;</span>Pack Builder vol + hôtel IA</li>
              <li className="pr-feat-locked"><span className="pr-x">&#10005;</span>Intelligence Voyage par destination</li>
              <li className="pr-feat-locked"><span className="pr-x">&#10005;</span>Calendrier des prix + meilleurs mois</li>
              <li className="pr-feat-locked"><span className="pr-x">&#10005;</span>Packs Expédition nomade</li>
              <li className="pr-feat-locked"><span className="pr-x">&#10005;</span>Alertes prioritaires + inbox</li>
            </ul>
            <div className="pr-plan-bottom">
              {!user ? (
                <a href="/auth" className="pr-btn pr-btn-outline">Commencer gratuitement</a>
              ) : (
                <span className="pr-btn pr-btn-outline pr-btn-current">
                  {isPremium ? 'Ancien plan' : 'Plan actuel'}
                </span>
              )}
            </div>
          </div>

          {/* PREMIUM */}
          <div className="pr-plan pr-plan-pro">
            <div className="pr-plan-glow" aria-hidden="true" />
            <div className="pr-plan-badge">Le + populaire</div>
            <div className="pr-plan-top">
              <div className="pr-plan-name">Premium</div>
              <div className="pr-plan-price">
                {PREMIUM_PRICE}$<span>/mois CAD</span>
              </div>
              <div className="pr-plan-per-day">Moins de 0.17$/jour — rentabilisé dès ton premier deal</div>
              <p className="pr-plan-desc">L&apos;outil indispensable pour planifier tes voyages et économiser gros.</p>
            </div>
            <ul className="pr-plan-features">
              <li><span className="pr-ck pr-ck-pro">&#9733;</span>Tout le plan gratuit inclus</li>
              <li><span className="pr-ck pr-ck-pro">&#9733;</span>Pack Builder vol + hôtel avec analyse IA</li>
              <li><span className="pr-ck pr-ck-pro">&#9733;</span>Tous les deals visibles (pas de limite)</li>
              <li><span className="pr-ck pr-ck-pro">&#9733;</span>Intelligence Voyage complète par destination</li>
              <li><span className="pr-ck pr-ck-pro">&#9733;</span>Calendrier des prix + meilleurs mois</li>
              <li><span className="pr-ck pr-ck-pro">&#9733;</span>Alertes prioritaires + boîte de réception</li>
              <li><span className="pr-ck pr-ck-pro">&#9733;</span>Packs Expédition nomade multi-étapes</li>
              <li><span className="pr-ck pr-ck-pro">&#9733;</span>Watchlist illimitée</li>
              <li><span className="pr-ck pr-ck-pro">&#9733;</span>Guides IA illimités — monde entier</li>
            </ul>
            <div className="pr-plan-bottom">
              {loading ? (
                <span className="pr-btn pr-btn-fill" style={{ opacity: 0.6 }}>Chargement...</span>
              ) : isPremium ? (
                <>
                  <span className="pr-btn pr-btn-active">Tu es Premium !</span>
                  <button className="pr-manage" onClick={handleManage} disabled={portalLoading}>
                    {portalLoading ? 'Chargement...' : 'Gérer mon abonnement'}
                  </button>
                </>
              ) : (
                <>
                  <button className="pr-btn pr-btn-fill" onClick={handleCheckout} disabled={checkoutLoading}>
                    {checkoutLoading ? 'Redirection...' : 'Passer Premium'}
                  </button>
                  <p className="pr-guarantee">Annulation gratuite en 1 clic, sans engagement</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Trust */}
        <div className="pr-trust">
          <div className="pr-trust-item">
            <span className="pr-trust-icon">&#128274;</span>
            <div>
              <strong>Paiement sécurisé</strong>
              <p>Transactions par Stripe. Tes données bancaires ne passent jamais par nos serveurs.</p>
            </div>
          </div>
          <div className="pr-trust-item">
            <span className="pr-trust-icon">&#9889;</span>
            <div>
              <strong>Annulation en 1 clic</strong>
              <p>Annule quand tu veux depuis le portail de gestion. Aucun engagement.</p>
            </div>
          </div>
          <div className="pr-trust-item">
            <span className="pr-trust-icon">&#127873;</span>
            <div>
              <strong>Actif instantanément</strong>
              <p>Tes features Premium sont débloquées dès la confirmation du paiement.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}
