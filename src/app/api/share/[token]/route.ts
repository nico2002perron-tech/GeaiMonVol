import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

// GET — fetch a public shared guide by token (no auth required)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from('ai_guides')
      .select('id, destination, country, departure_date, return_date, flight_price, budget_style, guide_data, created_at')
      .eq('share_token', token)
      .eq('is_public', true)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Guide introuvable ou non partagé.' }, { status: 404 });
    }

    // Strip premium-only fields for public view
    if (data.guide_data) {
      const gd = data.guide_data as Record<string, unknown>;
      delete gd.insider_tips;
      delete gd.hidden_gems;
      delete gd.promo_codes;
      if (Array.isArray(gd.days)) {
        for (const day of gd.days as Record<string, unknown>[]) {
          delete day.rainy_plan;
        }
      }
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Public share error:', err);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}
