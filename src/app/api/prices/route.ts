import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { calculateRealDiscount } from '@/lib/services/flights';
import { COUNTRY_SUBDESTINATIONS } from '@/lib/constants/deals';

// ── In-memory cache (persists across requests on the same Vercel instance) ──
let dealsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
    try {
        // Serve from memory cache if fresh (instant — 0ms)
        if (dealsCache && Date.now() - dealsCache.timestamp < CACHE_TTL) {
            return NextResponse.json(dealsCache.data, {
                headers: {
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                    'X-Cache': 'HIT',
                },
            });
        }

        const supabase = await createServerSupabase();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

        // Fetch latest prices (30-day window) AND 90-day history in parallel
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
                .order('scanned_at', { ascending: false }),
        ]);

        if (latestResult.error || !latestResult.data) {
            return NextResponse.json({ error: latestResult.error?.message || 'Failed to fetch prices' }, { status: 500 });
        }

        // Filter out old Google Flights data (migrated to Skyscanner)
        const skyscannerRows = (latestResult.data || []).filter(
            (row: any) => !row.source?.startsWith('google_flights')
        );

        // Deduplicate: keep best price per destination
        // Prefer deals WITH dates over explore-only deals
        const bestByDest: Record<string, any> = {};
        for (const row of skyscannerRows) {
            const existing = bestByDest[row.destination];
            if (!existing) {
                bestByDest[row.destination] = row;
            } else {
                const existingHasDates = !!existing.departure_date;
                const rowHasDates = !!row.departure_date;
                if (rowHasDates && !existingHasDates) {
                    bestByDest[row.destination] = row;
                } else if (rowHasDates === existingHasDates && row.price < existing.price) {
                    bestByDest[row.destination] = row;
                }
            }
        }

        // Filter out country-level explore deals that have no city picker
        for (const [dest, price] of Object.entries(bestByDest)) {
            const code = price.destination_code || '';
            const isCountryCode = code.length === 2 && code === code.toUpperCase();
            const hasCityPicker = isCountryCode && COUNTRY_SUBDESTINATIONS[code]?.length > 0;
            const hasDates = !!price.departure_date;
            if (isCountryCode && !hasCityPicker && !hasDates) {
                delete bestByDest[dest];
            }
        }

        // Group history by destination (single pass)
        const historyByDest: Record<string, Array<{ price: number; scanned_at: string }>> = {};
        for (const row of historyResult.data || []) {
            if (!historyByDest[row.destination]) {
                historyByDest[row.destination] = [];
            }
            historyByDest[row.destination].push({
                price: row.price,
                scanned_at: row.scanned_at,
            });
        }

        // Enrich prices with discount info
        const enrichedPrices = [];
        for (const [dest, price] of Object.entries(bestByDest)) {
            const history = historyByDest[dest] || [];
            const discountInfo = calculateRealDiscount(price.price, history);

            // Fallback: if not enough history, use Google price_insights
            if (discountInfo.discount === 0 && price.raw_data?.price_insights) {
                const insights = price.raw_data.price_insights;
                const typicalRange = insights.typical_price_range;
                if (typicalRange?.length >= 2) {
                    const typicalAvg = Math.round((typicalRange[0] + typicalRange[1]) / 2);
                    if (typicalAvg > price.price) {
                        const googleDiscount = Math.round(((typicalAvg - price.price) / typicalAvg) * 100);
                        enrichedPrices.push({
                            ...price,
                            discount: googleDiscount,
                            avgPrice: typicalAvg,
                            lowestEver: price.price,
                            isGoodDeal: googleDiscount >= 15,
                            dealLevel: insights.price_level === 'low' ? 'great' : 'normal',
                            priceLevel: insights.price_level,
                        });
                        continue;
                    }
                }
            }

            enrichedPrices.push({
                ...price,
                discount: discountInfo.discount,
                avgPrice: discountInfo.avgPrice,
                lowestEver: discountInfo.lowestEver,
                isGoodDeal: discountInfo.isGoodDeal,
                dealLevel: discountInfo.dealLevel,
            });
        }

        // Sort: best deals first
        const levelOrder: Record<string, number> = {
            lowest_ever: 0, incredible: 1, great: 2, good: 3, slight: 4, normal: 5,
        };

        enrichedPrices.sort((a, b) => {
            const levelDiff = (levelOrder[a.dealLevel] ?? 5) - (levelOrder[b.dealLevel] ?? 5);
            if (levelDiff !== 0) return levelDiff;
            return b.discount - a.discount;
        });

        const result = {
            prices: enrichedPrices,
            count: enrichedPrices.length,
            updatedAt: new Date().toISOString(),
        };

        // Store in memory cache
        dealsCache = { data: result, timestamp: Date.now() };

        return NextResponse.json(result, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                'X-Cache': 'MISS',
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
