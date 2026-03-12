'use client';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import { PREMIUM_PRICE } from '@/lib/constants/premium';

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
    <div className="pricing-dark">
      <Navbar dark />

      {success && (
        <div className="pricing-success">
          Bienvenue dans le club Premium ! Tes features sont maintenant actives.
        </div>
      )}
      {canceled && (
        <div className="pricing-success" style={{ borderColor: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.5)' }}>
          Paiement annule. Tu peux reessayer quand tu veux.
        </div>
      )}

      <h1 className="pricing-title">Choisis ton plan</h1>
      <p className="pricing-subtitle">
        Decouvre les meilleurs deals aeriens du Quebec. Passe Premium pour debloquer tout.
      </p>

      <div className="plans">
        {/* FREE PLAN */}
        <div className="plan">
          <div className="plan-name">Gratuit</div>
          <div className="plan-price">0$<span> / pour toujours</span></div>
          <p className="plan-desc">L&apos;essentiel pour commencer a chasser les deals.</p>
          <ul className="plan-list">
            <li><span className="ck">&#10003;</span> 3 destinations en watchlist</li>
            <li><span className="ck">&#10003;</span> 1 guide IA par compte</li>
            <li><span className="ck">&#10003;</span> Alertes hebdomadaires</li>
            <li><span className="ck">&#10003;</span> Guides jusqu&apos;a 10 jours</li>
            <li><span className="ck">&#10003;</span> Carte interactive</li>
          </ul>
          {!user ? (
            <a href="/auth" className="plan-btn outline">S&apos;inscrire</a>
          ) : (
            <span className="plan-btn outline" style={{ opacity: isPremium ? 0.5 : 1 }}>
              {isPremium ? 'Plan actuel (avant)' : 'Plan actuel'}
            </span>
          )}
        </div>

        {/* PREMIUM PLAN */}
        <div className="plan pro">
          <div className="plan-name">Premium</div>
          <div className="plan-price">{PREMIUM_PRICE}$<span> / mois CAD</span></div>
          <p className="plan-desc">Tout illimite. L&apos;experience complete pour les vrais chasseurs.</p>
          <ul className="plan-list">
            <li><span className="ck-gold">&#9733;</span> Watchlist illimitee</li>
            <li><span className="ck-gold">&#9733;</span> Guides IA illimites</li>
            <li><span className="ck-gold">&#9733;</span> Alertes prioritaires</li>
            <li><span className="ck-gold">&#9733;</span> Guides jusqu&apos;a 21 jours</li>
            <li><span className="ck-gold">&#9733;</span> Plan B pluie par jour</li>
            <li><span className="ck-gold">&#9733;</span> Tips d&apos;inities &amp; codes promo</li>
            <li><span className="ck-gold">&#9733;</span> Experiences cachees locales</li>
          </ul>
          {loading ? (
            <span className="plan-btn fill" style={{ opacity: 0.5 }}>Chargement...</span>
          ) : isPremium ? (
            <>
              <span className="plan-btn premium-active">Tu es Premium !</span>
              <button className="manage-link" onClick={handleManage} disabled={portalLoading}>
                {portalLoading ? 'Chargement...' : 'Gerer mon abonnement'}
              </button>
            </>
          ) : (
            <button className="plan-btn fill" onClick={handleCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? 'Redirection...' : 'Passer Premium'}
            </button>
          )}
        </div>
      </div>
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
