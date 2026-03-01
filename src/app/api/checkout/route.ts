import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerSupabase } from '@/lib/supabase/server';
import { STRIPE_PLANS, type PlanKey } from '@/lib/stripe-config';

export async function POST(req: NextRequest) {
    try {
        const { plan } = (await req.json()) as { plan: PlanKey };

        if (!plan || !STRIPE_PLANS[plan]) {
            return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
        }

        const config = STRIPE_PLANS[plan];

        if (!config.priceId) {
            return NextResponse.json(
                { error: 'Stripe price ID non configuré pour ce plan' },
                { status: 500 }
            );
        }

        // Get current user
        const supabase = await createServerSupabase();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';

        const session = await stripe.checkout.sessions.create({
            mode: config.mode,
            line_items: [{ price: config.priceId, quantity: 1 }],
            success_url: `${origin}/pricing?success=true`,
            cancel_url: `${origin}/pricing?canceled=true`,
            customer_email: user.email,
            metadata: {
                supabase_user_id: user.id,
                plan,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('[checkout] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
