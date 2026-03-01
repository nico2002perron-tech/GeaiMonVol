import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    const destination = req.nextUrl.searchParams.get('destination');

    if (!destination) {
        return NextResponse.json({ error: 'Missing destination parameter' }, { status: 400 });
    }

    try {
        const supabase = await createServerSupabase();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('price_history')
            .select('price, scanned_at')
            .eq('destination', destination)
            .gte('scanned_at', thirtyDaysAgo)
            .order('scanned_at', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Aggregate to best (lowest) price per day — max 30 points
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

        return NextResponse.json({ destination, points });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
