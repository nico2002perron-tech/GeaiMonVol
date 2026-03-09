import { NextResponse } from 'next/server';
import { searchRoundTrip, resolveEntityId, buildBookingLink } from '@/lib/providers/flights/skyscanner';
import { createServerSupabase } from '@/lib/supabase/server';

export const maxDuration = 30;

/**
 * Live Skyscanner search for a specific destination.
 * GET /api/prices/search-live?code=CDG&city=Paris
 *
 * Searches 4 upcoming months (fast popup response).
 * Full 12-month data comes from cron scans in background.
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

        // Generate date pairs for the next 4 months × 2 durations (7 & 14 nights)
        const datePairs: { outbound: string; returnDate: string; label: string; tripDuration: number }[] = [];
        const now = new Date();
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

        for (let i = 1; i <= 4; i++) {
            for (const nights of [7, 14]) {
                const outbound = new Date(now.getFullYear(), now.getMonth() + i, 15);
                const ret = new Date(outbound);
                ret.setDate(outbound.getDate() + nights);

                datePairs.push({
                    outbound: outbound.toISOString().split('T')[0],
                    returnDate: ret.toISOString().split('T')[0],
                    label: `${monthNames[outbound.getMonth()]} ${outbound.getFullYear()} (${nights}n)`,
                    tripDuration: nights,
                });
            }
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

                // Estimate seats remaining based on days until departure + price level
                const daysOut = Math.round((new Date(dp.outbound).getTime() - Date.now()) / (86400000));
                const priceRatio = flights.length > 1 ? cheapest.price / flights[flights.length - 1].price : 0.7;
                let estimatedSeats = cheapest.seatsRemaining;
                if (estimatedSeats == null) {
                    // Heuristic: fewer seats if close to departure or price is low vs max
                    if (daysOut < 14) estimatedSeats = 1 + Math.floor(Math.random() * 3);
                    else if (daysOut < 30) estimatedSeats = 2 + Math.floor(Math.random() * 4);
                    else if (priceRatio < 0.5) estimatedSeats = 2 + Math.floor(Math.random() * 5);
                    else estimatedSeats = 4 + Math.floor(Math.random() * 8);
                }

                deals.push({
                    price: Math.round(cheapest.price),
                    currency: 'CAD',
                    airline: cheapest.airline,
                    airlineLogo: cheapest.airlineLogo,
                    operatingAirline: cheapest.operatingAirline,
                    stops: cheapest.stops,
                    departureDate: dp.outbound,
                    returnDate: dp.returnDate,
                    durationMinutes: cheapest.durationMinutes,
                    returnDurationMinutes: cheapest.returnDurationMinutes,
                    returnStops: cheapest.returnStops,
                    bookingLink: link,
                    monthLabel: dp.label,
                    source: 'skyscanner_live',
                    scannedAt: new Date().toISOString(),
                    tags: cheapest.tags,
                    seatsRemaining: estimatedSeats,
                    totalOptions: flights.length,
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
                        return_duration_minutes: cheapest.returnDurationMinutes,
                        return_stops: cheapest.returnStops,
                        trip_duration: dp.tripDuration,
                        tags: cheapest.tags,
                        seats_remaining: estimatedSeats,
                        total_options: flights.length,
                    },
                    scanned_at: new Date().toISOString(),
                });

                // Brief delay between searches
                await new Promise(r => setTimeout(r, 400));
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
