import { NextResponse } from 'next/server';
import { getAllCachedImages } from '@/lib/services/images';

// Cache en mémoire (refresh toutes les 30 minutes)
let cache: { data: Record<string, string>; ts: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000;

export async function GET() {
    try {
        if (cache && Date.now() - cache.ts < CACHE_TTL) {
            return NextResponse.json(cache.data, {
                headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
            });
        }

        const images = await getAllCachedImages();
        cache = { data: images, ts: Date.now() };

        return NextResponse.json(images, {
            headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
        });
    } catch (error: any) {
        console.error('[Images API] Error:', error);
        return NextResponse.json({}, { status: 500 });
    }
}
