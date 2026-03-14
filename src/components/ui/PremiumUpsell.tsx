'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const MESSAGES: Record<string, { icon: string; title: string; desc: string; perks: string[] }> = {
  watchlist: {
    icon: '📍',
    title: 'Watchlist pleine !',
    desc: 'Tu as atteint la limite de 3 destinations. Passe Premium pour suivre toutes tes destinations sans limites.',
    perks: ['Watchlist illimitée', 'Alertes prioritaires', 'Guides IA illimités'],
  },
  guide: {
    icon: '🧭',
    title: 'Limite de guides atteinte',
    desc: 'Tu as utilisé ton guide gratuit. Passe Premium pour générer des itinéraires illimités avec tips d\'initiés et plan B pluie.',
    perks: ['Guides IA illimités', 'Tips d\'initiés', 'Expériences cachées', 'Plan B pluie'],
  },
  alerts: {
    icon: '🔔',
    title: 'Alertes prioritaires',
    desc: 'Les membres Premium reçoivent les deals en premier avec des seuils plus bas. Ne manque plus rien !',
    perks: ['Alertes prioritaires', 'Seuils plus bas (-5%)', 'Notification en premier'],
  },
};

interface PremiumUpsellProps {
  feature: 'watchlist' | 'guide' | 'alerts';
  onClose?: () => void;
  inline?: boolean;
}

export default function PremiumUpsell({ feature, onClose, inline }: PremiumUpsellProps) {
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const msg = MESSAGES[feature];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

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

  if (inline) {
    return (
      <div className="pu-inline">
        <div className="pu-inline-icon">{msg.icon}</div>
        <div className="pu-inline-body">
          <strong>{msg.title}</strong>
          <p>{msg.desc}</p>
        </div>
        <button className="pu-inline-cta" onClick={handleUpgrade} disabled={loading}>
          {loading ? '...' : 'Passer Premium'}
        </button>
      </div>
    );
  }

  return (
    <div className={`pu-overlay${visible ? ' pu-visible' : ''}`} onClick={onClose}>
      <div className={`pu-modal${visible ? ' pu-modal-visible' : ''}`} onClick={e => e.stopPropagation()}>
        {onClose && <button className="pu-close" onClick={onClose} aria-label="Fermer">&times;</button>}

        <div className="pu-modal-icon">{msg.icon}</div>
        <h2 className="pu-modal-title">{msg.title}</h2>
        <p className="pu-modal-desc">{msg.desc}</p>

        <ul className="pu-modal-perks">
          {msg.perks.map((p, i) => (
            <li key={i}><span className="pu-perk-star">&#9733;</span>{p}</li>
          ))}
        </ul>

        <button className="pu-modal-cta" onClick={handleUpgrade} disabled={loading}>
          {loading ? 'Redirection...' : 'Passer Premium — 4,99$/mois'}
        </button>

        <Link href="/pricing" className="pu-modal-link" onClick={onClose}>
          Voir tous les détails
        </Link>
      </div>
    </div>
  );
}
