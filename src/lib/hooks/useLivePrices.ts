'use client';
import { useState, useEffect } from 'react';
import { FLIGHTS } from '@/lib/data/flights';

interface LivePrice {
    destination: string;
    destination_code: string;
    price: number;
    airline: string;
    stops: number;
    departure_date: string;
    return_date: string;
    scanned_at: string;
    discount?: number;
    avgPrice?: number;
    dealLevel?: string;
    priceLevel?: string;
    googleFlightsLink?: string;
    raw_data?: any;
}

// Convertir les données statiques au format LivePrice pour le fallback
function getStaticFallback(): LivePrice[] {
    return FLIGHTS.map(f => ({
        destination: f.city,
        destination_code: f.route.split(' – ')[1] || '',
        price: f.price,
        airline: '',
        stops: f.stops,
        departure_date: '',
        return_date: '',
        scanned_at: '',
        discount: f.disc,
        avgPrice: f.oldPrice,
        dealLevel: f.dealLevel || (f.disc >= 40 ? 'incredible' : f.disc >= 25 ? 'great' : 'normal'),
        priceLevel: f.priceLevel,
        googleFlightsLink: '',
        raw_data: { lat: f.lat, lon: f.lon, tags: f.tags, img: f.img, imgSmall: f.imgSmall },
    }));
}

export function useLivePrices() {
    const [prices, setPrices] = useState<LivePrice[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await fetch('/api/prices');
                const data = await res.json();

                if (data) {
                    const rawPrices = data.prices || (Array.isArray(data) ? data : []);
                    const mappedPrices = rawPrices.map((p: any) => ({
                        ...p,
                        googleFlightsLink: p.raw_data?.google_flights_link || '',
                        departure_date: p.departure_date || '',
                        return_date: p.return_date || '',
                        airline: p.airline || p.raw_data?.flights?.[0]?.airline || '',
                        stops: p.stops ?? ((p.raw_data?.flights?.length || 1) - 1),
                        duration: p.raw_data?.duration_minutes || p.raw_data?.total_duration || 0,
                    }));

                    if (mappedPrices.length > 0) {
                        setPrices(mappedPrices);
                        setIsLive(true);
                        setLastUpdated(data.updatedAt || new Date().toISOString());
                    } else {
                        // API returned empty — use static fallback
                        console.warn('[useLivePrices] No live data — using static fallback');
                        setPrices(getStaticFallback());
                        setIsLive(false);
                        setLastUpdated(null);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch live prices:', error);
                // Network/API error — use static fallback
                setPrices(getStaticFallback());
                setIsLive(false);
                setLastUpdated(null);
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();

        // Refresh every 5 minutes
        const interval = setInterval(fetchPrices, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return { prices, loading, lastUpdated, isLive };
}
