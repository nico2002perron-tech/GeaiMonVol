'use client';
import { useState } from 'react';
import { HOTELS } from '@/lib/data/hotels';
import { REGIONS } from '@/lib/data/regions';

export default function DealStrip() {
    const [activeTab, setActiveTab] = useState<'flights' | 'hotels'>('flights');

    const sortedHotels = [...HOTELS].sort((a, b) => b.disc - a.disc);

    const allDeals: any[] = [];
    Object.values(REGIONS).forEach((r: any) => {
        if (r.deals) r.deals.forEach((d: any) => allDeals.push(d));
    });
    allDeals.sort((a, b) => b.disc - a.disc);

    return (
        <div className="strip">
            <div className="strip-head">
                <div className="strip-head-left">
                    <div className="strip-title">
                        Meilleurs deals <em>du moment</em>
                    </div>
                    <div className="strip-tabs">
                        <button
                            className={`strip-tab ${activeTab === 'flights' ? 'on' : ''}`}
                            onClick={() => setActiveTab('flights')}
                        >
                            <svg viewBox="0 0 24 24">
                                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                            </svg>
                            Vols
                        </button>
                        <button
                            className={`strip-tab ${activeTab === 'hotels' ? 'on' : ''}`}
                            onClick={() => setActiveTab('hotels')}
                        >
                            <svg viewBox="0 0 24 24">
                                <path d="M3 21h18M3 7v14M21 7v14M6 11h4v4H6zM14 11h4v4h-4zM9 3h6l3 4H6l3-4z" />
                            </svg>
                            Hôtels
                        </button>
                    </div>
                </div>
                <button className="strip-more">Voir tout</button>
            </div>

            {/* Panel Vols */}
            <div className={`strip-panel ${activeTab === 'flights' ? 'show' : ''}`}>
                <div className="strip-row" id="stripRow">
                    {allDeals.slice(0, 7).map((deal, i) => (
                        <div key={deal.id || i} className="scard">
                            <img
                                className="scard-img"
                                src={deal.imgSmall || deal.img}
                                alt={deal.city}
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = deal.fallbackSmall || deal.img || '';
                                }}
                            />
                            <div className="scard-body">
                                <div className="scard-city">{deal.city}</div>
                                <div className="scard-route">{deal.route}</div>
                                <div className="scard-row">
                                    <span className="scard-price">{deal.price} $</span>
                                    <span className="scard-disc">-{deal.disc}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Panel Hôtels */}
            <div className={`strip-panel ${activeTab === 'hotels' ? 'show' : ''}`}>
                <div className="strip-row" id="stripRowHotels">
                    {sortedHotels.slice(0, 7).map((h, i) => {
                        const stars = Array.from({ length: h.stars });
                        return (
                            <div
                                key={i}
                                className="scard"
                                style={{ animationDelay: `${0.7 + i * 0.1}s` }}
                            >
                                <img
                                    className="scard-img"
                                    src={h.photo}
                                    alt={h.name}
                                    loading="lazy"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = h.fallback || '';
                                    }}
                                />
                                <div className="scard-body">
                                    <div className="scard-stars">
                                        {stars.map((_, si) => (
                                            <svg key={si} className="scard-star" viewBox="0 0 12 12">
                                                <path d="M6 1l1.5 3.1L11 4.6 8.5 7l.6 3.4L6 8.8 2.9 10.4l.6-3.4L1 4.6l3.5-.5L6 1z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <div className="scard-city" style={{ fontSize: '13px' }}>
                                        {h.name}
                                    </div>
                                    <div className="scard-rating">
                                        <span className="scard-rating-num">{h.rating}</span>
                                        {h.city} · {h.reviews.toLocaleString()} avis
                                    </div>
                                    <div className="scard-row">
                                        <span className="scard-price">
                                            {h.price} ${' '}
                                            <span className="scard-pernight">/ nuit</span>
                                        </span>
                                        <span className="scard-disc">-{h.disc}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
