import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    const destination = req.nextUrl.searchParams.get('destination');
    const daysParam = parseInt(req.nextUrl.searchParams.get('days') || '30', 10);
    const days = [30, 60, 90].includes(daysParam) ? daysParam : 30;

    if (!destination) {
        return NextResponse.json({ error: 'Missing destination parameter' }, { status: 400 });
    }

    try {
        const supabase = await createServerSupabase();
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('price_history')
            .select('price, scanned_at')
            .eq('destination', destination)
            .gte('scanned_at', since)
            .order('scanned_at', { ascending: true });

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

        const points = Object.entries(byDay)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, price]) => ({ date, price }));

        const prices = points.map(p => p.price);
        const avg = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
        const min = prices.length > 0 ? Math.min(...prices) : 0;
        const max = prices.length > 0 ? Math.max(...prices) : 0;

        return NextResponse.json({ destination, days, points, avg, min, max }, {
            headers: {
                'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
