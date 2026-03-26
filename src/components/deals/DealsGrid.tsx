'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DealCard from './DealCard';
import type { DealItem } from '@/lib/types/deals';

interface DealsGridProps {
  deals: DealItem[];
  allDealsCount: number;
  favorites: Record<string, boolean>;
  alertsEnabled: boolean;
  onToggleFavorite: (city: string, e: React.MouseEvent) => void;
  onShare: (deal: DealItem, e: React.MouseEvent) => void;
  onOpenPopup: (deal: DealItem) => void;
  onEnableAlerts: () => void;
}

const LEGEND_ITEMS = [
  { level: 'lowest_ever', color: '#7C3AED', label: 'Prix record', icon: '⚡' },
  { level: 'incredible', color: '#DC2626', label: 'Incroyable', icon: '🔥' },
  { level: 'great', color: '#F59E0B', label: 'Super deal', icon: '✨' },
  { level: 'good', color: '#10B981', label: 'Bon prix', icon: '👍' },
  { level: 'slight', color: '#64748B', label: 'Correct', icon: '👌' },
];

export default function DealsGrid({
  deals,
  allDealsCount,
  favorites,
  alertsEnabled,
  onToggleFavorite,
  onShare,
  onOpenPopup,
  onEnableAlerts,
}: DealsGridProps) {
  const [visibleCount, setVisibleCount] = useState(9);

  // Reset visible count when deals change (filters applied)
  useEffect(() => { setVisibleCount(9); }, [deals.length]);

  const visibleDeals = deals.slice(0, visibleCount);
  const hasMore = deals.length > visibleCount;
  const remainingCount = deals.length - visibleCount;

  // Skeleton loading
  if (allDealsCount === 0) {
    return (
      <div className="deals-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="deals-grid__skeleton">
            <div className="deals-grid__skeleton-image" />
            <div className="deals-grid__skeleton-body">
              <div className="deals-grid__skeleton-line" style={{ height: 14, width: '40%', marginBottom: 10, animationDelay: '0.15s' }} />
              <div className="deals-grid__skeleton-line" style={{ height: 22, width: '60%', marginBottom: 8, animationDelay: '0.3s' }} />
              <div className="deals-grid__skeleton-line" style={{ height: 12, width: '80%', marginBottom: 14, animationDelay: '0.45s' }} />
              <div className="deals-grid__skeleton-line" style={{ height: 32, width: '45%', animationDelay: '0.6s' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state — filter returned nothing
  if (allDealsCount > 0 && deals.length === 0) {
    return (
      <div className="deals-grid__empty">
        <div className="deals-grid__empty-icon">&#9992;</div>
        <div className="deals-grid__empty-title">Aucun deal ne correspond</div>
        <div style={{ fontSize: 13, marginBottom: 16 }}>Essaie une autre categorie</div>
        <button onClick={() => window.location.reload()} className="deals-grid__empty-btn">
          Voir tous les deals
        </button>
      </div>
    );
  }

  // No data at all
  if (allDealsCount === 0 && deals.length === 0) {
    return (
      <div className="deals-grid__empty" style={{ padding: '64px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📡</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Scan en cours...</div>
        <div style={{ fontSize: 15, color: '#64748B', maxWidth: 420, margin: '0 auto 24px' }}>
          Les prix sont scannes quotidiennement sur Skyscanner. Les deals apparaitront ici automatiquement.
        </div>
        <Link href="/agent" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 28px', borderRadius: 14,
          background: 'linear-gradient(135deg, #F97316, #EC4899)',
          color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
        }}>
          Parler avec GeaiAI
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Legend */}
      <div className="deals-grid__legend">
        {LEGEND_ITEMS.map((item) => (
          <div
            key={item.level}
            className="deals-grid__legend-item"
            style={{ background: `${item.color}15`, border: `1px solid ${item.color}30` }}
          >
            <span className="deals-grid__legend-dot" style={{ background: item.color }} />
            <span className="deals-grid__legend-label">{item.icon} {item.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="deals-grid">
        {visibleDeals.map((deal, idx) => (
          <React.Fragment key={`${deal.code}-${deal.city}`}>
            {/* CTA Alerts card at position 4 */}
            {idx === 3 && !alertsEnabled && (
              <div className="deals-grid__alerts-cta" style={{ animation: `dealFadeIn 0.5s ease-out 0.24s both` }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
                <h3>Ne rate aucun deal</h3>
                <p>Recois une alerte quand un prix chute sur tes destinations preferees.</p>
                <button onClick={onEnableAlerts} className="deals-grid__alerts-btn">
                  Activer les alertes
                </button>
              </div>
            )}
            <DealCard
              deal={deal}
              isFavorite={!!favorites[deal.city]}
              onToggleFavorite={onToggleFavorite}
              onShare={onShare}
              onOpenPopup={onOpenPopup}
              animationDelay={Math.min(idx * 0.06, 0.6)}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Voir plus */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            onClick={() => setVisibleCount(prev => prev + 9)}
            className="deals-grid__more"
          >
            Voir les {remainingCount} autres deals
            <span className="deals-grid__more-badge">+{remainingCount}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      )}

      {/* Agent CTA */}
      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <Link href="/agent" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '14px 32px', borderRadius: 100,
          border: '2px solid #E2E8F0',
          background: 'white', color: '#334155',
          fontSize: 15, fontWeight: 600,
          fontFamily: "'Outfit', sans-serif",
          textDecoration: 'none',
        }}>
          Demander a GeaiAI
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14m-6-6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </>
  );
}
