import ClientHome from './ClientHome';
import { createServerSupabase } from '@/lib/supabase/server';
import { calculateRealDiscount } from '@/lib/services/flights';
import { MAX_PRICE } from '@/lib/constants/deals';

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
        const today = new Date().toISOString().split('T')[0];

        const [latestResult, historyResult] = await Promise.all([
            supabase
                .from('price_history')
                .select('destination, destination_code, price, currency, airline, stops, departure_date, return_date, source, scanned_at, raw_data')
                .gte('scanned_at', thirtyDaysAgo)
                .neq('source', 'historical_seed')
                .lte('price', MAX_PRICE)
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

        // Filter out non-bookable data + past departure dates
        // Note: 'skyscanner_explore_resolved' = explore deals resolved to airport codes — keep those
        const rows = latestResult.data.filter(
            (r: any) => {
                if (r.source?.startsWith('google_flights')) return false;
                if (r.source === 'skyscanner_explore') return false; // Country-level only
                if (r.departure_date && r.departure_date < today) return false;
                return true;
            }
        );

        // Dedup: best price per destination code (IATA), prefer dated deals
        const bestByDest: Record<string, any> = {};
        for (const row of rows) {
            const key = row.destination_code || row.destination;
            const ex = bestByDest[key];
            if (!ex) { bestByDest[key] = row; continue; }
            const exDates = !!ex.departure_date, rowDates = !!row.departure_date;
            if (rowDates && !exDates) bestByDest[key] = row;
            else if (rowDates === exDates && row.price < ex.price) bestByDest[key] = row;
        }

        // Filter out all country-level explore deals (2-letter codes)
        for (const [key, p] of Object.entries(bestByDest)) {
            const code = (p as any).destination_code || '';
            const isCC = code.length === 2 && code === code.toUpperCase();
            if (isCC) {
                delete bestByDest[key];
            }
        }

        // Group history by destination code (matches how popup API looks up data)
        const histByCode: Record<string, Array<{ price: number; scanned_at: string }>> = {};
        for (const row of historyResult.data || []) {
            (histByCode[row.destination] ??= []).push({ price: row.price, scanned_at: row.scanned_at });
        }

        // Enrich
        const enriched = [];
        for (const [, price] of Object.entries(bestByDest)) {
            const p = price as any;
            const hist = histByCode[p.destination] || [];
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
