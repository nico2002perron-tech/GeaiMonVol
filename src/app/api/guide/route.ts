import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('ai_guides')
      .select('id, destination, destination_code, country, departure_date, return_date, flight_price, budget_style, guide_data, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const guides = (data || []).map(g => ({
      id: g.id,
      destination: g.destination,
      destination_code: g.destination_code,
      country: g.country,
      departure_date: g.departure_date,
      return_date: g.return_date,
      flight_price: g.flight_price,
      budget_style: g.budget_style,
      title: g.guide_data?.title || g.destination,
      summary: g.guide_data?.summary || '',
      days_count: g.guide_data?.days?.length || 0,
      total_budget: g.guide_data?.budget_summary?.total_per_person || null,
      has_premium: !!(g.guide_data?.insider_tips || g.guide_data?.hidden_gems),
      highlights: g.guide_data?.highlights || [],
      created_at: g.created_at,
    }));

    return NextResponse.json(guides);
  } catch (err: unknown) {
    console.error('Guide list error:', err);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}
