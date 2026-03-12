import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, subscription_status, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profil non trouvé.' }, { status: 404 });
    }

    let currentPeriodEnd: string | null = null;

    // Fetch subscription details from Stripe if premium
    if (profile.stripe_customer_id && profile.plan === 'premium') {
      try {
        const stripe = getStripe();
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'active',
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          currentPeriodEnd = new Date(
            subscriptions.data[0].current_period_end * 1000
          ).toISOString();
        }
      } catch {
        // Non-blocking: continue without period info
      }
    }

    return NextResponse.json({
      plan: profile.plan,
      subscription_status: profile.subscription_status,
      current_period_end: currentPeriodEnd,
    });
  } catch (err: any) {
    console.error('Subscription GET error:', err);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'Aucun abonnement trouvé.' }, { status: 400 });
    }

    const stripe = getStripe();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl}/pricing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error('Billing portal error:', err);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}
