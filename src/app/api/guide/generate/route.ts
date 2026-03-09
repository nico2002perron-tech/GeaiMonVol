import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

// ── Helper: build cache key from params ──
function buildCacheKey(region: string, budget: string, days: number, prefs: string[]): string {
  const sortedPrefs = [...prefs].sort().join(',');
  return `${region}|${budget}|${days}|${sortedPrefs}`.toLowerCase();
}

// ── Helper: fix truncated JSON ──
function repairJSON(raw: string): any {
  let jsonStr = '{' + raw;
  jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  // Try direct parse first
  try {
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(jsonStr.substring(firstBrace, lastBrace + 1));
    }
    return JSON.parse(jsonStr);
  } catch {
    // Attempt to fix truncated JSON
    try {
      // Remove trailing comma
      jsonStr = jsonStr.replace(/,\s*$/, '');
      // Count open vs close braces/brackets
      let braces = 0, brackets = 0;
      for (const c of jsonStr) {
        if (c === '{') braces++;
        if (c === '}') braces--;
        if (c === '[') brackets++;
        if (c === ']') brackets--;
      }
      while (brackets > 0) { jsonStr += ']'; brackets--; }
      while (braces > 0) { jsonStr += '}'; braces--; }
      console.warn('Repaired truncated JSON');
      return JSON.parse(jsonStr);
    } catch (fixErr) {
      throw new Error('Unfixable JSON: ' + jsonStr.substring(0, 500));
    }
  }
}

// ── Quebec regions list (for cache check) ──
const QC_REGIONS = [
  'charlevoix', 'gaspésie', 'gaspesie', 'saguenay', 'lac-saint-jean',
  'ville de québec', 'ville de quebec', 'québec city', 'quebec city',
  'montréal', 'montreal', 'laurentides', 'cantons-de-l\'est', 'cantons de l\'est',
  'îles-de-la-madeleine', 'iles-de-la-madeleine', 'bas-saint-laurent',
  'côte-nord', 'cote-nord', 'mauricie', 'outaouais', 'lanaudière',
  'lanaudiere', 'abitibi', 'témiscamingue', 'temiscamingue',
];

function isQuebecDestination(destination: string): boolean {
  const lower = destination.toLowerCase();
  return QC_REGIONS.some(r => lower.includes(r)) ||
    lower.includes('québec') || lower.includes('quebec');
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // ── Auth ──
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Connecte-toi pour générer un guide.' }, { status: 401 });
    }

    // ── Plan check ──
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const { count } = await supabase
      .from('ai_guides')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    const guideCount = count || 0;

    // ── Parse body ──
    const body = await req.json();
    const {
      destination, destination_code, country,
      departure_date, return_date, price, airline, stops,
      preferences = [], trip_days, rest_days = 1,
      budget_style = 'moderate', quiz_context,
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

    const isQC = isQuebecDestination(destination);

    // ══════════════════════════════════════
    // QUÉBEC: Check cache first
    // ══════════════════════════════════════
    if (isQC) {
      const cacheKey = buildCacheKey(destination, budget_style, nights, preferences);

      const { data: cached } = await supabase
        .from('qc_guide_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cached) {
        // Increment hit count
        await supabase
          .from('qc_guide_cache')
          .update({ hit_count: (cached.hit_count || 0) + 1 })
          .eq('id', cached.id);

        // Save to user's guides
        const { data: savedGuide } = await supabase
          .from('ai_guides')
          .insert({
            user_id: user.id,
            destination,
            destination_code: destination_code || null,
            country: country || 'Canada (Québec)',
            departure_date: departure_date || null,
            return_date: return_date || null,
            flight_price: price || null,
            preferences,
            budget_style,
            guide_data: cached.guide_data,
            model_used: 'cache',
            tokens_used: 0,
          })
          .select('id')
          .single();

        console.log(`Cache HIT for ${destination} (key: ${cacheKey})`);

        return NextResponse.json({
          guide: cached.guide_data,
          guide_id: savedGuide?.id || null,
          guide_count: guideCount + 1,
          is_premium: true,
          tokens_used: 0,
          cached: true,
        });
      }
    }

    // ══════════════════════════════════════
    // QUÉBEC: Fetch local data for prompt
    // ══════════════════════════════════════
    let localDataPrompt = '';

    if (isQC) {
      const regionName = destination;

      // Fetch restaurants
      const { data: restos } = await supabase
        .from('qc_restaurants')
        .select('name, cuisine_type, price_range, avg_cost_per_person, rating, address, specialty, must_try, tags')
        .ilike('region', `%${regionName}%`)
        .limit(15);

      // Fetch activities
      const { data: activities } = await supabase
        .from('qc_activities')
        .select('name, activity_type, cost_per_person, duration, difficulty, description, tip, tags, indoor, rainy_day_alternative')
        .ilike('region', `%${regionName}%`)
        .limit(20);

      // Fetch accommodations
      const { data: accs } = await supabase
        .from('qc_accommodations')
        .select('name, accommodation_type, price_per_night, budget_level, rating, tip, tags')
        .ilike('region', `%${regionName}%`)
        .eq('budget_level', budget_style === 'budget' ? 'econome' : budget_style === 'luxury' ? 'luxe' : budget_style === 'moderate' ? 'confortable' : budget_style)
        .limit(5);

      // Fetch top user reviews
      const { data: reviews } = await supabase
        .from('qc_user_reviews')
        .select('place_name, rating, comment, would_recommend')
        .ilike('region', `%${regionName}%`)
        .gte('rating', 4)
        .order('rating', { ascending: false })
        .limit(10);

      if (restos?.length || activities?.length || accs?.length) {
        localDataPrompt = `\n\n══ DONNÉES VÉRIFIÉES POUR ${regionName.toUpperCase()} ══
UTILISE PRIORITAIREMENT ces lieux réels dans ton itinéraire. Tu peux en ajouter d'autres si nécessaire.

RESTAURANTS VÉRIFIÉS:
${restos?.map(r => `- ${r.name} (${r.cuisine_type}, ${r.price_range}, ${r.avg_cost_per_person}$/pers, ${r.rating}★) ${r.address ? '@ ' + r.address : ''} — Must try: ${r.must_try || 'N/A'}`).join('\n') || 'Aucun en base'}

ACTIVITÉS VÉRIFIÉES:
${activities?.map(a => `- ${a.name} (${a.activity_type}, ${a.cost_per_person}$, ${a.duration}, ${a.difficulty}) ${a.indoor ? '[INDOOR]' : '[OUTDOOR]'} ${a.rainy_day_alternative ? '[PLUIE OK]' : ''} — ${a.description}`).join('\n') || 'Aucune en base'}

HÉBERGEMENTS RECOMMANDÉS:
${accs?.map(a => `- ${a.name} (${a.accommodation_type}, ${a.price_per_night}$/nuit, ${a.rating}★) — ${a.tip || ''}`).join('\n') || 'Aucun en base'}

${reviews?.length ? `AVIS VOYAGEURS (places les mieux notées):
${reviews.map(r => `- ${r.place_name}: ${r.rating}★ ${r.would_recommend ? '✓ Recommandé' : ''} ${r.comment ? '"' + r.comment.substring(0, 80) + '"' : ''}`).join('\n')}` : ''}`;
      }
    }

    // ══════════════════════════════════════
    // Build prompt & call Claude
    // ══════════════════════════════════════

    const prefsText = preferences.length > 0 ? preferences.join(', ') : 'culture, gastronomie, nature';

    const budgetMap: Record<string, string> = {
      budget: 'économique (hostels, street food, transports en commun)',
      moderate: 'modéré (hôtels 3★, restaurants locaux, mix transports)',
      luxury: 'haut de gamme (hôtels 4-5★, restaurants gastronomiques, taxis/privé)',
    };

    // Quiz context string — enhanced with deep personalization
    let quizContextStr = '';
    if (quiz_context) {
      const groupMap: Record<string, string> = {
        solo: 'Voyageur solo — proposer des rencontres, cafés conviviaux, hostel social',
        couple: 'En couple — romantique, terrasses intimes, couchers de soleil, spa, expériences à deux',
        family: 'En famille — activités pour tous les âges, pauses fréquentes, restos kids-friendly, pas trop de marche',
        friends: 'Entre amis — fun, bars, activités de groupe, compétitions amicales, nightlife',
      };
      const vibeMap: Record<string, string> = {
        romantic: 'Vibe romantique — couchers de soleil, spa, restaurants intimes, belvédères',
        explorer: 'Vibe explorateur — maximum de découvertes, curiosités locales, marcher partout',
        party: 'Vibe party — bars, clubs, festivals, microbrasseries, ambiance festive',
        chill: 'Vibe chill — pas de rush, grasses matinées, terrasses, relaxation',
        cultural: 'Vibe culturel — musées, patrimoine, histoire, galeries, artisans',
      };
      const energyMap: Record<string, string> = {
        intense: 'Énergie INTENSE — lever tôt, remplir chaque créneau, coucher tard. AUCUN temps mort.',
        mixed: 'Énergie équilibrée — activités le jour, soirées relax. 1-2 grosses activités par jour max.',
        relax: 'Énergie tranquille — journées courtes, pas de rush, siestes possibles, max 1 activité structurée/jour.',
      };
      const accoMap: Record<string, string> = {
        camping: 'Hébergement: camping/prêt-à-camper — proposer des campings SEPAQ ou privés',
        chalet: 'Hébergement: chalet/Airbnb — location avec cuisine, indépendance',
        hotel: 'Hébergement: hôtel/auberge — classique, confortable',
        luxury: 'Hébergement: boutique/luxe — hôtels 4-5★, expérience premium',
        unique: 'Hébergement: INSOLITE — yourte, cabane dans les arbres, igloo, phare, hébergement original',
      };
      const transportMap: Record<string, string> = {
        car: 'Transport: voiture personnelle — planifier les routes, parkings, distances',
        rental: 'Transport: location/VR — road trip, liberté totale, itinéraires panoramiques',
        transit: 'Transport: bus/train — limiter aux endroits accessibles en transport en commun',
        bike: 'Transport: vélo/cyclotourisme — sentiers cyclables, Véloroute, distances raisonnables',
      };
      const foodPrefs = Array.isArray(quiz_context.food) ? quiz_context.food : [];
      const foodMap: Record<string, string> = {
        terroir: 'fromageries, produits locaux, fermes',
        wine: 'vignobles, route des vins, dégustations',
        micro: 'microbrasseries artisanales',
        'fine-dining': 'restaurants gastronomiques, chefs réputés',
        'sugar-shack': 'cabane à sucre, érable, tradition',
        seafood: 'fruits de mer, poissonneries, homard',
        cafe: 'cafés de spécialité, brunchs instagrammables',
        'street-food': 'street food, cantines, poutine, guédilles',
        market: 'marchés publics, cueillette, producteurs',
        all: 'ouvert à tout type de cuisine',
      };

      quizContextStr = `\n\n══ PROFIL DÉTAILLÉ DU VOYAGEUR (quiz personnalisé) ══
ADAPTE ABSOLUMENT l'itinéraire à ce profil. C'est la donnée LA PLUS IMPORTANTE.

👥 GROUPE: ${groupMap[quiz_context.group] || quiz_context.group || 'non spécifié'}
✨ VIBE: ${vibeMap[quiz_context.vibe] || quiz_context.vibe || 'non spécifié'}
🎯 INTÉRÊTS: ${Array.isArray(quiz_context.interests) ? quiz_context.interests.join(', ') : 'non spécifié'}
⚡ ÉNERGIE: ${energyMap[quiz_context.energy] || quiz_context.energy || 'non spécifié'}
🗓️ SAISON: ${quiz_context.season || 'non spécifié'}
🍴 BOUFFE: ${foodPrefs.length > 0 ? foodPrefs.map((f: string) => foodMap[f] || f).join(' + ') : 'non spécifié'}
🏨 HÉBERGEMENT: ${accoMap[quiz_context.accommodation] || quiz_context.accommodation || 'non spécifié'}
🚗 TRANSPORT: ${transportMap[quiz_context.transport] || quiz_context.transport || 'non spécifié'}
${quiz_context.special ? `💬 SOUHAIT SPÉCIAL: "${quiz_context.special}" — INTÈGRE ABSOLUMENT ce souhait dans l'itinéraire!` : ''}

RÈGLES D'ADAPTATION AU PROFIL:
- Si énergie = tranquille: max 1 activité structurée le matin + 1 l'après-midi. Laisser du temps libre.
- Si énergie = intense: remplir chaque créneau, proposer des alternatives si un lieu ferme tôt.
- Si couple: au moins 1 activité romantique par jour (spa, belvédère au coucher du soleil, restaurant intime).
- Si famille: alterner activités éducatives et fun. Prévoir pauses. Restos avec menu enfant.
- Si intérêt "food": proposer les MEILLEURS restaurants de la base de données, avec must_try détaillé.
- Si intérêt "nature": prioriser les parcs nationaux SEPAQ et les randonnées.
- Si intérêt "art": inclure galeries, ateliers créatifs, street art.
- Adapter les horaires: si chill = début journée à 9h30+. Si intense = début à 7h30-8h.`
    }

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
JOURS DE REPOS : ${rest_days}${quizContextStr}${localDataPrompt}

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
        "from": "Lieu matin",
        "to": "Resto lunch",
        "mode": "🚶 À pied",
        "duration": "8 min",
        "distance": "650m",
        "directions": "Directions précises"
      },
      "lunch": {
        "name": "Nom du restaurant",
        "type": "Type de cuisine",
        "location": "Adresse",
        "cost": 0,
        "rating": "4.3★",
        "must_try": "Plat à commander"
      },
      "getting_to_afternoon": {
        "from": "Resto",
        "to": "Activité PM",
        "mode": "🚗 Auto",
        "duration": "12 min",
        "distance": "2km",
        "directions": "Directions"
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
        "from": "Activité PM",
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
        "mode": "🚗 Auto",
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
        max_tokens: 16384,
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
      guide = repairJSON(rawText);
      if (!guide || !guide.days || !Array.isArray(guide.days)) {
        throw new Error('Invalid guide structure: missing days array');
      }
    } catch (parseErr: any) {
      console.error('JSON parse error:', parseErr.message);
      return NextResponse.json({ error: 'Erreur de format. Réessaie!' }, { status: 500 });
    }

    // ──══════════════════════════════════════
    // Save guide + cache for Québec
    // ──══════════════════════════════════════

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

    // Cache Québec guides for future users
    if (isQC) {
      const cacheKey = buildCacheKey(destination, budget_style, nights, preferences);
      await supabase
        .from('qc_guide_cache')
        .upsert({
          cache_key: cacheKey,
          region: destination,
          budget_style,
          trip_days: nights,
          preferences,
          guide_data: guide,
          hit_count: 0,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'cache_key' });

      console.log(`Cache STORED for ${destination} (key: ${cacheKey})`);
    }

    return NextResponse.json({
      guide,
      guide_id: savedGuide?.id || null,
      guide_count: guideCount + 1,
      is_premium: true,
      tokens_used: (anthropicData.usage?.input_tokens || 0) + (anthropicData.usage?.output_tokens || 0),
      cached: false,
    });

  } catch (err: any) {
    console.error('Guide generation error:', err);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}
