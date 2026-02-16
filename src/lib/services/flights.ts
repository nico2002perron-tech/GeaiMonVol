export interface FlightResult {
    city: string;
    airportCode: string;
    price: number;
    currency: string;
    airline: string;
    stops: number;
    departureDate: string;
    returnDate: string;
    source: string;
    typicalPriceRange: number[];
    rawData?: any;
}

const DESTINATIONS = [
    { city: 'Paris', code: 'CDG', country: 'France' },
    { city: 'Londres', code: 'LHR', country: 'Royaume-Uni' },
    { city: 'Rome', code: 'FCO', country: 'Italie' },
    { city: 'Madrid', code: 'MAD', country: 'Espagne' },
    { city: 'Barcelone', code: 'BCN', country: 'Espagne' },
    { city: 'Lisbonne', code: 'LIS', country: 'Portugal' },
    { city: 'Amsterdam', code: 'AMS', country: 'Pays-Bas' },
    { city: 'Berlin', code: 'BER', country: 'Allemagne' },
];

export async function scanFlightPrices(): Promise<FlightResult[]> {
    const results: FlightResult[] = [];
    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey) {
        console.error('SERPAPI_KEY not configured');
        return results;
    }

    for (const dest of DESTINATIONS) {
        try {
            // Simulated scan for now to avoid consuming credits during build/test if needed
            // But we want the real logic from Phase 2
            const params = new URLSearchParams({
                engine: 'google_flights',
                departure_id: 'YUL',
                arrival_id: dest.code,
                outbound_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                return_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                currency: 'CAD',
                api_key: apiKey,
            });

            const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
            const data = await response.json();

            const flights = data.best_flights || data.other_flights || [];
            if (flights[0]) {
                results.push({
                    city: dest.city,
                    airportCode: dest.code,
                    price: flights[0].price,
                    currency: 'CAD',
                    airline: flights[0].flights?.[0]?.airline || 'Multiple',
                    stops: flights[0].flights?.[0]?.stops || 0,
                    departureDate: params.get('outbound_date')!,
                    returnDate: params.get('return_date')!,
                    source: 'Google Flights',
                    typicalPriceRange: [400, 1200], // Mock range
                    rawData: data
                });
            }
        } catch (error) {
            console.error(`Error scanning ${dest.city}:`, error);
        }
    }
    return results;
}

export function calculateDiscount(price: number, range: number[]): number {
    const avg = (range[0] + range[1]) / 2;
    if (price >= avg) return 0;
    return Math.round(((avg - price) / avg) * 100);
}
