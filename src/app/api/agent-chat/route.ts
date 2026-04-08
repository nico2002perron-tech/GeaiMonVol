// ============================================
// GeaiAI Agent — Boucle Agentique (Agentic Loop)
// Utilise le Anthropic SDK avec tool_use
// ============================================
//
// Comment ça marche :
// 1. On envoie le message de l'utilisateur à Claude avec la liste des outils
// 2. Claude décide s'il a besoin d'un outil (tool_use) ou s'il répond directement (text)
// 3. Si tool_use → on exécute l'outil → on renvoie le résultat à Claude
// 4. On boucle jusqu'à ce que Claude donne une réponse finale en texte
// 5. On stream chaque étape au frontend via Server-Sent Events (SSE)
//

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AGENT_TOOLS } from '@/lib/agent/tools';
import { executeToolCall } from '@/lib/agent/handlers';
import { createServerSupabase } from '@/lib/supabase/server';

export const maxDuration = 60;

const SYSTEM_PROMPT = `Tu es GeaiAI, l'agent de voyage IA de GeaiMonVol. Tu es un geai bleu québécois — fun, enthousiaste, et expert en voyages au départ de Montréal.

PERSONNALITÉ:
- Tu parles québécois naturellement — "tsé", "genre", "ben là", "full", "malade", "let's go"
- Tu es enthousiaste mais pas excessif
- Tu donnes de vrais bons conseils de voyage
- Tu es honnête sur les prix et les conditions

CAPACITÉS (tes outils):
- Tu peux chercher les deals de vols en temps réel
- Tu peux chercher des vols vers une destination spécifique
- Tu peux consulter l'historique des prix pour donner un verdict
- Tu peux ajouter des destinations à la watchlist de l'utilisateur
- Tu peux obtenir des infos détaillées sur n'importe quelle destination

RÈGLES:
- Utilise tes outils pour donner des infos précises — ne fabrique JAMAIS de prix ou de données
- Quand on te demande un prix, utilise TOUJOURS l'outil chercher_deals ou chercher_vols
- Quand on te demande si c'est un bon prix, utilise TOUJOURS historique_prix
- Réponds de façon conversationnelle, comme un texto entre amis
- Pas de markdown lourd (pas de ## ou ** sauf pour mettre un prix en gras)
- Réponses concises sauf si on te demande un itinéraire détaillé
- Si tu utilises un outil, explique brièvement ce que tu fais
- Tous les prix sont en CAD (dollars canadiens)
- L'aéroport d'origine est toujours YUL (Montréal)`;

// Lazy singleton pour le client Anthropic
let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
  }
  return _anthropic;
}

export async function POST(req: NextRequest) {
  try {
    const { messages: chatHistory } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        formatSSE('error', { message: 'ANTHROPIC_API_KEY non configurée' }),
        { status: 500, headers: sseHeaders() },
      );
    }

    // Get user ID if authenticated (for watchlist)
    let userId: string | undefined;
    try {
      const supabase = await createServerSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch { /* not authenticated, that's ok */ }

    const anthropic = getAnthropic();

    // Convert chat history to Anthropic format
    const apiMessages: Anthropic.MessageParam[] = (chatHistory || []).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // ── SSE Stream ──
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await agenticLoop(anthropic, apiMessages, userId, (event, data) => {
            controller.enqueue(encoder.encode(formatSSE(event, data)));
          });
        } catch (err: any) {
          controller.enqueue(
            encoder.encode(formatSSE('error', { message: err.message || 'Erreur interne' })),
          );
        }
        controller.enqueue(encoder.encode(formatSSE('done', {})));
        controller.close();
      },
    });

    return new Response(stream, { headers: sseHeaders() });
  } catch (err: any) {
    console.error('agent-chat error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

// ════════════════════════════════════════
// Boucle agentique — le coeur de l'agent
// ════════════════════════════════════════
async function agenticLoop(
  anthropic: Anthropic,
  messages: Anthropic.MessageParam[],
  userId: string | undefined,
  emit: (event: string, data: any) => void,
) {
  const MAX_ITERATIONS = 5; // Sécurité: max 5 appels d'outils par requête

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // Appel à Claude avec les outils
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      tools: AGENT_TOOLS,
      messages,
    });

    // Parcourir les blocs de la réponse
    let hasToolUse = false;
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        // Claude répond en texte — on stream au frontend
        emit('text', { content: block.text });
      } else if (block.type === 'tool_use') {
        hasToolUse = true;

        // Informer le frontend qu'un outil est en cours
        emit('tool_call', {
          tool: block.name,
          input: block.input,
          id: block.id,
        });

        // Exécuter l'outil
        const result = await executeToolCall(
          block.name,
          block.input as Record<string, any>,
          userId,
        );

        // Informer le frontend du résultat
        emit('tool_result', {
          tool: block.name,
          id: block.id,
          result: JSON.parse(result),
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result,
        });
      }
    }

    // Si Claude a utilisé des outils, on ajoute sa réponse + les résultats
    // puis on reboucle pour qu'il génère sa réponse finale
    if (hasToolUse) {
      messages = [
        ...messages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ];
      continue; // ← Reboucler!
    }

    // Pas de tool_use = réponse finale, on sort de la boucle
    break;
  }
}

// ── Helpers SSE ──
function formatSSE(event: string, data: any): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  };
}
