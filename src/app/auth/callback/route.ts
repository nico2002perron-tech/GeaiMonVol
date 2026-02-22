import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const supabase = await createServerSupabase();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            // Check if questionnaire is completed
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('questionnaire_completed')
                    .eq('id', user.id)
                    .single();

                if (profile && !profile.questionnaire_completed) {
                    return NextResponse.redirect(`${origin}/onboarding`);
                }
            }
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    return NextResponse.redirect(`${origin}/auth?error=auth_failed`);
}
