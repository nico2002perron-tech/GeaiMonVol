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

export default function MapInterface() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [appReady, setAppReady] = useState(true);
    const [selectedRegion, setSelectedRegion] = useState<string | undefined>();
    const [selectedFlight, setSelectedFlight] = useState<any>(null); // State for booking

    const [hoveredDeal, setHoveredDeal] = useState<any>(null);
    const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
    const [hoverVisible, setHoverVisible] = useState(false);
    const [confettiTrigger, setConfettiTrigger] = useState(0);
    const [confettiPos, setConfettiPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // App is ready immediately
        setAppReady(true);
    }, []);

    return (
        <>


            <div id="map-app">
                <div id="app" className={appReady ? 'show' : ''} style={{ position: 'relative', height: '100vh', width: '100vw', overflow: 'hidden' }}>

                    <MapCanvas
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

                    <MapTopbar onOpenHowItWorks={() => setModalOpen(true)} />

                    <HoverCard
                        deal={hoveredDeal}
                        x={hoverPos.x}
                        y={hoverPos.y}
                        visible={hoverVisible}
                    />

                    <PremiumBanner />
                    {/* <DealOfTheDay /> */}
                    {/* <SocialTicker /> */}
                    <DealStrip />
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
