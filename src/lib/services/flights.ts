// ============================================
// GeaiMonVol — Moteur de scan de prix v3
// Skyscanner via RapidAPI (Sky Scrapper)
// ============================================

import {
    searchEverywhere,
    searchRoundTrip,
    buildBookingLink,
    resolveEntityIds,
} from '@/lib/providers/flights/skyscanner';

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
    bookingLink: string;
    rawData: any;
}

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
    { city: 'Madrid', code: 'MAD', country: 'Espagne' },
    { city: 'Berlin', code: 'BER', country: 'Allemagne' },
    { city: 'Toronto', code: 'YYZ', country: 'Canada' },
    { city: 'Ottawa', code: 'YOW', country: 'Canada' },
    { city: 'Vancouver', code: 'YVR', country: 'Canada' },
    { city: 'Calgary', code: 'YYC', country: 'Canada' },
    { city: 'Edmonton', code: 'YEG', country: 'Canada' },
    { city: 'Winnipeg', code: 'YWG', country: 'Canada' },
    { city: 'Halifax', code: 'YHZ', country: 'Canada' },
    { city: 'Québec', code: 'YQB', country: 'Canada' },
];

const ORIGIN = 'YUL';

// Helper : pause entre les requêtes
function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Durées de séjour à scanner
const TRIP_DURATIONS = [7, 14]; // 7 nuits et 14 nuits

// Helper : générer les dates pour les 12 prochains mois × toutes les durées
function getMonthlyDates(): Array<{ outbound: string; return: string; month: string; tripDuration: number }> {
    const dates: Array<{ outbound: string; return: string; month: string; tripDuration: number }> = [];
    const now = new Date();
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    for (let i = 1; i <= 12; i++) {
        for (const nights of TRIP_DURATIONS) {
            const outbound = new Date(now.getFullYear(), now.getMonth() + i, 15);
            const returnDate = new Date(outbound);
            returnDate.setDate(outbound.getDate() + nights);

            dates.push({
                outbound: outbound.toISOString().split('T')[0],
                return: returnDate.toISOString().split('T')[0],
                month: monthNames[outbound.getMonth()],
                tripDuration: nights,
            });
        }
    }

    return dates;
}

// ============================================
// STRATÉGIE 1 : Skyscanner Explore (Everywhere)
// 1 requête = destinations pas chères depuis YUL
// ============================================

export async function scanExplore(): Promise<FlightDeal[]> {
    if (!process.env.RAPIDAPI_KEY) {
        console.error('RAPIDAPI_KEY not configured');
        return [];
    }

    const results: FlightDeal[] = [];

    try {
        console.log('[Explore] Scanning Skyscanner everywhere...');
        const destinations = await searchEverywhere(ORIGIN, { currency: 'CAD' });

        for (const dest of destinations) {
            if (!dest.price || !dest.skyCode) continue;

            results.push({
                city: dest.city,
                country: dest.country,
                airportCode: dest.skyCode,
                price: dest.price,
                currency: 'CAD',
                airline: '',
                airlineCode: '',
                stops: dest.direct ? 0 : -1,
                duration: 0,
                departureDate: '',
                returnDate: '',
                route: `YUL – ${dest.skyCode}`,
                tripDuration: 7,
                source: 'skyscanner_explore',
                bookingLink: buildBookingLink(ORIGIN, dest.skyCode, '', ''),
                rawData: {
                    direct: dest.direct,
                    imageUrl: dest.imageUrl,
                    entityId: dest.entityId,
                },
            });
        }

        console.log(`[Explore] Found ${results.length} deals from Skyscanner`);
    } catch (error) {
        console.error('[Explore] Error scanning Skyscanner:', error);
    }

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
    if (!process.env.RAPIDAPI_KEY) return [];

    const results: FlightDeal[] = [];
    const dates = getMonthlyDates();

    // Scanner les 12 prochains mois (20k req/mois permet un scan complet)
    const datesToScan = dates;

    for (const date of datesToScan) {
        try {
            console.log(`[Deep] Scanning ${destCity} for ${date.month} (${date.tripDuration}n)...`);

            const flights = await searchRoundTrip(
                ORIGIN,
                destCode,
                date.outbound,
                date.return,
                { sortBy: 'price_low' }
            );

            if (flights.length === 0) continue;

            // Prendre le vol le moins cher
            const cheapest = flights.reduce((min, f) =>
                f.price < min.price ? f : min
                , flights[0]);

            results.push({
                city: destCity,
                country: destCountry,
                airportCode: destCode,
                price: cheapest.price,
                currency: 'CAD',
                airline: cheapest.airline,
                airlineCode: '',
                stops: cheapest.stops,
                duration: cheapest.durationMinutes,
                departureDate: date.outbound,
                returnDate: date.return,
                route: `YUL – ${destCode}`,
                tripDuration: date.tripDuration,
                source: 'skyscanner_deep',
                bookingLink: buildBookingLink(ORIGIN, destCode, date.outbound, date.return),
                rawData: {
                    airline_logo: cheapest.airlineLogo,
                    tags: cheapest.tags,
                    itinerary: cheapest.rawItinerary,
                    return_duration_minutes: cheapest.returnDurationMinutes,
                    return_stops: cheapest.returnStops,
                    seats_remaining: cheapest.seatsRemaining,
                    total_options: flights.length,
                },
            });

            await sleep(600);
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
    console.log('[GeaiMonVol] Starting full daily scan (Skyscanner)...');
    console.log('========================================');

    const allDeals: FlightDeal[] = [];

    // PHASE 1 : Skyscanner Explore (1 requête)
    console.log('\n--- Phase 1: Skyscanner Everywhere ---');
    const exploreDeals = await scanExplore();
    allDeals.push(...exploreDeals);

    // PHASE 2 : Scan détaillé de TOUTES les destinations internationales
    console.log('\n--- Phase 2: Deep scan all international destinations ---');
    const topDestinations = PRIORITY_DESTINATIONS.filter(d => d.country !== 'Canada');

    // Pre-resolve entity IDs to minimize API calls
    await resolveEntityIds([ORIGIN, ...topDestinations.map(d => d.code)]);

    for (const dest of topDestinations) {
        const deepDeals = await scanDestinationDeep(dest.code, dest.city, dest.country);
        allDeals.push(...deepDeals);
    }

    // PHASE 3 : Deep scan des deals surprises trouvés par Explore
    console.log('\n--- Phase 3: Deep scan surprise deals ---');
    const priorityCodes = new Set(PRIORITY_DESTINATIONS.map(d => d.code));
    const surpriseDeals = exploreDeals.filter(d => !priorityCodes.has(d.airportCode));

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

    // PHASE 4 : Scan des vols intra-Canada (12 prochains mois)
    console.log('\n--- Phase 4: Canada domestic flights ---');
    const CANADA_DESTINATIONS = PRIORITY_DESTINATIONS.filter(d => d.country === 'Canada');
    const canadaDates = getMonthlyDates();

    await resolveEntityIds(CANADA_DESTINATIONS.map(d => d.code));

    for (const dest of CANADA_DESTINATIONS) {
        for (const date of canadaDates) {
            try {
                console.log(`[Canada] Scanning ${dest.city} for ${date.month} (${date.tripDuration}n)...`);

                const flights = await searchRoundTrip(
                    ORIGIN,
                    dest.code,
                    date.outbound,
                    date.return,
                    { sortBy: 'price_low' }
                );

                if (flights.length === 0) continue;

                const cheapest = flights[0];

                allDeals.push({
                    city: dest.city,
                    country: 'Canada',
                    airportCode: dest.code,
                    price: cheapest.price,
                    currency: 'CAD',
                    airline: cheapest.airline,
                    airlineCode: '',
                    stops: cheapest.stops,
                    duration: cheapest.durationMinutes,
                    departureDate: date.outbound,
                    returnDate: date.return,
                    route: `YUL – ${dest.code}`,
                    tripDuration: date.tripDuration,
                    source: 'skyscanner_canada',
                    bookingLink: buildBookingLink(ORIGIN, dest.code, date.outbound, date.return),
                    rawData: {
                        airline_logo: cheapest.airlineLogo,
                        itinerary: cheapest.rawItinerary,
                        return_duration_minutes: cheapest.returnDurationMinutes,
                        return_stops: cheapest.returnStops,
                        seats_remaining: cheapest.seatsRemaining,
                        total_options: flights.length,
                    },
                });

                await sleep(600);
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

    const discount = avgPrice > 0 ? Math.round(((avgPrice - currentPrice) / avgPrice) * 100) : 0;

    // Classifier le deal
    let dealLevel = 'normal';
    let isGoodDeal = false;

    if (currentPrice <= lowestEver) {
        dealLevel = 'lowest_ever';
        isGoodDeal = true;
    } else if (discount >= 40) {
        dealLevel = 'incredible';
        isGoodDeal = true;
    } else if (discount >= 25) {
        dealLevel = 'great';
        isGoodDeal = true;
    } else if (discount >= 15) {
        dealLevel = 'good';
        isGoodDeal = true;
    } else if (discount >= 5) {
        dealLevel = 'slight';
        isGoodDeal = false;
    } else {
        dealLevel = 'normal';
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
// Chaque phase tient dans ~55s (Vercel 60s limit)
// 3 destinations × 12 mois = 36 appels par phase
// Rotation automatique basée sur le jour de l'année
// ============================================

const BATCH_SIZE = 2; // 2 destinations × 12 mois × 2 durées = 48 appels ≈ 55s
const TOTAL_DEEP_BATCHES = Math.ceil(PRIORITY_DESTINATIONS.length / BATCH_SIZE); // 14
const TOTAL_PHASES = TOTAL_DEEP_BATCHES + 1; // +1 pour la phase Explore

export type ScanPhase = number;

/**
 * Retourne la phase à exécuter aujourd'hui.
 * Phase 0 = Explore (1 appel, rapide)
 * Phase 1-14 = Deep scan par batch de 3 destinations × 12 mois
 * Cycle complet en 15 jours avec cron quotidien.
 */
export function getPhaseForToday(): ScanPhase {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return dayOfYear % TOTAL_PHASES;
}

export async function chunkedScan(phase?: ScanPhase): Promise<FlightDeal[]> {
    const effectivePhase = phase ?? getPhaseForToday();

    console.log(`[GeaiMonVol] Chunked scan — Phase ${effectivePhase}/${TOTAL_PHASES - 1} (Skyscanner)`);

    const allDeals: FlightDeal[] = [];

    if (effectivePhase === 0) {
        // Phase 0 : Skyscanner Explore (1 requête)
        console.log('--- Phase 0: Skyscanner Everywhere ---');
        const exploreDeals = await scanExplore();
        allDeals.push(...exploreDeals);

    } else {
        // Phase 1-14 : Deep scan d'un batch de 3 destinations × 12 mois
        const batchIndex = effectivePhase - 1;
        const startIdx = batchIndex * BATCH_SIZE;
        const batch = PRIORITY_DESTINATIONS.slice(startIdx, startIdx + BATCH_SIZE);

        if (batch.length === 0) {
            console.log(`[GeaiMonVol] Phase ${effectivePhase}: no destinations in this batch`);
            return [];
        }

        const isCanada = batch.every(d => d.country === 'Canada');
        const source = isCanada ? 'skyscanner_canada' : 'skyscanner_deep';

        console.log(`--- Phase ${effectivePhase}: Deep scan [${batch.map(d => d.city).join(', ')}] × 12 mois ---`);

        await resolveEntityIds([ORIGIN, ...batch.map(d => d.code)]);

        for (const dest of batch) {
            const deepDeals = await scanDestinationDeep(dest.code, dest.city, dest.country);
            // Override source for Canada destinations
            if (dest.country === 'Canada') {
                deepDeals.forEach(d => d.source = 'skyscanner_canada');
            }
            allDeals.push(...deepDeals);
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
