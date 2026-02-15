'use client';
import { useState, useEffect } from 'react';
import { REGIONS } from '../data/regions';
import { HOTELS } from '../data/hotels';

const REGION_CITIES: { [key: string]: string[] } = {
    "North America": ["Cancun"],
    "South America": [],
    "Europe": ["Barcelone", "Lisbonne", "Paris", "Rome"],
    "Africa": ["Marrakech"],
    "Asia": ["Tokyo", "Bangkok", "Bali"],
    "Oceania": [],
};

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    selectedRegion?: string;
    onSelectFlight?: (flight: any) => void;
}

export default function Sidebar({ isOpen, onClose, selectedRegion, onSelectFlight }: SidebarProps) {
    const [activeTab, setActiveTab] = useState<'flights' | 'hotels'>('flights');

    const regionName = selectedRegion && REGIONS[selectedRegion] ? REGIONS[selectedRegion].name : 'Région';
    const regionDeals = selectedRegion && REGIONS[selectedRegion] ? REGIONS[selectedRegion].deals : [];

    // Filter hotels for the region
    const regionCities = selectedRegion ? (REGION_CITIES[selectedRegion] || []) : [];
    const regionHotels = HOTELS.filter(h => regionCities.includes(h.city));

    const totalDeals = (regionDeals ? regionDeals.length : 0) + regionHotels.length;

    return (
        <div className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
            <div className="sb-header">
                <div className="sb-title-row">
                    <h2 className="sb-region" id="sbRegion">{regionName}</h2>
                    <button className="sb-close" id="sbClose" onClick={onClose}>
                        <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>
                <div className="sb-meta" id="sbCount">{totalDeals} deals disponibles</div>
                <div className="sb-tabs">
                    <button
                        className={`sb-tab ${activeTab === 'flights' ? 'on' : ''}`}
                        onClick={() => setActiveTab('flights')}
                        data-sbtab="flights"
                    >
                        Vols
                    </button>
                    <button
                        className={`sb-tab ${activeTab === 'hotels' ? 'on' : ''}`}
                        onClick={() => setActiveTab('hotels')}
                        data-sbtab="hotels"
                    >
                        Hôtels
                    </button>
                </div>
            </div>

            <div className="sb-content">
                <div className={`sb-panel ${activeTab === 'flights' ? 'show' : ''}`} data-sbtab="flights">
                    <div className="sb-list" id="sbList">
                        {regionDeals && regionDeals.map((deal: any, i: number) => (
                            <div key={i} className="sb-deal">
                                <img
                                    className="sb-deal-img"
                                    src={deal.img}
                                    alt={deal.city}
                                    loading="lazy"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = deal.fallback || '';
                                    }}
                                />
                                <div className="sb-deal-body">
                                    <div className="sb-deal-top">
                                        <span className="sb-deal-city">{deal.city}, {deal.country}</span>
                                        <span className="sb-deal-price">{deal.price} $</span>
                                    </div>
                                    <div className="sb-deal-info">{deal.dates} · {deal.route} · -{deal.disc}%</div>
                                    <div className="sb-deal-tags">
                                        {deal.tags.map((t: string) => {
                                            if (t === 'hot') return <span key={t} className="t-hot">Hot Deal</span>;
                                            if (t === 'direct') return <span key={t} className="t-direct">Vol Direct</span>;
                                            if (t === 'eco') return <span key={t} className="t-eco">Eco</span>;
                                            return null;
                                        })}
                                    </div>
                                    <button
                                        className="sb-deal-cta"
                                        data-deal-idx={i}
                                        onClick={() => onSelectFlight && onSelectFlight(deal)}
                                    >
                                        Choisir ce vol
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`sb-panel ${activeTab === 'hotels' ? 'show' : ''}`} data-sbtab="hotels">
                    <div className="sb-list" id="sbListHotels">
                        {regionHotels.length === 0 ? (
                            <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '13px', color: 'var(--text-dim)' }}>
                                Pas encore d'hotels pour cette region. Bientot disponible.
                            </div>
                        ) : (
                            regionHotels.map((h, i) => (
                                <div key={i} className="sb-deal">
                                    <img
                                        className="sb-deal-img"
                                        src={h.photo}
                                        alt={h.name}
                                        loading="lazy"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = h.fallback || '';
                                        }}
                                    />
                                    <div className="sb-deal-body">
                                        <div className="sb-hotel-stars">
                                            {Array.from({ length: h.stars }).map((_, si) => (
                                                <svg key={si} className="sb-hotel-star" viewBox="0 0 12 12"><path d="M6 1l1.5 3.1L11 4.6 8.5 7l.6 3.4L6 8.8 2.9 10.4l.6-3.4L1 4.6l3.5-.5L6 1z" /></svg>
                                            ))}
                                        </div>
                                        <div className="sb-deal-top">
                                            <span className="sb-deal-city">{h.name}</span>
                                            <span className="sb-deal-price">{h.price} $ <span className="sb-deal-pnight">/ nuit</span></span>
                                        </div>
                                        <div className="sb-hotel-rating">
                                            <span className="sb-hotel-rnum">{h.rating}</span>
                                            {h.city} · {h.reviews.toLocaleString()} avis
                                        </div>
                                        <div className="sb-deal-info">Ancien prix : {h.old} $ / nuit · -{h.disc}%</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
