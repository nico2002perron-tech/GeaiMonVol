'use client';
import { useState, useEffect, useMemo } from 'react';
import MapCanvas from './MapCanvas';
import DealStrip from '@/components/deals/DealStrip';
import Sidebar from './Sidebar';
import BookingPanel from './BookingPanel';
import HowItWorksModal from '@/components/ui/HowItWorksModal';
import MapTopbar from './MapTopbar';
import HoverCard from './HoverCard';
import GeaiAssistant from './GeaiAssistant';
import Confetti from './Confetti';
import Onboarding from './Onboarding';
import { useLivePrices } from '@/lib/hooks/useLivePrices';
import DealSidebar from '@/components/deals/DealSidebar';
import HowItWorks from '../landing/HowItWorks';
import PremiumSection from '../landing/PremiumSection';
import Footer from '../landing/Footer';

const CANADA_CODES = ['YYZ', 'YOW', 'YVR', 'YYC', 'YEG', 'YWG', 'YHZ', 'YQB'];

const LEVEL_COLORS: Record<string, { bg: string; icon: string }> = {
    lowest_ever: { bg: '#7C3AED', icon: '⚡' },
    incredible: { bg: '#DC2626', icon: '🔥' },
    great: { bg: '#EA580C', icon: '✨' },
    good: { bg: '#2E7DDB', icon: '👍' },
};

export default function MapInterface() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [appReady, setAppReady] = useState(true);
    const [selectedRegion, setSelectedRegion] = useState<string | undefined>();
    const [selectedFlight, setSelectedFlight] = useState<any>(null);
    const [mapView, setMapView] = useState<'world' | 'canada'>('world');
    const [selectedDeal, setSelectedDeal] = useState<any>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [showPremiumBanner, setShowPremiumBanner] = useState(true);
    const [activeTab, setActiveTab] = useState<'international' | 'canada'>('international');

    useEffect(() => {
        setIsMobile(window.innerWidth <= 768);
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [hoveredDeal, setHoveredDeal] = useState<any>(null);
    const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
    const [hoverVisible, setHoverVisible] = useState(false);
    const [confettiTrigger, setConfettiTrigger] = useState(0);
    const [confettiPos, setConfettiPos] = useState({ x: 0, y: 0 });

    const { prices, loading: pricesLoading, lastUpdated } = useLivePrices();

    // Handle tab switching — sync with mapView
    const handleTabChange = (tab: string) => {
        if (tab === 'international') {
            setActiveTab('international');
            setMapView('world');
        } else if (tab === 'canada') {
            setActiveTab('canada');
            setMapView('canada');
        }
    };

    // Top deals for mini carousel (sorted by discount, top 8)
    const topDeals = useMemo(() => {
        const allDeals = (prices || []).length > 0 ? prices : [];
        return [...allDeals]
            .filter((d: any) => {
                const code = d.destination_code || d.code || '';
                const isCanadian = CANADA_CODES.includes(code);
                return activeTab === 'canada' ? isCanadian : !isCanadian;
            })
            .sort((a: any, b: any) => (b.discount || 0) - (a.discount || 0))
            .slice(0, 8);
    }, [prices, activeTab]);

    const tabs = [
        { key: 'international', label: 'Monde', icon: '✈️', pro: false },
        { key: 'canada', label: 'Canada', icon: '🍁', pro: false },
        { key: 'hotels', label: 'Hôtels', icon: '🏨', pro: true },
        { key: 'planning', label: 'Planning', icon: '📍', pro: true },
    ];

    return (
        <>
            <div id="app" className={appReady ? 'show' : ''} style={{
                minHeight: '100vh',
                background: '#F4F8FB',
            }}>
                {/* ========== Section 1 : 100vh ========== */}
                <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <MapTopbar prices={prices} />

                    {/* Premium banner */}
                    {showPremiumBanner && (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 16, padding: '7px 24px',
                            background: 'linear-gradient(135deg, #1A2B42 0%, #2E4A6E 100%)',
                            flexShrink: 0, position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{
                                position: 'absolute', left: -30, top: -30, width: 80, height: 80, borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(46,125,219,0.2) 0%, transparent 70%)',
                            }} />
                            <div style={{
                                position: 'absolute', right: -20, top: -20, width: 60, height: 60, borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)',
                            }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 1 }}>
                                <span style={{ fontSize: 14 }}>⚡</span>
                                <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>
                                    <strong style={{ fontWeight: 800 }}>Premium — 5$/mois</strong>
                                    <span style={{ color: 'rgba(255,255,255,0.55)', marginLeft: 8 }}>
                                        Alertes perso · Prix record · Guides IA
                                    </span>
                                </span>
                            </div>
                            <button onClick={() => { }} style={{
                                padding: '4px 14px', borderRadius: 100, border: 'none',
                                background: 'white', color: '#1A2B42', fontSize: 11,
                                fontWeight: 700, cursor: 'pointer',
                                fontFamily: "'Outfit', sans-serif", zIndex: 1,
                            }}>
                                Essayer →
                            </button>
                            <button onClick={() => setShowPremiumBanner(false)} style={{
                                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                                fontSize: 14, cursor: 'pointer', zIndex: 1, padding: '4px 8px',
                            }}>
                                ✕
                            </button>
                        </div>
                    )}

                    {/* ONGLETS — REMONTÉS sous le premium banner */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
                        background: 'white',
                        borderTop: '1px solid rgba(26,43,66,0.06)',
                        borderBottom: '1px solid rgba(26,43,66,0.06)',
                        flexShrink: 0,
                    }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => !tab.pro && handleTabChange(tab.key)}
                                className="big-tab"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 8, padding: '11px 0', border: 'none',
                                    background: activeTab === tab.key ? 'rgba(46,125,219,0.04)' : 'transparent',
                                    cursor: tab.pro ? 'default' : 'pointer',
                                    fontFamily: "'Outfit', sans-serif", fontSize: 13.5,
                                    fontWeight: activeTab === tab.key ? 700 : 600,
                                    color: activeTab === tab.key ? '#2E7DDB' : tab.pro ? '#B0BEC5' : '#5A7089',
                                    opacity: tab.pro ? 0.6 : 1,
                                    borderRight: tab.key !== 'planning' ? '1px solid rgba(26,43,66,0.04)' : 'none',
                                    position: 'relative', transition: 'all 0.2s ease',
                                }}
                            >
                                <span style={{ fontSize: 16 }}>{tab.icon}</span>
                                <span>{tab.pro ? <s>{tab.label}</s> : tab.label}</span>
                                {tab.pro && (
                                    <span style={{
                                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                        color: 'white', fontSize: 8, fontWeight: 800,
                                        padding: '1px 6px', borderRadius: 100, marginLeft: 2,
                                    }}>PRO</span>
                                )}
                                {activeTab === tab.key && (
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: '15%', right: '15%',
                                        height: 3, borderRadius: '3px 3px 0 0', background: '#2E7DDB',
                                    }} />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Map Area — prend l'espace restant */}
                    <div style={{
                        flex: '1 1 auto', minHeight: 0, position: 'relative',
                        background: '#E2EDF7', overflow: 'hidden',
                    }}>
                        <MapCanvas
                            deals={prices}
                            mapView={mapView}
                            isMobile={isMobile}
                            onRegionSelect={(region) => {
                                setSelectedRegion(region);
                                setSidebarOpen(true);
                            }}
                            onHoverDeal={(deal, e) => {
                                setHoveredDeal(deal);
                                setHoverPos({ x: e.clientX, y: e.clientY });
                                setHoverVisible(true);
                            }}
                            onLeaveDeal={() => setHoverVisible(false)}
                            onSelectDeal={(deal: any, e: any) => {
                                setSelectedFlight(deal);
                                setBookingOpen(true);
                                setConfettiPos({ x: e.clientX, y: e.clientY });
                                setConfettiTrigger(prev => prev + 1);
                            }}
                        />

                        {/* Mini carousel + scroll hint — en bas de la carte */}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
                            background: 'linear-gradient(to top, rgba(226,237,247,0.97) 0%, rgba(226,237,247,0.8) 60%, transparent 100%)',
                            padding: isMobile ? '20px 12px 6px' : '24px 16px 6px',
                        }}>
                            {/* Title */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <span style={{
                                    fontSize: 11, fontWeight: 700, color: '#1A2B42',
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    🔥 Top deals {activeTab === 'canada' ? 'Canada' : 'du moment'}
                                </span>
                                <span style={{
                                    width: 5, height: 5, borderRadius: '50%',
                                    background: '#16A34A', animation: 'liveBlink 2s ease-in-out infinite',
                                }} />
                            </div>

                            {/* Mini cards */}
                            <div style={{
                                display: 'flex', gap: isMobile ? 8 : 10,
                                overflowX: 'auto', paddingBottom: 6,
                                scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
                            }}>
                                {topDeals.map((deal: any, i: number) => {
                                    const level = deal.dealLevel || 'good';
                                    const col = LEVEL_COLORS[level] || LEVEL_COLORS.good;
                                    const discount = deal.discount || deal.disc || 0;
                                    const city = deal.destination || deal.city || '';
                                    const code = deal.destination_code || deal.code || '';
                                    const isPremiumHighlight = i === 0 || i === 2;

                                    return (
                                        <div
                                            key={`mini-${code}-${i}`}
                                            className={`mini-deal-card${isPremiumHighlight ? ' premium-highlight-card' : ''}`}
                                            onClick={() => setSelectedDeal({
                                                city, code, price: deal.price, airline: deal.airline,
                                                stops: deal.stops, route: `YUL – ${code}`,
                                                disc: discount, dealLevel: level,
                                                destination_code: code,
                                                departure_date: deal.departure_date,
                                                return_date: deal.return_date,
                                                googleFlightsLink: deal.googleFlightsLink,
                                                raw_data: deal.raw_data,
                                                avgPrice: deal.avgPrice, discount,
                                            })}
                                            style={{
                                                minWidth: isMobile ? 125 : 140,
                                                padding: isMobile ? '7px 10px' : '8px 12px',
                                                borderRadius: 10,
                                                background: 'rgba(255,255,255,0.88)',
                                                border: isPremiumHighlight
                                                    ? '1.5px solid rgba(212,175,55,0.35)'
                                                    : '1px solid rgba(26,43,66,0.08)',
                                                backdropFilter: 'blur(8px)',
                                                cursor: 'pointer', flexShrink: 0,
                                                transition: 'all 0.2s ease',
                                                boxShadow: isPremiumHighlight
                                                    ? '0 2px 10px rgba(212,175,55,0.1)'
                                                    : '0 2px 8px rgba(26,43,66,0.06)',
                                                position: 'relative', overflow: 'hidden',
                                            }}
                                        >
                                            {isPremiumHighlight && (
                                                <>
                                                    <div className="premium-gold-shimmer" style={{
                                                        position: 'absolute', inset: 0,
                                                        background: 'linear-gradient(135deg, rgba(212,175,55,0.03) 0%, rgba(255,215,0,0.06) 50%, rgba(212,175,55,0.03) 100%)',
                                                        borderRadius: 10, pointerEvents: 'none', zIndex: 2,
                                                    }} />
                                                    <div style={{
                                                        position: 'absolute', top: 4, right: 4,
                                                        background: 'linear-gradient(135deg, #D4AF37, #F5D060)',
                                                        borderRadius: 100, padding: '2px 7px',
                                                        display: 'flex', alignItems: 'center', gap: 3,
                                                        zIndex: 3, boxShadow: '0 1px 4px rgba(212,175,55,0.2)',
                                                    }}>
                                                        <span style={{ fontSize: 7 }}>⚡</span>
                                                        <span style={{
                                                            fontSize: 7, fontWeight: 800, color: '#5C4813',
                                                            fontFamily: "'Outfit', sans-serif",
                                                        }}>Alerte perso</span>
                                                    </div>
                                                </>
                                            )}
                                            <div style={{
                                                display: 'flex', alignItems: 'center',
                                                justifyContent: 'space-between', marginBottom: 3,
                                                position: 'relative', zIndex: 1,
                                            }}>
                                                <span style={{
                                                    fontSize: isMobile ? 11 : 12, fontWeight: 700,
                                                    color: '#1A2B42', fontFamily: "'Outfit', sans-serif",
                                                }}>{city}</span>
                                                <span style={{
                                                    fontSize: 7, fontWeight: 800,
                                                    background: col.bg, color: 'white',
                                                    padding: '1px 5px', borderRadius: 100,
                                                }}>{col.icon}</span>
                                            </div>
                                            <div style={{
                                                fontSize: 9, color: '#8FA3B8', marginBottom: 5,
                                                fontFamily: "'Outfit', sans-serif",
                                                position: 'relative', zIndex: 1,
                                            }}>
                                                YUL → {code}{deal.stops === 0 ? ' · Direct' : ''}
                                            </div>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 5,
                                                position: 'relative', zIndex: 1,
                                            }}>
                                                <span style={{
                                                    fontSize: isMobile ? 13 : 15, fontWeight: 800,
                                                    color: '#2E7DDB',
                                                    fontFamily: "'Fredoka', sans-serif",
                                                }}>
                                                    {deal.price}$
                                                </span>
                                                {discount > 0 && (
                                                    <span style={{ fontSize: 9, fontWeight: 700, color: col.bg }}>
                                                        -{Math.round(discount)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Scroll hint — sous les mini cards */}
                            <a href="#deals" style={{
                                textDecoration: 'none', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                gap: 4, padding: '6px 0 2px',
                            }}>
                                <span style={{
                                    fontSize: 10, color: '#5A7089', fontWeight: 600,
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    Voir tous les deals
                                </span>
                                <div style={{ animation: 'scrollHint 2s ease-in-out infinite' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24"
                                        fill="none" stroke="#2E7DDB" strokeWidth="2.5"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                <Onboarding />

                <HoverCard
                    deal={hoveredDeal}
                    x={hoverPos.x}
                    y={hoverPos.y}
                    visible={hoverVisible}
                />

                {/* ========== Section 2 : Deals (scrollable) ========== */}
                <div id="deals">
                    <DealStrip
                        deals={prices}
                        loading={pricesLoading}
                        activeTab={activeTab}
                        onViewChange={setMapView}
                        onDealClick={setSelectedDeal}
                    />
                </div>

                {/* Section 3 */}
                <HowItWorks />

                {/* Section 4 */}
                <PremiumSection />

                {/* Footer */}
                <Footer />

                <DealSidebar deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    selectedRegion={selectedRegion}
                    onSelectFlight={(flight: any) => {
                        setSelectedFlight(flight);
                        setSidebarOpen(false);
                        setBookingOpen(true);
                    }}
                />
                <BookingPanel
                    isOpen={bookingOpen}
                    onClose={() => setBookingOpen(false)}
                    selectedFlight={selectedFlight}
                />
                <HowItWorksModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
                <GeaiAssistant onOpen={() => setBookingOpen(true)} />
                <Confetti trigger={confettiTrigger} x={confettiPos.x} y={confettiPos.y} />
            </div>
        </>
    );
}
