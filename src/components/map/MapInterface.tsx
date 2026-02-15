'use client';
import { useState, useEffect } from 'react';
import PremiumBanner from './PremiumBanner';
import MapCanvas from './MapCanvas';
import DealStrip from '@/components/deals/DealStrip';
import Sidebar from './Sidebar';
import BookingPanel from './BookingPanel';
import HowItWorksModal from '@/components/ui/HowItWorksModal';
import Loader from './Loader';
import MapTopbar from './MapTopbar';
import HoverCard from './HoverCard';
import GeaiAssistant from './GeaiAssistant';

export default function MapInterface() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [appReady, setAppReady] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState<string | undefined>();
    const [selectedFlight, setSelectedFlight] = useState<any>(null); // State for booking

    useEffect(() => {
        // Simulate app ready after loader
        const timer = setTimeout(() => setAppReady(true), 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <Loader />

            <div id="map-app">
                <div id="app" className={appReady ? 'show' : ''} style={{ position: 'relative', height: '100vh', width: '100vw', overflow: 'hidden' }}>

                    <MapCanvas
                        onRegionSelect={(region) => {
                            console.log("Selected region:", region);
                            setSelectedRegion(region); // New state needed
                            setSidebarOpen(true);
                        }}
                        onHoverDeal={(deal, e) => {
                            // Logic to show hover card
                            const el = document.getElementById('hcard');
                            if (el && document.getElementById('hcCity')) {
                                // Populate hover card manually or via state if HoverCard was fully controlled
                                // For now, adapting legacy direct manipulation:
                                const hcImg = document.getElementById('hcImg') as HTMLImageElement;
                                if (hcImg) hcImg.src = deal.img || ''; // Handle potential missing prop

                                const setTxt = (id: string, val: string) => {
                                    const t = document.getElementById(id);
                                    if (t) t.textContent = val;
                                };
                                setTxt('hcCity', deal.city || ''); // Assuming deal matches Flight interface
                                setTxt('hcCountry', deal.country || '');
                                setTxt('hcPrice', (deal.price || 0) + ' $');

                                // Positioning logic
                                // This part is tricky without the ref to the specific pin element.
                                // Pass coordinates or ref from MapPin if needed.
                                // For now, using mouse event as approximation or legacy logic needs element rect

                                el.classList.add('show');
                                // Position update skipped for brevity - strongly suggest fully React-ifying HoverCard in next step
                            }
                        }}
                        onLeaveDeal={() => {
                            document.getElementById('hcard')?.classList.remove('show');
                        }}
                        onSelectDeal={(deal) => { // Added onSelectDeal prop
                            setSelectedFlight(deal);
                            setBookingOpen(true);
                        }}
                    />

                    <MapTopbar />

                    <HoverCard />

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
