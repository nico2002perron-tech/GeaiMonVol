import { createServerSupabase } from '@/lib/supabase/server';
import { CITY_IMAGES, COUNTRY_IMAGES, DEFAULT_CITY_IMAGE } from '@/lib/constants/deals';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

interface UnsplashPhoto {
    urls: { regular: string; small: string };
    user: { name: string };
}

/**
 * Cherche une photo de destination sur Unsplash et la cache dans Supabase.
 * Retourne l'URL de l'image ou le fallback hardcodé.
 */
// Country names get a different search query for better results
const COUNTRY_QUERIES: Record<string, string> = {
    'Canada': 'Canada landscape nature scenic',
    'États-Unis': 'United States iconic skyline',
    'Mexique': 'Mexico beach resort tropical',
    'Cuba': 'Cuba Havana vintage colorful',
    'République dominicaine': 'Dominican Republic beach paradise',
    'Bahamas': 'Bahamas turquoise water tropical',
    'Jamaïque': 'Jamaica tropical beach reggae',
    'Costa Rica': 'Costa Rica jungle nature',
    'Guatemala': 'Guatemala Antigua colorful',
    'Barbade': 'Barbados beach crystal water',
    'Belize': 'Belize caribbean blue hole',
    'Colombie': 'Colombia Cartagena colorful',
    'Brésil': 'Brazil Rio aerial view',
    'Pérou': 'Peru Machu Picchu',
    'Argentine': 'Buenos Aires cityscape',
    'France': 'Paris Eiffel Tower',
    'Espagne': 'Spain Barcelona beach',
    'Portugal': 'Lisbon Portugal colorful',
    'Italie': 'Italy Rome Colosseum',
    'Grèce': 'Greece Santorini blue dome',
    'Islande': 'Iceland aurora northern lights',
    'Maroc': 'Morocco Marrakech souk',
    'Japon': 'Japan Tokyo cherry blossom',
    'Thaïlande': 'Thailand tropical temple',
    'Porto Rico': 'Puerto Rico colorful old town',
    'Trinité-et-Tobago': 'Trinidad Tobago beach carnival',
};

async function fetchUnsplashImage(city: string): Promise<{ url: string; photographer: string } | null> {
    if (!UNSPLASH_ACCESS_KEY) return null;

    try {
        const query = COUNTRY_QUERIES[city] || `${city} travel aerial landmark`;
        const res = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape&content_filter=high`,
            {
                headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
            }
        );

        if (!res.ok) {
            console.error(`[Images] Unsplash error for ${city}: ${res.status}`);
            return null;
        }

        const data = await res.json();
        const photos: UnsplashPhoto[] = data.results || [];

        if (photos.length === 0) return null;

        // Pick the best photo (prefer the one with highest resolution)
        const photo = photos[0];

        return {
            url: `${photo.urls.regular}&w=800&h=500&fit=crop&q=80`,
            photographer: photo.user.name,
        };
    } catch (error) {
        console.error(`[Images] Failed to fetch image for ${city}:`, error);
        return null;
    }
}

/**
 * Récupère l'image pour une ville.
 * Ordre: Supabase cache → Unsplash API (+ cache) → hardcodé → default
 */
export async function getCityImage(city: string): Promise<string> {
    const supabase = await createServerSupabase();

    // 1. Check cache Supabase
    const { data: cached } = await supabase
        .from('destination_images')
        .select('image_url')
        .eq('city', city)
        .single();

    if (cached?.image_url) return cached.image_url;

    // 2. Fallback hardcodé
    return CITY_IMAGES[city] || COUNTRY_IMAGES[city] || DEFAULT_CITY_IMAGE;
}

/**
 * Récupère toutes les images cachées d'un coup (pour le frontend).
 */
export async function getAllCachedImages(): Promise<Record<string, string>> {
    const supabase = await createServerSupabase();

    const { data } = await supabase
        .from('destination_images')
        .select('city, image_url');

    const map: Record<string, string> = {};
    if (data) {
        for (const row of data) {
            map[row.city] = row.image_url;
        }
    }
    return map;
}

/**
 * Refresh les images pour une liste de villes.
 * Appelé par le cron pour mettre à jour les images manquantes.
 */
export async function refreshDestinationImages(cities: string[]): Promise<{ updated: number; skipped: number }> {
    if (!UNSPLASH_ACCESS_KEY) {
        console.log('[Images] UNSPLASH_ACCESS_KEY not set, skipping image refresh');
        return { updated: 0, skipped: cities.length };
    }

    const supabase = await createServerSupabase();
    let updated = 0;
    let skipped = 0;

    // Récupérer les villes déjà cachées
    const { data: existing } = await supabase
        .from('destination_images')
        .select('city')
        .in('city', cities);

    const cachedCities = new Set(existing?.map(e => e.city) || []);

    // Ne fetch que les nouvelles villes
    const newCities = cities.filter(c => !cachedCities.has(c));

    for (const city of newCities) {
        const result = await fetchUnsplashImage(city);

        if (result) {
            const { error } = await supabase
                .from('destination_images')
                .upsert({
                    city,
                    image_url: result.url,
                    photographer: result.photographer,
                    source: 'unsplash',
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'city' });

            if (!error) {
                updated++;
                console.log(`[Images] Cached image for ${city} (by ${result.photographer})`);
            }
        } else {
            skipped++;
        }

        // Rate limit: max 50 req/hour, on met 1.5s entre chaque
        await new Promise(r => setTimeout(r, 1500));
    }

    return { updated, skipped };
}
