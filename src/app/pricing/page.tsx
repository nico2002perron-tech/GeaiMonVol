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
          <h1 className="lp-section-title">Choisis ton plan</h1>
          <p className="pr-subtitle">
            Decouvre les meilleurs deals aeriens du Quebec.<br />
            Passe Premium pour debloquer tout le potentiel de GeaiMonVol.
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
            Paiement annule. Tu peux reessayer quand tu veux.
          </div>
        )}

        {/* Plans grid */}
        <div className="pr-plans">
          {/* FREE */}
          <div className="pr-plan">
            <div className="pr-plan-top">
              <div className="pr-plan-name">Gratuit</div>
              <div className="pr-plan-price">0$<span>/pour toujours</span></div>
              <p className="pr-plan-desc">L&apos;essentiel pour commencer a chasser les deals.</p>
            </div>
            <ul className="pr-plan-features">
              <li><span className="pr-ck">&#10003;</span>3 destinations en watchlist</li>
              <li><span className="pr-ck">&#10003;</span>1 guide IA par compte</li>
              <li><span className="pr-ck">&#10003;</span>Alertes hebdomadaires</li>
              <li><span className="pr-ck">&#10003;</span>Guides jusqu&apos;a 10 jours</li>
              <li><span className="pr-ck">&#10003;</span>Carte interactive</li>
            </ul>
            <div className="pr-plan-bottom">
              {!user ? (
                <a href="/auth" className="pr-btn pr-btn-outline">S&apos;inscrire gratuitement</a>
              ) : (
                <span className="pr-btn pr-btn-outline pr-btn-current">
                  {isPremium ? 'Ancien plan' : 'Plan actuel'}
                </span>
              )}
            </div>
          </div>

          {/* PREMIUM */}
          <div className="pr-plan pr-plan-pro">
            <div className="pr-plan-badge">Populaire</div>
            <div className="pr-plan-top">
              <div className="pr-plan-name">Premium</div>
              <div className="pr-plan-price">{PREMIUM_PRICE}$<span>/mois CAD</span></div>
              <p className="pr-plan-desc">Tout illimite. L&apos;experience complete pour les vrais chasseurs de deals.</p>
            </div>
            <ul className="pr-plan-features">
              <li><span className="pr-ck pr-ck-gold">&#9733;</span>Watchlist illimitee</li>
              <li><span className="pr-ck pr-ck-gold">&#9733;</span>Guides IA illimites</li>
              <li><span className="pr-ck pr-ck-gold">&#9733;</span>Alertes prioritaires</li>
              <li><span className="pr-ck pr-ck-gold">&#9733;</span>Guides jusqu&apos;a 21 jours</li>
              <li><span className="pr-ck pr-ck-gold">&#9733;</span>Plan B pluie par jour</li>
              <li><span className="pr-ck pr-ck-gold">&#9733;</span>Tips d&apos;inities &amp; codes promo</li>
              <li><span className="pr-ck pr-ck-gold">&#9733;</span>Experiences cachees locales</li>
            </ul>
            <div className="pr-plan-bottom">
              {loading ? (
                <span className="pr-btn pr-btn-fill" style={{ opacity: 0.6 }}>Chargement...</span>
              ) : isPremium ? (
                <>
                  <span className="pr-btn pr-btn-active">Tu es Premium !</span>
                  <button className="pr-manage" onClick={handleManage} disabled={portalLoading}>
                    {portalLoading ? 'Chargement...' : 'Gerer mon abonnement'}
                  </button>
                </>
              ) : (
                <button className="pr-btn pr-btn-fill" onClick={handleCheckout} disabled={checkoutLoading}>
                  {checkoutLoading ? 'Redirection...' : 'Passer Premium'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FAQ / Trust */}
        <div className="pr-trust">
          <div className="pr-trust-item">
            <span className="pr-trust-icon">&#128274;</span>
            <div>
              <strong>Paiement securise</strong>
              <p>Transactions par Stripe. Tes donnees bancaires ne passent jamais par nos serveurs.</p>
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
              <strong>Actif instantanement</strong>
              <p>Tes features Premium sont debloquees des la confirmation du paiement.</p>
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
