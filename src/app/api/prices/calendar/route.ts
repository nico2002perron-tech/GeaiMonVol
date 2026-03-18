import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { MAX_PRICE } from '@/lib/constants/deals';

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code');
    const monthsParam = parseInt(req.nextUrl.searchParams.get('months') || '6', 10);
    const months = Math.min(Math.max(monthsParam, 1), 12);

    if (!code) {
        return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
    }

    try {
        const supabase = await createServerSupabase();
        const today = new Date().toISOString().split('T')[0];
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + months);
        const end = endDate.toISOString().split('T')[0];

        // Get all prices with departure dates in the future window
        const { data, error } = await supabase
            .from('price_history')
            .select('price, airline, departure_date, return_date, stops, scanned_at')
            .eq('destination_code', code)
            .gte('departure_date', today)
            .lte('departure_date', end)
            .neq('source', 'historical_seed')
            .not('source', 'like', 'google_flights%')
            .lte('price', MAX_PRICE)
            .order('departure_date', { ascending: true })
            .limit(2000);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Group by departure date, keep best price per date
        const byDate: Record<string, { price: number; airline: string; stops: number; returnDate: string | null }> = {};
        for (const row of data || []) {
            if (!row.departure_date) continue;
            const dateKey = row.departure_date.slice(0, 10);
            if (!byDate[dateKey] || row.price < byDate[dateKey].price) {
                byDate[dateKey] = {
                    price: Math.round(row.price),
                    airline: row.airline || '',
                    stops: row.stops ?? -1,
                    returnDate: row.return_date || null,
                };
            }
        }

        // IQR outlier filter — remove aberrant prices from calendar
        const allPrices = Object.values(byDate).map(d => d.price);
        if (allPrices.length >= 4) {
            const sorted = [...allPrices].sort((a, b) => a - b);
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const iqr = q3 - q1;
            const upper = q3 + 1.5 * iqr;
            for (const [dateKey, info] of Object.entries(byDate)) {
                if (info.price > upper) delete byDate[dateKey];
            }
        }

        // Find cheapest month
        const monthTotals: Record<string, { sum: number; count: number }> = {};
        for (const [date, info] of Object.entries(byDate)) {
            const monthKey = date.slice(0, 7); // YYYY-MM
            if (!monthTotals[monthKey]) monthTotals[monthKey] = { sum: 0, count: 0 };
            monthTotals[monthKey].sum += info.price;
            monthTotals[monthKey].count += 1;
        }

        let cheapestMonth = '';
        let cheapestAvg = Infinity;
        const MONTH_NAMES_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

        for (const [key, val] of Object.entries(monthTotals)) {
            const avg = val.sum / val.count;
            if (avg < cheapestAvg) {
                cheapestAvg = avg;
                const monthIdx = parseInt(key.split('-')[1], 10) - 1;
                cheapestMonth = MONTH_NAMES_FR[monthIdx] || key;
            }
        }

        return NextResponse.json({
            code,
            dates: byDate,
            cheapestMonth,
            totalDates: Object.keys(byDate).length,
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
