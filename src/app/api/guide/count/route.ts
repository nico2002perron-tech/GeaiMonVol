import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const { count } = await supabase
      .from('ai_guides')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    return NextResponse.json({ count: count || 0 });
  } catch (err: any) {
    console.error('Guide count error:', err);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}
