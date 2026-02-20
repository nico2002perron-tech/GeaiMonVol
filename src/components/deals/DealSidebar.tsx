'use client';

import { useState, useEffect, useRef } from 'react';
import GuidePanel from './GuidePanel';

interface DealDetail {
    city: string;
    destination?: string;
    country?: string;
    code?: string;
    destination_code?: string;
    price: number;
    currency?: string;
    discount?: number;
    disc?: number;
    oldPrice?: number;
    avgPrice?: number;
    dealLevel?: string;
    priceLevel?: string;
    airline?: string;
    departure_date?: string;
    return_date?: string;
    stops?: number;
    duration?: number;
    route?: string;
    dates?: string;
    source?: string;
    googleFlightsLink?: string;
    raw_data?: any;
    img?: string;
    imgSmall?: string;
    all_inclusive?: boolean;
    package_type?: string;
}

interface DealSidebarProps {
    deal: DealDetail | null;
    onClose: () => void;
    activeTab?: string;
}

// ── Destinations where a guide has no value (pure resort towns) ──
const RESORT_DESTINATIONS = new Set([
    'Punta Cana', 'Cuba (Varadero)', 'Varadero', 'Montego Bay',
    'Cayo Coco', 'Cayo Santa Maria', 'Puerto Plata', 'Riviera Maya',
    'Huatulco', 'Puerto Vallarta', 'Ixtapa', 'Holguin', 'Samana', 'Roatán',
]);

const RESORT_CODES = new Set([
    'PUJ', 'VRA', 'MBJ', 'CCC', 'SNU', 'POP', 'HUX', 'PVR', 'ZIH', 'HOG', 'AZS', 'RTB',
]);

function shouldShowGuide(deal: DealDetail, activeTab?: string): boolean {
    if (activeTab === 'tout-inclus') return false;
    if (deal.all_inclusive === true) return false;
    if (deal.package_type === 'all_inclusive' || deal.package_type === 'resort') return false;
    const city = deal.city || deal.destination || '';
    if (RESORT_DESTINATIONS.has(city)) return false;
    const code = deal.destination_code || deal.code || '';
    if (RESORT_CODES.has(code)) return false;
    return true;
}

const AIRLINE_BAGGAGE: Record<string, { cabin: boolean; checked: boolean; label: string }> = {
    'Air Canada': { cabin: true, checked: true, label: '🧳 Cabine + enregistré inclus' },
    'WestJet': { cabin: true, checked: false, label: '🎒 Cabine inclus' },
    'Air Transat': { cabin: true, checked: true, label: '🧳 Cabine + enregistré inclus' },
    'Porter Airlines': { cabin: true, checked: true, label: '🧳 Cabine + enregistré inclus' },
    'Delta': { cabin: true, checked: false, label: '🎒 Cabine inclus' },
    'United': { cabin: true, checked: false, label: '🎒 Cabine inclus' },
    'American Airlines': { cabin: true, checked: false, label: '🎒 Cabine inclus' },
    'JetBlue': { cabin: true, checked: false, label: '🎒 Cabine inclus' },
    'Southwest': { cabin: true, checked: true, label: '🧳 Cabine + 2 enregistrés inclus' },
    'Flair Airlines': { cabin: false, checked: false, label: '⚠️ Aucun bagage inclus' },
    'Spirit': { cabin: false, checked: false, label: '⚠️ Aucun bagage inclus' },
    'Frontier': { cabin: false, checked: false, label: '⚠️ Aucun bagage inclus' },
    'Lynx Air': { cabin: false, checked: false, label: '⚠️ Aucun bagage inclus' },
    'Swoop': { cabin: false, checked: false, label: '⚠️ Aucun bagage inclus' },
};

export default function DealSidebar({ deal, onClose, activeTab }: DealSidebarProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [guideOpen, setGuideOpen] = useState(false);
    const guideDealRef = useRef<DealDetail | null>(null);

    useEffect(() => {
        setIsMobile(window.innerWidth <= 768);
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (deal) setGuideOpen(false);
    }, [deal]);

    // If guide is open, render ONLY the GuidePanel (sidebar is closed)
    if (guideOpen && guideDealRef.current) {
        return (
            <GuidePanel
                isOpen={true}
                onClose={() => {
                    setGuideOpen(false);
                    guideDealRef.current = null;
                }}
                deal={guideDealRef.current}
            />
        );
    }

    if (!deal) return null;

    const showGuide = shouldShowGuide(deal, activeTab);

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

    const handleOpenGuide = () => {
        guideDealRef.current = deal;
        onClose();
        setTimeout(() => setGuideOpen(true), 50);
    };

    return (
        <>
            {/* Overlay */}
            <div onClick={onClose} style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.4)', zIndex: 999,
                backdropFilter: isMobile ? 'none' : 'blur(2px)',
            }} />

            <div style={{
                position: 'fixed',
                ...(isMobile ? {
                    bottom: 0, left: 0, right: 0, width: '100%',
                    maxHeight: '85vh',
                    borderTopLeftRadius: 20, borderTopRightRadius: 20,
                } : {
                    top: 0, right: 0, width: 380, height: '100vh',
                }),
                background: 'white',
                boxShadow: isMobile ? '0 -4px 20px rgba(0,0,0,0.15)' : '-4px 0 20px rgba(0,0,0,0.1)',
                zIndex: 1000, overflowY: 'auto',
                fontFamily: "'Outfit', sans-serif",
                animation: isMobile ? 'slideUp 0.3s ease-out' : 'slideIn 0.3s ease-out',
            }}>
                {isMobile && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
                        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E2E8F0' }} />
                    </div>
                )}

                {/* Header */}
                <div style={{ position: 'relative' }}>
                    <img
                        src={deal.img || 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=200&fit=crop'}
                        alt={deal.city || deal.destination || 'Destination'}
                        style={{ width: '100%', height: isMobile ? 140 : 180, objectFit: 'cover' }}
                    />
                    <button onClick={onClose} style={{
                        position: 'absolute', top: 12, right: 12,
                        background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none',
                        borderRadius: '50%', width: 32, height: 32, fontSize: 18,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                    {deal.discount && deal.discount > 0 && (
                        <div style={{
                            position: 'absolute', top: 12, left: 12,
                            background: '#FF4D6A', color: 'white',
                            padding: '4px 10px', borderRadius: 100, fontSize: 13, fontWeight: 700,
                        }}>-{deal.discount}%</div>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: 24 }}>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1A2B42' }}>
                        {deal.city || deal.destination || 'Destination'}
                    </h2>
                    {(deal.country || deal.raw_data?.country) && (
                        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#8FA3B8' }}>
                            {deal.country || deal.raw_data?.country}
                        </p>
                    )}

                    <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 12 }}>
                        <span style={{ fontSize: 32, fontWeight: 800, color: '#2E7DDB' }}>{deal.price} $</span>
                        {deal.avgPrice && deal.avgPrice > deal.price && (
                            <span style={{ fontSize: 16, color: '#8FA3B8', textDecoration: 'line-through' }}>{deal.avgPrice} $</span>
                        )}
                        <span style={{ fontSize: 12, color: '#8FA3B8' }}>aller-retour</span>
                    </div>

                    {priceLevel && (
                        <div style={{
                            marginTop: 8, display: 'inline-block', padding: '3px 10px',
                            borderRadius: 100, fontSize: 11, fontWeight: 600,
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

                    <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #F0F0F0' }} />

                    <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#1A2B42' }}>Détails du vol</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: '#8FA3B8' }}>Route</span>
                            <span style={{ color: '#1A2B42', fontWeight: 600 }}>YUL → {deal.destination_code || ''}</span>
                        </div>
                        {airline && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#8FA3B8' }}>Compagnie</span>
                                <span style={{ color: '#1A2B42', fontWeight: 600 }}>{airline}</span>
                            </div>
                        )}
                        {stops !== null && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#8FA3B8' }}>Escales</span>
                                <span style={{ color: stops === 0 ? '#2E7D32' : '#1A2B42', fontWeight: 600 }}>
                                    {stops === 0 ? '✅ Direct' : `${stops} escale${stops > 1 ? 's' : ''}`}
                                </span>
                            </div>
                        )}
                        {durationFormatted && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#8FA3B8' }}>Durée</span>
                                <span style={{ color: '#1A2B42', fontWeight: 600 }}>{durationFormatted}</span>
                            </div>
                        )}
                        {departDate && returnDate && (
                            <div style={{
                                marginTop: 16, padding: 14, background: '#F0F7FF',
                                borderRadius: 10, display: 'flex',
                                justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 11, color: '#8FA3B8' }}>Départ</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1A2B42' }}>{formatDate(departDate)}</div>
                                </div>
                                <div style={{ fontSize: 18, color: '#2E7DDB' }}>→</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 11, color: '#8FA3B8' }}>Retour</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1A2B42' }}>{formatDate(returnDate)}</div>
                                </div>
                                {nights && nights > 0 && (
                                    <div style={{
                                        background: '#2E7DDB', color: 'white',
                                        padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                                    }}>{nights} nuits</div>
                                )}
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: '#8FA3B8' }}>Bagages</span>
                            <span style={{
                                color: AIRLINE_BAGGAGE[airline]?.cabin ? '#2E7D32' : '#C62828',
                                fontWeight: 600, fontSize: 12,
                            }}>
                                {AIRLINE_BAGGAGE[airline]?.label || '📋 Vérifier avant de réserver'}
                            </span>
                        </div>
                    </div>

                    <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #F0F0F0' }} />

                    {/* ═══ GUIDE GeaiAI — only for exploration destinations ═══ */}
                    {showGuide && (
                        <button onClick={handleOpenGuide} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 10, width: '100%', padding: '14px 0',
                            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                            color: 'white', textAlign: 'center', borderRadius: 12,
                            fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                            boxShadow: '0 4px 16px rgba(124,58,237,0.25)', marginBottom: 10,
                        }}>
                            <span style={{ fontSize: 18 }}>🤖</span>
                            Générer mon Guide GeaiAI
                            <span style={{
                                fontSize: 8, fontWeight: 800,
                                background: 'rgba(255,255,255,0.2)',
                                padding: '2px 8px', borderRadius: 100,
                            }}>1 GRATUIT</span>
                        </button>
                    )}

                    <a href={googleLink} target="_blank" rel="noopener noreferrer" style={{
                        display: 'block', width: '100%', padding: '14px 0',
                        background: 'linear-gradient(135deg, #2E7DDB, #1B5BA0)',
                        color: 'white', textAlign: 'center', borderRadius: 12,
                        fontSize: 15, fontWeight: 700, textDecoration: 'none',
                        fontFamily: "'Outfit', sans-serif",
                    }}>
                        Réserver ce vol – {deal.price}$ ✈️
                    </a>

                    <p style={{ marginTop: 8, fontSize: 11, color: '#8FA3B8', textAlign: 'center' }}>
                        Prix trouvé le {new Date().toLocaleDateString('fr-CA')} • Peut varier
                    </p>
                </div>
            </div>
        </>
    );
}
