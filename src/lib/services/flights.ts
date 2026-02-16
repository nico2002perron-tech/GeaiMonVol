interface FlightResult {
    city: string;
    country: string;
    airportCode: string;
    price: number;
    currency: string;
    airline: string;
    airlineLogo: string;
    stops: number;
    duration: number;
    departureDate: string;
    returnDate: string;
    departureTime: string;
    arrivalTime: string;
    route: string;
    priceLevel: string | null;
    typicalPriceRange: [number, number] | null;
    source: string;
    rawData: any;
}

const DESTINATIONS = [
    { city: 'Paris', code: 'CDG', country: 'France' },
    { city: 'Cancún', code: 'CUN', country: 'Mexique' },
    { city: 'New York', code: 'JFK', country: 'États-Unis' },
    { city: 'Bangkok', code: 'BKK', country: 'Thaïlande' },
    { city: 'Barcelone', code: 'BCN', country: 'Espagne' },
    { city: 'Lisbonne', code: 'LIS', country: 'Portugal' },
    { city: 'Rome', code: 'FCO', country: 'Italie' },
    { city: 'Tokyo', code: 'NRT', country: 'Japon' },
    { city: 'Marrakech', code: 'RAK', country: 'Maroc' },
    { city: 'Bali', code: 'DPS', country: 'Indonésie' },
    { city: 'Londres', code: 'LHR', country: 'Royaume-Uni' },
    { city: 'Bogota', code: 'BOG', country: 'Colombie' },
    { city: 'São Paulo', code: 'GRU', country: 'Brésil' },
    { city: 'Cuba', code: 'HAV', country: 'Cuba' },
    { city: 'Punta Cana', code: 'PUJ', country: 'Rép. Dominicaine' },
];

function getSearchDates(): { outbound: string; return: string } {
    // Search for flights 4-8 weeks from now
    const now = new Date();
    const outbound = new Date(now);
    outbound.setDate(now.getDate() + 30 + Math.floor(Math.random() * 30));
    const returnDate = new Date(outbound);
    returnDate.setDate(outbound.getDate() + 7);

    return {
        outbound: outbound.toISOString().split('T')[0],
        return: returnDate.toISOString().split('T')[0],
    };
}

export async function scanFlightPrices(): Promise<FlightResult[]> {
    const results: FlightResult[] = [];
    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey) {
        console.error('SERPAPI_KEY not configured');
        return results;
    }

    for (const dest of DESTINATIONS) {
        try {
            const dates = getSearchDates();

            const params = new URLSearchParams({
                engine: 'google_flights',
                departure_id: 'YUL',
                arrival_id: dest.code,
                outbound_date: dates.outbound,
                return_date: dates.return,
                currency: 'CAD',
                hl: 'fr',
                gl: 'ca',
                type: '1', // round trip
                travel_class: '1', // economy
                sort_by: '2', // sort by price
                stops: '0', // any stops
                api_key: apiKey,
            });

            const response = await fetch(
                `https://serpapi.com/search.json?${params.toString()}`
            );

            if (!response.ok) {
                console.error(`SerpAPI error for ${dest.city}:`, response.status);
                continue;
            }

            const data = await response.json();

            // Extract best flights
            const flights = [
                ...(data.best_flights || []),
                ...(data.other_flights || []),
            ];

            if (flights.length === 0) continue;

            // Take the cheapest flight
            const cheapest = flights[0];
            const firstLeg = cheapest.flights?.[0];

            if (!firstLeg || !cheapest.price) continue;

            const result: FlightResult = {
                city: dest.city,
                country: dest.country,
                airportCode: dest.code,
                price: cheapest.price,
                currency: 'CAD',
                airline: firstLeg.airline || 'Unknown',
                airlineLogo: firstLeg.airline_logo || '',
                stops: cheapest.flights.length - 1,
                duration: cheapest.total_duration || 0,
                departureDate: dates.outbound,
                returnDate: dates.return,
                departureTime: firstLeg.departure_airport?.time || '',
                arrivalTime: firstLeg.arrival_airport?.time || '',
                route: `YUL – ${dest.code}`,
                priceLevel: data.price_insights?.price_level || null,
                typicalPriceRange: data.price_insights?.typical_price_range || null,
                source: 'google_flights',
                rawData: {
                    flights: cheapest.flights,
                    layovers: cheapest.layovers,
                    carbon_emissions: cheapest.carbon_emissions,
                    price_insights: data.price_insights,
                },
            };

            results.push(result);

            // Wait 2 seconds between requests to respect rate limits
            await new Promise((resolve) => setTimeout(resolve, 2000));

        } catch (error) {
            console.error(`Error scanning ${dest.city}:`, error);
        }
    }

    return results;
}

export function calculateDiscount(
    price: number,
    typicalRange: [number, number] | null
): number {
    if (!typicalRange || typicalRange.length < 2) {
        // Fallback: use hardcoded "typical" prices per destination
        return 0;
    }
    const typical = (typicalRange[0] + typicalRange[1]) / 2;
    if (typical <= 0) return 0;
    return Math.round(((typical - price) / typical) * 100);
}
