import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Lazy-init to avoid build-time crash when GROQ_API_KEY is not yet set
let _groq: Groq | null = null;
function getGroq(): Groq {
    if (!_groq) {
        _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
    }
    return _groq;
}

// Simple in-memory cache to avoid redundant API calls
const summaryCache: Record<string, { text: string; timestamp: number }> = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: Request) {
    try {
        const { hotels, destination } = await request.json();

        if (!hotels || !Array.isArray(hotels) || hotels.length === 0) {
            return NextResponse.json({ error: 'No hotels provided' }, { status: 400 });
        }

        const summaries: Record<string, string> = {};

        // Check cache first, collect uncached
        const uncached: Array<{ name: string; stars: number; rating: number; reviewCount: number; pricePerNight: number; isAllInclusive: boolean; amenities?: string[] }> = [];

        for (const hotel of hotels.slice(0, 10)) {
            const cacheKey = `${hotel.name}_${destination}`;
            const cached = summaryCache[cacheKey];
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                summaries[hotel.name] = cached.text;
            } else {
                uncached.push(hotel);
            }
        }

        if (uncached.length > 0) {
            // Batch all hotels in one prompt for efficiency
            const hotelDescriptions = uncached.map((h, i) =>
                `${i + 1}. ${h.name} - ${h.stars} etoiles, note ${h.rating}/5 (${h.reviewCount} avis), ${Math.round(h.pricePerNight)}$/nuit${h.isAllInclusive ? ', tout-inclus' : ''}${h.amenities?.length ? `, amenites: ${h.amenities.slice(0, 5).join(', ')}` : ''}`
            ).join('\n');

            const completion = await getGroq().chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `Tu es un expert en voyages. Pour chaque hotel, ecris UN SEUL commentaire concis (max 15 mots) en francais quebecois decontracte. Sois honnete mais positif. Utilise le format exact: "1. commentaire\n2. commentaire" etc. Ne repete pas le nom de l'hotel.`,
                    },
                    {
                        role: 'user',
                        content: `Destination: ${destination}\n\nHotels:\n${hotelDescriptions}`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 500,
            });

            const responseText = completion.choices[0]?.message?.content || '';

            // Parse numbered responses
            const lines = responseText.split('\n').filter(l => l.trim());
            for (let i = 0; i < uncached.length; i++) {
                const line = lines[i] || '';
                // Remove leading number and dot
                const summary = line.replace(/^\d+\.\s*/, '').trim() || 'Bel hotel pour un sejour relax!';
                summaries[uncached[i].name] = summary;

                // Cache it
                const cacheKey = `${uncached[i].name}_${destination}`;
                summaryCache[cacheKey] = { text: summary, timestamp: Date.now() };
            }
        }

        return NextResponse.json({ summaries });
    } catch (error: unknown) {
        console.error('[Hotel AI Summary] Error:', error);
        // Return generic summaries on error
        return NextResponse.json({ summaries: {} });
    }
}
