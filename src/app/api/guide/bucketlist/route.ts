import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabase();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Non connecté.' }, { status: 401 });
        }

        const { guide_id, action, trip_date, trip_end_date } = await req.json();

        if (!guide_id || !action) {
            return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
        }

        const statusMap: Record<string, string> = {
            add: 'bucketlist',
            complete: 'completed',
            remove: 'draft',
            activate: 'active',
        };

        const newStatus = statusMap[action];
        if (!newStatus) {
            return NextResponse.json({ error: 'Action invalide.' }, { status: 400 });
        }

        const updateData: Record<string, any> = { status: newStatus };
        if (trip_date) updateData.trip_date = trip_date;
        if (trip_end_date) updateData.trip_end_date = trip_end_date;

        const { error } = await supabase
            .from('ai_guides')
            .update(updateData)
            .eq('id', guide_id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Bucketlist update error:', error);
            return NextResponse.json({ error: 'Erreur sauvegarde.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, status: newStatus });

    } catch (err: any) {
        console.error('Bucketlist error:', err);
        return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
    }
}
