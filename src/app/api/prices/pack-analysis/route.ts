import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createAdminSupabase } from '@/lib/supabase/admin';

// Lazy-init to avoid build-time crash when GROQ_API_KEY is not yet set
let _groq: Groq | null = null;
function getGroq(): Groq {
    if (!_groq) {
        _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
    }
    return _groq;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            destination,
            destination_code,
            flight_price,
            hotel_name,
            hotel_stars,
            hotel_rating,
            hotel_review_count,
            hotel_price_per_night,
            hotel_amenities,
            nights,
            departure_date,
            return_date,
            airline,
            stops,
        } = body;

        const currentPackPrice = Math.round(flight_price + hotel_price_per_night * nights);

        // 1. Fetch 90-day flight price history
        const supabase = createAdminSupabase();
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

        const { data: historyData } = await supabase
            .from('price_history')
            .select('price, scanned_at')
            .eq('destination', destination)
            .gte('scanned_at', ninetyDaysAgo)
            .neq('source', 'historical_seed')
            .not('source', 'like', 'google_flights%')
            .order('scanned_at', { ascending: false });

        const prices = (historyData || []).map((r: any) => r.price).filter((p: number) => p > 0);
        const avgFlightPrice90d = prices.length > 0
            ? Math.round(prices.reduce((s: number, p: number) => s + p, 0) / prices.length)
            : 0;
        const minFlightPrice90d = prices.length > 0 ? Math.min(...prices) : 0;

        // Calculate median
        const sorted = [...prices].sort((a: number, b: number) => a - b);
        const medianFlightPrice90d = sorted.length > 0
            ? sorted.length % 2 === 0
                ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
                : sorted[Math.floor(sorted.length / 2)]
            : 0;

        const priceChange = medianFlightPrice90d > 0
            ? Math.round(((flight_price - medianFlightPrice90d) / medianFlightPrice90d) * 100)
            : 0;

        // 2. Calculate savings
        const vsMedian = medianFlightPrice90d > flight_price
            ? Math.round(medianFlightPrice90d - flight_price)
            : 0;
        // Estimate: booking separately typically costs 15-25% more (no bulk/deal pricing)
        const estimatedSeparatePrice = Math.round(
            medianFlightPrice90d * 1.15 + hotel_price_per_night * nights * 1.1
        );
        const vsBookingSeparately = estimatedSeparatePrice > currentPackPrice
            ? estimatedSeparatePrice - currentPackPrice
            : 0;
        const totalSavingsPercent = estimatedSeparatePrice > 0
            ? Math.round(((estimatedSeparatePrice - currentPackPrice) / estimatedSeparatePrice) * 100)
            : 0;

        // 3. Hotel score description
        const scoreDescription = hotel_rating >= 4.5
            ? 'Exceptionnel'
            : hotel_rating >= 4.0
                ? 'Excellent'
                : hotel_rating >= 3.5
                    ? 'Très bien'
                    : hotel_rating >= 3.0
                        ? 'Bien'
                        : 'Correct';

        // 4. AI Analysis via Groq
        let aiAnalysis = {
            verdict: 'bon-deal' as const,
            confidence: 70,
            summary: 'Ce pack semble être un bon deal. Bonne destination pour le prix!',
            pros: ['Destination populaire', 'Prix compétitif', 'Hôtel bien noté'],
            cons: ['Vérifier les dates de haute saison'],
            bestTimeAdvice: 'Les prix sont généralement stables pour cette destination.',
        };

        let aiReview = `${hotel_name} est un hôtel ${hotel_stars} étoiles ${hotel_rating >= 4 ? 'bien noté' : 'correct'} pour un séjour tout-inclus.`;

        if (process.env.GROQ_API_KEY) {
            try {
                const groq = getGroq();

                const flightContext = `Vol A/R Montréal-${destination} avec ${airline}, ${stops === 0 ? 'direct' : stops + ' escale(s)'}, ${flight_price}$ CAD`;
                const hotelContext = `Hôtel: ${hotel_name}, ${hotel_stars} étoiles, note ${hotel_rating}/5 (${hotel_review_count} avis), ${hotel_price_per_night}$/nuit tout-inclus, aménités: ${(hotel_amenities || []).slice(0, 8).join(', ')}`;
                const priceContext = `Prix pack total: ${currentPackPrice}$ (${nights} nuits). Historique vol 90 jours: médiane ${medianFlightPrice90d}$, minimum ${minFlightPrice90d}$, moyenne ${avgFlightPrice90d}$ (${prices.length} données). Le vol actuel est ${priceChange > 0 ? priceChange + '% au-dessus' : Math.abs(priceChange) + '% en-dessous'} de la médiane.`;

                const completion = await groq.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'system',
                            content: `Tu es GeAI, un expert en voyages tout-inclus au Québec. Tu analyses des deals vol+hôtel pour des voyageurs montréalais. Réponds en JSON EXACT avec cette structure:
{
  "verdict": "achete" | "attends" | "bon-deal",
  "confidence": 0-100,
  "summary": "2-3 phrases en français québécois décontracté analysant le deal",
  "pros": ["3 points positifs courts"],
  "cons": ["1-2 points négatifs/attention courts"],
  "bestTimeAdvice": "1 phrase conseil sur le meilleur moment pour réserver",
  "hotelReview": "2-3 phrases résumant ce que les voyageurs disent de cet hôtel, en québécois"
}
Sois honnête, concret et utile. Utilise des expressions québécoises naturelles (pas forcé).`,
                        },
                        {
                            role: 'user',
                            content: `Analyse ce pack tout-inclus:\n\n${flightContext}\n${hotelContext}\n${priceContext}\n\nDate départ: ${departure_date}, retour: ${return_date}`,
                        },
                    ],
                    temperature: 0.6,
                    max_tokens: 600,
                });

                const responseText = completion.choices[0]?.message?.content || '';

                // Parse JSON from response (handle markdown code blocks)
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (parsed.verdict) aiAnalysis.verdict = parsed.verdict;
                    if (parsed.confidence) aiAnalysis.confidence = parsed.confidence;
                    if (parsed.summary) aiAnalysis.summary = parsed.summary;
                    if (parsed.pros) aiAnalysis.pros = parsed.pros;
                    if (parsed.cons) aiAnalysis.cons = parsed.cons;
                    if (parsed.bestTimeAdvice) aiAnalysis.bestTimeAdvice = parsed.bestTimeAdvice;
                    if (parsed.hotelReview) aiReview = parsed.hotelReview;
                }
            } catch (aiError) {
                console.error('[Pack Analysis] AI error:', aiError);
                // Keep defaults
            }
        }

        return NextResponse.json({
            history: {
                currentPackPrice,
                avgFlightPrice90d,
                minFlightPrice90d,
                medianFlightPrice90d,
                priceChange,
                dataPoints: prices.length,
            },
            savings: {
                vsMedian,
                vsBookingSeparately,
                totalSavingsPercent,
            },
            aiAnalysis,
            hotelHighlights: {
                scoreDescription,
                topAmenities: (hotel_amenities || []).slice(0, 5),
                aiReview,
            },
        });
    } catch (error: any) {
        console.error('[Pack Analysis] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
