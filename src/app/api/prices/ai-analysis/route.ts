import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { MAX_PRICE } from '@/lib/constants/deals';
import Groq from 'groq-sdk';

let _groq: Groq | null = null;
function getGroq(): Groq {
    if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
    return _groq;
}

// Cache 2h en mémoire
const analysisCache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 2 * 60 * 60 * 1000;

export const maxDuration = 30;

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')?.toUpperCase();
    const city = req.nextUrl.searchParams.get('city') || '';
    const currentPrice = parseFloat(req.nextUrl.searchParams.get('price') || '0');

    if (!code || currentPrice <= 0) {
        return NextResponse.json({ error: 'Missing code and price' }, { status: 400 });
    }

    // Cache check
    const cacheKey = `${code}-${Math.round(currentPrice)}`;
    const cached = analysisCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return NextResponse.json(cached.data, {
            headers: { 'Cache-Control': 'public, s-maxage=3600', 'X-Cache': 'HIT' },
        });
    }

    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
    }

    try {
        const supabase = await createServerSupabase();
        const today = new Date().toISOString().split('T')[0];
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

        // ── 1. Récupérer les snapshots daily_best_prices (moyennes accumulées) ──
        const { data: dailyBest } = await supabase
            .from('daily_best_prices')
            .select('scan_date, departure_month, best_price, airline, stops')
            .eq('destination_code', code)
            .gte('scan_date', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .order('scan_date', { ascending: true });

        // ── 2. Récupérer l'historique price_history (90 jours) ──
        const { data: priceHist } = await supabase
            .from('price_history')
            .select('price, scanned_at, departure_date, airline, stops')
            .eq('destination_code', code)
            .gte('scanned_at', ninetyDaysAgo)
            .lte('price', MAX_PRICE)
            .neq('source', 'historical_seed')
            .not('source', 'like', 'google_flights%')
            .not('source', 'eq', 'skyscanner_explore')
            .order('scanned_at', { ascending: true })
            .limit(500);

        // ── 3. Récupérer les données mensuelles (1 an) ──
        const since1y = new Date();
        since1y.setFullYear(since1y.getFullYear() - 1);
        const { data: monthlyRaw } = await supabase
            .from('price_history')
            .select('price, departure_date')
            .eq('destination_code', code)
            .gte('scanned_at', since1y.toISOString())
            .not('departure_date', 'is', null)
            .lte('price', MAX_PRICE)
            .limit(1000);

        // ── 4. Récupérer destination_meta ──
        const { data: meta } = await supabase
            .from('destination_meta')
            .select('*')
            .eq('destination_code', code)
            .single();

        // ── Préparer les données pour l'IA ──

        // Historique quotidien : prix le plus bas par jour de scan
        const dailyPrices: Record<string, number> = {};
        for (const row of priceHist || []) {
            const day = row.scanned_at.slice(0, 10);
            const price = Number(row.price);
            if (!dailyPrices[day] || price < dailyPrices[day]) dailyPrices[day] = price;
        }
        const dailyTimeline = Object.entries(dailyPrices)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, price]) => ({ date, price }));

        // Moyennes mensuelles accumulées
        const monthlyAccum: Record<string, number[]> = {};
        for (const row of dailyBest || []) {
            if (!monthlyAccum[row.departure_month]) monthlyAccum[row.departure_month] = [];
            monthlyAccum[row.departure_month].push(Number(row.best_price));
        }
        const monthlyAverages = Object.entries(monthlyAccum)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, prices]) => ({
                month,
                avgPrice: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
                minSeen: Math.round(Math.min(...prices)),
                maxSeen: Math.round(Math.max(...prices)),
                snapshots: prices.length,
            }));

        // Médianes par mois de départ (historique 1 an)
        const monthMap: Record<number, number[]> = {};
        for (const row of monthlyRaw || []) {
            if (!row.departure_date) continue;
            const m = new Date(row.departure_date + 'T00:00:00').getMonth();
            if (!monthMap[m]) monthMap[m] = [];
            monthMap[m].push(Number(row.price));
        }
        const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        const historicalMonths = Array.from({ length: 12 }, (_, i) => {
            const prices = monthMap[i] || [];
            if (prices.length === 0) return null;
            const sorted = [...prices].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return {
                mois: MOIS[i],
                median: Math.round(sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]),
                min: Math.round(sorted[0]),
                max: Math.round(sorted[sorted.length - 1]),
                observations: prices.length,
            };
        }).filter(Boolean);

        // Airlines fréquentes
        const airlineCounts: Record<string, number> = {};
        for (const row of priceHist || []) {
            if (row.airline) airlineCounts[row.airline] = (airlineCounts[row.airline] || 0) + 1;
        }
        const topAirlines = Object.entries(airlineCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, frequency: count }));

        // Stats globales
        const allPrices = dailyTimeline.map(d => d.price);
        const avgPrice = allPrices.length > 0 ? Math.round(allPrices.reduce((s, p) => s + p, 0) / allPrices.length) : 0;
        const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
        const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;

        // Tendance récente (derniers 14 jours vs 14 jours avant)
        const recent14 = dailyTimeline.slice(-14).map(d => d.price);
        const prev14 = dailyTimeline.slice(-28, -14).map(d => d.price);
        const recentAvg = recent14.length > 0 ? Math.round(recent14.reduce((s, p) => s + p, 0) / recent14.length) : 0;
        const prevAvg = prev14.length > 0 ? Math.round(prev14.reduce((s, p) => s + p, 0) / prev14.length) : 0;
        const trendPct = prevAvg > 0 ? Math.round(((recentAvg - prevAvg) / prevAvg) * 100) : 0;

        // ── 5. Appel Groq — Agent de voyage pro ──
        const dataContext = JSON.stringify({
            destination: `${city} (${code})`,
            prix_actuel: currentPrice,
            date_analyse: today,
            historique_90j: {
                prix_moyen: avgPrice,
                prix_min: minPrice,
                prix_max: maxPrice,
                nb_observations: allPrices.length,
                tendance_14j: `${trendPct > 0 ? '+' : ''}${trendPct}%`,
                prix_recent_avg: recentAvg,
                prix_precedent_avg: prevAvg,
            },
            timeline_quotidienne: dailyTimeline.slice(-30),
            moyennes_mensuelles_accumulees: monthlyAverages,
            historique_par_mois_depart: historicalMonths,
            airlines_frequentes: topAirlines,
            meta_destination: meta ? {
                avg_7j: meta.avg_price_7d,
                avg_30j: meta.avg_price_30d,
                avg_90j: meta.avg_price_90d,
                plus_bas_jamais: meta.lowest_price_ever,
                date_plus_bas: meta.lowest_price_date,
                airline_cheapest: meta.cheapest_airline,
            } : null,
        }, null, 0);

        const groq = getGroq();
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `Tu es un AGENT DE VOYAGE PROFESSIONNEL spécialisé en analyse de prix de vols. Tu travailles pour GeaiMonVol, une plateforme québécoise de deals de vols depuis Montréal.

Ton rôle: analyser les données RÉELLES de scans de prix qu'on te fournit et donner un CONSEIL D'ACHAT précis et actionnable. Tu ne fais PAS de prédictions spéculatives — tu analyses les tendances réelles des données.

Tu reçois:
- Le prix actuel du vol
- L'historique des 90 derniers jours (prix quotidiens)
- Les moyennes mensuelles accumulées par les scans
- L'historique par mois de départ (saisonnalité)
- Les airlines les plus fréquentes
- Les métadonnées de destination (moyennes 7j/30j/90j, plus bas historique)

Réponds UNIQUEMENT en JSON valide. Structure EXACTE:

{
  "verdict": "ACHETER" | "SURVEILLER" | "ATTENDRE" | "URGENT",
  "verdictEmoji": "emoji approprié",
  "confiance": 1-100,
  "resume": "2-3 phrases résumé exécutif comme un agent de voyage parlerait à son client",
  "analyse_prix": {
    "position": "bas" | "normal" | "eleve",
    "vs_moyenne": "X$ sous/au-dessus de la moyenne de Y$",
    "vs_plus_bas": "X$ de plus que le plus bas observé de Y$",
    "percentile": "Ce prix est dans le top X% des meilleurs prix observés"
  },
  "tendance": {
    "direction": "baisse" | "stable" | "hausse",
    "description": "phrase décrivant la tendance récente avec chiffres réels",
    "momentum": "phrase sur l'accélération/décélération"
  },
  "saisonnalite": {
    "mois_actuel": "description du mois actuel vs historique",
    "meilleur_mois": "Mois le moins cher avec prix médian",
    "pire_mois": "Mois le plus cher avec prix médian",
    "conseil": "phrase conseil saisonnier"
  },
  "recommandation": {
    "action": "phrase d'action claire et directe",
    "raison_principale": "la raison #1 de cette recommandation",
    "economie_potentielle": "combien l'utilisateur pourrait économiser (ou perdre en attendant)",
    "fenetre_optimale": "quand acheter idéalement"
  },
  "risques": [
    {
      "type": "hausse" | "baisse" | "volatilite" | "disponibilite",
      "description": "phrase décrivant le risque",
      "probabilite": "faible" | "moyenne" | "elevee"
    }
  ],
  "points_cles": [
    {
      "icon": "emoji",
      "titre": "titre court 3-5 mots",
      "detail": "explication en 1-2 phrases avec chiffres réels",
      "impact": "positif" | "negatif" | "neutre"
    }
  ],
  "conseil_agent": "Un paragraphe de 3-4 phrases comme si tu parlais à ton client en face à face. Ton de conversation professionnel mais chaleureux. Utilise les données concrètes. Sois direct sur ce qu'il devrait faire.",
  "note_donnees": "Basé sur X observations sur Y jours"
}

RÈGLES ABSOLUES:
- Tu analyses UNIQUEMENT les données fournies, JAMAIS de suppositions
- Tous les montants en $ CAD
- Ton québécois naturel (pas parisien)
- Sois PRÉCIS: cite des chiffres, des dates, des pourcentages tirés des données
- Si les données sont limitées (< 10 obs.), dis-le clairement et ajuste ta confiance
- Les "points_cles" doivent être exactement 4-5 points
- Les "risques" doivent être exactement 2-3 risques
- Le "conseil_agent" doit sonner comme un vrai agent de voyage qui parle à son client
- "URGENT" = le prix est exceptionnellement bas, risque de remonter vite
- "ACHETER" = bon moment, conditions favorables
- "SURVEILLER" = correct mais pourrait être mieux
- "ATTENDRE" = prix élevé ou tendance à la baisse en cours`,
                },
                {
                    role: 'user',
                    content: `Analyse ces données de prix et donne-moi ton conseil d'achat professionnel:\n\n${dataContext}`,
                },
            ],
            temperature: 0.4,
            max_tokens: 2000,
        });

        const responseText = completion.choices[0]?.message?.content || '';

        // Parse JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('[AIAnalysis] No JSON in response:', responseText.slice(0, 500));
            return NextResponse.json({ error: 'AI parsing failed' }, { status: 500 });
        }

        let parsed: any;
        try {
            parsed = JSON.parse(jsonMatch[0]);
        } catch {
            const fixed = jsonMatch[0].replace(/,\s*([\]}])/g, '$1').replace(/\n/g, '\\n');
            try {
                parsed = JSON.parse(fixed);
            } catch {
                console.error('[AIAnalysis] JSON parse failed');
                return NextResponse.json({ error: 'AI parsing failed' }, { status: 500 });
            }
        }

        const result = {
            ...parsed,
            _meta: {
                destination: city,
                code,
                currentPrice,
                dataPoints: allPrices.length,
                generatedAt: new Date().toISOString(),
            },
        };

        // Cache
        analysisCache.set(cacheKey, { data: result, ts: Date.now() });

        return NextResponse.json(result, {
            headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
        });
    } catch (error: any) {
        console.error('[AIAnalysis] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
