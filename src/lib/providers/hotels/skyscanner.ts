// ============================================
// Sky Scrapper (RapidAPI) — Hotel Provider
// Same API as flights, uses existing RAPIDAPI_KEY
// No separate quota — uses your 20k RapidAPI credits
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
    amenities: string[];
    rawData: any;
}

const RAPIDAPI_HOST = 'flights-sky.p.rapidapi.com';

function getHeaders(): Record<string, string> {
    return {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
    };
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Entity ID cache (city name → entityId) ──
const entityCache: Record<string, string> = {};

// Hardcoded entity IDs for common destinations (avoid auto-complete calls)
const ENTITY_MAP: Record<string, string> = {
    'Cancún': '27540602', 'Cancun': '27540602',
    'Punta Cana': '113633027',
    'Varadero': '27547428',
    'La Havane': '39872731', 'Havana': '39872731',
    'Montego Bay': '27544864',
    'San José': '27547102', 'San Jose': '27547102',
    'Nassau': '27544076',
    'Bridgetown': '27538755',
    'Cayo Coco': '81971976',
    'Puerto Vallarta': '27546082',
    'Los Cabos': '39152466', 'San José del Cabo': '39156442', 'Cabo San Lucas': '39152466',
    'Liberia': '27544071',
    'Puerto Plata': '27546009',
    'Santo Domingo': '27543019',
    'Freeport': '27541703',
};

/**
 * Resolve city name to Skyscanner entityId
 */
async function resolveEntityId(city: string): Promise<string | null> {
    // Check hardcoded map first
    if (ENTITY_MAP[city]) return ENTITY_MAP[city];
    if (entityCache[city]) return entityCache[city];

    try {
        const res = await fetch(
            `https://${RAPIDAPI_HOST}/hotels/auto-complete?query=${encodeURIComponent(city)}`,
            { headers: getHeaders(), signal: AbortSignal.timeout(10000) }
        );
        const data = await res.json();
        const results = data.data || [];

        // Prefer city type
        const cityResult = results.find((r: any) => r.entityType === 'city')
            || results[0];

        if (cityResult?.entityId) {
            entityCache[city] = cityResult.entityId;
            return cityResult.entityId;
        }
    } catch (error) {
        console.error(`[Hotels/Sky] Failed to resolve entityId for "${city}":`, error);
    }

    return null;
}

/**
 * Parse hotel card from Sky Scrapper response
 */
function parseHotelCard(card: any, checkIn: string, checkOut: string, nights: number): HotelResult | null {
    const rawPrice = card.lowestPrice?.rawPrice;
    if (!rawPrice || rawPrice <= 0) return null;

    const name = card.name || 'Hotel';
    const stars = parseInt(card.stars) || 0;

    // Detect all-inclusive from amenities
    const amenities: string[] = card.amenities || [];
    const isAllInclusive = amenities.some(a =>
        /allinclusive/i.test(a.replace(/[^a-zA-Z]/g, ''))
    ) || /all.?inclusive/i.test(name);

    let hotelType: 'all-inclusive' | 'hotel' | 'resort' = 'hotel';
    if (isAllInclusive) hotelType = 'all-inclusive';
    else if (/resort/i.test(name)) hotelType = 'resort';

    // Parse total price — rawBasePrice is total before taxes
    const totalPrice = card.lowestPrice?.rawBasePrice || rawPrice * nights;

    // Image URL — replace _WxH placeholder with actual dimensions
    let imageUrl = card.images?.[0] || '';
    if (imageUrl.includes('_WxH')) {
        imageUrl = imageUrl.replace('_WxH', '_400x300');
    }

    return {
        name,
        stars,
        pricePerNight: rawPrice,
        totalPrice,
        nights,
        currency: 'CAD',
        rating: card.reviewsSummary?.score || 0,
        reviewCount: card.reviewsSummary?.total || 0,
        imageUrl,
        bookingUrl: card.lowestPrice?.url || '',
        hotelType,
        isAllInclusive,
        checkIn,
        checkOut,
        amenities: amenities.slice(0, 15),
        rawData: {
            distance: card.distance,
            scoreDesc: card.reviewsSummary?.scoreDesc,
            mostPopularWith: card.reviewsSummary?.mostPopularWith,
            partnerName: card.lowestPrice?.partnerName,
            amenities: amenities.slice(0, 15),
            priceWithTaxes: card.lowestPrice?.priceWithAllTaxes,
            otherPricesCount: card.otherPrices?.length || 0,
        },
    };
}

/**
 * Search hotels via Sky Scrapper RapidAPI
 */
export async function searchHotels(
    city: string,
    checkIn: string,
    checkOut: string,
    opts?: { sortBy?: 'price' | 'rating'; limit?: number }
): Promise<HotelResult[]> {
    if (!process.env.RAPIDAPI_KEY) {
        console.error('[Hotels/Sky] RAPIDAPI_KEY not configured');
        return [];
    }

    const entityId = await resolveEntityId(city);
    if (!entityId) {
        console.error(`[Hotels/Sky] Could not resolve entityId for "${city}"`);
        return [];
    }

    const nights = Math.round(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
    );

    try {
        console.log(`[Hotels/Sky] Searching: "${city}" entityId=${entityId} (${checkIn} → ${checkOut})`);

        const params = new URLSearchParams({
            entityId,
            checkin: checkIn,
            checkout: checkOut,
            adults: '2',
            currency: 'CAD',
        });

        // Add sorting
        if (opts?.sortBy === 'price') {
            params.set('sorting', 'price_a');
        } else if (opts?.sortBy === 'rating') {
            params.set('sorting', 'rating_d');
        }

        const res = await fetch(
            `https://${RAPIDAPI_HOST}/hotels/search?${params.toString()}`,
            { headers: getHeaders(), signal: AbortSignal.timeout(15000) }
        );

        if (!res.ok) {
            console.error(`[Hotels/Sky] API error: ${res.status}`);
            return [];
        }

        const data = await res.json();
        const cards = data.data?.results?.hotelCards || [];

        const limit = opts?.limit || 10;
        const results: HotelResult[] = [];

        for (const card of cards) {
            if (results.length >= limit) break;
            const parsed = parseHotelCard(card, checkIn, checkOut, nights);
            if (parsed) results.push(parsed);
        }

        console.log(`[Hotels/Sky] Found ${results.length} hotels for "${city}" (from ${cards.length} total)`);
        return results;
    } catch (error) {
        console.error(`[Hotels/Sky] Error searching "${city}":`, error);
        return [];
    }
}

/**
 * Search all-inclusive resorts — filter results by amenities/name
 */
export async function searchAllInclusive(
    city: string,
    checkIn: string,
    checkOut: string
): Promise<HotelResult[]> {
    // Get more results to filter from
    const allHotels = await searchHotels(city, checkIn, checkOut, { limit: 50 });

    // Filter for all-inclusive or resort properties
    const allInclusive = allHotels.filter(h =>
        h.isAllInclusive || h.hotelType === 'resort'
    );

    // If not enough AI results, include all with "resort" in name
    if (allInclusive.length < 3) {
        const resorts = allHotels.filter(h =>
            /resort/i.test(h.name) && !allInclusive.includes(h)
        );
        allInclusive.push(...resorts);
    }

    // If still not enough, just return cheapest hotels
    if (allInclusive.length < 3) {
        const remaining = allHotels
            .filter(h => !allInclusive.includes(h))
            .slice(0, 5 - allInclusive.length);
        allInclusive.push(...remaining);
    }

    // Mark all as all-inclusive (since this is the AI section)
    return allInclusive.slice(0, 5).map(h => ({
        ...h,
        isAllInclusive: true,
        hotelType: 'all-inclusive' as const,
    }));
}

/**
 * Batch search with rate limiting
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

        // Rate limit: 1s between API calls
        if (i < searches.length - 1) {
            await sleep(1000);
        }
    }

    return results;
}
