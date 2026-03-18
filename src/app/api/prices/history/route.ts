import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { MAX_PRICE } from '@/lib/constants/deals';

export async function GET(req: NextRequest) {
    const destination = req.nextUrl.searchParams.get('destination');
    const code = req.nextUrl.searchParams.get('code');
    const daysParam = parseInt(req.nextUrl.searchParams.get('days') || '30', 10);
    const days = [30, 60, 90].includes(daysParam) ? daysParam : 30;

    if (!destination && !code) {
        return NextResponse.json({ error: 'Missing destination or code parameter' }, { status: 400 });
    }

    try {
        const supabase = await createServerSupabase();
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        let query = supabase
            .from('price_history')
            .select('price, scanned_at')
            .gte('scanned_at', since)
            .lte('price', MAX_PRICE)
            .order('scanned_at', { ascending: true });

        // Filter by code (IATA) or destination name
        if (code) {
            query = query.eq('destination_code', code);
        } else {
            query = query.eq('destination', destination!);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Aggregate to best (lowest) price per day
        const byDay: Record<string, number> = {};
        for (const row of data || []) {
            const day = row.scanned_at.slice(0, 10); // YYYY-MM-DD
            if (!byDay[day] || row.price < byDay[day]) {
                byDay[day] = row.price;
            }
        }

        const allPoints = Object.entries(byDay)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, price]) => ({ date, price }));

        // IQR outlier filter — remove aberrant prices from chart & stats
        let points = allPoints;
        if (allPoints.length >= 4) {
            const sorted = [...allPoints].sort((a, b) => a.price - b.price);
            const q1 = sorted[Math.floor(sorted.length * 0.25)].price;
            const q3 = sorted[Math.floor(sorted.length * 0.75)].price;
            const iqr = q3 - q1;
            const lower = q1 - 1.5 * iqr;
            const upper = q3 + 1.5 * iqr;
            points = allPoints.filter(p => p.price >= lower && p.price <= upper);
        }

        const prices = points.map(p => p.price);
        const avg = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
        const min = prices.length > 0 ? Math.min(...prices) : 0;
        const max = prices.length > 0 ? Math.max(...prices) : 0;

        return NextResponse.json({ destination: destination || code, days, points, avg, min, max }, {
            headers: {
                'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
