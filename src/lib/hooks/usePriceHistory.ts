'use client';

import { useState, useEffect, useRef } from 'react';

interface PricePoint {
    date: string;
    price: number;
}

interface PriceHistoryResult {
    points: PricePoint[];
    avg: number;
    min: number;
    max: number;
}

// In-memory cache shared across all hook instances
const cache = new Map<string, PriceHistoryResult>();

export function usePriceHistory(destination: string | null, days: number = 30) {
    const [data, setData] = useState<PriceHistoryResult>({ points: [], avg: 0, min: 0, max: 0 });
    const [loading, setLoading] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!destination) {
            setData({ points: [], avg: 0, min: 0, max: 0 });
            return;
        }

        const cacheKey = `${destination}__${days}`;

        // Return cached data immediately
        const cached = cache.get(cacheKey);
        if (cached) {
            setData(cached);
            return;
        }

        // Abort previous in-flight request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);

        fetch(`/api/prices/history?destination=${encodeURIComponent(destination)}&days=${days}`, {
            signal: controller.signal,
        })
            .then((res) => res.json())
            .then((json) => {
                const result: PriceHistoryResult = {
                    points: json.points || [],
                    avg: json.avg || 0,
                    min: json.min || 0,
                    max: json.max || 0,
                };
                cache.set(cacheKey, result);
                setData(result);
            })
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    console.error('[usePriceHistory]', err);
                }
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, [destination, days]);

    return {
        data: data.points,
        prices: data.points.map((p) => p.price),
        points: data.points,
        avg: data.avg,
        min: data.min,
        max: data.max,
        loading,
    };
}
