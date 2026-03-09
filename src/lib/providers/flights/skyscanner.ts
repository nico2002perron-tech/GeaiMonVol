// ============================================
// GeaiMonVol — Skyscanner Flight Provider
// Via RapidAPI (Flights Sky)
// ============================================

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'flights-sky.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

function getHeaders(): Record<string, string> {
    return {
        'X-RapidAPI-Key': RAPIDAPI_KEY!,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
    };
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Entity ID Resolution (IATA → Skyscanner skyId) ──────────────────────────

// Cache: IATA code → skyId (e.g. "YUL" → "YMQA", "CDG" → "PARI")
const skyIdCache = new Map<string, string>();

/**
 * Resolve an IATA airport code to a Skyscanner skyId via auto-complete.
 * e.g. "YUL" → "YMQA", "CDG" → "PARI"
 */
export async function resolveEntityId(iataCode: string): Promise<string> {
    if (skyIdCache.has(iataCode)) return skyIdCache.get(iataCode)!;

    try {
        const res = await fetch(
            `${BASE_URL}/flights/auto-complete?query=${encodeURIComponent(iataCode)}&locale=fr-FR`,
            { headers: getHeaders() }
        );

        if (!res.ok) {
            console.error(`[Skyscanner] auto-complete failed for ${iataCode}: ${res.status}`);
            return '';
        }

        const json = await res.json();
        const results = json?.data || [];

        // Find the best match — prefer the first result with a skyId
        for (const item of results) {
            const skyId = item?.navigation?.relevantFlightParams?.skyId;
            if (skyId) {
                skyIdCache.set(iataCode, skyId);
                return skyId;
            }
        }

        console.warn(`[Skyscanner] No skyId found for ${iataCode}`);
        return '';
    } catch (error) {
        console.error(`[Skyscanner] Error resolving ${iataCode}:`, error);
        return '';
    }
}

/**
 * Batch-resolve skyIds for a list of IATA codes.
 * Resolves sequentially with a short delay to respect rate limits.
 */
export async function resolveEntityIds(iataCodes: string[]): Promise<void> {
    const toResolve = iataCodes.filter((code) => !skyIdCache.has(code));
    if (toResolve.length === 0) return;

    console.log(`[Skyscanner] Resolving ${toResolve.length} skyIds...`);
    for (const code of toResolve) {
        await resolveEntityId(code);
        await sleep(300);
    }
}

// ── Search Everywhere (Explore) ──────────────────────────────────────────────

export interface EverywhereResult {
    skyCode: string;
    entityId: string;
    city: string;
    country: string;
    price: number;
    currency: string;
    direct: boolean;
    imageUrl?: string;
}

export async function searchEverywhere(
    originIata: string,
    options?: { month?: string; currency?: string }
): Promise<EverywhereResult[]> {
    if (!RAPIDAPI_KEY) {
        console.error('[Skyscanner] RAPIDAPI_KEY not configured');
        return [];
    }

    const originSkyId = await resolveEntityId(originIata);
    if (!originSkyId) return [];

    try {
        // Try the search-everywhere endpoint
        const params = new URLSearchParams({
            fromEntityId: originSkyId,
            currency: options?.currency || 'CAD',
            market: 'CA',
            locale: 'fr-FR',
        });

        console.log(`[Skyscanner] searchEverywhere from ${originIata} (skyId: ${originSkyId})...`);
        const res = await fetch(
            `${BASE_URL}/flights/search-everywhere?${params}`,
            { headers: getHeaders() }
        );

        if (!res.ok) {
            console.warn(`[Skyscanner] searchEverywhere not available (${res.status}), skipping`);
            return [];
        }

        const data = await res.json();
        const results: EverywhereResult[] = [];

        // Handle multiple possible response structures
        const destinations =
            data?.data?.everywhereDestination?.results ||
            data?.data?.results ||
            data?.data ||
            data?.results ||
            [];

        if (!Array.isArray(destinations)) {
            console.warn('[Skyscanner] searchEverywhere: unexpected response format');
            return [];
        }

        for (const dest of destinations) {
            const location = dest?.content?.location || dest?.location || dest;
            const quotes = dest?.content?.flightQuotes || dest?.flightQuotes || {};
            const cheapest = quotes?.cheapest || {};

            const rawPrice = cheapest?.rawPrice ?? cheapest?.price ?? dest?.price?.raw ?? dest?.price;
            if (!rawPrice) continue;

            const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice));
            if (!price || isNaN(price)) continue;

            const skyCode = location?.skyCode || location?.skyId || location?.iata || '';
            const entId = location?.id || location?.entityId || '';

            results.push({
                skyCode,
                entityId: entId,
                city: location?.name || location?.city || dest?.name || '',
                country: location?.country || dest?.country || '',
                price,
                currency: 'CAD',
                direct: cheapest?.direct ?? false,
                imageUrl: dest?.content?.image?.url || dest?.imageUrl || '',
            });

            // Cache the skyId
            if (skyCode && entId) {
                skyIdCache.set(skyCode, skyCode); // identity cache for sky codes
            }
        }

        console.log(`[Skyscanner] searchEverywhere: ${results.length} destinations found`);
        return results;
    } catch (error) {
        console.error('[Skyscanner] searchEverywhere error:', error);
        return [];
    }
}

// ── Search Roundtrip (Specific Route) ────────────────────────────────────────

export interface FlightResult {
    price: number;
    currency: string;
    airline: string;
    airlineLogo?: string;
    stops: number;
    durationMinutes: number;
    departureTime: string;
    arrivalTime: string;
    originCity: string;
    destinationCity: string;
    originCode: string;
    destinationCode: string;
    tags?: string[];
    rawItinerary: any;
}

export async function searchRoundTrip(
    originIata: string,
    destIata: string,
    outDate: string,
    returnDate: string,
    options?: { currency?: string; cabinClass?: string; sortBy?: string }
): Promise<FlightResult[]> {
    if (!RAPIDAPI_KEY) return [];

    const [originSkyId, destSkyId] = await Promise.all([
        resolveEntityId(originIata),
        resolveEntityId(destIata),
    ]);

    if (!originSkyId || !destSkyId) {
        console.warn(`[Skyscanner] Missing skyIds: ${originIata}=${originSkyId}, ${destIata}=${destSkyId}`);
        return [];
    }

    try {
        const params = new URLSearchParams({
            fromEntityId: originSkyId,
            toEntityId: destSkyId,
            departDate: outDate,
            returnDate: returnDate,
            adults: '1',
            cabinClass: options?.cabinClass || 'economy',
            currency: options?.currency || 'CAD',
            market: 'CA',
            locale: 'fr-FR',
        });

        const res = await fetch(
            `${BASE_URL}/flights/search-roundtrip?${params}`,
            { headers: getHeaders() }
        );

        if (!res.ok) {
            console.error(`[Skyscanner] searchRoundTrip ${originIata}→${destIata} error: ${res.status}`);
            return [];
        }

        const data = await res.json();
        const itineraries = data?.data?.itineraries || [];
        const results: FlightResult[] = [];

        for (const itin of itineraries) {
            const price = itin?.price?.raw;
            if (!price) continue;

            const outboundLeg = itin?.legs?.[0];
            if (!outboundLeg) continue;

            const carrier = outboundLeg?.carriers?.marketing?.[0];

            results.push({
                price,
                currency: 'CAD',
                airline: carrier?.name || '',
                airlineLogo: carrier?.logoUrl || '',
                stops: outboundLeg?.stopCount ?? 0,
                durationMinutes: outboundLeg?.durationInMinutes || 0,
                departureTime: outboundLeg?.departure || '',
                arrivalTime: outboundLeg?.arrival || '',
                originCity: outboundLeg?.origin?.city || outboundLeg?.origin?.name || '',
                destinationCity: outboundLeg?.destination?.city || outboundLeg?.destination?.name || '',
                originCode: outboundLeg?.origin?.displayCode || originIata,
                destinationCode: outboundLeg?.destination?.displayCode || destIata,
                tags: itin?.tags || [],
                rawItinerary: itin,
            });
        }

        return results;
    } catch (error) {
        console.error(`[Skyscanner] searchRoundTrip error ${originIata}→${destIata}:`, error);
        return [];
    }
}

// ── Skyscanner Booking Link ──────────────────────────────────────────────────

/**
 * Build a Skyscanner deep link for booking.
 * Format: https://www.skyscanner.ca/transport/flights/yul/cdg/260415/260422/
 */
export function buildBookingLink(
    originIata: string,
    destIata: string,
    outDate: string,
    returnDate: string
): string {
    const formatDate = (d: string) => {
        const parts = d.split('-');
        if (parts.length !== 3) return '';
        return parts[0].slice(2) + parts[1] + parts[2]; // YYMMDD
    };

    const out = formatDate(outDate);
    const ret = formatDate(returnDate);

    if (!out || !ret) {
        return `https://www.skyscanner.ca/transport/flights/${originIata.toLowerCase()}/${destIata.toLowerCase()}/`;
    }

    return `https://www.skyscanner.ca/transport/flights/${originIata.toLowerCase()}/${destIata.toLowerCase()}/${out}/${ret}/?adults=1&cabinclass=economy&currency=CAD&locale=fr-FR`;
}

// ── Provider Export ──────────────────────────────────────────────────────────

export const SkyscannerProvider = {
    name: 'skyscanner',
    resolveEntityId,
    resolveEntityIds,
    searchEverywhere,
    searchRoundTrip,
    buildBookingLink,
};
