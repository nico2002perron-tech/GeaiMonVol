import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { MAX_PRICE } from '@/lib/constants/deals';

export const maxDuration = 60;

/**
 * Agrégation quotidienne gratuite (0 crédit API)
 *
 * Lit price_history des 30 derniers jours pour TOUTES les destinations,
 * trouve le meilleur prix par destination × mois de départ,
 * et upsert dans daily_best_prices.
 *
 * Résultat : chaque jour, on a un snapshot du meilleur prix connu
 * pour les 47 destinations × 12 mois, même si on n'a scanné
 * qu'une seule destination aujourd'hui via l'API.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    const secret = searchParams.get('secret')
        || request.headers.get('x-cron-secret')
        || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const adminSupabase = createAdminSupabase();
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        console.log(`[AggrDaily] Starting daily aggregation for ${today}...`);

        // Lire les prix des 30 derniers jours avec dates de départ futures
        const { data: rawPrices, error: fetchErr } = await adminSupabase
            .from('price_history')
            .select('destination_code, destination, price, airline, stops, departure_date, return_date, source')
            .gte('scanned_at', thirtyDaysAgo)
            .gte('departure_date', today)
            .lte('price', MAX_PRICE)
            .not('departure_date', 'is', null)
            .not('destination_code', 'is', null)
            .neq('source', 'historical_seed')
            .not('source', 'like', 'google_flights%')
            .not('source', 'like', 'skyscanner_explore')  // pas de dates spécifiques
            .order('price', { ascending: true })
            .limit(5000);

        if (fetchErr) {
            console.error('[AggrDaily] Error fetching price_history:', fetchErr);
            return NextResponse.json({ error: fetchErr.message }, { status: 500 });
        }

        if (!rawPrices || rawPrices.length === 0) {
            console.log('[AggrDaily] No price data found');
            return NextResponse.json({ message: 'No data to aggregate', count: 0 });
        }

        console.log(`[AggrDaily] Found ${rawPrices.length} price records to aggregate`);

        // Grouper par destination_code + mois de départ → garder le meilleur prix
        const bestByKey: Record<string, {
            destination_code: string;
            destination: string;
            departure_month: string;
            best_price: number;
            airline: string | null;
            stops: number | null;
            departure_date: string;
            return_date: string | null;
            source: string;
        }> = {};

        for (const row of rawPrices) {
            if (!row.departure_date || !row.destination_code) continue;

            const depMonth = row.departure_date.substring(0, 7); // 'YYYY-MM'
            const key = `${row.destination_code}::${depMonth}`;
            const price = Number(row.price);

            if (!bestByKey[key] || price < bestByKey[key].best_price) {
                bestByKey[key] = {
                    destination_code: row.destination_code,
                    destination: row.destination,
                    departure_month: depMonth,
                    best_price: Math.round(price),
                    airline: row.airline || null,
                    stops: row.stops,
                    departure_date: row.departure_date,
                    return_date: row.return_date || null,
                    source: row.source,
                };
            }
        }

        const dailyRows = Object.values(bestByKey).map(row => ({
            ...row,
            scan_date: today,
        }));

        console.log(`[AggrDaily] Aggregated ${dailyRows.length} best prices (${new Set(dailyRows.map(r => r.destination_code)).size} destinations)`);

        // Upsert dans daily_best_prices par batch de 50
        let upserted = 0;
        const batchSize = 50;

        for (let i = 0; i < dailyRows.length; i += batchSize) {
            const batch = dailyRows.slice(i, i + batchSize);
            const { error: upsertErr } = await adminSupabase
                .from('daily_best_prices')
                .upsert(batch, {
                    onConflict: 'destination_code,scan_date,departure_month',
                    // Si le scan direct a déjà inséré un meilleur prix aujourd'hui, on ne l'écrase pas
                    // L'upsert va comparer et garder le meilleur grâce au ON CONFLICT
                });

            if (upsertErr) {
                console.error(`[AggrDaily] Upsert error (batch ${i}):`, upsertErr);
            } else {
                upserted += batch.length;
            }
        }

        // Stats
        const destCodes = [...new Set(dailyRows.map(r => r.destination_code))];
        const monthsCovered = [...new Set(dailyRows.map(r => r.departure_month))];

        const cheapestByDest = dailyRows.reduce((acc, r) => {
            if (!acc[r.destination_code] || r.best_price < acc[r.destination_code].best_price) {
                acc[r.destination_code] = r;
            }
            return acc;
        }, {} as Record<string, typeof dailyRows[0]>);

        const top5 = Object.values(cheapestByDest)
            .sort((a, b) => a.best_price - b.best_price)
            .slice(0, 5)
            .map(r => ({ dest: r.destination_code, city: r.destination, price: r.best_price, month: r.departure_month }));

        const summary = {
            message: `Daily aggregation complete for ${today}`,
            date: today,
            upserted,
            destinations: destCodes.length,
            monthsCovered: monthsCovered.length,
            sourceRecords: rawPrices.length,
            top5cheapest: top5,
        };

        console.log('[AggrDaily] Summary:', JSON.stringify(summary, null, 2));

        return NextResponse.json(summary);
    } catch (error: any) {
        console.error('[AggrDaily] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
