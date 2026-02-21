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
        const { message, context, guide_id, destination, conversation = [] } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message requis.' }, { status: 400 });
        }

        const systemPrompt = `Tu es "Agent Geai" ⚜️, un assistant de voyage IA en temps réel pour le Québec.

PERSONNALITÉ:
- Tu parles en français québécois naturel (tu, pas vous)
- Tu es enthousiaste mais concis — max 2-3 phrases par réponse
- Tu connais le Québec comme le fond de ta poche
- Tu donnes des conseils pratiques et précis
- Tu utilises des emojis avec parcimonie pour garder ça vivant

TON RÔLE:
- Tu accompagnes le voyageur EN TEMPS RÉEL pendant son voyage
- Tu connais son itinéraire complet (fourni dans le contexte)
- Tu sais où il est (GPS) et quelle heure il est
- Tu lui dis quand partir pour sa prochaine activité
- Tu suggères des alternatives si quelque chose ne marche pas
- Tu recommandes des spots proches de sa position
- Tu gères son budget et le préviens s'il dépense trop

RÈGLES:
- Réponds en 2-3 phrases max, sois direct et utile
- Si l'utilisateur demande des directions, donne des indications claires
- Si tu ne connais pas un endroit précis, dis-le honnêtement
- Utilise le contexte fourni pour personnaliser tes réponses
- Si l'utilisateur est proche de sa prochaine activité, mentionne-le
- Pense à mentionner les tips et must_try du guide quand c'est pertinent

${context ? `\n${context}` : ''}`;

        // Build messages array with conversation history
        const msgs: { role: string; content: string }[] = [];

        // Add recent conversation for continuity (max 8 messages)
        conversation.slice(-8).forEach((m: { role: string; content: string }) => {
            msgs.push({ role: m.role, content: m.content });
        });

        // Add current message
        msgs.push({ role: 'user', content: message });

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
                max_tokens: 512,
                system: systemPrompt,
                messages: msgs,
            }),
        });

        if (!anthropicResponse.ok) {
            const errText = await anthropicResponse.text();
            console.error('Agent API error:', errText);
            return NextResponse.json({ error: 'Erreur IA.' }, { status: 500 });
        }

        const data = await anthropicResponse.json();
        const reply = data.content?.[0]?.text || "Désolé, j'ai eu un bug. Réessaie!";

        // Log agent interaction for analytics
        await supabase.from('guide_feedback').insert({
            user_id: user.id,
            guide_id: guide_id || null,
            destination: destination || null,
            action: 'agent_chat',
            swap_reason: null,
            original_activity: { user_message: message },
            replacement_activity: { agent_reply: reply },
        }).then(({ error }) => { if (error) console.error('Agent log error:', error); });

        return NextResponse.json({ reply });

    } catch (err: any) {
        console.error('Agent error:', err);
        return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
    }
}
