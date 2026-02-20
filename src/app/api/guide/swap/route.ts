import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabase();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Non connecté.' }, { status: 401 });
        }

        const body = await req.json();
        const {
            guide_id, destination, country, day_number, slot,
            reason, original_activity, budget_style = 'moderate',
        } = body;

        if (!destination || !slot || !reason) {
            return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
        }

        const reasonLabels: Record<string, string> = {
            trop_cher: "L'utilisateur trouve ça trop cher. Propose 3 alternatives MOINS chères.",
            pas_genre: "L'utilisateur n'aime pas ce type d'activité. Propose 3 alternatives complètement DIFFÉRENTES.",
            deja_fait: "L'utilisateur a déjà fait cette activité. Propose 3 alternatives NOUVELLES dans le même quartier.",
            access: "L'utilisateur a des problèmes d'accessibilité. Propose 3 alternatives ACCESSIBLES (pas d'escaliers, terrain plat).",
            intense: "L'utilisateur veut quelque chose de PLUS INTENSE et aventureux.",
            calme: "L'utilisateur veut quelque chose de PLUS CALME et relaxant.",
        };

        const slotLabel = slot === 'morning' ? 'activité du matin'
            : slot === 'lunch' ? 'restaurant du midi'
                : slot === 'afternoon' ? 'activité de l\'après-midi'
                    : slot === 'dinner' ? 'restaurant du souper'
                        : 'activité de la soirée';

        const isRestaurant = slot === 'lunch' || slot === 'dinner';

        const systemPrompt = `Tu es un expert en voyage. Tu proposes des alternatives précises avec de VRAIS noms de lieux.
Tu écris en français québécois (utilise "tu"). Prix en CAD.
RÈGLE ABSOLUE : Réponds UNIQUEMENT en JSON valide. Aucun texte avant ou après.`;

        const jsonTemplate = isRestaurant
            ? `[
  { "name": "Nom resto", "type": "Type cuisine", "location": "Adresse", "cost": 0, "rating": "4.3★", "must_try": "Plat à essayer", "why": "Pourquoi c'est mieux" },
  { "name": "...", "type": "...", "location": "...", "cost": 0, "rating": "...", "must_try": "...", "why": "..." },
  { "name": "...", "type": "...", "location": "...", "cost": 0, "rating": "...", "must_try": "...", "why": "..." }
]`
            : `[
  { "activity": "Nom activité", "location": "Adresse/lieu", "description": "1-2 phrases", "duration": "2h", "cost": 0, "tip": "Astuce", "rating": "4.5★", "why": "Pourquoi c'est mieux" },
  { "activity": "...", "location": "...", "description": "...", "duration": "...", "cost": 0, "tip": "...", "rating": "...", "why": "..." },
  { "activity": "...", "location": "...", "description": "...", "duration": "...", "cost": 0, "tip": "...", "rating": "...", "why": "..." }
]`;

        const userPrompt = `L'utilisateur visite ${destination}, ${country || ''} (budget: ${budget_style}).
Il veut changer son ${slotLabel} du jour ${day_number}.

ACTIVITÉ ACTUELLE : ${JSON.stringify(original_activity)}

RAISON DU CHANGEMENT : ${reasonLabels[reason] || 'Propose 3 alternatives différentes.'}

Propose exactement 3 alternatives en JSON. Structure :
${jsonTemplate}`;

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
                max_tokens: 2048,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: userPrompt },
                    { role: 'assistant', content: '[' },
                ],
            }),
        });

        if (!anthropicResponse.ok) {
            const errText = await anthropicResponse.text();
            console.error('Swap API error:', errText);
            return NextResponse.json({ error: 'Erreur lors de la génération.' }, { status: 500 });
        }

        const data = await anthropicResponse.json();
        const rawText = data.content?.[0]?.text || '';

        let alternatives;
        try {
            let jsonStr = '[' + rawText;
            jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const firstBracket = jsonStr.indexOf('[');
            const lastBracket = jsonStr.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1) {
                jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
            }
            alternatives = JSON.parse(jsonStr);
        } catch {
            console.error('Swap parse error, raw:', ('[' + rawText).substring(0, 800));
            return NextResponse.json({ error: 'Erreur de format. Réessaie!' }, { status: 500 });
        }

        // Save the swap request as feedback data
        await supabase.from('guide_feedback').insert({
            user_id: user.id,
            guide_id: guide_id || null,
            destination,
            day_number,
            slot,
            action: 'swap',
            swap_reason: reason,
            original_activity: original_activity,
            replacement_activity: null, // Will be updated when user picks one
        }).then(({ error }) => { if (error) console.error('Feedback save error:', error); });

        return NextResponse.json({ alternatives });

    } catch (err: any) {
        console.error('Swap error:', err);
        return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
    }
}
