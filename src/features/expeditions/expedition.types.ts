export interface ExpeditionTemplate {
    id: string;
    slug: string;
    title: string;
    destination_code: string;
    total_nights: number;
    difficulty: 'easy' | 'moderate' | 'adventurous';
    tags: string[];
    cover_image: string | null;
    description_fr: string | null;
    created_at: string;
}

export interface ExpeditionStop {
    id: string;
    expedition_id: string;
    stop_order: number;
    city: string;
    country: string;
    nights: number;
    description_fr: string | null;
    highlights: string[];
    accommodation_type: string;
    lat: number | null;
    lng: number | null;
}

export interface ExpeditionAccommodation {
    id: string;
    stop_id: string;
    name: string;
    type: string;
    price_per_night: number | null;
    rating: number | null;
    image_url: string | null;
    booking_url: string | null;
    scanned_at: string;
}

export interface ExpeditionWithStops extends ExpeditionTemplate {
    stops: (ExpeditionStop & { accommodations?: ExpeditionAccommodation[] })[];
}

export interface ExpeditionPricing {
    flightPrice: number | null;
    accommodationTotal: number;
    perStopCost: { city: string; nights: number; pricePerNight: number; total: number }[];
    grandTotal: number | null;
}
