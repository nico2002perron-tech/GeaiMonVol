import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { calculateRealDiscount } from '@/lib/services/flights';
import { COUNTRY_SUBDESTINATIONS, ALL_INCLUSIVE_CODES, MAX_PRICE } from '@/lib/constants/deals';

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
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD for filtering past flights

        // Step 1: Fetch latest prices (30-day window)
        const latestResult = await supabase
            .from('price_history')
            .select('destination, destination_code, price, currency, airline, stops, departure_date, return_date, source, scanned_at, raw_data')
            .gte('scanned_at', thirtyDaysAgo)
            .neq('source', 'historical_seed')
            .lte('price', MAX_PRICE)
            .order('price', { ascending: true });

        if (latestResult.error || !latestResult.data) {
            return NextResponse.json({ error: latestResult.error?.message || 'Failed to fetch prices' }, { status: 500 });
        }

        // Filter out old Google Flights data and deals with past departure dates
        const skyscannerRows = (latestResult.data || []).filter(
            (row: any) => {
                if (row.source?.startsWith('google_flights')) return false;
                if (row.departure_date && row.departure_date < today) return false;
                return true;
            }
        );

        // Deduplicate: keep best price per destination code (IATA)
        const bestByDest: Record<string, any> = {};
        for (const row of skyscannerRows) {
            const key = row.destination_code || row.destination;
            const existing = bestByDest[key];
            if (!existing) {
                bestByDest[key] = row;
            } else {
                const existingHasDates = !!existing.departure_date;
                const rowHasDates = !!row.departure_date;
                if (rowHasDates && !existingHasDates) {
                    bestByDest[key] = row;
                } else if (rowHasDates === existingHasDates && row.price < existing.price) {
                    bestByDest[key] = row;
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

        // Step 2: Fetch 90-day history filtered by the destination codes we have
        const destCodes = Object.values(bestByDest)
            .map((p: any) => p.destination_code)
            .filter(Boolean);

        // Only use REAL scan data for discount calculation (no fabricated historical_seed)
        const historyResult = await supabase
            .from('price_history')
            .select('destination_code, price, scanned_at')
            .in('destination_code', destCodes)
            .gte('scanned_at', ninetyDaysAgo)
            .neq('source', 'historical_seed')
            .not('source', 'like', 'google_flights%')
            .lte('price', MAX_PRICE)
            .order('scanned_at', { ascending: false })
            .limit(5000);

        // Group history by destination code
        const historyByCode: Record<string, Array<{ price: number; scanned_at: string }>> = {};
        for (const row of historyResult.data || []) {
            const key = row.destination_code;
            if (!historyByCode[key]) {
                historyByCode[key] = [];
            }
            historyByCode[key].push({
                price: row.price,
                scanned_at: row.scanned_at,
            });
        }

        // Enrich prices with discount info (median-based)
        const enrichedPrices = [];
        for (const [, price] of Object.entries(bestByDest)) {
            const historyKey = price.destination_code || price.destination;
            const history = historyByCode[historyKey] || [];
            const discountInfo = calculateRealDiscount(price.price, history);

            enrichedPrices.push({
                ...price,
                discount: discountInfo.discount,
                avgPrice: discountInfo.avgPrice,
                medianPrice: discountInfo.medianPrice,
                lowestEver: discountInfo.lowestEver,
                isGoodDeal: discountInfo.isGoodDeal,
                dealLevel: discountInfo.dealLevel,
                historyCount: discountInfo.historyCount,
            });
        }

        // Enrich all-inclusive deals with hotel prices from hotel_prices table
        const allInclusiveCodes = enrichedPrices
            .filter(p => ALL_INCLUSIVE_CODES.includes(p.destination_code))
            .map(p => p.destination_code);

        if (allInclusiveCodes.length > 0) {
            const hotelCacheThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const adminSupabase = createAdminSupabase();
            const { data: hotelData } = await adminSupabase
                .from('hotel_prices')
                .select('destination_code, hotel_name, stars, price_per_night, total_price, nights, rating, image_url, booking_url')
                .in('destination_code', allInclusiveCodes)
                .eq('is_all_inclusive', true)
                .gte('scanned_at', hotelCacheThreshold)
                .gte('stars', 3)
                .order('price_per_night', { ascending: true });

            if (hotelData && hotelData.length > 0) {
                // Group best hotel per destination
                const bestHotelByDest: Record<string, any> = {};
                for (const h of hotelData) {
                    if (!bestHotelByDest[h.destination_code]) {
                        bestHotelByDest[h.destination_code] = h;
                    }
                }

                // Enrich flight deals with hotel info
                for (const deal of enrichedPrices) {
                    const hotel = bestHotelByDest[deal.destination_code];
                    if (hotel) {
                        const nights = hotel.nights || 7;
                        deal.hotelPrice = hotel.price_per_night;
                        deal.hotelTotal = hotel.total_price || hotel.price_per_night * nights;
                        deal.hotelName = hotel.hotel_name;
                        deal.hotelStars = hotel.stars;
                        deal.hotelRating = hotel.rating;
                        deal.hotelImage = hotel.image_url;
                        deal.hotelBookingUrl = hotel.booking_url;
                        deal.hotelNights = nights;
                        deal.totalPackPrice = deal.price + (hotel.total_price || hotel.price_per_night * nights);
                    }
                }
            }
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

        // Only show real deals: at least 5% below median (not 'normal' level)
        const goodPrices = enrichedPrices.filter(d => {
            if (d.historyCount < 3) return true;
            return d.dealLevel !== 'normal';
        });

        const result = {
            prices: goodPrices,
            count: goodPrices.length,
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
