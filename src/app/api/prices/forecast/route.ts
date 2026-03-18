import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { generateForecast } from '@/lib/services/price-forecast';
import { getPriceInsights } from '@/lib/providers/flights/serpapi';
import { MAX_PRICE } from '@/lib/constants/deals';

export async function GET(req: NextRequest) {
    const destination = req.nextUrl.searchParams.get('destination');
    const code = req.nextUrl.searchParams.get('code');
    const currentPrice = parseFloat(req.nextUrl.searchParams.get('price') || '0');

    if ((!destination && !code) || currentPrice <= 0) {
        return NextResponse.json({ error: 'Missing destination/code and price params' }, { status: 400 });
    }

    try {
        const supabase = await createServerSupabase();

        // 1. Fetch daily price history (90 days)
        const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        let histQuery = supabase
            .from('price_history')
            .select('price, scanned_at')
            .gte('scanned_at', since90)
            .lte('price', MAX_PRICE)
            .order('scanned_at', { ascending: true });

        if (code) histQuery = histQuery.eq('destination_code', code);
        else histQuery = histQuery.eq('destination', destination!);

        const { data: histRaw } = await histQuery;

        // Aggregate to daily lowest
        const byDay: Record<string, number> = {};
        for (const row of histRaw || []) {
            const day = row.scanned_at.slice(0, 10);
            if (!byDay[day] || Number(row.price) < byDay[day]) byDay[day] = Number(row.price);
        }
        const dailyPrices = Object.entries(byDay)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, price]) => ({ date, price }));

        // 2. Fetch monthly medians (1 year)
        const since1y = new Date();
        since1y.setFullYear(since1y.getFullYear() - 1);
        let monthQuery = supabase
            .from('price_history')
            .select('price, departure_date')
            .gte('scanned_at', since1y.toISOString())
            .not('departure_date', 'is', null)
            .lte('price', MAX_PRICE);

        if (code) monthQuery = monthQuery.eq('destination_code', code);
        else monthQuery = monthQuery.eq('destination', destination!);

        const { data: monthRaw } = await monthQuery;

        const monthMap: Record<number, number[]> = {};
        for (const row of monthRaw || []) {
            if (!row.departure_date) continue;
            const m = new Date(row.departure_date + 'T00:00:00').getMonth();
            if (!monthMap[m]) monthMap[m] = [];
            monthMap[m].push(Number(row.price));
        }

        // IQR outlier filter for price arrays
        function filterOutliers(arr: number[]): number[] {
            if (arr.length < 4) return arr;
            const s = [...arr].sort((a, b) => a - b);
            const q1 = s[Math.floor(s.length * 0.25)];
            const q3 = s[Math.floor(s.length * 0.75)];
            const iqr = q3 - q1;
            return arr.filter(v => v >= q1 - 1.5 * iqr && v <= q3 + 1.5 * iqr);
        }

        const monthlyMedians = Array.from({ length: 12 }, (_, i) => {
            const prices = filterOutliers(monthMap[i] || []);
            if (prices.length === 0) return { month: i, median: 0, avg: 0, min: 0, max: 0, count: 0 };
            const sorted = [...prices].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            const med = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
            return {
                month: i,
                median: Math.round(med),
                avg: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
                min: Math.round(Math.min(...prices)),
                max: Math.round(Math.max(...prices)),
                count: prices.length,
            };
        });

        // 3. Fetch Google Flights insights (from cache if available)
        let googlePriceLevel: 'low' | 'typical' | 'high' | null = null;
        let googleTypicalRange: [number, number] | null = null;
        let googlePriceHistory: Array<[number, number]> | null = null;

        if (code) {
            // Try Supabase cache first
            try {
                const cacheThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                const { data: cached } = await supabase
                    .from('price_insights_cache')
                    .select('*')
                    .eq('destination_code', code)
                    .gte('fetched_at', cacheThreshold)
                    .single();

                if (cached) {
                    googlePriceLevel = cached.price_level as any;
                    googleTypicalRange = [Number(cached.typical_price_low), Number(cached.typical_price_high)];
                    googlePriceHistory = cached.price_history;
                }
            } catch {
                // Cache table may not exist yet — fallback below
            }

            // If no cached data, fetch live from SerpAPI
            if (!googlePriceHistory) {
                try {
                    const insights = await getPriceInsights('YUL', code);
                    if (insights) {
                        googlePriceLevel = insights.price_level;
                        googleTypicalRange = insights.typical_price_range;
                        googlePriceHistory = insights.price_history;
                    }
                } catch {
                    // SerpAPI unavailable — proceed without
                }
            }
        }

        // 4. Enrich daily prices with Google Flights price_history
        //    GF data has 60+ daily observations — merge with local scans
        //    Local data takes priority when both have the same date
        if (googlePriceHistory && googlePriceHistory.length > 0) {
            const localDates = new Set(dailyPrices.map(p => p.date));
            for (const [ts, price] of googlePriceHistory) {
                if (ts <= 0 || price <= 0) continue;
                // GF timestamps are in seconds (10 digits), not ms
                const tsMs = ts < 10000000000 ? ts * 1000 : ts;
                const date = new Date(tsMs).toISOString().split('T')[0];
                if (!localDates.has(date)) {
                    dailyPrices.push({ date, price });
                }
            }
            // Re-sort after merge
            dailyPrices.sort((a, b) => a.date.localeCompare(b.date));
        }

        // 5. Generate forecast
        const forecast = generateForecast({
            dailyPrices,
            monthlyMedians,
            googlePriceLevel,
            googleTypicalRange,
            googlePriceHistory,
            currentBestPrice: currentPrice,
            destination: destination || code || '',
        });

        if (!forecast) {
            return NextResponse.json({
                error: 'Pas assez de données pour générer une prévision. Les données s\'accumulent à chaque scan.',
                minRequired: 5,
                available: dailyPrices.length,
            }, { status: 200 });
        }

        return NextResponse.json(forecast, {
            headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
        });
    } catch (error: any) {
        console.error('[Forecast] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
