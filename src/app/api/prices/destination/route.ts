import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
        return NextResponse.json({ error: 'Missing destination name' }, { status: 400 });
    }

    try {
        const supabase = await createServerSupabase();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Fetch recent scans + 90-day history for avg price
        const [scansResult, historyResult] = await Promise.all([
            supabase
                .from('price_history')
                .select('*')
                .eq('destination', name)
                .gte('scanned_at', thirtyDaysAgo)
                .order('price', { ascending: true }),
            supabase
                .from('price_history')
                .select('price')
                .eq('destination', name)
                .gte('scanned_at', ninetyDaysAgo),
        ]);

        if (scansResult.error) {
            return NextResponse.json({ error: scansResult.error.message }, { status: 500 });
        }

        // Filter out old Google Flights data + seed data
        const filtered = (scansResult.data || []).filter(
            (row: any) => !row.source?.startsWith('google_flights') && row.source !== 'historical_seed'
        );

        // Calculate average price from 90-day history
        const histPrices = (historyResult.data || []).map((r: any) => r.price).filter(Boolean);
        const avgPrice = histPrices.length > 0
            ? Math.round(histPrices.reduce((a: number, b: number) => a + b, 0) / histPrices.length)
            : 0;

        // Deduplicate: keep best price per departure_date
        const bestByDate: Record<string, any> = {};
        for (const row of filtered) {
            const key = row.departure_date || 'flexible';
            if (!bestByDate[key] || row.price < bestByDate[key].price) {
                bestByDate[key] = row;
            }
        }

        // Build Skyscanner link for deals that don't have one
        const destCode = filtered[0]?.destination_code || '';
        const buildSkyLink = (dep: string, ret: string, code: string) => {
            if (!dep || !ret) return `https://www.skyscanner.ca/transport/flights/yul/${code.toLowerCase()}/`;
            const fmt = (d: string) => d.replace(/-/g, '').slice(2); // YYMMDD
            return `https://www.skyscanner.ca/transport/flights/yul/${code.toLowerCase()}/${fmt(dep)}/${fmt(ret)}/?adults=1&cabinclass=economy&currency=CAD&locale=fr-FR`;
        };

        const deals = Object.values(bestByDate)
            .filter((d) => d.departure_date && d.departure_date >= today) // Only future dates
            .sort((a, b) => a.departure_date.localeCompare(b.departure_date)) // Sort by date (chronological)
            .map((d) => {
                const code = d.destination_code || destCode;
                const rawLink = d.raw_data?.booking_link || '';
                const bookingLink = rawLink.includes('skyscanner')
                    ? rawLink
                    : buildSkyLink(d.departure_date, d.return_date, code);

                // Per-deal discount vs 90-day average
                const dealDiscount = avgPrice > d.price
                    ? Math.round(((avgPrice - d.price) / avgPrice) * 100)
                    : 0;

                return {
                    price: d.price,
                    currency: d.currency || 'CAD',
                    airline: d.airline || d.raw_data?.flights?.[0]?.airline || '',
                    airlineLogo: d.raw_data?.airline_logo || '',
                    operatingAirline: d.raw_data?.operating_airline || '',
                    stops: d.stops ?? ((d.raw_data?.flights?.length || 1) - 1),
                    departureDate: d.departure_date,
                    returnDate: d.return_date,
                    durationMinutes: d.raw_data?.duration_minutes || 0,
                    returnDurationMinutes: d.raw_data?.return_duration_minutes || 0,
                    returnStops: d.raw_data?.return_stops,
                    bookingLink,
                    source: d.source,
                    scannedAt: d.scanned_at,
                    tags: d.raw_data?.tags || [],
                    seatsRemaining: d.raw_data?.seats_remaining,
                    totalOptions: d.raw_data?.total_options,
                    discount: dealDiscount,
                    tripNights: d.raw_data?.trip_duration || 0,
                };
            });

        return NextResponse.json({
            destination: name,
            destinationCode: scansResult.data?.[0]?.destination_code || '',
            deals,
            count: deals.length,
            avgPrice,
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
