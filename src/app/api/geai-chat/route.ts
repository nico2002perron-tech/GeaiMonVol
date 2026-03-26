import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';

export const maxDuration = 30;

let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
  return _groq;
}

function buildSystemPrompt(dealsText: string, answersText: string): string {
  return `Tu es GeaiAI, le mascotte de GeaiMonVol — un geai bleu québécois hilarant qui aide les gens à trouver leur voyage de rêve. Tu parles québécois de façon fun et décontractée. Tu utilises du slang naturel: "crissement", "ben là", "tsé", "genre", "capoter", "full", "malade", "ayoye", "let's go", etc. Tu es enthousiaste, drôle, authentique.

Basé sur les réponses du quiz, génère un PROFIL VOYAGEUR unique:

1. Commence par un emoji + nom du profil créatif et drôle (ex: "🏖️ Le Beach Bum Assumé", "🏛️ L'Urbain(e) Caféiné(e)", "🧗 Le/La Téméraire", etc)
2. Description du profil: 2-3 phrases drôles et personnalisées
3. "Mes picks pour toi:" puis tes 3 MEILLEURES recommandations parmi les deals. Pour chaque destination: le nom, le prix, et 1 phrase punchy
4. Termine par une phrase motivante qui donne envie de planifier

Deals disponibles au départ de Montréal:
${dealsText}

Réponses du quiz:
${answersText}

IMPORTANT: Écris comme un texto entre amis. Pas de markdown lourd (pas de ## ou **). Conversationnel et naturel. Emojis naturels. Maximum 180 mots.`;
}

export async function POST(req: NextRequest) {
  try {
    const { answers, deals } = await req.json();

    const dealsText = (deals || []).slice(0, 15).map((d: any) =>
      `- ${d.city} (${d.country}): ${d.price}$ A/R${d.discount > 0 ? `, -${d.discount}%` : ''}${d.dealLevel && d.dealLevel !== 'normal' ? ` [${d.dealLevel}]` : ''}`
    ).join('\n');

    const answersText = (answers || []).map((a: any) => `- ${a.q}: ${a.a}`).join('\n');
    const systemPrompt = buildSystemPrompt(dealsText, answersText);

    // ── Try Groq (faster streaming) ──
    if (process.env.GROQ_API_KEY) {
      const groq = getGroq();
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Donne-moi mon profil voyageur et mes recommandations!' },
        ],
        temperature: 0.9,
        max_tokens: 400,
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
          max_tokens: 400,
          system: systemPrompt,
          messages: [{ role: 'user', content: 'Donne-moi mon profil voyageur et mes recommandations!' }],
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
