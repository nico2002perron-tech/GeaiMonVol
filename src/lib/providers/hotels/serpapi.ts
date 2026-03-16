// ============================================
// SerpAPI Google Hotels Provider
// Uses serpapi.com/google-hotels-api
// Budget: 100 req/month (free plan)
// ============================================

export interface HotelResult {
    name: string;
    stars: number;
    pricePerNight: number;
    totalPrice: number;
    nights: number;
    currency: string;
    rating: number;
    reviewCount: number;
    imageUrl: string;
    bookingUrl: string;
    hotelType: 'all-inclusive' | 'hotel' | 'resort';
    isAllInclusive: boolean;
    checkIn: string;
    checkOut: string;
    rawData: any;
}

interface SearchOptions {
    adults?: number;
    currency?: string;
    language?: string;
    sortBy?: 'lowest_price' | 'highest_rating';
}

const SERPAPI_BASE = 'https://serpapi.com/search.json';

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Search Google Hotels via SerpAPI
 */
export async function searchHotels(
    city: string,
    checkIn: string,
    checkOut: string,
    opts?: SearchOptions & { query?: string }
): Promise<HotelResult[]> {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
        console.error('[Hotels] SERPAPI_KEY not configured');
        return [];
    }

    const query = opts?.query || `hotels in ${city}`;
    const nights = Math.round(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
    );

    const params = new URLSearchParams({
        engine: 'google_hotels',
        q: query,
        check_in_date: checkIn,
        check_out_date: checkOut,
        adults: String(opts?.adults || 2),
        currency: opts?.currency || 'CAD',
        hl: opts?.language || 'fr',
        gl: 'ca',
        sort_by: opts?.sortBy === 'highest_rating' ? '13' : '3', // 3 = lowest price
        api_key: apiKey,
    });

    try {
        console.log(`[Hotels] Searching: "${query}" (${checkIn} → ${checkOut})`);
        const res = await fetch(`${SERPAPI_BASE}?${params.toString()}`, {
            signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
            console.error(`[Hotels] SerpAPI error: ${res.status} ${res.statusText}`);
            return [];
        }

        const data = await res.json();
        const properties = data.properties || [];

        const results: HotelResult[] = [];
        for (const prop of properties) {
            const totalPrice = prop.total_rate?.extracted_lowest
                || prop.rate_per_night?.extracted_lowest * nights
                || 0;
            const pricePerNight = prop.rate_per_night?.extracted_lowest
                || (totalPrice > 0 ? Math.round(totalPrice / nights) : 0);

            if (pricePerNight <= 0) continue;

            const name = prop.name || 'Hôtel';
            const isAllInclusive = !!(
                prop.amenities?.some((a: string) => /all.?inclusive/i.test(a))
                || /all.?inclusive/i.test(name)
                || /tout.?inclus/i.test(name)
                || prop.description?.toLowerCase().includes('all inclusive')
                || prop.type?.toLowerCase().includes('all inclusive')
            );

            let hotelType: 'all-inclusive' | 'hotel' | 'resort' = 'hotel';
            if (isAllInclusive) hotelType = 'all-inclusive';
            else if (/resort/i.test(name)) hotelType = 'resort';

            results.push({
                name,
                stars: prop.extracted_hotel_class || 0,
                pricePerNight,
                totalPrice: totalPrice || pricePerNight * nights,
                nights,
                currency: opts?.currency || 'CAD',
                rating: prop.overall_rating || 0,
                reviewCount: prop.reviews || 0,
                imageUrl: prop.images?.[0]?.thumbnail || '',
                bookingUrl: prop.link || '',
                hotelType,
                isAllInclusive,
                checkIn,
                checkOut,
                rawData: {
                    type: prop.type,
                    amenities: prop.amenities?.slice(0, 10),
                    neighborhood: prop.neighborhood,
                    description: prop.description?.slice(0, 200),
                },
            });
        }

        console.log(`[Hotels] Found ${results.length} hotels for "${city}"`);
        return results;
    } catch (error) {
        console.error(`[Hotels] Error searching "${city}":`, error);
        return [];
    }
}

/**
 * Search all-inclusive resorts specifically
 */
export async function searchAllInclusive(
    city: string,
    checkIn: string,
    checkOut: string
): Promise<HotelResult[]> {
    const results = await searchHotels(city, checkIn, checkOut, {
        query: `all inclusive resort in ${city}`,
        sortBy: 'lowest_price',
    });

    // Keep all results but mark which ones are truly all-inclusive
    return results.map(r => ({
        ...r,
        isAllInclusive: true, // Search was specifically for AI resorts
        hotelType: 'all-inclusive' as const,
    }));
}

/**
 * Rate-limited batch search — 2s between calls
 */
export async function searchHotelsBatch(
    searches: Array<{ city: string; checkIn: string; checkOut: string; allInclusive?: boolean }>
): Promise<Map<string, HotelResult[]>> {
    const results = new Map<string, HotelResult[]>();

    for (let i = 0; i < searches.length; i++) {
        const s = searches[i];
        const hotels = s.allInclusive
            ? await searchAllInclusive(s.city, s.checkIn, s.checkOut)
            : await searchHotels(s.city, s.checkIn, s.checkOut);

        results.set(s.city, hotels);

        // Rate limit: 2s between API calls
        if (i < searches.length - 1) {
            await sleep(2000);
        }
    }

    return results;
}
