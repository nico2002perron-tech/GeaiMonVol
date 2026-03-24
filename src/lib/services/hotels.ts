// ============================================
// Hotels Service — scan, cache, pack deals
// ============================================

import { searchAllInclusive, searchHotels } from '@/lib/providers/hotels/skyscanner';
import type { HotelResult } from '@/lib/providers/hotels/skyscanner';
import { createAdminSupabase } from '@/lib/supabase/admin';

// All-inclusive destinations (15 Caribbean/beach)
export const TOUT_INCLUS_DESTINATIONS = [
    { city: 'Cancún', code: 'CUN', country: 'Mexique' },
    { city: 'Punta Cana', code: 'PUJ', country: 'Rép. Dominicaine' },
    { city: 'Varadero', code: 'VRA', country: 'Cuba' },
    { city: 'La Havane', code: 'HAV', country: 'Cuba' },
    { city: 'Montego Bay', code: 'MBJ', country: 'Jamaïque' },
    { city: 'San José', code: 'SJO', country: 'Costa Rica' },
    { city: 'Nassau', code: 'NAS', country: 'Bahamas' },
    { city: 'Bridgetown', code: 'BGI', country: 'Barbade' },
    { city: 'Cayo Coco', code: 'CCC', country: 'Cuba' },
    { city: 'Puerto Vallarta', code: 'PVR', country: 'Mexique' },
    { city: 'Los Cabos', code: 'SJD', country: 'Mexique' },
    { city: 'Liberia', code: 'LIR', country: 'Costa Rica' },
    { city: 'Puerto Plata', code: 'POP', country: 'Rép. Dominicaine' },
    { city: 'Santo Domingo', code: 'SDQ', country: 'Rép. Dominicaine' },
    { city: 'Freeport', code: 'FPO', country: 'Bahamas' },
];

// Regular hotel destinations — all non-Caribbean priority destinations (premium feature)
export const HOTEL_DESTINATIONS = [
    { city: 'Paris', code: 'CDG', country: 'France' },
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
    { city: 'Fort Lauderdale', code: 'FLL', country: 'États-Unis' },
    { city: 'Los Angeles', code: 'LAX', country: 'États-Unis' },
    { city: 'Reykjavik', code: 'KEF', country: 'Islande' },
    { city: 'Athènes', code: 'ATH', country: 'Grèce' },
    { city: 'Dublin', code: 'DUB', country: 'Irlande' },
    { city: 'Amsterdam', code: 'AMS', country: 'Pays-Bas' },
    { city: 'Porto', code: 'OPO', country: 'Portugal' },
    { city: 'Cartagena', code: 'CTG', country: 'Colombie' },
    { city: 'Buenos Aires', code: 'EZE', country: 'Argentine' },
    { city: 'Ho Chi Minh', code: 'SGN', country: 'Vietnam' },
    { city: 'Madrid', code: 'MAD', country: 'Espagne' },
    { city: 'Berlin', code: 'BER', country: 'Allemagne' },
    { city: 'Séoul', code: 'ICN', country: 'Corée du Sud' },
    { city: 'Le Caire', code: 'CAI', country: 'Égypte' },
    { city: 'Istanbul', code: 'IST', country: 'Turquie' },
    { city: 'Las Vegas', code: 'LAS', country: 'États-Unis' },
    { city: 'Guatemala City', code: 'GUA', country: 'Guatemala' },
    { city: 'Toronto', code: 'YYZ', country: 'Canada' },
    { city: 'Ottawa', code: 'YOW', country: 'Canada' },
    { city: 'Vancouver', code: 'YVR', country: 'Canada' },
    { city: 'Calgary', code: 'YYC', country: 'Canada' },
    { city: 'Edmonton', code: 'YEG', country: 'Canada' },
    { city: 'Winnipeg', code: 'YWG', country: 'Canada' },
    { city: 'Halifax', code: 'YHZ', country: 'Canada' },
    { city: 'Québec', code: 'YQB', country: 'Canada' },
];

// All destinations for city name lookup (both lists combined)
const ALL_HOTEL_DESTINATIONS = [...TOUT_INCLUS_DESTINATIONS, ...HOTEL_DESTINATIONS];

// Default: 7-night stay, ~6 weeks from now
function getDefaultDates(): { checkIn: string; checkOut: string } {
    const now = new Date();
    const checkIn = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkIn.getDate() + 7);
    return {
        checkIn: checkIn.toISOString().split('T')[0],
        checkOut: checkOut.toISOString().split('T')[0],
    };
}

/**
 * Scan all-inclusive resorts for a batch of destinations (cron)
 * Returns count of hotels saved
 */
export async function scanToutInclus(
    destinations: typeof TOUT_INCLUS_DESTINATIONS
): Promise<number> {
    const supabase = createAdminSupabase();
    const { checkIn, checkOut } = getDefaultDates();
    let totalSaved = 0;

    for (const dest of destinations) {
        try {
            const hotels = await searchAllInclusive(dest.city, checkIn, checkOut);

            if (hotels.length === 0) {
                console.log(`[Hotels] No all-inclusive found for ${dest.city}`);
                continue;
            }

            // Take top 5 by price (cheapest), 3-star minimum
            const top = hotels
                .filter(h => h.stars >= 3 || h.stars === 0)
                .sort((a, b) => a.pricePerNight - b.pricePerNight)
                .slice(0, 5);

            const records = top.map(h => ({
                destination: dest.city,
                destination_code: dest.code,
                hotel_name: h.name,
                hotel_type: h.hotelType,
                stars: h.stars,
                price_per_night: h.pricePerNight,
                total_price: h.totalPrice,
                nights: h.nights,
                check_in: h.checkIn,
                check_out: h.checkOut,
                currency: h.currency,
                rating: h.rating,
                review_count: h.reviewCount,
                image_url: h.imageUrl,
                booking_url: h.bookingUrl,
                source: 'skyscanner_hotels',
                is_all_inclusive: true,
                raw_data: h.rawData,
                scanned_at: new Date().toISOString(),
            }));

            const { error } = await supabase
                .from('hotel_prices')
                .insert(records);

            if (error) {
                console.error(`[Hotels] Insert error for ${dest.city}:`, error);
            } else {
                totalSaved += records.length;
                console.log(`[Hotels] Saved ${records.length} hotels for ${dest.city}`);
            }

            // 1s rate limit between destinations (Skyscanner has 20k credits)
            if (destinations.indexOf(dest) < destinations.length - 1) {
                await new Promise(r => setTimeout(r, 1000));
            }
        } catch (error) {
            console.error(`[Hotels] Error scanning ${dest.city}:`, error);
        }
    }

    return totalSaved;
}

/**
 * Scan regular hotels for non-all-inclusive destinations (premium feature)
 * Returns count of hotels saved
 */
export async function scanRegularHotels(
    destinations: typeof HOTEL_DESTINATIONS
): Promise<number> {
    const supabase = createAdminSupabase();
    const { checkIn, checkOut } = getDefaultDates();
    let totalSaved = 0;

    for (const dest of destinations) {
        try {
            const hotels = await searchHotels(dest.city, checkIn, checkOut);

            if (hotels.length === 0) {
                console.log(`[Hotels] No hotels found for ${dest.city}`);
                continue;
            }

            // Take top 5 by price (cheapest), 3-star minimum
            const top = hotels
                .filter(h => h.stars >= 3 || h.stars === 0)
                .sort((a, b) => a.pricePerNight - b.pricePerNight)
                .slice(0, 5);

            const records = top.map(h => ({
                destination: dest.city,
                destination_code: dest.code,
                hotel_name: h.name,
                hotel_type: h.hotelType,
                stars: h.stars,
                price_per_night: h.pricePerNight,
                total_price: h.totalPrice,
                nights: h.nights,
                check_in: h.checkIn,
                check_out: h.checkOut,
                currency: h.currency,
                rating: h.rating,
                review_count: h.reviewCount,
                image_url: h.imageUrl,
                booking_url: h.bookingUrl,
                source: 'skyscanner_hotels',
                is_all_inclusive: false,
                raw_data: h.rawData,
                scanned_at: new Date().toISOString(),
            }));

            const { error } = await supabase
                .from('hotel_prices')
                .insert(records);

            if (error) {
                console.error(`[Hotels] Insert error for ${dest.city}:`, error);
            } else {
                totalSaved += records.length;
                console.log(`[Hotels] Saved ${records.length} hotels for ${dest.city}`);
            }

            // 1s rate limit between destinations
            if (destinations.indexOf(dest) < destinations.length - 1) {
                await new Promise(r => setTimeout(r, 1000));
            }
        } catch (error) {
            console.error(`[Hotels] Error scanning ${dest.city}:`, error);
        }
    }

    return totalSaved;
}

// Cache TTL: 7 days (hotel prices change slowly)
const HOTEL_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

/**
 * Get hotel prices — from Supabase cache (48h) or fetch live
 */
export async function getHotelPrices(
    destCode: string,
    checkIn?: string,
    checkOut?: string,
    allInclusive?: boolean
): Promise<HotelResult[]> {
    const supabase = createAdminSupabase();
    const cacheThreshold = new Date(Date.now() - HOTEL_CACHE_TTL).toISOString();

    // Check cache first
    let query = supabase
        .from('hotel_prices')
        .select('*')
        .eq('destination_code', destCode)
        .gte('scanned_at', cacheThreshold)
        .gte('stars', 3)
        .order('price_per_night', { ascending: true })
        .limit(10);

    if (allInclusive) {
        query = query.eq('is_all_inclusive', true);
    }

    const { data: cached, error } = await query;

    if (!error && cached && cached.length > 0) {
        console.log(`[Hotels] Cache hit for ${destCode}: ${cached.length} results`);
        return cached.map(mapDbToHotelResult);
    }

    // Cache miss — fetch live (only if we have dates)
    if (!checkIn || !checkOut) {
        console.log(`[Hotels] No cache and no dates for ${destCode}, returning empty`);
        return [];
    }

    // Find city name from destination code (search both lists)
    const destInfo = ALL_HOTEL_DESTINATIONS.find(d => d.code === destCode);
    const cityName = destInfo?.city || destCode;

    console.log(`[Hotels] Cache miss for ${destCode}, fetching live...`);
    const hotels = allInclusive
        ? await searchAllInclusive(cityName, checkIn, checkOut)
        : await searchHotels(cityName, checkIn, checkOut);

    if (hotels.length > 0) {
        // Save to cache
        const records = hotels.slice(0, 10).map(h => ({
            destination: cityName,
            destination_code: destCode,
            hotel_name: h.name,
            hotel_type: h.hotelType,
            stars: h.stars,
            price_per_night: h.pricePerNight,
            total_price: h.totalPrice,
            nights: h.nights,
            check_in: h.checkIn,
            check_out: h.checkOut,
            currency: h.currency,
            rating: h.rating,
            review_count: h.reviewCount,
            image_url: h.imageUrl,
            booking_url: h.bookingUrl,
            source: 'skyscanner_hotels',
            is_all_inclusive: allInclusive || false,
            raw_data: h.rawData,
            scanned_at: new Date().toISOString(),
        }));

        await supabase.from('hotel_prices').insert(records);
    }

    return hotels.slice(0, 10);
}

/**
 * Build a pack deal combining flight + hotel
 */
export function buildPackDeal(
    flightPrice: number,
    hotel: HotelResult,
    nights: number
): {
    flightPrice: number;
    hotelPricePerNight: number;
    hotelTotal: number;
    totalPrice: number;
    hotelName: string;
    hotelStars: number;
    hotelRating: number;
    hotelImage: string;
    hotelBookingUrl: string;
    isAllInclusive: boolean;
} {
    const hotelTotal = hotel.pricePerNight * nights;
    const totalPrice = flightPrice + hotelTotal;

    return {
        flightPrice,
        hotelPricePerNight: hotel.pricePerNight,
        hotelTotal,
        totalPrice,
        hotelName: hotel.name,
        hotelStars: hotel.stars,
        hotelRating: hotel.rating,
        hotelImage: hotel.imageUrl,
        hotelBookingUrl: hotel.bookingUrl,
        isAllInclusive: hotel.isAllInclusive,
    };
}

/**
 * Get best all-inclusive hotel for a destination (for enriching flight deals)
 */
export async function getBestAllInclusiveForDest(
    destCode: string
): Promise<{
    hotelPrice: number;
    totalPackPrice?: number;
    hotelName: string;
    hotelStars: number;
    hotelRating: number;
    hotelImage: string;
    hotelBookingUrl: string;
} | null> {
    const hotels = await getHotelPrices(destCode, undefined, undefined, true);
    if (hotels.length === 0) return null;

    // Best = cheapest with decent rating
    const best = hotels
        .filter(h => (h.rating >= 3.5 || h.rating === 0) && h.stars >= 3)
        .sort((a, b) => a.pricePerNight - b.pricePerNight)[0];

    if (!best) return null;

    return {
        hotelPrice: best.pricePerNight,
        hotelName: best.name,
        hotelStars: best.stars,
        hotelRating: best.rating,
        hotelImage: best.imageUrl,
        hotelBookingUrl: best.bookingUrl,
    };
}

/**
 * Get best hotel for any destination (regular or all-inclusive)
 */
export async function getBestHotelForDest(
    destCode: string
): Promise<{
    hotelPrice: number;
    hotelTotal: number;
    hotelNights: number;
    hotelName: string;
    hotelStars: number;
    hotelRating: number;
    hotelImage: string;
    hotelBookingUrl: string;
    isAllInclusive: boolean;
} | null> {
    const supabase = createAdminSupabase();
    const cacheThreshold = new Date(Date.now() - HOTEL_CACHE_TTL).toISOString();

    const { data: cached } = await supabase
        .from('hotel_prices')
        .select('*')
        .eq('destination_code', destCode)
        .gte('scanned_at', cacheThreshold)
        .gte('stars', 3)
        .order('price_per_night', { ascending: true })
        .limit(5);

    if (!cached || cached.length === 0) return null;

    // Best = cheapest with decent rating
    const best = cached.find(h => (h.rating >= 3.5 || h.rating === 0)) || cached[0];
    if (!best) return null;

    const nights = best.nights || 7;
    return {
        hotelPrice: best.price_per_night,
        hotelTotal: best.total_price || best.price_per_night * nights,
        hotelNights: nights,
        hotelName: best.hotel_name,
        hotelStars: best.stars,
        hotelRating: best.rating || 0,
        hotelImage: best.image_url || '',
        hotelBookingUrl: best.booking_url || '',
        isAllInclusive: best.is_all_inclusive || false,
    };
}

// Map DB row to HotelResult
function mapDbToHotelResult(row: any): HotelResult {
    return {
        name: row.hotel_name || 'Hôtel',
        stars: row.stars || 0,
        pricePerNight: row.price_per_night,
        totalPrice: row.total_price || row.price_per_night * (row.nights || 7),
        nights: row.nights || 7,
        currency: row.currency || 'CAD',
        rating: row.rating || 0,
        reviewCount: row.review_count || 0,
        imageUrl: row.image_url || '',
        bookingUrl: row.booking_url || '',
        hotelType: row.hotel_type || 'hotel',
        isAllInclusive: row.is_all_inclusive || false,
        checkIn: row.check_in || '',
        checkOut: row.check_out || '',
        amenities: (row.raw_data?.amenities || []) as string[],
        rawData: row.raw_data || {},
    };
}
