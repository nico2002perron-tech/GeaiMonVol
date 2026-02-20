import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabase();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Non connecté.' }, { status: 401 });
        }

        const body = await req.json();
        const { guide_id, destination, day_number, slot, action, rating, swap_reason, original_activity, replacement_activity } = body;

        const { error } = await supabase.from('guide_feedback').insert({
            user_id: user.id,
            guide_id: guide_id || null,
            destination: destination || null,
            day_number: day_number || null,
            slot: slot || null,
            action: action || 'rate',
            rating: rating || null,
            swap_reason: swap_reason || null,
            original_activity: original_activity || null,
            replacement_activity: replacement_activity || null,
        });

        if (error) {
            console.error('Feedback save error:', error);
            return NextResponse.json({ error: 'Erreur sauvegarde.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Feedback error:', err);
        return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
    }
}
