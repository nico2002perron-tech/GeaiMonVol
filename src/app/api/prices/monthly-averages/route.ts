import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * GET /api/prices/monthly-averages
 *
 * Retourne les moyennes mensuelles accumulées à partir des snapshots quotidiens
 * (table daily_best_prices). Chaque jour de scan capture le meilleur prix par
 * destination par mois à venir. Ce endpoint agrège ces données en moyennes.
 *
 * Params:
 *   - code (optionnel) : code destination spécifique (ex: CDG, CUN)
 *   - months (optionnel) : nombre de mois futurs à retourner (défaut: 12)
 *
 * Retourne :
 *   - Par destination : moyenne, min, max, nb de snapshots pour chaque mois
 *   - Ou si code spécifié : détail pour cette destination uniquement
 */
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code');
    const monthsParam = parseInt(req.nextUrl.searchParams.get('months') || '12', 10);
    const monthsAhead = Math.min(Math.max(monthsParam, 1), 18);

    try {
        const supabase = await createServerSupabase();

        // Générer les mois futurs à couvrir (YYYY-MM)
        const now = new Date();
        const futureMonths: string[] = [];
        for (let i = 0; i < monthsAhead; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            futureMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }

        // Requêter daily_best_prices
        let query = supabase
            .from('daily_best_prices')
            .select('destination_code, destination, departure_month, best_price, airline, stops, scan_date')
            .in('departure_month', futureMonths)
            .order('scan_date', { ascending: false });

        if (code) {
            query = query.eq('destination_code', code);
        }

        // Limiter à 90 jours de données max
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        query = query.gte('scan_date', ninetyDaysAgo);

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({
                destinations: {},
                summary: { totalSnapshots: 0, monthsCovered: 0, destinationCount: 0 },
            }, {
                headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
            });
        }

        // Agréger : par destination_code × departure_month
        const aggregated: Record<string, Record<string, {
            prices: number[];
            airlines: Record<string, number>;
            stops: number[];
            destination: string;
            latestScanDate: string;
        }>> = {};

        for (const row of data) {
            const destCode = row.destination_code;
            const month = row.departure_month;

            if (!aggregated[destCode]) aggregated[destCode] = {};
            if (!aggregated[destCode][month]) {
                aggregated[destCode][month] = {
                    prices: [],
                    airlines: {},
                    stops: [],
                    destination: row.destination,
                    latestScanDate: row.scan_date,
                };
            }

            const bucket = aggregated[destCode][month];
            bucket.prices.push(Number(row.best_price));
            if (row.airline) {
                bucket.airlines[row.airline] = (bucket.airlines[row.airline] || 0) + 1;
            }
            if (row.stops !== null) bucket.stops.push(row.stops);
            if (row.scan_date > bucket.latestScanDate) bucket.latestScanDate = row.scan_date;
        }

        // Calculer stats par destination × mois
        const MONTH_NAMES_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

        const destinations: Record<string, {
            destination: string;
            months: Array<{
                month: string;
                monthLabel: string;
                avgPrice: number;
                minPrice: number;
                maxPrice: number;
                medianPrice: number;
                snapshots: number;
                trend: 'up' | 'down' | 'stable';
                topAirline: string | null;
                avgStops: number | null;
            }>;
            overallAvg: number;
            cheapestMonth: string;
            cheapestMonthPrice: number;
        }> = {};

        for (const [destCode, monthData] of Object.entries(aggregated)) {
            const months: typeof destinations[string]['months'] = [];
            let cheapestMonth = '';
            let cheapestPrice = Infinity;

            for (const monthKey of futureMonths) {
                const bucket = monthData[monthKey];
                if (!bucket || bucket.prices.length === 0) continue;

                const prices = bucket.prices;
                const sorted = [...prices].sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                const median = sorted.length % 2 === 0
                    ? (sorted[mid - 1] + sorted[mid]) / 2
                    : sorted[mid];

                const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
                const min = Math.min(...prices);
                const max = Math.max(...prices);

                // Tendance : comparer les 3 derniers snapshots vs les 3 premiers
                let trend: 'up' | 'down' | 'stable' = 'stable';
                if (prices.length >= 6) {
                    const recent3 = prices.slice(0, 3); // les plus récents (déjà triés par date desc)
                    const older3 = prices.slice(-3);
                    const recentAvg = recent3.reduce((s, p) => s + p, 0) / 3;
                    const olderAvg = older3.reduce((s, p) => s + p, 0) / 3;
                    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
                    if (change > 5) trend = 'up';
                    else if (change < -5) trend = 'down';
                }

                // Top airline
                const topAirline = Object.entries(bucket.airlines)
                    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

                const avgStops = bucket.stops.length > 0
                    ? Math.round((bucket.stops.reduce((s, v) => s + v, 0) / bucket.stops.length) * 10) / 10
                    : null;

                const [yearStr, monthStr] = monthKey.split('-');
                const monthIdx = parseInt(monthStr, 10) - 1;
                const monthLabel = `${MONTH_NAMES_FR[monthIdx]} ${yearStr}`;

                months.push({
                    month: monthKey,
                    monthLabel,
                    avgPrice: avg,
                    minPrice: Math.round(min),
                    maxPrice: Math.round(max),
                    medianPrice: Math.round(median),
                    snapshots: prices.length,
                    trend,
                    topAirline,
                    avgStops,
                });

                if (avg < cheapestPrice) {
                    cheapestPrice = avg;
                    cheapestMonth = monthKey;
                }
            }

            if (months.length === 0) continue;

            const allPrices = months.map(m => m.avgPrice);
            const overallAvg = Math.round(allPrices.reduce((s, p) => s + p, 0) / allPrices.length);

            destinations[destCode] = {
                destination: monthData[Object.keys(monthData)[0]]?.destination || destCode,
                months,
                overallAvg,
                cheapestMonth,
                cheapestMonthPrice: Math.round(cheapestPrice),
            };
        }

        // Résumé global
        const allDestCodes = Object.keys(destinations);
        const totalSnapshots = data.length;
        const monthsCovered = new Set(data.map(r => r.departure_month)).size;

        return NextResponse.json({
            destinations,
            summary: {
                totalSnapshots,
                monthsCovered,
                destinationCount: allDestCodes.length,
                dataRange: {
                    from: ninetyDaysAgo,
                    to: new Date().toISOString().split('T')[0],
                },
            },
        }, {
            headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
