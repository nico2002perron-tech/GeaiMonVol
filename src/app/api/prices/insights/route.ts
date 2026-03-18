import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getPriceInsights } from '@/lib/providers/flights/serpapi';

// In-memory fallback cache (survives for the lifetime of the serverless function)
const memCache = new Map<string, { data: any; ts: number }>();
const MEM_TTL = 24 * 60 * 60 * 1000; // 24h in-memory

// Supabase cache TTL: 7 days
const DB_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
    const destination = req.nextUrl.searchParams.get('destination');
    const origin = req.nextUrl.searchParams.get('origin') || 'YUL';

    if (!destination || destination.length < 3) {
        return NextResponse.json(
            { error: 'Missing or invalid destination IATA code' },
            { status: 400 }
        );
    }

    const cacheKey = `${origin}-${destination}`;

    // 1. Check in-memory cache
    const mem = memCache.get(cacheKey);
    if (mem && Date.now() - mem.ts < MEM_TTL) {
        return NextResponse.json(mem.data, {
            headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
        });
    }

    try {
        const supabase = await createServerSupabase();
        const threshold = new Date(Date.now() - DB_TTL_MS).toISOString();

        // 2. Check Supabase cache
        const { data: cached } = await supabase
            .from('price_insights_cache')
            .select('*')
            .eq('origin', origin)
            .eq('destination_code', destination)
            .gte('fetched_at', threshold)
            .single();

        if (cached) {
            const response = {
                origin,
                destination,
                lowest_price: cached.lowest_price,
                price_level: cached.price_level,
                typical_price_range: [cached.typical_price_low, cached.typical_price_high],
                price_history: cached.price_history || [],
                cached: true,
                fetched_at: cached.fetched_at,
            };
            memCache.set(cacheKey, { data: response, ts: Date.now() });
            return NextResponse.json(response, {
                headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
            });
        }

        // 3. Fetch from SerpAPI
        const insights = await getPriceInsights(origin, destination);

        if (!insights) {
            return NextResponse.json(
                { origin, destination, error: 'No price insights available for this route', price_history: [] },
                { status: 200 } // Don't fail - just return empty
            );
        }

        const response = {
            origin,
            destination,
            lowest_price: insights.lowest_price,
            price_level: insights.price_level,
            typical_price_range: insights.typical_price_range,
            price_history: insights.price_history,
            cached: false,
            fetched_at: new Date().toISOString(),
        };

        // 4. Cache in Supabase (upsert by route)
        try {
            await supabase
                .from('price_insights_cache')
                .upsert({
                    origin,
                    destination_code: destination,
                    lowest_price: insights.lowest_price,
                    price_level: insights.price_level,
                    typical_price_low: insights.typical_price_range[0],
                    typical_price_high: insights.typical_price_range[1],
                    price_history: insights.price_history,
                    raw_response: insights,
                    fetched_at: new Date().toISOString(),
                }, { onConflict: 'origin,destination_code' });
        } catch (dbErr) {
            // Cache write failure is non-critical
            console.warn('[Insights] Failed to cache in DB:', dbErr);
        }

        // 5. Cache in memory
        memCache.set(cacheKey, { data: response, ts: Date.now() });

        return NextResponse.json(response, {
            headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
        });
    } catch (error: any) {
        console.error('[Insights] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
