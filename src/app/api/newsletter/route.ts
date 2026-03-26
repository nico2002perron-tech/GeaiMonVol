import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
        }

        const supabase = await createServerSupabase();

        // Try inserting into newsletter_subscribers table
        // If the table doesn't exist yet, we handle gracefully
        const { error } = await supabase
            .from('newsletter_subscribers')
            .upsert({ email }, { onConflict: 'email' });

        if (error) {
            // Table might not exist yet — log but don't fail
            console.warn('Newsletter insert warning:', error.message);
        }

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: true }); // Don't fail the UX
    }
}
