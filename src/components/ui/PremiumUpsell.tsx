'use client';

import { useState } from 'react';

const MESSAGES: Record<string, { icon: string; title: string; desc: string }> = {
  watchlist: {
    icon: '\uD83D\uDCCD',
    title: 'Watchlist pleine !',
    desc: 'Les membres Premium ont des watchlists illimitees. Passe Premium pour suivre toutes tes destinations.',
  },
  guide: {
    icon: '\uD83E\uDDED',
    title: 'Limite de guides atteinte',
    desc: 'Tu as utilise ton guide gratuit. Passe Premium pour generer des guides illimites avec plus de details.',
  },
  alerts: {
    icon: '\uD83D\uDD14',
    title: 'Alertes prioritaires',
    desc: 'Les membres Premium recoivent les deals en premier avec des seuils plus bas. Ne manque plus rien !',
  },
};

interface PremiumUpsellProps {
  feature: 'watchlist' | 'guide' | 'alerts';
}

export default function PremiumUpsell({ feature }: PremiumUpsellProps) {
  const [loading, setLoading] = useState(false);
  const msg = MESSAGES[feature];

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="premium-upsell">
      <div className="premium-upsell-icon">{msg.icon}</div>
      <div className="premium-upsell-body">
        <div className="premium-upsell-title">{msg.title}</div>
        <div className="premium-upsell-desc">{msg.desc}</div>
      </div>
      <button className="premium-upsell-cta" onClick={handleUpgrade} disabled={loading}>
        {loading ? '...' : 'Passer Premium'}
      </button>
    </div>
  );
}
