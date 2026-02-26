// ============================================
// GeaiMonVol — Moteur de scan de prix v2
// Google Travel Explore + Deep Scan + 12 mois
// ============================================

interface FlightDeal {
    city: string;
    country: string;
    airportCode: string;
    price: number;
    currency: string;
    airline: string;
    airlineCode: string;
    stops: number;
    duration: number;
    departureDate: string;
    returnDate: string;
    route: string;
    tripDuration: number; // nights
    source: string;
    googleFlightsLink: string;
    rawData: any;
}

interface ExploreResult {
    title: string;
    airport_code: string;
    price: number;
    currency: string;
    image_url?: string;
    country?: string;
    flights?: any[];
    start_date?: string;
    end_date?: string;
    google_flights_link?: string;
}

// Régions à scanner avec Google Travel Explore
// On utilise les area_id de Google Knowledge Graph pour scanner par continent
const EXPLORE_REGIONS = [
    { name: 'Europe', arrival_area_id: '/m/02j9z' },
    { name: 'Caraïbes & Mexique', arrival_area_id: '/m/0dg3n1' }, // Caribbean
    { name: 'Amérique du Sud', arrival_area_id: '/m/0jhd' },
    { name: 'Asie', arrival_area_id: '/m/0j0q5' },
    { name: 'Afrique', arrival_area_id: '/m/0dg3n1' }, // Will use specific countries
    { name: 'Amérique centrale', arrival_area_id: '/m/0105s2' },
];

// Destinations spécifiques à toujours scanner (les plus populaires depuis YUL)
const PRIORITY_DESTINATIONS = [
    { city: 'Paris', code: 'CDG', country: 'France' },
    { city: 'Cancún', code: 'CUN', country: 'Mexique' },
    { city: 'Punta Cana', code: 'PUJ', country: 'Rép. Dominicaine' },
    { city: 'Cuba (Varadero)', code: 'VRA', country: 'Cuba' },
    { city: 'La Havane', code: 'HAV', country: 'Cuba' },
    { city: 'Fort Lauderdale', code: 'FLL', country: 'États-Unis' },
    { city: 'New York', code: 'JFK', country: 'États-Unis' },
    { city: 'Barcelone', code: 'BCN', country: 'Espagne' },
    { city: 'Lisbonne', code: 'LIS', country: 'Portugal' },
    { city: 'Rome', code: 'FCO', country: 'Italie' },
    { city: 'Londres', code: 'LHR', country: 'Royaume-Uni' },
    { city: 'Marrakech', code: 'RAK', country: 'Maroc' },
    { city: 'Bangkok', code: 'BKK', country: 'Thaïlande' },
    { city: 'Tokyo', code: 'NRT', country: 'Japon' },
    { city: 'Bogota', code: 'BOG', country: 'Colombie' },
    { city: 'Lima', code: 'LIM', country: 'Pérou' },
    { city: 'São Paulo', code: 'GRU', country: 'Brésil' },
    { city: 'Bali', code: 'DPS', country: 'Indonésie' },
    { city: 'Miami', code: 'MIA', country: 'États-Unis' },
    { city: 'Los Angeles', code: 'LAX', country: 'États-Unis' },
    { city: 'Reykjavik', code: 'KEF', country: 'Islande' },
    { city: 'Athènes', code: 'ATH', country: 'Grèce' },
    { city: 'Dublin', code: 'DUB', country: 'Irlande' },
    { city: 'Amsterdam', code: 'AMS', country: 'Pays-Bas' },
    { city: 'Porto', code: 'OPO', country: 'Portugal' },
    { city: 'Montego Bay', code: 'MBJ', country: 'Jamaïque' },
    { city: 'San José', code: 'SJO', country: 'Costa Rica' },
    { city: 'Cartagena', code: 'CTG', country: 'Colombie' },
    { city: 'Buenos Aires', code: 'EZE', country: 'Argentine' },
    { city: 'Ho Chi Minh', code: 'SGN', country: 'Vietnam' },
    { city: 'Toronto', code: 'YYZ', country: 'Canada' },
    { city: 'Ottawa', code: 'YOW', country: 'Canada' },
    { city: 'Vancouver', code: 'YVR', country: 'Canada' },
    { city: 'Calgary', code: 'YYC', country: 'Canada' },
    { city: 'Edmonton', code: 'YEG', country: 'Canada' },
    { city: 'Winnipeg', code: 'YWG', country: 'Canada' },
    { city: 'Halifax', code: 'YHZ', country: 'Canada' },
    { city: 'Québec', code: 'YQB', country: 'Canada' },
];

const API_KEY = process.env.SERPAPI_KEY;
const ORIGIN = 'YUL';

// Helper : pause entre les requêtes
function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper : générer les dates pour les 12 prochains mois
function getMonthlyDates(): Array<{ outbound: string; return: string; month: string }> {
    const dates: Array<{ outbound: string; return: string; month: string }> = [];
    const now = new Date();

    for (let i = 1; i <= 12; i++) {
        const outbound = new Date(now.getFullYear(), now.getMonth() + i, 15); // 15 du mois
        const returnDate = new Date(outbound);
        returnDate.setDate(outbound.getDate() + 7); // 7 nuits

        // Aussi scanner un weekend (3 nuits) pour les city trips
        const weekendOut = new Date(now.getFullYear(), now.getMonth() + i, 10);
        const weekendDay = weekendOut.getDay();
        // Ajuster au vendredi le plus proche
        weekendOut.setDate(weekendOut.getDate() + (5 - weekendDay + 7) % 7);
        const weekendReturn = new Date(weekendOut);
        weekendReturn.setDate(weekendOut.getDate() + 3);

        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

        dates.push({
            outbound: outbound.toISOString().split('T')[0],
            return: returnDate.toISOString().split('T')[0],
            month: monthNames[outbound.getMonth()],
        });
    }

    return dates;
}

// ============================================
// STRATÉGIE 1 : Google Travel Explore
// 1 requête = TOUTES les destinations pas chères
// ============================================

export async function scanExplore(): Promise<FlightDeal[]> {
    if (!API_KEY) {
        console.error('SERPAPI_KEY not configured');
        return [];
    }

    const results: FlightDeal[] = [];
    const durations = ['one_week', 'weekend', 'two_weeks'];

    for (const duration of durations) {
        try {
            const params = new URLSearchParams({
                engine: 'google_travel_explore',
                departure_id: ORIGIN,
                currency: 'CAD',
                hl: 'fr',
                gl: 'ca',
                travel_duration: duration,
                api_key: API_KEY,
            });

            console.log(`[Explore] Scanning ${duration}...`);
            const response = await fetch(
                `https://serpapi.com/search.json?${params.toString()}`
            );

            if (!response.ok) {
                console.error(`[Explore] Error ${response.status} for ${duration}`);
                continue;
            }

            const data = await response.json();
            const destinations = data.destinations || data.results || [];

            for (const dest of destinations) {
                if (!dest.price) continue;

                const deal: FlightDeal = {
                    city: dest.title || dest.city || 'Unknown',
                    country: dest.country || '',
                    airportCode: dest.airport_code || dest.airports?.[0]?.code || '',
                    price: typeof dest.price === 'number' ? dest.price : (parseInt(String(dest.price), 10) || 0),
                    currency: 'CAD',
                    airline: dest.flights?.[0]?.airline || '',
                    airlineCode: dest.flights?.[0]?.airline_code || '',
                    stops: dest.flights?.[0]?.number_of_stops ?? -1,
                    duration: dest.flights?.[0]?.duration || 0,
                    departureDate: dest.start_date || '',
                    returnDate: dest.end_date || '',
                    route: `YUL – ${dest.airport_code || ''}`,
                    tripDuration: duration === 'weekend' ? 3 : duration === 'one_week' ? 7 : 14,
                    source: 'google_explore',
                    googleFlightsLink: dest.google_flights_link || '',
                    rawData: dest,
                };

                results.push(deal);
            }

            await sleep(2000);
        } catch (error) {
            console.error(`[Explore] Error scanning ${duration}:`, error);
        }
    }

    console.log(`[Explore] Found ${results.length} deals total`);
    return results;
}

// ============================================
// STRATÉGIE 2 : Scan détaillé par destination
// Pour les destinations prioritaires, scan mois par mois
// ============================================

export async function scanDestinationDeep(
    destCode: string,
    destCity: string,
    destCountry: string
): Promise<FlightDeal[]> {
    if (!API_KEY) return [];

    const results: FlightDeal[] = [];
    const dates = getMonthlyDates();

    // Scanner les 6 prochains mois en détail
    const datesToScan = dates.slice(0, 6);

    for (const date of datesToScan) {
        try {
            const params = new URLSearchParams({
                engine: 'google_flights',
                departure_id: ORIGIN,
                arrival_id: destCode,
                outbound_date: date.outbound,
                return_date: date.return,
                currency: 'CAD',
                hl: 'fr',
                gl: 'ca',
                type: '1',
                travel_class: '1',
                sort_by: '2', // trier par prix
                deep_search: 'true', // résultats identiques au navigateur
                api_key: API_KEY,
            });

            console.log(`[Deep] Scanning ${destCity} for ${date.month}...`);
            const response = await fetch(
                `https://serpapi.com/search.json?${params.toString()}`
            );

            if (!response.ok) continue;

            const data = await response.json();
            const flights = [
                ...(data.best_flights || []),
                ...(data.other_flights || []),
            ];

            if (flights.length === 0) continue;

            // Prendre le vol le moins cher
            const cheapest = flights.reduce((min: any, f: any) =>
                (f.price && (!min.price || f.price < min.price)) ? f : min
                , flights[0]);

            const firstLeg = cheapest.flights?.[0];
            if (!firstLeg || !cheapest.price) continue;

            results.push({
                city: destCity,
                country: destCountry,
                airportCode: destCode,
                price: cheapest.price,
                currency: 'CAD',
                airline: firstLeg.airline || '',
                airlineCode: firstLeg.airline_logo ? '' : '',
                stops: (cheapest.flights?.length || 1) - 1,
                duration: cheapest.total_duration || 0,
                departureDate: date.outbound,
                returnDate: date.return,
                route: `YUL – ${destCode}`,
                tripDuration: 7,
                source: 'google_flights_deep',
                googleFlightsLink: data.search_metadata?.google_flights_url || '',
                rawData: {
                    flights: cheapest.flights,
                    layovers: cheapest.layovers,
                    carbon_emissions: cheapest.carbon_emissions,
                    price_insights: data.price_insights,
                },
            });

            await sleep(1500);
        } catch (error) {
            console.error(`[Deep] Error scanning ${destCity} ${date.month}:`, error);
        }
    }

    return results;
}

// ============================================
// STRATÉGIE 3 : Scan complet quotidien
// Combine Explore + Deep scan des top deals
// ============================================

export async function fullDailyScan(): Promise<FlightDeal[]> {
    console.log('========================================');
    console.log('[GeaiMonVol] Starting full daily scan...');
    console.log('========================================');

    const allDeals: FlightDeal[] = [];

    // PHASE 1 : Google Travel Explore (3 requêtes = weekend, 1 semaine, 2 semaines)
    console.log('\n--- Phase 1: Google Travel Explore ---');
    const exploreDeals = await scanExplore();
    allDeals.push(...exploreDeals);

    // PHASE 2 : Scan détaillé de TOUTES les destinations internationales
    console.log('\n--- Phase 2: Deep scan all international destinations ---');
    const topDestinations = PRIORITY_DESTINATIONS.filter(d => d.country !== 'Canada');

    for (const dest of topDestinations) {
        const deepDeals = await scanDestinationDeep(dest.code, dest.city, dest.country);
        allDeals.push(...deepDeals);
    }

    // PHASE 3 : Si Explore a trouvé des deals inattendus (pas dans la liste prioritaire),
    // faire un deep scan de ceux-là aussi
    console.log('\n--- Phase 3: Deep scan surprise deals ---');
    const priorityCodes = new Set(PRIORITY_DESTINATIONS.map(d => d.code));
    const surpriseDeals = exploreDeals.filter(d => !priorityCodes.has(d.airportCode));

    // Scanner les 5 meilleurs deals surprises
    const topSurprises = surpriseDeals
        .sort((a, b) => a.price - b.price)
        .slice(0, 2);

    for (const surprise of topSurprises) {
        if (surprise.airportCode) {
            const deepDeals = await scanDestinationDeep(
                surprise.airportCode,
                surprise.city,
                surprise.country
            );
            allDeals.push(...deepDeals);
        }
    }

    // PHASE 4 : Scan des vols intra-Canada (3 prochains mois)
    console.log('\n--- Phase 4: Canada domestic flights ---');
    const CANADA_DESTINATIONS = PRIORITY_DESTINATIONS.filter(d => d.country === 'Canada');
    const canadaDates = getMonthlyDates().slice(0, 3);

    for (const dest of CANADA_DESTINATIONS) {
        for (const date of canadaDates) {
            try {
                const params = new URLSearchParams({
                    engine: 'google_flights',
                    departure_id: 'YUL',
                    arrival_id: dest.code,
                    outbound_date: date.outbound,
                    return_date: date.return,
                    currency: 'CAD',
                    hl: 'fr',
                    gl: 'ca',
                    type: '1',
                    travel_class: '1',
                    sort_by: '2',
                    api_key: API_KEY!,
                });

                console.log(`[Canada] Scanning ${dest.city} for ${date.month}...`);
                const response = await fetch(
                    `https://serpapi.com/search.json?${params.toString()}`
                );

                if (!response.ok) continue;

                const data = await response.json();
                const flights = [
                    ...(data.best_flights || []),
                    ...(data.other_flights || []),
                ];

                if (flights.length === 0) continue;

                const cheapest = flights[0];
                const firstLeg = cheapest.flights?.[0];
                if (!firstLeg || !cheapest.price) continue;

                allDeals.push({
                    city: dest.city,
                    country: 'Canada',
                    airportCode: dest.code,
                    price: cheapest.price,
                    currency: 'CAD',
                    airline: firstLeg.airline || '',
                    airlineCode: firstLeg.airline_code || '',
                    stops: (cheapest.flights?.length || 1) - 1,
                    duration: cheapest.total_duration || 0,
                    departureDate: date.outbound,
                    returnDate: date.return,
                    route: `YUL – ${dest.code}`,
                    tripDuration: 7,
                    source: 'google_flights_canada',
                    googleFlightsLink: data.search_metadata?.google_flights_url || '',
                    rawData: {
                        flights: cheapest.flights,
                        price_insights: data.price_insights,
                    },
                });

                await sleep(1500);
            } catch (error) {
                console.error(`[Canada] Error scanning ${dest.city} ${date.month}:`, error);
            }
        }
    }

    // Dédupliquer : garder le meilleur prix par destination + mois
    const bestByKey: Record<string, FlightDeal> = {};
    for (const deal of allDeals) {
        const month = deal.departureDate ? deal.departureDate.substring(0, 7) : 'unknown';
        const key = `${deal.city}-${month}-${deal.tripDuration}`;
        if (!bestByKey[key] || deal.price < bestByKey[key].price) {
            bestByKey[key] = deal;
        }
    }

    const uniqueDeals = Object.values(bestByKey);

    console.log('\n========================================');
    console.log(`[GeaiMonVol] Scan complete!`);
    console.log(`  Total raw results: ${allDeals.length}`);
    console.log(`  Unique deals: ${uniqueDeals.length}`);
    console.log(`  Top 5 cheapest:`);
    uniqueDeals
        .sort((a, b) => a.price - b.price)
        .slice(0, 5)
        .forEach(d => console.log(`    ${d.city}: ${d.price}$ (${d.departureDate})`));
    console.log('========================================');

    return uniqueDeals;
}

// ============================================
// ALGORITHME DE RABAIS
// Basé sur l'historique réel de prix
// ============================================

export function calculateRealDiscount(
    currentPrice: number,
    priceHistory: Array<{ price: number; scanned_at: string }>
): { discount: number; avgPrice: number; lowestEver: number; isGoodDeal: boolean; dealLevel: string } {
    if (!priceHistory || priceHistory.length === 0) {
        return { discount: 0, avgPrice: currentPrice, lowestEver: currentPrice, isGoodDeal: false, dealLevel: 'normal' };
    }

    const prices = priceHistory.map(p => p.price);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const lowestEver = Math.min(...prices);
    const highestEver = Math.max(...prices);

    const discount = avgPrice > 0 ? Math.round(((avgPrice - currentPrice) / avgPrice) * 100) : 0;

    // Classifier le deal
    let dealLevel = 'normal';
    let isGoodDeal = false;

    if (currentPrice <= lowestEver) {
        dealLevel = 'lowest_ever'; // 🔥🔥🔥 Prix le plus bas JAMAIS vu
        isGoodDeal = true;
    } else if (discount >= 40) {
        dealLevel = 'incredible'; // 🔥🔥 Deal incroyable
        isGoodDeal = true;
    } else if (discount >= 25) {
        dealLevel = 'great'; // 🔥 Très bon deal
        isGoodDeal = true;
    } else if (discount >= 15) {
        dealLevel = 'good'; // ✅ Bon deal
        isGoodDeal = true;
    } else if (discount >= 5) {
        dealLevel = 'slight'; // Légèrement sous la moyenne
        isGoodDeal = false;
    } else {
        dealLevel = 'normal'; // Prix normal
        isGoodDeal = false;
    }

    return {
        discount: Math.max(discount, 0),
        avgPrice,
        lowestEver,
        isGoodDeal,
        dealLevel,
    };
}

// ============================================
// STRATÉGIE 4 : Scan par phase (chunked)
// Chaque phase tient dans ~60s (Vercel limit)
// Phase choisie par jour de la semaine
// ============================================

export type ScanPhase = 1 | 2 | 3 | 4;

/**
 * Retourne la phase à exécuter selon le jour de la semaine.
 * Lundi/Jeudi = Phase 1 (Explore, ~10s)
 * Mardi/Vendredi = Phase 2 (Deep scan destinations 1-15, ~45s)
 * Mercredi/Samedi = Phase 3 (Deep scan destinations 16-30, ~45s)
 * Dimanche = Phase 4 (Canada domestique, ~30s)
 */
export function getPhaseForToday(): ScanPhase {
    const day = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    switch (day) {
        case 1: case 4: return 1; // Lundi, Jeudi
        case 2: case 5: return 2; // Mardi, Vendredi
        case 3: case 6: return 3; // Mercredi, Samedi
        case 0: return 4;         // Dimanche
        default: return 1;
    }
}

export async function chunkedScan(phase?: ScanPhase): Promise<FlightDeal[]> {
    const effectivePhase = phase ?? getPhaseForToday();

    console.log(`[GeaiMonVol] Chunked scan — Phase ${effectivePhase}`);

    const allDeals: FlightDeal[] = [];

    if (effectivePhase === 1) {
        // Phase 1 : Google Travel Explore (3 requêtes, ~10s)
        console.log('--- Phase 1: Google Travel Explore ---');
        const exploreDeals = await scanExplore();
        allDeals.push(...exploreDeals);

    } else if (effectivePhase === 2) {
        // Phase 2 : Deep scan destinations internationales 1-15 (~45s)
        console.log('--- Phase 2: Deep scan international 1-15 ---');
        const international = PRIORITY_DESTINATIONS.filter(d => d.country !== 'Canada');
        const batch = international.slice(0, 15);
        for (const dest of batch) {
            const deepDeals = await scanDestinationDeep(dest.code, dest.city, dest.country);
            allDeals.push(...deepDeals);
        }

    } else if (effectivePhase === 3) {
        // Phase 3 : Deep scan destinations internationales 16-30 (~45s)
        console.log('--- Phase 3: Deep scan international 16-30 ---');
        const international = PRIORITY_DESTINATIONS.filter(d => d.country !== 'Canada');
        const batch = international.slice(15, 30);
        for (const dest of batch) {
            const deepDeals = await scanDestinationDeep(dest.code, dest.city, dest.country);
            allDeals.push(...deepDeals);
        }

    } else if (effectivePhase === 4) {
        // Phase 4 : Canada domestique (~30s)
        console.log('--- Phase 4: Canada domestic ---');
        const canadaDests = PRIORITY_DESTINATIONS.filter(d => d.country === 'Canada');
        const canadaDates = getMonthlyDates().slice(0, 3);

        for (const dest of canadaDests) {
            for (const date of canadaDates) {
                try {
                    const params = new URLSearchParams({
                        engine: 'google_flights',
                        departure_id: 'YUL',
                        arrival_id: dest.code,
                        outbound_date: date.outbound,
                        return_date: date.return,
                        currency: 'CAD',
                        hl: 'fr',
                        gl: 'ca',
                        type: '1',
                        travel_class: '1',
                        sort_by: '2',
                        api_key: API_KEY!,
                    });

                    console.log(`[Canada] Scanning ${dest.city} for ${date.month}...`);
                    const response = await fetch(
                        `https://serpapi.com/search.json?${params.toString()}`
                    );

                    if (!response.ok) continue;

                    const data = await response.json();
                    const flights = [
                        ...(data.best_flights || []),
                        ...(data.other_flights || []),
                    ];

                    if (flights.length === 0) continue;

                    const cheapest = flights[0];
                    const firstLeg = cheapest.flights?.[0];
                    if (!firstLeg || !cheapest.price) continue;

                    allDeals.push({
                        city: dest.city,
                        country: 'Canada',
                        airportCode: dest.code,
                        price: cheapest.price,
                        currency: 'CAD',
                        airline: firstLeg.airline || '',
                        airlineCode: firstLeg.airline_code || '',
                        stops: (cheapest.flights?.length || 1) - 1,
                        duration: cheapest.total_duration || 0,
                        departureDate: date.outbound,
                        returnDate: date.return,
                        route: `YUL – ${dest.code}`,
                        tripDuration: 7,
                        source: 'google_flights_canada',
                        googleFlightsLink: data.search_metadata?.google_flights_url || '',
                        rawData: {
                            flights: cheapest.flights,
                            price_insights: data.price_insights,
                        },
                    });

                    await sleep(1500);
                } catch (error) {
                    console.error(`[Canada] Error scanning ${dest.city} ${date.month}:`, error);
                }
            }
        }
    }

    // Dédupliquer : garder le meilleur prix par destination + mois
    const bestByKey: Record<string, FlightDeal> = {};
    for (const deal of allDeals) {
        const month = deal.departureDate ? deal.departureDate.substring(0, 7) : 'unknown';
        const key = `${deal.city}-${month}-${deal.tripDuration}`;
        if (!bestByKey[key] || deal.price < bestByKey[key].price) {
            bestByKey[key] = deal;
        }
    }

    const uniqueDeals = Object.values(bestByKey);
    console.log(`[GeaiMonVol] Phase ${effectivePhase} complete — ${uniqueDeals.length} unique deals`);
    return uniqueDeals;
}

// Export pour backward compatibility
export async function scanFlightPrices(): Promise<FlightDeal[]> {
    return fullDailyScan();
}

export { PRIORITY_DESTINATIONS };
