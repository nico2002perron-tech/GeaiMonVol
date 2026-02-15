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
                        onSelectDeal={(deal) => { // Added onSelectDeal prop
                            setSelectedFlight(deal);
                            setBookingOpen(true);
                        }}
                    />

                    <MapTopbar />

                    <HoverCard
                        deal={hoveredDeal}
                        x={hoverPos.x}
                        y={hoverPos.y}
                        visible={hoverVisible}
                    />

                    <PremiumBanner />
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

                </div>
            </div>
        </>
    );
}
