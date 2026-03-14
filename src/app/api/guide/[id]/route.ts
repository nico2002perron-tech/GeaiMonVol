import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('ai_guides')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Guide introuvable.' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Guide detail error:', err);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}
