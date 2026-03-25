import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Lazy-init
let _groq: Groq | null = null;
function getGroq(): Groq {
    if (!_groq) {
        _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
    }
    return _groq;
}

// ── In-memory cache (7-day TTL, persists across Vercel requests) ──
const intelCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

export const maxDuration = 30;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.toUpperCase();
    const city = searchParams.get('city') || '';
    const country = searchParams.get('country') || '';

    if (!code || code.length < 2) {
        return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
    }

    // Check cache
    const cached = intelCache.get(code);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data, {
            headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800', 'X-Cache': 'HIT' },
        });
    }

    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
    }

    try {
        const groq = getGroq();

        const destLabel = city ? `${city}, ${country}` : code;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `Tu es un expert en voyages internationaux ultra-complet. Tu génères des fiches d'intelligence voyage COMPLÈTES et PRÉCISES pour des voyageurs québécois partant de Montréal (YUL).

Réponds UNIQUEMENT en JSON valide (pas de backticks, pas de texte avant/après). Structure EXACTE:

{
  "tagline": "phrase d'accroche de 5-8 mots décrivant la destination",
  "overallScore": 1-100,
  "weather": {
    "bestMonths": ["mois en français"],
    "avoidMonths": ["mois à éviter"],
    "rainyMonths": ["mois pluvieux"],
    "hurricaneRisk": "description ou null si pas applicable",
    "avgTempHigh": { "winter": 25, "summer": 32 },
    "avgTempLow": { "winter": 18, "summer": 24 },
    "waterTemp": { "winter": 24, "summer": 28 },
    "summary": "1-2 phrases résumé météo annuel"
  },
  "beach": {
    "hasBeach": true/false,
    "algaeSeason": "description des sargasses/algues ou null",
    "jellyfishRisk": "description ou null",
    "waterClarity": "cristalline/bonne/variable/trouble",
    "bestBeaches": ["nom des 2-3 meilleures plages"],
    "tip": "conseil plage en 1 phrase"
  },
  "crowds": {
    "peakMonths": ["mois haute saison"],
    "shoulderMonths": ["mois intermédiaires"],
    "lowSeasonMonths": ["mois basse saison"],
    "springBreakWarning": "description ou null (pour destinations soleil)",
    "tip": "conseil foule en 1 phrase"
  },
  "budget": {
    "dailyBudgetLow": 0,
    "dailyBudgetMid": 0,
    "dailyBudgetHigh": 0,
    "currency": "nom devise locale",
    "currencyCode": "USD/EUR/etc",
    "exchangeInfo": "1 CAD ≈ X devise",
    "mealCheap": "8-12$",
    "mealMid": "15-25$",
    "mealFancy": "40-80$",
    "beerPrice": "2-4$",
    "tipping": "description coutume pourboire",
    "costOfLiving": "très bas/bas/moyen/élevé/très élevé vs Montréal"
  },
  "practical": {
    "visa": "description visa pour Canadiens",
    "vaccines": "recommandations ou null",
    "safety": "1-2 phrases niveau sécurité",
    "safetyScore": 1-5,
    "language": "langue(s) parlée(s)",
    "english": "très bien/bien/basique/peu/pas du tout",
    "timezone": "UTC+X (Xh de décalage vs Montréal)",
    "plugType": "type prise + voltage",
    "cellService": "conseil roaming/SIM locale",
    "drinkingWater": "potable/bouteille recommandée/bouteille obligatoire",
    "flightTime": "durée vol direct ou avec escale depuis YUL"
  },
  "culture": {
    "dos": ["3-4 choses à faire (culture/étiquette)"],
    "donts": ["3-4 choses à NE PAS faire"],
    "dressCode": "conseil vestimentaire",
    "bargaining": "description négociation ou null",
    "religion": "religion dominante et impact sur voyage",
    "festivals": ["1-3 festivals/événements majeurs avec dates approximatives"]
  },
  "food": {
    "mustTry": [
      { "name": "nom du plat", "description": "courte description", "price": "X-Y$" }
    ],
    "bestFoodAreas": ["quartiers/zones pour bien manger"],
    "streetFood": "description street food ou null",
    "foodSafety": "conseil hygiène alimentaire",
    "alcohol": "description alcool local/lois"
  },
  "monthlyMatrix": [
    { "month": "Jan", "weather": 1-5, "crowd": 1-5, "price": 1-5, "overall": 1-5 },
    { "month": "Fév", "weather": 1-5, "crowd": 1-5, "price": 1-5, "overall": 1-5 },
    { "month": "Mar", "weather": 1-5, "crowd": 1-5, "price": 1-5, "overall": 1-5 },
    { "month": "Avr", "weather": 1-5, "crowd": 1-5, "price": 1-5, "overall": 1-5 },
    { "month": "Mai", "weather": 1-5, "crowd": 1-5, "price": 1-5, "overall": 1-5 },
    { "month": "Juin", "weather": 1-5, "crowd": 1-5, "price": 1-5, "overall": 1-5 },
    { "month": "Juil", "weather": 1-5, "crowd": 1-5, "price": 1-5, "overall": 1-5 },
    { "month": "Août", "weather": 1-5, "crowd": 1-5, "price": 1-5, "overall": 1-5 },
    { "month": "Sep", "weather": 1-5, "crowd": 1-5, "price": 1-5, "overall": 1-5 },
    { "month": "Oct", "weather": 1-5, "crowd": 1-5, "price": 1-5, "overall": 1-5 },
    { "month": "Nov", "weather": 1-5, "crowd": 1-5, "price": 1-5, "overall": 1-5 },
    { "month": "Déc", "weather": 1-5, "crowd": 1-5, "price": 1-5, "overall": 1-5 }
  ],
  "proTips": ["5-7 conseils de pro ultra-utiles et concrets"],
  "dayTrips": [
    { "name": "nom", "description": "1 phrase", "distance": "Xh en bus/train", "cost": "X-Y$" }
  ],
  "transportation": {
    "fromAirport": "meilleur moyen + coût",
    "localTransport": "description transport local",
    "uber": "disponible/pas disponible + prix moyen",
    "renting": "conseil location voiture ou null"
  }
}

IMPORTANT:
- monthlyMatrix: weather 5=parfait, 1=terrible. crowd 5=très calme, 1=bondé. price 5=très cheap, 1=très cher. overall 5=parfait, 1=terrible.
- Tous les prix en $ CAD
- Sois PRÉCIS et FACTUEL — pas de bullshit générique
- Adapte tout au contexte d'un Québécois (langue, références culturelles, comparaisons avec le Québec)
- Si c'est une destination plage/tropicale, le beach object doit être détaillé
- Si pas de plage, mets hasBeach: false et les champs beach à null
- Les mustTry food: minimum 4-5 plats avec vrais prix
- Les proTips: des VRAIS conseils utiles, pas des généralités`,
                },
                {
                    role: 'user',
                    content: `Génère la fiche d'intelligence voyage COMPLÈTE pour: ${destLabel} (code aéroport: ${code}). Départ depuis Montréal (YUL), voyageur canadien.`,
                },
            ],
            temperature: 0.5,
            max_tokens: 3000,
        });

        const responseText = completion.choices[0]?.message?.content || '';

        // Parse JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('[TravelIntel] No JSON found in response:', responseText.slice(0, 500));
            return NextResponse.json({ error: 'AI response parsing failed' }, { status: 500 });
        }

        let parsed: any;
        try {
            parsed = JSON.parse(jsonMatch[0]);
        } catch {
            // Try fixing common issues: trailing commas, unescaped quotes
            let fixed = jsonMatch[0]
                .replace(/,\s*([\]}])/g, '$1')
                .replace(/\n/g, '\\n');
            try {
                parsed = JSON.parse(fixed);
            } catch {
                console.error('[TravelIntel] JSON parse failed:', jsonMatch[0].slice(0, 500));
                return NextResponse.json({ error: 'AI response parsing failed' }, { status: 500 });
            }
        }

        const result = {
            destination: city || code,
            code,
            country,
            ...parsed,
            generatedAt: new Date().toISOString(),
        };

        // Cache
        intelCache.set(code, { data: result, timestamp: Date.now() });

        return NextResponse.json(result, {
            headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800', 'X-Cache': 'MISS' },
        });
    } catch (error: any) {
        console.error('[TravelIntel] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
