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

                    <div style={{
                        width: '100%',
                        flex: isMobile ? '0 0 auto' : '0 0 auto', // Permettre au hero de prendre sa place
                        position: 'relative',
                        overflow: 'hidden',
                        marginBottom: 0,
                        paddingBottom: 0,
                    }}>
                        <MapTopbar prices={prices} />

                        {/* Hero mini — accroche émotionnelle */}
                        <div style={{
                            textAlign: 'center',
                            padding: isMobile ? '12px 16px 0' : '20px 24px 0',
                            background: 'transparent',
                            position: 'relative',
                            zIndex: 10,
                            marginTop: isMobile ? 40 : 50, // Sous la topbar absolue
                        }}>
                            <h1 style={{
                                fontFamily: "'Fredoka', sans-serif",
                                fontSize: isMobile ? 20 : 28,
                                fontWeight: 700,
                                color: '#1A2B42',
                                lineHeight: 1.2,
                                marginBottom: 4,
                            }}>
                                Les meilleurs prix de vols depuis{' '}
                                <span style={{
                                    background: 'linear-gradient(135deg, #2E7DDB, #06B6D4)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>Montréal</span>
                            </h1>
                            <p style={{
                                fontSize: isMobile ? 12 : 14,
                                color: '#5A7089',
                                maxWidth: 480,
                                margin: '0 auto',
                                lineHeight: 1.5,
                            }}>
                                On scanne des centaines de vols chaque jour pour te trouver les rabais que les autres manquent.
                            </p>
                        </div>

                        <div style={{
                            height: isMobile ? '40vh' : '400px',
                            position: 'relative',
                        }}>
                            <MapCanvas
                                deals={prices} // Pass live prices to map
                                mapView={mapView}
                                isMobile={isMobile}
                                onRegionSelect={(region) => {
                                    console.log("Selected region:", region);
                                    setSelectedRegion(region); // New state needed
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
                                onSelectDeal={(deal: any, e: any) => { // Added explicit types
                                    setSelectedFlight(deal);
                                    setBookingOpen(true);
                                    setConfettiPos({ x: e.clientX, y: e.clientY });
                                    setConfettiTrigger(prev => prev + 1);
                                }}
                            />
                        </div>

                    </div>
                    <Onboarding />

                    <HoverCard
                        deal={hoveredDeal}
                        x={hoverPos.x}
                        y={hoverPos.y}
                        visible={hoverVisible}
                    />

                    <PremiumBanner />
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
