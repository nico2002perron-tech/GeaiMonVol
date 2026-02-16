'use client';
import { useState, useEffect } from 'react';

interface LivePrice {
    destination: string;
    destination_code: string;
    price: number;
    airline: string;
    stops: number;
    departure_date: string;
    return_date: string;
    scanned_at: string;
}

export function useLivePrices() {
    const [prices, setPrices] = useState<LivePrice[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await fetch('/api/prices');
                const data = await res.json();

                if (data.prices && data.prices.length > 0) {
                    setPrices(data.prices);
                    setLastUpdated(data.updatedAt);
                }
            } catch (error) {
                console.error('Failed to fetch live prices:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();

        // Refresh every 5 minutes
        const interval = setInterval(fetchPrices, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return { prices, loading, lastUpdated };
}
