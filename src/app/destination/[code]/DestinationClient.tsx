'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import DestinationHero from '@/components/destination/DestinationHero';
import PriceCalendar from '@/components/destination/PriceCalendar';
import BestMonths from '@/components/destination/BestMonths';
import PackBuilder from '@/components/destination/PackBuilder';
import TravelIntelligence from '@/components/destination/TravelIntelligence';
import MonthlyComparison from '@/components/destination/MonthlyComparison';
import AIAnalysisCard, { AIAnalysis } from '@/components/destination/AIAnalysisCard';
import { PremiumLock } from '@/components/destination/ui';
import { FlightDeal, HotelInfo, TravelIntel, MonthStats, PackAnalysis } from '@/components/destination/types';
import { getTripNights } from '@/components/destination/helpers';
import { CITY_IMAGES, DEFAULT_CITY_IMAGE, ALL_INCLUSIVE_CODES } from '@/lib/constants/deals';
import { usePremium } from '@/lib/hooks/usePremium';
import { PostAnalysisNudge } from '@/components/ui/PremiumNudge';
import Footer from '@/components/layout/Footer';

interface DestinationClientProps {
    code: string;
    city: string;
    country: string;
}

export default function DestinationClient({ code, city, country }: DestinationClientProps) {
    const { isPremium, loading: premiumLoading } = usePremium();
    const showPremiumContent = isPremium || premiumLoading;
    const isAllInclusive = ALL_INCLUSIVE_CODES.includes(code);

    // ── Core deal data ──
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [dealLevel, setDealLevel] = useState('normal');
    const [discount, setDiscount] = useState(0);
    const [cheapestAirline, setCheapestAirline] = useState('');

    // ── All flights ──
    const [flights, setFlights] = useState<FlightDeal[]>([]);
    const [flightsLoading, setFlightsLoading] = useState(true);

    // ── Hotels ──
    const [hotels, setHotels] = useState<HotelInfo[]>([]);
    const [hotelsLoading, setHotelsLoading] = useState(false);

    // ── Pack builder state ──
    const [packStep, setPackStep] = useState<0 | 1 | 2>(0);
    const [selectedFlight, setSelectedFlight] = useState<FlightDeal | null>(null);
    const [selectedHotel, setSelectedHotel] = useState<HotelInfo | null>(null);
    const [packAnalysis, setPackAnalysis] = useState<PackAnalysis | null>(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);

    // ── Travel intelligence ──
    const [travelIntel, setTravelIntel] = useState<TravelIntel | null>(null);
    const [intelLoading, setIntelLoading] = useState(false);

    // ── Calendar ──
    const [calendarDates, setCalendarDates] = useState<Record<string, any>>({});
    const [cheapestMonth, setCheapestMonth] = useState('');
    const [calendarLoading, setCalendarLoading] = useState(true);

    // ── Monthly data ──
    const [monthlyData, setMonthlyData] = useState<{ months: MonthStats[]; totalDataPoints: number } | null>(null);
    const [monthlyLoading, setMonthlyLoading] = useState(false);

    // ── AI Analysis ──
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
    const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);

    const imageUrl = CITY_IMAGES[city] || DEFAULT_CITY_IMAGE;

    // ════════════════════════════════════════════════
    // DATA FETCHING
    // ════════════════════════════════════════════════

    // Fetch flights
    useEffect(() => {
        setFlightsLoading(true);
        fetch(`/api/prices/destination?code=${code}`)
            .then(r => r.json())
            .then(data => {
                if (data.deals && data.deals.length > 0) {
                    setFlights(data.deals);
                    const best = data.deals[0];
                    setCurrentPrice(Math.round(best.price));
                    setDealLevel(best.dealLevel || 'normal');
                    setDiscount(best.discount || 0);
                    setCheapestAirline(best.airline || '');
                }
            })
            .catch(() => {})
            .finally(() => setFlightsLoading(false));
    }, [code]);

    // Fetch hotels (premium OR all-inclusive)
    useEffect(() => {
        if (!code || (!isPremium && !isAllInclusive)) return;
        setHotelsLoading(true);
        fetch(`/api/prices/hotels?code=${encodeURIComponent(code)}`)
            .then(res => {
                if (res.status === 403 || res.status === 401) return { hotels: [] };
                return res.json();
            })
            .then(data => {
                setHotels((data.hotels || []).filter((h: any) => !h.stars || h.stars >= 3));
            })
            .catch(() => setHotels([]))
            .finally(() => setHotelsLoading(false));
    }, [code, isPremium, isAllInclusive]);

    // Fetch travel intelligence (premium)
    useEffect(() => {
        if (!isPremium || !code) return;
        setIntelLoading(true);
        fetch(`/api/prices/travel-intel?code=${encodeURIComponent(code)}&city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`)
            .then(res => res.json())
            .then(data => {
                if (data.tagline) setTravelIntel(data);
            })
            .catch(() => {})
            .finally(() => setIntelLoading(false));
    }, [code, city, country, isPremium]);

    // Fetch calendar
    useEffect(() => {
        setCalendarLoading(true);
        fetch(`/api/prices/calendar?code=${code}&months=6`)
            .then(r => r.json())
            .then(data => {
                setCalendarDates(data.dates || {});
                setCheapestMonth(data.cheapestMonth || '');
            })
            .catch(() => {})
            .finally(() => setCalendarLoading(false));
    }, [code]);

    // Premium: Monthly data
    useEffect(() => {
        if (!isPremium || !code) return;
        setMonthlyLoading(true);
        fetch(`/api/prices/monthly?code=${encodeURIComponent(code)}&years=1`)
            .then(res => res.json())
            .then(data => { if (data.months) setMonthlyData({ months: data.months, totalDataPoints: data.totalDataPoints || 0 }); })
            .catch(() => {})
            .finally(() => setMonthlyLoading(false));
    }, [code, isPremium]);

    // AI Analysis (agent de voyage) — gratuit pour tous
    useEffect(() => {
        if (!code || currentPrice === null || currentPrice <= 0) return;
        setAiAnalysisLoading(true);
        fetch(`/api/prices/ai-analysis?code=${encodeURIComponent(code)}&city=${encodeURIComponent(city)}&price=${currentPrice}`)
            .then(res => res.json())
            .then(data => { if (data.verdict) setAiAnalysis(data); })
            .catch(() => {})
            .finally(() => setAiAnalysisLoading(false));
    }, [code, city, currentPrice]);

    // Fetch pack analysis when both flight and hotel are selected
    useEffect(() => {
        if (!selectedFlight || !selectedHotel || packAnalysis) return;
        setAnalysisLoading(true);
        const nights = getTripNights(selectedFlight.departureDate, selectedFlight.returnDate) || 7;
        fetch('/api/prices/pack-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                destination: city,
                destination_code: code,
                flight_price: selectedFlight.price,
                hotel_name: selectedHotel.name,
                hotel_stars: selectedHotel.stars,
                hotel_rating: selectedHotel.rating,
                hotel_review_count: selectedHotel.reviewCount,
                hotel_price_per_night: selectedHotel.pricePerNight,
                hotel_amenities: selectedHotel.amenities || [],
                nights,
                departure_date: selectedFlight.departureDate,
                return_date: selectedFlight.returnDate,
                airline: selectedFlight.airline,
                stops: selectedFlight.stops,
            }),
        })
            .then(res => res.json())
            .then(data => { if (!data.error) setPackAnalysis(data); })
            .catch(() => {})
            .finally(() => setAnalysisLoading(false));
    }, [selectedFlight, selectedHotel, city, code, packAnalysis]);

    // ── Computed ──
    const recommendedHotel = useMemo(() => {
        if (hotels.length === 0) return null;
        if (hotels.length === 1) return hotels[0];
        const maxP = Math.max(...hotels.map(h => h.pricePerNight));
        const maxR = Math.max(...hotels.map(h => h.rating), 1);
        return hotels.reduce((best, h) => {
            const s = (maxP > 0 ? ((maxP - h.pricePerNight) / maxP) * 0.4 : 0) + (maxR > 0 ? (h.rating / maxR) * 0.6 : 0);
            const bs = (maxP > 0 ? ((maxP - best.pricePerNight) / maxP) * 0.4 : 0) + (maxR > 0 ? (best.rating / maxR) * 0.6 : 0);
            return s > bs ? h : best;
        });
    }, [hotels]);

    const selectedNights = useMemo(() => {
        if (!selectedFlight) return 7;
        const n = getTripNights(selectedFlight.departureDate, selectedFlight.returnDate);
        return n > 0 ? n : 7;
    }, [selectedFlight]);

    const combinedTotal = useMemo(() => {
        if (!selectedFlight || !selectedHotel) return null;
        return Math.round(selectedFlight.price + selectedHotel.pricePerNight * selectedNights);
    }, [selectedFlight, selectedHotel, selectedNights]);

    const sortedFlights = useMemo(() =>
        [...flights].sort((a, b) => a.price - b.price).slice(0, 15),
    [flights]);

    // Auto-select recommended hotel when entering step 2
    useEffect(() => {
        if (packStep === 2 && recommendedHotel && !selectedHotel) {
            setSelectedHotel(recommendedHotel);
        }
    }, [packStep, recommendedHotel, selectedHotel]);

    // ════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
            <Navbar dark />

            <main style={{ maxWidth: 800, margin: '0 auto', padding: '90px 16px 40px' }}>
                {/* Back link */}
                <a href="/" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13,
                    color: '#64748B', textDecoration: 'none', fontFamily: "'Outfit', sans-serif",
                    fontWeight: 500, marginBottom: 16,
                }}>
                    &larr; Retour au palmarès
                </a>

                {/* Hero */}
                <DestinationHero
                    destination={city} destinationCode={code} country={country}
                    currentPrice={currentPrice} dealLevel={dealLevel} discount={discount}
                    imageUrl={imageUrl} cheapestAirline={cheapestAirline}
                />

                {/* Cheapest month */}
                {cheapestMonth && (
                    <div style={{
                        background: 'linear-gradient(135deg, #ECFDF5, #F0FDFA)',
                        border: '1px solid #A7F3D0', borderRadius: 14, padding: '12px 18px',
                        marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <span style={{ fontSize: 20 }}>💡</span>
                        <span style={{ fontSize: 13, color: '#065F46', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                            Le mois le moins cher pour partir à {city} est <strong>{cheapestMonth}</strong>
                        </span>
                    </div>
                )}

                {/* ═══ PACK BUILDER ═══ */}
                {(flights.length > 0 || flightsLoading) && (hotels.length > 0 || hotelsLoading || isAllInclusive || isPremium) && (() => {
                    const packContent = (
                        <PackBuilder
                            city={city} code={code} isAllInclusive={isAllInclusive}
                            flights={flights} sortedFlights={sortedFlights}
                            hotels={hotels} hotelsLoading={hotelsLoading}
                            packStep={packStep} setPackStep={setPackStep}
                            selectedFlight={selectedFlight} setSelectedFlight={setSelectedFlight}
                            selectedHotel={selectedHotel} setSelectedHotel={setSelectedHotel}
                            selectedNights={selectedNights} combinedTotal={combinedTotal}
                            recommendedHotel={recommendedHotel}
                            packAnalysis={packAnalysis} setPackAnalysis={setPackAnalysis}
                            analysisLoading={analysisLoading}
                        />
                    );
                    return showPremiumContent ? packContent : (
                        <PremiumLock label="Pack Builder — Vol + Hôtel avec analyse IA">
                            {packContent}
                        </PremiumLock>
                    );
                })()}

                {/* ═══ AI ANALYSIS — AGENT DE VOYAGE (gratuit) ═══ */}
                {(aiAnalysisLoading || aiAnalysis) && (
                    <AIAnalysisCard analysis={aiAnalysis} loading={aiAnalysisLoading} city={city} />
                )}

                {/* ─── Post-analysis premium nudge ─── */}
                {aiAnalysis && !showPremiumContent && (
                    <PostAnalysisNudge city={city} />
                )}

                {/* ═══ TRAVEL INTELLIGENCE ═══ */}
                {(intelLoading || travelIntel) && (() => {
                    const intelContent = (
                        <TravelIntelligence
                            travelIntel={travelIntel}
                            intelLoading={intelLoading}
                            city={city}
                        />
                    );
                    return showPremiumContent ? intelContent : (
                        <PremiumLock label="Intelligence Voyage — Météo, budget, culture, astuces">
                            {intelContent}
                        </PremiumLock>
                    );
                })()}

                {/* ═══ PRICE CALENDAR ═══ */}
                {!calendarLoading && Object.keys(calendarDates).length > 0 && (
                    showPremiumContent ? (
                        <div style={{ marginBottom: 24 }}><PriceCalendar dates={calendarDates} destinationCode={code} /></div>
                    ) : (
                        <PremiumLock label="Calendrier des prix — Trouve la date la moins chère">
                            <div style={{ marginBottom: 24 }}><PriceCalendar dates={calendarDates} destinationCode={code} /></div>
                        </PremiumLock>
                    )
                )}

                {/* ═══ BEST MONTHS ═══ */}
                {!calendarLoading && Object.keys(calendarDates).length > 0 && (
                    showPremiumContent ? (
                        <div style={{ marginBottom: 24 }}><BestMonths dates={calendarDates} /></div>
                    ) : (
                        <PremiumLock label="Meilleurs mois — Économise jusqu'à 40%">
                            <div style={{ marginBottom: 24 }}><BestMonths dates={calendarDates} /></div>
                        </PremiumLock>
                    )
                )}

                {/* ═══ MONTHLY COMPARISON ═══ */}
                {(monthlyLoading || (monthlyData && monthlyData.months.some(m => m.count > 0))) && (() => {
                    const content = <MonthlyComparison monthlyData={monthlyData} monthlyLoading={monthlyLoading} />;
                    return showPremiumContent ? content : <PremiumLock label="Comparaison mensuelle — Tendances sur 12 mois">{content}</PremiumLock>;
                })()}

                {/* JSON-LD */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org', '@type': 'Product',
                        name: `Vol Montréal → ${city}`,
                        description: `Meilleur prix pour un vol aller-retour Montréal (YUL) → ${city} (${code})`,
                        offers: currentPrice ? { '@type': 'Offer', priceCurrency: 'CAD', price: currentPrice, availability: 'https://schema.org/InStock' } : undefined,
                    }),
                }} />
            </main>

            <Footer />
        </div>
    );
}
