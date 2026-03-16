import ClientHome from './ClientHome';
import { createServerSupabase } from '@/lib/supabase/server';
import { calculateRealDiscount } from '@/lib/services/flights';
import { COUNTRY_SUBDESTINATIONS } from '@/lib/constants/deals';

// Revalidate every 5 minutes — ISR
export const revalidate = 300;

/**
 * Server Component — pre-fetches deals from Supabase so the page
 * renders WITH data immediately (no loading spinner).
 */
async function getDeals() {
    try {
        const supabase = await createServerSupabase();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

        const [latestResult, historyResult] = await Promise.all([
            supabase
                .from('price_history')
                .select('destination, destination_code, price, currency, airline, stops, departure_date, return_date, source, scanned_at, raw_data')
                .gte('scanned_at', thirtyDaysAgo)
                .neq('source', 'historical_seed')
                .order('price', { ascending: true }),
            supabase
                .from('price_history')
                .select('destination, price, scanned_at')
                .gte('scanned_at', ninetyDaysAgo)
                .neq('source', 'historical_seed')
                .not('source', 'like', 'google_flights%')
                .order('scanned_at', { ascending: false }),
        ]);

        if (latestResult.error || !latestResult.data) return [];

        // Filter out old Google Flights
        const rows = latestResult.data.filter(
            (r: any) => !r.source?.startsWith('google_flights')
        );

        // Dedup: best price per destination, prefer dated deals
        const bestByDest: Record<string, any> = {};
        for (const row of rows) {
            const ex = bestByDest[row.destination];
            if (!ex) { bestByDest[row.destination] = row; continue; }
            const exDates = !!ex.departure_date, rowDates = !!row.departure_date;
            if (rowDates && !exDates) bestByDest[row.destination] = row;
            else if (rowDates === exDates && row.price < ex.price) bestByDest[row.destination] = row;
        }

        // Filter useless country codes
        for (const [dest, p] of Object.entries(bestByDest)) {
            const code = (p as any).destination_code || '';
            const isCC = code.length === 2 && code === code.toUpperCase();
            if (isCC && !(COUNTRY_SUBDESTINATIONS[code]?.length > 0) && !(p as any).departure_date) {
                delete bestByDest[dest];
            }
        }

        // Group history
        const histByDest: Record<string, Array<{ price: number; scanned_at: string }>> = {};
        for (const row of historyResult.data || []) {
            (histByDest[row.destination] ??= []).push({ price: row.price, scanned_at: row.scanned_at });
        }

        // Enrich
        const enriched = [];
        for (const [, price] of Object.entries(bestByDest)) {
            const p = price as any;
            const hist = histByDest[p.destination] || [];
            const info = calculateRealDiscount(p.price, hist);
            enriched.push({
                ...p,
                discount: info.discount,
                avgPrice: info.avgPrice,
                medianPrice: info.medianPrice,
                lowestEver: info.lowestEver,
                isGoodDeal: info.isGoodDeal,
                dealLevel: info.dealLevel,
                historyCount: info.historyCount,
                bookingLink: p.raw_data?.booking_link || '',
                duration: p.raw_data?.duration_minutes || 0,
            });
        }

        // Only show real deals: at least 5% below median (not 'normal' level)
        const goodDeals = enriched.filter(d => {
            if (d.historyCount < 3) return true;
            return d.dealLevel !== 'normal';
        });

        // Sort
        const order: Record<string, number> = { lowest_ever: 0, incredible: 1, great: 2, good: 3, slight: 4, normal: 5 };
        goodDeals.sort((a, b) => {
            const d = (order[a.dealLevel] ?? 5) - (order[b.dealLevel] ?? 5);
            return d !== 0 ? d : b.discount - a.discount;
        });

        return goodDeals;
    } catch {
        return [];
    }
}

export default async function Home() {
    const initialDeals = await getDeals();

    return <ClientHome initialDeals={initialDeals} />;
}
