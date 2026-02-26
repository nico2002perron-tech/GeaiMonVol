import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { calculateRealDiscount } from '@/lib/services/flights';

export async function GET() {
    try {
        const supabase = await createServerSupabase();
        const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // Fetch latest prices AND 30-day history in parallel (2 queries instead of N+1)
        const [latestResult, historyResult] = await Promise.all([
            supabase
                .from('price_history')
                .select('*')
                .gte('scanned_at', threeDaysAgo)
                .order('price', { ascending: true }),
            supabase
                .from('price_history')
                .select('destination, price, scanned_at')
                .gte('scanned_at', thirtyDaysAgo)
                .order('scanned_at', { ascending: false }),
        ]);

        if (latestResult.error || !latestResult.data) {
            return NextResponse.json({ error: latestResult.error?.message || 'Failed to fetch prices' }, { status: 500 });
        }

        // Deduplicate: keep best price per destination
        const bestByDest: Record<string, any> = {};
        for (const row of latestResult.data || []) {
            if (!bestByDest[row.destination] || row.price < bestByDest[row.destination].price) {
                bestByDest[row.destination] = row;
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

        // Enrich prices with discount info — no additional DB queries
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
            lowest_ever: 0,
            incredible: 1,
            great: 2,
            good: 3,
            slight: 4,
            normal: 5,
        };

        enrichedPrices.sort((a, b) => {
            const levelDiff = (levelOrder[a.dealLevel] ?? 5) - (levelOrder[b.dealLevel] ?? 5);
            if (levelDiff !== 0) return levelDiff;
            return b.discount - a.discount;
        });

        return NextResponse.json({
            prices: enrichedPrices,
            count: enrichedPrices.length,
            updatedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
