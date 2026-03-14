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
async function fetchUnsplashImage(city: string): Promise<{ url: string; photographer: string } | null> {
    if (!UNSPLASH_ACCESS_KEY) return null;

    try {
        const query = `${city} city travel landmark`;
        const res = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&content_filter=high`,
            {
                headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
            }
        );

        if (!res.ok) {
            console.error(`[Images] Unsplash error for ${city}: ${res.status}`);
            return null;
        }

        const data = await res.json();
        const photo: UnsplashPhoto | undefined = data.results?.[0];

        if (!photo) return null;

        return {
            url: `${photo.urls.regular}&w=600&h=400&fit=crop`,
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
