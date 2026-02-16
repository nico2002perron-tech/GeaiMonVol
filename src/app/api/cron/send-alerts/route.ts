import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { sendDealAlert } from '@/lib/services/email';

export const maxDuration = 60;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = await createServerSupabase();
        const { data: users } = await supabase.from('profiles').select('*').eq('email_notifications', true);

        // Simple logic for testing
        return NextResponse.json({ message: 'Alerts processed', usersProcessed: users?.length || 0 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
