import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { calculateRealDiscount } from '@/lib/services/flights';
import { MAX_PRICE } from '@/lib/constants/deals';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || searchParams.get('destination');
    const code = searchParams.get('code');

    if (!name && !code) {
        return NextResponse.json({ error: 'Missing destination name or code' }, { status: 400 });
    }

    try {
        const supabase = await createServerSupabase();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Build filter based on code or name
        const filterCol = code ? 'destination_code' : 'destination';
        const filterVal = code || name!;

        // Fetch recent scans + 90-day history for avg price
        const [scansResult, historyResult] = await Promise.all([
            supabase
                .from('price_history')
                .select('*')
                .eq(filterCol, filterVal)
                .gte('scanned_at', thirtyDaysAgo)
                .lte('price', MAX_PRICE)
                .order('price', { ascending: true }),
            supabase
                .from('price_history')
                .select('price')
                .eq(filterCol, filterVal)
                .gte('scanned_at', ninetyDaysAgo)
                .lte('price', MAX_PRICE)
                .neq('source', 'historical_seed')
                .not('source', 'like', 'google_flights%'),
        ]);

        if (scansResult.error) {
            return NextResponse.json({ error: scansResult.error.message }, { status: 500 });
        }

        // Filter out non-bookable data
        const filtered = (scansResult.data || []).filter(
            (row: any) => !row.source?.startsWith('google_flights') && row.source !== 'historical_seed' && row.source !== 'skyscanner_explore'
        );

        // IQR outlier filter
        function filterOutliers(arr: number[]): number[] {
            if (arr.length < 4) return arr;
            const s = [...arr].sort((a, b) => a - b);
            const q1 = s[Math.floor(s.length * 0.25)];
            const q3 = s[Math.floor(s.length * 0.75)];
            const iqr = q3 - q1;
            return arr.filter(v => v >= q1 - 1.5 * iqr && v <= q3 + 1.5 * iqr);
        }

        // Calculate average + median price from 90-day history (outliers removed)
        const histPricesRaw = (historyResult.data || []).map((r: any) => r.price).filter(Boolean);
        const histPrices = filterOutliers(histPricesRaw);
        const avgPrice = histPrices.length > 0
            ? Math.round(histPrices.reduce((a: number, b: number) => a + b, 0) / histPrices.length)
            : 0;
        const sorted = [...histPrices].sort((a: number, b: number) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const medianPrice = sorted.length > 0
            ? Math.round(sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2)
            : 0;
        // Use median as reference for discounts (more robust)
        const refPrice = medianPrice > 0 ? medianPrice : avgPrice;

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

                // Per-deal discount + deal level using real discount engine
                const historyForCalc = histPrices.map((p: number) => ({ price: p, scanned_at: '' }));
                const discountInfo = calculateRealDiscount(d.price, historyForCalc);

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
                    discount: discountInfo.discount,
                    dealLevel: discountInfo.dealLevel,
                    tripNights: d.raw_data?.trip_duration || 0,
                };
            });

        return NextResponse.json({
            destination: name || scansResult.data?.[0]?.destination || code,
            destinationCode: code || scansResult.data?.[0]?.destination_code || '',
            deals,
            count: deals.length,
            avgPrice,
            medianPrice,
            historyCount: histPrices.length,
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
