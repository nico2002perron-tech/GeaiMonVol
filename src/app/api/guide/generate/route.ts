import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabase();

        // ── Auth check ──
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Connecte-toi pour générer un guide.' }, { status: 401 });
        }

        // ── Check plan + guide usage ──
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .single();

        const isPremium = profile?.plan === 'premium';

        // Count guides already generated
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

        // ── Parse request body ──
        const body = await req.json();
        const {
            destination,
            destination_code,
            country,
            departure_date,
            return_date,
            price,
            airline,
            stops,
            preferences = [],
            trip_days,
            rest_days = 1,
            budget_style = 'moderate', // 'budget', 'moderate', 'luxury'
        } = body;

        if (!destination) {
            return NextResponse.json({ error: 'Destination requise.' }, { status: 400 });
        }

        // Calculate nights
        let nights = trip_days || 7;
        if (departure_date && return_date) {
            nights = Math.round(
                (new Date(return_date).getTime() - new Date(departure_date).getTime()) / (1000 * 60 * 60 * 24)
            );
        }

        // ── Build prompt ──
        const prefsText = preferences.length > 0
            ? preferences.join(', ')
            : 'culture, gastronomie, nature';

        const budgetMap: Record<string, string> = {
            budget: 'économique (hostels, street food, transports en commun)',
            moderate: 'modéré (hôtels 3★, restaurants locaux, mix transports)',
            luxury: 'haut de gamme (hôtels 4-5★, restaurants gastronomiques, taxis/privé)',
        };

        const systemPrompt = `Tu es un expert en voyage qui crée des itinéraires personnalisés exceptionnels. 
Tu écris en français québécois naturel (pas de "vous" formel, utilise "tu").
Tes guides sont pratiques, précis, et incluent des tips d'initié que les touristes ne connaissent pas.
Tu donnes des estimations de prix en CAD.
Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks.`;

        const userPrompt = `Crée un itinéraire de voyage complet pour :

DESTINATION : ${destination}, ${country || ''}
VOL : Montréal (YUL) → ${destination_code || destination} | ${airline || 'Non spécifié'} | ${stops === 0 ? 'Direct' : stops + ' escale(s)'}
DATES : ${departure_date || 'Flexible'} → ${return_date || 'Flexible'} (${nights} nuits)
PRIX VOL : ${price || 'Non spécifié'}$ CAD aller-retour
BUDGET : ${budgetMap[budget_style] || budgetMap.moderate}
PRÉFÉRENCES : ${prefsText}
JOURS DE REPOS : ${rest_days} jour(s) de détente prévus dans l'itinéraire

Réponds en JSON avec cette structure exacte :
{
  "title": "Titre accrocheur du voyage",
  "summary": "Résumé en 2-3 phrases du voyage",
  "highlights": ["3 à 5 points forts du voyage"],
  "budget_estimate": {
    "flight": ${price || 0},
    "accommodation_per_night": 0,
    "food_per_day": 0,
    "activities_total": 0,
    "transport_local": 0,
    "total_estimate": 0
  },
  "packing_tips": ["3-4 items essentiels à apporter"],
  "local_tips": ["3-4 astuces locales d'initié"],
  "days": [
    {
      "day": 1,
      "title": "Titre du jour",
      "theme": "emoji + thème court",
      "morning": {
        "activity": "Nom de l'activité",
        "description": "Description en 1-2 phrases",
        "tip": "Astuce pratique",
        "estimated_cost": "XX$ CAD"
      },
      "afternoon": {
        "activity": "...",
        "description": "...",
        "tip": "...",
        "estimated_cost": "XX$ CAD"
      },
      "evening": {
        "activity": "...",
        "description": "...",
        "tip": "...",
        "estimated_cost": "XX$ CAD"
      },
      "restaurant": {
        "name": "Nom du restaurant recommandé",
        "type": "Type de cuisine",
        "price_range": "$$",
        "tip": "Ce qu'il faut commander"
      }
    }
  ]
}

Génère exactement ${nights} jours. Pour les jours de repos (${rest_days}), propose des activités relaxantes.
Assure-toi que le JSON est valide et complet.`;

        // ── Call Anthropic API (Haiku) ──
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
                max_tokens: 4096,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: userPrompt },
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

        // ── Parse JSON response ──
        let guide;
        try {
            // Clean up potential markdown fences
            const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            guide = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error('JSON parse error:', parseErr, 'Raw:', rawText.substring(0, 500));
            return NextResponse.json({ error: 'Erreur de format dans la réponse IA.' }, { status: 500 });
        }

        // ── Save to Supabase ──
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
                tokens_used: anthropicData.usage?.input_tokens + anthropicData.usage?.output_tokens || 0,
            })
            .select('id')
            .single();

        if (saveError) {
            console.error('Save error:', saveError);
            // Still return the guide even if save fails
        }

        return NextResponse.json({
            guide,
            guide_id: savedGuide?.id || null,
            guide_count: guideCount + 1,
            is_premium: isPremium,
            tokens_used: anthropicData.usage?.input_tokens + anthropicData.usage?.output_tokens || 0,
        });

    } catch (err: any) {
        console.error('Guide generation error:', err);
        return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
    }
}
