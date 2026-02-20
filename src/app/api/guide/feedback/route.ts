import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabase();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Connecte-toi.' }, { status: 401 });
        }

        const body = await req.json();
        const {
            guide_id, destination, day_number,
            slot, action, rating,
            swap_reason, original_activity, replacement_activity
        } = body;

        if (!guide_id || !action) {
            return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 });
        }

        const { error: insertError } = await supabase.from('ai_guide_feedback').insert({
            user_id: user.id,
            guide_id,
            destination,
            day_number,
            slot,
            action,
            rating,
            swap_reason,
            original_activity,
            replacement_activity
        });

        if (insertError) throw insertError;

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('Feedback error:', err);
        return NextResponse.json({ error: 'Erreur lors de l''enregistrement du feedback.' }, { status: 500 });
    }
}
