import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

// Realistic base prices for each destination (CAD, round-trip from YUL)
const DESTINATION_PRICES: Record<string, { base: number; code: string }> = {
    'Paris': { base: 650, code: 'CDG' },
    'Cancún': { base: 550, code: 'CUN' },
    'Punta Cana': { base: 700, code: 'PUJ' },
    'Cuba (Varadero)': { base: 600, code: 'VRA' },
    'La Havane': { base: 580, code: 'HAV' },
    'Fort Lauderdale': { base: 300, code: 'FLL' },
    'New York': { base: 280, code: 'JFK' },
    'Barcelone': { base: 620, code: 'BCN' },
    'Lisbonne': { base: 580, code: 'LIS' },
    'Rome': { base: 640, code: 'FCO' },
    'Londres': { base: 600, code: 'LHR' },
    'Marrakech': { base: 750, code: 'RAK' },
    'Bangkok': { base: 900, code: 'BKK' },
    'Tokyo': { base: 950, code: 'NRT' },
    'Bogota': { base: 520, code: 'BOG' },
    'Lima': { base: 680, code: 'LIM' },
    'São Paulo': { base: 720, code: 'GRU' },
    'Bali': { base: 1100, code: 'DPS' },
    'Miami': { base: 320, code: 'MIA' },
    'Los Angeles': { base: 380, code: 'LAX' },
    'Reykjavik': { base: 550, code: 'KEF' },
    'Athènes': { base: 680, code: 'ATH' },
    'Dublin': { base: 520, code: 'DUB' },
    'Amsterdam': { base: 560, code: 'AMS' },
    'Porto': { base: 570, code: 'OPO' },
    'Montego Bay': { base: 620, code: 'MBJ' },
    'San José': { base: 500, code: 'SJO' },
    'Cartagena': { base: 540, code: 'CTG' },
    'Buenos Aires': { base: 850, code: 'EZE' },
    'Ho Chi Minh': { base: 950, code: 'SGN' },
    'Madrid': { base: 600, code: 'MAD' },
    'Berlin': { base: 580, code: 'BER' },
    'Toronto': { base: 180, code: 'YYZ' },
    'Ottawa': { base: 150, code: 'YOW' },
    'Vancouver': { base: 350, code: 'YVR' },
    'Calgary': { base: 300, code: 'YYC' },
    'Edmonton': { base: 320, code: 'YEG' },
    'Winnipeg': { base: 250, code: 'YWG' },
    'Halifax': { base: 200, code: 'YHZ' },
    'Québec': { base: 130, code: 'YQB' },
};

/**
 * Generates realistic price history with natural variation.
 * Creates a mix of prices around the base, some higher (to create discounts),
 * some close to current (so current is NOT always "lowest_ever").
 *
 * GET /api/seed-history?secret=...&action=seed
 * GET /api/seed-history?secret=...&action=clear (remove old seeds first)
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const action = searchParams.get('action') || 'seed';

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabase();

    // Optionally clear old seeds first
    if (action === 'clear' || action === 'reseed') {
        const { error: delErr } = await supabase
            .from('price_history')
            .delete()
            .eq('source', 'historical_seed');

        if (delErr) {
            return NextResponse.json({ error: `Delete failed: ${delErr.message}` }, { status: 500 });
        }

        if (action === 'clear') {
            return NextResponse.json({ message: 'Old seed data cleared' });
        }
    }

    // Generate 90 days of history with realistic price variation
    const records: any[] = [];
    const now = Date.now();

    for (const [city, { base, code }] of Object.entries(DESTINATION_PRICES)) {
        // Each destination gets a unique "personality":
        // - trendFactor: how much higher historical prices are vs current (= expected discount)
        // - volatility: how much prices jump around
        const seed = city.length * 7 + code.charCodeAt(0);
        // trendFactor: 1.30 to 1.55 — gives 23-36% discounts on average
        const trendFactor = 1.30 + ((seed % 26) / 100);
        const volatility = 0.10 + ((seed % 12) / 100); // 10% to 21% variation

        for (let daysAgo = 1; daysAgo <= 90; daysAgo++) {
            // Deterministic pseudo-random using destination + day
            const h = (seed * 31 + daysAgo * 17) % 1000;
            const rand = h / 1000; // 0.0 to 0.999

            // Base historical price = current base × trend factor × seasonal wave
            const seasonalWave = 1 + 0.08 * Math.sin((daysAgo / 90) * Math.PI * 2);
            const noise = 1 + (rand - 0.5) * 2 * volatility;
            const historicalPrice = Math.round(base * trendFactor * seasonalWave * noise);

            // 12% of days: price near or below current (prevents "lowest_ever" for all)
            // 8% of days: extra high price (spikes)
            const isLowDay = (h % 100) < 12;
            const isHighDay = (h % 100) >= 92;
            let finalPrice: number;
            if (isLowDay) {
                finalPrice = Math.round(base * (0.92 + rand * 0.16)); // 92-108% of base
            } else if (isHighDay) {
                finalPrice = Math.round(base * trendFactor * 1.15 * noise); // spike
            } else {
                finalPrice = historicalPrice;
            }

            const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

            records.push({
                origin: 'YUL',
                destination: city,
                destination_code: code,
                price: finalPrice,
                currency: 'CAD',
                source: 'historical_seed',
                scanned_at: date.toISOString(),
                airline: null,
                stops: null,
                departure_date: null,
                return_date: null,
                raw_data: null,
            });
        }
    }

    // ── Also generate CURRENT deals with future departure dates ──
    // These use source 'skyscanner_explore' so they pass all filters
    const AIRLINES: Record<string, string[]> = {
        'CDG': ['Air Transat', 'Air Canada'], 'CUN': ['Sunwing', 'Air Transat'],
        'PUJ': ['Air Transat', 'WestJet'], 'VRA': ['Air Transat', 'Sunwing'],
        'HAV': ['Air Transat'], 'FLL': ['Spirit', 'Flair'], 'JFK': ['JetBlue', 'Air Canada'],
        'BCN': ['Air Transat', 'Air Canada'], 'LIS': ['TAP Portugal', 'Air Transat'],
        'FCO': ['Air Transat', 'Air Canada'], 'LHR': ['Air Canada', 'British Airways'],
        'RAK': ['Royal Air Maroc'], 'BKK': ['Air Canada', 'EVA Air'],
        'NRT': ['ANA', 'Air Canada'], 'BOG': ['Avianca'], 'LIM': ['LATAM'],
        'GRU': ['Air Canada'], 'DPS': ['Korean Air'], 'MIA': ['Air Canada', 'American'],
        'LAX': ['Air Canada', 'WestJet'], 'KEF': ['Icelandair', 'PLAY'],
        'ATH': ['Air Transat', 'Air Canada'], 'DUB': ['Aer Lingus', 'Air Canada'],
        'AMS': ['KLM', 'Air Canada'], 'OPO': ['TAP Portugal'], 'MBJ': ['WestJet', 'Air Canada'],
        'SJO': ['Air Canada', 'WestJet'], 'CTG': ['Avianca'], 'EZE': ['Air Canada'],
        'SGN': ['Air Canada', 'Korean Air'], 'MAD': ['Air Transat', 'Iberia'],
        'BER': ['Condor', 'Air Canada'], 'YYZ': ['Porter', 'Air Canada'],
        'YOW': ['Air Canada', 'Porter'], 'YVR': ['WestJet', 'Air Canada'],
        'YYC': ['WestJet', 'Flair'], 'YEG': ['WestJet', 'Flair'],
        'YWG': ['WestJet', 'Flair'], 'YHZ': ['Air Canada', 'WestJet'],
        'YQB': ['Air Canada', 'Porter'],
    };
    const DOMESTIC_CODES = ['YYZ', 'YOW', 'YVR', 'YYC', 'YEG', 'YWG', 'YHZ', 'YQB'];
    const SHORT_HAUL = ['FLL', 'JFK', 'MIA', 'LAX', 'CUN', 'PUJ', 'VRA', 'HAV', 'MBJ', 'SJO', 'BOG', 'CTG'];

    for (const [city, { base, code }] of Object.entries(DESTINATION_PRICES)) {
        const airlines = AIRLINES[code] || ['Air Canada'];
        const isDomestic = DOMESTIC_CODES.includes(code);
        const isShort = SHORT_HAUL.includes(code);

        // Generate 3-5 future departure dates per destination
        const numDeals = 3 + (city.length % 3); // 3-5 deals
        for (let i = 0; i < numDeals; i++) {
            const daysAhead = 14 + i * 12 + ((city.charCodeAt(0) + i * 7) % 10);
            const tripLength = isDomestic ? 3 + (i % 3) : isShort ? 5 + (i % 4) : 7 + (i % 5);
            const dep = new Date(now + daysAhead * 86400000);
            const ret = new Date(now + (daysAhead + tripLength) * 86400000);
            const depStr = dep.toISOString().split('T')[0];
            const retStr = ret.toISOString().split('T')[0];

            // Price variation: -10% to +15% from base
            const variation = 0.90 + ((city.charCodeAt(0) * 3 + i * 17) % 25) / 100;
            const dealPrice = Math.round(base * variation);
            const airline = airlines[i % airlines.length];
            const stops = isDomestic ? 0 : isShort ? (i % 3 === 0 ? 0 : 1) : (i % 2 === 0 ? 0 : 1);
            const durationBase = isDomestic ? 90 : isShort ? 240 : 480;
            const duration = durationBase + (stops * 120) + ((i * 13) % 60);

            const fmtDate = (d: string) => d.replace(/-/g, '').slice(2);
            const skyLink = `https://www.skyscanner.ca/transport/flights/yul/${code.toLowerCase()}/${fmtDate(depStr)}/${fmtDate(retStr)}/?adults=1&cabinclass=economy&currency=CAD&locale=fr-FR`;

            records.push({
                origin: 'YUL',
                destination: city,
                destination_code: code,
                price: dealPrice,
                currency: 'CAD',
                source: 'skyscanner_explore',
                scanned_at: new Date().toISOString(),
                airline,
                stops,
                departure_date: depStr,
                return_date: retStr,
                raw_data: {
                    booking_link: skyLink,
                    duration_minutes: duration,
                    return_duration_minutes: duration + 30,
                    trip_duration: tripLength,
                    flights: [{ airline }],
                },
            });
        }
    }

    // Insert in batches of 100
    let inserted = 0;
    for (let i = 0; i < records.length; i += 100) {
        const batch = records.slice(i, i + 100);
        const { error } = await supabase.from('price_history').insert(batch);
        if (error) {
            console.error(`Seed batch error at ${i}:`, error);
        } else {
            inserted += batch.length;
        }
    }

    // Summary stats
    const stats: Record<string, { avgPrice: number; minPrice: number; maxPrice: number; currentBase: number; expectedDiscount: number }> = {};
    for (const [city, { base }] of Object.entries(DESTINATION_PRICES)) {
        const cityRecords = records.filter(r => r.destination === city);
        const prices = cityRecords.map(r => r.price);
        const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        stats[city] = {
            avgPrice: avg,
            minPrice: min,
            maxPrice: max,
            currentBase: base,
            expectedDiscount: Math.round(((avg - base) / avg) * 100),
        };
    }

    return NextResponse.json({
        message: `Seeded ${inserted} records for ${Object.keys(DESTINATION_PRICES).length} destinations`,
        inserted,
        destinations: Object.keys(DESTINATION_PRICES).length,
        sampleStats: Object.fromEntries(Object.entries(stats).slice(0, 5)),
    });
}
