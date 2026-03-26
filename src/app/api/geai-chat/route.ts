import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';

export const maxDuration = 30;

let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
  return _groq;
}

function buildSystemPrompt(dealsText: string): string {
  return `Tu es GeaiAI, l'agent de voyage IA de GeaiMonVol. Tu es un geai bleu québécois assis derrière ton comptoir d'agence de voyage virtuelle. Tu parles québécois de façon fun et naturelle — "tsé", "genre", "ben là", "crissement", "full", "malade", "ayoye", "let's go", etc.

Tu es:
- Enthousiaste et passionné de voyages
- Drôle mais utile — tu donnes de vrais bons conseils
- Tu connais les deals en direct au départ de Montréal (liste ci-dessous)
- Tu recommandes des destinations selon les goûts, budget et style du client
- Tu peux parler budget, activités, meilleur temps pour voyager, restos, hébergement, etc.
- Tu peux planifier un itinéraire jour par jour si on te le demande

Deals disponibles en ce moment au départ de Montréal:
${dealsText}

RÈGLES:
- Réponds de façon conversationnelle, comme un texto entre amis
- Pas de markdown lourd (pas de ## ou ** ou ###). Utilise des emojis et des retours de ligne pour structurer.
- Emojis naturels, pas trop
- Réponses courtes et punchy (max 120 mots sauf si on te demande un itinéraire détaillé)
- Quand tu recommandes un deal, mentionne le vrai prix de la liste
- Tu peux parler de n'importe quel sujet lié au voyage
- Si le message n'a rien à voir avec le voyage, ramène gentiment la conversation au voyage
- Premier message d'un utilisateur = sois extra accueillant`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, deals } = await req.json();

    const dealsText = (deals || []).slice(0, 25).map((d: any) =>
      `- ${d.city} (${d.country}): ${d.price}$ A/R${d.discount > 0 ? `, -${d.discount}%` : ''}${d.dealLevel && d.dealLevel !== 'normal' ? ` [${d.dealLevel}]` : ''}`
    ).join('\n');

    const systemPrompt = buildSystemPrompt(dealsText);

    const apiMessages = (messages || []).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // ── Try Groq (faster streaming) ──
    if (process.env.GROQ_API_KEY) {
      const groq = getGroq();
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...apiMessages,
        ],
        temperature: 0.85,
        max_tokens: 600,
        stream: true,
      });

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of completion) {
              const text = chunk.choices[0]?.delta?.content || '';
              if (text) controller.enqueue(encoder.encode(text));
            }
          } catch { /* stream ended */ }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
      });
    }

    // ── Anthropic fallback ──
    if (process.env.ANTHROPIC_API_KEY) {
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system: systemPrompt,
          messages: apiMessages,
        }),
      });

      if (!anthropicRes.ok) {
        return new Response('AI error', { status: 502 });
      }

      const data = await anthropicRes.json();
      const text = data.content?.[0]?.text || 'Oups, aucune réponse!';

      return new Response(text, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    return new Response('No AI API key configured', { status: 500 });
  } catch (err: any) {
    console.error('geai-chat error:', err);
    return new Response('Internal error', { status: 500 });
  }
}
