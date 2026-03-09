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

        const { data, error } = await supabase
            .from('price_history')
            .select('*')
            .eq('destination', name)
            .gte('scanned_at', thirtyDaysAgo)
            .order('price', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Deduplicate: keep best price per departure_date
        const bestByDate: Record<string, any> = {};
        for (const row of data || []) {
            const key = row.departure_date || 'flexible';
            if (!bestByDate[key] || row.price < bestByDate[key].price) {
                bestByDate[key] = row;
            }
        }

        const deals = Object.values(bestByDate)
            .filter((d) => d.departure_date) // Only deals with actual dates
            .sort((a, b) => a.price - b.price)
            .map((d) => ({
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
                bookingLink: d.raw_data?.booking_link || d.raw_data?.google_flights_link || '',
                source: d.source,
                scannedAt: d.scanned_at,
                tags: d.raw_data?.tags || [],
                seatsRemaining: d.raw_data?.seats_remaining,
                totalOptions: d.raw_data?.total_options,
            }));

        return NextResponse.json({
            destination: name,
            destinationCode: data?.[0]?.destination_code || '',
            deals,
            count: deals.length,
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
