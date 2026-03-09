import { NextResponse } from 'next/server';
import { searchRoundTrip, resolveEntityId, buildBookingLink } from '@/lib/providers/flights/skyscanner';
import { createServerSupabase } from '@/lib/supabase/server';

export const maxDuration = 30;

/**
 * Live Skyscanner search for a specific destination.
 * GET /api/prices/search-live?code=CDG&city=Paris
 *
 * Searches 6 upcoming months, returns dates with prices and booking links.
 * Also caches results in price_history for future use.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code') || '';
    const city = searchParams.get('city') || '';

    if (!code) {
        return NextResponse.json({ error: 'Missing destination code' }, { status: 400 });
    }

    if (!process.env.RAPIDAPI_KEY) {
        return NextResponse.json({ error: 'API not configured' }, { status: 500 });
    }

    try {
        const origin = 'YUL';

        // Resolve skyIds
        const [originSkyId, destSkyId] = await Promise.all([
            resolveEntityId(origin),
            resolveEntityId(code),
        ]);

        if (!originSkyId || !destSkyId) {
            return NextResponse.json({
                deals: [],
                fallbackUrl: `https://www.skyscanner.ca/transport/flights/${origin.toLowerCase()}/${code.toLowerCase()}/`,
                error: 'Could not resolve destination',
            });
        }

        // Generate date pairs for the next 6 months (7-night trips)
        const datePairs: { outbound: string; returnDate: string; label: string }[] = [];
        const now = new Date();
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

        for (let i = 1; i <= 3; i++) {
            const outbound = new Date(now.getFullYear(), now.getMonth() + i, 15);
            const ret = new Date(outbound);
            ret.setDate(outbound.getDate() + 7);

            datePairs.push({
                outbound: outbound.toISOString().split('T')[0],
                returnDate: ret.toISOString().split('T')[0],
                label: `${monthNames[outbound.getMonth()]} ${outbound.getFullYear()}`,
            });
        }

        const deals: any[] = [];
        const recordsToCache: any[] = [];

        // Search each month (sequentially to respect rate limits)
        for (const dp of datePairs) {
            try {
                const flights = await searchRoundTrip(
                    origin,
                    code,
                    dp.outbound,
                    dp.returnDate,
                    { sortBy: 'price_low' }
                );

                if (flights.length === 0) continue;

                // Take the cheapest flight for each month
                const cheapest = flights[0];
                const link = buildBookingLink(origin, code, dp.outbound, dp.returnDate);

                deals.push({
                    price: Math.round(cheapest.price),
                    currency: 'CAD',
                    airline: cheapest.airline,
                    airlineLogo: cheapest.airlineLogo,
                    stops: cheapest.stops,
                    departureDate: dp.outbound,
                    returnDate: dp.returnDate,
                    durationMinutes: cheapest.durationMinutes,
                    bookingLink: link,
                    monthLabel: dp.label,
                    source: 'skyscanner_live',
                    scannedAt: new Date().toISOString(),
                });

                // Prepare cache record
                recordsToCache.push({
                    origin,
                    destination: city || code,
                    destination_code: code,
                    price: Math.round(cheapest.price),
                    currency: 'CAD',
                    airline: cheapest.airline,
                    stops: cheapest.stops,
                    departure_date: dp.outbound,
                    return_date: dp.returnDate,
                    source: 'skyscanner_live',
                    raw_data: {
                        booking_link: link,
                        airline_logo: cheapest.airlineLogo,
                        duration_minutes: cheapest.durationMinutes,
                        trip_duration: 7,
                    },
                    scanned_at: new Date().toISOString(),
                });

                // Brief delay between searches
                await new Promise(r => setTimeout(r, 800));
            } catch {
                // Skip this month if search fails
            }
        }

        // Cache results in Supabase (fire and forget)
        if (recordsToCache.length > 0) {
            try {
                const supabase = await createServerSupabase();
                await supabase.from('price_history').insert(recordsToCache);
            } catch {
                // Caching failed, not critical
            }
        }

        return NextResponse.json({
            destination: city || code,
            destinationCode: code,
            deals: deals.sort((a, b) => a.price - b.price),
            count: deals.length,
            fallbackUrl: `https://www.skyscanner.ca/transport/flights/${origin.toLowerCase()}/${code.toLowerCase()}/`,
        });
    } catch (error: any) {
        return NextResponse.json({
            deals: [],
            fallbackUrl: `https://www.skyscanner.ca/transport/flights/yul/${code.toLowerCase()}/`,
            error: error.message,
        });
    }
}
