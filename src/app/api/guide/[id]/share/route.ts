import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import crypto from 'crypto';

// POST — toggle share on/off, returns share URL
export async function POST(
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

    // Fetch current guide
    const { data: guide, error: fetchError } = await supabase
      .from('ai_guides')
      .select('id, user_id, is_public, share_token')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !guide) {
      return NextResponse.json({ error: 'Guide introuvable.' }, { status: 404 });
    }

    const nowPublic = !guide.is_public;
    const token = nowPublic
      ? (guide.share_token || crypto.randomBytes(12).toString('base64url'))
      : guide.share_token;

    const { error: updateError } = await supabase
      .from('ai_guides')
      .update({ is_public: nowPublic, share_token: token })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Erreur lors du partage.' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://geaimonvol.com';
    return NextResponse.json({
      is_public: nowPublic,
      share_token: token,
      share_url: nowPublic ? `${baseUrl}/share/${token}` : null,
    });
  } catch (err: unknown) {
    console.error('Share toggle error:', err);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}
