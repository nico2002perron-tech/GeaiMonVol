import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { MAX_PRICE } from '@/lib/constants/deals';

export async function GET(req: NextRequest) {
    const destination = req.nextUrl.searchParams.get('destination');
    const code = req.nextUrl.searchParams.get('code');
    const yearsParam = parseInt(req.nextUrl.searchParams.get('years') || '1', 10);
    const years = [1, 2, 3].includes(yearsParam) ? yearsParam : 1;

    if (!destination && !code) {
        return NextResponse.json({ error: 'Missing destination or code' }, { status: 400 });
    }

    try {
        const supabase = await createServerSupabase();
        const since = new Date();
        since.setFullYear(since.getFullYear() - years);

        let query = supabase
            .from('price_history')
            .select('price, departure_date, scanned_at, airline')
            .gte('scanned_at', since.toISOString())
            .not('departure_date', 'is', null)
            .lte('price', MAX_PRICE)
            .order('departure_date', { ascending: true });

        if (code) {
            query = query.eq('destination_code', code);
        } else {
            query = query.eq('destination', destination!);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Group by year-month of departure_date
        const yearMonthMap: Record<string, Record<number, number[]>> = {};
        const monthMap: Record<number, number[]> = {};
        const monthAirlines: Record<number, Record<string, number>> = {};

        for (const row of data || []) {
            if (!row.departure_date) continue;
            const d = new Date(row.departure_date + 'T00:00:00');
            const year = d.getFullYear();
            const month = d.getMonth();

            // Year-month grid
            const yearKey = String(year);
            if (!yearMonthMap[yearKey]) yearMonthMap[yearKey] = {};
            if (!yearMonthMap[yearKey][month]) yearMonthMap[yearKey][month] = [];
            yearMonthMap[yearKey][month].push(Number(row.price));

            // Aggregated by month
            if (!monthMap[month]) monthMap[month] = [];
            monthMap[month].push(Number(row.price));

            // Track airlines per month
            if (row.airline) {
                if (!monthAirlines[month]) monthAirlines[month] = {};
                monthAirlines[month][row.airline] = (monthAirlines[month][row.airline] || 0) + 1;
            }
        }

        // IQR outlier filter — removes aberrant prices
        function filterOutliers(arr: number[]): number[] {
            if (arr.length < 4) return arr;
            const s = [...arr].sort((a, b) => a - b);
            const q1 = s[Math.floor(s.length * 0.25)];
            const q3 = s[Math.floor(s.length * 0.75)];
            const iqr = q3 - q1;
            return arr.filter(v => v >= q1 - 1.5 * iqr && v <= q3 + 1.5 * iqr);
        }

        function calcStats(rawPrices: number[]) {
            const prices = filterOutliers(rawPrices);
            if (prices.length === 0) return null;
            const sorted = [...prices].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            const median = sorted.length % 2 === 0
                ? (sorted[mid - 1] + sorted[mid]) / 2
                : sorted[mid];
            const p25 = sorted[Math.floor(sorted.length * 0.25)];
            const p75 = sorted[Math.floor(sorted.length * 0.75)];
            return {
                median: Math.round(median),
                avg: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
                min: Math.round(Math.min(...prices)),
                max: Math.round(Math.max(...prices)),
                p25: Math.round(p25),
                p75: Math.round(p75),
                count: prices.length,
            };
        }

        // Monthly aggregated stats
        const months = Array.from({ length: 12 }, (_, i) => {
            const stats = calcStats(monthMap[i] || []);
            const airlines = monthAirlines[i] || {};
            const topAirline = Object.entries(airlines).sort((a, b) => b[1] - a[1])[0];
            return {
                month: i,
                ...(stats || { median: 0, avg: 0, min: 0, max: 0, p25: 0, p75: 0, count: 0 }),
                topAirline: topAirline ? topAirline[0] : null,
            };
        });

        // Year-month grid
        const grid: Record<string, Record<number, ReturnType<typeof calcStats>>> = {};
        for (const [year, monthData] of Object.entries(yearMonthMap)) {
            grid[year] = {};
            for (const [month, prices] of Object.entries(monthData)) {
                grid[year][parseInt(month)] = calcStats(prices);
            }
        }

        return NextResponse.json({
            destination: destination || code,
            years,
            months,
            grid,
            totalDataPoints: (data || []).length,
        }, {
            headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
