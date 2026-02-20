import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabase();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Connecte-toi.' }, { status: 401 });
        }

        const body = await req.json();
        const {
            guide_id, destination, country,
            day_number, slot, reason,
            original_activity, budget_style
        } = body;

        if (!guide_id || !original_activity) {
            return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 });
        }

        const reasonMap: Record<string, string> = {
            trop_cher: 'C''est trop cher pour mon budget.',
            pas_genre: 'Ce n''est pas mon genre d''activité.',
            deja_fait: 'J''ai déjà fait cette activité.',
            access: 'Ce n''est pas assez accessible.',
            intense: 'Je veux quelque chose de plus intense/actif.',
            calme: 'Je veux quelque chose de plus calme/relaxant.',
        };

        const systemPrompt = `Tu es un expert en voyage qui propose des alternatives d'activités.
Tu réponds en français québécois naturel.
Réponds UNIQUEMENT en JSON valide.`;

        const userPrompt = `L'utilisateur veut remplacer une activité dans son itinéraire à ${destination}, ${country || ''}.

ACTIVITÉ ORIGINALE :
${JSON.stringify(original_activity, null, 2)}

RAISON DU CHANGEMENT : ${reasonMap[reason] || reason}
STYLE DE BUDGET : ${budget_style}

Propose 3 ALTERNATIVES différentes et pertinentes.
Réponds avec cette structure JSON :
{
  "alternatives": [
    {
      "activity": "Nom",
      "location": "Lieu précis",
      "description": "1 phrase",
      "duration": "1-2h",
      "cost": 0,
      "tip": "Astuce",
      "rating": "4.5★",
      "why": "Pourquoi c'est une bonne alternative"
    }
  ]
}`;

        const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY!,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 1500,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
            }),
        });

        if (!anthropicResponse.ok) throw new Error('AI Error');

        const anthropicData = await anthropicResponse.json();
        const alternatives = JSON.parse(anthropicData.content?.[0]?.text || '{}').alternatives;

        // Log the swap request
        await supabase.from('ai_guide_feedback').insert({
            user_id: user.id,
            guide_id,
            destination,
            day_number,
            slot,
            action: 'swap_request',
            swap_reason: reason,
            original_activity
        });

        return NextResponse.json({ alternatives });

    } catch (err) {
        console.error('Swap error:', err);
        return NextResponse.json({ error: 'Erreur lors de la recherche d''alternatives.' }, { status: 500 });
    }
}
