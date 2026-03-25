import { NextResponse } from 'next/server';
import { chunkedScan, getPhaseForToday, HOTEL_GROUPS, HOTEL_PHASES, HOTEL_AI_PHASES, REGULAR_HOTEL_GROUPS } from '@/lib/services/flights';
import { MAX_PRICE } from '@/lib/constants/deals';
import type { ScanPhase } from '@/lib/services/flights';
import { createServerSupabase } from '@/lib/supabase/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { refreshDestinationImages } from '@/lib/services/images';
import { scanToutInclus, scanRegularHotels, TOUT_INCLUS_DESTINATIONS, HOTEL_DESTINATIONS } from '@/lib/services/hotels';

export const maxDuration = 60; // Chaque phase tient dans 60s

// Calculate the first hotel phase number
function getFlightPhasesEnd(): number {
    const BATCH_SIZE = 1; // Must match flights.ts
    const PRIORITY_COUNT = 47; // Must match PRIORITY_DESTINATIONS length
    const TOTAL_DEEP_BATCHES = Math.ceil(PRIORITY_COUNT / BATCH_SIZE);
    return TOTAL_DEEP_BATCHES + 1; // +1 for explore phase
}

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
        // Permettre de forcer une phase via query param (utile pour tests)
        const forcePhase = searchParams.get('phase');
        const phase: ScanPhase = forcePhase
            ? (parseInt(forcePhase, 10) as ScanPhase)
            : getPhaseForToday();

        const flightPhasesEnd = getFlightPhasesEnd();
        const isHotelPhase = phase >= flightPhasesEnd;

        console.log(`Starting ${isHotelPhase ? 'hotel' : 'flight'} scan — Phase ${phase}...`);

        // ── Hotel phases: all-inclusive (first 3) + regular (next 8) ──
        if (isHotelPhase) {
            const hotelGroupIdx = phase - flightPhasesEnd;
            const isAllInclusivePhase = hotelGroupIdx < HOTEL_AI_PHASES;

            if (isAllInclusivePhase) {
                // All-inclusive hotel scan (phases 0-2)
                const groupIndices = HOTEL_GROUPS[hotelGroupIdx];
                if (!groupIndices) {
                    return NextResponse.json({ message: `Phase ${phase}: invalid AI hotel group`, phase, count: 0 });
                }

                const destinations = groupIndices
                    .filter(i => i < TOUT_INCLUS_DESTINATIONS.length)
                    .map(i => TOUT_INCLUS_DESTINATIONS[i]);

                console.log(`[Hotels AI] Scanning group ${hotelGroupIdx + 1}: ${destinations.map(d => d.city).join(', ')}`);
                const hotelsSaved = await scanToutInclus(destinations);

                return NextResponse.json({
                    message: `Phase ${phase} all-inclusive hotel scan complete`,
                    phase,
                    type: 'hotel_all_inclusive',
                    group: hotelGroupIdx + 1,
                    destinations: destinations.map(d => d.city),
                    hotelsSaved,
                });
            } else {
                // Regular hotel scan (phases 3-10) — premium feature
                const regGroupIdx = hotelGroupIdx - HOTEL_AI_PHASES;
                const groupIndices = REGULAR_HOTEL_GROUPS[regGroupIdx];
                if (!groupIndices) {
                    return NextResponse.json({ message: `Phase ${phase}: invalid regular hotel group`, phase, count: 0 });
                }

                const destinations = groupIndices
                    .filter(i => i < HOTEL_DESTINATIONS.length)
                    .map(i => HOTEL_DESTINATIONS[i]);

                console.log(`[Hotels REG] Scanning group ${regGroupIdx + 1}: ${destinations.map(d => d.city).join(', ')}`);
                const hotelsSaved = await scanRegularHotels(destinations);

                return NextResponse.json({
                    message: `Phase ${phase} regular hotel scan complete`,
                    phase,
                    type: 'hotel_regular',
                    group: regGroupIdx + 1,
                    destinations: destinations.map(d => d.city),
                    hotelsSaved,
                });
            }
        }

        // ── Flight phases ──
        const deals = await chunkedScan(phase);

        if (deals.length === 0) {
            return NextResponse.json({ message: `Phase ${phase}: No deals found`, phase, count: 0 });
        }

        const supabase = await createServerSupabase();

        // Sauvegarder les deals (exclure prix > MAX_PRICE)
        const records = deals.filter(d => d.price <= MAX_PRICE).map((d) => ({
            origin: 'YUL',
            destination: d.city,
            destination_code: d.airportCode,
            price: Math.round(d.price),
            currency: d.currency,
            airline: d.airline,
            stops: d.stops >= 0 ? d.stops : null,
            departure_date: d.departureDate || null,
            return_date: d.returnDate || null,
            source: d.source,
            raw_data: {
                ...d.rawData,
                trip_duration: d.tripDuration,
                booking_link: d.bookingLink,
                airline_code: d.airlineCode,
                duration_minutes: d.duration,
            },
            scanned_at: new Date().toISOString(),
        }));

        // Insérer par batch de 50 pour éviter les timeouts
        const batchSize = 50;
        let inserted = 0;

        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            const { error } = await supabase
                .from('price_history')
                .insert(batch);

            if (error) {
                console.error(`Batch insert error (${i}):`, error);
            } else {
                inserted += batch.length;
            }
        }

        // ── Agréger daily_best_prices : meilleur prix par destination × mois de départ ──
        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            // Grouper les deals par destination_code + mois de départ
            const bestByDestMonth: Record<string, {
                destination_code: string;
                destination: string;
                departure_month: string;
                best_price: number;
                airline: string;
                stops: number | null;
                departure_date: string | null;
                return_date: string | null;
                source: string;
            }> = {};

            for (const d of deals) {
                if (!d.departureDate || d.price > MAX_PRICE) continue;
                const depMonth = d.departureDate.substring(0, 7); // 'YYYY-MM'
                const key = `${d.airportCode}::${depMonth}`;

                if (!bestByDestMonth[key] || d.price < bestByDestMonth[key].best_price) {
                    bestByDestMonth[key] = {
                        destination_code: d.airportCode,
                        destination: d.city,
                        departure_month: depMonth,
                        best_price: Math.round(d.price),
                        airline: d.airline,
                        stops: d.stops >= 0 ? d.stops : null,
                        departure_date: d.departureDate,
                        return_date: d.returnDate || null,
                        source: d.source,
                    };
                }
            }

            const dailyRows = Object.values(bestByDestMonth).map(row => ({
                ...row,
                scan_date: today,
            }));

            if (dailyRows.length > 0) {
                const adminSupabase = createAdminSupabase();
                // Upsert : si on re-scanne le même jour, on met à jour avec le meilleur prix
                for (let i = 0; i < dailyRows.length; i += batchSize) {
                    const batch = dailyRows.slice(i, i + batchSize);
                    const { error: dailyErr } = await adminSupabase
                        .from('daily_best_prices')
                        .upsert(batch, { onConflict: 'destination_code,scan_date,departure_month' });

                    if (dailyErr) {
                        console.error(`[DailyBest] Upsert error:`, dailyErr);
                    }
                }
                console.log(`[DailyBest] Saved ${dailyRows.length} daily best prices for ${today}`);
            }
        } catch (dailyBestError) {
            console.error('[DailyBest] Error saving daily best prices:', dailyBestError);
        }

        // Résumé
        const summary = {
            message: `Phase ${phase} scan complete`,
            phase,
            totalDeals: deals.length,
            inserted,
            topDeals: deals
                .sort((a, b) => a.price - b.price)
                .slice(0, 10)
                .map(d => ({
                    city: d.city,
                    price: d.price,
                    date: d.departureDate,
                    source: d.source,
                    airline: d.airline,
                })),
            sources: {
                explore: deals.filter(d => d.source === 'skyscanner_explore').length,
                deep: deals.filter(d => d.source === 'skyscanner_deep').length,
                canada: deals.filter(d => d.source === 'skyscanner_canada').length,
            },
        };

        // Refresh images pour les nouvelles destinations (toutes les phases)
        const cities = [...new Set(deals.map(d => d.city))];
        const imagesResult = await refreshDestinationImages(cities);

        // ── Update destination_meta for scanned destinations ──
        try {
            const adminSupabase = createAdminSupabase();
            const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

            // Group deals by destination code
            const destGroups: Record<string, typeof deals> = {};
            for (const d of deals) {
                if (!destGroups[d.airportCode]) destGroups[d.airportCode] = [];
                destGroups[d.airportCode].push(d);
            }

            for (const [code, destDeals] of Object.entries(destGroups)) {
                const cheapest = destDeals.sort((a, b) => a.price - b.price)[0];

                // Fetch price averages from DB
                const { data: hist } = await adminSupabase
                    .from('price_history')
                    .select('price, scanned_at')
                    .eq('destination_code', code)
                    .gte('scanned_at', ninetyDaysAgo)
                    .neq('source', 'historical_seed')
                    .not('source', 'like', 'google_flights%')
                    .order('price', { ascending: true })
                    .limit(500);

                const prices90 = (hist || []).map(r => r.price);
                const prices30 = (hist || []).filter(r => r.scanned_at >= thirtyDaysAgo).map(r => r.price);
                const prices7 = (hist || []).filter(r => r.scanned_at >= sevenDaysAgo).map(r => r.price);

                const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

                const lowestPrice = prices90.length > 0 ? Math.min(...prices90) : null;
                const lowestRecord = (hist || []).find(r => r.price === lowestPrice);

                await adminSupabase
                    .from('destination_meta')
                    .upsert({
                        destination_code: code,
                        destination: cheapest.city,
                        country: cheapest.country,
                        cheapest_airline: cheapest.airline,
                        avg_price_7d: avg(prices7),
                        avg_price_30d: avg(prices30),
                        avg_price_90d: avg(prices90),
                        lowest_price_ever: lowestPrice,
                        lowest_price_date: lowestRecord?.scanned_at || null,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'destination_code' });
            }
            console.log(`[Meta] Updated destination_meta for ${Object.keys(destGroups).length} destinations`);
        } catch (metaError) {
            console.error('[Meta] Error updating destination_meta:', metaError);
        }

        console.log('Scan summary:', JSON.stringify(summary, null, 2));

        return NextResponse.json({ ...summary, images: imagesResult });
    } catch (error: any) {
        console.error('Scan error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
