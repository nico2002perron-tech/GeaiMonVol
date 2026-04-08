// ============================================
// GeaiAI Agent — Tool Handlers
// Exécute les outils et retourne les résultats
// ============================================

import { createServerSupabase } from '@/lib/supabase/server';
import { CONTINENT_COUNTRIES } from './tools';

// ── 1. Chercher deals ──
export async function handleChercherDeals(input: {
  budget_max?: number;
  continent?: string;
}): Promise<string> {
  try {
    const supabase = await createServerSupabase();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('price_history')
      .select('destination, destination_code, price, airline, stops, departure_date, return_date')
      .gte('scanned_at', thirtyDaysAgo)
      .neq('source', 'historical_seed')
      .lte('price', input.budget_max || 3000)
      .order('price', { ascending: true })
      .limit(100);

    if (error || !data?.length) {
      return JSON.stringify({ deals: [], message: 'Aucun deal trouvé en ce moment.' });
    }

    // Filter: future flights only, no explore/google_flights
    let filtered = data.filter((r: any) => {
      if (!r.departure_date || r.departure_date < today) return false;
      return true;
    });

    // Filter by continent if specified
    if (input.continent) {
      const countries = CONTINENT_COUNTRIES[input.continent.toLowerCase()] || [];
      if (countries.length > 0) {
        // We don't have country in price_history, so we'll keep all for now
        // The agent can filter in its response
      }
    }

    // Deduplicate: best price per destination
    const best: Record<string, any> = {};
    for (const row of filtered) {
      const key = row.destination_code || row.destination;
      if (!best[key] || row.price < best[key].price) {
        best[key] = row;
      }
    }

    const deals = Object.values(best)
      .sort((a: any, b: any) => a.price - b.price)
      .slice(0, 15)
      .map((d: any) => ({
        destination: d.destination,
        code: d.destination_code,
        prix: `${Math.round(d.price)}$ CAD`,
        compagnie: d.airline,
        escales: d.stops === 0 ? 'Direct' : `${d.stops} escale(s)`,
        depart: d.departure_date,
        retour: d.return_date,
      }));

    return JSON.stringify({
      nombre_deals: deals.length,
      budget_filtre: input.budget_max ? `${input.budget_max}$` : 'aucun',
      deals,
    });
  } catch (err: any) {
    return JSON.stringify({ error: 'Impossible de chercher les deals', detail: err.message });
  }
}

// ── 2. Chercher vols spécifiques ──
export async function handleChercherVols(input: {
  destination_code: string;
  destination_city: string;
}): Promise<string> {
  try {
    const supabase = await createServerSupabase();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const today = new Date().toISOString().split('T')[0];

    // Fetch from price_history for this destination
    const { data, error } = await supabase
      .from('price_history')
      .select('destination, destination_code, price, airline, stops, departure_date, return_date, source, raw_data')
      .or(`destination_code.eq.${input.destination_code},destination.ilike.%${input.destination_city}%`)
      .gte('scanned_at', thirtyDaysAgo)
      .neq('source', 'historical_seed')
      .order('price', { ascending: true })
      .limit(50);

    if (error || !data?.length) {
      return JSON.stringify({
        destination: input.destination_city,
        vols: [],
        message: `Aucun vol trouvé vers ${input.destination_city} dans les 30 derniers jours. Essaie la page /destination/${input.destination_code} pour une recherche en temps réel.`,
        lien_recherche: `https://www.skyscanner.ca/transport/flights/yul/${input.destination_code.toLowerCase()}/`,
      });
    }

    const futureFlights = data.filter((r: any) => !r.departure_date || r.departure_date >= today);

    const vols = futureFlights.slice(0, 10).map((d: any) => ({
      prix: `${Math.round(d.price)}$ CAD`,
      compagnie: d.airline,
      escales: d.stops === 0 ? 'Direct' : `${d.stops} escale(s)`,
      depart: d.departure_date,
      retour: d.return_date,
      lien: d.raw_data?.booking_link || `https://www.skyscanner.ca/transport/flights/yul/${input.destination_code.toLowerCase()}/`,
    }));

    const prices = futureFlights.map((d: any) => d.price);
    const minPrice = Math.min(...prices);
    const avgPrice = Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length);

    return JSON.stringify({
      destination: input.destination_city,
      code: input.destination_code,
      nombre_vols: vols.length,
      prix_minimum: `${Math.round(minPrice)}$ CAD`,
      prix_moyen: `${avgPrice}$ CAD`,
      vols,
      lien_skyscanner: `https://www.skyscanner.ca/transport/flights/yul/${input.destination_code.toLowerCase()}/`,
    });
  } catch (err: any) {
    return JSON.stringify({ error: 'Erreur de recherche', detail: err.message });
  }
}

// ── 3. Historique des prix ──
export async function handleHistoriquePrix(input: {
  destination: string;
  destination_code?: string;
}): Promise<string> {
  try {
    const supabase = await createServerSupabase();
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();

    let query = supabase
      .from('price_history')
      .select('price, scanned_at, airline')
      .gte('scanned_at', ninetyDaysAgo)
      .neq('source', 'historical_seed')
      .order('scanned_at', { ascending: false })
      .limit(200);

    if (input.destination_code) {
      query = query.eq('destination_code', input.destination_code);
    } else {
      query = query.ilike('destination', `%${input.destination}%`);
    }

    const { data, error } = await query;

    if (error || !data?.length) {
      return JSON.stringify({
        destination: input.destination,
        message: 'Aucun historique de prix trouvé pour cette destination.',
      });
    }

    const prices = data.map((d: any) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length);
    const median = prices.sort((a: number, b: number) => a - b)[Math.floor(prices.length / 2)];
    const current = prices[0]; // Most recent

    // Trend: compare last 30 vs previous 30
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const recent = data.filter((d: any) => new Date(d.scanned_at).getTime() > thirtyDaysAgo);
    const older = data.filter((d: any) => new Date(d.scanned_at).getTime() <= thirtyDaysAgo);

    let tendance = 'stable';
    if (recent.length > 0 && older.length > 0) {
      const avgRecent = recent.reduce((s: number, d: any) => s + d.price, 0) / recent.length;
      const avgOlder = older.reduce((s: number, d: any) => s + d.price, 0) / older.length;
      const diff = ((avgRecent - avgOlder) / avgOlder) * 100;
      if (diff < -5) tendance = 'en baisse';
      else if (diff > 5) tendance = 'en hausse';
    }

    return JSON.stringify({
      destination: input.destination,
      periode: '90 derniers jours',
      nombre_prix: data.length,
      prix_actuel: `${Math.round(current)}$ CAD`,
      prix_minimum: `${Math.round(min)}$ CAD`,
      prix_maximum: `${Math.round(max)}$ CAD`,
      prix_moyen: `${avg}$ CAD`,
      prix_median: `${Math.round(median)}$ CAD`,
      tendance,
      verdict: current <= avg ? 'BON PRIX — en dessous de la moyenne' : 'PRIX ÉLEVÉ — au-dessus de la moyenne',
    });
  } catch (err: any) {
    return JSON.stringify({ error: 'Erreur historique', detail: err.message });
  }
}

// ── 4. Ajouter watchlist ──
export async function handleAjouterWatchlist(
  input: { destination: string; target_price?: number },
  userId?: string,
): Promise<string> {
  if (!userId) {
    return JSON.stringify({
      success: false,
      message: "Tu dois être connecté pour ajouter une destination à ta watchlist. Connecte-toi sur /auth !",
    });
  }

  try {
    const supabase = await createServerSupabase();

    // Check if already in watchlist
    const { data: existing } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', userId)
      .ilike('destination', `%${input.destination}%`)
      .limit(1);

    if (existing && existing.length > 0) {
      return JSON.stringify({
        success: false,
        message: `${input.destination} est déjà dans ta watchlist!`,
      });
    }

    const { error } = await supabase.from('watchlist').insert({
      user_id: userId,
      destination: input.destination,
      target_price: input.target_price || null,
    });

    if (error) throw error;

    return JSON.stringify({
      success: true,
      message: `${input.destination} ajouté à ta watchlist! Tu recevras une alerte${input.target_price ? ` quand le prix descend sous ${input.target_price}$` : ' dès qu\'un bon deal apparaît'}.`,
    });
  } catch (err: any) {
    return JSON.stringify({ success: false, error: err.message });
  }
}

// ── 5. Info destination ──
export async function handleInfoDestination(input: {
  destination: string;
  mois?: string;
}): Promise<string> {
  try {
    // Use Groq for fast destination intelligence (same as travel-intel route)
    if (!process.env.GROQ_API_KEY) {
      return JSON.stringify({ error: 'Service d\'information non disponible' });
    }

    const { default: Groq } = await import('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `Donne-moi un résumé concis pour un voyageur québécois sur ${input.destination}${input.mois ? ` en ${input.mois}` : ''}.
Inclus: météo typique, budget quotidien estimé en CAD, top 3 activités, top 2 restos recommandés, conseil pratique #1, meilleur quartier où loger.
Format JSON avec les clés: meteo, budget_quotidien, activites (array), restos (array), conseil, quartier.
Réponds UNIQUEMENT en JSON valide, pas de texte autour.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 800,
    });

    const text = completion.choices[0]?.message?.content || '';

    // Try to parse JSON from the response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const info = JSON.parse(jsonMatch[0]);
        return JSON.stringify({
          destination: input.destination,
          mois: input.mois || 'général',
          ...info,
        });
      }
    } catch {
      // If JSON parsing fails, return raw text
    }

    return JSON.stringify({
      destination: input.destination,
      info: text,
    });
  } catch (err: any) {
    return JSON.stringify({ error: 'Impossible d\'obtenir les infos', detail: err.message });
  }
}

// ── Dispatcher ──
export async function executeToolCall(
  toolName: string,
  toolInput: Record<string, any>,
  userId?: string,
): Promise<string> {
  switch (toolName) {
    case 'chercher_deals':
      return handleChercherDeals(toolInput);
    case 'chercher_vols':
      return handleChercherVols(toolInput as any);
    case 'historique_prix':
      return handleHistoriquePrix(toolInput as any);
    case 'ajouter_watchlist':
      return handleAjouterWatchlist(toolInput as any, userId);
    case 'info_destination':
      return handleInfoDestination(toolInput as any);
    default:
      return JSON.stringify({ error: `Outil inconnu: ${toolName}` });
  }
}
