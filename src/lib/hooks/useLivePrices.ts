'use client';
import { useState, useEffect, useRef } from 'react';

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
    medianPrice?: number;
    dealLevel?: string;
    historyCount?: number;
    priceLevel?: string;
    bookingLink?: string;
    raw_data?: any;
}

// Module-level cache — survives across re-renders and component mounts
let moduleCache: { prices: LivePrice[]; updatedAt: string } | null = null;

export function useLivePrices() {
    // Start with cached data or empty — no fake fallback
    const [prices, setPrices] = useState<LivePrice[]>(
        moduleCache?.prices || []
    );
    const [loading, setLoading] = useState(!moduleCache);
    const [lastUpdated, setLastUpdated] = useState<string | null>(
        moduleCache?.updatedAt || null
    );
    const [isLive, setIsLive] = useState(!!moduleCache);
    const fetchedRef = useRef(false);

    useEffect(() => {
        // If we already have cached data, don't show loading
        if (moduleCache) {
            setPrices(moduleCache.prices);
            setIsLive(true);
            setLastUpdated(moduleCache.updatedAt);
            setLoading(false);
        }

        const fetchPrices = async () => {
            try {
                const res = await fetch('/api/prices');
                const data = await res.json();

                if (data) {
                    const rawPrices = data.prices || (Array.isArray(data) ? data : []);
                    const mappedPrices = rawPrices.map((p: any) => ({
                        ...p,
                        bookingLink: p.raw_data?.booking_link || p.raw_data?.google_flights_link || '',
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
                        // Cache for next mount
                        moduleCache = {
                            prices: mappedPrices,
                            updatedAt: data.updatedAt || new Date().toISOString(),
                        };
                    }
                }
            } catch (error) {
                console.error('Failed to fetch live prices:', error);
                // Keep showing whatever we had (static fallback or cached)
            } finally {
                setLoading(false);
                fetchedRef.current = true;
            }
        };

        fetchPrices();

        // Refresh every 10 minutes (data changes only with daily cron)
        const interval = setInterval(fetchPrices, 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return { prices, loading, lastUpdated, isLive };
}
