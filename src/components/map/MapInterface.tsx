'use client';
import { useState, useEffect } from 'react';
import PremiumBanner from './PremiumBanner';
import MapCanvas from './MapCanvas';
import DealStrip from '@/components/deals/DealStrip';
import Sidebar from './Sidebar';
import BookingPanel from './BookingPanel';
import HowItWorksModal from '@/components/ui/HowItWorksModal';
import MapTopbar from './MapTopbar';
import HoverCard from './HoverCard';
import GeaiAssistant from './GeaiAssistant';
// import SocialTicker from './SocialTicker';
// import DealOfTheDay from './DealOfTheDay';
import Confetti from './Confetti';
import Onboarding from './Onboarding';
import { useLivePrices } from '@/lib/hooks/useLivePrices';
import DealSidebar from '@/components/deals/DealSidebar';

export default function MapInterface() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [appReady, setAppReady] = useState(true);
    const [selectedRegion, setSelectedRegion] = useState<string | undefined>();
    const [selectedFlight, setSelectedFlight] = useState<any>(null); // State for booking
    const [mapView, setMapView] = useState<'world' | 'canada'>('world');
    const [selectedDeal, setSelectedDeal] = useState<any>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [showPremiumBanner, setShowPremiumBanner] = useState(true);

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

    useEffect(() => {
        // App is ready immediately
        setAppReady(true);
    }, []);

    const { prices, loading: pricesLoading, lastUpdated } = useLivePrices();
    console.log('[MapInterface] Live prices:', prices?.length, prices);

    return (
        <>


            <div id="map-app">
                <div id="app" className={appReady ? 'show' : ''} style={{
                    position: 'relative',
                    height: '100vh',
                    width: '100vw',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}>

                    <MapTopbar prices={prices} />

                    {/* Premium banner — juste sous le header */}
                    {showPremiumBanner && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 16,
                            padding: '7px 24px',
                            background: 'linear-gradient(135deg, #1A2B42 0%, #2E4A6E 100%)',
                            flexShrink: 0,
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            {/* Orbes décoratifs */}
                            <div style={{
                                position: 'absolute', left: -30, top: -30,
                                width: 80, height: 80, borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(46,125,219,0.2) 0%, transparent 70%)',
                            }} />
                            <div style={{
                                position: 'absolute', right: -20, top: -20,
                                width: 60, height: 60, borderRadius: '50%',
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
                            <button
                                onClick={() => { /* router.push('/pricing') */ }}
                                style={{
                                    padding: '4px 14px', borderRadius: 100, border: 'none',
                                    background: 'white', color: '#1A2B42', fontSize: 11,
                                    fontWeight: 700, cursor: 'pointer',
                                    fontFamily: "'Outfit', sans-serif", zIndex: 1,
                                }}
                            >
                                Essayer →
                            </button>
                            <button
                                onClick={() => setShowPremiumBanner(false)}
                                style={{
                                    position: 'absolute', right: 12, top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none', border: 'none',
                                    color: 'rgba(255,255,255,0.4)',
                                    fontSize: 14, cursor: 'pointer', zIndex: 1,
                                    padding: '4px 8px',
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <div style={{
                        width: '100%',
                        flex: '1 1 auto',
                        minHeight: 0,
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        <MapCanvas
                            deals={prices}
                            mapView={mapView}
                            isMobile={isMobile}
                            onRegionSelect={(region) => {
                                console.log("Selected region:", region);
                                setSelectedRegion(region);
                                setSidebarOpen(true);
                            }}
                            onHoverDeal={(deal, e) => {
                                setHoveredDeal(deal);
                                setHoverPos({ x: e.clientX, y: e.clientY });
                                setHoverVisible(true);
                            }}
                            onLeaveDeal={() => {
                                setHoverVisible(false);
                            }}
                            onSelectDeal={(deal: any, e: any) => {
                                setSelectedFlight(deal);
                                setBookingOpen(true);
                                setConfettiPos({ x: e.clientX, y: e.clientY });
                                setConfettiTrigger(prev => prev + 1);
                            }}
                        />
                    </div>
                    <Onboarding />

                    <HoverCard
                        deal={hoveredDeal}
                        x={hoverPos.x}
                        y={hoverPos.y}
                        visible={hoverVisible}
                    />

                    {/* <DealOfTheDay /> */}
                    {/* <SocialTicker /> */}
                    {/* <SocialTicker /> */}
                    <DealStrip
                        deals={prices}
                        loading={pricesLoading}
                        onViewChange={setMapView}
                        onDealClick={setSelectedDeal}
                    />
                    <DealSidebar deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
                    <Sidebar
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        selectedRegion={selectedRegion}
                        // Pass a handler to select flight from Sidebar
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
            </div>
        </>
    );
}
