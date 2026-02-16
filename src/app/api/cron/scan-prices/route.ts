import { NextResponse } from 'next/server';
import { scanFlightPrices, calculateDiscount } from '@/lib/services/flights';
import { createServerSupabase } from '@/lib/supabase/server';

export const maxDuration = 60; // Force Phase 2 Push

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const flights = await scanFlightPrices();
        const supabase = await createServerSupabase();

        const records = flights.map(f => ({
            origin: 'YUL',
            destination: f.city,
            destination_code: f.airportCode,
            price: f.price,
            currency: f.currency,
            airline: f.airline,
            stops: f.stops,
            departure_date: f.departureDate,
            return_date: f.returnDate,
            source: f.source,
            raw_data: f.rawData,
            scanned_at: new Date().toISOString()
        }));

        await supabase.from('price_history').insert(records);

        return NextResponse.json({ message: 'Scan complete', count: records.length });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
