'use client';

import { useState } from 'react';

interface DealDetail {
    city: string;
    country?: string;
    destination_code?: string;
    price: number;
    currency?: string;
    discount?: number;
    avgPrice?: number;
    dealLevel?: string;
    airline?: string;
    departure_date?: string;
    return_date?: string;
    stops?: number;
    duration?: number;
    source?: string;
    googleFlightsLink?: string;
    raw_data?: any;
    img?: string;
}

interface DealSidebarProps {
    deal: DealDetail | null;
    onClose: () => void;
}

export default function DealSidebar({ deal, onClose }: DealSidebarProps) {
    if (!deal) return null;

    const stops = deal.stops ?? (deal.raw_data?.flights?.length
        ? (deal.raw_data?.flights?.length || 1) - 1
        : null);

    const duration = deal.duration || deal.raw_data?.duration_minutes || null;
    const durationFormatted = duration
        ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? String(duration % 60).padStart(2, '0') : ''}`
        : null;

    const departDate = deal.departure_date || deal.raw_data?.departure_date || '';
    const returnDate = deal.return_date || deal.raw_data?.return_date || '';

    const nights = departDate && returnDate
        ? Math.round((new Date(returnDate).getTime() - new Date(departDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const airline = deal.airline || deal.raw_data?.flights?.[0]?.airline || '';

    const priceInsights = deal.raw_data?.price_insights;
    const priceLevel = priceInsights?.price_level || deal.raw_data?.priceLevel;
    const typicalRange = priceInsights?.typical_price_range;

    const googleLink = deal.googleFlightsLink
        || deal.raw_data?.google_flights_link
        || `https://www.google.com/travel/flights?q=Flights+from+YUL+to+${deal.destination_code}&curr=CAD&hl=fr`;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: 380,
            height: '100vh',
            background: 'white',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
            zIndex: 1000,
            overflowY: 'auto',
            fontFamily: "'Outfit', sans-serif",
            animation: 'slideIn 0.3s ease-out',
        }}>
            {/* Header avec image */}
            <div style={{ position: 'relative' }}>
                <img
                    src={deal.img || `https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=200&fit=crop`}
                    alt={deal.city}
                    style={{ width: '100%', height: 180, objectFit: 'cover' }}
                />
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        fontSize: 18,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    ✕
                </button>
                {deal.discount && deal.discount > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        background: '#FF4D6A',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: 100,
                        fontSize: 13,
                        fontWeight: 700,
                    }}>
                        -{deal.discount}%
                    </div>
                )}
            </div>

            {/* Contenu */}
            <div style={{ padding: 24 }}>
                {/* Ville + pays */}
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1A2B42' }}>
                    {deal.city}
                </h2>
                {deal.country && (
                    <p style={{ margin: '4px 0 0', fontSize: 14, color: '#8FA3B8' }}>
                        {deal.country}
                    </p>
                )}

                {/* Prix */}
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span style={{
                        fontSize: 32,
                        fontWeight: 800,
                        color: '#2E7DDB',
                    }}>
                        {deal.price} $
                    </span>
                    {deal.avgPrice && deal.avgPrice > deal.price && (
                        <span style={{
                            fontSize: 16,
                            color: '#8FA3B8',
                            textDecoration: 'line-through',
                        }}>
                            {deal.avgPrice} $
                        </span>
                    )}
                    <span style={{ fontSize: 12, color: '#8FA3B8' }}>
                        aller-retour
                    </span>
                </div>

                {/* Prix level */}
                {priceLevel && (
                    <div style={{
                        marginTop: 8,
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 100,
                        fontSize: 11,
                        fontWeight: 600,
                        background: priceLevel === 'low' ? '#E8F5E9' : priceLevel === 'high' ? '#FFEBEE' : '#F5F5F5',
                        color: priceLevel === 'low' ? '#2E7D32' : priceLevel === 'high' ? '#C62828' : '#666',
                    }}>
                        {priceLevel === 'low' ? '📉 Prix bas' : priceLevel === 'high' ? '📈 Prix élevé' : '📊 Prix typique'}
                    </div>
                )}

                {typicalRange && typicalRange.length >= 2 && (
                    <p style={{ marginTop: 6, fontSize: 12, color: '#8FA3B8' }}>
                        Fourchette typique : {typicalRange[0]}$ – {typicalRange[1]}$
                    </p>
                )}

                {/* Séparateur */}
                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #F0F0F0' }} />

                {/* Détails du vol */}
                <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#1A2B42' }}>
                    Détails du vol
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Route */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#8FA3B8' }}>Route</span>
                        <span style={{ color: '#1A2B42', fontWeight: 600 }}>
                            YUL → {deal.destination_code || ''}
                        </span>
                    </div>

                    {/* Compagnie */}
                    {airline && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: '#8FA3B8' }}>Compagnie</span>
                            <span style={{ color: '#1A2B42', fontWeight: 600 }}>{airline}</span>
                        </div>
                    )}

                    {/* Escales */}
                    {stops !== null && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: '#8FA3B8' }}>Escales</span>
                            <span style={{
                                color: stops === 0 ? '#2E7D32' : '#1A2B42',
                                fontWeight: 600
                            }}>
                                {stops === 0 ? '✅ Direct' : `${stops} escale${stops > 1 ? 's' : ''}`}
                            </span>
                        </div>
                    )}

                    {/* Durée */}
                    {durationFormatted && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: '#8FA3B8' }}>Durée</span>
                            <span style={{ color: '#1A2B42', fontWeight: 600 }}>{durationFormatted}</span>
                        </div>
                    )}

                    {/* Dates */}
                    {departDate && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: '#8FA3B8' }}>Départ</span>
                            <span style={{ color: '#1A2B42', fontWeight: 600 }}>{formatDate(departDate)}</span>
                        </div>
                    )}
                    {returnDate && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: '#8FA3B8' }}>Retour</span>
                            <span style={{ color: '#1A2B42', fontWeight: 600 }}>{formatDate(returnDate)}</span>
                        </div>
                    )}

                    {/* Nuits */}
                    {nights && nights > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: '#8FA3B8' }}>Durée séjour</span>
                            <span style={{ color: '#1A2B42', fontWeight: 600 }}>{nights} nuits</span>
                        </div>
                    )}

                    {/* Bagages */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#8FA3B8' }}>Bagages</span>
                        <span style={{ color: '#8FA3B8', fontWeight: 500, fontSize: 12 }}>
                            Vérifier sur Google Flights
                        </span>
                    </div>
                </div>

                {/* Séparateur */}
                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #F0F0F0' }} />

                {/* Bouton réserver */}
                <a
                    href={googleLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'block',
                        width: '100%',
                        padding: '14px 0',
                        background: 'linear-gradient(135deg, #2E7DDB, #1B5BA0)',
                        color: 'white',
                        textAlign: 'center',
                        borderRadius: 12,
                        fontSize: 15,
                        fontWeight: 700,
                        textDecoration: 'none',
                        fontFamily: "'Outfit', sans-serif",
                    }}
                >
                    Voir sur Google Flights ✈️
                </a>

                <p style={{ marginTop: 8, fontSize: 11, color: '#8FA3B8', textAlign: 'center' }}>
                    Prix trouvé le {new Date().toLocaleDateString('fr-CA')} • Peut varier
                </p>
            </div>
        </div>
    );
}
