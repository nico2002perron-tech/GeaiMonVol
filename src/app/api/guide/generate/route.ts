import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Connecte-toi pour générer un guide.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const isPremium = profile?.plan === 'premium';

    const { count } = await supabase
      .from('ai_guides')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    const guideCount = count || 0;

    if (!isPremium && guideCount >= 1) {
      return NextResponse.json({
        error: 'limit_reached',
        message: 'Tu as déjà utilisé ton guide gratuit. Passe à Premium pour des guides illimités!',
        guide_count: guideCount,
      }, { status: 403 });
    }

    const body = await req.json();
    const {
      destination, destination_code, country,
      departure_date, return_date, price, airline, stops,
      preferences = [], trip_days, rest_days = 1,
      budget_style = 'moderate',
    } = body;

    if (!destination) {
      return NextResponse.json({ error: 'Destination requise.' }, { status: 400 });
    }

    let nights = trip_days || 7;
    if (departure_date && return_date) {
      nights = Math.round(
        (new Date(return_date).getTime() - new Date(departure_date).getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    const prefsText = preferences.length > 0 ? preferences.join(', ') : 'culture, gastronomie, nature';

    const budgetMap: Record<string, string> = {
      budget: 'économique (hostels, street food, transports en commun)',
      moderate: 'modéré (hôtels 3★, restaurants locaux, mix transports)',
      luxury: 'haut de gamme (hôtels 4-5★, restaurants gastronomiques, taxis/privé)',
    };

    const systemPrompt = `Tu es un expert en voyage ultra-détaillé qui crée des itinéraires jour par jour.
Tu écris en français québécois naturel (utilise "tu", pas "vous").
Tu donnes des VRAIS noms de lieux, restaurants, adresses et estimations de prix en CAD.
Tu connais les tips d'initié que les touristes ne connaissent pas.
Tu inclus les DIRECTIONS précises entre chaque activité (mode de transport, durée, distance).

RÈGLE ABSOLUE : Réponds UNIQUEMENT en JSON valide. Aucun texte avant ou après. Aucun backtick. Juste le JSON brut.`;

    const userPrompt = `Crée un itinéraire ULTRA-DÉTAILLÉ pour :

DESTINATION : ${destination}, ${country || ''}
VOL : Montréal (YUL) → ${destination_code || destination} | ${airline || 'Non spécifié'} | ${stops === 0 ? 'Direct' : stops + ' escale(s)'}
DATES : ${departure_date || 'Flexible'} → ${return_date || 'Flexible'} (${nights} nuits)
PRIX VOL : ${price || 0}$ CAD aller-retour
BUDGET : ${budgetMap[budget_style] || budgetMap.moderate}
PRÉFÉRENCES : ${prefsText}
JOURS DE REPOS : ${rest_days}

Réponds avec cette structure JSON EXACTE. Chaque jour a : morning, lunch, afternoon, dinner, evening + les directions entre chaque.

{
  "title": "Titre accrocheur",
  "summary": "Résumé 2-3 phrases",
  "region_tips": "Conseils généraux transport, sécurité, culture locale",
  "accommodation": {
    "name": "Nom de l'hôtel recommandé",
    "neighborhood": "Quartier",
    "type": "Type (ex: Boutique 3★)",
    "price_per_night": 0,
    "rating": "4.5★",
    "tip": "Conseil sur l'hôtel",
    "address": "Adresse complète"
  },
  "budget_summary": {
    "flight": ${price || 0},
    "accommodation_total": 0,
    "food_total": 0,
    "activities_total": 0,
    "transport_local_total": 0,
    "total_per_person": 0
  },
  "highlights": ["3-5 moments forts"],
  "packing_list": ["4-5 items essentiels"],
  "days": [
    {
      "day": 1,
      "title": "Titre du jour",
      "theme": "emoji + thème",
      "total_cost": 0,
      "morning": {
        "activity": "Nom activité",
        "location": "Adresse/lieu précis",
        "description": "1-2 phrases",
        "duration": "2h",
        "cost": 0,
        "tip": "Astuce",
        "rating": "4.5★"
      },
      "getting_to_lunch": {
        "from": "Lieu de l'activité matin",
        "to": "Nom du resto lunch",
        "mode": "🚶 À pied",
        "duration": "8 min",
        "distance": "650m",
        "directions": "Directions textuelles précises"
      },
      "lunch": {
        "name": "Nom du restaurant",
        "type": "Type de cuisine",
        "location": "Adresse",
        "cost": 0,
        "rating": "4.3★",
        "must_try": "Plat à commander absolument"
      },
      "getting_to_afternoon": {
        "from": "Resto lunch",
        "to": "Activité après-midi",
        "mode": "🚇 Métro",
        "duration": "12 min",
        "distance": "2km",
        "directions": "Ligne X, direction Y"
      },
      "afternoon": {
        "activity": "Nom activité",
        "location": "Adresse/lieu",
        "description": "1-2 phrases",
        "duration": "2.5h",
        "cost": 0,
        "tip": "Astuce",
        "rating": "4.6★"
      },
      "getting_to_dinner": {
        "from": "Activité après-midi",
        "to": "Resto souper",
        "mode": "🚶 À pied",
        "duration": "10 min",
        "distance": "800m",
        "directions": "Directions"
      },
      "dinner": {
        "name": "Nom du restaurant",
        "type": "Type de cuisine",
        "location": "Adresse",
        "cost": 0,
        "rating": "4.5★",
        "must_try": "Plat signature"
      },
      "evening": {
        "activity": "Activité soirée",
        "location": "Lieu",
        "description": "1-2 phrases",
        "duration": "1.5h",
        "cost": 0,
        "tip": "Astuce"
      },
      "getting_back_hotel": {
        "from": "Lieu soirée",
        "to": "Hôtel",
        "mode": "🚇 Métro ou 🚕 Taxi",
        "duration": "15 min",
        "directions": "Comment rentrer"
      }
    }
  ]
}

IMPORTANT :
- Génère exactement ${nights} jours
- ${rest_days} jour(s) de repos avec activités zen (spa, plage, flâner)
- Utilise des VRAIS noms de restaurants et lieux qui existent
- Les costs sont en CAD
- Chaque "getting_to_*" doit avoir des directions réalistes
- Le total_cost de chaque jour = somme des costs du jour`;

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Clé API non configurée.' }, { status: 500 });
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: '{' },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      console.error('Anthropic API error:', errText);
      return NextResponse.json({ error: 'Erreur lors de la génération du guide.' }, { status: 500 });
    }

    const anthropicData = await anthropicResponse.json();
    const rawText = anthropicData.content?.[0]?.text || '';

    let guide;
    try {
      let jsonStr = '{' + rawText;
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }
      guide = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr, 'Raw (first 1500):', ('{' + rawText).substring(0, 1500));
      return NextResponse.json({ error: 'Erreur de format. Réessaie!' }, { status: 500 });
    }

    const { data: savedGuide, error: saveError } = await supabase
      .from('ai_guides')
      .insert({
        user_id: user.id,
        destination,
        destination_code: destination_code || null,
        country: country || null,
        departure_date: departure_date || null,
        return_date: return_date || null,
        flight_price: price || null,
        preferences,
        budget_style,
        guide_data: guide,
        model_used: 'claude-haiku-4-5-20251001',
        tokens_used: (anthropicData.usage?.input_tokens || 0) + (anthropicData.usage?.output_tokens || 0),
      })
      .select('id')
      .single();

    if (saveError) console.error('Save error:', saveError);

    return NextResponse.json({
      guide,
      guide_id: savedGuide?.id || null,
      guide_count: guideCount + 1,
      is_premium: isPremium,
      tokens_used: (anthropicData.usage?.input_tokens || 0) + (anthropicData.usage?.output_tokens || 0),
    });

  } catch (err: any) {
    console.error('Guide generation error:', err);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}
