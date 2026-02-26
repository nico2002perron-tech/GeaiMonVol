import { NextResponse } from 'next/server';
import { chunkedScan, getPhaseForToday } from '@/lib/services/flights';
import type { ScanPhase } from '@/lib/services/flights';
import { createServerSupabase } from '@/lib/supabase/server';

export const maxDuration = 60; // Chaque phase tient dans 60s

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret') || request.headers.get('x-cron-secret');

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Permettre de forcer une phase via query param (utile pour tests)
        const forcePhase = searchParams.get('phase');
        const phase: ScanPhase = forcePhase
            ? (parseInt(forcePhase, 10) as ScanPhase)
            : getPhaseForToday();

        console.log(`Starting chunked scan — Phase ${phase}...`);

        const deals = await chunkedScan(phase);

        if (deals.length === 0) {
            return NextResponse.json({ message: `Phase ${phase}: No deals found`, phase, count: 0 });
        }

        const supabase = await createServerSupabase();

        // Sauvegarder tous les deals
        const records = deals.map((d) => ({
            origin: 'YUL',
            destination: d.city,
            destination_code: d.airportCode,
            price: d.price,
            currency: d.currency,
            airline: d.airline,
            stops: d.stops >= 0 ? d.stops : null,
            departure_date: d.departureDate || null,
            return_date: d.returnDate || null,
            source: d.source,
            raw_data: {
                ...d.rawData,
                trip_duration: d.tripDuration,
                google_flights_link: d.googleFlightsLink,
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
                explore: deals.filter(d => d.source === 'google_explore').length,
                deep: deals.filter(d => d.source === 'google_flights_deep').length,
                canada: deals.filter(d => d.source === 'google_flights_canada').length,
            },
        };

        console.log('Scan summary:', JSON.stringify(summary, null, 2));

        return NextResponse.json(summary);
    } catch (error: any) {
        console.error('Scan error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
