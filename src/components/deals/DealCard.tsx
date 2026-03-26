'use client';

import React from 'react';
import Image from 'next/image';
import { DEAL_LEVELS } from '@/lib/constants/deals';
import type { DealItem } from '@/lib/types/deals';
import { formatDateRange, getTripNights, formatScannedAgo } from '@/lib/types/deals';

interface DealCardProps {
  deal: DealItem;
  isFavorite: boolean;
  onToggleFavorite: (city: string, e: React.MouseEvent) => void;
  onShare: (deal: DealItem, e: React.MouseEvent) => void;
  onOpenPopup: (deal: DealItem) => void;
  animationDelay?: number;
}

function getBookingUrl(deal: DealItem): string {
  if (deal.bookingLink) return deal.bookingLink;
  const code = deal.code?.toLowerCase() || '';
  return `https://www.skyscanner.ca/transport/flights/yul/${code}/`;
}

export default function DealCard({
  deal,
  isFavorite,
  onToggleFavorite,
  onShare,
  onOpenPopup,
  animationDelay = 0,
}: DealCardProps) {
  const level = DEAL_LEVELS[deal.dealLevel];
  const isTopDeal = ['lowest_ever', 'incredible', 'great', 'good'].includes(deal.dealLevel);
  const topColor = deal.dealLevel === 'lowest_ever' ? '#7C3AED'
    : deal.dealLevel === 'incredible' ? '#DC2626'
    : deal.dealLevel === 'great' ? '#F59E0B'
    : deal.dealLevel === 'good' ? '#10B981' : null;

  const nights = getTripNights(deal.departureDate, deal.returnDate);

  return (
    <div
      className={`deal-card${isTopDeal ? ' deal-card--top' : ''}`}
      style={{
        borderColor: isTopDeal && topColor ? `${topColor}40` : undefined,
        animationDelay: `${animationDelay}s`,
      }}
      role="button"
      tabIndex={0}
      aria-label={`Deal ${deal.city} a ${Math.round(deal.price)}$${deal.discount > 0 ? `, -${deal.discount}%` : ''}`}
      onClick={() => onOpenPopup(deal)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenPopup(deal); } }}
    >
      {/* ── TOP DEAL BANNER ── */}
      {isTopDeal && level && topColor && (
        <div
          className="deal-card__level-banner"
          style={{
            backgroundImage: deal.dealLevel === 'great'
              ? 'linear-gradient(135deg, #F59E0B, #D97706)'
              : `linear-gradient(135deg, ${topColor}, ${topColor}CC)`,
          }}
        >
          <span
            className="deal-card__level-label"
            style={{ color: deal.dealLevel === 'great' ? '#78350F' : '#fff' }}
          >
            {level.icon} {level.label}
          </span>
          <span
            className="deal-card__level-pct"
            style={{
              color: deal.dealLevel === 'great' ? '#78350F' : '#fff',
              background: deal.dealLevel === 'great' ? 'rgba(120,53,15,0.15)' : 'rgba(255,255,255,0.2)',
            }}
          >
            -{deal.discount}%
          </span>
        </div>
      )}

      {/* ── Image ── */}
      <div className="deal-card__image">
        <Image
          src={deal.image}
          alt={deal.city}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Deal level badge */}
        {level && (
          <span
            className="deal-card__badge deal-card__badge--level"
            style={{ background: level.bg, boxShadow: `0 2px 8px ${level.bg}66` }}
          >
            {level.icon} {level.label}
          </span>
        )}

        {/* Direct flight */}
        {deal.stops === 0 && (
          <span className={`deal-card__badge deal-card__badge--direct${level ? ' deal-card__badge--offset' : ''}`}>
            ✈ Direct
          </span>
        )}

        {/* Tout-inclus ribbon */}
        {deal.category === 'tout-inclus' && (
          <span className="deal-card__badge deal-card__badge--inclusive">
            ✈ PACK VOL + HOTEL 🏨
          </span>
        )}

        {/* Discount */}
        {deal.discount > 0 && (
          <span className="deal-card__badge deal-card__badge--discount">
            -{deal.discount}%
          </span>
        )}

        {/* Fav + Share */}
        <div className="deal-card__actions">
          <button
            className={`deal-card__fav-btn${isFavorite ? ' deal-card__fav-btn--active' : ''}`}
            onClick={(e) => onToggleFavorite(deal.city, e)}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
          <button
            className="deal-card__share-btn"
            onClick={(e) => onShare(deal, e)}
            aria-label="Partager ce deal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="deal-card__body">
        {/* City + route */}
        <div className="deal-card__header">
          <h3 className="deal-card__city">{deal.city}</h3>
          <span className="deal-card__route">YUL → {deal.code}</span>
        </div>

        {/* Country + airline */}
        <div className="deal-card__meta">
          <span className="deal-card__meta-text">
            {deal.country}
            {deal.airline ? ` · ${deal.airline}` : ''}
            {deal.stops > 0 ? ` · ${deal.stops} esc.` : ''}
          </span>
        </div>

        {/* Dates */}
        {deal.departureDate && (
          <div style={{ marginBottom: 10 }}>
            <span className="deal-card__dates-tag">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              {formatDateRange(deal.departureDate, deal.returnDate)}
              {nights > 0 ? ` · ${nights}n` : ''}
            </span>
          </div>
        )}

        {/* Price + CTAs */}
        <div className="deal-card__footer">
          <div className="deal-card__price-block">
            {deal.category === 'tout-inclus' && deal.totalPackPrice ? (
              <>
                <div>
                  <span className="deal-card__price">{Math.round(deal.totalPackPrice)} $</span>
                </div>
                <div className="deal-card__price-sub">par personne · vol + hotel</div>
              </>
            ) : (
              <>
                <div>
                  {deal.oldPrice > deal.price && (
                    <span className="deal-card__old-price">{Math.round(deal.oldPrice)} $</span>
                  )}
                  <span className="deal-card__price">{Math.round(deal.price)} $</span>
                  <span className="deal-card__price-label">A/R</span>
                </div>
              </>
            )}
            {deal.scannedAt && (
              <div className="deal-card__scanned">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                {formatScannedAgo(deal.scannedAt)}
              </div>
            )}
          </div>

          <div className="deal-card__footer-ctas">
            <a
              href={getBookingUrl(deal)}
              target="_blank"
              rel="noopener noreferrer"
              className="deal-card__book-btn"
              onClick={(e) => e.stopPropagation()}
            >
              Reserver
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
            <button
              className="deal-card__dates-btn"
              onClick={(e) => { e.stopPropagation(); onOpenPopup(deal); }}
            >
              Voir les dates
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-6-6l6 6-6 6" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
