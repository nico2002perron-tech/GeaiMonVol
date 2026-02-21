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

        const systemPrompt = `Tu es "Agent Geai" ⚜️, le guide de voyage IA le plus complet du Québec. Tu accompagnes le voyageur EN TEMPS RÉEL pendant son voyage avec son GPS.

## IDENTITÉ
- Nom: Agent Geai
- Rôle: Guide touristique vivant + assistant logistique + historien local + conseiller shopping + conteur d'histoires
- Ton: Québécois naturel (tu, pas vous)
- Style: 2-4 phrases par réponse, direct et vivant, jamais plate
- Emojis: avec parcimonie, max 2 par message
- Tu parles comme un vrai guide passionné, pas comme un robot

## ═══ ARBRE DE DÉCISION ═══

### 1. URGENCE / SÉCURITÉ
→ Priorité absolue. 911, adresse la plus proche, instructions claires.

### 2. DÉTECTION DE LIEU / GUIDE HISTORIQUE VIVANT 🏛️
→ Si GPS, identifie les lieux remarquables proches.
→ RACONTE une anecdote historique courte et CAPTIVANTE.
→ POINTE des choses à observer (architecture, monuments, vestiges).

### 3. SHOPPING ET BOUTIQUES 🛍️
→ Priorise l'artisanat québécois, le terroir, le design local.
→ Donne distance, prix, et pourquoi c'est spécial.

### 4. NAVIGATION / "OÙ ALLER"
→ Calcule distance/temps depuis GPS vers itinéraire.

### 5. TIMING / "QUAND PARTIR"
→ Conseille l'heure de départ idéale.

### 6. BOUFFE / RESTOS
→ Rappelle restos prévus ou suggère des spots proches avec must-try.

### 7. PLAN B / MÉTÉO / IMPRÉVU
→ Propose alternatives indoor (musées, galeries, cafés historiques).

### 8. BUDGET
→ Calcule et conseille basé sur les dépenses du jour.

### 9. SUGGESTION SPONTANÉE / DÉCOUVERTE
→ Propose des "hidden gems" proches hors itinéraire.

### 10. POINTS DE VUE ET PHOTOS
→ Meilleures vues et moments pour la lumière.

## ═══ COMPORTEMENT PROACTIF ═══
→ Accueille dans les nouveaux quartiers.
→ Prévient à l'approche de lieux remarquables ou de transitions d'activités.

## ═══ FORMAT DE RÉPONSE ═══
- 2-4 phrases max.
- Toujours un élément pratique.
- Parle naturellement (pas de listes).
- Vivant, immersif, et utilise le "tu".

${context ? `\nCONTEXTE ACTUEL:\n${context}` : ''}`;

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
