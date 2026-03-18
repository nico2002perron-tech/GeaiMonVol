// ============================================
// SerpAPI Google Flights Provider
// Uses serpapi.com/google-flights-api
// Budget: 100 req/month (free plan)
// ============================================

export interface PriceInsights {
    lowest_price: number;
    price_level: 'low' | 'typical' | 'high';
    typical_price_range: [number, number];
    price_history: Array<[number, number]>; // [timestamp_ms, price]
}

export interface FlightResult {
    price: number;
    airline: string;
    stops: number;
    duration: number; // minutes
    departureTime: string;
    arrivalTime: string;
    departure_token?: string;
}

const SERPAPI_BASE = 'https://serpapi.com/search.json';

/**
 * Fetch Google Flights price insights for a route.
 * Returns historical pricing data (6-12 months), typical price range,
 * and current price level assessment.
 */
export async function getPriceInsights(
    origin: string,
    destination: string,
    opts?: { currency?: string; language?: string }
): Promise<PriceInsights | null> {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
        console.error('[Flights] SERPAPI_KEY not configured');
        return null;
    }

    // Use dates ~1 month from now (7-day trip) to get price_insights
    // The insights data is route-level, not specific to exact dates
    const outbound = new Date();
    outbound.setDate(outbound.getDate() + 30);
    const ret = new Date(outbound);
    ret.setDate(ret.getDate() + 7);

    const outboundDate = outbound.toISOString().split('T')[0];
    const returnDate = ret.toISOString().split('T')[0];

    const params = new URLSearchParams({
        engine: 'google_flights',
        departure_id: origin,
        arrival_id: destination,
        outbound_date: outboundDate,
        return_date: returnDate,
        type: '1', // round trip
        currency: opts?.currency || 'CAD',
        hl: opts?.language || 'fr',
        gl: 'ca',
        api_key: apiKey,
    });

    try {
        console.log(`[Flights] Fetching price insights: ${origin} → ${destination}`);
        const res = await fetch(`${SERPAPI_BASE}?${params.toString()}`, {
            signal: AbortSignal.timeout(20000),
        });

        if (!res.ok) {
            console.error(`[Flights] SerpAPI error: ${res.status} ${res.statusText}`);
            return null;
        }

        const data = await res.json();

        if (!data.price_insights) {
            console.warn(`[Flights] No price_insights in response for ${origin} → ${destination}`);
            return null;
        }

        const pi = data.price_insights;
        return {
            lowest_price: pi.lowest_price || 0,
            price_level: pi.price_level?.toLowerCase() || 'typical',
            typical_price_range: pi.typical_price_range || [0, 0],
            price_history: pi.price_history || [],
        };
    } catch (error) {
        console.error(`[Flights] Error fetching insights ${origin} → ${destination}:`, error);
        return null;
    }
}

/**
 * Search Google Flights for a specific route and dates.
 */
export async function searchFlights(
    origin: string,
    destination: string,
    outboundDate: string,
    returnDate: string,
    opts?: { currency?: string; language?: string; stops?: number }
): Promise<{ flights: FlightResult[]; priceInsights: PriceInsights | null }> {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
        console.error('[Flights] SERPAPI_KEY not configured');
        return { flights: [], priceInsights: null };
    }

    const params = new URLSearchParams({
        engine: 'google_flights',
        departure_id: origin,
        arrival_id: destination,
        outbound_date: outboundDate,
        return_date: returnDate,
        type: '1',
        currency: opts?.currency || 'CAD',
        hl: opts?.language || 'fr',
        gl: 'ca',
        api_key: apiKey,
    });

    if (opts?.stops !== undefined) {
        params.set('stops', String(opts.stops));
    }

    try {
        console.log(`[Flights] Searching: ${origin} → ${destination} (${outboundDate} → ${returnDate})`);
        const res = await fetch(`${SERPAPI_BASE}?${params.toString()}`, {
            signal: AbortSignal.timeout(20000),
        });

        if (!res.ok) {
            console.error(`[Flights] SerpAPI error: ${res.status} ${res.statusText}`);
            return { flights: [], priceInsights: null };
        }

        const data = await res.json();

        // Parse flights
        const bestFlights = data.best_flights || [];
        const otherFlights = data.other_flights || [];
        const allFlights = [...bestFlights, ...otherFlights];

        const flights: FlightResult[] = allFlights.map((f: any) => {
            const legs = f.flights || [];
            const firstLeg = legs[0] || {};
            const lastLeg = legs[legs.length - 1] || {};
            return {
                price: f.price || 0,
                airline: firstLeg.airline || '',
                stops: legs.length - 1,
                duration: f.total_duration || 0,
                departureTime: firstLeg.departure_airport?.time || '',
                arrivalTime: lastLeg.arrival_airport?.time || '',
                departure_token: f.departure_token,
            };
        }).filter((f: FlightResult) => f.price > 0);

        // Parse price insights
        let priceInsights: PriceInsights | null = null;
        if (data.price_insights) {
            const pi = data.price_insights;
            priceInsights = {
                lowest_price: pi.lowest_price || 0,
                price_level: pi.price_level?.toLowerCase() || 'typical',
                typical_price_range: pi.typical_price_range || [0, 0],
                price_history: pi.price_history || [],
            };
        }

        console.log(`[Flights] Found ${flights.length} flights, insights: ${!!priceInsights}`);
        return { flights, priceInsights };
    } catch (error) {
        console.error(`[Flights] Error searching ${origin} → ${destination}:`, error);
        return { flights: [], priceInsights: null };
    }
}

// Keep backwards-compatible export
export const SerpApiProvider = {
    name: 'serpapi',
    search: searchFlights,
    getPriceInsights,
};
