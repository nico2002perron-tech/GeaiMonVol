'use client';

import { useState, useEffect, useRef } from 'react';

interface PricePoint {
    date: string;
    price: number;
}

// In-memory cache shared across all hook instances
const cache = new Map<string, PricePoint[]>();

export function usePriceHistory(destination: string | null) {
    const [data, setData] = useState<PricePoint[]>([]);
    const [loading, setLoading] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!destination) {
            setData([]);
            return;
        }

        // Return cached data immediately
        const cached = cache.get(destination);
        if (cached) {
            setData(cached);
            return;
        }

        // Abort previous in-flight request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);

        fetch(`/api/prices/history?destination=${encodeURIComponent(destination)}`, {
            signal: controller.signal,
        })
            .then((res) => res.json())
            .then((json) => {
                const points: PricePoint[] = json.points || [];
                cache.set(destination, points);
                setData(points);
            })
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    console.error('[usePriceHistory]', err);
                }
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, [destination]);

    return { data, prices: data.map((p) => p.price), loading };
}
