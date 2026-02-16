import { NextResponse } from 'next/server';
import { scanFlightPrices, calculateDiscount } from '@/lib/services/flights';
import { createServerSupabase } from '@/lib/supabase/server';

export const maxDuration = 60; // Allow up to 60 seconds for scanning

export async function GET(request: Request) {
    // Verify cron secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('Starting flight price scan...');

        // Scan prices from Google Flights via SerpAPI
        const flights = await scanFlightPrices();

        console.log(`Scanned ${flights.length} destinations`);

        if (flights.length === 0) {
            return NextResponse.json({ message: 'No flights found', count: 0 });
        }

        // Save to Supabase
        const supabase = await createServerSupabase();

        const records = flights.map((f) => ({
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
            scanned_at: new Date().toISOString(),
        }));

        const { error: insertError } = await supabase
            .from('price_history')
            .insert(records);

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        console.log(`Saved ${records.length} price records`);

        return NextResponse.json({
            message: 'Scan complete',
            count: records.length,
            destinations: flights.map((f) => ({
                city: f.city,
                price: f.price,
                discount: calculateDiscount(f.price, f.typicalPriceRange),
            })),
        });
    } catch (error: any) {
        console.error('Scan error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
